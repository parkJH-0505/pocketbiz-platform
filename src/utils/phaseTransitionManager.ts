/**
 * @fileoverview Phase Transition Manager - 빌드업 프로세스 단계 전환 관리
 * @description Sprint 4 - Step 4.1: Phase Transition System
 * @author PocketCompany
 * @since 2025-01-24
 */

// 브라우저 호환 EventEmitter
class SimpleEventEmitter {
  private events: Map<string, Set<Function>> = new Map();

  on(event: string, handler: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);
  }

  off(event: string, handler: Function): void {
    if (this.events.has(event)) {
      this.events.get(event)!.delete(handler);
    }
  }

  emit(event: string, ...args: any[]): void {
    if (this.events.has(event)) {
      this.events.get(event)!.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}

/**
 * 빌드업 프로세스 단계 정의
 */
export enum BuildupPhase {
  // 초기 단계
  IDLE = 'idle',
  PREPARATION = 'preparation',

  // 미팅 전 단계
  PRE_MEETING = 'pre_meeting',
  PRE_MEETING_REVIEW = 'pre_meeting_review',

  // 가이드 단계
  GUIDE_1 = 'guide_1',
  GUIDE_1_REVIEW = 'guide_1_review',
  GUIDE_2 = 'guide_2',
  GUIDE_2_REVIEW = 'guide_2_review',
  GUIDE_3 = 'guide_3',
  GUIDE_3_REVIEW = 'guide_3_review',

  // 사후 관리 단계
  POST_MANAGEMENT = 'post_management',
  POST_REVIEW = 'post_review',

  // 완료 단계
  COMPLETION = 'completion',
  ARCHIVED = 'archived'
}

/**
 * 전환 모드
 */
export enum TransitionMode {
  AUTO = 'auto',           // 자동 전환
  MANUAL = 'manual',       // 수동 전환
  HYBRID = 'hybrid',       // 조건부 자동 + 수동 승인
  SCHEDULED = 'scheduled', // 예약된 시간에 전환
  CONDITIONAL = 'conditional' // 조건 충족 시 전환
}

/**
 * 전환 규칙
 */
export interface TransitionRule {
  from: BuildupPhase;
  to: BuildupPhase;
  condition?: () => boolean | Promise<boolean>;
  requiredDuration?: number; // milliseconds
  requiredCompletionRate?: number; // 0-100
  requiresApproval?: boolean;
  autoTransition?: boolean;
  validators?: Array<() => boolean | Promise<boolean>>;
  metadata?: Record<string, any>;
}

/**
 * 전환 이력
 */
export interface TransitionHistory {
  id: string;
  from: BuildupPhase;
  to: BuildupPhase;
  timestamp: Date;
  mode: TransitionMode;
  triggeredBy: 'system' | 'user' | 'schedule' | 'condition';
  duration: number; // milliseconds in previous phase
  metadata?: Record<string, any>;
}

/**
 * 단계 상태
 */
export interface PhaseState {
  current: BuildupPhase;
  previous?: BuildupPhase;
  startedAt: Date;
  completionRate: number;
  metadata: Record<string, any>;
  isTransitioning: boolean;
}

/**
 * 전환 옵션
 */
export interface TransitionOptions {
  mode?: TransitionMode;
  force?: boolean;
  skipValidation?: boolean;
  metadata?: Record<string, any>;
}

/**
 * 전환 이벤트
 */
export interface TransitionEvent {
  type: 'start' | 'complete' | 'error' | 'cancel';
  from: BuildupPhase;
  to: BuildupPhase;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Phase Transition Manager
 */
export class PhaseTransitionManager extends SimpleEventEmitter {
  private static instance: PhaseTransitionManager | null = null;

  // 현재 상태
  private state: PhaseState;

  // 전환 규칙
  private rules: Map<string, TransitionRule>;

  // 전환 이력
  private history: TransitionHistory[];

  // 전환 모드
  private mode: TransitionMode;

  // 전환 큐
  private transitionQueue: Array<{
    to: BuildupPhase;
    options: TransitionOptions;
    resolve: (result: boolean) => void;
    reject: (error: Error) => void;
  }> = [];

  // 전환 중 플래그
  private isTransitioning: boolean = false;

  // 자동 전환 타이머
  private autoTransitionTimer: NodeJS.Timeout | null = null;

  // 예약된 전환
  private scheduledTransitions: Map<string, {
    phase: BuildupPhase;
    scheduledTime: Date;
    timer: NodeJS.Timeout;
  }> = new Map();

  private constructor() {
    super();

    // 초기 상태 설정
    this.state = {
      current: BuildupPhase.IDLE,
      startedAt: new Date(),
      completionRate: 0,
      metadata: {},
      isTransitioning: false
    };

    this.rules = new Map();
    this.history = [];
    this.mode = TransitionMode.HYBRID;

    // 기본 규칙 초기화
    this.initializeDefaultRules();

  }

  /**
   * 싱글톤 인스턴스 가져오기
   */
  public static getInstance(): PhaseTransitionManager {
    if (!PhaseTransitionManager.instance) {
      PhaseTransitionManager.instance = new PhaseTransitionManager();
    }
    return PhaseTransitionManager.instance;
  }

  /**
   * 기본 전환 규칙 초기화
   */
  private initializeDefaultRules(): void {
    // IDLE -> PREPARATION
    this.addRule({
      from: BuildupPhase.IDLE,
      to: BuildupPhase.PREPARATION,
      autoTransition: false,
      requiresApproval: false
    });

    // PREPARATION -> PRE_MEETING
    this.addRule({
      from: BuildupPhase.PREPARATION,
      to: BuildupPhase.PRE_MEETING,
      requiredCompletionRate: 80,
      autoTransition: true,
      requiresApproval: false
    });

    // PRE_MEETING -> PRE_MEETING_REVIEW
    this.addRule({
      from: BuildupPhase.PRE_MEETING,
      to: BuildupPhase.PRE_MEETING_REVIEW,
      requiredDuration: 24 * 60 * 60 * 1000, // 24시간
      autoTransition: true,
      requiresApproval: true
    });

    // PRE_MEETING_REVIEW -> GUIDE_1
    this.addRule({
      from: BuildupPhase.PRE_MEETING_REVIEW,
      to: BuildupPhase.GUIDE_1,
      requiresApproval: true,
      validators: [
        async () => {
          // 리뷰 완료 여부 확인
          return this.state.metadata.reviewCompleted === true;
        }
      ]
    });

    // GUIDE 단계 간 전환 규칙
    const guidePhases = [
      { from: BuildupPhase.GUIDE_1, to: BuildupPhase.GUIDE_1_REVIEW },
      { from: BuildupPhase.GUIDE_1_REVIEW, to: BuildupPhase.GUIDE_2 },
      { from: BuildupPhase.GUIDE_2, to: BuildupPhase.GUIDE_2_REVIEW },
      { from: BuildupPhase.GUIDE_2_REVIEW, to: BuildupPhase.GUIDE_3 },
      { from: BuildupPhase.GUIDE_3, to: BuildupPhase.GUIDE_3_REVIEW }
    ];

    guidePhases.forEach(({ from, to }) => {
      this.addRule({
        from,
        to,
        requiredCompletionRate: 90,
        requiredDuration: 7 * 24 * 60 * 60 * 1000, // 7일
        autoTransition: from.includes('guide') && !from.includes('review'),
        requiresApproval: from.includes('review')
      });
    });

    // GUIDE_3_REVIEW -> POST_MANAGEMENT
    this.addRule({
      from: BuildupPhase.GUIDE_3_REVIEW,
      to: BuildupPhase.POST_MANAGEMENT,
      requiresApproval: true,
      validators: [
        async () => {
          // 모든 가이드 완료 확인
          const guidesCompleted = this.state.metadata.guide1Completed &&
                                 this.state.metadata.guide2Completed &&
                                 this.state.metadata.guide3Completed;
          return guidesCompleted === true;
        }
      ]
    });

    // POST_MANAGEMENT -> POST_REVIEW
    this.addRule({
      from: BuildupPhase.POST_MANAGEMENT,
      to: BuildupPhase.POST_REVIEW,
      requiredDuration: 30 * 24 * 60 * 60 * 1000, // 30일
      autoTransition: true
    });

    // POST_REVIEW -> COMPLETION
    this.addRule({
      from: BuildupPhase.POST_REVIEW,
      to: BuildupPhase.COMPLETION,
      requiresApproval: true
    });

    // COMPLETION -> ARCHIVED
    this.addRule({
      from: BuildupPhase.COMPLETION,
      to: BuildupPhase.ARCHIVED,
      requiredDuration: 90 * 24 * 60 * 60 * 1000, // 90일
      autoTransition: true
    });
  }

  /**
   * 전환 규칙 추가
   */
  public addRule(rule: TransitionRule): void {
    const key = `${rule.from}->${rule.to}`;
    this.rules.set(key, rule);
  }

  /**
   * 전환 규칙 제거
   */
  public removeRule(from: BuildupPhase, to: BuildupPhase): void {
    const key = `${from}->${to}`;
    this.rules.delete(key);
  }

  /**
   * 전환 규칙 가져오기
   */
  private getRule(from: BuildupPhase, to: BuildupPhase): TransitionRule | undefined {
    const key = `${from}->${to}`;
    return this.rules.get(key);
  }

  /**
   * 전환 가능 여부 확인
   */
  public async canTransition(to: BuildupPhase, options: TransitionOptions = {}): Promise<boolean> {
    const from = this.state.current;
    const rule = this.getRule(from, to);

    if (!rule) {
      console.warn(`❌ No transition rule from ${from} to ${to}`);
      return false;
    }

    // 강제 전환
    if (options.force) {
      return true;
    }

    // 검증 건너뛰기
    if (options.skipValidation) {
      return true;
    }

    // 완료율 확인
    if (rule.requiredCompletionRate !== undefined) {
      if (this.state.completionRate < rule.requiredCompletionRate) {
        console.warn(`❌ Completion rate too low: ${this.state.completionRate}% < ${rule.requiredCompletionRate}%`);
        return false;
      }
    }

    // 필요 시간 확인
    if (rule.requiredDuration !== undefined) {
      const elapsed = Date.now() - this.state.startedAt.getTime();
      if (elapsed < rule.requiredDuration) {
        console.warn(`❌ Not enough time in phase: ${elapsed}ms < ${rule.requiredDuration}ms`);
        return false;
      }
    }

    // 조건 확인
    if (rule.condition) {
      const conditionMet = await rule.condition();
      if (!conditionMet) {
        console.warn(`❌ Transition condition not met`);
        return false;
      }
    }

    // 검증자 확인
    if (rule.validators && rule.validators.length > 0) {
      for (const validator of rule.validators) {
        const isValid = await validator();
        if (!isValid) {
          console.warn(`❌ Transition validator failed`);
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 단계 전환
   */
  public async transition(to: BuildupPhase, options: TransitionOptions = {}): Promise<boolean> {
    // 전환 큐에 추가
    return new Promise((resolve, reject) => {
      this.transitionQueue.push({ to, options, resolve, reject });
      this.processTransitionQueue();
    });
  }

  /**
   * 전환 큐 처리
   */
  private async processTransitionQueue(): Promise<void> {
    if (this.isTransitioning || this.transitionQueue.length === 0) {
      return;
    }

    this.isTransitioning = true;
    const { to, options, resolve, reject } = this.transitionQueue.shift()!;

    try {
      const from = this.state.current;

      // 전환 가능 여부 확인
      const canTransition = await this.canTransition(to, options);
      if (!canTransition && !options.force) {
        throw new Error(`Cannot transition from ${from} to ${to}`);
      }

      // 전환 이벤트 발생
      this.emitTransitionEvent('start', from, to, options.metadata);

      // 이전 상태 저장
      this.state.previous = from;

      // 전환 실행
      const startTime = this.state.startedAt.getTime();
      const duration = Date.now() - startTime;

      // 이력 추가
      const history: TransitionHistory = {
        id: `transition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        from,
        to,
        timestamp: new Date(),
        mode: options.mode || this.mode,
        triggeredBy: options.mode === TransitionMode.SCHEDULED ? 'schedule' :
                    options.mode === TransitionMode.AUTO ? 'system' :
                    options.mode === TransitionMode.CONDITIONAL ? 'condition' : 'user',
        duration,
        metadata: options.metadata
      };

      this.history.push(history);

      // 상태 업데이트
      this.state = {
        current: to,
        previous: from,
        startedAt: new Date(),
        completionRate: 0,
        metadata: { ...this.state.metadata, ...options.metadata },
        isTransitioning: false
      };

      // 자동 전환 설정
      this.setupAutoTransition();

      // 전환 완료 이벤트
      this.emitTransitionEvent('complete', from, to, options.metadata);

      resolve(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Transition failed: ${errorMessage}`);

      // 전환 오류 이벤트
      this.emitTransitionEvent('error', this.state.current, to, { error: errorMessage });

      reject(error as Error);
    } finally {
      this.isTransitioning = false;

      // 다음 전환 처리
      if (this.transitionQueue.length > 0) {
        setTimeout(() => this.processTransitionQueue(), 100);
      }
    }
  }

  /**
   * 전환 이벤트 발생
   */
  private emitTransitionEvent(
    type: TransitionEvent['type'],
    from: BuildupPhase,
    to: BuildupPhase,
    metadata?: Record<string, any>
  ): void {
    const event: TransitionEvent = {
      type,
      from,
      to,
      timestamp: new Date(),
      metadata
    };

    this.emit('transition', event);
    this.emit(`transition:${type}`, event);
  }

  /**
   * 자동 전환 설정
   */
  private setupAutoTransition(): void {
    // 기존 타이머 정리
    if (this.autoTransitionTimer) {
      clearTimeout(this.autoTransitionTimer);
      this.autoTransitionTimer = null;
    }

    // 자동 전환 모드가 아니면 종료
    if (this.mode !== TransitionMode.AUTO && this.mode !== TransitionMode.HYBRID) {
      return;
    }

    // 현재 단계에서 자동 전환 가능한 다음 단계 찾기
    const possibleTransitions = Array.from(this.rules.values()).filter(
      rule => rule.from === this.state.current && rule.autoTransition
    );

    if (possibleTransitions.length === 0) {
      return;
    }

    // 첫 번째 자동 전환 규칙 사용
    const rule = possibleTransitions[0];

    if (rule.requiredDuration) {
      // 필요 시간 후 자동 전환
      this.autoTransitionTimer = setTimeout(async () => {
        if (this.state.current === rule.from) {
          try {
            await this.transition(rule.to, {
              mode: TransitionMode.AUTO,
              metadata: { autoTransition: true }
            });
          } catch (error) {
            console.error(`Auto transition failed: ${error}`);
          }
        }
      }, rule.requiredDuration);
    }
  }

  /**
   * 예약된 전환 추가
   */
  public scheduleTransition(
    phase: BuildupPhase,
    scheduledTime: Date,
    options: TransitionOptions = {}
  ): string {
    const id = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const delay = scheduledTime.getTime() - Date.now();

    if (delay <= 0) {
      throw new Error('Scheduled time must be in the future');
    }

    const timer = setTimeout(async () => {
      try {
        await this.transition(phase, {
          ...options,
          mode: TransitionMode.SCHEDULED,
          metadata: {
            ...options.metadata,
            scheduledId: id,
            scheduledTime
          }
        });
      } catch (error) {
        console.error(`Scheduled transition failed: ${error}`);
      } finally {
        this.scheduledTransitions.delete(id);
      }
    }, delay);

    this.scheduledTransitions.set(id, {
      phase,
      scheduledTime,
      timer
    });

    console.log(`⏰ Scheduled transition to ${phase} at ${scheduledTime}`);
    return id;
  }

  /**
   * 예약된 전환 취소
   */
  public cancelScheduledTransition(id: string): boolean {
    const scheduled = this.scheduledTransitions.get(id);
    if (scheduled) {
      clearTimeout(scheduled.timer);
      this.scheduledTransitions.delete(id);
      return true;
    }
    return false;
  }

  /**
   * 완료율 업데이트
   */
  public updateCompletionRate(rate: number): void {
    this.state.completionRate = Math.min(100, Math.max(0, rate));
    this.emit('completionUpdate', {
      phase: this.state.current,
      rate: this.state.completionRate
    });

    // 완료율 기반 자동 전환 체크
    if (this.mode === TransitionMode.AUTO || this.mode === TransitionMode.HYBRID) {
      this.checkCompletionBasedTransition();
    }
  }

  /**
   * 완료율 기반 전환 체크
   */
  private async checkCompletionBasedTransition(): Promise<void> {
    const possibleTransitions = Array.from(this.rules.values()).filter(
      rule => rule.from === this.state.current &&
              rule.autoTransition &&
              rule.requiredCompletionRate !== undefined &&
              this.state.completionRate >= rule.requiredCompletionRate
    );

    if (possibleTransitions.length > 0) {
      const rule = possibleTransitions[0];
      try {
        await this.transition(rule.to, {
          mode: TransitionMode.AUTO,
          metadata: { completionTriggered: true }
        });
      } catch (error) {
        console.error(`Completion-based transition failed: ${error}`);
      }
    }
  }

  /**
   * 메타데이터 업데이트
   */
  public updateMetadata(metadata: Record<string, any>): void {
    this.state.metadata = { ...this.state.metadata, ...metadata };
    this.emit('metadataUpdate', {
      phase: this.state.current,
      metadata: this.state.metadata
    });
  }

  /**
   * 전환 모드 설정
   */
  public setMode(mode: TransitionMode): void {
    this.mode = mode;

    // 모드 변경에 따른 자동 전환 재설정
    if (mode === TransitionMode.AUTO || mode === TransitionMode.HYBRID) {
      this.setupAutoTransition();
    } else {
      if (this.autoTransitionTimer) {
        clearTimeout(this.autoTransitionTimer);
        this.autoTransitionTimer = null;
      }
    }
  }

  /**
   * 현재 상태 가져오기
   */
  public getState(): PhaseState {
    return { ...this.state };
  }

  /**
   * 전환 이력 가져오기
   */
  public getHistory(limit?: number): TransitionHistory[] {
    if (limit) {
      return this.history.slice(-limit);
    }
    return [...this.history];
  }

  /**
   * 가능한 다음 단계 가져오기
   */
  public getPossibleTransitions(): BuildupPhase[] {
    const current = this.state.current;
    const possible: BuildupPhase[] = [];

    this.rules.forEach(rule => {
      if (rule.from === current) {
        possible.push(rule.to);
      }
    });

    return possible;
  }

  /**
   * 진행 상황 요약
   */
  public getSummary(): {
    currentPhase: BuildupPhase;
    previousPhase?: BuildupPhase;
    timeInPhase: number;
    completionRate: number;
    totalTransitions: number;
    mode: TransitionMode;
    possibleNextPhases: BuildupPhase[];
  } {
    return {
      currentPhase: this.state.current,
      previousPhase: this.state.previous,
      timeInPhase: Date.now() - this.state.startedAt.getTime(),
      completionRate: this.state.completionRate,
      totalTransitions: this.history.length,
      mode: this.mode,
      possibleNextPhases: this.getPossibleTransitions()
    };
  }

  /**
   * 초기화
   */
  public reset(): void {
    // 타이머 정리
    if (this.autoTransitionTimer) {
      clearTimeout(this.autoTransitionTimer);
      this.autoTransitionTimer = null;
    }

    // 예약된 전환 정리
    this.scheduledTransitions.forEach(scheduled => {
      clearTimeout(scheduled.timer);
    });
    this.scheduledTransitions.clear();

    // 상태 초기화
    this.state = {
      current: BuildupPhase.IDLE,
      startedAt: new Date(),
      completionRate: 0,
      metadata: {},
      isTransitioning: false
    };

    this.history = [];
    this.transitionQueue = [];
    this.isTransitioning = false;

  }
}

// 싱글톤 인스턴스 export
export const phaseTransitionManager = PhaseTransitionManager.getInstance();

// 개발 환경 디버깅용
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).__phaseTransitionManager__ = phaseTransitionManager;
}