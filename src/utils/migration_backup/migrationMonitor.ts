/**
 * @fileoverview 마이그레이션 실시간 모니터링 시스템
 * @description Sprint 3 - Stage 3: 성능 모니터링 및 메트릭 수집
 * @author PocketCompany
 * @since 2025-01-23
 */

// 브라우저 호환 EventEmitter (Node.js events 모듈 대신)
class EventEmitter {
  private events: Map<string, Set<Function>> = new Map();

  on(event: string, handler: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);
  }

  off(event: string, handler: Function): void {
    if (this.events.has(event)) {
      this.events.get(event)!.delete(handler);
    }
  }

  emit(event: string, ...args: any[]): void {
    if (this.events.has(event)) {
      this.events.get(event)!.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}

import type { MigrationResult } from './dataMigration';
import type { MigrationState } from './migrationManager';

/**
 * 성능 메트릭
 */
export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  itemsProcessed: number;
  itemsPerSecond: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage?: number;
  errors: number;
  warnings: number;
}

/**
 * 모니터링 이벤트
 */
export interface MonitoringEvent {
  id: string;
  timestamp: Date;
  type: 'start' | 'progress' | 'complete' | 'error' | 'warning' | 'metric';
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  data?: any;
  metrics?: Partial<PerformanceMetrics>;
}

/**
 * 실시간 상태
 */
export interface RealtimeStatus {
  state: MigrationState;
  progress: number;
  currentPhase: string;
  itemsProcessed: number;
  itemsTotal: number;
  estimatedTimeRemaining: number;
  currentSpeed: number;
  averageSpeed: number;
  peakSpeed: number;
  errors: number;
  warnings: number;
}

/**
 * 병목 구간 정보
 */
export interface BottleneckInfo {
  phase: string;
  duration: number;
  percentage: number;
  description?: string;
}

/**
 * 메트릭 스냅샷
 */
export interface MetricSnapshot {
  timestamp: Date;
  metrics: PerformanceMetrics;
  status: RealtimeStatus;
}

/**
 * 모니터링 설정
 */
export interface MonitoringConfig {
  enabled: boolean;
  collectInterval: number; // milliseconds
  maxEventHistory: number;
  maxMetricHistory: number;
  alertThresholds: {
    errorRate: number;
    memoryUsage: number;
    processingSpeed: number;
  };
}

/**
 * 마이그레이션 모니터
 */
export class MigrationMonitor extends EventEmitter {
  private static instance: MigrationMonitor | null = null;

  // 메트릭 수집
  private metrics: PerformanceMetrics;
  private metricHistory: MetricSnapshot[] = [];
  private eventHistory: MonitoringEvent[] = [];

  // 실시간 상태
  private realtimeStatus: RealtimeStatus;

  // 타이머
  private collectTimer: NodeJS.Timeout | null = null;
  private startTime: number = 0;

  // 설정
  private config: MonitoringConfig = {
    enabled: true,
    collectInterval: 1000, // 1초마다
    maxEventHistory: 100,
    maxMetricHistory: 60,
    alertThresholds: {
      errorRate: 0.1, // 10%
      memoryUsage: 0.8, // 80%
      processingSpeed: 1 // 1 item/sec
    }
  };

  // 통계
  private totalItems: number = 0;
  private processedItems: number = 0;
  private speedHistory: number[] = [];

  private constructor() {
    super();
    this.initializeMetrics();
    this.initializeStatus();
  }

  /**
   * 싱글톤 인스턴스
   */
  public static getInstance(): MigrationMonitor {
    if (!MigrationMonitor.instance) {
      MigrationMonitor.instance = new MigrationMonitor();
    }
    return MigrationMonitor.instance;
  }

  /**
   * 메트릭 초기화
   */
  private initializeMetrics(): void {
    this.metrics = {
      startTime: 0,
      itemsProcessed: 0,
      itemsPerSecond: 0,
      memoryUsage: {
        used: 0,
        total: 0,
        percentage: 0
      },
      errors: 0,
      warnings: 0
    };
  }

  /**
   * 상태 초기화
   */
  private initializeStatus(): void {
    this.realtimeStatus = {
      state: 'idle',
      progress: 0,
      currentPhase: 'idle',
      itemsProcessed: 0,
      itemsTotal: 0,
      estimatedTimeRemaining: 0,
      currentSpeed: 0,
      averageSpeed: 0,
      peakSpeed: 0,
      errors: 0,
      warnings: 0
    };
  }

  /**
   * 모니터링 시작
   */
  public start(totalItems?: number): void {
    if (!this.config.enabled) return;

    this.startTime = Date.now();
    this.totalItems = totalItems || 0;
    this.processedItems = 0;
    this.speedHistory = [];

    this.metrics.startTime = this.startTime;
    this.realtimeStatus.state = 'running';
    this.realtimeStatus.itemsTotal = this.totalItems;

    // 메트릭 수집 시작
    this.startMetricCollection();

    // 시작 이벤트
    this.recordEvent({
      type: 'start',
      level: 'info',
      message: `Migration monitoring started. Total items: ${this.totalItems}`
    });

    this.emit('start', this.realtimeStatus);
  }

  /**
   * 모니터링 중지
   */
  public stop(): void {
    if (this.collectTimer) {
      clearInterval(this.collectTimer);
      this.collectTimer = null;
    }

    this.metrics.endTime = Date.now();
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime;
    this.realtimeStatus.state = 'completed';

    // 완료 이벤트
    this.recordEvent({
      type: 'complete',
      level: 'info',
      message: `Migration completed. Processed: ${this.processedItems}/${this.totalItems}`,
      metrics: this.metrics
    });

    this.emit('stop', this.realtimeStatus);
  }

  /**
   * 진행률 업데이트
   */
  public updateProgress(processed: number, total?: number): void {
    this.processedItems = processed;
    if (total !== undefined) {
      this.totalItems = total;
    }

    const progress = this.totalItems > 0 ? (this.processedItems / this.totalItems) * 100 : 0;

    this.realtimeStatus.progress = Math.min(100, Math.round(progress));
    this.realtimeStatus.itemsProcessed = this.processedItems;
    this.realtimeStatus.itemsTotal = this.totalItems;

    // 속도 계산
    const elapsed = (Date.now() - this.startTime) / 1000; // seconds
    if (elapsed > 0) {
      this.realtimeStatus.currentSpeed = this.processedItems / elapsed;
      this.speedHistory.push(this.realtimeStatus.currentSpeed);

      // 평균 속도
      this.realtimeStatus.averageSpeed =
        this.speedHistory.reduce((a, b) => a + b, 0) / this.speedHistory.length;

      // 최고 속도
      this.realtimeStatus.peakSpeed = Math.max(...this.speedHistory);

      // 예상 남은 시간
      const remaining = this.totalItems - this.processedItems;
      if (this.realtimeStatus.averageSpeed > 0) {
        this.realtimeStatus.estimatedTimeRemaining = remaining / this.realtimeStatus.averageSpeed;
      }
    }

    this.emit('progress', this.realtimeStatus);
  }

  /**
   * 단계 변경
   */
  public updatePhase(phase: string): void {
    this.realtimeStatus.currentPhase = phase;

    this.recordEvent({
      type: 'progress',
      level: 'info',
      message: `Phase changed to: ${phase}`
    });

    this.emit('phaseChange', phase);
  }

  /**
   * 에러 기록
   */
  public recordError(error: Error | string, critical: boolean = false): void {
    this.metrics.errors++;
    this.realtimeStatus.errors++;

    const message = error instanceof Error ? error.message : error;

    this.recordEvent({
      type: 'error',
      level: critical ? 'critical' : 'error',
      message,
      data: error instanceof Error ? { stack: error.stack } : undefined
    });

    // 에러율 체크
    if (this.processedItems > 0) {
      const errorRate = this.metrics.errors / this.processedItems;
      if (errorRate > this.config.alertThresholds.errorRate) {
        this.emit('alert', {
          type: 'high_error_rate',
          rate: errorRate,
          threshold: this.config.alertThresholds.errorRate
        });
      }
    }
  }

  /**
   * 경고 기록
   */
  public recordWarning(message: string): void {
    this.metrics.warnings++;
    this.realtimeStatus.warnings++;

    this.recordEvent({
      type: 'warning',
      level: 'warning',
      message
    });
  }

  /**
   * 이벤트 기록
   */
  private recordEvent(event: Partial<MonitoringEvent>): void {
    const fullEvent: MonitoringEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type: event.type || 'metric',
      level: event.level || 'info',
      message: event.message || '',
      data: event.data,
      metrics: event.metrics
    };

    this.eventHistory.push(fullEvent);

    // 이벤트 이력 크기 제한
    if (this.eventHistory.length > this.config.maxEventHistory) {
      this.eventHistory = this.eventHistory.slice(-this.config.maxEventHistory);
    }

    this.emit('event', fullEvent);
  }

  /**
   * 메트릭 수집 시작
   */
  private startMetricCollection(): void {
    if (this.collectTimer) return;

    this.collectTimer = setInterval(() => {
      this.collectMetrics();
    }, this.config.collectInterval);
  }

  /**
   * 메트릭 수집
   */
  private collectMetrics(): void {
    // 메모리 사용량 (브라우저 환경에서 제한적)
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: memory.usedJSHeapSize / memory.totalJSHeapSize
      };

      // 메모리 사용량 체크
      if (this.metrics.memoryUsage.percentage > this.config.alertThresholds.memoryUsage) {
        this.emit('alert', {
          type: 'high_memory_usage',
          usage: this.metrics.memoryUsage.percentage,
          threshold: this.config.alertThresholds.memoryUsage
        });
      }
    }

    // 처리 속도
    const elapsed = (Date.now() - this.startTime) / 1000;
    if (elapsed > 0) {
      this.metrics.itemsPerSecond = this.processedItems / elapsed;

      // 속도 체크
      if (this.metrics.itemsPerSecond < this.config.alertThresholds.processingSpeed) {
        this.emit('alert', {
          type: 'low_processing_speed',
          speed: this.metrics.itemsPerSecond,
          threshold: this.config.alertThresholds.processingSpeed
        });
      }
    }

    // 메트릭 스냅샷 저장
    const snapshot: MetricSnapshot = {
      timestamp: new Date(),
      metrics: { ...this.metrics },
      status: { ...this.realtimeStatus }
    };

    this.metricHistory.push(snapshot);

    // 메트릭 이력 크기 제한
    if (this.metricHistory.length > this.config.maxMetricHistory) {
      this.metricHistory = this.metricHistory.slice(-this.config.maxMetricHistory);
    }

    this.emit('metrics', this.metrics);
  }

  /**
   * 병목 구간 분석
   */
  public analyzeBottlenecks(): BottleneckInfo[] {
    const bottlenecks: BottleneckInfo[] = [];
    const phaseDurations: Map<string, number> = new Map();

    // 이벤트에서 단계별 시간 계산
    let lastPhaseTime = this.startTime;
    let lastPhase = 'start';

    this.eventHistory.forEach(event => {
      if (event.type === 'progress' && event.message.includes('Phase changed')) {
        const duration = event.timestamp.getTime() - lastPhaseTime;
        const existing = phaseDurations.get(lastPhase) || 0;
        phaseDurations.set(lastPhase, existing + duration);
        lastPhaseTime = event.timestamp.getTime();
        lastPhase = event.message.split(': ')[1] || 'unknown';
      }
    });

    // 전체 시간 계산
    const totalDuration = Date.now() - this.startTime;

    // 병목 구간 식별
    phaseDurations.forEach((duration, phase) => {
      const percentage = (duration / totalDuration) * 100;
      if (percentage > 20) { // 20% 이상 시간 소요
        bottlenecks.push({
          phase,
          duration,
          percentage,
          description: `This phase took ${percentage.toFixed(1)}% of total time`
        });
      }
    });

    return bottlenecks.sort((a, b) => b.percentage - a.percentage);
  }

  /**
   * 현재 상태 조회
   */
  public getStatus(): RealtimeStatus {
    return { ...this.realtimeStatus };
  }

  /**
   * 메트릭 조회
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 이벤트 이력 조회
   */
  public getEventHistory(limit?: number): MonitoringEvent[] {
    if (limit) {
      return this.eventHistory.slice(-limit);
    }
    return [...this.eventHistory];
  }

  /**
   * 메트릭 이력 조회
   */
  public getMetricHistory(limit?: number): MetricSnapshot[] {
    if (limit) {
      return this.metricHistory.slice(-limit);
    }
    return [...this.metricHistory];
  }

  /**
   * 설정 업데이트
   */
  public updateConfig(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config };

    // 수집 간격 변경 시 타이머 재시작
    if (config.collectInterval && this.collectTimer) {
      clearInterval(this.collectTimer);
      this.startMetricCollection();
    }
  }

  /**
   * 통계 요약
   */
  public getSummary(): {
    totalDuration: number;
    totalProcessed: number;
    averageSpeed: number;
    peakSpeed: number;
    errorRate: number;
    warningRate: number;
    bottlenecks: BottleneckInfo[];
  } {
    const duration = this.metrics.duration || (Date.now() - this.startTime);

    return {
      totalDuration: duration,
      totalProcessed: this.processedItems,
      averageSpeed: this.realtimeStatus.averageSpeed,
      peakSpeed: this.realtimeStatus.peakSpeed,
      errorRate: this.processedItems > 0 ? this.metrics.errors / this.processedItems : 0,
      warningRate: this.processedItems > 0 ? this.metrics.warnings / this.processedItems : 0,
      bottlenecks: this.analyzeBottlenecks()
    };
  }

  /**
   * 초기화
   */
  public reset(): void {
    this.stop();
    this.initializeMetrics();
    this.initializeStatus();
    this.metricHistory = [];
    this.eventHistory = [];
    this.speedHistory = [];
    this.totalItems = 0;
    this.processedItems = 0;
    console.log('🔄 Migration monitor reset');
  }
}

// 싱글톤 인스턴스 export
export const migrationMonitor = MigrationMonitor.getInstance();

// 개발 환경 디버깅용
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).__migrationMonitor__ = migrationMonitor;
}