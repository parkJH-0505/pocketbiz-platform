/**
 * Widget Performance Monitor
 * 위젯 성능 모니터링 시스템
 */

import { widgetEventBus, WidgetEventTypes } from '../widgets/WidgetEventBus';

// 성능 메트릭 타입
export interface PerformanceMetrics {
  id: string;
  widgetId: string;
  timestamp: number;
  renderTime: number;
  renderCount: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  apiCalls: {
    count: number;
    totalTime: number;
    avgTime: number;
    errors: number;
  };
  domNodes: number;
  eventListeners: number;
  componentTree: {
    depth: number;
    components: number;
  };
  bundleSize?: {
    chunks: number;
    totalSize: number;
    gzipSize: number;
  };
}

// 성능 임계값
export interface PerformanceThresholds {
  renderTime: {
    warning: number;
    critical: number;
  };
  renderCount: {
    warning: number;
    critical: number;
  };
  memoryUsage: {
    warning: number;
    critical: number;
  };
  apiResponseTime: {
    warning: number;
    critical: number;
  };
}

// 성능 이슈 타입
export enum PerformanceIssueType {
  SLOW_RENDER = 'slow_render',
  EXCESSIVE_RENDERS = 'excessive_renders',
  MEMORY_LEAK = 'memory_leak',
  SLOW_API = 'slow_api',
  DOM_BLOAT = 'dom_bloat',
  BUNDLE_SIZE = 'bundle_size'
}

// 성능 이슈
export interface PerformanceIssue {
  id: string;
  widgetId: string;
  type: PerformanceIssueType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metric: number;
  threshold: number;
  timestamp: number;
  resolved: boolean;
  recommendations?: string[];
}

// 성능 보고서
export interface PerformanceReport {
  id: string;
  generatedAt: number;
  period: {
    start: number;
    end: number;
  };
  summary: {
    totalWidgets: number;
    averageRenderTime: number;
    totalRenders: number;
    memoryEfficiency: number;
    issuesFound: number;
  };
  widgets: Array<{
    widgetId: string;
    metrics: PerformanceMetrics[];
    issues: PerformanceIssue[];
    score: number; // 0-100
  }>;
  recommendations: string[];
}

/**
 * 성능 수집기
 */
export class PerformanceCollector {
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();
  private renderTimers: Map<string, number> = new Map();
  private renderCounts: Map<string, number> = new Map();
  private memoryInterval?: NodeJS.Timeout;

  constructor() {
    this.initializePerformanceObserver();
    this.startMemoryMonitoring();
  }

  /**
   * Performance Observer 초기화
   */
  private initializePerformanceObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'measure' && entry.name.startsWith('widget-render-')) {
            const widgetId = entry.name.replace('widget-render-', '');
            this.recordRenderTime(widgetId, entry.duration);
          }
        });
      });

      observer.observe({ entryTypes: ['measure'] });
      this.observers.set('main', observer);
    }
  }

  /**
   * 메모리 모니터링 시작
   */
  private startMemoryMonitoring() {
    this.memoryInterval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryInfo = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
        };

        // 메모리 사용량이 높은 위젯 찾기
        this.metrics.forEach((metricsArray, widgetId) => {
          if (metricsArray.length > 0) {
            const latest = metricsArray[metricsArray.length - 1];
            this.updateMetric(widgetId, { memoryUsage: memoryInfo });
          }
        });
      }
    }, 5000); // 5초마다 체크
  }

  /**
   * 위젯 렌더링 시작
   */
  startRender(widgetId: string): void {
    this.renderTimers.set(widgetId, performance.now());
    performance.mark(`widget-render-start-${widgetId}`);

    // 렌더 카운트 증가
    const currentCount = this.renderCounts.get(widgetId) || 0;
    this.renderCounts.set(widgetId, currentCount + 1);
  }

  /**
   * 위젯 렌더링 종료
   */
  endRender(widgetId: string): number {
    const startTime = this.renderTimers.get(widgetId);
    if (startTime) {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      performance.mark(`widget-render-end-${widgetId}`);
      performance.measure(
        `widget-render-${widgetId}`,
        `widget-render-start-${widgetId}`,
        `widget-render-end-${widgetId}`
      );

      this.recordRenderTime(widgetId, renderTime);
      this.renderTimers.delete(widgetId);

      return renderTime;
    }
    return 0;
  }

  /**
   * 렌더링 시간 기록
   */
  private recordRenderTime(widgetId: string, renderTime: number): void {
    const renderCount = this.renderCounts.get(widgetId) || 0;

    const metric: Partial<PerformanceMetrics> = {
      renderTime,
      renderCount,
      timestamp: Date.now()
    };

    this.updateMetric(widgetId, metric);

    // 이벤트 발행
    widgetEventBus.emit(
      `performance-${widgetId}`,
      WidgetEventTypes.ACTION_TRIGGER,
      { type: 'render', renderTime, renderCount }
    );
  }

  /**
   * API 호출 기록
   */
  recordApiCall(widgetId: string, duration: number, success: boolean): void {
    const metrics = this.getLatestMetrics(widgetId);
    const apiCalls = metrics?.apiCalls || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      errors: 0
    };

    const newApiCalls = {
      count: apiCalls.count + 1,
      totalTime: apiCalls.totalTime + duration,
      avgTime: (apiCalls.totalTime + duration) / (apiCalls.count + 1),
      errors: success ? apiCalls.errors : apiCalls.errors + 1
    };

    this.updateMetric(widgetId, { apiCalls: newApiCalls });
  }

  /**
   * DOM 노드 수 기록
   */
  recordDomNodes(widgetId: string, element: Element): void {
    const domNodes = element.querySelectorAll('*').length;
    const eventListeners = this.countEventListeners(element);

    this.updateMetric(widgetId, {
      domNodes,
      eventListeners
    });
  }

  /**
   * 이벤트 리스너 수 계산
   */
  private countEventListeners(element: Element): number {
    // 정확한 이벤트 리스너 수를 계산하는 것은 어려우므로 근사치 사용
    let count = 0;

    // 공통 이벤트 타입들을 확인
    const events = ['click', 'mousedown', 'mouseup', 'mouseover', 'mouseout', 'focus', 'blur'];

    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_ELEMENT,
      null
    );

    let node;
    while (node = walker.nextNode()) {
      events.forEach(event => {
        if ((node as Element).getAttribute(`on${event}`)) {
          count++;
        }
      });
    }

    return count;
  }

  /**
   * 메트릭 업데이트
   */
  private updateMetric(widgetId: string, updates: Partial<PerformanceMetrics>): void {
    let metricsArray = this.metrics.get(widgetId) || [];

    const existingMetric = metricsArray[metricsArray.length - 1];
    const newMetric: PerformanceMetrics = {
      id: `metric-${Date.now()}`,
      widgetId,
      timestamp: Date.now(),
      renderTime: 0,
      renderCount: 0,
      memoryUsage: { used: 0, total: 0, percentage: 0 },
      apiCalls: { count: 0, totalTime: 0, avgTime: 0, errors: 0 },
      domNodes: 0,
      eventListeners: 0,
      componentTree: { depth: 0, components: 0 },
      ...existingMetric,
      ...updates
    };

    metricsArray.push(newMetric);

    // 메트릭 배열 크기 제한 (최대 100개)
    if (metricsArray.length > 100) {
      metricsArray = metricsArray.slice(-100);
    }

    this.metrics.set(widgetId, metricsArray);
  }

  /**
   * 최신 메트릭 가져오기
   */
  getLatestMetrics(widgetId: string): PerformanceMetrics | null {
    const metricsArray = this.metrics.get(widgetId);
    return metricsArray && metricsArray.length > 0
      ? metricsArray[metricsArray.length - 1]
      : null;
  }

  /**
   * 모든 메트릭 가져오기
   */
  getAllMetrics(widgetId: string): PerformanceMetrics[] {
    return this.metrics.get(widgetId) || [];
  }

  /**
   * 메트릭 정리
   */
  clearMetrics(widgetId?: string): void {
    if (widgetId) {
      this.metrics.delete(widgetId);
      this.renderCounts.delete(widgetId);
    } else {
      this.metrics.clear();
      this.renderCounts.clear();
    }
  }

  /**
   * 정리
   */
  dispose(): void {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }

    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

/**
 * 성능 분석기
 */
export class PerformanceAnalyzer {
  private thresholds: PerformanceThresholds = {
    renderTime: { warning: 16, critical: 50 }, // 60fps = 16ms
    renderCount: { warning: 10, critical: 50 }, // 5초간 렌더 횟수
    memoryUsage: { warning: 70, critical: 90 }, // 메모리 사용률 %
    apiResponseTime: { warning: 1000, critical: 3000 } // API 응답시간 ms
  };

  /**
   * 성능 이슈 분석
   */
  analyzeMetrics(metrics: PerformanceMetrics[]): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    if (metrics.length === 0) return issues;

    const latest = metrics[metrics.length - 1];
    const widgetId = latest.widgetId;

    // 렌더링 시간 분석
    if (latest.renderTime > this.thresholds.renderTime.critical) {
      issues.push({
        id: `issue-${Date.now()}-render-time`,
        widgetId,
        type: PerformanceIssueType.SLOW_RENDER,
        severity: 'critical',
        message: `렌더링 시간이 ${latest.renderTime.toFixed(2)}ms로 임계값을 초과했습니다`,
        metric: latest.renderTime,
        threshold: this.thresholds.renderTime.critical,
        timestamp: Date.now(),
        resolved: false,
        recommendations: [
          'React.memo()를 사용하여 불필요한 리렌더링 방지',
          'useMemo()와 useCallback()으로 값과 함수 메모이제이션',
          '복잡한 계산을 Web Worker로 이동',
          '컴포넌트를 더 작은 단위로 분할'
        ]
      });
    } else if (latest.renderTime > this.thresholds.renderTime.warning) {
      issues.push({
        id: `issue-${Date.now()}-render-time`,
        widgetId,
        type: PerformanceIssueType.SLOW_RENDER,
        severity: 'medium',
        message: `렌더링 시간이 ${latest.renderTime.toFixed(2)}ms로 경고 수준입니다`,
        metric: latest.renderTime,
        threshold: this.thresholds.renderTime.warning,
        timestamp: Date.now(),
        resolved: false
      });
    }

    // 과도한 렌더링 분석
    const recentMetrics = metrics.slice(-10); // 최근 10개
    const avgRenderCount = recentMetrics.reduce((sum, m) => sum + m.renderCount, 0) / recentMetrics.length;

    if (avgRenderCount > this.thresholds.renderCount.critical) {
      issues.push({
        id: `issue-${Date.now()}-render-count`,
        widgetId,
        type: PerformanceIssueType.EXCESSIVE_RENDERS,
        severity: 'high',
        message: `과도한 리렌더링이 발생하고 있습니다 (평균 ${avgRenderCount.toFixed(1)}회)`,
        metric: avgRenderCount,
        threshold: this.thresholds.renderCount.critical,
        timestamp: Date.now(),
        resolved: false,
        recommendations: [
          '상태 업데이트 로직 최적화',
          'useEffect 의존성 배열 검토',
          '불필요한 prop 변경 방지',
          '컴포넌트 구조 재설계'
        ]
      });
    }

    // 메모리 사용량 분석
    if (latest.memoryUsage.percentage > this.thresholds.memoryUsage.critical) {
      issues.push({
        id: `issue-${Date.now()}-memory`,
        widgetId,
        type: PerformanceIssueType.MEMORY_LEAK,
        severity: 'critical',
        message: `메모리 사용률이 ${latest.memoryUsage.percentage.toFixed(1)}%로 임계값을 초과했습니다`,
        metric: latest.memoryUsage.percentage,
        threshold: this.thresholds.memoryUsage.critical,
        timestamp: Date.now(),
        resolved: false,
        recommendations: [
          '이벤트 리스너 정리 확인',
          'useEffect cleanup 함수 구현',
          '큰 객체나 배열의 참조 해제',
          '메모리 프로파일링 도구 사용'
        ]
      });
    }

    // API 성능 분석
    if (latest.apiCalls.avgTime > this.thresholds.apiResponseTime.critical) {
      issues.push({
        id: `issue-${Date.now()}-api`,
        widgetId,
        type: PerformanceIssueType.SLOW_API,
        severity: 'high',
        message: `API 평균 응답시간이 ${latest.apiCalls.avgTime.toFixed(0)}ms로 느립니다`,
        metric: latest.apiCalls.avgTime,
        threshold: this.thresholds.apiResponseTime.critical,
        timestamp: Date.now(),
        resolved: false,
        recommendations: [
          'API 호출 최적화 및 캐싱',
          '불필요한 API 호출 제거',
          'API 응답 데이터 최소화',
          '병렬 처리 및 배치 처리 고려'
        ]
      });
    }

    // DOM 노드 수 분석
    if (latest.domNodes > 1000) {
      issues.push({
        id: `issue-${Date.now()}-dom`,
        widgetId,
        type: PerformanceIssueType.DOM_BLOAT,
        severity: 'medium',
        message: `DOM 노드 수가 ${latest.domNodes}개로 과도합니다`,
        metric: latest.domNodes,
        threshold: 1000,
        timestamp: Date.now(),
        resolved: false,
        recommendations: [
          '가상화(Virtualization) 구현',
          'DOM 노드 수 최적화',
          '불필요한 래퍼 요소 제거',
          '조건부 렌더링 활용'
        ]
      });
    }

    return issues;
  }

  /**
   * 성능 점수 계산
   */
  calculateScore(metrics: PerformanceMetrics[]): number {
    if (metrics.length === 0) return 0;

    const latest = metrics[metrics.length - 1];
    let score = 100;

    // 렌더링 시간 점수 (30%)
    const renderScore = Math.max(0, 100 - (latest.renderTime / this.thresholds.renderTime.critical) * 100);
    score -= (100 - renderScore) * 0.3;

    // 메모리 사용량 점수 (25%)
    const memoryScore = Math.max(0, 100 - (latest.memoryUsage.percentage / this.thresholds.memoryUsage.critical) * 100);
    score -= (100 - memoryScore) * 0.25;

    // API 성능 점수 (25%)
    const apiScore = Math.max(0, 100 - (latest.apiCalls.avgTime / this.thresholds.apiResponseTime.critical) * 100);
    score -= (100 - apiScore) * 0.25;

    // 렌더 횟수 점수 (20%)
    const renderCountScore = Math.max(0, 100 - (latest.renderCount / this.thresholds.renderCount.critical) * 100);
    score -= (100 - renderCountScore) * 0.2;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 성능 보고서 생성
   */
  generateReport(allMetrics: Map<string, PerformanceMetrics[]>): PerformanceReport {
    const endTime = Date.now();
    const startTime = endTime - (24 * 60 * 60 * 1000); // 24시간 전

    const widgets = Array.from(allMetrics.entries()).map(([widgetId, metrics]) => {
      const recentMetrics = metrics.filter(m => m.timestamp >= startTime);
      const issues = this.analyzeMetrics(recentMetrics);
      const score = this.calculateScore(recentMetrics);

      return {
        widgetId,
        metrics: recentMetrics,
        issues,
        score
      };
    });

    const totalRenders = widgets.reduce((sum, w) =>
      sum + w.metrics.reduce((s, m) => s + m.renderCount, 0), 0
    );

    const avgRenderTime = widgets.reduce((sum, w) => {
      const avgTime = w.metrics.reduce((s, m) => s + m.renderTime, 0) / w.metrics.length;
      return sum + (avgTime || 0);
    }, 0) / widgets.length;

    const allIssues = widgets.flatMap(w => w.issues);

    const report: PerformanceReport = {
      id: `report-${Date.now()}`,
      generatedAt: Date.now(),
      period: { start: startTime, end: endTime },
      summary: {
        totalWidgets: widgets.length,
        averageRenderTime: avgRenderTime || 0,
        totalRenders,
        memoryEfficiency: 100 - (allIssues.filter(i => i.type === PerformanceIssueType.MEMORY_LEAK).length * 10),
        issuesFound: allIssues.length
      },
      widgets,
      recommendations: this.generateRecommendations(allIssues)
    };

    return report;
  }

  /**
   * 개선 권장사항 생성
   */
  private generateRecommendations(issues: PerformanceIssue[]): string[] {
    const recommendations = new Set<string>();

    if (issues.some(i => i.type === PerformanceIssueType.SLOW_RENDER)) {
      recommendations.add('React DevTools Profiler를 사용하여 렌더링 성능을 분석하세요');
      recommendations.add('React.memo, useMemo, useCallback을 활용하여 최적화하세요');
    }

    if (issues.some(i => i.type === PerformanceIssueType.MEMORY_LEAK)) {
      recommendations.add('브라우저 메모리 프로파일러로 메모리 누수를 확인하세요');
      recommendations.add('컴포넌트 언마운트 시 리소스 정리를 확인하세요');
    }

    if (issues.some(i => i.type === PerformanceIssueType.SLOW_API)) {
      recommendations.add('API 호출을 최적화하고 적절한 캐싱을 구현하세요');
      recommendations.add('React Query나 SWR 같은 데이터 페칭 라이브러리를 고려하세요');
    }

    if (issues.some(i => i.type === PerformanceIssueType.DOM_BLOAT)) {
      recommendations.add('React Window나 React Virtualized로 가상화를 구현하세요');
    }

    if (recommendations.size === 0) {
      recommendations.add('현재 성능 상태가 양호합니다. 정기적인 모니터링을 유지하세요');
    }

    return Array.from(recommendations);
  }

  /**
   * 임계값 설정
   */
  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }
}

/**
 * 위젯 성능 모니터 (통합)
 */
export class WidgetPerformanceMonitor {
  private collector: PerformanceCollector;
  private analyzer: PerformanceAnalyzer;
  private monitoringEnabled = true;

  constructor() {
    this.collector = new PerformanceCollector();
    this.analyzer = new PerformanceAnalyzer();
  }

  /**
   * 렌더링 성능 Hook
   */
  withPerformanceTracking<T extends React.ComponentType<any>>(
    Component: T,
    widgetId: string
  ): T {
    const WrappedComponent = (props: any) => {
      const elementRef = React.useRef<HTMLDivElement>(null);

      React.useEffect(() => {
        this.collector.startRender(widgetId);

        return () => {
          this.collector.endRender(widgetId);

          if (elementRef.current) {
            this.collector.recordDomNodes(widgetId, elementRef.current);
          }
        };
      });

      return (
        <div ref={elementRef}>
          <Component {...props} />
        </div>
      );
    };

    return WrappedComponent as T;
  }

  /**
   * API 호출 추적
   */
  async trackApiCall<T>(
    widgetId: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    let success = true;

    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      this.collector.recordApiCall(widgetId, duration, success);
    }
  }

  /**
   * 성능 리포트 생성
   */
  generateReport(): PerformanceReport {
    const allMetrics = new Map<string, PerformanceMetrics[]>();

    // 모든 위젯 메트릭 수집
    // 실제 구현에서는 collector에서 데이터를 가져옴
    return this.analyzer.generateReport(allMetrics);
  }

  /**
   * 실시간 모니터링 시작
   */
  startMonitoring(): void {
    this.monitoringEnabled = true;
  }

  /**
   * 모니터링 중지
   */
  stopMonitoring(): void {
    this.monitoringEnabled = false;
  }

  /**
   * 성능 메트릭 가져오기
   */
  getMetrics(widgetId: string): PerformanceMetrics[] {
    return this.collector.getAllMetrics(widgetId);
  }

  /**
   * 성능 분석
   */
  analyze(widgetId: string): PerformanceIssue[] {
    const metrics = this.collector.getAllMetrics(widgetId);
    return this.analyzer.analyzeMetrics(metrics);
  }

  /**
   * 정리
   */
  dispose(): void {
    this.collector.dispose();
  }

  // Public API
  get isMonitoring(): boolean {
    return this.monitoringEnabled;
  }
}

// React Hook
declare const React: any;

// 싱글톤 인스턴스
export const widgetPerformanceMonitor = new WidgetPerformanceMonitor();

// 개발 모드에서 전역 접근 가능
if (process.env.NODE_ENV === 'development') {
  (window as any).widgetPerformanceMonitor = widgetPerformanceMonitor;
}