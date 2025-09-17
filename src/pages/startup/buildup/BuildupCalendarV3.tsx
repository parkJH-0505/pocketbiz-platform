/**
 * BuildupCalendarV3 - 향상된 빌드업 캘린더
 * CalendarContext와 통합되고 구글 캘린더 연동이 가능한 버전
 */

import React, { useState, useMemo } from 'react';
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
import AddEventModal from '../../../components/calendar/AddEventModal';
import EditEventModal from '../../../components/calendar/EditEventModal';
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
import type { EnhancedMeetingData } from '../../../types/meeting.types';

export default function BuildupCalendarV3() {
  const navigate = useNavigate();
  const {
    filteredEvents,
    filter,
    setFilter,
    todayEvents,
    thisWeekEvents,
    overdueEvents,
    stats,
    executeQuickAction,
    contactPMAboutEvent,
    syncWithProjects
  } = useCalendarContext();
  const { projects } = useBuildupContext();
  const { openChatWithPM } = useChatContext();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  // 필터 프리셋 제거 - 불필요
  const [showExportMenu, setShowExportMenu] = useState(false);

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
    return filteredEvents.filter(event => {
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
      '#DC2626': 'bg-accent-red/10 text-accent-red border-accent-red/30',
      '#F97316': 'bg-accent-orange/10 text-accent-orange border-accent-orange/30',
      '#FCD34D': 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30',
      '#3B82F6': 'bg-primary-light text-primary-main border-primary-main/30',
      '#8B5CF6': 'bg-accent-purple/10 text-accent-purple border-accent-purple/30',
      '#10B981': 'bg-secondary-light text-secondary-main border-secondary-main/30',
      '#6B7280': 'bg-neutral-lightest text-neutral-dark border-neutral-lighter'
    };
    return colorMap[color] || 'bg-primary-light text-primary-main border-primary-main/30';
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
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .forEach(event => {
        const dateKey = event.date.toISOString().split('T')[0];
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(event);
      });

    return groups;
  }, [filteredEvents]);

  // 제거된 통계 카드 - 단순화를 위해 제거

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-neutral-dark">빌드업 캘린더</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeMonth('prev')}
                className="p-1 hover:bg-neutral-lightest rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-neutral-light" />
              </button>
              <h3 className="text-lg font-medium text-neutral-dark min-w-[120px] text-center">
                {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
              </h3>
              <button
                onClick={() => changeMonth('next')}
                className="p-1 hover:bg-neutral-lightest rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-neutral-light" />
              </button>
            </div>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm text-neutral-dark hover:bg-neutral-lightest rounded-lg transition-colors"
            >
              오늘
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setView('month')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  view === 'month'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                월
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  view === 'week'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                주
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  view === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                목록
              </button>
            </div>

            {/* Actions */}
            <button
              onClick={syncWithProjects}
              className="p-2 hover:bg-neutral-lightest rounded-lg transition-colors"
              title="동기화"
            >
              <svg className="w-4 h-4 text-neutral-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-2 hover:bg-neutral-lightest rounded-lg transition-colors"
                title="내보내기"
              >
                <Download className="w-4 h-4 text-neutral-light" />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-border z-10">
                  <button
                    onClick={() => exportCalendar('google')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-lightest flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Google Calendar
                  </button>
                  <button
                    onClick={() => exportCalendar('ics')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-lightest flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    ICS 파일 다운로드
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              일정 추가
            </button>
          </div>
        </div>

        {/* 미팅 타입별 범례 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-sm text-neutral-dark">
              총 <span className="font-semibold">{filteredEvents.length}</span>개 일정
            </div>
            {overdueEvents.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-accent-red">
                <AlertCircle className="w-4 h-4" />
                <span className="font-semibold">{overdueEvents.length}</span>개 지연
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-primary-main rounded-full"></div>
              <span className="text-neutral-dark">PM 정기미팅</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-accent-purple rounded-full"></div>
              <span className="text-neutral-dark">포켓멘토 세션</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-secondary-main rounded-full"></div>
              <span className="text-neutral-dark">프로젝트 미팅</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-accent-orange rounded-full"></div>
              <span className="text-neutral-dark">포켓 웨비나</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-neutral-light rounded-full"></div>
              <span className="text-neutral-dark">외부 미팅</span>
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
              {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                <div
                  key={day}
                  className={`text-center text-sm font-medium py-2 ${
                    index === 0 ? 'text-accent-red' : index === 6 ? 'text-primary-main' : 'text-neutral-dark'
                  }`}
                >
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
                const dayEvents = sortEventsByPriority(getEventsForDate(date));
                const density = EventMetadataUtils.calculateEventDensity(dayEvents, date);

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={`
                      min-h-[100px] p-2 border rounded-lg cursor-pointer transition-all
                      ${isCurrentMonth ? 'bg-white' : 'bg-neutral-lightest'}
                      ${isToday ? 'border-primary-main border-2' : 'border-neutral-border'}
                      ${isSelected ? 'ring-2 ring-primary-main/50' : ''}
                      ${density === 'high' ? 'bg-accent-red/5' : density === 'medium' ? 'bg-accent-yellow/5' : ''}
                      hover:shadow-md
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className={`text-sm font-medium ${
                        isCurrentMonth ? 'text-neutral-dark' : 'text-neutral-lighter'
                      } ${isToday ? 'text-primary-main' : ''}`}>
                        {date.getDate()}
                      </div>
                      {dayEvents.some(e => isUrgent(e)) && (
                        <AlertCircle className="w-3 h-3 text-accent-red" />
                      )}
                    </div>

                    {/* Events */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                          }}
                          className={`
                            text-xs px-1.5 py-0.5 rounded border truncate cursor-pointer
                            ${getEventColor(event)}
                            ${event.status === 'completed' ? 'opacity-60 line-through' : ''}
                            hover:shadow-sm transition-all
                          `}
                        >
                          <div className="flex items-center gap-1">
                            {getEventIcon(event)}
                            <span className="truncate">{event.title}</span>
                          </div>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-neutral-lighter text-center">
                          +{dayEvents.length - 2}
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
            {Object.keys(groupedEvents).length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-neutral-lighter" />
                <p className="text-neutral-light">예정된 일정이 없습니다</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  첫 일정 추가하기
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedEvents).map(([dateKey, dateEvents]) => {
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
                        <span className="text-sm text-neutral-lighter">
                          {getDDayText(date)}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {dateEvents.map(event => {
                          const meetingData = event.meetingData as EnhancedMeetingData | undefined;
                          const importance = EventMetadataUtils.calculateImportanceScore(event);

                          return (
                            <div
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className="bg-white border border-neutral-border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-lg ${getEventColor(event)}`}>
                                    {getEventIcon(event)}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium text-neutral-dark">{event.title}</h4>
                                      {importance >= 70 && <Star className="w-3 h-3 text-accent-yellow" />}
                                      {event.status === 'completed' && <CheckCircle className="w-4 h-4 text-secondary-main" />}
                                      {event.status === 'cancelled' && <XCircle className="w-4 h-4 text-accent-red" />}
                                    </div>
                                    <p className="text-sm text-neutral-light mb-2">{event.projectTitle}</p>

                                    {/* 미팅 상세 정보 */}
                                    {meetingData && (
                                      <div className="text-sm text-neutral-light mb-2">
                                        {meetingData.pmMeetingData && (
                                          <p>PM: {meetingData.pmMeetingData.담당PM} | 회차: {meetingData.pmMeetingData.세션회차}</p>
                                        )}
                                        {meetingData.buildupProjectData && (
                                          <p>목적: {meetingData.buildupProjectData.미팅목적}</p>
                                        )}
                                      </div>
                                    )}

                                    <div className="flex items-center gap-4 text-xs text-neutral-lighter">
                                      {event.time && (
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {event.time}
                                        </div>
                                      )}
                                      {meetingData?.offlineLocation && (
                                        <div className="flex items-center gap-1">
                                          <MapPin className="w-3 h-3" />
                                          {meetingData.offlineLocation}
                                        </div>
                                      )}
                                      {meetingData?.meetingLink && (
                                        <div className="flex items-center gap-1">
                                          <Video className="w-3 h-3" />
                                          온라인
                                        </div>
                                      )}
                                      {event.participants && event.participants.length > 0 && (
                                        <div className="flex items-center gap-1">
                                          <Users className="w-3 h-3" />
                                          {event.participants.length}명
                                        </div>
                                      )}
                                    </div>

                                    {/* 태그 */}
                                    {event.tags && event.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {event.tags.map((tag, idx) => (
                                          <span key={idx} className="px-2 py-0.5 bg-neutral-lightest text-xs rounded-full">
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="flex items-center gap-2">
                                  {event.type === 'meeting' && meetingData?.meetingLink && event.status === 'scheduled' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        executeQuickAction(event.id, 'join');
                                      }}
                                      className="p-2 text-primary-main hover:bg-primary-light rounded-lg transition-colors"
                                      title="미팅 참여"
                                    >
                                      <Video className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      contactPMAboutEvent(event.id);
                                    }}
                                    className="p-2 text-neutral-light hover:bg-neutral-lightest rounded-lg transition-colors"
                                    title="PM 문의"
                                  >
                                    <Users className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const url = CalendarIntegration.generateGoogleCalendarURL(event);
                                      window.open(url, '_blank');
                                    }}
                                    className="p-2 text-neutral-light hover:bg-neutral-lightest rounded-lg transition-colors"
                                    title="캘린더에 추가"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-neutral-light">
            주간 뷰는 준비중입니다
          </div>
        )}
      </div>

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
                  <h3 className="text-lg font-semibold text-neutral-dark">{selectedEvent.title}</h3>
                  <p className="text-sm text-neutral-light">{selectedEvent.projectTitle}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(selectedEvent.priority)}`}>
                      {selectedEvent.priority === 'critical' ? '긴급' :
                       selectedEvent.priority === 'high' ? '높음' :
                       selectedEvent.priority === 'medium' ? '보통' : '낮음'}
                    </span>
                    <span className="text-xs text-neutral-lighter">
                      {getDDayText(selectedEvent.date)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 hover:bg-neutral-lightest rounded-lg"
              >
                <X className="w-5 h-5 text-neutral-light" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 기본 정보 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-neutral-dark">
                  <Calendar className="w-4 h-4 text-neutral-lighter" />
                  {selectedEvent.date.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </div>

                {selectedEvent.time && (
                  <div className="flex items-center gap-2 text-sm text-neutral-dark">
                    <Clock className="w-4 h-4 text-neutral-lighter" />
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
                          <div className="flex items-center gap-2 text-sm text-neutral-dark mb-2">
                            <MapPin className="w-4 h-4 text-neutral-lighter" />
                            {meetingData.location === 'online' ? '온라인 미팅' :
                             meetingData.location === 'offline' ? meetingData.offlineLocation :
                             '하이브리드'}
                          </div>
                        )}

                        {meetingData.meetingLink && (
                          <div className="flex items-center gap-2 mb-2">
                            <Video className="w-4 h-4 text-neutral-lighter" />
                            <a
                              href={meetingData.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary-main hover:underline"
                            >
                              미팅 링크
                            </a>
                          </div>
                        )}

                        {meetingData.pmMeetingData && (
                          <div className="bg-primary-light/30 rounded-lg p-3 text-sm">
                            <p className="font-medium mb-1">PM 미팅</p>
                            <p>담당: {meetingData.pmMeetingData.담당PM} {meetingData.pmMeetingData.PM직함}</p>
                            <p>회차: {meetingData.pmMeetingData.세션회차}회</p>
                            {meetingData.pmMeetingData.아젠다 && (
                              <p className="mt-1">아젠다: {meetingData.pmMeetingData.아젠다}</p>
                            )}
                          </div>
                        )}

                        {meetingData.buildupProjectData && (
                          <div className="bg-primary-light/30 rounded-lg p-3 text-sm">
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
                  <div className="bg-accent-orange/10 rounded-lg p-3 text-sm">
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
                  <p className="text-sm font-medium text-neutral-dark mb-2">참여자</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.participants.map((participant, index) => (
                      <span key={index} className="px-2 py-1 bg-neutral-lightest text-neutral-dark text-xs rounded-full flex items-center gap-1">
                        {participant.role === 'host' && <Star className="w-3 h-3 text-accent-yellow" />}
                        {participant.name}
                        {participant.confirmed && <CheckCircle className="w-3 h-3 text-secondary-main" />}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 태그 */}
              {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium text-neutral-dark mb-2">태그</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-primary-light text-primary-main text-xs rounded-full">
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
                      className="flex-1 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
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
                    className="flex-1 px-4 py-2 bg-secondary-main text-white rounded-lg hover:bg-secondary-dark transition-colors flex items-center justify-center gap-2"
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
                className="px-4 py-2 border border-neutral-border text-neutral-dark hover:bg-neutral-lightest rounded-lg transition-colors flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                캘린더 추가
              </button>

              <button
                onClick={() => {
                  navigate(`/startup/buildup/projects/${selectedEvent.projectId}`);
                  setSelectedEvent(null);
                }}
                className="px-4 py-2 text-primary-main hover:bg-primary-light rounded-lg transition-colors"
              >
                프로젝트 보기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        preselectedDate={selectedDate || undefined}
      />

      {/* Edit Event Modal */}
      {selectedEvent && (
        <EditEventModal
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}