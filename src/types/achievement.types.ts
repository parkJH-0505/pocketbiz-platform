/**
 * Achievement Badge System Types
 *
 * 사용자 성취를 추적하고 보상하는 배지 시스템
 */

export type AchievementCategory =
  | 'momentum'    // 모멘텀 관련
  | 'consistency' // 일관성 관련
  | 'growth'      // 성장 관련
  | 'milestone'   // 마일스톤 관련
  | 'special';    // 특별 이벤트

export type AchievementRarity =
  | 'common'      // 흔한 (회색)
  | 'uncommon'    // 일반적이지 않은 (초록)
  | 'rare'        // 희귀한 (파랑)
  | 'epic'        // 서사적 (보라)
  | 'legendary';  // 전설적 (금색)

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;

  // 획득 조건
  requirement: {
    type: 'momentum_score' | 'login_streak' | 'kpi_growth' | 'project_completion' | 'custom';
    target: number;
    condition?: string; // 추가 조건
  };

  // 보상
  reward?: {
    title?: string;
    points?: number;
    celebration?: 'micro' | 'small' | 'medium' | 'large' | 'epic';
  };

  // 메타데이터
  unlockedAt?: Date;
  isSecret?: boolean; // 숨겨진 성취
  order: number; // 정렬 순서
}

export interface UserAchievements {
  unlockedIds: string[];
  totalPoints: number;
  lastUnlocked?: Achievement;
  progress: Record<string, number>; // 진행도 추적
}

export interface AchievementProgress {
  achievement: Achievement;
  current: number;
  target: number;
  percentage: number;
  isUnlocked: boolean;
}

// 성취 시스템 이벤트
export interface AchievementUnlockEvent {
  achievement: Achievement;
  isFirstTime: boolean;
  timestamp: Date;
}