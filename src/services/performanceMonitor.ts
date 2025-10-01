/**
 * 성능 모니터링 및 벤치마크 시스템
 *
 * 전체 애플리케이션의 성능을 실시간으로 모니터링하고
 * 병목 지점을 식별하여 최적화 포인트를 제공
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'render' | 'network' | 'memory' | 'storage' | 'calculation';
  threshold?: number;
  unit: string;
}

interface BottleneckAlert {
  component: string;
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion: string;
  timestamp: number;
}

interface BenchmarkResult {
  name: string;
  iterations: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  standardDeviation: number;
  memoryUsed: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private alerts: BottleneckAlert[] = [];
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  // 성능 임계값 설정
  private thresholds = {
    renderTime: 16, // 60fps를 위한 16ms
    networkRequest: 3000, // 3초
    memoryUsage: 100, // 100MB
    storageOperation: 50, // 50ms
    calculationTime: 100 // 100ms
  };

  // 모니터링 시작
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('[PerformanceMonitor] 성능 모니터링 시작');

    // 기본 성능 관찰자 설정
    this.setupPerformanceObservers();

    // 주기적 메트릭 수집
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.analyzeBottlenecks();
    }, 5000);
  }

  // 모니터링 중지
  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    console.log('[PerformanceMonitor] 성능 모니터링 중지');
  }

  // Performance Observer 설정
  private setupPerformanceObservers(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    try {
      // 네비게이션 타이밍 관찰
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.addMetric({
              name: 'Page Load Time',
              value: navEntry.loadEventEnd - navEntry.fetchStart,
              timestamp: Date.now(),
              category: 'network',
              threshold: this.thresholds.networkRequest,
              unit: 'ms'
            });
          }
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });

      // 리소스 타이밍 관찰
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.addMetric({
              name: `Resource: ${resourceEntry.name.split('/').pop()}`,
              value: resourceEntry.responseEnd - resourceEntry.fetchStart,
              timestamp: Date.now(),
              category: 'network',
              threshold: this.thresholds.networkRequest,
              unit: 'ms'
            });
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });

      // 측정 관찰
      const measureObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            this.addMetric({
              name: entry.name,
              value: entry.duration,
              timestamp: Date.now(),
              category: 'calculation',
              threshold: this.thresholds.calculationTime,
              unit: 'ms'
            });
          }
        }
      });
      measureObserver.observe({ entryTypes: ['measure'] });

    } catch (error) {
      console.warn('[PerformanceMonitor] Performance Observer 설정 실패:', error);
    }
  }

  // 시스템 메트릭 수집
  private collectSystemMetrics(): void {
    // 메모리 사용량
    if ((window as any).performance?.memory) {
      const memory = (window as any).performance.memory;
      this.addMetric({
        name: 'Memory Usage',
        value: memory.usedJSHeapSize / 1024 / 1024,
        timestamp: Date.now(),
        category: 'memory',
        threshold: this.thresholds.memoryUsage,
        unit: 'MB'
      });

      this.addMetric({
        name: 'Memory Limit',
        value: memory.jsHeapSizeLimit / 1024 / 1024,
        timestamp: Date.now(),
        category: 'memory',
        unit: 'MB'
      });
    }

    // 렌더링 성능 (FPS 추정)
    this.measureRenderPerformance();

    // localStorage 성능
    this.measureStoragePerformance();
  }

  // 렌더링 성능 측정
  private measureRenderPerformance(): void {
    const start = performance.now();
    requestAnimationFrame(() => {
      const renderTime = performance.now() - start;
      this.addMetric({
        name: 'Frame Render Time',
        value: renderTime,
        timestamp: Date.now(),
        category: 'render',
        threshold: this.thresholds.renderTime,
        unit: 'ms'
      });
    });
  }

  // 스토리지 성능 측정
  private measureStoragePerformance(): void {
    const testKey = 'perf-test-' + Date.now();
    const testData = JSON.stringify({ test: 'performance', data: new Array(100).fill('x') });

    // 쓰기 성능
    const writeStart = performance.now();
    localStorage.setItem(testKey, testData);
    const writeTime = performance.now() - writeStart;

    // 읽기 성능
    const readStart = performance.now();
    localStorage.getItem(testKey);
    const readTime = performance.now() - readStart;

    // 삭제
    localStorage.removeItem(testKey);

    this.addMetric({
      name: 'localStorage Write',
      value: writeTime,
      timestamp: Date.now(),
      category: 'storage',
      threshold: this.thresholds.storageOperation,
      unit: 'ms'
    });

    this.addMetric({
      name: 'localStorage Read',
      value: readTime,
      timestamp: Date.now(),
      category: 'storage',
      threshold: this.thresholds.storageOperation,
      unit: 'ms'
    });
  }

  // 메트릭 추가
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // 최대 1000개 메트릭 유지
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // 임계값 확인 및 알림 생성
    if (metric.threshold && metric.value > metric.threshold) {
      this.createBottleneckAlert(metric);
    }
  }

  // 병목 지점 알림 생성
  private createBottleneckAlert(metric: PerformanceMetric): void {
    let severity: BottleneckAlert['severity'] = 'low';
    let suggestion = '';

    if (metric.category === 'render' && metric.value > this.thresholds.renderTime) {
      severity = metric.value > 50 ? 'high' : 'medium';
      suggestion = '렌더링 최적화: React.memo(), useMemo(), useCallback() 사용 검토';
    } else if (metric.category === 'network' && metric.value > this.thresholds.networkRequest) {
      severity = metric.value > 10000 ? 'critical' : 'high';
      suggestion = '네트워크 최적화: 요청 배치, 캐싱, CDN 사용 검토';
    } else if (metric.category === 'memory' && metric.value > this.thresholds.memoryUsage) {
      severity = metric.value > 200 ? 'critical' : 'high';
      suggestion = '메모리 최적화: 메모리 누수 확인, 불필요한 객체 정리';
    } else if (metric.category === 'storage' && metric.value > this.thresholds.storageOperation) {
      severity = 'medium';
      suggestion = '스토리지 최적화: 데이터 크기 축소, 배치 처리 검토';
    } else if (metric.category === 'calculation' && metric.value > this.thresholds.calculationTime) {
      severity = metric.value > 500 ? 'high' : 'medium';
      suggestion = '계산 최적화: 웹워커 사용, 알고리즘 개선 검토';
    }

    const alert: BottleneckAlert = {
      component: metric.name,
      issue: `성능 임계값 초과: ${metric.value.toFixed(2)}${metric.unit} (임계값: ${metric.threshold}${metric.unit})`,
      severity,
      suggestion,
      timestamp: Date.now()
    };

    this.alerts.push(alert);

    // 최대 100개 알림 유지
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    console.warn(`[PerformanceMonitor] ${severity.toUpperCase()} 알림:`, alert);
  }

  // 병목 지점 분석
  private analyzeBottlenecks(): void {
    const recentMetrics = this.metrics.filter(m => Date.now() - m.timestamp < 30000); // 최근 30초

    const categoryAverages = this.calculateCategoryAverages(recentMetrics);

    // 각 카테고리별 성능 분석
    Object.entries(categoryAverages).forEach(([category, average]) => {
      const threshold = this.getThresholdForCategory(category as any);
      if (threshold && average > threshold * 1.5) {
        this.createSystemAlert(category as any, average, threshold);
      }
    });
  }

  // 카테고리별 평균 계산
  private calculateCategoryAverages(metrics: PerformanceMetric[]): Record<string, number> {
    const categories: Record<string, number[]> = {};

    metrics.forEach(metric => {
      if (!categories[metric.category]) {
        categories[metric.category] = [];
      }
      categories[metric.category].push(metric.value);
    });

    const averages: Record<string, number> = {};
    Object.entries(categories).forEach(([category, values]) => {
      averages[category] = values.reduce((a, b) => a + b, 0) / values.length;
    });

    return averages;
  }

  // 카테고리별 임계값 조회
  private getThresholdForCategory(category: PerformanceMetric['category']): number | undefined {
    switch (category) {
      case 'render': return this.thresholds.renderTime;
      case 'network': return this.thresholds.networkRequest;
      case 'memory': return this.thresholds.memoryUsage;
      case 'storage': return this.thresholds.storageOperation;
      case 'calculation': return this.thresholds.calculationTime;
      default: return undefined;
    }
  }

  // 시스템 레벨 알림 생성
  private createSystemAlert(category: PerformanceMetric['category'], average: number, threshold: number): void {
    const alert: BottleneckAlert = {
      component: `System ${category}`,
      issue: `시스템 성능 저하: 평균 ${average.toFixed(2)} (임계값: ${threshold})`,
      severity: 'high',
      suggestion: this.getSystemOptimizationSuggestion(category),
      timestamp: Date.now()
    };

    this.alerts.push(alert);
  }

  // 시스템 최적화 제안
  private getSystemOptimizationSuggestion(category: PerformanceMetric['category']): string {
    switch (category) {
      case 'render':
        return '전반적인 렌더링 성능 최적화: 컴포넌트 구조 재검토, 가상화 적용';
      case 'network':
        return '네트워크 성능 최적화: API 호출 최적화, 데이터 압축, 캐싱 전략 개선';
      case 'memory':
        return '메모리 관리 최적화: 전역 메모리 누수 확인, 가비지 컬렉션 최적화';
      case 'storage':
        return '스토리지 성능 최적화: 데이터 구조 개선, IndexedDB 도입 검토';
      case 'calculation':
        return '계산 성능 최적화: 무거운 계산 최적화, 웹워커 활용';
      default:
        return '일반적인 성능 최적화 검토 필요';
    }
  }

  // 벤치마크 실행
  async runBenchmark(name: string, fn: () => Promise<void> | void, iterations = 10): Promise<BenchmarkResult> {
    const times: number[] = [];
    const memoryBefore = this.getMemoryUsage();

    console.log(`[PerformanceMonitor] 벤치마크 시작: ${name} (${iterations}회 반복)`);

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }

    const memoryAfter = this.getMemoryUsage();
    const memoryUsed = memoryAfter - memoryBefore;

    const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const variance = times.reduce((a, b) => a + Math.pow(b - averageTime, 2), 0) / times.length;
    const standardDeviation = Math.sqrt(variance);

    const result: BenchmarkResult = {
      name,
      iterations,
      averageTime,
      minTime,
      maxTime,
      standardDeviation,
      memoryUsed
    };

    console.log(`[PerformanceMonitor] 벤치마크 완료:`, result);
    return result;
  }

  // 메모리 사용량 조회
  private getMemoryUsage(): number {
    if ((window as any).performance?.memory) {
      return (window as any).performance.memory.usedJSHeapSize / 1024 / 1024;
    }
    return 0;
  }

  // 성능 데이터 조회
  getPerformanceData() {
    return {
      metrics: this.metrics.slice(-100), // 최근 100개
      alerts: this.alerts.slice(-20), // 최근 20개
      summary: this.getPerformanceSummary()
    };
  }

  // 성능 요약 정보
  private getPerformanceSummary() {
    const recentMetrics = this.metrics.filter(m => Date.now() - m.timestamp < 60000); // 최근 1분

    if (recentMetrics.length === 0) {
      return {
        averageRenderTime: 0,
        averageMemoryUsage: 0,
        networkRequestCount: 0,
        alertCount: this.alerts.length
      };
    }

    const renderMetrics = recentMetrics.filter(m => m.category === 'render');
    const memoryMetrics = recentMetrics.filter(m => m.category === 'memory');
    const networkMetrics = recentMetrics.filter(m => m.category === 'network');

    return {
      averageRenderTime: renderMetrics.length > 0
        ? renderMetrics.reduce((a, b) => a + b.value, 0) / renderMetrics.length
        : 0,
      averageMemoryUsage: memoryMetrics.length > 0
        ? memoryMetrics.reduce((a, b) => a + b.value, 0) / memoryMetrics.length
        : 0,
      networkRequestCount: networkMetrics.length,
      alertCount: this.alerts.filter(a => Date.now() - a.timestamp < 60000).length
    };
  }

  // 성능 데이터 내보내기
  exportPerformanceData(): string {
    return JSON.stringify({
      metrics: this.metrics,
      alerts: this.alerts,
      summary: this.getPerformanceSummary(),
      timestamp: Date.now()
    }, null, 2);
  }
}

// 싱글톤 인스턴스
export const performanceMonitor = new PerformanceMonitor();

// 개발 환경에서 자동 시작 비활성화 (너무 많은 로그 출력 방지)
// if (typeof window !== 'undefined' && import.meta.env.DEV) {
//   performanceMonitor.startMonitoring();
//   (window as any).performanceMonitor = performanceMonitor;
//   console.log('💡 개발자 도구에서 "performanceMonitor" 객체 사용 가능');
// }