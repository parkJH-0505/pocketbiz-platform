/**
 * Mock API Endpoints for V2 Dashboard
 * 실제 API 구현 전 개발용 Mock 데이터
 */

import type {
  SimulationAdjustments,
  SimulationResponse,
  V2ScoreData,
  V2PeerData,
  PeerFilters,
  AxisKey
} from '../types';

// 시뮬레이션 지연 함수
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApiEndpoints = {
  /**
   * 현재 점수 데이터 가져오기
   */
  getScoreData: async (): Promise<V2ScoreData> => {
    await delay(500);

    return {
      current: {
        scores: {
          GO: 75,
          EC: 45,
          PT: 85,
          PF: 60,
          TO: 65
        } as Record<AxisKey, number>,
        overall: 68,
        timestamp: new Date().toISOString()
      },
      previous: {
        scores: {
          GO: 70,
          EC: 48,
          PT: 77,
          PF: 60,
          TO: 67
        } as Record<AxisKey, number>,
        overall: 63,
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      changes: {
        GO: 5,
        EC: -3,
        PT: 8,
        PF: 0,
        TO: -2
      } as Record<AxisKey, number>
    };
  },

  /**
   * 시뮬레이션 실행
   */
  simulate: async (adjustments: SimulationAdjustments): Promise<SimulationResponse> => {
    await delay(800);

    // 기본 점수
    const baseScores = {
      GO: 75,
      EC: 45,
      PT: 85,
      PF: 60,
      TO: 65
    };

    // 조정값에 따른 영향 계산
    const impacts = {
      price: {
        GO: adjustments.price * 0.2,
        EC: adjustments.price * 0.8,
        PT: adjustments.price * 0.1,
        PF: adjustments.price * 0.3,
        TO: 0
      },
      churn: {
        GO: adjustments.churn * -0.5,
        EC: adjustments.churn * -0.3,
        PT: 0,
        PF: adjustments.churn * -0.2,
        TO: adjustments.churn * -0.1
      },
      team: {
        GO: adjustments.team * 0.2,
        EC: 0,
        PT: adjustments.team * 0.3,
        PF: adjustments.team * 0.1,
        TO: adjustments.team * 0.7
      },
      growth: {
        GO: adjustments.growth * 0.6,
        EC: adjustments.growth * 0.2,
        PT: adjustments.growth * 0.1,
        PF: adjustments.growth * 0.3,
        TO: adjustments.growth * 0.2
      }
    };

    // 최종 점수 계산
    const projected: Record<AxisKey, number> = {} as Record<AxisKey, number>;
    let totalScore = 0;

    (['GO', 'EC', 'PT', 'PF', 'TO'] as AxisKey[]).forEach(axis => {
      let score = baseScores[axis];
      score += impacts.price[axis];
      score += impacts.churn[axis];
      score += impacts.team[axis];
      score += impacts.growth[axis];

      projected[axis] = Math.min(100, Math.max(0, Math.round(score)));
      totalScore += projected[axis];
    });

    const overall = Math.round(totalScore / 5);

    // 위험 및 기회 분석
    const risks = [];
    const opportunities = [];

    if (adjustments.price > 30) {
      risks.push({
        id: 'price-risk-1',
        level: 'high' as const,
        title: '가격 인상 리스크',
        description: '급격한 가격 인상으로 고객 이탈 위험',
        mitigation: '단계적 인상 및 가치 증명 필요',
        probability: 0.7,
        impact: 0.8
      });
    }

    if (adjustments.growth > 20 && adjustments.team > 20) {
      opportunities.push({
        id: 'growth-opp-1',
        title: '급성장 기회',
        description: '팀 확장과 성장 전략이 시너지 창출',
        effort: 'medium' as const,
        impact: 'high' as const,
        timeframe: '3-6개월'
      });
    }

    // 신뢰도 계산 (조정값이 클수록 신뢰도 하락)
    const totalAdjustment = Math.abs(adjustments.price) +
                           Math.abs(adjustments.churn) +
                           Math.abs(adjustments.team) +
                           Math.abs(adjustments.growth);
    const confidence = Math.max(0.5, 1 - (totalAdjustment / 400));

    return {
      projected,
      overall,
      confidence,
      risks,
      opportunities,
      timeline: [
        { date: '현재', score: 68 },
        { date: '1개월', score: Math.round((68 + overall) / 2) },
        { date: '3개월', score: overall }
      ]
    };
  },

  /**
   * 피어 데이터 가져오기
   */
  getPeerData: async (filters?: PeerFilters): Promise<V2PeerData> => {
    await delay(600);

    return {
      count: 127,
      distribution: {
        percentiles: [10, 25, 50, 75, 90],
        values: [45, 55, 62, 74, 85]
      },
      averages: {
        GO: 65,
        EC: 62,
        PT: 68,
        PF: 63,
        TO: 66
      } as Record<AxisKey, number>,
      topPerformers: [
        {
          id: 'company-1',
          name: 'TechCorp A',
          scores: { GO: 92, EC: 88, PT: 95, PF: 90, TO: 93 } as Record<AxisKey, number>,
          overall: 92,
          stage: 'Series A',
          industry: 'B2B SaaS'
        },
        {
          id: 'company-2',
          name: 'StartupX',
          scores: { GO: 88, EC: 85, PT: 90, PF: 87, TO: 89 } as Record<AxisKey, number>,
          overall: 88,
          stage: 'Series A',
          industry: 'B2B SaaS'
        }
      ],
      position: 73 // 상위 27%
    };
  }
};

/**
 * 점수에 따른 색상 반환
 */
export const getScoreColor = (score: number): string => {
  if (score >= 85) return '#8B5CF6'; // excellent - purple
  if (score >= 70) return '#10B981'; // good - green
  if (score >= 50) return '#3B82F6'; // normal - blue
  if (score >= 30) return '#F59E0B'; // warning - amber
  return '#DC2626'; // critical - red
};

/**
 * 점수에 따른 라벨 반환
 */
export const getScoreLabel = (score: number): string => {
  if (score >= 85) return '매우 우수';
  if (score >= 70) return '우수';
  if (score >= 50) return '보통';
  if (score >= 30) return '주의';
  return '위험';
};

/**
 * 축 정보
 */
export const axisInfo = {
  GO: {
    label: 'Growth & Ops',
    fullName: '성장·운영',
    color: '#9333ea',
    description: '비즈니스 성장과 운영 효율성'
  },
  EC: {
    label: 'Economics',
    fullName: '경제성·자본',
    color: '#10b981',
    description: '수익성과 재무 건전성'
  },
  PT: {
    label: 'Product & Tech',
    fullName: '제품·기술력',
    color: '#f97316',
    description: '제품 완성도와 기술 역량'
  },
  PF: {
    label: 'Proof',
    fullName: '증빙·딜레디',
    color: '#3b82f6',
    description: '시장 검증과 투자 준비도'
  },
  TO: {
    label: 'Team & Org',
    fullName: '팀·조직 역량',
    color: '#ef4444',
    description: '팀 구성과 조직 문화'
  }
};