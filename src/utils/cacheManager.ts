/**
 * Cache Manager
 * 다층 캐싱 시스템 구현 (메모리 + localStorage)
 */

/**
 * LRU (Least Recently Used) 캐시 구현
 */
class LRUCache<T> {
  private cache: Map<string, { value: T; timestamp: number }>;
  private maxSize: number;
  private ttl: number; // Time To Live in milliseconds

  constructor(maxSize: number = 50, ttlMinutes: number = 15) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttlMinutes * 60 * 1000;
  }

  /**
   * 캐시에서 값 가져오기
   */
  get(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) return null;

    // TTL 체크
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // LRU: 최근 사용으로 이동
    this.cache.delete(key);
    this.cache.set(key, item);

    return item.value;
  }

  /**
   * 캐시에 값 저장
   */
  set(key: string, value: T): void {
    // 기존 키 제거 (LRU 순서 업데이트)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // 크기 제한 체크
    if (this.cache.size >= this.maxSize) {
      // 가장 오래된 항목 제거 (첫 번째)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    // 새 항목 추가 (맨 뒤)
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * 캐시 무효화
   */
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // 패턴 매칭으로 선택적 무효화
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * 캐시 통계
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0 // 실제 구현 시 hit/miss 추적 필요
    };
  }
}

/**
 * LocalStorage 캐시 래퍼
 */
class LocalStorageCache {
  private prefix: string;
  private maxSize: number; // bytes
  private compressionEnabled: boolean;

  constructor(prefix: string = 'kpi_cache_', maxSizeMB: number = 5) {
    this.prefix = prefix;
    this.maxSize = maxSizeMB * 1024 * 1024; // MB to bytes
    this.compressionEnabled = true;
  }

  /**
   * localStorage에서 값 가져오기
   */
  get<T>(key: string): T | null {
    try {
      const fullKey = this.prefix + key;
      const item = localStorage.getItem(fullKey);

      if (!item) return null;

      const parsed = JSON.parse(item);

      // TTL 체크
      if (parsed.expiry && Date.now() > parsed.expiry) {
        localStorage.removeItem(fullKey);
        return null;
      }

      return parsed.value as T;
    } catch (error) {
      console.error('LocalStorage get error:', error);
      return null;
    }
  }

  /**
   * localStorage에 값 저장
   */
  set<T>(key: string, value: T, ttlMinutes: number = 60): boolean {
    try {
      const fullKey = this.prefix + key;
      const item = {
        value,
        expiry: Date.now() + (ttlMinutes * 60 * 1000),
        timestamp: Date.now()
      };

      const serialized = JSON.stringify(item);

      // 크기 체크
      if (serialized.length > this.maxSize) {
        console.warn('Cache item too large:', key);
        return false;
      }

      // 공간 확보
      this.ensureSpace(serialized.length);

      localStorage.setItem(fullKey, serialized);
      return true;
    } catch (error) {
      console.error('LocalStorage set error:', error);

      // 용량 초과 시 오래된 항목 삭제
      if (error instanceof DOMException && error.code === 22) {
        this.clearOldest();
        // 재시도
        try {
          const fullKey = this.prefix + key;
          localStorage.setItem(fullKey, JSON.stringify({ value, expiry: Date.now() + (ttlMinutes * 60 * 1000) }));
          return true;
        } catch {
          return false;
        }
      }

      return false;
    }
  }

  /**
   * 캐시 무효화
   */
  invalidate(pattern?: string): void {
    const keysToDelete: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        if (!pattern || key.includes(pattern)) {
          keysToDelete.push(key);
        }
      }
    }

    keysToDelete.forEach(key => localStorage.removeItem(key));
  }

  /**
   * 공간 확보
   */
  private ensureSpace(requiredBytes: number): void {
    const currentSize = this.getCurrentSize();

    if (currentSize + requiredBytes > this.maxSize) {
      // 필요한 공간만큼 오래된 항목 삭제
      this.clearOldest(requiredBytes);
    }
  }

  /**
   * 현재 사용 크기 계산
   */
  private getCurrentSize(): number {
    let size = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        const item = localStorage.getItem(key);
        size += item ? item.length : 0;
      }
    }
    return size;
  }

  /**
   * 오래된 항목 삭제
   */
  private clearOldest(bytesNeeded: number = 0): void {
    const items: Array<{ key: string; timestamp: number }> = [];

    // 타임스탬프 수집
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            items.push({ key, timestamp: parsed.timestamp || 0 });
          }
        } catch {}
      }
    }

    // 오래된 순으로 정렬
    items.sort((a, b) => a.timestamp - b.timestamp);

    // 필요한 만큼 삭제
    let clearedBytes = 0;
    for (const item of items) {
      if (bytesNeeded > 0 && clearedBytes >= bytesNeeded) break;

      const itemSize = localStorage.getItem(item.key)?.length || 0;
      localStorage.removeItem(item.key);
      clearedBytes += itemSize;
    }
  }

  /**
   * 통계 정보
   */
  getStats() {
    let count = 0;
    let size = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        count++;
        const item = localStorage.getItem(key);
        size += item ? item.length : 0;
      }
    }

    return {
      count,
      size,
      sizeKB: Math.round(size / 1024),
      maxSizeKB: Math.round(this.maxSize / 1024)
    };
  }
}

/**
 * 메인 캐시 매니저
 */
export class CacheManager {
  private memoryCache: LRUCache<any>;
  private storageCache: LocalStorageCache;
  private hits: number = 0;
  private misses: number = 0;

  constructor() {
    // L1: 메모리 캐시 (빠름, 50개 항목, 15분 TTL)
    this.memoryCache = new LRUCache(50, 15);

    // L2: localStorage (느림, 5MB, 60분 TTL)
    this.storageCache = new LocalStorageCache('kpi_v3_', 5);
  }

  /**
   * 캐시 키 생성
   */
  generateKey(type: string, ...params: any[]): string {
    const paramStr = params.map(p => {
      if (typeof p === 'object') {
        return JSON.stringify(p).substring(0, 50); // 간단한 해시
      }
      return String(p);
    }).join('_');

    return `${type}_${paramStr}_${Date.now()}`;
  }

  /**
   * 정적 캐시 키 생성 (타임스탬프 없음)
   */
  generateStaticKey(type: string, ...params: any[]): string {
    const paramStr = params.map(p => {
      if (typeof p === 'object') {
        return JSON.stringify(p).substring(0, 50);
      }
      return String(p);
    }).join('_');

    return `${type}_${paramStr}`;
  }

  /**
   * 캐시에서 데이터 가져오기 (2단계 체크)
   */
  get<T>(key: string): T | null {
    // L1: 메모리 캐시 체크
    let value = this.memoryCache.get(key);
    if (value !== null) {
      this.hits++;
      return value as T;
    }

    // L2: localStorage 체크
    value = this.storageCache.get(key);
    if (value !== null) {
      // 메모리 캐시로 승급
      this.memoryCache.set(key, value);
      this.hits++;
      return value as T;
    }

    this.misses++;
    return null;
  }

  /**
   * 캐시에 데이터 저장 (2단계 저장)
   */
  set<T>(key: string, value: T, options?: { ttlMinutes?: number; persistent?: boolean }): void {
    const ttl = options?.ttlMinutes || 15;

    // L1: 항상 메모리 캐시에 저장
    this.memoryCache.set(key, value);

    // L2: persistent 옵션이 있으면 localStorage에도 저장
    if (options?.persistent) {
      this.storageCache.set(key, value, ttl);
    }
  }

  /**
   * 캐시 무효화
   */
  invalidate(pattern?: string): void {
    this.memoryCache.invalidate(pattern);
    this.storageCache.invalidate(pattern);
  }

  /**
   * 축별 캐시 무효화
   */
  invalidateAxis(axis: string): void {
    this.invalidate(`axis_${axis}`);
  }

  /**
   * KPI별 캐시 무효화
   */
  invalidateKPI(kpiId: string): void {
    this.invalidate(`kpi_${kpiId}`);
  }

  /**
   * 전체 캐시 클리어
   */
  clear(): void {
    this.memoryCache.invalidate();
    this.storageCache.invalidate();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * 캐시 통계
   */
  getStats() {
    const hitRate = this.hits + this.misses > 0
      ? (this.hits / (this.hits + this.misses)) * 100
      : 0;

    return {
      memory: this.memoryCache.getStats(),
      storage: this.storageCache.getStats(),
      hits: this.hits,
      misses: this.misses,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  /**
   * 디버그 정보 출력
   */
  debug(): void {
    console.group('🗄️ Cache Manager Debug');
    console.log('Stats:', this.getStats());
    console.log('Hit Rate:', `${this.getStats().hitRate}%`);
    console.groupEnd();
  }
}

// 싱글톤 인스턴스
let cacheManagerInstance: CacheManager | null = null;

/**
 * 캐시 매니저 인스턴스 가져오기
 */
export function getCacheManager(): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager();
  }
  return cacheManagerInstance;
}

/**
 * 캐시 데코레이터 (함수 결과 캐싱)
 */
export function cached<T>(
  keyPrefix: string,
  ttlMinutes: number = 15,
  persistent: boolean = false
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cache = getCacheManager();
      const cacheKey = cache.generateStaticKey(keyPrefix, ...args);

      // 캐시 체크
      const cachedResult = cache.get<T>(cacheKey);
      if (cachedResult !== null) {
        console.log(`✅ Cache hit: ${cacheKey}`);
        return cachedResult;
      }

      // 원본 함수 실행
      console.log(`❌ Cache miss: ${cacheKey}`);
      const result = await originalMethod.apply(this, args);

      // 결과 캐싱
      cache.set(cacheKey, result, { ttlMinutes, persistent });

      return result;
    };

    return descriptor;
  };
}