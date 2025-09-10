import type { AxisKey, KPIResponse } from '../types';
import { mockKPIs } from '../data/mockKPIs';
import { calculateAxisScore, getTopContributors } from './scoring';

export interface Insight {
  type: 'strength' | 'weakness' | 'opportunity' | 'risk';
  title: string;
  description: string;
  axis?: AxisKey;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
}

export interface AxisAnalysis {
  axis: AxisKey;
  score: number;
  trend: 'improving' | 'stable' | 'declining';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

// 축별 분석 생성
export function analyzeAxis(
  axis: AxisKey,
  responses: Record<string, KPIResponse>,
  peerAvg?: number
): AxisAnalysis {
  const score = calculateAxisScore(responses, axis);
  const topContributors = getTopContributors(responses, axis, 3);
  const axisKPIs = mockKPIs.filter(kpi => kpi.axis === axis);
  
  // 강점 분석
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  topContributors.forEach(contrib => {
    if (contrib && contrib.score >= 80) {
      const kpi = mockKPIs.find(k => k.kpi_id === contrib.kpi_id);
      if (kpi) {
        strengths.push(`${kpi.title}에서 우수한 성과 (${contrib.score}점)`);
      }
    }
  });
  
  // 약점 분석
  axisKPIs.forEach(kpi => {
    const response = responses[kpi.kpi_id];
    if (response && response.normalized_score && response.normalized_score < 60) {
      weaknesses.push(`${kpi.title} 개선 필요 (${response.normalized_score}점)`);
    }
  });
  
  // 추천사항 생성
  const recommendations = generateAxisRecommendations(axis, score, strengths, weaknesses);
  
  return {
    axis,
    score,
    trend: score > 70 ? 'improving' : score > 50 ? 'stable' : 'declining',
    strengths,
    weaknesses,
    recommendations
  };
}

// 종합 인사이트 생성
export function generateInsights(
  responses: Record<string, KPIResponse>,
  axisScores: Record<AxisKey, number>,
  benchmarks?: { peer_avg?: Record<AxisKey, number> }
): Insight[] {
  const insights: Insight[] = [];
  const totalScore = Object.values(axisScores).reduce((a, b) => a + b, 0) / 5;
  
  // 1. 전체 성과 인사이트
  if (totalScore >= 75) {
    insights.push({
      type: 'strength',
      title: '우수한 종합 성과',
      description: '전반적으로 균형잡힌 우수한 성과를 보이고 있습니다. 현재의 모멘텀을 유지하면서 지속적인 성장을 추구하세요.',
      impact: 'high',
      actionable: false
    });
  } else if (totalScore < 60) {
    insights.push({
      type: 'risk',
      title: '종합 성과 개선 필요',
      description: '전반적인 성과 개선이 시급합니다. 우선순위를 정해 핵심 지표부터 개선해 나가세요.',
      impact: 'high',
      actionable: true
    });
  }
  
  // 2. 축별 인사이트
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
  axes.forEach(axis => {
    const score = axisScores[axis];
    const peerAvg = benchmarks?.peer_avg?.[axis];
    
    // 강점 축
    if (score >= 80) {
      insights.push({
        type: 'strength',
        title: `${getAxisName(axis)} 우수`,
        description: `${getAxisDescription(axis)}에서 탁월한 성과를 보이고 있습니다.`,
        axis,
        impact: 'high',
        actionable: false
      });
    }
    
    // 약점 축
    if (score < 60) {
      insights.push({
        type: 'weakness',
        title: `${getAxisName(axis)} 개선 필요`,
        description: `${getAxisDescription(axis)} 강화가 필요합니다.`,
        axis,
        impact: score < 50 ? 'high' : 'medium',
        actionable: true
      });
    }
    
    // 동종업계 대비
    if (peerAvg) {
      if (score > peerAvg + 10) {
        insights.push({
          type: 'strength',
          title: `${getAxisName(axis)} 경쟁 우위`,
          description: `동종업계 대비 ${(score - peerAvg).toFixed(0)}점 높은 성과를 기록하고 있습니다.`,
          axis,
          impact: 'medium',
          actionable: false
        });
      } else if (score < peerAvg - 10) {
        insights.push({
          type: 'risk',
          title: `${getAxisName(axis)} 경쟁 열위`,
          description: `동종업계 평균보다 ${(peerAvg - score).toFixed(0)}점 낮습니다. 경쟁력 강화가 필요합니다.`,
          axis,
          impact: 'high',
          actionable: true
        });
      }
    }
  });
  
  // 3. 균형 분석
  const scoreVariance = calculateVariance(Object.values(axisScores));
  if (scoreVariance > 200) {
    insights.push({
      type: 'opportunity',
      title: '불균형한 성장',
      description: '축별 점수 편차가 큽니다. 약한 부분을 보완하여 균형잡힌 성장을 추구하세요.',
      impact: 'medium',
      actionable: true
    });
  }
  
  // 4. 특정 패턴 인사이트
  // 기술은 강하지만 비즈니스가 약한 경우
  if (axisScores.PT > 70 && axisScores.EC < 60) {
    insights.push({
      type: 'opportunity',
      title: '비즈니스 모델 강화 필요',
      description: '기술력은 우수하나 수익화 전략이 부족합니다. 비즈니스 모델을 구체화하고 수익 창출 방안을 마련하세요.',
      impact: 'high',
      actionable: true
    });
  }
  
  // 팀은 강하지만 재무가 약한 경우
  if (axisScores.TO > 70 && axisScores.PF < 60) {
    insights.push({
      type: 'risk',
      title: '자금 조달 시급',
      description: '우수한 팀을 보유하고 있으나 재무 상황이 불안정합니다. 투자 유치나 수익 개선이 시급합니다.',
      impact: 'high',
      actionable: true
    });
  }
  
  return insights.sort((a, b) => {
    // 우선순위: high > medium > low, actionable > non-actionable
    const impactOrder = { high: 3, medium: 2, low: 1 };
    const aScore = impactOrder[a.impact] * 10 + (a.actionable ? 5 : 0);
    const bScore = impactOrder[b.impact] * 10 + (b.actionable ? 5 : 0);
    return bScore - aScore;
  });
}

// 축별 추천사항 생성
function generateAxisRecommendations(
  axis: AxisKey,
  score: number,
  strengths: string[],
  weaknesses: string[]
): string[] {
  const recommendations: string[] = [];
  
  switch (axis) {
    case 'GO':
      if (score < 60) {
        recommendations.push('시장 조사를 통해 목표 고객을 명확히 정의하세요');
        recommendations.push('경쟁사 분석을 강화하고 차별화 전략을 수립하세요');
      }
      if (weaknesses.some(w => w.includes('MAU'))) {
        recommendations.push('사용자 획득 전략을 재검토하고 마케팅을 강화하세요');
      }
      break;
      
    case 'EC':
      if (score < 60) {
        recommendations.push('수익 모델을 구체화하고 단위 경제성을 개선하세요');
        recommendations.push('고객 획득 비용(CAC)을 낮추고 LTV를 높이는 전략을 수립하세요');
      }
      if (weaknesses.some(w => w.includes('MRR'))) {
        recommendations.push('유료 전환율을 높이고 구독 이탈을 줄이세요');
      }
      break;
      
    case 'PT':
      if (score < 60) {
        recommendations.push('핵심 기술의 차별화를 강화하고 지적재산권을 확보하세요');
        recommendations.push('제품 안정성을 높이고 사용자 경험을 개선하세요');
      }
      break;
      
    case 'PF':
      if (score < 60) {
        recommendations.push('현금 흐름 관리를 강화하고 런웨이를 확보하세요');
        recommendations.push('투자 유치를 준비하거나 수익 창출을 가속화하세요');
      }
      break;
      
    case 'TO':
      if (score < 60) {
        recommendations.push('핵심 인재를 영입하고 팀 역량을 강화하세요');
        recommendations.push('명확한 역할 분담과 조직 문화를 구축하세요');
      }
      break;
  }
  
  return recommendations;
}

// 유틸리티 함수
function getAxisName(axis: AxisKey): string {
  const names = {
    GO: 'Growth Opportunity',
    EC: 'Economic Value',
    PT: 'Product Technology',
    PF: 'Performance Finance',
    TO: 'Team Organization'
  };
  return names[axis];
}

function getAxisDescription(axis: AxisKey): string {
  const descriptions = {
    GO: '시장 기회 및 성장 잠재력',
    EC: '비즈니스 모델과 수익성',
    PT: '제품 기술력과 차별화',
    PF: '재무 건전성과 자금 관리',
    TO: '팀 역량과 조직 문화'
  };
  return descriptions[axis];
}

function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}