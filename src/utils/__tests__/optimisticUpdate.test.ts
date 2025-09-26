/**
 * Optimistic Update System 테스트
 * Phase 4: 낙관적 업데이트 패턴 검증
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import {
  OptimisticUpdateManager,
  useOptimisticUpdate,
  useOptimisticUpdates,
  UpdateStatus,
  UpdateType
} from '../optimisticUpdate';

describe('Phase 4: 낙관적 업데이트 테스트', () => {

  describe('OptimisticUpdateManager', () => {
    let manager: OptimisticUpdateManager;

    beforeEach(() => {
      manager = OptimisticUpdateManager.getInstance();
      manager.clear();
    });

    it('싱글톤 인스턴스를 반환해야 함', () => {
      const instance1 = OptimisticUpdateManager.getInstance();
      const instance2 = OptimisticUpdateManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('낙관적 업데이트를 수행해야 함', async () => {
      const optimisticValue = { id: '1', name: 'Optimistic' };
      const actualValue = { id: '1', name: 'Actual' };

      const actualUpdateFn = jest.fn().mockResolvedValue(actualValue);

      const result = await manager.performUpdate(
        'test-update',
        UpdateType.UPDATE,
        optimisticValue,
        actualUpdateFn
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(actualValue);
      expect(actualUpdateFn).toHaveBeenCalled();
    });

    it('실패 시 재시도를 수행해야 함', async () => {
      let attemptCount = 0;
      const actualUpdateFn = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({ success: true });
      });

      const result = await manager.performUpdate(
        'retry-test',
        UpdateType.UPDATE,
        { value: 'test' },
        actualUpdateFn,
        { maxRetries: 3, retryDelay: 10 }
      );

      expect(result.success).toBe(true);
      expect(actualUpdateFn).toHaveBeenCalledTimes(3);
    });

    it('최대 재시도 초과 시 실패해야 함', async () => {
      const actualUpdateFn = jest.fn().mockRejectedValue(new Error('Persistent error'));

      const result = await manager.performUpdate(
        'fail-test',
        UpdateType.UPDATE,
        { value: 'test' },
        actualUpdateFn,
        { maxRetries: 2, retryDelay: 10 }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(actualUpdateFn).toHaveBeenCalledTimes(3); // 초기 + 2 재시도
    });

    it('롤백 옵션이 활성화된 경우 이전 값으로 복원해야 함', async () => {
      const previousValue = { id: '1', value: 'previous' };
      const optimisticValue = { id: '1', value: 'optimistic' };

      // 먼저 초기값 설정
      await manager.performUpdate(
        'rollback-test',
        UpdateType.CREATE,
        previousValue,
        () => Promise.resolve(previousValue)
      );

      // 실패하는 업데이트 수행
      const result = await manager.performUpdate(
        'rollback-test',
        UpdateType.UPDATE,
        optimisticValue,
        () => Promise.reject(new Error('Update failed')),
        { rollbackOnError: true, maxRetries: 0 }
      );

      expect(result.success).toBe(false);
      expect(result.rollbackData).toEqual(previousValue);
    });

    it('업데이트 취소가 가능해야 함', async () => {
      const longRunningUpdate = new Promise(resolve => {
        setTimeout(() => resolve({ success: true }), 1000);
      });

      // 펜딩 상태로 업데이트 생성 (실행하지 않음)
      const update = {
        id: 'cancel-test',
        type: UpdateType.UPDATE,
        optimisticValue: { value: 'test' },
        previousValue: { value: 'previous' },
        status: UpdateStatus.PENDING,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3
      };

      manager['updates'].set('cancel-test', update);
      manager['updateQueue'].push(update);

      const cancelled = manager.cancelUpdate('cancel-test');
      expect(cancelled).toBe(true);

      const cancelledUpdate = manager.getUpdate('cancel-test');
      expect(cancelledUpdate?.status).toBe(UpdateStatus.ROLLED_BACK);
      expect(cancelledUpdate?.optimisticValue).toEqual({ value: 'previous' });
    });

    it('통계 정보를 제공해야 함', async () => {
      // 여러 업데이트 수행
      await manager.performUpdate(
        'stat1',
        UpdateType.CREATE,
        { id: '1' },
        () => Promise.resolve({ id: '1' })
      );

      await manager.performUpdate(
        'stat2',
        UpdateType.UPDATE,
        { id: '2' },
        () => Promise.reject(new Error('Failed')),
        { maxRetries: 0 }
      );

      const stats = manager.getStatistics();
      expect(stats.total).toBe(2);
      expect(stats.success).toBe(1);
      expect(stats.failed).toBe(1);
    });

    it('디바운싱을 지원해야 함', async () => {
      const actualUpdateFn = jest.fn().mockResolvedValue({ success: true });
      const startTime = Date.now();

      await manager.performUpdate(
        'debounce-test',
        UpdateType.UPDATE,
        { value: 'test' },
        actualUpdateFn,
        { debounceMs: 100 }
      );

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
      expect(actualUpdateFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('useOptimisticUpdate Hook', () => {
    it('낙관적 업데이트를 수행해야 함', async () => {
      const updateFn = jest.fn((value: string) => Promise.resolve(`Updated: ${value}`));

      const { result } = renderHook(() =>
        useOptimisticUpdate('initial', updateFn)
      );

      expect(result.current.value).toBe('initial');
      expect(result.current.isUpdating).toBe(false);

      await act(async () => {
        const updateResult = await result.current.update('new value');
        expect(updateResult.success).toBe(true);
      });

      expect(result.current.value).toBe('Updated: new value');
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.status).toBe(UpdateStatus.SUCCESS);
    });

    it('에러 발생 시 상태를 업데이트해야 함', async () => {
      const error = new Error('Update failed');
      const updateFn = jest.fn().mockRejectedValue(error);

      const { result } = renderHook(() =>
        useOptimisticUpdate('initial', updateFn, { maxRetries: 0 })
      );

      await act(async () => {
        const updateResult = await result.current.update('new value');
        expect(updateResult.success).toBe(false);
      });

      expect(result.current.error).toEqual(error);
      expect(result.current.status).toBe(UpdateStatus.FAILED);
    });

    it('업데이트 중 isUpdating 플래그가 설정되어야 함', async () => {
      const updateFn = jest.fn(() =>
        new Promise(resolve => setTimeout(() => resolve('done'), 100))
      );

      const { result } = renderHook(() =>
        useOptimisticUpdate('initial', updateFn)
      );

      let updatePromise: Promise<any>;
      act(() => {
        updatePromise = result.current.update('new');
      });

      // 업데이트 중 확인
      expect(result.current.isUpdating).toBe(true);

      await act(async () => {
        await updatePromise;
      });

      // 업데이트 완료 확인
      expect(result.current.isUpdating).toBe(false);
    });

    it('재시도가 가능해야 함', async () => {
      let failCount = 0;
      const updateFn = jest.fn(() => {
        failCount++;
        if (failCount === 1) {
          return Promise.reject(new Error('First attempt failed'));
        }
        return Promise.resolve('success');
      });

      const { result } = renderHook(() =>
        useOptimisticUpdate('initial', updateFn, { maxRetries: 0 })
      );

      // 첫 번째 시도 - 실패
      await act(async () => {
        await result.current.update('test');
      });

      expect(result.current.status).toBe(UpdateStatus.FAILED);

      // 재시도 - 성공
      await act(async () => {
        const retryResult = await result.current.retry();
        expect(retryResult.success).toBe(true);
      });

      expect(result.current.value).toBe('success');
      expect(result.current.status).toBe(UpdateStatus.SUCCESS);
    });
  });

  describe('useOptimisticUpdates Hook', () => {
    interface TestItem {
      id: string;
      name: string;
      value: number;
    }

    it('아이템 추가를 낙관적으로 처리해야 함', async () => {
      const addFn = jest.fn((item: TestItem) => Promise.resolve(item));

      const { result } = renderHook(() => useOptimisticUpdates<TestItem>());

      const newItem: TestItem = { id: '1', name: 'Test', value: 100 };

      await act(async () => {
        const addResult = await result.current.addItem(newItem, addFn);
        expect(addResult.success).toBe(true);
      });

      expect(result.current.items).toContainEqual(newItem);
      expect(addFn).toHaveBeenCalledWith(newItem);
    });

    it('아이템 업데이트를 낙관적으로 처리해야 함', async () => {
      const updateFn = jest.fn((id: string, updates: Partial<TestItem>) =>
        Promise.resolve({ id, name: 'Updated', value: 200 })
      );

      const { result } = renderHook(() => useOptimisticUpdates<TestItem>());

      // 초기 아이템 설정
      act(() => {
        result.current.setItems([
          { id: '1', name: 'Original', value: 100 }
        ]);
      });

      await act(async () => {
        const updateResult = await result.current.updateItem(
          '1',
          { name: 'Updated', value: 200 },
          updateFn
        );
        expect(updateResult.success).toBe(true);
      });

      expect(result.current.items[0].name).toBe('Updated');
      expect(result.current.items[0].value).toBe(200);
    });

    it('아이템 삭제를 낙관적으로 처리해야 함', async () => {
      const deleteFn = jest.fn((id: string) => Promise.resolve());

      const { result } = renderHook(() => useOptimisticUpdates<TestItem>());

      // 초기 아이템 설정
      act(() => {
        result.current.setItems([
          { id: '1', name: 'Item 1', value: 100 },
          { id: '2', name: 'Item 2', value: 200 }
        ]);
      });

      await act(async () => {
        const deleteResult = await result.current.deleteItem('1', deleteFn);
        expect(deleteResult.success).toBe(true);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].id).toBe('2');
    });

    it('실패 시 아이템을 복원해야 함', async () => {
      const deleteFn = jest.fn().mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useOptimisticUpdates<TestItem>());

      const item = { id: '1', name: 'Item', value: 100 };

      // 초기 아이템 설정
      act(() => {
        result.current.setItems([item]);
      });

      await act(async () => {
        const deleteResult = await result.current.deleteItem('1', deleteFn);
        expect(deleteResult.success).toBe(false);
      });

      // 아이템이 복원되어야 함
      expect(result.current.items).toContainEqual(item);
    });

    it('업데이트 중인 아이템을 추적해야 함', async () => {
      const updateFn = jest.fn(() =>
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() => useOptimisticUpdates<TestItem>());

      act(() => {
        result.current.setItems([
          { id: '1', name: 'Item', value: 100 }
        ]);
      });

      let updatePromise: Promise<any>;
      act(() => {
        updatePromise = result.current.updateItem('1', { value: 200 }, updateFn);
      });

      // 업데이트 중 확인
      expect(result.current.isUpdating('1')).toBe(true);
      expect(result.current.updatingIds).toContain('1');

      await act(async () => {
        await updatePromise;
      });

      // 업데이트 완료 확인
      expect(result.current.isUpdating('1')).toBe(false);
      expect(result.current.updatingIds).not.toContain('1');
    });
  });

  describe('이벤트 시스템', () => {
    let manager: OptimisticUpdateManager;

    beforeEach(() => {
      manager = OptimisticUpdateManager.getInstance();
      manager.clear();
    });

    it('업데이트 이벤트를 발생시켜야 함', async () => {
      const events: string[] = [];

      manager.on('update:start', () => events.push('start'));
      manager.on('update:success', () => events.push('success'));

      await manager.performUpdate(
        'event-test',
        UpdateType.UPDATE,
        { value: 'test' },
        () => Promise.resolve({ value: 'done' })
      );

      expect(events).toEqual(['start', 'success']);
    });

    it('실패 이벤트를 발생시켜야 함', async () => {
      const failedHandler = jest.fn();

      manager.on('update:failed', failedHandler);

      await manager.performUpdate(
        'fail-event',
        UpdateType.UPDATE,
        { value: 'test' },
        () => Promise.reject(new Error('Test error')),
        { maxRetries: 0 }
      );

      expect(failedHandler).toHaveBeenCalled();
      const [update, error] = failedHandler.mock.calls[0];
      expect(update.id).toBe('fail-event');
      expect(error.message).toBe('Test error');
    });

    it('재시도 이벤트를 발생시켜야 함', async () => {
      const retryHandler = jest.fn();
      let attemptCount = 0;

      manager.on('update:retry', retryHandler);

      await manager.performUpdate(
        'retry-event',
        UpdateType.UPDATE,
        { value: 'test' },
        () => {
          attemptCount++;
          if (attemptCount < 3) {
            return Promise.reject(new Error('Retry needed'));
          }
          return Promise.resolve({ success: true });
        },
        { maxRetries: 3, retryDelay: 10 }
      );

      expect(retryHandler).toHaveBeenCalledTimes(2); // 2번 재시도
    });

    it('롤백 이벤트를 발생시켜야 함', async () => {
      const rollbackHandler = jest.fn();

      manager.on('update:rollback', rollbackHandler);

      await manager.performUpdate(
        'rollback-event',
        UpdateType.UPDATE,
        { value: 'new' },
        () => Promise.reject(new Error('Failed')),
        { rollbackOnError: true, maxRetries: 0 }
      );

      expect(rollbackHandler).toHaveBeenCalled();
    });
  });
});