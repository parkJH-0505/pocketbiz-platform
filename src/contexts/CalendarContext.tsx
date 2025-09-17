/**
 * CalendarContext.tsx
 *
 * 캘린더 이벤트 전용 Context
 * BuildupContext와 연동하여 프로젝트 기반 일정 관리
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type {
  CalendarEvent,
  CalendarEventInput,
  CalendarFilter,
  CalendarStats,
  EventConflict,
  RescheduleRequest,
  ActionRecord,
  QuickAction
} from '../types/calendar.types';
import type { Project } from '../types/buildup.types';
import type {
  EnhancedMeetingData,
  MeetingType,
  PMMeetingData,
  BuildupProjectMeetingData
} from '../types/meeting.types';
import {
  calculateDDay,
  detectConflicts,
  groupEventsByDate,
  isThisWeek,
  isNextWeek,
  createMockEvent
} from '../utils/calendarUtils';
import { CalendarService } from '../services/calendarService';
import { useBuildupContext } from './BuildupContext';
import { useChatContext } from './ChatContext';
import {
  globalIntegrationManager,
  initializeIntegrationSystem,
  updateCalendarEventOnMeetingCompletion,
  updateEventsOnPhaseTransition,
  type IntegrationEvent
} from '../utils/calendarMeetingIntegration';
import type { GuideMeetingRecord } from '../types/meeting.types';
// import { PhaseTransitionService } from '../services/phaseTransitionService';

interface CalendarContextType {
  // Events
  events: CalendarEvent[];
  loadingEvents: boolean;

  // CRUD Operations
  createEvent: (input: CalendarEventInput) => Promise<CalendarEvent>;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;

  // Event Actions
  completeEvent: (eventId: string, notes?: string) => Promise<void>;
  rescheduleEvent: (eventId: string, newDate: Date, reason: string) => Promise<void>;
  cancelEvent: (eventId: string, reason: string) => Promise<void>;
  submitDeliverable: (eventId: string, fileUrl: string, comment?: string) => Promise<void>;

  // Phase Transition Integration
  handleMeetingCompleted: (eventId: string, notes?: string) => Promise<void>;

  // Filtering & Search
  filter: CalendarFilter;
  setFilter: (filter: Partial<CalendarFilter>) => void;
  filteredEvents: CalendarEvent[];
  searchEvents: (query: string) => CalendarEvent[];

  // Grouping
  eventsByDate: Map<string, CalendarEvent[]>;
  todayEvents: CalendarEvent[];
  thisWeekEvents: CalendarEvent[];
  nextWeekEvents: CalendarEvent[];
  overdueEvents: CalendarEvent[];

  // Statistics
  stats: CalendarStats;

  // Conflicts
  checkConflicts: (event: CalendarEvent) => EventConflict[];

  // Quick Actions
  executeQuickAction: (eventId: string, actionType: QuickAction['type']) => Promise<void>;

  // PM Communication
  contactPMAboutEvent: (eventId: string, message?: string) => void;

  // Reschedule Requests
  pendingReschedules: RescheduleRequest[];
  approveReschedule: (eventId: string) => Promise<void>;
  rejectReschedule: (eventId: string, comment: string) => Promise<void>;

  // Sync with Projects
  syncWithProjects: () => void;
  generateEventsFromProject: (project: Project) => CalendarEvent[];

  // Calendar-Meeting Integration
  linkEventToMeetingRecord: (eventId: string, meetingRecordId: string) => void;
  findMeetingRecordByEvent: (eventId: string) => GuideMeetingRecord | null;
  findEventByMeetingRecord: (meetingRecordId: string) => CalendarEvent | null;
  onMeetingCompleted: (meetingRecord: GuideMeetingRecord) => void;
  onPhaseTransition: (projectId: string, fromPhase: string, toPhase: string, triggeredBy: string) => void;
  getIntegrationStatus: (projectId: string) => any;
  integrationEvents: IntegrationEvent[];
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const { projects, activeProjects } = useBuildupContext();
  const { openChatWithPM } = useChatContext();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [filter, setFilterState] = useState<CalendarFilter>({});
  const [integrationEvents, setIntegrationEvents] = useState<IntegrationEvent[]>([]);

  // 통합 이벤트 리스너 등록
  useEffect(() => {
    const handleIntegrationEvent = (event: IntegrationEvent) => {
      setIntegrationEvents(prev => [...prev, event]);

      // 캘린더 이벤트 업데이트가 필요한 경우
      if (event.type === 'meeting_completed' || event.type === 'phase_transition_applied') {
        setEvents(CalendarService.getAllEvents());
      }
    };

    globalIntegrationManager.addEventListener(handleIntegrationEvent);

    return () => {
      globalIntegrationManager.removeEventListener(handleIntegrationEvent);
    };
  }, []);

  /**
   * 프로젝트에서 이벤트 생성
   */
  const generateEventsFromProject = useCallback((project: Project): CalendarEvent[] => {
    const generatedEvents: CalendarEvent[] = [];
    const now = new Date();

    // PM 정보
    const pmId = project.team?.pm?.id || 'pm-default';
    const pmName = project.team?.pm?.name || 'PM';

    // 1. 다음 미팅 일정
    if (project.nextMeeting) {
      // 미팅 타입 결정
      const meetingType: MeetingType = project.nextMeeting.type === 'pm_meeting'
        ? 'pm_meeting'
        : 'buildup_project';

      // 미팅 데이터 구성
      const enhancedMeetingData: Partial<EnhancedMeetingData> = {
        meetingType,
        title: project.nextMeeting.type.replace('_', ' '),
        날짜: new Date(project.nextMeeting.date),
        시작시간: project.nextMeeting.time || '14:00',
        종료시간: '15:00',
        location: 'online',
        meetingLink: project.nextMeeting.meeting_link,
        status: 'scheduled'
      };

      // PM 미팅인 경우 추가 데이터
      if (meetingType === 'pm_meeting') {
        enhancedMeetingData.pmMeetingData = {
          담당PM: pmName,
          PM직함: 'Senior PM',
          세션회차: 1,
          아젠다: project.nextMeeting.agenda
        };
      }

      // 빌드업 프로젝트 미팅인 경우
      if (meetingType === 'buildup_project') {
        enhancedMeetingData.buildupProjectData = {
          프로젝트명: project.title,
          프로젝트ID: project.id,
          미팅목적: 'progress',
          PM명: pmName,
          참여자목록: project.team?.members?.map(m => m.name) || [],
          아젠다: project.nextMeeting.agenda
        };
      }

      generatedEvents.push(createMockEvent(
        'meeting',
        project.id,
        project.title,
        pmId,
        pmName,
        new Date(project.nextMeeting.date),
        {
          title: project.nextMeeting.type.replace('_', ' '),
          meetingData: enhancedMeetingData as EnhancedMeetingData,
          participants: project.team ? [
            { id: pmId, name: pmName, role: 'host', confirmed: true },
            ...(project.team.members || []).map(m => ({
              id: m.id,
              name: m.name,
              role: 'required' as const,
              confirmed: false
            }))
          ] : []
        }
      ));
    }

    // 2. 완료된 미팅들 (과거 기록)
    if (project.meetings) {
      project.meetings
        .filter(meeting => meeting.completed)
        .forEach((meeting, index) => {
          const meetingDate = new Date(meeting.date);
          const meetingType: MeetingType = meeting.type === 'pm_meeting'
            ? 'pm_meeting'
            : 'buildup_project';

          const enhancedMeetingData: Partial<EnhancedMeetingData> = {
            meetingType,
            title: meeting.type.replace('_', ' '),
            날짜: meetingDate,
            시작시간: meeting.time || '14:00',
            종료시간: '15:00',
            location: 'online',
            meetingLink: meeting.meeting_link,
            status: 'completed',
            completedAt: meetingDate
          };

          // PM 미팅 데이터
          if (meetingType === 'pm_meeting') {
            enhancedMeetingData.pmMeetingData = {
              담당PM: pmName,
              PM직함: 'Senior PM',
              세션회차: index + 1,
              아젠다: meeting.agenda,
              미팅노트: meeting.notes
            };
          }

          // 빌드업 프로젝트 미팅 데이터
          if (meetingType === 'buildup_project') {
            enhancedMeetingData.buildupProjectData = {
              프로젝트명: project.title,
              프로젝트ID: project.id,
              미팅목적: 'progress',
              PM명: pmName,
              참여자목록: project.team?.members?.map(m => m.name) || [],
              아젠다: meeting.agenda,
              결정사항: meeting.notes ? [meeting.notes] : []
            };
          }

          generatedEvents.push(createMockEvent(
            'meeting',
            project.id,
            project.title,
            pmId,
            pmName,
            meetingDate,
            {
              title: meeting.type.replace('_', ' '),
              status: 'completed',
              completedAt: meetingDate,
              meetingData: enhancedMeetingData as EnhancedMeetingData
            }
          ));
        });
    }

    // 3. 프로젝트 단계별 자동 미팅 생성
    const phase = project.phase || 'contracting';
    const phaseEvents: { [key: string]: { title: string; type: CalendarEvent['type']; daysFromNow: number }[] } = {
      contracting: [
        { title: '계약 킥오프 미팅', type: 'meeting', daysFromNow: 2 }
      ],
      planning: [
        { title: '기획 리뷰 미팅', type: 'meeting', daysFromNow: 10 }
      ],
      design: [
        { title: '디자인 리뷰 미팅', type: 'meeting', daysFromNow: 14 }
      ],
      execution: [
        { title: '중간 점검 미팅', type: 'meeting', daysFromNow: 7 }
      ],
      review: [
        { title: '최종 검토 미팅', type: 'meeting', daysFromNow: 3 }
      ]
    };

    const currentPhaseEvents = phaseEvents[phase] || [];
    currentPhaseEvents.forEach(eventTemplate => {
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + eventTemplate.daysFromNow);

      // 중복 체크 (같은 제목의 이벤트가 이미 있는지)
      const isDuplicate = generatedEvents.some(e =>
        e.title === eventTemplate.title &&
        Math.abs(e.date.getTime() - eventDate.getTime()) < 24 * 60 * 60 * 1000
      );

      if (!isDuplicate) {
        generatedEvents.push(createMockEvent(
          eventTemplate.type,
          project.id,
          project.title,
          pmId,
          pmName,
          eventDate,
          {
            title: eventTemplate.title,
            priority: 'medium'
          }
        ));
      }
    });

    return generatedEvents;
  }, []);

  /**
   * 프로젝트와 동기화 - CalendarService 사용
   */
  const syncWithProjects = useCallback(() => {
    setLoadingEvents(true);
    try {
      // CalendarService를 통해 더미데이터 생성
      const serviceEvents = CalendarService.initialize(activeProjects);
      setEvents(serviceEvents);
    } finally {
      setLoadingEvents(false);
    }
  }, [activeProjects]);

  // 프로젝트 변경 시 자동 동기화
  useEffect(() => {
    if (activeProjects.length > 0) {
      syncWithProjects();

      // 통합 시스템 초기화
      const currentEvents = CalendarService.getAllEvents();
      initializeIntegrationSystem(currentEvents, []);
    }
  }, [activeProjects, syncWithProjects]);

  /**
   * 필터링된 이벤트
   */
  const filteredEvents = React.useMemo(() => {
    let filtered = [...events];

    // 타입 필터
    if (filter.types && filter.types.length > 0) {
      filtered = filtered.filter(e => filter.types!.includes(e.type));
    }

    // 프로젝트 필터
    if (filter.projectIds && filter.projectIds.length > 0) {
      filtered = filtered.filter(e => filter.projectIds!.includes(e.projectId));
    }

    // 상태 필터
    if (filter.statuses && filter.statuses.length > 0) {
      filtered = filtered.filter(e => filter.statuses!.includes(e.status));
    }

    // 날짜 범위 필터
    if (filter.dateRange) {
      filtered = filtered.filter(e =>
        e.date >= filter.dateRange!.start &&
        e.date <= filter.dateRange!.end
      );
    }

    // 검색어 필터
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(query) ||
        e.projectTitle.toLowerCase().includes(query) ||
        e.pmName.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events, filter]);

  /**
   * 이벤트 그룹핑
   */
  const eventsByDate = React.useMemo(() =>
    groupEventsByDate(filteredEvents), [filteredEvents]
  );

  const todayEvents = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return filteredEvents.filter(e =>
      e.date >= today && e.date < tomorrow &&
      e.status !== 'completed' && e.status !== 'cancelled'
    );
  }, [filteredEvents]);

  const thisWeekEvents = React.useMemo(() =>
    filteredEvents.filter(e => isThisWeek(e.date) && e.status === 'scheduled'),
    [filteredEvents]
  );

  const nextWeekEvents = React.useMemo(() =>
    filteredEvents.filter(e => isNextWeek(e.date) && e.status === 'scheduled'),
    [filteredEvents]
  );

  const overdueEvents = React.useMemo(() => {
    const now = new Date();
    return filteredEvents.filter(e =>
      e.date < now &&
      e.status === 'scheduled'
    );
  }, [filteredEvents]);

  /**
   * 통계
   */
  const stats: CalendarStats = React.useMemo(() => {
    const completed = events.filter(e => e.status === 'completed');
    const byProject: CalendarStats['byProject'] = {};

    // 미팅 타입별 카운트 초기화
    const byMeetingType = {
      pm_meeting: 0,
      pocket_mentor: 0,
      buildup_project: 0,
      pocket_webinar: 0,
      external: 0
    };

    events.forEach(event => {
      // 프로젝트별 카운트
      if (!byProject[event.projectId]) {
        byProject[event.projectId] = {
          projectTitle: event.projectTitle,
          count: 0,
          completed: 0
        };
      }
      byProject[event.projectId].count++;
      if (event.status === 'completed') {
        byProject[event.projectId].completed++;
      }

      // 미팅 타입별 카운트
      if (event.meetingData) {
        const meetingData = event.meetingData as EnhancedMeetingData;
        if (meetingData.meetingType && byMeetingType[meetingData.meetingType] !== undefined) {
          byMeetingType[meetingData.meetingType]++;
        }
      }
    });

    return {
      totalEvents: events.length,
      upcomingEvents: events.filter(e => e.status === 'scheduled').length,
      completedEvents: completed.length,
      overdueEvents: overdueEvents.length,
      byMeetingType,
      byProject,
      completionRate: events.length > 0 ? (completed.length / events.length) * 100 : 0,
      avgCompletionTime: 0, // TODO: Calculate average
      thisWeek: {
        total: thisWeekEvents.length,
        meetings: thisWeekEvents.length  // 모든 이벤트가 meeting 타입
      },
      nextWeek: {
        total: nextWeekEvents.length,
        meetings: nextWeekEvents.length  // 모든 이벤트가 meeting 타입
      }
    };
  }, [events, overdueEvents, thisWeekEvents, nextWeekEvents]);

  /**
   * 이벤트 생성
   */
  const createEvent = useCallback(async (input: CalendarEventInput): Promise<CalendarEvent> => {
    const project = projects.find(p => p.id === input.projectId);
    const newEvent: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title: input.title,
      type: 'meeting',
      date: input.date,
      time: input.time,
      duration: input.duration,
      projectId: input.projectId,
      projectTitle: project?.title || '',
      projectPhase: project?.phase || 'planning',
      pmId: project?.team?.pm?.id || '',
      pmName: project?.team?.pm?.name || '',
      status: 'scheduled',
      priority: input.priority || 'medium',
      meetingData: input.meetingData as any,
      actionHistory: [{
        type: 'created',
        by: 'user',
        byName: 'User',
        at: new Date()
      }],
      tags: input.tags,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user',
      updatedBy: 'user'
    };

    // CalendarService에도 추가
    const addedEvent = CalendarService.addEvent(newEvent);

    // 통합 시스템에 등록
    globalIntegrationManager.registerCalendarEvent(addedEvent);

    setEvents(CalendarService.getAllEvents());
    return addedEvent;
  }, [projects]);

  /**
   * 이벤트 업데이트
   */
  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    const updatedEvent = CalendarService.updateEvent(eventId, {
      ...updates,
      updatedAt: new Date(),
      updatedBy: 'user'
    });

    if (updatedEvent) {
      setEvents(CalendarService.getAllEvents());
    }
  }, []);

  /**
   * 이벤트 완료 처리
   */
  const completeEvent = useCallback(async (eventId: string, notes?: string) => {
    await updateEvent(eventId, {
      status: 'completed',
      completedAt: new Date(),
      lastAction: {
        type: 'completed',
        by: 'user',
        byName: 'User',
        at: new Date(),
        comment: notes
      }
    });
  }, [updateEvent]);

  /**
   * 미팅 완료 처리 및 단계 전환 트리거
   */
  const handleMeetingCompleted = useCallback(async (eventId: string, notes?: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) {
      console.warn(`Event not found: ${eventId}`);
      return;
    }

    try {
      // 1. 이벤트를 완료 상태로 업데이트
      await completeEvent(eventId, notes);

      // 2. 프로젝트와 연결된 미팅인지 확인
      if (!event.projectId) {
        console.log(`Event ${eventId} is not linked to a project`);
        return;
      }

      // 3. 미팅 기록 생성
      const meetingRecord: GuideMeetingRecord = {
        id: `meeting-${Date.now()}`,
        calendarEventId: eventId,
        projectId: event.projectId,
        type: 'guide_meeting', // 가이드 미팅으로 설정
        completedAt: new Date(),
        attendees: event.attendees || [],
        notes: notes || '',
        status: 'completed',
        outcome: 'successful'
      };

      // 4. Phase Transition Service 호출
      const pmId = event.pmId || 'pm-business-support';
      const transitionEvent = PhaseTransitionService.handleMeetingCompleted(
        event.projectId,
        meetingRecord,
        pmId
      );

      if (transitionEvent) {
        console.log(`✅ 미팅 완료 처리: ${event.title}`);
        console.log(`🔄 단계 전환 이벤트 생성: ${transitionEvent.fromPhase} → ${transitionEvent.toPhase}`);
      } else {
        console.log(`📝 미팅 완료 기록됨 (단계 전환 없음): ${event.title}`);
      }

    } catch (error) {
      console.error('Error handling meeting completion:', error);
    }
  }, [events, completeEvent]);

  /**
   * PM에게 문의
   */
  const contactPMAboutEvent = useCallback((eventId: string, message?: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const defaultMessage = message || `안녕하세요! "${event.title}" 일정 관련 문의드립니다.`;

    openChatWithPM(
      event.pmId,
      {
        name: event.pmName,
        email: event.pmEmail || '',
        avatar: event.pmAvatar
      },
      projects.filter(p => p.id === event.projectId)
    );

    // TODO: 자동으로 메시지 전송
    console.log('Opening chat with message:', defaultMessage);
  }, [events, openChatWithPM, projects]);

  /**
   * 빠른 액션 실행
   */
  const executeQuickAction = useCallback(async (eventId: string, actionType: QuickAction['type']) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    switch(actionType) {
      case 'complete':
        await completeEvent(eventId);
        break;

      case 'contact_pm':
        contactPMAboutEvent(eventId);
        break;

      case 'join':
        const meetingData = event.meetingData as EnhancedMeetingData;
        if (meetingData?.meetingLink) {
          window.open(meetingData.meetingLink, '_blank');
        }
        break;

      case 'view_details':
        // TODO: Open detail modal
        console.log('View details for event:', event);
        break;

      default:
        console.log('Unhandled action type:', actionType);
    }
  }, [events, completeEvent, contactPMAboutEvent]);

  /**
   * 충돌 체크
   */
  const checkConflicts = useCallback((event: CalendarEvent): EventConflict[] => {
    return detectConflicts(event, events.filter(e => e.id !== event.id));
  }, [events]);

  const value: CalendarContextType = {
    events,
    loadingEvents,
    createEvent,
    updateEvent,
    deleteEvent: async (id) => {
      CalendarService.deleteEvent(id);
      setEvents(CalendarService.getAllEvents());
    },
    completeEvent,
    rescheduleEvent: async () => {}, // TODO: Implement
    cancelEvent: async () => {}, // TODO: Implement
    submitDeliverable: async () => {}, // TODO: Implement
    handleMeetingCompleted,
    filter,
    setFilter: (newFilter) => setFilterState(prev => ({ ...prev, ...newFilter })),
    filteredEvents,
    searchEvents: (query) => events.filter(e =>
      e.title.toLowerCase().includes(query.toLowerCase())
    ),
    eventsByDate,
    todayEvents,
    thisWeekEvents,
    nextWeekEvents,
    overdueEvents,
    stats,
    checkConflicts,
    executeQuickAction,
    contactPMAboutEvent,
    pendingReschedules: [], // TODO: Implement
    approveReschedule: async () => {}, // TODO: Implement
    rejectReschedule: async () => {}, // TODO: Implement
    syncWithProjects,
    generateEventsFromProject,

    // Calendar-Meeting Integration Methods
    linkEventToMeetingRecord: (eventId: string, meetingRecordId: string) => {
      globalIntegrationManager.createLinkage(eventId, meetingRecordId);
    },

    findMeetingRecordByEvent: (eventId: string): GuideMeetingRecord | null => {
      return globalIntegrationManager.findMeetingRecordByCalendarEvent(eventId);
    },

    findEventByMeetingRecord: (meetingRecordId: string): CalendarEvent | null => {
      return globalIntegrationManager.findCalendarEventByMeetingRecord(meetingRecordId);
    },

    onMeetingCompleted: (meetingRecord: GuideMeetingRecord) => {
      globalIntegrationManager.registerMeetingRecord(meetingRecord);
      const updatedEvent = updateCalendarEventOnMeetingCompletion(meetingRecord.calendarEventId || '', meetingRecord);
      if (updatedEvent) {
        setEvents(CalendarService.getAllEvents());
      }
    },

    onPhaseTransition: (projectId: string, fromPhase: string, toPhase: string, triggeredBy: string) => {
      updateEventsOnPhaseTransition(projectId, fromPhase as any, toPhase as any, triggeredBy);
    },

    getIntegrationStatus: (projectId: string) => {
      return globalIntegrationManager.getProjectIntegrationStatus(projectId);
    },

    integrationEvents
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

export const useCalendarContext = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendarContext must be used within CalendarProvider');
  }
  return context;
};