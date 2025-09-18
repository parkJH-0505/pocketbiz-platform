/**
 * Smart Action Generator
 *
 * 실제 KPI 데이터 기반으로 개인화된 액션을 생성하는 고급 알고리즘
 * - 데이터 기반 의사결정
 * - 사용자 패턴 학습
 * - 성취 가능성 최적화
 */

import type { AxisKey } from '../../types';
import type { TodaysAction } from '../../types/dashboard';

// ============================================================================
// Core Types
// ============================================================================

interface KPIAnalysisData {
  axisScores: Record<AxisKey, number>;
  responses: Record<string, any>;
  progress: {
    completed: number;
    total: number;
    percentage: number;
    byAxis: Record<AxisKey, { completed: number; total: number }>;
  };
  previousScores: Record<AxisKey, number>;
}

interface UserContext {
  lastActionDate?: Date;
  completedActions: CompletedAction[];
  preferredDifficulty: 'easy' | 'medium' | 'hard';
  averageSessionTime: number; // 분
  successRate: number; // 0-1
}

interface CompletedAction {
  id: string;
  type: 'kpi' | 'opportunity' | 'buildup';
  completedAt: Date;
  timeSpent: number; // 분
  success: boolean;
  axisImpact?: AxisKey;
}

interface ActionScore {
  action: TodaysAction;
  score: number;
  reasoning: string[];
}

// ============================================================================
// Axis Configuration
// ============================================================================

const AXIS_CONFIG = {
  GO: {
    name: '성장·운영',
    fullName: 'Growth & Operations',
    description: '시장 진출과 운영 효율성',
    color: '#10b981', // emerald-500
    icon: '🚀'
  },
  EC: {
    name: '경제성·자본',
    fullName: 'Economics & Capital',
    description: '재무 건전성과 투자 유치',
    color: '#3b82f6', // blue-500
    icon: '💰'
  },
  PT: {
    name: '제품·기술력',
    fullName: 'Product & Technology',
    description: '제품 경쟁력과 기술 우위',
    color: '#8b5cf6', // violet-500
    icon: '⚙️'
  },
  PF: {
    name: '증빙·딜레디',
    fullName: 'Proof & Deal Readiness',
    description: '실증과 거래 준비도',
    color: '#f59e0b', // amber-500
    icon: '📊'
  },
  TO: {
    name: '팀·조직 역량',
    fullName: 'Team & Organization',
    description: '팀 구성과 조직 역량',
    color: '#ef4444', // red-500
    icon: '👥'
  }
} as const;

// ============================================================================
// Action Templates
// ============================================================================

const ACTION_TEMPLATES = {
  kpi_completion: {
    title: (axis: AxisKey, count: number) =>
      `${AXIS_CONFIG[axis].name} 영역 완성하기`,
    description: (axis: AxisKey, count: number) =>
      `${count}개 항목 입력으로 ${AXIS_CONFIG[axis].description} 점수 향상`,
    motivation: (expectedGain: number) =>
      `완료시 +${expectedGain}점 예상 상승`,
    url: (axis: AxisKey) =>
      `/startup/kpi?focus=${axis}`,
    estimatedTime: (count: number) =>
      Math.min(count * 2, 15) // 최대 15분
  },
  kpi_improvement: {
    title: (axis: AxisKey) =>
      `${AXIS_CONFIG[axis].name} 영역 개선하기`,
    description: (axis: AxisKey) =>
      `낮은 점수 항목들을 다시 검토하여 정확도 향상`,
    motivation: (expectedGain: number) =>
      `개선시 +${expectedGain}점 추가 상승 가능`,
    url: (axis: AxisKey) =>
      `/startup/kpi?focus=${axis}&mode=improve`,
    estimatedTime: () => 12
  },
  exploration: {
    title: () =>
      '새로운 성장 기회 탐색하기',
    description: () =>
      '스마트 매칭에서 맞춤 기회를 확인하거나 성장 계획을 수립하세요',
    motivation: () =>
      '새로운 발견이 다음 도약의 기회가 될 수 있어요',
    url: () =>
      '/startup/smart-matching',
    estimatedTime: () => 20
  }
} as const;

// ============================================================================
// Core Algorithm
// ============================================================================

/**
 * 메인 액션 생성 함수
 * 고급 알고리즘으로 최적의 액션을 결정
 */
export function generateTodaysAction(
  kpiData: KPIAnalysisData,
  userContext: UserContext = getDefaultUserContext()
): TodaysAction {

  // 1. 가능한 모든 액션 생성
  const candidateActions = generateCandidateActions(kpiData, userContext);

  // 2. 각 액션에 대해 정교한 점수 계산
  const scoredActions = candidateActions.map(action =>
    scoreAction(action, kpiData, userContext)
  );

  // 3. 최고 점수 액션 선택
  const bestAction = scoredActions.reduce((best, current) =>
    current.score > best.score ? current : best
  );

  // 4. 개인화 적용
  return personalizeAction(bestAction.action, userContext);
}

/**
 * 후보 액션들 생성
 */
function generateCandidateActions(
  kpiData: KPIAnalysisData,
  userContext: UserContext
): TodaysAction[] {
  const actions: TodaysAction[] = [];

  // KPI 완성 액션들
  Object.entries(kpiData.progress.byAxis).forEach(([axisKey, progress]) => {
    const axis = axisKey as AxisKey;
    const incompleteCount = progress.total - progress.completed;

    if (incompleteCount > 0) {
      actions.push(createKPICompletionAction(axis, incompleteCount, kpiData));
    }
  });

  // KPI 개선 액션들 (점수가 낮은 축 대상)
  Object.entries(kpiData.axisScores).forEach(([axisKey, score]) => {
    const axis = axisKey as AxisKey;

    if (score < 50) { // 낮은 점수 기준
      actions.push(createKPIImprovementAction(axis, kpiData));
    }
  });

  // 탐색 액션 (KPI가 어느 정도 완성된 경우)
  if (kpiData.progress.percentage > 70) {
    actions.push(createExplorationAction());
  }

  return actions;
}

/**
 * 액션 점수 계산 (고급 알고리즘)
 */
function scoreAction(
  action: TodaysAction,
  kpiData: KPIAnalysisData,
  userContext: UserContext
): ActionScore {
  let score = 0;
  const reasoning: string[] = [];

  // 1. 임팩트 점수 (40%)
  const impactScore = calculateImpactScore(action, kpiData);
  score += impactScore * 0.4;
  reasoning.push(`임팩트: ${impactScore.toFixed(1)}점`);

  // 2. 실행 가능성 점수 (30%)
  const feasibilityScore = calculateFeasibilityScore(action, userContext);
  score += feasibilityScore * 0.3;
  reasoning.push(`실행가능성: ${feasibilityScore.toFixed(1)}점`);

  // 3. 사용자 선호도 점수 (20%)
  const preferenceScore = calculatePreferenceScore(action, userContext);
  score += preferenceScore * 0.2;
  reasoning.push(`선호도: ${preferenceScore.toFixed(1)}점`);

  // 4. 시급성 점수 (10%)
  const urgencyScore = calculateUrgencyScore(action, kpiData);
  score += urgencyScore * 0.1;
  reasoning.push(`시급성: ${urgencyScore.toFixed(1)}점`);

  return { action, score, reasoning };
}

/**
 * 임팩트 점수 계산
 * 해당 액션이 전체 성장에 미치는 영향도
 */
function calculateImpactScore(action: TodaysAction, kpiData: KPIAnalysisData): number {
  let score = 0;

  // 기대 점수 상승량
  const expectedPoints = action.impact.expectedPoints;
  score += Math.min(expectedPoints / 20 * 100, 100); // 최대 100점

  // 낮은 축에 대한 가중치 (약한 고리 강화)
  if (action.metadata?.kpiAxis) {
    const axisScore = kpiData.axisScores[action.metadata.kpiAxis];
    const axisWeight = (100 - axisScore) / 100; // 낮을수록 높은 가중치
    score *= (1 + axisWeight);
  }

  // 전체 진행률에 따른 조정
  const progressBonus = kpiData.progress.percentage < 50 ? 1.2 : 1.0;
  score *= progressBonus;

  return Math.min(score, 100);
}

/**
 * 실행 가능성 점수 계산
 * 사용자가 실제로 완료할 수 있는 확률
 */
function calculateFeasibilityScore(action: TodaysAction, userContext: UserContext): number {
  let score = 70; // 기본 점수

  // 난이도 vs 사용자 선호도 매치
  const difficultyMatch = getDifficultyMatch(action.impact.difficulty, userContext.preferredDifficulty);
  score += difficultyMatch;

  // 예상 시간 vs 사용자 평균 세션 시간
  const timeRatio = action.impact.timeToComplete / userContext.averageSessionTime;
  if (timeRatio <= 0.8) {
    score += 20; // 충분한 시간
  } else if (timeRatio <= 1.2) {
    score += 10; // 적당한 시간
  } else {
    score -= 10; // 시간 부족
  }

  // 사용자 성공률 반영
  score *= userContext.successRate;

  return Math.min(Math.max(score, 0), 100);
}

/**
 * 사용자 선호도 점수 계산
 */
function calculatePreferenceScore(action: TodaysAction, userContext: UserContext): number {
  let score = 50; // 기본 점수

  // 최근 완료한 액션 타입과의 다양성
  const recentActions = userContext.completedActions.slice(-5);
  const sameTypeCount = recentActions.filter(a => a.type === action.actionType).length;
  score += (5 - sameTypeCount) * 10; // 다양성 보너스

  // 성공적으로 완료한 액션 타입 선호
  const successfulActionsOfType = userContext.completedActions
    .filter(a => a.type === action.actionType && a.success);
  const successRateForType = successfulActionsOfType.length /
    Math.max(userContext.completedActions.filter(a => a.type === action.actionType).length, 1);

  score += successRateForType * 50;

  return Math.min(Math.max(score, 0), 100);
}

/**
 * 시급성 점수 계산
 */
function calculateUrgencyScore(action: TodaysAction, kpiData: KPIAnalysisData): number {
  let score = 50; // 기본 점수

  // 마지막 액션으로부터의 시간
  const daysSinceLastAction = getDaysSinceLastAction();
  if (daysSinceLastAction >= 3) {
    score += 30; // 오래된 경우 시급
  } else if (daysSinceLastAction >= 1) {
    score += 10;
  }

  // KPI 진행률이 낮은 경우
  if (kpiData.progress.percentage < 30) {
    score += 30;
  } else if (kpiData.progress.percentage < 60) {
    score += 15;
  }

  return Math.min(Math.max(score, 0), 100);
}

// ============================================================================
// Action Creation Helpers
// ============================================================================

function createKPICompletionAction(
  axis: AxisKey,
  incompleteCount: number,
  kpiData: KPIAnalysisData
): TodaysAction {
  const template = ACTION_TEMPLATES.kpi_completion;
  const expectedGain = Math.round(incompleteCount * 2.5); // 항목당 평균 2.5점

  return {
    id: `kpi-complete-${axis}-${Date.now()}`,
    title: template.title(axis, incompleteCount),
    description: template.description(axis, incompleteCount),
    estimatedTime: `${template.estimatedTime(incompleteCount)}분`,
    motivation: template.motivation(expectedGain),
    actionType: 'kpi',
    actionUrl: template.url(axis),
    priority: 'high',
    impact: {
      expectedPoints: expectedGain,
      timeToComplete: template.estimatedTime(incompleteCount),
      difficulty: incompleteCount <= 3 ? 'easy' : incompleteCount <= 6 ? 'medium' : 'hard',
      confidence: 0.8
    },
    metadata: {
      kpiAxis: axis,
      tags: ['completion', 'score-improvement']
    }
  };
}

function createKPIImprovementAction(axis: AxisKey, kpiData: KPIAnalysisData): TodaysAction {
  const template = ACTION_TEMPLATES.kpi_improvement;
  const currentScore = kpiData.axisScores[axis];
  const expectedGain = Math.round((60 - currentScore) * 0.3); // 개선 여지의 30%

  return {
    id: `kpi-improve-${axis}-${Date.now()}`,
    title: template.title(axis),
    description: template.description(axis),
    estimatedTime: `${template.estimatedTime()}분`,
    motivation: template.motivation(expectedGain),
    actionType: 'kpi',
    actionUrl: template.url(axis),
    priority: 'medium',
    impact: {
      expectedPoints: expectedGain,
      timeToComplete: template.estimatedTime(),
      difficulty: 'medium',
      confidence: 0.6
    },
    metadata: {
      kpiAxis: axis,
      tags: ['improvement', 'review']
    }
  };
}

function createExplorationAction(): TodaysAction {
  const template = ACTION_TEMPLATES.exploration;

  return {
    id: `exploration-${Date.now()}`,
    title: template.title(),
    description: template.description(),
    estimatedTime: `${template.estimatedTime()}분`,
    motivation: template.motivation(),
    actionType: 'exploration',
    actionUrl: template.url(),
    priority: 'low',
    impact: {
      expectedPoints: 0,
      timeToComplete: template.estimatedTime(),
      difficulty: 'easy',
      confidence: 0.9
    },
    metadata: {
      tags: ['exploration', 'discovery']
    }
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function personalizeAction(action: TodaysAction, userContext: UserContext): TodaysAction {
  // 사용자 컨텍스트에 따라 메시지 톤 조정
  const personalizedAction = { ...action };

  // 성공률이 낮은 사용자에게는 더 격려적인 메시지
  if (userContext.successRate < 0.7) {
    personalizedAction.motivation = `${action.motivation} • 차근차근 해보세요!`;
  }

  // 시간이 부족한 사용자에게는 시간 단축 제안
  if (userContext.averageSessionTime < action.impact.timeToComplete) {
    personalizedAction.estimatedTime = `${Math.ceil(userContext.averageSessionTime)}분`;
    personalizedAction.description += ' (핵심 항목 우선)';
  }

  return personalizedAction;
}

function getDifficultyMatch(actionDifficulty: string, userPreference: string): number {
  const matchMatrix = {
    easy: { easy: 20, medium: 0, hard: -10 },
    medium: { easy: 5, medium: 20, hard: 5 },
    hard: { easy: -10, medium: 0, hard: 20 }
  };

  return matchMatrix[actionDifficulty]?.[userPreference] || 0;
}

function getDaysSinceLastAction(): number {
  const events = JSON.parse(localStorage.getItem('dashboard_events') || '[]');
  const lastActionEvent = events
    .filter((e: any) => e.type === 'todays_action_click')
    .sort((a: any, b: any) => new Date(b.data.timestamp).getTime() - new Date(a.data.timestamp).getTime())[0];

  if (!lastActionEvent) return 999; // 첫 사용

  const lastActionDate = new Date(lastActionEvent.data.timestamp);
  const daysDiff = Math.floor((Date.now() - lastActionDate.getTime()) / (1000 * 60 * 60 * 24));

  return daysDiff;
}

function getDefaultUserContext(): UserContext {
  const events = JSON.parse(localStorage.getItem('dashboard_events') || '[]');

  // 완료된 액션 분석
  const completedActions: CompletedAction[] = events
    .filter((e: any) => e.type === 'action_completed')
    .map((e: any) => ({
      id: e.data.actionId,
      type: 'kpi', // 임시로 kpi로 설정
      completedAt: new Date(e.data.completedAt),
      timeSpent: Math.floor(e.data.completionTime / (1000 * 60)), // 분으로 변환
      success: true // 완료된 것은 성공으로 간주
    }));

  const successRate = completedActions.length > 0 ?
    completedActions.filter(a => a.success).length / completedActions.length : 0.8;

  const averageSessionTime = completedActions.length > 0 ?
    completedActions.reduce((sum, a) => sum + a.timeSpent, 0) / completedActions.length :
    15; // 기본 15분

  return {
    completedActions,
    preferredDifficulty: 'medium',
    averageSessionTime: Math.max(averageSessionTime, 5), // 최소 5분
    successRate: Math.max(successRate, 0.5) // 최소 50%
  };
}

// ============================================================================
// Export
// ============================================================================

export {
  AXIS_CONFIG,
  type KPIAnalysisData,
  type UserContext,
  type CompletedAction
};