/**
 * Offline Queue System
 * 오프라인 상태에서 작업을 큐에 저장하고, 온라인 복귀 시 동기화
 */

import { EventEmitter } from 'events';

export interface QueueItem {
  id: string;
  type: 'score_update' | 'simulation' | 'scenario_save' | 'insight_add';
  payload: any;
  timestamp: number;
  retryCount: number;
  priority: number;
}

export interface OfflineQueueConfig {
  maxRetries?: number;
  retryDelay?: number;
  storageKey?: string;
  autoSync?: boolean;
  syncInterval?: number;
}

export class OfflineQueue extends EventEmitter {
  private queue: QueueItem[] = [];
  private config: Required<OfflineQueueConfig>;
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncTimer: NodeJS.Timeout | null = null;

  constructor(config: OfflineQueueConfig = {}) {
    super();

    this.config = {
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 5000,
      storageKey: config.storageKey || 'v2-dashboard-offline-queue',
      autoSync: config.autoSync !== false,
      syncInterval: config.syncInterval || 30000
    };

    this.initialize();
  }

  /**
   * 초기화
   */
  private initialize(): void {
    // 로컬 스토리지에서 큐 복원
    this.loadQueue();

    // 온라인/오프라인 이벤트 리스너
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // 초기 온라인 상태 확인
    if (navigator.onLine) {
      this.handleOnline();
    }

    // 주기적 동기화 설정
    if (this.config.autoSync) {
      this.startAutoSync();
    }
  }

  /**
   * 큐에 아이템 추가
   */
  enqueue(item: Omit<QueueItem, 'id' | 'retryCount'>): void {
    const queueItem: QueueItem = {
      ...item,
      id: this.generateId(),
      retryCount: 0
    };

    this.queue.push(queueItem);
    this.saveQueue();
    this.emit('itemAdded', queueItem);

    console.log('📦 Queued offline action:', queueItem);

    // 온라인이면 즉시 동기화 시도
    if (this.isOnline && !this.isSyncing) {
      this.sync();
    }
  }

  /**
   * 큐에서 아이템 제거
   */
  dequeue(id: string): void {
    const index = this.queue.findIndex(item => item.id === id);
    if (index !== -1) {
      const item = this.queue.splice(index, 1)[0];
      this.saveQueue();
      this.emit('itemRemoved', item);
    }
  }

  /**
   * 동기화 실행
   */
  async sync(): Promise<void> {
    if (!this.isOnline || this.isSyncing || this.queue.length === 0) {
      return;
    }

    this.isSyncing = true;
    this.emit('syncStart');

    console.log('🔄 Starting offline queue sync...', this.queue.length, 'items');

    // 우선순위 순으로 정렬
    const sortedQueue = [...this.queue].sort((a, b) => b.priority - a.priority);

    for (const item of sortedQueue) {
      try {
        await this.processItem(item);
        this.dequeue(item.id);
        this.emit('itemSynced', item);
      } catch (error) {
        console.error('Failed to sync item:', item, error);

        item.retryCount++;

        if (item.retryCount >= this.config.maxRetries) {
          console.error('Max retries reached, removing item:', item);
          this.dequeue(item.id);
          this.emit('itemFailed', item);
        } else {
          // 재시도를 위해 큐에 유지
          this.saveQueue();
        }
      }
    }

    this.isSyncing = false;
    this.emit('syncComplete', {
      successful: sortedQueue.length - this.queue.length,
      failed: this.queue.length
    });
  }

  /**
   * 아이템 처리
   */
  private async processItem(item: QueueItem): Promise<void> {
    // 실제 API 호출 시뮬레이션
    // 실제 구현에서는 각 type에 맞는 API 엔드포인트 호출
    const endpoint = this.getEndpointForType(item.type);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...item.payload,
        _offline: true,
        _timestamp: item.timestamp
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 타입별 엔드포인트 반환
   */
  private getEndpointForType(type: QueueItem['type']): string {
    const baseUrl = process.env.VITE_API_URL || '/api';

    switch (type) {
      case 'score_update':
        return `${baseUrl}/kpi/scores`;
      case 'simulation':
        return `${baseUrl}/kpi/simulate`;
      case 'scenario_save':
        return `${baseUrl}/kpi/scenarios`;
      case 'insight_add':
        return `${baseUrl}/kpi/insights`;
      default:
        throw new Error(`Unknown queue item type: ${type}`);
    }
  }

  /**
   * 온라인 전환 처리
   */
  private handleOnline(): void {
    console.log('✅ Online - starting sync');
    this.isOnline = true;
    this.emit('online');

    // 큐에 아이템이 있으면 동기화
    if (this.queue.length > 0) {
      setTimeout(() => this.sync(), 1000);
    }
  }

  /**
   * 오프라인 전환 처리
   */
  private handleOffline(): void {
    console.log('❌ Offline - queuing enabled');
    this.isOnline = false;
    this.isSyncing = false;
    this.emit('offline');
  }

  /**
   * 자동 동기화 시작
   */
  private startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.isOnline && !this.isSyncing && this.queue.length > 0) {
        this.sync();
      }
    }, this.config.syncInterval);
  }

  /**
   * 자동 동기화 중지
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * 큐 저장
   */
  private saveQueue(): void {
    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save queue:', error);
    }
  }

  /**
   * 큐 로드
   */
  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log('📦 Loaded offline queue:', this.queue.length, 'items');
      }
    } catch (error) {
      console.error('Failed to load queue:', error);
      this.queue = [];
    }
  }

  /**
   * 큐 초기화
   */
  clear(): void {
    this.queue = [];
    this.saveQueue();
    this.emit('cleared');
  }

  /**
   * ID 생성
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 큐 상태 반환
   */
  getStatus(): {
    isOnline: boolean;
    isSyncing: boolean;
    queueLength: number;
    items: QueueItem[];
  } {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      queueLength: this.queue.length,
      items: [...this.queue]
    };
  }

  /**
   * 정리
   */
  destroy(): void {
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    this.stopAutoSync();
    this.saveQueue();
  }
}

// 싱글톤 인스턴스
let offlineQueue: OfflineQueue | null = null;

export const getOfflineQueue = (): OfflineQueue => {
  if (!offlineQueue) {
    offlineQueue = new OfflineQueue();
  }
  return offlineQueue;
};