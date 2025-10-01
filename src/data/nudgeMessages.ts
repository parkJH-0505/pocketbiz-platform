/**
 * Nudge Messages Definitions
 *
 * 모든 넛지 메시지 정의
 */

import type { NudgeMessage } from '../types/nudge.types';

export const NUDGE_MESSAGES: NudgeMessage[] = [
  // 격려 메시지
  {
    id: 'encourage_momentum_up',
    type: 'encouragement',
    title: '🚀 좋은 흐름이에요!',
    message: '지금의 모멘텀을 유지하면 큰 성과를 얻을 수 있어요.',
    icon: '🚀',
    color: 'green',
    priority: 'medium',
    trigger: 'high_performance',
    timing: 'immediate'
  },
  {
    id: 'encourage_streak',
    type: 'encouragement',
    title: '💪 연속 기록 대단해요!',
    message: '꾸준함이 성공의 열쇠입니다. 계속 이어가세요!',
    icon: '💪',
    color: 'blue',
    priority: 'low',
    trigger: 'high_performance',
    timing: 'immediate'
  },

  // 리마인더
  {
    id: 'remind_kpi_update',
    type: 'reminder',
    title: '📊 KPI 업데이트 시간',
    message: '오늘의 진행사항을 기록해보세요.',
    actionText: 'KPI 입력하기',
    actionUrl: '/startup/dashboard?tab=kpi',
    icon: '📊',
    color: 'blue',
    priority: 'medium',
    trigger: 'time_based',
    timing: 'scheduled',
    cooldownMinutes: 120
  },
  {
    id: 'remind_schedule_check',
    type: 'reminder',
    title: '📅 오늘 일정 확인',
    message: '놓친 일정이 있는지 확인해보세요.',
    actionText: '일정 보기',
    icon: '📅',
    color: 'yellow',
    priority: 'low',
    trigger: 'work_hours',
    timing: 'scheduled',
    cooldownMinutes: 180
  },

  // 제안
  {
    id: 'suggest_break',
    type: 'suggestion',
    title: '☕ 잠깐 휴식하세요',
    message: '2시간 이상 집중했네요. 5분 휴식을 권해요.',
    actionText: '5분 타이머',
    icon: '☕',
    color: 'purple',
    priority: 'medium',
    trigger: 'high_stress',
    timing: 'immediate',
    cooldownMinutes: 90
  },
  {
    id: 'suggest_momentum_boost',
    type: 'suggestion',
    title: '🎯 작은 성취로 시작해요',
    message: '간단한 작업부터 완료하면 모멘텀이 올라갑니다.',
    actionText: '쉬운 작업 보기',
    icon: '🎯',
    color: 'green',
    priority: 'high',
    trigger: 'low_momentum',
    timing: 'delayed',
    cooldownMinutes: 60
  },

  // 마일스톤
  {
    id: 'milestone_project_90',
    type: 'milestone',
    title: '🎉 프로젝트 90% 완료!',
    message: '거의 다 왔어요! 마지막 스퍼트를 해보세요.',
    actionText: '프로젝트 보기',
    icon: '🎉',
    color: 'green',
    priority: 'high',
    trigger: 'milestone_near',
    timing: 'immediate',
    maxShowCount: 1
  },
  {
    id: 'milestone_achievement_close',
    type: 'milestone',
    title: '🏆 성취 달성 임박!',
    message: '조금만 더 하면 새로운 배지를 얻을 수 있어요.',
    actionText: '성취 보기',
    icon: '🏆',
    color: 'yellow',
    priority: 'medium',
    trigger: 'milestone_near',
    timing: 'immediate'
  },

  // 습관 형성
  {
    id: 'habit_morning_routine',
    type: 'habit',
    title: '🌅 아침 루틴 시작',
    message: '성공적인 하루를 위해 목표를 설정해보세요.',
    actionText: '오늘 목표 설정',
    icon: '🌅',
    color: 'blue',
    priority: 'medium',
    trigger: 'time_based',
    timing: 'scheduled',
    cooldownMinutes: 1440 // 24시간
  },
  {
    id: 'habit_evening_review',
    type: 'habit',
    title: '🌙 하루 마무리',
    message: '오늘의 성과를 되돌아보고 내일을 준비해보세요.',
    actionText: '회고 작성',
    icon: '🌙',
    color: 'purple',
    priority: 'low',
    trigger: 'time_based',
    timing: 'scheduled',
    cooldownMinutes: 1440
  },

  // 휴식 권유
  {
    id: 'break_overwork',
    type: 'break',
    title: '⚠️ 과로 주의',
    message: '스트레스 수치가 높습니다. 충분한 휴식을 취하세요.',
    actionText: '휴식 모드',
    icon: '⚠️',
    color: 'red',
    priority: 'high',
    trigger: 'high_stress',
    timing: 'immediate',
    cooldownMinutes: 30
  },
  {
    id: 'break_late_work',
    type: 'break',
    title: '🌃 늦은 시간이에요',
    message: '건강을 위해 작업을 마무리하고 휴식하세요.',
    actionText: '저장하고 종료',
    icon: '🌃',
    color: 'gray',
    priority: 'medium',
    trigger: 'time_based',
    timing: 'immediate',
    cooldownMinutes: 120
  },
  {
    id: 'break_inactivity',
    type: 'break',
    title: '💤 장시간 비활성',
    message: '30분간 활동이 없었어요. 계속 작업하시나요?',
    actionText: '계속 작업',
    icon: '💤',
    color: 'gray',
    priority: 'low',
    trigger: 'inactivity',
    timing: 'delayed',
    maxShowCount: 3
  }
];

// 조건별 메시지 필터링 함수
export const getMessagesForTrigger = (trigger: string): NudgeMessage[] => {
  return NUDGE_MESSAGES.filter(msg => msg.trigger === trigger);
};

// 우선순위별 정렬
export const sortMessagesByPriority = (messages: NudgeMessage[]): NudgeMessage[] => {
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  return [...messages].sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
};

// 메시지 검색
export const findMessageById = (id: string): NudgeMessage | undefined => {
  return NUDGE_MESSAGES.find(msg => msg.id === id);
};