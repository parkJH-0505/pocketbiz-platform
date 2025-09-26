/**
 * Central Event Bus
 * 중앙 이벤트 허브 - 모든 시스템 간 통신의 중심
 */

import type {
  BaseEvent,
  EventHandler,
  EventSubscription,
  EventLog,
  EventConflict,
  ConflictResolution
} from './types';

export class CentralEventBus {
  private static instance: CentralEventBus;
  private subscribers: Map<string, EventSubscription[]> = new Map();
  private eventLog: EventLog[] = [];
  private conflictQueue: EventConflict[] = [];
  private isProcessing: boolean = false;
  private maxLogSize: number = 1000;
  private retryAttempts: number = 3;

  // 싱글톤 패턴
  static getInstance(): CentralEventBus {
    if (!CentralEventBus.instance) {
      CentralEventBus.instance = new CentralEventBus();
    }
    return CentralEventBus.instance;
  }

  private constructor() {
    // 정기적으로 오래된 로그 정리
    this.startLogCleanup();
    // 충돌 해결 프로세서 시작
    this.startConflictProcessor();
  }

  /**
   * 이벤트 발행
   */
  async emit<T extends BaseEvent>(event: T): Promise<void> {
    const eventId = this.generateEventId();
    const enrichedEvent: T = {
      ...event,
      id: eventId,
      timestamp: Date.now()
    };

    // 로그에 기록
    const logEntry: EventLog = {
      ...enrichedEvent,
      processed: false
    };
    this.eventLog.unshift(logEntry);

    console.log(`[EventBus] Emitting event: ${event.type}`, enrichedEvent);

    try {
      // 구독자들에게 이벤트 전파
      await this.processEvent(enrichedEvent);

      // 로그 업데이트
      this.updateLogEntry(eventId, { processed: true });

    } catch (error) {
      console.error(`[EventBus] Error processing event ${eventId}:`, error);
      this.updateLogEntry(eventId, {
        processed: false,
        errors: [error instanceof Error ? error.message : String(error)]
      });
    }

    // 로그 크기 관리
    this.trimEventLog();
  }

  /**
   * 이벤트 구독
   */
  subscribe<T extends BaseEvent>(
    eventType: string,
    handler: EventHandler<T>,
    priority: number = 5
  ): string {
    const subscriptionId = this.generateSubscriptionId();

    const subscription: EventSubscription = {
      id: subscriptionId,
      eventType,
      handler: handler as EventHandler,
      priority,
      active: true
    };

    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }

    const eventSubscriptions = this.subscribers.get(eventType)!;
    eventSubscriptions.push(subscription);

    // 우선순위 순으로 정렬
    eventSubscriptions.sort((a, b) => a.priority - b.priority);

    console.log(`[EventBus] Subscribed to ${eventType} with priority ${priority}`);

    return subscriptionId;
  }

  /**
   * 구독 해제
   */
  unsubscribe(subscriptionId: string): boolean {
    for (const [eventType, subscriptions] of this.subscribers.entries()) {
      const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        subscriptions.splice(index, 1);
        console.log(`[EventBus] Unsubscribed ${subscriptionId} from ${eventType}`);
        return true;
      }
    }
    return false;
  }

  /**
   * 구독 비활성화/활성화
   */
  toggleSubscription(subscriptionId: string, active: boolean): boolean {
    for (const subscriptions of this.subscribers.values()) {
      const subscription = subscriptions.find(sub => sub.id === subscriptionId);
      if (subscription) {
        subscription.active = active;
        return true;
      }
    }
    return false;
  }

  /**
   * 이벤트 처리
   */
  private async processEvent<T extends BaseEvent>(event: T): Promise<void> {
    const subscriptions = this.subscribers.get(event.type) || [];
    const activeSubscriptions = subscriptions.filter(sub => sub.active);

    if (activeSubscriptions.length === 0) {
      console.log(`[EventBus] No active subscribers for ${event.type}`);
      return;
    }

    // 병렬 처리를 위한 Promise 배열
    const handlerPromises = activeSubscriptions.map(async (subscription) => {
      const startTime = Date.now();

      try {
        await subscription.handler(event);
        const processingTime = Date.now() - startTime;
        console.log(`[EventBus] Handler ${subscription.id} processed ${event.type} in ${processingTime}ms`);
      } catch (error) {
        console.error(`[EventBus] Handler ${subscription.id} failed for ${event.type}:`, error);

        // 재시도 로직
        if (this.shouldRetry(event, error)) {
          await this.scheduleRetry(event, subscription);
        }

        throw error; // 에러를 상위로 전파
      }
    });

    // 모든 핸들러 실행 (하나 실패해도 다른 핸들러는 계속 실행)
    const results = await Promise.allSettled(handlerPromises);

    // 실패한 핸들러 로깅
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const subscription = activeSubscriptions[index];
        console.error(`[EventBus] Handler ${subscription.id} rejected:`, result.reason);
      }
    });
  }

  /**
   * 재시도 로직
   */
  private shouldRetry(event: BaseEvent, error: any): boolean {
    // 네트워크 오류나 임시적 오류인 경우 재시도
    if (error instanceof Error) {
      const retryableErrors = ['Network', 'Timeout', 'Temporary'];
      return retryableErrors.some(keyword => error.message.includes(keyword));
    }
    return false;
  }

  private async scheduleRetry(event: BaseEvent, subscription: EventSubscription): Promise<void> {
    const currentRetries = this.getEventRetries(event.id) || 0;

    if (currentRetries < this.retryAttempts) {
      const delay = Math.pow(2, currentRetries) * 1000; // 지수 백오프

      setTimeout(async () => {
        console.log(`[EventBus] Retrying event ${event.id}, attempt ${currentRetries + 1}`);
        this.incrementEventRetries(event.id);

        try {
          await subscription.handler(event);
        } catch (error) {
          console.error(`[EventBus] Retry failed for ${event.id}:`, error);
        }
      }, delay);
    }
  }

  /**
   * 이벤트 로그 관리
   */
  private updateLogEntry(eventId: string, updates: Partial<EventLog>): void {
    const logEntry = this.eventLog.find(log => log.id === eventId);
    if (logEntry) {
      Object.assign(logEntry, updates);
    }
  }

  private getEventRetries(eventId: string): number {
    const logEntry = this.eventLog.find(log => log.id === eventId);
    return logEntry?.retries || 0;
  }

  private incrementEventRetries(eventId: string): void {
    const logEntry = this.eventLog.find(log => log.id === eventId);
    if (logEntry) {
      logEntry.retries = (logEntry.retries || 0) + 1;
    }
  }

  private trimEventLog(): void {
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(0, this.maxLogSize);
    }
  }

  private startLogCleanup(): void {
    setInterval(() => {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      this.eventLog = this.eventLog.filter(log => log.timestamp > oneHourAgo);
    }, 10 * 60 * 1000); // 10분마다 정리
  }

  /**
   * 충돌 감지 및 해결
   */
  private startConflictProcessor(): void {
    setInterval(() => {
      if (this.conflictQueue.length > 0 && !this.isProcessing) {
        this.processConflicts();
      }
    }, 5000); // 5초마다 충돌 처리
  }

  private async processConflicts(): Promise<void> {
    this.isProcessing = true;

    try {
      const conflicts = [...this.conflictQueue];
      this.conflictQueue = [];

      for (const conflict of conflicts) {
        await this.resolveConflict(conflict);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async resolveConflict(conflict: EventConflict): Promise<void> {
    console.log(`[EventBus] Resolving conflict ${conflict.id}:`, conflict);

    // 간단한 자동 해결 로직
    switch (conflict.suggestedResolution) {
      case 'merge':
        await this.mergeConflictingEvents(conflict);
        break;
      case 'prioritize':
        await this.prioritizeConflictingEvents(conflict);
        break;
      case 'user_decision':
        await this.requestUserDecision(conflict);
        break;
      default:
        console.warn(`[EventBus] Unknown resolution strategy for conflict ${conflict.id}`);
    }
  }

  private async mergeConflictingEvents(conflict: EventConflict): Promise<void> {
    // 이벤트 병합 로직 (구체적 구현은 이벤트 타입에 따라 달라짐)
    console.log(`[EventBus] Merging conflicting events for ${conflict.id}`);
  }

  private async prioritizeConflictingEvents(conflict: EventConflict): Promise<void> {
    // 우선순위에 따라 하나만 선택
    const highestPriorityEvent = conflict.conflictingEvents[0];
    await this.emit(highestPriorityEvent);
  }

  private async requestUserDecision(conflict: EventConflict): Promise<void> {
    // 사용자 개입 요청 (UI 알림 등)
    console.log(`[EventBus] User decision required for conflict ${conflict.id}`);
  }

  /**
   * 유틸리티 메서드
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 디버깅 및 모니터링 메서드
   */
  getEventLog(limit: number = 50): EventLog[] {
    return this.eventLog.slice(0, limit);
  }

  getSubscriptions(): Map<string, EventSubscription[]> {
    return new Map(this.subscribers);
  }

  getStats(): {
    totalEvents: number;
    activeSubscriptions: number;
    pendingConflicts: number;
    errorRate: number;
  } {
    const totalEvents = this.eventLog.length;
    const activeSubscriptions = Array.from(this.subscribers.values())
      .flat()
      .filter(sub => sub.active).length;
    const errors = this.eventLog.filter(log => log.errors && log.errors.length > 0).length;

    return {
      totalEvents,
      activeSubscriptions,
      pendingConflicts: this.conflictQueue.length,
      errorRate: totalEvents > 0 ? errors / totalEvents : 0
    };
  }

  // 개발/테스트용 메서드
  clear(): void {
    this.subscribers.clear();
    this.eventLog = [];
    this.conflictQueue = [];
  }
}