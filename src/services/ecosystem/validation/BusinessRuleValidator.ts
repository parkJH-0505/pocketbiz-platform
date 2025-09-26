/**
 * Business Rule Validator
 * 비즈니스 규칙 및 도메인 로직 검증 시스템
 */

import type {
  BusinessRule,
  RuleCondition,
  RuleAction,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationContext,
  ValidationStatus
} from './types';
import type { UnifiedEntity, UnifiedEntityType } from '../pipeline/transform/types';

interface RuleExecutionContext {
  entity: UnifiedEntity;
  validationContext: ValidationContext;
  previousValue?: UnifiedEntity;
  relatedEntities?: Map<string, UnifiedEntity>;
}

interface RuleExecutionResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  transformations?: Record<string, any>;
  logs?: string[];
}

export class BusinessRuleValidator {
  private businessRules: Map<string, BusinessRule> = new Map();
  private rulesByEntity: Map<UnifiedEntityType, BusinessRule[]> = new Map();
  private executionHistory: Map<string, RuleExecutionResult> = new Map();
  private maxHistorySize = 1000;

  constructor() {
    this.loadDefaultRules();
  }

  /**
   * 비즈니스 규칙 검증 실행
   */
  async validate(
    entity: UnifiedEntity,
    context: ValidationContext,
    previousValue?: UnifiedEntity
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    const validationId = `business_${entity.id}_${Date.now()}`;

    console.log(`[BusinessRuleValidator] Validating ${entity.type} entity: ${entity.id}`);

    const applicableRules = this.getApplicableRules(entity.type, context);
    if (applicableRules.length === 0) {
      console.log(`[BusinessRuleValidator] No business rules for ${entity.type}`);
      return this.createResult(validationId, entity, 'passed', [], [], context, 0, 0, Date.now() - startTime);
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let rulesExecuted = 0;
    let rulesPassed = 0;

    // 우선순위 순으로 규칙 실행
    const sortedRules = applicableRules.sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (!rule.enabled) continue;

      const ruleContext: RuleExecutionContext = {
        entity,
        validationContext: context,
        previousValue,
        relatedEntities: new Map() // 실제로는 관련 엔터티 조회 필요
      };

      const result = await this.executeRule(rule, ruleContext);
      rulesExecuted++;

      if (result.passed) {
        rulesPassed++;
      }

      errors.push(...result.errors);
      warnings.push(...result.warnings);

      // 실행 이력 저장
      this.saveExecutionHistory(rule.id, result);

      // 규칙 액션 처리
      if (result.transformations) {
        this.applyTransformations(entity, result.transformations);
      }

      if (result.logs) {
        result.logs.forEach(log => console.log(`[BusinessRule:${rule.name}] ${log}`));
      }
    }

    const status: ValidationStatus = errors.filter(e => e.severity === 'error').length === 0 ? 'passed' : 'failed';

    console.log(`[BusinessRuleValidator] Validation ${status} for ${entity.id}: ${errors.length} errors, ${warnings.length} warnings`);

    return this.createResult(
      validationId,
      entity,
      status,
      errors,
      warnings,
      context,
      rulesExecuted,
      rulesPassed,
      Date.now() - startTime
    );
  }

  /**
   * 단일 규칙 실행
   */
  private async executeRule(
    rule: BusinessRule,
    context: RuleExecutionContext
  ): Promise<RuleExecutionResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const transformations: Record<string, any> = {};
    const logs: string[] = [];

    try {
      // 조건 평가
      const conditionsMatch = this.evaluateConditions(rule.conditions, context.entity);

      if (!conditionsMatch) {
        return { passed: true, errors: [], warnings: [] }; // 조건 불일치 시 규칙 건너뜀
      }

      // 액션 실행
      for (const action of rule.actions) {
        const actionResult = await this.executeAction(action, context, rule);

        switch (action.type) {
          case 'validate':
            if (!actionResult.success) {
              errors.push({
                ruleId: rule.id,
                field: actionResult.field,
                value: actionResult.value,
                type: 'business',
                severity: 'error',
                message: action.errorMessage || `Business rule '${rule.name}' validation failed`,
                details: { rule: rule.name, action: action.type }
              });
            }
            break;

          case 'transform':
            if (actionResult.transformation) {
              Object.assign(transformations, actionResult.transformation);
            }
            break;

          case 'reject':
            errors.push({
              ruleId: rule.id,
              type: 'business',
              severity: 'error',
              message: action.errorMessage || `Business rule '${rule.name}' rejected the operation`,
              details: { rule: rule.name, reason: actionResult.reason }
            });
            break;

          case 'warn':
            warnings.push({
              ruleId: rule.id,
              type: 'business',
              message: action.errorMessage || `Business rule '${rule.name}' warning`,
              suggestion: actionResult.suggestion
            });
            break;

          case 'log':
            logs.push(actionResult.message || `Rule ${rule.name} executed`);
            break;
        }
      }

      return {
        passed: errors.length === 0,
        errors,
        warnings,
        transformations: Object.keys(transformations).length > 0 ? transformations : undefined,
        logs: logs.length > 0 ? logs : undefined
      };

    } catch (error) {
      console.error(`[BusinessRuleValidator] Error executing rule ${rule.id}:`, error);

      errors.push({
        ruleId: rule.id,
        type: 'business',
        severity: 'error',
        message: `Rule execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { rule: rule.name, error: String(error) }
      });

      return { passed: false, errors, warnings };
    }
  }

  /**
   * 조건 평가
   */
  private evaluateConditions(conditions: RuleCondition[], entity: UnifiedEntity): boolean {
    if (!conditions || conditions.length === 0) return true;

    let result = true;
    let currentLogic: 'AND' | 'OR' = 'AND';

    for (const condition of conditions) {
      const conditionResult = this.evaluateCondition(condition, entity);

      if (currentLogic === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }

      currentLogic = condition.logic || 'AND';
    }

    return result;
  }

  /**
   * 단일 조건 평가
   */
  private evaluateCondition(condition: RuleCondition, entity: UnifiedEntity): boolean {
    const value = this.getFieldValue(entity, condition.field);

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;

      case 'not_equals':
        return value !== condition.value;

      case 'contains':
        if (Array.isArray(value)) return value.includes(condition.value);
        if (typeof value === 'string') return value.includes(condition.value);
        return false;

      case 'greater_than':
        return typeof value === 'number' && value > condition.value;

      case 'less_than':
        return typeof value === 'number' && value < condition.value;

      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);

      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(value);

      case 'exists':
        return value !== undefined && value !== null;

      case 'not_exists':
        return value === undefined || value === null;

      default:
        console.warn(`[BusinessRuleValidator] Unknown operator: ${condition.operator}`);
        return false;
    }
  }

  /**
   * 액션 실행
   */
  private async executeAction(
    action: RuleAction,
    context: RuleExecutionContext,
    rule: BusinessRule
  ): Promise<any> {
    switch (action.type) {
      case 'validate':
        return this.executeValidateAction(action, context);

      case 'transform':
        return this.executeTransformAction(action, context);

      case 'reject':
        return this.executeRejectAction(action, context);

      case 'warn':
        return this.executeWarnAction(action, context);

      case 'log':
        return this.executeLogAction(action, context, rule);

      default:
        console.warn(`[BusinessRuleValidator] Unknown action type: ${action.type}`);
        return { success: false };
    }
  }

  /**
   * 검증 액션 실행
   */
  private executeValidateAction(action: RuleAction, context: RuleExecutionContext): any {
    const params = action.params || {};
    const entity = context.entity;

    // 커스텀 검증 로직
    if (params.customValidator && typeof params.customValidator === 'function') {
      const isValid = params.customValidator(entity, context);
      return { success: isValid, field: params.field, value: this.getFieldValue(entity, params.field) };
    }

    // 기본 검증 로직
    if (params.field && params.condition) {
      const value = this.getFieldValue(entity, params.field);
      const isValid = this.evaluateCondition(params.condition, entity);
      return { success: isValid, field: params.field, value };
    }

    return { success: true };
  }

  /**
   * 변환 액션 실행
   */
  private executeTransformAction(action: RuleAction, context: RuleExecutionContext): any {
    const params = action.params || {};
    const entity = context.entity;

    const transformation: Record<string, any> = {};

    if (params.field && params.value !== undefined) {
      transformation[params.field] = params.value;
    }

    if (params.transformFunction && typeof params.transformFunction === 'function') {
      const result = params.transformFunction(entity, context);
      Object.assign(transformation, result);
    }

    return { success: true, transformation };
  }

  /**
   * 거부 액션 실행
   */
  private executeRejectAction(action: RuleAction, context: RuleExecutionContext): any {
    const params = action.params || {};
    return {
      success: false,
      reason: params.reason || 'Operation rejected by business rule'
    };
  }

  /**
   * 경고 액션 실행
   */
  private executeWarnAction(action: RuleAction, context: RuleExecutionContext): any {
    const params = action.params || {};
    return {
      success: true,
      suggestion: params.suggestion || 'Please review this operation'
    };
  }

  /**
   * 로그 액션 실행
   */
  private executeLogAction(action: RuleAction, context: RuleExecutionContext, rule: BusinessRule): any {
    const params = action.params || {};
    const entity = context.entity;

    const message = params.template
      ? this.formatTemplate(params.template, entity)
      : `Rule '${rule.name}' executed for ${entity.type} ${entity.id}`;

    return { success: true, message };
  }

  /**
   * 적용 가능한 규칙 가져오기
   */
  private getApplicableRules(entityType: UnifiedEntityType, context: ValidationContext): BusinessRule[] {
    const entityRules = this.rulesByEntity.get(entityType) || [];

    return entityRules.filter(rule => {
      // 작업 타입 필터링
      if (rule.metadata.tags.includes(`operation:${context.operation}`)) {
        return true;
      }

      // 태그 기반 필터링
      if (rule.metadata.tags.includes('all-operations')) {
        return true;
      }

      return false;
    });
  }

  /**
   * 변환 적용
   */
  private applyTransformations(entity: UnifiedEntity, transformations: Record<string, any>): void {
    for (const [field, value] of Object.entries(transformations)) {
      this.setFieldValue(entity, field, value);
    }
  }

  /**
   * 실행 이력 저장
   */
  private saveExecutionHistory(ruleId: string, result: RuleExecutionResult): void {
    this.executionHistory.set(`${ruleId}_${Date.now()}`, result);

    // 이력 크기 제한
    if (this.executionHistory.size > this.maxHistorySize) {
      const firstKey = this.executionHistory.keys().next().value;
      this.executionHistory.delete(firstKey);
    }
  }

  /**
   * 유틸리티 메서드들
   */
  private getFieldValue(entity: any, fieldPath: string): any {
    if (!fieldPath) return undefined;
    return fieldPath.split('.').reduce((obj, key) => obj?.[key], entity);
  }

  private setFieldValue(entity: any, fieldPath: string, value: any): void {
    const keys = fieldPath.split('.');
    const lastKey = keys.pop();
    if (!lastKey) return;

    let current = entity;
    for (const key of keys) {
      if (!current[key]) current[key] = {};
      current = current[key];
    }
    current[lastKey] = value;
  }

  private formatTemplate(template: string, entity: UnifiedEntity): string {
    return template.replace(/\{([^}]+)\}/g, (match, field) => {
      const value = this.getFieldValue(entity, field);
      return value !== undefined ? String(value) : match;
    });
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
    rulesExecuted: number,
    rulesPassed: number,
    duration: number
  ): ValidationResult {
    return {
      id,
      entityId: entity.id,
      entityType: entity.type,
      status,
      timestamp: new Date(),
      duration,
      totalRules: rulesExecuted,
      passedRules: rulesPassed,
      failedRules: rulesExecuted - rulesPassed,
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
   * 기본 규칙 로드
   */
  private loadDefaultRules(): void {
    // 프로젝트 상태 전이 규칙
    this.addRule({
      id: 'project_status_transition',
      name: '프로젝트 상태 전이 검증',
      description: '프로젝트 상태가 올바른 순서로 전이되는지 검증',
      entityType: 'project',
      enabled: true,
      priority: 10,

      conditions: [
        {
          field: 'status',
          operator: 'exists',
          value: true
        }
      ],

      actions: [
        {
          type: 'validate',
          params: {
            customValidator: (entity: UnifiedEntity, context: RuleExecutionContext) => {
              if (!context.previousValue) return true;

              const prevStatus = context.previousValue.status;
              const newStatus = entity.status;

              // 허용되지 않는 상태 전이
              const invalidTransitions = [
                { from: 'completed', to: 'draft' },
                { from: 'cancelled', to: 'active' },
                { from: 'archived', to: 'active' }
              ];

              return !invalidTransitions.some(t => t.from === prevStatus && t.to === newStatus);
            }
          },
          errorMessage: '잘못된 상태 전이입니다'
        }
      ],

      metadata: {
        createdBy: 'system',
        createdAt: new Date(),
        updatedBy: 'system',
        updatedAt: new Date(),
        tags: ['all-operations', 'status', 'transition']
      }
    });

    // KPI 점수 급변 감지 규칙
    this.addRule({
      id: 'kpi_score_sudden_change',
      name: 'KPI 점수 급격한 변화 감지',
      description: 'KPI 점수가 급격하게 변화했을 때 경고',
      entityType: 'kpi',
      enabled: true,
      priority: 8,

      conditions: [
        {
          field: 'scores',
          operator: 'exists',
          value: true
        }
      ],

      actions: [
        {
          type: 'validate',
          params: {
            customValidator: (entity: UnifiedEntity, context: RuleExecutionContext) => {
              if (!context.previousValue) return true;

              const prevScores = (context.previousValue as any).scores || {};
              const newScores = (entity as any).scores || {};
              const maxChange = 30; // 최대 30점 변화 허용

              for (const axis of ['GO', 'EC', 'PT', 'PF', 'TO']) {
                const diff = Math.abs((newScores[axis] || 0) - (prevScores[axis] || 0));
                if (diff > maxChange) {
                  return false;
                }
              }

              return true;
            }
          },
          errorMessage: 'KPI 점수가 너무 급격하게 변화했습니다. 데이터를 다시 확인해주세요.'
        },
        {
          type: 'warn',
          params: {
            suggestion: 'KPI 점수 변화가 크니 원인을 파악하시기 바랍니다.'
          }
        }
      ],

      metadata: {
        createdBy: 'system',
        createdAt: new Date(),
        updatedBy: 'system',
        updatedAt: new Date(),
        tags: ['operation:update', 'kpi', 'anomaly']
      }
    });

    // 프로젝트 예산 초과 경고
    this.addRule({
      id: 'project_budget_warning',
      name: '프로젝트 예산 초과 경고',
      description: '프로젝트 진행률 대비 예산 소진율이 높을 때 경고',
      entityType: 'project',
      enabled: true,
      priority: 7,

      conditions: [
        {
          field: 'budget',
          operator: 'exists',
          value: true
        },
        {
          field: 'progress',
          operator: 'greater_than',
          value: 0
        }
      ],

      actions: [
        {
          type: 'validate',
          params: {
            customValidator: (entity: UnifiedEntity) => {
              const project = entity as any;
              const spentBudget = project.spentBudget || 0;
              const totalBudget = project.budget || 0;
              const progress = project.progress || 0;

              if (totalBudget === 0) return true;

              const budgetUsageRate = (spentBudget / totalBudget) * 100;
              const expectedUsageRate = progress * 1.1; // 10% 여유

              return budgetUsageRate <= expectedUsageRate;
            }
          }
        },
        {
          type: 'warn',
          params: {
            suggestion: '프로젝트 진행률 대비 예산 사용률이 높습니다. 예산 계획을 재검토하세요.'
          }
        },
        {
          type: 'log',
          params: {
            template: '프로젝트 {title}의 예산 사용률 체크: 진행률 {progress}%, 예산 사용 {spentBudget}/{budget}'
          }
        }
      ],

      metadata: {
        createdBy: 'system',
        createdAt: new Date(),
        updatedBy: 'system',
        updatedAt: new Date(),
        tags: ['all-operations', 'budget', 'warning']
      }
    });

    // 작업 기한 검증
    this.addRule({
      id: 'task_due_date_validation',
      name: '작업 기한 검증',
      description: '작업 기한이 프로젝트 종료일을 초과하지 않는지 검증',
      entityType: 'task',
      enabled: true,
      priority: 9,

      conditions: [
        {
          field: 'dueDate',
          operator: 'exists',
          value: true
        },
        {
          field: 'projectId',
          operator: 'exists',
          value: true
        }
      ],

      actions: [
        {
          type: 'validate',
          params: {
            customValidator: (entity: UnifiedEntity, context: RuleExecutionContext) => {
              const task = entity as any;
              const project = context.relatedEntities?.get(task.projectId);

              if (!project) return true; // 프로젝트를 찾을 수 없으면 통과

              const taskDueDate = new Date(task.dueDate);
              const projectEndDate = new Date((project as any).endDate);

              return taskDueDate <= projectEndDate;
            }
          },
          errorMessage: '작업 기한이 프로젝트 종료일을 초과할 수 없습니다'
        }
      ],

      metadata: {
        createdBy: 'system',
        createdAt: new Date(),
        updatedBy: 'system',
        updatedAt: new Date(),
        tags: ['all-operations', 'date', 'constraint']
      }
    });

    console.log(`[BusinessRuleValidator] Loaded ${this.businessRules.size} default rules`);
  }

  /**
   * 규칙 추가
   */
  addRule(rule: BusinessRule): void {
    this.businessRules.set(rule.id, rule);

    // 엔터티별 인덱싱
    const entityRules = this.rulesByEntity.get(rule.entityType) || [];
    entityRules.push(rule);
    this.rulesByEntity.set(rule.entityType, entityRules);

    console.log(`[BusinessRuleValidator] Added rule: ${rule.name} for ${rule.entityType}`);
  }

  /**
   * 규칙 제거
   */
  removeRule(ruleId: string): boolean {
    const rule = this.businessRules.get(ruleId);
    if (!rule) return false;

    this.businessRules.delete(ruleId);

    // 엔터티별 인덱스에서 제거
    const entityRules = this.rulesByEntity.get(rule.entityType);
    if (entityRules) {
      const index = entityRules.findIndex(r => r.id === ruleId);
      if (index >= 0) {
        entityRules.splice(index, 1);
      }
    }

    console.log(`[BusinessRuleValidator] Removed rule: ${rule.name}`);
    return true;
  }

  /**
   * 규칙 활성화/비활성화
   */
  toggleRule(ruleId: string, enabled: boolean): boolean {
    const rule = this.businessRules.get(ruleId);
    if (!rule) return false;

    rule.enabled = enabled;
    console.log(`[BusinessRuleValidator] Rule ${rule.name} ${enabled ? 'enabled' : 'disabled'}`);
    return true;
  }

  /**
   * 통계 조회
   */
  getStatistics() {
    const stats: Record<string, any> = {
      totalRules: this.businessRules.size,
      enabledRules: Array.from(this.businessRules.values()).filter(r => r.enabled).length,
      rulesByEntity: {}
    };

    for (const [entityType, rules] of this.rulesByEntity.entries()) {
      stats.rulesByEntity[entityType] = rules.length;
    }

    return stats;
  }

  /**
   * 실행 이력 조회
   */
  getExecutionHistory(ruleId?: string): RuleExecutionResult[] {
    if (ruleId) {
      return Array.from(this.executionHistory.entries())
        .filter(([key]) => key.startsWith(ruleId))
        .map(([, result]) => result);
    }

    return Array.from(this.executionHistory.values());
  }
}