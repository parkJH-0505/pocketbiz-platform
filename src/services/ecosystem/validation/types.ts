/**
 * Data Validation Types
 * 데이터 검증 및 충돌 해결 시스템 타입 정의
 */

import type { UnifiedEntity, UnifiedEntityType } from '../pipeline/transform/types';

// 검증 규칙 타입
export type ValidationRuleType =
  | 'required'        // 필수 필드
  | 'type'           // 타입 검증
  | 'format'         // 형식 검증 (email, url, date 등)
  | 'range'          // 범위 검증 (숫자, 날짜)
  | 'length'         // 길이 검증 (문자열, 배열)
  | 'pattern'        // 정규식 패턴
  | 'unique'         // 고유성 검증
  | 'reference'      // 참조 무결성
  | 'business'       // 비즈니스 규칙
  | 'custom';        // 커스텀 검증

// 검증 심각도
export type ValidationSeverity = 'error' | 'warning' | 'info';

// 검증 결과 상태
export type ValidationStatus = 'passed' | 'failed' | 'skipped';

// 검증 컨텍스트
export interface ValidationContext {
  entityType: UnifiedEntityType;
  operation: 'create' | 'update' | 'delete';
  userId?: string;
  timestamp: Date;
  source: string;
  metadata?: Record<string, any>;
}

// 검증 규칙
export interface ValidationRule {
  id: string;
  name: string;
  type: ValidationRuleType;
  field?: string;
  severity: ValidationSeverity;
  enabled: boolean;

  // 규칙 파라미터
  params?: {
    required?: boolean;
    type?: string;
    format?: string;
    min?: number | Date;
    max?: number | Date;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    uniqueIn?: string;
    referenceEntity?: string;
    referenceField?: string;
    customValidator?: (value: any, entity: UnifiedEntity, context: ValidationContext) => boolean;
  };

  // 오류 메시지
  errorMessage: string;

  // 조건부 적용
  condition?: (entity: UnifiedEntity, context: ValidationContext) => boolean;
}

// 검증 결과
export interface ValidationResult {
  id: string;
  entityId: string;
  entityType: UnifiedEntityType;
  status: ValidationStatus;
  timestamp: Date;
  duration: number; // ms

  // 검증 세부사항
  totalRules: number;
  passedRules: number;
  failedRules: number;
  skippedRules: number;

  // 오류 및 경고
  errors: ValidationError[];
  warnings: ValidationWarning[];

  // 검증 컨텍스트
  context: ValidationContext;

  // 메타데이터
  metadata?: {
    validatorVersion: string;
    ruleSetVersion: string;
    performanceMetrics?: Record<string, number>;
  };
}

// 검증 오류
export interface ValidationError {
  ruleId: string;
  field?: string;
  value?: any;
  type: ValidationRuleType;
  severity: ValidationSeverity;
  message: string;
  details?: Record<string, any>;
}

// 검증 경고
export interface ValidationWarning {
  ruleId: string;
  field?: string;
  type: string;
  message: string;
  suggestion?: string;
}

// 스키마 정의
export interface Schema {
  id: string;
  version: string;
  entityType: UnifiedEntityType;

  // 필드 정의
  fields: Record<string, FieldSchema>;

  // 필수 필드
  required: string[];

  // 관계 정의
  relationships?: RelationshipSchema[];

  // 제약사항
  constraints?: ConstraintSchema[];
}

// 필드 스키마
export interface FieldSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  format?: string;
  description?: string;

  // 검증 규칙
  nullable?: boolean;
  unique?: boolean;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  enum?: any[];

  // 중첩 스키마 (object, array 타입)
  items?: FieldSchema;
  properties?: Record<string, FieldSchema>;
}

// 관계 스키마
export interface RelationshipSchema {
  name: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  sourceField: string;
  targetEntity: UnifiedEntityType;
  targetField: string;
  required: boolean;
  cascade?: boolean;
}

// 제약사항 스키마
export interface ConstraintSchema {
  name: string;
  type: 'unique' | 'check' | 'foreign_key';
  fields: string[];
  condition?: string;
  errorMessage: string;
}

// 비즈니스 규칙
export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  entityType: UnifiedEntityType;
  enabled: boolean;
  priority: number; // 1-10 (높을수록 우선)

  // 규칙 조건
  conditions: RuleCondition[];

  // 규칙 액션
  actions: RuleAction[];

  // 규칙 메타데이터
  metadata: {
    createdBy: string;
    createdAt: Date;
    updatedBy: string;
    updatedAt: Date;
    tags: string[];
  };
}

// 규칙 조건
export interface RuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'exists' | 'not_exists';
  value: any;
  logic?: 'AND' | 'OR';
}

// 규칙 액션
export interface RuleAction {
  type: 'validate' | 'transform' | 'reject' | 'warn' | 'log';
  params?: Record<string, any>;
  errorMessage?: string;
}

// 무결성 검사 타입
export type IntegrityCheckType =
  | 'referential'     // 참조 무결성
  | 'entity'          // 엔터티 무결성
  | 'domain'          // 도메인 무결성
  | 'user_defined';   // 사용자 정의 무결성

// 무결성 검사 결과
export interface IntegrityCheckResult {
  checkType: IntegrityCheckType;
  passed: boolean;
  violations: IntegrityViolation[];
  checkedAt: Date;
  duration: number; // ms
}

// 무결성 위반
export interface IntegrityViolation {
  type: IntegrityCheckType;
  entityId: string;
  field?: string;
  description: string;
  severity: ValidationSeverity;
  fixSuggestion?: string;
}

// 검증 통계
export interface ValidationStatistics {
  totalValidations: number;
  successfulValidations: number;
  failedValidations: number;

  // 규칙별 통계
  ruleStatistics: Record<string, {
    executed: number;
    passed: number;
    failed: number;
    skipped: number;
    averageDuration: number;
  }>;

  // 엔터티별 통계
  entityStatistics: Record<UnifiedEntityType, {
    validated: number;
    passed: number;
    failed: number;
    errorRate: number;
  }>;

  // 시간별 통계
  timeSeriesData: Array<{
    timestamp: Date;
    validations: number;
    errors: number;
    warnings: number;
  }>;

  // 성능 메트릭
  performanceMetrics: {
    averageValidationTime: number;
    p50ValidationTime: number;
    p95ValidationTime: number;
    p99ValidationTime: number;
  };
}

// 검증 설정
export interface ValidationConfiguration {
  // 전역 설정
  enabled: boolean;
  strictMode: boolean; // 엄격 모드 (경고도 오류로 처리)
  maxValidationTime: number; // ms
  parallelValidation: boolean;

  // 규칙 설정
  rulesets: Map<UnifiedEntityType, ValidationRule[]>;
  schemas: Map<UnifiedEntityType, Schema>;
  businessRules: Map<string, BusinessRule>;

  // 성능 설정
  cacheEnabled: boolean;
  cacheTTL: number; // seconds
  maxConcurrentValidations: number;

  // 오류 처리
  stopOnFirstError: boolean;
  collectAllErrors: boolean;
  maxErrorsToCollect: number;

  // 로깅 설정
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logValidationDetails: boolean;
}

// 검증 이벤트
export interface ValidationEvent {
  type: 'validation:started' | 'validation:completed' | 'validation:failed' | 'validation:rule_executed';
  entityId: string;
  timestamp: Date;
  data: Record<string, any>;
}

// 검증 캐시 엔트리
export interface ValidationCacheEntry {
  key: string;
  result: ValidationResult;
  timestamp: Date;
  ttl: number;
  hits: number;
}

// 검증 리포트
export interface ValidationReport {
  id: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };

  // 요약
  summary: {
    totalEntities: number;
    validatedEntities: number;
    passedEntities: number;
    failedEntities: number;
    validationRate: number;
    successRate: number;
  };

  // 상세 통계
  statistics: ValidationStatistics;

  // 주요 이슈
  topIssues: Array<{
    ruleId: string;
    ruleName: string;
    failureCount: number;
    affectedEntities: string[];
  }>;

  // 추천사항
  recommendations: Array<{
    type: 'rule' | 'performance' | 'quality';
    description: string;
    priority: 'high' | 'medium' | 'low';
    action: string;
  }>;
}