/**
 * CelebrationContext
 *
 * MicroCelebration을 전역에서 관리하는 Context
 * - 어디서든 축하 트리거 가능
 * - 큐 시스템으로 순차 표시
 * - Toast 시스템과 통합
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import MicroCelebration from '../components/celebration/MicroCelebration';
import { CelebrationConfig, CelebrationLevel, CelebrationReason } from '../services/celebrationTrigger';

interface CelebrationContextValue {
  celebrate: (config: CelebrationConfig) => void;
  celebrateSimple: (title: string, message: string, level?: CelebrationLevel) => void;
  celebrateKPI: (oldScore: number, newScore: number) => void;
  celebrateStreak: (days: number) => void;
  celebrateProjectMilestone: (projectName: string, progress: number) => void;
  celebrateMomentum: (score: number) => void;
}

const CelebrationContext = createContext<CelebrationContextValue | undefined>(undefined);

export const useCelebration = (): CelebrationContextValue => {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error('useCelebration must be used within a CelebrationProvider');
  }
  return context;
};

interface CelebrationProviderProps {
  children: ReactNode;
}

export const CelebrationProvider: React.FC<CelebrationProviderProps> = ({ children }) => {
  const [celebrationQueue, setCelebrationQueue] = useState<CelebrationConfig[]>([]);
  const [currentCelebration, setCurrentCelebration] = useState<CelebrationConfig | null>(null);

  // 기본 축하 트리거
  const celebrate = useCallback((config: CelebrationConfig) => {
    setCelebrationQueue(prev => [...prev, config]);
  }, []);

  // 간단한 축하 (제목, 메시지만)
  const celebrateSimple = useCallback((
    title: string,
    message: string,
    level: CelebrationLevel = 'micro'
  ) => {
    celebrate({
      level,
      reason: 'first_action' as CelebrationReason,
      title,
      message
    });
  }, [celebrate]);

  // KPI 상승 축하
  const celebrateKPI = useCallback((oldScore: number, newScore: number) => {
    const increase = newScore - oldScore;

    if (increase <= 0) return;

    let level: CelebrationLevel = 'micro';
    let emoji = '📈';

    if (increase >= 20) {
      level = 'large';
      emoji = '🚀';
    } else if (increase >= 10) {
      level = 'medium';
      emoji = '⚡';
    } else if (increase >= 5) {
      level = 'small';
      emoji = '✨';
    }

    celebrate({
      level,
      reason: 'kpi_increase',
      title: `KPI ${Math.round(increase)}점 상승!`,
      message: `${Math.round(oldScore)}점 → ${Math.round(newScore)}점으로 성장했어요!`,
      emoji,
      metadata: { oldScore, newScore, increase }
    });
  }, [celebrate]);

  // 연속 접속 축하
  const celebrateStreak = useCallback((days: number) => {
    const milestones = [3, 7, 14, 30, 50, 100, 365];
    if (!milestones.includes(days)) return;

    let level: CelebrationLevel = 'small';
    let emoji = '🔥';
    let title = `${days}일 연속 접속!`;
    let message = '꾸준함이 성공의 비결이에요!';

    if (days >= 100) {
      level = 'epic';
      emoji = '💎';
      title = `놀라워요! ${days}일 연속!`;
      message = '진정한 Growth Champion이시네요!';
    } else if (days >= 30) {
      level = 'large';
      emoji = '🏆';
      title = `${days}일 연속 달성!`;
      message = '한 달 동안 꾸준히 성장하셨네요!';
    } else if (days >= 7) {
      level = 'medium';
      emoji = '⭐';
      message = '일주일 동안 멋진 습관을 만들어가고 있어요!';
    }

    celebrate({
      level,
      reason: 'streak_achievement',
      title,
      message,
      emoji,
      metadata: { days }
    });
  }, [celebrate]);

  // 프로젝트 마일스톤 축하
  const celebrateProjectMilestone = useCallback((projectName: string, progress: number) => {
    const milestones = [25, 50, 75, 100];
    if (!milestones.includes(progress)) return;

    let level: CelebrationLevel = 'small';
    let emoji = '🎯';
    let title = `${progress}% 달성!`;
    let message = `${projectName} 프로젝트가 순조롭게 진행 중이에요`;

    if (progress === 100) {
      level = 'large';
      emoji = '🎉';
      title = '프로젝트 완료!';
      message = `${projectName} 프로젝트를 성공적으로 마무리했어요!`;
    } else if (progress === 75) {
      level = 'medium';
      emoji = '🚀';
      message = '마지막 스퍼트! 거의 다 왔어요!';
    } else if (progress === 50) {
      level = 'small';
      emoji = '⚡';
      message = '절반을 달성했어요! 계속 화이팅!';
    }

    celebrate({
      level,
      reason: 'project_milestone',
      title,
      message,
      emoji,
      metadata: { projectName, progress }
    });
  }, [celebrate]);

  // 모멘텀 높음 축하
  const celebrateMomentum = useCallback((score: number) => {
    if (score < 80) return;

    let level: CelebrationLevel = 'medium';
    let emoji = '🔥';
    let title = '모멘텀 최고조!';
    let message = `현재 모멘텀 ${score}점! 기세가 대단해요!`;

    if (score >= 95) {
      level = 'large';
      emoji = '🌟';
      title = '역대급 모멘텀!';
      message = '지금이 바로 도약의 순간이에요!';
    } else if (score >= 90) {
      emoji = '⚡';
      title = '놀라운 성장 속도!';
    }

    celebrate({
      level,
      reason: 'momentum_high',
      title,
      message,
      emoji,
      metadata: { score }
    });
  }, [celebrate]);

  // 큐 처리
  React.useEffect(() => {
    if (celebrationQueue.length > 0 && !currentCelebration) {
      const [next, ...rest] = celebrationQueue;
      setCurrentCelebration(next);
      setCelebrationQueue(rest);
    }
  }, [celebrationQueue, currentCelebration]);

  const handleCelebrationComplete = useCallback(() => {
    setCurrentCelebration(null);
  }, []);

  return (
    <CelebrationContext.Provider
      value={{
        celebrate,
        celebrateSimple,
        celebrateKPI,
        celebrateStreak,
        celebrateProjectMilestone,
        celebrateMomentum
      }}
    >
      {children}
      {currentCelebration && (
        <MicroCelebration
          config={currentCelebration}
          onComplete={handleCelebrationComplete}
        />
      )}
    </CelebrationContext.Provider>
  );
};