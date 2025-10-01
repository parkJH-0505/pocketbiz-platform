/**
 * @fileoverview 구간 높이 계산 (동적 조정)
 * @description 활동 밀도에 따라 프로젝트 단계별 높이 자동 조정
 * @author PocketCompany
 * @since 2025-01-29
 */

import { TIMELINE_CONSTANTS } from '../../../types/timeline-v3.types';
import type { BranchActivity } from '../../../types/timeline-v3.types';
import type { Project } from '../../../types/buildup.types';

/**
 * 프로젝트 단계별 구간 높이 계산
 *
 * 활동 5개 이하: 240px 고정
 * 활동 5개 초과: 활동당 30px씩 증가
 * 최대 480px 제한
 *
 * @param phase 프로젝트 단계
 * @param activities 해당 단계의 활동들
 * @returns 구간 높이 (240px ~ 480px)
 *
 * @example
 * // 활동 3개 → 240px
 * calculatePhaseHeight(phase, [a1, a2, a3]);
 *
 * // 활동 7개 → 300px (240 + 2*30)
 * calculatePhaseHeight(phase, [a1, a2, a3, a4, a5, a6, a7]);
 *
 * // 활동 20개 → 480px (최대값)
 * calculatePhaseHeight(phase, [...20 activities]);
 */
export const calculatePhaseHeight = (
  phase: Project['phases'][0],
  activities: BranchActivity[]
): number => {
  const {
    PHASE_BASE_HEIGHT,
    PHASE_MAX_HEIGHT,
    PHASE_ACTIVITY_THRESHOLD,
    PHASE_ACTIVITY_HEIGHT
  } = TIMELINE_CONSTANTS;

  // ========================================================================
  // 1. 해당 단계에 속한 활동들 필터링
  // ========================================================================
  const phaseStart = new Date(phase.startDate || Date.now());
  const phaseEnd = new Date(phase.endDate || phase.startDate || Date.now());

  const phaseActivities = activities.filter(activity => {
    const activityTime = activity.timestamp.getTime();
    return activityTime >= phaseStart.getTime() && activityTime <= phaseEnd.getTime();
  });

  const activityCount = phaseActivities.length;

  // ========================================================================
  // 2. 활동 5개 이하 → 기본 높이
  // ========================================================================
  if (activityCount <= PHASE_ACTIVITY_THRESHOLD) {
    return PHASE_BASE_HEIGHT;
  }

  // ========================================================================
  // 3. 활동 5개 초과 → 동적 확장
  // ========================================================================
  const extraCount = activityCount - PHASE_ACTIVITY_THRESHOLD;
  const extraHeight = extraCount * PHASE_ACTIVITY_HEIGHT;
  const calculatedHeight = PHASE_BASE_HEIGHT + extraHeight;

  // ========================================================================
  // 4. 최대 높이 제한
  // ========================================================================
  const finalHeight = Math.min(calculatedHeight, PHASE_MAX_HEIGHT);

  return finalHeight;
};

/**
 * 전체 타임라인 높이 계산
 *
 * @param project 프로젝트
 * @param activities 전체 활동 목록
 * @returns 전체 타임라인 높이
 */
export const calculateTotalTimelineHeight = (
  project: Project,
  activities: BranchActivity[]
): number => {
  const { CANVAS_PADDING_TOP, CANVAS_PADDING_BOTTOM } = TIMELINE_CONSTANTS;

  if (!project.phases || project.phases.length === 0) {
    // 단계가 없으면 기본 높이
    return TIMELINE_CONSTANTS.PHASE_BASE_HEIGHT + CANVAS_PADDING_TOP + CANVAS_PADDING_BOTTOM;
  }

  // 각 단계별 높이 계산
  const phaseHeights = project.phases.map(phase =>
    calculatePhaseHeight(phase, activities)
  );

  // 전체 높이 = 상단 여백 + 모든 단계 높이 합 + 하단 여백
  const totalHeight = phaseHeights.reduce((sum, height) => sum + height, 0)
    + CANVAS_PADDING_TOP
    + CANVAS_PADDING_BOTTOM;

  return totalHeight;
};

/**
 * 단계별 누적 Y좌표 계산
 * 각 단계가 시작되는 Y좌표 반환
 *
 * @param project 프로젝트
 * @param activities 전체 활동 목록
 * @returns 단계별 시작 Y좌표 배열
 *
 * @example
 * // [60, 300, 570] → 첫 단계 60px, 두 번째 300px, 세 번째 570px에서 시작
 */
export const getPhaseYPositions = (
  project: Project,
  activities: BranchActivity[]
): number[] => {
  const { CANVAS_PADDING_TOP } = TIMELINE_CONSTANTS;

  if (!project.phases || project.phases.length === 0) {
    return [CANVAS_PADDING_TOP];
  }

  const positions: number[] = [];
  let currentY = CANVAS_PADDING_TOP;

  project.phases.forEach(phase => {
    positions.push(currentY);
    const phaseHeight = calculatePhaseHeight(phase, activities);
    currentY += phaseHeight;
  });

  return positions;
};