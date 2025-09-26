/**
 * Data Transformation Types
 * 데이터 변환 및 정규화 시스템 타입 정의
 */

import type { AxisKey } from '../../../../types/buildup.types';
import type { RawDataRecord, DataQuality } from '../types';

// 통합 데이터 엔터티 타입
export type UnifiedEntityType =
  | 'project'     // 프로젝트 (V2 시나리오 + Buildup 프로젝트)
  | 'event'       // 이벤트 (Calendar 이벤트 + 미팅)
  | 'task'        // 작업 (산출물 + 액션 아이템)
  | 'kpi'         // KPI 데이터
  | 'recommendation' // 추천사항
  | 'milestone'   // 마일스톤
  | 'resource'    // 리소스 (팀원, 서비스 등)
  | 'metric';     // 메트릭 (성과 측정)

// 통합 데이터 엔터티 기본 인터페이스
export interface UnifiedEntity {
  id: string;
  type: UnifiedEntityType;
  title: string;
  description?: string;
  status: EntityStatus;
  priority: EntityPriority;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  tags: string[];
  metadata: Record<string, any>;

  // 원본 데이터 추적
  sourceId: string;
  sourceType: 'v2' | 'calendar' | 'buildup';
  originalData: Record<string, any>;
  transformedAt: Date;
  version: string;
}

export type EntityStatus =
  | 'draft' | 'active' | 'completed' | 'cancelled'
  | 'scheduled' | 'in_progress' | 'on_hold' | 'archived';

export type EntityPriority = 'low' | 'medium' | 'high' | 'critical';

// 프로젝트 통합 데이터
export interface UnifiedProject extends UnifiedEntity {
  type: 'project';

  // 기본 정보
  phase: string;
  progress: number;
  startDate: Date;
  endDate?: Date;
  budget?: number;

  // 팀 정보
  team: {
    pmId: string;
    pmName: string;
    memberIds: string[];
    stakeholderIds: string[];
  };

  // KPI 영향도
  kpiImpact: Partial<Record<AxisKey, number>>;
  expectedOutcomes: string[];

  // 연결된 엔터티들
  relatedEvents: string[];
  relatedTasks: string[];
  relatedMilestones: string[];

  // 예측 및 시뮬레이션 데이터
  projectedScores?: Record<AxisKey, number>;
  riskFactors?: string[];
  successFactors?: string[];
}

// 이벤트 통합 데이터
export interface UnifiedEvent extends UnifiedEntity {
  type: 'event';

  // 시간 정보
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  timezone: string;

  // 이벤트 타입
  eventType: 'meeting' | 'deadline' | 'milestone' | 'review' | 'planning';

  // 참여자 정보
  participants: Array<{
    id: string;
    name: string;
    role: 'host' | 'required' | 'optional';
    confirmed: boolean;
  }>;

  // 위치 및 연결 정보
  location?: string;
  meetingLink?: string;

  // 연결된 프로젝트
  projectId?: string;
  projectTitle?: string;

  // 미팅 관련 데이터
  agenda?: string;
  notes?: string;
  actionItems?: string[];
  decisions?: string[];

  // 반복 정보
  isRecurring: boolean;
  recurrencePattern?: string;
}

// 작업 통합 데이터
export interface UnifiedTask extends UnifiedEntity {
  type: 'task';

  // 작업 정보
  assigneeId: string;
  assigneeName: string;
  reviewerId?: string;
  reviewerName?: string;

  // 일정 정보
  dueDate: Date;
  estimatedHours?: number;
  actualHours?: number;
  completedAt?: Date;

  // 의존성
  dependencies: string[];
  blockedBy: string[];
  blocking: string[];

  // 연결된 프로젝트
  projectId: string;
  projectTitle: string;

  // 산출물 정보
  deliverables: Array<{
    id: string;
    name: string;
    type: string;
    url?: string;
    size?: number;
  }>;

  // 진행 상황
  subtasks: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;

  progressPercentage: number;
}

// KPI 통합 데이터
export interface UnifiedKPI extends UnifiedEntity {
  type: 'kpi';

  // KPI 값들
  scores: Record<AxisKey, number>;
  previousScores?: Record<AxisKey, number>;
  changes?: Record<AxisKey, number>;

  // 측정 정보
  measuredAt: Date;
  measurementPeriod: string; // 'daily', 'weekly', 'monthly'
  dataSource: string;
  confidence: number;

  // 트리거 정보
  triggers: string[];
  externalFactors: string[];

  // 예측 및 목표
  projectedScores?: Record<AxisKey, number>;
  targetScores?: Record<AxisKey, number>;
  variance?: Record<AxisKey, number>;

  // 관련 엔터티
  relatedProjects: string[];
  impactingEvents: string[];
}

// 추천사항 통합 데이터
export interface UnifiedRecommendation extends UnifiedEntity {
  type: 'recommendation';

  // 추천 내용
  targetAxis: AxisKey;
  expectedImpact: number;
  confidence: number;

  // 실행 정보
  timeframe: 'immediate' | 'short' | 'medium' | 'long';
  estimatedEffort: number; // 1-10 scale
  implementationCost?: number;

  // 액션 아이템
  actionItems: Array<{
    id: string;
    title: string;
    description: string;
    assignee?: string;
    dueDate?: Date;
    completed: boolean;
  }>;

  // 리스크 및 전제조건
  risks: string[];
  prerequisites: string[];
  successCriteria: string[];

  // 생성 정보
  generatedBy: 'ai' | 'manual' | 'analysis';
  basedOnData: string[]; // 기반 데이터 소스들

  // 실행 결과 추적
  implementationStatus?: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  actualImpact?: number;
  lessonsLearned?: string[];
}

// 데이터 변환 매핑 규칙
export interface TransformationMapping {
  id: string;
  sourceType: 'v2' | 'calendar' | 'buildup';
  sourceEntityType: string;
  targetEntityType: UnifiedEntityType;

  // 필드 매핑
  fieldMappings: Array<{
    sourcePath: string;    // e.g., 'data.title' or 'data.projectedScores.GO'
    targetPath: string;    // e.g., 'title' or 'kpiImpact.GO'
    transform?: TransformFunction;
    defaultValue?: any;
    required?: boolean;
  }>;

  // 조건부 변환
  conditions?: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'exists';
    value: any;
  }>;

  // 후처리 함수
  postProcessors?: PostProcessor[];

  // 검증 규칙
  validationRules?: ValidationRule[];
}

// 변환 함수 타입
export type TransformFunction =
  | 'uppercase' | 'lowercase' | 'trim' | 'parseDate' | 'parseNumber'
  | 'splitString' | 'joinArray' | 'formatCurrency' | 'generateId'
  | 'mapStatus' | 'mapPriority' | 'calculateProgress' | 'extractTags'
  | 'normalizeKPI' | 'mergeArrays' | 'flattenObject';

// 후처리 함수 타입
export interface PostProcessor {
  name: string;
  function: (entity: UnifiedEntity, context: TransformContext) => UnifiedEntity | Promise<UnifiedEntity>;
  priority: number;
}

// 검증 규칙
export interface ValidationRule {
  field: string;
  rule: 'required' | 'email' | 'url' | 'dateRange' | 'numberRange' | 'pattern' | 'custom';
  params?: any;
  errorMessage: string;
}

// 변환 컨텍스트
export interface TransformContext {
  sourceRecord: RawDataRecord;
  existingEntities: Map<string, UnifiedEntity>;
  transformationRules: Map<string, TransformationMapping>;
  referenceData: Map<string, any>;
  userId?: string;
  timestamp: Date;
}

// 변환 결과
export interface TransformationResult {
  success: boolean;
  entity?: UnifiedEntity;
  errors: TransformationError[];
  warnings: string[];

  // 변환 메타데이터
  transformationId: string;
  sourceRecordId: string;
  transformedAt: Date;
  transformationTime: number; // milliseconds
  appliedMappings: string[];

  // 품질 평가
  qualityScore: number;
  qualityIssues: string[];

  // 의존성 정보
  createdReferences: string[];
  updatedReferences: string[];
}

export interface TransformationError {
  code: string;
  field?: string;
  message: string;
  severity: 'warning' | 'error' | 'critical';
  context?: Record<string, any>;
}

// 배치 변환 결과
export interface BatchTransformationResult {
  totalRecords: number;
  successfulTransforms: number;
  failedTransforms: number;
  warnings: number;

  results: TransformationResult[];
  summary: {
    bySourceType: Record<string, number>;
    byEntityType: Record<UnifiedEntityType, number>;
    byQualityScore: Record<string, number>;
  };

  performance: {
    totalTime: number;
    averageTime: number;
    throughput: number; // records per second
  };
}

// 스키마 정의
export interface UnifiedSchema {
  version: string;
  entities: Record<UnifiedEntityType, EntitySchema>;
  relationships: RelationshipSchema[];
  constraints: SchemaConstraint[];
}

export interface EntitySchema {
  type: UnifiedEntityType;
  properties: Record<string, PropertySchema>;
  required: string[];
  indexes: string[];
}

export interface PropertySchema {
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  format?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  enum?: any[];
  items?: PropertySchema;
  properties?: Record<string, PropertySchema>;
}

export interface RelationshipSchema {
  name: string;
  from: UnifiedEntityType;
  to: UnifiedEntityType;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  cascade?: boolean;
}

export interface SchemaConstraint {
  name: string;
  type: 'unique' | 'foreign_key' | 'check';
  fields: string[];
  condition?: string;
}

// 변환 엔진 이벤트
export interface TransformationEvent {
  type: 'transform:started' | 'transform:completed' | 'transform:failed' | 'transform:batch_completed';
  transformationId: string;
  sourceRecordId?: string;
  entityId?: string;
  timestamp: Date;
  data: Record<string, any>;
}