/**
 * 점수 분석 유틸리티
 * KPI별 기여도 계산 및 점수 구성 분석
 */

import type { AxisKey, KPIDefinition } from '../types';

export interface KPIContribution {
  kpiId: string;
  kpiName: string;
  question: string;
  score: number;
  contribution: number;  // 축 점수에 대한 기여도
  weight: number;       // 가중치
}

export interface AxisBreakdown {
  axis: AxisKey;
  totalScore: number;
  topContributors: KPIContribution[];
  bottomContributors: KPIContribution[];
  averageScore: number;
}

/**
 * 축별 KPI 기여도 분석
 * 어떤 KPI가 점수를 높이고 낮췄는지 분석
 */
export const analyzeAxisContributions = (
  axis: AxisKey,
  kpis: KPIDefinition[],
  responses: Record<string, any>
): AxisBreakdown => {
  const contributions: KPIContribution[] = [];
  let totalScore = 0;
  let totalWeight = 0;

  // 각 KPI의 점수와 기여도 계산
  kpis.forEach(kpi => {
    const kpiId = kpi.kpi_id || kpi.id;
    const response = responses[kpiId];

    if (response && response.raw !== undefined && response.raw !== '') {
      // KPI 점수 계산 (0-100 범위로 정규화)
      const kpiScore = calculateKPIScore(response, kpi);
      const weight = kpi.weight || 1;

      contributions.push({
        kpiId,
        kpiName: kpi.name || kpi.title || kpi.question.slice(0, 30),
        question: kpi.question,
        score: kpiScore,
        contribution: kpiScore * weight,
        weight
      });

      totalScore += kpiScore * weight;
      totalWeight += weight;
    }
  });

  // 평균 점수 계산
  const averageScore = totalWeight > 0 ? totalScore / totalWeight : 0;

  // 기여도 순으로 정렬
  const sortedContributions = [...contributions].sort((a, b) => b.score - a.score);

  return {
    axis,
    totalScore: averageScore,
    topContributors: sortedContributions.slice(0, 3),
    bottomContributors: sortedContributions.slice(-3).reverse(),
    averageScore
  };
};

/**
 * 개별 KPI 점수 계산
 * 응답 타입에 따라 적절한 점수 변환
 */
const calculateKPIScore = (response: any, kpi: KPIDefinition): number => {
  const value = response.raw;

  // NA나 invalid 응답은 0점
  if (response.status === 'na' || response.status === 'invalid') {
    return 0;
  }

  // 숫자형 응답
  if (!isNaN(value) && value !== '') {
    const numValue = parseFloat(value);

    // 백분율 타입 (0-100)
    if (kpi.unit === '%' || kpi.scale === 'percentage') {
      return Math.min(100, Math.max(0, numValue));
    }

    // 금액 타입 (목표 대비 비율)
    if (kpi.unit === '원' || kpi.unit === '만원' || kpi.scale === 'currency') {
      const target = kpi.target || 1000000000; // 10억 기본 목표
      return Math.min(100, (numValue / target) * 100);
    }

    // 개수/규모 타입
    if (kpi.scale === 'count' || kpi.unit === '명' || kpi.unit === '개') {
      const target = kpi.target || 100;
      return Math.min(100, (numValue / target) * 100);
    }

    // 기본: 0-100 범위로 가정
    return Math.min(100, Math.max(0, numValue));
  }

  // 텍스트형 응답 (있으면 50점, 없으면 0점)
  if (typeof value === 'string' && value.length > 0) {
    return 50;
  }

  // Yes/No 응답
  if (value === true || value === 'yes' || value === 'Yes') {
    return 100;
  }
  if (value === false || value === 'no' || value === 'No') {
    return 0;
  }

  return 0;
};

/**
 * 강점 분석
 * 높은 점수를 받은 이유 파악
 */
export const analyzeStrengthReasons = (
  axis: AxisKey,
  breakdown: AxisBreakdown
): string[] => {
  const reasons: string[] = [];

  if (breakdown.topContributors.length > 0) {
    // 90점 이상 우수 항목
    const excellent = breakdown.topContributors.filter(c => c.score >= 90);
    if (excellent.length > 0) {
      reasons.push(`${excellent.map(e => e.kpiName).join(', ')}에서 우수한 성과`);
    }

    // 80점 이상 양호 항목
    const good = breakdown.topContributors.filter(c => c.score >= 80 && c.score < 90);
    if (good.length > 0) {
      reasons.push(`${good.map(g => g.kpiName).join(', ')} 양호`);
    }
  }

  // 전체적으로 고른 점수
  const variance = calculateVariance(breakdown.topContributors.map(c => c.score));
  if (variance < 10) {
    reasons.push('전 영역 고른 성과');
  }

  return reasons.length > 0 ? reasons : ['전반적으로 양호한 수준'];
};

/**
 * 약점 분석
 * 낮은 점수를 받은 이유 파악
 */
export const analyzeWeaknessReasons = (
  axis: AxisKey,
  breakdown: AxisBreakdown
): string[] => {
  const reasons: string[] = [];

  if (breakdown.bottomContributors.length > 0) {
    // 40점 미만 심각 항목
    const critical = breakdown.bottomContributors.filter(c => c.score < 40);
    if (critical.length > 0) {
      reasons.push(`${critical.map(c => c.kpiName).join(', ')} 개선 시급`);
    }

    // 60점 미만 부족 항목
    const weak = breakdown.bottomContributors.filter(c => c.score >= 40 && c.score < 60);
    if (weak.length > 0) {
      reasons.push(`${weak.map(w => w.kpiName).join(', ')} 보완 필요`);
    }
  }

  return reasons.length > 0 ? reasons : ['일부 영역 개선 필요'];
};

/**
 * 개선 효과 예측
 * 특정 KPI 개선 시 예상 점수 상승
 */
export const predictImprovementImpact = (
  currentBreakdown: AxisBreakdown,
  targetImprovement: number = 20
): number => {
  // 가장 낮은 점수 3개를 targetImprovement만큼 개선
  const improved = currentBreakdown.bottomContributors.map(c => ({
    ...c,
    score: Math.min(100, c.score + targetImprovement)
  }));

  // 새로운 평균 계산
  const allContributions = [
    ...currentBreakdown.topContributors,
    ...improved
  ];

  const totalScore = allContributions.reduce((sum, c) => sum + c.score * c.weight, 0);
  const totalWeight = allContributions.reduce((sum, c) => sum + c.weight, 0);

  const newAverage = totalWeight > 0 ? totalScore / totalWeight : 0;

  return newAverage - currentBreakdown.totalScore;
};

/**
 * 분산 계산 (점수의 일관성 측정)
 */
const calculateVariance = (scores: number[]): number => {
  if (scores.length === 0) return 0;

  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const squaredDiffs = scores.map(s => Math.pow(s - mean, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / scores.length;

  return Math.sqrt(variance);
};

/**
 * 축별 상위 기여 KPI 추출
 */
export const getTopContributingKPIs = (
  axis: AxisKey,
  kpis: KPIDefinition[],
  responses: Record<string, any>,
  limit: number = 3
): KPIContribution[] => {
  const breakdown = analyzeAxisContributions(axis, kpis, responses);
  return breakdown.topContributors.slice(0, limit);
};

/**
 * 축별 하위 기여 KPI 추출
 */
export const getBottomContributingKPIs = (
  axis: AxisKey,
  kpis: KPIDefinition[],
  responses: Record<string, any>,
  limit: number = 3
): KPIContribution[] => {
  const breakdown = analyzeAxisContributions(axis, kpis, responses);
  return breakdown.bottomContributors.slice(0, limit);
};