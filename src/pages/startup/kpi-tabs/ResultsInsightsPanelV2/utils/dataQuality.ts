/**
 * Data Quality Assessment System
 * 데이터 품질 평가 및 신뢰도 계산 시스템
 */

import type { AxisKey } from '../types';

// 데이터 품질 메트릭
interface DataQualityMetrics {
  completeness: {
    score: number;
    details: {
      totalFields: number;
      filledFields: number;
      missingCritical: string[];
    };
  };
  consistency: {
    score: number;
    details: {
      conflicts: number;
      inconsistencies: string[];
    };
  };
  accuracy: {
    score: number;
    details: {
      validated: number;
      questionable: number;
      outliers: string[];
    };
  };
  freshness: {
    score: number;
    details: {
      lastUpdate: Date;
      staleFields: string[];
      avgAge: number; // days
    };
  };
  reliability: {
    score: number;
    details: {
      confidence: Record<AxisKey, number>;
      sourceTrust: number;
      methodConsistency: number;
    };
  };
}

// 임계값 설정
const QUALITY_THRESHOLDS = {
  completeness: {
    excellent: 90,
    good: 75,
    fair: 50,
    poor: 25
  },
  freshness: {
    excellent: 1,   // 1일 이내
    good: 7,        // 1주 이내
    fair: 30,       // 1개월 이내
    poor: 90        // 3개월 이내
  },
  accuracy: {
    outlierThreshold: 2.5, // 표준편차 배수
    validationThreshold: 0.8 // 80% 이상 검증 필요
  }
};

// 데이터 품질 종합 평가
export const assessDataQuality = (
  responses: Record<string, any>,
  axisScores: Record<AxisKey, number>,
  metadata?: {
    lastSaved?: Date;
    kpiDefinitions?: any[];
    previousScores?: Record<AxisKey, number>;
  }
): DataQualityMetrics => {

  return {
    completeness: assessCompleteness(responses, metadata?.kpiDefinitions),
    consistency: assessConsistency(responses, axisScores),
    accuracy: assessAccuracy(responses, axisScores, metadata?.previousScores),
    freshness: assessFreshness(responses, metadata?.lastSaved),
    reliability: assessReliability(responses, axisScores)
  };
};

// 완성도 평가
const assessCompleteness = (
  responses: Record<string, any>,
  kpiDefinitions?: any[]
): DataQualityMetrics['completeness'] => {
  const totalFields = kpiDefinitions?.length || 25; // 기본 KPI 수
  const filledFields = Object.keys(responses).filter(key =>
    responses[key] !== null &&
    responses[key] !== undefined &&
    responses[key] !== ''
  ).length;

  const completionRate = (filledFields / totalFields) * 100;

  // 중요 필드 누락 체크
  const criticalFields = ['revenue', 'growth', 'userCount', 'burnRate', 'teamSize'];
  const missingCritical = criticalFields.filter(field => !responses[field]);

  // 완성도 점수 계산 (중요 필드 누락 시 페널티)
  const penaltyForCritical = missingCritical.length * 10;
  const adjustedScore = Math.max(0, completionRate - penaltyForCritical);

  return {
    score: Math.round(adjustedScore),
    details: {
      totalFields,
      filledFields,
      missingCritical
    }
  };
};

// 일관성 평가
const assessConsistency = (
  responses: Record<string, any>,
  axisScores: Record<AxisKey, number>
): DataQualityMetrics['consistency'] => {
  const conflicts: number[] = [];
  const inconsistencies: string[] = [];

  // 축간 일관성 체크
  const axes = Object.keys(axisScores) as AxisKey[];
  axes.forEach(axis => {
    const relatedResponses = getRelatedResponses(responses, axis);

    // 같은 축 내 응답들의 분산 체크
    if (relatedResponses.length > 1) {
      const values = relatedResponses.map(r => Number(r.value) || 0);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev > 25) { // 표준편차가 25 이상이면 불일치
        conflicts.push(stdDev);
        inconsistencies.push(`${axis} 축 내부 응답 불일치 (편차: ${Math.round(stdDev)})`);
      }
    }
  });

  // 논리적 모순 체크
  const logicalChecks = performLogicalConsistencyChecks(responses);
  inconsistencies.push(...logicalChecks);

  const consistencyScore = Math.max(0, 100 - (conflicts.length * 15) - (logicalChecks.length * 10));

  return {
    score: Math.round(consistencyScore),
    details: {
      conflicts: conflicts.length,
      inconsistencies
    }
  };
};

// 정확성 평가
const assessAccuracy = (
  responses: Record<string, any>,
  axisScores: Record<AxisKey, number>,
  previousScores?: Record<AxisKey, number>
): DataQualityMetrics['accuracy'] => {
  let validated = 0;
  let questionable = 0;
  const outliers: string[] = [];

  const responseValues = Object.values(responses).map(r => Number(r.value) || 0);

  if (responseValues.length > 0) {
    const mean = responseValues.reduce((a, b) => a + b, 0) / responseValues.length;
    const stdDev = Math.sqrt(
      responseValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / responseValues.length
    );

    // 아웃라이어 탐지
    Object.entries(responses).forEach(([key, response]) => {
      const value = Number(response.value) || 0;
      const zScore = stdDev > 0 ? Math.abs(value - mean) / stdDev : 0;

      if (zScore > QUALITY_THRESHOLDS.accuracy.outlierThreshold) {
        outliers.push(`${key}: ${value} (Z-score: ${zScore.toFixed(2)})`);
        questionable++;
      } else {
        validated++;
      }
    });

    // 이전 점수와 비교하여 급격한 변화 체크
    if (previousScores) {
      Object.entries(axisScores).forEach(([axis, currentScore]) => {
        const previousScore = previousScores[axis as AxisKey] || 0;
        const change = Math.abs(currentScore - previousScore);

        if (change > 30) { // 30점 이상 급격한 변화
          outliers.push(`${axis} 축 급격한 변화: ${previousScore} → ${currentScore}`);
          questionable++;
        }
      });
    }
  }

  const validationRate = validated / Math.max(validated + questionable, 1);
  const accuracyScore = Math.round(validationRate * 100);

  return {
    score: accuracyScore,
    details: {
      validated,
      questionable,
      outliers
    }
  };
};

// 신선도 평가
const assessFreshness = (
  responses: Record<string, any>,
  lastSaved?: Date
): DataQualityMetrics['freshness'] => {
  const now = new Date();
  const staleFields: string[] = [];
  let totalAge = 0;
  let countWithTimestamp = 0;

  // 응답별 신선도 체크
  Object.entries(responses).forEach(([key, response]) => {
    if (response.timestamp) {
      const responseDate = new Date(response.timestamp);
      const ageInDays = (now.getTime() - responseDate.getTime()) / (1000 * 60 * 60 * 24);

      totalAge += ageInDays;
      countWithTimestamp++;

      if (ageInDays > QUALITY_THRESHOLDS.freshness.fair) {
        staleFields.push(`${key} (${Math.round(ageInDays)}일 전)`);
      }
    }
  });

  // 전체 데이터 신선도 (마지막 저장 시간 기준)
  let overallAge = 0;
  if (lastSaved) {
    overallAge = (now.getTime() - lastSaved.getTime()) / (1000 * 60 * 60 * 24);
  } else if (countWithTimestamp > 0) {
    overallAge = totalAge / countWithTimestamp;
  }

  // 신선도 점수 계산
  let freshnessScore = 100;
  if (overallAge > QUALITY_THRESHOLDS.freshness.excellent) {
    if (overallAge <= QUALITY_THRESHOLDS.freshness.good) {
      freshnessScore = 85;
    } else if (overallAge <= QUALITY_THRESHOLDS.freshness.fair) {
      freshnessScore = 65;
    } else if (overallAge <= QUALITY_THRESHOLDS.freshness.poor) {
      freshnessScore = 40;
    } else {
      freshnessScore = 20;
    }
  }

  return {
    score: Math.round(freshnessScore),
    details: {
      lastUpdate: lastSaved || new Date(now.getTime() - overallAge * 24 * 60 * 60 * 1000),
      staleFields,
      avgAge: Math.round(countWithTimestamp > 0 ? totalAge / countWithTimestamp : overallAge)
    }
  };
};

// 신뢰도 평가
const assessReliability = (
  responses: Record<string, any>,
  axisScores: Record<AxisKey, number>
): DataQualityMetrics['reliability'] => {
  const confidence = {} as Record<AxisKey, number>;

  // 축별 신뢰도 계산
  Object.entries(axisScores).forEach(([axis, score]) => {
    const axisKey = axis as AxisKey;
    const relatedResponses = getRelatedResponses(responses, axisKey);

    // 응답 수가 많을수록, 분산이 작을수록 신뢰도 높음
    const responseCount = relatedResponses.length;
    const expectedCount = 5; // 축당 기대 응답 수
    const countScore = Math.min(100, (responseCount / expectedCount) * 100);

    // 응답 일관성
    let consistencyScore = 100;
    if (relatedResponses.length > 1) {
      const values = relatedResponses.map(r => Number(r.value) || 0);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
      const cv = mean > 0 ? Math.sqrt(variance) / mean : 0; // 변동계수
      consistencyScore = Math.max(0, 100 - (cv * 100));
    }

    confidence[axisKey] = Math.round((countScore + consistencyScore) / 2);
  });

  // 전체 신뢰도
  const avgConfidence = Object.values(confidence).reduce((a, b) => a + b, 0) / 5;

  // 데이터 출처 신뢰도 (응답에 출처 정보가 있는지)
  const sourcedResponses = Object.values(responses).filter(r => r.source).length;
  const sourceTrust = (sourcedResponses / Object.keys(responses).length) * 100;

  // 방법론 일관성 (동일한 방식으로 측정되었는지)
  const methodConsistency = 85; // 기본값 (실제로는 메타데이터에서 계산)

  return {
    score: Math.round((avgConfidence + sourceTrust + methodConsistency) / 3),
    details: {
      confidence,
      sourceTrust: Math.round(sourceTrust),
      methodConsistency
    }
  };
};

// 축 관련 응답 추출
const getRelatedResponses = (responses: Record<string, any>, axis: AxisKey): any[] => {
  // 실제로는 KPI 정의에서 축 매핑 정보를 사용해야 함
  const axisKeywords = {
    GO: ['growth', 'revenue', 'customer', 'sales', 'market'],
    EC: ['funding', 'burn', 'cash', 'investment', 'cost'],
    PT: ['product', 'tech', 'development', 'feature', 'user'],
    PF: ['proof', 'metric', 'kpi', 'evidence', 'track'],
    TO: ['team', 'hire', 'culture', 'skill', 'organization']
  };

  const keywords = axisKeywords[axis] || [];

  return Object.entries(responses)
    .filter(([key, _]) =>
      keywords.some(keyword => key.toLowerCase().includes(keyword.toLowerCase()))
    )
    .map(([_, response]) => response);
};

// 논리적 일관성 검사
const performLogicalConsistencyChecks = (responses: Record<string, any>): string[] => {
  const issues: string[] = [];

  // 수익 vs 성장률 검사
  const revenue = Number(responses.monthlyRevenue?.value) || 0;
  const growth = Number(responses.growthRate?.value) || 0;

  if (revenue === 0 && growth > 50) {
    issues.push('매출이 0인데 성장률이 높게 설정됨');
  }

  // 팀 크기 vs 번레이트 검사
  const teamSize = Number(responses.teamSize?.value) || 0;
  const burnRate = Number(responses.burnRate?.value) || 0;

  if (teamSize > 0 && burnRate > 0) {
    const costPerEmployee = burnRate / teamSize;
    if (costPerEmployee > 15000) { // 월 1,500만원/인 초과
      issues.push('인당 비용이 비정상적으로 높음');
    }
    if (costPerEmployee < 300) { // 월 30만원/인 미만
      issues.push('인당 비용이 비정상적으로 낮음');
    }
  }

  // 사용자 수 vs 매출 검사
  const userCount = Number(responses.userCount?.value) || 0;
  if (userCount > 1000 && revenue === 0) {
    issues.push('사용자가 많은데 매출이 없음');
  }

  return issues;
};

// 데이터 품질 레벨 계산
export const calculateDataQualityLevel = (metrics: DataQualityMetrics): {
  overall: number;
  level: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
} => {
  // 가중 평균 계산
  const weights = {
    completeness: 0.25,
    consistency: 0.20,
    accuracy: 0.25,
    freshness: 0.15,
    reliability: 0.15
  };

  const overallScore =
    metrics.completeness.score * weights.completeness +
    metrics.consistency.score * weights.consistency +
    metrics.accuracy.score * weights.accuracy +
    metrics.freshness.score * weights.freshness +
    metrics.reliability.score * weights.reliability;

  // 레벨 결정
  let level: 'excellent' | 'good' | 'fair' | 'poor';
  if (overallScore >= 85) level = 'excellent';
  else if (overallScore >= 70) level = 'good';
  else if (overallScore >= 50) level = 'fair';
  else level = 'poor';

  // 개선 권장사항 생성
  const recommendations: string[] = [];

  if (metrics.completeness.score < 70) {
    recommendations.push(`필수 정보 ${metrics.completeness.details.missingCritical.length}개 항목 입력 필요`);
  }

  if (metrics.freshness.score < 60) {
    recommendations.push('데이터 업데이트 주기 단축 권장');
  }

  if (metrics.accuracy.score < 70) {
    recommendations.push('이상값 및 불일치 항목 재검토 필요');
  }

  if (metrics.consistency.score < 70) {
    recommendations.push('일관성 있는 데이터 입력 방식 정립 필요');
  }

  return {
    overall: Math.round(overallScore),
    level,
    recommendations: recommendations.slice(0, 3) // 최대 3개
  };
};

// 데이터 품질 트렌드 분석
export const analyzeQualityTrend = (
  currentMetrics: DataQualityMetrics,
  previousMetrics?: DataQualityMetrics
): {
  trend: 'improving' | 'declining' | 'stable';
  changes: Record<keyof DataQualityMetrics, number>;
  insights: string[];
} => {
  if (!previousMetrics) {
    return {
      trend: 'stable',
      changes: {
        completeness: 0,
        consistency: 0,
        accuracy: 0,
        freshness: 0,
        reliability: 0
      },
      insights: ['첫 번째 품질 평가 - 기준점 설정됨']
    };
  }

  const changes = {
    completeness: currentMetrics.completeness.score - previousMetrics.completeness.score,
    consistency: currentMetrics.consistency.score - previousMetrics.consistency.score,
    accuracy: currentMetrics.accuracy.score - previousMetrics.accuracy.score,
    freshness: currentMetrics.freshness.score - previousMetrics.freshness.score,
    reliability: currentMetrics.reliability.score - previousMetrics.reliability.score
  };

  const totalChange = Object.values(changes).reduce((sum, change) => sum + change, 0) / 5;

  const trend = totalChange > 2 ? 'improving' :
                totalChange < -2 ? 'declining' : 'stable';

  const insights: string[] = [];

  // 가장 큰 변화 항목 식별
  const biggestImprovement = Object.entries(changes)
    .sort((a, b) => b[1] - a[1])[0];

  const biggestDecline = Object.entries(changes)
    .sort((a, b) => a[1] - b[1])[0];

  if (biggestImprovement[1] > 5) {
    insights.push(`${biggestImprovement[0]} 품질이 ${biggestImprovement[1].toFixed(1)}점 개선됨`);
  }

  if (biggestDecline[1] < -5) {
    insights.push(`${biggestDecline[0]} 품질이 ${Math.abs(biggestDecline[1]).toFixed(1)}점 하락함`);
  }

  if (Math.abs(totalChange) < 1) {
    insights.push('전반적인 데이터 품질이 안정적으로 유지됨');
  }

  return { trend, changes, insights };
};