/**
 * @fileoverview 포켓비즈 통합 스케줄 시스템 타입 정의
 * @description 모든 일정 타입을 통합 관리하는 중앙 타입 시스템
 * @author PocketCompany
 * @since 2025-01-18
 */

import type { ProjectPhase } from './buildup.types';

// ============================================================================
// STEP 2: Base Schedule Interface - 모든 스케줄의 공통 필드
// ============================================================================

/**
 * 모든 스케줄 타입의 기본 인터페이스
 * @description 모든 일정이 공통으로 가져야 할 필수 필드들
 */
export interface BaseSchedule {
  /** 고유 식별자 (형식: SCH-{timestamp}) */
  id: string;

  /** 일정 제목 */
  title: string;

  /** 일정 날짜 */
  date: Date;

  /** 시간 (선택적, 24시간 형식 HH:mm) */
  time?: string;

  /** 장소 또는 온라인 플랫폼 정보 */
  location?: string;

  /** 참석자 목록 (이름 또는 ID) */
  participants: string[];

  /** 일정 상태 */
  status: ScheduleStatus;

  /** 일정 우선순위 */
  priority: SchedulePriority;

  /** 설명 또는 메모 */
  description?: string;

  /** 생성자 ID */
  createdBy: string;

  /** 생성 일시 */
  createdAt: Date;

  /** 수정자 ID */
  updatedBy?: string;

  /** 수정 일시 */
  updatedAt?: Date;

  /** 메타데이터 (확장용) */
  metadata?: Record<string, any>;
}

/**
 * 스케줄 상태
 */
export type ScheduleStatus =
  | 'scheduled'    // 예약됨
  | 'in_progress'  // 진행중
  | 'completed'    // 완료
  | 'cancelled'    // 취소됨
  | 'postponed';   // 연기됨

/**
 * 스케줄 우선순위
 */
export type SchedulePriority =
  | 'urgent'   // 긴급
  | 'high'     // 높음
  | 'medium'   // 보통
  | 'low';     // 낮음

// ============================================================================
// STEP 3: Meeting Sequence & Phase Transition Types
// ============================================================================

/**
 * 빌드업 프로젝트 미팅 시퀀스
 * @description 포켓비즈의 실제 업무 프로세스 반영
 */
export type MeetingSequence =
  | 'pre_meeting'    // 프리미팅 (계약 전 상담)
  | 'guide_1'        // 가이드 1차 (킥오프)
  | 'guide_2'        // 가이드 2차
  | 'guide_3'        // 가이드 3차
  | 'guide_4'        // 가이드 4차
  | 'guide_5'        // 가이드 5차 (필요시)
  | 'closing';       // 클로징 미팅

/**
 * 미팅 시퀀스 메타데이터
 */
export const MEETING_SEQUENCE_INFO: Record<MeetingSequence, {
  order: number;
  label: string;
  description: string;
  expectedPhase: ProjectPhase | null;
  nextSequence: MeetingSequence | null;
}> = {
  pre_meeting: {
    order: 0,
    label: '프리미팅',
    description: '프로젝트 상담 및 견적 논의',
    expectedPhase: 'contract_pending',
    nextSequence: 'guide_1'
  },
  guide_1: {
    order: 1,
    label: '가이드 1차 (킥오프)',
    description: '프로젝트 시작 및 요구사항 정의',
    expectedPhase: 'planning',
    nextSequence: 'guide_2'
  },
  guide_2: {
    order: 2,
    label: '가이드 2차',
    description: '기획 검토 및 설계 방향 논의',
    expectedPhase: 'design',
    nextSequence: 'guide_3'
  },
  guide_3: {
    order: 3,
    label: '가이드 3차',
    description: '설계 검토 및 실행 계획 수립',
    expectedPhase: 'execution',
    nextSequence: 'guide_4'
  },
  guide_4: {
    order: 4,
    label: '가이드 4차',
    description: '실행 결과 검토 및 피드백',
    expectedPhase: 'review',
    nextSequence: 'guide_5'
  },
  guide_5: {
    order: 5,
    label: '가이드 5차',
    description: '추가 검토 및 보완 사항 논의',
    expectedPhase: 'review',
    nextSequence: 'closing'
  },
  closing: {
    order: 6,
    label: '클로징 미팅',
    description: '프로젝트 완료 및 인수인계',
    expectedPhase: 'completed',
    nextSequence: null
  }
};

/**
 * 단계 전환 트리거 정보
 * @description 미팅 예약 시 자동으로 프로젝트 단계를 전환하기 위한 정보
 */
export interface PhaseTransitionTrigger {
  /** 현재 단계 */
  fromPhase: ProjectPhase;

  /** 전환될 단계 */
  toPhase: ProjectPhase;

  /** 자동 전환 여부 */
  automatic: boolean;

  /** 전환 조건 (선택적) */
  condition?: string;

  /** 전환 사유 (자동 생성) */
  reason: string;
}

/**
 * 미팅 시퀀스별 단계 전환 규칙
 * @description 미팅 예약 = 해당 단계 작업 중
 */
export const MEETING_PHASE_TRANSITION_RULES: Record<MeetingSequence, PhaseTransitionTrigger | null> = {
  pre_meeting: {
    fromPhase: 'contract_pending',
    toPhase: 'contract_signed',
    automatic: false, // 프리미팅은 수동 전환 (계약 여부 확인 필요)
    condition: '견적서 전달 완료',
    reason: '프리미팅 예약 및 견적서 전달'
  },
  guide_1: {
    fromPhase: 'contract_signed',
    toPhase: 'planning',
    automatic: true,
    reason: '가이드 1차(킥오프) 미팅 예약 - 기획 작업 시작'
  },
  guide_2: {
    fromPhase: 'planning',
    toPhase: 'design',
    automatic: true,
    reason: '가이드 2차 미팅 예약 - 설계 작업 시작'
  },
  guide_3: {
    fromPhase: 'design',
    toPhase: 'execution',
    automatic: true,
    reason: '가이드 3차 미팅 예약 - 실행 작업 시작'
  },
  guide_4: {
    fromPhase: 'execution',
    toPhase: 'review',
    automatic: true,
    reason: '가이드 4차 미팅 예약 - 검토 단계 시작'
  },
  guide_5: {
    fromPhase: 'review',
    toPhase: 'review', // 검토 단계 유지
    automatic: false,
    reason: '가이드 5차 미팅 예약 - 추가 검토'
  },
  closing: {
    fromPhase: 'review',
    toPhase: 'completed',
    automatic: false, // 클로징은 수동 전환 (최종 확인 필요)
    condition: '모든 산출물 전달 완료',
    reason: '클로징 미팅 예약 - 프로젝트 완료 준비'
  }
};

// ============================================================================
// STEP 4: BuildupProjectMeeting Interface - 가장 중요한 타입!
// ============================================================================

/**
 * 빌드업 프로젝트 미팅
 * @description 프로젝트 단계 전환의 핵심 트리거가 되는 미팅 타입
 */
export interface BuildupProjectMeeting extends BaseSchedule {
  /** 스케줄 타입 식별자 */
  type: 'buildup_project';

  /** 연결된 프로젝트 ID (필수) */
  projectId: string;

  /** 프로젝트 이름 (캐시용) */
  projectName?: string;

  /** 미팅 시퀀스 (프리미팅, 가이드 N차 등) */
  meetingSequence: MeetingSequence;

  /** 담당 PM 정보 */
  pmInfo: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };

  /** 클라이언트 정보 */
  clientInfo?: {
    company: string;
    representative: string;
    email?: string;
    phone?: string;
  };

  /** 미팅 아젠다 */
  agenda?: string[];

  /** 미팅 노트 (PM 작성) */
  meetingNotes?: {
    content: string;
    attachments?: string[];
    updatedAt: Date;
    updatedBy: string;
  };

  /** 액션 아이템 */
  actionItems?: Array<{
    id: string;
    description: string;
    assignee: string;
    dueDate?: Date;
    status: 'pending' | 'in_progress' | 'completed';
  }>;

  /** 온라인 미팅 링크 */
  meetingLink?: string;

  /** 녹화 링크 */
  recordingUrl?: string;

  /** 단계 전환 트리거 정보 */
  phaseTransitionTrigger?: PhaseTransitionTrigger;

  /** 자동 전환 실행 여부 */
  autoTransitionExecuted?: boolean;

  /** 전환 실행 시각 */
  transitionExecutedAt?: Date;

  /** 미팅 만족도 (완료 후) */
  satisfaction?: {
    rating: 1 | 2 | 3 | 4 | 5;
    feedback?: string;
    submittedAt: Date;
  };

  /** CRM 연동 ID */
  crmId?: string;

  /** 미팅 태그 */
  tags?: string[];
}

/**
 * 빌드업 미팅 생성 DTO
 * @description 새 빌드업 미팅 생성 시 필요한 최소 정보
 */
export interface CreateBuildupMeetingDTO {
  projectId: string;
  meetingSequence: MeetingSequence;
  title: string;
  date: Date;
  time?: string;
  location?: string;
  participants: string[];
  pmInfo: {
    id: string;
    name: string;
  };
  agenda?: string[];
}

/**
 * 빌드업 미팅 업데이트 DTO
 */
export interface UpdateBuildupMeetingDTO extends Partial<Omit<BuildupProjectMeeting, 'id' | 'type' | 'createdAt' | 'createdBy'>> {
  updatedBy: string;
}

// ============================================================================
// STEP 5: Additional Schedule Types
// ============================================================================

/**
 * 포켓멘토 세션
 * @description 포켓멘토 강의/캠프 일정
 */
export interface MentorSession extends BaseSchedule {
  /** 스케줄 타입 식별자 */
  type: 'mentor_session';

  /** 프로그램 ID */
  programId: string;

  /** 프로그램 이름 */
  programName: string;

  /** 세션 번호 (N차시) */
  sessionNumber: number;

  /** 세션 타입 */
  sessionType: 'lecture' | 'workshop' | 'mentoring' | 'networking';

  /** 멘토 정보 */
  mentorInfo: {
    id: string;
    name: string;
    expertise: string[];
    profileImage?: string;
  };

  /** 수강생 목록 */
  attendees: Array<{
    id: string;
    name: string;
    email?: string;
    attended?: boolean;
  }>;

  /** 세션 자료 */
  materials?: {
    slides?: string;
    resources?: string[];
    assignments?: string[];
  };

  /** 세션 링크 (온라인) */
  sessionLink?: string;

  /** 녹화본 링크 */
  recordingUrl?: string;
}

/**
 * 웨비나 이벤트
 * @description 포켓웨비나 일정
 */
export interface WebinarEvent extends BaseSchedule {
  /** 스케줄 타입 식별자 */
  type: 'webinar';

  /** 웨비나 ID */
  webinarId: string;

  /** 웨비나 주제 */
  topic: string;

  /** 발표자 정보 */
  speakers: Array<{
    name: string;
    title: string;
    organization: string;
    profileImage?: string;
  }>;

  /** 등록자 수 */
  registeredCount: number;

  /** 실제 참석자 수 */
  attendeeCount?: number;

  /** 라이브 여부 */
  isLive: boolean;

  /** 웨비나 플랫폼 */
  platform: 'zoom' | 'youtube' | 'custom';

  /** 웨비나 링크 */
  webinarLink?: string;

  /** 녹화본 링크 */
  recordingUrl?: string;

  /** Q&A 세션 여부 */
  hasQnA: boolean;

  /** 태그 */
  tags?: string[];
}

/**
 * PM 상담
 * @description PM 미팅 (구독 기반 또는 일회성)
 */
export interface PMConsultation extends BaseSchedule {
  /** 스케줄 타입 식별자 */
  type: 'pm_consultation';

  /** 상담 타입 */
  consultationType: 'subscription' | 'one_time' | 'follow_up';

  /** 상담 주제/카테고리 */
  topic: string;

  /** 상담 카테고리 */
  category: 'strategy' | 'technical' | 'marketing' | 'funding' | 'general';

  /** PM 정보 */
  pmInfo: {
    id: string;
    name: string;
    expertise: string[];
    rating?: number;
  };

  /** 클라이언트 정보 */
  clientInfo: {
    id: string;
    name: string;
    company?: string;
    email?: string;
  };

  /** 상담 목표 */
  objectives?: string[];

  /** 준비 사항 */
  preparationNotes?: string;

  /** 상담 결과 요약 */
  consultationSummary?: {
    keyPoints: string[];
    actionItems: string[];
    followUpRequired: boolean;
    nextSteps?: string;
  };

  /** 상담료 정보 */
  fee?: {
    amount: number;
    currency: string;
    paid: boolean;
  };

  /** 만족도 평가 */
  satisfaction?: {
    rating: 1 | 2 | 3 | 4 | 5;
    feedback?: string;
  };
}

/**
 * 외부 미팅
 * @description 파트너사, 투자자 등 외부 미팅
 */
export interface ExternalMeeting extends BaseSchedule {
  /** 스케줄 타입 식별자 */
  type: 'external';

  /** 미팅 카테고리 */
  category: 'partner' | 'investor' | 'client' | 'vendor' | 'other';

  /** 조직 정보 */
  organizationInfo: {
    name: string;
    type: string;
    website?: string;
  };

  /** 미팅 목적 */
  purpose: string;

  /** 외부 참석자 */
  externalParticipants: Array<{
    name: string;
    title?: string;
    email?: string;
    phone?: string;
  }>;

  /** 미팅 결과 */
  outcome?: {
    summary: string;
    nextSteps?: string[];
    followUpDate?: Date;
  };

  /** 기밀 여부 */
  isConfidential: boolean;

  /** NDA 서명 여부 */
  hasNDA?: boolean;
}

/**
 * 일반 일정
 * @description 기타 일반적인 일정
 */
export interface GeneralSchedule extends BaseSchedule {
  /** 스케줄 타입 식별자 */
  type: 'general';

  /** 일정 카테고리 */
  category: 'internal' | 'personal' | 'holiday' | 'other';

  /** 반복 설정 */
  recurrence?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
  };

  /** 알림 설정 */
  reminders?: Array<{
    type: 'email' | 'push' | 'sms';
    minutesBefore: number;
  }>;

  /** 관련 프로젝트 ID (선택적) */
  relatedProjectId?: string;
}

// ============================================================================
// STEP 6: Unified Types and Relationships
// ============================================================================

/**
 * 통합 스케줄 타입
 * @description 모든 스케줄 타입의 Union
 */
export type UnifiedSchedule =
  | BuildupProjectMeeting
  | MentorSession
  | WebinarEvent
  | PMConsultation
  | ExternalMeeting
  | GeneralSchedule;

/**
 * 스케줄 타입 식별자
 */
export type ScheduleType = UnifiedSchedule['type'];

/**
 * 프로젝트-스케줄 연결 관계
 * @description 프로젝트와 관련된 스케줄들의 매핑
 */
export interface ProjectScheduleLink {
  /** 프로젝트 ID */
  projectId: string;

  /** 연결된 스케줄 ID 목록 */
  scheduleIds: string[];

  /** 다음 예정된 미팅 시퀀스 */
  nextMeetingSequence?: MeetingSequence;

  /** 최근 미팅 날짜 */
  lastMeetingDate?: Date;

  /** 전체 미팅 수 */
  totalMeetings: number;

  /** 완료된 미팅 수 */
  completedMeetings: number;

  /** 현재 프로젝트 단계 */
  currentPhase: ProjectPhase;

  /** 마지막 단계 전환 일시 */
  lastPhaseTransitionAt?: Date;
}

/**
 * 스케줄 이벤트
 * @description 스케줄 생성/수정/삭제 이벤트
 */
export interface ScheduleEvent {
  /** 이벤트 ID */
  id: string;

  /** 이벤트 타입 */
  type: 'SCHEDULE_CREATED' | 'SCHEDULE_UPDATED' | 'SCHEDULE_DELETED' | 'SCHEDULE_COMPLETED';

  /** 스케줄 타입 */
  scheduleType: ScheduleType;

  /** 스케줄 ID */
  scheduleId: string;

  /** 이벤트 페이로드 */
  payload: UnifiedSchedule;

  /** 이벤트 발생 시각 */
  timestamp: Date;

  /** 이벤트 발생 소스 */
  source: 'user' | 'system' | 'integration';

  /** 트리거된 액션들 */
  triggeredActions?: {
    phaseTransition?: boolean;
    notification?: boolean;
    chatUpdate?: boolean;
    emailSent?: boolean;
  };

  /** 사용자 ID */
  userId?: string;

  /** 메타데이터 */
  metadata?: Record<string, any>;
}

/**
 * 스케줄 필터 옵션
 * @description 스케줄 검색/필터링 옵션
 */
export interface ScheduleFilterOptions {
  /** 스케줄 타입 필터 */
  types?: ScheduleType[];

  /** 날짜 범위 */
  dateRange?: {
    start: Date;
    end: Date;
  };

  /** 프로젝트 ID */
  projectId?: string;

  /** 상태 필터 */
  statuses?: ScheduleStatus[];

  /** 우선순위 필터 */
  priorities?: SchedulePriority[];

  /** 참석자 필터 */
  participants?: string[];

  /** 검색어 */
  searchTerm?: string;

  /** 정렬 옵션 */
  sortBy?: 'date' | 'priority' | 'title';

  /** 정렬 방향 */
  sortDirection?: 'asc' | 'desc';

  /** 페이지네이션 */
  pagination?: {
    page: number;
    limit: number;
  };
}

/**
 * 스케줄 통계
 * @description 스케줄 관련 통계 정보
 */
export interface ScheduleStatistics {
  /** 전체 스케줄 수 */
  total: number;

  /** 타입별 스케줄 수 */
  byType: Record<ScheduleType, number>;

  /** 상태별 스케줄 수 */
  byStatus: Record<ScheduleStatus, number>;

  /** 이번 주 스케줄 수 */
  thisWeek: number;

  /** 이번 달 스케줄 수 */
  thisMonth: number;

  /** 긴급 스케줄 수 */
  urgent: number;

  /** 완료율 */
  completionRate: number;

  /** 프로젝트별 스케줄 수 */
  byProject?: Record<string, number>;
}

// ============================================================================
// STEP 7: Type Guards
// ============================================================================

/**
 * 빌드업 프로젝트 미팅 타입 가드
 */
export function isBuildupProjectMeeting(schedule: UnifiedSchedule): schedule is BuildupProjectMeeting {
  return schedule.type === 'buildup_project';
}

/**
 * 멘토 세션 타입 가드
 */
export function isMentorSession(schedule: UnifiedSchedule): schedule is MentorSession {
  return schedule.type === 'mentor_session';
}

/**
 * 웨비나 이벤트 타입 가드
 */
export function isWebinarEvent(schedule: UnifiedSchedule): schedule is WebinarEvent {
  return schedule.type === 'webinar';
}

/**
 * PM 상담 타입 가드
 */
export function isPMConsultation(schedule: UnifiedSchedule): schedule is PMConsultation {
  return schedule.type === 'pm_consultation';
}

/**
 * 외부 미팅 타입 가드
 */
export function isExternalMeeting(schedule: UnifiedSchedule): schedule is ExternalMeeting {
  return schedule.type === 'external';
}

/**
 * 일반 일정 타입 가드
 */
export function isGeneralSchedule(schedule: UnifiedSchedule): schedule is GeneralSchedule {
  return schedule.type === 'general';
}

/**
 * 프로젝트 관련 스케줄 체크
 * @description 프로젝트와 연결된 스케줄인지 확인
 */
export function isProjectRelatedSchedule(schedule: UnifiedSchedule): boolean {
  if (isBuildupProjectMeeting(schedule)) {
    return true;
  }
  if (isGeneralSchedule(schedule) && schedule.relatedProjectId) {
    return true;
  }
  return false;
}

/**
 * 온라인 미팅 체크
 */
export function isOnlineMeeting(schedule: UnifiedSchedule): boolean {
  const onlineKeywords = ['zoom', 'meet', 'teams', 'webex', 'online', '온라인'];
  const location = schedule.location?.toLowerCase() || '';

  if (onlineKeywords.some(keyword => location.includes(keyword))) {
    return true;
  }

  if (isBuildupProjectMeeting(schedule) && schedule.meetingLink) {
    return true;
  }

  if (isWebinarEvent(schedule)) {
    return true;
  }

  return false;
}

/**
 * 긴급 스케줄 체크
 */
export function isUrgentSchedule(schedule: UnifiedSchedule): boolean {
  return schedule.priority === 'urgent';
}

/**
 * 완료된 스케줄 체크
 */
export function isCompletedSchedule(schedule: UnifiedSchedule): boolean {
  return schedule.status === 'completed';
}

/**
 * 예정된 스케줄 체크
 */
export function isUpcomingSchedule(schedule: UnifiedSchedule): boolean {
  return schedule.status === 'scheduled' && new Date(schedule.date) > new Date();
}

/**
 * 지난 스케줄 체크
 */
export function isPastSchedule(schedule: UnifiedSchedule): boolean {
  return new Date(schedule.date) < new Date() && schedule.status !== 'completed';
}

// ============================================================================
// STEP 8: Validation & Utility Functions
// ============================================================================

/**
 * 스케줄 유효성 검증
 */
export function validateSchedule(schedule: Partial<UnifiedSchedule>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 필수 필드 검증
  if (!schedule.title || schedule.title.trim() === '') {
    errors.push('제목은 필수입니다');
  }

  if (!schedule.date) {
    errors.push('날짜는 필수입니다');
  }

  if (!schedule.type) {
    errors.push('스케줄 타입은 필수입니다');
  }

  // 타입별 추가 검증
  if (schedule.type === 'buildup_project') {
    const buildupSchedule = schedule as Partial<BuildupProjectMeeting>;
    if (!buildupSchedule.projectId) {
      errors.push('프로젝트 ID는 필수입니다');
    }
    if (!buildupSchedule.meetingSequence) {
      errors.push('미팅 시퀀스는 필수입니다');
    }
    if (!buildupSchedule.pmInfo) {
      errors.push('PM 정보는 필수입니다');
    }
  }

  if (schedule.type === 'mentor_session') {
    const mentorSchedule = schedule as Partial<MentorSession>;
    if (!mentorSchedule.programId) {
      errors.push('프로그램 ID는 필수입니다');
    }
    if (!mentorSchedule.mentorInfo) {
      errors.push('멘토 정보는 필수입니다');
    }
  }

  if (schedule.type === 'webinar') {
    const webinarSchedule = schedule as Partial<WebinarEvent>;
    if (!webinarSchedule.webinarId) {
      errors.push('웨비나 ID는 필수입니다');
    }
    if (!webinarSchedule.topic) {
      errors.push('웨비나 주제는 필수입니다');
    }
  }

  // 날짜 유효성 검증
  if (schedule.date && new Date(schedule.date).toString() === 'Invalid Date') {
    errors.push('유효하지 않은 날짜 형식입니다');
  }

  // 시간 유효성 검증
  if (schedule.time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(schedule.time)) {
    errors.push('시간 형식이 올바르지 않습니다 (HH:mm)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 빌드업 미팅 시퀀스 다음 단계 가져오기
 */
export function getNextMeetingSequence(currentSequence: MeetingSequence): MeetingSequence | null {
  return MEETING_SEQUENCE_INFO[currentSequence].nextSequence;
}

/**
 * 미팅 시퀀스로 예상 단계 가져오기
 */
export function getExpectedPhaseForMeeting(meetingSequence: MeetingSequence): ProjectPhase | null {
  return MEETING_SEQUENCE_INFO[meetingSequence].expectedPhase;
}

/**
 * 단계 전환 트리거 가져오기
 */
export function getPhaseTransitionTrigger(meetingSequence: MeetingSequence): PhaseTransitionTrigger | null {
  return MEETING_PHASE_TRANSITION_RULES[meetingSequence];
}

/**
 * 스케줄 ID 생성
 */
export function generateScheduleId(type: ScheduleType): string {
  const prefix = {
    'buildup_project': 'BPM',
    'mentor_session': 'MTS',
    'webinar': 'WBN',
    'pm_consultation': 'PMC',
    'external': 'EXT',
    'general': 'GEN'
  };

  return `${prefix[type]}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 스케줄 날짜 포맷팅
 */
export function formatScheduleDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short'
  };
  return new Intl.DateTimeFormat('ko-KR', options).format(date);
}

/**
 * 스케줄 시간 포맷팅
 */
export function formatScheduleTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? '오후' : '오전';
  const displayHour = hour > 12 ? hour - 12 : hour || 12;
  return `${period} ${displayHour}:${minutes}`;
}

/**
 * 두 스케줄 간의 충돌 체크
 */
export function checkScheduleConflict(schedule1: BaseSchedule, schedule2: BaseSchedule): boolean {
  if (!schedule1.time || !schedule2.time) {
    return false;
  }

  const date1 = new Date(schedule1.date).toDateString();
  const date2 = new Date(schedule2.date).toDateString();

  if (date1 !== date2) {
    return false;
  }

  // 간단한 시간 충돌 체크 (같은 시간)
  return schedule1.time === schedule2.time;
}

/**
 * 스케줄 우선순위 비교
 */
export function compareSchedulePriority(a: UnifiedSchedule, b: UnifiedSchedule): number {
  const priorityOrder: Record<SchedulePriority, number> = {
    'urgent': 4,
    'high': 3,
    'medium': 2,
    'low': 1
  };

  return priorityOrder[b.priority] - priorityOrder[a.priority];
}

/**
 * 스케줄 날짜 비교
 */
export function compareScheduleDate(a: UnifiedSchedule, b: UnifiedSchedule): number {
  return new Date(a.date).getTime() - new Date(b.date).getTime();
}

/**
 * 스케줄 필터링
 */
export function filterSchedules(
  schedules: UnifiedSchedule[],
  options: ScheduleFilterOptions
): UnifiedSchedule[] {
  let filtered = [...schedules];

  // 타입 필터
  if (options.types && options.types.length > 0) {
    filtered = filtered.filter(s => options.types!.includes(s.type));
  }

  // 날짜 범위 필터
  if (options.dateRange) {
    const { start, end } = options.dateRange;
    filtered = filtered.filter(s => {
      const date = new Date(s.date);
      return date >= start && date <= end;
    });
  }

  // 프로젝트 필터
  if (options.projectId) {
    filtered = filtered.filter(s => {
      if (isBuildupProjectMeeting(s)) {
        return s.projectId === options.projectId;
      }
      if (isGeneralSchedule(s)) {
        return s.relatedProjectId === options.projectId;
      }
      return false;
    });
  }

  // 상태 필터
  if (options.statuses && options.statuses.length > 0) {
    filtered = filtered.filter(s => options.statuses!.includes(s.status));
  }

  // 우선순위 필터
  if (options.priorities && options.priorities.length > 0) {
    filtered = filtered.filter(s => options.priorities!.includes(s.priority));
  }

  // 참석자 필터
  if (options.participants && options.participants.length > 0) {
    filtered = filtered.filter(s =>
      s.participants.some(p => options.participants!.includes(p))
    );
  }

  // 검색어 필터
  if (options.searchTerm) {
    const term = options.searchTerm.toLowerCase();
    filtered = filtered.filter(s =>
      s.title.toLowerCase().includes(term) ||
      s.description?.toLowerCase().includes(term) ||
      s.location?.toLowerCase().includes(term)
    );
  }

  // 정렬
  if (options.sortBy) {
    filtered.sort((a, b) => {
      let result = 0;

      switch (options.sortBy) {
        case 'date':
          result = compareScheduleDate(a, b);
          break;
        case 'priority':
          result = compareSchedulePriority(a, b);
          break;
        case 'title':
          result = a.title.localeCompare(b.title);
          break;
      }

      return options.sortDirection === 'desc' ? -result : result;
    });
  }

  // 페이지네이션
  if (options.pagination) {
    const { page, limit } = options.pagination;
    const start = (page - 1) * limit;
    filtered = filtered.slice(start, start + limit);
  }

  return filtered;
}

/**
 * 스케줄 통계 계산
 */
export function calculateScheduleStatistics(schedules: UnifiedSchedule[]): ScheduleStatistics {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const stats: ScheduleStatistics = {
    total: schedules.length,
    byType: {} as Record<ScheduleType, number>,
    byStatus: {} as Record<ScheduleStatus, number>,
    thisWeek: 0,
    thisMonth: 0,
    urgent: 0,
    completionRate: 0,
    byProject: {}
  };

  // 초기화
  const scheduleTypes: ScheduleType[] = ['buildup_project', 'mentor_session', 'webinar', 'pm_consultation', 'external', 'general'];
  scheduleTypes.forEach(type => stats.byType[type] = 0);

  const statuses: ScheduleStatus[] = ['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'];
  statuses.forEach(status => stats.byStatus[status] = 0);

  // 집계
  schedules.forEach(schedule => {
    // 타입별
    stats.byType[schedule.type] = (stats.byType[schedule.type] || 0) + 1;

    // 상태별
    stats.byStatus[schedule.status] = (stats.byStatus[schedule.status] || 0) + 1;

    // 이번 주
    if (new Date(schedule.date) <= weekFromNow) {
      stats.thisWeek++;
    }

    // 이번 달
    if (new Date(schedule.date) <= monthFromNow) {
      stats.thisMonth++;
    }

    // 긴급
    if (schedule.priority === 'urgent') {
      stats.urgent++;
    }

    // 프로젝트별
    if (isBuildupProjectMeeting(schedule)) {
      const projectId = schedule.projectId;
      stats.byProject![projectId] = (stats.byProject![projectId] || 0) + 1;
    }
  });

  // 완료율 계산
  const completed = stats.byStatus.completed || 0;
  const total = stats.total - (stats.byStatus.cancelled || 0);
  stats.completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return stats;
}

// ============================================================================
// Export Summary
// ============================================================================

// 타입 재수출 for convenience
export type {
  ProjectPhase
} from './buildup.types';