/**
 * Achievement Engine
 *
 * 성취 시스템의 핵심 로직을 담당하는 엔진
 * - 성취 조건 확인
 * - 성취 해제 및 진행도 추적
 * - 보상 지급 및 이벤트 발생
 */

import type {
  Achievement,
  UserAchievements,
  AchievementProgress,
  AchievementUnlockEvent
} from '../types/achievement.types';
import type { MomentumData } from './momentumEngine';
import { ACHIEVEMENTS } from '../data/achievements';
import { celebrationTrigger } from './celebrationTrigger';
import type { CelebrationLevel } from './celebrationTrigger';

export class AchievementEngine {
  private readonly STORAGE_KEY = 'user-achievements';
  private readonly PROGRESS_KEY = 'achievement-progress';

  /**
   * 사용자 성취 데이터 로드
   */
  getUserAchievements(): UserAchievements {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Date 객체 복원
        if (parsed.lastUnlocked?.unlockedAt) {
          parsed.lastUnlocked.unlockedAt = new Date(parsed.lastUnlocked.unlockedAt);
        }
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load user achievements:', error);
    }

    return {
      unlockedIds: [],
      totalPoints: 0,
      progress: {}
    };
  }

  /**
   * 사용자 성취 데이터 저장
   */
  private saveUserAchievements(achievements: UserAchievements): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(achievements));
    } catch (error) {
      console.error('Failed to save user achievements:', error);
    }
  }

  /**
   * 모든 성취의 진행도 확인
   */
  async checkAllAchievements(
    momentum: MomentumData | null
  ): Promise<AchievementUnlockEvent[]> {
    const userAchievements = this.getUserAchievements();
    const events: AchievementUnlockEvent[] = [];

    for (const achievement of ACHIEVEMENTS) {
      // 이미 해제된 성취는 건너뛰기
      if (userAchievements.unlockedIds.includes(achievement.id)) {
        continue;
      }

      const currentProgress = await this.calculateProgress(achievement, momentum);

      // 진행도 저장
      userAchievements.progress[achievement.id] = currentProgress;

      // 성취 조건 충족 확인
      if (currentProgress >= achievement.requirement.target) {
        const unlockEvent = await this.unlockAchievement(achievement, userAchievements);
        if (unlockEvent) {
          events.push(unlockEvent);
        }
      }
    }

    // 업데이트된 데이터 저장
    this.saveUserAchievements(userAchievements);

    return events;
  }

  /**
   * 특정 성취의 진행도 계산
   */
  private async calculateProgress(
    achievement: Achievement,
    momentum: MomentumData | null
  ): Promise<number> {
    const { type, condition } = achievement.requirement;

    switch (type) {
      case 'momentum_score':
        return momentum?.score || 0;

      case 'login_streak':
        return parseInt(localStorage.getItem('login-streak') || '0');

      case 'kpi_growth':
        return this.calculateKPIGrowth();

      case 'project_completion':
        return this.getCompletedProjectsCount();

      case 'custom':
        return this.calculateCustomProgress(condition);

      default:
        return 0;
    }
  }

  /**
   * KPI 성장률 계산
   */
  private calculateKPIGrowth(): number {
    const current = parseInt(localStorage.getItem('kpi-average-score') || '0');
    const previous = parseInt(localStorage.getItem('kpi-previous-score') || '0');

    if (previous === 0) return 0;
    return Math.max(0, ((current - previous) / previous) * 100);
  }

  /**
   * 완료된 프로젝트 수 계산
   */
  private getCompletedProjectsCount(): number {
    try {
      const projects = JSON.parse(localStorage.getItem('buildup-projects') || '[]');
      return projects.filter((p: any) => p.status === 'completed').length;
    } catch {
      return 0;
    }
  }

  /**
   * 커스텀 조건 진행도 계산
   */
  private calculateCustomProgress(condition?: string): number {
    if (!condition) return 0;

    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday

    switch (condition) {
      case 'login_before_7am':
        return hour < 7 ? 1 : 0;

      case 'work_after_midnight':
        return hour >= 0 && hour < 6 ? 1 : 0;

      case 'weekend_work':
        // 주말(토, 일)에 활동했는지 확인
        if (day === 0 || day === 6) {
          const todayActivity = localStorage.getItem('today-activity-logged');
          return todayActivity === 'true' ? 1 : 0;
        }
        return 0;

      default:
        return 0;
    }
  }

  /**
   * 성취 해제 처리
   */
  private async unlockAchievement(
    achievement: Achievement,
    userAchievements: UserAchievements
  ): Promise<AchievementUnlockEvent | null> {
    try {
      // 성취 해제
      userAchievements.unlockedIds.push(achievement.id);
      userAchievements.totalPoints += achievement.reward?.points || 0;

      // 해제 시간 기록
      const unlockedAchievement = {
        ...achievement,
        unlockedAt: new Date()
      };
      userAchievements.lastUnlocked = unlockedAchievement;

      // 축하 효과 트리거
      if (achievement.reward?.celebration) {
        celebrationTrigger.celebrate({
          level: achievement.reward.celebration as CelebrationLevel,
          reason: 'achievement',
          message: `🎉 ${achievement.name} 달성!`,
          duration: this.getCelebrationDuration(achievement.reward.celebration)
        });
      }

      console.log(`🎉 Achievement unlocked: ${achievement.name}`);

      return {
        achievement: unlockedAchievement,
        isFirstTime: true,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to unlock achievement:', error);
      return null;
    }
  }

  /**
   * 희귀도별 축하 시간 결정
   */
  private getCelebrationDuration(level: string): number {
    const durations = {
      micro: 800,
      small: 1500,
      medium: 2500,
      large: 4000,
      epic: 6000
    };
    return durations[level as keyof typeof durations] || 1500;
  }

  /**
   * 성취 진행도 목록 가져오기
   */
  getAchievementProgress(): AchievementProgress[] {
    const userAchievements = this.getUserAchievements();

    return ACHIEVEMENTS.map(achievement => {
      const current = userAchievements.progress[achievement.id] || 0;
      const target = achievement.requirement.target;
      const isUnlocked = userAchievements.unlockedIds.includes(achievement.id);

      return {
        achievement,
        current: Math.min(current, target),
        target,
        percentage: Math.min(100, (current / target) * 100),
        isUnlocked
      };
    });
  }

  /**
   * 카테고리별 성취 통계
   */
  getCategoryStats() {
    const progress = this.getAchievementProgress();
    const stats: Record<string, { total: number; unlocked: number }> = {};

    progress.forEach(p => {
      const category = p.achievement.category;
      if (!stats[category]) {
        stats[category] = { total: 0, unlocked: 0 };
      }
      stats[category].total++;
      if (p.isUnlocked) {
        stats[category].unlocked++;
      }
    });

    return stats;
  }

  /**
   * 다음 해제 가능한 성취 추천
   */
  getNextRecommendedAchievements(limit: number = 3): AchievementProgress[] {
    const progress = this.getAchievementProgress();

    return progress
      .filter(p => !p.isUnlocked && p.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, limit);
  }

  /**
   * 성취 시스템 강제 체크 (디버깅용)
   */
  async forceCheckAchievements(momentum: MomentumData | null): Promise<void> {
    const events = await this.checkAllAchievements(momentum);
    console.log(`[AchievementEngine] Checked achievements, ${events.length} unlocked`);
  }
}

// 싱글톤 인스턴스
export const achievementEngine = new AchievementEngine();