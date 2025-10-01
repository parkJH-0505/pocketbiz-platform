/**
 * CorrelationGrid Component
 * 상관관계/파생 지표 표시 (간결한 그리드)
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { CorrelationInsight } from '../../../utils/insightsDataExtractor';

interface CorrelationGridProps {
  correlations: CorrelationInsight[];
  className?: string;
}

export const CorrelationGrid: React.FC<CorrelationGridProps> = ({
  correlations,
  className = ''
}) => {
  const getTypeConfig = (type: 'positive' | 'negative' | 'neutral') => {
    switch (type) {
      case 'positive':
        return {
          icon: TrendingUp,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: '긍정적'
        };
      case 'negative':
        return {
          icon: TrendingDown,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: '부정적'
        };
      case 'neutral':
        return {
          icon: Minus,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: '중립'
        };
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <h4 className="text-sm font-bold text-gray-900">🔗 상관관계 인사이트</h4>
        <span className="text-xs text-gray-500">
          {correlations.length}개
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {correlations.map((corr) => {
          const config = getTypeConfig(corr.type);
          const Icon = config.icon;

          return (
            <div
              key={corr.id}
              className={`p-3 border rounded-lg ${config.bgColor} ${config.borderColor}`}
            >
              <div className="flex items-start gap-2">
                <Icon size={16} className={config.color} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {corr.insight}
                  </p>

                  {/* Strength Bar */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-600">상관도:</span>
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          corr.strength >= 80 ? 'bg-green-500' :
                          corr.strength >= 60 ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`}
                        style={{ width: `${corr.strength}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">
                      {corr.strength.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {correlations.length === 0 && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <p className="text-sm text-gray-500">
            분석된 상관관계가 없습니다
          </p>
        </div>
      )}
    </div>
  );
};
