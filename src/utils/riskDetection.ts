/**
 * 위험 감지 시스템
 * KPI 진단 결과에서 위험 신호를 감지하고 알림
 */

import type { AxisKey } from '../types';

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'none';

export interface RiskAlert {
  id: string;
  level: RiskLevel;
  axis?: AxisKey;
  title: string;
  message: string;
  recommendation: string;
  priority: number; // 1-5, 1이 가장 높음
  metric?: {
    current: number;
    threshold: number;
    trend?: 'improving' | 'worsening' | 'stable';
  };
}

/**
 * 종합 위험 감지
 */
export const detectRisks = (
  axisScores: Record<AxisKey, number>,
  overallScore: number,
  previousScores?: Record<AxisKey, number>,
  monthlyTrend?: Array<{ score: number; change: number }>
): RiskAlert[] => {
  const risks: RiskAlert[] = [];

  // 1. 전체 점수 위험
  if (overallScore < 40) {
    risks.push({
      id: 'overall_critical',
      level: 'critical',
      title: '전체 점수 위험',
      message: `종합 점수가 ${Math.round(overallScore)}점으로 매우 낮습니다`,
      recommendation: '즉각적인 전면 개선 필요. 전문가 컨설팅 권장',
      priority: 1,
      metric: { current: overallScore, threshold: 40 }
    });
  } else if (overallScore < 50) {
    risks.push({
      id: 'overall_high',
      level: 'high',
      title: '전체 점수 경고',
      message: `종합 점수가 ${Math.round(overallScore)}점으로 낮은 수준입니다`,
      recommendation: '핵심 영역 집중 개선 필요',
      priority: 2,
      metric: { current: overallScore, threshold: 50 }
    });
  }

  // 2. 축별 점수 위험
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
  axes.forEach(axis => {
    const score = axisScores[axis];

    if (score < 30) {
      risks.push({
        id: `axis_critical_${axis}`,
        level: 'critical',
        axis,
        title: `${getAxisName(axis)} 심각`,
        message: `${getAxisName(axis)} 점수가 ${Math.round(score)}점으로 위험 수준`,
        recommendation: getAxisRecommendation(axis, 'critical'),
        priority: 1,
        metric: { current: score, threshold: 30 }
      });
    } else if (score < 45) {
      risks.push({
        id: `axis_high_${axis}`,
        level: 'high',
        axis,
        title: `${getAxisName(axis)} 경고`,
        message: `${getAxisName(axis)} 점수가 ${Math.round(score)}점으로 낮음`,
        recommendation: getAxisRecommendation(axis, 'high'),
        priority: 2,
        metric: { current: score, threshold: 45 }
      });
    }
  });

  // 3. 급격한 하락 감지
  if (previousScores) {
    axes.forEach(axis => {
      const current = axisScores[axis];
      const previous = previousScores[axis];
      const change = current - previous;

      if (change < -15) {
        risks.push({
          id: `decline_critical_${axis}`,
          level: 'critical',
          axis,
          title: `${getAxisName(axis)} 급락`,
          message: `${getAxisName(axis)}이(가) ${Math.abs(Math.round(change))}점 하락`,
          recommendation: '즉각적인 원인 분석 및 대응 필요',
          priority: 1,
          metric: {
            current,
            threshold: previous,
            trend: 'worsening'
          }
        });
      } else if (change < -8) {
        risks.push({
          id: `decline_high_${axis}`,
          level: 'high',
          axis,
          title: `${getAxisName(axis)} 하락`,
          message: `${getAxisName(axis)}이(가) ${Math.abs(Math.round(change))}점 감소`,
          recommendation: '하락 원인 파악 및 개선 계획 수립 필요',
          priority: 3,
          metric: {
            current,
            threshold: previous,
            trend: 'worsening'
          }
        });
      }
    });
  }

  // 4. 연속 하락 패턴 감지
  if (monthlyTrend && monthlyTrend.length >= 3) {
    const recentTrend = monthlyTrend.slice(-3);
    const consecutiveDeclines = recentTrend.filter(m => m.change < 0).length;

    if (consecutiveDeclines === 3) {
      risks.push({
        id: 'trend_decline',
        level: 'high',
        title: '지속적 하락 추세',
        message: '3개월 연속 점수 하락 중',
        recommendation: '전략 재검토 및 새로운 접근법 필요',
        priority: 2,
        metric: {
          current: recentTrend[recentTrend.length - 1].score,
          threshold: recentTrend[0].score,
          trend: 'worsening'
        }
      });
    }
  }

  // 5. 불균형 감지
  const scoreValues = axes.map(axis => axisScores[axis]);
  const maxScore = Math.max(...scoreValues);
  const minScore = Math.min(...scoreValues);
  const imbalance = maxScore - minScore;

  if (imbalance > 40) {
    risks.push({
      id: 'imbalance_high',
      level: 'medium',
      title: '심각한 불균형',
      message: `최고점(${Math.round(maxScore)})과 최저점(${Math.round(minScore)}) 차이가 ${Math.round(imbalance)}점`,
      recommendation: '취약 영역 집중 보완으로 균형 회복 필요',
      priority: 3,
      metric: {
        current: imbalance,
        threshold: 30
      }
    });
  }

  // 우선순위로 정렬
  return risks.sort((a, b) => a.priority - b.priority);
};

/**
 * 축 이름 반환
 */
const getAxisName = (axis: AxisKey): string => {
  const names: Record<AxisKey, string> = {
    GO: '성장/운영',
    EC: '경제성',
    PT: '제품/기술',
    PF: '검증',
    TO: '팀/조직'
  };
  return names[axis] || axis;
};

/**
 * 축별 추천 사항
 */
const getAxisRecommendation = (axis: AxisKey, level: 'critical' | 'high'): string => {
  const recommendations: Record<AxisKey, Record<'critical' | 'high', string>> = {
    GO: {
      critical: '성장 전략 전면 재검토. 고객 획득 채널 다변화 시급',
      high: '마케팅 효율 개선 및 고객 유지율 제고 필요'
    },
    EC: {
      critical: '수익 모델 재구축 필요. 비용 구조 즉각 개선',
      high: '단위 경제성 개선 및 현금흐름 관리 강화'
    },
    PT: {
      critical: '제품 경쟁력 강화 시급. 핵심 기능 재정의',
      high: '기술 부채 해결 및 제품 품질 개선 집중'
    },
    PF: {
      critical: 'PMF 재검증 필요. 고객 피드백 수집 강화',
      high: '시장 검증 지표 개선 및 레퍼런스 확보'
    },
    TO: {
      critical: '팀 역량 강화 시급. 핵심 인재 확보 우선',
      high: '조직 문화 개선 및 역할 명확화 필요'
    }
  };

  return recommendations[axis]?.[level] || '해당 영역 집중 개선 필요';
};

/**
 * 위험 수준 색상
 */
export const getRiskColor = (level: RiskLevel): string => {
  const colors: Record<RiskLevel, string> = {
    critical: '#dc2626', // red-600
    high: '#ea580c',     // orange-600
    medium: '#f59e0b',   // amber-500
    low: '#3b82f6',      // blue-500
    none: '#10b981'      // emerald-500
  };
  return colors[level];
};

/**
 * 위험 수준 아이콘 이름
 */
export const getRiskIcon = (level: RiskLevel): string => {
  const icons: Record<RiskLevel, string> = {
    critical: 'AlertTriangle',
    high: 'AlertCircle',
    medium: 'Info',
    low: 'HelpCircle',
    none: 'CheckCircle'
  };
  return icons[level];
};

/**
 * 가장 중요한 위험 추출
 */
export const getTopRisks = (risks: RiskAlert[], limit: number = 3): RiskAlert[] => {
  return risks.slice(0, limit);
};

/**
 * 위험 요약 메시지 생성
 */
export const getRiskSummary = (risks: RiskAlert[]): string => {
  const criticalCount = risks.filter(r => r.level === 'critical').length;
  const highCount = risks.filter(r => r.level === 'high').length;

  if (criticalCount > 0) {
    return `⚠️ ${criticalCount}개 심각 위험, ${highCount}개 경고 발견`;
  } else if (highCount > 0) {
    return `⚠️ ${highCount}개 주의 사항 발견`;
  } else if (risks.length > 0) {
    return `ℹ️ ${risks.length}개 개선 권고 사항`;
  }
  return '✅ 전반적으로 양호한 상태';
};