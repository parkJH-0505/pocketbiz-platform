/**
 * Transaction Manager
 * 트랜잭션 관리 및 ACID 보장 시스템
 */

import type { UnifiedEntity } from '../pipeline/transform/types';
import { EventBus } from '../EventBus';
import { DataValidationEngine } from '../validation/DataValidationEngine';
import { ConflictDetector } from '../conflict/ConflictDetector';
import { ConflictResolver } from '../conflict/ConflictResolver';

// 트랜잭션 상태
export type TransactionState =
  | 'pending'
  | 'active'
  | 'committing'
  | 'committed'
  | 'aborting'
  | 'aborted';

// 트랜잭션 격리 수준
export type IsolationLevel =
  | 'read_uncommitted'
  | 'read_committed'
  | 'repeatable_read'
  | 'serializable';

// 트랜잭션 작업 타입
export type OperationType = 'create' | 'update' | 'delete' | 'read';

// 트랜잭션 작업
export interface TransactionOperation {
  id: string;
  type: OperationType;
  entity: UnifiedEntity;
  previousState?: UnifiedEntity;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// 트랜잭션 컨텍스트
export interface TransactionContext {
  id: string;
  isolationLevel: IsolationLevel;
  timeout: number; // ms
  retryCount: number;
  userId?: string;
  sessionId: string;
}

// 트랜잭션
export interface Transaction {
  id: string;
  state: TransactionState;
  context: TransactionContext;
  operations: TransactionOperation[];

  startedAt: Date;
  committedAt?: Date;
  abortedAt?: Date;

  locks: Set<string>; // 잠긴 엔터티 ID들
  savepoints: Map<string, TransactionOperation[]>; // 세이브포인트

  error?: Error;
  metadata?: Record<string, any>;
}

// 트랜잭션 결과
export interface TransactionResult {
  transactionId: string;
  success: boolean;
  state: TransactionState;

  operationsCount: number;
  affectedEntities: string[];

  duration: number;
  error?: {
    code: string;
    message: string;
    operation?: string;
  };
}

// 잠금 타입
export type LockType = 'shared' | 'exclusive';

// 잠금 정보
export interface Lock {
  entityId: string;
  transactionId: string;
  type: LockType;
  acquiredAt: Date;
  expiresAt: Date;
}

export class TransactionManager {
  private static instance: TransactionManager;

  private transactions: Map<string, Transaction>;
  private locks: Map<string, Lock>;
  private deadlockDetector: DeadlockDetector;
  private operationLog: Map<string, TransactionOperation[]>;

  private eventBus: EventBus;
  private validationEngine: DataValidationEngine;
  private conflictDetector: ConflictDetector;
  private conflictResolver: ConflictResolver;

  private constructor() {
    this.transactions = new Map();
    this.locks = new Map();
    this.operationLog = new Map();

    this.deadlockDetector = new DeadlockDetector();

    this.eventBus = EventBus.getInstance();
    this.validationEngine = DataValidationEngine.getInstance();
    this.conflictDetector = ConflictDetector.getInstance();
    this.conflictResolver = ConflictResolver.getInstance();

    // 만료된 트랜잭션 정리 스케줄링
    this.scheduleCleanup();
  }

  public static getInstance(): TransactionManager {
    if (!TransactionManager.instance) {
      TransactionManager.instance = new TransactionManager();
    }
    return TransactionManager.instance;
  }

  /**
   * 트랜잭션 시작
   */
  public async begin(
    options?: Partial<TransactionContext>
  ): Promise<Transaction> {
    const transactionId = this.generateTransactionId();

    const context: TransactionContext = {
      id: transactionId,
      isolationLevel: options?.isolationLevel || 'read_committed',
      timeout: options?.timeout || 30000,
      retryCount: options?.retryCount || 3,
      userId: options?.userId,
      sessionId: options?.sessionId || this.generateSessionId()
    };

    const transaction: Transaction = {
      id: transactionId,
      state: 'active',
      context,
      operations: [],
      startedAt: new Date(),
      locks: new Set(),
      savepoints: new Map()
    };

    this.transactions.set(transactionId, transaction);

    // 타임아웃 설정
    this.setTransactionTimeout(transaction);

    // 이벤트 발생
    this.eventBus.emit('transaction:started', {
      transactionId,
      context
    });

    return transaction;
  }

  /**
   * 트랜잭션 커밋
   */
  public async commit(transactionId: string): Promise<TransactionResult> {
    const transaction = this.transactions.get(transactionId);

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    if (transaction.state !== 'active') {
      throw new Error(`Cannot commit transaction in ${transaction.state} state`);
    }

    const startTime = Date.now();

    try {
      transaction.state = 'committing';

      // 모든 작업 검증
      await this.validateOperations(transaction);

      // 충돌 검사 및 해결
      await this.resolveConflicts(transaction);

      // 작업 적용
      await this.applyOperations(transaction);

      // 트랜잭션 완료
      transaction.state = 'committed';
      transaction.committedAt = new Date();

      // 잠금 해제
      this.releaseLocks(transaction);

      // 로그 기록
      this.logTransaction(transaction);

      // 이벤트 발생
      this.eventBus.emit('transaction:committed', {
        transactionId,
        operationsCount: transaction.operations.length
      });

      return {
        transactionId,
        success: true,
        state: 'committed',
        operationsCount: transaction.operations.length,
        affectedEntities: Array.from(transaction.locks),
        duration: Date.now() - startTime
      };

    } catch (error) {
      // 롤백
      await this.rollback(transactionId, error as Error);

      return {
        transactionId,
        success: false,
        state: 'aborted',
        operationsCount: transaction.operations.length,
        affectedEntities: Array.from(transaction.locks),
        duration: Date.now() - startTime,
        error: {
          code: 'COMMIT_FAILED',
          message: (error as Error).message
        }
      };
    } finally {
      // 트랜잭션 정리
      this.cleanup(transactionId);
    }
  }

  /**
   * 트랜잭션 롤백
   */
  public async rollback(
    transactionId: string,
    error?: Error
  ): Promise<TransactionResult> {
    const transaction = this.transactions.get(transactionId);

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const startTime = Date.now();
    transaction.state = 'aborting';

    try {
      // 작업 되돌리기
      await this.revertOperations(transaction);

      // 잠금 해제
      this.releaseLocks(transaction);

      // 상태 업데이트
      transaction.state = 'aborted';
      transaction.abortedAt = new Date();
      transaction.error = error;

      // 이벤트 발생
      this.eventBus.emit('transaction:aborted', {
        transactionId,
        reason: error?.message
      });

      return {
        transactionId,
        success: false,
        state: 'aborted',
        operationsCount: transaction.operations.length,
        affectedEntities: Array.from(transaction.locks),
        duration: Date.now() - startTime,
        error: error ? {
          code: 'ROLLBACK',
          message: error.message
        } : undefined
      };

    } finally {
      // 트랜잭션 정리
      this.cleanup(transactionId);
    }
  }

  /**
   * 작업 추가
   */
  public async addOperation(
    transactionId: string,
    operation: Omit<TransactionOperation, 'id' | 'timestamp'>
  ): Promise<void> {
    const transaction = this.transactions.get(transactionId);

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    if (transaction.state !== 'active') {
      throw new Error(`Cannot add operation to ${transaction.state} transaction`);
    }

    // 잠금 획득
    await this.acquireLock(
      transaction,
      operation.entity.id,
      operation.type === 'read' ? 'shared' : 'exclusive'
    );

    // 작업 생성
    const fullOperation: TransactionOperation = {
      ...operation,
      id: this.generateOperationId(),
      timestamp: new Date()
    };

    // 이전 상태 저장 (update, delete의 경우)
    if (operation.type === 'update' || operation.type === 'delete') {
      fullOperation.previousState = await this.getEntitySnapshot(operation.entity.id);
    }

    transaction.operations.push(fullOperation);
  }

  /**
   * 세이브포인트 생성
   */
  public createSavepoint(
    transactionId: string,
    name: string
  ): void {
    const transaction = this.transactions.get(transactionId);

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    // 현재 작업 상태 저장
    transaction.savepoints.set(name, [...transaction.operations]);
  }

  /**
   * 세이브포인트로 롤백
   */
  public rollbackToSavepoint(
    transactionId: string,
    name: string
  ): void {
    const transaction = this.transactions.get(transactionId);

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const savepoint = transaction.savepoints.get(name);

    if (!savepoint) {
      throw new Error(`Savepoint ${name} not found`);
    }

    // 세이브포인트 이후 작업 되돌리기
    const operationsToRevert = transaction.operations.slice(savepoint.length);

    for (const operation of operationsToRevert.reverse()) {
      this.revertOperation(operation);
    }

    // 작업 목록 복원
    transaction.operations = [...savepoint];
  }

  /**
   * 잠금 획득
   */
  private async acquireLock(
    transaction: Transaction,
    entityId: string,
    type: LockType
  ): Promise<void> {
    const existingLock = this.locks.get(entityId);

    if (existingLock) {
      // 같은 트랜잭션의 잠금이면 OK
      if (existingLock.transactionId === transaction.id) {
        return;
      }

      // 격리 수준에 따른 처리
      if (!this.canAcquireLock(transaction, existingLock, type)) {
        // 대기 또는 실패
        await this.waitForLock(transaction, entityId, type);
      }
    }

    // 데드락 검사
    if (this.deadlockDetector.wouldCauseDeadlock(transaction.id, entityId)) {
      throw new Error('Deadlock detected');
    }

    // 잠금 생성
    const lock: Lock = {
      entityId,
      transactionId: transaction.id,
      type,
      acquiredAt: new Date(),
      expiresAt: new Date(Date.now() + transaction.context.timeout)
    };

    this.locks.set(entityId, lock);
    transaction.locks.add(entityId);
  }

  /**
   * 잠금 가능 여부 확인
   */
  private canAcquireLock(
    transaction: Transaction,
    existingLock: Lock,
    requestedType: LockType
  ): boolean {
    // 격리 수준에 따른 잠금 호환성 체크
    switch (transaction.context.isolationLevel) {
      case 'read_uncommitted':
        return true; // 모든 잠금 허용

      case 'read_committed':
        // 읽기 잠금은 공유 가능
        return requestedType === 'shared' && existingLock.type === 'shared';

      case 'repeatable_read':
      case 'serializable':
        // 엄격한 잠금
        return false;

      default:
        return false;
    }
  }

  /**
   * 잠금 대기
   */
  private async waitForLock(
    transaction: Transaction,
    entityId: string,
    type: LockType
  ): Promise<void> {
    const maxWaitTime = 5000; // 5초
    const checkInterval = 100; // 100ms
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const lock = this.locks.get(entityId);

      if (!lock || this.canAcquireLock(transaction, lock, type)) {
        return;
      }

      await this.delay(checkInterval);
    }

    throw new Error(`Lock timeout for entity ${entityId}`);
  }

  /**
   * 잠금 해제
   */
  private releaseLocks(transaction: Transaction): void {
    for (const entityId of transaction.locks) {
      const lock = this.locks.get(entityId);

      if (lock && lock.transactionId === transaction.id) {
        this.locks.delete(entityId);
      }
    }

    transaction.locks.clear();
  }

  /**
   * 작업 검증
   */
  private async validateOperations(
    transaction: Transaction
  ): Promise<void> {
    for (const operation of transaction.operations) {
      if (operation.type === 'create' || operation.type === 'update') {
        const validationResult = await this.validationEngine.validate(
          operation.entity,
          {
            entityType: operation.entity.type,
            operation: operation.type,
            timestamp: new Date(),
            source: 'transaction',
            userId: transaction.context.userId
          }
        );

        if (validationResult.status === 'failed') {
          throw new Error(
            `Validation failed: ${validationResult.errors[0]?.message}`
          );
        }
      }
    }
  }

  /**
   * 충돌 해결
   */
  private async resolveConflicts(
    transaction: Transaction
  ): Promise<void> {
    for (const operation of transaction.operations) {
      if (operation.type === 'update') {
        const currentState = await this.getEntitySnapshot(operation.entity.id);

        if (currentState &&
            currentState.metadata?.version !== operation.previousState?.metadata?.version) {
          // 충돌 감지
          const conflicts = await this.conflictDetector.detect(
            operation.entity,
            currentState
          );

          // 충돌 해결
          for (const conflict of conflicts) {
            const resolution = await this.conflictResolver.resolve(conflict);

            if (resolution.status === 'failure') {
              throw new Error(`Conflict resolution failed: ${resolution.error?.message}`);
            }

            // 해결된 엔터티로 교체
            if (resolution.resolvedEntity) {
              operation.entity = resolution.resolvedEntity;
            }
          }
        }
      }
    }
  }

  /**
   * 작업 적용
   */
  private async applyOperations(
    transaction: Transaction
  ): Promise<void> {
    for (const operation of transaction.operations) {
      await this.applyOperation(operation);
    }
  }

  /**
   * 단일 작업 적용
   */
  private async applyOperation(
    operation: TransactionOperation
  ): Promise<void> {
    // 실제 구현에서는 데이터베이스에 적용
    // 여기서는 시뮬레이션

    switch (operation.type) {
      case 'create':
        console.log(`Creating entity ${operation.entity.id}`);
        break;

      case 'update':
        console.log(`Updating entity ${operation.entity.id}`);
        break;

      case 'delete':
        console.log(`Deleting entity ${operation.entity.id}`);
        break;

      case 'read':
        console.log(`Reading entity ${operation.entity.id}`);
        break;
    }

    // 작업 로그에 추가
    if (!this.operationLog.has(operation.entity.id)) {
      this.operationLog.set(operation.entity.id, []);
    }
    this.operationLog.get(operation.entity.id)!.push(operation);
  }

  /**
   * 작업 되돌리기
   */
  private async revertOperations(
    transaction: Transaction
  ): Promise<void> {
    // 역순으로 되돌리기
    for (const operation of [...transaction.operations].reverse()) {
      await this.revertOperation(operation);
    }
  }

  /**
   * 단일 작업 되돌리기
   */
  private async revertOperation(
    operation: TransactionOperation
  ): Promise<void> {
    switch (operation.type) {
      case 'create':
        // 생성한 엔터티 삭제
        console.log(`Reverting create: deleting ${operation.entity.id}`);
        break;

      case 'update':
        // 이전 상태로 복원
        if (operation.previousState) {
          console.log(`Reverting update: restoring ${operation.entity.id}`);
        }
        break;

      case 'delete':
        // 삭제한 엔터티 복원
        if (operation.previousState) {
          console.log(`Reverting delete: restoring ${operation.entity.id}`);
        }
        break;

      case 'read':
        // 읽기는 되돌릴 필요 없음
        break;
    }
  }

  /**
   * 엔터티 스냅샷 조회
   */
  private async getEntitySnapshot(
    entityId: string
  ): Promise<UnifiedEntity | undefined> {
    // 실제 구현에서는 데이터베이스에서 조회
    // 여기서는 시뮬레이션
    const operations = this.operationLog.get(entityId);

    if (!operations || operations.length === 0) {
      return undefined;
    }

    // 최신 상태 반환
    const lastOperation = operations[operations.length - 1];
    return lastOperation.entity;
  }

  /**
   * 트랜잭션 타임아웃 설정
   */
  private setTransactionTimeout(transaction: Transaction): void {
    setTimeout(() => {
      if (transaction.state === 'active' || transaction.state === 'committing') {
        this.rollback(transaction.id, new Error('Transaction timeout'));
      }
    }, transaction.context.timeout);
  }

  /**
   * 트랜잭션 로그 기록
   */
  private logTransaction(transaction: Transaction): void {
    console.log('Transaction logged:', {
      id: transaction.id,
      state: transaction.state,
      operations: transaction.operations.length,
      duration: transaction.committedAt
        ? transaction.committedAt.getTime() - transaction.startedAt.getTime()
        : 0
    });
  }

  /**
   * 트랜잭션 정리
   */
  private cleanup(transactionId: string): void {
    const transaction = this.transactions.get(transactionId);

    if (transaction) {
      // 잠금 해제
      this.releaseLocks(transaction);

      // 트랜잭션 제거
      this.transactions.delete(transactionId);
    }
  }

  /**
   * 만료된 트랜잭션 정리
   */
  private scheduleCleanup(): void {
    setInterval(() => {
      const now = Date.now();

      for (const [id, transaction] of this.transactions.entries()) {
        const age = now - transaction.startedAt.getTime();

        if (age > transaction.context.timeout * 2) {
          console.log(`Cleaning up expired transaction ${id}`);
          this.cleanup(id);
        }
      }

      // 만료된 잠금 정리
      for (const [entityId, lock] of this.locks.entries()) {
        if (new Date() > lock.expiresAt) {
          console.log(`Releasing expired lock for ${entityId}`);
          this.locks.delete(entityId);
        }
      }
    }, 30000); // 30초마다
  }

  /**
   * 유틸리티 메서드
   */
  private generateTransactionId(): string {
    return `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateOperationId(): string {
    return `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 트랜잭션 상태 조회
   */
  public getTransaction(transactionId: string): Transaction | undefined {
    return this.transactions.get(transactionId);
  }

  /**
   * 활성 트랜잭션 목록
   */
  public getActiveTransactions(): Transaction[] {
    return Array.from(this.transactions.values()).filter(
      tx => tx.state === 'active'
    );
  }

  /**
   * 트랜잭션 통계
   */
  public getStatistics(): {
    activeTransactions: number;
    totalLocks: number;
    averageDuration: number;
  } {
    const transactions = Array.from(this.transactions.values());
    const completedTransactions = transactions.filter(
      tx => tx.state === 'committed' || tx.state === 'aborted'
    );

    let totalDuration = 0;
    for (const tx of completedTransactions) {
      if (tx.committedAt || tx.abortedAt) {
        const endTime = (tx.committedAt || tx.abortedAt)!.getTime();
        totalDuration += endTime - tx.startedAt.getTime();
      }
    }

    return {
      activeTransactions: transactions.filter(tx => tx.state === 'active').length,
      totalLocks: this.locks.size,
      averageDuration: completedTransactions.length > 0
        ? totalDuration / completedTransactions.length
        : 0
    };
  }
}

/**
 * 데드락 감지기
 */
class DeadlockDetector {
  private waitGraph: Map<string, Set<string>>;

  constructor() {
    this.waitGraph = new Map();
  }

  /**
   * 데드락 발생 가능성 확인
   */
  wouldCauseDeadlock(
    transactionId: string,
    entityId: string
  ): boolean {
    // 간단한 사이클 감지 알고리즘
    // 실제 구현에서는 더 정교한 알고리즘 필요

    if (!this.waitGraph.has(transactionId)) {
      this.waitGraph.set(transactionId, new Set());
    }

    this.waitGraph.get(transactionId)!.add(entityId);

    // DFS로 사이클 확인
    const visited = new Set<string>();
    const stack = new Set<string>();

    return this.hasCycle(transactionId, visited, stack);
  }

  private hasCycle(
    node: string,
    visited: Set<string>,
    stack: Set<string>
  ): boolean {
    visited.add(node);
    stack.add(node);

    const neighbors = this.waitGraph.get(node) || new Set();

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (this.hasCycle(neighbor, visited, stack)) {
          return true;
        }
      } else if (stack.has(neighbor)) {
        return true; // 사이클 발견
      }
    }

    stack.delete(node);
    return false;
  }

  /**
   * 트랜잭션 제거
   */
  removeTransaction(transactionId: string): void {
    this.waitGraph.delete(transactionId);
  }
}