/**
 * Data Pipeline Manager
 * 데이터 수집 파이프라인의 중앙 관리자
 */

import { CentralEventBus } from '../EventBus';
import { DataCollectionScheduler } from './CollectionScheduler';
import { DataTransformationEngine } from './transform/DataTransformationEngine';
import { V2DataCollector } from './collectors/V2DataCollector';
import { CalendarDataCollector } from './collectors/CalendarDataCollector';
import { BuildupDataCollector } from './collectors/BuildupDataCollector';
import type {
  DataCollector,
  CollectionConfig,
  CollectionResult,
  DataSource,
  DataSourceType,
  CollectionMode
} from './types';

export interface PipelineConfig {
  v2: {
    enabled: boolean;
    mode: CollectionMode;
    interval: number;
    retryAttempts: number;
  };
  calendar: {
    enabled: boolean;
    mode: CollectionMode;
    interval: number;
    retryAttempts: number;
  };
  buildup: {
    enabled: boolean;
    mode: CollectionMode;
    interval: number;
    retryAttempts: number;
  };
  global: {
    timeout: number;
    maxConcurrentCollections: number;
    healthCheckInterval: number;
  };
}

export interface PipelineStatus {
  isRunning: boolean;
  dataSources: Array<{
    id: string;
    type: DataSourceType;
    status: 'healthy' | 'warning' | 'error';
    lastCollection?: Date;
    nextCollection?: Date;
  }>;
  statistics: {
    totalCollections: number;
    successfulCollections: number;
    failedCollections: number;
    averageResponseTime: number;
    dataRecordsProcessed: number;
  };
  performance: {
    memoryUsage: number;
    cpuUsage: number;
    throughput: number; // records per minute
  };
}

export class DataPipelineManager {
  private static instance: DataPipelineManager;

  private eventBus: CentralEventBus;
  private scheduler: DataCollectionScheduler;
  private transformationEngine: DataTransformationEngine;
  private collectors: Map<string, DataCollector> = new Map();
  private dataSources: Map<string, DataSource> = new Map();
  private config: PipelineConfig;
  private isInitialized = false;
  private isRunning = false;
  private healthCheckInterval?: NodeJS.Timeout;

  private constructor() {
    this.eventBus = CentralEventBus.getInstance();
    this.scheduler = DataCollectionScheduler.getInstance();
    this.transformationEngine = DataTransformationEngine.getInstance();
    this.config = this.getDefaultConfig();
  }

  static getInstance(): DataPipelineManager {
    if (!DataPipelineManager.instance) {
      DataPipelineManager.instance = new DataPipelineManager();
    }
    return DataPipelineManager.instance;
  }

  /**
   * 파이프라인 초기화
   */
  async initialize(config?: Partial<PipelineConfig>): Promise<void> {
    if (this.isInitialized) {
      console.warn('[DataPipelineManager] Already initialized');
      return;
    }

    console.log('🔧 [DataPipelineManager] Initializing data pipeline...');

    if (config) {
      this.config = { ...this.config, ...config };
    }

    // 데이터 수집기들 초기화
    await this.initializeCollectors();

    // 데이터 소스 등록
    this.registerDataSources();

    // 헬스 체크 스케줄링
    this.startHealthCheck();

    this.isInitialized = true;
    console.log('✅ [DataPipelineManager] Pipeline initialized successfully');
  }

  /**
   * 파이프라인 시작
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Pipeline must be initialized before starting');
    }

    if (this.isRunning) {
      console.warn('[DataPipelineManager] Pipeline is already running');
      return;
    }

    console.log('🚀 [DataPipelineManager] Starting data collection pipeline...');

    // 각 소스별로 스케줄 설정
    if (this.config.v2.enabled) {
      await this.scheduleCollector('v2-system', this.config.v2);
    }

    if (this.config.calendar.enabled) {
      await this.scheduleCollector('calendar-system', this.config.calendar);
    }

    if (this.config.buildup.enabled) {
      await this.scheduleCollector('buildup-system', this.config.buildup);
    }

    this.isRunning = true;

    // 파이프라인 시작 이벤트 발행
    await this.eventBus.emit({
      id: `pipeline-start-${Date.now()}`,
      type: 'pipeline:started',
      source: 'system',
      timestamp: Date.now(),
      data: {
        enabledSources: this.getEnabledSources(),
        startedAt: new Date()
      }
    });

    console.log('✅ [DataPipelineManager] Pipeline started successfully');
  }

  /**
   * 파이프라인 중지
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.warn('[DataPipelineManager] Pipeline is not running');
      return;
    }

    console.log('🛑 [DataPipelineManager] Stopping data collection pipeline...');

    // 모든 스케줄 중지
    this.scheduler.pauseAll();

    // 헬스 체크 중지
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    this.isRunning = false;

    // 파이프라인 중지 이벤트 발행
    await this.eventBus.emit({
      id: `pipeline-stop-${Date.now()}`,
      type: 'pipeline:stopped',
      source: 'system',
      timestamp: Date.now(),
      data: {
        stoppedAt: new Date(),
        finalStatistics: this.scheduler.getStatistics()
      }
    });

    console.log('✅ [DataPipelineManager] Pipeline stopped successfully');
  }

  /**
   * 특정 소스의 즉시 수집 실행
   */
  async collectImmediately(sourceId: string): Promise<CollectionResult> {
    if (!this.isRunning) {
      throw new Error('Pipeline must be running to execute immediate collection');
    }

    console.log(`[DataPipelineManager] Running immediate collection for ${sourceId}`);
    return await this.scheduler.runImmediately(sourceId);
  }

  /**
   * 파이프라인 상태 조회
   */
  getStatus(): PipelineStatus {
    const schedulerStats = this.scheduler.getStatistics();
    const activeSchedules = this.scheduler.getActiveSchedules();

    const dataSources = Array.from(this.dataSources.values()).map(source => {
      const collector = this.collectors.get(source.id);
      const schedule = activeSchedules.find(s => s.sourceId === source.id);

      return {
        id: source.id,
        type: source.type,
        status: source.healthStatus,
        lastCollection: collector ? this.getLastCollectionTime(collector) : undefined,
        nextCollection: schedule ? schedule.nextRun : undefined
      };
    });

    return {
      isRunning: this.isRunning,
      dataSources,
      statistics: {
        totalCollections: schedulerStats.totalCollections,
        successfulCollections: schedulerStats.successfulCollections,
        failedCollections: schedulerStats.failedCollections,
        averageResponseTime: schedulerStats.averageCollectionTime,
        dataRecordsProcessed: this.getTotalRecordsProcessed()
      },
      performance: {
        memoryUsage: this.getMemoryUsage(),
        cpuUsage: 0, // CPU 사용률은 실제 환경에서 구현
        throughput: this.calculateThroughput()
      }
    };
  }

  /**
   * 설정 업데이트
   */
  updateConfig(newConfig: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // 실행 중인 경우 스케줄 재설정
    if (this.isRunning) {
      console.log('[DataPipelineManager] Updating running pipeline configuration');
      this.restartWithNewConfig();
    }
  }

  /**
   * 데이터 수집기 초기화
   */
  private async initializeCollectors(): Promise<void> {
    // V2 수집기 초기화
    if (this.config.v2.enabled) {
      const v2Collector = new V2DataCollector();
      this.collectors.set('v2-system', v2Collector);
      this.scheduler.registerCollector(v2Collector);
    }

    // Calendar 수집기 초기화
    if (this.config.calendar.enabled) {
      const calendarCollector = new CalendarDataCollector();
      this.collectors.set('calendar-system', calendarCollector);
      this.scheduler.registerCollector(calendarCollector);
    }

    // Buildup 수집기 초기화
    if (this.config.buildup.enabled) {
      const buildupCollector = new BuildupDataCollector();
      this.collectors.set('buildup-system', buildupCollector);
      this.scheduler.registerCollector(buildupCollector);
    }

    console.log(`[DataPipelineManager] Initialized ${this.collectors.size} data collectors`);
  }

  /**
   * 데이터 소스 등록
   */
  private registerDataSources(): void {
    if (this.config.v2.enabled) {
      this.dataSources.set('v2-system', {
        id: 'v2-system',
        type: 'v2',
        name: 'V2 System',
        version: '1.0.0',
        lastUpdated: new Date(),
        isActive: true,
        healthStatus: 'healthy'
      });
    }

    if (this.config.calendar.enabled) {
      this.dataSources.set('calendar-system', {
        id: 'calendar-system',
        type: 'calendar',
        name: 'Calendar System',
        version: '1.0.0',
        lastUpdated: new Date(),
        isActive: true,
        healthStatus: 'healthy'
      });
    }

    if (this.config.buildup.enabled) {
      this.dataSources.set('buildup-system', {
        id: 'buildup-system',
        type: 'buildup',
        name: 'Buildup System',
        version: '1.0.0',
        lastUpdated: new Date(),
        isActive: true,
        healthStatus: 'healthy'
      });
    }

    console.log(`[DataPipelineManager] Registered ${this.dataSources.size} data sources`);
  }

  /**
   * 수집기 스케줄 설정
   */
  private async scheduleCollector(sourceId: string, config: any): Promise<void> {
    const collectionConfig: CollectionConfig = {
      sourceId,
      mode: config.mode,
      interval: config.interval,
      retryAttempts: config.retryAttempts,
      timeout: this.config.global.timeout
    };

    const scheduleId = this.scheduler.schedule(sourceId, collectionConfig);
    console.log(`[DataPipelineManager] Scheduled ${config.mode} collection for ${sourceId}: ${scheduleId}`);
  }

  /**
   * 헬스 체크 시작
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(
      async () => await this.performHealthCheck(),
      this.config.global.healthCheckInterval
    );

    console.log(`[DataPipelineManager] Health check scheduled every ${this.config.global.healthCheckInterval}ms`);
  }

  /**
   * 헬스 체크 수행
   */
  private async performHealthCheck(): Promise<void> {
    for (const [sourceId, dataSource] of this.dataSources.entries()) {
      const collector = this.collectors.get(sourceId);
      if (!collector) continue;

      try {
        const healthResult = await collector.checkHealth();

        dataSource.healthStatus = healthResult.isHealthy ? 'healthy' : 'warning';
        dataSource.lastUpdated = healthResult.lastCheck;

        if (!healthResult.isHealthy) {
          console.warn(`[DataPipelineManager] Health check failed for ${sourceId}:`, healthResult.errors);
        }

      } catch (error) {
        dataSource.healthStatus = 'error';
        console.error(`[DataPipelineManager] Health check error for ${sourceId}:`, error);
      }
    }
  }

  /**
   * 새 설정으로 재시작
   */
  private async restartWithNewConfig(): Promise<void> {
    await this.stop();
    await this.start();
  }

  /**
   * 유틸리티 메서드들
   */
  private getDefaultConfig(): PipelineConfig {
    return {
      v2: {
        enabled: true,
        mode: 'hybrid',
        interval: 60000, // 1분
        retryAttempts: 3
      },
      calendar: {
        enabled: true,
        mode: 'hybrid',
        interval: 30000, // 30초
        retryAttempts: 3
      },
      buildup: {
        enabled: true,
        mode: 'hybrid',
        interval: 45000, // 45초
        retryAttempts: 3
      },
      global: {
        timeout: 30000, // 30초
        maxConcurrentCollections: 3,
        healthCheckInterval: 300000 // 5분
      }
    };
  }

  private getEnabledSources(): string[] {
    return Array.from(this.dataSources.keys()).filter(sourceId => {
      const source = this.dataSources.get(sourceId);
      return source && source.isActive;
    });
  }

  private getLastCollectionTime(collector: DataCollector): Date | undefined {
    const stats = collector.getStatistics();
    return stats.lastCollectionAt;
  }

  private getTotalRecordsProcessed(): number {
    const history = this.scheduler.getHistory();
    return history.reduce((total, result) => total + result.recordsSucceeded, 0);
  }

  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  private calculateThroughput(): number {
    const history = this.scheduler.getHistory(undefined, 10); // 최근 10개
    if (history.length === 0) return 0;

    const totalRecords = history.reduce((sum, result) => sum + result.recordsSucceeded, 0);
    const totalTime = history.reduce((sum, result) => sum + result.performance.duration, 0);

    return totalTime > 0 ? (totalRecords / totalTime) * 60000 : 0; // records per minute
  }

  /**
   * 테스트용 실시간 업데이트 시뮬레이션
   */
  simulateRealtimeUpdates(): void {
    const v2Collector = this.collectors.get('v2-system') as V2DataCollector;
    const calendarCollector = this.collectors.get('calendar-system') as CalendarDataCollector;
    const buildupCollector = this.collectors.get('buildup-system') as BuildupDataCollector;

    if (v2Collector) {
      v2Collector.simulateRealtimeUpdate();
    }

    if (calendarCollector) {
      calendarCollector.simulateRealtimeUpdate();
    }

    if (buildupCollector) {
      buildupCollector.simulateRealtimeUpdate();
    }

    console.log('[DataPipelineManager] Simulated realtime updates for all collectors');
  }

  /**
   * 정리
   */
  async dispose(): Promise<void> {
    if (this.isRunning) {
      await this.stop();
    }

    this.scheduler.dispose();

    for (const collector of this.collectors.values()) {
      collector.dispose();
    }

    this.collectors.clear();
    this.dataSources.clear();
    this.isInitialized = false;

    console.log('[DataPipelineManager] Disposed');
  }
}