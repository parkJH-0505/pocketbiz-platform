/**
 * Mock 빌드업 스케줄 데이터
 *
 * 실제 빌드업 프로젝트 일정 데이터를 시뮬레이션합니다.
 * - PM 미팅
 * - 멘토링 세션
 * - 프로젝트 마일스톤
 * - 투자 관련 미팅
 */

import type { CalendarEvent } from '../types/calendar.types';
import { addDays } from 'date-fns';

// 빌드업 프로젝트 정보
export const buildupProjects = [
  {
    id: 'project-001',
    title: 'AI 기반 스타트업 성장 플랫폼',
    pmName: '김성장 PM',
    phase: 'MVP 개발',
    status: 'active'
  },
  {
    id: 'project-002',
    title: '시리즈 A 투자 유치',
    pmName: '박투자 PM',
    phase: '준비 단계',
    status: 'active'
  },
  {
    id: 'project-003',
    title: 'B2B SaaS 전환',
    pmName: '이전략 PM',
    phase: '계획 수립',
    status: 'planned'
  }
];

// Mock 빌드업 일정 생성 함수
export function generateMockBuildupSchedule(): CalendarEvent[] {
  const today = new Date();

  return [
    // 오늘 일정
    {
      id: 'buildup-001',
      date: today,
      type: 'checkup' as const,
      title: 'PM 정기 미팅',
      description: '프로젝트 진행상황 점검 및 다음 단계 논의',
      estimatedTime: '60분',
      tone: 'PM과 함께 프로젝트를 점검해보세요',
      priority: 'critical' as const,
      isCompleted: false,
      actionUrl: '/startup/buildup',
      time: '14:00',
      projectId: 'project-001',
      projectTitle: 'AI 기반 스타트업 성장 플랫폼',
      pmName: '김성장 PM',
      meetingType: 'progress_check',
      status: 'scheduled'
    },

    // 내일 일정
    {
      id: 'buildup-002',
      date: addDays(today, 1),
      type: 'planning' as const,
      title: '기술 멘토링 세션',
      description: '아키텍처 설계 리뷰 및 기술 스택 최적화',
      estimatedTime: '90분',
      tone: '멘토와 함께 기술적 난제를 해결해보세요',
      priority: 'high' as const,
      isCompleted: false,
      actionUrl: '/startup/buildup',
      time: '10:00',
      projectId: 'project-001',
      projectTitle: 'AI 기반 스타트업 성장 플랫폼',
      pmName: '이개발 멘토',
      meetingType: 'mentoring',
      status: 'scheduled'
    },

    // 2일 후
    {
      id: 'buildup-003',
      date: addDays(today, 2),
      type: 'opportunity' as const,
      title: '네트워킹 세션',
      description: '유관 스타트업 대표들과의 교류',
      estimatedTime: '120분',
      tone: '새로운 인사이트와 협업 기회를 찾아보세요',
      priority: 'medium' as const,
      isCompleted: false,
      actionUrl: '/startup/buildup',
      time: '18:00',
      projectId: 'project-001',
      projectTitle: 'AI 기반 스타트업 성장 플랫폼',
      pmName: '김성장 PM',
      meetingType: 'networking',
      status: 'scheduled'
    },

    // 3일 후
    {
      id: 'buildup-004',
      date: addDays(today, 3),
      type: 'checkup' as const,
      title: '프로젝트 중간 점검',
      description: 'MVP 개발 진행사항 확인 및 품질 검토',
      estimatedTime: '45분',
      tone: '목표를 향해 잘 가고 있는지 확인해보세요',
      priority: 'medium' as const,
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
      id: 'buildup-005',
      date: addDays(today, 4),
      type: 'planning' as const,
      title: '투자 전략 워크샵',
      description: 'IR 자료 준비 및 투자 유치 전략 수립',
      estimatedTime: '120분',
      tone: '투자 유치를 위한 전략을 함께 고민해보세요',
      priority: 'high' as const,
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
      id: 'buildup-006',
      date: addDays(today, 5),
      type: 'exploration' as const,
      title: '시장 조사 결과 리뷰',
      description: 'Target Market 분석 및 고객 페르소나 정의',
      estimatedTime: '60분',
      tone: '시장의 니즈를 정확히 파악해보세요',
      priority: 'medium' as const,
      isCompleted: false,
      actionUrl: '/startup/buildup',
      time: '11:00',
      projectId: 'project-001',
      projectTitle: 'AI 기반 스타트업 성장 플랫폼',
      pmName: '김성장 PM',
      meetingType: 'research_review',
      status: 'scheduled'
    },

    // 다음 주 월요일
    {
      id: 'buildup-007',
      date: addDays(today, 7),
      type: 'checkup' as const,
      title: '주간 프로젝트 리뷰',
      description: '주간 성과 분석 및 다음 주 계획 수립',
      estimatedTime: '90분',
      tone: '한 주를 마무리하고 새로운 주를 준비해보세요',
      priority: 'high' as const,
      isCompleted: false,
      actionUrl: '/startup/buildup',
      time: '10:00',
      projectId: 'project-001',
      projectTitle: 'AI 기반 스타트업 성장 플랫폼',
      pmName: '김성장 PM',
      meetingType: 'weekly_review',
      status: 'scheduled'
    },

    // 다음 주 화요일
    {
      id: 'buildup-008',
      date: addDays(today, 8),
      type: 'opportunity' as const,
      title: 'VC 미팅',
      description: '시리즈 A 투자자 첫 미팅',
      estimatedTime: '90분',
      tone: '투자자와의 첫 만남, 자신감을 가지세요',
      priority: 'critical' as const,
      isCompleted: false,
      actionUrl: '/startup/buildup',
      time: '14:00',
      projectId: 'project-002',
      projectTitle: '시리즈 A 투자 유치',
      pmName: '박투자 PM',
      meetingType: 'investor_meeting',
      status: 'scheduled'
    },

    // 다음 주 수요일
    {
      id: 'buildup-009',
      date: addDays(today, 9),
      type: 'planning' as const,
      title: 'B2B 전환 전략 회의',
      description: 'B2B SaaS 모델 전환을 위한 로드맵 수립',
      estimatedTime: '120분',
      tone: '새로운 비즈니스 모델을 함께 설계해보세요',
      priority: 'high' as const,
      isCompleted: false,
      actionUrl: '/startup/buildup',
      time: '10:00',
      projectId: 'project-003',
      projectTitle: 'B2B SaaS 전환',
      pmName: '이전략 PM',
      meetingType: 'strategy_planning',
      status: 'scheduled'
    },

    // 다음 주 목요일
    {
      id: 'buildup-010',
      date: addDays(today, 10),
      type: 'checkup' as const,
      title: 'MVP 최종 검토',
      description: 'MVP 출시 전 최종 품질 검증 및 체크리스트 확인',
      estimatedTime: '120분',
      tone: 'MVP 출시가 코앞이에요! 마지막 점검을 해보세요',
      priority: 'critical' as const,
      isCompleted: false,
      actionUrl: '/startup/buildup',
      time: '14:00',
      projectId: 'project-001',
      projectTitle: 'AI 기반 스타트업 성장 플랫폼',
      pmName: '김성장 PM',
      meetingType: 'final_review',
      status: 'scheduled'
    },

    // 과거 일정 (완료됨)
    {
      id: 'buildup-past-001',
      date: addDays(today, -1),
      type: 'checkup' as const,
      title: '기술 스택 결정',
      description: 'Frontend/Backend 기술 스택 최종 결정',
      estimatedTime: '60분',
      tone: '중요한 결정을 잘 내리셨어요',
      priority: 'high' as const,
      isCompleted: true,
      actionUrl: '/startup/buildup',
      time: '15:00',
      projectId: 'project-001',
      projectTitle: 'AI 기반 스타트업 성장 플랫폼',
      pmName: '김성장 PM',
      meetingType: 'decision_meeting',
      status: 'completed'
    },

    {
      id: 'buildup-past-002',
      date: addDays(today, -2),
      type: 'planning' as const,
      title: 'IR 자료 초안 작성',
      description: 'Series A를 위한 IR Deck 초안 완성',
      estimatedTime: '180분',
      tone: '훌륭한 IR 자료를 만드셨네요',
      priority: 'critical' as const,
      isCompleted: true,
      actionUrl: '/startup/buildup',
      time: '09:00',
      projectId: 'project-002',
      projectTitle: '시리즈 A 투자 유치',
      pmName: '박투자 PM',
      meetingType: 'document_preparation',
      status: 'completed'
    },

    {
      id: 'buildup-past-003',
      date: addDays(today, -3),
      type: 'exploration' as const,
      title: '경쟁사 분석 완료',
      description: '주요 경쟁사 3곳 심층 분석 보고서 작성',
      estimatedTime: '120분',
      tone: '경쟁 환경을 잘 파악하셨어요',
      priority: 'medium' as const,
      isCompleted: true,
      actionUrl: '/startup/buildup',
      time: '14:00',
      projectId: 'project-001',
      projectTitle: 'AI 기반 스타트업 성장 플랫폼',
      pmName: '김성장 PM',
      meetingType: 'research_completion',
      status: 'completed'
    }
  ];
}

// 빌드업 일정을 통합 캘린더 형식으로 변환
export function transformBuildupToCalendarEvent(buildupEvent: any): CalendarEvent {
  return {
    ...buildupEvent,
    metadata: {
      source: 'buildup',
      projectId: buildupEvent.projectId,
      projectTitle: buildupEvent.projectTitle,
      pmName: buildupEvent.pmName,
      meetingType: buildupEvent.meetingType,
      status: buildupEvent.status
    }
  };
}

// 빌드업 일정 상태별 색상
export const buildupStatusColors = {
  scheduled: {
    color: '#1E40AF', // blue-800
    bgColor: '#DBEAFE', // blue-100
    borderColor: '#93C5FD' // blue-300
  },
  in_progress: {
    color: '#B45309', // amber-700
    bgColor: '#FEF3C7', // amber-100
    borderColor: '#FCD34D' // amber-300
  },
  completed: {
    color: '#059669', // emerald-600
    bgColor: '#D1FAE5', // emerald-100
    borderColor: '#6EE7B7' // emerald-300
  },
  cancelled: {
    color: '#6B7280', // gray-500
    bgColor: '#F3F4F6', // gray-100
    borderColor: '#D1D5DB' // gray-300
  },
  rescheduled: {
    color: '#7C3AED', // violet-600
    bgColor: '#EDE9FE', // violet-100
    borderColor: '#C4B5FD' // violet-300
  }
};

// 빌드업 미팅 타입별 아이콘
export const buildupMeetingIcons = {
  progress_check: '📊',
  mentoring: '🧑‍🏫',
  networking: '🤝',
  milestone_review: '🎯',
  strategy_session: '📋',
  research_review: '🔍',
  weekly_review: '📅',
  investor_meeting: '💰',
  strategy_planning: '🗺️',
  final_review: '✅',
  decision_meeting: '🎲',
  document_preparation: '📄',
  research_completion: '📚'
};

export default generateMockBuildupSchedule;