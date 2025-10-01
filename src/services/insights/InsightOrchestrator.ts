/**
 * Insight Orchestrator
 * 통합 인사이트 오케스트레이터 - 모든 인사이트 서비스 조율
 */

import { ProcessedKPIData, AxisKey } from '@/types/reportV3.types';
import {
  AdvancedInsightGenerator,
  AdvancedInsight,
  InsightPriority,
  getAdvancedInsightGenerator
} from './AdvancedInsightGenerator';
import {
  ContextualRecommendationEngine,
  ContextualRecommendation,
  getRecommendationEngine
} from './ContextualRecommendations';
import {
  IndustryBenchmarkService,
  BenchmarkComparison,
  Industry,
  CompanySize,
  GrowthStage,
  getBenchmarkService
} from './IndustryBenchmarkService';
import { getCacheManager } from '@/utils/cacheManager';

/**
 * 통합 인사이트 결과
 */
export interface IntegratedInsights {
  insights: AdvancedInsight[];
  recommendations: ContextualRecommendation[];
  benchmarks: BenchmarkComparison[];
  actionPlan: ActionPlan;
  qualityScore: QualityAssessment;
  summary: InsightSummary;
}

/**
 * 액션 플랜
 */
export interface ActionPlan {
  immediate: ActionItem[];  // 즉시 실행
  shortTerm: ActionItem[];  // 1-3개월
  mediumTerm: ActionItem[]; // 3-6개월
  longTerm: ActionItem[];   // 6개월 이상
  totalEstimatedImpact: string;
  resourceRequirements: string[];
}

/**
 * 액션 아이템
 */
export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: InsightPriority;
  owner?: string;
  deadline?: Date;
  kpis: string[];
  expectedOutcome: string;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed';
  trackingMetrics: Array<{
    metric: string;
    current: number;
    target: number;
  }>;
}

/**
 * 품질 평가
 */
export interface QualityAssessment {
  overallScore: number;  // 0-100
  criteria: {
    dataCompleteness: number;
    insightRelevance: number;
    actionability: number;
    accuracy: number;
    timeliness: number;
  };
  confidence: number;
  validationStatus: 'validated' | 'partial' | 'unvalidated';
  warnings: string[];
  improvements: string[];
}

/**
 * 인사이트 요약
 */
export interface InsightSummary {
  topFindings: string[];
  criticalActions: string[];
  opportunityAreas: string[];
  riskFactors: string[];
  competitivePosition: string;
  expectedImprovements: Array<{
    area: string;
    currentScore: number;
    targetScore: number;
    timeframe: string;
  }>;
}

/**
 * 인사이트 오케스트레이터 클래스
 */
export class InsightOrchestrator {
  private insightGenerator: AdvancedInsightGenerator;
  private recommendationEngine: ContextualRecommendationEngine;
  private benchmarkService: IndustryBenchmarkService;
  private cache = getCacheManager();

  constructor() {
    this.insightGenerator = getAdvancedInsightGenerator();
    this.recommendationEngine = getRecommendationEngine();
    this.benchmarkService = getBenchmarkService();
  }

  /**
   * 통합 인사이트 생성
   */
  async generateIntegratedInsights(
    data: ProcessedKPIData[],
    context: {
      industry?: Industry;
      companySize?: CompanySize;
      stage?: GrowthStage;
      budget?: string;
      goals?: string[];
    }
  ): Promise<IntegratedInsights> {
    // 캐시 확인
    const cacheKey = this.cache.generateStaticKey('integrated_insights', context);
    const cached = this.cache.get<IntegratedInsights>(cacheKey);
    if (cached) return cached;

    try {
      // 1. 고급 인사이트 생성
      const insights = await this.insightGenerator.generateInsights(data, {
        minConfidence: 0.6,
        maxInsights: 15
      });

      // 2. 벤치마크 비교
      const benchmarks = context.industry && context.companySize && context.stage
        ? await this.benchmarkService.compareToBenchmark(data, {
            industry: context.industry,
            companySize: context.companySize,
            stage: context.stage
          })
        : [];

      // 3. 맥락적 추천 생성
      const recommendations = await this.recommendationEngine.generateRecommendations(
        data,
        insights,
        context as any
      );

      // 4. 액션 플랜 생성
      const actionPlan = this.createActionPlan(insights, recommendations);

      // 5. 품질 평가
      const qualityScore = this.assessQuality(insights, recommendations, data);

      // 6. 요약 생성
      const summary = this.createSummary(insights, recommendations, benchmarks);

      const result: IntegratedInsights = {
        insights,
        recommendations,
        benchmarks,
        actionPlan,
        qualityScore,
        summary
      };

      // 캐시 저장
      this.cache.set(cacheKey, result, {
        ttlMinutes: 30,
        persistent: true
      });

      return result;
    } catch (error) {
      console.error('Error generating integrated insights:', error);
      throw error;
    }
  }

  /**
   * 액션 플랜 생성
   */
  private createActionPlan(
    insights: AdvancedInsight[],
    recommendations: ContextualRecommendation[]
  ): ActionPlan {
    const immediate: ActionItem[] = [];
    const shortTerm: ActionItem[] = [];
    const mediumTerm: ActionItem[] = [];
    const longTerm: ActionItem[] = [];

    // 인사이트 기반 액션
    insights.forEach(insight => {
      if (insight.priority === InsightPriority.CRITICAL) {
        insight.suggestedActions.forEach((action, index) => {
          immediate.push(this.createActionItem(
            action,
            insight,
            'immediate',
            index
          ));
        });
      } else if (insight.priority === InsightPriority.HIGH) {
        insight.suggestedActions.forEach((action, index) => {
          shortTerm.push(this.createActionItem(
            action,
            insight,
            'short',
            index
          ));
        });
      }
    });

    // 추천 기반 액션
    recommendations.forEach(rec => {
      const timeframe = rec.implementation.estimatedTime;
      const actionItems = rec.implementation.steps.map((step, index) =>
        this.createActionItemFromRecommendation(rec, step, index)
      );

      if (timeframe.includes('주') || timeframe.includes('1개월')) {
        immediate.push(...actionItems);
      } else if (timeframe.includes('3개월')) {
        shortTerm.push(...actionItems);
      } else if (timeframe.includes('6개월')) {
        mediumTerm.push(...actionItems);
      } else {
        longTerm.push(...actionItems);
      }
    });

    // 중복 제거 및 우선순위 정렬
    const dedupAndSort = (items: ActionItem[]) => {
      const seen = new Set<string>();
      return items
        .filter(item => {
          const key = item.title.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a, b) => {
          const priorityOrder = {
            [InsightPriority.CRITICAL]: 4,
            [InsightPriority.HIGH]: 3,
            [InsightPriority.MEDIUM]: 2,
            [InsightPriority.LOW]: 1
          };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    };

    return {
      immediate: dedupAndSort(immediate).slice(0, 5),
      shortTerm: dedupAndSort(shortTerm).slice(0, 5),
      mediumTerm: dedupAndSort(mediumTerm).slice(0, 3),
      longTerm: dedupAndSort(longTerm).slice(0, 3),
      totalEstimatedImpact: '전체 KPI 점수 15-25% 향상 예상',
      resourceRequirements: this.extractResourceRequirements(recommendations)
    };
  }

  /**
   * 품질 평가
   */
  private assessQuality(
    insights: AdvancedInsight[],
    recommendations: ContextualRecommendation[],
    data: ProcessedKPIData[]
  ): QualityAssessment {
    const warnings: string[] = [];
    const improvements: string[] = [];

    // 데이터 완전성
    const dataCompleteness = Math.min(100, (data.length / 50) * 100);
    if (dataCompleteness < 50) {
      warnings.push('KPI 데이터가 부족합니다. 더 많은 데이터 수집이 필요합니다.');
    }

    // 인사이트 관련성
    const avgConfidence = insights.reduce((acc, i) => acc + i.confidence, 0) / insights.length;
    const insightRelevance = avgConfidence * 100;

    // 실행 가능성
    const actionableInsights = insights.filter(i => i.suggestedActions.length > 0);
    const actionability = (actionableInsights.length / insights.length) * 100;
    if (actionability < 70) {
      improvements.push('더 구체적인 실행 계획이 필요합니다.');
    }

    // 정확성 (벤치마크 데이터 유무 등)
    const hasMetrics = insights.filter(i => i.metrics).length;
    const accuracy = Math.min(100, (hasMetrics / insights.length) * 100 + 30);

    // 적시성
    const recentData = data.filter(d =>
      d.timestamp && Date.now() - d.timestamp < 30 * 24 * 60 * 60 * 1000
    );
    const timeliness = (recentData.length / data.length) * 100;
    if (timeliness < 50) {
      warnings.push('최신 데이터가 부족합니다. 데이터 업데이트가 필요합니다.');
    }

    // 전체 점수 계산
    const overallScore = (
      dataCompleteness * 0.2 +
      insightRelevance * 0.25 +
      actionability * 0.25 +
      accuracy * 0.15 +
      timeliness * 0.15
    );

    // 검증 상태 결정
    let validationStatus: QualityAssessment['validationStatus'] = 'validated';
    if (overallScore < 60) validationStatus = 'partial';
    if (dataCompleteness < 30) validationStatus = 'unvalidated';

    // 개선 제안
    if (insights.length < 5) {
      improvements.push('더 많은 패턴 분석이 필요합니다.');
    }
    if (recommendations.length < 3) {
      improvements.push('추가적인 개선 기회를 탐색하세요.');
    }

    return {
      overallScore: Math.round(overallScore),
      criteria: {
        dataCompleteness: Math.round(dataCompleteness),
        insightRelevance: Math.round(insightRelevance),
        actionability: Math.round(actionability),
        accuracy: Math.round(accuracy),
        timeliness: Math.round(timeliness)
      },
      confidence: avgConfidence,
      validationStatus,
      warnings,
      improvements
    };
  }

  /**
   * 요약 생성
   */
  private createSummary(
    insights: AdvancedInsight[],
    recommendations: ContextualRecommendation[],
    benchmarks: BenchmarkComparison[]
  ): InsightSummary {
    // Top Findings
    const topFindings = insights
      .filter(i => i.priority === InsightPriority.CRITICAL || i.priority === InsightPriority.HIGH)
      .slice(0, 3)
      .map(i => i.title);

    // Critical Actions
    const criticalActions = recommendations
      .filter(r => r.priority === InsightPriority.CRITICAL || r.priority === InsightPriority.HIGH)
      .slice(0, 3)
      .map(r => r.title);

    // Opportunity Areas
    const opportunityAreas = insights
      .filter(i => i.type === 'opportunity')
      .slice(0, 3)
      .map(i => i.title);

    // Risk Factors
    const riskFactors = insights
      .filter(i => i.type === 'threat' || i.type === 'weakness')
      .slice(0, 3)
      .map(i => i.title);

    // Competitive Position
    let competitivePosition = '데이터 부족';
    if (benchmarks.length > 0) {
      const avgPercentile = benchmarks.reduce((acc, b) => acc + b.benchmarks.percentile, 0) / benchmarks.length;
      if (avgPercentile >= 75) {
        competitivePosition = '업계 선두 그룹 (상위 25%)';
      } else if (avgPercentile >= 50) {
        competitivePosition = '업계 평균 이상 (상위 50%)';
      } else if (avgPercentile >= 25) {
        competitivePosition = '업계 평균 이하 (하위 50%)';
      } else {
        competitivePosition = '개선 필요 (하위 25%)';
      }
    }

    // Expected Improvements
    const expectedImprovements = recommendations
      .filter(r => r.expectedImpact?.metrics?.length > 0)
      .slice(0, 3)
      .map(r => ({
        area: r.title,
        currentScore: r.expectedImpact.metrics[0]?.currentValue || 0,
        targetScore: r.expectedImpact.metrics[0]?.targetValue || 0,
        timeframe: r.expectedImpact.timeToImpact
      }));

    return {
      topFindings,
      criticalActions,
      opportunityAreas,
      riskFactors,
      competitivePosition,
      expectedImprovements
    };
  }

  /**
   * 액션 아이템 생성
   */
  private createActionItem(
    action: string,
    insight: AdvancedInsight,
    timeframe: string,
    index: number
  ): ActionItem {
    return {
      id: `action_${insight.id}_${index}`,
      title: action,
      description: insight.description,
      priority: insight.priority,
      kpis: insight.relatedKPIs,
      expectedOutcome: insight.impact,
      dependencies: [],
      status: 'pending',
      trackingMetrics: insight.metrics ? [{
        metric: 'KPI Score',
        current: insight.metrics.current,
        target: insight.metrics.target
      }] : [],
      deadline: this.calculateDeadline(timeframe)
    };
  }

  /**
   * 추천 기반 액션 아이템 생성
   */
  private createActionItemFromRecommendation(
    rec: ContextualRecommendation,
    step: string,
    index: number
  ): ActionItem {
    return {
      id: `action_${rec.id}_${index}`,
      title: step,
      description: rec.description,
      priority: rec.priority,
      kpis: rec.relatedInsights,
      expectedOutcome: rec.expectedImpact.description,
      dependencies: rec.dependencies,
      status: 'pending',
      trackingMetrics: rec.expectedImpact.metrics.map(m => ({
        metric: m.kpi,
        current: m.currentValue,
        target: m.targetValue
      }))
    };
  }

  /**
   * 리소스 요구사항 추출
   */
  private extractResourceRequirements(
    recommendations: ContextualRecommendation[]
  ): string[] {
    const resources = new Set<string>();

    recommendations.forEach(rec => {
      rec.implementation.resources.forEach(r => resources.add(r));
    });

    return Array.from(resources);
  }

  /**
   * 마감일 계산
   */
  private calculateDeadline(timeframe: string): Date {
    const now = new Date();

    switch (timeframe) {
      case 'immediate':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1주
      case 'short':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 1개월
      case 'medium':
        return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 3개월
      case 'long':
        return new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // 6개월
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * 인사이트 검증
   */
  validateInsights(insights: AdvancedInsight[]): {
    valid: AdvancedInsight[];
    invalid: Array<{ insight: AdvancedInsight; reason: string }>;
  } {
    const valid: AdvancedInsight[] = [];
    const invalid: Array<{ insight: AdvancedInsight; reason: string }> = [];

    insights.forEach(insight => {
      // 품질 평가
      const quality = this.insightGenerator.evaluateQuality(insight);

      if (quality.score < 0.5) {
        invalid.push({
          insight,
          reason: `품질 점수 부족 (${(quality.score * 100).toFixed(0)}%)`
        });
      } else if (insight.confidence < 0.5) {
        invalid.push({
          insight,
          reason: `신뢰도 부족 (${(insight.confidence * 100).toFixed(0)}%)`
        });
      } else if (!insight.suggestedActions || insight.suggestedActions.length === 0) {
        invalid.push({
          insight,
          reason: '실행 가능한 액션 없음'
        });
      } else {
        valid.push(insight);
      }
    });

    return { valid, invalid };
  }
}

// 싱글톤 인스턴스
let orchestratorInstance: InsightOrchestrator | null = null;

export function getInsightOrchestrator(): InsightOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new InsightOrchestrator();
  }
  return orchestratorInstance;
}