/**
 * BuildupCalendarV2.tsx
 *
 * 새로운 캘린더 데이터 구조를 사용하는 업그레이드된 캘린더 컴포넌트
 * Phase 1 구현 완료 후 기존 BuildupCalendar.tsx를 대체할 예정
 */

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Video,
  FileText,
  Target,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  Plus,
  Filter,
  Download,
  Bell,
  CheckCircle,
  Circle,
  XCircle,
  Upload,
  MessageCircle,
  HelpCircle,
  Eye,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCalendarContext } from '../../../contexts/CalendarContext';
import {
  EVENT_TYPE_CONFIG,
  getDDayText,
  isUrgent,
  getEventStatusStyle,
  getPriorityColor,
  isSameDay
} from '../../../utils/calendarUtils';
import type { CalendarEvent, CalendarView, QuickAction } from '../../../types/calendar.types';

export default function BuildupCalendarV2() {
  const navigate = useNavigate();
  const {
    events,
    filteredEvents,
    todayEvents,
    thisWeekEvents,
    overdueEvents,
    stats,
    filter,
    setFilter,
    executeQuickAction,
    checkConflicts,
    contactPMAboutEvent,
    eventsByDate
  } = useCalendarContext();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<CalendarView>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showQuickActions, setShowQuickActions] = useState<string | null>(null);

  // 현재 월의 시작과 끝
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // 캘린더 그리드를 위한 날짜 계산
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay());

  const calendarEnd = new Date(monthEnd);
  calendarEnd.setDate(calendarEnd.getDate() + (6 - calendarEnd.getDay()));

  // 특정 날짜의 이벤트 가져오기
  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => isSameDay(event.date, date));
  };

  // 월 변경
  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  // 오늘로 이동
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // 이벤트 타입별 아이콘 컴포넌트 가져오기
  const getEventIcon = (type: CalendarEvent['type']) => {
    const iconMap = {
      meeting: Video,
      review: CheckCircle
    };
    const Icon = iconMap[type];
    return <Icon className="w-3 h-3" />;
  };

  // 빠른 액션 아이콘 가져오기
  const getActionIcon = (actionType: QuickAction['type']) => {
    const iconMap = {
      complete: Check,
      reschedule: Calendar,
      cancel: XCircle,
      submit: Upload,
      join: Video,
      contact_pm: MessageCircle,
      view_details: Eye
    };
    const Icon = iconMap[actionType];
    return Icon ? <Icon className="w-4 h-4" /> : null;
  };

  // 캘린더 날짜 생성
  const calendarDays = [];
  const day = new Date(calendarStart);

  while (day <= calendarEnd) {
    calendarDays.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }

  // 이벤트 카드 렌더링
  const renderEventCard = (event: CalendarEvent, isCompact: boolean = false) => {
    const config = EVENT_TYPE_CONFIG[event.type];
    const dDayText = getDDayText(event.date);
    const urgent = isUrgent(event);
    const conflicts = checkConflicts(event);

    return (
      <div
        key={event.id}
        onClick={(e) => {
          e.stopPropagation();
          if (!isCompact) {
            setSelectedEvent(event);
          }
        }}
        onMouseEnter={() => setShowQuickActions(event.id)}
        onMouseLeave={() => setShowQuickActions(null)}
        className={`
          relative group cursor-pointer transition-all
          ${isCompact ? 'text-xs px-1.5 py-0.5 rounded border truncate' : 'p-3 rounded-lg border-2'}
          ${config.bgColor} ${config.borderColor}
          ${getEventStatusStyle(event.status)}
          ${urgent ? 'ring-2 ring-accent-red ring-offset-1' : ''}
          hover:shadow-md
        `}
      >
        {/* 컴팩트 뷰 */}
        {isCompact ? (
          <div className="flex items-center gap-1">
            {getEventIcon(event.type)}
            <span className="truncate">{event.title}</span>
            {urgent && <span className="text-accent-red font-bold">{dDayText}</span>}
          </div>
        ) : (
          <>
            {/* 상세 뷰 */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {getEventIcon(event.type)}
                <span className="font-medium">{event.title}</span>
              </div>
              {urgent && (
                <span className="text-xs font-bold text-accent-red">
                  {dDayText}
                </span>
              )}
            </div>

            <div className="text-xs text-gray-600 mb-2">
              <div>{event.projectTitle}</div>
              {event.time && <div className="flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" />
                {event.time}
              </div>}
            </div>

            {/* 충돌 경고 */}
            {conflicts.length > 0 && (
              <div className="mt-2 p-1 bg-accent-red/10 rounded text-xs text-accent-red">
                ⚠️ 일정 충돌
              </div>
            )}

            {/* 빠른 액션 버튼 */}
            {showQuickActions === event.id && event.status === 'scheduled' && (
              <div className="absolute bottom-2 right-2 flex gap-1 bg-white rounded-lg shadow-lg p-1 z-10">
                {config.actions.filter(a => a.enabled).map(action => (
                  <button
                    key={action.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      executeQuickAction(event.id, action.type);
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    title={action.label}
                  >
                    {getActionIcon(action.type)}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">빌드업 캘린더</h2>

            {/* 월 네비게이션 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeMonth('prev')}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h3 className="text-lg font-medium text-gray-900 min-w-[120px] text-center">
                {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
              </h3>
              <button
                onClick={() => changeMonth('next')}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              오늘
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* 통계 요약 */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <span className="font-medium">{todayEvents.length}</span>
                <span>오늘</span>
              </div>
              <div className="h-4 w-px bg-gray-300" />
              <div className="flex items-center gap-1">
                <span className="font-medium">{thisWeekEvents.length}</span>
                <span>이번 주</span>
              </div>
              {overdueEvents.length > 0 && (
                <>
                  <div className="h-4 w-px bg-gray-300" />
                  <div className="flex items-center gap-1 text-accent-red">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">{overdueEvents.length}</span>
                    <span>지연</span>
                  </div>
                </>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              {(['month', 'week', 'list'] as CalendarView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    view === v
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {v === 'month' ? '월' : v === 'week' ? '주' : '목록'}
                </button>
              ))}
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filter.types?.[0] || 'all'}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilter({
                    types: value === 'all' ? undefined : [value as CalendarEvent['type']]
                  });
                }}
                className="text-sm border-gray-300 rounded-lg focus:ring-primary-main focus:border-primary-main"
              >
                <option value="all">전체 일정</option>
                <option value="meeting">미팅</option>
                <option value="review">검토</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-auto">
        {view === 'month' ? (
          <div className="p-6">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 mb-2">
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-700 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                const dayEvents = getEventsForDate(date);

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={`
                      min-h-[120px] p-2 border rounded-lg cursor-pointer transition-all
                      ${isCurrentMonth ? 'bg-white' : 'bg-neutral-light'}
                      ${isToday ? 'border-primary-main border-2' : 'border-neutral-border'}
                      ${isSelected ? 'ring-2 ring-primary-main/50' : ''}
                      hover:shadow-md
                    `}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isCurrentMonth ? 'text-neutral-dark' : 'text-neutral-lighter'
                    } ${isToday ? 'text-primary-main' : ''}`}>
                      {date.getDate()}
                    </div>

                    {/* Events */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => renderEventCard(event, true))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayEvents.length - 2} 더보기
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : view === 'list' ? (
          <div className="p-6">
            {eventsByDate.size === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">예정된 일정이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Array.from(eventsByDate.entries()).map(([dateKey, dateEvents]) => {
                  const date = new Date(dateKey);
                  const isToday = date.toDateString() === new Date().toDateString();

                  return (
                    <div key={dateKey}>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className={`font-semibold ${isToday ? 'text-primary-main' : 'text-neutral-dark'}`}>
                          {date.toLocaleDateString('ko-KR', {
                            month: 'long',
                            day: 'numeric',
                            weekday: 'long'
                          })}
                        </h3>
                        {isToday && (
                          <span className="px-2 py-0.5 bg-primary-light text-primary-main text-xs rounded-full">
                            오늘
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          {dateEvents.length}개 일정
                        </span>
                      </div>

                      <div className="grid gap-3">
                        {dateEvents.map(event => (
                          <div key={event.id} className="bg-white border border-gray-200 rounded-lg">
                            {renderEventCard(event, false)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            주간 뷰는 준비중입니다
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${EVENT_TYPE_CONFIG[selectedEvent.type].bgColor}`}>
                  {getEventIcon(selectedEvent.type)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedEvent.title}</h3>
                  <p className="text-sm text-gray-600">{selectedEvent.projectTitle}</p>
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

              {selectedEvent.time && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  {selectedEvent.time}
                </div>
              )}

              {selectedEvent.meetingData?.agenda && (
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-1">미팅 아젠다</p>
                  <p className="text-sm text-gray-600">{selectedEvent.meetingData.agenda}</p>
                </div>
              )}

              {selectedEvent.deliverableData?.requirements && (
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-1">요구사항</p>
                  <p className="text-sm text-gray-600">{selectedEvent.deliverableData.requirements}</p>
                </div>
              )}

              {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">참여자</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.participants.map((participant, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {participant.name} {participant.role === 'host' && '(호스트)'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-6">
              <button
                onClick={() => {
                  navigate(`/startup/buildup/project/${selectedEvent.projectId}`);
                  setSelectedEvent(null);
                }}
                className="flex-1 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-hover transition-colors"
              >
                프로젝트 상세보기
              </button>
              {selectedEvent.status === 'scheduled' && (
                <button
                  onClick={() => {
                    contactPMAboutEvent(selectedEvent.id);
                    setSelectedEvent(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  PM 문의
                </button>
              )}
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}