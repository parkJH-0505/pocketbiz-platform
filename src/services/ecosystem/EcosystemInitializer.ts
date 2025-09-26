/**
 * Ecosystem Initializer
 * 전체 생태계 시스템의 초기화 및 상태 관리
 */

import { CentralEventBus } from './EventBus';
import { EcosystemManager } from './EcosystemManager';
import { calendarEcosystemConnector } from './connectors/CalendarEcosystemConnector';
import { buildupEcosystemConnector } from './connectors/BuildupEcosystemConnector';

export interface EcosystemStatus {
  eventBus: {
    healthy: boolean;
    totalEvents: number;
    activeSubscriptions: number;
  };
  connectors: {
    calendar: {
      connected: boolean;
      subscriptions: number;
    };
    buildup: {
      connected: boolean;
      subscriptions: number;
    };
  };
  ecosystem: {
    initialized: boolean;
    version: string;
    health: 'good' | 'warning' | 'error';
  };
}

/**
 * 전체 생태계 시스템 초기화 및 관리
 */
export class EcosystemInitializer {
  private static instance: EcosystemInitializer;
  private eventBus: CentralEventBus;
  private ecosystemManager: EcosystemManager;
  private initialized = false;

  private constructor() {
    this.eventBus = CentralEventBus.getInstance();
    this.ecosystemManager = EcosystemManager.getInstance();
  }

  static getInstance(): EcosystemInitializer {
    if (!EcosystemInitializer.instance) {
      EcosystemInitializer.instance = new EcosystemInitializer();
    }
    return EcosystemInitializer.instance;
  }

  /**
   * 전체 생태계 초기화
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('[EcosystemInitializer] Already initialized');
      return;
    }

    try {
      console.log('🚀 [EcosystemInitializer] Starting ecosystem initialization...');

      // 1. 중앙 이벤트 버스 초기화
      await this.initializeEventBus();

      // 2. 생태계 매니저 초기화
      await this.ecosystemManager.initialize();

      // 3. 커넥터들의 상태 확인
      this.verifyConnectors();

      // 4. 시스템 헬스 체크
      await this.performHealthCheck();

      this.initialized = true;
      console.log('✅ [EcosystemInitializer] Ecosystem initialization completed');

    } catch (error) {
      console.error('❌ [EcosystemInitializer] Failed to initialize ecosystem:', error);
      throw error;
    }
  }

  /**
   * 이벤트 버스 초기화
   */
  private async initializeEventBus(): Promise<void> {
    // 시스템 이벤트 구독
    this.eventBus.subscribe('system:health-check', this.handleSystemHealthCheck.bind(this), 0);
    this.eventBus.subscribe('system:status-request', this.handleStatusRequest.bind(this), 0);

    console.log('🔗 [EcosystemInitializer] Event bus initialized');
  }

  /**
   * 커넥터 상태 확인
   */
  private verifyConnectors(): void {
    const calendarStats = calendarEcosystemConnector.getConnectionStats();
    const buildupStats = buildupEcosystemConnector.getConnectionStats();

    if (!calendarStats.connected) {
      console.warn('⚠️ [EcosystemInitializer] Calendar connector not connected');
    }

    if (!buildupStats.connected) {
      console.warn('⚠️ [EcosystemInitializer] Buildup connector not connected');
    }

    console.log('🔍 [EcosystemInitializer] Connector verification completed', {
      calendar: calendarStats,
      buildup: buildupStats
    });
  }

  /**
   * 시스템 헬스 체크
   */
  private async performHealthCheck(): Promise<void> {
    const status = this.getSystemStatus();

    if (status.ecosystem.health === 'error') {
      throw new Error('Critical ecosystem health issues detected');
    }

    if (status.ecosystem.health === 'warning') {
      console.warn('⚠️ [EcosystemInitializer] System health warnings detected', status);
    }

    console.log('💚 [EcosystemInitializer] Health check passed');
  }

  /**
   * 시스템 상태 반환
   */
  getSystemStatus(): EcosystemStatus {
    const eventBusStats = this.eventBus.getStatistics();
    const calendarStats = calendarEcosystemConnector.getConnectionStats();
    const buildupStats = buildupEcosystemConnector.getConnectionStats();

    // 헬스 상태 계산
    let health: 'good' | 'warning' | 'error' = 'good';

    if (!this.initialized) {
      health = 'error';
    } else if (!calendarStats.connected || !buildupStats.connected || !eventBusStats.healthy) {
      health = 'warning';
    }

    return {
      eventBus: {
        healthy: eventBusStats.healthy,
        totalEvents: eventBusStats.totalEventsProcessed,
        activeSubscriptions: eventBusStats.activeSubscriptions
      },
      connectors: {
        calendar: {
          connected: calendarStats.connected,
          subscriptions: calendarStats.subscriptions
        },
        buildup: {
          connected: buildupStats.connected,
          subscriptions: buildupStats.subscriptions
        }
      },
      ecosystem: {
        initialized: this.initialized,
        version: '1.0.0',
        health
      }
    };
  }

  /**
   * 시스템 헬스 체크 이벤트 핸들러
   */
  private async handleSystemHealthCheck(event: any): Promise<void> {
    console.log('[EcosystemInitializer] Health check requested');
    await this.performHealthCheck();

    // 응답 이벤트 발행
    await this.eventBus.emit({
      type: 'system:health-check:response',
      source: 'ecosystem-initializer',
      data: {
        status: this.getSystemStatus(),
        timestamp: new Date()
      }
    });
  }

  /**
   * 시스템 상태 요청 이벤트 핸들러
   */
  private async handleStatusRequest(event: any): Promise<void> {
    console.log('[EcosystemInitializer] Status request received');

    // 상태 응답 이벤트 발행
    await this.eventBus.emit({
      type: 'system:status:response',
      source: 'ecosystem-initializer',
      data: {
        status: this.getSystemStatus(),
        requestId: event.data?.requestId,
        timestamp: new Date()
      }
    });
  }

  /**
   * 테스트용 이벤트 발행
   */
  async triggerTestScenario(): Promise<void> {
    console.log('🧪 [EcosystemInitializer] Triggering test scenario...');

    // V2 시나리오 저장 시뮬레이션
    await this.eventBus.emit({
      type: 'v2:scenario:saved',
      source: 'test',
      userId: 'test-user',
      data: {
        scenarioId: `test-scenario-${Date.now()}`,
        name: '테스트 최적화 시나리오',
        projectedScores: {
          GO: 85,
          EC: 78,
          PT: 82,
          PF: 75,
          TO: 80
        },
        keyActions: [
          '고객 피드백 시스템 구축',
          '프로세스 자동화 도입',
          '팀 역량 강화 교육'
        ],
        timeline: '2개월',
        priority: 'high' as const,
        estimatedEffort: 8,
        expectedROI: 150,
        tags: ['test', 'optimization', 'automation']
      }
    });

    console.log('✅ [EcosystemInitializer] Test scenario triggered');
  }

  /**
   * 초기화 상태 확인
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 생태계 종료
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    console.log('🛑 [EcosystemInitializer] Shutting down ecosystem...');

    try {
      // 매니저 정리
      this.ecosystemManager.dispose();

      // 커넥터 정리
      calendarEcosystemConnector.dispose();
      buildupEcosystemConnector.dispose();

      this.initialized = false;
      console.log('✅ [EcosystemInitializer] Ecosystem shutdown completed');

    } catch (error) {
      console.error('❌ [EcosystemInitializer] Error during shutdown:', error);
    }
  }
}

// 글로벌 인스턴스 생성 및 내보내기
export const ecosystemInitializer = EcosystemInitializer.getInstance();

// Window 객체에 노출 (개발/테스트용)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).ecosystemInitializer = ecosystemInitializer;
}