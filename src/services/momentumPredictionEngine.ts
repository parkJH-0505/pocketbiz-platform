/**
 * Momentum Prediction Engine
 *
 * AI 기반 모멘텀 예측 엔진
 * 과거 패턴과 현재 상태를 분석하여 미래 모멘텀을 예측
 */

import type { MomentumPrediction, EmotionDataPoint } from '../types/analytics.types';
import type { MomentumData } from './momentumEngine';
import { emotionAnalyticsEngine } from './emotionAnalyticsEngine';

export class MomentumPredictionEngine {
  private readonly MIN_DATA_POINTS = 30; // 최소 필요 데이터
  private readonly PREDICTION_HOURS = 24; // 예측 시간 범위

  /**
   * 다음 24시간 모멘텀 예측
   */
  async predictNext24Hours(): Promise<MomentumPrediction[]> {
    const analysis = emotionAnalyticsEngine.analyzePatterns('30d');

    if (analysis.dataPoints.length < this.MIN_DATA_POINTS) {
      return this.getDefaultPredictions();
    }

    const predictions: MomentumPrediction[] = [];
    const now = new Date();

    for (let hours = 1; hours <= this.PREDICTION_HOURS; hours += 3) {
      const targetTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
      const prediction = this.predictForTime(targetTime, analysis.dataPoints);
      predictions.push(prediction);
    }

    return predictions;
  }

  /**
   * 특정 시간의 모멘텀 예측
   */
  private predictForTime(
    targetTime: Date,
    historicalData: EmotionDataPoint[]
  ): MomentumPrediction {
    const hour = targetTime.getHours();
    const dayOfWeek = targetTime.getDay();

    // 1. 과거 패턴 분석 (같은 시간대, 같은 요일)
    const historicalPattern = this.analyzeHistoricalPattern(
      historicalData,
      hour,
      dayOfWeek
    );

    // 2. 최근 트렌드 분석
    const recentTrend = this.analyzeRecentTrend(historicalData);

    // 3. 주기적 패턴 분석 (일간, 주간)
    const cyclicalPattern = this.analyzeCyclicalPattern(
      historicalData,
      hour,
      dayOfWeek
    );

    // 4. 외부 요인 (현재는 간단한 시간대 기반)
    const externalFactors = this.analyzeExternalFactors(targetTime);

    // 가중 평균으로 예측값 계산
    const weights = {
      historical: 0.4,
      trend: 0.3,
      cyclical: 0.2,
      external: 0.1
    };

    const predictedScore =
      historicalPattern.score * weights.historical +
      recentTrend.score * weights.trend +
      cyclicalPattern.score * weights.cyclical +
      externalFactors.score * weights.external;

    // 신뢰도 계산
    const confidence = this.calculateConfidence(
      historicalPattern.confidence,
      recentTrend.confidence,
      cyclicalPattern.confidence
    );

    // 예측 이유 생성
    const reasoning = this.generateReasoning(
      predictedScore,
      historicalPattern,
      recentTrend,
      cyclicalPattern
    );

    return {
      timestamp: targetTime,
      predictedScore: Math.max(0, Math.min(100, predictedScore)),
      confidence,
      factors: {
        historicalPattern: historicalPattern.score,
        recentTrend: recentTrend.score,
        cyclicalPattern: cyclicalPattern.score,
        externalFactors: externalFactors.score
      },
      reasoning
    };
  }

  /**
   * 과거 패턴 분석
   */
  private analyzeHistoricalPattern(
    data: EmotionDataPoint[],
    hour: number,
    dayOfWeek: number
  ): { score: number; confidence: number } {
    const relevantData = data.filter(point => {
      const date = new Date(point.timestamp);
      return date.getHours() === hour && date.getDay() === dayOfWeek;
    });

    if (relevantData.length === 0) {
      return { score: 50, confidence: 0 };
    }

    const avgScore = this.average(relevantData.map(p => p.momentumScore));
    const confidence = Math.min(95, relevantData.length * 10);

    return { score: avgScore, confidence };
  }

  /**
   * 최근 트렌드 분석
   */
  private analyzeRecentTrend(
    data: EmotionDataPoint[]
  ): { score: number; confidence: number; direction: string } {
    const recentDays = 7;
    const now = new Date();
    const cutoff = new Date(now.getTime() - recentDays * 24 * 60 * 60 * 1000);

    const recentData = data
      .filter(p => new Date(p.timestamp) >= cutoff)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (recentData.length < 5) {
      return { score: 50, confidence: 0, direction: 'stable' };
    }

    // 선형 회귀로 트렌드 계산
    const trend = this.calculateLinearTrend(recentData.map(p => p.momentumScore));

    // 트렌드를 기반으로 예측값 계산
    const lastScore = recentData[recentData.length - 1].momentumScore;
    const predictedScore = lastScore + trend.slope * 3; // 3시간 후 예측

    return {
      score: Math.max(0, Math.min(100, predictedScore)),
      confidence: Math.min(80, recentData.length * 5),
      direction: trend.slope > 0.5 ? 'rising' : trend.slope < -0.5 ? 'falling' : 'stable'
    };
  }

  /**
   * 주기적 패턴 분석
   */
  private analyzeCyclicalPattern(
    data: EmotionDataPoint[],
    hour: number,
    dayOfWeek: number
  ): { score: number; confidence: number; pattern: string } {
    // 시간대별 평균
    const hourlyAvg = this.getHourlyAverage(data, hour);

    // 요일별 평균
    const dailyAvg = this.getDailyAverage(data, dayOfWeek);

    // 전체 평균
    const overallAvg = this.average(data.map(p => p.momentumScore));

    // 가중 평균
    const score = hourlyAvg * 0.6 + dailyAvg * 0.3 + overallAvg * 0.1;

    // 패턴 식별
    let pattern = 'normal';
    if (hour >= 9 && hour <= 11) pattern = 'morning_peak';
    else if (hour >= 14 && hour <= 16) pattern = 'afternoon_slump';
    else if (hour >= 20 && hour <= 22) pattern = 'evening_recovery';
    else if (hour >= 0 && hour <= 6) pattern = 'night_low';

    return {
      score,
      confidence: 70,
      pattern
    };
  }

  /**
   * 외부 요인 분석
   */
  private analyzeExternalFactors(
    targetTime: Date
  ): { score: number; factors: string[] } {
    const hour = targetTime.getHours();
    const day = targetTime.getDay();
    const factors: string[] = [];
    let score = 50;

    // 주말 보너스
    if (day === 0 || day === 6) {
      score += 5;
      factors.push('weekend');
    }

    // 골든 타임 (오전 9-11시)
    if (hour >= 9 && hour <= 11) {
      score += 10;
      factors.push('golden_hour');
    }

    // 심야 패널티
    if (hour >= 0 && hour <= 5) {
      score -= 15;
      factors.push('late_night');
    }

    // 점심 후 슬럼프
    if (hour >= 14 && hour <= 15) {
      score -= 5;
      factors.push('post_lunch');
    }

    return { score, factors };
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(
    historicalConf: number,
    trendConf: number,
    cyclicalConf: number
  ): number {
    const weights = { historical: 0.5, trend: 0.3, cyclical: 0.2 };

    const weightedConf =
      historicalConf * weights.historical +
      trendConf * weights.trend +
      cyclicalConf * weights.cyclical;

    return Math.round(Math.min(95, weightedConf));
  }

  /**
   * 예측 이유 생성
   */
  private generateReasoning(
    predictedScore: number,
    historical: any,
    trend: any,
    cyclical: any
  ): string[] {
    const reasons: string[] = [];

    if (predictedScore >= 80) {
      reasons.push('🚀 높은 모멘텀이 예상됩니다');
    } else if (predictedScore >= 60) {
      reasons.push('✨ 양호한 모멘텀이 유지될 것으로 보입니다');
    } else if (predictedScore >= 40) {
      reasons.push('⚡ 보통 수준의 모멘텀이 예상됩니다');
    } else {
      reasons.push('💤 낮은 모멘텀이 예상됩니다');
    }

    if (trend.direction === 'rising') {
      reasons.push('📈 최근 상승 트렌드가 지속될 것으로 예측');
    } else if (trend.direction === 'falling') {
      reasons.push('📉 최근 하락 트렌드 영향 가능성');
    }

    if (cyclical.pattern === 'morning_peak') {
      reasons.push('🌅 오전 골든타임 효과');
    } else if (cyclical.pattern === 'afternoon_slump') {
      reasons.push('😴 오후 슬럼프 시간대');
    }

    if (historical.confidence > 70) {
      reasons.push(`📊 과거 같은 시간대 평균: ${Math.round(historical.score)}점`);
    }

    return reasons;
  }

  /**
   * 유틸리티 함수들
   */
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  private getHourlyAverage(data: EmotionDataPoint[], hour: number): number {
    const hourlyData = data.filter(p =>
      new Date(p.timestamp).getHours() === hour
    );
    return this.average(hourlyData.map(p => p.momentumScore));
  }

  private getDailyAverage(data: EmotionDataPoint[], dayOfWeek: number): number {
    const dailyData = data.filter(p =>
      new Date(p.timestamp).getDay() === dayOfWeek
    );
    return this.average(dailyData.map(p => p.momentumScore));
  }

  private calculateLinearTrend(values: number[]): { slope: number; intercept: number } {
    const n = values.length;
    if (n < 2) return { slope: 0, intercept: values[0] || 0 };

    const indices = Array.from({ length: n }, (_, i) => i);
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  private getDefaultPredictions(): MomentumPrediction[] {
    const predictions: MomentumPrediction[] = [];
    const now = new Date();

    for (let hours = 1; hours <= 24; hours += 3) {
      const targetTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
      predictions.push({
        timestamp: targetTime,
        predictedScore: 50 + Math.random() * 20,
        confidence: 30,
        factors: {
          historicalPattern: 50,
          recentTrend: 50,
          cyclicalPattern: 50,
          externalFactors: 50
        },
        reasoning: ['데이터가 충분히 수집되면 더 정확한 예측이 가능합니다']
      });
    }

    return predictions;
  }

  /**
   * 단일 예측 (다음 시간)
   */
  async predictNextHour(): Promise<MomentumPrediction> {
    const predictions = await this.predictNext24Hours();
    return predictions[0];
  }

  /**
   * 최적 시간 추천
   */
  async recommendBestTimes(): Promise<{
    bestTime: Date;
    score: number;
    reason: string;
  }[]> {
    const predictions = await this.predictNext24Hours();

    // 상위 3개 시간대 선택
    const sorted = [...predictions].sort((a, b) => b.predictedScore - a.predictedScore);
    const top3 = sorted.slice(0, 3);

    return top3.map(p => ({
      bestTime: p.timestamp,
      score: p.predictedScore,
      reason: p.reasoning[0] || '높은 생산성 예상'
    }));
  }
}

// 싱글톤 인스턴스
export const momentumPredictionEngine = new MomentumPredictionEngine();