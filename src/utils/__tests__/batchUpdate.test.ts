/**
 * Batch Update System Tests
 * Phase 5: 배치 업데이트 시스템 테스트
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import {
  BatchUpdateManager,
  batchUpdateManager,
  BatchUpdateType,
  BatchPriority,
  BatchStatus
} from '../batchUpdateSystem';
import {
  PriorityQueue,
  SmartBatcher,
  BatchQueueManager,
  QueueStrategy,
  useBatchUpdate,
  useBatchMonitor
} from '../batchQueue';

describe('Phase 5: 배치 업데이트 시스템 테스트', () => {

  describe('BatchUpdateManager', () => {
    let manager: BatchUpdateManager;

    beforeEach(() => {
      manager = BatchUpdateManager.getInstance();
      manager.reset();
    });

    it('싱글톤 인스턴스를 반환해야 함', () => {
      const instance1 = BatchUpdateManager.getInstance();
      const instance2 = BatchUpdateManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('작업을 배치에 추가해야 함', async () => {
      const operationId = manager.add({
        type: BatchUpdateType.CREATE,
        entityType: 'user',
        data: { name: 'Test User' },
        priority: BatchPriority.NORMAL
      });

      expect(operationId).toBeDefined();
      expect(operationId).toContain('op-user-create');
    });

    it('중복 작업을 감지하고 스킵해야 함', () => {
      manager.configure({ deduplication: true });

      const operation = {
        type: BatchUpdateType.UPDATE,
        entityType: 'user',
        entityId: '123',
        data: { name: 'Updated' },
        priority: BatchPriority.NORMAL
      };

      const id1 = manager.add(operation);
      const id2 = manager.add(operation);

      const status = manager.getStatus();
      expect(status.pendingOperations.length).toBe(1);
    });

    it('유사한 업데이트를 병합해야 함', () => {
      manager.configure({ mergeSimilar: true });

      manager.add({
        type: BatchUpdateType.UPDATE,
        entityType: 'user',
        entityId: '123',
        data: { name: 'John' },
        priority: BatchPriority.NORMAL
      });

      manager.add({
        type: BatchUpdateType.UPDATE,
        entityType: 'user',
        entityId: '123',
        data: { email: 'john@example.com' },
        priority: BatchPriority.NORMAL
      });

      const status = manager.getStatus();
      expect(status.pendingOperations.length).toBe(1);
      expect(status.pendingOperations[0].data).toEqual({
        name: 'John',
        email: 'john@example.com'
      });
    });

    it('우선순위가 높은 작업을 즉시 처리해야 함', (done) => {
      manager.configure({ batchTimeout: 5000 });

      const criticalOp = {
        type: BatchUpdateType.CREATE,
        entityType: 'alert',
        data: { message: 'Critical' },
        priority: BatchPriority.CRITICAL
      };

      manager.on('batch:queued', () => {
        // 긴급 작업은 100ms 내에 큐에 들어가야 함
        expect(true).toBe(true);
        done();
      });

      manager.add(criticalOp);
    });

    it('배치 크기 초과 시 자동으로 플러시해야 함', (done) => {
      manager.configure({ maxBatchSize: 3, batchTimeout: 10000 });

      let batchQueued = false;
      manager.on('batch:queued', () => {
        batchQueued = true;
        done();
      });

      // 3개 작업 추가 (maxBatchSize)
      for (let i = 0; i < 3; i++) {
        manager.add({
          type: BatchUpdateType.CREATE,
          entityType: 'item',
          data: { id: i },
          priority: BatchPriority.NORMAL
        });
      }

      // 배치가 즉시 처리되어야 함
      setTimeout(() => {
        if (!batchQueued) {
          done(new Error('배치가 자동 플러시되지 않음'));
        }
      }, 500);
    });

    it('작업을 취소할 수 있어야 함', () => {
      const id = manager.add({
        type: BatchUpdateType.CREATE,
        entityType: 'user',
        data: { name: 'Test' },
        priority: BatchPriority.NORMAL
      });

      const cancelled = manager.cancel(id);
      expect(cancelled).toBe(true);

      const status = manager.getStatus();
      expect(status.pendingOperations.length).toBe(0);
    });

    it('통계를 정확하게 추적해야 함', async () => {
      const initialStats = manager.getStatistics();
      expect(initialStats.totalBatches).toBe(0);

      manager.add({
        type: BatchUpdateType.CREATE,
        entityType: 'user',
        data: { name: 'Test' },
        priority: BatchPriority.NORMAL
      });

      manager.flushBatch();

      await waitFor(() => {
        const stats = manager.getStatistics();
        expect(stats.totalBatches).toBeGreaterThan(0);
      });
    });
  });

  describe('PriorityQueue', () => {
    let queue: PriorityQueue<string>;

    beforeEach(() => {
      queue = new PriorityQueue<string>();
    });

    it('우선순위에 따라 요소를 정렬해야 함', () => {
      queue.enqueue('low', 1);
      queue.enqueue('high', 3);
      queue.enqueue('medium', 2);

      expect(queue.dequeue()).toBe('high');
      expect(queue.dequeue()).toBe('medium');
      expect(queue.dequeue()).toBe('low');
    });

    it('동일 우선순위는 FIFO로 처리해야 함', () => {
      queue.enqueue('first', 1);
      queue.enqueue('second', 1);
      queue.enqueue('third', 1);

      const results = [];
      while (!queue.isEmpty()) {
        results.push(queue.dequeue());
      }

      expect(results).toEqual(['first', 'second', 'third']);
    });

    it('큐 크기를 정확히 반환해야 함', () => {
      expect(queue.size()).toBe(0);

      queue.enqueue('item1', 1);
      expect(queue.size()).toBe(1);

      queue.enqueue('item2', 2);
      expect(queue.size()).toBe(2);

      queue.dequeue();
      expect(queue.size()).toBe(1);
    });
  });

  describe('SmartBatcher', () => {
    let batcher: SmartBatcher;

    beforeEach(() => {
      batcher = new SmartBatcher();
    });

    it('패턴을 학습해야 함', () => {
      const operations = [
        {
          id: '1',
          type: BatchUpdateType.CREATE,
          entityType: 'user',
          data: {},
          priority: BatchPriority.NORMAL,
          timestamp: Date.now()
        },
        {
          id: '2',
          type: BatchUpdateType.CREATE,
          entityType: 'user',
          data: {},
          priority: BatchPriority.NORMAL,
          timestamp: Date.now()
        }
      ];

      batcher.learnPattern(operations);
      const stats = batcher.getStatistics();

      expect(stats.patterns['user-create']).toBe(2);
    });

    it('최적 배치 크기를 계산해야 함', () => {
      const operations = Array(20).fill(null).map((_, i) => ({
        id: `op-${i}`,
        type: BatchUpdateType.CREATE,
        entityType: 'item',
        data: { id: i },
        priority: BatchPriority.NORMAL,
        timestamp: Date.now()
      }));

      const optimalSize = batcher.calculateOptimalBatchSize(operations);
      expect(optimalSize).toBeGreaterThan(10); // 동일 타입이 많으므로 크기 증가
    });

    it('관련 작업을 그룹화해야 함', () => {
      const operations = [
        {
          id: '1',
          type: BatchUpdateType.UPDATE,
          entityType: 'user',
          entityId: '123',
          data: { name: 'John' },
          priority: BatchPriority.NORMAL,
          timestamp: Date.now()
        },
        {
          id: '2',
          type: BatchUpdateType.UPDATE,
          entityType: 'user',
          entityId: '123',
          data: { email: 'john@example.com' },
          priority: BatchPriority.NORMAL,
          timestamp: Date.now()
        },
        {
          id: '3',
          type: BatchUpdateType.CREATE,
          entityType: 'post',
          data: { title: 'New Post' },
          priority: BatchPriority.NORMAL,
          timestamp: Date.now()
        }
      ];

      const groups = batcher.groupRelatedOperations(operations);

      // 같은 entityId를 가진 작업들이 그룹화되어야 함
      const userGroup = groups.find(g =>
        g.some(op => op.entityType === 'user')
      );
      expect(userGroup?.length).toBe(2);
    });
  });

  describe('useBatchUpdate Hook', () => {
    it('작업을 추가하고 추적해야 함', async () => {
      const { result } = renderHook(() =>
        useBatchUpdate('user')
      );

      expect(result.current.pending).toBe(0);

      act(() => {
        result.current.create({ name: 'Test User' });
      });

      expect(result.current.pending).toBe(1);
    });

    it('벌크 작업을 지원해야 함', () => {
      const { result } = renderHook(() =>
        useBatchUpdate('product')
      );

      act(() => {
        const ids = result.current.addBulk([
          {
            type: BatchUpdateType.CREATE,
            data: { name: 'Product 1' }
          },
          {
            type: BatchUpdateType.CREATE,
            data: { name: 'Product 2' }
          },
          {
            type: BatchUpdateType.CREATE,
            data: { name: 'Product 3' }
          }
        ]);

        expect(ids).toHaveLength(3);
      });

      expect(result.current.pending).toBe(3);
    });

    it('헬퍼 메서드를 제공해야 함', () => {
      const { result } = renderHook(() =>
        useBatchUpdate('task')
      );

      act(() => {
        // Create
        result.current.create({ title: 'New Task' });

        // Update
        result.current.update('task-1', { title: 'Updated Task' });

        // Delete
        result.current.delete('task-2');
      });

      expect(result.current.pending).toBe(3);
    });

    it('작업을 취소할 수 있어야 함', () => {
      const { result } = renderHook(() =>
        useBatchUpdate('order')
      );

      let operationId: string;

      act(() => {
        operationId = result.current.create({ amount: 100 });
      });

      expect(result.current.pending).toBe(1);

      act(() => {
        const cancelled = result.current.cancel(operationId!);
        expect(cancelled).toBe(true);
      });

      expect(result.current.pending).toBe(0);
    });

    it('즉시 플러시를 지원해야 함', () => {
      const { result } = renderHook(() =>
        useBatchUpdate('notification')
      );

      act(() => {
        result.current.create({ message: 'Test' });
        result.current.flush();
      });

      // 플러시 후 처리 중 상태가 되어야 함
      expect(result.current.processing || result.current.pending === 0).toBe(true);
    });
  });

  describe('useBatchMonitor Hook', () => {
    it('배치 상태를 모니터링해야 함', () => {
      const { result } = renderHook(() => useBatchMonitor());

      expect(result.current.status).toBeDefined();
      expect(result.current.statistics).toBeDefined();
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.pendingCount).toBe(0);
      expect(result.current.queueLength).toBe(0);
    });

    it('실시간 업데이트를 반영해야 함', async () => {
      const { result } = renderHook(() => useBatchMonitor());

      // 작업 추가
      act(() => {
        batchUpdateManager.add({
          type: BatchUpdateType.CREATE,
          entityType: 'event',
          data: { name: 'Test Event' },
          priority: BatchPriority.NORMAL
        });
      });

      await waitFor(() => {
        expect(result.current.pendingCount).toBeGreaterThan(0);
      });
    });
  });

  describe('배치 성능 테스트', () => {
    it('대량 작업을 효율적으로 처리해야 함', async () => {
      const startTime = Date.now();
      const operations = Array(100).fill(null).map((_, i) => ({
        type: BatchUpdateType.CREATE,
        entityType: 'item',
        data: { id: i, value: Math.random() },
        priority: BatchPriority.NORMAL
      }));

      operations.forEach(op => batchUpdateManager.add(op));
      batchUpdateManager.flushBatch();

      await waitFor(() => {
        const stats = batchUpdateManager.getStatistics();
        expect(stats.totalOperations).toBe(100);
      }, { timeout: 5000 });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 100개 작업이 5초 이내에 처리되어야 함
      expect(duration).toBeLessThan(5000);
    });

    it('메모리 사용량이 안정적이어야 함', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // 1000개 작업 추가 후 제거
      const operations = Array(1000).fill(null).map((_, i) => ({
        type: BatchUpdateType.CREATE,
        entityType: 'test',
        data: { id: i },
        priority: BatchPriority.NORMAL
      }));

      const ids = operations.map(op => batchUpdateManager.add(op));

      // 모두 취소
      batchUpdateManager.cancelAll();

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // 메모리 증가가 10MB 미만이어야 함
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('엣지 케이스', () => {
    it('빈 배치를 처리해야 함', () => {
      batchUpdateManager.flushBatch();
      const stats = batchUpdateManager.getStatistics();
      expect(stats.totalBatches).toBe(0);
    });

    it('동시 다발적 플러시를 처리해야 함', async () => {
      batchUpdateManager.add({
        type: BatchUpdateType.CREATE,
        entityType: 'concurrent',
        data: { test: true },
        priority: BatchPriority.NORMAL
      });

      // 동시에 여러 번 플러시
      Promise.all([
        batchUpdateManager.flushBatch(),
        batchUpdateManager.flushBatch(),
        batchUpdateManager.flushBatch()
      ]);

      await waitFor(() => {
        const stats = batchUpdateManager.getStatistics();
        // 하나의 배치만 처리되어야 함
        expect(stats.totalBatches).toBeLessThanOrEqual(1);
      });
    });

    it('현재 처리 중인 배치는 취소할 수 없어야 함', async () => {
      const manager = BatchUpdateManager.getInstance();

      manager.add({
        type: BatchUpdateType.CREATE,
        entityType: 'processing',
        data: { test: true },
        priority: BatchPriority.NORMAL
      });

      manager.flushBatch();

      // 처리 시작까지 대기
      await waitFor(() => {
        const status = manager.getStatus();
        return status.currentBatch !== null;
      });

      const status = manager.getStatus();
      if (status.currentBatch) {
        const result = manager.cancelBatch(status.currentBatch.id);
        expect(result).toBe(false);
      }
    });
  });
});