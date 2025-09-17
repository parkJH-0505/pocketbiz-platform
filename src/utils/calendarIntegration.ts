/**
 * 캘린더 통합 유틸리티
 * Google Calendar, Outlook, Apple Calendar 등 외부 캘린더 서비스 연동
 */

import type { CalendarEvent } from '../types/calendar.types';
import type { EnhancedMeetingData } from '../types/meeting.types';

/**
 * 캘린더 서비스 타입
 */
export type CalendarService = 'google' | 'outlook' | 'apple' | 'naver' | 'kakao';

/**
 * 캘린더 연동 설정
 */
export interface CalendarIntegrationConfig {
  service: CalendarService;
  enabled: boolean;
  syncDirection: 'import' | 'export' | 'bidirectional';
  autoSync: boolean;
  syncInterval?: number; // 분 단위
  lastSyncAt?: Date;
  accessToken?: string;
  refreshToken?: string;
  calendarId?: string;
}

/**
 * ICS 파일 생성을 위한 이벤트 데이터
 */
interface ICSEventData {
  uid: string;
  summary: string;
  description: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  organizer?: {
    name: string;
    email: string;
  };
  attendees?: Array<{
    name: string;
    email: string;
    rsvp?: boolean;
  }>;
  reminders?: Array<{
    trigger: number; // 분 단위
    method: 'DISPLAY' | 'EMAIL';
  }>;
  status?: 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED';
  transparency?: 'OPAQUE' | 'TRANSPARENT';
  categories?: string[];
  priority?: number; // 1(높음) ~ 9(낮음)
}

/**
 * Google Calendar 이벤트 포맷
 */
interface GoogleCalendarEvent {
  summary: string;
  location?: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  colorId?: string;
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey: {
        type: string;
      };
    };
  };
}

/**
 * 캘린더 통합 유틸리티 클래스
 */
export class CalendarIntegration {
  /**
   * CalendarEvent를 ICS 포맷으로 변환
   */
  static convertToICS(event: CalendarEvent): ICSEventData {
    const startDate = new Date(event.date);
    const endDate = new Date(event.date);

    // 미팅인 경우 시간 설정
    if (event.type === 'meeting' && event.time) {
      const [hours, minutes] = event.time.split(':').map(Number);
      startDate.setHours(hours, minutes, 0, 0);

      const duration = event.duration || 60;
      endDate.setTime(startDate.getTime() + duration * 60 * 1000);
    } else {
      // 종일 이벤트로 설정
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    // 미팅 데이터 파싱
    const meetingData = event.meetingData as EnhancedMeetingData | undefined;
    const location = meetingData?.offlineLocation ||
                    (meetingData?.meetingLink ? '온라인 미팅' : '미정');

    // 설명 생성
    const description = this.generateEventDescription(event);

    // 참석자 정보
    const attendees = event.participants?.map(p => ({
      name: p.name,
      email: '', // 이메일 정보가 없는 경우
      rsvp: p.role === 'required'
    })) || [];

    // 우선순위 매핑 (calendar priority는 낮은 숫자가 높은 우선순위)
    const priorityMap = {
      critical: 1,
      high: 3,
      medium: 5,
      low: 7
    };

    return {
      uid: event.id,
      summary: `[${event.projectTitle}] ${event.title}`,
      description,
      location,
      startDate,
      endDate,
      organizer: {
        name: event.pmName,
        email: event.pmEmail || ''
      },
      attendees,
      reminders: event.reminders?.map(r => ({
        trigger: r.timing,
        method: r.type === 'email' ? 'EMAIL' : 'DISPLAY'
      })) || [{ trigger: 30, method: 'DISPLAY' }],
      status: event.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED',
      transparency: 'OPAQUE',
      categories: event.tags || [],
      priority: priorityMap[event.priority]
    };
  }

  /**
   * ICS 파일 문자열 생성
   */
  static generateICSFile(events: CalendarEvent[]): string {
    const icsEvents = events.map(e => this.convertToICS(e));

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PocketBiz//BuildUp Calendar//KO',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:포켓빌드업 일정',
      'X-WR-TIMEZONE:Asia/Seoul',
      'X-WR-CALDESC:포켓빌드업 프로젝트 일정 관리'
    ];

    // 타임존 정보
    icsContent.push(
      'BEGIN:VTIMEZONE',
      'TZID:Asia/Seoul',
      'BEGIN:STANDARD',
      'DTSTART:19700101T000000',
      'TZOFFSETFROM:+0900',
      'TZOFFSETTO:+0900',
      'TZNAME:KST',
      'END:STANDARD',
      'END:VTIMEZONE'
    );

    // 각 이벤트 추가
    icsEvents.forEach(event => {
      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:${event.uid}@pocketbiz.buildup`);
      icsContent.push(`DTSTAMP:${this.formatICSDate(new Date())}`);
      icsContent.push(`DTSTART;TZID=Asia/Seoul:${this.formatICSDate(event.startDate)}`);
      icsContent.push(`DTEND;TZID=Asia/Seoul:${this.formatICSDate(event.endDate)}`);
      icsContent.push(`SUMMARY:${this.escapeICSText(event.summary)}`);

      if (event.description) {
        icsContent.push(`DESCRIPTION:${this.escapeICSText(event.description)}`);
      }

      if (event.location) {
        icsContent.push(`LOCATION:${this.escapeICSText(event.location)}`);
      }

      if (event.organizer) {
        icsContent.push(`ORGANIZER;CN=${event.organizer.name}:mailto:${event.organizer.email}`);
      }

      event.attendees?.forEach(attendee => {
        icsContent.push(`ATTENDEE;CN=${attendee.name};RSVP=${attendee.rsvp ? 'TRUE' : 'FALSE'}:mailto:${attendee.email}`);
      });

      if (event.categories && event.categories.length > 0) {
        icsContent.push(`CATEGORIES:${event.categories.join(',')}`);
      }

      if (event.priority) {
        icsContent.push(`PRIORITY:${event.priority}`);
      }

      icsContent.push(`STATUS:${event.status}`);
      icsContent.push(`TRANSP:${event.transparency}`);

      // 알림 설정
      event.reminders?.forEach(reminder => {
        icsContent.push('BEGIN:VALARM');
        icsContent.push(`TRIGGER:-PT${reminder.trigger}M`);
        icsContent.push(`ACTION:${reminder.method}`);
        icsContent.push(`DESCRIPTION:${event.summary}`);
        icsContent.push('END:VALARM');
      });

      icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');

    return icsContent.join('\r\n');
  }

  /**
   * Google Calendar 포맷으로 변환
   */
  static convertToGoogleCalendar(event: CalendarEvent): GoogleCalendarEvent {
    const icsData = this.convertToICS(event);

    // 시작/종료 시간 설정
    const start: GoogleCalendarEvent['start'] = {};
    const end: GoogleCalendarEvent['end'] = {};

    if (event.type === 'meeting' && event.time) {
      start.dateTime = icsData.startDate.toISOString();
      end.dateTime = icsData.endDate.toISOString();
      start.timeZone = 'Asia/Seoul';
      end.timeZone = 'Asia/Seoul';
    } else {
      // 종일 이벤트
      start.date = icsData.startDate.toISOString().split('T')[0];
      end.date = icsData.endDate.toISOString().split('T')[0];
    }

    // 색상 매핑 (Google Calendar colorId)
    const colorMap = {
      critical: '11', // 빨강
      high: '6',      // 오렌지
      medium: '5',    // 노랑
      low: '8'        // 회색
    };

    const googleEvent: GoogleCalendarEvent = {
      summary: icsData.summary,
      description: icsData.description,
      location: icsData.location,
      start,
      end,
      attendees: icsData.attendees?.map(a => ({
        email: a.email,
        displayName: a.name,
        responseStatus: 'needsAction'
      })),
      reminders: {
        useDefault: false,
        overrides: icsData.reminders?.map(r => ({
          method: r.method === 'EMAIL' ? 'email' : 'popup',
          minutes: r.trigger
        }))
      },
      colorId: colorMap[event.priority]
    };

    // 미팅 링크가 있는 경우 화상회의 추가
    const meetingData = event.meetingData as EnhancedMeetingData | undefined;
    if (meetingData?.meetingLink) {
      googleEvent.conferenceData = {
        createRequest: {
          requestId: event.id,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      };
    }

    return googleEvent;
  }

  /**
   * Google Calendar URL 생성
   */
  static generateGoogleCalendarURL(event: CalendarEvent): string {
    const baseUrl = 'https://calendar.google.com/calendar/render';
    const params = new URLSearchParams();

    params.append('action', 'TEMPLATE');
    params.append('text', `[${event.projectTitle}] ${event.title}`);

    // 날짜/시간 설정
    if (event.type === 'meeting' && event.time) {
      const startDate = new Date(event.date);
      const [hours, minutes] = event.time.split(':').map(Number);
      startDate.setHours(hours, minutes, 0, 0);

      const endDate = new Date(startDate);
      const duration = event.duration || 60;
      endDate.setTime(startDate.getTime() + duration * 60 * 1000);

      params.append('dates', `${this.formatGoogleDate(startDate)}/${this.formatGoogleDate(endDate)}`);
    } else {
      // 종일 이벤트
      const date = new Date(event.date);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      params.append('dates', `${this.formatGoogleDate(date, true)}/${this.formatGoogleDate(nextDay, true)}`);
    }

    // 설명
    const description = this.generateEventDescription(event);
    params.append('details', description);

    // 위치
    const meetingData = event.meetingData as EnhancedMeetingData | undefined;
    if (meetingData?.offlineLocation) {
      params.append('location', meetingData.offlineLocation);
    } else if (meetingData?.meetingLink) {
      params.append('location', meetingData.meetingLink);
    }

    // 참석자
    const emails = event.participants
      ?.filter(p => p.email)
      .map(p => p.email)
      .join(',');
    if (emails) {
      params.append('add', emails);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * 이벤트 설명 생성
   */
  private static generateEventDescription(event: CalendarEvent): string {
    const lines: string[] = [];

    lines.push(`📋 프로젝트: ${event.projectTitle}`);
    lines.push(`👤 담당 PM: ${event.pmName}`);
    lines.push(`📅 상태: ${this.getStatusLabel(event.status)}`);
    lines.push(`⭐ 우선순위: ${this.getPriorityLabel(event.priority)}`);

    if (event.type === 'meeting' && event.meetingData) {
      const meetingData = event.meetingData as EnhancedMeetingData;
      lines.push('');
      lines.push('=== 미팅 정보 ===');

      if (meetingData.pmMeetingData) {
        lines.push(`세션 회차: ${meetingData.pmMeetingData.세션회차}회`);
        lines.push(`아젠다: ${meetingData.pmMeetingData.아젠다}`);
      }

      if (meetingData.buildupProjectData) {
        lines.push(`미팅 목적: ${meetingData.buildupProjectData.미팅목적}`);
        lines.push(`아젠다: ${meetingData.buildupProjectData.아젠다}`);
      }

      if (meetingData.meetingLink) {
        lines.push('');
        lines.push(`미팅 링크: ${meetingData.meetingLink}`);
      }
    }

    // review 타입 제거 - 모든 일정은 meeting 타입으로 통합

    if (event.participants && event.participants.length > 0) {
      lines.push('');
      lines.push('=== 참여자 ===');
      event.participants.forEach(p => {
        const roleLabel = p.role === 'host' ? '주최자' :
                         p.role === 'required' ? '필수' : '선택';
        lines.push(`- ${p.name} (${roleLabel})`);
      });
    }

    if (event.tags && event.tags.length > 0) {
      lines.push('');
      lines.push(`태그: ${event.tags.join(', ')}`);
    }

    return lines.join('\\n');
  }

  /**
   * ICS 날짜 포맷
   */
  private static formatICSDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  }

  /**
   * Google Calendar 날짜 포맷
   */
  private static formatGoogleDate(date: Date, allDay = false): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    if (allDay) {
      return `${year}${month}${day}`;
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  }

  /**
   * ICS 텍스트 이스케이프
   */
  private static escapeICSText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }

  /**
   * 상태 레이블
   */
  private static getStatusLabel(status: CalendarEvent['status']): string {
    const labels = {
      scheduled: '예정됨',
      in_progress: '진행 중',
      completed: '완료',
      cancelled: '취소됨',
      rescheduled: '일정 변경됨'
    };
    return labels[status] || status;
  }

  /**
   * 우선순위 레이블
   */
  private static getPriorityLabel(priority: CalendarEvent['priority']): string {
    const labels = {
      critical: '긴급',
      high: '높음',
      medium: '보통',
      low: '낮음'
    };
    return labels[priority] || priority;
  }


  /**
   * 다운로드 ICS 파일
   */
  static downloadICSFile(events: CalendarEvent[], filename = 'pocketbuildup-calendar.ics'): void {
    const icsContent = this.generateICSFile(events);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * 다중 서비스로 내보내기
   */
  static exportToServices(event: CalendarEvent): {
    google: string;
    ics: string;
  } {
    return {
      google: this.generateGoogleCalendarURL(event),
      ics: this.generateICSFile([event])
    };
  }
}