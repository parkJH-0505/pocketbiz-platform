/**
 * Opportunity Discovery Service
 *
 * 숨은 기회를 발견하고 추천하는 서비스
 * - 사용자 프로필 기반 매칭
 * - 기회 우선순위 결정
 * - 실행 가능한 추천 생성
 */

import type {
  OpportunityInsight,
  HiddenOpportunity,
  OpportunityRecommendation,
  MarketTrend
} from '../../types/dashboard';
import type { AxisKey } from '../../types';

/**
 * 기회 타입별 아이콘 매핑
 */
export const opportunityIcons = {
  funding: '💰',
  program: '🎯',
  network: '🤝',
  market: '📈'
};

/**
 * 기회 타입별 색상 매핑
 */
export const opportunityColors = {
  funding: {
    bg: 'from-green-50 to-emerald-50',
    border: 'border-green-200',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-700'
  },
  program: {
    bg: 'from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700'
  },
  network: {
    bg: 'from-purple-50 to-violet-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-700'
  },
  market: {
    bg: 'from-orange-50 to-amber-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-700'
  }
};

/**
 * Mock 기회 데이터 생성
 */
export function generateMockOpportunities(): HiddenOpportunity[] {
  return [
    {
      id: 'opp-001',
      title: 'AI 스타트업 특별 지원',
      description: '기술보증기금 AI 특화 프로그램',
      type: 'funding',
      matchScore: 92,
      urgency: 'high',
      timeframe: 'D-5',
      requirements: [
        'AI/ML 기술 보유',
        '창업 3년 이내',
        '기술인력 3명 이상'
      ],
      expectedBenefit: '최대 5억원 보증'
    },
    {
      id: 'opp-002',
      title: '글로벌 액셀러레이터 모집',
      description: 'K-Startup 글로벌 진출 프로그램',
      type: 'program',
      matchScore: 85,
      urgency: 'medium',
      timeframe: 'D-12',
      requirements: [
        'MVP 완성',
        '영어 소통 가능',
        '해외진출 계획'
      ],
      expectedBenefit: '멘토링 + 해외 네트워킹'
    },
    {
      id: 'opp-003',
      title: 'CES 2025 한국관',
      description: '대한무역투자진흥공사 주관',
      type: 'network',
      matchScore: 78,
      urgency: 'low',
      timeframe: 'D-30',
      requirements: [
        '혁신 제품/서비스',
        '수출 실적 또는 계획',
        '영문 자료 준비'
      ],
      expectedBenefit: '부스 지원 + 바이어 매칭'
    },
    {
      id: 'opp-004',
      title: 'B2B SaaS 수요 급증',
      description: '원격근무 확산으로 협업툴 시장 성장',
      type: 'market',
      matchScore: 71,
      urgency: 'medium',
      timeframe: '지속',
      requirements: [
        'SaaS 개발 역량',
        'B2B 영업 경험',
        '구독 모델 이해'
      ],
      expectedBenefit: '연 30% 시장 성장'
    }
  ];
}

/**
 * 우선 추천 생성
 */
export function generatePrimaryRecommendation(
  opportunities: HiddenOpportunity[]
): OpportunityRecommendation {
  const topOpportunity = opportunities[0];

  if (topOpportunity.urgency === 'high' && topOpportunity.matchScore > 90) {
    return {
      title: '🔥 지금 바로 확인하세요!',
      reason: `매칭률 ${topOpportunity.matchScore}%의 완벽한 기회입니다`,
      action: '신청서 작성하기',
      timeframe: topOpportunity.timeframe,
      difficulty: 'medium'
    };
  }

  if (topOpportunity.type === 'funding') {
    return {
      title: '💰 자금 조달 기회',
      reason: '현재 성장 단계에 필요한 자금 확보 가능',
      action: '자격 요건 확인하기',
      timeframe: topOpportunity.timeframe,
      difficulty: 'easy'
    };
  }

  return {
    title: '✨ 새로운 성장 기회',
    reason: '현재 상황에 적합한 프로그램을 발견했어요',
    action: '상세 내용 보기',
    timeframe: '이번 주 내',
    difficulty: 'easy'
  };
}

/**
 * 시장 트렌드 생성
 */
export function generateMarketTrends(): MarketTrend[] {
  return [
    {
      category: 'AI/ML',
      trend: 'rising',
      impact: 'high',
      relevance: 0.95,
      description: 'GPT 이후 AI 서비스 수요 폭발적 증가'
    },
    {
      category: 'SaaS',
      trend: 'rising',
      impact: 'medium',
      relevance: 0.8,
      description: '구독 경제 확산으로 B2B SaaS 성장'
    },
    {
      category: '핀테크',
      trend: 'stable',
      impact: 'medium',
      relevance: 0.6,
      description: '규제 완화로 새로운 기회 창출'
    }
  ];
}

/**
 * 기회 인사이트 생성
 */
export function generateOpportunityInsight(): OpportunityInsight {
  const opportunities = generateMockOpportunities();
  const primaryRecommendation = generatePrimaryRecommendation(opportunities);
  const trends = generateMarketTrends();

  return {
    opportunities,
    primaryRecommendation,
    trends
  };
}

/**
 * 기회 점수 계산
 */
export function calculateOpportunityScore(
  opportunity: HiddenOpportunity,
  userProfile: {
    strengths: AxisKey[];
    stage: string;
    sector: string;
  }
): number {
  let score = opportunity.matchScore;

  // 긴급도에 따른 가중치
  const urgencyWeight = {
    high: 1.2,
    medium: 1.0,
    low: 0.8
  };
  score *= urgencyWeight[opportunity.urgency];

  // 타입별 사용자 선호도 (예시)
  const typePreference = {
    funding: 1.3, // 자금 조달 선호
    program: 1.1,
    network: 1.0,
    market: 0.9
  };
  score *= typePreference[opportunity.type];

  return Math.min(100, Math.round(score));
}

/**
 * 기회 필터링
 */
export function filterOpportunities(
  opportunities: HiddenOpportunity[],
  filters: {
    types?: Array<HiddenOpportunity['type']>;
    minScore?: number;
    urgency?: Array<HiddenOpportunity['urgency']>;
  }
): HiddenOpportunity[] {
  return opportunities.filter(opp => {
    if (filters.types && !filters.types.includes(opp.type)) {
      return false;
    }
    if (filters.minScore && opp.matchScore < filters.minScore) {
      return false;
    }
    if (filters.urgency && !filters.urgency.includes(opp.urgency)) {
      return false;
    }
    return true;
  });
}

/**
 * 기회 정렬
 */
export function sortOpportunities(
  opportunities: HiddenOpportunity[],
  sortBy: 'score' | 'urgency' | 'timeframe' = 'score'
): HiddenOpportunity[] {
  const sorted = [...opportunities];

  switch (sortBy) {
    case 'score':
      return sorted.sort((a, b) => b.matchScore - a.matchScore);

    case 'urgency':
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      return sorted.sort((a, b) =>
        urgencyOrder[b.urgency] - urgencyOrder[a.urgency]
      );

    case 'timeframe':
      return sorted.sort((a, b) => {
        const getDays = (tf: string) => {
          const match = tf.match(/D-(\d+)/);
          return match ? parseInt(match[1]) : 999;
        };
        return getDays(a.timeframe) - getDays(b.timeframe);
      });

    default:
      return sorted;
  }
}

/**
 * 실행 난이도 평가
 */
export function assessDifficulty(
  opportunity: HiddenOpportunity,
  userCapabilities: {
    resources: number; // 1-10
    experience: number; // 1-10
    team: number; // 1-10
  }
): 'easy' | 'medium' | 'hard' {
  const reqCount = opportunity.requirements.length;
  const avgCapability =
    (userCapabilities.resources +
     userCapabilities.experience +
     userCapabilities.team) / 3;

  if (reqCount <= 2 && avgCapability >= 7) return 'easy';
  if (reqCount <= 4 && avgCapability >= 5) return 'medium';
  return 'hard';
}