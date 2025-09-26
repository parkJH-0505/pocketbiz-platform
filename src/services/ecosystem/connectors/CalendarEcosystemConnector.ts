/**
 * Calendar Ecosystem Connector
 * CalendarContext와 이벤트 생태계 간의 커넥터
 */

import { CentralEventBus } from '../EventBus';
import { V2SystemAdapter } from '../adapters/V2Adapter';
import type { CalendarEvent, CalendarEventInput } from '../../../types/calendar.types';
import type { BaseEvent, CalendarAutoGenerateEvent } from '../types';

export interface CalendarContextBridge {
  createEvent: (input: CalendarEventInput) => Promise<CalendarEvent>;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  getEvents: () => CalendarEvent[];
  syncWithProjects: () => void;
}

/**
 * CalendarContext와 이벤트 생태계를 연결하는 커넥터
 */
export class CalendarEcosystemConnector {
  private eventBus: CentralEventBus;
  private v2Adapter: V2SystemAdapter;
  private calendarBridge: CalendarContextBridge | null = null;
  private subscriptions: string[] = [];

  constructor() {
    this.eventBus = CentralEventBus.getInstance();
    this.v2Adapter = new V2SystemAdapter();
    this.setupSubscriptions();
  }

  /**
   * CalendarContext와 연결
   */
  connectCalendarContext(bridge: CalendarContextBridge): void {
    this.calendarBridge = bridge;
    console.log('[CalendarEcosystemConnector] Connected to CalendarContext');
  }

  /**
   * 이벤트 구독 설정
   */
  private setupSubscriptions(): void {
    this.subscriptions = [
      // V2에서 생성된 자동 캘린더 이벤트 처리
      this.eventBus.subscribe(
        'calendar:auto-generate:scenario',
        this.handleAutoGenerateFromScenario.bind(this),
        1
      ),

      // V2에서 생성된 액션 아이템 처리
      this.eventBus.subscribe(
        'calendar:auto-generate:action-item',
        this.handleAutoGenerateActionItem.bind(this),
        1
      ),

      // 외부 요인 이벤트를 V2로 전달
      this.eventBus.subscribe(
        'calendar:external-factor',
        this.handleExternalFactorToV2.bind(this),
        2
      )
    ];
  }

  /**
   * V2 시나리오로부터 자동 캘린더 이벤트 생성
   */
  private async handleAutoGenerateFromScenario(event: CalendarAutoGenerateEvent): Promise<void> {
    if (!this.calendarBridge) {
      console.warn('[CalendarEcosystemConnector] CalendarContext not connected');
      return;
    }

    const { scenarioId, scenarioName, keyActions, timeline, priority, estimatedMilestones } = event.data;

    try {
      // 1. 킥오프 미팅 생성
      const kickoffDate = new Date();
      kickoffDate.setDate(kickoffDate.getDate() + 1); // 내일

      await this.calendarBridge.createEvent({
        title: `[${scenarioName}] 킥오프 미팅`,
        description: `V2 시나리오 "${scenarioName}" 실행을 위한 킥오프 미팅`,
        date: kickoffDate,
        time: '14:00',
        duration: 60,
        projectId: scenarioId,
        priority: priority === 'high' ? 'high' : 'medium',
        type: 'meeting',
        tags: ['v2-scenario', 'kickoff'],
        meetingData: {
          meetingType: 'buildup_project',
          title: '시나리오 킥오프 미팅',
          agenda: keyActions.slice(0, 3).join(', ')
        }
      });

      // 2. 마일스톤별 체크포인트 미팅 생성
      for (const milestone of estimatedMilestones || []) {
        const milestoneDate = new Date();
        milestoneDate.setDate(milestoneDate.getDate() + milestone.estimatedDays);

        await this.calendarBridge.createEvent({
          title: `[${scenarioName}] ${milestone.name} 체크포인트`,
          description: `시나리오 진행 상황 점검: ${milestone.name}`,
          date: milestoneDate,
          time: '15:00',
          duration: 45,
          projectId: scenarioId,
          priority: 'medium',
          type: 'meeting',
          tags: ['v2-scenario', 'checkpoint'],
          meetingData: {
            meetingType: 'buildup_project',
            title: '시나리오 체크포인트',
            agenda: `${milestone.name} 진행 상황 검토`
          }
        });
      }

      // 3. 최종 리뷰 미팅 생성
      const reviewDate = new Date();
      const timelineDays = this.parseTimelineToDays(timeline);
      reviewDate.setDate(reviewDate.getDate() + timelineDays);

      await this.calendarBridge.createEvent({
        title: `[${scenarioName}] 최종 리뷰`,
        description: `시나리오 실행 결과 검토 및 KPI 분석`,
        date: reviewDate,
        time: '16:00',
        duration: 90,
        projectId: scenarioId,
        priority: priority === 'high' ? 'high' : 'medium',
        type: 'meeting',
        tags: ['v2-scenario', 'review'],
        meetingData: {
          meetingType: 'buildup_project',
          title: '시나리오 최종 리뷰',
          agenda: 'KPI 결과 분석, 시나리오 효과성 평가, 향후 액션 플랜'
        }
      });

      console.log(`[CalendarEcosystemConnector] Generated calendar events for scenario: ${scenarioName}`);

      // V2에게 성공 알림
      await this.eventBus.emit({
        type: 'calendar:generation:success',
        source: 'calendar-connector',
        userId: event.userId,
        data: {
          scenarioId,
          generatedEventsCount: 3 + (estimatedMilestones?.length || 0)
        }
      });

    } catch (error) {
      console.error('[CalendarEcosystemConnector] Error generating calendar events:', error);

      // V2에게 실패 알림
      await this.eventBus.emit({
        type: 'calendar:generation:failed',
        source: 'calendar-connector',
        userId: event.userId,
        data: {
          scenarioId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  /**
   * V2 추천사항으로부터 액션 아이템 생성
   */
  private async handleAutoGenerateActionItem(event: BaseEvent): Promise<void> {
    if (!this.calendarBridge) return;

    const { title, description, actionItems, targetAxis, expectedImpact, urgency, estimatedEffort } = event.data;

    try {
      // 즉시 실행 액션 아이템을 캘린더에 추가
      const actionDate = new Date();
      if (urgency === 'immediate') {
        actionDate.setHours(actionDate.getHours() + 2); // 2시간 후
      } else {
        actionDate.setDate(actionDate.getDate() + 1); // 내일
      }

      await this.calendarBridge.createEvent({
        title: `[AI 추천] ${title}`,
        description: `${description}\n\n예상 효과: ${targetAxis} ${expectedImpact > 0 ? '+' : ''}${expectedImpact}점`,
        date: actionDate,
        time: urgency === 'immediate' ? '16:00' : '09:00',
        duration: Math.min(estimatedEffort * 30, 180), // 최대 3시간
        projectId: 'ai-recommendations',
        priority: urgency === 'immediate' ? 'high' : 'medium',
        type: 'task',
        tags: ['ai-recommendation', targetAxis],
        meetingData: {
          meetingType: 'buildup_project',
          title: 'AI 추천 액션 실행',
          agenda: actionItems?.join(', ') || ''
        }
      });

      console.log(`[CalendarEcosystemConnector] Generated action item: ${title}`);

    } catch (error) {
      console.error('[CalendarEcosystemConnector] Error generating action item:', error);
    }
  }

  /**
   * 캘린더의 외부 요인을 V2로 전달
   */
  private async handleExternalFactorToV2(event: BaseEvent): Promise<void> {
    const { factor, impact, confidence, affectedAreas } = event.data;

    // V2 KPI 업데이트 이벤트 생성
    const kpiChanges: Record<string, number> = {};

    if (affectedAreas?.includes('growth')) {
      kpiChanges['GO'] = impact * (confidence / 100);
    }
    if (affectedAreas?.includes('economy')) {
      kpiChanges['EC'] = impact * (confidence / 100);
    }
    if (affectedAreas?.includes('platform')) {
      kpiChanges['PF'] = impact * (confidence / 100);
    }
    if (affectedAreas?.includes('team')) {
      kpiChanges['TO'] = impact * (confidence / 100);
    }
    if (affectedAreas?.includes('product')) {
      kpiChanges['PT'] = impact * (confidence / 100);
    }

    // V2 어댑터를 통해 KPI 업데이트 발행
    await this.v2Adapter.emitKPIUpdated({
      previousScores: {
        GO: 65, EC: 70, PT: 75, PF: 68, TO: 72 // Mock current scores
      },
      currentScores: {
        GO: 65 + (kpiChanges['GO'] || 0),
        EC: 70 + (kpiChanges['EC'] || 0),
        PT: 75 + (kpiChanges['PT'] || 0),
        PF: 68 + (kpiChanges['PF'] || 0),
        TO: 72 + (kpiChanges['TO'] || 0)
      },
      changes: kpiChanges,
      triggers: [`외부 요인: ${factor}`],
      confidence: confidence / 100
    }, event.userId);

    console.log(`[CalendarEcosystemConnector] Forwarded external factor to V2: ${factor}`);
  }

  /**
   * 외부 요인 이벤트 생성 (CalendarContext에서 호출)
   */
  async reportExternalFactor(
    factor: string,
    impact: number,
    confidence: number,
    affectedAreas: string[],
    userId?: string
  ): Promise<void> {
    await this.eventBus.emit({
      type: 'calendar:external-factor',
      source: 'calendar-manual',
      userId,
      data: {
        factor,
        impact,
        confidence,
        affectedAreas,
        reportedAt: new Date()
      }
    });
  }

  /**
   * V2 시나리오 저장 (CalendarContext에서 호출 가능)
   */
  async triggerV2ScenarioSave(scenarioData: any, userId?: string): Promise<void> {
    await this.v2Adapter.emitScenarioSaved(scenarioData, userId);
  }

  /**
   * 유틸리티 메서드들
   */
  private parseTimelineToDays(timeline: string): number {
    const timelineMap: Record<string, number> = {
      '1주': 7,
      '2주': 14,
      '1개월': 30,
      '2개월': 60,
      '3개월': 90,
      '6개월': 180
    };

    return timelineMap[timeline] || 30;
  }

  /**
   * 연결 상태 확인
   */
  isConnected(): boolean {
    return this.calendarBridge !== null;
  }

  /**
   * 통계 정보
   */
  getConnectionStats() {
    return {
      connected: this.isConnected(),
      subscriptions: this.subscriptions.length,
      eventBusHealthy: this.eventBus.isHealthy()
    };
  }

  /**
   * 정리
   */
  dispose(): void {
    this.subscriptions.forEach(subId => {
      this.eventBus.unsubscribe(subId);
    });
    this.subscriptions = [];
    this.calendarBridge = null;
    this.v2Adapter.dispose();
  }
}

// 글로벌 인스턴스 생성
export const calendarEcosystemConnector = new CalendarEcosystemConnector();