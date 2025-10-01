/**
 * LazyLoader Component
 * 컴포넌트 지연 로딩을 위한 래퍼
 */

import React, { Suspense, lazy, ComponentType } from 'react';
import { LoadingState } from './LoadingState';

interface LazyLoaderProps {
  loader: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  props?: Record<string, any>;
}

/**
 * 지연 로딩 HOC
 */
export function withLazyLoad<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(loader);
}

/**
 * 에러 바운더리와 서스펜스를 포함한 지연 로딩 컴포넌트
 */
export const LazyLoader: React.FC<LazyLoaderProps> = ({
  loader,
  fallback,
  props = {}
}) => {
  const LazyComponent = lazy(loader);

  return (
    <ErrorBoundary>
      <Suspense fallback={fallback || <LoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * 로딩 폴백 컴포넌트
 */
const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      <p className="text-sm text-gray-600 mt-4">컴포넌트를 로드하는 중...</p>
    </div>
  </div>
);

/**
 * 에러 바운더리
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            컴포넌트 로드 실패
          </h3>
          <p className="text-sm text-red-600">
            {this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 조건부 지연 로딩 HOC
 */
export function conditionalLazy<P extends object>(
  Component: ComponentType<P>,
  condition: boolean
): ComponentType<P> {
  if (!condition) return Component;

  return lazy(async () => ({
    default: Component
  }));
}

/**
 * Intersection Observer를 사용한 뷰포트 기반 지연 로딩
 */
export const ViewportLazyLoader: React.FC<{
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}> = ({ children, threshold = 0.1, rootMargin = '100px' }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div ref={ref}>
      {isVisible ? children : <LoadingFallback />}
    </div>
  );
};