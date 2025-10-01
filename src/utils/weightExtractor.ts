/**
 * 가중치 추출 및 관리 유틸리티
 * CSV StageRules에서 가중치 정보를 추출하고 클러스터별로 정리
 */

import type { KPIDefinition, AxisKey, ClusterInfo } from '../types';
import type { WeightLevel, WeightInfo } from '../types/reportV3.types';
import { getKPIStageRule } from '../data/kpiLoader';
import { WEIGHT_CONFIG } from './reportDataProcessor';

export interface ClusterWeightInfo {
  clusterKey: string;
  sector: string;
  stage: string;
  weightDistribution: Record<WeightLevel, number>; // 각 가중치별 KPI 개수
  totalKPIs: number;
  criticalRatio: number; // Critical KPI 비율
}

export interface KPIWeightData {
  kpiId: string;
  kpiName: string;
  axis: AxisKey;
  weight: WeightLevel;
  weightInfo: WeightInfo;
  applicableStages: string[];
}

/**
 * 특정 KPI의 가중치 정보를 가져옴
 */
export async function extractKPIWeight(
  kpiId: string,
  stage: string
): Promise<{ weight: WeightLevel; info: WeightInfo }> {
  try {
    const stageRule = await getKPIStageRule(kpiId, stage);
    const weight = (stageRule?.weight || 'x1') as WeightLevel;
    const info = WEIGHT_CONFIG[weight];

    return { weight, info };
  } catch (error) {
    console.warn(`Failed to extract weight for KPI ${kpiId} stage ${stage}:`, error);
    return {
      weight: 'x1',
      info: WEIGHT_CONFIG['x1']
    };
  }
}

/**
 * 특정 클러스터의 모든 KPI 가중치 정보를 추출
 */
export async function extractClusterWeights(
  kpis: KPIDefinition[],
  cluster: ClusterInfo
): Promise<{
  clusterInfo: ClusterWeightInfo;
  kpiWeights: KPIWeightData[];
}> {
  const clusterKey = `${cluster.sector}-${cluster.stage}`;
  const kpiWeights: KPIWeightData[] = [];
  const weightCounts: Record<WeightLevel, number> = { 'x1': 0, 'x2': 0, 'x3': 0 };

  // 해당 클러스터에 적용되는 KPI들 필터링
  const applicableKPIs = kpis.filter(kpi =>
    kpi.applicable_stages?.includes(cluster.stage)
  );

  // 각 KPI의 가중치 정보 추출
  for (const kpi of applicableKPIs) {
    try {
      const { weight, info } = await extractKPIWeight(kpi.kpi_id, cluster.stage);

      kpiWeights.push({
        kpiId: kpi.kpi_id,
        kpiName: kpi.name,
        axis: kpi.axis,
        weight,
        weightInfo: info,
        applicableStages: kpi.applicable_stages?.split(',').map(s => s.trim()) || []
      });

      weightCounts[weight]++;
    } catch (error) {
      console.error(`Failed to process KPI weight for ${kpi.kpi_id}:`, error);
      // 에러가 발생해도 계속 진행, 기본값으로 처리
      kpiWeights.push({
        kpiId: kpi.kpi_id,
        kpiName: kpi.name,
        axis: kpi.axis,
        weight: 'x1',
        weightInfo: WEIGHT_CONFIG['x1'],
        applicableStages: kpi.applicable_stages?.split(',').map(s => s.trim()) || []
      });
      weightCounts['x1']++;
    }
  }

  const totalKPIs = applicableKPIs.length;
  const criticalRatio = totalKPIs > 0 ? weightCounts['x3'] / totalKPIs : 0;

  const clusterInfo: ClusterWeightInfo = {
    clusterKey,
    sector: cluster.sector,
    stage: cluster.stage,
    weightDistribution: weightCounts,
    totalKPIs,
    criticalRatio
  };

  return { clusterInfo, kpiWeights };
}

/**
 * 가중치별로 KPI 그룹화
 */
export function groupKPIsByWeight(kpiWeights: KPIWeightData[]): {
  critical: KPIWeightData[];
  important: KPIWeightData[];
  normal: KPIWeightData[];
} {
  return {
    critical: kpiWeights.filter(item => item.weight === 'x3'),
    important: kpiWeights.filter(item => item.weight === 'x2'),
    normal: kpiWeights.filter(item => item.weight === 'x1')
  };
}

/**
 * 축별로 가중치 분포 분석
 */
export function analyzeAxisWeightDistribution(kpiWeights: KPIWeightData[]): {
  [key in AxisKey]: {
    total: number;
    critical: number;
    important: number;
    normal: number;
    criticalRatio: number;
  };
} {
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
  const result = {} as any;

  axes.forEach(axis => {
    const axisKPIs = kpiWeights.filter(item => item.axis === axis);
    const critical = axisKPIs.filter(item => item.weight === 'x3').length;
    const important = axisKPIs.filter(item => item.weight === 'x2').length;
    const normal = axisKPIs.filter(item => item.weight === 'x1').length;
    const total = axisKPIs.length;

    result[axis] = {
      total,
      critical,
      important,
      normal,
      criticalRatio: total > 0 ? critical / total : 0
    };
  });

  return result;
}

/**
 * 우선순위 기반 KPI 정렬
 */
export function sortKPIsByPriority(kpiWeights: KPIWeightData[]): KPIWeightData[] {
  return kpiWeights.sort((a, b) => {
    // 1. 가중치 우선 (x3 > x2 > x1)
    const weightPriority = { 'x3': 3, 'x2': 2, 'x1': 1 };
    const weightDiff = weightPriority[b.weight] - weightPriority[a.weight];

    if (weightDiff !== 0) return weightDiff;

    // 2. 축 순서 (GO > EC > PT > PF > TO)
    const axisPriority = { 'GO': 5, 'EC': 4, 'PT': 3, 'PF': 2, 'TO': 1 };
    const axisDiff = axisPriority[b.axis] - axisPriority[a.axis];

    if (axisDiff !== 0) return axisDiff;

    // 3. 이름 알파벳 순
    return a.kpiName.localeCompare(b.kpiName, 'ko');
  });
}

/**
 * 모든 25개 클러스터의 가중치 정보 추출 (개발/디버그용)
 */
export async function extractAllClustersWeights(
  kpis: KPIDefinition[]
): Promise<Record<string, ClusterWeightInfo>> {
  const sectors = ['S-1', 'S-2', 'S-3', 'S-4', 'S-5'];
  const stages = ['A-1', 'A-2', 'A-3', 'A-4', 'A-5'];
  const result: Record<string, ClusterWeightInfo> = {};

  for (const sector of sectors) {
    for (const stage of stages) {
      const cluster: ClusterInfo = { sector, stage };

      try {
        const { clusterInfo } = await extractClusterWeights(kpis, cluster);
        result[clusterInfo.clusterKey] = clusterInfo;
      } catch (error) {
        console.error(`Failed to extract weights for ${sector}-${stage}:`, error);
      }
    }
  }

  return result;
}

/**
 * 가중치 정보 검증 (개발용)
 */
export function validateWeightData(kpiWeights: KPIWeightData[]): {
  isValid: boolean;
  issues: string[];
  summary: {
    totalKPIs: number;
    criticalCount: number;
    importantCount: number;
    normalCount: number;
  };
} {
  const issues: string[] = [];

  // 1. 빈 배열 체크
  if (kpiWeights.length === 0) {
    issues.push('No KPI weight data found');
  }

  // 2. 필수 필드 체크
  kpiWeights.forEach(item => {
    if (!item.kpiId) issues.push(`Missing kpiId for ${item.kpiName}`);
    if (!item.kpiName) issues.push(`Missing name for KPI ${item.kpiId}`);
    if (!['GO', 'EC', 'PT', 'PF', 'TO'].includes(item.axis)) {
      issues.push(`Invalid axis ${item.axis} for KPI ${item.kpiId}`);
    }
    if (!['x1', 'x2', 'x3'].includes(item.weight)) {
      issues.push(`Invalid weight ${item.weight} for KPI ${item.kpiId}`);
    }
  });

  // 3. Critical KPI 분포 체크
  const criticalCount = kpiWeights.filter(item => item.weight === 'x3').length;
  const totalKPIs = kpiWeights.length;

  if (criticalCount === 0) {
    issues.push('No critical (x3) KPIs found - this may indicate missing weight data');
  } else if (criticalCount > totalKPIs * 0.3) {
    issues.push(`Too many critical KPIs (${criticalCount}/${totalKPIs}) - consider rebalancing`);
  }

  return {
    isValid: issues.length === 0,
    issues,
    summary: {
      totalKPIs,
      criticalCount,
      importantCount: kpiWeights.filter(item => item.weight === 'x2').length,
      normalCount: kpiWeights.filter(item => item.weight === 'x1').length
    }
  };
}

/**
 * 가중치 통계 분석 (개발/디버그용)
 */
export function analyzeWeightStatistics(allClustersWeights: Record<string, ClusterWeightInfo>) {
  const stats = {
    totalClusters: Object.keys(allClustersWeights).length,
    avgKPIsPerCluster: 0,
    avgCriticalRatio: 0,
    clustersByStage: {} as Record<string, number>,
    clustersBySector: {} as Record<string, number>
  };

  const values = Object.values(allClustersWeights);

  if (values.length > 0) {
    stats.avgKPIsPerCluster = values.reduce((sum, cluster) => sum + cluster.totalKPIs, 0) / values.length;
    stats.avgCriticalRatio = values.reduce((sum, cluster) => sum + cluster.criticalRatio, 0) / values.length;

    // 단계별, 섹터별 클러스터 수 집계
    values.forEach(cluster => {
      stats.clustersByStage[cluster.stage] = (stats.clustersByStage[cluster.stage] || 0) + 1;
      stats.clustersBySector[cluster.sector] = (stats.clustersBySector[cluster.sector] || 0) + 1;
    });
  }

  return stats;
}

/**
 * 개발용 디버그 함수들을 window 객체에 노출
 */
if (import.meta.env.DEV) {
  (window as any).debugWeights = {
    extractClusterWeights,
    extractAllClustersWeights,
    validateWeightData,
    analyzeWeightStatistics,
    sortKPIsByPriority,
    groupKPIsByWeight
  };
}