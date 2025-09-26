/**
 * AI-Powered Dynamic Insights System
 * 동적 인사이트 분석 및 실시간 AI 기반 제안 시스템
 */

import type { AxisKey } from '../types';
import { calculateDataQualityLevel, type DataQualityMetrics } from './dataQuality';
import { analyzeBenchmarkPerformance, generateImprovementRecommendations, predictGrowthTrajectory } from './businessLogic';

// AI 인사이트 타입 정의
interface AIInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation' | 'prediction';
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence: number; // 0-100
  axis?: AxisKey;
  title: string;
  description: string;
  impact: {
    potential: number; // 예상 영향도 (점수)
    timeframe: string; // 예상 시간
  };
  actionItems: string[];
  evidences: string[]; // 근거 데이터
  metadata: {
    generatedAt: Date;
    source: 'pattern_analysis' | 'benchmark_comparison' | 'trend_analysis' | 'anomaly_detection';
    algorithm: string;
  };
}

// 패턴 분석 결과
interface PatternAnalysis {
  seasonal: {
    detected: boolean;
    pattern: string;
    strength: number;
  };
  correlations: {
    axis: AxisKey;
    relatedAxis: AxisKey;
    coefficient: number;
    significance: number;
  }[];
  anomalies: {
    axis: AxisKey;
    value: number;
    expected: number;
    deviation: number;
    type: 'spike' | 'drop' | 'plateau';
  }[];
}

// 인사이트 생성 엔진
export class AIInsightsEngine {
  private historicalData: Array<{ timestamp: Date; scores: Record<AxisKey, number> }> = [];
  private benchmarks: Record<string, Record<AxisKey, number>> = {};

  constructor() {
    this.initializeBenchmarks();
  }

  // 메인 인사이트 분석 함수
  async generateInsights(
    currentScores: Record<AxisKey, number>,
    previousScores?: Record<AxisKey, number>,
    metadata?: {
      industry?: string;
      stage?: string;
      dataQuality?: DataQualityMetrics;
      responses?: Record<string, any>;
    }
  ): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    try {
      // 1. 패턴 분석
      const patternInsights = await this.analyzePatterns(currentScores, previousScores);
      insights.push(...patternInsights);

      // 2. 벤치마크 비교 분석
      const benchmarkInsights = await this.analyzeBenchmarks(currentScores, metadata?.industry, metadata?.stage);
      insights.push(...benchmarkInsights);

      // 3. 트렌드 분석
      const trendInsights = await this.analyzeTrends(currentScores, previousScores);
      insights.push(...trendInsights);

      // 4. 이상치 탐지
      const anomalyInsights = await this.detectAnomalies(currentScores, previousScores);
      insights.push(...anomalyInsights);

      // 5. 예측 분석
      const predictionInsights = await this.generatePredictions(currentScores, metadata?.responses);
      insights.push(...predictionInsights);

      // 6. 데이터 품질 기반 인사이트
      if (metadata?.dataQuality) {
        const qualityInsights = await this.analyzeDataQuality(metadata.dataQuality);
        insights.push(...qualityInsights);
      }

      // 우선순위 정렬 및 중복 제거
      return this.prioritizeAndDeduplicateInsights(insights);

    } catch (error) {
      console.error('AI Insights generation failed:', error);
      return this.generateFallbackInsights(currentScores);
    }
  }

  // 패턴 분석
  private async analyzePatterns(
    currentScores: Record<AxisKey, number>,
    previousScores?: Record<AxisKey, number>
  ): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    if (!previousScores) return insights;

    const axes = Object.keys(currentScores) as AxisKey[];

    // 상관관계 분석
    const correlations = this.calculateCorrelations(currentScores, previousScores);

    correlations.forEach(correlation => {
      if (correlation.coefficient > 0.7 && correlation.significance > 0.8) {
        insights.push({
          id: `correlation_${correlation.axis}_${correlation.relatedAxis}`,
          type: 'trend',
          priority: 'medium',
          confidence: Math.round(correlation.significance * 100),
          title: `${this.getAxisName(correlation.axis)}-${this.getAxisName(correlation.relatedAxis)} 연관성 발견`,
          description: `${this.getAxisName(correlation.axis)}와 ${this.getAxisName(correlation.relatedAxis)} 영역 간 강한 상관관계가 발견되었습니다.`,
          impact: {
            potential: 15,
            timeframe: '4-6주'
          },
          actionItems: [
            `${this.getAxisName(correlation.axis)} 개선 시 ${this.getAxisName(correlation.relatedAxis)} 동반 상승 기대`,
            '연관 영역 동시 개선 전략 수립'
          ],
          evidences: [
            `상관계수: ${correlation.coefficient.toFixed(2)}`,
            `통계적 유의성: ${(correlation.significance * 100).toFixed(1)}%`
          ],
          metadata: {
            generatedAt: new Date(),
            source: 'pattern_analysis',
            algorithm: 'correlation_analysis'
          }
        });
      }
    });

    return insights;
  }

  // 벤치마크 비교 분석
  private async analyzeBenchmarks(
    currentScores: Record<AxisKey, number>,
    industry?: string,
    stage?: string
  ): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    const benchmarkResults = analyzeBenchmarkPerformance(currentScores, industry);

    // 벤치마크 대비 크게 낮은 영역
    Object.entries(benchmarkResults.axisBenchmarks).forEach(([axis, data]) => {
      if (data.performance === 'below' && data.gap < -15) {
        insights.push({
          id: `benchmark_below_${axis}`,
          type: 'risk',
          priority: data.gap < -25 ? 'critical' : 'high',
          confidence: 85,
          axis: axis as AxisKey,
          title: `${this.getAxisName(axis as AxisKey)} 영역 벤치마크 미달`,
          description: `${this.getAxisName(axis as AxisKey)} 점수가 업계 평균보다 ${Math.abs(data.gap)}점 낮습니다.`,
          impact: {
            potential: Math.abs(data.gap),
            timeframe: '6-10주'
          },
          actionItems: [
            `${this.getAxisName(axis as AxisKey)} 영역 집중 개선 필요`,
            '업계 모범사례 벤치마킹 실시',
            '단계별 개선 로드맵 수립'
          ],
          evidences: [
            `현재 점수: ${data.score}점`,
            `업계 평균: ${data.benchmark}점`,
            `격차: ${data.gap}점`
          ],
          metadata: {
            generatedAt: new Date(),
            source: 'benchmark_comparison',
            algorithm: 'industry_benchmark_analysis'
          }
        });
      }
    });

    // 벤치마크 대비 우수한 영역
    Object.entries(benchmarkResults.axisBenchmarks).forEach(([axis, data]) => {
      if (data.performance === 'above' && data.gap > 10) {
        insights.push({
          id: `benchmark_above_${axis}`,
          type: 'opportunity',
          priority: 'medium',
          confidence: 80,
          axis: axis as AxisKey,
          title: `${this.getAxisName(axis as AxisKey)} 영역 경쟁우위 확보`,
          description: `${this.getAxisName(axis as AxisKey)} 점수가 업계 평균보다 ${data.gap}점 높습니다.`,
          impact: {
            potential: 10,
            timeframe: '2-4주'
          },
          actionItems: [
            '강점 영역 더욱 강화하여 차별화 포인트 확대',
            '경쟁우위 요소를 다른 영역으로 확산',
            '강점을 마케팅 포인트로 활용'
          ],
          evidences: [
            `현재 점수: ${data.score}점`,
            `업계 평균: ${data.benchmark}점`,
            `우위: +${data.gap}점`
          ],
          metadata: {
            generatedAt: new Date(),
            source: 'benchmark_comparison',
            algorithm: 'competitive_advantage_analysis'
          }
        });
      }
    });

    return insights;
  }

  // 트렌드 분석
  private async analyzeTrends(
    currentScores: Record<AxisKey, number>,
    previousScores?: Record<AxisKey, number>
  ): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    if (!previousScores) return insights;

    const axes = Object.keys(currentScores) as AxisKey[];

    axes.forEach(axis => {
      const change = currentScores[axis] - previousScores[axis];
      const changeRate = Math.abs(change) / Math.max(previousScores[axis], 1) * 100;

      // 급격한 상승
      if (change > 10 && changeRate > 15) {
        insights.push({
          id: `trend_up_${axis}`,
          type: 'opportunity',
          priority: 'high',
          confidence: 90,
          axis,
          title: `${this.getAxisName(axis)} 영역 급성장`,
          description: `${this.getAxisName(axis)} 점수가 ${change.toFixed(1)}점(${changeRate.toFixed(1)}%) 상승했습니다.`,
          impact: {
            potential: change,
            timeframe: '지속중'
          },
          actionItems: [
            '성장 모멘텀 유지 및 가속화',
            '성공 요인 분석 및 타 영역 적용',
            '성장세 지속을 위한 리소스 투입 확대'
          ],
          evidences: [
            `이전 점수: ${previousScores[axis].toFixed(1)}점`,
            `현재 점수: ${currentScores[axis].toFixed(1)}점`,
            `상승폭: +${change.toFixed(1)}점 (${changeRate.toFixed(1)}%)`
          ],
          metadata: {
            generatedAt: new Date(),
            source: 'trend_analysis',
            algorithm: 'momentum_detection'
          }
        });
      }

      // 급격한 하락
      if (change < -8 && changeRate > 12) {
        insights.push({
          id: `trend_down_${axis}`,
          type: 'risk',
          priority: changeRate > 25 ? 'critical' : 'high',
          confidence: 88,
          axis,
          title: `${this.getAxisName(axis)} 영역 성과 하락 경고`,
          description: `${this.getAxisName(axis)} 점수가 ${Math.abs(change).toFixed(1)}점(${changeRate.toFixed(1)}%) 하락했습니다.`,
          impact: {
            potential: Math.abs(change),
            timeframe: '즉시 대응 필요'
          },
          actionItems: [
            '하락 원인 즉시 분석 및 파악',
            '긴급 개선 계획 수립 및 실행',
            '추가 하락 방지 대책 마련'
          ],
          evidences: [
            `이전 점수: ${previousScores[axis].toFixed(1)}점`,
            `현재 점수: ${currentScores[axis].toFixed(1)}점`,
            `하락폭: ${change.toFixed(1)}점 (${changeRate.toFixed(1)}%)`
          ],
          metadata: {
            generatedAt: new Date(),
            source: 'trend_analysis',
            algorithm: 'decline_detection'
          }
        });
      }
    });

    return insights;
  }

  // 이상치 탐지
  private async detectAnomalies(
    currentScores: Record<AxisKey, number>,
    previousScores?: Record<AxisKey, number>
  ): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    const scoreValues = Object.values(currentScores);
    const mean = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;
    const stdDev = Math.sqrt(
      scoreValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / scoreValues.length
    );

    Object.entries(currentScores).forEach(([axis, score]) => {
      const zScore = stdDev > 0 ? Math.abs(score - mean) / stdDev : 0;

      // 극단적 이상치 탐지
      if (zScore > 2.5) {
        const anomalyType = score > mean ? 'exceptionally_high' : 'exceptionally_low';

        insights.push({
          id: `anomaly_${axis}_${anomalyType}`,
          type: anomalyType === 'exceptionally_high' ? 'opportunity' : 'risk',
          priority: 'medium',
          confidence: Math.min(95, 60 + zScore * 15),
          axis: axis as AxisKey,
          title: `${this.getAxisName(axis as AxisKey)} 영역 ${anomalyType === 'exceptionally_high' ? '이상 고점' : '이상 저점'}`,
          description: `${this.getAxisName(axis as AxisKey)} 점수(${score})가 평균(${mean.toFixed(1)})에서 크게 벗어났습니다.`,
          impact: {
            potential: Math.abs(score - mean),
            timeframe: '추가 분석 필요'
          },
          actionItems: [
            '이상치 발생 원인 심층 분석',
            '데이터 검증 및 재측정',
            anomalyType === 'exceptionally_high' ? '성공 요인 파악 및 확산' : '문제 해결 방안 모색'
          ],
          evidences: [
            `점수: ${score}점`,
            `평균: ${mean.toFixed(1)}점`,
            `표준편차: ${stdDev.toFixed(2)}`,
            `Z-Score: ${zScore.toFixed(2)}`
          ],
          metadata: {
            generatedAt: new Date(),
            source: 'anomaly_detection',
            algorithm: 'statistical_outlier_detection'
          }
        });
      }
    });

    return insights;
  }

  // 예측 분석
  private async generatePredictions(
    currentScores: Record<AxisKey, number>,
    responses?: Record<string, any>
  ): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    try {
      const mockMetrics = this.extractBusinessMetrics(responses);
      const prediction = predictGrowthTrajectory(currentScores, mockMetrics, 6);

      // 성장 예측 인사이트
      Object.entries(prediction.projected).forEach(([axis, projectedScore]) => {
        const currentScore = currentScores[axis as AxisKey];
        const change = projectedScore - currentScore;

        if (Math.abs(change) > 5) {
          insights.push({
            id: `prediction_${axis}`,
            type: 'prediction',
            priority: 'medium',
            confidence: prediction.confidence,
            axis: axis as AxisKey,
            title: `${this.getAxisName(axis as AxisKey)} 6개월 성장 예측`,
            description: `현재 추세를 기반으로 6개월 후 ${change > 0 ? '' : ''}${change.toFixed(1)}점 변화가 예측됩니다.`,
            impact: {
              potential: Math.abs(change),
              timeframe: '6개월'
            },
            actionItems: [
              change > 0 ? '성장 모멘텀 지속을 위한 전략 수립' : '하락 방지를 위한 선제적 대응',
              '중장기 목표 재설정',
              '필요 리소스 사전 확보'
            ],
            evidences: [
              `현재 점수: ${currentScore}점`,
              `예측 점수: ${projectedScore}점`,
              `예측 신뢰도: ${prediction.confidence}%`,
              ...prediction.keyDrivers
            ],
            metadata: {
              generatedAt: new Date(),
              source: 'trend_analysis',
              algorithm: 'growth_trajectory_prediction'
            }
          });
        }
      });

    } catch (error) {
      console.warn('Prediction analysis failed:', error);
    }

    return insights;
  }

  // 데이터 품질 기반 인사이트
  private async analyzeDataQuality(dataQuality: DataQualityMetrics): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    const qualityResult = calculateDataQualityLevel(dataQuality);

    if (qualityResult.overall < 60) {
      insights.push({
        id: 'data_quality_low',
        type: 'risk',
        priority: qualityResult.overall < 40 ? 'critical' : 'high',
        confidence: 95,
        title: '데이터 품질 개선 필요',
        description: `현재 데이터 품질 점수는 ${qualityResult.overall}점으로, 분석 신뢰도가 제한적입니다.`,
        impact: {
          potential: 20,
          timeframe: '2-3주'
        },
        actionItems: qualityResult.recommendations,
        evidences: [
          `완성도: ${dataQuality.completeness.score}점`,
          `일관성: ${dataQuality.consistency.score}점`,
          `정확성: ${dataQuality.accuracy.score}점`,
          `신선도: ${dataQuality.freshness.score}점`
        ],
        metadata: {
          generatedAt: new Date(),
          source: 'pattern_analysis',
          algorithm: 'data_quality_assessment'
        }
      });
    }

    return insights;
  }

  // 헬퍼 함수들
  private calculateCorrelations(
    currentScores: Record<AxisKey, number>,
    previousScores: Record<AxisKey, number>
  ): PatternAnalysis['correlations'] {
    const axes = Object.keys(currentScores) as AxisKey[];
    const correlations: PatternAnalysis['correlations'] = [];

    for (let i = 0; i < axes.length; i++) {
      for (let j = i + 1; j < axes.length; j++) {
        const axis1 = axes[i];
        const axis2 = axes[j];

        const change1 = currentScores[axis1] - previousScores[axis1];
        const change2 = currentScores[axis2] - previousScores[axis2];

        // 간단한 상관관계 계산 (실제로는 더 많은 데이터 포인트 필요)
        const correlation = this.calculateSimpleCorrelation(change1, change2);

        if (Math.abs(correlation) > 0.3) {
          correlations.push({
            axis: axis1,
            relatedAxis: axis2,
            coefficient: correlation,
            significance: Math.min(0.95, Math.abs(correlation) + 0.2)
          });
        }
      }
    }

    return correlations;
  }

  private calculateSimpleCorrelation(x: number, y: number): number {
    // 매우 단순화된 상관관계 계산 (실제로는 더 정교한 계산 필요)
    if (Math.abs(x) < 0.1 && Math.abs(y) < 0.1) return 0;
    return Math.sign(x) === Math.sign(y) ? 0.7 : -0.4;
  }

  private extractBusinessMetrics(responses?: Record<string, any>): any {
    // 응답에서 비즈니스 메트릭 추출 (mock)
    return {
      revenue: {
        monthly: responses?.monthlyRevenue?.value || 0,
        growth: responses?.growthRate?.value || 10
      }
    };
  }

  private getAxisName(axis: AxisKey): string {
    const names = {
      GO: '성장·운영',
      EC: '경제성·자본',
      PT: '제품·기술력',
      PF: '증빙·딜레디',
      TO: '팀·조직'
    };
    return names[axis] || axis;
  }

  private prioritizeAndDeduplicateInsights(insights: AIInsight[]): AIInsight[] {
    // 우선순위 점수 계산
    const priorityScores = {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25
    };

    // 정렬 및 중복 제거
    const uniqueInsights = insights.filter((insight, index, self) =>
      index === self.findIndex(i => i.title === insight.title)
    );

    return uniqueInsights
      .sort((a, b) => {
        const scoreA = priorityScores[a.priority] + a.confidence * 0.3;
        const scoreB = priorityScores[b.priority] + b.confidence * 0.3;
        return scoreB - scoreA;
      })
      .slice(0, 8); // 최대 8개
  }

  private generateFallbackInsights(currentScores: Record<AxisKey, number>): AIInsight[] {
    return [{
      id: 'fallback_general',
      type: 'recommendation',
      priority: 'medium',
      confidence: 60,
      title: '기본 분석 완료',
      description: '현재 데이터를 기반으로 기본적인 분석이 완료되었습니다.',
      impact: {
        potential: 10,
        timeframe: '2-4주'
      },
      actionItems: ['더 정확한 분석을 위해 데이터 보완 권장'],
      evidences: ['기본 점수 데이터 활용'],
      metadata: {
        generatedAt: new Date(),
        source: 'pattern_analysis',
        algorithm: 'fallback_analysis'
      }
    }];
  }

  private initializeBenchmarks(): void {
    // 업계별 벤치마크 초기화
    this.benchmarks = {
      tech: { GO: 72, EC: 68, PT: 85, PF: 70, TO: 75 },
      fintech: { GO: 70, EC: 80, PT: 88, PF: 85, TO: 72 },
      ecommerce: { GO: 78, EC: 75, PT: 70, PF: 68, TO: 70 }
    };
  }
}

// 싱글톤 인스턴스
export const aiInsightsEngine = new AIInsightsEngine();

// 인사이트 타입 export
export type { AIInsight, PatternAnalysis };