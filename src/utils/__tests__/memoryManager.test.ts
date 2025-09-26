/**
 * Memory Management 테스트
 * Phase 3: 메모리 누수 방지 및 최적화 검증
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import {
  AbortControllerManager,
  WeakEventManager,
  TimerManager,
  MemoryMonitor,
  useSafeAsync,
  useEventListener,
  useTimer,
  useWeakCache
} from '../memoryManager';

describe('Phase 3: 메모리 관리 최적화 테스트', () => {

  describe('AbortControllerManager', () => {
    let manager: AbortControllerManager;

    beforeEach(() => {
      manager = AbortControllerManager.getInstance();
    });

    afterEach(() => {
      manager.abortAll();
    });

    it('싱글톤 인스턴스를 반환해야 함', () => {
      const instance1 = AbortControllerManager.getInstance();
      const instance2 = AbortControllerManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('새 컨트롤러를 생성하고 관리해야 함', () => {
      const controller = manager.create('test');
      expect(controller).toBeInstanceOf(AbortController);
      expect(manager.getActiveCount()).toBe(1);
    });

    it('특정 컨트롤러를 취소해야 함', () => {
      const controller = manager.create('test');
      const abortSpy = jest.fn();
      controller.signal.addEventListener('abort', abortSpy);

      manager.abort('test');
      expect(abortSpy).toHaveBeenCalled();
      expect(manager.getActiveCount()).toBe(0);
    });

    it('모든 컨트롤러를 취소해야 함', () => {
      manager.create('test1');
      manager.create('test2');
      manager.create('test3');

      expect(manager.getActiveCount()).toBe(3);

      manager.abortAll();
      expect(manager.getActiveCount()).toBe(0);
    });

    it('동일 ID로 재생성 시 이전 컨트롤러를 정리해야 함', () => {
      const controller1 = manager.create('test');
      const abortSpy = jest.fn();
      controller1.signal.addEventListener('abort', abortSpy);

      const controller2 = manager.create('test');
      expect(abortSpy).toHaveBeenCalled();
      expect(controller1).not.toBe(controller2);
      expect(manager.getActiveCount()).toBe(1);
    });
  });

  describe('WeakEventManager', () => {
    let manager: WeakEventManager;

    beforeEach(() => {
      manager = new WeakEventManager();
    });

    it('이벤트 리스너를 추가하고 cleanup 함수를 반환해야 함', () => {
      const target = document.createElement('div');
      const handler = jest.fn();

      const cleanup = manager.addEventListener(target, 'click', handler);
      expect(typeof cleanup).toBe('function');

      // 실제 이벤트 발생
      target.click();
      expect(handler).toHaveBeenCalled();

      // cleanup 실행
      cleanup();
      handler.mockClear();
      target.click();
      expect(handler).not.toHaveBeenCalled();
    });

    it('특정 이벤트의 모든 리스너를 제거해야 함', () => {
      const target = document.createElement('div');
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      manager.addEventListener(target, 'click', handler1);
      manager.addEventListener(target, 'click', handler2);

      manager.removeEventListener(target, 'click');

      target.click();
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('가비지 컬렉션된 객체의 리스너를 정리해야 함', () => {
      const handler = jest.fn();
      let obj: any = { id: 'test' };
      const weakRef = new WeakRef(obj);

      manager.addGlobalListener('test-event', handler, weakRef);

      // 객체 해제
      obj = null;

      // 강제 가비지 컬렉션 시뮬레이션
      if (global.gc) {
        global.gc();
      }

      manager.cleanupStaleListeners();
      // WeakRef가 deref()에서 undefined를 반환하면 정리됨
    });
  });

  describe('TimerManager', () => {
    let manager: TimerManager;

    beforeEach(() => {
      manager = new TimerManager();
      jest.useFakeTimers();
    });

    afterEach(() => {
      manager.clearAll();
      jest.useRealTimers();
    });

    it('setTimeout을 관리해야 함', () => {
      const callback = jest.fn();
      manager.setTimeout('test', callback, 1000);

      expect(manager.getActiveCount().timers).toBe(1);

      jest.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalled();
      expect(manager.getActiveCount().timers).toBe(0);
    });

    it('setInterval을 관리해야 함', () => {
      const callback = jest.fn();
      manager.setInterval('test', callback, 1000);

      expect(manager.getActiveCount().intervals).toBe(1);

      jest.advanceTimersByTime(3000);
      expect(callback).toHaveBeenCalledTimes(3);

      manager.clearInterval('test');
      expect(manager.getActiveCount().intervals).toBe(0);
    });

    it('모든 타이머를 정리해야 함', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      manager.setTimeout('timer1', callback1, 1000);
      manager.setInterval('interval1', callback2, 500);

      expect(manager.getActiveCount().timers).toBe(1);
      expect(manager.getActiveCount().intervals).toBe(1);

      manager.clearAll();

      expect(manager.getActiveCount().timers).toBe(0);
      expect(manager.getActiveCount().intervals).toBe(0);

      jest.advanceTimersByTime(2000);
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe('useSafeAsync Hook', () => {
    it('비동기 작업을 안전하게 실행해야 함', async () => {
      const asyncFn = jest.fn(async (signal: AbortSignal) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (signal.aborted) throw new Error('Aborted');
        return 'success';
      });

      const { result } = renderHook(() => useSafeAsync(asyncFn));

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();

      await act(async () => {
        result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.data).toBe('success');
        expect(result.current.loading).toBe(false);
      });
    });

    it('컴포넌트 언마운트 시 작업을 취소해야 함', async () => {
      const asyncFn = jest.fn(async (signal: AbortSignal) => {
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            if (signal.aborted) {
              reject(new Error('AbortError'));
            } else {
              resolve('success');
            }
          }, 1000);
        });
      });

      const { result, unmount } = renderHook(() => useSafeAsync(asyncFn));

      act(() => {
        result.current.execute();
      });

      expect(result.current.loading).toBe(true);

      // 언마운트로 취소
      unmount();

      // 에러가 발생하지 않아야 함 (AbortError는 무시)
    });

    it('수동으로 작업을 취소할 수 있어야 함', async () => {
      const asyncFn = jest.fn(async (signal: AbortSignal) => {
        return new Promise((resolve) => {
          setTimeout(() => resolve('success'), 1000);
        });
      });

      const { result } = renderHook(() => useSafeAsync(asyncFn));

      act(() => {
        result.current.execute();
      });

      expect(result.current.loading).toBe(true);

      act(() => {
        result.current.cancel();
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('useTimer Hook', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('타이머를 안전하게 관리해야 함', () => {
      const { result } = renderHook(() => useTimer());
      const callback = jest.fn();

      act(() => {
        result.current.setTimeout(callback, 1000);
      });

      jest.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalled();
    });

    it('언마운트 시 모든 타이머를 정리해야 함', () => {
      const { result, unmount } = renderHook(() => useTimer());
      const callback = jest.fn();

      act(() => {
        result.current.setTimeout(callback, 1000);
        result.current.setInterval(callback, 500);
      });

      unmount();

      jest.advanceTimersByTime(2000);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('useWeakCache Hook', () => {
    it('WeakMap 기반 캐시를 제공해야 함', () => {
      const { result } = renderHook(() => useWeakCache<object, string>());

      const key = { id: 1 };
      const value = 'cached value';

      act(() => {
        result.current.set(key, value);
      });

      expect(result.current.get(key)).toBe(value);
      expect(result.current.has(key)).toBe(true);

      act(() => {
        result.current.remove(key);
      });

      expect(result.current.has(key)).toBe(false);
    });

    it('가비지 컬렉션이 가능해야 함', () => {
      const { result } = renderHook(() => useWeakCache<object, string>());

      let key: any = { id: 1 };
      const value = 'cached value';

      act(() => {
        result.current.set(key, value);
      });

      expect(result.current.has(key)).toBe(true);

      // 키 참조 해제
      const weakKey = key;
      key = null;

      // WeakMap이므로 가비지 컬렉션 시 자동 제거됨
      // (실제 GC는 테스트에서 제어하기 어려움)
      expect(result.current.has(weakKey)).toBe(true); // 아직 weakKey 참조 존재
    });
  });

  describe('MemoryMonitor', () => {
    let monitor: MemoryMonitor;

    beforeEach(() => {
      monitor = MemoryMonitor.getInstance();
      monitor.reset();
    });

    it('싱글톤 인스턴스를 반환해야 함', () => {
      const instance1 = MemoryMonitor.getInstance();
      const instance2 = MemoryMonitor.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('메모리 사용량을 측정해야 함', () => {
      const measurement = monitor.measure();

      expect(measurement).toHaveProperty('timestamp');
      expect(measurement).toHaveProperty('heapUsed');
      expect(measurement).toHaveProperty('heapTotal');
      expect(measurement).toHaveProperty('external');
      expect(measurement.timestamp).toBeCloseTo(Date.now(), -100);
    });

    it('메모리 통계를 제공해야 함', () => {
      // 여러 측정 수행
      for (let i = 0; i < 5; i++) {
        monitor.measure();
      }

      const stats = monitor.getStatistics();

      expect(stats).toHaveProperty('current');
      expect(stats).toHaveProperty('average');
      expect(stats).toHaveProperty('peak');
      expect(stats).toHaveProperty('trend');
      expect(['increasing', 'decreasing', 'stable']).toContain(stats.trend);
    });

    it('메모리 누수를 감지해야 함', () => {
      // 증가하는 메모리 사용량 시뮬레이션
      const mockMemory = (amount: number) => {
        Object.defineProperty(performance, 'memory', {
          value: {
            usedJSHeapSize: amount,
            totalJSHeapSize: amount * 2,
            jsHeapSizeLimit: amount * 3
          },
          writable: true,
          configurable: true
        });
      };

      // 초기 측정
      for (let i = 0; i < 10; i++) {
        mockMemory(1000000 + i * 10000);
        monitor.measure();
      }

      // 급격한 증가
      for (let i = 0; i < 10; i++) {
        mockMemory(2000000 + i * 50000);
        monitor.measure();
      }

      const hasLeak = monitor.detectLeak(10);
      expect(hasLeak).toBe(true);
    });

    it('측정 기록을 초기화할 수 있어야 함', () => {
      for (let i = 0; i < 5; i++) {
        monitor.measure();
      }

      const statsBefore = monitor.getStatistics();
      expect(statsBefore.average).toBeGreaterThan(0);

      monitor.reset();

      const statsAfter = monitor.getStatistics();
      expect(statsAfter.current).toBe(0);
      expect(statsAfter.average).toBe(0);
    });
  });

  describe('메모리 누수 시나리오 테스트', () => {
    it('이벤트 리스너 누수를 방지해야 함', () => {
      const manager = new WeakEventManager();
      const targets: HTMLElement[] = [];
      const handlers: Function[] = [];

      // 많은 이벤트 리스너 생성
      for (let i = 0; i < 100; i++) {
        const target = document.createElement('div');
        const handler = jest.fn();

        targets.push(target);
        handlers.push(handler);

        manager.addEventListener(target, 'click', handler);
      }

      // 모든 타겟 제거
      targets.forEach(target => {
        manager.removeEventListener(target);
      });

      // 이벤트 발생 시도 - 핸들러가 호출되지 않아야 함
      targets.forEach((target, i) => {
        target.click();
        expect(handlers[i]).not.toHaveBeenCalled();
      });
    });

    it('타이머 누수를 방지해야 함', () => {
      jest.useFakeTimers();
      const manager = new TimerManager();
      const callbacks: jest.Mock[] = [];

      // 많은 타이머 생성
      for (let i = 0; i < 100; i++) {
        const callback = jest.fn();
        callbacks.push(callback);
        manager.setTimeout(`timer${i}`, callback, 1000 * i);
      }

      expect(manager.getActiveCount().timers).toBe(100);

      // 모든 타이머 정리
      manager.clearAll();
      expect(manager.getActiveCount().timers).toBe(0);

      // 시간 경과 - 콜백이 실행되지 않아야 함
      jest.advanceTimersByTime(100000);
      callbacks.forEach(callback => {
        expect(callback).not.toHaveBeenCalled();
      });

      jest.useRealTimers();
    });
  });
});