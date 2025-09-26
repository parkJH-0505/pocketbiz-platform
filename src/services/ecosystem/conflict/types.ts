/**
 * Conflict Resolution Types
 * 고급 충돌 해결 시스템 타입 정의
 */

import type { UnifiedEntity, UnifiedEntityType } from '../pipeline/transform/types';

// 충돌 타입
export type ConflictType =
  | 'data'           // 데이터 값 충돌
  | 'schema'         // 스키마 불일치
  | 'version'        // 버전 충돌
  | 'constraint'     // 제약조건 위반
  | 'reference'      // 참조 무결성
  | 'business'       // 비즈니스 규칙
  | 'concurrent'     // 동시성 충돌
  | 'merge';         // 병합 충돌

// 충돌 심각도
export type ConflictSeverity = 'low' | 'medium' | 'high' | 'critical';

// 해결 전략
export type ResolutionStrategy =
  | 'source_wins'      // 소스 우선
  | 'target_wins'      // 대상 우선
  | 'latest_wins'      // 최신 우선
  | 'merge'           // 병합
  | 'manual'          // 수동 해결
  | 'custom'          // 커스텀 해결
  | 'defer'           // 지연 해결
  | 'reject';         // 거부

// 충돌 상태
export type ConflictStatus =
  | 'detected'        // 감지됨
  | 'analyzing'       // 분석 중
  | 'pending'         // 대기 중
  | 'resolving'       // 해결 중
  | 'resolved'        // 해결됨
  | 'failed'          // 실패
  | 'deferred';       // 지연됨

// 충돌 컨텍스트
export interface ConflictContext {
  timestamp: Date;
  source: string;
  target: string;
  operation: 'create' | 'update' | 'delete' | 'merge';
  userId?: string;
  sessionId: string;
  priority: number;
  metadata?: Record<string, any>;
}

// 충돌 정의
export interface Conflict {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  status: ConflictStatus;

  // 충돌 대상
  sourceEntity: UnifiedEntity;
  targetEntity?: UnifiedEntity;
  field?: string;

  // 충돌 세부사항
  details: {
    sourceValue?: any;
    targetValue?: any;
    differences?: Array<{
      path: string;
      sourceValue: any;
      targetValue: any;
    }>;
    constraints?: string[];
    rules?: string[];
  };

  // 컨텍스트
  context: ConflictContext;

  // 해결 정보
  suggestedStrategy?: ResolutionStrategy;
  availableStrategies: ResolutionStrategy[];

  // 타임스탬프
  detectedAt: Date;
  resolvedAt?: Date;
  deferredUntil?: Date;
}

// 해결 결과
export interface ResolutionResult {
  conflictId: string;
  status: 'success' | 'failure' | 'partial' | 'deferred';
  strategy: ResolutionStrategy;

  // 해결된 엔터티
  resolvedEntity?: UnifiedEntity;

  // 변경사항
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    source: 'source' | 'target' | 'merged' | 'computed';
  }>;

  // 부작용
  sideEffects?: Array<{
    entityId: string;
    entityType: UnifiedEntityType;
    field: string;
    change: string;
  }>;

  // 메타데이터
  resolvedBy?: string;
  resolvedAt: Date;
  duration: number;
  attempts: number;

  // 오류 정보
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

// 해결 정책
export interface ResolutionPolicy {
  id: string;
  name: string;
  description: string;
  entityType?: UnifiedEntityType;
  conflictType?: ConflictType;

  // 정책 규칙
  rules: Array<{
    condition: (conflict: Conflict) => boolean;
    strategy: ResolutionStrategy;
    priority: number;
  }>;

  // 기본 전략
  defaultStrategy: ResolutionStrategy;

  // 정책 옵션
  options: {
    autoResolve: boolean;
    requireApproval: boolean;
    notifyOnConflict: boolean;
    maxRetries: number;
    retryDelay: number;
  };

  // 메타데이터
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 병합 옵션
export interface MergeOptions {
  strategy: 'deep' | 'shallow' | 'smart';

  // 필드별 전략
  fieldStrategies?: Map<string, {
    strategy: ResolutionStrategy;
    priority?: 'source' | 'target';
    transformer?: (sourceValue: any, targetValue: any) => any;
  }>;

  // 배열 병합
  arrayMerge?: 'concat' | 'union' | 'replace' | 'smart';

  // 객체 병합
  objectMerge?: 'extend' | 'replace' | 'deep';

  // 충돌 처리
  onConflict?: (field: string, sourceValue: any, targetValue: any) => any;

  // 검증
  validate?: (merged: any) => boolean;
}

// 충돌 감지기
export interface ConflictDetector {
  detect(
    source: UnifiedEntity,
    target?: UnifiedEntity,
    context?: Partial<ConflictContext>
  ): Promise<Conflict[]>;
}

// 충돌 해결기
export interface ConflictResolver {
  resolve(
    conflict: Conflict,
    strategy?: ResolutionStrategy,
    options?: Record<string, any>
  ): Promise<ResolutionResult>;
}

// 충돌 분석 결과
export interface ConflictAnalysis {
  conflictId: string;

  // 충돌 분류
  category: 'trivial' | 'semantic' | 'structural' | 'critical';

  // 영향 평가
  impact: {
    scope: 'field' | 'entity' | 'related' | 'system';
    affectedEntities: string[];
    dataLoss: boolean;
    reversible: boolean;
  };

  // 해결 추천
  recommendations: Array<{
    strategy: ResolutionStrategy;
    confidence: number; // 0-1
    rationale: string;
    risks: string[];
  }>;

  // 패턴 인식
  patterns?: {
    isRecurring: boolean;
    frequency?: number;
    lastOccurrence?: Date;
    similarConflicts?: string[];
  };
}

// 충돌 히스토리
export interface ConflictHistory {
  entityId: string;
  entityType: UnifiedEntityType;

  conflicts: Array<{
    conflictId: string;
    type: ConflictType;
    occurredAt: Date;
    resolvedAt?: Date;
    strategy?: ResolutionStrategy;
    success: boolean;
  }>;

  statistics: {
    totalConflicts: number;
    resolvedConflicts: number;
    failedResolutions: number;
    averageResolutionTime: number;
    mostCommonType: ConflictType;
    mostSuccessfulStrategy: ResolutionStrategy;
  };
}

// 충돌 큐
export interface ConflictQueue {
  id: string;
  priority: 'low' | 'normal' | 'high' | 'critical';

  conflicts: Array<{
    conflict: Conflict;
    addedAt: Date;
    attempts: number;
    lastAttempt?: Date;
    nextRetry?: Date;
  }>;

  processing: {
    isProcessing: boolean;
    currentConflict?: string;
    startedAt?: Date;
  };
}

// 충돌 해결 세션
export interface ResolutionSession {
  id: string;
  startedAt: Date;
  endedAt?: Date;

  // 세션 통계
  stats: {
    totalConflicts: number;
    resolvedConflicts: number;
    failedConflicts: number;
    deferredConflicts: number;
  };

  // 세션 컨텍스트
  context: {
    userId?: string;
    source: string;
    reason: string;
  };

  // 해결 로그
  resolutions: ResolutionResult[];
}

// 충돌 알림
export interface ConflictNotification {
  id: string;
  conflictId: string;
  type: 'detected' | 'resolved' | 'failed' | 'requires_approval';

  message: string;
  severity: ConflictSeverity;

  // 알림 대상
  recipients: string[];
  channels: ('email' | 'slack' | 'webhook' | 'ui')[];

  // 알림 상태
  sent: boolean;
  sentAt?: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;

  // 액션
  actions?: Array<{
    label: string;
    action: string;
    data?: Record<string, any>;
  }>;
}

// 충돌 메트릭
export interface ConflictMetrics {
  period: {
    start: Date;
    end: Date;
  };

  // 발생 메트릭
  detection: {
    total: number;
    byType: Record<ConflictType, number>;
    bySeverity: Record<ConflictSeverity, number>;
    trend: 'increasing' | 'stable' | 'decreasing';
  };

  // 해결 메트릭
  resolution: {
    total: number;
    successful: number;
    failed: number;
    deferred: number;
    averageTime: number;
    byStrategy: Record<ResolutionStrategy, {
      used: number;
      successful: number;
      averageTime: number;
    }>;
  };

  // 성능 메트릭
  performance: {
    detectionLatency: number;
    resolutionLatency: number;
    queueLength: number;
    throughput: number;
  };

  // 품질 메트릭
  quality: {
    autoResolutionRate: number;
    manualInterventionRate: number;
    recurringConflictRate: number;
    dataLossIncidents: number;
  };
}