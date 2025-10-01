/**
 * useReportData Hook V2
 * 개선된 파이프라인을 사용하는 V3 레포트 데이터 처리 및 상태 관리
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type {
  ReportData,
  UseReportDataReturn,
  ReportSummary
} from '../types/reportV3UI.types';
import type {
  ClusterInfo,
  ProcessedKPIData,
  KPIDefinition,
  KPIResponse
} from '@/types/reportV3.types';

// 새로운 파이프라인
import { ReportDataPipeline, PipelineStage, type PipelineState } from '@/utils/reportDataPipeline';
import { getOptimizedProcessor, debounce } from '@/utils/dataProcessorOptimized';

// 기존 컨텍스트들
import { useKPIDiagnosis } from '@/contexts/KPIDiagnosisContext';
import { useCluster } from '@/contexts/ClusterContext';

// PDF 출력 - modern-screenshot (oklab/oklch 지원)
import { domToPng } from 'modern-screenshot';
import jsPDF from 'jspdf';

/**
 * 개선된 useReportData 훅
 */
export function useReportData(): UseReportDataReturn {
  // 상태 관리
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedKPIData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pipelineState, setPipelineState] = useState<PipelineState | null>(null);

  // 파이프라인 인스턴스 (싱글톤)
  const pipelineRef = useRef<ReportDataPipeline | null>(null);

  // 컨텍스트에서 데이터 가져오기
  const { kpis, responses, axisScores } = useKPIDiagnosis();
  const { cluster } = useCluster();

  // Sector/Stage 코드를 clusterKnowledge 키로 변환
  const sectorMap: Record<string, string> = {
    'S-1': 'Technology',
    'S-2': 'B2C',
    'S-3': 'Ecommerce',
    'S-4': 'B2B SaaS',
    'S-5': 'Healthcare'
  };

  const stageMap: Record<string, string> = {
    'A-1': 'Seed',
    'A-2': 'Early',
    'A-3': 'Product-Market Fit',
    'A-4': 'Growth',
    'A-5': 'Scale'
  };

  // ClusterInfo 형태로 변환 (clusterKnowledge와 호환되는 형식)
  const clusterInfo = useMemo(() => {
    const mappedSector = sectorMap[cluster.sector] || 'Technology';
    const mappedStage = stageMap[cluster.stage] || 'Seed';

    return {
      clusterId: `${cluster.sector}_${cluster.stage}`,
      name: `${cluster.sector} - ${cluster.stage}`,
      industry: 'startup',
      size: 'small',
      sector: mappedSector,  // ✅ clusterKnowledge 조회용
      stage: mappedStage     // ✅ clusterKnowledge 조회용
    };
  }, [cluster.sector, cluster.stage]);

  // 이전 데이터 추적 (불필요한 재처리 방지)
  const prevDataRef = useRef<{
    kpisHash: string;
    responsesHash: string;
    reportData: ReportData | null;
  }>({
    kpisHash: '',
    responsesHash: '',
    reportData: null
  });

  /**
   * 파이프라인 초기화
   */
  useEffect(() => {
    if (!pipelineRef.current) {
      const pipeline = new ReportDataPipeline();

      // 파이프라인 상태 변경 리스너
      pipeline.onStateChange((state) => {
        setPipelineState(state);

        // 진행 상황 로깅 비활성화 (너무 많은 로그 출력 방지)
        // if (process.env.NODE_ENV === 'development') {
        //   console.log(`📊 Pipeline [${state.currentStage}]: ${state.progress}%`, {
        //     processed: state.processedCount,
        //     total: state.totalCount,
        //     errors: state.errors.length,
        //     warnings: state.warnings.length
        //   });
        // }
      });

      pipelineRef.current = pipeline;
    }

    return () => {
      // 클린업
      pipelineRef.current?.reset();
    };
  }, []);

  /**
   * 데이터 해시 생성 (변경 감지용)
   */
  const generateDataHash = useCallback((data: any): string => {
    try {
      return JSON.stringify(data).substring(0, 100); // 간단한 해시
    } catch {
      return Math.random().toString();
    }
  }, []);

  /**
   * 최적화된 데이터 처리기
   */
  const optimizedProcessor = useMemo(() => getOptimizedProcessor(), []);

  /**
   * 메인 데이터 처리 로직 (디바운싱 적용)
   */
  const processReportDataRaw = useCallback(async () => {
    const pipeline = pipelineRef.current;
    if (!pipeline || !clusterInfo) return;

    // 데이터 변경 확인
    const currentKpisHash = generateDataHash(kpis);
    const currentResponsesHash = generateDataHash(responses);

    if (
      prevDataRef.current.kpisHash === currentKpisHash &&
      prevDataRef.current.responsesHash === currentResponsesHash &&
      prevDataRef.current.reportData
    ) {
      // 데이터가 변경되지 않았으면 캐시된 결과 사용
      setReportData(prevDataRef.current.reportData);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Stage 1: 데이터 수집
      const { validResponses, partialInfo } = await pipeline.collectData(
        kpis || [],
        responses || {},
        clusterInfo
      );

      // 데이터가 없으면 중단
      if (validResponses.size === 0) {
        setError('진단 데이터가 없습니다. KPI 진단을 먼저 완료해주세요.');
        setIsLoading(false);
        return;
      }

      // Stage 2: 데이터 처리 (최적화된 프로세서 사용)
      const rawProcessed = await pipeline.processData(
        kpis || [],
        validResponses,
        clusterInfo
      );

      // 추가 최적화 처리
      const processed = await optimizedProcessor.processKPIData(rawProcessed, {
        useCache: true,
        onProgress: (progress) => {
          console.log(`📋 Processing: ${progress.toFixed(1)}%`);
        }
      });

      setProcessedData(processed);

      // Stage 3: 레포트 생성
      const report = await pipeline.generateReport(
        processed,
        clusterInfo,
        partialInfo
      );

      // 결과 저장
      setReportData(report);

      // 캐시 업데이트
      prevDataRef.current = {
        kpisHash: currentKpisHash,
        responsesHash: currentResponsesHash,
        reportData: report
      };

      // 성공 로깅 비활성화 (너무 많은 로그 출력 방지)
      // if (process.env.NODE_ENV === 'development') {
      //   console.log('✅ Report generated successfully:', {
      //     totalKPIs: partialInfo.total,
      //     completedKPIs: partialInfo.completed,
      //     completionRate: partialInfo.completionRate,
      //     overallScore: report.summary.overallScore
      //   });
      // }

    } catch (err) {
      console.error('Report generation failed:', err);
      setError(err instanceof Error ? err.message : '레포트 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [kpis, responses, clusterInfo, generateDataHash, optimizedProcessor]);

  /**
   * 디바운싱 적용된 처리 함수
   */
  const processReportData = useMemo(
    () => debounce(processReportDataRaw, 300),
    [processReportDataRaw]
  );

  /**
   * 데이터 변경 감지 및 자동 처리
   */
  useEffect(() => {
    // 필수 데이터 체크
    if (!responses || Object.keys(responses).length === 0) {
      return;
    }

    // 자동 처리 (디바운스 적용)
    const timer = setTimeout(() => {
      processReportDataRaw();
    }, 500);

    return () => clearTimeout(timer);
  }, [responses, axisScores, processReportDataRaw]);

  /**
   * 레포트 재생성
   */
  const regenerateReport = useCallback(async () => {
    if (!pipelineRef.current) return;

    // 캐시 클리어
    pipelineRef.current.clearCache();
    prevDataRef.current.reportData = null;

    // 재처리
    await processReportDataRaw();
  }, [processReportDataRaw]);

  /**
   * PDF 출력 - modern-screenshot + jsPDF
   * modern-screenshot은 oklab/oklch를 완벽하게 지원
   * 화면에 보이는 실제 크기 그대로 캡처
   */
  const exportToPDF = useCallback(async () => {
    if (!reportData) {
      alert('레포트 데이터가 없습니다. 먼저 KPI 진단을 완료해주세요.');
      return;
    }

    try {
      const element = document.querySelector('.report-v3 .report-container') as HTMLElement;
      if (!element) {
        alert('PDF 출력할 요소를 찾을 수 없습니다.');
        return;
      }

      // Lazy loaded 컴포넌트 렌더링 대기
      await new Promise(resolve => setTimeout(resolve, 500));

      // 화면에 실제로 렌더링된 크기 사용 (clientWidth/clientHeight)
      const captureWidth = element.clientWidth;
      const captureHeight = element.clientHeight;

      console.log('📐 캡처 크기:', { captureWidth, captureHeight });

      // 화면 크기 그대로 캡처
      const dataUrl = await domToPng(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        width: captureWidth,
        height: captureHeight
      });

      // PNG를 Image로 로드
      const img = new Image();
      img.src = dataUrl;
      await new Promise(resolve => { img.onload = resolve; });

      // PDF 생성 - 이미지 비율 유지하면서 A4에 맞춤
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // 이미지 비율 계산
      const imgRatio = img.width / img.height;
      const pdfRatio = pdfWidth / pdfHeight;

      let finalWidth = pdfWidth;
      let finalHeight = pdfHeight;

      if (imgRatio > pdfRatio) {
        // 이미지가 더 넓은 경우 - width를 기준으로
        finalHeight = pdfWidth / imgRatio;
      } else {
        // 이미지가 더 긴 경우 - height를 기준으로
        finalWidth = pdfHeight * imgRatio;
      }

      // 중앙 정렬
      const x = (pdfWidth - finalWidth) / 2;
      const y = (pdfHeight - finalHeight) / 2;

      pdf.addImage(dataUrl, 'PNG', x, y, finalWidth, finalHeight);

      const filename = `KPI_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      console.log('✅ PDF 출력 완료:', filename);

    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF 출력에 실패했습니다.');
    }
  }, [reportData]);

  /**
   * 단일 KPI 업데이트 (증분 업데이트)
   */
  const updateSingleKPI = useCallback(async (
    kpi: KPIDefinition,
    response: KPIResponse
  ) => {
    const pipeline = pipelineRef.current;
    if (!pipeline || !clusterInfo) return;

    try {
      // 기존 processedData에 증분 업데이트
      const updatedProcessed = await pipeline.updateSingleKPI(
        kpi,
        response,
        clusterInfo,
        processedData
      );

      setProcessedData(updatedProcessed);

      // 레포트 재생성 (부분)
      const partialInfo = {
        total: kpis?.length || 0,
        completed: updatedProcessed.length,
        completionRate: Math.round((updatedProcessed.length / (kpis?.length || 1)) * 100),
        byAxis: {} as any,
        missingCritical: []
      };

      const report = await pipeline.generateReport(
        updatedProcessed,
        clusterInfo,
        partialInfo
      );

      setReportData(report);

      console.log(`✅ KPI ${kpi.kpi_id} updated successfully`);

    } catch (err) {
      console.error(`Failed to update KPI ${kpi.kpi_id}:`, err);
    }
  }, [processedData, clusterInfo, kpis]);

  /**
   * 파이프라인 상태 정보
   */
  const getPipelineInfo = useCallback(() => {
    if (!pipelineRef.current) return null;

    const state = pipelineRef.current.getState();
    return {
      stage: state.currentStage,
      progress: state.progress,
      isProcessing: state.currentStage !== PipelineStage.COMPLETE,
      errors: state.errors,
      warnings: state.warnings,
      cacheSize: pipelineRef.current.getCacheSize()
    };
  }, []);

  /**
   * 디버그 정보 비활성화 (너무 많은 로그 출력 방지)
   */
  // useEffect(() => {
  //   if (process.env.NODE_ENV === 'development' && reportData) {
  //     console.log('🔍 Report Data Debug:', {
  //       metadata: reportData.metadata,
  //       summary: reportData.summary,
  //       insightsCount: reportData.insights?.length || 0,
  //       processedDataCount: processedData.length,
  //       pipelineInfo: getPipelineInfo()
  //     });
  //   }
  // }, [reportData, processedData, getPipelineInfo]);

  return {
    reportData,
    processedData,
    isLoading,
    error,
    regenerateReport,
    exportToPDF,
    // 추가 기능
    updateSingleKPI,
    pipelineInfo: getPipelineInfo()
  };
}