/**
 * @fileoverview 날짜 라벨 컴포넌트
 * @description 타임라인 좌측에 표시되는 날짜 라벨 + Phase 정보
 */

import React from 'react';
import type { DateMilestone } from '../../../utils/timeScaleCalculator';

interface DateLabelProps {
  milestone: DateMilestone;
  phaseName?: string;
  phaseProgress?: number;
  isCompleted?: boolean;
  isCurrent?: boolean;
  isSticky?: boolean;
}

/**
 * 단일 날짜 라벨 + Phase 정보
 */
const DateLabel: React.FC<DateLabelProps> = ({
  milestone,
  phaseName,
  phaseProgress,
  isCompleted = false,
  isCurrent = false,
  isSticky = false
}) => {
  const { yPosition, label } = milestone;

  return (
    <g transform={`translate(0, ${yPosition})`}>
      {/* Phase 정보 박스 */}
      <foreignObject x={0} y={-24} width={90} height={48}>
        <div className="px-2 py-1.5 bg-white border-l-4 border-b"
          style={{
            borderLeftColor: isCompleted ? '#10B981' : isCurrent ? '#3B82F6' : '#9CA3AF',
            borderBottomColor: '#E5E7EB'
          }}
        >
          {/* Phase 이름 */}
          <div className={`text-xs font-bold mb-0.5 ${
            isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-600'
          }`}>
            {isCompleted && '✓ '}
            {phaseName}
          </div>

          {/* 날짜 + 진행률 */}
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] text-gray-500">{label}</span>
            {phaseProgress !== undefined && (
              <span className={`text-[10px] font-semibold ${
                isCurrent ? 'text-blue-600' : 'text-gray-400'
              }`}>
                {phaseProgress}%
              </span>
            )}
          </div>
        </div>
      </foreignObject>
    </g>
  );
};

export default DateLabel;
