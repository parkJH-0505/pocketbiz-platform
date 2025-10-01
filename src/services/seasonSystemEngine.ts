/**
 * Season System Engine
 *
 * 시즌 시스템 관리 및 시즌 패스 처리
 */

import type {
  Season,
  SeasonGoal,
  SeasonReward,
  SeasonPassTier
} from '../types/gamification.types';
import { levelSystemEngine } from './levelSystemEngine';
import { celebrationTrigger } from './celebrationTrigger';

export class SeasonSystemEngine {
  private readonly STORAGE_KEY = 'season-data';
  private readonly CURRENT_SEASON_KEY = 'current-season';
  private readonly SEASON_PROGRESS_KEY = 'season-progress';

  // 시즌 정의 (3개월 주기)
  private readonly SEASONS: Season[] = [
    {
      id: 'season_2024_q1',
      name: '🌸 봄의 시작',
      theme: 'growth',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
      status: 'ended',
      goals: [],
      rewards: [],
      pass: { free: [], premium: [] },
      style: {
        primaryColor: '#10B981',
        secondaryColor: '#34D399',
        icon: '🌸'
      }
    },
    {
      id: 'season_2024_q2',
      name: '☀️ 여름의 도전',
      theme: 'challenge',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2024-06-30'),
      status: 'active',
      goals: this.generateSeasonGoals('challenge'),
      rewards: this.generateSeasonRewards(),
      pass: this.generateSeasonPass(),
      style: {
        primaryColor: '#F59E0B',
        secondaryColor: '#FCD34D',
        icon: '☀️'
      }
    },
    {
      id: 'season_2024_q3',
      name: '🍂 가을의 수확',
      theme: 'harvest',
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-09-30'),
      status: 'upcoming',
      goals: [],
      rewards: [],
      pass: { free: [], premium: [] },
      style: {
        primaryColor: '#DC2626',
        secondaryColor: '#F87171',
        icon: '🍂'
      }
    }
  ];

  /**
   * 현재 활성 시즌 가져오기
   */
  getCurrentSeason(): Season | null {
    const now = new Date();
    const activeSeason = this.SEASONS.find(
      season => season.status === 'active' ||
      (season.startDate <= now && season.endDate >= now)
    );

    if (activeSeason) {
      // 시즌 진행도 업데이트
      const progress = this.getSeasonProgress(activeSeason.id);
      return {
        ...activeSeason,
        goals: activeSeason.goals.map(goal => ({
          ...goal,
          current: progress.goals[goal.id] || 0,
          completed: (progress.goals[goal.id] || 0) >= goal.target
        }))
      };
    }

    return null;
  }

  /**
   * 시즌 진행도 가져오기
   */
  getSeasonProgress(seasonId: string): {
    points: number;
    tier: number;
    goals: Record<string, number>;
    claimedRewards: string[];
  } {
    try {
      const stored = localStorage.getItem(`${this.SEASON_PROGRESS_KEY}_${seasonId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load season progress:', error);
    }

    return {
      points: 0,
      tier: 0,
      goals: {},
      claimedRewards: []
    };
  }

  /**
   * 시즌 포인트 추가
   */
  async addSeasonPoints(
    points: number,
    source: string
  ): Promise<{ tierUp: boolean; newTier?: number; rewards?: SeasonReward[] }> {
    const season = this.getCurrentSeason();
    if (!season) {
      return { tierUp: false };
    }

    const progress = this.getSeasonProgress(season.id);
    const oldTier = progress.tier;

    // 포인트 추가
    progress.points += points;

    // 티어 계산
    const newTier = this.calculateTier(progress.points);
    const tierUp = newTier > oldTier;

    if (tierUp) {
      progress.tier = newTier;

      // 티어업 보상
      const rewards = this.getTierRewards(season, newTier);

      // 축하 효과
      this.triggerTierUpCelebration(newTier);

      // 저장
      this.saveSeasonProgress(season.id, progress);

      return {
        tierUp: true,
        newTier,
        rewards
      };
    }

    // 저장
    this.saveSeasonProgress(season.id, progress);

    return { tierUp: false };
  }

  /**
   * 시즌 목표 진행
   */
  async updateGoalProgress(
    goalId: string,
    progress: number
  ): Promise<{ completed: boolean; reward?: any }> {
    const season = this.getCurrentSeason();
    if (!season) {
      return { completed: false };
    }

    const seasonProgress = this.getSeasonProgress(season.id);
    const goal = season.goals.find(g => g.id === goalId);

    if (!goal) {
      return { completed: false };
    }

    const oldProgress = seasonProgress.goals[goalId] || 0;
    const newProgress = Math.min(oldProgress + progress, goal.target);

    seasonProgress.goals[goalId] = newProgress;

    // 목표 완료 체크
    if (oldProgress < goal.target && newProgress >= goal.target) {
      // XP 보상
      if (goal.reward.xp) {
        await levelSystemEngine.addXP(
          goal.reward.xp,
          'challenge',
          `시즌 목표 완료: ${goal.title}`
        );
      }

      // 시즌 포인트 보상
      await this.addSeasonPoints(100, 'goal_complete');

      // 축하
      celebrationTrigger.celebrate({
        level: 'medium',
        reason: 'goal_complete',
        message: `🎯 시즌 목표 달성: ${goal.title}`
      });

      // 저장
      this.saveSeasonProgress(season.id, seasonProgress);

      return {
        completed: true,
        reward: goal.reward
      };
    }

    // 저장
    this.saveSeasonProgress(season.id, seasonProgress);

    return { completed: false };
  }

  /**
   * 시즌 보상 수령
   */
  claimReward(rewardId: string): SeasonReward | null {
    const season = this.getCurrentSeason();
    if (!season) return null;

    const progress = this.getSeasonProgress(season.id);
    const reward = season.rewards.find(r =>
      r.tier <= progress.tier && !progress.claimedRewards.includes(rewardId)
    );

    if (reward) {
      progress.claimedRewards.push(rewardId);
      this.saveSeasonProgress(season.id, progress);

      // 보상 처리
      this.processReward(reward);

      return reward;
    }

    return null;
  }

  /**
   * 시즌 통계
   */
  getSeasonStats(seasonId?: string) {
    const season = seasonId
      ? this.SEASONS.find(s => s.id === seasonId)
      : this.getCurrentSeason();

    if (!season) return null;

    const progress = this.getSeasonProgress(season.id);
    const now = new Date();
    const totalDays = Math.floor(
      (season.endDate.getTime() - season.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysElapsed = Math.floor(
      (now.getTime() - season.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = Math.max(0, totalDays - daysElapsed);

    const completedGoals = season.goals.filter(
      g => (progress.goals[g.id] || 0) >= g.target
    ).length;

    return {
      id: season.id,
      name: season.name,
      theme: season.theme,
      tier: progress.tier,
      points: progress.points,
      daysRemaining,
      progressPercentage: (daysElapsed / totalDays) * 100,
      goalsCompleted: completedGoals,
      goalsTotal: season.goals.length,
      rewardsClaimed: progress.claimedRewards.length,
      rewardsAvailable: season.rewards.filter(
        r => r.tier <= progress.tier && !progress.claimedRewards.includes(r.type)
      ).length
    };
  }

  /**
   * 시즌 목표 생성
   */
  private generateSeasonGoals(theme: string): SeasonGoal[] {
    const baseGoals: SeasonGoal[] = [
      {
        id: 'daily_login_7',
        title: '7일 연속 접속',
        description: '7일 연속으로 접속하세요',
        target: 7,
        current: 0,
        completed: false,
        reward: { xp: 100, badge: 'consistent_7' }
      },
      {
        id: 'momentum_80_5',
        title: '모멘텀 마스터',
        description: '모멘텀 80점 이상을 5번 달성',
        target: 5,
        current: 0,
        completed: false,
        reward: { xp: 200, title: '모멘텀 마스터' }
      },
      {
        id: 'achievements_10',
        title: '성취의 달인',
        description: '10개의 성취 배지 획득',
        target: 10,
        current: 0,
        completed: false,
        reward: { xp: 300, badge: 'achiever' }
      },
      {
        id: 'level_up_5',
        title: '성장의 증거',
        description: '5레벨 상승',
        target: 5,
        current: 0,
        completed: false,
        reward: { xp: 150 }
      },
      {
        id: 'tasks_50',
        title: '생산성 챔피언',
        description: '50개의 작업 완료',
        target: 50,
        current: 0,
        completed: false,
        reward: { xp: 250, title: '생산성 챔피언' }
      }
    ];

    // 테마별 추가 목표
    if (theme === 'challenge') {
      baseGoals.push({
        id: 'extreme_challenge',
        title: '극한의 도전',
        description: '극한 난이도 도전 3개 완료',
        target: 3,
        current: 0,
        completed: false,
        reward: { xp: 500, badge: 'extreme_challenger' }
      });
    }

    return baseGoals;
  }

  /**
   * 시즌 보상 생성
   */
  private generateSeasonRewards(): SeasonReward[] {
    return [
      {
        tier: 1,
        type: 'badge',
        item: 'season_starter',
        description: '시즌 시작 배지',
        rarity: 'common',
        claimed: false
      },
      {
        tier: 5,
        type: 'title',
        item: '시즌 탐험가',
        description: '특별 칭호: 시즌 탐험가',
        rarity: 'uncommon',
        claimed: false
      },
      {
        tier: 10,
        type: 'theme',
        item: 'summer_theme',
        description: '여름 테마 잠금 해제',
        rarity: 'rare',
        claimed: false
      },
      {
        tier: 15,
        type: 'boost',
        item: 'xp_boost_2x',
        description: '24시간 XP 2배 부스트',
        rarity: 'rare',
        claimed: false
      },
      {
        tier: 20,
        type: 'badge',
        item: 'season_master',
        description: '시즌 마스터 배지',
        rarity: 'epic',
        claimed: false
      },
      {
        tier: 25,
        type: 'feature',
        item: 'premium_analytics',
        description: '프리미엄 분석 기능 영구 해제',
        rarity: 'epic',
        claimed: false
      },
      {
        tier: 30,
        type: 'badge',
        item: 'season_legend',
        description: '시즌 레전드 배지',
        rarity: 'legendary',
        claimed: false
      }
    ];
  }

  /**
   * 시즌 패스 생성
   */
  private generateSeasonPass(): { free: SeasonPassTier[]; premium: SeasonPassTier[] } {
    const tiers: SeasonPassTier[] = [];

    for (let i = 1; i <= 30; i++) {
      tiers.push({
        tier: i,
        requiredPoints: i * 100,
        rewards: {
          free: i % 5 === 0 ? { xp: 50 * i } : { xp: 20 * i },
          premium: {
            xp: 100 * i,
            badge: i % 10 === 0 ? `premium_${i}` : undefined
          }
        }
      });
    }

    return {
      free: tiers,
      premium: tiers
    };
  }

  /**
   * 티어 계산
   */
  private calculateTier(points: number): number {
    return Math.floor(points / 100);
  }

  /**
   * 티어 보상 가져오기
   */
  private getTierRewards(season: Season, tier: number): SeasonReward[] {
    return season.rewards.filter(r => r.tier === tier);
  }

  /**
   * 보상 처리
   */
  private processReward(reward: SeasonReward): void {
    switch (reward.type) {
      case 'badge':
        // 배지 추가
        console.log('Badge awarded:', reward.item);
        break;
      case 'title':
        // 칭호 추가
        console.log('Title awarded:', reward.item);
        break;
      case 'theme':
        // 테마 해제
        console.log('Theme unlocked:', reward.item);
        break;
      case 'boost':
        // 부스트 활성화
        console.log('Boost activated:', reward.item);
        break;
      case 'feature':
        // 기능 해제
        console.log('Feature unlocked:', reward.item);
        break;
    }
  }

  /**
   * 티어업 축하
   */
  private triggerTierUpCelebration(tier: number): void {
    let celebrationLevel = 'small';
    if (tier >= 25) celebrationLevel = 'large';
    else if (tier >= 15) celebrationLevel = 'medium';

    celebrationTrigger.celebrate({
      level: celebrationLevel as any,
      reason: 'tier_up',
      message: `⭐ 시즌 티어 ${tier} 달성!`,
      duration: 3000
    });
  }

  /**
   * 진행도 저장
   */
  private saveSeasonProgress(seasonId: string, progress: any): void {
    try {
      localStorage.setItem(
        `${this.SEASON_PROGRESS_KEY}_${seasonId}`,
        JSON.stringify(progress)
      );
    } catch (error) {
      console.error('Failed to save season progress:', error);
    }
  }

  /**
   * 시즌 리셋 (개발용)
   */
  resetSeason(): void {
    const season = this.getCurrentSeason();
    if (season) {
      localStorage.removeItem(`${this.SEASON_PROGRESS_KEY}_${season.id}`);
    }
  }
}

// 싱글톤 인스턴스
export const seasonSystemEngine = new SeasonSystemEngine();