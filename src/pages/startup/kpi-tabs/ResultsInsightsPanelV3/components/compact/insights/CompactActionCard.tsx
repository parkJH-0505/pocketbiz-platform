/**
 * CompactActionCard Component
 * 액션 아이템 카드 (우선순위 기반)
 */

import React from 'react';
import { Target, Clock, Zap } from 'lucide-react';
import type { CompactActionItem } from '../../../utils/insightsDataExtractor';

interface CompactActionCardProps {
  action: CompactActionItem;
  index: number;
  className?: string;
}

export const CompactActionCard: React.FC<CompactActionCardProps> = ({
  action,
  index,
  className = ''
}) => {
  const getPriorityConfig = (priority: 'critical' | 'high' | 'medium') => {
    switch (priority) {
      case 'critical':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-300',
          badgeBg: 'bg-red-100',
          badgeText: 'text-red-700',
          label: '긴급',
          icon: Zap
        };
      case 'high':
        return {
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-300',
          badgeBg: 'bg-orange-100',
          badgeText: 'text-orange-700',
          label: '높음',
          icon: Target
        };
      case 'medium':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-300',
          badgeBg: 'bg-blue-100',
          badgeText: 'text-blue-700',
          label: '중간',
          icon: Target
        };
    }
  };

  const getTimeframeConfig = (timeframe: 'immediate' | 'short' | 'medium') => {
    switch (timeframe) {
      case 'immediate': return { label: '즉시', color: 'text-red-600' };
      case 'short': return { label: '1-3개월', color: 'text-orange-600' };
      case 'medium': return { label: '3-6개월', color: 'text-blue-600' };
    }
  };

  const priorityConfig = getPriorityConfig(action.priority);
  const timeframeConfig = getTimeframeConfig(action.timeframe);
  const PriorityIcon = priorityConfig.icon;

  return (
    <div
      className={`p-3 border rounded-lg ${priorityConfig.bgColor} ${priorityConfig.borderColor} ${className}`}
    >
      {/* 헤더 */}
      <div className="flex items-start gap-2 mb-2">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white border border-gray-300 text-xs font-bold text-gray-700">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${priorityConfig.badgeBg} ${priorityConfig.badgeText}`}>
              <PriorityIcon size={12} />
              {priorityConfig.label}
            </span>
            <span className={`text-xs font-semibold ${timeframeConfig.color}`}>
              <Clock size={12} className="inline mr-1" />
              {timeframeConfig.label}
            </span>
            <span className="text-xs text-gray-600">
              {action.category}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">
            {action.title}
          </h4>
        </div>
      </div>

      {/* 설명 */}
      <p className="text-xs text-gray-700 leading-relaxed line-clamp-2 mb-2">
        {action.description}
      </p>

      {/* 하단 메타 정보 */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        <div className="flex items-center gap-1">
          <Target size={12} className="text-gray-600" />
          <span className="text-xs text-gray-600">
            예상 효과: <span className="font-semibold">{action.estimatedImpact}</span>
          </span>
        </div>

        {action.relatedKPIs.length > 0 && (
          <span className="text-xs text-gray-500">
            연관 KPI {action.relatedKPIs.length}개
          </span>
        )}
      </div>
    </div>
  );
};
