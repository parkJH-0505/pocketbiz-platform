/**
 * NLP-based Insights Engine
 * 자연어 처리 기반 인사이트 생성 시스템
 */

import type { AxisKey } from '../../pages/startup/kpi-tabs/ResultsInsightsPanelV2/types';
import type { Pattern } from './PatternRecognition';
import type { AnomalyPoint } from './AnomalyDetection';

export interface NLPInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'prediction' | 'analysis';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  details: string[];
  metrics?: {
    impact: number; // 0-100
    confidence: number; // 0-1
    relevance: number; // 0-1
  };
  actions?: ActionItem[];
  relatedAxes: AxisKey[];
  timestamp: number;
  language: 'ko' | 'en';
}

export interface ActionItem {
  id: string;
  text: string;
  type: 'immediate' | 'short_term' | 'long_term';
  priority: number;
  expectedImpact: string;
}

export interface InsightContext {
  patterns: Pattern[];
  anomalies: AnomalyPoint[];
  currentScores: Record<AxisKey, number>;
  historicalTrends: Array<{
    timestamp: number;
    scores: Record<AxisKey, number>;
  }>;
  businessContext?: {
    industry?: string;
    stage?: 'startup' | 'growth' | 'mature';
    goals?: string[];
  };
}

export class NLPInsightsEngine {
  private readonly templates: Map<string, InsightTemplate> = new Map();
  private readonly axisDescriptions: Record<AxisKey, { ko: string; en: string }> = {
    GO: { ko: '목표 방향성', en: 'Goal Direction' },
    EC: { ko: '경제성', en: 'Economic Viability' },
    PT: { ko: '실현 가능성', en: 'Practical Feasibility' },
    PF: { ko: '미래 준비도', en: 'Future Readiness' },
    TO: { ko: '시장 적합성', en: 'Market Fit' }
  };

  constructor() {
    this.initializeTemplates();
  }

  /**
   * 메인 인사이트 생성 함수
   */
  generateInsights(context: InsightContext, language: 'ko' | 'en' = 'ko'): NLPInsight[] {
    const insights: NLPInsight[] = [];

    // 1. 패턴 기반 인사이트
    insights.push(...this.generatePatternInsights(context.patterns, context.currentScores, language));

    // 2. 이상치 기반 인사이트
    insights.push(...this.generateAnomalyInsights(context.anomalies, context.currentScores, language));

    // 3. 트렌드 분석 인사이트
    insights.push(...this.generateTrendInsights(context.historicalTrends, context.currentScores, language));

    // 4. 전략적 추천 인사이트
    insights.push(...this.generateRecommendations(context, language));

    // 5. 예측 인사이트
    insights.push(...this.generatePredictions(context, language));

    // 우선순위 정렬
    return this.prioritizeInsights(insights);
  }

  /**
   * 패턴 기반 인사이트 생성
   */
  private generatePatternInsights(
    patterns: Pattern[],
    currentScores: Record<AxisKey, number>,
    language: 'ko' | 'en'
  ): NLPInsight[] {
    const insights: NLPInsight[] = [];

    for (const pattern of patterns) {
      if (pattern.confidence < 0.7) continue; // 신뢰도가 낮은 패턴 제외

      const insight = this.createPatternInsight(pattern, currentScores, language);
      if (insight) {
        insights.push(insight);
      }
    }

    return insights;
  }

  /**
   * 개별 패턴 인사이트 생성
   */
  private createPatternInsight(
    pattern: Pattern,
    currentScores: Record<AxisKey, number>,
    language: 'ko' | 'en'
  ): NLPInsight | null {
    const template = this.templates.get(`${pattern.type}_${language}`);
    if (!template) return null;

    const affectedAxisNames = pattern.affectedAxes
      .map(axis => this.axisDescriptions[axis][language])
      .join(', ');

    const title = template.title
      .replace('{axes}', affectedAxisNames)
      .replace('{magnitude}', pattern.magnitude.toFixed(1));

    const description = template.description
      .replace('{axes}', affectedAxisNames)
      .replace('{confidence}', (pattern.confidence * 100).toFixed(0))
      .replace('{magnitude}', pattern.magnitude.toFixed(1));

    const details = this.generatePatternDetails(pattern, currentScores, language);
    const actions = this.generatePatternActions(pattern, currentScores, language);

    return {
      id: this.generateId(),
      type: 'trend',
      priority: this.calculatePriority(pattern),
      title,
      description,
      details,
      metrics: {
        impact: pattern.magnitude * 10, // 0-100 scale
        confidence: pattern.confidence,
        relevance: this.calculateRelevance(pattern, currentScores)
      },
      actions,
      relatedAxes: pattern.affectedAxes,
      timestamp: Date.now(),
      language
    };
  }

  /**
   * 이상치 기반 인사이트 생성
   */
  private generateAnomalyInsights(
    anomalies: AnomalyPoint[],
    currentScores: Record<AxisKey, number>,
    language: 'ko' | 'en'
  ): NLPInsight[] {
    const insights: NLPInsight[] = [];

    // 이상치를 축별로 그룹화
    const anomaliesByAxis = new Map<AxisKey, AnomalyPoint[]>();
    for (const anomaly of anomalies) {
      if (!anomaliesByAxis.has(anomaly.axis)) {
        anomaliesByAxis.set(anomaly.axis, []);
      }
      anomaliesByAxis.get(anomaly.axis)!.push(anomaly);
    }

    // 축별로 인사이트 생성
    for (const [axis, axisAnomalies] of anomaliesByAxis) {
      const severity = Math.max(...axisAnomalies.map(a => a.severity));

      if (severity < 0.5) continue; // 낮은 심각도 제외

      const insight = this.createAnomalyInsight(axis, axisAnomalies, currentScores, language);
      if (insight) {
        insights.push(insight);
      }
    }

    return insights;
  }

  /**
   * 개별 이상치 인사이트 생성
   */
  private createAnomalyInsight(
    axis: AxisKey,
    anomalies: AnomalyPoint[],
    currentScores: Record<AxisKey, number>,
    language: 'ko' | 'en'
  ): NLPInsight {
    const axisName = this.axisDescriptions[axis][language];
    const maxSeverity = Math.max(...anomalies.map(a => a.severity));
    const avgConfidence = anomalies.reduce((sum, a) => sum + a.confidence, 0) / anomalies.length;

    const title = language === 'ko'
      ? `${axisName}에서 비정상적인 패턴 감지`
      : `Unusual Pattern Detected in ${axisName}`;

    const description = language === 'ko'
      ? `${axisName} 지표에서 예상 범위를 벗어난 값이 감지되었습니다. ` +
        `현재 값은 ${currentScores[axis].toFixed(1)}점이며, ` +
        `${anomalies.length}개의 이상 신호가 발견되었습니다.`
      : `The ${axisName} metric shows values outside the expected range. ` +
        `Current score is ${currentScores[axis].toFixed(1)}, ` +
        `with ${anomalies.length} anomaly signals detected.`;

    const details = anomalies.map(anomaly =>
      language === 'ko'
        ? `${anomaly.method} 방법으로 ${(anomaly.confidence * 100).toFixed(0)}% 신뢰도로 이상치 감지`
        : `Anomaly detected with ${(anomaly.confidence * 100).toFixed(0)}% confidence using ${anomaly.method}`
    );

    const actions = this.generateAnomalyActions(axis, anomalies, currentScores, language);

    return {
      id: this.generateId(),
      type: 'anomaly',
      priority: maxSeverity > 0.8 ? 'high' : maxSeverity > 0.6 ? 'medium' : 'low',
      title,
      description,
      details,
      metrics: {
        impact: maxSeverity * 100,
        confidence: avgConfidence,
        relevance: 0.9 // 이상치는 항상 높은 관련성
      },
      actions,
      relatedAxes: [axis],
      timestamp: Date.now(),
      language
    };
  }

  /**
   * 트렌드 분석 인사이트 생성
   */
  private generateTrendInsights(
    historicalTrends: Array<{ timestamp: number; scores: Record<AxisKey, number> }>,
    currentScores: Record<AxisKey, number>,
    language: 'ko' | 'en'
  ): NLPInsight[] {
    const insights: NLPInsight[] = [];

    if (historicalTrends.length < 5) return insights; // 충분한 데이터가 없으면 생략

    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

    for (const axis of axes) {
      const trend = this.analyzeTrend(
        historicalTrends.map(t => t.scores[axis]),
        currentScores[axis]
      );

      if (trend.significance > 0.7) {
        insights.push(this.createTrendInsight(axis, trend, language));
      }
    }

    // 전체적인 추세 인사이트
    const overallTrend = this.analyzeOverallTrend(historicalTrends, currentScores);
    if (overallTrend.significance > 0.7) {
      insights.push(this.createOverallTrendInsight(overallTrend, language));
    }

    return insights;
  }

  /**
   * 추천 인사이트 생성
   */
  private generateRecommendations(
    context: InsightContext,
    language: 'ko' | 'en'
  ): NLPInsight[] {
    const insights: NLPInsight[] = [];

    // 낮은 점수 축에 대한 개선 추천
    const weakAxes = this.identifyWeakAxes(context.currentScores);
    for (const axis of weakAxes) {
      insights.push(this.createImprovementRecommendation(axis, context, language));
    }

    // 강점 활용 추천
    const strongAxes = this.identifyStrongAxes(context.currentScores);
    if (strongAxes.length > 0) {
      insights.push(this.createStrengthLeverageRecommendation(strongAxes, context, language));
    }

    // 균형 개선 추천
    const balance = this.analyzeBalance(context.currentScores);
    if (balance.variance > 15) {
      insights.push(this.createBalanceRecommendation(balance, context, language));
    }

    return insights;
  }

  /**
   * 예측 인사이트 생성
   */
  private generatePredictions(
    context: InsightContext,
    language: 'ko' | 'en'
  ): NLPInsight[] {
    const insights: NLPInsight[] = [];

    // 단기 예측 (1주)
    const shortTermPrediction = this.predictShortTerm(context);
    if (shortTermPrediction.confidence > 0.7) {
      insights.push(this.createPredictionInsight(shortTermPrediction, 'short', language));
    }

    // 중기 예측 (1개월)
    const midTermPrediction = this.predictMidTerm(context);
    if (midTermPrediction.confidence > 0.6) {
      insights.push(this.createPredictionInsight(midTermPrediction, 'mid', language));
    }

    return insights;
  }

  /**
   * 개선 추천 생성
   */
  private createImprovementRecommendation(
    axis: AxisKey,
    context: InsightContext,
    language: 'ko' | 'en'
  ): NLPInsight {
    const axisName = this.axisDescriptions[axis][language];
    const currentScore = context.currentScores[axis];
    const improvement = 85 - currentScore; // 목표를 85점으로 설정

    const title = language === 'ko'
      ? `${axisName} 개선 전략`
      : `${axisName} Improvement Strategy`;

    const description = language === 'ko'
      ? `${axisName}의 현재 점수는 ${currentScore.toFixed(1)}점으로, ` +
        `${improvement.toFixed(1)}점의 개선 여지가 있습니다. ` +
        `집중적인 개선 노력이 필요합니다.`
      : `${axisName} currently scores ${currentScore.toFixed(1)}, ` +
        `with ${improvement.toFixed(1)} points of improvement potential. ` +
        `Focused improvement efforts are recommended.`;

    const actions = this.generateImprovementActions(axis, currentScore, context, language);

    return {
      id: this.generateId(),
      type: 'recommendation',
      priority: currentScore < 60 ? 'high' : 'medium',
      title,
      description,
      details: this.generateImprovementDetails(axis, context, language),
      metrics: {
        impact: improvement,
        confidence: 0.8,
        relevance: currentScore < 70 ? 1.0 : 0.7
      },
      actions,
      relatedAxes: [axis],
      timestamp: Date.now(),
      language
    };
  }

  /**
   * 강점 활용 추천 생성
   */
  private createStrengthLeverageRecommendation(
    strongAxes: AxisKey[],
    context: InsightContext,
    language: 'ko' | 'en'
  ): NLPInsight {
    const axisNames = strongAxes
      .map(axis => this.axisDescriptions[axis][language])
      .join(', ');

    const title = language === 'ko'
      ? '핵심 강점 활용 전략'
      : 'Core Strength Leverage Strategy';

    const description = language === 'ko'
      ? `${axisNames} 영역에서 우수한 성과를 보이고 있습니다. ` +
        `이러한 강점을 활용하여 다른 영역의 개선을 이끌어낼 수 있습니다.`
      : `Excellent performance in ${axisNames}. ` +
        `These strengths can be leveraged to drive improvements in other areas.`;

    return {
      id: this.generateId(),
      type: 'recommendation',
      priority: 'medium',
      title,
      description,
      details: this.generateStrengthDetails(strongAxes, context, language),
      metrics: {
        impact: 70,
        confidence: 0.85,
        relevance: 0.8
      },
      actions: this.generateStrengthActions(strongAxes, context, language),
      relatedAxes: strongAxes,
      timestamp: Date.now(),
      language
    };
  }

  /**
   * 균형 개선 추천 생성
   */
  private createBalanceRecommendation(
    balance: { variance: number; weakest: AxisKey; strongest: AxisKey },
    context: InsightContext,
    language: 'ko' | 'en'
  ): NLPInsight {
    const weakestName = this.axisDescriptions[balance.weakest][language];
    const strongestName = this.axisDescriptions[balance.strongest][language];

    const title = language === 'ko'
      ? 'KPI 균형 개선 필요'
      : 'KPI Balance Improvement Needed';

    const description = language === 'ko'
      ? `${strongestName}와 ${weakestName} 간의 점수 차이가 ${balance.variance.toFixed(1)}점으로 크게 나타나고 있습니다. ` +
        `균형잡힌 성장을 위해 조정이 필요합니다.`
      : `There's a ${balance.variance.toFixed(1)}-point gap between ${strongestName} and ${weakestName}. ` +
        `Adjustment needed for balanced growth.`;

    return {
      id: this.generateId(),
      type: 'analysis',
      priority: balance.variance > 20 ? 'high' : 'medium',
      title,
      description,
      details: [
        language === 'ko'
          ? `가장 높은 축: ${strongestName} (${context.currentScores[balance.strongest].toFixed(1)}점)`
          : `Highest axis: ${strongestName} (${context.currentScores[balance.strongest].toFixed(1)} points)`,
        language === 'ko'
          ? `가장 낮은 축: ${weakestName} (${context.currentScores[balance.weakest].toFixed(1)}점)`
          : `Lowest axis: ${weakestName} (${context.currentScores[balance.weakest].toFixed(1)} points)`,
        language === 'ko'
          ? `균형 개선 시 전체 성과 10-15% 향상 예상`
          : `10-15% overall performance improvement expected with better balance`
      ],
      metrics: {
        impact: balance.variance * 2,
        confidence: 0.75,
        relevance: 0.85
      },
      actions: this.generateBalanceActions(balance, context, language),
      relatedAxes: [balance.weakest, balance.strongest],
      timestamp: Date.now(),
      language
    };
  }

  /**
   * 예측 인사이트 생성
   */
  private createPredictionInsight(
    prediction: { scores: Partial<Record<AxisKey, number>>; confidence: number; factors: string[] },
    term: 'short' | 'mid',
    language: 'ko' | 'en'
  ): NLPInsight {
    const termText = language === 'ko'
      ? (term === 'short' ? '단기(1주)' : '중기(1개월)')
      : (term === 'short' ? 'Short-term (1 week)' : 'Mid-term (1 month)');

    const title = language === 'ko'
      ? `${termText} KPI 예측`
      : `${termText} KPI Forecast`;

    const predictedChanges = Object.entries(prediction.scores)
      .map(([axis, score]) => {
        const axisName = this.axisDescriptions[axis as AxisKey][language];
        return language === 'ko'
          ? `${axisName}: ${score!.toFixed(1)}점 예상`
          : `${axisName}: Expected ${score!.toFixed(1)} points`;
      });

    const description = language === 'ko'
      ? `현재 트렌드를 기반으로 ${termText} 후의 KPI 변화를 예측했습니다. ` +
        `신뢰도는 ${(prediction.confidence * 100).toFixed(0)}%입니다.`
      : `KPI changes predicted for ${termText} based on current trends. ` +
        `Confidence level: ${(prediction.confidence * 100).toFixed(0)}%.`;

    return {
      id: this.generateId(),
      type: 'prediction',
      priority: 'low',
      title,
      description,
      details: [
        ...predictedChanges,
        ...prediction.factors.map(factor =>
          language === 'ko' ? `영향 요인: ${factor}` : `Factor: ${factor}`
        )
      ],
      metrics: {
        impact: 50,
        confidence: prediction.confidence,
        relevance: 0.7
      },
      relatedAxes: Object.keys(prediction.scores) as AxisKey[],
      timestamp: Date.now(),
      language
    };
  }

  /**
   * 유틸리티 함수들
   */
  private analyzeTrend(values: number[], currentValue: number): {
    direction: 'up' | 'down' | 'stable';
    rate: number;
    significance: number;
  } {
    const n = values.length;
    const recentAvg = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const oldAvg = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const change = recentAvg - oldAvg;
    const rate = change / Math.max(oldAvg, 1);

    return {
      direction: Math.abs(change) < 5 ? 'stable' : change > 0 ? 'up' : 'down',
      rate,
      significance: Math.min(Math.abs(rate) * 2, 1)
    };
  }

  private analyzeOverallTrend(
    historicalTrends: Array<{ timestamp: number; scores: Record<AxisKey, number> }>,
    currentScores: Record<AxisKey, number>
  ): { direction: string; significance: number; description: string } {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const overallScores = historicalTrends.map(t =>
      axes.reduce((sum, axis) => sum + t.scores[axis], 0) / axes.length
    );

    const currentOverall = axes.reduce((sum, axis) => sum + currentScores[axis], 0) / axes.length;
    const trend = this.analyzeTrend(overallScores, currentOverall);

    return {
      direction: trend.direction,
      significance: trend.significance,
      description: `Overall ${trend.direction} trend with ${(trend.rate * 100).toFixed(1)}% change rate`
    };
  }

  private createTrendInsight(
    axis: AxisKey,
    trend: { direction: 'up' | 'down' | 'stable'; rate: number; significance: number },
    language: 'ko' | 'en'
  ): NLPInsight {
    const axisName = this.axisDescriptions[axis][language];
    const directionText = language === 'ko'
      ? { up: '상승', down: '하락', stable: '안정' }[trend.direction]
      : trend.direction;

    const title = language === 'ko'
      ? `${axisName} ${directionText} 추세`
      : `${axisName} ${trend.direction} trend`;

    const description = language === 'ko'
      ? `${axisName}이(가) ${Math.abs(trend.rate * 100).toFixed(1)}%의 속도로 ${directionText}하고 있습니다.`
      : `${axisName} is trending ${trend.direction} at ${Math.abs(trend.rate * 100).toFixed(1)}% rate.`;

    return {
      id: this.generateId(),
      type: 'trend',
      priority: trend.significance > 0.8 ? 'high' : 'medium',
      title,
      description,
      details: [],
      metrics: {
        impact: Math.abs(trend.rate) * 100,
        confidence: trend.significance,
        relevance: 0.8
      },
      relatedAxes: [axis],
      timestamp: Date.now(),
      language
    };
  }

  private createOverallTrendInsight(
    trend: { direction: string; significance: number; description: string },
    language: 'ko' | 'en'
  ): NLPInsight {
    const title = language === 'ko'
      ? '전체 KPI 트렌드 분석'
      : 'Overall KPI Trend Analysis';

    const description = language === 'ko'
      ? `전체적인 KPI가 ${trend.direction === 'up' ? '향상' : trend.direction === 'down' ? '하락' : '안정'} 추세를 보이고 있습니다.`
      : trend.description;

    return {
      id: this.generateId(),
      type: 'analysis',
      priority: trend.significance > 0.8 ? 'high' : 'medium',
      title,
      description,
      details: [],
      metrics: {
        impact: trend.significance * 100,
        confidence: trend.significance,
        relevance: 0.9
      },
      relatedAxes: ['GO', 'EC', 'PT', 'PF', 'TO'],
      timestamp: Date.now(),
      language
    };
  }

  private identifyWeakAxes(scores: Record<AxisKey, number>): AxisKey[] {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    return axes.filter(axis => scores[axis] < 70).sort((a, b) => scores[a] - scores[b]);
  }

  private identifyStrongAxes(scores: Record<AxisKey, number>): AxisKey[] {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    return axes.filter(axis => scores[axis] > 85);
  }

  private analyzeBalance(scores: Record<AxisKey, number>): {
    variance: number;
    weakest: AxisKey;
    strongest: AxisKey;
  } {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const values = axes.map(axis => scores[axis]);

    const min = Math.min(...values);
    const max = Math.max(...values);
    const weakest = axes[values.indexOf(min)];
    const strongest = axes[values.indexOf(max)];

    return {
      variance: max - min,
      weakest,
      strongest
    };
  }

  private predictShortTerm(context: InsightContext): {
    scores: Partial<Record<AxisKey, number>>;
    confidence: number;
    factors: string[];
  } {
    // 간단한 선형 예측 (실제로는 더 복잡한 모델 사용)
    const predictions: Partial<Record<AxisKey, number>> = {};
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

    for (const axis of axes) {
      const recent = context.historicalTrends.slice(-5).map(t => t.scores[axis]);
      if (recent.length >= 3) {
        const trend = (recent[recent.length - 1] - recent[0]) / recent.length;
        predictions[axis] = Math.max(0, Math.min(100, context.currentScores[axis] + trend * 7));
      }
    }

    return {
      scores: predictions,
      confidence: 0.75,
      factors: ['Recent trend continuation', 'Seasonal patterns']
    };
  }

  private predictMidTerm(context: InsightContext): {
    scores: Partial<Record<AxisKey, number>>;
    confidence: number;
    factors: string[];
  } {
    // 중기 예측 로직
    const predictions: Partial<Record<AxisKey, number>> = {};
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

    for (const axis of axes) {
      const values = context.historicalTrends.map(t => t.scores[axis]);
      if (values.length >= 10) {
        const avgChange = (values[values.length - 1] - values[0]) / values.length;
        predictions[axis] = Math.max(0, Math.min(100, context.currentScores[axis] + avgChange * 30));
      }
    }

    return {
      scores: predictions,
      confidence: 0.65,
      factors: ['Historical patterns', 'Momentum indicators', 'Cyclical factors']
    };
  }

  private generatePatternDetails(
    pattern: Pattern,
    currentScores: Record<AxisKey, number>,
    language: 'ko' | 'en'
  ): string[] {
    const details: string[] = [];

    if (pattern.predictedNext) {
      const prediction = pattern.predictedNext;
      details.push(
        language === 'ko'
          ? `예상 변화: ${prediction.timeframe}일 내 ${Object.entries(prediction.scores).map(([axis, score]) => `${axis}: ${score?.toFixed(1)}`).join(', ')}`
          : `Expected change: ${Object.entries(prediction.scores).map(([axis, score]) => `${axis}: ${score?.toFixed(1)}`).join(', ')} within ${prediction.timeframe} days`
      );
    }

    details.push(
      language === 'ko'
        ? `패턴 신뢰도: ${(pattern.confidence * 100).toFixed(0)}%`
        : `Pattern confidence: ${(pattern.confidence * 100).toFixed(0)}%`
    );

    return details;
  }

  private generatePatternActions(
    pattern: Pattern,
    currentScores: Record<AxisKey, number>,
    language: 'ko' | 'en'
  ): ActionItem[] {
    const actions: ActionItem[] = [];

    if (pattern.type === 'downward_trend') {
      actions.push({
        id: this.generateId(),
        text: language === 'ko'
          ? '하락 추세 원인 분석 실시'
          : 'Conduct root cause analysis for downward trend',
        type: 'immediate',
        priority: 1,
        expectedImpact: language === 'ko' ? '문제 조기 발견 및 해결' : 'Early problem detection and resolution'
      });
    }

    if (pattern.type === 'upward_trend') {
      actions.push({
        id: this.generateId(),
        text: language === 'ko'
          ? '성공 요인 파악 및 강화'
          : 'Identify and strengthen success factors',
        type: 'short_term',
        priority: 2,
        expectedImpact: language === 'ko' ? '지속적인 성장 유지' : 'Maintain continuous growth'
      });
    }

    return actions;
  }

  private generateAnomalyActions(
    axis: AxisKey,
    anomalies: AnomalyPoint[],
    currentScores: Record<AxisKey, number>,
    language: 'ko' | 'en'
  ): ActionItem[] {
    const maxSeverity = Math.max(...anomalies.map(a => a.severity));
    const actions: ActionItem[] = [];

    if (maxSeverity > 0.8) {
      actions.push({
        id: this.generateId(),
        text: language === 'ko'
          ? '즉시 원인 파악 및 대응 방안 수립'
          : 'Immediate investigation and response plan required',
        type: 'immediate',
        priority: 1,
        expectedImpact: language === 'ko' ? '리스크 최소화' : 'Risk minimization'
      });
    }

    actions.push({
      id: this.generateId(),
      text: language === 'ko'
        ? '데이터 검증 및 모니터링 강화'
        : 'Enhance data validation and monitoring',
      type: 'short_term',
      priority: 2,
      expectedImpact: language === 'ko' ? '이상 징후 조기 감지' : 'Early anomaly detection'
    });

    return actions;
  }

  private generateImprovementActions(
    axis: AxisKey,
    currentScore: number,
    context: InsightContext,
    language: 'ko' | 'en'
  ): ActionItem[] {
    const actions: ActionItem[] = [];

    // 축별 맞춤 액션
    const axisSpecificActions = this.getAxisSpecificActions(axis, currentScore, language);
    actions.push(...axisSpecificActions);

    // 일반적인 개선 액션
    if (currentScore < 60) {
      actions.push({
        id: this.generateId(),
        text: language === 'ko'
          ? '전문가 컨설팅 또는 멘토링 검토'
          : 'Consider expert consulting or mentoring',
        type: 'short_term',
        priority: 2,
        expectedImpact: language === 'ko' ? '15-20점 개선 가능' : '15-20 point improvement possible'
      });
    }

    return actions.sort((a, b) => a.priority - b.priority);
  }

  private getAxisSpecificActions(
    axis: AxisKey,
    currentScore: number,
    language: 'ko' | 'en'
  ): ActionItem[] {
    const actions: ActionItem[] = [];

    switch (axis) {
      case 'GO':
        actions.push({
          id: this.generateId(),
          text: language === 'ko'
            ? '목표 명확성 및 구체성 강화'
            : 'Enhance goal clarity and specificity',
          type: 'immediate',
          priority: 1,
          expectedImpact: language === 'ko' ? '방향성 정립' : 'Direction establishment'
        });
        break;

      case 'EC':
        actions.push({
          id: this.generateId(),
          text: language === 'ko'
            ? '수익 모델 검증 및 최적화'
            : 'Validate and optimize revenue model',
          type: 'short_term',
          priority: 1,
          expectedImpact: language === 'ko' ? '경제성 개선' : 'Economic viability improvement'
        });
        break;

      case 'PT':
        actions.push({
          id: this.generateId(),
          text: language === 'ko'
            ? '실행 계획 구체화 및 리소스 확보'
            : 'Detailed execution plan and resource securing',
          type: 'immediate',
          priority: 1,
          expectedImpact: language === 'ko' ? '실현 가능성 향상' : 'Feasibility enhancement'
        });
        break;

      case 'PF':
        actions.push({
          id: this.generateId(),
          text: language === 'ko'
            ? '미래 트렌드 분석 및 대응 전략 수립'
            : 'Future trend analysis and response strategy',
          type: 'long_term',
          priority: 2,
          expectedImpact: language === 'ko' ? '지속가능성 확보' : 'Sustainability assurance'
        });
        break;

      case 'TO':
        actions.push({
          id: this.generateId(),
          text: language === 'ko'
            ? '시장 조사 및 고객 피드백 수집'
            : 'Market research and customer feedback collection',
          type: 'immediate',
          priority: 1,
          expectedImpact: language === 'ko' ? '시장 적합성 검증' : 'Market fit validation'
        });
        break;
    }

    return actions;
  }

  private generateImprovementDetails(
    axis: AxisKey,
    context: InsightContext,
    language: 'ko' | 'en'
  ): string[] {
    const details: string[] = [];
    const historicalAvg = context.historicalTrends.length > 0
      ? context.historicalTrends.reduce((sum, t) => sum + t.scores[axis], 0) / context.historicalTrends.length
      : context.currentScores[axis];

    details.push(
      language === 'ko'
        ? `과거 평균: ${historicalAvg.toFixed(1)}점`
        : `Historical average: ${historicalAvg.toFixed(1)} points`
    );

    // 벤치마크 대비
    const benchmark = 75; // 업계 평균으로 가정
    const gap = benchmark - context.currentScores[axis];
    if (gap > 0) {
      details.push(
        language === 'ko'
          ? `업계 평균 대비 ${gap.toFixed(1)}점 부족`
          : `${gap.toFixed(1)} points below industry average`
      );
    }

    return details;
  }

  private generateStrengthDetails(
    strongAxes: AxisKey[],
    context: InsightContext,
    language: 'ko' | 'en'
  ): string[] {
    return strongAxes.map(axis => {
      const score = context.currentScores[axis];
      const axisName = this.axisDescriptions[axis][language];
      return language === 'ko'
        ? `${axisName}: ${score.toFixed(1)}점 (상위 10%)`
        : `${axisName}: ${score.toFixed(1)} points (Top 10%)`;
    });
  }

  private generateStrengthActions(
    strongAxes: AxisKey[],
    context: InsightContext,
    language: 'ko' | 'en'
  ): ActionItem[] {
    return [
      {
        id: this.generateId(),
        text: language === 'ko'
          ? '강점을 활용한 차별화 전략 수립'
          : 'Develop differentiation strategy using strengths',
        type: 'short_term',
        priority: 1,
        expectedImpact: language === 'ko' ? '경쟁 우위 확보' : 'Competitive advantage'
      },
      {
        id: this.generateId(),
        text: language === 'ko'
          ? '베스트 프랙티스 문서화 및 공유'
          : 'Document and share best practices',
        type: 'short_term',
        priority: 2,
        expectedImpact: language === 'ko' ? '조직 전체 역량 향상' : 'Organization-wide capability improvement'
      }
    ];
  }

  private generateBalanceActions(
    balance: { variance: number; weakest: AxisKey; strongest: AxisKey },
    context: InsightContext,
    language: 'ko' | 'en'
  ): ActionItem[] {
    const weakestName = this.axisDescriptions[balance.weakest][language];
    const strongestName = this.axisDescriptions[balance.strongest][language];

    return [
      {
        id: this.generateId(),
        text: language === 'ko'
          ? `${weakestName} 집중 개선 프로그램 시작`
          : `Start ${weakestName} focused improvement program`,
        type: 'immediate',
        priority: 1,
        expectedImpact: language === 'ko' ? '균형 회복' : 'Balance restoration'
      },
      {
        id: this.generateId(),
        text: language === 'ko'
          ? `${strongestName}의 성공 요인을 ${weakestName}에 적용`
          : `Apply ${strongestName} success factors to ${weakestName}`,
        type: 'short_term',
        priority: 2,
        expectedImpact: language === 'ko' ? '시너지 효과' : 'Synergy effect'
      }
    ];
  }

  private calculatePriority(pattern: Pattern): 'high' | 'medium' | 'low' {
    if (pattern.type === 'anomaly' || pattern.type === 'breakdown') return 'high';
    if (pattern.type === 'downward_trend' && pattern.confidence > 0.8) return 'high';
    if (pattern.confidence > 0.85) return 'medium';
    return 'low';
  }

  private calculateRelevance(pattern: Pattern, currentScores: Record<AxisKey, number>): number {
    // 현재 점수가 낮은 축일수록 관련성이 높음
    const avgAffectedScore = pattern.affectedAxes.reduce(
      (sum, axis) => sum + currentScores[axis], 0
    ) / pattern.affectedAxes.length;

    return 1 - (avgAffectedScore / 100);
  }

  private prioritizeInsights(insights: NLPInsight[]): NLPInsight[] {
    return insights.sort((a, b) => {
      // 우선순위별 정렬
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // 같은 우선순위면 관련성으로 정렬
      const relevanceDiff = (b.metrics?.relevance || 0) - (a.metrics?.relevance || 0);
      if (relevanceDiff !== 0) return relevanceDiff;

      // 그 다음 영향도로 정렬
      return (b.metrics?.impact || 0) - (a.metrics?.impact || 0);
    });
  }

  private generateId(): string {
    return `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 템플릿 초기화
   */
  private initializeTemplates(): void {
    // 한국어 템플릿
    this.templates.set('upward_trend_ko', {
      title: '{axes} 상승 추세',
      description: '{axes}가 {confidence}% 신뢰도로 상승 추세를 보이고 있으며, {magnitude}점 상승했습니다.'
    });

    this.templates.set('downward_trend_ko', {
      title: '{axes} 하락 추세 주의',
      description: '{axes}가 {confidence}% 신뢰도로 하락 추세를 보이고 있으며, {magnitude}점 하락했습니다.'
    });

    this.templates.set('seasonal_ko', {
      title: '계절성 패턴 발견',
      description: '{axes}에서 주기적인 패턴이 {confidence}% 신뢰도로 감지되었습니다.'
    });

    // 영어 템플릿
    this.templates.set('upward_trend_en', {
      title: '{axes} Upward Trend',
      description: '{axes} showing upward trend with {confidence}% confidence, increased by {magnitude} points.'
    });

    this.templates.set('downward_trend_en', {
      title: '{axes} Downward Trend Alert',
      description: '{axes} showing downward trend with {confidence}% confidence, decreased by {magnitude} points.'
    });

    this.templates.set('seasonal_en', {
      title: 'Seasonal Pattern Detected',
      description: 'Periodic pattern detected in {axes} with {confidence}% confidence.'
    });
  }
}

interface InsightTemplate {
  title: string;
  description: string;
}

// 싱글톤 인스턴스
let nlpEngine: NLPInsightsEngine | null = null;

export const getNLPInsightsEngine = (): NLPInsightsEngine => {
  if (!nlpEngine) {
    nlpEngine = new NLPInsightsEngine();
  }
  return nlpEngine;
};