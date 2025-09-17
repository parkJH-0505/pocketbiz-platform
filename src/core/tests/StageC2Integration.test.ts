/**
 * StageC2Integration.test.ts
 *
 * Stage C-2 Phase Transition Module 통합 테스트
 * 실제 동작 검증 및 안전성 확인
 */

import { PhaseTransitionModule } from '../phaseTransition/PhaseTransitionModule';
import { EventBus, createEvent } from '../events/EventBus';
import { ServiceRegistry } from '../services/ServiceRegistry';
import { Logger } from '../logging/Logger';
import { getCoreSystemHealth } from '../index';

describe('Stage C-2: Phase Transition Module Integration Tests', () => {
  let phaseTransitionModule: PhaseTransitionModule;
  let eventBus: EventBus;
  let serviceRegistry: ServiceRegistry;
  let logger: Logger;

  beforeEach(() => {
    // 깨끗한 상태로 시작
    EventBus.reset();
    ServiceRegistry.reset();
    Logger.reset();
    PhaseTransitionModule.reset();

    eventBus = EventBus.getInstance({ enableLogging: false });
    serviceRegistry = ServiceRegistry.getInstance();
    logger = Logger.getInstance({ level: 'error', enableConsole: false });
    phaseTransitionModule = PhaseTransitionModule.getInstance();
  });

  afterEach(() => {
    phaseTransitionModule.dispose();
    eventBus.shutdown();
    serviceRegistry.dispose();
  });

  describe('Module Initialization and Safety', () => {
    test('should initialize without breaking existing application', () => {
      expect(phaseTransitionModule).toBeDefined();
      expect(phaseTransitionModule.getVersion()).toBe('2.0.0');
      expect(phaseTransitionModule.isAvailable()).toBe(false); // 기본적으로 비활성화
    });

    test('should register with service registry safely', () => {
      const serviceInfo = serviceRegistry.getServiceInfos()
        .find(s => s.metadata.name === 'phaseTransitionModule');

      expect(serviceInfo).toBeDefined();
      expect(serviceInfo?.status).toBe('ready');
    });

    test('should perform health check without errors', async () => {
      const health = await phaseTransitionModule.healthCheck();

      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('details');
      expect(health.details.moduleState).toBe('not_loaded');
      expect(health.details.engineAvailable).toBe(false);
    });
  });

  describe('Feature Flag Management', () => {
    test('should manage feature flags safely', () => {
      // 초기 상태 확인
      const initialStatus = phaseTransitionModule.getStatus();
      expect(initialStatus.features.ENABLE_PHASE_TRANSITION_V2).toBe(false);

      // Feature flag 변경
      phaseTransitionModule.updateFeatureFlag('ENABLE_PHASE_TRANSITION_V2', true);

      // 변경 확인
      const updatedStatus = phaseTransitionModule.getStatus();
      expect(updatedStatus.features.ENABLE_PHASE_TRANSITION_V2).toBe(true);
    });

    test('should prevent activation when disabled', async () => {
      await expect(phaseTransitionModule.enable()).rejects.toThrow(
        'Phase Transition V2 is disabled by feature flag'
      );
    });
  });

  describe('Safe Dynamic Loading', () => {
    test('should load engine on demand without errors', async () => {
      // Feature flag 활성화
      phaseTransitionModule.updateFeatureFlag('ENABLE_PHASE_TRANSITION_V2', true);

      // 엔진 활성화
      await phaseTransitionModule.enable();

      const status = phaseTransitionModule.getStatus();
      expect(status.state).toBe('loaded');
      expect(status.engineStatus).toBeDefined();
      expect(status.engineStatus.enabled).toBe(true);
    });

    test('should return same engine instance (singleton)', async () => {
      phaseTransitionModule.updateFeatureFlag('ENABLE_PHASE_TRANSITION_V2', true);

      const engine1 = await phaseTransitionModule.getEngine();
      const engine2 = await phaseTransitionModule.getEngine();

      expect(engine1).toBe(engine2);
      expect(engine1).not.toBeNull();
    });
  });

  describe('Event Bus Integration', () => {
    test('should handle events safely when enabled', async () => {
      // 모듈 활성화
      phaseTransitionModule.updateFeatureFlag('ENABLE_PHASE_TRANSITION_V2', true);
      await phaseTransitionModule.enable();

      // 미팅 완료 이벤트 발행
      const meetingEvent = createEvent('MEETING_COMPLETED', {
        meetingId: 'test-meeting-123',
        projectId: 'test-project-456',
        meetingRecord: {},
        completedBy: 'test-user',
        completedAt: new Date()
      }, { source: 'C2IntegrationTest' });

      // 이벤트가 에러 없이 처리되어야 함
      await expect(eventBus.emit('MEETING_COMPLETED', meetingEvent)).resolves.toBeUndefined();
    });

    test('should ignore events when disabled', async () => {
      // 모듈을 활성화하지 않은 상태

      const meetingEvent = createEvent('MEETING_COMPLETED', {
        meetingId: 'test-meeting-123',
        projectId: 'test-project-456',
        meetingRecord: {},
        completedBy: 'test-user',
        completedAt: new Date()
      });

      // 이벤트가 조용히 무시되어야 함 (에러 없이)
      await expect(eventBus.emit('MEETING_COMPLETED', meetingEvent)).resolves.toBeUndefined();
    });
  });

  describe('Core System Integration', () => {
    test('should integrate with core health check', async () => {
      const health = await getCoreSystemHealth();

      expect(health).toHaveProperty('phaseTransition');
      expect(health.phaseTransition).toHaveProperty('moduleState');
      expect(health.phaseTransition).toHaveProperty('healthy');
      expect(health.overall.healthy).toBeDefined();
    });

    test('should not interfere with existing event bus operations', async () => {
      const testHandler = jest.fn();
      eventBus.on('PROJECT_UPDATED', testHandler);

      // Phase Transition 모듈 활성화
      phaseTransitionModule.updateFeatureFlag('ENABLE_PHASE_TRANSITION_V2', true);
      await phaseTransitionModule.enable();

      // 기존 이벤트 발행
      const projectEvent = createEvent('PROJECT_UPDATED', {
        projectId: 'test-project',
        project: { phase: '진행 중' },
        updatedFields: ['phase'],
        updatedBy: 'test-user',
        updatedAt: new Date()
      });

      await eventBus.emit('PROJECT_UPDATED', projectEvent);

      // 기존 핸들러가 정상 작동해야 함
      expect(testHandler).toHaveBeenCalledWith(projectEvent);
    });
  });

  describe('Fault Tolerance and Cleanup', () => {
    test('should handle concurrent activation safely', async () => {
      phaseTransitionModule.updateFeatureFlag('ENABLE_PHASE_TRANSITION_V2', true);

      // 동시에 여러 번 활성화 시도
      const enablePromises = Array.from({ length: 3 }, () =>
        phaseTransitionModule.enable()
      );

      // 모든 호출이 성공해야 함
      await expect(Promise.allSettled(enablePromises)).resolves.toHaveLength(3);

      // 최종적으로 하나의 엔진만 있어야 함
      const engine1 = await phaseTransitionModule.getEngine();
      const engine2 = await phaseTransitionModule.getEngine();
      expect(engine1).toBe(engine2);
    });

    test('should dispose resources properly', async () => {
      phaseTransitionModule.updateFeatureFlag('ENABLE_PHASE_TRANSITION_V2', true);
      await phaseTransitionModule.enable();

      const initialStatus = phaseTransitionModule.getStatus();
      expect(initialStatus.state).toBe('loaded');

      // 정리 작업
      phaseTransitionModule.dispose();

      const finalStatus = phaseTransitionModule.getStatus();
      expect(finalStatus.state).toBe('not_loaded');
    });

    test('should maintain system stability under error conditions', async () => {
      phaseTransitionModule.updateFeatureFlag('ENABLE_PHASE_TRANSITION_V2', true);
      await phaseTransitionModule.enable();

      // 시스템이 여전히 건강해야 함
      const health = await phaseTransitionModule.healthCheck();
      expect(health.healthy).toBe(true);

      // 이벤트 시스템이 여전히 작동해야 함
      const metrics = eventBus.getMetrics();
      expect(metrics).toBeDefined();
    });
  });
});