/**
 * PhaseTransitionModule.ts
 *
 * Phase Transition 시스템의 안전한 동적 로딩 및 초기화 관리
 * Feature Toggle, 지연 로딩, 안전한 초기화 보장
 */

import { serviceRegistry } from '../services/ServiceRegistry';
import { eventBus } from '../events/EventBus';
import { logger } from '../logging/Logger';
import type { PhaseTransitionEngineV2 } from './PhaseTransitionEngineV2';

// Feature Flags
interface PhaseTransitionFeatureFlags {
  ENABLE_PHASE_TRANSITION_V2: boolean;
  ENABLE_AUTOMATIC_TRANSITIONS: boolean;
  ENABLE_MANUAL_TRANSITIONS: boolean;
  ENABLE_MEETING_TRIGGERS: boolean;
  DEBUG_MODE: boolean;
}

// 모듈 상태
type ModuleState = 'not_loaded' | 'loading' | 'loaded' | 'error' | 'disabled';

interface ModuleStatus {
  state: ModuleState;
  version: string;
  loadedAt?: Date;
  error?: Error;
  features: PhaseTransitionFeatureFlags;
}

// 안전한 프록시 인터페이스
interface PhaseTransitionProxy {
  isAvailable(): boolean;
  getStatus(): any;
  enable(): Promise<void>;
  disable(): void;
  getVersion(): string;
}

export class PhaseTransitionModule implements PhaseTransitionProxy {
  private static instance: PhaseTransitionModule | null = null;
  private engine: PhaseTransitionEngineV2 | null = null;
  private status: ModuleStatus = {
    state: 'not_loaded',
    version: '2.0.0',
    features: this.getFeatureFlags()
  };
  private loadAttempts = 0;
  private maxLoadAttempts = 3;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): PhaseTransitionModule {
    if (!PhaseTransitionModule.instance) {
      PhaseTransitionModule.instance = new PhaseTransitionModule();
    }
    return PhaseTransitionModule.instance;
  }

  /**
   * Feature Flags 조회
   */
  private getFeatureFlags(): PhaseTransitionFeatureFlags {
    return {
      ENABLE_PHASE_TRANSITION_V2: false, // 기본적으로 비활성화
      ENABLE_AUTOMATIC_TRANSITIONS: true,
      ENABLE_MANUAL_TRANSITIONS: true,
      ENABLE_MEETING_TRIGGERS: true,
      DEBUG_MODE: process.env.NODE_ENV === 'development'
    };
  }

  /**
   * 초기화
   */
  private async initialize(): Promise<void> {
    try {
      // Service Registry에 자신을 등록
      serviceRegistry.register(
        'phaseTransitionModule',
        () => this,
        {
          name: 'phaseTransitionModule',
          version: this.status.version,
          dependencies: [],
          singleton: true,
          lazy: true,
          description: 'Phase Transition Module V2'
        }
      );

      logger.info('PhaseTransitionModule initialized', {
        version: this.status.version,
        features: this.status.features
      }, 'PhaseTransitionModule');

    } catch (error) {
      logger.error('Failed to initialize PhaseTransitionModule', error, 'PhaseTransitionModule');
      this.status.state = 'error';
      this.status.error = error as Error;
    }
  }

  /**
   * 모듈 사용 가능 여부 확인
   */
  isAvailable(): boolean {
    return this.status.state === 'loaded' &&
           this.status.features.ENABLE_PHASE_TRANSITION_V2 &&
           this.engine !== null;
  }

  /**
   * 엔진 로딩 (지연 로딩)
   */
  private async loadEngine(): Promise<PhaseTransitionEngineV2> {
    if (this.engine) {
      return this.engine;
    }

    if (this.status.state === 'loading') {
      // 이미 로딩 중인 경우 대기
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (this.status.state === 'loaded' && this.engine) {
            clearInterval(checkInterval);
            resolve(this.engine);
          } else if (this.status.state === 'error') {
            clearInterval(checkInterval);
            reject(this.status.error);
          }
        }, 100);

        // 30초 타임아웃
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Engine loading timeout'));
        }, 30000);
      });
    }

    this.status.state = 'loading';
    this.loadAttempts++;

    try {
      logger.info('Loading PhaseTransitionEngineV2', {
        attempt: this.loadAttempts
      }, 'PhaseTransitionModule');

      // 동적 import로 엔진 로드
      const { PhaseTransitionEngineV2 } = await import('./PhaseTransitionEngineV2');

      // 엔진 인스턴스 생성
      this.engine = new PhaseTransitionEngineV2();

      this.status.state = 'loaded';
      this.status.loadedAt = new Date();
      this.status.error = undefined;

      logger.info('PhaseTransitionEngineV2 loaded successfully', {
        version: this.engine.getStatus().version,
        attempt: this.loadAttempts
      }, 'PhaseTransitionModule');

      return this.engine;

    } catch (error) {
      this.status.state = 'error';
      this.status.error = error as Error;

      logger.error('Failed to load PhaseTransitionEngineV2', {
        error: (error as Error).message,
        attempt: this.loadAttempts,
        maxAttempts: this.maxLoadAttempts
      }, 'PhaseTransitionModule');

      // 최대 시도 횟수 초과 시 포기
      if (this.loadAttempts >= this.maxLoadAttempts) {
        logger.error('Maximum load attempts exceeded, disabling module', {
          attempts: this.loadAttempts
        }, 'PhaseTransitionModule');
        this.status.state = 'disabled';
      }

      throw error;
    }
  }

  /**
   * Feature Flag 업데이트
   */
  updateFeatureFlag(flag: keyof PhaseTransitionFeatureFlags, value: boolean): void {
    const oldValue = this.status.features[flag];
    this.status.features[flag] = value;

    logger.info('Feature flag updated', {
      flag,
      oldValue,
      newValue: value
    }, 'PhaseTransitionModule');

    // 주요 플래그 변경 시 엔진 상태도 업데이트
    if (flag === 'ENABLE_PHASE_TRANSITION_V2') {
      if (value && this.engine) {
        this.engine.enable().catch(error => {
          logger.error('Failed to enable engine after feature flag update', error, 'PhaseTransitionModule');
        });
      } else if (!value && this.engine) {
        this.engine.disable();
      }
    }
  }

  /**
   * 엔진 활성화
   */
  async enable(): Promise<void> {
    if (!this.status.features.ENABLE_PHASE_TRANSITION_V2) {
      throw new Error('Phase Transition V2 is disabled by feature flag');
    }

    try {
      const engine = await this.loadEngine();
      await engine.enable();

      logger.info('Phase Transition Engine enabled', {
        version: engine.getStatus().version
      }, 'PhaseTransitionModule');

    } catch (error) {
      logger.error('Failed to enable Phase Transition Engine', error, 'PhaseTransitionModule');
      throw error;
    }
  }

  /**
   * 엔진 비활성화
   */
  disable(): void {
    if (this.engine) {
      this.engine.disable();
      logger.info('Phase Transition Engine disabled', {}, 'PhaseTransitionModule');
    }
  }

  /**
   * 상태 조회
   */
  getStatus(): ModuleStatus & { engineStatus?: any } {
    const result: ModuleStatus & { engineStatus?: any } = { ...this.status };

    if (this.engine) {
      result.engineStatus = this.engine.getStatus();
    }

    return result;
  }

  /**
   * 버전 정보
   */
  getVersion(): string {
    return this.status.version;
  }

  /**
   * 안전한 엔진 접근
   */
  async getEngine(): Promise<PhaseTransitionEngineV2 | null> {
    if (!this.status.features.ENABLE_PHASE_TRANSITION_V2) {
      return null;
    }

    try {
      return await this.loadEngine();
    } catch (error) {
      logger.error('Failed to get engine', error, 'PhaseTransitionModule');
      return null;
    }
  }

  /**
   * 건강 상태 체크
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    details: any;
  }> {
    const details: any = {
      moduleState: this.status.state,
      featuresEnabled: this.status.features,
      loadAttempts: this.loadAttempts,
      engineAvailable: this.engine !== null
    };

    let healthy = true;

    // 모듈 상태 체크
    if (this.status.state === 'error' || this.status.state === 'disabled') {
      healthy = false;
      details.moduleStateIssue = true;
    }

    // 엔진 상태 체크
    if (this.status.features.ENABLE_PHASE_TRANSITION_V2 && this.engine) {
      try {
        const engineStatus = this.engine.getStatus();
        details.engineStatus = engineStatus;

        if (!engineStatus.enabled || engineStatus.circuitBreaker.state === 'open') {
          healthy = false;
          details.engineIssue = true;
        }
      } catch (error) {
        healthy = false;
        details.engineError = (error as Error).message;
      }
    }

    return { healthy, details };
  }

  /**
   * 정리 작업
   */
  dispose(): void {
    if (this.engine) {
      this.engine.dispose();
      this.engine = null;
    }

    this.status.state = 'not_loaded';
    logger.info('PhaseTransitionModule disposed', {}, 'PhaseTransitionModule');
  }

  /**
   * 인스턴스 리셋 (테스트용)
   */
  static reset(): void {
    if (PhaseTransitionModule.instance) {
      PhaseTransitionModule.instance.dispose();
      PhaseTransitionModule.instance = null;
    }
  }
}

// 편의를 위한 글로벌 인스턴스
export const phaseTransitionModule = PhaseTransitionModule.getInstance();

// React Hook을 위한 유틸리티
export const usePhaseTransitionModule = () => {
  return {
    module: phaseTransitionModule,
    isAvailable: () => phaseTransitionModule.isAvailable(),
    getStatus: () => phaseTransitionModule.getStatus(),
    enable: () => phaseTransitionModule.enable(),
    disable: () => phaseTransitionModule.disable(),
    healthCheck: () => phaseTransitionModule.healthCheck()
  };
};