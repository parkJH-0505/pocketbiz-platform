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

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  FileText,
  Clock,
  Heart,
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
import { format, addDays, startOfWeek, isToday, isSameDay } from 'date-fns';
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
import { comprehensiveEvents } from '../../data/smartMatching/comprehensiveEvents';
import type { MatchingResult } from '../../types/smartMatching/types';

// 탭 정의
type TabType = 'smart_matching' | 'urgent' | 'todo_docs';

interface Tab {
  id: TabType;
  title: string;
  icon: any;
  badge?: number;
}


interface InteractiveCalendarCenterProps {
  className?: string;
}

const InteractiveCalendarCenter: React.FC<InteractiveCalendarCenterProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<TabType>('smart_matching');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Contexts
  const { draggedEvent, setDraggedEvent, hoveredDay, setHoveredDay, interestedEvents, dismissedEvents, addEventToCalendar } = useDashboardInteraction();
  const { overallScore, strongestAxis, progress } = useKPIDiagnosis();
  const { cart } = useBuildupContext();
  const { filesUploaded } = useVDRContext();
  const { weeklySchedule, currentWeek, navigateWeek } = useDashboard();
  const { schedules } = useScheduleContext();

  // 주간 날짜 생성
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // calendar-refresh 이벤트 리스너
  useEffect(() => {
    const handleCalendarRefresh = () => {
      setRefreshKey(prev => prev + 1);
    };
    window.addEventListener('calendar-refresh', handleCalendarRefresh);
    return () => {
      window.removeEventListener('calendar-refresh', handleCalendarRefresh);
    };
  }, []);

  // 통합된 캘린더 이벤트 생성
  const unifiedEvents = useMemo(() => {
    const events: UnifiedCalendarEvent[] = [];

    // ScheduleContext에서 스케줄 추가
    schedules
      .filter(schedule => schedule.type === 'external_meeting' && schedule.metadata?.source === 'smart_matching')
      .forEach(schedule => {
        const event: UnifiedCalendarEvent = {
          id: schedule.id,
          sourceType: 'smart_matching',
          title: schedule.title,
          description: schedule.description || '',
          date: new Date(schedule.date),
          time: schedule.time,
          category: schedule.metadata?.category || 'external_meeting',
          priority: schedule.priority === 'high' ? 'high' : schedule.priority === 'medium' ? 'medium' : 'low',
          status: schedule.status === 'completed' ? 'completed' : 'pending',
          metadata: {
            ...schedule.metadata,
            addedByDragDrop: true
          }
        } as UnifiedCalendarEvent;
        events.push(event);
      });

    // 기존 스마트매칭 이벤트 변환 (마감일 기준으로 해당 주에 표시)
    comprehensiveEvents.forEach((matchingResult) => {
      const transformResult = transformSmartMatchingEvent(matchingResult);
      if (transformResult.success && transformResult.event) {
        events.push(transformResult.event);
      }
    });

    // 빌드업 일정 변환
    weeklySchedule.forEach(scheduleEvent => {
      const transformResult = transformBuildupEvent(scheduleEvent);
      if (transformResult.success && transformResult.event) {
        events.push(transformResult.event);
      }
    });

    return events;
  }, [weeklySchedule, schedules, refreshKey]);

  // 특정 날짜의 이벤트 가져오기
  const getEventsForDate = (date: Date) => {
    return unifiedEvents.filter(event => isSameDayUtil(event.date, date));
  };

  // 필터링된 이벤트들
  const filteredEvents = useMemo(() => {
    return comprehensiveEvents
      .filter(event => !dismissedEvents.has(event.event.id))
      .filter(event =>
        searchQuery === '' ||
        event.event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.event.keywords.some(keyword =>
          keyword.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
      .sort((a, b) => {
        // 긴급도 우선, 그 다음 매칭 점수
        if (a.urgencyLevel === 'high' && b.urgencyLevel !== 'high') return -1;
        if (b.urgencyLevel === 'high' && a.urgencyLevel !== 'high') return 1;
        return b.score - a.score;
      });
  }, [searchQuery, dismissedEvents]);

  // 탭별 카운트 업데이트
  const tabCounts = useMemo(() => {
    const urgentCount = filteredEvents.filter(e => e.daysUntilDeadline <= 14).length;
    const todoCount = (cart?.items?.length || 0) + (filesUploaded?.length || 0);

    return {
      smart_matching: filteredEvents.length,
      urgent: urgentCount + (overallScore < 70 ? 1 : 0), // KPI 위험도 포함
      todo_docs: todoCount
    };
  }, [filteredEvents, cart, filesUploaded, overallScore]);

  // TABS 업데이트
  const TABS: Tab[] = [
    {
      id: 'smart_matching',
      title: '스마트매칭',
      icon: Sparkles,
      badge: tabCounts.smart_matching
    },
    {
      id: 'urgent',
      title: '긴급사항',
      icon: AlertTriangle,
      badge: tabCounts.urgent
    },
    {
      id: 'todo_docs',
      title: '할일문서',
      icon: FileText,
      badge: tabCounts.todo_docs
    }
  ];

  return (
    <div className={`bg-white rounded-2xl shadow-sm overflow-hidden ${className}`}>
      {/* 통합 헤더 - 캘린더 네비게이션과 탭을 한 줄에 */}
      <div className="px-6 py-4 bg-gradient-to-r from-white to-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          {/* 왼쪽: 날짜 네비게이션 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200 hover:shadow-sm"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-lg text-gray-900">
                {format(weekStart, 'yyyy년 M월 d일', { locale: ko })} - {format(addDays(weekStart, 6), 'M월 d일', { locale: ko })}
              </h3>
            </div>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200 hover:shadow-sm"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => navigateWeek('today')}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              오늘
            </button>
          </div>

          {/* 오른쪽: 탭 선택기 (통합) */}
          <div className="flex gap-1 bg-white/50 p-1 rounded-lg">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                    isActive
                      ? 'bg-white shadow-sm text-blue-600 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{tab.title}</span>
                  {tab.badge > 0 && (
                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                      isActive
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 통합 바디 - 경계선 없이 자연스럽게 */}
      <div className="flex" style={{ minHeight: '600px' }}>
        {/* 캘린더 영역 (65%) */}
        <div className="flex-[65] p-6">
          {/* 캘린더 그리드 직접 구현 */}
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

            {/* 날짜 칬 */}
            {weekDates.map((date, index) => {
              const isCurrentDay = isToday(date);
              const dateString = format(date, 'yyyy-MM-dd');
              const isDragOver = hoveredDay === dateString;

              return (
                <motion.div
                  key={index}
                  className={`min-h-[120px] rounded-xl border-2 transition-all overflow-hidden ${
                    isCurrentDay
                      ? 'border-blue-400 bg-blue-50/50'
                      : isDragOver
                      ? 'border-blue-400 bg-blue-50 scale-105'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggedEvent) {
                      setHoveredDay(dateString);
                    }
                  }}
                  onDragLeave={() => {
                    setHoveredDay(null);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    if (draggedEvent) {
                      try {
                        const success = await addEventToCalendar(draggedEvent, date);
                        if (success) {
                          setRefreshKey(prev => prev + 1);
                        }
                      } catch (error) {
                        console.error('Failed to add event:', error);
                      } finally {
                        setDraggedEvent(null);
                        setHoveredDay(null);
                      }
                    }
                  }}
                >
                  {/* 날짜 헤더 */}
                  <div className={`px-3 py-2 border-b ${
                    isCurrentDay ? 'bg-blue-100/50 border-blue-200' : 'bg-gray-50/50 border-gray-100'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${
                        isCurrentDay ? 'text-blue-700' : 'text-gray-900'
                      }`}>
                        {format(date, 'd')}
                      </span>
                      {isCurrentDay && (
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                          오늘
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 이벤트 목록 */}
                  <div className="p-2 space-y-1">
                    <AnimatePresence>
                      {getEventsForDate(date).slice(0, 3).map((event) => (
                        <motion.div
                          key={event.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="px-2 py-1 text-xs rounded-md cursor-pointer group hover:shadow-sm transition-all"
                          style={{
                            backgroundColor: event.sourceType === 'smart_matching'
                              ? SMART_MATCHING_CATEGORY_STYLES[event.category]?.bgColor || '#f3f4f6'
                              : '#e0f2fe',
                            color: event.sourceType === 'smart_matching'
                              ? SMART_MATCHING_CATEGORY_STYLES[event.category]?.textColor || '#374151'
                              : '#0369a1'
                          }}
                        >
                          <div className="flex items-center gap-1">
                            {event.sourceType === 'smart_matching' ? (
                              <span className="text-[10px]">
                                {SMART_MATCHING_CATEGORY_STYLES[event.category]?.icon || '📅'}
                              </span>
                            ) : (
                              <Users className="w-3 h-3" />
                            )}
                            <span className="truncate font-medium">
                              {event.title.length > 12 ? event.title.substring(0, 12) + '...' : event.title}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {getEventsForDate(date).length > 3 && (
                      <span className="text-[10px] text-gray-500 pl-2">
                        +{getEventsForDate(date).length - 3} more
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
                    {getEventsForDate(date).length === 0 && !isDragOver && (
                      <div className="text-center py-3 text-gray-400">
                        <Plus className="w-3 h-3 mx-auto mb-1" />
                        <p className="text-[10px]">일정 없음</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 이벤트 패널 (35%) - 경계선 대신 배경색으로 구분 */}
        <div className="flex-[35] bg-gradient-to-b from-gray-50/50 to-white p-6">
          {/* 검색 바 */}
          {activeTab === 'smart_matching' && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="이벤트 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* 탭 컨텐츠 */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(600px - 100px)' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {activeTab === 'smart_matching' && (
                  <SmartMatchingTab
                    events={filteredEvents}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    interestedEvents={interestedEvents}
                  />
                )}
                {activeTab === 'urgent' && (
                  <UrgentTab
                    urgentEvents={filteredEvents.filter(e => e.daysUntilDeadline <= 14)}
                    kpiScore={overallScore}
                    strongestAxis={strongestAxis}
                  />
                )}
                {activeTab === 'todo_docs' && (
                  <TodoDocsTab
                    cartItems={cart?.items || []}
                    uploadedFiles={filesUploaded || []}
                  />
                )}
              </motion.div>
            </AnimatePresence>
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
    </div>
  );
};

// 스마트매칭 탭 컴포넌트
const SmartMatchingTab: React.FC<{
  events: MatchingResult[],
  searchQuery: string,
  onSearchChange: (query: string) => void,
  interestedEvents: Set<string>
}> = React.memo(({ events, searchQuery, onSearchChange, interestedEvents }) => {
  const { setDraggedEvent, markEventInterested, addEventToCalendar } = useDashboardInteraction();

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
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
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
            const isInterested = interestedEvents.has(event.id);

            return (
              <div
                key={event.id}
                draggable
                onDragStart={handleDragStart(matchingResult)}
                onDragEnd={handleDragEnd}
                className={`p-3 border rounded-lg cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${getBorderColor(matchingResult.urgencyLevel)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-1 rounded ${getUrgencyColor(matchingResult.urgencyLevel, matchingResult.daysUntilDeadline)}`}>
                    D-{matchingResult.daysUntilDeadline}
                  </span>
                  <span className="text-xs text-blue-600 font-medium">
                    매칭도 {matchingResult.score}점
                  </span>
                </div>

                <h4 className="font-bold text-sm mb-1 line-clamp-2">{event.title}</h4>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {event.description}
                </p>

                {/* 키워드 태그 */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {event.keywords.slice(0, 3).map((keyword) => (
                    <span
                      key={keyword}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => addEventToCalendar({
                      id: event.id,
                      title: event.title,
                      daysUntilDeadline: matchingResult.daysUntilDeadline,
                      matchingScore: matchingResult.score,
                      urgencyLevel: matchingResult.urgencyLevel
                    }, new Date())}
                    className="flex-1 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                  >
                    캘린더 추가
                  </button>
                  <button
                    onClick={() => markEventInterested(event.id)}
                    className={`px-2 py-1 border text-xs rounded hover:bg-gray-50 transition-colors ${
                      isInterested ? 'bg-red-50 border-red-200 text-red-600' : ''
                    }`}
                  >
                    <Heart className={`w-3 h-3 ${isInterested ? 'fill-current' : ''}`} />
                  </button>
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

export default InteractiveCalendarCenter;