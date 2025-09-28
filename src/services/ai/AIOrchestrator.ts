/**
 * AI Orchestrator - Phase 8 AI 시스템 통합 관리자
 * 모든 AI 서비스들을 효율적으로 조율하고 최적화하는 중앙 관리 시스템
 */

import type { AxisKey } from '../../pages/startup/kpi-tabs/ResultsInsightsPanelV2/types';
import { getPatternRecognitionEngine } from './PatternRecognition';
import { getAnomalyDetectionEngine } from './AnomalyDetection';
import { getNLPInsightsEngine } from './NLPInsights';
import { getMonteCarloSimulator } from '../simulation/MonteCarloSimulator';
import { getPredictiveModelOptimizer } from '../prediction/PredictiveModelOptimizer';
import { getGoalReverseCalculator } from '../goalCalculation/GoalReverseCalculator';

// 통합 데이터 타입 정의
export interface AIAnalysisRequest {
  currentScores: Record<AxisKey, number>;
  historicalData?: Array<{
    timestamp: number;
    scores: Record<AxisKey, number>;
    metadata?: any;
  }>;
  analysisType: 'full' | 'quick' | 'custom';
  options?: {
    includePrediction?: boolean;
    includeSimulation?: boolean;
    includeGoalCalculation?: boolean;
    targetGoals?: Partial<Record<AxisKey, number>>;
    timeHorizon?: number;
    confidenceLevel?: number;
  };
}

export interface AIAnalysisResult {
  id: string;
  timestamp: number;
  analysisType: string;

  // 각 AI 서비스 결과
  patterns: any[];
  anomalies: any[];
  nlpInsights: any[];
  simulation: any | null;
  prediction: any | null;
  goalCalculation: any | null;

  // 메타 정보
  performance: {
    totalTime: number;
    serviceTimings: Record<string, number>;
    cacheHits: number;
    errors: any[];
  };

  // 통합 인사이트
  summary: {
    overallHealth: number;
    keyInsights: string[];
    recommendations: string[];
    urgentIssues: string[];
  };
}

export interface AIServiceConfig {
  enabled: boolean;
  priority: number;
  timeout: number;
  cacheEnabled: boolean;
  cacheTTL: number;
}

export interface OrchestratorConfig {
  services: Record<string, AIServiceConfig>;
  parallelExecution: boolean;
  maxConcurrency: number;
  defaultTimeout: number;
  enablePerformanceMonitoring: boolean;
}

/**
 * AI 서비스 간 데이터 흐름과 실행을 최적화하는 중앙 관리자
 */
export class AIOrchestrator {
  private config: OrchestratorConfig;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;
  private performanceMetrics: Map<string, any[]>;
  private activeRequests: Map<string, Promise<any>>;

  constructor(config?: Partial<OrchestratorConfig>) {
    this.config = {
      services: {
        patternRecognition: { enabled: true, priority: 1, timeout: 5000, cacheEnabled: true, cacheTTL: 300000 },
        anomalyDetection: { enabled: true, priority: 1, timeout: 3000, cacheEnabled: true, cacheTTL: 180000 },
        nlpInsights: { enabled: true, priority: 2, timeout: 8000, cacheEnabled: true, cacheTTL: 600000 },
        simulation: { enabled: true, priority: 3, timeout: 15000, cacheEnabled: false, cacheTTL: 0 },
        prediction: { enabled: true, priority: 2, timeout: 10000, cacheEnabled: true, cacheTTL: 900000 },
        goalCalculation: { enabled: true, priority: 3, timeout: 5000, cacheEnabled: true, cacheTTL: 1800000 }
      },
      parallelExecution: true,
      maxConcurrency: 4,
      defaultTimeout: 30000,
      enablePerformanceMonitoring: true,
      ...config
    };

    this.cache = new Map();
    this.performanceMetrics = new Map();
    this.activeRequests = new Map();

    // 캐시 정리 스케줄러
    setInterval(() => this.cleanupCache(), 60000); // 1분마다
  }

  /**
   * 메인 AI 분석 실행 함수
   */
  async runAnalysis(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    const analysisId = this.generateAnalysisId();
    const startTime = Date.now();

    console.log(`🤖 Starting AI analysis (ID: ${analysisId}, Type: ${request.analysisType})`);

    try {
      // 1. 요청 검증 및 전처리
      this.validateRequest(request);
      const preprocessedData = this.preprocessData(request);

      // 2. 분석 실행 계획 수립
      const executionPlan = this.createExecutionPlan(request);

      // 3. AI 서비스들 실행
      const results = await this.executeServices(executionPlan, preprocessedData);

      // 4. 결과 통합 및 후처리
      const integratedResult = this.integrateResults(results, request);

      // 5. 성능 메트릭 수집
      const performance = this.collectPerformanceMetrics(analysisId, startTime, results);

      // 6. 최종 결과 구성
      const finalResult: AIAnalysisResult = {
        id: analysisId,
        timestamp: Date.now(),
        analysisType: request.analysisType,
        ...integratedResult,
        performance,
        summary: this.generateSummary(integratedResult)
      };

      console.log(`✅ AI analysis completed (${Date.now() - startTime}ms)`);
      return finalResult;

    } catch (error) {
      console.error(`❌ AI analysis failed (ID: ${analysisId}):`, error);
      throw this.handleError(error, analysisId);
    }
  }

  /**
   * 요청 검증
   */
  private validateRequest(request: AIAnalysisRequest): void {
    if (!request.currentScores) {
      throw new Error('currentScores는 필수입니다');
    }

    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    for (const axis of axes) {
      if (typeof request.currentScores[axis] !== 'number') {
        throw new Error(`${axis} 축 점수가 유효하지 않습니다`);
      }
    }

    if (request.historicalData) {
      for (const dataPoint of request.historicalData) {
        if (!dataPoint.timestamp || !dataPoint.scores) {
          throw new Error('historicalData 형식이 유효하지 않습니다');
        }
      }
    }
  }

  /**
   * 데이터 전처리
   */
  private preprocessData(request: AIAnalysisRequest): any {
    return {
      currentScores: { ...request.currentScores },
      historicalData: request.historicalData?.map(d => ({
        ...d,
        scores: { ...d.scores }
      })) || [],
      metadata: {
        dataQuality: this.assessDataQuality(request),
        timeRange: this.calculateTimeRange(request.historicalData),
        completeness: this.calculateCompleteness(request)
      }
    };
  }

  /**
   * 실행 계획 수립
   */
  private createExecutionPlan(request: AIAnalysisRequest): {
    phase1: string[];
    phase2: string[];
    phase3: string[];
  } {
    const enabledServices = Object.entries(this.config.services)
      .filter(([_, config]) => config.enabled)
      .sort((a, b) => a[1].priority - b[1].priority);

    // 의존성에 따른 단계별 실행 계획
    const plan = {
      phase1: ['patternRecognition', 'anomalyDetection'], // 독립 실행 가능
      phase2: ['nlpInsights'], // phase1 결과 필요
      phase3: [] as string[] // 옵션에 따라 결정
    };

    // 옵션에 따른 phase3 서비스 추가
    if (request.options?.includeSimulation !== false) {
      plan.phase3.push('simulation');
    }
    if (request.options?.includePrediction !== false && request.historicalData?.length) {
      plan.phase3.push('prediction');
    }
    if (request.options?.includeGoalCalculation !== false) {
      plan.phase3.push('goalCalculation');
    }

    return plan;
  }

  /**
   * AI 서비스들 실행
   */
  private async executeServices(plan: any, data: any): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    try {
      // Phase 1: 기본 분석 (병렬)
      if (this.config.parallelExecution) {
        const phase1Results = await Promise.allSettled(
          plan.phase1.map((service: string) => this.executeService(service, data))
        );

        plan.phase1.forEach((service: string, index: number) => {
          const result = phase1Results[index];
          results[service] = result.status === 'fulfilled' ? result.value : null;
        });
      } else {
        for (const service of plan.phase1) {
          results[service] = await this.executeService(service, data);
        }
      }

      // Phase 2: NLP 인사이트 (phase1 결과 필요)
      for (const service of plan.phase2) {
        results[service] = await this.executeService(service, data, {
          patterns: results.patternRecognition,
          anomalies: results.anomalyDetection
        });
      }

      // Phase 3: 시뮬레이션/예측 (병렬)
      if (plan.phase3.length > 0) {
        if (this.config.parallelExecution) {
          const phase3Results = await Promise.allSettled(
            plan.phase3.map((service: string) => this.executeService(service, data))
          );

          plan.phase3.forEach((service: string, index: number) => {
            const result = phase3Results[index];
            results[service] = result.status === 'fulfilled' ? result.value : null;
          });
        } else {
          for (const service of plan.phase3) {
            results[service] = await this.executeService(service, data);
          }
        }
      }

      return results;

    } catch (error) {
      console.error('Service execution error:', error);
      throw error;
    }
  }

  /**
   * 개별 AI 서비스 실행
   */
  private async executeService(serviceName: string, data: any, context?: any): Promise<any> {
    const serviceConfig = this.config.services[serviceName];
    if (!serviceConfig?.enabled) {
      return null;
    }

    const cacheKey = this.generateCacheKey(serviceName, data);

    // 캐시 확인
    if (serviceConfig.cacheEnabled) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log(`💾 Cache hit for ${serviceName}`);
        return cached;
      }
    }

    const startTime = Date.now();

    try {
      let result;

      switch (serviceName) {
        case 'patternRecognition':
          result = await this.executePatternRecognition(data);
          break;

        case 'anomalyDetection':
          result = await this.executeAnomalyDetection(data);
          break;

        case 'nlpInsights':
          result = await this.executeNLPInsights(data, context);
          break;

        case 'simulation':
          result = await this.executeSimulation(data);
          break;

        case 'prediction':
          result = await this.executePrediction(data);
          break;

        case 'goalCalculation':
          result = await this.executeGoalCalculation(data);
          break;

        default:
          throw new Error(`Unknown service: ${serviceName}`);
      }

      const executionTime = Date.now() - startTime;
      console.log(`⚡ ${serviceName} completed in ${executionTime}ms`);

      // 캐시 저장
      if (serviceConfig.cacheEnabled && result) {
        this.setCache(cacheKey, result, serviceConfig.cacheTTL);
      }

      return result;

    } catch (error) {
      console.error(`❌ ${serviceName} failed:`, error);
      return null;
    }
  }

  /**
   * 패턴 인식 실행
   */
  private async executePatternRecognition(data: any): Promise<any> {
    if (!data.historicalData.length) return [];

    const engine = getPatternRecognitionEngine();
    const dataPoints = data.historicalData.map((d: any) => ({
      timestamp: d.timestamp,
      value: Object.values(d.scores).reduce((sum: number, v: any) => sum + v, 0) / 5,
      axes: d.scores
    }));

    return engine.analyzePatterns(dataPoints);
  }

  /**
   * 이상 탐지 실행
   */
  private async executeAnomalyDetection(data: any): Promise<any> {
    if (!data.historicalData.length) return [];

    const engine = getAnomalyDetectionEngine();
    const historicalScores = data.historicalData.map((d: any) => d.scores);
    return engine.detectAnomalies(data.currentScores, historicalScores);
  }

  /**
   * NLP 인사이트 실행
   */
  private async executeNLPInsights(data: any, context: any): Promise<any> {
    const engine = getNLPInsightsEngine();
    const analysisContext = {
      patterns: context?.patterns || [],
      anomalies: context?.anomalies || [],
      currentScores: data.currentScores,
      historicalTrends: data.historicalData
    };

    return engine.generateInsights(analysisContext, 'ko');
  }

  /**
   * 시뮬레이션 실행
   */
  private async executeSimulation(data: any): Promise<any> {
    const simulator = getMonteCarloSimulator({
      iterations: 1000,
      timeHorizon: 30,
      confidenceLevel: 0.95
    });

    return simulator.runSimulation(data.currentScores);
  }

  /**
   * 예측 실행
   */
  private async executePrediction(data: any): Promise<any> {
    if (!data.historicalData.length) return null;

    const optimizer = getPredictiveModelOptimizer();
    const trainingData = data.historicalData.map((d: any) => ({
      timestamp: d.timestamp,
      scores: d.scores
    }));

    return optimizer.predict(trainingData, 7);
  }

  /**
   * 목표 계산 실행
   */
  private async executeGoalCalculation(data: any): Promise<any> {
    const calculator = getGoalReverseCalculator();
    const goal = {
      targetScores: {
        GO: 85,
        EC: 85,
        PT: 85,
        PF: 85,
        TO: 85
      },
      timeframe: 90
    };

    return calculator.calculateRequirements(data.currentScores, goal);
  }

  /**
   * 결과 통합
   */
  private integrateResults(results: Record<string, any>, request: AIAnalysisRequest): any {
    return {
      patterns: results.patternRecognition || [],
      anomalies: results.anomalyDetection || [],
      nlpInsights: results.nlpInsights || [],
      simulation: results.simulation || null,
      prediction: results.prediction || null,
      goalCalculation: results.goalCalculation || null
    };
  }

  /**
   * 요약 생성
   */
  private generateSummary(results: any): any {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const currentScores = Object.values(results.currentScores || {}) as number[];
    const overallHealth = currentScores.reduce((sum, score) => sum + score, 0) / currentScores.length;

    const keyInsights: string[] = [];
    const recommendations: string[] = [];
    const urgentIssues: string[] = [];

    // 패턴 기반 인사이트
    if (results.patterns?.length > 0) {
      keyInsights.push(`${results.patterns.length}개의 패턴이 감지되었습니다`);
    }

    // 이상치 기반 경고
    if (results.anomalies?.length > 0) {
      urgentIssues.push(`${results.anomalies.length}개의 이상치가 발견되었습니다`);
    }

    // 시뮬레이션 기반 추천
    if (results.simulation?.recommendations?.length > 0) {
      recommendations.push(...results.simulation.recommendations.slice(0, 3).map((r: any) => r.action));
    }

    return {
      overallHealth: Math.round(overallHealth),
      keyInsights,
      recommendations,
      urgentIssues
    };
  }

  /**
   * 성능 메트릭 수집
   */
  private collectPerformanceMetrics(analysisId: string, startTime: number, results: Record<string, any>): any {
    const totalTime = Date.now() - startTime;
    const serviceTimings: Record<string, number> = {};
    let cacheHits = 0;

    // 개별 서비스 타이밍 정보는 실제 구현에서 수집
    Object.keys(results).forEach(service => {
      serviceTimings[service] = 0; // 실제 타이밍 정보
    });

    return {
      totalTime,
      serviceTimings,
      cacheHits,
      errors: []
    };
  }

  /**
   * 캐시 관리
   */
  private generateCacheKey(serviceName: string, data: any): string {
    const key = `${serviceName}_${JSON.stringify(data.currentScores)}_${data.historicalData.length}`;
    return Buffer.from(key).toString('base64').slice(0, 32);
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp >= cached.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 유틸리티 함수들
   */
  private generateAnalysisId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private assessDataQuality(request: AIAnalysisRequest): number {
    let quality = 1.0;

    // 현재 점수 완성도
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const validScores = axes.filter(axis =>
      typeof request.currentScores[axis] === 'number' &&
      request.currentScores[axis] >= 0 &&
      request.currentScores[axis] <= 100
    );
    quality *= validScores.length / axes.length;

    // 히스토리 데이터 품질
    if (request.historicalData?.length) {
      const completeDataPoints = request.historicalData.filter(d =>
        d.timestamp && d.scores && Object.keys(d.scores).length === 5
      );
      quality *= completeDataPoints.length / request.historicalData.length;
    }

    return Math.round(quality * 100) / 100;
  }

  private calculateTimeRange(historicalData?: any[]): { start: number; end: number; days: number } | null {
    if (!historicalData?.length) return null;

    const timestamps = historicalData.map(d => d.timestamp).sort((a, b) => a - b);
    const start = timestamps[0];
    const end = timestamps[timestamps.length - 1];
    const days = Math.ceil((end - start) / (24 * 60 * 60 * 1000));

    return { start, end, days };
  }

  private calculateCompleteness(request: AIAnalysisRequest): number {
    let completeness = 0;

    // 기본 데이터
    if (request.currentScores) completeness += 0.4;
    if (request.historicalData?.length) completeness += 0.3;
    if (request.historicalData?.length && request.historicalData.length >= 7) completeness += 0.2;
    if (request.options) completeness += 0.1;

    return Math.round(completeness * 100) / 100;
  }

  private handleError(error: any, analysisId: string): Error {
    const message = error instanceof Error ? error.message : '알 수 없는 오류 발생';
    return new Error(`AI Analysis ${analysisId} failed: ${message}`);
  }

  /**
   * 설정 업데이트
   */
  updateConfig(newConfig: Partial<OrchestratorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 성능 통계 조회
   */
  getPerformanceStats(): any {
    return {
      cacheSize: this.cache.size,
      activeRequests: this.activeRequests.size,
      recentMetrics: Array.from(this.performanceMetrics.entries())
    };
  }

  /**
   * 캐시 클리어
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// 싱글톤 인스턴스
let orchestrator: AIOrchestrator | null = null;

export const getAIOrchestrator = (config?: Partial<OrchestratorConfig>): AIOrchestrator => {
  if (!orchestrator) {
    orchestrator = new AIOrchestrator(config);
  }
  return orchestrator;
};