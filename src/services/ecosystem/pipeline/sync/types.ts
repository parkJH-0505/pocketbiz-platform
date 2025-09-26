/**
 * Real-time Sync Types
 * 실시간 데이터 동기화 시스템 타입 정의
 */

import type { UnifiedEntity, UnifiedEntityType } from '../transform/types';
import type { DataSourceType } from '../types';

// 동기화 작업 타입
export type SyncOperationType =
  | 'create'     // 새 엔터티 생성
  | 'update'     // 기존 엔터티 업데이트
  | 'delete'     // 엔터티 삭제
  | 'merge'      // 엔터티 병합
  | 'restore';   // 엔터티 복원

// 동기화 방향
export type SyncDirection =
  | 'bidirectional'  // 양방향
  | 'source_to_target'  // 소스 → 타겟
  | 'target_to_source'; // 타겟 → 소스

// 동기화 모드
export type SyncMode =
  | 'realtime'     // 실시간 (즉시)
  | 'near_realtime' // 준실시간 (초 단위)
  | 'batch'        // 배치 (분 단위)
  | 'manual';      // 수동

// 동기화 상태
export type SyncStatus =
  | 'pending'      // 대기 중
  | 'processing'   // 처리 중
  | 'completed'    // 완료
  | 'failed'       // 실패
  | 'conflicted'   // 충돌
  | 'cancelled';   // 취소

// 충돌 해결 전략
export type ConflictResolutionStrategy =
  | 'source_wins'     // 소스 우선
  | 'target_wins'     // 타겟 우선
  | 'latest_wins'     // 최신 수정 우선
  | 'merge_fields'    // 필드별 병합
  | 'manual'          // 수동 해결
  | 'custom';         // 커스텀 로직

// 변화 이벤트
export interface ChangeEvent {
  id: string;
  entityId: string;
  entityType: UnifiedEntityType;
  sourceSystem: DataSourceType;
  operationType: SyncOperationType;
  timestamp: Date;

  // 변경 데이터
  previousVersion?: UnifiedEntity;
  currentVersion: UnifiedEntity;
  changedFields: string[];

  // 메타데이터
  userId?: string;
  changeSource: 'user' | 'system' | 'sync';
  changeReason?: string;

  // 동기화 정보
  syncRequired: boolean;
  targetSystems: DataSourceType[];
  priority: number; // 1-10 (높을수록 우선)
}

// 동기화 작업
export interface SyncOperation {
  id: string;
  changeEventId: string;

  // 기본 정보
  operationType: SyncOperationType;
  sourceSystem: DataSourceType;
  targetSystem: DataSourceType;
  entityId: string;
  entityType: UnifiedEntityType;

  // 작업 데이터
  sourceEntity: UnifiedEntity;
  targetEntity?: UnifiedEntity;
  expectedTargetState: UnifiedEntity;

  // 동기화 설정
  syncMode: SyncMode;
  retryAttempts: number;
  maxRetries: number;
  timeout: number;

  // 상태 정보
  status: SyncStatus;
  startedAt?: Date;
  completedAt?: Date;
  error?: SyncError;

  // 성능 메트릭
  performance: SyncPerformanceMetrics;
}

// 동기화 오류
export interface SyncError {
  code: string;
  message: string;
  type: 'network' | 'validation' | 'conflict' | 'system' | 'permission';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  context?: Record<string, any>;
  timestamp: Date;
}

// 충돌 정보
export interface SyncConflict {
  id: string;
  syncOperationId: string;

  // 충돌 기본 정보
  entityId: string;
  entityType: UnifiedEntityType;
  conflictType: 'field' | 'version' | 'dependency' | 'business_rule';

  // 충돌 데이터
  sourceVersion: UnifiedEntity;
  targetVersion: UnifiedEntity;
  conflictedFields: ConflictedField[];

  // 해결 정보
  resolutionStrategy: ConflictResolutionStrategy;
  resolutionStatus: 'pending' | 'resolved' | 'escalated';
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: ConflictResolution;

  // 메타데이터
  detectedAt: Date;
  priority: number;
  autoResolvable: boolean;
}

// 충돌된 필드
export interface ConflictedField {
  fieldPath: string;
  sourceValue: any;
  targetValue: any;
  conflictType: 'different_values' | 'concurrent_modification' | 'type_mismatch';
  lastModified: {
    source: Date;
    target: Date;
  };
}

// 충돌 해결책
export interface ConflictResolution {
  strategy: ConflictResolutionStrategy;
  resolvedEntity: UnifiedEntity;
  fieldResolutions: Array<{
    fieldPath: string;
    chosenValue: any;
    chosenSource: 'source' | 'target' | 'merged' | 'custom';
    reasoning?: string;
  }>;
  metadata: {
    resolvedBy: string;
    resolvedAt: Date;
    confidence: number; // 0-1
    reasoning: string;
  };
}

// 동기화 상태
export interface SyncState {
  // 전체 상태
  isRunning: boolean;
  lastSyncAt: Date;

  // 시스템별 상태
  systemStates: Map<DataSourceType, SystemSyncState>;

  // 성능 메트릭
  globalMetrics: SyncPerformanceMetrics;

  // 건강도
  healthScore: number; // 0-100
  healthStatus: 'healthy' | 'degraded' | 'critical';
  healthIssues: string[];
}

// 시스템별 동기화 상태
export interface SystemSyncState {
  systemId: DataSourceType;
  isOnline: boolean;
  lastHeartbeat: Date;

  // 동기화 통계
  pendingOperations: number;
  inProgressOperations: number;
  completedToday: number;
  failedToday: number;

  // 성능
  averageLatency: number; // ms
  throughput: number; // ops/sec
  errorRate: number; // 0-1

  // 백로그
  backlogSize: number;
  oldestPendingOperation?: Date;
}

// 성능 메트릭
export interface SyncPerformanceMetrics {
  // 처리량
  operationsPerSecond: number;
  bytesPerSecond: number;

  // 지연시간
  averageLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;

  // 성공률
  successRate: number; // 0-1

  // 처리 시간
  totalProcessingTime: number; // ms
  startTime: Date;
  endTime?: Date;
}

// 동기화 설정
export interface SyncConfiguration {
  // 전역 설정
  globalMode: SyncMode;
  globalDirection: SyncDirection;
  maxConcurrentOperations: number;
  defaultTimeout: number;

  // 시스템별 설정
  systemConfigs: Map<DataSourceType, SystemSyncConfig>;

  // 엔터티별 설정
  entityConfigs: Map<UnifiedEntityType, EntitySyncConfig>;

  // 충돌 해결
  defaultConflictStrategy: ConflictResolutionStrategy;
  conflictThreshold: number; // 초

  // 성능 설정
  batchSize: number;
  bufferTimeout: number; // ms
  retryPolicy: RetryPolicy;
}

// 시스템별 동기화 설정
export interface SystemSyncConfig {
  systemId: DataSourceType;
  enabled: boolean;
  mode: SyncMode;
  direction: SyncDirection;
  priority: number; // 1-10

  // 연결 설정
  connectionTimeout: number;
  maxRetries: number;
  backoffMultiplier: number;

  // 필터링
  includedEntityTypes: UnifiedEntityType[];
  excludedEntityTypes: UnifiedEntityType[];
  fieldFilters: Record<string, string[]>; // entityType -> excluded fields

  // 변환 설정
  enableTransformation: boolean;
  customMappings: string[];
}

// 엔터티별 동기화 설정
export interface EntitySyncConfig {
  entityType: UnifiedEntityType;
  enabled: boolean;
  syncMode: SyncMode;
  conflictStrategy: ConflictResolutionStrategy;

  // 필드 설정
  criticalFields: string[]; // 중요 필드 (충돌 시 우선)
  readOnlyFields: string[]; // 읽기 전용 필드
  computedFields: string[]; // 계산 필드 (동기화 제외)

  // 검증 규칙
  validationRules: EntityValidationRule[];

  // 의존성
  dependencies: string[]; // 의존하는 다른 엔터티 타입들
}

// 엔터티 검증 규칙
export interface EntityValidationRule {
  name: string;
  field: string;
  rule: 'required' | 'unique' | 'reference' | 'format' | 'range' | 'custom';
  params?: Record<string, any>;
  errorMessage: string;
  severity: 'warning' | 'error' | 'critical';
}

// 재시도 정책
export interface RetryPolicy {
  maxAttempts: number;
  baseDelay: number; // ms
  maxDelay: number; // ms
  backoffMultiplier: number;
  jitterEnabled: boolean;
  retryableErrors: string[]; // 재시도 가능한 오류 코드들
}

// 동기화 이벤트
export interface SyncEvent {
  type: 'sync:started' | 'sync:completed' | 'sync:failed' | 'sync:conflict_detected' | 'sync:conflict_resolved';
  syncOperationId: string;
  timestamp: Date;
  data: Record<string, any>;
}

// 변화 감지 설정
export interface ChangeDetectionConfig {
  // 감지 모드
  mode: 'polling' | 'webhook' | 'stream' | 'hybrid';
  pollInterval: number; // ms (polling 모드)

  // 필터링
  enabledSystems: DataSourceType[];
  enabledEntityTypes: UnifiedEntityType[];

  // 성능 설정
  batchSize: number;
  maxBufferSize: number;
  flushInterval: number; // ms

  // 중복 제거
  enableDeduplication: boolean;
  deduplicationWindow: number; // ms
}

// 동기화 통계
export interface SyncStatistics {
  // 전체 통계
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  conflictedOperations: number;

  // 시간별 분석
  operationsPerHour: Record<string, number>; // hour -> count
  averageProcessingTime: number; // ms

  // 시스템별 분석
  systemStats: Record<DataSourceType, SystemSyncStatistics>;

  // 엔터티별 분석
  entityStats: Record<UnifiedEntityType, EntitySyncStatistics>;

  // 오류 분석
  errorFrequency: Record<string, number>; // error code -> count
  conflictPatterns: ConflictPattern[];
}

// 시스템별 동기화 통계
export interface SystemSyncStatistics {
  systemId: DataSourceType;
  totalOperations: number;
  successRate: number;
  averageLatency: number;
  errorCount: number;
  lastSyncTime: Date;
}

// 엔터티별 동기화 통계
export interface EntitySyncStatistics {
  entityType: UnifiedEntityType;
  totalOperations: number;
  createOperations: number;
  updateOperations: number;
  deleteOperations: number;
  conflictRate: number;
  averageSize: number; // bytes
}

// 충돌 패턴
export interface ConflictPattern {
  pattern: string;
  frequency: number;
  commonCauses: string[];
  recommendedStrategy: ConflictResolutionStrategy;
  impact: 'low' | 'medium' | 'high';
}