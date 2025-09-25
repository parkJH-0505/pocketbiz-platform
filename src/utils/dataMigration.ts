/**
 * @fileoverview Mock 데이터 마이그레이션 시스템
 * @description Mock 미팅 데이터를 실제 ScheduleContext로 마이그레이션
 * @author PocketCompany
 * @since 2025-01-19
 */

import type { Meeting, Project } from '../types/buildup.types';
import type { UnifiedSchedule, BuildupProjectMeeting, MeetingSequence } from '../types/schedule.types';
import { dataConverter } from './dataConverters';
import { mockMeetingRecords } from '../data/mockMeetingData';
import { globalTransitionQueue } from './phaseTransitionQueue';
import { EdgeCaseLogger } from './edgeCaseScenarios';
import {
  validateMigrationPrerequisites,
  getSafeProjectId,
  isValidProjectId
} from './migrationValidator';

/**
 * 마이그레이션 결과
 */
export interface MigrationResult {
  success: boolean;
  projectId: string;
  migrated: number;
  conflicts: MigrationConflict[];
  errors: MigrationError[];
  duration: number;
  summary: {
    totalMockMeetings: number;
    validMeetings: number;
    duplicateDetected: number;
    newSchedulesCreated: number;
  };
}

/**
 * 마이그레이션 충돌
 */
export interface MigrationConflict {
  type: 'id_conflict' | 'date_conflict' | 'sequence_conflict';
  mockMeeting: any;
  existingSchedule?: UnifiedSchedule;
  resolution: 'merged' | 'skipped' | 'renamed' | 'replaced';
  details: string;
}

/**
 * 마이그레이션 에러
 */
export interface MigrationError {
  type: 'validation_error' | 'conversion_error' | 'creation_error';
  mockMeeting: any;
  error: string;
  stack?: string;
}

/**
 * Mock 데이터 마이그레이션 매니저
 */
export class MockDataMigrator {
  private migrationHistory: MigrationResult[] = [];

  /**
   * 모든 Mock 미팅 데이터를 ScheduleContext로 마이그레이션
   */
  async migrateAllMockMeetings(): Promise<MigrationResult[]> {

    const allResults: MigrationResult[] = [];
    const projectIds = Object.keys(mockMeetingRecords);

    // ProjectId 유효성 검증
    const validProjectIds = projectIds.filter(id => isValidProjectId(id));
    const invalidProjectIds = projectIds.filter(id => !isValidProjectId(id));

    if (invalidProjectIds.length > 0) {
      console.warn('⚠️ Skipping invalid project IDs:', invalidProjectIds);
      EdgeCaseLogger.log('EC_VALIDATION_001', {
        invalidProjectIds,
        reason: 'Invalid project IDs detected during migration'
      });
    }

    if (validProjectIds.length === 0) {
      return [];
    }

    for (const projectId of validProjectIds) {
      try {
        const result = await this.migrateMockMeetingsForProject(projectId);
        allResults.push(result);
      } catch (error) {
        console.error(`❌ Migration failed for project ${projectId}:`, error);
        allResults.push({
          success: false,
          projectId,
          migrated: 0,
          conflicts: [],
          errors: [{
            type: 'creation_error',
            mockMeeting: null,
            error: error.message
          }],
          duration: 0,
          summary: {
            totalMockMeetings: 0,
            validMeetings: 0,
            duplicateDetected: 0,
            newSchedulesCreated: 0
          }
        });
      }
    }

    const totalMigrated = allResults.reduce((sum, result) => sum + result.migrated, 0);
    const totalErrors = allResults.reduce((sum, result) => sum + result.errors.length, 0);


    return allResults;
  }

  /**
   * 특정 프로젝트의 Mock 미팅 마이그레이션
   */
  async migrateMockMeetingsForProject(projectId: string): Promise<MigrationResult> {
    const startTime = Date.now();


    const result: MigrationResult = {
      success: false,
      projectId,
      migrated: 0,
      conflicts: [],
      errors: [],
      duration: 0,
      summary: {
        totalMockMeetings: 0,
        validMeetings: 0,
        duplicateDetected: 0,
        newSchedulesCreated: 0
      }
    };

    try {
      // Mock 미팅 데이터 가져오기
      const mockMeetings = mockMeetingRecords[projectId] || [];
      result.summary.totalMockMeetings = mockMeetings.length;

      if (mockMeetings.length === 0) {
        result.success = true;
        result.duration = Date.now() - startTime;
        return result;
      }

      // 프로젝트 정보 확인
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      // 기존 스케줄 확인
      const existingSchedules = await this.getExistingSchedules(projectId);

      // Mock 미팅을 UnifiedSchedule로 변환
      const validSchedules: BuildupProjectMeeting[] = [];

      for (const mockMeeting of mockMeetings) {
        try {
          // Mock 미팅 검증
          const validationResult = this.validateMockMeeting(mockMeeting);
          if (!validationResult.valid) {
            result.errors.push({
              type: 'validation_error',
              mockMeeting,
              error: validationResult.error
            });
            continue;
          }

          // Mock 미팅을 Meeting으로 변환
          const meeting = this.convertMockMeetingToMeeting(mockMeeting, project);

          // Meeting을 UnifiedSchedule로 변환
          const schedule = dataConverter.meetingToSchedule(meeting, project) as BuildupProjectMeeting;

          // 중복 검사
          const conflict = this.detectConflict(schedule, existingSchedules);
          if (conflict) {
            result.conflicts.push(conflict);

            if (conflict.resolution === 'skipped') {
              result.summary.duplicateDetected++;
              continue;
            }

            // 충돌 해결
            this.resolveConflict(schedule, conflict);
          }

          validSchedules.push(schedule);
          result.summary.validMeetings++;

        } catch (error) {
          result.errors.push({
            type: 'conversion_error',
            mockMeeting,
            error: error.message,
            stack: error.stack
          });
        }
      }

      // 배치로 스케줄 생성
      if (validSchedules.length > 0) {
        await this.createSchedulesBatch(validSchedules);
        result.migrated = validSchedules.length;
        result.summary.newSchedulesCreated = validSchedules.length;

      }

      result.success = true;

    } catch (error) {
      console.error(`❌ Migration failed for project ${projectId}:`, error);
      result.errors.push({
        type: 'creation_error',
        mockMeeting: null,
        error: error.message,
        stack: error.stack
      });
    } finally {
      result.duration = Date.now() - startTime;
      this.migrationHistory.push(result);
    }

    return result;
  }

  /**
   * Mock 미팅 검증
   */
  private validateMockMeeting(mockMeeting: any): { valid: boolean; error?: string } {
    if (!mockMeeting.id) {
      return { valid: false, error: 'Missing meeting ID' };
    }

    if (!mockMeeting.projectId) {
      return { valid: false, error: 'Missing project ID' };
    }

    if (!mockMeeting.date) {
      return { valid: false, error: 'Missing meeting date' };
    }

    if (!mockMeeting.title) {
      return { valid: false, error: 'Missing meeting title' };
    }

    // 날짜 유효성 확인
    const meetingDate = new Date(mockMeeting.date);
    if (isNaN(meetingDate.getTime())) {
      return { valid: false, error: 'Invalid meeting date' };
    }

    return { valid: true };
  }

  /**
   * Mock 미팅을 Meeting 타입으로 변환
   */
  private convertMockMeetingToMeeting(mockMeeting: any, project: Project): Meeting {
    // Mock meeting type을 Meeting type으로 매핑
    let meetingType: Meeting['type'] = 'pm_meeting';
    let meetingSequence: MeetingSequence = 'pre_meeting';

    if (mockMeeting.type === 'pre') {
      meetingType = 'pm_meeting';
      meetingSequence = 'pre_meeting';
    } else if (mockMeeting.type === 'guide') {
      meetingType = 'pm_meeting';
      meetingSequence = `guide_${mockMeeting.round || 1}` as MeetingSequence;
    }

    const meeting: Meeting = {
      id: mockMeeting.id,
      title: mockMeeting.title,
      date: new Date(mockMeeting.date),
      time: this.extractTimeFromDate(mockMeeting.date),
      type: meetingType,
      duration: mockMeeting.duration || 60,
      attendees: this.extractAttendees(mockMeeting),
      agenda: mockMeeting.memo?.summary || mockMeeting.title,
      location: mockMeeting.location || 'Online',
      meeting_link: mockMeeting.meetingLink,
      status: mockMeeting.status === 'completed' ? 'completed' : 'scheduled',
      notes: mockMeeting.memo?.summary,
      created_by: mockMeeting.participants?.pm?.id || 'system',
      created_at: new Date(),
      metadata: {
        mockMigration: true,
        originalData: mockMeeting,
        meetingSequence,
        tags: mockMeeting.tags || []
      }
    };

    return meeting;
  }

  /**
   * 날짜에서 시간 추출
   */
  private extractTimeFromDate(date: Date | string): string {
    const dateObj = new Date(date);
    return dateObj.toTimeString().slice(0, 5); // HH:MM 형식
  }

  /**
   * 참석자 정보 추출
   */
  private extractAttendees(mockMeeting: any): string[] {
    const attendees: string[] = [];

    if (mockMeeting.participants?.pm?.name) {
      attendees.push(mockMeeting.participants.pm.name);
    }

    if (mockMeeting.participants?.customer?.name) {
      attendees.push(mockMeeting.participants.customer.name);
    }

    if (mockMeeting.participants?.others) {
      mockMeeting.participants.others.forEach((person: any) => {
        if (person.name) {
          attendees.push(person.name);
        }
      });
    }

    return attendees;
  }

  /**
   * 충돌 감지
   */
  private detectConflict(
    schedule: BuildupProjectMeeting,
    existingSchedules: UnifiedSchedule[]
  ): MigrationConflict | null {
    // ID 충돌 확인
    const idConflict = existingSchedules.find(existing => existing.id === schedule.id);
    if (idConflict) {
      return {
        type: 'id_conflict',
        mockMeeting: schedule,
        existingSchedule: idConflict,
        resolution: 'renamed',
        details: `ID conflict detected: ${schedule.id}`
      };
    }

    // 날짜/시간 충돌 확인 (같은 프로젝트, 같은 날짜)
    const dateConflict = existingSchedules.find(existing =>
      existing.type === 'buildup_project' &&
      (existing as BuildupProjectMeeting).projectId === schedule.projectId &&
      Math.abs(new Date(existing.startDateTime).getTime() - new Date(schedule.startDateTime).getTime()) < 60000 // 1분 이내
    );

    if (dateConflict) {
      return {
        type: 'date_conflict',
        mockMeeting: schedule,
        existingSchedule: dateConflict,
        resolution: 'merged',
        details: `Date conflict detected: ${schedule.startDateTime}`
      };
    }

    // Sequence 충돌 확인 (같은 meetingSequence)
    const sequenceConflict = existingSchedules.find(existing =>
      existing.type === 'buildup_project' &&
      (existing as BuildupProjectMeeting).projectId === schedule.projectId &&
      (existing as BuildupProjectMeeting).meetingSequence === schedule.meetingSequence
    );

    if (sequenceConflict) {
      return {
        type: 'sequence_conflict',
        mockMeeting: schedule,
        existingSchedule: sequenceConflict,
        resolution: 'skipped',
        details: `Sequence conflict detected: ${schedule.meetingSequence}`
      };
    }

    return null;
  }

  /**
   * 충돌 해결
   */
  private resolveConflict(schedule: BuildupProjectMeeting, conflict: MigrationConflict): void {
    switch (conflict.resolution) {
      case 'renamed':
        // ID 변경
        schedule.id = `${schedule.id}_migrated_${Date.now()}`;
        break;

      case 'merged':
        // 기존 스케줄과 병합 (제목 업데이트)
        schedule.title = `${schedule.title} (Migrated)`;
        break;

      case 'replaced':
        // 기존 스케줄 교체 (나중에 삭제 예정)
        break;

      case 'skipped':
      default:
        // 건너뛰기 (이미 처리됨)
        break;
    }
  }

  /**
   * 프로젝트 정보 가져오기
   */
  private async getProject(projectId: string): Promise<Project | null> {
    if (window.buildupContext?.projects) {
      return window.buildupContext.projects.find(p => p.id === projectId) || null;
    }
    return null;
  }

  /**
   * 기존 스케줄 가져오기
   */
  private async getExistingSchedules(projectId: string): Promise<UnifiedSchedule[]> {
    if (window.scheduleContext?.getSchedulesByProject) {
      return window.scheduleContext.getSchedulesByProject(projectId);
    }
    return [];
  }

  /**
   * 배치로 스케줄 생성
   */
  private async createSchedulesBatch(schedules: BuildupProjectMeeting[]): Promise<void> {
    if (schedules.length === 0) {
      return;
    }

    // 유효한 projectId 확인
    const projectId = schedules[0]?.projectId;
    if (!isValidProjectId(projectId)) {
      console.error('Invalid projectId for batch creation:', projectId);
      EdgeCaseLogger.log('EC_VALIDATION_002', {
        projectId,
        scheduleCount: schedules.length,
        reason: 'Invalid projectId in batch creation'
      });
      return; // unknown projectId로 진행하지 않음
    }

    if (window.scheduleContext?.createSchedulesBatch) {
      await window.scheduleContext.createSchedulesBatch(schedules, {
        skipDuplicateCheck: true // 이미 중복 검사 완료
      });
    } else {
      // 큐를 통한 생성 (유효한 projectId만)
      await globalTransitionQueue.enqueue({
        projectId: projectId,
        operation: 'mock_migration',
        payload: { mockMeetings: schedules },
        priority: 5, // 낮은 우선순위
        maxRetries: 3
      });
    }
  }

  /**
   * 마이그레이션 히스토리 조회
   */
  getMigrationHistory(): MigrationResult[] {
    return [...this.migrationHistory];
  }

  /**
   * 특정 프로젝트의 마이그레이션 상태 확인
   */
  getMigrationStatus(projectId: string): MigrationResult | null {
    return this.migrationHistory
      .filter(result => result.projectId === projectId)
      .sort((a, b) => b.duration - a.duration)[0] || null;
  }

  /**
   * 마이그레이션 통계
   */
  getMigrationStatistics(): {
    totalProjects: number;
    successfulProjects: number;
    totalMigrated: number;
    totalErrors: number;
    totalConflicts: number;
  } {
    const history = this.getMigrationHistory();

    return {
      totalProjects: history.length,
      successfulProjects: history.filter(r => r.success).length,
      totalMigrated: history.reduce((sum, r) => sum + r.migrated, 0),
      totalErrors: history.reduce((sum, r) => sum + r.errors.length, 0),
      totalConflicts: history.reduce((sum, r) => sum + r.conflicts.length, 0)
    };
  }

  /**
   * 모든 마이그레이션 데이터 정리
   */
  clearMigrationHistory(): void {
    this.migrationHistory = [];
  }
}

/**
 * 전역 마이그레이션 매니저 인스턴스
 */
export const globalMigrator = new MockDataMigrator();

/**
 * 마이그레이션 매니저를 전역 객체에 등록 (디버깅용)
 */
if (typeof window !== 'undefined') {
  (window as any).migrator = globalMigrator;
}