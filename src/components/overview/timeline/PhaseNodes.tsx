/**
 * @fileoverview Phase Nodes - 단계 노드들
 * @description Layer 3: 프로젝트 단계 노드 렌더링
 * @author PocketCompany
 * @since 2025-01-30
 */

import React from 'react';
import { TIMELINE_CONSTANTS, PHASE_COLORS } from '../../../types/timeline-v3.types';
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

        // Phase 색상
        const phaseNumber = (phase.order % 7) + 1;
        const colors = PHASE_COLORS[phaseNumber as keyof typeof PHASE_COLORS];

        // Phase 5: 순차 애니메이션 delay (200ms씩)
        const animationDelay = index * 200;

        return (
          <g key={phase.id}>
            {/* Phase 박스 (왼쪽) */}
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
                className="h-full p-2.5 bg-white rounded-lg border-l-4 shadow hover:shadow-md transition-all"
                style={{
                  borderLeftColor: isCompleted ? '#10B981' : isCurrentPhase ? colors.text : '#D1D5DB',
                  cursor: onPhaseClick ? 'pointer' : 'default'
                }}
                onClick={() => onPhaseClick?.(phase.id)}
              >
                {/* Phase 이름 + 상태 */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="font-bold text-sm" style={{ color: colors.text }}>
                    {phase.name}
                  </div>
                  {isCompleted && (
                    <div className="w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold">✓</span>
                    </div>
                  )}
                  {isCurrentPhase && !isCompleted && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </div>

                {/* 날짜 */}
                <div className="text-[10px] text-gray-400 mb-2">
                  {phase.startDate.toLocaleDateString('ko-KR', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>

                {/* 진행률 */}
                {phase.progress !== undefined && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${phase.progress}%`,
                          backgroundColor: colors.text
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: colors.text }}>
                      {phase.progress}%
                    </span>
                  </div>
                )}
              </div>
            </foreignObject>

            {/* 노드 원형 */}
            <circle
              cx={TIMELINE_CONSTANTS.MAIN_AXIS_LEFT}
              cy={y}
              r={TIMELINE_CONSTANTS.PHASE_NODE_SIZE / 2}
              fill={isCompleted ? colors.text : 'white'}
              stroke={isCurrentPhase ? colors.text : '#94A3B8'}
              strokeWidth={isCurrentPhase ? '5' : '3'}
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                animation: isCurrentPhase
                  ? `fadeInScale 300ms ease-out ${animationDelay}ms forwards, pulse 2s infinite ${animationDelay + 300}ms`
                  : `fadeInScale 300ms ease-out ${animationDelay}ms forwards`,
                opacity: 0,
                cursor: onPhaseClick ? 'pointer' : 'default'
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