/**
 * @fileoverview 부분 마이그레이션 범위 관리
 * @description Sprint 3 - Stage 2: 선택적/부분 마이그레이션 지원
 * @author PocketCompany
 * @since 2025-01-23
 */

import type { Project, Meeting } from '../types/buildup.types';
import { devLog } from '../utils/logger';

/**
 * 마이그레이션 범위 타입
 */
export enum MigrationScopeType {
  FULL = 'full',                    // 전체 마이그레이션
  PROJECT = 'project',              // 프로젝트별
  DATE_RANGE = 'date_range',        // 날짜 범위
  MEETING_TYPE = 'meeting_type',    // 미팅 타입별
  INCREMENTAL = 'incremental',      // 증분 (변경분만)
  SELECTIVE = 'selective',          // 선택적 (체크된 항목만)
  CUSTOM = 'custom'                 // 사용자 정의
}

/**
 * 마이그레이션 범위 정의
 */
export interface MigrationScope {
  type: MigrationScopeType;
  filters?: ScopeFilters;
  options?: ScopeOptions;
  metadata?: any;
}

/**
 * 범위 필터
 */
export interface ScopeFilters {
  projectIds?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  meetingTypes?: string[];
  tags?: string[];
  status?: string[];
  customFilter?: (item: any) => boolean;
}

/**
 * 범위 옵션
 */
export interface ScopeOptions {
  includeCompleted?: boolean;
  includeArchived?: boolean;
  includeDrafts?: boolean;
  skipValidation?: boolean;
  batchSize?: number;
  maxItems?: number;
}

/**
 * 증분 추적 정보
 */
export interface IncrementalTracker {
  lastSync: Date;
  lastHash: string;
  processedIds: Set<string>;
  changedIds: Set<string>;
}

/**
 * 선택 항목
 */
export interface SelectiveItem {
  id: string;
  type: 'project' | 'meeting' | 'schedule';
  selected: boolean;
  metadata?: any;
}

/**
 * 범위 평가 결과
 */
export interface ScopeEvaluation {
  scope: MigrationScope;
  totalItems: number;
  filteredItems: number;
  estimatedTime: number;
  warnings?: string[];
}

/**
 * 부분 마이그레이션 관리자
 */
export class MigrationScopeManager {
  private incrementalTrackers: Map<string, IncrementalTracker> = new Map();
  private selectiveItems: Map<string, SelectiveItem> = new Map();
  private defaultBatchSize = 50;

  constructor() {
    this.loadTrackers();
  }

  /**
   * 범위 생성
   */
  createScope(type: MigrationScopeType, filters?: ScopeFilters, options?: ScopeOptions): MigrationScope {
    return {
      type,
      filters: filters || {},
      options: {
        includeCompleted: true,
        includeArchived: false,
        includeDrafts: false,
        skipValidation: false,
        batchSize: this.defaultBatchSize,
        ...options
      }
    };
  }

  /**
   * 프로젝트별 범위
   */
  createProjectScope(projectIds: string[]): MigrationScope {
    return this.createScope(MigrationScopeType.PROJECT, {
      projectIds
    });
  }

  /**
   * 날짜 범위별 범위
   */
  createDateRangeScope(start: Date, end: Date): MigrationScope {
    return this.createScope(MigrationScopeType.DATE_RANGE, {
      dateRange: { start, end }
    });
  }

  /**
   * 미팅 타입별 범위
   */
  createMeetingTypeScope(types: string[]): MigrationScope {
    return this.createScope(MigrationScopeType.MEETING_TYPE, {
      meetingTypes: types
    });
  }

  /**
   * 증분 범위
   */
  createIncrementalScope(trackerId: string): MigrationScope {
    const tracker = this.getOrCreateTracker(trackerId);

    return this.createScope(MigrationScopeType.INCREMENTAL, {
      customFilter: (item: any) => {
        // 마지막 동기화 이후 변경된 항목만
        if (item.updatedAt) {
          return new Date(item.updatedAt) > tracker.lastSync;
        }
        // updatedAt이 없으면 ID로 체크
        return !tracker.processedIds.has(item.id);
      }
    }, {
      skipValidation: false // 증분은 항상 검증
    });
  }

  /**
   * 선택적 범위
   */
  createSelectiveScope(selectedIds: string[]): MigrationScope {
    return this.createScope(MigrationScopeType.SELECTIVE, {
      customFilter: (item: any) => {
        return selectedIds.includes(item.id);
      }
    });
  }

  /**
   * 범위 적용 - 프로젝트 필터링
   */
  applyProjectFilter(projects: Project[], scope: MigrationScope): Project[] {
    if (!scope.filters) return projects;

    let filtered = [...projects];

    // 프로젝트 ID 필터
    if (scope.filters.projectIds && scope.filters.projectIds.length > 0) {
      filtered = filtered.filter(p => scope.filters!.projectIds!.includes(p.id));
    }

    // 상태 필터
    if (scope.filters.status && scope.filters.status.length > 0) {
      filtered = filtered.filter(p => scope.filters!.status!.includes(p.status));
    }

    // 옵션 적용
    if (scope.options) {
      if (!scope.options.includeArchived) {
        filtered = filtered.filter(p => !p.archived);
      }
      if (!scope.options.includeDrafts) {
        filtered = filtered.filter(p => p.status !== 'draft');
      }
    }

    // 커스텀 필터
    if (scope.filters.customFilter) {
      filtered = filtered.filter(scope.filters.customFilter);
    }

    // 최대 개수 제한
    if (scope.options?.maxItems) {
      filtered = filtered.slice(0, scope.options.maxItems);
    }

    return filtered;
  }

  /**
   * 범위 적용 - 미팅 필터링
   */
  applyMeetingFilter(meetings: Meeting[], scope: MigrationScope): Meeting[] {
    if (!scope.filters) return meetings;

    let filtered = [...meetings];

    // 날짜 범위 필터
    if (scope.filters.dateRange) {
      const { start, end } = scope.filters.dateRange;
      filtered = filtered.filter(m => {
        const meetingDate = new Date(m.date);
        return meetingDate >= start && meetingDate <= end;
      });
    }

    // 미팅 타입 필터
    if (scope.filters.meetingTypes && scope.filters.meetingTypes.length > 0) {
      filtered = filtered.filter(m => scope.filters!.meetingTypes!.includes(m.type));
    }

    // 상태 필터
    if (scope.filters.status && scope.filters.status.length > 0) {
      filtered = filtered.filter(m => scope.filters!.status!.includes(m.status));
    }

    // 옵션 적용
    if (scope.options) {
      if (!scope.options.includeCompleted) {
        filtered = filtered.filter(m => m.status !== 'completed');
      }
    }

    // 커스텀 필터
    if (scope.filters.customFilter) {
      filtered = filtered.filter(scope.filters.customFilter);
    }

    // 배치 처리
    if (scope.options?.batchSize) {
      // 배치 크기로 나누어 처리 (첫 번째 배치만 반환)
      filtered = filtered.slice(0, scope.options.batchSize);
    }

    return filtered;
  }

  /**
   * 범위 평가
   */
  evaluateScope(scope: MigrationScope, data: { projects?: Project[]; meetings?: Meeting[] }): ScopeEvaluation {
    let totalItems = 0;
    let filteredItems = 0;
    const warnings: string[] = [];

    // 프로젝트 평가
    if (data.projects) {
      totalItems += data.projects.length;
      const filtered = this.applyProjectFilter(data.projects, scope);
      filteredItems += filtered.length;

      if (filtered.length === 0 && data.projects.length > 0) {
        warnings.push('No projects matched the scope filters');
      }
    }

    // 미팅 평가
    if (data.meetings) {
      totalItems += data.meetings.length;
      const filtered = this.applyMeetingFilter(data.meetings, scope);
      filteredItems += filtered.length;

      if (filtered.length === 0 && data.meetings.length > 0) {
        warnings.push('No meetings matched the scope filters');
      }
    }

    // 예상 시간 계산 (항목당 100ms 가정)
    const estimatedTime = filteredItems * 100;

    // 경고 추가
    if (filteredItems > 1000) {
      warnings.push(`Large dataset (${filteredItems} items) may take time to process`);
    }

    if (scope.type === MigrationScopeType.INCREMENTAL && !this.hasTracker(scope.metadata?.trackerId)) {
      warnings.push('First incremental sync will process all items');
    }

    return {
      scope,
      totalItems,
      filteredItems,
      estimatedTime,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * 증분 추적기 가져오기/생성
   */
  private getOrCreateTracker(id: string): IncrementalTracker {
    if (!this.incrementalTrackers.has(id)) {
      this.incrementalTrackers.set(id, {
        lastSync: new Date(0), // epoch
        lastHash: '',
        processedIds: new Set(),
        changedIds: new Set()
      });
    }
    return this.incrementalTrackers.get(id)!;
  }

  /**
   * 추적기 존재 확인
   */
  private hasTracker(id?: string): boolean {
    return id ? this.incrementalTrackers.has(id) : false;
  }

  /**
   * 증분 추적 업데이트
   */
  updateIncrementalTracker(id: string, processedItems: any[]): void {
    const tracker = this.getOrCreateTracker(id);

    // 처리된 ID 추가
    processedItems.forEach(item => {
      tracker.processedIds.add(item.id);
    });

    // 마지막 동기화 시간 업데이트
    tracker.lastSync = new Date();

    // 해시 업데이트 (간단한 구현)
    tracker.lastHash = this.calculateHash(processedItems);

    // 저장
    this.saveTrackers();

    ;
  }

  /**
   * 변경 감지
   */
  detectChanges(id: string, currentItems: any[]): string[] {
    const tracker = this.getOrCreateTracker(id);
    const changedIds: string[] = [];

    currentItems.forEach(item => {
      // 새 항목이거나 업데이트된 항목
      if (!tracker.processedIds.has(item.id)) {
        changedIds.push(item.id);
      } else if (item.updatedAt && new Date(item.updatedAt) > tracker.lastSync) {
        changedIds.push(item.id);
      }
    });

    return changedIds;
  }

  /**
   * 선택 항목 추가
   */
  addSelectiveItem(item: SelectiveItem): void {
    this.selectiveItems.set(item.id, item);
  }

  /**
   * 선택 항목 토글
   */
  toggleSelectiveItem(id: string): void {
    const item = this.selectiveItems.get(id);
    if (item) {
      item.selected = !item.selected;
    }
  }

  /**
   * 선택된 항목 가져오기
   */
  getSelectedItems(): SelectiveItem[] {
    return Array.from(this.selectiveItems.values()).filter(item => item.selected);
  }

  /**
   * 선택 초기화
   */
  clearSelection(): void {
    this.selectiveItems.clear();
  }

  /**
   * 해시 계산
   */
  private calculateHash(items: any[]): string {
    const str = JSON.stringify(items.map(i => ({ id: i.id, updated: i.updatedAt })));
    // 간단한 해시 함수 (실제로는 crypto 사용)
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * 추적기 저장
   */
  private saveTrackers(): void {
    const data: Record<string, any> = {};
    this.incrementalTrackers.forEach((tracker, id) => {
      data[id] = {
        lastSync: tracker.lastSync.toISOString(),
        lastHash: tracker.lastHash,
        processedIds: Array.from(tracker.processedIds),
        changedIds: Array.from(tracker.changedIds)
      };
    });
    localStorage.setItem('migration_incremental_trackers', JSON.stringify(data));
  }

  /**
   * 추적기 로드
   */
  private loadTrackers(): void {
    const stored = localStorage.getItem('migration_incremental_trackers');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([id, tracker]: [string, any]) => {
          this.incrementalTrackers.set(id, {
            lastSync: new Date(tracker.lastSync),
            lastHash: tracker.lastHash,
            processedIds: new Set(tracker.processedIds),
            changedIds: new Set(tracker.changedIds)
          });
        });
      } catch (error) {
        console.error('Failed to load incremental trackers:', error);
      }
    }
  }

  /**
   * 통계
   */
  getStatistics(): {
    trackers: number;
    totalProcessed: number;
    selectiveItems: number;
    selectedCount: number;
  } {
    let totalProcessed = 0;
    this.incrementalTrackers.forEach(tracker => {
      totalProcessed += tracker.processedIds.size;
    });

    const selectedCount = Array.from(this.selectiveItems.values())
      .filter(item => item.selected).length;

    return {
      trackers: this.incrementalTrackers.size,
      totalProcessed,
      selectiveItems: this.selectiveItems.size,
      selectedCount
    };
  }

  /**
   * 초기화
   */
  reset(): void {
    this.incrementalTrackers.clear();
    this.selectiveItems.clear();
    localStorage.removeItem('migration_incremental_trackers');
    ;
  }
}

// 싱글톤 인스턴스
export const migrationScopeManager = new MigrationScopeManager();