import React, { useState, useMemo } from 'react';
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
  XCircle
} from 'lucide-react';
import { useBuildupContext } from '../../../contexts/BuildupContext';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../../../types/buildup.types';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'meeting' | 'review';
  date: Date;
  time?: string;
  project: Project;
  description?: string;
  location?: string;
  participants?: string[];
  status: 'upcoming' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
}

export default function BuildupCalendar() {
  const navigate = useNavigate();
  const { projects, activeProjects } = useBuildupContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const [filterType, setFilterType] = useState<'all' | 'meeting' | 'milestone' | 'deliverable'>('all');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // 현재 월의 시작과 끝
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // 캘린더 그리드를 위한 날짜 계산
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay());

  const calendarEnd = new Date(monthEnd);
  calendarEnd.setDate(calendarEnd.getDate() + (6 - calendarEnd.getDay()));

  // 프로젝트에서 이벤트 추출
  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    activeProjects.forEach(project => {
      // 미팅 일정
      if (project.nextMeeting) {
        allEvents.push({
          id: `meeting-${project.id}-next`,
          title: project.nextMeeting.type.replace('_', ' '),
          type: 'meeting',
          date: new Date(project.nextMeeting.date),
          time: '14:00',
          project,
          description: project.nextMeeting.agenda || '프로젝트 진행 상황 점검',
          location: project.nextMeeting.location || '화상회의',
          participants: project.team ? [project.team.pm.name, ...project.team.members.map(m => m.name)] : [],
          status: 'upcoming',
          priority: 'high'
        });
      }

      // 완료된 미팅들
      if (project.meetings) {
        project.meetings
          .filter(meeting => meeting.completed)
          .forEach((meeting, index) => {
            allEvents.push({
              id: `meeting-${project.id}-${index}`,
              title: meeting.type.replace('_', ' '),
              type: 'meeting',
              date: new Date(meeting.date),
              time: '14:00',
              project,
              status: 'completed',
              priority: 'medium'
            });
          });
      }

    });

    return allEvents;
  }, [activeProjects]);

  // 필터링된 이벤트
  const filteredEvents = events.filter(event => {
    if (filterType === 'all') return true;
    return event.type === filterType;
  });

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
  const getEventIcon = (type: CalendarEvent['type']) => {
    switch(type) {
      case 'meeting': return <Video className="w-3 h-3" />;
      case 'review': return <CheckCircle className="w-3 h-3" />;
    }
  };

  // 이벤트 타입별 색상
  const getEventColor = (type: CalendarEvent['type']) => {
    switch(type) {
      case 'meeting': return 'bg-primary-light text-primary-main border-primary-main/30';
      case 'review': return 'bg-accent-orange/10 text-accent-orange border-accent-orange/30';
    }
  };

  // 상태별 아이콘
  const getStatusIcon = (status: CalendarEvent['status']) => {
    switch(status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-secondary-main" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-accent-red" />;
      case 'upcoming': return <Circle className="w-4 h-4 text-neutral-lighter" />;
    }
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

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">빌드업 캘린더</h2>
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

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">전체 일정</option>
                <option value="meeting">미팅</option>
              </select>
            </div>

            {/* Actions */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Download className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-4 h-4 text-gray-600" />
            </button>
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
                      min-h-[100px] p-2 border rounded-lg cursor-pointer transition-all
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
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                          }}
                          className={`
                            text-xs px-1.5 py-0.5 rounded border truncate cursor-pointer
                            ${getEventColor(event.type)}
                            ${event.status === 'completed' ? 'opacity-60' : ''}
                            hover:shadow-sm transition-all
                          `}
                        >
                          <div className="flex items-center gap-1">
                            {getEventIcon(event.type)}
                            <span className="truncate">{event.title}</span>
                          </div>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayEvents.length - 3} 더보기
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
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">예정된 일정이 없습니다</p>
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
                      </div>

                      <div className="space-y-2">
                        {dateEvents.map(event => (
                          <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${getEventColor(event.type)}`}>
                                  {getEventIcon(event.type)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                                    {getStatusIcon(event.status)}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">{event.project.title}</p>
                                  {event.description && (
                                    <p className="text-sm text-gray-500">{event.description}</p>
                                  )}
                                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    {event.time && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {event.time}
                                      </div>
                                    )}
                                    {event.location && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {event.location}
                                      </div>
                                    )}
                                    {event.participants && event.participants.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {event.participants.length}명
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/startup/buildup/projects/${event.project.id}`);
                                }}
                                className="text-sm text-primary-main hover:text-primary-hover font-medium"
                              >
                                프로젝트 보기
                              </button>
                            </div>
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
                <div className={`p-2 rounded-lg ${getEventColor(selectedEvent.type)}`}>
                  {getEventIcon(selectedEvent.type)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedEvent.title}</h3>
                  <p className="text-sm text-gray-600">{selectedEvent.project.title}</p>
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

              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {selectedEvent.location}
                </div>
              )}

              {selectedEvent.description && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-700">{selectedEvent.description}</p>
                </div>
              )}

              {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">참여자</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.participants.map((participant, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {participant}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-6">
              <button
                onClick={() => {
                  navigate(`/startup/buildup/projects/${selectedEvent.project.id}`);
                  setSelectedEvent(null);
                }}
                className="flex-1 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-hover transition-colors"
              >
                프로젝트 상세보기
              </button>
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