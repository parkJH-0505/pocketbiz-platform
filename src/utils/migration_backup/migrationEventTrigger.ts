/**
 * @fileoverview 마이그레이션 이벤트 트리거 시스템
 * @description Sprint 3 - Stage 2: 이벤트 기반 자동 트리거
 * @author PocketCompany
 * @since 2025-01-23
 */

import { GlobalContextManager } from './globalContextManager';
import { MigrationManager } from './migrationManager';
import { modeManager, MigrationMode, type ExecutionContext } from './migrationModes';
import type { ContextMessage } from '../types/contextBridge.types';

/**
 * 이벤트 타입 정의
 */
export enum MigrationEventType {
  CONTEXT_READY = 'context_ready',
  PROJECT_CREATED = 'project_created',
  PROJECT_UPDATED = 'project_updated',
  PROJECT_DELETED = 'project_deleted',
  SCHEDULE_CHANGED = 'schedule_changed',
  DATA_SYNC_REQUIRED = 'data_sync_required',
  USER_ACTION = 'user_action',
  SYSTEM_STATE_CHANGED = 'system_state_changed',
  ERROR_DETECTED = 'error_detected',
  MANUAL_TRIGGER = 'manual_trigger'
}

/**
 * 이벤트 페이로드
 */
export interface MigrationEventPayload {
  type: MigrationEventType;
  source: string;
  timestamp: Date;
  data?: any;
  metadata?: Record<string, any>;
}

/**
 * 이벤트 리스너 설정
 */
export interface EventListenerConfig {
  eventType: MigrationEventType;
  enabled: boolean;
  debounceTime?: number;
  throttleTime?: number;
  filter?: (payload: MigrationEventPayload) => boolean;
  transform?: (payload: MigrationEventPayload) => any;
}

/**
 * 이벤트 기록
 */
export interface EventRecord {
  id: string;
  event: MigrationEventPayload;
  triggered: boolean;
  result?: 'success' | 'failed' | 'skipped';
  timestamp: Date;
}

/**
 * 이벤트 트리거 관리자
 */
export class MigrationEventTrigger {
  private static instance: MigrationEventTrigger | null = null;

  private contextManager: GlobalContextManager;
  private migrationManager: MigrationManager | null = null;
  private listeners: Map<MigrationEventType, EventListenerConfig> = new Map();
  private eventHistory: EventRecord[] = [];
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private throttleTimers: Map<string, number> = new Map();
  private isListening: boolean = false;

  private constructor() {
    this.contextManager = GlobalContextManager.getInstance();
    // Lazy initialize MigrationManager to avoid circular dependency
    // this.migrationManager will be set when first accessed
    this.setupDefaultListeners();
  }

  /**
   * Get MigrationManager instance lazily
   */
  private getMigrationManager(): MigrationManager {
    if (!this.migrationManager) {
      this.migrationManager = MigrationManager.getInstance();
    }
    return this.migrationManager;
  }

  /**
   * 싱글톤 인스턴스
   */
  public static getInstance(): MigrationEventTrigger {
    if (!MigrationEventTrigger.instance) {
      MigrationEventTrigger.instance = new MigrationEventTrigger();
    }
    return MigrationEventTrigger.instance;
  }

  /**
   * 기본 리스너 설정
   */
  private setupDefaultListeners(): void {
    // Context 준비 완료 이벤트
    this.addListener({
      eventType: MigrationEventType.CONTEXT_READY,
      enabled: true,
      debounceTime: 1000
    });

    // 프로젝트 생성 이벤트
    this.addListener({
      eventType: MigrationEventType.PROJECT_CREATED,
      enabled: true,
      debounceTime: 2000
    });

    // 스케줄 변경 이벤트
    this.addListener({
      eventType: MigrationEventType.SCHEDULE_CHANGED,
      enabled: true,
      throttleTime: 5000 // 5초당 1회만
    });

    // 데이터 동기화 필요 이벤트
    this.addListener({
      eventType: MigrationEventType.DATA_SYNC_REQUIRED,
      enabled: true,
      debounceTime: 3000
    });

    // 수동 트리거
    this.addListener({
      eventType: MigrationEventType.MANUAL_TRIGGER,
      enabled: true
    });
  }

  /**
   * 이벤트 리스닝 시작
   */
  public startListening(): void {
    if (this.isListening) {
      return;
    }

    // GlobalContextManager 메시지 리스너 등록
    this.contextManager.on('message', this.handleContextMessage.bind(this));

    // Window 이벤트 리스너 (폴백)
    if (typeof window !== 'undefined') {
      window.addEventListener('migration-event', this.handleWindowEvent.bind(this));
    }

    this.isListening = true;
  }

  /**
   * 이벤트 리스닝 중지
   */
  public stopListening(): void {
    if (!this.isListening) {
      return;
    }

    // 리스너 해제
    this.contextManager.off('message', this.handleContextMessage.bind(this));

    if (typeof window !== 'undefined') {
      window.removeEventListener('migration-event', this.handleWindowEvent.bind(this));
    }

    // 타이머 정리
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.throttleTimers.clear();

    this.isListening = false;
  }

  /**
   * Context 메시지 처리
   */
  private handleContextMessage(message: ContextMessage): void {
    // Context 메시지를 이벤트로 변환
    const event = this.convertMessageToEvent(message);
    if (event) {
      this.triggerEvent(event);
    }
  }

  /**
   * Window 이벤트 처리
   */
  private handleWindowEvent(event: CustomEvent): void {
    const payload = event.detail as MigrationEventPayload;
    this.triggerEvent(payload);
  }

  /**
   * Context 메시지를 이벤트로 변환
   */
  private convertMessageToEvent(message: ContextMessage): MigrationEventPayload | null {
    let eventType: MigrationEventType | null = null;
    let data: any = message.payload;

    // 메시지 타입에 따른 이벤트 매핑
    switch (message.type) {
      case 'CONTEXT_READY':
        eventType = MigrationEventType.CONTEXT_READY;
        break;
      case 'PROJECT_CREATED':
        eventType = MigrationEventType.PROJECT_CREATED;
        break;
      case 'PROJECT_UPDATED':
        eventType = MigrationEventType.PROJECT_UPDATED;
        break;
      case 'SCHEDULE_UPDATED':
      case 'SCHEDULE_CREATED':
      case 'SCHEDULE_DELETED':
        eventType = MigrationEventType.SCHEDULE_CHANGED;
        break;
      case 'SYNC_REQUIRED':
        eventType = MigrationEventType.DATA_SYNC_REQUIRED;
        break;
      default:
        // 알 수 없는 메시지는 무시
        return null;
    }

    return {
      type: eventType,
      source: message.from,
      timestamp: new Date(message.timestamp),
      data,
      metadata: {
        originalType: message.type,
        messageId: message.id
      }
    };
  }

  /**
   * 이벤트 트리거
   */
  public async triggerEvent(payload: MigrationEventPayload): Promise<void> {
    const config = this.listeners.get(payload.type);

    if (!config || !config.enabled) {
      return;
    }

    // 필터 적용
    if (config.filter && !config.filter(payload)) {
      return;
    }

    // 디바운싱 적용
    if (config.debounceTime) {
      this.debounceEvent(payload, config);
      return;
    }

    // 쓰로틀링 적용
    if (config.throttleTime) {
      if (!this.throttleEvent(payload, config)) {
        return;
      }
    }

    // 실제 이벤트 처리
    await this.processEvent(payload);
  }

  /**
   * 디바운싱 처리
   */
  private debounceEvent(payload: MigrationEventPayload, config: EventListenerConfig): void {
    const key = `${payload.type}_debounce`;

    // 기존 타이머 취소
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // 새 타이머 설정
    const timer = setTimeout(async () => {
      await this.processEvent(payload);
      this.debounceTimers.delete(key);
    }, config.debounceTime);

    this.debounceTimers.set(key, timer);
  }

  /**
   * 쓰로틀링 처리
   */
  private throttleEvent(payload: MigrationEventPayload, config: EventListenerConfig): boolean {
    const key = `${payload.type}_throttle`;
    const lastTime = this.throttleTimers.get(key);
    const now = Date.now();

    if (lastTime && now - lastTime < config.throttleTime!) {
      return false; // 아직 쓰로틀 시간 내
    }

    this.throttleTimers.set(key, now);
    return true;
  }

  /**
   * 이벤트 처리
   */
  private async processEvent(payload: MigrationEventPayload): Promise<void> {

    // 이벤트 기록
    const record: EventRecord = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event: payload,
      triggered: false,
      timestamp: new Date()
    };

    this.eventHistory.push(record);

    try {
      // 현재 모드 확인
      const currentMode = modeManager.getCurrentMode();

      // 실행 컨텍스트 생성
      const context: ExecutionContext = {
        mode: currentMode,
        triggeredBy: 'event',
        timestamp: new Date()
      };

      // 모드별 실행 가능 여부 확인
      const canExecute = await modeManager.canExecute(context);

      if (!canExecute) {
        record.result = 'skipped';
        return;
      }

      // 마이그레이션 실행 조건 확인
      const shouldMigrate = await this.getMigrationManager().shouldMigrate();

      if (shouldMigrate) {
        record.triggered = true;

        // 마이그레이션 실행
        await this.getMigrationManager().migrate({
          mode: currentMode === MigrationMode.MANUAL ? 'manual' : 'auto',
          metadata: {
            triggeredBy: payload.type,
            eventData: payload.data
          }
        });

        record.result = 'success';
      } else {
        record.result = 'skipped';
      }

    } catch (error) {
      console.error(`❌ Error processing event ${payload.type}:`, error);
      record.result = 'failed';
    }

    // 이력 크기 제한
    if (this.eventHistory.length > 100) {
      this.eventHistory = this.eventHistory.slice(-50);
    }
  }

  /**
   * 리스너 추가
   */
  public addListener(config: EventListenerConfig): void {
    this.listeners.set(config.eventType, config);
    console.log(`➕ Added listener for: ${config.eventType}`);
  }

  /**
   * 리스너 제거
   */
  public removeListener(eventType: MigrationEventType): void {
    this.listeners.delete(eventType);
    console.log(`➖ Removed listener for: ${eventType}`);
  }

  /**
   * 리스너 설정 업데이트
   */
  public updateListener(eventType: MigrationEventType, config: Partial<EventListenerConfig>): void {
    const existing = this.listeners.get(eventType);
    if (existing) {
      this.listeners.set(eventType, { ...existing, ...config });
    }
  }

  /**
   * 수동 이벤트 발생
   */
  public emitManualEvent(data?: any): void {
    this.triggerEvent({
      type: MigrationEventType.MANUAL_TRIGGER,
      source: 'user',
      timestamp: new Date(),
      data
    });
  }

  /**
   * 이벤트 이력 조회
   */
  public getEventHistory(limit?: number): EventRecord[] {
    if (limit) {
      return this.eventHistory.slice(-limit);
    }
    return [...this.eventHistory];
  }

  /**
   * 이벤트 통계
   */
  public getEventStatistics(): {
    total: number;
    triggered: number;
    successful: number;
    failed: number;
    skipped: number;
    byType: Record<string, number>;
  } {
    const stats = {
      total: this.eventHistory.length,
      triggered: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      byType: {} as Record<string, number>
    };

    this.eventHistory.forEach(record => {
      if (record.triggered) stats.triggered++;
      if (record.result === 'success') stats.successful++;
      if (record.result === 'failed') stats.failed++;
      if (record.result === 'skipped') stats.skipped++;

      const type = record.event.type;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    });

    return stats;
  }

  /**
   * 리스너 상태 조회
   */
  public getListenerStatus(): {
    isListening: boolean;
    listeners: Array<{
      type: MigrationEventType;
      config: EventListenerConfig;
    }>;
    activeDebounces: number;
    activeThrottles: number;
  } {
    return {
      isListening: this.isListening,
      listeners: Array.from(this.listeners.entries()).map(([type, config]) => ({
        type,
        config
      })),
      activeDebounces: this.debounceTimers.size,
      activeThrottles: this.throttleTimers.size
    };
  }

  /**
   * 초기화
   */
  public reset(): void {
    this.stopListening();
    this.listeners.clear();
    this.eventHistory = [];
    this.setupDefaultListeners();
  }
}

// 싱글톤 인스턴스 export
export const migrationEventTrigger = MigrationEventTrigger.getInstance();

// 개발 환경 디버깅용
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).__migrationEventTrigger__ = migrationEventTrigger;
}