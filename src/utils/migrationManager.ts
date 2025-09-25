/**
 * @fileoverview 통합 마이그레이션 관리 시스템
 * @description 모든 마이그레이션 로직을 중앙에서 관리하는 통합 매니저
 * Sprint 3 - Stage 1 구현
 * @author PocketCompany
 * @since 2025-01-23
 */

import { GlobalContextManager } from './globalContextManager';
import { devLog } from '../utils/logger';
import { migrationRetryManager } from './migrationRetryManager';
import {
  validateMigrationPrerequisites,
  isValidProjectId,
  getSafeProjectId,
  shouldDelayMigration
} from './migrationValidator';
import { globalMigrator, type MigrationResult } from './dataMigration';
import { EdgeCaseLogger } from './edgeCaseScenarios';
import type { Project } from '../types/buildup.types';
import {
  conditionEvaluator,
  builtInConditions,
  type MigrationCondition,
  type ConditionResult
} from './migrationConditions';
import { modeManager, MigrationMode } from './migrationModes';
import { migrationEventTrigger } from './migrationEventTrigger';
import { migrationScopeManager, type MigrationScope } from './migrationScope';

/**
 * 마이그레이션 상태
 */
export type MigrationState = 'idle' | 'running' | 'completed' | 'failed' | 'paused';

/**
 * 마이그레이션 옵션
 */
export interface MigrationOptions {
  mode?: 'auto' | 'manual' | 'conditional';
  skipValidation?: boolean;
  force?: boolean;
  onProgress?: (progress: number, message?: string) => void;
  onComplete?: (result: MigrationResult[]) => void;
  onError?: (error: Error) => void;
  projectId?: string;
  silent?: boolean;
  scope?: MigrationScope; // Stage 2: 부분 마이그레이션 지원
  metadata?: any;
}


/**
 * 마이그레이션 이력
 */
export interface MigrationHistory {
  id: string;
  startTime: Date;
  endTime?: Date;
  state: MigrationState;
  options: MigrationOptions;
  results?: MigrationResult[];
  error?: Error;
}

/**
 * 통합 마이그레이션 관리자
 */
export class MigrationManager {
  private static instance: MigrationManager | null = null;

  // 상태 관리
  private state: MigrationState = 'idle';
  private progress: number = 0;
  private currentMigrationId: string | null = null;

  // 이력 관리
  private history: MigrationHistory[] = [];

  // 조건 관리
  private conditions: Map<string, MigrationCondition> = new Map();

  // Context 관리자
  private contextManager: GlobalContextManager;

  // 제어 플래그
  private isPaused: boolean = false;
  private abortController: AbortController | null = null;

  private constructor() {
    this.contextManager = GlobalContextManager.getInstance();
    this.registerWithContextManager();
    this.setupDefaultConditions();
    this.loadHistory();

    // Stage 2: 이벤트 트리거 시작
    migrationEventTrigger.startListening();
  }

  /**
   * 싱글톤 인스턴스 가져오기
   */
  public static getInstance(): MigrationManager {
    if (!MigrationManager.instance) {
      MigrationManager.instance = new MigrationManager();
    }
    return MigrationManager.instance;
  }

  /**
   * GlobalContextManager에 등록
   */
  private registerWithContextManager(): void {
    this.contextManager.register('MigrationManager', {
      migrate: this.migrate.bind(this),
      getState: () => this.state,
      getProgress: () => this.progress,
      shouldMigrate: this.shouldMigrate.bind(this),
      pause: this.pause.bind(this),
      resume: this.resume.bind(this),
      cancel: this.cancel.bind(this)
    }, {
      version: '1.0.0',
      description: 'Unified Migration Management System',
      capabilities: ['auto-migration', 'conditional-execution', 'progress-tracking']
    });

    ;
  }

  /**
   * 기본 실행 조건 설정
   */
  private setupDefaultConditions(): void {
    // Stage 2: 확장된 조건 시스템 사용
    const conditions = builtInConditions.getAllConditions();

    // 모든 내장 조건 등록
    conditions.forEach(condition => {
      this.addCondition(condition.id, condition);
    });

    ;
  }

  /**
   * 마이그레이션 실행
   */
  public async migrate(options: MigrationOptions = {}): Promise<MigrationResult[]> {
    // 이미 실행 중인지 확인
    if (this.state === 'running') {
      throw new Error('Migration already in progress');
    }

    // 마이그레이션 ID 생성
    const migrationId = migrationRetryManager.generateMigrationId(options.projectId);
    this.currentMigrationId = migrationId;

    // 재시도 체크
    if (!options.force && !migrationRetryManager.shouldRetry(migrationId)) {
      const status = migrationRetryManager.getStatus(migrationId);
      throw new Error(`Migration cannot be retried. Status: ${status}`);
    }

    // 이력 기록 시작
    const historyEntry: MigrationHistory = {
      id: migrationId,
      startTime: new Date(),
      state: 'running',
      options
    };
    this.history.push(historyEntry);

    // 상태 변경
    this.setState('running');
    this.progress = 0;

    // Abort Controller 설정
    this.abortController = new AbortController();

    try {
      // 시도 기록
      migrationRetryManager.recordAttempt(migrationId);

      // 1. 검증 단계
      if (!options.skipValidation) {
        await this.validate(options);
        this.updateProgress(20, 'Validation completed');
      }

      // 2. Context 준비 대기
      await this.waitForContexts();
      this.updateProgress(30, 'Contexts ready');

      // 3. 실행 단계
      const results = await this.execute(options);
      this.updateProgress(80, 'Migration executed');

      // 4. 검증 단계
      await this.verify(results);
      this.updateProgress(100, 'Migration verified');

      // 성공 처리
      this.setState('completed');
      migrationRetryManager.markCompleted(migrationId);

      // 이력 업데이트
      historyEntry.endTime = new Date();
      historyEntry.state = 'completed';
      historyEntry.results = results;

      // 첫 실행 표시
      if (options.mode === 'auto') {
        localStorage.setItem('migration_first_run', new Date().toISOString());
      }

      // 콜백 호출
      if (options.onComplete) {
        options.onComplete(results);
      }

      if (!options.silent) {
        ;
      }

      return results;

    } catch (error) {
      // 실패 처리
      this.setState('failed');
      migrationRetryManager.markFailed(migrationId, error.message);

      // 이력 업데이트
      historyEntry.endTime = new Date();
      historyEntry.state = 'failed';
      historyEntry.error = error;

      // 콜백 호출
      if (options.onError) {
        options.onError(error);
      }

      if (!options.silent) {
        console.error('❌ Migration failed:', error);
      }

      throw error;

    } finally {
      this.abortController = null;
      this.currentMigrationId = null;
      this.saveHistory();
    }
  }

  /**
   * 마이그레이션 필요 여부 확인
   */
  public async shouldMigrate(): Promise<boolean> {
    // 이미 완료된 경우
    const lastSuccess = this.history.find(h => h.state === 'completed');
    if (lastSuccess) {
      const hoursSinceLastRun = (Date.now() - lastSuccess.endTime.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastRun < 24) {
        return false; // 24시간 내 실행한 경우 스킵
      }
    }

    // Stage 2: 우선순위 기반 조건 평가
    const conditions = Array.from(this.conditions.values());
    const results = await conditionEvaluator.evaluateWithPriority(conditions);

    // 하나라도 true인 조건이 있으면 마이그레이션 필요
    const shouldMigrate = results.some(r => r.result === true);

    if (shouldMigrate) {
      const metConditions = results.filter(r => r.result).map(r => r.conditionId);
    }

    return shouldMigrate;
  }

  /**
   * 검증 단계
   */
  private async validate(options: MigrationOptions): Promise<void> {
    const buildupContext = await this.contextManager.waitForContext('BuildupContext', 5000);

    if (!buildupContext) {
      throw new Error('BuildupContext not available');
    }

    const projects = buildupContext.projects || [];
    const meetings = buildupContext.meetings || [];

    const validation = validateMigrationPrerequisites(projects, meetings);

    if (!validation.canMigrate && !options.force) {
      throw new Error(validation.reason || 'Migration validation failed');
    }
  }

  /**
   * Context 준비 대기
   */
  private async waitForContexts(): Promise<void> {
    const requiredContexts = ['BuildupContext', 'ScheduleContext'];

    for (const contextName of requiredContexts) {
      const context = await this.contextManager.waitForContext(contextName, 10000);
      if (!context) {
        throw new Error(`Required context not available: ${contextName}`);
      }
    }
  }

  /**
   * 실제 마이그레이션 실행
   */
  private async execute(options: MigrationOptions): Promise<MigrationResult[]> {
    // 중단 체크
    if (this.abortController?.signal.aborted) {
      throw new Error('Migration aborted');
    }

    // 일시정지 체크
    while (this.isPaused) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (this.abortController?.signal.aborted) {
        throw new Error('Migration aborted');
      }
    }

    // Stage 2: 범위 기반 마이그레이션
    if (options.scope) {

      // 범위 평가
      const buildupContext = await this.contextManager.getContext('BuildupContext');
      if (buildupContext) {
        const evaluation = migrationScopeManager.evaluateScope(options.scope, {
          projects: buildupContext.projects,
          meetings: buildupContext.meetings
        });

        ;

        if (evaluation.warnings) {
          evaluation.warnings.forEach(w => console.warn(`⚠️ ${w}`));
        }
      }
    }

    // 기존 migrator 사용 (통합 예정)
    if (options.projectId) {
      const result = await globalMigrator.migrateMockMeetingsForProject(options.projectId);
      return [result];
    } else {
      return await globalMigrator.migrateAllMockMeetings();
    }
  }

  /**
   * 검증 단계
   */
  private async verify(results: MigrationResult[]): Promise<void> {
    const totalMigrated = results.reduce((sum, r) => sum + r.migrated, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    if (totalErrors > totalMigrated) {
      EdgeCaseLogger.log('EC_MIGRATION_001', {
        totalMigrated,
        totalErrors,
        reason: 'More errors than successful migrations'
      });
    }

    // ScheduleContext에서 실제로 생성되었는지 확인
    const scheduleContext = await this.contextManager.getContext('ScheduleContext');
    if (scheduleContext && totalMigrated > 0) {
      const schedules = scheduleContext.schedules || [];
      ;
    }
  }

  /**
   * 진행률 업데이트
   */
  private updateProgress(percent: number, message?: string): void {
    this.progress = percent;

    const currentHistory = this.history.find(h => h.id === this.currentMigrationId);
    if (currentHistory?.options?.onProgress) {
      currentHistory.options.onProgress(percent, message);
    }

    if (message) {
      ;
    }
  }

  /**
   * 상태 변경
   */
  private setState(newState: MigrationState): void {
    const oldState = this.state;
    this.state = newState;

    // Context Manager에 알림
    this.contextManager.send({
      from: 'MigrationManager',
      to: '*',
      type: 'MIGRATION_STATE_CHANGED',
      payload: { oldState, newState }
    });
  }

  /**
   * 일시정지
   */
  public pause(): void {
    if (this.state === 'running') {
      this.isPaused = true;
      this.setState('paused');
    }
  }

  /**
   * 재개
   */
  public resume(): void {
    if (this.state === 'paused') {
      this.isPaused = false;
      this.setState('running');
    }
  }

  /**
   * 취소
   */
  public cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.setState('failed');
    }
  }

  /**
   * 조건 추가
   */
  public addCondition(name: string, condition: MigrationCondition): void {
    this.conditions.set(name, condition);
  }

  /**
   * 조건 제거
   */
  public removeCondition(name: string): void {
    this.conditions.delete(name);
  }

  /**
   * 이력 조회
   */
  public getHistory(): MigrationHistory[] {
    return [...this.history];
  }

  /**
   * 통계 조회
   */
  public getStatistics() {
    const completed = this.history.filter(h => h.state === 'completed').length;
    const failed = this.history.filter(h => h.state === 'failed').length;
    const totalTime = this.history.reduce((sum, h) => {
      if (h.endTime) {
        return sum + (h.endTime.getTime() - h.startTime.getTime());
      }
      return sum;
    }, 0);

    return {
      total: this.history.length,
      completed,
      failed,
      averageTime: this.history.length > 0 ? totalTime / this.history.length : 0,
      successRate: this.history.length > 0 ? (completed / this.history.length) * 100 : 0
    };
  }

  /**
   * 이력 저장
   */
  private saveHistory(): void {
    try {
      const data = this.history.slice(-50); // 최근 50개만 저장
      localStorage.setItem('migration_history', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save migration history:', error);
    }
  }

  /**
   * 이력 로드
   */
  private loadHistory(): void {
    try {
      const stored = localStorage.getItem('migration_history');
      if (stored) {
        const data = JSON.parse(stored);
        this.history = data.map((entry: any) => ({
          ...entry,
          startTime: new Date(entry.startTime),
          endTime: entry.endTime ? new Date(entry.endTime) : undefined
        }));
      }
    } catch (error) {
      console.error('Failed to load migration history:', error);
    }
  }

  /**
   * 초기화
   */
  public reset(): void {
    this.state = 'idle';
    this.progress = 0;
    this.history = [];
    this.conditions.clear();
    this.setupDefaultConditions();
    localStorage.removeItem('migration_history');
    localStorage.removeItem('migration_first_run');
    migrationRetryManager.reset();
    ;
  }
}

// 개발 환경 디버깅용
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).__migrationManager__ = MigrationManager.getInstance();
}