/**
 * Data Consistency Validator
 * Phase 6: 데이터 일관성 검증 시스템
 *
 * 주요 기능:
 * - 스키마 검증
 * - 참조 무결성 체크
 * - 타임스탬프 일관성
 * - 순환 참조 감지
 * - 데이터 중복 검사
 */

import { Project } from '../types/buildup.types';
import { CalendarEvent } from '../types/calendar.types';

/**
 * 검증 규칙 타입
 */
export enum ValidationRule {
  REQUIRED_FIELDS = 'required_fields',
  REFERENCE_INTEGRITY = 'reference_integrity',
  TIMESTAMP_CONSISTENCY = 'timestamp_consistency',
  CIRCULAR_REFERENCE = 'circular_reference',
  DUPLICATE_CHECK = 'duplicate_check',
  SCHEMA_VALIDATION = 'schema_validation',
  BUSINESS_RULES = 'business_rules'
}

/**
 * 검증 심각도
 */
export enum ValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * 검증 결과
 */
export interface ValidationResult {
  rule: ValidationRule;
  severity: ValidationSeverity;
  field?: string;
  entityId?: string;
  entityType?: string;
  message: string;
  suggestion?: string;
  autoFixable: boolean;
  metadata?: Record<string, any>;
}

/**
 * 검증 보고서
 */
export interface ValidationReport {
  timestamp: number;
  duration: number;
  totalChecks: number;
  errors: ValidationResult[];
  warnings: ValidationResult[];
  info: ValidationResult[];
  score: number; // 0-100
  autoFixableCount: number;
  criticalIssues: boolean;
}

/**
 * 스키마 정의
 */
interface SchemaDefinition {
  required: string[];
  optional?: string[];
  types: Record<string, string>;
  constraints?: Record<string, any>;
}

/**
 * 일관성 검증 매니저
 */
export class ConsistencyValidator {
  private static instance: ConsistencyValidator;
  private schemas: Map<string, SchemaDefinition> = new Map();
  private references: Map<string, Set<string>> = new Map();
  private validationHistory: ValidationReport[] = [];
  private maxHistorySize = 100;

  private constructor() {
    this.initializeSchemas();
  }

  static getInstance(): ConsistencyValidator {
    if (!this.instance) {
      this.instance = new ConsistencyValidator();
    }
    return this.instance;
  }

  /**
   * 스키마 초기화
   */
  private initializeSchemas(): void {
    // Project 스키마
    this.schemas.set('project', {
      required: ['id', 'title', 'phase', 'startDate'],
      optional: ['description', 'team', 'nextMeeting', 'meetings'],
      types: {
        id: 'string',
        title: 'string',
        phase: 'string',
        startDate: 'date',
        description: 'string',
        team: 'object',
        nextMeeting: 'object',
        meetings: 'array'
      },
      constraints: {
        phase: ['contracting', 'kickoff', 'inProgress', 'closing', 'completed']
      }
    });

    // CalendarEvent 스키마
    this.schemas.set('calendar_event', {
      required: ['id', 'title', 'startDate', 'type', 'status'],
      optional: ['endDate', 'projectId', 'pmId', 'participants', 'deliverables'],
      types: {
        id: 'string',
        title: 'string',
        startDate: 'date',
        endDate: 'date',
        type: 'string',
        status: 'string',
        projectId: 'string',
        pmId: 'string',
        participants: 'array',
        deliverables: 'array'
      },
      constraints: {
        type: ['meeting', 'milestone', 'deadline', 'other'],
        status: ['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled']
      }
    });

    // Schedule 스키마
    this.schemas.set('schedule', {
      required: ['id', 'title', 'date', 'type'],
      optional: ['projectId', 'description', 'time', 'participants'],
      types: {
        id: 'string',
        title: 'string',
        date: 'date',
        type: 'string',
        projectId: 'string',
        description: 'string',
        time: 'string',
        participants: 'array'
      }
    });
  }

  /**
   * 전체 검증 실행
   */
  async validateAll(data: {
    projects?: Project[];
    events?: CalendarEvent[];
    schedules?: any[];
  }): Promise<ValidationReport> {
    const startTime = Date.now();
    const results: ValidationResult[] = [];
    let totalChecks = 0;

    // 1. 스키마 검증
    if (data.projects) {
      for (const project of data.projects) {
        const schemaResults = this.validateSchema(project, 'project');
        results.push(...schemaResults);
        totalChecks += schemaResults.length;
      }
    }

    if (data.events) {
      for (const event of data.events) {
        const schemaResults = this.validateSchema(event, 'calendar_event');
        results.push(...schemaResults);
        totalChecks += schemaResults.length;
      }
    }

    // 2. 참조 무결성 검증
    if (data.projects && data.events) {
      const refResults = this.validateReferences(data.projects, data.events);
      results.push(...refResults);
      totalChecks += refResults.length;
    }

    // 3. 타임스탬프 일관성
    if (data.events) {
      const timeResults = this.validateTimestamps(data.events);
      results.push(...timeResults);
      totalChecks += timeResults.length;
    }

    // 4. 순환 참조 검사
    if (data.projects) {
      const circularResults = this.detectCircularReferences(data.projects);
      results.push(...circularResults);
      totalChecks += circularResults.length;
    }

    // 5. 중복 검사
    const dupResults = this.detectDuplicates(data);
    results.push(...dupResults);
    totalChecks += dupResults.length;

    // 6. 비즈니스 규칙 검증
    const bizResults = this.validateBusinessRules(data);
    results.push(...bizResults);
    totalChecks += bizResults.length;

    // 보고서 생성
    const report = this.generateReport(results, totalChecks, Date.now() - startTime);

    // 히스토리 저장
    this.validationHistory.unshift(report);
    if (this.validationHistory.length > this.maxHistorySize) {
      this.validationHistory.pop();
    }

    return report;
  }

  /**
   * 스키마 검증
   */
  private validateSchema(entity: any, schemaType: string): ValidationResult[] {
    const results: ValidationResult[] = [];
    const schema = this.schemas.get(schemaType);

    if (!schema) {
      results.push({
        rule: ValidationRule.SCHEMA_VALIDATION,
        severity: ValidationSeverity.ERROR,
        message: `스키마 정의를 찾을 수 없음: ${schemaType}`,
        autoFixable: false
      });
      return results;
    }

    // 필수 필드 검사
    schema.required.forEach(field => {
      if (entity[field] === undefined || entity[field] === null) {
        results.push({
          rule: ValidationRule.REQUIRED_FIELDS,
          severity: ValidationSeverity.ERROR,
          field,
          entityId: entity.id,
          entityType: schemaType,
          message: `필수 필드 누락: ${field}`,
          suggestion: `${field} 필드를 추가하세요`,
          autoFixable: false
        });
      }
    });

    // 타입 검증
    Object.entries(schema.types).forEach(([field, expectedType]) => {
      if (entity[field] !== undefined) {
        const actualType = this.getFieldType(entity[field]);
        if (actualType !== expectedType) {
          results.push({
            rule: ValidationRule.SCHEMA_VALIDATION,
            severity: ValidationSeverity.ERROR,
            field,
            entityId: entity.id,
            entityType: schemaType,
            message: `타입 불일치: ${field} (예상: ${expectedType}, 실제: ${actualType})`,
            autoFixable: false
          });
        }
      }
    });

    // 제약조건 검증
    if (schema.constraints) {
      Object.entries(schema.constraints).forEach(([field, allowedValues]) => {
        if (entity[field] && !allowedValues.includes(entity[field])) {
          results.push({
            rule: ValidationRule.SCHEMA_VALIDATION,
            severity: ValidationSeverity.WARNING,
            field,
            entityId: entity.id,
            entityType: schemaType,
            message: `허용되지 않은 값: ${field} = ${entity[field]}`,
            suggestion: `허용된 값: ${allowedValues.join(', ')}`,
            autoFixable: true,
            metadata: { allowedValues }
          });
        }
      });
    }

    return results;
  }

  /**
   * 참조 무결성 검증
   */
  private validateReferences(
    projects: Project[],
    events: CalendarEvent[]
  ): ValidationResult[] {
    const results: ValidationResult[] = [];
    const projectIds = new Set(projects.map(p => p.id));
    const pmIds = new Set(projects.map(p => p.team?.pm?.id).filter(Boolean));

    // 이벤트의 프로젝트 참조 검증
    events.forEach(event => {
      if (event.projectId && !projectIds.has(event.projectId)) {
        results.push({
          rule: ValidationRule.REFERENCE_INTEGRITY,
          severity: ValidationSeverity.ERROR,
          field: 'projectId',
          entityId: event.id,
          entityType: 'calendar_event',
          message: `존재하지 않는 프로젝트 참조: ${event.projectId}`,
          suggestion: '유효한 프로젝트 ID로 수정하거나 참조를 제거하세요',
          autoFixable: true,
          metadata: { invalidReference: event.projectId }
        });
      }

      if (event.pmId && !pmIds.has(event.pmId)) {
        results.push({
          rule: ValidationRule.REFERENCE_INTEGRITY,
          severity: ValidationSeverity.WARNING,
          field: 'pmId',
          entityId: event.id,
          entityType: 'calendar_event',
          message: `존재하지 않는 PM 참조: ${event.pmId}`,
          autoFixable: true
        });
      }
    });

    // 참조 맵 업데이트
    projects.forEach(project => {
      if (!this.references.has(project.id)) {
        this.references.set(project.id, new Set());
      }
      events
        .filter(e => e.projectId === project.id)
        .forEach(e => this.references.get(project.id)!.add(e.id));
    });

    return results;
  }

  /**
   * 타임스탬프 일관성 검증
   */
  private validateTimestamps(events: CalendarEvent[]): ValidationResult[] {
    const results: ValidationResult[] = [];

    events.forEach(event => {
      // 시작일과 종료일 비교
      if (event.endDate && new Date(event.startDate) > new Date(event.endDate)) {
        results.push({
          rule: ValidationRule.TIMESTAMP_CONSISTENCY,
          severity: ValidationSeverity.ERROR,
          entityId: event.id,
          entityType: 'calendar_event',
          message: '시작일이 종료일보다 늦음',
          suggestion: '날짜를 올바르게 수정하세요',
          autoFixable: true,
          metadata: {
            startDate: event.startDate,
            endDate: event.endDate
          }
        });
      }

      // 완료 상태인데 완료일이 없는 경우
      if (event.status === 'completed' && !event.completedAt) {
        results.push({
          rule: ValidationRule.TIMESTAMP_CONSISTENCY,
          severity: ValidationSeverity.WARNING,
          entityId: event.id,
          entityType: 'calendar_event',
          message: '완료 상태이지만 완료일이 없음',
          suggestion: '완료일을 추가하세요',
          autoFixable: true
        });
      }

      // 미래 날짜인데 완료 상태인 경우
      if (event.status === 'completed' && new Date(event.startDate) > new Date()) {
        results.push({
          rule: ValidationRule.TIMESTAMP_CONSISTENCY,
          severity: ValidationSeverity.WARNING,
          entityId: event.id,
          entityType: 'calendar_event',
          message: '미래 이벤트가 완료 상태임',
          autoFixable: false
        });
      }
    });

    return results;
  }

  /**
   * 순환 참조 감지
   */
  private detectCircularReferences(projects: Project[]): ValidationResult[] {
    const results: ValidationResult[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (projectId: string, path: string[]): boolean => {
      visited.add(projectId);
      recursionStack.add(projectId);

      const project = projects.find(p => p.id === projectId);
      if (!project) return false;

      // 프로젝트의 의존성 체크 (예: parent project)
      const dependencies = this.getProjectDependencies(project);

      for (const depId of dependencies) {
        if (!visited.has(depId)) {
          if (dfs(depId, [...path, depId])) {
            return true;
          }
        } else if (recursionStack.has(depId)) {
          results.push({
            rule: ValidationRule.CIRCULAR_REFERENCE,
            severity: ValidationSeverity.ERROR,
            entityId: projectId,
            entityType: 'project',
            message: `순환 참조 감지: ${path.join(' -> ')} -> ${depId}`,
            autoFixable: false,
            metadata: { cycle: [...path, depId] }
          });
          return true;
        }
      }

      recursionStack.delete(projectId);
      return false;
    };

    projects.forEach(project => {
      if (!visited.has(project.id)) {
        dfs(project.id, [project.id]);
      }
    });

    return results;
  }

  /**
   * 중복 검사
   */
  private detectDuplicates(data: any): ValidationResult[] {
    const results: ValidationResult[] = [];
    const seen = new Map<string, Set<string>>();

    // 프로젝트 중복
    if (data.projects) {
      const projectTitles = new Map<string, string[]>();
      data.projects.forEach((p: Project) => {
        const key = p.title.toLowerCase();
        if (!projectTitles.has(key)) {
          projectTitles.set(key, []);
        }
        projectTitles.get(key)!.push(p.id);
      });

      projectTitles.forEach((ids, title) => {
        if (ids.length > 1) {
          results.push({
            rule: ValidationRule.DUPLICATE_CHECK,
            severity: ValidationSeverity.WARNING,
            message: `중복된 프로젝트 제목: "${title}"`,
            suggestion: '프로젝트 제목을 고유하게 변경하세요',
            autoFixable: false,
            metadata: { duplicateIds: ids }
          });
        }
      });
    }

    // 이벤트 중복 (같은 시간, 같은 참가자)
    if (data.events) {
      const eventKeys = new Map<string, string[]>();
      data.events.forEach((e: CalendarEvent) => {
        const key = `${e.startDate}-${e.pmId}`;
        if (!eventKeys.has(key)) {
          eventKeys.set(key, []);
        }
        eventKeys.get(key)!.push(e.id);
      });

      eventKeys.forEach((ids, key) => {
        if (ids.length > 1) {
          results.push({
            rule: ValidationRule.DUPLICATE_CHECK,
            severity: ValidationSeverity.INFO,
            message: `동일 시간대 중복 이벤트 가능성`,
            suggestion: '일정 충돌을 확인하세요',
            autoFixable: false,
            metadata: { conflictingIds: ids, timeSlot: key }
          });
        }
      });
    }

    return results;
  }

  /**
   * 비즈니스 규칙 검증
   */
  private validateBusinessRules(data: any): ValidationResult[] {
    const results: ValidationResult[] = [];

    // 규칙 1: 프로젝트는 최소 1명의 팀원이 필요
    if (data.projects) {
      data.projects.forEach((project: Project) => {
        if (!project.team || !project.team.members || project.team.members.length === 0) {
          results.push({
            rule: ValidationRule.BUSINESS_RULES,
            severity: ValidationSeverity.WARNING,
            entityId: project.id,
            entityType: 'project',
            message: '프로젝트에 팀원이 없습니다',
            suggestion: '최소 1명의 팀원을 추가하세요',
            autoFixable: false
          });
        }
      });
    }

    // 규칙 2: 완료된 프로젝트는 모든 이벤트가 완료되어야 함
    if (data.projects && data.events) {
      data.projects
        .filter((p: Project) => p.phase === 'completed')
        .forEach((project: Project) => {
          const projectEvents = data.events.filter(
            (e: CalendarEvent) => e.projectId === project.id
          );
          const incompleteEvents = projectEvents.filter(
            (e: CalendarEvent) => e.status !== 'completed' && e.status !== 'cancelled'
          );

          if (incompleteEvents.length > 0) {
            results.push({
              rule: ValidationRule.BUSINESS_RULES,
              severity: ValidationSeverity.ERROR,
              entityId: project.id,
              entityType: 'project',
              message: `완료된 프로젝트에 미완료 이벤트가 ${incompleteEvents.length}개 있습니다`,
              suggestion: '모든 이벤트를 완료하거나 취소하세요',
              autoFixable: true,
              metadata: { incompleteEventIds: incompleteEvents.map(e => e.id) }
            });
          }
        });
    }

    // 규칙 3: 과거 이벤트는 scheduled 상태일 수 없음
    if (data.events) {
      const now = new Date();
      data.events
        .filter((e: CalendarEvent) =>
          new Date(e.startDate) < now && e.status === 'scheduled'
        )
        .forEach((event: CalendarEvent) => {
          results.push({
            rule: ValidationRule.BUSINESS_RULES,
            severity: ValidationSeverity.WARNING,
            entityId: event.id,
            entityType: 'calendar_event',
            message: '과거 이벤트가 아직 예정됨 상태입니다',
            suggestion: '이벤트 상태를 업데이트하세요',
            autoFixable: true,
            metadata: { suggestedStatus: 'completed' }
          });
        });
    }

    return results;
  }

  /**
   * 보고서 생성
   */
  private generateReport(
    results: ValidationResult[],
    totalChecks: number,
    duration: number
  ): ValidationReport {
    const errors = results.filter(r => r.severity === ValidationSeverity.ERROR);
    const warnings = results.filter(r => r.severity === ValidationSeverity.WARNING);
    const info = results.filter(r => r.severity === ValidationSeverity.INFO);

    const autoFixableCount = results.filter(r => r.autoFixable).length;
    const criticalIssues = errors.length > 0;

    // 점수 계산 (100점 만점)
    let score = 100;
    score -= errors.length * 10;
    score -= warnings.length * 3;
    score -= info.length * 1;
    score = Math.max(0, score);

    return {
      timestamp: Date.now(),
      duration,
      totalChecks,
      errors,
      warnings,
      info,
      score,
      autoFixableCount,
      criticalIssues
    };
  }

  /**
   * 필드 타입 추론
   */
  private getFieldType(value: any): string {
    if (value === null || value === undefined) return 'null';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    if (typeof value === 'object') return 'object';
    if (!isNaN(Date.parse(value))) return 'date';
    return typeof value;
  }

  /**
   * 프로젝트 의존성 가져오기
   */
  private getProjectDependencies(project: Project): string[] {
    // 실제 구현에서는 프로젝트 간 의존성을 정의
    // 예: parent project, related projects 등
    return [];
  }

  /**
   * 자동 수정 가능한 문제 수정
   */
  async autoFix(report: ValidationReport): Promise<{
    fixed: number;
    failed: number;
    results: Array<{ issue: ValidationResult; success: boolean; error?: string }>;
  }> {
    const fixableIssues = [
      ...report.errors,
      ...report.warnings,
      ...report.info
    ].filter(r => r.autoFixable);

    const results: Array<{ issue: ValidationResult; success: boolean; error?: string }> = [];
    let fixed = 0;
    let failed = 0;

    for (const issue of fixableIssues) {
      try {
        const fixResult = await this.applyFix(issue);
        if (fixResult) {
          fixed++;
          results.push({ issue, success: true });
        } else {
          failed++;
          results.push({
            issue,
            success: false,
            error: '수정 적용 실패'
          });
        }
      } catch (error) {
        failed++;
        results.push({
          issue,
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        });
      }
    }

    return { fixed, failed, results };
  }

  /**
   * 개별 수정 적용
   */
  private async applyFix(issue: ValidationResult): Promise<boolean> {
    // 실제 구현에서는 각 문제 유형별 수정 로직 구현
    switch (issue.rule) {
      case ValidationRule.TIMESTAMP_CONSISTENCY:
        // 타임스탬프 수정 로직
        return true;

      case ValidationRule.REFERENCE_INTEGRITY:
        // 참조 수정 로직
        return true;

      case ValidationRule.BUSINESS_RULES:
        // 비즈니스 규칙 수정 로직
        return true;

      default:
        return false;
    }
  }

  /**
   * 검증 히스토리 반환
   */
  getHistory(limit?: number): ValidationReport[] {
    return limit
      ? this.validationHistory.slice(0, limit)
      : this.validationHistory;
  }

  /**
   * 특정 엔티티 검증
   */
  validateEntity(entity: any, entityType: string): ValidationResult[] {
    return this.validateSchema(entity, entityType);
  }

  /**
   * 검증 통계
   */
  getStatistics() {
    if (this.validationHistory.length === 0) {
      return {
        averageScore: 0,
        totalValidations: 0,
        criticalIssuesRate: 0,
        autoFixableRate: 0,
        commonIssues: []
      };
    }

    const totalScore = this.validationHistory.reduce((sum, r) => sum + r.score, 0);
    const totalCritical = this.validationHistory.filter(r => r.criticalIssues).length;
    const totalIssues = this.validationHistory.reduce(
      (sum, r) => sum + r.errors.length + r.warnings.length + r.info.length,
      0
    );
    const totalAutoFixable = this.validationHistory.reduce(
      (sum, r) => sum + r.autoFixableCount,
      0
    );

    // 가장 흔한 문제 유형 찾기
    const issueTypes = new Map<ValidationRule, number>();
    this.validationHistory.forEach(report => {
      [...report.errors, ...report.warnings, ...report.info].forEach(issue => {
        issueTypes.set(issue.rule, (issueTypes.get(issue.rule) || 0) + 1);
      });
    });

    const commonIssues = Array.from(issueTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([rule, count]) => ({ rule, count }));

    return {
      averageScore: totalScore / this.validationHistory.length,
      totalValidations: this.validationHistory.length,
      criticalIssuesRate: (totalCritical / this.validationHistory.length) * 100,
      autoFixableRate: totalIssues > 0 ? (totalAutoFixable / totalIssues) * 100 : 0,
      commonIssues
    };
  }

  /**
   * 초기화
   */
  reset(): void {
    this.references.clear();
    this.validationHistory = [];
  }
}

// 싱글톤 인스턴스 export
export const consistencyValidator = ConsistencyValidator.getInstance();