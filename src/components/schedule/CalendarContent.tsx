/**
 * CalendarContent - 캘린더 콘텐츠 컴포넌트
 * 월간/주간/목록 뷰를 담당하는 메인 콘텐츠 영역
 */

import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Plus
} from 'lucide-react';
import type { CalendarEvent } from '../../types/calendar.types';
import type { UnifiedSchedule } from '../../types/schedule.types';
import type { EnhancedMeetingData } from '../../types/meeting.types';
import {
  getDDayText,
  isUrgent,
  getPriorityColor,
  getEventStatusStyle
} from '../../utils/calendarUtils';
import { EventMetadataUtils } from '../../utils/calendarMetadata';

export interface CalendarContentProps {
  // 뷰 설정
  view: 'month' | 'week' | 'list';
  currentDate: Date;
  selectedDate: Date | null;
  onSelectedDateChange: (date: Date | null) => void;

  // 이벤트 데이터
  filteredEvents: CalendarEvent[];
  groupedEvents: { [key: string]: CalendarEvent[] };
  schedules: UnifiedSchedule[];

  // 캘린더 설정
  calendarDays: Date[];

  // 이벤트 핸들러
  onEventClick: (event: CalendarEvent) => void;
  onDateDoubleClick: (date: Date) => void;
  onCreateSchedule: () => void;
  onQuickAction: (eventId: string, action: string) => void;
  onMeetingCompleteClick: (event: CalendarEvent) => void;

  // 유틸리티 함수들
  getEventsForDate: (date: Date) => CalendarEvent[];
  sortEventsByPriority: (events: CalendarEvent[]) => CalendarEvent[];
  getEventIcon: (event: CalendarEvent) => React.ReactNode;
  getEventColor: (event: CalendarEvent) => string;

  // 커스터마이제이션
  className?: string;
}

export default function CalendarContent({
  view,
  currentDate,
  selectedDate,
  onSelectedDateChange,
  filteredEvents,
  groupedEvents,
  schedules,
  calendarDays,
  onEventClick,
  onDateDoubleClick,
  onCreateSchedule,
  onQuickAction,
  onMeetingCompleteClick,
  getEventsForDate,
  sortEventsByPriority,
  getEventIcon,
  getEventColor,
  className = ''
}: CalendarContentProps) {
  if (view === 'month') {
    return (
      <div className={`flex-1 overflow-auto ${className}`}>
        <div className="p-6">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
              <div
                key={day}
                className={`text-center text-sm font-medium py-2 ${
                  index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-900'
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
                  onClick={() => onSelectedDateChange(date)}
                  onDoubleClick={() => onDateDoubleClick(date)}
                  className={`
                    min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors
                    ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                    ${isToday ? 'border-blue-600 border-2' : 'border-gray-200'}
                    ${isSelected ? 'ring-2 ring-primary-main/50' : ''}
                    ${density === 'high' ? 'bg-red-600/5' : density === 'medium' ? 'bg-yellow-500/5' : ''}
                    hover:shadow-md
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className={`text-sm font-medium ${
                      isCurrentMonth ? 'text-gray-900' : 'text-gray-300'
                    } ${isToday ? 'text-blue-600' : ''}`}>
                      {date.getDate()}
                    </div>
                    {dayEvents.some(e => isUrgent(e)) && (
                      <AlertCircle className="w-3 h-3 text-red-600" />
                    )}
                  </div>

                  {/* Events */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        className={`
                          text-xs px-1.5 py-0.5 rounded border truncate cursor-pointer
                          ${getEventColor(event)}
                          ${event.status === 'completed' ? 'opacity-60 line-through' : ''}
                          hover:shadow-sm transition-colors
                        `}
                      >
                        <div className="flex items-center gap-1">
                          {getEventIcon(event)}
                          <span className="truncate">{event.title}</span>
                        </div>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-300 text-center">
                        +{dayEvents.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'week') {
    // 주간 뷰 구현 (향후 확장)
    return (
      <div className={`flex-1 overflow-auto ${className}`}>
        <div className="p-6">
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-600">주간 뷰는 준비 중입니다</p>
            <button
              onClick={onCreateSchedule}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              일정 추가하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div className={`flex-1 overflow-auto ${className}`}>
        <div className="p-6">
          {Object.keys(groupedEvents).length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-600">예정된 일정이 없습니다</p>
              <button
                onClick={onCreateSchedule}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-2" />
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
                      <h3 className={`font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                        {date.toLocaleDateString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                          weekday: 'long'
                        })}
                      </h3>
                      {isToday && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                          오늘
                        </span>
                      )}
                      <span className="text-sm text-gray-300">
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
                            onClick={() => onEventClick(event)}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-colors cursor-pointer"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${getEventColor(event)}`}>
                                  {getEventIcon(event)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                                    {importance >= 70 && <Star className="w-3 h-3 text-yellow-500" />}
                                    {event.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                                    {event.status === 'cancelled' && <XCircle className="w-4 h-4 text-red-600" />}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">{event.projectTitle}</p>

                                  {/* 미팅 상세 정보 */}
                                  {meetingData && (
                                    <div className="text-sm text-gray-600 mb-2">
                                      {meetingData.pmMeetingData && (
                                        <p>PM: {meetingData.pmMeetingData.담당PM} | 회차: {meetingData.pmMeetingData.세션회차}</p>
                                      )}
                                      {meetingData.buildupProjectData && (
                                        <p>목적: {meetingData.buildupProjectData.미팅목적}</p>
                                      )}
                                    </div>
                                  )}

                                  <div className="flex items-center gap-4 text-xs text-gray-300">
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
                                        <span key={idx} className="px-2 py-0.5 bg-gray-50 text-xs rounded-full">
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
                                      onQuickAction(event.id, 'join');
                                    }}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="미팅 참여"
                                  >
                                    <Video className="w-4 h-4" />
                                  </button>
                                )}

                                {/* 미팅 완료 버튼 - 프로젝트와 연결된 미팅만 */}
                                {event.type === 'meeting' && event.projectId && event.status === 'scheduled' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onMeetingCompleteClick(event);
                                    }}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="미팅 완료"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                )}
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
      </div>
    );
  }

  return null;
}