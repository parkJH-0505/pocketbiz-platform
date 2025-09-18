/**
 * Growth Calendar Component
 *
 * "매일 만나고 싶은 성장 동반자" 성장 캘린더
 * - 주간/월간 뷰 지원
 * - 다양한 성장 이벤트 표시
 * - 부드럽고 격려적인 UI/UX
 * - 7열 레이아웃 최적화
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  Plus,
  Eye,
  Star
} from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameDay,
  isToday,
  isSameWeek,
  isSameMonth,
  parseISO
} from 'date-fns';

// Context & Types
import { useDashboard } from '../../contexts/DashboardContext';
import type { CalendarEvent, CalendarEventType } from '../../types/dashboard';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface CalendarViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

interface EventIndicatorProps {
  event: CalendarEvent;
  size?: 'sm' | 'md' | 'lg';
  onClick: () => void;
}

type ViewMode = 'week' | 'month';

// ============================================================================
// Event Type Configuration
// ============================================================================

const eventTypeConfig = {
  checkup: {
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    hoverColor: 'hover:bg-blue-200',
    icon: Target,
    label: 'KPI 체크업'
  },
  opportunity: {
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    hoverColor: 'hover:bg-emerald-200',
    icon: TrendingUp,
    label: '성장 기회'
  },
  planning: {
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    hoverColor: 'hover:bg-purple-200',
    icon: Calendar,
    label: '계획/준비'
  },
  reminder: {
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    hoverColor: 'hover:bg-amber-200',
    icon: Clock,
    label: '리마인더'
  },
  celebration: {
    color: 'bg-pink-100 text-pink-700 border-pink-200',
    hoverColor: 'hover:bg-pink-200',
    icon: Star,
    label: '축하/성취'
  },
  exploration: {
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    hoverColor: 'hover:bg-indigo-200',
    icon: Eye,
    label: '탐색 활동'
  }
} as const;

// ============================================================================
// Event Indicator Component
// ============================================================================

const EventIndicator: React.FC<EventIndicatorProps> = ({
  event,
  size = 'sm',
  onClick
}) => {
  const config = eventTypeConfig[event.type];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  return (
    <motion.button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 rounded-full border
        ${config.color} ${config.hoverColor} ${sizeClasses[size]}
        transition-all duration-200 font-medium
        hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        ${event.isCompleted ? 'opacity-75 line-through' : ''}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      title={`${event.title} - ${event.estimatedTime}`}
    >
      <Icon className="w-3 h-3" />
      <span className="truncate max-w-[8rem]">{event.title}</span>
      {event.isCompleted && <CheckCircle className="w-3 h-3" />}
    </motion.button>
  );
};

// ============================================================================
// Week View Component
// ============================================================================

const WeekView: React.FC<CalendarViewProps> = ({
  currentDate,
  events,
  onDateSelect,
  onEventClick
}) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getEventsForDay = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Header - 요일 */}
      {weekDays.map((day) => (
        <div
          key={day.toISOString()}
          className="text-center py-3 text-sm font-medium text-gray-600 border-b border-gray-100"
        >
          {format(day, 'EEE')}
          <div className="text-xs text-gray-400 mt-1">
            {format(day, 'M/d')}
          </div>
        </div>
      ))}

      {/* Body - 날짜별 이벤트 */}
      {weekDays.map((day) => {
        const dayEvents = getEventsForDay(day);
        const isCurrentDay = isToday(day);

        return (
          <motion.div
            key={day.toISOString()}
            className={`
              min-h-[120px] p-2 border border-gray-100 rounded-lg
              hover:bg-gray-50 cursor-pointer transition-colors
              ${isCurrentDay ? 'bg-blue-50 border-blue-200' : 'bg-white'}
            `}
            onClick={() => onDateSelect(day)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {/* 날짜 표시 */}
            <div className={`
              text-center mb-2 text-sm font-medium
              ${isCurrentDay ? 'text-blue-600' : 'text-gray-700'}
            `}>
              {format(day, 'd')}
              {isCurrentDay && (
                <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mt-1"></div>
              )}
            </div>

            {/* 이벤트 목록 */}
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map((event) => (
                <EventIndicator
                  key={event.id}
                  event={event}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(event);
                  }}
                />
              ))}

              {dayEvents.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  +{dayEvents.length - 3}개 더
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// ============================================================================
// Month View Component
// ============================================================================

const MonthView: React.FC<CalendarViewProps> = ({
  currentDate,
  events,
  onDateSelect,
  onEventClick
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  // 주별로 날짜를 그룹화
  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  return (
    <div className="space-y-1">
      {/* Header - 요일 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
          <div
            key={day}
            className="text-center py-2 text-sm font-medium text-gray-600"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Body - 주별 날짜 */}
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="grid grid-cols-7 gap-1">
          {week.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentDay = isToday(day);
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <motion.div
                key={day.toISOString()}
                className={`
                  min-h-[80px] p-1 border border-gray-100 rounded cursor-pointer
                  transition-all duration-200
                  ${isCurrentDay ? 'bg-blue-50 border-blue-200' : 'bg-white'}
                  ${!isCurrentMonth ? 'opacity-50' : ''}
                  hover:bg-gray-50
                `}
                onClick={() => onDateSelect(day)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {/* 날짜 표시 */}
                <div className={`
                  text-center mb-1 text-xs font-medium
                  ${isCurrentDay ? 'text-blue-600' : isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}
                `}>
                  {format(day, 'd')}
                  {isCurrentDay && (
                    <div className="w-1 h-1 bg-blue-500 rounded-full mx-auto"></div>
                  )}
                </div>

                {/* 이벤트 목록 (최대 2개) */}
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 2).map((event) => {
                    const config = eventTypeConfig[event.type];
                    return (
                      <div
                        key={event.id}
                        className={`
                          text-xs px-1 py-0.5 rounded truncate cursor-pointer
                          ${config.color.replace('text-', 'text-').replace('border-', '')}
                          hover:opacity-80
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    );
                  })}

                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayEvents.length - 2}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// Main Growth Calendar Component
// ============================================================================

const GrowthCalendar: React.FC = () => {
  const { weeklySchedule, currentWeek, navigateWeek, markEventCompleted } = useDashboard();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 이벤트 통계 계산
  const weekStats = useMemo(() => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

    const thisWeekEvents = weeklySchedule.filter(event =>
      isSameWeek(event.date, currentWeek, { weekStartsOn: 1 })
    );

    const completed = thisWeekEvents.filter(e => e.isCompleted).length;
    const total = thisWeekEvents.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      completed,
      total,
      completionRate,
      upcoming: thisWeekEvents.filter(e => !e.isCompleted && e.date >= new Date()).length
    };
  }, [weeklySchedule, currentWeek]);

  const handleEventClick = async (event: CalendarEvent) => {
    // 이벤트 완료 토글
    if (!event.isCompleted) {
      await markEventCompleted(event.id);
    }

    // 액션 URL이 있으면 해당 페이지로 이동
    if (event.actionUrl) {
      navigate(event.actionUrl);
    } else {
      // 이벤트 상세 보기 (Phase 2에서 구현)
      console.log('Event clicked:', event);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // 날짜 선택 처리 (Phase 2에서 구현)
    console.log('Date selected:', date);
  };

  return (
    <motion.div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">성장 캘린더</h2>
              <p className="text-sm text-gray-600">
                {format(currentWeek, 'yyyy년 M월')}
                {isSameWeek(currentWeek, new Date(), { weekStartsOn: 1 }) && ' • 이번 주'}
              </p>
            </div>
          </div>

          {/* 뷰 모드 전환 & 네비게이션 */}
          <div className="flex items-center gap-2">
            {/* 뷰 모드 전환 */}
            <div className="flex bg-white rounded-lg p-1 shadow-sm">
              <motion.button
                onClick={() => setViewMode('week')}
                className={`
                  px-3 py-1 text-xs font-medium rounded transition-all
                  ${viewMode === 'week'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
                whileTap={{ scale: 0.95 }}
              >
                주간
              </motion.button>
              <motion.button
                onClick={() => setViewMode('month')}
                className={`
                  px-3 py-1 text-xs font-medium rounded transition-all
                  ${viewMode === 'month'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
                whileTap={{ scale: 0.95 }}
              >
                월간
              </motion.button>
            </div>

            {/* 네비게이션 */}
            <motion.button
              onClick={() => navigateWeek('prev')}
              className="p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </motion.button>

            <motion.button
              onClick={() => navigateWeek('next')}
              className="p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </motion.button>
          </div>
        </div>

        {/* 주간 통계 */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-gray-600">완료: {weekStats.completed}개</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">예정: {weekStats.upcoming}개</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span className="text-gray-600">진행률: {weekStats.completionRate}%</span>
          </div>
        </div>
      </div>

      {/* Calendar Body */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {viewMode === 'week' && (
            <motion.div
              key="week-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <WeekView
                currentDate={currentWeek}
                events={weeklySchedule}
                onDateSelect={handleDateSelect}
                onEventClick={handleEventClick}
              />
            </motion.div>
          )}

          {viewMode === 'month' && (
            <motion.div
              key="month-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MonthView
                currentDate={currentWeek}
                events={weeklySchedule}
                onDateSelect={handleDateSelect}
                onEventClick={handleEventClick}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer - 격려 메시지 */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {weekStats.total > 0 ? (
              weekStats.completed === weekStats.total ? (
                '🎉 이번 주 모든 계획을 완료했어요! 정말 대단해요.'
              ) : weekStats.completed > 0 ? (
                `✨ ${weekStats.completed}개 완료! 꾸준히 성장하고 있어요.`
              ) : (
                '💪 새로운 한 주가 시작됐어요. 함께 성장해나가요!'
              )
            ) : (
              '📅 성장을 위한 계획을 세워보세요.'
            )}
          </p>

          <motion.button
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            whileHover={{ scale: 1.05 }}
          >
            <Plus className="w-3 h-3" />
            일정 추가
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default GrowthCalendar;