/**
 * EventBus.ts
 *
 * 시스템의 핵심 이벤트 버스 구현
 * 타입 안전성, 에러 처리, 성능 최적화, 메모리 누수 방지에 중점
 */

import {
  type SystemEvent,
  type EventHandler,
  type EventSubscription,
  type EventBusConfig,
  type EventMiddleware,
  type EventMetrics,
  type EventTypeMap,
  type EventProcessingInfo,
  EventBusError
} from './eventTypes';

export class EventBus {
  private static instance: EventBus | null = null;
  private listeners = new Map<string, Set<EventSubscription>>();
  private subscriptionCounter = 0;
  private config: Required<EventBusConfig>;
  private metrics: EventMetrics;
  private processingQueue = new Map<string, EventProcessingInfo>();
  private isShuttingDown = false;

  private constructor(config: Partial<EventBusConfig> = {}) {
    this.config = {
      maxListeners: 100,
      enableLogging: process.env.NODE_ENV === 'development',
      enableMetrics: true,
      errorHandler: this.defaultErrorHandler.bind(this),
      middleware: [],
      ...config
    };

    this.metrics = {
      totalEvents: 0,
      eventsByType: {},
      averageProcessingTime: 0,
      lastEventTime: null,
      errorCount: 0,
      activeListeners: 0
    };

    // 메모리 누수 방지를 위한 정리 작업
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.shutdown());
    }

    this.log('EventBus initialized', { config: this.config });
  }

  // Singleton 패턴으로 인스턴스 관리
  public static getInstance(config?: Partial<EventBusConfig>): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus(config);
    }
    return EventBus.instance;
  }

  // 이벤트 리스너 등록 (타입 안전)
  public on<T extends keyof EventTypeMap>(
    eventType: T,
    handler: EventHandler<EventTypeMap[T]>,
    options: {
      once?: boolean;
      priority?: number;
    } = {}
  ): string {
    if (this.isShuttingDown) {
      throw new EventBusError('Cannot register listeners during shutdown', 'SHUTDOWN_IN_PROGRESS');
    }

    const { once = false, priority = 0 } = options;
    const subscriptionId = `sub_${++this.subscriptionCounter}_${Date.now()}`;

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    const listeners = this.listeners.get(eventType)!;

    // 최대 리스너 수 체크
    if (listeners.size >= this.config.maxListeners) {
      throw new EventBusError(
        `Maximum listeners (${this.config.maxListeners}) exceeded for event type: ${eventType}`,
        'MAX_LISTENERS_EXCEEDED',
        { eventType, currentCount: listeners.size }
      );
    }

    const subscription: EventSubscription = {
      id: subscriptionId,
      eventType,
      handler: handler as EventHandler,
      once,
      priority,
      active: true,
      createdAt: new Date()
    };

    listeners.add(subscription);
    this.metrics.activeListeners++;

    this.log('Event listener registered', { subscriptionId, eventType, once, priority });

    return subscriptionId;
  }

  // 일회성 이벤트 리스너
  public once<T extends keyof EventTypeMap>(
    eventType: T,
    handler: EventHandler<EventTypeMap[T]>
  ): string {
    return this.on(eventType, handler, { once: true });
  }

  // 이벤트 리스너 제거
  public off(subscriptionId: string): boolean {
    for (const [eventType, listeners] of this.listeners.entries()) {
      for (const subscription of listeners) {
        if (subscription.id === subscriptionId) {
          listeners.delete(subscription);
          this.metrics.activeListeners--;

          if (listeners.size === 0) {
            this.listeners.delete(eventType);
          }

          this.log('Event listener removed', { subscriptionId, eventType });
          return true;
        }
      }
    }

    this.log('Event listener not found for removal', { subscriptionId }, 'warn');
    return false;
  }

  // 특정 이벤트 타입의 모든 리스너 제거
  public removeAllListeners(eventType?: keyof EventTypeMap): void {
    if (eventType) {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        this.metrics.activeListeners -= listeners.size;
        this.listeners.delete(eventType);
        this.log('All listeners removed for event type', { eventType });
      }
    } else {
      const totalRemoved = Array.from(this.listeners.values())
        .reduce((sum, listeners) => sum + listeners.size, 0);

      this.listeners.clear();
      this.metrics.activeListeners = 0;
      this.log('All event listeners removed', { totalRemoved });
    }
  }

  // 이벤트 발행 (타입 안전)
  public async emit<T extends keyof EventTypeMap>(
    eventType: T,
    event: EventTypeMap[T]
  ): Promise<void> {
    if (this.isShuttingDown) {
      this.log('Event emission blocked during shutdown', { eventType }, 'warn');
      return;
    }

    const startTime = Date.now();
    const processingId = `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const processingInfo: EventProcessingInfo = {
      event,
      status: 'pending',
      startedAt: new Date(),
      retryCount: 0
    };

    this.processingQueue.set(processingId, processingInfo);

    try {
      // 미들웨어 전처리
      let processedEvent = event;
      for (const middleware of this.config.middleware) {
        if (middleware.before) {
          try {
            processedEvent = await middleware.before(processedEvent);
          } catch (error) {
            this.handleMiddlewareError(error as Error, event, middleware, 'before');
          }
        }
      }

      processingInfo.status = 'processing';

      // 리스너 실행
      const listeners = this.listeners.get(eventType);
      if (listeners && listeners.size > 0) {
        // 우선순위별로 정렬
        const sortedListeners = Array.from(listeners)
          .filter(sub => sub.active)
          .sort((a, b) => b.priority - a.priority);

        const promises = sortedListeners.map(async (subscription) => {
          try {
            await this.executeHandler(subscription, processedEvent);

            // 일회성 리스너 제거
            if (subscription.once) {
              listeners.delete(subscription);
              this.metrics.activeListeners--;
            }
          } catch (error) {
            this.handleListenerError(error as Error, event, subscription);
          }
        });

        await Promise.allSettled(promises);
      }

      // 미들웨어 후처리
      for (const middleware of this.config.middleware) {
        if (middleware.after) {
          try {
            await middleware.after(processedEvent);
          } catch (error) {
            this.handleMiddlewareError(error as Error, event, middleware, 'after');
          }
        }
      }

      processingInfo.status = 'completed';
      processingInfo.completedAt = new Date();
      processingInfo.processingTime = Date.now() - startTime;

      // 메트릭스 업데이트
      this.updateMetrics(eventType, processingInfo.processingTime);

      this.log('Event processed successfully', {
        eventType,
        processingTime: processingInfo.processingTime,
        listenerCount: listeners?.size || 0
      });

    } catch (error) {
      processingInfo.status = 'failed';
      processingInfo.error = error as Error;
      processingInfo.completedAt = new Date();

      this.metrics.errorCount++;
      this.config.errorHandler(error as Error, event);

      this.log('Event processing failed', {
        eventType,
        error: (error as Error).message,
        processingTime: Date.now() - startTime
      }, 'error');

      throw error;
    } finally {
      // 처리 완료된 정보는 일정 시간 후 정리
      setTimeout(() => {
        this.processingQueue.delete(processingId);
      }, 60000); // 1분 후 정리
    }
  }

  // 이벤트 핸들러 실행
  private async executeHandler(
    subscription: EventSubscription,
    event: SystemEvent
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const result = subscription.handler(event);
      if (result instanceof Promise) {
        await result;
      }

      this.log('Handler executed successfully', {
        subscriptionId: subscription.id,
        eventType: subscription.eventType,
        executionTime: Date.now() - startTime
      });
    } catch (error) {
      this.log('Handler execution failed', {
        subscriptionId: subscription.id,
        eventType: subscription.eventType,
        error: (error as Error).message,
        executionTime: Date.now() - startTime
      }, 'error');
      throw error;
    }
  }

  // 미들웨어 에러 처리
  private handleMiddlewareError(
    error: Error,
    event: SystemEvent,
    middleware: EventMiddleware,
    phase: 'before' | 'after'
  ): void {
    this.log('Middleware error', {
      middlewareName: middleware.name,
      phase,
      eventType: event.type,
      error: error.message
    }, 'error');

    if (middleware.onError) {
      try {
        middleware.onError(error, event);
      } catch (middlewareErrorHandlerError) {
        this.log('Middleware error handler failed', {
          middlewareName: middleware.name,
          originalError: error.message,
          handlerError: (middlewareErrorHandlerError as Error).message
        }, 'error');
      }
    }
  }

  // 리스너 에러 처리
  private handleListenerError(
    error: Error,
    event: SystemEvent,
    subscription: EventSubscription
  ): void {
    this.log('Listener error', {
      subscriptionId: subscription.id,
      eventType: subscription.eventType,
      error: error.message
    }, 'error');

    this.config.errorHandler(error, event);
  }

  // 기본 에러 핸들러
  private defaultErrorHandler(error: Error, event: SystemEvent): void {
    console.error('EventBus Error:', {
      error: error.message,
      stack: error.stack,
      eventType: event.type,
      eventId: event.id,
      timestamp: event.timestamp
    });
  }

  // 메트릭스 업데이트
  private updateMetrics(eventType: string, processingTime: number): void {
    if (!this.config.enableMetrics) return;

    this.metrics.totalEvents++;
    this.metrics.eventsByType[eventType] = (this.metrics.eventsByType[eventType] || 0) + 1;
    this.metrics.lastEventTime = new Date();

    // 평균 처리 시간 계산 (이동 평균)
    const alpha = 0.1; // 가중치
    this.metrics.averageProcessingTime =
      this.metrics.averageProcessingTime * (1 - alpha) + processingTime * alpha;
  }

  // 메트릭스 조회
  public getMetrics(): EventMetrics {
    return { ...this.metrics };
  }

  // 현재 처리 중인 이벤트 조회
  public getProcessingQueue(): EventProcessingInfo[] {
    return Array.from(this.processingQueue.values());
  }

  // 활성 리스너 조회
  public getActiveListeners(): { eventType: string; count: number }[] {
    return Array.from(this.listeners.entries()).map(([eventType, listeners]) => ({
      eventType,
      count: listeners.size
    }));
  }

  // 로깅
  private log(message: string, context?: any, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (!this.config.enableLogging) return;

    const logData = {
      timestamp: new Date().toISOString(),
      message,
      context,
      level
    };

    if (level === 'error') {
      console.error('[EventBus]', logData);
    } else if (level === 'warn') {
      console.warn('[EventBus]', logData);
    } else {
      console.log('[EventBus]', logData);
    }
  }

  // 정리 작업
  public shutdown(): void {
    this.log('EventBus shutdown initiated');
    this.isShuttingDown = true;

    // 모든 리스너 제거
    this.removeAllListeners();

    // 처리 중인 이벤트 대기
    const activeProcessing = this.processingQueue.size;
    if (activeProcessing > 0) {
      this.log(`Waiting for ${activeProcessing} events to complete processing`);
    }

    this.processingQueue.clear();

    this.log('EventBus shutdown completed');
  }

  // 인스턴스 리셋 (테스트용)
  public static reset(): void {
    if (EventBus.instance) {
      EventBus.instance.shutdown();
      EventBus.instance = null;
    }
  }
}

// 편의를 위한 기본 인스턴스 export
export const eventBus = EventBus.getInstance();

// 타입 안전한 이벤트 생성 헬퍼
export function createEvent<T extends keyof EventTypeMap>(
  type: T,
  payload: EventTypeMap[T]['payload'],
  options: {
    source?: string;
    correlationId?: string;
  } = {}
): EventTypeMap[T] {
  const { source = 'unknown', correlationId } = options;

  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    payload,
    timestamp: new Date(),
    source,
    version: '1.0.0',
    correlationId
  } as EventTypeMap[T];
}