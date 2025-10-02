/**
 * Unified KPI Data Builder
 * Critical/Important/Standard KPI를 하나의 테이블로 통합
 */

import type { ProcessedKPIData, NumericProcessedValue, RubricProcessedValue, MultiSelectProcessedValue } from '@/types/reportV3.types';
import { calculateKPIScore } from '@/utils/scoreCalculator';

export interface UnifiedKPIRow {
  id: string;
  priority: number;
  weight: 'x3' | 'x2' | 'x1';
  weightPriority: number;
  kpiName: string;
  inputType: string;
  response: string;
  score: number;
  risk: 'high' | 'medium' | 'low';
  benchmark: number | null;

  // 확장 가능한 상세 정보
  details: {
    fullQuestion: string;
    insight: string;
    interpretation: string;
    weightExplanation: string;
    benchmarkSource?: string;
    benchmarkIndustryAvg?: number;
  };
}

/**
 * ProcessedKPIData를 UnifiedKPIRow로 변환
 */
export function buildUnifiedKPIRows(processedData: ProcessedKPIData[]): UnifiedKPIRow[] {
  return processedData.map(item => {
    const { kpi, processedValue, weight, insights, benchmarkInfo } = item;

    // 응답값 포맷팅
    const response = formatResponseValue(kpi.input_type, processedValue);

    // 점수 계산
    const score = calculateKPIScore(processedValue, kpi, benchmarkInfo);

    // 벤치마크 차이 계산
    const benchmark = benchmarkInfo
      ? score - benchmarkInfo.industryAverage
      : null;

    return {
      id: kpi.kpi_id,
      priority: weight.priority,
      weight: weight.level,
      weightPriority: getWeightOrder(weight.level),
      kpiName: kpi.question,
      inputType: kpi.input_type,
      response,
      score,
      risk: insights.riskLevel,
      benchmark,
      details: {
        fullQuestion: kpi.question,
        insight: insights.summary || '',
        interpretation: insights.interpretation || '',
        weightExplanation: weight.emphasis || '',
        benchmarkSource: benchmarkInfo?.source,
        benchmarkIndustryAvg: benchmarkInfo?.industryAverage
      }
    };
  }).sort((a, b) => {
    // 1차: 가중치 (x3 > x2 > x1)
    if (a.weightPriority !== b.weightPriority) {
      return a.weightPriority - b.weightPriority;
    }
    // 2차: 우선순위 (높은 순)
    return b.priority - a.priority;
  });
}

/**
 * 가중치 순서 반환
 */
function getWeightOrder(weight: 'x3' | 'x2' | 'x1'): number {
  const order = { 'x3': 0, 'x2': 1, 'x1': 2 };
  return order[weight];
}

/**
 * 응답값 포맷팅
 */
function formatResponseValue(
  inputType: string,
  processedValue: NumericProcessedValue | RubricProcessedValue | MultiSelectProcessedValue | any
): string {
  // inputType 정규화 (대소문자 무시)
  const normalizedType = inputType.toLowerCase();

  switch (normalizedType) {
    case 'numeric':
    case 'numeric_input':
      const numericVal = processedValue as NumericProcessedValue;
      return numericVal.displayValue || '-';

    case 'percentage_input':
      return `${(processedValue as NumericProcessedValue).rawValue?.toFixed(1) || 0}%`;

    case 'rubric':
      const rubricValue = processedValue as RubricProcessedValue;
      return rubricValue.selectedChoice?.label || '-';

    case 'multiselect':
    case 'multi_select':
    case 'single_select':
      const multiValue = processedValue as MultiSelectProcessedValue;
      return `${multiValue.selectedChoices?.length || 0}개 선택`;

    case 'calculation':
      const calcValue = processedValue as any;
      return calcValue.displayValue || '-';

    case 'stage':
      // Stage 타입은 특별 처리
      return processedValue.displayValue || '-';

    default:
      // fallback: displayValue가 있으면 사용
      return (processedValue as any).displayValue || '-';
  }
}

/**
 * 가중치별 그룹 정보
 */
export interface WeightGroup {
  weight: 'x3' | 'x2' | 'x1';
  label: string;
  icon: string;
  color: {
    bg: string;
    text: string;
  };
  count: number;
}

/**
 * 가중치별 그룹 생성
 */
export function getWeightGroups(rows: UnifiedKPIRow[]): WeightGroup[] {
  const x3Count = rows.filter(r => r.weight === 'x3').length;
  const x2Count = rows.filter(r => r.weight === 'x2').length;
  const x1Count = rows.filter(r => r.weight === 'x1').length;

  return [
    {
      weight: 'x3',
      label: 'Critical',
      icon: '🔴',
      color: { bg: 'bg-red-50', text: 'text-red-900' },
      count: x3Count
    },
    {
      weight: 'x2',
      label: 'Important',
      icon: '🟠',
      color: { bg: 'bg-orange-50', text: 'text-orange-900' },
      count: x2Count
    },
    {
      weight: 'x1',
      label: 'Standard',
      icon: '⚪',
      color: { bg: 'bg-gray-50', text: 'text-gray-900' },
      count: x1Count
    }
  ];
}

/**
 * 테이블 통계 계산
 */
export interface TableStats {
  total: number;
  avgScore: number;
  excellentCount: number;
  needsImprovementCount: number;
}

export function calculateTableStats(rows: UnifiedKPIRow[]): TableStats {
  if (rows.length === 0) {
    return {
      total: 0,
      avgScore: 0,
      excellentCount: 0,
      needsImprovementCount: 0
    };
  }

  const total = rows.length;
  const avgScore = rows.reduce((sum, row) => sum + row.score, 0) / total;
  const excellentCount = rows.filter(row => row.score >= 70).length;
  const needsImprovementCount = rows.filter(row => row.risk === 'high').length;

  return {
    total,
    avgScore,
    excellentCount,
    needsImprovementCount
  };
}
