/**
 * Score Trend Widget
 * 점수 트렌드 차트 위젯
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useKPIDiagnosis } from '../../../../contexts/KPIDiagnosisContext';
import type { WidgetComponentProps } from '../WidgetRegistry';
import type { AxisKey } from '../../../../pages/startup/kpi-tabs/ResultsInsightsPanelV2/types';

const ScoreTrendWidget: React.FC<WidgetComponentProps> = ({ widgetId, config }) => {
  const { axisScores, previousScores } = useKPIDiagnosis();
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

  // 변화량 계산
  const getChangeData = (axis: AxisKey) => {
    const current = axisScores[axis] || 0;
    const previous = previousScores?.[0]?.scores?.[axis] || current;
    const change = current - previous;
    const percentage = previous > 0 ? (change / previous) * 100 : 0;

    return {
      current,
      previous,
      change,
      percentage,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  };

  const axisColors: Record<AxisKey, string> = {
    GO: 'bg-green-500',
    EC: 'bg-orange-500',
    PT: 'bg-blue-500',
    PF: 'bg-red-500',
    TO: 'bg-gray-500'
  };

  return (
    <div className="space-y-3">
      {axes.map(axis => {
        const data = getChangeData(axis);
        return (
          <div key={axis} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-8 ${axisColors[axis]} rounded`} />
              <div>
                <div className="text-sm font-semibold text-neutral-dark">{axis}</div>
                <div className="text-xs text-neutral-gray">
                  {data.previous.toFixed(1)} → {data.current.toFixed(1)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`
                text-sm font-semibold
                ${data.trend === 'up' ? 'text-green-600' :
                  data.trend === 'down' ? 'text-red-600' : 'text-gray-600'}
              `}>
                {data.change > 0 ? '+' : ''}{data.change.toFixed(1)}
              </span>
              {data.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : data.trend === 'down' ? (
                <TrendingDown className="w-4 h-4 text-red-600" />
              ) : (
                <Minus className="w-4 h-4 text-gray-600" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ScoreTrendWidget;