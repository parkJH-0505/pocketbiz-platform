/**
 * Buildup Context Adapter
 * BuildupContext와 이벤트 버스 간의 어댑터
 */

import { CentralEventBus } from '../EventBus';
import {
  BuildupEvent,
  BuildupMilestoneCompletedEvent,
  BaseEvent,
  EventHandler
} from '../types';
import type { AxisKey } from '../../../types/buildup.types';

export interface BuildupAdapterConfig {
  autoCreateFromV2: boolean;
  autoUpdateKPIFromMilestones: boolean;
  syncProgressWithCalendar: boolean;
}

export interface ProjectData {
  id: string;
  title: string;
  phase: string;
  progress: number; // 0-100
  deadline: string;
  kpiTarget?: Partial<Record<AxisKey, number>>;
  tasks: TaskData[];
  milestones: MilestoneData[];
}

export interface TaskData {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assignee?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  aiGenerated?: boolean;
}

export interface MilestoneData {
  id: string;
  name: string;
  dueDate: string;
  completed: boolean;
  completedDate?: string;
  kpiImpact?: Partial<Record<AxisKey, number>>;
  dependencies?: string[];
}

export class BuildupContextAdapter {
  private eventBus: CentralEventBus;
  private subscriptions: string[] = [];
  private config: BuildupAdapterConfig;
  private activeProjects: Map<string, ProjectData> = new Map();

  constructor(config: BuildupAdapterConfig = {
    autoCreateFromV2: true,
    autoUpdateKPIFromMilestones: true,
    syncProgressWithCalendar: true
  }) {
    this.eventBus = CentralEventBus.getInstance();
    this.config = config;
    this.setupSubscriptions();
  }

  private setupSubscriptions(): void {
    this.subscriptions = [
      // V2에서 오는 자동 프로젝트 생성 요청들
      this.eventBus.subscribe('buildup:auto-generate:project', this.handleAutoGenerateProject.bind(this), 1),

      // Buildup에서 발생하는 이벤트들
      this.eventBus.subscribe('buildup:project:created', this.handleProjectCreated.bind(this), 2),
      this.eventBus.subscribe('buildup:project:updated', this.handleProjectUpdated.bind(this), 2),
      this.eventBus.subscribe('buildup:milestone:completed', this.handleMilestoneCompleted.bind(this), 1),
      this.eventBus.subscribe('buildup:phase:changed', this.handlePhaseChanged.bind(this), 2),
      this.eventBus.subscribe('buildup:task:completed', this.handleTaskCompleted.bind(this), 3),

      // 캘린더와의 동기화
      this.eventBus.subscribe('buildup:calendar:event-added', this.handleCalendarEventAdded.bind(this), 3),
      this.eventBus.subscribe('buildup:calendar:event-removed', this.handleCalendarEventRemoved.bind(this), 3),
    ];
  }

  /**
   * V2에서 자동 프로젝트 생성
   */
  private async handleAutoGenerateProject(event: BaseEvent): Promise<void> {
    console.log('[BuildupAdapter] Auto-generating project:', event);

    if (!this.config.autoCreateFromV2) return;

    const {
      scenarioId,
      projectName,
      keyActions,
      priority,
      expectedKPIImpact,
      timeline,
      estimatedEffort
    } = event.data;

    // 프로젝트 데이터 구성
    const projectData: ProjectData = {
      id: scenarioId || `project_${Date.now()}`,
      title: projectName,
      phase: '1단계',
      progress: 0,
      deadline: this.calculateDeadline(timeline),
      kpiTarget: expectedKPIImpact,
      tasks: this.generateTasksFromActions(keyActions, priority),
      milestones: this.generateMilestonesFromActions(keyActions, timeline, expectedKPIImpact)
    };

    // 프로젝트 생성 실행
    await this.createProject(projectData, event.userId);

    // 생성된 프로젝트 정보를 V2에 피드백
    await this.eventBus.emit({
      type: 'v2:project:auto-created',
      source: 'buildup-auto',
      userId: event.userId,
      data: {
        projectId: projectData.id,
        projectName: projectData.title,
        estimatedDuration: timeline,
        taskCount: projectData.tasks.length,
        milestoneCount: projectData.milestones.length
      },
      metadata: {
        originalEvent: event.id,
        scenarioId
      }
    });

    // 고우선순위 프로젝트의 경우 즉시 시작 알림
    if (priority === 'high') {
      await this.eventBus.emit({
        type: 'notification:project:high-priority-created',
        source: 'buildup-auto',
        userId: event.userId,
        data: {
          projectName: projectData.title,
          deadline: projectData.deadline,
          immediateActions: projectData.tasks.filter(task => task.dueDate === this.getTomorrowDate()),
          expectedImpact: expectedKPIImpact
        }
      });
    }
  }

  /**
   * 프로젝트 생성 시 처리
   */
  private async handleProjectCreated(event: BaseEvent): Promise<void> {
    console.log('[BuildupAdapter] Processing project created:', event);

    const { projectId, projectName, phase, expectedKPIImpact, deadline } = event.data;

    // 프로젝트 정보 저장
    this.activeProjects.set(projectId, {
      id: projectId,
      title: projectName,
      phase,
      progress: 0,
      deadline,
      kpiTarget: expectedKPIImpact,
      tasks: [],
      milestones: []
    });

    // V2에 새 프로젝트 정보 전달
    if (expectedKPIImpact) {
      await this.eventBus.emit({
        type: 'v2:external-factor:added',
        source: 'buildup-auto',
        userId: event.userId,
        data: {
          factorType: 'project_started',
          projectId,
          name: projectName,
          startDate: new Date().toISOString().split('T')[0],
          expectedCompletion: deadline,
          expectedImpact: expectedKPIImpact,
          confidence: 0.6 // 프로젝트 시작 단계의 신뢰도
        }
      });
    }

    // 캘린더와 동기화 (프로젝트 시작 미팅 등)
    if (this.config.syncProgressWithCalendar) {
      await this.eventBus.emit({
        type: 'calendar:auto-generate:project-events',
        source: 'buildup-auto',
        userId: event.userId,
        data: {
          projectId,
          projectName,
          startDate: new Date().toISOString().split('T')[0],
          deadline,
          phase
        }
      });
    }
  }

  /**
   * 프로젝트 업데이트 시 처리
   */
  private async handleProjectUpdated(event: BaseEvent): Promise<void> {
    console.log('[BuildupAdapter] Processing project updated:', event);

    const { projectId, changes, newProgress, newPhase, newDeadline } = event.data;

    const project = this.activeProjects.get(projectId);
    if (!project) return;

    // 프로젝트 정보 업데이트
    if (newProgress !== undefined) project.progress = newProgress;
    if (newPhase) project.phase = newPhase;
    if (newDeadline) project.deadline = newDeadline;

    // 진행률 변화가 있는 경우 V2에 알림
    if (changes.includes('progress')) {
      const progressImpact = this.calculateProgressImpact(project, newProgress);

      if (progressImpact && Object.keys(progressImpact).length > 0) {
        await this.eventBus.emit({
          type: 'v2:external-factor:updated',
          source: 'buildup-auto',
          userId: event.userId,
          data: {
            factorId: projectId,
            changes: {
              progress: newProgress,
              partialImpact: progressImpact
            },
            confidence: this.calculateProgressConfidence(newProgress)
          }
        });
      }
    }

    // 단계 변경 시 중요 알림
    if (changes.includes('phase')) {
      await this.eventBus.emit({
        type: 'notification:project:phase-changed',
        source: 'buildup-auto',
        userId: event.userId,
        data: {
          projectName: project.title,
          oldPhase: event.data.oldPhase,
          newPhase,
          progress: project.progress
        }
      });
    }
  }

  /**
   * 마일스톤 완료 시 처리 (핵심 기능)
   */
  private async handleMilestoneCompleted(event: BuildupMilestoneCompletedEvent): Promise<void> {
    console.log('[BuildupAdapter] Processing milestone completed:', event);

    if (!this.config.autoUpdateKPIFromMilestones) return;

    const {
      projectId,
      milestoneId,
      milestoneName,
      completedAt,
      actualVsPlanned,
      kpiImpact,
      nextMilestone
    } = event.data;

    // V2 KPI 점수에 실제 영향 반영
    if (kpiImpact && Object.keys(kpiImpact).length > 0) {
      await this.eventBus.emit({
        type: 'v2:kpi:milestone-impact',
        source: 'buildup-auto',
        userId: event.userId,
        data: {
          milestoneId,
          milestoneName,
          projectId,
          completedAt,
          kpiImpact,
          timingAccuracy: this.calculateTimingAccuracy(actualVsPlanned),
          confidence: 0.9 // 완료된 마일스톤은 높은 신뢰도
        }
      });
    }

    // 프로젝트 진행률 업데이트
    const project = this.activeProjects.get(projectId);
    if (project) {
      const completedMilestones = project.milestones.filter(m => m.completed).length + 1;
      const totalMilestones = project.milestones.length;
      const newProgress = Math.min((completedMilestones / totalMilestones) * 100, 100);

      project.progress = newProgress;

      // 프로젝트 완료 체크
      if (newProgress >= 100) {
        await this.handleProjectCompletion(project, event.userId);
      }
    }

    // 캘린더에 마일스톤 달성 이벤트 전달
    await this.eventBus.emit({
      type: 'calendar:milestone:achieved',
      source: 'buildup-auto',
      userId: event.userId,
      data: {
        milestoneId,
        milestoneName,
        projectId,
        actualDate: completedAt,
        expectedImpact: kpiImpact
      }
    });

    // 성취 알림
    await this.eventBus.emit({
      type: 'notification:achievement:milestone',
      source: 'buildup-auto',
      userId: event.userId,
      data: {
        milestoneName,
        projectName: project?.title || '프로젝트',
        achievedDate: completedAt,
        onSchedule: actualVsPlanned.variance <= 0,
        kpiBonus: kpiImpact
      }
    });

    // 다음 마일스톤이 있는 경우 준비 알림
    if (nextMilestone) {
      await this.eventBus.emit({
        type: 'notification:milestone:next-due',
        source: 'buildup-auto',
        userId: event.userId,
        data: {
          milestoneId: nextMilestone.id,
          milestoneName: nextMilestone.name,
          dueDate: nextMilestone.dueDate,
          projectName: project?.title || '프로젝트'
        }
      });
    }
  }

  /**
   * 프로젝트 완료 처리
   */
  private async handleProjectCompletion(project: ProjectData, userId?: string): Promise<void> {
    console.log('[BuildupAdapter] Processing project completion:', project);

    // V2에 프로젝트 완료 및 최종 KPI 임팩트 전달
    if (project.kpiTarget) {
      await this.eventBus.emit({
        type: 'v2:external-factor:completed',
        source: 'buildup-auto',
        userId,
        data: {
          factorId: project.id,
          factorType: 'project_completed',
          name: project.title,
          completedAt: new Date().toISOString(),
          finalImpact: project.kpiTarget,
          confidence: 0.95 // 완료된 프로젝트는 매우 높은 신뢰도
        }
      });
    }

    // 프로젝트 완료 축하 및 성과 요약 알림
    await this.eventBus.emit({
      type: 'notification:achievement:project-completed',
      source: 'buildup-auto',
      userId,
      data: {
        projectName: project.title,
        completedAt: new Date().toISOString(),
        finalProgress: project.progress,
        kpiAchievement: project.kpiTarget,
        duration: this.calculateProjectDuration(project),
        taskCount: project.tasks.length,
        milestoneCount: project.milestones.length
      }
    });

    // 완료된 프로젝트는 활성 목록에서 제거
    this.activeProjects.delete(project.id);
  }

  /**
   * 단계 변경 시 처리
   */
  private async handlePhaseChanged(event: BaseEvent): Promise<void> {
    console.log('[BuildupAdapter] Processing phase changed:', event);

    const { projectId, oldPhase, newPhase, progress } = event.data;

    const project = this.activeProjects.get(projectId);
    if (project) {
      project.phase = newPhase;

      // 중요한 단계 변경(예: MVP → 베타, 베타 → 런칭)인 경우 KPI에 영향
      const phaseImpact = this.calculatePhaseImpact(oldPhase, newPhase, project);

      if (phaseImpact && Object.keys(phaseImpact).length > 0) {
        await this.eventBus.emit({
          type: 'v2:external-factor:phase-transition',
          source: 'buildup-auto',
          userId: event.userId,
          data: {
            projectId,
            oldPhase,
            newPhase,
            phaseImpact,
            confidence: this.calculatePhaseTransitionConfidence(oldPhase, newPhase)
          }
        });
      }
    }
  }

  /**
   * 태스크 완료 시 처리
   */
  private async handleTaskCompleted(event: BaseEvent): Promise<void> {
    console.log('[BuildupAdapter] Processing task completed:', event);

    const { projectId, taskId, taskName, completedAt, actualHours, estimatedHours } = event.data;

    const project = this.activeProjects.get(projectId);
    if (project) {
      // 태스크 완료율 업데이트
      const completedTasks = project.tasks.filter(t => t.status === 'completed').length + 1;
      const totalTasks = project.tasks.length;
      const taskProgress = (completedTasks / totalTasks) * 100;

      // 프로젝트 전체 진행률에 반영
      const newProgress = Math.min(taskProgress, 100);
      if (newProgress > project.progress) {
        project.progress = newProgress;

        // V2에 프로젝트 진행상황 업데이트
        await this.eventBus.emit({
          type: 'buildup:project:updated',
          source: 'buildup-auto',
          userId: event.userId,
          data: {
            projectId,
            changes: ['progress'],
            newProgress,
            completedTask: taskName
          }
        });
      }
    }

    // 작업 효율성 분석 (예상 vs 실제 시간)
    if (actualHours && estimatedHours) {
      const efficiency = estimatedHours / actualHours;
      if (efficiency < 0.8) { // 예상보다 20% 이상 오래 걸린 경우
        await this.eventBus.emit({
          type: 'notification:efficiency:task-overrun',
          source: 'buildup-auto',
          userId: event.userId,
          data: {
            taskName,
            projectName: project?.title || '프로젝트',
            estimatedHours,
            actualHours,
            overrun: actualHours - estimatedHours
          }
        });
      }
    }
  }

  /**
   * 캘린더 이벤트와의 동기화 처리
   */
  private async handleCalendarEventAdded(event: BaseEvent): Promise<void> {
    console.log('[BuildupAdapter] Processing calendar event added:', event);

    const { projectId, calendarEventId, eventType, scheduledDate, title } = event.data;

    const project = this.activeProjects.get(projectId);
    if (project) {
      // 프로젝트 관련 중요 일정이 추가된 경우 팀에 알림
      if (['milestone', 'deadline', 'review'].includes(eventType)) {
        await this.eventBus.emit({
          type: 'notification:project:schedule-added',
          source: 'buildup-auto',
          userId: event.userId,
          data: {
            projectName: project.title,
            eventTitle: title,
            eventType,
            scheduledDate,
            calendarEventId
          }
        });
      }
    }
  }

  private async handleCalendarEventRemoved(event: BaseEvent): Promise<void> {
    console.log('[BuildupAdapter] Processing calendar event removed:', event);

    const { projectId, calendarEventId } = event.data;

    // 중요한 일정이 취소된 경우 알림
    const project = this.activeProjects.get(projectId);
    if (project) {
      await this.eventBus.emit({
        type: 'notification:project:schedule-removed',
        source: 'buildup-auto',
        userId: event.userId,
        data: {
          projectName: project.title,
          calendarEventId
        }
      });
    }
  }

  /**
   * 실제 프로젝트 생성 (BuildupContext와 연동)
   */
  private async createProject(projectData: ProjectData, userId?: string): Promise<void> {
    console.log('[BuildupAdapter] Creating project:', projectData);

    // BuildupContext의 실제 함수를 호출하여 프로젝트 생성
    // 실제 구현에서는 BuildupContext의 메서드를 호출해야 함

    this.activeProjects.set(projectData.id, projectData);

    // 프로젝트 생성 완료 이벤트 발행
    await this.eventBus.emit({
      type: 'buildup:project:created',
      source: 'buildup-auto',
      userId,
      data: {
        projectId: projectData.id,
        projectName: projectData.title,
        phase: projectData.phase,
        expectedKPIImpact: projectData.kpiTarget,
        deadline: projectData.deadline,
        taskCount: projectData.tasks.length,
        milestoneCount: projectData.milestones.length
      }
    });
  }

  /**
   * BuildupContext에서 이벤트를 발행하는 메서드들 (BuildupContext에서 호출)
   */
  async emitMilestoneCompleted(milestoneData: {
    projectId: string;
    milestoneId: string;
    milestoneName: string;
    completedAt: string;
    actualVsPlanned: {
      plannedDate: string;
      actualDate: string;
      variance: number;
    };
    kpiImpact: Partial<Record<AxisKey, number>>;
    nextMilestone?: {
      id: string;
      name: string;
      dueDate: string;
    };
  }, userId?: string): Promise<void> {
    const event: BuildupMilestoneCompletedEvent = {
      id: '',
      type: 'buildup:milestone:completed',
      source: 'buildup-manual',
      timestamp: 0,
      userId,
      data: milestoneData
    };

    await this.eventBus.emit(event);
  }

  async emitProjectUpdated(updateData: {
    projectId: string;
    changes: string[];
    newProgress?: number;
    newPhase?: string;
    newDeadline?: string;
    oldPhase?: string;
  }, userId?: string): Promise<void> {
    await this.eventBus.emit({
      type: 'buildup:project:updated',
      source: 'buildup-manual',
      userId,
      data: updateData
    });
  }

  async emitTaskCompleted(taskData: {
    projectId: string;
    taskId: string;
    taskName: string;
    completedAt: string;
    actualHours?: number;
    estimatedHours?: number;
  }, userId?: string): Promise<void> {
    await this.eventBus.emit({
      type: 'buildup:task:completed',
      source: 'buildup-manual',
      userId,
      data: taskData
    });
  }

  /**
   * 유틸리티 메서드들
   */
  private generateTasksFromActions(keyActions: string[], priority: 'high' | 'medium' | 'low'): TaskData[] {
    return keyActions.map((action, index) => ({
      id: `task_${Date.now()}_${index}`,
      name: action,
      status: 'pending' as const,
      dueDate: this.calculateTaskDueDate(index, keyActions.length, priority),
      estimatedHours: this.estimateTaskHours(action, priority),
      aiGenerated: true
    }));
  }

  private generateMilestonesFromActions(
    keyActions: string[],
    timeline: string,
    expectedKPIImpact?: Partial<Record<AxisKey, number>>
  ): MilestoneData[] {
    const milestoneCount = Math.max(2, Math.ceil(keyActions.length / 3));
    const milestones: MilestoneData[] = [];

    for (let i = 0; i < milestoneCount; i++) {
      const progressPercent = ((i + 1) / milestoneCount) * 100;
      milestones.push({
        id: `milestone_${Date.now()}_${i}`,
        name: `${Math.round(progressPercent)}% 완료 마일스톤`,
        dueDate: this.calculateMilestoneDueDate(timeline, i + 1, milestoneCount),
        completed: false,
        kpiImpact: this.distributeMilestoneImpact(expectedKPIImpact, i + 1, milestoneCount)
      });
    }

    return milestones;
  }

  private calculateDeadline(timeline: string): string {
    const timelineMap: { [key: string]: number } = {
      '1주': 7,
      '2주': 14,
      '1개월': 30,
      '2개월': 60,
      '3개월': 90,
      '6개월': 180
    };

    const days = timelineMap[timeline] || 30;
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);
    return deadline.toISOString().split('T')[0];
  }

  private calculateTaskDueDate(taskIndex: number, totalTasks: number, priority: 'high' | 'medium' | 'low'): string {
    const urgencyDays = priority === 'high' ? 3 : priority === 'medium' ? 7 : 14;
    const progressiveDelay = Math.floor((taskIndex / totalTasks) * urgencyDays);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + urgencyDays + progressiveDelay);
    return dueDate.toISOString().split('T')[0];
  }

  private estimateTaskHours(action: string, priority: 'high' | 'medium' | 'low'): number {
    const baseHours = 8;
    const complexityMultiplier = action.length > 50 ? 1.5 : 1;
    const priorityMultiplier = priority === 'high' ? 1.2 : priority === 'medium' ? 1 : 0.8;

    return Math.ceil(baseHours * complexityMultiplier * priorityMultiplier);
  }

  private calculateMilestoneDueDate(timeline: string, milestoneNumber: number, totalMilestones: number): string {
    const totalDays = this.getTimelineDays(timeline);
    const daysPer마일스톤 = totalDays / totalMilestones;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Math.ceil(daysPer마일스톤 * milestoneNumber));
    return dueDate.toISOString().split('T')[0];
  }

  private distributeMilestoneImpact(
    totalImpact?: Partial<Record<AxisKey, number>>,
    milestoneNumber: number,
    totalMilestones: number
  ): Partial<Record<AxisKey, number>> {
    if (!totalImpact) return {};

    const distribution: Partial<Record<AxisKey, number>> = {};
    const progressRatio = milestoneNumber / totalMilestones;

    Object.entries(totalImpact).forEach(([axis, impact]) => {
      distribution[axis as AxisKey] = Math.round(impact * progressRatio * 100) / 100;
    });

    return distribution;
  }

  private getTimelineDays(timeline: string): number {
    const timelineMap: { [key: string]: number } = {
      '1주': 7, '2주': 14, '1개월': 30, '2개월': 60, '3개월': 90, '6개월': 180
    };
    return timelineMap[timeline] || 30;
  }

  private getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  private calculateProgressImpact(project: ProjectData, newProgress: number): Partial<Record<AxisKey, number>> {
    if (!project.kpiTarget) return {};

    const progressDiff = (newProgress - project.progress) / 100;
    const impact: Partial<Record<AxisKey, number>> = {};

    Object.entries(project.kpiTarget).forEach(([axis, totalImpact]) => {
      const incrementalImpact = totalImpact * progressDiff;
      if (Math.abs(incrementalImpact) >= 0.5) {
        impact[axis as AxisKey] = Math.round(incrementalImpact * 100) / 100;
      }
    });

    return impact;
  }

  private calculateProgressConfidence(progress: number): number {
    // 진행률이 높을수록 신뢰도 증가
    return Math.min(0.3 + (progress / 100) * 0.6, 0.9);
  }

  private calculateTimingAccuracy(actualVsPlanned: { variance: number }): number {
    const dayVariance = Math.abs(actualVsPlanned.variance);

    if (dayVariance <= 1) return 1.0; // 완벽
    if (dayVariance <= 3) return 0.8; // 좋음
    if (dayVariance <= 7) return 0.6; // 보통
    return 0.4; // 개선 필요
  }

  private calculatePhaseImpact(oldPhase: string, newPhase: string, project: ProjectData): Partial<Record<AxisKey, number>> {
    // 단계별 중요도 매핑
    const phaseImportance: { [key: string]: number } = {
      '아이디어': 0.1,
      '계획': 0.2,
      'MVP': 0.4,
      '베타': 0.7,
      '런칭': 0.9,
      '성장': 1.0
    };

    const oldImportance = phaseImportance[oldPhase] || 0.5;
    const newImportance = phaseImportance[newPhase] || 0.5;
    const importanceGain = newImportance - oldImportance;

    if (Math.abs(importanceGain) < 0.2 || !project.kpiTarget) return {};

    const impact: Partial<Record<AxisKey, number>> = {};
    Object.entries(project.kpiTarget).forEach(([axis, totalImpact]) => {
      const phaseImpact = totalImpact * importanceGain * 0.3; // 30% 정도만 단계 변경에서 반영
      if (Math.abs(phaseImpact) >= 1) {
        impact[axis as AxisKey] = Math.round(phaseImpact * 100) / 100;
      }
    });

    return impact;
  }

  private calculatePhaseTransitionConfidence(oldPhase: string, newPhase: string): number {
    // 중요한 단계 전환일수록 높은 신뢰도
    const importantTransitions = ['MVP', '베타', '런칭'];

    if (importantTransitions.includes(newPhase)) return 0.8;
    return 0.6;
  }

  private calculateProjectDuration(project: ProjectData): number {
    // 프로젝트 기간 계산 (일 단위)
    const createdDate = new Date(); // 실제로는 프로젝트 생성일을 저장해야 함
    const completedDate = new Date();

    return Math.ceil((completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * 정리
   */
  dispose(): void {
    this.subscriptions.forEach(subId => {
      this.eventBus.unsubscribe(subId);
    });
    this.subscriptions = [];
    this.activeProjects.clear();
  }
}