/**
 * @fileoverview Viewport State Management Hook
 * @description 캔버스 뷰포트 상태와 변환을 관리하는 고급 훅
 * @author PocketCompany
 * @since 2025-01-20
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// 타입 정의
// ============================================================================

export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewTransform {
  scale: number;
  translateX: number;
  translateY: number;
}

export interface ViewportBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface PanState {
  isPanning: boolean;
  startPoint: Point;
  startTransform: ViewTransform;
}

export interface ViewportConfig {
  minZoom: number;
  maxZoom: number;
  zoomStep: number;
  panBounds?: Rectangle;
  snapToGrid?: boolean;
  gridSize?: number;
}

// ============================================================================
// 기본 설정
// ============================================================================

const DEFAULT_CONFIG: ViewportConfig = {
  minZoom: 0.1,
  maxZoom: 5.0,
  zoomStep: 0.1,
  snapToGrid: false,
  gridSize: 20
};

const DEFAULT_TRANSFORM: ViewTransform = {
  scale: 1,
  translateX: 0,
  translateY: 0
};

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 좌표를 화면 좌표계에서 캔버스 좌표계로 변환
 */
const screenToCanvas = (screenPoint: Point, transform: ViewTransform): Point => ({
  x: (screenPoint.x - transform.translateX) / transform.scale,
  y: (screenPoint.y - transform.translateY) / transform.scale
});

/**
 * 좌표를 캔버스 좌표계에서 화면 좌표계로 변환
 */
const canvasToScreen = (canvasPoint: Point, transform: ViewTransform): Point => ({
  x: canvasPoint.x * transform.scale + transform.translateX,
  y: canvasPoint.y * transform.scale + transform.translateY
});

/**
 * 줌 레벨을 제한 범위 내로 클램프
 */
const clampZoom = (zoom: number, config: ViewportConfig): number =>
  Math.max(config.minZoom, Math.min(config.maxZoom, zoom));

/**
 * 그리드에 스냅
 */
const snapToGrid = (point: Point, gridSize: number): Point => ({
  x: Math.round(point.x / gridSize) * gridSize,
  y: Math.round(point.y / gridSize) * gridSize
});

/**
 * 팬 경계 내로 제한
 */
const clampPan = (
  transform: ViewTransform,
  panBounds: Rectangle | undefined,
  viewportSize: { width: number; height: number }
): ViewTransform => {
  if (!panBounds) return transform;

  const { scale, translateX, translateY } = transform;
  const { width: viewWidth, height: viewHeight } = viewportSize;

  // 스케일된 컨텐츠 크기
  const scaledWidth = panBounds.width * scale;
  const scaledHeight = panBounds.height * scale;

  // 최소/최대 이동 범위 계산
  const minX = Math.min(0, viewWidth - scaledWidth);
  const maxX = Math.max(0, viewWidth - scaledWidth);
  const minY = Math.min(0, viewHeight - scaledHeight);
  const maxY = Math.max(0, viewHeight - scaledHeight);

  return {
    scale,
    translateX: Math.max(minX, Math.min(maxX, translateX)),
    translateY: Math.max(minY, Math.min(maxY, translateY))
  };
};

// ============================================================================
// 메인 훅
// ============================================================================

export const useViewportState = (
  initialTransform: ViewTransform = DEFAULT_TRANSFORM,
  config: Partial<ViewportConfig> = {}
) => {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  // ========== 상태 ==========
  const [transform, setTransform] = useState<ViewTransform>(initialTransform);
  const [panState, setPanState] = useState<PanState>({
    isPanning: false,
    startPoint: { x: 0, y: 0 },
    startTransform: initialTransform
  });
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 600 });

  // 애니메이션 ref
  const animationRef = useRef<number>();

  // ========== 핵심 변환 함수들 ==========

  /**
   * 즉시 변환 적용
   */
  const setTransformImmediate = useCallback((newTransform: Partial<ViewTransform>) => {
    setTransform(prev => {
      const updated = { ...prev, ...newTransform };
      updated.scale = clampZoom(updated.scale, fullConfig);
      return clampPan(updated, fullConfig.panBounds, viewportSize);
    });
  }, [fullConfig, viewportSize]);

  /**
   * 애니메이션과 함께 변환 적용
   */
  const setTransformAnimated = useCallback((
    newTransform: Partial<ViewTransform>,
    duration: number = 300,
    easing: (t: number) => number = (t) => t * t * (3 - 2 * t) // smoothstep
  ) => {
    const startTransform = transform;
    const targetTransform = {
      ...startTransform,
      ...newTransform,
      scale: clampZoom(newTransform.scale ?? startTransform.scale, fullConfig)
    };

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      const interpolated: ViewTransform = {
        scale: startTransform.scale + (targetTransform.scale - startTransform.scale) * easedProgress,
        translateX: startTransform.translateX + (targetTransform.translateX - startTransform.translateX) * easedProgress,
        translateY: startTransform.translateY + (targetTransform.translateY - startTransform.translateY) * easedProgress
      };

      setTransform(clampPan(interpolated, fullConfig.panBounds, viewportSize));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(animate);
  }, [transform, fullConfig, viewportSize]);

  // ========== 줌 기능 ==========

  /**
   * 특정 포인트를 중심으로 줌
   */
  const zoomToPoint = useCallback((
    zoomLevel: number,
    centerPoint: Point,
    animated: boolean = true
  ) => {
    const newScale = clampZoom(zoomLevel, fullConfig);
    const scaleDiff = newScale / transform.scale;

    // 줌 중심점을 기준으로 이동량 계산
    const newTranslateX = centerPoint.x - (centerPoint.x - transform.translateX) * scaleDiff;
    const newTranslateY = centerPoint.y - (centerPoint.y - transform.translateY) * scaleDiff;

    const newTransform = {
      scale: newScale,
      translateX: newTranslateX,
      translateY: newTranslateY
    };

    if (animated) {
      setTransformAnimated(newTransform);
    } else {
      setTransformImmediate(newTransform);
    }
  }, [transform, fullConfig, setTransformImmediate, setTransformAnimated]);

  /**
   * 줌 인
   */
  const zoomIn = useCallback((centerPoint?: Point) => {
    const center = centerPoint || { x: viewportSize.width / 2, y: viewportSize.height / 2 };
    const newZoom = Math.min(fullConfig.maxZoom, transform.scale + fullConfig.zoomStep);
    zoomToPoint(newZoom, center);
  }, [transform.scale, fullConfig, viewportSize, zoomToPoint]);

  /**
   * 줌 아웃
   */
  const zoomOut = useCallback((centerPoint?: Point) => {
    const center = centerPoint || { x: viewportSize.width / 2, y: viewportSize.height / 2 };
    const newZoom = Math.max(fullConfig.minZoom, transform.scale - fullConfig.zoomStep);
    zoomToPoint(newZoom, center);
  }, [transform.scale, fullConfig, viewportSize, zoomToPoint]);

  /**
   * 영역에 맞춤
   */
  const fitToRect = useCallback((rect: Rectangle, padding: number = 50) => {
    const availableWidth = viewportSize.width - padding * 2;
    const availableHeight = viewportSize.height - padding * 2;

    const scaleX = availableWidth / rect.width;
    const scaleY = availableHeight / rect.height;
    const scale = clampZoom(Math.min(scaleX, scaleY), fullConfig);

    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;

    const translateX = viewportSize.width / 2 - centerX * scale;
    const translateY = viewportSize.height / 2 - centerY * scale;

    setTransformAnimated({
      scale,
      translateX,
      translateY
    });
  }, [viewportSize, fullConfig, setTransformAnimated]);

  // ========== 팬 기능 ==========

  /**
   * 팬 시작
   */
  const startPan = useCallback((startPoint: Point) => {
    setPanState({
      isPanning: true,
      startPoint,
      startTransform: transform
    });
  }, [transform]);

  /**
   * 팬 업데이트
   */
  const updatePan = useCallback((currentPoint: Point) => {
    if (!panState.isPanning) return;

    const deltaX = currentPoint.x - panState.startPoint.x;
    const deltaY = currentPoint.y - panState.startPoint.y;

    let newTransform = {
      ...panState.startTransform,
      translateX: panState.startTransform.translateX + deltaX,
      translateY: panState.startTransform.translateY + deltaY
    };

    if (fullConfig.snapToGrid && fullConfig.gridSize) {
      const snapped = snapToGrid(
        { x: newTransform.translateX, y: newTransform.translateY },
        fullConfig.gridSize
      );
      newTransform.translateX = snapped.x;
      newTransform.translateY = snapped.y;
    }

    setTransform(clampPan(newTransform, fullConfig.panBounds, viewportSize));
  }, [panState, fullConfig, viewportSize]);

  /**
   * 팬 종료
   */
  const endPan = useCallback(() => {
    setPanState(prev => ({ ...prev, isPanning: false }));
  }, []);

  // ========== 리셋 기능 ==========

  /**
   * 뷰 리셋
   */
  const resetView = useCallback(() => {
    setTransformAnimated(DEFAULT_TRANSFORM);
  }, [setTransformAnimated]);

  // ========== 좌표 변환 유틸리티 ==========
  const transformPoint = useCallback((point: Point, direction: 'screenToCanvas' | 'canvasToScreen' = 'screenToCanvas'): Point => {
    return direction === 'screenToCanvas'
      ? screenToCanvas(point, transform)
      : canvasToScreen(point, transform);
  }, [transform]);

  // ========== 뷰포트 정보 ==========
  const getVisibleBounds = useCallback((): ViewportBounds => {
    const topLeft = screenToCanvas({ x: 0, y: 0 }, transform);
    const bottomRight = screenToCanvas(
      { x: viewportSize.width, y: viewportSize.height },
      transform
    );

    return {
      left: topLeft.x,
      top: topLeft.y,
      right: bottomRight.x,
      bottom: bottomRight.y
    };
  }, [transform, viewportSize]);

  // ========== CSS 변환 문자열 ==========
  const getTransformStyle = useCallback(() =>
    `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
    [transform]
  );

  // ========== 뷰포트 크기 업데이트 ==========
  const updateViewportSize = useCallback((width: number, height: number) => {
    setViewportSize({ width, height });
  }, []);

  // ========== 정리 ==========
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // ========== 반환 값 ==========
  return {
    // 현재 상태
    transform,
    isPanning: panState.isPanning,
    viewportSize,

    // 변환 제어
    setTransform: setTransformImmediate,
    setTransformAnimated,

    // 줌 제어
    zoomIn,
    zoomOut,
    zoomToPoint,
    fitToRect,

    // 팬 제어
    startPan,
    updatePan,
    endPan,

    // 유틸리티
    transformPoint,
    getVisibleBounds,
    getTransformStyle,
    resetView,
    updateViewportSize,

    // 상태 플래그
    canZoomIn: transform.scale < fullConfig.maxZoom,
    canZoomOut: transform.scale > fullConfig.minZoom,
    isAtDefaultZoom: Math.abs(transform.scale - 1) < 0.01
  };
};