/**
 * Data Pipeline Types
 * 데이터 파이프라인 핵심 타입 정의
 */

import type { AxisKey } from '../../../types/buildup.types';
import type { BaseEvent } from '../types';

// 데이터 소스 식별자
export type DataSourceType = 'v2' | 'calendar' | 'buildup' | 'external';

// 데이터 수집 모드
export type CollectionMode = 'batch' | 'realtime' | 'hybrid';

// 데이터 품질 등급
export type DataQuality = 'high' | 'medium' | 'low' | 'corrupted';

// 기본 데이터 소스 인터페이스
export interface DataSource {
  id: string;
  type: DataSourceType;
  name: string;
  version: string;
  lastUpdated: Date;
  isActive: boolean;
  healthStatus: 'healthy' | 'warning' | 'error';
}

// 원시 데이터 레코드
export interface RawDataRecord {
  id: string;
  sourceId: string;
  sourceType: DataSourceType;
  collectedAt: Date;
  data: Record<string, any>;
  metadata: {
    version: string;
    checksum: string;
    size: number;
    format: string;
  };
  quality: DataQuality;
}

// V2 시스템 데이터
export interface V2SystemData {
  scenarios: V2ScenarioData[];
  kpiScores: Record<AxisKey, number>;
  recommendations: V2RecommendationData[];
  simulations: V2SimulationData[];
  lastSync: Date;
}

export interface V2ScenarioData {
  id: string;
  name: string;
  description: string;
  projectedScores: Record<AxisKey, number>;
  keyActions: string[];
  timeline: string;
  priority: 'high' | 'medium' | 'low';
  status: 'draft' | 'active' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  estimatedEffort: number;
  expectedROI: number;
}

export interface V2RecommendationData {
  id: string;
  title: string;
  description: string;
  targetAxis: AxisKey;
  expectedImpact: number;
  priority: 'high' | 'medium' | 'low';
  timeframe: 'immediate' | 'short' | 'medium' | 'long';
  actionItems: string[];
  confidence: number;
  createdAt: Date;
}

export interface V2SimulationData {
  id: string;
  scenarioId: string;
  inputParameters: Record<string, any>;
  outputResults: Record<AxisKey, number>;
  confidence: number;
  runAt: Date;
  duration: number;
}

// 캘린더 시스템 데이터
export interface CalendarSystemData {
  events: CalendarEventData[];
  schedules: CalendarScheduleData[];
  meetings: CalendarMeetingData[];
  lastSync: Date;
}

export interface CalendarEventData {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  type: 'meeting' | 'task' | 'milestone' | 'deadline';
  status: 'scheduled' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  projectId?: string;
  participants: string[];
  tags: string[];
  metadata: Record<string, any>;
}

export interface CalendarScheduleData {
  id: string;
  eventId: string;
  recurringPattern?: string;
  exceptions: Date[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarMeetingData {
  id: string;
  eventId: string;
  meetingLink?: string;
  agenda: string;
  notes?: string;
  attendees: string[];
  outcome?: string;
  actionItems: string[];
}

// Buildup 시스템 데이터
export interface BuildupSystemData {
  projects: BuildupProjectData[];
  services: BuildupServiceData[];
  meetings: BuildupMeetingData[];
  deliverables: BuildupDeliverableData[];
  lastSync: Date;
}

export interface BuildupProjectData {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'cancelled' | 'on_hold';
  phase: string;
  priority: 'high' | 'medium' | 'low';
  startDate: Date;
  endDate?: Date;
  progress: number;
  budget?: number;
  team: {
    pmId: string;
    memberIds: string[];
  };
  tags: string[];
  kpiImpact: Partial<Record<AxisKey, number>>;
}

export interface BuildupServiceData {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  isActive: boolean;
  kpiImpact: {
    axis: AxisKey;
    expectedImprovement: number;
  }[];
}

export interface BuildupMeetingData {
  id: string;
  projectId: string;
  type: 'kickoff' | 'progress' | 'review' | 'closure';
  scheduledAt: Date;
  completedAt?: Date;
  duration: number;
  agenda: string;
  participants: string[];
  notes?: string;
  actionItems: string[];
  decisions: string[];
}

export interface BuildupDeliverableData {
  id: string;
  projectId: string;
  name: string;
  description: string;
  dueDate: Date;
  completedAt?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  assigneeId: string;
  reviewerId?: string;
  dependencies: string[];
}

// 데이터 수집 설정
export interface CollectionConfig {
  sourceId: string;
  mode: CollectionMode;
  interval?: number; // milliseconds for batch mode
  retryAttempts: number;
  timeout: number;
  batchSize?: number;
  filters?: Record<string, any>;
  transformRules?: TransformRule[];
}

export interface TransformRule {
  field: string;
  operation: 'rename' | 'convert' | 'filter' | 'aggregate';
  params: Record<string, any>;
}

// 수집 작업 결과
export interface CollectionResult {
  id: string;
  sourceId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errors: CollectionError[];
  performance: {
    duration: number;
    throughput: number; // records per second
    memoryUsed: number;
  };
}

export interface CollectionError {
  recordId?: string;
  error: string;
  timestamp: Date;
  severity: 'warning' | 'error' | 'critical';
  context?: Record<string, any>;
}

// 데이터 수집기 인터페이스
export interface DataCollector {
  sourceId: string;
  sourceType: DataSourceType;
  isActive: boolean;

  // 수집 작업
  collect(config: CollectionConfig): Promise<CollectionResult>;

  // 데이터 소스 상태 확인
  checkHealth(): Promise<{
    isHealthy: boolean;
    lastCheck: Date;
    response: number; // ms
    errors?: string[];
  }>;

  // 설정 업데이트
  updateConfig(config: Partial<CollectionConfig>): void;

  // 통계 정보
  getStatistics(): {
    totalCollections: number;
    successRate: number;
    averageResponseTime: number;
    lastCollectionAt?: Date;
  };
}

// 수집 스케줄러 인터페이스
export interface CollectionScheduler {
  // 스케줄 등록
  schedule(sourceId: string, config: CollectionConfig): string;

  // 스케줄 취소
  unschedule(scheduleId: string): void;

  // 즉시 수집 실행
  runImmediately(sourceId: string): Promise<CollectionResult>;

  // 활성 스케줄 조회
  getActiveSchedules(): Array<{
    id: string;
    sourceId: string;
    nextRun: Date;
    config: CollectionConfig;
  }>;

  // 수집 히스토리
  getHistory(sourceId?: string, limit?: number): CollectionResult[];
}

// 데이터 파이프라인 이벤트
export interface PipelineEvent extends BaseEvent {
  type:
    | 'pipeline:collection:started'
    | 'pipeline:collection:completed'
    | 'pipeline:collection:failed'
    | 'pipeline:data:received'
    | 'pipeline:data:processed'
    | 'pipeline:error:occurred'
    | 'pipeline:health:changed';
}

export interface CollectionStartedEvent extends PipelineEvent {
  type: 'pipeline:collection:started';
  data: {
    sourceId: string;
    collectionId: string;
    config: CollectionConfig;
    startedAt: Date;
  };
}

export interface CollectionCompletedEvent extends PipelineEvent {
  type: 'pipeline:collection:completed';
  data: {
    sourceId: string;
    collectionId: string;
    result: CollectionResult;
  };
}

export interface DataReceivedEvent extends PipelineEvent {
  type: 'pipeline:data:received';
  data: {
    sourceId: string;
    records: RawDataRecord[];
    receivedAt: Date;
  };
}