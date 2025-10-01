/**
 * NudgeManager Component
 *
 * 넛지 시스템의 메인 관리자 컴포넌트
 * - 활성 넛지 목록 관리
 * - 주기적 평가 및 업데이트
 * - 사용자 상황에 맞는 표시
 */

import React, { useState, useEffect, useCallback } from 'react';
import GentleNudgeCard from './GentleNudgeCard';
import { gentleNudgeEngine } from '../../services/gentleNudgeEngine';
import { useMomentum } from '../../hooks/useMomentum';
import { EmotionalStateEngine } from '../../services/emotionalStateEngine';
import type { NudgeMessage } from '../../types/nudge.types';
import type { EmotionalState } from '../../types/emotional.types';

interface NudgeManagerProps {
  className?: string;
  maxVisible?: number;
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left' | 'center';
  autoHideDuration?: number;
}

const NudgeManager: React.FC<NudgeManagerProps> = ({
  className = "",
  maxVisible = 2,
  position = 'top-right',
  autoHideDuration = 10000 // 10초
}) => {
  const [activeMessages, setActiveMessages] = useState<NudgeMessage[]>([]);
  const [emotionalState, setEmotionalState] = useState<EmotionalState | null>(null);
  const { momentum } = useMomentum();

  const emotionalEngine = new EmotionalStateEngine();

  // 위치별 CSS 클래스
  const positionClasses = {
    'top-right': 'fixed top-20 right-4 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'top-left': 'fixed top-20 left-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'center': 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50'
  };

  // 감정 상태 업데이트
  const updateEmotionalState = useCallback(async () => {
    try {
      const state = await emotionalEngine.inferEmotionalState(momentum);
      setEmotionalState(state);
    } catch (error) {
      console.error('Failed to update emotional state:', error);
    }
  }, [momentum]);

  // 넛지 평가 및 업데이트
  const evaluateNudges = useCallback(async () => {
    try {
      const newMessages = await gentleNudgeEngine.evaluateNudges(momentum, emotionalState);

      // 새로운 메시지만 추가 (중복 방지)
      const currentIds = new Set(activeMessages.map(m => m.id));
      const uniqueNewMessages = newMessages.filter(m => !currentIds.has(m.id));

      if (uniqueNewMessages.length > 0) {
        setActiveMessages(prev => {
          const combined = [...prev, ...uniqueNewMessages];

          // 최대 표시 개수 제한
          if (combined.length > maxVisible) {
            // 우선순위 기준으로 정렬하여 상위 항목만 유지
            return combined
              .sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
              })
              .slice(0, maxVisible);
          }

          return combined;
        });

        // 표시된 메시지들을 엔진에 기록
        uniqueNewMessages.forEach(msg => {
          gentleNudgeEngine.showMessage(msg.id);
        });
      }
    } catch (error) {
      console.error('Failed to evaluate nudges:', error);
    }
  }, [momentum, emotionalState, activeMessages, maxVisible]);

  // 메시지 해제 처리
  const handleDismissMessage = useCallback((messageId: string, actionTaken: boolean = false) => {
    setActiveMessages(prev => prev.filter(m => m.id !== messageId));
  }, []);

  // 주기적 업데이트
  useEffect(() => {
    updateEmotionalState();
  }, [updateEmotionalState]);

  useEffect(() => {
    evaluateNudges();
  }, [evaluateNudges]);

  // 정기적인 평가 (2분마다)
  useEffect(() => {
    const interval = setInterval(() => {
      updateEmotionalState();
      evaluateNudges();
    }, 2 * 60 * 1000); // 2분

    return () => clearInterval(interval);
  }, [updateEmotionalState, evaluateNudges]);

  // 마지막 활동 시간 업데이트 (사용자 활동 추적)
  useEffect(() => {
    const updateLastActivity = () => {
      localStorage.setItem('last-activity-time', new Date().toISOString());
    };

    // 마우스, 키보드, 스크롤 이벤트 감지
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    events.forEach(eventType => {
      document.addEventListener(eventType, updateLastActivity, { passive: true });
    });

    return () => {
      events.forEach(eventType => {
        document.removeEventListener(eventType, updateLastActivity);
      });
    };
  }, []);

  // 메시지가 없으면 렌더링하지 않음
  if (activeMessages.length === 0) return null;

  return (
    <div className={`${positionClasses[position]} ${className}`}>
      <div className="space-y-3 w-80 max-w-sm">
        {activeMessages.map((message) => (
          <GentleNudgeCard
            key={message.id}
            message={message}
            onDismiss={handleDismissMessage}
            autoHideDuration={message.priority === 'low' ? autoHideDuration : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export default NudgeManager;