/**
 * @fileoverview 시간 충돌 해결 시스템
 * @description Sprint 4 Phase 4-4: 동일 시간대 여러 미팅 예약 충돌 처리
 * @author PocketCompany
 * @since 2025-01-19
 */

import type { UnifiedSchedule, BuildupProjectMeeting, MeetingSequence } from '../types/schedule.types';
import type { Project } from '../types/buildup.types';
import { EdgeCaseLogger } from './edgeCaseScenarios';

/**
 * 충돌 유형
 */
export type ConflictType =
  | 'exact_time'      // 정확히 같은 시간
  | 'overlapping'     // 시간 겹침
  | 'same_project'    // 같은 프로젝트 내 충돌
  | 'resource_conflict'; // 리소스 충돌 (같은 PM 등)

/**
 * 충돌 해결 전략
 */
export type ResolutionStrategy =
  | 'auto_adjust'     // 자동 시간 조정
  | 'priority_based'  // 우선순위 기반 해결
  | 'user_choice'     // 사용자 선택
  | 'reject_new';     // 새 미팅 거부

/**
 * 충돌 정보
 */
export interface ScheduleConflict {
  type: ConflictType;
  existingSchedule: UnifiedSchedule;
  newSchedule: UnifiedSchedule;
  conflictDetails: {
    overlapMinutes: number;
    conflictStart: Date;
    conflictEnd: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  suggestedResolutions: ConflictResolution[];
}

/**
 * 충돌 해결 방안
 */
export interface ConflictResolution {
  strategy: ResolutionStrategy;
  description: string;
  newTime?: {
    startDateTime: Date;
    endDateTime: Date;
  };
  priority: number; // 1-10, 높을수록 우선
  feasibility: 'high' | 'medium' | 'low';
  impact: 'minimal' | 'moderate' | 'significant';
}

/**
 * 미팅 우선순위 규칙
 */
const MEETING_PRIORITY_RULES = {
  // 미팅 시퀀스별 우선순위 (높을수록 중요)
  meetingSequence: {
    'pre_meeting': 8,     // 프리미팅 - 매우 중요
    'guide_1': 10,        // 킥오프 - 최고 우선순위
    'guide_2': 7,         // 가이드 2차
    'guide_3': 7,         // 가이드 3차
    'guide_4': 9,         // 가이드 4차 - 매우 중요 (완료 단계)
    'review_meeting': 8,  // 검토 미팅
    'other': 5           // 기타 미팅
  } as Record<MeetingSequence | 'other', number>,

  // 프로젝트 단계별 우선순위
  projectPhase: {
    'contract_pending': 6,
    'contract_signed': 8,
    'planning': 7,
    'design': 7,
    'execution': 9,
    'review': 10,
    'completed': 3
  },

  // 미팅 상태별 우선순위
  status: {
    'confirmed': 10,
    'scheduled': 8,
    'tentative': 5,
    'cancelled': 0
  }
};

/**
 * 스케줄 충돌 해결자
 */
export class ScheduleConflictResolver {

  /**
   * 충돌 감지 및 분석
   */
  static detectConflicts(
    newSchedule: UnifiedSchedule,
    existingSchedules: UnifiedSchedule[],
    projects?: Project[]
  ): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];

    const newStart = new Date(newSchedule.startDateTime);
    const newEnd = new Date(newSchedule.endDateTime);

    for (const existing of existingSchedules) {
      if (existing.id === newSchedule.id) continue;

      const existingStart = new Date(existing.startDateTime);
      const existingEnd = new Date(existing.endDateTime);

      // 시간 겹침 확인
      const overlapStart = new Date(Math.max(newStart.getTime(), existingStart.getTime()));
      const overlapEnd = new Date(Math.min(newEnd.getTime(), existingEnd.getTime()));

      if (overlapStart < overlapEnd) {
        const overlapMinutes = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60);

        const conflictType = this.determineConflictType(newSchedule, existing);
        const severity = this.calculateSeverity(newSchedule, existing, overlapMinutes);

        const conflict: ScheduleConflict = {
          type: conflictType,
          existingSchedule: existing,
          newSchedule,
          conflictDetails: {
            overlapMinutes,
            conflictStart: overlapStart,
            conflictEnd: overlapEnd,
            severity
          },
          suggestedResolutions: []
        };

        // 해결 방안 생성
        conflict.suggestedResolutions = this.generateResolutions(conflict, projects);

        conflicts.push(conflict);

        // Edge case 로깅
        EdgeCaseLogger.log('EC_CONFLICT_001', {
          conflictType,
          severity,
          overlapMinutes,
          newScheduleId: newSchedule.id,
          existingScheduleId: existing.id,
          suggestedResolutionsCount: conflict.suggestedResolutions.length
        });
      }
    }

    return conflicts;
  }

  /**
   * 충돌 유형 결정
   */
  private static determineConflictType(
    newSchedule: UnifiedSchedule,
    existingSchedule: UnifiedSchedule
  ): ConflictType {
    const newStart = new Date(newSchedule.startDateTime);
    const newEnd = new Date(newSchedule.endDateTime);
    const existingStart = new Date(existingSchedule.startDateTime);
    const existingEnd = new Date(existingSchedule.endDateTime);

    // 정확히 같은 시간
    if (newStart.getTime() === existingStart.getTime() &&
        newEnd.getTime() === existingEnd.getTime()) {
      return 'exact_time';
    }

    // 같은 프로젝트인지 확인
    if (newSchedule.type === 'buildup_project' &&
        existingSchedule.type === 'buildup_project') {
      const newBuildup = newSchedule as BuildupProjectMeeting;
      const existingBuildup = existingSchedule as BuildupProjectMeeting;

      if (newBuildup.projectId === existingBuildup.projectId) {
        return 'same_project';
      }
    }

    // 리소스 충돌 확인 (같은 PM, 클라이언트 등)
    if (this.hasResourceConflict(newSchedule, existingSchedule)) {
      return 'resource_conflict';
    }

    return 'overlapping';
  }

  /**
   * 리소스 충돌 확인
   */
  private static hasResourceConflict(
    schedule1: UnifiedSchedule,
    schedule2: UnifiedSchedule
  ): boolean {
    // 참석자 겹침 확인
    if (schedule1.attendees && schedule2.attendees) {
      const attendees1 = new Set(schedule1.attendees);
      const attendees2 = new Set(schedule2.attendees);

      for (const attendee of attendees1) {
        if (attendees2.has(attendee)) {
          return true;
        }
      }
    }

    // 같은 생성자인지 확인
    if (schedule1.createdBy === schedule2.createdBy) {
      return true;
    }

    return false;
  }

  /**
   * 충돌 심각도 계산
   */
  private static calculateSeverity(
    newSchedule: UnifiedSchedule,
    existingSchedule: UnifiedSchedule,
    overlapMinutes: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    // 완전 겹침
    const newDuration = (new Date(newSchedule.endDateTime).getTime() -
                        new Date(newSchedule.startDateTime).getTime()) / (1000 * 60);
    const existingDuration = (new Date(existingSchedule.endDateTime).getTime() -
                             new Date(existingSchedule.startDateTime).getTime()) / (1000 * 60);

    const overlapRatio = overlapMinutes / Math.min(newDuration, existingDuration);

    // 같은 프로젝트 내 충돌은 더 심각
    if (newSchedule.type === 'buildup_project' &&
        existingSchedule.type === 'buildup_project') {
      const newBuildup = newSchedule as BuildupProjectMeeting;
      const existingBuildup = existingSchedule as BuildupProjectMeeting;

      if (newBuildup.projectId === existingBuildup.projectId) {
        return 'critical';
      }
    }

    if (overlapRatio >= 0.8) return 'critical';
    if (overlapRatio >= 0.5) return 'high';
    if (overlapRatio >= 0.2) return 'medium';
    return 'low';
  }

  /**
   * 해결 방안 생성
   */
  private static generateResolutions(
    conflict: ScheduleConflict,
    projects?: Project[]
  ): ConflictResolution[] {
    const resolutions: ConflictResolution[] = [];
    const { newSchedule, existingSchedule, conflictDetails } = conflict;

    // 1. 자동 시간 조정
    const autoAdjustResolutions = this.generateAutoAdjustResolutions(conflict);
    resolutions.push(...autoAdjustResolutions);

    // 2. 우선순위 기반 해결
    const priorityResolution = this.generatePriorityResolution(conflict, projects);
    if (priorityResolution) {
      resolutions.push(priorityResolution);
    }

    // 3. 사용자 선택 옵션
    resolutions.push({
      strategy: 'user_choice',
      description: '사용자가 직접 시간을 선택합니다',
      priority: 5,
      feasibility: 'high',
      impact: 'moderate'
    });

    // 4. 새 미팅 거부 (최후 수단)
    if (conflictDetails.severity === 'critical') {
      resolutions.push({
        strategy: 'reject_new',
        description: '새 미팅 생성을 거부합니다',
        priority: 1,
        feasibility: 'high',
        impact: 'significant'
      });
    }

    // 우선순위 순으로 정렬
    return resolutions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 자동 시간 조정 방안 생성
   */
  private static generateAutoAdjustResolutions(conflict: ScheduleConflict): ConflictResolution[] {
    const { newSchedule, existingSchedule } = conflict;
    const resolutions: ConflictResolution[] = [];

    const newStart = new Date(newSchedule.startDateTime);
    const newEnd = new Date(newSchedule.endDateTime);
    const existingStart = new Date(existingSchedule.startDateTime);
    const existingEnd = new Date(existingSchedule.endDateTime);

    const duration = newEnd.getTime() - newStart.getTime();

    // 기존 미팅 전으로 이동
    const beforeExisting = new Date(existingStart.getTime() - duration);
    if (this.isBusinessHours(beforeExisting)) {
      resolutions.push({
        strategy: 'auto_adjust',
        description: `기존 미팅 전 시간대로 조정 (${beforeExisting.toLocaleTimeString()})`,
        newTime: {
          startDateTime: beforeExisting,
          endDateTime: new Date(existingStart.getTime() - 30 * 60 * 1000) // 30분 간격
        },
        priority: 8,
        feasibility: 'high',
        impact: 'minimal'
      });
    }

    // 기존 미팅 후로 이동
    const afterExisting = new Date(existingEnd.getTime() + 30 * 60 * 1000); // 30분 후
    const newEndAfter = new Date(afterExisting.getTime() + duration);
    if (this.isBusinessHours(newEndAfter)) {
      resolutions.push({
        strategy: 'auto_adjust',
        description: `기존 미팅 후 시간대로 조정 (${afterExisting.toLocaleTimeString()})`,
        newTime: {
          startDateTime: afterExisting,
          endDateTime: newEndAfter
        },
        priority: 7,
        feasibility: 'high',
        impact: 'minimal'
      });
    }

    // 다음 날 같은 시간
    const nextDay = new Date(newStart);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayEnd = new Date(nextDay.getTime() + duration);

    resolutions.push({
      strategy: 'auto_adjust',
      description: `다음 날 같은 시간으로 조정 (${nextDay.toLocaleDateString()} ${nextDay.toLocaleTimeString()})`,
      newTime: {
        startDateTime: nextDay,
        endDateTime: nextDayEnd
      },
      priority: 6,
      feasibility: 'medium',
      impact: 'moderate'
    });

    return resolutions;
  }

  /**
   * 우선순위 기반 해결 방안
   */
  private static generatePriorityResolution(
    conflict: ScheduleConflict,
    projects?: Project[]
  ): ConflictResolution | null {
    const newPriority = this.calculateMeetingPriority(conflict.newSchedule, projects);
    const existingPriority = this.calculateMeetingPriority(conflict.existingSchedule, projects);

    if (newPriority > existingPriority) {
      return {
        strategy: 'priority_based',
        description: `새 미팅이 더 높은 우선순위를 가지므로 기존 미팅을 조정합니다`,
        priority: 9,
        feasibility: 'medium',
        impact: 'moderate'
      };
    } else if (existingPriority > newPriority) {
      return {
        strategy: 'priority_based',
        description: `기존 미팅이 더 높은 우선순위를 가지므로 새 미팅을 조정합니다`,
        priority: 9,
        feasibility: 'medium',
        impact: 'moderate'
      };
    }

    return null;
  }

  /**
   * 미팅 우선순위 계산
   */
  private static calculateMeetingPriority(
    schedule: UnifiedSchedule,
    projects?: Project[]
  ): number {
    let priority = 5; // 기본 우선순위

    // 빌드업 프로젝트 미팅인 경우
    if (schedule.type === 'buildup_project') {
      const buildupMeeting = schedule as BuildupProjectMeeting;

      // 미팅 시퀀스 우선순위 적용
      if (buildupMeeting.meetingSequence) {
        priority += MEETING_PRIORITY_RULES.meetingSequence[buildupMeeting.meetingSequence] ||
                   MEETING_PRIORITY_RULES.meetingSequence.other;
      }

      // 프로젝트 단계 우선순위 적용
      if (projects && buildupMeeting.projectId) {
        const project = projects.find(p => p.id === buildupMeeting.projectId);
        if (project?.phase) {
          priority += MEETING_PRIORITY_RULES.projectPhase[project.phase] || 0;
        }
      }
    }

    // 상태 우선순위 적용
    if (schedule.status) {
      priority += MEETING_PRIORITY_RULES.status[schedule.status as keyof typeof MEETING_PRIORITY_RULES.status] || 0;
    }

    return priority;
  }

  /**
   * 업무 시간 확인
   */
  private static isBusinessHours(date: Date): boolean {
    const hour = date.getHours();
    const day = date.getDay(); // 0: 일요일, 6: 토요일

    // 주말 제외
    if (day === 0 || day === 6) return false;

    // 업무 시간: 9 AM - 6 PM
    return hour >= 9 && hour < 18;
  }

  /**
   * 충돌 해결 실행
   */
  static async resolveConflict(
    conflict: ScheduleConflict,
    resolution: ConflictResolution,
    updateScheduleCallback: (id: string, updates: Partial<UnifiedSchedule>) => Promise<void>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      switch (resolution.strategy) {
        case 'auto_adjust':
          if (resolution.newTime) {
            await updateScheduleCallback(conflict.newSchedule.id, {
              startDateTime: resolution.newTime.startDateTime.toISOString(),
              endDateTime: resolution.newTime.endDateTime.toISOString()
            });
          }
          break;

        case 'priority_based':
          // 우선순위에 따라 기존 또는 새 미팅 조정
          // 실제 구현에서는 더 복잡한 로직 필요
          break;

        case 'reject_new':
          return { success: false, error: '새 미팅 생성이 거부되었습니다.' };

        case 'user_choice':
          // 사용자 인터랙션 필요 - UI에서 처리
          return { success: false, error: '사용자 선택이 필요합니다.' };
      }

      EdgeCaseLogger.log('EC_CONFLICT_RESOLVED', {
        conflictType: conflict.type,
        strategy: resolution.strategy,
        scheduleId: conflict.newSchedule.id
      });

      return { success: true };

    } catch (error) {
      EdgeCaseLogger.log('EC_CONFLICT_RESOLUTION_FAILED', {
        conflictType: conflict.type,
        strategy: resolution.strategy,
        error: error.message,
        scheduleId: conflict.newSchedule.id
      });

      return { success: false, error: error.message };
    }
  }
}