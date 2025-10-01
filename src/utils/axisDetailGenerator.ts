/**
 * 축별 상세 데이터 생성기
 * ProcessedKPIData를 축별로 그룹화하고 분석하여 AxisDetailData를 생성
 */

import type { AxisKey, ProcessedKPIData, AxisDetailData } from '../types/reportV3.types';
import { calculateKPIScore, calculateWeightedScore, getScoreStatus } from './scoreCalculator';

// 축 이름 매핑
const AXIS_NAMES: Record<AxisKey, string> = {
  'GO': 'Go-to-Market',
  'EC': 'Economics',
  'PT': 'Product & Tech',
  'PF': 'Performance',
  'TO': 'Team & Org'
};

/**
 * 축별 상세 데이터 생성
 */
export function generateAxisDetailData(
  axis: AxisKey,
  processedData: ProcessedKPIData[],
  allAxisScores?: Record<AxisKey, number>
): AxisDetailData {
  // 해당 축의 KPI 필터링
  const axisKPIs = processedData.filter(data => data.kpi.axis === axis);

  // 축별 평균 점수 계산
  const averageScore = calculateAxisScore(axisKPIs);

  // 상태 결정
  const status = getScoreStatus(averageScore);

  // 트렌드 계산 (임시로 랜덤)
  const trend = getTrend(averageScore);
  const trendValue = trend === 'up' ? Math.random() * 10 + 5 :
                     trend === 'down' ? -(Math.random() * 10 + 5) : 0;

  // 백분위 계산 (임시로 점수 기반)
  const percentile = Math.min(95, Math.max(5, averageScore + (Math.random() * 20 - 10)));

  // KPI 상세 분석
  const kpiBreakdown = axisKPIs.map(data => ({
    kpiId: data.kpi.kpi_id,
    name: data.kpi.name,
    score: getKPIScore(data),
    status: getScoreStatus(getKPIScore(data)),
    weight: data.weight.emphasis,
    improvement: generateImprovement(data),
    benchmark: 70 + Math.random() * 20, // 임시 벤치마크
    gap: getKPIScore(data) - (70 + Math.random() * 20)
  }));

  // 인사이트 생성
  const insights = generateAxisInsights(axisKPIs, averageScore);

  // 추천사항 생성
  const recommendations = generateAxisRecommendations(axis, axisKPIs, averageScore);

  // 히스토리 데이터 (임시)
  const historicalData = generateHistoricalData(averageScore);

  return {
    axis,
    axisName: AXIS_NAMES[axis],
    summary: {
      totalKPIs: axisKPIs.length,
      completedKPIs: axisKPIs.length, // 현재는 모두 완료된 것만 처리
      averageScore,
      trend,
      trendValue,
      percentile,
      status
    },
    kpiBreakdown,
    insights,
    historicalData,
    recommendations
  };
}

/**
 * 축 점수 계산 (새로운 scoreCalculator 사용)
 */
function calculateAxisScore(axisKPIs: ProcessedKPIData[]): number {
  if (axisKPIs.length === 0) return 0;

  const scores = axisKPIs.map(data => ({
    score: getKPIScore(data),
    weight: data.weight.level
  }));

  return calculateWeightedScore(scores);
}

/**
 * KPI 점수 추출 (새로운 scoreCalculator 사용)
 */
function getKPIScore(data: ProcessedKPIData): number {
  // 벤치마크 정보가 있으면 사용
  const benchmark = data.benchmarkInfo?.average;

  // 정확한 점수 계산
  return calculateKPIScore(data.processedValue, data.kpi, benchmark);
}

// getScoreStatus는 이제 scoreCalculator에서 import해서 사용

/**
 * 트렌드 결정
 */
function getTrend(score: number): 'up' | 'down' | 'stable' {
  const random = Math.random();
  if (score >= 70) return random > 0.3 ? 'up' : 'stable';
  if (score <= 40) return random > 0.7 ? 'up' : 'down';
  return random > 0.6 ? 'up' : random > 0.3 ? 'stable' : 'down';
}

/**
 * 개선 방안 생성
 */
function generateImprovement(data: ProcessedKPIData): string {
  const score = getKPIScore(data);

  if (score >= 80) {
    return '현재 수준 유지 및 모니터링';
  } else if (score >= 60) {
    return '부분적 개선 필요';
  } else if (score >= 40) {
    return '중점 개선 영역으로 지정';
  } else {
    return '즉시 개선 조치 필요';
  }
}

/**
 * 축별 인사이트 생성
 */
function generateAxisInsights(
  axisKPIs: ProcessedKPIData[],
  averageScore: number
): {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  risks: string[];
} {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const risks: string[] = [];

  // 강점 분석
  const highPerformers = axisKPIs.filter(data => getKPIScore(data) >= 80);
  if (highPerformers.length > 0) {
    strengths.push(`${highPerformers.length}개 KPI에서 우수한 성과 달성`);
    if (highPerformers.some(data => data.weight.emphasis === 'critical')) {
      strengths.push('핵심 KPI에서 높은 성과 유지');
    }
  }

  // 약점 분석
  const lowPerformers = axisKPIs.filter(data => getKPIScore(data) < 50);
  if (lowPerformers.length > 0) {
    weaknesses.push(`${lowPerformers.length}개 KPI 개선 필요`);
    const criticalLow = lowPerformers.filter(data => data.weight.emphasis === 'critical');
    if (criticalLow.length > 0) {
      weaknesses.push(`핵심 KPI ${criticalLow.length}개 긴급 개선 필요`);
    }
  }

  // 기회 분석
  if (averageScore >= 60 && averageScore < 80) {
    opportunities.push('상위 레벨 도약 가능한 단계');
  }
  if (axisKPIs.some(data => data.weight.emphasis === 'normal' && getKPIScore(data) >= 70)) {
    opportunities.push('일반 KPI의 우수 성과를 핵심 영역으로 확대 가능');
  }

  // 리스크 분석
  if (averageScore < 50) {
    risks.push('전반적인 성과 부진으로 인한 경쟁력 약화');
  }
  const criticalRisks = axisKPIs.filter(
    data => data.weight.emphasis === 'critical' && getKPIScore(data) < 60
  );
  if (criticalRisks.length > 0) {
    risks.push(`핵심 KPI ${criticalRisks.length}개의 성과 미달`);
  }

  return { strengths, weaknesses, opportunities, risks };
}

/**
 * 축별 추천사항 생성
 */
function generateAxisRecommendations(
  axis: AxisKey,
  axisKPIs: ProcessedKPIData[],
  averageScore: number
): Array<{
  priority: 'high' | 'medium' | 'low';
  action: string;
  impact: string;
  timeframe: string;
}> {
  const recommendations = [];

  // 고우선순위 추천
  if (averageScore < 50) {
    recommendations.push({
      priority: 'high' as const,
      action: `${AXIS_NAMES[axis]} 영역 전면 개선 프로그램 시작`,
      impact: '전체 성과 20-30% 향상 예상',
      timeframe: '1-2개월'
    });
  }

  // 중우선순위 추천
  const midPerformers = axisKPIs.filter(
    data => getKPIScore(data) >= 50 && getKPIScore(data) < 70
  );
  if (midPerformers.length > 0) {
    recommendations.push({
      priority: 'medium' as const,
      action: `${midPerformers.length}개 중간 성과 KPI 개선`,
      impact: '축 평균 점수 10-15% 상승',
      timeframe: '2-3개월'
    });
  }

  // 저우선순위 추천
  if (averageScore >= 70) {
    recommendations.push({
      priority: 'low' as const,
      action: '현재 성과 유지 및 벤치마킹 자료 구축',
      impact: '업계 리더십 강화',
      timeframe: '지속적'
    });
  }

  return recommendations.slice(0, 3); // 최대 3개 추천
}

/**
 * 히스토리 데이터 생성 (임시)
 */
function generateHistoricalData(currentScore: number): Array<{
  date: string;
  score: number;
}> {
  const data = [];
  const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'];

  let score = currentScore - 15 - Math.random() * 10;

  months.forEach(month => {
    score += Math.random() * 8 - 2; // 약간의 변동
    data.push({
      date: month,
      score: Math.max(0, Math.min(100, score))
    });
  });

  // 마지막은 현재 점수로
  data.push({
    date: '2024-07',
    score: currentScore
  });

  return data;
}

/**
 * 모든 축의 요약 데이터 생성 (메인 테이블용)
 */
export function generateAllAxisSummary(
  processedData: ProcessedKPIData[]
): Array<{
  key: AxisKey;
  name: string;
  score: number;
  completedKPIs: number;
  totalKPIs: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  trend?: 'up' | 'down' | 'stable';
}> {
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

  return axes.map(axis => {
    const axisData = generateAxisDetailData(axis, processedData);

    return {
      key: axis,
      name: axisData.axisName,
      score: axisData.summary.averageScore,
      completedKPIs: axisData.summary.completedKPIs,
      totalKPIs: axisData.summary.totalKPIs,
      status: axisData.summary.status,
      trend: axisData.summary.trend
    };
  });
}