/**
 * Enhanced Error Boundary
 * V3 레포트 시스템용 강화된 에러 바운더리
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { getPerformanceMonitor } from '@/utils/performanceMonitorV3';

/**
 * 에러 타입 분류
 */
export enum ErrorType {
  NETWORK = 'network',
  DATA_PROCESSING = 'data_processing',
  RENDERING = 'rendering',
  PERMISSION = 'permission',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

/**
 * 에러 심각도
 */
export enum ErrorSeverity {
  CRITICAL = 'critical',  // 전체 앱 중단
  HIGH = 'high',         // 주요 기능 중단
  MEDIUM = 'medium',     // 일부 기능 중단
  LOW = 'low'           // 미미한 영향
}

/**
 * 에러 상태 인터페이스
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorType: ErrorType;
  errorSeverity: ErrorSeverity;
  errorCount: number;
  showDetails: boolean;
  isRecovering: boolean;
  retryCount: number;
  errorHistory: Array<{
    timestamp: Date;
    error: Error;
    type: ErrorType;
  }>;
}

/**
 * 에러 바운더리 Props
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableAutoRecovery?: boolean;
  maxRetries?: number;
  isolate?: boolean; // 에러를 이 바운더리 내에서만 처리
  componentName?: string;
}

/**
 * 강화된 에러 바운더리 컴포넌트
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private performanceMonitor = getPerformanceMonitor();

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: ErrorType.UNKNOWN,
      errorSeverity: ErrorSeverity.MEDIUM,
      errorCount: 0,
      showDetails: false,
      isRecovering: false,
      retryCount: 0,
      errorHistory: []
    };
  }

  /**
   * 에러 캐칭
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  /**
   * 에러 정보 캡처
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorType = this.classifyError(error);
    const errorSeverity = this.assessSeverity(error, errorType);

    // 에러 히스토리 업데이트
    const errorHistory = [
      ...this.state.errorHistory,
      {
        timestamp: new Date(),
        error,
        type: errorType
      }
    ].slice(-10); // 최근 10개만 유지

    this.setState(prevState => ({
      errorInfo,
      errorType,
      errorSeverity,
      errorCount: prevState.errorCount + 1,
      errorHistory
    }));

    // 에러 로깅
    this.logError(error, errorInfo, errorType, errorSeverity);

    // 콜백 실행
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 자동 복구 시도
    if (this.props.enableAutoRecovery && this.state.retryCount < (this.props.maxRetries || 3)) {
      this.scheduleAutoRecovery();
    }

    // 성능 모니터에 기록
    this.performanceMonitor.trackAPI(
      'error_boundary',
      'ERROR',
      0,
      'error',
      error.message.length
    );
  }

  /**
   * 에러 분류
   */
  private classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || name.includes('network')) {
      return ErrorType.NETWORK;
    }
    if (message.includes('process') || message.includes('data') || message.includes('parse')) {
      return ErrorType.DATA_PROCESSING;
    }
    if (message.includes('render') || message.includes('component') || name.includes('react')) {
      return ErrorType.RENDERING;
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return ErrorType.PERMISSION;
    }
    if (message.includes('valid') || message.includes('required')) {
      return ErrorType.VALIDATION;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * 심각도 평가
   */
  private assessSeverity(error: Error, type: ErrorType): ErrorSeverity {
    // 타입별 기본 심각도
    const typeSeverity: Record<ErrorType, ErrorSeverity> = {
      [ErrorType.NETWORK]: ErrorSeverity.HIGH,
      [ErrorType.DATA_PROCESSING]: ErrorSeverity.HIGH,
      [ErrorType.RENDERING]: ErrorSeverity.MEDIUM,
      [ErrorType.PERMISSION]: ErrorSeverity.CRITICAL,
      [ErrorType.VALIDATION]: ErrorSeverity.LOW,
      [ErrorType.UNKNOWN]: ErrorSeverity.MEDIUM
    };

    let severity = typeSeverity[type];

    // 에러 메시지 기반 조정
    if (error.message.includes('critical') || error.message.includes('fatal')) {
      severity = ErrorSeverity.CRITICAL;
    }

    // 반복 에러 시 심각도 상승
    if (this.state.errorCount > 5) {
      severity = ErrorSeverity.CRITICAL;
    }

    return severity;
  }

  /**
   * 에러 로깅
   */
  private logError(
    error: Error,
    errorInfo: ErrorInfo,
    type: ErrorType,
    severity: ErrorSeverity
  ) {
    const logData = {
      timestamp: new Date().toISOString(),
      component: this.props.componentName || 'Unknown',
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      type,
      severity,
      browser: navigator.userAgent,
      url: window.location.href,
      errorCount: this.state.errorCount
    };

    // 콘솔 로깅
    console.group(`🔴 Error Boundary Caught [${severity.toUpperCase()}]`);
    console.error('Error:', error);
    console.error('Type:', type);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Full Details:', logData);
    console.groupEnd();

    // localStorage에 저장 (최근 50개)
    try {
      const errors = JSON.parse(localStorage.getItem('v3_error_logs') || '[]');
      errors.push(logData);
      if (errors.length > 50) errors.shift();
      localStorage.setItem('v3_error_logs', JSON.stringify(errors));
    } catch (e) {
      console.error('Failed to save error log:', e);
    }

    // 서버로 전송 (프로덕션 환경에서)
    if (process.env.NODE_ENV === 'production') {
      this.sendErrorToServer(logData);
    }
  }

  /**
   * 서버로 에러 전송
   */
  private async sendErrorToServer(errorData: any) {
    try {
      // 실제 구현 시 에러 수집 서비스로 전송
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // });
    } catch (error) {
      console.error('Failed to send error to server:', error);
    }
  }

  /**
   * 자동 복구 스케줄링
   */
  private scheduleAutoRecovery() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 30000); // 최대 30초

    this.setState({ isRecovering: true });

    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);
  }

  /**
   * 재시도 핸들러
   */
  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false,
      retryCount: prevState.retryCount + 1
    }));
  };

  /**
   * 수동 재시도
   */
  private handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      errorCount: 0
    });
  };

  /**
   * 홈으로 이동
   */
  private handleGoHome = () => {
    window.location.href = '/';
  };

  /**
   * 상세 정보 토글
   */
  private toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  /**
   * 컴포넌트 언마운트
   */
  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  /**
   * 렌더링
   */
  render() {
    if (this.state.hasError) {
      // 커스텀 폴백이 제공된 경우
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // 기본 에러 UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-2xl w-full">
            {/* 에러 카드 */}
            <div className={`bg-white rounded-lg shadow-lg border-l-4 ${
              this.state.errorSeverity === ErrorSeverity.CRITICAL ? 'border-red-600' :
              this.state.errorSeverity === ErrorSeverity.HIGH ? 'border-orange-600' :
              this.state.errorSeverity === ErrorSeverity.MEDIUM ? 'border-yellow-600' :
              'border-blue-600'
            }`}>
              {/* 헤더 */}
              <div className="p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <AlertCircle className={`h-6 w-6 ${
                      this.state.errorSeverity === ErrorSeverity.CRITICAL ? 'text-red-600' :
                      this.state.errorSeverity === ErrorSeverity.HIGH ? 'text-orange-600' :
                      this.state.errorSeverity === ErrorSeverity.MEDIUM ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {this.getErrorTitle()}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">
                      {this.getErrorDescription()}
                    </p>

                    {/* 에러 메시지 */}
                    <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                      <code className="text-red-600">
                        {this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
                      </code>
                    </div>

                    {/* 복구 중 표시 */}
                    {this.state.isRecovering && (
                      <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-700">
                        자동 복구를 시도하고 있습니다... (시도 {this.state.retryCount + 1}/{this.props.maxRetries || 3})
                      </div>
                    )}
                  </div>
                </div>

                {/* 액션 버튼들 */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={this.handleManualRetry}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    다시 시도
                  </button>

                  <button
                    onClick={this.handleGoHome}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    홈으로
                  </button>

                  <button
                    onClick={this.toggleDetails}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {this.state.showDetails ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        상세 정보 숨기기
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        상세 정보 보기
                      </>
                    )}
                  </button>
                </div>

                {/* 상세 정보 */}
                {this.state.showDetails && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">기술적 세부사항</h4>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-medium">에러 타입:</span> {this.state.errorType}
                      </div>
                      <div>
                        <span className="font-medium">심각도:</span> {this.state.errorSeverity}
                      </div>
                      <div>
                        <span className="font-medium">컴포넌트:</span> {this.props.componentName || 'Unknown'}
                      </div>
                      <div>
                        <span className="font-medium">발생 횟수:</span> {this.state.errorCount}
                      </div>
                      <div>
                        <span className="font-medium">재시도 횟수:</span> {this.state.retryCount}
                      </div>
                    </div>

                    {/* 스택 트레이스 */}
                    {this.state.error?.stack && (
                      <div className="mt-4">
                        <h5 className="text-xs font-medium text-gray-900 mb-1">스택 트레이스:</h5>
                        <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}

                    {/* 에러 히스토리 */}
                    {this.state.errorHistory.length > 1 && (
                      <div className="mt-4">
                        <h5 className="text-xs font-medium text-gray-900 mb-1">최근 에러 히스토리:</h5>
                        <ul className="text-xs space-y-1">
                          {this.state.errorHistory.slice(-5).reverse().map((item, index) => (
                            <li key={index} className="flex justify-between">
                              <span>{item.error.message.substring(0, 50)}...</span>
                              <span className="text-gray-500">
                                {new Date(item.timestamp).toLocaleTimeString()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 도움말 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">문제 해결 도움말</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {this.getHelpSuggestions().map((suggestion, index) => (
                  <li key={index}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }

  /**
   * 에러 제목 생성
   */
  private getErrorTitle(): string {
    const titles: Record<ErrorType, string> = {
      [ErrorType.NETWORK]: '네트워크 연결 문제',
      [ErrorType.DATA_PROCESSING]: '데이터 처리 오류',
      [ErrorType.RENDERING]: '화면 표시 오류',
      [ErrorType.PERMISSION]: '권한 오류',
      [ErrorType.VALIDATION]: '데이터 검증 오류',
      [ErrorType.UNKNOWN]: '예기치 않은 오류'
    };

    return titles[this.state.errorType];
  }

  /**
   * 에러 설명 생성
   */
  private getErrorDescription(): string {
    const descriptions: Record<ErrorType, string> = {
      [ErrorType.NETWORK]: '서버와의 연결에 문제가 발생했습니다. 네트워크 상태를 확인해주세요.',
      [ErrorType.DATA_PROCESSING]: '데이터를 처리하는 중 문제가 발생했습니다.',
      [ErrorType.RENDERING]: '화면을 표시하는 중 문제가 발생했습니다.',
      [ErrorType.PERMISSION]: '이 작업을 수행할 권한이 없습니다.',
      [ErrorType.VALIDATION]: '입력된 데이터가 올바르지 않습니다.',
      [ErrorType.UNKNOWN]: '예상치 못한 문제가 발생했습니다.'
    };

    return descriptions[this.state.errorType];
  }

  /**
   * 도움말 제안 생성
   */
  private getHelpSuggestions(): string[] {
    const suggestions: Record<ErrorType, string[]> = {
      [ErrorType.NETWORK]: [
        '인터넷 연결을 확인하세요',
        '잠시 후 다시 시도해주세요',
        'VPN을 사용 중이라면 연결을 해제해보세요'
      ],
      [ErrorType.DATA_PROCESSING]: [
        '페이지를 새로고침하세요',
        '브라우저 캐시를 삭제해보세요',
        '다른 브라우저에서 시도해보세요'
      ],
      [ErrorType.RENDERING]: [
        '브라우저를 최신 버전으로 업데이트하세요',
        '브라우저 확장 프로그램을 비활성화해보세요',
        '시크릿/프라이빗 모드에서 시도해보세요'
      ],
      [ErrorType.PERMISSION]: [
        '로그인 상태를 확인하세요',
        '계정 권한을 확인하세요',
        '관리자에게 문의하세요'
      ],
      [ErrorType.VALIDATION]: [
        '입력한 데이터를 다시 확인하세요',
        '필수 항목을 모두 입력했는지 확인하세요',
        '데이터 형식이 올바른지 확인하세요'
      ],
      [ErrorType.UNKNOWN]: [
        '페이지를 새로고침하세요',
        '잠시 후 다시 시도해주세요',
        '문제가 지속되면 지원팀에 문의하세요'
      ]
    };

    return suggestions[this.state.errorType];
  }
}

/**
 * HOC: 에러 바운더리로 컴포넌트 래핑
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}