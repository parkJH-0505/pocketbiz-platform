/**
 * Collection Scheduler
 * 데이터 수집 작업의 스케줄링 및 관리
 */

import { CentralEventBus } from '../EventBus';
import type {
  CollectionScheduler,
  DataCollector,
  CollectionConfig,
  CollectionResult,
  CollectionStartedEvent,
  CollectionCompletedEvent
} from './types';

export interface ScheduleEntry {
  id: string;
  sourceId: string;
  config: CollectionConfig;
  nextRun: Date;
  isActive: boolean;
  intervalId?: NodeJS.Timeout;
  lastRun?: Date;
  lastResult?: CollectionResult;
}

export class DataCollectionScheduler implements CollectionScheduler {
  private static instance: DataCollectionScheduler;

  private eventBus: CentralEventBus;
  private collectors: Map<string, DataCollector> = new Map();
  private schedules: Map<string, ScheduleEntry> = new Map();
  private collectionHistory: CollectionResult[] = [];
  private isRunning: boolean = false;

  private constructor() {
    this.eventBus = CentralEventBus.getInstance();
    this.setupEventListeners();
  }

  static getInstance(): DataCollectionScheduler {
    if (!DataCollectionScheduler.instance) {
      DataCollectionScheduler.instance = new DataCollectionScheduler();
    }
    return DataCollectionScheduler.instance;
  }

  /**
   * 데이터 수집기 등록
   */
  registerCollector(collector: DataCollector): void {
    this.collectors.set(collector.sourceId, collector);
    console.log(`[CollectionScheduler] Registered collector: ${collector.sourceId}`);
  }

  /**
   * 데이터 수집기 등록 해제
   */
  unregisterCollector(sourceId: string): void {
    // 관련 스케줄 모두 취소
    const relatedSchedules = Array.from(this.schedules.values())
      .filter(schedule => schedule.sourceId === sourceId);

    relatedSchedules.forEach(schedule => this.unschedule(schedule.id));

    this.collectors.delete(sourceId);
    console.log(`[CollectionScheduler] Unregistered collector: ${sourceId}`);
  }

  /**
   * 수집 스케줄 등록
   */
  schedule(sourceId: string, config: CollectionConfig): string {
    const collector = this.collectors.get(sourceId);
    if (!collector) {
      throw new Error(`No collector registered for source: ${sourceId}`);
    }

    const scheduleId = `schedule_${sourceId}_${Date.now()}`;
    const now = new Date();

    // 다음 실행 시간 계산
    const nextRun = config.mode === 'realtime'
      ? new Date(now.getTime() + 1000) // 1초 후 시작
      : new Date(now.getTime() + (config.interval || 60000)); // interval 후 시작

    const entry: ScheduleEntry = {
      id: scheduleId,
      sourceId,
      config,
      nextRun,
      isActive: true
    };

    // 스케줄 설정
    if (config.mode === 'batch') {
      entry.intervalId = setInterval(
        () => this.executeBatchCollection(scheduleId),
        config.interval || 60000
      );
    } else if (config.mode === 'realtime') {
      entry.intervalId = setInterval(
        () => this.executeRealtimeCollection(scheduleId),
        Math.min(config.interval || 5000, 5000) // 최대 5초 간격
      );
    } else if (config.mode === 'hybrid') {
      // 하이브리드는 배치와 실시간 모두 실행
      entry.intervalId = setInterval(
        () => this.executeHybridCollection(scheduleId),
        config.interval || 30000
      );
    }

    this.schedules.set(scheduleId, entry);

    console.log(`[CollectionScheduler] Scheduled ${config.mode} collection for ${sourceId}`);
    console.log(`[CollectionScheduler] Next run: ${nextRun.toISOString()}`);

    return scheduleId;
  }

  /**
   * 스케줄 취소
   */
  unschedule(scheduleId: string): void {
    const entry = this.schedules.get(scheduleId);
    if (!entry) {
      console.warn(`[CollectionScheduler] Schedule not found: ${scheduleId}`);
      return;
    }

    if (entry.intervalId) {
      clearInterval(entry.intervalId);
    }

    entry.isActive = false;
    this.schedules.delete(scheduleId);

    console.log(`[CollectionScheduler] Unscheduled: ${scheduleId}`);
  }

  /**
   * 즉시 수집 실행
   */
  async runImmediately(sourceId: string): Promise<CollectionResult> {
    const collector = this.collectors.get(sourceId);
    if (!collector) {
      throw new Error(`No collector registered for source: ${sourceId}`);
    }

    console.log(`[CollectionScheduler] Running immediate collection for ${sourceId}`);

    const config: CollectionConfig = {
      sourceId,
      mode: 'batch',
      retryAttempts: 3,
      timeout: 30000
    };

    try {
      const result = await collector.collect(config);
      this.addToHistory(result);
      return result;
    } catch (error) {
      console.error(`[CollectionScheduler] Immediate collection failed for ${sourceId}:`, error);
      throw error;
    }
  }

  /**
   * 활성 스케줄 조회
   */
  getActiveSchedules(): Array<{
    id: string;
    sourceId: string;
    nextRun: Date;
    config: CollectionConfig;
  }> {
    return Array.from(this.schedules.values())
      .filter(entry => entry.isActive)
      .map(entry => ({
        id: entry.id,
        sourceId: entry.sourceId,
        nextRun: entry.nextRun,
        config: entry.config
      }));
  }

  /**
   * 수집 히스토리 조회
   */
  getHistory(sourceId?: string, limit: number = 100): CollectionResult[] {
    let history = this.collectionHistory;

    if (sourceId) {
      history = history.filter(result => result.sourceId === sourceId);
    }

    return history
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  /**
   * 배치 수집 실행
   */
  private async executeBatchCollection(scheduleId: string): Promise<void> {
    const entry = this.schedules.get(scheduleId);
    if (!entry || !entry.isActive) return;

    const collector = this.collectors.get(entry.sourceId);
    if (!collector) return;

    try {
      console.log(`[CollectionScheduler] Executing batch collection for ${entry.sourceId}`);

      const result = await collector.collect(entry.config);

      entry.lastRun = new Date();
      entry.lastResult = result;
      entry.nextRun = new Date(Date.now() + (entry.config.interval || 60000));

      this.addToHistory(result);

      console.log(`[CollectionScheduler] Batch collection completed for ${entry.sourceId}: ${result.recordsSucceeded} records`);

    } catch (error) {
      console.error(`[CollectionScheduler] Batch collection failed for ${entry.sourceId}:`, error);
    }
  }

  /**
   * 실시간 수집 실행
   */
  private async executeRealtimeCollection(scheduleId: string): Promise<void> {
    const entry = this.schedules.get(scheduleId);
    if (!entry || !entry.isActive) return;

    const collector = this.collectors.get(entry.sourceId);
    if (!collector) return;

    try {
      const result = await collector.collect({
        ...entry.config,
        mode: 'realtime'
      });

      entry.lastRun = new Date();
      entry.lastResult = result;

      // 실시간 모드는 데이터가 있을 때만 히스토리에 추가
      if (result.recordsProcessed > 0) {
        this.addToHistory(result);
        console.log(`[CollectionScheduler] Realtime collection completed for ${entry.sourceId}: ${result.recordsSucceeded} records`);
      }

    } catch (error) {
      console.error(`[CollectionScheduler] Realtime collection failed for ${entry.sourceId}:`, error);
    }
  }

  /**
   * 하이브리드 수집 실행
   */
  private async executeHybridCollection(scheduleId: string): Promise<void> {
    const entry = this.schedules.get(scheduleId);
    if (!entry || !entry.isActive) return;

    const collector = this.collectors.get(entry.sourceId);
    if (!collector) return;

    try {
      console.log(`[CollectionScheduler] Executing hybrid collection for ${entry.sourceId}`);

      const result = await collector.collect({
        ...entry.config,
        mode: 'hybrid'
      });

      entry.lastRun = new Date();
      entry.lastResult = result;
      entry.nextRun = new Date(Date.now() + (entry.config.interval || 30000));

      this.addToHistory(result);

      console.log(`[CollectionScheduler] Hybrid collection completed for ${entry.sourceId}: ${result.recordsSucceeded} records`);

    } catch (error) {
      console.error(`[CollectionScheduler] Hybrid collection failed for ${entry.sourceId}:`, error);
    }
  }

  /**
   * 히스토리에 결과 추가
   */
  private addToHistory(result: CollectionResult): void {
    this.collectionHistory.push(result);

    // 히스토리 크기 제한 (최근 1000개만 유지)
    if (this.collectionHistory.length > 1000) {
      this.collectionHistory = this.collectionHistory.slice(-1000);
    }
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    // 수집 완료 이벤트 구독하여 통계 업데이트
    this.eventBus.subscribe(
      'pipeline:collection:completed',
      this.handleCollectionCompleted.bind(this),
      1
    );
  }

  /**
   * 수집 완료 이벤트 처리
   */
  private async handleCollectionCompleted(event: CollectionCompletedEvent): Promise<void> {
    const { sourceId, result } = event.data;

    // 해당 소스의 스케줄 엔트리 업데이트
    const relatedSchedules = Array.from(this.schedules.values())
      .filter(entry => entry.sourceId === sourceId);

    relatedSchedules.forEach(entry => {
      entry.lastResult = result;
    });

    // 실패한 수집에 대한 재시도 로직
    if (result.status === 'failed' && result.errors.length > 0) {
      await this.handleFailedCollection(sourceId, result);
    }
  }

  /**
   * 실패한 수집 처리
   */
  private async handleFailedCollection(sourceId: string, result: CollectionResult): Promise<void> {
    const collector = this.collectors.get(sourceId);
    if (!collector) return;

    // 헬스 체크 수행
    try {
      const healthResult = await collector.checkHealth();

      if (!healthResult.isHealthy) {
        console.error(`[CollectionScheduler] Collector ${sourceId} is unhealthy:`, healthResult.errors);

        // 연속 실패 시 일시적으로 스케줄 비활성화
        const failedSchedules = Array.from(this.schedules.values())
          .filter(entry => entry.sourceId === sourceId && entry.lastResult?.status === 'failed');

        if (failedSchedules.length > 0) {
          failedSchedules.forEach(entry => {
            entry.isActive = false;
            console.warn(`[CollectionScheduler] Temporarily disabled schedule ${entry.id} due to repeated failures`);
          });

          // 5분 후 재활성화 시도
          setTimeout(() => {
            failedSchedules.forEach(entry => {
              if (this.schedules.has(entry.id)) {
                entry.isActive = true;
                console.log(`[CollectionScheduler] Re-enabled schedule ${entry.id}`);
              }
            });
          }, 5 * 60 * 1000);
        }
      }
    } catch (error) {
      console.error(`[CollectionScheduler] Health check failed for ${sourceId}:`, error);
    }
  }

  /**
   * 스케줄러 통계
   */
  getStatistics(): {
    activeSchedules: number;
    totalCollections: number;
    successfulCollections: number;
    failedCollections: number;
    averageCollectionTime: number;
    collectorsRegistered: number;
  } {
    const successful = this.collectionHistory.filter(r => r.status === 'completed').length;
    const failed = this.collectionHistory.filter(r => r.status === 'failed').length;
    const totalTime = this.collectionHistory.reduce((sum, r) => sum + r.performance.duration, 0);

    return {
      activeSchedules: Array.from(this.schedules.values()).filter(s => s.isActive).length,
      totalCollections: this.collectionHistory.length,
      successfulCollections: successful,
      failedCollections: failed,
      averageCollectionTime: this.collectionHistory.length > 0 ? totalTime / this.collectionHistory.length : 0,
      collectorsRegistered: this.collectors.size
    };
  }

  /**
   * 모든 스케줄 일시 정지
   */
  pauseAll(): void {
    Array.from(this.schedules.values()).forEach(entry => {
      if (entry.intervalId) {
        clearInterval(entry.intervalId);
        entry.intervalId = undefined;
      }
      entry.isActive = false;
    });

    this.isRunning = false;
    console.log('[CollectionScheduler] All schedules paused');
  }

  /**
   * 모든 스케줄 재개
   */
  resumeAll(): void {
    Array.from(this.schedules.values()).forEach(entry => {
      if (!entry.intervalId && entry.config) {
        // 스케줄 재설정
        if (entry.config.mode === 'batch') {
          entry.intervalId = setInterval(
            () => this.executeBatchCollection(entry.id),
            entry.config.interval || 60000
          );
        } else if (entry.config.mode === 'realtime') {
          entry.intervalId = setInterval(
            () => this.executeRealtimeCollection(entry.id),
            Math.min(entry.config.interval || 5000, 5000)
          );
        } else if (entry.config.mode === 'hybrid') {
          entry.intervalId = setInterval(
            () => this.executeHybridCollection(entry.id),
            entry.config.interval || 30000
          );
        }
      }
      entry.isActive = true;
    });

    this.isRunning = true;
    console.log('[CollectionScheduler] All schedules resumed');
  }

  /**
   * 정리
   */
  dispose(): void {
    this.pauseAll();
    this.schedules.clear();
    this.collectors.clear();
    this.collectionHistory = [];
    console.log('[CollectionScheduler] Disposed');
  }
}