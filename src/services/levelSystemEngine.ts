/**
 * Level System Engine
 *
 * 사용자 레벨 관리 및 경험치 시스템
 */

import type {
  UserLevel,
  XPSource,
  LevelDefinition,
  GamificationEvent
} from '../types/gamification.types';
import { celebrationTrigger } from './celebrationTrigger';

export class LevelSystemEngine {
  private readonly STORAGE_KEY = 'user-level-data';
  private readonly XP_HISTORY_KEY = 'xp-history';

  // 레벨 정의 (1-50 레벨)
  private readonly LEVEL_DEFINITIONS: LevelDefinition[] = [
    { level: 1, title: '🌱 새싹 창업가', requiredXP: 0, color: 'gray', icon: '🌱',
      perks: {} },
    { level: 2, title: '🌿 성장하는 창업가', requiredXP: 100, color: 'gray', icon: '🌿',
      perks: { momentumBoost: 2 } },
    { level: 3, title: '🌳 뿌리내린 창업가', requiredXP: 250, color: 'gray', icon: '🌳',
      perks: { momentumBoost: 3 } },
    { level: 5, title: '⚡ 열정적인 창업가', requiredXP: 500, color: 'green', icon: '⚡',
      perks: { momentumBoost: 5, achievementBoost: 5 } },
    { level: 10, title: '🚀 도약하는 창업가', requiredXP: 1500, color: 'blue', icon: '🚀',
      perks: { momentumBoost: 10, achievementBoost: 10, unlockFeatures: ['advanced_analytics'] } },
    { level: 15, title: '💎 빛나는 창업가', requiredXP: 3000, color: 'purple', icon: '💎',
      perks: { momentumBoost: 15, achievementBoost: 15, specialBadge: 'diamond' } },
    { level: 20, title: '🏆 성공적인 창업가', requiredXP: 5000, color: 'gold', icon: '🏆',
      perks: { momentumBoost: 20, achievementBoost: 20, unlockFeatures: ['premium_insights'] } },
    { level: 25, title: '⭐ 스타 창업가', requiredXP: 8000, color: 'gold', icon: '⭐',
      perks: { momentumBoost: 25, achievementBoost: 25, specialBadge: 'star' } },
    { level: 30, title: '👑 마스터 창업가', requiredXP: 12000, color: 'platinum', icon: '👑',
      perks: { momentumBoost: 30, achievementBoost: 30, unlockFeatures: ['master_features'] } },
    { level: 40, title: '🌟 레전드 창업가', requiredXP: 20000, color: 'rainbow', icon: '🌟',
      perks: { momentumBoost: 40, achievementBoost: 40, specialBadge: 'legend' } },
    { level: 50, title: '🔥 신화적인 창업가', requiredXP: 35000, color: 'mythic', icon: '🔥',
      perks: { momentumBoost: 50, achievementBoost: 50, unlockFeatures: ['all'], specialBadge: 'mythic' } }
  ];

  /**
   * 현재 레벨 정보 가져오기
   */
  getUserLevel(): UserLevel {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        // Date 객체 복원
        if (data.levelUpDate) {
          data.levelUpDate = new Date(data.levelUpDate);
        }
        return data;
      }
    } catch (error) {
      console.error('Failed to load user level:', error);
    }

    // 기본 레벨 1
    return this.createDefaultLevel();
  }

  /**
   * XP 추가
   */
  async addXP(
    amount: number,
    source: XPSource['source'],
    description: string = '',
    multiplier: number = 1
  ): Promise<{ leveledUp: boolean; newLevel?: number; totalXP: number }> {
    const currentLevel = this.getUserLevel();
    const finalAmount = Math.round(amount * multiplier);

    // XP 소스 기록
    this.recordXPSource({
      id: `xp_${Date.now()}`,
      source,
      amount: finalAmount,
      multiplier,
      timestamp: new Date(),
      description
    });

    // 총 XP 업데이트
    const newTotalXP = currentLevel.totalXP + finalAmount;
    const newCurrentXP = currentLevel.currentXP + finalAmount;

    // 레벨업 체크
    let leveledUp = false;
    let newLevel = currentLevel.level;
    let updatedLevel = { ...currentLevel };

    if (newCurrentXP >= currentLevel.requiredXP) {
      const nextLevelDef = this.getNextLevelDefinition(currentLevel.level);
      if (nextLevelDef) {
        leveledUp = true;
        newLevel = nextLevelDef.level;

        // 레벨업 처리
        updatedLevel = this.processLevelUp(currentLevel, nextLevelDef, newTotalXP);

        // 축하 효과
        this.triggerLevelUpCelebration(newLevel);

        // 이벤트 기록
        this.recordGamificationEvent('level_up', {
          before: currentLevel.level,
          after: newLevel,
          reward: nextLevelDef.perks
        });
      } else {
        // 최대 레벨인 경우
        updatedLevel.currentXP = currentLevel.requiredXP;
        updatedLevel.totalXP = newTotalXP;
      }
    } else {
      // 레벨업 없이 XP만 증가
      updatedLevel.currentXP = newCurrentXP;
      updatedLevel.totalXP = newTotalXP;
      updatedLevel.progressPercentage = (newCurrentXP / currentLevel.requiredXP) * 100;
      updatedLevel.xpToNextLevel = currentLevel.requiredXP - newCurrentXP;
    }

    // 저장
    this.saveUserLevel(updatedLevel);

    return {
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined,
      totalXP: newTotalXP
    };
  }

  /**
   * 레벨업 처리
   */
  private processLevelUp(
    currentLevel: UserLevel,
    nextLevelDef: LevelDefinition,
    totalXP: number
  ): UserLevel {
    // 초과 XP 계산
    const overflowXP = currentLevel.currentXP - currentLevel.requiredXP;

    // 다음 레벨 필요 XP 계산
    const nextNextLevel = this.getNextLevelDefinition(nextLevelDef.level);
    const nextRequiredXP = nextNextLevel
      ? nextNextLevel.requiredXP - nextLevelDef.requiredXP
      : 99999; // 최대 레벨인 경우

    return {
      level: nextLevelDef.level,
      title: nextLevelDef.title,
      currentXP: overflowXP,
      requiredXP: nextRequiredXP,
      totalXP,
      perks: nextLevelDef.perks,
      progressPercentage: (overflowXP / nextRequiredXP) * 100,
      xpToNextLevel: nextRequiredXP - overflowXP,
      levelUpDate: new Date(),
      daysAtCurrentLevel: 0
    };
  }

  /**
   * 일일 XP 보너스
   */
  async claimDailyBonus(): Promise<number> {
    const lastClaim = localStorage.getItem('last-daily-xp-claim');
    const today = new Date().toDateString();

    if (lastClaim === today) {
      throw new Error('일일 보너스는 하루에 한 번만 받을 수 있습니다');
    }

    // 연속 접속 보너스 계산
    const streak = parseInt(localStorage.getItem('login-streak') || '0');
    const baseXP = 50;
    const streakBonus = Math.min(streak * 5, 100); // 최대 100 추가 XP
    const totalXP = baseXP + streakBonus;

    await this.addXP(totalXP, 'daily_login', `${streak}일 연속 접속 보너스`);
    localStorage.setItem('last-daily-xp-claim', today);

    return totalXP;
  }

  /**
   * 모멘텀 기반 XP 계산
   */
  calculateMomentumXP(momentumScore: number): number {
    if (momentumScore >= 90) return 30;
    if (momentumScore >= 80) return 20;
    if (momentumScore >= 70) return 15;
    if (momentumScore >= 60) return 10;
    if (momentumScore >= 50) return 5;
    return 2;
  }

  /**
   * 성취 완료 XP
   */
  calculateAchievementXP(rarity: string): number {
    const xpMap: Record<string, number> = {
      common: 25,
      uncommon: 50,
      rare: 100,
      epic: 200,
      legendary: 500
    };
    return xpMap[rarity] || 25;
  }

  /**
   * 레벨별 혜택 적용
   */
  applyLevelPerks(baseValue: number, perkType: 'momentum' | 'achievement'): number {
    const level = this.getUserLevel();
    const boost = perkType === 'momentum'
      ? level.perks.momentumBoost
      : level.perks.achievementBoost;

    if (boost) {
      return Math.round(baseValue * (1 + boost / 100));
    }
    return baseValue;
  }

  /**
   * XP 히스토리
   */
  getXPHistory(days: number = 7): XPSource[] {
    try {
      const stored = localStorage.getItem(this.XP_HISTORY_KEY);
      if (stored) {
        const history = JSON.parse(stored);
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

        return history
          .map((h: any) => ({ ...h, timestamp: new Date(h.timestamp) }))
          .filter((h: XPSource) => h.timestamp.getTime() > cutoff)
          .sort((a: XPSource, b: XPSource) =>
            b.timestamp.getTime() - a.timestamp.getTime()
          );
      }
    } catch (error) {
      console.error('Failed to load XP history:', error);
    }
    return [];
  }

  /**
   * 레벨 진행 통계
   */
  getLevelStats() {
    const level = this.getUserLevel();
    const history = this.getXPHistory(30);

    // 일별 XP 계산
    const dailyXP = new Map<string, number>();
    history.forEach(h => {
      const date = h.timestamp.toDateString();
      dailyXP.set(date, (dailyXP.get(date) || 0) + h.amount);
    });

    // 소스별 XP 계산
    const sourceXP = new Map<string, number>();
    history.forEach(h => {
      sourceXP.set(h.source, (sourceXP.get(h.source) || 0) + h.amount);
    });

    return {
      currentLevel: level.level,
      totalXP: level.totalXP,
      progressToNext: level.progressPercentage,
      averageDailyXP: history.length > 0
        ? Math.round(history.reduce((sum, h) => sum + h.amount, 0) / Math.max(dailyXP.size, 1))
        : 0,
      topXPSource: Array.from(sourceXP.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none',
      daysToNextLevel: level.xpToNextLevel > 0 && dailyXP.size > 0
        ? Math.ceil(level.xpToNextLevel / (level.totalXP / dailyXP.size))
        : 0
    };
  }

  /**
   * 유틸리티 함수들
   */
  private createDefaultLevel(): UserLevel {
    const firstLevel = this.LEVEL_DEFINITIONS[0];
    const secondLevel = this.LEVEL_DEFINITIONS[1];

    return {
      level: 1,
      title: firstLevel.title,
      currentXP: 0,
      requiredXP: secondLevel.requiredXP,
      totalXP: 0,
      perks: firstLevel.perks,
      progressPercentage: 0,
      xpToNextLevel: secondLevel.requiredXP,
      daysAtCurrentLevel: 0
    };
  }

  private getNextLevelDefinition(currentLevel: number): LevelDefinition | null {
    return this.LEVEL_DEFINITIONS.find(def => def.level > currentLevel) || null;
  }

  private getLevelDefinition(level: number): LevelDefinition | null {
    return this.LEVEL_DEFINITIONS.find(def => def.level === level) || null;
  }

  private saveUserLevel(level: UserLevel): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(level));
    } catch (error) {
      console.error('Failed to save user level:', error);
    }
  }

  private recordXPSource(source: XPSource): void {
    try {
      const stored = localStorage.getItem(this.XP_HISTORY_KEY);
      const history = stored ? JSON.parse(stored) : [];

      history.push(source);

      // 최대 1000개 기록 유지
      if (history.length > 1000) {
        history.shift();
      }

      localStorage.setItem(this.XP_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to record XP source:', error);
    }
  }

  private triggerLevelUpCelebration(newLevel: number): void {
    let celebrationLevel = 'small';
    if (newLevel >= 40) celebrationLevel = 'epic';
    else if (newLevel >= 20) celebrationLevel = 'large';
    else if (newLevel >= 10) celebrationLevel = 'medium';

    celebrationTrigger.celebrate({
      level: celebrationLevel as any,
      reason: 'level_up',
      message: `🎉 레벨 ${newLevel} 달성!`,
      duration: celebrationLevel === 'epic' ? 5000 : 3000
    });
  }

  private recordGamificationEvent(
    type: GamificationEvent['type'],
    data: any
  ): void {
    try {
      const event: GamificationEvent = {
        id: `event_${Date.now()}`,
        type,
        timestamp: new Date(),
        data
      };

      const stored = localStorage.getItem('gamification-events');
      const events = stored ? JSON.parse(stored) : [];
      events.push(event);

      // 최대 100개 이벤트 유지
      if (events.length > 100) {
        events.shift();
      }

      localStorage.setItem('gamification-events', JSON.stringify(events));
    } catch (error) {
      console.error('Failed to record gamification event:', error);
    }
  }

  /**
   * 레벨 리셋 (개발용)
   */
  resetLevel(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.XP_HISTORY_KEY);
    localStorage.removeItem('last-daily-xp-claim');
  }
}

// 싱글톤 인스턴스
export const levelSystemEngine = new LevelSystemEngine();