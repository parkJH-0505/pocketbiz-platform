/**
 * 포켓비즈 미팅 관련 타입 정의
 * PM미팅, 포켓멘토, 빌드업 프로젝트 미팅, 포켓 웨비나 등
 */

/**
 * 미팅 타입
 */
export type MeetingType =
  | 'pm_meeting'        // PM미팅 (포켓비즈 구독 기반)
  | 'pocket_mentor'     // 포켓멘토 세션 (LMS 서비스)
  | 'buildup_project'   // 빌드업 프로젝트 미팅
  | 'pocket_webinar'    // 포켓 웨비나
  | 'external';         // 외부 미팅

/**
 * PM 미팅 전용 데이터
 */
export interface PMMeetingData {
  // 기본 속성
  담당PM: string;
  PM직함: string;
  세션회차: number;

  // 내부 속성
  아젠다: string;
  직전미팅내용?: string;

  // 커스텀 속성 (미팅 후 추가)
  녹음파일?: string;
  전사스크립트?: string;
  미팅노트?: string;
  액션아이템?: string[];
}

/**
 * 포켓멘토 세션 데이터
 */
export interface PocketMentorData {
  멘토명: string;
  멘토직함: string;
  세션주제: string;
  세션회차: number;

  // 세션 자료
  강의자료?: string;
  과제?: string;
  피드백?: string;

  // 녹화 및 기록
  녹화링크?: string;
  세션요약?: string;
}

/**
 * 빌드업 프로젝트 미팅 데이터
 */
export interface BuildupProjectMeetingData {
  프로젝트명: string;
  프로젝트ID: string;
  미팅목적: 'kickoff' | 'progress' | 'review' | 'closing' | 'other';

  // 참여자
  PM명: string;
  참여자목록: string[];

  // 미팅 내용
  아젠다: string;
  결정사항?: string[];
  후속조치?: string[];
}

/**
 * 포켓 웨비나 데이터
 */
export interface PocketWebinarData {
  웨비나제목: string;
  발표자: string;
  발표자소속: string;

  // 웨비나 정보
  예상참여자수?: number;
  실제참여자수?: number;
  웨비나링크?: string;

  // 자료
  발표자료?: string;
  녹화영상?: string;
  QnA요약?: string;
}

/**
 * 외부 미팅 데이터
 */
export interface ExternalMeetingData {
  미팅제목: string;
  회사명?: string;
  담당자명?: string;
  미팅목적?: string;

  // 위치 정보
  장소?: string;
  온라인링크?: string;

  // 기록
  미팅메모?: string;
  명함사진?: string;
  후속액션?: string[];
}

/**
 * 통합 미팅 데이터
 * calendar.types.ts의 MeetingData를 대체
 */
export interface EnhancedMeetingData {
  // 미팅 타입
  meetingType: MeetingType;

  // 공통 속성
  title: string;
  날짜: Date;
  시작시간: string;    // HH:mm
  종료시간: string;    // HH:mm

  // 위치 정보
  location?: 'online' | 'offline' | 'hybrid';
  meetingLink?: string;   // Zoom, Google Meet 등
  offlineLocation?: string;  // 오프라인 장소

  // 타입별 전용 데이터
  pmMeetingData?: PMMeetingData;
  pocketMentorData?: PocketMentorData;
  buildupProjectData?: BuildupProjectMeetingData;
  pocketWebinarData?: PocketWebinarData;
  externalMeetingData?: ExternalMeetingData;

  // 참여자 관리
  participants?: {
    id: string;
    name: string;
    email?: string;
    role: 'host' | 'required' | 'optional';
    confirmed?: boolean;
    attended?: boolean;
  }[];

  // 알림 설정
  reminders?: {
    type: 'email' | 'push' | 'sms';
    timing: number;  // 분 단위 (미팅 전)
    sent?: boolean;
  }[];

  // 상태 관리
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
  completedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;

  // 메타데이터
  tags?: string[];
  color?: string;
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'biweekly' | 'monthly';

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

/**
 * 미팅 카테고리 (필터링용)
 */
export type MeetingCategory =
  | '투자 관련'
  | '파트너십'
  | '미팅'
  | '외부미팅'
  | '내부미팅'
  | '교육/멘토링'
  | '웨비나';

/**
 * 미팅 타입별 설정
 */
export const MEETING_TYPE_CONFIG: Record<MeetingType, {
  label: string;
  category: MeetingCategory;
  defaultDuration: number;  // 분
  color: string;
  icon: string;
  requiredFields: string[];
}> = {
  pm_meeting: {
    label: 'PM 미팅',
    category: '내부미팅',
    defaultDuration: 60,
    color: 'blue',
    icon: 'Users',
    requiredFields: ['담당PM', 'PM직함', '세션회차', '아젠다']
  },
  pocket_mentor: {
    label: '포켓멘토 세션',
    category: '교육/멘토링',
    defaultDuration: 90,
    color: 'purple',
    icon: 'GraduationCap',
    requiredFields: ['멘토명', '세션주제', '세션회차']
  },
  buildup_project: {
    label: '빌드업 프로젝트 미팅',
    category: '내부미팅',
    defaultDuration: 60,
    color: 'green',
    icon: 'Briefcase',
    requiredFields: ['프로젝트명', '미팅목적', 'PM명']
  },
  pocket_webinar: {
    label: '포켓 웨비나',
    category: '웨비나',
    defaultDuration: 120,
    color: 'orange',
    icon: 'Presentation',
    requiredFields: ['웨비나제목', '발표자']
  },
  external: {
    label: '외부 미팅',
    category: '외부미팅',
    defaultDuration: 60,
    color: 'gray',
    icon: 'Building',
    requiredFields: ['미팅제목']
  }
};

/**
 * 미팅 생성 입력 DTO
 */
export interface CreateMeetingInput {
  meetingType: MeetingType;
  title: string;
  날짜: Date;
  시작시간: string;
  종료시간?: string;  // 없으면 defaultDuration 사용

  location?: 'online' | 'offline' | 'hybrid';
  meetingLink?: string;
  offlineLocation?: string;

  // 타입별 데이터 중 하나만 제공
  meetingData:
    | { type: 'pm_meeting'; data: Partial<PMMeetingData> }
    | { type: 'pocket_mentor'; data: Partial<PocketMentorData> }
    | { type: 'buildup_project'; data: Partial<BuildupProjectMeetingData> }
    | { type: 'pocket_webinar'; data: Partial<PocketWebinarData> }
    | { type: 'external'; data: Partial<ExternalMeetingData> };

  participants?: string[];  // 참여자 ID 목록
  reminders?: Array<{ type: 'email' | 'push'; timing: number }>;
  tags?: string[];
  category?: MeetingCategory;
}

/**
 * 미팅 검색 필터
 */
export interface MeetingFilter {
  meetingTypes?: MeetingType[];
  categories?: MeetingCategory[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  participants?: string[];
  projectId?: string;
  pmId?: string;
  mentorId?: string;
  status?: Array<'scheduled' | 'completed' | 'cancelled'>;
  searchQuery?: string;
}

// ===========================================
// 빌드업 프로젝트 가이드미팅 기록 시스템
// ===========================================

/**
 * 가이드미팅 타입 (빌드업 프로젝트 전용)
 */
export type GuideMeetingType = 'pre' | 'guide';
export type GuideMeetingStatus = 'scheduled' | 'completed' | 'cancelled';

/**
 * 미팅 첨부파일
 */
export interface MeetingAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
  uploadedBy: string;
}

/**
 * PM이 작성하는 미팅 메모
 */
export interface GuideMeetingMemo {
  id: string;
  summary: string;                    // 미팅 요약
  discussions: string[];              // 주요 논의사항
  decisions: string[];                // 결정사항
  actionItems: string[];              // 액션 아이템
  nextSteps?: string;                 // 다음 단계
  attachments: MeetingAttachment[];   // 첨부파일
  createdBy: string;                  // PM ID
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 고객이 작성하는 미팅 댓글
 */
export interface GuideMeetingComment {
  id: string;
  meetingId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorType: 'customer' | 'pm';
  createdAt: Date;
  isReadByPM: boolean;
  readAt?: Date;
  attachments?: MeetingAttachment[];
  reactions?: {
    emoji: string;
    count: number;
    userIds: string[];
  }[];
  // 답글 기능
  parentId?: string;
  replies?: GuideMeetingComment[];
}

/**
 * 가이드미팅 기록 (빌드업 프로젝트 전용)
 */
export interface GuideMeetingRecord {
  id: string;
  projectId: string;
  type: GuideMeetingType;
  round?: number;                     // 가이드미팅 회차 (1, 2, 3...)
  title: string;                      // "프리미팅", "가이드미팅 1차" 등
  date: Date;
  duration?: number;                  // 분 단위
  location?: string;
  meetingLink?: string;
  status: GuideMeetingStatus;

  // 참석자 정보
  participants: {
    pm: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
    customer: {
      id: string;
      name: string;
      company?: string;
    };
    others?: {
      id: string;
      name: string;
      role: string;
    }[];
  };

  // PM이 작성하는 미팅 메모 (관리자 페이지에서 작성)
  memo?: GuideMeetingMemo;

  // 고객 피드백/댓글 (프로젝트 상세 페이지에서 작성)
  comments: GuideMeetingComment[];

  // PM 확인 상태
  pmLastChecked?: Date;
  unreadCommentCount: number;

  // 자동 태그
  tags: string[];                     // ['기획', '디자인', '개발'] 등

  // 메타데이터
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 미팅 기록 필터링 옵션
 */
export type GuideMeetingFilter = 'all' | 'completed' | 'scheduled' | 'with-comments' | 'unread';

/**
 * 미팅 기록 정렬 옵션
 */
export type GuideMeetingSortBy = 'date-desc' | 'date-asc' | 'round-desc' | 'round-asc';

/**
 * 미팅 기록 상태 (Context)
 */
export interface GuideMeetingState {
  meetings: Record<string, GuideMeetingRecord[]>; // projectId를 키로 사용
  selectedMeeting: GuideMeetingRecord | null;
  filter: GuideMeetingFilter;
  sortBy: GuideMeetingSortBy;
  isLoading: boolean;
  error: string | null;
}

/**
 * API 요청 타입들
 */
export interface CreateMeetingCommentRequest {
  meetingId: string;
  content: string;
  attachments?: File[];
  parentId?: string; // 답글인 경우
}

export interface UpdateMeetingMemoRequest {
  meetingId: string;
  memo: Omit<GuideMeetingMemo, 'id' | 'createdAt' | 'updatedAt'>;
}

export interface MarkCommentsAsReadRequest {
  meetingId: string;
  commentIds?: string[]; // 없으면 모든 댓글 읽음 처리
}

/**
 * 미팅 회차별 기본 제목
 */
export const GUIDE_MEETING_TITLES: Record<string, string> = {
  'pre': '프리미팅',
  'guide-1': '가이드미팅 1차',
  'guide-2': '가이드미팅 2차',
  'guide-3': '가이드미팅 3차',
  'guide-4': '가이드미팅 4차',
  'guide-5': '가이드미팅 5차'
};

/**
 * 미팅 상태별 색상
 */
export const GUIDE_MEETING_STATUS_CONFIG = {
  scheduled: {
    label: '예정',
    color: 'text-blue-600 bg-blue-50',
    icon: 'Calendar'
  },
  completed: {
    label: '완료',
    color: 'text-green-600 bg-green-50',
    icon: 'CheckCircle'
  },
  cancelled: {
    label: '취소',
    color: 'text-red-600 bg-red-50',
    icon: 'XCircle'
  }
};