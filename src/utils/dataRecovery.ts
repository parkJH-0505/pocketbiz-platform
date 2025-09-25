/**
 * @fileoverview 데이터 복구 시스템
 * @description Sprint 4 Phase 4-4: 데이터 불일치 자동 복구 및 시스템 복원
 * @author PocketCompany
 * @since 2025-01-19
 */

import type { Project, PhaseTransitionEvent } from '../types/buildup.types';
import type { UnifiedSchedule, BuildupProjectMeeting } from '../types/schedule.types';
import { ValidationManager } from './dataValidation';
import { dataConverter } from './dataConverters';
import { EdgeCaseLogger } from './edgeCaseScenarios';

/**
 * 데이터 불일치 유형
 */
export type InconsistencyType =
  | 'orphan_schedule'      // 연결된 프로젝트가 없는 스케줄
  | 'missing_schedule'     // 프로젝트에는 있지만 스케줄에는 없는 미팅
  | 'duplicate_meeting'    // 중복된 미팅
  | 'invalid_phase'        // 잘못된 프로젝트 단계
  | 'broken_reference'     // 깨진 참조
  | 'timestamp_mismatch'   // 시간 불일치
  | 'metadata_corruption'; // 메타데이터 손상

/**
 * 복구 전략
 */
export type RecoveryStrategy =
  | 'auto_fix'        // 자동 수정
  | 'merge_data'      // 데이터 병합
  | 'remove_orphan'   // 고아 데이터 제거
  | 'recreate_missing' // 누락 데이터 재생성
  | 'manual_review'   // 수동 검토 필요
  | 'rollback';       // 롤백

/**
 * 데이터 불일치 정보
 */
export interface DataInconsistency {
  id: string;
  type: InconsistencyType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedItems: {
    projects?: string[];
    schedules?: string[];
    events?: string[];
  };
  detectedAt: Date;
  suggestedStrategy: RecoveryStrategy;
  autoFixable: boolean;
  evidence: any; // 불일치를 증명하는 데이터
}

/**
 * 복구 결과
 */
export interface RecoveryResult {
  success: boolean;
  inconsistencyId: string;
  strategy: RecoveryStrategy;
  actions: RecoveryAction[];
  errors: RecoveryError[];
  warnings: string[];
  duration: number;
  newState?: any; // 복구 후 새로운 상태
}

/**
 * 복구 액션
 */
export interface RecoveryAction {
  type: 'create' | 'update' | 'delete' | 'merge';
  target: 'project' | 'schedule' | 'event';
  itemId: string;
  details: string;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
}

/**
 * 복구 에러
 */
export interface RecoveryError {
  code: string;
  message: string;
  action: string;
  itemId: string;
  error: string;
  recoverable: boolean;
}

/**
 * 시스템 건강성 리포트
 */
export interface SystemHealthReport {
  timestamp: Date;
  overallHealth: 'healthy' | 'warning' | 'critical' | 'failure';
  inconsistencies: DataInconsistency[];
  statistics: {
    totalProjects: number;
    totalSchedules: number;
    totalEvents: number;
    orphanSchedules: number;
    missingSchedules: number;
    duplicateMeetings: number;
    corruptedData: number;
  };
  recommendations: string[];
  autoFixable: number;
  manualReviewRequired: number;
}

/**
 * 데이터 복구 매니저
 */
export class DataRecoveryManager {

  /**
   * 시스템 건강성 체크
   */
  static async performHealthCheck(
    projects: Project[],
    schedules: UnifiedSchedule[]
  ): Promise<SystemHealthReport> {

    const inconsistencies: DataInconsistency[] = [];
    const timestamp = new Date();

    // 1. 고아 스케줄 감지
    const orphanSchedules = this.detectOrphanSchedules(projects, schedules);
    inconsistencies.push(...orphanSchedules);

    // 2. 누락 스케줄 감지
    const missingSchedules = this.detectMissingSchedules(projects, schedules);
    inconsistencies.push(...missingSchedules);

    // 3. 중복 미팅 감지
    const duplicateMeetings = this.detectDuplicateMeetings(schedules);
    inconsistencies.push(...duplicateMeetings);

    // 4. 잘못된 Phase 감지
    const invalidPhases = this.detectInvalidPhases(projects);
    inconsistencies.push(...invalidPhases);

    // 5. 깨진 참조 감지
    const brokenReferences = this.detectBrokenReferences(projects, schedules);
    inconsistencies.push(...brokenReferences);

    // 6. 시간 불일치 감지
    const timestampMismatches = this.detectTimestampMismatches(schedules);
    inconsistencies.push(...timestampMismatches);

    // 통계 계산
    const statistics = {
      totalProjects: projects.length,
      totalSchedules: schedules.length,
      totalEvents: this.getPhaseTransitionEventCount(),
      orphanSchedules: orphanSchedules.length,
      missingSchedules: missingSchedules.length,
      duplicateMeetings: duplicateMeetings.length,
      corruptedData: inconsistencies.filter(i => i.type === 'metadata_corruption').length
    };

    // 전체 건강 상태 결정
    const overallHealth = this.determineOverallHealth(inconsistencies);

    // 권장사항 생성
    const recommendations = this.generateRecommendations(inconsistencies);

    const autoFixable = inconsistencies.filter(i => i.autoFixable).length;
    const manualReviewRequired = inconsistencies.filter(i => i.suggestedStrategy === 'manual_review').length;

    const report: SystemHealthReport = {
      timestamp,
      overallHealth,
      inconsistencies,
      statistics,
      recommendations,
      autoFixable,
      manualReviewRequired
    };

    // 결과 로깅
    EdgeCaseLogger.log('EC_RECOVERY_001', {
      overallHealth,
      inconsistencyCount: inconsistencies.length,
      statistics,
      autoFixable,
      manualReviewRequired
    });

    return report;
  }

  /**
   * 자동 복구 실행
   */
  static async performAutoRecovery(
    inconsistencies: DataInconsistency[],
    projects: Project[],
    schedules: UnifiedSchedule[]
  ): Promise<RecoveryResult[]> {

    const results: RecoveryResult[] = [];
    const autoFixableInconsistencies = inconsistencies.filter(i => i.autoFixable);

    for (const inconsistency of autoFixableInconsistencies) {
      try {
        const result = await this.recoverInconsistency(inconsistency, projects, schedules);
        results.push(result);

        if (result.success) {
        } else {
        }
      } catch (error) {
        const errorResult: RecoveryResult = {
          success: false,
          inconsistencyId: inconsistency.id,
          strategy: inconsistency.suggestedStrategy,
          actions: [],
          errors: [{
            code: 'RECOVERY_001',
            message: `Recovery failed: ${error.message}`,
            action: 'auto_recovery',
            itemId: inconsistency.id,
            error: error.stack || error.message,
            recoverable: true
          }],
          warnings: [],
          duration: 0
        };

        results.push(errorResult);
      }
    }

    const successCount = results.filter(r => r.success).length;

    EdgeCaseLogger.log('EC_RECOVERY_002', {
      totalInconsistencies: autoFixableInconsistencies.length,
      successCount,
      failureCount: autoFixableInconsistencies.length - successCount
    });

    return results;
  }

  /**
   * 개별 불일치 복구
   */
  private static async recoverInconsistency(
    inconsistency: DataInconsistency,
    projects: Project[],
    schedules: UnifiedSchedule[]
  ): Promise<RecoveryResult> {
    const startTime = Date.now();

    const result: RecoveryResult = {
      success: false,
      inconsistencyId: inconsistency.id,
      strategy: inconsistency.suggestedStrategy,
      actions: [],
      errors: [],
      warnings: [],
      duration: 0
    };

    try {
      switch (inconsistency.type) {
        case 'orphan_schedule':
          await this.recoverOrphanSchedule(inconsistency, result);
          break;

        case 'missing_schedule':
          await this.recoverMissingSchedule(inconsistency, projects, result);
          break;

        case 'duplicate_meeting':
          await this.recoverDuplicateMeeting(inconsistency, schedules, result);
          break;

        case 'invalid_phase':
          await this.recoverInvalidPhase(inconsistency, projects, result);
          break;

        case 'broken_reference':
          await this.recoverBrokenReference(inconsistency, projects, schedules, result);
          break;

        case 'timestamp_mismatch':
          await this.recoverTimestampMismatch(inconsistency, schedules, result);
          break;

        default:
          result.warnings.push(`Unknown inconsistency type: ${inconsistency.type}`);
      }

      result.success = result.errors.length === 0;

    } catch (error) {
      result.errors.push({
        code: 'RECOVERY_002',
        message: `Inconsistency recovery failed: ${error.message}`,
        action: `recover_${inconsistency.type}`,
        itemId: inconsistency.id,
        error: error.stack || error.message,
        recoverable: true
      });
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * 고아 스케줄 복구
   */
  private static async recoverOrphanSchedule(
    inconsistency: DataInconsistency,
    result: RecoveryResult
  ): Promise<void> {
    const scheduleIds = inconsistency.affectedItems.schedules || [];

    for (const scheduleId of scheduleIds) {
      if (window.scheduleContext?.deleteSchedule) {
        await window.scheduleContext.deleteSchedule(scheduleId);

        result.actions.push({
          type: 'delete',
          target: 'schedule',
          itemId: scheduleId,
          details: 'Removed orphan schedule with no associated project',
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * 누락 스케줄 복구
   */
  private static async recoverMissingSchedule(
    inconsistency: DataInconsistency,
    projects: Project[],
    result: RecoveryResult
  ): Promise<void> {
    const evidence = inconsistency.evidence;
    const projectId = evidence.projectId;
    const meeting = evidence.meeting;

    const project = projects.find(p => p.id === projectId);
    if (!project) {
      result.errors.push({
        code: 'RECOVERY_003',
        message: `Project not found for missing schedule recovery: ${projectId}`,
        action: 'recover_missing_schedule',
        itemId: projectId,
        error: 'Project not found',
        recoverable: false
      });
      return;
    }

    // Meeting을 UnifiedSchedule로 변환
    const schedule = dataConverter.meetingToSchedule(meeting, project);

    // ScheduleContext에 생성
    if (window.scheduleContext?.createSchedule) {
      await window.scheduleContext.createSchedule(schedule);

      result.actions.push({
        type: 'create',
        target: 'schedule',
        itemId: schedule.id,
        details: 'Recreated missing schedule from project meeting',
        newValue: schedule,
        timestamp: new Date()
      });
    }
  }

  /**
   * 중복 미팅 복구
   */
  private static async recoverDuplicateMeeting(
    inconsistency: DataInconsistency,
    schedules: UnifiedSchedule[],
    result: RecoveryResult
  ): Promise<void> {
    const scheduleIds = inconsistency.affectedItems.schedules || [];
    const duplicateSchedules = schedules.filter(s => scheduleIds.includes(s.id));

    if (duplicateSchedules.length < 2) return;

    // 가장 최근에 생성된 것만 유지하고 나머지 삭제
    const sorted = duplicateSchedules.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const keepSchedule = sorted[0];
    const deleteSchedules = sorted.slice(1);

    for (const schedule of deleteSchedules) {
      if (window.scheduleContext?.deleteSchedule) {
        await window.scheduleContext.deleteSchedule(schedule.id);

        result.actions.push({
          type: 'delete',
          target: 'schedule',
          itemId: schedule.id,
          details: `Removed duplicate schedule (kept ${keepSchedule.id})`,
          oldValue: schedule,
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * 잘못된 Phase 복구
   */
  private static async recoverInvalidPhase(
    inconsistency: DataInconsistency,
    projects: Project[],
    result: RecoveryResult
  ): Promise<void> {
    const projectIds = inconsistency.affectedItems.projects || [];

    for (const projectId of projectIds) {
      const project = projects.find(p => p.id === projectId);
      if (!project) continue;

      // 기본 phase로 복구 (contract_pending)
      const correctedPhase = 'contract_pending';

      if (window.buildupContext?.setProjects) {
        const updatedProjects = projects.map(p =>
          p.id === projectId ? { ...p, phase: correctedPhase } : p
        );

        window.buildupContext.setProjects(updatedProjects);

        result.actions.push({
          type: 'update',
          target: 'project',
          itemId: projectId,
          details: `Corrected invalid phase to ${correctedPhase}`,
          oldValue: project.phase,
          newValue: correctedPhase,
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * 깨진 참조 복구
   */
  private static async recoverBrokenReference(
    inconsistency: DataInconsistency,
    projects: Project[],
    schedules: UnifiedSchedule[],
    result: RecoveryResult
  ): Promise<void> {
    // 깨진 참조를 가진 스케줄들을 정리
    const brokenSchedules = schedules.filter(s => {
      if (s.type === 'buildup_project') {
        const buildupMeeting = s as BuildupProjectMeeting;
        return !projects.some(p => p.id === buildupMeeting.projectId);
      }
      return false;
    });

    for (const schedule of brokenSchedules) {
      if (window.scheduleContext?.deleteSchedule) {
        await window.scheduleContext.deleteSchedule(schedule.id);

        result.actions.push({
          type: 'delete',
          target: 'schedule',
          itemId: schedule.id,
          details: 'Removed schedule with broken project reference',
          oldValue: schedule,
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * 시간 불일치 복구
   */
  private static async recoverTimestampMismatch(
    inconsistency: DataInconsistency,
    schedules: UnifiedSchedule[],
    result: RecoveryResult
  ): Promise<void> {
    const scheduleIds = inconsistency.affectedItems.schedules || [];

    for (const scheduleId of scheduleIds) {
      const schedule = schedules.find(s => s.id === scheduleId);
      if (!schedule) continue;

      const startTime = new Date(schedule.startDateTime);
      const endTime = new Date(schedule.endDateTime);

      // 시작 시간이 종료 시간보다 늦은 경우
      if (startTime >= endTime) {
        // 종료 시간을 시작 시간 + 1시간으로 수정
        const correctedEndTime = new Date(startTime.getTime() + 60 * 60 * 1000);

        if (window.scheduleContext?.updateSchedule) {
          await window.scheduleContext.updateSchedule(scheduleId, {
            endDateTime: correctedEndTime.toISOString()
          });

          result.actions.push({
            type: 'update',
            target: 'schedule',
            itemId: scheduleId,
            details: 'Corrected timestamp mismatch (endDateTime)',
            oldValue: endTime.toISOString(),
            newValue: correctedEndTime.toISOString(),
            timestamp: new Date()
          });
        }
      }
    }
  }

  /**
   * 불일치 감지 메서드들
   */
  private static detectOrphanSchedules(
    projects: Project[],
    schedules: UnifiedSchedule[]
  ): DataInconsistency[] {
    const inconsistencies: DataInconsistency[] = [];
    const projectIds = new Set(projects.map(p => p.id));

    const orphanSchedules = schedules.filter(s => {
      if (s.type === 'buildup_project') {
        const buildupMeeting = s as BuildupProjectMeeting;
        return !projectIds.has(buildupMeeting.projectId);
      }
      return false;
    });

    if (orphanSchedules.length > 0) {
      inconsistencies.push({
        id: `orphan_schedules_${Date.now()}`,
        type: 'orphan_schedule',
        severity: 'medium',
        description: `${orphanSchedules.length}개의 고아 스케줄이 발견되었습니다`,
        affectedItems: {
          schedules: orphanSchedules.map(s => s.id)
        },
        detectedAt: new Date(),
        suggestedStrategy: 'remove_orphan',
        autoFixable: true,
        evidence: { orphanSchedules: orphanSchedules.map(s => s.id) }
      });
    }

    return inconsistencies;
  }

  private static detectMissingSchedules(
    projects: Project[],
    schedules: UnifiedSchedule[]
  ): DataInconsistency[] {
    const inconsistencies: DataInconsistency[] = [];
    const existingScheduleProjectIds = new Set(
      schedules
        .filter(s => s.type === 'buildup_project')
        .map(s => (s as BuildupProjectMeeting).projectId)
    );

    for (const project of projects) {
      if (project.meetings && project.meetings.length > 0) {
        // 프로젝트에 미팅이 있지만 스케줄이 없는 경우
        if (!existingScheduleProjectIds.has(project.id)) {
          inconsistencies.push({
            id: `missing_schedule_${project.id}_${Date.now()}`,
            type: 'missing_schedule',
            severity: 'high',
            description: `프로젝트 ${project.title}의 미팅이 스케줄에 누락되었습니다`,
            affectedItems: {
              projects: [project.id]
            },
            detectedAt: new Date(),
            suggestedStrategy: 'recreate_missing',
            autoFixable: true,
            evidence: {
              projectId: project.id,
              meeting: project.meetings[0] // 첫 번째 미팅 정보
            }
          });
        }
      }
    }

    return inconsistencies;
  }

  private static detectDuplicateMeetings(schedules: UnifiedSchedule[]): DataInconsistency[] {
    const inconsistencies: DataInconsistency[] = [];
    const buildupSchedules = schedules.filter(s => s.type === 'buildup_project') as BuildupProjectMeeting[];

    // 프로젝트ID + meetingSequence로 그룹화
    const groups = new Map<string, BuildupProjectMeeting[]>();

    buildupSchedules.forEach(schedule => {
      if (schedule.meetingSequence) {
        const key = `${schedule.projectId}_${schedule.meetingSequence}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(schedule);
      }
    });

    groups.forEach((duplicates, key) => {
      if (duplicates.length > 1) {
        inconsistencies.push({
          id: `duplicate_meeting_${key}_${Date.now()}`,
          type: 'duplicate_meeting',
          severity: 'medium',
          description: `중복된 미팅이 발견되었습니다: ${key}`,
          affectedItems: {
            schedules: duplicates.map(d => d.id)
          },
          detectedAt: new Date(),
          suggestedStrategy: 'merge_data',
          autoFixable: true,
          evidence: { duplicates: duplicates.map(d => d.id) }
        });
      }
    });

    return inconsistencies;
  }

  private static detectInvalidPhases(projects: Project[]): DataInconsistency[] {
    const inconsistencies: DataInconsistency[] = [];
    const validPhases = [
      'contract_pending', 'contract_signed', 'planning',
      'design', 'execution', 'review', 'completed'
    ];

    const invalidProjects = projects.filter(p =>
      p.phase && !validPhases.includes(p.phase)
    );

    if (invalidProjects.length > 0) {
      inconsistencies.push({
        id: `invalid_phases_${Date.now()}`,
        type: 'invalid_phase',
        severity: 'high',
        description: `${invalidProjects.length}개 프로젝트에서 잘못된 phase가 발견되었습니다`,
        affectedItems: {
          projects: invalidProjects.map(p => p.id)
        },
        detectedAt: new Date(),
        suggestedStrategy: 'auto_fix',
        autoFixable: true,
        evidence: { invalidProjects: invalidProjects.map(p => ({ id: p.id, phase: p.phase })) }
      });
    }

    return inconsistencies;
  }

  private static detectBrokenReferences(
    projects: Project[],
    schedules: UnifiedSchedule[]
  ): DataInconsistency[] {
    const inconsistencies: DataInconsistency[] = [];
    const projectIds = new Set(projects.map(p => p.id));

    const brokenSchedules = schedules.filter(s => {
      if (s.type === 'buildup_project') {
        const buildupMeeting = s as BuildupProjectMeeting;
        return buildupMeeting.projectId && !projectIds.has(buildupMeeting.projectId);
      }
      return false;
    });

    if (brokenSchedules.length > 0) {
      inconsistencies.push({
        id: `broken_references_${Date.now()}`,
        type: 'broken_reference',
        severity: 'high',
        description: `${brokenSchedules.length}개의 깨진 프로젝트 참조가 발견되었습니다`,
        affectedItems: {
          schedules: brokenSchedules.map(s => s.id)
        },
        detectedAt: new Date(),
        suggestedStrategy: 'remove_orphan',
        autoFixable: true,
        evidence: { brokenSchedules: brokenSchedules.map(s => s.id) }
      });
    }

    return inconsistencies;
  }

  private static detectTimestampMismatches(schedules: UnifiedSchedule[]): DataInconsistency[] {
    const inconsistencies: DataInconsistency[] = [];

    const invalidSchedules = schedules.filter(s => {
      const startTime = new Date(s.startDateTime);
      const endTime = new Date(s.endDateTime);
      return startTime >= endTime || isNaN(startTime.getTime()) || isNaN(endTime.getTime());
    });

    if (invalidSchedules.length > 0) {
      inconsistencies.push({
        id: `timestamp_mismatches_${Date.now()}`,
        type: 'timestamp_mismatch',
        severity: 'high',
        description: `${invalidSchedules.length}개의 시간 불일치가 발견되었습니다`,
        affectedItems: {
          schedules: invalidSchedules.map(s => s.id)
        },
        detectedAt: new Date(),
        suggestedStrategy: 'auto_fix',
        autoFixable: true,
        evidence: { invalidSchedules: invalidSchedules.map(s => s.id) }
      });
    }

    return inconsistencies;
  }

  /**
   * 헬퍼 메서드들
   */
  private static getPhaseTransitionEventCount(): number {
    return window.buildupContext?.phaseTransitionEvents?.length || 0;
  }

  private static determineOverallHealth(inconsistencies: DataInconsistency[]): 'healthy' | 'warning' | 'critical' | 'failure' {
    if (inconsistencies.length === 0) return 'healthy';

    const criticalCount = inconsistencies.filter(i => i.severity === 'critical').length;
    const highCount = inconsistencies.filter(i => i.severity === 'high').length;

    if (criticalCount > 0) return 'critical';
    if (highCount > 3) return 'critical';
    if (highCount > 0 || inconsistencies.length > 5) return 'warning';

    return 'healthy';
  }

  private static generateRecommendations(inconsistencies: DataInconsistency[]): string[] {
    const recommendations: string[] = [];

    const autoFixableCount = inconsistencies.filter(i => i.autoFixable).length;
    if (autoFixableCount > 0) {
      recommendations.push(`${autoFixableCount}개의 문제를 자동으로 수정할 수 있습니다`);
    }

    const manualCount = inconsistencies.filter(i => i.suggestedStrategy === 'manual_review').length;
    if (manualCount > 0) {
      recommendations.push(`${manualCount}개의 문제는 수동 검토가 필요합니다`);
    }

    const criticalCount = inconsistencies.filter(i => i.severity === 'critical').length;
    if (criticalCount > 0) {
      recommendations.push('즉시 조치가 필요한 심각한 문제가 있습니다');
    }

    if (recommendations.length === 0) {
      recommendations.push('시스템이 정상 상태입니다');
    }

    return recommendations;
  }
}