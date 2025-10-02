/**
 * @fileoverview Activity Nodes - 활동 노드들
 * @description Layer 3: 모든 활동 노드 렌더링 (호버 효과 포함)
 * Phase 6: Primary 파랑 계열 통일, Glassmorphism 적용
 * @author PocketCompany
 * @since 2025-01-30
 */

import React from 'react';
import { TIMELINE_CONSTANTS, TIMELINE_DESIGN_SYSTEM } from '../../../types/timeline-v3.types';
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
        const endY = activity.displayY;  // Phase 7: 배치된 위치 사용
        const isHovered = hoveredActivityId === activity.id;

        // Phase 6: 통합 디자인 시스템 사용 (Primary 파랑 계열)
        const typeConfig = TIMELINE_DESIGN_SYSTEM.activityType[activity.type];
        const nodeSize = typeConfig.size;
        const nodeColor = typeConfig.main;

        // Phase 5: 순차 애니메이션 delay (30ms씩)
        const animationDelay = index * 30;

        // Phase 7: 날짜 포맷 (10월 2일)
        const formattedDate = activity.timestamp.toLocaleDateString('ko-KR', {
          month: 'long',
          day: 'numeric'
        });

        return (
          <g key={`node-${activity.id}`}>
            {/* 활동 노드 원형 - Phase 6: Primary 파랑 계열 */}
            <circle
              cx={endX}
              cy={endY}
              r={isHovered ? nodeSize + 4 : nodeSize}
              fill={nodeColor}
              stroke="white"
              strokeWidth={2}
              style={{
                cursor: onActivityClick ? 'pointer' : 'default',
                transition: TIMELINE_DESIGN_SYSTEM.transitions.hover,
                animation: `fadeInScale 200ms ease-out ${animationDelay}ms forwards`,
                opacity: 0,
                filter: isHovered
                  ? TIMELINE_DESIGN_SYSTEM.shadows.nodeHover
                  : TIMELINE_DESIGN_SYSTEM.shadows.node
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

            {/* 활동 레이블 - Phase 6: Glassmorphism */}
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
                className="px-2 py-1 rounded text-xs truncate cursor-pointer"
                style={{
                  background: isHovered
                    ? TIMELINE_DESIGN_SYSTEM.dataScience.glassEffect.background
                    : 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: isHovered
                    ? TIMELINE_DESIGN_SYSTEM.dataScience.glassEffect.backdropFilter
                    : 'blur(8px)',
                  WebkitBackdropFilter: isHovered
                    ? TIMELINE_DESIGN_SYSTEM.dataScience.glassEffect.WebkitBackdropFilter
                    : 'blur(8px)',
                  border: isHovered
                    ? TIMELINE_DESIGN_SYSTEM.dataScience.glassEffect.border
                    : '1px solid rgba(15, 82, 222, 0.08)',
                  color: TIMELINE_DESIGN_SYSTEM.phaseStatus.current,
                  fontSize: TIMELINE_DESIGN_SYSTEM.typography.activityMeta.size,
                  fontWeight: TIMELINE_DESIGN_SYSTEM.typography.activityTitle.weight,
                  transition: TIMELINE_DESIGN_SYSTEM.transitions.hover,
                  transform: isHovered ? 'scale(1.1) translateY(-2px)' : 'scale(1)',
                  boxShadow: isHovered
                    ? TIMELINE_DESIGN_SYSTEM.shadows.glassmorphism
                    : TIMELINE_DESIGN_SYSTEM.shadows.node,
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

            {/* 날짜 표시 - Phase 7: 노드 오른쪽에 별도 표시 */}
            <text
              x={endX + 220}
              y={endY + 4}
              fontSize="10"
              fill="rgb(113, 113, 122)"
              textAnchor="start"
              style={{
                animation: `fadeInScale 200ms ease-out ${animationDelay + 50}ms forwards`,
                opacity: 0,
                fontWeight: '500'
              }}
            >
              {formattedDate}
            </text>
          </g>
        );
      })}
    </>
  );
});

ActivityNodes.displayName = 'ActivityNodes';

export default ActivityNodes;