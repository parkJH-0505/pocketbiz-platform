/**
 * @fileoverview Phase 기반 Y좌표 할당
 * @description Phase 내에서 순서대로 노드 배치 (겹침 없이)
 * @author PocketCompany
 * @since 2025-01-30
 */

import { TIMELINE_CONSTANTS } from '../../../types/timeline-v3.types';
import type { BranchActivity, TimelinePhase } from '../../../types/timeline-v3.types';
import { calculateBranchY } from './calculateBranchY';

/**
 * Phase별로 activities 그룹핑
 *
 * @param activities 전체 활동 목록
 * @param phases 프로젝트 단계 목록
 * @returns Phase ID를 키로 하는 Map
 */
const groupActivitiesByPhase = (
  activities: Omit<BranchActivity, 'actualY' | 'displayY' | 'phaseId' | 'indexInPhase'>[],
  phases: TimelinePhase[]
): Map<string, typeof activities> => {
  const grouped = new Map<string, typeof activities>();

  // Phase 초기화
  phases.forEach(phase => {
    grouped.set(phase.id, []);
  });

  // 활동을 해당 Phase에 할당
  activities.forEach(activity => {
    const activityTime = activity.timestamp.getTime();

    // 어느 Phase에 속하는지 찾기
    for (const phase of phases) {
      const phaseStart = new Date(phase.startDate || Date.now()).getTime();
      const phaseEnd = new Date(phase.endDate || phase.startDate || Date.now()).getTime();

      if (activityTime >= phaseStart && activityTime <= phaseEnd) {
        const phaseActivities = grouped.get(phase.id) || [];
        phaseActivities.push(activity);
        grouped.set(phase.id, phaseActivities);
        break; // 첫 번째 매칭된 Phase에만 할당
      }
    }
  });

  return grouped;
};

/**
 * Phase 기반 Y좌표 할당
 *
 * - actualY: 실제 발생 시점 (시간 비례)
 * - displayY: Phase 내 순서 기반 (일정 간격)
 *
 * @param activities 전체 활동 목록 (좌표 없음)
 * @param phases 프로젝트 단계 목록
 * @param phaseYPositions Phase별 시작 Y좌표
 * @param projectStart 프로젝트 시작 시간
 * @param projectEnd 프로젝트 종료 시간
 * @param totalHeight 전체 타임라인 높이
 * @returns 좌표가 할당된 활동 목록
 */
export const assignPhaseBasedYCoordinates = (
  activities: Omit<BranchActivity, 'actualY' | 'displayY' | 'phaseId' | 'indexInPhase' | 'branchX'>[],
  phases: TimelinePhase[],
  phaseYPositions: number[],
  projectStart: Date,
  projectEnd: Date,
  totalHeight: number
): Omit<BranchActivity, 'branchX'>[] => {
  const NODE_HEIGHT = 40; // 노드 간 간격 (px)
  const PHASE_PADDING_TOP = 20; // Phase 상단 여백 (px)

  // Step 1: Phase별로 그룹핑
  const activitiesByPhase = groupActivitiesByPhase(activities, phases);

  const result: Omit<BranchActivity, 'branchX'>[] = [];

  // Step 2: 각 Phase 처리
  phases.forEach((phase, phaseIndex) => {
    const phaseActivities = activitiesByPhase.get(phase.id) || [];
    const phaseStartY = phaseYPositions[phaseIndex];

    if (phaseActivities.length === 0) {
      return; // 활동이 없으면 스킵
    }

    // Step 3: Phase 내에서 시간순 정렬
    const sorted = [...phaseActivities].sort((a, b) =>
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Step 4: 각 활동에 좌표 할당
    sorted.forEach((activity, index) => {
      // actualY: 실제 발생 시점 (시간 비례)
      const actualY = calculateBranchY(
        activity.timestamp,
        projectStart,
        projectEnd,
        totalHeight
      );

      // displayY: Phase 내 순서 기반
      const displayY = phaseStartY + PHASE_PADDING_TOP + (index * NODE_HEIGHT);

      result.push({
        ...activity,
        actualY,
        displayY,
        phaseId: phase.id,
        indexInPhase: index
      });
    });
  });

  return result;
};

/**
 * Phase별 활동 개수 계산
 *
 * @param activities 전체 활동 목록
 * @param phases 프로젝트 단계 목록
 * @returns Phase ID를 키로 하는 개수 Map
 */
export const getActivityCountByPhase = (
  activities: { timestamp: Date }[],
  phases: TimelinePhase[]
): Map<string, number> => {
  const counts = new Map<string, number>();

  phases.forEach(phase => {
    counts.set(phase.id, 0);
  });

  activities.forEach(activity => {
    const activityTime = activity.timestamp.getTime();

    for (const phase of phases) {
      const phaseStart = new Date(phase.startDate || Date.now()).getTime();
      const phaseEnd = new Date(phase.endDate || phase.startDate || Date.now()).getTime();

      if (activityTime >= phaseStart && activityTime <= phaseEnd) {
        const currentCount = counts.get(phase.id) || 0;
        counts.set(phase.id, currentCount + 1);
        break;
      }
    }
  });

  return counts;
};
