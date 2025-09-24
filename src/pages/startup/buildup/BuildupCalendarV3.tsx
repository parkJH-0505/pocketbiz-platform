/**
 * BuildupCalendarV3 - 향상된 빌드업 캘린더
 * CalendarContext와 통합되고 구글 캘린더 연동이 가능한 버전
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Video,
  CheckCircle,
  Clock,
  MapPin,
  Users,
  Plus,
  Filter,
  Download,
  Bell,
  Circle,
  XCircle,
  ExternalLink,
  AlertCircle,
  Star,
  MoreVertical,
  Briefcase,
  GraduationCap,
  Presentation,
  Building
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCalendarContext } from '../../../contexts/CalendarContext';
import { useBuildupContext } from '../../../contexts/BuildupContext';
import { useChatContext } from '../../../contexts/ChatContext';
import { useScheduleContext } from '../../../contexts/ScheduleContext';
import { useToast } from '../../../contexts/ToastContext';
import { useLoading } from '../../../contexts/LoadingContext';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { UniversalScheduleModal, CalendarHeader, CalendarContent } from '../../../components/schedule';
import { CalendarViewSkeleton, CalendarEventSkeleton } from '../../../components/ui/SkeletonLoader';
import { Spinner } from '../../../components/common/Progress';
import MeetingCompletionModal from '../../../components/calendar/MeetingCompletionModal';
import { CalendarIntegration } from '../../../utils/calendarIntegration';
import {
  EventMetadataUtils,
  DEFAULT_FILTER_PRESETS,
  EVENT_CATEGORY_META
} from '../../../utils/calendarMetadata';
import {
  getDDayText,
  isUrgent,
  getPriorityColor,
  getEventStatusStyle
} from '../../../utils/calendarUtils';
import { MEETING_TYPE_CONFIG } from '../../../types/meeting.types';
import type { CalendarEvent } from '../../../types/calendar.types';
import type { GuideMeetingRecord } from '../../../types/buildup.types';
import type { EnhancedMeetingData } from '../../../types/meeting.types';
import { migrateSchedulesToSeptember2025 } from '../../../utils/scheduleMigration';
import { PHASE_INFO } from '../../../utils/projectPhaseUtils';
import { X } from 'lucide-react'; // 🔥 Sprint 3 Phase 2: X 아이콘 추가

export default function BuildupCalendarV3() {
  const navigate = useNavigate();
  const {
    filter,
    setFilter,
    executeQuickAction,
    contactPMAboutEvent,
    syncWithProjects: originalSyncWithProjects,
    handleMeetingCompleted
  } = useCalendarContext();
  const { projects } = useBuildupContext();
  const { openChatWithPM } = useChatContext();
  const {
    schedules,
    buildupMeetings,
    getTodaySchedules,
    getSchedulesByDateRange,
    getSchedulesByProject,
    refreshSchedules
  } = useScheduleContext();
  const { showSuccess, showError, showInfo, showWarning, showDebug } = useToast();
  const { isLoading, setLoading, withLoading } = useLoading();
  const { handleError, withErrorHandler, withRetry } = useErrorHandler();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [eventToComplete, setEventToComplete] = useState<CalendarEvent | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showPhaseFilter, setShowPhaseFilter] = useState(false); // 🔥 Sprint 3 Phase 2: 단계 필터 UI 상태

  // 통합된 UniversalScheduleModal 상태
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit' | 'view';
    schedule: any;
    defaultType?: string;
    selectedDate?: Date;
  }>({
    isOpen: false,
    mode: 'create',
    schedule: null,
    defaultType: 'buildup_project'
  });

  // 토스트는 이제 useToast 훅으로 관리됨

  // 통합된 모달 관리 함수들
  const openScheduleModal = (config: {
    mode: 'create' | 'edit' | 'view';
    schedule?: any;
    defaultType?: string;
    selectedDate?: Date;
  }) => {
    setModalState({
      isOpen: true,
      mode: config.mode,
      schedule: config.schedule || null,
      defaultType: config.defaultType || 'buildup_project',
      selectedDate: config.selectedDate
    });
  };

  const closeScheduleModal = () => {
    setModalState(prev => ({
      ...prev,
      isOpen: false,
      schedule: null
    }));
  };

  // ✅ Step 2: 강화된 동기화 함수 - Step 3을 위한 이벤트 발송 포함
  const syncAllData = withLoading('calendar_sync',
    withRetry(
      withErrorHandler(async () => {
        console.log('🔄 BuildupCalendarV3: Starting Step 2 enhanced sync process...');

        // ScheduleContext 새로고침
        await refreshSchedules();

        // CalendarContext 동기화
        await originalSyncWithProjects();

        // ✅ Step 3 준비: 동기화 완료 이벤트 발송
        const syncCompletedEvent = new CustomEvent('calendar:sync_completed', {
          detail: {
            source: 'buildup_calendar_v3',
            timestamp: new Date(),
            syncType: 'full_sync',
            scheduleCount: schedules.length
          }
        });
        window.dispatchEvent(syncCompletedEvent);

        console.log('✅ BuildupCalendarV3: All data synced successfully with enhanced event system');
        showSuccess('캘린더 데이터가 동기화되었습니다');
      }, {
        syncType: 'full_sync',
        component: 'BuildupCalendarV3'
      }),
      {
        maxRetries: 2,
        retryDelay: 1500
      }
    )
  );

  // 프로젝트별 스케줄 새로고침
  const refreshProjectSchedules = withLoading('project_schedules',
    withErrorHandler(async (projectId: string) => {
      console.log(`🔄 Refreshing schedules for project: ${projectId}`);

      const projectSchedules = getSchedulesByProject(projectId);
      console.log(`📅 Found ${projectSchedules.length} schedules for project ${projectId}`);

      return projectSchedules;
    }, {
      operation: 'refresh_project_schedules',
      component: 'BuildupCalendarV3'
    })
  );

  // 일회성 데이터 마이그레이션
  useEffect(() => {
    const migrationKey = 'schedule_migration_sept_2025_completed';
    const isMigrationCompleted = localStorage.getItem(migrationKey);

    if (!isMigrationCompleted) {
      console.log('🔄 Performing one-time schedule migration to September 2025...');
      migrateSchedulesToSeptember2025();
      localStorage.setItem(migrationKey, 'true');
    }
  }, []);

  // ✅ Step 2: ProjectDetail 이벤트 수신 및 통합 이벤트 시스템 설정
  useEffect(() => {
    console.log('🔧 BuildupCalendarV3: Setting up Step 2 event system with ProjectDetail integration');
    // 스케줄 생성 이벤트 핸들러
    const handleScheduleCreated = (event: CustomEvent) => {
      const { schedule } = event.detail;
      console.log('📅 Schedule created:', schedule.title);
      showSuccess(`일정이 생성되었습니다: ${schedule.title}`);

      // 캘린더 자동 스크롤 (생성된 일정의 날짜로)
      if (schedule.startDateTime) {
        const scheduleDate = new Date(schedule.startDateTime);
        setCurrentDate(scheduleDate);
        setSelectedDate(scheduleDate);
      }
    };

    // 스케줄 업데이트 이벤트 핸들러
    const handleScheduleUpdated = (event: CustomEvent) => {
      const { schedule, previousData } = event.detail;
      console.log('📅 Schedule updated:', schedule.title);
      showInfo(`일정이 수정되었습니다: ${schedule.title}`);
    };

    // 스케줄 삭제 이벤트 핸들러
    const handleScheduleDeleted = (event: CustomEvent) => {
      const { schedule } = event.detail;
      console.log('📅 Schedule deleted:', schedule.title);
      showWarning(`일정이 삭제되었습니다: ${schedule.title}`);
    };

    // 빌드업 미팅 생성 특별 핸들러 (Phase Transition 포함)
    const handleBuildupMeetingCreated = (event: CustomEvent) => {
      const { schedule, metadata } = event.detail;
      console.log('🏗️ Buildup meeting created:', schedule.title, metadata);

      // Phase transition 정보가 있으면 통합 메시지로 표시
      if (metadata?.phaseTransition) {
        const { fromPhase, toPhase } = metadata.phaseTransition;
        const phaseInfo = PHASE_INFO[toPhase];
        const phaseName = phaseInfo?.name || toPhase;

        showSuccess(`빌드업 미팅이 예약되었습니다 (프로젝트 단계 '${phaseName}'으로 변경)`);

        // 개발자용 디버깅 정보
        showDebug(`Phase Transition: ${fromPhase} → ${toPhase}`, {
          scheduleId: schedule.id,
          projectId: metadata.projectId,
          triggerType: 'meeting_scheduled'
        });
      } else {
        showSuccess(`빌드업 미팅이 예약되었습니다: ${schedule.title}`);
      }

      // BuildupContext에 Phase Transition 이벤트 전파 (phaseTransition이 있는 경우에만)
      if (metadata?.phaseTransition) {
        const { fromPhase, toPhase } = metadata.phaseTransition;
        const phaseTransitionEvent = new CustomEvent('project:phase_transition', {
          detail: {
            projectId: metadata.projectId,
            fromPhase,
            toPhase,
            triggerType: 'meeting_scheduled',
            scheduleId: schedule.id,
            timestamp: new Date()
          }
        });
        window.dispatchEvent(phaseTransitionEvent);
      }

      // 프로젝트 관련 스케줄 새로고침
      refreshProjectSchedules(metadata.projectId);
    };

    // Phase Transition 트리거 이벤트 핸들러
    const handlePhaseTransitionTriggered = (event: CustomEvent) => {
      const { fromPhase, toPhase, triggerType } = event.detail;
      console.log('🔄 Phase transition triggered:', { fromPhase, toPhase, triggerType });

      showSuccess(`프로젝트 단계 전환: ${fromPhase} → ${toPhase}`);
    };

    // 에러 이벤트 핸들러
    const handleScheduleError = (event: CustomEvent) => {
      const { error, action } = event.detail;
      console.error('❌ Schedule error:', error);
      showError(`스케줄 ${action} 중 오류가 발생했습니다: ${error.message}`);
    };

    // BuildupContext에서 발생하는 프로젝트 이벤트 핸들러
    const handleProjectPhaseChanged = (event: CustomEvent) => {
      const { projectId, fromPhase, toPhase, triggerType } = event.detail;
      console.log('🏗️ Project phase changed:', { projectId, fromPhase, toPhase, triggerType });

      showSuccess(`프로젝트 단계가 ${fromPhase}에서 ${toPhase}로 변경되었습니다`);

      // 해당 프로젝트의 스케줄들을 새로고침
      refreshProjectSchedules(projectId);
    };

    // 프로젝트 업데이트 이벤트 핸들러
    const handleProjectUpdated = (event: CustomEvent) => {
      const { projectId, updates } = event.detail;
      console.log('🏗️ Project updated:', { projectId, updates });

      // 프로젝트 정보가 변경되면 관련 스케줄 정보도 업데이트 필요
      refreshProjectSchedules(projectId);
    };

    // 마이그레이션 완료 이벤트 핸들러
    const handleMigrationCompleted = (event: CustomEvent) => {
      const { migratedCount } = event.detail;
      console.log('🔄 Migration completed:', migratedCount, 'schedules migrated');
      showSuccess(`${migratedCount}개의 일정이 2025년 9월로 이동되었습니다`);

      // 데이터 새로고침
      syncAllData();
    };

    // ✅ Step 2: ProjectDetail에서 발송하는 이벤트 수신 핸들러 추가
    const handleProjectMeetingEvent = (e: CustomEvent) => {
      const { eventId, projectId, operation, schedule, source } = e.detail;

      console.log(`📤 BuildupCalendarV3 received from ProjectDetail:`, {
        eventType: e.type,
        eventId,
        projectId,
        operation,
        source
      });

      if (operation === 'created' || operation === 'updated') {
        console.log(`🔄 Calendar will refresh due to ProjectDetail ${operation}:`, schedule?.title);
        showInfo(`프로젝트에서 미팅이 ${operation === 'created' ? '생성' : '수정'}되었습니다: ${schedule?.title || ''}`);

        // 해당 프로젝트의 날짜로 자동 이동
        if (schedule?.startDateTime) {
          const scheduleDate = new Date(schedule.startDateTime);
          setCurrentDate(scheduleDate);
          setSelectedDate(scheduleDate);
        }
      }

      if (operation === 'selected') {
        console.log(`👆 ProjectDetail selected meeting: ${e.detail.meetingTitle}`);
      }
    };

    // ✅ Step 3: 동기화 요청 이벤트 핸들러 (기존)
    const handleSyncRequested = (e: CustomEvent) => {
      const { source, projectId, meeting, operation } = e.detail;

      console.log(`🔄 BuildupCalendarV3 received sync request from ${source}:`, {
        projectId,
        operation,
        meetingTitle: meeting?.title
      });

      // 개발자용 디버깅 정보만 표시
      showDebug(`Sync Request: ${source} → ${operation}`, {
        projectId,
        meetingTitle: meeting?.title
      });
    };

    // ✅ Step 3: ScheduleContext에서 동기화 완료 이벤트 수신
    const handleSyncCompleted = (e: CustomEvent) => {
      const { source, projectId: syncProjectId, scheduleCount, originalEventId } = e.detail;

      console.log(`✅ BuildupCalendarV3 received sync completion from ${source}:`, {
        syncProjectId,
        scheduleCount,
        originalEventId
      });

      // 성공 토스트 표시
      showSuccess(`일정 동기화 완료 (${scheduleCount}개)`);
    };

    // ✅ Step 3: ScheduleContext에서 생성 완료 이벤트 수신
    const handleCreateCompleted = (e: CustomEvent) => {
      const { source, projectId: syncProjectId, schedule, originalEventId } = e.detail;

      console.log(`✅ BuildupCalendarV3 received create completion from ${source}:`, {
        scheduleId: schedule.id,
        title: schedule.title,
        originalEventId
      });

      // 성공 토스트 표시
      showSuccess(`일정 생성 완료: ${schedule.title}`);
    };

    // ✅ Step 3: ScheduleContext에서 업데이트 완료 이벤트 수신
    const handleUpdateCompleted = (e: CustomEvent) => {
      const { source, projectId: syncProjectId, scheduleId, originalEventId } = e.detail;

      console.log(`✅ BuildupCalendarV3 received update completion from ${source}:`, {
        scheduleId,
        originalEventId
      });

      // 성공 토스트 표시
      showSuccess(`일정 업데이트 완료`);
    };

    // ✅ Step 3: ScheduleContext에서 Phase Transition 완료 이벤트 수신
    const handlePhaseTransitionCompleted = (e: CustomEvent) => {
      const { source, projectId: syncProjectId, fromPhase, toPhase, updatedScheduleCount, originalEventId } = e.detail;

      console.log(`✅ BuildupCalendarV3 received phase transition completion from ${source}:`, {
        fromPhase,
        toPhase,
        updatedScheduleCount,
        originalEventId
      });

      // Phase 변경 확인 토스트 표시
      showSuccess(`프로젝트 단계 변경: ${fromPhase} → ${toPhase}`);
    };

    // ✅ Step 3: 동기화 에러 이벤트 수신
    const handleSyncError = (e: CustomEvent) => {
      const { source, projectId: syncProjectId, operation, error, originalEventId } = e.detail;

      console.error(`❌ BuildupCalendarV3 received sync error from ${source}:`, {
        operation,
        error,
        originalEventId
      });

      // 에러 토스트 표시
      showError(`동기화 오류: ${error}`);
    };

    // 이벤트 리스너 등록
    // ✅ Step 2: ProjectDetail 이벤트 수신
    window.addEventListener('project:meeting_created', handleProjectMeetingEvent);
    window.addEventListener('project:meeting_updated', handleProjectMeetingEvent);
    window.addEventListener('project:meeting_selected', handleProjectMeetingEvent);
    window.addEventListener('project:meeting_create_requested', handleProjectMeetingEvent);
    window.addEventListener('project:meeting_refresh_requested', handleProjectMeetingEvent);

    // ✅ Step 3: 양방향 동기화 이벤트 리스너
    window.addEventListener('schedule:sync_requested', handleSyncRequested);
    window.addEventListener('schedule:refresh_complete', handleSyncCompleted);
    window.addEventListener('schedule:create_complete', handleCreateCompleted);
    window.addEventListener('schedule:update_complete', handleUpdateCompleted);
    window.addEventListener('schedule:phase_transition_complete', handlePhaseTransitionCompleted);
    window.addEventListener('schedule:sync_error', handleSyncError);
    window.addEventListener('schedule:phase_transition_error', handleSyncError);
    window.addEventListener('schedule:buildup_change_error', handleSyncError);

    // Schedule 이벤트
    window.addEventListener('schedule:created', handleScheduleCreated);
    window.addEventListener('schedule:updated', handleScheduleUpdated);
    window.addEventListener('schedule:deleted', handleScheduleDeleted);
    window.addEventListener('schedule:buildup_meeting_created', handleBuildupMeetingCreated);
    window.addEventListener('schedule:phase_transition_triggered', handlePhaseTransitionTriggered);
    window.addEventListener('schedule:error', handleScheduleError);

    // Project 이벤트 (BuildupContext에서 발생)
    window.addEventListener('project:phase_changed', handleProjectPhaseChanged);
    window.addEventListener('project:updated', handleProjectUpdated);

    // Migration 이벤트
    window.addEventListener('schedule:migration_completed', handleMigrationCompleted);

    // 클린업
    return () => {
      console.log('🧹 BuildupCalendarV3: Cleaning up Step 2 enhanced event system');

      // ✅ Step 2: ProjectDetail 이벤트 리스너 제거
      window.removeEventListener('project:meeting_created', handleProjectMeetingEvent);
      window.removeEventListener('project:meeting_updated', handleProjectMeetingEvent);
      window.removeEventListener('project:meeting_selected', handleProjectMeetingEvent);
      window.removeEventListener('project:meeting_create_requested', handleProjectMeetingEvent);
      window.removeEventListener('project:meeting_refresh_requested', handleProjectMeetingEvent);

      // ✅ Step 3: 양방향 동기화 이벤트 리스너 제거
      window.removeEventListener('schedule:sync_requested', handleSyncRequested);
      window.removeEventListener('schedule:refresh_complete', handleSyncCompleted);
      window.removeEventListener('schedule:create_complete', handleCreateCompleted);
      window.removeEventListener('schedule:update_complete', handleUpdateCompleted);
      window.removeEventListener('schedule:phase_transition_complete', handlePhaseTransitionCompleted);
      window.removeEventListener('schedule:sync_error', handleSyncError);
      window.removeEventListener('schedule:phase_transition_error', handleSyncError);
      window.removeEventListener('schedule:buildup_change_error', handleSyncError);

      // Schedule 이벤트 리스너 제거
      window.removeEventListener('schedule:created', handleScheduleCreated);
      window.removeEventListener('schedule:updated', handleScheduleUpdated);
      window.removeEventListener('schedule:deleted', handleScheduleDeleted);
      window.removeEventListener('schedule:buildup_meeting_created', handleBuildupMeetingCreated);
      window.removeEventListener('schedule:phase_transition_triggered', handlePhaseTransitionTriggered);
      window.removeEventListener('schedule:error', handleScheduleError);

      // Project 이벤트 리스너 제거
      window.removeEventListener('project:phase_changed', handleProjectPhaseChanged);
      window.removeEventListener('project:updated', handleProjectUpdated);

      // Migration 이벤트 리스너 제거
      window.removeEventListener('schedule:migration_completed', handleMigrationCompleted);
    };
  }, [showInfo, showSuccess, showError, showWarning]);

  // 현재 월의 시작과 끝
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // 캘린더 그리드를 위한 날짜 계산
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay());

  const calendarEnd = new Date(monthEnd);
  calendarEnd.setDate(calendarEnd.getDate() + (6 - calendarEnd.getDay()));

  // ✅ Step 2: 성능 최적화된 ScheduleContext → CalendarEvent 변환
  const schedulesToEvents = useMemo(() => {
    const startTime = performance.now();

    if (!schedules || schedules.length === 0) {
      console.log('📊 BuildupCalendarV3: No schedules to convert');
      return [];
    }

    // 로그 제거 - 너무 자주 호출됨

    const validatedSchedules = schedules.filter(schedule => {
      // ✅ 강화된 유효성 검사
      try {
        const startDate = new Date(schedule.startDateTime);
        const endDate = new Date(schedule.endDateTime);
        const isValidDate = !isNaN(startDate.getTime()) && !isNaN(endDate.getTime());
        const hasRequiredFields = schedule.id && schedule.title;

        // 로그 제거 - 너무 자주 호출됨

        return isValidDate && hasRequiredFields;
      } catch (error) {
        // 로그 제거 - 너무 자주 호출됨
        return false;
      }
    });

    // 로그 제거 - 너무 자주 호출됨

    const convertedEvents = validatedSchedules.map(schedule => {
      try {
        const startDate = new Date(schedule.startDateTime);
        const endDate = new Date(schedule.endDateTime);

        return {
          id: schedule.id,
          title: schedule.title,
          date: startDate,
          time: startDate.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          endTime: endDate.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          location: schedule.location || '',
          type: schedule.type === 'buildup_project' ? 'guide' : 'general',
          projectId: schedule.type === 'buildup_project' ? (schedule as any).projectId : undefined,
          status: schedule.status === 'completed' ? 'completed' :
                  schedule.status === 'cancelled' ? 'cancelled' :
                  startDate < new Date() ? 'overdue' : 'scheduled',
          isOnline: schedule.isOnline,
          meetingLink: schedule.onlineLink,
          category: schedule.type === 'buildup_project' ? 'project' : 'other',
          tags: schedule.tags || [],
          priority: schedule.priority,
          description: schedule.description || '',
          // ✅ Step 2: 디버깅 정보 추가
          sourceType: 'schedule_context',
          scheduleType: schedule.type
        };
      } catch (error) {
        console.warn('❌ Error converting schedule to event:', schedule, error);
        return null;
      }
    }).filter(Boolean) as CalendarEvent[];

    // ✅ Step 2: 중복 제거 로직 강화
    const deduplicatedEvents = convertedEvents.reduce((acc, event) => {
      const existingIndex = acc.findIndex(existing =>
        existing.id === event.id ||
        (existing.projectId === event.projectId &&
         existing.title === event.title &&
         Math.abs(existing.date.getTime() - event.date.getTime()) < 60000) // 1분 이내 차이면 동일 이벤트로 간주
      );

      if (existingIndex === -1) {
        acc.push(event);
      } else {
        console.warn('🔍 Duplicate event detected and removed:', {
          existing: acc[existingIndex].id,
          duplicate: event.id,
          title: event.title
        });
      }

      return acc;
    }, [] as CalendarEvent[]);

    const endTime = performance.now();
    console.log('⚡ Schedule conversion performance:', {
      duration: `${(endTime - startTime).toFixed(2)}ms`,
      originalCount: schedules.length,
      validatedCount: validatedSchedules.length,
      convertedCount: convertedEvents.length,
      finalCount: deduplicatedEvents.length,
      duplicatesRemoved: convertedEvents.length - deduplicatedEvents.length
    });

    return deduplicatedEvents;
  }, [schedules]);

  // ✅ Step 2: 이중 데이터 소스 제거 - projects.meetings 대신 ScheduleContext만 사용
  // 기존 projectMeetingsToEvents는 제거하고 ScheduleContext 단일 소스 사용

  // ✅ Step 2: 단일 데이터 소스 - ScheduleContext만 사용
  const allScheduleEvents = useMemo(() => {
    console.log('📊 BuildupCalendarV3: Processing schedules from ScheduleContext only', {
      schedulesCount: schedulesToEvents.length,
      source: 'ScheduleContext_only'
    });

    return schedulesToEvents; // 단일 소스로 변경
  }, [schedulesToEvents]);

  // ScheduleContext 기반 필터링된 이벤트들
  const todayEvents = useMemo(() => {
    try {
      if (!getTodaySchedules || !schedulesToEvents.length) return [];
      return getTodaySchedules().map(schedule => schedulesToEvents.find(e => e.id === schedule.id)).filter(Boolean) as CalendarEvent[];
    } catch (error) {
      console.warn('Error getting today events:', error);
      return [];
    }
  }, [getTodaySchedules, schedulesToEvents]);

  const thisWeekEvents = useMemo(() => {
    try {
      if (!getSchedulesByDateRange || !schedulesToEvents.length) return [];

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      return getSchedulesByDateRange(weekStart, weekEnd).map(schedule =>
        schedulesToEvents.find(e => e.id === schedule.id)
      ).filter(Boolean) as CalendarEvent[];
    } catch (error) {
      console.warn('Error getting week events:', error);
      return [];
    }
  }, [getSchedulesByDateRange, schedulesToEvents]);

  const overdueEvents = useMemo(() => {
    if (!allScheduleEvents || allScheduleEvents.length === 0) return [];

    const now = new Date();
    return allScheduleEvents.filter(event =>
      event.status === 'overdue' ||
      (new Date(event.date) < now && event.status === 'scheduled')
    );
  }, [allScheduleEvents]);

  const stats = useMemo(() => ({
    total: allScheduleEvents.length,
    completed: allScheduleEvents.filter(e => e.status === 'completed').length,
    overdue: overdueEvents.length,
    upcoming: allScheduleEvents.filter(e =>
      e.status === 'scheduled' && new Date(e.date) > new Date()
    ).length
  }), [allScheduleEvents, overdueEvents]);

  // ScheduleContext 기반 필터링된 이벤트들 (filter 적용)
  const filteredEvents = useMemo(() => {
    let filtered = allScheduleEvents || [];

    // filter가 없거나 빈 객체인 경우 모든 이벤트 반환
    if (!filter) return filtered;

    // 프로젝트 필터
    if (filter.projects && filter.projects.length > 0) {
      filtered = filtered.filter(event =>
        event.projectId && filter.projects.includes(event.projectId)
      );
    }

    // 타입 필터
    if (filter.types && filter.types.length > 0) {
      filtered = filtered.filter(event =>
        filter.types.includes(event.type)
      );
    }

    // 상태 필터
    if (filter.statuses && filter.statuses.length > 0) {
      filtered = filtered.filter(event =>
        filter.statuses.includes(event.status)
      );
    }

    return filtered;
  }, [allScheduleEvents, filter]);

  // allEvents는 이제 filteredEvents와 동일
  const allEvents = filteredEvents;

  // 특정 날짜의 이벤트 가져오기
  const getEventsForDate = (date: Date) => {
    return allEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === date.getFullYear() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getDate() === date.getDate();
    });
  };

  // 월 변경
  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  // 미팅 완료 버튼 클릭 핸들러
  const handleMeetingCompleteClick = (event: CalendarEvent) => {
    setEventToComplete(event);
    setShowCompletionModal(true);
  };

  // 미팅 완료 처리
  const handleMeetingCompletion = withLoading('meeting_completion',
    withErrorHandler(async (record: Partial<GuideMeetingRecord>) => {
      if (!eventToComplete) {
        throw new Error('완료할 이벤트가 선택되지 않았습니다.');
      }

      // CalendarContext의 handleMeetingCompleted 호출
      await handleMeetingCompleted(eventToComplete.id, record.notes || '');

      // 성공 토스트 표시
      showSuccess('미팅이 성공적으로 완료되었습니다!');

      // 모달 닫기
      setShowCompletionModal(false);
      setEventToComplete(null);

      // LocalStorage에 미팅 기록 임시 저장 (추후 백엔드 연동)
      const meetingRecords = JSON.parse(localStorage.getItem('meetingRecords') || '[]');
      meetingRecords.push({
        ...record,
        eventId: eventToComplete.id,
        completedAt: new Date().toISOString()
      });
      localStorage.setItem('meetingRecords', JSON.stringify(meetingRecords));

    }, {
      operation: 'meeting_completion',
      component: 'BuildupCalendarV3',
      eventId: eventToComplete?.id
    })
  );

  // 오늘로 이동
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // 이벤트 타입별 아이콘
  const getEventIcon = (event: CalendarEvent) => {
    if (event.meetingData) {
      const meetingData = event.meetingData as EnhancedMeetingData;
      switch (meetingData.meetingType) {
        case 'pm_meeting': return <Users className="w-3 h-3" />;
        case 'pocket_mentor': return <GraduationCap className="w-3 h-3" />;
        case 'buildup_project': return <Briefcase className="w-3 h-3" />;
        case 'pocket_webinar': return <Presentation className="w-3 h-3" />;
        case 'external': return <Building className="w-3 h-3" />;
        default: return <Video className="w-3 h-3" />;
      }
    }
    return <Video className="w-3 h-3" />;
  };

  // 이벤트 색상
  const getEventColor = (event: CalendarEvent) => {
    const color = EventMetadataUtils.getEventColor(event);
    // 색상 코드를 Tailwind 클래스로 변환
    const colorMap: { [key: string]: string } = {
      '#DC2626': 'bg-red-600/10 text-red-600 border-red-600/30',
      '#F97316': 'bg-orange-500/10 text-orange-500 border-orange-500/30',
      '#FCD34D': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
      '#3B82F6': 'bg-blue-50 text-blue-600 border-blue-600/30',
      '#8B5CF6': 'bg-purple-600/10 text-purple-600 border-purple-600/30',
      '#10B981': 'bg-secondary-light text-green-600 border-green-600/30',
      '#6B7280': 'bg-gray-50 text-gray-900 border-gray-300'
    };
    return colorMap[color] || 'bg-blue-50 text-blue-600 border-blue-600/30';
  };

  // 이벤트 정렬 우선순위 (한 날짜에 여러 일정이 있을 때)
  const sortEventsByPriority = (events: CalendarEvent[]): CalendarEvent[] => {
    const priorityOrder = {
      'pm_meeting': 1,      // PM 미팅 최우선
      'pocket_mentor': 2,   // 포켓멘토 세션
      'buildup_project': 3, // 빌드업 프로젝트 미팅
      'pocket_webinar': 4,  // 포켓 웨비나
      'external': 5         // 외부 미팅
    };

    return events.sort((a, b) => {
      // 1. 미팅 타입별 우선순위
      const aMeetingType = (a.meetingData as EnhancedMeetingData)?.meetingType || 'external';
      const bMeetingType = (b.meetingData as EnhancedMeetingData)?.meetingType || 'external';
      const typeDiff = priorityOrder[aMeetingType] - priorityOrder[bMeetingType];
      if (typeDiff !== 0) return typeDiff;

      // 2. 우선순위 (critical > high > medium > low)
      const priorityValues = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityValues[a.priority] - priorityValues[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // 3. 시간순 (빠른 시간 우선)
      if (a.time && b.time) {
        return a.time.localeCompare(b.time);
      }

      return 0;
    });
  };

  // 캘린더 내보내기
  const exportCalendar = (format: 'google' | 'ics') => {
    if (format === 'ics') {
      CalendarIntegration.downloadICSFile(filteredEvents, 'pocketbuildup-calendar.ics');
    } else if (format === 'google' && filteredEvents.length > 0) {
      // 첫 번째 이벤트만 Google Calendar로 내보내기 (다중 이벤트는 ICS 사용 권장)
      const url = CalendarIntegration.generateGoogleCalendarURL(filteredEvents[0]);
      window.open(url, '_blank');
    }
    setShowExportMenu(false);
  };

  // 캘린더 날짜 생성
  const calendarDays = [];
  const day = new Date(calendarStart);

  while (day <= calendarEnd) {
    calendarDays.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }

  // 리스트 뷰 이벤트 그룹화
  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: CalendarEvent[] } = {};

    filteredEvents
      .filter(event => {
        // 유효한 날짜인지 확인
        try {
          return event.date && !isNaN(event.date.getTime());
        } catch {
          return false;
        }
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .forEach(event => {
        try {
          const dateKey = event.date.toISOString().split('T')[0];
          if (!groups[dateKey]) {
            groups[dateKey] = [];
          }
          groups[dateKey].push(event);
        } catch (error) {
          console.warn('Invalid date for event:', event, error);
        }
      });

    return groups;
  }, [filteredEvents]);

  // 제거된 통계 카드 - 단순화를 위해 제거

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm">
      {/* 🔥 Sprint 3 Phase 2: 단계별 필터 UI */}
      {showPhaseFilter && (
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">프로젝트 단계 필터</span>
            </div>
            <button
              onClick={() => setShowPhaseFilter(false)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(PHASE_INFO).map(([phase, info]) => {
              const isSelected = filter.phases?.includes(phase);
              return (
                <button
                  key={phase}
                  onClick={() => {
                    const currentPhases = filter.phases || [];
                    const newPhases = isSelected
                      ? currentPhases.filter(p => p !== phase)
                      : [...currentPhases, phase];
                    setFilter({ ...filter, phases: newPhases.length > 0 ? newPhases : undefined });
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {info.label}
                </button>
              );
            })}
            {filter.phases && filter.phases.length > 0 && (
              <button
                onClick={() => setFilter({ ...filter, phases: undefined })}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
              >
                초기화
              </button>
            )}
          </div>
        </div>
      )}

      {/* Calendar Header */}
      <CalendarHeader
        currentDate={currentDate}
        onPrevMonth={() => changeMonth('prev')}
        onNextMonth={() => changeMonth('next')}
        onGoToToday={goToToday}
        view={view}
        onViewChange={setView}
        onSyncData={syncAllData}
        onAddSchedule={() => openScheduleModal({ mode: 'create' })}
        onExportCalendar={exportCalendar}
        filteredEvents={filteredEvents}
        overdueEvents={overdueEvents}
        showExportMenu={showExportMenu}
        onToggleExportMenu={setShowExportMenu}
        isLoading={isLoading('calendar_sync')}
        // 🔥 Sprint 3 Phase 2: 필터 관련 props 추가
        showPhaseFilter={showPhaseFilter}
        onTogglePhaseFilter={() => setShowPhaseFilter(!showPhaseFilter)}
        activePhaseCount={filter.phases?.length || 0}
      />

      {/* Calendar Content */}
      {isLoading('calendar_sync') ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <Spinner size="large" variant="primary" />
            <p className="text-sm text-gray-500">캘린더 데이터를 동기화하는 중...</p>
          </div>
        </div>
      ) : (
        <CalendarContent
          view={view}
          currentDate={currentDate}
          selectedDate={selectedDate}
          onSelectedDateChange={setSelectedDate}
          filteredEvents={filteredEvents}
          groupedEvents={groupedEvents}
          schedules={schedules}
          calendarDays={calendarDays}
        onEventClick={(event) => {
          // ScheduleContext의 스케줄 여부 확인
          const schedule = schedules.find(s => s.id === event.id);
          if (schedule) {
            openScheduleModal({
              mode: view === 'list' ? 'view' : 'edit',
              schedule: schedule
            });
          } else {
            setSelectedEvent(event);
          }
        }}
        onDateDoubleClick={(date) => {
          openScheduleModal({
            mode: 'create',
            selectedDate: date
          });
        }}
        onCreateSchedule={() => openScheduleModal({ mode: 'create' })}
        onQuickAction={executeQuickAction}
        onMeetingCompleteClick={handleMeetingCompleteClick}
        getEventsForDate={getEventsForDate}
        sortEventsByPriority={sortEventsByPriority}
        getEventIcon={getEventIcon}
        getEventColor={getEventColor}
      />
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getEventColor(selectedEvent)}`}>
                  {getEventIcon(selectedEvent)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedEvent.title}</h3>
                  <p className="text-sm text-gray-600">{selectedEvent.projectTitle}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(selectedEvent.priority)}`}>
                      {selectedEvent.priority === 'critical' ? '긴급' :
                       selectedEvent.priority === 'high' ? '높음' :
                       selectedEvent.priority === 'medium' ? '보통' : '낮음'}
                    </span>
                    <span className="text-xs text-gray-300">
                      {getDDayText(selectedEvent.date)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 hover:bg-gray-50 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 기본 정보 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-900">
                  <Calendar className="w-4 h-4 text-gray-300" />
                  {selectedEvent.date.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </div>

                {selectedEvent.time && (
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <Clock className="w-4 h-4 text-gray-300" />
                    {selectedEvent.time}
                    {selectedEvent.duration && ` (${selectedEvent.duration}분)`}
                  </div>
                )}
              </div>

              {/* 미팅 상세 정보 */}
              {selectedEvent.meetingData && (
                <div className="pt-3 border-t">
                  {(() => {
                    const meetingData = selectedEvent.meetingData as EnhancedMeetingData;
                    return (
                      <>
                        {meetingData.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-900 mb-2">
                            <MapPin className="w-4 h-4 text-gray-300" />
                            {meetingData.location === 'online' ? '온라인 미팅' :
                             meetingData.location === 'offline' ? meetingData.offlineLocation :
                             '하이브리드'}
                          </div>
                        )}

                        {meetingData.meetingLink && (
                          <div className="flex items-center gap-2 mb-2">
                            <Video className="w-4 h-4 text-gray-300" />
                            <a
                              href={meetingData.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              미팅 링크
                            </a>
                          </div>
                        )}

                        {meetingData.pmMeetingData && (
                          <div className="bg-blue-50/30 rounded-lg p-3 text-sm">
                            <p className="font-medium mb-1">PM 미팅</p>
                            <p>담당: {meetingData.pmMeetingData.담당PM} {meetingData.pmMeetingData.PM직함}</p>
                            <p>회차: {meetingData.pmMeetingData.세션회차}회</p>
                            {meetingData.pmMeetingData.아젠다 && (
                              <p className="mt-1">아젠다: {meetingData.pmMeetingData.아젠다}</p>
                            )}
                          </div>
                        )}

                        {meetingData.buildupProjectData && (
                          <div className="bg-blue-50/30 rounded-lg p-3 text-sm">
                            <p className="font-medium mb-1">프로젝트 미팅</p>
                            <p>목적: {meetingData.buildupProjectData.미팅목적}</p>
                            <p>PM: {meetingData.buildupProjectData.PM명}</p>
                            {meetingData.buildupProjectData.아젠다 && (
                              <p className="mt-1">아젠다: {meetingData.buildupProjectData.아젠다}</p>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* 검토 정보 */}
              {selectedEvent.type === 'review' && selectedEvent.reviewData && (
                <div className="pt-3 border-t">
                  <div className="bg-orange-500/10 rounded-lg p-3 text-sm">
                    <p className="font-medium mb-1">검토 정보</p>
                    <p>유형: {selectedEvent.reviewData.reviewType}</p>
                    <p>승인자: {selectedEvent.reviewData.approver}</p>
                    {selectedEvent.reviewData.reviewItems.length > 0 && (
                      <p className="mt-1">항목: {selectedEvent.reviewData.reviewItems.join(', ')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* 참여자 */}
              {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium text-gray-900 mb-2">참여자</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.participants.map((participant, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-50 text-gray-900 text-xs rounded-full flex items-center gap-1">
                        {participant.role === 'host' && <Star className="w-3 h-3 text-yellow-500" />}
                        {participant.name}
                        {participant.confirmed && <CheckCircle className="w-3 h-3 text-green-600" />}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 태그 */}
              {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium text-gray-900 mb-2">태그</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-6">
              {selectedEvent.status === 'scheduled' && (
                <>
                  {selectedEvent.type === 'meeting' && selectedEvent.meetingData && (
                    <button
                      onClick={() => {
                        executeQuickAction(selectedEvent.id, 'join');
                        setSelectedEvent(null);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
                    >
                      <Video className="w-4 h-4" />
                      미팅 참여
                    </button>
                  )}
                  <button
                    onClick={() => {
                      executeQuickAction(selectedEvent.id, 'complete');
                      setSelectedEvent(null);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    완료 처리
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  const exports = CalendarIntegration.exportToServices(selectedEvent);
                  window.open(exports.google, '_blank');
                }}
                className="px-4 py-2 border border-gray-200 text-gray-900 hover:bg-gray-50 focus:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                캘린더 추가
              </button>

              <button
                onClick={() => {
                  navigate(`/startup/buildup/projects/${selectedEvent.projectId}`);
                  setSelectedEvent(null);
                }}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                프로젝트 보기
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Meeting Completion Modal */}
      <MeetingCompletionModal
        isOpen={showCompletionModal}
        onClose={() => {
          setShowCompletionModal(false);
          setEventToComplete(null);
        }}
        event={eventToComplete}
        onComplete={handleMeetingCompletion}
      />

      {/* Toast는 이제 ToastProvider에서 전역 관리됨 */}

      {/* Universal Schedule Modal */}
      <UniversalScheduleModal
        isOpen={modalState.isOpen}
        onClose={closeScheduleModal}
        schedule={modalState.schedule}
        mode={modalState.mode}
        defaultType={modalState.defaultType}
        onSuccess={(schedule) => {
          const operation = modalState.mode === 'create' ? '생성' : '수정';
          showSuccess(`일정이 성공적으로 ${operation}되었습니다`);

          // ✅ Step 3: 실시간 양방향 동기화 트리거
          const scheduleOperation = modalState.mode === 'create' ? 'create_meeting' : 'update_meeting';
          const projectId = (schedule as any).projectId;

          // 1. ScheduleContext로 동기화 요청 발송
          const eventId = `calendar_sync_${scheduleOperation}_${Date.now()}`;
          const syncEvent = new CustomEvent('schedule:sync_requested', {
            detail: {
              eventId,
              source: 'BuildupCalendarV3',
              projectId,
              meeting: {
                id: schedule.id,
                title: schedule.title,
                description: schedule.description,
                date: schedule.date,
                startDateTime: schedule.startDateTime,
                endDateTime: schedule.endDateTime,
                meetingSequence: (schedule as any).meetingSequence,
                agenda: (schedule as any).agenda || [],
                deliverables: (schedule as any).deliverables || [],
                participants: schedule.participants || [],
                location: schedule.location,
                status: schedule.status,
                phaseTransitionTrigger: (schedule as any).phaseTransitionTrigger
              },
              operation: scheduleOperation,
              timestamp: new Date(),
              modalMode: modalState.mode
            }
          });

          console.log(`📤 BuildupCalendarV3: Sending sync request to ScheduleContext`, {
            eventId,
            operation: scheduleOperation,
            scheduleId: schedule.id,
            title: schedule.title,
            projectId
          });

          window.dispatchEvent(syncEvent);

          // 2. 기존 이벤트도 유지 (호환성)
          const calendarEventDetail = {
            eventId: `calendar_${Date.now()}`,
            source: 'buildup_calendar_v3',
            operation: modalState.mode === 'create' ? 'created' : 'updated',
            schedule,
            timestamp: new Date(),
            modalMode: modalState.mode
          };

          const calendarEvent = new CustomEvent('calendar:schedule_action', {
            detail: calendarEventDetail
          });

          console.log('📤 BuildupCalendarV3: Emitting calendar schedule action', calendarEventDetail);
          window.dispatchEvent(calendarEvent);

          // 3. Phase Transition 처리 (필요시)
          if ((schedule as any).phaseTransitionTrigger && modalState.mode === 'create') {
            const { fromPhase, toPhase } = (schedule as any).phaseTransitionTrigger;

            const phaseEventId = `calendar_phase_${fromPhase}_to_${toPhase}_${Date.now()}`;
            const phaseTransitionEvent = new CustomEvent('project:phase_transition_requested', {
              detail: {
                eventId: phaseEventId,
                source: 'BuildupCalendarV3',
                projectId,
                fromPhase,
                toPhase,
                scheduleId: schedule.id,
                triggerType: 'meeting_scheduled',
                timestamp: new Date()
              }
            });

            console.log(`📤 BuildupCalendarV3: Sending phase transition request`, {
              eventId: phaseEventId,
              fromPhase,
              toPhase,
              scheduleId: schedule.id,
              projectId
            });

            window.dispatchEvent(phaseTransitionEvent);
          }

          // 4. BuildupContext로 데이터 변경 알림 (필요시)
          if (modalState.mode === 'create' && projectId) {
            const buildupChangeEvent = new CustomEvent('buildup:data_changed', {
              detail: {
                eventId: `calendar_buildup_meeting_added_${Date.now()}`,
                source: 'BuildupCalendarV3',
                projectId,
                changeType: 'meeting_added',
                data: {
                  meeting: schedule,
                  fromComponent: 'calendar'
                },
                timestamp: new Date()
              }
            });

            console.log(`📤 BuildupCalendarV3: Notifying BuildupContext of meeting addition`);
            window.dispatchEvent(buildupChangeEvent);
          }

          closeScheduleModal();
          // ScheduleContext 이벤트 리스너가 자동으로 처리함
        }}
      />

    </div>
  );
}