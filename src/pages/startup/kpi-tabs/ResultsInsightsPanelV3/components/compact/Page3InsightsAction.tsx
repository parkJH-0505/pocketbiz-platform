/**
 * Page 3: Insights & Action Plan
 * 2열 레이아웃: 왼쪽(Risks & Insights), 오른쪽(Action Plan)
 * Height: ~1200px (1 page)
 */

import React from 'react';
import type { RiskAlert, CorrelationInsight } from '@/types/reportV3.types';

interface ActionItem {
  priority: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
}

interface Page3InsightsActionProps {
  risks: RiskAlert[];
  correlations: CorrelationInsight[];
  actions: ActionItem[];
  className?: string;
}

export const Page3InsightsAction: React.FC<Page3InsightsActionProps> = ({
  risks,
  correlations,
  actions,
  className = ''
}) => {
  const criticalRisks = risks.filter(r => r.severity === 'critical').slice(0, 3);
  const criticalActions = actions.filter(a => a.priority === 'critical').slice(0, 2);
  const highActions = actions.filter(a => a.priority === 'high').slice(0, 3);

  return (
    <div className={`page-3-insights-action ${className}`} style={{ minHeight: '1200px' }}>
      <div className="grid grid-cols-2 gap-8">
        {/* 왼쪽: Risks & Insights */}
        <div className="insights-column">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            🚨 Risk & Insights
          </h3>

          {/* Critical Risks */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Critical Risks ({criticalRisks.length})
            </h4>
            <div className="space-y-3">
              {criticalRisks.length > 0 ? (
                criticalRisks.map((risk, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">⚠</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-900">
                          {risk.title}
                        </p>
                        <p className="text-xs text-red-700 mt-1">
                          {risk.description.slice(0, 80)}...
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">
                  긴급 리스크 없음
                </p>
              )}
            </div>
          </div>

          {/* Correlations */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Derived Metrics ({correlations.length})
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {correlations.slice(0, 4).map((corr, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-blue-50 border border-blue-200 rounded text-center"
                >
                  <p className="text-xs text-gray-600">{corr.title}</p>
                  <p className="text-lg font-bold text-blue-700">
                    {corr.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Placeholder */}
          <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <p className="text-xs text-gray-500">
              Phase 4.5에서 구현 예정
            </p>
          </div>
        </div>

        {/* 오른쪽: Action Plan */}
        <div className="action-column">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            💡 Action Plan
          </h3>

          {/* 긴급 액션 */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              🔥 긴급 액션 ({criticalActions.length})
            </h4>
            <div className="space-y-3">
              {criticalActions.map((action, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-sm font-semibold text-red-900">
                    {action.title}
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    {action.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 중요 액션 */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              ⚡ 중요 액션 ({highActions.length})
            </h4>
            <div className="space-y-2">
              {highActions.map((action, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-orange-50 border border-orange-200 rounded-lg"
                >
                  <p className="text-sm font-semibold text-orange-900">
                    {action.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Placeholder */}
          <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <p className="text-xs text-gray-500">
              Phase 4.5에서 구현 예정
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
