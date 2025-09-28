/**
 * MomentumEngine - 실시간 성장 모멘텀 계산 엔진
 *
 * 4-factor 가중 계산 시스템:
 * - 활동량 (40%): 로그인, KPI 입력, 일정 완료 등
 * - 성장 가속도 (30%): KPI 변화율, 프로젝트 진행률
 * - 일관성 (20%): 연속 접속, 목표 달성률
 * - 네트워크 효과 (10%): VC 관심도, 매칭 점수
 */

export interface MomentumFactors {
  activity: number;      // 0-100
  growth: number;        // 0-100
  consistency: number;   // 0-100
  network: number;       // 0-100
}

export interface MomentumData {
  score: number;         // 최종 모멘텀 점수 (0-100)
  trend: 'up' | 'down' | 'stable';
  velocity: number;      // 변화 속도
  factors: MomentumFactors;
  insights: string[];
  lastUpdated: Date;
}

export interface ActivityData {
  loginToday: boolean;
  kpiUpdatesCount: number;
  schedulesCompleted: number;
  documentsShared: number;
  matchingChecked: boolean;
}

export interface GrowthData {
  kpiDelta: number;           // 어제 대비 KPI 변화
  projectProgress: number;    // 프로젝트 진행률 증가
  completionRate: number;     // 완료율 개선
}

export interface ConsistencyData {
  loginStreak: number;        // 연속 접속일
  weeklyGoalsMet: number;     // 주간 목표 달성 개수
  avgResponseTime: number;    // 평균 대응 속도 (시간)
}

export interface NetworkData {
  vcInteractionScore: number; // VC 관심도 점수
  matchingScore: number;      // 매칭 적합도
  documentViews: number;      // 문서 조회수
}

export class MomentumEngine {
  private weights = {
    activity: 0.4,
    growth: 0.3,
    consistency: 0.2,
    network: 0.1
  };

  // 기본 모멘텀 계산 (임시 데이터 사용)
  async calculateBasicMomentum(): Promise<MomentumData> {
    // 임시 데이터로 기본 계산
    const mockFactors: MomentumFactors = {
      activity: this.generateMockActivity(),
      growth: this.generateMockGrowth(),
      consistency: this.generateMockConsistency(),
      network: this.generateMockNetwork()
    };

    const totalScore = this.calculateWeightedScore(mockFactors);
    const trend = this.determineTrend(totalScore);
    const velocity = this.calculateVelocity(totalScore);
    const insights = this.generateInsights(mockFactors, totalScore);

    return {
      score: Math.round(totalScore),
      trend,
      velocity,
      factors: mockFactors,
      insights,
      lastUpdated: new Date()
    };
  }

  // 가중 점수 계산
  private calculateWeightedScore(factors: MomentumFactors): number {
    return (
      factors.activity * this.weights.activity +
      factors.growth * this.weights.growth +
      factors.consistency * this.weights.consistency +
      factors.network * this.weights.network
    );
  }

  // 트렌드 결정
  private determineTrend(currentScore: number): 'up' | 'down' | 'stable' {
    const previousScore = this.getPreviousScore();
    const delta = currentScore - previousScore;

    if (delta > 5) return 'up';
    if (delta < -5) return 'down';
    return 'stable';
  }

  // 변화 속도 계산
  private calculateVelocity(currentScore: number): number {
    const previousScore = this.getPreviousScore();
    return Math.abs(currentScore - previousScore);
  }

  // 인사이트 생성
  private generateInsights(factors: MomentumFactors, totalScore: number): string[] {
    const insights: string[] = [];

    if (totalScore >= 80) {
      insights.push("현재 기세가 매우 좋습니다! 이 속도를 유지하세요.");
    } else if (totalScore >= 60) {
      insights.push("안정적으로 성장하고 있어요.");
    } else {
      insights.push("작은 것부터 차근차근 시작해보세요.");
    }

    // 가장 높은/낮은 요소 분석
    const factorEntries = Object.entries(factors);
    const highest = factorEntries.reduce((a, b) => a[1] > b[1] ? a : b);
    const lowest = factorEntries.reduce((a, b) => a[1] < b[1] ? a : b);

    if (highest[1] >= 80) {
      const factorName = this.getFactorDisplayName(highest[0]);
      insights.push(`${factorName} 부분이 특히 강점이네요!`);
    }

    if (lowest[1] <= 40) {
      const factorName = this.getFactorDisplayName(lowest[0]);
      insights.push(`${factorName} 부분에 조금 더 신경쓰시면 좋겠어요.`);
    }

    return insights;
  }

  // 요소별 표시 이름
  private getFactorDisplayName(factor: string): string {
    const names: Record<string, string> = {
      activity: '활동량',
      growth: '성장속도',
      consistency: '일관성',
      network: '네트워크'
    };
    return names[factor] || factor;
  }

  // 이전 점수 가져오기 (임시)
  private getPreviousScore(): number {
    const saved = localStorage.getItem('momentum-previous-score');
    return saved ? parseInt(saved) : 65;
  }

  // 점수 저장
  savePreviousScore(score: number): void {
    localStorage.setItem('momentum-previous-score', score.toString());
  }

  // 임시 데이터 생성 메서드들
  private generateMockActivity(): number {
    const hour = new Date().getHours();
    const isWorkingHour = hour >= 9 && hour <= 18;
    const baseScore = isWorkingHour ? 70 : 45;
    return Math.min(100, baseScore + Math.random() * 25);
  }

  private generateMockGrowth(): number {
    return 60 + Math.random() * 30;
  }

  private generateMockConsistency(): number {
    // 연속 접속일 시뮬레이션
    const streak = parseInt(localStorage.getItem('login-streak') || '1');
    return Math.min(100, 40 + streak * 8);
  }

  private generateMockNetwork(): number {
    return 50 + Math.random() * 40;
  }

  // 실제 데이터 연동 메서드들 (추후 구현)
  async calculateActivityScore(data: ActivityData): Promise<number> {
    let score = 0;

    if (data.loginToday) score += 20;
    score += Math.min(30, data.kpiUpdatesCount * 10);
    score += Math.min(25, data.schedulesCompleted * 5);
    score += Math.min(15, data.documentsShared * 3);
    if (data.matchingChecked) score += 10;

    return Math.min(100, score);
  }

  async calculateGrowthScore(data: GrowthData): Promise<number> {
    let score = 50; // 기본점수

    // KPI 변화율 (최대 40점)
    if (data.kpiDelta > 0) {
      score += Math.min(40, data.kpiDelta * 2);
    } else if (data.kpiDelta < 0) {
      score -= Math.min(20, Math.abs(data.kpiDelta));
    }

    // 프로젝트 진행률 (최대 30점)
    score += Math.min(30, data.projectProgress);

    // 완료율 개선 (최대 30점)
    score += Math.min(30, data.completionRate);

    return Math.max(0, Math.min(100, score));
  }

  async calculateConsistencyScore(data: ConsistencyData): Promise<number> {
    let score = 0;

    // 연속 접속일 (최대 50점)
    score += Math.min(50, data.loginStreak * 5);

    // 주간 목표 달성 (최대 30점)
    score += Math.min(30, data.weeklyGoalsMet * 6);

    // 빠른 대응 (최대 20점)
    if (data.avgResponseTime <= 2) score += 20;
    else if (data.avgResponseTime <= 4) score += 10;

    return Math.min(100, score);
  }

  async calculateNetworkScore(data: NetworkData): Promise<number> {
    let score = 0;

    // VC 관심도 (최대 40점)
    score += Math.min(40, data.vcInteractionScore);

    // 매칭 점수 (최대 30점)
    score += Math.min(30, data.matchingScore);

    // 문서 조회수 (최대 30점)
    score += Math.min(30, data.documentViews / 10);

    return Math.min(100, score);
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const momentumEngine = new MomentumEngine();