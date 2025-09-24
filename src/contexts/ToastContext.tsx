/**
 * ToastContext.tsx
 *
 * 전역 토스트 알림 관리 Context
 * 앱 전체에서 일관된 토스트 메시지를 제공
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import Toast, { type ToastType } from '../components/ui/Toast';
import { useContextRegistration } from '../hooks/useContextRegistration';
import { CONTEXT_METADATA } from '../utils/contextMetadata';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, type: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
  // 편의 메서드들
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  // 개발자용 디버깅 토스트
  showDebug: (message: string, details?: any, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastItem = {
      id,
      message,
      type,
      duration
    };

    setToasts(prev => [...prev, newToast]);

    // 중복 토스트 방지 (같은 메시지가 이미 있으면 새로 추가하지 않음)
    setToasts(prev => {
      const existing = prev.find(toast => toast.message === message && toast.type === type);
      if (existing) {
        return prev;
      }
      return [...prev, newToast];
    });

    console.log(`📢 Toast: [${type.toUpperCase()}] ${message}`);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // 편의 메서드들
  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast(message, 'error', duration || 5000); // 에러는 더 오래 표시
  }, [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  // 개발자용 디버깅 토스트 (개발 환경에서만 표시)
  const showDebug = useCallback((message: string, details?: any, duration?: number) => {
    if (process.env.NODE_ENV === 'development') {
      const debugMessage = details
        ? `🛠️ ${message}\n${JSON.stringify(details, null, 2)}`
        : `🛠️ ${message}`;

      showToast(debugMessage, 'info', duration || 4000);
      console.log(`🛠️ Debug Toast: ${message}`, details);
    }
  }, [showToast]);

  const contextValue: ToastContextType = {
    toasts,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showDebug
  };

  // GlobalContextManager에 자동 등록
  const { isRegistered, status } = useContextRegistration({
    name: 'toast',
    context: contextValue,
    metadata: CONTEXT_METADATA.toast,
    dependencies: [],
    autoRegister: true,
    onReady: () => {
      console.log('✅ ToastContext registered with GlobalContextManager');
    },
    onError: (error) => {
      console.error('❌ Failed to register ToastContext:', error);
    }
  });

  // 등록 상태 디버그 (개발 환경)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('ToastContext registration status:', {
        isRegistered,
        status: status.status,
        errorCount: status.errorCount
      });
    }
  }, [isRegistered, status]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* 토스트 렌더링 영역 */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{
              transform: `translateY(${index * 10}px)`,
              zIndex: 1000 - index
            }}
          >
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => hideToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}

export default ToastContext;