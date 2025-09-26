/**
 * Interactive Calendar Center Component
 *
 * 확장된 인터랙티브 캘린더 + 통합 이벤트 센터
 * - 좌측: GrowthCalendarPremium 통합 (60%)
 * - 우측: 3개 탭 통합 이벤트 패널 (40%)
 *   ├ 스마트매칭: comprehensiveEvents 기반
 *   ├ 긴급사항: 마감임박 + 위험상황
 *   └ 할일문서: 프로젝트 문서 + VDR
 * - 드래그&드롭 기반 직관적 일정 관리
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  ExternalLink,
  X,
  Search,
  Plus,
  Check,
  BarChart3,
  Users,
  DollarSign,
  Briefcase,
  MapPin,
  AlertCircle
} from 'lucide-react';
// GrowthCalendarPremium 제거 - 직접 구현으로 대체
import { format, addDays, startOfWeek, isToday, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useDashboard } from '../../contexts/DashboardContext';
import { useScheduleContext } from '../../contexts/ScheduleContext';
import type { UnifiedCalendarEvent } from '../../types/unifiedCalendar.types';
import { SMART_MATCHING_CATEGORY_STYLES } from '../../types/unifiedCalendar.types';
import {
  transformSmartMatchingEvent,
  transformBuildupEvent,
  isSameDay as isSameDayUtil,
  getDDayText,
  getCategoryLabel
} from '../../utils/unifiedCalendar.utils';
import { useDashboardInteraction } from '../../contexts/DashboardInteractionContext';
import { useKPIDiagnosis } from '../../contexts/KPIDiagnosisContext';
import { useBuildupContext } from '../../contexts/BuildupContext';
import { useVDRContext } from '../../contexts/VDRContext';
import { useCalendarContext } from '../../contexts/CalendarContext';
import { CalendarService } from '../../services/CalendarService';
import type { MatchingResult } from '../../types/smartMatching/types';

// 뷰 모드 정의
type ViewMode = 'calendar' | 'agenda';

interface InteractiveCalendarCenterProps {
  className?: string;
}

const InteractiveCalendarCenter: React.FC<InteractiveCalendarCenterProps> = ({ className = '' }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('agenda'); // 기본값을 아젠다로 설정
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [dropLoading, setDropLoading] = useState(false);
  const [dropFeedback, setDropFeedback] = useState<{ type: 'success' | 'error'; message: string; targetDate?: string } | null>(null);

  // Contexts
  const { draggedEvent, setDraggedEvent, hoveredDay, setHoveredDay, dismissedEvents } = useDashboardInteraction();
  const { overallScore, strongestAxis, progress } = useKPIDiagnosis();
  const { cart, activeProjects } = useBuildupContext();
  const { filesUploaded } = useVDRContext();
  const { weeklySchedule, currentWeek, navigateWeek } = useDashboard();
  const { schedules } = useScheduleContext();

  // CalendarContext에서 API 데이터 가져오기 (중앙화된 API 관리)
  const {
    smartMatchingEvents,
    urgentItems,
    todoItems,
    apiLoading,
    apiError,
    addEventToCalendarAPI,
    tabCounts,
    refreshSmartMatching,
    draggedEvents,
    addDraggedEvent,
    removeDraggedEvent
  } = useCalendarContext();

  // 월간 날짜 생성
  const monthStart = startOfMonth(currentWeek);
  const monthEnd = endOfMonth(currentWeek);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = startOfWeek(addDays(monthEnd, 6), { weekStartsOn: 1 });
  const calendarDates = eachDayOfInterval({ start: calendarStart, end: addDays(calendarEnd, 6) });

  // calendar-refresh 이벤트 리스너 (useCallback으로 최적화)
  const handleCalendarRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    window.addEventListener('calendar-refresh', handleCalendarRefresh);
    return () => {
      window.removeEventListener('calendar-refresh', handleCalendarRefresh);
    };
  }, [handleCalendarRefresh]);

  // 드래그&드롭 핸들러들 최적화
  const handleDragOver = useCallback((e: React.DragEvent, dateString: string) => {
    e.preventDefault();
    if (draggedEvent) {
      setHoveredDay(dateString);
    }
  }, [draggedEvent, setHoveredDay]);

  const handleDragLeave = useCallback(() => {
    setHoveredDay(null);
  }, [setHoveredDay]);

  const handleDrop = useCallback(async (e: React.DragEvent | null, date: Date) => {
    if (e) e.preventDefault();
    if (draggedEvent) {
      const dateString = format(date, 'yyyy-MM-dd');

      try {
        setDropLoading(true);

        // CalendarContext의 addDraggedEvent를 호출하여 실제 데이터 저장
        addDraggedEvent(draggedEvent, date);

        const success = await addEventToCalendarAPI(draggedEvent, date);

        if (success) {
          setRefreshKey(prev => prev + 1);

          // 💾 드래그 앨 드롭 작업 LocalStorage에 저장
          const dragHistory = JSON.parse(localStorage.getItem('calendarDragHistory') || '[]');
          const historyEntry = {
            eventId: draggedEvent.id || `temp-${Date.now()}`,
            eventTitle: draggedEvent.title,
            eventType: draggedEvent.type || 'smart_matching',
            toDate: date.toISOString(),
            timestamp: new Date().toISOString(),
            source: 'smart_matching_tab'
          };
          dragHistory.push(historyEntry);

          // 최근 50개 항목만 유지 (메모리 최적화)
          const trimmedHistory = dragHistory.slice(-50);
          localStorage.setItem('calendarDragHistory', JSON.stringify(trimmedHistory));

          // 캘린더 이벤트 백업도 저장 (복구용)
          const calendarBackup = {
            lastUpdated: new Date().toISOString(),
            events: CalendarService.getAllEvents()
          };
          localStorage.setItem('calendarBackup', JSON.stringify(calendarBackup));

          console.log('💾 이벤트 드래그 저장 완료:', historyEntry);

          // 성공 피드백 표시
          setDropFeedback({
            type: 'success',
            message: `"${draggedEvent.title}"이 ${format(date, 'M월 d일', { locale: ko })}에 추가되었습니다`,
            targetDate: dateString
          });

          // 3초 후 피드백 제거
          setTimeout(() => setDropFeedback(null), 3000);
        } else {
          throw new Error('API 호출 실패');
        }
      } catch (error) {
        console.error('Failed to add event:', error);

        // 에러 피드백 표시
        setDropFeedback({
          type: 'error',
          message: '이벤트 추가에 실패했습니다. 다시 시도해주세요.',
          targetDate: dateString
        });

        // 5초 후 피드백 제거
        setTimeout(() => setDropFeedback(null), 5000);
      } finally {
        setDropLoading(false);
        setDraggedEvent(null);
        setHoveredDay(null);
      }
    }
  }, [draggedEvent, addEventToCalendarAPI, addDraggedEvent, setDraggedEvent, setHoveredDay]);

  // 터치 드롭 이벤트 리스너 (모바일 지원) - handleDrop이 정의된 후에 위치
  useEffect(() => {
    const handleTouchDrop = (e: CustomEvent) => {
      const { dateString } = e.detail;
      if (draggedEvent && dateString) {
        const targetDate = new Date(dateString);
        handleDrop(null as any, targetDate);
      }
    };

    document.addEventListener('touchDrop', handleTouchDrop as EventListener);
    return () => {
      document.removeEventListener('touchDrop', handleTouchDrop as EventListener);
    };
  }, [draggedEvent, handleDrop]);

  // 통합된 캘린더 이벤트 생성
  const unifiedEvents = useMemo(() => {
    const events: UnifiedCalendarEvent[] = [];

    // 디버그 로그
    console.log('📊 캘린더 데이터 디버그:');
    console.log('- activeProjects:', activeProjects?.length || 0, '개');
    console.log('- activeProjects 상세:', activeProjects);

    // activeProjects의 구체적 구조 확인
    activeProjects?.forEach((project, index) => {
      console.log(`프로젝트 ${index + 1}:`, {
        id: project.id,
        title: project.title || project.name,
        nextMeeting: project.nextMeeting,
        meetings: project.meetings?.length || 0,
        meetingsData: project.meetings
      });
    });

    console.log('- schedules:', schedules?.length || 0, '개');
    console.log('- schedules 내용:', schedules);

    // schedules 배열에서 빌드업 프로젝트 관련 일정 찾기
    const buildupSchedules = schedules?.filter(schedule =>
      schedule.projectId === 'PRJ-001' ||
      schedule.projectId === 'PRJ-002' ||
      schedule.type?.includes('buildup') ||
      schedule.type?.includes('meeting') ||
      schedule.category?.includes('buildup')
    );
    console.log('🔍 빌드업 관련 schedules:', buildupSchedules?.length || 0, '개');
    console.log('🔍 빌드업 schedules 상세:', buildupSchedules);

    // 최근 생성된 스케줄들 확인 (오늘 이후 날짜)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const recentSchedules = schedules?.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate >= today;
    });
    console.log('📅 오늘 이후 schedules:', recentSchedules?.length || 0, '개');
    recentSchedules?.slice(0, 5).forEach((schedule, index) => {
      console.log(`📅 최근 스케줄 ${index + 1}:`, {
        id: schedule.id,
        title: schedule.title,
        date: schedule.date,
        type: schedule.type,
        projectId: schedule.projectId,
        category: schedule.category
      });
    });

    console.log('- draggedEvents:', draggedEvents?.length || 0, '개');

    // 1. 빌드업 프로젝트 실제 일정 (schedules 배열에서 진짜 데이터 사용!)
    const buildupRelatedSchedules = schedules?.filter(schedule => {
      // 명확한 빌드업 프로젝트 ID를 가진 일정만
      if (schedule.projectId === 'PRJ-001' || schedule.projectId === 'PRJ-002') {
        return true;
      }

      // 빌드업 관련 타입들만 (일반 meeting은 제외)
      if (schedule.type === 'buildup_project' || schedule.type?.includes('buildup')) {
        return true;
      }

      // 카테고리가 명확히 buildup인 것만
      if (schedule.category === 'buildup' || schedule.category?.includes('buildup')) {
        return true;
      }

      return false;
    });

    // 중복 제거 (같은 title과 date를 가진 것들)
    const uniqueBuildupSchedules = buildupRelatedSchedules?.filter((schedule, index, self) =>
      index === self.findIndex(s =>
        s.title === schedule.title &&
        new Date(s.date).toDateString() === new Date(schedule.date).toDateString()
      )
    );

    console.log('🔗 필터링 전 빌드업 스케줄:', buildupRelatedSchedules?.length || 0, '개');
    console.log('🔗 중복 제거 후 빌드업 스케줄:', uniqueBuildupSchedules?.length || 0, '개');

    uniqueBuildupSchedules?.forEach((schedule, index) => {
      // 해당 프로젝트 정보 찾기
      const relatedProject = activeProjects?.find(project =>
        project.id === schedule.projectId
      );

      const event: UnifiedCalendarEvent = {
        id: `real-schedule-${schedule.id}`,
        sourceType: 'real_buildup_schedule',  // 진짜 데이터임을 표시
        title: schedule.projectId
          ? `[${relatedProject?.title || '프로젝트'}] ${schedule.title}`
          : schedule.title,
        description: schedule.description || '',
        date: new Date(schedule.date),
        time: schedule.time || '14:00',
        category: 'buildup',
        priority: schedule.priority === 'high' ? 'high' : schedule.priority === 'medium' ? 'medium' : 'low',
        status: schedule.status === 'completed' ? 'completed' : 'pending',
        metadata: {
          projectId: schedule.projectId,
          projectName: relatedProject?.title,
          pmName: relatedProject?.team?.pm?.name,
          meetingType: schedule.type,
          isRealData: true  // 진짜 데이터임을 표시
        }
      } as UnifiedCalendarEvent;
      events.push(event);
    });

    // 2. 외부 미팅 일정은 제거 (스마트 매칭 이벤트가 자동으로 들어가는 것을 방지)
    // schedules
    //   .filter(schedule => schedule.type === 'external_meeting')
    //   .forEach(schedule => {
    //     const event: UnifiedCalendarEvent = {
    //       id: schedule.id,
    //       sourceType: 'buildup_schedule',
    //       title: schedule.title,
    //       description: schedule.description || '',
    //       date: new Date(schedule.date),
    //       time: schedule.time,
    //       category: 'external_meeting',
    //       priority: schedule.priority === 'high' ? 'high' : schedule.priority === 'medium' ? 'medium' : 'low',
    //       status: schedule.status === 'completed' ? 'completed' : 'pending',
    //       metadata: schedule.metadata
    //     } as UnifiedCalendarEvent;
    //     events.push(event);
    //   });

    // 3. 사용자가 드래그로 추가한 스마트매칭 이벤트들만
    draggedEvents.forEach((draggedEvent) => {
      const event: UnifiedCalendarEvent = {
        id: draggedEvent.id,
        sourceType: draggedEvent.sourceType || 'smart_matching',
        title: draggedEvent.title,
        description: draggedEvent.description || '',
        date: new Date(draggedEvent.date),
        time: `${draggedEvent.startTime} - ${draggedEvent.endTime}`,
        category: 'smart_matching',
        priority: draggedEvent.priority || 'medium',
        status: draggedEvent.status === 'completed' ? 'completed' : 'pending',
        metadata: {
          addedByDragDrop: true,
          originalEventId: draggedEvent.originalEventId,
          sourceType: draggedEvent.sourceType
        }
      } as UnifiedCalendarEvent;
      events.push(event);
    });

    return events;
  }, [activeProjects, schedules, refreshKey, draggedEvents]);

  // 특정 날짜의 이벤트 가져오기
  const getEventsForDate = (date: Date) => {
    return unifiedEvents.filter(event => isSameDayUtil(event.date, date));
  };

  // 필터링된 이벤트들
  const filteredEvents = useMemo(() => {
    return smartMatchingEvents
      .filter(event => !dismissedEvents.has(event.id))
      .filter(event =>
        searchQuery === '' ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.tags.some(tag =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
      .sort((a, b) => {
        // 긴급도 우선, 그 다음 매칭 점수
        if (a.urgencyLevel === 'high' && b.urgencyLevel !== 'high') return -1;
        if (b.urgencyLevel === 'high' && a.urgencyLevel !== 'high') return 1;
        return b.score - a.score;
      });
  }, [smartMatchingEvents, searchQuery, dismissedEvents]);

  // 스마트매칭 카운트
  const smartMatchingCount = filteredEvents.length;

  return (
    <div className={`bg-white rounded-2xl shadow-sm overflow-hidden ${className}`}>
      {/* 통합 헤더 - 단일 레이어 */}
      <div className="px-6 py-3 bg-gradient-to-r from-gray-50 to-blue-50/30 border-b border-gray-100">
        <div className="flex items-center justify-between">
          {/* 왼쪽: 제목 + 뷰 모드 + 네비게이션 */}
          <div className="flex items-center gap-6">
            {/* 메인 타이틀 */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">성장 캘린더</h1>
            </div>

            {/* 구분선 */}
            <div className="w-px h-6 bg-gray-300"></div>

            {/* 뷰 모드 토글 */}
            <div className="flex bg-white rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                  viewMode === 'calendar'
                    ? 'bg-gray-100 text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-4 h-4" />
                월간캘린더
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                  viewMode === 'agenda'
                    ? 'bg-gray-100 text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                주간아젠다
              </button>
            </div>

            {/* 날짜 네비게이션 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-1.5 hover:bg-white rounded-md transition-colors border border-transparent hover:border-gray-200"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <h3 className="font-semibold text-gray-900 min-w-[100px] text-center">
                {viewMode === 'calendar'
                  ? format(currentWeek, 'yyyy년 M월', { locale: ko })
                  : `${format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'M/d', { locale: ko })} - ${format(addDays(startOfWeek(currentWeek, { weekStartsOn: 1 }), 6), 'M/d', { locale: ko })}`
                }
              </h3>
              <button
                onClick={() => navigateWeek('next')}
                className="p-1.5 hover:bg-white rounded-md transition-colors border border-transparent hover:border-gray-200"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <button
              onClick={() => navigateWeek('today')}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              오늘
            </button>
          </div>

          {/* 오른쪽: 통계 + KPI */}
          <div className="flex items-center gap-4">
            {/* API 상태 */}
            {apiLoading && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm">
                <div className="w-3 h-3 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                로딩중
              </div>
            )}
            {apiError && (
              <div className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm" title={apiError}>
                오류
              </div>
            )}

            {/* 매칭 카운트 */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-700">매칭</span>
              <span className="text-sm font-bold text-blue-600">{smartMatchingCount}개</span>
            </div>
          </div>
        </div>
      </div>

      {/* 통합 바디 - 경계선 없이 자연스럽게 */}
      <div className="flex">
        {/* 캘린더/아젠다 영역 (75%) */}
        <div className="flex-[75] p-6 bg-gradient-to-br from-gray-50/30 to-white">
          {viewMode === 'calendar' ? (
            /* 기존 월간 캘린더 뷰 */
            <div className="grid grid-cols-7 gap-3">
            {/* 요일 헤더 */}
            {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
              <div
                key={day}
                className="text-center py-2 text-sm font-medium text-gray-600"
              >
                {day}
              </div>
            ))}

            {/* 날짜 셀 */}
            {calendarDates.map((date, index) => {
              const isCurrentDay = isToday(date);
              const isCurrentMonth = isSameMonth(date, currentWeek);
              const dateString = format(date, 'yyyy-MM-dd');
              const isDragOver = hoveredDay === dateString;

              return (
                <motion.div
                  key={index}
                  data-calendar-day={dateString}
                  className={`min-h-[110px] rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                    isCurrentDay
                      ? 'border-blue-400 bg-blue-50/50'
                      : isDragOver
                      ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg ring-2 ring-blue-200 ring-opacity-50'
                      : isCurrentMonth
                      ? 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  onDragOver={(e) => handleDragOver(e, dateString)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, date)}
                >
                  {/* 날짜 헤더 */}
                  <div className={`px-2 py-1.5 border-b ${
                    isCurrentDay
                      ? 'bg-blue-100/50 border-blue-200'
                      : isCurrentMonth
                      ? 'bg-gray-50/50 border-gray-100'
                      : 'bg-gray-100/30 border-gray-100'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${
                        isCurrentDay
                          ? 'text-blue-700'
                          : isCurrentMonth
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}>
                        {format(date, 'd')}
                      </span>
                      {isCurrentDay && (
                        <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                          오늘
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 이벤트 목록 */}
                  <div className="p-1.5 space-y-0.5">
                    <AnimatePresence>
                      {getEventsForDate(date).slice(0, 2).map((event) => (
                        <motion.div
                          key={event.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className={`px-1.5 py-0.5 text-xs rounded-md cursor-pointer group hover:shadow-sm transition-all ${
                            event.metadata?.addedByDragDrop
                              ? 'ring-1 ring-blue-300 shadow-sm'
                              : ''
                          }`}
                          style={{
                            backgroundColor: event.metadata?.addedByDragDrop
                              ? '#dbeafe'
                              : event.sourceType === 'smart_matching'
                              ? SMART_MATCHING_CATEGORY_STYLES[event.category]?.bgColor || '#f3f4f6'
                              : '#e0f2fe',
                            color: event.metadata?.addedByDragDrop
                              ? '#1e40af'
                              : event.sourceType === 'smart_matching'
                              ? SMART_MATCHING_CATEGORY_STYLES[event.category]?.textColor || '#374151'
                              : '#0369a1'
                          }}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1">
                              {event.metadata?.addedByDragDrop ? (
                                <span className="text-[10px] text-blue-600">📋</span>
                              ) : event.sourceType === 'smart_matching' ? (
                                <span className="text-[10px]">
                                  {SMART_MATCHING_CATEGORY_STYLES[event.category]?.icon || '📅'}
                                </span>
                              ) : (
                                <Users className="w-3 h-3" />
                              )}
                              <span className="truncate font-medium">
                                {event.title.length > 8 ? event.title.substring(0, 8) + '...' : event.title}
                              </span>
                            </div>
                            {/* 드래그로 추가된 이벤트에만 삭제 버튼 표시 */}
                            {event.metadata?.addedByDragDrop && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeDraggedEvent(event.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded-sm hover:bg-red-100 hover:text-red-600 transition-all"
                                title="캘린더에서 제거"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {getEventsForDate(date).length > 2 && (
                      <span className="text-[9px] text-gray-500 pl-1">
                        +{getEventsForDate(date).length - 2} more
                      </span>
                    )}
                    {isDragOver && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-blue-600 text-center py-1 border-2 border-dashed border-blue-300 rounded-md bg-blue-50"
                      >
                        ✨ 여기에 드롭
                      </motion.div>
                    )}
                    {getEventsForDate(date).length === 0 && !isDragOver && isCurrentMonth && (
                      <div className="text-center py-2 text-gray-400">
                        <Plus className="w-3 h-3 mx-auto mb-0.5" />
                        <p className="text-[9px]">일정 없음</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
          ) : (
            /* 컴팩트 아젠다 뷰 (상단 달력 없음) */
            <div className="flex flex-col h-full">
              <WeeklyAgenda
                weekDates={Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(currentWeek, { weekStartsOn: 1 }), i))}
                getEventsForDate={getEventsForDate}
                hoveredDay={hoveredDay}
                setHoveredDay={setHoveredDay}
                draggedEvent={draggedEvent}
                addEventToCalendar={addEventToCalendarAPI}
                setDraggedEvent={setDraggedEvent}
                setRefreshKey={setRefreshKey}
                handleDragOver={handleDragOver}
                handleDragLeave={handleDragLeave}
                handleDrop={handleDrop}
                removeDraggedEvent={removeDraggedEvent}
              />
            </div>
          )}
        </div>

        {/* 스마트매칭 패널 (25%) */}
        <div className="flex-[25] bg-gradient-to-br from-blue-50/40 via-white to-purple-50/30 border-l-2 border-blue-100 p-4 flex flex-col self-start shadow-sm">
          {/* 검색 바만 */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="지원사업 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 bg-white/80"
              />
            </div>
          </div>

          {/* 스마트매칭 컨텐츠 */}
          <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
            <SmartMatchingTab
              events={filteredEvents}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
        </div>
      </div>

      {/* 통합 푸터 - 상태바 */}
      <div className="px-6 py-3 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-4 text-gray-600">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              이번 주 일정 {weeklySchedule?.length || 0}개
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              매칭 이벤트 {filteredEvents.length}개
            </span>
          </div>
          <div className="flex items-center gap-2">
            {draggedEvent ? (
              <span className="text-blue-600 font-medium animate-pulse">
                🎯 캘린더에 드롭하세요
              </span>
            ) : (
              <span className="text-gray-500">
                이벤트를 드래그하여 캘린더에 추가
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 드래그&드롭 로딩 오버레이 */}
      {dropLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
        >
          <div className="bg-white rounded-lg p-6 shadow-lg flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-900 font-medium">이벤트를 추가하는 중...</span>
          </div>
        </motion.div>
      )}

      {/* 성공/실패 피드백 토스트 */}
      <AnimatePresence>
        {dropFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 right-4 z-50"
          >
            <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
              dropFeedback.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {dropFeedback.type === 'success' ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <p className="font-medium text-sm">{dropFeedback.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 스마트매칭 탭 컴포넌트
const SmartMatchingTab: React.FC<{
  events: MatchingResult[],
  searchQuery: string,
  onSearchChange: (query: string) => void
}> = React.memo(({ events, searchQuery, onSearchChange }) => {
  const { setDraggedEvent } = useDashboardInteraction();
  const [touchData, setTouchData] = useState<{ startX: number; startY: number; isDragging: boolean; element: HTMLElement | null } | null>(null);

  // 스타일 적용/복원 헬퍼 함수들 - 먼저 정의
  const applyDragStyle = (target: HTMLElement) => {
    target.style.transform = 'rotate(3deg) scale(0.95)';
    target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
    target.style.opacity = '0.8';
    target.style.zIndex = '1000';
    target.style.transition = 'all 0.2s ease';
  };

  const resetDragStyle = (target: HTMLElement) => {
    target.style.transform = '';
    target.style.boxShadow = '';
    target.style.opacity = '';
    target.style.zIndex = '';
    target.style.transition = '';
  };

  const handleDragStart = (event: MatchingResult) => (e: React.DragEvent) => {
    const dragData = {
      id: event.event.id,
      title: event.event.title,
      description: event.event.description,
      daysUntilDeadline: event.daysUntilDeadline,
      matchingScore: event.score,
      urgencyLevel: event.urgencyLevel
    };
    setDraggedEvent(dragData);
    e.dataTransfer.effectAllowed = 'copy';

    // 향상된 드래그 시각 효과
    const target = e.currentTarget as HTMLElement;
    applyDragStyle(target);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // 드래그 종료 시 스타일 복원
    const target = e.currentTarget as HTMLElement;
    resetDragStyle(target);
  };

  // 터치 이벤트 핸들러들 (모바일 지원)
  const handleTouchStart = (event: MatchingResult) => (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const target = e.currentTarget as HTMLElement;

    setTouchData({
      startX: touch.clientX,
      startY: touch.clientY,
      isDragging: false,
      element: target
    });

    // 드래그 데이터 설정
    const dragData = {
      id: event.event.id,
      title: event.event.title,
      description: event.event.description,
      daysUntilDeadline: event.daysUntilDeadline,
      matchingScore: event.score,
      urgencyLevel: event.urgencyLevel
    };
    setDraggedEvent(dragData);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchData) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchData.startX);
    const deltaY = Math.abs(touch.clientY - touchData.startY);

    // 10px 이상 움직이면 드래그로 인식
    if ((deltaX > 10 || deltaY > 10) && !touchData.isDragging) {
      setTouchData(prev => prev ? { ...prev, isDragging: true } : null);
      if (touchData.element) {
        applyDragStyle(touchData.element);
      }
      e.preventDefault(); // 스크롤 방지
    }

    if (touchData.isDragging) {
      // 드래그 중일 때 요소를 따라다니게 할 수도 있음 (옵션)
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchData) return;

    if (touchData.isDragging) {
      const touch = e.changedTouches[0];
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);

      // 캘린더 날짜 영역에 드롭되었는지 확인
      const calendarDay = elementBelow?.closest('[data-calendar-day]');
      if (calendarDay) {
        const dateString = calendarDay.getAttribute('data-calendar-day');
        if (dateString) {
          // 드롭 이벤트 시뮬레이션
          const dropEvent = new CustomEvent('touchDrop', {
            detail: { dateString }
          });
          document.dispatchEvent(dropEvent);
        }
      }
    }

    if (touchData.element) {
      resetDragStyle(touchData.element);
    }

    setTouchData(null);
    setDraggedEvent(null);
  };

  const getUrgencyColor = (urgencyLevel: string, daysUntil: number) => {
    if (urgencyLevel === 'high' || daysUntil <= 7) return 'bg-red-100 text-red-700';
    if (urgencyLevel === 'medium' || daysUntil <= 14) return 'bg-orange-100 text-orange-700';
    return 'bg-green-100 text-green-700';
  };

  const getBorderColor = (urgencyLevel: string) => {
    if (urgencyLevel === 'high') return 'border-red-200 bg-red-50';
    if (urgencyLevel === 'medium') return 'border-orange-200 bg-orange-50';
    return 'border-blue-200 bg-blue-50';
  };

  return (
    <div className="space-y-3">
      {/* 실제 이벤트 목록 */}
      <div className="space-y-2">
        {events.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            {searchQuery ? '검색 결과가 없습니다' : '표시할 이벤트가 없습니다'}
          </div>
        ) : (
          events.slice(0, 10).map((matchingResult) => {
            const event = matchingResult.event;

            return (
              <div
                key={event.id}
                draggable
                onDragStart={handleDragStart(matchingResult)}
                onDragEnd={handleDragEnd}
                onTouchStart={handleTouchStart(matchingResult)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`group p-2 border rounded-lg cursor-grab active:cursor-grabbing hover:shadow-md transition-all relative ${getBorderColor(matchingResult.urgencyLevel)}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2 flex-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${getUrgencyColor(matchingResult.urgencyLevel, matchingResult.daysUntilDeadline)}`}>
                      D-{matchingResult.daysUntilDeadline}
                    </span>
                    <span className="text-xs text-blue-600 font-medium">
                      {matchingResult.score}점
                    </span>
                  </div>

                  {/* 캘린더 추가 버튼만 표시 */}
                  <div className="opacity-70 hover:opacity-100 transition-opacity duration-200 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // 드래그 앤 드롭 대신 클릭으로도 캘린더에 추가 가능하도록 개선 예정
                      }}
                      className="w-6 h-6 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors flex items-center justify-center"
                      title="드래그해서 캘린더에 추가"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-sm mb-1 line-clamp-1 pr-16">{event.title}</h4>
                <p className="text-xs text-gray-600 mb-1 line-clamp-1 pr-16">
                  {event.description}
                </p>

                {/* 키워드 태그 */}
                <div className="flex flex-wrap gap-1">
                  {event.keywords.slice(0, 2).map((keyword) => (
                    <span
                      key={keyword}
                      className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {events.length > 0 && (
        <div className="text-center text-gray-400 text-xs py-2">
          ⬅️ 이벤트를 캘린더로 드래그하거나 캘린더 추가 버튼을 클릭하세요
        </div>
      )}
    </div>
  );
});

// 긴급사항 탭 컴포넌트
const UrgentTab: React.FC<{
  urgentEvents: MatchingResult[],
  kpiScore: number,
  strongestAxis: string
}> = React.memo(({ urgentEvents, kpiScore, strongestAxis }) => {
  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {/* KPI 위험 상황 */}
      {kpiScore < 70 && (
        <div className="p-3 border border-orange-200 rounded-lg bg-orange-50">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">KPI 위험</span>
            </div>
          </div>
          <h4 className="font-bold text-sm mb-1">종합 점수 {kpiScore.toFixed(1)}점 - 개선 필요</h4>
          <p className="text-xs text-gray-600 mb-2">
            {strongestAxis}축은 양호하나, 전체적인 균형 점검이 필요합니다
          </p>
          <button className="w-full px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600">
            KPI 진단 보기
          </button>
        </div>
      )}

      {/* 마감임박 이벤트들 */}
      {urgentEvents.map((matchingResult) => {
        const event = matchingResult.event;
        const daysLeft = matchingResult.daysUntilDeadline;

        return (
          <div key={event.id} className="p-3 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-600" />
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                  D-{daysLeft} 마감임박
                </span>
              </div>
              <span className="text-xs text-red-600 font-medium">
                매칭도 {matchingResult.score}점
              </span>
            </div>
            <h4 className="font-bold text-sm mb-1 line-clamp-1">{event.title}</h4>
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
              {event.description}
            </p>
            <div className="flex gap-2">
              <button className="flex-1 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">
                즉시 처리
              </button>
              <button
                onClick={() => window.open(event.originalUrl, '_blank')}
                className="px-2 py-1 border text-xs rounded hover:bg-gray-50"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}

      {urgentEvents.length === 0 && kpiScore >= 70 && (
        <div className="text-center text-gray-400 text-sm py-8">
          🎉 현재 긴급한 사안이 없습니다!
        </div>
      )}
    </div>
  );
});

// 할일문서 탭 컴포넌트
const TodoDocsTab: React.FC<{
  cartItems: any[],
  uploadedFiles: any[]
}> = React.memo(({ cartItems, uploadedFiles }) => {
  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {/* 프로젝트 할일 (Buildup Cart) */}
      {cartItems.length > 0 && (
        <>
          <div className="text-xs font-medium text-gray-500 mb-2">프로젝트 할일</div>
          {cartItems.slice(0, 5).map((item, index) => (
            <div key={index} className="p-3 border border-purple-200 rounded-lg bg-purple-50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">프로젝트</span>
                </div>
              </div>
              <h4 className="font-bold text-sm mb-1 line-clamp-1">
                {item.title || item.name || `프로젝트 항목 ${index + 1}`}
              </h4>
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {item.description || '프로젝트 진행 중인 항목입니다'}
              </p>
              <div className="flex gap-2">
                <button className="flex-1 px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600">
                  항목 확인
                </button>
                <button className="px-2 py-1 border text-xs rounded hover:bg-gray-50">
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* VDR 업로드된 파일들 */}
      {uploadedFiles.length > 0 && (
        <>
          <div className="text-xs font-medium text-gray-500 mb-2">VDR 문서</div>
          {uploadedFiles.slice(0, 3).map((file, index) => (
            <div key={index} className="p-3 border border-green-200 rounded-lg bg-green-50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">VDR</span>
                </div>
              </div>
              <h4 className="font-bold text-sm mb-1 line-clamp-1">
                {file.name || `VDR 문서 ${index + 1}`}
              </h4>
              <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                {file.description || '업로드된 실사자료'}
              </p>
              <button className="w-full px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600">
                문서 확인
              </button>
            </div>
          ))}
        </>
      )}

      {/* 빈 상태 */}
      {cartItems.length === 0 && uploadedFiles.length === 0 && (
        <div className="text-center text-gray-400 text-sm py-8">
          📋 현재 처리할 문서가 없습니다
          <br />
          <span className="text-xs">프로젝트나 VDR 업로드를 진행해보세요</span>
        </div>
      )}

      {/* 추가 액션 버튼 */}
      {(cartItems.length > 0 || uploadedFiles.length > 0) && (
        <div className="pt-3 border-t">
          <button className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">
            모든 문서 보기
          </button>
        </div>
      )}
    </div>
  );
});

// 주간 아젠다 컴포넌트
interface WeeklyAgendaProps {
  weekDates: Date[];
  getEventsForDate: (date: Date) => UnifiedCalendarEvent[];
  hoveredDay: string | null;
  setHoveredDay: (day: string | null) => void;
  draggedEvent: any;
  addEventToCalendar: (event: any, date: Date) => Promise<boolean>;
  setDraggedEvent: (event: any) => void;
  setRefreshKey: (fn: (prev: number) => number) => void;
  handleDragOver: (e: React.DragEvent, dateString: string) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, date: Date) => void;
  removeDraggedEvent: (eventId: string) => void;
}

const WeeklyAgenda: React.FC<WeeklyAgendaProps> = React.memo(({
  weekDates,
  getEventsForDate,
  hoveredDay,
  setHoveredDay,
  draggedEvent,
  addEventToCalendar,
  setDraggedEvent,
  setRefreshKey,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  removeDraggedEvent
}) => {
  // 주간 날짜별 이벤트 데이터 메모이제이션
  const weeklyEventData = useMemo(() => {
    return weekDates.map(date => ({
      date,
      events: getEventsForDate(date),
      dateString: format(date, 'yyyy-MM-dd'),
      isToday: isSameDay(date, new Date())
    }));
  }, [weekDates, getEventsForDate]);
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* 테이블 헤더 */}
      <div className="flex bg-gray-50 border-b border-gray-200">
        <div className="w-24 px-3 py-2 text-xs font-semibold text-gray-700 border-r border-gray-200">
          날짜
        </div>
        <div className="flex-1 px-3 py-2 text-xs font-semibold text-gray-700">
          일정
        </div>
      </div>

      {/* 테이블 바디 (최적화된 데이터 사용) */}
      {weeklyEventData.map(({ date, events: dayEvents, dateString, isToday }, dayIndex) => {
        const isDragOver = hoveredDay === dateString;

        return (
          <div
            key={dayIndex}
            data-calendar-day={dateString}
            className={`flex border-b border-gray-100 hover:bg-gray-50 transition-colors ${
              isDragOver ? 'bg-blue-50' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, dateString)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, date)}
          >
            {/* 왼쪽 날짜 컬럼 */}
            <div className={`w-24 px-3 py-3 border-r border-gray-200 flex-shrink-0 ${
              isToday ? 'bg-blue-50' : ''
            }`}>
              <div className="text-center">
                <div className={`text-xs font-semibold ${
                  isToday ? 'text-blue-700' : 'text-gray-600'
                }`}>
                  {format(date, 'M/d', { locale: ko })}
                </div>
                <div className={`text-xs ${
                  isToday ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {format(date, 'E', { locale: ko })}
                </div>
                {isToday && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mt-1"></div>
                )}
              </div>
            </div>

            {/* 오른쪽 일정 컬럼 */}
            <div className="flex-1 px-3 py-2">
              {isDragOver && (
                <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded mb-2 text-center">
                  ✨ 드롭하여 추가
                </div>
              )}

              {dayEvents.length > 0 ? (
                <div className="space-y-1.5">
                  {dayEvents.map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      className="flex items-center gap-2 p-2 rounded hover:bg-white border border-transparent hover:border-gray-200 cursor-pointer group transition-all"
                    >
                      {/* 일정/매칭 구분 점 */}
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        event.sourceType === 'smart_matching'
                          ? 'bg-blue-500'  // 매칭 이벤트는 파란색
                          : (event.sourceType === 'real_buildup_schedule' || event.sourceType === 'buildup_schedule')
                          ? 'bg-green-500'  // 빌드업 일정은 초록색
                          : 'bg-gray-500'   // 기타는 회색
                      }`}></div>

                      {/* 이벤트 정보 */}
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900 truncate">
                          {event.title}
                        </span>
                        {event.time && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
                            {event.time}
                          </span>
                        )}
                      </div>

                      {/* 소스 타입과 삭제 버튼 */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {event.sourceType === 'smart_matching' ? (
                          <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded font-medium">
                            매칭
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            일정
                          </span>
                        )}

                        {/* 드래그로 추가된 이벤트에만 삭제 버튼 표시 */}
                        {event.metadata?.addedByDragDrop && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeDraggedEvent(event.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-sm hover:bg-red-100 hover:text-red-600 transition-all"
                            title="캘린더에서 제거"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : !isDragOver ? (
                <div className="text-xs text-gray-400 py-2">
                  일정 없음
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default InteractiveCalendarCenter;