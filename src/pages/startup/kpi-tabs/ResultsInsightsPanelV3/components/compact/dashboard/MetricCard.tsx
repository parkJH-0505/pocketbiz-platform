/**
 * MetricCard Component
 * Dashboard 상단 메트릭 카드
 */

import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  description?: string;
  color: {
    text: string;
    bg: string;
    border: string;
  };
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: number;
  };
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  icon: Icon,
  description,
  color,
  trend,
  className = ''
}) => {
  return (
    <div
      className={`p-4 ${color.bg} border ${color.border} rounded-lg transition-transform hover:scale-105 ${className}`}
    >
      {/* 아이콘 */}
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 bg-white rounded-lg ${color.text}`}>
          <Icon size={20} />
        </div>
        {trend && (
          <div className="text-xs font-medium">
            {trend.direction === 'up' && (
              <span className="text-green-600">▲ {trend.value.toFixed(1)}</span>
            )}
            {trend.direction === 'down' && (
              <span className="text-red-600">▼ {trend.value.toFixed(1)}</span>
            )}
            {trend.direction === 'stable' && (
              <span className="text-gray-500">→ {trend.value.toFixed(1)}</span>
            )}
          </div>
        )}
      </div>

      {/* 값 */}
      <div className="text-center">
        <div className={`text-3xl font-bold ${color.text} mb-1`}>
          {value}
          {unit && <span className="text-lg font-normal ml-1">{unit}</span>}
        </div>
        <div className="font-medium text-gray-700 text-sm mb-1">
          {label}
        </div>
        {description && (
          <div className="text-xs text-gray-500">
            {description}
          </div>
        )}
      </div>
    </div>
  );
};
