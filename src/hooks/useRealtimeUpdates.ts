/**
 * 실시간 업데이트 시스템
 * 사용자 활동에 따라 자동으로 UI를 업데이트하는 커스텀 훅
 */

import { useEffect, useCallback, useRef } from 'react';

// 이벤트 타입 정의
export type UpdateEventType =
  | 'kpi-update'
  | 'task-complete'
  | 'document-access'
  | 'goal-progress'
  | 'momentum-change';

export interface UpdateEvent {
  type: UpdateEventType;
  data?: any;
  timestamp: number;
}

// 전역 이벤트 리스너 관리
class RealtimeUpdateManager {
  private listeners: Map<UpdateEventType, Set<(event: UpdateEvent) => void>> = new Map();
  private eventQueue: UpdateEvent[] = [];
  private isProcessing = false;

  // 이벤트 리스너 등록
  subscribe(type: UpdateEventType, listener: (event: UpdateEvent) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);

    // 언마운트시 정리용 함수 반환
    return () => {
      const typeListeners = this.listeners.get(type);
      if (typeListeners) {
        typeListeners.delete(listener);
        if (typeListeners.size === 0) {
          this.listeners.delete(type);
        }
      }
    };
  }

  // 이벤트 발생
  emit(type: UpdateEventType, data?: any) {
    const event: UpdateEvent = {
      type,
      data,
      timestamp: Date.now()
    };

    // 이벤트를 큐에 추가
    this.eventQueue.push(event);

    // 디바운스 처리
    if (!this.isProcessing) {
      this.isProcessing = true;

      // 다음 틱에서 처리하여 배치 업데이트
      setTimeout(() => {
        this.processEventQueue();
        this.isProcessing = false;
      }, 0);
    }

    console.log(`[RealtimeUpdate] Event emitted: ${type}`, data);
  }

  // 이벤트 큐 처리
  private processEventQueue() {
    const eventsToProcess = [...this.eventQueue];
    this.eventQueue = [];

    // 같은 타입의 이벤트는 마지막 것만 처리 (디바운스)
    const latestEvents = new Map<UpdateEventType, UpdateEvent>();
    eventsToProcess.forEach(event => {
      latestEvents.set(event.type, event);
    });

    // 리스너들에게 이벤트 전달
    latestEvents.forEach((event, type) => {
      const typeListeners = this.listeners.get(type);
      if (typeListeners) {
        typeListeners.forEach(listener => {
          try {
            listener(event);
          } catch (error) {
            console.error(`[RealtimeUpdate] Error in listener for ${type}:`, error);
          }
        });
      }
    });
  }

  // 모든 구독자에게 강제 업데이트 신호
  broadcast() {
    this.emit('momentum-change');
  }
}

// 싱글톤 인스턴스
export const realtimeUpdateManager = new RealtimeUpdateManager();

// 실시간 업데이트 훅
export const useRealtimeUpdates = (
  eventTypes: UpdateEventType[],
  onUpdate: (event: UpdateEvent) => void,
  dependencies: any[] = []
) => {
  const onUpdateRef = useRef(onUpdate);

  // 최신 콜백 참조 유지
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate, ...dependencies]);

  const handleUpdate = useCallback((event: UpdateEvent) => {
    onUpdateRef.current(event);
  }, []);

  useEffect(() => {
    const unsubscribers = eventTypes.map(type =>
      realtimeUpdateManager.subscribe(type, handleUpdate)
    );

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [eventTypes, handleUpdate]);
};

// 편의 함수들
export const emitKPIUpdate = (kpiId?: string) => {
  realtimeUpdateManager.emit('kpi-update', { kpiId });
};

export const emitTaskComplete = (taskId?: string, projectId?: string) => {
  realtimeUpdateManager.emit('task-complete', { taskId, projectId });
};

export const emitDocumentAccess = (docId?: string, action?: string) => {
  realtimeUpdateManager.emit('document-access', { docId, action });
};

export const emitGoalProgress = (goalId?: string) => {
  realtimeUpdateManager.emit('goal-progress', { goalId });
};

export const emitMomentumChange = () => {
  realtimeUpdateManager.emit('momentum-change');
};

// 강제 전체 업데이트
export const broadcastUpdate = () => {
  realtimeUpdateManager.broadcast();
};