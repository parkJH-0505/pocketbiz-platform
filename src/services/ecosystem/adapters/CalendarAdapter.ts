/**
 * Calendar Context Adapter
 * CalendarContext와 이벤트 버스 간의 어댑터
 */

import { CentralEventBus } from '../EventBus';
import {
  CalendarEvent,
  CalendarEventCreatedEvent,
  BaseEvent,
  EventHandler
} from '../types';
import type { AxisKey } from '../../../types/buildup.types';

export interface CalendarAdapterConfig {
  autoCreateFromScenarios: boolean;
  autoCreateFromRecommendations: boolean;
  syncWithBuildup: boolean;
}

export interface CalendarEventData {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: 'meeting' | 'milestone' | 'deadline' | 'review' | 'launch';
  description?: string;
  projectId?: string;
  attendees?: string[];
  priority: 'high' | 'medium' | 'low';
  estimatedDuration?: number; // minutes
}

export class CalendarContextAdapter {
  private eventBus: CentralEventBus;
  private subscriptions: string[] = [];
  private config: CalendarAdapterConfig;
  private calendarEventHandlers: Map<string, Function> = new Map();

  constructor(config: CalendarAdapterConfig = {
    autoCreateFromScenarios: true,
    autoCreateFromRecommendations: true,
    syncWithBuildup: true
  }) {
    this.eventBus = CentralEventBus.getInstance();
    this.config = config;
    this.setupSubscriptions();
  }

  private setupSubscriptions(): void {
    this.subscriptions = [
      // V2에서 오는 자동 캘린더 생성 요청들
      this.eventBus.subscribe('calendar:auto-generate:scenario', this.handleAutoGenerateFromScenario.bind(this), 1),
      this.eventBus.subscribe('calendar:auto-generate:action-item', this.handleAutoGenerateActionItem.bind(this), 1),

      // 캘린더에서 발생하는 이벤트들
      this.eventBus.subscribe('calendar:event:created', this.handleCalendarEventCreated.bind(this), 2),
      this.eventBus.subscribe('calendar:event:updated', this.handleCalendarEventUpdated.bind(this), 2),
      this.eventBus.subscribe('calendar:event:deleted', this.handleCalendarEventDeleted.bind(this), 2),

      // 마일스톤 관련
      this.eventBus.subscribe('calendar:milestone:achieved', this.handleMilestoneAchieved.bind(this), 1),
      this.eventBus.subscribe('calendar:deadline:approaching', this.handleDeadlineApproaching.bind(this), 2),
    ];
  }

  /**
   * V2 시나리오에서 캘린더 이벤트 자동 생성
   */
  private async handleAutoGenerateFromScenario(event: BaseEvent): Promise<void> {
    console.log('[CalendarAdapter] Auto-generating events from scenario:', event);

    if (!this.config.autoCreateFromScenarios) return;

    const { scenarioId, scenarioName, keyActions, timeline, priority, estimatedMilestones } = event.data;

    // 시나리오 킥오프 미팅 생성
    const kickoffEvent: CalendarEventData = {
      id: `kickoff_${scenarioId}`,
      title: `${scenarioName} 킥오프 미팅`,
      date: this.getNextBusinessDay(),
      time: '14:00',
      type: 'meeting',
      description: `${scenarioName} 실행을 위한 킥오프 미팅\n\n주요 액션:\n${keyActions.map(action => `• ${action}`).join('\n')}`,
      priority,
      estimatedDuration: 60,
      projectId: scenarioId
    };

    await this.createCalendarEvent(kickoffEvent, event.userId);

    // 마일스톤별 이벤트 생성
    if (estimatedMilestones && Array.isArray(estimatedMilestones)) {
      for (const milestone of estimatedMilestones) {
        const milestoneEvent: CalendarEventData = {
          id: `milestone_${scenarioId}_${milestone.name.replace(/\s+/g, '_')}`,
          title: `마일스톤: ${milestone.name}`,
          date: this.addDaysToDate(new Date(), milestone.estimatedDays),
          type: 'milestone',
          description: `${scenarioName} - ${milestone.name} 완료 목표일`,
          priority: priority === 'high' ? 'high' : 'medium',
          projectId: scenarioId
        };

        await this.createCalendarEvent(milestoneEvent, event.userId);
      }
    }

    // 최종 검토 미팅 생성
    const reviewDate = this.calculateReviewDate(timeline);
    const reviewEvent: CalendarEventData = {
      id: `review_${scenarioId}`,
      title: `${scenarioName} 결과 검토`,
      date: reviewDate,
      time: '15:00',
      type: 'review',
      description: `${scenarioName} 실행 결과 검토 및 평가`,
      priority: 'medium',
      estimatedDuration: 90,
      projectId: scenarioId
    };

    await this.createCalendarEvent(reviewEvent, event.userId);
  }

  /**
   * V2 추천사항에서 액션 아이템 생성
   */
  private async handleAutoGenerateActionItem(event: BaseEvent): Promise<void> {
    console.log('[CalendarAdapter] Auto-generating action item:', event);

    if (!this.config.autoCreateFromRecommendations) return;

    const { title, description, actionItems, targetAxis, expectedImpact, urgency, estimatedEffort } = event.data;

    // 즉시 실행 아이템은 오늘/내일 일정으로
    const dueDate = urgency === 'immediate' ? this.getTomorrowDate() : this.getNextWeekDate();

    const actionEvent: CalendarEventData = {
      id: `action_${event.metadata?.recommendationId || Date.now()}`,
      title: `액션: ${title}`,
      date: dueDate,
      time: urgency === 'immediate' ? '09:00' : '10:00',
      type: 'deadline',
      description: `${description}\n\n세부 액션:\n${actionItems.map((item: string) => `• ${item}`).join('\n')}\n\n예상 효과: ${this.formatExpectedImpact(expectedImpact)}`,
      priority: urgency === 'immediate' ? 'high' : 'medium',
      estimatedDuration: estimatedEffort * 30, // effort * 30분
      projectId: `recommendation_${targetAxis}`
    };

    await this.createCalendarEvent(actionEvent, event.userId);

    // 고노력 액션의 경우 진행상황 체크포인트 추가
    if (estimatedEffort >= 5) {
      const checkpointEvent: CalendarEventData = {
        id: `checkpoint_${event.metadata?.recommendationId || Date.now()}`,
        title: `${title} 진행상황 체크`,
        date: this.addDaysToDate(new Date(dueDate), Math.floor(estimatedEffort)),
        time: '16:00',
        type: 'review',
        description: `${title} 액션 아이템 진행상황 점검`,
        priority: 'medium',
        estimatedDuration: 30,
        projectId: `recommendation_${targetAxis}`
      };

      await this.createCalendarEvent(checkpointEvent, event.userId);
    }
  }

  /**
   * 캘린더 이벤트 생성 시 다른 시스템으로 전파
   */
  private async handleCalendarEventCreated(event: CalendarEventCreatedEvent): Promise<void> {
    console.log('[CalendarAdapter] Processing calendar event created:', event);

    const { eventId, title, date, type, relatedScenario, expectedImpact, priority } = event.data;

    // KPI에 영향을 미칠 수 있는 이벤트인 경우 V2에 외부 요인으로 전달
    if (expectedImpact && Object.keys(expectedImpact).length > 0) {
      await this.eventBus.emit({
        type: 'v2:external-factor:added',
        source: 'calendar-auto',
        userId: event.userId,
        data: {
          factorType: 'scheduled_event',
          eventId,
          name: title,
          scheduledDate: date,
          eventType: type,
          expectedImpact,
          confidence: this.calculateImpactConfidence(type, priority)
        },
        metadata: {
          originalEvent: event.id,
          calendarEventId: eventId
        }
      });
    }

    // Buildup과 연결된 프로젝트가 있는 경우 동기화
    if (this.config.syncWithBuildup && event.data.projectId) {
      await this.eventBus.emit({
        type: 'buildup:calendar:event-added',
        source: 'calendar-auto',
        userId: event.userId,
        data: {
          projectId: event.data.projectId,
          calendarEventId: eventId,
          eventType: type,
          scheduledDate: date,
          title
        },
        metadata: {
          originalEvent: event.id
        }
      });
    }

    // 중요한 이벤트의 경우 팀 알림
    if (priority === 'high') {
      await this.eventBus.emit({
        type: 'notification:team:important-event-scheduled',
        source: 'calendar-auto',
        userId: event.userId,
        data: {
          eventTitle: title,
          scheduledDate: date,
          eventType: type,
          priority,
          relatedProject: event.data.projectId
        }
      });
    }
  }

  /**
   * 캘린더 이벤트 업데이트 시 처리
   */
  private async handleCalendarEventUpdated(event: BaseEvent): Promise<void> {
    console.log('[CalendarAdapter] Processing calendar event updated:', event);

    const { eventId, changes, newDate, newTitle } = event.data;

    // 날짜나 중요도가 변경된 경우 관련 시스템에 알림
    if (changes.includes('date') || changes.includes('priority')) {
      await this.eventBus.emit({
        type: 'v2:external-factor:updated',
        source: 'calendar-auto',
        userId: event.userId,
        data: {
          factorId: eventId,
          changes: {
            scheduledDate: newDate,
            name: newTitle
          }
        },
        metadata: {
          originalEvent: event.id,
          calendarEventId: eventId
        }
      });
    }
  }

  /**
   * 캘린더 이벤트 삭제 시 처리
   */
  private async handleCalendarEventDeleted(event: BaseEvent): Promise<void> {
    console.log('[CalendarAdapter] Processing calendar event deleted:', event);

    const { eventId, projectId } = event.data;

    // V2 외부 요인에서 제거
    await this.eventBus.emit({
      type: 'v2:external-factor:removed',
      source: 'calendar-auto',
      userId: event.userId,
      data: {
        factorId: eventId
      }
    });

    // Buildup 프로젝트와 연결되어 있던 경우 동기화
    if (projectId) {
      await this.eventBus.emit({
        type: 'buildup:calendar:event-removed',
        source: 'calendar-auto',
        userId: event.userId,
        data: {
          projectId,
          calendarEventId: eventId
        }
      });
    }
  }

  /**
   * 마일스톤 달성 시 처리
   */
  private async handleMilestoneAchieved(event: BaseEvent): Promise<void> {
    console.log('[CalendarAdapter] Processing milestone achieved:', event);

    const { milestoneId, milestoneName, projectId, actualDate, expectedImpact } = event.data;

    // V2에 긍정적 외부 요인으로 전달
    if (expectedImpact) {
      await this.eventBus.emit({
        type: 'v2:external-factor:realized',
        source: 'calendar-auto',
        userId: event.userId,
        data: {
          factorId: milestoneId,
          factorType: 'milestone_achieved',
          name: milestoneName,
          realizedDate: actualDate,
          actualImpact: expectedImpact,
          confidence: 0.9 // 달성된 마일스톤은 높은 신뢰도
        }
      });
    }

    // 성과 알림
    await this.eventBus.emit({
      type: 'notification:achievement:milestone',
      source: 'calendar-auto',
      userId: event.userId,
      data: {
        milestoneName,
        projectId,
        achievedDate: actualDate
      }
    });
  }

  /**
   * 데드라인 접근 시 처리
   */
  private async handleDeadlineApproaching(event: BaseEvent): Promise<void> {
    console.log('[CalendarAdapter] Processing deadline approaching:', event);

    const { eventId, eventTitle, dueDate, daysRemaining, priority } = event.data;

    // 긴급 알림
    await this.eventBus.emit({
      type: 'notification:deadline:approaching',
      source: 'calendar-auto',
      userId: event.userId,
      data: {
        eventTitle,
        dueDate,
        daysRemaining,
        urgency: daysRemaining <= 1 ? 'critical' : daysRemaining <= 3 ? 'high' : 'medium'
      }
    });
  }

  /**
   * 실제 캘린더 이벤트 생성 (CalendarContext와 연동)
   */
  private async createCalendarEvent(eventData: CalendarEventData, userId?: string): Promise<void> {
    console.log('[CalendarAdapter] Creating calendar event:', eventData);

    // CalendarContext의 실제 함수를 호출하여 이벤트 생성
    // 실제 구현에서는 CalendarContext의 메서드를 호출해야 함

    // 생성 완료 이벤트 발행
    await this.eventBus.emit({
      type: 'calendar:event:created',
      source: 'calendar-auto',
      userId,
      data: {
        eventId: eventData.id,
        title: eventData.title,
        date: eventData.date,
        type: eventData.type,
        projectId: eventData.projectId,
        priority: eventData.priority,
        expectedImpact: this.inferExpectedImpact(eventData)
      }
    });
  }

  /**
   * CalendarContext에서 이벤트를 발행하는 메서드들 (CalendarContext에서 호출)
   */
  async emitEventCreated(eventData: {
    eventId: string;
    title: string;
    date: string;
    type: 'meeting' | 'milestone' | 'deadline' | 'review' | 'launch';
    projectId?: string;
    relatedScenario?: string;
    expectedImpact?: Partial<Record<AxisKey, number>>;
    attendees?: string[];
    priority: 'high' | 'medium' | 'low';
  }, userId?: string): Promise<void> {
    const event: CalendarEventCreatedEvent = {
      id: '',
      type: 'calendar:event:created',
      source: 'calendar-manual',
      timestamp: 0,
      userId,
      data: eventData
    };

    await this.eventBus.emit(event);
  }

  async emitEventUpdated(eventData: {
    eventId: string;
    changes: string[];
    newDate?: string;
    newTitle?: string;
    newPriority?: 'high' | 'medium' | 'low';
  }, userId?: string): Promise<void> {
    await this.eventBus.emit({
      type: 'calendar:event:updated',
      source: 'calendar-manual',
      userId,
      data: eventData
    });
  }

  async emitMilestoneAchieved(milestoneData: {
    milestoneId: string;
    milestoneName: string;
    projectId: string;
    actualDate: string;
    expectedImpact?: Partial<Record<AxisKey, number>>;
  }, userId?: string): Promise<void> {
    await this.eventBus.emit({
      type: 'calendar:milestone:achieved',
      source: 'calendar-manual',
      userId,
      data: milestoneData
    });
  }

  /**
   * 유틸리티 메서드들
   */
  private getNextBusinessDay(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 주말이면 월요일로
    if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1); // 일요일 -> 월요일
    if (tomorrow.getDay() === 6) tomorrow.setDate(tomorrow.getDate() + 2); // 토요일 -> 월요일

    return tomorrow.toISOString().split('T')[0];
  }

  private getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  private getNextWeekDate(): string {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  }

  private addDaysToDate(date: Date, days: number): string {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate.toISOString().split('T')[0];
  }

  private calculateReviewDate(timeline: string): string {
    const timelineMap: { [key: string]: number } = {
      '1주': 7,
      '2주': 14,
      '1개월': 30,
      '2개월': 60,
      '3개월': 90,
      '6개월': 180
    };

    const days = timelineMap[timeline] || 30;
    return this.addDaysToDate(new Date(), days + 3); // 타임라인 종료 3일 후
  }

  private formatExpectedImpact(expectedImpact: Partial<Record<AxisKey, number>>): string {
    return Object.entries(expectedImpact)
      .map(([axis, impact]) => `${axis}: ${impact > 0 ? '+' : ''}${impact}점`)
      .join(', ');
  }

  private calculateImpactConfidence(eventType: string, priority: string): number {
    const baseConfidence = {
      'meeting': 0.3,
      'milestone': 0.8,
      'deadline': 0.7,
      'review': 0.5,
      'launch': 0.9
    };

    const priorityMultiplier = {
      'high': 1.2,
      'medium': 1.0,
      'low': 0.8
    };

    const base = baseConfidence[eventType as keyof typeof baseConfidence] || 0.5;
    const multiplier = priorityMultiplier[priority as keyof typeof priorityMultiplier] || 1.0;

    return Math.min(base * multiplier, 1.0);
  }

  private inferExpectedImpact(eventData: CalendarEventData): Partial<Record<AxisKey, number>> {
    // 이벤트 타입과 제목을 기반으로 예상 영향도 추론
    const impact: Partial<Record<AxisKey, number>> = {};

    if (eventData.type === 'launch') {
      impact.GO = 5; // 런칭은 Go-to-Market에 긍정적 영향
      impact.PT = 3; // Product & Technology에도 영향
    } else if (eventData.title.includes('마케팅')) {
      impact.GO = 3;
    } else if (eventData.title.includes('개발') || eventData.title.includes('기술')) {
      impact.PT = 4;
    } else if (eventData.title.includes('팀') || eventData.title.includes('채용')) {
      impact.PF = 3;
      impact.TO = 2;
    }

    return impact;
  }

  /**
   * 정리
   */
  dispose(): void {
    this.subscriptions.forEach(subId => {
      this.eventBus.unsubscribe(subId);
    });
    this.subscriptions = [];
    this.calendarEventHandlers.clear();
  }
}