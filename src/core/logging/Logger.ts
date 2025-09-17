/**
 * Logger.ts
 *
 * 중앙 집중식 로깅 시스템
 * 구조화된 로깅, 레벨 관리, 성능 모니터링, 에러 추적에 중점
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  component: string;
  context?: any;
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  stack?: string;
  performance?: {
    duration?: number;
    memory?: number;
    cpu?: number;
  };
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enablePersistence: boolean;
  maxBufferSize: number;
  flushInterval: number;
  includeStack: boolean;
  includePerformance: boolean;
  correlationIdGenerator?: () => string;
  redactFields?: string[];
}

// 에러 분류
export interface ErrorCategory {
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  userFacing: boolean;
}

// 성능 메트릭
export interface PerformanceMetrics {
  averageResponseTime: number;
  errorRate: number;
  throughput: number;
  memoryUsage: number;
  activeOperations: number;
}

export class Logger {
  private static instance: Logger | null = null;
  private config: Required<LoggerConfig>;
  private buffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private metrics: Map<string, number> = new Map();
  private errorCategories: Map<string, ErrorCategory> = new Map();
  private activeOperations: Map<string, { start: number; context: any }> = new Map();

  private readonly LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4
  };

  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: 'info',
      enableConsole: true,
      enablePersistence: false,
      maxBufferSize: 1000,
      flushInterval: 5000,
      includeStack: true,
      includePerformance: true,
      correlationIdGenerator: () => `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      redactFields: ['password', 'token', 'secret', 'key'],
      ...config
    };

    // 환경별 설정 조정
    if (process.env.NODE_ENV === 'production') {
      this.config.level = 'warn';
      this.config.enableConsole = false;
      this.config.enablePersistence = true;
    } else if (process.env.NODE_ENV === 'development') {
      this.config.level = 'debug';
      this.config.enableConsole = true;
    }

    this.setupErrorCategories();
    this.startFlushTimer();
    this.setupCleanup();

    this.info('Logger initialized', { config: this.config });
  }

  public static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  // 로그 레벨별 메서드
  public debug(message: string, context?: any, component = 'System'): void {
    this.log('debug', message, context, component);
  }

  public info(message: string, context?: any, component = 'System'): void {
    this.log('info', message, context, component);
  }

  public warn(message: string, context?: any, component = 'System'): void {
    this.log('warn', message, context, component);
  }

  public error(message: string, error?: Error | any, component = 'System'): void {
    const context = error instanceof Error
      ? {
          error: error.message,
          stack: error.stack,
          name: error.name
        }
      : error;

    this.log('error', message, context, component);
  }

  public fatal(message: string, error?: Error | any, component = 'System'): void {
    const context = error instanceof Error
      ? {
          error: error.message,
          stack: error.stack,
          name: error.name
        }
      : error;

    this.log('fatal', message, context, component);
  }

  // 구조화된 에러 로깅
  public logError(
    error: Error,
    component: string,
    context?: any,
    category?: string
  ): void {
    const errorCategory = category ? this.errorCategories.get(category) : undefined;

    const logContext = {
      ...context,
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
      category: errorCategory?.code,
      severity: errorCategory?.severity,
      retryable: errorCategory?.retryable,
      userFacing: errorCategory?.userFacing
    };

    this.log('error', `Error in ${component}`, logContext, component);

    // 중요한 에러는 즉시 플러시
    if (errorCategory?.severity === 'critical') {
      this.flush();
    }
  }

  // 성능 추적 시작
  public startOperation(operationId: string, context?: any): void {
    this.activeOperations.set(operationId, {
      start: performance.now(),
      context
    });

    this.debug(`Operation started: ${operationId}`, context, 'Performance');
  }

  // 성능 추적 종료
  public endOperation(operationId: string, context?: any): void {
    const operation = this.activeOperations.get(operationId);
    if (!operation) {
      this.warn(`Operation not found: ${operationId}`, context, 'Performance');
      return;
    }

    const duration = performance.now() - operation.start;
    this.activeOperations.delete(operationId);

    const perfContext = {
      operationId,
      duration: Math.round(duration * 100) / 100,
      ...operation.context,
      ...context
    };

    this.info(`Operation completed: ${operationId}`, perfContext, 'Performance');

    // 메트릭 업데이트
    this.updateMetrics(operationId, duration);
  }

  // 핵심 로깅 메서드
  private log(level: LogLevel, message: string, context?: any, component = 'System'): void {
    if (this.LOG_LEVELS[level] < this.LOG_LEVELS[this.config.level]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      component,
      context: this.redactSensitiveData(context),
      correlationId: this.getCurrentCorrelationId(),
      userId: this.getCurrentUserId(),
      sessionId: this.getCurrentSessionId()
    };

    // 스택 트레이스 추가 (에러 레벨 이상)
    if (this.config.includeStack && this.LOG_LEVELS[level] >= this.LOG_LEVELS.error) {
      entry.stack = new Error().stack?.split('\n').slice(2).join('\n');
    }

    // 성능 정보 추가
    if (this.config.includePerformance) {
      entry.performance = this.getPerformanceInfo();
    }

    this.addToBuffer(entry);

    // 콘솔 출력
    if (this.config.enableConsole) {
      this.outputToConsole(entry);
    }

    // 치명적 에러는 즉시 플러시
    if (level === 'fatal') {
      this.flush();
    }
  }

  // 버퍼에 로그 추가
  private addToBuffer(entry: LogEntry): void {
    this.buffer.push(entry);

    // 버퍼 크기 관리
    if (this.buffer.length > this.config.maxBufferSize) {
      this.buffer = this.buffer.slice(-this.config.maxBufferSize);
    }
  }

  // 콘솔 출력
  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.component}]`;

    const logData = {
      message: entry.message,
      context: entry.context,
      correlationId: entry.correlationId,
      ...(entry.performance && { performance: entry.performance }),
      ...(entry.stack && { stack: entry.stack })
    };

    switch (entry.level) {
      case 'debug':
        console.debug(prefix, logData);
        break;
      case 'info':
        console.info(prefix, logData);
        break;
      case 'warn':
        console.warn(prefix, logData);
        break;
      case 'error':
      case 'fatal':
        console.error(prefix, logData);
        break;
    }
  }

  // 민감한 데이터 제거
  private redactSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const redacted = { ...data };

    for (const field of this.config.redactFields) {
      if (field in redacted) {
        redacted[field] = '[REDACTED]';
      }
    }

    return redacted;
  }

  // 성능 정보 수집
  private getPerformanceInfo(): LogEntry['performance'] {
    const memInfo = this.getMemoryInfo();

    return {
      memory: memInfo,
      ...(typeof performance !== 'undefined' && {
        duration: performance.now()
      })
    };
  }

  // 메모리 정보 수집
  private getMemoryInfo(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    }

    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
    }

    return 0;
  }

  // 현재 상관관계 ID 조회
  private getCurrentCorrelationId(): string | undefined {
    // React Context나 localStorage에서 조회 가능
    return undefined;
  }

  // 현재 사용자 ID 조회
  private getCurrentUserId(): string | undefined {
    // 인증 시스템에서 조회 가능
    return undefined;
  }

  // 현재 세션 ID 조회
  private getCurrentSessionId(): string | undefined {
    // 세션 관리 시스템에서 조회 가능
    return undefined;
  }

  // 메트릭 업데이트
  private updateMetrics(operationId: string, duration: number): void {
    const key = `operation_${operationId}`;
    const currentCount = this.metrics.get(`${key}_count`) || 0;
    const currentTotal = this.metrics.get(`${key}_total`) || 0;

    this.metrics.set(`${key}_count`, currentCount + 1);
    this.metrics.set(`${key}_total`, currentTotal + duration);
    this.metrics.set(`${key}_avg`, (currentTotal + duration) / (currentCount + 1));
    this.metrics.set(`${key}_last`, duration);
  }

  // 에러 카테고리 설정
  private setupErrorCategories(): void {
    const categories: Array<[string, ErrorCategory]> = [
      ['NETWORK_ERROR', { code: 'NET_ERR', severity: 'medium', retryable: true, userFacing: true }],
      ['VALIDATION_ERROR', { code: 'VAL_ERR', severity: 'low', retryable: false, userFacing: true }],
      ['PERMISSION_ERROR', { code: 'PERM_ERR', severity: 'medium', retryable: false, userFacing: true }],
      ['SYSTEM_ERROR', { code: 'SYS_ERR', severity: 'high', retryable: false, userFacing: false }],
      ['DATA_CORRUPTION', { code: 'DATA_ERR', severity: 'critical', retryable: false, userFacing: false }]
    ];

    for (const [key, category] of categories) {
      this.errorCategories.set(key, category);
    }
  }

  // 플러시 타이머 시작
  private startFlushTimer(): void {
    if (this.config.enablePersistence && this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }

  // 로그 플러시
  public flush(): void {
    if (this.buffer.length === 0) return;

    if (this.config.enablePersistence) {
      this.persistLogs([...this.buffer]);
    }

    this.buffer = [];
  }

  // 로그 영속화 (실제 구현에서는 서버나 IndexedDB 등 사용)
  private persistLogs(logs: LogEntry[]): void {
    try {
      // 개발 중에는 localStorage 사용 (실제로는 서버 전송)
      if (typeof localStorage !== 'undefined') {
        const existing = localStorage.getItem('app_logs') || '[]';
        const existingLogs = JSON.parse(existing);
        const allLogs = [...existingLogs, ...logs].slice(-1000); // 최근 1000개만 유지
        localStorage.setItem('app_logs', JSON.stringify(allLogs));
      }
    } catch (error) {
      console.error('Failed to persist logs:', error);
    }
  }

  // 메트릭 조회
  public getMetrics(): PerformanceMetrics {
    const operations = Array.from(this.metrics.keys())
      .filter(key => key.endsWith('_avg'))
      .map(key => this.metrics.get(key) || 0);

    return {
      averageResponseTime: operations.length > 0
        ? operations.reduce((sum, avg) => sum + avg, 0) / operations.length
        : 0,
      errorRate: this.calculateErrorRate(),
      throughput: this.calculateThroughput(),
      memoryUsage: this.getMemoryInfo(),
      activeOperations: this.activeOperations.size
    };
  }

  // 에러율 계산
  private calculateErrorRate(): number {
    const errorCount = this.buffer.filter(entry =>
      entry.level === 'error' || entry.level === 'fatal'
    ).length;

    return this.buffer.length > 0 ? (errorCount / this.buffer.length) * 100 : 0;
  }

  // 처리량 계산
  private calculateThroughput(): number {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const recentLogs = this.buffer.filter(entry =>
      entry.timestamp.getTime() > oneMinuteAgo
    );

    return recentLogs.length; // 분당 로그 수
  }

  // 정리 작업 설정
  private setupCleanup(): void {
    if (typeof process !== 'undefined') {
      process.on('exit', () => this.cleanup());
      process.on('SIGINT', () => this.cleanup());
      process.on('SIGTERM', () => this.cleanup());
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.cleanup());
    }
  }

  // 정리 작업
  private cleanup(): void {
    this.info('Logger cleanup started');

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    this.flush();
    this.activeOperations.clear();
    this.metrics.clear();

    this.info('Logger cleanup completed');
  }

  // 인스턴스 리셋 (테스트용)
  public static reset(): void {
    if (Logger.instance) {
      Logger.instance.cleanup();
      Logger.instance = null;
    }
  }
}

// 기본 인스턴스 export
export const logger = Logger.getInstance();

// 편의 함수들
export const log = {
  debug: (message: string, context?: any, component?: string) =>
    logger.debug(message, context, component),
  info: (message: string, context?: any, component?: string) =>
    logger.info(message, context, component),
  warn: (message: string, context?: any, component?: string) =>
    logger.warn(message, context, component),
  error: (message: string, error?: Error | any, component?: string) =>
    logger.error(message, error, component),
  fatal: (message: string, error?: Error | any, component?: string) =>
    logger.fatal(message, error, component)
};