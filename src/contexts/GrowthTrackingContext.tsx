import React, { createContext, useContext, useState, useEffect } from 'react';
import { useKPIDiagnosis } from './KPIDiagnosisContext';
import { useCluster } from './ClusterContext';
import type { AxisKey } from '../types';

// 성장 지표 타입 정의
export interface GrowthMetric {
  date: Date;
  overallScore: number;
  axisScores: Record<AxisKey, number>;
  stage: string;
  completionRate: number;
}

export interface GrowthMilestone {
  id: string;
  title: string;
  description: string;
  targetScore: number;
  targetDate: Date;
  status: 'pending' | 'achieved' | 'overdue';
  achievedDate?: Date;
  icon?: string;
}

export interface GrowthGoal {
  id: string;
  axis?: AxisKey;
  targetValue: number;
  currentValue: number;
  deadline: Date;
  priority: 'high' | 'medium' | 'low';
  description: string;
  actionItems: string[];
}

export interface StageTransition {
  fromStage: string;
  toStage: string;
  date: Date;
  scoreAtTransition: number;
  daysInStage: number;
}

interface GrowthTrackingContextType {
  metrics: GrowthMetric[];
  milestones: GrowthMilestone[];
  goals: GrowthGoal[];
  transitions: StageTransition[];

  // 예측 및 분석
  predictedNextStageDate: Date | null;
  growthRate: number; // 월간 성장률
  improvementAreas: { axis: AxisKey; gap: number; trend: 'improving' | 'declining' | 'stable' }[];

  // 메서드
  addMetric: (metric: GrowthMetric) => void;
  setGoal: (goal: GrowthGoal) => void;
  updateGoalProgress: (goalId: string, currentValue: number) => void;
  getProgressToNextStage: () => number;
  getTimeInCurrentStage: () => number;
}

const GrowthTrackingContext = createContext<GrowthTrackingContextType | undefined>(undefined);

export const useGrowthTracking = () => {
  const context = useContext(GrowthTrackingContext);
  if (!context) {
    throw new Error('useGrowthTracking must be used within GrowthTrackingProvider');
  }
  return context;
};

export const GrowthTrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { overallScore, axisScores, progress } = useKPIDiagnosis();
  const { cluster } = useCluster();

  const [metrics, setMetrics] = useState<GrowthMetric[]>([]);
  const [milestones, setMilestones] = useState<GrowthMilestone[]>([]);
  const [goals, setGoals] = useState<GrowthGoal[]>([]);
  const [transitions, setTransitions] = useState<StageTransition[]>([]);

  // 샘플 과거 데이터 생성
  useEffect(() => {
    const generateHistoricalData = () => {
      const historicalMetrics: GrowthMetric[] = [];
      const today = new Date();

      // 최근 6개월 데이터 생성
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - i);

        // 점진적으로 증가하는 점수 시뮬레이션
        const baseScore = overallScore - (i * 3) + Math.random() * 2;

        historicalMetrics.push({
          date,
          overallScore: Math.max(0, Math.min(100, baseScore)),
          axisScores: {
            GO: Math.max(0, (axisScores.GO || 70) - (i * 2.5) + Math.random() * 3),
            EC: Math.max(0, (axisScores.EC || 65) - (i * 2.8) + Math.random() * 3),
            PT: Math.max(0, (axisScores.PT || 75) - (i * 2.2) + Math.random() * 3),
            PF: Math.max(0, (axisScores.PF || 68) - (i * 2.6) + Math.random() * 3),
            TO: Math.max(0, (axisScores.TO || 72) - (i * 2.4) + Math.random() * 3),
          },
          stage: i > 3 ? 'A-2' : cluster.stage,
          completionRate: Math.min(100, 60 + (6 - i) * 6),
        });
      }

      setMetrics(historicalMetrics);
    };

    generateHistoricalData();

    // 샘플 마일스톤 생성
    const sampleMilestones: GrowthMilestone[] = [
      {
        id: 'm1',
        title: 'Seed 라운드 준비',
        description: 'KPI 점수 75점 달성',
        targetScore: 75,
        targetDate: new Date('2024-03-31'),
        status: overallScore >= 75 ? 'achieved' : 'pending',
        icon: '🎯',
      },
      {
        id: 'm2',
        title: 'Series A 진입',
        description: 'A-3 단계 진입 및 85점 달성',
        targetScore: 85,
        targetDate: new Date('2024-06-30'),
        status: 'pending',
        icon: '🚀',
      },
      {
        id: 'm3',
        title: '유니콘 준비',
        description: '모든 축 90점 이상',
        targetScore: 90,
        targetDate: new Date('2024-12-31'),
        status: 'pending',
        icon: '🦄',
      },
    ];
    setMilestones(sampleMilestones);

    // 샘플 목표 생성
    const sampleGoals: GrowthGoal[] = [
      {
        id: 'g1',
        axis: 'GO',
        targetValue: 80,
        currentValue: axisScores.GO || 70,
        deadline: new Date('2024-02-29'),
        priority: 'high',
        description: 'Growth & Ops 점수 80점 달성',
        actionItems: [
          'MAU 30% 증가',
          '시장 확장 전략 수립',
          '판매 프로세스 최적화',
        ],
      },
      {
        id: 'g2',
        axis: 'EC',
        targetValue: 75,
        currentValue: axisScores.EC || 65,
        deadline: new Date('2024-03-31'),
        priority: 'medium',
        description: 'Economics 점수 75점 달성',
        actionItems: [
          '단위 경제성 개선',
          '매출 성장률 20% 달성',
          '비용 구조 최적화',
        ],
      },
    ];
    setGoals(sampleGoals);

    // 샘플 단계 전환 기록
    const sampleTransitions: StageTransition[] = [
      {
        fromStage: 'A-1',
        toStage: 'A-2',
        date: new Date('2023-06-15'),
        scoreAtTransition: 65,
        daysInStage: 180,
      },
      {
        fromStage: 'A-2',
        toStage: 'A-3',
        date: new Date('2023-12-01'),
        scoreAtTransition: 72,
        daysInStage: 168,
      },
    ];
    setTransitions(sampleTransitions);
  }, [overallScore, axisScores, cluster.stage]);

  // 성장률 계산
  const calculateGrowthRate = (): number => {
    if (metrics.length < 2) return 0;

    const recent = metrics[metrics.length - 1];
    const previous = metrics[Math.max(0, metrics.length - 4)]; // 3개월 전

    if (!previous) return 0;

    const monthsDiff = 3;
    const scoreDiff = recent.overallScore - previous.overallScore;

    return (scoreDiff / monthsDiff);
  };

  // 개선 영역 분석
  const analyzeImprovementAreas = () => {
    if (metrics.length < 2) return [];

    const recent = metrics[metrics.length - 1];
    const previous = metrics[Math.max(0, metrics.length - 4)];

    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

    return axes.map(axis => {
      const currentScore = recent.axisScores[axis];
      const previousScore = previous?.axisScores[axis] || currentScore;
      const targetScore = 85; // 목표 점수

      const gap = targetScore - currentScore;
      const change = currentScore - previousScore;

      let trend: 'improving' | 'declining' | 'stable';
      if (change > 1) trend = 'improving';
      else if (change < -1) trend = 'declining';
      else trend = 'stable';

      return { axis, gap, trend };
    }).sort((a, b) => b.gap - a.gap);
  };

  // 다음 단계 예상 날짜 계산
  const predictNextStageDate = (): Date | null => {
    const growthRate = calculateGrowthRate();
    if (growthRate <= 0) return null;

    const currentScore = overallScore;
    const targetScore = 85; // 다음 단계 목표 점수
    const gap = targetScore - currentScore;

    if (gap <= 0) return null;

    const monthsNeeded = gap / growthRate;
    const predictedDate = new Date();
    predictedDate.setMonth(predictedDate.getMonth() + Math.ceil(monthsNeeded));

    return predictedDate;
  };

  // 다음 단계까지 진행률
  const getProgressToNextStage = (): number => {
    const stageThresholds = {
      'A-1': 60,
      'A-2': 70,
      'A-3': 80,
      'A-4': 85,
      'A-5': 90,
    };

    const currentStageScore = stageThresholds[cluster.stage as keyof typeof stageThresholds] || 60;
    const nextStageScore = currentStageScore + 10;

    const progress = ((overallScore - currentStageScore) / (nextStageScore - currentStageScore)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  // 현재 단계 체류 기간
  const getTimeInCurrentStage = (): number => {
    const lastTransition = transitions[transitions.length - 1];
    if (!lastTransition) return 0;

    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - lastTransition.date.getTime()) / (1000 * 60 * 60 * 24));

    return daysDiff;
  };

  // 메트릭 추가
  const addMetric = (metric: GrowthMetric) => {
    setMetrics(prev => [...prev, metric]);
  };

  // 목표 설정
  const setGoal = (goal: GrowthGoal) => {
    setGoals(prev => [...prev.filter(g => g.id !== goal.id), goal]);
  };

  // 목표 진행상황 업데이트
  const updateGoalProgress = (goalId: string, currentValue: number) => {
    setGoals(prev => prev.map(g =>
      g.id === goalId ? { ...g, currentValue } : g
    ));
  };

  const value: GrowthTrackingContextType = {
    metrics,
    milestones,
    goals,
    transitions,
    predictedNextStageDate: predictNextStageDate(),
    growthRate: calculateGrowthRate(),
    improvementAreas: analyzeImprovementAreas(),
    addMetric,
    setGoal,
    updateGoalProgress,
    getProgressToNextStage,
    getTimeInCurrentStage,
  };

  return (
    <GrowthTrackingContext.Provider value={value}>
      {children}
    </GrowthTrackingContext.Provider>
  );
};