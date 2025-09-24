/**
 * errorMonitor.ts
 *
 * 에러 모니터링 시스템
 * 콘솔 에러 추적 및 분석
 */

export interface ErrorLog {
  type: 'console' | 'window' | 'promise' | 'custom';
  message: string;
  timestamp: number;
  stack?: string;
  file?: string;
  line?: number;
  column?: number;
  extra?: any;
}

export interface ErrorReport {
  totalErrors: number;
  byType: Record<string, number>;
  timeline: ErrorLog[];
  criticalErrors: ErrorLog[];
  uniqueErrors: Map<string, number>;
}

class ErrorMonitor {
  private errors: ErrorLog[] = [];
  private startTime = Date.now();
  private isMonitoring = false;
  private originalConsoleError: typeof console.error;
  private windowErrorHandler?: (event: ErrorEvent) => void;
  private unhandledRejectionHandler?: (event: PromiseRejectionEvent) => void;

  constructor() {
    this.originalConsoleError = console.error;
  }

  /**
   * 모니터링 시작
   */
  start(): void {
    if (this.isMonitoring) {
      console.warn('Error monitoring is already active');
      return;
    }

    this.isMonitoring = true;
    this.startTime = Date.now();
    this.errors = [];

    // Console error 가로채기
    console.error = (...args: any[]) => {
      const message = args
        .map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
        .join(' ');

      this.logError('console', message);
      this.originalConsoleError.apply(console, args);
    };

    // Window error 이벤트
    this.windowErrorHandler = (event: ErrorEvent) => {
      this.logError('window', event.message, {
        file: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack
      });
    };
    window.addEventListener('error', this.windowErrorHandler);

    // Unhandled promise rejection
    this.unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      const stack = reason instanceof Error ? reason.stack : undefined;

      this.logError('promise', message, { stack, reason });
    };
    window.addEventListener('unhandledrejection', this.unhandledRejectionHandler);

    console.log('📊 Error monitoring started');
  }

  /**
   * 모니터링 중지
   */
  stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    // Console 복원
    console.error = this.originalConsoleError;

    // Event listeners 제거
    if (this.windowErrorHandler) {
      window.removeEventListener('error', this.windowErrorHandler);
    }
    if (this.unhandledRejectionHandler) {
      window.removeEventListener('unhandledrejection', this.unhandledRejectionHandler);
    }

    console.log('📊 Error monitoring stopped');
  }

  /**
   * 에러 로깅
   */
  private logError(type: ErrorLog['type'], message: string, extra?: any): void {
    const error: ErrorLog = {
      type,
      message,
      timestamp: Date.now() - this.startTime,
      ...extra
    };

    this.errors.push(error);

    // Critical 에러 즉시 경고
    if (this.isCriticalError(message)) {
      console.warn('🚨 CRITICAL ERROR DETECTED:', message);
    }
  }

  /**
   * Critical 에러 판별
   */
  private isCriticalError(message: string): boolean {
    const criticalPatterns = [
      'not defined',
      'undefined is not',
      'Cannot read properties of undefined',
      'Cannot read properties of null',
      'not available',
      'not a function',
      'Maximum call stack size exceeded',
      'out of memory'
    ];

    return criticalPatterns.some(pattern =>
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * 에러 보고서 생성
   */
  getReport(): ErrorReport {
    const byType = this.groupByType();
    const uniqueErrors = this.getUniqueErrors();
    const criticalErrors = this.errors.filter(e => this.isCriticalError(e.message));

    return {
      totalErrors: this.errors.length,
      byType,
      timeline: [...this.errors],
      criticalErrors,
      uniqueErrors
    };
  }

  /**
   * 타입별 그룹화
   */
  private groupByType(): Record<string, number> {
    const groups: Record<string, number> = {};
    this.errors.forEach(e => {
      groups[e.type] = (groups[e.type] || 0) + 1;
    });
    return groups;
  }

  /**
   * 고유 에러 추출
   */
  private getUniqueErrors(): Map<string, number> {
    const unique = new Map<string, number>();
    this.errors.forEach(e => {
      const key = `${e.type}:${e.message.substring(0, 100)}`;
      unique.set(key, (unique.get(key) || 0) + 1);
    });
    return unique;
  }

  /**
   * 에러 목록 초기화
   */
  clear(): void {
    this.errors = [];
    console.log('📊 Error log cleared');
  }

  /**
   * 특정 패턴의 에러가 있는지 확인
   */
  hasErrorPattern(pattern: string | RegExp): boolean {
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
    return this.errors.some(e => regex.test(e.message));
  }

  /**
   * Stage 1-3에서 수정한 에러들이 해결되었는지 확인
   */
  checkFixedErrors(): {
    showSuccessError: boolean;
    scheduleContextError: boolean;
    unknownProjectIdError: boolean;
    totalNewErrors: number;
  } {
    return {
      showSuccessError: this.hasErrorPattern('showSuccess|showError'),
      scheduleContextError: this.hasErrorPattern('ScheduleContext not available'),
      unknownProjectIdError: this.hasErrorPattern("'unknown'|unknown project"),
      totalNewErrors: this.errors.length
    };
  }

  /**
   * 콘솔에 보고서 출력
   */
  printReport(): void {
    const report = this.getReport();

    console.group('📊 Error Monitor Report');
    console.log(`Total Errors: ${report.totalErrors}`);

    console.group('By Type:');
    Object.entries(report.byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    console.groupEnd();

    if (report.criticalErrors.length > 0) {
      console.group(`🚨 Critical Errors (${report.criticalErrors.length}):`);
      report.criticalErrors.forEach((error, index) => {
        console.error(`${index + 1}. [${error.type}] ${error.message}`);
      });
      console.groupEnd();
    }

    console.group('Unique Errors:');
    report.uniqueErrors.forEach((count, error) => {
      console.log(`  ${error} (${count}x)`);
    });
    console.groupEnd();

    const fixedStatus = this.checkFixedErrors();
    console.group('✅ Fixed Errors Status:');
    console.log(`  showSuccess/showError: ${fixedStatus.showSuccessError ? '❌ Still exists' : '✅ Fixed'}`);
    console.log(`  ScheduleContext: ${fixedStatus.scheduleContextError ? '❌ Still exists' : '✅ Fixed'}`);
    console.log(`  Unknown ProjectId: ${fixedStatus.unknownProjectIdError ? '❌ Still exists' : '✅ Fixed'}`);
    console.groupEnd();

    console.groupEnd();
  }

  /**
   * 자동 테스트 실행
   */
  runAutoTest(duration: number = 5000): Promise<ErrorReport> {
    return new Promise((resolve) => {
      this.clear();
      this.start();

      setTimeout(() => {
        this.stop();
        const report = this.getReport();
        this.printReport();
        resolve(report);
      }, duration);

      console.log(`🧪 Running error monitoring for ${duration / 1000} seconds...`);
    });
  }
}

// Singleton 인스턴스
export const errorMonitor = new ErrorMonitor();

// 개발 환경에서 전역 노출
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).__errorMonitor__ = errorMonitor;
  (window as any).__runErrorTest__ = () => errorMonitor.runAutoTest();
}