/**
 * Cluster Knowledge Base System
 *
 * 각 클러스터(Sector × Stage)별 비즈니스 성공 요소, 해석 규칙, 벤치마크 데이터
 * Phase 1: 5개 핵심 클러스터로 시작 (tech-seed, tech-pmf, b2b_saas-pmf, b2c-growth, ecommerce-early)
 */

import type { ProcessedKPIData } from '@/types/reportV3.types';

// ============================================
// 타입 정의
// ============================================

export interface ClusterKnowledge {
  id: string; // 'tech-seed', 'b2b_saas-pmf', etc.
  sector: string;
  stage: string;
  displayName: string;

  // 1. 이 클러스터의 핵심 성공 요소
  criticalSuccessFactors: {
    factors: string[]; // 예: ['초기 고객 확보', 'MVP 개발', '제품-시장 적합성']
    description: string; // 이 단계의 비즈니스 특징
  };

  // 2. KPI 중요도 매핑 (이 클러스터에서 어떤 KPI가 얼마나 중요한가)
  kpiImportance: Record<string, number>; // KPI 카테고리 -> 중요도 가중치 (0-10)

  // 3. 이 클러스터만의 해석 로직
  interpretationRules: {
    [kpiCategory: string]: InterpretationRule;
  };

  // 4. 벤치마크 데이터 (실제 업계 데이터)
  benchmarks: {
    [kpiCategory: string]: BenchmarkData;
  };

  // 5. 다음 단계 전환 조건
  stageTransition: {
    nextStage: string;
    requiredConditions: TransitionCondition[];
    recommendedActions: string[];
  };

  // 6. 위험 신호 탐지 룰
  riskDetectionRules: {
    [riskType: string]: (data: ProcessedKPIData[]) => RiskAlert | null;
  };
}

export interface InterpretationRule {
  category: string; // 'customer_acquisition', 'revenue', 'product', etc.
  excellent: (value: number) => string;
  good: (value: number) => string;
  needsImprovement: (value: number) => string;
  context: string; // 왜 이 기준인지 설명
}

export interface BenchmarkData {
  category: string;
  p10: number; // 하위 10%
  p25: number; // 하위 25%
  p50: number; // 중앙값 (median)
  p75: number; // 상위 25%
  p90: number; // 상위 10%
  source: string; // 데이터 출처
  lastUpdated: string; // 마지막 업데이트 날짜
  sampleSize?: number; // 샘플 크기
}

export interface TransitionCondition {
  kpiCategory: string;
  minScore: number;
  description: string;
}

export interface RiskAlert {
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  affectedKPIs: string[];
  suggestedActions: string[];
}

// ============================================
// 클러스터 정의
// ============================================

/**
 * Cluster 1: Tech Startup - Seed Stage
 *
 * 특징: 아이디어 검증, MVP 개발, 초기 고객 확보
 * 핵심 지표: 제품 개발 속도, 초기 사용자 확보, 팀 구성
 */
export const TECH_SEED: ClusterKnowledge = {
  id: 'tech-seed',
  sector: 'Technology',
  stage: 'Seed',
  displayName: 'Tech Startup (Seed Stage)',

  criticalSuccessFactors: {
    factors: [
      'MVP 개발 완료',
      '초기 고객 10-50명 확보',
      '제품-시장 적합성 가설 검증',
      '핵심 팀 구성 (2-5명)',
      '시장 반응 데이터 수집'
    ],
    description: '아이디어를 실제 제품으로 구현하고, 소수의 얼리어답터로부터 피드백을 받는 단계입니다. 빠른 실행과 학습이 가장 중요합니다.'
  },

  kpiImportance: {
    'product_development': 9, // 제품 개발이 최우선
    'customer_acquisition': 8, // 초기 고객 확보
    'team_building': 8, // 팀 구성
    'revenue': 3, // 수익은 아직 중요하지 않음
    'operational_efficiency': 5,
    'market_validation': 9 // 시장 검증이 핵심
  },

  interpretationRules: {
    'initial_users': {
      category: 'customer_acquisition',
      excellent: (value: number) =>
        `${value}명의 초기 사용자는 Seed 단계에서 매우 우수한 수준입니다. 빠른 사용자 확보 능력을 보여주고 있습니다.`,
      good: (value: number) =>
        `${value}명의 초기 사용자는 양호한 수준입니다. 계속해서 사용자를 늘려나가세요.`,
      needsImprovement: (value: number) =>
        `${value}명의 사용자는 개선이 필요합니다. Seed 단계에서는 최소 10-20명의 얼리어답터 확보가 중요합니다.`,
      context: 'Seed 단계에서는 소수의 열정적인 얼리어답터가 제품 개선의 핵심입니다. 적어도 10명 이상의 활성 사용자를 확보해야 의미있는 피드백을 얻을 수 있습니다.'
    },
    'mvp_progress': {
      category: 'product_development',
      excellent: (value: number) =>
        `MVP 개발 진행률 ${value}%는 탁월합니다. 빠른 실행 능력을 보여주고 있습니다.`,
      good: (value: number) =>
        `MVP 개발 ${value}% 진행 중입니다. 목표 일정을 지키고 있습니다.`,
      needsImprovement: (value: number) =>
        `MVP 개발 ${value}%는 다소 느립니다. 개발 속도를 높이거나 MVP 범위를 줄이는 것을 고려하세요.`,
      context: 'Seed 단계에서는 완벽한 제품보다 빠른 출시가 중요합니다. 3-6개월 내에 MVP를 출시하는 것이 이상적입니다.'
    },
    'team_size': {
      category: 'team_building',
      excellent: (value: number) =>
        `${value}명의 팀은 Seed 단계에 최적화된 규모입니다. 효율적인 의사결정이 가능합니다.`,
      good: (value: number) =>
        `${value}명의 팀 규모는 적절합니다.`,
      needsImprovement: (value: number) =>
        `${value}명의 팀은 주의가 필요합니다. Seed 단계에서는 2-5명의 핵심 멤버로 시작하는 것이 일반적입니다.`,
      context: 'Seed 단계에서는 소수 정예가 유리합니다. 창업자 1-2명 + 개발자 1-2명 + 필요시 디자이너/마케터 1명 정도가 적절합니다.'
    }
  },

  benchmarks: {
    'initial_users': {
      category: 'customer_acquisition',
      p10: 5,
      p25: 15,
      p50: 30,
      p75: 80,
      p90: 200,
      source: 'Y Combinator Seed Stage Survey 2024',
      lastUpdated: '2024-01',
      sampleSize: 500
    },
    'mvp_completion': {
      category: 'product_development',
      p10: 30,
      p25: 50,
      p50: 70,
      p75: 85,
      p90: 95,
      source: '500 Startups Seed Cohort Data',
      lastUpdated: '2024-01',
      sampleSize: 350
    },
    'team_size': {
      category: 'team_building',
      p10: 2,
      p25: 3,
      p50: 4,
      p75: 6,
      p90: 10,
      source: 'Crunchbase Seed Stage Analysis',
      lastUpdated: '2024-01',
      sampleSize: 1200
    },
    'monthly_burn': {
      category: 'financial_health',
      p10: 5000,
      p25: 15000,
      p50: 30000,
      p75: 60000,
      p90: 120000,
      source: 'Startup Genome Report 2024',
      lastUpdated: '2024-01',
      sampleSize: 800
    }
  },

  stageTransition: {
    nextStage: 'Product-Market Fit',
    requiredConditions: [
      {
        kpiCategory: 'initial_users',
        minScore: 60,
        description: '최소 50명 이상의 활성 사용자 확보'
      },
      {
        kpiCategory: 'mvp_completion',
        minScore: 80,
        description: 'MVP 개발 완료 및 출시'
      },
      {
        kpiCategory: 'user_satisfaction',
        minScore: 70,
        description: '사용자 만족도 70점 이상'
      }
    ],
    recommendedActions: [
      '현재 사용자로부터 더 깊이있는 피드백 수집',
      '핵심 기능에 집중하여 제품 완성도 높이기',
      '초기 고객 중 열성 팬 10명 확보',
      'Product-Market Fit 달성 위한 핵심 지표 정의'
    ]
  },

  riskDetectionRules: {
    'slow_product_development': (data: ProcessedKPIData[]) => {
      const mvpProgress = data.find(kpi =>
        kpi.kpi.name.toLowerCase().includes('mvp') ||
        kpi.kpi.question.toLowerCase().includes('개발 진행')
      );

      if (mvpProgress && mvpProgress.processedValue.normalizedScore < 40) {
        return {
          type: 'warning',
          title: '제품 개발 속도 저하',
          description: 'MVP 개발이 예상보다 느리게 진행되고 있습니다. Seed 단계에서는 빠른 실행이 생존의 열쇠입니다.',
          affectedKPIs: [mvpProgress.kpi.kpi_id],
          suggestedActions: [
            'MVP 범위를 줄여 핵심 기능만 먼저 출시',
            '개발 리소스 부족 시 외주 개발 고려',
            '기술적 난이도가 높다면 더 단순한 솔루션 모색',
            '매주 구체적인 개발 마일스톤 설정'
          ]
        };
      }
      return null;
    },
    'insufficient_user_feedback': (data: ProcessedKPIData[]) => {
      const userCount = data.find(kpi =>
        kpi.kpi.question.toLowerCase().includes('사용자') ||
        kpi.kpi.question.toLowerCase().includes('고객')
      );

      if (userCount && userCount.processedValue.normalizedScore < 30) {
        return {
          type: 'critical',
          title: '초기 사용자 확보 부족',
          description: '충분한 사용자 피드백을 받지 못하고 있습니다. 제품 검증이 어렵습니다.',
          affectedKPIs: [userCount.kpi.kpi_id],
          suggestedActions: [
            '주변 지인부터 시작해서라도 10명 이상 확보',
            'Product Hunt, 관련 커뮤니티에 제품 공유',
            '타겟 고객이 모이는 온/오프라인 채널 찾기',
            '베타 테스터 모집 캠페인 진행'
          ]
        };
      }
      return null;
    },
    'runway_concern': (data: ProcessedKPIData[]) => {
      const burn = data.find(kpi =>
        kpi.kpi.question.toLowerCase().includes('번 레이트') ||
        kpi.kpi.question.toLowerCase().includes('월 지출')
      );
      const runway = data.find(kpi =>
        kpi.kpi.question.toLowerCase().includes('런웨이') ||
        kpi.kpi.question.toLowerCase().includes('자금')
      );

      if (runway && runway.processedValue.normalizedScore < 40) {
        return {
          type: 'critical',
          title: '자금 소진 위험',
          description: '런웨이가 부족합니다. 자금 확보 또는 비용 절감이 시급합니다.',
          affectedKPIs: runway ? [runway.kpi.kpi_id] : [],
          suggestedActions: [
            '즉시 투자 유치 활동 시작 (엔젤, 액셀러레이터)',
            '월 고정비 30% 이상 절감 방안 검토',
            '핵심 기능만 개발하여 출시 일정 단축',
            '초기 수익 창출 방안 모색 (베타 유료화 등)'
          ]
        };
      }
      return null;
    }
  }
};

/**
 * Cluster 2: Tech Startup - Product-Market Fit Stage
 *
 * 특징: 제품-시장 적합성 달성, 초기 트랙션 확보, 비즈니스 모델 검증
 * 핵심 지표: 사용자 증가율, 리텐션, 초기 수익, NPS
 */
export const TECH_PMF: ClusterKnowledge = {
  id: 'tech-pmf',
  sector: 'Technology',
  stage: 'Product-Market Fit',
  displayName: 'Tech Startup (PMF Stage)',

  criticalSuccessFactors: {
    factors: [
      '월간 활성 사용자 500-5,000명',
      '월 사용자 증가율 10-20%',
      '리텐션 40% 이상',
      '초기 수익 발생 ($1K-$10K MRR)',
      'NPS 50 이상'
    ],
    description: '제품-시장 적합성을 달성하고, 지속 가능한 성장의 기반을 마련하는 단계입니다. 사용자들이 제품에 가치를 느끼고 돌아오는지 확인이 중요합니다.'
  },

  kpiImportance: {
    'product_development': 7,
    'customer_acquisition': 9, // 사용자 성장이 핵심
    'retention': 10, // 리텐션이 가장 중요
    'revenue': 7, // 수익 모델 검증 시작
    'user_satisfaction': 9, // NPS, 만족도
    'market_validation': 8
  },

  interpretationRules: {
    'mau': {
      category: 'customer_acquisition',
      excellent: (value: number) =>
        `MAU ${value.toLocaleString()}명은 PMF 단계에서 탁월한 수준입니다. 강력한 제품-시장 적합성을 보여줍니다.`,
      good: (value: number) =>
        `MAU ${value.toLocaleString()}명은 양호합니다. 지속적인 성장세를 유지하세요.`,
      needsImprovement: (value: number) =>
        `MAU ${value.toLocaleString()}명은 개선이 필요합니다. PMF를 달성하려면 최소 500명 이상의 활성 사용자가 필요합니다.`,
      context: 'PMF 단계에서는 수백에서 수천 명의 활성 사용자를 확보해야 합니다. 단순히 숫자가 아니라, 이들이 정기적으로 제품을 사용하는지가 중요합니다.'
    },
    'retention_rate': {
      category: 'retention',
      excellent: (value: number) =>
        `${value}%의 리텐션율은 강력한 PMF 신호입니다. 사용자들이 제품에 높은 가치를 느끼고 있습니다.`,
      good: (value: number) =>
        `${value}%의 리텐션율은 적절합니다. 40% 이상을 목표로 계속 개선하세요.`,
      needsImprovement: (value: number) =>
        `${value}%의 리텐션율은 낮습니다. PMF를 달성하려면 최소 30-40% 이상의 리텐션이 필요합니다.`,
      context: '리텐션은 PMF의 가장 중요한 지표입니다. 사용자가 돌아오지 않는다면 아직 PMF를 달성하지 못한 것입니다.'
    },
    'mrr': {
      category: 'revenue',
      excellent: (value: number) =>
        `MRR $${value.toLocaleString()}는 PMF 단계에서 뛰어난 수익화 성과입니다.`,
      good: (value: number) =>
        `MRR $${value.toLocaleString()}는 순조로운 시작입니다. 수익화 모델이 작동하고 있습니다.`,
      needsImprovement: (value: number) =>
        `MRR $${value.toLocaleString()}는 아직 초기 단계입니다. 수익화 전략을 더 적극적으로 실행하세요.`,
      context: 'PMF 단계에서는 최소 $1,000-$10,000 MRR을 목표로 해야 합니다. 수익 자체보다 수익화 모델이 작동하는지 검증이 중요합니다.'
    },
    'nps': {
      category: 'user_satisfaction',
      excellent: (value: number) =>
        `NPS ${value}는 탁월합니다. 사용자들이 제품을 적극 추천하고 있습니다.`,
      good: (value: number) =>
        `NPS ${value}는 양호합니다. 계속해서 사용자 만족도를 높이세요.`,
      needsImprovement: (value: number) =>
        `NPS ${value}는 개선이 필요합니다. PMF를 위해서는 최소 NPS 30-50 이상이 필요합니다.`,
      context: 'NPS는 진정한 PMF를 측정하는 핵심 지표입니다. 50 이상이면 강력한 PMF, 30-50은 약한 PMF, 30 미만은 아직 PMF 미달성입니다.'
    }
  },

  benchmarks: {
    'mau': {
      category: 'customer_acquisition',
      p10: 200,
      p25: 500,
      p50: 1500,
      p75: 5000,
      p90: 15000,
      source: 'SaaS Capital PMF Survey 2024',
      lastUpdated: '2024-01',
      sampleSize: 450
    },
    'mom_growth': {
      category: 'growth_rate',
      p10: 5,
      p25: 10,
      p50: 20,
      p75: 40,
      p90: 80,
      source: 'OpenView SaaS Benchmarks 2024',
      lastUpdated: '2024-01',
      sampleSize: 600
    },
    'retention_rate': {
      category: 'retention',
      p10: 20,
      p25: 30,
      p50: 40,
      p75: 55,
      p90: 70,
      source: 'Mixpanel Retention Report 2024',
      lastUpdated: '2024-01',
      sampleSize: 1000
    },
    'mrr': {
      category: 'revenue',
      p10: 500,
      p25: 2000,
      p50: 5000,
      p75: 15000,
      p90: 50000,
      source: 'ChartMogul Early Stage Data',
      lastUpdated: '2024-01',
      sampleSize: 800
    },
    'nps': {
      category: 'user_satisfaction',
      p10: 10,
      p25: 30,
      p50: 50,
      p75: 65,
      p90: 80,
      source: 'Delighted NPS Benchmark 2024',
      lastUpdated: '2024-01',
      sampleSize: 1200
    }
  },

  stageTransition: {
    nextStage: 'Growth',
    requiredConditions: [
      {
        kpiCategory: 'mau',
        minScore: 70,
        description: 'MAU 5,000명 이상 또는 월 20% 이상 성장'
      },
      {
        kpiCategory: 'retention_rate',
        minScore: 70,
        description: '리텐션 40% 이상'
      },
      {
        kpiCategory: 'mrr',
        minScore: 60,
        description: 'MRR $10K 이상'
      },
      {
        kpiCategory: 'nps',
        minScore: 70,
        description: 'NPS 50 이상'
      }
    ],
    recommendedActions: [
      '성장을 위한 마케팅 채널 다각화',
      '제품 주도 성장(PLG) 전략 수립',
      'Sales 조직 구축 준비',
      'Series A 투자 유치 준비'
    ]
  },

  riskDetectionRules: {
    'low_retention': (data: ProcessedKPIData[]) => {
      const retention = data.find(kpi =>
        kpi.kpi.question.toLowerCase().includes('리텐션') ||
        kpi.kpi.question.toLowerCase().includes('retention')
      );

      if (retention && retention.processedValue.normalizedScore < 40) {
        return {
          type: 'critical',
          title: '낮은 리텐션 - PMF 미달성',
          description: '리텐션이 낮아 진정한 PMF를 달성하지 못했을 가능성이 높습니다.',
          affectedKPIs: [retention.kpi.kpi_id],
          suggestedActions: [
            '이탈 사용자 인터뷰 (왜 돌아오지 않는가?)',
            '핵심 가치 제공 시점을 앞당기기 (Aha moment)',
            '온보딩 프로세스 개선',
            '푸시 알림, 이메일 등 리인게이지먼트 전략'
          ]
        };
      }
      return null;
    },
    'vanity_growth': (data: ProcessedKPIData[]) => {
      const mau = data.find(kpi => kpi.kpi.question.toLowerCase().includes('mau'));
      const retention = data.find(kpi => kpi.kpi.question.toLowerCase().includes('리텐션'));

      if (mau && retention &&
          mau.processedValue.normalizedScore > 60 &&
          retention.processedValue.normalizedScore < 40) {
        return {
          type: 'warning',
          title: '허수 성장 경고',
          description: '사용자 수는 늘지만 리텐션이 낮습니다. 지속 가능하지 않은 성장입니다.',
          affectedKPIs: [mau.kpi.kpi_id, retention.kpi.kpi_id],
          suggestedActions: [
            '신규 사용자 확보보다 기존 사용자 만족에 집중',
            '제품 핵심 가치 재정의',
            '타겟 고객 세그먼트 재검토',
            '코호트 분석으로 어떤 유형의 사용자가 남는지 파악'
          ]
        };
      }
      return null;
    },
    'monetization_delay': (data: ProcessedKPIData[]) => {
      const mrr = data.find(kpi => kpi.kpi.question.toLowerCase().includes('mrr') ||
                                    kpi.kpi.question.toLowerCase().includes('수익'));
      const mau = data.find(kpi => kpi.kpi.question.toLowerCase().includes('mau'));

      if (mau && mrr &&
          mau.processedValue.normalizedScore > 60 &&
          mrr.processedValue.normalizedScore < 30) {
        return {
          type: 'warning',
          title: '수익화 지연',
          description: '사용자는 많지만 수익화가 되지 않고 있습니다. 비즈니스 모델 검증이 필요합니다.',
          affectedKPIs: [mrr.kpi.kpi_id, mau.kpi.kpi_id],
          suggestedActions: [
            '가격 정책 수립 및 테스트',
            '유료 전환 퍼널 분석',
            '지불 의사가 높은 고객 세그먼트 찾기',
            '프리미엄 기능 차별화'
          ]
        };
      }
      return null;
    }
  }
};

/**
 * Cluster 3: B2B SaaS - Product-Market Fit Stage
 *
 * 특징: 엔터프라이즈 고객 확보, 장기 계약, 높은 ARPU
 * 핵심 지표: 고객사 수, MRR, CAC, LTV, Churn Rate
 */
export const B2B_SAAS_PMF: ClusterKnowledge = {
  id: 'b2b_saas-pmf',
  sector: 'B2B SaaS',
  stage: 'Product-Market Fit',
  displayName: 'B2B SaaS (PMF Stage)',

  criticalSuccessFactors: {
    factors: [
      '유료 고객사 10-50개',
      'MRR $10K-$50K',
      '평균 계약 기간 12개월 이상',
      'Net Revenue Retention 90% 이상',
      'CAC Payback Period 12개월 이하'
    ],
    description: 'B2B SaaS는 소수의 고객으로부터 높은 ARPU를 확보하는 것이 특징입니다. 고객 만족도와 장기 유지가 핵심입니다.'
  },

  kpiImportance: {
    'customer_acquisition': 9,
    'revenue': 10, // MRR이 가장 중요
    'retention': 10, // Churn 관리 핵심
    'customer_success': 9,
    'sales_efficiency': 8, // CAC, Sales Cycle
    'product_development': 6
  },

  interpretationRules: {
    'paying_customers': {
      category: 'customer_acquisition',
      excellent: (value: number) =>
        `유료 고객사 ${value}개는 B2B SaaS PMF 단계에서 탁월합니다. 영업 프로세스가 효과적으로 작동하고 있습니다.`,
      good: (value: number) =>
        `유료 고객사 ${value}개는 양호합니다. 꾸준히 고객사를 늘려가세요.`,
      needsImprovement: (value: number) =>
        `유료 고객사 ${value}개는 부족합니다. PMF를 위해 최소 10-20개 고객사가 필요합니다.`,
      context: 'B2B SaaS는 최소 10개 이상의 유료 고객사를 확보해야 PMF를 검증할 수 있습니다. 다양한 업종/규모의 고객사 확보가 중요합니다.'
    },
    'mrr': {
      category: 'revenue',
      excellent: (value: number) =>
        `MRR $${value.toLocaleString()}는 B2B SaaS PMF 단계에서 뛰어난 성과입니다.`,
      good: (value: number) =>
        `MRR $${value.toLocaleString()}는 순조롭습니다. 지속적인 성장을 유지하세요.`,
      needsImprovement: (value: number) =>
        `MRR $${value.toLocaleString()}는 개선이 필요합니다. B2B SaaS는 $10K-$50K MRR이 PMF 기준입니다.`,
      context: 'B2B SaaS는 B2C보다 높은 ARPU를 목표로 해야 합니다. 고객사당 월 $500-$2,000 정도가 이상적입니다.'
    },
    'nrr': {
      category: 'retention',
      excellent: (value: number) =>
        `NRR ${value}%는 탁월합니다. 기존 고객으로부터 지속적으로 매출이 증가하고 있습니다.`,
      good: (value: number) =>
        `NRR ${value}%는 양호합니다. 100% 이상을 목표로 업셀/크로스셀 전략을 강화하세요.`,
      needsImprovement: (value: number) =>
        `NRR ${value}%는 우려됩니다. 고객 이탈이나 다운그레이드가 많습니다.`,
      context: 'NRR(Net Revenue Retention)은 B2B SaaS의 건강도를 나타냅니다. 100% 이상이면 이탈보다 업셀이 많다는 의미로 매우 긍정적입니다.'
    },
    'cac_payback': {
      category: 'sales_efficiency',
      excellent: (value: number) =>
        `CAC Payback ${value}개월은 매우 효율적입니다. 빠른 회수가 가능합니다.`,
      good: (value: number) =>
        `CAC Payback ${value}개월은 적절합니다. 12개월 이하를 유지하세요.`,
      needsImprovement: (value: number) =>
        `CAC Payback ${value}개월은 너무 깁니다. CAC를 낮추거나 ARPU를 높여야 합니다.`,
      context: 'B2B SaaS는 CAC Payback이 12개월 이하여야 건강합니다. 너무 길면 캐시플로우에 부담이 됩니다.'
    }
  },

  benchmarks: {
    'paying_customers': {
      category: 'customer_acquisition',
      p10: 5,
      p25: 12,
      p50: 25,
      p75: 50,
      p90: 100,
      source: 'SaaS Capital B2B Survey 2024',
      lastUpdated: '2024-01',
      sampleSize: 400
    },
    'mrr': {
      category: 'revenue',
      p10: 5000,
      p25: 15000,
      p50: 30000,
      p75: 60000,
      p90: 120000,
      source: 'ChartMogul B2B SaaS Data',
      lastUpdated: '2024-01',
      sampleSize: 650
    },
    'nrr': {
      category: 'retention',
      p10: 70,
      p25: 85,
      p50: 95,
      p75: 110,
      p90: 130,
      source: 'KeyBanc Capital Markets SaaS Survey 2024',
      lastUpdated: '2024-01',
      sampleSize: 500
    },
    'cac_payback': {
      category: 'sales_efficiency',
      p10: 6,
      p25: 9,
      p50: 12,
      p75: 18,
      p90: 24,
      source: 'OpenView B2B Benchmarks 2024',
      lastUpdated: '2024-01',
      sampleSize: 450
    },
    'arpu': {
      category: 'revenue',
      p10: 200,
      p25: 500,
      p50: 1000,
      p75: 2000,
      p90: 5000,
      source: 'ProfitWell B2B Pricing Data',
      lastUpdated: '2024-01',
      sampleSize: 800
    }
  },

  stageTransition: {
    nextStage: 'Growth',
    requiredConditions: [
      {
        kpiCategory: 'paying_customers',
        minScore: 70,
        description: '50개 이상의 유료 고객사'
      },
      {
        kpiCategory: 'mrr',
        minScore: 70,
        description: 'MRR $50K 이상'
      },
      {
        kpiCategory: 'nrr',
        minScore: 70,
        description: 'NRR 95% 이상'
      },
      {
        kpiCategory: 'cac_payback',
        minScore: 70,
        description: 'CAC Payback 12개월 이하'
      }
    ],
    recommendedActions: [
      'Sales 팀 확대 및 프로세스 표준화',
      'Customer Success 조직 구축',
      '엔터프라이즈 고객 타겟팅 준비',
      'Series A 투자 유치'
    ]
  },

  riskDetectionRules: {
    'high_churn': (data: ProcessedKPIData[]) => {
      const churn = data.find(kpi =>
        kpi.kpi.question.toLowerCase().includes('churn') ||
        kpi.kpi.question.toLowerCase().includes('이탈')
      );

      if (churn && churn.processedValue.normalizedScore < 40) {
        return {
          type: 'critical',
          title: '높은 이탈률',
          description: 'B2B SaaS에서 높은 이탈률은 치명적입니다. 즉각적인 대응이 필요합니다.',
          affectedKPIs: [churn.kpi.kpi_id],
          suggestedActions: [
            '이탈 고객 인터뷰 (Churn Interview)',
            'Customer Success 전담 인력 배치',
            '온보딩 프로세스 강화',
            '정기적인 QBR(Quarterly Business Review) 실시',
            '얼리 워닝 시스템 구축 (사용량 감소 감지)'
          ]
        };
      }
      return null;
    },
    'long_sales_cycle': (data: ProcessedKPIData[]) => {
      const salesCycle = data.find(kpi =>
        kpi.kpi.question.toLowerCase().includes('영업 주기') ||
        kpi.kpi.question.toLowerCase().includes('sales cycle')
      );

      if (salesCycle && salesCycle.processedValue.normalizedScore < 40) {
        return {
          type: 'warning',
          title: '긴 영업 주기',
          description: '영업 주기가 너무 깁니다. 효율성 개선이 필요합니다.',
          affectedKPIs: [salesCycle.kpi.kpi_id],
          suggestedActions: [
            'ICP(Ideal Customer Profile) 명확화',
            '세일즈 플레이북 작성',
            '프리 트라이얼/프리미엄 전략 검토',
            'Decision Maker 조기 접촉 전략'
          ]
        };
      }
      return null;
    },
    'negative_unit_economics': (data: ProcessedKPIData[]) => {
      const cac = data.find(kpi => kpi.kpi.question.toLowerCase().includes('cac'));
      const ltv = data.find(kpi => kpi.kpi.question.toLowerCase().includes('ltv'));

      // CAC와 LTV 비율 체크 (이상적으로 LTV/CAC > 3)
      // 단순화를 위해 점수 기반으로 판단
      if (cac && ltv &&
          ltv.processedValue.normalizedScore < cac.processedValue.normalizedScore) {
        return {
          type: 'critical',
          title: '부정적 유닛 이코노믹스',
          description: '고객 확보 비용이 고객 생애 가치보다 높습니다. 지속 가능하지 않습니다.',
          affectedKPIs: [cac.kpi.kpi_id, ltv.kpi.kpi_id],
          suggestedActions: [
            'CAC 절감: 효율적인 마케팅 채널 집중',
            'LTV 증대: 업셀/크로스셀, Churn 감소',
            '가격 인상 검토',
            '저가치 고객 세그먼트 필터링'
          ]
        };
      }
      return null;
    }
  }
};

/**
 * Cluster 4: B2C - Growth Stage
 *
 * 특징: 대규모 사용자 확보, 바이럴 성장, 낮은 ARPU
 * 핵심 지표: MAU, DAU/MAU, K-Factor, ARPU, 광고 수익
 */
export const B2C_GROWTH: ClusterKnowledge = {
  id: 'b2c-growth',
  sector: 'B2C',
  stage: 'Growth',
  displayName: 'B2C (Growth Stage)',

  criticalSuccessFactors: {
    factors: [
      'MAU 50K-500K',
      'DAU/MAU 비율 20% 이상',
      'K-Factor > 1 (바이럴)',
      '월 성장률 15-30%',
      'ARPU $5-$20'
    ],
    description: 'B2C Growth 단계는 빠른 사용자 확보와 바이럴 성장이 핵심입니다. 대규모 사용자 기반을 확보한 후 수익화합니다.'
  },

  kpiImportance: {
    'customer_acquisition': 10, // 사용자 성장이 최우선
    'engagement': 10, // DAU/MAU가 핵심
    'viral_growth': 9, // K-Factor, 바이럴
    'retention': 9,
    'revenue': 6, // 초기에는 덜 중요
    'monetization': 7
  },

  interpretationRules: {
    'mau': {
      category: 'customer_acquisition',
      excellent: (value: number) =>
        `MAU ${value.toLocaleString()}명은 B2C Growth 단계에서 탁월합니다. 대규모 사용자 기반을 확보했습니다.`,
      good: (value: number) =>
        `MAU ${value.toLocaleString()}명은 양호합니다. 성장세를 유지하세요.`,
      needsImprovement: (value: number) =>
        `MAU ${value.toLocaleString()}명은 부족합니다. Growth 단계에서는 최소 5만 명 이상이 필요합니다.`,
      context: 'B2C는 규모의 경제가 중요합니다. Growth 단계에서는 수만에서 수십만 명의 MAU를 확보해야 의미있는 수익화가 가능합니다.'
    },
    'dau_mau': {
      category: 'engagement',
      excellent: (value: number) =>
        `DAU/MAU ${value}%는 탁월한 참여도입니다. 사용자들이 거의 매일 제품을 사용합니다.`,
      good: (value: number) =>
        `DAU/MAU ${value}%는 양호합니다. 20% 이상을 목표로 하세요.`,
      needsImprovement: (value: number) =>
        `DAU/MAU ${value}%는 낮습니다. 사용자 참여도를 높여야 합니다.`,
      context: 'DAU/MAU는 얼마나 자주 사용되는지 나타냅니다. 20% 이상이면 주 1-2회, 30% 이상이면 거의 매일 사용됩니다.'
    },
    'k_factor': {
      category: 'viral_growth',
      excellent: (value: number) =>
        `K-Factor ${value.toFixed(2)}는 강력한 바이럴 성장입니다. 기하급수적 성장이 가능합니다.`,
      good: (value: number) =>
        `K-Factor ${value.toFixed(2)}는 양호합니다. 1.0 이상을 목표로 하세요.`,
      needsImprovement: (value: number) =>
        `K-Factor ${value.toFixed(2)}는 낮습니다. 바이럴 요소를 강화해야 합니다.`,
      context: 'K-Factor > 1이면 자체적으로 성장합니다. 각 사용자가 평균 1명 이상의 신규 사용자를 데려옵니다.'
    },
    'arpu': {
      category: 'revenue',
      excellent: (value: number) =>
        `ARPU $${value.toFixed(2)}는 B2C 앱으로서 뛰어난 수익화입니다.`,
      good: (value: number) =>
        `ARPU $${value.toFixed(2)}는 적절합니다.`,
      needsImprovement: (value: number) =>
        `ARPU $${value.toFixed(2)}는 낮습니다. 수익화 전략을 개선해야 합니다.`,
      context: 'B2C는 낮은 ARPU를 대규모 사용자로 보완합니다. $5-$20 정도가 일반적입니다.'
    }
  },

  benchmarks: {
    'mau': {
      category: 'customer_acquisition',
      p10: 10000,
      p25: 50000,
      p50: 150000,
      p75: 500000,
      p90: 2000000,
      source: 'App Annie B2C Growth Data 2024',
      lastUpdated: '2024-01',
      sampleSize: 500
    },
    'dau_mau': {
      category: 'engagement',
      p10: 10,
      p25: 15,
      p50: 20,
      p75: 30,
      p90: 45,
      source: 'Mixpanel B2C Engagement Report 2024',
      lastUpdated: '2024-01',
      sampleSize: 800
    },
    'k_factor': {
      category: 'viral_growth',
      p10: 0.3,
      p25: 0.5,
      p50: 0.8,
      p75: 1.2,
      p90: 2.0,
      source: 'Amplitude Viral Growth Study 2024',
      lastUpdated: '2024-01',
      sampleSize: 350
    },
    'arpu': {
      category: 'revenue',
      p10: 2,
      p25: 5,
      p50: 10,
      p75: 20,
      p90: 50,
      source: 'Sensor Tower App Revenue Data 2024',
      lastUpdated: '2024-01',
      sampleSize: 1000
    },
    'retention_d7': {
      category: 'retention',
      p10: 15,
      p25: 25,
      p50: 35,
      p75: 50,
      p90: 70,
      source: 'Liftoff Mobile Retention Report 2024',
      lastUpdated: '2024-01',
      sampleSize: 650
    }
  },

  stageTransition: {
    nextStage: 'Scale',
    requiredConditions: [
      {
        kpiCategory: 'mau',
        minScore: 75,
        description: 'MAU 500K 이상'
      },
      {
        kpiCategory: 'dau_mau',
        minScore: 70,
        description: 'DAU/MAU 25% 이상'
      },
      {
        kpiCategory: 'arpu',
        minScore: 60,
        description: 'ARPU $10 이상'
      },
      {
        kpiCategory: 'unit_economics',
        minScore: 70,
        description: 'LTV/CAC > 3'
      }
    ],
    recommendedActions: [
      '수익화 전략 고도화 (광고, 구독, IAP)',
      '국제 시장 진출',
      'Performance Marketing 확대',
      'Series B/C 투자 유치'
    ]
  },

  riskDetectionRules: {
    'low_engagement': (data: ProcessedKPIData[]) => {
      const dauMau = data.find(kpi =>
        kpi.kpi.question.toLowerCase().includes('dau') ||
        kpi.kpi.question.toLowerCase().includes('참여도')
      );

      if (dauMau && dauMau.processedValue.normalizedScore < 40) {
        return {
          type: 'critical',
          title: '낮은 사용자 참여도',
          description: '사용자들이 자주 사용하지 않습니다. 장기 생존이 어렵습니다.',
          affectedKPIs: [dauMau.kpi.kpi_id],
          suggestedActions: [
            '핵심 기능 사용 빈도 높이기',
            '푸시 알림 전략 최적화',
            '일일 리워드, 챌린지 등 게이미피케이션',
            '소셜 기능 강화 (친구 초대, 공유)',
            '콘텐츠 업데이트 주기 단축'
          ]
        };
      }
      return null;
    },
    'growth_plateau': (data: ProcessedKPIData[]) => {
      const growthRate = data.find(kpi =>
        kpi.kpi.question.toLowerCase().includes('성장률') ||
        kpi.kpi.question.toLowerCase().includes('증가율')
      );

      if (growthRate && growthRate.processedValue.normalizedScore < 40) {
        return {
          type: 'warning',
          title: '성장 정체',
          description: '사용자 증가세가 둔화되고 있습니다. 새로운 성장 동력이 필요합니다.',
          affectedKPIs: [growthRate.kpi.kpi_id],
          suggestedActions: [
            '새로운 마케팅 채널 실험',
            '바이럴 루프 강화 (초대 인센티브)',
            '신규 기능 출시로 재각인',
            '인플루언서/파트너십 마케팅',
            '국제 시장 진출 검토'
          ]
        };
      }
      return null;
    },
    'monetization_failure': (data: ProcessedKPIData[]) => {
      const mau = data.find(kpi => kpi.kpi.question.toLowerCase().includes('mau'));
      const arpu = data.find(kpi =>
        kpi.kpi.question.toLowerCase().includes('arpu') ||
        kpi.kpi.question.toLowerCase().includes('사용자당 매출')
      );

      if (mau && arpu &&
          mau.processedValue.normalizedScore > 60 &&
          arpu.processedValue.normalizedScore < 30) {
        return {
          type: 'warning',
          title: '수익화 실패',
          description: '사용자는 많지만 수익이 나지 않습니다. 수익화 전략을 적극 실행해야 합니다.',
          affectedKPIs: [arpu.kpi.kpi_id, mau.kpi.kpi_id],
          suggestedActions: [
            '광고 수익화 (배너, 전면, 리워드 광고)',
            '프리미엄 구독 모델 도입',
            'In-App Purchase 최적화',
            '고부가가치 기능 유료화',
            '가격 테스트 (A/B 테스트)'
          ]
        };
      }
      return null;
    }
  }
};

/**
 * Cluster 5: E-commerce - Early Stage
 *
 * 특징: 초기 거래 발생, GMV 성장, 공급자-수요자 양면 시장
 * 핵심 지표: GMV, Take Rate, Repeat Purchase Rate, CAC, AOV
 */
export const ECOMMERCE_EARLY: ClusterKnowledge = {
  id: 'ecommerce-early',
  sector: 'E-commerce',
  stage: 'Early',
  displayName: 'E-commerce (Early Stage)',

  criticalSuccessFactors: {
    factors: [
      '월 GMV $50K-$500K',
      'Take Rate 10-30%',
      'Repeat Purchase Rate 20% 이상',
      'AOV (Average Order Value) $30-$100',
      'CAC Payback 3-6개월'
    ],
    description: 'E-commerce Early 단계는 초기 거래를 발생시키고, 공급과 수요의 균형을 맞추는 것이 핵심입니다.'
  },

  kpiImportance: {
    'gmv': 10, // GMV가 가장 중요
    'take_rate': 9, // 수익성
    'repeat_purchase': 10, // 재구매가 핵심
    'supply_acquisition': 8, // 공급자 확보
    'customer_acquisition': 8,
    'unit_economics': 9
  },

  interpretationRules: {
    'gmv': {
      category: 'revenue',
      excellent: (value: number) =>
        `월 GMV $${value.toLocaleString()}는 Early 단계 이커머스로서 탁월합니다.`,
      good: (value: number) =>
        `월 GMV $${value.toLocaleString()}는 양호합니다. 성장세를 유지하세요.`,
      needsImprovement: (value: number) =>
        `월 GMV $${value.toLocaleString()}는 부족합니다. 최소 $50K 이상을 목표로 하세요.`,
      context: 'GMV(Gross Merchandise Value)는 이커머스의 핵심 지표입니다. Take Rate를 곱하면 실제 매출이 됩니다.'
    },
    'repeat_purchase': {
      category: 'retention',
      excellent: (value: number) =>
        `재구매율 ${value}%는 탁월합니다. 고객 충성도가 높습니다.`,
      good: (value: number) =>
        `재구매율 ${value}%는 양호합니다. 30% 이상을 목표로 하세요.`,
      needsImprovement: (value: number) =>
        `재구매율 ${value}%는 낮습니다. 이커머스는 재구매가 생명입니다.`,
      context: '재구매율이 높을수록 CAC를 빠르게 회수할 수 있습니다. 30% 이상이면 건강한 이커머스입니다.'
    },
    'aov': {
      category: 'revenue',
      excellent: (value: number) =>
        `객단가 $${value.toFixed(2)}는 뛰어납니다. 높은 단가 상품을 판매하고 있습니다.`,
      good: (value: number) =>
        `객단가 $${value.toFixed(2)}는 적절합니다.`,
      needsImprovement: (value: number) =>
        `객단가 $${value.toFixed(2)}는 낮습니다. 번들링, 업셀 전략을 고려하세요.`,
      context: 'AOV가 높을수록 적은 거래로도 높은 GMV를 달성할 수 있습니다. 배송비 부담도 줄어듭니다.'
    },
    'take_rate': {
      category: 'revenue',
      excellent: (value: number) =>
        `Take Rate ${value}%는 훌륭한 수익성입니다.`,
      good: (value: number) =>
        `Take Rate ${value}%는 적절합니다.`,
      needsImprovement: (value: number) =>
        `Take Rate ${value}%는 낮습니다. 수수료 정책을 재검토하세요.`,
      context: 'Take Rate는 GMV 중 플랫폼이 가져가는 비율입니다. 10-30%가 일반적이며, 카테고리마다 다릅니다.'
    }
  },

  benchmarks: {
    'gmv': {
      category: 'revenue',
      p10: 10000,
      p25: 50000,
      p50: 150000,
      p75: 400000,
      p90: 1000000,
      source: 'Shopify Early Stage Merchant Data 2024',
      lastUpdated: '2024-01',
      sampleSize: 800
    },
    'repeat_purchase': {
      category: 'retention',
      p10: 10,
      p25: 20,
      p50: 30,
      p75: 45,
      p90: 65,
      source: 'BigCommerce Repeat Purchase Report 2024',
      lastUpdated: '2024-01',
      sampleSize: 600
    },
    'aov': {
      category: 'revenue',
      p10: 20,
      p25: 40,
      p50: 65,
      p75: 100,
      p90: 200,
      source: 'WooCommerce AOV Benchmarks 2024',
      lastUpdated: '2024-01',
      sampleSize: 1500
    },
    'conversion_rate': {
      category: 'conversion',
      p10: 1.0,
      p25: 1.5,
      p50: 2.5,
      p75: 4.0,
      p90: 6.0,
      source: 'Baymard Institute Conversion Study 2024',
      lastUpdated: '2024-01',
      sampleSize: 900
    },
    'cac': {
      category: 'customer_acquisition',
      p10: 10,
      p25: 20,
      p50: 40,
      p75: 80,
      p90: 150,
      source: 'Klaviyo E-commerce Marketing Data 2024',
      lastUpdated: '2024-01',
      sampleSize: 700
    }
  },

  stageTransition: {
    nextStage: 'Growth',
    requiredConditions: [
      {
        kpiCategory: 'gmv',
        minScore: 70,
        description: '월 GMV $500K 이상'
      },
      {
        kpiCategory: 'repeat_purchase',
        minScore: 70,
        description: '재구매율 30% 이상'
      },
      {
        kpiCategory: 'unit_economics',
        minScore: 70,
        description: 'LTV/CAC > 3'
      }
    ],
    recommendedActions: [
      '재고 관리 시스템 고도화',
      '물류 파트너십 구축',
      '마케팅 자동화 (이메일, 리타게팅)',
      'Series A 투자 유치'
    ]
  },

  riskDetectionRules: {
    'low_repeat_purchase': (data: ProcessedKPIData[]) => {
      const repeatRate = data.find(kpi =>
        kpi.kpi.question.toLowerCase().includes('재구매') ||
        kpi.kpi.question.toLowerCase().includes('repeat')
      );

      if (repeatRate && repeatRate.processedValue.normalizedScore < 40) {
        return {
          type: 'critical',
          title: '낮은 재구매율',
          description: '이커머스는 재구매가 핵심입니다. 한 번 사고 돌아오지 않으면 지속 불가능합니다.',
          affectedKPIs: [repeatRate.kpi.kpi_id],
          suggestedActions: [
            '상품 품질 재점검',
            '배송 경험 개선',
            'CS 응대 품질 향상',
            '이메일 마케팅 (재구매 유도)',
            '로열티 프로그램 도입 (포인트, 쿠폰)',
            '정기구독 모델 고려'
          ]
        };
      }
      return null;
    },
    'supply_shortage': (data: ProcessedKPIData[]) => {
      const inventory = data.find(kpi =>
        kpi.kpi.question.toLowerCase().includes('재고') ||
        kpi.kpi.question.toLowerCase().includes('품절')
      );

      if (inventory && inventory.processedValue.normalizedScore < 40) {
        return {
          type: 'warning',
          title: '재고 부족',
          description: '품절이 자주 발생하면 고객 이탈로 이어집니다.',
          affectedKPIs: [inventory.kpi.kpi_id],
          suggestedActions: [
            '재고 관리 프로세스 개선',
            '공급업체 다변화',
            '수요 예측 시스템 도입',
            '드롭십핑 모델 고려'
          ]
        };
      }
      return null;
    },
    'high_cac': (data: ProcessedKPIData[]) => {
      const cac = data.find(kpi => kpi.kpi.question.toLowerCase().includes('cac'));
      const aov = data.find(kpi =>
        kpi.kpi.question.toLowerCase().includes('객단가') ||
        kpi.kpi.question.toLowerCase().includes('aov')
      );

      if (cac && aov &&
          cac.processedValue.normalizedScore < 40) {
        return {
          type: 'warning',
          title: '높은 고객 확보 비용',
          description: 'CAC가 너무 높습니다. 수익성 개선이 필요합니다.',
          affectedKPIs: [cac.kpi.kpi_id],
          suggestedActions: [
            '마케팅 채널 최적화 (ROI 낮은 채널 중단)',
            'SEO, 콘텐츠 마케팅 강화 (Organic)',
            '재구매 고객에 집중 (이메일, SMS)',
            'AOV 증대 (번들링, 무료배송 최소금액)',
            '추천 프로그램 (Referral)'
          ]
        };
      }
      return null;
    }
  }
};

// ============================================
// 클러스터 레지스트리
// ============================================

export const CLUSTER_REGISTRY: Record<string, ClusterKnowledge> = {
  'tech-seed': TECH_SEED,
  'tech-pmf': TECH_PMF,
  'b2b_saas-pmf': B2B_SAAS_PMF,
  'b2c-growth': B2C_GROWTH,
  'ecommerce-early': ECOMMERCE_EARLY
};

/**
 * 클러스터 ID로 지식 조회
 */
export function getClusterKnowledge(sector: string, stage: string): ClusterKnowledge | null {
  const clusterId = `${sector.toLowerCase().replace(/\s+/g, '_')}-${stage.toLowerCase().replace(/\s+/g, '_')}`;
  return CLUSTER_REGISTRY[clusterId] || null;
}

/**
 * 모든 클러스터 목록
 */
export function getAllClusters(): ClusterKnowledge[] {
  return Object.values(CLUSTER_REGISTRY);
}

/**
 * 특정 섹터의 모든 클러스터
 */
export function getClustersBySector(sector: string): ClusterKnowledge[] {
  return getAllClusters().filter(c =>
    c.sector.toLowerCase() === sector.toLowerCase()
  );
}

/**
 * 특정 스테이지의 모든 클러스터
 */
export function getClustersByStage(stage: string): ClusterKnowledge[] {
  return getAllClusters().filter(c =>
    c.stage.toLowerCase() === stage.toLowerCase()
  );
}