/**
 * Report Data Pipeline Manager
 * 3단계 데이터 처리 파이프라인 구현
 */

import type {
  KPIDefinition,
  KPIResponse,
  AxisKey,
  ClusterInfo,
  ProcessedKPIData,
  ReportData
} from '@/types/reportV3.types';
import { processKPIData } from './reportDataProcessor';
import { generateClusterInsights } from './basicInsightGenerator';
import { validateReportData, validateRequiredKPIs } from './dataValidator';
import { calculateKPIScore, calculateWeightedScore } from './scoreCalculator';
import { getCacheManager, type CacheManager } from './cacheManager';

/**
 * 파이프라인 단계 정의
 */
export enum PipelineStage {
  COLLECTION = 'collection',
  PROCESSING = 'processing',
  GENERATION = 'generation',
  COMPLETE = 'complete'
}

/**
 * 파이프라인 상태
 */
export interface PipelineState {
  currentStage: PipelineStage;
  progress: number; // 0-100
  processedCount: number;
  totalCount: number;
  errors: string[];
  warnings: string[];
}

/**
 * 부분 진단 처리 인터페이스
 */
export interface PartialDiagnosisInfo {
  total: number;
  completed: number;
  completionRate: number;
  byAxis: Record<AxisKey, {
    total: number;
    completed: number;
    missing: string[];
  }>;
  missingCritical: string[];
}

/**
 * 메인 데이터 파이프라인 클래스
 */
export class ReportDataPipeline {
  private state: PipelineState;
  private processedCache: Map<string, ProcessedKPIData>;
  private listeners: Set<(state: PipelineState) => void>;
  private cacheManager: CacheManager;

  constructor() {
    this.state = {
      currentStage: PipelineStage.COLLECTION,
      progress: 0,
      processedCount: 0,
      totalCount: 0,
      errors: [],
      warnings: []
    };
    this.processedCache = new Map();
    this.listeners = new Set();
    this.cacheManager = getCacheManager();
  }

  /**
   * 상태 변경 리스너 등록
   */
  public onStateChange(listener: (state: PipelineState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Stage 1: 데이터 수집 및 검증
   */
  public async collectData(
    kpis: KPIDefinition[],
    responses: Record<string, KPIResponse>,
    cluster: ClusterInfo
  ): Promise<{
    validResponses: Map<string, KPIResponse>;
    partialInfo: PartialDiagnosisInfo;
  }> {
    this.updateState({
      currentStage: PipelineStage.COLLECTION,
      progress: 0,
      totalCount: kpis.length
    });

    // 응답 Map 생성
    const validResponses = new Map<string, KPIResponse>();
    const partialInfo = this.analyzePartialData(kpis, responses);

    // 유효한 응답만 필터링 (더 관대한 검증)
    Object.entries(responses).forEach(([kpiId, response]) => {
      if (response) {
        // response.kpi_id가 있으면 확인, 없으면 key를 사용
        if (!response.kpi_id || response.kpi_id === kpiId) {
          validResponses.set(kpiId, response);
        }
      }
    });

    console.log('🔍 Pipeline collectData:', {
      totalResponses: Object.keys(responses).length,
      validResponsesCount: validResponses.size,
      sampleResponseKeys: Object.keys(responses).slice(0, 3),
      partialInfo: {
        completed: partialInfo.completed,
        completionRate: partialInfo.completionRate
      }
    });

    this.updateState({
      progress: 100,
      processedCount: validResponses.size
    });

    return { validResponses, partialInfo };
  }

  /**
   * Stage 2: 데이터 처리 및 변환
   */
  public async processData(
    kpis: KPIDefinition[],
    validResponses: Map<string, KPIResponse>,
    cluster: ClusterInfo
  ): Promise<ProcessedKPIData[]> {
    this.updateState({
      currentStage: PipelineStage.PROCESSING,
      progress: 0
    });

    const processed: ProcessedKPIData[] = [];
    const totalToProcess = validResponses.size;
    let processedCount = 0;

    // KPI별 처리
    for (const kpi of kpis) {
      const response = validResponses.get(kpi.kpi_id);

      if (response) {
        try {
          // 캐시 키 생성 (kpiId + responseHash + clusterHash)
          const cacheKey = this.cacheManager.generateStaticKey(
            'processed_kpi',
            kpi.kpi_id,
            response.timestamp,
            cluster.stage
          );

          // 다층 캐시 확인
          let processedData = this.cacheManager.get<ProcessedKPIData>(cacheKey);

          if (!processedData) {
            // 캐시 미스 - 새로 처리
            processedData = await processKPIData(kpi, response, cluster);

            // 캐시 저장 (메모리 + localStorage)
            this.cacheManager.set(cacheKey, processedData, {
              ttlMinutes: 30,
              persistent: true // 중요 데이터이므로 영구 저장
            });
          }

          processed.push(processedData);
        } catch (error) {
          this.state.errors.push(`Failed to process KPI ${kpi.kpi_id}: ${error}`);
        }
      }

      processedCount++;
      this.updateState({
        progress: Math.round((processedCount / totalToProcess) * 100),
        processedCount
      });
    }

    // 데이터 검증
    const validation = validateReportData(processed, cluster);
    if (validation.details.kpiErrors.length > 0) {
      this.state.errors.push(...validation.details.kpiErrors);
    }
    if (validation.details.axisWarnings.length > 0) {
      this.state.warnings.push(...validation.details.axisWarnings);
    }

    return processed;
  }

  /**
   * Stage 3: 레포트 생성
   */
  public async generateReport(
    processedData: ProcessedKPIData[],
    cluster: ClusterInfo,
    partialInfo: PartialDiagnosisInfo
  ): Promise<ReportData> {
    this.updateState({
      currentStage: PipelineStage.GENERATION,
      progress: 0
    });

    // 축별 점수 계산 (캐싱)
    const axisScoresCacheKey = this.cacheManager.generateStaticKey(
      'axis_scores',
      processedData.map(d => d.kpi.kpi_id).sort().join(',')
    );
    let axisScores = this.cacheManager.get<Record<AxisKey, number>>(axisScoresCacheKey);

    if (!axisScores) {
      axisScores = this.calculateAxisScores(processedData);
      this.cacheManager.set(axisScoresCacheKey, axisScores, { ttlMinutes: 15 });
    }
    this.updateState({ progress: 25 });

    // 전체 점수 계산 (캐싱)
    const overallScoreCacheKey = this.cacheManager.generateStaticKey(
      'overall_score',
      processedData.map(d => d.kpi.kpi_id).sort().join(',')
    );
    let overallScore = this.cacheManager.get<number>(overallScoreCacheKey);

    if (overallScore === null) {
      overallScore = this.calculateOverallScore(processedData);
      this.cacheManager.set(overallScoreCacheKey, overallScore, { ttlMinutes: 15 });
    }
    this.updateState({ progress: 50 });

    // 인사이트 생성 (캐싱)
    const insightCacheKey = this.cacheManager.generateStaticKey(
      'cluster_insights',
      cluster.stage,
      cluster.sector,
      processedData.length
    );
    let insightResult = this.cacheManager.get<any>(insightCacheKey);

    if (!insightResult) {
      insightResult = await generateClusterInsights(processedData, cluster);
      this.cacheManager.set(insightCacheKey, insightResult, {
        ttlMinutes: 30,
        persistent: true
      });
    }
    this.updateState({ progress: 75 });

    // ReportData 조립
    const reportData: ReportData = {
      metadata: {
        reportId: `report-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        cluster,
        dataSource: 'kpi-diagnosis',
        version: '3.0'
      },
      summary: {
        overallScore,
        totalKPIs: partialInfo.total,
        completedKPIs: partialInfo.completed,
        criticalKPIs: processedData.filter(d => d.weight.emphasis === 'critical').length,
        completionRate: partialInfo.completionRate,
        keyFindings: insightResult.clusterSummary.keyFindings,
        status: insightResult.clusterSummary.status
      },
      insights: insightResult.priorityInsights.map(insight => ({
        id: `insight-${Math.random()}`,
        title: insight.title,
        description: insight.description,
        priority: insight.priority,
        category: insight.category,
        affectedKPIs: insight.affectedKPIs,
        actionItems: insight.actionItems
      })),
      radarData: {
        axes: ['GO', 'EC', 'PT', 'PF', 'TO'].map(axis => ({
          axis: axis as AxisKey,
          score: axisScores[axis as AxisKey] || 0,
          label: this.getAxisLabel(axis as AxisKey)
        })),
        comparisonData: this.generateComparisonData(axisScores),
        maxValue: 100,
        axisDetails: this.generateAxisDetails(processedData, axisScores)
      },
      detailedAnalysis: {
        byAxis: this.generateByAxisAnalysis(processedData),
        criticalKPIs: processedData.filter(d => d.weight.emphasis === 'critical'),
        riskFlags: this.generateRiskFlags(processedData)
      },
      quickHighlights: this.generateQuickHighlights(processedData, insightResult),
      criticalAlerts: insightResult.criticalAlerts
    };

    this.updateState({
      currentStage: PipelineStage.COMPLETE,
      progress: 100
    });

    return reportData;
  }

  /**
   * 증분 업데이트 (단일 KPI 응답 추가)
   */
  public async updateSingleKPI(
    kpi: KPIDefinition,
    response: KPIResponse,
    cluster: ClusterInfo,
    existingProcessed: ProcessedKPIData[]
  ): Promise<ProcessedKPIData[]> {
    // 기존 데이터에서 해당 KPI 제거
    const filtered = existingProcessed.filter(d => d.kpi.kpi_id !== kpi.kpi_id);

    // 새로 처리
    const processed = await processKPIData(kpi, response, cluster);

    // 캐시 업데이트
    const cacheKey = `${kpi.kpi_id}-${response.timestamp}`;
    this.processedCache.set(cacheKey, processed);

    return [...filtered, processed];
  }

  /**
   * 부분 진단 분석
   */
  private analyzePartialData(
    kpis: KPIDefinition[],
    responses: Record<string, KPIResponse>
  ): PartialDiagnosisInfo {
    const total = kpis.length;
    const completed = Object.keys(responses).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 축별 분석
    const byAxis: Record<AxisKey, any> = {} as any;
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

    axes.forEach(axis => {
      const axisKPIs = kpis.filter(k => k.axis === axis);
      const axisCompleted = axisKPIs.filter(k => responses[k.kpi_id]).length;
      const missing = axisKPIs
        .filter(k => !responses[k.kpi_id])
        .map(k => k.kpi_id);

      byAxis[axis] = {
        total: axisKPIs.length,
        completed: axisCompleted,
        missing
      };
    });

    // 핵심 KPI 누락 확인
    const criticalKPIs = kpis.filter(k => {
      // 가중치 정보를 확인하는 로직 필요
      return k.metadata?.priority === 'critical';
    });

    const missingCritical = criticalKPIs
      .filter(k => !responses[k.kpi_id])
      .map(k => k.kpi_id);

    return {
      total,
      completed,
      completionRate,
      byAxis,
      missingCritical
    };
  }

  /**
   * 축별 점수 계산
   */
  private calculateAxisScores(processedData: ProcessedKPIData[]): Record<AxisKey, number> {
    const scores: Record<AxisKey, number> = {} as any;
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const nanSummary: Record<string, number> = {};

    axes.forEach(axis => {
      const axisData = processedData.filter(d => d.kpi.axis === axis);
      if (axisData.length > 0) {
        const axisScores = axisData.map(d => {
          const score = calculateKPIScore(d.processedValue, d.kpi);
          return {
            score,
            weight: d.weight.level
          };
        });

        // NaN 카운트만 기록
        const nanCount = axisScores.filter(s => isNaN(s.score)).length;
        if (nanCount > 0) {
          nanSummary[axis] = nanCount;
        }

        scores[axis] = calculateWeightedScore(axisScores);
      } else {
        scores[axis] = 0;
      }
    });

    // NaN 요약만 한 번 출력
    if (Object.keys(nanSummary).length > 0) {
      console.error('❌ NaN scores detected:', nanSummary, '(see individual KPI errors above)');
    }

    console.log('📊 Axis Scores:', scores);

    return scores;
  }

  /**
   * 전체 점수 계산
   */
  private calculateOverallScore(processedData: ProcessedKPIData[]): number {
    if (processedData.length === 0) {
      console.warn('⚠️ calculateOverallScore: No processed data');
      return 0;
    }

    const allScores = processedData.map(d => {
      const score = calculateKPIScore(d.processedValue, d.kpi);
      return {
        score,
        weight: d.weight.level
      };
    });

    const result = calculateWeightedScore(allScores);

    console.log('📊 Overall Score:', {
      total: processedData.length,
      valid: allScores.filter(s => !isNaN(s.score)).length,
      result
    });

    return result;
  }

  /**
   * 비교 데이터 생성 (임시)
   */
  private generateComparisonData(axisScores: Record<AxisKey, number>): number[] {
    // 업계 평균 (임시로 70% 수준)
    return Object.values(axisScores).map(score => score * 0.7);
  }

  /**
   * 축별 상세 정보 생성
   */
  private generateAxisDetails(
    processedData: ProcessedKPIData[],
    axisScores: Record<AxisKey, number>
  ): any {
    const details: any = {};
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

    axes.forEach(axis => {
      const axisData = processedData.filter(d => d.kpi.axis === axis);
      details[axis] = {
        score: axisScores[axis] || 0,
        kpiCount: axisData.length,
        criticalCount: axisData.filter(d => d.weight.emphasis === 'critical').length,
        trend: 'stable' // 임시
      };
    });

    return details;
  }

  /**
   * 축별 분석 생성
   */
  private generateByAxisAnalysis(processedData: ProcessedKPIData[]): any {
    const analysis: any = {};
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

    axes.forEach(axis => {
      const axisData = processedData.filter(d => d.kpi.axis === axis);
      analysis[axis] = {
        topPerformers: axisData
          .sort((a, b) => {
            const scoreA = calculateKPIScore(a.processedValue, a.kpi);
            const scoreB = calculateKPIScore(b.processedValue, b.kpi);
            return scoreB - scoreA;
          })
          .slice(0, 3),
        needsImprovement: axisData.filter(d => {
          const score = calculateKPIScore(d.processedValue, d.kpi);
          return score < 60;
        })
      };
    });

    return analysis;
  }

  /**
   * 리스크 플래그 생성
   */
  private generateRiskFlags(processedData: ProcessedKPIData[]): any[] {
    const flags = [];

    // 고위험 KPI 확인
    const highRiskKPIs = processedData.filter(d => {
      const score = calculateKPIScore(d.processedValue, d.kpi);
      return score < 40 && d.weight.emphasis === 'critical';
    });

    if (highRiskKPIs.length > 0) {
      flags.push({
        severity: 'critical' as const,
        title: '핵심 KPI 위험',
        description: `${highRiskKPIs.length}개의 핵심 KPI가 위험 수준입니다.`,
        affectedKPIs: highRiskKPIs.map(d => d.kpi.kpi_id)
      });
    }

    // 축 불균형 확인
    const axisScores = this.calculateAxisScores(processedData);
    const scoreValues = Object.values(axisScores);
    const maxScore = Math.max(...scoreValues);
    const minScore = Math.min(...scoreValues);

    if (maxScore - minScore > 40) {
      flags.push({
        severity: 'warning' as const,
        title: '축 간 불균형',
        description: '비즈니스 영역 간 성과 차이가 큽니다.',
        affectedKPIs: []
      });
    }

    return flags;
  }

  /**
   * 빠른 하이라이트 생성
   */
  private generateQuickHighlights(processedData: ProcessedKPIData[], insightResult: any): string[] {
    const highlights = [];

    // 최고 성과
    const topKPI = processedData
      .map(d => ({
        name: d.kpi.name,
        score: calculateKPIScore(d.processedValue, d.kpi)
      }))
      .sort((a, b) => b.score - a.score)[0];

    if (topKPI && topKPI.score > 80) {
      highlights.push(`✨ ${topKPI.name}: 우수한 성과 (${topKPI.score}점)`);
    }

    // 개선 필요
    const needsImprovement = processedData.filter(d => {
      const score = calculateKPIScore(d.processedValue, d.kpi);
      return score < 50;
    });

    if (needsImprovement.length > 0) {
      highlights.push(`⚠️ ${needsImprovement.length}개 지표 개선 필요`);
    }

    // 완료율
    const completionRate = Math.round(
      (processedData.length / Math.max(processedData.length, 20)) * 100
    );
    highlights.push(`📊 진단 완료율: ${completionRate}%`);

    return highlights;
  }

  /**
   * 축 라벨 가져오기
   */
  private getAxisLabel(axis: AxisKey): string {
    const labels = {
      GO: 'Go-to-Market',
      EC: 'Economics',
      PT: 'Product & Tech',
      PF: 'Performance',
      TO: 'Team & Org'
    };
    return labels[axis];
  }

  /**
   * 상태 업데이트
   */
  private updateState(updates: Partial<PipelineState>): void {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * 파이프라인 리셋
   */
  public reset(): void {
    this.state = {
      currentStage: PipelineStage.COLLECTION,
      progress: 0,
      processedCount: 0,
      totalCount: 0,
      errors: [],
      warnings: []
    };
    this.processedCache.clear();
  }

  /**
   * 현재 상태 가져오기
   */
  public getState(): PipelineState {
    return { ...this.state };
  }

  /**
   * 캐시 크기 가져오기
   */
  public getCacheSize(): number {
    const stats = this.cacheManager.getStats();
    return stats.memory.size + stats.storage.count;
  }

  /**
   * 캐시 지우기
   */
  public clearCache(): void {
    this.processedCache.clear();
    this.cacheManager.clear();
  }

  /**
   * 캐시 통계 가져오기
   */
  public getCacheStats() {
    return this.cacheManager.getStats();
  }

  /**
   * 특정 축의 캐시 무효화
   */
  public invalidateAxisCache(axis: AxisKey): void {
    this.cacheManager.invalidateAxis(axis);
  }

  /**
   * 특정 KPI의 캐시 무효화
   */
  public invalidateKPICache(kpiId: string): void {
    this.cacheManager.invalidateKPI(kpiId);
  }
}