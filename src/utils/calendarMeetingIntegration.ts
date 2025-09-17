/**
 * Calendar-Meeting Integration Utilities
 * 캘린더 이벤트와 미팅 기록 간의 양방향 연동 관리
 */

import type { CalendarEvent } from '../types/calendar.types';
import type { GuideMeetingRecord, PhaseTransitionEvent } from '../types/meeting.types';
import type { ProjectPhase } from '../types/buildup.types';
import {
  linkCalendarEventToMeeting,
  triggerPhaseTransitionFromMeeting,
  createPhaseTransitionEvent
} from './projectPhaseUtils';

/**
 * 통합 연동 이벤트 타입
 */
export interface IntegrationEvent {
  type: 'calendar_created' | 'meeting_completed' | 'phase_transition_triggered' | 'phase_transition_applied';
  timestamp: Date;
  data: {
    calendarEventId?: string;
    meetingRecordId?: string;
    phaseTransitionEventId?: string;
    projectId: string;
    [key: string]: any;
  };
}

/**
 * 연동 상태 추적
 */
export interface IntegrationState {
  calendarEvents: Map<string, CalendarEvent>;
  meetingRecords: Map<string, GuideMeetingRecord>;
  phaseTransitions: Map<string, PhaseTransitionEvent>;
  linkages: Map<string, {
    calendarEventId?: string;
    meetingRecordId?: string;
    phaseTransitionEventId?: string;
  }>;
  eventHistory: IntegrationEvent[];
}

/**
 * 캘린더-미팅 연동 관리자
 */
export class CalendarMeetingIntegrationManager {
  private state: IntegrationState;
  private listeners: Array<(event: IntegrationEvent) => void> = [];

  constructor() {
    this.state = {
      calendarEvents: new Map(),
      meetingRecords: new Map(),
      phaseTransitions: new Map(),
      linkages: new Map(),
      eventHistory: []
    };
  }

  /**
   * 이벤트 리스너 등록
   */
  addEventListener(listener: (event: IntegrationEvent) => void) {
    this.listeners.push(listener);
  }

  /**
   * 이벤트 리스너 제거
   */
  removeEventListener(listener: (event: IntegrationEvent) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * 이벤트 발생 알림
   */
  private emitEvent(event: IntegrationEvent) {
    this.state.eventHistory.push(event);
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in integration event listener:', error);
      }
    });
  }

  /**
   * 캘린더 이벤트 등록
   */
  registerCalendarEvent(calendarEvent: CalendarEvent): void {
    this.state.calendarEvents.set(calendarEvent.id, calendarEvent);

    this.emitEvent({
      type: 'calendar_created',
      timestamp: new Date(),
      data: {
        calendarEventId: calendarEvent.id,
        projectId: calendarEvent.projectId
      }
    });

    // 기존 미팅 기록과 자동 연결 시도
    this.attemptAutoLinking(calendarEvent);
  }

  /**
   * 미팅 기록 등록
   */
  registerMeetingRecord(meetingRecord: GuideMeetingRecord): void {
    this.state.meetingRecords.set(meetingRecord.id, meetingRecord);

    // 미팅 완료 시 단계 전환 트리거
    if (meetingRecord.상태 === '완료') {
      this.handleMeetingCompletion(meetingRecord);
    }
  }

  /**
   * 미팅 완료 처리
   */
  private handleMeetingCompletion(meetingRecord: GuideMeetingRecord): void {
    this.emitEvent({
      type: 'meeting_completed',
      timestamp: new Date(),
      data: {
        meetingRecordId: meetingRecord.id,
        projectId: meetingRecord.프로젝트ID
      }
    });

    // 연결된 캘린더 이벤트 업데이트
    const linkage = this.findLinkageByMeetingRecord(meetingRecord.id);
    if (linkage?.calendarEventId) {
      const calendarEvent = this.state.calendarEvents.get(linkage.calendarEventId);
      if (calendarEvent) {
        const updatedEvent: CalendarEvent = {
          ...calendarEvent,
          status: 'completed',
          completedAt: new Date(),
          phaseChangeTriggered: true
        };
        this.state.calendarEvents.set(calendarEvent.id, updatedEvent);
      }
    }

    // 단계 전환 트리거
    this.triggerPhaseTransition(meetingRecord);
  }

  /**
   * 단계 전환 트리거
   */
  private triggerPhaseTransition(meetingRecord: GuideMeetingRecord): void {
    const projectPhase = this.getProjectPhase(meetingRecord.프로젝트ID);
    if (!projectPhase) return;

    const phaseTransitionEvent = triggerPhaseTransitionFromMeeting(
      meetingRecord.프로젝트ID,
      projectPhase,
      meetingRecord,
      meetingRecord.PM명 || 'system'
    );

    if (phaseTransitionEvent) {
      this.state.phaseTransitions.set(phaseTransitionEvent.id, phaseTransitionEvent);

      // 미팅 기록에 단계 전환 정보 추가
      const updatedMeetingRecord: GuideMeetingRecord = {
        ...meetingRecord,
        triggeredPhaseChange: {
          fromPhase: phaseTransitionEvent.fromPhase,
          toPhase: phaseTransitionEvent.toPhase,
          triggeredAt: phaseTransitionEvent.triggeredAt,
          triggeredBy: phaseTransitionEvent.triggeredBy
        }
      };
      this.state.meetingRecords.set(meetingRecord.id, updatedMeetingRecord);

      this.emitEvent({
        type: 'phase_transition_triggered',
        timestamp: new Date(),
        data: {
          meetingRecordId: meetingRecord.id,
          phaseTransitionEventId: phaseTransitionEvent.id,
          projectId: meetingRecord.프로젝트ID,
          fromPhase: phaseTransitionEvent.fromPhase,
          toPhase: phaseTransitionEvent.toPhase
        }
      });
    }
  }

  /**
   * 자동 연결 시도
   */
  private attemptAutoLinking(calendarEvent: CalendarEvent): void {
    // 같은 프로젝트의 미팅 기록 중 날짜가 비슷한 것 찾기
    const similarMeetings = Array.from(this.state.meetingRecords.values())
      .filter(meeting =>
        meeting.프로젝트ID === calendarEvent.projectId &&
        this.isSimilarDate(meeting.날짜, calendarEvent.date)
      );

    if (similarMeetings.length === 1) {
      const meetingRecord = similarMeetings[0];
      this.createLinkage(calendarEvent.id, meetingRecord.id);
    }
  }

  /**
   * 수동 연결 생성
   */
  createLinkage(calendarEventId: string, meetingRecordId: string): void {
    const calendarEvent = this.state.calendarEvents.get(calendarEventId);
    const meetingRecord = this.state.meetingRecords.get(meetingRecordId);

    if (!calendarEvent || !meetingRecord) {
      throw new Error('Calendar event or meeting record not found');
    }

    // 양방향 연결
    const { updatedCalendarEvent, updatedMeetingRecord } = linkCalendarEventToMeeting(
      calendarEvent,
      meetingRecord
    );

    this.state.calendarEvents.set(calendarEventId, updatedCalendarEvent);
    this.state.meetingRecords.set(meetingRecordId, updatedMeetingRecord);

    // 링크 정보 저장
    this.state.linkages.set(`${calendarEventId}-${meetingRecordId}`, {
      calendarEventId,
      meetingRecordId
    });
  }

  /**
   * 캘린더 이벤트로 미팅 기록 찾기
   */
  findMeetingRecordByCalendarEvent(calendarEventId: string): GuideMeetingRecord | null {
    const calendarEvent = this.state.calendarEvents.get(calendarEventId);
    if (!calendarEvent?.meetingRecordId) return null;

    return this.state.meetingRecords.get(calendarEvent.meetingRecordId) || null;
  }

  /**
   * 미팅 기록으로 캘린더 이벤트 찾기
   */
  findCalendarEventByMeetingRecord(meetingRecordId: string): CalendarEvent | null {
    const meetingRecord = this.state.meetingRecords.get(meetingRecordId);
    if (!meetingRecord?.calendarEventId) return null;

    return this.state.calendarEvents.get(meetingRecord.calendarEventId) || null;
  }

  /**
   * 미팅 기록으로 연결 정보 찾기
   */
  private findLinkageByMeetingRecord(meetingRecordId: string) {
    for (const [key, linkage] of this.state.linkages.entries()) {
      if (linkage.meetingRecordId === meetingRecordId) {
        return linkage;
      }
    }
    return null;
  }

  /**
   * 프로젝트의 현재 단계 조회 (외부에서 주입받아야 함)
   */
  private getProjectPhase(projectId: string): ProjectPhase | null {
    // TODO: BuildupContext에서 프로젝트 정보 조회
    // 임시로 planning 반환
    return 'planning';
  }

  /**
   * 날짜 유사성 체크 (같은 날 또는 하루 차이)
   */
  private isSimilarDate(date1: Date, date2: Date): boolean {
    const diff = Math.abs(date1.getTime() - date2.getTime());
    const oneDayMs = 24 * 60 * 60 * 1000;
    return diff <= oneDayMs;
  }

  /**
   * 프로젝트별 연동 상태 조회
   */
  getProjectIntegrationStatus(projectId: string) {
    const calendarEvents = Array.from(this.state.calendarEvents.values())
      .filter(event => event.projectId === projectId);

    const meetingRecords = Array.from(this.state.meetingRecords.values())
      .filter(meeting => meeting.프로젝트ID === projectId);

    const linkedEvents = calendarEvents.filter(event => event.meetingRecordId);
    const linkedMeetings = meetingRecords.filter(meeting => meeting.calendarEventId);

    const phaseTransitions = Array.from(this.state.phaseTransitions.values())
      .filter(transition => transition.projectId === projectId);

    return {
      totalCalendarEvents: calendarEvents.length,
      totalMeetingRecords: meetingRecords.length,
      linkedCalendarEvents: linkedEvents.length,
      linkedMeetingRecords: linkedMeetings.length,
      phaseTransitions: phaseTransitions.length,
      integrationRate: calendarEvents.length > 0
        ? (linkedEvents.length / calendarEvents.length) * 100
        : 0
    };
  }

  /**
   * 연동 이력 조회
   */
  getIntegrationHistory(projectId?: string): IntegrationEvent[] {
    if (!projectId) {
      return this.state.eventHistory;
    }

    return this.state.eventHistory.filter(event =>
      event.data.projectId === projectId
    );
  }

  /**
   * 상태 초기화
   */
  reset(): void {
    this.state = {
      calendarEvents: new Map(),
      meetingRecords: new Map(),
      phaseTransitions: new Map(),
      linkages: new Map(),
      eventHistory: []
    };
  }

  /**
   * 현재 상태 내보내기
   */
  exportState() {
    return {
      calendarEvents: Array.from(this.state.calendarEvents.entries()),
      meetingRecords: Array.from(this.state.meetingRecords.entries()),
      phaseTransitions: Array.from(this.state.phaseTransitions.entries()),
      linkages: Array.from(this.state.linkages.entries()),
      eventHistory: this.state.eventHistory
    };
  }
}

/**
 * 전역 통합 관리자 인스턴스
 */
export const globalIntegrationManager = new CalendarMeetingIntegrationManager();

/**
 * 캘린더 이벤트에서 미팅 기록으로 동기화
 */
export function syncCalendarEventToMeetingRecord(
  calendarEvent: CalendarEvent,
  meetingRecord: GuideMeetingRecord
): { updatedCalendarEvent: CalendarEvent; updatedMeetingRecord: GuideMeetingRecord } {
  return linkCalendarEventToMeeting(calendarEvent, meetingRecord);
}

/**
 * 미팅 완료 시 캘린더 이벤트 업데이트
 */
export function updateCalendarEventOnMeetingCompletion(
  calendarEventId: string,
  meetingRecord: GuideMeetingRecord
): CalendarEvent | null {
  const calendarEvent = globalIntegrationManager.findCalendarEventByMeetingRecord(meetingRecord.id);

  if (!calendarEvent) return null;

  const updatedEvent: CalendarEvent = {
    ...calendarEvent,
    status: 'completed',
    completedAt: new Date(),
    phaseChangeTriggered: !!meetingRecord.triggeredPhaseChange,
    lastAction: {
      type: 'completed',
      by: meetingRecord.PM명 || 'system',
      byName: meetingRecord.PM명 || 'System',
      at: new Date(),
      comment: '미팅 기록 완료로 인한 자동 업데이트'
    }
  };

  globalIntegrationManager.registerCalendarEvent(updatedEvent);
  return updatedEvent;
}

/**
 * 프로젝트 단계 전환 시 관련 이벤트들 업데이트
 */
export function updateEventsOnPhaseTransition(
  projectId: string,
  fromPhase: ProjectPhase,
  toPhase: ProjectPhase,
  triggeredBy: string
): void {
  const phaseTransitionEvent = createPhaseTransitionEvent(
    projectId,
    fromPhase,
    toPhase,
    'manual',
    triggeredBy
  );

  globalIntegrationManager.emitEvent({
    type: 'phase_transition_applied',
    timestamp: new Date(),
    data: {
      projectId,
      phaseTransitionEventId: phaseTransitionEvent.id,
      fromPhase,
      toPhase,
      triggeredBy
    }
  });
}

/**
 * 연동 시스템 초기화
 */
export function initializeIntegrationSystem(
  calendarEvents: CalendarEvent[],
  meetingRecords: GuideMeetingRecord[]
): void {
  globalIntegrationManager.reset();

  // 캘린더 이벤트 등록
  calendarEvents.forEach(event => {
    globalIntegrationManager.registerCalendarEvent(event);
  });

  // 미팅 기록 등록
  meetingRecords.forEach(meeting => {
    globalIntegrationManager.registerMeetingRecord(meeting);
  });
}