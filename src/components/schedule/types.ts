/**
 * Universal Schedule Modal Types
 *
 * 이 파일은 UniversalScheduleModal 컴포넌트와 관련된 모든 타입을 정의합니다.
 * 통합 스케줄 시스템의 UI 레이어 타입 정의
 */

import type {
  UnifiedSchedule,
  ScheduleType,
  BuildupProjectMeeting,
  MentorSession,
  WebinarEvent,
  PMConsultation,
  ExternalMeeting,
  GeneralSchedule,
  ScheduleStatus,
  SchedulePriority,
  MeetingSequence
} from '../../types/schedule.types';

// ============================================================================
// Form Data Types
// ============================================================================

/**
 * 스케줄 폼 데이터 타입
 * 모든 스케줄 타입의 필드를 포함하는 통합 폼 데이터 구조
 */
export interface ScheduleFormData {
  // ========== 공통 필드 ==========
  type: ScheduleType;
  title: string;
  description?: string;
  startDateTime: Date | string;
  endDateTime: Date | string;
  location?: string;
  isOnline: boolean;
  onlineLink?: string;

  // 상태 및 우선순위
  status: ScheduleStatus;
  priority: SchedulePriority;

  // 참석자
  participants?: string[];
  tags?: string[];

  // ========== 빌드업 프로젝트 미팅 특화 필드 ==========
  projectId?: string;
  meetingSequenceType?: 'pre_meeting' | 'guide_1' | 'guide_2' | 'guide_3' | 'guide_4';
  meetingNotes?: string;
  pmName?: string;
  phaseTransitionEnabled?: boolean;

  // ========== 멘토 세션 특화 필드 ==========
  mentorId?: string;
  mentorName?: string;
  sessionNumber?: number;
  totalSessions?: number;
  programId?: string;
  attendees?: string[];

  // ========== 웨비나 특화 필드 ==========
  webinarId?: string;
  registeredCount?: number;
  maxAttendees?: number;
  isLive?: boolean;
  recordingUrl?: string;
  registrationDeadline?: Date | string;

  // ========== PM 상담 특화 필드 ==========
  consultationType?: 'subscription' | 'one_time';
  consultationTopic?: string;
  pmId?: string;
  pmEmail?: string;
  pmPhone?: string;
  clientId?: string;
  consultationDuration?: number;

  // ========== 외부 미팅 특화 필드 ==========
  externalCompany?: string;
  externalAttendees?: string[];
  meetingPurpose?: string;

  // ========== 메타데이터 ==========
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================================
// Modal Props Types
// ============================================================================

/**
 * 모달 모드 타입
 */
export type ModalMode = 'create' | 'edit' | 'view';

/**
 * UniversalScheduleModal 컴포넌트 Props
 */
export interface UniversalScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule?: UnifiedSchedule;
  mode: ModalMode;
  defaultType?: ScheduleType;
  projectId?: string;
  onSuccess?: (schedule: UnifiedSchedule) => void;
  className?: string;
}

/**
 * 스텝별 컴포넌트 공통 Props
 */
export interface StepComponentProps {
  formData: ScheduleFormData;
  onChange: (updates: Partial<ScheduleFormData>) => void;
  errors: Record<string, string>;
  mode: ModalMode;
}

/**
 * 타입별 필드 컴포넌트 Props
 */
export interface TypeSpecificFieldsProps extends StepComponentProps {
  project?: any; // BuildupProject type from BuildupContext
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation 에러 타입
 */
export interface ValidationErrors {
  [key: string]: string;
}

/**
 * Validation 규칙 타입
 */
export interface ValidationRule {
  field: keyof ScheduleFormData;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any, formData: ScheduleFormData) => string | null;
}

/**
 * 타입별 Validation 규칙 매핑
 */
export type ValidationRulesByType = {
  [key in ScheduleType]: ValidationRule[];
};

// ============================================================================
// UI Component Types
// ============================================================================

/**
 * 스텝 인디케이터 Props
 */
export interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  className?: string;
}

/**
 * 모달 푸터 Props
 */
export interface ModalFooterProps {
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  onCancel?: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
  submitLabel?: string;
  cancelLabel?: string;
}

/**
 * 타입 선택기 Props
 */
export interface ScheduleTypeSelectorProps {
  value: ScheduleType;
  onChange: (type: ScheduleType) => void;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * 폼 필드 설정 타입
 */
export interface FormFieldConfig {
  name: keyof ScheduleFormData;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'time' | 'datetime' | 'number' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  rows?: number;
  disabled?: boolean;
  helpText?: string;
}

/**
 * 타입별 필드 설정
 */
export type FieldConfigByType = {
  [key in ScheduleType]: FormFieldConfig[];
};

/**
 * 단계 전환 정보 타입
 */
export interface PhaseTransitionInfo {
  fromPhase: string;
  toPhase: string;
  triggerType: string;
  description: string;
  willAutoTransition: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * 모달 스텝 정의
 */
export const MODAL_STEPS = {
  TYPE_SELECTION: 1,
  COMMON_FIELDS: 2,
  TYPE_SPECIFIC_FIELDS: 3,
  REVIEW: 4
} as const;

/**
 * 스텝 라벨
 */
export const STEP_LABELS = [
  '일정 유형',
  '기본 정보',
  '상세 정보',
  '확인'
];

/**
 * 타입별 아이콘 매핑
 */
export const TYPE_ICONS = {
  buildup_project: '🏗️',
  mentor_session: '👨‍🏫',
  webinar: '📺',
  pm_consultation: '💼',
  external_meeting: '🤝',
  general: '📅'
} as const;

/**
 * 타입별 한글 라벨
 */
export const TYPE_LABELS: Record<ScheduleType, string> = {
  buildup_project: '빌드업 프로젝트 미팅',
  mentor_session: '멘토 세션',
  webinar: '웨비나',
  pm_consultation: 'PM 상담',
  external_meeting: '외부 미팅',
  general: '일반 일정'
};

// ============================================================================
// Export Type Guards
// ============================================================================

/**
 * 빌드업 프로젝트 미팅 폼 데이터인지 확인
 */
export function isBuildupProjectFormData(
  formData: ScheduleFormData
): formData is ScheduleFormData & Required<Pick<ScheduleFormData, 'projectId' | 'meetingSequenceType'>> {
  return formData.type === 'buildup_project' &&
         !!formData.projectId &&
         !!formData.meetingSequenceType;
}

/**
 * 멘토 세션 폼 데이터인지 확인
 */
export function isMentorSessionFormData(
  formData: ScheduleFormData
): formData is ScheduleFormData & Required<Pick<ScheduleFormData, 'mentorId' | 'programId'>> {
  return formData.type === 'mentor_session' &&
         !!formData.mentorId &&
         !!formData.programId;
}