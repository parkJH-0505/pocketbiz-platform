// Smart Matching 관련 타입 정의

export type MatchLevel = 'high' | 'medium' | 'low';
export type ProgramStatus = 'preparing' | 'active' | 'waiting' | 'completed';
export type ProgramCategory = 'government' | 'investment' | 'accelerator' | 'r&d' | 'global' | 'other';

// 알림 설정
export interface NotificationSettings {
  // 채널
  channels: {
    email: {
      enabled: boolean;
      address: string;
    };
    sms: {
      enabled: boolean;
      number: string;
    };
  };

  // 빠른 설정
  quickSettings: {
    newMatches: boolean;
    deadlineReminders: boolean;
    weeklyReport: boolean;
  };

  // 관심 분야
  categories: ProgramCategory[];

  // 커스텀 키워드
  keywords: string[];
}

// 로드맵 컨텍스트
export interface RoadmapContext {
  currentQuarter: string;
  quarterGoal: string;
  progress: number;
  currentStage: string;
}

// 프로그램 데이터
export interface Program {
  id: string;
  name: string;
  provider: string;
  category: ProgramCategory;

  // 일정
  announcementDate: Date;
  deadline: Date;
  selectionDate?: Date;

  // 요구사항
  requirements: {
    stage: string[];
    revenue?: {
      min?: number;
      max?: number;
    };
    teamSize?: {
      min?: number;
      max?: number;
    };
    sector?: string[];
    region?: string[];
    foundedWithin?: number;
    mustHave: string[];
    niceToHave: string[];
  };

  // 혜택
  benefits: {
    funding?: {
      min: number;
      max: number;
    };
    mentoring?: boolean;
    office?: boolean;
    networking?: boolean;
    others?: string[];
  };

  // 링크
  applicationUrl: string;
  documentUrl?: string;
}

// 매칭 결과
export interface MatchingResult {
  programId: string;
  matchLevel: MatchLevel;

  // 체크리스트
  checklist: {
    passed: string[];
    failed: string[];
    optional: string[];
  };

  // 준비 상태
  readiness: {
    isReady: boolean;
    missingItems: string[];
    prepDays: number;
  };

  // 우선순위
  priority: number;

  // 로드맵 기여도
  roadmapContribution?: {
    quarterGoal: string;
    expectedImpact: string;
    contributionScore: number;
  };
}

// 진행 상황 관리
export interface ProgramProgress {
  programId: string;
  programName: string;
  status: ProgramStatus;
  startDate: Date;
  deadline: Date;

  tasks: {
    total: number;
    completed: Task[];
    current: Task | null;
    upcoming: Task[];
  };

  progress: {
    percentage: number;
    lastUpdated: Date;
    estimatedCompletion: Date;
  };

  blockers?: {
    issue: string;
    suggestedSolution: string;
    expertNeeded?: string;
  }[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  completed: boolean;
  completedDate?: Date;
}

// 파이프라인
export interface QuarterPipeline {
  quarter: string;
  goal: string;
  conditions: string[];
  programs: Program[];
  preparationItems: string[];
}