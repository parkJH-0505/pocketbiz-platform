/**
 * Toast.tsx
 *
 * 간단한 토스트 알림 컴포넌트
 */

import React, { useEffect } from 'react';
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
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

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

  return (
    <div
      className={`
        fixed top-4 right-4 z-50
        flex items-center gap-3 p-4 pr-12 min-w-[300px] max-w-md
        ${backgrounds[type]} ${textColors[type]}
        border rounded-lg shadow-lg
        animate-slide-in-right
      `}
    >
      {icons[type]}
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/50 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
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

  .animate-slide-in-right {
    animation: slide-in-right 0.3s ease-out;
  }
`;