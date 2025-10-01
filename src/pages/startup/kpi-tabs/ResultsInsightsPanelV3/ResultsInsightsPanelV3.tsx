/**
 * ResultsInsightsPanelV3 Component
 * 메인 V3 레포트 컨테이너 컴포넌트
 */

import React, { useState, useMemo, useCallback, lazy, Suspense, useEffect, Profiler } from 'react';
import { FileDown, RefreshCw, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useKPIDiagnosis } from '@/contexts/KPIDiagnosisContext';
import { getClaudeAIService } from '@/services/ai/claudeAIService';
import { dataAnalysisEngine } from '@/services/analysis/DataAnalysisEngine';

// 레이아웃 컴포넌트들
import { ReportHeader } from './components/layout/ReportHeader';
import { ReportFooter } from './components/layout/ReportFooter';
import { ReportSection } from './components/layout/ReportSection';

// Phase 4: Compact Layout (조건부 사용)
import { CompactLayout } from './components/compact/CompactLayout';

// 인사이트 컴포넌트들 - Lazy Loading
const ExecutiveSummary = lazy(() => import('./components/insights/ExecutiveSummary').then(m => ({ default: m.ExecutiveSummary })));
const KeyInsights = lazy(() => import('./components/insights/KeyInsights').then(m => ({ default: m.KeyInsights })));
const CorrelationInsightsSection = lazy(() => import('./components/shared/CorrelationInsightsSection').then(m => ({ default: m.CorrelationInsightsSection })));
const RiskAlertsSection = lazy(() => import('./components/shared/RiskAlertsSection').then(m => ({ default: m.RiskAlertsSection })));

// KPI 카드 컴포넌트들
const CriticalKPISection = lazy(() => import('./components/kpi-cards/CriticalKPISection').then(m => ({ default: m.CriticalKPISection })));
const ImportantKPISection = lazy(() => import('./components/kpi-cards/ImportantKPISection').then(m => ({ default: m.ImportantKPISection })));
const KPISummaryTable = lazy(() => import('./components/kpi-cards/KPISummaryTable').then(m => ({ default: m.KPISummaryTable })));
const BenchmarkingSection = lazy(() => import('./components/kpi-cards/BenchmarkingSection').then(m => ({ default: m.BenchmarkingSection })));
const ActionPlanSection = lazy(() => import('./components/kpi-cards/ActionPlanSection').then(m => ({ default: m.ActionPlanSection })));

// 레이더 컴포넌트들 - Lazy Loading
const RadarOverview = lazy(() => import('./components/radar/RadarOverview').then(m => ({ default: m.RadarOverview })));

// 모달 컴포넌트들 - Lazy Loading
const AxisDetailModal = lazy(() => import('./components/modal/AxisDetailModal').then(m => ({ default: m.AxisDetailModal })));

// 공유 컴포넌트들
import { LoadingState, LoadingHeader, LoadingCard } from './components/shared/LoadingState';
import { SectionConnector } from './components/shared/SectionConnector';

// 훅
import { useReportData } from './hooks/useReportDataV2'; // 개선된 V2 사용

// 유틸리티
import { generateAllAxisSummary } from '@/utils/axisDetailGenerator';
import { getPerformanceMonitor, DebugPanel } from '@/utils/performanceMonitorV3';

// 스타일
import './styles/reportV3.css';

// 타입
import type { ContactInfo } from './types/reportV3UI.types';
import type { AxisKey } from '@/types';

const ResultsInsightsPanelV3: React.FC = () => {
  // Phase 4: Feature Flag - Compact Layout 사용 여부
  const useCompactLayout = import.meta.env.VITE_USE_COMPACT_LAYOUT === 'true';

  const performanceMonitor = useMemo(() => getPerformanceMonitor(), []);
  const claudeAI = useMemo(() => getClaudeAIService(), []);

  const [isExportMode, setIsExportMode] = useState(false);
  const [selectedAxis, setSelectedAxis] = useState<AxisKey | null>(null);
  const [aiExecutiveSummary, setAiExecutiveSummary] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{
    correlations: any[];
    risks: any[];
  }>({ correlations: [], risks: [] });
  const { reportData, isLoading, error, regenerateReport, exportToPDF, processedData } = useReportData();

  // KPIDiagnosisContext에서 직접 데이터 가져오기 (fallback용)
  const { axisScores: contextAxisScores, overallScore: contextOverallScore, progress: contextProgress, kpis: contextKPIs } = useKPIDiagnosis();

  // 디버그: Context 데이터 로깅 비활성화 (너무 많은 로그 출력 방지)
  // useEffect(() => {
  //   console.log('🔍 V3 Context Data:', {
  //     axisScores: contextAxisScores,
  //     overallScore: contextOverallScore,
  //     progress: contextProgress,
  //     kpisCount: contextKPIs?.length
  //   });
  // }, [contextAxisScores, contextOverallScore, contextProgress, contextKPIs]);

  // 연락처 정보 (설정에서 가져오거나 하드코딩)
  const contactInfo: ContactInfo = useMemo(() => ({
    website: 'https://pocketbiz.co.kr',
    email: 'support@pocketbiz.co.kr',
    support: '평일 9:00-18:00'
  }), []);

  // Default report data for fallback (실제 Context 데이터 사용)
  const defaultReportData = useMemo(() => {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const axisNames = {
      'GO': 'Go-to-Market',
      'EC': 'Economics',
      'PT': 'Product & Tech',
      'PF': 'Performance',
      'TO': 'Team & Org'
    };

    // Context에서 가져온 실제 축별 점수 사용
    const defaultScores: Record<AxisKey, number> = {
      'GO': contextAxisScores?.GO || 0,
      'EC': contextAxisScores?.EC || 0,
      'PT': contextAxisScores?.PT || 0,
      'PF': contextAxisScores?.PF || 0,
      'TO': contextAxisScores?.TO || 0
    };

    // 레이더 차트 메인 데이터
    const mainData = axes.map(axis => ({
      axis: axisNames[axis],
      axisKey: axis,
      value: defaultScores[axis],
      fullMark: 100,
      status: defaultScores[axis] >= 80 ? 'excellent' as const :
              defaultScores[axis] >= 60 ? 'good' as const :
              defaultScores[axis] >= 40 ? 'fair' as const : 'needs_attention' as const,
      weight: 'x2' as const
    }));

    // 비교 데이터 (피어 평균)
    const comparisonData = axes.map(axis => ({
      axis: axisNames[axis],
      axisKey: axis,
      value: defaultScores[axis] + (Math.random() - 0.5) * 10,
      fullMark: 100
    }));

    // 상위 10% 데이터
    const thirdData = axes.map(axis => ({
      axis: axisNames[axis],
      axisKey: axis,
      value: defaultScores[axis] + 15,
      fullMark: 100
    }));

    // 축별 상세 정보
    const axisDetails: Record<AxisKey, any> = {} as Record<AxisKey, any>;
    axes.forEach(axis => {
      axisDetails[axis] = {
        score: defaultScores[axis],
        previousScore: defaultScores[axis] - 5,
        peerAverage: defaultScores[axis] + (Math.random() - 0.5) * 10,
        topPerformers: defaultScores[axis] + 15,
        weight: 'x2' as const,
        keyKPIs: [`${axisNames[axis]} 주요 지표 1`, `${axisNames[axis]} 주요 지표 2`],
        insight: `${axisNames[axis]} 영역의 기본 인사이트`,
        trend: defaultScores[axis] >= 70 ? 'up' as const : 'stable' as const,
        trendValue: 5
      };
    });

    // 실제 overallScore 계산
    const calculatedOverallScore = contextOverallScore || 0;

    // totalKPIs: contextKPIs가 없으면 axisScores 개수의 5배로 추정 (축당 평균 KPI 수)
    const totalKPIs = contextKPIs?.length || (contextAxisScores ? Object.keys(contextAxisScores).length * 4 : 0);

    // completionRate: progress 객체에서 가져오기 (여러 가능한 필드명 시도)
    const completionRate = contextProgress?.completionPercentage ||
                          contextProgress?.percentage ||
                          contextProgress?.completionRate ||
                          (calculatedOverallScore > 0 ? 100 : 0); // 점수가 있으면 100%로 간주

    const completedCount = contextProgress?.completedCount ||
                          contextProgress?.completed ||
                          (completionRate > 0 ? Math.ceil(totalKPIs * completionRate / 100) : 0);

    return {
      metadata: {
        generatedAt: new Date(),
        version: 'v3' as const,
        cluster: {
          sector: 'S-1' as const,
          stage: 'A-1' as const
        },
        companyName: '스타트업',
        totalKPIs
      },
      summary: {
        overallScore: calculatedOverallScore,
        status: calculatedOverallScore >= 80 ? 'excellent' as const :
                calculatedOverallScore >= 60 ? 'good' as const :
                calculatedOverallScore >= 40 ? 'fair' as const : 'needs_improvement' as const,
        completionRate,
        criticalKPIs: Math.ceil(totalKPIs * 0.25)
      },
      radarData: {
        mainData,
        comparisonData,
        thirdData,
        axisDetails,
        riskHighlights: ['TO', 'PF'] as AxisKey[],
        achievementBadges: ['PT'] as AxisKey[],
        annotations: [
          {
            axis: 'TO' as AxisKey,
            message: '조직 운영 개선 필요',
            type: 'warning' as const,
            position: 'inner' as const
          }
        ]
      },
      quickHighlights: [
        `전체 ${calculatedOverallScore.toFixed(0)}점으로 ${calculatedOverallScore >= 70 ? '양호한' : calculatedOverallScore >= 50 ? '보통' : '개선이 필요한'} 수준입니다.`,
        ...Object.entries(defaultScores)
          .filter(([_, score]) => score >= 60)
          .slice(0, 1)
          .map(([axis, score]) => `${axisNames[axis as AxisKey]} 영역에서 ${score >= 70 ? '특히 강한' : '양호한'} 성과를 보입니다.`),
        ...Object.entries(defaultScores)
          .filter(([_, score]) => score < 50)
          .slice(0, 1)
          .map(([axis]) => `${axisNames[axis as AxisKey]} 영역에서 즉시 개선이 필요합니다.`)
      ],
      insights: [
        ...Object.entries(defaultScores)
          .filter(([_, score]) => score >= 70)
          .map(([axis, score]) => ({
            title: `${axisNames[axis as AxisKey]} 영역 강점`,
            description: `${axisNames[axis as AxisKey]} 영역에서 ${score.toFixed(0)}점으로 우수한 성과를 보이고 있습니다.`,
            priority: 'medium' as const,
            category: 'strength' as const,
            affectedKPIs: []
          })),
        ...Object.entries(defaultScores)
          .filter(([_, score]) => score < 50)
          .map(([axis, score]) => ({
            title: `${axisNames[axis as AxisKey]} 영역 집중 개선`,
            description: `${axisNames[axis as AxisKey]} 영역에서 ${score.toFixed(0)}점으로 집중적인 개선이 필요합니다.`,
            priority: 'high' as const,
            category: 'weakness' as const,
            affectedKPIs: []
          })),
        {
          title: '아이디어 검증 단계 포커스',
          description: '시장 검증과 고객 발견에 집중해야 하는 단계입니다.',
          priority: 'medium' as const,
          category: 'opportunity' as const,
          affectedKPIs: []
        }
      ].slice(0, 5), // 최대 5개
      criticalAlerts: Object.entries(defaultScores)
        .filter(([_, score]) => score < 40)
        .map(([axis]) => `${axisNames[axis as AxisKey]} 영역에 집중이 필요합니다.`)
    };
  }, [contextAxisScores, contextOverallScore, contextProgress, contextKPIs]);

  // reportData가 있어도 비어있으면(overallScore === 0) defaultReportData 사용
  const actualReportData = (reportData && reportData.summary?.overallScore > 0)
    ? reportData
    : defaultReportData;

  // 디버그: actualReportData 확인 비활성화 (너무 많은 로그 출력 방지)
  // useEffect(() => {
  //   console.log('📊 V3 actualReportData:', {
  //     hasReportData: !!reportData,
  //     usingDefault: !reportData,
  //     overallScore: actualReportData.summary.overallScore,
  //     completionRate: actualReportData.summary.completionRate,
  //     totalKPIs: actualReportData.metadata.totalKPIs,
  //     hasRadarData: !!actualReportData.radarData,
  //     radarMainDataLength: actualReportData.radarData?.mainData?.length
  //   });
  // }, [reportData, actualReportData]);

  // AI Executive Summary 생성 (Claude API 직접 호출)
  useEffect(() => {
    // AI 사용 가능하고, 실제 데이터가 있을 때만 생성
    if (!claudeAI.isAvailable() || !actualReportData || actualReportData.summary.overallScore === 0) {
      return;
    }

    // 이미 생성 중이거나 생성된 경우 스킵
    if (isGeneratingAI || aiExecutiveSummary) {
      return;
    }

    const generateAISummary = async () => {
      setIsGeneratingAI(true);

      try {
        // 프론트엔드에서 직접 Claude API 호출
        const summary = await claudeAI.generateExecutiveSummary({
          cluster: {
            sector: actualReportData.metadata.cluster?.sector || 'tech',
            stage: actualReportData.metadata.cluster?.stage || 'seed'
          },
          overallScore: actualReportData.summary.overallScore,
          axisScores: {
            'GO': contextAxisScores?.GO || 0,
            'EC': contextAxisScores?.EC || 0,
            'PT': contextAxisScores?.PT || 0,
            'PF': contextAxisScores?.PF || 0,
            'TO': contextAxisScores?.TO || 0
          },
          completionRate: actualReportData.summary.completionRate,
          totalKPIs: actualReportData.metadata.totalKPIs || 20
        });

        setAiExecutiveSummary(summary);

        // 로그 비활성화 (너무 많은 로그 출력 방지)
        // if (import.meta.env.DEV) {
        //   console.log('✅ AI Executive Summary generated via Claude API');
        // }
      } catch (error) {
        // 로그 비활성화 (너무 많은 로그 출력 방지)
        // if (import.meta.env.DEV) {
        //   console.info('ℹ️ Using fallback summary (Claude API unavailable)', error);
        // }
        // Fallback은 claudeAIService 내부에서 처리됨
      } finally {
        setIsGeneratingAI(false);
      }
    };

    generateAISummary();
  }, [actualReportData, claudeAI, contextAxisScores, isGeneratingAI, aiExecutiveSummary]);

  // Phase 2C: 데이터 분석 실행 (상관관계 & 리스크 탐지)
  useEffect(() => {
    if (!processedData || processedData.length === 0 || !actualReportData) {
      return;
    }

    try {
      const results = dataAnalysisEngine.analyze(processedData, {
        clusterKey: `${actualReportData.metadata.cluster?.sector || 'S-1'}-${actualReportData.metadata.cluster?.stage || 'A-1'}`,
        sector: actualReportData.metadata.cluster?.sector || 'S-1',
        stage: actualReportData.metadata.cluster?.stage || 'A-1',
        sectorName: actualReportData.metadata.cluster?.sectorName || 'Technology',
        stageName: actualReportData.metadata.cluster?.stageName || 'Seed',
        criticalKPIs: processedData.filter(d => d.weight.level === 'x3').map(d => d.kpi.kpi_id),
        importantKPIs: processedData.filter(d => d.weight.level === 'x2').map(d => d.kpi.kpi_id),
        focusAreas: [],
        benchmarkGroup: '',
        nextStageRequirements: []
      });

      setAnalysisResults({
        correlations: results.correlations,
        risks: results.risks
      });

      if (import.meta.env.DEV) {
        console.log('📊 Data Analysis Complete:', {
          correlations: results.correlations.length,
          risks: results.risks.length
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ Data Analysis Error:', error);
      }
    }
  }, [processedData, actualReportData]);

  // Memoized callbacks
  const handleExport = useCallback(async () => {
    setIsExportMode(true);
    await exportToPDF();
    setIsExportMode(false);
  }, [exportToPDF]);

  const handleGenerateAISummary = useCallback(async () => {
    if (!actualReportData) {
      return;
    }

    setIsGeneratingAI(true);

    try {
      const summary = await claudeAI.generateExecutiveSummary({
        cluster: {
          sector: actualReportData.metadata.cluster?.sector || 'tech',
          stage: actualReportData.metadata.cluster?.stage || 'seed'
        },
        overallScore: actualReportData.summary.overallScore,
        axisScores: {
          'GO': contextAxisScores?.GO || 0,
          'EC': contextAxisScores?.EC || 0,
          'PT': contextAxisScores?.PT || 0,
          'PF': contextAxisScores?.PF || 0,
          'TO': contextAxisScores?.TO || 0
        },
        completionRate: actualReportData.summary.completionRate,
        totalKPIs: actualReportData.metadata.totalKPIs || 20
      });

      setAiExecutiveSummary(summary);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ AI Summary generation failed:', error);
      }
    } finally {
      setIsGeneratingAI(false);
    }
  }, [actualReportData, claudeAI, contextAxisScores]);

  const handleRefresh = useCallback(async () => {
    await regenerateReport();
  }, [regenerateReport]);

  const handleAxisClick = useCallback((axis: AxisKey) => {
    setSelectedAxis(axis);
  }, []);

  const handleModalClose = useCallback(() => {
    setSelectedAxis(null);
  }, []);

  // 다음 단계 액션 아이템 생성 (메모이제이션)
  const generateNextSteps = useMemo(() => {
    if (!actualReportData) return [];

    const { summary } = actualReportData;
    const steps: string[] = [];

    // 점수 기반 권장사항
    if (summary.overallScore < 50) {
      steps.push('핵심 지표 개선을 위한 긴급 액션 플랜 수립');
      steps.push('월간 단위 정기 진단 및 모니터링 체계 구축');
      steps.push('외부 전문가 컨설팅 검토');
    } else if (summary.overallScore < 70) {
      steps.push('약점 영역 집중 개선 계획 수립');
      steps.push('분기별 정기 진단으로 개선 효과 측정');
      steps.push('팀 내 KPI 관리 프로세스 정립');
    } else {
      steps.push('현재 수준 유지를 위한 정기 모니터링');
      steps.push('우수 영역을 활용한 추가 성장 기회 탐색');
      steps.push('벤치마킹 자료로 활용하여 업계 리더십 강화');
    }

    return steps;
  }, [actualReportData]);

  // 에러 상태 - 더 상세한 디버그 정보 포함
  if (error) {
    return (
      <div className="report-v3">
        <div className="report-container">
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="report-heading-3 mb-2 text-red-600">
              레포트 생성 오류
            </h3>
            <p className="report-body text-red-500 mb-4 max-w-md">
              {error}
            </p>
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                디버그 정보 보기
              </summary>
              <div className="mt-2 p-4 bg-gray-50 rounded text-xs font-mono">
                <div>Error: {error}</div>
                <div>Loading: {isLoading.toString()}</div>
                <div>Report Data: {actualReportData ? '있음' : '없음'}</div>
              </div>
            </details>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Duplicate removed - defaultReportData is already defined above

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="report-v3">
        <div className="report-container">
          {/* 헤더 스켈레톤 */}
          <LoadingHeader className="report-header" />

          {/* 섹션들 스켈레톤 */}
          <div className="p-8 space-y-6">
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </div>

          {/* 로딩 메시지 */}
          <div className="p-8">
            <LoadingState
              type="spinner"
              message="KPI 진단 결과를 분석하여 레포트를 생성하고 있습니다..."
            />
          </div>
        </div>
      </div>
    );
  }

  // 축별 요약 데이터 생성 (메모이제이션) - contextAxisScores 직접 사용
  const axisData = useMemo(() => {
    // 로그 비활성화 (너무 많은 로그 출력 방지)
    // console.log('🎯 Generating axisData:', {
    //   hasProcessedData: !!processedData,
    //   processedDataLength: processedData?.length,
    //   contextAxisScores
    // });

    // processedData가 없으면 contextAxisScores에서 직접 생성
    if (!processedData || processedData.length === 0) {
      if (!contextAxisScores) return null;

      // contextAxisScores를 axisData 형태로 변환
      const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
      const axisNames = {
        'GO': 'Go-to-Market',
        'EC': 'Economics',
        'PT': 'Product & Tech',
        'PF': 'Performance',
        'TO': 'Team & Org'
      };

      return axes.map(axisKey => ({
        key: axisKey,
        name: axisNames[axisKey],
        score: contextAxisScores[axisKey] || 0,
        maxScore: 100,
        percentage: contextAxisScores[axisKey] || 0,
        status: (contextAxisScores[axisKey] || 0) >= 70 ? 'good' as const :
                (contextAxisScores[axisKey] || 0) >= 50 ? 'fair' as const : 'poor' as const,
        trend: 'stable' as const
      }));
    }

    return generateAllAxisSummary(processedData);
  }, [processedData, contextAxisScores]);

  // Remove duplicate handler - already defined above as handleAxisClick

  // 성능 모니터링
  useEffect(() => {
    performanceMonitor.startMeasure('v3_mount');
    return () => {
      performanceMonitor.endMeasure('v3_mount');
      if (process.env.NODE_ENV === 'development') {
        performanceMonitor.printReport();
      }
    };
  }, [performanceMonitor]);

  // Phase 4: Compact Layout 조건부 렌더링
  if (useCompactLayout) {
    return (
      <Profiler
        id="ResultsInsightsPanelV3-Compact"
        onRender={(id, phase, actualDuration, baseDuration, startTime, commitTime) => {
          performanceMonitor.onRenderCallback(id, phase, actualDuration, baseDuration, startTime, commitTime);
        }}
      >
        <div className="report-v3-wrapper">
          {/* 상단 컨트롤 바 (PDF 출력 등) */}
          <div className="flex items-center justify-between mb-4 p-4 bg-white border border-gray-200 rounded-lg">
            <div>
              <h2 className="text-lg font-bold text-gray-900">KPI 진단 레포트 V3</h2>
              <p className="text-sm text-gray-600">Compact Layout (Phase 4)</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                <span className="text-sm">새로고침</span>
              </button>
              <button
                onClick={exportToPDF}
                disabled={!reportData || isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                <FileDown size={16} />
                <span className="text-sm">PDF 출력</span>
              </button>
            </div>
          </div>

          {/* Compact Layout */}
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <div className="p-8 bg-red-50 border border-red-200 rounded-lg text-center">
              <p className="text-red-800 font-semibold mb-2">오류 발생</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : reportData && processedData ? (
            <CompactLayout
              reportData={reportData}
              processedData={processedData}
              cluster={{
                sector: reportData.metadata.cluster?.sector || 'tech',
                stage: reportData.metadata.cluster?.stage || 'seed'
              }}
              aiSummary={aiExecutiveSummary}
              isGeneratingAI={isGeneratingAI}
              onRegenerateAI={handleGenerateAISummary}
            />
          ) : (
            <div className="p-8 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <p className="text-gray-600">진단 데이터가 없습니다.</p>
              <p className="text-sm text-gray-500 mt-2">KPI 진단을 먼저 완료해주세요.</p>
            </div>
          )}
        </div>
      </Profiler>
    );
  }

  // 기존 레이아웃 (Feature Flag = false)
  return (
    <Profiler
      id="ResultsInsightsPanelV3"
      onRender={(id, phase, actualDuration, baseDuration, startTime, commitTime) => {
        performanceMonitor.onRenderCallback(id, phase, actualDuration, baseDuration, startTime, commitTime);
      }}
    >
      <div className={`report-v3 ${isExportMode ? 'print-mode export-mode' : ''}`}>
      <div className={`report-container ${isExportMode ? 'export-mode' : ''}`}>
        {/* 헤더 */}
        <ReportHeader
          metadata={actualReportData.metadata}
          summary={actualReportData.summary}
          isExportMode={isExportMode}
        />

        {/* Executive Summary 섹션 */}
        <ReportSection
          title="Executive Summary"
          subtitle="경영진을 위한 핵심 요약"
          className="mb-8"
        >
          <Suspense fallback={<LoadingCard />}>
            <ExecutiveSummary
              metadata={actualReportData.metadata}
              summary={actualReportData.summary}
              quickHighlights={actualReportData.quickHighlights || []}
              criticalAlerts={actualReportData.criticalAlerts || []}
              aiGeneratedSummary={aiExecutiveSummary}
              isGeneratingAI={isGeneratingAI}
            />
          </Suspense>
        </ReportSection>

        {/* Phase 3: Section Connector */}
        <SectionConnector type="summary-to-risks" />

        {/* Phase 2C: 리스크 알림 섹션 */}
        {analysisResults.risks.length > 0 && (
          <Suspense fallback={<LoadingCard />}>
            <RiskAlertsSection alerts={analysisResults.risks} />
          </Suspense>
        )}

        {/* Phase 3: Section Connector */}
        {analysisResults.risks.length > 0 && <SectionConnector type="risks-to-correlations" />}

        {/* Phase 2C: 상관관계 인사이트 섹션 */}
        {analysisResults.correlations.length > 0 && (
          <Suspense fallback={<LoadingCard />}>
            <CorrelationInsightsSection insights={analysisResults.correlations} />
          </Suspense>
        )}

        {/* Phase 3: Section Connector */}
        <SectionConnector type="correlations-to-critical" />

        {/* Critical KPI 섹션 - 실제 진단 데이터 기반 */}
        {processedData && processedData.length > 0 && (
          <ReportSection
            title="Critical Metrics Details"
            subtitle="핵심 지표 상세 분석 (x3 가중치)"
            className="mb-8"
          >
            <Suspense fallback={<LoadingCard />}>
              <CriticalKPISection
                processedData={processedData}
                cluster={{
                  sector: actualReportData.metadata.cluster?.sector || 'tech',
                  stage: actualReportData.metadata.cluster?.stage || 'seed'
                }}
              />
            </Suspense>
          </ReportSection>
        )}

        {/* Phase 3: Section Connector */}
        <SectionConnector type="critical-to-important" />

        {/* Important KPI 섹션 */}
        {processedData && processedData.length > 0 && (
          <ReportSection
            title="Important Metrics Details"
            subtitle="주요 관리 지표 상세 분석 (x2 가중치)"
            className="mb-8"
          >
            <Suspense fallback={<LoadingCard />}>
              <ImportantKPISection
                processedData={processedData}
                cluster={{
                  sector: actualReportData.metadata.cluster?.sector || 'tech',
                  stage: actualReportData.metadata.cluster?.stage || 'seed'
                }}
              />
            </Suspense>
          </ReportSection>
        )}

        {/* Phase 3: Section Connector */}
        <SectionConnector type="important-to-standard" />

        {/* Standard KPI 섹션 - 테이블 형식 */}
        {processedData && processedData.length > 0 && (
          <ReportSection
            title="Standard Metrics Summary"
            subtitle="기본 관리 지표 요약 (x1 가중치)"
            className="mb-8"
          >
            <Suspense fallback={<LoadingCard />}>
              <KPISummaryTable
                processedData={processedData}
                cluster={{
                  sector: actualReportData.metadata.cluster?.sector || 'tech',
                  stage: actualReportData.metadata.cluster?.stage || 'seed'
                }}
              />
            </Suspense>
          </ReportSection>
        )}

        {/* Phase 3: Section Connector */}
        <SectionConnector type="standard-to-benchmarking" />

        {/* 벤치마킹 분석 섹션 */}
        {processedData && processedData.length > 0 && (
          <ReportSection
            title="Benchmarking Analysis"
            subtitle="업계 평균 대비 경쟁력 분석"
            className="mb-8"
          >
            <Suspense fallback={<LoadingCard />}>
              <BenchmarkingSection
                processedData={processedData}
                cluster={{
                  sector: actualReportData.metadata.cluster?.sector || 'tech',
                  stage: actualReportData.metadata.cluster?.stage || 'seed'
                }}
                overallScore={actualReportData.summary.overallScore}
              />
            </Suspense>
          </ReportSection>
        )}

        {/* Phase 3: Section Connector */}
        <SectionConnector type="benchmarking-to-action" />

        {/* Action Plan 섹션 */}
        {processedData && processedData.length > 0 && (
          <ReportSection
            title="Prioritized Action Plan"
            subtitle="진단 기반 우선순위별 실행 계획"
            className="mb-8"
          >
            <Suspense fallback={<LoadingCard />}>
              <ActionPlanSection
                processedData={processedData}
                cluster={{
                  sector: actualReportData.metadata.cluster?.sector || 'tech',
                  stage: actualReportData.metadata.cluster?.stage || 'seed'
                }}
                overallScore={actualReportData.summary.overallScore}
              />
            </Suspense>
          </ReportSection>
        )}

        {/* Phase 3: Section Connector */}
        <SectionConnector type="action-to-radar" />

        {/* Phase 3: 5축 레이더 & 영역별 성과 종합 */}
        <ReportSection
          title="5축 균형 분석 & 영역별 성과"
          subtitle="비즈니스 핵심 영역별 종합 평가"
          className="mb-8"
        >
          <div className="p-6 space-y-6 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-6">빠른 참조</h2>

          {/* 상단: 핵심 요약 + 전체 점수 */}
          <div className="grid grid-cols-3 gap-6">
            {/* 좌측: 전체 점수 및 상태 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border">
              <div className="text-center">
                <div className="text-4xl font-bold text-indigo-600 mb-2">
                  {actualReportData.summary.overallScore.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600 mb-4">전체 KPI 점수</div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  actualReportData.summary.overallScore >= 80 ? 'bg-green-100 text-green-800' :
                  actualReportData.summary.overallScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {actualReportData.summary.overallScore >= 80 ? '우수' :
                   actualReportData.summary.overallScore >= 60 ? '양호' : '개선필요'}
                </div>
              </div>
            </div>

            {/* 중앙: 핵심 메트릭스 */}
            <div className="bg-white p-6 rounded-xl border">
              <h3 className="font-semibold text-gray-800 mb-4">핵심 지표</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">진단 완료</span>
                  <span className="font-semibold">{actualReportData.summary.totalKPIs}개</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">핵심 지표</span>
                  <span className="font-semibold">{actualReportData.summary.criticalKPIs}개</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">완료율</span>
                  <span className="font-semibold text-green-600">{actualReportData.summary.completionRate}%</span>
                </div>
              </div>
            </div>

            {/* 우측: 상태 요약 */}
            <div className="bg-white p-6 rounded-xl border">
              <h3 className="font-semibold text-gray-800 mb-4">즉시 액션</h3>
              <div className="space-y-2">
                {actualReportData.criticalAlerts && actualReportData.criticalAlerts.slice(0, 3).map((alert, index) => (
                  <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {alert}
                  </div>
                ))}
                {(!actualReportData.criticalAlerts || actualReportData.criticalAlerts.length === 0) && (
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                    긴급 이슈 없음
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 중단: 레이더 차트 + 축별 상세 */}
          <div className="grid grid-cols-2 gap-6">
            {/* 좌측: 레이더 차트 */}
            <div className="bg-white p-6 rounded-xl border">
              <h3 className="font-semibold text-gray-800 mb-4">5축 균형 분석</h3>
              {actualReportData?.radarData ? (
                <Suspense fallback={<LoadingCard />}>
                  <RadarOverview
                    radarData={actualReportData.radarData}
                    showComparison={false}
                    enableInteraction={!isExportMode}
                    isExportMode={isExportMode}
                    compact={true}
                  />
                </Suspense>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">먼저 "진단하기" 탭에서</p>
                  <p className="text-sm text-gray-600">KPI 진단을 완료해주세요</p>
                </div>
              )}
            </div>

            {/* 우측: 축별 점수 표 */}
            <div className="bg-white p-6 rounded-xl border">
              <h3 className="font-semibold text-gray-800 mb-4">영역별 성과</h3>
              <div className="space-y-3">
                {axisData ? (
                  axisData.map((axis) => (
                    <div
                      key={axis.key}
                      className="group cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors"
                      onClick={() => handleAxisSelect(axis.key)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">{axis.name}</span>
                              {axis.trend && (
                                <span className="text-xs">
                                  {axis.trend === 'up' ? (
                                    <TrendingUp className="w-3 h-3 text-green-500" />
                                  ) : axis.trend === 'down' ? (
                                    <TrendingDown className="w-3 h-3 text-red-500" />
                                  ) : (
                                    <Minus className="w-3 h-3 text-gray-400" />
                                  )}
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                ({axis.completedKPIs}/{axis.totalKPIs})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">
                                {axis.score.toFixed(1)}
                              </span>
                              <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                axis.status === 'excellent' ? 'bg-green-500' :
                                axis.status === 'good' ? 'bg-blue-500' :
                                axis.status === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${axis.score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  // 폴백: processedData가 없을 때
                  ['GO', 'EC', 'PT', 'PF', 'TO'].map((key) => (
                    <div key={key} className="flex items-center justify-between opacity-50">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-500">
                            {key === 'GO' ? 'Go-to-Market' :
                             key === 'EC' ? 'Economics' :
                             key === 'PT' ? 'Product & Tech' :
                             key === 'PF' ? 'Performance' : 'Team & Org'}
                          </span>
                          <span className="text-sm text-gray-400">-</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gray-300 rounded-full" style={{ width: '0%' }} />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          </div>
        </ReportSection>

        {/* 푸터 */}
        <ReportFooter
          nextSteps={generateNextSteps}
          generatedAt={actualReportData.metadata.generatedAt}
          isExportMode={isExportMode}
          contactInfo={contactInfo}
        />

        {/* 플로팅 액션 버튼들 (출력 모드가 아닐 때만) */}
        {!isExportMode && (
          <div className="fixed bottom-6 right-6 flex flex-col gap-3">
            <button
              onClick={exportToPDF}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              title="PDF로 내보내기"
            >
              <FileDown size={18} />
              <span className="hidden sm:inline">PDF 출력</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg shadow-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              title="레포트 새로고침"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">새로고침</span>
            </button>
          </div>
        )}

        {/* 축별 상세 분석 모달 */}
        {selectedAxis && (
          <Suspense fallback={<LoadingState />}>
            <AxisDetailModal
              isOpen={selectedAxis !== null}
              axis={selectedAxis}
              processedData={processedData || []}
              onClose={() => setSelectedAxis(null)}
            />
          </Suspense>
        )}
      </div>

      {/* 디버그 패널 (개발 모드) */}
      {process.env.NODE_ENV === 'development' && (
        <DebugPanel show={!isExportMode} />
      )}
    </div>
    </Profiler>
  );
};
export { ResultsInsightsPanelV3 };
