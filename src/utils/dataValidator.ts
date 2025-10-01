/**
 * Data Validator Utility
 * KPI 데이터 무결성 검증 로직
 */

import type {
  KPIDefinition,
  KPIResponse,
  ProcessedKPIData,
  AxisKey,
  ClusterInfo
} from '@/types/reportV3.types';

/**
 * KPI Response 검증
 */
export function validateKPIResponse(
  response: KPIResponse,
  kpi: KPIDefinition
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 기본 검증
  if (!response) {
    errors.push('Response is null or undefined');
    return { isValid: false, errors };
  }

  // KPI ID 일치 검증
  if (response.kpi_id !== kpi.kpi_id) {
    errors.push(`KPI ID mismatch: expected ${kpi.kpi_id}, got ${response.kpi_id}`);
  }

  // 타입별 검증
  switch (kpi.dataType) {
    case 'rubric':
      if (kpi.rubricType === 'single' && !response.choice_id) {
        errors.push('Missing choice_id for single rubric');
      }
      break;

    case 'numeric':
      if (response.value === undefined || response.value === null) {
        errors.push('Missing numeric value');
      } else if (typeof response.value !== 'number') {
        errors.push('Value must be a number');
      }
      break;

    case 'multiselect':
      if (!Array.isArray(response.selectedOptions)) {
        errors.push('selectedOptions must be an array');
      }
      break;

    case 'calculation':
      if (!response.inputs || typeof response.inputs !== 'object') {
        errors.push('Missing or invalid calculation inputs');
      }
      break;
  }

  // 타임스탬프 검증
  if (!response.timestamp) {
    errors.push('Missing timestamp');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * ProcessedKPIData 검증
 */
export function validateProcessedData(
  data: ProcessedKPIData
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 필수 필드 검증
  if (!data.kpi) errors.push('Missing KPI definition');
  if (!data.response) errors.push('Missing KPI response');
  if (!data.weight) errors.push('Missing weight information');
  if (!data.processedValue) errors.push('Missing processed value');
  if (!data.insights) errors.push('Missing insights');

  // 점수 범위 검증
  if (data.processedValue) {
    const score = extractScore(data.processedValue);
    if (score !== null && (score < 0 || score > 100)) {
      errors.push(`Score out of range: ${score}`);
    }
  }

  // 가중치 검증
  if (data.weight && !['x1', 'x2', 'x3'].includes(data.weight.level)) {
    errors.push(`Invalid weight level: ${data.weight.level}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 축별 데이터 검증
 */
export function validateAxisData(
  axisData: ProcessedKPIData[],
  axis: AxisKey
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 축 일치 검증
  const wrongAxis = axisData.filter(data => data.kpi.axis !== axis);
  if (wrongAxis.length > 0) {
    errors.push(`${wrongAxis.length} KPIs have wrong axis assignment`);
  }

  // 핵심 KPI 검증
  const criticalKPIs = axisData.filter(data => data.weight.emphasis === 'critical');
  if (criticalKPIs.length === 0) {
    warnings.push('No critical KPIs found for this axis');
  }

  // 데이터 완전성 검증
  const missingData = axisData.filter(
    data => !data.processedValue || data.processedValue.type === 'error'
  );
  if (missingData.length > 0) {
    warnings.push(`${missingData.length} KPIs have missing or error data`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 클러스터 데이터 검증
 */
export function validateClusterData(
  allData: ProcessedKPIData[],
  cluster: ClusterInfo
): { isValid: boolean; errors: string[]; warnings: string[]; stats: DataStats } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 축별 분포 확인
  const axisCounts = {
    GO: 0,
    EC: 0,
    PT: 0,
    PF: 0,
    TO: 0
  };

  allData.forEach(data => {
    if (data.kpi.axis in axisCounts) {
      axisCounts[data.kpi.axis as AxisKey]++;
    }
  });

  // 균형 검증 (모든 축에 최소 1개 이상의 KPI)
  const emptyAxes = Object.entries(axisCounts)
    .filter(([_, count]) => count === 0)
    .map(([axis]) => axis);

  if (emptyAxes.length > 0) {
    warnings.push(`No data for axes: ${emptyAxes.join(', ')}`);
  }

  // 최소 KPI 수 검증
  const totalKPIs = allData.length;
  if (totalKPIs < 5) {
    errors.push(`Insufficient KPIs: ${totalKPIs} (minimum 5 required)`);
  }

  // 가중치 분포 검증
  const weightDistribution = {
    x3: allData.filter(d => d.weight.level === 'x3').length,
    x2: allData.filter(d => d.weight.level === 'x2').length,
    x1: allData.filter(d => d.weight.level === 'x1').length
  };

  if (weightDistribution.x3 === 0) {
    warnings.push('No critical (x3) KPIs defined');
  }

  // 통계 정보
  const stats: DataStats = {
    totalKPIs,
    axisCounts,
    weightDistribution,
    completionRate: calculateCompletionRate(allData),
    averageScore: calculateAverageScore(allData)
  };

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats
  };
}

/**
 * 점수 추출 헬퍼
 */
function extractScore(processedValue: any): number | null {
  switch (processedValue.type) {
    case 'rubric':
      return processedValue.selectedChoice?.score || null;
    case 'multiselect':
      return processedValue.totalScore || null;
    case 'numeric':
    case 'calculation':
      // 이들은 별도 계산 필요
      return null;
    default:
      return null;
  }
}

/**
 * 완료율 계산
 */
function calculateCompletionRate(data: ProcessedKPIData[]): number {
  if (data.length === 0) return 0;

  const completed = data.filter(
    d => d.response && d.processedValue && d.processedValue.type !== 'error'
  ).length;

  return Math.round((completed / data.length) * 100);
}

/**
 * 평균 점수 계산
 */
function calculateAverageScore(data: ProcessedKPIData[]): number {
  const scores = data
    .map(d => extractScore(d.processedValue))
    .filter(score => score !== null) as number[];

  if (scores.length === 0) return 0;

  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round(sum / scores.length);
}

/**
 * 데이터 통계 타입
 */
export interface DataStats {
  totalKPIs: number;
  axisCounts: Record<AxisKey, number>;
  weightDistribution: {
    x3: number;
    x2: number;
    x1: number;
  };
  completionRate: number;
  averageScore: number;
}

/**
 * 종합 데이터 검증
 */
export function validateReportData(
  data: ProcessedKPIData[],
  cluster: ClusterInfo
): {
  isValid: boolean;
  summary: {
    errors: number;
    warnings: number;
    stats: DataStats;
  };
  details: {
    kpiErrors: string[];
    axisWarnings: string[];
    clusterWarnings: string[];
  };
} {
  // 개별 KPI 검증
  const kpiErrors: string[] = [];
  data.forEach((item, index) => {
    const validation = validateProcessedData(item);
    if (!validation.isValid) {
      kpiErrors.push(`KPI[${index}]: ${validation.errors.join(', ')}`);
    }
  });

  // 축별 검증
  const axisWarnings: string[] = [];
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
  axes.forEach(axis => {
    const axisData = data.filter(d => d.kpi.axis === axis);
    const validation = validateAxisData(axisData, axis);
    if (validation.warnings.length > 0) {
      axisWarnings.push(`${axis}: ${validation.warnings.join(', ')}`);
    }
  });

  // 클러스터 검증
  const clusterValidation = validateClusterData(data, cluster);

  return {
    isValid: kpiErrors.length === 0 && clusterValidation.errors.length === 0,
    summary: {
      errors: kpiErrors.length + clusterValidation.errors.length,
      warnings: axisWarnings.length + clusterValidation.warnings.length,
      stats: clusterValidation.stats
    },
    details: {
      kpiErrors,
      axisWarnings,
      clusterWarnings: clusterValidation.warnings
    }
  };
}

/**
 * 필수 KPI 검증
 */
export function validateRequiredKPIs(
  responses: Map<string, KPIResponse>,
  requiredKPIIds: string[]
): { missing: string[]; completed: string[] } {
  const missing: string[] = [];
  const completed: string[] = [];

  requiredKPIIds.forEach(kpiId => {
    if (responses.has(kpiId)) {
      completed.push(kpiId);
    } else {
      missing.push(kpiId);
    }
  });

  return { missing, completed };
}