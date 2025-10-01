/**
 * Score Calculator Utility
 * KPI 타입별 정확한 점수 계산 로직
 */

import type {
  ProcessedValue,
  RubricProcessedValue,
  NumericProcessedValue,
  MultiSelectProcessedValue,
  CalculationProcessedValue,
  KPIDefinition,
  KPIResponse
} from '@/types/reportV3.types';

/**
 * KPI 점수 계산기 인터페이스
 */
export interface ScoreCalculator {
  calculateScore(processedValue: ProcessedValue, kpi?: KPIDefinition): number;
  calculateRubricScore(value: RubricProcessedValue): number;
  calculateNumericScore(value: NumericProcessedValue, benchmark?: number): number;
  calculateMultiSelectScore(value: MultiSelectProcessedValue): number;
  calculateCalculationScore(value: CalculationProcessedValue, formula?: string): number;
}

/**
 * 메인 점수 계산 함수
 */
export function calculateKPIScore(
  processedValue: ProcessedValue,
  kpi?: KPIDefinition,
  benchmark?: number
): number {
  switch (processedValue.type) {
    case 'rubric':
      return calculateRubricScore(processedValue as RubricProcessedValue);

    case 'numeric':
      return calculateNumericScore(processedValue as NumericProcessedValue, benchmark);

    case 'multiselect':
      return calculateMultiSelectScore(processedValue as MultiSelectProcessedValue);

    case 'calculation':
      return calculateCalculationScore(processedValue as CalculationProcessedValue, kpi);

    default:
      console.warn(`Unknown processed value type: ${(processedValue as any).type}`);
      return 0;
  }
}

/**
 * Rubric 타입 점수 계산
 * 선택된 레벨의 점수를 직접 반환
 */
export function calculateRubricScore(value: RubricProcessedValue): number {
  if (!value.selectedChoice) {
    return 0;
  }

  // Rubric은 이미 0-100 점수를 가지고 있음
  return Math.max(0, Math.min(100, value.selectedChoice.score));
}

/**
 * Numeric 타입 점수 계산
 * 벤치마크 대비 상대적 점수 계산
 */
export function calculateNumericScore(
  value: NumericProcessedValue,
  benchmark?: number
): number {
  const numValue = value.value;

  // 벤치마크가 없으면 기본 로직 사용
  if (!benchmark) {
    // 성장률, 전환율 등 퍼센트 지표인 경우
    if (value.unit === '%') {
      // 0-100% 범위를 0-100점으로 매핑
      return Math.max(0, Math.min(100, numValue));
    }

    // 금액, 개수 등 절대값 지표인 경우
    // 임시로 로그 스케일 사용
    if (numValue <= 0) return 0;

    // 로그 스케일로 0-100 매핑 (1 ~ 1,000,000 범위 가정)
    const logValue = Math.log10(numValue + 1);
    const logMax = 6; // log10(1,000,000)
    return Math.max(0, Math.min(100, (logValue / logMax) * 100));
  }

  // 벤치마크가 있는 경우: 벤치마크 대비 비율로 계산
  if (benchmark === 0) return numValue > 0 ? 100 : 0;

  const ratio = numValue / benchmark;

  // 벤치마크의 50% ~ 150% 범위를 0 ~ 100점으로 매핑
  if (ratio <= 0.5) return 0;
  if (ratio >= 1.5) return 100;

  // 선형 보간
  return ((ratio - 0.5) / 1.0) * 100;
}

/**
 * MultiSelect 타입 점수 계산
 * 선택된 항목들의 가중치 합계
 */
export function calculateMultiSelectScore(value: MultiSelectProcessedValue): number {
  // 이미 계산된 totalScore 사용
  if (value.totalScore !== undefined) {
    return Math.max(0, Math.min(100, value.totalScore));
  }

  // totalScore가 없으면 선택된 개수 비율로 계산
  const selectionRate = value.selectedCount / Math.max(1, value.totalOptions);
  return Math.round(selectionRate * 100);
}

/**
 * Calculation 타입 점수 계산
 * 복잡한 수식 기반 계산
 */
export function calculateCalculationScore(
  value: CalculationProcessedValue,
  kpi?: KPIDefinition
): number {
  const result = value.result;

  // 계산 결과가 없으면 0점
  if (result === null || result === undefined || isNaN(result)) {
    return 0;
  }

  // KPI 정의에 scoring_formula가 있으면 사용
  if (kpi && kpi.dataType === 'calculation' && kpi.formula) {
    // 점수 계산 공식이 있는 경우 (예: "result * 10", "min(100, result * 2)")
    try {
      // 간단한 수식 평가 (보안을 위해 제한적으로)
      const scoringFormula = kpi.metadata?.scoring_formula;
      if (scoringFormula) {
        return evaluateSimpleFormula(scoringFormula, result);
      }
    } catch (error) {
      console.error('Error evaluating scoring formula:', error);
    }
  }

  // 기본 로직: 결과값을 0-100 범위로 정규화
  // 음수는 0점
  if (result <= 0) return 0;

  // 100 이상은 100점
  if (result >= 100) return 100;

  // 0-100 사이는 그대로
  return Math.round(result);
}

/**
 * 간단한 수식 평가 (보안 고려)
 */
function evaluateSimpleFormula(formula: string, value: number): number {
  // 안전한 수식 평가를 위한 제한적 파싱
  // 지원: +, -, *, /, min, max, 숫자

  try {
    // 'result'를 실제 값으로 치환
    let processedFormula = formula.replace(/\bresult\b/g, value.toString());

    // min, max 함수 처리
    processedFormula = processedFormula.replace(
      /min\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/g,
      (match, a, b) => Math.min(parseFloat(a), parseFloat(b)).toString()
    );

    processedFormula = processedFormula.replace(
      /max\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/g,
      (match, a, b) => Math.max(parseFloat(a), parseFloat(b)).toString()
    );

    // 안전한 수식인지 검증 (숫자, 연산자, 괄호만 허용)
    if (!/^[\d\s+\-*/().]+$/.test(processedFormula)) {
      console.warn('Unsafe formula detected:', processedFormula);
      return 50; // 기본값
    }

    // Function constructor 사용 (eval 대신 상대적으로 안전)
    const result = new Function('return ' + processedFormula)();

    return Math.max(0, Math.min(100, result));
  } catch (error) {
    console.error('Formula evaluation error:', error);
    return 50; // 에러 시 기본값
  }
}

/**
 * 가중치를 적용한 종합 점수 계산
 */
export function calculateWeightedScore(
  scores: Array<{ score: number; weight: 'x1' | 'x2' | 'x3' }>
): number {
  let totalWeightedScore = 0;
  let totalWeight = 0;

  scores.forEach(({ score, weight }) => {
    const weightValue = weight === 'x3' ? 3 : weight === 'x2' ? 2 : 1;
    totalWeightedScore += score * weightValue;
    totalWeight += weightValue;
  });

  if (totalWeight === 0) return 0;

  return Math.round((totalWeightedScore / totalWeight) * 10) / 10;
}

/**
 * 축별 평균 점수 계산
 */
export function calculateAxisAverageScore(
  kpiScores: Array<{ score: number; weight: 'x1' | 'x2' | 'x3' }>
): number {
  if (kpiScores.length === 0) return 0;

  return calculateWeightedScore(kpiScores);
}

/**
 * 점수 검증
 */
export function validateScore(score: number): boolean {
  return !isNaN(score) && score >= 0 && score <= 100;
}

/**
 * 점수 등급 결정
 */
export function getScoreGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * 점수 상태 결정
 */
export function getScoreStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

/**
 * 벤치마크 대비 갭 계산
 */
export function calculateBenchmarkGap(score: number, benchmark: number): number {
  return score - benchmark;
}

/**
 * 백분위 계산 (간단한 버전)
 */
export function calculatePercentile(score: number, distribution?: number[]): number {
  if (!distribution || distribution.length === 0) {
    // 분포 데이터가 없으면 점수 기반 추정
    if (score >= 90) return 95;
    if (score >= 80) return 80;
    if (score >= 70) return 60;
    if (score >= 60) return 40;
    if (score >= 50) return 25;
    return 10;
  }

  // 실제 분포에서 백분위 계산
  const below = distribution.filter(s => s < score).length;
  return Math.round((below / distribution.length) * 100);
}

/**
 * 개선 가능 점수 계산
 */
export function calculateImprovementPotential(
  currentScore: number,
  maxPossibleScore: number = 100
): number {
  return maxPossibleScore - currentScore;
}

/**
 * 점수 트렌드 분석
 */
export function analyzeScoreTrend(
  scores: number[]
): 'improving' | 'declining' | 'stable' | 'volatile' {
  if (scores.length < 2) return 'stable';

  // 최근 3개 점수로 트렌드 판단
  const recent = scores.slice(-3);
  const changes = [];

  for (let i = 1; i < recent.length; i++) {
    changes.push(recent[i] - recent[i - 1]);
  }

  const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
  const variance = changes.reduce((sum, c) => sum + Math.pow(c - avgChange, 2), 0) / changes.length;

  // 변동성이 크면 volatile
  if (Math.sqrt(variance) > 10) return 'volatile';

  // 평균 변화량으로 트렌드 결정
  if (avgChange > 2) return 'improving';
  if (avgChange < -2) return 'declining';

  return 'stable';
}