/**
 * @fileoverview 사용자 친화적 에러 핸들러 컴포넌트
 * @description Sprint 4 Phase 4-5: 에러 상황을 사용자에게 친화적으로 표시하고 복구 옵션 제공
 * @author PocketCompany
 * @since 2025-01-19
 */

import React, { useState, useEffect } from 'react';
import { ErrorManager, type StandardizedError } from '../../utils/errorManager';

/**
 * 에러 표시 모드
 */
type ErrorDisplayMode = 'toast' | 'modal' | 'inline' | 'banner';

/**
 * 에러 핸들러 Props
 */
interface ErrorHandlerProps {
  error?: StandardizedError;
  mode?: ErrorDisplayMode;
  onRetry?: () => void;
  onDismiss?: () => void;
  onContactSupport?: () => void;
  className?: string;
  autoHide?: boolean;
  hideAfter?: number; // milliseconds
}

/**
 * 에러 아이콘 컴포넌트
 */
const ErrorIcon: React.FC<{ severity: string; className?: string }> = ({ severity, className = "w-6 h-6" }) => {
  const getIcon = () => {
    switch (severity) {
      case 'critical':
        return (
          <svg className={`${className} text-red-600`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'high':
        return (
          <svg className={`${className} text-orange-600`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'medium':
        return (
          <svg className={`${className} text-yellow-600`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className={`${className} text-blue-600`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return <div className="flex-shrink-0">{getIcon()}</div>;
};

/**
 * 액션 버튼 컴포넌트
 */
const ActionButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
  disabled?: boolean;
}> = ({ children, onClick, variant = 'secondary', size = 'md', disabled = false }) => {
  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';

    const sizeClasses = size === 'sm'
      ? 'px-3 py-1.5 text-sm'
      : 'px-4 py-2 text-sm';

    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
    };

    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

    return `${baseClasses} ${sizeClasses} ${variantClasses[variant]} ${disabledClasses}`;
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={getButtonClasses()}
    >
      {children}
    </button>
  );
};

/**
 * Toast 스타일 에러 표시
 */
const ErrorToast: React.FC<ErrorHandlerProps> = ({
  error,
  onRetry,
  onDismiss,
  onContactSupport,
  autoHide = true,
  hideAfter = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide && error?.severity !== 'critical') {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, hideAfter);

      return () => clearTimeout(timer);
    }
  }, [autoHide, hideAfter, error?.severity, onDismiss]);

  if (!error || !isVisible) return null;

  const getToastClasses = () => {
    const baseClasses = 'fixed top-4 right-4 z-50 max-w-md w-full bg-white rounded-lg shadow-lg border-l-4 transform transition-all duration-300';

    const severityClasses = {
      critical: 'border-red-500',
      high: 'border-orange-500',
      medium: 'border-yellow-500',
      low: 'border-blue-500'
    };

    return `${baseClasses} ${severityClasses[error.severity as keyof typeof severityClasses] || severityClasses.low}`;
  };

  return (
    <div className={getToastClasses()}>
      <div className="p-4">
        <div className="flex items-start">
          <ErrorIcon severity={error.severity} className="w-5 h-5 mt-0.5" />

          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              {error.severity === 'critical' ? '심각한 오류' :
               error.severity === 'high' ? '오류 발생' :
               error.severity === 'medium' ? '주의사항' : '알림'}
            </h3>

            <div className="mt-1 text-sm text-gray-700">
              {error.userMessage}
            </div>

            {error.actionMessage && (
              <div className="mt-1 text-xs text-gray-500">
                {error.actionMessage}
              </div>
            )}

            <div className="mt-3 flex space-x-2">
              {error.isRecoverable && onRetry && (
                <ActionButton
                  onClick={onRetry}
                  variant="primary"
                  size="sm"
                >
                  재시도
                </ActionButton>
              )}

              {error.severity === 'critical' && onContactSupport && (
                <ActionButton
                  onClick={onContactSupport}
                  variant="danger"
                  size="sm"
                >
                  지원 요청
                </ActionButton>
              )}

              <ActionButton
                onClick={() => {
                  setIsVisible(false);
                  onDismiss?.();
                }}
                variant="secondary"
                size="sm"
              >
                닫기
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Modal 스타일 에러 표시
 */
const ErrorModal: React.FC<ErrorHandlerProps> = ({
  error,
  onRetry,
  onDismiss,
  onContactSupport
}) => {
  if (!error) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* 배경 오버레이 */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onDismiss}
        />

        {/* 모달 컨텐츠 */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center">
            <ErrorIcon severity={error.severity} className="w-8 h-8" />
            <h3 className="ml-3 text-lg font-medium text-gray-900">
              {error.severity === 'critical' ? '심각한 문제가 발생했습니다' : '오류가 발생했습니다'}
            </h3>
          </div>

          <div className="mt-4">
            <div className="text-sm text-gray-700">
              {error.userMessage}
            </div>

            {error.actionMessage && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <div className="text-sm text-gray-600">
                  <strong>해결 방법:</strong> {error.actionMessage}
                </div>
              </div>
            )}

            {error.recoveryActions.length > 0 && (
              <div className="mt-3">
                <div className="text-sm font-medium text-gray-900 mb-2">추천 액션:</div>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {error.recoveryActions.map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6 flex space-x-3">
            {error.isRecoverable && onRetry && (
              <ActionButton onClick={onRetry} variant="primary">
                재시도
              </ActionButton>
            )}

            {error.severity === 'critical' && onContactSupport && (
              <ActionButton onClick={onContactSupport} variant="danger">
                지원팀 연락
              </ActionButton>
            )}

            <ActionButton onClick={onDismiss} variant="secondary">
              {error.severity === 'critical' ? '확인' : '닫기'}
            </ActionButton>
          </div>

          {/* 기술적 세부사항 (접기/펼치기) */}
          <details className="mt-4">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
              기술적 세부사항 보기
            </summary>
            <div className="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-600 font-mono">
              <div><strong>에러 ID:</strong> {error.id}</div>
              <div><strong>시간:</strong> {error.timestamp.toLocaleString()}</div>
              <div><strong>카테고리:</strong> {error.category}</div>
              <div><strong>기술적 메시지:</strong> {error.technicalMessage}</div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

/**
 * Inline 스타일 에러 표시
 */
const ErrorInline: React.FC<ErrorHandlerProps> = ({
  error,
  onRetry,
  onDismiss,
  className = ''
}) => {
  if (!error) return null;

  const getBorderColor = () => {
    switch (error.severity) {
      case 'critical': return 'border-red-500';
      case 'high': return 'border-orange-500';
      case 'medium': return 'border-yellow-500';
      default: return 'border-blue-500';
    }
  };

  const getBgColor = () => {
    switch (error.severity) {
      case 'critical': return 'bg-red-50';
      case 'high': return 'bg-orange-50';
      case 'medium': return 'bg-yellow-50';
      default: return 'bg-blue-50';
    }
  };

  return (
    <div className={`border-l-4 p-4 ${getBorderColor()} ${getBgColor()} ${className}`}>
      <div className="flex items-start">
        <ErrorIcon severity={error.severity} className="w-5 h-5 mt-0.5" />

        <div className="ml-3 flex-1">
          <h4 className="text-sm font-medium text-gray-900">
            {error.userMessage}
          </h4>

          {error.actionMessage && (
            <div className="mt-1 text-sm text-gray-600">
              {error.actionMessage}
            </div>
          )}

          <div className="mt-3 flex space-x-2">
            {error.isRecoverable && onRetry && (
              <ActionButton onClick={onRetry} variant="primary" size="sm">
                재시도
              </ActionButton>
            )}

            {onDismiss && (
              <ActionButton onClick={onDismiss} variant="secondary" size="sm">
                닫기
              </ActionButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Banner 스타일 에러 표시
 */
const ErrorBanner: React.FC<ErrorHandlerProps> = ({
  error,
  onRetry,
  onDismiss
}) => {
  if (!error || error.severity === 'low') return null;

  const getBgColor = () => {
    switch (error.severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-yellow-600';
      default: return 'bg-blue-600';
    }
  };

  return (
    <div className={`${getBgColor()} text-white`}>
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="w-0 flex-1 flex items-center">
            <ErrorIcon severity={error.severity} className="w-6 h-6 text-white" />

            <p className="ml-3 font-medium">
              <span className="md:hidden">{error.userMessage}</span>
              <span className="hidden md:inline">
                {error.userMessage} {error.actionMessage && `- ${error.actionMessage}`}
              </span>
            </p>
          </div>

          <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
            <div className="flex space-x-2">
              {error.isRecoverable && onRetry && (
                <button
                  onClick={onRetry}
                  className="bg-white text-gray-800 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100"
                >
                  재시도
                </button>
              )}

              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-white hover:text-gray-200 p-1"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 메인 에러 핸들러 컴포넌트
 */
export const ErrorHandler: React.FC<ErrorHandlerProps> = ({
  mode = 'toast',
  ...props
}) => {
  const handleRetry = async () => {
    if (props.error && props.onRetry) {
      // 자동 복구 시도
      const recovered = await ErrorManager.attemptAutoRecovery(props.error.id);

      if (recovered) {
        props.onDismiss?.();
      } else {
        props.onRetry();
      }
    }
  };

  const handleContactSupport = () => {
    if (props.error) {
      ErrorManager.reportErrorToAdmin(props.error.id);

      // 실제 환경에서는 지원팀 연락 로직 (이메일, 채팅 등)

      props.onContactSupport?.();
    }
  };

  const componentProps = {
    ...props,
    onRetry: handleRetry,
    onContactSupport: handleContactSupport
  };

  switch (mode) {
    case 'modal':
      return <ErrorModal {...componentProps} />;
    case 'inline':
      return <ErrorInline {...componentProps} />;
    case 'banner':
      return <ErrorBanner {...componentProps} />;
    case 'toast':
    default:
      return <ErrorToast {...componentProps} />;
  }
};

/**
 * 에러 핸들러 훅
 */
export const useErrorHandler = () => {
  const [currentError, setCurrentError] = useState<StandardizedError | null>(null);

  const showError = (error: Error | StandardizedError, context?: any) => {
    const standardizedError = error instanceof Error
      ? ErrorManager.standardizeError(error, context)
      : error;

    setCurrentError(standardizedError);
    ErrorManager.reportErrorToUser(standardizedError.id);
  };

  const clearError = () => {
    setCurrentError(null);
  };

  return {
    currentError,
    showError,
    clearError
  };
};

export default ErrorHandler;