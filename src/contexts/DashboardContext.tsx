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
import { useScheduleContext } from './ScheduleContext';
import { useNotifications } from './NotificationContext';

// 액션 생성 로직
import { generateTodaysAction, type KPIAnalysisData } from '../utils/dashboard/actionGenerator';

// 인사이트 생성 로직
import { generateOpportunityInsight } from '../services/dashboard/opportunityService';

// Mock 빌드업 스케줄 데이터 import
import { generateMockBuildupSchedule } from '../data/mockBuildupSchedule';

// 스케줄 데이터 변환 함수
function convertSchedulesToCalendarEvents(schedules: any[]): CalendarEvent[] {
  return schedules.map(schedule => ({
    id: schedule.id,
    date: new Date(schedule.scheduledAt),
    type: convertScheduleTypeToEventType(schedule.type),
    title: schedule.title,
    description: schedule.description || generateEventDescription(schedule),
    estimatedTime: schedule.duration ? `${schedule.duration}분` : '30분',
    tone: generateEventTone(schedule),
    priority: convertSchedulePriority(schedule),
    isCompleted: schedule.status === 'completed',
    actionUrl: generateActionUrl(schedule),
    metadata: {
      scheduleId: schedule.id,
      originalType: schedule.type
    }
  }));
}

function convertScheduleTypeToEventType(scheduleType: string): CalendarEvent['type'] {
  const typeMap: Record<string, CalendarEvent['type']> = {
    'buildup_project_meeting': 'checkup',
    'mentor_session': 'planning',
    'webinar': 'exploration',
    'pm_consultation': 'checkup',
    'external_meeting': 'opportunity',
    'general': 'reminder'
  };
  return typeMap[scheduleType] || 'reminder';
}

function generateEventDescription(schedule: any): string {
  switch (schedule.type) {
    case 'buildup_project_meeting':
      return `프로젝트 ${schedule.projectPhase || '진행'} 단계 미팅`;
    case 'mentor_session':
      return `성장 멘토링 세션 - ${schedule.topic || '일반상담'}`;
    case 'webinar':
      return `웨비나 참여 - ${schedule.topic || '지식 습득'}`;
    default:
      return schedule.description || '일정 확인';
  }
}

function generateEventTone(schedule: any): string {
  const tones = [
    '함께 성장하는 시간이에요',
    '새로운 인사이트를 얻어보세요',
    '차근차근 준비해보면 될 거예요',
    '좋은 기회가 될 것 같아요',
    '성장에 도움이 되는 시간입니다'
  ];
  return tones[Math.floor(Math.random() * tones.length)];
}

function convertSchedulePriority(schedule: any): CalendarEvent['priority'] {
  if (schedule.priority === 'urgent') return 'high';
  if (schedule.priority === 'high') return 'high';
  if (schedule.priority === 'low') return 'low';
  return 'medium';
}

function generateActionUrl(schedule: any): string {
  switch (schedule.type) {
    case 'buildup_project_meeting':
      return '/startup/buildup';
    case 'mentor_session':
      return '/startup/kpi';
    case 'webinar':
      return '/startup/smart-matching';
    default:
      return '/startup/dashboard';
  }
}

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
  const scheduleContext = useScheduleContext();
  const notificationContext = useNotifications();

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

  // KPI 변화 감지 및 자동 알림 생성 (의존성 최적화)
  useEffect(() => {
    if (!kpiContext.axisScores || !kpiContext.previousScores) return;

    // 최초 렌더링 시에는 알림 생성하지 않음
    const isFirstRender = localStorage.getItem('dashboard_kpi_initialized') !== 'true';
    if (isFirstRender) {
      localStorage.setItem('dashboard_kpi_initialized', 'true');
      return;
    }

    const axes = ['GO', 'EC', 'PT', 'PF', 'TO'] as const;

    axes.forEach(axis => {
      const currentScore = kpiContext.axisScores[axis];
      const previousScore = kpiContext.previousScores[axis];
      const improvement = currentScore - previousScore;

      // 80점 이상 달성 알림
      if (currentScore >= 80 && previousScore < 80) {
        notificationContext.addNotification({
          type: 'kpi_milestone',
          title: 'KPI 마일스톤 달성! 🎉',
          message: `${axis}축에서 80점을 달성했습니다. 정말 대단해요!`,
          priority: 'high'
        });
      }

      // 10점 이상 상승 알림
      if (improvement >= 10) {
        notificationContext.addNotification({
          type: 'achievement',
          title: '큰 성장 달성! 📈',
          message: `${axis}축이 ${improvement.toFixed(1)}점 상승했습니다. 멋진 발전이에요!`,
          priority: 'medium'
        });
      }

      // 5점 이상 하락 경고
      if (improvement <= -5) {
        notificationContext.addNotification({
          type: 'alert',
          title: '주의가 필요해요 ⚠️',
          message: `${axis}축 점수가 ${Math.abs(improvement).toFixed(1)}점 하락했습니다. 원인을 확인해보세요.`,
          priority: 'medium'
        });
      }
    });

    // 전체 점수 90점 이상 달성
    const overallScore = Object.values(kpiContext.axisScores).reduce((sum, score) => sum + score, 0) / 5;
    const previousOverallScore = Object.values(kpiContext.previousScores).reduce((sum, score) => sum + score, 0) / 5;

    if (overallScore >= 90 && previousOverallScore < 90) {
      notificationContext.addNotification({
        type: 'achievement',
        title: '🏆 최고 등급 달성!',
        message: `전체 KPI 점수가 90점을 넘었습니다! 놀라운 성과예요!`,
        priority: 'high'
      });
    }
    // notificationContext를 의존성에서 제거하여 무한 루프 방지
  }, [kpiContext.axisScores, kpiContext.previousScores, notificationContext.addNotification]);

  // 실제 KPI 기반 성장 상태 계산
  const realGrowthStatus: GrowthStatus = useMemo(() => {
    if (!kpiContext.axisScores) {
      // 기본 성장 상태 반환
      return {
        level: {
          current: {
            name: "새싹 단계",
            icon: "🌱",
            description: "성장의 첫 걸음을 시작해요",
            color: "green",
            range: [0, 40]
          },
          score: 0,
          progress: { current: 0, total: 100, percentage: 0 },
          next: {
            name: "성장기",
            icon: "🌿",
            requiredScore: 40,
            remainingPoints: 40
          }
        },
        recentAchievements: [],
        weeklyChange: 0,
        strongestAreas: [],
        improvementAreas: []
      };
    }

    // 전체 평균 점수 계산
    const overallScore = Object.values(kpiContext.axisScores).reduce((sum, score) => sum + score, 0) / 5;
    const previousOverallScore = Object.values(kpiContext.previousScores).reduce((sum, score) => sum + score, 0) / 5;
    const weeklyChange = overallScore - previousOverallScore;

    // 레벨 결정 로직
    const getLevelInfo = (score: number) => {
      if (score >= 90) return {
        name: "엘리트",
        icon: "🏆",
        description: "업계 최고 수준의 성과를 보이고 있어요",
        color: "yellow",
        range: [90, 100] as [number, number]
      };
      if (score >= 75) return {
        name: "성숙기",
        icon: "🚀",
        description: "안정적이고 지속적인 성장을 이루고 있어요",
        color: "purple",
        range: [75, 90] as [number, number]
      };
      if (score >= 60) return {
        name: "도약기",
        icon: "📈",
        description: "빠른 성장과 발전을 보여주고 있어요",
        color: "blue",
        range: [60, 75] as [number, number]
      };
      if (score >= 40) return {
        name: "성장기",
        icon: "🌿",
        description: "기반을 단단히 다지며 성장하고 있어요",
        color: "green",
        range: [40, 60] as [number, number]
      };
      return {
        name: "새싹 단계",
        icon: "🌱",
        description: "성장의 첫 걸음을 시작해요",
        color: "green",
        range: [0, 40] as [number, number]
      };
    };

    const currentLevel = getLevelInfo(overallScore);
    const nextThreshold = currentLevel.range[1];
    const currentInRange = overallScore - currentLevel.range[0];
    const rangeSize = currentLevel.range[1] - currentLevel.range[0];
    const progressPercentage = Math.min(100, (currentInRange / rangeSize) * 100);

    // 다음 레벨 정보
    const getNextLevel = (currentScore: number) => {
      if (currentScore >= 90) return null; // 최고 레벨
      if (currentScore >= 75) return { name: "엘리트", icon: "🏆", requiredScore: 90 };
      if (currentScore >= 60) return { name: "성숙기", icon: "🚀", requiredScore: 75 };
      if (currentScore >= 40) return { name: "도약기", icon: "📈", requiredScore: 60 };
      return { name: "성장기", icon: "🌿", requiredScore: 40 };
    };

    const nextLevel = getNextLevel(overallScore);

    // 강점/개선 영역 분석
    const axisNames = { GO: '성장전략', EC: '경제성', PT: '기술력', PF: '검증력', TO: '팀워크' };
    const axisEntries = Object.entries(kpiContext.axisScores) as [keyof typeof kpiContext.axisScores, number][];

    const strongestAreas = axisEntries
      .filter(([_, score]) => score >= 70)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([axis, score]) => ({
        area: axisNames[axis],
        score,
        trend: 'up' as const
      }));

    const improvementAreas = axisEntries
      .filter(([_, score]) => score < 60)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 3)
      .map(([axis, score]) => ({
        area: axisNames[axis],
        score,
        suggestion: `${axisNames[axis]} 영역의 개선이 필요해요`
      }));

    // 최근 성취 (KPI 상승 기반)
    const recentAchievements = axisEntries
      .map(([axis, current]) => {
        const previous = kpiContext.previousScores[axis];
        const improvement = current - previous;
        if (improvement >= 5) {
          return {
            title: `${axisNames[axis]} 영역 개선`,
            description: `${improvement.toFixed(1)}점 상승`,
            date: new Date(),
            type: 'kpi_improvement' as const
          };
        }
        return null;
      })
      .filter((achievement): achievement is NonNullable<typeof achievement> => achievement !== null);

    return {
      level: {
        current: currentLevel,
        score: overallScore,
        progress: {
          current: Math.round(currentInRange),
          total: rangeSize,
          percentage: Math.round(progressPercentage)
        },
        next: nextLevel ? {
          ...nextLevel,
          remainingPoints: nextLevel.requiredScore - overallScore
        } : undefined
      },
      recentAchievements,
      weeklyChange: Math.round(weeklyChange * 10) / 10,
      strongestAreas,
      improvementAreas
    };
  }, [kpiContext.axisScores, kpiContext.previousScores]);

  // 폴백용 Mock 데이터 - 빌드업 일정 포함
  const mockFallbackSchedule: CalendarEvent[] = useMemo(() => [
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
    // 빌드업 일정 - 오늘
    {
      id: 'buildup-001',
      date: new Date(),
      type: 'checkup',
      title: 'PM 정기 미팅',
      description: '프로젝트 진행상황 점검 및 다음 단계 논의',
      estimatedTime: '60분',
      tone: 'PM과 함께 프로젝트를 점검해보세요',
      priority: 'critical',
      isCompleted: false,
      actionUrl: '/startup/buildup',
      time: '14:00',
      projectId: 'project-001',
      projectTitle: 'AI 기반 스타트업 성장 플랫폼',
      pmName: '김성장 PM',
      meetingType: 'progress_check',
      status: 'scheduled'
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
    // 빌드업 일정 - 내일
    {
      id: 'buildup-002',
      date: addDays(new Date(), 1),
      type: 'planning',
      title: '기술 멘토링 세션',
      description: '아키텍처 설계 리뷰 및 기술 스택 최적화',
      estimatedTime: '90분',
      tone: '멘토와 함께 기술적 난제를 해결해보세요',
      priority: 'high',
      isCompleted: false,
      actionUrl: '/startup/buildup',
      time: '10:00',
      projectId: 'project-001',
      projectTitle: 'AI 기반 스타트업 성장 플랫폼',
      pmName: '이개발 멘토',
      meetingType: 'mentoring',
      status: 'scheduled'
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
    // 빌드업 일정 - 3일 후
    {
      id: 'buildup-003',
      date: addDays(new Date(), 3),
      type: 'checkup',
      title: '프로젝트 중간 점검',
      description: 'MVP 개발 진행사항 확인 및 품질 검토',
      estimatedTime: '45분',
      tone: '목표를 향해 잘 가고 있는지 확인해보세요',
      priority: 'medium',
      isCompleted: false,
      actionUrl: '/startup/buildup',
      time: '15:00',
      projectId: 'project-001',
      projectTitle: 'AI 기반 스타트업 성장 플랫폼',
      pmName: '김성장 PM',
      meetingType: 'milestone_review',
      status: 'scheduled'
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
    // 빌드업 일정 - 4일 후
    {
      id: 'buildup-004',
      date: addDays(new Date(), 4),
      type: 'planning',
      title: '투자 전략 워크샵',
      description: 'IR 자료 준비 및 투자 유치 전략 수립',
      estimatedTime: '120분',
      tone: '투자 유치를 위한 전략을 함께 고민해보세요',
      priority: 'high',
      isCompleted: false,
      actionUrl: '/startup/buildup',
      time: '13:00',
      projectId: 'project-002',
      projectTitle: '시리즈 A 투자 유치',
      pmName: '박투자 PM',
      meetingType: 'strategy_session',
      status: 'scheduled'
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

  // 실제 스케줄 데이터를 캘린더 이벤트로 변환
  const weeklySchedule: CalendarEvent[] = useMemo(() => {
    try {
      // 실제 스케줄 데이터가 있으면 사용
      if (scheduleContext?.schedules && scheduleContext.schedules.length > 0) {
        const realEvents = convertSchedulesToCalendarEvents(scheduleContext.schedules);
        console.log('실제 스케줄 데이터 사용:', realEvents.length, '개');
        return realEvents;
      }

      // 폴백: Mock 데이터 사용 (기존 fallback + 빌드업 스케줄)
      const buildupSchedule = generateMockBuildupSchedule();
      const combinedSchedule = [...mockFallbackSchedule, ...buildupSchedule];
      console.log('Mock 스케줄 데이터 사용 (빌드업 포함):', combinedSchedule.length, '개');
      return combinedSchedule;
    } catch (error) {
      console.error('스케줄 데이터 변환 오류:', error);
      return mockFallbackSchedule;
    }
  }, [scheduleContext?.schedules, mockFallbackSchedule]);

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

        // 프로덕션에서는 지연 없이, 개발 환경에서만 짧은 지연
        if (import.meta.env.DEV) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

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

  const navigateWeek = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentWeek(new Date());
    } else {
      const days = direction === 'next' ? 7 : -7;
      setCurrentWeek(prev => addDays(prev, days));
    }
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
    weeklySchedule, // 실제 스케줄 데이터 연동 완료
    growthStatus: realGrowthStatus, // 실제 KPI 기반 성장 상태 연동 완료
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
    weeklySchedule,
    realGrowthStatus,
    growthInsights,
    currentWeek,
    actualIsLoading,
    lastUpdated,
    error,
    preferences
  ]);

  // GlobalContextManager에 등록
  useEffect(() => {
    // Window 객체에 노출
    if (typeof window !== 'undefined') {
      window.dashboardContext = contextValue;

      // GlobalContextManager에 등록
      import('../utils/globalContextManager').then(({ contextManager }) => {
        contextManager.register('dashboard', contextValue, {
          name: 'dashboard',
          version: '1.0.0',
          description: 'Dashboard data and interaction context',
          dependencies: ['schedule', 'kpi'],
          isReady: true
        });
      }).catch(error => {
        console.warn('GlobalContextManager registration failed:', error);
      });
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.dashboardContext;
      }
    };
  }, [contextValue]);

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