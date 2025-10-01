/**
 * Component Performance Optimizer
 * React.memo와 성능 최적화 유틸리티
 */

import React, { memo, useEffect, useRef } from 'react';

/**
 * 렌더링 성능 측정 HOC
 */
export function withRenderTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return (props: P) => {
    const renderCount = useRef(0);
    const renderTime = useRef<number>(0);

    useEffect(() => {
      renderCount.current++;
      const startTime = performance.now();

      return () => {
        renderTime.current = performance.now() - startTime;

        // Development 모드에서만 로깅
        if (process.env.NODE_ENV === 'development') {
          if (renderTime.current > 16) { // 16ms = 60fps threshold
            console.warn(
              `🐌 Slow render detected in ${componentName}:`,
              `${renderTime.current.toFixed(2)}ms (render #${renderCount.current})`
            );
          }
        }
      };
    });

    return <Component {...props} />;
  };
}

/**
 * 깊은 비교 함수
 */
export function deepCompare(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (
    typeof obj1 !== 'object' ||
    obj1 === null ||
    typeof obj2 !== 'object' ||
    obj2 === null
  ) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepCompare(obj1[key], obj2[key])) return false;
  }

  return true;
}

/**
 * 선택적 prop 비교 함수 생성
 */
export function createSelectiveCompare<P extends object>(
  propsToCompare: (keyof P)[]
) {
  return (prevProps: P, nextProps: P): boolean => {
    return propsToCompare.every(
      prop => prevProps[prop] === nextProps[prop]
    );
  };
}

/**
 * 스마트 메모이제이션 HOC
 */
export function smartMemo<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    compareProps?: (keyof P)[];
    deepCompare?: boolean;
    name?: string;
  }
) {
  const { compareProps, deepCompare: useDeepCompare, name } = options || {};

  let arePropsEqual: ((prevProps: P, nextProps: P) => boolean) | undefined;

  if (compareProps) {
    arePropsEqual = createSelectiveCompare(compareProps);
  } else if (useDeepCompare) {
    arePropsEqual = (prevProps, nextProps) => deepCompare(prevProps, nextProps);
  }

  const MemoizedComponent = memo(Component, arePropsEqual);

  if (name && process.env.NODE_ENV === 'development') {
    return withRenderTracking(MemoizedComponent, name);
  }

  return MemoizedComponent;
}

/**
 * V3 특화 차트 컴포넌트 최적화
 */
export const OptimizedRadarChart = smartMemo(
  React.lazy(() =>
    import('@/pages/startup/kpi-tabs/ResultsInsightsPanelV3/components/EnhancedRadarChart').then(
      module => ({ default: module.EnhancedRadarChart })
    )
  ),
  {
    compareProps: ['scores', 'size'],
    name: 'RadarChart'
  }
);

/**
 * V3 테이블 컴포넌트 최적화
 */
export const OptimizedKPITable = smartMemo(
  React.lazy(() =>
    import('@/pages/startup/kpi-tabs/ResultsInsightsPanelV3/components/DetailedKPITable').then(
      module => ({ default: module.DetailedKPITable })
    )
  ),
  {
    compareProps: ['data', 'sortBy', 'filterBy'],
    name: 'KPITable'
  }
);

/**
 * 차트 데이터 변경 감지 훅
 */
export function useChartDataMemo<T>(
  data: T,
  dependencies: React.DependencyList = []
): T {
  return React.useMemo(() => {
    // 차트 데이터 정규화 및 최적화
    if (!data) return data;

    // 데이터가 배열인 경우
    if (Array.isArray(data)) {
      return data.map(item => ({
        ...item,
        // 불필요한 메타데이터 제거
        _internal: undefined,
        _raw: undefined
      })) as T;
    }

    return data;
  }, [JSON.stringify(data), ...dependencies]);
}

/**
 * 대용량 리스트 최적화 HOC
 */
export function withVirtualization<P extends { items: any[] }>(
  Component: React.ComponentType<P>,
  itemHeight: number = 50,
  containerHeight: number = 500
) {
  return memo((props: P) => {
    const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: 20 });
    const containerRef = useRef<HTMLDivElement>(null);

    const handleScroll = React.useCallback(() => {
      if (!containerRef.current) return;

      const scrollTop = containerRef.current.scrollTop;
      const start = Math.floor(scrollTop / itemHeight);
      const end = Math.ceil((scrollTop + containerHeight) / itemHeight);

      setVisibleRange({ start, end });
    }, []);

    const visibleItems = props.items.slice(visibleRange.start, visibleRange.end);
    const totalHeight = props.items.length * itemHeight;
    const offsetY = visibleRange.start * itemHeight;

    return (
      <div
        ref={containerRef}
        style={{ height: containerHeight, overflow: 'auto' }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            <Component {...props} items={visibleItems} />
          </div>
        </div>
      </div>
    );
  });
}

/**
 * 이미지 레이지 로딩 컴포넌트
 */
export const LazyImage = memo<{
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}>(({ src, alt, className, placeholder }) => {
  const [imageSrc, setImageSrc] = React.useState(placeholder || '');
  const [isLoading, setIsLoading] = React.useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={className}
      onLoad={() => setIsLoading(false)}
      style={{ opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.3s' }}
    />
  );
});

LazyImage.displayName = 'LazyImage';

/**
 * 조건부 렌더링 최적화
 */
export const ConditionalRender = memo<{
  condition: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}>(({ condition, children, fallback = null }) => {
  return <>{condition ? children : fallback}</>;
});

ConditionalRender.displayName = 'ConditionalRender';