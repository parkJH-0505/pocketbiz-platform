/**
 * Dashboard Orchestrator
 * 엔터프라이즈급 대시보드 통합 관리 시스템
 */

import { widgetEventBus, WidgetEventTypes } from '../widgets/WidgetEventBus';
import { dataSourceManager } from '../data/WidgetDataSource';
import { widgetNotificationSystem } from '../notifications/WidgetNotificationSystem';
import { widgetPerformanceMonitor } from '../performance/WidgetPerformanceMonitor';
import type { DashboardLayout, UserProfile } from '../../../stores/dashboardLayoutStore';
import type { WidgetConfig } from '../WidgetRegistry';

// 위젯 상태
export enum WidgetState {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  READY = 'ready',
  LOADING = 'loading',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  ERROR = 'error',
  DESTROYED = 'destroyed'
}

// 위젯 인스턴스
export interface WidgetInstance {
  id: string;
  widgetId: string;
  config: WidgetConfig;
  state: WidgetState;
  priority: number;
  dependencies: string[];
  metadata: {
    createdAt: number;
    lastUpdate: number;
    renderCount: number;
    errorCount: number;
    memoryUsage: number;
  };
  lifecycle: {
    onMount?: () => Promise<void>;
    onUnmount?: () => Promise<void>;
    onUpdate?: (data: any) => Promise<void>;
    onError?: (error: Error) => Promise<void>;
  };
  resources: {
    subscriptions: (() => void)[];
    timers: NodeJS.Timeout[];
    workers: Worker[];
    connections: WebSocket[];
  };
}

// 리소스 관리
export interface ResourceManager {
  memory: {
    allocated: number;
    limit: number;
    threshold: number;
  };
  performance: {
    targetFPS: number;
    currentFPS: number;
    frameBudget: number;
  };
  network: {
    activeConnections: number;
    maxConnections: number;
    bandwidth: number;
  };
}

// 실행 컨텍스트
export interface ExecutionContext {
  userId: string;
  sessionId: string;
  permissions: string[];
  environment: 'development' | 'staging' | 'production';
  features: Record<string, boolean>;
  limits: {
    maxWidgets: number;
    maxDataSources: number;
    memoryLimit: number;
    cpuQuota: number;
  };
}

// 의존성 그래프
export class DependencyGraph {
  private graph: Map<string, Set<string>> = new Map();
  private reverseGraph: Map<string, Set<string>> = new Map();

  addDependency(widget: string, dependency: string): void {
    if (!this.graph.has(widget)) {
      this.graph.set(widget, new Set());
    }
    if (!this.reverseGraph.has(dependency)) {
      this.reverseGraph.set(dependency, new Set());
    }

    this.graph.get(widget)!.add(dependency);
    this.reverseGraph.get(dependency)!.add(widget);
  }

  removeDependency(widget: string, dependency: string): void {
    this.graph.get(widget)?.delete(dependency);
    this.reverseGraph.get(dependency)?.delete(widget);
  }

  getDependencies(widget: string): string[] {
    return Array.from(this.graph.get(widget) || []);
  }

  getDependents(widget: string): string[] {
    return Array.from(this.reverseGraph.get(widget) || []);
  }

  getInitializationOrder(): string[] {
    const visited = new Set<string>();
    const order: string[] = [];
    const visiting = new Set<string>();

    const visit = (widget: string) => {
      if (visiting.has(widget)) {
        throw new Error(`Circular dependency detected: ${widget}`);
      }
      if (visited.has(widget)) return;

      visiting.add(widget);

      const dependencies = this.getDependencies(widget);
      dependencies.forEach(dep => visit(dep));

      visiting.delete(widget);
      visited.add(widget);
      order.push(widget);
    };

    Array.from(this.graph.keys()).forEach(widget => {
      if (!visited.has(widget)) {
        visit(widget);
      }
    });

    return order;
  }

  hasCycles(): boolean {
    try {
      this.getInitializationOrder();
      return false;
    } catch {
      return true;
    }
  }
}

/**
 * 대시보드 오케스트레이터 클래스
 */
export class DashboardOrchestrator {
  private instances: Map<string, WidgetInstance> = new Map();
  private dependencyGraph: DependencyGraph = new DependencyGraph();
  private resourceManager: ResourceManager;
  private executionContext: ExecutionContext;
  private initializationQueue: string[] = [];
  private shutdownQueue: string[] = [];
  private isInitialized = false;
  private frameScheduler: FrameScheduler;
  private errorHandler: ErrorHandler;

  constructor(context: ExecutionContext) {
    this.executionContext = context;
    this.resourceManager = this.initializeResourceManager();
    this.frameScheduler = new FrameScheduler();
    this.errorHandler = new ErrorHandler();

    this.setupGlobalEventHandlers();
    this.startResourceMonitoring();
  }

  /**
   * 리소스 매니저 초기화
   */
  private initializeResourceManager(): ResourceManager {
    return {
      memory: {
        allocated: 0,
        limit: this.executionContext.limits.memoryLimit || 1024 * 1024 * 1024, // 1GB
        threshold: 0.8
      },
      performance: {
        targetFPS: 60,
        currentFPS: 60,
        frameBudget: 16.67 // 60fps = 16.67ms per frame
      },
      network: {
        activeConnections: 0,
        maxConnections: 50,
        bandwidth: 0
      }
    };
  }

  /**
   * 위젯 등록
   */
  async registerWidget(
    instanceId: string,
    config: WidgetConfig,
    dependencies: string[] = [],
    priority: number = 0
  ): Promise<void> {
    // 권한 확인
    if (!this.hasPermission('widget:create')) {
      throw new Error('Insufficient permissions to create widget');
    }

    // 제한 확인
    if (this.instances.size >= this.executionContext.limits.maxWidgets) {
      throw new Error('Maximum widget limit reached');
    }

    const instance: WidgetInstance = {
      id: instanceId,
      widgetId: config.id,
      config,
      state: WidgetState.UNINITIALIZED,
      priority,
      dependencies,
      metadata: {
        createdAt: Date.now(),
        lastUpdate: Date.now(),
        renderCount: 0,
        errorCount: 0,
        memoryUsage: 0
      },
      lifecycle: {},
      resources: {
        subscriptions: [],
        timers: [],
        workers: [],
        connections: []
      }
    };

    // 의존성 등록
    dependencies.forEach(dep => {
      this.dependencyGraph.addDependency(instanceId, dep);
    });

    // 순환 의존성 검사
    if (this.dependencyGraph.hasCycles()) {
      throw new Error('Circular dependency detected');
    }

    this.instances.set(instanceId, instance);

    // 이벤트 발행
    widgetEventBus.emit(
      'orchestrator',
      WidgetEventTypes.WIDGET_MOUNTED,
      { instanceId, config }
    );
  }

  /**
   * 위젯 초기화
   */
  async initializeWidget(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Widget instance ${instanceId} not found`);
    }

    if (instance.state !== WidgetState.UNINITIALIZED) {
      return; // 이미 초기화됨
    }

    // 의존성 확인
    const dependencies = this.dependencyGraph.getDependencies(instanceId);
    for (const dep of dependencies) {
      const depInstance = this.instances.get(dep);
      if (!depInstance || depInstance.state !== WidgetState.READY) {
        throw new Error(`Dependency ${dep} is not ready`);
      }
    }

    instance.state = WidgetState.INITIALIZING;

    try {
      // 리소스 할당
      await this.allocateResources(instance);

      // 데이터 소스 연결
      await this.connectDataSources(instance);

      // 이벤트 구독 설정
      this.setupEventSubscriptions(instance);

      // 성능 모니터링 시작
      this.startPerformanceMonitoring(instance);

      // 생명주기 콜백 실행
      if (instance.lifecycle.onMount) {
        await instance.lifecycle.onMount();
      }

      instance.state = WidgetState.READY;
      instance.metadata.lastUpdate = Date.now();

      widgetEventBus.emit(
        'orchestrator',
        WidgetEventTypes.WIDGET_MOUNTED,
        { instanceId, state: 'ready' }
      );

    } catch (error) {
      instance.state = WidgetState.ERROR;
      instance.metadata.errorCount++;

      await this.errorHandler.handleError(instanceId, error as Error);

      throw error;
    }
  }

  /**
   * 대시보드 초기화
   */
  async initializeDashboard(layout: DashboardLayout): Promise<void> {
    if (this.isInitialized) {
      await this.shutdownDashboard();
    }

    try {
      // 초기화 순서 계산
      this.initializationQueue = this.dependencyGraph.getInitializationOrder();

      // 순차적 초기화
      for (const instanceId of this.initializationQueue) {
        await this.initializeWidget(instanceId);

        // 프레임 예산 체크
        if (this.frameScheduler.shouldYield()) {
          await this.frameScheduler.yieldToMain();
        }
      }

      this.isInitialized = true;

      // 전역 상태 동기화
      await this.synchronizeGlobalState();

      // 성능 최적화 시작
      this.startOptimizations();

      console.log('✅ Dashboard initialized successfully');

    } catch (error) {
      console.error('❌ Dashboard initialization failed:', error);
      await this.handleInitializationFailure(error as Error);
      throw error;
    }
  }

  /**
   * 위젯 활성화
   */
  async activateWidget(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.state !== WidgetState.READY) {
      return;
    }

    instance.state = WidgetState.ACTIVE;

    // 데이터 로딩 시작
    await this.startDataLoading(instance);

    // 알림 규칙 활성화
    this.activateNotificationRules(instance);

    widgetEventBus.emit(
      instanceId,
      WidgetEventTypes.WIDGET_FOCUS,
      { activated: true }
    );
  }

  /**
   * 위젯 일시정지
   */
  async suspendWidget(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.state !== WidgetState.ACTIVE) {
      return;
    }

    instance.state = WidgetState.SUSPENDED;

    // 데이터 로딩 중지
    this.stopDataLoading(instance);

    // 리소스 해제 (일부)
    this.releaseNonEssentialResources(instance);

    widgetEventBus.emit(
      instanceId,
      WidgetEventTypes.WIDGET_BLUR,
      { suspended: true }
    );
  }

  /**
   * 위젯 제거
   */
  async removeWidget(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    // 의존하는 위젯들 확인
    const dependents = this.dependencyGraph.getDependents(instanceId);
    if (dependents.length > 0) {
      throw new Error(`Cannot remove widget with dependents: ${dependents.join(', ')}`);
    }

    instance.state = WidgetState.DESTROYED;

    try {
      // 생명주기 콜백
      if (instance.lifecycle.onUnmount) {
        await instance.lifecycle.onUnmount();
      }

      // 리소스 정리
      await this.cleanupResources(instance);

      // 의존성 제거
      instance.dependencies.forEach(dep => {
        this.dependencyGraph.removeDependency(instanceId, dep);
      });

      this.instances.delete(instanceId);

      widgetEventBus.emit(
        'orchestrator',
        WidgetEventTypes.WIDGET_UNMOUNTED,
        { instanceId }
      );

    } catch (error) {
      console.error(`Error removing widget ${instanceId}:`, error);
    }
  }

  /**
   * 리소스 할당
   */
  private async allocateResources(instance: WidgetInstance): Promise<void> {
    // 메모리 할당 확인
    const estimatedMemory = this.estimateMemoryUsage(instance);
    if (this.resourceManager.memory.allocated + estimatedMemory > this.resourceManager.memory.limit) {
      throw new Error('Insufficient memory');
    }

    this.resourceManager.memory.allocated += estimatedMemory;
    instance.metadata.memoryUsage = estimatedMemory;
  }

  /**
   * 데이터 소스 연결
   */
  private async connectDataSources(instance: WidgetInstance): Promise<void> {
    // 위젯별 데이터 소스 설정
    const dataSources = instance.config.dataSources || [];

    for (const dsConfig of dataSources) {
      try {
        dataSourceManager.registerDataSource(dsConfig);
      } catch (error) {
        console.warn(`Failed to connect data source for ${instance.id}:`, error);
      }
    }
  }

  /**
   * 이벤트 구독 설정
   */
  private setupEventSubscriptions(instance: WidgetInstance): void {
    // 데이터 업데이트 구독
    const dataSubscription = widgetEventBus.subscribe(
      instance.id,
      WidgetEventTypes.DATA_UPDATE,
      async (data) => {
        if (instance.lifecycle.onUpdate) {
          await instance.lifecycle.onUpdate(data);
        }
        instance.metadata.lastUpdate = Date.now();
      }
    );

    instance.resources.subscriptions.push(dataSubscription);

    // 에러 이벤트 구독
    const errorSubscription = widgetEventBus.subscribe(
      instance.id,
      WidgetEventTypes.DATA_ERROR,
      async (error) => {
        instance.metadata.errorCount++;
        if (instance.lifecycle.onError) {
          await instance.lifecycle.onError(error);
        }
      }
    );

    instance.resources.subscriptions.push(errorSubscription);
  }

  /**
   * 성능 모니터링 시작
   */
  private startPerformanceMonitoring(instance: WidgetInstance): void {
    widgetPerformanceMonitor.startMonitoring();

    // 위젯별 성능 추적
    const performanceTimer = setInterval(() => {
      const metrics = widgetPerformanceMonitor.getMetrics(instance.id);
      const issues = widgetPerformanceMonitor.analyze(instance.id);

      if (issues.length > 0) {
        console.warn(`Performance issues detected for ${instance.id}:`, issues);
      }
    }, 5000);

    instance.resources.timers.push(performanceTimer);
  }

  /**
   * 데이터 로딩 시작
   */
  private async startDataLoading(instance: WidgetInstance): Promise<void> {
    instance.state = WidgetState.LOADING;

    // 데이터 소스별 로딩
    const dataSources = instance.config.dataSources || [];

    try {
      const loadPromises = dataSources.map(ds =>
        dataSourceManager.fetchData(ds.id)
      );

      const results = await Promise.allSettled(loadPromises);

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          widgetEventBus.emit(
            instance.id,
            WidgetEventTypes.DATA_UPDATE,
            result.value
          );
        } else {
          widgetEventBus.emit(
            instance.id,
            WidgetEventTypes.DATA_ERROR,
            result.reason
          );
        }
      });

      instance.state = WidgetState.ACTIVE;

    } catch (error) {
      instance.state = WidgetState.ERROR;
      throw error;
    }
  }

  /**
   * 데이터 로딩 중지
   */
  private stopDataLoading(instance: WidgetInstance): void {
    // 폴링 중지
    instance.config.dataSources?.forEach(ds => {
      // dataSourceManager.stopPolling(ds.id);
    });
  }

  /**
   * 알림 규칙 활성화
   */
  private activateNotificationRules(instance: WidgetInstance): void {
    // 위젯별 알림 규칙 등록
    const notificationRules = instance.config.notificationRules || [];

    notificationRules.forEach(rule => {
      widgetNotificationSystem.rules.addRule({
        ...rule,
        widgetId: instance.id
      });
    });
  }

  /**
   * 리소스 정리
   */
  private async cleanupResources(instance: WidgetInstance): Promise<void> {
    // 구독 해제
    instance.resources.subscriptions.forEach(unsubscribe => unsubscribe());

    // 타이머 정리
    instance.resources.timers.forEach(timer => clearInterval(timer));

    // 워커 종료
    instance.resources.workers.forEach(worker => worker.terminate());

    // 연결 종료
    instance.resources.connections.forEach(conn => conn.close());

    // 메모리 해제
    this.resourceManager.memory.allocated -= instance.metadata.memoryUsage;

    // 성능 모니터링 중지
    widgetPerformanceMonitor.stopMonitoring();
  }

  /**
   * 글로벌 이벤트 핸들러 설정
   */
  private setupGlobalEventHandlers(): void {
    // 페이지 가시성 변경
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.instances.forEach((instance, id) => {
          if (instance.state === WidgetState.ACTIVE) {
            this.suspendWidget(id);
          }
        });
      } else {
        this.instances.forEach((instance, id) => {
          if (instance.state === WidgetState.SUSPENDED) {
            this.activateWidget(id);
          }
        });
      }
    });

    // 메모리 압박 감지
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usage = memory.usedJSHeapSize / memory.totalJSHeapSize;

        if (usage > this.resourceManager.memory.threshold) {
          this.handleMemoryPressure();
        }
      }, 10000);
    }
  }

  /**
   * 메모리 압박 처리
   */
  private async handleMemoryPressure(): Promise<void> {
    console.warn('🔴 Memory pressure detected, suspending low-priority widgets');

    // 우선순위가 낮은 위젯들 일시정지
    const sortedInstances = Array.from(this.instances.entries())
      .sort(([, a], [, b]) => a.priority - b.priority);

    for (const [id, instance] of sortedInstances) {
      if (instance.state === WidgetState.ACTIVE && instance.priority < 5) {
        await this.suspendWidget(id);

        // 메모리 사용량 재확인
        const memory = (performance as any).memory;
        const usage = memory.usedJSHeapSize / memory.totalJSHeapSize;

        if (usage < this.resourceManager.memory.threshold) {
          break;
        }
      }
    }
  }

  /**
   * 리소스 모니터링 시작
   */
  private startResourceMonitoring(): void {
    setInterval(() => {
      this.updatePerformanceMetrics();
      this.checkResourceLimits();
    }, 1000);
  }

  /**
   * 성능 지표 업데이트
   */
  private updatePerformanceMetrics(): void {
    // FPS 계산
    this.resourceManager.performance.currentFPS = this.frameScheduler.getCurrentFPS();
  }

  /**
   * 리소스 제한 확인
   */
  private checkResourceLimits(): void {
    const { memory, performance } = this.resourceManager;

    // 메모리 사용량 체크
    if (memory.allocated > memory.limit * 0.9) {
      console.warn('⚠️ Memory usage approaching limit');
    }

    // FPS 체크
    if (performance.currentFPS < performance.targetFPS * 0.8) {
      console.warn('⚠️ Performance degradation detected');
    }
  }

  /**
   * 권한 확인
   */
  private hasPermission(permission: string): boolean {
    return this.executionContext.permissions.includes(permission) ||
           this.executionContext.permissions.includes('*');
  }

  /**
   * 메모리 사용량 추정
   */
  private estimateMemoryUsage(instance: WidgetInstance): number {
    // 기본 메모리 + 위젯 타입별 추가 메모리
    const baseMemory = 1024 * 1024; // 1MB
    const typeMultiplier = this.getTypeMemoryMultiplier(instance.config.type);

    return baseMemory * typeMultiplier;
  }

  /**
   * 위젯 타입별 메모리 배수
   */
  private getTypeMemoryMultiplier(type: string): number {
    const multipliers: Record<string, number> = {
      'chart': 3,
      'table': 2,
      'map': 4,
      'video': 5,
      'default': 1
    };

    return multipliers[type] || multipliers.default;
  }

  /**
   * 전역 상태 동기화
   */
  private async synchronizeGlobalState(): Promise<void> {
    // 모든 위젯의 초기 상태를 동기화
    widgetEventBus.emit(
      'orchestrator',
      'global:sync',
      {
        instances: Array.from(this.instances.keys()),
        timestamp: Date.now()
      }
    );
  }

  /**
   * 최적화 시작
   */
  private startOptimizations(): void {
    // 지연 로딩 최적화
    this.optimizeLazyLoading();

    // 배치 업데이트 최적화
    this.optimizeBatchUpdates();
  }

  /**
   * 지연 로딩 최적화
   */
  private optimizeLazyLoading(): void {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const instanceId = entry.target.getAttribute('data-widget-id');
        if (instanceId) {
          if (entry.isIntersecting) {
            this.activateWidget(instanceId);
          } else {
            this.suspendWidget(instanceId);
          }
        }
      });
    }, { threshold: 0.1 });

    // 관찰할 요소들 등록은 위젯 컴포넌트에서 처리
  }

  /**
   * 배치 업데이트 최적화
   */
  private optimizeBatchUpdates(): void {
    let pendingUpdates: string[] = [];

    const processBatch = () => {
      if (pendingUpdates.length === 0) return;

      const batch = [...pendingUpdates];
      pendingUpdates = [];

      batch.forEach(instanceId => {
        const instance = this.instances.get(instanceId);
        if (instance) {
          // 배치로 업데이트 처리
          this.processBatchUpdate(instance);
        }
      });
    };

    // 16ms마다 배치 처리 (60fps)
    setInterval(processBatch, 16);

    // 업데이트 요청을 배치에 추가
    widgetEventBus.subscribe('orchestrator', 'batch:update', (data) => {
      if (!pendingUpdates.includes(data.instanceId)) {
        pendingUpdates.push(data.instanceId);
      }
    });
  }

  /**
   * 배치 업데이트 처리
   */
  private processBatchUpdate(instance: WidgetInstance): void {
    // 실제 배치 업데이트 로직
    instance.metadata.renderCount++;
  }

  /**
   * 초기화 실패 처리
   */
  private async handleInitializationFailure(error: Error): Promise<void> {
    console.error('Dashboard initialization failed:', error);

    // 부분적으로 초기화된 위젯들 정리
    for (const [id, instance] of this.instances) {
      if (instance.state === WidgetState.INITIALIZING) {
        await this.removeWidget(id);
      }
    }

    this.isInitialized = false;
  }

  /**
   * 대시보드 종료
   */
  async shutdownDashboard(): Promise<void> {
    console.log('🔄 Shutting down dashboard...');

    // 모든 위젯 제거 (역순)
    this.shutdownQueue = [...this.initializationQueue].reverse();

    for (const instanceId of this.shutdownQueue) {
      try {
        await this.removeWidget(instanceId);
      } catch (error) {
        console.error(`Error removing widget ${instanceId}:`, error);
      }
    }

    this.instances.clear();
    this.isInitialized = false;

    console.log('✅ Dashboard shutdown complete');
  }

  /**
   * 상태 조회
   */
  getState(): {
    initialized: boolean;
    instances: number;
    resourceUsage: ResourceManager;
    performance: any;
  } {
    return {
      initialized: this.isInitialized,
      instances: this.instances.size,
      resourceUsage: this.resourceManager,
      performance: {
        fps: this.resourceManager.performance.currentFPS,
        frameScheduler: this.frameScheduler.getStats()
      }
    };
  }

  /**
   * 위젯 인스턴스 조회
   */
  getInstance(instanceId: string): WidgetInstance | undefined {
    return this.instances.get(instanceId);
  }

  /**
   * 모든 인스턴스 조회
   */
  getAllInstances(): WidgetInstance[] {
    return Array.from(this.instances.values());
  }
}

/**
 * 프레임 스케줄러
 */
class FrameScheduler {
  private frameTimes: number[] = [];
  private lastFrameTime = 0;

  getCurrentFPS(): number {
    const now = performance.now();
    this.frameTimes.push(now);

    // 최근 1초간의 프레임만 유지
    this.frameTimes = this.frameTimes.filter(time => now - time < 1000);

    return this.frameTimes.length;
  }

  shouldYield(): boolean {
    const now = performance.now();
    const frameTime = now - this.lastFrameTime;

    return frameTime > 16.67; // 60fps 기준
  }

  async yieldToMain(): Promise<void> {
    return new Promise(resolve => {
      this.lastFrameTime = performance.now();
      setTimeout(resolve, 0);
    });
  }

  getStats() {
    return {
      frameCount: this.frameTimes.length,
      averageFrameTime: this.frameTimes.length > 0
        ? (this.frameTimes[this.frameTimes.length - 1] - this.frameTimes[0]) / this.frameTimes.length
        : 0
    };
  }
}

/**
 * 에러 핸들러
 */
class ErrorHandler {
  async handleError(instanceId: string, error: Error): Promise<void> {
    console.error(`Widget ${instanceId} error:`, error);

    // 에러 리포팅
    this.reportError(instanceId, error);

    // 복구 시도
    await this.attemptRecovery(instanceId, error);
  }

  private reportError(instanceId: string, error: Error): void {
    widgetEventBus.emit(
      'orchestrator',
      WidgetEventTypes.DATA_ERROR,
      {
        instanceId,
        error: error.message,
        stack: error.stack,
        timestamp: Date.now()
      }
    );
  }

  private async attemptRecovery(instanceId: string, error: Error): Promise<void> {
    // 자동 복구 로직
    console.log(`Attempting recovery for ${instanceId}...`);
  }
}

// 개발 모드에서 전역 접근 가능
if (process.env.NODE_ENV === 'development') {
  (window as any).DashboardOrchestrator = DashboardOrchestrator;
}