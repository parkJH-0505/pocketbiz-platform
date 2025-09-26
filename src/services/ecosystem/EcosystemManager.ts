/**
 * Ecosystem Manager
 * 전체 통합 생태계의 중앙 관리자
 */

import { CentralEventBus } from './EventBus';
import { V2SystemAdapter, V2AdapterConfig } from './adapters/V2Adapter';
import { CalendarContextAdapter, CalendarAdapterConfig } from './adapters/CalendarAdapter';
import { BuildupContextAdapter, BuildupAdapterConfig } from './adapters/BuildupAdapter';
import { EventTransformers } from './transformers/EventTransformers';
import type { BaseEvent, EventHandler, EventLog } from './types';
import type { AxisKey } from '../../types/buildup.types';

export interface EcosystemConfig {
  v2: V2AdapterConfig;
  calendar: CalendarAdapterConfig;
  buildup: BuildupAdapterConfig;
  enableRealTimeSync: boolean;
  enableConflictResolution: boolean;
  enablePerformanceMonitoring: boolean;
}

export interface EcosystemStats {
  totalEvents: number;
  activeAdapters: number;
  syncStatus: 'healthy' | 'warning' | 'critical';
  lastSyncTime: Date;
  errorRate: number;
  averageProcessingTime: number;
  adapterStats: {
    v2: { events: number; errors: number; lastActivity: Date | null };
    calendar: { events: number; errors: number; lastActivity: Date | null };
    buildup: { events: number; errors: number; lastActivity: Date | null };
  };
}

export interface SyncHealth {
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
  lastCheck: Date;
}

export class EcosystemManager {
  private static instance: EcosystemManager;
  private eventBus: CentralEventBus;
  private transformers: EventTransformers;

  // 어댑터들
  private v2Adapter: V2SystemAdapter;
  private calendarAdapter: CalendarContextAdapter;
  private buildupAdapter: BuildupContextAdapter;

  // 상태 관리
  private isInitialized: boolean = false;
  private config: EcosystemConfig;
  private performanceMetrics: Map<string, number[]> = new Map();
  private lastSyncCheck: Date = new Date();
  private errorLog: Array<{ timestamp: Date; error: string; component: string }> = [];

  static getInstance(config?: EcosystemConfig): EcosystemManager {
    if (!EcosystemManager.instance) {
      EcosystemManager.instance = new EcosystemManager(config);
    }
    return EcosystemManager.instance;
  }

  private constructor(config?: EcosystemConfig) {
    this.config = config || {
      v2: {
        autoSyncScenarios: true,
        autoSyncKPIUpdates: true,
        autoSyncRecommendations: true
      },
      calendar: {
        autoCreateFromScenarios: true,
        autoCreateFromRecommendations: true,
        syncWithBuildup: true
      },
      buildup: {
        autoCreateFromV2: true,
        autoUpdateKPIFromMilestones: true,
        syncProgressWithCalendar: true
      },
      enableRealTimeSync: true,
      enableConflictResolution: true,
      enablePerformanceMonitoring: true
    };

    this.eventBus = CentralEventBus.getInstance();
    this.transformers = EventTransformers.getInstance();
  }

  /**
   * 생태계 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('[EcosystemManager] Already initialized');
      return;
    }

    try {
      console.log('[EcosystemManager] Initializing ecosystem...');

      // 어댑터들 초기화
      this.v2Adapter = new V2SystemAdapter(this.config.v2);
      this.calendarAdapter = new CalendarContextAdapter(this.config.calendar);
      this.buildupAdapter = new BuildupContextAdapter(this.config.buildup);

      // 시스템 간 통신 이벤트 구독
      this.setupCrossSystemCommunication();

      // 성능 모니터링 시작
      if (this.config.enablePerformanceMonitoring) {
        this.startPerformanceMonitoring();
      }

      // 헬스 체크 시작
      this.startHealthMonitoring();

      // 초기화 완료 이벤트
      await this.eventBus.emit({
        id: '',
        type: 'ecosystem:initialized',
        source: 'system',
        timestamp: 0,
        data: {
          adapters: ['v2', 'calendar', 'buildup'],
          config: this.config,
          startTime: new Date().toISOString()
        }
      });

      this.isInitialized = true;
      console.log('[EcosystemManager] Ecosystem initialized successfully');

    } catch (error) {
      console.error('[EcosystemManager] Failed to initialize ecosystem:', error);
      throw error;
    }
  }

  /**
   * 시스템 간 통신 설정
   */
  private setupCrossSystemCommunication(): void {
    // V2 → Calendar/Buildup 자동 변환
    this.eventBus.subscribe('v2:scenario:saved', async (event) => {
      try {
        // 캘린더 이벤트 자동 생성
        if (this.config.calendar.autoCreateFromScenarios) {
          const calendarEvents = await this.transformers.scenarioToCalendarEvents(event.data);

          for (const calendarEvent of calendarEvents) {
            await this.calendarAdapter.emitEventCreated({
              eventId: calendarEvent.id,
              title: calendarEvent.title,
              date: calendarEvent.date,
              type: calendarEvent.type,
              projectId: calendarEvent.projectId,
              relatedScenario: calendarEvent.relatedScenario,
              priority: calendarEvent.priority
            }, event.userId);
          }
        }

        // Buildup 프로젝트 자동 생성
        if (this.config.buildup.autoCreateFromV2 && event.data.priority === 'high') {
          const project = await this.transformers.scenarioToProject(event.data);

          await this.eventBus.emit({
            id: '',
            type: 'buildup:auto-generate:project',
            source: 'v2-auto',
            timestamp: 0,
            userId: event.userId,
            data: project
          });
        }

      } catch (error) {
        this.logError('scenario-to-systems', error as Error);
      }
    }, 1);

    // Buildup → V2 KPI 업데이트
    this.eventBus.subscribe('buildup:milestone:completed', async (event) => {
      try {
        if (this.config.buildup.autoUpdateKPIFromMilestones) {
          const kpiImpact = await this.transformers.milestoneToKPIImpact(event.data);

          await this.v2Adapter.emitKPIUpdated({
            previousScores: await this.getCurrentKPIScores(), // 이전 점수
            currentScores: await this.applyKPIImpact(kpiImpact), // 새 점수
            changes: kpiImpact.scoreAdjustments as Record<AxisKey, number>,
            triggers: [`milestone_completed:${event.data.milestoneName}`],
            confidence: kpiImpact.confidence
          }, event.userId);
        }
      } catch (error) {
        this.logError('milestone-to-kpi', error as Error);
      }
    }, 1);

    // Calendar → V2 외부 요인
    this.eventBus.subscribe('calendar:event:created', async (event) => {
      try {
        const externalFactor = await this.transformers.calendarToExternalFactor(event.data);

        await this.eventBus.emit({
          id: '',
          type: 'v2:external-factor:added',
          source: 'calendar-auto',
          timestamp: 0,
          userId: event.userId,
          data: externalFactor
        });
      } catch (error) {
        this.logError('calendar-to-v2', error as Error);
      }
    }, 2);

    // 시스템 간 상태 동기화 체크
    this.eventBus.subscribe('ecosystem:sync-check', this.performSyncCheck.bind(this), 3);
  }

  /**
   * 성능 모니터링 시작
   */
  private startPerformanceMonitoring(): void {
    // 이벤트 처리 시간 측정
    const originalEmit = this.eventBus.emit.bind(this.eventBus);

    this.eventBus.emit = async (event: BaseEvent) => {
      const startTime = Date.now();

      try {
        const result = await originalEmit(event);
        const processingTime = Date.now() - startTime;

        this.recordPerformanceMetric('event_processing_time', processingTime);

        if (processingTime > 5000) { // 5초 이상 걸린 경우 경고
          console.warn(`[EcosystemManager] Slow event processing: ${event.type} took ${processingTime}ms`);
        }

        return result;
      } catch (error) {
        const processingTime = Date.now() - startTime;
        this.recordPerformanceMetric('event_processing_time', processingTime);
        throw error;
      }
    };

    // 정기적 성능 리포트
    setInterval(() => {
      this.generatePerformanceReport();
    }, 5 * 60 * 1000); // 5분마다
  }

  /**
   * 헬스 모니터링 시작
   */
  private startHealthMonitoring(): void {
    setInterval(async () => {
      const health = await this.checkSystemHealth();

      if (health.status !== 'healthy') {
        await this.eventBus.emit({
          id: '',
          type: 'ecosystem:health-warning',
          source: 'system',
          timestamp: 0,
          data: health
        });
      }

      this.lastSyncCheck = new Date();
    }, 2 * 60 * 1000); // 2분마다
  }

  /**
   * 동기화 상태 체크
   */
  private async performSyncCheck(): Promise<void> {
    try {
      // 각 어댑터의 상태 확인
      const stats = await this.getEcosystemStats();

      if (stats.errorRate > 0.1) { // 10% 이상 에러율
        await this.eventBus.emit({
          id: '',
          type: 'ecosystem:high-error-rate',
          source: 'system',
          timestamp: 0,
          data: { errorRate: stats.errorRate, stats }
        });
      }

      // 마지막 동기화 시간 체크
      const timeSinceLastSync = Date.now() - stats.lastSyncTime.getTime();
      if (timeSinceLastSync > 10 * 60 * 1000) { // 10분 이상 동기화 없음
        await this.eventBus.emit({
          id: '',
          type: 'ecosystem:sync-stale',
          source: 'system',
          timestamp: 0,
          data: { timeSinceLastSync, lastSyncTime: stats.lastSyncTime }
        });
      }

    } catch (error) {
      this.logError('sync-check', error as Error);
    }
  }

  /**
   * 시스템 건강 상태 체크
   */
  async checkSystemHealth(): Promise<SyncHealth> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // 이벤트 버스 상태
      const busStats = this.eventBus.getStats();
      if (busStats.errorRate > 0.05) { // 5% 이상 에러율
        issues.push(`높은 이벤트 처리 에러율: ${(busStats.errorRate * 100).toFixed(1)}%`);
        recommendations.push('이벤트 핸들러 오류 로그를 확인하고 수정하세요');
      }

      // 성능 체크
      const avgProcessingTime = this.getAverageProcessingTime();
      if (avgProcessingTime > 3000) { // 3초 이상
        issues.push(`느린 이벤트 처리 속도: ${avgProcessingTime}ms`);
        recommendations.push('성능 최적화를 고려하세요');
      }

      // 최근 에러 체크
      const recentErrors = this.errorLog.filter(
        error => Date.now() - error.timestamp.getTime() < 30 * 60 * 1000 // 30분 이내
      );

      if (recentErrors.length > 10) {
        issues.push(`최근 30분간 높은 에러 발생: ${recentErrors.length}건`);
        recommendations.push('에러 로그를 검토하고 근본 원인을 해결하세요');
      }

      // 어댑터별 활동 체크
      const stats = await this.getEcosystemStats();
      Object.entries(stats.adapterStats).forEach(([adapter, adapterStats]) => {
        if (adapterStats.lastActivity &&
            Date.now() - adapterStats.lastActivity.getTime() > 60 * 60 * 1000) { // 1시간 이상 비활성
          issues.push(`${adapter} 어댑터가 1시간 이상 비활성 상태`);
          recommendations.push(`${adapter} 시스템 연결 상태를 확인하세요`);
        }
      });

    } catch (error) {
      issues.push('건강 상태 체크 중 오류 발생');
      this.logError('health-check', error as Error);
    }

    const status: SyncHealth['status'] =
      issues.length === 0 ? 'healthy' :
      issues.length <= 2 ? 'warning' : 'critical';

    return {
      status,
      issues,
      recommendations,
      lastCheck: new Date()
    };
  }

  /**
   * 생태계 통계 조회
   */
  async getEcosystemStats(): Promise<EcosystemStats> {
    const busStats = this.eventBus.getStats();
    const avgProcessingTime = this.getAverageProcessingTime();

    return {
      totalEvents: busStats.totalEvents,
      activeAdapters: 3, // v2, calendar, buildup
      syncStatus: await this.getSyncStatus(),
      lastSyncTime: this.lastSyncCheck,
      errorRate: busStats.errorRate,
      averageProcessingTime: avgProcessingTime,
      adapterStats: {
        v2: await this.getAdapterStats('v2'),
        calendar: await this.getAdapterStats('calendar'),
        buildup: await this.getAdapterStats('buildup')
      }
    };
  }

  /**
   * 수동 동기화 트리거
   */
  async triggerManualSync(systems?: string[]): Promise<void> {
    const targetSystems = systems || ['v2', 'calendar', 'buildup'];

    console.log(`[EcosystemManager] Triggering manual sync for: ${targetSystems.join(', ')}`);

    await this.eventBus.emit({
      id: '',
      type: 'ecosystem:manual-sync',
      source: 'system',
      timestamp: 0,
      data: {
        targetSystems,
        triggeredAt: new Date().toISOString()
      }
    });

    // 동기화 후 상태 체크
    setTimeout(async () => {
      const health = await this.checkSystemHealth();
      console.log(`[EcosystemManager] Post-sync health status: ${health.status}`);
    }, 2000);
  }

  /**
   * 생태계 정리
   */
  async dispose(): Promise<void> {
    console.log('[EcosystemManager] Disposing ecosystem...');

    try {
      // 어댑터들 정리
      this.v2Adapter?.dispose();
      this.calendarAdapter?.dispose();
      this.buildupAdapter?.dispose();

      // 이벤트 버스 정리
      this.eventBus.clear();

      // 종료 이벤트
      await this.eventBus.emit({
        id: '',
        type: 'ecosystem:disposed',
        source: 'system',
        timestamp: 0,
        data: {
          disposedAt: new Date().toISOString(),
          totalEvents: this.performanceMetrics.get('event_processing_time')?.length || 0
        }
      });

      this.isInitialized = false;
      console.log('[EcosystemManager] Ecosystem disposed successfully');

    } catch (error) {
      console.error('[EcosystemManager] Error during disposal:', error);
    }
  }

  /**
   * 개발/디버깅 메서드들
   */
  getEventLog(limit: number = 50): EventLog[] {
    return this.eventBus.getEventLog(limit);
  }

  async emitTestEvent(eventType: string, data: any): Promise<void> {
    await this.eventBus.emit({
      id: '',
      type: eventType,
      source: 'system',
      timestamp: 0,
      data,
      metadata: { test: true }
    });
  }

  getErrorLog(): Array<{ timestamp: Date; error: string; component: string }> {
    return [...this.errorLog];
  }

  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * 프라이빗 헬퍼 메서드들
   */
  private recordPerformanceMetric(metric: string, value: number): void {
    if (!this.performanceMetrics.has(metric)) {
      this.performanceMetrics.set(metric, []);
    }

    const values = this.performanceMetrics.get(metric)!;
    values.push(value);

    // 최근 1000개만 유지
    if (values.length > 1000) {
      values.shift();
    }
  }

  private getAverageProcessingTime(): number {
    const times = this.performanceMetrics.get('event_processing_time') || [];
    if (times.length === 0) return 0;

    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  private generatePerformanceReport(): void {
    const avgTime = this.getAverageProcessingTime();
    const recentErrorCount = this.errorLog.filter(
      error => Date.now() - error.timestamp.getTime() < 5 * 60 * 1000
    ).length;

    console.log(`[EcosystemManager] Performance Report:
    - Average processing time: ${avgTime.toFixed(2)}ms
    - Recent errors (5min): ${recentErrorCount}
    - Total events processed: ${this.performanceMetrics.get('event_processing_time')?.length || 0}`);
  }

  private async getSyncStatus(): Promise<'healthy' | 'warning' | 'critical'> {
    const recentErrorCount = this.errorLog.filter(
      error => Date.now() - error.timestamp.getTime() < 30 * 60 * 1000
    ).length;

    if (recentErrorCount === 0) return 'healthy';
    if (recentErrorCount <= 5) return 'warning';
    return 'critical';
  }

  private async getAdapterStats(adapter: string): Promise<{
    events: number;
    errors: number;
    lastActivity: Date | null;
  }> {
    // 실제 구현에서는 각 어댑터에서 통계를 가져와야 함
    return {
      events: Math.floor(Math.random() * 100),
      errors: Math.floor(Math.random() * 5),
      lastActivity: new Date()
    };
  }

  private logError(component: string, error: Error): void {
    const errorEntry = {
      timestamp: new Date(),
      error: error.message,
      component
    };

    this.errorLog.unshift(errorEntry);

    // 최근 500개만 유지
    if (this.errorLog.length > 500) {
      this.errorLog = this.errorLog.slice(0, 500);
    }

    console.error(`[EcosystemManager] Error in ${component}:`, error);
  }

  private async getCurrentKPIScores(): Promise<Record<AxisKey, number>> {
    // 실제로는 V2Store나 KPIContext에서 가져와야 함
    return {
      GO: 65, EC: 70, PT: 75, PF: 68, TO: 72
    };
  }

  private async applyKPIImpact(impact: { scoreAdjustments: Partial<Record<AxisKey, number>> }): Promise<Record<AxisKey, number>> {
    const currentScores = await this.getCurrentKPIScores();
    const newScores = { ...currentScores };

    Object.entries(impact.scoreAdjustments).forEach(([axis, adjustment]) => {
      if (adjustment) {
        newScores[axis as AxisKey] = Math.max(0, Math.min(100, currentScores[axis as AxisKey] + adjustment));
      }
    });

    return newScores;
  }

  // Getter 메서드들
  get isEcosystemInitialized(): boolean {
    return this.isInitialized;
  }

  get ecosystemConfig(): EcosystemConfig {
    return { ...this.config };
  }
}