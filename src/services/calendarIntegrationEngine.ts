/**
 * Calendar Integration Engine
 *
 * 캘린더 이벤트와 감정/모멘텀을 연동하는 엔진
 * - 일정별 감정 예측
 * - 패턴 분석
 * - 최적 일정 추천
 */

import type {
  EmotionCalendarEvent,
  CalendarPattern,
  IntegrationEvent
} from '../types/integration.types';
import type { EmotionalState } from '../types/emotional.types';
import { emotionAnalyticsEngine } from './emotionAnalyticsEngine';
import { momentumPredictionEngine } from './momentumPredictionEngine';

export class CalendarIntegrationEngine {
  private readonly STORAGE_KEY = 'calendar-integration-data';
  private readonly PATTERN_KEY = 'calendar-patterns';

  /**
   * 캘린더 이벤트와 감정 연동
   */
  async syncCalendarEvent(event: any): Promise<EmotionCalendarEvent> {
    // 이벤트 타입 분류
    const eventType = this.classifyEventType(event);

    // 감정 예측
    const predictedMood = await this.predictEventMood(event, eventType);

    // 모멘텀 영향 계산
    const { impact, score } = this.calculateMomentumImpact(eventType, event);

    // 인사이트 생성
    const insights = this.generateEventInsights(event, eventType, predictedMood);

    const emotionEvent: EmotionCalendarEvent = {
      id: `emotion_${event.id}`,
      eventId: event.id,
      title: event.title || event.summary || 'Untitled Event',
      startTime: new Date(event.start),
      endTime: new Date(event.end),
      eventType,
      predictedMood,
      momentumImpact: impact,
      impactScore: score,
      insights
    };

    // 저장
    this.saveEmotionEvent(emotionEvent);

    return emotionEvent;
  }

  /**
   * 이벤트 타입 분류
   */
  private classifyEventType(event: any): EmotionCalendarEvent['eventType'] {
    const title = (event.title || event.summary || '').toLowerCase();
    const description = (event.description || '').toLowerCase();
    const combined = `${title} ${description}`;

    // 키워드 기반 분류
    if (combined.includes('meeting') || combined.includes('회의') ||
        combined.includes('미팅') || combined.includes('call')) {
      return 'meeting';
    }

    if (combined.includes('deadline') || combined.includes('마감') ||
        combined.includes('due') || combined.includes('제출')) {
      return 'deadline';
    }

    if (combined.includes('break') || combined.includes('휴식') ||
        combined.includes('lunch') || combined.includes('점심')) {
      return 'break';
    }

    if (combined.includes('personal') || combined.includes('개인') ||
        combined.includes('병원') || combined.includes('약속')) {
      return 'personal';
    }

    // 업무 시간 체크
    const hour = new Date(event.start).getHours();
    if (hour >= 9 && hour <= 18) {
      return 'work';
    }

    return 'other';
  }

  /**
   * 이벤트별 감정 예측
   */
  private async predictEventMood(
    event: any,
    eventType: EmotionCalendarEvent['eventType']
  ): Promise<EmotionCalendarEvent['predictedMood']> {
    const historicalData = this.getHistoricalEventMoods(eventType);

    // 기본 예측값
    let baseMood = {
      before: 50,
      during: 50,
      after: 50
    };

    // 이벤트 타입별 기본 영향
    switch (eventType) {
      case 'meeting':
        baseMood = { before: 45, during: 40, after: 35 }; // 회의는 보통 에너지 소모
        break;
      case 'deadline':
        baseMood = { before: 30, during: 35, after: 60 }; // 마감 후 해방감
        break;
      case 'break':
        baseMood = { before: 50, during: 70, after: 65 }; // 휴식은 회복
        break;
      case 'personal':
        baseMood = { before: 55, during: 60, after: 60 }; // 개인 일정은 보통 긍정적
        break;
      case 'work':
        baseMood = { before: 50, during: 55, after: 50 }; // 일반 업무
        break;
    }

    // 시간대 보정
    const hour = new Date(event.start).getHours();
    if (hour < 10) {
      // 아침 일정은 에너지 감소
      baseMood.before -= 5;
      baseMood.during -= 5;
    } else if (hour >= 14 && hour <= 16) {
      // 오후 슬럼프
      baseMood.during -= 10;
    }

    // 기간 보정 (긴 이벤트는 피로 증가)
    const durationHours = (new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60 * 60);
    if (durationHours > 2) {
      baseMood.during -= Math.min(20, durationHours * 5);
      baseMood.after -= Math.min(15, durationHours * 3);
    }

    // 과거 데이터로 보정
    if (historicalData.length > 0) {
      const avgHistorical = this.calculateAverageMood(historicalData);
      baseMood.before = (baseMood.before + avgHistorical.before) / 2;
      baseMood.during = (baseMood.during + avgHistorical.during) / 2;
      baseMood.after = (baseMood.after + avgHistorical.after) / 2;
    }

    return baseMood;
  }

  /**
   * 모멘텀 영향 계산
   */
  private calculateMomentumImpact(
    eventType: EmotionCalendarEvent['eventType'],
    event: any
  ): { impact: 'positive' | 'negative' | 'neutral'; score: number } {
    let score = 0;

    // 이벤트 타입별 기본 점수
    const typeScores = {
      meeting: -10,     // 회의는 보통 모멘텀 감소
      deadline: -20,    // 마감은 스트레스
      break: +15,       // 휴식은 회복
      personal: +5,     // 개인 일정은 약간 긍정적
      work: 0,          // 일반 업무는 중립
      other: 0
    };

    score = typeScores[eventType];

    // 시간 길이 영향
    const durationHours = (new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60 * 60);
    if (eventType === 'meeting' && durationHours > 1) {
      score -= durationHours * 5; // 긴 회의는 더 부정적
    } else if (eventType === 'break' && durationHours > 0.5) {
      score += 5; // 충분한 휴식은 더 긍정적
    }

    // 시간대 영향
    const hour = new Date(event.start).getHours();
    if (hour >= 9 && hour <= 11) {
      score += 5; // 골든타임
    } else if (hour >= 14 && hour <= 16) {
      score -= 5; // 오후 슬럼프
    }

    // 영향 분류
    let impact: 'positive' | 'negative' | 'neutral';
    if (score > 10) impact = 'positive';
    else if (score < -10) impact = 'negative';
    else impact = 'neutral';

    return { impact, score: Math.max(-100, Math.min(100, score)) };
  }

  /**
   * 이벤트 인사이트 생성
   */
  private generateEventInsights(
    event: any,
    eventType: EmotionCalendarEvent['eventType'],
    predictedMood: any
  ): string[] {
    const insights: string[] = [];
    const hour = new Date(event.start).getHours();
    const durationHours = (new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60 * 60);

    // 타이밍 인사이트
    if (hour < 9) {
      insights.push('💡 이른 아침 일정은 하루의 에너지에 영향을 줄 수 있습니다');
    } else if (hour >= 14 && hour <= 16) {
      insights.push('😴 오후 슬럼프 시간대의 일정입니다. 카페인이나 짧은 휴식을 고려하세요');
    }

    // 기간 인사이트
    if (durationHours > 2) {
      insights.push(`⏰ ${Math.round(durationHours)}시간의 긴 일정입니다. 중간 휴식을 계획하세요`);
    }

    // 타입별 인사이트
    switch (eventType) {
      case 'meeting':
        if (durationHours > 1) {
          insights.push('💬 긴 회의입니다. 핵심 안건을 먼저 다루는 것을 추천합니다');
        }
        if (predictedMood.after < 40) {
          insights.push('🔋 회의 후 에너지 회복 시간을 확보하세요');
        }
        break;

      case 'deadline':
        insights.push('🎯 마감 전 충분한 준비 시간을 확보하세요');
        if (hour > 20) {
          insights.push('🌙 늦은 마감은 수면에 영향을 줄 수 있습니다');
        }
        break;

      case 'break':
        insights.push('✨ 휴식 시간을 최대한 활용하세요. 스트레칭이나 산책을 추천합니다');
        break;

      case 'work':
        if (hour >= 9 && hour <= 11) {
          insights.push('🚀 골든타임입니다. 중요한 작업에 집중하기 좋은 시간입니다');
        }
        break;
    }

    return insights;
  }

  /**
   * 캘린더 패턴 분석
   */
  async analyzeCalendarPatterns(events: any[]): Promise<CalendarPattern> {
    // 회의 밀도 계산
    const meetingEvents = events.filter(e => this.classifyEventType(e) === 'meeting');
    const meetingsByDay = this.groupEventsByDay(meetingEvents);
    const meetingsByHour = this.groupEventsByHour(meetingEvents);

    const meetingDensity = {
      daily: meetingEvents.length / 30, // 30일 기준
      weekly: meetingEvents.length / 4, // 4주 기준
      peakDay: this.findPeakDay(meetingsByDay),
      peakHour: this.findPeakHour(meetingsByHour)
    };

    // 업무 패턴 분석
    const workEvents = events.filter(e => {
      const type = this.classifyEventType(e);
      return type === 'work' || type === 'meeting';
    });

    const focusBlocks = this.identifyFocusBlocks(events);
    const fragmentationScore = this.calculateFragmentation(workEvents);

    const workPattern = {
      focusBlocks: focusBlocks.length,
      averageBlockLength: this.calculateAverageBlockLength(focusBlocks),
      fragmentationScore
    };

    // 감정 영향 분석
    const stressfulEvents = this.identifyStressfulEventTypes(events);
    const energizingEvents = this.identifyEnergizingEventTypes(events);
    const optimalSchedule = await this.generateOptimalSchedule(events);

    const emotionalImpact = {
      stressfulEvents,
      energizingEvents,
      optimalSchedule
    };

    // 패턴 타입 결정
    let patternType: CalendarPattern['patternType'] = 'balanced';
    if (meetingDensity.daily > 3) patternType = 'clustered';
    else if (meetingDensity.daily < 1) patternType = 'sparse';
    else if (fragmentationScore < 30) patternType = 'balanced';

    return {
      patternType,
      meetingDensity,
      workPattern,
      emotionalImpact
    };
  }

  /**
   * 최적 일정 추천
   */
  async recommendOptimalSchedule(
    existingEvents: any[],
    newEventType: EmotionCalendarEvent['eventType'],
    duration: number // 분 단위
  ): Promise<{ time: Date; score: number; reason: string }[]> {
    const recommendations: any[] = [];
    const now = new Date();

    // 다음 7일 검색
    for (let day = 0; day < 7; day++) {
      const targetDate = new Date(now.getTime() + day * 24 * 60 * 60 * 1000);

      // 해당 날짜의 빈 시간 찾기
      const freeSlots = this.findFreeSlots(existingEvents, targetDate, duration);

      for (const slot of freeSlots) {
        const score = await this.scoreTimeSlot(slot, newEventType);
        const reason = this.explainTimeSlot(slot, score);

        recommendations.push({
          time: slot,
          score,
          reason
        });
      }
    }

    // 점수 순으로 정렬하여 상위 5개 반환
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  /**
   * 유틸리티 함수들
   */
  private getHistoricalEventMoods(eventType: string): any[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return data.filter((e: any) => e.eventType === eventType && e.actualMood);
      }
    } catch (error) {
      console.error('Failed to load historical moods:', error);
    }
    return [];
  }

  private calculateAverageMood(moods: any[]): any {
    if (moods.length === 0) {
      return { before: 50, during: 50, after: 50 };
    }

    const sum = moods.reduce((acc, mood) => ({
      before: acc.before + (mood.predictedMood?.before || 50),
      during: acc.during + (mood.predictedMood?.during || 50),
      after: acc.after + (mood.predictedMood?.after || 50)
    }), { before: 0, during: 0, after: 0 });

    return {
      before: sum.before / moods.length,
      during: sum.during / moods.length,
      after: sum.after / moods.length
    };
  }

  private saveEmotionEvent(event: EmotionCalendarEvent): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const events = stored ? JSON.parse(stored) : [];

      // 기존 이벤트 업데이트 또는 추가
      const index = events.findIndex((e: any) => e.id === event.id);
      if (index >= 0) {
        events[index] = event;
      } else {
        events.push(event);
      }

      // 최대 1000개까지만 저장
      if (events.length > 1000) {
        events.shift();
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(events));
    } catch (error) {
      console.error('Failed to save emotion event:', error);
    }
  }

  private groupEventsByDay(events: any[]): Map<number, any[]> {
    const grouped = new Map<number, any[]>();
    events.forEach(event => {
      const day = new Date(event.start).getDay();
      if (!grouped.has(day)) {
        grouped.set(day, []);
      }
      grouped.get(day)!.push(event);
    });
    return grouped;
  }

  private groupEventsByHour(events: any[]): Map<number, any[]> {
    const grouped = new Map<number, any[]>();
    events.forEach(event => {
      const hour = new Date(event.start).getHours();
      if (!grouped.has(hour)) {
        grouped.set(hour, []);
      }
      grouped.get(hour)!.push(event);
    });
    return grouped;
  }

  private findPeakDay(groupedByDay: Map<number, any[]>): string {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    let maxDay = 0;
    let maxCount = 0;

    groupedByDay.forEach((events, day) => {
      if (events.length > maxCount) {
        maxCount = events.length;
        maxDay = day;
      }
    });

    return days[maxDay];
  }

  private findPeakHour(groupedByHour: Map<number, any[]>): number {
    let maxHour = 0;
    let maxCount = 0;

    groupedByHour.forEach((events, hour) => {
      if (events.length > maxCount) {
        maxCount = events.length;
        maxHour = hour;
      }
    });

    return maxHour;
  }

  private identifyFocusBlocks(events: any[]): any[] {
    const focusBlocks: any[] = [];
    const sortedEvents = [...events].sort((a, b) =>
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    let currentBlock: any = null;

    for (const event of sortedEvents) {
      const type = this.classifyEventType(event);
      if (type === 'work') {
        if (!currentBlock) {
          currentBlock = { start: event.start, end: event.end };
        } else {
          // 이벤트 간 간격이 30분 이내면 같은 블록
          const gap = new Date(event.start).getTime() - new Date(currentBlock.end).getTime();
          if (gap <= 30 * 60 * 1000) {
            currentBlock.end = event.end;
          } else {
            focusBlocks.push(currentBlock);
            currentBlock = { start: event.start, end: event.end };
          }
        }
      }
    }

    if (currentBlock) {
      focusBlocks.push(currentBlock);
    }

    return focusBlocks;
  }

  private calculateAverageBlockLength(blocks: any[]): number {
    if (blocks.length === 0) return 0;

    const totalMinutes = blocks.reduce((sum, block) => {
      const duration = new Date(block.end).getTime() - new Date(block.start).getTime();
      return sum + duration / (1000 * 60);
    }, 0);

    return totalMinutes / blocks.length;
  }

  private calculateFragmentation(events: any[]): number {
    if (events.length < 2) return 0;

    const sortedEvents = [...events].sort((a, b) =>
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    let gaps = 0;
    let totalGapTime = 0;

    for (let i = 1; i < sortedEvents.length; i++) {
      const gap = new Date(sortedEvents[i].start).getTime() -
                  new Date(sortedEvents[i - 1].end).getTime();

      if (gap > 0 && gap < 60 * 60 * 1000) { // 1시간 이내의 간격
        gaps++;
        totalGapTime += gap;
      }
    }

    // 파편화 점수: 간격 수 * 평균 간격 시간 / 전체 이벤트 수
    const avgGapMinutes = gaps > 0 ? (totalGapTime / gaps) / (1000 * 60) : 0;
    const score = Math.min(100, (gaps * avgGapMinutes) / events.length);

    return Math.round(score);
  }

  private identifyStressfulEventTypes(events: any[]): string[] {
    const stressfulTypes: Set<string> = new Set();

    events.forEach(event => {
      const type = this.classifyEventType(event);
      if (type === 'deadline' || type === 'meeting') {
        stressfulTypes.add(type);
      }

      // 긴 이벤트도 스트레스 요인
      const duration = new Date(event.end).getTime() - new Date(event.start).getTime();
      if (duration > 3 * 60 * 60 * 1000) { // 3시간 이상
        stressfulTypes.add('long_event');
      }
    });

    return Array.from(stressfulTypes);
  }

  private identifyEnergizingEventTypes(events: any[]): string[] {
    const energizingTypes: Set<string> = new Set();

    events.forEach(event => {
      const type = this.classifyEventType(event);
      if (type === 'break' || type === 'personal') {
        energizingTypes.add(type);
      }
    });

    return Array.from(energizingTypes);
  }

  private async generateOptimalSchedule(events: any[]): Promise<any> {
    // 간단한 최적 일정 생성 로직
    return {
      morningFocus: '09:00 - 11:00',
      lunchBreak: '12:00 - 13:00',
      afternoonMeetings: '14:00 - 16:00',
      eveningWrapup: '17:00 - 18:00'
    };
  }

  private findFreeSlots(
    events: any[],
    date: Date,
    durationMinutes: number
  ): Date[] {
    const slots: Date[] = [];
    const dayEvents = events.filter(e => {
      const eventDate = new Date(e.start);
      return eventDate.toDateString() === date.toDateString();
    }).sort((a, b) =>
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    // 업무 시간 (9시-18시) 내에서 검색
    const workStart = new Date(date);
    workStart.setHours(9, 0, 0, 0);
    const workEnd = new Date(date);
    workEnd.setHours(18, 0, 0, 0);

    let currentTime = workStart.getTime();

    for (const event of dayEvents) {
      const eventStart = new Date(event.start).getTime();
      const gap = eventStart - currentTime;

      if (gap >= durationMinutes * 60 * 1000) {
        slots.push(new Date(currentTime));
      }

      currentTime = Math.max(currentTime, new Date(event.end).getTime());
    }

    // 마지막 이벤트 후 체크
    if (workEnd.getTime() - currentTime >= durationMinutes * 60 * 1000) {
      slots.push(new Date(currentTime));
    }

    return slots;
  }

  private async scoreTimeSlot(
    slot: Date,
    eventType: EmotionCalendarEvent['eventType']
  ): Promise<number> {
    let score = 50;

    const hour = slot.getHours();

    // 시간대별 점수
    if (hour >= 9 && hour <= 11) {
      score += eventType === 'work' ? 20 : 10;
    } else if (hour >= 14 && hour <= 16) {
      score -= eventType === 'meeting' ? 10 : 5;
    }

    // 이벤트 타입별 최적 시간
    switch (eventType) {
      case 'meeting':
        if (hour === 10 || hour === 15) score += 10;
        break;
      case 'work':
        if (hour >= 9 && hour <= 11) score += 15;
        break;
      case 'break':
        if (hour === 12 || hour === 15) score += 10;
        break;
    }

    return Math.max(0, Math.min(100, score));
  }

  private explainTimeSlot(slot: Date, score: number): string {
    const hour = slot.getHours();
    const reasons: string[] = [];

    if (hour >= 9 && hour <= 11) {
      reasons.push('골든타임');
    } else if (hour === 12) {
      reasons.push('점심 시간');
    } else if (hour >= 14 && hour <= 16) {
      reasons.push('오후 시간');
    }

    if (score >= 80) {
      reasons.push('최적 시간대');
    } else if (score >= 60) {
      reasons.push('권장 시간대');
    }

    return reasons.join(', ') || '가능한 시간';
  }
}

// 싱글톤 인스턴스
export const calendarIntegrationEngine = new CalendarIntegrationEngine();