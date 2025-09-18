/**
 * @fileoverview Context 간 이벤트 조정자
 * @description 다중 Context 간의 이벤트 흐름을 조정하고 충돌을 방지
 * @author PocketCompany
 * @since 2025-01-18
 */

import {
  EventSourceTracker,
  CONTEXT_EVENTS,
  type ScheduleEventDetail,
  type BuildupEventDetail,
  type SyncDirection,
  logEvent
} from '../types/events.types';

/**
 * Context 간 동기화 설정
 */
export interface SyncConfiguration {
  /** 동기화 활성화 여부 */
  enabled: boolean;

  /** 동기화 방향 */
  direction: SyncDirection;

  /** 디바운스 지연 시간 (ms) */
  debounceDelay: number;

  /** 배치 처리 크기 */
  batchSize: number;

  /** 충돌 해결 전략 */
  conflictResolution: 'schedule-wins' | 'buildup-wins' | 'latest-wins' | 'merge';

  /** 에러 재시도 횟수 */
  maxRetries: number;
}

/**
 * 이벤트 큐 항목
 */
interface QueuedEvent {
  id: string;
  type: string;
  detail: ScheduleEventDetail | BuildupEventDetail;
  retryCount: number;
  timestamp: number;
}

/**
 * Context 간 이벤트 조정자 클래스
 * Singleton 패턴으로 전역에서 하나의 인스턴스만 관리
 */
export class EventCoordinator {
  private static instance: EventCoordinator | null = null;

  // 설정
  private config: SyncConfiguration = {
    enabled: true,
    direction: 'bidirectional',
    debounceDelay: 100,
    batchSize: 10,
    conflictResolution: 'latest-wins',
    maxRetries: 3
  };

  // 이벤트 큐
  private eventQueue: QueuedEvent[] = [];
  private processingQueue = false;
  private debounceTimer: NodeJS.Timeout | null = null;

  // 리스너 등록 상태
  private listenersRegistered = false;
  private cleanupFunctions: Array<() => void> = [];

  // 통계
  private stats = {
    eventsProcessed: 0,
    eventsSkipped: 0,
    errors: 0,
    lastSyncTime: 0
  };

  private constructor() {
    this.initialize();
  }

  /**
   * Singleton 인스턴스 획득
   */
  static getInstance(): EventCoordinator {
    if (!EventCoordinator.instance) {
      EventCoordinator.instance = new EventCoordinator();
    }
    return EventCoordinator.instance;
  }

  /**
   * 초기화
   */
  private initialize(): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 [EventCoordinator] Initializing...');
    }

    // 브라우저 환경에서만 실행
    if (typeof window !== 'undefined') {
      // 페이지 언로드 시 정리
      window.addEventListener('beforeunload', () => this.shutdown());
    }
  }

  /**
   * 설정 업데이트
   */
  updateConfig(config: Partial<SyncConfiguration>): void {
    this.config = { ...this.config, ...config };
    logEvent('CONFIG_UPDATED', {
      action: 'updated',
      source: 'System',
      timestamp: Date.now()
    } as any, 'EventCoordinator');
  }

  /**
   * ScheduleContext → BuildupContext 이벤트 처리
   */
  handleScheduleEvent(event: CustomEvent<ScheduleEventDetail>): void {
    if (!this.config.enabled) return;

    const { detail } = event;
    const eventId = detail.eventId || EventSourceTracker.createEventId(detail);

    // 순환 참조 체크
    if (!EventSourceTracker.shouldProcess(eventId)) {
      this.stats.eventsSkipped++;
      logEvent('CIRCULAR_REF_PREVENTED', detail, 'EventCoordinator');
      return;
    }

    // 동기화 방향 체크
    if (this.config.direction === 'buildup-to-schedule') {
      this.stats.eventsSkipped++;
      return;
    }

    // 큐에 추가
    this.enqueueEvent({
      id: eventId,
      type: 'schedule',
      detail,
      retryCount: 0,
      timestamp: Date.now()
    });
  }

  /**
   * BuildupContext → ScheduleContext 이벤트 처리
   */
  handleBuildupEvent(event: CustomEvent<BuildupEventDetail>): void {
    if (!this.config.enabled) return;

    const { detail } = event;
    const eventId = detail.eventId || EventSourceTracker.createEventId(detail);

    // 순환 참조 체크
    if (!EventSourceTracker.shouldProcess(eventId)) {
      this.stats.eventsSkipped++;
      logEvent('CIRCULAR_REF_PREVENTED', detail, 'EventCoordinator');
      return;
    }

    // 동기화 방향 체크
    if (this.config.direction === 'schedule-to-buildup') {
      this.stats.eventsSkipped++;
      return;
    }

    // 큐에 추가
    this.enqueueEvent({
      id: eventId,
      type: 'buildup',
      detail,
      retryCount: 0,
      timestamp: Date.now()
    });
  }

  /**
   * 이벤트 큐에 추가
   */
  private enqueueEvent(event: QueuedEvent): void {
    this.eventQueue.push(event);

    // 디바운스 처리
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.processQueue();
    }, this.config.debounceDelay);
  }

  /**
   * 큐 처리
   */
  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.eventQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      // 배치 처리
      const batch = this.eventQueue.splice(0, this.config.batchSize);

      for (const event of batch) {
        try {
          await this.processEvent(event);
          this.stats.eventsProcessed++;
          EventSourceTracker.markProcessed(event.id);
        } catch (error) {
          this.stats.errors++;
          console.error('[EventCoordinator] Error processing event:', error);

          // 재시도
          if (event.retryCount < this.config.maxRetries) {
            event.retryCount++;
            this.eventQueue.push(event);
          }
        }
      }

      // 남은 이벤트가 있으면 계속 처리
      if (this.eventQueue.length > 0) {
        setTimeout(() => this.processQueue(), 10);
      }
    } finally {
      this.processingQueue = false;
      this.stats.lastSyncTime = Date.now();
    }
  }

  /**
   * 개별 이벤트 처리
   */
  private async processEvent(event: QueuedEvent): Promise<void> {
    // 실제 동기화 로직은 각 Context에서 처리
    // 여기서는 이벤트 전달만 담당

    logEvent('EVENT_PROCESSED', event.detail, 'EventCoordinator');
  }

  /**
   * 충돌 해결
   */
  resolveConflict<T>(
    scheduleData: T,
    buildupData: T,
    strategy: SyncConfiguration['conflictResolution'] = this.config.conflictResolution
  ): T {
    switch (strategy) {
      case 'schedule-wins':
        return scheduleData;

      case 'buildup-wins':
        return buildupData;

      case 'latest-wins':
        // 타임스탬프 비교 로직 필요
        return scheduleData;

      case 'merge':
        // 객체 병합 로직
        return { ...buildupData, ...scheduleData };

      default:
        return scheduleData;
    }
  }

  /**
   * 통계 조회
   */
  getStats() {
    return {
      ...this.stats,
      queueLength: this.eventQueue.length,
      isProcessing: this.processingQueue,
      activeTrackers: EventSourceTracker.getActiveCount()
    };
  }

  /**
   * 큐 초기화
   */
  clearQueue(): void {
    this.eventQueue = [];
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * 종료 처리
   */
  shutdown(): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔌 [EventCoordinator] Shutting down...', this.getStats());
    }

    this.clearQueue();
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions = [];
    this.listenersRegistered = false;
    EventSourceTracker.reset();
  }

  /**
   * 재시작
   */
  restart(): void {
    this.shutdown();
    this.initialize();
  }
}

// 전역 인스턴스 export
export const eventCoordinator = EventCoordinator.getInstance();