/**
 * @fileoverview State Snapshot 관리 시스템
 * @description Phase transition 실행 전후의 상태 스냅샷 관리 및 롤백 기능
 * @author PocketCompany
 * @since 2025-01-19
 */

import type { Project, PhaseTransitionEvent } from '../types/buildup.types';
import type { UnifiedSchedule } from '../types/schedule.types';

/**
 * 프로젝트 상태 스냅샷
 */
export interface ProjectStateSnapshot {
  id: string;
  projectId: string;
  timestamp: Date;
  operation: string;
  trigger: string;

  // 스냅샷 데이터
  project: Project;
  relatedSchedules: UnifiedSchedule[];
  phaseTransitionEvents: PhaseTransitionEvent[];

  // 메타데이터
  version: number;
  tags: string[];
  description?: string;
  userId?: string;
}

/**
 * 롤백 결과
 */
export interface RollbackResult {
  success: boolean;
  snapshotId: string;
  restoredData: {
    project?: Project;
    schedules?: UnifiedSchedule[];
    events?: PhaseTransitionEvent[];
  };
  error?: Error;
  duration: number;
}

/**
 * 스냅샷 통계
 */
export interface SnapshotStatistics {
  totalSnapshots: number;
  projectSnapshots: Record<string, number>;
  averageSize: number;
  oldestSnapshot: Date;
  newestSnapshot: Date;
  rollbackCount: number;
  successfulRollbacks: number;
}

/**
 * State Snapshot Manager 클래스
 */
export class StateSnapshotManager {
  private snapshots: Map<string, ProjectStateSnapshot> = new Map();
  private maxSnapshots: number = 50; // 최대 보관 스냅샷 수
  private rollbackHistory: RollbackResult[] = [];

  constructor(maxSnapshots?: number) {
    if (maxSnapshots) {
      this.maxSnapshots = maxSnapshots;
    }

    // 주기적 정리 (30분마다)
    setInterval(() => this.cleanup(), 30 * 60 * 1000);
  }

  /**
   * 상태 스냅샷 생성
   */
  async createSnapshot(
    projectId: string,
    operation: string,
    trigger: string,
    options?: {
      description?: string;
      tags?: string[];
      userId?: string;
    }
  ): Promise<string> {
    const snapshotId = `snapshot_${projectId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // 현재 상태 수집
      const project = await this.getCurrentProject(projectId);
      const relatedSchedules = await this.getRelatedSchedules(projectId);
      const phaseTransitionEvents = await this.getPhaseTransitionEvents(projectId);

      const snapshot: ProjectStateSnapshot = {
        id: snapshotId,
        projectId,
        timestamp: new Date(),
        operation,
        trigger,
        project: JSON.parse(JSON.stringify(project)), // 깊은 복사
        relatedSchedules: JSON.parse(JSON.stringify(relatedSchedules)),
        phaseTransitionEvents: JSON.parse(JSON.stringify(phaseTransitionEvents)),
        version: 1,
        tags: options?.tags || [],
        description: options?.description,
        userId: options?.userId
      };

      this.snapshots.set(snapshotId, snapshot);

      // 스냅샷 수 제한 관리
      this.enforceSnapshotLimit();

      console.log(`📸 Created state snapshot for project ${projectId}: ${snapshotId}`);
      console.log(`📊 Snapshot contains: ${relatedSchedules.length} schedules, ${phaseTransitionEvents.length} events`);

      return snapshotId;

    } catch (error) {
      console.error(`❌ Failed to create snapshot for project ${projectId}:`, error);
      throw new Error(`Snapshot creation failed: ${error.message}`);
    }
  }

  /**
   * 스냅샷으로 롤백
   */
  async rollbackToSnapshot(snapshotId: string): Promise<RollbackResult> {
    const startTime = Date.now();

    try {
      const snapshot = this.snapshots.get(snapshotId);
      if (!snapshot) {
        throw new Error(`Snapshot not found: ${snapshotId}`);
      }

      console.log(`🔄 Rolling back to snapshot ${snapshotId} for project ${snapshot.projectId}`);

      // BuildupContext 상태 복원
      await this.restoreProjectState(snapshot.project);

      // ScheduleContext 상태 복원
      await this.restoreScheduleState(snapshot.projectId, snapshot.relatedSchedules);

      // PhaseTransitionEvents 복원
      await this.restorePhaseTransitionEvents(snapshot.projectId, snapshot.phaseTransitionEvents);

      const result: RollbackResult = {
        success: true,
        snapshotId,
        restoredData: {
          project: snapshot.project,
          schedules: snapshot.relatedSchedules,
          events: snapshot.phaseTransitionEvents
        },
        duration: Date.now() - startTime
      };

      this.rollbackHistory.push(result);

      console.log(`✅ Successfully rolled back to snapshot ${snapshotId} (${result.duration}ms)`);
      return result;

    } catch (error) {
      const result: RollbackResult = {
        success: false,
        snapshotId,
        restoredData: {},
        error: error as Error,
        duration: Date.now() - startTime
      };

      this.rollbackHistory.push(result);

      console.error(`❌ Rollback failed for snapshot ${snapshotId}:`, error);
      return result;
    }
  }

  /**
   * 현재 프로젝트 상태 가져오기
   */
  private async getCurrentProject(projectId: string): Promise<Project> {
    if (window.buildupContext?.projects) {
      const project = window.buildupContext.projects.find(p => p.id === projectId);
      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }
      return project;
    }
    throw new Error('BuildupContext not available');
  }

  /**
   * 관련 스케줄 가져오기
   */
  private async getRelatedSchedules(projectId: string): Promise<UnifiedSchedule[]> {
    if (window.scheduleContext?.getSchedulesByProject) {
      return window.scheduleContext.getSchedulesByProject(projectId);
    }
    return [];
  }

  /**
   * Phase transition 이벤트 가져오기
   */
  private async getPhaseTransitionEvents(projectId: string): Promise<PhaseTransitionEvent[]> {
    if (window.buildupContext?.phaseTransitionEvents) {
      return window.buildupContext.phaseTransitionEvents.filter(
        event => event.projectId === projectId
      );
    }
    return [];
  }

  /**
   * 프로젝트 상태 복원
   */
  private async restoreProjectState(project: Project): Promise<void> {
    if (window.buildupContext?.setProjects) {
      const currentProjects = window.buildupContext.projects || [];
      const updatedProjects = currentProjects.map(p =>
        p.id === project.id ? project : p
      );

      // 프로젝트가 존재하지 않으면 추가
      if (!currentProjects.find(p => p.id === project.id)) {
        updatedProjects.push(project);
      }

      window.buildupContext.setProjects(updatedProjects);
      console.log(`🔧 Restored project state for ${project.id}: phase=${project.phase}`);
    }
  }

  /**
   * 스케줄 상태 복원
   */
  private async restoreScheduleState(projectId: string, schedules: UnifiedSchedule[]): Promise<void> {
    if (window.scheduleContext) {
      // 기존 프로젝트 스케줄 삭제
      const existingSchedules = window.scheduleContext.getSchedulesByProject?.(projectId) || [];
      for (const schedule of existingSchedules) {
        await window.scheduleContext.deleteSchedule?.(schedule.id);
      }

      // 스냅샷 스케줄 복원
      if (window.scheduleContext.createSchedulesBatch) {
        await window.scheduleContext.createSchedulesBatch(schedules);
        console.log(`🔧 Restored ${schedules.length} schedules for project ${projectId}`);
      }
    }
  }

  /**
   * Phase transition 이벤트 복원
   */
  private async restorePhaseTransitionEvents(
    projectId: string,
    events: PhaseTransitionEvent[]
  ): Promise<void> {
    if (window.buildupContext?.setPhaseTransitionEvents) {
      const currentEvents = window.buildupContext.phaseTransitionEvents || [];

      // 해당 프로젝트의 기존 이벤트 제거
      const filteredEvents = currentEvents.filter(event => event.projectId !== projectId);

      // 스냅샷 이벤트 추가
      const restoredEvents = [...filteredEvents, ...events];

      window.buildupContext.setPhaseTransitionEvents(restoredEvents);
      console.log(`🔧 Restored ${events.length} phase transition events for project ${projectId}`);
    }
  }

  /**
   * 스냅샷 정리 (오래된 것 삭제)
   */
  private cleanup(): void {
    const snapshots = Array.from(this.snapshots.values());
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24시간

    // 24시간 이상 된 스냅샷 삭제
    const oldSnapshots = snapshots.filter(snapshot =>
      now - snapshot.timestamp.getTime() > maxAge
    );

    oldSnapshots.forEach(snapshot => {
      this.snapshots.delete(snapshot.id);
    });

    if (oldSnapshots.length > 0) {
      console.log(`🧹 Cleaned up ${oldSnapshots.length} old snapshots`);
    }

    // 최대 개수 제한 적용
    this.enforceSnapshotLimit();
  }

  /**
   * 스냅샷 수 제한 적용
   */
  private enforceSnapshotLimit(): void {
    const snapshots = Array.from(this.snapshots.values());

    if (snapshots.length > this.maxSnapshots) {
      // 가장 오래된 것부터 삭제
      const sortedSnapshots = snapshots.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );

      const toDelete = sortedSnapshots.slice(0, snapshots.length - this.maxSnapshots);
      toDelete.forEach(snapshot => {
        this.snapshots.delete(snapshot.id);
      });

      console.log(`📏 Enforced snapshot limit: removed ${toDelete.length} snapshots`);
    }
  }

  /**
   * 스냅샷 목록 조회
   */
  getSnapshots(projectId?: string): ProjectStateSnapshot[] {
    const snapshots = Array.from(this.snapshots.values());

    if (projectId) {
      return snapshots.filter(snapshot => snapshot.projectId === projectId);
    }

    return snapshots;
  }

  /**
   * 특정 스냅샷 조회
   */
  getSnapshot(snapshotId: string): ProjectStateSnapshot | undefined {
    return this.snapshots.get(snapshotId);
  }

  /**
   * 스냅샷 삭제
   */
  deleteSnapshot(snapshotId: string): boolean {
    const deleted = this.snapshots.delete(snapshotId);
    if (deleted) {
      console.log(`🗑️ Deleted snapshot: ${snapshotId}`);
    }
    return deleted;
  }

  /**
   * 프로젝트의 모든 스냅샷 삭제
   */
  deleteProjectSnapshots(projectId: string): number {
    const snapshots = this.getSnapshots(projectId);
    snapshots.forEach(snapshot => {
      this.snapshots.delete(snapshot.id);
    });

    console.log(`🗑️ Deleted ${snapshots.length} snapshots for project ${projectId}`);
    return snapshots.length;
  }

  /**
   * 롤백 히스토리 조회
   */
  getRollbackHistory(): RollbackResult[] {
    return [...this.rollbackHistory];
  }

  /**
   * 통계 조회
   */
  getStatistics(): SnapshotStatistics {
    const snapshots = Array.from(this.snapshots.values());
    const projectSnapshots: Record<string, number> = {};

    let totalSize = 0;
    let oldestTimestamp = Date.now();
    let newestTimestamp = 0;

    snapshots.forEach(snapshot => {
      // 프로젝트별 카운트
      projectSnapshots[snapshot.projectId] = (projectSnapshots[snapshot.projectId] || 0) + 1;

      // 크기 계산 (대략적)
      const snapshotSize = JSON.stringify(snapshot).length;
      totalSize += snapshotSize;

      // 시간 범위
      const timestamp = snapshot.timestamp.getTime();
      oldestTimestamp = Math.min(oldestTimestamp, timestamp);
      newestTimestamp = Math.max(newestTimestamp, timestamp);
    });

    const rollbackHistory = this.getRollbackHistory();
    const successfulRollbacks = rollbackHistory.filter(r => r.success).length;

    return {
      totalSnapshots: snapshots.length,
      projectSnapshots,
      averageSize: snapshots.length > 0 ? totalSize / snapshots.length : 0,
      oldestSnapshot: new Date(oldestTimestamp),
      newestSnapshot: new Date(newestTimestamp),
      rollbackCount: rollbackHistory.length,
      successfulRollbacks
    };
  }
}

/**
 * 전역 스냅샷 매니저 인스턴스
 */
export const globalSnapshotManager = new StateSnapshotManager();

/**
 * 스냅샷 매니저를 전역 객체에 등록 (디버깅용)
 */
if (typeof window !== 'undefined') {
  (window as any).snapshotManager = globalSnapshotManager;
}