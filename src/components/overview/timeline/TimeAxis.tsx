/**
 * @fileoverview 시간축 컴포넌트
 * @description 타임라인 좌측의 시간축 전체 영역
 */

import React from 'react';
import DateLabel from './DateLabel';
import type { DateMilestone } from '../../../utils/timeScaleCalculator';
import type { TimelinePhase } from '../../../types/timeline-v3.types';

interface TimeAxisProps {
  phases: TimelinePhase[];
  phaseYPositions: number[];
  totalHeight: number;
}

/**
 * 타임라인 시간축 (좌측)
 * Phase 시작 지점에 날짜 표시
 */
const TimeAxis: React.FC<TimeAxisProps> = ({
  phases,
  phaseYPositions,
  totalHeight
}) => {
  // Phase 시작 날짜를 마일스톤으로 변환
  const milestones: DateMilestone[] = phases.map((phase, index) => ({
    date: phase.startDate,
    yPosition: phaseYPositions[index],
    label: phase.startDate.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    }),
    type: 'day' as const,
    isPhaseStart: true
  }));

  return (
    <g className="time-axis">
      {/* 배경 영역 */}
      <rect
        x={0}
        y={0}
        width={90}
        height={totalHeight}
        fill="#F9FAFB"
        stroke="#E5E7EB"
        strokeWidth={1}
      />

      {/* Phase 라벨들 (날짜 + Phase 정보) */}
      {milestones.map((milestone, index) => (
        <DateLabel
          key={`date-${index}`}
          milestone={milestone}
          phaseName={phases[index].name}
          phaseProgress={phases[index].progress}
          isCompleted={phases[index].isCompleted}
          isCurrent={phases[index].isCurrent}
        />
      ))}

      {/* 우측 구분선 */}
      <line
        x1={90}
        y1={0}
        x2={90}
        y2={totalHeight}
        stroke="#D1D5DB"
        strokeWidth={2}
      />
    </g>
  );
};

export default TimeAxis;
