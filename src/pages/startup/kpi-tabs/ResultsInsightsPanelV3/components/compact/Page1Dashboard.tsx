/**
 * Page 1: Executive Dashboard
 * 핵심 메트릭과 요약 정보를 compact하게 표시
 * Height: ~860px (1 page)
 */

import React from 'react';
import type { ReportData } from '../../types/reportV3UI.types';

interface Page1DashboardProps {
  reportData: ReportData;
  className?: string;
}

export const Page1Dashboard: React.FC<Page1DashboardProps> = ({
  reportData,
  className = ''
}) => {
  const { metadata, summary } = reportData;

  return (
    <div className={`page-1-dashboard ${className}`} style={{ minHeight: '860px' }}>
      {/* Header Bar */}
      <div className="dashboard-header p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {metadata.cluster.sector} • {metadata.cluster.stage}
            </h2>
            <p className="text-sm text-gray-600">
              생성일: {new Date(metadata.generatedAt).toLocaleDateString('ko-KR')}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500">Version {metadata.version}</span>
          </div>
        </div>
      </div>

      {/* Placeholder for 4-column metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Overall Score</p>
          <p className="text-3xl font-bold text-indigo-600">
            {summary.overallScore.toFixed(1)}
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Critical KPIs</p>
          <p className="text-3xl font-bold text-red-600">{summary.criticalKPIs}</p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">완료율</p>
          <p className="text-3xl font-bold text-green-600">
            {summary.completionRate.toFixed(0)}%
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Alerts</p>
          <p className="text-sm text-red-700 font-medium mt-2">
            Phase 4.3에서 구현 예정
          </p>
        </div>
      </div>

      {/* Placeholder for rest of content */}
      <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
        <p className="text-gray-500 text-sm">
          🚧 Page 1 Dashboard 구현 예정 (Phase 4.3)
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Radar Preview, Highlights, Axis Scores, AI Summary
        </p>
      </div>
    </div>
  );
};
