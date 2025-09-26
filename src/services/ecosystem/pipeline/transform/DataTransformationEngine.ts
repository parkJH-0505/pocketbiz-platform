/**
 * Data Transformation Engine
 * 원시 데이터를 통합 스키마로 변환하는 엔진
 */

import { CentralEventBus } from '../../EventBus';
import { MappingRegistry } from './MappingRegistry';
import type {
  UnifiedEntity,
  UnifiedEntityType,
  TransformationMapping,
  TransformationResult,
  BatchTransformationResult,
  TransformContext,
  TransformationError,
  TransformFunction,
  PostProcessor,
  ValidationRule,
  TransformationEvent
} from './types';
import type { RawDataRecord } from '../types';
import type { AxisKey } from '../../../../types/buildup.types';

export class DataTransformationEngine {
  private static instance: DataTransformationEngine;

  private eventBus: CentralEventBus;
  private mappingRegistry: MappingRegistry;
  private transformFunctions: Map<TransformFunction, Function> = new Map();
  private postProcessors: PostProcessor[] = [];
  private entityStore: Map<string, UnifiedEntity> = new Map();
  private referenceData: Map<string, any> = new Map();

  private constructor() {
    this.eventBus = CentralEventBus.getInstance();
    this.mappingRegistry = MappingRegistry.getInstance();
    this.initializeTransformFunctions();
  }

  static getInstance(): DataTransformationEngine {
    if (!DataTransformationEngine.instance) {
      DataTransformationEngine.instance = new DataTransformationEngine();
    }
    return DataTransformationEngine.instance;
  }

  /**
   * 단일 레코드 변환
   */
  async transform(record: RawDataRecord, userId?: string): Promise<TransformationResult> {
    const transformationId = `transform_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    // 변환 시작 이벤트 발행
    await this.emitTransformationEvent('transform:started', transformationId, {
      sourceRecordId: record.id,
      sourceType: record.sourceType
    });

    try {
      // 적절한 매핑 규칙 찾기
      const mapping = this.findMapping(record);
      if (!mapping) {
        const error: TransformationError = {
          code: 'NO_MAPPING_FOUND',
          message: `No transformation mapping found for ${record.sourceType}:${record.data.type}`,
          severity: 'error'
        };

        return {
          success: false,
          errors: [error],
          warnings: [],
          transformationId,
          sourceRecordId: record.id,
          transformedAt: new Date(),
          transformationTime: Date.now() - startTime,
          appliedMappings: [],
          qualityScore: 0,
          qualityIssues: ['No mapping available'],
          createdReferences: [],
          updatedReferences: []
        };
      }

      // 변환 컨텍스트 생성
      const context: TransformContext = {
        sourceRecord: record,
        existingEntities: this.entityStore,
        transformationRules: new Map(), // 개별 매핑이므로 빈 맵
        referenceData: this.referenceData,
        userId,
        timestamp: new Date()
      };

      // 조건 검사
      if (!this.checkConditions(record, mapping.conditions || [])) {
        const error: TransformationError = {
          code: 'CONDITIONS_NOT_MET',
          message: 'Transformation conditions not satisfied',
          severity: 'warning'
        };

        return {
          success: false,
          errors: [error],
          warnings: [],
          transformationId,
          sourceRecordId: record.id,
          transformedAt: new Date(),
          transformationTime: Date.now() - startTime,
          appliedMappings: [],
          qualityScore: 0,
          qualityIssues: ['Conditions not met'],
          createdReferences: [],
          updatedReferences: []
        };
      }

      // 기본 엔터티 생성
      const entity = await this.createBaseEntity(record, mapping, context);

      // 필드 매핑 적용
      const mappedEntity = await this.applyFieldMappings(entity, record, mapping, context);

      // 후처리 적용
      const processedEntity = await this.applyPostProcessors(mappedEntity, context);

      // 검증 수행
      const validationErrors = await this.validateEntity(processedEntity, mapping.validationRules || []);

      // 품질 평가
      const qualityResult = this.assessQuality(processedEntity, record, validationErrors);

      // 엔터티 저장
      this.entityStore.set(processedEntity.id, processedEntity);

      const result: TransformationResult = {
        success: validationErrors.filter(e => e.severity === 'error' || e.severity === 'critical').length === 0,
        entity: processedEntity,
        errors: validationErrors,
        warnings: validationErrors.filter(e => e.severity === 'warning').map(e => e.message),
        transformationId,
        sourceRecordId: record.id,
        transformedAt: new Date(),
        transformationTime: Date.now() - startTime,
        appliedMappings: [mapping.id],
        qualityScore: qualityResult.score,
        qualityIssues: qualityResult.issues,
        createdReferences: [],
        updatedReferences: []
      };

      // 변환 완료 이벤트 발행
      await this.emitTransformationEvent('transform:completed', transformationId, {
        sourceRecordId: record.id,
        entityId: processedEntity.id,
        entityType: processedEntity.type,
        qualityScore: qualityResult.score,
        success: result.success
      });

      return result;

    } catch (error) {
      const transformError: TransformationError = {
        code: 'TRANSFORMATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown transformation error',
        severity: 'critical'
      };

      // 실패 이벤트 발행
      await this.emitTransformationEvent('transform:failed', transformationId, {
        sourceRecordId: record.id,
        error: transformError.message
      });

      return {
        success: false,
        errors: [transformError],
        warnings: [],
        transformationId,
        sourceRecordId: record.id,
        transformedAt: new Date(),
        transformationTime: Date.now() - startTime,
        appliedMappings: [],
        qualityScore: 0,
        qualityIssues: ['Transformation failed'],
        createdReferences: [],
        updatedReferences: []
      };
    }
  }

  /**
   * 배치 변환
   */
  async transformBatch(records: RawDataRecord[], userId?: string): Promise<BatchTransformationResult> {
    const startTime = Date.now();
    const results: TransformationResult[] = [];

    console.log(`[DataTransformationEngine] Starting batch transformation of ${records.length} records`);

    // 병렬 처리 (최대 5개씩)
    const batchSize = 5;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const batchPromises = batch.map(record => this.transform(record, userId));

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // 진행 상황 로깅
      console.log(`[DataTransformationEngine] Processed ${Math.min(i + batchSize, records.length)}/${records.length} records`);
    }

    const successfulTransforms = results.filter(r => r.success).length;
    const failedTransforms = results.filter(r => !r.success).length;
    const warnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

    const totalTime = Date.now() - startTime;

    const batchResult: BatchTransformationResult = {
      totalRecords: records.length,
      successfulTransforms,
      failedTransforms,
      warnings,
      results,
      summary: {
        bySourceType: this.summarizeBySourceType(results),
        byEntityType: this.summarizeByEntityType(results),
        byQualityScore: this.summarizeByQualityScore(results)
      },
      performance: {
        totalTime,
        averageTime: records.length > 0 ? totalTime / records.length : 0,
        throughput: totalTime > 0 ? (records.length / totalTime) * 1000 : 0
      }
    };

    // 배치 완료 이벤트 발행
    await this.emitTransformationEvent('transform:batch_completed', `batch_${Date.now()}`, {
      totalRecords: records.length,
      successfulTransforms,
      failedTransforms,
      totalTime
    });

    console.log(`[DataTransformationEngine] Batch transformation completed: ${successfulTransforms}/${records.length} successful`);

    return batchResult;
  }

  /**
   * 적절한 매핑 규칙 찾기
   */
  private findMapping(record: RawDataRecord): TransformationMapping | null {
    return this.mappingRegistry.findBestMapping(
      record.sourceType,
      record.data.type || 'unknown'
    );
  }

  /**
   * 조건 검사
   */
  private checkConditions(record: RawDataRecord, conditions: any[]): boolean {
    return conditions.every(condition => {
      const value = this.getNestedValue(record.data, condition.field);

      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'contains':
          return Array.isArray(value) ? value.includes(condition.value) :
                 typeof value === 'string' ? value.includes(condition.value) : false;
        case 'greaterThan':
          return typeof value === 'number' && value > condition.value;
        case 'lessThan':
          return typeof value === 'number' && value < condition.value;
        case 'exists':
          return value !== undefined && value !== null;
        default:
          return true;
      }
    });
  }

  /**
   * 기본 엔터티 생성
   */
  private async createBaseEntity(
    record: RawDataRecord,
    mapping: TransformationMapping,
    context: TransformContext
  ): Promise<UnifiedEntity> {
    const now = new Date();

    return {
      id: this.generateId(mapping.targetEntityType, record.id),
      type: mapping.targetEntityType,
      title: '', // 필드 매핑에서 설정됨
      description: '',
      status: 'draft',
      priority: 'medium',
      createdAt: now,
      updatedAt: now,
      createdBy: context.userId || 'system',
      updatedBy: context.userId || 'system',
      tags: [],
      metadata: {
        transformationId: `transform_${Date.now()}`,
        dataQuality: record.quality
      },
      sourceId: record.sourceId,
      sourceType: record.sourceType,
      originalData: record.data,
      transformedAt: now,
      version: '1.0.0'
    };
  }

  /**
   * 필드 매핑 적용
   */
  private async applyFieldMappings(
    entity: UnifiedEntity,
    record: RawDataRecord,
    mapping: TransformationMapping,
    context: TransformContext
  ): Promise<UnifiedEntity> {
    const result = { ...entity };

    for (const fieldMapping of mapping.fieldMappings) {
      try {
        let value = this.getNestedValue(record.data, fieldMapping.sourcePath);

        // 기본값 적용
        if ((value === undefined || value === null) && fieldMapping.defaultValue !== undefined) {
          value = fieldMapping.defaultValue;
        }

        // 변환 함수 적용
        if (fieldMapping.transform && value !== undefined && value !== null) {
          const transformFn = this.transformFunctions.get(fieldMapping.transform);
          if (transformFn) {
            value = await transformFn(value, context);
          }
        }

        // 값 설정
        if (value !== undefined) {
          this.setNestedValue(result, fieldMapping.targetPath, value);
        }

      } catch (error) {
        console.warn(`[DataTransformationEngine] Field mapping error for ${fieldMapping.sourcePath}:`, error);
      }
    }

    return result;
  }

  /**
   * 후처리 적용
   */
  private async applyPostProcessors(
    entity: UnifiedEntity,
    context: TransformContext
  ): Promise<UnifiedEntity> {
    let result = entity;

    // 우선순위 순으로 정렬
    const processors = this.postProcessors.sort((a, b) => a.priority - b.priority);

    for (const processor of processors) {
      try {
        result = await processor.function(result, context);
      } catch (error) {
        console.warn(`[DataTransformationEngine] Post-processor ${processor.name} failed:`, error);
      }
    }

    return result;
  }

  /**
   * 엔터티 검증
   */
  private async validateEntity(
    entity: UnifiedEntity,
    validationRules: ValidationRule[]
  ): Promise<TransformationError[]> {
    const errors: TransformationError[] = [];

    for (const rule of validationRules) {
      try {
        const value = this.getNestedValue(entity, rule.field);

        switch (rule.rule) {
          case 'required':
            if (value === undefined || value === null || value === '') {
              errors.push({
                code: 'REQUIRED_FIELD_MISSING',
                field: rule.field,
                message: rule.errorMessage,
                severity: 'error'
              });
            }
            break;

          case 'email':
            if (value && typeof value === 'string' && !this.isValidEmail(value)) {
              errors.push({
                code: 'INVALID_EMAIL',
                field: rule.field,
                message: rule.errorMessage,
                severity: 'warning'
              });
            }
            break;

          case 'url':
            if (value && typeof value === 'string' && !this.isValidUrl(value)) {
              errors.push({
                code: 'INVALID_URL',
                field: rule.field,
                message: rule.errorMessage,
                severity: 'warning'
              });
            }
            break;

          case 'dateRange':
            if (value && value instanceof Date) {
              const { min, max } = rule.params || {};
              if ((min && value < new Date(min)) || (max && value > new Date(max))) {
                errors.push({
                  code: 'DATE_OUT_OF_RANGE',
                  field: rule.field,
                  message: rule.errorMessage,
                  severity: 'error'
                });
              }
            }
            break;

          case 'numberRange':
            if (value && typeof value === 'number') {
              const { min, max } = rule.params || {};
              if ((min !== undefined && value < min) || (max !== undefined && value > max)) {
                errors.push({
                  code: 'NUMBER_OUT_OF_RANGE',
                  field: rule.field,
                  message: rule.errorMessage,
                  severity: 'error'
                });
              }
            }
            break;
        }

      } catch (error) {
        errors.push({
          code: 'VALIDATION_ERROR',
          field: rule.field,
          message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        });
      }
    }

    return errors;
  }

  /**
   * 품질 평가
   */
  private assessQuality(
    entity: UnifiedEntity,
    originalRecord: RawDataRecord,
    validationErrors: TransformationError[]
  ): { score: number; issues: string[] } {
    let score = 100;
    const issues: string[] = [];

    // 검증 오류에 따른 감점
    const criticalErrors = validationErrors.filter(e => e.severity === 'critical').length;
    const errors = validationErrors.filter(e => e.severity === 'error').length;
    const warnings = validationErrors.filter(e => e.severity === 'warning').length;

    score -= criticalErrors * 30;
    score -= errors * 15;
    score -= warnings * 5;

    if (criticalErrors > 0) issues.push(`${criticalErrors} critical errors`);
    if (errors > 0) issues.push(`${errors} errors`);
    if (warnings > 0) issues.push(`${warnings} warnings`);

    // 필수 필드 검사
    if (!entity.title || entity.title.trim() === '') {
      score -= 20;
      issues.push('Missing title');
    }

    // 원본 데이터 품질 반영
    if (originalRecord.quality === 'low') score -= 10;
    else if (originalRecord.quality === 'corrupted') score -= 25;

    // 메타데이터 완성도
    if (!entity.tags || entity.tags.length === 0) {
      score -= 5;
      issues.push('No tags');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      issues
    };
  }

  /**
   * 변환 함수 초기화
   */
  private initializeTransformFunctions(): void {
    this.transformFunctions.set('uppercase', (value: string) =>
      typeof value === 'string' ? value.toUpperCase() : value
    );

    this.transformFunctions.set('lowercase', (value: string) =>
      typeof value === 'string' ? value.toLowerCase() : value
    );

    this.transformFunctions.set('trim', (value: string) =>
      typeof value === 'string' ? value.trim() : value
    );

    this.transformFunctions.set('parseDate', (value: any) => {
      if (value instanceof Date) return value;
      if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date;
      }
      return value;
    });

    this.transformFunctions.set('parseNumber', (value: any) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const num = parseFloat(value);
        return isNaN(num) ? value : num;
      }
      return value;
    });

    this.transformFunctions.set('splitString', (value: string, context: TransformContext) => {
      if (typeof value === 'string') {
        const delimiter = context.referenceData.get('splitDelimiter') || ',';
        return value.split(delimiter).map(s => s.trim());
      }
      return value;
    });

    this.transformFunctions.set('joinArray', (value: any[]) =>
      Array.isArray(value) ? value.join(', ') : value
    );

    this.transformFunctions.set('generateId', (value: any, context: TransformContext) => {
      const prefix = context.referenceData.get('idPrefix') || 'entity';
      return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    });

    this.transformFunctions.set('mapStatus', (value: string) => {
      const statusMap: Record<string, string> = {
        'draft': 'draft',
        'active': 'active',
        'completed': 'completed',
        'cancelled': 'cancelled',
        'scheduled': 'scheduled',
        'pending': 'draft',
        'in_progress': 'in_progress',
        'done': 'completed'
      };
      return statusMap[value] || value;
    });

    this.transformFunctions.set('mapPriority', (value: string) => {
      const priorityMap: Record<string, string> = {
        'low': 'low',
        'medium': 'medium',
        'high': 'high',
        'critical': 'critical',
        'urgent': 'high',
        'normal': 'medium'
      };
      return priorityMap[value] || 'medium';
    });

    this.transformFunctions.set('extractTags', (value: any) => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        return value.split(/[,;]/).map(tag => tag.trim()).filter(tag => tag.length > 0);
      }
      return [];
    });

    this.transformFunctions.set('normalizeKPI', (value: Record<string, number>) => {
      if (typeof value !== 'object') return value;

      const normalized: Record<AxisKey, number> = {} as Record<AxisKey, number>;
      const validAxes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

      validAxes.forEach(axis => {
        if (value[axis] !== undefined) {
          normalized[axis] = Math.max(0, Math.min(100, Number(value[axis])));
        }
      });

      return normalized;
    });
  }

  /**
   * 유틸리티 메서드들
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object') {
        return current[key];
      }
      return undefined;
    }, obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop();
    if (!lastKey) return;

    let current = obj;
    for (const key of keys) {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    current[lastKey] = value;
  }

  private generateId(entityType: UnifiedEntityType, sourceId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6);
    return `${entityType}_${timestamp}_${random}`;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 요약 메서드들
   */
  private summarizeBySourceType(results: TransformationResult[]): Record<string, number> {
    const summary: Record<string, number> = {};
    results.forEach(result => {
      if (result.entity) {
        summary[result.entity.sourceType] = (summary[result.entity.sourceType] || 0) + 1;
      }
    });
    return summary;
  }

  private summarizeByEntityType(results: TransformationResult[]): Record<UnifiedEntityType, number> {
    const summary: Record<UnifiedEntityType, number> = {} as Record<UnifiedEntityType, number>;
    results.forEach(result => {
      if (result.entity) {
        summary[result.entity.type] = (summary[result.entity.type] || 0) + 1;
      }
    });
    return summary;
  }

  private summarizeByQualityScore(results: TransformationResult[]): Record<string, number> {
    const summary: Record<string, number> = {
      'high': 0,    // 90-100
      'medium': 0,  // 70-89
      'low': 0,     // 50-69
      'poor': 0     // 0-49
    };

    results.forEach(result => {
      const score = result.qualityScore;
      if (score >= 90) summary['high']++;
      else if (score >= 70) summary['medium']++;
      else if (score >= 50) summary['low']++;
      else summary['poor']++;
    });

    return summary;
  }

  /**
   * 이벤트 발행
   */
  private async emitTransformationEvent(
    type: TransformationEvent['type'],
    transformationId: string,
    data: Record<string, any>
  ): Promise<void> {
    await this.eventBus.emit({
      id: `transform_event_${Date.now()}`,
      type,
      source: 'transformation-engine',
      timestamp: Date.now(),
      data: {
        transformationId,
        ...data
      }
    });
  }

  /**
   * 매핑 통계 조회
   */
  getMappingStatistics() {
    return this.mappingRegistry.getStatistics();
  }

  /**
   * 매핑 조회
   */
  getMapping(id: string): TransformationMapping | undefined {
    return this.mappingRegistry.getMapping(id);
  }

  /**
   * 동적 매핑 추가
   */
  addMapping(mapping: TransformationMapping): boolean {
    return this.mappingRegistry.addMapping(mapping);
  }

  /**
   * 엔터티 조회
   */
  getEntity(id: string): UnifiedEntity | undefined {
    return this.entityStore.get(id);
  }

  /**
   * 모든 엔터티 조회
   */
  getAllEntities(): UnifiedEntity[] {
    return Array.from(this.entityStore.values());
  }

  /**
   * 타입별 엔터티 조회
   */
  getEntitiesByType(type: UnifiedEntityType): UnifiedEntity[] {
    return Array.from(this.entityStore.values()).filter(entity => entity.type === type);
  }

  /**
   * 정리
   */
  dispose(): void {
    this.transformFunctions.clear();
    this.postProcessors = [];
    this.entityStore.clear();
    this.referenceData.clear();
    this.mappingRegistry.dispose();
    console.log('[DataTransformationEngine] Disposed');
  }
}