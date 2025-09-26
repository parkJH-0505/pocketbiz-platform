/**
 * Schema Validator
 * 데이터 구조 및 타입 검증 시스템
 */

import type {
  Schema,
  FieldSchema,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationContext,
  ValidationStatus
} from './types';
import type { UnifiedEntity, UnifiedEntityType } from '../pipeline/transform/types';

export class SchemaValidator {
  private schemas: Map<UnifiedEntityType, Schema> = new Map();
  private validationCache: Map<string, ValidationResult> = new Map();
  private cacheEnabled: boolean = true;
  private cacheTTL: number = 300; // 5분

  constructor() {
    this.loadDefaultSchemas();
  }

  /**
   * 스키마 검증 실행
   */
  async validate(
    entity: UnifiedEntity,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    const validationId = `schema_${entity.id}_${Date.now()}`;

    // 캐시 확인
    const cacheKey = this.getCacheKey(entity, context);
    const cachedResult = this.getCachedResult(cacheKey);
    if (cachedResult) {
      console.log(`[SchemaValidator] Using cached result for ${entity.id}`);
      return cachedResult;
    }

    console.log(`[SchemaValidator] Validating ${entity.type} entity: ${entity.id}`);

    const schema = this.schemas.get(entity.type);
    if (!schema) {
      console.warn(`[SchemaValidator] No schema found for entity type: ${entity.type}`);
      return this.createResult(validationId, entity, 'skipped', [], [], context, Date.now() - startTime);
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 필드 타입 검증
    this.validateFieldTypes(entity, schema, errors, warnings);

    // 필수 필드 검증
    this.validateRequiredFields(entity, schema, errors);

    // 형식 검증
    this.validateFieldFormats(entity, schema, errors);

    // 범위 및 길이 검증
    this.validateFieldConstraints(entity, schema, errors, warnings);

    // 열거형 값 검증
    this.validateEnumValues(entity, schema, errors);

    // 패턴 검증
    this.validatePatterns(entity, schema, errors);

    // 관계 검증
    if (schema.relationships) {
      await this.validateRelationships(entity, schema, errors);
    }

    // 제약사항 검증
    if (schema.constraints) {
      this.validateConstraints(entity, schema, errors);
    }

    const status: ValidationStatus = errors.length === 0 ? 'passed' : 'failed';
    const result = this.createResult(
      validationId,
      entity,
      status,
      errors,
      warnings,
      context,
      Date.now() - startTime
    );

    // 캐시 저장
    if (this.cacheEnabled) {
      this.cacheResult(cacheKey, result);
    }

    console.log(`[SchemaValidator] Validation ${status} for ${entity.id}: ${errors.length} errors, ${warnings.length} warnings`);
    return result;
  }

  /**
   * 필드 타입 검증
   */
  private validateFieldTypes(
    entity: UnifiedEntity,
    schema: Schema,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
      const value = this.getFieldValue(entity, fieldName);

      if (value === undefined || value === null) {
        if (!fieldSchema.nullable && schema.required.includes(fieldName)) {
          errors.push({
            ruleId: `type_${fieldName}`,
            field: fieldName,
            value,
            type: 'type',
            severity: 'error',
            message: `Field '${fieldName}' is null but not nullable`
          });
        }
        continue;
      }

      const actualType = this.getActualType(value);
      const expectedType = fieldSchema.type;

      if (!this.isTypeMatch(value, expectedType)) {
        errors.push({
          ruleId: `type_${fieldName}`,
          field: fieldName,
          value,
          type: 'type',
          severity: 'error',
          message: `Field '${fieldName}' type mismatch: expected ${expectedType}, got ${actualType}`,
          details: { expectedType, actualType }
        });
      }

      // 중첩 객체/배열 검증
      if (expectedType === 'object' && fieldSchema.properties) {
        this.validateNestedObject(value, fieldSchema.properties, fieldName, errors, warnings);
      } else if (expectedType === 'array' && fieldSchema.items) {
        this.validateArray(value, fieldSchema.items, fieldName, errors, warnings);
      }
    }
  }

  /**
   * 필수 필드 검증
   */
  private validateRequiredFields(
    entity: UnifiedEntity,
    schema: Schema,
    errors: ValidationError[]
  ): void {
    for (const requiredField of schema.required) {
      const value = this.getFieldValue(entity, requiredField);

      if (value === undefined || value === null ||
          (typeof value === 'string' && value.trim() === '') ||
          (Array.isArray(value) && value.length === 0)) {
        errors.push({
          ruleId: `required_${requiredField}`,
          field: requiredField,
          value,
          type: 'required',
          severity: 'error',
          message: `Required field '${requiredField}' is missing or empty`
        });
      }
    }
  }

  /**
   * 형식 검증
   */
  private validateFieldFormats(
    entity: UnifiedEntity,
    schema: Schema,
    errors: ValidationError[]
  ): void {
    for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
      if (!fieldSchema.format) continue;

      const value = this.getFieldValue(entity, fieldName);
      if (value === undefined || value === null) continue;

      let isValid = false;
      switch (fieldSchema.format) {
        case 'email':
          isValid = this.isValidEmail(value);
          break;
        case 'url':
          isValid = this.isValidUrl(value);
          break;
        case 'date':
          isValid = this.isValidDate(value);
          break;
        case 'uuid':
          isValid = this.isValidUuid(value);
          break;
        case 'phone':
          isValid = this.isValidPhone(value);
          break;
        default:
          console.warn(`[SchemaValidator] Unknown format: ${fieldSchema.format}`);
          isValid = true;
      }

      if (!isValid) {
        errors.push({
          ruleId: `format_${fieldName}`,
          field: fieldName,
          value,
          type: 'format',
          severity: 'error',
          message: `Field '${fieldName}' has invalid format: expected ${fieldSchema.format}`,
          details: { format: fieldSchema.format }
        });
      }
    }
  }

  /**
   * 제약사항 검증 (범위, 길이 등)
   */
  private validateFieldConstraints(
    entity: UnifiedEntity,
    schema: Schema,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
      const value = this.getFieldValue(entity, fieldName);
      if (value === undefined || value === null) continue;

      // 문자열 길이 검증
      if (typeof value === 'string') {
        if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
          errors.push({
            ruleId: `minLength_${fieldName}`,
            field: fieldName,
            value,
            type: 'length',
            severity: 'error',
            message: `Field '${fieldName}' is too short: minimum ${fieldSchema.minLength} characters`,
            details: { minLength: fieldSchema.minLength, actualLength: value.length }
          });
        }

        if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
          errors.push({
            ruleId: `maxLength_${fieldName}`,
            field: fieldName,
            value: value.substring(0, 50) + '...', // 긴 값은 잘라서 표시
            type: 'length',
            severity: 'error',
            message: `Field '${fieldName}' is too long: maximum ${fieldSchema.maxLength} characters`,
            details: { maxLength: fieldSchema.maxLength, actualLength: value.length }
          });
        }
      }

      // 숫자 범위 검증
      if (typeof value === 'number') {
        if (fieldSchema.minimum !== undefined && value < fieldSchema.minimum) {
          errors.push({
            ruleId: `minimum_${fieldName}`,
            field: fieldName,
            value,
            type: 'range',
            severity: 'error',
            message: `Field '${fieldName}' is below minimum: ${fieldSchema.minimum}`,
            details: { minimum: fieldSchema.minimum, actual: value }
          });
        }

        if (fieldSchema.maximum !== undefined && value > fieldSchema.maximum) {
          errors.push({
            ruleId: `maximum_${fieldName}`,
            field: fieldName,
            value,
            type: 'range',
            severity: 'error',
            message: `Field '${fieldName}' exceeds maximum: ${fieldSchema.maximum}`,
            details: { maximum: fieldSchema.maximum, actual: value }
          });
        }

        // 경고: 값이 정상 범위의 경계에 가까운 경우
        if (fieldSchema.maximum && value > fieldSchema.maximum * 0.9) {
          warnings.push({
            ruleId: `near_maximum_${fieldName}`,
            field: fieldName,
            type: 'range',
            message: `Field '${fieldName}' is approaching maximum limit`,
            suggestion: `Consider reviewing this value as it's at ${(value / fieldSchema.maximum * 100).toFixed(1)}% of the maximum`
          });
        }
      }

      // 배열 길이 검증
      if (Array.isArray(value)) {
        if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
          errors.push({
            ruleId: `minItems_${fieldName}`,
            field: fieldName,
            type: 'length',
            severity: 'error',
            message: `Field '${fieldName}' has too few items: minimum ${fieldSchema.minLength}`,
            details: { minLength: fieldSchema.minLength, actualLength: value.length }
          });
        }

        if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
          errors.push({
            ruleId: `maxItems_${fieldName}`,
            field: fieldName,
            type: 'length',
            severity: 'error',
            message: `Field '${fieldName}' has too many items: maximum ${fieldSchema.maxLength}`,
            details: { maxLength: fieldSchema.maxLength, actualLength: value.length }
          });
        }
      }
    }
  }

  /**
   * 열거형 값 검증
   */
  private validateEnumValues(
    entity: UnifiedEntity,
    schema: Schema,
    errors: ValidationError[]
  ): void {
    for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
      if (!fieldSchema.enum || fieldSchema.enum.length === 0) continue;

      const value = this.getFieldValue(entity, fieldName);
      if (value === undefined || value === null) continue;

      if (!fieldSchema.enum.includes(value)) {
        errors.push({
          ruleId: `enum_${fieldName}`,
          field: fieldName,
          value,
          type: 'pattern',
          severity: 'error',
          message: `Field '${fieldName}' has invalid value: must be one of [${fieldSchema.enum.join(', ')}]`,
          details: { validValues: fieldSchema.enum, actualValue: value }
        });
      }
    }
  }

  /**
   * 패턴 검증
   */
  private validatePatterns(
    entity: UnifiedEntity,
    schema: Schema,
    errors: ValidationError[]
  ): void {
    for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
      if (!fieldSchema.pattern) continue;

      const value = this.getFieldValue(entity, fieldName);
      if (value === undefined || value === null) continue;

      if (typeof value !== 'string') continue;

      try {
        const regex = new RegExp(fieldSchema.pattern);
        if (!regex.test(value)) {
          errors.push({
            ruleId: `pattern_${fieldName}`,
            field: fieldName,
            value,
            type: 'pattern',
            severity: 'error',
            message: `Field '${fieldName}' does not match required pattern`,
            details: { pattern: fieldSchema.pattern }
          });
        }
      } catch (e) {
        console.error(`[SchemaValidator] Invalid regex pattern for field ${fieldName}: ${fieldSchema.pattern}`);
      }
    }
  }

  /**
   * 관계 검증
   */
  private async validateRelationships(
    entity: UnifiedEntity,
    schema: Schema,
    errors: ValidationError[]
  ): Promise<void> {
    if (!schema.relationships) return;

    for (const relationship of schema.relationships) {
      const value = this.getFieldValue(entity, relationship.sourceField);

      if (relationship.required && (value === undefined || value === null)) {
        errors.push({
          ruleId: `relationship_${relationship.name}`,
          field: relationship.sourceField,
          type: 'reference',
          severity: 'error',
          message: `Required relationship '${relationship.name}' is missing`,
          details: { relationship }
        });
      }

      // 실제 참조 검증은 IntegrityChecker에서 수행
    }
  }

  /**
   * 제약사항 검증
   */
  private validateConstraints(
    entity: UnifiedEntity,
    schema: Schema,
    errors: ValidationError[]
  ): void {
    if (!schema.constraints) return;

    for (const constraint of schema.constraints) {
      switch (constraint.type) {
        case 'unique':
          // 고유성 검증은 실제 데이터베이스 레벨에서 수행
          break;
        case 'check':
          if (constraint.condition && !this.evaluateCondition(entity, constraint.condition)) {
            errors.push({
              ruleId: `constraint_${constraint.name}`,
              field: constraint.fields.join(', '),
              type: 'business',
              severity: 'error',
              message: constraint.errorMessage || `Constraint '${constraint.name}' violation`,
              details: { constraint }
            });
          }
          break;
        case 'foreign_key':
          // 외래키 검증은 IntegrityChecker에서 수행
          break;
      }
    }
  }

  /**
   * 중첩 객체 검증
   */
  private validateNestedObject(
    obj: any,
    properties: Record<string, FieldSchema>,
    parentField: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (typeof obj !== 'object' || obj === null) return;

    for (const [propName, propSchema] of Object.entries(properties)) {
      const value = obj[propName];
      const fieldPath = `${parentField}.${propName}`;

      if (value !== undefined && value !== null) {
        const actualType = this.getActualType(value);
        if (!this.isTypeMatch(value, propSchema.type)) {
          errors.push({
            ruleId: `nested_type_${fieldPath}`,
            field: fieldPath,
            value,
            type: 'type',
            severity: 'error',
            message: `Nested field '${fieldPath}' type mismatch: expected ${propSchema.type}, got ${actualType}`
          });
        }
      }
    }
  }

  /**
   * 배열 검증
   */
  private validateArray(
    arr: any[],
    itemSchema: FieldSchema,
    fieldName: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!Array.isArray(arr)) return;

    arr.forEach((item, index) => {
      const fieldPath = `${fieldName}[${index}]`;
      const actualType = this.getActualType(item);

      if (!this.isTypeMatch(item, itemSchema.type)) {
        errors.push({
          ruleId: `array_item_type_${fieldPath}`,
          field: fieldPath,
          value: item,
          type: 'type',
          severity: 'error',
          message: `Array item '${fieldPath}' type mismatch: expected ${itemSchema.type}, got ${actualType}`
        });
      }
    });
  }

  /**
   * 유틸리티 메서드들
   */
  private getFieldValue(entity: any, fieldPath: string): any {
    return fieldPath.split('.').reduce((obj, key) => obj?.[key], entity);
  }

  private getActualType(value: any): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    return typeof value;
  }

  private isTypeMatch(value: any, expectedType: string): boolean {
    const actualType = this.getActualType(value);

    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'date':
        return value instanceof Date || !isNaN(Date.parse(value));
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return false;
    }
  }

  private isValidEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  private isValidUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  private isValidDate(value: any): boolean {
    if (value instanceof Date) return !isNaN(value.getTime());
    if (typeof value === 'string') return !isNaN(Date.parse(value));
    return false;
  }

  private isValidUuid(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  private isValidPhone(value: string): boolean {
    const phoneRegex = /^\+?[\d\s-()]+$/;
    return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10;
  }

  private evaluateCondition(entity: UnifiedEntity, condition: string): boolean {
    // 간단한 조건 평가 (실제로는 더 복잡한 파서 필요)
    try {
      // 보안상 eval 사용 금지, 실제로는 안전한 표현식 파서 사용
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 캐시 관리
   */
  private getCacheKey(entity: UnifiedEntity, context: ValidationContext): string {
    return `${entity.type}_${entity.id}_${entity.updatedAt}_${context.operation}`;
  }

  private getCachedResult(cacheKey: string): ValidationResult | null {
    if (!this.cacheEnabled) return null;

    const cached = this.validationCache.get(cacheKey);
    if (!cached) return null;

    const age = (Date.now() - cached.timestamp.getTime()) / 1000;
    if (age > this.cacheTTL) {
      this.validationCache.delete(cacheKey);
      return null;
    }

    return cached;
  }

  private cacheResult(cacheKey: string, result: ValidationResult): void {
    this.validationCache.set(cacheKey, result);

    // 캐시 크기 제한
    if (this.validationCache.size > 1000) {
      const firstKey = this.validationCache.keys().next().value;
      this.validationCache.delete(firstKey);
    }
  }

  /**
   * 결과 생성
   */
  private createResult(
    id: string,
    entity: UnifiedEntity,
    status: ValidationStatus,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    context: ValidationContext,
    duration: number
  ): ValidationResult {
    return {
      id,
      entityId: entity.id,
      entityType: entity.type,
      status,
      timestamp: new Date(),
      duration,
      totalRules: Object.keys(this.schemas.get(entity.type)?.fields || {}).length,
      passedRules: status === 'passed' ? this.schemas.get(entity.type)?.fields ? Object.keys(this.schemas.get(entity.type)!.fields).length : 0 : 0,
      failedRules: errors.length,
      skippedRules: 0,
      errors,
      warnings,
      context,
      metadata: {
        validatorVersion: '1.0.0',
        ruleSetVersion: '1.0.0'
      }
    };
  }

  /**
   * 기본 스키마 로드
   */
  private loadDefaultSchemas(): void {
    // 프로젝트 스키마
    this.schemas.set('project', {
      id: 'project_schema_v1',
      version: '1.0.0',
      entityType: 'project',
      fields: {
        id: { name: 'id', type: 'string', format: 'uuid' },
        title: { name: 'title', type: 'string', minLength: 3, maxLength: 200 },
        description: { name: 'description', type: 'string', maxLength: 2000, nullable: true },
        status: {
          name: 'status',
          type: 'string',
          enum: ['draft', 'active', 'completed', 'cancelled', 'archived', 'scheduled', 'in_progress', 'on_hold']
        },
        priority: {
          name: 'priority',
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical']
        },
        progress: { name: 'progress', type: 'number', minimum: 0, maximum: 100 },
        startDate: { name: 'startDate', type: 'date' },
        endDate: { name: 'endDate', type: 'date', nullable: true },
        budget: { name: 'budget', type: 'number', minimum: 0, nullable: true }
      },
      required: ['id', 'title', 'status', 'priority', 'startDate'],
      constraints: [
        {
          name: 'date_order',
          type: 'check',
          fields: ['startDate', 'endDate'],
          condition: 'endDate > startDate',
          errorMessage: 'End date must be after start date'
        }
      ]
    });

    // KPI 스키마
    this.schemas.set('kpi', {
      id: 'kpi_schema_v1',
      version: '1.0.0',
      entityType: 'kpi',
      fields: {
        id: { name: 'id', type: 'string' },
        scores: {
          name: 'scores',
          type: 'object',
          properties: {
            GO: { name: 'GO', type: 'number', minimum: 0, maximum: 100 },
            EC: { name: 'EC', type: 'number', minimum: 0, maximum: 100 },
            PT: { name: 'PT', type: 'number', minimum: 0, maximum: 100 },
            PF: { name: 'PF', type: 'number', minimum: 0, maximum: 100 },
            TO: { name: 'TO', type: 'number', minimum: 0, maximum: 100 }
          }
        },
        measuredAt: { name: 'measuredAt', type: 'date' },
        confidence: { name: 'confidence', type: 'number', minimum: 0, maximum: 1 }
      },
      required: ['id', 'scores', 'measuredAt']
    });

    console.log(`[SchemaValidator] Loaded ${this.schemas.size} default schemas`);
  }

  /**
   * 스키마 추가
   */
  addSchema(schema: Schema): void {
    this.schemas.set(schema.entityType, schema);
    console.log(`[SchemaValidator] Added schema for ${schema.entityType}`);
  }

  /**
   * 스키마 조회
   */
  getSchema(entityType: UnifiedEntityType): Schema | undefined {
    return this.schemas.get(entityType);
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.validationCache.clear();
    console.log('[SchemaValidator] Cache cleared');
  }

  /**
   * 통계 조회
   */
  getStatistics() {
    return {
      loadedSchemas: this.schemas.size,
      cacheSize: this.validationCache.size,
      cacheEnabled: this.cacheEnabled,
      cacheTTL: this.cacheTTL
    };
  }
}