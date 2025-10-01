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
  aiSummary?: string | null;
  isGeneratingAI?: boolean;
  onRegenerateAI?: () => void;
  className?: string;
}

export const CompactLayout: React.FC<CompactLayoutProps> = ({
  reportData,
  processedData,
  cluster,
  aiSummary,
  isGeneratingAI = false,
  onRegenerateAI,
  className = ''
}) => {
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
        aiSummary={aiSummary}
        isGeneratingAI={isGeneratingAI}
        onRegenerateAI={onRegenerateAI}
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
        reportData={reportData}
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
      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
        <p className="text-sm text-green-900 font-semibold">
          ✅ Compact Layout (Phase 4.5 - Page 3 구현 완료)
        </p>
        <p className="text-xs text-green-700 mt-1">
          Feature Flag: VITE_USE_COMPACT_LAYOUT=false (현재 비활성)
        </p>
        <p className="text-xs text-gray-600 mt-2">
          Phase 4.6: Page 4 구현 예정
        </p>
      </div>
    </div>
  );
};
