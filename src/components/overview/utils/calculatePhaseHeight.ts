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
 * 프로젝트 단계별 구간 높이 계산 (Phase 7: 노드 기반 간소화)
 *
 * 높이 = 상단여백 + (노드 개수 * 노드 높이) + 하단여백
 *
 * @param phase 프로젝트 단계
 * @param activities 해당 단계의 활동들
 * @returns 구간 높이
 *
 * @example
 * // 활동 0개 → 80px (최소 높이)
 * calculatePhaseHeight(phase, []);
 *
 * // 활동 3개 → 20 + 120 + 20 = 160px
 * calculatePhaseHeight(phase, [a1, a2, a3]);
 *
 * // 활동 10개 → 20 + 400 + 20 = 440px
 * calculatePhaseHeight(phase, [...10 activities]);
 */
export const calculatePhaseHeight = (
  phase: Project['phases'][0],
  activities: BranchActivity[]
): number => {
  const NODE_HEIGHT = 40;         // 노드 간 간격 (px)
  const PADDING_TOP = 20;         // Phase 상단 여백 (px)
  const PADDING_BOTTOM = 20;      // Phase 하단 여백 (px)
  const MIN_HEIGHT = 80;          // 최소 높이 (활동이 없을 때)

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
  // 2. 활동이 없으면 최소 높이
  // ========================================================================
  if (activityCount === 0) {
    return MIN_HEIGHT;
  }

  // ========================================================================
  // 3. 높이 계산 (노드 개수 기반)
  // ========================================================================
  const calculatedHeight = PADDING_TOP + (activityCount * NODE_HEIGHT) + PADDING_BOTTOM;

  return calculatedHeight;
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