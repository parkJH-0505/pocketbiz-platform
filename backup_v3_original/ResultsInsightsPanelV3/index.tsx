/**
 * ResultsInsightsPanelV3 Index
 * V3 레포트 시스템의 메인 진입점
 */

export { ResultsInsightsPanelV3 } from './ResultsInsightsPanelV3';

// 컴포넌트들 내보내기
export { ReportHeader } from './components/layout/ReportHeader';
export { ReportFooter } from './components/layout/ReportFooter';
export { ReportSection } from './components/layout/ReportSection';

export { ExecutiveSummary } from './components/insights/ExecutiveSummary';
export { KeyInsights } from './components/insights/KeyInsights';
export { InsightCard } from './components/insights/InsightCard';

export { RadarOverview } from './components/radar/RadarOverview';
export { RadarChartEnhanced } from './components/radar/RadarChartEnhanced';
export { AxisScoreDisplay } from './components/radar/AxisScoreDisplay';

export { ScoreDisplay } from './components/shared/ScoreDisplay';
export { StatusBadge } from './components/shared/StatusBadge';
export { LoadingState } from './components/shared/LoadingState';

// 훅들 내보내기
export { useReportData } from './hooks/useReportData';

// 타입들 내보내기
export type {
  ReportData,
  ReportMetadata,
  ReportSummary,
  ReportHeaderProps,
  ReportFooterProps,
  ReportSectionProps,
  ScoreDisplayProps,
  StatusBadgeProps,
  LoadingStateProps,
  UseReportDataReturn
} from './types/reportV3UI.types';