/**
 * @fileoverview 브랜치 타임라인 컨텍스트
 * @description 통합 상태 관리 및 성능 최적화된 데이터 플로우
 * @author PocketCompany
 * @since 2025-01-20
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, useMemo } from 'react';
import type {
  BranchTimelineState,
  FeedItemWithPosition,
  TimelineFilter,
  BranchInteractionEvent,
  LayoutEngineResult,
  StagePosition,
  PerformanceMetrics
} from '../types/branch-timeline.types';
import type { FeedItem } from '../types/timeline.types';
import type { ProjectPhase } from '../types/buildup.types';
import { branchLayoutEngine } from '../utils/branchLayoutEngine';
import { branchTimelineCache } from '../utils/branchTimelineCache';
import { useBranchTimelinePerformance } from '../hooks/useBranchTimelinePerformance';
import { useIntegratedPositioning } from '../hooks/useIntegratedPositioning';
import { BRANCH_LAYOUT_CONFIG } from '../config/branchPositions';

// 액션 타입 정의
type BranchTimelineAction =
  | { type: 'SET_FEEDS'; payload: FeedItem[] }
  | { type: 'SET_FILTER'; payload: TimelineFilter }
  | { type: 'SET_HOVER'; payload: string | null }
  | { type: 'SET_EXPANDED'; payload: { feedId: string; expanded: boolean } }
  | { type: 'SET_SELECTED'; payload: string | null }
  | { type: 'SET_SCROLL_POSITION'; payload: number }
  | { type: 'SET_VIEW_MODE'; payload: 'normal' | 'compact' | 'detailed' }
  | { type: 'SET_STAGE_POSITIONS'; payload: Record<ProjectPhase, StagePosition> }
  | { type: 'SET_LAYOUT_RESULT'; payload: LayoutEngineResult }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' };

// 초기 상태
const initialState: BranchTimelineState = {
  ui: {
    hoveredFeedId: null,
    expandedFeedIds: new Set(),
    selectedFeedId: null,
    scrollPosition: 0,
    filter: {
      feedTypes: [],
      stages: [],
      priorities: [],
      authors: [],
      statuses: []
    },
    viewMode: 'normal'
  },
  computed: {
    feedsWithPositions: [],
    visibleFeeds: [],
    stagePositions: {} as Record<ProjectPhase, StagePosition>,
    branchConnectors: [],
    timelineMetrics: {
      totalHeight: 0,
      viewportHeight: 800,
      scrollPosition: 0,
      visibleStages: [],
      densityLevel: 'normal',
      performance: {
        renderedNodes: 0,
        totalNodes: 0,
        lastRenderTime: 0,
        averageFps: 60
      }
    }
  },
  config: {
    layoutConfig: BRANCH_LAYOUT_CONFIG,
    virtualScrollConfig: {
      enabled: true,
      itemHeight: 60,
      overscan: 5,
      scrollDebounce: 16,
      chunkSize: 20
    },
    branchStyles: {} as any // BRANCH_CONFIGURATIONS에서 가져옴
  },
  performance: {
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
  }
};

// 리듀서
const branchTimelineReducer = (
  state: BranchTimelineState,
  action: BranchTimelineAction
): BranchTimelineState => {
  switch (action.type) {
    case 'SET_FEEDS':
      return state;

    case 'SET_FILTER':
      return {
        ...state,
        ui: {
          ...state.ui,
          filter: action.payload
        }
      };

    case 'SET_HOVER':
      return {
        ...state,
        ui: {
          ...state.ui,
          hoveredFeedId: action.payload
        }
      };

    case 'SET_EXPANDED':
      const newExpandedIds = new Set(state.ui.expandedFeedIds);
      if (action.payload.expanded) {
        newExpandedIds.add(action.payload.feedId);
      } else {
        newExpandedIds.delete(action.payload.feedId);
      }
      return {
        ...state,
        ui: {
          ...state.ui,
          expandedFeedIds: newExpandedIds
        }
      };

    case 'SET_SELECTED':
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedFeedId: action.payload
        }
      };

    case 'SET_SCROLL_POSITION':
      return {
        ...state,
        ui: {
          ...state.ui,
          scrollPosition: action.payload
        },
        computed: {
          ...state.computed,
          timelineMetrics: {
            ...state.computed.timelineMetrics,
            scrollPosition: action.payload
          }
        }
      };

    case 'SET_VIEW_MODE':
      return {
        ...state,
        ui: {
          ...state.ui,
          viewMode: action.payload
        }
      };

    case 'SET_STAGE_POSITIONS':
      return {
        ...state,
        computed: {
          ...state.computed,
          stagePositions: action.payload
        }
      };

    case 'SET_LAYOUT_RESULT':
      return {
        ...state,
        computed: {
          ...state.computed,
          feedsWithPositions: action.payload.positionedFeeds,
          branchConnectors: action.payload.connectors,
          timelineMetrics: {
            ...state.computed.timelineMetrics,
            totalHeight: action.payload.metrics.totalNodes * 60, // 대략적 계산
            performance: {
              ...state.computed.timelineMetrics.performance,
              totalNodes: action.payload.metrics.totalNodes,
              lastRenderTime: action.payload.metrics.calculationTime
            }
          }
        }
      };

    case 'SET_LOADING':
      return state;

    case 'SET_ERROR':
      return state;

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
};

// 컨텍스트 인터페이스
interface BranchTimelineContextValue {
  state: BranchTimelineState;
  actions: {
    setFeeds: (feeds: FeedItem[]) => void;
    setFilter: (filter: TimelineFilter) => void;
    setHover: (feedId: string | null) => void;
    setExpanded: (feedId: string, expanded: boolean) => void;
    setSelected: (feedId: string | null) => void;
    setScrollPosition: (position: number) => void;
    setViewMode: (mode: 'normal' | 'compact' | 'detailed') => void;
    handleInteraction: (event: BranchInteractionEvent) => void;
    resetState: () => void;
  };
  performance: {
    startRender: () => void;
    endRender: () => void;
    measureInteraction: (action: string, callback: () => void) => void;
    metrics: PerformanceMetrics;
  };
}

// 컨텍스트 생성
const BranchTimelineContext = createContext<BranchTimelineContextValue | null>(null);

// 프로바이더 컴포넌트
interface BranchTimelineProviderProps {
  children: React.ReactNode;
  feeds: FeedItem[];
  stagePositions: Record<ProjectPhase, StagePosition>;
  onPerformanceAlert?: (metrics: PerformanceMetrics) => void;
}

export const BranchTimelineProvider: React.FC<BranchTimelineProviderProps> = ({
  children,
  feeds,
  stagePositions,
  onPerformanceAlert
}) => {
  const [state, dispatch] = useReducer(branchTimelineReducer, initialState);

  // 성능 모니터링 훅
  const performance = useBranchTimelinePerformance({
    enabled: true,
    samplingInterval: 1000,
    thresholds: {
      renderTime: 16, // 60fps 목표
      frameDrops: 5,
      memoryLeaks: 1000
    },
    onPerformanceAlert
  });

  // 통합 위치 계산 훅 사용
  const positioningResult = useIntegratedPositioning(
    feeds,
    stagePositions,
    {
      width: 1200, // 기본값, 실제로는 컨테이너에서 전달받음
      height: state.computed.timelineMetrics.viewportHeight,
      scrollTop: state.ui.scrollPosition,
      scrollLeft: 0
    },
    {
      debounceDelay: 100,
      viewportBuffer: 150,
      autoRecalculate: true,
      enablePerformanceTracking: true
    }
  );

  // 필터링된 피드들 (메모이제이션)
  const filteredFeeds = useMemo(() => {
    if (!feeds.length) return [];

    const cached = branchTimelineCache.getFilteredFeeds(feeds, state.ui.filter);
    if (cached) return cached;

    const filtered = feeds.filter(feed => {
      // 피드 타입 필터
      if (state.ui.filter.feedTypes.length > 0 && !state.ui.filter.feedTypes.includes(feed.type)) {
        return false;
      }

      // 단계 필터
      if (state.ui.filter.stages.length > 0 && !state.ui.filter.stages.includes(feed.stageId)) {
        return false;
      }

      // 우선순위 필터
      if (state.ui.filter.priorities.length > 0 && !state.ui.filter.priorities.includes(feed.priority)) {
        return false;
      }

      // 상태 필터
      if (state.ui.filter.statuses.length > 0 && !state.ui.filter.statuses.includes(feed.status)) {
        return false;
      }

      return true;
    });

    branchTimelineCache.cacheFilteredFeeds(feeds, state.ui.filter, filtered);
    return filtered;
  }, [feeds, state.ui.filter]);

  // 액션 함수들
  const actions = useMemo(() => ({
    setFeeds: (feeds: FeedItem[]) => {
      dispatch({ type: 'SET_FEEDS', payload: feeds });
    },

    setFilter: (filter: TimelineFilter) => {
      performance.measureInteraction('filter', () => {
        dispatch({ type: 'SET_FILTER', payload: filter });
        branchTimelineCache.invalidateFilter();
      });
    },

    setHover: (feedId: string | null) => {
      dispatch({ type: 'SET_HOVER', payload: feedId });
    },

    setExpanded: (feedId: string, expanded: boolean) => {
      performance.measureInteraction('expand', () => {
        dispatch({ type: 'SET_EXPANDED', payload: { feedId, expanded } });
      });
    },

    setSelected: (feedId: string | null) => {
      performance.measureInteraction('select', () => {
        dispatch({ type: 'SET_SELECTED', payload: feedId });
      });
    },

    setScrollPosition: (position: number) => {
      dispatch({ type: 'SET_SCROLL_POSITION', payload: position });
    },

    setViewMode: (mode: 'normal' | 'compact' | 'detailed') => {
      performance.measureInteraction('viewMode', () => {
        dispatch({ type: 'SET_VIEW_MODE', payload: mode });
      });
    },

    handleInteraction: (event: BranchInteractionEvent) => {
      performance.measureInteraction(event.type, () => {
        switch (event.type) {
          case 'hover':
            actions.setHover(event.feedId);
            break;
          case 'click':
          case 'select':
            actions.setSelected(event.feedId);
            break;
          case 'expand':
            actions.setExpanded(event.feedId, true);
            break;
          case 'collapse':
            actions.setExpanded(event.feedId, false);
            break;
        }
      });
    },

    resetState: () => {
      dispatch({ type: 'RESET_STATE' });
      branchTimelineCache.invalidateAll();
    }
  }), [performance]);

  // 위치 계산 결과 업데이트
  useEffect(() => {
    if (positioningResult.positionedFeeds.length > 0) {
      const mockLayoutResult: LayoutEngineResult = {
        positionedFeeds: positioningResult.positionedFeeds,
        connectors: positioningResult.connectors,
        collisionReport: {
          totalCollisions: 0,
          resolvedCollisions: 0,
          unresolvableCollisions: []
        },
        metrics: {
          calculationTime: 0,
          totalNodes: positioningResult.positionedFeeds.length,
          adjustedNodes: 0
        }
      };
      dispatch({ type: 'SET_LAYOUT_RESULT', payload: mockLayoutResult });
    }
  }, [positioningResult.positionedFeeds, positioningResult.connectors]);

  // 단계 위치 업데이트
  useEffect(() => {
    dispatch({ type: 'SET_STAGE_POSITIONS', payload: stagePositions });
  }, [stagePositions]);

  const contextValue: BranchTimelineContextValue = {
    state,
    actions,
    performance: {
      startRender: performance.startRender,
      endRender: performance.endRender,
      measureInteraction: performance.measureInteraction,
      metrics: performance.metrics
    }
  };

  return (
    <BranchTimelineContext.Provider value={contextValue}>
      {children}
    </BranchTimelineContext.Provider>
  );
};

// 커스텀 훅
export const useBranchTimeline = () => {
  const context = useContext(BranchTimelineContext);
  if (!context) {
    throw new Error('useBranchTimeline must be used within BranchTimelineProvider');
  }
  return context;
};

// 선택적 훅들
export const useBranchTimelineState = () => {
  const { state } = useBranchTimeline();
  return state;
};

export const useBranchTimelineActions = () => {
  const { actions } = useBranchTimeline();
  return actions;
};

export const useBranchTimelinePerformanceContext = () => {
  const { performance } = useBranchTimeline();
  return performance;
};