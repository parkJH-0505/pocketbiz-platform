/**
 * GentleNudgeCard Component
 *
 * 개별 넛지 메시지를 표시하는 카드 컴포넌트
 * - 부드러운 애니메이션
 * - 액션 버튼
 * - 자동 해제 타이머
 */

import React, { useState, useEffect } from 'react';
import type { NudgeMessage } from '../../types/nudge.types';
import { gentleNudgeEngine } from '../../services/gentleNudgeEngine';

interface GentleNudgeCardProps {
  message: NudgeMessage;
  onDismiss: (messageId: string, actionTaken?: boolean) => void;
  autoHideDuration?: number; // 자동 숨김 시간 (ms)
}

const GentleNudgeCard: React.FC<GentleNudgeCardProps> = ({
  message,
  onDismiss,
  autoHideDuration
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  // 색상 테마
  const colorThemes = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-500',
      title: 'text-blue-800',
      text: 'text-blue-700',
      button: 'bg-blue-500 hover:bg-blue-600 text-white',
      dismiss: 'text-blue-400 hover:text-blue-600'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-500',
      title: 'text-green-800',
      text: 'text-green-700',
      button: 'bg-green-500 hover:bg-green-600 text-white',
      dismiss: 'text-green-400 hover:text-green-600'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-500',
      title: 'text-yellow-800',
      text: 'text-yellow-700',
      button: 'bg-yellow-500 hover:bg-yellow-600 text-white',
      dismiss: 'text-yellow-400 hover:text-yellow-600'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-500',
      title: 'text-red-800',
      text: 'text-red-700',
      button: 'bg-red-500 hover:bg-red-600 text-white',
      dismiss: 'text-red-400 hover:text-red-600'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'text-purple-500',
      title: 'text-purple-800',
      text: 'text-purple-700',
      button: 'bg-purple-500 hover:bg-purple-600 text-white',
      dismiss: 'text-purple-400 hover:text-purple-600'
    },
    gray: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      icon: 'text-gray-500',
      title: 'text-gray-800',
      text: 'text-gray-700',
      button: 'bg-gray-500 hover:bg-gray-600 text-white',
      dismiss: 'text-gray-400 hover:text-gray-600'
    }
  };

  const theme = colorThemes[message.color || 'blue'];

  // 자동 숨김 타이머
  useEffect(() => {
    if (autoHideDuration && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        handleDismiss(false);
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [autoHideDuration]);

  // 해제 처리
  const handleDismiss = (actionTaken: boolean = false) => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss(message.id, actionTaken);
      gentleNudgeEngine.dismissMessage(message.id, actionTaken);
    }, 300); // 애니메이션 시간
  };

  // 액션 처리
  const handleAction = () => {
    if (message.actionCallback) {
      message.actionCallback();
    } else if (message.actionUrl) {
      window.location.href = message.actionUrl;
    }
    handleDismiss(true);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        ${theme.bg} ${theme.border}
        border rounded-lg p-4 shadow-sm
        transform transition-all duration-300 ease-out
        ${isExiting ? 'opacity-0 scale-95 translate-y-2' : 'opacity-100 scale-100 translate-y-0'}
        hover:shadow-md
      `}
    >
      <div className="flex items-start gap-3">
        {/* 아이콘 */}
        {message.icon && (
          <div className={`flex-shrink-0 ${theme.icon} text-xl`}>
            {message.icon}
          </div>
        )}

        {/* 콘텐츠 */}
        <div className="flex-1 min-w-0">
          {/* 제목 */}
          <h4 className={`font-medium ${theme.title} mb-1`}>
            {message.title}
          </h4>

          {/* 메시지 */}
          <p className={`text-sm ${theme.text} mb-3`}>
            {message.message}
          </p>

          {/* 액션 버튼 */}
          {message.actionText && (
            <div className="flex gap-2">
              <button
                onClick={handleAction}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-md
                  ${theme.button}
                  transition-colors duration-200
                `}
              >
                {message.actionText}
              </button>
            </div>
          )}
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={() => handleDismiss(false)}
          className={`
            flex-shrink-0 w-6 h-6 flex items-center justify-center
            ${theme.dismiss}
            hover:bg-black/5 rounded-full
            transition-colors duration-200
          `}
          title="닫기"
        >
          ×
        </button>
      </div>

      {/* 우선순위 표시 (high priority만) */}
      {message.priority === 'high' && (
        <div className="mt-2 flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500">중요</span>
        </div>
      )}
    </div>
  );
};

export default GentleNudgeCard;