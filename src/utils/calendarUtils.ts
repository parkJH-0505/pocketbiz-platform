/**
 * 캘린더 관련 유틸리티 함수
 */

import type { CalendarEvent, EventTypeConfig, QuickAction, EventConflict } from '../types/calendar.types';
import type { EnhancedMeetingData } from '../types/meeting.types';

/**
 * 미팅 기본 설정 (MEETING_TYPE_CONFIG 사용 권장)
 */
export const EVENT_TYPE_CONFIG: EventTypeConfig = {
  meeting: {
    label: '미팅',
    icon: 'Video',
    color: 'text-primary-main',
    bgColor: 'bg-primary-light',
    borderColor: 'border-primary-main/30',
    actions: [
      { id: 'join', label: '참여하기', icon: 'Video', type: 'join', enabled: true },
      { id: 'complete', label: '완료', icon: 'Check', type: 'complete', enabled: true },
      { id: 'reschedule', label: '일정 변경', icon: 'Calendar', type: 'reschedule', enabled: true },
      { id: 'contact_pm', label: 'PM 문의', icon: 'MessageCircle', type: 'contact_pm', enabled: true }
    ]
  }
};

/**
 * D-Day 계산
 */
export const calculateDDay = (targetDate: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * D-Day 표시 텍스트
 */
export const getDDayText = (date: Date): string => {
  const dDay = calculateDDay(date);

  if (dDay === 0) return '오늘';
  if (dDay === 1) return '내일';
  if (dDay === -1) return '어제';
  if (dDay > 0) return `D-${dDay}`;
  return `D+${Math.abs(dDay)}`;
};

/**
 * 긴급도 판단 (D-3 이내)
 */
export const isUrgent = (event: CalendarEvent): boolean => {
  if (event.status === 'completed' || event.status === 'cancelled') return false;

  const dDay = calculateDDay(event.date);
  return dDay >= 0 && dDay <= 3;
};

/**
 * 시간 중복 체크
 */
export const checkTimeOverlap = (
  time1: string,
  time2: string,
  duration1?: number,
  duration2?: number
): boolean => {
  if (!time1 || !time2) return false;

  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);

  const start1 = h1 * 60 + m1;
  const end1 = start1 + (duration1 || 60);

  const start2 = h2 * 60 + m2;
  const end2 = start2 + (duration2 || 60);

  return (start1 < end2 && end1 > start2);
};

/**
 * 일정 충돌 감지
 */
export const detectConflicts = (
  newEvent: CalendarEvent,
  existingEvents: CalendarEvent[]
): EventConflict[] => {
  const conflicts: EventConflict[] = [];

  // 미팅 시간 충돌 체크
  if (newEvent.type === 'meeting' && newEvent.time) {
    existingEvents.forEach(event => {
      if (
        event.id !== newEvent.id &&
        event.type === 'meeting' &&
        event.status === 'scheduled' &&
        event.time &&
        isSameDay(event.date, newEvent.date) &&
        checkTimeOverlap(event.time, newEvent.time, event.duration, newEvent.duration)
      ) {
        conflicts.push({
          conflictingEvent: event,
          conflictType: 'time_overlap',
          severity: 'error',
          message: `"${event.title}" 미팅과 시간이 겹칩니다`,
          suggestedActions: [
            {
              label: '30분 뒤로 변경',
              action: () => console.log('Reschedule +30min')
            },
            {
              label: '1시간 뒤로 변경',
              action: () => console.log('Reschedule +1hour')
            }
          ]
        });
      }
    });
  }

  // 같은 PM과의 중복 미팅 체크 (정보 수준)
  const sameDayPMMeetings = existingEvents.filter(event =>
    event.id !== newEvent.id &&
    event.type === 'meeting' &&
    event.status === 'scheduled' &&
    event.pmId === newEvent.pmId &&
    isSameDay(event.date, newEvent.date)
  );

  if (sameDayPMMeetings.length > 1) {
    conflicts.push({
      conflictingEvent: sameDayPMMeetings[0],
      conflictType: 'resource_conflict',
      severity: 'info',
      message: `같은 날 ${newEvent.pmName}과 ${sameDayPMMeetings.length}개의 다른 미팅이 있습니다`,
      suggestedActions: []
    });
  }

  return conflicts;
};

/**
 * 같은 날짜 체크
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

/**
 * 이번 주 체크
 */
export const isThisWeek = (date: Date): boolean => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return date >= startOfWeek && date <= endOfWeek;
};

/**
 * 다음 주 체크
 */
export const isNextWeek = (date: Date): boolean => {
  const today = new Date();
  const startOfNextWeek = new Date(today);
  startOfNextWeek.setDate(today.getDate() - today.getDay() + 7);
  startOfNextWeek.setHours(0, 0, 0, 0);

  const endOfNextWeek = new Date(startOfNextWeek);
  endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
  endOfNextWeek.setHours(23, 59, 59, 999);

  return date >= startOfNextWeek && date <= endOfNextWeek;
};

/**
 * 가능한 시간대 추천
 */
export const suggestAvailableTimes = (
  date: Date,
  duration: number,
  existingEvents: CalendarEvent[]
): string[] => {
  const workingHours = [9, 10, 11, 14, 15, 16, 17];
  const availableSlots: string[] = [];

  const dayEvents = existingEvents.filter(event =>
    event.type === 'meeting' &&
    event.status === 'scheduled' &&
    isSameDay(event.date, date)
  );

  workingHours.forEach(hour => {
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    let hasConflict = false;

    dayEvents.forEach(event => {
      if (event.time && checkTimeOverlap(timeStr, event.time, duration, event.duration)) {
        hasConflict = true;
      }
    });

    if (!hasConflict) {
      availableSlots.push(timeStr);
    }
  });

  return availableSlots.slice(0, 3); // 최대 3개 추천
};

/**
 * 이벤트 상태별 스타일
 */
export const getEventStatusStyle = (status: CalendarEvent['status']) => {
  switch(status) {
    case 'completed':
      return 'opacity-60 line-through';
    case 'cancelled':
      return 'opacity-40 line-through';
    case 'in_progress':
      return 'ring-2 ring-primary-main animate-pulse';
    case 'rescheduled':
      return 'italic';
    default:
      return '';
  }
};

/**
 * 우선순위별 색상
 */
export const getPriorityColor = (priority: CalendarEvent['priority']) => {
  switch(priority) {
    case 'critical':
      return 'text-accent-red border-accent-red';
    case 'high':
      return 'text-accent-orange border-accent-orange';
    case 'medium':
      return 'text-accent-yellow border-accent-yellow';
    case 'low':
      return 'text-neutral-lighter border-neutral-lighter';
    default:
      return '';
  }
};

/**
 * 상대 시간 표시
 */
export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString('ko-KR');
};

/**
 * 이벤트 그룹화 (날짜별)
 */
export const groupEventsByDate = (events: CalendarEvent[]): Map<string, CalendarEvent[]> => {
  const grouped = new Map<string, CalendarEvent[]>();

  events.forEach(event => {
    const dateKey = event.date.toISOString().split('T')[0];
    const existing = grouped.get(dateKey) || [];
    grouped.set(dateKey, [...existing, event]);
  });

  // 날짜순 정렬
  const sorted = new Map(
    Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  );

  return sorted;
};

/**
 * Mock 이벤트 생성 헬퍼
 */
export const createMockEvent = (
  type: 'meeting',
  projectId: string,
  projectTitle: string,
  pmId: string,
  pmName: string,
  date: Date,
  overrides?: Partial<CalendarEvent>
): CalendarEvent => {
  const baseEvent: CalendarEvent = {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: '',
    type,
    date,
    projectId,
    projectTitle,
    projectPhase: 'execution',
    pmId,
    pmName,
    status: 'scheduled',
    priority: 'medium',
    actionHistory: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: pmId,
    updatedBy: pmId,
    ...overrides
  };

  // 타입별 기본값 설정
  switch(type) {
    case 'meeting':
      baseEvent.title = overrides?.title || '정기 미팅';
      baseEvent.time = overrides?.time || '14:00';
      baseEvent.duration = overrides?.duration || 60;
      // EnhancedMeetingData가 이미 제공되면 사용, 아니면 기본값 생성
      if (overrides?.meetingData) {
        baseEvent.meetingData = overrides.meetingData;
      } else {
        const defaultMeetingData: Partial<EnhancedMeetingData> = {
          meetingType: 'buildup_project',
          title: baseEvent.title,
          날짜: date,
          시작시간: baseEvent.time || '14:00',
          종료시간: '15:00',
          location: 'online',
          status: 'scheduled',
          buildupProjectData: {
            프로젝트명: projectTitle,
            프로젝트ID: projectId,
            미팅목적: 'progress',
            PM명: pmName,
            참여자목록: [],
            아젠다: '프로젝트 진행 상황 점검'
          }
        };
        baseEvent.meetingData = defaultMeetingData as EnhancedMeetingData;
      }
      break;

    // review 타입 제거 - 모든 일정은 meeting 타입으로 통일
  }

  return baseEvent;
};