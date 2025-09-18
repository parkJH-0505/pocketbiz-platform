/**
 * Action Completion Tracker
 *
 * 사용자 액션 완료 추적 및 학습 시스템
 * - 완료 시간 측정
 * - 성공률 추적
 * - 사용자 패턴 학습
 * - 개인화 개선
 */

import type { TodaysAction } from '../../types/dashboard';
import type { AxisKey } from '../../types';

// ============================================================================
// Types
// ============================================================================

export interface ActionEvent {
  id: string;
  type: 'action_started' | 'action_completed' | 'action_abandoned' | 'action_feedback';
  timestamp: Date;
  sessionId: string;
  data: ActionEventData;
}

interface ActionEventData {
  actionId: string;
  actionType: 'kpi' | 'opportunity' | 'buildup' | 'exploration';
  estimatedTime?: number;
  actualTime?: number;
  success?: boolean;
  completionRate?: number; // 부분 완료율 (0-1)
  feedback?: UserFeedback;
  context?: ActionContext;
}

interface UserFeedback {
  difficulty: 'too_easy' | 'just_right' | 'too_hard';
  satisfaction: number; // 1-5
  timeAccuracy: 'too_short' | 'accurate' | 'too_long';
  comments?: string;
}

interface ActionContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  dayOfWeek: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  previousActions: string[]; // 최근 5개 액션 ID
}

export interface UserPatternAnalysis {
  preferredTimeSlots: string[];
  averageSessionDuration: number;
  successRateByType: Record<string, number>;
  difficultyPreference: 'easy' | 'medium' | 'hard';
  completionStreak: number;
  lastActiveDate: Date;
  totalActions: number;
  insights: PatternInsight[];
}

interface PatternInsight {
  type: 'strength' | 'weakness' | 'opportunity' | 'trend';
  message: string;
  confidence: number; // 0-1
  actionable: boolean;
}

// ============================================================================
// Action Tracker Class
// ============================================================================

export class ActionTracker {
  private static instance: ActionTracker;
  private events: ActionEvent[] = [];
  private currentSessionId: string;

  private constructor() {
    this.currentSessionId = this.generateSessionId();
    this.loadEventsFromStorage();
  }

  public static getInstance(): ActionTracker {
    if (!ActionTracker.instance) {
      ActionTracker.instance = new ActionTracker();
    }
    return ActionTracker.instance;
  }

  /**
   * 액션 시작 추적
   */
  public trackActionStart(action: TodaysAction): void {
    const event: ActionEvent = {
      id: this.generateEventId(),
      type: 'action_started',
      timestamp: new Date(),
      sessionId: this.currentSessionId,
      data: {
        actionId: action.id,
        actionType: action.actionType,
        estimatedTime: action.impact.timeToComplete,
        context: this.getCurrentContext()
      }
    };

    this.addEvent(event);

    // 시작 시간을 localStorage에 저장 (컴포넌트에서 사용)
    localStorage.setItem('action_start_time', Date.now().toString());
    localStorage.setItem('current_action_id', action.id);
  }

  /**
   * 액션 완료 추적
   */
  public trackActionCompleted(actionId: string, completionData?: {
    completionRate?: number;
    feedback?: UserFeedback;
  }): void {
    const startTime = parseInt(localStorage.getItem('action_start_time') || '0');
    const actualTime = startTime > 0 ? Math.floor((Date.now() - startTime) / 1000 / 60) : 0;

    const event: ActionEvent = {
      id: this.generateEventId(),
      type: 'action_completed',
      timestamp: new Date(),
      sessionId: this.currentSessionId,
      data: {
        actionId,
        actionType: this.getActionType(actionId), // 추정
        actualTime,
        success: (completionData?.completionRate || 1) >= 0.8,
        completionRate: completionData?.completionRate || 1,
        feedback: completionData?.feedback,
        context: this.getCurrentContext()
      }
    };

    this.addEvent(event);

    // 완료 후 정리
    localStorage.removeItem('action_start_time');
    localStorage.removeItem('current_action_id');
  }

  /**
   * 액션 포기 추적
   */
  public trackActionAbandoned(actionId: string, reason?: string): void {
    const startTime = parseInt(localStorage.getItem('action_start_time') || '0');
    const partialTime = startTime > 0 ? Math.floor((Date.now() - startTime) / 1000 / 60) : 0;

    const event: ActionEvent = {
      id: this.generateEventId(),
      type: 'action_abandoned',
      timestamp: new Date(),
      sessionId: this.currentSessionId,
      data: {
        actionId,
        actionType: this.getActionType(actionId),
        actualTime: partialTime,
        success: false,
        completionRate: 0,
        context: this.getCurrentContext()
      }
    };

    this.addEvent(event);
  }

  /**
   * 사용자 패턴 분석
   */
  public analyzeUserPattern(): UserPatternAnalysis {
    const completedActions = this.events.filter(e => e.type === 'action_completed');
    const startedActions = this.events.filter(e => e.type === 'action_started');

    // 기본 통계
    const totalActions = completedActions.length;
    const successfulActions = completedActions.filter(e => e.data.success);
    const overallSuccessRate = totalActions > 0 ? successfulActions.length / totalActions : 0;

    // 선호 시간대 분석
    const timeSlotCounts = completedActions.reduce((acc, event) => {
      const timeSlot = this.getTimeSlot(event.timestamp);
      acc[timeSlot] = (acc[timeSlot] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const preferredTimeSlots = Object.entries(timeSlotCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([slot]) => slot);

    // 평균 세션 시간
    const sessionsWithTime = completedActions.filter(e => e.data.actualTime && e.data.actualTime > 0);
    const averageSessionDuration = sessionsWithTime.length > 0 ?
      sessionsWithTime.reduce((sum, e) => sum + (e.data.actualTime || 0), 0) / sessionsWithTime.length :
      15; // 기본값

    // 타입별 성공률
    const successRateByType = this.calculateSuccessRateByType(completedActions);

    // 난이도 선호도
    const difficultyPreference = this.analyzeDifficultyPreference(completedActions);

    // 연속 완료 스트릭
    const completionStreak = this.calculateCompletionStreak();

    // 마지막 활동 날짜
    const lastActiveDate = completedActions.length > 0 ?
      new Date(Math.max(...completedActions.map(e => e.timestamp.getTime()))) :
      new Date();

    // 인사이트 생성
    const insights = this.generatePatternInsights({
      totalActions,
      overallSuccessRate,
      preferredTimeSlots,
      averageSessionDuration,
      successRateByType,
      completionStreak
    });

    return {
      preferredTimeSlots,
      averageSessionDuration,
      successRateByType,
      difficultyPreference,
      completionStreak,
      lastActiveDate,
      totalActions,
      insights
    };
  }

  /**
   * 개인화 추천 생성
   */
  public generatePersonalizationRecommendations(): {
    optimalTime: string;
    recommendedDifficulty: 'easy' | 'medium' | 'hard';
    estimatedSuccessRate: number;
    tips: string[];
  } {
    const pattern = this.analyzeUserPattern();

    return {
      optimalTime: pattern.preferredTimeSlots[0] || 'morning',
      recommendedDifficulty: pattern.difficultyPreference,
      estimatedSuccessRate: Math.max(pattern.successRateByType['overall'] || 0.7, 0.5),
      tips: this.generatePersonalizedTips(pattern)
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private addEvent(event: ActionEvent): void {
    this.events.push(event);
    this.saveEventsToStorage();

    // 최근 100개 이벤트만 유지 (성능 및 저장 공간 관리)
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
  }

  private loadEventsFromStorage(): void {
    try {
      const storedEvents = localStorage.getItem('dashboard_action_events');
      if (storedEvents) {
        const parsed = JSON.parse(storedEvents);
        this.events = parsed.map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load action events from storage:', error);
      this.events = [];
    }
  }

  private saveEventsToStorage(): void {
    try {
      localStorage.setItem('dashboard_action_events', JSON.stringify(this.events));
    } catch (error) {
      console.warn('Failed to save action events to storage:', error);
    }
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentContext(): ActionContext {
    const now = new Date();
    const hour = now.getHours();
    let timeOfDay: 'morning' | 'afternoon' | 'evening';

    if (hour < 12) {
      timeOfDay = 'morning';
    } else if (hour < 18) {
      timeOfDay = 'afternoon';
    } else {
      timeOfDay = 'evening';
    }

    const dayOfWeek = now.toLocaleDateString('ko-KR', { weekday: 'long' });

    // 최근 5개 액션 가져오기
    const recentActions = this.events
      .filter(e => e.type === 'action_started')
      .slice(-5)
      .map(e => e.data.actionId);

    return {
      timeOfDay,
      dayOfWeek,
      previousActions: recentActions
    };
  }

  private getTimeSlot(timestamp: Date): string {
    const hour = timestamp.getHours();
    if (hour < 6) return 'early_morning';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    if (hour < 22) return 'evening';
    return 'night';
  }

  private getActionType(actionId: string): 'kpi' | 'opportunity' | 'buildup' | 'exploration' {
    // 액션 ID에서 타입 추정 (실제로는 더 정교한 매핑 필요)
    if (actionId.includes('kpi')) return 'kpi';
    if (actionId.includes('opportunity')) return 'opportunity';
    if (actionId.includes('buildup')) return 'buildup';
    return 'exploration';
  }

  private calculateSuccessRateByType(events: ActionEvent[]): Record<string, number> {
    const typeGroups = events.reduce((acc, event) => {
      const type = event.data.actionType;
      if (!acc[type]) acc[type] = { total: 0, success: 0 };
      acc[type].total++;
      if (event.data.success) acc[type].success++;
      return acc;
    }, {} as Record<string, { total: number; success: number }>);

    const rates: Record<string, number> = {};
    Object.entries(typeGroups).forEach(([type, data]) => {
      rates[type] = data.total > 0 ? data.success / data.total : 0;
    });

    return rates;
  }

  private analyzeDifficultyPreference(events: ActionEvent[]): 'easy' | 'medium' | 'hard' {
    // 피드백 데이터 기반 난이도 선호도 분석
    const feedbackEvents = events.filter(e => e.data.feedback?.difficulty);

    if (feedbackEvents.length === 0) return 'medium'; // 기본값

    const preferences = feedbackEvents.reduce((acc, event) => {
      const pref = event.data.feedback!.difficulty;
      acc[pref] = (acc[pref] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 'just_right' 피드백이 많은 난이도를 선호도로 판단
    if (preferences.just_right > (feedbackEvents.length / 2)) {
      return 'medium'; // 대부분 적정하다고 느끼면 medium
    }

    // 'too_easy'가 많으면 더 어려운 것을 선호
    if (preferences.too_easy > preferences.too_hard) {
      return 'hard';
    }

    // 'too_hard'가 많으면 더 쉬운 것을 선호
    return 'easy';
  }

  private calculateCompletionStreak(): number {
    const recentEvents = this.events
      .filter(e => e.type === 'action_completed')
      .slice(-10) // 최근 10개 액션
      .reverse(); // 최신순 정렬

    let streak = 0;
    for (const event of recentEvents) {
      if (event.data.success) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private generatePatternInsights(data: {
    totalActions: number;
    overallSuccessRate: number;
    preferredTimeSlots: string[];
    averageSessionDuration: number;
    successRateByType: Record<string, number>;
    completionStreak: number;
  }): PatternInsight[] {
    const insights: PatternInsight[] = [];

    // 성공률 기반 인사이트
    if (data.overallSuccessRate > 0.8) {
      insights.push({
        type: 'strength',
        message: `높은 완료율 (${Math.round(data.overallSuccessRate * 100)}%)을 유지하고 있어요`,
        confidence: 0.9,
        actionable: false
      });
    } else if (data.overallSuccessRate < 0.5) {
      insights.push({
        type: 'opportunity',
        message: '액션 완료율 개선이 필요해요. 더 쉬운 액션부터 시작해보세요',
        confidence: 0.8,
        actionable: true
      });
    }

    // 시간대 패턴 인사이트
    if (data.preferredTimeSlots.length > 0) {
      insights.push({
        type: 'trend',
        message: `${data.preferredTimeSlots[0]} 시간대에 가장 활발하게 활동하시는군요`,
        confidence: 0.7,
        actionable: true
      });
    }

    // 연속 완료 스트릭
    if (data.completionStreak >= 5) {
      insights.push({
        type: 'strength',
        message: `${data.completionStreak}회 연속 완료! 훌륭한 일관성을 보이고 있어요`,
        confidence: 1.0,
        actionable: false
      });
    }

    return insights;
  }

  private generatePersonalizedTips(pattern: UserPatternAnalysis): string[] {
    const tips: string[] = [];

    // 시간대 기반 팁
    if (pattern.preferredTimeSlots.includes('morning')) {
      tips.push('아침 시간을 활용한 성장 습관이 잘 형성되어 있어요');
    }

    // 성공률 기반 팁
    if (pattern.successRateByType['kpi'] > 0.8) {
      tips.push('KPI 관련 액션에 강점을 보이고 있어요');
    }

    // 세션 시간 기반 팁
    if (pattern.averageSessionDuration < 10) {
      tips.push('짧고 집중적인 세션을 선호하시는군요. 이런 패턴을 유지해보세요');
    }

    return tips;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

export const actionTracker = ActionTracker.getInstance();

export function trackActionStart(action: TodaysAction): void {
  actionTracker.trackActionStart(action);
}

export function trackActionCompleted(actionId: string, completionData?: {
  completionRate?: number;
  feedback?: UserFeedback;
}): void {
  actionTracker.trackActionCompleted(actionId, completionData);
}

export function trackActionAbandoned(actionId: string, reason?: string): void {
  actionTracker.trackActionAbandoned(actionId, reason);
}

export function getUserPattern(): UserPatternAnalysis {
  return actionTracker.analyzeUserPattern();
}

export function getPersonalizationRecommendations() {
  return actionTracker.generatePersonalizationRecommendations();
}