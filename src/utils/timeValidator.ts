/**
 * @fileoverview 시간 검증 시스템
 * @description Sprint 4 Phase 4-4: 과거 날짜 미팅 생성 제한 및 처리
 * @author PocketCompany
 * @since 2025-01-19
 */

import type { UnifiedSchedule, BuildupProjectMeeting, MeetingSequence } from '../types/schedule.types';
import type { Project } from '../types/buildup.types';
import { EdgeCaseLogger } from './edgeCaseScenarios';

/**
 * 시간 검증 결과
 */
export interface TimeValidationResult {
  isValid: boolean;
  errors: TimeValidationError[];
  warnings: TimeValidationWarning[];
  suggestions: TimeSuggestion[];
}

/**
 * 시간 검증 에러
 */
export interface TimeValidationError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  field: 'startDateTime' | 'endDateTime' | 'duration';
  actualValue: string | Date;
  expectedRule: string;
}

/**
 * 시간 검증 경고
 */
export interface TimeValidationWarning {
  code: string;
  message: string;
  suggestion: string;
  field: 'startDateTime' | 'endDateTime' | 'duration';
}

/**
 * 시간 제안
 */
export interface TimeSuggestion {
  type: 'next_business_day' | 'next_available_slot' | 'preferred_time';
  description: string;
  suggestedTime: {
    startDateTime: Date;
    endDateTime: Date;
  };
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * 과거 미팅 허용 규칙
 */
export interface PastMeetingRule {
  type: 'migration' | 'historical_record' | 'admin_override';
  description: string;
  maxDaysBack: number;
  requiresApproval: boolean;
  allowedRoles: string[];
}

/**
 * 시간 검증 설정
 */
const TIME_VALIDATION_CONFIG = {
  // 기본 업무 시간
  businessHours: {
    start: 9,  // 9 AM
    end: 18,   // 6 PM
    timezone: 'Asia/Seoul'
  },

  // 과거 미팅 허용 규칙
  pastMeetingRules: [
    {
      type: 'migration',
      description: '마이그레이션을 위한 과거 미팅',
      maxDaysBack: 365,
      requiresApproval: false,
      allowedRoles: ['system', 'admin']
    },
    {
      type: 'historical_record',
      description: '과거 기록 보완',
      maxDaysBack: 30,
      requiresApproval: true,
      allowedRoles: ['admin', 'pm']
    },
    {
      type: 'admin_override',
      description: '관리자 수동 생성',
      maxDaysBack: 730,
      requiresApproval: false,
      allowedRoles: ['admin']
    }
  ] as PastMeetingRule[],

  // 미팅 길이 제한
  durationLimits: {
    min: 15,    // 15분
    max: 480,   // 8시간
    typical: 60 // 1시간
  },

  // 미팅 시간대 제한
  timeRestrictions: {
    // 점심시간
    lunchBreak: {
      start: 12,  // 12 PM
      end: 13     // 1 PM
    },
    // 이른 시간 제한
    tooEarly: 8,    // 8 AM 이전
    // 늦은 시간 제한
    tooLate: 20     // 8 PM 이후
  }
};

/**
 * 시간 검증기
 */
export class TimeValidator {

  /**
   * 종합 시간 검증
   */
  static validateScheduleTime(
    schedule: UnifiedSchedule,
    context?: {
      userRole?: string;
      allowPastMeetings?: boolean;
      migrationMode?: boolean;
      existingSchedules?: UnifiedSchedule[];
    }
  ): TimeValidationResult {
    const result: TimeValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    const startTime = new Date(schedule.startDateTime);
    const endTime = new Date(schedule.endDateTime);
    const now = new Date();

    // 1. 기본 시간 검증
    this.validateBasicTime(startTime, endTime, result);

    // 2. 과거 날짜 검증
    if (startTime < now) {
      this.validatePastMeeting(schedule, startTime, result, context);
    }

    // 3. 업무 시간 검증
    this.validateBusinessHours(startTime, endTime, result);

    // 4. 미팅 길이 검증
    this.validateDuration(startTime, endTime, result);

    // 5. 특수 시간대 검증
    this.validateSpecialTimeSlots(startTime, endTime, result);

    // 6. 시간대 충돌 검증
    if (context?.existingSchedules) {
      this.validateTimeConflicts(schedule, context.existingSchedules, result);
    }

    // 7. 제안 생성
    if (result.errors.length > 0 || result.warnings.length > 0) {
      this.generateTimeSuggestions(schedule, result);
    }

    // 최종 유효성 결정
    result.isValid = result.errors.length === 0;

    // Edge case 로깅
    if (!result.isValid) {
      EdgeCaseLogger.log('EC_TIME_001', {
        scheduleId: schedule.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        errorCount: result.errors.length,
        warningCount: result.warnings.length,
        errors: result.errors.map(e => e.code)
      });
    }

    return result;
  }

  /**
   * 기본 시간 검증
   */
  private static validateBasicTime(
    startTime: Date,
    endTime: Date,
    result: TimeValidationResult
  ): void {
    // 시작 시간이 종료 시간보다 나중인지 확인
    if (startTime >= endTime) {
      result.errors.push({
        code: 'TIME_001',
        message: '시작 시간이 종료 시간보다 늦거나 같습니다',
        severity: 'critical',
        field: 'startDateTime',
        actualValue: startTime,
        expectedRule: '시작 시간 < 종료 시간'
      });
    }

    // 유효한 날짜인지 확인
    if (isNaN(startTime.getTime())) {
      result.errors.push({
        code: 'TIME_002',
        message: '유효하지 않은 시작 시간입니다',
        severity: 'critical',
        field: 'startDateTime',
        actualValue: startTime,
        expectedRule: '유효한 Date 객체'
      });
    }

    if (isNaN(endTime.getTime())) {
      result.errors.push({
        code: 'TIME_003',
        message: '유효하지 않은 종료 시간입니다',
        severity: 'critical',
        field: 'endDateTime',
        actualValue: endTime,
        expectedRule: '유효한 Date 객체'
      });
    }
  }

  /**
   * 과거 미팅 검증
   */
  private static validatePastMeeting(
    schedule: UnifiedSchedule,
    startTime: Date,
    result: TimeValidationResult,
    context?: {
      userRole?: string;
      allowPastMeetings?: boolean;
      migrationMode?: boolean;
    }
  ): void {
    const now = new Date();
    const daysBehind = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24));

    // 마이그레이션 모드에서는 과거 미팅 허용
    if (context?.migrationMode) {
      EdgeCaseLogger.log('EC_TIME_002', {
        scheduleId: schedule.id,
        daysBehind,
        migrationMode: true,
        allowed: true
      });
      return;
    }

    // 명시적으로 과거 미팅 허용된 경우
    if (context?.allowPastMeetings) {
      result.warnings.push({
        code: 'TIME_W001',
        message: `과거 날짜 미팅입니다 (${daysBehind}일 전)`,
        suggestion: '현재 시간 이후로 조정하는 것을 권장합니다',
        field: 'startDateTime'
      });
      return;
    }

    // 허용 규칙 확인
    const applicableRule = this.findApplicablePastMeetingRule(
      daysBehind,
      context?.userRole || 'user'
    );

    if (applicableRule) {
      if (applicableRule.requiresApproval) {
        result.warnings.push({
          code: 'TIME_W002',
          message: `과거 미팅 생성 시 승인이 필요합니다 (규칙: ${applicableRule.description})`,
          suggestion: '관리자 승인을 받은 후 진행하세요',
          field: 'startDateTime'
        });
      } else {
        result.warnings.push({
          code: 'TIME_W003',
          message: `과거 미팅이 허용됩니다 (규칙: ${applicableRule.description})`,
          suggestion: '정말 과거 날짜가 필요한지 다시 한번 확인하세요',
          field: 'startDateTime'
        });
      }

      EdgeCaseLogger.log('EC_TIME_003', {
        scheduleId: schedule.id,
        daysBehind,
        ruleType: applicableRule.type,
        requiresApproval: applicableRule.requiresApproval,
        userRole: context?.userRole
      });
    } else {
      // 허용되지 않는 과거 미팅
      result.errors.push({
        code: 'TIME_004',
        message: `과거 날짜 미팅은 생성할 수 없습니다 (${daysBehind}일 전)`,
        severity: 'high',
        field: 'startDateTime',
        actualValue: startTime,
        expectedRule: '현재 시간 이후의 날짜'
      });

      EdgeCaseLogger.log('EC_TIME_004', {
        scheduleId: schedule.id,
        daysBehind,
        userRole: context?.userRole,
        rejected: true
      });
    }
  }

  /**
   * 적용 가능한 과거 미팅 규칙 찾기
   */
  private static findApplicablePastMeetingRule(
    daysBehind: number,
    userRole: string
  ): PastMeetingRule | null {
    for (const rule of TIME_VALIDATION_CONFIG.pastMeetingRules) {
      if (daysBehind <= rule.maxDaysBack &&
          rule.allowedRoles.includes(userRole)) {
        return rule;
      }
    }
    return null;
  }

  /**
   * 업무 시간 검증
   */
  private static validateBusinessHours(
    startTime: Date,
    endTime: Date,
    result: TimeValidationResult
  ): void {
    const config = TIME_VALIDATION_CONFIG.businessHours;

    // 주말 확인
    const startDay = startTime.getDay();
    const endDay = endTime.getDay();

    if (startDay === 0 || startDay === 6) {
      result.warnings.push({
        code: 'TIME_W004',
        message: '주말에 미팅이 예약되었습니다',
        suggestion: '평일로 조정하는 것을 권장합니다',
        field: 'startDateTime'
      });
    }

    // 업무 시간 확인
    const startHour = startTime.getHours();
    const endHour = endTime.getHours();

    if (startHour < config.start || startHour >= config.end) {
      result.warnings.push({
        code: 'TIME_W005',
        message: `업무 시간 외 미팅입니다 (${config.start}:00-${config.end}:00)`,
        suggestion: '업무 시간 내로 조정하는 것을 권장합니다',
        field: 'startDateTime'
      });
    }

    if (endHour > config.end) {
      result.warnings.push({
        code: 'TIME_W006',
        message: `미팅이 업무 시간을 넘어 종료됩니다`,
        suggestion: '업무 시간 내에 완료되도록 조정하세요',
        field: 'endDateTime'
      });
    }
  }

  /**
   * 미팅 길이 검증
   */
  private static validateDuration(
    startTime: Date,
    endTime: Date,
    result: TimeValidationResult
  ): void {
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // 분 단위
    const limits = TIME_VALIDATION_CONFIG.durationLimits;

    if (duration < limits.min) {
      result.errors.push({
        code: 'TIME_005',
        message: `미팅 시간이 너무 짧습니다 (최소 ${limits.min}분)`,
        severity: 'medium',
        field: 'duration',
        actualValue: `${duration}분`,
        expectedRule: `최소 ${limits.min}분`
      });
    }

    if (duration > limits.max) {
      result.errors.push({
        code: 'TIME_006',
        message: `미팅 시간이 너무 깁니다 (최대 ${limits.max}분)`,
        severity: 'medium',
        field: 'duration',
        actualValue: `${duration}분`,
        expectedRule: `최대 ${limits.max}분`
      });
    }

    if (duration > limits.typical * 2) {
      result.warnings.push({
        code: 'TIME_W007',
        message: `미팅 시간이 일반적인 길이보다 깁니다 (일반: ${limits.typical}분)`,
        suggestion: '미팅 목적에 맞는 적절한 시간인지 확인하세요',
        field: 'duration'
      });
    }
  }

  /**
   * 특수 시간대 검증 (점심시간, 너무 이른/늦은 시간)
   */
  private static validateSpecialTimeSlots(
    startTime: Date,
    endTime: Date,
    result: TimeValidationResult
  ): void {
    const restrictions = TIME_VALIDATION_CONFIG.timeRestrictions;
    const startHour = startTime.getHours();
    const endHour = endTime.getHours();

    // 너무 이른 시간
    if (startHour < restrictions.tooEarly) {
      result.warnings.push({
        code: 'TIME_W008',
        message: `너무 이른 시간입니다 (${restrictions.tooEarly}시 이전)`,
        suggestion: '더 늦은 시간으로 조정하세요',
        field: 'startDateTime'
      });
    }

    // 너무 늦은 시간
    if (startHour >= restrictions.tooLate) {
      result.warnings.push({
        code: 'TIME_W009',
        message: `너무 늦은 시간입니다 (${restrictions.tooLate}시 이후)`,
        suggestion: '더 이른 시간으로 조정하세요',
        field: 'startDateTime'
      });
    }

    // 점심시간 겹침
    const lunchStart = restrictions.lunchBreak.start;
    const lunchEnd = restrictions.lunchBreak.end;

    if ((startHour < lunchEnd && endHour > lunchStart)) {
      result.warnings.push({
        code: 'TIME_W010',
        message: `점심시간과 겹칩니다 (${lunchStart}:00-${lunchEnd}:00)`,
        suggestion: '점심시간을 피해서 조정하세요',
        field: 'startDateTime'
      });
    }
  }

  /**
   * 시간 충돌 검증
   */
  private static validateTimeConflicts(
    schedule: UnifiedSchedule,
    existingSchedules: UnifiedSchedule[],
    result: TimeValidationResult
  ): void {
    const startTime = new Date(schedule.startDateTime);
    const endTime = new Date(schedule.endDateTime);

    const conflicts = existingSchedules.filter(existing => {
      if (existing.id === schedule.id) return false;

      const existingStart = new Date(existing.startDateTime);
      const existingEnd = new Date(existing.endDateTime);

      return startTime < existingEnd && endTime > existingStart;
    });

    if (conflicts.length > 0) {
      result.warnings.push({
        code: 'TIME_W011',
        message: `${conflicts.length}개의 다른 미팅과 시간이 겹칩니다`,
        suggestion: '충돌하지 않는 시간대를 선택하세요',
        field: 'startDateTime'
      });

      EdgeCaseLogger.log('EC_TIME_005', {
        scheduleId: schedule.id,
        conflictCount: conflicts.length,
        conflictingIds: conflicts.map(c => c.id)
      });
    }
  }

  /**
   * 시간 제안 생성
   */
  private static generateTimeSuggestions(
    schedule: UnifiedSchedule,
    result: TimeValidationResult
  ): void {
    const startTime = new Date(schedule.startDateTime);
    const endTime = new Date(schedule.endDateTime);
    const duration = endTime.getTime() - startTime.getTime();

    // 다음 업무일 같은 시간 제안
    const nextBusinessDay = this.getNextBusinessDay(startTime);
    result.suggestions.push({
      type: 'next_business_day',
      description: `다음 업무일 같은 시간 (${nextBusinessDay.toLocaleDateString()})`,
      suggestedTime: {
        startDateTime: nextBusinessDay,
        endDateTime: new Date(nextBusinessDay.getTime() + duration)
      },
      reason: '업무일 기준으로 조정',
      confidence: 'high'
    });

    // 다음 가능한 업무 시간대 제안
    const nextAvailableSlot = this.getNextAvailableBusinessSlot(startTime, duration);
    if (nextAvailableSlot) {
      result.suggestions.push({
        type: 'next_available_slot',
        description: `다음 가능한 시간대 (${nextAvailableSlot.toLocaleString()})`,
        suggestedTime: {
          startDateTime: nextAvailableSlot,
          endDateTime: new Date(nextAvailableSlot.getTime() + duration)
        },
        reason: '업무 시간 내 가장 빠른 시간',
        confidence: 'medium'
      });
    }

    // 선호 시간대 제안 (오전 10시, 오후 2시, 오후 4시)
    const preferredTimes = [10, 14, 16];
    for (const hour of preferredTimes) {
      const preferredTime = new Date(startTime);
      preferredTime.setHours(hour, 0, 0, 0);

      // 과거가 아니고 업무일인 경우에만
      if (preferredTime > new Date() && this.isBusinessDay(preferredTime)) {
        result.suggestions.push({
          type: 'preferred_time',
          description: `선호 시간대 (${preferredTime.toLocaleString()})`,
          suggestedTime: {
            startDateTime: preferredTime,
            endDateTime: new Date(preferredTime.getTime() + duration)
          },
          reason: '일반적으로 선호되는 미팅 시간',
          confidence: 'medium'
        });
        break; // 첫 번째 가능한 선호 시간만 제안
      }
    }
  }

  /**
   * 다음 업무일 계산
   */
  private static getNextBusinessDay(date: Date): Date {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    // 주말이면 월요일로
    while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
      nextDay.setDate(nextDay.getDate() + 1);
    }

    return nextDay;
  }

  /**
   * 다음 가능한 업무 시간대 계산
   */
  private static getNextAvailableBusinessSlot(date: Date, duration: number): Date | null {
    const config = TIME_VALIDATION_CONFIG.businessHours;
    const now = new Date();
    let candidate = new Date(Math.max(date.getTime(), now.getTime()));

    // 업무일로 조정
    while (!this.isBusinessDay(candidate)) {
      candidate.setDate(candidate.getDate() + 1);
      candidate.setHours(config.start, 0, 0, 0);
    }

    // 업무 시간으로 조정
    if (candidate.getHours() < config.start) {
      candidate.setHours(config.start, 0, 0, 0);
    } else if (candidate.getHours() >= config.end) {
      candidate = this.getNextBusinessDay(candidate);
      candidate.setHours(config.start, 0, 0, 0);
    }

    // 미팅이 업무 시간 내에 끝나는지 확인
    const endTime = new Date(candidate.getTime() + duration);
    if (endTime.getHours() > config.end) {
      candidate = this.getNextBusinessDay(candidate);
      candidate.setHours(config.start, 0, 0, 0);
    }

    return candidate;
  }

  /**
   * 업무일 확인
   */
  private static isBusinessDay(date: Date): boolean {
    const day = date.getDay();
    return day !== 0 && day !== 6; // 일요일(0), 토요일(6) 제외
  }

  /**
   * 과거 미팅 허용 여부 확인
   */
  static canCreatePastMeeting(
    daysBack: number,
    userRole: string = 'user'
  ): { allowed: boolean; rule?: PastMeetingRule; requiresApproval?: boolean } {
    const rule = this.findApplicablePastMeetingRule(daysBack, userRole);

    if (rule) {
      return {
        allowed: true,
        rule,
        requiresApproval: rule.requiresApproval
      };
    }

    return { allowed: false };
  }

  /**
   * 빠른 시간 검증 (기본적인 검증만)
   */
  static quickValidate(startDateTime: string, endDateTime: string): boolean {
    try {
      const startTime = new Date(startDateTime);
      const endTime = new Date(endDateTime);
      const now = new Date();

      // 기본 검증
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return false;
      }

      if (startTime >= endTime) {
        return false;
      }

      // 과거 날짜는 기본적으로 거부 (마이그레이션 모드 제외)
      if (startTime < now) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}