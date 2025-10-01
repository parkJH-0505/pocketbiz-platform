/**
 * 글로벌 에러 바운더리
 *
 * 전체 애플리케이션에서 발생하는 React 에러를 포착하고
 * 사용자에게 적절한 피드백을 제공하며 에러를 추적
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // 에러 발생 시 상태 업데이트
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Global Error Boundary:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // 에러 추적 및 로깅
    this.trackError(error, errorInfo);
  }

  // 에러 추적 시스템
  private trackError(error: Error, errorInfo: ErrorInfo) {
    const errorReport = {
      id: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('user-id') || 'anonymous'
    };

    // localStorage에 에러 로그 저장
    try {
      const existingErrors = JSON.parse(localStorage.getItem('error-logs') || '[]');
      existingErrors.push(errorReport);

      // 최대 50개의 에러 로그만 유지
      if (existingErrors.length > 50) {
        existingErrors.splice(0, existingErrors.length - 50);
      }

      localStorage.setItem('error-logs', JSON.stringify(existingErrors));
    } catch (storageError) {
      console.error('에러 로그 저장 실패:', storageError);
    }

    // 개발 환경에서는 추가 디버깅 정보 출력
    if (import.meta.env.DEV) {
      console.group('🐛 Error Details');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  // 페이지 새로고침
  private handleRefresh = () => {
    window.location.reload();
  };

  // 홈으로 이동
  private handleGoHome = () => {
    window.location.href = '/startup/dashboard';
  };

  // 에러 리포트 다운로드
  private handleDownloadErrorReport = () => {
    if (!this.state.error || !this.state.errorInfo) return;

    const errorReport = {
      id: this.state.errorId,
      timestamp: new Date().toISOString(),
      error: {
        message: this.state.error.message,
        stack: this.state.error.stack,
        name: this.state.error.name
      },
      errorInfo: {
        componentStack: this.state.errorInfo.componentStack
      },
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      },
      userActions: this.getUserActions()
    };

    const blob = new Blob([JSON.stringify(errorReport, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${this.state.errorId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 사용자 행동 기록 조회
  private getUserActions() {
    try {
      return {
        todayStats: JSON.parse(localStorage.getItem('today-stats') || '{}'),
        recentActivity: localStorage.getItem('recent-user-activity') || 'N/A',
        lastRoute: localStorage.getItem('last-route') || 'N/A'
      };
    } catch {
      return {};
    }
  }

  // 에러 상태 초기화
  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              {/* 에러 아이콘 및 제목 */}
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  앗! 예상치 못한 오류가 발생했습니다
                </h1>
                <p className="text-gray-600">
                  시스템에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
                </p>
              </div>

              {/* 에러 정보 (개발 환경에서만) */}
              {import.meta.env.DEV && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                    <Bug className="w-4 h-4" />
                    개발자 정보
                  </h3>
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="font-medium text-red-800">에러 ID:</span>
                      <span className="ml-2 font-mono text-red-700">{this.state.errorId}</span>
                    </div>
                    <div>
                      <span className="font-medium text-red-800">메시지:</span>
                      <span className="ml-2 text-red-700">{this.state.error.message}</span>
                    </div>
                    <details className="mt-2">
                      <summary className="font-medium text-red-800 cursor-pointer">
                        스택 트레이스 보기
                      </summary>
                      <pre className="mt-2 p-3 bg-red-100 rounded text-xs overflow-x-auto text-red-800">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  </div>
                </div>
              )}

              {/* 액션 버튼들 */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleRetry}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  다시 시도
                </button>

                <button
                  onClick={this.handleRefresh}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  페이지 새로고침
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  홈으로 이동
                </button>
              </div>

              {/* 에러 리포트 다운로드 (개발 환경) */}
              {import.meta.env.DEV && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={this.handleDownloadErrorReport}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Bug className="w-4 h-4" />
                    에러 리포트 다운로드
                  </button>
                </div>
              )}

              {/* 도움말 */}
              <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                <p>
                  문제가 지속되면{' '}
                  <a
                    href="mailto:support@pocketcompany.co.kr"
                    className="text-blue-600 hover:underline"
                  >
                    고객지원팀
                  </a>
                  으로 연락주세요.
                </p>
                <p className="mt-1">
                  에러 ID: <span className="font-mono">{this.state.errorId}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;