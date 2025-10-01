/**
 * Page 3: Insights & Action Plan
 * 좌측: Risks & Insights, 우측: Action Plan
 * Height: ~1200px (1 page)
 */

import React, { useMemo } from 'react';
import type { ReportData } from '@/types/reportV3.types';
import { extractInsightsActionData } from '../../utils/insightsDataExtractor';
import { CompactRiskCard } from './insights/CompactRiskCard';
import { CorrelationGrid } from './insights/CorrelationGrid';
import { UnitEconomicsChart } from './insights/UnitEconomicsChart';
import { CompactActionCard } from './insights/CompactActionCard';

interface Page3InsightsActionProps {
  reportData: ReportData;
  className?: string;
}

export const Page3InsightsAction: React.FC<Page3InsightsActionProps> = ({
  reportData,
  className = ''
}) => {
  // Extract insights & action data
  const insightsData = useMemo(
    () => extractInsightsActionData(reportData),
    [reportData]
  );

  return (
    <div className={`page-3-insights-action ${className}`} style={{ minHeight: '1200px' }}>
      {/* 헤더 */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          💡 인사이트 & 액션 플랜
        </h3>
        <p className="text-sm text-gray-600">
          핵심 리스크 분석 • 상관관계 인사이트 • Unit Economics • 우선순위별 액션 플랜
        </p>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* 좌측: Risks & Insights */}
        <div className="space-y-6">
          {/* Critical Risks */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-bold text-gray-900">⚠️ 핵심 리스크</h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                {insightsData.risks.length}개
              </span>
            </div>

            <div className="space-y-3">
              {insightsData.risks.map((risk) => (
                <CompactRiskCard key={risk.id} risk={risk} />
              ))}

              {insightsData.risks.length === 0 && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                  <p className="text-sm text-gray-500">
                    감지된 리스크가 없습니다
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Correlations */}
          <CorrelationGrid correlations={insightsData.correlations} />

          {/* Unit Economics */}
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <UnitEconomicsChart data={insightsData.unitEconomics} />
          </div>
        </div>

        {/* 우측: Action Plan */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-bold text-gray-900">🎯 액션 플랜</h4>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
              {insightsData.actionPlan.length}개
            </span>
          </div>

          <div className="space-y-3">
            {insightsData.actionPlan.map((action, index) => (
              <CompactActionCard
                key={action.id}
                action={action}
                index={index}
              />
            ))}

            {insightsData.actionPlan.length === 0 && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <p className="text-sm text-gray-500">
                  권장 액션 플랜이 없습니다
                </p>
              </div>
            )}
          </div>

          {/* Summary Footer */}
          {insightsData.actionPlan.length > 0 && (
            <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-700">
                    우선순위별 분포
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-600">
                      긴급: {insightsData.actionPlan.filter(a => a.priority === 'critical').length}개
                    </span>
                    <span className="text-xs text-gray-600">
                      높음: {insightsData.actionPlan.filter(a => a.priority === 'high').length}개
                    </span>
                    <span className="text-xs text-gray-600">
                      중간: {insightsData.actionPlan.filter(a => a.priority === 'medium').length}개
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
