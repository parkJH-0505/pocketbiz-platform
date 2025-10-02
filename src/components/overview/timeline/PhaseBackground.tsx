/**
 * @fileoverview Phase 배경색 영역 컴포넌트
 * @description 각 Phase 구간에 색상 배경을 그려 시각적 구분
 * Phase 6: Glassmorphism 적용, Primary 파랑 계열 통일
 */

import React, { useState } from 'react';
import type { TimelinePhase } from '../../../types/timeline-v3.types';
import { TIMELINE_DESIGN_SYSTEM, TIMELINE_CONSTANTS } from '../../../types/timeline-v3.types';

interface PhaseBackgroundProps {
  phases: TimelinePhase[];
  yPositions: number[];
  containerWidth?: number;
}

/**
 * Phase별 배경색 영역
 */
const PhaseBackground: React.FC<PhaseBackgroundProps> = ({
  phases,
  yPositions,
  containerWidth = 1200
}) => {
  const [hoveredPhaseId, setHoveredPhaseId] = useState<string | null>(null);

  return (
    <g className="phase-backgrounds">
      {phases.map((phase, index) => {
        const yStart = yPositions[index] || 0;
        const yEnd = yPositions[index + 1] || yStart + TIMELINE_CONSTANTS.PHASE_BASE_HEIGHT;
        const height = yEnd - yStart;

        // Phase 6: 3개 그룹으로 단순화 (Planning/Execution/Completion)
        const groupKey = phase.order <= 3 ? 'planning' : phase.order <= 5 ? 'execution' : 'completion';
        const styleConfig = TIMELINE_DESIGN_SYSTEM.phaseBackground[groupKey];

        // 호버 상태
        const isHovered = hoveredPhaseId === phase.id;

        // 교차 패턴: 홀수/짝수 Phase마다 약간 다른 배경 (은근한 구분)
        const isEven = phase.order % 2 === 0;
        const baseOpacity = isEven ? styleConfig.opacity * 2.5 : styleConfig.opacity;
        const opacity = isHovered ? baseOpacity + 0.05 : baseOpacity;

        return (
          <g key={phase.id}>
            {/* 배경 영역 - Glassmorphism */}
            <rect
              x={0}
              y={yStart}
              width={containerWidth}
              height={height}
              fill={styleConfig.bg}
              fillOpacity={opacity}
              stroke={styleConfig.border}
              strokeWidth={isHovered ? 1.5 : 0.5}
              strokeOpacity={isHovered ? 0.3 : 0.15}
              onMouseEnter={() => setHoveredPhaseId(phase.id)}
              onMouseLeave={() => setHoveredPhaseId(null)}
              style={{
                cursor: 'pointer',
                transition: TIMELINE_DESIGN_SYSTEM.transitions.default,
                filter: isHovered ? `blur(0px)` : 'none'
              }}
            />

            {/* Phase 번호 워터마크 (배경) */}
            <text
              x={50}
              y={yStart + height / 2}
              fontSize="120"
              fontWeight="700"
              fill="rgba(15, 82, 222, 0.05)"
              textAnchor="start"
              dominantBaseline="middle"
              style={{
                userSelect: 'none',
                pointerEvents: 'none',
                fontFamily: TIMELINE_DESIGN_SYSTEM.typography.phaseTitle.fontFamily
              }}
            >
              {phase.order}
            </text>

            {/* Phase 구분선 (그라데이션) - 마지막 Phase 제외 */}
            {index < phases.length - 1 && (
              <line
                x1={0}
                y1={yEnd}
                x2={containerWidth}
                y2={yEnd}
                stroke="url(#phase-divider-gradient)"
                strokeWidth={2}
                strokeOpacity={0.5}
                style={{
                  pointerEvents: 'none'
                }}
              />
            )}

            {/* Phase 라벨 (우측 상단) - Glassmorphism */}
            {isHovered && (
              <foreignObject
                x={containerWidth - 220}
                y={yStart + 16}
                width={200}
                height={60}
              >
                <div
                  className="px-3 py-2 rounded-lg"
                  style={{
                    background: TIMELINE_DESIGN_SYSTEM.dataScience.glassEffect.background,
                    backdropFilter: TIMELINE_DESIGN_SYSTEM.dataScience.glassEffect.backdropFilter,
                    border: TIMELINE_DESIGN_SYSTEM.dataScience.glassEffect.border,
                    boxShadow: TIMELINE_DESIGN_SYSTEM.shadows.glassmorphism
                  }}
                >
                  <div className="flex items-center gap-2">
                    {phase.isCompleted && (
                      <span style={{ color: TIMELINE_DESIGN_SYSTEM.phaseStatus.completed }}>✓</span>
                    )}
                    {phase.isCurrent && (
                      <div
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: TIMELINE_DESIGN_SYSTEM.phaseStatus.current }}
                      />
                    )}
                    <span
                      className="font-semibold text-sm"
                      style={{
                        color: TIMELINE_DESIGN_SYSTEM.phaseStatus.current,
                        fontSize: TIMELINE_DESIGN_SYSTEM.typography.phaseTitle.size,
                        fontWeight: TIMELINE_DESIGN_SYSTEM.typography.phaseTitle.weight
                      }}
                    >
                      {phase.name}
                    </span>
                  </div>
                  {phase.progress !== undefined && (
                    <div className="mt-1">
                      <div className="flex justify-between text-xs mb-1" style={{ color: TIMELINE_DESIGN_SYSTEM.typography.phaseDate.color }}>
                        <span>진행률</span>
                        <span
                          className="font-medium"
                          style={{
                            fontFamily: TIMELINE_DESIGN_SYSTEM.dataScience.metricLabel.fontFamily,
                            fontSize: TIMELINE_DESIGN_SYSTEM.dataScience.metricLabel.fontSize
                          }}
                        >
                          {phase.progress}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(15, 82, 222, 0.1)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${phase.progress}%`,
                            backgroundColor: TIMELINE_DESIGN_SYSTEM.phaseStatus.current,
                            transition: TIMELINE_DESIGN_SYSTEM.transitions.smooth
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </foreignObject>
            )}
          </g>
        );
      })}
    </g>
  );
};

export default PhaseBackground;
