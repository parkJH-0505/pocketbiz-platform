/**
 * @fileoverview 7단계 시스템 → 타임라인 Phase 변환
 * @description projectPhaseUtils의 ProjectPhase를 timeline Phase 객체로 변환
 * @author PocketCompany
 * @since 2025-01-30
 */

import {
  ALL_PHASES,
  PHASE_INFO,
  getPhaseIndex,
  getPhaseEstimatedDuration
} from '../../../utils/projectPhaseUtils';
import type { ProjectPhase } from '../../../types/buildup.types';
import type { Project } from '../../../types/buildup.types';

/**
 * 타임라인 Phase 인터페이스
 * (timeline-v3.types의 Project['phases'] 타입과 호환)
 */
export interface TimelinePhase {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isCompleted: boolean;
  isCurrent: boolean;
  order: number;
}

/**
 * Project → TimelinePhase[] 변환
 *
 * @param project 프로젝트 객체
 * @returns 7개 단계 배열 (계약중 → 완료)
 *
 * @example
 * const project = { phase: 'execution', timeline: {...} };
 * const phases = convertProjectPhasesToTimeline(project);
 * // [
 * //   { id: 'phase-0', name: '계약중', isCompleted: true, isCurrent: false, ... },
 * //   { id: 'phase-1', name: '계약완료', isCompleted: true, isCurrent: false, ... },
 * //   ...
 * //   { id: 'phase-4', name: '실행', isCompleted: false, isCurrent: true, ... },
 * //   ...
 * // ]
 */
export function convertProjectPhasesToTimeline(project: Project): TimelinePhase[] {
  // ========================================================================
  // 1. 현재 단계 인덱스 계산
  // ========================================================================
  const currentPhase: ProjectPhase = project.phase || 'contract_pending';
  const currentPhaseIndex = getPhaseIndex(currentPhase);

  // ========================================================================
  // 2. 기준 날짜 결정 (프로젝트 시작일)
  // ========================================================================
  const baseDate = project.timeline?.start_date
    ? new Date(project.timeline.start_date)
    : project.timeline?.kickoff_date
    ? new Date(project.timeline.kickoff_date)
    : project.contract?.start_date
    ? new Date(project.contract.start_date)
    : new Date(); // 최악의 경우 현재 날짜

  // ========================================================================
  // 3. 프로젝트 종료일 (전체 기간 계산용)
  // ========================================================================
  const projectEndDate = project.timeline?.end_date
    ? new Date(project.timeline.end_date)
    : project.contract?.end_date
    ? new Date(project.contract.end_date)
    : null;

  // ========================================================================
  // 4. 전체 기간을 7단계로 균등 분배 (종료일이 있는 경우)
  // ========================================================================
  if (projectEndDate) {
    return generateEvenlyDistributedPhases(
      baseDate,
      projectEndDate,
      currentPhaseIndex
    );
  }

  // ========================================================================
  // 5. 종료일이 없으면 단계별 예상 기간 사용
  // ========================================================================
  return generateEstimatedDurationPhases(
    project,
    baseDate,
    currentPhaseIndex
  );
}

/**
 * 균등 분배 방식 (종료일이 명확한 경우)
 * 전체 기간을 7단계로 나눔
 */
function generateEvenlyDistributedPhases(
  startDate: Date,
  endDate: Date,
  currentPhaseIndex: number
): TimelinePhase[] {
  const totalDuration = endDate.getTime() - startDate.getTime();
  const phaseDuration = totalDuration / 7;

  return ALL_PHASES.map((phase, index) => {
    const phaseStart = new Date(startDate.getTime() + phaseDuration * index);
    const phaseEnd = new Date(startDate.getTime() + phaseDuration * (index + 1));

    return {
      id: `phase-${index}`,
      name: PHASE_INFO[phase].label,
      startDate: phaseStart,
      endDate: phaseEnd,
      isCompleted: index < currentPhaseIndex,
      isCurrent: index === currentPhaseIndex,
      order: index + 1
    };
  });
}

/**
 * 예상 기간 방식 (종료일이 없는 경우)
 * projectPhaseUtils의 getPhaseEstimatedDuration 사용
 */
function generateEstimatedDurationPhases(
  project: Project,
  baseDate: Date,
  currentPhaseIndex: number
): TimelinePhase[] {
  let cumulativeDays = 0;
  const serviceCategory = project.category;

  return ALL_PHASES.map((phase, index) => {
    // 단계별 예상 기간 (일 단위)
    const duration = getPhaseEstimatedDuration(phase, serviceCategory);

    const phaseStart = new Date(baseDate.getTime() + cumulativeDays * 24 * 60 * 60 * 1000);
    const phaseEnd = new Date(phaseStart.getTime() + duration * 24 * 60 * 60 * 1000);

    cumulativeDays += duration;

    return {
      id: `phase-${index}`,
      name: PHASE_INFO[phase].label,
      startDate: phaseStart,
      endDate: phaseEnd,
      isCompleted: index < currentPhaseIndex,
      isCurrent: index === currentPhaseIndex,
      order: index + 1
    };
  });
}

/**
 * 현재 진행률 계산 (헤더와 동일한 로직)
 *
 * @param project 프로젝트
 * @returns 진행률 (0-100)
 *
 * @example
 * getPhaseProgress({ phase: 'execution' }); // 71 (5/7)
 */
export function getPhaseProgress(project: Project): number {
  const currentPhase = project.phase || 'contract_pending';
  const phaseIndex = getPhaseIndex(currentPhase);
  return Math.round(((phaseIndex + 1) / 7) * 100);
}

/**
 * 완료된 단계 개수 계산
 *
 * @param project 프로젝트
 * @returns [완료 단계, 전체 단계]
 *
 * @example
 * getCompletedPhases({ phase: 'execution' }); // [4, 7]
 */
export function getCompletedPhases(project: Project): [number, number] {
  const currentPhase = project.phase || 'contract_pending';
  const phaseIndex = getPhaseIndex(currentPhase);
  // phaseIndex는 0부터 시작하므로, 현재 단계 = phaseIndex + 1
  // 완료된 단계 = phaseIndex (현재 단계 직전까지)
  return [phaseIndex, 7];
}