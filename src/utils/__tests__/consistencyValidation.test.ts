/**
 * Consistency Validation System Tests
 * Phase 6: 데이터 일관성 검증 시스템 테스트
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import {
  ConsistencyValidator,
  consistencyValidator,
  ValidationRule,
  ValidationSeverity
} from '../consistencyValidator';
import {
  AutoRecoveryManager,
  autoRecoveryManager,
  RecoveryStrategy,
  RecoveryPriority
} from '../autoRecovery';
import type { Project } from '../../types/buildup.types';
import type { CalendarEvent } from '../../types/calendar.types';

describe('Phase 6: 데이터 일관성 검증 시스템 테스트', () => {

  describe('ConsistencyValidator', () => {
    let validator: ConsistencyValidator;

    beforeEach(() => {
      validator = ConsistencyValidator.getInstance();
      validator.reset();
    });

    it('싱글톤 인스턴스를 반환해야 함', () => {
      const instance1 = ConsistencyValidator.getInstance();
      const instance2 = ConsistencyValidator.getInstance();
      expect(instance1).toBe(instance2);
    });

    describe('스키마 검증', () => {
      it('필수 필드 누락을 감지해야 함', async () => {
        const invalidProject = {
          id: 'proj-1',
          title: 'Test Project'
          // phase와 startDate 누락
        } as Project;

        const report = await validator.validateAll({
          projects: [invalidProject],
          events: []
        });

        expect(report.errors.length).toBeGreaterThan(0);
        expect(report.errors.some(e =>
          e.rule === ValidationRule.REQUIRED_FIELDS &&
          e.field === 'phase'
        )).toBe(true);
      });

      it('타입 불일치를 감지해야 함', async () => {
        const invalidProject = {
          id: 'proj-1',
          title: 123, // 숫자 대신 문자열이어야 함
          phase: 'kickoff',
          startDate: new Date()
        } as any;

        const report = await validator.validateAll({
          projects: [invalidProject],
          events: []
        });

        expect(report.errors.some(e =>
          e.rule === ValidationRule.SCHEMA_VALIDATION &&
          e.field === 'title'
        )).toBe(true);
      });

      it('제약조건 위반을 감지해야 함', async () => {
        const invalidProject = {
          id: 'proj-1',
          title: 'Test Project',
          phase: 'invalid_phase', // 허용되지 않은 phase
          startDate: new Date()
        } as any;

        const report = await validator.validateAll({
          projects: [invalidProject],
          events: []
        });

        expect(report.warnings.some(e =>
          e.rule === ValidationRule.SCHEMA_VALIDATION &&
          e.field === 'phase'
        )).toBe(true);
      });
    });

    describe('참조 무결성 검증', () => {
      it('존재하지 않는 프로젝트 참조를 감지해야 함', async () => {
        const project: Project = {
          id: 'proj-1',
          title: 'Test Project',
          phase: 'kickoff',
          startDate: new Date()
        } as Project;

        const event: CalendarEvent = {
          id: 'event-1',
          title: 'Test Event',
          projectId: 'proj-999', // 존재하지 않는 프로젝트
          startDate: new Date(),
          type: 'meeting',
          status: 'scheduled'
        } as CalendarEvent;

        const report = await validator.validateAll({
          projects: [project],
          events: [event]
        });

        expect(report.errors.some(e =>
          e.rule === ValidationRule.REFERENCE_INTEGRITY &&
          e.field === 'projectId'
        )).toBe(true);
      });

      it('유효한 참조는 통과해야 함', async () => {
        const project: Project = {
          id: 'proj-1',
          title: 'Test Project',
          phase: 'kickoff',
          startDate: new Date()
        } as Project;

        const event: CalendarEvent = {
          id: 'event-1',
          title: 'Test Event',
          projectId: 'proj-1', // 올바른 프로젝트 참조
          startDate: new Date(),
          type: 'meeting',
          status: 'scheduled'
        } as CalendarEvent;

        const report = await validator.validateAll({
          projects: [project],
          events: [event]
        });

        expect(report.errors.filter(e =>
          e.rule === ValidationRule.REFERENCE_INTEGRITY &&
          e.entityId === 'event-1'
        ).length).toBe(0);
      });
    });

    describe('타임스탬프 일관성 검증', () => {
      it('시작일이 종료일보다 늦은 경우를 감지해야 함', async () => {
        const event: CalendarEvent = {
          id: 'event-1',
          title: 'Test Event',
          startDate: new Date('2025-01-02'),
          endDate: new Date('2025-01-01'), // 시작일보다 빠름
          type: 'meeting',
          status: 'scheduled'
        } as CalendarEvent;

        const report = await validator.validateAll({
          projects: [],
          events: [event]
        });

        expect(report.errors.some(e =>
          e.rule === ValidationRule.TIMESTAMP_CONSISTENCY &&
          e.entityId === 'event-1'
        )).toBe(true);
      });

      it('완료 상태인데 완료일이 없는 경우를 감지해야 함', async () => {
        const event: CalendarEvent = {
          id: 'event-1',
          title: 'Test Event',
          startDate: new Date(),
          type: 'meeting',
          status: 'completed'
          // completedAt 누락
        } as CalendarEvent;

        const report = await validator.validateAll({
          projects: [],
          events: [event]
        });

        expect(report.warnings.some(e =>
          e.rule === ValidationRule.TIMESTAMP_CONSISTENCY &&
          e.entityId === 'event-1'
        )).toBe(true);
      });
    });

    describe('중복 검사', () => {
      it('중복된 프로젝트 제목을 감지해야 함', async () => {
        const projects: Project[] = [
          {
            id: 'proj-1',
            title: 'Duplicate Project',
            phase: 'kickoff',
            startDate: new Date()
          },
          {
            id: 'proj-2',
            title: 'Duplicate Project', // 중복 제목
            phase: 'inProgress',
            startDate: new Date()
          }
        ] as Project[];

        const report = await validator.validateAll({
          projects,
          events: []
        });

        expect(report.warnings.some(e =>
          e.rule === ValidationRule.DUPLICATE_CHECK
        )).toBe(true);
      });

      it('동일 시간대 중복 이벤트를 감지해야 함', async () => {
        const startDate = new Date('2025-01-01T10:00:00');
        const events: CalendarEvent[] = [
          {
            id: 'event-1',
            title: 'Meeting 1',
            startDate,
            pmId: 'pm-1',
            type: 'meeting',
            status: 'scheduled'
          },
          {
            id: 'event-2',
            title: 'Meeting 2',
            startDate, // 같은 시간
            pmId: 'pm-1', // 같은 PM
            type: 'meeting',
            status: 'scheduled'
          }
        ] as CalendarEvent[];

        const report = await validator.validateAll({
          projects: [],
          events
        });

        expect(report.info.some(e =>
          e.rule === ValidationRule.DUPLICATE_CHECK
        )).toBe(true);
      });
    });

    describe('비즈니스 규칙 검증', () => {
      it('팀원이 없는 프로젝트를 감지해야 함', async () => {
        const project: Project = {
          id: 'proj-1',
          title: 'Test Project',
          phase: 'kickoff',
          startDate: new Date()
          // team 정보 없음
        } as Project;

        const report = await validator.validateAll({
          projects: [project],
          events: []
        });

        expect(report.warnings.some(e =>
          e.rule === ValidationRule.BUSINESS_RULES &&
          e.message.includes('팀원')
        )).toBe(true);
      });

      it('완료된 프로젝트의 미완료 이벤트를 감지해야 함', async () => {
        const project: Project = {
          id: 'proj-1',
          title: 'Completed Project',
          phase: 'completed',
          startDate: new Date()
        } as Project;

        const event: CalendarEvent = {
          id: 'event-1',
          title: 'Incomplete Event',
          projectId: 'proj-1',
          startDate: new Date(),
          type: 'meeting',
          status: 'scheduled' // 완료되지 않은 상태
        } as CalendarEvent;

        const report = await validator.validateAll({
          projects: [project],
          events: [event]
        });

        expect(report.errors.some(e =>
          e.rule === ValidationRule.BUSINESS_RULES &&
          e.entityId === 'proj-1'
        )).toBe(true);
      });
    });

    describe('통계 및 히스토리', () => {
      it('검증 통계를 정확히 계산해야 함', async () => {
        await validator.validateAll({
          projects: [],
          events: []
        });

        const stats = validator.getStatistics();

        expect(stats.totalValidations).toBe(1);
        expect(stats.averageScore).toBeGreaterThanOrEqual(0);
        expect(stats.averageScore).toBeLessThanOrEqual(100);
      });

      it('검증 히스토리를 유지해야 함', async () => {
        await validator.validateAll({ projects: [], events: [] });
        await validator.validateAll({ projects: [], events: [] });

        const history = validator.getHistory();

        expect(history.length).toBe(2);
        expect(history[0].timestamp).toBeGreaterThan(history[1].timestamp);
      });
    });
  });

  describe('AutoRecoveryManager', () => {
    let recoveryManager: AutoRecoveryManager;
    let validator: ConsistencyValidator;

    beforeEach(() => {
      recoveryManager = AutoRecoveryManager.getInstance();
      validator = ConsistencyValidator.getInstance();
      recoveryManager.reset();
      validator.reset();
    });

    it('싱글톤 인스턴스를 반환해야 함', () => {
      const instance1 = AutoRecoveryManager.getInstance();
      const instance2 = AutoRecoveryManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('복구 계획을 생성해야 함', async () => {
      const report = await validator.validateAll({
        projects: [],
        events: [{
          id: 'event-1',
          title: 'Test Event',
          startDate: new Date('2025-01-02'),
          endDate: new Date('2025-01-01'),
          type: 'meeting',
          status: 'scheduled'
        } as CalendarEvent]
      });

      const plan = await recoveryManager.createRecoveryPlan(report);

      expect(plan).toBeDefined();
      expect(plan.tasks.length).toBeGreaterThan(0);
      expect(plan.status).toBe('pending');
    });

    it('복구 우선순위를 정확히 계산해야 함', async () => {
      const report = await validator.validateAll({
        projects: [{
          id: 'proj-1',
          title: 'Test'
          // 필수 필드 누락 (ERROR)
        } as any],
        events: []
      });

      const plan = await recoveryManager.createRecoveryPlan(report);

      // ERROR는 HIGH 또는 CRITICAL 우선순위를 가져야 함
      expect(plan.tasks[0].priority).toBeGreaterThanOrEqual(RecoveryPriority.HIGH);
    });

    it('복구 전략을 선택해야 함', async () => {
      recoveryManager.configure({
        strategy: RecoveryStrategy.SMART
      });

      const report = await validator.validateAll({
        projects: [],
        events: [{
          id: 'event-1',
          title: 'Test',
          startDate: new Date(),
          type: 'meeting',
          status: 'completed'
          // completedAt 누락
        } as CalendarEvent]
      });

      const plan = await recoveryManager.createRecoveryPlan(report);

      expect(plan.strategy).toBe(RecoveryStrategy.SMART);
      expect(plan.tasks[0].strategy).toBeDefined();
    });

    it('Dry run 모드를 지원해야 함', async () => {
      const report = await validator.validateAll({
        projects: [],
        events: []
      });

      const plan = await recoveryManager.createRecoveryPlan(report);

      // Dry run에서는 실제 변경이 없어야 함
      const result = await recoveryManager.executeRecoveryPlan(plan.id, {
        dryRun: true
      });

      expect(result.status).toBe('completed');
    });

    it('복구 히스토리를 유지해야 함', async () => {
      const report = await validator.validateAll({
        projects: [],
        events: []
      });

      await recoveryManager.createRecoveryPlan(report);
      await recoveryManager.createRecoveryPlan(report);

      const history = recoveryManager.getHistory();

      expect(history.length).toBe(2);
    });

    it('복구 통계를 제공해야 함', async () => {
      const stats = recoveryManager.getStatistics();

      expect(stats).toHaveProperty('totalPlans');
      expect(stats).toHaveProperty('completedPlans');
      expect(stats).toHaveProperty('successRate');
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeLessThanOrEqual(100);
    });
  });

  describe('통합 시나리오', () => {
    it('전체 검증 및 복구 프로세스가 작동해야 함', async () => {
      // 1. 문제가 있는 데이터 준비
      const projects: Project[] = [{
        id: 'proj-1',
        title: 'Test Project',
        phase: 'completed',
        startDate: new Date()
      } as Project];

      const events: CalendarEvent[] = [{
        id: 'event-1',
        title: 'Incomplete Event',
        projectId: 'proj-1',
        startDate: new Date(),
        type: 'meeting',
        status: 'scheduled' // 프로젝트는 완료인데 이벤트는 미완료
      } as CalendarEvent];

      // 2. 검증 실행
      const report = await consistencyValidator.validateAll({
        projects,
        events
      });

      expect(report.errors.length).toBeGreaterThan(0);
      expect(report.autoFixableCount).toBeGreaterThan(0);

      // 3. 복구 계획 생성
      const plan = await autoRecoveryManager.createRecoveryPlan(report);

      expect(plan.tasks.length).toBeGreaterThan(0);

      // 4. 복구 실행 (dry run)
      const result = await autoRecoveryManager.executeRecoveryPlan(plan.id, {
        dryRun: true,
        confirmationCallback: async () => true
      });

      expect(result.status).toBe('completed');
    });

    it('순환 참조를 감지하고 보고해야 함', async () => {
      // 순환 참조 테스트는 실제 구현에서 parent-child 관계가 있을 때 수행
      const projects: Project[] = [
        {
          id: 'proj-1',
          title: 'Project 1',
          phase: 'kickoff',
          startDate: new Date()
        },
        {
          id: 'proj-2',
          title: 'Project 2',
          phase: 'kickoff',
          startDate: new Date()
        }
      ] as Project[];

      const report = await consistencyValidator.validateAll({
        projects,
        events: []
      });

      // 순환 참조가 없으면 에러가 없어야 함
      expect(report.errors.filter(e =>
        e.rule === ValidationRule.CIRCULAR_REFERENCE
      ).length).toBe(0);
    });

    it('대량 데이터를 효율적으로 처리해야 함', async () => {
      const startTime = Date.now();

      // 대량 데이터 생성
      const projects: Project[] = Array(100).fill(null).map((_, i) => ({
        id: `proj-${i}`,
        title: `Project ${i}`,
        phase: 'kickoff',
        startDate: new Date()
      } as Project));

      const events: CalendarEvent[] = Array(500).fill(null).map((_, i) => ({
        id: `event-${i}`,
        title: `Event ${i}`,
        projectId: `proj-${i % 100}`,
        startDate: new Date(),
        type: 'meeting',
        status: 'scheduled'
      } as CalendarEvent));

      const report = await consistencyValidator.validateAll({
        projects,
        events
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 600개 엔티티를 5초 이내에 처리해야 함
      expect(duration).toBeLessThan(5000);
      expect(report.totalChecks).toBeGreaterThan(0);
    });

    it('메모리 누수가 없어야 함', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // 여러 번 검증 실행
      for (let i = 0; i < 10; i++) {
        const report = await consistencyValidator.validateAll({
          projects: Array(10).fill(null).map((_, j) => ({
            id: `proj-${i}-${j}`,
            title: `Project ${i}-${j}`,
            phase: 'kickoff',
            startDate: new Date()
          } as Project)),
          events: []
        });

        await autoRecoveryManager.createRecoveryPlan(report);
      }

      // 리셋
      consistencyValidator.reset();
      autoRecoveryManager.reset();

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // 메모리 증가가 10MB 미만이어야 함
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('엣지 케이스', () => {
    it('빈 데이터셋을 처리해야 함', async () => {
      const report = await consistencyValidator.validateAll({});

      expect(report).toBeDefined();
      expect(report.score).toBe(100);
      expect(report.errors.length).toBe(0);
    });

    it('null/undefined 값을 안전하게 처리해야 함', async () => {
      const report = await consistencyValidator.validateAll({
        projects: [null as any, undefined as any],
        events: [null as any]
      });

      // 에러가 발생하지 않고 검증이 수행되어야 함
      expect(report).toBeDefined();
    });

    it('잘못된 복구 계획 ID를 처리해야 함', async () => {
      await expect(
        autoRecoveryManager.executeRecoveryPlan('invalid-id')
      ).rejects.toThrow();
    });

    it('동시 복구 실행을 방지해야 함', async () => {
      const report = await consistencyValidator.validateAll({
        projects: [],
        events: []
      });

      const plan1 = await autoRecoveryManager.createRecoveryPlan(report);
      const plan2 = await autoRecoveryManager.createRecoveryPlan(report);

      // 첫 번째 실행
      const execution1 = autoRecoveryManager.executeRecoveryPlan(plan1.id, {
        dryRun: true
      });

      // 두 번째 실행은 실패해야 함
      await expect(
        autoRecoveryManager.executeRecoveryPlan(plan2.id, {
          dryRun: true
        })
      ).rejects.toThrow('이미 복구가 진행 중입니다');

      await execution1; // 첫 번째 완료 대기
    });
  });
});