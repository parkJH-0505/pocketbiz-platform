/**
 * Data Validation Engine
 * 모든 검증 컴포넌트를 통합하여 데이터 검증을 총괄하는 엔진
 */

import type {
  ValidationResult,
  ValidationConfiguration,
  ValidationContext,
  ValidationStatistics,
  ValidationReport,
  ValidationEvent,
  ValidationCacheEntry,
  ValidationSeverity
} from './types';
import type { UnifiedEntity } from '../pipeline/transform/types';
import { SchemaValidator } from './SchemaValidator';
import { BusinessRuleValidator } from './BusinessRuleValidator';
import { IntegrityChecker } from './IntegrityChecker';
import { EventBus } from '../EventBus';

export class DataValidationEngine {
  private static instance: DataValidationEngine;

  private schemaValidator: SchemaValidator;
  private businessRuleValidator: BusinessRuleValidator;
  private integrityChecker: IntegrityChecker;
  private eventBus: EventBus;

  private configuration: ValidationConfiguration;
  private validationCache: Map<string, ValidationCacheEntry>;
  private statistics: ValidationStatistics;
  private activeValidations: Map<string, Promise<ValidationResult>>;

  private constructor() {
    this.schemaValidator = SchemaValidator.getInstance();
    this.businessRuleValidator = BusinessRuleValidator.getInstance();
    this.integrityChecker = IntegrityChecker.getInstance();
    this.eventBus = EventBus.getInstance();

    this.validationCache = new Map();
    this.activeValidations = new Map();

    // 기본 설정 초기화
    this.configuration = {
      enabled: true,
      strictMode: false,
      maxValidationTime: 30000, // 30초
      parallelValidation: true,

      rulesets: new Map(),
      schemas: new Map(),
      businessRules: new Map(),

      cacheEnabled: true,
      cacheTTL: 300, // 5분
      maxConcurrentValidations: 10,

      stopOnFirstError: false,
      collectAllErrors: true,
      maxErrorsToCollect: 100,

      logLevel: 'info',
      logValidationDetails: true
    };

    // 통계 초기화
    this.statistics = this.initializeStatistics();

    // 캐시 정리 스케줄링
    this.scheduleCacheCleanup();
  }

  public static getInstance(): DataValidationEngine {
    if (!DataValidationEngine.instance) {
      DataValidationEngine.instance = new DataValidationEngine();
    }
    return DataValidationEngine.instance;
  }

  /**
   * 엔터티 검증 수행
   */
  public async validate(
    entity: UnifiedEntity,
    context: ValidationContext
  ): Promise<ValidationResult> {
    // 검증 비활성화 상태 체크
    if (!this.configuration.enabled) {
      return this.createSkippedResult(entity, context, 'Validation disabled');
    }

    const validationId = this.generateValidationId(entity);
    const cacheKey = this.generateCacheKey(entity, context);

    // 캐시 확인
    if (this.configuration.cacheEnabled) {
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        this.updateStatistics(cached, true);
        return cached;
      }
    }

    // 동시 검증 확인
    if (this.activeValidations.has(validationId)) {
      return this.activeValidations.get(validationId)!;
    }

    // 동시 검증 제한 확인
    if (this.activeValidations.size >= this.configuration.maxConcurrentValidations) {
      await this.waitForValidationSlot();
    }

    // 검증 시작
    const validationPromise = this.performValidation(entity, context, validationId);
    this.activeValidations.set(validationId, validationPromise);

    try {
      const result = await validationPromise;

      // 캐시 저장
      if (this.configuration.cacheEnabled) {
        this.cacheResult(cacheKey, result);
      }

      // 통계 업데이트
      this.updateStatistics(result, false);

      // 이벤트 발생
      this.emitValidationEvent('validation:completed', entity.id, { result });

      return result;
    } finally {
      this.activeValidations.delete(validationId);
    }
  }

  /**
   * 실제 검증 수행
   */
  private async performValidation(
    entity: UnifiedEntity,
    context: ValidationContext,
    validationId: string
  ): Promise<ValidationResult> {
    const startTime = Date.now();

    // 검증 시작 이벤트
    this.emitValidationEvent('validation:started', entity.id, { context });

    const result: ValidationResult = {
      id: validationId,
      entityId: entity.id,
      entityType: entity.type,
      status: 'passed',
      timestamp: new Date(),
      duration: 0,
      totalRules: 0,
      passedRules: 0,
      failedRules: 0,
      skippedRules: 0,
      errors: [],
      warnings: [],
      context,
      metadata: {
        validatorVersion: '1.0.0',
        ruleSetVersion: '1.0.0'
      }
    };

    try {
      // 병렬 또는 순차 검증
      if (this.configuration.parallelValidation) {
        await this.performParallelValidation(entity, context, result);
      } else {
        await this.performSequentialValidation(entity, context, result);
      }

      // 최종 상태 결정
      this.determineValidationStatus(result);

    } catch (error) {
      result.status = 'failed';
      result.errors.push({
        ruleId: 'system',
        type: 'custom',
        severity: 'error',
        message: `Validation error: ${error instanceof Error ? error.message : String(error)}`
      });

      this.emitValidationEvent('validation:failed', entity.id, { error });
    }

    // 검증 시간 기록
    result.duration = Date.now() - startTime;

    // 타임아웃 체크
    if (result.duration > this.configuration.maxValidationTime) {
      result.warnings.push({
        ruleId: 'system',
        type: 'performance',
        message: `Validation exceeded max time: ${result.duration}ms`
      });
    }

    return result;
  }

  /**
   * 병렬 검증 수행
   */
  private async performParallelValidation(
    entity: UnifiedEntity,
    context: ValidationContext,
    result: ValidationResult
  ): Promise<void> {
    const validations = [];

    // 스키마 검증
    validations.push(
      this.schemaValidator.validate(entity, context)
        .then(schemaResult => this.mergeValidationResults(result, schemaResult, 'schema'))
        .catch(error => this.handleValidatorError(result, 'schema', error))
    );

    // 비즈니스 규칙 검증
    validations.push(
      this.businessRuleValidator.validate(entity, context)
        .then(businessResult => this.mergeValidationResults(result, businessResult, 'business'))
        .catch(error => this.handleValidatorError(result, 'business', error))
    );

    // 무결성 검사
    validations.push(
      this.integrityChecker.check(entity, context)
        .then(integrityResult => this.mergeValidationResults(result, integrityResult, 'integrity'))
        .catch(error => this.handleValidatorError(result, 'integrity', error))
    );

    await Promise.all(validations);
  }

  /**
   * 순차 검증 수행
   */
  private async performSequentialValidation(
    entity: UnifiedEntity,
    context: ValidationContext,
    result: ValidationResult
  ): Promise<void> {
    // 스키마 검증
    try {
      const schemaResult = await this.schemaValidator.validate(entity, context);
      this.mergeValidationResults(result, schemaResult, 'schema');

      if (this.shouldStopValidation(result)) return;
    } catch (error) {
      this.handleValidatorError(result, 'schema', error);
      if (this.configuration.stopOnFirstError) return;
    }

    // 비즈니스 규칙 검증
    try {
      const businessResult = await this.businessRuleValidator.validate(entity, context);
      this.mergeValidationResults(result, businessResult, 'business');

      if (this.shouldStopValidation(result)) return;
    } catch (error) {
      this.handleValidatorError(result, 'business', error);
      if (this.configuration.stopOnFirstError) return;
    }

    // 무결성 검사
    try {
      const integrityResult = await this.integrityChecker.check(entity, context);
      this.mergeValidationResults(result, integrityResult, 'integrity');
    } catch (error) {
      this.handleValidatorError(result, 'integrity', error);
    }
  }

  /**
   * 검증 결과 병합
   */
  private mergeValidationResults(
    target: ValidationResult,
    source: ValidationResult,
    validatorType: string
  ): void {
    // 규칙 카운트 업데이트
    target.totalRules += source.totalRules;
    target.passedRules += source.passedRules;
    target.failedRules += source.failedRules;
    target.skippedRules += source.skippedRules;

    // 오류 및 경고 병합
    target.errors.push(...source.errors);
    target.warnings.push(...source.warnings);

    // 메타데이터 병합
    if (source.metadata) {
      target.metadata = {
        ...target.metadata,
        [`${validatorType}Metrics`]: source.metadata
      };
    }
  }

  /**
   * 검증기 오류 처리
   */
  private handleValidatorError(
    result: ValidationResult,
    validatorType: string,
    error: any
  ): void {
    result.errors.push({
      ruleId: `${validatorType}-error`,
      type: 'custom',
      severity: 'error',
      message: `${validatorType} validator error: ${error instanceof Error ? error.message : String(error)}`
    });
    result.failedRules++;
  }

  /**
   * 검증 중단 여부 판단
   */
  private shouldStopValidation(result: ValidationResult): boolean {
    if (this.configuration.stopOnFirstError && result.errors.length > 0) {
      return true;
    }

    if (!this.configuration.collectAllErrors &&
        result.errors.length >= this.configuration.maxErrorsToCollect) {
      return true;
    }

    return false;
  }

  /**
   * 최종 검증 상태 결정
   */
  private determineValidationStatus(result: ValidationResult): void {
    if (result.errors.length === 0) {
      result.status = 'passed';
    } else if (this.configuration.strictMode) {
      // 엄격 모드에서는 경고도 실패로 처리
      result.status = result.warnings.length > 0 ? 'failed' : 'passed';
    } else {
      // 일반 모드에서는 오류만 실패로 처리
      const hasErrors = result.errors.some(e => e.severity === 'error');
      result.status = hasErrors ? 'failed' : 'passed';
    }
  }

  /**
   * 배치 검증
   */
  public async validateBatch(
    entities: UnifiedEntity[],
    context: ValidationContext
  ): Promise<ValidationResult[]> {
    const batchSize = this.configuration.maxConcurrentValidations;
    const results: ValidationResult[] = [];

    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(entity => this.validate(entity, context))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * 검증 보고서 생성
   */
  public async generateReport(
    startDate: Date,
    endDate: Date
  ): Promise<ValidationReport> {
    const report: ValidationReport = {
      id: `report-${Date.now()}`,
      generatedAt: new Date(),
      period: { start: startDate, end: endDate },
      summary: {
        totalEntities: 0,
        validatedEntities: 0,
        passedEntities: 0,
        failedEntities: 0,
        validationRate: 0,
        successRate: 0
      },
      statistics: { ...this.statistics },
      topIssues: this.getTopIssues(),
      recommendations: this.generateRecommendations()
    };

    // 요약 통계 계산
    report.summary.totalEntities = this.statistics.totalValidations;
    report.summary.validatedEntities = this.statistics.totalValidations;
    report.summary.passedEntities = this.statistics.successfulValidations;
    report.summary.failedEntities = this.statistics.failedValidations;

    if (report.summary.totalEntities > 0) {
      report.summary.validationRate = 100;
      report.summary.successRate =
        (report.summary.passedEntities / report.summary.totalEntities) * 100;
    }

    return report;
  }

  /**
   * 상위 이슈 조회
   */
  private getTopIssues(): ValidationReport['topIssues'] {
    const issueCount = new Map<string, {
      ruleName: string;
      count: number;
      entities: Set<string>;
    }>();

    // 통계에서 실패가 많은 규칙 찾기
    for (const [ruleId, stats] of Object.entries(this.statistics.ruleStatistics)) {
      if (stats.failed > 0) {
        issueCount.set(ruleId, {
          ruleName: ruleId,
          count: stats.failed,
          entities: new Set()
        });
      }
    }

    // 상위 10개 이슈 반환
    return Array.from(issueCount.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([ruleId, data]) => ({
        ruleId,
        ruleName: data.ruleName,
        failureCount: data.count,
        affectedEntities: Array.from(data.entities)
      }));
  }

  /**
   * 개선 추천사항 생성
   */
  private generateRecommendations(): ValidationReport['recommendations'] {
    const recommendations: ValidationReport['recommendations'] = [];

    // 성능 관련 추천
    if (this.statistics.performanceMetrics.averageValidationTime > 1000) {
      recommendations.push({
        type: 'performance',
        description: 'Average validation time exceeds 1 second',
        priority: 'high',
        action: 'Consider enabling parallel validation or optimizing validation rules'
      });
    }

    // 품질 관련 추천
    const errorRate = this.statistics.failedValidations / this.statistics.totalValidations;
    if (errorRate > 0.1) {
      recommendations.push({
        type: 'quality',
        description: 'High validation failure rate detected',
        priority: 'high',
        action: 'Review and update validation rules to reduce false positives'
      });
    }

    // 규칙 관련 추천
    for (const [ruleId, stats] of Object.entries(this.statistics.ruleStatistics)) {
      if (stats.skipped > stats.executed * 0.5) {
        recommendations.push({
          type: 'rule',
          description: `Rule ${ruleId} is frequently skipped`,
          priority: 'medium',
          action: 'Review rule conditions or consider removing if not needed'
        });
      }
    }

    return recommendations;
  }

  /**
   * 캐시 관리
   */
  private getCachedResult(key: string): ValidationResult | null {
    const entry = this.validationCache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp.getTime();
    if (age > entry.ttl * 1000) {
      this.validationCache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.result;
  }

  private cacheResult(key: string, result: ValidationResult): void {
    this.validationCache.set(key, {
      key,
      result,
      timestamp: new Date(),
      ttl: this.configuration.cacheTTL,
      hits: 0
    });
  }

  private scheduleCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.validationCache.entries()) {
        const age = now - entry.timestamp.getTime();
        if (age > entry.ttl * 1000) {
          this.validationCache.delete(key);
        }
      }
    }, 60000); // 1분마다 정리
  }

  /**
   * 유틸리티 메서드
   */
  private generateValidationId(entity: UnifiedEntity): string {
    return `validation-${entity.id}-${Date.now()}`;
  }

  private generateCacheKey(entity: UnifiedEntity, context: ValidationContext): string {
    return `${entity.type}:${entity.id}:${context.operation}`;
  }

  private async waitForValidationSlot(): Promise<void> {
    while (this.activeValidations.size >= this.configuration.maxConcurrentValidations) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private createSkippedResult(
    entity: UnifiedEntity,
    context: ValidationContext,
    reason: string
  ): ValidationResult {
    return {
      id: this.generateValidationId(entity),
      entityId: entity.id,
      entityType: entity.type,
      status: 'skipped',
      timestamp: new Date(),
      duration: 0,
      totalRules: 0,
      passedRules: 0,
      failedRules: 0,
      skippedRules: 0,
      errors: [],
      warnings: [{
        ruleId: 'system',
        type: 'skip',
        message: reason
      }],
      context
    };
  }

  /**
   * 통계 관리
   */
  private initializeStatistics(): ValidationStatistics {
    return {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      ruleStatistics: {},
      entityStatistics: {},
      timeSeriesData: [],
      performanceMetrics: {
        averageValidationTime: 0,
        p50ValidationTime: 0,
        p95ValidationTime: 0,
        p99ValidationTime: 0
      }
    };
  }

  private updateStatistics(result: ValidationResult, fromCache: boolean): void {
    if (!fromCache) {
      this.statistics.totalValidations++;

      if (result.status === 'passed') {
        this.statistics.successfulValidations++;
      } else if (result.status === 'failed') {
        this.statistics.failedValidations++;
      }

      // 엔터티별 통계 업데이트
      if (!this.statistics.entityStatistics[result.entityType]) {
        this.statistics.entityStatistics[result.entityType] = {
          validated: 0,
          passed: 0,
          failed: 0,
          errorRate: 0
        };
      }

      const entityStats = this.statistics.entityStatistics[result.entityType];
      entityStats.validated++;
      if (result.status === 'passed') entityStats.passed++;
      if (result.status === 'failed') entityStats.failed++;
      entityStats.errorRate = entityStats.failed / entityStats.validated;

      // 성능 메트릭 업데이트
      this.updatePerformanceMetrics(result.duration);
    }
  }

  private updatePerformanceMetrics(duration: number): void {
    const metrics = this.statistics.performanceMetrics;
    const totalTime = metrics.averageValidationTime * (this.statistics.totalValidations - 1);
    metrics.averageValidationTime = (totalTime + duration) / this.statistics.totalValidations;

    // 간단한 백분위수 추정 (실제로는 더 정교한 알고리즘 필요)
    metrics.p50ValidationTime = Math.max(metrics.p50ValidationTime, duration * 0.5);
    metrics.p95ValidationTime = Math.max(metrics.p95ValidationTime, duration * 0.95);
    metrics.p99ValidationTime = Math.max(metrics.p99ValidationTime, duration * 0.99);
  }

  /**
   * 이벤트 처리
   */
  private emitValidationEvent(
    type: ValidationEvent['type'],
    entityId: string,
    data: Record<string, any>
  ): void {
    const event: ValidationEvent = {
      type,
      entityId,
      timestamp: new Date(),
      data
    };

    this.eventBus.emit('validation', event);
  }

  /**
   * 설정 관리
   */
  public updateConfiguration(config: Partial<ValidationConfiguration>): void {
    this.configuration = {
      ...this.configuration,
      ...config
    };
  }

  public getConfiguration(): ValidationConfiguration {
    return { ...this.configuration };
  }

  /**
   * 검증 엔진 리셋
   */
  public reset(): void {
    this.validationCache.clear();
    this.activeValidations.clear();
    this.statistics = this.initializeStatistics();
  }
}