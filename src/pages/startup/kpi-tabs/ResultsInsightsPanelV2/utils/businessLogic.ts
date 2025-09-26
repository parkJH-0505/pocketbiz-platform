/**
 * Business Logic Calculator
 * 스타트업 특화 KPI 계산 및 비즈니스 로직 구현
 */

import type { AxisKey } from '../types';

// 비즈니스 메트릭 타입
interface BusinessMetrics {
  revenue: {
    monthly: number;
    growth: number; // MoM Growth %
    churn: number; // Customer Churn Rate %
  };
  operations: {
    burnRate: number; // Monthly Burn Rate
    runway: number; // Months of runway
    efficiency: number; // Operational Efficiency Score
  };
  product: {
    userCount: number;
    retention: number; // User Retention %
    satisfaction: number; // CSAT Score
  };
  funding: {
    totalRaised: number;
    valuation: number;
    readinessScore: number; // Investment Readiness Score
  };
  team: {
    size: number;
    productivity: number; // Team Productivity Score
    satisfaction: number; // Employee Satisfaction Score
  };
}

// 클러스터별 가중치
const CLUSTER_WEIGHTS: Record<string, Record<AxisKey, number>> = {
  'pre-seed': {
    GO: 0.15, // Growth & Operations
    EC: 0.30, // Economics & Capital
    PT: 0.25, // Product & Technology
    PF: 0.15, // Proof & Due Diligence
    TO: 0.15  // Team & Organization
  },
  'seed': {
    GO: 0.25,
    EC: 0.25,
    PT: 0.20,
    PF: 0.15,
    TO: 0.15
  },
  'series-a': {
    GO: 0.30,
    EC: 0.20,
    PT: 0.20,
    PF: 0.15,
    TO: 0.15
  },
  'series-b': {
    GO: 0.35,
    EC: 0.20,
    PT: 0.15,
    PF: 0.15,
    TO: 0.15
  },
  'default': {
    GO: 0.20,
    EC: 0.20,
    PT: 0.20,
    PF: 0.20,
    TO: 0.20
  }
};

// 산업별 벤치마크 점수
const INDUSTRY_BENCHMARKS: Record<string, Record<AxisKey, number>> = {
  'tech': {
    GO: 72,
    EC: 68,
    PT: 85,
    PF: 70,
    TO: 75
  },
  'fintech': {
    GO: 70,
    EC: 80,
    PT: 88,
    PF: 85,
    TO: 72
  },
  'ecommerce': {
    GO: 78,
    EC: 75,
    PT: 70,
    PF: 68,
    TO: 70
  },
  'healthcare': {
    GO: 65,
    EC: 70,
    PT: 80,
    PF: 90,
    TO: 75
  },
  'saas': {
    GO: 75,
    EC: 72,
    PT: 82,
    PF: 75,
    TO: 78
  },
  'default': {
    GO: 70,
    EC: 70,
    PT: 75,
    PF: 70,
    TO: 72
  }
};

// 비즈니스 메트릭 기반 점수 계산
export const calculateScoreFromMetrics = (
  metrics: Partial<BusinessMetrics>,
  axis: AxisKey
): number => {
  switch (axis) {
    case 'GO': // Growth & Operations
      return calculateGrowthOperationsScore(metrics);

    case 'EC': // Economics & Capital
      return calculateEconomicsCapitalScore(metrics);

    case 'PT': // Product & Technology
      return calculateProductTechScore(metrics);

    case 'PF': // Proof & Due Diligence
      return calculateProofDiligenceScore(metrics);

    case 'TO': // Team & Organization
      return calculateTeamOrganizationScore(metrics);

    default:
      return 0;
  }
};

// 성장·운영 점수 계산
const calculateGrowthOperationsScore = (metrics: Partial<BusinessMetrics>): number => {
  let score = 0;
  let factors = 0;

  // 매출 성장률 (40% 가중치)
  if (metrics.revenue?.growth !== undefined) {
    const growthScore = Math.min(100, Math.max(0, (metrics.revenue.growth + 20) * 2.5));
    score += growthScore * 0.4;
    factors += 0.4;
  }

  // 고객 이탈률 (30% 가중치) - 낮을수록 좋음
  if (metrics.revenue?.churn !== undefined) {
    const churnScore = Math.max(0, 100 - (metrics.revenue.churn * 10));
    score += churnScore * 0.3;
    factors += 0.3;
  }

  // 운영 효율성 (30% 가중치)
  if (metrics.operations?.efficiency !== undefined) {
    score += metrics.operations.efficiency * 0.3;
    factors += 0.3;
  }

  return factors > 0 ? Math.round(score / factors) : 60; // 기본값
};

// 경제성·자본 점수 계산
const calculateEconomicsCapitalScore = (metrics: Partial<BusinessMetrics>): number => {
  let score = 0;
  let factors = 0;

  // 런웨이 (40% 가중치)
  if (metrics.operations?.runway !== undefined) {
    const runwayScore = Math.min(100, (metrics.operations.runway / 24) * 100);
    score += runwayScore * 0.4;
    factors += 0.4;
  }

  // 번레이트 효율성 (30% 가중치)
  if (metrics.operations?.burnRate !== undefined && metrics.revenue?.monthly !== undefined) {
    const burnMultiple = metrics.operations.burnRate / Math.max(metrics.revenue.monthly, 1);
    const efficiencyScore = Math.max(0, 100 - (burnMultiple * 20));
    score += efficiencyScore * 0.3;
    factors += 0.3;
  }

  // 펀딩 준비도 (30% 가중치)
  if (metrics.funding?.readinessScore !== undefined) {
    score += metrics.funding.readinessScore * 0.3;
    factors += 0.3;
  }

  return factors > 0 ? Math.round(score / factors) : 50; // 기본값
};

// 제품·기술력 점수 계산
const calculateProductTechScore = (metrics: Partial<BusinessMetrics>): number => {
  let score = 0;
  let factors = 0;

  // 사용자 만족도 (40% 가중치)
  if (metrics.product?.satisfaction !== undefined) {
    score += metrics.product.satisfaction * 0.4;
    factors += 0.4;
  }

  // 사용자 유지율 (35% 가중치)
  if (metrics.product?.retention !== undefined) {
    score += metrics.product.retention * 0.35;
    factors += 0.35;
  }

  // 사용자 수 성장 (25% 가중치)
  if (metrics.product?.userCount !== undefined) {
    // 로그 스케일로 점수화 (1K users = 60점, 10K = 80점, 100K = 100점)
    const userScore = Math.min(100, 40 + Math.log10(Math.max(metrics.product.userCount, 1)) * 20);
    score += userScore * 0.25;
    factors += 0.25;
  }

  return factors > 0 ? Math.round(score / factors) : 70; // 기본값
};

// 증빙·딜레디 점수 계산
const calculateProofDiligenceScore = (metrics: Partial<BusinessMetrics>): number => {
  let score = 60; // 기본값

  // 매출 실적 (50% 가중치)
  if (metrics.revenue?.monthly !== undefined) {
    const revenueScore = Math.min(100, 20 + Math.log10(Math.max(metrics.revenue.monthly, 1)) * 15);
    score = score * 0.5 + revenueScore * 0.5;
  }

  // 기업가치 (30% 가중치)
  if (metrics.funding?.valuation !== undefined) {
    const valuationScore = Math.min(100, 30 + Math.log10(Math.max(metrics.funding.valuation, 1)) * 10);
    score = score * 0.7 + valuationScore * 0.3;
  }

  // 총 투자유치 실적 (20% 가중치)
  if (metrics.funding?.totalRaised !== undefined) {
    const fundingScore = Math.min(100, 40 + Math.log10(Math.max(metrics.funding.totalRaised, 1)) * 12);
    score = score * 0.8 + fundingScore * 0.2;
  }

  return Math.round(score);
};

// 팀·조직 점수 계산
const calculateTeamOrganizationScore = (metrics: Partial<BusinessMetrics>): number => {
  let score = 0;
  let factors = 0;

  // 팀 생산성 (50% 가중치)
  if (metrics.team?.productivity !== undefined) {
    score += metrics.team.productivity * 0.5;
    factors += 0.5;
  }

  // 직원 만족도 (35% 가중치)
  if (metrics.team?.satisfaction !== undefined) {
    score += metrics.team.satisfaction * 0.35;
    factors += 0.35;
  }

  // 팀 크기 적정성 (15% 가중치)
  if (metrics.team?.size !== undefined) {
    // 5-20명이 최적 범위
    const sizeScore = metrics.team.size >= 5 && metrics.team.size <= 20 ? 100 :
                     metrics.team.size < 5 ? (metrics.team.size / 5) * 80 :
                     Math.max(50, 100 - ((metrics.team.size - 20) * 2));
    score += sizeScore * 0.15;
    factors += 0.15;
  }

  return factors > 0 ? Math.round(score / factors) : 65; // 기본값
};

// 클러스터 및 산업별 가중 점수 계산
export const calculateWeightedOverallScore = (
  scores: Record<AxisKey, number>,
  clusterStage: string = 'default',
  industry: string = 'default'
): number => {
  const weights = CLUSTER_WEIGHTS[clusterStage] || CLUSTER_WEIGHTS['default'];

  let weightedSum = 0;
  let totalWeight = 0;

  Object.entries(weights).forEach(([axis, weight]) => {
    const axisKey = axis as AxisKey;
    if (scores[axisKey] !== undefined) {
      weightedSum += scores[axisKey] * weight;
      totalWeight += weight;
    }
  });

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
};

// 벤치마크 대비 성과 분석
export const analyzeBenchmarkPerformance = (
  scores: Record<AxisKey, number>,
  industry: string = 'default'
): {
  overallComparison: number;
  axisBenchmarks: Record<AxisKey, {
    score: number;
    benchmark: number;
    performance: 'above' | 'at' | 'below';
    gap: number;
  }>;
} => {
  const benchmarks = INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS['default'];

  const axisBenchmarks = {} as any;
  let totalGap = 0;

  Object.entries(benchmarks).forEach(([axis, benchmark]) => {
    const axisKey = axis as AxisKey;
    const score = scores[axisKey] || 0;
    const gap = score - benchmark;

    axisBenchmarks[axisKey] = {
      score,
      benchmark,
      performance: gap > 2 ? 'above' : gap < -2 ? 'below' : 'at',
      gap: Math.round(gap)
    };

    totalGap += gap;
  });

  return {
    overallComparison: Math.round(totalGap / Object.keys(benchmarks).length),
    axisBenchmarks
  };
};

// 개선 권장 사항 생성
export const generateImprovementRecommendations = (
  scores: Record<AxisKey, number>,
  metrics: Partial<BusinessMetrics>,
  clusterStage: string,
  industry: string
): {
  priority: 'high' | 'medium' | 'low';
  axis: AxisKey;
  recommendation: string;
  expectedImpact: string;
  timeframe: string;
}[] => {
  const recommendations = [];
  const benchmarkAnalysis = analyzeBenchmarkPerformance(scores, industry);

  // 벤치마크 대비 낮은 항목 우선 처리
  Object.entries(benchmarkAnalysis.axisBenchmarks)
    .filter(([_, data]) => data.performance === 'below' && data.gap < -10)
    .sort((a, b) => a[1].gap - b[1].gap)
    .slice(0, 3)
    .forEach(([axis, data]) => {
      const axisKey = axis as AxisKey;
      recommendations.push({
        priority: data.gap < -20 ? 'high' : 'medium' as const,
        axis: axisKey,
        recommendation: getAxisSpecificRecommendation(axisKey, metrics),
        expectedImpact: `+${Math.abs(data.gap)}점 개선 가능`,
        timeframe: data.gap < -20 ? '2-4주' : '4-8주'
      });
    });

  return recommendations.slice(0, 5); // 상위 5개 권장사항
};

// 축별 구체적 권장사항
const getAxisSpecificRecommendation = (axis: AxisKey, metrics: Partial<BusinessMetrics>): string => {
  switch (axis) {
    case 'GO':
      return metrics.revenue?.growth && metrics.revenue.growth < 10
        ? '고객 획득 채널 다각화 및 리텐션 전략 강화'
        : '운영 프로세스 자동화 및 효율성 개선';

    case 'EC':
      return metrics.operations?.runway && metrics.operations.runway < 12
        ? '번레이트 최적화 및 수익성 개선 방안 수립'
        : '투자 유치 준비 및 재무 구조 개선';

    case 'PT':
      return '제품 사용성 개선 및 기술 경쟁력 강화';

    case 'PF':
      return '재무 투명성 제고 및 실적 지표 체계화';

    case 'TO':
      return '팀 역량 개발 및 조직 문화 개선';

    default:
      return '해당 영역 역량 강화 필요';
  }
};

// 성장 예측 모델
export const predictGrowthTrajectory = (
  currentScores: Record<AxisKey, number>,
  metrics: Partial<BusinessMetrics>,
  timeHorizon: number = 6 // months
): {
  projected: Record<AxisKey, number>;
  confidence: number;
  keyDrivers: string[];
} => {
  const projected = {} as Record<AxisKey, number>;
  const keyDrivers = [];

  // 현재 성장률 기반 예측
  const growthRate = metrics.revenue?.growth || 0;
  const baseGrowthFactor = Math.max(0.95, Math.min(1.15, 1 + (growthRate / 100) * 0.1));

  Object.entries(currentScores).forEach(([axis, score]) => {
    const axisKey = axis as AxisKey;

    // 축별 성장 특성 반영
    let axisFactor = baseGrowthFactor;

    switch (axisKey) {
      case 'GO':
        axisFactor *= 1.1; // 성장이 가장 빠르게 개선되는 영역
        if (growthRate > 20) keyDrivers.push('높은 매출 성장률');
        break;
      case 'PT':
        axisFactor *= 1.05; // 제품 개선은 지속적
        break;
      case 'EC':
        axisFactor *= 0.98; // 자본 효율성은 상대적으로 느린 개선
        break;
      default:
        axisFactor *= 1.02;
    }

    projected[axisKey] = Math.min(100, Math.round(score * Math.pow(axisFactor, timeHorizon / 6)));
  });

  // 신뢰도 계산 (데이터 완성도 기반)
  const completenessScore = Object.keys(metrics).length / 5; // 5개 영역 중 몇 개 데이터가 있는지
  const confidence = Math.round(60 + (completenessScore * 30)); // 60-90% 범위

  return {
    projected,
    confidence,
    keyDrivers: keyDrivers.length > 0 ? keyDrivers : ['기본 성장 모델 적용']
  };
};