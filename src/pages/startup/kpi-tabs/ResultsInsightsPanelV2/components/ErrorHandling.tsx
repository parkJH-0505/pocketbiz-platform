/**
 * Enhanced Error Handling Components for V2 Dashboard
 * 개선된 에러 처리 및 사용자 피드백 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, RefreshCw, Wifi, WifiOff, Info, CheckCircle,
  XCircle, AlertCircle, X, RotateCcw, HelpCircle
} from 'lucide-react';

// 에러 타입 정의
export type ErrorType = 'network' | 'data' | 'permission' | 'validation' | 'unknown';
export type ToastType = 'success' | 'error' | 'warning' | 'info';

// 에러 정보 인터페이스
interface ErrorInfo {
  type: ErrorType;
  message: string;
  details?: string;
  action?: () => void;
  actionLabel?: string;
  recoverable?: boolean;
}

// 토스트 알림 인터페이스
interface ToastNotification {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// 에러 경계 컴포넌트
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

export class EnhancedErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; retry: () => void }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ errorInfo });
    console.error('V2 Dashboard Error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      return FallbackComponent ? (
        <FallbackComponent error={this.state.error!} retry={this.retry} />
      ) : (
        <ErrorFallback error={this.state.error!} retry={this.retry} />
      );
    }

    return this.props.children;
  }
}

// 기본 에러 폴백 컴포넌트
export const ErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="flex items-center justify-center min-h-96 p-8">
      <div className="bg-white rounded-xl shadow-lg border border-accent-red/20 max-w-md w-full">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-accent-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-accent-red" />
          </div>

          <h3 className="text-lg font-semibold text-neutral-dark mb-2">
            문제가 발생했습니다
          </h3>
          <p className="text-neutral-gray mb-4">
            데이터를 불러오는 중에 오류가 발생했습니다.
          </p>

          <div className="space-y-3">
            <button
              onClick={retry}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </button>

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-neutral-gray hover:text-neutral-dark transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              {showDetails ? '세부사항 숨기기' : '세부사항 보기'}
            </button>
          </div>

          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-3 bg-neutral-light rounded-lg text-left"
            >
              <div className="text-xs font-mono text-neutral-gray">
                <div className="font-semibold mb-1">오류:</div>
                <div className="break-all">{error.message}</div>
                {error.stack && (
                  <>
                    <div className="font-semibold mt-2 mb-1">스택:</div>
                    <div className="whitespace-pre-wrap text-xs">
                      {error.stack.substring(0, 300)}...
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

// 네트워크 상태 에러 컴포넌트
export const NetworkError: React.FC<{ onRetry: () => void; isOnline: boolean }> = ({ onRetry, isOnline }) => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="bg-white rounded-lg border border-neutral-border p-6 text-center max-w-sm">
        <div className="w-16 h-16 bg-neutral-light rounded-full flex items-center justify-center mx-auto mb-4">
          {isOnline ? (
            <Wifi className="w-8 h-8 text-neutral-gray" />
          ) : (
            <WifiOff className="w-8 h-8 text-accent-red" />
          )}
        </div>

        <h3 className="text-lg font-semibold text-neutral-dark mb-2">
          {isOnline ? '서버 연결 오류' : '인터넷 연결 없음'}
        </h3>
        <p className="text-neutral-gray text-sm mb-4">
          {isOnline
            ? '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'
            : '인터넷 연결을 확인하고 다시 시도해주세요.'}
        </p>

        <button
          onClick={onRetry}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors mx-auto"
        >
          <RotateCcw className="w-4 h-4" />
          다시 시도
        </button>
      </div>
    </div>
  );
};

// 토스트 알림 컴포넌트
export const Toast: React.FC<{
  notification: ToastNotification;
  onDismiss: (id: string) => void;
}> = ({ notification, onDismiss }) => {
  const { id, type, title, message, action, duration = 5000 } = notification;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onDismiss(id), duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-accent-green" />;
      case 'error': return <XCircle className="w-5 h-5 text-accent-red" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-accent-orange" />;
      case 'info': return <Info className="w-5 h-5 text-primary-main" />;
      default: return <Info className="w-5 h-5 text-neutral-gray" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success': return 'bg-accent-green/10 border-accent-green/20';
      case 'error': return 'bg-accent-red/10 border-accent-red/20';
      case 'warning': return 'bg-accent-orange/10 border-accent-orange/20';
      case 'info': return 'bg-primary-main/10 border-primary-main/20';
      default: return 'bg-neutral-light border-neutral-border';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`bg-white rounded-lg border shadow-lg p-4 max-w-md w-full ${getBgColor()}`}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          <div className="font-semibold text-neutral-dark text-sm">{title}</div>
          {message && (
            <div className="text-neutral-gray text-xs mt-1">{message}</div>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="text-primary-main text-xs font-medium hover:text-primary-dark mt-2 underline"
            >
              {action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => onDismiss(id)}
          className="text-neutral-gray hover:text-neutral-dark transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

// 토스트 컨테이너 컴포넌트
export const ToastContainer: React.FC<{
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
}> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <Toast
            key={notification.id}
            notification={notification}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// 데이터 없음 상태 컴포넌트
export const EmptyState: React.FC<{
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}> = ({ title, description, icon, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-neutral-light rounded-full flex items-center justify-center mb-4">
        {icon || <AlertCircle className="w-8 h-8 text-neutral-gray" />}
      </div>
      <h3 className="text-lg font-semibold text-neutral-dark mb-2">{title}</h3>
      <p className="text-neutral-gray text-sm mb-4 max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

// 훅: 온라인 상태 체크
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// 훅: 토스트 알림 관리
export const useToast = () => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const showToast = (
    type: ToastType,
    title: string,
    message?: string,
    options?: {
      duration?: number;
      action?: { label: string; onClick: () => void };
    }
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification: ToastNotification = {
      id,
      type,
      title,
      message,
      duration: options?.duration,
      action: options?.action,
    };

    setNotifications(prev => [...prev, notification]);
  };

  const dismissToast = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    showToast,
    dismissToast,
    clearAll,
    showSuccess: (title: string, message?: string, options?: any) => showToast('success', title, message, options),
    showError: (title: string, message?: string, options?: any) => showToast('error', title, message, options),
    showWarning: (title: string, message?: string, options?: any) => showToast('warning', title, message, options),
    showInfo: (title: string, message?: string, options?: any) => showToast('info', title, message, options),
  };
};