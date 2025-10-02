/**
 * @fileoverview Branch Paths - 브랜치 경로들
 * @description Layer 3: 모든 브랜치 경로 렌더링 (3차 베지어 곡선)
 * Phase 6: Primary 파랑 계열 통일, 투명도로 차별화
 * Phase 7-5: Visible.vc 스타일 강한 Glow 적용
 * @author PocketCompany
 * @since 2025-01-30
 */

import React from 'react';
import { TIMELINE_CONSTANTS, TIMELINE_DESIGN_SYSTEM } from '../../../types/timeline-v3.types';
import type { BranchActivity } from '../../../types/timeline-v3.types';
import { generateOrthogonalPath } from '../utils/generateBranchPath';

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
 * - 타입별 차분한 색상 + 강한 Glow (Visible.vc 스타일)
 * - Phase 5: 순차 진입 애니메이션
 * - Phase 5-4: React.memo 최적화
 * - Phase 7: Hover 인터랙션 연동
 * - Phase 7: 타입별 색상 구분 (차분한 톤)
 */
const BranchPaths: React.FC<BranchPathsProps> = React.memo(({
  activities,
  onBranchHover,
  hoveredActivityId
}) => {
  return (
    <>
      {activities.map((activity, index) => {
        // Phase 7: 타입별 색상 및 strokeWidth 적용
        const typeConfig = TIMELINE_DESIGN_SYSTEM.activityType[activity.type];
        const branchColor = typeConfig.main;
        const strokeWidth = typeConfig.strokeWidth;

        // Phase 7: Activity hover 시 해당 branch 하이라이트
        const isHighlighted = hoveredActivityId === activity.id;

        // Phase 5 Step 2: 레인 인덱스 계산 (X 좌표로부터 역산)
        const { BRANCH_BASE_X, BRANCH_LANE_WIDTH } = TIMELINE_CONSTANTS;
        const laneIndex = Math.round((activity.branchX - BRANCH_BASE_X) / BRANCH_LANE_WIDTH);
        const clampedLaneIndex = Math.max(0, Math.min(2, laneIndex)); // 0~2 범위로 제한

        // 직각선 경로 생성 (Phase 7: actualY → displayY)
        const pathData = generateOrthogonalPath(
          TIMELINE_CONSTANTS.MAIN_AXIS_LEFT,  // 시작 X (200px)
          activity.actualY,                   // 시작 Y (실제 발생 시점)
          activity.branchX,                   // 종료 X
          activity.displayY,                  // 종료 Y (배치된 위치)
          clampedLaneIndex,                   // 레인 인덱스 (0~2)
          8                                   // cornerRadius: 모서리 둥글게
        );

        // Phase 5: 순차 애니메이션 delay (50ms씩)
        const animationDelay = index * 50;

        return (
          <g key={`branch-${activity.id}`}>
            {/* Glow 레이어 (blur로 glow 효과 - 꺾인 부분 겹침 방지) */}
            <path
              d={pathData}
              stroke={branchColor}
              strokeWidth={isHighlighted ? strokeWidth + 4 : strokeWidth + 2}
              fill="none"
              strokeOpacity={isHighlighted ? 0.3 : 0.15}
              style={{
                filter: 'blur(4px)',
                animation: `fadeInBranch 400ms ease-out ${animationDelay}ms forwards`,
                opacity: 0,
                pointerEvents: 'none'
              }}
            />

            {/* 메인 브랜치 path */}
            <path
              d={pathData}
              stroke={branchColor}
              strokeWidth={isHighlighted ? strokeWidth + 2 : strokeWidth}
              fill="none"
              className="branch-path"
              style={{
                transition: TIMELINE_DESIGN_SYSTEM.transitions.hover,
                cursor: onBranchHover ? 'pointer' : 'default',
                animation: `fadeInBranch 400ms ease-out ${animationDelay}ms forwards`,
                opacity: 0
              }}
              onMouseEnter={(e) => {
                onBranchHover?.(activity.id);
                e.currentTarget.style.strokeWidth = `${strokeWidth + 2}`;
              }}
              onMouseLeave={(e) => {
                onBranchHover?.(null);
                e.currentTarget.style.strokeWidth = isHighlighted ? `${strokeWidth + 2}` : `${strokeWidth}`;
              }}
            />
          </g>
        );
      })}
    </>
  );
});

BranchPaths.displayName = 'BranchPaths';

export default BranchPaths;