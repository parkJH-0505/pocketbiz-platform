/**
 * 통합 캘린더 유틸리티 함수들
 *
 * 스마트매칭 이벤트와 빌드업 일정을 통합 캘린더 이벤트로 변환하고
 * 표시에 필요한 다양한 유틸리티 함수들을 제공
 */

import type { SmartMatchingEvent, MatchingResult } from '../types/smartMatching/types';
import type { CalendarEvent } from '../types/calendar.types';
import type {
  UnifiedCalendarEvent,
  SmartMatchingCalendarEvent,
  BuildupCalendarEvent,
  UserCreatedEvent,
  EventTooltipData,
  EventTransformationResult
} from '../types/unifiedCalendar.types';
import {
  SMART_MATCHING_CATEGORY_STYLES,
  BUILDUP_EVENT_STYLES,
  USER_CREATED_EVENT_STYLES
} from '../types/unifiedCalendar.types';

/**
 * 스마트매칭 이벤트를 통합 캘린더 이벤트로 변환
 */
export function transformSmartMatchingEvent(
  matchingResult: MatchingResult
): EventTransformationResult {
  try {
    const { event, score, matchingReasons, urgencyLevel, daysUntilDeadline } = matchingResult;


    // 카테고리별 스타일 가져오기
    const categoryStyle = SMART_MATCHING_CATEGORY_STYLES[event.category];

    // 마감일 정보 계산
    const deadline = {
      applicationStartDate: event.applicationStartDate,
      applicationEndDate: event.applicationEndDate,
      daysUntilDeadline,
      urgencyLevel,
      isExpired: daysUntilDeadline < 0
    };

    // 제목 포맷팅 (D-day 포함)
    const dDayText = daysUntilDeadline > 0
      ? `D-${daysUntilDeadline}`
      : daysUntilDeadline === 0
        ? 'D-Day'
        : `D+${Math.abs(daysUntilDeadline)}`;

    const title = deadline.isExpired
      ? `[마감] ${event.title}`
      : `[${dDayText}] ${event.title}`;

    // 지원금 정보 추출
    let fundingAmount: string | undefined;
    if ('supportAmount' in event) {
      fundingAmount = event.supportAmount;
    } else if ('fundingAmount' in event) {
      fundingAmount = event.fundingAmount;
    } else if ('investmentAmount' in event) {
      fundingAmount = event.investmentAmount;
    } else if ('loanAmount' in event) {
      fundingAmount = event.loanAmount;
    }

    // 주관기관 정보 추출
    let hostOrganization = '';
    if ('hostOrganization' in event) {
      hostOrganization = event.hostOrganization;
    } else if ('demandOrganization' in event) {
      hostOrganization = event.demandOrganization;
    } else if ('vcName' in event) {
      hostOrganization = event.vcName;
    } else if ('acceleratorName' in event) {
      hostOrganization = event.acceleratorName;
    }

    // 지원분야 정보 추출
    let supportField = '';
    if ('supportField' in event && (event as any).supportField) {
      supportField = (event as any).supportField;
    } else if ('focusAreas' in event && event.focusAreas) {
      supportField = event.focusAreas.join(', ');
    } else if ('mentorship' in event && event.mentorship) {
      supportField = event.mentorship.join(', ');
    }

    const transformedEvent: SmartMatchingCalendarEvent = {
      id: `sm_${event.id}`,
      sourceType: 'smart_matching',
      originalEventId: event.id,

      title,
      date: event.applicationEndDate,
      description: event.description,

      category: event.category,
      hostOrganization,
      supportField,
      fundingAmount,
      matchingScore: score,
      matchingReasons,

      deadline,

      color: categoryStyle.color,
      bgColor: categoryStyle.bgColor,
      borderColor: categoryStyle.borderColor,

      originalEvent: event,
      matchingResult: matchingResult
    };

    return { success: true, event: transformedEvent };
  } catch (error) {
    return {
      success: false,
      error: `스마트매칭 이벤트 변환 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * 빌드업 캘린더 이벤트를 통합 캘린더 이벤트로 변환
 */
export function transformBuildupEvent(
  calendarEvent: CalendarEvent
): EventTransformationResult {
  try {
    // 빌드업 이벤트는 항상 meeting 타입이므로 meeting 스타일 사용
    const eventStyle = BUILDUP_EVENT_STYLES.meeting;

    // 우선순위별 색상 조정
    let color = eventStyle.color;
    let borderColor = eventStyle.borderColor;

    if (calendarEvent.priority === 'critical') {
      color = '#DC2626'; // red-600
      borderColor = '#FECACA'; // red-200
    } else if (calendarEvent.priority === 'high') {
      color = '#F59E0B'; // amber-500
      borderColor = '#FED7AA'; // amber-200
    }

    const transformedEvent: BuildupCalendarEvent = {
      id: `bu_${calendarEvent.id}`,
      sourceType: 'buildup_schedule',
      originalEventId: calendarEvent.id,

      title: calendarEvent.title,
      date: calendarEvent.date,
      time: calendarEvent.time,
      description: calendarEvent.meetingData?.agenda || calendarEvent.title,

      projectId: calendarEvent.projectId,
      projectTitle: calendarEvent.projectTitle,
      pmName: calendarEvent.pmName,
      meetingType: calendarEvent.meetingData?.type,
      priority: calendarEvent.priority,
      status: calendarEvent.status,

      color,
      bgColor: eventStyle.bgColor,
      borderColor,

      originalEvent: calendarEvent
    };

    return { success: true, event: transformedEvent };
  } catch (error) {
    return {
      success: false,
      error: `빌드업 이벤트 변환 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * 사용자 생성 이벤트 생성
 */
export function createUserEvent(data: {
  title: string;
  date: Date;
  time?: string;
  description?: string;
  category: UserCreatedEvent['category'];
  priority: UserCreatedEvent['priority'];
}): EventTransformationResult {
  try {
    const eventStyle = USER_CREATED_EVENT_STYLES[data.category];

    const userEvent: UserCreatedEvent = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceType: 'user_created',

      title: data.title,
      date: data.date,
      time: data.time,
      description: data.description,

      category: data.category,
      priority: data.priority,

      color: eventStyle.color,
      bgColor: eventStyle.bgColor,
      borderColor: eventStyle.borderColor,

      createdAt: new Date(),
      updatedAt: new Date()
    };

    return { success: true, event: userEvent };
  } catch (error) {
    return {
      success: false,
      error: `사용자 이벤트 생성 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * 날짜가 같은지 확인
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

/**
 * 이벤트의 긴급도 확인
 */
export function isUrgentEvent(event: UnifiedCalendarEvent): boolean {
  if (event.sourceType === 'smart_matching') {
    return event.deadline.urgencyLevel === 'high' || event.deadline.daysUntilDeadline <= 3;
  } else if (event.sourceType === 'buildup_schedule') {
    return event.priority === 'critical' || event.priority === 'high';
  } else {
    return event.priority === 'high';
  }
}

/**
 * 이벤트 툴팁 데이터 생성
 */
export function generateTooltipData(event: UnifiedCalendarEvent): EventTooltipData {
  const baseData: EventTooltipData = {
    title: event.title,
    date: event.date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }),
    time: event.sourceType === 'buildup_schedule' ? event.time : undefined,
    description: event.description || event.title
  };

  if (event.sourceType === 'smart_matching') {
    baseData.smartMatching = {
      category: getCategoryLabel(event.category),
      hostOrganization: event.hostOrganization,
      fundingAmount: event.fundingAmount,
      matchingScore: event.matchingScore,
      daysUntilDeadline: event.deadline.daysUntilDeadline,
      applicationPeriod: `${event.deadline.applicationStartDate.toLocaleDateString('ko-KR')} ~ ${event.deadline.applicationEndDate.toLocaleDateString('ko-KR')}`,
      supportField: event.supportField
    };
  } else if (event.sourceType === 'buildup_schedule') {
    baseData.buildup = {
      projectTitle: event.projectTitle,
      pmName: event.pmName,
      meetingType: event.meetingType,
      priority: getPriorityLabel(event.priority),
      status: getStatusLabel(event.status)
    };
  } else if (event.sourceType === 'user_created') {
    baseData.userCreated = {
      category: getUserCategoryLabel(event.category),
      priority: event.priority === 'high' ? '높음' : event.priority === 'medium' ? '보통' : '낮음'
    };
  }

  return baseData;
}

/**
 * 카테고리 라벨 변환
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    government_support: '정부지원사업',
    tips_program: 'TIPS/R&D',
    vc_opportunity: 'VC/투자',
    accelerator: '액셀러레이터',
    open_innovation: '오픈이노베이션',
    loan_program: '융자/보증',
    bidding: '입찰',
    batch_program: '배치프로그램',
    conference: '컨퍼런스',
    seminar: '세미나'
  };
  return labels[category] || category;
}

/**
 * 우선순위 라벨 변환
 */
export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    critical: '매우높음',
    high: '높음',
    medium: '보통',
    low: '낮음'
  };
  return labels[priority] || priority;
}

/**
 * 상태 라벨 변환
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    scheduled: '예정',
    in_progress: '진행중',
    completed: '완료',
    cancelled: '취소',
    rescheduled: '일정변경'
  };
  return labels[status] || status;
}

/**
 * 사용자 카테고리 라벨 변환
 */
export function getUserCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    meeting: '미팅',
    deadline: '마감일',
    reminder: '리마인더',
    personal: '개인일정'
  };
  return labels[category] || category;
}

/**
 * D-Day 텍스트 생성
 */
export function getDDayText(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return `D-${diffDays}`;
  } else if (diffDays === 0) {
    return 'D-Day';
  } else {
    return `D+${Math.abs(diffDays)}`;
  }
}

/**
 * 이벤트 정렬 함수
 */
export function sortEvents(events: UnifiedCalendarEvent[], sortBy: 'date' | 'priority' | 'category' = 'date'): UnifiedCalendarEvent[] {
  return [...events].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return a.date.getTime() - b.date.getTime();

      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = a.sourceType === 'buildup_schedule'
          ? (a.priority === 'critical' ? 4 : priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
          : a.sourceType === 'user_created'
            ? priorityOrder[a.priority as keyof typeof priorityOrder] || 0
            : isUrgentEvent(a) ? 3 : 1;

        const bPriority = b.sourceType === 'buildup_schedule'
          ? (b.priority === 'critical' ? 4 : priorityOrder[b.priority as keyof typeof priorityOrder] || 0)
          : b.sourceType === 'user_created'
            ? priorityOrder[b.priority as keyof typeof priorityOrder] || 0
            : isUrgentEvent(b) ? 3 : 1;

        return bPriority - aPriority;

      case 'category':
        const aCategory = a.sourceType === 'smart_matching' ? a.category
                        : a.sourceType === 'buildup_schedule' ? 'buildup'
                        : a.category;
        const bCategory = b.sourceType === 'smart_matching' ? b.category
                        : b.sourceType === 'buildup_schedule' ? 'buildup'
                        : b.category;
        return aCategory.localeCompare(bCategory);

      default:
        return 0;
    }
  });
}

/**
 * 이벤트 필터링 함수
 */
export function filterEvents(
  events: UnifiedCalendarEvent[],
  filter: any
): UnifiedCalendarEvent[] {
  return events.filter(event => {
    // 소스 타입 필터
    if (filter.sourcesTypes && filter.sourcesTypes.length > 0) {
      if (!filter.sourcesTypes.includes(event.sourceType)) {
        return false;
      }
    }

    // 스마트매칭 카테고리 필터
    if (filter.smartMatchingCategories && filter.smartMatchingCategories.length > 0) {
      if (event.sourceType === 'smart_matching' && !filter.smartMatchingCategories.includes(event.category)) {
        return false;
      }
    }

    // 빌드업 상태 필터
    if (filter.buildupStatuses && filter.buildupStatuses.length > 0) {
      if (event.sourceType === 'buildup_schedule' && !filter.buildupStatuses.includes(event.status)) {
        return false;
      }
    }

    // 날짜 범위 필터
    if (filter.dateRange) {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);

      if (filter.dateRange.start) {
        const startDate = new Date(filter.dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        if (eventDate < startDate) return false;
      }

      if (filter.dateRange.end) {
        const endDate = new Date(filter.dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        if (eventDate > endDate) return false;
      }
    }

    // 검색 쿼리 필터
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      const searchTargets = [
        event.title,
        event.description || '',
        event.sourceType === 'smart_matching' ? event.hostOrganization : '',
        event.sourceType === 'buildup_schedule' ? event.projectTitle : '',
        event.sourceType === 'buildup_schedule' ? event.pmName : ''
      ].join(' ').toLowerCase();

      if (!searchTargets.includes(query)) {
        return false;
      }
    }

    // 만료된 스마트매칭 이벤트 필터
    if (!filter.showExpired && event.sourceType === 'smart_matching') {
      if (event.deadline.isExpired) {
        return false;
      }
    }

    return true;
  });
}