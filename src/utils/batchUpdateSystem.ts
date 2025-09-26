/**
 * Batch Update System
 * Phase 5: 배치 업데이트 시스템
 *
 * 주요 기능:
 * - 여러 업데이트를 하나의 트랜잭션으로 묶기
 * - 우선순위 기반 실행
 * - 자동 병합 알고리즘
 * - 충돌 감지 및 해결
 * - 네트워크 효율성 극대화
 */

import { abortControllerManager } from './memoryManager';
import { optimisticUpdateManager, UpdateType } from './optimisticUpdate';

/**
 * 배치 업데이트 타입
 */
export enum BatchUpdateType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  BULK = 'bulk'
}

/**
 * 배치 우선순위
 */
export enum BatchPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

/**
 * 배치 상태
 */
export enum BatchStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * 배치 작업 인터페이스
 */
export interface BatchOperation<T = any> {
  id: string;
  type: BatchUpdateType;
  entityType: string;
  entityId?: string;
  data: T;
  priority: BatchPriority;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * 배치 결과
 */
export interface BatchResult<T = any> {
  id: string;
  success: boolean;
  data?: T;
  error?: Error;
  duration: number;
  retryCount: number;
}

/**
 * 배치 인터페이스
 */
export interface Batch {
  id: string;
  operations: BatchOperation[];
  status: BatchStatus;
  priority: BatchPriority;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  results?: BatchResult[];
  error?: Error;
  retryCount: number;
  maxRetries: number;
}

/**
 * 배치 옵션
 */
export interface BatchOptions {
  maxBatchSize?: number;
  batchTimeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  mergeSimilar?: boolean;
  deduplication?: boolean;
  priorityThreshold?: BatchPriority;
}

/**
 * 배치 이벤트
 */
type BatchEvent =
  | 'batch:created'
  | 'batch:queued'
  | 'batch:started'
  | 'batch:completed'
  | 'batch:failed'
  | 'batch:retry'
  | 'batch:cancelled';

/**
 * 배치 업데이트 매니저
 */
export class BatchUpdateManager {
  private static instance: BatchUpdateManager;
  private queue: Batch[] = [];
  private currentBatch: Batch | null = null;
  private operations: Map<string, BatchOperation> = new Map();
  private processing = false;
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private listeners: Map<BatchEvent, Set<Function>> = new Map();
  private statistics = {
    totalBatches: 0,
    successfulBatches: 0,
    failedBatches: 0,
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    averageBatchSize: 0,
    averageProcessingTime: 0
  };

  private options: Required<BatchOptions> = {
    maxBatchSize: 50,
    batchTimeout: 5000,
    maxRetries: 3,
    retryDelay: 1000,
    mergeSimilar: true,
    deduplication: true,
    priorityThreshold: BatchPriority.NORMAL
  };

  private constructor() {}

  static getInstance(): BatchUpdateManager {
    if (!this.instance) {
      this.instance = new BatchUpdateManager();
    }
    return this.instance;
  }

  /**
   * 배치 옵션 설정
   */
  configure(options: BatchOptions): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * 작업 추가
   */
  add<T = any>(operation: Omit<BatchOperation<T>, 'id' | 'timestamp'>): string {
    const id = this.generateOperationId(operation);
    const timestamp = Date.now();

    const fullOperation: BatchOperation<T> = {
      ...operation,
      id,
      timestamp
    };

    // 중복 제거
    if (this.options.deduplication && this.isDuplicate(fullOperation)) {
      console.log(`🔄 중복 작업 감지, 스킵: ${id}`);
      return id;
    }

    // 유사 작업 병합
    if (this.options.mergeSimilar) {
      const merged = this.mergeSimilarOperations(fullOperation);
      if (merged) {
        console.log(`🔀 유사 작업 병합: ${id}`);
        return merged.id;
      }
    }

    this.operations.set(id, fullOperation);
    this.emit('batch:created', fullOperation);

    // 자동 배치 처리
    this.scheduleBatch();

    return id;
  }

  /**
   * 여러 작업 한번에 추가
   */
  addBulk<T = any>(operations: Omit<BatchOperation<T>, 'id' | 'timestamp'>[]): string[] {
    return operations.map(op => this.add(op));
  }

  /**
   * 배치 스케줄링
   */
  private scheduleBatch(): void {
    // 이미 타이머가 있으면 리셋
    const existingTimer = this.timers.get('batch-scheduler');
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // 긴급 작업이면 즉시 처리
    const hasUrgent = Array.from(this.operations.values()).some(
      op => op.priority >= BatchPriority.CRITICAL
    );

    const timeout = hasUrgent ? 100 : this.options.batchTimeout;

    const timer = setTimeout(() => {
      this.processBatch();
      this.timers.delete('batch-scheduler');
    }, timeout);

    this.timers.set('batch-scheduler', timer);

    // 배치 크기 초과 시 즉시 처리
    if (this.operations.size >= this.options.maxBatchSize) {
      this.flushBatch();
    }
  }

  /**
   * 배치 즉시 처리
   */
  flushBatch(): void {
    const timer = this.timers.get('batch-scheduler');
    if (timer) {
      clearTimeout(timer);
      this.timers.delete('batch-scheduler');
    }
    this.processBatch();
  }

  /**
   * 배치 처리
   */
  private async processBatch(): Promise<void> {
    if (this.processing || this.operations.size === 0) {
      return;
    }

    this.processing = true;

    // 작업들을 배치로 변환
    const operations = Array.from(this.operations.values());
    this.operations.clear();

    // 우선순위 정렬
    operations.sort((a, b) => b.priority - a.priority);

    // 배치 생성
    const batch: Batch = {
      id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      operations,
      status: BatchStatus.QUEUED,
      priority: Math.max(...operations.map(op => op.priority)) as BatchPriority,
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: this.options.maxRetries
    };

    this.queue.push(batch);
    this.emit('batch:queued', batch);

    // 큐 처리
    await this.processQueue();

    this.processing = false;
  }

  /**
   * 큐 처리
   */
  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 && !this.currentBatch) {
      // 우선순위 순으로 정렬
      this.queue.sort((a, b) => b.priority - a.priority);

      const batch = this.queue.shift();
      if (!batch) continue;

      this.currentBatch = batch;
      batch.status = BatchStatus.PROCESSING;
      batch.startedAt = Date.now();

      this.emit('batch:started', batch);

      try {
        const results = await this.executeBatch(batch);
        batch.results = results;
        batch.status = BatchStatus.COMPLETED;
        batch.completedAt = Date.now();

        // 통계 업데이트
        this.updateStatistics(batch);

        this.emit('batch:completed', batch);
      } catch (error) {
        batch.error = error as Error;
        batch.status = BatchStatus.FAILED;

        // 재시도
        if (batch.retryCount < batch.maxRetries) {
          batch.retryCount++;
          batch.status = BatchStatus.QUEUED;
          this.queue.unshift(batch);

          this.emit('batch:retry', batch);

          // 재시도 지연
          await new Promise(resolve =>
            setTimeout(resolve, this.options.retryDelay * batch.retryCount)
          );
        } else {
          this.emit('batch:failed', batch);
          this.statistics.failedBatches++;
        }
      } finally {
        this.currentBatch = null;
      }
    }
  }

  /**
   * 배치 실행
   */
  private async executeBatch(batch: Batch): Promise<BatchResult[]> {
    const results: BatchResult[] = [];
    const controller = abortControllerManager.create(`batch-${batch.id}`);

    // 작업 그룹화 (엔티티 타입별)
    const groupedOps = this.groupOperationsByEntity(batch.operations);

    for (const [entityType, ops] of groupedOps) {
      try {
        // 엔티티별 일괄 처리
        const entityResults = await this.executeEntityOperations(
          entityType,
          ops,
          controller.signal
        );
        results.push(...entityResults);
      } catch (error) {
        // 부분 실패 처리
        ops.forEach(op => {
          results.push({
            id: op.id,
            success: false,
            error: error as Error,
            duration: 0,
            retryCount: batch.retryCount
          });
        });
      }
    }

    return results;
  }

  /**
   * 엔티티별 작업 실행
   */
  private async executeEntityOperations(
    entityType: string,
    operations: BatchOperation[],
    signal: AbortSignal
  ): Promise<BatchResult[]> {
    const startTime = Date.now();
    const results: BatchResult[] = [];

    // 작업 타입별 분류
    const creates = operations.filter(op => op.type === BatchUpdateType.CREATE);
    const updates = operations.filter(op => op.type === BatchUpdateType.UPDATE);
    const deletes = operations.filter(op => op.type === BatchUpdateType.DELETE);

    // 삭제 먼저 처리 (순서 중요)
    for (const op of deletes) {
      if (signal.aborted) break;

      try {
        await optimisticUpdateManager.performUpdate(
          op.id,
          UpdateType.DELETE,
          op.data,
          async () => {
            // 실제 삭제 로직 (API 호출 등)
            return op.data;
          }
        );

        results.push({
          id: op.id,
          success: true,
          data: op.data,
          duration: Date.now() - startTime,
          retryCount: 0
        });
      } catch (error) {
        results.push({
          id: op.id,
          success: false,
          error: error as Error,
          duration: Date.now() - startTime,
          retryCount: 0
        });
      }
    }

    // 생성 처리
    if (creates.length > 0 && !signal.aborted) {
      try {
        // 벌크 생성
        const bulkData = creates.map(op => op.data);
        const createdItems = await this.performBulkCreate(entityType, bulkData);

        creates.forEach((op, index) => {
          results.push({
            id: op.id,
            success: true,
            data: createdItems[index],
            duration: Date.now() - startTime,
            retryCount: 0
          });
        });
      } catch (error) {
        creates.forEach(op => {
          results.push({
            id: op.id,
            success: false,
            error: error as Error,
            duration: Date.now() - startTime,
            retryCount: 0
          });
        });
      }
    }

    // 업데이트 처리
    if (updates.length > 0 && !signal.aborted) {
      try {
        // 벌크 업데이트
        const bulkUpdates = updates.map(op => ({
          id: op.entityId!,
          data: op.data
        }));
        const updatedItems = await this.performBulkUpdate(entityType, bulkUpdates);

        updates.forEach((op, index) => {
          results.push({
            id: op.id,
            success: true,
            data: updatedItems[index],
            duration: Date.now() - startTime,
            retryCount: 0
          });
        });
      } catch (error) {
        updates.forEach(op => {
          results.push({
            id: op.id,
            success: false,
            error: error as Error,
            duration: Date.now() - startTime,
            retryCount: 0
          });
        });
      }
    }

    return results;
  }

  /**
   * 벌크 생성
   */
  private async performBulkCreate(entityType: string, items: any[]): Promise<any[]> {
    // 실제 API 호출 시뮬레이션
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(items.map(item => ({ ...item, id: Date.now() + Math.random() })));
      }, 100);
    });
  }

  /**
   * 벌크 업데이트
   */
  private async performBulkUpdate(
    entityType: string,
    updates: { id: string; data: any }[]
  ): Promise<any[]> {
    // 실제 API 호출 시뮬레이션
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(updates.map(u => ({ ...u.data, id: u.id })));
      }, 100);
    });
  }

  /**
   * 작업 그룹화
   */
  private groupOperationsByEntity(
    operations: BatchOperation[]
  ): Map<string, BatchOperation[]> {
    const grouped = new Map<string, BatchOperation[]>();

    operations.forEach(op => {
      const existing = grouped.get(op.entityType) || [];
      existing.push(op);
      grouped.set(op.entityType, existing);
    });

    return grouped;
  }

  /**
   * 중복 체크
   */
  private isDuplicate(operation: BatchOperation): boolean {
    for (const existing of this.operations.values()) {
      if (
        existing.entityType === operation.entityType &&
        existing.entityId === operation.entityId &&
        existing.type === operation.type &&
        JSON.stringify(existing.data) === JSON.stringify(operation.data)
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * 유사 작업 병합
   */
  private mergeSimilarOperations(operation: BatchOperation): BatchOperation | null {
    for (const existing of this.operations.values()) {
      if (
        existing.entityType === operation.entityType &&
        existing.entityId === operation.entityId &&
        existing.type === BatchUpdateType.UPDATE &&
        operation.type === BatchUpdateType.UPDATE
      ) {
        // 업데이트 병합
        existing.data = { ...existing.data, ...operation.data };
        existing.timestamp = operation.timestamp;
        existing.priority = Math.max(existing.priority, operation.priority) as BatchPriority;
        return existing;
      }
    }
    return null;
  }

  /**
   * 작업 ID 생성
   */
  private generateOperationId(operation: Omit<BatchOperation, 'id' | 'timestamp'>): string {
    return `op-${operation.entityType}-${operation.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 통계 업데이트
   */
  private updateStatistics(batch: Batch): void {
    this.statistics.totalBatches++;

    if (batch.status === BatchStatus.COMPLETED) {
      this.statistics.successfulBatches++;

      const successfulOps = batch.results?.filter(r => r.success).length || 0;
      const failedOps = batch.results?.filter(r => !r.success).length || 0;

      this.statistics.successfulOperations += successfulOps;
      this.statistics.failedOperations += failedOps;
      this.statistics.totalOperations += batch.operations.length;

      // 평균 계산
      this.statistics.averageBatchSize =
        this.statistics.totalOperations / this.statistics.totalBatches;

      if (batch.startedAt && batch.completedAt) {
        const processingTime = batch.completedAt - batch.startedAt;
        this.statistics.averageProcessingTime =
          (this.statistics.averageProcessingTime * (this.statistics.totalBatches - 1) + processingTime) /
          this.statistics.totalBatches;
      }
    } else {
      this.statistics.failedOperations += batch.operations.length;
      this.statistics.totalOperations += batch.operations.length;
    }
  }

  /**
   * 작업 취소
   */
  cancel(operationId: string): boolean {
    if (this.operations.has(operationId)) {
      this.operations.delete(operationId);
      return true;
    }

    // 큐에서 제거
    for (const batch of this.queue) {
      const index = batch.operations.findIndex(op => op.id === operationId);
      if (index !== -1) {
        batch.operations.splice(index, 1);
        if (batch.operations.length === 0) {
          const batchIndex = this.queue.indexOf(batch);
          this.queue.splice(batchIndex, 1);
        }
        return true;
      }
    }

    return false;
  }

  /**
   * 배치 취소
   */
  cancelBatch(batchId: string): boolean {
    const index = this.queue.findIndex(b => b.id === batchId);
    if (index !== -1) {
      const batch = this.queue[index];
      batch.status = BatchStatus.CANCELLED;
      this.queue.splice(index, 1);
      this.emit('batch:cancelled', batch);
      return true;
    }

    if (this.currentBatch?.id === batchId) {
      // 현재 처리 중인 배치는 중단할 수 없음
      console.warn('Cannot cancel currently processing batch');
      return false;
    }

    return false;
  }

  /**
   * 모든 작업 취소
   */
  cancelAll(): void {
    this.operations.clear();

    // 타이머 정리
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();

    // 큐 정리
    this.queue.forEach(batch => {
      batch.status = BatchStatus.CANCELLED;
      this.emit('batch:cancelled', batch);
    });
    this.queue = [];
  }

  /**
   * 통계 반환
   */
  getStatistics() {
    return {
      ...this.statistics,
      pendingOperations: this.operations.size,
      queuedBatches: this.queue.length,
      isProcessing: this.processing,
      currentBatch: this.currentBatch
    };
  }

  /**
   * 상태 반환
   */
  getStatus() {
    return {
      pendingOperations: Array.from(this.operations.values()),
      queue: this.queue,
      currentBatch: this.currentBatch,
      isProcessing: this.processing
    };
  }

  /**
   * 이벤트 리스너 등록
   */
  on(event: BatchEvent, listener: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // cleanup 함수 반환
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  /**
   * 이벤트 발생
   */
  private emit(event: BatchEvent, data?: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in batch event listener:`, error);
        }
      });
    }
  }

  /**
   * 리셋
   */
  reset(): void {
    this.cancelAll();
    this.statistics = {
      totalBatches: 0,
      successfulBatches: 0,
      failedBatches: 0,
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageBatchSize: 0,
      averageProcessingTime: 0
    };
  }
}

// 싱글톤 인스턴스 export
export const batchUpdateManager = BatchUpdateManager.getInstance();