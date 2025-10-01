/**
 * 모멘텀 계산 캐싱 시스템
 * 불필요한 재계산을 방지하고 성능을 최적화
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  dependencies: string[];
}

interface CacheConfig {
  ttl: number; // Time to live (ms)
  maxSize: number; // 최대 캐시 크기
}

class MomentumCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig = {
    ttl: 30000, // 30초
    maxSize: 100
  };

  // 캐시 키 생성 (의존성 기반)
  private generateKey(baseKey: string, dependencies: string[]): string {
    const depString = dependencies.sort().join('|');
    return `${baseKey}:${this.hashString(depString)}`;
  }

  // 간단한 해시 함수
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit 정수로 변환
    }
    return Math.abs(hash).toString(36);
  }

  // 의존성 값들 수집
  private collectDependencies(dependencyKeys: string[]): string[] {
    return dependencyKeys.map(key => {
      const value = localStorage.getItem(key);
      return `${key}=${value || 'null'}`;
    });
  }

  // 캐시에서 값 가져오기
  get<T>(key: string, dependencyKeys: string[] = []): T | null {
    const dependencies = this.collectDependencies(dependencyKeys);
    const cacheKey = this.generateKey(key, dependencies);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      console.log(`[MomentumCache] Cache miss: ${key}`);
      return null;
    }

    // TTL 확인
    if (Date.now() - entry.timestamp > this.config.ttl) {
      console.log(`[MomentumCache] Cache expired: ${key}`);
      this.cache.delete(cacheKey);
      return null;
    }

    console.log(`[MomentumCache] Cache hit: ${key}`);
    return entry.data;
  }

  // 캐시에 값 저장
  set<T>(key: string, data: T, dependencyKeys: string[] = []): void {
    const dependencies = this.collectDependencies(dependencyKeys);
    const cacheKey = this.generateKey(key, dependencies);

    // 캐시 크기 제한
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      console.log(`[MomentumCache] Evicted oldest entry: ${oldestKey}`);
    }

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      dependencies
    });

    console.log(`[MomentumCache] Cached: ${key} (deps: ${dependencyKeys.length})`);
  }

  // 특정 의존성과 관련된 캐시 무효화
  invalidate(dependencyPattern?: string): void {
    if (!dependencyPattern) {
      // 전체 캐시 클리어
      this.cache.clear();
      console.log(`[MomentumCache] Cleared all cache`);
      return;
    }

    // 패턴과 일치하는 캐시 항목들 삭제
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      const hasMatchingDep = entry.dependencies.some(dep =>
        dep.includes(dependencyPattern)
      );

      if (hasMatchingDep) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`[MomentumCache] Invalidated ${keysToDelete.length} entries for pattern: ${dependencyPattern}`);
  }

  // 캐시 통계
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      ttl: this.config.ttl,
      entries: Array.from(this.cache.keys())
    };
  }

  // 캐시 설정 업데이트
  configure(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
    console.log(`[MomentumCache] Configuration updated:`, this.config);
  }
}

// 싱글톤 인스턴스
export const momentumCache = new MomentumCache();

// 자주 사용되는 의존성 키들
export const CACHE_DEPENDENCIES = {
  KPI_DATA: ['kpi-updates-today', 'kpi-average-score', 'kpi-previous-score'],
  TASK_DATA: ['tasks-completed-today', 'milestones-completed-today'],
  DOCUMENT_DATA: ['documents-accessed-today'],
  SESSION_DATA: ['session-start-time', 'last-login-date', 'login-streak'],
  GOAL_DATA: ['weekly-goals', 'goals-achieved', 'goals-total'],
  ACTIVITY_DATA: ['activity-today']
} as const;

// 캐시 키 상수
export const CACHE_KEYS = {
  BUSINESS_HEALTH: 'business-health',
  MOMENTUM_SCORE: 'momentum-score',
  ACTIVITY_METRICS: 'activity-metrics',
  CONSISTENCY_METRICS: 'consistency-metrics',
  GROWTH_METRICS: 'growth-metrics',
  PERFORMANCE_METRICS: 'performance-metrics'
} as const;