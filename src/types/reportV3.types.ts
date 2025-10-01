/**
 * Report V3 전용 타입 정의
 * KPI 진단 결과를 레포트 형태로 가공하기 위한 데이터 구조
 */

import type { AxisKey, KPIDefinition, KPIResponse, ClusterInfo } from './index';

// 섹터와 단계 이름 매핑
export const SECTOR_NAMES = {
  'S-1': 'B2B SaaS',
  'S-2': 'B2C 플랫폼',
  'S-3': '이커머스',
  'S-4': '핀테크',
  'S-5': '헬스케어'
} as const;

export const STAGE_NAMES = {
  'A-1': '아이디어',
  'A-2': '창업초기',
  'A-3': 'PMF 검증',
  'A-4': 'Pre-A',
  'A-5': 'Series A+'
} as const;

// 가중치 레벨 정의
export type WeightLevel = 'x1' | 'x2' | 'x3';

export interface WeightInfo {
  level: WeightLevel;
  priority: number; // 1이 가장 높은 우선순위
  emphasis: 'critical' | 'important' | 'normal';
  sectionSize: 'large' | 'medium' | 'small';
  visualizationType: 'detailed' | 'standard' | 'minimal';
}

// 처리된 KPI 데이터
export interface ProcessedKPIData {
  kpi: KPIDefinition;
  response: KPIResponse;
  weight: WeightInfo;
  processedValue: ProcessedValue;
  insights: KPIInsight;
  benchmarkInfo?: BenchmarkInfo;
}

// 데이터 타입별 처리된 값
export type ProcessedValue =
  | NumericProcessedValue
  | RubricProcessedValue
  | MultiSelectProcessedValue
  | CalculationProcessedValue;

export interface NumericProcessedValue {
  type: 'numeric';
  rawValue: number;
  displayValue: string;
  unit?: string;
  percentile?: number;
  benchmark?: {
    min: number;
    max: number;
    average: number;
  };
}

export interface RubricProcessedValue {
  type: 'rubric';
  selectedIndex: number;
  selectedChoice: {
    index: number;
    label: string;
    score: number;
  };
  level: 'excellent' | 'good' | 'fair' | 'needs_improvement';
  interpretation: string;
}

export interface MultiSelectProcessedValue {
  type: 'multiselect';
  selectedIndices: number[];
  selectedChoices: Array<{
    index: number;
    label: string;
    score: number;
    weight?: number;
  }>;
  strengths: string[];
  gaps: string[];
  totalScore: number;
}

export interface CalculationProcessedValue {
  type: 'calculation';
  calculatedValue: number;
  displayValue: string;
  inputs: Record<string, number>;
  formula: string;
  unit?: string;
}

// KPI별 인사이트
export interface KPIInsight {
  summary: string;           // 한 줄 요약
  interpretation: string;    // 상세 해석
  recommendation?: string;   // 개선 권장사항
  riskLevel: 'low' | 'medium' | 'high';
  aiGenerated: boolean;
}

// 벤치마크 정보
export interface BenchmarkInfo {
  percentile: number;        // 상위 몇 %인지
  clusterAverage: number;    // 동일 클러스터 평균
  industryAverage: number;   // 업계 전체 평균
  status: 'excellent' | 'above_average' | 'average' | 'below_average' | 'poor';
  comparison: string;        // 비교 설명 문구
}

// 클러스터별 설정
export interface ClusterConfig {
  clusterKey: string;        // "S1-A3" 형태
  sector: keyof typeof SECTOR_NAMES;
  stage: keyof typeof STAGE_NAMES;
  sectorName: string;        // "B2B SaaS"
  stageName: string;         // "PMF 검증"
  criticalKPIs: string[];    // x3 가중치 KPI IDs
  importantKPIs: string[];   // x2 가중치 KPI IDs
  focusAreas: FocusArea[];   // 해당 클러스터의 핵심 관심 영역
  benchmarkGroup: string;    // 벤치마크 비교군
  nextStageRequirements: NextStageRequirement[];
}

export type FocusArea =
  | 'product_market_fit'
  | 'unit_economics'
  | 'user_acquisition'
  | 'scaling_readiness'
  | 'team_building'
  | 'fundraising_prep'
  | 'technology_validation'
  | 'business_model_validation';

export interface NextStageRequirement {
  area: string;
  requirement: string;
  targetMetric?: {
    name: string;
    target: string;
  };
}

// 레포트 섹션별 데이터
export interface ReportData {
  metadata: ReportMetadata;
  executiveSummary: ExecutiveSummaryData;
  businessOverview: BusinessOverviewData;
  criticalMetrics: CriticalMetricsData;
  axisAnalysis: AxisAnalysisData;
  benchmarking: BenchmarkingData;
  recommendations: RecommendationsData;
}

export interface ReportMetadata {
  companyName?: string;
  generatedAt: Date;
  cluster: ClusterConfig;
  overallScore: number;
  completionRate: number;
  version: string;
}

export interface ExecutiveSummaryData {
  overallScore: number;
  clusterInfo: ClusterConfig;
  keyHighlights: Array<{
    type: 'strength' | 'concern' | 'opportunity';
    title: string;
    description: string;
    score?: number;
  }>;
  aiSummary?: string;
}

export interface BusinessOverviewData {
  basicInfo: {
    sector: string;
    stage: string;
    establishedDate?: string;
    teamSize?: number;
    monthlyRevenue?: number;
  };
  keyMetrics: Array<{
    name: string;
    value: string;
    trend?: 'up' | 'down' | 'stable';
  }>;
}

export interface CriticalMetricsData {
  criticalKPIs: ProcessedKPIData[];
  riskFlags: Array<{
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    affectedKPIs: string[];
  }>;
}

export interface AxisAnalysisData {
  axisScores: Record<AxisKey, {
    score: number;
    percentile: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    topKPIs: Array<{
      kpi: KPIDefinition;
      contribution: number;
    }>;
    insight: string;
  }>;
}

// 축별 상세 분석 데이터 (Step 2.4에서 추가)
export interface AxisDetailData {
  axis: AxisKey;
  axisName: string;
  summary: {
    totalKPIs: number;
    completedKPIs: number;
    averageScore: number;
    trend: 'up' | 'down' | 'stable';
    trendValue?: number; // 변화량 (%)
    percentile: number; // 업계 대비 백분위
    status: 'excellent' | 'good' | 'fair' | 'poor';
  };

  kpiBreakdown: Array<{
    kpiId: string;
    name: string;
    score: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    weight: 'critical' | 'important' | 'normal';
    improvement: string; // 개선 방안
    benchmark?: number; // 업계 평균
    gap?: number; // 벤치마크와의 차이
  }>;

  insights: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    risks: string[];
  };

  historicalData?: Array<{
    date: string;
    score: number;
  }>;

  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    impact: string;
    timeframe: string;
  }>;
}

export interface BenchmarkingData {
  clusterComparison: {
    overallPosition: number; // 상위 몇 %
    strengthAreas: AxisKey[];
    improvementAreas: AxisKey[];
    peerComparison: string;
  };
  industryTrends: Array<{
    metric: string;
    trend: string;
    impact: string;
  }>;
}

export interface RecommendationsData {
  prioritizedActions: Array<{
    priority: 1 | 2 | 3;
    title: string;
    description: string;
    timeframe: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
    affectedAxis: AxisKey[];
  }>;
  quickWins: Array<{
    title: string;
    description: string;
    timeframe: string;
  }>;
  nextStagePrep: NextStageRequirement[];
}

// 유틸리티 타입
export interface DataProcessorOptions {
  includeAI: boolean;
  includeBenchmark: boolean;
  detailLevel: 'minimal' | 'standard' | 'detailed';
  language: 'ko' | 'en';
}

export interface ReportGenerationOptions {
  sections: Array<keyof ReportData>;
  exportFormat: 'web' | 'pdf' | 'json';
  styling: 'professional' | 'casual' | 'technical';
}

// Phase 2C: 데이터 분석 엔진 타입

// 상관관계 인사이트
export interface CorrelationInsight {
  type: 'correlation' | 'derived_metric' | 'unit_economics' | 'risk_alert';
  title: string;
  description: string; // 계산된 값 (예: "$52/user", "2.8:1")
  interpretation: string; // 해석
  priority: 'critical' | 'high' | 'medium' | 'low';
  affectedKPIs: string[]; // 연관된 KPI ID 배열
  score: number; // 0-100 점수
}

// 리스크 알림
export interface RiskAlert {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  affectedKPIs: string[];
  suggestedActions: string[];
  detectedBy: string; // 어떤 룰이 탐지했는지
}

// 데이터 분석 결과
export interface DataAnalysisResult {
  correlations: CorrelationInsight[];
  risks: RiskAlert[];
  generatedAt: Date;
}