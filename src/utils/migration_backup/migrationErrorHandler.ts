/**
 * @fileoverview 마이그레이션 에러 처리 및 복구 시스템
 * @description Sprint 3 - Stage 3: 에러 분류, 자동 복구, 롤백
 * @author PocketCompany
 * @since 2025-01-23
 */

import { migrationMonitor } from './migrationMonitor';
import type { MigrationResult } from './dataMigration';

/**
 * 에러 레벨
 */
export enum ErrorLevel {
  CRITICAL = 'critical',  // 즉시 중단 필요
  ERROR = 'error',       // 에러지만 계속 가능
  WARNING = 'warning',   // 경고
  INFO = 'info'         // 정보
}

/**
 * 에러 카테고리
 */
export enum ErrorCategory {
  DATA_INTEGRITY = 'data_integrity',
  NETWORK = 'network',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  RESOURCE = 'resource',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

/**
 * 복구 전략
 */
export enum RecoveryStrategy {
  RETRY = 'retry',
  RETRY_WITH_BACKOFF = 'retry_with_backoff',
  SKIP = 'skip',
  ROLLBACK = 'rollback',
  MANUAL = 'manual',
  NONE = 'none'
}

/**
 * 에러 정보
 */
export interface MigrationError {
  id: string;
  code: string;
  level: ErrorLevel;
  category: ErrorCategory;
  message: string;
  timestamp: Date;
  context?: any;
  stack?: string;
  retryCount?: number;
  recoveryStrategy?: RecoveryStrategy;
}

/**
 * 에러 카탈로그 항목
 */
export interface ErrorCatalogEntry {
  code: string;
  level: ErrorLevel;
  category: ErrorCategory;
  message: string;
  description?: string;
  possibleCauses?: string[];
  suggestedFixes?: string[];
  recoveryStrategy: RecoveryStrategy;
  maxRetries?: number;
}

/**
 * 복구 옵션
 */
export interface RecoveryOptions {
  strategy: RecoveryStrategy;
  maxRetries?: number;
  backoffMultiplier?: number;
  initialDelay?: number;
  maxDelay?: number;
  skipOnFailure?: boolean;
}

/**
 * Circuit Breaker 상태
 */
export enum CircuitState {
  CLOSED = 'closed',   // 정상 작동
  OPEN = 'open',      // 차단됨
  HALF_OPEN = 'half_open' // 테스트 중
}

/**
 * 롤백 스냅샷
 */
export interface RollbackSnapshot {
  id: string;
  timestamp: Date;
  state: any;
  metadata?: any;
}

/**
 * 에러 처리 관리자
 */
export class MigrationErrorHandler {
  private static instance: MigrationErrorHandler | null = null;

  // 에러 카탈로그
  private errorCatalog: Map<string, ErrorCatalogEntry> = new Map();

  // 에러 이력
  private errorHistory: MigrationError[] = [];

  // Circuit Breaker
  private circuitState: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private failureThreshold: number = 5;
  private resetTimeout: number = 60000; // 1분
  private lastFailureTime: number = 0;

  // 롤백 스냅샷
  private snapshots: RollbackSnapshot[] = [];
  private maxSnapshots: number = 10;

  private constructor() {
    this.initializeErrorCatalog();
  }

  /**
   * 싱글톤 인스턴스
   */
  public static getInstance(): MigrationErrorHandler {
    if (!MigrationErrorHandler.instance) {
      MigrationErrorHandler.instance = new MigrationErrorHandler();
    }
    return MigrationErrorHandler.instance;
  }

  /**
   * 에러 카탈로그 초기화
   */
  private initializeErrorCatalog(): void {
    // Data Integrity Errors
    this.registerError({
      code: 'ERR_DATA_001',
      level: ErrorLevel.CRITICAL,
      category: ErrorCategory.DATA_INTEGRITY,
      message: 'Data corruption detected',
      description: 'Data integrity check failed during migration',
      possibleCauses: [
        'Corrupted source data',
        'Transformation error',
        'Encoding issues'
      ],
      suggestedFixes: [
        'Verify source data integrity',
        'Check data transformations',
        'Review encoding settings'
      ],
      recoveryStrategy: RecoveryStrategy.ROLLBACK
    });

    this.registerError({
      code: 'ERR_DATA_002',
      level: ErrorLevel.ERROR,
      category: ErrorCategory.DATA_INTEGRITY,
      message: 'Duplicate key violation',
      description: 'Attempted to insert duplicate data',
      possibleCauses: [
        'Duplicate IDs in source data',
        'Concurrent migration attempts',
        'Failed cleanup from previous migration'
      ],
      suggestedFixes: [
        'Remove duplicates from source',
        'Ensure single migration instance',
        'Clean up existing data'
      ],
      recoveryStrategy: RecoveryStrategy.SKIP,
      maxRetries: 0
    });

    // Network Errors
    this.registerError({
      code: 'ERR_NET_001',
      level: ErrorLevel.ERROR,
      category: ErrorCategory.NETWORK,
      message: 'Network timeout',
      description: 'Network request timed out',
      possibleCauses: [
        'Slow network connection',
        'Server overload',
        'Large data payload'
      ],
      suggestedFixes: [
        'Check network connection',
        'Reduce batch size',
        'Increase timeout duration'
      ],
      recoveryStrategy: RecoveryStrategy.RETRY_WITH_BACKOFF,
      maxRetries: 3
    });

    // Validation Errors
    this.registerError({
      code: 'ERR_VAL_001',
      level: ErrorLevel.WARNING,
      category: ErrorCategory.VALIDATION,
      message: 'Validation failed',
      description: 'Data validation check failed',
      possibleCauses: [
        'Invalid data format',
        'Missing required fields',
        'Business rule violation'
      ],
      suggestedFixes: [
        'Review validation rules',
        'Check data completeness',
        'Fix data format issues'
      ],
      recoveryStrategy: RecoveryStrategy.SKIP
    });

    // Resource Errors
    this.registerError({
      code: 'ERR_RES_001',
      level: ErrorLevel.CRITICAL,
      category: ErrorCategory.RESOURCE,
      message: 'Out of memory',
      description: 'System ran out of available memory',
      possibleCauses: [
        'Large dataset',
        'Memory leak',
        'Insufficient system resources'
      ],
      suggestedFixes: [
        'Reduce batch size',
        'Free up system memory',
        'Optimize data processing'
      ],
      recoveryStrategy: RecoveryStrategy.ROLLBACK
    });

    // Timeout Errors
    this.registerError({
      code: 'ERR_TIME_001',
      level: ErrorLevel.ERROR,
      category: ErrorCategory.TIMEOUT,
      message: 'Operation timeout',
      description: 'Operation exceeded time limit',
      possibleCauses: [
        'Slow processing',
        'Deadlock',
        'Resource contention'
      ],
      suggestedFixes: [
        'Increase timeout limit',
        'Optimize processing logic',
        'Check for deadlocks'
      ],
      recoveryStrategy: RecoveryStrategy.RETRY,
      maxRetries: 2
    });
  }

  /**
   * 에러 등록
   */
  public registerError(entry: ErrorCatalogEntry): void {
    this.errorCatalog.set(entry.code, entry);
  }

  /**
   * 에러 처리
   */
  public async handleError(error: Error | MigrationError | any): Promise<RecoveryStrategy> {
    // Circuit Breaker 체크
    if (this.isCircuitOpen()) {
      console.log('⚡ Circuit breaker is OPEN, rejecting operation');
      return RecoveryStrategy.NONE;
    }

    // 에러 분류
    const migrationError = this.classifyError(error);

    // 에러 기록
    this.recordError(migrationError);

    // 모니터링에 알림
    migrationMonitor.recordError(migrationError.message, migrationError.level === ErrorLevel.CRITICAL);

    // 복구 전략 결정
    const strategy = await this.determineRecoveryStrategy(migrationError);

    // 복구 실행
    if (strategy !== RecoveryStrategy.NONE) {
      await this.executeRecovery(migrationError, strategy);
    }

    // Circuit Breaker 업데이트
    this.updateCircuitBreaker(migrationError);

    return strategy;
  }

  /**
   * 에러 분류
   */
  private classifyError(error: any): MigrationError {
    // 이미 분류된 에러인 경우
    if (error.code && this.errorCatalog.has(error.code)) {
      const catalogEntry = this.errorCatalog.get(error.code)!;
      return {
        id: this.generateErrorId(),
        code: error.code,
        level: catalogEntry.level,
        category: catalogEntry.category,
        message: error.message || catalogEntry.message,
        timestamp: new Date(),
        context: error.context,
        stack: error.stack,
        recoveryStrategy: catalogEntry.recoveryStrategy
      };
    }

    // 에러 메시지로 분류 시도
    const errorMessage = error.message || error.toString();
    let category = ErrorCategory.UNKNOWN;
    let level = ErrorLevel.ERROR;

    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      category = ErrorCategory.TIMEOUT;
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      category = ErrorCategory.NETWORK;
    } else if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      category = ErrorCategory.VALIDATION;
      level = ErrorLevel.WARNING;
    } else if (errorMessage.includes('memory') || errorMessage.includes('heap')) {
      category = ErrorCategory.RESOURCE;
      level = ErrorLevel.CRITICAL;
    }

    return {
      id: this.generateErrorId(),
      code: 'ERR_UNKNOWN',
      level,
      category,
      message: errorMessage,
      timestamp: new Date(),
      stack: error.stack,
      recoveryStrategy: RecoveryStrategy.NONE
    };
  }

  /**
   * 복구 전략 결정
   */
  private async determineRecoveryStrategy(error: MigrationError): Promise<RecoveryStrategy> {
    // 카탈로그에서 전략 확인
    if (error.code && this.errorCatalog.has(error.code)) {
      const catalogEntry = this.errorCatalog.get(error.code)!;
      return catalogEntry.recoveryStrategy;
    }

    // 레벨별 기본 전략
    switch (error.level) {
      case ErrorLevel.CRITICAL:
        return RecoveryStrategy.ROLLBACK;
      case ErrorLevel.ERROR:
        return RecoveryStrategy.RETRY;
      case ErrorLevel.WARNING:
        return RecoveryStrategy.SKIP;
      default:
        return RecoveryStrategy.NONE;
    }
  }

  /**
   * 복구 실행
   */
  private async executeRecovery(error: MigrationError, strategy: RecoveryStrategy): Promise<void> {
    console.log(`🔧 Executing recovery strategy: ${strategy} for error ${error.code}`);

    switch (strategy) {
      case RecoveryStrategy.RETRY:
        await this.retryOperation(error);
        break;

      case RecoveryStrategy.RETRY_WITH_BACKOFF:
        await this.retryWithBackoff(error);
        break;

      case RecoveryStrategy.SKIP:
        console.log(`⏭️ Skipping failed operation for ${error.code}`);
        break;

      case RecoveryStrategy.ROLLBACK:
        await this.rollback();
        break;

      case RecoveryStrategy.MANUAL:
        console.log(`🤚 Manual intervention required for ${error.code}`);
        this.notifyManualIntervention(error);
        break;

      default:
        console.log(`ℹ️ No recovery action for ${error.code}`);
    }
  }

  /**
   * 재시도
   */
  private async retryOperation(error: MigrationError): Promise<void> {
    const maxRetries = this.getMaxRetries(error.code);
    const currentRetry = error.retryCount || 0;

    if (currentRetry >= maxRetries) {
      console.log(`❌ Max retries (${maxRetries}) exceeded for ${error.code}`);
      return;
    }

    console.log(`🔄 Retrying operation (${currentRetry + 1}/${maxRetries})...`);
    error.retryCount = currentRetry + 1;

    // 실제 재시도 로직은 MigrationManager에서 처리
    // 여기서는 재시도 결정만
  }

  /**
   * Backoff 재시도
   */
  private async retryWithBackoff(error: MigrationError): Promise<void> {
    const maxRetries = this.getMaxRetries(error.code);
    const currentRetry = error.retryCount || 0;

    if (currentRetry >= maxRetries) {
      console.log(`❌ Max retries (${maxRetries}) exceeded for ${error.code}`);
      return;
    }

    // Exponential backoff 계산
    const baseDelay = 1000; // 1초
    const delay = baseDelay * Math.pow(2, currentRetry);
    const maxDelay = 30000; // 최대 30초
    const actualDelay = Math.min(delay, maxDelay);

    console.log(`⏱️ Waiting ${actualDelay}ms before retry (${currentRetry + 1}/${maxRetries})...`);

    await new Promise(resolve => setTimeout(resolve, actualDelay));

    error.retryCount = currentRetry + 1;
  }

  /**
   * 최대 재시도 횟수 조회
   */
  private getMaxRetries(errorCode?: string): number {
    if (errorCode && this.errorCatalog.has(errorCode)) {
      return this.errorCatalog.get(errorCode)!.maxRetries || 3;
    }
    return 3; // 기본값
  }

  /**
   * 스냅샷 생성
   */
  public createSnapshot(state: any, metadata?: any): string {
    const snapshot: RollbackSnapshot = {
      id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      state: JSON.parse(JSON.stringify(state)), // Deep copy
      metadata
    };

    this.snapshots.push(snapshot);

    // 스냅샷 개수 제한
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }

    console.log(`📸 Created snapshot: ${snapshot.id}`);
    return snapshot.id;
  }

  /**
   * 롤백 실행
   */
  public async rollback(snapshotId?: string): Promise<boolean> {
    console.log(`⏮️ Initiating rollback${snapshotId ? ` to snapshot ${snapshotId}` : ''}`);

    let snapshot: RollbackSnapshot | undefined;

    if (snapshotId) {
      snapshot = this.snapshots.find(s => s.id === snapshotId);
    } else {
      // 최근 스냅샷 사용
      snapshot = this.snapshots[this.snapshots.length - 1];
    }

    if (!snapshot) {
      console.error('❌ No snapshot available for rollback');
      return false;
    }

    try {
      // 실제 롤백 로직은 MigrationManager에서 처리
      // 여기서는 스냅샷 제공만
      console.log(`✅ Rollback to snapshot ${snapshot.id} initiated`);
      return true;

    } catch (error) {
      console.error('❌ Rollback failed:', error);
      return false;
    }
  }

  /**
   * Circuit Breaker 업데이트
   */
  private updateCircuitBreaker(error: MigrationError): void {
    if (error.level === ErrorLevel.CRITICAL || error.level === ErrorLevel.ERROR) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.failureThreshold) {
        this.openCircuit();
      }
    }

    // Half-open 상태에서 성공 시 닫기
    if (this.circuitState === CircuitState.HALF_OPEN && !error) {
      this.closeCircuit();
    }
  }

  /**
   * Circuit 열기
   */
  private openCircuit(): void {
    this.circuitState = CircuitState.OPEN;
    console.log('⚡ Circuit breaker OPENED - blocking operations');

    // 자동 리셋 타이머
    setTimeout(() => {
      this.circuitState = CircuitState.HALF_OPEN;
      console.log('⚡ Circuit breaker HALF-OPEN - testing recovery');
    }, this.resetTimeout);
  }

  /**
   * Circuit 닫기
   */
  private closeCircuit(): void {
    this.circuitState = CircuitState.CLOSED;
    this.failureCount = 0;
    console.log('⚡ Circuit breaker CLOSED - normal operation');
  }

  /**
   * Circuit 상태 확인
   */
  public isCircuitOpen(): boolean {
    return this.circuitState === CircuitState.OPEN;
  }

  /**
   * 수동 개입 알림
   */
  private notifyManualIntervention(error: MigrationError): void {
    // UI 알림 또는 로그
    console.warn(`🤚 MANUAL INTERVENTION REQUIRED:
    Error Code: ${error.code}
    Message: ${error.message}
    Category: ${error.category}
    Level: ${error.level}

    Please check the error details and take appropriate action.`);
  }

  /**
   * 에러 기록
   */
  private recordError(error: MigrationError): void {
    this.errorHistory.push(error);

    // 이력 크기 제한
    if (this.errorHistory.length > 100) {
      this.errorHistory = this.errorHistory.slice(-50);
    }
  }

  /**
   * 에러 ID 생성
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 에러 이력 조회
   */
  public getErrorHistory(limit?: number): MigrationError[] {
    if (limit) {
      return this.errorHistory.slice(-limit);
    }
    return [...this.errorHistory];
  }

  /**
   * 에러 통계
   */
  public getErrorStatistics(): {
    total: number;
    byLevel: Record<string, number>;
    byCategory: Record<string, number>;
    recentErrors: MigrationError[];
    circuitState: CircuitState;
  } {
    const stats = {
      total: this.errorHistory.length,
      byLevel: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      recentErrors: this.errorHistory.slice(-5),
      circuitState: this.circuitState
    };

    this.errorHistory.forEach(error => {
      stats.byLevel[error.level] = (stats.byLevel[error.level] || 0) + 1;
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
    });

    return stats;
  }

  /**
   * 초기화
   */
  public reset(): void {
    this.errorHistory = [];
    this.snapshots = [];
    this.closeCircuit();
    console.log('🔄 Error handler reset');
  }
}

// 싱글톤 인스턴스
export const migrationErrorHandler = MigrationErrorHandler.getInstance();