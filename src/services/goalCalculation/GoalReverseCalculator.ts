/**
 * Goal Reverse Calculator
 * 목표 역산 계산 시스템 - 원하는 결과를 달성하기 위한 필요 조건 계산
 */

import type { AxisKey } from '../../pages/startup/kpi-tabs/ResultsInsightsPanelV2/types';

export interface GoalSpecification {
  targetScores: Partial<Record<AxisKey, number>>;
  targetOverall?: number;
  timeframe: number; // days
  constraints?: GoalConstraints;
  priority?: AxisPriority[];
}

export interface GoalConstraints {
  maxChangeRate?: Record<AxisKey, number>; // 일일 최대 변화율
  minScores?: Record<AxisKey, number>; // 최소 유지 점수
  dependencies?: AxisDependency[];
  resources?: ResourceConstraints;
}

export interface AxisDependency {
  source: AxisKey;
  target: AxisKey;
  relationship: 'positive' | 'negative' | 'threshold';
  strength: number; // 0-1
  threshold?: number;
}

export interface ResourceConstraints {
  budget?: number;
  time?: number; // hours
  team?: number; // people
  costPerAxis?: Record<AxisKey, number>;
}

export interface AxisPriority {
  axis: AxisKey;
  weight: number; // 0-1
  flexibility: 'fixed' | 'flexible' | 'optional';
}

export interface ReverseCalculationResult {
  requiredChanges: RequiredChange[];
  actionPlan: ActionPlan;
  feasibility: FeasibilityAnalysis;
  alternativeScenarios: AlternativeScenario[];
  resourceAllocation: ResourceAllocation;
  timeline: Timeline;
}

export interface RequiredChange {
  axis: AxisKey;
  currentScore: number;
  targetScore: number;
  requiredImprovement: number;
  dailyRate: number;
  difficulty: 'easy' | 'moderate' | 'hard' | 'very_hard';
  confidence: number;
}

export interface ActionPlan {
  phases: ActionPhase[];
  milestones: Milestone[];
  dependencies: ActionDependency[];
  criticalPath: string[];
}

export interface ActionPhase {
  id: string;
  name: string;
  startDay: number;
  endDay: number;
  axes: AxisKey[];
  actions: DetailedAction[];
  expectedImprovement: Record<AxisKey, number>;
  resources: PhaseResources;
}

export interface DetailedAction {
  id: string;
  title: string;
  description: string;
  axis: AxisKey;
  impact: number;
  effort: number;
  duration: number;
  prerequisites: string[];
  risks: Risk[];
}

export interface Risk {
  type: 'execution' | 'dependency' | 'external' | 'resource';
  description: string;
  probability: number;
  impact: number;
  mitigation: string;
}

export interface Milestone {
  id: string;
  name: string;
  day: number;
  criteria: Record<AxisKey, number>;
  importance: 'critical' | 'major' | 'minor';
}

export interface ActionDependency {
  from: string;
  to: string;
  type: 'blocks' | 'enables' | 'optional';
  lag: number; // days
}

export interface FeasibilityAnalysis {
  overallFeasibility: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  successProbability: number;
  bottlenecks: Bottleneck[];
  recommendations: string[];
}

export interface Bottleneck {
  type: 'resource' | 'time' | 'dependency' | 'capability';
  description: string;
  affectedAxes: AxisKey[];
  severity: number;
  solution: string;
}

export interface AlternativeScenario {
  id: string;
  name: string;
  description: string;
  adjustedTargets: Record<AxisKey, number>;
  timeframe: number;
  feasibility: number;
  tradeoffs: string[];
}

export interface ResourceAllocation {
  totalBudget: number;
  totalTime: number;
  totalTeam: number;
  axisAllocation: Record<AxisKey, AxisResources>;
  efficiency: number;
  optimization: OptimizationSuggestion[];
}

export interface AxisResources {
  budget: number;
  time: number;
  team: number;
  roi: number; // Return on Investment
}

export interface OptimizationSuggestion {
  type: 'reallocation' | 'sequencing' | 'bundling' | 'outsourcing';
  description: string;
  potentialSaving: number;
  impactOnTimeline: number;
}

export interface Timeline {
  totalDays: number;
  phases: TimelinePhase[];
  criticalDates: CriticalDate[];
  buffer: number;
}

export interface TimelinePhase {
  phase: string;
  startDay: number;
  endDay: number;
  axes: AxisKey[];
  parallelizable: boolean;
}

export interface CriticalDate {
  day: number;
  event: string;
  type: 'milestone' | 'checkpoint' | 'deadline';
  requirements: string[];
}

export class GoalReverseCalculator {
  private readonly axisRelationships: Record<AxisKey, Record<AxisKey, number>>;
  private readonly historicalData: Map<string, any>;

  constructor() {
    // 축 간 기본 관계 정의
    this.axisRelationships = {
      GO: { GO: 1, EC: 0.3, PT: 0.4, PF: 0.5, TO: 0.3 },
      EC: { GO: 0.3, EC: 1, PT: 0.5, PF: 0.3, TO: 0.6 },
      PT: { GO: 0.4, EC: 0.5, PT: 1, PF: 0.4, TO: 0.5 },
      PF: { GO: 0.5, EC: 0.3, PT: 0.4, PF: 1, TO: 0.4 },
      TO: { GO: 0.3, EC: 0.6, PT: 0.5, PF: 0.4, TO: 1 }
    };

    this.historicalData = new Map();
  }

  /**
   * 메인 역산 계산 함수
   */
  async calculateRequirements(
    currentScores: Record<AxisKey, number>,
    goal: GoalSpecification
  ): Promise<ReverseCalculationResult> {
    console.log('🎯 Starting goal reverse calculation...');

    // 1. 목표 검증 및 정규화
    const normalizedGoal = this.normalizeGoal(currentScores, goal);

    // 2. 필요한 변화량 계산
    const requiredChanges = this.calculateRequiredChanges(currentScores, normalizedGoal);

    // 3. 실행 계획 수립
    const actionPlan = this.generateActionPlan(requiredChanges, normalizedGoal);

    // 4. 실현 가능성 분석
    const feasibility = this.analyzeFeasibility(requiredChanges, actionPlan, normalizedGoal);

    // 5. 대안 시나리오 생성
    const alternativeScenarios = this.generateAlternatives(
      currentScores,
      normalizedGoal,
      feasibility
    );

    // 6. 자원 할당 최적화
    const resourceAllocation = this.optimizeResourceAllocation(
      actionPlan,
      normalizedGoal.constraints?.resources
    );

    // 7. 타임라인 생성
    const timeline = this.createTimeline(actionPlan, normalizedGoal.timeframe);

    console.log('✅ Goal reverse calculation completed');

    return {
      requiredChanges,
      actionPlan,
      feasibility,
      alternativeScenarios,
      resourceAllocation,
      timeline
    };
  }

  /**
   * 목표 정규화 및 검증
   */
  private normalizeGoal(
    currentScores: Record<AxisKey, number>,
    goal: GoalSpecification
  ): GoalSpecification {
    const normalized = { ...goal };
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

    // 전체 목표가 설정된 경우 개별 축 목표 계산
    if (normalized.targetOverall !== undefined && !normalized.targetScores) {
      normalized.targetScores = {};
      const currentOverall = axes.reduce((sum, axis) => sum + currentScores[axis], 0) / axes.length;
      const improvementRatio = normalized.targetOverall / currentOverall;

      for (const axis of axes) {
        normalized.targetScores[axis] = Math.min(100, currentScores[axis] * improvementRatio);
      }
    }

    // 목표 점수 범위 제한 (0-100)
    if (normalized.targetScores) {
      for (const axis of Object.keys(normalized.targetScores) as AxisKey[]) {
        normalized.targetScores[axis] = Math.max(0, Math.min(100, normalized.targetScores[axis]!));
      }
    }

    // 기본 우선순위 설정
    if (!normalized.priority) {
      normalized.priority = axes.map(axis => ({
        axis,
        weight: 0.2,
        flexibility: 'flexible' as const
      }));
    }

    return normalized;
  }

  /**
   * 필요한 변화량 계산
   */
  private calculateRequiredChanges(
    currentScores: Record<AxisKey, number>,
    goal: GoalSpecification
  ): RequiredChange[] {
    const changes: RequiredChange[] = [];
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

    for (const axis of axes) {
      const targetScore = goal.targetScores?.[axis];
      if (targetScore === undefined) continue;

      const currentScore = currentScores[axis];
      const requiredImprovement = targetScore - currentScore;
      const dailyRate = requiredImprovement / goal.timeframe;

      // 난이도 평가
      const difficulty = this.assessDifficulty(requiredImprovement, dailyRate, axis);

      // 신뢰도 계산
      const confidence = this.calculateConfidence(
        requiredImprovement,
        goal.timeframe,
        difficulty,
        axis
      );

      changes.push({
        axis,
        currentScore,
        targetScore,
        requiredImprovement,
        dailyRate,
        difficulty,
        confidence
      });
    }

    return changes;
  }

  /**
   * 난이도 평가
   */
  private assessDifficulty(
    improvement: number,
    dailyRate: number,
    axis: AxisKey
  ): 'easy' | 'moderate' | 'hard' | 'very_hard' {
    const absoluteImprovement = Math.abs(improvement);
    const absoluteRate = Math.abs(dailyRate);

    // 기본 난이도 매트릭스
    if (absoluteImprovement <= 10) {
      if (absoluteRate <= 0.5) return 'easy';
      if (absoluteRate <= 1) return 'moderate';
      return 'hard';
    } else if (absoluteImprovement <= 25) {
      if (absoluteRate <= 0.5) return 'moderate';
      if (absoluteRate <= 1) return 'hard';
      return 'very_hard';
    } else {
      if (absoluteRate <= 1) return 'hard';
      return 'very_hard';
    }
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(
    improvement: number,
    timeframe: number,
    difficulty: string,
    axis: AxisKey
  ): number {
    let confidence = 0.9;

    // 개선량이 클수록 신뢰도 감소
    confidence -= Math.abs(improvement) * 0.005;

    // 짧은 기간일수록 신뢰도 감소
    if (timeframe < 30) {
      confidence -= (30 - timeframe) * 0.01;
    }

    // 난이도에 따른 조정
    const difficultyPenalty = {
      easy: 0,
      moderate: 0.1,
      hard: 0.2,
      very_hard: 0.35
    };
    confidence -= difficultyPenalty[difficulty as keyof typeof difficultyPenalty];

    return Math.max(0.3, Math.min(0.95, confidence));
  }

  /**
   * 실행 계획 수립
   */
  private generateActionPlan(
    requiredChanges: RequiredChange[],
    goal: GoalSpecification
  ): ActionPlan {
    // 1. 단계별 계획 생성
    const phases = this.createPhases(requiredChanges, goal);

    // 2. 마일스톤 설정
    const milestones = this.createMilestones(phases, goal);

    // 3. 종속성 분석
    const dependencies = this.analyzeDependencies(phases, goal.constraints?.dependencies);

    // 4. 임계 경로 계산
    const criticalPath = this.calculateCriticalPath(phases, dependencies);

    return {
      phases,
      milestones,
      dependencies,
      criticalPath
    };
  }

  /**
   * 단계별 계획 생성
   */
  private createPhases(
    requiredChanges: RequiredChange[],
    goal: GoalSpecification
  ): ActionPhase[] {
    const phases: ActionPhase[] = [];
    const totalDays = goal.timeframe;

    // 난이도별로 그룹화
    const easyChanges = requiredChanges.filter(c => c.difficulty === 'easy');
    const moderateChanges = requiredChanges.filter(c => c.difficulty === 'moderate');
    const hardChanges = requiredChanges.filter(c => c.difficulty === 'hard' || c.difficulty === 'very_hard');

    // Phase 1: Quick Wins (쉬운 개선)
    if (easyChanges.length > 0) {
      phases.push(this.createPhase(
        'quick-wins',
        'Quick Wins - 빠른 성과',
        0,
        Math.floor(totalDays * 0.2),
        easyChanges
      ));
    }

    // Phase 2: Core Improvements (중간 난이도)
    if (moderateChanges.length > 0) {
      const startDay = phases.length > 0 ? phases[phases.length - 1].endDay : 0;
      phases.push(this.createPhase(
        'core-improvements',
        'Core Improvements - 핵심 개선',
        startDay,
        startDay + Math.floor(totalDays * 0.4),
        moderateChanges
      ));
    }

    // Phase 3: Strategic Transformations (어려운 개선)
    if (hardChanges.length > 0) {
      const startDay = phases.length > 0 ? phases[phases.length - 1].endDay : 0;
      phases.push(this.createPhase(
        'strategic-transformations',
        'Strategic Transformations - 전략적 변혁',
        startDay,
        totalDays,
        hardChanges
      ));
    }

    return phases;
  }

  /**
   * 개별 단계 생성
   */
  private createPhase(
    id: string,
    name: string,
    startDay: number,
    endDay: number,
    changes: RequiredChange[]
  ): ActionPhase {
    const axes = changes.map(c => c.axis);
    const actions = this.generateDetailedActions(changes);
    const expectedImprovement: Record<AxisKey, number> = {} as Record<AxisKey, number>;

    for (const change of changes) {
      const phaseRatio = (endDay - startDay) / 30; // 30일 기준 비율
      expectedImprovement[change.axis] = change.requiredImprovement * phaseRatio;
    }

    const resources = this.estimatePhaseResources(changes, endDay - startDay);

    return {
      id,
      name,
      startDay,
      endDay,
      axes,
      actions,
      expectedImprovement,
      resources
    };
  }

  /**
   * 상세 액션 생성
   */
  private generateDetailedActions(changes: RequiredChange[]): DetailedAction[] {
    const actions: DetailedAction[] = [];

    for (const change of changes) {
      const axisActions = this.getAxisSpecificActions(change);
      actions.push(...axisActions);
    }

    return actions;
  }

  /**
   * 축별 특화 액션
   */
  private getAxisSpecificActions(change: RequiredChange): DetailedAction[] {
    const actions: DetailedAction[] = [];
    const baseActions = this.getBaseActionsForAxis(change.axis);

    for (const baseAction of baseActions) {
      const scaledAction = this.scaleAction(baseAction, change.requiredImprovement);
      actions.push(scaledAction);
    }

    return actions;
  }

  /**
   * 축별 기본 액션 템플릿
   */
  private getBaseActionsForAxis(axis: AxisKey): DetailedAction[] {
    const actionTemplates: Record<AxisKey, DetailedAction[]> = {
      GO: [
        {
          id: 'go-1',
          title: '비전 및 목표 명확화',
          description: '명확하고 측정 가능한 목표 설정',
          axis: 'GO',
          impact: 15,
          effort: 20,
          duration: 7,
          prerequisites: [],
          risks: []
        },
        {
          id: 'go-2',
          title: '전략 로드맵 수립',
          description: '단계별 실행 계획 수립',
          axis: 'GO',
          impact: 20,
          effort: 30,
          duration: 14,
          prerequisites: ['go-1'],
          risks: []
        }
      ],
      EC: [
        {
          id: 'ec-1',
          title: '수익 모델 최적화',
          description: '가격 전략 및 수익원 다각화',
          axis: 'EC',
          impact: 25,
          effort: 40,
          duration: 21,
          prerequisites: [],
          risks: []
        },
        {
          id: 'ec-2',
          title: '비용 구조 개선',
          description: '운영 효율화 및 비용 절감',
          axis: 'EC',
          impact: 15,
          effort: 25,
          duration: 14,
          prerequisites: [],
          risks: []
        }
      ],
      PT: [
        {
          id: 'pt-1',
          title: 'MVP 개발',
          description: '핵심 기능 구현 및 검증',
          axis: 'PT',
          impact: 30,
          effort: 50,
          duration: 30,
          prerequisites: [],
          risks: []
        },
        {
          id: 'pt-2',
          title: '기술 스택 최적화',
          description: '개발 효율성 향상',
          axis: 'PT',
          impact: 15,
          effort: 20,
          duration: 10,
          prerequisites: [],
          risks: []
        }
      ],
      PF: [
        {
          id: 'pf-1',
          title: '미래 트렌드 분석',
          description: '시장 동향 및 기술 트렌드 연구',
          axis: 'PF',
          impact: 20,
          effort: 15,
          duration: 7,
          prerequisites: [],
          risks: []
        },
        {
          id: 'pf-2',
          title: '확장성 설계',
          description: '성장 가능한 아키텍처 구축',
          axis: 'PF',
          impact: 25,
          effort: 35,
          duration: 21,
          prerequisites: ['pf-1'],
          risks: []
        }
      ],
      TO: [
        {
          id: 'to-1',
          title: '시장 조사',
          description: '타겟 시장 분석 및 검증',
          axis: 'TO',
          impact: 20,
          effort: 25,
          duration: 14,
          prerequisites: [],
          risks: []
        },
        {
          id: 'to-2',
          title: '고객 피드백 수집',
          description: '사용자 인터뷰 및 설문',
          axis: 'TO',
          impact: 15,
          effort: 20,
          duration: 10,
          prerequisites: [],
          risks: []
        }
      ]
    };

    return actionTemplates[axis] || [];
  }

  /**
   * 액션 스케일링
   */
  private scaleAction(action: DetailedAction, requiredImprovement: number): DetailedAction {
    const scaleFactor = Math.abs(requiredImprovement) / 20; // 20점 기준

    return {
      ...action,
      impact: action.impact * scaleFactor,
      effort: action.effort * scaleFactor,
      duration: Math.ceil(action.duration * Math.sqrt(scaleFactor)),
      risks: this.generateRisks(action, scaleFactor)
    };
  }

  /**
   * 리스크 생성
   */
  private generateRisks(action: DetailedAction, scaleFactor: number): Risk[] {
    const risks: Risk[] = [];

    if (scaleFactor > 1.5) {
      risks.push({
        type: 'execution',
        description: '높은 목표로 인한 실행 리스크',
        probability: 0.3 * scaleFactor,
        impact: 0.5,
        mitigation: '단계별 체크포인트 설정 및 조기 검증'
      });
    }

    if (action.duration > 20) {
      risks.push({
        type: 'dependency',
        description: '장기 프로젝트로 인한 종속성 리스크',
        probability: 0.4,
        impact: 0.6,
        mitigation: '병렬 처리 가능한 작업 분리'
      });
    }

    return risks;
  }

  /**
   * 단계별 리소스 추정
   */
  private estimatePhaseResources(changes: RequiredChange[], duration: number): PhaseResources {
    let budget = 0;
    let time = 0;
    let team = 0;

    for (const change of changes) {
      const improvement = Math.abs(change.requiredImprovement);

      // 기본 리소스 계산
      budget += improvement * 1000; // 1점당 1000원
      time += improvement * 2; // 1점당 2시간
      team += Math.ceil(improvement / 20); // 20점당 1명
    }

    // 기간에 따른 조정
    const durationFactor = duration / 30;
    budget *= durationFactor;
    time *= durationFactor;

    return { budget, time, team };
  }

  /**
   * 마일스톤 생성
   */
  private createMilestones(phases: ActionPhase[], goal: GoalSpecification): Milestone[] {
    const milestones: Milestone[] = [];

    // 각 단계 종료 시점 마일스톤
    for (const phase of phases) {
      const criteria: Record<AxisKey, number> = {} as Record<AxisKey, number>;

      for (const axis of phase.axes) {
        const targetScore = goal.targetScores?.[axis];
        if (targetScore !== undefined) {
          const phaseRatio = phase.endDay / goal.timeframe;
          criteria[axis] = targetScore * phaseRatio;
        }
      }

      milestones.push({
        id: `milestone-${phase.id}`,
        name: `${phase.name} 완료`,
        day: phase.endDay,
        criteria,
        importance: this.determineMilestoneImportance(phase)
      });
    }

    return milestones;
  }

  /**
   * 마일스톤 중요도 결정
   */
  private determineMilestoneImportance(phase: ActionPhase): 'critical' | 'major' | 'minor' {
    const totalImprovement = Object.values(phase.expectedImprovement).reduce((sum, val) => sum + Math.abs(val), 0);

    if (totalImprovement > 30) return 'critical';
    if (totalImprovement > 15) return 'major';
    return 'minor';
  }

  /**
   * 종속성 분석
   */
  private analyzeDependencies(
    phases: ActionPhase[],
    axisDependencies?: AxisDependency[]
  ): ActionDependency[] {
    const dependencies: ActionDependency[] = [];

    // 단계 간 종속성
    for (let i = 0; i < phases.length - 1; i++) {
      dependencies.push({
        from: phases[i].id,
        to: phases[i + 1].id,
        type: 'enables',
        lag: 0
      });
    }

    // 액션 간 종속성
    for (const phase of phases) {
      for (const action of phase.actions) {
        for (const prereq of action.prerequisites) {
          dependencies.push({
            from: prereq,
            to: action.id,
            type: 'blocks',
            lag: 0
          });
        }
      }
    }

    return dependencies;
  }

  /**
   * 임계 경로 계산
   */
  private calculateCriticalPath(
    phases: ActionPhase[],
    dependencies: ActionDependency[]
  ): string[] {
    // CPM (Critical Path Method) 간소화 구현
    const path: string[] = [];

    // 가장 긴 종속성 체인 찾기
    for (const phase of phases) {
      path.push(phase.id);

      // 가장 영향력 있는 액션 선택
      const criticalAction = phase.actions.reduce((max, action) =>
        action.impact > max.impact ? action : max
      );

      if (criticalAction) {
        path.push(criticalAction.id);
      }
    }

    return path;
  }

  /**
   * 실현 가능성 분석
   */
  private analyzeFeasibility(
    requiredChanges: RequiredChange[],
    actionPlan: ActionPlan,
    goal: GoalSpecification
  ): FeasibilityAnalysis {
    // 전체 실현 가능성 계산
    const overallFeasibility = this.calculateOverallFeasibility(requiredChanges, goal);

    // 리스크 레벨 평가
    const riskLevel = this.assessRiskLevel(requiredChanges, actionPlan);

    // 성공 확률 계산
    const successProbability = this.calculateSuccessProbability(
      requiredChanges,
      overallFeasibility,
      riskLevel
    );

    // 병목 지점 식별
    const bottlenecks = this.identifyBottlenecks(requiredChanges, actionPlan, goal);

    // 추천 사항 생성
    const recommendations = this.generateRecommendations(
      overallFeasibility,
      bottlenecks,
      riskLevel
    );

    return {
      overallFeasibility,
      riskLevel,
      successProbability,
      bottlenecks,
      recommendations
    };
  }

  /**
   * 전체 실현 가능성 계산
   */
  private calculateOverallFeasibility(
    requiredChanges: RequiredChange[],
    goal: GoalSpecification
  ): number {
    let feasibility = 1.0;

    for (const change of requiredChanges) {
      // 난이도에 따른 페널티
      const difficultyPenalty = {
        easy: 0,
        moderate: 0.1,
        hard: 0.2,
        very_hard: 0.4
      };
      feasibility -= difficultyPenalty[change.difficulty];

      // 일일 변화율이 높을수록 실현 가능성 감소
      if (Math.abs(change.dailyRate) > 2) {
        feasibility -= 0.15;
      } else if (Math.abs(change.dailyRate) > 1) {
        feasibility -= 0.08;
      }
    }

    // 시간 제약
    if (goal.timeframe < 30) {
      feasibility -= 0.2;
    } else if (goal.timeframe < 60) {
      feasibility -= 0.1;
    }

    return Math.max(0.1, Math.min(1, feasibility));
  }

  /**
   * 리스크 레벨 평가
   */
  private assessRiskLevel(
    requiredChanges: RequiredChange[],
    actionPlan: ActionPlan
  ): 'low' | 'medium' | 'high' | 'very_high' {
    let riskScore = 0;

    // 어려운 변화가 많을수록 리스크 증가
    const hardChanges = requiredChanges.filter(c =>
      c.difficulty === 'hard' || c.difficulty === 'very_hard'
    ).length;
    riskScore += hardChanges * 2;

    // 종속성이 많을수록 리스크 증가
    riskScore += actionPlan.dependencies.length * 0.5;

    // 임계 경로가 길수록 리스크 증가
    riskScore += actionPlan.criticalPath.length * 0.3;

    if (riskScore < 3) return 'low';
    if (riskScore < 6) return 'medium';
    if (riskScore < 10) return 'high';
    return 'very_high';
  }

  /**
   * 성공 확률 계산
   */
  private calculateSuccessProbability(
    requiredChanges: RequiredChange[],
    feasibility: number,
    riskLevel: string
  ): number {
    // 기본 성공률 = 실현 가능성
    let probability = feasibility;

    // 각 축의 신뢰도 고려
    const avgConfidence = requiredChanges.reduce((sum, c) => sum + c.confidence, 0) / requiredChanges.length;
    probability *= avgConfidence;

    // 리스크 레벨에 따른 조정
    const riskPenalty = {
      low: 0,
      medium: 0.1,
      high: 0.2,
      very_high: 0.35
    };
    probability -= riskPenalty[riskLevel as keyof typeof riskPenalty];

    return Math.max(0.1, Math.min(0.95, probability));
  }

  /**
   * 병목 지점 식별
   */
  private identifyBottlenecks(
    requiredChanges: RequiredChange[],
    actionPlan: ActionPlan,
    goal: GoalSpecification
  ): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];

    // 1. 시간 병목
    const timeIntensiveChanges = requiredChanges.filter(c => Math.abs(c.dailyRate) > 1.5);
    if (timeIntensiveChanges.length > 0) {
      bottlenecks.push({
        type: 'time',
        description: '일일 개선 속도가 매우 높아 실행 부담',
        affectedAxes: timeIntensiveChanges.map(c => c.axis),
        severity: 0.8,
        solution: '기간 연장 또는 목표 하향 조정 검토'
      });
    }

    // 2. 자원 병목
    if (goal.constraints?.resources) {
      const totalBudgetNeeded = actionPlan.phases.reduce(
        (sum, phase) => sum + phase.resources.budget,
        0
      );
      if (totalBudgetNeeded > (goal.constraints.resources.budget || Infinity)) {
        bottlenecks.push({
          type: 'resource',
          description: '예산 제약 초과',
          affectedAxes: ['GO', 'EC', 'PT', 'PF', 'TO'],
          severity: 0.9,
          solution: '우선순위 재조정 또는 추가 자원 확보'
        });
      }
    }

    // 3. 종속성 병목
    const criticalDependencies = actionPlan.dependencies.filter(d => d.type === 'blocks');
    if (criticalDependencies.length > 5) {
      bottlenecks.push({
        type: 'dependency',
        description: '복잡한 종속 관계로 인한 실행 제약',
        affectedAxes: ['GO', 'EC', 'PT', 'PF', 'TO'],
        severity: 0.6,
        solution: '병렬 처리 가능한 작업 분리 및 독립적 실행'
      });
    }

    return bottlenecks;
  }

  /**
   * 추천 사항 생성
   */
  private generateRecommendations(
    feasibility: number,
    bottlenecks: Bottleneck[],
    riskLevel: string
  ): string[] {
    const recommendations: string[] = [];

    if (feasibility < 0.5) {
      recommendations.push('목표를 단계적으로 나누어 점진적 접근 권장');
      recommendations.push('가장 영향력 있는 2-3개 축에 먼저 집중');
    }

    if (riskLevel === 'high' || riskLevel === 'very_high') {
      recommendations.push('주간 체크포인트 설정으로 조기 문제 감지');
      recommendations.push('각 단계마다 대안 시나리오 준비');
    }

    for (const bottleneck of bottlenecks) {
      recommendations.push(bottleneck.solution);
    }

    if (feasibility > 0.7 && riskLevel === 'low') {
      recommendations.push('빠른 실행으로 모멘텀 유지');
      recommendations.push('성공 사례를 문서화하여 재현 가능성 확보');
    }

    return recommendations;
  }

  /**
   * 대안 시나리오 생성
   */
  private generateAlternatives(
    currentScores: Record<AxisKey, number>,
    goal: GoalSpecification,
    feasibility: FeasibilityAnalysis
  ): AlternativeScenario[] {
    const scenarios: AlternativeScenario[] = [];

    // 시나리오 1: 보수적 접근 (70% 목표)
    scenarios.push(this.createConservativeScenario(currentScores, goal));

    // 시나리오 2: 단계적 접근 (기간 연장)
    scenarios.push(this.createExtendedScenario(currentScores, goal));

    // 시나리오 3: 집중 접근 (핵심 축만)
    scenarios.push(this.createFocusedScenario(currentScores, goal));

    // 시나리오 4: 균형 접근 (모든 축 균등)
    scenarios.push(this.createBalancedScenario(currentScores, goal));

    return scenarios;
  }

  /**
   * 보수적 시나리오
   */
  private createConservativeScenario(
    currentScores: Record<AxisKey, number>,
    goal: GoalSpecification
  ): AlternativeScenario {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const adjustedTargets: Record<AxisKey, number> = {} as Record<AxisKey, number>;

    for (const axis of axes) {
      const target = goal.targetScores?.[axis];
      if (target !== undefined) {
        const improvement = (target - currentScores[axis]) * 0.7; // 70% 목표
        adjustedTargets[axis] = currentScores[axis] + improvement;
      }
    }

    return {
      id: 'conservative',
      name: '보수적 접근',
      description: '원래 목표의 70%를 달성하는 안정적인 시나리오',
      adjustedTargets,
      timeframe: goal.timeframe,
      feasibility: 0.85,
      tradeoffs: ['낮은 리스크', '안정적 실행', '목표 하향 조정']
    };
  }

  /**
   * 기간 연장 시나리오
   */
  private createExtendedScenario(
    currentScores: Record<AxisKey, number>,
    goal: GoalSpecification
  ): AlternativeScenario {
    const extendedTimeframe = goal.timeframe * 1.5;

    return {
      id: 'extended',
      name: '단계적 접근',
      description: '기간을 50% 연장하여 목표 달성',
      adjustedTargets: goal.targetScores || {},
      timeframe: extendedTimeframe,
      feasibility: 0.9,
      tradeoffs: ['충분한 실행 시간', '낮은 일일 부담', '장기 프로젝트']
    };
  }

  /**
   * 집중 시나리오
   */
  private createFocusedScenario(
    currentScores: Record<AxisKey, number>,
    goal: GoalSpecification
  ): AlternativeScenario {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const adjustedTargets: Record<AxisKey, number> = {} as Record<AxisKey, number>;

    // 가장 중요한 3개 축만 개선
    const priorityAxes = goal.priority
      ?.sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map(p => p.axis) || axes.slice(0, 3);

    for (const axis of axes) {
      if (priorityAxes.includes(axis)) {
        adjustedTargets[axis] = goal.targetScores?.[axis] || currentScores[axis];
      } else {
        adjustedTargets[axis] = currentScores[axis] + 5; // 최소 개선
      }
    }

    return {
      id: 'focused',
      name: '집중 접근',
      description: '핵심 3개 축에 집중하여 효율적 개선',
      adjustedTargets,
      timeframe: goal.timeframe,
      feasibility: 0.8,
      tradeoffs: ['자원 집중', '빠른 성과', '일부 축 희생']
    };
  }

  /**
   * 균형 시나리오
   */
  private createBalancedScenario(
    currentScores: Record<AxisKey, number>,
    goal: GoalSpecification
  ): AlternativeScenario {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const adjustedTargets: Record<AxisKey, number> = {} as Record<AxisKey, number>;

    // 모든 축을 평균 목표로 조정
    const currentAvg = axes.reduce((sum, axis) => sum + currentScores[axis], 0) / axes.length;
    const targetAvg = goal.targetOverall || 80;
    const improvementPerAxis = (targetAvg - currentAvg);

    for (const axis of axes) {
      adjustedTargets[axis] = currentScores[axis] + improvementPerAxis;
    }

    return {
      id: 'balanced',
      name: '균형 접근',
      description: '모든 축을 균등하게 개선',
      adjustedTargets,
      timeframe: goal.timeframe,
      feasibility: 0.75,
      tradeoffs: ['균형 성장', '시너지 효과', '복잡한 실행']
    };
  }

  /**
   * 자원 할당 최적화
   */
  private optimizeResourceAllocation(
    actionPlan: ActionPlan,
    constraints?: ResourceConstraints
  ): ResourceAllocation {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const axisAllocation: Record<AxisKey, AxisResources> = {} as Record<AxisKey, AxisResources>;

    // 기본 할당
    let totalBudget = 0;
    let totalTime = 0;
    let totalTeam = 0;

    for (const phase of actionPlan.phases) {
      totalBudget += phase.resources.budget;
      totalTime += phase.resources.time;
      totalTeam = Math.max(totalTeam, phase.resources.team);

      for (const axis of phase.axes) {
        if (!axisAllocation[axis]) {
          axisAllocation[axis] = { budget: 0, time: 0, team: 0, roi: 0 };
        }

        const axisRatio = 1 / phase.axes.length;
        axisAllocation[axis].budget += phase.resources.budget * axisRatio;
        axisAllocation[axis].time += phase.resources.time * axisRatio;
        axisAllocation[axis].team = Math.max(
          axisAllocation[axis].team,
          Math.ceil(phase.resources.team * axisRatio)
        );
      }
    }

    // ROI 계산
    for (const axis of axes) {
      if (axisAllocation[axis]) {
        const expectedImprovement = actionPlan.phases.reduce(
          (sum, phase) => sum + (phase.expectedImprovement[axis] || 0),
          0
        );
        axisAllocation[axis].roi = expectedImprovement / (axisAllocation[axis].budget || 1);
      }
    }

    // 효율성 계산
    const efficiency = this.calculateEfficiency(axisAllocation, constraints);

    // 최적화 제안
    const optimization = this.generateOptimizationSuggestions(
      axisAllocation,
      actionPlan,
      constraints
    );

    return {
      totalBudget,
      totalTime,
      totalTeam,
      axisAllocation,
      efficiency,
      optimization
    };
  }

  /**
   * 효율성 계산
   */
  private calculateEfficiency(
    allocation: Record<AxisKey, AxisResources>,
    constraints?: ResourceConstraints
  ): number {
    let efficiency = 1.0;

    // 예산 제약 확인
    if (constraints?.budget) {
      const totalBudget = Object.values(allocation).reduce((sum, a) => sum + a.budget, 0);
      if (totalBudget > constraints.budget) {
        efficiency -= (totalBudget - constraints.budget) / constraints.budget;
      }
    }

    // ROI 기반 효율성
    const rois = Object.values(allocation).map(a => a.roi);
    const avgROI = rois.reduce((sum, roi) => sum + roi, 0) / rois.length;
    efficiency *= Math.min(1, avgROI);

    return Math.max(0, Math.min(1, efficiency));
  }

  /**
   * 최적화 제안 생성
   */
  private generateOptimizationSuggestions(
    allocation: Record<AxisKey, AxisResources>,
    actionPlan: ActionPlan,
    constraints?: ResourceConstraints
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // 높은 ROI 축에 재할당
    const sortedAxes = Object.entries(allocation)
      .sort((a, b) => b[1].roi - a[1].roi);

    if (sortedAxes[0][1].roi > sortedAxes[sortedAxes.length - 1][1].roi * 2) {
      suggestions.push({
        type: 'reallocation',
        description: `${sortedAxes[0][0]}축에 자원 집중하여 효율성 향상`,
        potentialSaving: sortedAxes[0][1].budget * 0.2,
        impactOnTimeline: -5
      });
    }

    // 병렬 처리 가능한 작업
    const parallelizablePhases = actionPlan.phases.filter(phase =>
      phase.axes.length > 1
    );
    if (parallelizablePhases.length > 0) {
      suggestions.push({
        type: 'sequencing',
        description: '병렬 처리로 시간 단축',
        potentialSaving: 0,
        impactOnTimeline: -10
      });
    }

    return suggestions;
  }

  /**
   * 타임라인 생성
   */
  private createTimeline(actionPlan: ActionPlan, totalDays: number): Timeline {
    const phases: TimelinePhase[] = actionPlan.phases.map(phase => ({
      phase: phase.name,
      startDay: phase.startDay,
      endDay: phase.endDay,
      axes: phase.axes,
      parallelizable: phase.axes.length > 1
    }));

    const criticalDates: CriticalDate[] = actionPlan.milestones.map(milestone => ({
      day: milestone.day,
      event: milestone.name,
      type: 'milestone',
      requirements: Object.entries(milestone.criteria).map(
        ([axis, score]) => `${axis}: ${score}점 달성`
      )
    }));

    // 버퍼 시간 계산
    const buffer = Math.max(7, Math.floor(totalDays * 0.1));

    return {
      totalDays,
      phases,
      criticalDates,
      buffer
    };
  }
}

// 유틸리티 타입
interface PhaseResources {
  budget: number;
  time: number;
  team: number;
}

// 싱글톤 인스턴스
let calculator: GoalReverseCalculator | null = null;

export const getGoalReverseCalculator = (): GoalReverseCalculator => {
  if (!calculator) {
    calculator = new GoalReverseCalculator();
  }
  return calculator;
};