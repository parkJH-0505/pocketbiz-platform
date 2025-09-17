/**
 * Automatic Phase Transition Service
 * 자동 단계 전환 엔진 - 미팅 완료, 결제 확인 등의 트리거 기반으로 프로젝트 단계 자동 전환
 */

import type { Project, ProjectPhase } from '../types/buildup.types';
import type {
  PhaseTransitionRule,
  PhaseTransitionEvent,
  PhaseTransitionTrigger,
  GuideMeetingRecord,
  MeetingType
} from '../types/meeting.types';
import type { CalendarEvent } from '../types/calendar.types';
import {
  DEFAULT_PHASE_TRANSITION_RULES,
  canTransitionToPhase,
  createPhaseTransitionEvent,
  getNextPhase,
  checkMeetingBasedPhaseTransition
} from '../utils/projectPhaseUtils';
import { globalIntegrationManager } from '../utils/calendarMeetingIntegration';

/**
 * 단계 전환 이벤트 리스너 타입
 */
export type PhaseTransitionListener = (event: PhaseTransitionEvent) => void;

/**
 * 단계 전환 승인 요청 타입
 */
export interface PhaseTransitionApprovalRequest {
  id: string;
  phaseTransitionEvent: PhaseTransitionEvent;
  requestedBy: string;
  requestedAt: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
}

/**
 * 자동 단계 전환 엔진
 */
export class PhaseTransitionEngine {
  private listeners: PhaseTransitionListener[] = [];
  private pendingTransitions: Map<string, PhaseTransitionEvent> = new Map();
  private approvalRequests: Map<string, PhaseTransitionApprovalRequest> = new Map();
  private transitionHistory: PhaseTransitionEvent[] = [];
  private rules: PhaseTransitionRule[] = [...DEFAULT_PHASE_TRANSITION_RULES];

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
   * 이벤트 발생 알림
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
   * 커스텀 규칙 추가
   */
  addRule(rule: PhaseTransitionRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 규칙 제거
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  /**
   * 결제 완료 트리거
   */
  triggerPaymentCompleted(projectId: string, paymentData: {
    amount: number;
    paymentId: string;
    paymentMethod: string;
    paidBy: string;
  }): PhaseTransitionEvent | null {
    const project = this.getProject(projectId);
    if (!project || project.phase !== 'contract_pending') {
      return null;
    }

    const rule = this.findApplicableRule(
      project.phase,
      'contract_signed',
      'payment_completed'
    );

    if (!rule) {
      return null;
    }

    const transitionEvent = createPhaseTransitionEvent(
      projectId,
      project.phase,
      'contract_signed',
      'payment_completed',
      'system',
      {
        paymentId: paymentData.paymentId,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        paidBy: paymentData.paidBy
      }
    );

    if (rule.autoApply) {
      this.applyTransition(transitionEvent);
    } else {
      this.requestApproval(transitionEvent, 'system', '결제 완료로 인한 자동 단계 전환');\n    }\n\n    return transitionEvent;\n  }\n\n  /**\n   * 미팅 완료 트리거\n   */\n  triggerMeetingCompleted(\n    projectId: string,\n    meetingRecord: GuideMeetingRecord,\n    pmId: string\n  ): PhaseTransitionEvent | null {\n    const project = this.getProject(projectId);\n    if (!project) {\n      return null;\n    }\n\n    const transitionCheck = checkMeetingBasedPhaseTransition(project.phase, meetingRecord);\n    \n    if (!transitionCheck.shouldTransition || !transitionCheck.rule) {\n      return null;\n    }\n\n    const transitionEvent = createPhaseTransitionEvent(\n      projectId,\n      project.phase,\n      transitionCheck.rule.toPhase,\n      'meeting_completed',\n      pmId,\n      {\n        meetingRecordId: meetingRecord.id,\n        calendarEventId: meetingRecord.calendarEventId,\n        meetingType: meetingRecord.type\n      }\n    );\n\n    if (transitionCheck.rule.autoApply) {\n      this.applyTransition(transitionEvent);\n    } else {\n      this.requestApproval(\n        transitionEvent,\n        pmId,\n        `${meetingRecord.type} 미팅 완료로 인한 단계 전환`\n      );\n    }\n\n    return transitionEvent;\n  }\n\n  /**\n   * 수동 단계 전환 요청\n   */\n  requestManualTransition(\n    projectId: string,\n    fromPhase: ProjectPhase,\n    toPhase: ProjectPhase,\n    requestedBy: string,\n    reason: string\n  ): PhaseTransitionEvent | null {\n    const rule = this.findApplicableRule(fromPhase, toPhase, 'manual');\n    \n    if (!rule) {\n      throw new Error(`No rule found for transition from ${fromPhase} to ${toPhase}`);\n    }\n\n    const transitionEvent = createPhaseTransitionEvent(\n      projectId,\n      fromPhase,\n      toPhase,\n      'manual',\n      requestedBy,\n      { reason }\n    );\n\n    this.requestApproval(transitionEvent, requestedBy, reason);\n    return transitionEvent;\n  }\n\n  /**\n   * 승인 요청 생성\n   */\n  private requestApproval(\n    transitionEvent: PhaseTransitionEvent,\n    requestedBy: string,\n    reason: string\n  ): void {\n    const approvalRequest: PhaseTransitionApprovalRequest = {\n      id: `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,\n      phaseTransitionEvent: transitionEvent,\n      requestedBy,\n      requestedAt: new Date(),\n      reason,\n      status: 'pending'\n    };\n\n    this.approvalRequests.set(approvalRequest.id, approvalRequest);\n    this.pendingTransitions.set(transitionEvent.id, transitionEvent);\n\n    // 승인 요청 이벤트 발생\n    this.emitEvent({\n      ...transitionEvent,\n      status: 'approval_required'\n    });\n  }\n\n  /**\n   * 승인 처리\n   */\n  approveTransition(approvalRequestId: string, approvedBy: string): boolean {\n    const request = this.approvalRequests.get(approvalRequestId);\n    if (!request || request.status !== 'pending') {\n      return false;\n    }\n\n    request.status = 'approved';\n    request.approvedBy = approvedBy;\n    request.approvedAt = new Date();\n\n    const transitionEvent = request.phaseTransitionEvent;\n    this.applyTransition(transitionEvent);\n\n    return true;\n  }\n\n  /**\n   * 승인 거절\n   */\n  rejectTransition(approvalRequestId: string, rejectedBy: string, reason: string): boolean {\n    const request = this.approvalRequests.get(approvalRequestId);\n    if (!request || request.status !== 'pending') {\n      return false;\n    }\n\n    request.status = 'rejected';\n    request.rejectionReason = reason;\n\n    const transitionEvent = request.phaseTransitionEvent;\n    transitionEvent.status = 'rejected';\n    transitionEvent.completedAt = new Date();\n\n    this.pendingTransitions.delete(transitionEvent.id);\n    this.transitionHistory.push(transitionEvent);\n\n    this.emitEvent(transitionEvent);\n    return true;\n  }\n\n  /**\n   * 단계 전환 적용\n   */\n  private applyTransition(transitionEvent: PhaseTransitionEvent): void {\n    try {\n      // 프로젝트 단계 업데이트 (실제로는 BuildupContext를 통해 처리)\n      this.updateProjectPhase(transitionEvent.projectId, transitionEvent.toPhase);\n\n      // 관련 캘린더 이벤트 업데이트\n      if (transitionEvent.triggerData?.calendarEventId) {\n        this.updateCalendarEventPhase(\n          transitionEvent.triggerData.calendarEventId,\n          transitionEvent.toPhase\n        );\n      }\n\n      // 전환 완료 처리\n      transitionEvent.status = 'completed';\n      transitionEvent.completedAt = new Date();\n\n      this.transitionHistory.push(transitionEvent);\n      this.pendingTransitions.delete(transitionEvent.id);\n\n      this.emitEvent(transitionEvent);\n\n      console.log(`Phase transition completed: ${transitionEvent.projectId} -> ${transitionEvent.toPhase}`);\n\n    } catch (error) {\n      console.error('Error applying phase transition:', error);\n      transitionEvent.status = 'failed';\n      transitionEvent.completedAt = new Date();\n      this.emitEvent(transitionEvent);\n    }\n  }\n\n  /**\n   * 적용 가능한 규칙 찾기\n   */\n  private findApplicableRule(\n    fromPhase: ProjectPhase,\n    toPhase: ProjectPhase,\n    trigger: PhaseTransitionTrigger,\n    meetingType?: MeetingType\n  ): PhaseTransitionRule | null {\n    return this.rules.find(rule =>\n      rule.fromPhase === fromPhase &&\n      rule.toPhase === toPhase &&\n      rule.trigger === trigger &&\n      (!rule.meetingTypes || !meetingType || rule.meetingTypes.includes(meetingType))\n    ) || null;\n  }\n\n  /**\n   * 프로젝트 조회 (외부 의존성)\n   */\n  private getProject(projectId: string): Project | null {\n    // TODO: BuildupContext에서 프로젝트 조회\n    // 임시로 null 반환\n    return null;\n  }\n\n  /**\n   * 프로젝트 단계 업데이트 (외부 의존성)\n   */\n  private updateProjectPhase(projectId: string, newPhase: ProjectPhase): void {\n    // TODO: BuildupContext를 통해 프로젝트 단계 업데이트\n    console.log(`Updating project ${projectId} phase to ${newPhase}`);\n  }\n\n  /**\n   * 캘린더 이벤트 단계 업데이트\n   */\n  private updateCalendarEventPhase(calendarEventId: string, newPhase: ProjectPhase): void {\n    const calendarEvent = globalIntegrationManager.findCalendarEventByMeetingRecord('');\n    if (calendarEvent) {\n      // CalendarContext를 통해 업데이트\n      console.log(`Updating calendar event ${calendarEventId} phase to ${newPhase}`);\n    }\n  }\n\n  /**\n   * 대기 중인 승인 요청 조회\n   */\n  getPendingApprovalRequests(): PhaseTransitionApprovalRequest[] {\n    return Array.from(this.approvalRequests.values())\n      .filter(request => request.status === 'pending');\n  }\n\n  /**\n   * 프로젝트별 전환 이력 조회\n   */\n  getTransitionHistory(projectId?: string): PhaseTransitionEvent[] {\n    if (!projectId) {\n      return this.transitionHistory;\n    }\n    return this.transitionHistory.filter(event => event.projectId === projectId);\n  }\n\n  /**\n   * 대기 중인 전환 조회\n   */\n  getPendingTransitions(): PhaseTransitionEvent[] {\n    return Array.from(this.pendingTransitions.values());\n  }\n\n  /**\n   * 프로젝트의 다음 가능한 전환들 조회\n   */\n  getAvailableTransitions(projectId: string): {\n    automatic: PhaseTransitionRule[];\n    manual: PhaseTransitionRule[];\n  } {\n    const project = this.getProject(projectId);\n    if (!project) {\n      return { automatic: [], manual: [] };\n    }\n\n    const currentPhase = project.phase;\n    const availableRules = this.rules.filter(rule => rule.fromPhase === currentPhase);\n\n    return {\n      automatic: availableRules.filter(rule => rule.autoApply),\n      manual: availableRules.filter(rule => !rule.autoApply)\n    };\n  }\n\n  /**\n   * 통계 조회\n   */\n  getStatistics() {\n    const totalTransitions = this.transitionHistory.length;\n    const completedTransitions = this.transitionHistory.filter(t => t.status === 'completed').length;\n    const failedTransitions = this.transitionHistory.filter(t => t.status === 'failed').length;\n    const pendingApprovals = this.getPendingApprovalRequests().length;\n\n    const byTrigger = this.transitionHistory.reduce((acc, t) => {\n      acc[t.trigger] = (acc[t.trigger] || 0) + 1;\n      return acc;\n    }, {} as Record<PhaseTransitionTrigger, number>);\n\n    return {\n      totalTransitions,\n      completedTransitions,\n      failedTransitions,\n      pendingApprovals,\n      successRate: totalTransitions > 0 ? (completedTransitions / totalTransitions) * 100 : 0,\n      byTrigger\n    };\n  }\n\n  /**\n   * 엔진 상태 초기화\n   */\n  reset(): void {\n    this.pendingTransitions.clear();\n    this.approvalRequests.clear();\n    this.transitionHistory = [];\n  }\n}\n\n/**\n * 전역 단계 전환 엔진 인스턴스\n */\nexport const globalPhaseTransitionEngine = new PhaseTransitionEngine();\n\n/**\n * 편의 함수들\n */\nexport const PhaseTransitionService = {\n  /**\n   * 결제 완료 처리\n   */\n  handlePaymentCompleted: (projectId: string, paymentData: any) => {\n    return globalPhaseTransitionEngine.triggerPaymentCompleted(projectId, paymentData);\n  },\n\n  /**\n   * 미팅 완료 처리\n   */\n  handleMeetingCompleted: (projectId: string, meetingRecord: GuideMeetingRecord, pmId: string) => {\n    return globalPhaseTransitionEngine.triggerMeetingCompleted(projectId, meetingRecord, pmId);\n  },\n\n  /**\n   * 수동 전환 요청\n   */\n  requestTransition: (projectId: string, fromPhase: ProjectPhase, toPhase: ProjectPhase, requestedBy: string, reason: string) => {\n    return globalPhaseTransitionEngine.requestManualTransition(projectId, fromPhase, toPhase, requestedBy, reason);\n  },\n\n  /**\n   * 승인 처리\n   */\n  approve: (approvalRequestId: string, approvedBy: string) => {\n    return globalPhaseTransitionEngine.approveTransition(approvalRequestId, approvedBy);\n  },\n\n  /**\n   * 거절 처리\n   */\n  reject: (approvalRequestId: string, rejectedBy: string, reason: string) => {\n    return globalPhaseTransitionEngine.rejectTransition(approvalRequestId, rejectedBy, reason);\n  },\n\n  /**\n   * 이벤트 리스너 등록\n   */\n  addEventListener: (listener: PhaseTransitionListener) => {\n    globalPhaseTransitionEngine.addEventListener(listener);\n  },\n\n  /**\n   * 통계 조회\n   */\n  getStatistics: () => {\n    return globalPhaseTransitionEngine.getStatistics();\n  },\n\n  /**\n   * 대기 중인 승인 요청\n   */\n  getPendingApprovals: () => {\n    return globalPhaseTransitionEngine.getPendingApprovalRequests();\n  },\n\n  /**\n   * 전환 이력\n   */\n  getHistory: (projectId?: string) => {\n    return globalPhaseTransitionEngine.getTransitionHistory(projectId);\n  }\n};