import React, { createContext, useContext, useState, useEffect } from 'react';
import { useKPIDiagnosis } from './KPIDiagnosisContext';
import { useCluster } from './ClusterContext';
import { useGrowthTracking } from './GrowthTrackingContext';
import type { AxisKey } from '../types';

// 추천 타입 정의
export type RecommendationType = 'action' | 'program' | 'buildup' | 'investment' | 'networking';
export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Recommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  reason: string;
  expectedImpact: {
    axis?: AxisKey;
    scoreIncrease?: number;
    timeframe?: string; // "1개월", "3개월" 등
  };
  actionUrl?: string;
  deadline?: Date;
  cost?: {
    amount?: number;
    time?: string; // "2주", "1개월" 등
  };
  tags: string[];
  matchScore: number; // 0-100
}

export interface PersonalizedInsight {
  id: string;
  type: 'strength' | 'weakness' | 'opportunity' | 'threat';
  title: string;
  description: string;
  data: any;
  actionItems: string[];
}

interface RecommendationContextType {
  recommendations: Recommendation[];
  insights: PersonalizedInsight[];
  loading: boolean;

  // 필터링 메서드
  getTopRecommendations: (limit?: number) => Recommendation[];
  filterByType: (type: RecommendationType) => Recommendation[];
  filterByPriority: (priority: RecommendationPriority) => Recommendation[];

  // 액션 메서드
  refreshRecommendations: () => Promise<void>;
  dismissRecommendation: (id: string) => void;
  markAsCompleted: (id: string) => void;

  // 개인화 설정
  preferences: UserPreferences;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
}

export interface UserPreferences {
  focusAreas: AxisKey[];
  excludedTypes: RecommendationType[];
  budgetLimit?: number;
  timeAvailable: 'low' | 'medium' | 'high';
  goals: string[];
}

const RecommendationContext = createContext<RecommendationContextType | undefined>(undefined);

export const useRecommendation = () => {
  const context = useContext(RecommendationContext);
  if (!context) {
    throw new Error('useRecommendation must be used within RecommendationProvider');
  }
  return context;
};

export const RecommendationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { overallScore, axisScores } = useKPIDiagnosis();
  const { cluster } = useCluster();
  const { improvementAreas, goals } = useGrowthTracking();

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [insights, setInsights] = useState<PersonalizedInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    focusAreas: [],
    excludedTypes: [],
    timeAvailable: 'medium',
    goals: [],
  });

  // 추천 생성 로직
  useEffect(() => {
    generateRecommendations();
    generateInsights();
  }, [overallScore, axisScores, cluster, improvementAreas, goals]);

  const generateRecommendations = () => {
    const newRecommendations: Recommendation[] = [];

    // 1. 가장 낮은 축 개선 추천
    improvementAreas.forEach((area, index) => {
      if (area.gap > 10) {
        newRecommendations.push({
          id: `rec-axis-${area.axis}`,
          type: 'buildup',
          priority: index === 0 ? 'critical' : 'high',
          title: `${area.axis} 축 개선 프로그램`,
          description: `${area.axis} 점수를 ${area.gap.toFixed(1)}점 향상시켜 평균 수준 도달`,
          reason: `현재 ${area.axis} 점수가 피어 평균보다 ${area.gap.toFixed(1)}점 낮습니다`,
          expectedImpact: {
            axis: area.axis,
            scoreIncrease: area.gap,
            timeframe: '2개월',
          },
          actionUrl: `/startup/buildup/catalog?axis=${area.axis}`,
          tags: [area.axis, '개선필요', '빌드업'],
          matchScore: 85 + (index === 0 ? 10 : 5),
        });
      }
    });

    // 2. 단계 진입 프로그램 추천
    if (overallScore >= 70 && overallScore < 80) {
      newRecommendations.push({
        id: 'rec-stage-a3',
        type: 'program',
        priority: 'high',
        title: 'Series A 준비 프로그램',
        description: 'A-3 단계 진입을 위한 종합 준비 프로그램',
        reason: '현재 점수로 Series A 단계 진입이 가능합니다',
        expectedImpact: {
          scoreIncrease: 10,
          timeframe: '3개월',
        },
        actionUrl: '/startup/matches',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cost: {
          amount: 5000000,
          time: '3개월',
        },
        tags: ['Series A', '투자', '성장'],
        matchScore: 92,
      });
    }

    // 3. 투자 매칭 추천
    if (cluster.stage === 'A-2' || cluster.stage === 'A-3') {
      newRecommendations.push({
        id: 'rec-investment',
        type: 'investment',
        priority: 'medium',
        title: '맞춤형 VC 매칭',
        description: `${cluster.sector} 섹터 ${cluster.stage} 단계 특화 투자사 연결`,
        reason: '현재 단계에서 투자 유치 가능성이 높습니다',
        expectedImpact: {
          timeframe: '6개월',
        },
        actionUrl: '/startup/matches?type=investment',
        tags: ['투자', 'VC', cluster.sector],
        matchScore: 78,
      });
    }

    // 4. 네트워킹 추천
    newRecommendations.push({
      id: 'rec-network',
      type: 'networking',
      priority: 'low',
      title: '동종업계 CEO 모임',
      description: `${cluster.sector} 섹터 스타트업 대표 정기 모임`,
      reason: '네트워킹을 통한 인사이트 공유 및 협업 기회',
      expectedImpact: {
        timeframe: '즉시',
      },
      actionUrl: '/startup/networking',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      tags: ['네트워킹', 'CEO', cluster.sector],
      matchScore: 65,
    });

    // 5. 긴급 액션 추천
    if (axisScores.EC && axisScores.EC < 60) {
      newRecommendations.push({
        id: 'rec-urgent-ec',
        type: 'action',
        priority: 'critical',
        title: '재무 구조 긴급 개선',
        description: '런웨이 연장 및 비용 구조 최적화',
        reason: 'EC (경제성) 점수가 위험 수준입니다',
        expectedImpact: {
          axis: 'EC',
          scoreIncrease: 15,
          timeframe: '1개월',
        },
        actionUrl: '/startup/buildup/catalog?category=finance',
        tags: ['긴급', '재무', 'EC'],
        matchScore: 95,
      });
    }

    // 사용자 선호도 기반 필터링 및 정렬
    const filteredRecommendations = newRecommendations
      .filter(rec => !preferences.excludedTypes.includes(rec.type))
      .sort((a, b) => {
        // 우선순위 점수
        const priorityScore = {
          critical: 4,
          high: 3,
          medium: 2,
          low: 1,
        };

        // 선호 영역 가중치
        const aPreferred = rec => rec.expectedImpact?.axis &&
          preferences.focusAreas.includes(rec.expectedImpact.axis) ? 10 : 0;

        const aScore = priorityScore[a.priority] + a.matchScore / 25 + aPreferred(a);
        const bScore = priorityScore[b.priority] + b.matchScore / 25 + aPreferred(b);

        return bScore - aScore;
      });

    setRecommendations(filteredRecommendations);
  };

  const generateInsights = () => {
    const newInsights: PersonalizedInsight[] = [];

    // 강점 분석
    const strongAxes = Object.entries(axisScores)
      .filter(([_, score]) => score > 80)
      .map(([axis]) => axis as AxisKey);

    if (strongAxes.length > 0) {
      newInsights.push({
        id: 'insight-strength',
        type: 'strength',
        title: '핵심 강점 영역',
        description: `${strongAxes.join(', ')} 축에서 우수한 성과를 보이고 있습니다`,
        data: strongAxes,
        actionItems: [
          '강점을 활용한 차별화 전략 수립',
          '관련 분야 확장 검토',
        ],
      });
    }

    // 약점 분석
    const weakAxes = Object.entries(axisScores)
      .filter(([_, score]) => score < 65)
      .map(([axis]) => axis as AxisKey);

    if (weakAxes.length > 0) {
      newInsights.push({
        id: 'insight-weakness',
        type: 'weakness',
        title: '개선 필요 영역',
        description: `${weakAxes.join(', ')} 축에서 보완이 필요합니다`,
        data: weakAxes,
        actionItems: [
          '집중 개선 계획 수립',
          '외부 전문가 자문 검토',
        ],
      });
    }

    // 기회 분석
    if (overallScore >= 75 && cluster.stage !== 'A-5') {
      newInsights.push({
        id: 'insight-opportunity',
        type: 'opportunity',
        title: '단계 상승 기회',
        description: '다음 단계 진입 조건에 근접했습니다',
        data: { currentScore: overallScore, targetScore: 85 },
        actionItems: [
          '단계 진입 요건 확인',
          '필요 서류 준비',
          '멘토링 신청',
        ],
      });
    }

    // 위협 분석
    if (improvementAreas.some(area => area.trend === 'declining')) {
      newInsights.push({
        id: 'insight-threat',
        type: 'threat',
        title: '하락 추세 감지',
        description: '일부 지표가 하락 추세를 보이고 있습니다',
        data: improvementAreas.filter(area => area.trend === 'declining'),
        actionItems: [
          '하락 원인 분석',
          '긴급 대응 계획 수립',
        ],
      });
    }

    setInsights(newInsights);
  };

  const refreshRecommendations = async () => {
    setLoading(true);
    try {
      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      generateRecommendations();
      generateInsights();
    } finally {
      setLoading(false);
    }
  };

  const getTopRecommendations = (limit: number = 5): Recommendation[] => {
    return recommendations.slice(0, limit);
  };

  const filterByType = (type: RecommendationType): Recommendation[] => {
    return recommendations.filter(rec => rec.type === type);
  };

  const filterByPriority = (priority: RecommendationPriority): Recommendation[] => {
    return recommendations.filter(rec => rec.priority === priority);
  };

  const dismissRecommendation = (id: string) => {
    setRecommendations(prev => prev.filter(rec => rec.id !== id));
  };

  const markAsCompleted = (id: string) => {
    // 완료 처리 로직 (추후 구현)
    dismissRecommendation(id);
  };

  const updatePreferences = (prefs: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...prefs }));
  };

  const value: RecommendationContextType = {
    recommendations,
    insights,
    loading,
    getTopRecommendations,
    filterByType,
    filterByPriority,
    refreshRecommendations,
    dismissRecommendation,
    markAsCompleted,
    preferences,
    updatePreferences,
  };

  return (
    <RecommendationContext.Provider value={value}>
      {children}
    </RecommendationContext.Provider>
  );
};