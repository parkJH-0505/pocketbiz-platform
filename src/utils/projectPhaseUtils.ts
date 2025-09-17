import type { ProjectPhase } from '../types/buildup.types';
import type { PhaseTransitionRule, PhaseTransitionEvent, PhaseTransitionTrigger } from '../types/meeting.types';
import type { GuideMeetingRecord, MeetingType } from '../types/meeting.types';
import type { CalendarEvent } from '../types/calendar.types';

/**
 * 프로젝트 단계 관리 유틸리티
 * 7단계 진행 상태 시스템
 */

// 단계별 정보
export const PHASE_INFO: Record<ProjectPhase, {
  order: number;
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  contract_pending: {
    order: 1,
    label: '계약중',
    shortLabel: '계약',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: '견적서 전달 및 검토 중'
  },
  contract_signed: {
    order: 2,
    label: '계약완료',
    shortLabel: '입금',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: '입금 완료 및 프로젝트 준비'
  },
  planning: {
    order: 3,
    label: '기획',
    shortLabel: '기획',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: '프로젝트 기획 및 요구사항 정의'
  },
  design: {
    order: 4,
    label: '설계',
    shortLabel: '설계',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    description: '상세 설계 및 디자인 작업'
  },
  execution: {
    order: 5,
    label: '실행',
    shortLabel: '실행',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: '실제 구현 및 개발 진행'
  },
  review: {
    order: 6,
    label: '검토',
    shortLabel: '검토',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'QA 및 최종 검토'
  },
  completed: {
    order: 7,
    label: '완료',
    shortLabel: '완료',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: '프로젝트 종료'
  }
};

// 모든 단계 목록
export const ALL_PHASES: ProjectPhase[] = [
  'contract_pending',
  'contract_signed',
  'planning',
  'design',
  'execution',
  'review',
  'completed'
];

// 진행중 단계들 (PM이 관리하는 단계)
export const ACTIVE_PHASES: ProjectPhase[] = [
  'planning',
  'design',
  'execution',
  'review'
];

/**
 * 현재 단계를 기반으로 진행률 계산 (0-100)
 * 각 단계는 약 14.3%씩 차지 (100/7)
 */
export function calculatePhaseProgress(phase: ProjectPhase): number {
  const phaseInfo = PHASE_INFO[phase];
  if (!phaseInfo) return 0;

  // 각 단계당 14.3%, 완료 시 100%
  return Math.round((phaseInfo.order / 7) * 100);
}

/**
 * 단계 인덱스 가져오기 (0-6)
 */
export function getPhaseIndex(phase: ProjectPhase): number {
  return PHASE_INFO[phase].order - 1;
}

/**
 * 다음 단계 가져오기
 */
export function getNextPhase(currentPhase: ProjectPhase): ProjectPhase | null {
  const currentIndex = getPhaseIndex(currentPhase);
  if (currentIndex >= 6) return null;
  return ALL_PHASES[currentIndex + 1];
}

/**
 * 이전 단계 가져오기
 */
export function getPreviousPhase(currentPhase: ProjectPhase): ProjectPhase | null {
  const currentIndex = getPhaseIndex(currentPhase);
  if (currentIndex <= 0) return null;
  return ALL_PHASES[currentIndex - 1];
}

/**
 * 단계가 진행중인지 확인
 */
export function isActivePhase(phase: ProjectPhase): boolean {
  return ACTIVE_PHASES.includes(phase);
}

/**
 * 단계 변경 가능 여부 확인 (비즈니스 로직)
 */
export function canChangePhase(
  currentPhase: ProjectPhase,
  newPhase: ProjectPhase,
  isAdmin: boolean = false
): boolean {
  // 관리자는 모든 변경 가능
  if (isAdmin) return true;

  // 계약중 → 계약완료는 입금 확인 시스템이 자동 처리
  if (currentPhase === 'contract_pending' && newPhase === 'contract_signed') {
    return false; // PM이 수동으로 변경 불가
  }

  // 진행중 단계들 간에는 PM이 변경 가능
  if (isActivePhase(currentPhase) && isActivePhase(newPhase)) {
    return true;
  }

  // 계약완료 → 기획은 PM이 시작 가능
  if (currentPhase === 'contract_signed' && newPhase === 'planning') {
    return true;
  }

  // 검토 → 완료는 PM이 처리 가능
  if (currentPhase === 'review' && newPhase === 'completed') {
    return true;
  }

  return false;
}

/**
 * 단계별 예상 소요 시간 (일)
 */
export function getPhaseEstimatedDuration(phase: ProjectPhase, serviceCategory?: string): number {
  const baseDurations: Record<ProjectPhase, number> = {
    contract_pending: 3,   // 3일
    contract_signed: 1,    // 1일
    planning: 5,           // 5일
    design: 7,             // 7일
    execution: 14,         // 14일
    review: 3,             // 3일
    completed: 0           // 0일
  };

  // 서비스 카테고리별 조정 가능
  let duration = baseDurations[phase];

  if (serviceCategory === '개발' && phase === 'execution') {
    duration = 21; // 개발은 실행 단계가 더 김
  }

  return duration;
}

/**
 * 자동 단계 전환 체크 (서버에서 처리할 로직)
 */
export function checkAutoPhaseTransition(
  phase: ProjectPhase,
  paymentConfirmed?: boolean,
  quoteSent?: boolean
): ProjectPhase {
  // 견적서 전송 시 자동으로 계약중
  if (!phase && quoteSent) {
    return 'contract_pending';
  }

  // 입금 확인 시 자동으로 계약완료
  if (phase === 'contract_pending' && paymentConfirmed) {
    return 'contract_signed';
  }

  return phase;
}

/**
 * 기본 단계 전환 규칙 정의
 */
export const DEFAULT_PHASE_TRANSITION_RULES: PhaseTransitionRule[] = [
  {
    id: 'payment_to_contract_signed',
    fromPhase: 'contract_pending',
    toPhase: 'contract_signed',
    trigger: 'payment_completed',
    autoApply: true,
    description: '대금 지불 완료시 계약완료 단계로 자동 전환',
    priority: 1
  },
  {
    id: 'kickoff_to_planning',
    fromPhase: 'contract_signed',
    toPhase: 'planning',
    trigger: 'meeting_completed',
    meetingTypes: ['pm_meeting'],
    autoApply: true,
    description: '킥오프 미팅 완료 후 기획 단계로 전환',
    priority: 2
  },
  {
    id: 'planning_review_to_design',
    fromPhase: 'planning',
    toPhase: 'design',
    trigger: 'meeting_completed',
    meetingTypes: ['pm_meeting'],
    autoApply: false,
    description: '기획 검토 미팅 완료 후 설계 단계로 전환 (PM 승인 필요)',
    priority: 3
  },
  {
    id: 'design_review_to_execution',
    fromPhase: 'design',
    toPhase: 'execution',
    trigger: 'meeting_completed',
    meetingTypes: ['pm_meeting'],
    autoApply: false,
    description: '설계 검토 미팅 완료 후 실행 단계로 전환 (PM 승인 필요)',
    priority: 4
  },
  {
    id: 'execution_demo_to_review',
    fromPhase: 'execution',
    toPhase: 'review',
    trigger: 'meeting_completed',
    meetingTypes: ['pm_meeting'],
    autoApply: false,
    description: '실행 완료 데모 미팅 후 검토 단계로 전환 (PM 승인 필요)',
    priority: 5
  },
  {
    id: 'final_review_to_completed',
    fromPhase: 'review',
    toPhase: 'completed',
    trigger: 'meeting_completed',
    meetingTypes: ['pm_meeting'],
    autoApply: false,
    description: '최종 검토 미팅 완료 후 프로젝트 완료 (PM 승인 필요)',
    priority: 6
  }
];

/**
 * 단계 전환 가능 여부 체크
 */
export function canTransitionToPhase(
  currentPhase: ProjectPhase,
  targetPhase: ProjectPhase,
  trigger: PhaseTransitionTrigger,
  meetingType?: MeetingType
): PhaseTransitionRule | null {
  const applicableRules = DEFAULT_PHASE_TRANSITION_RULES.filter(rule =>
    rule.fromPhase === currentPhase &&
    rule.toPhase === targetPhase &&
    rule.trigger === trigger &&
    (!rule.meetingTypes || !meetingType || rule.meetingTypes.includes(meetingType))
  );

  // 우선순위가 가장 높은 규칙 반환
  return applicableRules.sort((a, b) => a.priority - b.priority)[0] || null;
}

/**
 * 미팅 완료 시 자동 단계 전환 체크
 */
export function checkMeetingBasedPhaseTransition(
  currentPhase: ProjectPhase,
  meetingRecord: GuideMeetingRecord
): { shouldTransition: boolean; rule?: PhaseTransitionRule; requiresApproval: boolean } {
  const rule = canTransitionToPhase(
    currentPhase,
    getNextPhase(currentPhase) as ProjectPhase,
    'meeting_completed',
    meetingRecord.type
  );

  if (!rule) {
    return { shouldTransition: false, requiresApproval: false };
  }

  return {
    shouldTransition: true,
    rule,
    requiresApproval: !rule.autoApply
  };
}

/**
 * 단계 전환 이벤트 생성
 */
export function createPhaseTransitionEvent(
  projectId: string,
  fromPhase: ProjectPhase,
  toPhase: ProjectPhase,
  trigger: PhaseTransitionTrigger,
  triggeredBy: string,
  triggerData?: {
    meetingRecordId?: string;
    calendarEventId?: string;
    paymentId?: string;
    [key: string]: any;
  }
): PhaseTransitionEvent {
  return {
    id: `pt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    projectId,
    fromPhase,
    toPhase,
    trigger,
    triggeredBy,
    triggeredAt: new Date(),
    status: 'pending',
    triggerData
  };
}

/**
 * 캘린더 이벤트와 미팅 기록 연결
 */
export function linkCalendarEventToMeeting(
  calendarEvent: CalendarEvent,
  meetingRecord: GuideMeetingRecord
): { updatedCalendarEvent: CalendarEvent; updatedMeetingRecord: GuideMeetingRecord } {
  const updatedCalendarEvent: CalendarEvent = {
    ...calendarEvent,
    meetingRecordId: meetingRecord.id,
    meetingData: {
      ...calendarEvent.meetingData,
      recordId: meetingRecord.id
    }
  };

  const updatedMeetingRecord: GuideMeetingRecord = {
    ...meetingRecord,
    calendarEventId: calendarEvent.id
  };

  return {
    updatedCalendarEvent,
    updatedMeetingRecord
  };
}

/**
 * 미팅 완료 시 단계 전환 트리거
 */
export function triggerPhaseTransitionFromMeeting(
  projectId: string,
  currentPhase: ProjectPhase,
  meetingRecord: GuideMeetingRecord,
  pmId: string
): PhaseTransitionEvent | null {
  const transitionCheck = checkMeetingBasedPhaseTransition(currentPhase, meetingRecord);

  if (!transitionCheck.shouldTransition || !transitionCheck.rule) {
    return null;
  }

  return createPhaseTransitionEvent(
    projectId,
    currentPhase,
    transitionCheck.rule.toPhase,
    'meeting_completed',
    pmId,
    {
      meetingRecordId: meetingRecord.id,
      calendarEventId: meetingRecord.calendarEventId
    }
  );
}

/**
 * 단계별 필수 미팅 타입 정의
 */
export const PHASE_REQUIRED_MEETINGS: Record<ProjectPhase, MeetingType[]> = {
  contract_pending: [],
  contract_signed: ['pm_meeting'], // 킥오프 미팅
  planning: ['pm_meeting'], // 기획 검토 미팅
  design: ['pm_meeting'], // 설계 검토 미팅
  execution: ['pm_meeting'], // 실행 완료 데모 미팅
  review: ['pm_meeting'], // 최종 검토 미팅
  completed: []
};

/**
 * 다음 단계 진행을 위한 필수 미팅 조건 체크
 */
export function getRequiredMeetingsForPhaseTransition(
  currentPhase: ProjectPhase
): { nextPhase: ProjectPhase | null; requiredMeetings: MeetingType[] } {
  const nextPhase = getNextPhase(currentPhase);

  if (!nextPhase) {
    return { nextPhase: null, requiredMeetings: [] };
  }

  return {
    nextPhase,
    requiredMeetings: PHASE_REQUIRED_MEETINGS[currentPhase] || []
  };
}