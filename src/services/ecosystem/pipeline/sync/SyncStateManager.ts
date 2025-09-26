/**
 * Sync State Manager
 * 동기화 상태를 관리하고 모니터링하는 시스템
 */

import { CentralEventBus } from '../../EventBus';
import type {
  SyncState,
  SystemSyncState,
  SyncOperation,
  SyncError,
  SyncStatistics,
  SystemSyncStatistics,
  EntitySyncStatistics,
  SyncPerformanceMetrics
} from './types';
import type { DataSourceType } from '../types';
import type { UnifiedEntityType } from '../transform/types';

interface StateSnapshot {
  timestamp: Date;
  state: SyncState;
  operations: number;
  errors: number;
}

interface HealthMetric {
  name: string;
  value: number;
  threshold: number;
  status: 'healthy' | 'warning' | 'critical';
  lastUpdated: Date;
}

export class SyncStateManager {
  private static instance: SyncStateManager;

  private eventBus: CentralEventBus;
  private currentState: SyncState;
  private statistics: SyncStatistics;
  private healthMetrics: Map<string, HealthMetric> = new Map();
  private stateHistory: StateSnapshot[] = [];

  // 상태 업데이트 타이머
  private updateInterval?: NodeJS.Timeout;
  private snapshotInterval?: NodeJS.Timeout;

  private constructor() {
    this.eventBus = CentralEventBus.getInstance();
    this.currentState = this.initializeState();
    this.statistics = this.initializeStatistics();
    this.initializeHealthMetrics();
  }

  static getInstance(): SyncStateManager {
    if (!SyncStateManager.instance) {
      SyncStateManager.instance = new SyncStateManager();
    }
    return SyncStateManager.instance;
  }

  /**
   * 상태 관리 시작
   */
  async start(): Promise<void> {
    console.log('📊 [SyncStateManager] Starting state management...');

    this.currentState.isRunning = true;
    this.currentState.lastSyncAt = new Date();

    // 정기 상태 업데이트
    this.startPeriodicUpdate();

    // 스냅샷 생성
    this.startSnapshotCapture();

    console.log('✅ [SyncStateManager] State management started');
  }

  /**
   * 상태 관리 중지
   */
  async stop(): Promise<void> {
    console.log('🛑 [SyncStateManager] Stopping state management...');

    this.currentState.isRunning = false;

    // 타이머 중지
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }

    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
      this.snapshotInterval = undefined;
    }

    // 마지막 스냅샷 저장
    this.captureSnapshot();

    console.log('✅ [SyncStateManager] State management stopped');
  }

  /**
   * 성공 기록
   */
  recordSuccess(operation: SyncOperation): void {
    const systemState = this.getOrCreateSystemState(operation.targetSystem);

    // 시스템별 통계 업데이트
    systemState.completedToday++;
    systemState.averageLatency = this.updateAverageLatency(
      systemState.averageLatency,
      operation.performance.totalProcessingTime
    );

    // 전체 통계 업데이트
    this.statistics.successfulOperations++;
    this.statistics.totalOperations++;

    // 엔터티별 통계 업데이트
    this.updateEntityStatistics(operation, 'success');

    // 성능 메트릭 업데이트
    this.updateGlobalMetrics(operation);

    console.log(`[SyncStateManager] Success recorded: ${operation.id} -> ${operation.targetSystem}`);
  }

  /**
   * 실패 기록
   */
  recordFailure(operation: SyncOperation, error: SyncError): void {
    const systemState = this.getOrCreateSystemState(operation.targetSystem);

    // 시스템별 통계 업데이트
    systemState.failedToday++;
    systemState.errorRate = systemState.failedToday /
      (systemState.completedToday + systemState.failedToday);

    // 전체 통계 업데이트
    this.statistics.failedOperations++;
    this.statistics.totalOperations++;

    // 오류 통계 업데이트
    this.statistics.errorFrequency[error.code] =
      (this.statistics.errorFrequency[error.code] || 0) + 1;

    // 엔터티별 통계 업데이트
    this.updateEntityStatistics(operation, 'failure');

    console.log(`[SyncStateManager] Failure recorded: ${operation.id} -> ${operation.targetSystem}`);

    // 건강도 점수 업데이트
    this.updateHealthScore();
  }

  /**
   * 충돌 기록
   */
  recordConflict(operation: SyncOperation, conflicts: any[]): void {
    const systemState = this.getOrCreateSystemState(operation.targetSystem);

    // 통계 업데이트
    this.statistics.conflictedOperations++;
    this.statistics.totalOperations++;

    // 엔터티별 충돌률 업데이트
    const entityStats = this.getOrCreateEntityStatistics(operation.entityType);
    entityStats.totalOperations++;

    const totalConflicts = this.statistics.conflictedOperations;
    const totalOpsForEntity = entityStats.totalOperations;
    entityStats.conflictRate = totalConflicts / totalOpsForEntity;

    console.log(`[SyncStateManager] Conflict recorded: ${operation.id} (${conflicts.length} conflicts)`);
  }

  /**
   * 시스템 온라인 상태 업데이트
   */
  updateSystemOnlineStatus(systemId: DataSourceType, isOnline: boolean): void {
    const systemState = this.getOrCreateSystemState(systemId);
    systemState.isOnline = isOnline;
    systemState.lastHeartbeat = new Date();

    console.log(`[SyncStateManager] System ${systemId} online status: ${isOnline}`);

    // 건강도 업데이트
    this.updateHealthScore();
  }

  /**
   * 대기열 크기 업데이트
   */
  updateQueueSizes(
    systemId: DataSourceType,
    pending: number,
    inProgress: number,
    backlog: number
  ): void {
    const systemState = this.getOrCreateSystemState(systemId);
    systemState.pendingOperations = pending;
    systemState.inProgressOperations = inProgress;
    systemState.backlogSize = backlog;

    // 오래된 대기 작업 시간 업데이트 (시뮬레이션)
    if (backlog > 0) {
      systemState.oldestPendingOperation = new Date(Date.now() - backlog * 1000);
    }
  }

  /**
   * 현재 상태 조회
   */
  getStatus(): SyncState {
    return { ...this.currentState };
  }

  /**
   * 통계 조회
   */
  getStatistics(): SyncStatistics {
    return { ...this.statistics };
  }

  /**
   * 건강도 메트릭 조회
   */
  getHealthMetrics(): HealthMetric[] {
    return Array.from(this.healthMetrics.values());
  }

  /**
   * 상태 히스토리 조회
   */
  getStateHistory(hours: number = 24): StateSnapshot[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.stateHistory.filter(snapshot => snapshot.timestamp > cutoff);
  }

  /**
   * 시스템별 상태 상세 조회
   */
  getSystemDetail(systemId: DataSourceType): SystemSyncState | undefined {
    return this.currentState.systemStates.get(systemId);
  }

  /**
   * 시스템 상태 가져오기 또는 생성
   */
  private getOrCreateSystemState(systemId: DataSourceType): SystemSyncState {
    let systemState = this.currentState.systemStates.get(systemId);

    if (!systemState) {
      systemState = {
        systemId,
        isOnline: true,
        lastHeartbeat: new Date(),
        pendingOperations: 0,
        inProgressOperations: 0,
        completedToday: 0,
        failedToday: 0,
        averageLatency: 0,
        throughput: 0,
        errorRate: 0,
        backlogSize: 0
      };

      this.currentState.systemStates.set(systemId, systemState);
      console.log(`[SyncStateManager] Created system state for ${systemId}`);
    }

    return systemState;
  }

  /**
   * 엔터티별 통계 업데이트
   */
  private updateEntityStatistics(operation: SyncOperation, result: 'success' | 'failure'): void {
    const entityStats = this.getOrCreateEntityStatistics(operation.entityType);

    entityStats.totalOperations++;

    switch (operation.operationType) {
      case 'create':
        entityStats.createOperations++;
        break;
      case 'update':
        entityStats.updateOperations++;
        break;
      case 'delete':
        entityStats.deleteOperations++;
        break;
    }

    // 평균 크기 업데이트 (시뮬레이션)
    const estimatedSize = JSON.stringify(operation.sourceEntity).length;
    entityStats.averageSize = (entityStats.averageSize + estimatedSize) / 2;
  }

  /**
   * 엔터티 통계 가져오기 또는 생성
   */
  private getOrCreateEntityStatistics(entityType: UnifiedEntityType): EntitySyncStatistics {
    if (!this.statistics.entityStats[entityType]) {
      this.statistics.entityStats[entityType] = {
        entityType,
        totalOperations: 0,
        createOperations: 0,
        updateOperations: 0,
        deleteOperations: 0,
        conflictRate: 0,
        averageSize: 0
      };
    }

    return this.statistics.entityStats[entityType];
  }

  /**
   * 평균 지연시간 업데이트
   */
  private updateAverageLatency(currentAverage: number, newLatency: number): number {
    // 지수 평활법 사용
    const alpha = 0.1;
    return currentAverage * (1 - alpha) + newLatency * alpha;
  }

  /**
   * 전역 메트릭 업데이트
   */
  private updateGlobalMetrics(operation: SyncOperation): void {
    const metrics = this.currentState.globalMetrics;

    // 처리 시간 업데이트
    metrics.totalProcessingTime += operation.performance.totalProcessingTime;

    // 지연시간 메트릭 업데이트 (시뮬레이션)
    metrics.averageLatency = this.updateAverageLatency(
      metrics.averageLatency,
      operation.performance.totalProcessingTime
    );

    // 성공률 계산
    metrics.successRate = this.statistics.successfulOperations / this.statistics.totalOperations;
  }

  /**
   * 건강도 점수 업데이트
   */
  private updateHealthScore(): void {
    let healthScore = 100;
    const healthIssues: string[] = [];

    // 시스템 온라인 상태 체크
    const offlineSystems = Array.from(this.currentState.systemStates.values())
      .filter(system => !system.isOnline);

    if (offlineSystems.length > 0) {
      healthScore -= offlineSystems.length * 20;
      healthIssues.push(`${offlineSystems.length} systems offline`);
    }

    // 오류율 체크
    const totalOps = this.statistics.totalOperations;
    const errorRate = totalOps > 0 ? this.statistics.failedOperations / totalOps : 0;

    if (errorRate > 0.1) {
      healthScore -= 30; // 10% 이상 오류율
      healthIssues.push(`High error rate: ${(errorRate * 100).toFixed(1)}%`);
    } else if (errorRate > 0.05) {
      healthScore -= 15; // 5% 이상 오류율
      healthIssues.push(`Elevated error rate: ${(errorRate * 100).toFixed(1)}%`);
    }

    // 백로그 크기 체크
    const totalBacklog = Array.from(this.currentState.systemStates.values())
      .reduce((sum, system) => sum + system.backlogSize, 0);

    if (totalBacklog > 100) {
      healthScore -= 20;
      healthIssues.push(`Large backlog: ${totalBacklog} operations`);
    } else if (totalBacklog > 50) {
      healthScore -= 10;
      healthIssues.push(`Growing backlog: ${totalBacklog} operations`);
    }

    // 지연시간 체크
    const avgLatency = this.currentState.globalMetrics.averageLatency;
    if (avgLatency > 5000) { // 5초 이상
      healthScore -= 15;
      healthIssues.push(`High latency: ${avgLatency}ms`);
    } else if (avgLatency > 2000) { // 2초 이상
      healthScore -= 5;
      healthIssues.push(`Elevated latency: ${avgLatency}ms`);
    }

    this.currentState.healthScore = Math.max(0, healthScore);
    this.currentState.healthIssues = healthIssues;

    // 건강도 상태 결정
    if (healthScore >= 90) {
      this.currentState.healthStatus = 'healthy';
    } else if (healthScore >= 70) {
      this.currentState.healthStatus = 'degraded';
    } else {
      this.currentState.healthStatus = 'critical';
    }

    // 건강도 메트릭 업데이트
    this.updateHealthMetric('overall_health', healthScore, 90, 'Overall system health');
  }

  /**
   * 건강도 메트릭 업데이트
   */
  private updateHealthMetric(
    name: string,
    value: number,
    threshold: number,
    description: string
  ): void {
    const status: 'healthy' | 'warning' | 'critical' =
      value >= threshold ? 'healthy' :
      value >= threshold * 0.8 ? 'warning' : 'critical';

    this.healthMetrics.set(name, {
      name: description,
      value,
      threshold,
      status,
      lastUpdated: new Date()
    });
  }

  /**
   * 정기 상태 업데이트 시작
   */
  private startPeriodicUpdate(): void {
    this.updateInterval = setInterval(() => {
      this.performPeriodicUpdate();
    }, 5000); // 5초마다 업데이트

    console.log('[SyncStateManager] Periodic updates started');
  }

  /**
   * 정기 상태 업데이트 수행
   */
  private performPeriodicUpdate(): void {
    // 처리량 계산
    this.calculateThroughput();

    // 건강도 업데이트
    this.updateHealthScore();

    // 시간별 통계 업데이트
    this.updateHourlyStatistics();

    // 시스템별 성능 메트릭 업데이트
    this.updateSystemMetrics();
  }

  /**
   * 처리량 계산
   */
  private calculateThroughput(): void {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // 최근 1분간 완료된 작업 수 계산 (시뮬레이션)
    const recentOperations = this.statistics.successfulOperations; // 실제로는 시간 필터링 필요

    this.currentState.globalMetrics.operationsPerSecond = recentOperations / 60;

    // 시스템별 처리량 업데이트
    for (const systemState of this.currentState.systemStates.values()) {
      systemState.throughput = systemState.completedToday / 3600; // 시간당 처리량 추정
    }
  }

  /**
   * 시간별 통계 업데이트
   */
  private updateHourlyStatistics(): void {
    const currentHour = new Date().getHours().toString();

    if (!this.statistics.operationsPerHour[currentHour]) {
      this.statistics.operationsPerHour[currentHour] = 0;
    }

    // 현재 시간의 작업 수 업데이트 (증분)
    this.statistics.operationsPerHour[currentHour]++;

    // 평균 처리 시간 업데이트
    const totalTime = this.currentState.globalMetrics.totalProcessingTime;
    const totalOps = this.statistics.totalOperations;

    if (totalOps > 0) {
      this.statistics.averageProcessingTime = totalTime / totalOps;
    }
  }

  /**
   * 시스템별 메트릭 업데이트
   */
  private updateSystemMetrics(): void {
    for (const [systemId, systemState] of this.currentState.systemStates.entries()) {
      // 시스템별 통계 업데이트
      if (!this.statistics.systemStats[systemId]) {
        this.statistics.systemStats[systemId] = {
          systemId,
          totalOperations: 0,
          successRate: 1,
          averageLatency: 0,
          errorCount: 0,
          lastSyncTime: new Date()
        };
      }

      const systemStats = this.statistics.systemStats[systemId];
      systemStats.totalOperations = systemState.completedToday + systemState.failedToday;
      systemStats.successRate = systemStats.totalOperations > 0 ?
        systemState.completedToday / systemStats.totalOperations : 1;
      systemStats.averageLatency = systemState.averageLatency;
      systemStats.errorCount = systemState.failedToday;
      systemStats.lastSyncTime = systemState.lastHeartbeat;
    }
  }

  /**
   * 스냅샷 캡처 시작
   */
  private startSnapshotCapture(): void {
    this.snapshotInterval = setInterval(() => {
      this.captureSnapshot();
    }, 300000); // 5분마다 스냅샷

    console.log('[SyncStateManager] Snapshot capture started');
  }

  /**
   * 상태 스냅샷 생성
   */
  private captureSnapshot(): void {
    const snapshot: StateSnapshot = {
      timestamp: new Date(),
      state: { ...this.currentState },
      operations: this.statistics.totalOperations,
      errors: this.statistics.failedOperations
    };

    this.stateHistory.push(snapshot);

    // 히스토리 크기 제한 (최근 24시간)
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    this.stateHistory = this.stateHistory.filter(s => s.timestamp.getTime() > cutoff);

    console.log(`[SyncStateManager] Snapshot captured (${this.stateHistory.length} total)`);
  }

  /**
   * 상태 초기화
   */
  private initializeState(): SyncState {
    return {
      isRunning: false,
      lastSyncAt: new Date(),
      systemStates: new Map(),
      globalMetrics: {
        operationsPerSecond: 0,
        bytesPerSecond: 0,
        averageLatency: 0,
        p50Latency: 0,
        p95Latency: 0,
        p99Latency: 0,
        successRate: 1,
        totalProcessingTime: 0,
        startTime: new Date()
      },
      healthScore: 100,
      healthStatus: 'healthy',
      healthIssues: []
    };
  }

  /**
   * 통계 초기화
   */
  private initializeStatistics(): SyncStatistics {
    return {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      conflictedOperations: 0,
      operationsPerHour: {},
      averageProcessingTime: 0,
      systemStats: {},
      entityStats: {},
      errorFrequency: {},
      conflictPatterns: []
    };
  }

  /**
   * 건강도 메트릭 초기화
   */
  private initializeHealthMetrics(): void {
    this.updateHealthMetric('overall_health', 100, 90, 'Overall system health');
    this.updateHealthMetric('error_rate', 0, 0.05, 'Error rate percentage');
    this.updateHealthMetric('average_latency', 0, 2000, 'Average latency in ms');
    this.updateHealthMetric('backlog_size', 0, 50, 'Total backlog size');
  }

  /**
   * 통계 리셋
   */
  resetStatistics(): void {
    this.statistics = this.initializeStatistics();
    this.stateHistory = [];

    // 시스템 상태의 일일 카운터 리셋
    for (const systemState of this.currentState.systemStates.values()) {
      systemState.completedToday = 0;
      systemState.failedToday = 0;
      systemState.errorRate = 0;
    }

    console.log('[SyncStateManager] Statistics reset');
  }

  /**
   * 정리
   */
  dispose(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
    }

    this.currentState.systemStates.clear();
    this.healthMetrics.clear();
    this.stateHistory = [];

    console.log('[SyncStateManager] Disposed');
  }
}