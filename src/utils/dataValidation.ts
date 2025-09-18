/**
 * @fileoverview 데이터 유효성 검증 및 비즈니스 로직 검증 시스템
 * @description Sprint 4 Phase 4-3: 강력한 검증 로직 구현
 * @author PocketCompany
 * @since 2025-01-19
 */

import type { Project, PhaseTransitionEvent, Meeting } from '../types/buildup.types';
import type { UnifiedSchedule, BuildupProjectMeeting } from '../types/schedule.types';
import type { ProjectPhase } from '../types/buildup.types';
import { EdgeCaseLogger } from './edgeCaseScenarios';

/**
 * 검증 결과 타입
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * 검증 에러
 */
export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  value?: any;
  context?: any;
}

/**
 * 검증 경고
 */
export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  suggestion?: string;
}

/**
 * 프로젝트 상태 검증기
 */
export class ProjectStateValidator {

  /**
   * 프로젝트 기본 검증
   */
  static validateProject(project: Project): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 필수 필드 검증
    if (!project.id) {
      errors.push({
        code: 'VAL_001',
        message: 'Project ID is required',
        field: 'id'
      });
    }

    if (!project.title || project.title.trim().length === 0) {
      errors.push({
        code: 'VAL_002',
        message: 'Project title is required',
        field: 'title',
        value: project.title
      });
    }

    if (!project.service_id) {
      errors.push({
        code: 'VAL_003',
        message: 'Service ID is required',
        field: 'service_id'
      });
    }

    // 계약 정보 검증
    if (!project.contract) {
      errors.push({
        code: 'VAL_004',
        message: 'Contract information is required',
        field: 'contract'
      });
    } else {
      if (!project.contract.id) {
        errors.push({
          code: 'VAL_005',
          message: 'Contract ID is required',
          field: 'contract.id'
        });
      }

      if (!project.contract.value || project.contract.value <= 0) {
        errors.push({
          code: 'VAL_006',
          message: 'Contract value must be greater than 0',
          field: 'contract.value',
          value: project.contract.value
        });
      }

      // 날짜 검증
      const signedDate = new Date(project.contract.signed_date);
      const startDate = new Date(project.contract.start_date);
      const endDate = new Date(project.contract.end_date);

      if (startDate < signedDate) {
        warnings.push({
          code: 'VAL_W001',
          message: 'Start date is before signed date',
          field: 'contract.start_date',
          suggestion: 'Consider updating the start date'
        });
      }

      if (endDate <= startDate) {
        errors.push({
          code: 'VAL_007',
          message: 'End date must be after start date',
          field: 'contract.end_date'
        });
      }
    }

    // 팀 정보 검증
    if (!project.team) {
      errors.push({
        code: 'VAL_008',
        message: 'Team information is required',
        field: 'team'
      });
    } else {
      if (!project.team.pm) {
        errors.push({
          code: 'VAL_009',
          message: 'Project Manager is required',
          field: 'team.pm'
        });
      }

      if (!project.team.client_contact) {
        errors.push({
          code: 'VAL_010',
          message: 'Client contact is required',
          field: 'team.client_contact'
        });
      }
    }

    // Phase 검증
    if (project.phase) {
      const validPhases: ProjectPhase[] = [
        'contract_pending',
        'contract_signed',
        'planning',
        'design',
        'execution',
        'review',
        'completed'
      ];

      if (!validPhases.includes(project.phase)) {
        errors.push({
          code: 'VAL_011',
          message: 'Invalid project phase',
          field: 'phase',
          value: project.phase
        });
      }
    }

    const severity = errors.length > 0 ? 'high' : warnings.length > 0 ? 'medium' : 'low';

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      severity: severity as any
    };
  }

  /**
   * Phase transition 검증
   */
  static validatePhaseTransition(
    project: Project,
    fromPhase: ProjectPhase,
    toPhase: ProjectPhase,
    context?: any
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 기본 프로젝트 검증
    const baseValidation = this.validateProject(project);
    if (!baseValidation.isValid) {
      return baseValidation;
    }

    // Phase transition 유효성 기본 검증
    if (fromPhase === toPhase) {
      warnings.push({
        code: 'VAL_PT_W001',
        message: 'Source and target phases are the same',
        field: 'phase_transition',
        suggestion: 'No transition needed'
      });
    }

    const severity = errors.length > 0 ? 'critical' : warnings.length > 0 ? 'medium' : 'low';

    if (errors.length > 0) {
      EdgeCaseLogger.log('EC_DATA_004', {
        projectId: project.id,
        fromPhase,
        toPhase,
        validationErrors: errors.length,
        errors: errors.map(e => e.code)
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      severity: severity as any
    };
  }
}

/**
 * 미팅 스케줄링 검증기
 */
export class MeetingScheduleValidator {

  /**
   * 미팅 스케줄 검증
   */
  static validateMeetingSchedule(
    meeting: BuildupProjectMeeting,
    project: Project,
    existingSchedules: UnifiedSchedule[]
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 기본 미팅 정보 검증
    if (!meeting.title || meeting.title.trim().length === 0) {
      errors.push({
        code: 'MTG_001',
        message: 'Meeting title is required',
        field: 'title'
      });
    }

    if (!meeting.startDateTime) {
      errors.push({
        code: 'MTG_002',
        message: 'Meeting start date/time is required',
        field: 'startDateTime'
      });
    }

    if (!meeting.endDateTime) {
      errors.push({
        code: 'MTG_003',
        message: 'Meeting end date/time is required',
        field: 'endDateTime'
      });
    }

    // 날짜/시간 검증
    if (meeting.startDateTime && meeting.endDateTime) {
      const startTime = new Date(meeting.startDateTime);
      const endTime = new Date(meeting.endDateTime);

      if (startTime >= endTime) {
        errors.push({
          code: 'MTG_004',
          message: 'Meeting end time must be after start time',
          field: 'endDateTime'
        });
      }

      // 비즈니스 시간 검증 (9 AM - 6 PM)
      const startHour = startTime.getHours();
      if (startHour < 9 || startHour > 18) {
        warnings.push({
          code: 'MTG_W002',
          message: 'Meeting is scheduled outside business hours',
          field: 'startDateTime',
          suggestion: 'Consider scheduling during business hours (9 AM - 6 PM)'
        });
      }
    }

    // 프로젝트 연관성 검증
    if (meeting.projectId !== project.id) {
      errors.push({
        code: 'MTG_005',
        message: 'Meeting project ID does not match the project',
        field: 'projectId'
      });
    }

    // 중복 미팅 검증
    const conflictingMeetings = existingSchedules.filter(schedule => {
      if (schedule.type !== 'buildup_project' || schedule.id === meeting.id) return false;

      const scheduleStart = new Date(schedule.startDateTime);
      const scheduleEnd = new Date(schedule.endDateTime);
      const meetingStart = new Date(meeting.startDateTime);
      const meetingEnd = new Date(meeting.endDateTime);

      // 시간 겹침 확인
      return (meetingStart < scheduleEnd && meetingEnd > scheduleStart);
    });

    if (conflictingMeetings.length > 0) {
      warnings.push({
        code: 'MTG_W005',
        message: `Meeting conflicts with ${conflictingMeetings.length} existing meeting(s)`,
        field: 'startDateTime',
        suggestion: 'Consider rescheduling to avoid conflicts'
      });

      EdgeCaseLogger.log('EC_USER_004', {
        projectId: project.id,
        meetingTitle: meeting.title,
        conflictCount: conflictingMeetings.length,
        conflictingMeetings: conflictingMeetings.map(m => m.title)
      });
    }

    const severity = errors.length > 0 ? 'high' : warnings.length > 0 ? 'medium' : 'low';

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      severity: severity as any
    };
  }
}

/**
 * 데이터 무결성 검증기
 */
export class DataIntegrityValidator {

  /**
   * 프로젝트-스케줄 무결성 검증
   */
  static validateProjectScheduleIntegrity(
    projects: Project[],
    schedules: UnifiedSchedule[]
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 고아 스케줄 확인 (연결된 프로젝트가 없는 스케줄)
    const buildupSchedules = schedules.filter(s => s.type === 'buildup_project') as BuildupProjectMeeting[];
    const projectIds = new Set(projects.map(p => p.id));

    const orphanSchedules = buildupSchedules.filter(s => !projectIds.has(s.projectId));
    if (orphanSchedules.length > 0) {
      errors.push({
        code: 'INT_001',
        message: `Found ${orphanSchedules.length} orphan schedule(s) without matching projects`,
        field: 'project_schedule_integrity',
        context: { orphanSchedules: orphanSchedules.map(s => s.id) }
      });

      EdgeCaseLogger.log('EC_DATA_005', {
        orphanScheduleCount: orphanSchedules.length,
        orphanScheduleIds: orphanSchedules.map(s => s.id)
      });
    }

    // 중복 미팅 확인
    const meetingGroups = new Map<string, BuildupProjectMeeting[]>();
    buildupSchedules.forEach(schedule => {
      if (schedule.meetingSequence) {
        const key = `${schedule.projectId}_${schedule.meetingSequence}`;
        if (!meetingGroups.has(key)) {
          meetingGroups.set(key, []);
        }
        meetingGroups.get(key)!.push(schedule);
      }
    });

    meetingGroups.forEach((meetings, key) => {
      if (meetings.length > 1) {
        warnings.push({
          code: 'INT_W001',
          message: `Duplicate meetings found for ${key}`,
          field: 'duplicate_meetings',
          suggestion: 'Review and remove duplicate meetings'
        });

        EdgeCaseLogger.log('EC_DATA_006', {
          duplicateKey: key,
          meetingCount: meetings.length,
          meetingIds: meetings.map(m => m.id)
        });
      }
    });

    const severity = errors.length > 0 ? 'high' : warnings.length > 0 ? 'medium' : 'low';

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      severity: severity as any
    };
  }
}

/**
 * 전역 검증 매니저
 */
export class ValidationManager {

  /**
   * 종합 검증 실행
   */
  static async runComprehensiveValidation(
    projects: Project[],
    schedules: UnifiedSchedule[]
  ): Promise<ValidationResult> {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];

    // 1. 개별 프로젝트 검증
    projects.forEach(project => {
      const result = ProjectStateValidator.validateProject(project);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    });

    // 2. 데이터 무결성 검증
    const integrityResult = DataIntegrityValidator.validateProjectScheduleIntegrity(projects, schedules);
    allErrors.push(...integrityResult.errors);
    allWarnings.push(...integrityResult.warnings);

    // 3. 미팅 스케줄 검증
    const buildupMeetings = schedules.filter(s => s.type === 'buildup_project') as BuildupProjectMeeting[];
    buildupMeetings.forEach(meeting => {
      const project = projects.find(p => p.id === meeting.projectId);
      if (project) {
        const result = MeetingScheduleValidator.validateMeetingSchedule(meeting, project, schedules);
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
      }
    });

    const severity = allErrors.length > 0 ? 'critical' : allWarnings.length > 0 ? 'medium' : 'low';

    const result: ValidationResult = {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      severity: severity as any
    };

    // 검증 결과 로깅
    console.log('🔍 Comprehensive validation completed:', {
      totalErrors: allErrors.length,
      totalWarnings: allWarnings.length,
      severity: result.severity,
      projectsValidated: projects.length,
      schedulesValidated: schedules.length
    });

    if (allErrors.length > 0) {
      EdgeCaseLogger.log('EC_SYSTEM_002', {
        validationType: 'comprehensive',
        errorCount: allErrors.length,
        warningCount: allWarnings.length,
        severity: result.severity
      });
    }

    return result;
  }

  /**
   * Phase transition 전용 검증
   */
  static validatePhaseTransitionRequest(
    project: Project,
    fromPhase: ProjectPhase,
    toPhase: ProjectPhase,
    context?: any
  ): ValidationResult {
    return ProjectStateValidator.validatePhaseTransition(project, fromPhase, toPhase, context);
  }

  /**
   * 미팅 생성 전용 검증
   */
  static validateMeetingCreation(
    meeting: BuildupProjectMeeting,
    project: Project,
    existingSchedules: UnifiedSchedule[]
  ): ValidationResult {
    return MeetingScheduleValidator.validateMeetingSchedule(meeting, project, existingSchedules);
  }
}