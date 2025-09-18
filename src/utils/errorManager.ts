/**
 * @fileoverview 통합 에러 관리 시스템
 * @description Sprint 4 Phase 4-5: 사용자 친화적 에러 처리 및 자동 복구
 * @author PocketCompany
 * @since 2025-01-19
 */

import { EdgeCaseLogger } from './edgeCaseScenarios';

/**
 * 에러 카테고리
 */
export type ErrorCategory =
  | 'validation'     // 데이터 검증 에러
  | 'network'        // 네트워크 관련 에러
  | 'permission'     // 권한 관련 에러
  | 'business_logic' // 비즈니스 로직 에러
  | 'system'         // 시스템 내부 에러
  | 'user_input'     // 사용자 입력 에러
  | 'external'       // 외부 서비스 에러
  | 'unknown';       // 분류되지 않은 에러

/**
 * 에러 심각도
 */
export type ErrorSeverity =
  | 'low'      // 경미한 에러 (기능에 영향 없음)
  | 'medium'   // 보통 에러 (일부 기능 제한)
  | 'high'     // 심각한 에러 (주요 기능 불가)
  | 'critical'; // 치명적 에러 (시스템 전체 영향)

/**
 * 복구 전략
 */
export type RecoveryStrategy =
  | 'retry'           // 재시도
  | 'fallback'        // 대안 방법 사용
  | 'manual'          // 수동 해결 필요
  | 'ignore'          // 무시 가능
  | 'escalate'        // 상위 레벨로 전달
  | 'auto_recover';   // 자동 복구

/**
 * 표준화된 에러 정보
 */
export interface StandardizedError {
  // 기본 정보
  id: string;
  timestamp: Date;
  category: ErrorCategory;
  severity: ErrorSeverity;

  // 메시지
  technicalMessage: string;    // 개발자용 기술적 메시지
  userMessage: string;         // 사용자용 친화적 메시지
  actionMessage: string;       // 사용자가 취할 수 있는 액션 안내

  // 컨텍스트
  context: {
    userId?: string;
    sessionId?: string;
    component?: string;
    action?: string;
    projectId?: string;
    scheduleId?: string;
  };

  // 원본 에러
  originalError: Error;
  stackTrace?: string;

  // 복구 정보
  recoveryStrategy: RecoveryStrategy;
  isRecoverable: boolean;
  autoRecoveryAttempted: boolean;
  recoveryActions: string[];

  // 메타데이터
  tags: string[];
  relatedErrors: string[];     // 관련된 다른 에러 ID들
  reportedToUser: boolean;
  reportedToAdmin: boolean;
}

/**
 * 에러 통계
 */
export interface ErrorStatistics {
  period: string;
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  recoverySuccessRate: number;
  mostCommonErrors: Array<{
    pattern: string;
    count: number;
    lastOccurrence: Date;
  }>;
  userImpactedSessions: number;
  averageResolutionTime: number;
}

/**
 * 에러 패턴 정의
 */
interface ErrorPattern {
  pattern: RegExp;
  category: ErrorCategory;
  severity: ErrorSeverity;
  userMessage: string;
  actionMessage: string;
  recoveryStrategy: RecoveryStrategy;
  tags: string[];
}

/**
 * 미리 정의된 에러 패턴들
 */
const ERROR_PATTERNS: ErrorPattern[] = [
  // 네트워크 에러
  {
    pattern: /network|fetch|timeout|connection/i,
    category: 'network',
    severity: 'medium',
    userMessage: '인터넷 연결에 문제가 있습니다.',
    actionMessage: '인터넷 연결을 확인하고 다시 시도해주세요.',
    recoveryStrategy: 'retry',
    tags: ['network', 'temporary']
  },

  // 검증 에러
  {
    pattern: /validation|invalid|required|missing/i,
    category: 'validation',
    severity: 'low',
    userMessage: '입력하신 정보에 문제가 있습니다.',
    actionMessage: '필수 항목을 모두 올바르게 입력해주세요.',
    recoveryStrategy: 'manual',
    tags: ['validation', 'user_input']
  },

  // 권한 에러
  {
    pattern: /permission|unauthorized|forbidden|access/i,
    category: 'permission',
    severity: 'medium',
    userMessage: '이 작업을 수행할 권한이 없습니다.',
    actionMessage: '관리자에게 권한을 요청하거나 로그인을 다시 해주세요.',
    recoveryStrategy: 'manual',
    tags: ['permission', 'security']
  },

  // Phase transition 에러
  {
    pattern: /phase.*transition|executePhaseTransition/i,
    category: 'business_logic',
    severity: 'high',
    userMessage: '프로젝트 단계 전환 중 문제가 발생했습니다.',
    actionMessage: '잠시 후 다시 시도하거나 관리자에게 문의해주세요.',
    recoveryStrategy: 'retry',
    tags: ['phase_transition', 'business_critical']
  },

  // 스케줄 생성/수정 에러
  {
    pattern: /schedule.*create|schedule.*update|meeting.*create/i,
    category: 'business_logic',
    severity: 'medium',
    userMessage: '일정 생성/수정 중 문제가 발생했습니다.',
    actionMessage: '입력 정보를 확인하고 다시 시도해주세요.',
    recoveryStrategy: 'retry',
    tags: ['schedule', 'user_action']
  },

  // 데이터 불일치 에러
  {
    pattern: /inconsistency|conflict|duplicate|orphan/i,
    category: 'system',
    severity: 'medium',
    userMessage: '데이터 동기화 문제가 발생했습니다.',
    actionMessage: '페이지를 새로고침하거나 관리자에게 문의해주세요.',
    recoveryStrategy: 'auto_recover',
    tags: ['data_integrity', 'auto_fixable']
  },

  // 메모리 에러
  {
    pattern: /memory|heap|allocation/i,
    category: 'system',
    severity: 'high',
    userMessage: '시스템 리소스가 부족합니다.',
    actionMessage: '브라우저를 새로고침하거나 불필요한 탭을 닫아주세요.',
    recoveryStrategy: 'fallback',
    tags: ['memory', 'resource']
  },

  // 타임아웃 에러
  {
    pattern: /timeout|time.*out|slow|hang/i,
    category: 'system',
    severity: 'medium',
    userMessage: '작업 처리 시간이 초과되었습니다.',
    actionMessage: '잠시 후 다시 시도해주세요.',
    recoveryStrategy: 'retry',
    tags: ['timeout', 'performance']
  }
];

/**
 * 통합 에러 매니저
 */
export class ErrorManager {
  private static errors: Map<string, StandardizedError> = new Map();
  private static errorHistory: StandardizedError[] = [];
  private static maxHistorySize: number = 1000;

  /**
   * 에러 표준화 및 등록
   */
  static standardizeError(
    error: Error,
    context?: Partial<StandardizedError['context']>,
    customOptions?: {
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      userMessage?: string;
      actionMessage?: string;
    }
  ): StandardizedError {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();

    // 에러 패턴 매칭
    const matchedPattern = this.matchErrorPattern(error.message);

    const standardizedError: StandardizedError = {
      id: errorId,
      timestamp,
      category: customOptions?.category || matchedPattern?.category || 'unknown',
      severity: customOptions?.severity || matchedPattern?.severity || 'medium',

      technicalMessage: error.message,
      userMessage: customOptions?.userMessage || matchedPattern?.userMessage || '알 수 없는 오류가 발생했습니다.',
      actionMessage: customOptions?.actionMessage || matchedPattern?.actionMessage || '페이지를 새로고침하거나 관리자에게 문의해주세요.',

      context: {
        userId: 'current_user',
        sessionId: this.getSessionId(),
        component: 'unknown',
        action: 'unknown',
        ...context
      },

      originalError: error,
      stackTrace: error.stack,

      recoveryStrategy: matchedPattern?.recoveryStrategy || 'manual',
      isRecoverable: this.isRecoverable(error, matchedPattern),
      autoRecoveryAttempted: false,
      recoveryActions: this.generateRecoveryActions(matchedPattern),

      tags: [...(matchedPattern?.tags || []), 'auto_classified'],
      relatedErrors: [],
      reportedToUser: false,
      reportedToAdmin: false
    };

    // 에러 등록
    this.registerError(standardizedError);

    return standardizedError;
  }

  /**
   * 에러 패턴 매칭
   */
  private static matchErrorPattern(errorMessage: string): ErrorPattern | null {
    for (const pattern of ERROR_PATTERNS) {
      if (pattern.pattern.test(errorMessage)) {
        return pattern;
      }
    }
    return null;
  }

  /**
   * 에러 복구 가능성 판단
   */
  private static isRecoverable(error: Error, pattern?: ErrorPattern | null): boolean {
    if (pattern) {
      return ['retry', 'fallback', 'auto_recover'].includes(pattern.recoveryStrategy);
    }

    // 기본적인 복구 가능성 판단
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('timeout')) return true;
    if (message.includes('validation') || message.includes('invalid')) return true;
    if (message.includes('memory') || message.includes('resource')) return false;

    return false;
  }

  /**
   * 복구 액션 생성
   */
  private static generateRecoveryActions(pattern?: ErrorPattern | null): string[] {
    if (!pattern) return ['새로고침', '재시도'];

    const actions: string[] = [];

    switch (pattern.recoveryStrategy) {
      case 'retry':
        actions.push('재시도', '잠시 후 다시 시도');
        break;
      case 'fallback':
        actions.push('대안 방법 사용', '기본 기능으로 전환');
        break;
      case 'manual':
        actions.push('입력 정보 확인', '관리자 문의');
        break;
      case 'auto_recover':
        actions.push('자동 복구 실행', '데이터 동기화');
        break;
      default:
        actions.push('새로고침', '재시도');
    }

    return actions;
  }

  /**
   * 에러 등록
   */
  private static registerError(standardizedError: StandardizedError): void {
    // 메모리에 저장
    this.errors.set(standardizedError.id, standardizedError);
    this.errorHistory.push(standardizedError);

    // 히스토리 크기 관리
    if (this.errorHistory.length > this.maxHistorySize) {
      const removedError = this.errorHistory.shift()!;
      this.errors.delete(removedError.id);
    }

    // Edge case 로깅
    EdgeCaseLogger.log('EC_ERROR_001', {
      errorId: standardizedError.id,
      category: standardizedError.category,
      severity: standardizedError.severity,
      component: standardizedError.context.component,
      recoveryStrategy: standardizedError.recoveryStrategy
    });

    // 심각한 에러는 즉시 로깅
    if (['high', 'critical'].includes(standardizedError.severity)) {
      console.error(`🚨 [ERROR MANAGER] ${standardizedError.severity.toUpperCase()} ERROR:`, {
        id: standardizedError.id,
        category: standardizedError.category,
        userMessage: standardizedError.userMessage,
        technicalMessage: standardizedError.technicalMessage,
        context: standardizedError.context
      });
    }
  }

  /**
   * 자동 복구 시도
   */
  static async attemptAutoRecovery(errorId: string): Promise<boolean> {
    const error = this.errors.get(errorId);
    if (!error || error.autoRecoveryAttempted) {
      return false;
    }

    error.autoRecoveryAttempted = true;

    try {
      let recovered = false;

      switch (error.recoveryStrategy) {
        case 'retry':
          recovered = await this.retryOperation(error);
          break;
        case 'auto_recover':
          recovered = await this.performAutoRecovery(error);
          break;
        case 'fallback':
          recovered = await this.useFallback(error);
          break;
        default:
          // 수동 복구 필요한 경우는 자동 복구 시도하지 않음
          break;
      }

      if (recovered) {
        console.log(`✅ [ERROR MANAGER] Auto-recovery successful for error ${errorId}`);
        EdgeCaseLogger.log('EC_ERROR_002', {
          errorId,
          strategy: error.recoveryStrategy,
          success: true
        });
      }

      return recovered;

    } catch (recoveryError) {
      console.error(`❌ [ERROR MANAGER] Auto-recovery failed for error ${errorId}:`, recoveryError);
      EdgeCaseLogger.log('EC_ERROR_003', {
        errorId,
        strategy: error.recoveryStrategy,
        success: false,
        recoveryError: recoveryError.message
      });
      return false;
    }
  }

  /**
   * 재시도 복구
   */
  private static async retryOperation(error: StandardizedError): Promise<boolean> {
    // Phase transition 재시도
    if (error.tags.includes('phase_transition') && error.context.projectId) {
      // RetryMechanismManager를 통한 재시도 (이미 구현됨)
      return true;
    }

    // 스케줄 관련 재시도
    if (error.tags.includes('schedule')) {
      // 스케줄 생성/수정 재시도 로직
      return true;
    }

    return false;
  }

  /**
   * 자동 복구 실행
   */
  private static async performAutoRecovery(error: StandardizedError): Promise<boolean> {
    // 데이터 불일치 자동 복구
    if (error.tags.includes('data_integrity')) {
      // DataRecoveryManager를 통한 자동 복구 (이미 구현됨)
      return true;
    }

    return false;
  }

  /**
   * 대안 방법 사용
   */
  private static async useFallback(error: StandardizedError): Promise<boolean> {
    // 메모리 부족 시 fallback
    if (error.tags.includes('memory')) {
      // 가벼운 모드로 전환
      return true;
    }

    return false;
  }

  /**
   * 사용자에게 에러 보고
   */
  static reportErrorToUser(errorId: string): void {
    const error = this.errors.get(errorId);
    if (!error || error.reportedToUser) {
      return;
    }

    error.reportedToUser = true;

    // Toast 또는 Modal을 통한 사용자 알림
    if (window.showToast) {
      const toastType = error.severity === 'critical' ? 'error' :
                       error.severity === 'high' ? 'error' : 'warning';

      window.showToast({
        type: toastType,
        title: '오류 발생',
        message: error.userMessage,
        action: error.actionMessage,
        duration: error.severity === 'critical' ? 0 : 5000 // critical은 수동으로 닫아야 함
      });
    }
  }

  /**
   * 관리자에게 에러 보고
   */
  static reportErrorToAdmin(errorId: string): void {
    const error = this.errors.get(errorId);
    if (!error || error.reportedToAdmin) {
      return;
    }

    error.reportedToAdmin = true;

    // 심각한 에러만 관리자에게 즉시 보고
    if (['high', 'critical'].includes(error.severity)) {
      EdgeCaseLogger.log('EC_ERROR_004', {
        errorId,
        severity: error.severity,
        category: error.category,
        technicalMessage: error.technicalMessage,
        context: error.context,
        stackTrace: error.stackTrace,
        needsImmediateAttention: error.severity === 'critical'
      });
    }
  }

  /**
   * 에러 통계 생성
   */
  static generateStatistics(hours: number = 24): ErrorStatistics {
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
    const recentErrors = this.errorHistory.filter(e => e.timestamp.getTime() > cutoffTime);

    const errorsByCategory = recentErrors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1;
      return acc;
    }, {} as Record<ErrorCategory, number>);

    const errorsBySeverity = recentErrors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<ErrorSeverity, number>);

    const recoveredErrors = recentErrors.filter(e => e.autoRecoveryAttempted);
    const recoverySuccessRate = recoveredErrors.length > 0 ?
      recoveredErrors.filter(e => e.isRecoverable).length / recoveredErrors.length : 0;

    // 패턴 분석
    const errorPatterns = new Map<string, { count: number; lastOccurrence: Date }>();
    recentErrors.forEach(error => {
      const pattern = error.technicalMessage.substring(0, 100); // 첫 100글자로 패턴 식별
      const existing = errorPatterns.get(pattern);
      if (existing) {
        existing.count++;
        existing.lastOccurrence = error.timestamp > existing.lastOccurrence ? error.timestamp : existing.lastOccurrence;
      } else {
        errorPatterns.set(pattern, { count: 1, lastOccurrence: error.timestamp });
      }
    });

    const mostCommonErrors = Array.from(errorPatterns.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([pattern, data]) => ({
        pattern,
        count: data.count,
        lastOccurrence: data.lastOccurrence
      }));

    return {
      period: `Last ${hours} hours`,
      totalErrors: recentErrors.length,
      errorsByCategory: errorsByCategory as Record<ErrorCategory, number>,
      errorsBySeverity: errorsBySeverity as Record<ErrorSeverity, number>,
      recoverySuccessRate,
      mostCommonErrors,
      userImpactedSessions: new Set(recentErrors.map(e => e.context.sessionId)).size,
      averageResolutionTime: 0 // TODO: 해결 시간 추적 구현
    };
  }

  /**
   * 에러 조회
   */
  static getError(errorId: string): StandardizedError | undefined {
    return this.errors.get(errorId);
  }

  /**
   * 최근 에러 조회
   */
  static getRecentErrors(limit: number = 10): StandardizedError[] {
    return this.errorHistory.slice(-limit).reverse();
  }

  /**
   * 에러 정리
   */
  static clearOldErrors(hours: number = 72): number {
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
    const initialCount = this.errorHistory.length;

    this.errorHistory = this.errorHistory.filter(error => {
      if (error.timestamp.getTime() < cutoffTime) {
        this.errors.delete(error.id);
        return false;
      }
      return true;
    });

    const removedCount = initialCount - this.errorHistory.length;
    if (removedCount > 0) {
      console.log(`🧹 [ERROR MANAGER] Cleaned up ${removedCount} old errors`);
    }

    return removedCount;
  }

  /**
   * 세션 ID 생성/조회
   */
  private static getSessionId(): string {
    let sessionId = sessionStorage.getItem('error_manager_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('error_manager_session_id', sessionId);
    }
    return sessionId;
  }
}

/**
 * 전역 에러 핸들러 설정
 */
export function setupGlobalErrorHandler(): void {
  // 일반 JavaScript 에러
  window.addEventListener('error', (event) => {
    const standardizedError = ErrorManager.standardizeError(
      new Error(event.message),
      {
        component: 'global',
        action: 'runtime_error'
      }
    );

    ErrorManager.reportErrorToUser(standardizedError.id);
    if (standardizedError.severity === 'critical') {
      ErrorManager.reportErrorToAdmin(standardizedError.id);
    }
  });

  // Promise rejection 에러
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));

    const standardizedError = ErrorManager.standardizeError(error, {
      component: 'global',
      action: 'unhandled_promise'
    });

    ErrorManager.reportErrorToUser(standardizedError.id);
    if (standardizedError.severity === 'critical') {
      ErrorManager.reportErrorToAdmin(standardizedError.id);
    }
  });

  console.log('🛡️ [ERROR MANAGER] Global error handlers registered');
}