/**
 * @fileoverview Phase Nodes - 단계 노드들
 * @description Layer 3: 프로젝트 단계 노드 렌더링
 * Phase 6: Primary 파랑 계열 통일, Glassmorphism 적용
 * @author PocketCompany
 * @since 2025-01-30
 */

import React from 'react';
import { TIMELINE_CONSTANTS, TIMELINE_DESIGN_SYSTEM } from '../../../types/timeline-v3.types';
import type { TimelinePhase } from '../../../types/timeline-v3.types';

/**
 * PhaseNodes Props
 */
interface PhaseNodesProps {
  phases: TimelinePhase[];
  yPositions: number[];
  onPhaseClick?: (phaseId: string) => void;
}

/**
 * Phase Nodes 컴포넌트
 * - 단계별 노드 렌더링
 * - 완료/진행중/예정 상태 표시
 * - 펄스 애니메이션 (진행중 단계)
 * - Phase 5: 순차 진입 애니메이션
 * - Phase 5-4: React.memo 최적화
 */
const PhaseNodes: React.FC<PhaseNodesProps> = React.memo(({
  phases,
  yPositions,
  onPhaseClick
}) => {
  return (
    <>
      {phases.map((phase, index) => {
        const y = yPositions[index];
        const isCompleted = phase.isCompleted;
        const isCurrentPhase = phase.isCurrent;

        // Phase 6: 통합 디자인 시스템 (Primary 파랑 계열)
        const phaseColor = isCompleted
          ? TIMELINE_DESIGN_SYSTEM.phaseStatus.completed
          : isCurrentPhase
          ? TIMELINE_DESIGN_SYSTEM.phaseStatus.current
          : TIMELINE_DESIGN_SYSTEM.phaseStatus.upcoming;

        // Phase 5: 순차 애니메이션 delay (200ms씩)
        const animationDelay = index * 200;

        return (
          <g key={phase.id}>
            {/* Phase 박스 (왼쪽) - Phase 6: Glassmorphism */}
            <foreignObject
              x={10}
              y={y - 32}
              width={TIMELINE_CONSTANTS.PHASE_BOX_WIDTH - 20}
              height={64}
              style={{
                animation: `fadeInScale 300ms ease-out ${animationDelay}ms forwards`,
                opacity: 0
              }}
            >
              <div
                className="h-full p-2.5 rounded-lg border-l-4"
                style={{
                  background: TIMELINE_DESIGN_SYSTEM.dataScience.glassEffect.background,
                  backdropFilter: TIMELINE_DESIGN_SYSTEM.dataScience.glassEffect.backdropFilter,
                  WebkitBackdropFilter: TIMELINE_DESIGN_SYSTEM.dataScience.glassEffect.WebkitBackdropFilter,
                  borderLeft: `4px solid ${phaseColor}`,
                  border: TIMELINE_DESIGN_SYSTEM.dataScience.glassEffect.border,
                  boxShadow: TIMELINE_DESIGN_SYSTEM.shadows.phaseBox,
                  transition: TIMELINE_DESIGN_SYSTEM.transitions.hover,
                  cursor: onPhaseClick ? 'pointer' : 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = TIMELINE_DESIGN_SYSTEM.shadows.glassmorphism;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = TIMELINE_DESIGN_SYSTEM.shadows.phaseBox;
                }}
                onClick={() => onPhaseClick?.(phase.id)}
              >
                {/* Phase 이름 + 상태 */}
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className="font-bold text-sm"
                    style={{
                      color: phaseColor,
                      fontSize: TIMELINE_DESIGN_SYSTEM.typography.phaseTitle.size,
                      fontWeight: TIMELINE_DESIGN_SYSTEM.typography.phaseTitle.weight
                    }}
                  >
                    {phase.name}
                  </div>
                  {isCompleted && (
                    <div
                      className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: TIMELINE_DESIGN_SYSTEM.phaseStatus.completed }}
                    >
                      <span className="text-white text-[8px] font-bold">✓</span>
                    </div>
                  )}
                  {isCurrentPhase && !isCompleted && (
                    <div
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ backgroundColor: TIMELINE_DESIGN_SYSTEM.phaseStatus.current }}
                    />
                  )}
                </div>

                {/* 날짜 */}
                <div
                  className="text-[10px] mb-2"
                  style={{
                    color: TIMELINE_DESIGN_SYSTEM.typography.phaseDate.color,
                    fontSize: TIMELINE_DESIGN_SYSTEM.typography.phaseDate.size
                  }}
                >
                  {phase.startDate.toLocaleDateString('ko-KR', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>

                {/* 진행률 */}
                {phase.progress !== undefined && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(15, 82, 222, 0.1)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${phase.progress}%`,
                          backgroundColor: phaseColor,
                          transition: TIMELINE_DESIGN_SYSTEM.transitions.smooth
                        }}
                      />
                    </div>
                    <span
                      className="text-[10px] font-bold"
                      style={{
                        color: phaseColor,
                        fontFamily: TIMELINE_DESIGN_SYSTEM.dataScience.metricLabel.fontFamily,
                        fontSize: TIMELINE_DESIGN_SYSTEM.typography.phaseProgress.size
                      }}
                    >
                      {phase.progress}%
                    </span>
                  </div>
                )}
              </div>
            </foreignObject>

            {/* 노드 원형 - Phase 6: Primary 파랑 계열 */}
            <circle
              cx={TIMELINE_CONSTANTS.MAIN_AXIS_LEFT}
              cy={y}
              r={TIMELINE_CONSTANTS.PHASE_NODE_SIZE / 2}
              fill={isCompleted ? phaseColor : 'white'}
              stroke={phaseColor}
              strokeWidth={isCurrentPhase ? '5' : '3'}
              style={{
                filter: isCurrentPhase
                  ? TIMELINE_DESIGN_SYSTEM.shadows.nodeHover
                  : TIMELINE_DESIGN_SYSTEM.shadows.node,
                animation: isCurrentPhase
                  ? `fadeInScale 300ms ease-out ${animationDelay}ms forwards, pulse 2s infinite ${animationDelay + 300}ms`
                  : `fadeInScale 300ms ease-out ${animationDelay}ms forwards`,
                opacity: 0,
                cursor: onPhaseClick ? 'pointer' : 'default',
                transition: TIMELINE_DESIGN_SYSTEM.transitions.hover
              }}
              onClick={() => onPhaseClick?.(phase.id)}
            />

            {/* 완료 체크 아이콘 */}
            {isCompleted && (
              <text
                x={TIMELINE_CONSTANTS.MAIN_AXIS_LEFT}
                y={y}
                fontSize="16"
                fill="white"
                textAnchor="middle"
                dominantBaseline="central"
                style={{
                  animation: `fadeInScale 300ms ease-out ${animationDelay}ms forwards`,
                  opacity: 0,
                  fontWeight: 'bold'
                }}
              >
                ✓
              </text>
            )}
          </g>
        );
      })}
    </>
  );
});

PhaseNodes.displayName = 'PhaseNodes';

export default PhaseNodes;