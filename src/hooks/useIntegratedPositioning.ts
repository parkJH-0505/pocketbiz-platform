/**
 * @fileoverview 통합 위치 계산 훅
 * @description 실시간 위치 계산, 충돌 해결, 캐시 관리
 * @author PocketCompany
 * @since 2025-01-20
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { debounce } from 'lodash-es';
import type { FeedItem } from '../types/timeline.types';
import type {
  FeedItemWithPosition,
  StagePosition,
  LayoutEngineResult,
  BranchConnector,
  TimelineMetrics
} from '../types/branch-timeline.types';
import type { ProjectPhase } from '../types/buildup.types';
import { branchLayoutEngine } from '../utils/branchLayoutEngine';
import { branchTimelineCache } from '../utils/branchTimelineCache';

interface IntegratedPositioningConfig {
  /** 디바운스 지연 시간 (ms) */
  debounceDelay: number;
  /** 뷰포트 버퍼 크기 */
  viewportBuffer: number;
  /** 자동 재계산 활성화 */
  autoRecalculate: boolean;
  /** 성능 모니터링 활성화 */
  enablePerformanceTracking: boolean;
}

interface PositioningState {
  /** 위치가 계산된 피드들 */
  positionedFeeds: FeedItemWithPosition[];
  /** 브랜치 연결선들 */
  connectors: BranchConnector[];
  /** 뷰포트 내 가시 피드들 */
  visibleFeeds: FeedItemWithPosition[];
  /** 계산 진행 상태 */
  isCalculating: boolean;
  /** 마지막 계산 시간 */
  lastCalculated: Date | null;
  /** 오류 상태 */
  error: string | null;
  /** 성능 메트릭스 */
  metrics: TimelineMetrics | null;
}

const DEFAULT_CONFIG: IntegratedPositioningConfig = {
  debounceDelay: 150,
  viewportBuffer: 100,
  autoRecalculate: true,
  enablePerformanceTracking: true
};

/**
 * 통합 위치 계산 훅
 * 레이아웃 엔진과 캐시 시스템을 통합하여 실시간 위치 계산 제공
 */
export const useIntegratedPositioning = (
  feeds: FeedItem[],
  stagePositions: Record<ProjectPhase, StagePosition>,
  viewportState: {
    width: number;
    height: number;
    scrollTop: number;
    scrollLeft: number;
  },
  config: Partial<IntegratedPositioningConfig> = {}
) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // 상태 관리
  const [state, setState] = useState<PositioningState>({
    positionedFeeds: [],
    connectors: [],
    visibleFeeds: [],
    isCalculating: false,
    lastCalculated: null,
    error: null,
    metrics: null
  });

  // 계산 요청 큐 관리
  const calculationQueue = useRef<{
    feeds: FeedItem[];
    stagePositions: Record<ProjectPhase, StagePosition>;
    timestamp: number;
  } | null>(null);

  // 성능 추적
  const performanceRef = useRef({
    calculations: 0,
    totalTime: 0,
    averageTime: 0,
    lastCalculationTime: 0
  });

  // 레이아웃 계산 함수
  const calculateLayout = useCallback(async (
    feedsToCalculate: FeedItem[],
    stages: Record<ProjectPhase, StagePosition>
  ): Promise<LayoutEngineResult | null> => {
    if (!feedsToCalculate.length || !Object.keys(stages).length) {
      return null;
    }

    const startTime = performance.now();

    try {
      // 캐시 확인
      const cachedResult = branchTimelineCache.getLayoutResult(
        feedsToCalculate,
        stages,
        viewportState.height
      );

      if (cachedResult && finalConfig.autoRecalculate) {
        // 캐시 히트 - 성능 추적 업데이트
        const calculationTime = performance.now() - startTime;
        performanceRef.current.lastCalculationTime = calculationTime;
        return cachedResult;
      }

      // 새로운 계산 수행
      setState(prev => ({ ...prev, isCalculating: true, error: null }));

      const result = branchLayoutEngine.calculateLayout(
        feedsToCalculate,
        stages,
        viewportState.height
      );

      // 캐시에 저장
      branchTimelineCache.cacheLayoutResult(
        feedsToCalculate,
        stages,
        viewportState.height,
        result
      );

      // 성능 메트릭 업데이트
      const calculationTime = performance.now() - startTime;
      performanceRef.current.calculations++;
      performanceRef.current.totalTime += calculationTime;
      performanceRef.current.averageTime =
        performanceRef.current.totalTime / performanceRef.current.calculations;
      performanceRef.current.lastCalculationTime = calculationTime;

      return result;

    } catch (error) {
      console.error('Layout calculation failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        isCalculating: false
      }));
      return null;
    }
  }, [viewportState.height, finalConfig.autoRecalculate]);

  // 디바운스된 계산 함수
  const debouncedCalculation = useMemo(
    () => debounce(async (
      feedsToCalculate: FeedItem[],
      stages: Record<ProjectPhase, StagePosition>
    ) => {
      const result = await calculateLayout(feedsToCalculate, stages);

      if (result) {
        setState(prev => ({
          ...prev,
          positionedFeeds: result.positionedFeeds,
          connectors: result.connectors,
          isCalculating: false,
          lastCalculated: new Date(),
          metrics: {
            totalHeight: result.positionedFeeds.length * 60, // 대략적 계산
            viewportHeight: viewportState.height,
            scrollPosition: viewportState.scrollTop,
            visibleStages: Object.keys(stages) as ProjectPhase[],
            densityLevel: result.positionedFeeds.length > 100 ? 'dense' :
                         result.positionedFeeds.length > 50 ? 'normal' : 'sparse',
            performance: {
              renderedNodes: result.positionedFeeds.length,
              totalNodes: feedsToCalculate.length,
              lastRenderTime: performanceRef.current.lastCalculationTime,
              averageFps: 60 // 기본값, 실제로는 별도 측정 필요
            }
          }
        }));
      }
    }, finalConfig.debounceDelay),
    [calculateLayout, finalConfig.debounceDelay, viewportState.height, viewportState.scrollTop]
  );

  // 뷰포트 내 가시 피드 계산
  const calculateVisibleFeeds = useCallback((
    allFeeds: FeedItemWithPosition[]
  ): FeedItemWithPosition[] => {
    const { scrollTop, height } = viewportState;
    const buffer = finalConfig.viewportBuffer;

    return branchLayoutEngine.filterVisibleFeeds(
      allFeeds,
      scrollTop - buffer,
      height + (buffer * 2)
    );
  }, [viewportState, finalConfig.viewportBuffer]);

  // 가시 피드 업데이트 (디바운스 없이 즉시)
  useEffect(() => {
    const visibleFeeds = calculateVisibleFeeds(state.positionedFeeds);

    setState(prev => ({
      ...prev,
      visibleFeeds
    }));
  }, [state.positionedFeeds, calculateVisibleFeeds]);

  // 메인 계산 트리거
  useEffect(() => {
    if (!feeds.length || !Object.keys(stagePositions).length) {
      setState(prev => ({
        ...prev,
        positionedFeeds: [],
        connectors: [],
        visibleFeeds: [],
        error: null
      }));
      return;
    }

    // 계산 큐에 추가
    calculationQueue.current = {
      feeds,
      stagePositions,
      timestamp: Date.now()
    };

    // 디바운스된 계산 실행
    debouncedCalculation(feeds, stagePositions);

  }, [feeds, stagePositions, debouncedCalculation]);

  // 뷰포트 변경 시 가시 피드 재계산 (스크롤 시)
  useEffect(() => {
    if (state.positionedFeeds.length > 0) {
      const visibleFeeds = calculateVisibleFeeds(state.positionedFeeds);
      setState(prev => ({
        ...prev,
        visibleFeeds
      }));
    }
  }, [viewportState.scrollTop, viewportState.scrollLeft, calculateVisibleFeeds, state.positionedFeeds]);

  // 강제 재계산 함수
  const forceRecalculate = useCallback(() => {
    branchTimelineCache.invalidateAll();

    if (calculationQueue.current) {
      const { feeds, stagePositions } = calculationQueue.current;
      debouncedCalculation.cancel(); // 기존 디바운스 취소
      calculateLayout(feeds, stagePositions);
    }
  }, [calculateLayout, debouncedCalculation]);

  // 특정 피드 무효화
  const invalidateFeed = useCallback((feedId: string) => {
    branchTimelineCache.invalidateFeed(feedId);

    if (finalConfig.autoRecalculate && calculationQueue.current) {
      const { feeds, stagePositions } = calculationQueue.current;
      debouncedCalculation(feeds, stagePositions);
    }
  }, [finalConfig.autoRecalculate, debouncedCalculation]);

  // 캐시 통계 조회
  const getCacheStats = useCallback(() => {
    return branchTimelineCache.getStats();
  }, []);

  // 성능 통계 조회
  const getPerformanceStats = useCallback(() => {
    return {
      ...performanceRef.current,
      cacheStats: getCacheStats()
    };
  }, [getCacheStats]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      debouncedCalculation.cancel();
    };
  }, [debouncedCalculation]);

  return {
    // 상태
    ...state,

    // 액션
    forceRecalculate,
    invalidateFeed,

    // 유틸리티
    getCacheStats,
    getPerformanceStats,

    // 설정
    config: finalConfig
  };
};