/**
 * @fileoverview Branch Paths - 브랜치 경로들
 * @description Layer 3: 모든 브랜치 경로 렌더링 (3차 베지어 곡선)
 * @author PocketCompany
 * @since 2025-01-30
 */

import React from 'react';
import { TIMELINE_CONSTANTS, BRANCH_STYLES, ACTIVITY_COLORS } from '../../../types/timeline-v3.types';
import type { BranchActivity } from '../../../types/timeline-v3.types';
import { generateBranchPath } from '../utils/generateBranchPath';

/**
 * BranchPaths Props
 */
interface BranchPathsProps {
  activities: BranchActivity[];
  onBranchHover?: (branchId: string | null) => void;
}

/**
 * Branch Paths 컴포넌트
 * - 모든 브랜치 경로를 3차 베지어 곡선으로 렌더링
 * - 타입별 색상 및 선 스타일 적용
 * - Phase 5: 순차 진입 애니메이션
 * - Phase 5-4: React.memo 최적화
 */
const BranchPaths: React.FC<BranchPathsProps> = React.memo(({
  activities,
  onBranchHover
}) => {
  return (
    <>
      {activities.map((activity, index) => {
        const style = BRANCH_STYLES[activity.type];

        // Phase 3: 타입별 색상
        const typeConfig = ACTIVITY_COLORS[activity.type];
        const branchColor = typeConfig.primary;

        // Phase 5 Step 2: 레인 인덱스 계산 (X 좌표로부터 역산)
        const { BRANCH_BASE_X, BRANCH_LANE_WIDTH } = TIMELINE_CONSTANTS;
        const laneIndex = Math.round((activity.branchX - BRANCH_BASE_X) / BRANCH_LANE_WIDTH);
        const clampedLaneIndex = Math.max(0, Math.min(2, laneIndex)); // 0~2 범위로 제한

        // 3차 베지어 곡선 경로 생성 (레인별 차등 아치)
        const pathData = generateBranchPath(
          TIMELINE_CONSTANTS.MAIN_AXIS_LEFT,  // 시작 X (120px)
          activity.branchY,                   // 시작 Y
          activity.branchX,                   // 종료 X
          activity.branchY,                   // 종료 Y
          clampedLaneIndex                    // 레인 인덱스 (0~2)
        );

        // Phase 5: 순차 애니메이션 delay (50ms씩)
        const animationDelay = index * 50;

        return (
          <path
            key={`branch-${activity.id}`}
            d={pathData}
            stroke={branchColor}
            strokeWidth={4}
            strokeDasharray={style.strokeDasharray}
            fill="none"
            className="branch-path"
            strokeOpacity={0.7}
            style={{
              transition: 'stroke-width 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease',
              cursor: onBranchHover ? 'pointer' : 'default',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              animation: `fadeInBranch 400ms ease-out ${animationDelay}ms forwards`,
              opacity: 0
            }}
            onMouseEnter={(e) => {
              onBranchHover?.(activity.id);
              // Phase 3: 호버 시 시각 효과
              e.currentTarget.style.strokeWidth = '6';
              e.currentTarget.style.strokeOpacity = '0.9';
              e.currentTarget.style.filter = 'drop-shadow(0 3px 6px rgba(0,0,0,0.3))';
            }}
            onMouseLeave={(e) => {
              onBranchHover?.(null);
              e.currentTarget.style.strokeWidth = '4';
              e.currentTarget.style.strokeOpacity = '0.7';
              e.currentTarget.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))';
            }}
          />
        );
      })}
    </>
  );
});

BranchPaths.displayName = 'BranchPaths';

export default BranchPaths;