/**
 * Buildup Ecosystem Connector
 * BuildupContext와 이벤트 생태계 간의 커넥터
 */

import { CentralEventBus } from '../EventBus';
import { V2SystemAdapter } from '../adapters/V2Adapter';
import type {
  BaseEvent,
  BuildupAutoGenerateProjectEvent,
  BuildupMilestoneCompletedEvent
} from '../types';
import type {
  Project,
  Meeting,
  AxisKey
} from '../../../types/buildup.types';

export interface BuildupContextBridge {
  createProject: (data: Partial<Project>) => void;
  updateProject: (projectId: string, data: Partial<Project>) => void;
  getProjects: () => Project[];
  addMeetingToProject: (projectId: string, meeting: Meeting) => void;
  updateProjectMeeting: (projectId: string, meetingId: string, updates: Partial<Meeting>) => void;
  calculateProjectProgress: (project: Project) => {
    phaseProgress: number;
    deliverableProgress: number;
    overallProgress: number;
    currentPhase: string;
    nextPhase: string | null;
  };
}

/**
 * BuildupContext와 이벤트 생태계를 연결하는 커넥터
 */
export class BuildupEcosystemConnector {
  private eventBus: CentralEventBus;
  private v2Adapter: V2SystemAdapter;
  private buildupBridge: BuildupContextBridge | null = null;
  private subscriptions: string[] = [];

  constructor() {
    this.eventBus = CentralEventBus.getInstance();
    this.v2Adapter = new V2SystemAdapter();
    this.setupSubscriptions();
  }

  /**
   * BuildupContext와 연결
   */
  connectBuildupContext(bridge: BuildupContextBridge): void {
    this.buildupBridge = bridge;
    console.log('[BuildupEcosystemConnector] Connected to BuildupContext');
  }

  /**
   * 이벤트 구독 설정
   */
  private setupSubscriptions(): void {
    this.subscriptions = [
      // V2에서 생성된 자동 프로젝트 처리
      this.eventBus.subscribe(
        'buildup:auto-generate:project',
        this.handleAutoGenerateProject.bind(this),
        1
      ),

      // 마일스톤 완료 시 V2 KPI 업데이트
      this.eventBus.subscribe(
        'buildup:milestone:completed',
        this.handleMilestoneCompleted.bind(this),
        2
      ),

      // 프로젝트 상태 변경 시 처리
      this.eventBus.subscribe(
        'buildup:project:status-changed',
        this.handleProjectStatusChanged.bind(this),
        2
      ),

      // 프로젝트 단계 전환 시 처리
      this.eventBus.subscribe(
        'buildup:project:phase-transitioned',
        this.handlePhaseTransitioned.bind(this),
        2
      )
    ];
  }

  /**
   * V2 시나리오/추천사항으로부터 자동 프로젝트 생성
   */
  private async handleAutoGenerateProject(event: BuildupAutoGenerateProjectEvent): Promise<void> {
    if (!this.buildupBridge) {
      console.warn('[BuildupEcosystemConnector] BuildupContext not connected');
      return;
    }

    const {
      scenarioId,
      projectName,
      keyActions,
      priority,
      expectedKPIImpact,
      timeline,
      estimatedEffort
    } = event.data;

    try {
      // 프로젝트 데이터 구성
      const newProject: Partial<Project> = {
        id: `v2-project-${Date.now()}`,
        title: projectName,
        description: `V2 시나리오/추천사항에서 자동 생성된 프로젝트\n시나리오 ID: ${scenarioId}`,
        status: 'active',
        phase: 'planning',
        priority: priority === 'high' ? 'urgent' : priority === 'medium' ? 'normal' : 'low',

        // 예상 효과를 description에 포함
        expectedOutcome: this.formatExpectedKPIImpact(expectedKPIImpact),

        // 타임라인 설정
        startDate: new Date().toISOString(),
        endDate: this.calculateEndDate(timeline),

        // 키 액션들을 deliverables로 변환
        deliverables: keyActions.map((action, index) => ({
          id: `deliverable-${index + 1}`,
          name: action,
          dueDate: this.calculateDeliverableDate(timeline, index, keyActions.length),
          status: 'pending',
          priority: index < 2 ? 'high' : 'medium'
        })),

        // 기본 팀 정보
        team: {
          pm: {
            id: 'pm-v2-auto',
            name: 'V2 Auto PM',
            email: 'v2-auto@example.com',
            role: 'PM'
          },
          members: []
        },

        // 메타데이터
        tags: ['v2-generated', 'auto-project', priority],
        metadata: {
          sourceType: 'v2-scenario',
          originalScenarioId: scenarioId,
          generatedAt: new Date().toISOString(),
          estimatedEffort
        }
      };

      // 프로젝트 생성
      this.buildupBridge.createProject(newProject);

      // 킥오프 미팅 자동 생성
      setTimeout(() => {
        if (this.buildupBridge && newProject.id) {
          const kickoffMeeting: Meeting = {
            id: `kickoff-${Date.now()}`,
            type: 'buildup_project',
            date: this.getNextWorkingDay().toISOString(),
            time: '14:00',
            agenda: `${projectName} 프로젝트 킥오프`,
            notes: `주요 액션 아이템: ${keyActions.slice(0, 3).join(', ')}`,
            attendees: ['pm-v2-auto'],
            status: 'scheduled',
            duration: 60,
            meetingLink: 'https://meet.google.com/auto-generated'
          };

          this.buildupBridge.addMeetingToProject(newProject.id, kickoffMeeting);
        }
      }, 1000);

      console.log(`[BuildupEcosystemConnector] Generated project: ${projectName}`);

      // V2에게 성공 알림
      await this.eventBus.emit({
        type: 'buildup:generation:success',
        source: 'buildup-connector',
        userId: event.userId,
        data: {
          scenarioId,
          projectId: newProject.id,
          projectName
        }
      });

    } catch (error) {
      console.error('[BuildupEcosystemConnector] Error generating project:', error);

      // V2에게 실패 알림
      await this.eventBus.emit({
        type: 'buildup:generation:failed',
        source: 'buildup-connector',
        userId: event.userId,
        data: {
          scenarioId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  /**
   * 마일스톤 완료 시 V2 KPI 업데이트
   */
  private async handleMilestoneCompleted(event: BuildupMilestoneCompletedEvent): Promise<void> {
    const { projectId, milestoneId, kpiImpact, completedBy } = event.data;

    if (!kpiImpact || Object.keys(kpiImpact).length === 0) {
      console.log(`[BuildupEcosystemConnector] No KPI impact for milestone ${milestoneId}`);
      return;
    }

    try {
      // 현재 점수 (Mock - 실제로는 V2에서 가져와야 함)
      const currentScores: Record<AxisKey, number> = {
        GO: 65, EC: 70, PT: 75, PF: 68, TO: 72
      };

      // 새로운 점수 계산
      const newScores: Record<AxisKey, number> = { ...currentScores };
      Object.entries(kpiImpact).forEach(([axis, impact]) => {
        newScores[axis as AxisKey] = Math.max(0, Math.min(100, currentScores[axis as AxisKey] + impact));
      });

      // V2 어댑터를 통해 KPI 업데이트 발행
      await this.v2Adapter.emitKPIUpdated({
        previousScores: currentScores,
        currentScores: newScores,
        changes: kpiImpact,
        triggers: [`프로젝트 마일스톤 완료: ${projectId}/${milestoneId}`, `완료자: ${completedBy}`],
        confidence: 0.9
      }, event.userId);

      console.log(`[BuildupEcosystemConnector] Forwarded milestone completion to V2: ${milestoneId}`);

    } catch (error) {
      console.error('[BuildupEcosystemConnector] Error handling milestone completion:', error);
    }
  }

  /**
   * 프로젝트 상태 변경 처리
   */
  private async handleProjectStatusChanged(event: BaseEvent): Promise<void> {
    const { projectId, oldStatus, newStatus, reason } = event.data;

    // 프로젝트 완료 시 성과 분석
    if (newStatus === 'completed') {
      await this.analyzeProjectCompletion(projectId, event.userId);
    }

    // 프로젝트 중단 시 리스크 분석
    if (newStatus === 'cancelled' || newStatus === 'on_hold') {
      await this.analyzeProjectRisk(projectId, oldStatus, newStatus, reason, event.userId);
    }

    console.log(`[BuildupEcosystemConnector] Project ${projectId} status: ${oldStatus} → ${newStatus}`);
  }

  /**
   * 프로젝트 단계 전환 처리
   */
  private async handlePhaseTransitioned(event: BaseEvent): Promise<void> {
    const { projectId, fromPhase, toPhase, triggeredBy } = event.data;

    // 단계별 자동 액션 실행
    await this.executePhaseTransitionActions(projectId, fromPhase, toPhase, triggeredBy);

    console.log(`[BuildupEcosystemConnector] Project ${projectId} phase: ${fromPhase} → ${toPhase}`);
  }

  /**
   * BuildupContext에서 이벤트 발행 (BuildupContext에서 호출)
   */
  async reportMilestoneCompleted(
    projectId: string,
    milestoneId: string,
    kpiImpact: Partial<Record<AxisKey, number>>,
    completedBy: string,
    userId?: string
  ): Promise<void> {
    await this.eventBus.emit({
      type: 'buildup:milestone:completed',
      source: 'buildup-manual',
      userId,
      data: {
        projectId,
        milestoneId,
        kpiImpact,
        completedBy,
        completedAt: new Date()
      }
    });
  }

  async reportProjectStatusChanged(
    projectId: string,
    oldStatus: string,
    newStatus: string,
    reason?: string,
    userId?: string
  ): Promise<void> {
    await this.eventBus.emit({
      type: 'buildup:project:status-changed',
      source: 'buildup-manual',
      userId,
      data: {
        projectId,
        oldStatus,
        newStatus,
        reason,
        changedAt: new Date()
      }
    });
  }

  /**
   * 유틸리티 메서드들
   */
  private formatExpectedKPIImpact(impact: Partial<Record<AxisKey, number>>): string {
    if (!impact || Object.keys(impact).length === 0) {
      return '예상 효과: 미정';
    }

    const effects = Object.entries(impact)
      .map(([axis, value]) => `${axis}: ${value > 0 ? '+' : ''}${value}점`)
      .join(', ');

    return `예상 KPI 효과: ${effects}`;
  }

  private calculateEndDate(timeline: string): string {
    const now = new Date();
    const timelineMap: Record<string, number> = {
      '1주': 7,
      '2주': 14,
      '1개월': 30,
      '2개월': 60,
      '3개월': 90,
      '6개월': 180
    };

    const days = timelineMap[timeline] || 30;
    now.setDate(now.getDate() + days);
    return now.toISOString();
  }

  private calculateDeliverableDate(timeline: string, index: number, total: number): string {
    const now = new Date();
    const timelineMap: Record<string, number> = {
      '1주': 7,
      '2주': 14,
      '1개월': 30,
      '2개월': 60,
      '3개월': 90,
      '6개월': 180
    };

    const totalDays = timelineMap[timeline] || 30;
    const daysPerDeliverable = totalDays / total;
    const deliverableDays = Math.floor((index + 1) * daysPerDeliverable);

    now.setDate(now.getDate() + deliverableDays);
    return now.toISOString();
  }

  private getNextWorkingDay(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 주말이면 다음 월요일로
    const dayOfWeek = tomorrow.getDay();
    if (dayOfWeek === 0) { // 일요일
      tomorrow.setDate(tomorrow.getDate() + 1);
    } else if (dayOfWeek === 6) { // 토요일
      tomorrow.setDate(tomorrow.getDate() + 2);
    }

    return tomorrow;
  }

  private async analyzeProjectCompletion(projectId: string, userId?: string): Promise<void> {
    if (!this.buildupBridge) return;

    const projects = this.buildupBridge.getProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) return;

    // 프로젝트 성과 분석 이벤트 발행
    await this.eventBus.emit({
      type: 'v2:project:completion-analysis',
      source: 'buildup-auto',
      userId,
      data: {
        projectId,
        projectName: project.title,
        completedAt: new Date(),
        deliverableCount: project.deliverables?.length || 0,
        duration: this.calculateProjectDuration(project),
        successRate: this.calculateSuccessRate(project)
      }
    });
  }

  private async analyzeProjectRisk(
    projectId: string,
    oldStatus: string,
    newStatus: string,
    reason?: string,
    userId?: string
  ): Promise<void> {
    // 프로젝트 리스크 분석 이벤트 발행
    await this.eventBus.emit({
      type: 'v2:project:risk-analysis',
      source: 'buildup-auto',
      userId,
      data: {
        projectId,
        statusChange: { from: oldStatus, to: newStatus },
        reason,
        riskLevel: newStatus === 'cancelled' ? 'high' : 'medium',
        analyzedAt: new Date()
      }
    });
  }

  private async executePhaseTransitionActions(
    projectId: string,
    fromPhase: string,
    toPhase: string,
    triggeredBy: string
  ): Promise<void> {
    // 단계별 자동 액션 정의
    const phaseActions: Record<string, () => void> = {
      'planning': () => {
        // 기획 단계 진입 시 자동 액션
        console.log(`[BuildupEcosystemConnector] Planning phase actions for ${projectId}`);
      },
      'design': () => {
        // 디자인 단계 진입 시 자동 액션
        console.log(`[BuildupEcosystemConnector] Design phase actions for ${projectId}`);
      },
      'execution': () => {
        // 실행 단계 진입 시 자동 액션
        console.log(`[BuildupEcosystemConnector] Execution phase actions for ${projectId}`);
      },
      'review': () => {
        // 검토 단계 진입 시 자동 액션
        console.log(`[BuildupEcosystemConnector] Review phase actions for ${projectId}`);
      }
    };

    const action = phaseActions[toPhase];
    if (action) {
      action();
    }
  }

  private calculateProjectDuration(project: Project): number {
    if (!project.startDate) return 0;

    const startDate = new Date(project.startDate);
    const endDate = project.endDate ? new Date(project.endDate) : new Date();
    return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateSuccessRate(project: Project): number {
    const deliverables = project.deliverables || [];
    if (deliverables.length === 0) return 100;

    const completed = deliverables.filter(d => d.status === 'completed').length;
    return Math.round((completed / deliverables.length) * 100);
  }

  /**
   * 연결 상태 확인
   */
  isConnected(): boolean {
    return this.buildupBridge !== null;
  }

  /**
   * 통계 정보
   */
  getConnectionStats() {
    return {
      connected: this.isConnected(),
      subscriptions: this.subscriptions.length,
      eventBusHealthy: this.eventBus.isHealthy()
    };
  }

  /**
   * 정리
   */
  dispose(): void {
    this.subscriptions.forEach(subId => {
      this.eventBus.unsubscribe(subId);
    });
    this.subscriptions = [];
    this.buildupBridge = null;
    this.v2Adapter.dispose();
  }
}

// 글로벌 인스턴스 생성
export const buildupEcosystemConnector = new BuildupEcosystemConnector();