/**
 * @fileoverview Cascade 연산 시스템
 * @description Sprint 4 Phase 4-4: 프로젝트 삭제 시 관련 스케줄 정리 및 연관 데이터 처리
 * @author PocketCompany
 * @since 2025-01-19
 */

import type { Project, PhaseTransitionEvent } from '../types/buildup.types';
import type { UnifiedSchedule, BuildupProjectMeeting } from '../types/schedule.types';
import { EdgeCaseLogger } from './edgeCaseScenarios';

/**
 * Cascade 연산 결과
 */
export interface CascadeOperationResult {
  success: boolean;
  operation: 'delete' | 'archive' | 'transfer';
  projectId: string;
  affectedData: {
    schedules: string[];           // 영향받은 스케줄 ID들
    phaseTransitionEvents: string[]; // 영향받은 이벤트 ID들
    snapshots: string[];           // 영향받은 스냅샷 ID들
    queueItems: string[];          // 영향받은 큐 아이템들
  };
  warnings: CascadeWarning[];
  errors: CascadeError[];
  duration: number;
  backupData?: {
    project: Project;
    relatedData: any[];
    backupId: string;
    timestamp: Date;
  };
}

/**
 * Cascade 경고
 */
export interface CascadeWarning {
  code: string;
  message: string;
  affectedItem: string;
  suggestion: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Cascade 에러
 */
export interface CascadeError {
  code: string;
  message: string;
  operation: string;
  itemId: string;
  error: string;
  recoverable: boolean;
}

/**
 * 삭제 확인 정보
 */
export interface DeletionConfirmation {
  projectId: string;
  projectTitle: string;
  impactAnalysis: {
    totalSchedules: number;
    upcomingMeetings: number;
    phaseTransitionEvents: number;
    connectedSystems: string[];
    estimatedDataSize: string;
  };
  risks: {
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
    recommendations: string[];
  };
  alternatives: {
    archive: boolean;
    transfer: boolean;
    partial: boolean;
  };
}

/**
 * 전송 옵션
 */
export interface TransferOptions {
  targetProjectId: string;
  transferSchedules: boolean;
  transferEvents: boolean;
  transferSnapshots: boolean;
  mergeStrategy: 'append' | 'replace' | 'merge';
}

/**
 * Cascade 연산 매니저
 */
export class CascadeOperationManager {

  /**
   * 프로젝트 삭제 전 영향 분석
   */
  static async analyzeProjectDeletionImpact(
    projectId: string,
    projects: Project[],
    schedules: UnifiedSchedule[]
  ): Promise<DeletionConfirmation> {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    // 관련 스케줄 조회
    const relatedSchedules = schedules.filter(s =>
      s.type === 'buildup_project' &&
      (s as BuildupProjectMeeting).projectId === projectId
    );

    // 예정된 미팅 확인
    const now = new Date();
    const upcomingMeetings = relatedSchedules.filter(s =>
      new Date(s.startDateTime) > now
    );

    // Phase transition 이벤트 확인
    const phaseTransitionEvents = this.getPhaseTransitionEventCount(projectId);

    // 연결된 시스템 확인
    const connectedSystems = this.getConnectedSystems(project, relatedSchedules);

    // 데이터 크기 추정
    const estimatedDataSize = this.estimateDataSize(project, relatedSchedules);

    // 위험도 평가
    const risks = this.assessDeletionRisks(project, relatedSchedules, upcomingMeetings);

    const confirmation: DeletionConfirmation = {
      projectId,
      projectTitle: project.title,
      impactAnalysis: {
        totalSchedules: relatedSchedules.length,
        upcomingMeetings: upcomingMeetings.length,
        phaseTransitionEvents,
        connectedSystems,
        estimatedDataSize
      },
      risks,
      alternatives: {
        archive: true,  // 항상 가능
        transfer: projects.length > 1, // 다른 프로젝트가 있을 때만
        partial: relatedSchedules.length > 0 // 관련 데이터가 있을 때만
      }
    };

    EdgeCaseLogger.log('EC_CASCADE_001', {
      projectId,
      impactAnalysis: confirmation.impactAnalysis,
      riskLevel: risks.level
    });

    return confirmation;
  }

  /**
   * 프로젝트 완전 삭제 (Cascade)
   */
  static async deleteProjectCascade(
    projectId: string,
    options?: {
      createBackup?: boolean;
      forceDelete?: boolean;
      confirmationId?: string;
    }
  ): Promise<CascadeOperationResult> {
    const startTime = Date.now();

    const result: CascadeOperationResult = {
      success: false,
      operation: 'delete',
      projectId,
      affectedData: {
        schedules: [],
        phaseTransitionEvents: [],
        snapshots: [],
        queueItems: []
      },
      warnings: [],
      errors: [],
      duration: 0
    };

    try {
      console.log(`🗑️ Starting cascade deletion for project ${projectId}...`);

      // 1. 백업 생성 (옵션)
      if (options?.createBackup) {
        const backup = await this.createProjectBackup(projectId);
        if (backup) {
          result.backupData = backup;
          console.log(`💾 Backup created: ${backup.backupId}`);
        }
      }

      // 2. 관련 스케줄 삭제
      await this.deleteRelatedSchedules(projectId, result);

      // 3. Phase transition 이벤트 삭제
      await this.deletePhaseTransitionEvents(projectId, result);

      // 4. 스냅샷 삭제
      await this.deleteProjectSnapshots(projectId, result);

      // 5. 큐에서 대기 중인 작업 제거
      await this.removeQueueItems(projectId, result);

      // 6. 프로젝트 자체 삭제
      await this.deleteProjectEntity(projectId, result);

      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;

      const logData = {
        projectId,
        success: result.success,
        duration: result.duration,
        affectedSchedules: result.affectedData.schedules.length,
        affectedEvents: result.affectedData.phaseTransitionEvents.length,
        errors: result.errors.length
      };

      if (result.success) {
        console.log(`✅ Cascade deletion completed for project ${projectId}`);
        EdgeCaseLogger.log('EC_CASCADE_002', logData);
      } else {
        console.error(`❌ Cascade deletion failed for project ${projectId}`);
        EdgeCaseLogger.log('EC_CASCADE_003', { ...logData, errors: result.errors });
      }

    } catch (error) {
      result.errors.push({
        code: 'CASCADE_001',
        message: `Cascade deletion failed: ${error.message}`,
        operation: 'delete_project_cascade',
        itemId: projectId,
        error: error.stack || error.message,
        recoverable: true
      });

      result.duration = Date.now() - startTime;

      EdgeCaseLogger.log('EC_CASCADE_004', {
        projectId,
        error: error.message,
        duration: result.duration
      });
    }

    return result;
  }

  /**
   * 프로젝트 아카이브 (삭제 대신 보관)
   */
  static async archiveProject(
    projectId: string,
    archiveReason?: string
  ): Promise<CascadeOperationResult> {
    const startTime = Date.now();

    const result: CascadeOperationResult = {
      success: false,
      operation: 'archive',
      projectId,
      affectedData: {
        schedules: [],
        phaseTransitionEvents: [],
        snapshots: [],
        queueItems: []
      },
      warnings: [],
      errors: [],
      duration: 0
    };

    try {
      console.log(`📦 Starting project archival for ${projectId}...`);

      // 1. 프로젝트 상태를 'archived'로 변경
      await this.updateProjectStatus(projectId, 'archived', result);

      // 2. 관련 스케줄을 'archived' 상태로 변경
      await this.archiveRelatedSchedules(projectId, result);

      // 3. Phase transition 이벤트에 아카이브 마킹
      await this.markPhaseTransitionEventsArchived(projectId, result);

      // 4. 큐에서 대기 중인 작업 제거 (아카이브된 프로젝트는 처리 안함)
      await this.removeQueueItems(projectId, result);

      // 5. 아카이브 메타데이터 생성
      await this.createArchiveMetadata(projectId, archiveReason, result);

      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;

      if (result.success) {
        console.log(`✅ Project archival completed for ${projectId}`);
        EdgeCaseLogger.log('EC_CASCADE_005', {
          projectId,
          duration: result.duration,
          reason: archiveReason
        });
      }

    } catch (error) {
      result.errors.push({
        code: 'CASCADE_002',
        message: `Project archival failed: ${error.message}`,
        operation: 'archive_project',
        itemId: projectId,
        error: error.stack || error.message,
        recoverable: true
      });

      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * 프로젝트 데이터 전송
   */
  static async transferProjectData(
    sourceProjectId: string,
    transferOptions: TransferOptions
  ): Promise<CascadeOperationResult> {
    const startTime = Date.now();

    const result: CascadeOperationResult = {
      success: false,
      operation: 'transfer',
      projectId: sourceProjectId,
      affectedData: {
        schedules: [],
        phaseTransitionEvents: [],
        snapshots: [],
        queueItems: []
      },
      warnings: [],
      errors: [],
      duration: 0
    };

    try {
      console.log(`🔄 Starting data transfer from ${sourceProjectId} to ${transferOptions.targetProjectId}...`);

      // 1. 스케줄 전송
      if (transferOptions.transferSchedules) {
        await this.transferSchedules(sourceProjectId, transferOptions, result);
      }

      // 2. 이벤트 전송
      if (transferOptions.transferEvents) {
        await this.transferPhaseTransitionEvents(sourceProjectId, transferOptions, result);
      }

      // 3. 스냅샷 전송
      if (transferOptions.transferSnapshots) {
        await this.transferSnapshots(sourceProjectId, transferOptions, result);
      }

      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;

      if (result.success) {
        console.log(`✅ Data transfer completed from ${sourceProjectId} to ${transferOptions.targetProjectId}`);
        EdgeCaseLogger.log('EC_CASCADE_006', {
          sourceProjectId,
          targetProjectId: transferOptions.targetProjectId,
          duration: result.duration,
          transferOptions
        });
      }

    } catch (error) {
      result.errors.push({
        code: 'CASCADE_003',
        message: `Data transfer failed: ${error.message}`,
        operation: 'transfer_project_data',
        itemId: sourceProjectId,
        error: error.stack || error.message,
        recoverable: true
      });

      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * 관련 스케줄 삭제
   */
  private static async deleteRelatedSchedules(
    projectId: string,
    result: CascadeOperationResult
  ): Promise<void> {
    if (window.scheduleContext?.getSchedulesByProject) {
      const relatedSchedules = window.scheduleContext.getSchedulesByProject(projectId);

      for (const schedule of relatedSchedules) {
        try {
          await window.scheduleContext.deleteSchedule?.(schedule.id);
          result.affectedData.schedules.push(schedule.id);
          console.log(`🗑️ Deleted schedule: ${schedule.id}`);
        } catch (error) {
          result.errors.push({
            code: 'CASCADE_004',
            message: `Failed to delete schedule: ${schedule.id}`,
            operation: 'delete_schedule',
            itemId: schedule.id,
            error: error.message,
            recoverable: true
          });
        }
      }
    }
  }

  /**
   * Phase transition 이벤트 삭제
   */
  private static async deletePhaseTransitionEvents(
    projectId: string,
    result: CascadeOperationResult
  ): Promise<void> {
    if (window.buildupContext?.phaseTransitionEvents) {
      const projectEvents = window.buildupContext.phaseTransitionEvents.filter(
        event => event.projectId === projectId
      );

      // BuildupContext에서 이벤트 제거
      const filteredEvents = window.buildupContext.phaseTransitionEvents.filter(
        event => event.projectId !== projectId
      );

      window.buildupContext.setPhaseTransitionEvents?.(filteredEvents);

      result.affectedData.phaseTransitionEvents = projectEvents.map(e => e.id);
      console.log(`🗑️ Deleted ${projectEvents.length} phase transition events`);
    }
  }

  /**
   * 프로젝트 스냅샷 삭제
   */
  private static async deleteProjectSnapshots(
    projectId: string,
    result: CascadeOperationResult
  ): Promise<void> {
    if (window.snapshotManager?.deleteProjectSnapshots) {
      const deletedCount = window.snapshotManager.deleteProjectSnapshots(projectId);
      result.affectedData.snapshots = Array(deletedCount).fill(0).map((_, i) => `snapshot_${projectId}_${i}`);
      console.log(`🗑️ Deleted ${deletedCount} snapshots`);
    }
  }

  /**
   * 큐 아이템 제거
   */
  private static async removeQueueItems(
    projectId: string,
    result: CascadeOperationResult
  ): Promise<void> {
    if (window.transitionQueue?.clearProjectQueue) {
      const removedItems = window.transitionQueue.clearProjectQueue(projectId);
      result.affectedData.queueItems = removedItems.map(item => item.id || `queue_${Date.now()}`);
      console.log(`🗑️ Removed ${removedItems.length} queue items`);
    }
  }

  /**
   * 프로젝트 엔티티 삭제
   */
  private static async deleteProjectEntity(
    projectId: string,
    result: CascadeOperationResult
  ): Promise<void> {
    if (window.buildupContext?.setProjects) {
      const currentProjects = window.buildupContext.projects || [];
      const updatedProjects = currentProjects.filter(p => p.id !== projectId);

      window.buildupContext.setProjects(updatedProjects);
      console.log(`🗑️ Deleted project entity: ${projectId}`);
    }
  }

  /**
   * 프로젝트 백업 생성
   */
  private static async createProjectBackup(projectId: string): Promise<any> {
    if (window.buildupContext?.projects && window.scheduleContext?.getSchedulesByProject) {
      const project = window.buildupContext.projects.find(p => p.id === projectId);
      const relatedSchedules = window.scheduleContext.getSchedulesByProject(projectId);

      const backupId = `backup_${projectId}_${Date.now()}`;

      return {
        project,
        relatedData: relatedSchedules,
        backupId,
        timestamp: new Date()
      };
    }
    return null;
  }

  /**
   * 기타 헬퍼 메서드들
   */
  private static getPhaseTransitionEventCount(projectId: string): number {
    if (window.buildupContext?.phaseTransitionEvents) {
      return window.buildupContext.phaseTransitionEvents.filter(
        event => event.projectId === projectId
      ).length;
    }
    return 0;
  }

  private static getConnectedSystems(project: Project, schedules: UnifiedSchedule[]): string[] {
    const systems: string[] = ['BuildupContext'];

    if (schedules.length > 0) {
      systems.push('ScheduleContext');
    }

    if (window.snapshotManager) {
      systems.push('SnapshotManager');
    }

    if (window.transitionQueue) {
      systems.push('TransitionQueue');
    }

    return systems;
  }

  private static estimateDataSize(project: Project, schedules: UnifiedSchedule[]): string {
    const projectSize = JSON.stringify(project).length;
    const schedulesSize = JSON.stringify(schedules).length;
    const totalBytes = projectSize + schedulesSize;

    if (totalBytes < 1024) return `${totalBytes} bytes`;
    if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
    return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private static assessDeletionRisks(
    project: Project,
    schedules: UnifiedSchedule[],
    upcomingMeetings: UnifiedSchedule[]
  ): { level: 'low' | 'medium' | 'high' | 'critical'; factors: string[]; recommendations: string[] } {
    const factors: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // 예정된 미팅이 있는 경우
    if (upcomingMeetings.length > 0) {
      factors.push(`${upcomingMeetings.length}개의 예정된 미팅이 있습니다`);
      recommendations.push('예정된 미팅을 먼저 취소하거나 다른 프로젝트로 이동하세요');
      riskLevel = upcomingMeetings.length > 3 ? 'high' : 'medium';
    }

    // 활성 프로젝트인 경우
    if (project.phase && !['completed', 'cancelled'].includes(project.phase)) {
      factors.push('활성 상태의 프로젝트입니다');
      recommendations.push('프로젝트를 완료하거나 아카이브하는 것을 고려하세요');
      riskLevel = riskLevel === 'low' ? 'medium' : 'high';
    }

    // 많은 데이터가 연결된 경우
    if (schedules.length > 10) {
      factors.push('많은 스케줄 데이터가 연결되어 있습니다');
      recommendations.push('데이터 백업을 생성하거나 부분적으로 이전하세요');
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    }

    return { level: riskLevel, factors, recommendations };
  }

  // 아카이브 관련 메서드들 (구현 생략)
  private static async updateProjectStatus(projectId: string, status: string, result: CascadeOperationResult): Promise<void> {
    // 구현 필요
  }

  private static async archiveRelatedSchedules(projectId: string, result: CascadeOperationResult): Promise<void> {
    // 구현 필요
  }

  private static async markPhaseTransitionEventsArchived(projectId: string, result: CascadeOperationResult): Promise<void> {
    // 구현 필요
  }

  private static async createArchiveMetadata(projectId: string, reason: string | undefined, result: CascadeOperationResult): Promise<void> {
    // 구현 필요
  }

  // 전송 관련 메서드들 (구현 생략)
  private static async transferSchedules(sourceProjectId: string, options: TransferOptions, result: CascadeOperationResult): Promise<void> {
    // 구현 필요
  }

  private static async transferPhaseTransitionEvents(sourceProjectId: string, options: TransferOptions, result: CascadeOperationResult): Promise<void> {
    // 구현 필요
  }

  private static async transferSnapshots(sourceProjectId: string, options: TransferOptions, result: CascadeOperationResult): Promise<void> {
    // 구현 필요
  }
}