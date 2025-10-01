/**
 * @fileoverview Branch Paths - 브랜치 경로들
 * @description Layer 3: 모든 브랜치 경로 렌더링 (3차 베지어 곡선)
 * Phase 6: Primary 파랑 계열 통일, 투명도로 차별화
 * @author PocketCompany
 * @since 2025-01-30
 */

import React from 'react';
import { TIMELINE_CONSTANTS, TIMELINE_DESIGN_SYSTEM } from '../../../types/timeline-v3.types';
import type { BranchActivity } from '../../../types/timeline-v3.types';
import { generateBranchPath } from '../utils/generateBranchPath';

/**
 * BranchPaths Props
 */
interface BranchPathsProps {
  activities: BranchActivity[];
  onBranchHover?: (branchId: string | null) => void;
  hoveredActivityId?: string | null; // Phase 7: Activity hover 시 해당 branch 하이라이트
}

/**
 * Branch Paths 컴포넌트
 * - 모든 브랜치 경로를 3차 베지어 곡선으로 렌더링
 * - 타입별 색상 및 선 스타일 적용
 * - Phase 5: 순차 진입 애니메이션
 * - Phase 5-4: React.memo 최적화
 * - Phase 7: Hover 인터랙션 연동
 */
const BranchPaths: React.FC<BranchPathsProps> = React.memo(({
  activities,
  onBranchHover,
  hoveredActivityId
}) => {
  return (
    <>
      {activities.map((activity, index) => {
        // Phase 6: 통합 디자인 시스템 (Primary 파랑 계열)
        const typeConfig = TIMELINE_DESIGN_SYSTEM.activityType[activity.type];
        const branchColor = typeConfig.main;
        const strokeWidth = typeConfig.strokeWidth;
        const strokeOpacity = typeConfig.strokeOpacity;

        // Phase 7: Activity hover 시 해당 branch 하이라이트
        const isHighlighted = hoveredActivityId === activity.id;

        // Phase 5 Step 2: 레인 인덱스 계산 (X 좌표로부터 역산)
        const { BRANCH_BASE_X, BRANCH_LANE_WIDTH } = TIMELINE_CONSTANTS;
        const laneIndex = Math.round((activity.branchX - BRANCH_BASE_X) / BRANCH_LANE_WIDTH);
        const clampedLaneIndex = Math.max(0, Math.min(2, laneIndex)); // 0~2 범위로 제한

        // 3차 베지어 곡선 경로 생성 (레인별 차등 아치)
        const pathData = generateBranchPath(
          TIMELINE_CONSTANTS.MAIN_AXIS_LEFT,  // 시작 X (200px)
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
            strokeWidth={isHighlighted ? strokeWidth + 2 : strokeWidth}
            fill="none"
            className="branch-path"
            strokeOpacity={isHighlighted ? 1.0 : strokeOpacity}
            style={{
              transition: TIMELINE_DESIGN_SYSTEM.transitions.hover,
              cursor: onBranchHover ? 'pointer' : 'default',
              filter: isHighlighted
                ? TIMELINE_DESIGN_SYSTEM.shadows.nodeHover
                : TIMELINE_DESIGN_SYSTEM.shadows.branch,
              animation: `fadeInBranch 400ms ease-out ${animationDelay}ms forwards`,
              opacity: 0
            }}
            onMouseEnter={(e) => {
              onBranchHover?.(activity.id);
              // Phase 6: 호버 시 Primary 파랑 강조
              e.currentTarget.style.strokeWidth = `${strokeWidth + 2}`;
              e.currentTarget.style.strokeOpacity = '1.0';
              e.currentTarget.style.filter = TIMELINE_DESIGN_SYSTEM.shadows.nodeHover;
            }}
            onMouseLeave={(e) => {
              onBranchHover?.(null);
              e.currentTarget.style.strokeWidth = isHighlighted ? `${strokeWidth + 2}` : `${strokeWidth}`;
              e.currentTarget.style.strokeOpacity = isHighlighted ? '1.0' : `${strokeOpacity}`;
              e.currentTarget.style.filter = isHighlighted
                ? TIMELINE_DESIGN_SYSTEM.shadows.nodeHover
                : TIMELINE_DESIGN_SYSTEM.shadows.branch;
            }}
          />
        );
      })}
    </>
  );
});

BranchPaths.displayName = 'BranchPaths';

export default BranchPaths;