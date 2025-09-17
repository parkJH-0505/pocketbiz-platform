/**
 * PhaseTransitionEngineV2.ts
 *
 * 완전히 새로운 Phase Transition Engine
 * Event Bus 기반, 완전 격리, 순환 참조 없음
 * 기존 코드와 독립적으로 작동
 */

import { serviceRegistry } from '../services/ServiceRegistry';
import { eventBus, createEvent } from '../events/EventBus';
import { logger } from '../logging/Logger';
import type {
  EventTypeMap,
  MeetingCompletedEvent,
  PhaseChangeRequestEvent,
  PhaseChangedEvent
} from '../events/eventTypes';
import type { ProjectPhase } from '../../types/buildup.types';

// 페이즈 전환 규칙 타입 (독립적)
interface PhaseTransitionRule {
  id: string;
  name: string;
  from: ProjectPhase;
  to: ProjectPhase;
  trigger: 'manual' | 'meeting_completed' | 'payment_completed' | 'time_based';
  conditions: PhaseCondition[];
  autoApprove: boolean;
  description: string;
}

interface PhaseCondition {
  type: 'meeting_count' | 'payment_status' | 'approval_required' | 'time_elapsed';
  value: any;
  operator: 'equals' | 'greater_than' | 'less_than' | 'exists';
}

// 내부 상태 타입
interface PhaseTransitionState {
  projectId: string;
  currentPhase: ProjectPhase;
  pendingTransitions: PendingTransition[];
  history: PhaseTransitionRecord[];
  lastUpdated: Date;
}

interface PendingTransition {
  id: string;
  projectId: string;
  targetPhase: ProjectPhase;
  trigger: string;
  reason: string;
  requestedAt: Date;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
}

interface PhaseTransitionRecord {
  id: string;
  projectId: string;
  fromPhase: ProjectPhase;
  toPhase: ProjectPhase;
  trigger: string;
  reason: string;
  approvedBy?: string;
  completedAt: Date;
  automatic: boolean;
}

// Circuit Breaker를 위한 상태
interface CircuitBreakerState {
  failures: number;
  lastFailure: Date | null;
  state: 'closed' | 'open' | 'half-open';
  openUntil: Date | null;
}

export class PhaseTransitionEngineV2 {
  private rules: Map<string, PhaseTransitionRule> = new Map();
  private projectStates: Map<string, PhaseTransitionState> = new Map();
  private circuitBreaker: CircuitBreakerState = {
    failures: 0,
    lastFailure: null,
    state: 'closed',
    openUntil: null
  };
  private enabled = false;
  private readonly maxFailures = 5;
  private readonly recoveryTime = 60000; // 1분

  constructor() {
    this.initializeRules();
    this.setupEventListeners();
    logger.info('PhaseTransitionEngineV2 constructed', {}, 'PhaseTransitionV2');
  }

  /**
   * 엔진 활성화 (Feature Toggle)
   */
  async enable(): Promise<void> {
    if (this.circuitBreaker.state === 'open') {
      throw new Error('Circuit breaker is open. Cannot enable phase transition engine.');
    }

    try {
      this.enabled = true;
      logger.info('PhaseTransitionEngineV2 enabled', {}, 'PhaseTransitionV2');

      // 시스템 건강 상태 체크
      await this.performHealthCheck();

    } catch (error) {
      this.enabled = false;
      this.recordFailure(error as Error);
      throw error;
    }
  }

  /**
   * 엔진 비활성화
   */
  disable(): void {
    this.enabled = false;
    logger.info('PhaseTransitionEngineV2 disabled', {}, 'PhaseTransitionV2');
  }

  /**
   * 활성화 상태 확인
   */
  isEnabled(): boolean {
    return this.enabled && this.circuitBreaker.state !== 'open';
  }

  /**
   * 기본 전환 규칙 초기화
   */
  private initializeRules(): void {
    const defaultRules: PhaseTransitionRule[] = [
      {
        id: 'payment-to-pm-assignment',
        name: '결제 완료 → PM 배정',
        from: '결제 대기',
        to: 'PM 배정 중',
        trigger: 'payment_completed',
        conditions: [
          { type: 'payment_status', value: 'completed', operator: 'equals' }
        ],
        autoApprove: true,
        description: '결제 완료 시 자동으로 PM 배정 단계로 전환'
      },
      {
        id: 'pm-to-kickoff',
        name: 'PM 배정 → 킥오프 준비',
        from: 'PM 배정 중',
        to: '킥오프 준비',
        trigger: 'manual',
        conditions: [
          { type: 'approval_required', value: true, operator: 'equals' }
        ],
        autoApprove: false,
        description: 'PM 배정 완료 후 수동으로 킥오프 준비 단계로 전환'
      },
      {
        id: 'kickoff-to-progress',
        name: '킥오프 준비 → 진행 중',
        from: '킥오프 준비',
        to: '진행 중',
        trigger: 'meeting_completed',
        conditions: [
          { type: 'meeting_count', value: 1, operator: 'greater_than' }
        ],
        autoApprove: true,
        description: '킥오프 미팅 완료 시 자동으로 진행 중 단계로 전환'
      },
      {
        id: 'progress-to-completion',
        name: '진행 중 → 마무리',
        from: '진행 중',
        to: '마무리',
        trigger: 'manual',
        conditions: [
          { type: 'approval_required', value: true, operator: 'equals' }
        ],
        autoApprove: false,
        description: '프로젝트 진행 완료 후 수동으로 마무리 단계로 전환'
      },
      {
        id: 'completion-to-done',
        name: '마무리 → 완료',
        from: '마무리',
        to: '완료',
        trigger: 'manual',
        conditions: [
          { type: 'approval_required', value: true, operator: 'equals' }
        ],
        autoApprove: false,
        description: '최종 검토 완료 후 프로젝트 완료로 전환'
      }
    ];

    for (const rule of defaultRules) {
      this.rules.set(rule.id, rule);
    }

    logger.info('Phase transition rules initialized', {
      ruleCount: this.rules.size
    }, 'PhaseTransitionV2');
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    // 미팅 완료 이벤트 처리
    eventBus.on('MEETING_COMPLETED', async (event: MeetingCompletedEvent) => {
      if (!this.isEnabled()) return;

      try {
        await this.handleMeetingCompleted(event);
      } catch (error) {
        this.recordFailure(error as Error);
        logger.error('Failed to handle meeting completed event', error, 'PhaseTransitionV2');
      }
    });

    // 페이즈 변경 요청 처리
    eventBus.on('PHASE_CHANGE_REQUEST', async (event: PhaseChangeRequestEvent) => {
      if (!this.isEnabled()) return;

      try {
        await this.handlePhaseChangeRequest(event);
      } catch (error) {
        this.recordFailure(error as Error);
        logger.error('Failed to handle phase change request', error, 'PhaseTransitionV2');
      }
    });

    logger.info('Event listeners setup completed', {}, 'PhaseTransitionV2');
  }

  /**
   * 미팅 완료 이벤트 처리
   */
  private async handleMeetingCompleted(event: MeetingCompletedEvent): Promise<void> {
    const { projectId } = event.payload;

    logger.info('Processing meeting completed event', {
      projectId,
      meetingId: event.payload.meetingId
    }, 'PhaseTransitionV2');

    // 프로젝트 상태 가져오기
    const projectState = await this.getProjectState(projectId);
    if (!projectState) {
      logger.warn('Project state not found', { projectId }, 'PhaseTransitionV2');
      return;
    }

    // 미팅 완료 기반 전환 규칙 찾기
    const applicableRules = this.findApplicableRules(
      projectState.currentPhase,
      'meeting_completed'
    );

    for (const rule of applicableRules) {
      if (await this.checkConditions(rule, projectId, event)) {
        await this.requestPhaseTransition(
          projectId,
          rule.to,
          `Meeting completed: ${event.payload.meetingId}`,
          event.payload.completedBy,
          rule.autoApprove
        );
      }
    }
  }

  /**
   * 페이즈 변경 요청 처리
   */
  private async handlePhaseChangeRequest(event: PhaseChangeRequestEvent): Promise<void> {
    const { projectId, targetPhase, reason, requestedBy, automatic } = event.payload;

    logger.info('Processing phase change request', {
      projectId,
      targetPhase,
      automatic
    }, 'PhaseTransitionV2');

    if (automatic) {
      // 자동 승인 조건 확인
      await this.processAutomaticTransition(projectId, targetPhase, reason, requestedBy);
    } else {
      // 수동 승인 대기
      await this.createPendingTransition(projectId, targetPhase, reason, requestedBy);
    }
  }

  /**
   * 프로젝트 상태 가져오기 (Service Registry 통해 안전하게)
   */
  private async getProjectState(projectId: string): Promise<PhaseTransitionState | null> {
    try {
      // Service Registry를 통해 BuildupContext에 접근 (나중에 구현)
      // 지금은 Mock 데이터 반환
      if (!this.projectStates.has(projectId)) {
        this.projectStates.set(projectId, {
          projectId,
          currentPhase: '킥오프 준비', // 기본값
          pendingTransitions: [],
          history: [],
          lastUpdated: new Date()
        });
      }

      return this.projectStates.get(projectId) || null;
    } catch (error) {
      logger.error('Failed to get project state', error, 'PhaseTransitionV2');
      return null;
    }
  }

  /**
   * 적용 가능한 규칙 찾기
   */
  private findApplicableRules(
    currentPhase: ProjectPhase,
    trigger: string
  ): PhaseTransitionRule[] {
    return Array.from(this.rules.values()).filter(
      rule => rule.from === currentPhase && rule.trigger === trigger
    );
  }

  /**
   * 규칙 조건 확인
   */
  private async checkConditions(
    rule: PhaseTransitionRule,
    projectId: string,
    context: any
  ): Promise<boolean> {
    for (const condition of rule.conditions) {
      if (!(await this.evaluateCondition(condition, projectId, context))) {
        return false;
      }
    }
    return true;
  }

  /**
   * 개별 조건 평가
   */
  private async evaluateCondition(
    condition: PhaseCondition,
    projectId: string,
    context: any
  ): Promise<boolean> {
    // 실제 구현에서는 데이터베이스나 외부 서비스 조회
    // 지금은 간단한 Mock 로직
    switch (condition.type) {
      case 'meeting_count':
        return true; // 항상 통과
      case 'payment_status':
        return true; // 항상 통과
      case 'approval_required':
        return true; // 항상 통과
      default:
        return false;
    }
  }

  /**
   * 페이즈 전환 요청
   */
  private async requestPhaseTransition(
    projectId: string,
    targetPhase: ProjectPhase,
    reason: string,
    requestedBy: string,
    autoApprove: boolean
  ): Promise<void> {
    const transitionEvent = createEvent('PHASE_CHANGE_REQUEST', {
      projectId,
      currentPhase: (await this.getProjectState(projectId))?.currentPhase || '킥오프 준비',
      targetPhase,
      reason,
      requestedBy,
      automatic: autoApprove
    }, { source: 'PhaseTransitionV2' });

    await eventBus.emit('PHASE_CHANGE_REQUEST', transitionEvent);
  }

  /**
   * 자동 전환 처리
   */
  private async processAutomaticTransition(
    projectId: string,
    targetPhase: ProjectPhase,
    reason: string,
    requestedBy: string
  ): Promise<void> {
    const projectState = await this.getProjectState(projectId);
    if (!projectState) return;

    // 상태 업데이트
    projectState.currentPhase = targetPhase;
    projectState.history.push({
      id: `transition_${Date.now()}`,
      projectId,
      fromPhase: projectState.currentPhase,
      toPhase: targetPhase,
      trigger: 'automatic',
      reason,
      completedAt: new Date(),
      automatic: true
    });
    projectState.lastUpdated = new Date();

    // 변경 완료 이벤트 발행
    const changedEvent = createEvent('PHASE_CHANGED', {
      projectId,
      previousPhase: projectState.currentPhase,
      newPhase: targetPhase,
      reason,
      changedBy: requestedBy,
      changedAt: new Date(),
      automatic: true
    }, { source: 'PhaseTransitionV2' });

    await eventBus.emit('PHASE_CHANGED', changedEvent);

    logger.info('Automatic phase transition completed', {
      projectId,
      previousPhase: projectState.currentPhase,
      newPhase: targetPhase
    }, 'PhaseTransitionV2');
  }

  /**
   * 수동 승인 대기 전환 생성
   */
  private async createPendingTransition(
    projectId: string,
    targetPhase: ProjectPhase,
    reason: string,
    requestedBy: string
  ): Promise<void> {
    const projectState = await this.getProjectState(projectId);
    if (!projectState) return;

    const pendingTransition: PendingTransition = {
      id: `pending_${Date.now()}`,
      projectId,
      targetPhase,
      trigger: 'manual',
      reason,
      requestedAt: new Date(),
      requestedBy,
      status: 'pending'
    };

    projectState.pendingTransitions.push(pendingTransition);

    logger.info('Pending transition created', {
      projectId,
      targetPhase,
      transitionId: pendingTransition.id
    }, 'PhaseTransitionV2');
  }

  /**
   * Circuit Breaker: 실패 기록
   */
  private recordFailure(error: Error): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = new Date();

    if (this.circuitBreaker.failures >= this.maxFailures) {
      this.circuitBreaker.state = 'open';
      this.circuitBreaker.openUntil = new Date(Date.now() + this.recoveryTime);
      this.enabled = false;

      logger.error('Circuit breaker opened due to repeated failures', {
        failures: this.circuitBreaker.failures,
        error: error.message
      }, 'PhaseTransitionV2');
    }
  }

  /**
   * Circuit Breaker: 복구 확인
   */
  private checkCircuitBreakerRecovery(): void {
    if (
      this.circuitBreaker.state === 'open' &&
      this.circuitBreaker.openUntil &&
      new Date() > this.circuitBreaker.openUntil
    ) {
      this.circuitBreaker.state = 'half-open';
      logger.info('Circuit breaker entering half-open state', {}, 'PhaseTransitionV2');
    }
  }

  /**
   * 시스템 건강 상태 체크
   */
  private async performHealthCheck(): Promise<void> {
    try {
      // Event Bus 상태 확인
      const eventBusMetrics = eventBus.getMetrics();
      if (eventBusMetrics.errorCount > 10) {
        throw new Error('Event Bus error count too high');
      }

      // Service Registry 상태 확인
      const serviceMetrics = serviceRegistry.getMetrics();
      if (serviceMetrics.errorServices > 0) {
        throw new Error('Service Registry has error services');
      }

      // Circuit Breaker 복구 확인
      this.checkCircuitBreakerRecovery();

      logger.info('Health check passed', {
        eventBusErrors: eventBusMetrics.errorCount,
        serviceErrors: serviceMetrics.errorServices
      }, 'PhaseTransitionV2');

    } catch (error) {
      logger.error('Health check failed', error, 'PhaseTransitionV2');
      throw error;
    }
  }

  /**
   * 상태 조회 (디버깅/모니터링용)
   */
  getStatus() {
    return {
      enabled: this.enabled,
      circuitBreaker: this.circuitBreaker,
      rulesCount: this.rules.size,
      projectsCount: this.projectStates.size,
      version: '2.0.0'
    };
  }

  /**
   * 정리 작업
   */
  dispose(): void {
    this.enabled = false;
    this.projectStates.clear();
    logger.info('PhaseTransitionEngineV2 disposed', {}, 'PhaseTransitionV2');
  }
}