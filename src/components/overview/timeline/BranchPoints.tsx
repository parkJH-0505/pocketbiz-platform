/**
 * @fileoverview Branch Points - 분기점 노드들
 * @description Layer 3: 메인 축에서 브랜치가 시작되는 지점 표시
 * @author PocketCompany
 * @since 2025-01-30
 */

import React from 'react';
import { TIMELINE_CONSTANTS, TIMELINE_DESIGN_SYSTEM } from '../../../types/timeline-v3.types';
import type { BranchActivity } from '../../../types/timeline-v3.types';

/**
 * BranchPoints Props
 */
interface BranchPointsProps {
  activities: BranchActivity[];
}

/**
 * Branch Points 컴포넌트
 * - 각 브랜치의 시작점을 메인 축에 작은 노드로 표시
 * - 타입별 색상 구분
 * - 순차 진입 애니메이션
 */
const BranchPoints: React.FC<BranchPointsProps> = React.memo(({ activities }) => {
  return (
    <>
      {activities.map((activity, index) => {
        // 타입별 색상
        const typeConfig = TIMELINE_DESIGN_SYSTEM.activityType[activity.type];
        const pointColor = typeConfig.main;

        // 순차 애니메이션 delay (BranchPaths보다 약간 먼저 - 30ms씩)
        const animationDelay = index * 30;

        return (
          <circle
            key={`branch-point-${activity.id}`}
            cx={TIMELINE_CONSTANTS.MAIN_AXIS_LEFT}
            cy={activity.actualY}  // Phase 7: 실제 발생 시점 (메인 축)
            r={5}
            fill={pointColor}
            stroke="white"
            strokeWidth={1.5}
            style={{
              animation: `fadeInScale 200ms ease-out ${animationDelay}ms forwards`,
              opacity: 0,
              filter: 'drop-shadow(0 0 3px rgba(0, 0, 0, 0.2))'
            }}
          />
        );
      })}
    </>
  );
});

BranchPoints.displayName = 'BranchPoints';

export default BranchPoints;
