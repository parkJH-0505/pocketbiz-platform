/**
 * Advanced Scenario Engine
 * 고급 시나리오 엔진 - 다차원 시뮬레이션, 상호작용 효과, 몬테카를로 시뮬레이션
 */

import { AdvancedPredictionEngine } from './predictionEngine';
import type { AxisKey } from '../types';

export interface ScenarioVariable {
  key: string;
  label: string;
  type: 'slider' | 'toggle' | 'select' | 'input';
  value: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  impact: Partial<Record<AxisKey, number>>; // 각 KPI에 대한 영향도
  dependencies?: string[]; // 다른 변수와의 의존성
}

export interface InteractionEffect {
  variables: string[];
  type: 'synergy' | 'conflict' | 'diminishing' | 'amplifying';
  magnitude: number;
  affectedAxes: AxisKey[];
  condition?: (values: Record<string, any>) => boolean;
}

export interface MonteCarloConfig {
  iterations: number;
  confidenceInterval: number;
  riskThreshold: number;
  variabilityFactor: number;
}

export interface ScenarioResult {
  baselineScores: Record<AxisKey, number>;
  projectedScores: Record<AxisKey, number>;
  confidenceInterval: Record<AxisKey, { lower: number; upper: number }>;
  riskMetrics: {
    volatility: Record<AxisKey, number>;
    worstCase: Record<AxisKey, number>;
    bestCase: Record<AxisKey, number>;
    probability: Record<AxisKey, number>;
  };
  interactionEffects: {
    detected: InteractionEffect[];
    impact: Record<AxisKey, number>;
  };
  sensitivity: Record<string, Record<AxisKey, number>>;
  recommendations: ScenarioRecommendation[];
}

export interface ScenarioRecommendation {
  type: 'optimization' | 'risk-mitigation' | 'opportunity' | 'warning';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggestedActions: string[];
  expectedImpact: Partial<Record<AxisKey, number>>;
  timeframe: 'immediate' | 'short' | 'medium' | 'long';
}

export class AdvancedScenarioEngine {
  private predictionEngine: AdvancedPredictionEngine;
  private variables: Map<string, ScenarioVariable>;
  private interactionEffects: InteractionEffect[];
  private baselineScores: Record<AxisKey, number>;

  constructor() {
    this.predictionEngine = new AdvancedPredictionEngine();
    this.variables = new Map();
    this.interactionEffects = [];
    this.baselineScores = {
      GO: 0, EC: 0, PT: 0, PF: 0, TO: 0
    };
    this.initializeVariables();
    this.initializeInteractionEffects();
  }

  private initializeVariables(): void {
    const defaultVariables: ScenarioVariable[] = [
      {
        key: 'pricing_strategy',
        label: '가격 전략',
        type: 'select',
        value: 'current',
        options: ['aggressive_low', 'competitive', 'current', 'premium', 'value_based'],
        impact: { EC: 0.3, GO: 0.2, PT: -0.1 },
        dependencies: ['market_position', 'competitor_response']
      },
      {
        key: 'team_expansion',
        label: '팀 확장률',
        type: 'slider',
        value: 0,
        min: -30,
        max: 100,
        step: 5,
        impact: { PT: 0.4, TO: 0.3, EC: -0.1 },
        dependencies: ['funding_level', 'market_growth']
      },
      {
        key: 'marketing_budget',
        label: '마케팅 예산 변화',
        type: 'slider',
        value: 0,
        min: -50,
        max: 200,
        step: 10,
        impact: { GO: 0.5, EC: -0.2, PF: 0.1 },
        dependencies: ['pricing_strategy', 'market_conditions']
      },
      {
        key: 'product_features',
        label: '제품 기능 개선',
        type: 'slider',
        value: 0,
        min: 0,
        max: 100,
        step: 5,
        impact: { PT: 0.6, GO: 0.3, PF: 0.4 },
        dependencies: ['team_expansion', 'rd_budget']
      },
      {
        key: 'market_conditions',
        label: '시장 상황',
        type: 'select',
        value: 'stable',
        options: ['recession', 'slow', 'stable', 'growth', 'boom'],
        impact: { EC: 0.4, GO: 0.3, PF: 0.2 },
        dependencies: []
      },
      {
        key: 'automation_level',
        label: '자동화 수준',
        type: 'slider',
        value: 0,
        min: 0,
        max: 100,
        step: 10,
        impact: { TO: 0.5, EC: 0.3, PT: -0.1 },
        dependencies: ['team_expansion', 'funding_level']
      }
    ];

    defaultVariables.forEach(variable => {
      this.variables.set(variable.key, variable);
    });
  }

  private initializeInteractionEffects(): void {
    this.interactionEffects = [
      {
        variables: ['pricing_strategy', 'marketing_budget'],
        type: 'synergy',
        magnitude: 1.3,
        affectedAxes: ['GO', 'EC'],
        condition: (values) => values.pricing_strategy === 'premium' && values.marketing_budget > 50
      },
      {
        variables: ['team_expansion', 'automation_level'],
        type: 'conflict',
        magnitude: 0.7,
        affectedAxes: ['TO', 'PT'],
        condition: (values) => values.team_expansion > 30 && values.automation_level > 60
      },
      {
        variables: ['product_features', 'team_expansion'],
        type: 'amplifying',
        magnitude: 1.2,
        affectedAxes: ['PT', 'PF'],
        condition: (values) => values.product_features > 40 && values.team_expansion > 20
      },
      {
        variables: ['market_conditions', 'pricing_strategy'],
        type: 'diminishing',
        magnitude: 0.8,
        affectedAxes: ['EC', 'GO'],
        condition: (values) => values.market_conditions === 'recession' && values.pricing_strategy === 'premium'
      }
    ];
  }

  async runScenario(
    variableValues: Record<string, any>,
    config: MonteCarloConfig = {
      iterations: 1000,
      confidenceInterval: 95,
      riskThreshold: 0.1,
      variabilityFactor: 0.15
    }
  ): Promise<ScenarioResult> {
    // 1. 기본 점수 계산
    const baseScores = this.calculateBaseImpact(variableValues);

    // 2. 상호작용 효과 적용
    const interactionEffects = this.calculateInteractionEffects(variableValues);
    const adjustedScores = this.applyInteractionEffects(baseScores, interactionEffects);

    // 3. 몬테카를로 시뮬레이션
    const monteCarloResults = await this.runMonteCarloSimulation(
      adjustedScores,
      variableValues,
      config
    );

    // 4. 민감도 분석
    const sensitivityAnalysis = await this.performSensitivityAnalysis(variableValues);

    // 5. 추천사항 생성
    const recommendations = this.generateRecommendations(
      adjustedScores,
      monteCarloResults,
      sensitivityAnalysis
    );

    return {
      baselineScores: this.baselineScores,
      projectedScores: adjustedScores,
      confidenceInterval: monteCarloResults.confidenceInterval,
      riskMetrics: monteCarloResults.riskMetrics,
      interactionEffects: {
        detected: interactionEffects.filter(effect => effect.magnitude !== 1),
        impact: interactionEffects.reduce((acc, effect) => {
          effect.affectedAxes.forEach(axis => {
            acc[axis] = (acc[axis] || 0) + (effect.magnitude - 1) * 10;
          });
          return acc;
        }, {} as Record<AxisKey, number>)
      },
      sensitivity: sensitivityAnalysis,
      recommendations
    };
  }

  private calculateBaseImpact(variableValues: Record<string, any>): Record<AxisKey, number> {
    const scores = { ...this.baselineScores };

    Object.entries(variableValues).forEach(([key, value]) => {
      const variable = this.variables.get(key);
      if (!variable) return;

      Object.entries(variable.impact).forEach(([axis, impact]) => {
        if (variable.type === 'slider') {
          // 슬라이더 타입: 값에 비례하여 영향
          const normalizedValue = (value as number) / 100;
          scores[axis as AxisKey] += impact * normalizedValue;
        } else if (variable.type === 'select') {
          // 선택 타입: 옵션별 가중치 적용
          const multiplier = this.getSelectMultiplier(value as string, variable.options || []);
          scores[axis as AxisKey] += impact * multiplier;
        } else if (variable.type === 'toggle') {
          // 토글 타입: on/off 영향
          scores[axis as AxisKey] += value ? impact : 0;
        }
      });
    });

    return scores;
  }

  private getSelectMultiplier(value: string, options: string[]): number {
    const index = options.indexOf(value);
    const total = options.length - 1;
    if (total === 0) return 1;

    // -1 (최소) ~ +1 (최대) 범위로 정규화
    return (index / total) * 2 - 1;
  }

  private calculateInteractionEffects(variableValues: Record<string, any>): InteractionEffect[] {
    return this.interactionEffects.filter(effect => {
      return effect.condition ? effect.condition(variableValues) : true;
    });
  }

  private applyInteractionEffects(
    baseScores: Record<AxisKey, number>,
    effects: InteractionEffect[]
  ): Record<AxisKey, number> {
    const adjustedScores = { ...baseScores };

    effects.forEach(effect => {
      effect.affectedAxes.forEach(axis => {
        adjustedScores[axis] *= effect.magnitude;
      });
    });

    return adjustedScores;
  }

  private async runMonteCarloSimulation(
    projectedScores: Record<AxisKey, number>,
    variableValues: Record<string, any>,
    config: MonteCarloConfig
  ): Promise<{
    confidenceInterval: Record<AxisKey, { lower: number; upper: number }>;
    riskMetrics: {
      volatility: Record<AxisKey, number>;
      worstCase: Record<AxisKey, number>;
      bestCase: Record<AxisKey, number>;
      probability: Record<AxisKey, number>;
    };
  }> {
    const results: Record<AxisKey, number[]> = {
      GO: [], EC: [], PT: [], PF: [], TO: []
    };

    // 몬테카를로 시뮬레이션 실행
    for (let i = 0; i < config.iterations; i++) {
      const perturbedValues = this.perturbVariables(variableValues, config.variabilityFactor);
      const simulationResult = this.calculateBaseImpact(perturbedValues);
      const effects = this.calculateInteractionEffects(perturbedValues);
      const finalResult = this.applyInteractionEffects(simulationResult, effects);

      Object.entries(finalResult).forEach(([axis, score]) => {
        results[axis as AxisKey].push(score);
      });
    }

    // 통계 계산
    const confidenceInterval: Record<AxisKey, { lower: number; upper: number }> = {} as any;
    const riskMetrics = {
      volatility: {} as Record<AxisKey, number>,
      worstCase: {} as Record<AxisKey, number>,
      bestCase: {} as Record<AxisKey, number>,
      probability: {} as Record<AxisKey, number>
    };

    Object.entries(results).forEach(([axis, values]) => {
      values.sort((a, b) => a - b);
      const lowerIndex = Math.floor((100 - config.confidenceInterval) / 2 / 100 * values.length);
      const upperIndex = Math.ceil((100 + config.confidenceInterval) / 2 / 100 * values.length);

      confidenceInterval[axis as AxisKey] = {
        lower: values[lowerIndex] || values[0],
        upper: values[upperIndex] || values[values.length - 1]
      };

      riskMetrics.volatility[axis as AxisKey] = this.calculateStandardDeviation(values);
      riskMetrics.worstCase[axis as AxisKey] = Math.min(...values);
      riskMetrics.bestCase[axis as AxisKey] = Math.max(...values);
      riskMetrics.probability[axis as AxisKey] = values.filter(v => v > projectedScores[axis as AxisKey]).length / values.length;
    });

    return { confidenceInterval, riskMetrics };
  }

  private perturbVariables(
    variableValues: Record<string, any>,
    variabilityFactor: number
  ): Record<string, any> {
    const perturbed = { ...variableValues };

    Object.keys(perturbed).forEach(key => {
      const variable = this.variables.get(key);
      if (!variable) return;

      if (variable.type === 'slider' && typeof perturbed[key] === 'number') {
        const noise = (Math.random() - 0.5) * 2 * variabilityFactor * 100;
        perturbed[key] = Math.max(variable.min || -100, Math.min(variable.max || 100, perturbed[key] + noise));
      }
    });

    return perturbed;
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private async performSensitivityAnalysis(
    baseValues: Record<string, any>
  ): Promise<Record<string, Record<AxisKey, number>>> {
    const sensitivity: Record<string, Record<AxisKey, number>> = {};

    for (const [variableKey, variable] of this.variables.entries()) {
      sensitivity[variableKey] = {} as Record<AxisKey, number>;

      if (variable.type === 'slider') {
        const baseResult = this.calculateBaseImpact(baseValues);

        // +10% 변화 시뮬레이션
        const perturbedValues = {
          ...baseValues,
          [variableKey]: (baseValues[variableKey] as number) + 10
        };
        const perturbedResult = this.calculateBaseImpact(perturbedValues);

        Object.keys(baseResult).forEach(axis => {
          const axisKey = axis as AxisKey;
          const change = perturbedResult[axisKey] - baseResult[axisKey];
          sensitivity[variableKey][axisKey] = change / 10; // 10% 변화당 영향도
        });
      }
    }

    return sensitivity;
  }

  private generateRecommendations(
    projectedScores: Record<AxisKey, number>,
    monteCarloResults: any,
    sensitivityAnalysis: Record<string, Record<AxisKey, number>>
  ): ScenarioRecommendation[] {
    const recommendations: ScenarioRecommendation[] = [];

    // 1. 위험 완화 추천
    Object.entries(monteCarloResults.riskMetrics.volatility).forEach(([axis, volatility]) => {
      if (volatility > 15) {
        recommendations.push({
          type: 'risk-mitigation',
          priority: 'high',
          title: `${this.getAxisName(axis as AxisKey)} 변동성 완화`,
          description: `${this.getAxisName(axis as AxisKey)}의 변동성이 높습니다 (${volatility.toFixed(1)}%). 안정성 확보가 필요합니다.`,
          suggestedActions: [
            '다양한 수익원 확보',
            '리스크 헤지 전략 수립',
            '단계적 변화 접근법 적용'
          ],
          expectedImpact: { [axis as AxisKey]: -volatility * 0.3 },
          timeframe: 'medium'
        });
      }
    });

    // 2. 최적화 기회 추천
    const mostSensitiveVariable = this.findMostSensitiveVariable(sensitivityAnalysis);
    if (mostSensitiveVariable) {
      recommendations.push({
        type: 'optimization',
        priority: 'high',
        title: `${mostSensitiveVariable.variable} 최적화`,
        description: `${mostSensitiveVariable.variable}이 KPI에 가장 큰 영향을 미칩니다. 우선적으로 최적화하세요.`,
        suggestedActions: [
          '현재 설정값 재검토',
          'A/B 테스트 실행',
          '점진적 조정 및 모니터링'
        ],
        expectedImpact: mostSensitiveVariable.impact,
        timeframe: 'short'
      });
    }

    // 3. 기회 포착 추천
    Object.entries(projectedScores).forEach(([axis, score]) => {
      const potential = monteCarloResults.riskMetrics.bestCase[axis as AxisKey] - score;
      if (potential > 20) {
        recommendations.push({
          type: 'opportunity',
          priority: 'medium',
          title: `${this.getAxisName(axis as AxisKey)} 성장 잠재력 활용`,
          description: `${this.getAxisName(axis as AxisKey)}에서 최대 ${potential.toFixed(1)}점의 추가 성장이 가능합니다.`,
          suggestedActions: [
            '성공 시나리오 분석',
            '리소스 집중 투자',
            '성과 지표 모니터링 강화'
          ],
          expectedImpact: { [axis as AxisKey]: potential * 0.6 },
          timeframe: 'medium'
        });
      }
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private findMostSensitiveVariable(
    sensitivityAnalysis: Record<string, Record<AxisKey, number>>
  ): { variable: string; impact: Partial<Record<AxisKey, number>> } | null {
    let maxImpact = 0;
    let mostSensitive: string | null = null;
    let bestImpact: Partial<Record<AxisKey, number>> = {};

    Object.entries(sensitivityAnalysis).forEach(([variable, impacts]) => {
      const totalImpact = Object.values(impacts).reduce((sum, val) => sum + Math.abs(val), 0);
      if (totalImpact > maxImpact) {
        maxImpact = totalImpact;
        mostSensitive = variable;
        bestImpact = impacts;
      }
    });

    return mostSensitive ? { variable: mostSensitive, impact: bestImpact } : null;
  }

  private getAxisName(axis: AxisKey): string {
    const names: Record<AxisKey, string> = {
      GO: 'Go-to-Market',
      EC: 'Economics',
      PT: 'Product & Technology',
      PF: 'People & Process',
      TO: 'Team & Operations'
    };
    return names[axis];
  }

  // Public methods for external use
  getVariables(): ScenarioVariable[] {
    return Array.from(this.variables.values());
  }

  updateVariable(key: string, updates: Partial<ScenarioVariable>): void {
    const variable = this.variables.get(key);
    if (variable) {
      this.variables.set(key, { ...variable, ...updates });
    }
  }

  setBaselineScores(scores: Record<AxisKey, number>): void {
    this.baselineScores = { ...scores };
  }
}