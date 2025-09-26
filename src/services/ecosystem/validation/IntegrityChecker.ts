/**
 * Integrity Checker
 * 데이터 무결성 검사 시스템
 */

import type {
  IntegrityCheckType,
  IntegrityCheckResult,
  IntegrityViolation,
  ValidationSeverity,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationContext
} from './types';
import type { UnifiedEntity, UnifiedEntityType } from '../pipeline/transform/types';

interface IntegrityRule {
  id: string;
  name: string;
  type: IntegrityCheckType;
  entityType: UnifiedEntityType;
  check: (entity: UnifiedEntity, allEntities: Map<string, UnifiedEntity>) => Promise<IntegrityViolation[]>;
  enabled: boolean;
}

interface RelationshipCheck {
  sourceField: string;
  targetEntity: UnifiedEntityType;
  targetField: string;
  required: boolean;
}

export class IntegrityChecker {
  private integrityRules: Map<string, IntegrityRule> = new Map();
  private entityStore: Map<string, UnifiedEntity> = new Map();
  private relationshipChecks: Map<string, RelationshipCheck[]> = new Map();
  private checkHistory: IntegrityCheckResult[] = [];
  private maxHistorySize = 100;

  constructor() {
    this.loadDefaultRules();
    this.setupRelationshipChecks();
  }

  /**
   * 무결성 검사 실행
   */
  async validate(
    entity: UnifiedEntity,
    context: ValidationContext,
    allEntities?: Map<string, UnifiedEntity>
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    const validationId = `integrity_${entity.id}_${Date.now()}`;

    console.log(`[IntegrityChecker] Checking integrity for ${entity.type} entity: ${entity.id}`);

    // 엔터티 저장소 업데이트
    if (allEntities) {
      this.entityStore = allEntities;
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const violations: IntegrityViolation[] = [];

    // 각 무결성 타입별 검사 수행
    const checkResults = await Promise.all([
      this.checkReferentialIntegrity(entity),
      this.checkEntityIntegrity(entity),
      this.checkDomainIntegrity(entity),
      this.checkUserDefinedIntegrity(entity)
    ]);

    checkResults.forEach(result => {
      violations.push(...result.violations);

      // 위반 사항을 오류/경고로 변환
      result.violations.forEach(violation => {
        if (violation.severity === 'error') {
          errors.push({
            ruleId: `integrity_${violation.type}`,
            field: violation.field,
            type: 'reference',
            severity: violation.severity,
            message: violation.description,
            details: { violationType: violation.type, suggestion: violation.fixSuggestion }
          });
        } else if (violation.severity === 'warning') {
          warnings.push({
            ruleId: `integrity_${violation.type}`,
            field: violation.field,
            type: 'integrity',
            message: violation.description,
            suggestion: violation.fixSuggestion
          });
        }
      });
    });

    const duration = Date.now() - startTime;

    // 검사 이력 저장
    this.saveCheckHistory({
      checkType: 'entity',
      passed: errors.length === 0,
      violations,
      checkedAt: new Date(),
      duration
    });

    const status = errors.length === 0 ? 'passed' : 'failed';

    console.log(`[IntegrityChecker] Integrity check ${status} for ${entity.id}: ${violations.length} violations`);

    return {
      id: validationId,
      entityId: entity.id,
      entityType: entity.type,
      status,
      timestamp: new Date(),
      duration,
      totalRules: this.integrityRules.size,
      passedRules: this.integrityRules.size - violations.length,
      failedRules: violations.length,
      skippedRules: 0,
      errors,
      warnings,
      context,
      metadata: {
        validatorVersion: '1.0.0',
        ruleSetVersion: '1.0.0',
        performanceMetrics: {
          referentialCheck: checkResults[0].duration,
          entityCheck: checkResults[1].duration,
          domainCheck: checkResults[2].duration,
          userDefinedCheck: checkResults[3].duration
        }
      }
    };
  }

  /**
   * 참조 무결성 검사
   */
  private async checkReferentialIntegrity(entity: UnifiedEntity): Promise<IntegrityCheckResult> {
    const startTime = Date.now();
    const violations: IntegrityViolation[] = [];

    const relationshipChecks = this.relationshipChecks.get(entity.type) || [];

    for (const check of relationshipChecks) {
      const referenceValue = this.getFieldValue(entity, check.sourceField);

      if (check.required && !referenceValue) {
        violations.push({
          type: 'referential',
          entityId: entity.id,
          field: check.sourceField,
          description: `필수 참조 필드 '${check.sourceField}'가 비어있습니다`,
          severity: 'error',
          fixSuggestion: `유효한 ${check.targetEntity} ID를 설정하세요`
        });
        continue;
      }

      if (referenceValue) {
        // 참조 대상 존재 확인
        const targetEntity = this.findEntityById(referenceValue, check.targetEntity);

        if (!targetEntity) {
          violations.push({
            type: 'referential',
            entityId: entity.id,
            field: check.sourceField,
            description: `참조된 ${check.targetEntity} '${referenceValue}'를 찾을 수 없습니다`,
            severity: 'error',
            fixSuggestion: `존재하는 ${check.targetEntity} ID로 변경하거나 참조를 제거하세요`
          });
        } else {
          // 순환 참조 검사
          if (this.hasCircularReference(entity, targetEntity, check.sourceField)) {
            violations.push({
              type: 'referential',
              entityId: entity.id,
              field: check.sourceField,
              description: `순환 참조가 감지되었습니다`,
              severity: 'error',
              fixSuggestion: '참조 구조를 재설계하여 순환 참조를 제거하세요'
            });
          }
        }
      }
    }

    // 역참조 검사 (삭제 시 참조되는 엔터티 확인)
    if (entity.status === 'archived' || entity.status === 'cancelled') {
      const dependents = this.findDependentEntities(entity.id, entity.type);
      if (dependents.length > 0) {
        violations.push({
          type: 'referential',
          entityId: entity.id,
          description: `${dependents.length}개의 엔터티가 이 엔터티를 참조하고 있습니다`,
          severity: 'error',
          fixSuggestion: '종속 엔터티들을 먼저 처리한 후 삭제/보관하세요'
        });
      }
    }

    return {
      checkType: 'referential',
      passed: violations.length === 0,
      violations,
      checkedAt: new Date(),
      duration: Date.now() - startTime
    };
  }

  /**
   * 엔터티 무결성 검사
   */
  private async checkEntityIntegrity(entity: UnifiedEntity): Promise<IntegrityCheckResult> {
    const startTime = Date.now();
    const violations: IntegrityViolation[] = [];

    // 기본 키 무결성
    if (!entity.id || entity.id.trim() === '') {
      violations.push({
        type: 'entity',
        entityId: entity.id,
        field: 'id',
        description: '엔터티 ID가 없거나 비어있습니다',
        severity: 'error' as ValidationSeverity,
        fixSuggestion: '유효한 고유 ID를 생성하세요'
      });
    }

    // ID 고유성 검사
    const duplicates = this.findDuplicateEntities(entity.id, entity.type);
    if (duplicates.length > 1) {
      violations.push({
        type: 'entity',
        entityId: entity.id,
        field: 'id',
        description: `중복된 엔터티 ID가 발견되었습니다 (${duplicates.length}개)`,
        severity: 'error' as ValidationSeverity,
        fixSuggestion: '각 엔터티에 고유한 ID를 할당하세요'
      });
    }

    // 필수 시스템 필드 검사
    const requiredSystemFields = ['type', 'createdAt', 'updatedAt', 'status'];
    for (const field of requiredSystemFields) {
      if (!entity[field as keyof UnifiedEntity]) {
        violations.push({
          type: 'entity',
          entityId: entity.id,
          field,
          description: `필수 시스템 필드 '${field}'가 누락되었습니다`,
          severity: 'error' as ValidationSeverity,
          fixSuggestion: `'${field}' 필드를 설정하세요`
        });
      }
    }

    // 날짜 일관성 검사
    if (entity.createdAt && entity.updatedAt) {
      const created = new Date(entity.createdAt);
      const updated = new Date(entity.updatedAt);

      if (updated < created) {
        violations.push({
          type: 'entity',
          entityId: entity.id,
          field: 'updatedAt',
          description: '수정일이 생성일보다 이전입니다',
          severity: 'warning' as ValidationSeverity,
          fixSuggestion: '날짜 필드를 올바르게 설정하세요'
        });
      }
    }

    // 버전 일관성 검사
    if (entity.version) {
      const versionPattern = /^\d+\.\d+\.\d+$/;
      if (!versionPattern.test(entity.version)) {
        violations.push({
          type: 'entity',
          entityId: entity.id,
          field: 'version',
          description: '버전 형식이 올바르지 않습니다',
          severity: 'warning' as ValidationSeverity,
          fixSuggestion: 'Semantic Versioning 형식 (x.y.z)을 사용하세요'
        });
      }
    }

    return {
      checkType: 'entity',
      passed: violations.length === 0,
      violations,
      checkedAt: new Date(),
      duration: Date.now() - startTime
    };
  }

  /**
   * 도메인 무결성 검사
   */
  private async checkDomainIntegrity(entity: UnifiedEntity): Promise<IntegrityCheckResult> {
    const startTime = Date.now();
    const violations: IntegrityViolation[] = [];

    // 엔터티 타입별 도메인 규칙 검사
    switch (entity.type) {
      case 'project':
        violations.push(...await this.checkProjectDomainIntegrity(entity));
        break;
      case 'kpi':
        violations.push(...await this.checkKPIDomainIntegrity(entity));
        break;
      case 'task':
        violations.push(...await this.checkTaskDomainIntegrity(entity));
        break;
      case 'event':
        violations.push(...await this.checkEventDomainIntegrity(entity));
        break;
    }

    // 공통 도메인 규칙
    violations.push(...this.checkCommonDomainIntegrity(entity));

    return {
      checkType: 'domain',
      passed: violations.length === 0,
      violations,
      checkedAt: new Date(),
      duration: Date.now() - startTime
    };
  }

  /**
   * 프로젝트 도메인 무결성 검사
   */
  private async checkProjectDomainIntegrity(entity: UnifiedEntity): Promise<IntegrityViolation[]> {
    const violations: IntegrityViolation[] = [];
    const project = entity as any;

    // 날짜 논리 검사
    if (project.startDate && project.endDate) {
      const start = new Date(project.startDate);
      const end = new Date(project.endDate);

      if (end <= start) {
        violations.push({
          type: 'domain',
          entityId: entity.id,
          field: 'endDate',
          description: '프로젝트 종료일이 시작일보다 이전이거나 같습니다',
          severity: 'error',
          fixSuggestion: '종료일을 시작일 이후로 설정하세요'
        });
      }
    }

    // 진행률 일관성 검사
    if (project.status === 'completed' && project.progress !== 100) {
      violations.push({
        type: 'domain',
        entityId: entity.id,
        field: 'progress',
        description: '완료된 프로젝트의 진행률이 100%가 아닙니다',
        severity: 'warning',
        fixSuggestion: '진행률을 100%로 설정하거나 상태를 변경하세요'
      });
    }

    // 예산 논리 검사
    if (project.budget && project.spentBudget) {
      if (project.spentBudget > project.budget * 1.2) { // 20% 초과
        violations.push({
          type: 'domain',
          entityId: entity.id,
          field: 'spentBudget',
          description: '사용 예산이 총 예산의 120%를 초과했습니다',
          severity: 'warning',
          fixSuggestion: '예산 계획을 재검토하세요'
        });
      }
    }

    // 팀 구성 검사
    if (project.team) {
      if (!project.team.pmId) {
        violations.push({
          type: 'domain',
          entityId: entity.id,
          field: 'team.pmId',
          description: '프로젝트 관리자가 지정되지 않았습니다',
          severity: 'error',
          fixSuggestion: '프로젝트 관리자를 지정하세요'
        });
      }
    }

    return violations;
  }

  /**
   * KPI 도메인 무결성 검사
   */
  private async checkKPIDomainIntegrity(entity: UnifiedEntity): Promise<IntegrityViolation[]> {
    const violations: IntegrityViolation[] = [];
    const kpi = entity as any;

    // KPI 점수 범위 검사
    if (kpi.scores) {
      for (const [axis, score] of Object.entries(kpi.scores)) {
        if (typeof score === 'number') {
          if (score < 0 || score > 100) {
            violations.push({
              type: 'domain',
              entityId: entity.id,
              field: `scores.${axis}`,
              description: `KPI 점수 ${axis}가 유효 범위(0-100)를 벗어났습니다`,
              severity: 'error',
              fixSuggestion: '점수를 0-100 사이로 조정하세요'
            });
          }
        }
      }
    }

    // 신뢰도 범위 검사
    if (kpi.confidence !== undefined) {
      if (kpi.confidence < 0 || kpi.confidence > 1) {
        violations.push({
          type: 'domain',
          entityId: entity.id,
          field: 'confidence',
          description: '신뢰도가 유효 범위(0-1)를 벗어났습니다',
          severity: 'error',
          fixSuggestion: '신뢰도를 0-1 사이로 조정하세요'
        });
      }
    }

    // 측정 주기 일관성 검사
    if (kpi.measurementPeriod && kpi.measuredAt) {
      const lastMeasured = new Date(kpi.measuredAt);
      const now = new Date();
      const diffHours = (now.getTime() - lastMeasured.getTime()) / (1000 * 60 * 60);

      if (kpi.measurementPeriod === 'daily' && diffHours > 48) {
        violations.push({
          type: 'domain',
          entityId: entity.id,
          field: 'measuredAt',
          description: '일일 측정 주기를 초과했습니다',
          severity: 'warning',
          fixSuggestion: '최신 측정 데이터를 업데이트하세요'
        });
      }
    }

    return violations;
  }

  /**
   * 작업 도메인 무결성 검사
   */
  private async checkTaskDomainIntegrity(entity: UnifiedEntity): Promise<IntegrityViolation[]> {
    const violations: IntegrityViolation[] = [];
    const task = entity as any;

    // 기한과 프로젝트 일정 일관성
    if (task.projectId && task.dueDate) {
      const project = this.findEntityById(task.projectId, 'project');
      if (project) {
        const projectData = project as any;
        const taskDue = new Date(task.dueDate);
        const projectEnd = new Date(projectData.endDate);

        if (taskDue > projectEnd) {
          violations.push({
            type: 'domain',
            entityId: entity.id,
            field: 'dueDate',
            description: '작업 기한이 프로젝트 종료일을 초과합니다',
            severity: 'error',
            fixSuggestion: '작업 기한을 프로젝트 일정 내로 조정하세요'
          });
        }
      }
    }

    // 상태와 진행률 일관성
    if (task.status === 'completed' && task.progressPercentage !== 100) {
      violations.push({
        type: 'domain',
        entityId: entity.id,
        field: 'progressPercentage',
        description: '완료된 작업의 진행률이 100%가 아닙니다',
        severity: 'warning',
        fixSuggestion: '진행률을 100%로 설정하세요'
      });
    }

    // 의존성 유효성
    if (task.dependencies && task.dependencies.length > 0) {
      for (const depId of task.dependencies) {
        const depTask = this.findEntityById(depId, 'task');
        if (!depTask) {
          violations.push({
            type: 'domain',
            entityId: entity.id,
            field: 'dependencies',
            description: `의존하는 작업 '${depId}'를 찾을 수 없습니다`,
            severity: 'error',
            fixSuggestion: '유효한 작업 ID로 의존성을 업데이트하세요'
          });
        }
      }
    }

    return violations;
  }

  /**
   * 이벤트 도메인 무결성 검사
   */
  private async checkEventDomainIntegrity(entity: UnifiedEntity): Promise<IntegrityViolation[]> {
    const violations: IntegrityViolation[] = [];
    const event = entity as any;

    // 시간 논리 검사
    if (event.startTime && event.endTime) {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);

      if (end <= start) {
        violations.push({
          type: 'domain',
          entityId: entity.id,
          field: 'endTime',
          description: '이벤트 종료 시간이 시작 시간보다 이전이거나 같습니다',
          severity: 'error',
          fixSuggestion: '종료 시간을 시작 시간 이후로 설정하세요'
        });
      }

      // 이벤트 기간 검사
      const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      if (durationHours > 8) {
        violations.push({
          type: 'domain',
          entityId: entity.id,
          field: 'duration',
          description: '이벤트 기간이 8시간을 초과합니다',
          severity: 'warning',
          fixSuggestion: '장시간 이벤트는 여러 세션으로 분할하는 것을 고려하세요'
        });
      }
    }

    // 참여자 유효성
    if (event.participants && event.participants.length === 0) {
      violations.push({
        type: 'domain',
        entityId: entity.id,
        field: 'participants',
        description: '이벤트에 참여자가 없습니다',
        severity: 'warning',
        fixSuggestion: '참여자를 추가하세요'
      });
    }

    return violations;
  }

  /**
   * 공통 도메인 무결성 검사
   */
  private checkCommonDomainIntegrity(entity: UnifiedEntity): IntegrityViolation[] {
    const violations: IntegrityViolation[] = [];

    // 태그 유효성
    if (entity.tags && entity.tags.length > 20) {
      violations.push({
        type: 'domain',
        entityId: entity.id,
        field: 'tags',
        description: '태그가 너무 많습니다 (최대 20개)',
        severity: 'warning',
        fixSuggestion: '중요한 태그만 유지하세요'
      });
    }

    // 설명 길이 검사
    if (entity.description && entity.description.length > 5000) {
      violations.push({
        type: 'domain',
        entityId: entity.id,
        field: 'description',
        description: '설명이 너무 깁니다 (최대 5000자)',
        severity: 'warning',
        fixSuggestion: '설명을 간결하게 정리하세요'
      });
    }

    return violations;
  }

  /**
   * 사용자 정의 무결성 검사
   */
  private async checkUserDefinedIntegrity(entity: UnifiedEntity): Promise<IntegrityCheckResult> {
    const startTime = Date.now();
    const violations: IntegrityViolation[] = [];

    // 사용자 정의 규칙 실행
    const userRules = Array.from(this.integrityRules.values())
      .filter(rule => rule.type === 'user_defined' && rule.enabled && rule.entityType === entity.type);

    for (const rule of userRules) {
      try {
        const ruleViolations = await rule.check(entity, this.entityStore);
        violations.push(...ruleViolations);
      } catch (error) {
        console.error(`[IntegrityChecker] Error executing user rule ${rule.id}:`, error);
      }
    }

    return {
      checkType: 'user_defined',
      passed: violations.length === 0,
      violations,
      checkedAt: new Date(),
      duration: Date.now() - startTime
    };
  }

  /**
   * 유틸리티 메서드들
   */
  private getFieldValue(entity: any, fieldPath: string): any {
    return fieldPath.split('.').reduce((obj, key) => obj?.[key], entity);
  }

  private findEntityById(id: string, type: UnifiedEntityType): UnifiedEntity | undefined {
    // 실제 구현에서는 데이터베이스 조회
    return Array.from(this.entityStore.values()).find(
      e => e.id === id && e.type === type
    );
  }

  private findDuplicateEntities(id: string, type: UnifiedEntityType): UnifiedEntity[] {
    return Array.from(this.entityStore.values()).filter(
      e => e.id === id && e.type === type
    );
  }

  private findDependentEntities(entityId: string, entityType: UnifiedEntityType): UnifiedEntity[] {
    const dependents: UnifiedEntity[] = [];

    for (const entity of this.entityStore.values()) {
      // 프로젝트 참조 확인
      if (entityType === 'project' && (entity as any).projectId === entityId) {
        dependents.push(entity);
      }

      // 작업 의존성 확인
      if (entityType === 'task') {
        const dependencies = (entity as any).dependencies || [];
        if (dependencies.includes(entityId)) {
          dependents.push(entity);
        }
      }
    }

    return dependents;
  }

  private hasCircularReference(entity: UnifiedEntity, targetEntity: UnifiedEntity, field: string): boolean {
    // 간단한 순환 참조 검사 (실제로는 더 복잡한 그래프 탐색 필요)
    const targetRef = this.getFieldValue(targetEntity, field);
    return targetRef === entity.id;
  }

  /**
   * 검사 이력 저장
   */
  private saveCheckHistory(result: IntegrityCheckResult): void {
    this.checkHistory.push(result);

    if (this.checkHistory.length > this.maxHistorySize) {
      this.checkHistory.shift();
    }
  }

  /**
   * 기본 규칙 로드
   */
  private loadDefaultRules(): void {
    // 커스텀 무결성 규칙 예시
    this.addRule({
      id: 'cross_entity_consistency',
      name: '엔터티 간 일관성 검사',
      type: 'user_defined',
      entityType: 'project',
      enabled: true,
      check: async (entity, allEntities) => {
        const violations: IntegrityViolation[] = [];
        const project = entity as any;

        // 프로젝트와 관련 작업들의 상태 일관성 검사
        const relatedTasks = Array.from(allEntities.values()).filter(
          e => e.type === 'task' && (e as any).projectId === project.id
        );

        if (project.status === 'completed') {
          const incompleteTasks = relatedTasks.filter(t => (t as any).status !== 'completed');
          if (incompleteTasks.length > 0) {
            violations.push({
              type: 'user_defined',
              entityId: entity.id,
              description: `완료된 프로젝트에 ${incompleteTasks.length}개의 미완료 작업이 있습니다`,
              severity: 'warning',
              fixSuggestion: '모든 작업을 완료하거나 프로젝트 상태를 재검토하세요'
            });
          }
        }

        return violations;
      }
    });

    console.log(`[IntegrityChecker] Loaded ${this.integrityRules.size} integrity rules`);
  }

  /**
   * 관계 검사 설정
   */
  private setupRelationshipChecks(): void {
    // 프로젝트 관계
    this.relationshipChecks.set('task', [
      {
        sourceField: 'projectId',
        targetEntity: 'project',
        targetField: 'id',
        required: true
      },
      {
        sourceField: 'assigneeId',
        targetEntity: 'resource',
        targetField: 'id',
        required: true
      }
    ]);

    // 이벤트 관계
    this.relationshipChecks.set('event', [
      {
        sourceField: 'projectId',
        targetEntity: 'project',
        targetField: 'id',
        required: false
      }
    ]);

    console.log('[IntegrityChecker] Relationship checks configured');
  }

  /**
   * 규칙 추가
   */
  addRule(rule: IntegrityRule): void {
    this.integrityRules.set(rule.id, rule);
    console.log(`[IntegrityChecker] Added rule: ${rule.name}`);
  }

  /**
   * 통계 조회
   */
  getStatistics() {
    return {
      totalRules: this.integrityRules.size,
      entityCount: this.entityStore.size,
      checkHistorySize: this.checkHistory.length,
      lastCheck: this.checkHistory[this.checkHistory.length - 1]?.checkedAt
    };
  }

  /**
   * 검사 이력 조회
   */
  getCheckHistory(): IntegrityCheckResult[] {
    return [...this.checkHistory];
  }
}