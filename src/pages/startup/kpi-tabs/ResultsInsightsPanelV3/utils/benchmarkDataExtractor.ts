/**
 * Benchmark Data Extractor
 * Page 4용 벤치마크 및 레이더 데이터 추출
 */

import type { ProcessedKPIData, RadarData } from '@/types/reportV3.types';

export interface FullRadarChartData {
  axes: Array<{
    name: string;
    displayName: string;
    currentScore: number;
    benchmarkScore: number;
    gap: number;
  }>;
  currentScores: Record<string, number>;
  benchmarkScores: Record<string, number>;
}

export interface BenchmarkComparison {
  axis: string;
  displayName: string;
  myScore: number;
  industryAvg: number;
  topQuartile: number;
  gap: number;
  percentile: number;
  status: 'above' | 'at' | 'below';
}

export interface PercentileData {
  overallPercentile: number;
  axisPercentiles: Array<{
    axis: string;
    displayName: string;
    percentile: number;
    status: 'excellent' | 'good' | 'fair' | 'needs_attention';
  }>;
}

export interface GapAnalysisItem {
  axis: string;
  displayName: string;
  gap: number;
  severity: 'critical' | 'moderate' | 'minor';
  recommendation: string;
  priority: number;
}

export interface BenchmarkRadarData {
  radarChart: FullRadarChartData;
  comparisons: BenchmarkComparison[];
  percentile: PercentileData;
  gaps: GapAnalysisItem[];
}

/**
 * Extract Benchmark & Radar data from processed data
 */
export function extractBenchmarkRadarData(
  radarData: RadarData,
  processedData: ProcessedKPIData[]
): BenchmarkRadarData {
  const { currentScores = {}, comparisonData = {}, axes = [] } = radarData;

  // Full Radar Chart Data
  const radarChartData: FullRadarChartData = {
    axes: axes.map((axis) => {
      const currentScore = currentScores[axis] || 0;
      const benchmarkScore = comparisonData[axis] || currentScore;
      const gap = currentScore - benchmarkScore;

      return {
        name: axis,
        displayName: getAxisDisplayName(axis),
        currentScore,
        benchmarkScore,
        gap
      };
    }),
    currentScores,
    benchmarkScores: comparisonData
  };

  // Benchmark Comparisons
  const comparisons: BenchmarkComparison[] = axes.map((axis) => {
    const myScore = currentScores[axis] || 0;
    const industryAvg = comparisonData[axis] || 50;
    const topQuartile = industryAvg + 20; // Mock top quartile
    const gap = myScore - industryAvg;

    // Calculate percentile (mock)
    const percentile = Math.min(Math.max((myScore / 100) * 100, 0), 100);

    const status = gap > 5 ? 'above' : gap < -5 ? 'below' : 'at';

    return {
      axis,
      displayName: getAxisDisplayName(axis),
      myScore,
      industryAvg,
      topQuartile,
      gap,
      percentile,
      status
    };
  });

  // Percentile Data
  const axisPercentiles = axes.map((axis) => {
    const score = currentScores[axis] || 0;
    const percentile = Math.min(Math.max((score / 100) * 100, 0), 100);

    let status: 'excellent' | 'good' | 'fair' | 'needs_attention';
    if (percentile >= 75) status = 'excellent';
    else if (percentile >= 50) status = 'good';
    else if (percentile >= 25) status = 'fair';
    else status = 'needs_attention';

    return {
      axis,
      displayName: getAxisDisplayName(axis),
      percentile,
      status
    };
  });

  const overallPercentile =
    axisPercentiles.reduce((sum, item) => sum + item.percentile, 0) /
    axisPercentiles.length;

  const percentileData: PercentileData = {
    overallPercentile,
    axisPercentiles
  };

  // Gap Analysis
  const gaps: GapAnalysisItem[] = comparisons
    .map((comp) => {
      const absGap = Math.abs(comp.gap);
      let severity: 'critical' | 'moderate' | 'minor';
      let priority: number;

      if (absGap > 20) {
        severity = 'critical';
        priority = 1;
      } else if (absGap > 10) {
        severity = 'moderate';
        priority = 2;
      } else {
        severity = 'minor';
        priority = 3;
      }

      const recommendation =
        comp.gap < 0
          ? `${comp.displayName} 영역을 집중 개선하여 업계 평균(${comp.industryAvg.toFixed(1)})을 달성하세요.`
          : `${comp.displayName} 영역의 우수성을 유지하며 다른 영역 개선에 집중하세요.`;

      return {
        axis: comp.axis,
        displayName: comp.displayName,
        gap: comp.gap,
        severity,
        recommendation,
        priority
      };
    })
    .filter((gap) => gap.gap < -5) // Only show gaps below benchmark
    .sort((a, b) => a.priority - b.priority);

  return {
    radarChart: radarChartData,
    comparisons,
    percentile: percentileData,
    gaps
  };
}

/**
 * Get display name for axis
 */
function getAxisDisplayName(axis: string): string {
  const names: Record<string, string> = {
    'product_market_fit': 'Product-Market Fit',
    'business_model': 'Business Model',
    'team_execution': 'Team & Execution',
    'traction_growth': 'Traction & Growth',
    'financial_health': 'Financial Health',
    'market_opportunity': 'Market Opportunity',
    'technology_innovation': 'Technology & Innovation',
    'customer_satisfaction': 'Customer Satisfaction',
    'operational_efficiency': 'Operational Efficiency',
    'competitive_advantage': 'Competitive Advantage'
  };

  return names[axis] || axis
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
