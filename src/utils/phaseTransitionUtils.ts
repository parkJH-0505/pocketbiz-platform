/**
 * Phase Transition Utilities
 *
 * 단계 전환 관련 유틸리티 함수들
 */

import type { ProjectPhase } from '../types/buildup.types';
import type {
  PhaseTransitionEvent,
  PhaseTransitionRule,
  PhaseTransitionTrigger,
  GuideMeetingRecord,
  MeetingType
} from '../types/phaseTransition.types';

/**
 * 단계 전환 이벤트 생성
 */
export function createPhaseTransitionEvent(
  projectId: string,
  fromPhase: ProjectPhase,
  toPhase: ProjectPhase,
  trigger: PhaseTransitionTrigger,
  triggeredBy: string,
  triggerData?: any
): PhaseTransitionEvent {
  return {
    id: `transition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    projectId,
    fromPhase,
    toPhase,
    trigger,
    triggeredBy,
    triggerData,
    status: 'pending',
    createdAt: new Date()
  };
}

/**
 * 미팅 기반 단계 전환 체크
 */
export function checkMeetingBasedPhaseTransition(
  currentPhase: ProjectPhase,
  meetingRecord: GuideMeetingRecord
): {
  shouldTransition: boolean;
  rule?: PhaseTransitionRule;
} {
  // 미팅 타입별 단계 전환 로직
  const transitionMap: Record<MeetingType, { from: ProjectPhase; to: ProjectPhase }[]> = {
    '킥오프': [
      { from: 'pm_assigned', to: 'kickoff_completed' }
    ],
    '정기': [],
    '마일스톤': [
      { from: 'kickoff_completed', to: 'in_progress' },
      { from: 'in_progress', to: 'review_in_progress' }
    ],
    '최종': [
      { from: 'review_in_progress', to: 'project_completed' }
    ]
  };

  const possibleTransitions = transitionMap[meetingRecord.type] || [];
  const matchingTransition = possibleTransitions.find(t => t.from === currentPhase);

  if (!matchingTransition) {
    return { shouldTransition: false };
  }

  // 규칙 생성
  const rule: PhaseTransitionRule = {
    id: `rule-${meetingRecord.type}-${currentPhase}`,
    name: `${meetingRecord.type} 미팅 완료 시 전환`,
    description: `${meetingRecord.type} 미팅 완료 시 ${currentPhase}에서 ${matchingTransition.to}로 전환`,
    fromPhase: currentPhase,
    toPhase: matchingTransition.to,
    trigger: 'meeting_completed',
    meetingTypes: [meetingRecord.type],
    autoApply: true,
    requiresApproval: false
  };

  return {
    shouldTransition: true,
    rule
  };
}

/**
 * 단계 전환 가능 여부 체크
 */
export function canTransitionPhase(
  fromPhase: ProjectPhase,
  toPhase: ProjectPhase
): boolean {
  // 단계 전환 순서 정의
  const phaseOrder: ProjectPhase[] = [
    'payment_pending',
    'payment_completed',
    'preparation_required',
    'kickoff_ready',
    'pm_assigned',
    'kickoff_scheduled',
    'kickoff_completed',
    'in_progress',
    'review_in_progress',
    'project_completed',
    'project_closed'
  ];

  const fromIndex = phaseOrder.indexOf(fromPhase);
  const toIndex = phaseOrder.indexOf(toPhase);

  // 순서가 올바른지 체크 (역행 불가)
  return fromIndex >= 0 && toIndex >= 0 && toIndex > fromIndex;
}

/**
 * 단계별 필수 조건 체크
 */
export function checkPhasePrerequisites(
  phase: ProjectPhase,
  project: any
): {
  met: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  switch (phase) {
    case 'kickoff_ready':
      if (!project.documents?.contract) missing.push('계약서');
      if (!project.documents?.proposal) missing.push('제안서');
      break;

    case 'pm_assigned':
      if (!project.pmId) missing.push('PM 배정');
      break;

    case 'kickoff_scheduled':
      if (!project.kickoffDate) missing.push('킥오프 일정');
      break;

    case 'in_progress':
      if (!project.workstreams?.length) missing.push('작업 스트림 설정');
      break;

    case 'project_completed':
      if (!project.deliverables?.every((d: any) => d.status === 'completed')) {
        missing.push('모든 산출물 완료');
      }
      break;
  }

  return {
    met: missing.length === 0,
    missing
  };
}

/**
 * 단계 전환 메시지 생성
 */
export function generateTransitionMessage(
  fromPhase: ProjectPhase,
  toPhase: ProjectPhase,
  trigger: PhaseTransitionTrigger
): string {
  const triggerMessages: Record<PhaseTransitionTrigger, string> = {
    payment_completed: '결제가 완료되어',
    meeting_completed: '미팅이 완료되어',
    document_submitted: '문서가 제출되어',
    manual: '수동으로',
    system: '시스템에 의해'
  };

  const phaseNames: Record<ProjectPhase, string> = {
    payment_pending: '결제 대기',
    payment_completed: '결제 완료',
    preparation_required: '준비 필요',
    kickoff_ready: '킥오프 준비',
    pm_assigned: 'PM 배정됨',
    kickoff_scheduled: '킥오프 예정',
    kickoff_completed: '킥오프 완료',
    in_progress: '진행 중',
    review_in_progress: '검토 중',
    project_completed: '프로젝트 완료',
    project_closed: '프로젝트 종료'
  };

  return `${triggerMessages[trigger]} 프로젝트가 '${phaseNames[fromPhase]}' 단계에서 '${phaseNames[toPhase]}' 단계로 전환되었습니다.`;
}

/**
 * 단계별 진행률 계산
 */
export function calculatePhaseCompletion(phase: ProjectPhase): number {
  const phaseProgress: Record<ProjectPhase, number> = {
    payment_pending: 0,
    payment_completed: 10,
    preparation_required: 15,
    kickoff_ready: 20,
    pm_assigned: 25,
    kickoff_scheduled: 30,
    kickoff_completed: 35,
    in_progress: 50,
    review_in_progress: 80,
    project_completed: 95,
    project_closed: 100
  };

  return phaseProgress[phase] || 0;
}