/**
 * Gamification Types for Project MOMENTUM Phase 3-D
 *
 * 게임화 요소를 위한 타입 정의
 */

// 레벨 시스템
export interface UserLevel {
  level: number;
  title: string;
  currentXP: number;
  requiredXP: number;
  totalXP: number;

  // 레벨별 혜택
  perks: {
    momentumBoost?: number; // 모멘텀 보너스 %
    achievementBoost?: number; // 성취 포인트 보너스 %
    unlockFeatures?: string[]; // 해제된 기능
    specialBadge?: string; // 특별 배지
  };

  // 진행도
  progressPercentage: number;
  xpToNextLevel: number;

  // 통계
  levelUpDate?: Date;
  daysAtCurrentLevel: number;
}

// 경험치 소스
export interface XPSource {
  id: string;
  source: 'achievement' | 'daily_login' | 'momentum_high' | 'task_complete' |
          'milestone' | 'challenge' | 'special_event';
  amount: number;
  multiplier?: number;
  timestamp: Date;
  description: string;
}

// 레벨 정의
export interface LevelDefinition {
  level: number;
  title: string;
  requiredXP: number;
  color: string;
  icon: string;
  perks: UserLevel['perks'];
}

// 시즌 시스템
export interface Season {
  id: string;
  name: string;
  theme: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'ended';

  // 시즌 목표
  goals: SeasonGoal[];

  // 시즌 리워드
  rewards: SeasonReward[];

  // 시즌 패스
  pass: {
    free: SeasonPassTier[];
    premium?: SeasonPassTier[];
  };

  // 시즌 테마 스타일
  style: {
    primaryColor: string;
    secondaryColor: string;
    backgroundImage?: string;
    icon: string;
  };
}

// 시즌 목표
export interface SeasonGoal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  reward: {
    xp?: number;
    badge?: string;
    title?: string;
  };
}

// 시즌 리워드
export interface SeasonReward {
  tier: number;
  type: 'badge' | 'title' | 'theme' | 'feature' | 'boost';
  item: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  claimed: boolean;
}

// 시즌 패스 티어
export interface SeasonPassTier {
  tier: number;
  requiredPoints: number;
  rewards: {
    free?: any;
    premium?: any;
  };
}

// 리더보드
export interface Leaderboard {
  id: string;
  type: 'weekly' | 'monthly' | 'all_time' | 'season';
  metric: 'momentum' | 'xp' | 'achievements' | 'streak';

  entries: LeaderboardEntry[];

  // 사용자 순위
  userRank?: {
    rank: number;
    percentile: number;
    change: number; // 이전 대비 변화
  };

  lastUpdated: Date;
  nextReset?: Date;
}

// 리더보드 엔트리
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  level: number;

  // 익명화 옵션
  isAnonymous?: boolean;
  displayName?: string;

  // 변화
  previousRank?: number;
  trend: 'up' | 'down' | 'stable' | 'new';

  // 추가 정보
  badges?: string[];
  title?: string;
}

// 도전 과제
export interface Challenge {
  id: string;
  type: 'daily' | 'weekly' | 'special' | 'community';

  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';

  // 조건
  requirements: {
    type: string;
    target: number;
    current: number;
  }[];

  // 보상
  rewards: {
    xp: number;
    badges?: string[];
    items?: any[];
  };

  // 시간 제한
  startTime?: Date;
  endTime?: Date;
  timeRemaining?: number; // 초 단위

  // 참여 상태
  status: 'available' | 'in_progress' | 'completed' | 'expired' | 'locked';
  completedAt?: Date;

  // 커뮤니티 도전인 경우
  community?: {
    participants: number;
    completionRate: number;
    totalProgress: number;
  };
}

// 특별 보상
export interface SpecialReward {
  id: string;
  name: string;
  description: string;
  type: 'virtual' | 'real' | 'discount' | 'feature' | 'recognition';

  // 가상 보상
  virtual?: {
    badge?: string;
    title?: string;
    theme?: string;
    boost?: { type: string; amount: number; duration: number };
  };

  // 실제 보상
  real?: {
    item: string;
    value: number;
    deliveryMethod: string;
  };

  // 할인/쿠폰
  discount?: {
    code: string;
    percentage: number;
    applicableFor: string;
    validUntil: Date;
  };

  // 획득 조건
  criteria: {
    minLevel?: number;
    achievement?: string;
    seasonRank?: number;
    specialEvent?: string;
  };

  // 상태
  available: boolean;
  claimed: boolean;
  claimedAt?: Date;
  expiresAt?: Date;
}

// 게임화 통계
export interface GamificationStats {
  // 레벨 통계
  level: UserLevel;

  // XP 통계
  xp: {
    total: number;
    thisWeek: number;
    thisMonth: number;
    dailyAverage: number;
    sources: { [key: string]: number };
  };

  // 순위
  rankings: {
    global?: number;
    regional?: number;
    friends?: number;
  };

  // 도전 통계
  challenges: {
    completed: number;
    inProgress: number;
    completionRate: number;
  };

  // 시즌 통계
  season?: {
    tier: number;
    points: number;
    rank: number;
    daysRemaining: number;
  };

  // 보상 통계
  rewards: {
    totalClaimed: number;
    virtualRewards: number;
    realRewards: number;
    totalValue: number;
  };
}

// 게임화 이벤트
export interface GamificationEvent {
  id: string;
  type: 'level_up' | 'achievement_unlock' | 'challenge_complete' |
        'season_end' | 'reward_claim' | 'rank_up';
  timestamp: Date;

  data: {
    before?: any;
    after?: any;
    reward?: any;
    message?: string;
  };

  // 축하 효과
  celebration?: {
    type: string;
    duration: number;
    intensity: string;
  };
}