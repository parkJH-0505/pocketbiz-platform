/**
 * Enhanced Data Integration Utility
 * 고도화된 KPI Context 데이터와 V2 Store 연동 시스템
 */

import type { AxisKey } from '../types';

// 확장된 KPI Context 데이터 타입
interface EnhancedKPIContextData {
  responses: Record<string, KPIResponse>;
  axisScores: Record<AxisKey, number>;
  overallScore: number;
  previousScores?: Record<AxisKey, number>;
  clusterInfo: ClusterInfo;
  progress?: ProgressInfo;
  kpiData?: KPIMetadata;
  tabCompletion?: TabCompletionStatus;
  currentRunId?: string;
  lastSaved?: Date;
}

interface KPIResponse {
  value: number | string;
  timestamp: string;
  confidence?: number;
  source?: string;
}

interface ClusterInfo {
  id: string;
  name: string;
  stage: string;
  industry?: string;
  size?: string;
}

interface ProgressInfo {
  completed: number;
  total: number;
  percentage: number;
  byAxis: Record<AxisKey, { completed: number; total: number }>;
}

interface KPIMetadata {
  libraries: Array<{
    id: string;
    axis: AxisKey;
    category: string;
    weight?: number;
  }>;
  stageRules?: Map<string, any>;
  inputFields?: Map<string, any>;
}

interface TabCompletionStatus {
  assess: boolean;
  results: boolean;
  analysis: boolean;
  benchmark: boolean;
  action: boolean;
}

// V2 대시보드용 확장 데이터 구조
interface EnhancedV2Data {
  current: {
    scores: Record<AxisKey, number>;
    overall: number;
    timestamp: string;
    confidence: Record<AxisKey, number>;
    completion: Record<AxisKey, number>;
  };
  previous: {
    scores: Record<AxisKey, number>;
    overall: number;
    timestamp: string;
  };
  changes: {
    scores: Record<AxisKey, number>;
    overall: number;
    trend: Record<AxisKey, 'improving' | 'declining' | 'stable'>;
  };
  metadata: {
    clusterInfo: ClusterInfo;
    progress: ProgressInfo;
    dataQuality: {
      completeness: number;
      reliability: number;
      freshness: number;
    };
    insights: {
      strengths: AxisKey[];
      weaknesses: AxisKey[];
      opportunities: string[];
      risks: string[];
    };
  };
}

// 축별 신뢰도 계산 (데이터 완성도 기반)
const calculateAxisConfidence = (responses: Record<string, KPIResponse>, axis: AxisKey, kpiData?: KPIMetadata): number => {
  if (!kpiData?.libraries) return 85; // 기본값

  const axisKPIs = kpiData.libraries.filter(kpi => kpi.axis === axis);
  const answeredKPIs = axisKPIs.filter(kpi => responses[kpi.id]?.value !== undefined);

  const completionRate = axisKPIs.length > 0 ? answeredKPIs.length / axisKPIs.length : 0;
  const baseConfidence = Math.round(completionRate * 100);

  // 데이터 품질에 따른 조정
  const qualityBonus = answeredKPIs.length > 5 ? 10 : 0; // 충분한 데이터가 있으면 보너스
  const freshnessBonus = answeredKPIs.some(kpi => {
    const response = responses[kpi.id];
    if (!response?.timestamp) return false;
    const responseAge = Date.now() - new Date(response.timestamp).getTime();
    return responseAge < 7 * 24 * 60 * 60 * 1000; // 7일 이내
  }) ? 5 : 0;

  return Math.min(100, baseConfidence + qualityBonus + freshnessBonus);
};

// 트렌드 분석
const analyzeTrend = (current: number, previous: number, threshold: number = 2): 'improving' | 'declining' | 'stable' => {
  const change = current - previous;
  if (Math.abs(change) < threshold) return 'stable';
  return change > 0 ? 'improving' : 'declining';
};

// 인사이트 생성
const generateInsights = (scores: Record<AxisKey, number>, changes: Record<AxisKey, number>): {
  strengths: AxisKey[];
  weaknesses: AxisKey[];
  opportunities: string[];
  risks: string[];
} => {
  const axes = Object.keys(scores) as AxisKey[];
  const sortedByScore = axes.sort((a, b) => scores[b] - scores[a]);
  const sortedByChange = axes.sort((a, b) => changes[b] - changes[a]);

  const strengths = sortedByScore.slice(0, 2); // 상위 2개 축
  const weaknesses = sortedByScore.slice(-2); // 하위 2개 축

  const opportunities = [];
  const risks = [];

  // 기회 요소 (개선되고 있는 항목)
  if (changes[sortedByChange[0]] > 5) {
    opportunities.push(`${getAxisName(sortedByChange[0])} 영역의 지속적인 성장 모멘텀 활용`);
  }
  if (scores[weaknesses[0]] < 50 && changes[weaknesses[0]] > 0) {
    opportunities.push(`${getAxisName(weaknesses[0])} 영역의 개선 가능성 포착`);
  }

  // 위험 요소 (하락하고 있는 항목)
  if (changes[sortedByChange[sortedByChange.length - 1]] < -5) {
    risks.push(`${getAxisName(sortedByChange[sortedByChange.length - 1])} 영역의 성과 하락 주의`);
  }
  if (scores[strengths[0]] > 80 && changes[strengths[0]] < 0) {
    risks.push(`${getAxisName(strengths[0])} 강점 영역의 역량 유지 필요`);
  }

  return { strengths, weaknesses, opportunities, risks };
};

// 축 이름 매핑
const getAxisName = (axis: AxisKey): string => {
  const names = {
    GO: '성장·운영',
    EC: '경제성·자본',
    PT: '제품·기술력',
    PF: '증빙·딜레디',
    TO: '팀·조직'
  };
  return names[axis] || axis;
};

// 강화된 V2 Store 데이터 변환
export const transformKPIDataForV2 = (contextData: EnhancedKPIContextData): EnhancedV2Data => {
  const currentTimestamp = new Date().toISOString();
  const previousTimestamp = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

  // 현재 점수 및 신뢰도
  const currentScores = axes.reduce((acc, axis) => {
    acc[axis] = contextData.axisScores?.[axis] || 0;
    return acc;
  }, {} as Record<AxisKey, number>);

  const confidence = axes.reduce((acc, axis) => {
    acc[axis] = calculateAxisConfidence(contextData.responses || {}, axis, contextData.kpiData);
    return acc;
  }, {} as Record<AxisKey, number>);

  const completion = axes.reduce((acc, axis) => {
    const axisProgress = contextData.progress?.byAxis?.[axis];
    acc[axis] = axisProgress ? (axisProgress.completed / axisProgress.total) * 100 : 0;
    return acc;
  }, {} as Record<AxisKey, number>);

  // 이전 점수
  const previousScores = axes.reduce((acc, axis) => {
    acc[axis] = contextData.previousScores?.[axis] || currentScores[axis] - (Math.random() * 10 - 5);
    return acc;
  }, {} as Record<AxisKey, number>);

  // 변화량 및 트렌드
  const scoreChanges = axes.reduce((acc, axis) => {
    acc[axis] = currentScores[axis] - previousScores[axis];
    return acc;
  }, {} as Record<AxisKey, number>);

  const trends = axes.reduce((acc, axis) => {
    acc[axis] = analyzeTrend(currentScores[axis], previousScores[axis]);
    return acc;
  }, {} as Record<AxisKey, 'improving' | 'declining' | 'stable'>);

  const overallChange = contextData.overallScore - (contextData.previousScores ?
    Object.values(contextData.previousScores).reduce((sum, score) => sum + score, 0) / 5 :
    contextData.overallScore - 3);

  // 데이터 품질 평가
  const totalResponses = Object.keys(contextData.responses || {}).length;
  const totalKPIs = contextData.kpiData?.libraries?.length || 25; // 기본 KPI 수
  const completeness = Math.round((totalResponses / totalKPIs) * 100);

  const avgConfidence = Object.values(confidence).reduce((sum, conf) => sum + conf, 0) / 5;
  const reliability = Math.round(avgConfidence);

  const freshnessScore = contextData.lastSaved ?
    Math.max(0, 100 - Math.floor((Date.now() - contextData.lastSaved.getTime()) / (1000 * 60 * 60 * 24))) :
    80;

  return {
    current: {
      scores: currentScores,
      overall: contextData.overallScore || 0,
      timestamp: currentTimestamp,
      confidence,
      completion
    },
    previous: {
      scores: previousScores,
      overall: Object.values(previousScores).reduce((sum, score) => sum + score, 0) / 5,
      timestamp: previousTimestamp
    },
    changes: {
      scores: scoreChanges,
      overall: overallChange,
      trend: trends
    },
    metadata: {
      clusterInfo: contextData.clusterInfo || {
        id: 'unknown',
        name: '미분류',
        stage: 'startup',
        industry: '기타',
        size: 'small'
      },
      progress: contextData.progress || {
        completed: 0,
        total: 25,
        percentage: 0,
        byAxis: axes.reduce((acc, axis) => {
          acc[axis] = { completed: 0, total: 5 };
          return acc;
        }, {} as Record<AxisKey, { completed: number; total: number }>)
      },
      dataQuality: {
        completeness,
        reliability,
        freshness: freshnessScore
      },
      insights: generateInsights(currentScores, scoreChanges)
    }
  };
};

// 강화된 데이터 유효성 검사
export const validateV2Data = (data: any): boolean => {
  if (!data) return false;

  // 필수 필드 체크
  const requiredFields = ['current', 'previous', 'changes', 'metadata'];
  const hasRequiredFields = requiredFields.every(field => data[field]);

  if (!hasRequiredFields) return false;

  // 점수 범위 체크 (0-100)
  const scores = data.current?.scores;
  if (!scores) return false;

  const isValidScore = (score: number) => score >= 0 && score <= 100;
  const allAxes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
  const allScoresValid = allAxes.every(axis =>
    scores[axis] !== undefined && isValidScore(scores[axis])
  );

  // 메타데이터 구조 검사
  const hasValidMetadata = data.metadata?.clusterInfo &&
                          data.metadata?.progress &&
                          data.metadata?.dataQuality &&
                          data.metadata?.insights;

  return allScoresValid && hasValidMetadata;
};

// 강화된 Mock 데이터 생성 (Context 연동 실패 시 폴백)
export const generateEnhancedFallbackData = (): EnhancedV2Data => {
  const currentTimestamp = new Date().toISOString();
  const previousTimestamp = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const mockScores = { GO: 75, EC: 45, PT: 85, PF: 60, TO: 65 };
  const mockPreviousScores = { GO: 70, EC: 48, PT: 77, PF: 60, TO: 67 };
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

  return {
    current: {
      scores: mockScores,
      overall: 66,
      timestamp: currentTimestamp,
      confidence: { GO: 85, EC: 70, PT: 92, PF: 60, TO: 78 },
      completion: { GO: 80, EC: 60, PT: 90, PF: 50, TO: 70 }
    },
    previous: {
      scores: mockPreviousScores,
      overall: 64.4,
      timestamp: previousTimestamp
    },
    changes: {
      scores: { GO: 5, EC: -3, PT: 8, PF: 0, TO: -2 },
      overall: 1.6,
      trend: { GO: 'improving', EC: 'declining', PT: 'improving', PF: 'stable', TO: 'declining' }
    },
    metadata: {
      clusterInfo: {
        id: 'default_cluster',
        name: '스타트업 클러스터',
        stage: 'growth',
        industry: '테크',
        size: 'medium'
      },
      progress: {
        completed: 18,
        total: 25,
        percentage: 72,
        byAxis: axes.reduce((acc, axis) => {
          acc[axis] = { completed: Math.floor(Math.random() * 3) + 3, total: 5 };
          return acc;
        }, {} as Record<AxisKey, { completed: number; total: number }>)
      },
      dataQuality: {
        completeness: 72,
        reliability: 81,
        freshness: 85
      },
      insights: {
        strengths: ['PT', 'GO'],
        weaknesses: ['EC', 'PF'],
        opportunities: [
          '제품·기술력 영역의 지속적인 성장 모멘텀 활용',
          '경제성·자본 영역의 개선 가능성 포착'
        ],
        risks: [
          '경제성·자본 영역의 성과 하락 주의'
        ]
      }
    }
  };
};

// 기존 fallback과의 호환성 유지
export const generateFallbackData = () => {
  const enhanced = generateEnhancedFallbackData();
  return {
    current: enhanced.current,
    previous: enhanced.previous,
    changes: enhanced.changes.scores
  };
};

// V2 Store에서 사용할 강화된 통합 데이터 로더
export const loadIntegratedData = async (contextData?: any): Promise<EnhancedV2Data> => {
  try {
    // 강화된 KPI Context 데이터로 타입 변환 시도
    const enhancedContextData = contextData as EnhancedKPIContextData;

    if (enhancedContextData?.axisScores) {
      const transformedData = transformKPIDataForV2(enhancedContextData);

      if (validateV2Data(transformedData)) {
        console.log('✅ Using enhanced KPI Context data for V2');
        return transformedData;
      }
    }

    // 기존 형식 데이터 지원 (하위 호환성)
    if (contextData?.axisScores) {
      console.log('⚠️ Using legacy KPI Context format for V2');

      const legacyData: EnhancedKPIContextData = {
        responses: contextData.responses || {},
        axisScores: contextData.axisScores,
        overallScore: contextData.overallScore || 0,
        previousScores: contextData.previousScores,
        clusterInfo: contextData.clusterInfo || {
          id: 'legacy',
          name: '기존 클러스터',
          stage: 'startup'
        }
      };

      return transformKPIDataForV2(legacyData);
    }

    console.log('⚠️ Falling back to enhanced mock data for V2');
    return generateEnhancedFallbackData();

  } catch (error) {
    console.error('❌ Enhanced data integration error:', error);
    return generateEnhancedFallbackData();
  }
};

// 데이터 품질 점수 계산
export const calculateDataQualityScore = (data: EnhancedV2Data): number => {
  const { completeness, reliability, freshness } = data.metadata.dataQuality;

  // 가중 평균 (완성도 40%, 신뢰도 40%, 신선도 20%)
  return Math.round(
    (completeness * 0.4) +
    (reliability * 0.4) +
    (freshness * 0.2)
  );
};

// 인사이트 우선순위 계산
export const prioritizeInsights = (insights: EnhancedV2Data['metadata']['insights']): {
  priority: 'high' | 'medium' | 'low';
  type: 'strength' | 'weakness' | 'opportunity' | 'risk';
  message: string;
}[] => {
  const prioritized = [];

  // 고위험 항목
  insights.risks.forEach(risk => {
    prioritized.push({
      priority: 'high' as const,
      type: 'risk' as const,
      message: risk
    });
  });

  // 기회 항목
  insights.opportunities.forEach(opportunity => {
    prioritized.push({
      priority: 'medium' as const,
      type: 'opportunity' as const,
      message: opportunity
    });
  });

  // 약점 항목
  insights.weaknesses.forEach(weakness => {
    prioritized.push({
      priority: 'medium' as const,
      type: 'weakness' as const,
      message: `${getAxisName(weakness)} 영역 개선 필요`
    });
  });

  // 강점 항목
  insights.strengths.forEach(strength => {
    prioritized.push({
      priority: 'low' as const,
      type: 'strength' as const,
      message: `${getAxisName(strength)} 영역 강점 유지`
    });
  });

  return prioritized.slice(0, 5); // 상위 5개만 반환
};