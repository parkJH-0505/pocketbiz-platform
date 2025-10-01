/**
 * KPI 진단 컨텍스트
 * 5개 탭 간 데이터 공유 및 상태 관리
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useCluster } from './ClusterContext';
import { assessmentStorage } from '../utils/storage';
import { loadKPIData } from '../data/kpiLoader';
import { calculateAxisScore } from '../utils/csvScoring';
import { trackKpiUpdate, updateSessionActivity } from '../services/momentumTracker';
import { 
  saveDiagnosticSnapshot, 
  getWeeklyChange, 
  getMonthlyTrend,
  getAxisChanges,
  getPreviousSnapshot
} from '../utils/diagnosticHistory';
import type { KPIResponse, AxisKey, KPIDefinition, ClusterInfo } from '../types';

interface KPIDiagnosisContextType {
  // Assessment data
  responses: Record<string, KPIResponse>;
  setResponses: React.Dispatch<React.SetStateAction<Record<string, KPIResponse>>>;
  updateResponse: (kpiId: string, response: KPIResponse) => void;
  
  // KPI data
  kpiData: {
    libraries: KPIDefinition[];
    stageRules: Map<string, any>;
    inputFields: Map<string, any>;
  } | null;
  isLoadingKPI: boolean;
  
  // Scores
  axisScores: Record<AxisKey, number>;
  overallScore: number;
  previousScores: Record<AxisKey, number>;
  
  // Progress
  progress: {
    completed: number;
    total: number;
    percentage: number;
    byAxis: Record<AxisKey, { completed: number; total: number }>;
  };
  
  // Tab completion status
  tabCompletion: {
    assess: boolean;
    results: boolean;
    analysis: boolean;
    benchmark: boolean;
    action: boolean;
  };
  
  // Actions
  saveResponses: () => void;
  resetAssessment: () => void;
  refreshData: () => Promise<void>;
  
  // Run management
  currentRunId: string | null;
  lastSaved: Date | null;
}

const KPIDiagnosisContext = createContext<KPIDiagnosisContextType | undefined>(undefined);

export const useKPIDiagnosis = () => {
  const context = useContext(KPIDiagnosisContext);
  if (!context) {
    throw new Error('useKPIDiagnosis must be used within KPIDiagnosisProvider');
  }
  return context;
};

interface KPIDiagnosisProviderProps {
  children: ReactNode;
}

export const KPIDiagnosisProvider: React.FC<KPIDiagnosisProviderProps> = ({ children }) => {
  const { cluster } = useCluster();
  
  // Core states
  const [responses, setResponses] = useState<Record<string, KPIResponse>>({});
  const [kpiData, setKpiData] = useState<any>(null);
  const [isLoadingKPI, setIsLoadingKPI] = useState(true);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Calculated states
  const [axisScores, setAxisScores] = useState<Record<AxisKey, number>>({
    GO: 0, EC: 0, PT: 0, PF: 0, TO: 0
  });
  const [overallScore, setOverallScore] = useState(0);
  const [previousScores, setPreviousScores] = useState<Record<AxisKey, number>>({
    GO: 0, EC: 0, PT: 0, PF: 0, TO: 0
  });
  
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
  
  // Load KPI data
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingKPI(true);
      try {
        const data = await loadKPIData();
        setKpiData(data);
        console.log('KPI data loaded in context:', {
          totalKPIs: data.libraries.length,
          currentStage: cluster.stage
        });
      } catch (error) {
        console.error('Failed to load KPI data:', error);
      } finally {
        setIsLoadingKPI(false);
      }
    };
    
    loadData();
  }, [cluster.stage]);
  
  // Load saved responses
  useEffect(() => {
    const runId = assessmentStorage.getCurrentRunId();
    if (runId) {
      setCurrentRunId(runId);
      const savedResponses = assessmentStorage.getResponses(runId);
      if (savedResponses) {
        setResponses(savedResponses);
        setLastSaved(new Date());
      }
    }
  }, []);
  
  // Calculate scores when responses or data changes
  useEffect(() => {
    if (!kpiData) {
      setAxisScores({ GO: 0, EC: 0, PT: 0, PF: 0, TO: 0 });
      setOverallScore(0);
      return;
    }
    
    const newScores: Record<AxisKey, number> = { GO: 0, EC: 0, PT: 0, PF: 0, TO: 0 };
    
    axes.forEach(axis => {
      const score = calculateAxisScore(
        axis,
        responses,
        kpiData.libraries,
        kpiData.stageRules,
        cluster.stage
      );
      newScores[axis] = score;
    });
    
    console.log('Axis scores calculated:', newScores);
    setAxisScores(newScores);
    
    // Calculate overall score
    const avgScore = Object.values(newScores).reduce((sum, score) => sum + score, 0) / 5;
    const roundedScore = Math.round(avgScore * 10) / 10;
    setOverallScore(roundedScore);

    // 모멘텀 시스템을 위해 KPI 평균 점수 저장
    localStorage.setItem('kpi-average-score', roundedScore.toString());
    
    // 이전 진단 결과에서 가져오기
    const previousSnapshot = getPreviousSnapshot();
    if (previousSnapshot) {
      setPreviousScores(previousSnapshot.scores.axes);
    } else {
      // 첫 진단인 경우 0으로 초기화
      setPreviousScores({ GO: 0, EC: 0, PT: 0, PF: 0, TO: 0 });
    }
    
    // 자동 저장 제거 - 수동 저장으로 변경
    // 사용자가 명시적으로 저장 버튼을 눌렀을 때만 저장
  }, [responses, kpiData, cluster.stage]);
  
  // Calculate progress with useMemo for real-time updates
  const progress = useMemo(() => {
    if (!kpiData) return { 
      completed: 0, 
      total: 0, 
      percentage: 0,
      byAxis: { GO: { completed: 0, total: 0 }, EC: { completed: 0, total: 0 }, PT: { completed: 0, total: 0 }, PF: { completed: 0, total: 0 }, TO: { completed: 0, total: 0 } }
    };
    
    const applicableKPIs = kpiData.libraries.filter((kpi: KPIDefinition) => 
      kpi.applicable_stages?.includes(cluster.stage)
    );
    const completed = applicableKPIs.filter((kpi: KPIDefinition) => responses[kpi.kpi_id]).length;
    
    // Calculate by axis
    const byAxis: Record<AxisKey, { completed: number; total: number }> = {
      GO: { completed: 0, total: 0 },
      EC: { completed: 0, total: 0 },
      PT: { completed: 0, total: 0 },
      PF: { completed: 0, total: 0 },
      TO: { completed: 0, total: 0 }
    };
    
    axes.forEach(axis => {
      const axisKPIs = applicableKPIs.filter((kpi: KPIDefinition) => kpi.axis === axis);
      const axisCompleted = axisKPIs.filter((kpi: KPIDefinition) => responses[kpi.kpi_id]).length;
      byAxis[axis] = { completed: axisCompleted, total: axisKPIs.length };
    });
    
    console.log('Progress calculated:', {
      completed,
      total: applicableKPIs.length,
      percentage: applicableKPIs.length > 0 ? Math.round((completed / applicableKPIs.length) * 100) : 0
    });
    
    return {
      completed,
      total: applicableKPIs.length,
      percentage: applicableKPIs.length > 0 ? Math.round((completed / applicableKPIs.length) * 100) : 0,
      byAxis
    };
  }, [responses, kpiData, cluster.stage]);
  
  // Calculate tab completion status
  const tabCompletion = {
    assess: progress.percentage >= 100,
    results: progress.percentage >= 50, // Can view partial results
    analysis: progress.percentage >= 50,
    benchmark: progress.percentage >= 50,
    action: progress.percentage >= 80
  };
  
  // Actions
  const updateResponse = (kpiId: string, response: KPIResponse) => {
    console.log('KPIDiagnosisContext - updateResponse called:', kpiId, response);

    // 모멘텀 시스템에 KPI 업데이트 추적
    trackKpiUpdate(kpiId);
    updateSessionActivity();

    setResponses(prev => {
      const newResponses = {
        ...prev,
        [kpiId]: response
      };
      console.log('KPIDiagnosisContext - New responses:', Object.keys(newResponses).length, 'items');
      return newResponses;
    });
  };
  
  const saveResponses = () => {
    const runId = currentRunId || assessmentStorage.createRun(cluster);
    if (!currentRunId) setCurrentRunId(runId);
    assessmentStorage.saveResponses(runId, responses);
    setLastSaved(new Date());
  };
  
  const resetAssessment = () => {
    if (window.confirm('정말로 모든 평가를 초기화하시겠습니까?')) {
      setResponses({});
      const newRunId = assessmentStorage.createRun(cluster);
      setCurrentRunId(newRunId);
      setLastSaved(null);
    }
  };
  
  const refreshData = async () => {
    setIsLoadingKPI(true);
    try {
      const data = await loadKPIData();
      setKpiData(data);
    } catch (error) {
      console.error('Failed to refresh KPI data:', error);
    } finally {
      setIsLoadingKPI(false);
    }
  };
  
  // Auto-save
  useEffect(() => {
    if (Object.keys(responses).length === 0) return;
    
    const timer = setTimeout(() => {
      saveResponses();
    }, 2000); // 2초 디바운스
    
    return () => clearTimeout(timer);
  }, [responses]);
  
  const value: KPIDiagnosisContextType = {
    responses,
    setResponses,
    updateResponse,
    kpiData,
    isLoadingKPI,
    axisScores,
    overallScore,
    previousScores,
    progress,
    tabCompletion,
    saveResponses,
    resetAssessment,
    refreshData,
    currentRunId,
    lastSaved
  };
  
  return (
    <KPIDiagnosisContext.Provider value={value}>
      {children}
    </KPIDiagnosisContext.Provider>
  );
};