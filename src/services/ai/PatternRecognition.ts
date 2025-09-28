/**
 * Pattern Recognition System
 * 고급 패턴 인식 및 분석 시스템
 */

import type { AxisKey } from '../../pages/startup/kpi-tabs/ResultsInsightsPanelV2/types';

export interface DataPoint {
  timestamp: number;
  scores: Record<AxisKey, number>;
  overall: number;
  metadata?: {
    source?: string;
    confidence?: number;
    userId?: string;
  };
}

export interface Pattern {
  type: PatternType;
  confidence: number;
  description: string;
  affectedAxes: AxisKey[];
  startTime: number;
  endTime: number;
  magnitude: number;
  predictedNext?: {
    scores: Partial<Record<AxisKey, number>>;
    confidence: number;
    timeframe: number;
  };
}

export type PatternType =
  | 'upward_trend'
  | 'downward_trend'
  | 'plateau'
  | 'oscillation'
  | 'seasonal'
  | 'breakout'
  | 'breakdown'
  | 'convergence'
  | 'divergence'
  | 'correlation'
  | 'anomaly';

export interface SeasonalPattern {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  amplitude: number;
  phase: number;
  confidence: number;
}

export class PatternRecognitionEngine {
  private readonly MIN_DATA_POINTS = 10;
  private readonly TREND_THRESHOLD = 0.15; // 15% 변화를 트렌드로 인식
  private readonly CORRELATION_THRESHOLD = 0.7; // 상관계수 임계값
  private readonly ANOMALY_Z_SCORE = 2.5; // 이상치 Z-score 임계값

  /**
   * 메인 패턴 분석 함수
   */
  analyzePatterns(dataPoints: DataPoint[]): Pattern[] {
    if (dataPoints.length < this.MIN_DATA_POINTS) {
      return [];
    }

    const patterns: Pattern[] = [];

    // 1. 트렌드 분석
    patterns.push(...this.detectTrends(dataPoints));

    // 2. 계절성 분석
    patterns.push(...this.detectSeasonality(dataPoints));

    // 3. 상관관계 분석
    patterns.push(...this.detectCorrelations(dataPoints));

    // 4. 이상치 탐지
    patterns.push(...this.detectAnomalies(dataPoints));

    // 5. 브레이크아웃/브레이크다운 패턴
    patterns.push(...this.detectBreakouts(dataPoints));

    // 6. 수렴/발산 패턴
    patterns.push(...this.detectConvergenceDivergence(dataPoints));

    return this.rankPatterns(patterns);
  }

  /**
   * 트렌드 감지
   */
  private detectTrends(dataPoints: DataPoint[]): Pattern[] {
    const patterns: Pattern[] = [];
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

    for (const axis of axes) {
      const values = dataPoints.map(dp => dp.scores[axis]);
      const trend = this.calculateTrend(values);

      if (Math.abs(trend.slope) > this.TREND_THRESHOLD / dataPoints.length) {
        const patternType = trend.slope > 0 ? 'upward_trend' : 'downward_trend';

        patterns.push({
          type: patternType,
          confidence: trend.r2,
          description: `${axis} 축이 ${patternType === 'upward_trend' ? '상승' : '하락'} 추세를 보이고 있습니다`,
          affectedAxes: [axis],
          startTime: dataPoints[0].timestamp,
          endTime: dataPoints[dataPoints.length - 1].timestamp,
          magnitude: Math.abs(trend.slope * dataPoints.length),
          predictedNext: {
            scores: { [axis]: values[values.length - 1] + trend.slope * 5 },
            confidence: trend.r2 * 0.8,
            timeframe: 5
          }
        });
      }

      // 정체 패턴 감지
      if (trend.r2 < 0.1 && this.calculateVariance(values) < 5) {
        patterns.push({
          type: 'plateau',
          confidence: 1 - trend.r2,
          description: `${axis} 축이 정체 상태입니다`,
          affectedAxes: [axis],
          startTime: dataPoints[Math.floor(dataPoints.length * 0.3)].timestamp,
          endTime: dataPoints[dataPoints.length - 1].timestamp,
          magnitude: this.calculateVariance(values)
        });
      }
    }

    return patterns;
  }

  /**
   * 계절성 패턴 감지
   */
  private detectSeasonality(dataPoints: DataPoint[]): Pattern[] {
    const patterns: Pattern[] = [];

    // FFT 또는 자기상관을 사용한 주기 감지 (간소화된 버전)
    const periods = [7, 14, 30, 90]; // 일, 2주, 월, 분기

    for (const period of periods) {
      if (dataPoints.length < period * 2) continue;

      const seasonality = this.calculateSeasonality(dataPoints, period);

      if (seasonality.confidence > 0.7) {
        patterns.push({
          type: 'seasonal',
          confidence: seasonality.confidence,
          description: `${this.getPeriodName(period)} 주기의 계절성 패턴이 감지되었습니다`,
          affectedAxes: seasonality.affectedAxes,
          startTime: dataPoints[0].timestamp,
          endTime: dataPoints[dataPoints.length - 1].timestamp,
          magnitude: seasonality.amplitude
        });
      }
    }

    return patterns;
  }

  /**
   * 상관관계 분석
   */
  private detectCorrelations(dataPoints: DataPoint[]): Pattern[] {
    const patterns: Pattern[] = [];
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

    for (let i = 0; i < axes.length; i++) {
      for (let j = i + 1; j < axes.length; j++) {
        const axis1 = axes[i];
        const axis2 = axes[j];

        const values1 = dataPoints.map(dp => dp.scores[axis1]);
        const values2 = dataPoints.map(dp => dp.scores[axis2]);

        const correlation = this.calculateCorrelation(values1, values2);

        if (Math.abs(correlation) > this.CORRELATION_THRESHOLD) {
          patterns.push({
            type: 'correlation',
            confidence: Math.abs(correlation),
            description: `${axis1}와 ${axis2} 간에 ${correlation > 0 ? '양' : '음'}의 상관관계가 있습니다`,
            affectedAxes: [axis1, axis2],
            startTime: dataPoints[0].timestamp,
            endTime: dataPoints[dataPoints.length - 1].timestamp,
            magnitude: Math.abs(correlation)
          });
        }
      }
    }

    return patterns;
  }

  /**
   * 이상치 탐지
   */
  private detectAnomalies(dataPoints: DataPoint[]): Pattern[] {
    const patterns: Pattern[] = [];
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

    for (const axis of axes) {
      const values = dataPoints.map(dp => dp.scores[axis]);
      const mean = this.calculateMean(values);
      const stdDev = this.calculateStdDev(values, mean);

      dataPoints.forEach((dp, index) => {
        const zScore = Math.abs((dp.scores[axis] - mean) / stdDev);

        if (zScore > this.ANOMALY_Z_SCORE) {
          patterns.push({
            type: 'anomaly',
            confidence: Math.min(zScore / 4, 1),
            description: `${axis} 축에서 비정상적인 값이 감지되었습니다`,
            affectedAxes: [axis],
            startTime: dp.timestamp,
            endTime: dp.timestamp,
            magnitude: zScore
          });
        }
      });
    }

    return patterns;
  }

  /**
   * 브레이크아웃/브레이크다운 패턴 감지
   */
  private detectBreakouts(dataPoints: DataPoint[]): Pattern[] {
    const patterns: Pattern[] = [];
    const windowSize = Math.min(20, Math.floor(dataPoints.length / 3));

    if (dataPoints.length < windowSize * 2) return patterns;

    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

    for (const axis of axes) {
      const values = dataPoints.map(dp => dp.scores[axis]);

      for (let i = windowSize; i < values.length - windowSize; i++) {
        const beforeWindow = values.slice(i - windowSize, i);
        const afterWindow = values.slice(i, i + windowSize);

        const beforeMean = this.calculateMean(beforeWindow);
        const afterMean = this.calculateMean(afterWindow);
        const beforeStdDev = this.calculateStdDev(beforeWindow, beforeMean);

        const change = afterMean - beforeMean;
        const changeRatio = Math.abs(change) / (beforeStdDev || 1);

        if (changeRatio > 2) {
          patterns.push({
            type: change > 0 ? 'breakout' : 'breakdown',
            confidence: Math.min(changeRatio / 3, 1),
            description: `${axis} 축에서 ${change > 0 ? '돌파' : '붕괴'} 패턴이 감지되었습니다`,
            affectedAxes: [axis],
            startTime: dataPoints[i - windowSize / 2].timestamp,
            endTime: dataPoints[i + windowSize / 2].timestamp,
            magnitude: Math.abs(change)
          });
        }
      }
    }

    return patterns;
  }

  /**
   * 수렴/발산 패턴 감지
   */
  private detectConvergenceDivergence(dataPoints: DataPoint[]): Pattern[] {
    const patterns: Pattern[] = [];
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

    // 축 간 거리 변화 분석
    const distances = dataPoints.map(dp => {
      const values = axes.map(axis => dp.scores[axis]);
      return this.calculateVariance(values);
    });

    const trend = this.calculateTrend(distances);

    if (Math.abs(trend.slope) > 0.5 && trend.r2 > 0.6) {
      patterns.push({
        type: trend.slope < 0 ? 'convergence' : 'divergence',
        confidence: trend.r2,
        description: `KPI 축들이 ${trend.slope < 0 ? '수렴' : '발산'}하고 있습니다`,
        affectedAxes: axes,
        startTime: dataPoints[0].timestamp,
        endTime: dataPoints[dataPoints.length - 1].timestamp,
        magnitude: Math.abs(trend.slope * dataPoints.length)
      });
    }

    return patterns;
  }

  /**
   * 선형 회귀 트렌드 계산
   */
  private calculateTrend(values: number[]): { slope: number; intercept: number; r2: number } {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // R-squared 계산
    const yMean = sumY / n;
    const ssTotal = values.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const ssResidual = values.reduce((sum, y, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(y - predicted, 2);
    }, 0);

    const r2 = 1 - (ssResidual / ssTotal);

    return { slope, intercept, r2: Math.max(0, r2) };
  }

  /**
   * 계절성 계산
   */
  private calculateSeasonality(dataPoints: DataPoint[], period: number): {
    confidence: number;
    amplitude: number;
    affectedAxes: AxisKey[];
  } {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const seasonalAxes: AxisKey[] = [];
    let totalConfidence = 0;
    let maxAmplitude = 0;

    for (const axis of axes) {
      const values = dataPoints.map(dp => dp.scores[axis]);

      // 자기상관 계산
      const autocorrelation = this.calculateAutocorrelation(values, period);

      if (autocorrelation > 0.5) {
        seasonalAxes.push(axis);
        totalConfidence += autocorrelation;

        // 진폭 계산
        const amplitude = this.calculateAmplitude(values, period);
        maxAmplitude = Math.max(maxAmplitude, amplitude);
      }
    }

    return {
      confidence: seasonalAxes.length > 0 ? totalConfidence / seasonalAxes.length : 0,
      amplitude: maxAmplitude,
      affectedAxes: seasonalAxes
    };
  }

  /**
   * 자기상관 계산
   */
  private calculateAutocorrelation(values: number[], lag: number): number {
    if (lag >= values.length) return 0;

    const n = values.length - lag;
    const mean = this.calculateMean(values);

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
    }

    for (let i = 0; i < values.length; i++) {
      denominator += Math.pow(values[i] - mean, 2);
    }

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * 진폭 계산
   */
  private calculateAmplitude(values: number[], period: number): number {
    const cycles = Math.floor(values.length / period);
    if (cycles < 1) return 0;

    let totalAmplitude = 0;

    for (let c = 0; c < cycles; c++) {
      const cycleStart = c * period;
      const cycleEnd = Math.min(cycleStart + period, values.length);
      const cycleValues = values.slice(cycleStart, cycleEnd);

      const max = Math.max(...cycleValues);
      const min = Math.min(...cycleValues);
      totalAmplitude += (max - min);
    }

    return totalAmplitude / cycles;
  }

  /**
   * 상관계수 계산
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const meanX = this.calculateMean(x);
    const meanY = this.calculateMean(y);

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }

    const denominator = Math.sqrt(denomX * denomY);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * 유틸리티 함수들
   */
  private calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateVariance(values: number[]): number {
    const mean = this.calculateMean(values);
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  private calculateStdDev(values: number[], mean?: number): number {
    const m = mean ?? this.calculateMean(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private getPeriodName(period: number): string {
    const periodMap: Record<number, string> = {
      7: '주간',
      14: '2주',
      30: '월간',
      90: '분기'
    };
    return periodMap[period] || `${period}일`;
  }

  /**
   * 패턴 우선순위 정렬
   */
  private rankPatterns(patterns: Pattern[]): Pattern[] {
    const priorityMap: Record<PatternType, number> = {
      anomaly: 10,
      breakdown: 9,
      breakout: 8,
      downward_trend: 7,
      divergence: 6,
      upward_trend: 5,
      convergence: 4,
      correlation: 3,
      seasonal: 2,
      oscillation: 1,
      plateau: 0
    };

    return patterns.sort((a, b) => {
      const priorityDiff = priorityMap[b.type] - priorityMap[a.type];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
  }
}

// 싱글톤 인스턴스
let patternRecognitionEngine: PatternRecognitionEngine | null = null;

/**
 * 패턴 인식 엔진 인스턴스 가져오기
 */
export function getPatternRecognitionEngine(): PatternRecognitionEngine {
  if (!patternRecognitionEngine) {
    patternRecognitionEngine = new PatternRecognitionEngine();
  }
  return patternRecognitionEngine;
}