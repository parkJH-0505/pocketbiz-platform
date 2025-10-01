/**
 * 에러 모니터링 및 추적 시스템
 *
 * 애플리케이션에서 발생하는 모든 에러를 추적하고
 * 자동으로 복구 시도 및 사용자 알림을 처리
 */

interface ErrorLog {
  id: string;
  timestamp: number;
  type: 'javascript' | 'promise' | 'network' | 'performance' | 'user-action';
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  userId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: any;
  resolved?: boolean;
  retryCount?: number;
}

interface ErrorPattern {
  pattern: RegExp;
  description: string;
  autoFix?: () => void;
  userMessage: string;
  severity: ErrorLog['severity'];
}

class ErrorMonitor {
  private errorLogs: ErrorLog[] = [];
  private errorPatterns: ErrorPattern[] = [];
  private isMonitoring = false;
  private retryQueue: Map<string, () => Promise<void>> = new Map();

  constructor() {
    this.setupErrorPatterns();
  }

  // 에러 패턴 설정
  private setupErrorPatterns(): void {
    this.errorPatterns = [
      // 네트워크 에러
      {
        pattern: /network error|fetch failed|ERR_NETWORK/i,
        description: '네트워크 연결 문제',
        autoFix: () => {
          // 네트워크 재연결 시도
          this.retryNetworkOperations();
        },
        userMessage: '인터넷 연결을 확인해주세요.',
        severity: 'high'
      },

      // 메모리 부족
      {
        pattern: /out of memory|maximum call stack/i,
        description: '메모리 부족',
        autoFix: () => {
          // 메모리 정리
          this.performMemoryCleanup();
        },
        userMessage: '시스템 리소스가 부족합니다. 페이지를 새로고침해주세요.',
        severity: 'critical'
      },

      // 컴포넌트 렌더링 에러
      {
        pattern: /cannot read prop|undefined is not an object|null is not an object/i,
        description: '컴포넌트 데이터 문제',
        autoFix: () => {
          // 컴포넌트 상태 초기화
          this.resetComponentStates();
        },
        userMessage: '화면 로딩 중 문제가 발생했습니다.',
        severity: 'medium'
      },

      // localStorage 에러
      {
        pattern: /quota.*exceeded|storage.*full/i,
        description: '저장공간 부족',
        autoFix: () => {
          // 오래된 데이터 정리
          this.cleanupStorage();
        },
        userMessage: '저장공간이 부족합니다. 데이터를 정리합니다.',
        severity: 'medium'
      },

      // 캐시 관련 에러
      {
        pattern: /cache.*error|cache.*miss/i,
        description: '캐시 시스템 문제',
        autoFix: () => {
          // 캐시 초기화
          this.resetCache();
        },
        userMessage: '시스템 캐시를 재설정합니다.',
        severity: 'low'
      },

      // KPI 관련 에러
      {
        pattern: /kpi.*error|momentum.*error/i,
        description: 'KPI 시스템 오류',
        autoFix: () => {
          // KPI 시스템 재초기화
          this.resetKPISystem();
        },
        userMessage: 'KPI 시스템을 재설정합니다.',
        severity: 'medium'
      }
    ];
  }

  // 에러 모니터링 시작
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('[ErrorMonitor] 에러 모니터링 시작');

    // 전역 JavaScript 에러 포착
    window.addEventListener('error', this.handleGlobalError.bind(this));

    // Promise rejection 포착
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));

    // 리소스 로딩 에러 포착
    window.addEventListener('error', this.handleResourceError.bind(this), true);

    // 주기적 에러 로그 정리
    setInterval(() => {
      this.cleanupErrorLogs();
    }, 60000); // 1분마다
  }

  // 에러 모니터링 중지
  stopMonitoring(): void {
    this.isMonitoring = false;
    window.removeEventListener('error', this.handleGlobalError.bind(this));
    window.removeEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    window.removeEventListener('error', this.handleResourceError.bind(this), true);
    console.log('[ErrorMonitor] 에러 모니터링 중지');
  }

  // 전역 JavaScript 에러 처리
  private handleGlobalError(event: ErrorEvent): void {
    const errorLog: ErrorLog = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      type: 'javascript',
      message: event.message,
      stack: event.error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: localStorage.getItem('user-id') || undefined,
      severity: this.determineSeverity(event.message),
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    };

    this.logError(errorLog);
    this.attemptAutoFix(errorLog);
  }

  // Promise rejection 처리
  private handlePromiseRejection(event: PromiseRejectionEvent): void {
    const errorMessage = event.reason?.message || event.reason?.toString() || 'Promise rejected';

    const errorLog: ErrorLog = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      type: 'promise',
      message: errorMessage,
      stack: event.reason?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: localStorage.getItem('user-id') || undefined,
      severity: this.determineSeverity(errorMessage),
      context: {
        reason: event.reason
      }
    };

    this.logError(errorLog);
    this.attemptAutoFix(errorLog);
  }

  // 리소스 로딩 에러 처리
  private handleResourceError(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target || target === window) return;

    const errorLog: ErrorLog = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      type: 'network',
      message: `Failed to load resource: ${(target as any).src || (target as any).href || 'unknown'}`,
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: localStorage.getItem('user-id') || undefined,
      severity: 'medium',
      context: {
        tagName: target.tagName,
        src: (target as any).src,
        href: (target as any).href
      }
    };

    this.logError(errorLog);
  }

  // 수동 에러 로깅
  logError(errorLog: Omit<ErrorLog, 'id' | 'timestamp'> | ErrorLog): void {
    const fullErrorLog: ErrorLog = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      ...errorLog
    };

    this.errorLogs.push(fullErrorLog);
    console.error(`[ErrorMonitor] ${fullErrorLog.severity.toUpperCase()} 에러:`, fullErrorLog);

    // localStorage에 저장
    this.saveErrorToStorage(fullErrorLog);

    // 심각한 에러의 경우 즉시 알림
    if (fullErrorLog.severity === 'critical' || fullErrorLog.severity === 'high') {
      this.notifyUser(fullErrorLog);
    }
  }

  // 에러 심각도 결정
  private determineSeverity(message: string): ErrorLog['severity'] {
    const criticalPatterns = [
      /out of memory/i,
      /security error/i,
      /quota.*exceeded/i
    ];

    const highPatterns = [
      /network error/i,
      /cannot read prop.*of null/i,
      /fetch failed/i
    ];

    const mediumPatterns = [
      /cannot read prop/i,
      /undefined is not/i,
      /cache.*error/i
    ];

    if (criticalPatterns.some(pattern => pattern.test(message))) {
      return 'critical';
    }

    if (highPatterns.some(pattern => pattern.test(message))) {
      return 'high';
    }

    if (mediumPatterns.some(pattern => pattern.test(message))) {
      return 'medium';
    }

    return 'low';
  }

  // 자동 복구 시도
  private attemptAutoFix(errorLog: ErrorLog): void {
    const matchingPattern = this.errorPatterns.find(pattern =>
      pattern.pattern.test(errorLog.message)
    );

    if (matchingPattern?.autoFix) {
      console.log(`[ErrorMonitor] 자동 복구 시도: ${matchingPattern.description}`);
      try {
        matchingPattern.autoFix();
        errorLog.resolved = true;
      } catch (fixError) {
        console.error('[ErrorMonitor] 자동 복구 실패:', fixError);
      }
    }
  }

  // 네트워크 재시도
  private async retryNetworkOperations(): Promise<void> {
    // 대기 중인 네트워크 작업 재시도
    for (const [id, retryFn] of this.retryQueue) {
      try {
        await retryFn();
        this.retryQueue.delete(id);
        console.log(`[ErrorMonitor] 네트워크 재시도 성공: ${id}`);
      } catch (error) {
        console.error(`[ErrorMonitor] 네트워크 재시도 실패: ${id}`, error);
      }
    }
  }

  // 메모리 정리
  private performMemoryCleanup(): void {
    // 캐시 정리
    this.resetCache();

    // 오래된 에러 로그 정리
    this.cleanupErrorLogs();

    // localStorage 정리
    this.cleanupStorage();

    // 가비지 컬렉션 유도 (브라우저가 지원하는 경우)
    if ((window as any).gc) {
      (window as any).gc();
    }

    console.log('[ErrorMonitor] 메모리 정리 완료');
  }

  // 컴포넌트 상태 초기화
  private resetComponentStates(): void {
    // React DevTools가 있는 경우 컴포넌트 상태 재설정
    try {
      if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        console.log('[ErrorMonitor] React 컴포넌트 상태 재설정 시도');
      }
    } catch (error) {
      console.warn('[ErrorMonitor] 컴포넌트 상태 재설정 실패:', error);
    }
  }

  // 저장공간 정리
  private cleanupStorage(): void {
    const keysToRemove: string[] = [];
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // 임시 키들 정리
      if (key.includes('temp-') || key.includes('cache-') || key.includes('old-')) {
        keysToRemove.push(key);
        continue;
      }

      // 날짜 기반 정리
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const data = JSON.parse(item);
          if (data.timestamp && data.timestamp < oneWeekAgo) {
            keysToRemove.push(key);
          }
        }
      } catch {
        // JSON 파싱 실패한 오래된 데이터
        if (key.length > 100) { // 비정상적으로 긴 키
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`[ErrorMonitor] 저장공간 정리 실패: ${key}`, error);
      }
    });

    console.log(`[ErrorMonitor] 저장공간 정리 완료: ${keysToRemove.length}개 항목 제거`);
  }

  // 캐시 초기화
  private resetCache(): void {
    try {
      // Momentum 캐시 초기화
      const { momentumCache } = require('../services/momentumCache');
      momentumCache.invalidate();
      console.log('[ErrorMonitor] 캐시 초기화 완료');
    } catch (error) {
      console.warn('[ErrorMonitor] 캐시 초기화 실패:', error);
    }
  }

  // KPI 시스템 재초기화
  private resetKPISystem(): void {
    try {
      // KPI 관련 캐시 및 임시 데이터 정리
      const kpiKeys = ['kpi-cache', 'kpi-temp', 'momentum-temp'];
      kpiKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log('[ErrorMonitor] KPI 시스템 재설정 완료');
    } catch (error) {
      console.warn('[ErrorMonitor] KPI 시스템 재설정 실패:', error);
    }
  }

  // 사용자 알림
  private notifyUser(errorLog: ErrorLog): void {
    const matchingPattern = this.errorPatterns.find(pattern =>
      pattern.pattern.test(errorLog.message)
    );

    const message = matchingPattern?.userMessage || '시스템에 문제가 발생했습니다.';

    // 토스트 알림 표시 (가능한 경우)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('시스템 알림', {
        body: message,
        icon: '/favicon.ico'
      });
    } else {
      // 콘솔에 사용자 메시지 출력
      console.warn(`[사용자 알림] ${message}`);
    }
  }

  // 에러 ID 생성
  private generateErrorId(): string {
    return `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // localStorage에 에러 저장
  private saveErrorToStorage(errorLog: ErrorLog): void {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('error-logs') || '[]');
      existingLogs.push(errorLog);

      // 최대 100개 에러 로그 유지
      if (existingLogs.length > 100) {
        existingLogs.splice(0, existingLogs.length - 100);
      }

      localStorage.setItem('error-logs', JSON.stringify(existingLogs));
    } catch (error) {
      console.warn('[ErrorMonitor] 에러 로그 저장 실패:', error);
    }
  }

  // 오래된 에러 로그 정리
  private cleanupErrorLogs(): void {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    this.errorLogs = this.errorLogs.filter(log => log.timestamp > oneDayAgo);

    // localStorage 정리도 수행
    try {
      const storedLogs = JSON.parse(localStorage.getItem('error-logs') || '[]');
      const cleanedLogs = storedLogs.filter((log: ErrorLog) => log.timestamp > oneDayAgo);
      localStorage.setItem('error-logs', JSON.stringify(cleanedLogs));
    } catch (error) {
      console.warn('[ErrorMonitor] 저장된 에러 로그 정리 실패:', error);
    }
  }

  // 에러 통계 조회
  getErrorStats() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    const recentErrors = this.errorLogs.filter(log => log.timestamp > oneHourAgo);
    const todayErrors = this.errorLogs.filter(log => log.timestamp > oneDayAgo);

    const severityCounts = {
      critical: todayErrors.filter(log => log.severity === 'critical').length,
      high: todayErrors.filter(log => log.severity === 'high').length,
      medium: todayErrors.filter(log => log.severity === 'medium').length,
      low: todayErrors.filter(log => log.severity === 'low').length
    };

    const typeCounts = {
      javascript: todayErrors.filter(log => log.type === 'javascript').length,
      promise: todayErrors.filter(log => log.type === 'promise').length,
      network: todayErrors.filter(log => log.type === 'network').length,
      performance: todayErrors.filter(log => log.type === 'performance').length,
      'user-action': todayErrors.filter(log => log.type === 'user-action').length
    };

    return {
      recentCount: recentErrors.length,
      todayCount: todayErrors.length,
      totalCount: this.errorLogs.length,
      severityCounts,
      typeCounts,
      resolvedCount: todayErrors.filter(log => log.resolved).length
    };
  }

  // 에러 로그 내보내기
  exportErrorLogs(): string {
    return JSON.stringify({
      logs: this.errorLogs,
      stats: this.getErrorStats(),
      timestamp: Date.now()
    }, null, 2);
  }

  // 재시도 작업 추가
  addRetryOperation(id: string, retryFn: () => Promise<void>): void {
    this.retryQueue.set(id, retryFn);
  }
}

// 싱글톤 인스턴스
export const errorMonitor = new ErrorMonitor();

// 개발 환경에서 자동 시작
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  errorMonitor.startMonitoring();
  (window as any).errorMonitor = errorMonitor;
  console.log('💡 개발자 도구에서 "errorMonitor" 객체 사용 가능');
}