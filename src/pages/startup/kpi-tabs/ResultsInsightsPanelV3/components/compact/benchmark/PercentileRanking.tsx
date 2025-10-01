/**
 * PercentileRanking Component
 * 백분위 순위 시각화
 */

import React from 'react';
import { Award } from 'lucide-react';
import type { PercentileData } from '../../../utils/benchmarkDataExtractor';

interface PercentileRankingProps {
  data: PercentileData;
  className?: string;
}

export const PercentileRanking: React.FC<PercentileRankingProps> = ({
  data,
  className = ''
}) => {
  const getStatusColor = (status: 'excellent' | 'good' | 'fair' | 'needs_attention') => {
    switch (status) {
      case 'excellent':
        return { bg: 'bg-green-100', text: 'text-green-700', bar: 'bg-green-500' };
      case 'good':
        return { bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-500' };
      case 'fair':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', bar: 'bg-yellow-500' };
      case 'needs_attention':
        return { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500' };
    }
  };

  const getPercentileLabel = (percentile: number) => {
    if (percentile >= 90) return '상위 10%';
    if (percentile >= 75) return '상위 25%';
    if (percentile >= 50) return '상위 50%';
    if (percentile >= 25) return '하위 50%';
    return '하위 25%';
  };

  const overallColor = getStatusColor(
    data.overallPercentile >= 75 ? 'excellent' :
    data.overallPercentile >= 50 ? 'good' :
    data.overallPercentile >= 25 ? 'fair' : 'needs_attention'
  );

  return (
    <div className={`percentile-ranking ${className}`}>
      <div className="mb-3">
        <h4 className="text-sm font-bold text-gray-900">🏆 백분위 순위</h4>
      </div>

      {/* Overall Percentile */}
      <div className={`p-3 ${overallColor.bg} border border-gray-200 rounded-lg mb-3`}>
        <div className="flex items-center gap-2 mb-2">
          <Award size={18} className={overallColor.text} />
          <span className="text-xs font-semibold text-gray-700">종합 순위</span>
        </div>
        <div className="flex items-end gap-2">
          <span className={`text-3xl font-bold ${overallColor.text}`}>
            {data.overallPercentile.toFixed(0)}
          </span>
          <span className="text-xs text-gray-600 mb-1">백분위</span>
        </div>
        <p className="text-xs text-gray-700 mt-1">
          {getPercentileLabel(data.overallPercentile)}
        </p>
      </div>

      {/* Axis Percentiles */}
      <div className="space-y-2">
        {data.axisPercentiles.map((axis) => {
          const color = getStatusColor(axis.status);

          return (
            <div key={axis.axis} className="p-2 bg-white border border-gray-200 rounded-lg">
              {/* Label & Value */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">
                  {axis.displayName}
                </span>
                <span className={`text-xs font-bold ${color.text}`}>
                  {axis.percentile.toFixed(0)}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${color.bar} transition-all duration-300`}
                  style={{ width: `${Math.min(axis.percentile, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-sm" />
            <span className="text-gray-700">우수 (≥75%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-sm" />
            <span className="text-gray-700">양호 (50-74%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-sm" />
            <span className="text-gray-700">보통 (25-49%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-sm" />
            <span className="text-gray-700">개선 필요 (&lt;25%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
