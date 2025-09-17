import React, { createContext, useContext, useState, useEffect } from 'react';

// 업계 동향 타입 정의
export interface IndustryTrend {
  id: string;
  category: 'competitor' | 'investment' | 'regulation' | 'opportunity' | 'trend';
  title: string;
  summary: string;
  source: string;
  sourceUrl?: string;
  publishedAt: Date;
  relevanceScore: number; // 0-100
  impact: 'positive' | 'negative' | 'neutral';
  tags: string[];
  sector?: string; // S1-S5
  stage?: string; // A1-A5
  actionItems?: string[];
}

// 경쟁사 모니터링
export interface CompetitorUpdate {
  id: string;
  companyName: string;
  sector: string;
  stage: string;
  updateType: 'funding' | 'product' | 'partnership' | 'team' | 'pivot';
  title: string;
  details: string;
  amount?: number; // 투자금액
  date: Date;
  source: string;
  impact: 'high' | 'medium' | 'low';
}

// 투자 동향
export interface InvestmentTrend {
  id: string;
  investorName: string;
  investmentStage: string;
  sectors: string[];
  recentDeals: {
    company: string;
    amount: number;
    date: Date;
    stage: string;
  }[];
  preferences: string[];
  contactInfo?: {
    email?: string;
    linkedin?: string;
  };
}

interface IndustryIntelContextType {
  trends: IndustryTrend[];
  competitors: CompetitorUpdate[];
  investments: InvestmentTrend[];
  loading: boolean;
  error: string | null;
  refreshTrends: () => Promise<void>;
  filterTrendsBySector: (sector: string) => IndustryTrend[];
  getRelevantTrends: (limit?: number) => IndustryTrend[];
  getCompetitorUpdates: (sector: string, stage: string) => CompetitorUpdate[];
  getInvestmentOpportunities: (stage: string) => InvestmentTrend[];
}

const IndustryIntelContext = createContext<IndustryIntelContextType | undefined>(undefined);

export const useIndustryIntel = () => {
  const context = useContext(IndustryIntelContext);
  if (!context) {
    throw new Error('useIndustryIntel must be used within IndustryIntelProvider');
  }
  return context;
};

export const IndustryIntelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trends, setTrends] = useState<IndustryTrend[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorUpdate[]>([]);
  const [investments, setInvestments] = useState<InvestmentTrend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 샘플 데이터 생성 (추후 API 연동)
  useEffect(() => {
    loadSampleData();
  }, []);

  const loadSampleData = () => {
    // 샘플 트렌드 데이터
    const sampleTrends: IndustryTrend[] = [
      {
        id: '1',
        category: 'investment',
        title: 'AI 스타트업 투자 급증, 작년 대비 200% 증가',
        summary: '2024년 AI 분야 스타트업 투자가 급격히 증가하며, 특히 생성형 AI와 산업 특화 AI 솔루션에 집중',
        source: '벤처스퀘어',
        publishedAt: new Date('2024-01-10'),
        relevanceScore: 95,
        impact: 'positive',
        tags: ['AI', '투자', 'Series A'],
        sector: 'S4',
        stage: 'A-2',
        actionItems: [
          'AI 기술 도입 검토',
          '투자 유치 전략 수립',
          '경쟁사 분석 강화'
        ]
      },
      {
        id: '2',
        category: 'regulation',
        title: '정부, 스타트업 세제 혜택 확대 발표',
        summary: '벤처기업 법인세 감면 및 스톡옵션 비과세 한도 상향 조정',
        source: '중소벤처기업부',
        publishedAt: new Date('2024-01-08'),
        relevanceScore: 88,
        impact: 'positive',
        tags: ['정책', '세제혜택', '지원'],
        actionItems: [
          '세제 혜택 신청 검토',
          '스톡옵션 정책 재검토'
        ]
      },
      {
        id: '3',
        category: 'competitor',
        title: '경쟁사 A, Series B 100억원 투자 유치',
        summary: '같은 섹터 경쟁사가 대규모 투자 유치에 성공, 글로벌 확장 계획 발표',
        source: '스타트업 뉴스',
        publishedAt: new Date('2024-01-12'),
        relevanceScore: 92,
        impact: 'negative',
        tags: ['경쟁사', '투자', 'Series B'],
        sector: 'S4',
        stage: 'A-3',
        actionItems: [
          '차별화 전략 강화',
          '투자 유치 일정 가속화'
        ]
      }
    ];

    // 샘플 경쟁사 데이터
    const sampleCompetitors: CompetitorUpdate[] = [
      {
        id: 'c1',
        companyName: '테크스타트업 A',
        sector: 'S4',
        stage: 'A-3',
        updateType: 'funding',
        title: 'Series B 100억원 투자 유치',
        details: '기존 투자사 추가 투자 및 신규 VC 참여',
        amount: 10000000000,
        date: new Date('2024-01-12'),
        source: '공시',
        impact: 'high'
      },
      {
        id: 'c2',
        companyName: 'AI솔루션 B',
        sector: 'S4',
        stage: 'A-2',
        updateType: 'product',
        title: '신제품 출시 - AI 자동화 플랫폼',
        details: '중소기업 대상 AI 자동화 솔루션 출시',
        date: new Date('2024-01-10'),
        source: '보도자료',
        impact: 'medium'
      }
    ];

    // 샘플 투자 동향 데이터
    const sampleInvestments: InvestmentTrend[] = [
      {
        id: 'i1',
        investorName: '카카오벤처스',
        investmentStage: 'Series A',
        sectors: ['S4', 'S5'],
        recentDeals: [
          {
            company: 'AI 스타트업 X',
            amount: 5000000000,
            date: new Date('2024-01-05'),
            stage: 'Series A'
          }
        ],
        preferences: ['AI/ML', 'B2B SaaS', '플랫폼']
      },
      {
        id: 'i2',
        investorName: '소프트뱅크벤처스',
        investmentStage: 'Series A-B',
        sectors: ['S3', 'S4'],
        recentDeals: [
          {
            company: '모빌리티 Y',
            amount: 10000000000,
            date: new Date('2024-01-08'),
            stage: 'Series B'
          }
        ],
        preferences: ['딥테크', '모빌리티', 'AI']
      }
    ];

    setTrends(sampleTrends);
    setCompetitors(sampleCompetitors);
    setInvestments(sampleInvestments);
  };

  const refreshTrends = async () => {
    setLoading(true);
    try {
      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      loadSampleData();
    } catch (err) {
      setError('트렌드 데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const filterTrendsBySector = (sector: string): IndustryTrend[] => {
    return trends.filter(trend => trend.sector === sector);
  };

  const getRelevantTrends = (limit: number = 5): IndustryTrend[] => {
    return trends
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  };

  const getCompetitorUpdates = (sector: string, stage: string): CompetitorUpdate[] => {
    return competitors.filter(
      comp => comp.sector === sector &&
      (comp.stage === stage || comp.stage === `A-${parseInt(stage.split('-')[1]) + 1}`)
    );
  };

  const getInvestmentOpportunities = (stage: string): InvestmentTrend[] => {
    return investments.filter(inv =>
      inv.investmentStage.includes(stage.split('-')[1])
    );
  };

  const value: IndustryIntelContextType = {
    trends,
    competitors,
    investments,
    loading,
    error,
    refreshTrends,
    filterTrendsBySector,
    getRelevantTrends,
    getCompetitorUpdates,
    getInvestmentOpportunities
  };

  return (
    <IndustryIntelContext.Provider value={value}>
      {children}
    </IndustryIntelContext.Provider>
  );
};