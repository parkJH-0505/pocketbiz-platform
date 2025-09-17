/**
 * Phase Transition Rules
 *
 * 단계 전환 규칙 정의
 */

import type {
  PhaseTransitionRule
} from '../types/phaseTransition.types';

/**
 * 단계 전환 규칙 목록
 */
export const phaseTransitionRules: PhaseTransitionRule[] = [
  // 결제 관련 전환
  {
    id: 'rule-001',
    name: '결제 완료 → 준비 필요',
    description: '결제가 완료되면 자동으로 준비 필요 단계로 전환',
    fromPhase: 'payment_pending',
    toPhase: 'payment_completed',
    trigger: 'payment_completed',
    autoApply: true,
    requiresApproval: false
  },
  {
    id: 'rule-002',
    name: '결제 완료 → 서류 준비',
    description: '결제 완료 후 서류 준비 단계로 전환',
    fromPhase: 'payment_completed',
    toPhase: 'preparation_required',
    trigger: 'payment_completed',
    autoApply: true,
    requiresApproval: false
  },

  // 문서 제출 관련 전환
  {
    id: 'rule-003',
    name: '서류 준비 완료 → 킥오프 준비',
    description: '필수 서류가 모두 준비되면 킥오프 준비 단계로 전환',
    fromPhase: 'preparation_required',
    toPhase: 'kickoff_ready',
    trigger: 'document_submitted',
    conditions: ['모든 필수 서류 제출'],
    autoApply: false,
    requiresApproval: true
  },

  // PM 배정 관련 전환
  {
    id: 'rule-004',
    name: '킥오프 준비 → PM 배정',
    description: 'PM이 배정되면 다음 단계로 전환',
    fromPhase: 'kickoff_ready',
    toPhase: 'pm_assigned',
    trigger: 'manual',
    autoApply: false,
    requiresApproval: true
  },

  // 킥오프 미팅 관련 전환
  {
    id: 'rule-005',
    name: 'PM 배정 → 킥오프 일정 확정',
    description: '킥오프 미팅 일정이 확정되면 전환',
    fromPhase: 'pm_assigned',
    toPhase: 'kickoff_scheduled',
    trigger: 'manual',
    autoApply: false,
    requiresApproval: false
  },
  {
    id: 'rule-006',
    name: '킥오프 예정 → 킥오프 완료',
    description: '킥오프 미팅이 완료되면 자동 전환',
    fromPhase: 'kickoff_scheduled',
    toPhase: 'kickoff_completed',
    trigger: 'meeting_completed',
    meetingTypes: ['킥오프'],
    autoApply: true,
    requiresApproval: false
  },

  // 프로젝트 진행 관련 전환
  {
    id: 'rule-007',
    name: '킥오프 완료 → 진행 중',
    description: '킥오프 완료 후 프로젝트 본격 진행',
    fromPhase: 'kickoff_completed',
    toPhase: 'in_progress',
    trigger: 'manual',
    autoApply: false,
    requiresApproval: false
  },
  {
    id: 'rule-008',
    name: '진행 중 → 검토 단계',
    description: '마일스톤 미팅 후 검토 단계로 전환',
    fromPhase: 'in_progress',
    toPhase: 'review_in_progress',
    trigger: 'meeting_completed',
    meetingTypes: ['마일스톤'],
    conditions: ['주요 산출물 완료'],
    autoApply: false,
    requiresApproval: true
  },

  // 프로젝트 완료 관련 전환
  {
    id: 'rule-009',
    name: '검토 중 → 프로젝트 완료',
    description: '최종 미팅 완료 후 프로젝트 완료',
    fromPhase: 'review_in_progress',
    toPhase: 'project_completed',
    trigger: 'meeting_completed',
    meetingTypes: ['최종'],
    autoApply: false,
    requiresApproval: true
  },
  {
    id: 'rule-010',
    name: '프로젝트 완료 → 종료',
    description: '모든 정산 및 마무리 작업 완료',
    fromPhase: 'project_completed',
    toPhase: 'project_closed',
    trigger: 'manual',
    conditions: ['모든 산출물 인수', '최종 정산 완료'],
    autoApply: false,
    requiresApproval: true
  },

  // 긴급 전환 (수동)
  {
    id: 'rule-011',
    name: '긴급 프로젝트 시작',
    description: '긴급한 경우 준비 단계를 건너뛰고 진행',
    fromPhase: 'payment_completed',
    toPhase: 'in_progress',
    trigger: 'manual',
    conditions: ['긴급 프로젝트 승인'],
    autoApply: false,
    requiresApproval: true
  }
];

/**
 * 단계별 허용된 다음 단계들
 */
export const allowedTransitions: Record<string, string[]> = {
  'payment_pending': ['payment_completed'],
  'payment_completed': ['preparation_required', 'in_progress'], // 긴급 시 바로 진행 가능
  'preparation_required': ['kickoff_ready'],
  'kickoff_ready': ['pm_assigned'],
  'pm_assigned': ['kickoff_scheduled'],
  'kickoff_scheduled': ['kickoff_completed'],
  'kickoff_completed': ['in_progress'],
  'in_progress': ['review_in_progress', 'project_completed'], // 간단한 프로젝트는 바로 완료 가능
  'review_in_progress': ['project_completed'],
  'project_completed': ['project_closed'],
  'project_closed': [] // 최종 단계
};

/**
 * 자동 전환 가능한 트리거들
 */
export const automaticTriggers = [
  'payment_completed',
  'meeting_completed'
];

/**
 * 승인이 필요한 전환들
 */
export const approvalsRequired = [
  { from: 'preparation_required', to: 'kickoff_ready' },
  { from: 'kickoff_ready', to: 'pm_assigned' },
  { from: 'in_progress', to: 'review_in_progress' },
  { from: 'review_in_progress', to: 'project_completed' },
  { from: 'project_completed', to: 'project_closed' }
];