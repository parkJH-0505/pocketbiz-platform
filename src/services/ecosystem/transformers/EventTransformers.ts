/**
 * Event Transformers
 * 시스템 간 이벤트 데이터 변환 엔진
 */

import type { AxisKey } from '../../../types/buildup.types';
import {
  BaseEvent,
  V2ScenarioSavedEvent,
  CalendarEventCreatedEvent,
  BuildupMilestoneCompletedEvent,
  EventTransformResult
} from '../types';

export interface TransformedCalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: 'meeting' | 'milestone' | 'deadline' | 'review' | 'launch';
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedDuration?: number;
  attendees?: string[];
  projectId?: string;
  relatedScenario?: string;
}

export interface TransformedMilestone {
  id: string;
  name: string;
  estimatedDays: number;
  dependencies?: string[];
  kpiImpact?: Partial<Record<AxisKey, number>>;
  priority: 'high' | 'medium' | 'low';
}

export interface TransformedProject {
  id: string;
  title: string;
  description: string;
  phase: string;
  priority: 'high' | 'medium' | 'low';
  estimatedDuration: string;
  expectedKPIImpact: Partial<Record<AxisKey, number>>;
  keyActions: string[];
  milestones: TransformedMilestone[];
  deadline: string;
}

export interface TransformedKPIImpact {
  sourceType: 'milestone' | 'project' | 'external_event';
  sourceId: string;
  sourceName: string;
  impactType: 'immediate' | 'progressive' | 'delayed';
  scoreAdjustments: Partial<Record<AxisKey, number>>;
  confidence: number;
  timestamp: string;
  description: string;
}

export interface TransformedExternalFactor {
  id: string;
  type: 'scheduled_event' | 'market_condition' | 'competitive_action' | 'milestone_achieved';
  name: string;
  description: string;
  scheduledDate?: string;
  actualDate?: string;
  expectedImpact: Partial<Record<AxisKey, number>>;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  metadata: Record<string, any>;
}

export class EventTransformers {
  private static instance: EventTransformers;

  static getInstance(): EventTransformers {
    if (!EventTransformers.instance) {
      EventTransformers.instance = new EventTransformers();
    }
    return EventTransformers.instance;
  }

  /**
   * V2 시나리오 → 캘린더 이벤트들 변환
   */
  async scenarioToCalendarEvents(scenarioData: V2ScenarioSavedEvent['data']): Promise<TransformedCalendarEvent[]> {
    const {
      scenarioId,
      name,
      keyActions,
      timeline,
      priority,
      projectedScores,
      estimatedEffort
    } = scenarioData;

    const events: TransformedCalendarEvent[] = [];
    const startDate = new Date();

    try {
      // 1. 킥오프 미팅
      events.push({
        id: `kickoff_${scenarioId}`,
        title: `${name} 킥오프 미팅`,
        date: this.getNextBusinessDay(startDate),
        time: '14:00',
        type: 'meeting',
        description: this.generateKickoffDescription(name, keyActions),
        priority,
        estimatedDuration: 60,
        attendees: this.getDefaultAttendees(priority),
        projectId: scenarioId,
        relatedScenario: scenarioId
      });

      // 2. 액션별 마일스톤 이벤트들
      const actionEvents = this.generateActionMilestones(
        scenarioId,
        keyActions,
        timeline,
        priority,
        startDate
      );
      events.push(...actionEvents);

      // 3. 중간 체크포인트들
      if (estimatedEffort >= 5 || timeline === '3개월' || timeline === '6개월') {
        const checkpoints = this.generateCheckpoints(
          scenarioId,
          name,
          timeline,
          priority,
          startDate
        );
        events.push(...checkpoints);
      }

      // 4. 최종 검토 미팅
      events.push({
        id: `review_${scenarioId}`,
        title: `${name} 결과 검토`,
        date: this.calculateFinalReviewDate(timeline, startDate),
        time: '15:00',
        type: 'review',
        description: this.generateReviewDescription(name, projectedScores),
        priority: priority === 'low' ? 'medium' : priority,
        estimatedDuration: 90,
        attendees: this.getReviewAttendees(priority),
        projectId: scenarioId,
        relatedScenario: scenarioId
      });

      // 5. 고위험 시나리오의 경우 추가 모니터링 이벤트
      if (this.isHighRiskScenario(projectedScores, priority)) {
        const monitoringEvents = this.generateMonitoringEvents(
          scenarioId,
          name,
          timeline,
          startDate
        );
        events.push(...monitoringEvents);
      }

      return events;

    } catch (error) {
      console.error('[EventTransformers] Error transforming scenario to calendar events:', error);
      return [];
    }
  }

  /**
   * 마일스톤 완료 → KPI 임팩트 변환
   */
  async milestoneToKPIImpact(milestoneData: BuildupMilestoneCompletedEvent['data']): Promise<TransformedKPIImpact> {
    const {
      projectId,
      milestoneId,
      milestoneName,
      completedAt,
      actualVsPlanned,
      kpiImpact
    } = milestoneData;

    // 타이밍 정확도에 따른 신뢰도 조정
    const timingAccuracy = this.calculateTimingAccuracy(actualVsPlanned.variance);
    const baseConfidence = 0.8;
    const adjustedConfidence = Math.min(baseConfidence + (timingAccuracy * 0.15), 0.95);

    // 지연/조기 완료에 따른 임팩트 조정
    const timingAdjustment = this.calculateTimingAdjustment(actualVsPlanned.variance);
    const adjustedImpact = this.adjustImpactForTiming(kpiImpact, timingAdjustment);

    return {
      sourceType: 'milestone',
      sourceId: milestoneId,
      sourceName: milestoneName,
      impactType: 'immediate',
      scoreAdjustments: adjustedImpact,
      confidence: adjustedConfidence,
      timestamp: completedAt,
      description: `마일스톤 '${milestoneName}' 완료 (${actualVsPlanned.variance}일 ${actualVsPlanned.variance > 0 ? '지연' : '조기'})`
    };
  }

  /**
   * 캘린더 이벤트 → V2 외부 요인 변환
   */
  async calendarToExternalFactor(calendarEventData: CalendarEventCreatedEvent['data']): Promise<TransformedExternalFactor> {
    const {
      eventId,
      title,
      date,
      type,
      priority,
      expectedImpact,
      projectId,
      relatedScenario
    } = calendarEventData;

    // 이벤트 타입별 임팩트 추정
    const estimatedImpact = expectedImpact || this.estimateEventImpact(title, type, priority);

    // 이벤트 타입별 신뢰도 계산
    const confidence = this.calculateEventConfidence(type, priority, date);

    return {
      id: eventId,
      type: this.mapCalendarEventTypeToExternalFactor(type),
      name: title,
      description: this.generateExternalFactorDescription(title, type, date),
      scheduledDate: date,
      expectedImpact: estimatedImpact,
      confidence,
      priority,
      metadata: {
        calendarEventId: eventId,
        eventType: type,
        projectId,
        relatedScenario,
        createdAt: new Date().toISOString()
      }
    };
  }

  /**
   * V2 시나리오 → Buildup 프로젝트 변환
   */
  async scenarioToProject(scenarioData: V2ScenarioSavedEvent['data']): Promise<TransformedProject> {
    const {
      scenarioId,
      name,
      keyActions,
      timeline,
      priority,
      projectedScores,
      estimatedEffort,
      expectedROI
    } = scenarioData;

    // 현재 점수와 예상 점수의 차이로 임팩트 계산
    const currentScores = await this.getCurrentKPIScores(); // 실제로는 V2 store에서 가져와야 함
    const expectedKPIImpact = this.calculateKPIImpactDifference(currentScores, projectedScores);

    // 액션들을 분석하여 마일스톤 생성
    const milestones = this.generateMilestonesFromActions(
      keyActions,
      timeline,
      expectedKPIImpact,
      priority
    );

    return {
      id: scenarioId,
      title: `${name} 실행 프로젝트`,
      description: this.generateProjectDescription(name, keyActions, expectedROI),
      phase: '계획',
      priority,
      estimatedDuration: timeline,
      expectedKPIImpact,
      keyActions,
      milestones,
      deadline: this.calculateProjectDeadline(timeline)
    };
  }

  /**
   * 프라이빗 헬퍼 메서드들
   */
  private getNextBusinessDay(fromDate: Date): string {
    const nextDay = new Date(fromDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // 주말 건너뛰기
    while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
      nextDay.setDate(nextDay.getDate() + 1);
    }

    return nextDay.toISOString().split('T')[0];
  }

  private generateKickoffDescription(scenarioName: string, keyActions: string[]): string {
    return `${scenarioName} 실행을 위한 킥오프 미팅

주요 논의사항:
${keyActions.map(action => `• ${action}`).join('\n')}

목표:
- 실행 계획 수립
- 역할 분담
- 일정 조율
- 성공 지표 정의`;
  }

  private generateActionMilestones(
    scenarioId: string,
    keyActions: string[],
    timeline: string,
    priority: 'high' | 'medium' | 'low',
    startDate: Date
  ): TransformedCalendarEvent[] {
    const milestones: TransformedCalendarEvent[] = [];
    const totalDays = this.getTimelineDays(timeline);
    const daysPerAction = Math.floor(totalDays / keyActions.length);

    keyActions.forEach((action, index) => {
      const milestoneDate = new Date(startDate);
      milestoneDate.setDate(milestoneDate.getDate() + (daysPerAction * (index + 1)));

      milestones.push({
        id: `milestone_${scenarioId}_${index}`,
        title: `마일스톤: ${action}`,
        date: milestoneDate.toISOString().split('T')[0],
        type: 'milestone',
        description: `${action} 완료 목표일\n\n진행률: ${Math.round(((index + 1) / keyActions.length) * 100)}%`,
        priority: priority === 'low' ? 'medium' : priority,
        projectId: scenarioId,
        relatedScenario: scenarioId
      });
    });

    return milestones;
  }

  private generateCheckpoints(
    scenarioId: string,
    scenarioName: string,
    timeline: string,
    priority: 'high' | 'medium' | 'low',
    startDate: Date
  ): TransformedCalendarEvent[] {
    const checkpoints: TransformedCalendarEvent[] = [];
    const totalDays = this.getTimelineDays(timeline);

    // 중간 체크포인트들 (25%, 50%, 75%)
    [0.25, 0.5, 0.75].forEach((percentage, index) => {
      const checkpointDate = new Date(startDate);
      checkpointDate.setDate(checkpointDate.getDate() + Math.floor(totalDays * percentage));

      checkpoints.push({
        id: `checkpoint_${scenarioId}_${index}`,
        title: `${scenarioName} 진행상황 체크 (${Math.round(percentage * 100)}%)`,
        date: checkpointDate.toISOString().split('T')[0],
        time: '16:00',
        type: 'review',
        description: `${scenarioName} 진행상황 점검\n- 목표 대비 진행률 확인\n- 이슈 및 리스크 검토\n- 필요시 계획 조정`,
        priority: 'medium',
        estimatedDuration: 45,
        projectId: scenarioId,
        relatedScenario: scenarioId
      });
    });

    return checkpoints;
  }

  private generateMonitoringEvents(
    scenarioId: string,
    scenarioName: string,
    timeline: string,
    startDate: Date
  ): TransformedCalendarEvent[] {
    const monitoring: TransformedCalendarEvent[] = [];
    const totalDays = this.getTimelineDays(timeline);

    // 주간 모니터링 (고위험 시나리오만)
    const weeklyIntervals = Math.min(Math.floor(totalDays / 7), 8); // 최대 8주

    for (let i = 1; i <= weeklyIntervals; i++) {
      const monitoringDate = new Date(startDate);
      monitoringDate.setDate(monitoringDate.getDate() + (i * 7));

      monitoring.push({
        id: `monitoring_${scenarioId}_week_${i}`,
        title: `${scenarioName} 위험도 모니터링`,
        date: monitoringDate.toISOString().split('T')[0],
        time: '10:00',
        type: 'review',
        description: `고위험 시나리오 모니터링\n- KPI 변화 추적\n- 위험 요소 재평가\n- 대응 방안 점검`,
        priority: 'high',
        estimatedDuration: 30,
        projectId: scenarioId,
        relatedScenario: scenarioId
      });
    }

    return monitoring;
  }

  private generateReviewDescription(scenarioName: string, projectedScores: Record<AxisKey, number>): string {
    const scoresSummary = Object.entries(projectedScores)
      .map(([axis, score]) => `${axis}: ${score}점`)
      .join(', ');

    return `${scenarioName} 실행 결과 최종 검토

검토 항목:
- 목표 대비 실제 성과 분석
- KPI 개선 효과 측정 (목표: ${scoresSummary})
- 학습한 인사이트 정리
- 향후 개선 방안 도출
- 성공 요인 및 실패 요인 분석`;
  }

  private isHighRiskScenario(projectedScores: Record<AxisKey, number>, priority: string): boolean {
    // 높은 변화폭을 가진 시나리오나 고우선순위 시나리오는 고위험으로 분류
    const maxScore = Math.max(...Object.values(projectedScores));
    const minScore = Math.min(...Object.values(projectedScores));
    const scoreRange = maxScore - minScore;

    return priority === 'high' || scoreRange > 30;
  }

  private calculateTimingAccuracy(varianceDays: number): number {
    const absVariance = Math.abs(varianceDays);

    if (absVariance === 0) return 1.0;      // 완벽
    if (absVariance <= 1) return 0.9;       // 매우 좋음
    if (absVariance <= 3) return 0.7;       // 좋음
    if (absVariance <= 7) return 0.5;       // 보통
    if (absVariance <= 14) return 0.3;      // 나쁨
    return 0.1;                             // 매우 나쁨
  }

  private calculateTimingAdjustment(varianceDays: number): number {
    // 조기 완료 시 긍정적 조정, 지연 시 부정적 조정
    if (varianceDays < 0) {
      // 조기 완료: 최대 10% 보너스
      return Math.min(Math.abs(varianceDays) * 0.02, 0.1);
    } else if (varianceDays > 0) {
      // 지연 완료: 최대 20% 페널티
      return -Math.min(varianceDays * 0.03, 0.2);
    }
    return 0;
  }

  private adjustImpactForTiming(
    kpiImpact: Partial<Record<AxisKey, number>>,
    timingAdjustment: number
  ): Partial<Record<AxisKey, number>> {
    const adjusted: Partial<Record<AxisKey, number>> = {};

    Object.entries(kpiImpact).forEach(([axis, impact]) => {
      const adjustedImpact = impact * (1 + timingAdjustment);
      adjusted[axis as AxisKey] = Math.round(adjustedImpact * 100) / 100;
    });

    return adjusted;
  }

  private estimateEventImpact(
    title: string,
    type: string,
    priority: string
  ): Partial<Record<AxisKey, number>> {
    const impact: Partial<Record<AxisKey, number>> = {};
    const basePriorityMultiplier = { high: 1.0, medium: 0.7, low: 0.4 };
    const multiplier = basePriorityMultiplier[priority as keyof typeof basePriorityMultiplier] || 0.5;

    // 제목 키워드 분석
    const titleLower = title.toLowerCase();

    if (titleLower.includes('런칭') || titleLower.includes('launch')) {
      impact.GO = 8 * multiplier;
      impact.PT = 5 * multiplier;
      impact.EC = 3 * multiplier;
    } else if (titleLower.includes('마케팅') || titleLower.includes('marketing')) {
      impact.GO = 6 * multiplier;
      impact.EC = 2 * multiplier;
    } else if (titleLower.includes('개발') || titleLower.includes('기술')) {
      impact.PT = 7 * multiplier;
      impact.TO = 3 * multiplier;
    } else if (titleLower.includes('팀') || titleLower.includes('채용')) {
      impact.PF = 6 * multiplier;
      impact.TO = 4 * multiplier;
    } else if (titleLower.includes('투자') || titleLower.includes('펀딩')) {
      impact.EC = 8 * multiplier;
      impact.GO = 4 * multiplier;
    }

    // 이벤트 타입별 기본 임팩트
    switch (type) {
      case 'launch':
        impact.GO = (impact.GO || 0) + 5 * multiplier;
        impact.PT = (impact.PT || 0) + 3 * multiplier;
        break;
      case 'milestone':
        // 기존 분석 결과 유지
        break;
      case 'deadline':
        // 마감일은 압박감을 주므로 운영에 부정적 영향
        impact.TO = (impact.TO || 0) - 2 * multiplier;
        break;
      case 'meeting':
        // 미팅은 일반적으로 미미한 영향
        break;
      case 'review':
        // 검토는 프로세스 개선에 도움
        impact.PF = (impact.PF || 0) + 2 * multiplier;
        break;
    }

    return impact;
  }

  private calculateEventConfidence(type: string, priority: string, scheduledDate: string): number {
    const typeConfidence = {
      launch: 0.9,
      milestone: 0.8,
      deadline: 0.7,
      meeting: 0.4,
      review: 0.5
    };

    const priorityMultiplier = {
      high: 1.2,
      medium: 1.0,
      low: 0.8
    };

    // 날짜가 가까울수록 신뢰도 증가
    const daysUntilEvent = Math.max(0, this.getDaysUntil(scheduledDate));
    const proximityMultiplier = daysUntilEvent <= 7 ? 1.1 : daysUntilEvent <= 30 ? 1.0 : 0.9;

    const baseConfidence = typeConfidence[type as keyof typeof typeConfidence] || 0.5;
    const priorityMult = priorityMultiplier[priority as keyof typeof priorityMultiplier] || 1.0;

    return Math.min(baseConfidence * priorityMult * proximityMultiplier, 1.0);
  }

  private mapCalendarEventTypeToExternalFactor(calendarEventType: string): TransformedExternalFactor['type'] {
    const mapping: { [key: string]: TransformedExternalFactor['type'] } = {
      meeting: 'scheduled_event',
      milestone: 'milestone_achieved',
      deadline: 'scheduled_event',
      review: 'scheduled_event',
      launch: 'scheduled_event'
    };

    return mapping[calendarEventType] || 'scheduled_event';
  }

  private generateExternalFactorDescription(title: string, type: string, date: string): string {
    const typeDescriptions = {
      meeting: '회의 일정',
      milestone: '마일스톤 달성 목표',
      deadline: '마감 일정',
      review: '검토 일정',
      launch: '런칭 이벤트'
    };

    const typeDesc = typeDescriptions[type as keyof typeof typeDescriptions] || '예정된 이벤트';

    return `${typeDesc}: ${title} (${date} 예정)`;
  }

  private async getCurrentKPIScores(): Promise<Record<AxisKey, number>> {
    // 실제 구현에서는 V2Store나 KPIContext에서 현재 점수를 가져와야 함
    return {
      GO: 65,
      EC: 70,
      PT: 75,
      PF: 68,
      TO: 72
    };
  }

  private calculateKPIImpactDifference(
    currentScores: Record<AxisKey, number>,
    projectedScores: Record<AxisKey, number>
  ): Partial<Record<AxisKey, number>> {
    const impact: Partial<Record<AxisKey, number>> = {};

    Object.entries(projectedScores).forEach(([axis, projectedScore]) => {
      const currentScore = currentScores[axis as AxisKey];
      const difference = projectedScore - currentScore;

      if (Math.abs(difference) >= 2) { // 2점 이상 차이나는 경우만
        impact[axis as AxisKey] = difference;
      }
    });

    return impact;
  }

  private generateMilestonesFromActions(
    keyActions: string[],
    timeline: string,
    expectedKPIImpact: Partial<Record<AxisKey, number>>,
    priority: 'high' | 'medium' | 'low'
  ): TransformedMilestone[] {
    const totalDays = this.getTimelineDays(timeline);
    const milestoneCount = Math.max(2, Math.ceil(keyActions.length / 2));

    return Array.from({ length: milestoneCount }, (_, index) => {
      const progressPercent = ((index + 1) / milestoneCount) * 100;
      const estimatedDays = Math.floor((totalDays * (index + 1)) / milestoneCount);

      return {
        id: `milestone_${Date.now()}_${index}`,
        name: `${Math.round(progressPercent)}% 완료 마일스톤`,
        estimatedDays,
        kpiImpact: this.distributeImpactAcrossMilestones(expectedKPIImpact, index + 1, milestoneCount),
        priority: priority === 'low' ? 'medium' : priority,
        dependencies: index > 0 ? [`milestone_${Date.now()}_${index - 1}`] : undefined
      };
    });
  }

  private distributeImpactAcrossMilestones(
    totalImpact: Partial<Record<AxisKey, number>>,
    milestoneIndex: number,
    totalMilestones: number
  ): Partial<Record<AxisKey, number>> {
    const distributed: Partial<Record<AxisKey, number>> = {};
    const progressRatio = milestoneIndex / totalMilestones;

    Object.entries(totalImpact).forEach(([axis, impact]) => {
      // 누적 방식: 각 마일스톤은 해당 진행률만큼의 임팩트
      distributed[axis as AxisKey] = Math.round(impact * progressRatio * 100) / 100;
    });

    return distributed;
  }

  private generateProjectDescription(name: string, keyActions: string[], expectedROI: number): string {
    return `${name} 실행을 위한 프로젝트

주요 액션:
${keyActions.map(action => `• ${action}`).join('\n')}

예상 ROI: ${expectedROI}%

이 프로젝트는 V2 시나리오 분석 결과를 바탕으로 자동 생성되었습니다.`;
  }

  private calculateProjectDeadline(timeline: string): string {
    const days = this.getTimelineDays(timeline);
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);
    return deadline.toISOString().split('T')[0];
  }

  private calculateFinalReviewDate(timeline: string, startDate: Date): string {
    const days = this.getTimelineDays(timeline);
    const reviewDate = new Date(startDate);
    reviewDate.setDate(reviewDate.getDate() + days + 3); // 타임라인 종료 3일 후
    return reviewDate.toISOString().split('T')[0];
  }

  private getTimelineDays(timeline: string): number {
    const timelineMap: { [key: string]: number } = {
      '1주': 7,
      '2주': 14,
      '1개월': 30,
      '2개월': 60,
      '3개월': 90,
      '6개월': 180
    };

    return timelineMap[timeline] || 30;
  }

  private getDaysUntil(dateString: string): number {
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getDefaultAttendees(priority: string): string[] {
    const defaultAttendees = ['team-lead', 'product-manager'];

    if (priority === 'high') {
      defaultAttendees.push('ceo', 'stakeholder');
    }

    return defaultAttendees;
  }

  private getReviewAttendees(priority: string): string[] {
    const reviewAttendees = ['team-lead', 'product-manager', 'analyst'];

    if (priority === 'high') {
      reviewAttendees.push('ceo', 'cto', 'stakeholders');
    } else if (priority === 'medium') {
      reviewAttendees.push('department-head');
    }

    return reviewAttendees;
  }
}