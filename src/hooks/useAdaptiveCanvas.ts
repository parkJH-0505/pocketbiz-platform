/**
 * @fileoverview Adaptive Canvas Hook - 반응형 캔버스 계산 엔진
 * @description 화면 크기와 데이터량에 따른 최적 레이아웃 자동 계산
 * @author PocketCompany
 * @since 2025-01-20
 */

import { useState, useEffect, useMemo, useCallback } from 'react';

// ============================================================================
// 타입 정의
// ============================================================================

export interface Dimensions {
  width: number;
  height: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface AdaptiveCanvasConfig {
  // 레이아웃 영역
  timelineWidth: number;        // 좌측 타임라인 영역 너비
  branchZoneWidth: number;      // 우측 브랜치 영역 너비
  verticalPadding: number;      // 상하 여백
  horizontalPadding: number;    // 좌우 여백

  // 컨텐츠 밀도
  activitySpacing: number;      // 활동 간 최소 간격
  branchLevels: number;         // 브랜치 깊이 레벨 수
  timelineHeight: number;       // 전체 타임라인 높이

  // 반응형 설정
  breakpoint: 'mobile' | 'tablet' | 'desktop' | 'desktop-xl';
  scaleFactor: number;          // 전체 스케일 팩터

  // 인터랙션 영역
  hitboxPadding: number;        // 클릭 가능 영역 확장
  hoverZoneRadius: number;      // 호버 감지 반경
}

export interface ViewportState {
  containerSize: Dimensions;
  scrollPosition: { x: number; y: number };
  zoomLevel: number;
  isFullscreen: boolean;
}

export interface LayoutMetrics {
  totalActivities: number;
  timeSpan: number;             // 전체 시간 범위 (일)
  activityDensity: number;      // 시간당 활동 밀도
  branchComplexity: number;     // 브랜치 복잡도 점수
}

// ============================================================================
// 반응형 브레이크포인트 상수
// ============================================================================

const BREAKPOINTS = {
  mobile: { min: 0, max: 767 },
  tablet: { min: 768, max: 1023 },
  desktop: { min: 1024, max: 1439 },
  'desktop-xl': { min: 1440, max: Infinity }
} as const;

// 브레이크포인트별 기본 설정
const DEFAULT_CONFIGS: Record<string, Partial<AdaptiveCanvasConfig>> = {
  mobile: {
    timelineWidth: 120,
    branchZoneWidth: 200,
    verticalPadding: 20,
    horizontalPadding: 16,
    branchLevels: 2,
    scaleFactor: 0.8
  },
  tablet: {
    timelineWidth: 160,
    branchZoneWidth: 300,
    verticalPadding: 30,
    horizontalPadding: 24,
    branchLevels: 3,
    scaleFactor: 0.9
  },
  desktop: {
    timelineWidth: 200,
    branchZoneWidth: 400,
    verticalPadding: 40,
    horizontalPadding: 32,
    branchLevels: 4,
    scaleFactor: 1.0
  },
  'desktop-xl': {
    timelineWidth: 240,
    branchZoneWidth: 500,
    verticalPadding: 50,
    horizontalPadding: 40,
    branchLevels: 5,
    scaleFactor: 1.1
  }
};

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 현재 화면 크기에 따른 브레이크포인트 결정
 */
const getBreakpoint = (width: number): keyof typeof BREAKPOINTS => {
  for (const [breakpoint, range] of Object.entries(BREAKPOINTS)) {
    if (width >= range.min && width <= range.max) {
      return breakpoint as keyof typeof BREAKPOINTS;
    }
  }
  return 'desktop';
};

/**
 * 레이아웃 메트릭 계산
 */
const calculateLayoutMetrics = (
  activityCount: number,
  timeRange: DateRange
): LayoutMetrics => {
  const timeSpan = Math.max(1, (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
  const activityDensity = activityCount / timeSpan;

  // 브랜치 복잡도: 활동 밀도와 시간 범위를 고려한 복잡도 점수 (0-100)
  const branchComplexity = Math.min(100, (activityDensity * 10) + (timeSpan > 30 ? 20 : 0));

  return {
    totalActivities: activityCount,
    timeSpan,
    activityDensity,
    branchComplexity
  };
};

/**
 * 최적 타임라인 높이 계산
 */
const calculateOptimalHeight = (metrics: LayoutMetrics, baseHeight: number): number => {
  const { totalActivities, activityDensity } = metrics;

  // 기본 높이에서 활동 수에 따라 동적 조정
  const activityFactor = Math.max(1, totalActivities / 10); // 10개 활동당 1배
  const densityFactor = Math.max(1, activityDensity / 2);   // 밀도에 따른 조정

  const calculatedHeight = baseHeight * activityFactor * densityFactor;

  // 최소/최대 높이 제한
  return Math.max(400, Math.min(2000, calculatedHeight));
};

// ============================================================================
// 메인 훅
// ============================================================================

export const useAdaptiveCanvas = (
  activityCount: number = 0,
  timeRange: DateRange = { start: new Date(), end: new Date() },
  containerRef?: React.RefObject<HTMLElement>
) => {
  // ========== 상태 관리 ==========
  const [viewportState, setViewportState] = useState<ViewportState>({
    containerSize: { width: 1200, height: 800 },
    scrollPosition: { x: 0, y: 0 },
    zoomLevel: 1,
    isFullscreen: false
  });

  // ========== 브레이크포인트 감지 ==========
  const breakpoint = useMemo(() =>
    getBreakpoint(viewportState.containerSize.width),
    [viewportState.containerSize.width]
  );

  // ========== 레이아웃 메트릭 계산 ==========
  const layoutMetrics = useMemo(() =>
    calculateLayoutMetrics(activityCount, timeRange),
    [activityCount, timeRange]
  );

  // ========== 적응형 설정 계산 ==========
  const adaptiveConfig: AdaptiveCanvasConfig = useMemo(() => {
    const baseConfig = DEFAULT_CONFIGS[breakpoint] || DEFAULT_CONFIGS.desktop;

    // 브랜치 복잡도에 따른 동적 조정
    const complexityMultiplier = 1 + (layoutMetrics.branchComplexity / 200);

    const timelineHeight = calculateOptimalHeight(
      layoutMetrics,
      600 * (baseConfig.scaleFactor || 1)
    );

    return {
      timelineWidth: baseConfig.timelineWidth || 200,
      branchZoneWidth: (baseConfig.branchZoneWidth || 400) * complexityMultiplier,
      verticalPadding: baseConfig.verticalPadding || 40,
      horizontalPadding: baseConfig.horizontalPadding || 32,

      activitySpacing: Math.max(30, 60 / Math.max(1, layoutMetrics.activityDensity)),
      branchLevels: Math.min(baseConfig.branchLevels || 4, Math.ceil(layoutMetrics.branchComplexity / 20)),
      timelineHeight,

      breakpoint,
      scaleFactor: baseConfig.scaleFactor || 1,

      hitboxPadding: 12 * (baseConfig.scaleFactor || 1),
      hoverZoneRadius: 20 * (baseConfig.scaleFactor || 1)
    };
  }, [breakpoint, layoutMetrics]);

  // ========== 뷰포트 크기 감지 ==========
  useEffect(() => {
    const updateViewportSize = () => {
      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setViewportState(prev => ({
          ...prev,
          containerSize: { width: rect.width, height: rect.height }
        }));
      } else {
        // 컨테이너 ref가 없으면 윈도우 크기 사용
        setViewportState(prev => ({
          ...prev,
          containerSize: { width: window.innerWidth, height: window.innerHeight }
        }));
      }
    };

    // 초기 크기 설정
    updateViewportSize();

    // 리사이즈 이벤트 리스너
    const resizeObserver = new ResizeObserver(updateViewportSize);
    if (containerRef?.current) {
      resizeObserver.observe(containerRef.current);
    } else {
      window.addEventListener('resize', updateViewportSize);
    }

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateViewportSize);
    };
  }, [containerRef]);

  // ========== 유틸리티 함수들 ==========
  const updateZoom = useCallback((newZoom: number) => {
    setViewportState(prev => ({
      ...prev,
      zoomLevel: Math.max(0.1, Math.min(5, newZoom))
    }));
  }, []);

  const updateScroll = useCallback((x: number, y: number) => {
    setViewportState(prev => ({
      ...prev,
      scrollPosition: { x, y }
    }));
  }, []);

  const toggleFullscreen = useCallback(() => {
    setViewportState(prev => ({
      ...prev,
      isFullscreen: !prev.isFullscreen
    }));
  }, []);

  const resetView = useCallback(() => {
    setViewportState(prev => ({
      ...prev,
      scrollPosition: { x: 0, y: 0 },
      zoomLevel: 1
    }));
  }, []);

  // ========== 레이아웃 도우미 함수들 ==========
  const getCanvasDimensions = useCallback((): Dimensions => ({
    width: adaptiveConfig.timelineWidth + adaptiveConfig.branchZoneWidth + (adaptiveConfig.horizontalPadding * 2),
    height: adaptiveConfig.timelineHeight + (adaptiveConfig.verticalPadding * 2)
  }), [adaptiveConfig]);

  const getBranchZoneBounds = useCallback(() => ({
    left: adaptiveConfig.timelineWidth + adaptiveConfig.horizontalPadding,
    top: adaptiveConfig.verticalPadding,
    width: adaptiveConfig.branchZoneWidth,
    height: adaptiveConfig.timelineHeight
  }), [adaptiveConfig]);

  const getTimelineAxisBounds = useCallback(() => ({
    x: adaptiveConfig.timelineWidth / 2 + adaptiveConfig.horizontalPadding,
    top: adaptiveConfig.verticalPadding,
    bottom: adaptiveConfig.verticalPadding + adaptiveConfig.timelineHeight
  }), [adaptiveConfig]);

  // ========== 반환 값 ==========
  return {
    // 설정
    config: adaptiveConfig,
    viewport: viewportState,
    metrics: layoutMetrics,

    // 제어 함수
    updateZoom,
    updateScroll,
    toggleFullscreen,
    resetView,

    // 레이아웃 도우미
    getCanvasDimensions,
    getBranchZoneBounds,
    getTimelineAxisBounds,

    // 상태 플래그
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop' || breakpoint === 'desktop-xl',
    isHighDensity: layoutMetrics.activityDensity > 5
  };
};