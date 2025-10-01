/**
 * Performance Monitoring Hook
 * 컴포넌트 성능 모니터링 및 최적화 제안
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { getPerformanceMonitor } from '@/utils/performanceMonitorV3';

interface PerformanceMetrics {
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  peakRenderTime: number;
  memoryUsage?: number;
  slowRenders: number;
  suggestions: string[];
}

interface UsePerformanceMonitorOptions {
  componentName: string;
  reportThreshold?: number; // ms
  enableAutoReport?: boolean;
  trackMemory?: boolean;
}

/**
 * 컴포넌트 성능 모니터링 훅
 */
export function usePerformanceMonitor(
  options: UsePerformanceMonitorOptions
): PerformanceMetrics {
  const {
    componentName,
    reportThreshold = 16, // 60fps = 16ms per frame
    enableAutoReport = process.env.NODE_ENV === 'development',
    trackMemory = true
  } = options;

  const renderCount = useRef(0);
  const renderTimes = useRef<number[]>([]);
  const startTime = useRef<number>(0);
  const monitor = getPerformanceMonitor();

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    peakRenderTime: 0,
    memoryUsage: 0,
    slowRenders: 0,
    suggestions: []
  });

  // 렌더 시간 측정
  useEffect(() => {
    renderCount.current++;
    startTime.current = performance.now();

    return () => {
      const renderTime = performance.now() - startTime.current;
      renderTimes.current.push(renderTime);

      // 최근 100개 렌더만 추적
      if (renderTimes.current.length > 100) {
        renderTimes.current.shift();
      }

      // 메트릭 계산
      const avgTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
      const peakTime = Math.max(...renderTimes.current);
      const slowRenders = renderTimes.current.filter(t => t > reportThreshold).length;

      // 메모리 사용량 (Chrome only)
      const memoryUsage = trackMemory && (performance as any).memory
        ? (performance as any).memory.usedJSHeapSize / 1048576 // MB
        : undefined;

      // 성능 제안 생성
      const suggestions = generateSuggestions({
        avgTime,
        peakTime,
        slowRenders,
        renderCount: renderCount.current,
        memoryUsage
      });

      // 상태 업데이트
      setMetrics({
        renderCount: renderCount.current,
        averageRenderTime: avgTime,
        lastRenderTime: renderTime,
        peakRenderTime: peakTime,
        memoryUsage,
        slowRenders,
        suggestions
      });

      // 느린 렌더링 자동 보고
      if (enableAutoReport && renderTime > reportThreshold) {
        console.warn(
          `⚠️ Slow render in ${componentName}:`,
          `${renderTime.toFixed(2)}ms (threshold: ${reportThreshold}ms)`
        );

        // 성능 모니터에 기록
        monitor.trackCustomMetric('slow_render', renderTime, {
          component: componentName,
          threshold: reportThreshold
        });
      }
    };
  });

  return metrics;
}

/**
 * 성능 제안 생성
 */
function generateSuggestions(metrics: {
  avgTime: number;
  peakTime: number;
  slowRenders: number;
  renderCount: number;
  memoryUsage?: number;
}): string[] {
  const suggestions: string[] = [];

  // 평균 렌더 시간이 높은 경우
  if (metrics.avgTime > 16) {
    suggestions.push('Consider using React.memo to prevent unnecessary re-renders');
    suggestions.push('Check for expensive computations that could be memoized with useMemo');
  }

  // 피크 시간이 매우 높은 경우
  if (metrics.peakTime > 100) {
    suggestions.push('Detected very slow renders - consider code splitting or lazy loading');
    suggestions.push('Review useEffect dependencies for potential infinite loops');
  }

  // 느린 렌더가 많은 경우
  if (metrics.slowRenders > metrics.renderCount * 0.1) {
    suggestions.push('More than 10% of renders are slow - optimize render logic');
    suggestions.push('Consider virtualizing long lists or using pagination');
  }

  // 메모리 사용량이 높은 경우
  if (metrics.memoryUsage && metrics.memoryUsage > 50) {
    suggestions.push('High memory usage detected - check for memory leaks');
    suggestions.push('Clear unused data and unsubscribe from events in cleanup');
  }

  // 렌더 횟수가 많은 경우
  if (metrics.renderCount > 100) {
    suggestions.push('High render count - verify state updates are batched');
    suggestions.push('Check parent components for unnecessary prop changes');
  }

  return suggestions;
}

/**
 * 렌더링 최적화 추적 훅
 */
export function useWhyDidYouUpdate(
  componentName: string,
  props: Record<string, any>
) {
  const previousProps = useRef<Record<string, any>>();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, any> = {};

      allKeys.forEach(key => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key]
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log('[why-did-you-update]', componentName, changedProps);
      }
    }

    previousProps.current = props;
  });
}

/**
 * FPS 모니터링 훅
 */
export function useFPSMonitor(): number {
  const [fps, setFps] = useState(60);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let animationId: number;

    const measureFPS = () => {
      frameCount.current++;
      const currentTime = performance.now();

      if (currentTime >= lastTime.current + 1000) {
        setFps(Math.round((frameCount.current * 1000) / (currentTime - lastTime.current)));
        frameCount.current = 0;
        lastTime.current = currentTime;
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return fps;
}

/**
 * 메모리 사용량 모니터링 훅
 */
export function useMemoryMonitor(): {
  used: number;
  limit: number;
  percentage: number;
} | null {
  const [memory, setMemory] = useState<{
    used: number;
    limit: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    if (!(performance as any).memory) {
      return;
    }

    const updateMemory = () => {
      const mem = (performance as any).memory;
      const used = mem.usedJSHeapSize / 1048576; // MB
      const limit = mem.jsHeapSizeLimit / 1048576; // MB
      const percentage = (used / limit) * 100;

      setMemory({ used, limit, percentage });
    };

    updateMemory();
    const interval = setInterval(updateMemory, 1000);

    return () => clearInterval(interval);
  }, []);

  return memory;
}

/**
 * 네트워크 성능 모니터링 훅
 */
export function useNetworkPerformance() {
  const [networkInfo, setNetworkInfo] = useState<{
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  } | null>(null);

  useEffect(() => {
    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection;

    if (!connection) return;

    const updateNetworkInfo = () => {
      setNetworkInfo({
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      });
    };

    updateNetworkInfo();
    connection.addEventListener('change', updateNetworkInfo);

    return () => {
      connection.removeEventListener('change', updateNetworkInfo);
    };
  }, []);

  return networkInfo;
}

/**
 * 레이아웃 쉬프트 모니터링
 */
export function useLayoutShift(threshold: number = 0.1) {
  const [shifts, setShifts] = useState<number[]>([]);
  const [totalShift, setTotalShift] = useState(0);

  useEffect(() => {
    if (!window.PerformanceObserver) return;

    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if ((entry as any).value > threshold) {
          setShifts(prev => [...prev, (entry as any).value]);
          setTotalShift(prev => prev + (entry as any).value);

          console.warn('Layout shift detected:', {
            value: (entry as any).value,
            sources: (entry as any).sources
          });
        }
      }
    });

    observer.observe({ entryTypes: ['layout-shift'] });

    return () => observer.disconnect();
  }, [threshold]);

  return { shifts, totalShift };
}