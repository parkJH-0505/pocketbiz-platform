/**
 * Gentle Nudge Engine
 *
 * 사용자 상황에 맞는 부드러운 행동 유도 시스템
 * - 컨텍스트 기반 메시지 선택
 * - 스마트 타이밍 관리
 * - 사용자 피로도 방지
 */

import type {
  NudgeMessage,
  NudgeConditions,
  ActiveNudge,
  NudgeHistory,
  NudgeSettings,
  NudgeTrigger
} from '../types/nudge.types';
import type { MomentumData } from './momentumEngine';
import type { EmotionalState } from '../types/emotional.types';
import { NUDGE_MESSAGES, getMessagesForTrigger, sortMessagesByPriority } from '../data/nudgeMessages';

export class GentleNudgeEngine {
  private readonly STORAGE_KEY = 'gentle-nudge-data';
  private readonly SETTINGS_KEY = 'nudge-settings';
  private readonly HISTORY_KEY = 'nudge-history';

  private activeNudges: ActiveNudge[] = [];
  private nudgeHistory: NudgeHistory[] = [];
  private settings: NudgeSettings;

  constructor() {
    this.settings = this.loadSettings();
    this.loadActiveNudges();
    this.loadHistory();
  }

  /**
   * 현재 상황에 맞는 넛지 메시지 평가 및 반환
   */
  async evaluateNudges(
    momentum: MomentumData | null,
    emotionalState: EmotionalState | null
  ): Promise<NudgeMessage[]> {
    if (!this.settings.enabled) return [];

    // 조용한 시간 체크
    if (this.isQuietTime()) return [];

    // 현재 상황 분석
    const context = this.analyzeContext(momentum, emotionalState);

    // 적용 가능한 트리거 찾기
    const triggers = this.identifyTriggers(context);

    // 각 트리거에 대한 메시지 수집
    const candidateMessages: NudgeMessage[] = [];

    for (const trigger of triggers) {
      const messages = getMessagesForTrigger(trigger);
      const filteredMessages = messages.filter(msg => this.canShowMessage(msg, context));
      candidateMessages.push(...filteredMessages);
    }

    // 우선순위 정렬 및 중복 제거
    const uniqueMessages = this.deduplicateMessages(candidateMessages);
    const sortedMessages = sortMessagesByPriority(uniqueMessages);

    // 빈도 설정에 따라 제한
    const maxMessages = this.getMaxMessagesForFrequency();
    return sortedMessages.slice(0, maxMessages);
  }

  /**
   * 상황 분석
   */
  private analyzeContext(
    momentum: MomentumData | null,
    emotionalState: EmotionalState | null
  ) {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    // 시간대 분석
    const timeOfDay =
      hour < 6 ? 'night' :
      hour < 12 ? 'morning' :
      hour < 18 ? 'afternoon' :
      hour < 22 ? 'evening' : 'night';

    // 마지막 활동 시간
    const lastActivityStr = localStorage.getItem('last-activity-time');
    const lastActivity = lastActivityStr ? new Date(lastActivityStr) : new Date();
    const minutesSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / 60000);

    // 연속 접속일
    const streakDays = parseInt(localStorage.getItem('login-streak') || '0');

    return {
      momentum: momentum?.score || 50,
      stress: emotionalState?.stress || 30,
      energy: emotionalState?.energy || 50,
      timeOfDay,
      dayOfWeek,
      hour,
      streakDays,
      minutesSinceActivity,
      isWorkingHours: hour >= 9 && hour <= 18 && dayOfWeek >= 1 && dayOfWeek <= 5
    };
  }

  /**
   * 트리거 식별
   */
  private identifyTriggers(context: any): NudgeTrigger[] {
    const triggers: NudgeTrigger[] = [];

    // 모멘텀 기반 트리거
    if (context.momentum < 40) {
      triggers.push('low_momentum');
    }
    if (context.momentum >= 80) {
      triggers.push('high_performance');
    }

    // 스트레스 기반 트리거
    if (context.stress > 70) {
      triggers.push('high_stress');
    }

    // 시간 기반 트리거
    if (context.isWorkingHours) {
      triggers.push('work_hours');
    }

    // 비활성 트리거
    if (context.minutesSinceActivity > 30) {
      triggers.push('inactivity');
    }

    // 시간별 트리거
    if (context.hour === 9 && context.timeOfDay === 'morning') {
      triggers.push('time_based'); // 아침 루틴
    }
    if (context.hour === 18 && context.timeOfDay === 'evening') {
      triggers.push('time_based'); // 저녁 회고
    }
    if (context.hour >= 22) {
      triggers.push('time_based'); // 늦은 시간 경고
    }

    // 연속 기록 관련
    if (context.streakDays === 0) {
      triggers.push('streak_break');
    }

    // 마일스톤 근접 (임시 로직)
    const projectProgress = this.getProjectProgress();
    if (projectProgress >= 90) {
      triggers.push('milestone_near');
    }

    return triggers;
  }

  /**
   * 메시지 표시 가능 여부 확인
   */
  private canShowMessage(message: NudgeMessage, context: any): boolean {
    // 활성화된 타입 체크
    if (!this.settings.enabledTypes.includes(message.type)) {
      return false;
    }

    // 최대 표시 횟수 체크
    if (message.maxShowCount) {
      const shownCount = this.getMessageShowCount(message.id);
      if (shownCount >= message.maxShowCount) {
        return false;
      }
    }

    // 쿨다운 체크
    if (message.cooldownMinutes) {
      const lastShown = this.getLastShownTime(message.id);
      if (lastShown) {
        const minutesElapsed = Math.floor((Date.now() - lastShown.getTime()) / 60000);
        if (minutesElapsed < message.cooldownMinutes) {
          return false;
        }
      }
    }

    // 시간 조건 체크 (간단화)
    if (message.trigger === 'time_based') {
      // 아침 루틴은 오전 9시에만
      if (message.id === 'habit_morning_routine' && context.hour !== 9) {
        return false;
      }
      // 저녁 회고는 오후 6시에만
      if (message.id === 'habit_evening_review' && context.hour !== 18) {
        return false;
      }
    }

    return true;
  }

  /**
   * 메시지 중복 제거
   */
  private deduplicateMessages(messages: NudgeMessage[]): NudgeMessage[] {
    const seen = new Set<string>();
    return messages.filter(msg => {
      if (seen.has(msg.id)) return false;
      seen.add(msg.id);
      return true;
    });
  }

  /**
   * 빈도 설정에 따른 최대 메시지 수
   */
  private getMaxMessagesForFrequency(): number {
    switch (this.settings.frequency) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      default: return 1;
    }
  }

  /**
   * 조용한 시간 체크
   */
  private isQuietTime(): boolean {
    if (!this.settings.quietHours) return false;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const { start, end } = this.settings.quietHours;

    // 단순 비교 (시간대 넘김 처리는 간소화)
    return currentTime >= start && currentTime <= end;
  }

  /**
   * 메시지 표시 처리
   */
  showMessage(messageId: string): void {
    const message = NUDGE_MESSAGES.find(m => m.id === messageId);
    if (!message) return;

    // 히스토리 기록
    const historyEntry: NudgeHistory = {
      messageId,
      shownAt: new Date()
    };

    this.nudgeHistory.push(historyEntry);
    this.saveHistory();

    // 활성 넛지에 추가
    const existingActive = this.activeNudges.find(a => a.message.id === messageId);
    if (existingActive) {
      existingActive.showCount++;
      existingActive.lastShownAt = new Date();
    } else {
      this.activeNudges.push({
        message,
        triggeredAt: new Date(),
        showCount: 1,
        lastShownAt: new Date()
      });
    }

    this.saveActiveNudges();
  }

  /**
   * 메시지 해제 처리
   */
  dismissMessage(messageId: string, actionTaken: boolean = false): void {
    // 히스토리 업데이트
    const recent = this.nudgeHistory
      .filter(h => h.messageId === messageId)
      .sort((a, b) => b.shownAt.getTime() - a.shownAt.getTime())[0];

    if (recent) {
      recent.dismissed = true;
      recent.actionTaken = actionTaken;
      this.saveHistory();
    }

    // 활성 넛지에서 제거 (일회성 메시지의 경우)
    const message = NUDGE_MESSAGES.find(m => m.id === messageId);
    if (message?.maxShowCount === 1) {
      this.activeNudges = this.activeNudges.filter(a => a.message.id !== messageId);
      this.saveActiveNudges();
    }
  }

  /**
   * 설정 관리
   */
  updateSettings(newSettings: Partial<NudgeSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  getSettings(): NudgeSettings {
    return { ...this.settings };
  }

  /**
   * 유틸리티 메서드들
   */
  private getMessageShowCount(messageId: string): number {
    return this.nudgeHistory.filter(h => h.messageId === messageId).length;
  }

  private getLastShownTime(messageId: string): Date | null {
    const entries = this.nudgeHistory
      .filter(h => h.messageId === messageId)
      .sort((a, b) => b.shownAt.getTime() - a.shownAt.getTime());

    return entries.length > 0 ? entries[0].shownAt : null;
  }

  private getProjectProgress(): number {
    // 임시 로직 - 실제로는 프로젝트 진행률 계산
    try {
      const projects = JSON.parse(localStorage.getItem('buildup-projects') || '[]');
      if (projects.length === 0) return 0;

      const activeProject = projects.find((p: any) => p.status === 'active');
      return activeProject?.progress || 0;
    } catch {
      return 0;
    }
  }

  /**
   * 데이터 저장/로드
   */
  private loadSettings(): NudgeSettings {
    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load nudge settings:', error);
    }

    // 기본 설정
    return {
      enabled: true,
      frequency: 'medium',
      quietHours: { start: '22:00', end: '08:00' },
      enabledTypes: ['encouragement', 'reminder', 'suggestion', 'milestone', 'habit']
    };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save nudge settings:', error);
    }
  }

  private loadActiveNudges(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.activeNudges = data.map((item: any) => ({
          ...item,
          triggeredAt: new Date(item.triggeredAt),
          lastShownAt: item.lastShownAt ? new Date(item.lastShownAt) : undefined
        }));
      }
    } catch (error) {
      console.error('Failed to load active nudges:', error);
    }
  }

  private saveActiveNudges(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.activeNudges));
    } catch (error) {
      console.error('Failed to save active nudges:', error);
    }
  }

  private loadHistory(): void {
    try {
      const stored = localStorage.getItem(this.HISTORY_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.nudgeHistory = data.map((item: any) => ({
          ...item,
          shownAt: new Date(item.shownAt)
        }));

        // 7일 이상된 히스토리 정리
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        this.nudgeHistory = this.nudgeHistory.filter(h => h.shownAt.getTime() > weekAgo);
      }
    } catch (error) {
      console.error('Failed to load nudge history:', error);
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(this.nudgeHistory));
    } catch (error) {
      console.error('Failed to save nudge history:', error);
    }
  }
}

// 싱글톤 인스턴스
export const gentleNudgeEngine = new GentleNudgeEngine();