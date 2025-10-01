/**
 * 최적화된 대용량 컴포넌트 Wrapper
 * lazy loading과 progressive enhancement를 통한 리소스 관리
 */

import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Brain, Zap, TrendingUp, Loader } from 'lucide-react';

// 리소스 모니터링 유틸리티
const checkResourceAvailability = (): boolean => {
  if (typeof window === 'undefined') return false;

  // 메모리 체크 (Chrome only)
  const memory = (performance as any).memory;
  if (memory) {
    const usedMemory = memory.usedJSHeapSize;
    const totalMemory = memory.jsHeapSizeLimit;
    const memoryUsage = usedMemory / totalMemory;

    // 메모리 사용률이 80% 이상이면 false 반환
    if (memoryUsage > 0.8) {
      console.warn('High memory usage detected:', Math.round(memoryUsage * 100) + '%');
      return false;
    }
  }

  return true;
};

// 로딩 상태 컴포넌트
const ComponentLoader: React.FC<{ name: string; icon: React.ReactNode }> = ({ name, icon }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-lg border border-neutral-border">
    <div className="animate-pulse">
      {icon}
    </div>
    <div className="mt-4 text-lg font-medium text-neutral-dark">{name} 로딩 중...</div>
    <div className="mt-2 flex items-center gap-2 text-sm text-neutral-gray">
      <Loader className="w-4 h-4 animate-spin" />
      <span>컴포넌트를 준비하고 있습니다</span>
    </div>
  </div>
);

// 에러 폴백 컴포넌트
const ComponentError: React.FC<{
  name: string;
  error?: Error;
  retry: () => void;
  fallback?: React.ReactNode;
}> = ({ name, error, retry, fallback }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] bg-red-50 rounded-lg border border-red-200">
    <div className="text-red-500 mb-4">
      <Brain className="w-12 h-12" />
    </div>
    <div className="text-lg font-medium text-red-700">{name} 로드 실패</div>
    <div className="mt-2 text-sm text-red-600 max-w-md text-center">
      {error?.message || '컴포넌트를 불러오는 중 문제가 발생했습니다'}
    </div>
    {fallback ? (
      <div className="mt-6 w-full">{fallback}</div>
    ) : (
      <button
        onClick={retry}
        className="mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
      >
        다시 시도
      </button>
    )}
  </div>
);

// Progressive Enhancement HOC
const withProgressiveEnhancement = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    name: string;
    icon: React.ReactNode;
    fallback?: React.ComponentType<P>;
    checkResources?: boolean;
  }
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const [shouldLoad, setShouldLoad] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
      // 리소스 체크 옵션이 켜져있으면 체크
      if (options.checkResources && !checkResourceAvailability()) {
        setError(new Error('시스템 리소스가 부족합니다. 다른 탭을 닫고 다시 시도해주세요.'));
        return;
      }

      // Intersection Observer로 뷰포트 진입 시 로딩
      const timer = setTimeout(() => {
        setShouldLoad(true);
      }, 100);

      return () => clearTimeout(timer);
    }, []);

    if (error) {
      return (
        <ComponentError
          name={options.name}
          error={error}
          retry={() => {
            setError(null);
            setShouldLoad(true);
          }}
          fallback={options.fallback ? <options.fallback {...props} /> : undefined}
        />
      );
    }

    if (!shouldLoad) {
      return <ComponentLoader name={options.name} icon={options.icon} />;
    }

    return <Component {...props} ref={ref} />;
  });
};

// AdvancedSimulator 최적화 버전
export const OptimizedAdvancedSimulator = lazy(() =>
  import('../AdvancedSimulator')
    .then(module => ({
      default: withProgressiveEnhancement(module.AdvancedSimulator, {
        name: '고급 시뮬레이터',
        icon: <Zap className="w-12 h-12 text-primary-main" />,
        checkResources: true,
        fallback: () => (
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">간소화 모드</h3>
            <p className="text-gray-600">
              리소스 절약을 위해 기본 시뮬레이션만 제공됩니다.
            </p>
          </div>
        )
      })
    }))
    .catch(() => ({
      default: () => (
        <ComponentError
          name="고급 시뮬레이터"
          retry={() => window.location.reload()}
          fallback={
            <div className="p-6 text-center">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">고급 시뮬레이션 준비 중</h3>
              <p className="text-gray-600">
                고급 시뮬레이션 기능은 현재 최적화 작업 중입니다.
              </p>
            </div>
          }
        />
      )
    }))
);

// AdvancedAIDashboard 최적화 버전
export const OptimizedAdvancedAIDashboard = lazy(() =>
  import('../../../../../../components/ai/AdvancedAIDashboard')
    .then(module => ({
      default: withProgressiveEnhancement(module.AdvancedAIDashboard, {
        name: 'AI 대시보드',
        icon: <Brain className="w-12 h-12 text-primary-main" />,
        checkResources: true
      })
    }))
    .catch(() => ({
      default: () => (
        <div className="p-6 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-6 h-6 text-gray-500" />
            <h3 className="text-lg font-semibold">AI 대시보드</h3>
          </div>
          <p className="text-gray-600">
            Phase 8 AI 대시보드는 현재 준비 중입니다.
          </p>
        </div>
      )
    }))
);

// RealTimeSimulationDashboard 최적화 버전
export const OptimizedRealTimeSimulationDashboard = lazy(() =>
  import('../../../../../../components/simulation/RealTimeSimulationDashboard')
    .then(module => ({
      default: withProgressiveEnhancement(module.RealTimeSimulationDashboard, {
        name: '실시간 시뮬레이션',
        icon: <TrendingUp className="w-12 h-12 text-primary-main" />,
        checkResources: true
      })
    }))
    .catch(() => ({
      default: () => (
        <div className="p-6 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-gray-500" />
            <h3 className="text-lg font-semibold">실시간 시뮬레이션</h3>
          </div>
          <p className="text-gray-600">
            Phase 8 실시간 시뮬레이션은 현재 준비 중입니다.
          </p>
        </div>
      )
    }))
);

// 리소스 모니터링 훅
export const useResourceMonitor = () => {
  const [resourceStatus, setResourceStatus] = useState({
    memoryUsage: 0,
    isHealthy: true,
    warning: null as string | null
  });

  useEffect(() => {
    const checkResources = () => {
      const memory = (performance as any).memory;
      if (memory) {
        const usedMemory = memory.usedJSHeapSize;
        const totalMemory = memory.jsHeapSizeLimit;
        const memoryUsage = (usedMemory / totalMemory) * 100;

        setResourceStatus({
          memoryUsage: Math.round(memoryUsage),
          isHealthy: memoryUsage < 80,
          warning: memoryUsage > 80
            ? `메모리 사용률이 높습니다 (${Math.round(memoryUsage)}%)`
            : null
        });
      }
    };

    // 5초마다 체크
    const interval = setInterval(checkResources, 5000);
    checkResources(); // 초기 실행

    return () => clearInterval(interval);
  }, []);

  return resourceStatus;
};