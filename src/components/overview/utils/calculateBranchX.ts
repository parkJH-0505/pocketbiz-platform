/**
 * @fileoverview X좌표 계산 (타입별 고정 레인)
 * @description Phase 7 작업 2: 활동 타입별 고정 레인 시스템
 * @author PocketCompany
 * @since 2025-01-29
 */

import { TIMELINE_CONSTANTS, LANE_ASSIGNMENT } from '../../../types/timeline-v3.types';
import type { BranchActivity } from '../../../types/timeline-v3.types';

/**
 * 타입별 고정 레인 X좌표 계산 (Phase 7: 작업 2)
 *
 * 각 활동 타입은 고정 레인에 배치:
 * - file: Lane 0 (400px)
 * - meeting: Lane 1 (500px)
 * - comment: Lane 2 (600px)
 * - todo: Lane 3 (700px)
 *
 * 동일 타입 내에서 Y축 근접 시에만 약간의 오프셋 적용 (지그재그)
 *
 * @param activities 전체 활동 목록 (Y좌표 계산 완료된 상태)
 * @param currentIndex 현재 활동 인덱스
 * @param currentY 현재 활동 Y좌표
 * @returns X좌표 (브랜치 끝점 위치)
 *
 * @example
 * // file 타입: 항상 400px (Lane 0)
 * const x1 = calculateBranchX(fileActivities, 0, 200); // 400px
 *
 * // meeting 타입: 항상 500px (Lane 1)
 * const x2 = calculateBranchX(meetingActivities, 0, 200); // 500px
 *
 * // 동일 타입에서 근접한 경우: 약간 오프셋
 * const x3 = calculateBranchX(fileActivities, 1, 215); // 430px (400 + 30)
 */
export const calculateBranchX = (
  activities: BranchActivity[],
  currentIndex: number,
  currentY: number
): number => {
  const {
    BRANCH_BASE_X,
    BRANCH_LANE_WIDTH,
    BRANCH_ZIGZAG_OFFSET,
    PROXIMITY_THRESHOLD
  } = TIMELINE_CONSTANTS;

  const currentActivity = activities[currentIndex];
  const currentType = currentActivity.type;

  // ========================================================================
  // 1. 타입별 기본 레인 결정 (고정)
  // ========================================================================
  const baseLane = LANE_ASSIGNMENT[currentType];
  const baseX = BRANCH_BASE_X + (baseLane * BRANCH_LANE_WIDTH);

  // ========================================================================
  // 2. 동일 타입 & 근접 활동 찾기 (Y축 ±60px 이내)
  // ========================================================================
  const nearbyActivitiesSameType = activities
    .slice(0, currentIndex) // 이전 활동들만 체크
    .filter(activity => {
      const isSameType = activity.type === currentType;
      const yDiff = Math.abs(activity.displayY - currentY);
      const isNearby = yDiff < PROXIMITY_THRESHOLD;
      return isSameType && isNearby;
    });

  // ========================================================================
  // 3. 동일 타입 근접 활동이 없으면 기본 위치 반환
  // ========================================================================
  if (nearbyActivitiesSameType.length === 0) {
    return baseX;
  }

  // ========================================================================
  // 4. 지그재그 오프셋 적용 (동일 타입 내 근접 시)
  // ========================================================================
  // 홀수 번째 근접 활동: 오른쪽으로 30px 이동
  const zigzagOffset = nearbyActivitiesSameType.length % 2 === 1
    ? BRANCH_ZIGZAG_OFFSET
    : 0;

  // ========================================================================
  // 5. 최종 X좌표 계산
  // ========================================================================
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
    const yDiff = Math.abs(activity.displayY - centerY);
    return yDiff <= range;
  }).length;
};

/**
 * 최대 브랜치 X좌표 계산 (Phase 7: 4레인 시스템)
 * 모든 브랜치의 최대 길이 반환 (캔버스 너비 계산에 사용)
 *
 * @returns 최대 X좌표 (730px = 400 + 3*100 + 30)
 *
 * @example
 * // Lane 3 (todo): 700px
 * // + ZIGZAG_OFFSET: 30px
 * // = 730px
 */
export const getMaxBranchX = (): number => {
  const {
    BRANCH_BASE_X,
    BRANCH_LANE_WIDTH,
    BRANCH_LANE_COUNT,
    BRANCH_ZIGZAG_OFFSET
  } = TIMELINE_CONSTANTS;

  // 최대값 = 기본 + (마지막 레인 * 너비) + 지그재그
  return BRANCH_BASE_X + ((BRANCH_LANE_COUNT - 1) * BRANCH_LANE_WIDTH) + BRANCH_ZIGZAG_OFFSET;
};