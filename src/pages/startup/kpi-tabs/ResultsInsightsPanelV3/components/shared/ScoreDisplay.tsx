/**
 * ScoreDisplay Component
 * 점수를 시각적으로 표시하는 컴포넌트 (원형, 선형, 단순 텍스트)
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ScoreDisplayProps } from '../../types/reportV3UI.types';

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  size = 'md',
  showLabel = true,
  label,
  variant = 'circular',
  color,
  previousScore,
  className = ''
}) => {
  // 점수 기반 색상 결정
  const getScoreColor = () => {
    if (color) return color;

    if (score >= 85) return 'var(--report-excellent)';
    if (score >= 70) return 'var(--report-good)';
    if (score >= 50) return 'var(--report-fair)';
    return 'var(--report-needs-attention)';
  };

  // 이전 점수와 비교한 트렌드 계산
  const getTrend = () => {
    if (!previousScore) return null;

    const diff = score - previousScore;
    if (Math.abs(diff) < 1) return { direction: 'stable' as const, value: diff };
    if (diff > 0) return { direction: 'up' as const, value: diff };
    return { direction: 'down' as const, value: diff };
  };

  const trend = getTrend();
  const scoreColor = getScoreColor();

  // 원형 변형
  if (variant === 'circular') {
    return (
      <div className={`score-display size-${size} ${className}`}>
        <div
          className="score-circle"
          style={{
            '--score-percent': Math.max(0, Math.min(100, score)),
            '--score-color': scoreColor
          } as React.CSSProperties}
        >
          <div className="flex flex-col items-center">
            <span className="font-bold">
              {score.toFixed(1)}
            </span>
            {size !== 'sm' && showLabel && (
              <span className="text-xs opacity-75">
                {label || '점'}
              </span>
            )}
          </div>
        </div>

        {/* 트렌드 표시 */}
        {trend && size !== 'sm' && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white shadow-sm border">
              {trend.direction === 'up' && <TrendingUp size={12} className="text-green-500" />}
              {trend.direction === 'down' && <TrendingDown size={12} className="text-red-500" />}
              {trend.direction === 'stable' && <Minus size={12} className="text-gray-400" />}
              <span className={`text-xs font-medium ${
                trend.direction === 'up' ? 'text-green-500' :
                trend.direction === 'down' ? 'text-red-500' :
                'text-gray-400'
              }`}>
                {trend.direction === 'stable' ? '0.0' :
                 trend.direction === 'up' ? `+${trend.value.toFixed(1)}` :
                 trend.value.toFixed(1)
                }
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 선형 변형
  if (variant === 'linear') {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {showLabel && (
          <div className="flex justify-between items-center">
            <span className="report-caption">
              {label || '점수'}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-semibold" style={{ color: scoreColor }}>
                {score.toFixed(1)}
              </span>
              {trend && (
                <div className="flex items-center gap-1">
                  {trend.direction === 'up' && <TrendingUp size={14} className="text-green-500" />}
                  {trend.direction === 'down' && <TrendingDown size={14} className="text-red-500" />}
                  {trend.direction === 'stable' && <Minus size={14} className="text-gray-400" />}
                  <span className={`text-xs ${
                    trend.direction === 'up' ? 'text-green-500' :
                    trend.direction === 'down' ? 'text-red-500' :
                    'text-gray-400'
                  }`}>
                    {trend.direction === 'stable' ? '0.0' :
                     trend.direction === 'up' ? `+${trend.value.toFixed(1)}` :
                     trend.value.toFixed(1)
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div
          className="score-linear"
          style={{
            '--score-percent': Math.max(0, Math.min(100, score)),
            '--score-color': scoreColor
          } as React.CSSProperties}
        >
          <div className="score-linear-fill" />
        </div>
      </div>
    );
  }

  // 단순 텍스트 변형
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className={`font-bold ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg'}`}
        style={{ color: scoreColor }}
      >
        {score.toFixed(1)}
      </span>

      {showLabel && (
        <span className="text-sm text-muted">
          {label || '점'}
        </span>
      )}

      {trend && (
        <div className="flex items-center gap-1">
          {trend.direction === 'up' && <TrendingUp size={16} className="text-green-500" />}
          {trend.direction === 'down' && <TrendingDown size={16} className="text-red-500" />}
          {trend.direction === 'stable' && <Minus size={16} className="text-gray-400" />}
          <span className={`text-sm font-medium ${
            trend.direction === 'up' ? 'text-green-500' :
            trend.direction === 'down' ? 'text-red-500' :
            'text-gray-400'
          }`}>
            {trend.direction === 'stable' ? '±0' :
             trend.direction === 'up' ? `+${trend.value.toFixed(1)}` :
             trend.value.toFixed(1)
            }
          </span>
        </div>
      )}
    </div>
  );
};