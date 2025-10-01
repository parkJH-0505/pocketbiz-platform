/**
 * Advanced Insight Generator
 * ML 패턴을 활용한 고급 인사이트 생성 시스템
 */

import { ProcessedKPIData, AxisKey } from '@/types/reportV3.types';

/**
 * 인사이트 타입 정의
 */
export enum InsightType {
  STRENGTH = 'strength',
  WEAKNESS = 'weakness',
  OPPORTUNITY = 'opportunity',
  THREAT = 'threat',
  TREND = 'trend',
  ANOMALY = 'anomaly',
  CORRELATION = 'correlation',
  RECOMMENDATION = 'recommendation'
}

/**
 * 인사이트 중요도
 */
export enum InsightPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

/**
 * 인사이트 신뢰도
 */
export enum InsightConfidence {
  VERY_HIGH = 0.9,
  HIGH = 0.75,
  MEDIUM = 0.6,
  LOW = 0.4
}

/**
 * 고급 인사이트 인터페이스
 */
export interface AdvancedInsight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  confidence: number;
  title: string;
  description: string;
  impact: string;
  dataPoints: string[];
  relatedKPIs: string[];
  suggestedActions: string[];
  timeframe?: string;
  metrics?: {
    current: number;
    target: number;
    gap: number;
  };
  tags: string[];
  generatedAt: Date;
}

/**
 * 패턴 매칭 규칙
 */
interface PatternRule {
  name: string;
  condition: (data: ProcessedKPIData[]) => boolean;
  generateInsight: (data: ProcessedKPIData[]) => Partial<AdvancedInsight>;
  priority: InsightPriority;
}

/**
 * 고급 인사이트 생성기 클래스
 */
export class AdvancedInsightGenerator {
  private patterns: PatternRule[];
  private insights: Map<string, AdvancedInsight>;

  constructor() {
    this.patterns = this.initializePatterns();
    this.insights = new Map();
  }

  /**
   * 패턴 규칙 초기화
   */
  private initializePatterns(): PatternRule[] {
    return [
      // 극심한 저성과 패턴
      {
        name: 'critical_underperformance',
        condition: (data) => {
          const avgScore = data.reduce((acc, d) => acc + (d.score || 0), 0) / data.length;
          return avgScore < 40;
        },
        generateInsight: (data) => ({
          type: InsightType.WEAKNESS,
          title: '전반적인 성과 부진 감지',
          description: '복수의 KPI에서 목표 대비 60% 이상의 격차가 발생하고 있습니다.',
          impact: '비즈니스 전반의 경쟁력 약화 및 시장 점유율 하락 위험',
          suggestedActions: [
            '긴급 경영진 회의를 통한 위기 대응 전략 수립',
            '핵심 KPI 3개 선정하여 집중 개선',
            '외부 전문가 컨설팅 검토'
          ],
          timeframe: '즉시 (1주 이내)'
        }),
        priority: InsightPriority.CRITICAL
      },

      // 성장 모멘텀 패턴
      {
        name: 'growth_momentum',
        condition: (data) => {
          const recentData = data.filter(d => d.timestamp &&
            Date.now() - d.timestamp < 30 * 24 * 60 * 60 * 1000);
          const avgRecentScore = recentData.reduce((acc, d) => acc + (d.score || 0), 0) / recentData.length;
          const avgOverallScore = data.reduce((acc, d) => acc + (d.score || 0), 0) / data.length;
          return avgRecentScore > avgOverallScore * 1.2;
        },
        generateInsight: (data) => ({
          type: InsightType.OPPORTUNITY,
          title: '긍정적인 성장 모멘텀 확인',
          description: '최근 30일간 KPI 성과가 평균 대비 20% 이상 개선되었습니다.',
          impact: '지속적인 성장 기반 마련 및 투자 유치 가능성 증대',
          suggestedActions: [
            '성공 요인 분석 및 확대 적용',
            '성과 지표 상향 조정 검토',
            '성장 가속화를 위한 추가 리소스 투입'
          ],
          timeframe: '단기 (1개월 이내)'
        }),
        priority: InsightPriority.HIGH
      },

      // 불균형 성과 패턴
      {
        name: 'unbalanced_performance',
        condition: (data) => {
          const axisScores = new Map<string, number[]>();
          data.forEach(d => {
            if (!axisScores.has(d.axis)) {
              axisScores.set(d.axis, []);
            }
            axisScores.get(d.axis)!.push(d.score || 0);
          });

          const avgScores = Array.from(axisScores.values()).map(
            scores => scores.reduce((a, b) => a + b, 0) / scores.length
          );

          const maxScore = Math.max(...avgScores);
          const minScore = Math.min(...avgScores);
          return maxScore - minScore > 40;
        },
        generateInsight: (data) => ({
          type: InsightType.WEAKNESS,
          title: '축별 성과 불균형 발견',
          description: '특정 영역의 성과가 다른 영역 대비 현저히 낮아 전체적인 균형이 무너졌습니다.',
          impact: '비즈니스 안정성 저하 및 특정 영역 의존도 심화',
          suggestedActions: [
            '저성과 영역 집중 개선 프로그램 실행',
            '영역간 시너지 창출 방안 모색',
            '균형 성과 지표(BSC) 도입 검토'
          ],
          timeframe: '중기 (3개월 이내)'
        }),
        priority: InsightPriority.HIGH
      },

      // 벤치마크 초과 달성 패턴
      {
        name: 'benchmark_outperformance',
        condition: (data) => {
          const benchmarkData = data.filter(d =>
            d.benchmark && d.score && d.score > d.benchmark * 1.1
          );
          return benchmarkData.length > data.length * 0.3;
        },
        generateInsight: (data) => ({
          type: InsightType.STRENGTH,
          title: '업계 벤치마크 초과 달성',
          description: '30% 이상의 KPI에서 업계 평균을 10% 이상 상회하고 있습니다.',
          impact: '시장 리더십 확보 및 브랜드 가치 상승',
          suggestedActions: [
            '우수 사례 문서화 및 공유',
            '성과 홍보를 통한 브랜드 강화',
            '차별화 전략 지속 강화'
          ],
          timeframe: '지속적'
        }),
        priority: InsightPriority.MEDIUM
      },

      // 하락 추세 패턴
      {
        name: 'declining_trend',
        condition: (data) => {
          const sortedData = data
            .filter(d => d.timestamp)
            .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

          if (sortedData.length < 3) return false;

          const recentScores = sortedData.slice(-3).map(d => d.score || 0);
          return recentScores[0] > recentScores[1] && recentScores[1] > recentScores[2];
        },
        generateInsight: (data) => ({
          type: InsightType.THREAT,
          title: '지속적인 하락 추세 감지',
          description: '최근 3개 측정 주기 동안 KPI 점수가 연속적으로 하락하고 있습니다.',
          impact: '목표 달성 실패 위험 및 이해관계자 신뢰도 하락',
          suggestedActions: [
            '하락 원인 근본 분석 (RCA) 수행',
            '단기 개선 조치 즉시 시행',
            '추세 반전을 위한 특별 TF 구성'
          ],
          timeframe: '긴급 (1주 이내)'
        }),
        priority: InsightPriority.HIGH
      },

      // 고성과 클러스터 패턴
      {
        name: 'high_performance_cluster',
        condition: (data) => {
          const highPerformers = data.filter(d => (d.score || 0) > 80);
          return highPerformers.length > data.length * 0.5;
        },
        generateInsight: (data) => ({
          type: InsightType.STRENGTH,
          title: '우수 성과 클러스터 형성',
          description: '50% 이상의 KPI가 80점 이상의 우수한 성과를 보이고 있습니다.',
          impact: '지속 가능한 성장 기반 확보 및 조직 역량 성숙',
          suggestedActions: [
            '성공 DNA 분석 및 전사 확산',
            '더 도전적인 목표 설정 검토',
            '우수 인재 보상 및 유지 전략 강화'
          ],
          timeframe: '지속적'
        }),
        priority: InsightPriority.MEDIUM
      }
    ];
  }

  /**
   * 인사이트 생성
   */
  async generateInsights(
    data: ProcessedKPIData[],
    options?: {
      minConfidence?: number;
      maxInsights?: number;
      priorityFilter?: InsightPriority[];
    }
  ): Promise<AdvancedInsight[]> {
    const {
      minConfidence = InsightConfidence.MEDIUM,
      maxInsights = 10,
      priorityFilter = []
    } = options || {};

    this.insights.clear();
    const generatedInsights: AdvancedInsight[] = [];

    // 패턴 매칭 실행
    for (const pattern of this.patterns) {
      try {
        if (pattern.condition(data)) {
          const insight = this.createInsight(
            pattern.generateInsight(data),
            pattern.priority,
            data
          );

          if (insight.confidence >= minConfidence) {
            if (priorityFilter.length === 0 || priorityFilter.includes(insight.priority)) {
              generatedInsights.push(insight);
              this.insights.set(insight.id, insight);
            }
          }
        }
      } catch (error) {
        console.error(`Pattern matching error for ${pattern.name}:`, error);
      }
    }

    // 상관관계 분석
    const correlationInsights = this.analyzeCorrelations(data);
    generatedInsights.push(...correlationInsights);

    // 이상치 탐지
    const anomalyInsights = this.detectAnomalies(data);
    generatedInsights.push(...anomalyInsights);

    // 우선순위 및 신뢰도 기준 정렬
    const sortedInsights = generatedInsights
      .sort((a, b) => {
        const priorityOrder = {
          [InsightPriority.CRITICAL]: 4,
          [InsightPriority.HIGH]: 3,
          [InsightPriority.MEDIUM]: 2,
          [InsightPriority.LOW]: 1
        };

        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;

        return b.confidence - a.confidence;
      })
      .slice(0, maxInsights);

    return sortedInsights;
  }

  /**
   * 인사이트 객체 생성
   */
  private createInsight(
    partial: Partial<AdvancedInsight>,
    priority: InsightPriority,
    data: ProcessedKPIData[]
  ): AdvancedInsight {
    const confidence = this.calculateConfidence(partial, data);

    return {
      id: this.generateInsightId(),
      type: partial.type || InsightType.RECOMMENDATION,
      priority,
      confidence,
      title: partial.title || '인사이트',
      description: partial.description || '',
      impact: partial.impact || '',
      dataPoints: partial.dataPoints || this.extractDataPoints(data),
      relatedKPIs: partial.relatedKPIs || data.map(d => d.kpiId).slice(0, 5),
      suggestedActions: partial.suggestedActions || [],
      timeframe: partial.timeframe,
      metrics: partial.metrics,
      tags: this.generateTags(partial, data),
      generatedAt: new Date(),
      ...partial
    };
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(
    insight: Partial<AdvancedInsight>,
    data: ProcessedKPIData[]
  ): number {
    let confidence = InsightConfidence.MEDIUM;

    // 데이터 포인트 수에 따른 신뢰도 조정
    if (data.length > 20) confidence += 0.1;
    if (data.length > 50) confidence += 0.1;

    // 데이터 일관성에 따른 조정
    const scores = data.map(d => d.score || 0);
    const stdDev = this.calculateStdDev(scores);
    if (stdDev < 10) confidence += 0.05;

    // 최근 데이터 비중
    const recentData = data.filter(d =>
      d.timestamp && Date.now() - d.timestamp < 7 * 24 * 60 * 60 * 1000
    );
    if (recentData.length > data.length * 0.3) confidence += 0.05;

    return Math.min(1, confidence);
  }

  /**
   * 상관관계 분석
   */
  private analyzeCorrelations(data: ProcessedKPIData[]): AdvancedInsight[] {
    const insights: AdvancedInsight[] = [];
    const kpiGroups = this.groupByKPI(data);

    // KPI 쌍별 상관관계 분석
    const kpiIds = Array.from(kpiGroups.keys());
    for (let i = 0; i < kpiIds.length - 1; i++) {
      for (let j = i + 1; j < kpiIds.length; j++) {
        const correlation = this.calculateCorrelation(
          kpiGroups.get(kpiIds[i])!,
          kpiGroups.get(kpiIds[j])!
        );

        if (Math.abs(correlation) > 0.7) {
          insights.push(this.createInsight({
            type: InsightType.CORRELATION,
            title: `강한 상관관계 발견: ${kpiIds[i]} ↔ ${kpiIds[j]}`,
            description: `${correlation > 0 ? '양' : '음'}의 상관관계 (${(correlation * 100).toFixed(1)}%)가 확인되었습니다.`,
            impact: '한 지표의 개선이 다른 지표에 직접적인 영향을 미칩니다.',
            suggestedActions: [
              correlation > 0
                ? '두 지표를 함께 관리하는 통합 전략 수립'
                : '트레이드오프 관계 고려한 균형 전략 필요'
            ],
            relatedKPIs: [kpiIds[i], kpiIds[j]]
          }, InsightPriority.MEDIUM, data));
        }
      }
    }

    return insights;
  }

  /**
   * 이상치 탐지
   */
  private detectAnomalies(data: ProcessedKPIData[]): AdvancedInsight[] {
    const insights: AdvancedInsight[] = [];
    const scores = data.map(d => d.score || 0);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const stdDev = this.calculateStdDev(scores);

    data.forEach(d => {
      const zScore = Math.abs((d.score || 0) - mean) / stdDev;
      if (zScore > 2.5) {
        insights.push(this.createInsight({
          type: InsightType.ANOMALY,
          title: `이상치 감지: ${d.name}`,
          description: `평균 대비 ${zScore.toFixed(1)} 표준편차 벗어난 이상치입니다.`,
          impact: d.score! > mean
            ? '예외적인 성공 사례로 벤치마킹 가치 있음'
            : '즉각적인 조치가 필요한 문제 영역',
          suggestedActions: [
            '데이터 정확성 검증',
            '특이 상황 발생 원인 분석',
            d.score! > mean ? '성공 요인 파악 및 확산' : '긴급 개선 조치 시행'
          ],
          relatedKPIs: [d.kpiId],
          metrics: {
            current: d.score || 0,
            target: mean,
            gap: (d.score || 0) - mean
          }
        }, InsightPriority.HIGH, [d]));
      }
    });

    return insights;
  }

  /**
   * 유틸리티 함수들
   */
  private generateInsightId(): string {
    return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractDataPoints(data: ProcessedKPIData[]): string[] {
    return data
      .slice(0, 5)
      .map(d => `${d.name}: ${d.score?.toFixed(1)}점`);
  }

  private generateTags(
    insight: Partial<AdvancedInsight>,
    data: ProcessedKPIData[]
  ): string[] {
    const tags: string[] = [];

    // 타입별 태그
    if (insight.type) tags.push(insight.type);

    // 우선순위 태그
    if (insight.priority) tags.push(insight.priority);

    // 축별 태그
    const axes = new Set(data.map(d => d.axis));
    axes.forEach(axis => tags.push(axis));

    // 성과 수준 태그
    const avgScore = data.reduce((acc, d) => acc + (d.score || 0), 0) / data.length;
    if (avgScore > 80) tags.push('high-performance');
    else if (avgScore < 40) tags.push('low-performance');

    return tags;
  }

  private groupByKPI(data: ProcessedKPIData[]): Map<string, ProcessedKPIData[]> {
    const groups = new Map<string, ProcessedKPIData[]>();
    data.forEach(d => {
      if (!groups.has(d.kpiId)) {
        groups.set(d.kpiId, []);
      }
      groups.get(d.kpiId)!.push(d);
    });
    return groups;
  }

  private calculateStdDev(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  private calculateCorrelation(data1: ProcessedKPIData[], data2: ProcessedKPIData[]): number {
    const scores1 = data1.map(d => d.score || 0);
    const scores2 = data2.map(d => d.score || 0);

    if (scores1.length !== scores2.length || scores1.length === 0) return 0;

    const mean1 = scores1.reduce((a, b) => a + b, 0) / scores1.length;
    const mean2 = scores2.reduce((a, b) => a + b, 0) / scores2.length;

    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;

    for (let i = 0; i < scores1.length; i++) {
      const diff1 = scores1[i] - mean1;
      const diff2 = scores2[i] - mean2;
      numerator += diff1 * diff2;
      denominator1 += diff1 * diff1;
      denominator2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(denominator1 * denominator2);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * 인사이트 품질 평가
   */
  evaluateQuality(insight: AdvancedInsight): {
    score: number;
    factors: Record<string, number>;
  } {
    const factors = {
      dataCompleteness: insight.dataPoints.length > 3 ? 1 : 0.5,
      actionability: insight.suggestedActions.length > 0 ? 1 : 0,
      specificity: insight.metrics ? 1 : 0.5,
      timeliness: insight.timeframe ? 1 : 0.5,
      confidence: insight.confidence
    };

    const score = Object.values(factors).reduce((a, b) => a + b, 0) / Object.keys(factors).length;

    return { score, factors };
  }
}

// 싱글톤 인스턴스
let generatorInstance: AdvancedInsightGenerator | null = null;

export function getAdvancedInsightGenerator(): AdvancedInsightGenerator {
  if (!generatorInstance) {
    generatorInstance = new AdvancedInsightGenerator();
  }
  return generatorInstance;
}