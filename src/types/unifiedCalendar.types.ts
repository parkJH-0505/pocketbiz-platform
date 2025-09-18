/**
 * 통합 캘린더 타입 정의
 *
 * 스마트매칭 이벤트와 빌드업 캘린더 일정을 통합하여
 * 성장 캘린더에서 함께 표시하기 위한 타입 시스템
 */

import type { SmartMatchingEvent, MatchingResult, EventCategory } from './smartMatching/types';
import type { CalendarEvent } from './calendar.types';

/**
 * 통합 캘린더 이벤트 소스 타입
 */
export type EventSourceType = 'smart_matching' | 'buildup_schedule' | 'user_created';

/**
 * 스마트매칭 이벤트 마감일 관련 정보
 */
export interface SmartMatchingEventDeadline {
  applicationStartDate: Date;
  applicationEndDate: Date;
  daysUntilDeadline: number;
  urgencyLevel: 'low' | 'medium' | 'high';
  isExpired: boolean;
}

/**
 * 스마트매칭 이벤트의 캘린더 표시 정보
 */
export interface SmartMatchingCalendarEvent {
  // 기본 식별 정보
  id: string;
  sourceType: 'smart_matching';
  originalEventId: string;

  // 캘린더 표시 정보
  title: string;
  date: Date; // applicationEndDate를 기준으로 설정
  description: string;

  // 스마트매칭 특화 정보
  category: EventCategory;
  hostOrganization: string;
  supportField: string;
  fundingAmount?: string;
  matchingScore: number;
  matchingReasons: string[];

  // 마감일 정보
  deadline: SmartMatchingEventDeadline;

  // 표시 스타일
  color: string;
  bgColor: string;
  borderColor: string;

  // 원본 데이터 참조
  originalEvent: SmartMatchingEvent;
  matchingResult?: MatchingResult;
}

/**
 * 빌드업 일정의 캘린더 표시 정보
 */
export interface BuildupCalendarEvent {
  // 기본 식별 정보
  id: string;
  sourceType: 'buildup_schedule';
  originalEventId: string;

  // 캘린더 표시 정보
  title: string;
  date: Date;
  time?: string;
  description?: string;

  // 빌드업 특화 정보
  projectId: string;
  projectTitle: string;
  pmName: string;
  meetingType?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

  // 표시 스타일
  color: string;
  bgColor: string;
  borderColor: string;

  // 원본 데이터 참조
  originalEvent: CalendarEvent;
}

/**
 * 사용자 생성 일정
 */
export interface UserCreatedEvent {
  // 기본 식별 정보
  id: string;
  sourceType: 'user_created';

  // 캘린더 표시 정보
  title: string;
  date: Date;
  time?: string;
  description?: string;

  // 사용자 정의 정보
  category: 'meeting' | 'deadline' | 'reminder' | 'personal';
  priority: 'high' | 'medium' | 'low';

  // 표시 스타일
  color: string;
  bgColor: string;
  borderColor: string;

  // 메타 정보
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 통합 캘린더 이벤트 (Union Type)
 */
export type UnifiedCalendarEvent =
  | SmartMatchingCalendarEvent
  | BuildupCalendarEvent
  | UserCreatedEvent;

/**
 * 이벤트 카테고리별 색상 및 스타일 설정
 */
export interface EventCategoryStyle {
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon?: string;
}

/**
 * 스마트매칭 이벤트 카테고리별 스타일
 */
export const SMART_MATCHING_CATEGORY_STYLES: Record<EventCategory, EventCategoryStyle> = {
  government_support: {
    color: '#3B82F6',      // blue-500
    bgColor: '#DBEAFE',    // blue-100
    borderColor: '#93C5FD', // blue-300
    textColor: '#1E40AF',   // blue-800
    icon: '🏛️'
  },
  tips_program: {
    color: '#6366F1',      // indigo-500
    bgColor: '#E0E7FF',    // indigo-100
    borderColor: '#A5B4FC', // indigo-300
    textColor: '#3730A3',   // indigo-800
    icon: '🚀'
  },
  vc_opportunity: {
    color: '#8B5CF6',      // violet-500
    bgColor: '#EDE9FE',    // violet-100
    borderColor: '#C4B5FD', // violet-300
    textColor: '#5B21B6',   // violet-800
    icon: '💰'
  },
  accelerator: {
    color: '#F97316',      // orange-500
    bgColor: '#FED7AA',    // orange-100
    borderColor: '#FDBA74', // orange-300
    textColor: '#C2410C',   // orange-800
    icon: '⚡'
  },
  open_innovation: {
    color: '#10B981',      // emerald-500
    bgColor: '#D1FAE5',    // emerald-100
    borderColor: '#6EE7B7', // emerald-300
    textColor: '#047857',   // emerald-800
    icon: '🔗'
  },
  loan_program: {
    color: '#06B6D4',      // cyan-500
    bgColor: '#CFFAFE',    // cyan-100
    borderColor: '#67E8F9', // cyan-300
    textColor: '#0E7490',   // cyan-800
    icon: '🏦'
  },
  bidding: {
    color: '#8B5A2B',      // amber-700
    bgColor: '#FEF3C7',    // amber-100
    borderColor: '#FCD34D', // amber-300
    textColor: '#92400E',   // amber-800
    icon: '📋'
  },
  batch_program: {
    color: '#EC4899',      // pink-500
    bgColor: '#FCE7F3',    // pink-100
    borderColor: '#F9A8D4', // pink-300
    textColor: '#BE185D',   // pink-800
    icon: '👥'
  },
  conference: {
    color: '#6B7280',      // gray-500
    bgColor: '#F3F4F6',    // gray-100
    borderColor: '#D1D5DB', // gray-300
    textColor: '#374151',   // gray-700
    icon: '🎤'
  },
  seminar: {
    color: '#6B7280',      // gray-500
    bgColor: '#F3F4F6',    // gray-100
    borderColor: '#D1D5DB', // gray-300
    textColor: '#374151',   // gray-700
    icon: '📚'
  }
};

/**
 * 빌드업 일정 타입별 스타일
 */
export const BUILDUP_EVENT_STYLES = {
  meeting: {
    color: '#059669',      // emerald-600
    bgColor: '#ECFDF5',    // emerald-50
    borderColor: '#A7F3D0', // emerald-200
    textColor: '#064E3B'    // emerald-900
  },
  deadline: {
    color: '#DC2626',      // red-600
    bgColor: '#FEF2F2',    // red-50
    borderColor: '#FECACA', // red-200
    textColor: '#7F1D1D'    // red-900
  }
};

/**
 * 사용자 생성 일정 스타일
 */
export const USER_CREATED_EVENT_STYLES = {
  meeting: {
    color: '#7C3AED',      // violet-600
    bgColor: '#F5F3FF',    // violet-50
    borderColor: '#C4B5FD', // violet-300
    textColor: '#4C1D95'    // violet-900
  },
  deadline: {
    color: '#DC2626',      // red-600
    bgColor: '#FEF2F2',    // red-50
    borderColor: '#FECACA', // red-200
    textColor: '#7F1D1D'    // red-900
  },
  reminder: {
    color: '#2563EB',      // blue-600
    bgColor: '#EFF6FF',    // blue-50
    borderColor: '#BFDBFE', // blue-200
    textColor: '#1E3A8A'    // blue-900
  },
  personal: {
    color: '#059669',      // emerald-600
    bgColor: '#ECFDF5',    // emerald-50
    borderColor: '#A7F3D0', // emerald-200
    textColor: '#064E3B'    // emerald-900
  }
};

/**
 * 통합 캘린더 필터 옵션
 */
export interface UnifiedCalendarFilter {
  sourcesTypes?: EventSourceType[];
  smartMatchingCategories?: EventCategory[];
  buildupStatuses?: CalendarEvent['status'][];
  userCategories?: UserCreatedEvent['category'][];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
  showExpired?: boolean; // 마감 지난 스마트매칭 이벤트 표시 여부
}

/**
 * 호버 툴팁 정보
 */
export interface EventTooltipData {
  // 공통 정보
  title: string;
  date: string;
  time?: string;
  description?: string;

  // 스마트매칭 이벤트 특화 정보
  smartMatching?: {
    category: string;
    hostOrganization: string;
    fundingAmount?: string;
    matchingScore: number;
    daysUntilDeadline: number;
    applicationPeriod: string;
    supportField: string;
  };

  // 빌드업 일정 특화 정보
  buildup?: {
    projectTitle: string;
    pmName: string;
    meetingType?: string;
    priority: string;
    status: string;
  };

  // 사용자 생성 일정 특화 정보
  userCreated?: {
    category: string;
    priority: string;
  };
}

/**
 * 데이터 변환 함수들의 결과 타입
 */
export interface EventTransformationResult {
  success: boolean;
  event?: UnifiedCalendarEvent;
  error?: string;
}

/**
 * 통합 캘린더 상태
 */
export interface UnifiedCalendarState {
  events: UnifiedCalendarEvent[];
  filteredEvents: UnifiedCalendarEvent[];
  filter: UnifiedCalendarFilter;
  view: 'month' | 'week' | 'list';
  selectedDate: Date | null;
  selectedEvent: UnifiedCalendarEvent | null;
  loading: boolean;
  error: string | null;
}