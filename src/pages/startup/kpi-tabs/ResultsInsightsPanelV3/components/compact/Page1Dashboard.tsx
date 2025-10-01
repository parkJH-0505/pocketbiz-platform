/**
 * Page 1: Executive Dashboard
 * 핵심 메트릭과 요약 정보를 compact하게 표시
 * Height: ~860px (1 page)
 */

import React, { useMemo } from 'react';
import { BarChart3, Target, CheckCircle } from 'lucide-react';
import type { ReportData } from '../../types/reportV3UI.types';
import { extractDashboardData, getMetricColor } from '../../utils/dashboardDataExtractor';

// Dashboard 서브 컴포넌트들
import { MetricCard } from './dashboard/MetricCard';
import { AlertsPreview } from './dashboard/AlertsPreview';
import { RadarPreview } from './dashboard/RadarPreview';
import { HighlightsList } from './dashboard/HighlightsList';
import { AxisScoresRow } from './dashboard/AxisScoresRow';
import { AISummaryBox } from './dashboard/AISummaryBox';

interface Page1DashboardProps {
  reportData: ReportData;
  aiSummary?: string | null;
  isGeneratingAI?: boolean;
  onRegenerateAI?: () => void;
  className?: string;
}

export const Page1Dashboard: React.FC<Page1DashboardProps> = ({
  reportData,
  aiSummary,
  isGeneratingAI = false,
  onRegenerateAI,
  className = ''
}) => {
  const { metadata, summary } = reportData;

  // Dashboard 데이터 추출
  const dashboardData = useMemo(
    () => extractDashboardData(reportData),
    [reportData]
  );

  // 메트릭 색상 계산
  const scoreColor = getMetricColor(dashboardData.overallScore, 'score');
  const criticalColor = getMetricColor(dashboardData.criticalKPIs, 'count');
  const completionColor = getMetricColor(dashboardData.completionRate, 'completion');

  return (
    <div className={`page-1-dashboard ${className}`} style={{ minHeight: '860px' }}>
      {/* Header Bar */}
      <div className="dashboard-header p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg mb-4 border border-indigo-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              KPI 진단 레포트 V3
            </h2>
            <p className="text-sm text-gray-600">
              {metadata.cluster.sector} • {metadata.cluster.stage} •
              <span className="ml-2">
                생성일: {new Date(metadata.generatedAt).toLocaleDateString('ko-KR')}
              </span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500">Version {metadata.version}</span>
            <p className="text-xs text-indigo-600 font-medium mt-1">
              총 {metadata.totalKPIs}개 KPI 분석
            </p>
          </div>
        </div>
      </div>

      {/* 4-column Top Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Overall Score"
          value={dashboardData.overallScore.toFixed(1)}
          unit="/100"
          icon={BarChart3}
          description="전체 점수"
          color={scoreColor}
        />

        <MetricCard
          label="Critical KPIs"
          value={dashboardData.criticalKPIs}
          unit="개"
          icon={Target}
          description={`총 ${metadata.totalKPIs}개 중`}
          color={criticalColor}
        />

        <MetricCard
          label="완료율"
          value={dashboardData.completionRate.toFixed(0)}
          unit="%"
          icon={CheckCircle}
          description="진단 완료 비율"
          color={completionColor}
        />

        <AlertsPreview alerts={dashboardData.criticalAlerts} />
      </div>

      {/* 2-column: Radar Preview & Highlights */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <RadarPreview radarData={dashboardData.radarData} />
        <HighlightsList highlights={dashboardData.highlights} />
      </div>

      {/* 5-column: Axis Scores */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          5축 균형 점수
        </h4>
        <AxisScoresRow axisScores={dashboardData.axisScores} />
      </div>

      {/* AI Summary */}
      <AISummaryBox
        summary={aiSummary || dashboardData.aiSummary}
        isGenerating={isGeneratingAI}
        onRegenerate={onRegenerateAI}
      />
    </div>
  );
};
