/**
 * Leaderboard Engine
 *
 * 리더보드 시스템 관리 및 순위 처리
 */

import type {
  Leaderboard,
  LeaderboardEntry
} from '../types/gamification.types';
import { levelSystemEngine } from './levelSystemEngine';

export class LeaderboardEngine {
  private readonly STORAGE_KEY = 'leaderboard-data';
  private readonly USER_ID = 'current-user'; // 실제로는 인증된 사용자 ID 사용

  // 샘플 사용자 데이터 (실제로는 서버에서 가져와야 함)
  private readonly SAMPLE_USERS = [
    { id: 'user1', name: '김창업', avatar: '👨‍💼', level: 25, anonymous: false },
    { id: 'user2', name: '이스타트', avatar: '👩‍💼', level: 22, anonymous: false },
    { id: 'user3', name: '박벤처', avatar: '🧑‍💼', level: 20, anonymous: false },
    { id: 'user4', name: '최혁신', avatar: '👤', level: 18, anonymous: true },
    { id: 'user5', name: '정도전', avatar: '👨‍💻', level: 17, anonymous: false },
    { id: 'user6', name: '강미래', avatar: '👩‍💻', level: 15, anonymous: false },
    { id: 'user7', name: '윤성장', avatar: '🧑‍💻', level: 14, anonymous: false },
    { id: 'user8', name: '임파워', avatar: '👨', level: 12, anonymous: true },
    { id: 'user9', name: '한빛나', avatar: '👩', level: 10, anonymous: false },
    { id: 'user10', name: '오픈', avatar: '🧑', level: 8, anonymous: false }
  ];

  /**
   * 리더보드 가져오기
   */
  getLeaderboard(
    type: Leaderboard['type'] = 'weekly',
    metric: Leaderboard['metric'] = 'momentum'
  ): Leaderboard {
    const id = `${type}_${metric}`;
    const cached = this.getCachedLeaderboard(id);

    // 캐시가 있고 유효한 경우
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    // 새로운 리더보드 생성
    const leaderboard = this.generateLeaderboard(type, metric);
    this.cacheLeaderboard(leaderboard);

    return leaderboard;
  }

  /**
   * 리더보드 생성
   */
  private generateLeaderboard(
    type: Leaderboard['type'],
    metric: Leaderboard['metric']
  ): Leaderboard {
    const entries = this.generateEntries(metric);
    const userRank = this.getUserRank(entries);

    return {
      id: `${type}_${metric}`,
      type,
      metric,
      entries: entries.slice(0, 100), // 상위 100명만
      userRank,
      lastUpdated: new Date(),
      nextReset: this.getNextResetDate(type)
    };
  }

  /**
   * 엔트리 생성
   */
  private generateEntries(metric: Leaderboard['metric']): LeaderboardEntry[] {
    const currentUserLevel = levelSystemEngine.getUserLevel();

    // 현재 사용자 추가
    const users = [
      {
        id: this.USER_ID,
        name: 'You',
        avatar: '🎯',
        level: currentUserLevel.level,
        anonymous: false
      },
      ...this.SAMPLE_USERS
    ];

    // 메트릭별 점수 계산
    const entries = users.map(user => {
      const score = this.calculateScore(user, metric);
      const previousRank = this.getPreviousRank(user.id, metric);

      return {
        rank: 0, // 나중에 설정
        userId: user.id,
        username: user.anonymous ? '익명 사용자' : user.name,
        displayName: user.anonymous ? `창업가 ${Math.floor(Math.random() * 1000)}` : undefined,
        avatar: user.anonymous ? '👤' : user.avatar,
        score,
        level: user.level,
        isAnonymous: user.anonymous,
        previousRank,
        trend: this.calculateTrend(previousRank),
        badges: this.getUserBadges(user.id),
        title: this.getUserTitle(user.level)
      };
    });

    // 점수로 정렬
    entries.sort((a, b) => b.score - a.score);

    // 순위 설정
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entries;
  }

  /**
   * 점수 계산
   */
  private calculateScore(user: any, metric: Leaderboard['metric']): number {
    const baseScore = user.level * 100;

    switch (metric) {
      case 'momentum':
        // 모멘텀 점수 (레벨 + 랜덤 변동)
        return baseScore + Math.floor(Math.random() * 500);

      case 'xp':
        // XP 점수 (레벨 기반)
        return user.level * 1000 + Math.floor(Math.random() * 1000);

      case 'achievements':
        // 성취 점수
        return user.level * 5 + Math.floor(Math.random() * 20);

      case 'streak':
        // 연속 접속
        return Math.min(user.level * 2, 30) + Math.floor(Math.random() * 10);

      default:
        return baseScore;
    }
  }

  /**
   * 사용자 순위 계산
   */
  private getUserRank(entries: LeaderboardEntry[]): Leaderboard['userRank'] {
    const userEntry = entries.find(e => e.userId === this.USER_ID);

    if (!userEntry) {
      return undefined;
    }

    const totalUsers = entries.length;
    const rank = userEntry.rank;
    const percentile = Math.round(((totalUsers - rank) / totalUsers) * 100);
    const previousRank = userEntry.previousRank || rank;
    const change = previousRank - rank;

    return {
      rank,
      percentile,
      change
    };
  }

  /**
   * 이전 순위 가져오기
   */
  private getPreviousRank(userId: string, metric: string): number | undefined {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_KEY}_previous`);
      if (stored) {
        const data = JSON.parse(stored);
        return data[`${userId}_${metric}`];
      }
    } catch (error) {
      console.error('Failed to get previous rank:', error);
    }
    return undefined;
  }

  /**
   * 트렌드 계산
   */
  private calculateTrend(previousRank?: number): LeaderboardEntry['trend'] {
    if (!previousRank) return 'new';
    const currentRank = 0; // 임시, 실제로는 현재 순위
    if (currentRank < previousRank) return 'up';
    if (currentRank > previousRank) return 'down';
    return 'stable';
  }

  /**
   * 사용자 배지 가져오기
   */
  private getUserBadges(userId: string): string[] {
    // 샘플 배지
    const badges = [];
    if (userId === this.USER_ID) {
      badges.push('🏆', '⚡', '🚀');
    } else {
      const random = Math.random();
      if (random > 0.7) badges.push('🏆');
      if (random > 0.5) badges.push('⚡');
      if (random > 0.3) badges.push('🎯');
    }
    return badges;
  }

  /**
   * 사용자 칭호 가져오기
   */
  private getUserTitle(level: number): string {
    if (level >= 40) return '레전드 창업가';
    if (level >= 30) return '마스터 창업가';
    if (level >= 20) return '성공적인 창업가';
    if (level >= 10) return '도약하는 창업가';
    if (level >= 5) return '열정적인 창업가';
    return '새싹 창업가';
  }

  /**
   * 다음 리셋 날짜
   */
  private getNextResetDate(type: Leaderboard['type']): Date {
    const now = new Date();

    switch (type) {
      case 'weekly':
        // 다음 월요일
        const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
        const nextMonday = new Date(now);
        nextMonday.setDate(now.getDate() + daysUntilMonday);
        nextMonday.setHours(0, 0, 0, 0);
        return nextMonday;

      case 'monthly':
        // 다음 달 1일
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return nextMonth;

      case 'season':
        // 시즌 종료일 (3개월 후)
        const seasonEnd = new Date(now);
        seasonEnd.setMonth(now.getMonth() + 3);
        return seasonEnd;

      case 'all_time':
        // 리셋 없음
        return new Date('2099-12-31');

      default:
        return now;
    }
  }

  /**
   * 캐시 관련 메서드
   */
  private getCachedLeaderboard(id: string): Leaderboard | null {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_KEY}_${id}`);
      if (stored) {
        const data = JSON.parse(stored);
        // Date 객체 복원
        data.lastUpdated = new Date(data.lastUpdated);
        data.nextReset = new Date(data.nextReset);
        return data;
      }
    } catch (error) {
      console.error('Failed to load cached leaderboard:', error);
    }
    return null;
  }

  private cacheLeaderboard(leaderboard: Leaderboard): void {
    try {
      localStorage.setItem(
        `${this.STORAGE_KEY}_${leaderboard.id}`,
        JSON.stringify(leaderboard)
      );
    } catch (error) {
      console.error('Failed to cache leaderboard:', error);
    }
  }

  private isCacheValid(leaderboard: Leaderboard): boolean {
    const now = Date.now();
    const cacheAge = now - leaderboard.lastUpdated.getTime();
    const maxAge = 5 * 60 * 1000; // 5분
    return cacheAge < maxAge;
  }

  /**
   * 순위 업데이트 (서버 동기화시 호출)
   */
  async updateRankings(): Promise<void> {
    // 실제로는 서버와 동기화
    console.log('Updating rankings...');

    // 현재 순위를 이전 순위로 저장
    ['weekly', 'monthly', 'season', 'all_time'].forEach(type => {
      ['momentum', 'xp', 'achievements', 'streak'].forEach(metric => {
        const leaderboard = this.getLeaderboard(type as any, metric as any);
        const previousRanks: Record<string, number> = {};

        leaderboard.entries.forEach(entry => {
          previousRanks[`${entry.userId}_${metric}`] = entry.rank;
        });

        localStorage.setItem(
          `${this.STORAGE_KEY}_previous`,
          JSON.stringify(previousRanks)
        );
      });
    });
  }

  /**
   * 리더보드 리셋
   */
  resetLeaderboard(type?: Leaderboard['type'], metric?: Leaderboard['metric']): void {
    if (type && metric) {
      localStorage.removeItem(`${this.STORAGE_KEY}_${type}_${metric}`);
    } else {
      // 전체 리셋
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.STORAGE_KEY)) {
          localStorage.removeItem(key);
        }
      });
    }
  }

  /**
   * 친구 리더보드 (미래 기능)
   */
  getFriendsLeaderboard(): LeaderboardEntry[] {
    // 친구 목록 (샘플)
    const friends = this.SAMPLE_USERS.slice(0, 5);
    return this.generateEntries('momentum').filter(
      entry => friends.some(f => f.id === entry.userId) || entry.userId === this.USER_ID
    );
  }

  /**
   * 지역 리더보드 (미래 기능)
   */
  getRegionalLeaderboard(region: string = 'kr'): LeaderboardEntry[] {
    // 지역별 필터링 (샘플)
    return this.generateEntries('momentum').slice(0, 50);
  }
}

// 싱글톤 인스턴스
export const leaderboardEngine = new LeaderboardEngine();