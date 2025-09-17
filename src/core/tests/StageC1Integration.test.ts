/**
 * StageC1Integration.test.ts
 *
 * Stage C-1 기반 인프라의 통합 테스트
 * EventBus, ServiceRegistry, Logger의 상호 작용 검증
 */

import { EventBus, createEvent } from '../events/EventBus';
import { ServiceRegistry } from '../services/ServiceRegistry';
import { Logger } from '../logging/Logger';
import type { EventTypeMap } from '../events/eventTypes';

// 테스트용 모크 서비스
class MockPhaseTransitionService {
  private initialized = false;

  async initialize(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100)); // 비동기 시뮬레이션
    this.initialized = true;
  }

  processEvent(event: any): void {
    if (!this.initialized) {
      throw new Error('Service not initialized');
    }
    // 이벤트 처리 로직
  }

  dispose(): void {
    this.initialized = false;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

class MockNotificationService {
  private notifications: string[] = [];

  send(message: string): void {
    this.notifications.push(message);
  }

  getNotifications(): string[] {
    return [...this.notifications];
  }

  clear(): void {
    this.notifications = [];
  }

  dispose(): void {
    this.clear();
  }
}

describe('Stage C-1 Integration Tests', () => {
  let eventBus: EventBus;
  let serviceRegistry: ServiceRegistry;
  let logger: Logger;

  beforeEach(() => {
    // 각 테스트마다 깨끗한 상태로 시작
    EventBus.reset();
    ServiceRegistry.reset();
    Logger.reset();

    eventBus = EventBus.getInstance({
      enableLogging: false, // 테스트 중 로그 노이즈 방지
      maxListeners: 50
    });

    serviceRegistry = ServiceRegistry.getInstance();

    logger = Logger.getInstance({
      level: 'error', // 테스트 중에는 에러만 로깅
      enableConsole: false,
      enablePersistence: false
    });
  });

  afterEach(() => {
    // 테스트 후 정리
    eventBus.shutdown();
    serviceRegistry.dispose();
    logger.flush();
  });

  describe('EventBus Core Functionality', () => {
    test('should register and trigger event listeners', async () => {
      const mockHandler = jest.fn();
      const subscriptionId = eventBus.on('MEETING_COMPLETED', mockHandler);

      expect(subscriptionId).toBeTruthy();

      const testEvent = createEvent('MEETING_COMPLETED', {
        meetingId: 'test-meeting',
        projectId: 'test-project',
        meetingRecord: {},
        completedBy: 'test-user',
        completedAt: new Date()
      }, { source: 'TestSuite' });

      await eventBus.emit('MEETING_COMPLETED', testEvent);

      expect(mockHandler).toHaveBeenCalledWith(testEvent);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    test('should handle once listeners correctly', async () => {
      const mockHandler = jest.fn();
      eventBus.once('PHASE_CHANGED', mockHandler);

      const testEvent = createEvent('PHASE_CHANGED', {
        projectId: 'test-project',
        previousPhase: '킥오프 준비',
        newPhase: '진행 중',
        reason: 'test',
        changedBy: 'test-user',
        changedAt: new Date(),
        automatic: false
      });

      // 첫 번째 발행
      await eventBus.emit('PHASE_CHANGED', testEvent);
      expect(mockHandler).toHaveBeenCalledTimes(1);

      // 두 번째 발행 - once 리스너는 호출되지 않아야 함
      await eventBus.emit('PHASE_CHANGED', testEvent);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    test('should respect max listeners limit', () => {
      const eventBusLimited = EventBus.getInstance({ maxListeners: 2 });

      eventBusLimited.on('SYSTEM_ERROR', () => {});
      eventBusLimited.on('SYSTEM_ERROR', () => {});

      expect(() => {
        eventBusLimited.on('SYSTEM_ERROR', () => {});
      }).toThrow('Maximum listeners');
    });

    test('should handle event handler errors gracefully', async () => {
      const errorHandler = jest.fn();
      const workingHandler = jest.fn();

      eventBus.on('PROJECT_UPDATED', () => {
        throw new Error('Handler error');
      });
      eventBus.on('PROJECT_UPDATED', workingHandler);

      const testEvent = createEvent('PROJECT_UPDATED', {
        projectId: 'test-project',
        project: {},
        updatedFields: ['phase'],
        updatedBy: 'test-user',
        updatedAt: new Date()
      });

      // 에러가 발생해도 다른 핸들러는 실행되어야 함
      await expect(eventBus.emit('PROJECT_UPDATED', testEvent)).rejects.toThrow();
      expect(workingHandler).toHaveBeenCalled();
    });
  });

  describe('ServiceRegistry Core Functionality', () => {
    test('should register and retrieve singleton services', async () => {
      serviceRegistry.register(
        'phaseTransition',
        () => new MockPhaseTransitionService(),
        {
          dependencies: [],
          singleton: true
        }
      );

      const service1 = await serviceRegistry.get<MockPhaseTransitionService>('phaseTransition');
      const service2 = await serviceRegistry.get<MockPhaseTransitionService>('phaseTransition');

      expect(service1).toBe(service2); // 같은 인스턴스여야 함
      expect(service1.isInitialized()).toBe(true);
    });

    test('should handle service dependencies correctly', async () => {
      // 알림 서비스 등록 (의존성 없음)
      serviceRegistry.register(
        'notification',
        () => new MockNotificationService(),
        { dependencies: [] }
      );

      // 페이즈 전환 서비스 등록 (알림 서비스 의존)
      serviceRegistry.register(
        'phaseTransition',
        async (registry) => {
          const notificationService = await registry.get<MockNotificationService>('notification');
          const service = new MockPhaseTransitionService();
          await service.initialize();
          return service;
        },
        { dependencies: ['notification'] }
      );

      const phaseService = await serviceRegistry.get<MockPhaseTransitionService>('phaseTransition');
      const notificationService = await serviceRegistry.get<MockNotificationService>('notification');

      expect(phaseService.isInitialized()).toBe(true);
      expect(notificationService).toBeDefined();
    });

    test('should detect circular dependencies', () => {
      serviceRegistry.register('serviceA', () => ({}), { dependencies: ['serviceB'] });
      serviceRegistry.register('serviceB', () => ({}), { dependencies: ['serviceA'] });

      expect(serviceRegistry.get('serviceA')).rejects.toThrow('Circular dependency');
    });

    test('should handle service initialization timeout', async () => {
      serviceRegistry.register(
        'slowService',
        () => new Promise(resolve => setTimeout(() => resolve({}), 2000))
      );

      await expect(
        serviceRegistry.get('slowService', { timeout: 1000 })
      ).rejects.toThrow('timeout');
    });
  });

  describe('Logger Core Functionality', () => {
    test('should log messages with correct structure', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

      const testLogger = Logger.getInstance({
        level: 'info',
        enableConsole: true,
        enablePersistence: false
      });

      testLogger.info('Test message', { key: 'value' }, 'TestComponent');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] \[INFO\] \[TestComponent\]/),
        expect.objectContaining({
          message: 'Test message',
          context: { key: 'value' }
        })
      );

      consoleSpy.mockRestore();
    });

    test('should respect log levels', () => {
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();

      const testLogger = Logger.getInstance({
        level: 'warn',
        enableConsole: true
      });

      testLogger.debug('Debug message');
      expect(consoleSpy).not.toHaveBeenCalled();

      testLogger.warn('Warning message');
      // warn은 console.warn을 사용하므로 debug spy는 호출되지 않음

      consoleSpy.mockRestore();
    });

    test('should track performance metrics', () => {
      const testLogger = Logger.getInstance({
        enableMetrics: true
      });

      testLogger.startOperation('test-op', { context: 'test' });

      // 약간의 지연 시뮬레이션
      const startTime = performance.now();
      while (performance.now() - startTime < 10) {
        // 대기
      }

      testLogger.endOperation('test-op');

      const metrics = testLogger.getMetrics();
      expect(metrics.activeOperations).toBe(0);
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete event-driven service interaction', async () => {
      const notificationSpy = jest.fn();

      // 서비스 등록
      serviceRegistry.register(
        'notification',
        () => {
          const service = new MockNotificationService();
          service.send = notificationSpy;
          return service;
        }
      );

      serviceRegistry.register(
        'phaseTransition',
        async (registry) => {
          const notificationService = await registry.get('notification');
          const service = new MockPhaseTransitionService();
          await service.initialize();
          return service;
        },
        { dependencies: ['notification'] }
      );

      // 이벤트 핸들러 등록 (서비스 간 통신)
      eventBus.on('MEETING_COMPLETED', async (event) => {
        const phaseService = await serviceRegistry.get<MockPhaseTransitionService>('phaseTransition');
        const notificationService = await serviceRegistry.get<MockNotificationService>('notification');

        phaseService.processEvent(event);
        notificationService.send(`Meeting completed: ${event.payload.meetingId}`);
      });

      // 이벤트 발행
      const testEvent = createEvent('MEETING_COMPLETED', {
        meetingId: 'meeting-123',
        projectId: 'project-456',
        meetingRecord: {},
        completedBy: 'user-789',
        completedAt: new Date()
      });

      await eventBus.emit('MEETING_COMPLETED', testEvent);

      // 결과 검증
      expect(notificationSpy).toHaveBeenCalledWith('Meeting completed: meeting-123');
    });

    test('should handle cascading events correctly', async () => {
      const events: string[] = [];

      // 첫 번째 이벤트 핸들러 - 다른 이벤트를 트리거
      eventBus.on('MEETING_COMPLETED', async (event) => {
        events.push('meeting-completed');

        const phaseChangeEvent = createEvent('PHASE_CHANGE_REQUEST', {
          projectId: event.payload.projectId,
          currentPhase: '킥오프 준비',
          targetPhase: '진행 중',
          reason: 'Meeting completed',
          requestedBy: event.payload.completedBy,
          automatic: true
        });

        await eventBus.emit('PHASE_CHANGE_REQUEST', phaseChangeEvent);
      });

      // 두 번째 이벤트 핸들러
      eventBus.on('PHASE_CHANGE_REQUEST', async (event) => {
        events.push('phase-change-requested');

        const phaseChangedEvent = createEvent('PHASE_CHANGED', {
          projectId: event.payload.projectId,
          previousPhase: event.payload.currentPhase,
          newPhase: event.payload.targetPhase,
          reason: event.payload.reason,
          changedBy: event.payload.requestedBy,
          changedAt: new Date(),
          automatic: event.payload.automatic
        });

        await eventBus.emit('PHASE_CHANGED', phaseChangedEvent);
      });

      // 세 번째 이벤트 핸들러
      eventBus.on('PHASE_CHANGED', () => {
        events.push('phase-changed');
      });

      // 초기 이벤트 발행
      const initialEvent = createEvent('MEETING_COMPLETED', {
        meetingId: 'test-meeting',
        projectId: 'test-project',
        meetingRecord: {},
        completedBy: 'test-user',
        completedAt: new Date()
      });

      await eventBus.emit('MEETING_COMPLETED', initialEvent);

      // 이벤트 체인 검증
      expect(events).toEqual([
        'meeting-completed',
        'phase-change-requested',
        'phase-changed'
      ]);
    });

    test('should maintain system stability under load', async () => {
      const handlersCount = 10;
      const eventsCount = 100;
      const results: boolean[] = [];

      // 다수의 핸들러 등록
      for (let i = 0; i < handlersCount; i++) {
        eventBus.on('SYSTEM_ERROR', async () => {
          results.push(true);
          // 약간의 처리 시간 시뮬레이션
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        });
      }

      // 다수의 이벤트 동시 발행
      const promises = Array.from({ length: eventsCount }, (_, i) => {
        const event = createEvent('SYSTEM_ERROR', {
          error: new Error(`Test error ${i}`),
          context: 'LoadTest',
          severity: 'low' as const
        });

        return eventBus.emit('SYSTEM_ERROR', event);
      });

      await Promise.allSettled(promises);

      // 모든 핸들러가 모든 이벤트를 처리했는지 확인
      expect(results).toHaveLength(handlersCount * eventsCount);
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should recover from service initialization failures', async () => {
      let attemptCount = 0;

      serviceRegistry.register(
        'flaky-service',
        () => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Initialization failed');
          }
          return { initialized: true };
        }
      );

      // 첫 번째 시도 - 실패해야 함
      await expect(serviceRegistry.get('flaky-service')).rejects.toThrow();

      // 두 번째 시도 - 여전히 실패
      await expect(serviceRegistry.get('flaky-service')).rejects.toThrow();

      // 세 번째 시도 - 성공해야 함
      const service = await serviceRegistry.get('flaky-service', { force: true });
      expect(service.initialized).toBe(true);
    });

    test('should handle memory cleanup properly', () => {
      const initialMetrics = eventBus.getMetrics();

      // 많은 리스너 등록
      const subscriptionIds: string[] = [];
      for (let i = 0; i < 50; i++) {
        const id = eventBus.on('PROJECT_UPDATED', () => {});
        subscriptionIds.push(id);
      }

      expect(eventBus.getMetrics().activeListeners).toBeGreaterThan(initialMetrics.activeListeners);

      // 모든 리스너 제거
      subscriptionIds.forEach(id => eventBus.off(id));

      expect(eventBus.getMetrics().activeListeners).toBe(initialMetrics.activeListeners);
    });
  });
});

// 성능 벤치마크 테스트 (별도 실행)
describe('Performance Benchmarks', () => {
  test('event emission performance', async () => {
    const eventBus = EventBus.getInstance();
    const handler = jest.fn();

    eventBus.on('SYSTEM_ERROR', handler);

    const startTime = performance.now();
    const eventCount = 1000;

    for (let i = 0; i < eventCount; i++) {
      const event = createEvent('SYSTEM_ERROR', {
        error: new Error(`Error ${i}`),
        context: 'PerformanceTest',
        severity: 'low' as const
      });

      await eventBus.emit('SYSTEM_ERROR', event);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const eventsPerSecond = (eventCount / duration) * 1000;

    console.log(`Event processing rate: ${eventsPerSecond.toFixed(2)} events/second`);
    expect(eventsPerSecond).toBeGreaterThan(100); // 최소 성능 요구사항
  });
});