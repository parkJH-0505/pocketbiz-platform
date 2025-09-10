import type { AxisKey, KPIResponse } from '../types';
import { mockKPIs } from '../data/mockKPIs';
import { calculateAxisScore } from './scoring';
import type { Insight } from './insights';

export interface Action {
  id: string;
  title: string;
  description: string;
  axis: AxisKey;
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  timeframe: '1주' | '1개월' | '3개월' | '6개월';
  kpis: string[]; // 관련 KPI IDs
  expectedOutcome: string;
  resources: string[];
  status?: 'not_started' | 'in_progress' | 'completed';
}

export interface Milestone {
  phase: number;
  title: string;
  description: string;
  duration: string;
  actions: Action[];
  targetScore?: number;
}

// 액션 플랜 생성
export function generateActionPlan(
  responses: Record<string, KPIResponse>,
  insights: Insight[]
): Action[] {
  const actions: Action[] = [];
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
  
  // 1. 축별 점수 계산 및 우선순위 결정
  const axisScores = axes.map(axis => ({
    axis,
    score: calculateAxisScore(responses, axis)
  })).sort((a, b) => a.score - b.score); // 낮은 점수 순
  
  // 2. 가장 낮은 점수의 축부터 액션 생성
  axisScores.forEach(({ axis, score }, index) => {
    const priority = index === 0 ? 'critical' : index === 1 ? 'high' : 'medium';
    const axisActions = generateAxisActions(axis, score, responses, priority);
    actions.push(...axisActions);
  });
  
  // 3. 인사이트 기반 추가 액션
  const insightActions = generateInsightActions(insights);
  actions.push(...insightActions);
  
  // 4. 중복 제거 및 우선순위 정렬
  const uniqueActions = removeDuplicateActions(actions);
  return sortActionsByPriority(uniqueActions);
}

// 축별 액션 생성
function generateAxisActions(
  axis: AxisKey,
  score: number,
  responses: Record<string, KPIResponse>,
  basePriority: 'critical' | 'high' | 'medium' | 'low'
): Action[] {
  const actions: Action[] = [];
  const axisKPIs = mockKPIs.filter(kpi => kpi.axis === axis);
  
  // 낮은 점수 KPI 찾기
  const lowScoreKPIs = axisKPIs
    .map(kpi => ({
      kpi,
      response: responses[kpi.kpi_id],
      score: responses[kpi.kpi_id]?.normalized_score || 0
    }))
    .filter(item => item.score < 60 && item.response?.status !== 'na')
    .sort((a, b) => a.score - b.score);
  
  // 축별 특화 액션 생성
  switch (axis) {
    case 'GO':
      if (score < 60) {
        actions.push({
          id: `action-${axis}-1`,
          title: '시장 검증 프로세스 구축',
          description: '체계적인 고객 인터뷰와 시장 조사를 통해 제품-시장 적합성을 검증하세요.',
          axis,
          priority: basePriority,
          effort: 'medium',
          impact: 'high',
          timeframe: '1개월',
          kpis: lowScoreKPIs.slice(0, 3).map(item => item.kpi.kpi_id),
          expectedOutcome: '명확한 타겟 고객 정의 및 시장 규모 파악',
          resources: ['시장조사 예산', '고객 인터뷰 담당자']
        });
      }
      
      if (lowScoreKPIs.some(item => item.kpi.kpi_id.includes('GO-05'))) {
        actions.push({
          id: `action-${axis}-2`,
          title: '사용자 획득 전략 수립',
          description: 'MAU 증가를 위한 구체적인 마케팅 및 그로스 전략을 수립하세요.',
          axis,
          priority: 'high',
          effort: 'high',
          impact: 'high',
          timeframe: '3개월',
          kpis: ['S1-GO-05', 'S1-GO-04'],
          expectedOutcome: 'MAU 50% 증가',
          resources: ['마케팅 예산', '그로스 전문가']
        });
      }
      break;
      
    case 'EC':
      if (score < 60) {
        actions.push({
          id: `action-${axis}-1`,
          title: '수익화 모델 개선',
          description: '가격 정책을 재검토하고 유료 전환율을 높이는 전략을 실행하세요.',
          axis,
          priority: basePriority,
          effort: 'medium',
          impact: 'high',
          timeframe: '1개월',
          kpis: ['S1-EC-02', 'S1-EC-03'],
          expectedOutcome: 'MRR 30% 증가, 유료 전환율 개선',
          resources: ['가격 분석 도구', '세일즈 팀']
        });
      }
      break;
      
    case 'PT':
      if (score < 60) {
        actions.push({
          id: `action-${axis}-1`,
          title: '제품 안정성 향상',
          description: '서비스 가용성을 높이고 핵심 기능의 버그를 해결하세요.',
          axis,
          priority: basePriority,
          effort: 'high',
          impact: 'medium',
          timeframe: '3개월',
          kpis: ['S1-PT-03'],
          expectedOutcome: '가용성 99% 달성',
          resources: ['개발팀 리소스', '모니터링 도구']
        });
      }
      break;
      
    case 'PF':
      if (score < 60) {
        actions.push({
          id: `action-${axis}-1`,
          title: '자금 조달 준비',
          description: '런웨이 확보를 위한 투자 유치나 대출 프로그램을 검토하세요.',
          axis,
          priority: 'critical',
          effort: 'high',
          impact: 'high',
          timeframe: '3개월',
          kpis: ['S1-PF-01', 'S1-PF-02'],
          expectedOutcome: '12개월 이상 런웨이 확보',
          resources: ['IR 자료', '재무 어드바이저']
        });
      }
      break;
      
    case 'TO':
      if (score < 60) {
        actions.push({
          id: `action-${axis}-1`,
          title: '핵심 인재 영입',
          description: '부족한 역량을 보완할 핵심 인재를 영입하세요.',
          axis,
          priority: basePriority,
          effort: 'high',
          impact: 'high',
          timeframe: '3개월',
          kpis: ['S1-TO-02', 'S1-TO-03'],
          expectedOutcome: '핵심 포지션 충원 완료',
          resources: ['채용 예산', '헤드헌터']
        });
      }
      break;
  }
  
  return actions;
}

// 인사이트 기반 액션 생성
function generateInsightActions(insights: Insight[]): Action[] {
  const actions: Action[] = [];
  
  insights
    .filter(insight => insight.actionable && insight.impact === 'high')
    .slice(0, 3)
    .forEach((insight, index) => {
      if (insight.type === 'risk' || insight.type === 'weakness') {
        actions.push({
          id: `action-insight-${index}`,
          title: `${insight.title} 대응`,
          description: insight.description,
          axis: insight.axis || 'GO',
          priority: 'high',
          effort: 'medium',
          impact: 'high',
          timeframe: '1개월',
          kpis: [],
          expectedOutcome: '리스크 완화 및 개선',
          resources: ['전담 팀']
        });
      }
    });
  
  return actions;
}

// 로드맵 생성
export function generateRoadmap(
  actions: Action[],
  currentScores: Record<AxisKey, number>
): Milestone[] {
  const milestones: Milestone[] = [];
  
  // Phase 1: 긴급 개선 (1-3개월)
  milestones.push({
    phase: 1,
    title: '긴급 개선 단계',
    description: '가장 시급한 문제들을 해결하고 기본 체력을 다집니다.',
    duration: '3개월',
    actions: actions.filter(a => 
      a.priority === 'critical' || 
      (a.priority === 'high' && a.timeframe === '1개월')
    ),
    targetScore: Math.min(...Object.values(currentScores)) + 10
  });
  
  // Phase 2: 성장 기반 구축 (3-6개월)
  milestones.push({
    phase: 2,
    title: '성장 기반 구축',
    description: '지속 가능한 성장을 위한 시스템과 프로세스를 구축합니다.',
    duration: '3개월',
    actions: actions.filter(a => 
      a.priority === 'high' && 
      (a.timeframe === '3개월' || a.timeframe === '6개월')
    ),
    targetScore: 70
  });
  
  // Phase 3: 규모 확장 (6-12개월)
  milestones.push({
    phase: 3,
    title: '규모 확장 단계',
    description: '검증된 모델을 바탕으로 빠른 성장을 추구합니다.',
    duration: '6개월',
    actions: actions.filter(a => 
      a.priority === 'medium' || 
      a.timeframe === '6개월'
    ),
    targetScore: 80
  });
  
  return milestones;
}

// 유틸리티 함수
function removeDuplicateActions(actions: Action[]): Action[] {
  const seen = new Set<string>();
  return actions.filter(action => {
    const key = `${action.axis}-${action.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sortActionsByPriority(actions: Action[]): Action[] {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const impactOrder = { high: 0, medium: 1, low: 2 };
  const effortOrder = { low: 0, medium: 1, high: 2 };
  
  return actions.sort((a, b) => {
    // 1. 우선순위
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    // 2. 영향도 (높을수록 우선)
    if (impactOrder[a.impact] !== impactOrder[b.impact]) {
      return impactOrder[a.impact] - impactOrder[b.impact];
    }
    // 3. 노력 (낮을수록 우선)
    return effortOrder[a.effort] - effortOrder[b.effort];
  });
}