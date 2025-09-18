/**
 * useErrorHandler.ts
 *
 * 앱 전체에서 일관된 오류 처리를 위한 커스텀 훅
 * 네트워크 오류, 비즈니스 로직 오류 등을 처리
 */

import { useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

export type ErrorType =
  | 'network'
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'not_found'
  | 'server'
  | 'unknown';

interface ErrorDetails {
  type: ErrorType;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
  userFriendlyMessage?: string;
}

export const useErrorHandler = () => {
  const { showError, showWarning, showInfo, showDebug } = useToast();

  const handleError = useCallback((error: Error | ErrorDetails) => {
    let errorDetails: ErrorDetails;

    // Error 객체인 경우 ErrorDetails로 변환
    if (error instanceof Error) {
      errorDetails = {
        type: getErrorType(error),
        message: error.message,
        originalError: error,
        userFriendlyMessage: getUserFriendlyMessage(error)
      };
    } else {
      errorDetails = error;
    }

    // 개발자용 디버깅 정보
    showDebug(`Error Handled: ${errorDetails.type}`, {
      message: errorDetails.message,
      context: errorDetails.context,
      stack: errorDetails.originalError?.stack
    });

    // 사용자에게 표시할 메시지 결정
    const userMessage = errorDetails.userFriendlyMessage ||
                       getDefaultUserMessage(errorDetails.type);

    // 오류 유형에 따라 적절한 토스트 표시
    switch (errorDetails.type) {
      case 'network':
        showError(`${userMessage} 네트워크 연결을 확인해주세요.`);
        break;
      case 'authentication':
        showWarning(`${userMessage} 다시 로그인해주세요.`);
        break;
      case 'authorization':
        showWarning(`${userMessage} 권한이 필요합니다.`);
        break;
      case 'validation':
        showInfo(userMessage);
        break;
      case 'not_found':
        showWarning(`${userMessage} 페이지를 찾을 수 없습니다.`);
        break;
      case 'server':
        showError(`${userMessage} 잠시 후 다시 시도해주세요.`);
        break;
      default:
        showError(`${userMessage} 문제가 지속되면 관리자에게 문의하세요.`);
    }

    // 프로덕션에서는 에러 리포팅 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      reportError(errorDetails);
    }

    return errorDetails;
  }, [showError, showWarning, showInfo, showDebug]);

  // 비동기 함수를 래핑하여 자동으로 오류 처리
  const withErrorHandler = useCallback(<T extends any[], R>(
    asyncFn: (...args: T) => Promise<R>,
    errorContext?: Record<string, any>
  ) => {
    return async (...args: T): Promise<R | null> => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        const errorDetails: ErrorDetails = error instanceof Error ? {
          type: getErrorType(error),
          message: error.message,
          originalError: error,
          context: errorContext,
          userFriendlyMessage: getUserFriendlyMessage(error)
        } : error;

        handleError(errorDetails);
        return null;
      }
    };
  }, [handleError]);

  // 네트워크 재시도 로직
  const withRetry = useCallback(<T extends any[], R>(
    asyncFn: (...args: T) => Promise<R>,
    options: {
      maxRetries?: number;
      retryDelay?: number;
      shouldRetry?: (error: Error) => boolean;
    } = {}
  ) => {
    const { maxRetries = 3, retryDelay = 1000, shouldRetry = isRetryableError } = options;

    return async (...args: T): Promise<R> => {
      let lastError: Error;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await asyncFn(...args);
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          if (attempt === maxRetries || !shouldRetry(lastError)) {
            throw lastError;
          }

          // 재시도 전 대기
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));

          showInfo(`재시도 중... (${attempt + 1}/${maxRetries})`);
        }
      }

      throw lastError!;
    };
  }, [showInfo]);

  return {
    handleError,
    withErrorHandler,
    withRetry
  };
};

// 에러 타입 결정 함수
function getErrorType(error: Error): ErrorType {
  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('fetch')) {
    return 'network';
  }
  if (message.includes('unauthorized') || message.includes('401')) {
    return 'authentication';
  }
  if (message.includes('forbidden') || message.includes('403')) {
    return 'authorization';
  }
  if (message.includes('not found') || message.includes('404')) {
    return 'not_found';
  }
  if (message.includes('validation') || message.includes('invalid')) {
    return 'validation';
  }
  if (message.includes('500') || message.includes('server')) {
    return 'server';
  }

  return 'unknown';
}

// 사용자 친화적 메시지 생성
function getUserFriendlyMessage(error: Error): string {
  const type = getErrorType(error);
  return getDefaultUserMessage(type);
}

// 기본 사용자 메시지
function getDefaultUserMessage(type: ErrorType): string {
  switch (type) {
    case 'network':
      return '연결에 문제가 발생했습니다.';
    case 'authentication':
      return '로그인이 필요합니다.';
    case 'authorization':
      return '접근 권한이 없습니다.';
    case 'validation':
      return '입력한 정보를 확인해주세요.';
    case 'not_found':
      return '요청한 내용을 찾을 수 없습니다.';
    case 'server':
      return '서버에 문제가 발생했습니다.';
    default:
      return '예상치 못한 오류가 발생했습니다.';
  }
}

// 재시도 가능한 오류인지 확인
function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // 네트워크 오류나 일시적 서버 오류만 재시도
  return message.includes('network') ||
         message.includes('timeout') ||
         message.includes('500') ||
         message.includes('502') ||
         message.includes('503') ||
         message.includes('504');
}

// 에러 리포팅 (프로덕션용)
function reportError(errorDetails: ErrorDetails) {
  // 실제 구현에서는 Sentry, LogRocket 등의 서비스 사용
  console.error('Error reported:', errorDetails);

  // 예시: Sentry 사용
  // Sentry.captureException(errorDetails.originalError || new Error(errorDetails.message), {
  //   tags: { errorType: errorDetails.type },
  //   extra: errorDetails.context
  // });
}

export default useErrorHandler;