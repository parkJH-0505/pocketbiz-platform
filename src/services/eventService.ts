/**
 * 이벤트 서비스 레이어
 * 백엔드 API 호출을 모방하는 서비스
 */

import { EVENT_DATABASE } from '../data/eventDatabase';
import type {
  EventWithAnalysis,
  EventFilterOptions,
  EventsResponse
} from '../types/event.types';

// 날짜 계산 유틸
const calculateDaysUntil = (endDate: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

// 상태 계산
const calculateStatus = (startDate: Date, endDate: Date): EventWithAnalysis['status'] => {
  const now = new Date();
  if (now < startDate) return 'upcoming';
  if (now > endDate) return 'closed';
  const daysLeft = calculateDaysUntil(endDate);
  if (daysLeft <= 7) return 'closing';
  return 'open';
};

// 긴급도 계산
const calculateUrgency = (daysUntil: number): EventWithAnalysis['urgencyLevel'] => {
  if (daysUntil <= 3) return 'critical';
  if (daysUntil <= 7) return 'high';
  if (daysUntil <= 14) return 'medium';
  return 'low';
};

export class EventService {
  // 모든 이벤트 조회 (필터 적용)
  static async getEvents(
    filters?: EventFilterOptions,
    page: number = 1,
    pageSize: number = 20
  ): Promise<EventsResponse> {
    // 백엔드 API 호출 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 300));

    let filteredEvents = [...EVENT_DATABASE];

    // 실시간 계산 필드 업데이트
    filteredEvents = filteredEvents.map(event => ({
      ...event,
      daysUntilDeadline: calculateDaysUntil(event.applicationEndDate),
      status: calculateStatus(event.applicationStartDate, event.applicationEndDate),
      urgencyLevel: calculateUrgency(calculateDaysUntil(event.applicationEndDate))
    }));

    // 필터 적용
    if (filters) {
      // 카테고리 필터
      if (filters.categories && filters.categories.length > 0) {
        // 카테고리 매칭 로직
      }

      // 지원분야 필터
      if (filters.supportFields && filters.supportFields.length > 0) {
        filteredEvents = filteredEvents.filter(event =>
          filters.supportFields!.includes(event.supportField)
        );
      }

      // 지역 필터
      if (filters.regions && filters.regions.length > 0) {
        filteredEvents = filteredEvents.filter(event =>
          filters.regions!.includes(event.targetRegion) ||
          event.targetRegion === '전국'
        );
      }

      // 마감일 필터
      if (filters.deadlineRange && filters.deadlineRange !== 'all') {
        const daysLimit =
          filters.deadlineRange === 'thisWeek' ? 7 :
          filters.deadlineRange === 'thisMonth' ? 30 : 60;

        filteredEvents = filteredEvents.filter(event =>
          event.daysUntilDeadline !== undefined &&
          event.daysUntilDeadline >= 0 &&
          event.daysUntilDeadline <= daysLimit
        );
      }

      // 성장단계 필터
      if (filters.stages && filters.stages.length > 0) {
        filteredEvents = filteredEvents.filter(event =>
          event.analysis?.recommendedStages.some(stage =>
            filters.stages!.includes(stage)
          )
        );
      }

      // 섹터 필터
      if (filters.sectors && filters.sectors.length > 0) {
        filteredEvents = filteredEvents.filter(event =>
          event.analysis?.recommendedSectors.some(sector =>
            filters.sectors!.includes(sector)
          )
        );
      }
    }

    // 정렬 (마감일 가까운 순)
    filteredEvents.sort((a, b) =>
      (a.daysUntilDeadline || 999) - (b.daysUntilDeadline || 999)
    );

    // 페이지네이션
    const totalCount = filteredEvents.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedEvents = filteredEvents.slice(startIndex, startIndex + pageSize);

    return {
      events: paginatedEvents,
      totalCount,
      page,
      pageSize
    };
  }

  // 사용자 매칭 이벤트 조회
  static async getMatchingEvents(
    userProfile: {
      core5Scores: { GO: number; EC: number; PT: number; PF: number; TO: number };
      stage: string;
      sector: string;
      region?: string;
    }
  ): Promise<EventWithAnalysis[]> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const allEvents = await this.getEvents();

    return allEvents.events.filter(event => {
      if (!event.analysis) return false;

      // Core5 매칭 계산
      const required = event.analysis.requiredScores;
      let matchCount = 0;
      let totalGap = 0;

      Object.keys(required).forEach(axis => {
        const userScore = userProfile.core5Scores[axis as keyof typeof required];
        const requiredScore = required[axis as keyof typeof required];

        if (userScore >= requiredScore) {
          matchCount++;
        } else {
          totalGap += requiredScore - userScore;
        }
      });

      // 3개 이상 축 충족 또는 총 부족분이 30점 이하
      const isCore5Match = matchCount >= 3 || totalGap <= 30;

      // 성장단계 매칭
      const isStageMatch = event.analysis.recommendedStages.includes(userProfile.stage);

      // 섹터 매칭
      const isSectorMatch = event.analysis.recommendedSectors.includes(userProfile.sector);

      // 지역 매칭
      const isRegionMatch = !userProfile.region ||
        event.targetRegion === '전국' ||
        event.targetRegion === userProfile.region;

      // 종합 매칭 (Core5와 최소 1개 조건 충족)
      return isCore5Match && (isStageMatch || isSectorMatch) && isRegionMatch;
    })
    .sort((a, b) => {
      // 우선순위: 마감 임박 + Core5 매칭도
      const urgencyWeight = (a.urgencyLevel === 'critical' ? 100 : 0) -
                           (b.urgencyLevel === 'critical' ? 100 : 0);
      return urgencyWeight || ((a.daysUntilDeadline || 999) - (b.daysUntilDeadline || 999));
    });
  }

  // 단일 이벤트 조회
  static async getEventById(eventId: string): Promise<EventWithAnalysis | null> {
    await new Promise(resolve => setTimeout(resolve, 100));

    const event = EVENT_DATABASE.find(e => e.id === eventId);
    if (!event) return null;

    return {
      ...event,
      daysUntilDeadline: calculateDaysUntil(event.applicationEndDate),
      status: calculateStatus(event.applicationStartDate, event.applicationEndDate),
      urgencyLevel: calculateUrgency(calculateDaysUntil(event.applicationEndDate))
    };
  }

  // 추천 이벤트 (THE ONE)
  static async getTopRecommendation(
    userProfile: any
  ): Promise<EventWithAnalysis | null> {
    const matchingEvents = await this.getMatchingEvents(userProfile);

    if (matchingEvents.length === 0) return null;

    // 우선순위 계산
    const scored = matchingEvents.map(event => {
      let score = 0;

      // 마감 임박도 (40%)
      if (event.daysUntilDeadline! <= 7) score += 40;
      else if (event.daysUntilDeadline! <= 14) score += 30;
      else if (event.daysUntilDeadline! <= 30) score += 20;

      // Core5 매칭도 (30%)
      if (event.analysis) {
        const required = event.analysis.requiredScores;
        let matchCount = 0;
        Object.keys(required).forEach(axis => {
          if (userProfile.core5Scores[axis] >= required[axis as keyof typeof required]) {
            matchCount++;
          }
        });
        score += (matchCount / 5) * 30;
      }

      // 준비 난이도 (30%)
      if (event.analysis?.preparationDifficulty === 'easy') score += 30;
      else if (event.analysis?.preparationDifficulty === 'medium') score += 20;
      else score += 10;

      return { event, score };
    });

    // 최고 점수 이벤트 반환
    scored.sort((a, b) => b.score - a.score);
    return scored[0].event;
  }

  // 통계 정보
  static async getEventStats(): Promise<{
    total: number;
    open: number;
    closing: number;
    thisWeek: number;
    byField: Record<string, number>;
  }> {
    await new Promise(resolve => setTimeout(resolve, 100));

    const events = EVENT_DATABASE.map(event => ({
      ...event,
      daysUntilDeadline: calculateDaysUntil(event.applicationEndDate),
      status: calculateStatus(event.applicationStartDate, event.applicationEndDate)
    }));

    const stats = {
      total: events.length,
      open: events.filter(e => e.status === 'open').length,
      closing: events.filter(e => e.status === 'closing').length,
      thisWeek: events.filter(e =>
        e.daysUntilDeadline !== undefined &&
        e.daysUntilDeadline >= 0 &&
        e.daysUntilDeadline <= 7
      ).length,
      byField: events.reduce((acc, event) => {
        acc[event.supportField] = (acc[event.supportField] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return stats;
  }
}