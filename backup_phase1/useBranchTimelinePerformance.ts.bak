/**
 * @fileoverview 브랜치 타임라인 성능 최적화 훅
 * @description 렌더링 성능, 메모리 사용량, 인터랙션 반응성 모니터링
 * @author PocketCompany
 * @since 2025-01-20
 */

import { useRef, useCallback, useMemo, useEffect } from 'react';
import type {
  PerformanceMetrics,
  FeedItemWithPosition,
  TimelineFilter,
  BranchTimelineState
} from '../types/branch-timeline.types';

interface PerformanceHookOptions {
  /** 성능 모니터링 활성화 여부 */
  enabled: boolean;
  /** 샘플링 간격 (ms) */
  samplingInterval: number;
  /** 성능 경고 임계값 */
  thresholds: {
    renderTime: number;
    frameDrops: number;
    memoryLeaks: number;
  };
  /** 성능 경고 콜백 */
  onPerformanceAlert?: (metrics: PerformanceMetrics) => void;
}

interface PerformanceTracker {
  /** 렌더링 시간 측정 시작 */
  startRender: () => void;
  /** 렌더링 시간 측정 종료 */
  endRender: () => void;
  /** 인터랙션 시간 측정 */
  measureInteraction: (action: string, callback: () => void) => void;
  /** 메모리 사용량 추적 */
  trackMemoryUsage: () => void;
  /** 현재 성능 메트릭스 */
  metrics: PerformanceMetrics;
  /** 성능 통계 리셋 */
  resetMetrics: () => void;
}

export const useBranchTimelinePerformance = (
  options: PerformanceHookOptions
): PerformanceTracker => {
  const renderStartTime = useRef<number>(0);
  const renderTimes = useRef<number[]>([]);
  const interactionTimes = useRef<Array<{ action: string; time: number }>>([]);
  const frameRateRef = useRef<number[]>([]);
  const lastFrameTime = useRef<number>(performance.now());

  // 성능 메트릭스 상태
  const metricsRef = useRef<PerformanceMetrics>({
    renderingStats: {
      average: 0,
      min: 0,
      max: 0,
      samples: []
    },
    memoryUsage: {
      nodeInstances: 0,
      eventListeners: 0,
      cachedCalculations: 0
    },
    interactionMetrics: {
      averageResponseTime: 0,
      delayedResponses: 0,
      totalInteractions: 0
    }
  });

  // 렌더링 시간 측정 시작
  const startRender = useCallback(() => {
    if (!options.enabled) return;
    renderStartTime.current = performance.now();
  }, [options.enabled]);

  // 렌더링 시간 측정 종료
  const endRender = useCallback(() => {
    if (!options.enabled || renderStartTime.current === 0) return;

    const renderTime = performance.now() - renderStartTime.current;
    renderTimes.current.push(renderTime);

    // 최근 100개 샘플만 유지
    if (renderTimes.current.length > 100) {
      renderTimes.current.shift();
    }

    // 통계 업데이트
    const times = renderTimes.current;
    metricsRef.current.renderingStats = {
      average: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      samples: [...times]
    };

    // 성능 경고 확인
    if (renderTime > options.thresholds.renderTime) {
      options.onPerformanceAlert?.(metricsRef.current);
    }

    renderStartTime.current = 0;
  }, [options.enabled, options.thresholds.renderTime, options.onPerformanceAlert]);

  // 인터랙션 시간 측정
  const measureInteraction = useCallback((action: string, callback: () => void) => {
    if (!options.enabled) {
      callback();
      return;
    }

    const startTime = performance.now();
    callback();
    const endTime = performance.now();
    const duration = endTime - startTime;

    interactionTimes.current.push({ action, time: duration });

    // 최근 50개 인터랙션만 유지
    if (interactionTimes.current.length > 50) {
      interactionTimes.current.shift();
    }

    // 인터랙션 통계 업데이트
    const times = interactionTimes.current.map(i => i.time);
    const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    const delayedCount = times.filter(t => t > 16).length; // 16ms 이상은 지연

    metricsRef.current.interactionMetrics = {
      averageResponseTime: averageTime,
      delayedResponses: delayedCount,
      totalInteractions: interactionTimes.current.length
    };
  }, [options.enabled]);

  // 메모리 사용량 추적
  const trackMemoryUsage = useCallback(() => {
    if (!options.enabled) return;

    // DOM 노드 수 계산
    const timelineNodes = document.querySelectorAll('[data-timeline-node]').length;
    const eventListeners = document.querySelectorAll('[data-has-listeners]').length;

    metricsRef.current.memoryUsage = {
      nodeInstances: timelineNodes,
      eventListeners: eventListeners,
      cachedCalculations: 0 // 이는 별도 훅에서 관리
    };
  }, [options.enabled]);

  // 프레임 레이트 모니터링
  const monitorFrameRate = useCallback(() => {
    if (!options.enabled) return;

    const now = performance.now();
    const delta = now - lastFrameTime.current;
    const fps = 1000 / delta;

    frameRateRef.current.push(fps);
    if (frameRateRef.current.length > 60) { // 1초간 샘플
      frameRateRef.current.shift();
    }

    lastFrameTime.current = now;
    requestAnimationFrame(monitorFrameRate);
  }, [options.enabled]);

  // 성능 통계 리셋
  const resetMetrics = useCallback(() => {
    renderTimes.current = [];
    interactionTimes.current = [];
    frameRateRef.current = [];
    metricsRef.current = {
      renderingStats: { average: 0, min: 0, max: 0, samples: [] },
      memoryUsage: { nodeInstances: 0, eventListeners: 0, cachedCalculations: 0 },
      interactionMetrics: { averageResponseTime: 0, delayedResponses: 0, totalInteractions: 0 }
    };
  }, []);

  // 주기적 메모리 사용량 추적
  useEffect(() => {
    if (!options.enabled) return;

    const interval = setInterval(trackMemoryUsage, options.samplingInterval);
    return () => clearInterval(interval);
  }, [options.enabled, options.samplingInterval, trackMemoryUsage]);

  // 프레임 레이트 모니터링 시작
  useEffect(() => {
    if (!options.enabled) return;

    requestAnimationFrame(monitorFrameRate);
  }, [options.enabled, monitorFrameRate]);

  return {
    startRender,
    endRender,
    measureInteraction,
    trackMemoryUsage,
    metrics: metricsRef.current,
    resetMetrics
  };
};

/**
 * 가상 스크롤링을 위한 성능 최적화 훅
 */
export const useVirtualScrollOptimization = (
  feeds: FeedItemWithPosition[],
  viewportHeight: number,
  scrollPosition: number,
  itemHeight: number = 60,
  overscan: number = 5
) => {
  return useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollPosition / itemHeight) - overscan);
    const endIndex = Math.min(
      feeds.length - 1,
      Math.ceil((scrollPosition + viewportHeight) / itemHeight) + overscan
    );

    const visibleFeeds = feeds.slice(startIndex, endIndex + 1);
    const offsetY = startIndex * itemHeight;

    return {
      visibleFeeds,
      startIndex,
      endIndex,
      offsetY,
      totalHeight: feeds.length * itemHeight
    };
  }, [feeds, viewportHeight, scrollPosition, itemHeight, overscan]);
};

/**
 * 렌더링 최적화를 위한 메모이제이션 훅
 */
export const useBranchTimelineMemo = (
  feeds: FeedItemWithPosition[],
  filter: TimelineFilter,
  scrollPosition: number
) => {
  // 필터링된 피드들 메모이제이션
  const filteredFeeds = useMemo(() => {
    return feeds.filter(feed => {
      // 피드 타입 필터
      if (filter.feedTypes.length > 0 && !filter.feedTypes.includes(feed.type)) {
        return false;
      }

      // 날짜 범위 필터
      if (filter.dateRange) {
        const feedDate = new Date(feed.timestamp);
        if (feedDate < filter.dateRange.start || feedDate > filter.dateRange.end) {
          return false;
        }
      }

      // 단계 필터
      if (filter.stages.length > 0 && !filter.stages.includes(feed.stageId)) {
        return false;
      }

      // 우선순위 필터
      if (filter.priorities.length > 0 && !filter.priorities.includes(feed.priority)) {
        return false;
      }

      // 상태 필터
      if (filter.statuses.length > 0 && !filter.statuses.includes(feed.status)) {
        return false;
      }

      // 텍스트 검색
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const searchText = `${feed.title} ${feed.description || ''}`.toLowerCase();
        if (!searchText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [feeds, filter]);

  // 뷰포트 내 피드들 메모이제이션 (간단한 버전)
  const visibleFeeds = useMemo(() => {
    return filteredFeeds.filter(feed => {
      const feedY = feed.branchPosition.y;
      const viewportStart = scrollPosition;
      const viewportEnd = scrollPosition + 800; // 대략적인 뷰포트 높이

      return feedY >= viewportStart - 100 && feedY <= viewportEnd + 100;
    });
  }, [filteredFeeds, scrollPosition]);

  return {
    filteredFeeds,
    visibleFeeds,
    totalCount: feeds.length,
    filteredCount: filteredFeeds.length,
    visibleCount: visibleFeeds.length
  };
};