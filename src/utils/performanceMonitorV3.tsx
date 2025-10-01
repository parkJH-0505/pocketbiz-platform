/**
 * Performance Monitor V3
 * V3 레포트 시스템 성능 모니터링 및 디버깅
 */

import { getCacheManager } from './cacheManager';

/**
 * 성능 메트릭 타입
 */
interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memory?: {
    used: number;
    limit: number;
  };
  metadata?: Record<string, any>;
}

/**
 * 렌더링 메트릭
 */
interface RenderMetric {
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  props?: Record<string, any>;
}

/**
 * API 콜 메트릭
 */
interface APIMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: 'success' | 'error';
  timestamp: number;
  size?: number;
}

/**
 * 성능 모니터 클래스
 */
export class PerformanceMonitorV3 {
  private metrics: Map<string, PerformanceMetric>;
  private renderMetrics: Map<string, RenderMetric>;
  private apiMetrics: APIMetric[];
  private isEnabled: boolean;
  private maxMetrics: number;

  constructor(enabled: boolean = process.env.NODE_ENV === 'development') {
    this.metrics = new Map();
    this.renderMetrics = new Map();
    this.apiMetrics = [];
    this.isEnabled = enabled;
    this.maxMetrics = 100;
  }

  /**
   * 성능 측정 시작
   */
  startMeasure(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
      memory: this.getMemoryInfo()
    });
  }

  /**
   * 성능 측정 종료
   */
  endMeasure(name: string): number {
    if (!this.isEnabled) return 0;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Metric "${name}" not found`);
      return 0;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    // 로깅
    this.logMetric(metric);

    // 크기 제한
    if (this.metrics.size > this.maxMetrics) {
      const firstKey = this.metrics.keys().next().value;
      this.metrics.delete(firstKey);
    }

    return metric.duration;
  }

  /**
   * 컴포넌트 렌더링 추적
   */
  trackRender(componentName: string, renderTime: number, props?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const existing = this.renderMetrics.get(componentName);

    if (existing) {
      existing.renderCount++;
      existing.averageRenderTime =
        (existing.averageRenderTime * (existing.renderCount - 1) + renderTime) /
        existing.renderCount;
      existing.lastRenderTime = renderTime;
      existing.props = props;
    } else {
      this.renderMetrics.set(componentName, {
        componentName,
        renderCount: 1,
        averageRenderTime: renderTime,
        lastRenderTime: renderTime,
        props
      });
    }

    // 느린 렌더링 경고 (개발 모드에서는 더 관대한 threshold)
    const threshold = import.meta.env.DEV ? 50 : 16.67;
    if (renderTime > threshold) {
      console.warn(
        `⚠️ Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms (threshold: ${threshold.toFixed(0)}ms)`
      );
    }
  }

  /**
   * API 호출 추적
   */
  trackAPI(
    endpoint: string,
    method: string,
    duration: number,
    status: 'success' | 'error',
    size?: number
  ): void {
    if (!this.isEnabled) return;

    const metric: APIMetric = {
      endpoint,
      method,
      duration,
      status,
      timestamp: Date.now(),
      size
    };

    this.apiMetrics.push(metric);

    // 크기 제한
    if (this.apiMetrics.length > this.maxMetrics) {
      this.apiMetrics.shift();
    }

    // 느린 API 경고
    if (duration > 3000) {
      console.warn(
        `⚠️ Slow API call: ${method} ${endpoint} took ${duration.toFixed(0)}ms`
      );
    }
  }

  /**
   * 메모리 정보 가져오기
   */
  private getMemoryInfo(): { used: number; limit: number } | undefined {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
    }
    return undefined;
  }

  /**
   * 메트릭 로깅
   */
  private logMetric(metric: PerformanceMetric): void {
    const emoji = metric.duration! < 100 ? '✅' : metric.duration! < 500 ? '⚠️' : '🔴';
    console.log(
      `${emoji} [Performance] ${metric.name}: ${metric.duration!.toFixed(2)}ms`,
      metric.metadata
    );
  }

  /**
   * 성능 보고서 생성
   */
  generateReport(): {
    summary: {
      totalMetrics: number;
      averageTime: number;
      slowestOperation: string;
      fastestOperation: string;
    };
    componentPerformance: Array<{
      name: string;
      renderCount: number;
      averageTime: number;
    }>;
    apiPerformance: {
      totalCalls: number;
      averageTime: number;
      errorRate: number;
    };
    cacheStats: any;
  } {
    // 메트릭 배열 변환
    const metricsArray = Array.from(this.metrics.values()).filter(m => m.duration);

    // 요약 통계
    const summary = {
      totalMetrics: metricsArray.length,
      averageTime: metricsArray.reduce((acc, m) => acc + m.duration!, 0) / metricsArray.length || 0,
      slowestOperation: metricsArray.reduce((max, m) =>
        m.duration! > (max.duration || 0) ? m : max, {} as PerformanceMetric
      ).name || 'N/A',
      fastestOperation: metricsArray.reduce((min, m) =>
        m.duration! < (min.duration || Infinity) ? m : min, {} as PerformanceMetric
      ).name || 'N/A'
    };

    // 컴포넌트 성능
    const componentPerformance = Array.from(this.renderMetrics.values())
      .map(m => ({
        name: m.componentName,
        renderCount: m.renderCount,
        averageTime: m.averageRenderTime
      }))
      .sort((a, b) => b.averageTime - a.averageTime);

    // API 성능
    const apiPerformance = {
      totalCalls: this.apiMetrics.length,
      averageTime: this.apiMetrics.reduce((acc, m) => acc + m.duration, 0) / this.apiMetrics.length || 0,
      errorRate: this.apiMetrics.filter(m => m.status === 'error').length / this.apiMetrics.length || 0
    };

    // 캐시 통계
    const cacheManager = getCacheManager();
    const cacheStats = cacheManager.getStats();

    return {
      summary,
      componentPerformance,
      apiPerformance,
      cacheStats
    };
  }

  /**
   * 콘솔에 보고서 출력
   */
  printReport(): void {
    const report = this.generateReport();

    console.group('📊 Performance Report V3');

    // 요약
    console.group('📈 Summary');
    console.table(report.summary);
    console.groupEnd();

    // 컴포넌트 성능
    if (report.componentPerformance.length > 0) {
      console.group('⚛️ Component Performance');
      console.table(report.componentPerformance.slice(0, 10)); // Top 10
      console.groupEnd();
    }

    // API 성능
    console.group('🌐 API Performance');
    console.table(report.apiPerformance);
    console.groupEnd();

    // 캐시 통계
    console.group('💾 Cache Statistics');
    console.log('Memory Cache:', report.cacheStats.memory);
    console.log('Storage Cache:', report.cacheStats.storage);
    console.log('Hit Rate:', `${report.cacheStats.hitRate}%`);
    console.groupEnd();

    console.groupEnd();
  }

  /**
   * 메트릭 클리어
   */
  clear(): void {
    this.metrics.clear();
    this.renderMetrics.clear();
    this.apiMetrics = [];
  }

  /**
   * 모니터링 활성화/비활성화
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * React DevTools Profiler 통합
   */
  onRenderCallback(
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ): void {
    if (!this.isEnabled) return;

    this.trackRender(id, actualDuration);

    // 성능 이상 감지
    if (actualDuration > baseDuration * 2) {
      console.warn(
        `⚠️ Component "${id}" took ${actualDuration.toFixed(2)}ms to ${phase}, ` +
        `expected ${baseDuration.toFixed(2)}ms`
      );
    }
  }
}

// 싱글톤 인스턴스
let monitorInstance: PerformanceMonitorV3 | null = null;

/**
 * 성능 모니터 인스턴스 가져오기
 */
export function getPerformanceMonitor(): PerformanceMonitorV3 {
  if (!monitorInstance) {
    monitorInstance = new PerformanceMonitorV3();
  }
  return monitorInstance;
}

/**
 * HOC: 컴포넌트 성능 추적
 */
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  const monitor = getPerformanceMonitor();
  const displayName = componentName || Component.displayName || Component.name;

  return (props: P) => {
    const startTime = performance.now();

    React.useEffect(() => {
      const renderTime = performance.now() - startTime;
      monitor.trackRender(displayName, renderTime, props as any);
    });

    return React.createElement(Component, props);
  };
}

/**
 * Hook: 성능 측정
 */
export function usePerformanceMeasure(name: string): {
  start: () => void;
  end: () => number;
} {
  const monitor = getPerformanceMonitor();

  return {
    start: () => monitor.startMeasure(name),
    end: () => monitor.endMeasure(name)
  };
}

/**
 * 디버그 패널 컴포넌트
 */
export const DebugPanel: React.FC<{ show?: boolean }> = ({ show = true }) => {
  const [report, setReport] = React.useState<any>(null);
  const monitor = getPerformanceMonitor();

  React.useEffect(() => {
    if (show) {
      const interval = setInterval(() => {
        setReport(monitor.generateReport());
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [show, monitor]);

  if (!show || !report) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-xs z-[9999]">
      <h3 className="font-bold mb-2">🔍 Debug Panel</h3>
      <div className="space-y-2">
        <div>Metrics: {report.summary.totalMetrics}</div>
        <div>Avg Time: {report.summary.averageTime.toFixed(2)}ms</div>
        <div>Cache Hit: {report.cacheStats.hitRate}%</div>
        <div>Components: {report.componentPerformance.length}</div>
      </div>
      <button
        onClick={() => monitor.printReport()}
        className="mt-2 px-2 py-1 bg-blue-600 rounded text-xs"
      >
        Full Report
      </button>
    </div>
  );
};

// React import for types
import React from 'react';