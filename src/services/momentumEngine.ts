/**
 * MomentumEngine v2.0 - 실용적 성장 모멘텀 계산 엔진
 *
 * 전문가적 접근법:
 * - 실제 측정 가능한 지표만 사용
 * - 사용자 행동 기반 점수 계산
 * - 점진적 개선 가능한 구조
 * - 명확한 피드백 제공
 */

import { momentumCache, CACHE_DEPENDENCIES, CACHE_KEYS } from './momentumCache';

// ============================================
// 🔵 Core Types & Interfaces
// ============================================

export interface RealMomentumData {
  score: number;                    // 최종 모멘텀 점수 (0-100)
  trend: 'rising' | 'falling' | 'stable';
  factors: {
    activity: number;               // 오늘 활동도 (0-100)
    growth: number;                 // 주간 성장률 (0-100)
    consistency: number;            // 꾸준함 점수 (0-100)
    performance: number;            // 성과 점수 (0-100)
  };
  insights: {
    message: string;
    type: 'positive' | 'neutral' | 'improvement';
    actionable: string;             // 실행 가능한 조언
  };
  lastCalculated: Date;
  historicalData: HistoricalPoint[];
}

export interface HistoricalPoint {
  date: Date;
  score: number;
  primaryFactor: keyof RealMomentumData['factors'];
}

// ============================================
// 🔵 Data Collection Interfaces
// ============================================

export interface ActivityMetrics {
  tasksCompletedToday: number;      // 오늘 완료한 작업 수
  loginTime: Date;                  // 오늘 첫 로그인 시간
  sessionDuration: number;          // 총 사용 시간 (분)
  kpiUpdates: number;               // KPI 업데이트 횟수
  documentsAccessed: number;        // 문서 접근 횟수
}

export interface GrowthMetrics {
  weeklyGoalProgress: number;       // 주간 목표 진행률 (%)
  kpiImprovement: number;           // KPI 개선도 (%)
  projectMilestones: number;        // 완료한 마일스톤 수
  skillDevelopment: number;         // 학습 활동 점수
}

export interface ConsistencyMetrics {
  loginStreak: number;              // 연속 접속일
  weeklyActivedays: number;         // 주간 활동일 수
  goalAchievementRate: number;      // 목표 달성률 (%)
  habitScore: number;               // 습관 점수
}

export interface PerformanceMetrics {
  kpiScore: number;                 // 실제 KPI 점수
  qualityScore: number;             // 작업 품질 점수
  efficiencyScore: number;          // 효율성 점수
  outcomeImpact: number;            // 결과 임팩트
}

// ============================================
// 🔵 Configuration & Weights
// ============================================

export interface MomentumCalculationConfig {
  weights: {
    activity: number;               // 25% - 즉각적 행동
    growth: number;                 // 35% - 발전 정도
    consistency: number;            // 25% - 지속성
    performance: number;            // 15% - 실제 성과
  };

  thresholds: {
    excellent: number;              // 80+
    good: number;                   // 60+
    average: number;                // 40+
    needsImprovement: number;       // 20+
  };

  storage: {
    maxHistoryDays: number;         // 최대 기록 보관일
    cacheExpirationMs: number;      // 캐시 만료 시간
  };
}

interface MomentumConfig extends MomentumCalculationConfig {
  weights: {
    activity: number;               // 25% - 즉각적 행동
    growth: number;                 // 35% - 발전 정도
    consistency: number;            // 25% - 지속성
    performance: number;            // 15% - 실제 성과
  };

  thresholds: {
    excellent: number;              // 80+
    good: number;                   // 60+
    average: number;                // 40+
    needsImprovement: number;       // 20+
  };

  storage: {
    maxHistoryDays: number;         // 최대 기록 보관일
    cacheExpirationMs: number;      // 캐시 만료 시간
  };
}

// ============================================
// 🔵 Main MomentumEngine Class
// ============================================

export class MomentumEngine {
  private readonly config: MomentumConfig = {
    weights: {
      activity: 0.25,
      growth: 0.35,
      consistency: 0.25,
      performance: 0.15
    },
    thresholds: {
      excellent: 80,
      good: 60,
      average: 40,
      needsImprovement: 20
    },
    storage: {
      maxHistoryDays: 30,
      cacheExpirationMs: 5 * 60 * 1000  // 5분
    }
  };

  private readonly STORAGE_KEY = 'momentum-engine-v2';
  private cachedData: RealMomentumData | null = null;
  private lastCacheTime: number = 0;

  // ============================================
  // 🔵 Public API Methods
  // ============================================

  /**
   * 메인 모멘텀 계산 메서드
   */
  async calculateMomentum(): Promise<RealMomentumData> {
    // 캐시 확인
    if (this.isCacheValid()) {
      return this.cachedData!;
    }

    try {
      // 1. 실제 데이터 수집
      const activityMetrics = await this.collectActivityMetrics();
      const growthMetrics = await this.collectGrowthMetrics();
      const consistencyMetrics = await this.collectConsistencyMetrics();
      const performanceMetrics = await this.collectPerformanceMetrics();

      // 2. 각 팩터 점수 계산
      const factors = {
        activity: this.calculateActivityScore(activityMetrics),
        growth: this.calculateGrowthScore(growthMetrics),
        consistency: this.calculateConsistencyScore(consistencyMetrics),
        performance: this.calculatePerformanceScore(performanceMetrics)
      };

      // 3. 가중 평균으로 최종 점수 계산
      const score = this.calculateWeightedScore(factors);

      // 4. 트렌드 분석
      const trend = await this.analyzeTrend(score);

      // 5. 인사이트 생성
      const insights = this.generateInsights(factors, score);

      // 6. 히스토리 업데이트
      const historicalData = await this.updateHistory(score, this.getDominantFactor(factors));

      const result: RealMomentumData = {
        score: Math.round(score),
        trend,
        factors,
        insights,
        lastCalculated: new Date(),
        historicalData
      };

      // 캐시 저장
      this.updateCache(result);

      return result;

    } catch (error) {
      console.error('Momentum calculation failed:', error);
      return this.getFallbackMomentum();
    }
  }

  /**
   * 빠른 모멘텀 조회 (캐시 우선)
   */
  async getQuickMomentum(): Promise<RealMomentumData> {
    if (this.cachedData) {
      return this.cachedData;
    }
    return this.calculateMomentum();
  }

  /**
   * 특정 팩터만 업데이트
   */
  async updateSpecificFactor(
    factorType: keyof RealMomentumData['factors'],
    newValue: number
  ): Promise<RealMomentumData> {
    const current = await this.getQuickMomentum();
    current.factors[factorType] = newValue;

    // 재계산
    const newScore = this.calculateWeightedScore(current.factors);
    current.score = Math.round(newScore);
    current.lastCalculated = new Date();

    this.updateCache(current);
    return current;
  }

  // ============================================
  // 🔵 Data Collection Methods
  // ============================================

  private async collectActivityMetrics(): Promise<ActivityMetrics> {
    // 실제 사용자 활동 데이터 수집
    const today = new Date().toDateString();
    const storedActivity = localStorage.getItem(`activity-${today}`);

    if (storedActivity) {
      return JSON.parse(storedActivity);
    }

    // 기본값 또는 실제 측정값
    const metrics: ActivityMetrics = {
      tasksCompletedToday: this.getTasksCompletedToday(),
      loginTime: new Date(),
      sessionDuration: this.getSessionDuration(),
      kpiUpdates: this.getKpiUpdates(),
      documentsAccessed: this.getDocumentsAccessed()
    };

    // 저장
    localStorage.setItem(`activity-${today}`, JSON.stringify(metrics));
    return metrics;
  }

  private async collectGrowthMetrics(): Promise<GrowthMetrics> {
    return {
      weeklyGoalProgress: this.getWeeklyGoalProgress(),
      kpiImprovement: this.getKpiImprovement(),
      projectMilestones: this.getProjectMilestones(),
      skillDevelopment: this.getDocumentLearningScore() // 문서 접근을 학습 활동으로 대체
    };
  }

  private async collectConsistencyMetrics(): Promise<ConsistencyMetrics> {
    return {
      loginStreak: this.getLoginStreak(),
      weeklyActivedays: this.getWeeklyActiveDays(),
      goalAchievementRate: this.getGoalAchievementRate(),
      habitScore: this.getHabitScore()
    };
  }

  private async collectPerformanceMetrics(): Promise<PerformanceMetrics> {
    return {
      kpiScore: this.getKpiScore(),
      qualityScore: this.getActivityQualityScore(), // 실제 활동 기반 품질 점수
      efficiencyScore: this.getSessionEfficiencyScore(), // 세션 기반 효율성 점수
      outcomeImpact: this.getGoalCompletionRate() // 목표 달성률을 임팩트로 대체
    };
  }

  // ============================================
  // 🔵 Score Calculation Methods
  // ============================================

  private calculateActivityScore(metrics: ActivityMetrics): number {
    // 활동도 점수 계산 (0-100)
    let score = 0;

    // 작업 완료 (40점)
    score += Math.min(metrics.tasksCompletedToday * 8, 40);

    // 세션 시간 (30점) - 30분 이상이면 만점
    score += Math.min(metrics.sessionDuration / 30 * 30, 30);

    // KPI 업데이트 (20점)
    score += Math.min(metrics.kpiUpdates * 10, 20);

    // 문서 접근 (10점)
    score += Math.min(metrics.documentsAccessed * 2, 10);

    return Math.min(score, 100);
  }

  private calculateGrowthScore(metrics: GrowthMetrics): number {
    // 성장 점수 계산 (0-100)
    let score = 0;

    // 주간 목표 진행률 (40점)
    score += metrics.weeklyGoalProgress * 0.4;

    // KPI 개선도 (30점)
    score += Math.min(metrics.kpiImprovement * 3, 30);

    // 프로젝트 마일스톤 (20점)
    score += Math.min(metrics.projectMilestones * 10, 20);

    // 스킬 개발 (10점)
    score += Math.min(metrics.skillDevelopment, 10);

    return Math.min(score, 100);
  }

  private calculateConsistencyScore(metrics: ConsistencyMetrics): number {
    // 일관성 점수 계산 (0-100)
    let score = 0;

    // 연속 접속일 (40점) - 7일 이상이면 만점
    score += Math.min(metrics.loginStreak / 7 * 40, 40);

    // 주간 활동일 (30점) - 5일 이상이면 만점
    score += Math.min(metrics.weeklyActivedays / 5 * 30, 30);

    // 목표 달성률 (20점)
    score += metrics.goalAchievementRate * 0.2;

    // 습관 점수 (10점)
    score += Math.min(metrics.habitScore, 10);

    return Math.min(score, 100);
  }

  private calculatePerformanceScore(metrics: PerformanceMetrics): number {
    // 성과 점수 계산 (0-100)
    let score = 0;

    // 실제 KPI 점수 (50점)
    score += metrics.kpiScore * 0.5;

    // 품질 점수 (25점)
    score += metrics.qualityScore * 0.25;

    // 효율성 점수 (15점)
    score += metrics.efficiencyScore * 0.15;

    // 결과 임팩트 (10점)
    score += metrics.outcomeImpact * 0.1;

    return Math.min(score, 100);
  }

  private calculateWeightedScore(factors: RealMomentumData['factors']): number {
    return (
      factors.activity * this.config.weights.activity +
      factors.growth * this.config.weights.growth +
      factors.consistency * this.config.weights.consistency +
      factors.performance * this.config.weights.performance
    );
  }

  // ============================================
  // 🔵 Analysis & Insights Methods
  // ============================================

  private async analyzeTrend(currentScore: number): Promise<RealMomentumData['trend']> {
    const history = await this.getStoredHistory();

    if (history.length < 2) {
      return 'stable';
    }

    const recentScores = history.slice(-3).map(h => h.score);
    const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

    const diff = currentScore - avgRecent;

    if (diff > 5) return 'rising';
    if (diff < -5) return 'falling';
    return 'stable';
  }

  private generateInsights(
    factors: RealMomentumData['factors'],
    score: number
  ): RealMomentumData['insights'] {

    // 가장 낮은 팩터 찾기
    const lowestFactor = Object.entries(factors).reduce((a, b) =>
      factors[a[0] as keyof typeof factors] < factors[b[0] as keyof typeof factors] ? a : b
    );

    // 점수별 메시지
    let message: string;
    let type: 'positive' | 'neutral' | 'improvement';
    let actionable: string;

    if (score >= this.config.thresholds.excellent) {
      message = "🚀 탁월한 모멘텀! 지금 속도를 유지하세요.";
      type = 'positive';
      actionable = "현재 패턴을 계속 유지하고, 새로운 도전을 추가해보세요.";
    } else if (score >= this.config.thresholds.good) {
      message = "✨ 좋은 흐름이에요! 조금만 더 힘내세요.";
      type = 'positive';
      actionable = `${this.getFactorAdvice(lowestFactor[0] as keyof typeof factors)}에 집중해보세요.`;
    } else if (score >= this.config.thresholds.average) {
      message = "⚡ 안정적인 상태입니다. 성장 기회를 찾아보세요.";
      type = 'neutral';
      actionable = `${this.getFactorAdvice(lowestFactor[0] as keyof typeof factors)}을 개선하면 큰 도약이 가능합니다.`;
    } else {
      message = "💪 새로운 시작! 작은 것부터 차근차근 해보세요.";
      type = 'improvement';
      actionable = "오늘 할 수 있는 작은 작업 하나부터 완료해보세요.";
    }

    return { message, type, actionable };
  }

  private getFactorAdvice(factor: keyof RealMomentumData['factors']): string {
    const advice = {
      activity: "더 많은 작업을 완료하거나 플랫폼 사용 시간을 늘리기",
      growth: "주간 목표 설정과 달성에 집중하기",
      consistency: "매일 꾸준히 접속하는 습관 만들기",
      performance: "KPI 개선과 작업 품질 향상"
    };

    return advice[factor];
  }

  private getDominantFactor(factors: RealMomentumData['factors']): keyof RealMomentumData['factors'] {
    return Object.entries(factors).reduce((a, b) =>
      factors[a[0] as keyof typeof factors] > factors[b[0] as keyof typeof factors] ? a : b
    )[0] as keyof RealMomentumData['factors'];
  }

  // ============================================
  // 🔵 Data Persistence & Caching
  // ============================================

  private isCacheValid(): boolean {
    return this.cachedData !== null &&
           (Date.now() - this.lastCacheTime) < this.config.storage.cacheExpirationMs;
  }

  private updateCache(data: RealMomentumData): void {
    this.cachedData = data;
    this.lastCacheTime = Date.now();
  }

  private async updateHistory(score: number, primaryFactor: keyof RealMomentumData['factors']): Promise<HistoricalPoint[]> {
    const history = await this.getStoredHistory();

    const newPoint: HistoricalPoint = {
      date: new Date(),
      score,
      primaryFactor
    };

    history.push(newPoint);

    // 최대 보관일 수 제한
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.storage.maxHistoryDays);

    const filteredHistory = history.filter(point => point.date > cutoffDate);

    // 저장
    localStorage.setItem(`${this.STORAGE_KEY}-history`, JSON.stringify(filteredHistory));

    return filteredHistory;
  }

  private async getStoredHistory(): Promise<HistoricalPoint[]> {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_KEY}-history`);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Date 객체 복원
        return parsed.map((point: any) => ({
          ...point,
          date: new Date(point.date)
        }));
      }
    } catch (error) {
      console.error('Failed to load momentum history:', error);
    }
    return [];
  }

  // ============================================
  // 🔵 Real Data Collection Helpers
  // ============================================

  private getTasksCompletedToday(): number {
    // 실제 구현시: API 호출 또는 localStorage에서 오늘 완료한 작업 수 가져오기
    const today = new Date().toDateString();
    const stored = localStorage.getItem(`tasks-completed-${today}`);
    return stored ? parseInt(stored) : 0;
  }

  private getSessionDuration(): number {
    // 실제 구현시: 세션 시작 시간부터 현재까지의 시간 계산
    const sessionStart = localStorage.getItem('session-start-time');
    if (sessionStart) {
      return Math.floor((Date.now() - parseInt(sessionStart)) / (1000 * 60)); // 분 단위
    }
    return 0;
  }

  private getLoginStreak(): number {
    // 연속 접속일 계산
    const lastLogin = localStorage.getItem('last-login-date');
    const today = new Date().toDateString();

    if (!lastLogin) {
      localStorage.setItem('last-login-date', today);
      localStorage.setItem('login-streak', '1');
      return 1;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastLogin === today) {
      // 오늘 이미 접속함
      return parseInt(localStorage.getItem('login-streak') || '1');
    } else if (lastLogin === yesterday.toDateString()) {
      // 연속 접속
      const newStreak = parseInt(localStorage.getItem('login-streak') || '1') + 1;
      localStorage.setItem('login-streak', newStreak.toString());
      localStorage.setItem('last-login-date', today);
      return newStreak;
    } else {
      // 연속 끊김
      localStorage.setItem('login-streak', '1');
      localStorage.setItem('last-login-date', today);
      return 1;
    }
  }

  private getWeeklyGoalProgress(): number {
    // 주간 목표 진행률 - 실제 구현시 목표 시스템과 연동
    const stored = localStorage.getItem('weekly-goal-progress');
    return stored ? parseFloat(stored) : 0;
  }

  private getKpiScore(): number {
    // 실제 KPI 점수 - KPI 시스템과 연동
    const stored = localStorage.getItem('kpi-average-score');
    return stored ? parseFloat(stored) : 50; // 기본값 50
  }

  // 나머지 헬퍼 메서드들 (기본값 반환)
  private getKpiUpdates(): number {
    return parseInt(localStorage.getItem('kpi-updates-today') || '0');
  }

  private getDocumentsAccessed(): number {
    return parseInt(localStorage.getItem('documents-accessed-today') || '0');
  }

  private getKpiImprovement(): number {
    // KPI 개선도 계산
    const current = this.getKpiScore();
    const previous = parseFloat(localStorage.getItem('kpi-previous-score') || current.toString());
    return Math.max(0, current - previous);
  }

  private getProjectMilestones(): number {
    return parseInt(localStorage.getItem('milestones-completed-today') || '0');
  }

  private getDocumentLearningScore(): number {
    // 문서 접근을 학습 활동으로 간주
    const docAccess = parseInt(localStorage.getItem('documents-accessed-today') || '0');
    return Math.min(docAccess * 5, 50); // 문서 1개당 5점, 최대 50점
  }

  private getWeeklyActiveDays(): number {
    // 이번 주 활동일 수 계산
    const thisWeek = this.getThisWeekDates();
    let activeDays = 0;

    thisWeek.forEach(date => {
      if (localStorage.getItem(`activity-${date.toDateString()}`)) {
        activeDays++;
      }
    });

    return activeDays;
  }

  private getGoalAchievementRate(): number {
    const achieved = parseInt(localStorage.getItem('goals-achieved') || '0');
    const total = parseInt(localStorage.getItem('goals-total') || '1');
    return (achieved / total) * 100;
  }

  private getHabitScore(): number {
    // 습관 점수 - 로그인 패턴, 사용 시간 패턴 등 기반
    const streak = this.getLoginStreak();
    return Math.min(streak * 2, 10);
  }

  private getActivityQualityScore(): number {
    // 실제 활동 기반 품질 점수
    const kpiUpdates = parseInt(localStorage.getItem('kpi-updates-today') || '0');
    const docAccess = parseInt(localStorage.getItem('documents-accessed-today') || '0');
    const today = new Date().toDateString();
    const tasksCompleted = parseInt(localStorage.getItem(`tasks-completed-${today}`) || '0');

    // 다양한 활동을 했을수록 높은 품질
    const activityTypes = [kpiUpdates > 0, docAccess > 0, tasksCompleted > 0].filter(Boolean).length;
    return 50 + (activityTypes * 15); // 기본 50점 + 활동 유형별 15점
  }

  private getSessionEfficiencyScore(): number {
    // 세션 기간 대비 활동량으로 효율성 측정
    const sessionStart = localStorage.getItem('session-start-time');
    if (!sessionStart) return 50;

    const sessionMinutes = Math.floor((Date.now() - parseInt(sessionStart)) / (1000 * 60));
    const kpiUpdates = parseInt(localStorage.getItem('kpi-updates-today') || '0');
    const docAccess = parseInt(localStorage.getItem('documents-accessed-today') || '0');
    const totalActivity = kpiUpdates + docAccess;

    if (sessionMinutes === 0) return 50;

    // 분당 활동량을 효율성으로 계산
    const efficiency = (totalActivity / Math.max(sessionMinutes, 1)) * 100;
    return Math.min(Math.max(efficiency, 20), 100); // 20-100점 범위
  }

  private getGoalCompletionRate(): number {
    // 실제 목표 달성률을 임팩트로 측정
    const weeklyGoals = localStorage.getItem('weekly-goals');
    if (!weeklyGoals) return 30; // 목표 없으면 기본 30점

    try {
      const goals = JSON.parse(weeklyGoals);
      if (goals.length === 0) return 30;

      let completedGoals = 0;
      goals.forEach((goal: any) => {
        if (goal.current >= goal.target) {
          completedGoals++;
        }
      });

      return (completedGoals / goals.length) * 100;
    } catch (error) {
      return 30;
    }
  }

  // ============================================
  // 🔵 Utility Methods
  // ============================================

  private getThisWeekDates(): Date[] {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + 1);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      week.push(date);
    }
    return week;
  }

  private getFallbackMomentum(): RealMomentumData {
    return {
      score: 50,
      trend: 'stable',
      factors: {
        activity: 50,
        growth: 50,
        consistency: 50,
        performance: 50
      },
      insights: {
        message: "⚡ 기본 상태입니다. 활동을 시작해보세요!",
        type: 'neutral',
        actionable: "오늘 할 수 있는 작업 하나를 선택해서 완료해보세요."
      },
      lastCalculated: new Date(),
      historicalData: []
    };
  }

  // ============================================
  // 🔵 Public Helper Methods
  // ============================================

  /**
   * 작업 완료시 호출
   */
  async recordTaskCompletion(): Promise<void> {
    const today = new Date().toDateString();
    const current = this.getTasksCompletedToday();
    localStorage.setItem(`tasks-completed-${today}`, (current + 1).toString());

    // 캐시 무효화
    this.cachedData = null;
  }

  /**
   * KPI 업데이트시 호출
   */
  async recordKpiUpdate(newScore: number): Promise<void> {
    const previous = this.getKpiScore();
    localStorage.setItem('kpi-previous-score', previous.toString());
    localStorage.setItem('kpi-average-score', newScore.toString());

    const today = new Date().toDateString();
    const current = this.getKpiUpdates();
    localStorage.setItem('kpi-updates-today', (current + 1).toString());

    // 캐시 무효화
    this.cachedData = null;
  }

  /**
   * 세션 시작시 호출
   */
  startSession(): void {
    if (!localStorage.getItem('session-start-time')) {
      localStorage.setItem('session-start-time', Date.now().toString());
    }
  }

  /**
   * 이전 점수 가져오기
   */
  private getPreviousScore(): number {
    const previous = localStorage.getItem('previous-business-score');
    return previous ? parseFloat(previous) : 50;
  }

  /**
   * 이전 속도 가져오기
   */
  private getPreviousVelocity(): number {
    const previous = localStorage.getItem('previous-business-velocity');
    return previous ? parseFloat(previous) : 0;
  }

  /**
   * 현재 점수 저장
   */
  private savePreviousScore(score: number): void {
    localStorage.setItem('previous-business-score', score.toString());
  }

  /**
   * 현재 속도 저장
   */
  private savePreviousVelocity(velocity: number): void {
    localStorage.setItem('previous-business-velocity', velocity.toString());
  }

  /**
   * 예측 생성
   */
  private generatePredictions(currentScore: number, velocity: number, acceleration: number): {
    nextWeek: number;
    nextMonth: number;
    confidence: number;
  } {
    // 단순한 선형 예측
    const weekPrediction = Math.min(100, Math.max(0, currentScore + velocity * 1.5));
    const monthPrediction = Math.min(100, Math.max(0, currentScore + velocity * 4 + acceleration * 2));

    // 신뢰도는 데이터 일관성 기반
    const dataConsistency = this.getWeeklyActiveDays() / 7;
    const confidence = Math.min(0.95, Math.max(0.5, 0.3 + dataConsistency * 0.65));

    return {
      nextWeek: Math.round(weekPrediction),
      nextMonth: Math.round(monthPrediction),
      confidence
    };
  }

  /**
   * 꾸준함 점수 계산 (단순하고 정확)
   */
  private calculateConsistencySimple(): number {
    const loginStreak = this.getLoginStreak();
    const weeklyActiveDays = this.getWeeklyActiveDays();

    // 연속 접속일 점수 (최대 50점)
    const streakScore = Math.min(loginStreak * 7, 50);

    // 주간 활동일 점수 (최대 50점)
    const weeklyScore = (weeklyActiveDays / 7) * 50;

    return Math.round((streakScore + weeklyScore) / 2);
  }

  /**
   * 활동량 점수 계산 (실제 측정 가능한 것만)
   */
  private calculateActivitySimple(): number {
    const sessionDuration = this.getSessionDuration(); // 분 단위
    const todayTasks = this.getTasksCompletedToday();
    const kpiUpdates = this.getKpiUpdates();

    // 세션 시간 점수 (30분 = 30점, 최대 60점)
    const timeScore = Math.min(sessionDuration, 60);

    // 작업 완료 점수 (작업 1개 = 15점, 최대 30점)
    const taskScore = Math.min(todayTasks * 15, 30);

    // KPI 업데이트 점수 (1회 = 10점)
    const kpiScore = Math.min(kpiUpdates * 10, 10);

    return Math.round((timeScore + taskScore + kpiScore) / 3);
  }

  /**
   * 성과 점수 계산 (실제 결과만)
   */
  private calculatePerformanceSimple(): number {
    const currentKpi = this.getKpiScore();
    const kpiImprovement = this.getKpiImprovement();

    // KPI 점수 자체 (50-100 범위를 0-70점으로)
    const kpiScore = Math.max(0, (currentKpi - 50) * 1.4);

    // KPI 개선도 (개선도 1점 = 10점, 최대 30점)
    const improvementScore = Math.min(Math.max(0, kpiImprovement) * 10, 30);

    return Math.round((kpiScore + improvementScore) / 2);
  }

  /**
   * 비즈니스 인사이트 생성 (실용적)
   */
  private generateBusinessInsights(score: number, breakdown: { consistency: number; activity: number; performance: number }) {
    let message: string;
    let suggestion: string;
    let urgentAction: string | undefined;

    // 가장 낮은 영역 찾기
    const lowest = Object.entries(breakdown).reduce((a, b) =>
      breakdown[a[0] as keyof typeof breakdown] < breakdown[b[0] as keyof typeof breakdown] ? a : b
    );

    if (score >= 80) {
      message = "🟢 건강한 상태입니다";
      suggestion = "현재 패턴을 유지하세요. 새로운 도전을 고려해볼 시점입니다.";
    } else if (score >= 60) {
      message = "🟡 안정적이지만 개선 여지가 있습니다";
      suggestion = `${this.getSimpleAdvice(lowest[0] as keyof typeof breakdown)}에 집중하면 더 큰 성과를 낼 수 있습니다.`;
    } else if (score >= 40) {
      message = "🟠 주의가 필요한 상태입니다";
      suggestion = `${this.getSimpleAdvice(lowest[0] as keyof typeof breakdown)}을 우선적으로 개선해보세요.`;
      urgentAction = "오늘 할 수 있는 작은 일부터 시작하세요.";
    } else {
      message = "🔴 즉시 개선이 필요합니다";
      suggestion = "기본적인 활동부터 다시 시작해보세요.";
      urgentAction = "지금 당장 시스템에 들어와서 하나의 작업을 완료하세요.";
    }

    return { message, suggestion, urgentAction };
  }

  /**
   * 영역별 간단한 조언
   */
  private getSimpleAdvice(area: 'consistency' | 'activity' | 'performance'): string {
    const advice = {
      consistency: "매일 꾸준히 시스템 사용하기",
      activity: "오늘 계획한 작업들 완료하기",
      performance: "KPI 점수 개선에 집중하기"
    };
    return advice[area];
  }

  /**
   * 기본 설정 반환
   */
  getDefaultConfig(): MomentumCalculationConfig {
    return {
      weights: {
        activity: 0.25,
        growth: 0.35,
        consistency: 0.25,
        performance: 0.15
      },
      thresholds: {
        excellent: 80,
        good: 60,
        average: 40,
        needsImprovement: 20
      },
      storage: {
        maxHistoryDays: 30,
        cacheExpirationMs: 5 * 60 * 1000  // 5분
      }
    };
  }

  /**
   * 개발/테스트용 데이터 리셋
   */
  resetAllData(): void {
    const keysToKeep = ['auth-token', 'user-preferences']; // 보존할 키들

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('momentum-') ||
          key.startsWith('activity-') ||
          key.startsWith('tasks-') ||
          key.startsWith('kpi-') ||
          key.startsWith('login-') ||
          key.startsWith('session-') ||
          !keysToKeep.some(keepKey => key.includes(keepKey))) {
        localStorage.removeItem(key);
      }
    });

    this.cachedData = null;
  }
}

// ============================================
// 🔵 Singleton Export
// ============================================

export const momentumEngine = new MomentumEngine();

// 세션 시작 시 자동 호출
momentumEngine.startSession();