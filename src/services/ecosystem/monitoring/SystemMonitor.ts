/**
 * System Monitor
 * 통합 시스템 모니터링 및 성능 추적
 */

import { EventBus } from '../EventBus';
import { DataPipeline } from '../pipeline/DataPipeline';
import { DataValidationEngine } from '../validation/DataValidationEngine';
import { TransactionManager } from '../transaction/TransactionManager';
import { AuditTracker } from '../audit/AuditTracker';

// 메트릭 타입
export type MetricType =
  | 'counter'      // 누적 카운터
  | 'gauge'        // 현재 값
  | 'histogram'    // 분포
  | 'summary';     // 요약 통계

// 시스템 헬스 상태
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'critical';

// 메트릭 정의
export interface Metric {
  name: string;
  type: MetricType;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp: Date;
}

// 시스템 헬스 체크
export interface HealthCheck {
  component: string;
  status: HealthStatus;
  message?: string;
  details?: Record<string, any>;
  lastChecked: Date;
}

// 성능 메트릭
export interface PerformanceMetrics {
  cpu: {
    usage: number; // percentage
    loadAverage: number[];
  };
  memory: {
    used: number; // bytes
    total: number;
    percentage: number;
  };
  throughput: {
    requestsPerSecond: number;
    eventsPerSecond: number;
    entitiesProcessed: number;
  };
  latency: {
    p50: number; // ms
    p95: number;
    p99: number;
    average: number;
  };
  errors: {
    rate: number;
    total: number;
    byType: Record<string, number>;
  };
}

// 시스템 상태
export interface SystemState {
  status: HealthStatus;
  uptime: number; // seconds
  components: Map<string, ComponentState>;
  metrics: PerformanceMetrics;
  alerts: Alert[];
  timestamp: Date;
}

// 컴포넌트 상태
export interface ComponentState {
  name: string;
  status: HealthStatus;
  metrics: Record<string, Metric>;
  errors: Error[];
  lastActivity: Date;
}

// 알림
export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  component: string;
  message: string;
  metric?: string;
  threshold?: number;
  currentValue?: number;
  triggeredAt: Date;
  acknowledged: boolean;
}

// 모니터링 설정
export interface MonitoringConfig {
  enabled: boolean;
  interval: number; // ms
  retention: number; // hours

  // 임계값
  thresholds: {
    errorRate: number;
    latencyP95: number;
    memoryUsage: number;
    cpuUsage: number;
  };

  // 알림 설정
  alerting: {
    enabled: boolean;
    channels: string[];
    cooldown: number; // minutes
  };
}

export class SystemMonitor {
  private static instance: SystemMonitor;

  private eventBus: EventBus;
  private config: MonitoringConfig;

  private metrics: Map<string, Metric[]>;
  private healthChecks: Map<string, HealthCheck>;
  private systemState: SystemState;
  private alerts: Map<string, Alert>;

  private monitoringInterval?: NodeJS.Timeout;
  private startTime: Date;

  // 컴포넌트 참조
  private components: Map<string, any>;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.metrics = new Map();
    this.healthChecks = new Map();
    this.alerts = new Map();
    this.components = new Map();
    this.startTime = new Date();

    // 기본 설정
    this.config = {
      enabled: true,
      interval: 5000, // 5초
      retention: 24, // 24시간
      thresholds: {
        errorRate: 0.05, // 5%
        latencyP95: 1000, // 1초
        memoryUsage: 0.9, // 90%
        cpuUsage: 0.8 // 80%
      },
      alerting: {
        enabled: true,
        channels: ['console', 'email'],
        cooldown: 5 // 5분
      }
    };

    // 초기 상태
    this.systemState = {
      status: 'healthy',
      uptime: 0,
      components: new Map(),
      metrics: this.initializeMetrics(),
      alerts: [],
      timestamp: new Date()
    };

    this.registerComponents();
    this.setupEventListeners();
  }

  public static getInstance(): SystemMonitor {
    if (!SystemMonitor.instance) {
      SystemMonitor.instance = new SystemMonitor();
    }
    return SystemMonitor.instance;
  }

  /**
   * 모니터링 시작
   */
  public start(): void {
    if (this.monitoringInterval) {
      return;
    }

    console.log('System monitoring started');

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.performHealthChecks();
      this.evaluateAlerts();
      this.updateSystemState();
      this.cleanupOldMetrics();
    }, this.config.interval);

    // 초기 수집
    this.collectMetrics();
    this.performHealthChecks();
  }

  /**
   * 모니터링 중지
   */
  public stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      console.log('System monitoring stopped');
    }
  }

  /**
   * 메트릭 수집
   */
  private collectMetrics(): void {
    // CPU 사용률 (시뮬레이션)
    this.recordMetric({
      name: 'system.cpu.usage',
      type: 'gauge',
      value: Math.random() * 100,
      unit: 'percent',
      timestamp: new Date()
    });

    // 메모리 사용률 (시뮬레이션)
    const memoryUsed = Math.random() * 8 * 1024 * 1024 * 1024; // 0-8GB
    const memoryTotal = 8 * 1024 * 1024 * 1024; // 8GB

    this.recordMetric({
      name: 'system.memory.used',
      type: 'gauge',
      value: memoryUsed,
      unit: 'bytes',
      timestamp: new Date()
    });

    this.recordMetric({
      name: 'system.memory.percentage',
      type: 'gauge',
      value: (memoryUsed / memoryTotal) * 100,
      unit: 'percent',
      timestamp: new Date()
    });

    // 컴포넌트별 메트릭 수집
    this.collectComponentMetrics();

    // 이벤트 메트릭
    this.collectEventMetrics();
  }

  /**
   * 컴포넌트 메트릭 수집
   */
  private collectComponentMetrics(): void {
    // DataPipeline 메트릭
    if (this.components.has('DataPipeline')) {
      const pipeline = this.components.get('DataPipeline') as DataPipeline;
      const stats = pipeline.getStatistics();

      this.recordMetric({
        name: 'pipeline.entities.processed',
        type: 'counter',
        value: stats.totalEntitiesProcessed,
        timestamp: new Date()
      });

      this.recordMetric({
        name: 'pipeline.throughput',
        type: 'gauge',
        value: stats.throughputPerSecond,
        timestamp: new Date()
      });
    }

    // ValidationEngine 메트릭
    if (this.components.has('ValidationEngine')) {
      const validator = DataValidationEngine.getInstance();
      const config = validator.getConfiguration();

      this.recordMetric({
        name: 'validation.active',
        type: 'gauge',
        value: config.enabled ? 1 : 0,
        timestamp: new Date()
      });
    }

    // TransactionManager 메트릭
    if (this.components.has('TransactionManager')) {
      const txManager = TransactionManager.getInstance();
      const stats = txManager.getStatistics();

      this.recordMetric({
        name: 'transactions.active',
        type: 'gauge',
        value: stats.activeTransactions,
        timestamp: new Date()
      });

      this.recordMetric({
        name: 'transactions.locks',
        type: 'gauge',
        value: stats.totalLocks,
        timestamp: new Date()
      });

      this.recordMetric({
        name: 'transactions.duration.average',
        type: 'gauge',
        value: stats.averageDuration,
        unit: 'ms',
        timestamp: new Date()
      });
    }
  }

  /**
   * 이벤트 메트릭 수집
   */
  private collectEventMetrics(): void {
    // 이벤트 발생률 계산 (시뮬레이션)
    const eventsPerSecond = Math.random() * 100;

    this.recordMetric({
      name: 'events.rate',
      type: 'gauge',
      value: eventsPerSecond,
      unit: 'events/s',
      timestamp: new Date()
    });

    // 오류율 계산
    const errorRate = Math.random() * 0.1; // 0-10%

    this.recordMetric({
      name: 'errors.rate',
      type: 'gauge',
      value: errorRate,
      unit: 'percent',
      timestamp: new Date()
    });
  }

  /**
   * 헬스 체크 수행
   */
  private performHealthChecks(): void {
    // 시스템 헬스 체크
    this.checkSystemHealth();

    // 컴포넌트 헬스 체크
    this.checkComponentHealth();

    // 의존성 헬스 체크
    this.checkDependencyHealth();
  }

  /**
   * 시스템 헬스 체크
   */
  private checkSystemHealth(): void {
    const cpuUsage = this.getLatestMetricValue('system.cpu.usage');
    const memoryUsage = this.getLatestMetricValue('system.memory.percentage');
    const errorRate = this.getLatestMetricValue('errors.rate');

    let status: HealthStatus = 'healthy';
    let message = 'System is operating normally';

    if (cpuUsage > this.config.thresholds.cpuUsage * 100) {
      status = 'degraded';
      message = 'High CPU usage detected';
    }

    if (memoryUsage > this.config.thresholds.memoryUsage * 100) {
      status = status === 'degraded' ? 'unhealthy' : 'degraded';
      message = 'High memory usage detected';
    }

    if (errorRate > this.config.thresholds.errorRate * 100) {
      status = 'unhealthy';
      message = 'High error rate detected';
    }

    this.healthChecks.set('system', {
      component: 'system',
      status,
      message,
      details: {
        cpuUsage,
        memoryUsage,
        errorRate
      },
      lastChecked: new Date()
    });
  }

  /**
   * 컴포넌트 헬스 체크
   */
  private checkComponentHealth(): void {
    for (const [name, component] of this.components) {
      let status: HealthStatus = 'healthy';
      let message = `${name} is operational`;

      // 컴포넌트별 체크 로직
      if (name === 'DataPipeline') {
        const throughput = this.getLatestMetricValue('pipeline.throughput');
        if (throughput === 0) {
          status = 'degraded';
          message = `${name} has no activity`;
        }
      }

      if (name === 'TransactionManager') {
        const activeTx = this.getLatestMetricValue('transactions.active');
        if (activeTx > 100) {
          status = 'degraded';
          message = `${name} has high transaction load`;
        }
      }

      this.healthChecks.set(name, {
        component: name,
        status,
        message,
        lastChecked: new Date()
      });
    }
  }

  /**
   * 의존성 헬스 체크
   */
  private checkDependencyHealth(): void {
    // 데이터베이스 연결 체크 (시뮬레이션)
    const dbHealthy = Math.random() > 0.05; // 95% 정상

    this.healthChecks.set('database', {
      component: 'database',
      status: dbHealthy ? 'healthy' : 'unhealthy',
      message: dbHealthy ? 'Database connection is stable' : 'Database connection issues',
      lastChecked: new Date()
    });

    // 외부 API 체크 (시뮬레이션)
    const apiHealthy = Math.random() > 0.1; // 90% 정상

    this.healthChecks.set('external-api', {
      component: 'external-api',
      status: apiHealthy ? 'healthy' : 'degraded',
      message: apiHealthy ? 'External APIs are responsive' : 'Some API latency detected',
      lastChecked: new Date()
    });
  }

  /**
   * 알림 평가
   */
  private evaluateAlerts(): void {
    if (!this.config.alerting.enabled) {
      return;
    }

    // CPU 알림
    const cpuUsage = this.getLatestMetricValue('system.cpu.usage');
    if (cpuUsage > this.config.thresholds.cpuUsage * 100) {
      this.createAlert({
        severity: 'warning',
        component: 'system',
        message: `CPU usage is ${cpuUsage.toFixed(1)}%`,
        metric: 'system.cpu.usage',
        threshold: this.config.thresholds.cpuUsage * 100,
        currentValue: cpuUsage
      });
    }

    // 메모리 알림
    const memoryUsage = this.getLatestMetricValue('system.memory.percentage');
    if (memoryUsage > this.config.thresholds.memoryUsage * 100) {
      this.createAlert({
        severity: 'warning',
        component: 'system',
        message: `Memory usage is ${memoryUsage.toFixed(1)}%`,
        metric: 'system.memory.percentage',
        threshold: this.config.thresholds.memoryUsage * 100,
        currentValue: memoryUsage
      });
    }

    // 오류율 알림
    const errorRate = this.getLatestMetricValue('errors.rate');
    if (errorRate > this.config.thresholds.errorRate * 100) {
      this.createAlert({
        severity: 'error',
        component: 'system',
        message: `Error rate is ${errorRate.toFixed(2)}%`,
        metric: 'errors.rate',
        threshold: this.config.thresholds.errorRate * 100,
        currentValue: errorRate
      });
    }

    // 헬스 체크 기반 알림
    for (const [component, health] of this.healthChecks) {
      if (health.status === 'unhealthy' || health.status === 'critical') {
        this.createAlert({
          severity: health.status === 'critical' ? 'critical' : 'error',
          component,
          message: health.message || `${component} is ${health.status}`
        });
      }
    }
  }

  /**
   * 알림 생성
   */
  private createAlert(alert: Omit<Alert, 'id' | 'triggeredAt' | 'acknowledged'>): void {
    const alertKey = `${alert.component}-${alert.metric || 'health'}`;

    // 쿨다운 체크
    const existingAlert = this.alerts.get(alertKey);
    if (existingAlert) {
      const cooldownMs = this.config.alerting.cooldown * 60 * 1000;
      if (Date.now() - existingAlert.triggeredAt.getTime() < cooldownMs) {
        return; // 쿨다운 기간 중
      }
    }

    const fullAlert: Alert = {
      ...alert,
      id: `alert-${Date.now()}`,
      triggeredAt: new Date(),
      acknowledged: false
    };

    this.alerts.set(alertKey, fullAlert);

    // 알림 전송
    this.sendAlert(fullAlert);
  }

  /**
   * 알림 전송
   */
  private sendAlert(alert: Alert): void {
    for (const channel of this.config.alerting.channels) {
      switch (channel) {
        case 'console':
          console.warn(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`);
          break;

        case 'email':
          // 이메일 전송 로직
          console.log(`Email alert would be sent: ${alert.message}`);
          break;

        case 'slack':
          // Slack 전송 로직
          console.log(`Slack alert would be sent: ${alert.message}`);
          break;
      }
    }

    // 이벤트 발생
    this.eventBus.emit('monitor:alert', alert);
  }

  /**
   * 시스템 상태 업데이트
   */
  private updateSystemState(): void {
    // 전체 상태 결정
    let overallStatus: HealthStatus = 'healthy';

    for (const health of this.healthChecks.values()) {
      if (health.status === 'critical') {
        overallStatus = 'critical';
        break;
      } else if (health.status === 'unhealthy' && overallStatus !== 'critical') {
        overallStatus = 'unhealthy';
      } else if (health.status === 'degraded' && overallStatus === 'healthy') {
        overallStatus = 'degraded';
      }
    }

    // 컴포넌트 상태 업데이트
    const componentStates = new Map<string, ComponentState>();

    for (const [name, health] of this.healthChecks) {
      componentStates.set(name, {
        name,
        status: health.status,
        metrics: this.getComponentMetrics(name),
        errors: [],
        lastActivity: new Date()
      });
    }

    // 성능 메트릭 집계
    const performanceMetrics: PerformanceMetrics = {
      cpu: {
        usage: this.getLatestMetricValue('system.cpu.usage'),
        loadAverage: [1, 5, 15].map(() => Math.random() * 2) // 시뮬레이션
      },
      memory: {
        used: this.getLatestMetricValue('system.memory.used'),
        total: 8 * 1024 * 1024 * 1024, // 8GB
        percentage: this.getLatestMetricValue('system.memory.percentage')
      },
      throughput: {
        requestsPerSecond: Math.random() * 1000,
        eventsPerSecond: this.getLatestMetricValue('events.rate'),
        entitiesProcessed: this.getLatestMetricValue('pipeline.entities.processed')
      },
      latency: {
        p50: Math.random() * 100,
        p95: Math.random() * 500,
        p99: Math.random() * 1000,
        average: Math.random() * 200
      },
      errors: {
        rate: this.getLatestMetricValue('errors.rate') / 100,
        total: Math.floor(Math.random() * 100),
        byType: {
          'validation': Math.floor(Math.random() * 30),
          'conflict': Math.floor(Math.random() * 20),
          'transaction': Math.floor(Math.random() * 10),
          'system': Math.floor(Math.random() * 40)
        }
      }
    };

    // 상태 업데이트
    this.systemState = {
      status: overallStatus,
      uptime: (Date.now() - this.startTime.getTime()) / 1000,
      components: componentStates,
      metrics: performanceMetrics,
      alerts: Array.from(this.alerts.values()).filter(a => !a.acknowledged),
      timestamp: new Date()
    };
  }

  /**
   * 컴포넌트 메트릭 조회
   */
  private getComponentMetrics(component: string): Record<string, Metric> {
    const metrics: Record<string, Metric> = {};

    for (const [name, values] of this.metrics) {
      if (name.startsWith(component.toLowerCase()) && values.length > 0) {
        metrics[name] = values[values.length - 1];
      }
    }

    return metrics;
  }

  /**
   * 최신 메트릭 값 조회
   */
  private getLatestMetricValue(name: string): number {
    const values = this.metrics.get(name);
    return values && values.length > 0 ? values[values.length - 1].value : 0;
  }

  /**
   * 메트릭 기록
   */
  private recordMetric(metric: Metric): void {
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }

    this.metrics.get(metric.name)!.push(metric);
  }

  /**
   * 오래된 메트릭 정리
   */
  private cleanupOldMetrics(): void {
    const retentionMs = this.config.retention * 60 * 60 * 1000;
    const cutoff = Date.now() - retentionMs;

    for (const [name, values] of this.metrics) {
      const filtered = values.filter(m => m.timestamp.getTime() > cutoff);
      if (filtered.length < values.length) {
        this.metrics.set(name, filtered);
      }
    }
  }

  /**
   * 컴포넌트 등록
   */
  private registerComponents(): void {
    this.components.set('DataPipeline', DataPipeline.getInstance());
    this.components.set('ValidationEngine', DataValidationEngine.getInstance());
    this.components.set('TransactionManager', TransactionManager.getInstance());
    this.components.set('AuditTracker', AuditTracker.getInstance());
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    // 에러 이벤트 수신
    this.eventBus.on('error', (error) => {
      this.recordMetric({
        name: 'errors.count',
        type: 'counter',
        value: 1,
        tags: { type: error.type || 'unknown' },
        timestamp: new Date()
      });
    });

    // 트랜잭션 이벤트 수신
    this.eventBus.on('transaction:committed', () => {
      this.recordMetric({
        name: 'transactions.committed',
        type: 'counter',
        value: 1,
        timestamp: new Date()
      });
    });

    this.eventBus.on('transaction:aborted', () => {
      this.recordMetric({
        name: 'transactions.aborted',
        type: 'counter',
        value: 1,
        timestamp: new Date()
      });
    });
  }

  /**
   * 초기 메트릭 설정
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      cpu: { usage: 0, loadAverage: [0, 0, 0] },
      memory: { used: 0, total: 0, percentage: 0 },
      throughput: {
        requestsPerSecond: 0,
        eventsPerSecond: 0,
        entitiesProcessed: 0
      },
      latency: { p50: 0, p95: 0, p99: 0, average: 0 },
      errors: { rate: 0, total: 0, byType: {} }
    };
  }

  /**
   * 공개 API
   */

  /**
   * 현재 시스템 상태 조회
   */
  public getSystemState(): SystemState {
    return { ...this.systemState };
  }

  /**
   * 헬스 체크 조회
   */
  public getHealthCheck(component?: string): HealthCheck | HealthCheck[] {
    if (component) {
      return this.healthChecks.get(component) || {
        component,
        status: 'unhealthy',
        message: 'Component not found',
        lastChecked: new Date()
      };
    }

    return Array.from(this.healthChecks.values());
  }

  /**
   * 메트릭 조회
   */
  public getMetrics(name?: string, since?: Date): Metric[] {
    if (name) {
      const values = this.metrics.get(name) || [];
      if (since) {
        return values.filter(m => m.timestamp >= since);
      }
      return [...values];
    }

    const allMetrics: Metric[] = [];
    for (const values of this.metrics.values()) {
      if (since) {
        allMetrics.push(...values.filter(m => m.timestamp >= since));
      } else {
        allMetrics.push(...values);
      }
    }

    return allMetrics;
  }

  /**
   * 알림 확인
   */
  public acknowledgeAlert(alertId: string): void {
    for (const alert of this.alerts.values()) {
      if (alert.id === alertId) {
        alert.acknowledged = true;
        break;
      }
    }
  }

  /**
   * 설정 업데이트
   */
  public updateConfig(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config };

    // 모니터링 재시작
    if (this.monitoringInterval) {
      this.stop();
      this.start();
    }
  }

  /**
   * 커스텀 메트릭 기록
   */
  public recordCustomMetric(metric: Metric): void {
    this.recordMetric(metric);
  }
}