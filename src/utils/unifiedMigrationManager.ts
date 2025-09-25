/**
 * @fileoverview 통합 마이그레이션 관리 시스템 (간소화 버전)
 * @description 핵심 기능만 유지한 깔끔한 Migration Manager
 * Sprint 3 - 리팩터링된 통합 시스템
 * @author PocketCompany
 * @since 2025-01-24
 */

import { migrationRetryManager } from './migrationRetryManager';
import { validateMigrationPrerequisites } from './migrationValidator';
import { globalMigrator, type MigrationResult } from './dataMigration';
import type { Project } from '../types/buildup.types';

/**
 * 마이그레이션 상태
 */
export type MigrationState = 'idle' | 'running' | 'completed' | 'failed';

/**
 * 간소화된 마이그레이션 옵션
 */
export interface MigrationOptions {
  projectId?: string;
  silent?: boolean;
  force?: boolean;
  onProgress?: (progress: number, message?: string) => void;
  onComplete?: (result: MigrationResult[]) => void;
  onError?: (error: Error) => void;
}

/**
 * 통합 마이그레이션 매니저 (간소화 버전)
 * 핵심 기능만 유지하여 안정성과 유지보수성을 확보
 */
export class UnifiedMigrationManager {
  private static instance: UnifiedMigrationManager | null = null;
  private state: MigrationState = 'idle';
  private migrationCompleted: boolean = false;
  private isRunning: boolean = false;

  private constructor() {
    this.initialize();
  }

  /**
   * 싱글톤 인스턴스 가져오기
   */
  public static getInstance(): UnifiedMigrationManager {
    if (!UnifiedMigrationManager.instance) {
      UnifiedMigrationManager.instance = new UnifiedMigrationManager();
    }
    return UnifiedMigrationManager.instance;
  }

  /**
   * 매니저 초기화
   */
  private initialize(): void {
    // localStorage에서 완료 상태 확인
    this.migrationCompleted = localStorage.getItem('migration_completed') === 'true';

    if (this.migrationCompleted) {
      this.state = 'completed';
    } else {
    }
  }

  /**
   * 마이그레이션 실행
   */
  public async runMigration(options: MigrationOptions = {}): Promise<boolean> {
    // 이미 완료되었거나 진행 중이면 스킵
    if (this.migrationCompleted || this.isRunning) {
      return false;
    }

    // 전제 조건 확인
    if (!options.force && !validateMigrationPrerequisites()) {
      return false;
    }

    this.isRunning = true;
    this.state = 'running';

    try {
      options.onProgress?.(10, 'Starting migration...');

      // 핵심 마이그레이션 로직 실행
      const results: MigrationResult[] = [];

      options.onProgress?.(50, 'Running data migration...');

      // Global migrator 사용
      const migrationResults = await globalMigrator.migrateAllData(options.projectId);
      results.push(...migrationResults);

      options.onProgress?.(90, 'Finalizing migration...');

      // 성공 처리
      this.migrationCompleted = true;
      this.state = 'completed';
      localStorage.setItem('migration_completed', 'true');

      options.onProgress?.(100, 'Migration completed successfully');
      options.onComplete?.(results);

      if (!options.silent) {
      }

      return true;

    } catch (error) {
      console.error('❌ Migration failed:', error);

      this.state = 'failed';
      options.onError?.(error as Error);

      // 재시도 매니저에 등록
      migrationRetryManager.scheduleRetry('main_migration', () =>
        this.runMigration(options)
      );

      return false;

    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 마이그레이션 상태 확인
   */
  public getState(): MigrationState {
    return this.state;
  }

  /**
   * 마이그레이션 완료 여부 확인
   */
  public isCompleted(): boolean {
    return this.migrationCompleted;
  }

  /**
   * 마이그레이션 진행 중 여부 확인
   */
  public isInProgress(): boolean {
    return this.isRunning;
  }

  /**
   * 마이그레이션 재설정
   */
  public reset(): void {
    this.migrationCompleted = false;
    this.state = 'idle';
    this.isRunning = false;
    localStorage.removeItem('migration_completed');
  }

  /**
   * 강제 마이그레이션 실행
   */
  public async forceMigration(options: MigrationOptions = {}): Promise<boolean> {
    return this.runMigration({ ...options, force: true });
  }
}

// 싱글톤 인스턴스 export
export const unifiedMigrationManager = UnifiedMigrationManager.getInstance();

// 기본 export (기존 MigrationManager와 호환성 유지)
export { UnifiedMigrationManager as MigrationManager };
export default unifiedMigrationManager;