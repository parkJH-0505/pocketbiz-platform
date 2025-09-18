/**
 * Toast.tsx
 *
 * 개선된 토스트 알림 컴포넌트
 * - 더 나은 애니메이션
 * - 접근성 개선
 * - 다양한 상호작용 지원
 */

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({
  message,
  type,
  duration = 3000,
  onClose
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300); // 애니메이션 시간과 맞춤
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const backgrounds = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  };

  const textColors = {
    success: 'text-green-900',
    error: 'text-red-900',
    warning: 'text-yellow-900',
    info: 'text-blue-900'
  };

  if (!isVisible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        flex items-center gap-3 p-4 pr-12 min-w-[300px] max-w-md
        ${backgrounds[type]} ${textColors[type]}
        border rounded-lg shadow-lg backdrop-blur-sm
        transition-all duration-300 ease-out
        ${isExiting ? 'animate-slide-out-right opacity-0' : 'animate-slide-in-right opacity-100'}
        hover:shadow-xl hover:scale-[1.02]
        cursor-pointer
      `}
      onClick={handleClose}
    >
      {icons[type]}
      <p className="flex-1 text-sm font-medium leading-relaxed">{message}</p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
        aria-label="토스트 닫기"
      >
        <X className="w-4 h-4" />
      </button>

      {/* 진행 바 (선택적) */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-lg overflow-hidden">
          <div
            className="h-full bg-current transition-all ease-linear"
            style={{
              animation: `toast-progress ${duration}ms linear`,
              width: isExiting ? '0%' : '100%'
            }}
          />
        </div>
      )}
    </div>
  );
}

// 토스트 애니메이션을 위한 CSS (index.css에 추가)
export const toastStyles = `
  @keyframes slide-in-right {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slide-out-right {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  @keyframes toast-progress {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }

  .animate-slide-in-right {
    animation: slide-in-right 0.3s ease-out;
  }

  .animate-slide-out-right {
    animation: slide-out-right 0.3s ease-in;
  }
`;