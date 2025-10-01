/**
 * Special Rewards Engine
 *
 * 특별 보상 시스템 관리
 */

import type { SpecialReward } from '../types/gamification.types';
import { levelSystemEngine } from './levelSystemEngine';
import { celebrationTrigger } from './celebrationTrigger';

export class SpecialRewardsEngine {
  private readonly STORAGE_KEY = 'special-rewards';
  private readonly CLAIMED_KEY = 'claimed-rewards';

  // 특별 보상 정의
  private readonly REWARDS: SpecialReward[] = [
    // === 가상 보상 ===
    {
      id: 'first_level_10',
      name: '🎯 첫 10레벨 달성',
      description: '레벨 10을 처음으로 달성한 특별한 순간!',
      type: 'virtual',
      virtual: {
        badge: 'level_10_pioneer',
        title: '개척자',
        boost: { type: 'xp', amount: 50, duration: 24 * 60 * 60 * 1000 }
      },
      criteria: { minLevel: 10 },
      available: true,
      claimed: false
    },
    {
      id: 'momentum_master',
      name: '🚀 모멘텀 마스터',
      description: '모멘텀 90점 이상을 10회 달성',
      type: 'virtual',
      virtual: {
        badge: 'momentum_master',
        title: '모멘텀 마스터',
        theme: 'momentum_theme'
      },
      criteria: { achievement: 'momentum_high_10' },
      available: true,
      claimed: false
    },
    {
      id: 'streak_30',
      name: '🔥 30일 연속 접속',
      description: '한 달 동안 매일 접속한 놀라운 끈기!',
      type: 'virtual',
      virtual: {
        badge: 'streak_30',
        title: '불꽃 창업가',
        boost: { type: 'momentum', amount: 20, duration: 7 * 24 * 60 * 60 * 1000 }
      },
      criteria: { achievement: 'streak_30' },
      available: true,
      claimed: false
    },

    // === 실제 보상 (샘플) ===
    {
      id: 'level_50_swag',
      name: '🎁 레벨 50 기념품',
      description: 'PocketBiz 브랜드 굿즈 패키지',
      type: 'real',
      real: {
        item: 'PocketBiz 굿즈 세트 (머그컵, 스티커, 노트북)',
        value: 50000,
        deliveryMethod: '택배 배송'
      },
      criteria: { minLevel: 50 },
      available: true,
      claimed: false
    },

    // === 할인/쿠폰 ===
    {
      id: 'premium_discount_20',
      name: '💎 프리미엄 20% 할인',
      description: '레벨 20 달성 기념 프리미엄 플랜 할인',
      type: 'discount',
      discount: {
        code: 'LEVEL20',
        percentage: 20,
        applicableFor: 'Premium Plan',
        validUntil: new Date('2024-12-31')
      },
      criteria: { minLevel: 20 },
      available: true,
      claimed: false
    },
    {
      id: 'mentoring_voucher',
      name: '🎓 1:1 멘토링 이용권',
      description: '전문가 1:1 멘토링 30분 무료 이용권',
      type: 'discount',
      discount: {
        code: 'MENTOR30',
        percentage: 100,
        applicableFor: '30분 멘토링 세션',
        validUntil: new Date('2024-12-31')
      },
      criteria: { minLevel: 15 },
      available: true,
      claimed: false
    },

    // === 기능 해제 ===
    {
      id: 'unlock_advanced_analytics',
      name: '📊 고급 분석 도구 해제',
      description: '더 깊은 인사이트를 위한 고급 분석 기능',
      type: 'feature',
      virtual: {
        title: '데이터 마스터'
      },
      criteria: { minLevel: 25 },
      available: true,
      claimed: false
    },
    {
      id: 'unlock_api_access',
      name: '🔌 API 액세스 해제',
      description: 'PocketBiz API를 통한 데이터 연동',
      type: 'feature',
      virtual: {
        badge: 'api_developer'
      },
      criteria: { minLevel: 30 },
      available: true,
      claimed: false
    },

    // === 인정/명예 ===
    {
      id: 'hall_of_fame',
      name: '🏛️ 명예의 전당 등록',
      description: 'PocketBiz 명예의 전당에 이름 등록',
      type: 'recognition',
      virtual: {
        badge: 'hall_of_fame',
        title: '명예의 전당'
      },
      criteria: { minLevel: 40, seasonRank: 10 },
      available: true,
      claimed: false
    },
    {
      id: 'community_spotlight',
      name: '🌟 커뮤니티 스포트라이트',
      description: '커뮤니티 뉴스레터에 성공 스토리 소개',
      type: 'recognition',
      virtual: {
        badge: 'community_star'
      },
      criteria: { minLevel: 35 },
      available: true,
      claimed: false
    },

    // === 시즌 특별 보상 ===
    {
      id: 'season_top_100',
      name: '👑 시즌 Top 100',
      description: '시즌 상위 100위 안에 든 특별한 성취',
      type: 'virtual',
      virtual: {
        badge: 'season_elite',
        title: '시즌 엘리트',
        boost: { type: 'all', amount: 10, duration: 30 * 24 * 60 * 60 * 1000 }
      },
      criteria: { seasonRank: 100 },
      available: true,
      claimed: false
    },

    // === 특별 이벤트 ===
    {
      id: 'anniversary_2024',
      name: '🎉 2024 창립 기념',
      description: 'PocketBiz 창립 기념 특별 보상',
      type: 'virtual',
      virtual: {
        badge: 'anniversary_2024',
        theme: 'anniversary_theme'
      },
      criteria: { specialEvent: 'anniversary_2024' },
      available: true,
      claimed: false,
      expiresAt: new Date('2024-12-31')
    }
  ];

  /**
   * 이용 가능한 보상 가져오기
   */
  getAvailableRewards(): SpecialReward[] {
    const userLevel = levelSystemEngine.getUserLevel();
    const claimedIds = this.getClaimedRewardIds();

    return this.REWARDS.filter(reward => {
      // 이미 수령한 보상 제외
      if (claimedIds.includes(reward.id)) {
        return false;
      }

      // 만료된 보상 제외
      if (reward.expiresAt && new Date() > reward.expiresAt) {
        return false;
      }

      // 조건 확인
      return this.checkCriteria(reward.criteria, userLevel.level);
    });
  }

  /**
   * 모든 보상 가져오기 (수령 여부 포함)
   */
  getAllRewards(): SpecialReward[] {
    const claimedIds = this.getClaimedRewardIds();
    const userLevel = levelSystemEngine.getUserLevel();

    return this.REWARDS.map(reward => ({
      ...reward,
      claimed: claimedIds.includes(reward.id),
      available: this.checkCriteria(reward.criteria, userLevel.level)
    }));
  }

  /**
   * 보상 수령
   */
  async claimReward(rewardId: string): Promise<SpecialReward | null> {
    const reward = this.REWARDS.find(r => r.id === rewardId);
    if (!reward) return null;

    const claimedIds = this.getClaimedRewardIds();
    if (claimedIds.includes(rewardId)) {
      throw new Error('이미 수령한 보상입니다');
    }

    const userLevel = levelSystemEngine.getUserLevel();
    if (!this.checkCriteria(reward.criteria, userLevel.level)) {
      throw new Error('보상 수령 조건을 충족하지 않았습니다');
    }

    // 보상 처리
    await this.processReward(reward);

    // 수령 기록
    claimedIds.push(rewardId);
    this.saveClaimedRewards(claimedIds);

    // 축하
    this.triggerRewardCelebration(reward);

    return {
      ...reward,
      claimed: true,
      claimedAt: new Date()
    };
  }

  /**
   * 조건 확인
   */
  private checkCriteria(
    criteria: SpecialReward['criteria'],
    userLevel: number
  ): boolean {
    // 레벨 조건
    if (criteria.minLevel && userLevel < criteria.minLevel) {
      return false;
    }

    // 성취 조건 (실제로는 achievementEngine와 연동)
    if (criteria.achievement) {
      // 샘플: 특정 성취 확인
      const achievements = this.getUserAchievements();
      if (!achievements.includes(criteria.achievement)) {
        return false;
      }
    }

    // 시즌 순위 조건 (실제로는 seasonEngine와 연동)
    if (criteria.seasonRank) {
      const seasonRank = this.getUserSeasonRank();
      if (!seasonRank || seasonRank > criteria.seasonRank) {
        return false;
      }
    }

    // 특별 이벤트 조건
    if (criteria.specialEvent) {
      const activeEvents = this.getActiveSpecialEvents();
      if (!activeEvents.includes(criteria.specialEvent)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 보상 처리
   */
  private async processReward(reward: SpecialReward): Promise<void> {
    switch (reward.type) {
      case 'virtual':
        if (reward.virtual) {
          // 배지 추가
          if (reward.virtual.badge) {
            console.log('Badge awarded:', reward.virtual.badge);
          }
          // 칭호 추가
          if (reward.virtual.title) {
            console.log('Title awarded:', reward.virtual.title);
          }
          // 테마 해제
          if (reward.virtual.theme) {
            console.log('Theme unlocked:', reward.virtual.theme);
          }
          // 부스트 적용
          if (reward.virtual.boost) {
            await this.applyBoost(reward.virtual.boost);
          }
        }
        break;

      case 'real':
        // 실제 보상 처리 (배송 정보 수집 등)
        console.log('Real reward claimed:', reward.real);
        break;

      case 'discount':
        // 할인 코드 발급
        if (reward.discount) {
          console.log('Discount code issued:', reward.discount.code);
        }
        break;

      case 'feature':
        // 기능 해제
        console.log('Feature unlocked:', reward.name);
        break;

      case 'recognition':
        // 인정/명예 처리
        console.log('Recognition awarded:', reward.name);
        break;
    }
  }

  /**
   * 부스트 적용
   */
  private async applyBoost(boost: any): Promise<void> {
    const endTime = Date.now() + boost.duration;

    // 부스트 정보 저장
    const activeBoosts = this.getActiveBoosts();
    activeBoosts.push({
      type: boost.type,
      amount: boost.amount,
      endTime
    });

    localStorage.setItem('active-boosts', JSON.stringify(activeBoosts));

    // XP 부스트인 경우 즉시 적용
    if (boost.type === 'xp') {
      await levelSystemEngine.addXP(boost.amount, 'special_event', '특별 보상 부스트');
    }
  }

  /**
   * 활성 부스트 가져오기
   */
  getActiveBoosts(): any[] {
    try {
      const stored = localStorage.getItem('active-boosts');
      if (stored) {
        const boosts = JSON.parse(stored);
        // 만료된 부스트 제거
        const activeBoosts = boosts.filter((b: any) => b.endTime > Date.now());
        localStorage.setItem('active-boosts', JSON.stringify(activeBoosts));
        return activeBoosts;
      }
    } catch (error) {
      console.error('Failed to load active boosts:', error);
    }
    return [];
  }

  /**
   * 축하 효과
   */
  private triggerRewardCelebration(reward: SpecialReward): void {
    let celebrationLevel = 'medium';
    if (reward.type === 'real' || reward.criteria.minLevel >= 40) {
      celebrationLevel = 'epic';
    } else if (reward.criteria.minLevel >= 20) {
      celebrationLevel = 'large';
    }

    celebrationTrigger.celebrate({
      level: celebrationLevel as any,
      reason: 'reward_claim',
      message: `🎁 ${reward.name} 획득!`,
      duration: celebrationLevel === 'epic' ? 5000 : 3000
    });
  }

  /**
   * 유틸리티 메서드
   */
  private getClaimedRewardIds(): string[] {
    try {
      const stored = localStorage.getItem(this.CLAIMED_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load claimed rewards:', error);
      return [];
    }
  }

  private saveClaimedRewards(ids: string[]): void {
    try {
      localStorage.setItem(this.CLAIMED_KEY, JSON.stringify(ids));
    } catch (error) {
      console.error('Failed to save claimed rewards:', error);
    }
  }

  private getUserAchievements(): string[] {
    // 실제로는 achievementEngine에서 가져와야 함
    return ['momentum_high_10', 'streak_30'];
  }

  private getUserSeasonRank(): number | null {
    // 실제로는 seasonEngine에서 가져와야 함
    return Math.floor(Math.random() * 200) + 1;
  }

  private getActiveSpecialEvents(): string[] {
    // 활성 특별 이벤트
    return ['anniversary_2024'];
  }

  /**
   * 보상 통계
   */
  getRewardStats() {
    const allRewards = this.getAllRewards();
    const claimedRewards = allRewards.filter(r => r.claimed);
    const availableRewards = allRewards.filter(r => r.available && !r.claimed);

    return {
      total: allRewards.length,
      claimed: claimedRewards.length,
      available: availableRewards.length,
      claimRate: Math.round((claimedRewards.length / allRewards.length) * 100),

      byType: {
        virtual: allRewards.filter(r => r.type === 'virtual').length,
        real: allRewards.filter(r => r.type === 'real').length,
        discount: allRewards.filter(r => r.type === 'discount').length,
        feature: allRewards.filter(r => r.type === 'feature').length,
        recognition: allRewards.filter(r => r.type === 'recognition').length
      },

      nextReward: availableRewards[0] || null,

      totalValue: claimedRewards
        .filter(r => r.real?.value)
        .reduce((sum, r) => sum + (r.real?.value || 0), 0)
    };
  }

  /**
   * 리셋 (개발용)
   */
  resetRewards(): void {
    localStorage.removeItem(this.CLAIMED_KEY);
    localStorage.removeItem('active-boosts');
  }
}

// 싱글톤 인스턴스
export const specialRewardsEngine = new SpecialRewardsEngine();