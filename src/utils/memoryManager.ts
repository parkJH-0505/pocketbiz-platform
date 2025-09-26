/**
 * Memory Management Utilities
 * Phase 3: 메모리 누수 방지 및 최적화
 *
 * 주요 기능:
 * - AbortController를 활용한 비동기 작업 관리
 * - WeakMap/WeakSet을 활용한 자동 가비지 컬렉션
 * - 이벤트 리스너 자동 정리
 * - 타이머 관리
 */

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * AbortController 관리 클래스
 * 비동기 작업 취소 및 정리를 체계적으로 관리
 */
export class AbortControllerManager {
  private controllers: Map<string, AbortController> = new Map();
  private static instance: AbortControllerManager;

  private constructor() {}

  static getInstance(): AbortControllerManager {
    if (!this.instance) {
      this.instance = new AbortControllerManager();
    }
    return this.instance;
  }

  /**
   * 새 AbortController 생성 및 등록
   */
  create(id: string): AbortController {
    // 기존 컨트롤러가 있으면 먼저 정리
    this.abort(id);

    const controller = new AbortController();
    this.controllers.set(id, controller);
    return controller;
  }

  /**
   * 특정 컨트롤러 취소
   */
  abort(id: string): void {
    const controller = this.controllers.get(id);
    if (controller && !controller.signal.aborted) {
      controller.abort();
    }
    this.controllers.delete(id);
  }

  /**
   * 모든 컨트롤러 취소
   */
  abortAll(): void {
    this.controllers.forEach((controller, id) => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    });
    this.controllers.clear();
  }

  /**
   * 특정 컨트롤러의 signal 가져오기
   */
  getSignal(id: string): AbortSignal | undefined {
    return this.controllers.get(id)?.signal;
  }

  /**
   * 활성 컨트롤러 수 반환
   */
  getActiveCount(): number {
    return this.controllers.size;
  }
}

/**
 * WeakMap 기반 이벤트 리스너 관리자
 * 자동 가비지 컬렉션으로 메모리 누수 방지
 */
export class WeakEventManager {
  private listeners = new WeakMap<object, Map<string, Set<Function>>>();
  private globalListeners = new Map<string, Set<WeakListenerWrapper>>();

  /**
   * 이벤트 리스너 추가 (자동 정리)
   */
  addEventListener(
    target: object,
    event: string,
    handler: Function,
    options?: AddEventListenerOptions
  ): () => void {
    if (!this.listeners.has(target)) {
      this.listeners.set(target, new Map());
    }

    const targetListeners = this.listeners.get(target)!;
    if (!targetListeners.has(event)) {
      targetListeners.set(event, new Set());
    }

    targetListeners.get(event)!.add(handler);

    // DOM 요소인 경우 실제 이벤트 리스너 추가
    if (target instanceof EventTarget) {
      target.addEventListener(event, handler as EventListener, options);
    }

    // cleanup 함수 반환
    return () => {
      this.removeEventListener(target, event, handler);
    };
  }

  /**
   * 이벤트 리스너 제거
   */
  removeEventListener(target: object, event?: string, handler?: Function): void {
    const targetListeners = this.listeners.get(target);
    if (!targetListeners) return;

    if (event && handler) {
      targetListeners.get(event)?.delete(handler);

      // DOM 요소인 경우 실제 이벤트 리스너 제거
      if (target instanceof EventTarget) {
        target.removeEventListener(event, handler as EventListener);
      }
    } else if (event) {
      // 특정 이벤트의 모든 리스너 제거
      const handlers = targetListeners.get(event);
      if (handlers && target instanceof EventTarget) {
        handlers.forEach(h => {
          target.removeEventListener(event, h as EventListener);
        });
      }
      targetListeners.delete(event);
    } else {
      // 모든 이벤트 리스너 제거
      if (target instanceof EventTarget) {
        targetListeners.forEach((handlers, evt) => {
          handlers.forEach(h => {
            target.removeEventListener(evt, h as EventListener);
          });
        });
      }
      this.listeners.delete(target);
    }
  }

  /**
   * 전역 이벤트 리스너 관리 (window, document 등)
   */
  addGlobalListener(
    event: string,
    handler: Function,
    weakRef: WeakRef<object>
  ): void {
    if (!this.globalListeners.has(event)) {
      this.globalListeners.set(event, new Set());
    }

    this.globalListeners.get(event)!.add({
      handler,
      weakRef
    });
  }

  /**
   * 가비지 컬렉션된 객체의 리스너 정리
   */
  cleanupStaleListeners(): void {
    this.globalListeners.forEach((listeners, event) => {
      const stale = Array.from(listeners).filter(l => !l.weakRef.deref());
      stale.forEach(s => listeners.delete(s));
    });
  }
}

interface WeakListenerWrapper {
  handler: Function;
  weakRef: WeakRef<object>;
}

/**
 * 타이머 관리자
 * setTimeout/setInterval 자동 정리
 */
export class TimerManager {
  private timers = new Map<string, NodeJS.Timeout>();
  private intervals = new Map<string, NodeJS.Timeout>();

  /**
   * 관리되는 setTimeout
   */
  setTimeout(
    id: string,
    callback: () => void,
    delay: number
  ): void {
    // 기존 타이머 정리
    this.clearTimeout(id);

    const timer = setTimeout(() => {
      callback();
      this.timers.delete(id);
    }, delay);

    this.timers.set(id, timer);
  }

  /**
   * 관리되는 setInterval
   */
  setInterval(
    id: string,
    callback: () => void,
    delay: number
  ): void {
    // 기존 인터벌 정리
    this.clearInterval(id);

    const interval = setInterval(callback, delay);
    this.intervals.set(id, interval);
  }

  /**
   * 특정 타이머 정리
   */
  clearTimeout(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  /**
   * 특정 인터벌 정리
   */
  clearInterval(id: string): void {
    const interval = this.intervals.get(id);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(id);
    }
  }

  /**
   * 모든 타이머/인터벌 정리
   */
  clearAll(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.intervals.forEach(interval => clearInterval(interval));
    this.timers.clear();
    this.intervals.clear();
  }

  /**
   * 활성 타이머 수 반환
   */
  getActiveCount(): { timers: number; intervals: number } {
    return {
      timers: this.timers.size,
      intervals: this.intervals.size
    };
  }
}

/**
 * React Hook: 안전한 비동기 작업 관리
 * AbortController를 활용한 자동 정리
 */
export const useSafeAsync = <T = any>(
  asyncFunction: (signal: AbortSignal) => Promise<T>
) => {
  const abortManager = useRef(AbortControllerManager.getInstance());
  const [state, setState] = useState<{
    data: T | null;
    error: Error | null;
    loading: boolean;
  }>({
    data: null,
    error: null,
    loading: false
  });

  const execute = useCallback(async () => {
    const controller = abortManager.current.create('async-operation');

    setState({ data: null, error: null, loading: true });

    try {
      const data = await asyncFunction(controller.signal);

      // 취소되지 않은 경우에만 상태 업데이트
      if (!controller.signal.aborted) {
        setState({ data, error: null, loading: false });
      }

      return data;
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setState({ data: null, error, loading: false });
      }
      throw error;
    }
  }, [asyncFunction]);

  // 컴포넌트 언마운트 시 정리
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortManager.current.abort('async-operation');
    };
  }, []);

  const cancel = useCallback(() => {
    abortManager.current.abort('async-operation');
    // 마운트된 상태에서만 setState 호출
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  return {
    ...state,
    execute,
    cancel
  };
};

/**
 * React Hook: 이벤트 리스너 자동 정리
 */
export const useEventListener = (
  target: EventTarget | null,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
) => {
  const savedHandler = useRef<EventListener>();
  const eventManager = useRef(new WeakEventManager());

  // 핸들러 저장
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!target) return;

    const eventListener: EventListener = (event) => {
      if (savedHandler.current) {
        savedHandler.current(event);
      }
    };

    // 이벤트 리스너 추가 및 자동 정리 함수 받기
    const cleanup = eventManager.current.addEventListener(
      target,
      event,
      eventListener,
      options
    );

    return cleanup;
  }, [target, event, options]);
};

/**
 * React Hook: 타이머 자동 정리
 */
export const useTimer = () => {
  const timerManager = useRef(new TimerManager());

  const setTimeoutSafe = useCallback((
    callback: () => void,
    delay: number,
    id = 'default'
  ) => {
    timerManager.current.setTimeout(id, callback, delay);
  }, []);

  const setIntervalSafe = useCallback((
    callback: () => void,
    delay: number,
    id = 'default'
  ) => {
    timerManager.current.setInterval(id, callback, delay);
  }, []);

  const clearTimeoutSafe = useCallback((id = 'default') => {
    timerManager.current.clearTimeout(id);
  }, []);

  const clearIntervalSafe = useCallback((id = 'default') => {
    timerManager.current.clearInterval(id);
  }, []);

  // 컴포넌트 언마운트 시 모든 타이머 정리
  useEffect(() => {
    return () => {
      timerManager.current.clearAll();
    };
  }, []);

  return {
    setTimeout: setTimeoutSafe,
    setInterval: setIntervalSafe,
    clearTimeout: clearTimeoutSafe,
    clearInterval: clearIntervalSafe,
    getActiveCount: () => timerManager.current.getActiveCount()
  };
};

/**
 * React Hook: WeakMap 기반 캐시
 * 자동 가비지 컬렉션으로 메모리 효율적
 */
export const useWeakCache = <K extends object, V>() => {
  const cache = useRef(new WeakMap<K, V>());

  const get = useCallback((key: K): V | undefined => {
    return cache.current.get(key);
  }, []);

  const set = useCallback((key: K, value: V): void => {
    cache.current.set(key, value);
  }, []);

  const has = useCallback((key: K): boolean => {
    return cache.current.has(key);
  }, []);

  const remove = useCallback((key: K): boolean => {
    return cache.current.delete(key);
  }, []);

  return { get, set, has, remove };
};

/**
 * 메모리 사용량 모니터링
 */
export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private measurements: MemoryMeasurement[] = [];
  private maxMeasurements = 100;

  private constructor() {}

  static getInstance(): MemoryMonitor {
    if (!this.instance) {
      this.instance = new MemoryMonitor();
    }
    return this.instance;
  }

  /**
   * 현재 메모리 사용량 측정
   */
  measure(): MemoryMeasurement {
    const measurement: MemoryMeasurement = {
      timestamp: Date.now(),
      heapUsed: 0,
      heapTotal: 0,
      external: 0
    };

    // performance.memory API 사용 (Chrome only)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      measurement.heapUsed = memory.usedJSHeapSize;
      measurement.heapTotal = memory.totalJSHeapSize;
      measurement.external = memory.jsHeapSizeLimit;
    }

    this.measurements.push(measurement);

    // 최대 측정값 유지
    if (this.measurements.length > this.maxMeasurements) {
      this.measurements.shift();
    }

    return measurement;
  }

  /**
   * 메모리 누수 감지
   */
  detectLeak(threshold = 10): boolean {
    if (this.measurements.length < 10) return false;

    const recent = this.measurements.slice(-10);
    const older = this.measurements.slice(-20, -10);

    if (older.length === 0) return false;

    const recentAvg = recent.reduce((sum, m) => sum + m.heapUsed, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.heapUsed, 0) / older.length;

    const growthRate = ((recentAvg - olderAvg) / olderAvg) * 100;

    return growthRate > threshold;
  }

  /**
   * 메모리 통계
   */
  getStatistics(): MemoryStatistics {
    if (this.measurements.length === 0) {
      return {
        current: 0,
        average: 0,
        peak: 0,
        trend: 'stable'
      };
    }

    const current = this.measurements[this.measurements.length - 1].heapUsed;
    const average = this.measurements.reduce((sum, m) => sum + m.heapUsed, 0) / this.measurements.length;
    const peak = Math.max(...this.measurements.map(m => m.heapUsed));

    // 트렌드 계산
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (this.measurements.length >= 5) {
      const recent = this.measurements.slice(-5);
      const isIncreasing = recent.every((m, i) =>
        i === 0 || m.heapUsed >= recent[i - 1].heapUsed
      );
      const isDecreasing = recent.every((m, i) =>
        i === 0 || m.heapUsed <= recent[i - 1].heapUsed
      );

      if (isIncreasing) trend = 'increasing';
      else if (isDecreasing) trend = 'decreasing';
    }

    return { current, average, peak, trend };
  }

  /**
   * 측정 기록 초기화
   */
  reset(): void {
    this.measurements = [];
  }
}

interface MemoryMeasurement {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
}

interface MemoryStatistics {
  current: number;
  average: number;
  peak: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

// 싱글톤 인스턴스 export
export const abortControllerManager = AbortControllerManager.getInstance();
export const memoryMonitor = MemoryMonitor.getInstance();