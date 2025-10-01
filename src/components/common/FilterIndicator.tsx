/**
 * @fileoverview Filter Indicator Component
 * @description 필터 상태를 표시하는 인디케이터 컴포넌트
 * @author PocketCompany
 * @since 2025-01-20
 */

import React from 'react';

// 로컬 타입 정의 (완전 독립)
interface FilterCondition {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'between';
  value: any;
}

interface FilterPreset {
  id: string;
  name: string;
  icon?: string;
  filters: FilterCondition[];
  color: string;
}

type SwipeDirection = 'up' | 'down' | 'left' | 'right';

interface FilterIndicatorProps {
  preset: FilterPreset;
  isActive: boolean;
  isTransitioning: boolean;
  direction?: SwipeDirection | null;
  onClick?: () => void;
}

export const FilterIndicator: React.FC<FilterIndicatorProps> = ({
  preset,
  isActive,
  isTransitioning,
  direction,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full
        transition-all duration-300 cursor-pointer
        ${isActive
          ? 'bg-opacity-100 text-white shadow-lg scale-105'
          : 'bg-opacity-20 text-gray-700 hover:bg-opacity-30'
        }
        ${isTransitioning && isActive
          ? direction === 'left' || direction === 'up'
            ? 'animate-slide-in-left'
            : 'animate-slide-in-right'
          : ''
        }
      `}
      style={{
        backgroundColor: isActive ? preset.color : `${preset.color}20`
      }}
    >
      <span className="text-lg">{preset.icon}</span>
      <span className="text-sm font-medium">{preset.name}</span>
      {preset.filters.length > 0 && (
        <span className="text-xs opacity-75">
          ({preset.filters.length})
        </span>
      )}
    </div>
  );
};