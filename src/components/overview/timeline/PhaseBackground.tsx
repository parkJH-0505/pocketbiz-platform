/**
 * @fileoverview Phase 배경색 영역 컴포넌트
 * @description 각 Phase 구간에 색상 배경을 그려 시각적 구분
 */

import React, { useState } from 'react';
import type { TimelinePhase } from '../../../types/timeline-v3.types';
import { PHASE_COLORS, TIMELINE_CONSTANTS } from '../../../types/timeline-v3.types';

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

        // Phase 번호로 색상 결정 (1-7)
        const phaseNumber = (phase.order % 7) + 1;
        const colors = PHASE_COLORS[phaseNumber as keyof typeof PHASE_COLORS];

        // 호버 상태
        const isHovered = hoveredPhaseId === phase.id;

        // 완료/진행중/예정에 따라 투명도 조절
        const opacity = phase.isCompleted ? 0.3 : phase.isCurrent ? 0.6 : 0.2;

        return (
          <g key={phase.id}>
            {/* 배경 영역 */}
            <rect
              x={0}
              y={yStart}
              width={containerWidth}
              height={height}
              fill={colors.bg}
              fillOpacity={isHovered ? opacity + 0.2 : opacity}
              stroke={colors.border}
              strokeWidth={isHovered ? 2 : 1}
              strokeOpacity={0.5}
              onMouseEnter={() => setHoveredPhaseId(phase.id)}
              onMouseLeave={() => setHoveredPhaseId(null)}
              style={{
                cursor: 'pointer',
                transition: 'all 200ms ease-out'
              }}
            />

            {/* Phase 라벨 (우측 상단) */}
            {isHovered && (
              <foreignObject
                x={containerWidth - 220}
                y={yStart + 16}
                width={200}
                height={60}
              >
                <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    {phase.isCompleted && <span className="text-green-600">✓</span>}
                    {phase.isCurrent && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    )}
                    <span className="font-semibold text-sm" style={{ color: colors.text }}>
                      {phase.name}
                    </span>
                  </div>
                  {phase.progress !== undefined && (
                    <div className="mt-1">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>진행률</span>
                        <span className="font-medium">{phase.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${phase.progress}%`,
                            backgroundColor: colors.text
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
