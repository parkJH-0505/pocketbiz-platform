/**
 * EmotionalStateEngine
 *
 * 사용자의 감정 상태를 추론하고 관리하는 엔진
 * 모멘텀, 시간대, 활동 패턴 등을 종합적으로 분석
 */

import type {
  EmotionalState,
  EmotionalFactors,
  EmotionalTrend,
  MoodType
} from '../types/emotional.types';
import { EMOTIONAL_THRESHOLDS } from '../types/emotional.types';
import type { MomentumData } from './momentumEngine';

export class EmotionalStateEngine {
  private previousState: EmotionalState | null = null;

  /**
   * 현재 감정 상태 추론
   */
  async inferEmotionalState(
    momentum: MomentumData | null,
    additionalFactors?: Partial<EmotionalFactors>
  ): Promise<EmotionalState> {
    const factors = this.gatherFactors(momentum, additionalFactors);
    const mood = this.inferMood(factors, momentum);
    const energy = this.calculateEnergy(factors, momentum);
    const confidence = this.calculateConfidence(factors, momentum);
    const motivation = this.calculateMotivation(factors, momentum);
    const stress = this.calculateStress(factors);
    const insights = this.generateInsights(mood, { energy, confidence, motivation, stress }, factors);

    const state: EmotionalState = {
      mood,
      energy,
      confidence,
      motivation,
      stress,
      factors,
      timestamp: new Date(),
      insights
    };

    // 이전 상태 저장
    this.previousState = state;
    this.saveStateToStorage(state);

    return state;
  }

  /**
   * 감정 트렌드 분석
   */
  getEmotionalTrend(current: EmotionalState): EmotionalTrend {
    const previous = this.previousState || this.loadPreviousState();

    let direction: 'improving' | 'declining' | 'stable' = 'stable';
    if (previous) {
      const currentScore = (current.energy + current.confidence + current.motivation - current.stress) / 4;
      const previousScore = (previous.energy + previous.confidence + previous.motivation - previous.stress) / 4;

      if (currentScore > previousScore + 5) direction = 'improving';
      else if (currentScore < previousScore - 5) direction = 'declining';
    }

    const suggestions = this.generateSuggestions(current, direction);

    return {
      current,
      previous,
      direction,
      suggestions
    };
  }

  /**
   * 요소 수집
   */
  private gatherFactors(
    momentum: MomentumData | null,
    additionalFactors?: Partial<EmotionalFactors>
  ): EmotionalFactors {
    const hour = new Date().getHours();
    const timeOfDay =
      hour < 6 ? 'night' :
      hour < 12 ? 'morning' :
      hour < 18 ? 'afternoon' :
      hour < 21 ? 'evening' : 'night';

    const streakDays = parseInt(localStorage.getItem('login-streak') || '1');

    return {
      momentum: momentum?.score || 50,
      timeOfDay: timeOfDay as EmotionalFactors['timeOfDay'],
      recentActivity: additionalFactors?.recentActivity || '일반 작업 중',
      workload: this.inferWorkload(),
      streakDays,
      recentAchievement: additionalFactors?.recentAchievement
    };
  }

  /**
   * 무드 추론
   */
  private inferMood(factors: EmotionalFactors, momentum: MomentumData | null): MoodType {
    // 최근 성취가 있으면 excited
    if (factors.recentAchievement) {
      return 'excited';
    }

    // 모멘텀 기반 추론
    if (momentum) {
      if (momentum.score >= 80 && momentum.trend === 'up') {
        return 'confident';
      }
      if (momentum.score >= 60 && momentum.trend === 'up') {
        return 'motivated';
      }
      if (momentum.score >= 50 && momentum.trend === 'stable') {
        return 'focused';
      }
      if (momentum.score < 30) {
        return factors.workload === 'heavy' ? 'overwhelmed' : 'anxious';
      }
    }

    // 시간대 기반 기본 무드
    if (factors.timeOfDay === 'morning') {
      return factors.streakDays > 7 ? 'motivated' : 'calm';
    }
    if (factors.timeOfDay === 'night' && factors.workload === 'heavy') {
      return 'overwhelmed';
    }

    return 'calm';
  }

  /**
   * 에너지 레벨 계산
   */
  private calculateEnergy(factors: EmotionalFactors, momentum: MomentumData | null): number {
    let energy = 50;

    // 시간대별 기본 에너지
    const timeEnergy: Record<string, number> = {
      morning: 70,
      afternoon: 60,
      evening: 40,
      night: 30
    };
    energy = timeEnergy[factors.timeOfDay] || 50;

    // 모멘텀 보정
    if (momentum) {
      energy = (energy * 0.6) + (momentum.score * 0.4);
    }

    // 연속 접속 보너스
    if (factors.streakDays > 7) {
      energy += 10;
    }

    // 워크로드 페널티
    if (factors.workload === 'heavy') {
      energy -= 15;
    }

    return Math.max(0, Math.min(100, Math.round(energy)));
  }

  /**
   * 자신감 계산
   */
  private calculateConfidence(factors: EmotionalFactors, momentum: MomentumData | null): number {
    let confidence = 50;

    // 모멘텀 기반
    if (momentum) {
      confidence = momentum.score * 0.7;

      // 트렌드 보정
      if (momentum.trend === 'up') confidence += 15;
      else if (momentum.trend === 'down') confidence -= 10;
    }

    // 연속 접속 보너스
    confidence += Math.min(20, factors.streakDays * 2);

    // 최근 성취 보너스
    if (factors.recentAchievement) {
      confidence += 20;
    }

    return Math.max(0, Math.min(100, Math.round(confidence)));
  }

  /**
   * 동기 수준 계산
   */
  private calculateMotivation(factors: EmotionalFactors, momentum: MomentumData | null): number {
    let motivation = 60;

    // 모멘텀 기반
    if (momentum) {
      // 성장 속도가 중요
      if (momentum.trend === 'up') {
        motivation = 70 + momentum.velocity;
      } else if (momentum.trend === 'stable') {
        motivation = 50 + (momentum.score * 0.3);
      } else {
        motivation = 30 + (momentum.score * 0.2);
      }
    }

    // 아침 시간 보너스
    if (factors.timeOfDay === 'morning') {
      motivation += 10;
    }

    // 연속 접속 효과
    if (factors.streakDays > 3) {
      motivation += Math.min(15, factors.streakDays);
    }

    return Math.max(0, Math.min(100, Math.round(motivation)));
  }

  /**
   * 스트레스 레벨 계산
   */
  private calculateStress(factors: EmotionalFactors): number {
    let stress = 30;

    // 워크로드 기반
    const workloadStress: Record<string, number> = {
      light: 20,
      moderate: 40,
      heavy: 70
    };
    stress = workloadStress[factors.workload] || 40;

    // 시간대 영향
    if (factors.timeOfDay === 'night' && factors.workload !== 'light') {
      stress += 20;
    }

    // 낮은 모멘텀의 영향
    if (factors.momentum < 30) {
      stress += 15;
    }

    return Math.max(0, Math.min(100, Math.round(stress)));
  }

  /**
   * 워크로드 추론
   */
  private inferWorkload(): 'light' | 'moderate' | 'heavy' {
    // 실제로는 일정, 프로젝트 수 등을 분석해야 함
    // 임시로 랜덤 또는 시간 기반
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 18) {
      return Math.random() > 0.7 ? 'heavy' : 'moderate';
    }
    return 'light';
  }

  /**
   * 인사이트 생성
   */
  private generateInsights(
    mood: MoodType,
    metrics: { energy: number; confidence: number; motivation: number; stress: number },
    factors: EmotionalFactors
  ): string[] {
    const insights: string[] = [];

    // 무드별 기본 인사이트
    const moodInsights: Record<MoodType, string> = {
      confident: '지금의 기세를 유지하면 큰 성과를 얻을 수 있어요!',
      anxious: '한 번에 하나씩, 차근차근 해결해나가요.',
      focused: '집중력이 좋은 시간이에요. 중요한 일을 처리하세요.',
      excited: '이 에너지를 생산적으로 활용해보세요!',
      overwhelmed: '잠시 휴식을 취하고 우선순위를 다시 정해보세요.',
      calm: '안정적인 페이스를 유지하고 있어요.',
      motivated: '목표를 향해 순항 중이에요!'
    };
    insights.push(moodInsights[mood]);

    // 메트릭 기반 인사이트
    if (metrics.energy < EMOTIONAL_THRESHOLDS.energy.low) {
      insights.push('에너지가 낮아요. 짧은 휴식이나 스트레칭을 해보세요.');
    }
    if (metrics.confidence > EMOTIONAL_THRESHOLDS.confidence.high) {
      insights.push('자신감이 넘치네요! 도전적인 과제에 도전해보세요.');
    }
    if (metrics.stress > EMOTIONAL_THRESHOLDS.stress.high) {
      insights.push('스트레스 관리가 필요해요. 심호흡을 하거나 잠시 산책을 해보세요.');
    }

    // 시간대별 인사이트
    if (factors.timeOfDay === 'morning' && metrics.motivation > 70) {
      insights.push('아침의 높은 동기를 활용해 중요한 일을 먼저 처리하세요.');
    }
    if (factors.timeOfDay === 'night' && metrics.stress > 50) {
      insights.push('오늘 하루 수고 많으셨어요. 내일을 위해 충분히 쉬세요.');
    }

    return insights;
  }

  /**
   * 개선 제안 생성
   */
  private generateSuggestions(state: EmotionalState, trend: string): string[] {
    const suggestions: string[] = [];

    if (state.stress > EMOTIONAL_THRESHOLDS.stress.high) {
      suggestions.push('업무를 작은 단위로 나누어 하나씩 처리해보세요.');
      suggestions.push('5분 명상이나 깊은 호흡으로 마음을 진정시켜보세요.');
    }

    if (state.energy < EMOTIONAL_THRESHOLDS.energy.low) {
      suggestions.push('짧은 휴식을 취하거나 가벼운 간식을 드셔보세요.');
      suggestions.push('창문을 열어 신선한 공기를 마셔보세요.');
    }

    if (state.motivation < EMOTIONAL_THRESHOLDS.motivation.low) {
      suggestions.push('작은 성취부터 시작해 모멘텀을 만들어보세요.');
      suggestions.push('목표를 다시 한 번 상기시켜보세요.');
    }

    if (trend === 'declining') {
      suggestions.push('잠시 멈추고 현재 상황을 객관적으로 바라봐보세요.');
    }

    return suggestions;
  }

  /**
   * 상태 저장
   */
  private saveStateToStorage(state: EmotionalState): void {
    try {
      localStorage.setItem('emotional-state-current', JSON.stringify(state));

      // 히스토리 업데이트
      const historyStr = localStorage.getItem('emotional-state-history');
      const history = historyStr ? JSON.parse(historyStr) : [];
      history.push(state);

      // 최근 7일치만 보관
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const recentHistory = history.filter((s: EmotionalState) =>
        new Date(s.timestamp).getTime() > sevenDaysAgo
      );

      localStorage.setItem('emotional-state-history', JSON.stringify(recentHistory));
    } catch (error) {
      console.error('Failed to save emotional state:', error);
    }
  }

  /**
   * 이전 상태 로드
   */
  private loadPreviousState(): EmotionalState | null {
    try {
      const stateStr = localStorage.getItem('emotional-state-current');
      if (stateStr) {
        const state = JSON.parse(stateStr);
        state.timestamp = new Date(state.timestamp);
        return state;
      }
    } catch (error) {
      console.error('Failed to load previous emotional state:', error);
    }
    return null;
  }
}