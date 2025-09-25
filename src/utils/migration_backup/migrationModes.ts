/**
 * @fileoverview 마이그레이션 실행 모드 시스템
 * @description Sprint 3 - Stage 2: 실행 모드별 전략 구현
 * @author PocketCompany
 * @since 2025-01-23
 */

import type { MigrationOptions, MigrationResult } from './migrationManager';
import type { MigrationCondition } from './migrationConditions';

/**
 * 마이그레이션 실행 모드
 */
export enum MigrationMode {
  AUTO = 'auto',           // 조건 충족 시 자동 실행
  MANUAL = 'manual',       // 사용자 명시적 실행만
  HYBRID = 'hybrid',       // 조건 감지 후 사용자 확인
  SCHEDULED = 'scheduled', // 예약된 시간에 실행
  SILENT = 'silent'        // 백그라운드 조용히 실행
}

/**
 * 모드별 설정
 */
export interface ModeConfiguration {
  mode: MigrationMode;
  enabled: boolean;
  autoRetry: boolean;
  maxRetries?: number;
  retryDelay?: number;
  requireConfirmation?: boolean;
  notifyOnComplete?: boolean;
  notifyOnError?: boolean;
  scheduleTime?: string; // cron expression or time string
  metadata?: any;
}

/**
 * 실행 컨텍스트
 */
export interface ExecutionContext {
  mode: MigrationMode;
  triggeredBy: 'condition' | 'user' | 'schedule' | 'event';
  conditions?: MigrationCondition[];
  timestamp: Date;
  userConfirmed?: boolean;
}

/**
 * 모드 실행 전략 인터페이스
 */
export interface ModeStrategy {
  execute(
    options: MigrationOptions,
    context: ExecutionContext
  ): Promise<MigrationResult[]>;

  canExecute(context: ExecutionContext): boolean | Promise<boolean>;

  onBeforeExecute?(context: ExecutionContext): void;
  onAfterExecute?(results: MigrationResult[], context: ExecutionContext): void;
  onError?(error: Error, context: ExecutionContext): void;
}

/**
 * AUTO 모드 전략
 */
export class AutoModeStrategy implements ModeStrategy {
  async canExecute(context: ExecutionContext): Promise<boolean> {
    // 자동 모드는 조건이 충족되면 바로 실행
    return context.triggeredBy === 'condition';
  }

  async execute(
    options: MigrationOptions,
    context: ExecutionContext
  ): Promise<MigrationResult[]> {

    // 자동 모드는 조용히 실행
    const autoOptions: MigrationOptions = {
      ...options,
      mode: 'auto',
      silent: true,
      skipValidation: false
    };

    // MigrationManager의 migrate 메서드 호출
    // 실제 구현에서는 MigrationManager 인스턴스를 주입받아야 함
    return [];
  }

  onBeforeExecute(context: ExecutionContext): void {
  }

  onAfterExecute(results: MigrationResult[], context: ExecutionContext): void {
    const total = results.reduce((sum, r) => sum + r.migrated, 0);
  }
}

/**
 * MANUAL 모드 전략
 */
export class ManualModeStrategy implements ModeStrategy {
  canExecute(context: ExecutionContext): boolean {
    // 수동 모드는 사용자 요청시에만 실행
    return context.triggeredBy === 'user';
  }

  async execute(
    options: MigrationOptions,
    context: ExecutionContext
  ): Promise<MigrationResult[]> {

    const manualOptions: MigrationOptions = {
      ...options,
      mode: 'manual',
      silent: false,
      force: true // 수동 모드는 강제 실행 허용
    };

    return [];
  }

  onBeforeExecute(context: ExecutionContext): void {
  }
}

/**
 * HYBRID 모드 전략
 */
export class HybridModeStrategy implements ModeStrategy {
  private userConfirmationCallback?: (message: string) => Promise<boolean>;

  setConfirmationCallback(callback: (message: string) => Promise<boolean>): void {
    this.userConfirmationCallback = callback;
  }

  async canExecute(context: ExecutionContext): Promise<boolean> {
    // 하이브리드 모드는 조건 충족 + 사용자 확인
    if (context.triggeredBy !== 'condition') {
      return false;
    }

    // 사용자 확인 요청
    if (this.userConfirmationCallback) {
      const message = 'Migration conditions met. Do you want to proceed?';
      const confirmed = await this.userConfirmationCallback(message);
      return confirmed;
    }

    return false;
  }

  async execute(
    options: MigrationOptions,
    context: ExecutionContext
  ): Promise<MigrationResult[]> {

    const hybridOptions: MigrationOptions = {
      ...options,
      mode: 'manual', // 사용자가 확인했으므로 manual로 처리
      silent: false
    };

    return [];
  }
}

/**
 * SCHEDULED 모드 전략
 */
export class ScheduledModeStrategy implements ModeStrategy {
  private schedule?: string;
  private lastRun?: Date;

  setSchedule(schedule: string): void {
    this.schedule = schedule;
  }

  canExecute(context: ExecutionContext): boolean {
    if (context.triggeredBy !== 'schedule') {
      return false;
    }

    // 스케줄 시간 체크
    if (!this.schedule) {
      return false;
    }

    const now = new Date();

    // 간단한 시간 체크 (실제로는 cron 파서 사용)
    if (this.schedule.includes(':')) {
      const [hour, minute] = this.schedule.split(':').map(Number);
      return now.getHours() === hour && now.getMinutes() === minute;
    }

    return false;
  }

  async execute(
    options: MigrationOptions,
    context: ExecutionContext
  ): Promise<MigrationResult[]> {

    this.lastRun = new Date();

    const scheduledOptions: MigrationOptions = {
      ...options,
      mode: 'auto',
      silent: true
    };

    return [];
  }

  onAfterExecute(): void {
  }
}

/**
 * SILENT 모드 전략
 */
export class SilentModeStrategy implements ModeStrategy {
  canExecute(context: ExecutionContext): boolean {
    // Silent 모드는 언제든 실행 가능
    return true;
  }

  async execute(
    options: MigrationOptions,
    context: ExecutionContext
  ): Promise<MigrationResult[]> {
    // Silent 모드는 모든 로그 억제
    const silentOptions: MigrationOptions = {
      ...options,
      mode: 'auto',
      silent: true,
      onProgress: undefined, // Progress 콜백 제거
      onComplete: undefined,
      onError: undefined
    };

    return [];
  }

  // Silent 모드는 로그 출력 안함
  onBeforeExecute(): void {}
  onAfterExecute(): void {}
  onError(): void {}
}

/**
 * 모드 관리자
 */
export class ModeManager {
  private strategies: Map<MigrationMode, ModeStrategy> = new Map();
  private currentMode: MigrationMode = MigrationMode.AUTO;
  private configurations: Map<MigrationMode, ModeConfiguration> = new Map();

  constructor() {
    this.initializeStrategies();
    this.loadConfigurations();
  }

  /**
   * 전략 초기화
   */
  private initializeStrategies(): void {
    this.strategies.set(MigrationMode.AUTO, new AutoModeStrategy());
    this.strategies.set(MigrationMode.MANUAL, new ManualModeStrategy());
    this.strategies.set(MigrationMode.HYBRID, new HybridModeStrategy());
    this.strategies.set(MigrationMode.SCHEDULED, new ScheduledModeStrategy());
    this.strategies.set(MigrationMode.SILENT, new SilentModeStrategy());
  }

  /**
   * 설정 로드
   */
  private loadConfigurations(): void {
    // localStorage에서 설정 로드
    const saved = localStorage.getItem('migration_mode_configs');
    if (saved) {
      try {
        const configs = JSON.parse(saved);
        Object.entries(configs).forEach(([mode, config]) => {
          this.configurations.set(mode as MigrationMode, config as ModeConfiguration);
        });
      } catch (error) {
        console.error('Failed to load mode configurations:', error);
      }
    }

    // 기본 설정
    this.setDefaultConfigurations();
  }

  /**
   * 기본 설정
   */
  private setDefaultConfigurations(): void {
    if (!this.configurations.has(MigrationMode.AUTO)) {
      this.configurations.set(MigrationMode.AUTO, {
        mode: MigrationMode.AUTO,
        enabled: true,
        autoRetry: true,
        maxRetries: 3,
        retryDelay: 5000,
        notifyOnError: true
      });
    }

    if (!this.configurations.has(MigrationMode.MANUAL)) {
      this.configurations.set(MigrationMode.MANUAL, {
        mode: MigrationMode.MANUAL,
        enabled: true,
        autoRetry: false,
        requireConfirmation: false,
        notifyOnComplete: true
      });
    }

    if (!this.configurations.has(MigrationMode.HYBRID)) {
      this.configurations.set(MigrationMode.HYBRID, {
        mode: MigrationMode.HYBRID,
        enabled: true,
        autoRetry: false,
        requireConfirmation: true,
        notifyOnComplete: true
      });
    }
  }

  /**
   * 현재 모드 가져오기
   */
  getCurrentMode(): MigrationMode {
    return this.currentMode;
  }

  /**
   * 모드 설정
   */
  setMode(mode: MigrationMode): void {
    const config = this.configurations.get(mode);
    if (config && config.enabled) {
      this.currentMode = mode;
      this.saveConfigurations();
    } else {
      throw new Error(`Mode ${mode} is not enabled or configured`);
    }
  }

  /**
   * 전략 가져오기
   */
  getStrategy(mode?: MigrationMode): ModeStrategy | undefined {
    const targetMode = mode || this.currentMode;
    return this.strategies.get(targetMode);
  }

  /**
   * 설정 가져오기
   */
  getConfiguration(mode?: MigrationMode): ModeConfiguration | undefined {
    const targetMode = mode || this.currentMode;
    return this.configurations.get(targetMode);
  }

  /**
   * 설정 업데이트
   */
  updateConfiguration(mode: MigrationMode, config: Partial<ModeConfiguration>): void {
    const existing = this.configurations.get(mode);
    if (existing) {
      this.configurations.set(mode, { ...existing, ...config });
      this.saveConfigurations();
    }
  }

  /**
   * 실행 가능 여부 확인
   */
  async canExecute(context: ExecutionContext): Promise<boolean> {
    const strategy = this.getStrategy();
    if (!strategy) {
      return false;
    }

    const config = this.getConfiguration();
    if (!config || !config.enabled) {
      return false;
    }

    return strategy.canExecute(context);
  }

  /**
   * 설정 저장
   */
  private saveConfigurations(): void {
    const configs: Record<string, ModeConfiguration> = {};
    this.configurations.forEach((config, mode) => {
      configs[mode] = config;
    });

    localStorage.setItem('migration_mode_configs', JSON.stringify(configs));
    localStorage.setItem('migration_current_mode', this.currentMode);
  }

  /**
   * 모든 모드 정보 가져오기
   */
  getAllModes(): {
    current: MigrationMode;
    available: MigrationMode[];
    configurations: Map<MigrationMode, ModeConfiguration>;
  } {
    return {
      current: this.currentMode,
      available: Array.from(this.strategies.keys()),
      configurations: this.configurations
    };
  }

  /**
   * 초기화
   */
  reset(): void {
    this.currentMode = MigrationMode.AUTO;
    this.configurations.clear();
    this.setDefaultConfigurations();
    localStorage.removeItem('migration_mode_configs');
    localStorage.removeItem('migration_current_mode');
  }
}

// 싱글톤 인스턴스
export const modeManager = new ModeManager();