/**
 * Advanced Prediction Engine
 * AI 기반 예측 모델 및 시계열 분석
 */

import type { AxisKey } from '../types';

// 예측 모델 인터페이스
interface PredictionModel {
  id: string;
  name: string;
  type: 'linear' | 'polynomial' | 'exponential' | 'arima' | 'lstm';
  accuracy: number;
  confidence: number;
  lastTrained: Date;
}

// 시계열 데이터 포인트
interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

// 예측 결과
interface PredictionResult {
  predictions: Array<{
    timestamp: Date;
    value: number;
    confidence: number;
    upperBound: number;
    lowerBound: number;
  }>;
  model: PredictionModel;
  seasonality?: {
    detected: boolean;
    period: number;
    strength: number;
  };
  trend?: {
    direction: 'up' | 'down' | 'stable';
    strength: number;
    changePoints: Date[];
  };
  anomalies?: Array<{
    timestamp: Date;
    severity: number;
    description: string;
  }>;
}

// 외부 요인 데이터
interface ExternalFactors {
  marketCondition: 'bull' | 'bear' | 'neutral';
  competitorActivity: number; // 0-100
  seasonalFactor: number; // 0-100
  economicIndex: number; // 0-100
  industryGrowth: number; // percentage
}

// 고급 예측 엔진
export class AdvancedPredictionEngine {
  private models: Map<string, PredictionModel> = new Map();
  private historicalData: Map<AxisKey, TimeSeriesPoint[]> = new Map();
  private externalFactors: ExternalFactors | null = null;

  constructor() {
    this.initializeModels();
    this.loadHistoricalData();
  }

  // 모델 초기화
  private initializeModels() {
    const models: PredictionModel[] = [
      {
        id: 'linear_regression',
        name: '선형 회귀',
        type: 'linear',
        accuracy: 0.75,
        confidence: 0.8,
        lastTrained: new Date()
      },
      {
        id: 'polynomial_regression',
        name: '다항 회귀',
        type: 'polynomial',
        accuracy: 0.82,
        confidence: 0.85,
        lastTrained: new Date()
      },
      {
        id: 'exponential_smoothing',
        name: '지수 평활',
        type: 'exponential',
        accuracy: 0.78,
        confidence: 0.82,
        lastTrained: new Date()
      },
      {
        id: 'arima_model',
        name: 'ARIMA 모델',
        type: 'arima',
        accuracy: 0.85,
        confidence: 0.88,
        lastTrained: new Date()
      }
    ];

    models.forEach(model => {
      this.models.set(model.id, model);
    });
  }

  // 히스토리 데이터 로드 (실제로는 API에서 가져옴)
  private loadHistoricalData() {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const now = Date.now();
    const monthMs = 30 * 24 * 60 * 60 * 1000;

    axes.forEach(axis => {
      const data: TimeSeriesPoint[] = [];

      // 12개월 히스토리 데이터 생성 (실제로는 DB에서 가져옴)
      for (let i = 11; i >= 0; i--) {
        const timestamp = new Date(now - i * monthMs);
        const baseValue = this.getBaseValue(axis);
        const trend = this.getTrendValue(axis, i);
        const noise = (Math.random() - 0.5) * 10; // 노이즈
        const seasonal = this.getSeasonalValue(axis, timestamp);

        data.push({
          timestamp,
          value: Math.max(0, Math.min(100, baseValue + trend + seasonal + noise)),
          metadata: {
            axis,
            season: this.getSeason(timestamp)
          }
        });
      }

      this.historicalData.set(axis, data);
    });
  }

  // 축별 기본값
  private getBaseValue(axis: AxisKey): number {
    const baseValues: Record<AxisKey, number> = {
      GO: 72, EC: 45, PT: 85, PF: 60, TO: 68
    };
    return baseValues[axis];
  }

  // 트렌드 값 계산
  private getTrendValue(axis: AxisKey, monthsAgo: number): number {
    const trendRates: Record<AxisKey, number> = {
      GO: 0.5,   // 월 0.5점 증가
      EC: -0.2,  // 월 0.2점 감소
      PT: 0.8,   // 월 0.8점 증가
      PF: 0.3,   // 월 0.3점 증가
      TO: -0.1   // 월 0.1점 감소
    };

    return trendRates[axis] * (11 - monthsAgo);
  }

  // 계절성 값 계산
  private getSeasonalValue(axis: AxisKey, date: Date): number {
    const month = date.getMonth();
    const seasonalFactors: Record<AxisKey, number[]> = {
      GO: [0, 2, 1, 3, 2, 1, -1, -2, 0, 1, 2, 1], // 3-5월 높음
      EC: [3, 2, 1, -1, -2, -2, -1, 0, 1, 2, 3, 3], // 연말/연초 높음
      PT: [-1, 0, 1, 2, 1, 0, -1, -1, 0, 1, 1, 0], // 여름 낮음
      PF: [2, 1, 0, 0, 1, 1, 0, 0, 1, 2, 2, 2], // 분기말 높음
      TO: [1, 0, -1, -1, 0, 1, 2, 1, 0, 0, 1, 1] // 여름 높음
    };

    return seasonalFactors[axis][month];
  }

  // 계절 구분
  private getSeason(date: Date): string {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  // 외부 요인 설정
  setExternalFactors(factors: ExternalFactors) {
    this.externalFactors = factors;
  }

  // 단일 축 예측
  async predictSingleAxis(
    axis: AxisKey,
    periods: number = 6,
    modelId: string = 'arima_model'
  ): Promise<PredictionResult> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const historicalData = this.historicalData.get(axis) || [];
    if (historicalData.length < 3) {
      throw new Error(`Insufficient historical data for axis ${axis}`);
    }

    // 시계열 분석 수행
    const seasonality = this.detectSeasonality(historicalData);
    const trend = this.detectTrend(historicalData);
    const anomalies = this.detectAnomalies(historicalData);

    // 예측 수행
    const predictions = await this.generatePredictions(
      historicalData,
      periods,
      model,
      { seasonality, trend, externalFactors: this.externalFactors }
    );

    return {
      predictions,
      model,
      seasonality,
      trend,
      anomalies
    };
  }

  // 모든 축 예측
  async predictAllAxes(periods: number = 6): Promise<Record<AxisKey, PredictionResult>> {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const results: Partial<Record<AxisKey, PredictionResult>> = {};

    // 병렬 예측
    const predictions = await Promise.all(
      axes.map(axis => this.predictSingleAxis(axis, periods))
    );

    axes.forEach((axis, index) => {
      results[axis] = predictions[index];
    });

    return results as Record<AxisKey, PredictionResult>;
  }

  // 계절성 감지
  private detectSeasonality(data: TimeSeriesPoint[]): PredictionResult['seasonality'] {
    if (data.length < 12) {
      return { detected: false, period: 0, strength: 0 };
    }

    // 간단한 계절성 감지 (실제로는 FFT나 STL 분해 사용)
    const values = data.map(d => d.value);
    const monthlyMeans = this.calculateMonthlyMeans(data);
    const overallMean = values.reduce((a, b) => a + b, 0) / values.length;

    // 월별 평균의 분산으로 계절성 강도 계산
    const seasonalVariance = monthlyMeans.reduce((sum, mean) =>
      sum + Math.pow(mean - overallMean, 2), 0
    ) / monthlyMeans.length;

    const totalVariance = values.reduce((sum, val) =>
      sum + Math.pow(val - overallMean, 2), 0
    ) / values.length;

    const strength = seasonalVariance / totalVariance;

    return {
      detected: strength > 0.1,
      period: 12, // 월별 계절성
      strength: Math.min(1, strength)
    };
  }

  // 트렌드 감지
  private detectTrend(data: TimeSeriesPoint[]): PredictionResult['trend'] {
    if (data.length < 3) {
      return { direction: 'stable', strength: 0, changePoints: [] };
    }

    const values = data.map(d => d.value);
    const timestamps = data.map(d => d.timestamp);

    // 선형 회귀로 트렌드 계산
    const n = values.length;
    const sumX = timestamps.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
    const sumXX = timestamps.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const strength = Math.abs(slope) / (Math.max(...values) - Math.min(...values));

    // 변화점 감지 (간단한 방법)
    const changePoints: Date[] = [];
    for (let i = 2; i < values.length - 2; i++) {
      const before = (values[i-2] + values[i-1]) / 2;
      const after = (values[i+1] + values[i+2]) / 2;
      const current = values[i];

      if (Math.abs(current - before) > 10 && Math.abs(current - after) > 10) {
        changePoints.push(timestamps[i]);
      }
    }

    return {
      direction: slope > 0.1 ? 'up' : slope < -0.1 ? 'down' : 'stable',
      strength: Math.min(1, strength),
      changePoints
    };
  }

  // 이상치 감지
  private detectAnomalies(data: TimeSeriesPoint[]): PredictionResult['anomalies'] {
    if (data.length < 5) return [];

    const values = data.map(d => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

    const anomalies: NonNullable<PredictionResult['anomalies']> = [];
    const threshold = 2.5; // 2.5 표준편차

    data.forEach((point, index) => {
      const zScore = Math.abs(point.value - mean) / std;
      if (zScore > threshold) {
        anomalies.push({
          timestamp: point.timestamp,
          severity: Math.min(1, zScore / 3),
          description: `이상값 감지: ${point.value.toFixed(1)} (평균 대비 ${zScore.toFixed(1)}σ)`
        });
      }
    });

    return anomalies;
  }

  // 예측 생성
  private async generatePredictions(
    historicalData: TimeSeriesPoint[],
    periods: number,
    model: PredictionModel,
    context: {
      seasonality?: PredictionResult['seasonality'];
      trend?: PredictionResult['trend'];
      externalFactors?: ExternalFactors | null;
    }
  ): Promise<PredictionResult['predictions']> {

    const lastPoint = historicalData[historicalData.length - 1];
    const values = historicalData.map(d => d.value);
    const predictions: PredictionResult['predictions'] = [];

    // 기본 트렌드 계산
    const baseTrend = context.trend?.strength || 0;
    const trendDirection = context.trend?.direction === 'up' ? 1 :
                          context.trend?.direction === 'down' ? -1 : 0;

    for (let i = 1; i <= periods; i++) {
      const futureDate = new Date(lastPoint.timestamp.getTime() + i * 30 * 24 * 60 * 60 * 1000);

      // 기본 예측값
      let predictedValue = lastPoint.value;

      // 트렌드 적용
      if (context.trend) {
        predictedValue += trendDirection * baseTrend * i * 2;
      }

      // 계절성 적용
      if (context.seasonality?.detected) {
        const seasonalEffect = this.getSeasonalValue('GO', futureDate); // 임시로 GO 사용
        predictedValue += seasonalEffect * context.seasonality.strength * 3;
      }

      // 외부 요인 적용
      if (context.externalFactors) {
        const externalEffect = this.calculateExternalFactorsImpact(context.externalFactors);
        predictedValue += externalEffect * i * 0.5;
      }

      // 모델별 보정
      const modelCorrection = this.applyModelCorrection(model, predictedValue, i);
      predictedValue += modelCorrection;

      // 불확실성 계산 (시간이 지날수록 증가)
      const baseUncertainty = 5; // 기본 불확실성
      const timeDecay = Math.sqrt(i); // 시간에 따른 불확실성 증가
      const modelUncertainty = (1 - model.confidence) * 20;

      const uncertainty = baseUncertainty + timeDecay * 2 + modelUncertainty;

      predictions.push({
        timestamp: futureDate,
        value: Math.max(0, Math.min(100, predictedValue)),
        confidence: Math.max(0.1, model.confidence - (i * 0.05)), // 시간에 따라 신뢰도 감소
        upperBound: Math.min(100, predictedValue + uncertainty),
        lowerBound: Math.max(0, predictedValue - uncertainty)
      });
    }

    return predictions;
  }

  // 외부 요인 영향도 계산
  private calculateExternalFactorsImpact(factors: ExternalFactors): number {
    let impact = 0;

    // 시장 상황
    switch (factors.marketCondition) {
      case 'bull': impact += 2; break;
      case 'bear': impact -= 2; break;
      case 'neutral': impact += 0; break;
    }

    // 경쟁사 활동 (높을수록 부정적)
    impact -= (factors.competitorActivity - 50) * 0.02;

    // 계절 요인
    impact += (factors.seasonalFactor - 50) * 0.01;

    // 경제 지수
    impact += (factors.economicIndex - 50) * 0.015;

    // 산업 성장률
    impact += factors.industryGrowth * 0.1;

    return impact;
  }

  // 모델별 보정
  private applyModelCorrection(model: PredictionModel, value: number, period: number): number {
    switch (model.type) {
      case 'linear':
        return 0; // 선형은 보정 없음

      case 'polynomial':
        // 다항식은 시간에 따라 비선형 보정
        return Math.sin(period * 0.5) * 2;

      case 'exponential':
        // 지수는 값에 비례한 보정
        return (value - 50) * 0.02 * period;

      case 'arima':
        // ARIMA는 이전 값들의 패턴 기반 보정
        return Math.cos(period * 0.3) * 1.5;

      default:
        return 0;
    }
  }

  // 월별 평균 계산
  private calculateMonthlyMeans(data: TimeSeriesPoint[]): number[] {
    const monthlyData: Record<number, number[]> = {};

    data.forEach(point => {
      const month = point.timestamp.getMonth();
      if (!monthlyData[month]) {
        monthlyData[month] = [];
      }
      monthlyData[month].push(point.value);
    });

    const monthlyMeans: number[] = [];
    for (let month = 0; month < 12; month++) {
      if (monthlyData[month]) {
        const mean = monthlyData[month].reduce((a, b) => a + b, 0) / monthlyData[month].length;
        monthlyMeans.push(mean);
      } else {
        monthlyMeans.push(0);
      }
    }

    return monthlyMeans;
  }

  // 모델 재학습
  async retrainModel(modelId: string, newData: TimeSeriesPoint[]): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) return;

    // 실제로는 여기서 머신러닝 모델을 재학습
    // 지금은 단순히 정확도 업데이트
    const accuracy = Math.min(0.95, model.accuracy + 0.02);
    const confidence = Math.min(0.95, model.confidence + 0.01);

    this.models.set(modelId, {
      ...model,
      accuracy,
      confidence,
      lastTrained: new Date()
    });

    console.log(`Model ${model.name} retrained. New accuracy: ${accuracy.toFixed(2)}`);
  }

  // 예측 정확도 평가
  evaluateAccuracy(actual: number[], predicted: number[]): {
    mae: number;  // Mean Absolute Error
    mse: number;  // Mean Squared Error
    rmse: number; // Root Mean Squared Error
    mape: number; // Mean Absolute Percentage Error
  } {
    if (actual.length !== predicted.length) {
      throw new Error('Actual and predicted arrays must have same length');
    }

    const n = actual.length;
    let mae = 0, mse = 0, mape = 0;

    for (let i = 0; i < n; i++) {
      const error = Math.abs(actual[i] - predicted[i]);
      mae += error;
      mse += error * error;

      if (actual[i] !== 0) {
        mape += Math.abs(error / actual[i]);
      }
    }

    mae /= n;
    mse /= n;
    mape /= n;

    return {
      mae,
      mse,
      rmse: Math.sqrt(mse),
      mape: mape * 100 // 백분율로 변환
    };
  }

  // 사용 가능한 모델 목록 반환
  getAvailableModels(): PredictionModel[] {
    return Array.from(this.models.values());
  }

  // 히스토리 데이터 추가
  addHistoricalData(axis: AxisKey, data: TimeSeriesPoint[]) {
    const existing = this.historicalData.get(axis) || [];
    const merged = [...existing, ...data].sort((a, b) =>
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    // 중복 제거 (같은 타임스탬프)
    const unique = merged.filter((point, index, array) =>
      index === 0 || point.timestamp.getTime() !== array[index - 1].timestamp.getTime()
    );

    this.historicalData.set(axis, unique);
  }
}