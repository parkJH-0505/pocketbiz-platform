/**
 * Ecosystem Integration Types
 * 통합 생태계 핵심 타입 정의
 */

import type { AxisKey } from '../../types/buildup.types';

// 기본 이벤트 인터페이스
export interface BaseEvent {
  id: string;
  type: string;
  source: EcosystemEventSource;
  timestamp: number;
  userId?: string;
  metadata?: Record<string, any>;
}

export type EcosystemEventSource =
  | 'v2-manual'      // V2 사용자 직접 입력
  | 'v2-auto'        // V2 자동 생성
  | 'calendar-manual' // 캘린더 사용자 입력
  | 'calendar-auto'   // 캘린더 자동 생성
  | 'buildup-manual'  // Buildup 사용자 입력
  | 'buildup-auto'    // Buildup 자동 생성
  | 'collaboration'   // 협업 시스템
  | 'system';         // 시스템 자동

// V2 관련 이벤트들
export interface V2Event extends BaseEvent {
  type:
    | 'v2:scenario:saved'
    | 'v2:scenario:deleted'
    | 'v2:scenario:shared'
    | 'v2:kpi:updated'
    | 'v2:simulation:completed'
    | 'v2:recommendation:generated'
    | 'v2:external-factor:added'
    | 'v2:collaboration:activity';
}

export interface V2ScenarioSavedEvent extends V2Event {
  type: 'v2:scenario:saved';
  data: {
    scenarioId: string;
    name: string;
    projectedScores: Record<AxisKey, number>;
    keyActions: string[];
    timeline: string;
    priority: 'high' | 'medium' | 'low';
    estimatedEffort: number; // 1-10 스케일
    expectedROI: number;
    tags: string[];
  };
}

export interface V2KPIUpdatedEvent extends V2Event {
  type: 'v2:kpi:updated';
  data: {
    previousScores: Record<AxisKey, number>;
    currentScores: Record<AxisKey, number>;
    changes: Record<AxisKey, number>;
    triggers: string[]; // 변화 원인
    confidence: number; // 0-1
  };
}

export interface V2RecommendationEvent extends V2Event {
  type: 'v2:recommendation:generated';
  data: {
    recommendations: Array<{
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      expectedImpact: Partial<Record<AxisKey, number>>;
      timeframe: 'immediate' | 'short' | 'medium' | 'long';
      actionItems: string[];
      estimatedEffort: number;
    }>;
    targetAxis: AxisKey;
    context: string;
  };
}

// Calendar 관련 이벤트들
export interface CalendarEvent extends BaseEvent {
  type:
    | 'calendar:event:created'
    | 'calendar:event:updated'
    | 'calendar:event:deleted'
    | 'calendar:milestone:achieved'
    | 'calendar:deadline:approaching';
}

export interface CalendarEventCreatedEvent extends CalendarEvent {
  type: 'calendar:event:created';
  data: {
    eventId: string;
    title: string;
    date: string;
    type: 'meeting' | 'milestone' | 'deadline' | 'review' | 'launch';
    projectId?: string;
    relatedScenario?: string;
    expectedImpact?: Partial<Record<AxisKey, number>>;
    attendees?: string[];
    priority: 'high' | 'medium' | 'low';
  };
}

// Buildup 관련 이벤트들
export interface BuildupEvent extends BaseEvent {
  type:
    | 'buildup:project:created'
    | 'buildup:project:updated'
    | 'buildup:milestone:completed'
    | 'buildup:phase:changed'
    | 'buildup:task:completed';
}

export interface BuildupMilestoneCompletedEvent extends BuildupEvent {
  type: 'buildup:milestone:completed';
  data: {
    projectId: string;
    milestoneId: string;
    milestoneName: string;
    completedAt: string;
    actualVsPlanned: {
      plannedDate: string;
      actualDate: string;
      variance: number; // days
    };
    kpiImpact: Partial<Record<AxisKey, number>>;
    nextMilestone?: {
      id: string;
      name: string;
      dueDate: string;
    };
  };
}

// 이벤트 핸들러 타입
export type EventHandler<T extends BaseEvent = BaseEvent> = (event: T) => Promise<void> | void;

// 이벤트 구독 정보
export interface EventSubscription {
  id: string;
  eventType: string;
  handler: EventHandler;
  priority: number; // 낮을수록 우선순위 높음
  active: boolean;
}

// 이벤트 로그
export interface EventLog extends BaseEvent {
  processed: boolean;
  processingTime?: number;
  errors?: string[];
  retries?: number;
  acknowledged?: boolean;
}

// 이벤트 변환 결과
export interface EventTransformResult<T = any> {
  success: boolean;
  data?: T;
  errors?: string[];
  warnings?: string[];
}

// 충돌 해결
export interface EventConflict {
  id: string;
  conflictingEvents: BaseEvent[];
  conflictType: 'data_overlap' | 'timing_conflict' | 'permission_conflict';
  severity: 'low' | 'medium' | 'high';
  suggestedResolution?: 'merge' | 'prioritize' | 'user_decision';
}

export interface ConflictResolution {
  conflictId: string;
  resolution: 'automatic' | 'manual';
  strategy: string;
  result: BaseEvent;
  confidence: number;
}