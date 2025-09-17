/**
 * 캘린더 메타데이터 관리 시스템
 * 이벤트 카테고리, 태그, 색상, 아이콘 등 통합 관리
 */

import type { CalendarEvent } from '../types/calendar.types';
import type { MeetingType, MeetingCategory } from '../types/meeting.types';
import {
  Calendar, Video, FileText, CheckCircle, Users,
  Briefcase, GraduationCap, Presentation, Building,
  Clock, AlertCircle, Star, Flag, Zap, Circle, XCircle
} from 'lucide-react';

/**
 * 이벤트 카테고리 메타데이터
 */
export const EVENT_CATEGORY_META = {
  '투자 관련': {
    color: 'text-accent-purple',
    bgColor: 'bg-accent-purple/10',
    borderColor: 'border-accent-purple',
    icon: 'TrendingUp',
    priority: 5
  },
  '파트너십': {
    color: 'text-primary-main',
    bgColor: 'bg-primary-light',
    borderColor: 'border-primary-main',
    icon: 'Handshake',
    priority: 4
  },
  '미팅': {
    color: 'text-primary-main',
    bgColor: 'bg-primary-light',
    borderColor: 'border-primary-main',
    icon: 'Video',
    priority: 3
  },
  '외부미팅': {
    color: 'text-neutral-lighter',
    bgColor: 'bg-neutral-lightest',
    borderColor: 'border-neutral-lighter',
    icon: 'Building',
    priority: 3
  },
  '내부미팅': {
    color: 'text-primary-sub',
    bgColor: 'bg-primary-sub/10',
    borderColor: 'border-primary-sub',
    icon: 'Users',
    priority: 2
  },
  '교육/멘토링': {
    color: 'text-accent-purple',
    bgColor: 'bg-accent-purple/10',
    borderColor: 'border-accent-purple',
    icon: 'GraduationCap',
    priority: 2
  },
  '웨비나': {
    color: 'text-accent-orange',
    bgColor: 'bg-accent-orange/10',
    borderColor: 'border-accent-orange',
    icon: 'Presentation',
    priority: 1
  }
} as const;

/**
 * 이벤트 태그 시스템
 */
export interface EventTag {
  id: string;
  label: string;
  color: string;
  icon?: string;
  category: 'project' | 'phase' | 'type' | 'priority' | 'custom';
}

export const DEFAULT_EVENT_TAGS: EventTag[] = [
  // 프로젝트 단계 태그
  { id: 'tag-contracting', label: '계약 단계', color: 'blue', category: 'phase' },
  { id: 'tag-planning', label: '기획 단계', color: 'purple', category: 'phase' },
  { id: 'tag-design', label: '디자인 단계', color: 'pink', category: 'phase' },
  { id: 'tag-execution', label: '실행 단계', color: 'green', category: 'phase' },
  { id: 'tag-testing', label: '테스트 단계', color: 'orange', category: 'phase' },
  { id: 'tag-review', label: '검토 단계', color: 'yellow', category: 'phase' },
  { id: 'tag-deployment', label: '배포 단계', color: 'red', category: 'phase' },

  // 우선순위 태그
  { id: 'tag-urgent', label: '긴급', color: 'red', icon: 'AlertTriangle', category: 'priority' },
  { id: 'tag-important', label: '중요', color: 'orange', icon: 'Star', category: 'priority' },
  { id: 'tag-routine', label: '정기', color: 'gray', icon: 'Clock', category: 'priority' },

  // 타입 태그
  { id: 'tag-kickoff', label: '킥오프', color: 'green', icon: 'Rocket', category: 'type' },
  { id: 'tag-checkpoint', label: '체크포인트', color: 'blue', icon: 'Flag', category: 'type' },
  { id: 'tag-feedback', label: '피드백', color: 'purple', icon: 'MessageCircle', category: 'type' },
  { id: 'tag-approval', label: '승인 필요', color: 'yellow', icon: 'CheckCircle', category: 'type' }
];

/**
 * 이벤트 색상 팔레트
 */
export const EVENT_COLOR_PALETTE = {
  // 기본 색상
  default: '#6366F1',
  primary: '#3B82F6',
  secondary: '#8B5CF6',

  // 상태별 색상
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',

  // 우선순위별 색상
  critical: '#DC2626',
  high: '#F97316',
  medium: '#FCD34D',
  low: '#9CA3AF',

  // 미팅 타입별 색상
  pm_meeting: '#3B82F6',
  pocket_mentor: '#8B5CF6',
  buildup_project: '#10B981',
  pocket_webinar: '#F97316',
  external: '#6B7280'
} as const;

/**
 * 이벤트 아이콘 매핑
 */
export const EVENT_ICON_MAP = {
  // 이벤트 타입별
  meeting: Video,
  review: CheckCircle,

  // 미팅 타입별
  pm_meeting: Users,
  pocket_mentor: GraduationCap,
  buildup_project: Briefcase,
  pocket_webinar: Presentation,
  external: Building,

  // 우선순위별
  critical: AlertCircle,
  high: Zap,
  medium: Flag,
  low: Circle,

  // 상태별
  scheduled: Clock,
  completed: CheckCircle,
  cancelled: XCircle,
  rescheduled: Calendar
} as const;

/**
 * 이벤트 필터 프리셋
 */
export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filter: {
    types?: CalendarEvent['type'][];
    priorities?: CalendarEvent['priority'][];
    statuses?: CalendarEvent['status'][];
    tags?: string[];
    dateRange?: {
      type: 'today' | 'thisWeek' | 'nextWeek' | 'thisMonth' | 'custom';
      start?: Date;
      end?: Date;
    };
  };
  icon: string;
  color: string;
}

export const DEFAULT_FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'today-urgent',
    name: '오늘의 긴급 일정',
    description: '오늘 처리해야 할 중요한 일정',
    filter: {
      priorities: ['critical', 'high'],
      statuses: ['scheduled'],
      dateRange: { type: 'today' }
    },
    icon: 'AlertCircle',
    color: 'red'
  },
  {
    id: 'this-week-meetings',
    name: '이번 주 미팅',
    description: '이번 주 예정된 모든 미팅',
    filter: {
      types: ['meeting'],
      statuses: ['scheduled'],
      dateRange: { type: 'thisWeek' }
    },
    icon: 'Video',
    color: 'blue'
  },
  {
    id: 'upcoming-meetings',
    name: '예정된 미팅',
    description: '앞으로 예정된 모든 미팅',
    filter: {
      statuses: ['scheduled']
    },
    icon: 'Calendar',
    color: 'blue'
  },
  {
    id: 'pm-meetings',
    name: 'PM 정기 미팅',
    description: '포켓비즈 PM과의 정기 미팅',
    filter: {
      statuses: ['scheduled'],
      tags: ['pm_meeting']
    },
    icon: 'Users',
    color: 'purple'
  },
  {
    id: 'overdue',
    name: '지연된 일정',
    description: '기한이 지난 미완료 일정',
    filter: {
      statuses: ['scheduled'],
      dateRange: {
        type: 'custom',
        end: new Date()
      }
    },
    icon: 'Clock',
    color: 'red'
  }
];

/**
 * 이벤트 통계 카테고리
 */
export interface EventStatCategory {
  id: string;
  label: string;
  icon: any;
  color: string;
  value: number;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
}

/**
 * 이벤트 메타데이터 유틸리티
 */
export class EventMetadataUtils {
  /**
   * 이벤트에서 카테고리 추출
   */
  static getCategoryFromEvent(event: CalendarEvent): MeetingCategory | undefined {
    if (event.type !== 'meeting' || !event.meetingData) return undefined;

    const meetingData = event.meetingData as any;
    if (!meetingData.meetingType) return '미팅';

    // meeting.types.ts의 MEETING_TYPE_CONFIG 참조
    const categoryMap: Record<MeetingType, MeetingCategory> = {
      pm_meeting: '내부미팅',
      pocket_mentor: '교육/멘토링',
      buildup_project: '내부미팅',
      pocket_webinar: '웨비나',
      external: '외부미팅'
    };

    return categoryMap[meetingData.meetingType as MeetingType];
  }

  /**
   * 이벤트 색상 가져오기
   */
  static getEventColor(event: CalendarEvent): string {
    // 미팅 타입 기반 (미팅 타입을 최우선으로)
    if (event.type === 'meeting' && event.meetingData) {
      const meetingData = event.meetingData as any;
      const meetingType = meetingData.meetingType;
      if (meetingType && EVENT_COLOR_PALETTE[meetingType as keyof typeof EVENT_COLOR_PALETTE]) {
        return EVENT_COLOR_PALETTE[meetingType as keyof typeof EVENT_COLOR_PALETTE];
      }
    }

    // 타입 기반
    if (event.type === 'review') return EVENT_COLOR_PALETTE.warning;

    // 우선순위 기반 (fallback)
    if (event.priority === 'critical') return EVENT_COLOR_PALETTE.critical;
    if (event.priority === 'high') return EVENT_COLOR_PALETTE.high;

    return EVENT_COLOR_PALETTE.default;
  }

  /**
   * 이벤트 아이콘 가져오기
   */
  static getEventIcon(event: CalendarEvent): any {
    // 미팅 타입 기반 (최우선)
    if (event.type === 'meeting' && event.meetingData) {
      const meetingData = event.meetingData as any;
      const meetingType = meetingData.meetingType;
      if (meetingType && EVENT_ICON_MAP[meetingType as keyof typeof EVENT_ICON_MAP]) {
        return EVENT_ICON_MAP[meetingType as keyof typeof EVENT_ICON_MAP];
      }
    }

    // 상태 기반 (완료/취소 상태는 보여줘야 함)
    if (event.status === 'completed') return EVENT_ICON_MAP.completed;
    if (event.status === 'cancelled') return EVENT_ICON_MAP.cancelled;

    // 우선순위 기반 (fallback)
    if (event.priority === 'critical') return EVENT_ICON_MAP.critical;
    if (event.priority === 'high') return EVENT_ICON_MAP.high;

    // 기본 타입 기반
    return EVENT_ICON_MAP[event.type] || EVENT_ICON_MAP.scheduled;
  }

  /**
   * 이벤트 태그 생성
   */
  static generateEventTags(event: CalendarEvent): EventTag[] {
    const tags: EventTag[] = [];

    // 단계 태그
    const phaseTag = DEFAULT_EVENT_TAGS.find(t =>
      t.id === `tag-${event.projectPhase}`
    );
    if (phaseTag) tags.push(phaseTag);

    // 우선순위 태그
    if (event.priority === 'critical' || event.priority === 'high') {
      const priorityTag = DEFAULT_EVENT_TAGS.find(t =>
        t.id === 'tag-urgent'
      );
      if (priorityTag) tags.push(priorityTag);
    }

    // 타입별 태그
    if (event.type === 'meeting' && event.meetingData) {
      const meetingData = event.meetingData as any;

      // 킥오프 미팅 체크
      if (meetingData.buildupProjectData?.미팅목적 === 'kickoff') {
        const kickoffTag = DEFAULT_EVENT_TAGS.find(t => t.id === 'tag-kickoff');
        if (kickoffTag) tags.push(kickoffTag);
      }

      // 정기 미팅 체크
      if (meetingData.pmMeetingData?.세션회차) {
        const routineTag = DEFAULT_EVENT_TAGS.find(t => t.id === 'tag-routine');
        if (routineTag) tags.push(routineTag);
      }
    }

    // 검토 타입 태그
    if (event.type === 'review' && event.reviewData?.feedbackRequired) {
      const feedbackTag = DEFAULT_EVENT_TAGS.find(t => t.id === 'tag-feedback');
      if (feedbackTag) tags.push(feedbackTag);
    }

    return tags;
  }

  /**
   * 이벤트 중요도 점수 계산
   */
  static calculateImportanceScore(event: CalendarEvent): number {
    let score = 0;

    // 우선순위 기반 점수
    const priorityScores = {
      critical: 40,
      high: 30,
      medium: 20,
      low: 10
    };
    score += priorityScores[event.priority];

    // 카테고리 기반 점수
    const category = this.getCategoryFromEvent(event);
    if (category && EVENT_CATEGORY_META[category]) {
      score += EVENT_CATEGORY_META[category].priority * 5;
    }

    // 긴급도 기반 점수 (날짜 근접성)
    const daysUntil = Math.ceil((event.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 0) score += 30; // 오늘 또는 지난 일정
    else if (daysUntil <= 1) score += 25; // 내일
    else if (daysUntil <= 3) score += 20; // 3일 이내
    else if (daysUntil <= 7) score += 10; // 일주일 이내

    // 참여자 수 기반 점수
    if (event.participants && event.participants.length > 5) score += 10;

    return Math.min(100, score); // 최대 100점
  }

  /**
   * 날짜별 이벤트 밀도 계산
   */
  static calculateEventDensity(events: CalendarEvent[], date: Date): 'low' | 'medium' | 'high' {
    const dayEvents = events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate.getFullYear() === date.getFullYear() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getDate() === date.getDate();
    });

    const totalDuration = dayEvents.reduce((sum, event) => {
      if (event.type === 'meeting' && event.duration) {
        return sum + event.duration;
      }
      return sum + 60; // 기본 60분
    }, 0);

    // 총 업무 시간 대비 비율
    const workHours = 8 * 60; // 8시간 = 480분
    const densityRatio = totalDuration / workHours;

    if (densityRatio <= 0.25) return 'low';
    if (densityRatio <= 0.5) return 'medium';
    return 'high';
  }

  /**
   * 이벤트 그룹화 키 생성
   */
  static getGroupingKey(event: CalendarEvent, groupBy: 'date' | 'type' | 'project' | 'priority'): string {
    switch (groupBy) {
      case 'date':
        return event.date.toISOString().split('T')[0];
      case 'type':
        return event.type;
      case 'project':
        return event.projectId;
      case 'priority':
        return event.priority;
      default:
        return 'default';
    }
  }
}

/**
 * 캘린더 뷰 설정
 */
export interface CalendarViewConfig {
  showWeekends: boolean;
  showWeekNumbers: boolean;
  firstDayOfWeek: 0 | 1; // 0: Sunday, 1: Monday
  workingHours: {
    start: string; // HH:mm
    end: string;   // HH:mm
  };
  eventDisplay: {
    showTime: boolean;
    showLocation: boolean;
    showParticipants: boolean;
    showTags: boolean;
    condensed: boolean;
  };
  colorScheme: 'priority' | 'type' | 'project' | 'category';
}

export const DEFAULT_CALENDAR_VIEW_CONFIG: CalendarViewConfig = {
  showWeekends: true,
  showWeekNumbers: false,
  firstDayOfWeek: 1, // Monday
  workingHours: {
    start: '09:00',
    end: '18:00'
  },
  eventDisplay: {
    showTime: true,
    showLocation: true,
    showParticipants: false,
    showTags: true,
    condensed: false
  },
  colorScheme: 'priority'
};