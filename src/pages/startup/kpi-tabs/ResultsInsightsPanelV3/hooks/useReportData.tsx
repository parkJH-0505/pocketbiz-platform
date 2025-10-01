/**
 * useReportData Hook
 * V3 레포트 데이터 처리 및 상태 관리
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  ReportData,
  UseReportDataReturn,
  ReportSummary
} from '../types/reportV3UI.types';
import type {
  ClusterInfo,
  ProcessedKPIData,
  GeneratedInsight,
  AxisKey
} from '@/types/reportV3.types';
import type { ClusterInsightResult } from '@/utils/basicInsightGenerator';
import type {
  RadarEnhancedData,
  RadarDataPoint,
  AxisRadarDetail
} from '../types/reportV3UI.types';

// 우리가 구축한 데이터 처리 레이어 import
import { processMultipleKPIs } from '@/utils/reportDataProcessor';
import { generateClusterInsights } from '@/utils/basicInsightGenerator';
import { ReportDataPipeline, PipelineStage, type PipelineState } from '@/utils/reportDataPipeline';

// 기존 컨텍스트들
import { useKPIDiagnosis } from '@/contexts/KPIDiagnosisContext';
import { useCluster } from '@/contexts/ClusterContext';

// 핵심 하이라이트 생성 함수
const generateQuickHighlights = (
  clusterInsights: ClusterInsightResult,
  summary: ReportSummary
): string[] => {
  const highlights: string[] = [];

  // 1. 전체 성과 평가
  if (summary.overallScore >= 80) {
    highlights.push(`전체 ${summary.overallScore.toFixed(1)}점으로 우수한 성과를 달성했습니다.`);
  } else if (summary.overallScore >= 60) {
    highlights.push(`전체 ${summary.overallScore.toFixed(1)}점으로 양호한 수준을 유지하고 있습니다.`);
  } else {
    highlights.push(`전체 ${summary.overallScore.toFixed(1)}점으로 집중적인 개선이 필요합니다.`);
  }

  // 2. 최고 성과 축
  const axisEntries = Object.entries(clusterInsights.axisInsights);
  const bestAxis = axisEntries.reduce((best, current) =>
    current[1].score > best[1].score ? current : best
  );

  if (bestAxis[1].score >= 70) {
    const axisNames = {
      'GO': '고객 확보',
      'EC': '수익 구조',
      'PT': '제품 기술',
      'PF': '운영 성과',
      'TO': '조직 운영'
    };
    highlights.push(`${axisNames[bestAxis[0] as keyof typeof axisNames]} 영역에서 특히 강한 성과를 보입니다.`);
  }

  // 3. 핵심 개선 영역
  const criticalInsights = clusterInsights.priorityInsights.filter(insight =>
    insight.priority === 'high' && insight.category === 'weakness'
  );

  if (criticalInsights.length > 0) {
    highlights.push(`${criticalInsights.length}개 핵심 영역에서 즉시 개선이 필요합니다.`);
  } else if (clusterInsights.priorityInsights.some(insight => insight.category === 'opportunity')) {
    highlights.push('새로운 성장 기회를 발견했습니다.');
  }

  // 4. 완료율 관련
  if (summary.completionRate >= 95) {
    highlights.push('모든 주요 지표의 진단이 완료되어 신뢰도가 높습니다.');
  } else if (summary.completionRate < 80) {
    highlights.push(`진단 완료율 ${summary.completionRate.toFixed(1)}%로 추가 데이터 입력이 권장됩니다.`);
  }

  return highlights.slice(0, 4); // 최대 4개까지
};

// 레이더 차트 데이터 생성 함수
const generateRadarData = async (
  processedKPIs: ProcessedKPIData[],
  clusterInsights: ClusterInsightResult,
  axisScores: Record<string, number> | undefined
): Promise<RadarEnhancedData> => {
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

  // 메인 레이더 데이터 생성
  const mainData: RadarDataPoint[] = axes.map(axis => {
    const axisInsight = clusterInsights.axisInsights[axis];
    const score = axisInsight?.score || axisScores?.[axis] || 0;

    return {
      axis: getAxisName(axis),
      axisKey: axis,
      value: score,
      fullMark: 100,
      status: score >= 80 ? 'excellent' :
              score >= 60 ? 'good' :
              score >= 40 ? 'fair' : 'needs_attention',
      weight: 'x2' // 기본값, 실제로는 KPI 데이터에서 계산해야 함
    };
  });

  // 비교 데이터 생성 (피어 평균 - 임시 데이터)
  const comparisonData: RadarDataPoint[] = axes.map(axis => ({
    axis: getAxisName(axis),
    axisKey: axis,
    value: Math.max(0, (axisScores?.[axis] || 0) + (Math.random() - 0.5) * 20), // 임시 피어 데이터
    fullMark: 100
  }));

  // 상위 10% 데이터 생성 (임시 데이터)
  const thirdData: RadarDataPoint[] = axes.map(axis => ({
    axis: getAxisName(axis),
    axisKey: axis,
    value: Math.max(0, (axisScores?.[axis] || 0) + 15 + Math.random() * 10), // 상위 성과자
    fullMark: 100
  }));

  // 축별 상세 정보 생성
  const axisDetails: Record<AxisKey, AxisRadarDetail> = {} as Record<AxisKey, AxisRadarDetail>;

  axes.forEach(axis => {
    const axisInsight = clusterInsights.axisInsights[axis];
    const score = axisInsight?.score || axisScores?.[axis] || 0;
    const previousScore = score - (Math.random() - 0.5) * 10; // 임시 이전 점수

    axisDetails[axis] = {
      score,
      previousScore,
      peerAverage: comparisonData.find(d => d.axisKey === axis)?.value,
      topPerformers: thirdData.find(d => d.axisKey === axis)?.value,
      weight: 'x2', // 기본값
      keyKPIs: processedKPIs
        .filter(kpi => kpi.kpi.axis === axis)
        .slice(0, 3)
        .map(kpi => kpi.kpi.name),
      insight: axisInsight?.summary || `${getAxisName(axis)} 영역 분석 결과`,
      trend: score > previousScore ? 'up' : score < previousScore ? 'down' : 'stable',
      trendValue: score - previousScore
    };
  });

  // 위험 영역 식별
  const riskHighlights = axes.filter(axis => {
    const score = axisScores?.[axis] || 0;
    return score < 40 || clusterInsights.axisInsights[axis]?.status === 'needs_attention';
  });

  // 성취 영역 식별
  const achievementBadges = axes.filter(axis => {
    const score = axisScores?.[axis] || 0;
    return score >= 80;
  });

  // 주석 생성
  const annotations = riskHighlights.map(axis => ({
    axis,
    message: `즉시 개선이 필요한 영역입니다.`,
    type: 'warning' as const,
    position: 'inner' as const
  }));

  return {
    mainData,
    comparisonData,
    thirdData,
    annotations,
    riskHighlights,
    achievementBadges,
    axisDetails
  };
};

// 축 이름 매핑 함수
const getAxisName = (axis: AxisKey): string => {
  switch (axis) {
    case 'GO':
      return 'Go-to-Market';
    case 'EC':
      return 'Economics';
    case 'PT':
      return 'Product & Tech';
    case 'PF':
      return 'Performance';
    case 'TO':
      return 'Team & Org';
    default:
      return axis;
  }
};

// KPI 정의가 없을 때 기본 ProcessedKPIData 생성 함수
const createBasicProcessedKPIs = (
  responses: Record<string, any>,
  axisScores: Record<string, number>,
  clusterInfo: ClusterInfo
): ProcessedKPIData[] => {
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
  const processedKPIs: ProcessedKPIData[] = [];

  axes.forEach(axis => {
    const axisScore = axisScores[axis] || 0;

    // 각 축당 기본 KPI 생성 (실제 응답 데이터 기반)
    const axisResponses = Object.entries(responses).filter(([kpiId]) =>
      kpiId.includes(axis) // KPI ID에 축 코드가 포함되어 있다고 가정
    );

    // 축당 최소 1개의 KPI는 생성
    if (axisResponses.length === 0) {
      axisResponses.push([`${axis}-DEFAULT`, { value: axisScore }]);
    }

    axisResponses.forEach(([kpiId, response], index) => {
      const basicKPI: ProcessedKPIData = {
        kpi: {
          id: kpiId,
          name: `${getAxisName(axis)} KPI ${index + 1}`,
          axis,
          question: `${getAxisName(axis)} 관련 평가 항목`,
          inputType: 'NUMERIC' as const,
          responseFormat: 'number' as const,
          stage: clusterInfo.stage,
          weight: 'x2' as const,
          order: index + 1
        },
        response: {
          kpiId,
          value: response.value || axisScore,
          timestamp: new Date().toISOString()
        },
        weight: {
          level: 'x2' as const,
          priority: 2,
          emphasis: 'important' as const,
          sectionSize: 'medium' as const,
          visualizationType: 'standard' as const
        },
        processedValue: {
          type: 'numeric',
          rawValue: response.value || axisScore,
          normalizedScore: axisScore,
          percentile: axisScore,
          benchmark: {
            peerAverage: axisScore + Math.random() * 10 - 5,
            industryStandard: axisScore + Math.random() * 20 - 10,
            topPerformers: axisScore + Math.random() * 15 + 5
          }
        },
        insights: {
          summary: `${getAxisName(axis)} 영역에서 ${axisScore.toFixed(1)}점을 기록했습니다.`,
          strengths: axisScore >= 60 ? [`${getAxisName(axis)} 영역의 양호한 성과`] : [],
          weaknesses: axisScore < 50 ? [`${getAxisName(axis)} 영역의 개선 필요`] : [],
          opportunities: [`${getAxisName(axis)} 영역의 추가 성장 가능성`],
          risks: axisScore < 40 ? [`${getAxisName(axis)} 영역의 위험 요소`] : [],
          actionItems: [`${getAxisName(axis)} 영역 개선 계획 수립`],
          confidence: 0.7
        }
      };

      processedKPIs.push(basicKPI);
    });
  });

  return processedKPIs;
};

export const useReportData = (): UseReportDataReturn => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [localProcessedData, setLocalProcessedData] = useState<ProcessedKPIData[]>([]);

  // 기존 컨텍스트에서 데이터 가져오기
  const { cluster } = useCluster();
  const {
    kpis,
    responses,
    axisScores,
    overallScore,
    progress
  } = useKPIDiagnosis();

  // 클러스터 정보 가공
  const clusterInfo: ClusterInfo = useMemo(() => ({
    sector: cluster?.sector || 'S-1',
    stage: cluster?.stage || 'A-1'
  }), [cluster]);

  // 기본 메타데이터 생성
  const metadata = useMemo(() => ({
    generatedAt: new Date(),
    cluster: clusterInfo,
    totalKPIs: kpis?.length || 0,
    version: 'v3' as const,
    // TODO: 회사명은 사용자 입력이나 설정에서 가져오기
    companyName: undefined
  }), [clusterInfo, kpis]);

  // 요약 데이터 생성
  const summary = useMemo(() => {
    // 상태 결정 로직
    const getStatus = (score: number): 'excellent' | 'good' | 'fair' | 'needs_improvement' => {
      if (score >= 85) return 'excellent';
      if (score >= 70) return 'good';
      if (score >= 50) return 'fair';
      return 'needs_improvement';
    };

    // 핵심 KPI 수 계산 (가중치 x3인 KPI들)
    const criticalKPIs = kpis?.filter(kpi => {
      // TODO: 실제 가중치 정보를 가져와서 계산
      // 지금은 임시로 축별 중요도로 추정
      return ['GO', 'EC'].includes(kpi.axis); // GO, EC는 일반적으로 중요
    }).length || 0;

    return {
      overallScore: overallScore || 0,
      status: getStatus(overallScore || 0),
      completionRate: progress?.completionPercentage || 0,
      criticalKPIs
    };
  }, [overallScore, progress, kpis]);

  // 레포트 데이터 생성 함수
  const generateReportData = useCallback(async (): Promise<ReportData> => {
    if (!responses || Object.keys(responses).length === 0) {
      throw new Error('진단 데이터가 없습니다. 먼저 KPI 진단을 완료해 주세요.');
    }

    if (!axisScores) {
      throw new Error('축별 점수 데이터가 없습니다. 진단 데이터를 확인해 주세요.');
    }

    try {
      setError(null);

      // Step 1: KPI 응답 데이터 처리
      console.log('📊 Processing KPI responses...');
      let processedKPIs: ProcessedKPIData[] = [];

      if (kpis && kpis.length > 0) {
        // KPI 정의가 있는 경우: 완전한 처리
        processedKPIs = await processMultipleKPIs(kpis, responses, clusterInfo);
        console.log(`✅ Processed ${processedKPIs.length} KPIs with full definitions`);
      } else {
        // KPI 정의가 없는 경우: 기본 구조로 생성
        console.log('⚠️ No KPI definitions found, creating basic structure from responses');
        processedKPIs = createBasicProcessedKPIs(responses, axisScores, clusterInfo);
        console.log(`✅ Created ${processedKPIs.length} basic KPI entries`);
      }

      // 로컬 상태에 저장 (축별 상세 분석용)
      setLocalProcessedData(processedKPIs);

      // Step 2: 클러스터 인사이트 생성
      console.log('🔍 Generating cluster insights...');
      const clusterInsights = await generateClusterInsights(processedKPIs, clusterInfo);

      // Step 3: 핵심 하이라이트 생성
      const quickHighlights = generateQuickHighlights(clusterInsights, summary);

      // Step 4: 레이더 차트 데이터 생성
      console.log('📊 Generating radar chart data...');
      const radarData = await generateRadarData(processedKPIs, clusterInsights, axisScores);

      // Step 5: 기본 레포트 데이터 구성
      const reportData: ReportData = {
        metadata,
        summary,
        insights: clusterInsights.priorityInsights,
        radarData,
        axisDetails: undefined, // 필요시 추후 구현
        // 추가 데이터
        quickHighlights,
        criticalAlerts: clusterInsights.criticalAlerts
      };

      console.log('📋 Report data generated successfully');
      return reportData;

    } catch (err) {
      console.error('❌ Failed to generate report data:', err);
      throw new Error(err instanceof Error ? err.message : '레포트 생성 중 오류가 발생했습니다.');
    }
  }, [kpis, responses, clusterInfo, metadata, summary]);

  // 레포트 재생성
  const regenerateReport = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const newReportData = await generateReportData();
      setReportData(newReportData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('Report generation failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [generateReportData]);

  // PDF 출력 (Step 2.4에서 구현 예정)
  const exportToPDF = useCallback(async (): Promise<void> => {
    if (!reportData) {
      throw new Error('출력할 레포트 데이터가 없습니다.');
    }

    try {
      // TODO: PDF 출력 로직 구현
      console.log('📄 PDF export will be implemented in Step 2.4');
      alert('PDF 출력 기능은 곧 구현될 예정입니다.');
    } catch (err) {
      console.error('PDF export failed:', err);
      throw err;
    }
  }, [reportData]);

  // 초기 데이터 로딩
  useEffect(() => {
    // 필요한 데이터가 모두 준비되었을 때만 레포트 생성
    // KPI 정의가 없어도 responses와 axisScores가 있으면 레포트 생성 가능
    if (responses && Object.keys(responses).length > 0 && axisScores && !reportData && !isLoading) {
      regenerateReport();
    }
  }, [responses, axisScores, regenerateReport, reportData, isLoading]);

  // 디버그 정보 (개발 모드에서만)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔧 useReportData Debug Info:', {
        hasKPIs: !!kpis,
        kpisCount: kpis?.length || 0,
        hasResponses: !!responses,
        responsesCount: Object.keys(responses || {}).length,
        hasReportData: !!reportData,
        isLoading,
        error,
        cluster: clusterInfo
      });
    }
  }, [kpis, responses, reportData, isLoading, error, clusterInfo]);

  return {
    reportData,
    processedData: localProcessedData, // 축별 상세 분석을 위한 processedData 제공
    isLoading,
    error,
    regenerateReport,
    exportToPDF
  };
};