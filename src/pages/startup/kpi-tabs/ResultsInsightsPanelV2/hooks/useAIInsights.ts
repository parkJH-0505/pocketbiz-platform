/**
 * AI Insights Hook for V2 Dashboard
 * Phase 6 AI 엔진들을 통합하는 커스텀 훅
 */

import { useState, useEffect, useCallback } from 'react';
import type { AxisKey } from '../types';
import { getPatternRecognitionEngine } from '../../../../../services/ai/PatternRecognition';
import { getAnomalyDetectionEngine } from '../../../../../services/ai/AnomalyDetection';
import { getNLPInsightsEngine } from '../../../../../services/ai/NLPInsights';
import { getMonteCarloSimulator } from '../../../../../services/simulation/MonteCarloSimulator';
import { getPredictiveModelOptimizer } from '../../../../../services/prediction/PredictiveModelOptimizer';
import { getGoalReverseCalculator } from '../../../../../services/goalCalculation/GoalReverseCalculator';
// Phase 8 AI 시스템 통합
import { AIOrchestrator } from '../../../../../services/ai/AIOrchestrator';
import { RealTimeSimulationEngine } from '../../../../../services/simulation/RealTimeSimulationEngine';
import { AdvancedPredictionSystem } from '../../../../../services/prediction/AdvancedPredictionSystem';

// AI 인사이트 상태 타입
export interface AIInsightsState {
  patterns: any[];
  anomalies: any[];
  nlpInsights: any[];
  simulations: any | null;
  predictions: any | null;
  goalCalculations: any | null;
  isLoading: boolean;
  error: string | null;
}

// Hook Props
interface UseAIInsightsProps {
  currentScores: Record<AxisKey, number>;
  historicalData?: Array<{
    timestamp: number;
    scores: Record<AxisKey, number>;
  }>;
  enabled?: boolean;
}

export const useAIInsights = ({
  currentScores,
  historicalData = [],
  enabled = true
}: UseAIInsightsProps) => {
  const [state, setState] = useState<AIInsightsState>({
    patterns: [],
    anomalies: [],
    nlpInsights: [],
    simulations: null,
    predictions: null,
    goalCalculations: null,
    isLoading: false,
    error: null
  });

  /**
   * 패턴 인식 실행
   */
  const runPatternRecognition = useCallback(async () => {
    if (!historicalData.length) return [];

    try {
      const engine = getPatternRecognitionEngine();
      const dataPoints = historicalData.map(d => ({
        timestamp: d.timestamp,
        value: Object.values(d.scores).reduce((sum, v) => sum + v, 0) / 5,
        axes: d.scores
      }));

      const patterns = engine.analyzePatterns(dataPoints);
      console.log('🔍 Patterns detected:', patterns.length);
      return patterns;
    } catch (error) {
      console.error('Pattern recognition error:', error);
      return [];
    }
  }, [historicalData]);

  /**
   * 이상 탐지 실행
   */
  const runAnomalyDetection = useCallback(async () => {
    if (!historicalData.length) return [];

    try {
      const engine = getAnomalyDetectionEngine();
      const historicalScores = historicalData.map(d => d.scores);
      const anomalies = engine.detectAnomalies(currentScores, historicalScores);
      console.log('⚠️ Anomalies detected:', anomalies.length);
      return anomalies;
    } catch (error) {
      console.error('Anomaly detection error:', error);
      return [];
    }
  }, [currentScores, historicalData]);

  /**
   * NLP 인사이트 생성
   */
  const generateNLPInsights = useCallback(async (patterns: any[], anomalies: any[]) => {
    try {
      const engine = getNLPInsightsEngine();
      const context = {
        patterns,
        anomalies,
        currentScores,
        historicalTrends: historicalData
      };

      const insights = engine.generateInsights(context, 'ko');
      console.log('💡 NLP insights generated:', insights.length);
      return insights;
    } catch (error) {
      console.error('NLP insights error:', error);
      return [];
    }
  }, [currentScores, historicalData]);

  /**
   * 몬테카를로 시뮬레이션 실행
   */
  const runMonteCarloSimulation = useCallback(async () => {
    try {
      const simulator = getMonteCarloSimulator({
        iterations: 1000, // 테스트용으로 1000회로 줄임
        timeHorizon: 30,
        confidenceLevel: 0.95
      });

      const result = await simulator.runSimulation(currentScores);
      console.log('🎲 Monte Carlo simulation completed');
      return result;
    } catch (error) {
      console.error('Monte Carlo simulation error:', error);
      return null;
    }
  }, [currentScores]);

  /**
   * 예측 모델 실행
   */
  const runPrediction = useCallback(async () => {
    if (!historicalData.length) return null;

    try {
      const optimizer = getPredictiveModelOptimizer();
      const trainingData = historicalData.map(d => ({
        timestamp: d.timestamp,
        scores: d.scores
      }));

      const result = await optimizer.predict(trainingData, 7); // 7일 예측
      console.log('📈 Prediction completed with accuracy:', result.accuracy.overall);
      return result;
    } catch (error) {
      console.error('Prediction error:', error);
      return null;
    }
  }, [historicalData]);

  /**
   * 목표 역산 계산
   */
  const calculateGoalRequirements = useCallback(async (targetScores?: Partial<Record<AxisKey, number>>) => {
    try {
      const calculator = getGoalReverseCalculator();
      const goal = {
        targetScores: targetScores || {
          GO: 85,
          EC: 85,
          PT: 85,
          PF: 85,
          TO: 85
        },
        timeframe: 90 // 90일
      };

      const result = await calculator.calculateRequirements(currentScores, goal);
      console.log('🎯 Goal calculation completed');
      return result;
    } catch (error) {
      console.error('Goal calculation error:', error);
      return null;
    }
  }, [currentScores]);

  /**
   * Phase 8: AI Orchestrator를 통한 통합 분석
   */
  const runAdvancedAIAnalysis = useCallback(async () => {
    try {
      const orchestrator = new AIOrchestrator({
        enableCaching: true,
        batchProcessing: true,
        maxConcurrency: 3,
        timeoutMs: 30000
      });

      const analysisData = {
        currentScores,
        historicalData: historicalData.slice(-30), // 최근 30개 데이터만
        userId: 'current-user', // 실제로는 context에서 가져와야 함
        context: {
          companyStage: 'growth',
          industry: 'tech',
          teamSize: 'small'
        }
      };

      const result = await orchestrator.runComprehensiveAnalysis(analysisData);
      console.log('🤖 Phase 8 AI analysis completed:', result.insights.length, 'insights generated');

      return {
        insights: result.insights,
        predictions: result.predictions,
        recommendations: result.recommendations,
        riskAssessment: result.riskAssessment
      };
    } catch (error) {
      console.error('Advanced AI analysis error:', error);
      return null;
    }
  }, [currentScores, historicalData]);

  /**
   * Phase 8: 실시간 시뮬레이션 실행
   */
  const runRealTimeSimulation = useCallback(async (scenarioConfig?: any) => {
    try {
      const simulationEngine = new RealTimeSimulationEngine({
        updateInterval: 5000,
        maxScenarios: 5,
        autoOptimization: true,
        enableStreaming: false,
        performanceMode: 'balanced'
      });

      const scenario = scenarioConfig || {
        id: 'baseline',
        name: '기본 시나리오',
        parameters: {
          marketGrowth: 1.0,
          competitionLevel: 1.0,
          resourceEfficiency: 1.0,
          teamProductivity: 1.0
        },
        externalFactors: {},
        timeHorizon: 90
      };

      const simulationResult = await simulationEngine.runScenario(scenario, currentScores);
      console.log('⚡ Real-time simulation completed:', simulationResult.projectedScores);

      return simulationResult;
    } catch (error) {
      console.error('Real-time simulation error:', error);
      return null;
    }
  }, [currentScores]);

  /**
   * Phase 8: 고급 예측 시스템 실행
   */
  const runAdvancedPrediction = useCallback(async () => {
    try {
      const predictionSystem = new AdvancedPredictionSystem({
        enableEnsemble: true,
        enableAutoML: true,
        enableSeasonality: true,
        enableExternalData: false,
        updateInterval: 300000, // 5분
        maxModels: 5,
        accuracyThreshold: 0.8,
        retrainingInterval: 86400000 // 24시간
      });

      const predictionData = historicalData.map(d => ({
        timestamp: d.timestamp,
        features: d.scores,
        target: Object.values(d.scores).reduce((sum, v) => sum + v, 0) / 5
      }));

      const prediction = await predictionSystem.predict(predictionData, 30); // 30일 예측
      console.log('📊 Advanced prediction completed with confidence:', prediction.confidence);

      return prediction;
    } catch (error) {
      console.error('Advanced prediction error:', error);
      return null;
    }
  }, [historicalData]);

  /**
   * 모든 AI 분석 실행 (Phase 8 통합 버전)
   */
  const runFullAnalysis = useCallback(async () => {
    if (!enabled) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Phase 1: 기본 분석 (병렬 실행)
      const [patterns, anomalies] = await Promise.all([
        runPatternRecognition(),
        runAnomalyDetection()
      ]);

      // Phase 2: Phase 8 고급 분석 (병렬 실행)
      const [advancedAI, realTimeSimulation, advancedPrediction] = await Promise.all([
        runAdvancedAIAnalysis(),
        runRealTimeSimulation(),
        runAdvancedPrediction()
      ]);

      // Phase 3: NLP 인사이트 생성 (Phase 8 결과 포함)
      const nlpInsights = await generateNLPInsights(patterns, anomalies);

      // Phase 4: 기존 시스템 분석 (백그라운드에서)
      const [basicSimulations, basicPredictions, goalCalculations] = await Promise.all([
        runMonteCarloSimulation(),
        runPrediction(),
        calculateGoalRequirements()
      ]);

      // Phase 8 결과와 기존 결과 통합
      const enhancedState = {
        patterns,
        anomalies,
        nlpInsights: [
          ...nlpInsights,
          ...(advancedAI?.insights || [])
        ],
        simulations: {
          basic: basicSimulations,
          realTime: realTimeSimulation,
          advanced: advancedAI?.predictions
        },
        predictions: {
          basic: basicPredictions,
          advanced: advancedPrediction,
          ensemble: advancedAI?.predictions
        },
        goalCalculations: {
          basic: goalCalculations,
          riskAssessment: advancedAI?.riskAssessment,
          recommendations: advancedAI?.recommendations
        },
        isLoading: false,
        error: null
      };

      setState(enhancedState);

      console.log('✅ All AI analyses completed successfully (Phase 8 enhanced)');
      console.log('📊 Advanced insights:', enhancedState.nlpInsights.length);
      console.log('⚡ Real-time simulation:', !!realTimeSimulation);
      console.log('🔮 Advanced prediction confidence:', advancedPrediction?.confidence);
    } catch (error) {
      console.error('AI analysis error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'AI 분석 중 오류 발생'
      }));
    }
  }, [
    enabled,
    runPatternRecognition,
    runAnomalyDetection,
    generateNLPInsights,
    runMonteCarloSimulation,
    runPrediction,
    calculateGoalRequirements,
    runAdvancedAIAnalysis,
    runRealTimeSimulation,
    runAdvancedPrediction
  ]);

  // 초기 실행 및 데이터 변경 시 재실행
  useEffect(() => {
    if (enabled && Object.keys(currentScores).length > 0) {
      runFullAnalysis();
    }
  }, [enabled, JSON.stringify(currentScores)]); // currentScores 변경 감지

  /**
   * 수동 새로고침
   */
  const refresh = useCallback(() => {
    runFullAnalysis();
  }, [runFullAnalysis]);

  /**
   * 특정 분석만 실행
   */
  const runSpecificAnalysis = useCallback(async (type: 'pattern' | 'anomaly' | 'simulation' | 'prediction' | 'goal') => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      switch (type) {
        case 'pattern':
          const patterns = await runPatternRecognition();
          setState(prev => ({ ...prev, patterns, isLoading: false }));
          break;
        case 'anomaly':
          const anomalies = await runAnomalyDetection();
          setState(prev => ({ ...prev, anomalies, isLoading: false }));
          break;
        case 'simulation':
          const simulations = await runMonteCarloSimulation();
          setState(prev => ({ ...prev, simulations, isLoading: false }));
          break;
        case 'prediction':
          const predictions = await runPrediction();
          setState(prev => ({ ...prev, predictions, isLoading: false }));
          break;
        case 'goal':
          const goalCalculations = await calculateGoalRequirements();
          setState(prev => ({ ...prev, goalCalculations, isLoading: false }));
          break;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: `${type} 분석 실패`
      }));
    }
  }, [
    runPatternRecognition,
    runAnomalyDetection,
    runMonteCarloSimulation,
    runPrediction,
    calculateGoalRequirements
  ]);

  return {
    ...state,
    refresh,
    runSpecificAnalysis,
    calculateGoalRequirements,
    // Phase 8 메소드들 추가
    runAdvancedAIAnalysis,
    runRealTimeSimulation,
    runAdvancedPrediction,
    runFullAnalysis
  };
};