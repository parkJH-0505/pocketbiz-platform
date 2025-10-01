/**
 * Real-Time Simulation Engine - Phase 8
 * 실시간 KPI 시뮬레이션과 시나리오 분석을 위한 고성능 엔진
 */

import type { AxisKey } from '../../pages/startup/kpi-tabs/ResultsInsightsPanelV2/types';
import { getMonteCarloSimulator } from './MonteCarloSimulator';
import { BrowserEventEmitter } from '../../utils/BrowserEventEmitter';

// 실시간 시뮬레이션 설정
export interface RealTimeSimConfig {
  updateInterval: number; // ms
  maxScenarios: number;
  autoOptimization: boolean;
  enableStreaming: boolean;
  performanceMode: 'fast' | 'balanced' | 'accurate';
}

// 시나리오 정의
export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  parameters: {
    targetScores?: Partial<Record<AxisKey, number>>;
    timeHorizon: number;
    volatility: Record<AxisKey, number>;
    correlations: Record<AxisKey, Record<AxisKey, number>>;
    externalFactors?: ExternalFactor[];
  };
  active: boolean;
  priority: number;
}

// 외부 요인
export interface ExternalFactor {
  id: string;
  name: string;
  type: 'market' | 'economic' | 'technology' | 'regulation' | 'competition';
  impact: Record<AxisKey, number>; // -1 to 1
  probability: number; // 0 to 1
  timing: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
}

// 실시간 결과
export interface RealTimeResult {
  timestamp: number;
  scenarioId: string;
  currentState: Record<AxisKey, number>;
  predictions: Array<{
    day: number;
    scores: Record<AxisKey, number>;
    confidence: Record<AxisKey, number>;
    probability: number;
  }>;
  trends: {
    direction: Record<AxisKey, 'up' | 'down' | 'stable'>;
    momentum: Record<AxisKey, number>;
    acceleration: Record<AxisKey, number>;
  };
  risks: RiskAnalysis[];
  opportunities: OpportunityAnalysis[];
}

// 리스크 분석
export interface RiskAnalysis {
  type: 'volatility' | 'trend' | 'correlation' | 'external';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedAxes: AxisKey[];
  description: string;
  probability: number;
  impact: number;
  mitigation: string[];
}

// 기회 분석
export interface OpportunityAnalysis {
  type: 'growth' | 'efficiency' | 'synergy' | 'market';
  potential: 'low' | 'medium' | 'high';
  affectedAxes: AxisKey[];
  description: string;
  probability: number;
  expectedGain: number;
  requirements: string[];
}

// 스트리밍 이벤트
export interface StreamingEvent {
  type: 'update' | 'alert' | 'milestone' | 'scenario_change';
  data: any;
  timestamp: number;
}

/**
 * 실시간 시뮬레이션 엔진 클래스
 */
export class RealTimeSimulationEngine extends BrowserEventEmitter {
  private config: RealTimeSimConfig;
  private scenarios: Map<string, SimulationScenario>;
  private activeResults: Map<string, RealTimeResult>;
  private updateTimer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private performanceMetrics: {
    avgUpdateTime: number;
    updateCount: number;
    errorCount: number;
    lastUpdate: number;
  };

  constructor(config?: Partial<RealTimeSimConfig>) {
    super();

    this.config = {
      updateInterval: 5000, // 5초
      maxScenarios: 10,
      autoOptimization: true,
      enableStreaming: true,
      performanceMode: 'balanced',
      ...config
    };

    this.scenarios = new Map();
    this.activeResults = new Map();
    this.performanceMetrics = {
      avgUpdateTime: 0,
      updateCount: 0,
      errorCount: 0,
      lastUpdate: 0
    };

    this.initializeDefaultScenarios();
  }

  /**
   * 시뮬레이션 시작
   */
  start(): void {
    if (this.isRunning) {
      console.warn('Simulation engine is already running');
      return;
    }

    // ('🚀 Starting real-time simulation engine');
    this.isRunning = true;

    // 정기 업데이트 스케줄링
    this.updateTimer = setInterval(() => {
      this.performUpdate();
    }, this.config.updateInterval);

    // 초기 실행
    this.performUpdate();

    this.emit('started');
  }

  /**
   * 시뮬레이션 중지
   */
  stop(): void {
    if (!this.isRunning) return;

    // ('⏹️ Stopping real-time simulation engine');
    this.isRunning = false;

    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    this.emit('stopped');
  }

  /**
   * 시나리오 추가
   */
  addScenario(scenario: SimulationScenario): void {
    if (this.scenarios.size >= this.config.maxScenarios) {
      throw new Error(`Maximum scenarios limit reached (${this.config.maxScenarios})`);
    }

    this.scenarios.set(scenario.id, scenario);
    // (`📊 Added scenario: ${scenario.name}`);

    if (scenario.active && this.isRunning) {
      this.runScenario(scenario.id);
    }

    this.emit('scenarioAdded', scenario);
  }

  /**
   * 시나리오 제거
   */
  removeScenario(scenarioId: string): void {
    if (this.scenarios.delete(scenarioId)) {
      this.activeResults.delete(scenarioId);
      // (`🗑️ Removed scenario: ${scenarioId}`);
      this.emit('scenarioRemoved', scenarioId);
    }
  }

  /**
   * 시나리오 활성화/비활성화
   */
  toggleScenario(scenarioId: string, active: boolean): void {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) return;

    scenario.active = active;

    if (active && this.isRunning) {
      this.runScenario(scenarioId);
    } else {
      this.activeResults.delete(scenarioId);
    }

    this.emit('scenarioToggled', { scenarioId, active });
  }

  /**
   * 현재 스코어 업데이트 (외부에서 호출)
   */
  updateCurrentScores(scores: Record<AxisKey, number>): void {
    // 모든 활성 시나리오의 기준점 업데이트
    for (const [scenarioId, scenario] of this.scenarios) {
      if (scenario.active) {
        this.runScenario(scenarioId, scores);
      }
    }
  }

  /**
   * 실시간 결과 조회
   */
  getResults(scenarioId?: string): RealTimeResult[] {
    if (scenarioId) {
      const result = this.activeResults.get(scenarioId);
      return result ? [result] : [];
    }
    return Array.from(this.activeResults.values());
  }

  /**
   * 성능 메트릭 조회
   */
  getPerformanceMetrics(): any {
    return { ...this.performanceMetrics };
  }

  /**
   * 정기 업데이트 실행
   */
  private async performUpdate(): Promise<void> {
    const startTime = Date.now();

    try {
      const activeScenarios = Array.from(this.scenarios.entries())
        .filter(([_, scenario]) => scenario.active);

      // 병렬로 모든 활성 시나리오 실행
      await Promise.allSettled(
        activeScenarios.map(([scenarioId, _]) => this.runScenario(scenarioId))
      );

      // 성능 메트릭 업데이트
      const updateTime = Date.now() - startTime;
      this.updatePerformanceMetrics(updateTime);

      if (this.config.enableStreaming) {
        this.emitStreamingUpdate();
      }

    } catch (error) {
      console.error('Update cycle error:', error);
      this.performanceMetrics.errorCount++;
    }
  }

  /**
   * 개별 시나리오 실행
   */
  private async runScenario(scenarioId: string, currentScores?: Record<AxisKey, number>): Promise<void> {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario || !scenario.active) return;

    try {
      // 기본 점수 사용 (실제 구현에서는 현재 KPI 점수 사용)
      const baseScores = currentScores || {
        GO: 75, EC: 72, PT: 78, PF: 70, TO: 73
      };

      // 외부 요인 적용
      const adjustedScores = this.applyExternalFactors(baseScores, scenario.parameters.externalFactors);

      // 시뮬레이션 실행
      const simulator = getMonteCarloSimulator({
        iterations: this.getIterationsForMode(),
        timeHorizon: scenario.parameters.timeHorizon,
        confidenceLevel: 0.95,
        volatility: scenario.parameters.volatility,
        correlationMatrix: scenario.parameters.correlations
      });

      const simResult = await simulator.runSimulation(adjustedScores);

      // 트렌드 분석
      const trends = this.analyzeTrends(simResult);

      // 리스크 분석
      const risks = this.analyzeRisks(simResult, scenario);

      // 기회 분석
      const opportunities = this.analyzeOpportunities(simResult, scenario);

      // 예측 데이터 구성
      const predictions = this.formatPredictions(simResult);

      const result: RealTimeResult = {
        timestamp: Date.now(),
        scenarioId,
        currentState: adjustedScores,
        predictions,
        trends,
        risks,
        opportunities
      };

      this.activeResults.set(scenarioId, result);
      this.emit('scenarioUpdated', result);

    } catch (error) {
      console.error(`Error running scenario ${scenarioId}:`, error);
      this.performanceMetrics.errorCount++;
    }
  }

  /**
   * 외부 요인 적용
   */
  private applyExternalFactors(
    baseScores: Record<AxisKey, number>,
    factors?: ExternalFactor[]
  ): Record<AxisKey, number> {
    if (!factors?.length) return baseScores;

    const adjustedScores = { ...baseScores };
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

    for (const factor of factors) {
      const impactMultiplier = factor.probability;

      for (const axis of axes) {
        const impact = factor.impact[axis] * impactMultiplier * 10; // 최대 ±10점 영향
        adjustedScores[axis] = Math.max(0, Math.min(100, adjustedScores[axis] + impact));
      }
    }

    return adjustedScores;
  }

  /**
   * 트렌드 분석
   */
  private analyzeTrends(simResult: any): any {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const direction: Record<AxisKey, 'up' | 'down' | 'stable'> = {} as any;
    const momentum: Record<AxisKey, number> = {} as any;
    const acceleration: Record<AxisKey, number> = {} as any;

    for (const axis of axes) {
      const scenarios = simResult.scenarios || [];
      if (scenarios.length === 0) {
        direction[axis] = 'stable';
        momentum[axis] = 0;
        acceleration[axis] = 0;
        continue;
      }

      // 최근 시나리오들의 트렌드 계산
      const recentScenarios = scenarios.slice(-10);
      const values = recentScenarios.map((s: any) => s.finalScores[axis]);

      if (values.length < 2) {
        direction[axis] = 'stable';
        momentum[axis] = 0;
        acceleration[axis] = 0;
        continue;
      }

      // 방향성 계산
      const avgChange = (values[values.length - 1] - values[0]) / values.length;
      direction[axis] = Math.abs(avgChange) < 0.5 ? 'stable' : avgChange > 0 ? 'up' : 'down';

      // 모멘텀 계산 (변화율)
      momentum[axis] = Math.abs(avgChange);

      // 가속도 계산 (변화율의 변화)
      if (values.length >= 3) {
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        const firstRate = (firstHalf[firstHalf.length - 1] - firstHalf[0]) / firstHalf.length;
        const secondRate = (secondHalf[secondHalf.length - 1] - secondHalf[0]) / secondHalf.length;
        acceleration[axis] = secondRate - firstRate;
      } else {
        acceleration[axis] = 0;
      }
    }

    return { direction, momentum, acceleration };
  }

  /**
   * 리스크 분석
   */
  private analyzeRisks(simResult: any, scenario: SimulationScenario): RiskAnalysis[] {
    const risks: RiskAnalysis[] = [];

    // 변동성 리스크
    if (simResult.riskMetrics) {
      const highVolatilityAxes = Object.entries(simResult.riskMetrics.maxDrawdown)
        .filter(([_, value]) => (value as number) > 15)
        .map(([axis, _]) => axis as AxisKey);

      if (highVolatilityAxes.length > 0) {
        risks.push({
          type: 'volatility',
          severity: highVolatilityAxes.length > 2 ? 'high' : 'medium',
          affectedAxes: highVolatilityAxes,
          description: `${highVolatilityAxes.join(', ')} 축에서 높은 변동성 감지`,
          probability: 0.7,
          impact: 0.6,
          mitigation: ['변동성 완화 전략 수립', '리스크 헤징 검토']
        });
      }
    }

    // 상관관계 리스크
    if (simResult.riskMetrics?.correlationRisk > 0.8) {
      risks.push({
        type: 'correlation',
        severity: 'medium',
        affectedAxes: ['GO', 'EC', 'PT', 'PF', 'TO'],
        description: '축 간 높은 상관관계로 인한 집중 리스크',
        probability: 0.6,
        impact: 0.5,
        mitigation: ['다변화 전략 강화', '독립적 개선 방안 모색']
      });
    }

    // 외부 요인 리스크
    if (scenario.parameters.externalFactors) {
      const highImpactFactors = scenario.parameters.externalFactors.filter(
        factor => factor.probability > 0.7 && Math.max(...Object.values(factor.impact).map(Math.abs)) > 0.3
      );

      for (const factor of highImpactFactors) {
        const affectedAxes = Object.entries(factor.impact)
          .filter(([_, impact]) => Math.abs(impact) > 0.2)
          .map(([axis, _]) => axis as AxisKey);

        risks.push({
          type: 'external',
          severity: factor.probability > 0.8 ? 'high' : 'medium',
          affectedAxes,
          description: `${factor.name} 요인의 영향`,
          probability: factor.probability,
          impact: Math.max(...Object.values(factor.impact).map(Math.abs)),
          mitigation: [`${factor.name} 모니터링 강화`, '대응 계획 수립']
        });
      }
    }

    return risks;
  }

  /**
   * 기회 분석
   */
  private analyzeOpportunities(simResult: any, scenario: SimulationScenario): OpportunityAnalysis[] {
    const opportunities: OpportunityAnalysis[] = [];

    // 성장 기회
    if (simResult.statistics) {
      const upwardAxes = Object.entries(simResult.statistics.mean)
        .filter(([axis, mean]) => {
          const currentScore = scenario.parameters.targetScores?.[axis as AxisKey];
          return currentScore && (mean as number) > currentScore + 5;
        })
        .map(([axis, _]) => axis as AxisKey);

      if (upwardAxes.length > 0) {
        opportunities.push({
          type: 'growth',
          potential: upwardAxes.length > 2 ? 'high' : 'medium',
          affectedAxes: upwardAxes,
          description: `${upwardAxes.join(', ')} 축에서 성장 잠재력 발견`,
          probability: 0.8,
          expectedGain: 10,
          requirements: ['집중 투자', '전략적 실행']
        });
      }
    }

    // 시너지 기회
    if (simResult.riskMetrics?.correlationRisk > 0.5 && simResult.riskMetrics.correlationRisk < 0.8) {
      opportunities.push({
        type: 'synergy',
        potential: 'medium',
        affectedAxes: ['GO', 'EC', 'PT', 'PF', 'TO'],
        description: '축 간 적절한 상관관계를 통한 시너지 효과',
        probability: 0.6,
        expectedGain: 8,
        requirements: ['통합 전략 수립', '크로스 펑셔널 협업']
      });
    }

    return opportunities;
  }

  /**
   * 예측 데이터 포맷팅
   */
  private formatPredictions(simResult: any): any[] {
    const predictions: any[] = [];

    if (simResult.scenarios?.length > 0) {
      // 대표 시나리오 선택 (평균적인 시나리오)
      const representativeScenario = simResult.scenarios
        .sort((a: any, b: any) => Math.abs(a.probability - 0.5) - Math.abs(b.probability - 0.5))[0];

      if (representativeScenario?.timeline) {
        for (let i = 0; i < Math.min(representativeScenario.timeline.length, 30); i++) {
          const timePoint = representativeScenario.timeline[i];
          predictions.push({
            day: timePoint.day,
            scores: timePoint.scores,
            confidence: this.calculateConfidence(timePoint, simResult),
            probability: representativeScenario.probability
          });
        }
      }
    }

    return predictions;
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(timePoint: any, simResult: any): Record<AxisKey, number> {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const confidence: Record<AxisKey, number> = {} as any;

    for (const axis of axes) {
      // 기본 신뢰도에서 시간과 변동성에 따라 감소
      const baseConfidence = 0.9;
      const timeDecay = Math.exp(-0.02 * timePoint.day);
      const volatilityPenalty = timePoint.volatility?.[axis] || 0;

      confidence[axis] = Math.max(0.3, baseConfidence * timeDecay * (1 - volatilityPenalty));
    }

    return confidence;
  }

  /**
   * 성능 메트릭 업데이트
   */
  private updatePerformanceMetrics(updateTime: number): void {
    this.performanceMetrics.updateCount++;
    this.performanceMetrics.avgUpdateTime =
      (this.performanceMetrics.avgUpdateTime * (this.performanceMetrics.updateCount - 1) + updateTime) /
      this.performanceMetrics.updateCount;
    this.performanceMetrics.lastUpdate = Date.now();
  }

  /**
   * 스트리밍 업데이트 발송
   */
  private emitStreamingUpdate(): void {
    const event: StreamingEvent = {
      type: 'update',
      data: {
        results: Array.from(this.activeResults.values()),
        metrics: this.performanceMetrics,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    };

    this.emit('streamingUpdate', event);
  }

  /**
   * 성능 모드에 따른 반복 횟수
   */
  private getIterationsForMode(): number {
    switch (this.config.performanceMode) {
      case 'fast': return 500;
      case 'balanced': return 1000;
      case 'accurate': return 2000;
      default: return 1000;
    }
  }

  /**
   * 기본 시나리오 초기화
   */
  private initializeDefaultScenarios(): void {
    // 기본 시나리오
    this.addScenario({
      id: 'baseline',
      name: '기준 시나리오',
      description: '현재 상태 기반 기본 시뮬레이션',
      parameters: {
        timeHorizon: 30,
        volatility: { GO: 0.15, EC: 0.2, PT: 0.18, PF: 0.22, TO: 0.25 },
        correlations: {
          GO: { GO: 1, EC: 0.3, PT: 0.4, PF: 0.5, TO: 0.3 },
          EC: { GO: 0.3, EC: 1, PT: 0.5, PF: 0.3, TO: 0.6 },
          PT: { GO: 0.4, EC: 0.5, PT: 1, PF: 0.4, TO: 0.5 },
          PF: { GO: 0.5, EC: 0.3, PT: 0.4, PF: 1, TO: 0.4 },
          TO: { GO: 0.3, EC: 0.6, PT: 0.5, PF: 0.4, TO: 1 }
        }
      },
      active: true,
      priority: 1
    });

    // 최적화 시나리오
    this.addScenario({
      id: 'optimistic',
      name: '최적화 시나리오',
      description: '목표 달성을 위한 최적화된 시뮬레이션',
      parameters: {
        targetScores: { GO: 85, EC: 85, PT: 85, PF: 85, TO: 85 },
        timeHorizon: 90,
        volatility: { GO: 0.1, EC: 0.15, PT: 0.12, PF: 0.18, TO: 0.2 },
        correlations: {
          GO: { GO: 1, EC: 0.4, PT: 0.5, PF: 0.6, TO: 0.4 },
          EC: { GO: 0.4, EC: 1, PT: 0.6, PF: 0.4, TO: 0.7 },
          PT: { GO: 0.5, EC: 0.6, PT: 1, PF: 0.5, TO: 0.6 },
          PF: { GO: 0.6, EC: 0.4, PT: 0.5, PF: 1, TO: 0.5 },
          TO: { GO: 0.4, EC: 0.7, PT: 0.6, PF: 0.5, TO: 1 }
        }
      },
      active: false,
      priority: 2
    });
  }
}

// 싱글톤 인스턴스
let realTimeEngine: RealTimeSimulationEngine | null = null;

export const getRealTimeSimulationEngine = (config?: Partial<RealTimeSimConfig>): RealTimeSimulationEngine => {
  if (!realTimeEngine) {
    realTimeEngine = new RealTimeSimulationEngine(config);
  }
  return realTimeEngine;
};