/**
 * CompactLayout
 * 4-page 최적화 레이아웃 컨테이너
 * Phase 4: Compact Layout Refactoring
 */

import React, { useMemo } from 'react';
import { Page1Dashboard } from './Page1Dashboard';
import { Page2UnifiedKPITable } from './Page2UnifiedKPITable';
import { Page3InsightsAction } from './Page3InsightsAction';
import { Page4BenchmarkRadar } from './Page4BenchmarkRadar';
import type { ReportData } from '../../types/reportV3UI.types';
import type { ProcessedKPIData } from '@/types/reportV3.types';
import type { ClusterInfo } from '@/types/kpi.types';

interface CompactLayoutProps {
  reportData: ReportData;
  processedData: ProcessedKPIData[];
  cluster: ClusterInfo;
  className?: string;
}

export const CompactLayout: React.FC<CompactLayoutProps> = ({
  reportData,
  processedData,
  cluster,
  className = ''
}) => {
  // Extract data for Page 3
  const analysisResults = useMemo(() => {
    // Phase 4.5에서 실제 구현
    return {
      risks: reportData.insights
        ?.filter(i => i.type === 'risk')
        .map(i => ({
          severity: 'critical' as const,
          title: i.title || 'Risk',
          description: i.description || '',
          affectedKPIs: [],
          suggestedActions: [],
          detectedBy: 'system'
        })) || [],
      correlations: reportData.insights
        ?.filter(i => i.type === 'correlation')
        .map(i => ({
          type: 'derived' as const,
          title: i.title || 'Metric',
          description: i.description || '',
          interpretation: '',
          score: 0,
          priority: 'medium' as const,
          affectedKPIs: []
        })) || [],
      actions: reportData.insights
        ?.filter(i => i.type === 'action')
        .map(i => ({
          priority: 'high' as const,
          title: i.title || 'Action',
          description: i.description || ''
        })) || []
    };
  }, [reportData.insights]);

  return (
    <div className={`report-v3-compact ${className}`}>
      {/* Compact CSS 임포트 */}
      <style>
        {`
          .report-v3-compact {
            max-width: 1400px;
            margin: 0 auto;
            padding: 16px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }

          .report-v3-compact > div {
            margin-bottom: 24px;
            page-break-after: always;
          }

          .report-v3-compact > div:last-child {
            margin-bottom: 0;
          }

          @media print {
            .report-v3-compact > div {
              page-break-inside: avoid;
            }
          }
        `}
      </style>

      {/* Page 1: Executive Dashboard */}
      <Page1Dashboard
        reportData={reportData}
        className="page-break"
      />

      {/* Page 2: Unified KPI Table */}
      <Page2UnifiedKPITable
        processedData={processedData}
        cluster={cluster}
        className="page-break"
      />

      {/* Page 3: Insights & Action Plan */}
      <Page3InsightsAction
        risks={analysisResults.risks}
        correlations={analysisResults.correlations}
        actions={analysisResults.actions}
        className="page-break"
      />

      {/* Page 4: Benchmarking & Radar */}
      <Page4BenchmarkRadar
        radarData={reportData.radarData}
        processedData={processedData}
        cluster={cluster}
        overallScore={reportData.summary.overallScore}
        className="page-break"
      />

      {/* Phase Info */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
        <p className="text-sm text-blue-900 font-semibold">
          🚧 Compact Layout (Phase 4.2 - 구조 생성 완료)
        </p>
        <p className="text-xs text-blue-700 mt-1">
          Feature Flag: VITE_USE_COMPACT_LAYOUT=false (현재 비활성)
        </p>
        <p className="text-xs text-gray-600 mt-2">
          Phase 4.3~4.6에서 각 페이지 세부 구현 예정
        </p>
      </div>
    </div>
  );
};
