/**
 * Growth Calendar Enhanced Component
 *
 * 확장된 성장 캘린더
 * - 더 큰 날짜 셀
 * - 호버 인터랙션
 * - 통계 대시보드
 * - 필터와 보기 모드
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  LayoutGrid,
  List,
  Plus,
  Check,
  Clock,
  TrendingUp,
  Award,
  Target,
  Sparkles,
  Activity
} from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useDashboard } from '../../contexts/DashboardContext';

type ViewMode = 'week' | 'month' | 'list';
type EventFilter = 'all' | 'checkup' | 'opportunity' | 'planning' | 'completed';

const GrowthCalendarEnhanced: React.FC = () => {
  const { weeklySchedule, currentWeek, navigateWeek, markEventCompleted } = useDashboard();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [filter, setFilter] = useState<EventFilter>('all');
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  // 주간 날짜 생성
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // 이벤트 필터링
  const filteredEvents = weeklySchedule.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'completed') return event.isCompleted;
    return event.type === filter;
  });

  // 통계 계산
  const stats = {
    total: weeklySchedule.length,
    completed: weeklySchedule.filter(e => e.isCompleted).length,
    pending: weeklySchedule.filter(e => !e.isCompleted).length,
    completionRate: Math.round((weeklySchedule.filter(e => e.isCompleted).length / weeklySchedule.length) * 100) || 0
  };

  // 이벤트 타입별 색상
  const eventColors = {
    checkup: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    opportunity: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
    planning: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
    reminder: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
    celebration: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    exploration: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* 헤더 & 컨트롤 */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">성장 캘린더</h2>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
              {stats.total}개 일정
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* 보기 모드 전환 */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('week')}
                className={`p-1.5 rounded ${viewMode === 'week' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* 빠른 추가 */}
            <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 필터 바 */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
          {(['all', 'checkup', 'opportunity', 'planning', 'completed'] as EventFilter[]).map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                filter === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type === 'all' ? '전체' :
               type === 'completed' ? '완료' :
               type === 'checkup' ? 'KPI 체크' :
               type === 'opportunity' ? '기회' : '계획'}
            </button>
          ))}
        </div>
      </div>

      {/* 주간 네비게이션 */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <h3 className="font-semibold text-gray-900">
            {format(weekStart, 'M월 d일', { locale: ko })} - {format(addDays(weekStart, 6), 'M월 d일', { locale: ko })}
          </h3>

          <button
            onClick={() => navigateWeek('next')}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* 캘린더 그리드 (확장) */}
      {viewMode === 'week' && (
        <div className="p-6">
          <div className="grid grid-cols-7 gap-3">
            {weekDates.map((date, index) => {
              const dayEvents = filteredEvents.filter(event =>
                format(new Date(event.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
              );
              const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

              return (
                <motion.div
                  key={index}
                  className={`min-h-[140px] p-3 rounded-lg border transition-all ${
                    isToday ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                  onHoverStart={() => setHoveredDate(date)}
                  onHoverEnd={() => setHoveredDate(null)}
                  whileHover={{ scale: 1.02 }}
                >
                  {/* 날짜 헤더 */}
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-1">
                      <span className={`text-sm font-bold ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                        {format(date, 'd')}
                      </span>
                      <span className={`text-xs ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                        {format(date, 'EEE', { locale: ko })}
                      </span>
                    </div>
                    {isToday && (
                      <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded">오늘</span>
                    )}
                  </div>

                  {/* 이벤트 목록 */}
                  <div className="space-y-1.5">
                    {dayEvents.slice(0, 3).map(event => {
                      const colors = eventColors[event.type as keyof typeof eventColors];
                      return (
                        <motion.div
                          key={event.id}
                          className={`p-2 rounded cursor-pointer ${colors.bg} ${colors.border} border relative group`}
                          whileHover={{ scale: 1.05 }}
                          onClick={() => setSelectedEvent(event.id)}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium ${colors.text} truncate`}>
                              {event.title}
                            </span>
                            {event.isCompleted ? (
                              <Check className={`w-3 h-3 ${colors.text}`} />
                            ) : (
                              <Clock className={`w-3 h-3 ${colors.text} opacity-50`} />
                            )}
                          </div>

                          {/* 호버 시 상세 정보 */}
                          {hoveredDate && (
                            <div className="absolute z-10 top-full left-0 mt-1 p-2 bg-white rounded-lg shadow-lg border border-gray-200 w-48 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className={`text-xs ${colors.text} font-semibold`}>{event.title}</p>
                              <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                              <p className="text-xs text-gray-500 mt-1">⏱ {event.estimatedTime}</p>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}

                    {dayEvents.length > 3 && (
                      <span className="text-xs text-gray-500 pl-2">+{dayEvents.length - 3}개 더</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* 리스트 뷰 */}
      {viewMode === 'list' && (
        <div className="p-6">
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredEvents.map(event => {
              const colors = eventColors[event.type as keyof typeof eventColors];
              return (
                <motion.div
                  key={event.id}
                  className={`p-3 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-between`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded ${colors.bg}`}>
                      {event.type === 'checkup' && <Activity className={`w-4 h-4 ${colors.text}`} />}
                      {event.type === 'opportunity' && <Sparkles className={`w-4 h-4 ${colors.text}`} />}
                      {event.type === 'planning' && <Target className={`w-4 h-4 ${colors.text}`} />}
                    </div>
                    <div>
                      <h4 className={`font-medium ${colors.text}`}>{event.title}</h4>
                      <p className="text-xs text-gray-600">{format(new Date(event.date), 'M월 d일 (EEE)', { locale: ko })} · {event.estimatedTime}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => markEventCompleted(event.id)}
                    className={`p-2 rounded-lg ${event.isCompleted ? 'bg-green-100' : 'bg-gray-100'} transition-colors`}
                  >
                    <Check className={`w-4 h-4 ${event.isCompleted ? 'text-green-600' : 'text-gray-400'}`} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* 하단 통계 대시보드 */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-100">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-2xl font-bold text-blue-700">{stats.total}</span>
            </div>
            <span className="text-xs text-blue-600">전체 일정</span>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold text-green-700">{stats.completed}</span>
            </div>
            <span className="text-xs text-green-600">완료</span>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-2xl font-bold text-orange-700">{stats.pending}</span>
            </div>
            <span className="text-xs text-orange-600">대기 중</span>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-2xl font-bold text-purple-700">{stats.completionRate}%</span>
            </div>
            <span className="text-xs text-purple-600">완료율</span>
          </div>
        </div>

        {/* 이번 주 하이라이트 */}
        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-semibold text-gray-700">이번 주 하이라이트</span>
            </div>
            <span className="text-xs text-gray-600">
              {weeklySchedule.filter(e => e.priority === 'high').length}개의 중요 일정
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrowthCalendarEnhanced;