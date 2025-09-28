/**
 * AI Performance Optimizer - Phase 8
 * AI 시스템의 성능 최적화와 모니터링을 위한 유틸리티
 */

// 성능 모니터링 인터페이스
export interface PerformanceMetrics {
  totalTime: number;
  serviceTimings: Record<string, number>;
  memoryUsage: MemoryUsage;
  cachePerformance: CacheMetrics;
  errorRate: number;
  throughput: number;
  latency: number;
}

export interface MemoryUsage {
  used: number;
  total: number;
  percentage: number;
  heap: {
    used: number;
    total: number;
  };
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  size: number;
  evictionCount: number;
  averageAccessTime: number;
}

// 최적화 설정
export interface OptimizationConfig {
  enableLazyLoading: boolean;
  enableCaching: boolean;
  enableBatching: boolean;
  enableParallelProcessing: boolean;
  maxConcurrency: number;
  cacheSize: number;
  batchSize: number;
  throttleDelay: number;
}

// 성능 임계값
export interface PerformanceThresholds {
  maxResponseTime: number; // ms
  maxMemoryUsage: number; // MB
  minCacheHitRate: number; // 0-1
  maxErrorRate: number; // 0-1
  minThroughput: number; // operations/sec
}

/**
 * AI 성능 최적화 매니저
 */
export class AIPerformanceOptimizer {
  private config: OptimizationConfig;
  private thresholds: PerformanceThresholds;
  private metrics: PerformanceMetrics[] = [];
  private startTime: number = 0;
  private operationCount: number = 0;
  private errorCount: number = 0;

  // 최적화 기법들
  private lazyLoadCache = new Map<string, any>();
  private batchQueue: Array<{ operation: () => Promise<any>; resolve: Function; reject: Function }> = [];
  private throttleTimers = new Map<string, NodeJS.Timeout>();
  private parallelPool: Array<Promise<any>> = [];

  constructor(
    config?: Partial<OptimizationConfig>,
    thresholds?: Partial<PerformanceThresholds>
  ) {
    this.config = {
      enableLazyLoading: true,
      enableCaching: true,
      enableBatching: true,
      enableParallelProcessing: true,
      maxConcurrency: 4,
      cacheSize: 100,
      batchSize: 5,
      throttleDelay: 1000,
      ...config
    };

    this.thresholds = {
      maxResponseTime: 5000, // 5초
      maxMemoryUsage: 500, // 500MB
      minCacheHitRate: 0.7, // 70%
      maxErrorRate: 0.05, // 5%
      minThroughput: 10, // 10 operations/sec
      ...thresholds
    };

    this.startMonitoring();
  }

  /**
   * 레이지 로딩 최적화
   */
  async lazyLoad<T>(key: string, loader: () => Promise<T>): Promise<T> {
    if (!this.config.enableLazyLoading) {
      return loader();
    }

    if (this.lazyLoadCache.has(key)) {
      return this.lazyLoadCache.get(key);
    }

    const data = await loader();

    // 캐시 크기 제한
    if (this.lazyLoadCache.size >= this.config.cacheSize) {
      const firstKey = this.lazyLoadCache.keys().next().value;
      this.lazyLoadCache.delete(firstKey);
    }

    this.lazyLoadCache.set(key, data);
    return data;
  }

  /**
   * 배치 처리 최적화
   */
  async batchOperation<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.config.enableBatching) {
      return operation();
    }

    return new Promise((resolve, reject) => {
      this.batchQueue.push({ operation, resolve, reject });

      if (this.batchQueue.length >= this.config.batchSize) {
        this.processBatch();
      } else {
        // 지연 후 배치 처리
        setTimeout(() => {
          if (this.batchQueue.length > 0) {
            this.processBatch();
          }
        }, this.config.throttleDelay);
      }
    });
  }

  /**
   * 배치 처리 실행
   */
  private async processBatch(): Promise<void> {
    const batch = this.batchQueue.splice(0, this.config.batchSize);

    try {
      const results = await Promise.allSettled(
        batch.map(item => item.operation())
      );

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          batch[index].resolve(result.value);
        } else {
          batch[index].reject(result.reason);
          this.errorCount++;
        }
      });
    } catch (error) {
      batch.forEach(item => item.reject(error));
      this.errorCount += batch.length;
    }
  }

  /**
   * 쓰로틀링 최적화
   */
  throttle<T extends (...args: any[]) => any>(key: string, func: T, delay?: number): T {
    const throttleDelay = delay || this.config.throttleDelay;

    return ((...args: any[]) => {
      if (this.throttleTimers.has(key)) {
        return;
      }

      const timer = setTimeout(() => {
        this.throttleTimers.delete(key);
      }, throttleDelay);

      this.throttleTimers.set(key, timer);
      return func(...args);
    }) as T;
  }

  /**
   * 병렬 처리 최적화
   */
  async parallelProcess<T>(operations: Array<() => Promise<T>>): Promise<T[]> {
    if (!this.config.enableParallelProcessing) {
      const results: T[] = [];
      for (const operation of operations) {
        results.push(await operation());
      }
      return results;
    }

    const chunks: Array<Array<() => Promise<T>>> = [];

    // 동시 실행 수 제한
    for (let i = 0; i < operations.length; i += this.config.maxConcurrency) {
      chunks.push(operations.slice(i, i + this.config.maxConcurrency));
    }

    const allResults: T[] = [];

    for (const chunk of chunks) {
      const chunkResults = await Promise.allSettled(
        chunk.map(operation => operation())
      );

      const chunkValues = chunkResults.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          this.errorCount++;
          console.error(`Parallel operation ${index} failed:`, result.reason);
          return null;
        }
      }).filter(value => value !== null) as T[];

      allResults.push(...chunkValues);
    }

    return allResults;
  }

  /**
   * 메모리 최적화
   */
  optimizeMemory(): void {
    // 가비지 컬렉션 힌트 (Node.js 환경)
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }

    // 레이지 로드 캐시 정리
    if (this.lazyLoadCache.size > this.config.cacheSize * 0.8) {
      const keysToDelete = Array.from(this.lazyLoadCache.keys())
        .slice(0, Math.floor(this.config.cacheSize * 0.2));

      keysToDelete.forEach(key => this.lazyLoadCache.delete(key));
    }

    // 오래된 쓰로틀 타이머 정리
    this.throttleTimers.forEach((timer, key) => {
      clearTimeout(timer);
      this.throttleTimers.delete(key);
    });
  }

  /**
   * 성능 메트릭 수집
   */
  collectMetrics(): PerformanceMetrics {
    const currentTime = Date.now();
    const totalTime = currentTime - this.startTime;

    // 메모리 사용량 (브라우저 환경)
    const memoryUsage: MemoryUsage = this.getMemoryUsage();

    // 캐시 성능
    const cacheMetrics: CacheMetrics = {
      hitRate: this.calculateCacheHitRate(),
      missRate: 1 - this.calculateCacheHitRate(),
      size: this.lazyLoadCache.size,
      evictionCount: Math.max(0, this.operationCount - this.config.cacheSize),
      averageAccessTime: totalTime / Math.max(1, this.operationCount)
    };

    // 에러율 및 처리량
    const errorRate = this.errorCount / Math.max(1, this.operationCount);
    const throughput = this.operationCount / Math.max(1, totalTime / 1000);
    const latency = totalTime / Math.max(1, this.operationCount);

    const metrics: PerformanceMetrics = {
      totalTime,
      serviceTimings: this.getServiceTimings(),
      memoryUsage,
      cachePerformance: cacheMetrics,
      errorRate,
      throughput,
      latency
    };

    this.metrics.push(metrics);

    // 메트릭 히스토리 제한
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    return metrics;
  }

  /**
   * 메모리 사용량 조회
   */
  private getMemoryUsage(): MemoryUsage {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      const memory = (window.performance as any).memory;
      return {
        used: memory.usedJSHeapSize / 1024 / 1024, // MB
        total: memory.totalJSHeapSize / 1024 / 1024, // MB
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
        heap: {
          used: memory.usedJSHeapSize / 1024 / 1024,
          total: memory.totalJSHeapSize / 1024 / 1024
        }
      };
    }

    // Node.js 환경 또는 기본값
    return {
      used: 0,
      total: 0,
      percentage: 0,
      heap: { used: 0, total: 0 }
    };
  }

  /**
   * 캐시 적중률 계산
   */
  private calculateCacheHitRate(): number {
    // 간소화된 계산 (실제로는 캐시 히트/미스 카운터가 필요)
    return Math.min(0.95, this.lazyLoadCache.size / Math.max(1, this.operationCount));
  }

  /**
   * 서비스별 타이밍 조회
   */
  private getServiceTimings(): Record<string, number> {
    // 실제 구현에서는 각 서비스별 타이밍을 추적
    return {
      orchestrator: 1500,
      simulation: 800,
      prediction: 2000,
      patternRecognition: 600,
      anomalyDetection: 400
    };
  }

  /**
   * 성능 임계값 검사
   */
  checkPerformanceThresholds(metrics: PerformanceMetrics): {
    violations: string[];
    recommendations: string[];
  } {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // 응답 시간 검사
    if (metrics.latency > this.thresholds.maxResponseTime) {
      violations.push(`평균 응답 시간이 ${this.thresholds.maxResponseTime}ms를 초과했습니다`);
      recommendations.push('배치 처리나 병렬 처리를 활성화하세요');
    }

    // 메모리 사용량 검사
    if (metrics.memoryUsage.used > this.thresholds.maxMemoryUsage) {
      violations.push(`메모리 사용량이 ${this.thresholds.maxMemoryUsage}MB를 초과했습니다`);
      recommendations.push('메모리 최적화를 실행하세요');
    }

    // 캐시 적중률 검사
    if (metrics.cachePerformance.hitRate < this.thresholds.minCacheHitRate) {
      violations.push(`캐시 적중률이 ${this.thresholds.minCacheHitRate * 100}% 미만입니다`);
      recommendations.push('캐시 크기를 늘리거나 캐시 전략을 개선하세요');
    }

    // 에러율 검사
    if (metrics.errorRate > this.thresholds.maxErrorRate) {
      violations.push(`에러율이 ${this.thresholds.maxErrorRate * 100}%를 초과했습니다`);
      recommendations.push('에러 핸들링을 강화하고 재시도 로직을 추가하세요');
    }

    // 처리량 검사
    if (metrics.throughput < this.thresholds.minThroughput) {
      violations.push(`처리량이 ${this.thresholds.minThroughput} operations/sec 미만입니다`);
      recommendations.push('병렬 처리를 활성화하거나 동시 실행 수를 늘리세요');
    }

    return { violations, recommendations };
  }

  /**
   * 자동 최적화 수행
   */
  autoOptimize(metrics: PerformanceMetrics): void {
    const { violations, recommendations } = this.checkPerformanceThresholds(metrics);

    if (violations.length === 0) {
      console.log('✅ 성능이 모든 임계값 내에 있습니다');
      return;
    }

    console.log('🔧 성능 최적화를 수행합니다...');

    // 메모리 사용량이 높은 경우
    if (metrics.memoryUsage.used > this.thresholds.maxMemoryUsage) {
      this.optimizeMemory();
      console.log('🧹 메모리 정리 완료');
    }

    // 캐시 적중률이 낮은 경우
    if (metrics.cachePerformance.hitRate < this.thresholds.minCacheHitRate) {
      this.config.cacheSize = Math.min(200, this.config.cacheSize * 1.5);
      console.log(`💾 캐시 크기를 ${this.config.cacheSize}로 증가`);
    }

    // 처리량이 낮은 경우
    if (metrics.throughput < this.thresholds.minThroughput) {
      this.config.maxConcurrency = Math.min(8, this.config.maxConcurrency + 1);
      console.log(`⚡ 동시 실행 수를 ${this.config.maxConcurrency}로 증가`);
    }

    // 응답 시간이 느린 경우
    if (metrics.latency > this.thresholds.maxResponseTime) {
      this.config.batchSize = Math.min(10, this.config.batchSize + 1);
      console.log(`📦 배치 크기를 ${this.config.batchSize}로 증가`);
    }
  }

  /**
   * 성능 리포트 생성
   */
  generatePerformanceReport(): {
    summary: string;
    metrics: PerformanceMetrics;
    trends: any;
    recommendations: string[];
  } {
    const currentMetrics = this.collectMetrics();
    const { violations, recommendations } = this.checkPerformanceThresholds(currentMetrics);

    // 트렌드 분석
    const trends = this.analyzeTrends();

    const summary = violations.length > 0
      ? `⚠️ ${violations.length}개의 성능 이슈가 감지되었습니다`
      : '✅ 모든 성능 지표가 양호합니다';

    return {
      summary,
      metrics: currentMetrics,
      trends,
      recommendations
    };
  }

  /**
   * 트렌드 분석
   */
  private analyzeTrends(): any {
    if (this.metrics.length < 2) {
      return { insufficient_data: true };
    }

    const recent = this.metrics.slice(-10);
    const latencyTrend = this.calculateTrend(recent.map(m => m.latency));
    const throughputTrend = this.calculateTrend(recent.map(m => m.throughput));
    const errorRateTrend = this.calculateTrend(recent.map(m => m.errorRate));

    return {
      latency: latencyTrend,
      throughput: throughputTrend,
      errorRate: errorRateTrend
    };
  }

  /**
   * 트렌드 계산
   */
  private calculateTrend(values: number[]): { direction: string; slope: number } {
    if (values.length < 2) {
      return { direction: 'stable', slope: 0 };
    }

    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    let direction = 'stable';
    if (Math.abs(slope) > 0.1) {
      direction = slope > 0 ? 'increasing' : 'decreasing';
    }

    return { direction, slope };
  }

  /**
   * 모니터링 시작
   */
  private startMonitoring(): void {
    this.startTime = Date.now();
    this.operationCount = 0;
    this.errorCount = 0;

    // 정기적으로 메트릭 수집 및 자동 최적화
    setInterval(() => {
      const metrics = this.collectMetrics();
      this.autoOptimize(metrics);
    }, 30000); // 30초마다
  }

  /**
   * 작업 완료 기록
   */
  recordOperation(success: boolean = true): void {
    this.operationCount++;
    if (!success) {
      this.errorCount++;
    }
  }

  /**
   * 캐시 클리어
   */
  clearCache(): void {
    this.lazyLoadCache.clear();
    console.log('🧹 캐시가 정리되었습니다');
  }

  /**
   * 설정 업데이트
   */
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ 최적화 설정이 업데이트되었습니다');
  }

  /**
   * 메트릭 히스토리 조회
   */
  getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * 현재 설정 조회
   */
  getConfig(): OptimizationConfig {
    return { ...this.config };
  }
}

// 싱글톤 인스턴스
let performanceOptimizer: AIPerformanceOptimizer | null = null;

export const getAIPerformanceOptimizer = (
  config?: Partial<OptimizationConfig>,
  thresholds?: Partial<PerformanceThresholds>
): AIPerformanceOptimizer => {
  if (!performanceOptimizer) {
    performanceOptimizer = new AIPerformanceOptimizer(config, thresholds);
  }
  return performanceOptimizer;
};

/**
 * 성능 데코레이터 (함수 래핑용)
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  func: T,
  functionName: string
): T {
  const optimizer = getAIPerformanceOptimizer();

  return ((...args: any[]) => {
    const startTime = Date.now();

    try {
      const result = func(...args);

      // Promise 처리
      if (result instanceof Promise) {
        return result
          .then(value => {
            optimizer.recordOperation(true);
            return value;
          })
          .catch(error => {
            optimizer.recordOperation(false);
            throw error;
          });
      }

      optimizer.recordOperation(true);
      return result;
    } catch (error) {
      optimizer.recordOperation(false);
      throw error;
    }
  }) as T;
}

/**
 * 성능 측정 유틸리티
 */
export class PerformanceTimer {
  private startTime: number;
  private label: string;

  constructor(label: string) {
    this.label = label;
    this.startTime = performance.now();
  }

  end(): number {
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    console.log(`⏱️ ${this.label}: ${duration.toFixed(2)}ms`);
    return duration;
  }
}

export default {
  AIPerformanceOptimizer,
  getAIPerformanceOptimizer,
  withPerformanceMonitoring,
  PerformanceTimer
};