/**
 * eventTypes.ts
 *
 * 시스템 전체에서 사용되는 이벤트 타입 정의
 * 타입 안전성과 IntelliSense 지원을 위한 중앙 집중식 이벤트 타입 관리
 */

import type { ProjectPhase, Project, GuideMeetingRecord } from '../../types/buildup.types';

// 기본 이벤트 인터페이스
export interface BaseEvent<T = any> {
  readonly id: string;
  readonly type: string;
  readonly payload: T;
  readonly timestamp: Date;
  readonly source: string;
  readonly version: string;
  readonly correlationId?: string;
}

// 이벤트 페이로드 타입들
export interface MeetingCompletedPayload {
  meetingId: string;
  projectId: string;
  meetingRecord: Partial<GuideMeetingRecord>;
  completedBy: string;
  completedAt: Date;
}

export interface PhaseChangeRequestPayload {
  projectId: string;
  currentPhase: ProjectPhase;
  targetPhase: ProjectPhase;
  reason: string;
  requestedBy: string;
  automatic: boolean;
}

export interface PhaseChangedPayload {
  projectId: string;
  previousPhase: ProjectPhase;
  newPhase: ProjectPhase;
  reason: string;
  changedBy: string;
  changedAt: Date;
  automatic: boolean;
}

export interface ProjectUpdatedPayload {
  projectId: string;
  project: Partial<Project>;
  updatedFields: string[];
  updatedBy: string;
  updatedAt: Date;
}

export interface SystemErrorPayload {
  error: Error;
  context: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  sessionId?: string;
}

// 구체적인 이벤트 타입들
export interface MeetingCompletedEvent extends BaseEvent<MeetingCompletedPayload> {
  type: 'MEETING_COMPLETED';
}

export interface PhaseChangeRequestEvent extends BaseEvent<PhaseChangeRequestPayload> {
  type: 'PHASE_CHANGE_REQUEST';
}

export interface PhaseChangedEvent extends BaseEvent<PhaseChangedPayload> {
  type: 'PHASE_CHANGED';
}

export interface ProjectUpdatedEvent extends BaseEvent<ProjectUpdatedPayload> {
  type: 'PROJECT_UPDATED';
}

export interface SystemErrorEvent extends BaseEvent<SystemErrorPayload> {
  type: 'SYSTEM_ERROR';
}

// 모든 이벤트 타입의 Union
export type SystemEvent =
  | MeetingCompletedEvent
  | PhaseChangeRequestEvent
  | PhaseChangedEvent
  | ProjectUpdatedEvent
  | SystemErrorEvent;

// 이벤트 타입 맵 (타입 안전성을 위한)
export interface EventTypeMap {
  'MEETING_COMPLETED': MeetingCompletedEvent;
  'PHASE_CHANGE_REQUEST': PhaseChangeRequestEvent;
  'PHASE_CHANGED': PhaseChangedEvent;
  'PROJECT_UPDATED': ProjectUpdatedEvent;
  'SYSTEM_ERROR': SystemErrorEvent;
}

// 이벤트 핸들러 타입
export type EventHandler<T extends SystemEvent = SystemEvent> = (event: T) => void | Promise<void>;

// 이벤트 리스너 관리를 위한 타입
export interface EventSubscription {
  id: string;
  eventType: keyof EventTypeMap;
  handler: EventHandler;
  once: boolean;
  priority: number;
  active: boolean;
  createdAt: Date;
}

// 이벤트 버스 설정 타입
export interface EventBusConfig {
  maxListeners: number;
  enableLogging: boolean;
  enableMetrics: boolean;
  errorHandler?: (error: Error, event: SystemEvent) => void;
  middleware?: EventMiddleware[];
}

// 미들웨어 타입
export interface EventMiddleware {
  name: string;
  before?: (event: SystemEvent) => SystemEvent | Promise<SystemEvent>;
  after?: (event: SystemEvent, result?: any) => void | Promise<void>;
  onError?: (error: Error, event: SystemEvent) => void | Promise<void>;
}

// 이벤트 메트릭스 타입
export interface EventMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  averageProcessingTime: number;
  lastEventTime: Date | null;
  errorCount: number;
  activeListeners: number;
}

// 이벤트 생성 유틸리티 타입
export type EventFactory<T extends keyof EventTypeMap> = (
  payload: EventTypeMap[T]['payload'],
  options?: {
    source?: string;
    correlationId?: string;
  }
) => EventTypeMap[T];

// 에러 타입
export class EventBusError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: any
  ) {
    super(message);
    this.name = 'EventBusError';
  }
}

// 이벤트 상태 타입
export type EventStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface EventProcessingInfo {
  event: SystemEvent;
  status: EventStatus;
  startedAt: Date;
  completedAt?: Date;
  error?: Error;
  retryCount: number;
  processingTime?: number;
}