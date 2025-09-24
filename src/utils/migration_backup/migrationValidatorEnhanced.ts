/**
 * @fileoverview 강화된 마이그레이션 검증 시스템
 * @description Sprint 3 - Stage 3: 검증 체인 및 자동 규칙 엔진
 * @author PocketCompany
 * @since 2025-01-23
 */

import type { Project, Meeting } from '../types/buildup.types';
import type { MigrationResult } from './dataMigration';
import { migrationMonitor } from './migrationMonitor';

/**
 * 검증 레벨
 */
export enum ValidationLevel {
  CRITICAL = 'critical',  // 실패 시 중단
  WARNING = 'warning',    // 경고만 표시
  INFO = 'info'          // 정보 제공
}

/**
 * 검증 타입
 */
export enum ValidationType {
  PRE_MIGRATION = 'pre_migration',
  POST_MIGRATION = 'post_migration',
  DATA_INTEGRITY = 'data_integrity',
  DEPENDENCY = 'dependency',
  BUSINESS_RULE = 'business_rule',
  PERFORMANCE = 'performance'
}

/**
 * 검증 규칙
 */
export interface ValidationRule {
  id: string;
  name: string;
  type: ValidationType;
  level: ValidationLevel;
  enabled: boolean;
  validate: (data: any) => ValidationRuleResult | Promise<ValidationRuleResult>;
  description?: string;
  metadata?: any;
}

/**
 * 검증 규칙 결과
 */
export interface ValidationRuleResult {
  ruleId: string;
  passed: boolean;
  level: ValidationLevel;
  message?: string;
  details?: any;
  suggestions?: string[];
}

/**
 * 검증 체인
 */
export interface ValidationChain {
  id: string;
  name: string;
  rules: ValidationRule[];
  stopOnFirstFailure: boolean;
  parallel: boolean;
}

/**
 * 검증 결과
 */
export interface ValidationResult {
  chainId?: string;
  timestamp: Date;
  passed: boolean;
  totalRules: number;
  passedRules: number;
  failedRules: number;
  warningCount: number;
  criticalCount: number;
  ruleResults: ValidationRuleResult[];
  duration: number;
  summary?: string;
}

/**
 * 검증 통계
 */
export interface ValidationStatistics {
  totalValidations: number;
  successRate: number;
  averageDuration: number;
  commonFailures: Map<string, number>;
  rulePerformance: Map<string, number>;
}

/**
 * 강화된 검증 관리자
 */
export class EnhancedMigrationValidator {
  private static instance: EnhancedMigrationValidator | null = null;

  private rules: Map<string, ValidationRule> = new Map();
  private chains: Map<string, ValidationChain> = new Map();
  private validationHistory: ValidationResult[] = [];
  private statistics: ValidationStatistics;

  private constructor() {
    this.statistics = {
      totalValidations: 0,
      successRate: 0,
      averageDuration: 0,
      commonFailures: new Map(),
      rulePerformance: new Map()
    };

    this.setupBuiltInRules();
    this.setupBuiltInChains();
  }

  /**
   * 싱글톤 인스턴스
   */
  public static getInstance(): EnhancedMigrationValidator {
    if (!EnhancedMigrationValidator.instance) {
      EnhancedMigrationValidator.instance = new EnhancedMigrationValidator();
    }
    return EnhancedMigrationValidator.instance;
  }

  /**
   * 내장 규칙 설정
   */
  private setupBuiltInRules(): void {
    // Pre-migration 규칙들
    this.addRule({
      id: 'pre_data_exists',
      name: 'Data Existence Check',
      type: ValidationType.PRE_MIGRATION,
      level: ValidationLevel.CRITICAL,
      enabled: true,
      description: 'Check if data exists for migration',
      validate: (data: { projects?: Project[]; meetings?: Meeting[] }) => {
        const hasProjects = data.projects && data.projects.length > 0;
        const hasMeetings = data.meetings && data.meetings.length > 0;

        return {
          ruleId: 'pre_data_exists',
          passed: hasProjects || hasMeetings,
          level: ValidationLevel.CRITICAL,
          message: hasProjects || hasMeetings
            ? 'Data exists for migration'
            : 'No data available for migration',
          details: {
            projectCount: data.projects?.length || 0,
            meetingCount: data.meetings?.length || 0
          }
        };
      }
    });

    this.addRule({
      id: 'pre_project_validity',
      name: 'Project Validity Check',
      type: ValidationType.PRE_MIGRATION,
      level: ValidationLevel.WARNING,
      enabled: true,
      description: 'Validate project data integrity',
      validate: (data: { projects?: Project[] }) => {
        if (!data.projects) {
          return {
            ruleId: 'pre_project_validity',
            passed: true,
            level: ValidationLevel.WARNING,
            message: 'No projects to validate'
          };
        }

        const invalidProjects = data.projects.filter(p =>
          !p.id || p.id === 'unknown' || !p.name
        );

        return {
          ruleId: 'pre_project_validity',
          passed: invalidProjects.length === 0,
          level: ValidationLevel.WARNING,
          message: invalidProjects.length === 0
            ? 'All projects are valid'
            : `Found ${invalidProjects.length} invalid projects`,
          details: {
            invalidProjects: invalidProjects.map(p => ({ id: p.id, name: p.name }))
          },
          suggestions: invalidProjects.length > 0
            ? ['Fix invalid project IDs', 'Ensure all projects have names']
            : undefined
        };
      }
    });

    this.addRule({
      id: 'pre_no_duplicates',
      name: 'Duplicate Detection',
      type: ValidationType.PRE_MIGRATION,
      level: ValidationLevel.WARNING,
      enabled: true,
      description: 'Check for duplicate entries',
      validate: (data: { meetings?: Meeting[] }) => {
        if (!data.meetings || data.meetings.length === 0) {
          return {
            ruleId: 'pre_no_duplicates',
            passed: true,
            level: ValidationLevel.WARNING,
            message: 'No meetings to check for duplicates'
          };
        }

        const idMap = new Map<string, number>();
        data.meetings.forEach(m => {
          const count = idMap.get(m.id) || 0;
          idMap.set(m.id, count + 1);
        });

        const duplicates = Array.from(idMap.entries()).filter(([_, count]) => count > 1);

        return {
          ruleId: 'pre_no_duplicates',
          passed: duplicates.length === 0,
          level: ValidationLevel.WARNING,
          message: duplicates.length === 0
            ? 'No duplicate meetings found'
            : `Found ${duplicates.length} duplicate meeting IDs`,
          details: {
            duplicateIds: duplicates.map(([id, count]) => ({ id, count }))
          },
          suggestions: duplicates.length > 0
            ? ['Remove duplicate entries', 'Regenerate unique IDs']
            : undefined
        };
      }
    });

    // Post-migration 규칙들
    this.addRule({
      id: 'post_data_consistency',
      name: 'Data Consistency Check',
      type: ValidationType.POST_MIGRATION,
      level: ValidationLevel.CRITICAL,
      enabled: true,
      description: 'Verify data consistency after migration',
      validate: (data: { result?: MigrationResult; original?: any }) => {
        if (!data.result) {
          return {
            ruleId: 'post_data_consistency',
            passed: false,
            level: ValidationLevel.CRITICAL,
            message: 'No migration result to validate'
          };
        }

        const consistent = data.result.success && data.result.errors.length === 0;

        return {
          ruleId: 'post_data_consistency',
          passed: consistent,
          level: ValidationLevel.CRITICAL,
          message: consistent
            ? 'Data is consistent after migration'
            : 'Data inconsistency detected',
          details: {
            migrated: data.result.migrated,
            errors: data.result.errors.length,
            conflicts: data.result.conflicts.length
          }
        };
      }
    });

    this.addRule({
      id: 'post_no_data_loss',
      name: 'Data Loss Detection',
      type: ValidationType.POST_MIGRATION,
      level: ValidationLevel.CRITICAL,
      enabled: true,
      description: 'Ensure no data was lost during migration',
      validate: (data: { before: number; after: number }) => {
        const dataLoss = data.before > data.after;
        const lossPercentage = dataLoss
          ? ((data.before - data.after) / data.before) * 100
          : 0;

        return {
          ruleId: 'post_no_data_loss',
          passed: !dataLoss,
          level: ValidationLevel.CRITICAL,
          message: dataLoss
            ? `Data loss detected: ${lossPercentage.toFixed(1)}% lost`
            : 'No data loss detected',
          details: {
            before: data.before,
            after: data.after,
            difference: data.after - data.before,
            lossPercentage
          },
          suggestions: dataLoss
            ? ['Investigate missing items', 'Check migration filters', 'Review error logs']
            : undefined
        };
      }
    });

    // Performance 규칙
    this.addRule({
      id: 'perf_migration_speed',
      name: 'Migration Speed Check',
      type: ValidationType.PERFORMANCE,
      level: ValidationLevel.INFO,
      enabled: true,
      description: 'Monitor migration performance',
      validate: (data: { itemsPerSecond: number; threshold: number }) => {
        const isSlow = data.itemsPerSecond < data.threshold;

        return {
          ruleId: 'perf_migration_speed',
          passed: !isSlow,
          level: ValidationLevel.INFO,
          message: isSlow
            ? `Migration is slow: ${data.itemsPerSecond.toFixed(2)} items/sec`
            : `Migration speed is good: ${data.itemsPerSecond.toFixed(2)} items/sec`,
          details: {
            currentSpeed: data.itemsPerSecond,
            threshold: data.threshold
          },
          suggestions: isSlow
            ? ['Consider batch size optimization', 'Check system resources', 'Review data complexity']
            : undefined
        };
      }
    });
  }

  /**
   * 내장 체인 설정
   */
  private setupBuiltInChains(): void {
    // Pre-migration 체인
    this.addChain({
      id: 'pre_migration_chain',
      name: 'Pre-Migration Validation',
      rules: [
        this.rules.get('pre_data_exists')!,
        this.rules.get('pre_project_validity')!,
        this.rules.get('pre_no_duplicates')!
      ],
      stopOnFirstFailure: true,
      parallel: false
    });

    // Post-migration 체인
    this.addChain({
      id: 'post_migration_chain',
      name: 'Post-Migration Validation',
      rules: [
        this.rules.get('post_data_consistency')!,
        this.rules.get('post_no_data_loss')!
      ],
      stopOnFirstFailure: false,
      parallel: true
    });

    // Full validation 체인
    this.addChain({
      id: 'full_validation_chain',
      name: 'Complete Validation',
      rules: Array.from(this.rules.values()),
      stopOnFirstFailure: false,
      parallel: false
    });
  }

  /**
   * 규칙 추가
   */
  public addRule(rule: ValidationRule): void {
    this.rules.set(rule.id, rule);
    console.log(`📏 Added validation rule: ${rule.name}`);
  }

  /**
   * 체인 추가
   */
  public addChain(chain: ValidationChain): void {
    this.chains.set(chain.id, chain);
    console.log(`🔗 Added validation chain: ${chain.name}`);
  }

  /**
   * 단일 규칙 실행
   */
  public async validateRule(ruleId: string, data: any): Promise<ValidationRuleResult | null> {
    const rule = this.rules.get(ruleId);
    if (!rule || !rule.enabled) {
      return null;
    }

    const startTime = Date.now();

    try {
      const result = await rule.validate(data);

      // 성능 기록
      const duration = Date.now() - startTime;
      const currentPerf = this.statistics.rulePerformance.get(ruleId) || 0;
      this.statistics.rulePerformance.set(ruleId, (currentPerf + duration) / 2);

      // 실패 기록
      if (!result.passed && result.level === ValidationLevel.CRITICAL) {
        const failCount = this.statistics.commonFailures.get(ruleId) || 0;
        this.statistics.commonFailures.set(ruleId, failCount + 1);
      }

      return result;

    } catch (error) {
      console.error(`❌ Validation rule ${ruleId} failed:`, error);
      return {
        ruleId,
        passed: false,
        level: ValidationLevel.CRITICAL,
        message: `Validation error: ${error.message}`,
        details: { error: error.toString() }
      };
    }
  }

  /**
   * 체인 실행
   */
  public async validateChain(chainId: string, data: any): Promise<ValidationResult> {
    const chain = this.chains.get(chainId);
    if (!chain) {
      throw new Error(`Validation chain not found: ${chainId}`);
    }

    const startTime = Date.now();
    const results: ValidationRuleResult[] = [];
    let passed = true;
    let criticalCount = 0;
    let warningCount = 0;

    console.log(`🔗 Running validation chain: ${chain.name}`);
    migrationMonitor.updatePhase(`Validation: ${chain.name}`);

    if (chain.parallel) {
      // 병렬 실행
      const promises = chain.rules
        .filter(rule => rule.enabled)
        .map(rule => this.validateRule(rule.id, data));

      const parallelResults = await Promise.all(promises);
      parallelResults.forEach(result => {
        if (result) {
          results.push(result);
          if (!result.passed) {
            if (result.level === ValidationLevel.CRITICAL) {
              passed = false;
              criticalCount++;
            } else if (result.level === ValidationLevel.WARNING) {
              warningCount++;
            }
          }
        }
      });

    } else {
      // 순차 실행
      for (const rule of chain.rules) {
        if (!rule.enabled) continue;

        const result = await this.validateRule(rule.id, data);
        if (result) {
          results.push(result);

          if (!result.passed) {
            if (result.level === ValidationLevel.CRITICAL) {
              passed = false;
              criticalCount++;

              if (chain.stopOnFirstFailure) {
                console.log(`⛔ Stopping chain due to critical failure: ${result.message}`);
                break;
              }
            } else if (result.level === ValidationLevel.WARNING) {
              warningCount++;
            }
          }
        }
      }
    }

    const duration = Date.now() - startTime;
    const passedRules = results.filter(r => r.passed).length;

    const validationResult: ValidationResult = {
      chainId,
      timestamp: new Date(),
      passed,
      totalRules: results.length,
      passedRules,
      failedRules: results.length - passedRules,
      warningCount,
      criticalCount,
      ruleResults: results,
      duration,
      summary: `${passedRules}/${results.length} rules passed${
        criticalCount > 0 ? `, ${criticalCount} critical failures` : ''
      }${warningCount > 0 ? `, ${warningCount} warnings` : ''}`
    };

    // 이력 및 통계 업데이트
    this.recordValidation(validationResult);

    return validationResult;
  }

  /**
   * Pre-migration 검증
   */
  public async validatePreMigration(data: any): Promise<ValidationResult> {
    return this.validateChain('pre_migration_chain', data);
  }

  /**
   * Post-migration 검증
   */
  public async validatePostMigration(data: any): Promise<ValidationResult> {
    return this.validateChain('post_migration_chain', data);
  }

  /**
   * 전체 검증
   */
  public async validateAll(data: any): Promise<ValidationResult> {
    return this.validateChain('full_validation_chain', data);
  }

  /**
   * 검증 기록
   */
  private recordValidation(result: ValidationResult): void {
    this.validationHistory.push(result);

    // 이력 크기 제한
    if (this.validationHistory.length > 100) {
      this.validationHistory = this.validationHistory.slice(-50);
    }

    // 통계 업데이트
    this.statistics.totalValidations++;

    const successCount = this.validationHistory.filter(v => v.passed).length;
    this.statistics.successRate = (successCount / this.validationHistory.length) * 100;

    const totalDuration = this.validationHistory.reduce((sum, v) => sum + v.duration, 0);
    this.statistics.averageDuration = totalDuration / this.validationHistory.length;
  }

  /**
   * 검증 이력 조회
   */
  public getValidationHistory(limit?: number): ValidationResult[] {
    if (limit) {
      return this.validationHistory.slice(-limit);
    }
    return [...this.validationHistory];
  }

  /**
   * 통계 조회
   */
  public getStatistics(): ValidationStatistics {
    return {
      ...this.statistics,
      commonFailures: new Map(this.statistics.commonFailures),
      rulePerformance: new Map(this.statistics.rulePerformance)
    };
  }

  /**
   * 규칙 활성화/비활성화
   */
  public setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      console.log(`📏 Rule ${ruleId} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * 시뮬레이션 실행
   */
  public async simulate(data: any): Promise<{
    wouldPass: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const result = await this.validateAll(data);

    const issues: string[] = [];
    const recommendations: Set<string> = new Set();

    result.ruleResults.forEach(ruleResult => {
      if (!ruleResult.passed) {
        issues.push(ruleResult.message || `Rule ${ruleResult.ruleId} failed`);
        if (ruleResult.suggestions) {
          ruleResult.suggestions.forEach(s => recommendations.add(s));
        }
      }
    });

    return {
      wouldPass: result.passed,
      issues,
      recommendations: Array.from(recommendations)
    };
  }

  /**
   * 초기화
   */
  public reset(): void {
    this.validationHistory = [];
    this.statistics = {
      totalValidations: 0,
      successRate: 0,
      averageDuration: 0,
      commonFailures: new Map(),
      rulePerformance: new Map()
    };
    console.log('🔄 Validator reset');
  }
}

// 싱글톤 인스턴스
export const enhancedValidator = EnhancedMigrationValidator.getInstance();