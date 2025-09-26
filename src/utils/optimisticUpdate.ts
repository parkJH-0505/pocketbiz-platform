/**
 * Optimistic Update System
 * Phase 4: 낙관적 업데이트 패턴 구현
 *
 * 주요 기능:
 * - 즉시 UI 업데이트 후 백그라운드 동기화
 * - 실패 시 자동 롤백
 * - 중복 요청 방지
 * - 업데이트 큐 관리
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// 브라우저 호환 EventEmitter 구현
class EventEmitter {
  private events: Map<string, Set<Function>> = new Map();

  on(event: string, handler: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);
  }

  off(event: string, handler: Function): void {
    this.events.get(event)?.delete(handler);
  }

  emit(event: string, ...args: any[]): void {
    this.events.get(event)?.forEach(handler => handler(...args));
  }

  once(event: string, handler: Function): void {
    const onceHandler = (...args: any[]) => {
      handler(...args);
      this.off(event, onceHandler);
    };
    this.on(event, onceHandler);
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}

// 업데이트 상태
export enum UpdateStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUCCESS = 'success',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back'
}

// 업데이트 타입
export enum UpdateType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  BATCH = 'batch'
}

// 낙관적 업데이트 인터페이스
export interface OptimisticUpdate<T = any> {
  id: string;
  type: UpdateType;
  optimisticValue: T;
  previousValue?: T;
  actualValue?: T;
  status: UpdateStatus;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, any>;
}

// 업데이트 옵션
export interface UpdateOptions {
  maxRetries?: number;
  retryDelay?: number;
  rollbackOnError?: boolean;
  showNotification?: boolean;
  debounceMs?: number;
}

// 업데이트 결과
export interface UpdateResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  rollbackData?: T;
}

// 이벤트 타입
export interface OptimisticUpdateEvents {
  'update:start': (update: OptimisticUpdate) => void;
  'update:success': (update: OptimisticUpdate) => void;
  'update:failed': (update: OptimisticUpdate, error: Error) => void;
  'update:rollback': (update: OptimisticUpdate) => void;
  'update:retry': (update: OptimisticUpdate, attempt: number) => void;
}

/**
 * 낙관적 업데이트 관리자
 * 모든 낙관적 업데이트를 중앙에서 관리
 */
export class OptimisticUpdateManager extends EventEmitter {
  private updates: Map<string, OptimisticUpdate> = new Map();
  private updateQueue: OptimisticUpdate[] = [];
  private isProcessing = false;
  private static instance: OptimisticUpdateManager;

  private constructor() {
    super();
  }

  static getInstance(): OptimisticUpdateManager {
    if (!this.instance) {
      this.instance = new OptimisticUpdateManager();
    }
    return this.instance;
  }

  /**
   * 낙관적 업데이트 수행
   */
  async performUpdate<T>(
    id: string,
    type: UpdateType,
    optimisticValue: T,
    actualUpdateFn: () => Promise<T>,
    options: UpdateOptions = {}
  ): Promise<UpdateResult<T>> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      rollbackOnError = true,
      showNotification = true,
      debounceMs = 0
    } = options;

    // 디바운싱 처리
    if (debounceMs > 0) {
      await this.debounce(id, debounceMs);
    }

    // 이전 값 저장 (롤백용)
    const previousUpdate = this.updates.get(id);
    const previousValue = previousUpdate?.optimisticValue;

    // 낙관적 업데이트 생성
    const update: OptimisticUpdate<T> = {
      id,
      type,
      optimisticValue,
      previousValue,
      status: UpdateStatus.PENDING,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries,
      metadata: options
    };

    // 상태 저장 및 이벤트 발생
    this.updates.set(id, update);
    this.emit('update:start', update);

    // UI 즉시 업데이트
    this.applyOptimisticUpdate(update);

    // 큐에 추가
    this.updateQueue.push(update);

    // 백그라운드 처리
    return this.processUpdate(update, actualUpdateFn, retryDelay, rollbackOnError);
  }

  /**
   * 업데이트 처리
   */
  private async processUpdate<T>(
    update: OptimisticUpdate<T>,
    actualUpdateFn: () => Promise<T>,
    retryDelay: number,
    rollbackOnError: boolean
  ): Promise<UpdateResult<T>> {
    update.status = UpdateStatus.IN_PROGRESS;

    for (let attempt = 0; attempt <= update.maxRetries; attempt++) {
      try {
        // 실제 업데이트 수행
        const actualValue = await actualUpdateFn();

        // 성공 처리
        update.actualValue = actualValue;
        update.status = UpdateStatus.SUCCESS;
        this.updates.set(update.id, update);
        this.emit('update:success', update);

        return {
          success: true,
          data: actualValue
        };

      } catch (error) {
        update.retryCount = attempt;

        if (attempt < update.maxRetries) {
          // 재시도
          this.emit('update:retry', update, attempt + 1);
          await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        } else {
          // 최종 실패
          update.status = UpdateStatus.FAILED;
          this.updates.set(update.id, update);
          this.emit('update:failed', update, error as Error);

          // 롤백 처리
          if (rollbackOnError && update.previousValue !== undefined) {
            await this.rollback(update);
            return {
              success: false,
              error: error as Error,
              rollbackData: update.previousValue
            };
          }

          return {
            success: false,
            error: error as Error
          };
        }
      }
    }

    return {
      success: false,
      error: new Error('Max retries exceeded')
    };
  }

  /**
   * 낙관적 업데이트 적용
   */
  private applyOptimisticUpdate<T>(update: OptimisticUpdate<T>): void {
    // UI 업데이트는 이벤트를 통해 처리
    // 실제 구현은 컴포넌트에서 리스너로 처리
    console.log(`🚀 낙관적 업데이트 적용: ${update.id}`, update.optimisticValue);
  }

  /**
   * 롤백 처리
   */
  private async rollback<T>(update: OptimisticUpdate<T>): Promise<void> {
    if (update.previousValue === undefined) return;

    update.status = UpdateStatus.ROLLED_BACK;
    update.optimisticValue = update.previousValue;
    this.updates.set(update.id, update);

    this.emit('update:rollback', update);
    console.log(`↩️ 롤백 수행: ${update.id}`, update.previousValue);
  }

  /**
   * 디바운싱
   */
  private debounce(id: string, delay: number): Promise<void> {
    return new Promise(resolve => {
      const existing = this.debounceTimers.get(id);
      if (existing) {
        clearTimeout(existing);
      }

      const timer = setTimeout(() => {
        this.debounceTimers.delete(id);
        resolve();
      }, delay);

      this.debounceTimers.set(id, timer);
    });
  }

  private debounceTimers = new Map<string, NodeJS.Timeout>();

  /**
   * 지연 유틸리티
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 업데이트 상태 조회
   */
  getUpdate(id: string): OptimisticUpdate | undefined {
    return this.updates.get(id);
  }

  /**
   * 모든 업데이트 조회
   */
  getAllUpdates(): OptimisticUpdate[] {
    return Array.from(this.updates.values());
  }

  /**
   * 펜딩 업데이트 조회
   */
  getPendingUpdates(): OptimisticUpdate[] {
    return this.getAllUpdates().filter(u =>
      u.status === UpdateStatus.PENDING ||
      u.status === UpdateStatus.IN_PROGRESS
    );
  }

  /**
   * 업데이트 취소
   */
  cancelUpdate(id: string): boolean {
    const update = this.updates.get(id);
    if (!update || update.status !== UpdateStatus.PENDING) {
      return false;
    }

    // 큐에서 제거
    const index = this.updateQueue.findIndex(u => u.id === id);
    if (index > -1) {
      this.updateQueue.splice(index, 1);
    }

    // 상태 업데이트
    update.status = UpdateStatus.ROLLED_BACK;
    if (update.previousValue !== undefined) {
      update.optimisticValue = update.previousValue;
    }

    this.updates.set(id, update);
    this.emit('update:rollback', update);

    return true;
  }

  /**
   * 통계 정보
   */
  getStatistics(): {
    total: number;
    pending: number;
    inProgress: number;
    success: number;
    failed: number;
    rolledBack: number;
  } {
    const all = this.getAllUpdates();
    return {
      total: all.length,
      pending: all.filter(u => u.status === UpdateStatus.PENDING).length,
      inProgress: all.filter(u => u.status === UpdateStatus.IN_PROGRESS).length,
      success: all.filter(u => u.status === UpdateStatus.SUCCESS).length,
      failed: all.filter(u => u.status === UpdateStatus.FAILED).length,
      rolledBack: all.filter(u => u.status === UpdateStatus.ROLLED_BACK).length
    };
  }

  /**
   * 클리어
   */
  clear(): void {
    this.updates.clear();
    this.updateQueue = [];
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}

/**
 * React Hook: 낙관적 업데이트
 */
export const useOptimisticUpdate = <T>(
  initialValue: T,
  updateFn: (value: T) => Promise<T>,
  options: UpdateOptions = {}
) => {
  const [value, setValue] = useState<T>(initialValue);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);

  const manager = useRef(OptimisticUpdateManager.getInstance());
  const updateIdRef = useRef<string>(`update-${Date.now()}`);

  // 낙관적 업데이트 수행
  const update = useCallback(async (newValue: T): Promise<UpdateResult<T>> => {
    setIsUpdating(true);
    setError(null);

    // 즉시 UI 업데이트 (낙관적)
    setValue(newValue);
    setUpdateStatus(UpdateStatus.IN_PROGRESS);

    try {
      const result = await manager.current.performUpdate(
        updateIdRef.current,
        UpdateType.UPDATE,
        newValue,
        () => updateFn(newValue),
        options
      );

      if (result.success) {
        // 실제 값으로 업데이트
        if (result.data) {
          setValue(result.data);
        }
        setUpdateStatus(UpdateStatus.SUCCESS);
      } else {
        // 실패 시 처리
        setError(result.error || new Error('Update failed'));
        setUpdateStatus(UpdateStatus.FAILED);

        // 롤백된 경우
        if (result.rollbackData !== undefined) {
          setValue(result.rollbackData);
          setUpdateStatus(UpdateStatus.ROLLED_BACK);
        }
      }

      return result;
    } finally {
      setIsUpdating(false);
    }
  }, [updateFn, options]);

  // 이벤트 리스너 설정
  useEffect(() => {
    const handleUpdateSuccess = (update: OptimisticUpdate) => {
      if (update.id === updateIdRef.current && update.actualValue) {
        setValue(update.actualValue as T);
      }
    };

    const handleUpdateRollback = (update: OptimisticUpdate) => {
      if (update.id === updateIdRef.current && update.previousValue !== undefined) {
        setValue(update.previousValue as T);
      }
    };

    manager.current.on('update:success', handleUpdateSuccess);
    manager.current.on('update:rollback', handleUpdateRollback);

    return () => {
      manager.current.off('update:success', handleUpdateSuccess);
      manager.current.off('update:rollback', handleUpdateRollback);
    };
  }, []);

  // 취소 함수
  const cancel = useCallback(() => {
    const success = manager.current.cancelUpdate(updateIdRef.current);
    if (success) {
      setIsUpdating(false);
      setUpdateStatus(UpdateStatus.ROLLED_BACK);
    }
    return success;
  }, []);

  // 재시도 함수
  const retry = useCallback(async (): Promise<UpdateResult<T>> => {
    const currentUpdate = manager.current.getUpdate(updateIdRef.current);
    if (currentUpdate && currentUpdate.status === UpdateStatus.FAILED) {
      return update(currentUpdate.optimisticValue as T);
    }
    return { success: false, error: new Error('No failed update to retry') };
  }, [update]);

  return {
    value,
    update,
    cancel,
    retry,
    isUpdating,
    error,
    status: updateStatus,
    statistics: () => manager.current.getStatistics()
  };
};

/**
 * React Hook: 여러 낙관적 업데이트 관리
 */
export const useOptimisticUpdates = <T extends { id: string }>() => {
  const [items, setItems] = useState<T[]>([]);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const manager = useRef(OptimisticUpdateManager.getInstance());

  // 아이템 추가 (낙관적)
  const addItem = useCallback(async (
    item: T,
    addFn: (item: T) => Promise<T>
  ): Promise<UpdateResult<T>> => {
    // 즉시 추가
    setItems(prev => [...prev, item]);
    setUpdatingIds(prev => new Set(prev).add(item.id));

    const result = await manager.current.performUpdate(
      `add-${item.id}`,
      UpdateType.CREATE,
      item,
      () => addFn(item)
    );

    setUpdatingIds(prev => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });

    if (!result.success) {
      // 실패 시 제거
      setItems(prev => prev.filter(i => i.id !== item.id));
    }

    return result;
  }, []);

  // 아이템 업데이트 (낙관적)
  const updateItem = useCallback(async (
    id: string,
    updates: Partial<T>,
    updateFn: (id: string, updates: Partial<T>) => Promise<T>
  ): Promise<UpdateResult<T>> => {
    const prevItem = items.find(i => i.id === id);
    if (!prevItem) {
      return { success: false, error: new Error('Item not found') };
    }

    // 즉시 업데이트
    const optimisticItem = { ...prevItem, ...updates };
    setItems(prev => prev.map(i => i.id === id ? optimisticItem : i));
    setUpdatingIds(prev => new Set(prev).add(id));

    const result = await manager.current.performUpdate(
      `update-${id}`,
      UpdateType.UPDATE,
      optimisticItem,
      () => updateFn(id, updates),
      { rollbackOnError: true }
    );

    setUpdatingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    if (!result.success && result.rollbackData) {
      // 롤백
      setItems(prev => prev.map(i => i.id === id ? result.rollbackData as T : i));
    }

    return result;
  }, [items]);

  // 아이템 삭제 (낙관적)
  const deleteItem = useCallback(async (
    id: string,
    deleteFn: (id: string) => Promise<void>
  ): Promise<UpdateResult<void>> => {
    const prevItem = items.find(i => i.id === id);
    if (!prevItem) {
      return { success: false, error: new Error('Item not found') };
    }

    // 즉시 제거
    setItems(prev => prev.filter(i => i.id !== id));
    setUpdatingIds(prev => new Set(prev).add(id));

    const result = await manager.current.performUpdate(
      `delete-${id}`,
      UpdateType.DELETE,
      null,
      () => deleteFn(id)
    );

    setUpdatingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    if (!result.success) {
      // 실패 시 복원
      setItems(prev => [...prev, prevItem]);
    }

    return result;
  }, [items]);

  return {
    items,
    setItems,
    addItem,
    updateItem,
    deleteItem,
    isUpdating: (id: string) => updatingIds.has(id),
    updatingIds: Array.from(updatingIds),
    statistics: () => manager.current.getStatistics()
  };
};

// 싱글톤 인스턴스 export
export const optimisticUpdateManager = OptimisticUpdateManager.getInstance();