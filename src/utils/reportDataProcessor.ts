/**
 * Report V3 데이터 처리 유틸리티
 * KPI 진단 원시 데이터를 레포트 형태로 가공하는 핵심 로직
 */

import type {
  KPIDefinition,
  KPIResponse,
  AxisKey,
  ClusterInfo
} from '../types';
import type {
  ProcessedKPIData,
  ProcessedValue,
  NumericProcessedValue,
  RubricProcessedValue,
  MultiSelectProcessedValue,
  CalculationProcessedValue,
  WeightInfo,
  WeightLevel,
  SECTOR_NAMES,
  STAGE_NAMES
} from '../types/reportV3.types';
import { getKPIStageRule } from '../data/kpiLoader';
import {
  calculateKPIScore,
  getScoreStatus,
  calculateWeightedScore,
  validateScore
} from './scoreCalculator';
import { getClusterKnowledge } from '../services/knowledge/clusterKnowledge';
import { compareToBenchmark } from '../services/knowledge/benchmarkDatabase';
import type { BenchmarkData } from '../services/knowledge/clusterKnowledge';

// 가중치 정보 매핑
export const WEIGHT_CONFIG: Record<WeightLevel, WeightInfo> = {
  'x3': {
    level: 'x3',
    priority: 1,
    emphasis: 'critical',
    sectionSize: 'large',
    visualizationType: 'detailed'
  },
  'x2': {
    level: 'x2',
    priority: 2,
    emphasis: 'important',
    sectionSize: 'medium',
    visualizationType: 'standard'
  },
  'x1': {
    level: 'x1',
    priority: 3,
    emphasis: 'normal',
    sectionSize: 'small',
    visualizationType: 'minimal'
  }
};

/**
 * KPI 응답을 처리된 데이터로 변환
 */
export async function processKPIData(
  kpi: KPIDefinition,
  response: KPIResponse,
  cluster: ClusterInfo
): Promise<ProcessedKPIData> {
  try {
    // 1. 가중치 정보 가져오기
    const weight = await getKPIWeight(kpi.kpi_id, cluster.stage);

    // 2. 응답값 처리
    const processedValue = await processKPIValue(kpi, response, cluster);

    // 3. 기본 인사이트 생성
    const insights = await generateBasicKPIInsight(kpi, processedValue, weight, cluster);

    // 4. 벤치마크 정보 추출 (NumericProcessedValue에서)
    let benchmarkInfo = undefined;
    if (processedValue.type === 'numeric') {
      const numericValue = processedValue as NumericProcessedValue;
      if (numericValue.benchmark) {
        benchmarkInfo = {
          industryAverage: numericValue.benchmark.industryAverage,
          topQuartile: numericValue.benchmark.topQuartile,
          bottomQuartile: numericValue.benchmark.bottomQuartile,
          source: numericValue.benchmark.source,
          lastUpdated: numericValue.benchmark.lastUpdated
        };
      }
    }

    return {
      kpi,
      response,
      weight,
      processedValue,
      insights,
      benchmarkInfo
    };
  } catch (error) {
    console.error(`Failed to process KPI ${kpi.kpi_id}:`, error);

    // 에러 발생 시 기본값 반환
    return {
      kpi,
      response,
      weight: WEIGHT_CONFIG['x1'],
      processedValue: {
        type: 'numeric',
        rawValue: 0,
        displayValue: 'N/A'
      } as NumericProcessedValue,
      insights: {
        summary: '데이터 처리 중 오류가 발생했습니다.',
        interpretation: '이 지표의 데이터를 확인해 주세요.',
        riskLevel: 'medium',
        aiGenerated: false
      }
    };
  }
}

/**
 * KPI 가중치 정보 가져오기
 */
export async function getKPIWeight(kpiId: string, stage: string): Promise<WeightInfo> {
  try {
    const stageRule = await getKPIStageRule(kpiId, stage);
    const weightLevel = stageRule?.weight || 'x1';
    return WEIGHT_CONFIG[weightLevel as WeightLevel] || WEIGHT_CONFIG['x1'];
  } catch (error) {
    console.warn(`Failed to get weight for KPI ${kpiId}:`, error);
    return WEIGHT_CONFIG['x1'];
  }
}

/**
 * KPI 응답값을 타입별로 처리
 */
async function processKPIValue(
  kpi: KPIDefinition,
  response: KPIResponse,
  cluster: ClusterInfo
): Promise<ProcessedValue> {

  switch (kpi.input_type) {
    case 'Numeric':
      return processNumericValue(kpi, response, cluster);

    case 'Rubric':
      return processRubricValue(kpi, response, cluster);

    case 'MultiSelect':
    case 'Checklist':
      return processMultiSelectValue(kpi, response, cluster);

    case 'Calculation':
      return processCalculationValue(kpi, response, cluster);

    default:
      console.warn(`Unknown input type: ${kpi.input_type} for KPI ${kpi.kpi_id}`);
      return {
        type: 'numeric',
        rawValue: 0,
        displayValue: 'Unknown'
      } as NumericProcessedValue;
  }
}

/**
 * 숫자형 값 처리
 */
async function processNumericValue(
  kpi: KPIDefinition,
  response: KPIResponse,
  cluster: ClusterInfo
): Promise<NumericProcessedValue> {
  const rawValue = typeof response.value === 'number' ? response.value : 0;

  // 단위 결정
  const unit = determineUnit(kpi, rawValue);

  // 표시 값 포맷팅
  const displayValue = formatNumericValue(rawValue, unit);

  // 벤치마크 정보 (임시 구현)
  const benchmark = await getBenchmarkData(kpi, cluster);

  return {
    type: 'numeric',
    rawValue,
    displayValue,
    unit,
    benchmark
  };
}

/**
 * 루브릭 값 처리
 */
async function processRubricValue(
  kpi: KPIDefinition,
  response: KPIResponse,
  cluster: ClusterInfo
): Promise<RubricProcessedValue> {
  try {
    const stageRule = await getKPIStageRule(kpi.kpi_id, cluster.stage);
    const selectedIndex = (response as any).selectedIndex || 0;

    if (!stageRule?.choices || !stageRule.choices[selectedIndex]) {
      throw new Error(`Invalid choice index: ${selectedIndex}`);
    }

    const selectedChoice = stageRule.choices[selectedIndex];

    // 점수 기반 레벨 결정
    const level = determineLevel(selectedChoice.score);

    // 해석 텍스트 생성
    const interpretation = generateRubricInterpretation(selectedChoice, kpi, cluster);

    return {
      type: 'rubric',
      selectedIndex,
      selectedChoice: {
        index: selectedIndex,
        label: selectedChoice.label,
        score: selectedChoice.score
      },
      level,
      interpretation
    };
  } catch (error) {
    console.error(`Failed to process rubric value for ${kpi.kpi_id}:`, error);

    return {
      type: 'rubric',
      selectedIndex: 0,
      selectedChoice: { index: 0, label: '데이터 없음', score: 0 },
      level: 'needs_improvement',
      interpretation: '루브릭 데이터를 확인해 주세요.'
    };
  }
}

/**
 * 다중선택 값 처리
 */
async function processMultiSelectValue(
  kpi: KPIDefinition,
  response: KPIResponse,
  cluster: ClusterInfo
): Promise<MultiSelectProcessedValue> {
  try {
    const stageRule = await getKPIStageRule(kpi.kpi_id, cluster.stage);
    const selectedIndices = (response as any).selectedIndices || [];

    if (!stageRule?.choices) {
      throw new Error('No choices available for MultiSelect KPI');
    }

    const selectedChoices = selectedIndices.map((index: number) => ({
      index,
      label: stageRule.choices[index]?.label || '알 수 없음',
      score: stageRule.choices[index]?.score || 0,
      weight: stageRule.choices[index]?.weight
    }));

    const totalScore = selectedChoices.reduce((sum, choice) => sum + choice.score, 0);

    // 강점과 부족한 부분 분석
    const strengths = selectedChoices
      .filter(choice => choice.score > 75)
      .map(choice => choice.label);

    const allChoices = stageRule.choices.map((choice, index) => ({ ...choice, index }));
    const gaps = allChoices
      .filter(choice => !selectedIndices.includes(choice.index) && choice.score > 75)
      .map(choice => choice.label);

    return {
      type: 'multiselect',
      selectedIndices,
      selectedChoices,
      strengths,
      gaps,
      totalScore
    };
  } catch (error) {
    console.error(`Failed to process MultiSelect value for ${kpi.kpi_id}:`, error);

    return {
      type: 'multiselect',
      selectedIndices: [],
      selectedChoices: [],
      strengths: [],
      gaps: [],
      totalScore: 0
    };
  }
}

/**
 * 계산형 값 처리
 */
async function processCalculationValue(
  kpi: KPIDefinition,
  response: KPIResponse,
  cluster: ClusterInfo
): Promise<CalculationProcessedValue> {
  const responseData = response as any;
  const calculatedValue = responseData.calculatedValue || 0;
  const inputs = responseData.inputs || {};

  // 단위 및 포맷 결정
  const unit = determineCalculationUnit(kpi);
  const displayValue = formatCalculationValue(calculatedValue, unit);

  return {
    type: 'calculation',
    calculatedValue,
    displayValue,
    inputs,
    formula: kpi.formula || '',
    unit
  };
}

/**
 * 유틸리티 함수들
 */

function determineUnit(kpi: KPIDefinition, value: number): string {
  const name = kpi.name.toLowerCase();

  if (name.includes('매출') || name.includes('수익') || name.includes('비용')) {
    return value >= 100000000 ? '억원' : value >= 10000 ? '만원' : '원';
  }
  if (name.includes('률') || name.includes('비율') || name.includes('전환')) {
    return '%';
  }
  if (name.includes('수') || name.includes('명')) {
    return '명';
  }
  if (name.includes('개월') || name.includes('기간')) {
    return '개월';
  }

  return '';
}

function formatNumericValue(value: number, unit: string): string {
  if (unit === '억원') {
    return `${(value / 100000000).toFixed(1)}억원`;
  }
  if (unit === '만원') {
    return `${(value / 10000).toFixed(0)}만원`;
  }
  if (unit === '%') {
    return `${(value * 100).toFixed(1)}%`;
  }

  return `${value.toLocaleString()}${unit}`;
}

function determineLevel(score: number): 'excellent' | 'good' | 'fair' | 'needs_improvement' {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'needs_improvement';
}

function generateRubricInterpretation(choice: any, kpi: KPIDefinition, cluster: ClusterInfo): string {
  const level = determineLevel(choice.score);
  const sectorName = (cluster.sector as keyof typeof SECTOR_NAMES) in SECTOR_NAMES
    ? SECTOR_NAMES[cluster.sector as keyof typeof SECTOR_NAMES]
    : cluster.sector;
  const stageName = (cluster.stage as keyof typeof STAGE_NAMES) in STAGE_NAMES
    ? STAGE_NAMES[cluster.stage as keyof typeof STAGE_NAMES]
    : cluster.stage;

  switch (level) {
    case 'excellent':
      return `${sectorName} ${stageName} 단계에서 매우 우수한 수준입니다.`;
    case 'good':
      return `${sectorName} 업종에서 양호한 수준을 보이고 있습니다.`;
    case 'fair':
      return `${stageName} 단계 기준으로 보통 수준입니다.`;
    case 'needs_improvement':
      return `${sectorName} ${stageName} 단계에서 개선이 필요한 수준입니다.`;
    default:
      return '추가 분석이 필요합니다.';
  }
}

function determineCalculationUnit(kpi: KPIDefinition): string {
  if (kpi.name.includes('률') || kpi.name.includes('비율')) return '%';
  if (kpi.name.includes('매출') || kpi.name.includes('ARPA')) return '원';
  if (kpi.name.includes('개월')) return '개월';
  return '';
}

function formatCalculationValue(value: number, unit: string): string {
  if (unit === '%') {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (unit === '원') {
    if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억원`;
    if (value >= 10000) return `${(value / 10000).toFixed(0)}만원`;
    return `${value.toLocaleString()}원`;
  }

  return `${value.toFixed(2)}${unit}`;
}

/**
 * 클러스터별 실제 벤치마크 데이터 가져오기
 */
async function getBenchmarkData(kpi: KPIDefinition, cluster: ClusterInfo) {
  try {
    // 1. 클러스터 지식 가져오기
    const clusterKnowledge = getClusterKnowledge(cluster.sector, cluster.stage);
    if (!clusterKnowledge) {
      console.warn(`No cluster knowledge found for ${cluster.sector} - ${cluster.stage}`);
      return undefined;
    }

    // 2. KPI 카테고리 매칭 (KPI 이름/질문에서 키워드 추출)
    const kpiCategory = matchKPICategory(kpi);

    // 3. 해당 카테고리의 벤치마크 데이터 찾기
    const benchmarkData = clusterKnowledge.benchmarks[kpiCategory];
    if (!benchmarkData) {
      console.debug(`No benchmark data for category: ${kpiCategory}`);
      return undefined;
    }

    return {
      min: benchmarkData.p10,
      max: benchmarkData.p90,
      average: benchmarkData.p50,
      industryAverage: benchmarkData.p50,
      topQuartile: benchmarkData.p75,
      bottomQuartile: benchmarkData.p25,
      source: benchmarkData.source,
      lastUpdated: benchmarkData.lastUpdated
    };
  } catch (error) {
    console.error('Failed to get benchmark data:', error);
    return undefined;
  }
}

/**
 * KPI를 카테고리로 매칭
 * KPI 이름, 질문, 메타데이터를 기반으로 카테고리 추정
 */
function matchKPICategory(kpi: KPIDefinition): string {
  const searchText = `${kpi.name} ${kpi.question}`.toLowerCase();

  // 사용자/고객 관련
  if (searchText.includes('mau') || searchText.includes('활성 사용자') ||
      searchText.includes('월간 사용자')) {
    return 'mau';
  }
  if (searchText.includes('dau') || searchText.includes('일간 사용자')) {
    return 'dau_mau';
  }
  if (searchText.includes('초기 사용자') || searchText.includes('얼리') ||
      searchText.includes('early user')) {
    return 'initial_users';
  }
  if (searchText.includes('유료 고객') || searchText.includes('paying customer')) {
    return 'paying_customers';
  }
  if (searchText.includes('팀') || searchText.includes('인원') ||
      searchText.includes('team size')) {
    return 'team_size';
  }

  // 제품 개발 관련
  if (searchText.includes('mvp') || searchText.includes('개발 진행') ||
      searchText.includes('프로토타입')) {
    return 'mvp_completion';
  }

  // 매출/수익 관련
  if (searchText.includes('mrr') || searchText.includes('월 매출') ||
      searchText.includes('recurring')) {
    return 'mrr';
  }
  if (searchText.includes('gmv') || searchText.includes('거래액')) {
    return 'gmv';
  }
  if (searchText.includes('arpu') || searchText.includes('사용자당 매출')) {
    return 'arpu';
  }
  if (searchText.includes('aov') || searchText.includes('객단가') ||
      searchText.includes('평균 주문')) {
    return 'aov';
  }

  // 리텐션 관련
  if (searchText.includes('리텐션') || searchText.includes('retention')) {
    return 'retention_rate';
  }
  if (searchText.includes('재구매') || searchText.includes('repeat purchase')) {
    return 'repeat_purchase';
  }
  if (searchText.includes('nrr') || searchText.includes('net revenue retention')) {
    return 'nrr';
  }
  if (searchText.includes('churn') || searchText.includes('이탈')) {
    return 'churn_rate';
  }

  // 성장 관련
  if (searchText.includes('성장률') || searchText.includes('증가율') ||
      searchText.includes('growth rate')) {
    return 'mom_growth';
  }
  if (searchText.includes('k-factor') || searchText.includes('바이럴')) {
    return 'k_factor';
  }

  // 효율성 관련
  if (searchText.includes('cac') || searchText.includes('고객 확보 비용') ||
      searchText.includes('획득 비용')) {
    return 'cac';
  }
  if (searchText.includes('cac payback') || searchText.includes('회수 기간')) {
    return 'cac_payback';
  }
  if (searchText.includes('ltv') || searchText.includes('생애 가치')) {
    return 'ltv';
  }

  // 만족도 관련
  if (searchText.includes('nps') || searchText.includes('추천 지수')) {
    return 'nps';
  }

  // 재무 관련
  if (searchText.includes('번 레이트') || searchText.includes('burn rate') ||
      searchText.includes('소진율')) {
    return 'monthly_burn';
  }
  if (searchText.includes('런웨이') || searchText.includes('runway')) {
    return 'runway';
  }

  // 전환율
  if (searchText.includes('전환율') || searchText.includes('conversion')) {
    return 'conversion_rate';
  }

  // 매칭되지 않은 경우 기본 카테고리
  return 'general';
}

/**
 * 기본 인사이트 생성 (클러스터 지식 기반 + AI 없는 룰)
 */
async function generateBasicKPIInsight(
  kpi: KPIDefinition,
  processedValue: ProcessedValue,
  weight: WeightInfo,
  cluster: ClusterInfo
) {
  const sectorName = SECTOR_NAMES[cluster.sector as keyof typeof SECTOR_NAMES] || cluster.sector;
  const stageName = STAGE_NAMES[cluster.stage as keyof typeof STAGE_NAMES] || cluster.stage;

  let summary = '';
  let interpretation = '';
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';

  // 점수 계산 (새로운 scoreCalculator 사용)
  const score = calculateKPIScore(processedValue, kpi);
  const status = getScoreStatus(score);

  // 1. 클러스터 지식 가져오기
  const clusterKnowledge = getClusterKnowledge(cluster.sector, cluster.stage);
  const kpiCategory = matchKPICategory(kpi);

  // 2. 클러스터별 해석 규칙 사용
  if (clusterKnowledge && clusterKnowledge.interpretationRules[kpiCategory]) {
    const rule = clusterKnowledge.interpretationRules[kpiCategory];

    // Numeric 값에 대해 클러스터별 해석 적용
    if (processedValue.type === 'numeric') {
      const numericValue = (processedValue as NumericProcessedValue).rawValue;

      // 점수 기반으로 적절한 해석 선택
      if (score >= 80) {
        interpretation = rule.excellent(numericValue);
        riskLevel = 'low';
      } else if (score >= 60) {
        interpretation = rule.good(numericValue);
        riskLevel = 'low';
      } else {
        interpretation = rule.needsImprovement(numericValue);
        riskLevel = score < 40 ? 'high' : 'medium';
      }

      // 컨텍스트 정보를 summary에 추가
      summary = `${sectorName} ${stageName}: ${rule.context}`;
    }
  }

  // 3. 클러스터 지식이 없거나 매칭 실패 시 기본 로직
  if (!interpretation) {
    // 가중치에 따른 기본 평가
    if (weight.emphasis === 'critical') {
      summary = `${sectorName} ${stageName} 단계에서 핵심적인 지표입니다.`;
    } else if (weight.emphasis === 'important') {
      summary = `${stageName} 단계에서 중요하게 모니터링해야 할 지표입니다.`;
    } else {
      summary = `참고할 만한 보조 지표입니다.`;
    }

    // 데이터 타입별 해석
    switch (processedValue.type) {
      case 'rubric':
        const rubricValue = processedValue as RubricProcessedValue;
        interpretation = rubricValue.interpretation;
        riskLevel = score < 40 ? 'high' : score < 70 ? 'medium' : 'low';
        break;

      case 'numeric':
        const numericValue = processedValue as NumericProcessedValue;
        interpretation = `현재 값은 ${processedValue.displayValue}입니다.`;

        // 벤치마크와 비교하여 리스크 레벨 결정
        if (numericValue.benchmark) {
          const diff = numericValue.rawValue - numericValue.benchmark.industryAverage;
          const percentDiff = (diff / numericValue.benchmark.industryAverage) * 100;

          if (percentDiff > 20) {
            interpretation += ` 업계 평균(${numericValue.benchmark.industryAverage.toFixed(1)}) 대비 ${Math.abs(percentDiff).toFixed(0)}% 높습니다.`;
            riskLevel = 'low';
          } else if (percentDiff < -20) {
            interpretation += ` 업계 평균(${numericValue.benchmark.industryAverage.toFixed(1)}) 대비 ${Math.abs(percentDiff).toFixed(0)}% 낮습니다.`;
            riskLevel = 'high';
          } else {
            interpretation += ` 업계 평균 수준입니다.`;
            riskLevel = 'medium';
          }
        } else {
          riskLevel = 'low';
        }
        break;

      case 'multiselect':
        const multiValue = processedValue as MultiSelectProcessedValue;
        if (multiValue.strengths.length > 0) {
          interpretation = `강점: ${multiValue.strengths.join(', ')}`;
          riskLevel = 'low';
        } else {
          interpretation = '개선할 영역이 많습니다.';
          riskLevel = 'high';
        }
        break;

      case 'calculation':
        interpretation = `계산된 값은 ${processedValue.displayValue}입니다.`;
        riskLevel = 'low';
        break;
    }
  }

  return {
    summary,
    interpretation,
    riskLevel,
    aiGenerated: false
  };
}

/**
 * 다중 KPI 배치 처리
 */
export async function processMultipleKPIs(
  kpis: KPIDefinition[],
  responses: Record<string, KPIResponse>,
  cluster: ClusterInfo
): Promise<ProcessedKPIData[]> {
  const results: ProcessedKPIData[] = [];

  for (const kpi of kpis) {
    const response = responses[kpi.kpi_id];
    if (response) {
      try {
        const processedData = await processKPIData(kpi, response, cluster);
        results.push(processedData);
      } catch (error) {
        console.error(`Failed to process KPI ${kpi.kpi_id}:`, error);
        // 에러가 발생해도 계속 진행
      }
    }
  }

  return results;
}

/**
 * 디버그용 함수
 */
export function debugProcessedData(processedData: ProcessedKPIData[]) {
  if (import.meta.env.DEV) {
    console.group('🔍 Processed KPI Data Debug');
    processedData.forEach(data => {
      console.log(`${data.kpi.name} (${data.kpi.kpi_id}):`, {
        weight: data.weight.level,
        type: data.processedValue.type,
        value: 'displayValue' in data.processedValue ? data.processedValue.displayValue : 'N/A',
        insight: data.insights.summary
      });
    });
    console.groupEnd();
  }
}