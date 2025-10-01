/**
 * Optimized Data Processor
 * 배치 처리, 청킹, Web Worker를 사용한 데이터 처리 최적화
 */

import type { ProcessedKPIData } from '@/types/reportV3.types';
import { getCacheManager } from './cacheManager';

/**
 * 배치 프로세서
 * 큰 데이터셋을 청크로 나누어 처리
 */
export class BatchProcessor {
  private batchSize: number;
  private delay: number;

  constructor(batchSize: number = 50, delay: number = 0) {
    this.batchSize = batchSize;
    this.delay = delay;
  }

  /**
   * 배치 처리 실행
   */
  async processBatch<T, R>(
    items: T[],
    processor: (item: T) => R | Promise<R>,
    onProgress?: (progress: number) => void
  ): Promise<R[]> {
    const results: R[] = [];
    const totalItems = items.length;

    for (let i = 0; i < totalItems; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);

      // 배치 처리
      const batchResults = await Promise.all(
        batch.map(item => processor(item))
      );

      results.push(...batchResults);

      // 진행률 업데이트
      if (onProgress) {
        const progress = Math.min(100, ((i + batch.length) / totalItems) * 100);
        onProgress(progress);
      }

      // CPU 블로킹 방지를 위한 지연
      if (this.delay > 0 && i + this.batchSize < totalItems) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }

    return results;
  }
}

/**
 * 데이터 청킹 유틸리티
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * 메모이제이션 헬퍼
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);

    // 캐시 크기 제한 (최대 100개)
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  }) as T;
}

/**
 * 디바운스 헬퍼
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * 쓰로틀 헬퍼
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): T {
  let inThrottle = false;
  let lastResult: ReturnType<T>;

  return ((...args: Parameters<T>): ReturnType<T> => {
    if (!inThrottle) {
      inThrottle = true;
      lastResult = fn(...args);

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }

    return lastResult;
  }) as T;
}

/**
 * 최적화된 데이터 프로세서
 */
export class OptimizedDataProcessor {
  private batchProcessor: BatchProcessor;
  private cache = getCacheManager();

  constructor() {
    this.batchProcessor = new BatchProcessor(25, 10);
  }

  /**
   * KPI 데이터 최적화 처리
   */
  async processKPIData(
    data: ProcessedKPIData[],
    options?: {
      useCache?: boolean;
      onProgress?: (progress: number) => void;
    }
  ): Promise<ProcessedKPIData[]> {
    const { useCache = true, onProgress } = options || {};

    // 캐시 확인
    if (useCache) {
      const cacheKey = this.cache.generateStaticKey('processed_kpi_data', data.length);
      const cached = this.cache.get<ProcessedKPIData[]>(cacheKey);
      if (cached) {
        console.log('✅ Using cached processed data');
        return cached;
      }
    }

    // 배치 처리
    const processed = await this.batchProcessor.processBatch(
      data,
      (item) => this.processKPIItem(item),
      onProgress
    );

    // 캐시 저장
    if (useCache) {
      const cacheKey = this.cache.generateStaticKey('processed_kpi_data', data.length);
      this.cache.set(cacheKey, processed, {
        ttlMinutes: 30,
        persistent: true
      });
    }

    return processed;
  }

  /**
   * 개별 KPI 아이템 처리
   */
  private processKPIItem(item: ProcessedKPIData): ProcessedKPIData {
    // 무거운 처리 시뮬레이션
    return {
      ...item,
      // 추가 처리 로직
      processed: true,
      timestamp: Date.now()
    } as ProcessedKPIData;
  }

  /**
   * 축별 데이터 집계 (최적화)
   */
  aggregateByAxis(
    data: ProcessedKPIData[]
  ): Record<string, { score: number; count: number }> {
    // Map을 사용한 효율적인 집계
    const axisMap = new Map<string, { sum: number; count: number }>();

    for (const item of data) {
      const axis = item.axis;
      const current = axisMap.get(axis) || { sum: 0, count: 0 };

      axisMap.set(axis, {
        sum: current.sum + (item.score || 0),
        count: current.count + 1
      });
    }

    // 결과 변환
    const result: Record<string, { score: number; count: number }> = {};

    for (const [axis, { sum, count }] of axisMap) {
      result[axis] = {
        score: count > 0 ? sum / count : 0,
        count
      };
    }

    return result;
  }

  /**
   * 대량 데이터 필터링 (최적화)
   */
  filterLargeDataset<T>(
    data: T[],
    predicate: (item: T) => boolean,
    options?: {
      batchSize?: number;
      parallel?: boolean;
    }
  ): T[] {
    const { batchSize = 100, parallel = false } = options || {};

    if (data.length < batchSize || !parallel) {
      // 작은 데이터셋은 직접 처리
      return data.filter(predicate);
    }

    // 큰 데이터셋은 청킹하여 처리
    const chunks = chunkArray(data, batchSize);
    const results: T[] = [];

    for (const chunk of chunks) {
      results.push(...chunk.filter(predicate));
    }

    return results;
  }

  /**
   * 데이터 정렬 (최적화)
   */
  sortOptimized<T>(
    data: T[],
    compareFn: (a: T, b: T) => number,
    options?: {
      stable?: boolean;
      inPlace?: boolean;
    }
  ): T[] {
    const { stable = false, inPlace = false } = options || {};

    const toSort = inPlace ? data : [...data];

    if (stable && data.length < 10) {
      // 작은 데이터셋에 대해 안정 정렬
      return toSort.sort(compareFn);
    }

    // 큰 데이터셋에 대해 quicksort 사용
    this.quickSort(toSort, 0, toSort.length - 1, compareFn);
    return toSort;
  }

  /**
   * QuickSort 구현
   */
  private quickSort<T>(
    arr: T[],
    left: number,
    right: number,
    compareFn: (a: T, b: T) => number
  ): void {
    if (left < right) {
      const pivot = this.partition(arr, left, right, compareFn);
      this.quickSort(arr, left, pivot - 1, compareFn);
      this.quickSort(arr, pivot + 1, right, compareFn);
    }
  }

  private partition<T>(
    arr: T[],
    left: number,
    right: number,
    compareFn: (a: T, b: T) => number
  ): number {
    const pivot = arr[right];
    let i = left - 1;

    for (let j = left; j < right; j++) {
      if (compareFn(arr[j], pivot) <= 0) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }

    [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
    return i + 1;
  }

  /**
   * 데이터 변환 파이프라인
   */
  createPipeline<T>(...transforms: Array<(data: T) => T>): (data: T) => T {
    return (data: T) => transforms.reduce((acc, transform) => transform(acc), data);
  }

  /**
   * 병렬 처리 헬퍼
   */
  async processParallel<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    concurrency: number = 5
  ): Promise<R[]> {
    const results: R[] = [];
    const executing: Promise<void>[] = [];

    for (const item of items) {
      const promise = processor(item).then(result => {
        results.push(result);
      });

      executing.push(promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === promise), 1);
      }
    }

    await Promise.all(executing);
    return results;
  }
}

// 싱글톤 인스턴스
let processorInstance: OptimizedDataProcessor | null = null;

export function getOptimizedProcessor(): OptimizedDataProcessor {
  if (!processorInstance) {
    processorInstance = new OptimizedDataProcessor();
  }
  return processorInstance;
}

/**
 * 성능 측정 데코레이터
 */
export function measurePerformance(
  target: any,
  propertyName: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const start = performance.now();
    const result = originalMethod.apply(this, args);
    const end = performance.now();

    console.log(`⏱️ ${propertyName} took ${(end - start).toFixed(2)}ms`);

    return result;
  };

  return descriptor;
}