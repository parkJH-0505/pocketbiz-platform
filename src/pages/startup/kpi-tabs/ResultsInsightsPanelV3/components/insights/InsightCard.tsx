/**
 * InsightCard Component
 * 개별 인사이트를 표시하는 카드 컴포넌트
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Target,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { GeneratedInsight } from '@/types/reportV3.types';

interface InsightCardProps {
  insight: GeneratedInsight;
  size?: 'compact' | 'standard';
  showActions?: boolean;
  className?: string;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  size = 'standard',
  showActions = true,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 카테고리별 아이콘과 색상 설정
  const getCategoryConfig = () => {
    switch (insight.category) {
      case 'strength':
        return {
          icon: TrendingUp,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: '강점'
        };
      case 'weakness':
        return {
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: '약점'
        };
      case 'opportunity':
        return {
          icon: Lightbulb,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: '기회'
        };
      case 'recommendation':
        return {
          icon: Target,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          label: '권장사항'
        };
      default:
        return {
          icon: Lightbulb,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: '인사이트'
        };
    }
  };

  // 우선순위별 스타일
  const getPriorityStyle = () => {
    switch (insight.priority) {
      case 'high':
        return 'ring-2 ring-red-200 shadow-md';
      case 'medium':
        return 'ring-1 ring-yellow-200 shadow-sm';
      case 'low':
        return 'ring-1 ring-gray-200 shadow-sm';
      default:
        return 'shadow-sm';
    }
  };

  const config = getCategoryConfig();
  const Icon = config.icon;
  const priorityStyle = getPriorityStyle();

  return (
    <div
      className={`
        ${config.bgColor} ${config.borderColor} ${priorityStyle}
        border rounded-lg transition-all duration-200 hover:shadow-md
        ${size === 'compact' ? 'p-4' : 'p-6'}
        ${className}
      `}
    >
      {/* 헤더 */}
      <div className="flex items-start gap-3 mb-3">
        {/* 아이콘 */}
        <div className={`flex-shrink-0 ${config.color}`}>
          <Icon size={size === 'compact' ? 18 : 20} />
        </div>

        {/* 제목과 라벨 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-semibold ${config.color} ${size === 'compact' ? 'text-sm' : 'text-base'}`}>
              {insight.title}
            </h4>

            {/* 카테고리 배지 */}
            <span className={`
              inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
              ${config.color} ${config.bgColor} ${config.borderColor} border
            `}>
              {config.label}
            </span>

            {/* 우선순위 표시 */}
            {insight.priority === 'high' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                긴급
              </span>
            )}
          </div>

          {/* 설명 */}
          <p className={`text-gray-700 leading-relaxed ${size === 'compact' ? 'text-sm' : 'text-base'}`}>
            {insight.description}
          </p>
        </div>
      </div>

      {/* 영향받는 KPI 수 */}
      {insight.affectedKPIs.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500">영향 KPI:</span>
          <span className="text-xs font-medium text-gray-700">
            {insight.affectedKPIs.length}개
          </span>
        </div>
      )}

      {/* 액션 아이템들 (확장 가능) */}
      {showActions && insight.actionItems && insight.actionItems.length > 0 && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span>액션 아이템 ({insight.actionItems.length}개)</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-2">
              {insight.actionItems.map((action, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-5 h-5 bg-white border border-gray-300 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-xs text-gray-600">{index + 1}</span>
                  </div>
                  <span className="text-sm text-gray-700 leading-relaxed">
                    {action}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};