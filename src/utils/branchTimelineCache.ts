/**
 * @fileoverview 브랜치 타임라인 캐시 시스템
 * @description 레이아웃 계산 결과 캐싱 및 무효화 관리
 * @author PocketCompany
 * @since 2025-01-20
 */

import type {
  FeedItem,
  FeedItemWithPosition,
  LayoutEngineResult,
  StagePosition,
  BranchConnector,
  TimelineFilter
} from '../types/branch-timeline.types';
import type { ProjectPhase } from '../types/buildup.types';

interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  hash: string;
  accessCount: number;
  lastAccessed: Date;
}

interface CacheConfig {
  maxEntries: number;
  maxAge: number; // milliseconds
  cleanupInterval: number; // milliseconds
}

/**
 * 브랜치 타임라인 전용 캐시 시스템
 */
export class BranchTimelineCache {
  private layoutCache = new Map<string, CacheEntry<LayoutEngineResult>>();
  private positionCache = new Map<string, CacheEntry<FeedItemWithPosition[]>>();
  private stageCache = new Map<string, CacheEntry<Record<ProjectPhase, StagePosition>>>();
  private connectorCache = new Map<string, CacheEntry<BranchConnector[]>>();
  private filterCache = new Map<string, CacheEntry<FeedItem[]>>();

  private config: CacheConfig = {
    maxEntries: 50,
    maxAge: 5 * 60 * 1000, // 5분
    cleanupInterval: 60 * 1000 // 1분마다 정리
  };

  private cleanupTimer?: NodeJS.Timeout;

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.startCleanupTimer();
  }

  /**
   * 데이터 해시 생성
   */
  private generateHash(data: any): string {
    return JSON.stringify(data).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0).toString(36);
  }

  /**
   * 캐시 엔트리가 유효한지 확인
   */
  private isValid<T>(entry: CacheEntry<T>): boolean {
    const now = new Date();
    const age = now.getTime() - entry.timestamp.getTime();
    return age < this.config.maxAge;
  }

  /**
   * 캐시 정리 (오래된 항목 제거)
   */
  private cleanup(): void {
    const now = new Date();

    [this.layoutCache, this.positionCache, this.stageCache, this.connectorCache, this.filterCache]
      .forEach(cache => {
        const toDelete: string[] = [];

        cache.forEach((entry, key) => {
          if (!this.isValid(entry)) {
            toDelete.push(key);
          }
        });

        toDelete.forEach(key => cache.delete(key));

        // 최대 엔트리 수 제한
        if (cache.size > this.config.maxEntries) {
          const sortedEntries = Array.from(cache.entries())
            .sort((a, b) => a[1].lastAccessed.getTime() - b[1].lastAccessed.getTime());

          const toRemove = sortedEntries.slice(0, cache.size - this.config.maxEntries);
          toRemove.forEach(([key]) => cache.delete(key));
        }
      });
  }

  /**
   * 정리 타이머 시작
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * 캐시 엔트리 생성
   */
  private createEntry<T>(data: T, hash: string): CacheEntry<T> {
    const now = new Date();
    return {
      data,
      timestamp: now,
      hash,
      accessCount: 0,
      lastAccessed: now
    };
  }

  /**
   * 캐시 엔트리 액세스 업데이트
   */
  private updateAccess<T>(entry: CacheEntry<T>): void {
    entry.accessCount++;
    entry.lastAccessed = new Date();
  }

  /**
   * 레이아웃 계산 결과 캐시
   */
  cacheLayoutResult(
    feeds: FeedItem[],
    stageMetrics: Record<ProjectPhase, StagePosition>,
    viewportHeight: number,
    result: LayoutEngineResult
  ): void {
    const key = this.generateHash({ feeds: feeds.map(f => f.id), stageMetrics, viewportHeight });
    const hash = this.generateHash(result);
    this.layoutCache.set(key, this.createEntry(result, hash));
  }

  /**
   * 캐시된 레이아웃 결과 조회
   */
  getLayoutResult(
    feeds: FeedItem[],
    stageMetrics: Record<ProjectPhase, StagePosition>,
    viewportHeight: number
  ): LayoutEngineResult | null {
    const key = this.generateHash({ feeds: feeds.map(f => f.id), stageMetrics, viewportHeight });
    const entry = this.layoutCache.get(key);

    if (!entry || !this.isValid(entry)) {
      return null;
    }

    this.updateAccess(entry);
    return entry.data;
  }

  /**
   * 위치 계산 결과 캐시
   */
  cachePositions(
    feeds: FeedItem[],
    layoutConfig: any,
    positions: FeedItemWithPosition[]
  ): void {
    const key = this.generateHash({ feeds: feeds.map(f => f.id), layoutConfig });
    const hash = this.generateHash(positions);
    this.positionCache.set(key, this.createEntry(positions, hash));
  }

  /**
   * 캐시된 위치 결과 조회
   */
  getPositions(
    feeds: FeedItem[],
    layoutConfig: any
  ): FeedItemWithPosition[] | null {
    const key = this.generateHash({ feeds: feeds.map(f => f.id), layoutConfig });
    const entry = this.positionCache.get(key);

    if (!entry || !this.isValid(entry)) {
      return null;
    }

    this.updateAccess(entry);
    return entry.data;
  }

  /**
   * 단계 위치 정보 캐시
   */
  cacheStagePositions(
    projectData: any,
    stages: Record<ProjectPhase, StagePosition>
  ): void {
    const key = this.generateHash(projectData);
    const hash = this.generateHash(stages);
    this.stageCache.set(key, this.createEntry(stages, hash));
  }

  /**
   * 캐시된 단계 위치 조회
   */
  getStagePositions(projectData: any): Record<ProjectPhase, StagePosition> | null {
    const key = this.generateHash(projectData);
    const entry = this.stageCache.get(key);

    if (!entry || !this.isValid(entry)) {
      return null;
    }

    this.updateAccess(entry);
    return entry.data;
  }

  /**
   * 브랜치 연결선 캐시
   */
  cacheConnectors(
    positions: FeedItemWithPosition[],
    connectors: BranchConnector[]
  ): void {
    const key = this.generateHash(positions.map(p => ({ id: p.id, pos: p.branchPosition })));
    const hash = this.generateHash(connectors);
    this.connectorCache.set(key, this.createEntry(connectors, hash));
  }

  /**
   * 캐시된 연결선 조회
   */
  getConnectors(positions: FeedItemWithPosition[]): BranchConnector[] | null {
    const key = this.generateHash(positions.map(p => ({ id: p.id, pos: p.branchPosition })));
    const entry = this.connectorCache.get(key);

    if (!entry || !this.isValid(entry)) {
      return null;
    }

    this.updateAccess(entry);
    return entry.data;
  }

  /**
   * 필터링 결과 캐시
   */
  cacheFilteredFeeds(
    feeds: FeedItem[],
    filter: TimelineFilter,
    result: FeedItem[]
  ): void {
    const key = this.generateHash({ feedIds: feeds.map(f => f.id), filter });
    const hash = this.generateHash(result.map(f => f.id));
    this.filterCache.set(key, this.createEntry(result, hash));
  }

  /**
   * 캐시된 필터링 결과 조회
   */
  getFilteredFeeds(
    feeds: FeedItem[],
    filter: TimelineFilter
  ): FeedItem[] | null {
    const key = this.generateHash({ feedIds: feeds.map(f => f.id), filter });
    const entry = this.filterCache.get(key);

    if (!entry || !this.isValid(entry)) {
      return null;
    }

    this.updateAccess(entry);
    return entry.data;
  }

  /**
   * 특정 피드 관련 캐시 무효화
   */
  invalidateFeed(feedId: string): void {
    const toDelete: string[] = [];

    [this.layoutCache, this.positionCache, this.connectorCache, this.filterCache]
      .forEach(cache => {
        cache.forEach((entry, key) => {
          // 간단한 방법: 피드 ID가 키에 포함되어 있으면 무효화
          if (key.includes(feedId)) {
            toDelete.push(key);
          }
        });

        toDelete.forEach(key => cache.delete(key));
      });
  }

  /**
   * 프로젝트 변경 시 관련 캐시 무효화
   */
  invalidateProject(): void {
    this.stageCache.clear();
    this.layoutCache.clear();
    this.positionCache.clear();
    this.connectorCache.clear();
  }

  /**
   * 필터 변경 시 관련 캐시 무효화
   */
  invalidateFilter(): void {
    this.filterCache.clear();
  }

  /**
   * 전체 캐시 무효화
   */
  invalidateAll(): void {
    this.layoutCache.clear();
    this.positionCache.clear();
    this.stageCache.clear();
    this.connectorCache.clear();
    this.filterCache.clear();
  }

  /**
   * 캐시 통계 조회
   */
  getStats() {
    const stats = {
      layout: { size: this.layoutCache.size, totalAccess: 0 },
      position: { size: this.positionCache.size, totalAccess: 0 },
      stage: { size: this.stageCache.size, totalAccess: 0 },
      connector: { size: this.connectorCache.size, totalAccess: 0 },
      filter: { size: this.filterCache.size, totalAccess: 0 }
    };

    [
      [this.layoutCache, stats.layout],
      [this.positionCache, stats.position],
      [this.stageCache, stats.stage],
      [this.connectorCache, stats.connector],
      [this.filterCache, stats.filter]
    ].forEach(([cache, stat]) => {
      cache.forEach(entry => {
        stat.totalAccess += entry.accessCount;
      });
    });

    return {
      ...stats,
      totalEntries: Object.values(stats).reduce((sum, s) => sum + s.size, 0),
      config: this.config
    };
  }

  /**
   * 캐시 시스템 종료
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.invalidateAll();
  }
}

// 글로벌 캐시 인스턴스
export const branchTimelineCache = new BranchTimelineCache();