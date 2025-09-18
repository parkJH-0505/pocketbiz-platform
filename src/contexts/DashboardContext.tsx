/**
 * Dashboard Context
 *
 * 대시보드 상태 관리를 위한 React Context
 * - 기존 KPI/Buildup/SmartMatching Context와 연동
 * - "매일 만나고 싶은 성장 동반자" 철학 구현
 */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { startOfWeek, addDays } from 'date-fns';
import type {
  DashboardContextType,
  TodaysAction,
  CalendarEvent,
  GrowthStatus,
  GrowthInsights,
  DashboardError,
  DashboardPreferences
} from '../types/dashboard';

// 실제 컨텍스트 연동
import { useKPIDiagnosis } from './KPIDiagnosisContext';
import { useBuildupContext } from './BuildupContext';

// 액션 생성 로직
import { generateTodaysAction, type KPIAnalysisData } from '../utils/dashboard/actionGenerator';

// 인사이트 생성 로직
import { generateOpportunityInsight } from '../services/dashboard/opportunityService';

// 초기 상태
const initialPreferences: DashboardPreferences = {
  enableNotifications: true,
  preferredActionTime: 'morning',
  difficultyPreference: 'balanced',
  weekStartsOn: 1, // 월요일
  compactView: false,
  autoRefresh: true
};

// 컨텍스트 생성
const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Provider Props
interface DashboardProviderProps {
  children: ReactNode;
}

/**
 * DashboardProvider
 *
 * 실제 KPI/Buildup/SmartMatching Context와 완전 연동
 */
export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  // 기존 컨텍스트 연동
  const kpiContext = useKPIDiagnosis();
  const buildupContext = useBuildupContext();

  // 상태 관리
  const [isLoading, setIsLoading] = useState(false); // KPI 데이터 로딩 상태 사용
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [error, setError] = useState<DashboardError | null>(null);
  const [preferences, setPreferences] = useState<DashboardPreferences>(initialPreferences);
  const [opportunityInsight, setOpportunityInsight] = useState<any>(null);

  // 실제 KPI 데이터 기반 액션 생성
  const todaysAction = useMemo<TodaysAction | null>(() => {
    // KPI 데이터가 로딩 중이거나 없으면 null 반환
    if (kpiContext.isLoadingKPI || !kpiContext.kpiData) {
      return null;
    }

    try {
      // KPI 분석 데이터 구성
      const kpiAnalysisData: KPIAnalysisData = {
        axisScores: kpiContext.axisScores,
        responses: kpiContext.responses,
        progress: kpiContext.progress,
        previousScores: kpiContext.previousScores
      };

      // 스마트 액션 생성
      return generateTodaysAction(kpiAnalysisData);
    } catch (err) {
      console.error('액션 생성 중 오류:', err);

      // 폴백 액션
      return {
        id: 'fallback-action',
        title: 'KPI 진단 시작하기',
        description: 'KPI 진단을 통해 현재 상태를 파악해보세요',
        estimatedTime: '10분',
        motivation: '첫 번째 단계가 가장 중요해요',
        actionType: 'kpi',
        actionUrl: '/startup/kpi',
        priority: 'high',
        impact: {
          expectedPoints: 15,
          timeToComplete: 10,
          difficulty: 'easy',
          confidence: 0.9
        }
      };
    }
  }, [
    kpiContext.axisScores,
    kpiContext.responses,
    kpiContext.progress,
    kpiContext.previousScores,
    kpiContext.isLoadingKPI,
    kpiContext.kpiData
  ]);

  // 캘린더 이벤트 생성 (실제 프로젝트에서는 API에서 가져옴)
  const mockWeeklySchedule: CalendarEvent[] = useMemo(() => [
    // 오늘
    {
      id: 'event-001',
      date: new Date(),
      type: 'checkup',
      title: 'KPI 현황 체크',
      description: '기술역량(PT) 영역 집중 업데이트',
      estimatedTime: '15분',
      tone: '지난 주 대비 어떤 변화가 있었는지 확인해볼까요?',
      priority: 'high',
      isCompleted: false,
      actionUrl: '/startup/kpi'
    },
    {
      id: 'event-002',
      date: new Date(),
      type: 'celebration',
      title: '소상공인 지원사업 선정 🎉',
      description: '축하해요! 첫 번째 정부지원사업에 선정되었어요',
      estimatedTime: '5분',
      tone: '정말 대단해요! 이 멘텀을 이어가세요',
      priority: 'high',
      isCompleted: true
    },

    // 내일
    {
      id: 'event-003',
      date: addDays(new Date(), 1),
      type: 'planning',
      title: 'Q4 제품 로드맵 계획',
      description: '기술 스택 검토 및 개발 우선순위 정리',
      estimatedTime: '45분',
      tone: '차근차근 계획을 세워보면 길이 보일 거예요',
      priority: 'high',
      isCompleted: false,
      actionUrl: '/startup/buildup'
    },

    // 모레
    {
      id: 'event-004',
      date: addDays(new Date(), 2),
      type: 'opportunity',
      title: '딥테크 스타트업 지원사업',
      description: '매칭률 92% • 정부지원사업',
      estimatedTime: '30분',
      tone: '괜찮은 기회 같은데, 시간 될 때 한번 보세요',
      priority: 'medium',
      isCompleted: false,
      metadata: {
        matchRate: 92,
        opportunityId: 'deeptech-support-2024'
      },
      actionUrl: '/startup/smart-matching'
    },
    {
      id: 'event-005',
      date: addDays(new Date(), 2),
      type: 'reminder',
      title: '팀 회의 준비',
      description: '주간 스프린트 리뷰 자료 준비',
      estimatedTime: '20분',
      tone: '팀과 함께 성장하는 시간이에요',
      priority: 'medium',
      isCompleted: false
    },

    // 3일 후
    {
      id: 'event-006',
      date: addDays(new Date(), 3),
      type: 'exploration',
      title: 'AI 기술 트렌드 탐색',
      description: '최신 AI 동향 및 적용 가능성 검토',
      estimatedTime: '60분',
      tone: '새로운 기술을 배우는 즐거움을 만끽해보세요',
      priority: 'low',
      isCompleted: false
    },

    // 4일 후
    {
      id: 'event-007',
      date: addDays(new Date(), 4),
      type: 'checkup',
      title: '주간 성과 리뷰',
      description: '이번 주 달성한 목표들을 되돌아보고 축하해요',
      estimatedTime: '25분',
      tone: '작은 성취도 모두 소중해요. 축하해요!',
      priority: 'medium',
      isCompleted: false
    },

    // 5일 후
    {
      id: 'event-008',
      date: addDays(new Date(), 5),
      type: 'opportunity',
      title: '스타트업 네트워킹 이벤트',
      description: '동종업계 창업자들과의 만남의 기회',
      estimatedTime: '2시간',
      tone: '새로운 인연과 기회가 기다리고 있어요',
      priority: 'medium',
      isCompleted: false,
      metadata: {
        matchRate: 85
      }
    },

    // 다음 주 월요일
    {
      id: 'event-009',
      date: addDays(new Date(), 7),
      type: 'planning',
      title: '새로운 주 목표 설정',
      description: '지난 주 성과를 바탕으로 새로운 목표를 세워보세요',
      estimatedTime: '30분',
      tone: '새로운 한 주도 함께 성장해나가요!',
      priority: 'high',
      isCompleted: false
    },

    // 과거 이벤트 (완료된 것들)
    {
      id: 'event-010',
      date: addDays(new Date(), -1),
      type: 'checkup',
      title: '어제의 KPI 체크',
      description: '비즈니스 모델(BM) 영역 업데이트 완료',
      estimatedTime: '20분',
      tone: '어제도 수고하셨어요!',
      priority: 'medium',
      isCompleted: true
    },
    {
      id: 'event-011',
      date: addDays(new Date(), -2),
      type: 'exploration',
      title: '시장 조사 완료',
      description: '경쟁사 분석 및 시장 포지셔닝 연구',
      estimatedTime: '90분',
      tone: '정말 꼼꼼하게 조사하셨네요!',
      priority: 'high',
      isCompleted: true
    }
  ], []);

  const mockGrowthStatus: GrowthStatus = {
    level: {
      current: {
        name: "성장기",
        icon: "🌿",
        description: "기반을 단단히 다지고 있어요",
        color: "emerald",
        range: [30, 50]
      },
      score: 42.5,
      progress: {
        current: 12.5,
        total: 20,
        percentage: 62
      },
      next: {
        name: "발전기",
        requiredScore: 50,
        pointsNeeded: 7.5,
        estimatedTimeToReach: "1개월 내"
      }
    },
    strengths: [
      {
        axis: 'PT',
        axisName: '제품·기술력',
        score: 68,
        percentile: 75,
        status: 'strong',
        message: '훌륭한 강점이에요! 이 부분을 더욱 발전시켜보세요.',
        trend: 'up',
        improvement: 8
      }
    ],
    improvements: [
      {
        axis: 'EC',
        axisName: '경제성과',
        currentScore: 32,
        potentialGain: 15,
        priority: 'high',
        suggestedActions: [
          '월별 재무제표 작성 및 분석 시스템 구축',
          '매출 증대를 위한 마케팅 전략 수립',
          '비용 절감 방안 검토 및 실행'
        ],
        timeframe: '1개월 내'
      },
      {
        axis: 'GO',
        axisName: '경영관리',
        currentScore: 38,
        potentialGain: 12,
        priority: 'medium',
        suggestedActions: [
          '업무 프로세스 표준화 및 문서화',
          '팀 커뮤니케이션 도구 도입',
          '정기 회의 체계 수립'
        ],
        timeframe: '3주 내'
      }
    ],
    recentProgress: {
      period: '지난 2주',
      changes: [],
      highlights: [],
      totalImprovement: 8
    },
    celebration: {
      type: 'improvement',
      icon: '📈',
      title: '성장 중!',
      message: '제품·기술력 영역이 +8점 향상됐어요!',
      subMessage: '이 속도면 목표 달성이 금세일 것 같아요.',
      action: {
        text: '다음 목표 확인하기',
        url: '/startup/kpi'
      }
    },
    insights: []
  };

  // 초기 로딩 시뮬레이션
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setIsLoading(true);

        // 로컬 스토리지에서 설정 불러오기
        const savedPreferences = localStorage.getItem('dashboard_preferences');
        if (savedPreferences) {
          setPreferences(JSON.parse(savedPreferences));
        }

        // 사용자 활동 기록 초기화
        const existingEvents = localStorage.getItem('dashboard_events');
        if (!existingEvents) {
          localStorage.setItem('dashboard_events', JSON.stringify([]));
        }

        // 기회 인사이트 생성
        const oppInsight = generateOpportunityInsight();
        setOpportunityInsight(oppInsight);

        // 시뮬레이션 지연
        await new Promise(resolve => setTimeout(resolve, 800));

        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        setError({
          type: 'unknown',
          message: '대시보드를 불러오는 중 오류가 발생했습니다.',
          details: err instanceof Error ? err.message : String(err),
          timestamp: new Date(),
          recoverable: true
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  // 액션 함수들
  const updateTodaysAction = async () => {
    try {
      setIsLoading(true);
      // Phase 2에서 실제 데이터 생성 로직 구현 예정
      await new Promise(resolve => setTimeout(resolve, 500));
      setLastUpdated(new Date());
    } catch (err) {
      setError({
        type: 'data',
        message: '액션을 업데이트하는 중 오류가 발생했습니다.',
        details: err instanceof Error ? err.message : String(err),
        timestamp: new Date(),
        recoverable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const days = direction === 'next' ? 7 : -7;
    setCurrentWeek(prev => addDays(prev, days));
  };

  const markActionCompleted = async (actionId: string) => {
    try {
      // 완료 기록 저장
      const completionData = {
        actionId,
        completedAt: new Date().toISOString(),
        completionTime: Date.now() - parseInt(localStorage.getItem('action_start_time') || '0')
      };

      const existingEvents = JSON.parse(localStorage.getItem('dashboard_events') || '[]');
      existingEvents.push({
        type: 'action_completed',
        data: completionData
      });
      localStorage.setItem('dashboard_events', JSON.stringify(existingEvents));

      // 다음 액션 생성
      await updateTodaysAction();
    } catch (err) {
      console.error('액션 완료 처리 중 오류:', err);
    }
  };

  const markEventCompleted = async (eventId: string) => {
    try {
      const completionData = {
        eventId,
        completedAt: new Date().toISOString()
      };

      const existingEvents = JSON.parse(localStorage.getItem('dashboard_events') || '[]');
      existingEvents.push({
        type: 'event_completed',
        data: completionData
      });
      localStorage.setItem('dashboard_events', JSON.stringify(existingEvents));
    } catch (err) {
      console.error('이벤트 완료 처리 중 오류:', err);
    }
  };

  const refreshData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 모든 데이터 새로고침
      await Promise.all([
        updateTodaysAction(),
        // Phase 2에서 다른 데이터 소스들도 추가
      ]);

      setLastUpdated(new Date());
    } catch (err) {
      setError({
        type: 'network',
        message: '데이터를 새로고침하는 중 오류가 발생했습니다.',
        details: err instanceof Error ? err.message : String(err),
        timestamp: new Date(),
        recoverable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = (newPreferences: Partial<DashboardPreferences>) => {
    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);
    localStorage.setItem('dashboard_preferences', JSON.stringify(updatedPreferences));
  };

  // 실제 로딩 상태 (KPI 데이터 로딩 포함)
  const actualIsLoading = kpiContext.isLoadingKPI || isLoading;

  // Growth Insights 생성
  const growthInsights = useMemo(() => {
    if (!opportunityInsight) return null;

    return {
      personal: null as any, // 삭제됨
      benchmark: null as any, // 삭제됨
      opportunity: opportunityInsight, // Day 15-16 구현 완료
      lastUpdated: new Date(),
      confidence: 0.85 // 기본 신뢰도
    };
  }, [opportunityInsight]);

  // Memoized context value
  const contextValue = useMemo<DashboardContextType>(() => ({
    // 상태
    todaysAction,
    weeklySchedule: mockWeeklySchedule, // Phase 2에서 실제 데이터로 교체 예정
    growthStatus: mockGrowthStatus, // Phase 2에서 실제 데이터로 교체 예정
    growthInsights, // Phase 2 Day 12-13 구현 중
    currentWeek,
    isLoading: actualIsLoading,
    lastUpdated,
    error,

    // 액션
    updateTodaysAction,
    navigateWeek,
    markActionCompleted,
    markEventCompleted,
    refreshData,

    // 설정
    preferences,
    updatePreferences
  }), [
    todaysAction,
    currentWeek,
    actualIsLoading,
    lastUpdated,
    error,
    preferences,
    growthInsights
  ]);

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};

/**
 * useDashboard Hook
 *
 * 대시보드 컨텍스트를 사용하기 위한 훅
 */
export const useDashboard = () => {
  const context = useContext(DashboardContext);

  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }

  return context;
};

export default DashboardContext;