/**
 * AxisScoresRow Component
 * 5축 점수 가로 표시 (컴팩트)
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getAxisDisplayName } from '../../../utils/dashboardDataExtractor';

interface AxisScore {
  axis: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'fair' | 'needs_attention';
}

interface AxisScoresRowProps {
  axisScores: AxisScore[];
  className?: string;
}

export const AxisScoresRow: React.FC<AxisScoresRowProps> = ({
  axisScores,
  className = ''
}) => {
  const getStatusColor = (status: AxisScore['status']) => {
    switch (status) {
      case 'excellent':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          score: 'text-green-600'
        };
      case 'good':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          score: 'text-blue-600'
        };
      case 'fair':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
          score: 'text-yellow-600'
        };
      case 'needs_attention':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          score: 'text-red-600'
        };
    }
  };

  const getTrendIcon = (trend: AxisScore['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={14} className="text-green-600" />;
      case 'down':
        return <TrendingDown size={14} className="text-red-600" />;
      case 'stable':
      default:
        return <Minus size={14} className="text-gray-500" />;
    }
  };

  const getTrendLabel = (trend: AxisScore['trend']) => {
    switch (trend) {
      case 'up': return '상승';
      case 'down': return '하락';
      case 'stable': return '안정';
    }
  };

  return (
    <div className={`grid grid-cols-5 gap-3 ${className}`}>
      {axisScores.map((axis, idx) => {
        const colors = getStatusColor(axis.status);

        return (
          <div
            key={idx}
            className={`p-3 ${colors.bg} border ${colors.border} rounded-lg text-center transition-transform hover:scale-105`}
          >
            {/* 축 이름 */}
            <div className={`text-xs font-semibold ${colors.text} mb-2`}>
              {getAxisDisplayName(axis.axis)}
            </div>

            {/* 점수 */}
            <div className={`text-2xl font-bold ${colors.score} mb-1`}>
              {axis.score.toFixed(0)}
            </div>

            {/* 트렌드 */}
            <div className="flex items-center justify-center gap-1">
              {getTrendIcon(axis.trend)}
              <span className="text-xs text-gray-600">
                {getTrendLabel(axis.trend)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
