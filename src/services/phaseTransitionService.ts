import type {
  ProjectPhase,
  Project,
  PhaseTransitionEvent,
  PhaseTransitionRule,
  PhaseTransitionTrigger,
  PhaseTransitionApprovalRequest,
  PhaseTransitionListener,
  GuideMeetingRecord,
  MeetingType
} from '../types/buildup.types';
import { globalIntegrationManager } from './integrationManager';
import {
  createPhaseTransitionEvent,
  checkMeetingBasedPhaseTransition
} from '../utils/phaseTransitionUtils';
import { phaseTransitionRules } from '../data/phaseTransitionRules';

/**
 * 단계 전환 엔진
 * 프로젝트 단계 전환의 중앙 처리 시스템
 */
export class PhaseTransitionEngine {
  private rules: PhaseTransitionRule[] = phaseTransitionRules;
  private listeners: PhaseTransitionListener[] = [];
  private pendingTransitions: Map<string, PhaseTransitionEvent> = new Map();
  private transitionHistory: PhaseTransitionEvent[] = [];
  private approvalRequests: Map<string, PhaseTransitionApprovalRequest> = new Map();

  constructor() {
    this.initializeRules();
  }

  /**
   * 규칙 초기화
   */
  private initializeRules(): void {
    // 기본 규칙은 이미 phaseTransitionRules에 정의되어 있음
    console.log(`Initialized ${this.rules.length} phase transition rules`);
  }

  /**
   * 이벤트 리스너 등록
   */
  addEventListener(listener: PhaseTransitionListener): void {
    this.listeners.push(listener);
  }

  /**
   * 이벤트 리스너 제거
   */
  removeEventListener(listener: PhaseTransitionListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * 이벤트 발생
   */
  private emitEvent(event: PhaseTransitionEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in phase transition listener:', error);
      }
    });
  }

  /**
   * 결제 완료 트리거
   */
  triggerPaymentCompleted(
    projectId: string,
    paymentData: {
      amount: number;
      paymentMethod: string;
      paidBy: string;
    }
  ): PhaseTransitionEvent | null {
    const project = this.getProject(projectId);
    if (!project) {
      return null;
    }

    // 결제 완료 시 가능한 전환 확인
    const rule = this.findApplicableRule(
      project.phase,
      'preparation_required',
      'payment_completed'
    );

    if (!rule) {
      return null;
    }

    const transitionEvent = createPhaseTransitionEvent(
      projectId,
      project.phase,
      rule.toPhase,
      'payment_completed',
      'system',
      {
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        paidBy: paymentData.paidBy
      }
    );

    if (rule.autoApply) {
      this.applyTransition(transitionEvent);
    } else {
      this.requestApproval(transitionEvent, 'system', '결제 완료로 인한 자동 단계 전환');
    }

    return transitionEvent;
  }

  /**
   * 미팅 완료 트리거
   */
  triggerMeetingCompleted(
    projectId: string,
    meetingRecord: GuideMeetingRecord,
    pmId: string
  ): PhaseTransitionEvent | null {
    const project = this.getProject(projectId);
    if (!project) {
      return null;
    }

    const transitionCheck = checkMeetingBasedPhaseTransition(project.phase, meetingRecord);

    if (!transitionCheck.shouldTransition || !transitionCheck.rule) {
      return null;
    }

    const transitionEvent = createPhaseTransitionEvent(
      projectId,
      project.phase,
      transitionCheck.rule.toPhase,
      'meeting_completed',
      pmId,
      {
        meetingRecordId: meetingRecord.id,
        calendarEventId: meetingRecord.calendarEventId,
        meetingType: meetingRecord.type
      }
    );

    if (transitionCheck.rule.autoApply) {
      this.applyTransition(transitionEvent);
    } else {
      this.requestApproval(
        transitionEvent,
        pmId,
        `${meetingRecord.type} 미팅 완료로 인한 단계 전환`
      );
    }

    return transitionEvent;
  }

  /**
   * 수동 단계 전환 요청
   */
  requestManualTransition(
    projectId: string,
    fromPhase: ProjectPhase,
    toPhase: ProjectPhase,
    requestedBy: string,
    reason: string
  ): PhaseTransitionEvent | null {
    const rule = this.findApplicableRule(fromPhase, toPhase, 'manual');

    if (!rule) {
      throw new Error(`No rule found for transition from ${fromPhase} to ${toPhase}`);
    }

    const transitionEvent = createPhaseTransitionEvent(
      projectId,
      fromPhase,
      toPhase,
      'manual',
      requestedBy,
      { reason }
    );

    this.requestApproval(transitionEvent, requestedBy, reason);
    return transitionEvent;
  }

  /**
   * 승인 요청 생성
   */
  private requestApproval(
    transitionEvent: PhaseTransitionEvent,
    requestedBy: string,
    reason: string
  ): void {
    const approvalRequest: PhaseTransitionApprovalRequest = {
      id: `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      phaseTransitionEvent: transitionEvent,
      requestedBy,
      requestedAt: new Date(),
      reason,
      status: 'pending'
    };

    this.approvalRequests.set(approvalRequest.id, approvalRequest);
    this.pendingTransitions.set(transitionEvent.id, transitionEvent);

    // 승인 요청 이벤트 발생
    this.emitEvent({
      ...transitionEvent,
      status: 'approval_required'
    });
  }

  /**
   * 승인 처리
   */
  approveTransition(approvalRequestId: string, approvedBy: string): boolean {
    const request = this.approvalRequests.get(approvalRequestId);
    if (!request || request.status !== 'pending') {
      return false;
    }

    request.status = 'approved';
    request.approvedBy = approvedBy;
    request.approvedAt = new Date();

    const transitionEvent = request.phaseTransitionEvent;
    this.applyTransition(transitionEvent);

    return true;
  }

  /**
   * 승인 거절
   */
  rejectTransition(approvalRequestId: string, rejectedBy: string, reason: string): boolean {
    const request = this.approvalRequests.get(approvalRequestId);
    if (!request || request.status !== 'pending') {
      return false;
    }

    request.status = 'rejected';
    request.rejectionReason = reason;

    const transitionEvent = request.phaseTransitionEvent;
    transitionEvent.status = 'rejected';
    transitionEvent.completedAt = new Date();

    this.pendingTransitions.delete(transitionEvent.id);
    this.transitionHistory.push(transitionEvent);

    this.emitEvent(transitionEvent);
    return true;
  }

  /**
   * 단계 전환 적용
   */
  private applyTransition(transitionEvent: PhaseTransitionEvent): void {
    try {
      // 프로젝트 단계 업데이트 (실제로는 BuildupContext를 통해 처리)
      this.updateProjectPhase(transitionEvent.projectId, transitionEvent.toPhase);

      // 관련 캘린더 이벤트 업데이트
      if (transitionEvent.triggerData?.calendarEventId) {
        this.updateCalendarEventPhase(
          transitionEvent.triggerData.calendarEventId,
          transitionEvent.toPhase
        );
      }

      // 전환 완료 처리
      transitionEvent.status = 'completed';
      transitionEvent.completedAt = new Date();

      this.transitionHistory.push(transitionEvent);
      this.pendingTransitions.delete(transitionEvent.id);

      this.emitEvent(transitionEvent);

      console.log(`Phase transition completed: ${transitionEvent.projectId} -> ${transitionEvent.toPhase}`);

    } catch (error) {
      console.error('Error applying phase transition:', error);
      transitionEvent.status = 'failed';
      transitionEvent.completedAt = new Date();
      this.emitEvent(transitionEvent);
    }
  }

  /**
   * 적용 가능한 규칙 찾기
   */
  private findApplicableRule(
    fromPhase: ProjectPhase,
    toPhase: ProjectPhase,
    trigger: PhaseTransitionTrigger,
    meetingType?: MeetingType
  ): PhaseTransitionRule | null {
    return this.rules.find(rule =>
      rule.fromPhase === fromPhase &&
      rule.toPhase === toPhase &&
      rule.trigger === trigger &&
      (!rule.meetingTypes || !meetingType || rule.meetingTypes.includes(meetingType))
    ) || null;
  }

  /**
   * 프로젝트 조회 (외부 의존성)
   */
  private getProject(projectId: string): Project | null {
    // TODO: BuildupContext에서 프로젝트 조회
    // 임시로 null 반환
    return null;
  }

  /**
   * 프로젝트 단계 업데이트 (외부 의존성)
   */
  private updateProjectPhase(projectId: string, newPhase: ProjectPhase): void {
    // TODO: BuildupContext를 통해 프로젝트 단계 업데이트
    console.log(`Updating project ${projectId} phase to ${newPhase}`);
  }

  /**
   * 캘린더 이벤트 단계 업데이트
   */
  private updateCalendarEventPhase(calendarEventId: string, newPhase: ProjectPhase): void {
    const calendarEvent = globalIntegrationManager.findCalendarEventByMeetingRecord('');
    if (calendarEvent) {
      // CalendarContext를 통해 업데이트
      console.log(`Updating calendar event ${calendarEventId} phase to ${newPhase}`);
    }
  }

  /**
   * 대기 중인 승인 요청 조회
   */
  getPendingApprovalRequests(): PhaseTransitionApprovalRequest[] {
    return Array.from(this.approvalRequests.values())
      .filter(request => request.status === 'pending');
  }

  /**
   * 프로젝트별 전환 이력 조회
   */
  getTransitionHistory(projectId?: string): PhaseTransitionEvent[] {
    if (!projectId) {
      return this.transitionHistory;
    }
    return this.transitionHistory.filter(event => event.projectId === projectId);
  }

  /**
   * 대기 중인 전환 조회
   */
  getPendingTransitions(): PhaseTransitionEvent[] {
    return Array.from(this.pendingTransitions.values());
  }

  /**
   * 프로젝트의 다음 가능한 전환들 조회
   */
  getAvailableTransitions(projectId: string): {
    automatic: PhaseTransitionRule[];
    manual: PhaseTransitionRule[];
  } {
    const project = this.getProject(projectId);
    if (!project) {
      return { automatic: [], manual: [] };
    }

    const currentPhase = project.phase;
    const availableRules = this.rules.filter(rule => rule.fromPhase === currentPhase);

    return {
      automatic: availableRules.filter(rule => rule.autoApply),
      manual: availableRules.filter(rule => !rule.autoApply)
    };
  }

  /**
   * 통계 조회
   */
  getStatistics() {
    const totalTransitions = this.transitionHistory.length;
    const completedTransitions = this.transitionHistory.filter(t => t.status === 'completed').length;
    const failedTransitions = this.transitionHistory.filter(t => t.status === 'failed').length;
    const pendingApprovals = this.getPendingApprovalRequests().length;

    const byTrigger = this.transitionHistory.reduce((acc, t) => {
      acc[t.trigger] = (acc[t.trigger] || 0) + 1;
      return acc;
    }, {} as Record<PhaseTransitionTrigger, number>);

    return {
      totalTransitions,
      completedTransitions,
      failedTransitions,
      pendingApprovals,
      successRate: totalTransitions > 0 ? (completedTransitions / totalTransitions) * 100 : 0,
      byTrigger
    };
  }

  /**
   * 엔진 상태 초기화
   */
  reset(): void {
    this.pendingTransitions.clear();
    this.approvalRequests.clear();
    this.transitionHistory = [];
  }
}

/**
 * 전역 단계 전환 엔진 인스턴스
 */
export const globalPhaseTransitionEngine = new PhaseTransitionEngine();

/**
 * 편의 함수들
 */
export const PhaseTransitionService = {
  /**
   * 결제 완료 처리
   */
  handlePaymentCompleted: (projectId: string, paymentData: any) => {
    return globalPhaseTransitionEngine.triggerPaymentCompleted(projectId, paymentData);
  },

  /**
   * 미팅 완료 처리
   */
  handleMeetingCompleted: (projectId: string, meetingRecord: GuideMeetingRecord, pmId: string) => {
    return globalPhaseTransitionEngine.triggerMeetingCompleted(projectId, meetingRecord, pmId);
  },

  /**
   * 수동 전환 요청
   */
  requestTransition: (projectId: string, fromPhase: ProjectPhase, toPhase: ProjectPhase, requestedBy: string, reason: string) => {
    return globalPhaseTransitionEngine.requestManualTransition(projectId, fromPhase, toPhase, requestedBy, reason);
  },

  /**
   * 승인 처리
   */
  approve: (approvalRequestId: string, approvedBy: string) => {
    return globalPhaseTransitionEngine.approveTransition(approvalRequestId, approvedBy);
  },

  /**
   * 거절 처리
   */
  reject: (approvalRequestId: string, rejectedBy: string, reason: string) => {
    return globalPhaseTransitionEngine.rejectTransition(approvalRequestId, rejectedBy, reason);
  },

  /**
   * 이벤트 리스너 등록
   */
  addEventListener: (listener: PhaseTransitionListener) => {
    globalPhaseTransitionEngine.addEventListener(listener);
  },

  /**
   * 통계 조회
   */
  getStatistics: () => {
    return globalPhaseTransitionEngine.getStatistics();
  },

  /**
   * 대기 중인 승인 요청
   */
  getPendingApprovals: () => {
    return globalPhaseTransitionEngine.getPendingApprovalRequests();
  },

  /**
   * 전환 이력
   */
  getHistory: (projectId?: string) => {
    return globalPhaseTransitionEngine.getTransitionHistory(projectId);
  }
};