/**
 * Report V3 UI 전용 타입 정의
 * 컴포넌트 인터페이스와 UI 상태 관리용 타입들
 */

import type {
  ClusterInfo,
  AxisKey,
  ProcessedKPIData,
  GeneratedInsight,
  WeightLevel
} from '@/types/reportV3.types';

// ============================================================================
// 레포트 메타데이터 및 기본 구조
// ============================================================================

export interface ReportMetadata {
  generatedAt: Date;
  cluster: ClusterInfo;
  totalKPIs: number;
  companyName?: string;
  version: 'v3';
}

export interface ReportSummary {
  overallScore: number;
  status: 'excellent' | 'good' | 'fair' | 'needs_improvement';
  completionRate: number;
  criticalKPIs: number;
}

export interface ReportData {
  metadata: ReportMetadata;
  summary: ReportSummary;
  insights?: GeneratedInsight[];
  radarData?: RadarEnhancedData;
  axisDetails?: AxisDetail[];
  quickHighlights?: string[];
  criticalAlerts?: string[];
}

// ============================================================================
// 컴포넌트 Props 인터페이스들
// ============================================================================

// Header 컴포넌트
export interface ReportHeaderProps {
  metadata: ReportMetadata;
  summary: ReportSummary;
  isExportMode?: boolean;
  className?: string;
}

// Footer 컴포넌트
export interface ReportFooterProps {
  nextSteps: string[];
  generatedAt: Date;
  isExportMode?: boolean;
  contactInfo?: ContactInfo;
  className?: string;
}

export interface ContactInfo {
  website?: string;
  email?: string;
  support?: string;
}

// 섹션 래퍼 컴포넌트
export interface ReportSectionProps {
  title: string;
  subtitle?: string;
  height?: 'auto' | 'fixed' | 'flex';
  priority?: 'high' | 'medium' | 'low'; // PDF 출력시 페이지 분할 우선순위
  className?: string;
  children: React.ReactNode;
  isExportMode?: boolean;
}

// ============================================================================
// 공유 컴포넌트 Props
// ============================================================================

// 점수 표시 컴포넌트
export interface ScoreDisplayProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  variant?: 'circular' | 'linear' | 'simple';
  color?: string;
  previousScore?: number; // 트렌드 표시용
  className?: string;
}

// 상태 배지 컴포넌트
export interface StatusBadgeProps {
  status: 'excellent' | 'good' | 'fair' | 'needs_improvement' | 'critical';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'subtle';
  showIcon?: boolean;
  className?: string;
}

// 로딩 상태 컴포넌트
export interface LoadingStateProps {
  type?: 'skeleton' | 'spinner' | 'pulse';
  height?: number | string;
  className?: string;
  message?: string;
}

// ============================================================================
// 레이더 차트 고도화 타입들
// ============================================================================

export interface RadarEnhancedData {
  mainData: RadarDataPoint[];
  comparisonData?: RadarDataPoint[];
  thirdData?: RadarDataPoint[];
  annotations?: RadarAnnotation[];
  riskHighlights?: AxisKey[];
  achievementBadges?: AxisKey[];
  axisDetails: Record<AxisKey, AxisRadarDetail>;
}

export interface RadarDataPoint {
  axis: string;
  axisKey: AxisKey;
  value: number;
  fullMark: number;
  status?: 'excellent' | 'good' | 'fair' | 'needs_attention' | 'critical';
  weight?: WeightLevel;
}

export interface RadarAnnotation {
  axis: AxisKey;
  message: string;
  type: 'info' | 'warning' | 'success' | 'critical';
  position?: 'inner' | 'outer';
}

export interface AxisRadarDetail {
  score: number;
  previousScore?: number;
  peerAverage?: number;
  topPerformers?: number;
  weight: WeightLevel;
  keyKPIs: string[];
  insight: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
}

// 레이더 차트 Props
export interface RadarChartEnhancedProps {
  data: RadarEnhancedData;
  height?: number;
  showComparison?: boolean;
  enableAxisClick?: boolean;
  showTrendIndicators?: boolean;
  comparisonMode?: 'peer' | 'benchmark' | 'historical';
  onAxisSelect?: (axis: AxisKey) => void;
  isExportMode?: boolean;
  className?: string;
}

// ============================================================================
// 축별 상세 정보
// ============================================================================

export interface AxisDetail {
  axis: AxisKey;
  name: string;
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'needs_attention';
  weight: WeightLevel;
  trend?: AxisTrend;
  keyKPIs: AxisKPIInfo[];
  insights: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface AxisTrend {
  direction: 'up' | 'down' | 'stable';
  value: number; // 변화량
  period: string; // '지난 진단 대비', '1개월 전 대비' 등
}

export interface AxisKPIInfo {
  kpiId: string;
  name: string;
  score: number;
  weight: WeightLevel;
  status: 'excellent' | 'good' | 'fair' | 'needs_improvement';
}

// 축별 점수 표시 Props
export interface AxisScoreDisplayProps {
  axisDetail: AxisDetail;
  compact?: boolean;
  showTrend?: boolean;
  onClick?: (axis: AxisKey) => void;
  className?: string;
}

// ============================================================================
// UI 상태 관리
// ============================================================================

export interface ReportUIState {
  selectedAxis?: AxisKey;
  expandedSections: Set<string>;
  exportMode: boolean;
  loading: boolean;
  error?: string;
}

export interface ReportUIActions {
  setSelectedAxis: (axis?: AxisKey) => void;
  toggleSection: (sectionId: string) => void;
  setExportMode: (enabled: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error?: string) => void;
  reset: () => void;
}

// ============================================================================
// 훅 인터페이스들
// ============================================================================

export interface UseReportDataReturn {
  reportData: ReportData | null;
  processedData?: any[]; // ProcessedKPIData[] - 축별 상세 분석을 위한 데이터
  isLoading: boolean;
  error: string | null;
  regenerateReport: () => Promise<void>;
  exportToPDF: () => Promise<void>;
  // V2에서 추가된 기능들
  updateSingleKPI?: (kpi: any, response: any) => Promise<void>;
  pipelineInfo?: () => any;
}

export interface UseReportUIReturn {
  uiState: ReportUIState;
  actions: ReportUIActions;
}

// ============================================================================
// 이벤트 핸들러 타입들
// ============================================================================

export type AxisSelectHandler = (axis: AxisKey) => void;
export type SectionToggleHandler = (sectionId: string) => void;
export type ExportHandler = (format: 'pdf' | 'png') => Promise<void>;

// ============================================================================
// 유틸리티 타입들
// ============================================================================

export type ReportTheme = 'light' | 'dark' | 'print';

export interface ReportColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  neutral: string;
  background: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
}

export interface ReportBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
  wide: number;
}

// ============================================================================
// 상수들
// ============================================================================

export const REPORT_THEMES: Record<ReportTheme, ReportColors> = {
  light: {
    primary: '#8b5cf6',
    secondary: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    neutral: '#6b7280',
    background: '#ffffff',
    surface: '#f8fafc',
    border: '#e2e8f0',
    text: '#1e293b',
    textMuted: '#64748b'
  },
  dark: {
    primary: '#a855f7',
    secondary: '#7c3aed',
    success: '#059669',
    warning: '#d97706',
    danger: '#dc2626',
    info: '#2563eb',
    neutral: '#9ca3af',
    background: '#0f172a',
    surface: '#1e293b',
    border: '#334155',
    text: '#f1f5f9',
    textMuted: '#94a3b8'
  },
  print: {
    primary: '#4c1d95',
    secondary: '#5b21b6',
    success: '#065f46',
    warning: '#92400e',
    danger: '#991b1b',
    info: '#1e40af',
    neutral: '#374151',
    background: '#ffffff',
    surface: '#ffffff',
    border: '#d1d5db',
    text: '#111827',
    textMuted: '#4b5563'
  }
};

export const REPORT_BREAKPOINTS: ReportBreakpoints = {
  mobile: 767,
  tablet: 1023,
  desktop: 1279,
  wide: 1536
};

// ============================================================================
// 내보내기
// ============================================================================

export type {
  // Core types
  ReportMetadata,
  ReportSummary,
  ReportData,

  // Component Props
  ReportHeaderProps,
  ReportFooterProps,
  ReportSectionProps,
  ScoreDisplayProps,
  StatusBadgeProps,
  LoadingStateProps,

  // Radar types
  RadarEnhancedData,
  RadarDataPoint,
  RadarAnnotation,
  AxisRadarDetail,
  RadarChartEnhancedProps,

  // Axis types
  AxisDetail,
  AxisTrend,
  AxisKPIInfo,
  AxisScoreDisplayProps,

  // UI State
  ReportUIState,
  ReportUIActions,

  // Hooks
  UseReportDataReturn,
  UseReportUIReturn,

  // Handlers
  AxisSelectHandler,
  SectionToggleHandler,
  ExportHandler
};