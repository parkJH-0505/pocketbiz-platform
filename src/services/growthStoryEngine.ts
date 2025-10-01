/**
 * GrowthStoryEngine - 개인화된 성장 스토리 생성 엔진
 *
 * 사용자의 여정을 의미있는 스토리로 변환하여
 * 감정적 연결을 만들고 지속 동기를 부여합니다.
 */

export interface StoryChapter {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  milestones: Milestone[];
  emotion: 'struggle' | 'breakthrough' | 'growth' | 'celebration' | 'pivot';
  metrics?: {
    kpiStart: number;
    kpiEnd?: number;
    teamSize?: number;
    fundingAmount?: number;
  };
}

export interface Milestone {
  id: string;
  title: string;
  date: Date;
  type: 'achievement' | 'learning' | 'challenge' | 'decision';
  impact: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  emoji?: string;
}

export interface GrowthNarrative {
  currentChapter: StoryChapter;
  pastChapters: StoryChapter[];
  futureVision: FutureVision;
  personalizedMessage: string;
  motivationalQuote?: string;
  comparisons?: PeerComparison[];
}

export interface FutureVision {
  nextMilestone: Milestone;
  estimatedDate: Date;
  requiredActions: string[];
  expectedOutcome: string;
  confidenceLevel: number; // 0-100
}

export interface PeerComparison {
  company: string;
  stage: string;
  timeToReach: number; // days
  similarity: number; // 0-100
}

export class GrowthStoryEngine {
  private readonly CHAPTER_DURATION_DAYS = 90; // 분기별 챕터
  private chapters: Map<string, StoryChapter> = new Map();

  /**
   * 현재 성장 스토리 생성
   */
  generateCurrentStory(startupDays: number, kpiScore: number, projects: any[]): GrowthNarrative {
    const currentChapter = this.getCurrentChapter(startupDays, kpiScore, projects);
    const pastChapters = this.getPastChapters(startupDays);
    const futureVision = this.predictFuture(kpiScore, projects);
    const personalizedMessage = this.createPersonalizedMessage(startupDays, kpiScore, currentChapter);
    const comparisons = this.findSimilarJourneys(startupDays, kpiScore);

    return {
      currentChapter,
      pastChapters,
      futureVision,
      personalizedMessage,
      motivationalQuote: this.selectMotivationalQuote(currentChapter.emotion),
      comparisons
    };
  }

  /**
   * 현재 챕터 생성
   */
  private getCurrentChapter(startupDays: number, kpiScore: number, projects: any[]): StoryChapter {
    const chapterNumber = Math.floor(startupDays / this.CHAPTER_DURATION_DAYS) + 1;
    const emotion = this.determineEmotion(kpiScore, projects);

    return {
      id: `chapter-${chapterNumber}`,
      title: this.generateChapterTitle(chapterNumber, emotion),
      description: this.generateChapterDescription(startupDays, kpiScore, emotion),
      startDate: new Date(Date.now() - (startupDays % this.CHAPTER_DURATION_DAYS) * 24 * 60 * 60 * 1000),
      milestones: this.extractMilestones(projects, kpiScore),
      emotion,
      metrics: {
        kpiStart: Math.max(0, kpiScore - 15),
        kpiEnd: kpiScore,
        teamSize: projects.length,
      }
    };
  }

  /**
   * 챕터 감정 결정
   */
  private determineEmotion(kpiScore: number, projects: any[]): StoryChapter['emotion'] {
    if (kpiScore >= 80 && projects.length >= 3) return 'celebration';
    if (kpiScore >= 60 && projects.length >= 2) return 'growth';
    if (kpiScore >= 40) return 'breakthrough';
    if (projects.length === 0) return 'pivot';
    return 'struggle';
  }

  /**
   * 챕터 제목 생성
   */
  private generateChapterTitle(chapterNumber: number, emotion: StoryChapter['emotion']): string {
    const titles = {
      struggle: ['험난한 시작', '도전의 시기', '씨앗 심기'],
      breakthrough: ['첫 돌파구', '빛이 보이다', '전환점'],
      growth: ['성장 가속', '날개를 펴다', '궤도 진입'],
      celebration: ['성공의 맛', '수확의 계절', '정상을 향해'],
      pivot: ['새로운 시작', '방향 전환', '재도전']
    };

    const emotionTitles = titles[emotion];
    return `Chapter ${chapterNumber}: ${emotionTitles[chapterNumber % emotionTitles.length]}`;
  }

  /**
   * 챕터 설명 생성
   */
  private generateChapterDescription(days: number, score: number, emotion: StoryChapter['emotion']): string {
    const descriptions = {
      struggle: `창업 ${days}일, 아직 갈 길이 멀지만 포기하지 않고 있습니다.`,
      breakthrough: `창업 ${days}일, 드디어 의미있는 진전이 보이기 시작했습니다.`,
      growth: `창업 ${days}일, 빠른 속도로 성장하며 목표에 다가가고 있습니다.`,
      celebration: `창업 ${days}일, KPI ${score}점! 놀라운 성과를 만들어내고 있습니다.`,
      pivot: `창업 ${days}일, 새로운 방향을 모색하며 더 큰 기회를 찾고 있습니다.`
    };

    return descriptions[emotion];
  }

  /**
   * 마일스톤 추출
   */
  private extractMilestones(projects: any[], kpiScore: number): Milestone[] {
    const milestones: Milestone[] = [];

    // KPI 마일스톤
    if (kpiScore >= 70) {
      milestones.push({
        id: 'kpi-70',
        title: 'KPI 70점 돌파',
        date: new Date(),
        type: 'achievement',
        impact: 'high',
        emoji: '🎯'
      });
    }

    // 프로젝트 마일스톤
    projects.forEach((project, index) => {
      if (project.progress >= 50) {
        milestones.push({
          id: `project-${index}`,
          title: `${project.name} 50% 완료`,
          date: new Date(),
          type: 'achievement',
          impact: 'medium',
          emoji: '✅'
        });
      }
    });

    return milestones;
  }

  /**
   * 과거 챕터 생성
   */
  private getPastChapters(startupDays: number): StoryChapter[] {
    const chapters: StoryChapter[] = [];
    const totalChapters = Math.floor(startupDays / this.CHAPTER_DURATION_DAYS);

    for (let i = 0; i < totalChapters && i < 3; i++) {
      chapters.push({
        id: `past-chapter-${i + 1}`,
        title: `Chapter ${i + 1}: 과거의 도전`,
        description: `${(i + 1) * 90}일간의 여정`,
        startDate: new Date(Date.now() - (startupDays - i * 90) * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - (startupDays - (i + 1) * 90) * 24 * 60 * 60 * 1000),
        milestones: [],
        emotion: 'growth'
      });
    }

    return chapters;
  }

  /**
   * 미래 예측
   */
  private predictFuture(kpiScore: number, projects: any[]): FutureVision {
    const growthRate = kpiScore >= 70 ? 1.2 : kpiScore >= 50 ? 1.1 : 1.05;
    const daysToNextMilestone = Math.floor(30 / growthRate);

    return {
      nextMilestone: {
        id: 'next-milestone',
        title: kpiScore < 70 ? 'KPI 70점 달성' : kpiScore < 85 ? 'KPI 85점 달성' : '시리즈 A 준비',
        date: new Date(Date.now() + daysToNextMilestone * 24 * 60 * 60 * 1000),
        type: 'achievement',
        impact: 'critical',
        emoji: '🎯'
      },
      estimatedDate: new Date(Date.now() + daysToNextMilestone * 24 * 60 * 60 * 1000),
      requiredActions: [
        '매일 KPI 데이터 입력',
        '주간 목표 설정 및 추적',
        projects.length < 3 ? '새 프로젝트 시작' : '진행중 프로젝트 완료'
      ],
      expectedOutcome: '다음 단계 투자 유치 준비 완료',
      confidenceLevel: Math.min(95, 50 + kpiScore / 2)
    };
  }

  /**
   * 개인화 메시지 생성
   */
  private createPersonalizedMessage(days: number, score: number, chapter: StoryChapter): string {
    const messages = {
      struggle: [
        "모든 위대한 기업도 이런 시기를 거쳤습니다.",
        "지금의 도전이 미래의 자산이 될 거예요.",
        "한 걸음씩, 꾸준히가 답입니다."
      ],
      breakthrough: [
        "드디어 빛이 보이기 시작했네요!",
        "이 기세를 이어가세요!",
        "첫 성공의 맛, 앞으로가 더 기대됩니다."
      ],
      growth: [
        "놀라운 성장세입니다!",
        "당신의 비전이 현실이 되고 있어요.",
        "이 속도라면 목표 달성이 눈앞입니다."
      ],
      celebration: [
        "정말 대단합니다! 🎉",
        "당신이 만든 기적입니다!",
        "이제 더 큰 꿈을 꿀 시간이에요."
      ],
      pivot: [
        "새로운 시작도 용기입니다.",
        "방향 전환은 성장의 증거예요.",
        "더 나은 기회가 기다리고 있을 거예요."
      ]
    };

    const emotionMessages = messages[chapter.emotion];
    return emotionMessages[Math.floor(Math.random() * emotionMessages.length)];
  }

  /**
   * 동기부여 명언 선택
   */
  private selectMotivationalQuote(emotion: StoryChapter['emotion']): string {
    const quotes = {
      struggle: "The only way out is through. - Robert Frost",
      breakthrough: "Every accomplishment starts with the decision to try. - John F. Kennedy",
      growth: "Success is not final, failure is not fatal. - Winston Churchill",
      celebration: "The future belongs to those who believe in their dreams. - Eleanor Roosevelt",
      pivot: "It's not about ideas. It's about making ideas happen. - Scott Belsky"
    };

    return quotes[emotion];
  }

  /**
   * 유사한 성장 여정 찾기
   */
  private findSimilarJourneys(days: number, score: number): PeerComparison[] {
    // 실제로는 데이터베이스에서 조회
    const examples: PeerComparison[] = [
      {
        company: '쿠팡',
        stage: '초기 성장기',
        timeToReach: days - 30,
        similarity: 78
      },
      {
        company: '배달의민족',
        stage: 'PMF 검증',
        timeToReach: days + 60,
        similarity: 65
      }
    ];

    return examples.filter(e => e.similarity > 60);
  }
}

// 싱글톤 인스턴스
export const growthStoryEngine = new GrowthStoryEngine();