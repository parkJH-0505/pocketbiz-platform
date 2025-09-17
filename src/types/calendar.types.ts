/**
 * 캘린더 이벤트 관련 타입 정의
 * 포켓빌드업 프로젝트의 일정 관리를 위한 통합 타입 시스템
 */

import type { Project } from './buildup.types';

/**
 * 미팅 데이터
 */
import type { EnhancedMeetingData, MeetingType } from './meeting.types';

// MeetingData는 EnhancedMeetingData로 통일
export type MeetingData = EnhancedMeetingData;

/**
 * 액션 기록
 */
export interface ActionRecord {
  type: 'created' | 'updated' | 'completed' | 'rescheduled' | 'cancelled';
  by: string;                // 수행자 (PM ID 또는 Client ID)
  byName: string;            // 수행자 이름
  at: Date;                  // 수행 시간
  comment?: string;          // 액션 코멘트
  previousValue?: any;       // 변경 전 값 (updated의 경우)
}

/**
 * 일정 변경 요청
 */
export interface RescheduleRequest {
  requestedBy: string;       // 요청자 ID
  requestedAt: Date;         // 요청 시간
  originalDate: Date;        // 원래 일정
  proposedDates: Date[];     // 제안 일정들
  reason: string;            // 변경 사유
  status: 'pending' | 'approved' | 'rejected';
  responseComment?: string;  // PM 응답 코멘트
}

/**
 * 캘린더 이벤트 메인 타입
 */
export interface CalendarEvent {
  // ===== 기본 정보 =====
  id: string;
  title: string;
  type: 'meeting';  // 모든 일정은 미팅 타입으로 통일

  // ===== 시간 정보 =====
  date: Date;
  time?: string;              // HH:mm 형식 (미팅만 해당)
  duration?: number;          // 예상 소요시간 (분)
  endDate?: Date;            // 종료일 (여러 날에 걸친 일정)

  // ===== 프로젝트 연결 정보 =====
  projectId: string;
  projectTitle: string;
  projectPhase: string;       // 프로젝트 현재 단계

  // ===== PM 정보 =====
  pmId: string;
  pmName: string;
  pmEmail?: string;
  pmAvatar?: string;

  // ===== 상태 정보 =====
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
  completedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;

  // ===== 중요도 및 긴급도 =====
  priority: 'critical' | 'high' | 'medium' | 'low';
  isUrgent?: boolean;         // D-3 이내 자동 설정

  // ===== 미팅 데이터 =====
  meetingData?: MeetingData;  // EnhancedMeetingData 타입

  // ===== 참여자 정보 =====
  participants?: {
    id: string;
    name: string;
    role: 'host' | 'required' | 'optional';
    confirmed?: boolean;
  }[];

  // ===== 알림 설정 =====
  reminders?: {
    type: 'email' | 'push' | 'sms';
    timing: number;           // 분 단위 (이벤트 전)
    sent?: boolean;
  }[];

  // ===== 액션 기록 =====
  actionHistory: ActionRecord[];
  lastAction?: ActionRecord;

  // ===== 일정 변경 요청 =====
  rescheduleRequest?: RescheduleRequest;

  // ===== 메타데이터 =====
  tags?: string[];            // 검색/필터용 태그
  color?: string;            // 커스텀 색상 (선택)
  isRecurring?: boolean;     // 반복 일정 여부
  recurringPattern?: string;  // 반복 패턴 (예: "weekly", "monthly")

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

/**
 * 캘린더 뷰 타입
 */
export type CalendarView = 'month' | 'week' | 'list' | 'day';

/**
 * 캘린더 필터 옵션
 */
export interface CalendarFilter {
  meetingTypes?: MeetingType[];  // 미팅 타입으로 필터링
  projectIds?: string[];
  pmIds?: string[];
  statuses?: CalendarEvent['status'][];
  priorities?: CalendarEvent['priority'][];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

/**
 * 빠른 액션 타입
 */
export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  type: 'complete' | 'reschedule' | 'cancel' | 'submit' | 'join' | 'contact_pm' | 'view_details';
  enabled: boolean;
  tooltip?: string;
}

/**
 * 일정 충돌 정보
 */
export interface EventConflict {
  conflictingEvent: CalendarEvent;
  conflictType: 'time_overlap' | 'resource_conflict' | 'dependency_conflict';
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestedActions?: {
    label: string;
    action: () => void;
  }[];
}

/**
 * 캘린더 통계
 */
export interface CalendarStats {
  totalEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  overdueEvents: number;

  byMeetingType: {
    pm_meeting: number;
    pocket_mentor: number;
    buildup_project: number;
    pocket_webinar: number;
    external: number;
  };

  byProject: {
    [projectId: string]: {
      projectTitle: string;
      count: number;
      completed: number;
    };
  };

  completionRate: number;      // 완료율 (%)
  avgCompletionTime: number;   // 평균 완료 시간 (일)

  thisWeek: {
    total: number;
    meetings: number;
  };

  nextWeek: {
    total: number;
    meetings: number;
  };
}

/**
 * 미팅 타입별 설정 (meeting.types.ts의 MEETING_TYPE_CONFIG 사용 권장)
 */
export type EventTypeConfig = {
  meeting: {
    label: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
    actions: QuickAction[];
  };
};

/**
 * 캘린더 이벤트 생성/수정 요청 DTO
 */
export interface CalendarEventInput {
  title: string;
  type: 'meeting';  // 미팅 타입만
  date: Date;
  time?: string;
  duration?: number;
  projectId: string;
  priority?: CalendarEvent['priority'];

  // 미팅 데이터
  meetingData?: Partial<MeetingData>;

  participants?: string[];     // 참여자 ID 목록
  tags?: string[];
}

/**
 * 캘린더 이벤트 응답 DTO
 */
export interface CalendarEventResponse extends CalendarEvent {
  _links?: {
    self: string;
    project: string;
    pm: string;
    reschedule?: string;
    complete?: string;
  };
}