import { EventEmitter } from 'events';

export interface DashboardEvent {
  id: string;
  type: string;
  source: string;
  target?: string | string[];
  payload: any;
  timestamp: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  propagation?: boolean;
  metadata?: Record<string, any>;
}

export interface EventHandler {
  id: string;
  type: string | string[];
  handler: (event: DashboardEvent) => Promise<void> | void;
  priority: number;
  once?: boolean;
  condition?: (event: DashboardEvent) => boolean;
}

export interface EventRule {
  id: string;
  name: string;
  condition: (event: DashboardEvent) => boolean;
  actions: EventAction[];
  enabled: boolean;
  throttle?: number;
  debounce?: number;
}

export interface EventAction {
  type: 'emit' | 'transform' | 'filter' | 'redirect' | 'log' | 'notify';
  config: any;
}

export interface EventMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySource: Record<string, number>;
  averageProcessingTime: number;
  errorRate: number;
  lastUpdated: number;
}

export interface EventSubscription {
  id: string;
  types: string[];
  sources?: string[];
  handler: EventHandler;
  active: boolean;
  metadata: {
    subscribed: number;
    lastTriggered?: number;
    triggerCount: number;
  };
}

export class GlobalEventCoordinator extends EventEmitter {
  private handlers = new Map<string, EventHandler>();
  private subscriptions = new Map<string, EventSubscription>();
  private eventRules = new Map<string, EventRule>();
  private eventHistory: DashboardEvent[] = [];
  private metrics: EventMetrics;
  private processing = new Map<string, Promise<void>>();
  private throttleTimers = new Map<string, number>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  private readonly maxHistorySize = 1000;
  private readonly maxConcurrentEvents = 50;

  constructor() {
    super();
    this.metrics = {
      totalEvents: 0,
      eventsByType: {},
      eventsBySource: {},
      averageProcessingTime: 0,
      errorRate: 0,
      lastUpdated: Date.now()
    };

    this.setupDefaultRules();
    this.setupMetricsCollection();
  }

  /**
   * 이벤트 발행
   */
  async publishEvent(event: Omit<DashboardEvent, 'id' | 'timestamp'>): Promise<string> {
    const fullEvent: DashboardEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      ...event
    };

    // 동시 처리 이벤트 수 제한
    if (this.processing.size >= this.maxConcurrentEvents) {
      throw new Error('Maximum concurrent events limit reached');
    }

    // 이벤트 규칙 적용
    const processedEvent = await this.applyEventRules(fullEvent);
    if (!processedEvent) {
      return fullEvent.id; // 필터링됨
    }

    // 이벤트 처리
    const processingPromise = this.processEvent(processedEvent);
    this.processing.set(fullEvent.id, processingPromise);

    try {
      await processingPromise;
    } finally {
      this.processing.delete(fullEvent.id);
    }

    return fullEvent.id;
  }

  /**
   * 이벤트 구독
   */
  subscribe(
    types: string | string[],
    handler: (event: DashboardEvent) => Promise<void> | void,
    options: {
      sources?: string[];
      priority?: number;
      once?: boolean;
      condition?: (event: DashboardEvent) => boolean;
    } = {}
  ): string {
    const subscriptionId = this.generateSubscriptionId();
    const typeArray = Array.isArray(types) ? types : [types];

    const eventHandler: EventHandler = {
      id: subscriptionId,
      type: typeArray,
      handler,
      priority: options.priority || 0,
      once: options.once,
      condition: options.condition
    };

    const subscription: EventSubscription = {
      id: subscriptionId,
      types: typeArray,
      sources: options.sources,
      handler: eventHandler,
      active: true,
      metadata: {
        subscribed: Date.now(),
        triggerCount: 0
      }
    };

    this.handlers.set(subscriptionId, eventHandler);
    this.subscriptions.set(subscriptionId, subscription);

    return subscriptionId;
  }

  /**
   * 구독 해제
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    this.handlers.delete(subscriptionId);
    this.subscriptions.delete(subscriptionId);
    return true;
  }

  /**
   * 이벤트 규칙 추가
   */
  addRule(rule: EventRule): void {
    this.eventRules.set(rule.id, rule);
  }

  /**
   * 이벤트 규칙 제거
   */
  removeRule(ruleId: string): boolean {
    return this.eventRules.delete(ruleId);
  }

  /**
   * 구독 일시 정지/재개
   */
  pauseSubscription(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }
    subscription.active = false;
    return true;
  }

  resumeSubscription(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }
    subscription.active = true;
    return true;
  }

  /**
   * 이벤트 기록 조회
   */
  getEventHistory(filters?: {
    type?: string;
    source?: string;
    timeRange?: { start: number; end: number };
    limit?: number;
  }): DashboardEvent[] {
    let history = [...this.eventHistory];

    if (filters) {
      if (filters.type) {
        history = history.filter(event => event.type === filters.type);
      }
      if (filters.source) {
        history = history.filter(event => event.source === filters.source);
      }
      if (filters.timeRange) {
        history = history.filter(event =>
          event.timestamp >= filters.timeRange!.start &&
          event.timestamp <= filters.timeRange!.end
        );
      }
      if (filters.limit) {
        history = history.slice(-filters.limit);
      }
    }

    return history;
  }

  /**
   * 메트릭 조회
   */
  getMetrics(): EventMetrics {
    return { ...this.metrics };
  }

  /**
   * 활성 구독 목록 조회
   */
  getActiveSubscriptions(): EventSubscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.active);
  }

  /**
   * 이벤트 처리
   */
  private async processEvent(event: DashboardEvent): Promise<void> {
    const startTime = Date.now();

    try {
      // 이벤트 기록 저장
      this.addToHistory(event);

      // 적용 가능한 핸들러 찾기
      const applicableHandlers = this.findApplicableHandlers(event);

      // 우선순위순으로 정렬
      applicableHandlers.sort((a, b) => b.priority - a.priority);

      // 핸들러 실행
      const handlerPromises = applicableHandlers.map(handler =>
        this.executeHandler(handler, event)
      );

      await Promise.allSettled(handlerPromises);

      // 메트릭 업데이트
      this.updateMetrics(event, Date.now() - startTime, false);

      // 내부 이벤트 발행
      this.emit('event-processed', event);

    } catch (error) {
      this.updateMetrics(event, Date.now() - startTime, true);
      this.emit('event-error', { event, error });
      throw error;
    }
  }

  /**
   * 이벤트 규칙 적용
   */
  private async applyEventRules(event: DashboardEvent): Promise<DashboardEvent | null> {
    let processedEvent = { ...event };

    for (const rule of this.eventRules.values()) {
      if (!rule.enabled || !rule.condition(processedEvent)) {
        continue;
      }

      // 스로틀링 확인
      if (rule.throttle && this.isThrottled(rule.id, rule.throttle)) {
        continue;
      }

      // 디바운싱 처리
      if (rule.debounce) {
        await this.debounce(rule.id, rule.debounce);
      }

      // 액션 실행
      for (const action of rule.actions) {
        const result = await this.executeRuleAction(action, processedEvent);
        if (result === null) {
          return null; // 이벤트 필터링됨
        }
        if (result !== undefined) {
          processedEvent = result;
        }
      }

      // 스로틀링 타이머 설정
      if (rule.throttle) {
        this.throttleTimers.set(rule.id, Date.now());
      }
    }

    return processedEvent;
  }

  /**
   * 규칙 액션 실행
   */
  private async executeRuleAction(
    action: EventAction,
    event: DashboardEvent
  ): Promise<DashboardEvent | null | undefined> {
    switch (action.type) {
      case 'emit':
        await this.publishEvent({
          type: action.config.type,
          source: 'rule-engine',
          payload: action.config.payload || event.payload,
          priority: action.config.priority || event.priority
        });
        break;

      case 'transform':
        return {
          ...event,
          ...action.config.transform(event)
        };

      case 'filter':
        return action.config.condition(event) ? event : null;

      case 'redirect':
        return {
          ...event,
          target: action.config.target
        };

      case 'log':
        console.log(`[EventCoordinator] ${action.config.level || 'info'}:`,
          action.config.message || 'Event logged', event);
        break;

      case 'notify':
        this.emit('notification', {
          type: action.config.type || 'info',
          title: action.config.title,
          message: action.config.message,
          event
        });
        break;
    }

    return undefined;
  }

  /**
   * 적용 가능한 핸들러 찾기
   */
  private findApplicableHandlers(event: DashboardEvent): EventHandler[] {
    const applicable: EventHandler[] = [];

    for (const subscription of this.subscriptions.values()) {
      if (!subscription.active) {
        continue;
      }

      // 타입 매칭
      const typeMatches = subscription.types.some(type =>
        type === '*' || type === event.type || event.type.startsWith(type + '.')
      );

      if (!typeMatches) {
        continue;
      }

      // 소스 매칭
      if (subscription.sources && !subscription.sources.includes(event.source)) {
        continue;
      }

      // 조건 확인
      if (subscription.handler.condition && !subscription.handler.condition(event)) {
        continue;
      }

      applicable.push(subscription.handler);

      // 메타데이터 업데이트
      subscription.metadata.lastTriggered = Date.now();
      subscription.metadata.triggerCount++;
    }

    return applicable;
  }

  /**
   * 핸들러 실행
   */
  private async executeHandler(handler: EventHandler, event: DashboardEvent): Promise<void> {
    try {
      await handler.handler(event);

      // once 옵션 처리
      if (handler.once) {
        this.unsubscribe(handler.id);
      }
    } catch (error) {
      this.emit('handler-error', { handler, event, error });
    }
  }

  /**
   * 이벤트 기록에 추가
   */
  private addToHistory(event: DashboardEvent): void {
    this.eventHistory.push(event);

    // 최대 크기 초과 시 오래된 이벤트 제거
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * 메트릭 업데이트
   */
  private updateMetrics(event: DashboardEvent, processingTime: number, isError: boolean): void {
    this.metrics.totalEvents++;
    this.metrics.eventsByType[event.type] = (this.metrics.eventsByType[event.type] || 0) + 1;
    this.metrics.eventsBySource[event.source] = (this.metrics.eventsBySource[event.source] || 0) + 1;

    // 평균 처리 시간 업데이트
    const totalTime = this.metrics.averageProcessingTime * (this.metrics.totalEvents - 1) + processingTime;
    this.metrics.averageProcessingTime = totalTime / this.metrics.totalEvents;

    // 에러율 업데이트
    if (isError) {
      const totalErrors = this.metrics.errorRate * (this.metrics.totalEvents - 1) + 1;
      this.metrics.errorRate = totalErrors / this.metrics.totalEvents;
    } else {
      this.metrics.errorRate = this.metrics.errorRate * (this.metrics.totalEvents - 1) / this.metrics.totalEvents;
    }

    this.metrics.lastUpdated = Date.now();
  }

  /**
   * 스로틀링 확인
   */
  private isThrottled(ruleId: string, throttleMs: number): boolean {
    const lastExecution = this.throttleTimers.get(ruleId);
    return lastExecution ? (Date.now() - lastExecution) < throttleMs : false;
  }

  /**
   * 디바운싱 처리
   */
  private debounce(ruleId: string, debounceMs: number): Promise<void> {
    return new Promise((resolve) => {
      const existingTimer = this.debounceTimers.get(ruleId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        this.debounceTimers.delete(ruleId);
        resolve();
      }, debounceMs);

      this.debounceTimers.set(ruleId, timer);
    });
  }

  /**
   * 기본 규칙 설정
   */
  private setupDefaultRules(): void {
    // 에러 이벤트 로깅
    this.addRule({
      id: 'error-logging',
      name: 'Error Event Logging',
      condition: (event) => event.type.includes('error'),
      actions: [
        {
          type: 'log',
          config: {
            level: 'error',
            message: 'Error event detected'
          }
        }
      ],
      enabled: true
    });

    // 중요 이벤트 알림
    this.addRule({
      id: 'critical-notification',
      name: 'Critical Event Notification',
      condition: (event) => event.priority === 'critical',
      actions: [
        {
          type: 'notify',
          config: {
            type: 'error',
            title: 'Critical Event',
            message: 'A critical event has occurred'
          }
        }
      ],
      enabled: true,
      throttle: 5000 // 5초 스로틀링
    });
  }

  /**
   * 메트릭 수집 설정
   */
  private setupMetricsCollection(): void {
    // 주기적으로 메트릭 정리
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 60000); // 1분마다
  }

  /**
   * 오래된 메트릭 정리
   */
  private cleanupOldMetrics(): void {
    // 24시간 이상 된 스로틀링 타이머 정리
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    for (const [ruleId, timestamp] of this.throttleTimers.entries()) {
      if (timestamp < oneDayAgo) {
        this.throttleTimers.delete(ruleId);
      }
    }
  }

  /**
   * 이벤트 ID 생성
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 구독 ID 생성
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 리소스 정리
   */
  dispose(): void {
    // 모든 타이머 정리
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.throttleTimers.clear();

    // 모든 구독 해제
    this.subscriptions.clear();
    this.handlers.clear();

    // 이벤트 리스너 제거
    this.removeAllListeners();
  }
}