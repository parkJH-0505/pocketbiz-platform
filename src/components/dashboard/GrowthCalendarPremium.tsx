/**
 * Growth Calendar Premium Component
 *
 * 스타트업 대표를 위한 프리미엄 성장 캘린더
 * - 드래그 앤 드롭
 * - AI 추천 시간대
 * - 실시간 진행률
 * - 미니 대시보드
 * - 퀵 액션
 */

import React, { useState, memo, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  BarChart3,
  Users,
  DollarSign,
  Briefcase,
  Clock,
  MapPin,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { format, addDays, startOfWeek, isToday, isSameDay, differenceInMinutes } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useDashboard } from '../../contexts/DashboardContext';
import { useKPIDiagnosis } from '../../contexts/KPIDiagnosisContext';
import { useScheduleContext } from '../../contexts/ScheduleContext';
import { comprehensiveEvents } from '../../data/smartMatching/comprehensiveEvents';
import type { CalendarEvent } from '../../types/calendar.types';
import type { MatchingResult } from '../../types/smartMatching/types';
import type { UnifiedCalendarEvent, SmartMatchingCalendarEvent } from '../../types/unifiedCalendar.types';
import { SMART_MATCHING_CATEGORY_STYLES } from '../../types/unifiedCalendar.types';
import {
  transformSmartMatchingEvent,
  transformBuildupEvent,
  isSameDay as isSameDayUtil,
  getDDayText,
  getCategoryLabel
} from '../../utils/unifiedCalendar.utils';

// 이벤트 카테고리별 설정 - 3개로 단순화
const EVENT_CATEGORIES = {
  kpi: {
    label: 'KPI 체크',
    icon: BarChart3,
    color: 'blue'
  },
  funding: {
    label: '자금 조달',
    icon: DollarSign,
    color: 'green'
  },
  meeting: {
    label: '미팅',
    icon: Briefcase,
    color: 'gray'
  }
};

const GrowthCalendarPremium: React.FC = () => {
  const { weeklySchedule, currentWeek, navigateWeek, markEventCompleted } = useDashboard();
  const { progress } = useKPIDiagnosis();
  const { schedules } = useScheduleContext(); // ScheduleContext에서 스케줄 가져오기
  const [selectedEvent, setSelectedEvent] = useState<UnifiedCalendarEvent | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddType, setQuickAddType] = useState<string>('kpi');
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // 캘린더 리프레시용

  // 필터 상태 관리
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // 주간 날짜 생성
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // calendar-refresh 이벤트 리스너 추가
  useEffect(() => {
    const handleCalendarRefresh = () => {
      setRefreshKey(prev => prev + 1); // 컴포넌트 리렌더링 트리거
    };

    window.addEventListener('calendar-refresh', handleCalendarRefresh);
    return () => {
      window.removeEventListener('calendar-refresh', handleCalendarRefresh);
    };
  }, []);

  // 통합된 캘린더 이벤트 생성
  const unifiedEvents = useMemo(() => {
    const events: UnifiedCalendarEvent[] = [];

    // ScheduleContext에서 external_meeting 타입 스케줄 추가 (드래그&드롭으로 추가된 스마트매칭 이벤트)
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
        };
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

  // 필터링된 이벤트 가져오기
  const getFilteredEvents = useMemo(() => {
    if (activeFilters.length === 0) return unifiedEvents;

    return unifiedEvents.filter(event => {
      if (event.sourceType === 'smart_matching') {
        // 스마트매칭 이벤트 필터링
        if (activeFilters.includes('kpi')) {
          // KPI 체크와 관련된 카테고리
          return ['tips_program', 'accelerator', 'batch_program'].includes(event.category);
        }
        if (activeFilters.includes('funding')) {
          // 자금 조달과 관련된 카테고리
          return ['government_support', 'vc_opportunity', 'loan_program'].includes(event.category);
        }
        if (activeFilters.includes('meeting')) {
          // 미팅과 관련된 카테고리
          return ['open_innovation', 'conference', 'seminar'].includes(event.category);
        }
      } else if (event.sourceType === 'buildup_schedule') {
        // 빌드업 일정은 meeting으로 분류
        return activeFilters.includes('meeting');
      }
      return false;
    });
  }, [unifiedEvents, activeFilters]);

  // 특정 날짜의 이벤트들 가져오기 (통합 버전)
  const getEventsForDate = (date: Date) => {
    const eventsForDate = getFilteredEvents.filter(event => isSameDayUtil(event.date, date));
    return eventsForDate;
  };


  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">성장 캘린더</h2>
              <p className="text-gray-600 text-sm">주간 일정 관리</p>
            </div>
          </div>

          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>일정 추가</span>
          </button>
        </div>
      </div>


      {/* 네비게이션 */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-lg text-gray-900">
              {format(weekStart, 'yyyy년 M월 d일', { locale: ko })} - {format(addDays(weekStart, 6), 'M월 d일', { locale: ko })}
            </h3>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigateWeek('today')}
              className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
            >
              오늘
            </button>
          </div>

          {/* 카테고리 필터 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveFilters([])}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilters.length === 0
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            {Object.entries(EVENT_CATEGORIES).map(([key, category]) => {
              const Icon = category.icon;
              const isActive = activeFilters.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (isActive) {
                      setActiveFilters(activeFilters.filter(f => f !== key));
                    } else {
                      setActiveFilters([...activeFilters, key]);
                    }
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 메인 캘린더 뷰 */}
      <div className="p-6">
        <div className="grid grid-cols-7 gap-3">
          {weekDates.map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const isCurrentDay = isToday(date);
            const dayOfWeek = format(date, 'EEE', { locale: ko });

            return (
              <motion.div
                key={index}
                className={`min-h-[140px] rounded-lg border transition-all overflow-hidden ${
                  isCurrentDay
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                whileHover={{ scale: 1.01 }}
              >
                {/* 날짜 헤더 */}
                <div className={`px-3 py-2 border-b ${isCurrentDay ? 'bg-blue-100 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-bold ${isCurrentDay ? 'text-blue-700' : 'text-gray-900'}`}>
                        {format(date, 'd')}
                      </span>
                      <span className={`text-xs ${isCurrentDay ? 'text-blue-600' : 'text-gray-500'}`}>
                        {dayOfWeek}
                      </span>
                    </div>
                    {isCurrentDay && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                        오늘
                      </span>
                    )}
                  </div>
                </div>

                {/* 이벤트 목록 - 통합 버전 */}
                <div className="p-1.5 space-y-1 overflow-hidden">
                  <AnimatePresence>
                    {dayEvents.slice(0, 2).map((event) => {
                      return (
                        <motion.div
                          key={event.id}
                          layout
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="px-1.5 py-1 text-xs rounded cursor-pointer group relative hover:shadow-sm transition-all"
                          style={{
                            backgroundColor: event.bgColor,
                            borderColor: event.borderColor,
                            color: event.sourceType === 'smart_matching'
                              ? SMART_MATCHING_CATEGORY_STYLES[event.category].textColor
                              : event.color
                          }}
                          onClick={() => setSelectedEvent(event)}
                          onMouseEnter={() => setHoveredEvent(event.id)}
                          onMouseLeave={() => setHoveredEvent(null)}
                        >
                          <div className="flex items-center justify-between gap-0.5">
                            <div className="flex items-center gap-1 flex-1 min-w-0">
                              {/* 이벤트 타입별 아이콘 */}
                              {event.sourceType === 'smart_matching' ? (
                                <span className="text-[10px] flex-shrink-0">
                                  {SMART_MATCHING_CATEGORY_STYLES[event.category].icon || '📋'}
                                </span>
                              ) : event.sourceType === 'buildup_schedule' ? (
                                <Users className="w-2.5 h-2.5 flex-shrink-0" />
                              ) : (
                                <Calendar className="w-2.5 h-2.5 flex-shrink-0" />
                              )}

                              <span className="text-[10px] font-medium truncate block">
                                {event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title}
                              </span>
                            </div>

                            {/* 상태 표시 */}
                            {event.sourceType === 'smart_matching' && event.deadline.urgencyLevel === 'high' && (
                              <AlertCircle className="w-2.5 h-2.5 text-red-500 flex-shrink-0" />
                            )}
                            {event.sourceType === 'buildup_schedule' && event.status === 'completed' && (
                              <Check className="w-2.5 h-2.5 text-green-600 flex-shrink-0" />
                            )}
                          </div>

                          {/* 간단한 추가 정보 - 제거 또는 매우 간소화 */}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {dayEvents.length > 2 && (
                    <span className="text-[10px] text-gray-500 pl-1">+{dayEvents.length - 2}</span>
                  )}

                  {dayEvents.length === 0 && (
                    <div className="text-center py-2 text-gray-400">
                      <Plus className="w-3 h-3 mx-auto" />
                      <p className="text-[10px]">일정 추가</p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>


      {/* 빠른 추가 패널 */}
      <AnimatePresence>
        {showQuickAdd && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="border-t border-gray-200 bg-gray-50 p-4"
          >
            <h3 className="font-bold text-gray-900 mb-3">빠른 일정 추가</h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {Object.entries(EVENT_CATEGORIES).map(([type, cat]) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={type}
                    className={`p-3 rounded-lg border transition-all ${
                      quickAddType === type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setQuickAddType(type)}
                  >
                    <Icon className={`w-5 h-5 mx-auto ${
                      quickAddType === type ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                    <span className="text-xs text-gray-700 block mt-1">{cat.label}</span>
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              placeholder="일정 제목 입력..."
              className="w-full p-2 border border-gray-200 rounded-lg text-sm mb-2"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowQuickAdd(false)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                취소
              </button>
              <button className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                추가하기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 하단 상태 바 - 통합 버전 */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div>
              스마트매칭 {getFilteredEvents.filter(e => e.sourceType === 'smart_matching').length}개
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <div>
              빌드업 일정 {getFilteredEvents.filter(e => e.sourceType === 'buildup_schedule').length}개
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <div>
              {activeFilters.length > 0 ? (
                <span className="text-blue-600 font-medium">필터 적용 중</span>
              ) : (
                <>전체 {unifiedEvents.length}개</>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-blue-600">
              KPI 진단 {progress.percentage}% 완료
            </div>
            <div className="w-16 bg-blue-100 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 이벤트 상세 모달 - 통합 버전 */}
      {selectedEvent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedEvent(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl p-6 max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: selectedEvent.bgColor }}
                >
                  {selectedEvent.sourceType === 'smart_matching' ? (
                    <span className="text-lg">
                      {SMART_MATCHING_CATEGORY_STYLES[selectedEvent.category].icon || '📋'}
                    </span>
                  ) : (
                    <Users className="w-5 h-5" style={{ color: selectedEvent.color }} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedEvent.title}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedEvent.sourceType === 'smart_matching'
                      ? getCategoryLabel(selectedEvent.category)
                      : selectedEvent.sourceType === 'buildup_schedule'
                        ? selectedEvent.projectTitle
                        : '사용자 일정'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                {selectedEvent.date.toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </div>

              {selectedEvent.sourceType === 'buildup_schedule' && selectedEvent.time && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  {selectedEvent.time}
                </div>
              )}

              {selectedEvent.sourceType === 'smart_matching' && (
                <>
                  <div className="pt-3 border-t">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">주관기관</p>
                        <p className="text-gray-600">{selectedEvent.hostOrganization}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">지원분야</p>
                        <p className="text-gray-600">{selectedEvent.supportField}</p>
                      </div>
                    </div>
                  </div>

                  {selectedEvent.fundingAmount && (
                    <div className="pt-3 border-t">
                      <p className="font-medium text-gray-700 mb-1">지원금</p>
                      <p className="text-gray-600">{selectedEvent.fundingAmount}</p>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-700">매칭 점수</p>
                        <p className="text-2xl font-bold text-blue-600">{selectedEvent.matchingScore}점</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-700">{getDDayText(selectedEvent.date)}</p>
                        <p className="text-sm text-gray-500">
                          {selectedEvent.deadline.daysUntilDeadline > 0 ? '신청 마감까지' : '마감됨'}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {selectedEvent.sourceType === 'buildup_schedule' && (
                <div className="pt-3 border-t">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">PM</p>
                      <p className="text-gray-600">{selectedEvent.pmName}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">우선순위</p>
                      <p className="text-gray-600">
                        {selectedEvent.priority === 'critical' ? '매우높음' :
                         selectedEvent.priority === 'high' ? '높음' :
                         selectedEvent.priority === 'medium' ? '보통' : '낮음'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t">
                <p className="text-sm text-gray-600">{selectedEvent.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6">
              {selectedEvent.sourceType === 'smart_matching' && (
                <button
                  onClick={() => {
                    if (selectedEvent.originalEvent.originalUrl) {
                      window.open(selectedEvent.originalEvent.originalUrl, '_blank');
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  지원 사이트 바로가기
                </button>
              )}
              {selectedEvent.sourceType === 'buildup_schedule' && (
                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  프로젝트 보기
                </button>
              )}
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                닫기
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default memo(GrowthCalendarPremium);