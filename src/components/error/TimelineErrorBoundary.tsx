/**
 * @fileoverview Timeline Error Boundary
 * @description Phase 4 Step 2-1: 타임라인 렌더링 에러 감지 및 폴백 UI
 * @author PocketCompany
 * @since 2025-01-30
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * ErrorBoundary Props
 */
interface TimelineErrorBoundaryProps {
  children: ReactNode;
}

/**
 * ErrorBoundary State
 */
interface TimelineErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Timeline Error Boundary 컴포넌트
 * - 타임라인 렌더링 중 발생하는 에러 캐치
 * - 사용자 친화적 폴백 UI 제공
 * - 에러 로깅 및 복구 옵션
 */
class TimelineErrorBoundary extends Component<
  TimelineErrorBoundaryProps,
  TimelineErrorBoundaryState
> {
  constructor(props: TimelineErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  /**
   * 에러 발생 시 상태 업데이트
   */
  static getDerivedStateFromError(error: Error): Partial<TimelineErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  /**
   * 에러 로깅
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('🔴 Timeline Rendering Error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    this.setState({
      error,
      errorInfo
    });
  }

  /**
   * 에러 복구 시도 (새로고침)
   */
  handleRefresh = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.reload();
  };

  /**
   * 에러 무시하고 계속 (위험)
   */
  handleContinue = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full min-h-[600px] bg-gray-50">
          <div className="max-w-md w-full mx-4">
            {/* 에러 아이콘 */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
            </div>

            {/* 에러 메시지 */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                타임라인 로딩 실패
              </h2>
              <p className="text-gray-600">
                타임라인을 표시하는 중 오류가 발생했습니다.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                잠시 후 다시 시도해주세요.
              </p>
            </div>

            {/* 에러 상세 (개발 모드) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm font-mono text-red-800 mb-2">
                  <strong>Error:</strong> {this.state.error.message}
                </div>
                {this.state.errorInfo && (
                  <details className="text-xs text-red-600 mt-2">
                    <summary className="cursor-pointer font-semibold">
                      Component Stack
                    </summary>
                    <pre className="mt-2 overflow-auto max-h-32 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleRefresh}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                페이지 새로고침
              </button>

              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={this.handleContinue}
                  className="w-full py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  계속하기 (개발 모드)
                </button>
              )}

              <button
                onClick={() => window.history.back()}
                className="w-full py-2 px-4 text-gray-600 hover:text-gray-900 transition-colors text-sm"
              >
                이전 페이지로 돌아가기
              </button>
            </div>

            {/* 도움말 */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 도움말:</strong> 문제가 계속되면 브라우저 캐시를 삭제하거나 다른 브라우저를 사용해보세요.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default TimelineErrorBoundary;