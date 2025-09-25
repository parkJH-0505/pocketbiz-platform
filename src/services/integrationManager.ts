/**
 * Integration Manager
 *
 * 통합 시스템의 중앙 관리자
 * 캘린더, 채팅, 프로젝트, 단계 전환을 연결하고 조율
 */

import type { Project } from '../types/buildup.types';
import type { GuideMeetingRecord, PhaseTransitionEvent } from '../types/phaseTransition.types';
import type { CalendarEvent } from '../types/calendar.types';

interface IntegrationEventType {
  type: 'calendar_event_created' | 'meeting_completed' | 'phase_transition' | 'message_sent' | 'project_updated';
  payload: any;
  timestamp: Date;
  source: string;
}

type IntegrationListener = (event: IntegrationEventType) => void;

class IntegrationManager {
  private listeners: Map<string, IntegrationListener[]> = new Map();
  private eventHistory: IntegrationEventType[] = [];
  private calendarEvents: CalendarEvent[] = [];
  private meetingRecords: GuideMeetingRecord[] = [];
  private activeProjects: Map<string, Project> = new Map();

  constructor() {
    this.initialize();
  }

  /**
   * 초기화
   */
  private initialize(): void {
  }

  /**
   * 이벤트 리스너 등록
   */
  addEventListener(eventType: string, listener: IntegrationListener): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)?.push(listener);
  }

  /**
   * 이벤트 리스너 제거
   */
  removeEventListener(eventType: string, listener: IntegrationListener): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      this.listeners.set(
        eventType,
        listeners.filter(l => l !== listener)
      );
    }
  }

  /**
   * 이벤트 발생
   */
  emitEvent(event: IntegrationEventType): void {
    // 이벤트 이력 저장
    this.eventHistory.push(event);

    // 해당 타입의 리스너들에게 이벤트 전달
    const listeners = this.listeners.get(event.type) || [];
    const globalListeners = this.listeners.get('*') || [];

    [...listeners, ...globalListeners].forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in integration listener for ${event.type}:`, error);
      }
    });

    // 로그
  }

  /**
   * 캘린더 이벤트 등록
   */
  registerCalendarEvent(calendarEvent: CalendarEvent): void {
    this.calendarEvents.push(calendarEvent);
    this.emitEvent({
      type: 'calendar_event_created',
      payload: calendarEvent,
      timestamp: new Date(),
      source: 'calendar'
    });
  }

  /**
   * 미팅 기록 등록
   */
  registerMeetingRecord(meetingRecord: GuideMeetingRecord): void {
    this.meetingRecords.push(meetingRecord);

    // 관련 캘린더 이벤트 찾기
    const calendarEvent = this.findCalendarEventById(meetingRecord.calendarEventId);

    this.emitEvent({
      type: 'meeting_completed',
      payload: {
        meetingRecord,
        calendarEvent,
        projectId: calendarEvent?.projectId
      },
      timestamp: new Date(),
      source: 'calendar'
    });
  }

  /**
   * 단계 전환 이벤트 처리
   */
  handlePhaseTransition(event: PhaseTransitionEvent): void {
    this.emitEvent({
      type: 'phase_transition',
      payload: event,
      timestamp: new Date(),
      source: 'phase_engine'
    });

    // 프로젝트 상태 업데이트
    if (event.status === 'completed') {
      const project = this.activeProjects.get(event.projectId);
      if (project) {
        project.phase = event.toPhase;
        this.emitEvent({
          type: 'project_updated',
          payload: {
            projectId: event.projectId,
            updates: { phase: event.toPhase }
          },
          timestamp: new Date(),
          source: 'integration_manager'
        });
      }
    }
  }

  /**
   * 프로젝트 등록
   */
  registerProject(project: Project): void {
    this.activeProjects.set(project.id, project);
  }

  /**
   * 프로젝트 업데이트
   */
  updateProject(projectId: string, updates: Partial<Project>): void {
    const project = this.activeProjects.get(projectId);
    if (project) {
      Object.assign(project, updates);
      this.emitEvent({
        type: 'project_updated',
        payload: { projectId, updates },
        timestamp: new Date(),
        source: 'integration_manager'
      });
    }
  }

  /**
   * 캘린더 이벤트로 미팅 기록 찾기
   */
  findMeetingRecordByCalendarEvent(calendarEventId: string): GuideMeetingRecord | undefined {
    return this.meetingRecords.find(record => record.calendarEventId === calendarEventId);
  }

  /**
   * 미팅 기록으로 캘린더 이벤트 찾기
   */
  findCalendarEventByMeetingRecord(meetingRecordId: string): CalendarEvent | undefined {
    const meetingRecord = this.meetingRecords.find(r => r.id === meetingRecordId);
    if (!meetingRecord) return undefined;

    return this.findCalendarEventById(meetingRecord.calendarEventId);
  }

  /**
   * ID로 캘린더 이벤트 찾기
   */
  findCalendarEventById(eventId: string): CalendarEvent | undefined {
    return this.calendarEvents.find(event => event.id === eventId);
  }

  /**
   * 프로젝트의 모든 캘린더 이벤트 조회
   */
  getProjectCalendarEvents(projectId: string): CalendarEvent[] {
    return this.calendarEvents.filter(event => event.projectId === projectId);
  }

  /**
   * 프로젝트의 모든 미팅 기록 조회
   */
  getProjectMeetingRecords(projectId: string): GuideMeetingRecord[] {
    const projectEvents = this.getProjectCalendarEvents(projectId);
    const eventIds = projectEvents.map(e => e.id);

    return this.meetingRecords.filter(record =>
      eventIds.includes(record.calendarEventId)
    );
  }

  /**
   * 통합 통계 조회
   */
  getStatistics() {
    return {
      totalEvents: this.eventHistory.length,
      calendarEvents: this.calendarEvents.length,
      meetingRecords: this.meetingRecords.length,
      activeProjects: this.activeProjects.size,
      eventsByType: this.eventHistory.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  /**
   * 이벤트 이력 조회
   */
  getEventHistory(filter?: { type?: string; source?: string; limit?: number }): IntegrationEventType[] {
    let history = [...this.eventHistory];

    if (filter?.type) {
      history = history.filter(e => e.type === filter.type);
    }

    if (filter?.source) {
      history = history.filter(e => e.source === filter.source);
    }

    if (filter?.limit) {
      history = history.slice(-filter.limit);
    }

    return history;
  }

  /**
   * 리셋
   */
  reset(): void {
    this.calendarEvents = [];
    this.meetingRecords = [];
    this.activeProjects.clear();
    this.eventHistory = [];
  }
}

/**
 * 전역 통합 관리자 인스턴스
 */
export const globalIntegrationManager = new IntegrationManager();

/**
 * 편의 함수들
 */
export const IntegrationService = {
  /**
   * 이벤트 리스너 등록
   */
  on: (eventType: string, listener: IntegrationListener) => {
    globalIntegrationManager.addEventListener(eventType, listener);
  },

  /**
   * 이벤트 리스너 제거
   */
  off: (eventType: string, listener: IntegrationListener) => {
    globalIntegrationManager.removeEventListener(eventType, listener);
  },

  /**
   * 이벤트 발생
   */
  emit: (event: IntegrationEventType) => {
    globalIntegrationManager.emitEvent(event);
  },

  /**
   * 통계 조회
   */
  getStats: () => {
    return globalIntegrationManager.getStatistics();
  },

  /**
   * 이벤트 이력
   */
  getHistory: (filter?: { type?: string; source?: string; limit?: number }) => {
    return globalIntegrationManager.getEventHistory(filter);
  }
};