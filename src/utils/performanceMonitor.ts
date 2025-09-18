/**
 * @fileoverview 성능 모니터링 시스템
 * @description Sprint 4 Phase 4-5: 시스템 성능 측정 및 분석
 * @author PocketCompany
 * @since 2025-01-19
 */

import { EdgeCaseLogger } from './edgeCaseScenarios';

/**
 * 성능 메트릭 타입
 */
export type MetricType =
  | 'page_load'         // 페이지 로딩 시간
  | 'api_response'      // API 응답 시간
  | 'phase_transition'  // Phase transition 처리 시간
  | 'schedule_crud'     // 스케줄 CRUD 작업 시간
  | 'validation'        // 데이터 검증 시간
  | 'render'            // 컴포넌트 렌더링 시간
  | 'memory_usage'      // 메모리 사용량
  | 'user_interaction'; // 사용자 인터랙션 응답 시간

/**
 * 성능 메트릭
 */
export interface PerformanceMetric {
  id: string;
  type: MetricType;
  name: string;
  value: number;           // 측정값 (ms, bytes 등)
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: Date;

  // 컨텍스트 정보
  context: {
    userId?: string;
    sessionId?: string;
    component?: string;
    action?: string;
    projectId?: string;
    scheduleId?: string;
    browser?: string;
    device?: string;
  };

  // 추가 메타데이터
  tags: string[];
  metadata?: Record<string, any>;
}

/**
 * 성능 임계값
 */
export interface PerformanceThreshold {
  metricType: MetricType;
  warning: number;    // 경고 임계값
  critical: number;   // 심각 임계값
  unit: string;
}

/**
 * 성능 통계
 */
export interface PerformanceStatistics {
  period: string;
  totalMeasurements: number;

  // 메트릭별 통계
  metricStats: Record<MetricType, {
    count: number;
    average: number;
    median: number;
    min: number;
    max: number;
    p95: number;     // 95th percentile
    p99: number;     // 99th percentile
    unit: string;
  }>;

  // 성능 문제 감지
  performanceIssues: Array<{
    type: MetricType;
    severity: 'warning' | 'critical';
    description: string;
    affectedMeasurements: number;
    averageValue: number;
    threshold: number;
  }>;

  // 트렌드 분석
  trends: Array<{
    metricType: MetricType;
    trend: 'improving' | 'degrading' | 'stable';
    changePercent: number;
    description: string;
  }>;
}

/**
 * 실행 중인 측정
 */
interface ActiveMeasurement {
  id: string;
  type: MetricType;
  name: string;
  startTime: number;
  context: PerformanceMetric['context'];
  tags: string[];
}

/**
 * 성능 임계값 설정
 */
const PERFORMANCE_THRESHOLDS: PerformanceThreshold[] = [
  { metricType: 'page_load', warning: 3000, critical: 5000, unit: 'ms' },
  { metricType: 'api_response', warning: 1000, critical: 3000, unit: 'ms' },
  { metricType: 'phase_transition', warning: 2000, critical: 5000, unit: 'ms' },
  { metricType: 'schedule_crud', warning: 500, critical: 2000, unit: 'ms' },
  { metricType: 'validation', warning: 100, critical: 500, unit: 'ms' },
  { metricType: 'render', warning: 16, critical: 32, unit: 'ms' },
  { metricType: 'memory_usage', warning: 100 * 1024 * 1024, critical: 500 * 1024 * 1024, unit: 'bytes' },
  { metricType: 'user_interaction', warning: 100, critical: 300, unit: 'ms' }
];

/**
 * 성능 모니터링 매니저
 */
export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static activeMeasurements: Map<string, ActiveMeasurement> = new Map();
  private static maxMetricsHistory: number = 10000;
  private static monitoringEnabled: boolean = true;

  /**
   * 성능 측정 시작
   */
  static startMeasurement(
    type: MetricType,
    name: string,
    context?: Partial<PerformanceMetric['context']>,
    tags: string[] = []
  ): string {
    if (!this.monitoringEnabled) return '';

    const measurementId = `perf_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const measurement: ActiveMeasurement = {
      id: measurementId,
      type,
      name,
      startTime: performance.now(),
      context: {
        sessionId: this.getSessionId(),
        browser: this.getBrowserInfo(),
        device: this.getDeviceInfo(),
        ...context
      },
      tags: [...tags, 'auto_measured']
    };

    this.activeMeasurements.set(measurementId, measurement);

    return measurementId;
  }

  /**
   * 성능 측정 완료
   */
  static endMeasurement(measurementId: string, additionalMetadata?: Record<string, any>): PerformanceMetric | null {
    if (!this.monitoringEnabled || !measurementId) return null;

    const measurement = this.activeMeasurements.get(measurementId);
    if (!measurement) {
      console.warn(`[PERFORMANCE MONITOR] Measurement not found: ${measurementId}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - measurement.startTime;

    const metric: PerformanceMetric = {
      id: measurement.id,
      type: measurement.type,
      name: measurement.name,
      value: duration,
      unit: 'ms',
      timestamp: new Date(),
      context: measurement.context,
      tags: measurement.tags,
      metadata: additionalMetadata
    };

    // 측정 완료 처리
    this.activeMeasurements.delete(measurementId);
    this.recordMetric(metric);

    return metric;
  }

  /**
   * 직접 메트릭 기록
   */
  static recordMetric(
    type: MetricType,
    name: string,
    value: number,
    unit: PerformanceMetric['unit'] = 'ms',
    context?: Partial<PerformanceMetric['context']>,
    tags: string[] = []
  ): PerformanceMetric {
    const metric: PerformanceMetric = {
      id: `metric_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      name,
      value,
      unit,
      timestamp: new Date(),
      context: {
        sessionId: this.getSessionId(),
        browser: this.getBrowserInfo(),
        device: this.getDeviceInfo(),
        ...context
      },
      tags: [...tags, 'manual_recorded']
    };

    this.recordMetric(metric);
    return metric;
  }

  /**
   * 메트릭 기록 (내부 메서드)
   */
  private static recordMetric(metric: PerformanceMetric): void {
    // 메트릭 저장
    this.metrics.push(metric);

    // 히스토리 크기 관리
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // 임계값 체크
    this.checkThresholds(metric);

    // Edge case 로깅
    EdgeCaseLogger.log('EC_PERFORMANCE_001', {
      metricId: metric.id,
      type: metric.type,
      name: metric.name,
      value: metric.value,
      unit: metric.unit,
      context: metric.context
    });
  }

  /**
   * 임계값 체크
   */
  private static checkThresholds(metric: PerformanceMetric): void {
    const threshold = PERFORMANCE_THRESHOLDS.find(t => t.metricType === metric.type);
    if (!threshold) return;

    let severity: 'warning' | 'critical' | null = null;

    if (metric.value >= threshold.critical) {
      severity = 'critical';
    } else if (metric.value >= threshold.warning) {
      severity = 'warning';
    }

    if (severity) {
      console.warn(`⚠️ [PERFORMANCE MONITOR] ${severity.toUpperCase()}: ${metric.name}`, {
        value: `${metric.value}${metric.unit}`,
        threshold: `${severity === 'critical' ? threshold.critical : threshold.warning}${threshold.unit}`,
        context: metric.context
      });

      EdgeCaseLogger.log('EC_PERFORMANCE_002', {
        metricId: metric.id,
        severity,
        metricType: metric.type,
        value: metric.value,
        threshold: severity === 'critical' ? threshold.critical : threshold.warning,
        context: metric.context
      });

      // 심각한 성능 문제는 즉시 알림
      if (severity === 'critical') {
        this.alertCriticalPerformance(metric, threshold);
      }
    }
  }

  /**
   * 심각한 성능 문제 알림
   */
  private static alertCriticalPerformance(metric: PerformanceMetric, threshold: PerformanceThreshold): void {
    const message = `Critical performance issue: ${metric.name} took ${metric.value}${metric.unit} (threshold: ${threshold.critical}${threshold.unit})`;

    // 관리자 알림
    EdgeCaseLogger.log('EC_PERFORMANCE_003', {
      alert: 'critical_performance',
      metricId: metric.id,
      metricType: metric.type,
      value: metric.value,
      threshold: threshold.critical,
      message,
      context: metric.context
    });

    console.error(`🚨 [PERFORMANCE MONITOR] ${message}`);
  }

  /**
   * Phase Transition 성능 측정
   */
  static async measurePhaseTransition<T>(
    projectId: string,
    fromPhase: string,
    toPhase: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const measurementId = this.startMeasurement(
      'phase_transition',
      `Phase Transition: ${fromPhase} → ${toPhase}`,
      {
        projectId,
        action: 'phase_transition'
      },
      ['phase_transition', 'business_critical']
    );

    try {
      const result = await operation();

      this.endMeasurement(measurementId, {
        fromPhase,
        toPhase,
        success: true
      });

      return result;

    } catch (error) {
      this.endMeasurement(measurementId, {
        fromPhase,
        toPhase,
        success: false,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * 스케줄 CRUD 성능 측정
   */
  static async measureScheduleOperation<T>(
    operation: 'create' | 'update' | 'delete',
    scheduleId: string,
    projectId: string,
    operationFunction: () => Promise<T>
  ): Promise<T> {
    const measurementId = this.startMeasurement(
      'schedule_crud',
      `Schedule ${operation}`,
      {
        scheduleId,
        projectId,
        action: `schedule_${operation}`
      },
      ['schedule', operation]
    );

    try {
      const result = await operationFunction();

      this.endMeasurement(measurementId, {
        operation,
        success: true
      });

      return result;

    } catch (error) {
      this.endMeasurement(measurementId, {
        operation,
        success: false,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * 검증 성능 측정
   */
  static async measureValidation<T>(
    validationType: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const measurementId = this.startMeasurement(
      'validation',
      `Validation: ${validationType}`,
      {
        action: 'validation'
      },
      ['validation', validationType]
    );

    try {
      const result = await operation();

      this.endMeasurement(measurementId, {
        validationType,
        success: true
      });

      return result;

    } catch (error) {
      this.endMeasurement(measurementId, {
        validationType,
        success: false,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * 메모리 사용량 측정
   */
  static measureMemoryUsage(): PerformanceMetric {
    let memoryUsage = 0;

    if ('memory' in performance) {
      // @ts-ignore
      memoryUsage = performance.memory.usedJSHeapSize;
    } else {
      // Fallback: estimate based on stored data
      memoryUsage = this.estimateMemoryUsage();
    }

    return this.recordMetric(
      'memory_usage',
      'JavaScript Heap Size',
      memoryUsage,
      'bytes',
      { action: 'memory_check' },
      ['memory', 'system']
    );
  }

  /**
   * 메모리 사용량 추정
   */
  private static estimateMemoryUsage(): number {
    // 대략적인 메모리 사용량 추정
    const dataSize = JSON.stringify(this.metrics).length +
                    JSON.stringify(Array.from(this.activeMeasurements.values())).length;

    return dataSize * 2; // 대략적인 배수 적용
  }

  /**
   * 컴포넌트 렌더링 성능 측정 (HOC)
   */
  static withPerformanceTracking<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    componentName: string
  ): React.ComponentType<P> {
    return function PerformanceTrackedComponent(props: P) {
      const measurementIdRef = React.useRef<string>('');

      React.useEffect(() => {
        measurementIdRef.current = PerformanceMonitor.startMeasurement(
          'render',
          `Render: ${componentName}`,
          {
            component: componentName,
            action: 'render'
          },
          ['render', 'component']
        );

        return () => {
          if (measurementIdRef.current) {
            PerformanceMonitor.endMeasurement(measurementIdRef.current);
          }
        };
      }, []);

      return React.createElement(WrappedComponent, props);
    };
  }

  /**
   * 성능 통계 생성
   */
  static generateStatistics(hours: number = 24): PerformanceStatistics {
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
    const recentMetrics = this.metrics.filter(m => m.timestamp.getTime() > cutoffTime);

    // 메트릭 타입별 통계
    const metricStats: Record<string, any> = {};

    for (const metricType of Object.values(['page_load', 'api_response', 'phase_transition', 'schedule_crud', 'validation', 'render', 'memory_usage', 'user_interaction'] as MetricType[])) {
      const typeMetrics = recentMetrics.filter(m => m.type === metricType);

      if (typeMetrics.length > 0) {
        const values = typeMetrics.map(m => m.value).sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);

        metricStats[metricType] = {
          count: values.length,
          average: sum / values.length,
          median: values[Math.floor(values.length / 2)],
          min: values[0],
          max: values[values.length - 1],
          p95: values[Math.floor(values.length * 0.95)],
          p99: values[Math.floor(values.length * 0.99)],
          unit: typeMetrics[0].unit
        };
      }
    }

    // 성능 문제 감지
    const performanceIssues: PerformanceStatistics['performanceIssues'] = [];

    for (const threshold of PERFORMANCE_THRESHOLDS) {
      const typeMetrics = recentMetrics.filter(m => m.type === threshold.metricType);
      const exceedingMetrics = typeMetrics.filter(m => m.value >= threshold.warning);

      if (exceedingMetrics.length > 0) {
        const averageValue = exceedingMetrics.reduce((sum, m) => sum + m.value, 0) / exceedingMetrics.length;
        const criticalCount = exceedingMetrics.filter(m => m.value >= threshold.critical).length;

        performanceIssues.push({
          type: threshold.metricType,
          severity: criticalCount > 0 ? 'critical' : 'warning',
          description: `${threshold.metricType} performance issue detected`,
          affectedMeasurements: exceedingMetrics.length,
          averageValue,
          threshold: criticalCount > 0 ? threshold.critical : threshold.warning
        });
      }
    }

    // 트렌드 분석 (간단한 버전)
    const trends: PerformanceStatistics['trends'] = [];
    // TODO: 실제 트렌드 분석 로직 구현

    return {
      period: `Last ${hours} hours`,
      totalMeasurements: recentMetrics.length,
      metricStats: metricStats as any,
      performanceIssues,
      trends
    };
  }

  /**
   * 최근 메트릭 조회
   */
  static getRecentMetrics(limit: number = 100, type?: MetricType): PerformanceMetric[] {
    let metrics = this.metrics.slice(-limit);

    if (type) {
      metrics = metrics.filter(m => m.type === type);
    }

    return metrics.reverse();
  }

  /**
   * 활성 측정 조회
   */
  static getActiveMeasurements(): ActiveMeasurement[] {
    return Array.from(this.activeMeasurements.values());
  }

  /**
   * 모니터링 활성화/비활성화
   */
  static setMonitoringEnabled(enabled: boolean): void {
    this.monitoringEnabled = enabled;
    console.log(`📊 [PERFORMANCE MONITOR] Monitoring ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * 메트릭 정리
   */
  static clearOldMetrics(hours: number = 72): number {
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
    const initialCount = this.metrics.length;

    this.metrics = this.metrics.filter(metric => metric.timestamp.getTime() > cutoffTime);

    const removedCount = initialCount - this.metrics.length;
    if (removedCount > 0) {
      console.log(`🧹 [PERFORMANCE MONITOR] Cleaned up ${removedCount} old metrics`);
    }

    return removedCount;
  }

  /**
   * 헬퍼 메서드들
   */
  private static getSessionId(): string {
    let sessionId = sessionStorage.getItem('performance_monitor_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('performance_monitor_session_id', sessionId);
    }
    return sessionId;
  }

  private static getBrowserInfo(): string {
    return navigator.userAgent.split(' ')[0] || 'Unknown';
  }

  private static getDeviceInfo(): string {
    return /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
  }
}