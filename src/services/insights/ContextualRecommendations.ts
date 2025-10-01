/**
 * Contextual Recommendations System
 * 맥락 기반 추천 시스템
 */

import { ProcessedKPIData, AxisKey } from '@/types/reportV3.types';
import { AdvancedInsight, InsightPriority } from './AdvancedInsightGenerator';

/**
 * 추천 카테고리
 */
export enum RecommendationCategory {
  QUICK_WIN = 'quick_win',           // 빠른 성과
  STRATEGIC = 'strategic',           // 전략적 개선
  OPERATIONAL = 'operational',       // 운영 효율화
  INNOVATION = 'innovation',         // 혁신 기회
  RISK_MITIGATION = 'risk_mitigation', // 리스크 완화
  GROWTH = 'growth',                 // 성장 기회
  COST_SAVING = 'cost_saving'       // 비용 절감
}

/**
 * 추천 실행 난이도
 */
export enum ImplementationDifficulty {
  EASY = 'easy',
  MODERATE = 'moderate',
  HARD = 'hard',
  VERY_HARD = 'very_hard'
}

/**
 * 맥락적 추천 인터페이스
 */
export interface ContextualRecommendation {
  id: string;
  category: RecommendationCategory;
  title: string;
  description: string;
  rationale: string;
  expectedImpact: {
    description: string;
    metrics: Array<{
      kpi: string;
      currentValue: number;
      targetValue: number;
      improvement: string;
    }>;
    timeToImpact: string;
  };
  implementation: {
    difficulty: ImplementationDifficulty;
    steps: string[];
    resources: string[];
    estimatedTime: string;
    estimatedCost?: string;
  };
  risks: Array<{
    description: string;
    mitigation: string;
  }>;
  dependencies: string[];
  priority: InsightPriority;
  confidence: number;
  context: {
    industry?: string;
    companySize?: string;
    stage?: string;
    currentPerformance: string;
  };
  successCriteria: string[];
  relatedInsights: string[];
  tags: string[];
}

/**
 * 업계별 추천 템플릿
 */
interface IndustryTemplate {
  industry: string;
  recommendations: Partial<ContextualRecommendation>[];
  benchmarks: Record<string, number>;
}

/**
 * 맥락적 추천 생성기
 */
export class ContextualRecommendationEngine {
  private recommendations: Map<string, ContextualRecommendation>;
  private industryTemplates: Map<string, IndustryTemplate>;

  constructor() {
    this.recommendations = new Map();
    this.industryTemplates = this.initializeIndustryTemplates();
  }

  /**
   * 업계별 템플릿 초기화
   */
  private initializeIndustryTemplates(): Map<string, IndustryTemplate> {
    const templates = new Map<string, IndustryTemplate>();

    // IT/스타트업 템플릿
    templates.set('startup', {
      industry: 'startup',
      benchmarks: {
        GO: 65, EC: 70, PT: 60, PF: 75, TO: 70
      },
      recommendations: [
        {
          category: RecommendationCategory.GROWTH,
          title: '프로덕트-마켓 핏 최적화',
          description: '고객 피드백 기반 제품 개선 사이클 단축',
          implementation: {
            difficulty: ImplementationDifficulty.MODERATE,
            steps: [
              '주간 고객 인터뷰 프로세스 구축',
              '피드백 우선순위 매트릭스 도입',
              '2주 스프린트 사이클 적용'
            ],
            resources: ['프로덕트 매니저', 'UX 리서처', '개발팀'],
            estimatedTime: '2개월'
          }
        },
        {
          category: RecommendationCategory.QUICK_WIN,
          title: 'MVP 기능 우선순위 재정렬',
          description: '핵심 기능에 집중하여 출시 속도 향상',
          implementation: {
            difficulty: ImplementationDifficulty.EASY,
            steps: [
              'RICE 스코어링 적용',
              '비핵심 기능 백로그 이동',
              '릴리즈 계획 재수립'
            ],
            resources: ['프로덕트 팀'],
            estimatedTime: '1주'
          }
        }
      ]
    });

    // 제조업 템플릿
    templates.set('manufacturing', {
      industry: 'manufacturing',
      benchmarks: {
        GO: 70, EC: 75, PT: 80, PF: 70, TO: 75
      },
      recommendations: [
        {
          category: RecommendationCategory.OPERATIONAL,
          title: '생산 라인 효율성 개선',
          description: '병목 구간 해소 및 자동화 확대',
          implementation: {
            difficulty: ImplementationDifficulty.HARD,
            steps: [
              '병목 구간 데이터 분석',
              '자동화 ROI 계산',
              '단계적 자동화 도입'
            ],
            resources: ['생산관리팀', '엔지니어링팀', '외부 컨설턴트'],
            estimatedTime: '6개월'
          }
        }
      ]
    });

    // 서비스업 템플릿
    templates.set('service', {
      industry: 'service',
      benchmarks: {
        GO: 75, EC: 65, PT: 70, PF: 70, TO: 80
      },
      recommendations: [
        {
          category: RecommendationCategory.QUICK_WIN,
          title: '고객 응대 프로세스 표준화',
          description: '서비스 품질 일관성 확보',
          implementation: {
            difficulty: ImplementationDifficulty.EASY,
            steps: [
              '표준 응대 매뉴얼 작성',
              '직원 교육 실시',
              '품질 모니터링 체계 구축'
            ],
            resources: ['CS팀', '교육팀'],
            estimatedTime: '1개월'
          }
        }
      ]
    });

    return templates;
  }

  /**
   * 맥락적 추천 생성
   */
  async generateRecommendations(
    data: ProcessedKPIData[],
    insights: AdvancedInsight[],
    context: {
      industry?: string;
      companySize?: string;
      stage?: string;
      budget?: string;
    }
  ): Promise<ContextualRecommendation[]> {
    const recommendations: ContextualRecommendation[] = [];

    // 1. 성과 수준 분석
    const performanceLevel = this.analyzePerformanceLevel(data);

    // 2. 개선 기회 식별
    const opportunities = this.identifyOpportunities(data, insights);

    // 3. 업계별 맥락 적용
    if (context.industry && this.industryTemplates.has(context.industry)) {
      const template = this.industryTemplates.get(context.industry)!;
      const industryRecs = this.applyIndustryContext(
        template,
        data,
        performanceLevel
      );
      recommendations.push(...industryRecs);
    }

    // 4. Quick Wins 추천
    const quickWins = this.generateQuickWins(opportunities, context);
    recommendations.push(...quickWins);

    // 5. 전략적 추천
    const strategic = this.generateStrategicRecommendations(
      data,
      insights,
      context
    );
    recommendations.push(...strategic);

    // 6. 리스크 완화 추천
    const riskMitigation = this.generateRiskMitigations(insights);
    recommendations.push(...riskMitigation);

    // 7. 우선순위화 및 필터링
    const prioritized = this.prioritizeRecommendations(
      recommendations,
      context
    );

    // 8. 품질 검증
    const validated = prioritized.filter(rec =>
      this.validateRecommendation(rec, data)
    );

    return validated.slice(0, 10); // 상위 10개 추천
  }

  /**
   * 성과 수준 분석
   */
  private analyzePerformanceLevel(data: ProcessedKPIData[]): string {
    const avgScore = data.reduce((acc, d) => acc + (d.score || 0), 0) / data.length;

    if (avgScore >= 80) return 'excellent';
    if (avgScore >= 60) return 'good';
    if (avgScore >= 40) return 'fair';
    return 'poor';
  }

  /**
   * 개선 기회 식별
   */
  private identifyOpportunities(
    data: ProcessedKPIData[],
    insights: AdvancedInsight[]
  ): Array<{
    area: string;
    gap: number;
    potential: number;
    difficulty: ImplementationDifficulty;
  }> {
    const opportunities: Array<{
      area: string;
      gap: number;
      potential: number;
      difficulty: ImplementationDifficulty;
    }> = [];

    // 축별 기회 분석
    const axisSummary = new Map<string, { score: number; count: number }>();
    data.forEach(d => {
      if (!axisSummary.has(d.axis)) {
        axisSummary.set(d.axis, { score: 0, count: 0 });
      }
      const summary = axisSummary.get(d.axis)!;
      summary.score += d.score || 0;
      summary.count++;
    });

    axisSummary.forEach((summary, axis) => {
      const avgScore = summary.score / summary.count;
      const gap = 100 - avgScore;

      if (gap > 20) {
        opportunities.push({
          area: axis,
          gap,
          potential: gap * 0.7, // 실현 가능한 개선 잠재력
          difficulty: gap > 50
            ? ImplementationDifficulty.HARD
            : gap > 30
            ? ImplementationDifficulty.MODERATE
            : ImplementationDifficulty.EASY
        });
      }
    });

    return opportunities.sort((a, b) => b.potential - a.potential);
  }

  /**
   * Quick Win 추천 생성
   */
  private generateQuickWins(
    opportunities: Array<{
      area: string;
      gap: number;
      potential: number;
      difficulty: ImplementationDifficulty;
    }>,
    context: any
  ): ContextualRecommendation[] {
    const quickWins: ContextualRecommendation[] = [];

    opportunities
      .filter(opp => opp.difficulty === ImplementationDifficulty.EASY)
      .slice(0, 3)
      .forEach(opp => {
        quickWins.push({
          id: this.generateRecommendationId(),
          category: RecommendationCategory.QUICK_WIN,
          title: `${opp.area} 영역 즉시 개선 가능 항목`,
          description: `최소한의 노력으로 ${opp.potential.toFixed(0)}% 개선 가능`,
          rationale: '낮은 난이도와 높은 효과로 빠른 성과 창출 가능',
          expectedImpact: {
            description: `${opp.area} 점수 ${opp.potential.toFixed(0)}% 향상`,
            metrics: [{
              kpi: opp.area,
              currentValue: 100 - opp.gap,
              targetValue: 100 - opp.gap + opp.potential,
              improvement: `+${opp.potential.toFixed(0)}%`
            }],
            timeToImpact: '2-4주'
          },
          implementation: {
            difficulty: ImplementationDifficulty.EASY,
            steps: this.generateQuickWinSteps(opp.area),
            resources: ['기존 팀원'],
            estimatedTime: '2주'
          },
          risks: [],
          dependencies: [],
          priority: InsightPriority.HIGH,
          confidence: 0.85,
          context: {
            ...context,
            currentPerformance: `${opp.area} 현재 ${(100 - opp.gap).toFixed(0)}점`
          },
          successCriteria: [
            `${opp.area} KPI 점수 10% 이상 향상`,
            '실행 계획 100% 완료'
          ],
          relatedInsights: [],
          tags: ['quick-win', opp.area.toLowerCase()]
        });
      });

    return quickWins;
  }

  /**
   * 전략적 추천 생성
   */
  private generateStrategicRecommendations(
    data: ProcessedKPIData[],
    insights: AdvancedInsight[],
    context: any
  ): ContextualRecommendation[] {
    const recommendations: ContextualRecommendation[] = [];

    // 가장 중요한 인사이트 기반 전략적 추천
    const criticalInsights = insights.filter(
      i => i.priority === InsightPriority.CRITICAL || i.priority === InsightPriority.HIGH
    );

    criticalInsights.slice(0, 2).forEach(insight => {
      recommendations.push({
        id: this.generateRecommendationId(),
        category: RecommendationCategory.STRATEGIC,
        title: `전략적 대응: ${insight.title}`,
        description: insight.description,
        rationale: insight.impact,
        expectedImpact: {
          description: '전사적 성과 개선 및 경쟁력 강화',
          metrics: insight.relatedKPIs.map(kpi => ({
            kpi,
            currentValue: 60, // 예시값
            targetValue: 80,
            improvement: '+33%'
          })),
          timeToImpact: '3-6개월'
        },
        implementation: {
          difficulty: ImplementationDifficulty.HARD,
          steps: insight.suggestedActions,
          resources: ['경영진', '전략기획팀', '실행 TF'],
          estimatedTime: '6개월',
          estimatedCost: '중간-높음'
        },
        risks: [
          {
            description: '조직 저항 가능성',
            mitigation: '단계적 변화관리 프로그램 운영'
          },
          {
            description: '예산 초과 위험',
            mitigation: '마일스톤별 예산 검토 및 조정'
          }
        ],
        dependencies: ['경영진 승인', '예산 확보', '인력 재배치'],
        priority: insight.priority,
        confidence: insight.confidence,
        context: {
          ...context,
          currentPerformance: this.analyzePerformanceLevel(data)
        },
        successCriteria: [
          'KPI 목표 달성률 80% 이상',
          'ROI 150% 이상',
          '이해관계자 만족도 4.0/5.0 이상'
        ],
        relatedInsights: [insight.id],
        tags: ['strategic', 'long-term', 'high-impact']
      });
    });

    return recommendations;
  }

  /**
   * 리스크 완화 추천
   */
  private generateRiskMitigations(
    insights: AdvancedInsight[]
  ): ContextualRecommendation[] {
    const recommendations: ContextualRecommendation[] = [];

    const threatInsights = insights.filter(i => i.type === 'threat');

    threatInsights.forEach(threat => {
      recommendations.push({
        id: this.generateRecommendationId(),
        category: RecommendationCategory.RISK_MITIGATION,
        title: `리스크 대응: ${threat.title}`,
        description: `${threat.description} 이에 대한 선제적 대응 필요`,
        rationale: '잠재적 손실 방지 및 안정성 확보',
        expectedImpact: {
          description: '리스크 발생 확률 50% 감소',
          metrics: [],
          timeToImpact: '즉시'
        },
        implementation: {
          difficulty: ImplementationDifficulty.MODERATE,
          steps: threat.suggestedActions,
          resources: ['리스크 관리팀', '관련 부서'],
          estimatedTime: '1개월'
        },
        risks: [],
        dependencies: [],
        priority: InsightPriority.HIGH,
        confidence: threat.confidence,
        context: {
          currentPerformance: 'risk-identified'
        },
        successCriteria: [
          '리스크 지표 정상 범위 유지',
          '조기 경보 시스템 구축'
        ],
        relatedInsights: [threat.id],
        tags: ['risk', 'mitigation', 'preventive']
      });
    });

    return recommendations;
  }

  /**
   * 업계 맥락 적용
   */
  private applyIndustryContext(
    template: IndustryTemplate,
    data: ProcessedKPIData[],
    performanceLevel: string
  ): ContextualRecommendation[] {
    const recommendations: ContextualRecommendation[] = [];

    template.recommendations.forEach(templateRec => {
      const fullRec: ContextualRecommendation = {
        id: this.generateRecommendationId(),
        category: templateRec.category || RecommendationCategory.STRATEGIC,
        title: templateRec.title || '',
        description: templateRec.description || '',
        rationale: `${template.industry} 업계 베스트 프랙티스 기반`,
        expectedImpact: templateRec.expectedImpact || {
          description: '업계 평균 수준 달성',
          metrics: [],
          timeToImpact: '3개월'
        },
        implementation: templateRec.implementation || {
          difficulty: ImplementationDifficulty.MODERATE,
          steps: [],
          resources: [],
          estimatedTime: '3개월'
        },
        risks: [],
        dependencies: [],
        priority: performanceLevel === 'poor'
          ? InsightPriority.HIGH
          : InsightPriority.MEDIUM,
        confidence: 0.75,
        context: {
          industry: template.industry,
          currentPerformance: performanceLevel
        },
        successCriteria: ['업계 벤치마크 달성'],
        relatedInsights: [],
        tags: [template.industry, 'industry-specific'],
        ...templateRec
      };

      recommendations.push(fullRec);
    });

    return recommendations;
  }

  /**
   * 추천 우선순위화
   */
  private prioritizeRecommendations(
    recommendations: ContextualRecommendation[],
    context: any
  ): ContextualRecommendation[] {
    return recommendations.sort((a, b) => {
      // 우선순위 점수 계산
      const scoreA = this.calculatePriorityScore(a, context);
      const scoreB = this.calculatePriorityScore(b, context);
      return scoreB - scoreA;
    });
  }

  /**
   * 우선순위 점수 계산
   */
  private calculatePriorityScore(
    rec: ContextualRecommendation,
    context: any
  ): number {
    let score = 0;

    // Priority 가중치
    const priorityWeights = {
      [InsightPriority.CRITICAL]: 40,
      [InsightPriority.HIGH]: 30,
      [InsightPriority.MEDIUM]: 20,
      [InsightPriority.LOW]: 10
    };
    score += priorityWeights[rec.priority];

    // 난이도 가중치 (쉬운 것 우선)
    const difficultyWeights = {
      [ImplementationDifficulty.EASY]: 30,
      [ImplementationDifficulty.MODERATE]: 20,
      [ImplementationDifficulty.HARD]: 10,
      [ImplementationDifficulty.VERY_HARD]: 5
    };
    score += difficultyWeights[rec.implementation.difficulty];

    // Quick Win 보너스
    if (rec.category === RecommendationCategory.QUICK_WIN) {
      score += 20;
    }

    // 신뢰도 가중치
    score += rec.confidence * 20;

    // 맥락 일치도
    if (context.stage === 'early' && rec.category === RecommendationCategory.GROWTH) {
      score += 15;
    }
    if (context.budget === 'limited' && !rec.implementation.estimatedCost) {
      score += 10;
    }

    return score;
  }

  /**
   * 추천 검증
   */
  private validateRecommendation(
    rec: ContextualRecommendation,
    data: ProcessedKPIData[]
  ): boolean {
    // 기본 검증
    if (!rec.title || !rec.description) return false;
    if (!rec.implementation.steps || rec.implementation.steps.length === 0) return false;
    if (rec.confidence < 0.5) return false;

    // 데이터 일관성 검증
    if (rec.expectedImpact.metrics.length > 0) {
      const hasValidMetrics = rec.expectedImpact.metrics.every(
        m => m.currentValue <= m.targetValue
      );
      if (!hasValidMetrics) return false;
    }

    return true;
  }

  /**
   * Quick Win 단계 생성
   */
  private generateQuickWinSteps(area: string): string[] {
    const stepTemplates: Record<string, string[]> = {
      GO: [
        '현재 목표 설정 프로세스 검토',
        'SMART 목표 재정의',
        '주간 진행상황 체크인 도입'
      ],
      EC: [
        '고객 피드백 수집 채널 확대',
        'NPS 조사 실시',
        '개선사항 우선순위 결정'
      ],
      PT: [
        '핵심 프로세스 매핑',
        '병목구간 식별 및 개선',
        '자동화 가능 영역 검토'
      ],
      PF: [
        '핵심 성과지표 재정의',
        '대시보드 구축',
        '주간 성과 리뷰 미팅'
      ],
      TO: [
        '팀 역량 평가',
        '교육 프로그램 설계',
        '멘토링 시스템 도입'
      ]
    };

    return stepTemplates[area] || [
      '현황 분석',
      '개선 계획 수립',
      '실행 및 모니터링'
    ];
  }

  /**
   * 유틸리티 함수
   */
  private generateRecommendationId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 싱글톤 인스턴스
let engineInstance: ContextualRecommendationEngine | null = null;

export function getRecommendationEngine(): ContextualRecommendationEngine {
  if (!engineInstance) {
    engineInstance = new ContextualRecommendationEngine();
  }
  return engineInstance;
}