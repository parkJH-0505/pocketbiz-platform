/**
 * Achievement Definitions
 *
 * 모든 성취 정의와 조건들
 */

import type { Achievement } from '../types/achievement.types';

export const ACHIEVEMENTS: Achievement[] = [
  // Momentum 카테고리
  {
    id: 'momentum_first_80',
    name: '🚀 첫 번째 모멘텀',
    description: '모멘텀 점수 80점 첫 달성',
    category: 'momentum',
    rarity: 'uncommon',
    icon: '🚀',
    requirement: {
      type: 'momentum_score',
      target: 80
    },
    reward: {
      title: '모멘텀 마스터',
      points: 50,
      celebration: 'medium'
    },
    order: 1
  },
  {
    id: 'momentum_perfect_100',
    name: '⭐ 완벽한 모멘텀',
    description: '모멘텀 점수 100점 달성',
    category: 'momentum',
    rarity: 'epic',
    icon: '⭐',
    requirement: {
      type: 'momentum_score',
      target: 100
    },
    reward: {
      title: '퍼펙트 플레이어',
      points: 200,
      celebration: 'epic'
    },
    order: 2
  },

  // Consistency 카테고리
  {
    id: 'streak_week',
    name: '📅 일주일 챔피언',
    description: '7일 연속 접속',
    category: 'consistency',
    rarity: 'common',
    icon: '📅',
    requirement: {
      type: 'login_streak',
      target: 7
    },
    reward: {
      title: '꾸준함의 달인',
      points: 30,
      celebration: 'small'
    },
    order: 3
  },
  {
    id: 'streak_month',
    name: '🏆 한 달 마스터',
    description: '30일 연속 접속',
    category: 'consistency',
    rarity: 'rare',
    icon: '🏆',
    requirement: {
      type: 'login_streak',
      target: 30
    },
    reward: {
      title: '지속력의 전설',
      points: 150,
      celebration: 'large'
    },
    order: 4
  },
  {
    id: 'streak_legend',
    name: '👑 레전드 스트릭',
    description: '100일 연속 접속',
    category: 'consistency',
    rarity: 'legendary',
    icon: '👑',
    requirement: {
      type: 'login_streak',
      target: 100
    },
    reward: {
      title: '불굴의 창업가',
      points: 500,
      celebration: 'epic'
    },
    order: 5
  },

  // Growth 카테고리
  {
    id: 'kpi_growth_20',
    name: '📈 성장의 시작',
    description: 'KPI 20% 성장 달성',
    category: 'growth',
    rarity: 'common',
    icon: '📈',
    requirement: {
      type: 'kpi_growth',
      target: 20
    },
    reward: {
      title: '성장하는 스타트업',
      points: 40,
      celebration: 'small'
    },
    order: 6
  },
  {
    id: 'kpi_growth_50',
    name: '🔥 폭발적 성장',
    description: 'KPI 50% 성장 달성',
    category: 'growth',
    rarity: 'rare',
    icon: '🔥',
    requirement: {
      type: 'kpi_growth',
      target: 50
    },
    reward: {
      title: '유니콘 후보',
      points: 120,
      celebration: 'large'
    },
    order: 7
  },

  // Milestone 카테고리
  {
    id: 'first_project',
    name: '🎯 첫 번째 프로젝트',
    description: '첫 프로젝트 100% 완료',
    category: 'milestone',
    rarity: 'uncommon',
    icon: '🎯',
    requirement: {
      type: 'project_completion',
      target: 1
    },
    reward: {
      title: '프로젝트 완주자',
      points: 60,
      celebration: 'medium'
    },
    order: 8
  },
  {
    id: 'project_master',
    name: '🌟 프로젝트 마스터',
    description: '5개 프로젝트 완료',
    category: 'milestone',
    rarity: 'epic',
    icon: '🌟',
    requirement: {
      type: 'project_completion',
      target: 5
    },
    reward: {
      title: '실행력의 대가',
      points: 250,
      celebration: 'epic'
    },
    order: 9
  },

  // Special 카테고리
  {
    id: 'early_bird',
    name: '🌅 얼리버드',
    description: '오전 7시 이전 첫 접속',
    category: 'special',
    rarity: 'uncommon',
    icon: '🌅',
    requirement: {
      type: 'custom',
      target: 1,
      condition: 'login_before_7am'
    },
    reward: {
      title: '아침형 창업가',
      points: 35,
      celebration: 'small'
    },
    order: 10
  },
  {
    id: 'night_owl',
    name: '🦉 나이트 오울',
    description: '밤 12시 이후 작업',
    category: 'special',
    rarity: 'uncommon',
    icon: '🦉',
    requirement: {
      type: 'custom',
      target: 1,
      condition: 'work_after_midnight'
    },
    reward: {
      title: '밤샘 워커홀릭',
      points: 35,
      celebration: 'small'
    },
    order: 11
  },
  {
    id: 'weekend_warrior',
    name: '⚔️ 주말 워리어',
    description: '주말에도 작업하는 진정한 창업가',
    category: 'special',
    rarity: 'rare',
    icon: '⚔️',
    requirement: {
      type: 'custom',
      target: 1,
      condition: 'weekend_work'
    },
    reward: {
      title: '무한 열정가',
      points: 80,
      celebration: 'medium'
    },
    isSecret: true,
    order: 12
  }
];

// 카테고리별 정렬
export const getAchievementsByCategory = () => {
  const categories = ACHIEVEMENTS.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  // 각 카테고리 내에서 order로 정렬
  Object.keys(categories).forEach(category => {
    categories[category].sort((a, b) => a.order - b.order);
  });

  return categories;
};

// 희귀도별 색상 테마
export const RARITY_THEMES = {
  common: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-700',
    glow: 'shadow-gray-200/50'
  },
  uncommon: {
    bg: 'bg-green-100',
    border: 'border-green-300',
    text: 'text-green-700',
    glow: 'shadow-green-200/50'
  },
  rare: {
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    text: 'text-blue-700',
    glow: 'shadow-blue-200/50'
  },
  epic: {
    bg: 'bg-purple-100',
    border: 'border-purple-300',
    text: 'text-purple-700',
    glow: 'shadow-purple-200/50'
  },
  legendary: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-400',
    text: 'text-yellow-700',
    glow: 'shadow-yellow-200/50'
  }
};