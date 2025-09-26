/**
 * CalendarContext.tsx
 *
 * 캘린더 이벤트 전용 Context
 * BuildupContext와 연동하여 프로젝트 기반 일정 관리
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useProjectChangeDetection, summarizeChanges } from '../utils/projectChangeDetection';
import { syncTransactionManager, SyncErrorType } from '../utils/syncTransaction';
import type { SyncOperation } from '../utils/syncTransaction';
import {
  useSafeAsync,
  useEventListener,
  useTimer,
  abortControllerManager,
  memoryMonitor
} from '../utils/memoryManager';
import {
  useOptimisticUpdate,
  useOptimisticUpdates,
  optimisticUpdateManager,
  UpdateStatus,
  UpdateType
} from '../utils/optimisticUpdate';
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
import { useCalendarAPI } from '../hooks/useCalendarAPI';
import {
  calendarEcosystemConnector,
  type CalendarContextBridge
} from '../services/ecosystem/connectors/CalendarEcosystemConnector';
// import { PhaseTransitionService } from '../services/phaseTransitionService';

interface CalendarContextType {
  // Events
  events: CalendarEvent[];
  loadingEvents: boolean;

  // API Data Integration
  smartMatchingEvents: any[];
  urgentItems: any[];
  todoItems: any[];
  apiLoading: boolean;
  apiError: string | null;
  refreshSmartMatching: () => Promise<void>;
  refreshUrgentItems: () => Promise<void>;
  refreshTodoItems: () => Promise<void>;
  addEventToCalendarAPI: (eventData: any, date: Date) => Promise<boolean>;
  tabCounts: {
    smart_matching: number;
    urgent: number;
    todo_docs: number;
  };

  // 드래그로 추가된 이벤트들
  draggedEvents: CalendarEvent[];
  addDraggedEvent: (eventData: any, date: Date) => void;
  removeDraggedEvent: (eventId: string) => void;

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

  // Ecosystem Integration
  reportExternalFactor: (factor: string, impact: number, confidence: number, affectedAreas: string[]) => Promise<void>;
  getEcosystemStats: () => any;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const {
    projects,
    activeProjects,
    updateProjectMeeting,
    removeProjectMeeting,
    syncProjectMeetings,
    updateProject
  } = useBuildupContext();
  const { openChatWithPM } = useChatContext();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [filter, setFilterState] = useState<CalendarFilter>({});
  const [integrationEvents, setIntegrationEvents] = useState<IntegrationEvent[]>([]);

  // 드래그로 추가된 이벤트들 상태 관리
  const [draggedEvents, setDraggedEvents] = useState<CalendarEvent[]>(() => {
    const stored = localStorage.getItem('draggedCalendarEvents');
    return stored ? JSON.parse(stored) : [];
  });

  // useCalendarAPI 훅 통합 - API 모드와 더미 데이터 모드 자동 전환
  const {
    smartMatchingEvents,
    urgentItems,
    todoItems,
    isLoading: apiLoading,
    error: apiError,
    refreshSmartMatching,
    refreshUrgentItems,
    refreshTodoItems,
    addEventToCalendar: addEventToCalendarAPI,
    tabCounts
  } = useCalendarAPI();

  // Phase 3: 안전한 이벤트 리스너 등록 및 Ecosystem 연동
  useEffect(() => {
    const controller = abortControllerManager.create('calendar-integration');

    const handleIntegrationEvent = (event: IntegrationEvent) => {
      setIntegrationEvents(prev => [...prev, event]);

      // 캘린더 이벤트 업데이트가 필요한 경우
      if (event.type === 'meeting_completed' || event.type === 'phase_transition_applied') {
        setEvents(CalendarService.getAllEvents());
      }
    };

    // 기존 통합 시스템 연동
    globalIntegrationManager.addEventListener(handleIntegrationEvent);

    // 새로운 Ecosystem 연동 설정
    const calendarBridge: CalendarContextBridge = {
      createEvent: async (input: CalendarEventInput) => {
        // createEvent 함수를 직접 사용할 수 없으므로 임시 구현
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
            by: 'ecosystem',
            byName: 'Ecosystem Auto',
            at: new Date()
          }],
          tags: input.tags,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'ecosystem',
          updatedBy: 'ecosystem'
        };

        const addedEvent = CalendarService.addEvent(newEvent);
        globalIntegrationManager.registerCalendarEvent(addedEvent);
        setEvents(CalendarService.getAllEvents());
        return addedEvent;
      },
      updateEvent: async (eventId: string, updates: Partial<CalendarEvent>) => {
        const updatedEvent = CalendarService.updateEvent(eventId, {
          ...updates,
          updatedAt: new Date(),
          updatedBy: 'ecosystem'
        });
        if (updatedEvent) {
          setEvents(CalendarService.getAllEvents());
        }
      },
      deleteEvent: async (eventId: string) => {
        const success = CalendarService.deleteEvent(eventId);
        if (success) {
          setEvents(CalendarService.getAllEvents());
        }
      },
      getEvents: () => events,
      syncWithProjects: () => {
        const serviceEvents = CalendarService.initialize(activeProjects);
        setEvents(serviceEvents);
      }
    };

    // Ecosystem Connector에 CalendarContext 연결
    calendarEcosystemConnector.connectCalendarContext(calendarBridge);

    console.log('🔗 CalendarContext가 Ecosystem에 연결되었습니다');

    // Phase 3: cleanup 함수에서 모든 리소스 정리
    return () => {
      globalIntegrationManager.removeEventListener(handleIntegrationEvent);
      abortControllerManager.abort('calendar-integration');

      // 메모리 통계 로깅 (dev only)
      if (import.meta.env.DEV) {
        const stats = memoryMonitor.getStatistics();
        console.log('📦 CalendarContext 언마운트 - 메모리 통계:', {
          current: `${(stats.current / 1024 / 1024).toFixed(2)}MB`,
          peak: `${(stats.peak / 1024 / 1024).toFixed(2)}MB`,
          trend: stats.trend
        });
      }
    };
  }, [projects, events, activeProjects]);

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
        "날짜": new Date(project.nextMeeting.date),
        "시작시간": project.nextMeeting.time || '14:00',
        "종료시간": '15:00',
        location: 'online',
        meetingLink: project.nextMeeting.meeting_link,
        status: 'scheduled'
      };

      // PM 미팅인 경우 추가 데이터
      if (meetingType === 'pm_meeting') {
        enhancedMeetingData.pmMeetingData = {
          "담당PM": pmName,
          "PM직함": 'Senior PM',
          "세션회차": 1,
          "아젠다": project.nextMeeting.agenda
        };
      }

      // 빌드업 프로젝트 미팅인 경우
      if (meetingType === 'buildup_project') {
        enhancedMeetingData.buildupProjectData = {
          "프로젝트명": project.title,
          "프로젝트ID": project.id,
          "미팅목적": 'progress',
          "PM명": pmName,
          "참여자목록": project.team?.members?.map(m => m.name) || [],
          "아젠다": project.nextMeeting.agenda
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
            "날짜": meetingDate,
            "시작시간": meeting.time || '14:00',
            "종료시간": '15:00',
            location: 'online',
            meetingLink: meeting.meeting_link,
            status: 'completed',
            completedAt: meetingDate
          };

          // PM 미팅 데이터
          if (meetingType === 'pm_meeting') {
            enhancedMeetingData.pmMeetingData = {
              "담당PM": pmName,
              "PM직함": 'Senior PM',
              "세션회차": index + 1,
              "아젠다": meeting.agenda,
              "미팅노트": meeting.notes
            };
          }

          // 빌드업 프로젝트 미팅 데이터
          if (meetingType === 'buildup_project') {
            enhancedMeetingData.buildupProjectData = {
              "프로젝트명": project.title,
              "프로젝트ID": project.id,
              "미팅목적": 'progress',
              "PM명": pmName,
              "참여자목록": project.team?.members?.map(m => m.name) || [],
              "아젠다": meeting.agenda,
              "결정사항": meeting.notes ? [meeting.notes] : []
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
  }, [activeProjects.length]); // length만 체크하여 불필요한 재생성 방지

  // API 데이터와 캘린더 이벤트 동기화 - 자동 추가 비활성화
  // Smart matching 이벤트는 드래그 앤 드롭으로만 추가되도록 변경
  // useEffect(() => {
  //   // API 모드가 활성화되어 있고 데이터가 있을 때
  //   if (smartMatchingEvents.length > 0 || urgentItems.length > 0 || todoItems.length > 0) {
  //     const apiEvents: CalendarEvent[] = [];

  //     // Smart Matching 이벤트 변환
  //     smartMatchingEvents.forEach(item => {
  //       if (item.date) {
  //         apiEvents.push({
  //           id: `sm-${item.id || Math.random().toString(36).substr(2, 9)}`,
  //           type: 'meeting',
  //           title: item.company || item.title || 'Smart Matching Event',
  //           description: item.description || '',
  //           date: new Date(item.date),
  //           time: item.time || '14:00',
  //           projectId: 'smart-matching',
  //           pmId: 'system',
  //           pmName: 'Smart Matching',
  //           status: 'pending',
  //           priority: item.priority || 'medium',
  //           tags: item.tags || [],
  //           metadata: {
  //             source: 'smart_matching',
  //             category: item.category,
  //             addedByDragDrop: false
  //           }
  //         });
  //       }
  //     });

  //     // Urgent Items 변환
  //     urgentItems.forEach(item => {
  //       apiEvents.push({
  //         id: `urgent-${item.id || Math.random().toString(36).substr(2, 9)}`,
  //         type: 'task',
  //         title: item.title || 'Urgent Task',
  //         description: item.description || '',
  //         date: new Date(item.dueDate || new Date()),
  //         time: '09:00',
  //         projectId: 'urgent',
  //         pmId: 'system',
  //         pmName: 'System',
  //         status: item.status || 'pending',
  //         priority: 'high',
  //         tags: ['urgent'],
  //         metadata: {
  //           source: 'urgent_items'
  //         }
  //       });
  //     });

  //     // API 이벤트와 기존 이벤트 병합
  //     const existingEvents = CalendarService.getAllEvents();
  //     const mergedEvents = [...existingEvents, ...apiEvents];
  //     setEvents(mergedEvents);
  //   }
  // }, [smartMatchingEvents, urgentItems, todoItems]);

  // 프로젝트 변경 시 자동 동기화
  useEffect(() => {
    if (activeProjects.length > 0) {
      syncWithProjects();

      // 통합 시스템 초기화
      const currentEvents = CalendarService.getAllEvents();
      initializeIntegrationSystem(currentEvents, []);
    }
  }, [activeProjects]); // syncWithProjects는 activeProjects를 의존하므로 제거

  // 🔄 Phase 1: 효율적인 프로젝트 변경 감지 시스템
  const { detectChanges, getStatistics } = useProjectChangeDetection({
    deepCompare: false,
    batchDelay: 200
  });

  // Phase 3: 메모리 관리를 위한 타이머 훅
  const { setTimeout: setTimeoutSafe, clearTimeout: clearTimeoutSafe } = useTimer();
  const syncTimeoutRef = useRef<string>('sync-timeout');

  // Phase 2: 트랜잭션 기반 안전한 동기화 (Phase 3 개선)
  const performSafeSync = useCallback(async (signal?: AbortSignal) => {
    // 취소 시그널 체크
    if (signal?.aborted) return;
    const changes = detectChanges(projects);

    // 변경사항이 없으면 종료
    if (changes.added.length === 0 && changes.modified.length === 0 && changes.removed.length === 0) {
      return;
    }

    console.log('🔄 효율적 변경 감지:', summarizeChanges(changes));
    console.log('📊 변경 감지 통계:', getStatistics);

    // 트랜잭션 작업 준비
    const operations: SyncOperation[] = [];

    // 추가된 프로젝트 처리
    changes.added.forEach(project => {
      // 새 프로젝트의 이벤트 생성
      const projectEvents = generateEventsFromProject(project);
      projectEvents.forEach(event => {
        operations.push({
          id: `add-event-${event.id}`,
          type: 'create',
          target: 'calendar',
          data: event,
          priority: 3
        });
      });

      // 마일스톤 자동 생성
      if (project.phase && project.startDate) {
        operations.push({
          id: `milestone-${project.id}`,
          type: 'create',
          target: 'milestone',
          data: {
            id: `milestone-${project.id}-${project.phase}`,
            type: 'milestone',
            title: `[${project.title}] ${project.phase} 단계`,
            projectId: project.id,
            startDate: new Date(),
            endDate: new Date(),
            status: 'pending',
            priority: 'high'
          },
          priority: 2
        });
      }
    });

    // 수정된 프로젝트 처리
    changes.modified.forEach(project => {
      operations.push({
        id: `update-${project.id}`,
        type: 'update',
        target: 'project',
        data: project,
        priority: 2
      });
    });

    // 삭제된 프로젝트 처리
    changes.removed.forEach(projectId => {
      // 관련 이벤트 삭제
      const relatedEvents = events.filter(e => e.projectId === projectId);
      relatedEvents.forEach(event => {
        operations.push({
          id: `remove-event-${event.id}`,
          type: 'delete',
          target: 'calendar',
          data: { id: event.id },
          priority: 1
        });
      });
    });

    try {
      // 트랜잭션 실행
      await syncTransactionManager.executeTransaction(operations);

      // 성공 시 캘린더 동기화
      syncWithProjects();

      console.log('✅ 동기화 트랜잭션 성공:', syncTransactionManager.getStatistics());
    } catch (error: any) {
      console.error('❌ 동기화 트랜잭션 실패:', error);

      // 에러 타입에 따른 처리
      if (error.type === SyncErrorType.NETWORK_ERROR) {
        console.log('🔄 네트워크 오류 - 재시도 예정');
        // 재시도 로직 추가 가능
      } else if (error.type === SyncErrorType.CONFLICT_ERROR) {
        console.log('⚠️ 데이터 충돌 - 수동 해결 필요');
        // 충돌 해결 UI 표시
      }
    }
  }, [projects, events]); // 함수 의존성 제거하여 무한 루프 방지

  // Phase 3: 메모리 안전 비동기 작업
  const { execute: executeSafeSync, cancel: cancelSync } = useSafeAsync(
    async (signal) => {
      // 메모리 측정 시작
      if (import.meta.env.DEV) {
        memoryMonitor.measure();
      }

      await performSafeSync(signal);

      // 메모리 누수 체크
      if (import.meta.env.DEV) {
        const stats = memoryMonitor.getStatistics();
        if (stats.trend === 'increasing' && memoryMonitor.detectLeak()) {
          console.warn('⚠️ 메모리 누수 가능성 감지:', stats);
        }
      }
    }
  );

  // 프로젝트 변경 시 안전한 동기화 실행 (Phase 3 개선)
  useEffect(() => {
    if (activeProjects.length > 0) {
      // 디바운싱을 위한 타이머 사용
      clearTimeoutSafe(syncTimeoutRef.current);
      setTimeoutSafe(() => {
        executeSafeSync();
      }, 300, syncTimeoutRef.current);
    }

    // cleanup: 컨텍스트 언마운트 시 동기화 취소
    return () => {
      // cleanup에서는 AbortController만 취소하고 setState는 하지 않음
      clearTimeoutSafe(syncTimeoutRef.current);
    };
  }, [projects, activeProjects.length]); // 함수 의존성 제거

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

    // 🔥 Sprint 3 Phase 2: 프로젝트 단계별 필터
    if (filter.phases && filter.phases.length > 0) {
      filtered = filtered.filter(e => {
        // 프로젝트 ID로 프로젝트 찾기
        const project = projects.find(p => p.id === e.projectId);
        return project && filter.phases!.includes(project.phase);
      });
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
   * 드래그로 추가된 이벤트 관리
   */
  const addDraggedEvent = useCallback((eventData: any, date: Date) => {
    const newDraggedEvent: CalendarEvent = {
      id: `dragged_${Date.now()}_${eventData.id}`,
      title: eventData.title,
      description: eventData.description || '',
      date,
      startTime: `09:00`,
      endTime: `10:00`,
      type: eventData.type || 'smart_matching',
      projectId: eventData.projectId,
      projectTitle: eventData.projectTitle || eventData.title,
      pmId: eventData.pmId,
      pmName: eventData.pmName || '',
      status: 'scheduled',
      priority: eventData.priority || 'medium',
      actionHistory: [{
        type: 'created',
        by: 'drag_drop',
        byName: 'Drag & Drop',
        at: new Date()
      }],
      tags: eventData.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user',
      updatedBy: 'user',
      // 원본 이벤트 정보 저장
      originalEventId: eventData.id,
      sourceType: eventData.sourceType || 'smart_matching'
    };

    const updatedDraggedEvents = [...draggedEvents, newDraggedEvent];
    setDraggedEvents(updatedDraggedEvents);

    // localStorage에 저장
    localStorage.setItem('draggedCalendarEvents', JSON.stringify(updatedDraggedEvents));

    console.log('Added dragged event:', newDraggedEvent);
  }, [draggedEvents]);

  const removeDraggedEvent = useCallback((eventId: string) => {
    const updatedDraggedEvents = draggedEvents.filter(event => event.id !== eventId);
    setDraggedEvents(updatedDraggedEvents);

    // localStorage 업데이트
    localStorage.setItem('draggedCalendarEvents', JSON.stringify(updatedDraggedEvents));

    console.log('Removed dragged event:', eventId);
  }, [draggedEvents]);

  /**
   * 이벤트 업데이트
   */
  // Phase 4: 낙관적 업데이트 패턴 적용
  const { items: optimisticEvents, updateItem, deleteItem, isUpdating } = useOptimisticUpdates<CalendarEvent>();

  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    // Phase 4: 낙관적 업데이트 수행
    const result = await updateItem(
      eventId,
      {
        ...updates,
        updatedAt: new Date(),
        updatedBy: 'user'
      },
      async (id, updates) => {
        // 실제 업데이트 로직
        const updatedEvent = CalendarService.updateEvent(id, updates);
        if (!updatedEvent) {
          throw new Error('Failed to update event');
        }
        return updatedEvent;
      }
    );

    if (result.success && result.data) {
      const updatedEvent = result.data;
      setEvents(CalendarService.getAllEvents());

      // 🔄 CalendarContext → BuildupContext 역방향 동기화
      // 미팅 관련 이벤트인 경우 프로젝트 데이터 업데이트
      if (updatedEvent.type === 'meeting' && updatedEvent.projectId) {
        const meetingData = updatedEvent.data as any;
        if (meetingData?.meetingId) {
          console.log('🔄 캘린더 → 프로젝트: 미팅 정보 동기화', meetingData.meetingId);
          updateProjectMeeting(updatedEvent.projectId, meetingData.meetingId, {
            date: updatedEvent.startDate.toISOString(),
            time: updatedEvent.startDate.toTimeString().slice(0, 5),
            agenda: meetingData.agenda || updatedEvent.description
          });
        }
      }

      // 프로젝트 관련 일정 변경 시 프로젝트 상태 업데이트
      if (updatedEvent.projectId && updates.status === 'completed') {
        const project = projects.find(p => p.id === updatedEvent.projectId);
        if (project) {
          console.log('🔄 캘린더 → 프로젝트: 진행 상황 업데이트');
          // 프로젝트 진행률 업데이트 로직
          const completedEvents = events.filter(
            e => e.projectId === updatedEvent.projectId && e.status === 'completed'
          );
          const totalEvents = events.filter(e => e.projectId === updatedEvent.projectId);
          const progress = (completedEvents.length / totalEvents.length) * 100;
          updateProject(updatedEvent.projectId, { progress: Math.round(progress) });
        }
      }

      // Phase 4: 성공 피드백
      console.log('✅ 낙관적 업데이트 성공:', updatedEvent.title);
    } else if (result.error) {
      // Phase 4: 실패 피드백
      console.error('❌ 낙관적 업데이트 실패:', result.error);
      // 롤백되었으므로 UI는 자동 복구됨
    }
  }, [updateProjectMeeting, updateProject, projects, events, updateItem]);

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
      } else {
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
    loadingEvents: loadingEvents || apiLoading,

    // API Data Integration
    smartMatchingEvents,
    urgentItems,
    todoItems,
    apiLoading,
    apiError,
    refreshSmartMatching,
    refreshUrgentItems,
    refreshTodoItems,
    addEventToCalendarAPI,
    tabCounts,

    // 드래그로 추가된 이벤트들
    draggedEvents,
    addDraggedEvent,
    removeDraggedEvent,

    createEvent,
    updateEvent,
    deleteEvent: async (id) => {
      // 삭제할 이벤트 정보 미리 가져오기
      const eventToDelete = events.find(e => e.id === id);

      // Phase 4: 낙관적 삭제
      const result = await deleteItem(
        id,
        async (eventId) => {
          const success = CalendarService.deleteEvent(eventId);
          if (!success) {
            throw new Error('Failed to delete event');
          }
        }
      );

      if (result.success) {
        setEvents(CalendarService.getAllEvents());

        // 🔄 CalendarContext → BuildupContext 역방향 동기화
        // 미팅 삭제 시 프로젝트에서도 제거
        if (eventToDelete?.type === 'meeting' && eventToDelete.projectId) {
          const meetingData = eventToDelete.data as any;
          if (meetingData?.meetingId) {
            console.log('🔄 캘린더 → 프로젝트: 미팅 삭제 동기화', meetingData.meetingId);
            removeProjectMeeting(eventToDelete.projectId, meetingData.meetingId);
          }
        }

        console.log('✅ 낙관적 삭제 성공');
      } else {
        console.error('❌ 낙관적 삭제 실패:', result.error);
      }
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

    integrationEvents,

    // Ecosystem Integration
    reportExternalFactor: async (factor: string, impact: number, confidence: number, affectedAreas: string[]) => {
      await calendarEcosystemConnector.reportExternalFactor(factor, impact, confidence, affectedAreas);
    },

    getEcosystemStats: () => {
      return calendarEcosystemConnector.getConnectionStats();
    }
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