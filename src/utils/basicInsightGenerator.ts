/**
 * 기본 인사이트 생성기
 * AI 없이 룰 기반으로 KPI 인사이트를 생성하는 유틸리티
 */

import type {
  KPIDefinition,
  AxisKey,
  ClusterInfo
} from '../types';
import type {
  ProcessedKPIData,
  ProcessedValue,
  RubricProcessedValue,
  MultiSelectProcessedValue,
  NumericProcessedValue,
  CalculationProcessedValue,
  WeightInfo,
  ClusterInsight,
  AxisInsight,
  InsightPriority
} from '../types/reportV3.types';

// 상수 정의 (타입이 아닌 실제 값)
const SECTOR_NAMES = {
  'S-1': '기술/소프트웨어',
  'S-2': '커머스/리테일',
  'S-3': '플랫폼/마켓플레이스',
  'S-4': '콘텐츠/미디어',
  'S-5': '헬스케어/바이오',
  'S-6': '핀테크/금융',
  'S-7': '에듀테크/교육',
  'S-8': '기타'
} as const;

const STAGE_NAMES = {
  'A-1': '아이디어',
  'A-2': '프로토타입',
  'A-3': '초기성장',
  'A-4': '성장확장',
  'A-5': '성숙안정'
} as const;
import { identifyCriticalKPIs, type CriticalKPIAnalysis } from './criticalKPIIdentifier';

export interface GeneratedInsight {
  title: string;
  description: string;
  priority: InsightPriority;
  category: 'strength' | 'weakness' | 'opportunity' | 'recommendation';
  affectedKPIs: string[];
  actionItems?: string[];
}

export interface ClusterInsightResult {
  clusterSummary: ClusterInsight;
  axisInsights: Record<AxisKey, AxisInsight>;
  priorityInsights: GeneratedInsight[];
  overallScore: number;
  criticalAlerts: string[];
}

/**
 * 클러스터 전체 인사이트 생성
 */
export async function generateClusterInsights(
  processedData: ProcessedKPIData[],
  cluster: ClusterInfo
): Promise<ClusterInsightResult> {
  const sectorName = SECTOR_NAMES[cluster.sector as keyof typeof SECTOR_NAMES] || cluster.sector;
  const stageName = STAGE_NAMES[cluster.stage as keyof typeof STAGE_NAMES] || cluster.stage;

  // 1. Critical KPI 분석
  const kpis = processedData.map(data => data.kpi);
  const criticalAnalysis = await identifyCriticalKPIs(kpis, cluster, processedData);

  // 2. 축별 인사이트 생성
  const axisInsights = generateAxisInsights(processedData);

  // 3. 전체 점수 계산
  const overallScore = calculateOverallScore(processedData);

  // 4. 우선순위 인사이트 생성
  const priorityInsights = generatePriorityInsights(processedData, criticalAnalysis, cluster);

  // 5. 클러스터 요약 생성
  const clusterSummary = generateClusterSummary(processedData, overallScore, cluster);

  // 6. Critical Alerts 생성
  const criticalAlerts = generateCriticalAlerts(criticalAnalysis, processedData);

  return {
    clusterSummary,
    axisInsights,
    priorityInsights,
    overallScore,
    criticalAlerts
  };
}

/**
 * 축별 인사이트 생성
 */
function generateAxisInsights(processedData: ProcessedKPIData[]): Record<AxisKey, AxisInsight> {
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
  const result = {} as Record<AxisKey, AxisInsight>;

  axes.forEach(axis => {
    const axisData = processedData.filter(data => data.kpi.axis === axis);

    if (axisData.length === 0) {
      result[axis] = {
        axis,
        score: 0,
        status: 'needs_attention',
        summary: '해당 영역에 진단된 지표가 없습니다.',
        keyFindings: [],
        recommendations: ['해당 영역의 지표를 진단해 보세요.']
      };
      return;
    }

    // 축별 점수 계산
    const axisScore = calculateAxisScore(axisData);

    // 상태 결정
    const status = axisScore >= 80 ? 'excellent' :
                  axisScore >= 60 ? 'good' :
                  axisScore >= 40 ? 'fair' : 'needs_attention';

    // 주요 발견사항
    const keyFindings = generateAxisKeyFindings(axisData, axis);

    // 권장사항
    const recommendations = generateAxisRecommendations(axisData, axis, status);

    // 요약
    const summary = generateAxisSummary(axis, axisScore, status, axisData.length);

    result[axis] = {
      axis,
      score: axisScore,
      status,
      summary,
      keyFindings,
      recommendations
    };
  });

  return result;
}

/**
 * 우선순위 인사이트 생성
 */
function generatePriorityInsights(
  processedData: ProcessedKPIData[],
  criticalAnalysis: CriticalKPIAnalysis,
  cluster: ClusterInfo
): GeneratedInsight[] {
  const insights: GeneratedInsight[] = [];

  // 1. Critical KPI 관련 인사이트
  if (criticalAnalysis.criticalKPIs.length > 0) {
    const criticalIssues = criticalAnalysis.criticalKPIs.filter(
      kpi => processedData.find(data => data.kpi.kpi_id === kpi.kpiId)?.insights.riskLevel === 'high'
    );

    if (criticalIssues.length > 0) {
      insights.push({
        title: '핵심 지표 개선 필요',
        description: `${criticalIssues.length}개의 핵심 지표가 개선이 필요한 상태입니다.`,
        priority: 'high',
        category: 'weakness',
        affectedKPIs: criticalIssues.map(kpi => kpi.kpiId),
        actionItems: criticalIssues.slice(0, 3).map(kpi => `${kpi.kpiName} 개선 방안 수립`)
      });
    }
  }

  // 2. 축별 강점/약점 인사이트
  const axisScores = calculateAxisScores(processedData);
  const strongestAxis = Object.entries(axisScores).reduce((a, b) => a[1] > b[1] ? a : b);
  const weakestAxis = Object.entries(axisScores).reduce((a, b) => a[1] < b[1] ? a : b);

  if (strongestAxis[1] >= 70) {
    insights.push({
      title: `${getAxisName(strongestAxis[0] as AxisKey)} 영역 강점`,
      description: `${getAxisName(strongestAxis[0] as AxisKey)} 영역에서 우수한 성과를 보이고 있습니다.`,
      priority: 'medium',
      category: 'strength',
      affectedKPIs: processedData
        .filter(data => data.kpi.axis === strongestAxis[0])
        .map(data => data.kpi.kpi_id)
    });
  }

  if (weakestAxis[1] < 50) {
    insights.push({
      title: `${getAxisName(weakestAxis[0] as AxisKey)} 영역 집중 개선`,
      description: `${getAxisName(weakestAxis[0] as AxisKey)} 영역에 집중적인 개선이 필요합니다.`,
      priority: 'high',
      category: 'recommendation',
      affectedKPIs: processedData
        .filter(data => data.kpi.axis === weakestAxis[0])
        .map(data => data.kpi.kpi_id),
      actionItems: [`${getAxisName(weakestAxis[0] as AxisKey)} 영역 개선 계획 수립`]
    });
  }

  // 3. 단계별 특화 인사이트
  const stageSpecificInsights = generateStageSpecificInsights(processedData, cluster);
  insights.push(...stageSpecificInsights);

  // 4. 섹터별 특화 인사이트
  const sectorSpecificInsights = generateSectorSpecificInsights(processedData, cluster);
  insights.push(...sectorSpecificInsights);

  // 우선순위로 정렬하고 최대 8개까지
  return insights
    .sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, 8);
}

/**
 * 클러스터 요약 생성
 */
function generateClusterSummary(
  processedData: ProcessedKPIData[],
  overallScore: number,
  cluster: ClusterInfo
): ClusterInsight {
  const sectorName = SECTOR_NAMES[cluster.sector as keyof typeof SECTOR_NAMES] || cluster.sector;
  const stageName = STAGE_NAMES[cluster.stage as keyof typeof STAGE_NAMES] || cluster.stage;

  const totalKPIs = processedData.length;
  const criticalKPIs = processedData.filter(data => data.weight.emphasis === 'critical').length;
  const highRiskKPIs = processedData.filter(data => data.insights.riskLevel === 'high').length;

  // 상태 결정
  const overallStatus = overallScore >= 80 ? 'excellent' :
                       overallScore >= 60 ? 'good' :
                       overallScore >= 40 ? 'fair' : 'needs_improvement';

  // 요약 텍스트 생성
  const summary = `${sectorName} ${stageName} 단계에서 총 ${totalKPIs}개 지표를 진단한 결과, ` +
    `전체 점수는 ${overallScore.toFixed(1)}점입니다. ` +
    (highRiskKPIs > 0
      ? `${highRiskKPIs}개 지표에서 개선이 필요합니다.`
      : '전반적으로 안정적인 상태입니다.');

  // 주요 발견사항
  const keyFindings = [
    `핵심 지표 ${criticalKPIs}개 포함, 총 ${totalKPIs}개 지표 진단 완료`,
    overallStatus === 'excellent' ? '우수한 수준의 성과 달성' :
    overallStatus === 'good' ? '양호한 수준의 성과' :
    overallStatus === 'fair' ? '보통 수준, 일부 개선 필요' :
    '전반적인 개선이 필요한 상태'
  ];

  // 고위험 지표가 있다면 추가
  if (highRiskKPIs > 0) {
    keyFindings.push(`${highRiskKPIs}개 지표에서 즉시 개선 필요`);
  }

  return {
    cluster,
    overallScore,
    status: overallStatus,
    summary,
    keyFindings,
    totalKPIs,
    criticalKPIs,
    completionRate: 100 // 진단 완료된 데이터만 처리하므로 100%
  };
}

/**
 * Critical Alerts 생성
 */
function generateCriticalAlerts(
  criticalAnalysis: CriticalKPIAnalysis,
  processedData: ProcessedKPIData[]
): string[] {
  const alerts: string[] = [];

  // 1. 핵심 지표 리스크 알림
  const criticalHighRisk = criticalAnalysis.criticalKPIs.filter(
    kpi => processedData.find(data => data.kpi.kpi_id === kpi.kpiId)?.insights.riskLevel === 'high'
  );

  if (criticalHighRisk.length > 0) {
    alerts.push(`핵심 지표 ${criticalHighRisk.length}개가 고위험 상태입니다.`);
  }

  // 2. 포커스 영역 알림
  if (criticalAnalysis.focusAreas.length > 0) {
    alerts.push(`${criticalAnalysis.focusAreas.join(', ')} 영역에 집중이 필요합니다.`);
  }

  // 3. 데이터 누락 알림
  const missingCriticalData = criticalAnalysis.criticalKPIs.filter(
    kpi => !processedData.find(data => data.kpi.kpi_id === kpi.kpiId)
  );

  if (missingCriticalData.length > 0) {
    alerts.push(`핵심 지표 ${missingCriticalData.length}개의 데이터가 누락되었습니다.`);
  }

  return alerts;
}

/**
 * 유틸리티 함수들
 */

function calculateOverallScore(processedData: ProcessedKPIData[]): number {
  if (processedData.length === 0) return 0;

  let totalWeightedScore = 0;
  let totalWeight = 0;

  processedData.forEach(data => {
    const weight = data.weight.level === 'x3' ? 3 : data.weight.level === 'x2' ? 2 : 1;
    const score = calculateKPIScore(data.processedValue);

    totalWeightedScore += score * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? (totalWeightedScore / totalWeight) : 0;
}

function calculateAxisScore(axisData: ProcessedKPIData[]): number {
  if (axisData.length === 0) return 0;

  let totalWeightedScore = 0;
  let totalWeight = 0;

  axisData.forEach(data => {
    const weight = data.weight.level === 'x3' ? 3 : data.weight.level === 'x2' ? 2 : 1;
    const score = calculateKPIScore(data.processedValue);

    totalWeightedScore += score * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? (totalWeightedScore / totalWeight) : 0;
}

function calculateAxisScores(processedData: ProcessedKPIData[]): Record<string, number> {
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
  const scores: Record<string, number> = {};

  axes.forEach(axis => {
    const axisData = processedData.filter(data => data.kpi.axis === axis);
    scores[axis] = calculateAxisScore(axisData);
  });

  return scores;
}

function calculateKPIScore(processedValue: ProcessedValue): number {
  switch (processedValue.type) {
    case 'rubric':
      const rubricValue = processedValue as RubricProcessedValue;
      return rubricValue.selectedChoice.score;

    case 'multiselect':
      const multiValue = processedValue as MultiSelectProcessedValue;
      return Math.min(multiValue.totalScore, 100);

    case 'numeric':
      // 숫자형은 벤치마크가 있을 때만 점수 계산 가능
      // 임시로 50점 반환 (실제로는 벤치마크 비교 필요)
      return 50;

    case 'calculation':
      // 계산형도 마찬가지로 벤치마크 필요
      return 50;

    default:
      return 0;
  }
}

function generateAxisKeyFindings(axisData: ProcessedKPIData[], axis: AxisKey): string[] {
  const findings: string[] = [];

  const criticalCount = axisData.filter(data => data.weight.emphasis === 'critical').length;
  const highRiskCount = axisData.filter(data => data.insights.riskLevel === 'high').length;

  if (criticalCount > 0) {
    findings.push(`핵심 지표 ${criticalCount}개 포함`);
  }

  if (highRiskCount > 0) {
    findings.push(`${highRiskCount}개 지표에서 개선 필요`);
  } else {
    findings.push('전체적으로 안정적인 상태');
  }

  return findings;
}

function generateAxisRecommendations(
  axisData: ProcessedKPIData[],
  axis: AxisKey,
  status: string
): string[] {
  const recommendations: string[] = [];

  const highRiskKPIs = axisData.filter(data => data.insights.riskLevel === 'high');

  if (highRiskKPIs.length > 0) {
    recommendations.push(`${highRiskKPIs[0].kpi.name} 우선 개선`);
    if (highRiskKPIs.length > 1) {
      recommendations.push(`추가 ${highRiskKPIs.length - 1}개 지표 검토`);
    }
  } else if (status === 'excellent') {
    recommendations.push('현재 수준 유지 및 벤치마킹 자료로 활용');
  } else {
    recommendations.push(`${getAxisName(axis)} 영역 전반적 개선 계획 수립`);
  }

  return recommendations;
}

function generateAxisSummary(axis: AxisKey, score: number, status: string, kpiCount: number): string {
  const axisName = getAxisName(axis);
  return `${axisName} 영역에서 ${kpiCount}개 지표를 진단한 결과 ${score.toFixed(1)}점을 기록했습니다.`;
}

function generateStageSpecificInsights(
  processedData: ProcessedKPIData[],
  cluster: ClusterInfo
): GeneratedInsight[] {
  const insights: GeneratedInsight[] = [];

  // 단계별 특화 조언
  switch (cluster.stage) {
    case 'A-1': // 아이디어 단계
      insights.push({
        title: '아이디어 검증 단계 포커스',
        description: '시장 검증과 고객 발견에 집중해야 하는 단계입니다.',
        priority: 'medium',
        category: 'recommendation',
        affectedKPIs: processedData.filter(data => data.kpi.axis === 'GO').map(data => data.kpi.kpi_id),
        actionItems: ['시장 조사 강화', '고객 인터뷰 확대']
      });
      break;

    case 'A-2': // 프로토타입 단계
      insights.push({
        title: 'MVP 개발 및 검증',
        description: '최소기능제품 개발과 초기 사용자 피드백 수집이 중요합니다.',
        priority: 'medium',
        category: 'recommendation',
        affectedKPIs: processedData.filter(data => data.kpi.axis === 'PT').map(data => data.kpi.kpi_id),
        actionItems: ['MVP 품질 개선', '사용자 피드백 분석']
      });
      break;

    case 'A-3': // 초기 성장
      insights.push({
        title: '초기 성장 동력 확보',
        description: '제품-시장 적합성 달성과 성장 동력 확보가 핵심입니다.',
        priority: 'high',
        category: 'opportunity',
        affectedKPIs: processedData.filter(data => ['GO', 'EC'].includes(data.kpi.axis)).map(data => data.kpi.kpi_id),
        actionItems: ['고객 확보 전략 실행', '수익 모델 최적화']
      });
      break;
  }

  return insights;
}

function generateSectorSpecificInsights(
  processedData: ProcessedKPIData[],
  cluster: ClusterInfo
): GeneratedInsight[] {
  const insights: GeneratedInsight[] = [];

  // 섹터별 특화 조언
  switch (cluster.sector) {
    case 'S-1': // 기술/소프트웨어
      insights.push({
        title: '기술 경쟁력 강화',
        description: '기술적 차별화와 개발 역량이 핵심 성공 요인입니다.',
        priority: 'medium',
        category: 'opportunity',
        affectedKPIs: processedData.filter(data => data.kpi.axis === 'PT').map(data => data.kpi.kpi_id)
      });
      break;

    case 'S-2': // 커머스/리테일
      insights.push({
        title: '고객 경험 최적화',
        description: '사용자 경험과 운영 효율성이 중요한 성공 요인입니다.',
        priority: 'medium',
        category: 'opportunity',
        affectedKPIs: processedData.filter(data => ['EC', 'PF'].includes(data.kpi.axis)).map(data => data.kpi.kpi_id)
      });
      break;
  }

  return insights;
}

function getAxisName(axis: AxisKey): string {
  const axisNames = {
    'GO': 'Go-to-Market',
    'EC': 'Economics',
    'PT': 'Product & Technology',
    'PF': 'Performance',
    'TO': 'Team & Organization'
  };
  return axisNames[axis];
}

/**
 * 개별 KPI 인사이트 생성 (기존 reportDataProcessor 보완)
 */
export function generateEnhancedKPIInsight(
  processedData: ProcessedKPIData,
  cluster: ClusterInfo
): {
  summary: string;
  interpretation: string;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  benchmarkComparison?: string;
} {
  const { kpi, processedValue, weight } = processedData;
  const sectorName = SECTOR_NAMES[cluster.sector as keyof typeof SECTOR_NAMES] || cluster.sector;
  const stageName = STAGE_NAMES[cluster.stage as keyof typeof STAGE_NAMES] || cluster.stage;

  // 기본 인사이트에 추가 컨텍스트 제공
  let summary = processedData.insights.summary;
  let interpretation = processedData.insights.interpretation;
  let riskLevel = processedData.insights.riskLevel;

  const recommendations: string[] = [];

  // 가중치 기반 권장사항
  if (weight.emphasis === 'critical' && riskLevel === 'high') {
    recommendations.push('즉시 개선 계획 수립 필요');
    recommendations.push('주간 단위 모니터링 권장');
  } else if (weight.emphasis === 'important' && riskLevel !== 'low') {
    recommendations.push('개선 방안 검토 권장');
  }

  // 타입별 구체적 권장사항
  switch (processedValue.type) {
    case 'rubric':
      const rubricValue = processedValue as RubricProcessedValue;
      if (rubricValue.level === 'needs_improvement') {
        recommendations.push('상위 단계 달성을 위한 구체적 액션 플랜 필요');
      }
      break;

    case 'multiselect':
      const multiValue = processedValue as MultiSelectProcessedValue;
      if (multiValue.gaps.length > 0) {
        recommendations.push(`다음 영역 보완 검토: ${multiValue.gaps.slice(0, 2).join(', ')}`);
      }
      break;
  }

  return {
    summary,
    interpretation,
    riskLevel,
    recommendations,
    benchmarkComparison: undefined // TODO: 벤치마크 구현 후 추가
  };
}

/**
 * 개발용 디버그 함수
 */
if (import.meta.env.DEV) {
  (window as any).debugInsights = {
    generateClusterInsights,
    generateEnhancedKPIInsight,
    calculateOverallScore
  };
}