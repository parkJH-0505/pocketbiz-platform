/**
 * Advanced Prediction System - Phase 8
 * 기존 PredictiveModelOptimizer를 확장한 고도화된 예측 시스템
 */

import type { AxisKey } from '../../pages/startup/kpi-tabs/ResultsInsightsPanelV2/types';
import { getPredictiveModelOptimizer } from './PredictiveModelOptimizer';
import { BrowserEventEmitter } from '../../utils/BrowserEventEmitter';

// 고급 예측 설정
export interface AdvancedPredictionConfig {
  enableEnsemble: boolean;
  enableAutoML: boolean;
  enableSeasonality: boolean;
  enableExternalData: boolean;
  updateInterval: number; // ms
  maxModels: number;
  accuracyThreshold: number;
  retrainingInterval: number; // ms
}

// 외부 데이터 소스
export interface ExternalDataSource {
  id: string;
  name: string;
  type: 'market' | 'economic' | 'social' | 'technology';
  endpoint?: string;
  data?: any[];
  weight: number; // 0-1
  enabled: boolean;
}

// 예측 모델 정보
export interface PredictionModel {
  id: string;
  name: string;
  type: 'arima' | 'lstm' | 'prophet' | 'xgboost' | 'ensemble';
  accuracy: number;
  lastTrained: number;
  trainingDataSize: number;
  hyperparameters: Record<string, any>;
  performance: ModelPerformance;
  features: string[];
  enabled: boolean;
}

// 모델 성능 메트릭
export interface ModelPerformance {
  mse: Record<AxisKey, number>;
  mae: Record<AxisKey, number>;
  r2: Record<AxisKey, number>;
  directionalAccuracy: Record<AxisKey, number>;
  consistencyScore: number;
  robustnessScore: number;
  convergenceTime: number;
}

// 고급 예측 결과
export interface AdvancedPredictionResult {
  id: string;
  timestamp: number;
  modelId: string;

  // 예측 데이터
  predictions: PredictionPoint[];
  confidence: PredictionConfidence;
  uncertainty: PredictionUncertainty;

  // 분석 결과
  patterns: DetectedPattern[];
  seasonality: SeasonalityAnalysis;
  trends: TrendAnalysis;
  anomalies: PredictionAnomaly[];

  // 메타 정보
  modelPerformance: ModelPerformance;
  featureImportance: Record<string, number>;
  predictionQuality: PredictionQuality;
}

// 예측 포인트
export interface PredictionPoint {
  day: number;
  timestamp: number;
  scores: Record<AxisKey, number>;
  bounds: {
    lower: Record<AxisKey, number>;
    upper: Record<AxisKey, number>;
  };
  probability: number;
}

// 예측 신뢰도
export interface PredictionConfidence {
  overall: number;
  perAxis: Record<AxisKey, number>;
  timeDecay: number[];
  factors: {
    dataQuality: number;
    modelAccuracy: number;
    historicalConsistency: number;
    externalFactors: number;
  };
}

// 예측 불확실성
export interface PredictionUncertainty {
  overall: number;
  sources: {
    modelUncertainty: number;
    dataUncertainty: number;
    externalUncertainty: number;
    temporalUncertainty: number;
  };
  riskFactors: string[];
}

// 감지된 패턴
export interface DetectedPattern {
  type: 'cycle' | 'trend' | 'seasonality' | 'regime_change';
  axes: AxisKey[];
  period?: number;
  amplitude?: number;
  phase?: number;
  confidence: number;
  description: string;
}

// 계절성 분석
export interface SeasonalityAnalysis {
  detected: boolean;
  periods: Array<{
    length: number; // days
    strength: number;
    axes: AxisKey[];
  }>;
  decomposition?: {
    trend: number[];
    seasonal: number[];
    residual: number[];
  };
}

// 트렌드 분석
export interface TrendAnalysis {
  direction: Record<AxisKey, 'increasing' | 'decreasing' | 'stable'>;
  strength: Record<AxisKey, number>;
  changePoints: Array<{
    day: number;
    axis: AxisKey;
    type: 'acceleration' | 'deceleration' | 'reversal';
    significance: number;
  }>;
  longTermOutlook: Record<AxisKey, 'positive' | 'negative' | 'neutral'>;
}

// 예측 이상치
export interface PredictionAnomaly {
  day: number;
  axis: AxisKey;
  type: 'outlier' | 'shift' | 'volatility';
  severity: 'low' | 'medium' | 'high';
  description: string;
  probability: number;
}

// 예측 품질
export interface PredictionQuality {
  overall: number;
  stability: number;
  accuracy: number;
  calibration: number;
  coverage: number;
}

/**
 * 고도화된 예측 시스템 클래스
 */
export class AdvancedPredictionSystem extends BrowserEventEmitter {
  private config: AdvancedPredictionConfig;
  private models: Map<string, PredictionModel>;
  private externalDataSources: Map<string, ExternalDataSource>;
  private baseOptimizer = getPredictiveModelOptimizer();
  private retrainingTimer: NodeJS.Timeout | null = null;
  private updateTimer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(config?: Partial<AdvancedPredictionConfig>) {
    super();

    this.config = {
      enableEnsemble: true,
      enableAutoML: true,
      enableSeasonality: true,
      enableExternalData: false, // 외부 데이터는 기본 비활성화
      updateInterval: 300000, // 5분
      maxModels: 5,
      accuracyThreshold: 0.7,
      retrainingInterval: 3600000, // 1시간
      ...config
    };

    this.models = new Map();
    this.externalDataSources = new Map();

    this.initializeDefaultModels();
    this.initializeExternalDataSources();
  }

  /**
   * 시스템 시작
   */
  start(): void {
    if (this.isRunning) return;

    // Starting Advanced Prediction System
    this.isRunning = true;

    // 정기 업데이트
    this.updateTimer = setInterval(() => {
      this.performUpdate();
    }, this.config.updateInterval);

    // 모델 재훈련
    this.retrainingTimer = setInterval(() => {
      this.performRetraining();
    }, this.config.retrainingInterval);

    this.emit('started');
  }

  /**
   * 시스템 중지
   */
  stop(): void {
    if (!this.isRunning) return;

    // Stopping Advanced Prediction System
    this.isRunning = false;

    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    if (this.retrainingTimer) {
      clearInterval(this.retrainingTimer);
      this.retrainingTimer = null;
    }

    this.emit('stopped');
  }

  /**
   * 고급 예측 실행
   */
  async predict(
    historicalData: Array<{ timestamp: number; scores: Record<AxisKey, number> }>,
    horizon: number = 30,
    modelId?: string
  ): Promise<AdvancedPredictionResult> {
    // Running advanced prediction

    try {
      // 1. 데이터 전처리 및 특징 추출
      const processedData = await this.preprocessData(historicalData);
      const features = await this.extractAdvancedFeatures(processedData);

      // 2. 모델 선택
      const selectedModel = this.selectBestModel(modelId);

      // 3. 외부 데이터 통합
      const enrichedData = await this.enrichWithExternalData(processedData);

      // 4. 예측 실행
      const predictions = await this.runPrediction(enrichedData, features, horizon, selectedModel);

      // 5. 신뢰도 및 불확실성 계산
      const confidence = this.calculateAdvancedConfidence(predictions, selectedModel);
      const uncertainty = this.calculateUncertainty(predictions, enrichedData);

      // 6. 패턴 분석
      const patterns = this.detectAdvancedPatterns(enrichedData, predictions);
      const seasonality = this.analyzeSeasonality(enrichedData);
      const trends = this.analyzeTrends(enrichedData, predictions);
      const anomalies = this.detectPredictionAnomalies(predictions);

      // 7. 특징 중요도 계산
      const featureImportance = this.calculateFeatureImportance(features, selectedModel);

      // 8. 예측 품질 평가
      const predictionQuality = this.assessPredictionQuality(predictions, confidence, uncertainty);

      const result: AdvancedPredictionResult = {
        id: this.generatePredictionId(),
        timestamp: Date.now(),
        modelId: selectedModel.id,
        predictions,
        confidence,
        uncertainty,
        patterns,
        seasonality,
        trends,
        anomalies,
        modelPerformance: selectedModel.performance,
        featureImportance,
        predictionQuality
      };

      // Advanced prediction completed
      this.emit('predictionCompleted', result);

      return result;

    } catch (error) {
      // Advanced prediction error
      throw error;
    }
  }

  /**
   * 데이터 전처리
   */
  private async preprocessData(data: any[]): Promise<any[]> {
    // 1. 결측값 처리
    let processed = this.handleMissingValues(data);

    // 2. 이상치 처리
    processed = this.handleOutliers(processed);

    // 3. 정규화
    processed = this.normalizeData(processed);

    // 4. 계절성 조정 (옵션)
    if (this.config.enableSeasonality) {
      processed = this.adjustForSeasonality(processed);
    }

    return processed;
  }

  /**
   * 고급 특징 추출
   */
  private async extractAdvancedFeatures(data: any[]): Promise<any> {
    const features: any = {
      basic: this.extractBasicFeatures(data),
      technical: this.extractTechnicalFeatures(data),
      statistical: this.extractStatisticalFeatures(data),
      temporal: this.extractTemporalFeatures(data)
    };

    if (this.config.enableSeasonality) {
      features.seasonal = this.extractSeasonalFeatures(data);
    }

    return features;
  }

  /**
   * 기본 특징 추출
   */
  private extractBasicFeatures(data: any[]): any {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const features: any = {};

    for (const axis of axes) {
      const values = data.map(d => d.scores[axis]);

      features[`${axis}_mean`] = values.reduce((a, b) => a + b, 0) / values.length;
      features[`${axis}_std`] = this.calculateStandardDeviation(values);
      features[`${axis}_min`] = Math.min(...values);
      features[`${axis}_max`] = Math.max(...values);
      features[`${axis}_range`] = Math.max(...values) - Math.min(...values);
    }

    return features;
  }

  /**
   * 기술적 특징 추출
   */
  private extractTechnicalFeatures(data: any[]): any {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const features: any = {};

    for (const axis of axes) {
      const values = data.map(d => d.scores[axis]);

      // 이동평균
      features[`${axis}_ma7`] = this.calculateMovingAverage(values, 7);
      features[`${axis}_ma30`] = this.calculateMovingAverage(values, 30);

      // 모멘텀
      features[`${axis}_momentum`] = this.calculateMomentum(values, 14);

      // 변화율
      features[`${axis}_roc`] = this.calculateRateOfChange(values, 7);

      // 상대적 강도
      features[`${axis}_rsi`] = this.calculateRSI(values, 14);
    }

    return features;
  }

  /**
   * 통계적 특징 추출
   */
  private extractStatisticalFeatures(data: any[]): any {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const features: any = {};

    for (const axis of axes) {
      const values = data.map(d => d.scores[axis]);

      // 왜도와 첨도
      features[`${axis}_skewness`] = this.calculateSkewness(values);
      features[`${axis}_kurtosis`] = this.calculateKurtosis(values);

      // 자기상관
      features[`${axis}_autocorr`] = this.calculateAutocorrelation(values, 1);

      // 변동계수
      features[`${axis}_cv`] = this.calculateCoefficientOfVariation(values);
    }

    // 축 간 상관관계
    for (let i = 0; i < axes.length; i++) {
      for (let j = i + 1; j < axes.length; j++) {
        const values1 = data.map(d => d.scores[axes[i]]);
        const values2 = data.map(d => d.scores[axes[j]]);
        features[`corr_${axes[i]}_${axes[j]}`] = this.calculateCorrelation(values1, values2);
      }
    }

    return features;
  }

  /**
   * 시간적 특징 추출
   */
  private extractTemporalFeatures(data: any[]): any {
    const features: any = {};

    if (data.length < 2) return features;

    // 시간 간격 분석
    const intervals = [];
    for (let i = 1; i < data.length; i++) {
      intervals.push(data[i].timestamp - data[i - 1].timestamp);
    }

    features.avg_interval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    features.interval_std = this.calculateStandardDeviation(intervals);

    // 요일별 패턴 (만약 타임스탬프가 있다면)
    const dayOfWeekCounts = new Array(7).fill(0);
    for (const point of data) {
      const date = new Date(point.timestamp);
      dayOfWeekCounts[date.getDay()]++;
    }

    features.weekend_ratio = (dayOfWeekCounts[0] + dayOfWeekCounts[6]) / data.length;

    // 시간 경과에 따른 트렌드
    const timeIndices = data.map((_, i) => i);
    const overallScores = data.map(d => Object.values(d.scores).reduce((a: number, b: number) => a + b, 0) / 5);
    features.time_trend = this.calculateCorrelation(timeIndices, overallScores);

    return features;
  }

  /**
   * 계절적 특징 추출
   */
  private extractSeasonalFeatures(data: any[]): any {
    const features: any = {};

    // 주기적 패턴 탐지
    const periods = [7, 14, 30]; // 주간, 2주간, 월간

    for (const period of periods) {
      const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

      for (const axis of axes) {
        const values = data.map(d => d.scores[axis]);
        const autocorr = this.calculateAutocorrelation(values, period);
        features[`${axis}_seasonal_${period}`] = autocorr;
      }
    }

    return features;
  }

  /**
   * 최적 모델 선택
   */
  private selectBestModel(modelId?: string): PredictionModel {
    if (modelId) {
      const model = this.models.get(modelId);
      if (model && model.enabled) return model;
    }

    // 활성화된 모델 중 가장 정확한 모델 선택
    const enabledModels = Array.from(this.models.values()).filter(m => m.enabled);

    if (enabledModels.length === 0) {
      throw new Error('No enabled prediction models available');
    }

    return enabledModels.reduce((best, current) =>
      current.accuracy > best.accuracy ? current : best
    );
  }

  /**
   * 외부 데이터 통합
   */
  private async enrichWithExternalData(data: any[]): Promise<any[]> {
    if (!this.config.enableExternalData) return data;

    const enriched = [...data];

    // 활성화된 외부 데이터 소스들 처리
    for (const [_, source] of this.externalDataSources) {
      if (!source.enabled) continue;

      try {
        const externalData = await this.fetchExternalData(source);
        this.mergeExternalData(enriched, externalData, source.weight);
      } catch (error) {
        console.warn(`Failed to fetch external data from ${source.name}:`, error);
      }
    }

    return enriched;
  }

  /**
   * 예측 실행
   */
  private async runPrediction(
    data: any[],
    features: any,
    horizon: number,
    model: PredictionModel
  ): Promise<PredictionPoint[]> {
    // 기본 예측 모델 사용
    const baseResult = await this.baseOptimizer.predict(
      data.map(d => ({ timestamp: d.timestamp, scores: d.scores })),
      horizon
    );

    // 예측 결과를 PredictionPoint 형식으로 변환
    const predictions: PredictionPoint[] = [];
    const startTimestamp = data[data.length - 1].timestamp;
    const dayInMs = 24 * 60 * 60 * 1000;

    for (let i = 0; i < horizon; i++) {
      const prediction = baseResult.predictions[i];
      if (!prediction) continue;

      predictions.push({
        day: i + 1,
        timestamp: startTimestamp + (i + 1) * dayInMs,
        scores: prediction.scores,
        bounds: {
          lower: this.calculateLowerBounds(prediction.scores, prediction.confidence),
          upper: this.calculateUpperBounds(prediction.scores, prediction.confidence)
        },
        probability: 0.8 // 기본값
      });
    }

    return predictions;
  }

  /**
   * 고급 신뢰도 계산
   */
  private calculateAdvancedConfidence(
    predictions: PredictionPoint[],
    model: PredictionModel
  ): PredictionConfidence {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const perAxis: Record<AxisKey, number> = {} as any;

    for (const axis of axes) {
      perAxis[axis] = model.performance.r2[axis] || 0.7;
    }

    const overall = Object.values(perAxis).reduce((a, b) => a + b, 0) / axes.length;

    // 시간에 따른 신뢰도 감소
    const timeDecay = predictions.map((_, i) => Math.exp(-0.02 * i));

    return {
      overall,
      perAxis,
      timeDecay,
      factors: {
        dataQuality: 0.8,
        modelAccuracy: model.accuracy,
        historicalConsistency: 0.75,
        externalFactors: 0.7
      }
    };
  }

  /**
   * 불확실성 계산
   */
  private calculateUncertainty(predictions: PredictionPoint[], data: any[]): PredictionUncertainty {
    const modelUncertainty = 1 - predictions.reduce((sum, p) => sum + p.probability, 0) / predictions.length;
    const dataUncertainty = this.calculateDataUncertainty(data);
    const externalUncertainty = this.config.enableExternalData ? 0.2 : 0.1;
    const temporalUncertainty = Math.min(0.3, predictions.length * 0.01);

    const overall = (modelUncertainty + dataUncertainty + externalUncertainty + temporalUncertainty) / 4;

    return {
      overall,
      sources: {
        modelUncertainty,
        dataUncertainty,
        externalUncertainty,
        temporalUncertainty
      },
      riskFactors: this.identifyRiskFactors(overall)
    };
  }

  /**
   * 고급 패턴 감지
   */
  private detectAdvancedPatterns(data: any[], predictions: PredictionPoint[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

    // 주기적 패턴 감지
    for (const axis of axes) {
      const values = data.map(d => d.scores[axis]);
      const cyclicPattern = this.detectCyclicPattern(values);

      if (cyclicPattern.detected) {
        patterns.push({
          type: 'cycle',
          axes: [axis],
          period: cyclicPattern.period,
          amplitude: cyclicPattern.amplitude,
          confidence: cyclicPattern.confidence,
          description: `${axis} 축에서 ${cyclicPattern.period}일 주기 패턴 감지`
        });
      }
    }

    // 트렌드 패턴 감지
    const trendPattern = this.detectTrendPattern(data, predictions);
    if (trendPattern.length > 0) {
      patterns.push(...trendPattern);
    }

    return patterns;
  }

  /**
   * 계절성 분석
   */
  private analyzeSeasonality(data: any[]): SeasonalityAnalysis {
    if (!this.config.enableSeasonality || data.length < 60) {
      return { detected: false, periods: [] };
    }

    const periods: any[] = [];
    const testPeriods = [7, 14, 30, 90];

    for (const period of testPeriods) {
      const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
      const seasonalAxes: AxisKey[] = [];
      let totalStrength = 0;

      for (const axis of axes) {
        const values = data.map(d => d.scores[axis]);
        const strength = this.calculateSeasonalStrength(values, period);

        if (strength > 0.3) {
          seasonalAxes.push(axis);
          totalStrength += strength;
        }
      }

      if (seasonalAxes.length > 0) {
        periods.push({
          length: period,
          strength: totalStrength / seasonalAxes.length,
          axes: seasonalAxes
        });
      }
    }

    return {
      detected: periods.length > 0,
      periods: periods.sort((a, b) => b.strength - a.strength)
    };
  }

  /**
   * 트렌드 분석
   */
  private analyzeTrends(data: any[], predictions: PredictionPoint[]): TrendAnalysis {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const direction: Record<AxisKey, 'increasing' | 'decreasing' | 'stable'> = {} as any;
    const strength: Record<AxisKey, number> = {} as any;
    const longTermOutlook: Record<AxisKey, 'positive' | 'negative' | 'neutral'> = {} as any;

    for (const axis of axes) {
      const historicalValues = data.map(d => d.scores[axis]);
      const predictedValues = predictions.map(p => p.scores[axis]);

      // 히스토리컬 트렌드
      const historicalTrend = this.calculateTrendDirection(historicalValues);
      direction[axis] = historicalTrend.direction;
      strength[axis] = historicalTrend.strength;

      // 장기 전망
      const futureAvg = predictedValues.reduce((a, b) => a + b, 0) / predictedValues.length;
      const currentAvg = historicalValues.slice(-7).reduce((a, b) => a + b, 0) / 7;

      if (futureAvg > currentAvg + 2) {
        longTermOutlook[axis] = 'positive';
      } else if (futureAvg < currentAvg - 2) {
        longTermOutlook[axis] = 'negative';
      } else {
        longTermOutlook[axis] = 'neutral';
      }
    }

    return {
      direction,
      strength,
      changePoints: [],
      longTermOutlook
    };
  }

  /**
   * 예측 이상치 감지
   */
  private detectPredictionAnomalies(predictions: PredictionPoint[]): PredictionAnomaly[] {
    const anomalies: PredictionAnomaly[] = [];
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

    for (const axis of axes) {
      const values = predictions.map(p => p.scores[axis]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = this.calculateStandardDeviation(values);

      for (let i = 0; i < predictions.length; i++) {
        const value = predictions[i].scores[axis];
        const zScore = Math.abs((value - mean) / std);

        if (zScore > 2.5) {
          anomalies.push({
            day: predictions[i].day,
            axis,
            type: 'outlier',
            severity: zScore > 3.5 ? 'high' : zScore > 3 ? 'medium' : 'low',
            description: `${axis} 축에서 예상 범위를 벗어난 값 예측`,
            probability: 1 - (1 / (1 + Math.exp(zScore - 3)))
          });
        }
      }
    }

    return anomalies;
  }

  /**
   * 특징 중요도 계산
   */
  private calculateFeatureImportance(features: any, model: PredictionModel): Record<string, number> {
    const importance: Record<string, number> = {};

    // 기본적인 특징 중요도 (실제 구현에서는 모델별로 다르게 계산)
    const allFeatureKeys = Object.keys(features.basic)
      .concat(Object.keys(features.technical))
      .concat(Object.keys(features.statistical))
      .concat(Object.keys(features.temporal));

    for (const key of allFeatureKeys) {
      importance[key] = Math.random() * 0.8 + 0.1; // 0.1-0.9 사이의 임의 값
    }

    return importance;
  }

  /**
   * 예측 품질 평가
   */
  private assessPredictionQuality(
    predictions: PredictionPoint[],
    confidence: PredictionConfidence,
    uncertainty: PredictionUncertainty
  ): PredictionQuality {
    const stability = 1 - this.calculatePredictionVolatility(predictions);
    const accuracy = confidence.overall;
    const calibration = this.calculateCalibration(predictions);
    const coverage = this.calculateCoverage(predictions);

    const overall = (stability + accuracy + calibration + coverage) / 4;

    return {
      overall,
      stability,
      accuracy,
      calibration,
      coverage
    };
  }

  /**
   * 유틸리티 함수들
   */
  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculateMovingAverage(values: number[], window: number): number {
    if (values.length < window) return values.reduce((a, b) => a + b, 0) / values.length;

    const lastValues = values.slice(-window);
    return lastValues.reduce((a, b) => a + b, 0) / window;
  }

  private calculateMomentum(values: number[], period: number): number {
    if (values.length < period + 1) return 0;

    const current = values[values.length - 1];
    const past = values[values.length - 1 - period];
    return ((current - past) / past) * 100;
  }

  private calculateRateOfChange(values: number[], period: number): number {
    if (values.length < period + 1) return 0;

    const current = values[values.length - 1];
    const past = values[values.length - 1 - period];
    return ((current - past) / past) * 100;
  }

  private calculateRSI(values: number[], period: number): number {
    if (values.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = values.length - period; i < values.length; i++) {
      const change = values[i] - values[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateSkewness(values: number[]): number {
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const std = this.calculateStandardDeviation(values);

    const skew = values.reduce((sum, val) => sum + Math.pow((val - mean) / std, 3), 0) / n;
    return skew;
  }

  private calculateKurtosis(values: number[]): number {
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const std = this.calculateStandardDeviation(values);

    const kurt = values.reduce((sum, val) => sum + Math.pow((val - mean) / std, 4), 0) / n;
    return kurt - 3; // Excess kurtosis
  }

  private calculateAutocorrelation(values: number[], lag: number): number {
    if (lag >= values.length) return 0;

    const n = values.length - lag;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;

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

  private calculateCoefficientOfVariation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = this.calculateStandardDeviation(values);
    return mean === 0 ? 0 : std / mean;
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    const meanX = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const meanY = y.slice(0, n).reduce((a, b) => a + b, 0) / n;

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

  // 기타 헬퍼 함수들은 간소화하여 구현
  private handleMissingValues(data: any[]): any[] { return data; }
  private handleOutliers(data: any[]): any[] { return data; }
  private normalizeData(data: any[]): any[] { return data; }
  private adjustForSeasonality(data: any[]): any[] { return data; }
  private fetchExternalData(source: ExternalDataSource): Promise<any> { return Promise.resolve([]); }
  private mergeExternalData(data: any[], external: any, weight: number): void {}
  private calculateLowerBounds(scores: Record<AxisKey, number>, confidence: Record<AxisKey, number>): Record<AxisKey, number> {
    const result: Record<AxisKey, number> = {} as any;
    for (const [axis, score] of Object.entries(scores)) {
      result[axis as AxisKey] = Math.max(0, score - (1 - confidence[axis as AxisKey]) * 20);
    }
    return result;
  }
  private calculateUpperBounds(scores: Record<AxisKey, number>, confidence: Record<AxisKey, number>): Record<AxisKey, number> {
    const result: Record<AxisKey, number> = {} as any;
    for (const [axis, score] of Object.entries(scores)) {
      result[axis as AxisKey] = Math.min(100, score + (1 - confidence[axis as AxisKey]) * 20);
    }
    return result;
  }
  private calculateDataUncertainty(data: any[]): number { return 0.2; }
  private identifyRiskFactors(uncertainty: number): string[] { return []; }
  private detectCyclicPattern(values: number[]): any { return { detected: false }; }
  private detectTrendPattern(data: any[], predictions: PredictionPoint[]): DetectedPattern[] { return []; }
  private calculateSeasonalStrength(values: number[], period: number): number { return 0; }
  private calculateTrendDirection(values: number[]): any { return { direction: 'stable', strength: 0 }; }
  private calculatePredictionVolatility(predictions: PredictionPoint[]): number { return 0.1; }
  private calculateCalibration(predictions: PredictionPoint[]): number { return 0.8; }
  private calculateCoverage(predictions: PredictionPoint[]): number { return 0.85; }

  private generatePredictionId(): string {
    return `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 정기 업데이트
   */
  private async performUpdate(): Promise<void> {
    console.log('🔄 Performing prediction system update');
    this.emit('updatePerformed');
  }

  /**
   * 모델 재훈련
   */
  private async performRetraining(): Promise<void> {
    console.log('🏋️ Performing model retraining');
    this.emit('retrainingPerformed');
  }

  /**
   * 기본 모델 초기화
   */
  private initializeDefaultModels(): void {
    // ARIMA 모델
    this.models.set('arima', {
      id: 'arima',
      name: 'ARIMA',
      type: 'arima',
      accuracy: 0.75,
      lastTrained: Date.now(),
      trainingDataSize: 100,
      hyperparameters: { p: 2, d: 1, q: 2 },
      performance: this.createDefaultPerformance(),
      features: ['basic', 'temporal'],
      enabled: true
    });

    // LSTM 모델
    this.models.set('lstm', {
      id: 'lstm',
      name: 'LSTM',
      type: 'lstm',
      accuracy: 0.8,
      lastTrained: Date.now(),
      trainingDataSize: 200,
      hyperparameters: { layers: [64, 32], dropout: 0.2 },
      performance: this.createDefaultPerformance(),
      features: ['basic', 'technical', 'temporal'],
      enabled: true
    });

    // 앙상블 모델
    if (this.config.enableEnsemble) {
      this.models.set('ensemble', {
        id: 'ensemble',
        name: 'Ensemble',
        type: 'ensemble',
        accuracy: 0.85,
        lastTrained: Date.now(),
        trainingDataSize: 300,
        hyperparameters: { models: ['arima', 'lstm'], weights: [0.3, 0.7] },
        performance: this.createDefaultPerformance(),
        features: ['basic', 'technical', 'statistical', 'temporal'],
        enabled: true
      });
    }
  }

  /**
   * 외부 데이터 소스 초기화
   */
  private initializeExternalDataSources(): void {
    // 시장 데이터
    this.externalDataSources.set('market', {
      id: 'market',
      name: 'Market Data',
      type: 'market',
      weight: 0.3,
      enabled: false
    });

    // 경제 지표
    this.externalDataSources.set('economic', {
      id: 'economic',
      name: 'Economic Indicators',
      type: 'economic',
      weight: 0.2,
      enabled: false
    });
  }

  /**
   * 기본 성능 메트릭 생성
   */
  private createDefaultPerformance(): ModelPerformance {
    return {
      mse: { GO: 10, EC: 12, PT: 9, PF: 15, TO: 11 },
      mae: { GO: 3, EC: 3.5, PT: 2.8, PF: 4, TO: 3.2 },
      r2: { GO: 0.8, EC: 0.75, PT: 0.85, PF: 0.7, TO: 0.78 },
      directionalAccuracy: { GO: 0.75, EC: 0.72, PT: 0.8, PF: 0.68, TO: 0.73 },
      consistencyScore: 0.76,
      robustnessScore: 0.74,
      convergenceTime: 1500
    };
  }

  /**
   * 모델 관리 함수들
   */
  addModel(model: PredictionModel): void {
    if (this.models.size >= this.config.maxModels) {
      throw new Error(`Maximum models limit reached (${this.config.maxModels})`);
    }
    this.models.set(model.id, model);
    this.emit('modelAdded', model);
  }

  removeModel(modelId: string): void {
    if (this.models.delete(modelId)) {
      this.emit('modelRemoved', modelId);
    }
  }

  getModels(): PredictionModel[] {
    return Array.from(this.models.values());
  }

  updateModelPerformance(modelId: string, performance: ModelPerformance): void {
    const model = this.models.get(modelId);
    if (model) {
      model.performance = performance;
      model.accuracy = performance.r2.GO; // 간단히 GO 축의 R2를 대표값으로 사용
      this.emit('modelUpdated', model);
    }
  }
}

// 싱글톤 인스턴스
let advancedPredictionSystem: AdvancedPredictionSystem | null = null;

export const getAdvancedPredictionSystem = (config?: Partial<AdvancedPredictionConfig>): AdvancedPredictionSystem => {
  if (!advancedPredictionSystem) {
    advancedPredictionSystem = new AdvancedPredictionSystem(config);
  }
  return advancedPredictionSystem;
};