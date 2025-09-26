/**
 * Sync Transaction System 테스트
 * Phase 2: 에러 처리 및 복구 메커니즘 검증
 */

import {
  SyncTransactionManager,
  SyncOperation,
  SyncError,
  SyncErrorType,
  ErrorSeverity,
  TransactionState
} from '../syncTransaction';

describe('Phase 2: 트랜잭션 기반 동기화 테스트', () => {
  let manager: SyncTransactionManager;

  beforeEach(() => {
    manager = new SyncTransactionManager();
  });

  afterEach(() => {
    // 각 테스트 후 정리
    if (manager.getState() !== TransactionState.IDLE) {
      // 강제 정리
      (manager as any).cleanup();
    }
  });

  describe('기본 트랜잭션 동작', () => {
    it('성공적인 트랜잭션을 처리해야 함', async () => {
      const operations: SyncOperation[] = [
        {
          id: 'op1',
          type: 'create',
          target: 'project',
          data: { name: 'Test Project' },
          priority: 1
        },
        {
          id: 'op2',
          type: 'update',
          target: 'calendar',
          data: { id: '1', title: 'Updated' },
          priority: 2
        }
      ];

      const startPromise = new Promise(resolve => {
        manager.once('transaction:start', resolve);
      });

      const commitPromise = new Promise(resolve => {
        manager.once('transaction:commit', resolve);
      });

      await manager.executeTransaction(operations);

      await startPromise;
      await commitPromise;

      expect(manager.getState()).toBe(TransactionState.COMPLETED);
    });

    it('우선순위에 따라 작업을 정렬해야 함', async () => {
      const executionOrder: string[] = [];

      // executeOperation 메서드 모킹
      const originalExecute = (manager as any).executeOperation;
      (manager as any).executeOperation = async function(op: SyncOperation) {
        executionOrder.push(op.id);
        return originalExecute.call(this, op);
      };

      const operations: SyncOperation[] = [
        { id: 'low', type: 'create', target: 'project', data: {}, priority: 1 },
        { id: 'high', type: 'create', target: 'project', data: {}, priority: 3 },
        { id: 'medium', type: 'create', target: 'project', data: {}, priority: 2 }
      ];

      await manager.executeTransaction(operations);

      expect(executionOrder).toEqual(['high', 'medium', 'low']);
    });

    it('동시 트랜잭션 실행을 방지해야 함', async () => {
      const operations: SyncOperation[] = [
        {
          id: 'op1',
          type: 'create',
          target: 'project',
          data: { delay: 100 },
          priority: 1
        }
      ];

      // 첫 번째 트랜잭션 시작
      const firstTransaction = manager.executeTransaction(operations);

      // 두 번째 트랜잭션 시도
      await expect(manager.executeTransaction(operations)).rejects.toThrow(SyncError);

      // 첫 번째 트랜잭션 완료 대기
      await firstTransaction;
    });
  });

  describe('에러 처리 및 재시도', () => {
    it('네트워크 에러 시 재시도해야 함', async () => {
      let attemptCount = 0;

      // executeOperation 메서드 모킹 - 2번 실패 후 성공
      (manager as any).executeOperation = async function(op: SyncOperation) {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Network error');
        }
        return { success: true };
      };

      const operations: SyncOperation[] = [
        {
          id: 'op1',
          type: 'create',
          target: 'project',
          data: {},
          priority: 1,
          maxRetries: 3
        }
      ];

      await manager.executeTransaction(operations);

      expect(attemptCount).toBe(3); // 2번 실패, 1번 성공
      expect(manager.getState()).toBe(TransactionState.COMPLETED);
    });

    it('최대 재시도 횟수 초과 시 실패해야 함', async () => {
      // 항상 실패하는 작업
      (manager as any).executeOperation = async function() {
        throw new Error('Network error');
      };

      const operations: SyncOperation[] = [
        {
          id: 'op1',
          type: 'create',
          target: 'project',
          data: {},
          priority: 1,
          maxRetries: 2
        }
      ];

      await expect(manager.executeTransaction(operations)).rejects.toThrow(SyncError);
      expect(manager.getState()).toBe(TransactionState.FAILED);
    });

    it('에러 타입을 정확히 분류해야 함', () => {
      const classifyError = (manager as any).classifyError.bind(manager);

      expect(classifyError(new Error('Network failed'))).toBe(SyncErrorType.NETWORK_ERROR);
      expect(classifyError(new Error('Request timeout'))).toBe(SyncErrorType.TIMEOUT_ERROR);
      expect(classifyError(new Error('Duplicate key'))).toBe(SyncErrorType.CONFLICT_ERROR);
      expect(classifyError(new Error('Invalid data'))).toBe(SyncErrorType.VALIDATION_ERROR);
      expect(classifyError(new Error('Storage quota exceeded'))).toBe(SyncErrorType.QUOTA_EXCEEDED);
      expect(classifyError(new Error('Permission denied'))).toBe(SyncErrorType.PERMISSION_ERROR);
      expect(classifyError(new Error('Unknown'))).toBe(SyncErrorType.UNKNOWN_ERROR);
    });
  });

  describe('롤백 메커니즘', () => {
    it('실패 시 모든 작업을 롤백해야 함', async () => {
      const rollbackOrder: string[] = [];
      let operationCount = 0;

      // 작업 실행 모킹
      (manager as any).executeOperation = async function(op: SyncOperation) {
        operationCount++;
        if (operationCount === 3) {
          throw new Error('Operation failed');
        }
        return { id: op.id };
      };

      // 상태 복원 모킹
      (manager as any).restoreState = async function(op: SyncOperation) {
        rollbackOrder.push(op.id);
      };

      const operations: SyncOperation[] = [
        { id: 'op1', type: 'create', target: 'project', data: {}, priority: 1 },
        { id: 'op2', type: 'update', target: 'calendar', data: {}, priority: 1 },
        { id: 'op3', type: 'delete', target: 'meeting', data: {}, priority: 1 }
      ];

      await expect(manager.executeTransaction(operations)).rejects.toThrow();

      // LIFO 순서로 롤백되어야 함
      expect(rollbackOrder).toEqual(['op2', 'op1']);
      expect(manager.getState()).toBe(TransactionState.FAILED);
    });

    it('롤백 중 에러가 발생해도 계속 진행해야 함', async () => {
      const rollbackAttempts: string[] = [];

      // 두 번째 작업에서 실패
      (manager as any).executeOperation = async function(op: SyncOperation) {
        if (op.id === 'op2') {
          throw new Error('Operation failed');
        }
        return { id: op.id };
      };

      // 첫 번째 롤백은 실패, 나머지는 성공
      (manager as any).restoreState = async function(op: SyncOperation) {
        rollbackAttempts.push(op.id);
        if (rollbackAttempts.length === 1) {
          throw new Error('Rollback failed');
        }
      };

      const operations: SyncOperation[] = [
        { id: 'op1', type: 'create', target: 'project', data: {}, priority: 1 },
        { id: 'op2', type: 'update', target: 'calendar', data: {}, priority: 1 }
      ];

      const rollbackCompletePromise = new Promise(resolve => {
        manager.once('transaction:rollback:complete', resolve);
      });

      await expect(manager.executeTransaction(operations)).rejects.toThrow();
      await rollbackCompletePromise;

      // 롤백 실패에도 불구하고 op1이 시도되어야 함
      expect(rollbackAttempts).toContain('op1');
    });
  });

  describe('이벤트 발생', () => {
    it('트랜잭션 생명주기 이벤트를 발생시켜야 함', async () => {
      const events: string[] = [];

      manager.on('transaction:start', () => events.push('start'));
      manager.on('operation:success', () => events.push('operation'));
      manager.on('transaction:commit', () => events.push('commit'));

      const operations: SyncOperation[] = [
        { id: 'op1', type: 'create', target: 'project', data: {}, priority: 1 }
      ];

      await manager.executeTransaction(operations);

      expect(events).toEqual(['start', 'operation', 'commit']);
    });

    it('재시도 이벤트를 발생시켜야 함', async () => {
      let retryCount = 0;
      let attemptCount = 0;

      manager.on('operation:retry', (data) => {
        retryCount++;
        expect(data.attempt).toBe(retryCount + 1);
      });

      // 첫 번째 시도는 실패
      (manager as any).executeOperation = async function() {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error('Network error');
        }
        return { success: true };
      };

      const operations: SyncOperation[] = [
        {
          id: 'op1',
          type: 'create',
          target: 'project',
          data: {},
          priority: 1,
          maxRetries: 2
        }
      ];

      await manager.executeTransaction(operations);

      expect(retryCount).toBe(1);
    });
  });

  describe('통계 및 상태 조회', () => {
    it('정확한 통계를 제공해야 함', async () => {
      const operations: SyncOperation[] = [
        { id: 'op1', type: 'create', target: 'project', data: {}, priority: 1 },
        { id: 'op2', type: 'update', target: 'calendar', data: {}, priority: 1 }
      ];

      await manager.executeTransaction(operations);

      const stats = manager.getStatistics();
      expect(stats.completed).toBe(2);
      expect(stats.failed).toBe(0);
      expect(stats.pending).toBe(2); // 롤백 스택에 있는 작업
      expect(stats.duration).toBeGreaterThan(0);
    });

    it('트랜잭션 ID를 생성해야 함', async () => {
      const operations: SyncOperation[] = [
        { id: 'op1', type: 'create', target: 'project', data: {}, priority: 1 }
      ];

      const startPromise = new Promise<any>(resolve => {
        manager.once('transaction:start', resolve);
      });

      manager.executeTransaction(operations);
      const startData = await startPromise;

      const transactionId = manager.getTransactionId();
      expect(transactionId).toMatch(/^tx_\d+_[a-z0-9]+$/);
      expect(startData.id).toBe(transactionId);
    });
  });

  describe('성능 테스트', () => {
    it('100개 작업을 효율적으로 처리해야 함', async () => {
      const operations: SyncOperation[] = Array.from({ length: 100 }, (_, i) => ({
        id: `op${i}`,
        type: 'create',
        target: 'project',
        data: { index: i },
        priority: Math.floor(Math.random() * 10)
      }));

      const startTime = performance.now();
      await manager.executeTransaction(operations);
      const endTime = performance.now();

      const duration = endTime - startTime;
      console.log(`100개 작업 처리 시간: ${duration}ms`);

      expect(duration).toBeLessThan(1000); // 1초 이내
      expect(manager.getStatistics().completed).toBe(100);
    });

    it('메모리 효율적으로 작동해야 함', async () => {
      const operations: SyncOperation[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `op${i}`,
        type: 'create',
        target: 'project',
        data: { largeData: new Array(100).fill(`data${i}`) },
        priority: 1
      }));

      // 메모리 사용량 측정 (가능한 경우)
      const memBefore = process.memoryUsage?.().heapUsed;

      await manager.executeTransaction(operations);

      const memAfter = process.memoryUsage?.().heapUsed;

      if (memBefore && memAfter) {
        const memDiff = (memAfter - memBefore) / 1024 / 1024; // MB
        console.log(`메모리 증가량: ${memDiff.toFixed(2)}MB`);
        expect(memDiff).toBeLessThan(100); // 100MB 이하
      }

      // 정리 후 상태 확인
      expect(manager.getState()).toBe(TransactionState.COMPLETED);
    });
  });
});