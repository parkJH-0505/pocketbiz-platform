/**
 * AxisScoreDisplay Component
 * 축별 점수와 상태를 표시하는 컴포넌트
 */

import React, { memo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Users,
  Zap,
  BarChart3,
  Settings
} from 'lucide-react';
import { ScoreDisplay } from '../shared/ScoreDisplay';
import { StatusBadge } from '../shared/StatusBadge';
import type { AxisScoreDisplayProps } from '../../types/reportV3UI.types';
import type { AxisKey } from '../../../../types';

export const AxisScoreDisplay = memo<AxisScoreDisplayProps>(({
  axisDetail,
  compact = false,
  showTrend = true,
  onClick,
  className = ''
}) => {
  // 축별 아이콘 매핑
  const getAxisIcon = (axis: AxisKey) => {
    switch (axis) {
      case 'GO':
        return Target;
      case 'EC':
        return BarChart3;
      case 'PT':
        return Zap;
      case 'PF':
        return TrendingUp;
      case 'TO':
        return Users;
      default:
        return Settings;
    }
  };

  // 축별 이름 매핑
  const getAxisName = (axis: AxisKey) => {
    switch (axis) {
      case 'GO':
        return 'Go-to-Market';
      case 'EC':
        return 'Economics';
      case 'PT':
        return 'Product & Technology';
      case 'PF':
        return 'Performance';
      case 'TO':
        return 'Team & Organization';
      default:
        return axis;
    }
  };

  // 축별 색상 매핑
  const getAxisColor = (axis: AxisKey) => {
    switch (axis) {
      case 'GO':
        return 'text-blue-600';
      case 'EC':
        return 'text-green-600';
      case 'PT':
        return 'text-purple-600';
      case 'PF':
        return 'text-orange-600';
      case 'TO':
        return 'text-indigo-600';
      default:
        return 'text-gray-600';
    }
  };

  const Icon = getAxisIcon(axisDetail.axis);
  const axisName = getAxisName(axisDetail.axis);
  const axisColor = getAxisColor(axisDetail.axis);

  const handleClick = () => {
    if (onClick) {
      onClick(axisDetail.axis);
    }
  };

  if (compact) {
    return (
      <div
        className={`
          flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white
          hover:shadow-md transition-all duration-200
          ${onClick ? 'cursor-pointer hover:border-gray-300' : ''}
          ${className}
        `}
        onClick={handleClick}
      >
        {/* 아이콘 */}
        <div className={`flex-shrink-0 ${axisColor}`}>
          <Icon size={20} />
        </div>

        {/* 축 정보 */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-800 text-sm truncate">
            {axisName}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg font-bold text-gray-900">
              {axisDetail.score.toFixed(1)}
            </span>
            <StatusBadge status={axisDetail.status} size="sm" />
          </div>
        </div>

        {/* 트렌드 */}
        {showTrend && axisDetail.trend && (
          <div className="flex-shrink-0">
            {axisDetail.trend.direction === 'up' && (
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp size={14} />
                <span className="text-xs font-medium">
                  +{axisDetail.trend.value.toFixed(1)}
                </span>
              </div>
            )}
            {axisDetail.trend.direction === 'down' && (
              <div className="flex items-center gap-1 text-red-600">
                <TrendingDown size={14} />
                <span className="text-xs font-medium">
                  {axisDetail.trend.value.toFixed(1)}
                </span>
              </div>
            )}
            {axisDetail.trend.direction === 'stable' && (
              <div className="flex items-center gap-1 text-gray-400">
                <Minus size={14} />
                <span className="text-xs font-medium">0.0</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`
        p-6 border border-gray-200 rounded-lg bg-white
        hover:shadow-lg transition-all duration-200
        ${onClick ? 'cursor-pointer hover:border-gray-300' : ''}
        ${className}
      `}
      onClick={handleClick}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gray-50 ${axisColor}`}>
            <Icon size={24} />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">{axisName}</h4>
            <p className="text-sm text-gray-500">
              {axisDetail.axis} 영역
            </p>
          </div>
        </div>

        <StatusBadge status={axisDetail.status} size="md" />
      </div>

      {/* 점수 표시 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-gray-900">
            {axisDetail.score.toFixed(1)}
          </span>
          <span className="text-sm text-gray-500">/ 100점</span>
        </div>

        <ScoreDisplay
          score={axisDetail.score}
          variant="linear"
          showLabel={false}
          previousScore={axisDetail.trend?.value ? axisDetail.score - axisDetail.trend.value : undefined}
        />
      </div>

      {/* 트렌드 정보 */}
      {showTrend && axisDetail.trend && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {axisDetail.trend.period || '이전 대비'}
            </span>
            <div className="flex items-center gap-1">
              {axisDetail.trend.direction === 'up' && (
                <>
                  <TrendingUp size={16} className="text-green-500" />
                  <span className="text-sm font-medium text-green-600">
                    +{axisDetail.trend.value.toFixed(1)}점
                  </span>
                </>
              )}
              {axisDetail.trend.direction === 'down' && (
                <>
                  <TrendingDown size={16} className="text-red-500" />
                  <span className="text-sm font-medium text-red-600">
                    {axisDetail.trend.value.toFixed(1)}점
                  </span>
                </>
              )}
              {axisDetail.trend.direction === 'stable' && (
                <>
                  <Minus size={16} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-500">
                    변화 없음
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 주요 KPI */}
      {axisDetail.keyKPIs.length > 0 && (
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">주요 KPI</h5>
          <div className="space-y-2">
            {axisDetail.keyKPIs.slice(0, 3).map((kpi, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 truncate">{kpi.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{kpi.score.toFixed(1)}</span>
                  <StatusBadge status={kpi.status} size="sm" variant="outline" />
                </div>
              </div>
            ))}
            {axisDetail.keyKPIs.length > 3 && (
              <div className="text-xs text-gray-500 text-center pt-1">
                +{axisDetail.keyKPIs.length - 3}개 추가
              </div>
            )}
          </div>
        </div>
      )}

      {/* 인사이트 */}
      {axisDetail.insights.length > 0 && (
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">주요 발견사항</h5>
          <ul className="space-y-1">
            {axisDetail.insights.slice(0, 2).map((insight, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                <span className="leading-relaxed">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 권장사항 */}
      {axisDetail.recommendations.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">권장사항</h5>
          <ul className="space-y-1">
            {axisDetail.recommendations.slice(0, 2).map((recommendation, index) => (
              <li key={index} className="text-sm text-blue-600 flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-blue-400 mt-2 flex-shrink-0"></span>
                <span className="leading-relaxed">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 위험도 표시 */}
      {axisDetail.riskLevel === 'high' && (
        <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          ⚠️ 즉시 개선이 필요한 영역입니다.
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function - returns true to skip re-render
  return (
    prevProps.compact === nextProps.compact &&
    prevProps.showTrend === nextProps.showTrend &&
    prevProps.className === nextProps.className &&
    prevProps.axisDetail === nextProps.axisDetail &&
    prevProps.onClick === nextProps.onClick
  );
});

AxisScoreDisplay.displayName = 'AxisScoreDisplay';