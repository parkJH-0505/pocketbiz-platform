/**
 * Anomaly Detection System
 * 고급 이상 탐지 및 알림 시스템
 */

import type { AxisKey } from '../../pages/startup/kpi-tabs/ResultsInsightsPanelV2/types';

export interface AnomalyPoint {
  timestamp: number;
  axis: AxisKey;
  value: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: AnomalyType;
  confidence: number;
  context?: string;
}

export type AnomalyType =
  | 'spike'           // 급격한 상승
  | 'drop'            // 급격한 하락
  | 'outlier'         // 통계적 이상치
  | 'pattern_break'   // 패턴 이탈
  | 'trend_reversal'  // 추세 반전
  | 'unusual_variance' // 비정상적 분산
  | 'missing_data'    // 데이터 누락
  | 'impossible_value'; // 불가능한 값

export interface AnomalyDetectionConfig {
  sensitivity: 'low' | 'medium' | 'high';
  methods: DetectionMethod[];
  contextWindow: number;
  minConfidence: number;
}

export type DetectionMethod =
  | 'statistical'     // Z-score, IQR
  | 'isolation_forest' // Isolation Forest 알고리즘
  | 'lstm'           // LSTM 기반 예측
  | 'clustering'     // 클러스터링 기반
  | 'ensemble';      // 앙상블 방법

export class AnomalyDetectionEngine {
  private config: AnomalyDetectionConfig;
  private historicalData: Map<AxisKey, number[]> = new Map();
  private readonly AXES: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

  constructor(config?: Partial<AnomalyDetectionConfig>) {
    this.config = {
      sensitivity: config?.sensitivity || 'medium',
      methods: config?.methods || ['statistical', 'isolation_forest'],
      contextWindow: config?.contextWindow || 30,
      minConfidence: config?.minConfidence || 0.7,
      ...config
    };

    this.initializeHistoricalData();
  }

  /**
   * 초기화
   */
  private initializeHistoricalData(): void {
    this.AXES.forEach(axis => {
      this.historicalData.set(axis, []);
    });
  }

  /**
   * 메인 이상 탐지 함수
   */
  detectAnomalies(
    currentScores: Record<AxisKey, number>,
    historicalScores?: Array<Record<AxisKey, number>>
  ): AnomalyPoint[] {
    const anomalies: AnomalyPoint[] = [];

    // 히스토리 데이터 업데이트
    if (historicalScores) {
      this.updateHistoricalData(historicalScores);
    }

    // 각 축에 대해 이상 탐지 수행
    for (const axis of this.AXES) {
      const currentValue = currentScores[axis];
      const history = this.historicalData.get(axis) || [];

      if (history.length < 10) {
        // 충분한 히스토리가 없으면 기본 검사만
        const basicAnomaly = this.basicAnomalyCheck(axis, currentValue);
        if (basicAnomaly) anomalies.push(basicAnomaly);
        continue;
      }

      // 다양한 방법으로 이상 탐지
      const detectedAnomalies: AnomalyPoint[] = [];

      if (this.config.methods.includes('statistical')) {
        const statAnomaly = this.statisticalDetection(axis, currentValue, history);
        if (statAnomaly) detectedAnomalies.push(statAnomaly);
      }

      if (this.config.methods.includes('isolation_forest')) {
        const isoAnomaly = this.isolationForestDetection(axis, currentValue, history);
        if (isoAnomaly) detectedAnomalies.push(isoAnomaly);
      }

      if (this.config.methods.includes('clustering')) {
        const clusterAnomaly = this.clusteringDetection(axis, currentValue, history);
        if (clusterAnomaly) detectedAnomalies.push(clusterAnomaly);
      }

      // 앙상블 결과 결합
      const finalAnomaly = this.ensembleAnomalies(detectedAnomalies);
      if (finalAnomaly && finalAnomaly.confidence >= this.config.minConfidence) {
        anomalies.push(finalAnomaly);
      }
    }

    // 축 간 관계 이상 탐지
    anomalies.push(...this.detectCrossAxisAnomalies(currentScores));

    return this.prioritizeAnomalies(anomalies);
  }

  /**
   * 기본 이상 체크 (히스토리 데이터가 부족할 때)
   */
  private basicAnomalyCheck(axis: AxisKey, value: number): AnomalyPoint | null {
    // 값의 범위 체크 (0-100)
    if (value < 0 || value > 100) {
      return {
        timestamp: Date.now(),
        axis,
        value,
        expectedValue: Math.max(0, Math.min(100, value)),
        deviation: Math.abs(value - Math.max(0, Math.min(100, value))),
        severity: 'critical',
        type: 'impossible_value',
        confidence: 1.0,
        context: '유효하지 않은 점수 범위'
      };
    }

    // 극단적인 값 체크
    if (value < 10 || value > 95) {
      return {
        timestamp: Date.now(),
        axis,
        value,
        expectedValue: 50,
        deviation: Math.abs(value - 50),
        severity: value < 10 ? 'high' : 'medium',
        type: 'outlier',
        confidence: 0.8,
        context: `극단적으로 ${value < 10 ? '낮은' : '높은'} 값`
      };
    }

    return null;
  }

  /**
   * 통계적 이상 탐지 (Z-score, IQR)
   */
  private statisticalDetection(
    axis: AxisKey,
    value: number,
    history: number[]
  ): AnomalyPoint | null {
    const mean = this.calculateMean(history);
    const stdDev = this.calculateStdDev(history);

    // Z-score 계산
    const zScore = Math.abs((value - mean) / (stdDev || 1));

    // 민감도에 따른 임계값
    const thresholds = {
      low: 3.5,
      medium: 2.5,
      high: 2.0
    };

    const threshold = thresholds[this.config.sensitivity];

    if (zScore > threshold) {
      // IQR 방법으로 추가 검증
      const q1 = this.percentile(history, 25);
      const q3 = this.percentile(history, 75);
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      const isIQROutlier = value < lowerBound || value > upperBound;

      if (isIQROutlier) {
        const change = value - mean;
        return {
          timestamp: Date.now(),
          axis,
          value,
          expectedValue: mean,
          deviation: Math.abs(change),
          severity: this.calculateSeverity(zScore),
          type: change > 0 ? 'spike' : 'drop',
          confidence: Math.min(zScore / 4, 1),
          context: `Z-score: ${zScore.toFixed(2)}, ${change > 0 ? '급격한 상승' : '급격한 하락'}`
        };
      }
    }

    // 분산 이상 체크
    const recentHistory = history.slice(-10);
    const recentVariance = this.calculateVariance(recentHistory);
    const historicalVariance = this.calculateVariance(history);

    if (recentVariance > historicalVariance * 3) {
      return {
        timestamp: Date.now(),
        axis,
        value,
        expectedValue: mean,
        deviation: Math.sqrt(recentVariance),
        severity: 'medium',
        type: 'unusual_variance',
        confidence: 0.7,
        context: '최근 변동성이 비정상적으로 높음'
      };
    }

    return null;
  }

  /**
   * Isolation Forest 기반 이상 탐지 (간소화된 버전)
   */
  private isolationForestDetection(
    axis: AxisKey,
    value: number,
    history: number[]
  ): AnomalyPoint | null {
    // 간소화된 Isolation Forest 구현
    // 실제 구현에서는 scikit-learn의 IsolationForest나
    // TensorFlow.js를 사용하는 것이 좋습니다

    const isolationScore = this.calculateIsolationScore(value, history);

    if (isolationScore > 0.7) {
      const mean = this.calculateMean(history);
      return {
        timestamp: Date.now(),
        axis,
        value,
        expectedValue: mean,
        deviation: Math.abs(value - mean),
        severity: this.calculateSeverity(isolationScore * 4),
        type: 'outlier',
        confidence: isolationScore,
        context: `Isolation score: ${isolationScore.toFixed(2)}`
      };
    }

    return null;
  }

  /**
   * 클러스터링 기반 이상 탐지
   */
  private clusteringDetection(
    axis: AxisKey,
    value: number,
    history: number[]
  ): AnomalyPoint | null {
    // K-means 클러스터링 (간소화된 버전)
    const clusters = this.kMeansClustering(history, 3);
    const nearestCluster = this.findNearestCluster(value, clusters);

    const distance = Math.abs(value - nearestCluster.center);
    const threshold = nearestCluster.radius * 2;

    if (distance > threshold) {
      return {
        timestamp: Date.now(),
        axis,
        value,
        expectedValue: nearestCluster.center,
        deviation: distance,
        severity: this.calculateSeverity(distance / nearestCluster.radius),
        type: 'pattern_break',
        confidence: Math.min(distance / (nearestCluster.radius * 3), 1),
        context: '기존 패턴에서 벗어남'
      };
    }

    return null;
  }

  /**
   * 축 간 관계 이상 탐지
   */
  private detectCrossAxisAnomalies(scores: Record<AxisKey, number>): AnomalyPoint[] {
    const anomalies: AnomalyPoint[] = [];

    // 축 간 균형 체크
    const values = Object.values(scores);
    const mean = this.calculateMean(values);
    const variance = this.calculateVariance(values);

    // 극단적인 불균형 감지
    if (variance > 400) { // 표준편차 > 20
      const maxAxis = this.AXES.reduce((max, axis) =>
        scores[axis] > scores[max] ? axis : max, this.AXES[0]);
      const minAxis = this.AXES.reduce((min, axis) =>
        scores[axis] < scores[min] ? axis : min, this.AXES[0]);

      anomalies.push({
        timestamp: Date.now(),
        axis: maxAxis,
        value: scores[maxAxis],
        expectedValue: mean,
        deviation: scores[maxAxis] - scores[minAxis],
        severity: 'medium',
        type: 'pattern_break',
        confidence: 0.8,
        context: `${maxAxis}와 ${minAxis} 간 극단적인 불균형`
      });
    }

    // 상관관계 이상 체크
    const expectedCorrelations = {
      'GO-EC': 0.7,  // 시장진출과 수익구조는 보통 양의 상관관계
      'PT-PF': 0.6,  // 제품경쟁력과 성과지표도 양의 상관관계
      'TO-PT': 0.5   // 팀조직과 제품경쟁력도 관련
    };

    for (const [pair, expectedCorr] of Object.entries(expectedCorrelations)) {
      const [axis1, axis2] = pair.split('-') as AxisKey[];
      const history1 = this.historicalData.get(axis1) || [];
      const history2 = this.historicalData.get(axis2) || [];

      if (history1.length >= 20 && history2.length >= 20) {
        const actualCorr = this.calculateCorrelation(history1, history2);
        const deviation = Math.abs(actualCorr - expectedCorr);

        if (deviation > 0.4) {
          anomalies.push({
            timestamp: Date.now(),
            axis: axis1,
            value: scores[axis1],
            expectedValue: scores[axis1],
            deviation: deviation,
            severity: 'low',
            type: 'pattern_break',
            confidence: 0.6,
            context: `${axis1}-${axis2} 상관관계 이상 (예상: ${expectedCorr}, 실제: ${actualCorr.toFixed(2)})`
          });
        }
      }
    }

    return anomalies;
  }

  /**
   * 앙상블 결과 결합
   */
  private ensembleAnomalies(anomalies: AnomalyPoint[]): AnomalyPoint | null {
    if (anomalies.length === 0) return null;
    if (anomalies.length === 1) return anomalies[0];

    // 가중 평균으로 결합
    const weights = {
      statistical: 0.4,
      isolation_forest: 0.3,
      clustering: 0.3
    };

    const combined = { ...anomalies[0] };
    combined.confidence = anomalies.reduce((sum, a) => sum + a.confidence, 0) / anomalies.length;

    // 심각도를 가장 높은 것으로 설정
    const severityOrder = ['low', 'medium', 'high', 'critical'];
    combined.severity = anomalies.reduce((max, a) => {
      const maxIndex = severityOrder.indexOf(max);
      const currentIndex = severityOrder.indexOf(a.severity);
      return currentIndex > maxIndex ? a.severity : max;
    }, 'low' as any);

    return combined;
  }

  /**
   * Isolation Score 계산 (간소화)
   */
  private calculateIsolationScore(value: number, history: number[]): number {
    // 값이 히스토리에서 얼마나 고립되어 있는지 계산
    const distances = history.map(h => Math.abs(h - value));
    const minDistance = Math.min(...distances);
    const avgDistance = this.calculateMean(distances);

    // 정규화된 isolation score
    const score = minDistance / (avgDistance + 1);
    return Math.min(score, 1);
  }

  /**
   * K-means 클러스터링 (간소화)
   */
  private kMeansClustering(data: number[], k: number): Array<{
    center: number;
    radius: number;
    points: number[];
  }> {
    // 간단한 1D K-means
    const sorted = [...data].sort((a, b) => a - b);
    const clusters = [];
    const chunkSize = Math.ceil(sorted.length / k);

    for (let i = 0; i < k; i++) {
      const chunk = sorted.slice(i * chunkSize, (i + 1) * chunkSize);
      if (chunk.length > 0) {
        const center = this.calculateMean(chunk);
        const radius = Math.max(...chunk.map(p => Math.abs(p - center)));
        clusters.push({ center, radius, points: chunk });
      }
    }

    return clusters;
  }

  /**
   * 가장 가까운 클러스터 찾기
   */
  private findNearestCluster(value: number, clusters: Array<{ center: number; radius: number; points: number[] }>) {
    return clusters.reduce((nearest, cluster) => {
      const distance = Math.abs(value - cluster.center);
      const nearestDistance = Math.abs(value - nearest.center);
      return distance < nearestDistance ? cluster : nearest;
    });
  }

  /**
   * 심각도 계산
   */
  private calculateSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 2) return 'low';
    if (score < 3) return 'medium';
    if (score < 4) return 'high';
    return 'critical';
  }

  /**
   * 이상치 우선순위 정렬
   */
  private prioritizeAnomalies(anomalies: AnomalyPoint[]): AnomalyPoint[] {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };

    return anomalies.sort((a, b) => {
      // 심각도 우선
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;

      // 신뢰도 우선
      const confidenceDiff = b.confidence - a.confidence;
      if (confidenceDiff !== 0) return confidenceDiff;

      // 편차 크기 우선
      return b.deviation - a.deviation;
    });
  }

  /**
   * 히스토리 데이터 업데이트
   */
  private updateHistoricalData(historicalScores: Array<Record<AxisKey, number>>): void {
    for (const scores of historicalScores) {
      for (const axis of this.AXES) {
        const history = this.historicalData.get(axis) || [];
        history.push(scores[axis]);

        // 최대 크기 제한
        if (history.length > 100) {
          history.shift();
        }

        this.historicalData.set(axis, history);
      }
    }
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

  private calculateStdDev(values: number[]): number {
    return Math.sqrt(this.calculateVariance(values));
  }

  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    const meanX = this.calculateMean(x.slice(0, n));
    const meanY = this.calculateMean(y.slice(0, n));

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
}