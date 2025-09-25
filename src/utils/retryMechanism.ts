/**
 * @fileoverview 재시도 메커니즘 시스템
 * @description Sprint 4 Phase 4-4: 실패한 Phase Transition 및 기타 작업 재시도 처리
 * @author PocketCompany
 * @since 2025-01-19
 */

import type { Project, PhaseTransitionEvent } from '../types/buildup.types';
import type { UnifiedSchedule } from '../types/schedule.types';
import { EdgeCaseLogger } from './edgeCaseScenarios';

/**
 * 재시도 가능한 작업 유형
 */
export type RetryableOperationType =
  | 'phase_transition'      // Phase 전환
  | 'schedule_creation'     // 스케줄 생성
  | 'schedule_update'       // 스케줄 업데이트
  | 'schedule_deletion'     // 스케줄 삭제
  | 'data_validation'       // 데이터 검증
  | 'data_migration'        // 데이터 마이그레이션
  | 'snapshot_creation'     // 스냅샷 생성
  | 'queue_processing';     // 큐 처리

/**
 * 재시도 전략
 */
export type RetryStrategy =
  | 'immediate'        // 즉시 재시도
  | 'linear'          // 선형 백오프 (1초, 2초, 3초...)
  | 'exponential'     // 지수 백오프 (1초, 2초, 4초, 8초...)
  | 'fibonacci'       // 피보나치 백오프 (1초, 1초, 2초, 3초, 5초...)
  | 'custom';         // 사용자 정의

/**
 * 실패 원인 분류
 */
export type FailureReason =
  | 'network_error'        // 네트워크 오류
  | 'validation_error'     // 검증 오류
  | 'resource_conflict'    // 리소스 충돌
  | 'timeout_error'        // 타임아웃
  | 'permission_error'     // 권한 오류
  | 'data_corruption'      // 데이터 손상
  | 'system_overload'      // 시스템 과부하
  | 'unknown_error';       // 알 수 없는 오류

/**
 * 재시도 설정
 */
export interface RetryConfiguration {
  maxAttempts: number;           // 최대 재시도 횟수
  strategy: RetryStrategy;       // 재시도 전략
  baseDelayMs: number;          // 기본 지연 시간 (밀리초)
  maxDelayMs: number;           // 최대 지연 시간
  timeoutMs: number;            // 작업 타임아웃
  retryableErrors: FailureReason[]; // 재시도 가능한 에러 유형
  onRetry?: (attempt: number, error: Error) => void;
  onSuccess?: (result: any, attempts: number) => void;
  onFailure?: (finalError: Error, attempts: number) => void;
}

/**
 * 재시도 작업 정보
 */
export interface RetryableOperation {
  id: string;
  type: RetryableOperationType;
  operation: () => Promise<any>;  // 실행할 작업
  config: RetryConfiguration;
  createdAt: Date;
  lastAttemptAt?: Date;
  currentAttempt: number;
  maxAttempts: number;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  errors: RetryError[];
  metadata?: any;
}

/**
 * 재시도 에러 정보
 */
export interface RetryError {
  attempt: number;
  timestamp: Date;
  error: Error;
  reason: FailureReason;
  isRetryable: boolean;
  nextRetryAt?: Date;
}

/**
 * 재시도 결과
 */
export interface RetryResult<T = any> {
  success: boolean;
  result?: T;
  attempts: number;
  totalDuration: number;
  errors: RetryError[];
  finalError?: Error;
}

/**
 * 기본 재시도 설정
 */
const DEFAULT_RETRY_CONFIGS: Record<RetryableOperationType, RetryConfiguration> = {
  phase_transition: {
    maxAttempts: 5,
    strategy: 'exponential',
    baseDelayMs: 1000,      // 1초
    maxDelayMs: 30000,      // 30초
    timeoutMs: 60000,       // 60초
    retryableErrors: ['network_error', 'system_overload', 'timeout_error']
  },
  schedule_creation: {
    maxAttempts: 3,
    strategy: 'linear',
    baseDelayMs: 500,       // 0.5초
    maxDelayMs: 5000,       // 5초
    timeoutMs: 30000,       // 30초
    retryableErrors: ['network_error', 'resource_conflict', 'timeout_error']
  },
  schedule_update: {
    maxAttempts: 3,
    strategy: 'linear',
    baseDelayMs: 500,
    maxDelayMs: 5000,
    timeoutMs: 30000,
    retryableErrors: ['network_error', 'resource_conflict', 'timeout_error']
  },
  schedule_deletion: {
    maxAttempts: 3,
    strategy: 'linear',
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    timeoutMs: 30000,
    retryableErrors: ['network_error', 'timeout_error']
  },
  data_validation: {
    maxAttempts: 2,
    strategy: 'immediate',
    baseDelayMs: 0,
    maxDelayMs: 1000,
    timeoutMs: 10000,
    retryableErrors: ['network_error']
  },
  data_migration: {
    maxAttempts: 3,
    strategy: 'exponential',
    baseDelayMs: 2000,
    maxDelayMs: 60000,
    timeoutMs: 300000,      // 5분
    retryableErrors: ['network_error', 'system_overload', 'timeout_error']
  },
  snapshot_creation: {
    maxAttempts: 3,
    strategy: 'linear',
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    timeoutMs: 60000,
    retryableErrors: ['network_error', 'system_overload', 'timeout_error']
  },
  queue_processing: {
    maxAttempts: 5,
    strategy: 'fibonacci',
    baseDelayMs: 1000,
    maxDelayMs: 60000,
    timeoutMs: 120000,      // 2분
    retryableErrors: ['network_error', 'system_overload', 'timeout_error', 'resource_conflict']
  }
};

/**
 * 재시도 메커니즘 매니저
 */
export class RetryMechanismManager {
  private static operations = new Map<string, RetryableOperation>();
  private static timers = new Map<string, NodeJS.Timeout>();

  /**
   * 재시도 가능한 작업 실행
   */
  static async executeWithRetry<T>(
    operationType: RetryableOperationType,
    operation: () => Promise<T>,
    customConfig?: Partial<RetryConfiguration>,
    metadata?: any
  ): Promise<RetryResult<T>> {
    const operationId = `retry_${operationType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const config = { ...DEFAULT_RETRY_CONFIGS[operationType], ...customConfig };

    const retryableOp: RetryableOperation = {
      id: operationId,
      type: operationType,
      operation,
      config,
      createdAt: new Date(),
      currentAttempt: 0,
      maxAttempts: config.maxAttempts,
      status: 'pending',
      errors: [],
      metadata
    };

    this.operations.set(operationId, retryableOp);

    try {
      const result = await this.executeOperation(retryableOp);
      return result;
    } finally {
      // 완료된 작업 정리
      this.cleanup(operationId);
    }
  }

  /**
   * 실제 작업 실행 (재시도 로직 포함)
   */
  private static async executeOperation<T>(retryableOp: RetryableOperation): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let result: T | undefined;
    let finalError: Error | undefined;


    while (retryableOp.currentAttempt < retryableOp.maxAttempts) {
      retryableOp.currentAttempt++;
      retryableOp.lastAttemptAt = new Date();
      retryableOp.status = 'running';


      try {
        // 타임아웃 설정
        const timeoutPromise = new Promise<never>((_, reject) => {
          const timer = setTimeout(() => {
            reject(new Error(`Operation timeout after ${retryableOp.config.timeoutMs}ms`));
          }, retryableOp.config.timeoutMs);

          this.timers.set(`${retryableOp.id}_timeout`, timer);
        });

        // 작업 실행
        result = await Promise.race([
          retryableOp.operation(),
          timeoutPromise
        ]);

        // 성공 시
        retryableOp.status = 'success';
        const totalDuration = Date.now() - startTime;


        // 성공 콜백 실행
        retryableOp.config.onSuccess?.(result, retryableOp.currentAttempt);

        EdgeCaseLogger.log('EC_RETRY_001', {
          operationType: retryableOp.type,
          operationId: retryableOp.id,
          attempts: retryableOp.currentAttempt,
          totalDuration,
          success: true
        });

        return {
          success: true,
          result,
          attempts: retryableOp.currentAttempt,
          totalDuration,
          errors: retryableOp.errors
        };

      } catch (error) {
        finalError = error as Error;
        const failureReason = this.classifyError(finalError);
        const isRetryable = retryableOp.config.retryableErrors.includes(failureReason);

        const retryError: RetryError = {
          attempt: retryableOp.currentAttempt,
          timestamp: new Date(),
          error: finalError,
          reason: failureReason,
          isRetryable
        };

        retryableOp.errors.push(retryError);


        // 재시도 불가능한 에러이거나 최대 횟수 도달 시 중단
        if (!isRetryable || retryableOp.currentAttempt >= retryableOp.maxAttempts) {
          if (!isRetryable) {
          } else {
          }
          break;
        }

        // 재시도 지연 계산 및 대기
        const delay = this.calculateDelay(
          retryableOp.config.strategy,
          retryableOp.currentAttempt,
          retryableOp.config.baseDelayMs,
          retryableOp.config.maxDelayMs
        );

        retryError.nextRetryAt = new Date(Date.now() + delay);

        console.log(`⏳ Retrying in ${delay}ms...`);

        // 재시도 콜백 실행
        retryableOp.config.onRetry?.(retryableOp.currentAttempt, finalError);

        if (delay > 0) {
          await this.sleep(delay);
        }
      }
    }

    // 모든 재시도 실패
    retryableOp.status = 'failed';
    const totalDuration = Date.now() - startTime;


    // 실패 콜백 실행
    retryableOp.config.onFailure?.(finalError!, retryableOp.currentAttempt);

    EdgeCaseLogger.log('EC_RETRY_002', {
      operationType: retryableOp.type,
      operationId: retryableOp.id,
      attempts: retryableOp.currentAttempt,
      totalDuration,
      success: false,
      finalError: finalError?.message,
      errors: retryableOp.errors.map(e => e.reason)
    });

    return {
      success: false,
      attempts: retryableOp.currentAttempt,
      totalDuration,
      errors: retryableOp.errors,
      finalError
    };
  }

  /**
   * Phase Transition 재시도 (특수 처리)
   */
  static async retryPhaseTransition(
    projectId: string,
    fromPhase: string,
    toPhase: string,
    trigger: string,
    metadata?: any
  ): Promise<RetryResult<boolean>> {
    const operation = async (): Promise<boolean> => {
      if (window.buildupContext?.executePhaseTransition) {
        await window.buildupContext.executePhaseTransition(projectId, toPhase, trigger, metadata);
        return true;
      }
      throw new Error('BuildupContext not available');
    };

    const customConfig: Partial<RetryConfiguration> = {
      onRetry: (attempt, error) => {
        EdgeCaseLogger.log('EC_RETRY_003', {
          projectId,
          fromPhase,
          toPhase,
          attempt,
          error: error.message
        });
      },
      onSuccess: (result, attempts) => {
      },
      onFailure: (error, attempts) => {
        EdgeCaseLogger.log('EC_RETRY_004', {
          projectId,
          fromPhase,
          toPhase,
          attempts,
          finalError: error.message
        });
      }
    };

    return this.executeWithRetry(
      'phase_transition',
      operation,
      customConfig,
      { projectId, fromPhase, toPhase, trigger }
    );
  }

  /**
   * 스케줄 생성 재시도
   */
  static async retryScheduleCreation<T extends UnifiedSchedule>(
    scheduleData: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<RetryResult<T>> {
    const operation = async (): Promise<T> => {
      if (window.scheduleContext?.createSchedule) {
        return await window.scheduleContext.createSchedule<T>(scheduleData);
      }
      throw new Error('ScheduleContext not available');
    };

    return this.executeWithRetry(
      'schedule_creation',
      operation,
      undefined,
      { scheduleType: scheduleData.type, title: scheduleData.title }
    );
  }

  /**
   * 데이터 마이그레이션 재시도
   */
  static async retryDataMigration(migrationFunction: () => Promise<any>): Promise<RetryResult<any>> {
    return this.executeWithRetry(
      'data_migration',
      migrationFunction,
      {
        onRetry: (attempt, error) => {
        }
      }
    );
  }

  /**
   * 에러 분류
   */
  private static classifyError(error: Error): FailureReason {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'network_error';
    }
    if (message.includes('timeout')) {
      return 'timeout_error';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation_error';
    }
    if (message.includes('conflict') || message.includes('exists')) {
      return 'resource_conflict';
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'permission_error';
    }
    if (message.includes('corruption') || message.includes('corrupted')) {
      return 'data_corruption';
    }
    if (message.includes('overload') || message.includes('busy')) {
      return 'system_overload';
    }

    return 'unknown_error';
  }

  /**
   * 재시도 지연 시간 계산
   */
  private static calculateDelay(
    strategy: RetryStrategy,
    attempt: number,
    baseDelayMs: number,
    maxDelayMs: number
  ): number {
    let delay: number;

    switch (strategy) {
      case 'immediate':
        delay = 0;
        break;

      case 'linear':
        delay = baseDelayMs * attempt;
        break;

      case 'exponential':
        delay = baseDelayMs * Math.pow(2, attempt - 1);
        break;

      case 'fibonacci':
        delay = baseDelayMs * this.fibonacci(attempt);
        break;

      case 'custom':
      default:
        delay = baseDelayMs;
        break;
    }

    return Math.min(delay, maxDelayMs);
  }

  /**
   * 피보나치 수 계산
   */
  private static fibonacci(n: number): number {
    if (n <= 1) return 1;
    if (n === 2) return 1;

    let a = 1, b = 1;
    for (let i = 3; i <= n; i++) {
      [a, b] = [b, a + b];
    }
    return b;
  }

  /**
   * 지연 대기
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 정리 작업
   */
  private static cleanup(operationId: string): void {
    // 타이머 정리
    const timeoutTimer = this.timers.get(`${operationId}_timeout`);
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      this.timers.delete(`${operationId}_timeout`);
    }

    // 작업 정보 정리 (일정 시간 후)
    setTimeout(() => {
      this.operations.delete(operationId);
    }, 300000); // 5분 후 정리
  }

  /**
   * 활성 재시도 작업 조회
   */
  static getActiveOperations(): RetryableOperation[] {
    return Array.from(this.operations.values())
      .filter(op => op.status === 'running' || op.status === 'pending');
  }

  /**
   * 재시도 통계
   */
  static getRetryStatistics(): {
    totalOperations: number;
    activeOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageAttempts: number;
    operationsByType: Record<RetryableOperationType, number>;
  } {
    const operations = Array.from(this.operations.values());

    const stats = {
      totalOperations: operations.length,
      activeOperations: operations.filter(op => op.status === 'running' || op.status === 'pending').length,
      successfulOperations: operations.filter(op => op.status === 'success').length,
      failedOperations: operations.filter(op => op.status === 'failed').length,
      averageAttempts: operations.reduce((sum, op) => sum + op.currentAttempt, 0) / operations.length || 0,
      operationsByType: {} as Record<RetryableOperationType, number>
    };

    // 타입별 통계
    for (const type of Object.keys(DEFAULT_RETRY_CONFIGS) as RetryableOperationType[]) {
      stats.operationsByType[type] = operations.filter(op => op.type === type).length;
    }

    return stats;
  }

  /**
   * 모든 재시도 작업 취소
   */
  static cancelAllOperations(): void {
    for (const [operationId, operation] of this.operations) {
      if (operation.status === 'running' || operation.status === 'pending') {
        operation.status = 'cancelled';
        this.cleanup(operationId);
      }
    }
  }
}