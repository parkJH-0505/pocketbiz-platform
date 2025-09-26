/**
 * Project Change Detection System
 * 효율적인 프로젝트 변경 감지를 위한 유틸리티
 */

import { useRef, useCallback, useMemo } from 'react';
import type { Project } from '../types/buildup.types';

// 버전 관리를 위한 확장 타입
export interface ProjectWithVersion extends Project {
  _version?: number;
  _hash?: string;
  _lastModified?: Date;
}

export interface ChangeSet {
  added: ProjectWithVersion[];
  modified: ProjectWithVersion[];
  removed: string[];
  timestamp: Date;
}

export interface ChangeDetectionOptions {
  deepCompare?: boolean;
  ignoreFields?: string[];
  batchDelay?: number;
}

/**
 * 프로젝트 변경 감지 훅
 * JSON.stringify 대신 효율적인 변경 감지 메커니즘 제공
 */
export const useProjectChangeDetection = (options: ChangeDetectionOptions = {}) => {
  const {
    deepCompare = false,
    ignoreFields = ['_version', '_hash', '_lastModified'],
    batchDelay = 100
  } = options;

  // 이전 프로젝트 상태 저장 (Map 사용으로 O(1) 조회)
  const previousProjectsMap = useRef<Map<string, ProjectWithVersion>>(new Map());
  const versionCounter = useRef(0);
  const changeQueue = useRef<ChangeSet[]>([]);
  const batchTimer = useRef<NodeJS.Timeout | null>(null);

  /**
   * 빠른 해시 생성 (간단한 체크섬)
   */
  const generateHash = useCallback((obj: any): string => {
    // 무시할 필드 제외
    const filtered = Object.keys(obj)
      .filter(key => !ignoreFields.includes(key))
      .reduce((acc, key) => {
        acc[key] = obj[key];
        return acc;
      }, {} as any);

    // 간단한 해시 생성 (실제로는 더 정교한 알고리즘 사용 가능)
    const str = JSON.stringify(filtered, Object.keys(filtered).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }, [ignoreFields]);

  /**
   * 두 프로젝트 객체 비교
   */
  const hasProjectChanged = useCallback((prev: ProjectWithVersion, curr: ProjectWithVersion): boolean => {
    // 1. 버전 비교 (가장 빠름)
    if (prev._version !== undefined && curr._version !== undefined) {
      return prev._version !== curr._version;
    }

    // 2. 타임스탬프 비교
    if (prev._lastModified && curr._lastModified) {
      return prev._lastModified.getTime() !== curr._lastModified.getTime();
    }

    // 3. 해시 비교 (중간 속도)
    if (!deepCompare) {
      const prevHash = prev._hash || generateHash(prev);
      const currHash = curr._hash || generateHash(curr);
      return prevHash !== currHash;
    }

    // 4. 깊은 비교 (가장 느림, 필요시에만)
    return generateHash(prev) !== generateHash(curr);
  }, [deepCompare, generateHash]);

  /**
   * 변경사항 감지
   */
  const detectChanges = useCallback((currentProjects: Project[]): ChangeSet => {
    const changes: ChangeSet = {
      added: [],
      modified: [],
      removed: [],
      timestamp: new Date()
    };

    // 현재 프로젝트 ID Set (빠른 조회용)
    const currentIds = new Set(currentProjects.map(p => p.id));

    // 추가/수정 감지
    currentProjects.forEach(project => {
      const enrichedProject: ProjectWithVersion = {
        ...project,
        _version: ++versionCounter.current,
        _hash: generateHash(project),
        _lastModified: new Date()
      };

      const previous = previousProjectsMap.current.get(project.id);

      if (!previous) {
        // 새로 추가된 프로젝트
        changes.added.push(enrichedProject);
      } else if (hasProjectChanged(previous, enrichedProject)) {
        // 수정된 프로젝트
        changes.modified.push(enrichedProject);
      }
    });

    // 삭제 감지
    previousProjectsMap.current.forEach((project, id) => {
      if (!currentIds.has(id)) {
        changes.removed.push(id);
      }
    });

    // 현재 상태를 이전 상태로 업데이트
    if (changes.added.length > 0 || changes.modified.length > 0 || changes.removed.length > 0) {
      previousProjectsMap.current.clear();
      currentProjects.forEach(project => {
        const enriched: ProjectWithVersion = {
          ...project,
          _version: project._version || versionCounter.current,
          _hash: generateHash(project),
          _lastModified: new Date()
        };
        previousProjectsMap.current.set(project.id, enriched);
      });
    }

    return changes;
  }, [generateHash, hasProjectChanged]);

  /**
   * 배치 변경 감지 (디바운싱 적용)
   */
  const detectChangesBatched = useCallback((currentProjects: Project[]): Promise<ChangeSet[]> => {
    return new Promise((resolve) => {
      const changes = detectChanges(currentProjects);

      if (changes.added.length > 0 || changes.modified.length > 0 || changes.removed.length > 0) {
        changeQueue.current.push(changes);
      }

      // 기존 타이머 취소
      if (batchTimer.current) {
        clearTimeout(batchTimer.current);
      }

      // 새 타이머 설정
      batchTimer.current = setTimeout(() => {
        const batch = [...changeQueue.current];
        changeQueue.current = [];
        resolve(batch);
      }, batchDelay);
    });
  }, [detectChanges, batchDelay]);

  /**
   * 특정 프로젝트만 업데이트 (부분 업데이트)
   */
  const updateSingleProject = useCallback((project: ProjectWithVersion) => {
    const enriched: ProjectWithVersion = {
      ...project,
      _version: ++versionCounter.current,
      _hash: generateHash(project),
      _lastModified: new Date()
    };
    previousProjectsMap.current.set(project.id, enriched);
  }, [generateHash]);

  /**
   * 캐시 초기화
   */
  const resetCache = useCallback(() => {
    previousProjectsMap.current.clear();
    versionCounter.current = 0;
    changeQueue.current = [];
    if (batchTimer.current) {
      clearTimeout(batchTimer.current);
    }
  }, []);

  /**
   * 현재 캐시된 프로젝트 수 반환
   */
  const getCacheSize = useCallback(() => {
    return previousProjectsMap.current.size;
  }, []);

  /**
   * 변경 통계 반환
   */
  const getStatistics = useMemo(() => {
    return {
      cacheSize: previousProjectsMap.current.size,
      version: versionCounter.current,
      pendingChanges: changeQueue.current.length
    };
  }, []);

  return {
    detectChanges,
    detectChangesBatched,
    updateSingleProject,
    resetCache,
    getCacheSize,
    getStatistics,
    hasProjectChanged
  };
};

/**
 * 변경 사항 병합 유틸리티
 */
export const mergeChangeSets = (changes: ChangeSet[]): ChangeSet => {
  const merged: ChangeSet = {
    added: [],
    modified: [],
    removed: [],
    timestamp: new Date()
  };

  const addedIds = new Set<string>();
  const modifiedIds = new Set<string>();
  const removedIds = new Set<string>();

  changes.forEach(change => {
    // Added 병합 (중복 제거)
    change.added.forEach(project => {
      if (!addedIds.has(project.id)) {
        merged.added.push(project);
        addedIds.add(project.id);
      }
    });

    // Modified 병합 (최신 버전만 유지)
    change.modified.forEach(project => {
      if (!modifiedIds.has(project.id) && !addedIds.has(project.id)) {
        merged.modified.push(project);
        modifiedIds.add(project.id);
      }
    });

    // Removed 병합
    change.removed.forEach(id => {
      if (!removedIds.has(id) && !addedIds.has(id)) {
        merged.removed.push(id);
        removedIds.add(id);
      }
    });
  });

  return merged;
};

/**
 * 변경 사항 요약 생성
 */
export const summarizeChanges = (changes: ChangeSet): string => {
  const parts = [];

  if (changes.added.length > 0) {
    parts.push(`${changes.added.length}개 추가`);
  }

  if (changes.modified.length > 0) {
    parts.push(`${changes.modified.length}개 수정`);
  }

  if (changes.removed.length > 0) {
    parts.push(`${changes.removed.length}개 삭제`);
  }

  return parts.length > 0
    ? `프로젝트 변경: ${parts.join(', ')}`
    : '변경 사항 없음';
};