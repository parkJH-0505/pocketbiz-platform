/**
 * Critical KPI 식별 및 분석 유틸리티
 * 25개 클러스터별 Critical KPI(x3 가중치)를 식별하고 우선순위를 결정
 */

import type { KPIDefinition, AxisKey, ClusterInfo } from '../types';
import type { ProcessedKPIData, ClusterConfig, FocusArea } from '../types/reportV3.types';
import { extractClusterWeights, groupKPIsByWeight, type KPIWeightData } from './weightExtractor';

export interface CriticalKPIAnalysis {
  cluster: ClusterInfo;
  criticalKPIs: CriticalKPIInfo[];
  riskFlags: RiskFlag[];
  focusAreas: FocusArea[];
  recommendations: string[];
}

export interface CriticalKPIInfo {
  kpi: KPIDefinition;
  weight: 'x3';
  priority: number; // 1이 가장 높음
  axis: AxisKey;
  riskLevel: 'low' | 'medium' | 'high';
  businessImpact: 'critical' | 'high' | 'medium';
  reason: string; // 왜 Critical한지 설명
}

export interface RiskFlag {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  affectedKPIs: string[];
  recommendedAction: string;
}

/**
 * 클러스터별 Critical KPI 식별
 */
export async function identifyCriticalKPIs(
  kpis: KPIDefinition[],
  cluster: ClusterInfo,
  processedData?: ProcessedKPIData[]
): Promise<CriticalKPIAnalysis> {
  try {
    // 1. 클러스터의 가중치 정보 추출
    const { kpiWeights } = await extractClusterWeights(kpis, cluster);

    // 2. Critical KPI만 필터링 및 분석
    const { critical } = groupKPIsByWeight(kpiWeights);
    const criticalKPIs = await analyzeCriticalKPIs(critical, cluster, processedData);

    // 3. 리스크 플래그 감지
    const riskFlags = detectRiskFlags(criticalKPIs, processedData);

    // 4. 클러스터 특성에 따른 Focus Area 결정
    const focusAreas = determineFocusAreas(cluster, criticalKPIs);

    // 5. 추천사항 생성
    const recommendations = generateRecommendations(cluster, criticalKPIs, riskFlags);

    return {
      cluster,
      criticalKPIs,
      riskFlags,
      focusAreas,
      recommendations
    };
  } catch (error) {
    console.error(`Failed to identify critical KPIs for cluster ${cluster.sector}-${cluster.stage}:`, error);

    // 에러 발생 시 기본값 반환
    return {
      cluster,
      criticalKPIs: [],
      riskFlags: [{
        severity: 'warning',
        title: 'Critical KPI 분석 오류',
        description: 'Critical KPI를 식별하는 중 오류가 발생했습니다.',
        affectedKPIs: [],
        recommendedAction: '시스템 관리자에게 문의하세요.'
      }],
      focusAreas: [],
      recommendations: ['데이터 확인 후 다시 시도해주세요.']
    };
  }
}

/**
 * Critical KPI 상세 분석
 */
async function analyzeCriticalKPIs(
  criticalKPIWeights: KPIWeightData[],
  cluster: ClusterInfo,
  processedData?: ProcessedKPIData[]
): Promise<CriticalKPIInfo[]> {
  const criticalKPIs: CriticalKPIInfo[] = [];

  // 우선순위 결정을 위한 축별 가중치 (비즈니스 임팩트 기준)
  const axisBusinessImpact: Record<AxisKey, number> = getAxisBusinessImpact(cluster);

  for (let i = 0; i < criticalKPIWeights.length; i++) {
    const kpiWeight = criticalKPIWeights[i];

    // 해당 KPI의 처리된 데이터 찾기
    const processedKPIData = processedData?.find(p => p.kpi.kpi_id === kpiWeight.kpiId);

    // 리스크 레벨 결정
    const riskLevel = determineRiskLevel(kpiWeight, processedKPIData, cluster);

    // 비즈니스 임팩트 결정
    const businessImpact = determineBusinessImpact(kpiWeight, cluster, axisBusinessImpact);

    // Critical한 이유 설명
    const reason = generateCriticalReason(kpiWeight, cluster);

    criticalKPIs.push({
      kpi: kpiWeight.kpiId as any, // KPIDefinition으로 변환 필요
      weight: 'x3',
      priority: i + 1, // 순서대로 우선순위 할당
      axis: kpiWeight.axis,
      riskLevel,
      businessImpact,
      reason
    });
  }

  // 비즈니스 임팩트와 축별 가중치를 고려하여 재정렬
  return criticalKPIs.sort((a, b) => {
    // 1. 비즈니스 임팩트 우선
    const impactPriority = { 'critical': 3, 'high': 2, 'medium': 1 };
    const impactDiff = impactPriority[b.businessImpact] - impactPriority[a.businessImpact];
    if (impactDiff !== 0) return impactDiff;

    // 2. 리스크 레벨 고려
    const riskPriority = { 'high': 3, 'medium': 2, 'low': 1 };
    const riskDiff = riskPriority[b.riskLevel] - riskPriority[a.riskLevel];
    if (riskDiff !== 0) return riskDiff;

    // 3. 축별 가중치
    return axisBusinessImpact[b.axis] - axisBusinessImpact[a.axis];
  }).map((kpi, index) => ({ ...kpi, priority: index + 1 }));
}

/**
 * 클러스터별 축의 비즈니스 임팩트 가중치 결정
 */
function getAxisBusinessImpact(cluster: ClusterInfo): Record<AxisKey, number> {
  const { sector, stage } = cluster;

  // 기본 가중치
  let weights: Record<AxisKey, number> = {
    GO: 5, EC: 4, PT: 3, PF: 2, TO: 1
  };

  // 섹터별 조정
  if (sector === 'S-1') { // B2B SaaS
    weights.PT = 5; // 제품-기술력 중요
    weights.EC = 4; // 경제성 중요
  } else if (sector === 'S-2') { // B2C 플랫폼
    weights.GO = 5; // 성장 최우선
    weights.TO = 3; // 팀 조직 상향
  } else if (sector === 'S-4') { // 핀테크
    weights.PF = 4; // 증빙 중요
    weights.EC = 5; // 경제성 최우선
  }

  // 단계별 조정
  if (stage === 'A-1' || stage === 'A-2') { // 초기 단계
    weights.PT = weights.PT + 1; // 제품 검증 중요
    weights.PF = Math.max(1, weights.PF - 1); // 증빙은 상대적으로 덜 중요
  } else if (stage === 'A-4' || stage === 'A-5') { // 후기 단계
    weights.EC = weights.EC + 1; // 경제성 중요
    weights.TO = weights.TO + 2; // 조직 중요
  }

  return weights;
}

/**
 * 리스크 레벨 결정
 */
function determineRiskLevel(
  kpiWeight: KPIWeightData,
  processedData?: ProcessedKPIData,
  cluster?: ClusterInfo
): 'low' | 'medium' | 'high' {
  // 처리된 데이터가 있으면 실제 값 기반으로 판단
  if (processedData) {
    const insights = processedData.insights;
    return insights.riskLevel;
  }

  // 데이터가 없으면 KPI 특성과 클러스터 기반으로 추정
  const kpiName = kpiWeight.kpiName.toLowerCase();

  // 위험도가 높은 KPI 패턴들
  if (kpiName.includes('이탈') || kpiName.includes('churn') ||
      kpiName.includes('런웨이') || kpiName.includes('runway') ||
      kpiName.includes('현금') || kpiName.includes('cash')) {
    return 'high';
  }

  // 중간 위험도 KPI 패턴들
  if (kpiName.includes('성장') || kpiName.includes('growth') ||
      kpiName.includes('전환') || kpiName.includes('conversion') ||
      kpiName.includes('수익') || kpiName.includes('revenue')) {
    return 'medium';
  }

  return 'low';
}

/**
 * 비즈니스 임팩트 결정
 */
function determineBusinessImpact(
  kpiWeight: KPIWeightData,
  cluster: ClusterInfo,
  axisBusinessImpact: Record<AxisKey, number>
): 'critical' | 'high' | 'medium' {
  const axisWeight = axisBusinessImpact[kpiWeight.axis];

  // 축 가중치와 KPI 특성을 종합하여 판단
  if (axisWeight >= 5) {
    return 'critical';
  } else if (axisWeight >= 3) {
    return 'high';
  } else {
    return 'medium';
  }
}

/**
 * Critical한 이유 설명 생성
 */
function generateCriticalReason(kpiWeight: KPIWeightData, cluster: ClusterInfo): string {
  const sectorNames = {
    'S-1': 'B2B SaaS',
    'S-2': 'B2C 플랫폼',
    'S-3': '이커머스',
    'S-4': '핀테크',
    'S-5': '헬스케어'
  };

  const stageNames = {
    'A-1': '아이디어 단계',
    'A-2': '창업초기 단계',
    'A-3': 'PMF 검증 단계',
    'A-4': 'Pre-A 단계',
    'A-5': 'Series A+ 단계'
  };

  const sectorName = sectorNames[cluster.sector as keyof typeof sectorNames] || cluster.sector;
  const stageName = stageNames[cluster.stage as keyof typeof stageNames] || cluster.stage;

  // 축별 설명
  const axisReasons = {
    GO: '성장 동력과 시장 견인력을 나타내는 핵심 지표',
    EC: '지속가능한 수익 모델의 건전성을 보여주는 필수 지표',
    PT: '제품 경쟁력과 기술적 차별화를 증명하는 중요 지표',
    PF: '시장 검증과 딜레디 준비 상태를 나타내는 지표',
    TO: '확장 가능한 조직 역량과 실행력을 보여주는 지표'
  };

  return `${sectorName} ${stageName}에서 ${axisReasons[kpiWeight.axis]}입니다.`;
}

/**
 * 리스크 플래그 감지
 */
function detectRiskFlags(
  criticalKPIs: CriticalKPIInfo[],
  processedData?: ProcessedKPIData[]
): RiskFlag[] {
  const flags: RiskFlag[] = [];

  // 1. 고위험 Critical KPI 체크
  const highRiskCriticalKPIs = criticalKPIs.filter(kpi => kpi.riskLevel === 'high');
  if (highRiskCriticalKPIs.length > 0) {
    flags.push({
      severity: 'critical',
      title: '긴급 개선 필요 지표 발견',
      description: `${highRiskCriticalKPIs.length}개의 핵심 지표에서 높은 리스크가 감지되었습니다.`,
      affectedKPIs: highRiskCriticalKPIs.map(k => k.kpi.kpi_id || ''),
      recommendedAction: '즉시 개선 계획을 수립하고 실행하세요.'
    });
  }

  // 2. Critical KPI 개수 체크
  if (criticalKPIs.length === 0) {
    flags.push({
      severity: 'warning',
      title: 'Critical KPI 데이터 부족',
      description: '해당 클러스터에서 Critical KPI가 식별되지 않았습니다.',
      affectedKPIs: [],
      recommendedAction: 'KPI 진단을 완료하거나 데이터를 확인하세요.'
    });
  } else if (criticalKPIs.length > 8) {
    flags.push({
      severity: 'info',
      title: '많은 수의 Critical KPI',
      description: `${criticalKPIs.length}개의 핵심 지표가 있습니다. 우선순위를 명확히 하세요.`,
      affectedKPIs: criticalKPIs.map(k => k.kpi.kpi_id || ''),
      recommendedAction: '가장 중요한 3-5개 지표에 집중하세요.'
    });
  }

  // 3. 축별 불균형 체크
  const axisDistribution = criticalKPIs.reduce((acc, kpi) => {
    acc[kpi.axis] = (acc[kpi.axis] || 0) + 1;
    return acc;
  }, {} as Record<AxisKey, number>);

  const dominantAxis = Object.entries(axisDistribution).find(([_, count]) =>
    count > criticalKPIs.length * 0.6
  );

  if (dominantAxis) {
    flags.push({
      severity: 'warning',
      title: `${dominantAxis[0]} 축 집중`,
      description: `Critical KPI가 ${dominantAxis[0]} 축에 과도하게 집중되어 있습니다.`,
      affectedKPIs: criticalKPIs.filter(k => k.axis === dominantAxis[0]).map(k => k.kpi.kpi_id || ''),
      recommendedAction: '다른 영역의 균형도 함께 고려하세요.'
    });
  }

  return flags;
}

/**
 * Focus Area 결정
 */
function determineFocusAreas(cluster: ClusterInfo, criticalKPIs: CriticalKPIInfo[]): FocusArea[] {
  const focusAreas: FocusArea[] = [];

  // 단계별 기본 Focus Area
  switch (cluster.stage) {
    case 'A-1':
    case 'A-2':
      focusAreas.push('product_market_fit', 'business_model_validation');
      break;
    case 'A-3':
      focusAreas.push('product_market_fit', 'unit_economics', 'user_acquisition');
      break;
    case 'A-4':
      focusAreas.push('scaling_readiness', 'team_building', 'fundraising_prep');
      break;
    case 'A-5':
      focusAreas.push('scaling_readiness', 'team_building');
      break;
  }

  // Critical KPI의 축 분포에 따른 추가 Focus Area
  const axisCount = criticalKPIs.reduce((acc, kpi) => {
    acc[kpi.axis] = (acc[kpi.axis] || 0) + 1;
    return acc;
  }, {} as Record<AxisKey, number>);

  if (axisCount.GO >= 2) focusAreas.push('user_acquisition');
  if (axisCount.EC >= 2) focusAreas.push('unit_economics');
  if (axisCount.PT >= 2) focusAreas.push('technology_validation');
  if (axisCount.TO >= 2) focusAreas.push('team_building');

  // 중복 제거
  return [...new Set(focusAreas)];
}

/**
 * 추천사항 생성
 */
function generateRecommendations(
  cluster: ClusterInfo,
  criticalKPIs: CriticalKPIInfo[],
  riskFlags: RiskFlag[]
): string[] {
  const recommendations: string[] = [];

  // 1. 우선순위 기반 추천
  const topPriority = criticalKPIs.filter(kpi => kpi.priority <= 3);
  if (topPriority.length > 0) {
    recommendations.push(`먼저 상위 ${topPriority.length}개 핵심 지표(${topPriority.map(k => k.kpi.name).join(', ')})에 집중하세요.`);
  }

  // 2. 리스크 기반 추천
  const criticalFlags = riskFlags.filter(flag => flag.severity === 'critical');
  if (criticalFlags.length > 0) {
    recommendations.push('긴급한 개선이 필요한 지표들이 있습니다. 즉시 대응 계획을 수립하세요.');
  }

  // 3. 단계별 추천
  switch (cluster.stage) {
    case 'A-3':
      recommendations.push('PMF 검증에 집중하면서 단위 경제학을 개선하세요.');
      break;
    case 'A-4':
      recommendations.push('확장 가능한 비즈니스 모델을 구축하고 팀을 확대하세요.');
      break;
  }

  // 4. 기본 추천사항
  recommendations.push('정기적으로 KPI를 모니터링하고 벤치마크와 비교하세요.');

  return recommendations;
}

/**
 * 디버그용 함수들
 */
if (import.meta.env.DEV) {
  (window as any).debugCriticalKPIs = {
    identifyCriticalKPIs,
    getAxisBusinessImpact,
    detectRiskFlags,
    determineFocusAreas
  };
}