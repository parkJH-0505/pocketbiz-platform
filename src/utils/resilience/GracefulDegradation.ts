/**
 * Graceful Degradation & Error Management
 * 점진적 기능 저하 및 에러 관리 시스템
 */

import { getCacheManager } from '../cacheManager';
import { getPerformanceMonitor } from '../performanceMonitorV3';

/**
 * 기능 상태
 */
export enum FeatureStatus {
  AVAILABLE = 'available',
  DEGRADED = 'degraded',
  UNAVAILABLE = 'unavailable'
}

/**
 * 에러 심각도 레벨
 */
export enum ErrorLevel {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
  CRITICAL = 4
}

/**
 * 기능 플래그
 */
export interface FeatureFlag {
  id: string;
  name: string;
  status: FeatureStatus;
  fallbackEnabled: boolean;
  dependencies: string[];
  healthCheck?: () => Promise<boolean>;
  fallbackComponent?: React.ComponentType;
  minVersion?: string;
}

/**
 * 에러 로그 엔트리
 */
export interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  level: ErrorLevel;
  message: string;
  error?: Error;
  context?: Record<string, any>;
  stack?: string;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

/**
 * 시스템 헬스 상태
 */
export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, {
    status: 'up' | 'down' | 'degraded';
    lastCheck: Date;
    responseTime?: number;
    errorRate?: number;
  }>;
  features: Record<string, FeatureStatus>;
  metrics: {
    errorRate: number;
    avgResponseTime: number;
    uptime: number;
    memoryUsage: number;
  };
}

/**
 * Graceful Degradation Manager
 */
export class GracefulDegradationManager {
  private features: Map<string, FeatureFlag> = new Map();
  private errorLogs: ErrorLogEntry[] = [];
  private healthChecks: Map<string, () => Promise<boolean>> = new Map();
  private degradationRules: Map<string, (error: Error) => boolean> = new Map();
  private cache = getCacheManager();
  private performanceMonitor = getPerformanceMonitor();
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeFeatures();
    this.startHealthMonitoring();
  }

  /**
   * 기능 초기화
   */
  private initializeFeatures() {
    // V3 레포트 기능들
    this.registerFeature({
      id: 'advanced_insights',
      name: '고급 인사이트',
      status: FeatureStatus.AVAILABLE,
      fallbackEnabled: true,
      dependencies: ['data_pipeline', 'ai_service'],
      healthCheck: async () => {
        // AI 서비스 헬스 체크
        try {
          // 실제 구현시 API 호출
          return true;
        } catch {
          return false;
        }
      }
    });

    this.registerFeature({
      id: 'real_time_updates',
      name: '실시간 업데이트',
      status: FeatureStatus.AVAILABLE,
      fallbackEnabled: true,
      dependencies: ['websocket'],
      healthCheck: async () => {
        // WebSocket 연결 체크
        return true; // 임시
      }
    });

    this.registerFeature({
      id: 'export_pdf',
      name: 'PDF 내보내기',
      status: FeatureStatus.AVAILABLE,
      fallbackEnabled: true,
      dependencies: ['pdf_service'],
      healthCheck: async () => {
        // PDF 서비스 체크
        return true; // 임시
      }
    });
  }

  /**
   * 기능 등록
   */
  registerFeature(feature: FeatureFlag): void {
    this.features.set(feature.id, feature);
    if (feature.healthCheck) {
      this.healthChecks.set(feature.id, feature.healthCheck);
    }
  }

  /**
   * 기능 사용 가능 여부 확인
   */
  isFeatureAvailable(featureId: string): boolean {
    const feature = this.features.get(featureId);
    return feature?.status === FeatureStatus.AVAILABLE;
  }

  /**
   * 기능 저하
   */
  degradeFeature(featureId: string, reason?: string): void {
    const feature = this.features.get(featureId);
    if (feature) {
      feature.status = FeatureStatus.DEGRADED;
      this.logError(
        ErrorLevel.WARNING,
        `Feature degraded: ${featureId}`,
        undefined,
        { reason }
      );

      // 의존 기능들도 체크
      this.checkDependencies(featureId);
    }
  }

  /**
   * 기능 비활성화
   */
  disableFeature(featureId: string, error?: Error): void {
    const feature = this.features.get(featureId);
    if (feature) {
      feature.status = FeatureStatus.UNAVAILABLE;
      this.logError(
        ErrorLevel.ERROR,
        `Feature disabled: ${featureId}`,
        error
      );

      // 의존 기능들도 체크
      this.checkDependencies(featureId);
    }
  }

  /**
   * 의존성 체크
   */
  private checkDependencies(featureId: string): void {
    this.features.forEach(feature => {
      if (feature.dependencies.includes(featureId)) {
        if (feature.status === FeatureStatus.AVAILABLE) {
          this.degradeFeature(feature.id, `Dependency ${featureId} is degraded`);
        }
      }
    });
  }

  /**
   * 에러 로깅
   */
  logError(
    level: ErrorLevel,
    message: string,
    error?: Error,
    context?: Record<string, any>
  ): void {
    const entry: ErrorLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level,
      message,
      error,
      context,
      stack: error?.stack,
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // 메모리에 저장 (최대 1000개)
    this.errorLogs.push(entry);
    if (this.errorLogs.length > 1000) {
      this.errorLogs.shift();
    }

    // localStorage에 저장 (최대 100개)
    this.saveToLocalStorage(entry);

    // 콘솔 출력
    this.consoleLog(entry);

    // 심각한 에러는 서버로 전송
    if (level >= ErrorLevel.ERROR) {
      this.sendToServer(entry);
    }

    // 성능 모니터에 기록
    if (level >= ErrorLevel.WARNING) {
      this.performanceMonitor.trackAPI(
        'error_log',
        'ERROR',
        0,
        'error'
      );
    }
  }

  /**
   * localStorage 저장
   */
  private saveToLocalStorage(entry: ErrorLogEntry): void {
    try {
      const logs = JSON.parse(
        localStorage.getItem('v3_error_logs') || '[]'
      ) as ErrorLogEntry[];

      logs.push(entry);
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }

      localStorage.setItem('v3_error_logs', JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save error log to localStorage:', e);
    }
  }

  /**
   * 콘솔 로그
   */
  private consoleLog(entry: ErrorLogEntry): void {
    const prefix = this.getLogPrefix(entry.level);
    const style = this.getLogStyle(entry.level);

    console.group(`%c${prefix} ${entry.message}`, style);

    if (entry.error) {
      console.error('Error:', entry.error);
    }
    if (entry.context) {
      console.log('Context:', entry.context);
    }
    if (entry.stack) {
      console.log('Stack:', entry.stack);
    }

    console.groupEnd();
  }

  /**
   * 서버로 전송
   */
  private async sendToServer(entry: ErrorLogEntry): Promise<void> {
    if (process.env.NODE_ENV !== 'production') return;

    try {
      // 실제 구현시 에러 수집 서비스로 전송
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // });
    } catch (error) {
      console.error('Failed to send error to server:', error);
    }
  }

  /**
   * 헬스 모니터링 시작
   */
  private startHealthMonitoring(): void {
    // 5분마다 헬스 체크
    setInterval(async () => {
      await this.performHealthChecks();
    }, 5 * 60 * 1000);

    // 초기 체크
    this.performHealthChecks();
  }

  /**
   * 헬스 체크 수행
   */
  private async performHealthChecks(): Promise<void> {
    for (const [featureId, check] of this.healthChecks) {
      try {
        const isHealthy = await check();
        const feature = this.features.get(featureId);

        if (feature) {
          if (isHealthy && feature.status === FeatureStatus.UNAVAILABLE) {
            // 복구
            feature.status = FeatureStatus.AVAILABLE;
            this.logError(
              ErrorLevel.INFO,
              `Feature recovered: ${featureId}`
            );
          } else if (!isHealthy && feature.status === FeatureStatus.AVAILABLE) {
            // 저하
            this.degradeFeature(featureId, 'Health check failed');
          }
        }
      } catch (error) {
        this.disableFeature(featureId, error as Error);
      }
    }
  }

  /**
   * 시스템 헬스 조회
   */
  getSystemHealth(): SystemHealth {
    const features: Record<string, FeatureStatus> = {};
    this.features.forEach((feature, id) => {
      features[id] = feature.status;
    });

    // 에러율 계산
    const recentErrors = this.errorLogs.filter(
      log => Date.now() - log.timestamp.getTime() < 60000
    );
    const errorRate = recentErrors.length;

    // 전체 상태 결정
    const unavailableCount = Array.from(this.features.values()).filter(
      f => f.status === FeatureStatus.UNAVAILABLE
    ).length;
    const degradedCount = Array.from(this.features.values()).filter(
      f => f.status === FeatureStatus.DEGRADED
    ).length;

    let overall: SystemHealth['overall'] = 'healthy';
    if (unavailableCount > 0) overall = 'unhealthy';
    else if (degradedCount > 0) overall = 'degraded';

    return {
      overall,
      services: {}, // 실제 구현시 서비스별 상태
      features,
      metrics: {
        errorRate,
        avgResponseTime: 0, // 실제 구현시 계산
        uptime: Date.now() - performance.timeOrigin,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
      }
    };
  }

  /**
   * 에러 로그 조회
   */
  getErrorLogs(
    level?: ErrorLevel,
    limit: number = 100
  ): ErrorLogEntry[] {
    let logs = [...this.errorLogs];

    if (level !== undefined) {
      logs = logs.filter(log => log.level >= level);
    }

    return logs.slice(-limit);
  }

  /**
   * 에러 통계
   */
  getErrorStats(): {
    total: number;
    byLevel: Record<ErrorLevel, number>;
    recentRate: number;
    topErrors: Array<{ message: string; count: number }>;
  } {
    const byLevel: Record<ErrorLevel, number> = {
      [ErrorLevel.DEBUG]: 0,
      [ErrorLevel.INFO]: 0,
      [ErrorLevel.WARNING]: 0,
      [ErrorLevel.ERROR]: 0,
      [ErrorLevel.CRITICAL]: 0
    };

    const errorMessages = new Map<string, number>();

    this.errorLogs.forEach(log => {
      byLevel[log.level]++;

      const key = log.message.substring(0, 50);
      errorMessages.set(key, (errorMessages.get(key) || 0) + 1);
    });

    const topErrors = Array.from(errorMessages.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([message, count]) => ({ message, count }));

    const recentErrors = this.errorLogs.filter(
      log => Date.now() - log.timestamp.getTime() < 60000
    );

    return {
      total: this.errorLogs.length,
      byLevel,
      recentRate: recentErrors.length,
      topErrors
    };
  }

  /**
   * 유틸리티 함수들
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getLogPrefix(level: ErrorLevel): string {
    const prefixes = {
      [ErrorLevel.DEBUG]: '🔍 DEBUG',
      [ErrorLevel.INFO]: 'ℹ️ INFO',
      [ErrorLevel.WARNING]: '⚠️ WARNING',
      [ErrorLevel.ERROR]: '❌ ERROR',
      [ErrorLevel.CRITICAL]: '🔴 CRITICAL'
    };
    return prefixes[level];
  }

  private getLogStyle(level: ErrorLevel): string {
    const styles = {
      [ErrorLevel.DEBUG]: 'color: gray',
      [ErrorLevel.INFO]: 'color: blue',
      [ErrorLevel.WARNING]: 'color: orange; font-weight: bold',
      [ErrorLevel.ERROR]: 'color: red; font-weight: bold',
      [ErrorLevel.CRITICAL]: 'color: red; font-weight: bold; font-size: 14px'
    };
    return styles[level];
  }

  /**
   * 에러 복구 시도
   */
  async attemptRecovery(featureId: string): Promise<boolean> {
    const feature = this.features.get(featureId);
    if (!feature) return false;

    this.logError(
      ErrorLevel.INFO,
      `Attempting recovery for feature: ${featureId}`
    );

    try {
      // 헬스 체크
      if (feature.healthCheck) {
        const isHealthy = await feature.healthCheck();
        if (isHealthy) {
          feature.status = FeatureStatus.AVAILABLE;
          this.logError(
            ErrorLevel.INFO,
            `Feature recovered successfully: ${featureId}`
          );
          return true;
        }
      }

      // 폴백 모드로 전환
      if (feature.fallbackEnabled) {
        feature.status = FeatureStatus.DEGRADED;
        this.logError(
          ErrorLevel.WARNING,
          `Feature running in fallback mode: ${featureId}`
        );
        return true;
      }

      return false;
    } catch (error) {
      this.logError(
        ErrorLevel.ERROR,
        `Recovery failed for feature: ${featureId}`,
        error as Error
      );
      return false;
    }
  }

  /**
   * 전체 시스템 리셋
   */
  reset(): void {
    this.features.forEach(feature => {
      feature.status = FeatureStatus.AVAILABLE;
    });
    this.errorLogs = [];
    localStorage.removeItem('v3_error_logs');
    this.cache.clear();

    this.logError(
      ErrorLevel.INFO,
      'System reset completed'
    );
  }
}

// 싱글톤 인스턴스
let managerInstance: GracefulDegradationManager | null = null;

export function getGracefulDegradationManager(): GracefulDegradationManager {
  if (!managerInstance) {
    managerInstance = new GracefulDegradationManager();
  }
  return managerInstance;
}

/**
 * React Hook: 기능 가용성 체크
 */
export function useFeatureAvailability(featureId: string): {
  isAvailable: boolean;
  status: FeatureStatus;
  fallback?: React.ComponentType;
} {
  const manager = getGracefulDegradationManager();
  const [status, setStatus] = React.useState<FeatureStatus>(
    FeatureStatus.AVAILABLE
  );

  React.useEffect(() => {
    const checkStatus = () => {
      const feature = manager['features'].get(featureId);
      if (feature) {
        setStatus(feature.status);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [featureId]);

  const feature = manager['features'].get(featureId);

  return {
    isAvailable: status === FeatureStatus.AVAILABLE,
    status,
    fallback: feature?.fallbackComponent
  };
}

import React from 'react';