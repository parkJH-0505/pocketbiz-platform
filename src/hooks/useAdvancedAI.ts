/**
 * Advanced AI Hook - Phase 8
 * 모든 AI 서비스를 통합하여 고도화된 분석을 제공하는 훅
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AxisKey } from '../pages/startup/kpi-tabs/ResultsInsightsPanelV2/types';
import { getAIOrchestrator } from '../services/ai/AIOrchestrator';
import { getRealTimeSimulationEngine } from '../services/simulation/RealTimeSimulationEngine';
import { getAdvancedPredictionSystem } from '../services/prediction/AdvancedPredictionSystem';

// 통합 AI 상태
export interface AdvancedAIState {
  // 기본 상태
  isLoading: boolean;
  error: string | null;
  lastUpdate: number;

  // AI 분석 결과
  orchestratorResult: any | null;
  simulationResults: any[];
  predictionResult: any | null;

  // 통합 인사이트
  integratedInsights: IntegratedInsight[];
  riskAssessment: RiskAssessment;
  recommendations: Recommendation[];
  alertsAndNotifications: Alert[];

  // 성능 메트릭
  performanceMetrics: {
    totalAnalysisTime: number;
    serviceUptime: Record<string, number>;
    accuracy: Record<string, number>;
    cacheHitRate: number;
  };
}

// 통합 인사이트
export interface IntegratedInsight {
  id: string;
  type: 'pattern' | 'anomaly' | 'prediction' | 'simulation' | 'trend' | 'correlation';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  affectedAxes: AxisKey[];
  confidence: number;
  actionable: boolean;
  recommendations: string[];
  source: string; // 어떤 AI 서비스에서 나온 인사이트인지
  timestamp: number;
}

// 리스크 평가
export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  categories: {
    operational: number;
    financial: number;
    strategic: number;
    external: number;
  };
  topRisks: Array<{
    name: string;
    probability: number;
    impact: number;
    timeframe: 'immediate' | 'short' | 'medium' | 'long';
    mitigation: string[];
  }>;
  trends: {
    increasing: string[];
    decreasing: string[];
    stable: string[];
  };
}

// 추천사항
export interface Recommendation {
  id: string;
  type: 'optimize' | 'hedge' | 'focus' | 'monitor' | 'strategic';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: string;
  requiredResources: string[];
  timeframe: string;
  successMetrics: string[];
  dependencies: string[];
  confidence: number;
  source: string;
}

// 알림
export interface Alert {
  id: string;
  type: 'threshold' | 'anomaly' | 'prediction' | 'system';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  acknowledged: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

// 훅 설정
export interface UseAdvancedAIConfig {
  enableRealTimeSimulation: boolean;
  enableAdvancedPrediction: boolean;
  autoRefreshInterval: number; // ms
  maxInsights: number;
  riskThresholds: {
    low: number;
    medium: number;
    high: number;
  };
}

/**
 * 고도화된 AI 분석 훅
 */
export const useAdvancedAI = (
  currentScores: Record<AxisKey, number>,
  historicalData: Array<{ timestamp: number; scores: Record<AxisKey, number> }> = [],
  config?: Partial<UseAdvancedAIConfig>
) => {
  const defaultConfig: UseAdvancedAIConfig = {
    enableRealTimeSimulation: true,
    enableAdvancedPrediction: true,
    autoRefreshInterval: 30000, // 30초
    maxInsights: 20,
    riskThresholds: {
      low: 30,
      medium: 60,
      high: 80
    }
  };

  const finalConfig = { ...defaultConfig, ...config };

  const [state, setState] = useState<AdvancedAIState>({
    isLoading: false,
    error: null,
    lastUpdate: 0,
    orchestratorResult: null,
    simulationResults: [],
    predictionResult: null,
    integratedInsights: [],
    riskAssessment: {
      overallRisk: 'low',
      riskScore: 0,
      categories: { operational: 0, financial: 0, strategic: 0, external: 0 },
      topRisks: [],
      trends: { increasing: [], decreasing: [], stable: [] }
    },
    recommendations: [],
    alertsAndNotifications: [],
    performanceMetrics: {
      totalAnalysisTime: 0,
      serviceUptime: {},
      accuracy: {},
      cacheHitRate: 0
    }
  });

  // 서비스 인스턴스
  const orchestrator = useRef(getAIOrchestrator());
  const simulationEngine = useRef(
    finalConfig.enableRealTimeSimulation ? getRealTimeSimulationEngine() : null
  );
  const predictionSystem = useRef(
    finalConfig.enableAdvancedPrediction ? getAdvancedPredictionSystem() : null
  );

  const autoRefreshTimer = useRef<NodeJS.Timeout | null>(null);

  /**
   * 전체 AI 분석 실행
   */
  const runComprehensiveAnalysis = useCallback(async (): Promise<void> => {
    if (!currentScores || Object.keys(currentScores).length === 0) {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    const startTime = Date.now();

    try {
      console.log('🤖 Starting comprehensive AI analysis...');

      // 1. AI Orchestrator 실행
      const orchestratorResult = await orchestrator.current.runAnalysis({
        currentScores,
        historicalData,
        analysisType: 'full',
        options: {
          includePrediction: true,
          includeSimulation: true,
          includeGoalCalculation: true
        }
      });

      // 2. 실시간 시뮬레이션 (활성화된 경우)
      let simulationResults: any[] = [];
      if (simulationEngine.current) {
        simulationEngine.current.updateCurrentScores(currentScores);
        simulationResults = simulationEngine.current.getResults();
      }

      // 3. 고급 예측 (활성화된 경우)
      let predictionResult: any = null;
      if (predictionSystem.current && historicalData.length > 0) {
        predictionResult = await predictionSystem.current.predict(historicalData, 30);
      }

      // 4. 결과 통합 및 인사이트 생성
      const integratedInsights = generateIntegratedInsights(
        orchestratorResult,
        simulationResults,
        predictionResult
      );

      // 5. 리스크 평가
      const riskAssessment = assessIntegratedRisk(
        orchestratorResult,
        simulationResults,
        predictionResult,
        finalConfig.riskThresholds
      );

      // 6. 추천사항 생성
      const recommendations = generateRecommendations(
        integratedInsights,
        riskAssessment,
        currentScores
      );

      // 7. 알림 생성
      const alerts = generateAlerts(integratedInsights, riskAssessment);

      // 8. 성능 메트릭 수집
      const performanceMetrics = collectPerformanceMetrics(
        startTime,
        orchestratorResult,
        simulationResults,
        predictionResult
      );

      setState(prev => ({
        ...prev,
        isLoading: false,
        lastUpdate: Date.now(),
        orchestratorResult,
        simulationResults,
        predictionResult,
        integratedInsights: integratedInsights.slice(0, finalConfig.maxInsights),
        riskAssessment,
        recommendations,
        alertsAndNotifications: [...prev.alertsAndNotifications, ...alerts].slice(-10),
        performanceMetrics
      }));

      console.log(`✅ Comprehensive AI analysis completed in ${Date.now() - startTime}ms`);

    } catch (error) {
      console.error('Comprehensive AI analysis failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '분석 중 오류가 발생했습니다'
      }));
    }
  }, [currentScores, historicalData, finalConfig]);

  /**
   * 특정 분석만 실행
   */
  const runSpecificAnalysis = useCallback(async (
    type: 'orchestrator' | 'simulation' | 'prediction'
  ): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      switch (type) {
        case 'orchestrator':
          const orchestratorResult = await orchestrator.current.runAnalysis({
            currentScores,
            historicalData,
            analysisType: 'quick'
          });
          setState(prev => ({ ...prev, orchestratorResult, isLoading: false }));
          break;

        case 'simulation':
          if (simulationEngine.current) {
            simulationEngine.current.updateCurrentScores(currentScores);
            const simulationResults = simulationEngine.current.getResults();
            setState(prev => ({ ...prev, simulationResults, isLoading: false }));
          }
          break;

        case 'prediction':
          if (predictionSystem.current && historicalData.length > 0) {
            const predictionResult = await predictionSystem.current.predict(historicalData, 14);
            setState(prev => ({ ...prev, predictionResult, isLoading: false }));
          }
          break;
      }
    } catch (error) {
      console.error(`${type} analysis failed:`, error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: `${type} 분석 실패`
      }));
    }
  }, [currentScores, historicalData]);

  /**
   * 알림 확인 처리
   */
  const acknowledgeAlert = useCallback((alertId: string): void => {
    setState(prev => ({
      ...prev,
      alertsAndNotifications: prev.alertsAndNotifications.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    }));
  }, []);

  /**
   * 알림 모두 확인
   */
  const acknowledgeAllAlerts = useCallback((): void => {
    setState(prev => ({
      ...prev,
      alertsAndNotifications: prev.alertsAndNotifications.map(alert => ({
        ...alert,
        acknowledged: true
      }))
    }));
  }, []);

  /**
   * 캐시 클리어
   */
  const clearCache = useCallback((): void => {
    orchestrator.current.clearCache();
    console.log('🧹 AI cache cleared');
  }, []);

  /**
   * 시스템 상태 조회
   */
  const getSystemStatus = useCallback(() => {
    return {
      orchestrator: {
        running: true,
        performance: orchestrator.current.getPerformanceStats()
      },
      simulation: simulationEngine.current ? {
        running: true,
        scenarios: simulationEngine.current.getResults().length
      } : null,
      prediction: predictionSystem.current ? {
        running: true,
        models: predictionSystem.current.getModels().length
      } : null
    };
  }, []);

  // 컴포넌트 마운트/언마운트 및 자동 새로고침
  useEffect(() => {
    // 초기 분석 실행
    if (Object.keys(currentScores).length > 0) {
      runComprehensiveAnalysis();
    }

    // 자동 새로고침 설정
    if (finalConfig.autoRefreshInterval > 0) {
      autoRefreshTimer.current = setInterval(() => {
        if (Object.keys(currentScores).length > 0) {
          runComprehensiveAnalysis();
        }
      }, finalConfig.autoRefreshInterval);
    }

    // 실시간 시뮬레이션 시작
    if (simulationEngine.current) {
      simulationEngine.current.start();
    }

    // 고급 예측 시스템 시작
    if (predictionSystem.current) {
      predictionSystem.current.start();
    }

    return () => {
      if (autoRefreshTimer.current) {
        clearInterval(autoRefreshTimer.current);
      }
      if (simulationEngine.current) {
        simulationEngine.current.stop();
      }
      if (predictionSystem.current) {
        predictionSystem.current.stop();
      }
    };
  }, [runComprehensiveAnalysis, finalConfig.autoRefreshInterval]);

  // 점수 변경 감지
  useEffect(() => {
    if (Object.keys(currentScores).length > 0) {
      // 시뮬레이션 엔진에 새 점수 업데이트
      if (simulationEngine.current) {
        simulationEngine.current.updateCurrentScores(currentScores);
      }
    }
  }, [JSON.stringify(currentScores)]);

  return {
    // 상태
    ...state,

    // 액션
    runComprehensiveAnalysis,
    runSpecificAnalysis,
    acknowledgeAlert,
    acknowledgeAllAlerts,
    clearCache,
    getSystemStatus,

    // 유틸리티
    isHealthy: !state.error && state.lastUpdate > 0,
    hasUnacknowledgedAlerts: state.alertsAndNotifications.some(alert => !alert.acknowledged),
    criticalAlertsCount: state.alertsAndNotifications.filter(
      alert => alert.severity === 'critical' && !alert.acknowledged
    ).length
  };
};

/**
 * 헬퍼 함수들
 */

function generateIntegratedInsights(
  orchestratorResult: any,
  simulationResults: any[],
  predictionResult: any
): IntegratedInsight[] {
  const insights: IntegratedInsight[] = [];

  // Orchestrator 결과에서 인사이트 추출
  if (orchestratorResult) {
    // 패턴 인사이트
    orchestratorResult.patterns?.forEach((pattern: any, index: number) => {
      insights.push({
        id: `pattern_${index}`,
        type: 'pattern',
        severity: 'info',
        title: '패턴 감지',
        description: pattern.description || `패턴이 감지되었습니다`,
        affectedAxes: pattern.axes || ['GO'],
        confidence: pattern.confidence || 0.7,
        actionable: true,
        recommendations: [`${pattern.type} 패턴을 활용한 최적화 검토`],
        source: 'orchestrator',
        timestamp: Date.now()
      });
    });

    // 이상치 인사이트
    orchestratorResult.anomalies?.forEach((anomaly: any, index: number) => {
      insights.push({
        id: `anomaly_${index}`,
        type: 'anomaly',
        severity: 'warning',
        title: '이상치 감지',
        description: anomaly.description || '정상 범위를 벗어난 값이 감지되었습니다',
        affectedAxes: [anomaly.axis] || ['GO'],
        confidence: anomaly.confidence || 0.8,
        actionable: true,
        recommendations: ['즉시 원인 분석 필요', '모니터링 강화'],
        source: 'orchestrator',
        timestamp: Date.now()
      });
    });
  }

  // 시뮬레이션 결과에서 인사이트 추출
  simulationResults?.forEach((result: any, index: number) => {
    result.risks?.forEach((risk: any, riskIndex: number) => {
      insights.push({
        id: `sim_risk_${index}_${riskIndex}`,
        type: 'simulation',
        severity: risk.severity === 'high' ? 'critical' : 'warning',
        title: '시뮬레이션 리스크',
        description: risk.description,
        affectedAxes: risk.affectedAxes,
        confidence: risk.probability,
        actionable: true,
        recommendations: risk.mitigation || [],
        source: 'simulation',
        timestamp: Date.now()
      });
    });

    result.opportunities?.forEach((opportunity: any, oppIndex: number) => {
      insights.push({
        id: `sim_opp_${index}_${oppIndex}`,
        type: 'simulation',
        severity: 'info',
        title: '성장 기회',
        description: opportunity.description,
        affectedAxes: opportunity.affectedAxes,
        confidence: opportunity.probability,
        actionable: true,
        recommendations: opportunity.requirements || [],
        source: 'simulation',
        timestamp: Date.now()
      });
    });
  });

  // 예측 결과에서 인사이트 추출
  if (predictionResult) {
    predictionResult.trends && Object.entries(predictionResult.trends.direction).forEach(([axis, direction]: [string, any]) => {
      if (direction !== 'stable') {
        insights.push({
          id: `pred_trend_${axis}`,
          type: 'trend',
          severity: direction === 'decreasing' ? 'warning' : 'info',
          title: `${axis} 축 트렌드`,
          description: `${axis} 축이 ${direction === 'increasing' ? '상승' : '하락'} 추세입니다`,
          affectedAxes: [axis as AxisKey],
          confidence: predictionResult.trends.strength[axis] || 0.7,
          actionable: true,
          recommendations: [
            direction === 'increasing' ? '성장 모멘텀 유지' : '하락 요인 분석 및 대응'
          ],
          source: 'prediction',
          timestamp: Date.now()
        });
      }
    });

    predictionResult.anomalies?.forEach((anomaly: any, index: number) => {
      insights.push({
        id: `pred_anomaly_${index}`,
        type: 'prediction',
        severity: anomaly.severity === 'high' ? 'critical' : 'warning',
        title: '예측 이상치',
        description: anomaly.description,
        affectedAxes: [anomaly.axis],
        confidence: anomaly.probability,
        actionable: true,
        recommendations: ['예측 모델 재검토', '외부 요인 분석'],
        source: 'prediction',
        timestamp: Date.now()
      });
    });
  }

  // 신뢰도 순으로 정렬
  return insights.sort((a, b) => b.confidence - a.confidence);
}

function assessIntegratedRisk(
  orchestratorResult: any,
  simulationResults: any[],
  predictionResult: any,
  thresholds: { low: number; medium: number; high: number }
): RiskAssessment {
  let totalRiskScore = 0;
  const risks: any[] = [];

  // 각 소스에서 리스크 수집
  const allRisks = [
    ...(orchestratorResult?.anomalies || []),
    ...(simulationResults?.flatMap(r => r.risks || []) || []),
    ...(predictionResult?.anomalies || [])
  ];

  // 리스크 점수 계산
  allRisks.forEach(risk => {
    const impact = typeof risk.impact === 'number' ? risk.impact * 100 :
                  risk.severity === 'critical' ? 90 :
                  risk.severity === 'high' ? 70 :
                  risk.severity === 'medium' ? 50 : 30;

    const probability = risk.probability || 0.5;
    const riskContribution = impact * probability;

    totalRiskScore += riskContribution;

    risks.push({
      name: risk.description || risk.title || 'Unknown Risk',
      probability,
      impact: impact / 100,
      timeframe: 'short' as const,
      mitigation: risk.mitigation || ['리스크 모니터링']
    });
  });

  // 정규화 (최대 100점)
  const normalizedScore = Math.min(100, totalRiskScore / Math.max(1, allRisks.length));

  // 위험 수준 결정
  const overallRisk = normalizedScore > thresholds.high ? 'critical' :
                     normalizedScore > thresholds.medium ? 'high' :
                     normalizedScore > thresholds.low ? 'medium' : 'low';

  return {
    overallRisk,
    riskScore: normalizedScore,
    categories: {
      operational: normalizedScore * 0.3,
      financial: normalizedScore * 0.25,
      strategic: normalizedScore * 0.25,
      external: normalizedScore * 0.2
    },
    topRisks: risks.sort((a, b) => (b.impact * b.probability) - (a.impact * a.probability)).slice(0, 5),
    trends: {
      increasing: allRisks.filter(r => r.trend === 'increasing').map(r => r.name || 'Unknown'),
      decreasing: allRisks.filter(r => r.trend === 'decreasing').map(r => r.name || 'Unknown'),
      stable: allRisks.filter(r => r.trend === 'stable').map(r => r.name || 'Unknown')
    }
  };
}

function generateRecommendations(
  insights: IntegratedInsight[],
  riskAssessment: RiskAssessment,
  currentScores: Record<AxisKey, number>
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // 위험 수준에 따른 추천
  if (riskAssessment.overallRisk === 'critical' || riskAssessment.overallRisk === 'high') {
    recommendations.push({
      id: 'risk_mitigation',
      type: 'hedge',
      priority: 'high',
      title: '긴급 리스크 완화',
      description: '높은 위험 수준이 감지되었습니다. 즉시 리스크 완화 조치가 필요합니다.',
      expectedImpact: '리스크 수준 20-30% 감소',
      requiredResources: ['리스크 분석팀', '즉시 대응 예산'],
      timeframe: '1-2주',
      successMetrics: ['리스크 점수 감소', '핵심 KPI 안정화'],
      dependencies: [],
      confidence: 0.8,
      source: 'integrated_analysis'
    });
  }

  // 낮은 성과 축에 대한 추천
  const lowPerformingAxes = Object.entries(currentScores)
    .filter(([_, score]) => score < 60)
    .map(([axis, _]) => axis as AxisKey);

  if (lowPerformingAxes.length > 0) {
    recommendations.push({
      id: 'improve_low_axes',
      type: 'focus',
      priority: 'high',
      title: '저성과 영역 집중 개선',
      description: `${lowPerformingAxes.join(', ')} 영역의 성과 개선이 시급합니다.`,
      expectedImpact: '해당 영역 20-30% 성과 향상',
      requiredResources: ['전담 개선팀', '개선 예산'],
      timeframe: '4-6주',
      successMetrics: [`${lowPerformingAxes.join(', ')} 점수 70점 이상 달성`],
      dependencies: ['리소스 할당', '실행 계획 수립'],
      confidence: 0.75,
      source: 'score_analysis'
    });
  }

  // 패턴 기반 추천
  const patternInsights = insights.filter(i => i.type === 'pattern');
  if (patternInsights.length > 0) {
    recommendations.push({
      id: 'leverage_patterns',
      type: 'optimize',
      priority: 'medium',
      title: '패턴 활용 최적화',
      description: '감지된 패턴을 활용하여 성과를 최적화할 수 있습니다.',
      expectedImpact: '전체 성과 10-15% 향상',
      requiredResources: ['데이터 분석팀'],
      timeframe: '2-3주',
      successMetrics: ['패턴 기반 성과 개선', 'KPI 안정성 향상'],
      dependencies: ['패턴 분석 완료'],
      confidence: 0.7,
      source: 'pattern_analysis'
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

function generateAlerts(
  insights: IntegratedInsight[],
  riskAssessment: RiskAssessment
): Alert[] {
  const alerts: Alert[] = [];

  // 심각한 인사이트에 대한 알림
  const criticalInsights = insights.filter(i => i.severity === 'critical');
  criticalInsights.forEach(insight => {
    alerts.push({
      id: `alert_${insight.id}`,
      type: 'anomaly',
      severity: 'critical',
      title: insight.title,
      message: insight.description,
      timestamp: insight.timestamp,
      acknowledged: false
    });
  });

  // 높은 리스크에 대한 알림
  if (riskAssessment.overallRisk === 'critical') {
    alerts.push({
      id: 'critical_risk_alert',
      type: 'threshold',
      severity: 'critical',
      title: '심각한 리스크 수준',
      message: `전체 리스크 점수가 ${riskAssessment.riskScore.toFixed(1)}점으로 심각한 수준입니다.`,
      timestamp: Date.now(),
      acknowledged: false
    });
  }

  return alerts;
}

function collectPerformanceMetrics(
  startTime: number,
  orchestratorResult: any,
  simulationResults: any[],
  predictionResult: any
): any {
  const totalTime = Date.now() - startTime;

  return {
    totalAnalysisTime: totalTime,
    serviceUptime: {
      orchestrator: orchestratorResult ? 100 : 0,
      simulation: simulationResults.length > 0 ? 100 : 0,
      prediction: predictionResult ? 100 : 0
    },
    accuracy: {
      orchestrator: orchestratorResult?.performance?.overall || 0,
      prediction: predictionResult?.predictionQuality?.overall || 0
    },
    cacheHitRate: orchestratorResult?.performance?.cacheHits || 0
  };
}