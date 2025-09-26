/**
 * Real-Time Data Synchronization System
 * 실시간 데이터 동기화 및 변경 감지 시스템
 */

import type { AxisKey } from '../types';

// 실시간 동기화 이벤트 타입
type SyncEventType =
  | 'data_updated'
  | 'score_changed'
  | 'insight_generated'
  | 'quality_assessed'
  | 'connection_status'
  | 'error_occurred';

interface SyncEvent {
  type: SyncEventType;
  payload: any;
  timestamp: Date;
  source: string;
}

// 동기화 설정
interface SyncConfig {
  enabled: boolean;
  interval: number; // 폴링 간격 (ms)
  retryAttempts: number;
  retryDelay: number;
  batchSize: number;
  enableWebSocket: boolean;
  maxCacheAge: number; // 캐시 최대 유지 시간 (ms)
}

// 데이터 변경 감지 결과
interface ChangeDetection {
  hasChanges: boolean;
  changes: {
    axis: AxisKey;
    oldValue: number;
    newValue: number;
    changeType: 'increase' | 'decrease' | 'stable';
    magnitude: number;
  }[];
  timestamp: Date;
  confidence: number;
}

// 캐시 엔트리
interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  expiry: Date;
  version: number;
}

// 실시간 동기화 매니저
export class RealTimeSyncManager {
  private config: SyncConfig;
  private listeners: Map<SyncEventType, Set<(event: SyncEvent) => void>> = new Map();
  private cache: Map<string, CacheEntry<any>> = new Map();
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private websocket: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private lastSyncTime: Date = new Date();

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      enabled: true,
      interval: 30000, // 30초
      retryAttempts: 3,
      retryDelay: 5000,
      batchSize: 50,
      enableWebSocket: false,
      maxCacheAge: 300000, // 5분
      ...config
    };

    this.initializeEventTypes();
  }

  // 시작
  start(): void {
    if (!this.config.enabled || this.isRunning) return;

    console.log('🚀 Real-time sync started');
    this.isRunning = true;

    if (this.config.enableWebSocket) {
      this.initializeWebSocket();
    } else {
      this.startPolling();
    }

    // 캐시 정리 작업 시작
    this.startCacheCleanup();
  }

  // 중지
  stop(): void {
    if (!this.isRunning) return;

    console.log('⏹️ Real-time sync stopped');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  // 이벤트 리스너 등록
  on(eventType: SyncEventType, listener: (event: SyncEvent) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);
  }

  // 이벤트 리스너 제거
  off(eventType: SyncEventType, listener: (event: SyncEvent) => void): void {
    this.listeners.get(eventType)?.delete(listener);
  }

  // 수동 동기화 트리거
  async triggerSync(): Promise<boolean> {
    try {
      await this.performSync();
      return true;
    } catch (error) {
      console.error('Manual sync failed:', error);
      return false;
    }
  }

  // 데이터 변경 감지
  detectChanges(
    newScores: Record<AxisKey, number>,
    previousScores?: Record<AxisKey, number>
  ): ChangeDetection {
    if (!previousScores) {
      return {
        hasChanges: false,
        changes: [],
        timestamp: new Date(),
        confidence: 0
      };
    }

    const changes = [];
    const axes = Object.keys(newScores) as AxisKey[];

    for (const axis of axes) {
      const oldValue = previousScores[axis] || 0;
      const newValue = newScores[axis];
      const difference = newValue - oldValue;
      const magnitude = Math.abs(difference);

      if (magnitude > 0.5) { // 0.5점 이상 변화만 감지
        changes.push({
          axis,
          oldValue,
          newValue,
          changeType: difference > 0 ? 'increase' : 'decrease' as const,
          magnitude
        });
      }
    }

    // 변화 신뢰도 계산
    const totalMagnitude = changes.reduce((sum, change) => sum + change.magnitude, 0);
    const confidence = Math.min(100, (totalMagnitude / axes.length) * 10);

    return {
      hasChanges: changes.length > 0,
      changes,
      timestamp: new Date(),
      confidence
    };
  }

  // 캐시된 데이터 조회
  getCachedData<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (new Date() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // 데이터 캐시 저장
  setCachedData<T>(key: string, data: T, customTTL?: number): void {
    const now = new Date();
    const ttl = customTTL || this.config.maxCacheAge;

    this.cache.set(key, {
      data,
      timestamp: now,
      expiry: new Date(now.getTime() + ttl),
      version: Date.now()
    });
  }

  // 동기화 상태 조회
  getSyncStatus(): {
    isRunning: boolean;
    lastSync: Date;
    cacheSize: number;
    connectionStatus: 'connected' | 'disconnected' | 'connecting';
  } {
    return {
      isRunning: this.isRunning,
      lastSync: this.lastSyncTime,
      cacheSize: this.cache.size,
      connectionStatus: this.websocket?.readyState === WebSocket.OPEN ? 'connected' :
                      this.websocket?.readyState === WebSocket.CONNECTING ? 'connecting' : 'disconnected'
    };
  }

  // 프라이빗 메서드들

  private initializeEventTypes(): void {
    const eventTypes: SyncEventType[] = [
      'data_updated', 'score_changed', 'insight_generated',
      'quality_assessed', 'connection_status', 'error_occurred'
    ];

    eventTypes.forEach(type => {
      this.listeners.set(type, new Set());
    });
  }

  private startPolling(): void {
    this.intervalId = setInterval(async () => {
      if (this.isRunning) {
        await this.performSync();
      }
    }, this.config.interval);
  }

  private async performSync(): Promise<void> {
    try {
      // 1. KPI Context 데이터 체크
      const contextData = await this.fetchContextData();

      // 2. 변경 감지
      const previousData = this.getCachedData<any>('kpi_scores');
      let changeDetection = null;

      if (contextData?.axisScores && previousData?.axisScores) {
        changeDetection = this.detectChanges(contextData.axisScores, previousData.axisScores);
      }

      // 3. 데이터 갱신 (변경이 있는 경우만)
      if (!previousData || (changeDetection && changeDetection.hasChanges)) {
        this.setCachedData('kpi_scores', contextData);

        // 이벤트 발생
        this.emitEvent({
          type: 'data_updated',
          payload: {
            data: contextData,
            changes: changeDetection?.changes || [],
            confidence: changeDetection?.confidence || 100
          },
          timestamp: new Date(),
          source: 'sync_manager'
        });
      }

      // 4. 점수 변경 이벤트 (개별 축별로)
      if (changeDetection?.hasChanges) {
        changeDetection.changes.forEach(change => {
          this.emitEvent({
            type: 'score_changed',
            payload: change,
            timestamp: new Date(),
            source: 'change_detector'
          });
        });
      }

      this.lastSyncTime = new Date();
      this.reconnectAttempts = 0; // 성공 시 재연결 시도 횟수 리셋

    } catch (error) {
      console.error('Sync failed:', error);

      this.emitEvent({
        type: 'error_occurred',
        payload: {
          error: error instanceof Error ? error.message : 'Unknown sync error',
          retryAttempts: this.reconnectAttempts
        },
        timestamp: new Date(),
        source: 'sync_manager'
      });

      // 재시도 로직
      if (this.reconnectAttempts < this.config.retryAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => {
          if (this.isRunning) {
            this.performSync();
          }
        }, this.config.retryDelay);
      }
    }
  }

  private async fetchContextData(): Promise<any> {
    // 실제 구현에서는 KPI Context에서 데이터를 가져옴
    // 여기서는 Mock 데이터를 시뮬레이션
    return new Promise((resolve) => {
      setTimeout(() => {
        // 약간의 랜덤 변화를 주어서 실시간 업데이트 시뮬레이션
        const baseScores = { GO: 75, EC: 45, PT: 85, PF: 60, TO: 65 };
        const noisyScores = Object.entries(baseScores).reduce((acc, [axis, score]) => {
          // ±2점 범위에서 랜덤 변화
          const noise = (Math.random() - 0.5) * 4;
          acc[axis as AxisKey] = Math.max(0, Math.min(100, score + noise));
          return acc;
        }, {} as Record<AxisKey, number>);

        resolve({
          axisScores: noisyScores,
          overallScore: Object.values(noisyScores).reduce((a, b) => a + b, 0) / 5,
          timestamp: new Date()
        });
      }, 100);
    });
  }

  private initializeWebSocket(): void {
    try {
      // 실제 WebSocket 연결 (현재는 mock)
      // this.websocket = new WebSocket('ws://localhost:8080/realtime');

      console.log('WebSocket connection not implemented - using polling fallback');
      this.startPolling();

    } catch (error) {
      console.warn('WebSocket failed, falling back to polling:', error);
      this.startPolling();
    }
  }

  private emitEvent(event: SyncEvent): void {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in event listener for ${event.type}:`, error);
        }
      });
    }
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = new Date();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiry) {
          this.cache.delete(key);
        }
      }
    }, 60000); // 1분마다 정리
  }
}

// 성능 최적화된 배치 업데이트 매니저
export class BatchUpdateManager {
  private updateQueue: Array<{ key: string; data: any; timestamp: Date }> = [];
  private processingTimer: NodeJS.Timeout | null = null;
  private batchInterval: number = 1000; // 1초

  constructor(batchInterval?: number) {
    this.batchInterval = batchInterval || 1000;
  }

  // 업데이트 요청 큐에 추가
  queueUpdate(key: string, data: any): void {
    this.updateQueue.push({
      key,
      data,
      timestamp: new Date()
    });

    this.scheduleBatchProcess();
  }

  // 배치 처리 스케줄링
  private scheduleBatchProcess(): void {
    if (this.processingTimer) return;

    this.processingTimer = setTimeout(() => {
      this.processBatch();
    }, this.batchInterval);
  }

  // 배치 처리 실행
  private processBatch(): void {
    if (this.updateQueue.length === 0) {
      this.processingTimer = null;
      return;
    }

    // 중복 키 제거 (최신 것만 유지)
    const uniqueUpdates = new Map<string, any>();

    this.updateQueue.forEach(update => {
      uniqueUpdates.set(update.key, update);
    });

    // 배치 업데이트 처리
    const updates = Array.from(uniqueUpdates.values());

    console.log(`🔄 Processing batch: ${updates.length} updates`);

    // 실제 업데이트 로직 (예: 상태 업데이트, API 호출 등)
    updates.forEach(update => {
      // 여기서 실제 업데이트 처리
      console.log(`Updated ${update.key}:`, update.data);
    });

    // 큐 정리
    this.updateQueue = [];
    this.processingTimer = null;

    // 남은 업데이트가 있으면 다시 스케줄링
    if (this.updateQueue.length > 0) {
      this.scheduleBatchProcess();
    }
  }
}

// Hook을 위한 실시간 동기화 유틸리티
export const createRealtimeSync = (config?: Partial<SyncConfig>) => {
  const syncManager = new RealTimeSyncManager(config);
  const batchManager = new BatchUpdateManager();

  return {
    syncManager,
    batchManager,

    // 편의 메서드들
    start: () => syncManager.start(),
    stop: () => syncManager.stop(),

    onDataUpdate: (callback: (data: any) => void) => {
      syncManager.on('data_updated', (event) => callback(event.payload));
    },

    onScoreChange: (callback: (change: any) => void) => {
      syncManager.on('score_changed', (event) => callback(event.payload));
    },

    getStatus: () => syncManager.getSyncStatus(),

    triggerSync: () => syncManager.triggerSync()
  };
};

// 글로벌 동기화 매니저 인스턴스
export const globalSyncManager = new RealTimeSyncManager();

// 타입 exports
export type { SyncEvent, SyncEventType, SyncConfig, ChangeDetection };