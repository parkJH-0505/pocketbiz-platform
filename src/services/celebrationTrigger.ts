/**
 * CelebrationTrigger Service
 *
 * 다양한 성취와 이벤트에 대한 축하 트리거를 관리
 * - KPI 상승, 프로젝트 진행, 연속 접속 등 감지
 * - Confetti 효과, Toast 메시지, 사운드 등 통합 관리
 * - 사용자 피로도 관리 (과도한 축하 방지)
 */

import confetti from 'canvas-confetti';

export type CelebrationLevel = 'micro' | 'small' | 'medium' | 'large' | 'epic';
export type CelebrationReason =
  | 'kpi_increase'
  | 'project_milestone'
  | 'streak_achievement'
  | 'first_action'
  | 'momentum_high'
  | 'weekly_goal'
  | 'badge_earned'
  | 'level_up';

export interface CelebrationConfig {
  level: CelebrationLevel;
  reason: CelebrationReason;
  title: string;
  message: string;
  emoji?: string;
  confetti?: boolean;
  sound?: boolean;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface CelebrationHistory {
  timestamp: Date;
  reason: CelebrationReason;
  level: CelebrationLevel;
}

class CelebrationTriggerService {
  private static instance: CelebrationTriggerService;
  private history: CelebrationHistory[] = [];
  private lastCelebration: Date | null = null;
  private cooldownMs = 5000; // 5초 쿨다운
  private dailyCelebrationCount = 0;
  private maxDailyCelebrations = 20; // 하루 최대 20회

  private constructor() {
    this.loadHistory();
    this.resetDailyCountIfNeeded();
  }

  static getInstance(): CelebrationTriggerService {
    if (!CelebrationTriggerService.instance) {
      CelebrationTriggerService.instance = new CelebrationTriggerService();
    }
    return CelebrationTriggerService.instance;
  }

  /**
   * 축하 트리거
   */
  async trigger(config: CelebrationConfig): Promise<boolean> {
    // 쿨다운 체크
    if (!this.canCelebrate()) {
      console.log('Celebration cooldown active');
      return false;
    }

    // 일일 제한 체크
    if (this.dailyCelebrationCount >= this.maxDailyCelebrations) {
      console.log('Daily celebration limit reached');
      return false;
    }

    // 레벨별 처리
    await this.executeCelebration(config);

    // 히스토리 업데이트
    this.updateHistory(config);

    return true;
  }

  /**
   * 축하 실행
   */
  private async executeCelebration(config: CelebrationConfig): Promise<void> {
    const { level, confetti: showConfetti = true, sound = false } = config;

    // Confetti 효과
    if (showConfetti) {
      await this.triggerConfetti(level);
    }

    // 사운드 효과 (옵션)
    if (sound) {
      this.playSound(level);
    }

    // Toast 메시지는 별도 서비스에서 처리
    this.lastCelebration = new Date();
    this.dailyCelebrationCount++;
  }

  /**
   * Confetti 효과 트리거
   */
  private async triggerConfetti(level: CelebrationLevel): Promise<void> {
    const configs = {
      micro: {
        particleCount: 30,
        spread: 40,
        startVelocity: 20,
        ticks: 40,
        origin: { y: 0.7 }
      },
      small: {
        particleCount: 50,
        spread: 60,
        startVelocity: 30,
        ticks: 60,
        origin: { y: 0.7 }
      },
      medium: {
        particleCount: 100,
        spread: 70,
        startVelocity: 35,
        ticks: 100,
        origin: { y: 0.6 }
      },
      large: {
        particleCount: 150,
        spread: 100,
        startVelocity: 45,
        ticks: 150,
        origin: { y: 0.6 }
      },
      epic: {
        particleCount: 300,
        spread: 180,
        startVelocity: 60,
        ticks: 200,
        origin: { y: 0.5 }
      }
    };

    const config = configs[level];

    // 기본 confetti
    confetti(config);

    // 큰 축하는 여러 번 발사
    if (level === 'large' || level === 'epic') {
      setTimeout(() => {
        confetti({
          ...config,
          origin: { y: 0.7, x: 0.3 }
        });
      }, 150);

      setTimeout(() => {
        confetti({
          ...config,
          origin: { y: 0.7, x: 0.7 }
        });
      }, 300);
    }

    // Epic은 특별 효과
    if (level === 'epic') {
      // 황금 confetti
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 360,
          colors: ['#FFD700', '#FFA500', '#FFFF00'],
          ticks: 300,
          gravity: 0.5,
          origin: { y: 0.5 }
        });
      }, 500);
    }
  }

  /**
   * 사운드 재생 (옵션)
   */
  private playSound(level: CelebrationLevel): void {
    // 브라우저 오디오 API 사용
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // 레벨별 다른 톤
      const frequencies = {
        micro: [523, 659], // C5, E5
        small: [523, 659, 784], // C5, E5, G5
        medium: [523, 659, 784, 1047], // C5, E5, G5, C6
        large: [392, 523, 659, 784], // G4, C5, E5, G5
        epic: [261, 392, 523, 659, 784, 1047] // C4, G4, C5, E5, G5, C6
      };

      const tones = frequencies[level] || frequencies.micro;

      // 짧은 멜로디 재생
      tones.forEach((freq, index) => {
        setTimeout(() => {
          oscillator.frequency.value = freq;
          gainNode.gain.value = 0.1;

          if (index === 0) {
            oscillator.start();
          }
        }, index * 100);
      });

      setTimeout(() => {
        oscillator.stop();
      }, tones.length * 100);
    } catch (error) {
      console.log('Sound playback not available');
    }
  }

  /**
   * 축하 가능 여부 체크
   */
  private canCelebrate(): boolean {
    if (!this.lastCelebration) return true;

    const now = new Date();
    const timeSinceLastCelebration = now.getTime() - this.lastCelebration.getTime();

    return timeSinceLastCelebration >= this.cooldownMs;
  }

  /**
   * 히스토리 업데이트
   */
  private updateHistory(config: CelebrationConfig): void {
    const entry: CelebrationHistory = {
      timestamp: new Date(),
      reason: config.reason,
      level: config.level
    };

    this.history.push(entry);

    // 최근 100개만 유지
    if (this.history.length > 100) {
      this.history = this.history.slice(-100);
    }

    this.saveHistory();
  }

  /**
   * 히스토리 저장
   */
  private saveHistory(): void {
    try {
      localStorage.setItem('celebration-history', JSON.stringify(this.history));
      localStorage.setItem('celebration-daily-count', this.dailyCelebrationCount.toString());
      localStorage.setItem('celebration-last-date', new Date().toDateString());
    } catch (error) {
      console.error('Failed to save celebration history');
    }
  }

  /**
   * 히스토리 로드
   */
  private loadHistory(): void {
    try {
      const historyStr = localStorage.getItem('celebration-history');
      if (historyStr) {
        this.history = JSON.parse(historyStr);
      }

      const countStr = localStorage.getItem('celebration-daily-count');
      if (countStr) {
        this.dailyCelebrationCount = parseInt(countStr);
      }
    } catch (error) {
      console.error('Failed to load celebration history');
    }
  }

  /**
   * 일일 카운트 리셋
   */
  private resetDailyCountIfNeeded(): void {
    const lastDate = localStorage.getItem('celebration-last-date');
    const today = new Date().toDateString();

    if (lastDate !== today) {
      this.dailyCelebrationCount = 0;
      localStorage.setItem('celebration-last-date', today);
      localStorage.setItem('celebration-daily-count', '0');
    }
  }

  /**
   * 특정 이유의 최근 축하 확인
   */
  getLastCelebration(reason: CelebrationReason): CelebrationHistory | null {
    const filtered = this.history.filter(h => h.reason === reason);
    return filtered.length > 0 ? filtered[filtered.length - 1] : null;
  }

  /**
   * 오늘의 축하 횟수
   */
  getTodayCount(): number {
    return this.dailyCelebrationCount;
  }

  /**
   * 쿨다운 시간 설정
   */
  setCooldown(ms: number): void {
    this.cooldownMs = ms;
  }
}

// 싱글톤 인스턴스 export
export const celebrationTrigger = CelebrationTriggerService.getInstance();