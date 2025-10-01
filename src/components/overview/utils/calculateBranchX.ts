/**
 * @fileoverview X좌표 계산 (겹침 방지)
 * @description 브랜치가 Y축에서 겹치지 않도록 X좌표 분산
 * @author PocketCompany
 * @since 2025-01-29
 */

import { TIMELINE_CONSTANTS } from '../../../types/timeline-v3.types';
import type { BranchActivity } from '../../../types/timeline-v3.types';

/**
 * 겹침 방지 X좌표 계산
 *
 * 근접한 활동들을 3개 레인에 순환 배치하고, 지그재그 패턴 적용
 *
 * @param activities 전체 활동 목록 (Y좌표 계산 완료된 상태)
 * @param currentIndex 현재 활동 인덱스
 * @param currentY 현재 활동 Y좌표
 * @returns X좌표 (브랜치 끝점 위치)
 *
 * @example
 * // 3개 활동이 Y축에서 근접한 경우
 * const x1 = calculateBranchX(activities, 0, 200); // 120px (레인 0)
 * const x2 = calculateBranchX(activities, 1, 215); // 180px (레인 1)
 * const x3 = calculateBranchX(activities, 2, 225); // 240px (레인 2)
 */
export const calculateBranchX = (
  activities: BranchActivity[],
  currentIndex: number,
  currentY: number
): number => {
  const {
    BRANCH_BASE_X,
    BRANCH_LANE_WIDTH,
    BRANCH_LANE_COUNT,
    BRANCH_ZIGZAG_OFFSET,
    PROXIMITY_THRESHOLD
  } = TIMELINE_CONSTANTS;

  // ========================================================================
  // 1. 근접 활동 찾기 (Y축 ±30px 이내)
  // ========================================================================
  const nearbyActivities = activities
    .slice(0, currentIndex) // 이전 활동들만 체크
    .filter(activity => {
      const yDiff = Math.abs(activity.branchY - currentY);
      return yDiff < PROXIMITY_THRESHOLD;
    });

  // ========================================================================
  // 2. 단독 활동 (근처에 아무도 없음)
  // ========================================================================
  if (nearbyActivities.length === 0) {
    return BRANCH_BASE_X; // 첫 번째 레인 (120px)
  }

  // ========================================================================
  // 3. 레인 인덱스 계산 (0, 1, 2 순환)
  // ========================================================================
  const laneIndex = nearbyActivities.length % BRANCH_LANE_COUNT;

  // ========================================================================
  // 4. 지그재그 패턴 적용
  // ========================================================================
  // 매 3개(BRANCH_LANE_COUNT)마다 한 사이클
  // 사이클마다 홀짝 전환하여 오프셋 적용
  const cycleIndex = Math.floor(nearbyActivities.length / BRANCH_LANE_COUNT);
  const zigzagOffset = cycleIndex % 2 === 1 ? BRANCH_ZIGZAG_OFFSET : 0;

  // ========================================================================
  // 5. 최종 X좌표 계산
  // ========================================================================
  const baseX = BRANCH_BASE_X + (laneIndex * BRANCH_LANE_WIDTH);
  const finalX = baseX + zigzagOffset;

  return finalX;
};

/**
 * 활동 밀도 분석
 * 특정 Y 범위 내 활동 개수를 계산
 *
 * @param activities 전체 활동 목록
 * @param centerY 중심 Y좌표
 * @param range 범위 (±range)
 * @returns 해당 범위 내 활동 개수
 */
export const getActivityDensity = (
  activities: BranchActivity[],
  centerY: number,
  range: number = TIMELINE_CONSTANTS.PROXIMITY_THRESHOLD
): number => {
  return activities.filter(activity => {
    const yDiff = Math.abs(activity.branchY - centerY);
    return yDiff <= range;
  }).length;
};

/**
 * 최대 브랜치 X좌표 계산
 * 모든 브랜치의 최대 길이 반환 (캔버스 너비 계산에 사용)
 *
 * @returns 최대 X좌표
 */
export const getMaxBranchX = (): number => {
  const {
    BRANCH_BASE_X,
    BRANCH_LANE_WIDTH,
    BRANCH_LANE_COUNT,
    BRANCH_ZIGZAG_OFFSET
  } = TIMELINE_CONSTANTS;

  // 최대값 = 기본 + (레인2 * 너비) + 지그재그
  return BRANCH_BASE_X + ((BRANCH_LANE_COUNT - 1) * BRANCH_LANE_WIDTH) + BRANCH_ZIGZAG_OFFSET;
};