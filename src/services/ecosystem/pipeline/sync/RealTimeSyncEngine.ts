/**
 * Real-time Sync Engine
 * 실시간 데이터 동기화를 관리하는 메인 엔진
 */

import { CentralEventBus } from '../../EventBus';
import { DataTransformationEngine } from '../transform/DataTransformationEngine';
import { ChangeDetector } from './ChangeDetector';
import { ConflictResolver } from './ConflictResolver';
import { SyncStateManager } from './SyncStateManager';
import type {
  SyncOperation,
  SyncConfiguration,
  ChangeEvent,
  SyncStatus,
  SyncError,
  SyncEvent,
  SyncPerformanceMetrics,
  RetryPolicy
} from './types';
import type { UnifiedEntity } from '../transform/types';
import type { DataSourceType } from '../types';

interface SyncQueue {
  operations: Map<string, SyncOperation>;
  priorityQueue: SyncOperation[];
  processing: Set<string>;
  maxConcurrent: number;
}

export class RealTimeSyncEngine {
  private static instance: RealTimeSyncEngine;

  private eventBus: CentralEventBus;
  private transformationEngine: DataTransformationEngine;
  private changeDetector: ChangeDetector;
  private conflictResolver: ConflictResolver;
  private stateManager: SyncStateManager;

  private config: SyncConfiguration;
  private syncQueue: SyncQueue;
  private isRunning = false;
  private processingInterval?: NodeJS.Timeout;

  // 성능 및 통계
  private performanceMetrics: SyncPerformanceMetrics;
  private operationHistory: SyncOperation[] = [];

  private constructor() {
    this.eventBus = CentralEventBus.getInstance();
    this.transformationEngine = DataTransformationEngine.getInstance();
    this.changeDetector = ChangeDetector.getInstance();
    this.conflictResolver = ConflictResolver.getInstance();
    this.stateManager = SyncStateManager.getInstance();

    this.config = this.getDefaultConfiguration();
    this.syncQueue = {
      operations: new Map(),
      priorityQueue: [],
      processing: new Set(),
      maxConcurrent: this.config.maxConcurrentOperations
    };

    this.performanceMetrics = this.initializeMetrics();
    this.setupEventListeners();
  }

  static getInstance(): RealTimeSyncEngine {
    if (!RealTimeSyncEngine.instance) {
      RealTimeSyncEngine.instance = new RealTimeSyncEngine();
    }
    return RealTimeSyncEngine.instance;
  }

  /**
   * 동기화 엔진 시작
   */
  async start(config?: Partial<SyncConfiguration>): Promise<void> {
    if (this.isRunning) {
      console.warn('[RealTimeSyncEngine] Already running');
      return;
    }

    console.log('🔄 [RealTimeSyncEngine] Starting real-time sync engine...');

    // 설정 업데이트
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // 하위 시스템 시작
    await this.stateManager.start();
    await this.changeDetector.start();

    // 동기화 처리 시작
    this.startProcessing();

    this.isRunning = true;

    // 시작 이벤트 발행
    await this.emitSyncEvent('sync:started', 'engine', {
      startedAt: new Date(),
      configuration: this.config
    });

    console.log('✅ [RealTimeSyncEngine] Real-time sync engine started');
  }

  /**
   * 동기화 엔진 중지
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.warn('[RealTimeSyncEngine] Not running');
      return;
    }

    console.log('🛑 [RealTimeSyncEngine] Stopping real-time sync engine...');

    // 처리 중지
    this.stopProcessing();

    // 남은 작업 완료 대기
    await this.waitForPendingOperations();

    // 하위 시스템 중지
    await this.changeDetector.stop();
    await this.stateManager.stop();

    this.isRunning = false;

    // 중지 이벤트 발행
    await this.emitSyncEvent('sync:stopped', 'engine', {
      stoppedAt: new Date(),
      finalMetrics: this.performanceMetrics
    });

    console.log('✅ [RealTimeSyncEngine] Real-time sync engine stopped');
  }

  /**
   * 수동 동기화 트리거
   */
  async triggerSync(
    sourceSystem: DataSourceType,
    targetSystem?: DataSourceType,
    entityId?: string
  ): Promise<string[]> {
    console.log(`[RealTimeSyncEngine] Manual sync triggered: ${sourceSystem} -> ${targetSystem || 'all'}`);

    const operationIds: string[] = [];

    // 변화 감지 실행
    const changes = await this.changeDetector.detectChanges(sourceSystem);

    for (const change of changes) {
      // 타겟 시스템 필터링
      const targetSystems = targetSystem
        ? [targetSystem]
        : change.targetSystems;

      // 엔터티 필터링
      if (entityId && change.entityId !== entityId) {
        continue;
      }

      // 동기화 작업 생성
      for (const target of targetSystems) {
        const operation = await this.createSyncOperation(change, target);
        await this.queueOperation(operation);
        operationIds.push(operation.id);
      }
    }

    console.log(`[RealTimeSyncEngine] Queued ${operationIds.length} sync operations`);
    return operationIds;
  }

  /**
   * 동기화 작업 상태 조회
   */
  getOperationStatus(operationId: string): SyncOperation | undefined {
    return this.syncQueue.operations.get(operationId);
  }

  /**
   * 전체 동기화 상태 조회
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      queueSize: this.syncQueue.operations.size,
      processing: this.syncQueue.processing.size,
      configuration: this.config,
      performance: this.performanceMetrics,
      stateManager: this.stateManager.getStatus()
    };
  }

  /**
   * 변화 이벤트 처리
   */
  private async handleChangeEvent(event: any): Promise<void> {
    const changeEvent: ChangeEvent = event.data.changeEvent;

    console.log(`[RealTimeSyncEngine] Processing change: ${changeEvent.id} (${changeEvent.operationType})`);

    // 동기화 불필요한 경우 스킵
    if (!changeEvent.syncRequired) {
      return;
    }

    // 각 타겟 시스템에 대한 동기화 작업 생성
    for (const targetSystem of changeEvent.targetSystems) {
      const operation = await this.createSyncOperation(changeEvent, targetSystem);
      await this.queueOperation(operation);
    }
  }

  /**
   * 동기화 작업 생성
   */
  private async createSyncOperation(
    changeEvent: ChangeEvent,
    targetSystem: DataSourceType
  ): Promise<SyncOperation> {
    const operationId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 타겟 엔터티 조회 (업데이트/삭제의 경우)
    let targetEntity: UnifiedEntity | undefined;
    if (changeEvent.operationType !== 'create') {
      targetEntity = this.findTargetEntity(changeEvent.entityId, targetSystem);
    }

    const operation: SyncOperation = {
      id: operationId,
      changeEventId: changeEvent.id,

      operationType: changeEvent.operationType,
      sourceSystem: changeEvent.sourceSystem,
      targetSystem: targetSystem,
      entityId: changeEvent.entityId,
      entityType: changeEvent.entityType,

      sourceEntity: changeEvent.currentVersion,
      targetEntity: targetEntity,
      expectedTargetState: this.calculateExpectedTargetState(
        changeEvent.currentVersion,
        targetEntity,
        changeEvent.operationType
      ),

      syncMode: this.config.globalMode,
      retryAttempts: 0,
      maxRetries: this.config.retryPolicy.maxAttempts,
      timeout: this.config.defaultTimeout,

      status: 'pending',
      performance: this.initializeMetrics()
    };

    return operation;
  }

  /**
   * 타겟 엔터티 조회
   */
  private findTargetEntity(entityId: string, targetSystem: DataSourceType): UnifiedEntity | undefined {
    // 실제 구현에서는 타겟 시스템에서 엔터티를 조회
    // 여기서는 변환 엔진의 엔터티 스토어에서 조회
    const allEntities = this.transformationEngine.getAllEntities();
    return allEntities.find(entity =>
      entity.sourceId === entityId && entity.sourceType === targetSystem
    );
  }

  /**
   * 예상 타겟 상태 계산
   */
  private calculateExpectedTargetState(
    sourceEntity: UnifiedEntity,
    targetEntity: UnifiedEntity | undefined,
    operationType: string
  ): UnifiedEntity {
    switch (operationType) {
      case 'create':
        return { ...sourceEntity, sourceType: 'sync' as any };
      case 'update':
        return targetEntity
          ? { ...targetEntity, ...sourceEntity, updatedAt: new Date() }
          : sourceEntity;
      case 'delete':
        return targetEntity
          ? { ...targetEntity, status: 'archived' as any }
          : sourceEntity;
      default:
        return sourceEntity;
    }
  }

  /**
   * 동기화 작업 큐에 추가
   */
  private async queueOperation(operation: SyncOperation): Promise<void> {
    // 중복 작업 확인
    const existingOperation = this.findDuplicateOperation(operation);
    if (existingOperation) {
      console.log(`[RealTimeSyncEngine] Duplicate operation ignored: ${operation.id}`);
      return;
    }

    this.syncQueue.operations.set(operation.id, operation);

    // 우선순위 큐에 추가
    this.insertToPriorityQueue(operation);

    console.log(`[RealTimeSyncEngine] Queued operation: ${operation.id} (queue size: ${this.syncQueue.operations.size})`);
  }

  /**
   * 중복 작업 찾기
   */
  private findDuplicateOperation(operation: SyncOperation): SyncOperation | undefined {
    for (const existing of this.syncQueue.operations.values()) {
      if (
        existing.entityId === operation.entityId &&
        existing.targetSystem === operation.targetSystem &&
        existing.operationType === operation.operationType &&
        existing.status === 'pending'
      ) {
        return existing;
      }
    }
    return undefined;
  }

  /**
   * 우선순위 큐에 삽입
   */
  private insertToPriorityQueue(operation: SyncOperation): void {
    // 우선순위 기반 삽입 (높은 우선순위가 앞에)
    const changeEvent = this.findChangeEvent(operation.changeEventId);
    const priority = changeEvent?.priority || 5;

    let inserted = false;
    for (let i = 0; i < this.syncQueue.priorityQueue.length; i++) {
      const existingChangeEvent = this.findChangeEvent(this.syncQueue.priorityQueue[i].changeEventId);
      const existingPriority = existingChangeEvent?.priority || 5;

      if (priority > existingPriority) {
        this.syncQueue.priorityQueue.splice(i, 0, operation);
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      this.syncQueue.priorityQueue.push(operation);
    }
  }

  /**
   * 변화 이벤트 찾기 (캐시된 이벤트에서)
   */
  private findChangeEvent(changeEventId: string): ChangeEvent | undefined {
    // 실제 구현에서는 변화 이벤트 캐시에서 조회
    return undefined;
  }

  /**
   * 동기화 처리 시작
   */
  private startProcessing(): void {
    this.processingInterval = setInterval(async () => {
      await this.processQueue();
    }, 100); // 100ms마다 큐 처리

    console.log('[RealTimeSyncEngine] Processing started');
  }

  /**
   * 동기화 처리 중지
   */
  private stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }

    console.log('[RealTimeSyncEngine] Processing stopped');
  }

  /**
   * 큐 처리
   */
  private async processQueue(): Promise<void> {
    // 동시 처리 제한 확인
    if (this.syncQueue.processing.size >= this.syncQueue.maxConcurrent) {
      return;
    }

    // 다음 작업 가져오기
    const operation = this.getNextOperation();
    if (!operation) {
      return;
    }

    // 처리 시작
    this.syncQueue.processing.add(operation.id);
    operation.status = 'processing';
    operation.startedAt = new Date();

    try {
      await this.executeOperation(operation);
    } catch (error) {
      console.error(`[RealTimeSyncEngine] Operation failed: ${operation.id}`, error);
    } finally {
      this.syncQueue.processing.delete(operation.id);
    }
  }

  /**
   * 다음 작업 가져오기
   */
  private getNextOperation(): SyncOperation | undefined {
    // 우선순위 큐에서 처리되지 않은 작업 찾기
    for (let i = 0; i < this.syncQueue.priorityQueue.length; i++) {
      const operation = this.syncQueue.priorityQueue[i];
      if (operation.status === 'pending' && !this.syncQueue.processing.has(operation.id)) {
        this.syncQueue.priorityQueue.splice(i, 1);
        return operation;
      }
    }
    return undefined;
  }

  /**
   * 동기화 작업 실행
   */
  private async executeOperation(operation: SyncOperation): Promise<void> {
    const startTime = Date.now();

    console.log(`[RealTimeSyncEngine] Executing operation: ${operation.id} (${operation.operationType})`);

    try {
      // 충돌 검사
      const conflicts = await this.conflictResolver.detectConflicts(operation);
      if (conflicts.length > 0) {
        console.warn(`[RealTimeSyncEngine] Conflicts detected for operation ${operation.id}:`, conflicts.length);

        // 자동 해결 시도
        const resolved = await this.conflictResolver.resolveConflicts(conflicts);
        if (!resolved) {
          await this.handleOperationConflict(operation, conflicts);
          return;
        }
      }

      // 실제 동기화 실행
      await this.performSync(operation);

      // 성공 처리
      await this.handleOperationSuccess(operation);

    } catch (error) {
      // 실패 처리
      await this.handleOperationFailure(operation, error as Error);
    } finally {
      // 성능 메트릭 업데이트
      operation.performance.totalProcessingTime = Date.now() - startTime;
      operation.completedAt = new Date();

      this.updatePerformanceMetrics(operation);
    }
  }

  /**
   * 실제 동기화 수행
   */
  private async performSync(operation: SyncOperation): Promise<void> {
    // 타겟 시스템별 동기화 로직
    switch (operation.targetSystem) {
      case 'v2':
        await this.syncToV2System(operation);
        break;
      case 'calendar':
        await this.syncToCalendarSystem(operation);
        break;
      case 'buildup':
        await this.syncToBuildupSystem(operation);
        break;
      default:
        throw new Error(`Unsupported target system: ${operation.targetSystem}`);
    }
  }

  /**
   * V2 시스템 동기화
   */
  private async syncToV2System(operation: SyncOperation): Promise<void> {
    console.log(`[RealTimeSyncEngine] Syncing to V2: ${operation.entityType} ${operation.operationType}`);

    // V2 시스템 특화 동기화 로직
    switch (operation.operationType) {
      case 'create':
        // V2에 새 엔터티 생성
        break;
      case 'update':
        // V2의 기존 엔터티 업데이트
        break;
      case 'delete':
        // V2의 엔터티 삭제/비활성화
        break;
    }

    // 시뮬레이션: 약간의 지연
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
  }

  /**
   * 캘린더 시스템 동기화
   */
  private async syncToCalendarSystem(operation: SyncOperation): Promise<void> {
    console.log(`[RealTimeSyncEngine] Syncing to Calendar: ${operation.entityType} ${operation.operationType}`);

    // 캘린더 시스템은 이벤트와 작업만 지원
    if (!['event', 'task'].includes(operation.entityType)) {
      throw new Error(`Calendar system does not support ${operation.entityType}`);
    }

    // 시뮬레이션: 약간의 지연
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
  }

  /**
   * Buildup 시스템 동기화
   */
  private async syncToBuildupSystem(operation: SyncOperation): Promise<void> {
    console.log(`[RealTimeSyncEngine] Syncing to Buildup: ${operation.entityType} ${operation.operationType}`);

    // Buildup 시스템은 프로젝트와 KPI만 지원
    if (!['project', 'kpi'].includes(operation.entityType)) {
      throw new Error(`Buildup system does not support ${operation.entityType}`);
    }

    // 시뮬레이션: 약간의 지연
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
  }

  /**
   * 작업 성공 처리
   */
  private async handleOperationSuccess(operation: SyncOperation): Promise<void> {
    operation.status = 'completed';

    // 상태 업데이트
    this.stateManager.recordSuccess(operation);

    // 이벤트 발행
    await this.emitSyncEvent('sync:completed', operation.id, {
      operation: operation,
      completedAt: new Date(),
      duration: operation.performance.totalProcessingTime
    });

    console.log(`[RealTimeSyncEngine] Operation completed successfully: ${operation.id}`);

    // 히스토리에 추가
    this.addToHistory(operation);
  }

  /**
   * 작업 실패 처리
   */
  private async handleOperationFailure(operation: SyncOperation, error: Error): Promise<void> {
    operation.retryAttempts++;

    const syncError: SyncError = {
      code: 'SYNC_EXECUTION_ERROR',
      message: error.message,
      type: 'system',
      severity: 'medium',
      recoverable: operation.retryAttempts < operation.maxRetries,
      context: {
        operationType: operation.operationType,
        targetSystem: operation.targetSystem,
        retryAttempt: operation.retryAttempts
      },
      timestamp: new Date()
    };

    operation.error = syncError;

    // 재시도 가능한 경우
    if (syncError.recoverable && this.shouldRetry(operation, error)) {
      console.warn(`[RealTimeSyncEngine] Operation failed, will retry: ${operation.id} (attempt ${operation.retryAttempts})`);

      // 재시도 지연
      const delay = this.calculateRetryDelay(operation.retryAttempts);
      setTimeout(async () => {
        operation.status = 'pending';
        await this.queueOperation(operation);
      }, delay);

    } else {
      // 최종 실패
      operation.status = 'failed';

      // 상태 업데이트
      this.stateManager.recordFailure(operation, syncError);

      // 이벤트 발행
      await this.emitSyncEvent('sync:failed', operation.id, {
        operation: operation,
        error: syncError,
        failedAt: new Date()
      });

      console.error(`[RealTimeSyncEngine] Operation failed permanently: ${operation.id}`, syncError);

      // 히스토리에 추가
      this.addToHistory(operation);
    }
  }

  /**
   * 작업 충돌 처리
   */
  private async handleOperationConflict(operation: SyncOperation, conflicts: any[]): Promise<void> {
    operation.status = 'conflicted';

    // 상태 업데이트
    this.stateManager.recordConflict(operation, conflicts);

    // 이벤트 발행
    await this.emitSyncEvent('sync:conflict_detected', operation.id, {
      operation: operation,
      conflicts: conflicts,
      detectedAt: new Date()
    });

    console.warn(`[RealTimeSyncEngine] Operation conflicted: ${operation.id}`, conflicts);

    // 히스토리에 추가
    this.addToHistory(operation);
  }

  /**
   * 재시도 여부 결정
   */
  private shouldRetry(operation: SyncOperation, error: Error): boolean {
    const retryableErrors = this.config.retryPolicy.retryableErrors;
    return retryableErrors.some(errorCode => error.message.includes(errorCode));
  }

  /**
   * 재시도 지연 계산
   */
  private calculateRetryDelay(attempt: number): number {
    const policy = this.config.retryPolicy;
    const delay = Math.min(
      policy.baseDelay * Math.pow(policy.backoffMultiplier, attempt - 1),
      policy.maxDelay
    );

    // 지터 추가
    if (policy.jitterEnabled) {
      return delay + Math.random() * 1000;
    }

    return delay;
  }

  /**
   * 대기 중인 작업 완료 대기
   */
  private async waitForPendingOperations(timeout: number = 30000): Promise<void> {
    const startTime = Date.now();

    while (this.syncQueue.processing.size > 0) {
      if (Date.now() - startTime > timeout) {
        console.warn('[RealTimeSyncEngine] Timeout waiting for pending operations');
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * 성능 메트릭 업데이트
   */
  private updatePerformanceMetrics(operation: SyncOperation): void {
    this.performanceMetrics.totalProcessingTime += operation.performance.totalProcessingTime;

    // 성공률 업데이트
    const totalOps = this.operationHistory.length + 1;
    const successOps = this.operationHistory.filter(op => op.status === 'completed').length +
                       (operation.status === 'completed' ? 1 : 0);
    this.performanceMetrics.successRate = successOps / totalOps;
  }

  /**
   * 히스토리에 추가
   */
  private addToHistory(operation: SyncOperation): void {
    this.operationHistory.push(operation);

    // 히스토리 크기 제한
    if (this.operationHistory.length > 1000) {
      this.operationHistory = this.operationHistory.slice(-1000);
    }
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    this.eventBus.subscribe(
      'sync:change_detected',
      this.handleChangeEvent.bind(this),
      1
    );
  }

  /**
   * 동기화 이벤트 발행
   */
  private async emitSyncEvent(
    type: SyncEvent['type'],
    operationId: string,
    data: Record<string, any>
  ): Promise<void> {
    await this.eventBus.emit({
      id: `sync_event_${Date.now()}`,
      type,
      source: 'sync-engine',
      timestamp: Date.now(),
      data: {
        syncOperationId: operationId,
        ...data
      }
    });
  }

  /**
   * 기본 설정 반환
   */
  private getDefaultConfiguration(): SyncConfiguration {
    return {
      globalMode: 'realtime',
      globalDirection: 'bidirectional',
      maxConcurrentOperations: 5,
      defaultTimeout: 30000,

      systemConfigs: new Map(),
      entityConfigs: new Map(),

      defaultConflictStrategy: 'latest_wins',
      conflictThreshold: 5000, // 5초

      batchSize: 10,
      bufferTimeout: 1000,
      retryPolicy: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitterEnabled: true,
        retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'TEMPORARY_FAILURE']
      }
    };
  }

  /**
   * 메트릭 초기화
   */
  private initializeMetrics(): SyncPerformanceMetrics {
    return {
      operationsPerSecond: 0,
      bytesPerSecond: 0,
      averageLatency: 0,
      p50Latency: 0,
      p95Latency: 0,
      p99Latency: 0,
      successRate: 1,
      totalProcessingTime: 0,
      startTime: new Date()
    };
  }

  /**
   * 설정 업데이트
   */
  updateConfiguration(config: Partial<SyncConfiguration>): void {
    this.config = { ...this.config, ...config };
    console.log('[RealTimeSyncEngine] Configuration updated');
  }

  /**
   * 정리
   */
  async dispose(): Promise<void> {
    await this.stop();
    this.syncQueue.operations.clear();
    this.syncQueue.priorityQueue = [];
    this.operationHistory = [];
    console.log('[RealTimeSyncEngine] Disposed');
  }
}