/**
 * @fileoverview Activity Nodes - 활동 노드들
 * @description Layer 3: 모든 활동 노드 렌더링 (호버 효과 포함)
 * @author PocketCompany
 * @since 2025-01-30
 */

import React from 'react';
import { TIMELINE_CONSTANTS, BRANCH_STYLES, ACTIVITY_COLORS } from '../../../types/timeline-v3.types';
import type { BranchActivity } from '../../../types/timeline-v3.types';

/**
 * ActivityNodes Props
 */
interface ActivityNodesProps {
  activities: BranchActivity[];
  onActivityHover?: (activity: BranchActivity | null, event?: React.MouseEvent) => void;
  onActivityClick?: (activity: BranchActivity) => void;
  hoveredActivityId?: string | null;
}

/**
 * Activity Nodes 컴포넌트
 * - 모든 활동 노드 렌더링
 * - 호버 시 1.2배 확대 효과
 * - 클릭 이벤트 처리
 * - Phase 5: 순차 진입 애니메이션
 * - Phase 5-4: React.memo 최적화
 */
const ActivityNodes: React.FC<ActivityNodesProps> = React.memo(({
  activities,
  onActivityHover,
  onActivityClick,
  hoveredActivityId
}) => {
  return (
    <>
      {activities.map((activity, index) => {
        const endX = activity.branchX;
        const endY = activity.branchY;
        const style = BRANCH_STYLES[activity.type];
        const isHovered = hoveredActivityId === activity.id;

        // Phase 3: 타입별 색상 및 크기
        const typeConfig = ACTIVITY_COLORS[activity.type];
        const nodeSize = typeConfig.size;
        const nodeColor = typeConfig.primary;

        // Phase 5: 순차 애니메이션 delay (30ms씩)
        const animationDelay = index * 30;

        return (
          <g key={`node-${activity.id}`}>
            {/* 활동 노드 원형 (Phase 3: 타입별 색상/크기 적용) */}
            <circle
              cx={endX}
              cy={endY}
              r={isHovered ? nodeSize + 4 : nodeSize}
              fill={nodeColor}
              stroke="white"
              strokeWidth={2}
              filter={isHovered ? 'url(#node-glow)' : 'url(#node-shadow-enhanced)'}
              style={{
                cursor: onActivityClick ? 'pointer' : 'default',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: `fadeInScale 200ms ease-out ${animationDelay}ms forwards`,
                opacity: 0
              }}
              onClick={() => onActivityClick?.(activity)}
              onMouseEnter={(e) => onActivityHover?.(activity, e)}
              onMouseLeave={() => onActivityHover?.(null)}
            />

            {/* 활동 아이콘 - Phase 5-3: SVG 아이콘 사용 */}
            <use
              href={`#icon-${activity.type}`}
              x={endX - (isHovered ? 9 : 7)}
              y={endY - (isHovered ? 9 : 7)}
              width={isHovered ? 18 : 14}
              height={isHovered ? 18 : 14}
              color="white"
              style={{
                pointerEvents: 'none',
                transition: 'all 0.3s ease',
                animation: `fadeInScale 200ms ease-out ${animationDelay}ms forwards`,
                opacity: 0
              }}
            />

            {/* 활동 레이블 - Phase 5-3: 호버 효과 강화 */}
            <foreignObject
              x={endX + 12}
              y={endY - 12}
              width="200"
              height="24"
              style={{
                animation: `fadeInScale 200ms ease-out ${animationDelay}ms forwards`,
                opacity: 0
              }}
            >
              <div
                className="bg-white px-2 py-1 rounded text-xs border truncate cursor-pointer hover:bg-gray-50"
                style={{
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: isHovered
                    ? '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)'
                    : '0 1px 3px rgba(0, 0, 0, 0.1)',
                  pointerEvents: 'auto'
                }}
                onClick={() => onActivityClick?.(activity)}
                onMouseEnter={(e) => {
                  // MouseEvent를 React.MouseEvent로 변환
                  const reactEvent = e as unknown as React.MouseEvent;
                  onActivityHover?.(activity, reactEvent);
                }}
                onMouseLeave={() => onActivityHover?.(null)}
              >
                {activity.title}
              </div>
            </foreignObject>
          </g>
        );
      })}
    </>
  );
});

ActivityNodes.displayName = 'ActivityNodes';

export default ActivityNodes;