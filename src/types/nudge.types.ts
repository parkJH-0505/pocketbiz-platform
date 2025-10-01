/**
 * Gentle Nudges System Types
 *
 * 사용자에게 부드러운 행동 유도를 제공하는 시스템
 */

export type NudgeType =
  | 'encouragement'  // 격려
  | 'reminder'       // 리마인더
  | 'suggestion'     // 제안
  | 'milestone'      // 마일스톤 알림
  | 'habit'          // 습관 형성
  | 'break';         // 휴식 권유

export type NudgeTiming =
  | 'immediate'      // 즉시
  | 'delayed'        // 지연 (5-10분 후)
  | 'scheduled'      // 예약된 시간
  | 'conditional';   // 조건부

export type NudgeTrigger =
  | 'low_momentum'      // 낮은 모멘텀
  | 'high_stress'       // 높은 스트레스
  | 'streak_break'      // 연속 기록 깨짐
  | 'milestone_near'    // 마일스톤 근접
  | 'inactivity'        // 비활성
  | 'high_performance'  // 고성능
  | 'work_hours'        // 작업 시간
  | 'time_based';       // 시간 기반

export interface NudgeMessage {
  id: string;
  type: NudgeType;
  title: string;
  message: string;

  // 행동 유도
  actionText?: string;
  actionUrl?: string;
  actionCallback?: () => void;

  // 표시 설정
  icon?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  priority: 'low' | 'medium' | 'high';

  // 메타데이터
  trigger: NudgeTrigger;
  timing: NudgeTiming;
  expiresAt?: Date;
  maxShowCount?: number;
  cooldownMinutes?: number; // 재표시 쿨다운
}

export interface NudgeConditions {
  momentum?: { min?: number; max?: number };
  stress?: { min?: number; max?: number };
  energy?: { min?: number; max?: number };
  timeOfDay?: ('morning' | 'afternoon' | 'evening' | 'night')[];
  dayOfWeek?: number[]; // 0=Sunday, 6=Saturday
  streakDays?: { min?: number; max?: number };
  lastActivity?: number; // 마지막 활동 후 경과 시간 (분)
}

export interface ActiveNudge {
  message: NudgeMessage;
  triggeredAt: Date;
  showCount: number;
  lastShownAt?: Date;
}

export interface NudgeHistory {
  messageId: string;
  shownAt: Date;
  dismissed?: boolean;
  actionTaken?: boolean;
}

// 넛지 시스템 설정
export interface NudgeSettings {
  enabled: boolean;
  frequency: 'low' | 'medium' | 'high'; // 빈도 설정
  quietHours?: { start: string; end: string }; // 조용한 시간
  enabledTypes: NudgeType[]; // 활성화된 넛지 타입
}