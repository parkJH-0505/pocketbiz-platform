/**
 * Monte Carlo Simulation Engine
 * 고급 시뮬레이션을 위한 몬테카를로 엔진
 */

import type { AxisKey } from '../../pages/startup/kpi-tabs/ResultsInsightsPanelV2/types';

export interface SimulationConfig {
  iterations?: number;
  timeHorizon?: number; // days
  confidenceLevel?: number; // 0.95 for 95%
  correlationMatrix?: Record<AxisKey, Record<AxisKey, number>>;
  volatility?: Record<AxisKey, number>;
  drift?: Record<AxisKey, number>;
  constraints?: SimulationConstraints;
}

export interface SimulationConstraints {
  min?: Record<AxisKey, number>;
  max?: Record<AxisKey, number>;
  dependencies?: Array<{
    if: { axis: AxisKey; condition: 'gt' | 'lt' | 'eq'; value: number };
    then: { axis: AxisKey; adjustment: number };
  }>;
}

export interface SimulationResult {
  scenarios: SimulationScenario[];
  statistics: SimulationStatistics;
  probabilities: ProbabilityDistribution;
  riskMetrics: RiskMetrics;
  recommendations: SimulationRecommendation[];
}

export interface SimulationScenario {
  id: string;
  iteration: number;
  timeline: TimePoint[];
  finalScores: Record<AxisKey, number>;
  probability: number;
  category: 'best' | 'worst' | 'likely' | 'outlier';
}

export interface TimePoint {
  day: number;
  scores: Record<AxisKey, number>;
  volatility: Record<AxisKey, number>;
}

export interface SimulationStatistics {
  mean: Record<AxisKey, number>;
  median: Record<AxisKey, number>;
  mode: Record<AxisKey, number>;
  stdDev: Record<AxisKey, number>;
  variance: Record<AxisKey, number>;
  skewness: Record<AxisKey, number>;
  kurtosis: Record<AxisKey, number>;
  percentiles: {
    p5: Record<AxisKey, number>;
    p25: Record<AxisKey, number>;
    p50: Record<AxisKey, number>;
    p75: Record<AxisKey, number>;
    p95: Record<AxisKey, number>;
  };
}

export interface ProbabilityDistribution {
  targetProbabilities: Array<{
    target: number;
    probabilities: Record<AxisKey, number>;
  }>;
  jointProbabilities: Array<{
    condition: string;
    probability: number;
  }>;
  confidenceIntervals: Record<AxisKey, { lower: number; upper: number }>;
}

export interface RiskMetrics {
  valueAtRisk: Record<AxisKey, number>; // VaR at confidence level
  conditionalValueAtRisk: Record<AxisKey, number>; // CVaR
  maxDrawdown: Record<AxisKey, number>;
  sharpeRatio: Record<AxisKey, number>;
  beta: Record<AxisKey, number>;
  correlationRisk: number;
}

export interface SimulationRecommendation {
  type: 'optimize' | 'hedge' | 'focus' | 'monitor';
  axis: AxisKey | 'overall';
  action: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
}

export class MonteCarloSimulator {
  private config: Required<SimulationConfig>;
  private random: RandomNumberGenerator;

  constructor(config: SimulationConfig = {}) {
    this.config = this.initializeConfig(config);
    this.random = new RandomNumberGenerator();
  }

  /**
   * 메인 시뮬레이션 실행
   */
  async runSimulation(
    initialScores: Record<AxisKey, number>,
    scenarios?: SimulationScenario[]
  ): Promise<SimulationResult> {
    console.log('🎲 Starting Monte Carlo simulation...');

    const simulationScenarios: SimulationScenario[] = [];
    const allFinalScores: Record<AxisKey, number[]> = {
      GO: [], EC: [], PT: [], PF: [], TO: []
    };

    // 병렬 처리를 위한 배치 크기
    const batchSize = 100;
    const batches = Math.ceil(this.config.iterations / batchSize);

    for (let batch = 0; batch < batches; batch++) {
      const batchPromises = [];
      const startIdx = batch * batchSize;
      const endIdx = Math.min(startIdx + batchSize, this.config.iterations);

      for (let i = startIdx; i < endIdx; i++) {
        batchPromises.push(this.runSingleIteration(i, initialScores));
      }

      const batchResults = await Promise.all(batchPromises);

      for (const scenario of batchResults) {
        simulationScenarios.push(scenario);
        const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
        axes.forEach(axis => {
          allFinalScores[axis].push(scenario.finalScores[axis]);
        });
      }

      // 진행 상황 로그
      if ((batch + 1) % 10 === 0) {
        console.log(`📊 Completed ${endIdx}/${this.config.iterations} iterations`);
      }
    }

    // 통계 계산
    const statistics = this.calculateStatistics(allFinalScores);

    // 확률 분포 계산
    const probabilities = this.calculateProbabilities(allFinalScores, initialScores);

    // 리스크 메트릭 계산
    const riskMetrics = this.calculateRiskMetrics(allFinalScores, initialScores);

    // 시나리오 분류
    const categorizedScenarios = this.categorizeScenarios(simulationScenarios, statistics);

    // 추천 사항 생성
    const recommendations = this.generateRecommendations(
      statistics,
      probabilities,
      riskMetrics,
      initialScores
    );

    console.log('✅ Monte Carlo simulation completed');

    return {
      scenarios: categorizedScenarios,
      statistics,
      probabilities,
      riskMetrics,
      recommendations
    };
  }

  /**
   * 단일 시뮬레이션 반복 실행
   */
  private async runSingleIteration(
    iteration: number,
    initialScores: Record<AxisKey, number>
  ): Promise<SimulationScenario> {
    const timeline: TimePoint[] = [];
    let currentScores = { ...initialScores };

    for (let day = 0; day <= this.config.timeHorizon; day++) {
      const dayScores = this.simulateDay(currentScores, day);

      // 제약 조건 적용
      const constrainedScores = this.applyConstraints(dayScores);

      timeline.push({
        day,
        scores: { ...constrainedScores },
        volatility: this.calculateDailyVolatility(constrainedScores, currentScores)
      });

      currentScores = constrainedScores;
    }

    return {
      id: `sim-${iteration}`,
      iteration,
      timeline,
      finalScores: currentScores,
      probability: 0, // 나중에 계산
      category: 'likely' // 나중에 분류
    };
  }

  /**
   * 하루 시뮬레이션
   */
  private simulateDay(
    currentScores: Record<AxisKey, number>,
    day: number
  ): Record<AxisKey, number> {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const newScores: Record<AxisKey, number> = {} as Record<AxisKey, number>;

    // 상관관계를 고려한 랜덤 워크
    const correlatedRandoms = this.generateCorrelatedRandoms();

    for (const axis of axes) {
      const drift = this.config.drift[axis] || 0;
      const volatility = this.config.volatility[axis] || 0.1;
      const random = correlatedRandoms[axis];

      // Geometric Brownian Motion
      const dailyReturn = drift / 365 + volatility * random * Math.sqrt(1 / 365);
      const newScore = currentScores[axis] * (1 + dailyReturn);

      // 0-100 범위로 제한
      newScores[axis] = Math.max(0, Math.min(100, newScore));
    }

    return newScores;
  }

  /**
   * 상관관계를 고려한 랜덤 값 생성 (Cholesky 분해)
   */
  private generateCorrelatedRandoms(): Record<AxisKey, number> {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

    // 독립적인 표준 정규 분포 생성
    const independentRandoms = axes.map(() => this.random.normalDistribution(0, 1));

    // Cholesky 분해 적용
    const L = this.choleskyDecomposition(this.config.correlationMatrix);
    const correlatedRandoms: Record<AxisKey, number> = {} as Record<AxisKey, number>;

    for (let i = 0; i < axes.length; i++) {
      let sum = 0;
      for (let j = 0; j <= i; j++) {
        sum += L[i][j] * independentRandoms[j];
      }
      correlatedRandoms[axes[i]] = sum;
    }

    return correlatedRandoms;
  }

  /**
   * Cholesky 분해
   */
  private choleskyDecomposition(
    correlationMatrix?: Record<AxisKey, Record<AxisKey, number>>
  ): number[][] {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const n = axes.length;
    const L: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    // 기본 상관 행렬 (독립적)
    if (!correlationMatrix) {
      for (let i = 0; i < n; i++) {
        L[i][i] = 1;
      }
      return L;
    }

    // Cholesky 분해 알고리즘
    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        let sum = 0;
        for (let k = 0; k < j; k++) {
          sum += L[i][k] * L[j][k];
        }

        if (i === j) {
          L[i][j] = Math.sqrt(Math.max(0, correlationMatrix[axes[i]][axes[j]] - sum));
        } else {
          L[i][j] = (correlationMatrix[axes[i]][axes[j]] - sum) / (L[j][j] || 1);
        }
      }
    }

    return L;
  }

  /**
   * 제약 조건 적용
   */
  private applyConstraints(scores: Record<AxisKey, number>): Record<AxisKey, number> {
    const constrained = { ...scores };
    const constraints = this.config.constraints;

    if (!constraints) return constrained;

    // Min/Max 제약
    if (constraints.min || constraints.max) {
      const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
      for (const axis of axes) {
        if (constraints.min && constraints.min[axis] !== undefined) {
          constrained[axis] = Math.max(constraints.min[axis], constrained[axis]);
        }
        if (constraints.max && constraints.max[axis] !== undefined) {
          constrained[axis] = Math.min(constraints.max[axis], constrained[axis]);
        }
      }
    }

    // 의존성 제약
    if (constraints.dependencies) {
      for (const dep of constraints.dependencies) {
        const conditionMet = this.checkCondition(
          constrained[dep.if.axis],
          dep.if.condition,
          dep.if.value
        );

        if (conditionMet) {
          constrained[dep.then.axis] += dep.then.adjustment;
          constrained[dep.then.axis] = Math.max(0, Math.min(100, constrained[dep.then.axis]));
        }
      }
    }

    return constrained;
  }

  /**
   * 조건 확인
   */
  private checkCondition(value: number, condition: 'gt' | 'lt' | 'eq', threshold: number): boolean {
    switch (condition) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'eq': return Math.abs(value - threshold) < 0.1;
      default: return false;
    }
  }

  /**
   * 일일 변동성 계산
   */
  private calculateDailyVolatility(
    newScores: Record<AxisKey, number>,
    oldScores: Record<AxisKey, number>
  ): Record<AxisKey, number> {
    const volatility: Record<AxisKey, number> = {} as Record<AxisKey, number>;
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

    for (const axis of axes) {
      const change = Math.abs(newScores[axis] - oldScores[axis]);
      volatility[axis] = change / Math.max(oldScores[axis], 1);
    }

    return volatility;
  }

  /**
   * 통계 계산
   */
  private calculateStatistics(
    allScores: Record<AxisKey, number[]>
  ): SimulationStatistics {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const stats: SimulationStatistics = {
      mean: {} as Record<AxisKey, number>,
      median: {} as Record<AxisKey, number>,
      mode: {} as Record<AxisKey, number>,
      stdDev: {} as Record<AxisKey, number>,
      variance: {} as Record<AxisKey, number>,
      skewness: {} as Record<AxisKey, number>,
      kurtosis: {} as Record<AxisKey, number>,
      percentiles: {
        p5: {} as Record<AxisKey, number>,
        p25: {} as Record<AxisKey, number>,
        p50: {} as Record<AxisKey, number>,
        p75: {} as Record<AxisKey, number>,
        p95: {} as Record<AxisKey, number>
      }
    };

    for (const axis of axes) {
      const scores = allScores[axis].sort((a, b) => a - b);
      const n = scores.length;

      // 평균
      stats.mean[axis] = scores.reduce((a, b) => a + b, 0) / n;

      // 중앙값
      stats.median[axis] = n % 2 === 0
        ? (scores[n / 2 - 1] + scores[n / 2]) / 2
        : scores[Math.floor(n / 2)];

      // 최빈값 (간소화)
      stats.mode[axis] = this.calculateMode(scores);

      // 분산 & 표준편차
      const variance = scores.reduce((sum, x) => sum + Math.pow(x - stats.mean[axis], 2), 0) / n;
      stats.variance[axis] = variance;
      stats.stdDev[axis] = Math.sqrt(variance);

      // 왜도 (Skewness)
      const skew = scores.reduce((sum, x) => sum + Math.pow((x - stats.mean[axis]) / stats.stdDev[axis], 3), 0) / n;
      stats.skewness[axis] = skew;

      // 첨도 (Kurtosis)
      const kurt = scores.reduce((sum, x) => sum + Math.pow((x - stats.mean[axis]) / stats.stdDev[axis], 4), 0) / n - 3;
      stats.kurtosis[axis] = kurt;

      // 백분위수
      stats.percentiles.p5[axis] = scores[Math.floor(n * 0.05)];
      stats.percentiles.p25[axis] = scores[Math.floor(n * 0.25)];
      stats.percentiles.p50[axis] = stats.median[axis];
      stats.percentiles.p75[axis] = scores[Math.floor(n * 0.75)];
      stats.percentiles.p95[axis] = scores[Math.floor(n * 0.95)];
    }

    return stats;
  }

  /**
   * 최빈값 계산
   */
  private calculateMode(scores: number[]): number {
    const bins: Map<number, number> = new Map();
    const binSize = 1; // 1점 단위로 그룹화

    for (const score of scores) {
      const bin = Math.round(score / binSize) * binSize;
      bins.set(bin, (bins.get(bin) || 0) + 1);
    }

    let maxCount = 0;
    let mode = scores[0];

    for (const [bin, count] of bins) {
      if (count > maxCount) {
        maxCount = count;
        mode = bin;
      }
    }

    return mode;
  }

  /**
   * 확률 분포 계산
   */
  private calculateProbabilities(
    allScores: Record<AxisKey, number[]>,
    initialScores: Record<AxisKey, number>
  ): ProbabilityDistribution {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

    // 목표 달성 확률
    const targets = [70, 80, 85, 90];
    const targetProbabilities = targets.map(target => ({
      target,
      probabilities: axes.reduce((acc, axis) => {
        const count = allScores[axis].filter(score => score >= target).length;
        acc[axis] = count / allScores[axis].length;
        return acc;
      }, {} as Record<AxisKey, number>)
    }));

    // 결합 확률 (모든 축이 특정 조건 만족)
    const jointProbabilities = [
      {
        condition: 'All axes > 70',
        probability: this.calculateJointProbability(allScores, score => score > 70)
      },
      {
        condition: 'All axes > 80',
        probability: this.calculateJointProbability(allScores, score => score > 80)
      },
      {
        condition: 'Any axis < 60',
        probability: this.calculateJointProbability(allScores, score => score < 60, 'any')
      }
    ];

    // 신뢰 구간
    const confidenceIntervals = axes.reduce((acc, axis) => {
      const sorted = allScores[axis].sort((a, b) => a - b);
      const n = sorted.length;
      const lowerIdx = Math.floor(n * (1 - this.config.confidenceLevel) / 2);
      const upperIdx = Math.floor(n * (1 + this.config.confidenceLevel) / 2);

      acc[axis] = {
        lower: sorted[lowerIdx],
        upper: sorted[upperIdx]
      };
      return acc;
    }, {} as Record<AxisKey, { lower: number; upper: number }>);

    return {
      targetProbabilities,
      jointProbabilities,
      confidenceIntervals
    };
  }

  /**
   * 결합 확률 계산
   */
  private calculateJointProbability(
    allScores: Record<AxisKey, number[]>,
    condition: (score: number) => boolean,
    type: 'all' | 'any' = 'all'
  ): number {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const n = allScores[axes[0]].length;
    let count = 0;

    for (let i = 0; i < n; i++) {
      const conditions = axes.map(axis => condition(allScores[axis][i]));

      if (type === 'all' && conditions.every(c => c)) {
        count++;
      } else if (type === 'any' && conditions.some(c => c)) {
        count++;
      }
    }

    return count / n;
  }

  /**
   * 리스크 메트릭 계산
   */
  private calculateRiskMetrics(
    allScores: Record<AxisKey, number[]>,
    initialScores: Record<AxisKey, number>
  ): RiskMetrics {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

    const valueAtRisk: Record<AxisKey, number> = {} as Record<AxisKey, number>;
    const conditionalValueAtRisk: Record<AxisKey, number> = {} as Record<AxisKey, number>;
    const maxDrawdown: Record<AxisKey, number> = {} as Record<AxisKey, number>;
    const sharpeRatio: Record<AxisKey, number> = {} as Record<AxisKey, number>;
    const beta: Record<AxisKey, number> = {} as Record<AxisKey, number>;

    for (const axis of axes) {
      const scores = allScores[axis].sort((a, b) => a - b);
      const returns = scores.map(score => (score - initialScores[axis]) / initialScores[axis]);

      // Value at Risk (VaR) - 5% 최악의 경우
      const varIndex = Math.floor(scores.length * (1 - this.config.confidenceLevel));
      valueAtRisk[axis] = initialScores[axis] - scores[varIndex];

      // Conditional VaR (CVaR) - VaR 이하의 평균 손실
      const worstCases = scores.slice(0, varIndex);
      const avgWorstCase = worstCases.reduce((a, b) => a + b, 0) / (worstCases.length || 1);
      conditionalValueAtRisk[axis] = initialScores[axis] - avgWorstCase;

      // Max Drawdown
      let maxDD = 0;
      let peak = initialScores[axis];
      for (const score of scores) {
        if (score > peak) peak = score;
        const drawdown = (peak - score) / peak;
        if (drawdown > maxDD) maxDD = drawdown;
      }
      maxDrawdown[axis] = maxDD * 100;

      // Sharpe Ratio (연율화)
      const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const stdReturn = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length);
      sharpeRatio[axis] = stdReturn > 0 ? (meanReturn * Math.sqrt(365)) / (stdReturn * Math.sqrt(365)) : 0;

      // Beta (시장 대비 민감도 - 전체 평균 대비)
      const marketReturns = Array(scores.length).fill(0).map((_, i) => {
        const marketScore = axes.reduce((sum, a) => sum + allScores[a][i], 0) / axes.length;
        return (marketScore - initialScores[axis]) / initialScores[axis];
      });

      beta[axis] = this.calculateBeta(returns, marketReturns);
    }

    // 상관관계 리스크 (축 간 상관성이 너무 높은 경우)
    const correlationRisk = this.calculateCorrelationRisk(allScores);

    return {
      valueAtRisk,
      conditionalValueAtRisk,
      maxDrawdown,
      sharpeRatio,
      beta,
      correlationRisk
    };
  }

  /**
   * 베타 계산
   */
  private calculateBeta(returns: number[], marketReturns: number[]): number {
    const n = returns.length;
    const meanReturn = returns.reduce((a, b) => a + b, 0) / n;
    const meanMarket = marketReturns.reduce((a, b) => a + b, 0) / n;

    let covariance = 0;
    let marketVariance = 0;

    for (let i = 0; i < n; i++) {
      covariance += (returns[i] - meanReturn) * (marketReturns[i] - meanMarket);
      marketVariance += Math.pow(marketReturns[i] - meanMarket, 2);
    }

    return marketVariance > 0 ? covariance / marketVariance : 1;
  }

  /**
   * 상관관계 리스크 계산
   */
  private calculateCorrelationRisk(allScores: Record<AxisKey, number[]>): number {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const correlations: number[] = [];

    for (let i = 0; i < axes.length; i++) {
      for (let j = i + 1; j < axes.length; j++) {
        const corr = this.calculateCorrelation(allScores[axes[i]], allScores[axes[j]]);
        correlations.push(Math.abs(corr));
      }
    }

    // 평균 상관계수가 높을수록 리스크 증가
    const avgCorrelation = correlations.reduce((a, b) => a + b, 0) / correlations.length;
    return avgCorrelation;
  }

  /**
   * 상관계수 계산
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

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
   * 시나리오 분류
   */
  private categorizeScenarios(
    scenarios: SimulationScenario[],
    statistics: SimulationStatistics
  ): SimulationScenario[] {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

    return scenarios.map(scenario => {
      // 전체 점수 계산
      const overallScore = axes.reduce((sum, axis) => sum + scenario.finalScores[axis], 0) / axes.length;
      const meanOverall = axes.reduce((sum, axis) => sum + statistics.mean[axis], 0) / axes.length;

      // 분류 로직
      if (overallScore >= statistics.percentiles.p95[axes[0]]) {
        scenario.category = 'best';
      } else if (overallScore <= statistics.percentiles.p5[axes[0]]) {
        scenario.category = 'worst';
      } else if (Math.abs(overallScore - meanOverall) > statistics.stdDev[axes[0]] * 2) {
        scenario.category = 'outlier';
      } else {
        scenario.category = 'likely';
      }

      // 확률 계산 (간소화)
      scenario.probability = this.calculateScenarioProbability(scenario, statistics);

      return scenario;
    });
  }

  /**
   * 시나리오 확률 계산
   */
  private calculateScenarioProbability(
    scenario: SimulationScenario,
    statistics: SimulationStatistics
  ): number {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    let totalLogProb = 0;

    for (const axis of axes) {
      const score = scenario.finalScores[axis];
      const mean = statistics.mean[axis];
      const stdDev = statistics.stdDev[axis];

      // 정규 분포 가정하에 확률 밀도
      const z = (score - mean) / stdDev;
      const prob = Math.exp(-0.5 * z * z) / (stdDev * Math.sqrt(2 * Math.PI));
      totalLogProb += Math.log(Math.max(prob, 1e-10));
    }

    return Math.exp(totalLogProb / axes.length);
  }

  /**
   * 추천 사항 생성
   */
  private generateRecommendations(
    statistics: SimulationStatistics,
    probabilities: ProbabilityDistribution,
    riskMetrics: RiskMetrics,
    initialScores: Record<AxisKey, number>
  ): SimulationRecommendation[] {
    const recommendations: SimulationRecommendation[] = [];
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

    // 1. 높은 리스크 축 식별
    for (const axis of axes) {
      if (riskMetrics.valueAtRisk[axis] > 15) {
        recommendations.push({
          type: 'hedge',
          axis,
          action: `${axis} 축의 하방 리스크가 높습니다. 리스크 완화 전략 수립 필요`,
          impact: 'high',
          confidence: 0.9
        });
      }

      // 낮은 목표 달성 확률
      const prob80 = probabilities.targetProbabilities.find(t => t.target === 80);
      if (prob80 && prob80.probabilities[axis] < 0.3) {
        recommendations.push({
          type: 'focus',
          axis,
          action: `${axis} 축의 목표 달성 확률이 낮습니다. 집중적인 개선 필요`,
          impact: 'high',
          confidence: 0.85
        });
      }

      // 높은 변동성
      if (statistics.stdDev[axis] > 20) {
        recommendations.push({
          type: 'monitor',
          axis,
          action: `${axis} 축의 변동성이 높습니다. 면밀한 모니터링 필요`,
          impact: 'medium',
          confidence: 0.8
        });
      }
    }

    // 2. 전체적인 최적화 추천
    if (riskMetrics.correlationRisk > 0.7) {
      recommendations.push({
        type: 'optimize',
        axis: 'overall',
        action: '축 간 상관관계가 높아 다변화 효과가 제한적입니다. 독립적인 개선 전략 수립 권장',
        impact: 'high',
        confidence: 0.75
      });
    }

    // 3. 기회 포착
    for (const axis of axes) {
      const upside = statistics.percentiles.p95[axis] - initialScores[axis];
      if (upside > 25 && probabilities.confidenceIntervals[axis].lower > initialScores[axis]) {
        recommendations.push({
          type: 'optimize',
          axis,
          action: `${axis} 축에 상당한 상승 잠재력이 있습니다. 적극적인 투자 고려`,
          impact: 'high',
          confidence: 0.7
        });
      }
    }

    // 우선순위 정렬
    return recommendations.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      const impactDiff = impactOrder[b.impact] - impactOrder[a.impact];
      if (impactDiff !== 0) return impactDiff;
      return b.confidence - a.confidence;
    });
  }

  /**
   * 설정 초기화
   */
  private initializeConfig(config: SimulationConfig): Required<SimulationConfig> {
    const defaultCorrelation: Record<AxisKey, Record<AxisKey, number>> = {
      GO: { GO: 1, EC: 0.3, PT: 0.4, PF: 0.5, TO: 0.3 },
      EC: { GO: 0.3, EC: 1, PT: 0.5, PF: 0.3, TO: 0.6 },
      PT: { GO: 0.4, EC: 0.5, PT: 1, PF: 0.4, TO: 0.5 },
      PF: { GO: 0.5, EC: 0.3, PT: 0.4, PF: 1, TO: 0.4 },
      TO: { GO: 0.3, EC: 0.6, PT: 0.5, PF: 0.4, TO: 1 }
    };

    const defaultVolatility: Record<AxisKey, number> = {
      GO: 0.15, EC: 0.2, PT: 0.18, PF: 0.22, TO: 0.25
    };

    const defaultDrift: Record<AxisKey, number> = {
      GO: 0.05, EC: 0.03, PT: 0.04, PF: 0.06, TO: 0.02
    };

    return {
      iterations: config.iterations || 10000,
      timeHorizon: config.timeHorizon || 30,
      confidenceLevel: config.confidenceLevel || 0.95,
      correlationMatrix: config.correlationMatrix || defaultCorrelation,
      volatility: config.volatility || defaultVolatility,
      drift: config.drift || defaultDrift,
      constraints: config.constraints || {}
    };
  }
}

/**
 * 난수 생성기
 */
class RandomNumberGenerator {
  /**
   * Box-Muller 변환을 사용한 정규 분포 난수 생성
   */
  normalDistribution(mean: number = 0, stdDev: number = 1): number {
    let u1 = 0, u2 = 0;
    while (u1 === 0) u1 = Math.random(); // [0,1) -> (0,1)
    while (u2 === 0) u2 = Math.random();

    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  /**
   * 균등 분포 난수
   */
  uniform(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * 지수 분포 난수
   */
  exponential(lambda: number): number {
    return -Math.log(1 - Math.random()) / lambda;
  }
}

// 싱글톤 인스턴스
let simulator: MonteCarloSimulator | null = null;

export const getMonteCarloSimulator = (config?: SimulationConfig): MonteCarloSimulator => {
  if (!simulator || config) {
    simulator = new MonteCarloSimulator(config);
  }
  return simulator;
};