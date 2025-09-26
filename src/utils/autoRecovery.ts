/**
 * Auto Recovery System
 * Phase 6: 자동 복구 시스템
 *
 * 주요 기능:
 * - 불일치 자동 감지
 * - 우선순위 기반 복구
 * - 사용자 확인 UI
 * - 복구 히스토리 관리
 * - 복구 전략 선택
 */

import {
  consistencyValidator,
  ValidationReport,
  ValidationResult,
  ValidationSeverity,
  ValidationRule
} from './consistencyValidator';
import { optimisticUpdateManager } from './optimisticUpdate';
import { syncTransactionManager } from './syncTransaction';
import type { SyncOperation } from './syncTransaction';

/**
 * 복구 전략
 */
export enum RecoveryStrategy {
  SOFT = 'soft',           // 데이터 병합
  HARD = 'hard',           // 마스터 데이터로 덮어쓰기
  MANUAL = 'manual',       // 사용자 선택
  SMART = 'smart',         // AI 기반 지능형 복구
  ROLLBACK = 'rollback'    // 이전 상태로 롤백
}

/**
 * 복구 우선순위
 */
export enum RecoveryPriority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  CRITICAL = 3
}

/**
 * 복구 작업
 */
export interface RecoveryTask {
  id: string;
  issue: ValidationResult;
  strategy: RecoveryStrategy;
  priority: RecoveryPriority;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  attempts: number;
  maxAttempts: number;
  timestamp: number;
  completedAt?: number;
  error?: string;
  changes?: any;
  rollbackData?: any;
}

/**
 * 복구 계획
 */
export interface RecoveryPlan {
  id: string;
  report: ValidationReport;
  tasks: RecoveryTask[];
  strategy: RecoveryStrategy;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  statistics: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    skippedTasks: number;
    successRate: number;
  };
}

/**
 * 복구 옵션
 */
export interface RecoveryOptions {
  strategy?: RecoveryStrategy;
  requireConfirmation?: boolean;
  maxAttempts?: number;
  priorityThreshold?: RecoveryPriority;
  dryRun?: boolean;
  preserveUserChanges?: boolean;
}

/**
 * 자동 복구 매니저
 */
export class AutoRecoveryManager {
  private static instance: AutoRecoveryManager;
  private currentPlan: RecoveryPlan | null = null;
  private plans: Map<string, RecoveryPlan> = new Map();
  private snapshots: Map<string, any> = new Map();
  private listeners: Map<string, Set<Function>> = new Map();
  private maxHistorySize = 50;

  private options: Required<RecoveryOptions> = {
    strategy: RecoveryStrategy.SMART,
    requireConfirmation: true,
    maxAttempts: 3,
    priorityThreshold: RecoveryPriority.LOW,
    dryRun: false,
    preserveUserChanges: true
  };

  private constructor() {}

  static getInstance(): AutoRecoveryManager {
    if (!this.instance) {
      this.instance = new AutoRecoveryManager();
    }
    return this.instance;
  }

  /**
   * 옵션 설정
   */
  configure(options: RecoveryOptions): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * 복구 계획 생성
   */
  async createRecoveryPlan(
    report: ValidationReport,
    options?: RecoveryOptions
  ): Promise<RecoveryPlan> {
    const mergedOptions = { ...this.options, ...options };

    // 복구 가능한 문제 필터링
    const fixableIssues = [
      ...report.errors,
      ...report.warnings,
      ...report.info
    ].filter(issue => {
      const priority = this.calculatePriority(issue);
      return issue.autoFixable && priority >= mergedOptions.priorityThreshold;
    });

    // 복구 작업 생성
    const tasks = fixableIssues.map(issue => this.createRecoveryTask(issue, mergedOptions));

    // 우선순위 정렬
    tasks.sort((a, b) => b.priority - a.priority);

    // 계획 생성
    const plan: RecoveryPlan = {
      id: `recovery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      report,
      tasks,
      strategy: mergedOptions.strategy,
      createdAt: Date.now(),
      status: 'pending',
      statistics: {
        totalTasks: tasks.length,
        completedTasks: 0,
        failedTasks: 0,
        skippedTasks: 0,
        successRate: 0
      }
    };

    this.plans.set(plan.id, plan);

    // 이벤트 발생
    this.emit('plan:created', plan);

    return plan;
  }

  /**
   * 복구 작업 생성
   */
  private createRecoveryTask(
    issue: ValidationResult,
    options: Required<RecoveryOptions>
  ): RecoveryTask {
    return {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      issue,
      strategy: this.selectStrategy(issue, options.strategy),
      priority: this.calculatePriority(issue),
      status: 'pending',
      attempts: 0,
      maxAttempts: options.maxAttempts,
      timestamp: Date.now()
    };
  }

  /**
   * 전략 선택
   */
  private selectStrategy(issue: ValidationResult, defaultStrategy: RecoveryStrategy): RecoveryStrategy {
    // Smart 전략인 경우 문제 유형별 최적 전략 선택
    if (defaultStrategy === RecoveryStrategy.SMART) {
      switch (issue.rule) {
        case ValidationRule.TIMESTAMP_CONSISTENCY:
          return RecoveryStrategy.SOFT; // 타임스탬프는 병합
        case ValidationRule.REFERENCE_INTEGRITY:
          return RecoveryStrategy.HARD; // 참조는 강제 수정
        case ValidationRule.DUPLICATE_CHECK:
          return RecoveryStrategy.MANUAL; // 중복은 사용자 확인
        case ValidationRule.BUSINESS_RULES:
          return RecoveryStrategy.SOFT; // 비즈니스 규칙은 유연하게
        default:
          return RecoveryStrategy.SOFT;
      }
    }
    return defaultStrategy;
  }

  /**
   * 우선순위 계산
   */
  private calculatePriority(issue: ValidationResult): RecoveryPriority {
    if (issue.severity === ValidationSeverity.ERROR) {
      if (issue.rule === ValidationRule.REFERENCE_INTEGRITY ||
          issue.rule === ValidationRule.CIRCULAR_REFERENCE) {
        return RecoveryPriority.CRITICAL;
      }
      return RecoveryPriority.HIGH;
    } else if (issue.severity === ValidationSeverity.WARNING) {
      return RecoveryPriority.MEDIUM;
    }
    return RecoveryPriority.LOW;
  }

  /**
   * 복구 계획 실행
   */
  async executeRecoveryPlan(
    planId: string,
    options?: { dryRun?: boolean; confirmationCallback?: (task: RecoveryTask) => Promise<boolean> }
  ): Promise<RecoveryPlan> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`복구 계획을 찾을 수 없음: ${planId}`);
    }

    if (this.currentPlan) {
      throw new Error('이미 복구가 진행 중입니다');
    }

    this.currentPlan = plan;
    plan.status = 'executing';
    plan.startedAt = Date.now();

    // 스냅샷 생성
    if (!options?.dryRun) {
      await this.createSnapshot(plan.id);
    }

    this.emit('recovery:started', plan);

    try {
      // 작업 실행
      for (const task of plan.tasks) {
        if (plan.status === 'cancelled') {
          task.status = 'skipped';
          plan.statistics.skippedTasks++;
          continue;
        }

        // 사용자 확인
        if (this.options.requireConfirmation && options?.confirmationCallback) {
          const confirmed = await options.confirmationCallback(task);
          if (!confirmed) {
            task.status = 'skipped';
            plan.statistics.skippedTasks++;
            this.emit('task:skipped', task);
            continue;
          }
        }

        // 작업 실행
        const success = await this.executeTask(task, options?.dryRun || false);

        if (success) {
          task.status = 'completed';
          task.completedAt = Date.now();
          plan.statistics.completedTasks++;
          this.emit('task:completed', task);
        } else {
          task.status = 'failed';
          plan.statistics.failedTasks++;
          this.emit('task:failed', task);
        }

        // 통계 업데이트
        this.updateStatistics(plan);
      }

      // 완료
      plan.status = 'completed';
      plan.completedAt = Date.now();
      this.emit('recovery:completed', plan);

    } catch (error) {
      plan.status = 'failed';
      this.emit('recovery:failed', { plan, error });

      // 롤백
      if (!options?.dryRun) {
        await this.rollback(plan.id);
      }

      throw error;
    } finally {
      this.currentPlan = null;
    }

    return plan;
  }

  /**
   * 개별 작업 실행
   */
  private async executeTask(task: RecoveryTask, dryRun: boolean): Promise<boolean> {
    task.status = 'in_progress';
    this.emit('task:started', task);

    while (task.attempts < task.maxAttempts) {
      task.attempts++;

      try {
        // Dry run 모드에서는 실제 변경 없이 성공 반환
        if (dryRun) {
          console.log(`[DRY RUN] 작업 실행: ${task.id}`, task.issue);
          return true;
        }

        // 전략별 실행
        const result = await this.applyRecoveryStrategy(task);

        if (result.success) {
          task.changes = result.changes;
          return true;
        }

        task.error = result.error;
      } catch (error) {
        task.error = error instanceof Error ? error.message : '알 수 없는 오류';
      }

      // 재시도 지연
      if (task.attempts < task.maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000 * task.attempts));
      }
    }

    return false;
  }

  /**
   * 복구 전략 적용
   */
  private async applyRecoveryStrategy(
    task: RecoveryTask
  ): Promise<{ success: boolean; changes?: any; error?: string }> {
    const { issue, strategy } = task;

    try {
      switch (strategy) {
        case RecoveryStrategy.SOFT:
          return await this.applySoftRecovery(issue);

        case RecoveryStrategy.HARD:
          return await this.applyHardRecovery(issue);

        case RecoveryStrategy.ROLLBACK:
          return await this.applyRollbackRecovery(issue);

        case RecoveryStrategy.MANUAL:
          // 사용자 개입 필요
          return {
            success: false,
            error: '수동 복구가 필요합니다'
          };

        case RecoveryStrategy.SMART:
          return await this.applySmartRecovery(issue);

        default:
          return {
            success: false,
            error: `지원하지 않는 전략: ${strategy}`
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '복구 실패'
      };
    }
  }

  /**
   * Soft 복구 (데이터 병합)
   */
  private async applySoftRecovery(issue: ValidationResult): Promise<any> {
    // 데이터 병합 로직
    const operations: SyncOperation[] = [];

    switch (issue.rule) {
      case ValidationRule.TIMESTAMP_CONSISTENCY:
        // 타임스탬프 자동 조정
        if (issue.metadata?.startDate && issue.metadata?.endDate) {
          operations.push({
            id: `fix-timestamp-${issue.entityId}`,
            type: 'update',
            target: issue.entityType || 'unknown',
            data: {
              id: issue.entityId,
              endDate: new Date(issue.metadata.startDate).toISOString()
            },
            priority: 2
          });
        }
        break;

      case ValidationRule.BUSINESS_RULES:
        // 비즈니스 규칙 조정
        if (issue.metadata?.suggestedStatus) {
          operations.push({
            id: `fix-status-${issue.entityId}`,
            type: 'update',
            target: issue.entityType || 'unknown',
            data: {
              id: issue.entityId,
              status: issue.metadata.suggestedStatus
            },
            priority: 1
          });
        }
        break;
    }

    if (operations.length > 0) {
      await syncTransactionManager.executeTransaction(operations);
      return { success: true, changes: operations };
    }

    return { success: false, error: 'Soft 복구 적용 불가' };
  }

  /**
   * Hard 복구 (덮어쓰기)
   */
  private async applyHardRecovery(issue: ValidationResult): Promise<any> {
    // 강제 덮어쓰기 로직
    const operations: SyncOperation[] = [];

    switch (issue.rule) {
      case ValidationRule.REFERENCE_INTEGRITY:
        // 잘못된 참조 제거
        if (issue.metadata?.invalidReference) {
          operations.push({
            id: `remove-reference-${issue.entityId}`,
            type: 'update',
            target: issue.entityType || 'unknown',
            data: {
              id: issue.entityId,
              [issue.field || 'reference']: null
            },
            priority: 3
          });
        }
        break;

      case ValidationRule.DUPLICATE_CHECK:
        // 중복 제거
        if (issue.metadata?.duplicateIds && issue.metadata.duplicateIds.length > 1) {
          // 첫 번째를 제외한 나머지 삭제
          const toDelete = issue.metadata.duplicateIds.slice(1);
          toDelete.forEach((id: string) => {
            operations.push({
              id: `delete-duplicate-${id}`,
              type: 'delete',
              target: issue.entityType || 'unknown',
              data: { id },
              priority: 2
            });
          });
        }
        break;
    }

    if (operations.length > 0) {
      await syncTransactionManager.executeTransaction(operations);
      return { success: true, changes: operations };
    }

    return { success: false, error: 'Hard 복구 적용 불가' };
  }

  /**
   * Rollback 복구
   */
  private async applyRollbackRecovery(issue: ValidationResult): Promise<any> {
    // 이전 상태로 롤백
    const snapshot = this.snapshots.get(issue.entityId || '');

    if (snapshot) {
      const operation: SyncOperation = {
        id: `rollback-${issue.entityId}`,
        type: 'update',
        target: issue.entityType || 'unknown',
        data: snapshot,
        priority: 3
      };

      await syncTransactionManager.executeTransaction([operation]);
      return { success: true, changes: [operation] };
    }

    return { success: false, error: '롤백할 스냅샷이 없습니다' };
  }

  /**
   * Smart 복구 (AI 기반)
   */
  private async applySmartRecovery(issue: ValidationResult): Promise<any> {
    // 문제 유형과 컨텍스트를 분석하여 최적 복구 방법 선택
    const confidence = this.analyzeIssueContext(issue);

    if (confidence > 0.8) {
      // 높은 신뢰도: 자동 수정
      return await this.applySoftRecovery(issue);
    } else if (confidence > 0.5) {
      // 중간 신뢰도: 사용자 확인 후 수정
      return { success: false, error: '사용자 확인 필요' };
    } else {
      // 낮은 신뢰도: 수동 처리
      return { success: false, error: '자동 복구 불가능' };
    }
  }

  /**
   * 문제 컨텍스트 분석
   */
  private analyzeIssueContext(issue: ValidationResult): number {
    // 간단한 신뢰도 계산
    let confidence = 0.5;

    if (issue.autoFixable) confidence += 0.2;
    if (issue.suggestion) confidence += 0.1;
    if (issue.metadata) confidence += 0.1;
    if (issue.severity === ValidationSeverity.INFO) confidence += 0.1;

    return Math.min(1.0, confidence);
  }

  /**
   * 스냅샷 생성
   */
  private async createSnapshot(planId: string): Promise<void> {
    // 현재 상태를 스냅샷으로 저장
    const snapshot = {
      planId,
      timestamp: Date.now(),
      data: {} // 실제 데이터 저장
    };

    this.snapshots.set(planId, snapshot);

    // 오래된 스냅샷 정리
    if (this.snapshots.size > this.maxHistorySize) {
      const oldestKey = this.snapshots.keys().next().value;
      this.snapshots.delete(oldestKey);
    }
  }

  /**
   * 롤백
   */
  async rollback(planId: string): Promise<boolean> {
    const snapshot = this.snapshots.get(planId);
    if (!snapshot) {
      console.warn(`스냅샷을 찾을 수 없음: ${planId}`);
      return false;
    }

    try {
      // 스냅샷 데이터로 복원
      // 실제 구현에서는 데이터 복원 로직 추가
      console.log(`롤백 실행: ${planId}`, snapshot);

      this.emit('rollback:completed', { planId, snapshot });
      return true;
    } catch (error) {
      this.emit('rollback:failed', { planId, error });
      return false;
    }
  }

  /**
   * 통계 업데이트
   */
  private updateStatistics(plan: RecoveryPlan): void {
    const total = plan.statistics.totalTasks;
    const completed = plan.statistics.completedTasks;

    plan.statistics.successRate = total > 0 ? (completed / total) * 100 : 0;
  }

  /**
   * 복구 계획 취소
   */
  cancelRecoveryPlan(planId: string): boolean {
    const plan = this.plans.get(planId);
    if (!plan || plan.status !== 'executing') {
      return false;
    }

    plan.status = 'cancelled';
    this.emit('recovery:cancelled', plan);
    return true;
  }

  /**
   * 복구 히스토리
   */
  getHistory(limit?: number): RecoveryPlan[] {
    const plans = Array.from(this.plans.values())
      .sort((a, b) => b.createdAt - a.createdAt);

    return limit ? plans.slice(0, limit) : plans;
  }

  /**
   * 통계 반환
   */
  getStatistics() {
    const plans = Array.from(this.plans.values());
    const completed = plans.filter(p => p.status === 'completed');
    const failed = plans.filter(p => p.status === 'failed');

    const totalTasks = plans.reduce((sum, p) => sum + p.statistics.totalTasks, 0);
    const completedTasks = plans.reduce((sum, p) => sum + p.statistics.completedTasks, 0);
    const failedTasks = plans.reduce((sum, p) => sum + p.statistics.failedTasks, 0);

    return {
      totalPlans: plans.length,
      completedPlans: completed.length,
      failedPlans: failed.length,
      totalTasks,
      completedTasks,
      failedTasks,
      successRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      averageRecoveryTime: this.calculateAverageRecoveryTime(completed)
    };
  }

  /**
   * 평균 복구 시간 계산
   */
  private calculateAverageRecoveryTime(plans: RecoveryPlan[]): number {
    if (plans.length === 0) return 0;

    const times = plans
      .filter(p => p.startedAt && p.completedAt)
      .map(p => p.completedAt! - p.startedAt!);

    if (times.length === 0) return 0;

    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  /**
   * 이벤트 리스너 등록
   */
  on(event: string, listener: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  /**
   * 이벤트 발생
   */
  private emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in recovery event listener:`, error);
        }
      });
    }
  }

  /**
   * 초기화
   */
  reset(): void {
    this.currentPlan = null;
    this.plans.clear();
    this.snapshots.clear();
  }
}

// 싱글톤 인스턴스 export
export const autoRecoveryManager = AutoRecoveryManager.getInstance();