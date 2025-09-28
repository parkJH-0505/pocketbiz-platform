/**
 * @fileoverview 프로젝트 진행률 계산 공통 유틸리티
 * @description 헤더와 개요 탭에서 공통으로 사용할 진행률 계산 로직
 * @author PocketCompany
 * @since 2025-01-20
 */

import type { Project, ProjectPhase } from '../types/buildup.types';
import type { BuildupProjectMeeting } from '../types/schedule.types';
import { PHASE_INFO, ALL_PHASES, getPhaseIndex, calculatePhaseProgress } from './projectPhaseUtils';

/**
 * 프로젝트 진행 정보 타입
 */
export interface ProjectProgress {
  /** 전체 진행률 (0-100) */
  percentage: number;
  /** 완료된 단계 수 */
  completedPhases: number;
  /** 현재 단계 내 진행률 (0-100) */
  currentPhaseProgress: number;
  /** 각 단계별 실제 소요일 */
  phaseDurations: Record<ProjectPhase, number>;
  /** 각 단계별 미팅 통계 */
  phaseStats: Record<ProjectPhase, {
    totalMeetings: number;
    completedMeetings: number;
    upcomingMeetings: number;
  }>;
  /** 예상 잔여일 */
  estimatedDaysRemaining: number;
  /** 실제 D-Day (프로젝트 종료일까지) */
  dDayToEnd: number;
  /** 다음 미팅까지 D-Day */
  dDayToNextMeeting: number | null;
}

/**
 * 날짜 차이 계산 (일수)
 */
function calculateDaysDifference(startDate: Date, endDate: Date): number {
  const diffInTime = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffInTime / (1000 * 60 * 60 * 24));
}

/**
 * 특정 단계의 미팅들 필터링
 */
function getMeetingsForPhase(meetings: BuildupProjectMeeting[], phase: ProjectPhase): BuildupProjectMeeting[] {
  return meetings.filter(meeting => {
    // meetingSequence 타입으로 단계 매핑
    const sequenceTypeToPhase: Record<string, ProjectPhase> = {
      'pre_meeting': 'contract_pending',
      'guide_1': 'contract_signed',
      'guide_2': 'planning',
      'guide_3': 'design',
      'guide_4': 'execution',
      'guide_5': 'review',
      'final': 'completed'
    };

    if (typeof meeting.meetingSequence === 'string') {
      return sequenceTypeToPhase[meeting.meetingSequence] === phase;
    }

    // meetingSequence가 객체인 경우
    if (meeting.meetingSequence && typeof meeting.meetingSequence === 'object') {
      const sequenceType = (meeting.meetingSequence as any).type;
      const sequenceNumber = (meeting.meetingSequence as any).sequence;

      if (sequenceType === 'guide') {
        const guidePhases: ProjectPhase[] = ['contract_signed', 'planning', 'design', 'execution', 'review'];
        return guidePhases[sequenceNumber - 1] === phase;
      }
    }

    // 기본적으로 projectPhase 사용
    return meeting.projectPhase === phase;
  });
}

/**
 * 단계별 실제 소요 기간 계산
 */
function calculateActualPhaseDuration(meetings: BuildupProjectMeeting[]): number {
  if (meetings.length === 0) return 0;

  const completedMeetings = meetings.filter(m => m.status === 'completed');
  if (completedMeetings.length === 0) return 0;

  // 완료된 미팅들의 첫 번째와 마지막 날짜 계산
  const dates = completedMeetings.map(m => new Date(m.date)).sort((a, b) => a.getTime() - b.getTime());
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];

  return calculateDaysDifference(firstDate, lastDate) + 1; // +1 for inclusive days
}

/**
 * 현재 단계의 진행률 계산 (미팅 기반)
 */
function calculateCurrentPhaseProgress(currentPhase: ProjectPhase, meetings: BuildupProjectMeeting[]): number {
  const phaseMeetings = getMeetingsForPhase(meetings, currentPhase);
  if (phaseMeetings.length === 0) return 0;

  const completedMeetings = phaseMeetings.filter(m => m.status === 'completed').length;
  return Math.round((completedMeetings / phaseMeetings.length) * 100);
}

/**
 * 예상 잔여일 계산
 */
function calculateEstimatedDaysRemaining(
  currentPhase: ProjectPhase,
  meetings: BuildupProjectMeeting[],
  project: Project
): number {
  const currentPhaseIndex = getPhaseIndex(currentPhase);
  const remainingPhases = ALL_PHASES.slice(currentPhaseIndex);

  let totalDays = 0;

  for (const phase of remainingPhases) {
    const phaseMeetings = getMeetingsForPhase(meetings, phase);

    if (phase === currentPhase) {
      // 현재 단계: 남은 미팅 수 기반 계산
      const upcomingMeetings = phaseMeetings.filter(m => m.status === 'scheduled').length;
      totalDays += upcomingMeetings * 2; // 미팅당 평균 2일 간격
    } else {
      // 미래 단계: 기본 예상 소요일 사용
      const baseDurations: Record<ProjectPhase, number> = {
        contract_pending: 3,
        contract_signed: 1,
        planning: 5,
        design: 7,
        execution: 14,
        review: 3,
        completed: 0
      };

      // 개발 프로젝트는 실행 단계가 더 김
      if (project.category === '개발' && phase === 'execution') {
        totalDays += 21;
      } else {
        totalDays += baseDurations[phase];
      }
    }
  }

  return totalDays;
}

/**
 * 다음 미팅까지 D-Day 계산
 */
function calculateDaysToNextMeeting(meetings: BuildupProjectMeeting[]): number | null {
  const now = new Date();
  const upcomingMeetings = meetings
    .filter(m => {
      const meetingDate = new Date(m.date || m.startDateTime);
      return meetingDate > now && m.status === 'scheduled';
    })
    .sort((a, b) => {
      const dateA = new Date(a.date || a.startDateTime);
      const dateB = new Date(b.date || b.startDateTime);
      return dateA.getTime() - dateB.getTime();
    });

  if (upcomingMeetings.length === 0) return null;

  const nextMeetingDate = new Date(upcomingMeetings[0].date || upcomingMeetings[0].startDateTime);
  return calculateDaysDifference(now, nextMeetingDate);
}

/**
 * 프로젝트 종료일까지 D-Day 계산
 */
function calculateDaysToProjectEnd(project: Project): number {
  const now = new Date();
  const endDate = new Date(project.timeline.end_date || project.contract.end_date);
  return calculateDaysDifference(now, endDate);
}

/**
 * 메인 진행률 계산 함수
 */
export function calculateProjectProgress(
  project: Project,
  meetings: BuildupProjectMeeting[]
): ProjectProgress {
  const currentPhase = project.phase || 'contract_pending';
  const currentPhaseIndex = getPhaseIndex(currentPhase);

  // 각 단계별 통계 계산
  const phaseStats: Record<ProjectPhase, any> = {} as any;
  const phaseDurations: Record<ProjectPhase, number> = {} as any;

  ALL_PHASES.forEach(phase => {
    const phaseMeetings = getMeetingsForPhase(meetings, phase);
    const completedMeetings = phaseMeetings.filter(m => m.status === 'completed');
    const upcomingMeetings = phaseMeetings.filter(m => m.status === 'scheduled');

    phaseStats[phase] = {
      totalMeetings: phaseMeetings.length,
      completedMeetings: completedMeetings.length,
      upcomingMeetings: upcomingMeetings.length
    };

    // 실제 소요 기간 또는 예상 기간
    if (completedMeetings.length > 0) {
      phaseDurations[phase] = calculateActualPhaseDuration(phaseMeetings);
    } else {
      // 기본 예상 기간
      const defaultDurations: Record<ProjectPhase, number> = {
        contract_pending: 3,
        contract_signed: 1,
        planning: 5,
        design: 7,
        execution: project.category === '개발' ? 21 : 14,
        review: 3,
        completed: 0
      };
      phaseDurations[phase] = defaultDurations[phase];
    }
  });

  // 전체 진행률 계산 (미팅 기반)
  const totalMeetings = meetings.length;
  const completedMeetings = meetings.filter(m => m.status === 'completed').length;
  const meetingBasedProgress = totalMeetings > 0 ? (completedMeetings / totalMeetings) * 100 : 0;

  // 단계 기반 진행률과 미팅 기반 진행률의 평균
  const phaseBasedProgress = calculatePhaseProgress(currentPhase);
  const percentage = Math.round((phaseBasedProgress + meetingBasedProgress) / 2);

  return {
    percentage,
    completedPhases: currentPhaseIndex,
    currentPhaseProgress: calculateCurrentPhaseProgress(currentPhase, meetings),
    phaseDurations,
    phaseStats,
    estimatedDaysRemaining: calculateEstimatedDaysRemaining(currentPhase, meetings, project),
    dDayToEnd: calculateDaysToProjectEnd(project),
    dDayToNextMeeting: calculateDaysToNextMeeting(meetings)
  };
}

/**
 * 특정 단계의 실제 소요일 계산
 */
export function calculatePhaseDuration(
  phase: ProjectPhase,
  meetings: BuildupProjectMeeting[],
  project?: Project
): number {
  const phaseMeetings = getMeetingsForPhase(meetings, phase);

  // 완료된 미팅이 있으면 실제 소요 기간 계산
  const completedMeetings = phaseMeetings.filter(m => m.status === 'completed');
  if (completedMeetings.length > 0) {
    return calculateActualPhaseDuration(phaseMeetings);
  }

  // 기본 예상 기간 반환
  const defaultDurations: Record<ProjectPhase, number> = {
    contract_pending: 3,
    contract_signed: 1,
    planning: 5,
    design: 7,
    execution: project?.category === '개발' ? 21 : 14,
    review: 3,
    completed: 0
  };

  return defaultDurations[phase];
}

/**
 * D-Day 계산 (프로젝트 데이터 기반)
 */
export function calculateDDayFromProject(project: Project): number {
  return calculateDaysToProjectEnd(project);
}

/**
 * 미팅 통계 계산
 */
export function calculateMeetingStats(
  phase: ProjectPhase,
  meetings: BuildupProjectMeeting[]
): { total: number; completed: number; upcoming: number } {
  const phaseMeetings = getMeetingsForPhase(meetings, phase);

  return {
    total: phaseMeetings.length,
    completed: phaseMeetings.filter(m => m.status === 'completed').length,
    upcoming: phaseMeetings.filter(m => m.status === 'scheduled').length
  };
}