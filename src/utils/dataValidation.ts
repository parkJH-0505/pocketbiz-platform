/**
 * @fileoverview 데이터 검증 유틸리티
 * @description Meeting과 Schedule 데이터의 무결성 검증 및 복구
 * @author PocketCompany
 * @since 2025-01-18
 */

import type {
  UnifiedSchedule,
  BuildupProjectMeeting,
  ScheduleStatus,
  MeetingSequence
} from '../types/schedule.types';

import type { Meeting, Project } from '../types/buildup.types';

/**
 * 데이터 검증 결과
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions?: ValidationSuggestion[];
}

/**
 * 검증 에러
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  severity: 'critical' | 'error';
}

/**
 * 검증 경고
 */
export interface ValidationWarning {
  field: string;
  message: string;
  value?: any;
}

/**
 * 개선 제안
 */
export interface ValidationSuggestion {
  field: string;
  suggestion: string;
  currentValue?: any;
  suggestedValue?: any;
}

/**
 * 데이터 복구 옵션
 */
export interface RecoveryOptions {
  /** 누락된 ID 자동 생성 */
  generateMissingIds?: boolean;

  /** 잘못된 날짜 현재 시간으로 대체 */
  fixInvalidDates?: boolean;

  /** 빈 제목 기본값으로 대체 */
  fillEmptyTitles?: boolean;

  /** 잘못된 상태 기본값으로 대체 */
  fixInvalidStatus?: boolean;

  /** 중복 ID 새 ID로 변경 */
  resolveDuplicateIds?: boolean;
}

/**
 * 데이터 검증 및 복구 클래스
 */
export class DataValidator {
  /**
   * Meeting 데이터 검증
   */
  static validateMeeting(meeting: Meeting): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // 필수 필드 검증
    if (!meeting.id) {
      errors.push({
        field: 'id',
        message: 'Meeting ID is required',
        severity: 'critical'
      });
    }

    if (!meeting.title || meeting.title.trim() === '') {
      errors.push({
        field: 'title',
        message: 'Meeting title is required',
        value: meeting.title,
        severity: 'error'
      });
    }

    if (!meeting.date) {
      errors.push({
        field: 'date',
        message: 'Meeting date is required',
        severity: 'critical'
      });
    } else {
      const dateObj = new Date(meeting.date);
      if (isNaN(dateObj.getTime())) {
        errors.push({
          field: 'date',
          message: 'Invalid date format',
          value: meeting.date,
          severity: 'error'
        });
      } else {
        // 과거 날짜 경고
        const now = new Date();
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(now.getFullYear() - 1);

        if (dateObj < oneYearAgo) {
          warnings.push({
            field: 'date',
            message: 'Meeting date is more than 1 year in the past',
            value: meeting.date
          });
        }
      }
    }

    if (!meeting.type) {
      errors.push({
        field: 'type',
        message: 'Meeting type is required',
        severity: 'error'
      });
    } else if (!['kickoff', 'progress', 'review', 'closing', 'demo'].includes(meeting.type)) {
      errors.push({
        field: 'type',
        message: 'Invalid meeting type',
        value: meeting.type,
        severity: 'error'
      });
    }

    // Duration 검증
    if (meeting.duration) {
      if (meeting.duration <= 0) {
        errors.push({
          field: 'duration',
          message: 'Duration must be positive',
          value: meeting.duration,
          severity: 'error'
        });
      } else if (meeting.duration > 480) { // 8시간 이상
        warnings.push({
          field: 'duration',
          message: 'Duration is unusually long (>8 hours)',
          value: meeting.duration
        });
      }
    } else {
      suggestions.push({
        field: 'duration',
        suggestion: 'Consider setting duration to 60 minutes as default',
        currentValue: meeting.duration,
        suggestedValue: 60
      });
    }

    // Attendees 검증
    if (!meeting.attendees || meeting.attendees.length === 0) {
      warnings.push({
        field: 'attendees',
        message: 'No attendees specified',
        value: meeting.attendees
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * UnifiedSchedule 데이터 검증
   */
  static validateSchedule(schedule: UnifiedSchedule): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // 필수 필드 검증
    if (!schedule.id) {
      errors.push({
        field: 'id',
        message: 'Schedule ID is required',
        severity: 'critical'
      });
    }

    if (!schedule.title || schedule.title.trim() === '') {
      errors.push({
        field: 'title',
        message: 'Schedule title is required',
        value: schedule.title,
        severity: 'error'
      });
    }

    if (!schedule.type) {
      errors.push({
        field: 'type',
        message: 'Schedule type is required',
        severity: 'critical'
      });
    }

    if (!schedule.date) {
      errors.push({
        field: 'date',
        message: 'Schedule date is required',
        severity: 'critical'
      });
    } else {
      const dateObj = new Date(schedule.date);
      if (isNaN(dateObj.getTime())) {
        errors.push({
          field: 'date',
          message: 'Invalid date format',
          value: schedule.date,
          severity: 'error'
        });
      }
    }

    // Status 검증
    const validStatuses: ScheduleStatus[] = ['scheduled', 'in_progress', 'completed', 'cancelled'];
    if (schedule.status && !validStatuses.includes(schedule.status)) {
      errors.push({
        field: 'status',
        message: 'Invalid status value',
        value: schedule.status,
        severity: 'error'
      });
    }

    // BuildupProjectMeeting 추가 검증
    if (schedule.subType === 'buildup_project') {
      const buildupMeeting = schedule as BuildupProjectMeeting;

      if (!buildupMeeting.projectId) {
        errors.push({
          field: 'projectId',
          message: 'Project ID is required for buildup meetings',
          severity: 'critical'
        });
      }

      if (!buildupMeeting.meetingSequence) {
        errors.push({
          field: 'meetingSequence',
          message: 'Meeting sequence is required for buildup meetings',
          severity: 'error'
        });
      }

      if (!buildupMeeting.pmInfo) {
        errors.push({
          field: 'pmInfo',
          message: 'PM information is required for buildup meetings',
          severity: 'error'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Meeting 데이터 복구
   */
  static recoverMeeting(
    meeting: Partial<Meeting>,
    options: RecoveryOptions = {}
  ): Meeting {
    const recovered = { ...meeting } as Meeting;

    // ID 복구
    if (!recovered.id && options.generateMissingIds) {
      recovered.id = `meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // 제목 복구
    if ((!recovered.title || recovered.title.trim() === '') && options.fillEmptyTitles) {
      recovered.title = recovered.type ? `${recovered.type} Meeting` : 'Untitled Meeting';
    }

    // 날짜 복구
    if (!recovered.date && options.fixInvalidDates) {
      recovered.date = new Date();
    } else if (recovered.date) {
      const dateObj = new Date(recovered.date);
      if (isNaN(dateObj.getTime()) && options.fixInvalidDates) {
        recovered.date = new Date();
      }
    }

    // Type 기본값
    if (!recovered.type) {
      recovered.type = 'progress';
    }

    // Duration 기본값
    if (!recovered.duration || recovered.duration <= 0) {
      recovered.duration = 60;
    }

    // Attendees 기본값
    if (!recovered.attendees) {
      recovered.attendees = [];
    }

    return recovered;
  }

  /**
   * Schedule 데이터 복구
   */
  static recoverSchedule(
    schedule: Partial<UnifiedSchedule>,
    options: RecoveryOptions = {}
  ): UnifiedSchedule {
    const recovered = { ...schedule } as UnifiedSchedule;

    // ID 복구
    if (!recovered.id && options.generateMissingIds) {
      recovered.id = `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // 제목 복구
    if ((!recovered.title || recovered.title.trim() === '') && options.fillEmptyTitles) {
      recovered.title = recovered.type ? `${recovered.type} Event` : 'Untitled Event';
    }

    // 날짜 복구
    if (!recovered.date && options.fixInvalidDates) {
      recovered.date = new Date();
    }

    // Type 기본값
    if (!recovered.type) {
      recovered.type = 'meeting';
    }

    // Status 복구
    if (!recovered.status || options.fixInvalidStatus) {
      const validStatuses: ScheduleStatus[] = ['scheduled', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(recovered.status as ScheduleStatus)) {
        recovered.status = 'scheduled';
      }
    }

    // 기본값 설정
    recovered.priority = recovered.priority || 'medium';
    recovered.isRecurring = recovered.isRecurring || false;
    recovered.participants = recovered.participants || [];

    // 시간 정보 설정
    if (!recovered.createdAt) {
      recovered.createdAt = new Date();
    }
    if (!recovered.createdBy) {
      recovered.createdBy = 'system';
    }

    return recovered;
  }

  /**
   * 배치 검증
   */
  static validateBatch<T>(
    items: T[],
    validator: (item: T) => ValidationResult
  ): {
    valid: T[];
    invalid: Array<{ item: T; result: ValidationResult }>;
  } {
    const valid: T[] = [];
    const invalid: Array<{ item: T; result: ValidationResult }> = [];

    items.forEach(item => {
      const result = validator(item);
      if (result.isValid) {
        valid.push(item);
      } else {
        invalid.push({ item, result });
      }
    });

    return { valid, invalid };
  }

  /**
   * 중복 ID 검사
   */
  static checkDuplicateIds(items: Array<{ id: string }>): string[] {
    const idMap = new Map<string, number>();
    const duplicates: string[] = [];

    items.forEach(item => {
      const count = idMap.get(item.id) || 0;
      idMap.set(item.id, count + 1);

      if (count === 1) { // 두 번째 발견 시에만 추가
        duplicates.push(item.id);
      }
    });

    return duplicates;
  }

  /**
   * 날짜 충돌 검사
   */
  static checkDateConflicts(
    meetings: Meeting[],
    threshold: number = 30 // 분
  ): Array<{ meeting1: Meeting; meeting2: Meeting; overlap: number }> {
    const conflicts: Array<{ meeting1: Meeting; meeting2: Meeting; overlap: number }> = [];

    for (let i = 0; i < meetings.length; i++) {
      for (let j = i + 1; j < meetings.length; j++) {
        const meeting1 = meetings[i];
        const meeting2 = meetings[j];

        const start1 = new Date(meeting1.date);
        const end1 = new Date(start1.getTime() + (meeting1.duration || 60) * 60000);

        const start2 = new Date(meeting2.date);
        const end2 = new Date(start2.getTime() + (meeting2.duration || 60) * 60000);

        // 시간 중복 계산
        const overlapStart = Math.max(start1.getTime(), start2.getTime());
        const overlapEnd = Math.min(end1.getTime(), end2.getTime());
        const overlapMinutes = Math.max(0, (overlapEnd - overlapStart) / 60000);

        if (overlapMinutes >= threshold) {
          conflicts.push({
            meeting1,
            meeting2,
            overlap: overlapMinutes
          });
        }
      }
    }

    return conflicts;
  }
}

/**
 * 싱글톤 인스턴스 export
 */
export const dataValidator = new DataValidator();