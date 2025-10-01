/**
 * 사용자 액션 실시간 피드백 컴포넌트
 * 사용자가 액션을 취했을 때 즉시 시각적 피드백 제공
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, Plus, FileText, Target, TrendingUp } from 'lucide-react';
import { useRealtimeUpdates } from '../../hooks/useRealtimeUpdates';
import type { UpdateEventType, UpdateEvent } from '../../hooks/useRealtimeUpdates';

interface FeedbackItem {
  id: string;
  type: UpdateEventType;
  message: string;
  icon: React.ReactNode;
  color: string;
  timestamp: number;
}

interface ActionFeedbackProps {
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  duration?: number; // 피드백 표시 시간 (ms)
  maxItems?: number; // 최대 표시 항목 수
}

export const ActionFeedback: React.FC<ActionFeedbackProps> = ({
  position = 'top-right',
  duration = 3000,
  maxItems = 3
}) => {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);

  // 이벤트 타입별 메시지 및 스타일 정의
  const getFeedbackConfig = (type: UpdateEventType, data?: any) => {
    switch (type) {
      case 'kpi-update':
        return {
          message: `KPI 진단 답변 완료! (+${Math.floor(Math.random() * 5) + 1}점)`,
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'bg-green-500'
        };
      case 'task-complete':
        return {
          message: `작업 완료! (+${Math.floor(Math.random() * 3) + 2}점)`,
          icon: <Plus className="w-4 h-4" />,
          color: 'bg-blue-500'
        };
      case 'document-access':
        const action = data?.action === 'download' ? '다운로드' : '조회';
        return {
          message: `문서 ${action} 완료! (+${Math.floor(Math.random() * 2) + 1}점)`,
          icon: <FileText className="w-4 h-4" />,
          color: 'bg-purple-500'
        };
      case 'goal-progress':
        return {
          message: '🎉 목표 달성! 축하합니다!',
          icon: <Target className="w-4 h-4" />,
          color: 'bg-yellow-500'
        };
      case 'momentum-change':
        return {
          message: '모멘텀 점수 업데이트됨',
          icon: <TrendingUp className="w-4 h-4" />,
          color: 'bg-indigo-500'
        };
      default:
        return {
          message: '활동이 기록되었습니다',
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'bg-gray-500'
        };
    }
  };

  // 위치별 CSS 클래스
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  // 실시간 이벤트 처리
  const handleRealtimeUpdate = (event: UpdateEvent) => {
    // momentum-change 이벤트는 너무 빈번하므로 제외
    if (event.type === 'momentum-change') return;

    const config = getFeedbackConfig(event.type, event.data);
    const newItem: FeedbackItem = {
      id: `${event.type}-${event.timestamp}`,
      type: event.type,
      message: config.message,
      icon: config.icon,
      color: config.color,
      timestamp: event.timestamp
    };

    setFeedbackItems(prev => {
      const updated = [newItem, ...prev].slice(0, maxItems);
      return updated;
    });

    // 일정 시간 후 제거
    setTimeout(() => {
      setFeedbackItems(prev => prev.filter(item => item.id !== newItem.id));
    }, duration);
  };

  // 실시간 업데이트 리스닝
  useRealtimeUpdates(
    ['kpi-update', 'task-complete', 'document-access', 'goal-progress'],
    handleRealtimeUpdate,
    []
  );

  if (feedbackItems.length === 0) return null;

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-2`}>
      {feedbackItems.map((item, index) => (
        <div
          key={item.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
            bg-white border-l-4 border-l-current text-white
            transform transition-all duration-300 ease-out
            animate-in slide-in-from-right-5
            ${item.color}
          `}
          style={{
            animationDelay: `${index * 100}ms`,
            opacity: 1 - (index * 0.2)
          }}
        >
          <div className="flex-shrink-0">
            {item.icon}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              {item.message}
            </p>
            <p className="text-xs text-white/80">
              {new Date(item.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActionFeedback;