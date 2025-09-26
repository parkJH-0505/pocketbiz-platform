/**
 * Sync Transaction System
 * 동기화 작업의 트랜잭션 관리 및 에러 복구
 */

// 브라우저 환경을 위한 간단한 EventEmitter 구현
class EventEmitter {
  private events: Map<string, Set<Function>> = new Map();

  on(event: string, handler: Function) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);
  }

  once(event: string, handler: Function) {
    const onceHandler = (...args: any[]) => {
      handler(...args);
      this.off(event, onceHandler);
    };
    this.on(event, onceHandler);
  }

  off(event: string, handler: Function) {
    this.events.get(event)?.delete(handler);
  }

  emit(event: string, ...args: any[]) {
    this.events.get(event)?.forEach(handler => handler(...args));
  }

  removeEventListener(event: string, handler: Function) {
    this.off(event, handler);
  }

  addEventListener(event: string, handler: Function) {
    this.on(event, handler);
  }
}

// 에러 타입 정의
export enum SyncErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// 에러 심각도
export enum ErrorSeverity {
  CRITICAL = 'critical',  // 즉시 롤백 필요
  HIGH = 'high',         // 재시도 후 롤백
  MEDIUM = 'medium',     // 재시도 가능
  LOW = 'low'           // 로깅만
}

// 동기화 작업 인터페이스
export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'batch';
  target: 'project' | 'calendar' | 'meeting' | 'milestone';
  data: any;
  priority: number;
  retryCount?: number;
  maxRetries?: number;
}

// 롤백 작업
export interface RollbackOperation {
  operationId: string;
  previousState: any;
  restore: () => Promise<void>;
}

// 트랜잭션 상태
export enum TransactionState {
  IDLE = 'idle',
  IN_PROGRESS = 'in_progress',
  COMMITTING = 'committing',
  ROLLING_BACK = 'rolling_back',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// 동기화 에러 클래스
export class SyncError extends Error {
  public type: SyncErrorType;
  public severity: ErrorSeverity;
  public operations: SyncOperation[];
  public originalError?: Error;
  public retryable: boolean;

  constructor(
    message: string,
    type: SyncErrorType,
    severity: ErrorSeverity,
    operations: SyncOperation[],
    originalError?: Error
  ) {
    super(message);
    this.name = 'SyncError';
    this.type = type;
    this.severity = severity;
    this.operations = operations;
    this.originalError = originalError;
    this.retryable = this.isRetryable();
  }

  private isRetryable(): boolean {
    return [
      SyncErrorType.NETWORK_ERROR,
      SyncErrorType.TIMEOUT_ERROR,
      SyncErrorType.CONFLICT_ERROR
    ].includes(this.type);
  }
}

/**
 * 동기화 트랜잭션 관리자
 */
export class SyncTransactionManager extends EventEmitter {
  private state: TransactionState = TransactionState.IDLE;
  private rollbackStack: RollbackOperation[] = [];
  private completedOperations: SyncOperation[] = [];
  private failedOperations: SyncOperation[] = [];
  private transactionId: string = '';
  private startTime: number = 0;

  // 에러 복구 전략
  private errorRecoveryStrategies = {
    [SyncErrorType.NETWORK_ERROR]: {
      maxRetries: 3,
      backoffMs: [1000, 2000, 4000],
      fallback: 'queue_for_later'
    },
    [SyncErrorType.CONFLICT_ERROR]: {
      strategy: 'merge',
      conflictResolver: this.resolveConflict.bind(this)
    },
    [SyncErrorType.VALIDATION_ERROR]: {
      strategy: 'skip_and_log',
      notifyUser: true
    },
    [SyncErrorType.QUOTA_EXCEEDED]: {
      strategy: 'cleanup_old_data',
      cleanupThreshold: 30 // days
    },
    [SyncErrorType.TIMEOUT_ERROR]: {
      maxRetries: 2,
      timeoutMs: 10000,
      fallback: 'abort'
    }
  };

  /**
   * 트랜잭션 실행
   */
  async executeTransaction(operations: SyncOperation[]): Promise<void> {
    if (this.state !== TransactionState.IDLE) {
      throw new SyncError(
        'Transaction already in progress',
        SyncErrorType.CONFLICT_ERROR,
        ErrorSeverity.HIGH,
        operations
      );
    }

    this.transactionId = this.generateTransactionId();
    this.startTime = Date.now();
    this.state = TransactionState.IN_PROGRESS;
    this.emit('transaction:start', { id: this.transactionId, operations });

    try {
      // 우선순위 순으로 정렬
      const sortedOperations = [...operations].sort((a, b) => b.priority - a.priority);

      for (const operation of sortedOperations) {
        await this.executeOperationWithRetry(operation);
      }

      // 모든 작업 성공 시 커밋
      await this.commit();
    } catch (error) {
      // 실패 시 롤백
      await this.rollback(error as Error);
      throw error;
    } finally {
      this.cleanup();
    }
  }

  /**
   * 개별 작업 실행 (재시도 포함)
   */
  private async executeOperationWithRetry(operation: SyncOperation): Promise<void> {
    const maxRetries = operation.maxRetries || 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // 이전 상태 저장 (롤백용)
        const previousState = await this.captureState(operation);

        // 작업 실행
        await this.executeOperation(operation);

        // 롤백 작업 추가
        this.rollbackStack.push({
          operationId: operation.id,
          previousState,
          restore: async () => this.restoreState(operation, previousState)
        });

        // 성공한 작업 기록
        this.completedOperations.push(operation);
        this.emit('operation:success', { operation, attempt });

        return; // 성공
      } catch (error) {
        lastError = error as Error;
        operation.retryCount = attempt;

        // 에러 타입 분석
        const errorType = this.classifyError(error as Error);
        const recovery = this.errorRecoveryStrategies[errorType];

        if (attempt < maxRetries && recovery) {
          // 재시도 전 대기
          const backoffTime = recovery.backoffMs?.[attempt] || 1000;
          await this.delay(backoffTime);

          this.emit('operation:retry', {
            operation,
            attempt: attempt + 1,
            error: lastError
          });
        } else {
          // 재시도 실패
          this.failedOperations.push(operation);
          throw new SyncError(
            `Operation failed after ${attempt + 1} attempts`,
            errorType,
            ErrorSeverity.HIGH,
            [operation],
            lastError
          );
        }
      }
    }

    // 모든 재시도 실패
    if (lastError) {
      throw lastError;
    }
  }

  /**
   * 작업 실행
   */
  private async executeOperation(operation: SyncOperation): Promise<void> {
    switch (operation.type) {
      case 'create':
        await this.handleCreate(operation);
        break;
      case 'update':
        await this.handleUpdate(operation);
        break;
      case 'delete':
        await this.handleDelete(operation);
        break;
      case 'batch':
        await this.handleBatch(operation);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * 상태 캡처 (롤백용)
   */
  private async captureState(operation: SyncOperation): Promise<any> {
    // 현재 상태를 캡처하는 로직
    // 실제 구현에서는 target과 type에 따라 다르게 처리
    return {
      timestamp: Date.now(),
      operation: { ...operation },
      // 실제 데이터 스냅샷
      snapshot: this.createSnapshot(operation)
    };
  }

  /**
   * 상태 복원
   */
  private async restoreState(operation: SyncOperation, previousState: any): Promise<void> {
    this.emit('rollback:operation', { operation, previousState });

    // 실제 복원 로직
    switch (operation.type) {
      case 'create':
        // 생성된 항목 삭제
        await this.handleDelete({
          ...operation,
          type: 'delete'
        });
        break;
      case 'update':
        // 이전 값으로 업데이트
        await this.handleUpdate({
          ...operation,
          data: previousState.snapshot
        });
        break;
      case 'delete':
        // 삭제된 항목 복원
        await this.handleCreate({
          ...operation,
          type: 'create',
          data: previousState.snapshot
        });
        break;
    }
  }

  /**
   * 트랜잭션 커밋
   */
  private async commit(): Promise<void> {
    this.state = TransactionState.COMMITTING;
    this.emit('transaction:commit', {
      id: this.transactionId,
      operations: this.completedOperations,
      duration: Date.now() - this.startTime
    });

    // 커밋 후 정리 작업
    this.state = TransactionState.COMPLETED;
  }

  /**
   * 트랜잭션 롤백
   */
  private async rollback(error: Error): Promise<void> {
    this.state = TransactionState.ROLLING_BACK;
    this.emit('transaction:rollback:start', {
      id: this.transactionId,
      error,
      operations: this.rollbackStack.length
    });

    const rollbackErrors: Error[] = [];

    // LIFO 순서로 롤백
    while (this.rollbackStack.length > 0) {
      const rollback = this.rollbackStack.pop()!;
      try {
        await rollback.restore();
        this.emit('rollback:success', { operationId: rollback.operationId });
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError as Error);
        this.emit('rollback:error', {
          operationId: rollback.operationId,
          error: rollbackError
        });
      }
    }

    this.state = TransactionState.FAILED;
    this.emit('transaction:rollback:complete', {
      id: this.transactionId,
      errors: rollbackErrors
    });

    if (rollbackErrors.length > 0) {
      console.error('Rollback errors:', rollbackErrors);
    }
  }

  /**
   * 충돌 해결
   */
  private async resolveConflict(local: any, remote: any): Promise<any> {
    // 타임스탬프 기반 간단한 충돌 해결
    // 실제로는 더 복잡한 병합 로직 필요
    if (local.lastModified > remote.lastModified) {
      return local;
    }
    return remote;
  }

  /**
   * 에러 분류
   */
  private classifyError(error: Error): SyncErrorType {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return SyncErrorType.NETWORK_ERROR;
    }
    if (message.includes('timeout')) {
      return SyncErrorType.TIMEOUT_ERROR;
    }
    if (message.includes('conflict') || message.includes('duplicate')) {
      return SyncErrorType.CONFLICT_ERROR;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return SyncErrorType.VALIDATION_ERROR;
    }
    if (message.includes('quota') || message.includes('storage')) {
      return SyncErrorType.QUOTA_EXCEEDED;
    }
    if (message.includes('permission') || message.includes('forbidden')) {
      return SyncErrorType.PERMISSION_ERROR;
    }

    return SyncErrorType.UNKNOWN_ERROR;
  }

  // 구현 헬퍼 메서드들
  private async handleCreate(operation: SyncOperation): Promise<void> {
    // 실제 생성 로직
    console.log('Creating:', operation);
  }

  private async handleUpdate(operation: SyncOperation): Promise<void> {
    // 실제 업데이트 로직
    console.log('Updating:', operation);
  }

  private async handleDelete(operation: SyncOperation): Promise<void> {
    // 실제 삭제 로직
    console.log('Deleting:', operation);
  }

  private async handleBatch(operation: SyncOperation): Promise<void> {
    // 배치 처리 로직
    console.log('Batch processing:', operation);
  }

  private createSnapshot(operation: SyncOperation): any {
    // 스냅샷 생성 로직
    return { ...operation.data };
  }

  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private cleanup(): void {
    this.rollbackStack = [];
    this.completedOperations = [];
    this.failedOperations = [];
    this.state = TransactionState.IDLE;
  }

  // 상태 조회 메서드들
  getState(): TransactionState {
    return this.state;
  }

  getTransactionId(): string {
    return this.transactionId;
  }

  getStatistics() {
    return {
      completed: this.completedOperations.length,
      failed: this.failedOperations.length,
      pending: this.rollbackStack.length,
      duration: this.startTime ? Date.now() - this.startTime : 0
    };
  }
}

// 싱글톤 인스턴스
export const syncTransactionManager = new SyncTransactionManager();