/**
 * Batch Queue System
 * Phase 5: 고급 큐 시스템 및 스케줄링
 *
 * 주요 기능:
 * - Priority Queue 구현
 * - 시간/크기 기반 배치
 * - Smart Batching 알고리즘
 * - React Hook 통합
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  batchUpdateManager,
  BatchOperation,
  BatchPriority,
  BatchStatus,
  BatchUpdateType,
  type Batch,
  type BatchResult
} from './batchUpdateSystem';

/**
 * 큐 전략
 */
export enum QueueStrategy {
  FIFO = 'fifo',         // First In First Out
  LIFO = 'lifo',         // Last In First Out
  PRIORITY = 'priority', // Priority Based
  SMART = 'smart'        // Smart Batching
}

/**
 * 배치 전략
 */
export interface BatchStrategy {
  strategy: QueueStrategy;
  maxSize: number;
  maxWait: number;
  minSize?: number;
  adaptiveThreshold?: boolean;
  priorityBoost?: boolean;
}

/**
 * Priority Queue 구현
 */
export class PriorityQueue<T> {
  private heap: { priority: number; value: T }[] = [];

  enqueue(value: T, priority: number): void {
    this.heap.push({ priority, value });
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue(): T | undefined {
    if (this.isEmpty()) return undefined;

    const result = this.heap[0].value;
    const end = this.heap.pop();

    if (this.heap.length > 0 && end) {
      this.heap[0] = end;
      this.bubbleDown(0);
    }

    return result;
  }

  private bubbleUp(index: number): void {
    const element = this.heap[index];

    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIndex];

      if (element.priority <= parent.priority) break;

      this.heap[index] = parent;
      index = parentIndex;
    }

    this.heap[index] = element;
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;
    const element = this.heap[index];

    while (true) {
      let swap = -1;
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;

      if (leftChildIndex < length) {
        const leftChild = this.heap[leftChildIndex];
        if (leftChild.priority > element.priority) {
          swap = leftChildIndex;
        }
      }

      if (rightChildIndex < length) {
        const rightChild = this.heap[rightChildIndex];
        if (
          rightChild.priority > element.priority &&
          rightChild.priority > this.heap[leftChildIndex].priority
        ) {
          swap = rightChildIndex;
        }
      }

      if (swap === -1) break;

      this.heap[index] = this.heap[swap];
      index = swap;
    }

    this.heap[index] = element;
  }

  peek(): T | undefined {
    return this.heap[0]?.value;
  }

  size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  clear(): void {
    this.heap = [];
  }

  toArray(): T[] {
    return this.heap.map(item => item.value);
  }
}

/**
 * Smart Batching 알고리즘
 */
export class SmartBatcher {
  private patterns: Map<string, number> = new Map();
  private correlations: Map<string, Set<string>> = new Map();
  private performanceMetrics: Map<string, number> = new Map();

  /**
   * 작업 패턴 학습
   */
  learnPattern(operations: BatchOperation[]): void {
    operations.forEach(op => {
      const key = `${op.entityType}-${op.type}`;
      this.patterns.set(key, (this.patterns.get(key) || 0) + 1);

      // 상관관계 학습
      operations.forEach(otherOp => {
        if (op !== otherOp) {
          const otherKey = `${otherOp.entityType}-${otherOp.type}`;
          if (!this.correlations.has(key)) {
            this.correlations.set(key, new Set());
          }
          this.correlations.get(key)!.add(otherKey);
        }
      });
    });
  }

  /**
   * 최적 배치 크기 계산
   */
  calculateOptimalBatchSize(operations: BatchOperation[]): number {
    // 기본 크기
    let optimalSize = 10;

    // 패턴 기반 조정
    const patterns = new Map<string, number>();
    operations.forEach(op => {
      const key = `${op.entityType}-${op.type}`;
      patterns.set(key, (patterns.get(key) || 0) + 1);
    });

    // 동일 타입이 많으면 배치 크기 증가
    const maxPattern = Math.max(...patterns.values());
    if (maxPattern > 5) {
      optimalSize = Math.min(50, maxPattern * 2);
    }

    // 성능 메트릭 기반 조정
    const avgPerformance = this.getAveragePerformance();
    if (avgPerformance < 100) {
      // 빠르면 배치 크기 증가
      optimalSize = Math.min(optimalSize * 2, 100);
    } else if (avgPerformance > 500) {
      // 느리면 배치 크기 감소
      optimalSize = Math.max(5, Math.floor(optimalSize / 2));
    }

    return optimalSize;
  }

  /**
   * 관련 작업 그룹화
   */
  groupRelatedOperations(operations: BatchOperation[]): BatchOperation[][] {
    const groups: BatchOperation[][] = [];
    const visited = new Set<BatchOperation>();

    operations.forEach(op => {
      if (visited.has(op)) return;

      const group: BatchOperation[] = [op];
      visited.add(op);

      const key = `${op.entityType}-${op.type}`;
      const relatedKeys = this.correlations.get(key) || new Set();

      operations.forEach(otherOp => {
        if (visited.has(otherOp)) return;

        const otherKey = `${otherOp.entityType}-${otherOp.type}`;
        if (relatedKeys.has(otherKey) || op.entityId === otherOp.entityId) {
          group.push(otherOp);
          visited.add(otherOp);
        }
      });

      groups.push(group);
    });

    return groups;
  }

  /**
   * 성능 기록
   */
  recordPerformance(entityType: string, duration: number): void {
    const current = this.performanceMetrics.get(entityType) || 0;
    this.performanceMetrics.set(entityType, (current + duration) / 2);
  }

  /**
   * 평균 성능 반환
   */
  private getAveragePerformance(): number {
    if (this.performanceMetrics.size === 0) return 100;
    const sum = Array.from(this.performanceMetrics.values()).reduce((a, b) => a + b, 0);
    return sum / this.performanceMetrics.size;
  }

  /**
   * 통계 반환
   */
  getStatistics() {
    return {
      patterns: Object.fromEntries(this.patterns),
      correlations: Object.fromEntries(
        Array.from(this.correlations.entries()).map(([key, value]) => [
          key,
          Array.from(value)
        ])
      ),
      performanceMetrics: Object.fromEntries(this.performanceMetrics),
      averagePerformance: this.getAveragePerformance()
    };
  }
}

/**
 * 배치 큐 매니저
 */
export class BatchQueueManager {
  private queue: PriorityQueue<BatchOperation> = new PriorityQueue();
  private smartBatcher: SmartBatcher = new SmartBatcher();
  private strategy: BatchStrategy = {
    strategy: QueueStrategy.SMART,
    maxSize: 50,
    maxWait: 5000,
    minSize: 5,
    adaptiveThreshold: true,
    priorityBoost: true
  };

  /**
   * 전략 설정
   */
  setStrategy(strategy: BatchStrategy): void {
    this.strategy = strategy;
  }

  /**
   * 작업 추가
   */
  enqueue(operation: BatchOperation): void {
    let priority = operation.priority;

    // Priority Boost
    if (this.strategy.priorityBoost) {
      const age = Date.now() - operation.timestamp;
      if (age > 10000) {
        // 10초 이상 대기 시 우선순위 증가
        priority = Math.min(BatchPriority.CRITICAL, priority + 1);
      }
    }

    this.queue.enqueue(operation, priority);
  }

  /**
   * 배치 생성
   */
  createBatch(): BatchOperation[] | null {
    const operations: BatchOperation[] = [];
    const maxSize = this.strategy.adaptiveThreshold
      ? this.smartBatcher.calculateOptimalBatchSize(this.queue.toArray())
      : this.strategy.maxSize;

    while (!this.queue.isEmpty() && operations.length < maxSize) {
      const op = this.queue.dequeue();
      if (op) operations.push(op);
    }

    // 최소 크기 체크
    if (operations.length < (this.strategy.minSize || 1)) {
      // 다시 큐에 추가
      operations.forEach(op => this.queue.enqueue(op, op.priority));
      return null;
    }

    // Smart Batching
    if (this.strategy.strategy === QueueStrategy.SMART) {
      this.smartBatcher.learnPattern(operations);
      const groups = this.smartBatcher.groupRelatedOperations(operations);

      // 첫 번째 그룹만 반환하고 나머지는 다시 큐에
      if (groups.length > 1) {
        for (let i = 1; i < groups.length; i++) {
          groups[i].forEach(op => this.queue.enqueue(op, op.priority));
        }
        return groups[0];
      }
    }

    return operations;
  }

  /**
   * 큐 상태
   */
  getStatus() {
    return {
      size: this.queue.size(),
      isEmpty: this.queue.isEmpty(),
      strategy: this.strategy,
      smartStats: this.smartBatcher.getStatistics()
    };
  }

  /**
   * 큐 클리어
   */
  clear(): void {
    this.queue.clear();
  }
}

/**
 * React Hook: 배치 업데이트 사용
 */
export const useBatchUpdate = <T = any>(
  entityType: string,
  options?: {
    strategy?: BatchStrategy;
    onBatchComplete?: (results: BatchResult[]) => void;
    onBatchError?: (error: Error) => void;
  }
) => {
  const [pending, setPending] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [statistics, setStatistics] = useState(batchUpdateManager.getStatistics());
  const queueManager = useRef(new BatchQueueManager());
  const cleanupRef = useRef<(() => void)[]>([]);

  // 전략 설정
  useEffect(() => {
    if (options?.strategy) {
      queueManager.current.setStrategy(options.strategy);
    }
  }, [options?.strategy]);

  // 이벤트 리스너 설정
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    unsubscribers.push(
      batchUpdateManager.on('batch:queued', () => {
        setProcessing(true);
      })
    );

    unsubscribers.push(
      batchUpdateManager.on('batch:completed', (batch: Batch) => {
        setProcessing(false);
        setStatistics(batchUpdateManager.getStatistics());

        if (options?.onBatchComplete && batch.results) {
          options.onBatchComplete(batch.results);
        }
      })
    );

    unsubscribers.push(
      batchUpdateManager.on('batch:failed', (batch: Batch) => {
        setProcessing(false);
        setStatistics(batchUpdateManager.getStatistics());

        if (options?.onBatchError && batch.error) {
          options.onBatchError(batch.error);
        }
      })
    );

    cleanupRef.current = unsubscribers;

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [options?.onBatchComplete, options?.onBatchError]);

  // 작업 추가
  const add = useCallback((
    type: BatchUpdateType,
    data: T,
    options?: {
      entityId?: string;
      priority?: BatchPriority;
      metadata?: Record<string, any>;
    }
  ): string => {
    const operation: Omit<BatchOperation<T>, 'id' | 'timestamp'> = {
      type,
      entityType,
      data,
      entityId: options?.entityId,
      priority: options?.priority || BatchPriority.NORMAL,
      metadata: options?.metadata
    };

    const id = batchUpdateManager.add(operation);
    setPending(prev => prev + 1);

    return id;
  }, [entityType]);

  // 여러 작업 추가
  const addBulk = useCallback((
    operations: Array<{
      type: BatchUpdateType;
      data: T;
      entityId?: string;
      priority?: BatchPriority;
      metadata?: Record<string, any>;
    }>
  ): string[] => {
    const ops = operations.map(op => ({
      type: op.type,
      entityType,
      data: op.data,
      entityId: op.entityId,
      priority: op.priority || BatchPriority.NORMAL,
      metadata: op.metadata
    }));

    const ids = batchUpdateManager.addBulk(ops);
    setPending(prev => prev + operations.length);

    return ids;
  }, [entityType]);

  // 즉시 실행
  const flush = useCallback(() => {
    batchUpdateManager.flushBatch();
  }, []);

  // 작업 취소
  const cancel = useCallback((operationId: string): boolean => {
    const result = batchUpdateManager.cancel(operationId);
    if (result) {
      setPending(prev => Math.max(0, prev - 1));
    }
    return result;
  }, []);

  // 모두 취소
  const cancelAll = useCallback(() => {
    batchUpdateManager.cancelAll();
    setPending(0);
  }, []);

  // 큐 상태
  const getQueueStatus = useCallback(() => {
    return queueManager.current.getStatus();
  }, []);

  return {
    // 작업 함수
    add,
    addBulk,
    flush,
    cancel,
    cancelAll,

    // 상태
    pending,
    processing,
    statistics,
    queueStatus: getQueueStatus(),

    // 헬퍼
    create: (data: T, options?: any) =>
      add(BatchUpdateType.CREATE, data, options),
    update: (entityId: string, data: T, options?: any) =>
      add(BatchUpdateType.UPDATE, data, { ...options, entityId }),
    delete: (entityId: string, options?: any) =>
      add(BatchUpdateType.DELETE, {} as T, { ...options, entityId })
  };
};

/**
 * React Hook: 배치 상태 모니터링
 */
export const useBatchMonitor = () => {
  const [status, setStatus] = useState(batchUpdateManager.getStatus());
  const [statistics, setStatistics] = useState(batchUpdateManager.getStatistics());
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const updateStatus = () => {
      setStatus(batchUpdateManager.getStatus());
      setStatistics(batchUpdateManager.getStatistics());
    };

    // 주기적 업데이트
    intervalRef.current = setInterval(updateStatus, 500);

    // 이벤트 리스너
    const unsubscribers = [
      batchUpdateManager.on('batch:queued', updateStatus),
      batchUpdateManager.on('batch:completed', updateStatus),
      batchUpdateManager.on('batch:failed', updateStatus)
    ];

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  return {
    status,
    statistics,
    isProcessing: status.isProcessing,
    pendingCount: status.pendingOperations.length,
    queueLength: status.queue.length
  };
};