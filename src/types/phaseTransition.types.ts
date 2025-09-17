/**
 * Phase Transition Related Types
 *
 * 단계 전환 관련 타입 정의를 별도 파일로 분리
 */

import type { ProjectPhase } from './buildup.types';

// Phase Transition Types
export type PhaseTransitionTrigger =
  | 'payment_completed'
  | 'meeting_completed'
  | 'document_submitted'
  | 'manual'
  | 'system';

export type PhaseTransitionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'failed'
  | 'approval_required';

export interface PhaseTransitionEvent {
  id: string;
  projectId: string;
  fromPhase: ProjectPhase;
  toPhase: ProjectPhase;
  trigger: PhaseTransitionTrigger;
  triggeredBy: string; // User ID or 'system'
  triggerData?: any;
  status: PhaseTransitionStatus;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface PhaseTransitionRule {
  id: string;
  name: string;
  description: string;
  fromPhase: ProjectPhase;
  toPhase: ProjectPhase;
  trigger: PhaseTransitionTrigger;
  conditions?: string[];
  meetingTypes?: MeetingType[];
  autoApply: boolean;
  requiresApproval: boolean;
}

export interface PhaseTransitionApprovalRequest {
  id: string;
  phaseTransitionEvent: PhaseTransitionEvent;
  requestedBy: string;
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
}

export type PhaseTransitionListener = (event: PhaseTransitionEvent) => void;

// Meeting Related Types
export type MeetingType = '킥오프' | '정기' | '마일스톤' | '최종';

export interface GuideMeetingRecord {
  id: string;
  projectId: string;
  type: MeetingType;
  calendarEventId: string;
  date: Date;
  attendees: string[];
  notes?: string;
  outcomes?: string[];
  nextSteps?: string[];
  completedAt?: Date;
  completedBy?: string;
}