/**
 * Universal Schedule Modal Utilities
 *
 * 스케줄 모달에서 사용되는 유틸리티 함수 모음
 */

import type {
  ScheduleFormData,
  ValidationErrors,
  PhaseTransitionInfo
} from './types';
import type { UnifiedSchedule, BuildupProjectMeeting } from '../../types/schedule.types';
import type { ProjectPhase } from '../../types/buildup.types';

// ============================================================================
// Form Data Initialization
// ============================================================================

/**
 * 폼 데이터 초기화
 */
export function initializeFormData(
  schedule?: UnifiedSchedule,
  defaultType: string = 'general',
  projectId?: string
): ScheduleFormData {
  // 편집 모드인 경우 기존 데이터 사용
  if (schedule) {
    return mapScheduleToFormData(schedule);
  }

  // 새로 생성하는 경우 기본값 설정
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  return {
    type: defaultType as any,
    title: '',
    description: '',
    startDateTime: now.toISOString(),
    endDateTime: oneHourLater.toISOString(),
    location: '',
    isOnline: false,
    status: 'scheduled',
    priority: 'medium',
    participants: [],
    tags: [],
    projectId: projectId,
    phaseTransitionEnabled: true // 빌드업 미팅은 기본적으로 단계 전환 활성화
  };
}

/**
 * UnifiedSchedule을 FormData로 변환
 */
export function mapScheduleToFormData(schedule: UnifiedSchedule): ScheduleFormData {
  const baseData: ScheduleFormData = {
    type: schedule.type,
    title: schedule.title,
    description: schedule.description,
    startDateTime: schedule.startDateTime,
    endDateTime: schedule.endDateTime,
    location: schedule.location,
    isOnline: schedule.isOnline || false,
    onlineLink: schedule.onlineLink,
    status: schedule.status,
    priority: schedule.priority,
    participants: schedule.participants,
    tags: schedule.tags
  };

  // 타입별 특화 필드 매핑
  switch (schedule.type) {
    case 'buildup_project':
      const buildupMeeting = schedule as BuildupProjectMeeting;
      return {
        ...baseData,
        projectId: buildupMeeting.projectId,
        meetingSequenceType: buildupMeeting.meetingSequence?.type,
        meetingNotes: buildupMeeting.meetingNotes,
        pmName: buildupMeeting.pmName,
        phaseTransitionEnabled: !!buildupMeeting.phaseTransitionTrigger
      };

    case 'mentor_session':
      // TODO: 멘토 세션 매핑
      return baseData;

    case 'webinar':
      // TODO: 웨비나 매핑
      return baseData;

    case 'pm_consultation':
      // TODO: PM 상담 매핑
      return baseData;

    case 'external_meeting':
      // TODO: 외부 미팅 매핑
      return baseData;

    default:
      return baseData;
  }
}

/**
 * FormData를 UnifiedSchedule로 변환
 */
export function mapFormDataToSchedule(
  formData: ScheduleFormData,
  existingSchedule?: UnifiedSchedule
): Partial<UnifiedSchedule> {
  const baseSchedule = {
    type: formData.type,
    title: formData.title,
    description: formData.description,
    date: new Date(formData.startDateTime),
    startDateTime: new Date(formData.startDateTime),
    endDateTime: new Date(formData.endDateTime),
    location: formData.location,
    isOnline: formData.isOnline,
    onlineLink: formData.onlineLink,
    status: formData.status,
    priority: formData.priority,
    participants: formData.participants || [],
    tags: formData.tags || [],
    reminders: [],
    createdBy: formData.createdBy || 'current_user',
    createdAt: existingSchedule?.createdAt || new Date(),
    updatedAt: new Date()
  };

  // 타입별 특화 필드 추가
  if (formData.type === 'buildup_project' && formData.projectId) {
    const buildupSchedule: Partial<BuildupProjectMeeting> = {
      ...baseSchedule,
      type: 'buildup_project',
      projectId: formData.projectId,
      meetingSequence: formData.meetingSequenceType ? {
        type: formData.meetingSequenceType,
        sequenceNumber: getMeetingSequenceNumber(formData.meetingSequenceType),
        totalSequences: 5 // 프리 + 가이드 4차
      } : undefined,
      meetingNotes: formData.meetingNotes,
      pmName: formData.pmName,
      pmInfo: {
        id: formData.pmId || 'default-pm',
        name: formData.pmName || '담당 PM',
        email: formData.pmEmail,
        phone: formData.pmPhone
      }
    };

    // 단계 전환 정보 추가 (새로 생성하는 경우만)
    if (!existingSchedule && formData.phaseTransitionEnabled) {
      buildupSchedule.phaseTransitionTrigger = getPhaseTransitionTrigger(
        formData.meetingSequenceType!
      );
    }

    return buildupSchedule;
  }

  return baseSchedule;
}

// ============================================================================
// Phase Transition Logic
// ============================================================================

/**
 * 미팅 시퀀스별 단계 전환 트리거 정보 가져오기
 */
export function getPhaseTransitionTrigger(
  meetingSequenceType: string
): { fromPhase: ProjectPhase; toPhase: ProjectPhase } | undefined {
  const TRANSITION_MAP: Record<string, { fromPhase: ProjectPhase; toPhase: ProjectPhase }> = {
    'pre_meeting': { fromPhase: 'contract_pending', toPhase: 'contract_signed' },
    'guide_1': { fromPhase: 'contract_signed', toPhase: 'planning' },
    'guide_2': { fromPhase: 'planning', toPhase: 'design' },
    'guide_3': { fromPhase: 'design', toPhase: 'execution' },
    'guide_4': { fromPhase: 'execution', toPhase: 'review' }
  };

  return TRANSITION_MAP[meetingSequenceType];
}

/**
 * 미팅 시퀀스 번호 가져오기
 */
export function getMeetingSequenceNumber(meetingSequenceType: string): number {
  const SEQUENCE_NUMBERS: Record<string, number> = {
    'pre_meeting': 0,
    'guide_1': 1,
    'guide_2': 2,
    'guide_3': 3,
    'guide_4': 4
  };

  return SEQUENCE_NUMBERS[meetingSequenceType] || 0;
}

/**
 * 단계 전환 정보 생성
 */
export function getPhaseTransitionInfo(
  meetingSequenceType: string | undefined,
  currentPhase?: ProjectPhase
): PhaseTransitionInfo | null {
  if (!meetingSequenceType) return null;

  const trigger = getPhaseTransitionTrigger(meetingSequenceType);
  if (!trigger) return null;

  return {
    fromPhase: currentPhase || trigger.fromPhase,
    toPhase: trigger.toPhase,
    triggerType: 'meeting_scheduled',
    description: `${getMeetingSequenceLabel(meetingSequenceType)} 예약 시 ${trigger.toPhase} 단계로 자동 전환`,
    willAutoTransition: true
  };
}

/**
 * 미팅 시퀀스 라벨 가져오기
 */
export function getMeetingSequenceLabel(sequenceType: string): string {
  const LABELS: Record<string, string> = {
    'pre_meeting': '프리미팅',
    'guide_1': '가이드 1차 (킥오프)',
    'guide_2': '가이드 2차',
    'guide_3': '가이드 3차',
    'guide_4': '가이드 4차'
  };

  return LABELS[sequenceType] || sequenceType;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * 폼 데이터 유효성 검사
 */
export function validateScheduleData(
  formData: ScheduleFormData,
  mode: 'create' | 'edit' = 'create'
): ValidationErrors {
  const errors: ValidationErrors = {};

  // 공통 필드 검증
  if (!formData.title || formData.title.trim() === '') {
    errors.title = '제목을 입력해주세요';
  }

  if (!formData.startDateTime) {
    errors.startDateTime = '시작 시간을 선택해주세요';
  }

  if (!formData.endDateTime) {
    errors.endDateTime = '종료 시간을 선택해주세요';
  }

  // 시간 유효성 검사
  if (formData.startDateTime && formData.endDateTime) {
    const start = new Date(formData.startDateTime);
    const end = new Date(formData.endDateTime);

    if (end <= start) {
      errors.endDateTime = '종료 시간은 시작 시간보다 이후여야 합니다';
    }

    // 과거 시간 체크 (생성 모드에서만)
    if (mode === 'create' && start < new Date()) {
      errors.startDateTime = '과거 시간으로는 일정을 생성할 수 없습니다';
    }
  }

  // 온라인 미팅 링크 검증
  if (formData.isOnline && !formData.onlineLink) {
    errors.onlineLink = '온라인 미팅 링크를 입력해주세요';
  }

  // 타입별 필수 필드 검증
  if (formData.type === 'buildup_project') {
    if (!formData.projectId) {
      errors.projectId = '프로젝트를 선택해주세요';
    }

    if (!formData.meetingSequenceType) {
      errors.meetingSequenceType = '미팅 차수를 선택해주세요';
    }
  }

  if (formData.type === 'mentor_session') {
    if (!formData.mentorId) {
      errors.mentorId = '멘토를 선택해주세요';
    }

    if (!formData.programId) {
      errors.programId = '프로그램을 선택해주세요';
    }
  }

  if (formData.type === 'webinar') {
    if (!formData.webinarId) {
      errors.webinarId = '웨비나를 선택해주세요';
    }

    if (formData.maxAttendees && formData.maxAttendees < 1) {
      errors.maxAttendees = '최대 참석자 수는 1명 이상이어야 합니다';
    }
  }

  if (formData.type === 'pm_consultation') {
    if (!formData.consultationType) {
      errors.consultationType = '상담 유형을 선택해주세요';
    }

    if (!formData.consultationTopic) {
      errors.consultationTopic = '상담 주제를 입력해주세요';
    }
  }

  return errors;
}

/**
 * 특정 필드의 에러 메시지 가져오기
 */
export function getFieldError(errors: ValidationErrors, fieldName: string): string | undefined {
  return errors[fieldName];
}

/**
 * 폼이 유효한지 확인
 */
export function isFormValid(errors: ValidationErrors): boolean {
  return Object.keys(errors).length === 0;
}

// ============================================================================
// Type-specific Reset
// ============================================================================

/**
 * 타입 변경 시 특화 필드 초기화
 */
export function resetTypeSpecificFields(
  formData: ScheduleFormData,
  newType: string
): ScheduleFormData {
  // 공통 필드는 유지
  const resetData: ScheduleFormData = {
    type: newType as any,
    title: formData.title,
    description: formData.description,
    startDateTime: formData.startDateTime,
    endDateTime: formData.endDateTime,
    location: formData.location,
    isOnline: formData.isOnline,
    onlineLink: formData.onlineLink,
    status: formData.status,
    priority: formData.priority,
    participants: formData.participants,
    tags: formData.tags
  };

  // 새 타입에 따른 기본값 설정
  if (newType === 'buildup_project') {
    resetData.phaseTransitionEnabled = true;
  }

  return resetData;
}

// ============================================================================
// Date & Time Helpers
// ============================================================================

/**
 * Date를 datetime-local input 형식으로 변환
 */
export function formatDateTimeLocal(date: Date | string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * datetime-local input 값을 Date로 변환
 */
export function parseDateTimeLocal(value: string): Date {
  return new Date(value);
}

/**
 * 날짜 포맷팅 (표시용)
 */
export function formatScheduleDateTime(date: Date | string): string {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  };

  return d.toLocaleString('ko-KR', options);
}