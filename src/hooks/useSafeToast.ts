/**
 * useSafeToast.ts
 *
 * ToastContext가 없는 경우에도 안전하게 사용할 수 있는 토스트 훅
 * ToastContext가 있으면 사용하고, 없으면 fallback 사용
 */

import { useContext } from 'react';
import ToastContext from '../contexts/ToastContext';
import { toastFallback } from '../utils/toastFallback';

interface SafeToastReturn {
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showDebug: (message: string, details?: any, duration?: number) => void;
  isUsingFallback: boolean;
}

/**
 * ToastContext 또는 fallback을 안전하게 반환하는 훅
 */
export function useSafeToast(): SafeToastReturn {
  // ToastContext 시도 (에러 던지지 않음)
  const context = useContext(ToastContext);

  // Context가 있으면 사용
  if (context) {
    return {
      showSuccess: context.showSuccess,
      showError: context.showError,
      showWarning: context.showWarning,
      showInfo: context.showInfo,
      showDebug: context.showDebug,
      isUsingFallback: false
    };
  }

  // Context가 없으면 fallback 사용
  console.warn('ToastContext not available, using fallback');
  return {
    ...toastFallback,
    isUsingFallback: true
  };
}