/**
 * ErrorFallback.tsx
 *
 * 오류가 발생했을 때 표시할 사용자 친화적인 폴백 UI
 * ErrorBoundary와 함께 사용되어 앱이 중단되지 않도록 함
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetError?: () => void;
  componentStack?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  componentStack
}) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/startup/dashboard';
  };

  const handleReportError = () => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    // 에러 리포팅 서비스로 전송 (예: Sentry, LogRocket 등)
    console.error('Error Report:', errorReport);

    // 개발 환경에서는 콘솔에 상세 정보 표시
    if (isDevelopment) {
      console.group('🐛 Error Details');
      console.error('Error:', error);
      console.error('Component Stack:', componentStack);
      console.groupEnd();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">
          문제가 발생했습니다
        </h1>

        <p className="text-gray-600 mb-6">
          예상치 못한 오류가 발생했습니다. 불편을 드려 죄송합니다.
        </p>

        {isDevelopment && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-medium text-red-800 mb-2">개발자 정보:</h3>
            <p className="text-xs text-red-700 font-mono break-all">
              {error.message}
            </p>
            {error.stack && (
              <details className="mt-2">
                <summary className="text-xs text-red-600 cursor-pointer">
                  스택 트레이스 보기
                </summary>
                <pre className="text-xs text-red-600 mt-2 whitespace-pre-wrap">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="space-y-3">
          {resetError && (
            <button
              onClick={resetError}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </button>
          )}

          <button
            onClick={handleReload}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            페이지 새로고침
          </button>

          <button
            onClick={handleGoHome}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Home className="w-4 h-4" />
            홈으로 돌아가기
          </button>

          <button
            onClick={handleReportError}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Mail className="w-4 h-4" />
            오류 신고하기
          </button>
        </div>
      </div>
    </div>
  );
};

// 네트워크 오류용 특별 폴백
export const NetworkErrorFallback: React.FC<{ retry: () => void }> = ({ retry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="p-3 bg-yellow-100 rounded-full mb-4">
        <AlertTriangle className="w-8 h-8 text-yellow-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        연결에 문제가 있습니다
      </h3>
      <p className="text-gray-600 mb-4">
        네트워크 연결을 확인하고 다시 시도해주세요.
      </p>
      <button
        onClick={retry}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        다시 시도
      </button>
    </div>
  );
};

// 데이터 로딩 실패용 폴백
export const DataLoadErrorFallback: React.FC<{
  message?: string;
  retry: () => void
}> = ({
  message = "데이터를 불러올 수 없습니다",
  retry
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg">
      <div className="p-3 bg-red-100 rounded-full mb-4">
        <AlertTriangle className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="text-md font-medium text-gray-900 mb-2">
        {message}
      </h3>
      <button
        onClick={retry}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        다시 시도
      </button>
    </div>
  );
};

export default ErrorFallback;