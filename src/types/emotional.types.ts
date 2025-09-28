/**
 * EmotionalState Types
 *
 * 사용자의 감정 상태를 추론하고 관리하기 위한 타입 정의
 */

export type MoodType =
  | 'confident'    // 자신감 있는 상태 (높은 모멘텀, 목표 달성)
  | 'anxious'      // 불안한 상태 (낮은 모멘텀, 정체)
  | 'focused'      // 집중 상태 (일정한 진행)
  | 'excited'      // 흥분 상태 (큰 성취, 마일스톤)
  | 'overwhelmed'  // 압도된 상태 (너무 많은 일정)
  | 'calm'         // 차분한 상태 (안정적 진행)
  | 'motivated';   // 동기부여된 상태 (상승 트렌드)

export interface EmotionalFactors {
  momentum: number;          // 현재 모멘텀 점수 (0-100)
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  recentActivity: string;   // 최근 활동 설명
  workload: 'light' | 'moderate' | 'heavy';
  streakDays: number;       // 연속 접속일
  recentAchievement?: string; // 최근 성취
}

export interface EmotionalState {
  mood: MoodType;
  energy: number;        // 에너지 레벨 (0-100)
  confidence: number;    // 자신감 수준 (0-100)
  motivation: number;    // 동기 수준 (0-100)
  stress: number;        // 스트레스 레벨 (0-100)
  factors: EmotionalFactors;
  timestamp: Date;
  insights: string[];    // 감정 기반 인사이트
}

export interface EmotionalTrend {
  current: EmotionalState;
  previous: EmotionalState | null;
  direction: 'improving' | 'declining' | 'stable';
  suggestions: string[];  // 감정 개선 제안
}

export interface EmotionalHistory {
  states: EmotionalState[];
  averages: {
    energy: number;
    confidence: number;
    motivation: number;
    stress: number;
  };
  patterns: {
    bestTimeOfDay: string;
    commonMood: MoodType;
    stressTriggers: string[];
  };
}

// 무드별 설정 (색상, 아이콘, 메시지 톤)
export interface MoodConfig {
  mood: MoodType;
  color: string;
  bgColor: string;
  emoji: string;
  messageTone: 'encouraging' | 'supportive' | 'celebratory' | 'calming' | 'energizing';
  musicRecommendation?: string;  // 선택적: 분위기에 맞는 음악
}

export const MOOD_CONFIGS: Record<MoodType, MoodConfig> = {
  confident: {
    mood: 'confident',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    emoji: '💪',
    messageTone: 'celebratory'
  },
  anxious: {
    mood: 'anxious',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    emoji: '😰',
    messageTone: 'calming'
  },
  focused: {
    mood: 'focused',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    emoji: '🎯',
    messageTone: 'encouraging'
  },
  excited: {
    mood: 'excited',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    emoji: '🎉',
    messageTone: 'celebratory'
  },
  overwhelmed: {
    mood: 'overwhelmed',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    emoji: '😵',
    messageTone: 'supportive'
  },
  calm: {
    mood: 'calm',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    emoji: '😌',
    messageTone: 'calming'
  },
  motivated: {
    mood: 'motivated',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    emoji: '🚀',
    messageTone: 'energizing'
  }
};

// 감정 상태 임계값
export const EMOTIONAL_THRESHOLDS = {
  energy: {
    high: 70,
    medium: 40,
    low: 20
  },
  confidence: {
    high: 75,
    medium: 50,
    low: 25
  },
  motivation: {
    high: 70,
    medium: 45,
    low: 20
  },
  stress: {
    high: 70,
    medium: 40,
    low: 20
  }
};