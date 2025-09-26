/**
 * Calendar System Data Collector
 * 캘린더 시스템의 데이터를 수집하는 전용 수집기
 */

import { BaseDataCollector } from '../DataCollector';
import type {
  CollectionConfig,
  CollectionResult,
  RawDataRecord,
  CalendarSystemData,
  CalendarEventData,
  CalendarScheduleData,
  CalendarMeetingData,
  DataQuality
} from '../types';

export class CalendarDataCollector extends BaseDataCollector {
  private mockCalendarData: CalendarSystemData;

  constructor() {
    super('calendar-system', 'calendar');
    this.initializeMockData();
  }

  /**
   * 캘린더 시스템에서 데이터 수집
   */
  async collect(config: CollectionConfig): Promise<CollectionResult> {
    this.currentConfig = config;
    return this.executeCollection(config);
  }

  /**
   * 실제 캘린더 데이터 추출
   */
  protected async extractData(config: CollectionConfig): Promise<RawDataRecord[]> {
    const records: RawDataRecord[] = [];
    const collectedAt = new Date();

    // 배치 모드 처리
    if (config.mode === 'batch' || config.mode === 'hybrid') {
      records.push(...await this.extractBatchData(collectedAt));
    }

    // 실시간 모드 처리
    if (config.mode === 'realtime' || config.mode === 'hybrid') {
      records.push(...await this.extractRealtimeData(collectedAt));
    }

    return records;
  }

  /**
   * 배치 데이터 추출
   */
  private async extractBatchData(collectedAt: Date): Promise<RawDataRecord[]> {
    const records: RawDataRecord[] = [];

    // 이벤트 데이터 수집
    for (const event of this.mockCalendarData.events) {
      records.push(this.createRecord('event', event, collectedAt));
    }

    // 스케줄 데이터 수집
    for (const schedule of this.mockCalendarData.schedules) {
      records.push(this.createRecord('schedule', schedule, collectedAt));
    }

    // 미팅 데이터 수집
    for (const meeting of this.mockCalendarData.meetings) {
      records.push(this.createRecord('meeting', meeting, collectedAt));
    }

    return records;
  }

  /**
   * 실시간 데이터 추출
   */
  private async extractRealtimeData(collectedAt: Date): Promise<RawDataRecord[]> {
    const records: RawDataRecord[] = [];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // 최근 1시간 내 생성/수정된 이벤트만 수집
    const recentEvents = this.mockCalendarData.events.filter(event =>
      new Date(event.startTime) > oneHourAgo ||
      (event.metadata.updatedAt && new Date(event.metadata.updatedAt) > oneHourAgo)
    );

    for (const event of recentEvents) {
      records.push(this.createRecord('event', event, collectedAt, 'realtime'));
    }

    return records;
  }

  /**
   * 레코드 생성 헬퍼
   */
  private createRecord(
    dataType: string,
    data: any,
    collectedAt: Date,
    mode: 'batch' | 'realtime' = 'batch'
  ): RawDataRecord {
    const recordData = {
      type: dataType,
      ...data
    };

    const serializedData = JSON.stringify(recordData);
    const checksum = this.calculateChecksum(serializedData);

    return {
      id: `calendar_${dataType}_${data.id}_${mode}`,
      sourceId: this.sourceId,
      sourceType: 'calendar',
      collectedAt,
      data: recordData,
      metadata: {
        version: '1.0.0',
        checksum,
        size: serializedData.length,
        format: 'json'
      },
      quality: this.assessDataQuality(recordData)
    };
  }

  /**
   * 데이터 품질 평가
   */
  private assessDataQuality(data: any): DataQuality {
    let score = 100;

    // 필수 필드 체크
    if (!data.id) score -= 30;
    if (!data.title) score -= 20;

    // 데이터 타입별 검증
    if (data.type === 'event') {
      if (!data.startTime || !data.endTime) score -= 25;
      if (new Date(data.endTime) <= new Date(data.startTime)) score -= 20;
      if (!data.participants || data.participants.length === 0) score -= 10;
    }

    if (data.type === 'meeting') {
      if (!data.eventId || !data.agenda) score -= 20;
      if (!data.attendees || data.attendees.length === 0) score -= 15;
    }

    // 품질 등급 결정
    if (score >= 90) return 'high';
    if (score >= 70) return 'medium';
    if (score >= 50) return 'low';
    return 'corrupted';
  }

  /**
   * 체크섬 계산
   */
  private calculateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * 캘린더 시스템 헬스 체크
   */
  protected async performHealthCheck(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 150));

    // 이벤트 데이터 일관성 체크
    const inconsistentEvents = this.mockCalendarData.events.filter(event =>
      new Date(event.endTime) <= new Date(event.startTime)
    );

    if (inconsistentEvents.length > 0) {
      throw new Error(`Found ${inconsistentEvents.length} events with invalid time ranges`);
    }

    // 미팅-이벤트 연결 무결성 체크
    const orphanedMeetings = this.mockCalendarData.meetings.filter(meeting =>
      !this.mockCalendarData.events.find(event => event.id === meeting.eventId)
    );

    if (orphanedMeetings.length > 0) {
      console.warn(`Found ${orphanedMeetings.length} meetings without corresponding events`);
    }
  }

  /**
   * Mock 데이터 초기화
   */
  private initializeMockData(): void {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    this.mockCalendarData = {
      events: [
        {
          id: 'event-001',
          title: '프로젝트 킥오프 미팅',
          description: '새로운 마케팅 프로젝트 시작을 위한 킥오프 미팅',
          startTime: tomorrow,
          endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
          type: 'meeting',
          status: 'scheduled',
          priority: 'high',
          projectId: 'project-001',
          participants: ['user1', 'user2', 'pm1'],
          tags: ['kickoff', 'project', 'marketing'],
          metadata: {
            createdAt: now,
            createdBy: 'pm1',
            location: 'Conference Room A'
          }
        },
        {
          id: 'event-002',
          title: '고객 피드백 분석 완료',
          description: '고객 피드백 데이터 분석 작업 마감',
          startTime: nextWeek,
          endTime: new Date(nextWeek.getTime() + 4 * 60 * 60 * 1000),
          type: 'task',
          status: 'scheduled',
          priority: 'medium',
          projectId: 'project-002',
          participants: ['user2'],
          tags: ['analysis', 'feedback', 'deadline'],
          metadata: {
            createdAt: now,
            createdBy: 'user2',
            estimatedHours: 4
          }
        }
      ],
      schedules: [
        {
          id: 'schedule-001',
          eventId: 'event-001',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'schedule-002',
          eventId: 'event-002',
          recurringPattern: 'weekly',
          exceptions: [],
          createdAt: now,
          updatedAt: now
        }
      ],
      meetings: [
        {
          id: 'meeting-001',
          eventId: 'event-001',
          meetingLink: 'https://meet.google.com/abc-defg-hij',
          agenda: '프로젝트 목표 설정, 역할 분담, 일정 확정',
          attendees: ['user1', 'user2', 'pm1'],
          actionItems: [
            '프로젝트 차터 작성',
            '팀 역할 매트릭스 완성',
            '마일스톤 일정 확정'
          ]
        }
      ],
      lastSync: now
    };
  }

  /**
   * 실시간 업데이트 시뮬레이션
   */
  simulateRealtimeUpdate(): void {
    const now = new Date();

    // 새 이벤트 추가
    const newEvent: CalendarEventData = {
      id: `event-${Date.now()}`,
      title: '긴급 회의',
      description: '실시간 업데이트 테스트',
      startTime: new Date(now.getTime() + 30 * 60 * 1000),
      endTime: new Date(now.getTime() + 90 * 60 * 1000),
      type: 'meeting',
      status: 'scheduled',
      priority: 'high',
      participants: ['user1'],
      tags: ['urgent', 'test'],
      metadata: {
        createdAt: now,
        createdBy: 'system',
        isAutoGenerated: true
      }
    };

    this.mockCalendarData.events.push(newEvent);

    // 기존 이벤트 상태 업데이트
    if (this.mockCalendarData.events.length > 0) {
      const event = this.mockCalendarData.events[0];
      event.metadata.updatedAt = now;
      event.metadata.lastModifiedBy = 'system';
    }

    this.mockCalendarData.lastSync = now;
  }

  /**
   * 정리
   */
  dispose(): void {
    super.dispose();
    this.mockCalendarData = null as any;
  }
}