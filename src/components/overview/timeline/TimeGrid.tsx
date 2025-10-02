/**
 * @fileoverview Time Grid - 시간 그리드 배경
 * @description Layer 0: 시간 참조를 위한 수평 그리드 라인
 * Phase 7: 작업 4 - 시간 그리드 배경
 * @author PocketCompany
 * @since 2025-01-30
 */

import React from 'react';
import { TIMELINE_DESIGN_SYSTEM } from '../../../types/timeline-v3.types';
import type { TimeInterval } from '../utils/getTimeIntervals';

/**
 * TimeGrid Props
 */
interface TimeGridProps {
  intervals: TimeInterval[];
  canvasWidth: number;
}

/**
 * Time Grid 컴포넌트
 * - 프로젝트 기간에 따라 월별 또는 격주 단위 그리드 표시
 * - 월 시작: 진한 선 (opacity 0.12)
 * - 일반 간격: 연한 선 (opacity 0.06)
 * - 왼쪽에 날짜 레이블 표시
 */
const TimeGrid: React.FC<TimeGridProps> = React.memo(({ intervals, canvasWidth }) => {
  return (
    <g className="time-grid">
      {intervals.map((interval, index) => {
        // 월 시작은 진한 선, 일반은 연한 선
        const strokeOpacity = interval.isMonthStart ? 0.12 : 0.06;
        const strokeWidth = interval.isMonthStart ? 1.5 : 1;

        // 레이블 스타일
        const labelOpacity = interval.isMonthStart ? 0.7 : 0.5;
        const labelWeight = interval.isMonthStart ? '600' : '400';

        return (
          <g key={`time-interval-${interval.date.getTime()}-${index}`}>
            {/* 수평 그리드 라인 */}
            <line
              x1={0}
              y1={interval.y}
              x2={canvasWidth}
              y2={interval.y}
              stroke={TIMELINE_DESIGN_SYSTEM.dataScience.gridLine.color}
              strokeWidth={strokeWidth}
              strokeOpacity={strokeOpacity}
              strokeDasharray={TIMELINE_DESIGN_SYSTEM.dataScience.gridLine.strokeDasharray}
              style={{
                pointerEvents: 'none'
              }}
            />

            {/* 날짜 레이블 (왼쪽) */}
            <text
              x={10}
              y={interval.y - 8}
              fontSize={TIMELINE_DESIGN_SYSTEM.dataScience.metricLabel.fontSize}
              fontFamily={TIMELINE_DESIGN_SYSTEM.dataScience.metricLabel.fontFamily}
              fill={TIMELINE_DESIGN_SYSTEM.dataScience.metricLabel.color}
              opacity={labelOpacity}
              fontWeight={labelWeight}
              style={{
                pointerEvents: 'none',
                userSelect: 'none'
              }}
            >
              {interval.label}
            </text>
          </g>
        );
      })}
    </g>
  );
});

TimeGrid.displayName = 'TimeGrid';

export default TimeGrid;
