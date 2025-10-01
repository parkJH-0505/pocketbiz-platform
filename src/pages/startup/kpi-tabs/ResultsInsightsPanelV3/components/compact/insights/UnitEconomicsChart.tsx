/**
 * UnitEconomicsChart Component
 * Unit Economics 간결한 바 차트 표시
 */

import React from 'react';
import { DollarSign } from 'lucide-react';
import type { UnitEconomicsData } from '../../../utils/insightsDataExtractor';

interface UnitEconomicsChartProps {
  data: UnitEconomicsData;
  className?: string;
}

export const UnitEconomicsChart: React.FC<UnitEconomicsChartProps> = ({
  data,
  className = ''
}) => {
  const getStatusColor = (status: 'excellent' | 'good' | 'attention') => {
    switch (status) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'attention': return 'bg-orange-500';
    }
  };

  const getStatusTextColor = (status: 'excellent' | 'good' | 'attention') => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'attention': return 'text-orange-600';
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '원' || unit === '원/월') {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(0)}K`;
      }
      return value.toFixed(0);
    }
    return value.toFixed(1);
  };

  const maxValue = Math.max(
    ...data.metrics
      .filter(m => m.unit === '원' || m.unit === '원/월')
      .map(m => Math.max(m.value, m.benchmark || 0))
  );

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <DollarSign size={18} className="text-gray-700" />
        <h4 className="text-sm font-bold text-gray-900">Unit Economics</h4>
      </div>

      <div className="space-y-3">
        {data.metrics.map((metric, idx) => {
          const isMonetary = metric.unit === '원' || metric.unit === '원/월';
          const barWidth = isMonetary
            ? (metric.value / maxValue) * 100
            : (metric.value / (metric.benchmark || 5)) * 100;

          return (
            <div key={idx} className="space-y-1">
              {/* Label & Value */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">
                  {metric.label}
                </span>
                <span className={`text-xs font-bold ${getStatusTextColor(metric.status)}`}>
                  {formatValue(metric.value, metric.unit)} {metric.unit}
                </span>
              </div>

              {/* Bar */}
              <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                {/* Benchmark line */}
                {metric.benchmark && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10"
                    style={{
                      left: `${Math.min((metric.benchmark / maxValue) * 100, 100)}%`
                    }}
                  />
                )}

                {/* Value bar */}
                <div
                  className={`h-full ${getStatusColor(metric.status)} transition-all duration-300`}
                  style={{ width: `${Math.min(barWidth, 100)}%` }}
                />

                {/* Value text inside bar */}
                <div className="absolute inset-0 flex items-center px-2">
                  <span className="text-xs font-semibold text-white drop-shadow">
                    {formatValue(metric.value, metric.unit)}
                  </span>
                </div>
              </div>

              {/* Benchmark info */}
              {metric.benchmark && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-0.5 bg-gray-400" />
                  <span className="text-xs text-gray-500">
                    목표: {formatValue(metric.benchmark, metric.unit)} {metric.unit}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {data.metrics.length === 0 && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <p className="text-sm text-gray-500">
            Unit Economics 데이터가 없습니다
          </p>
        </div>
      )}
    </div>
  );
};
