// 사용자 프로필 및 클러스터 정보

export type Stage = 'A-1' | 'A-2' | 'A-3' | 'A-4' | 'A-5';
export type Sector = 'S-1' | 'S-2' | 'S-3' | 'S-4' | 'S-5';

// 핵심 5축 KPI 점수 (Core5 점수)
export interface Core5Scores {
  GO: number;  // Growth & Operations (성장성 및 운영)
  EC: number;  // Economic (수익성)
  PT: number;  // Product & Technology (제품 및 기술)
  PF: number;  // People & Finance (재무 및 인력)
  TO: number;  // Team & Organization (팀 및 조직)
}

// 빌더(PM) 정보
export interface AssignedBuilder {
  id: string;
  name: string;
  role: string;
  email: string;
  company: string;
  phone?: string;
  experience_years?: number;
  specialties?: string[];
  profile_image?: string;
  bio?: string;
}

// 사용자 기본 정보
export interface UserBasicInfo {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
  position?: string;
  joinedAt: Date;
  lastLoginAt?: Date;
  // 전담 빌더 정보
  assignedBuilder?: AssignedBuilder;
}

// 클러스터 정보
export interface UserCluster {
  stage: Stage;
  sector: Sector;
  stageLabel: string;
  sectorLabel: string;
  lastUpdated: Date;
  updatedBy: 'user' | 'admin' | 'system';
  confidence?: number; // 클러스터 분류 신뢰도 (0-100)
}

// KPI 진단 정보
export interface UserKPIDiagnosis {
  core5Scores: Core5Scores;  // Core5 점수 (레이더차트용)
  totalScore: number;
  lastDiagnosisDate: Date;
  completionRate: number; // 진단 완료율 (0-100)
  benchmarkPercentile?: number; // 동일 클러스터 내 백분위
}

// 매칭 기록
export interface UserMatchingHistory {
  totalRecommendations: number;
  clickedRecommendations: number;
  appliedPrograms: string[]; // 지원한 프로그램 ID들
  bookmarkedPrograms: string[]; // 북마크한 프로그램 ID들
  lastMatchingDate?: Date;
}

// 알림 설정
export interface UserNotificationSettings {
  email: {
    enabled: boolean;
    address?: string;
  };
  sms: {
    enabled: boolean;
    number?: string;
  };
  push: {
    enabled: boolean;
  };
  preferences: {
    newMatches: boolean;
    deadlineReminders: boolean;
    weeklyReport: boolean;
    marketingEmails: boolean;
  };
  categories: string[]; // 관심 있는 이벤트 카테고리들
  keywords: string[]; // 커스텀 키워드 알림
}

// 구독 정보
export interface UserSubscription {
  isActive: boolean;
  plan?: 'basic' | 'professional' | 'enterprise';
  startDate?: Date;
  endDate?: Date;
  consultationsRemaining?: number;
  monthlyConsultationLimit?: number;
}

// 통합 사용자 프로필
export interface UserProfile {
  basicInfo: UserBasicInfo;
  cluster: UserCluster;
  kpiDiagnosis?: UserKPIDiagnosis;
  matchingHistory: UserMatchingHistory;
  notificationSettings: UserNotificationSettings;
  subscription?: UserSubscription;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: 'ko' | 'en';
    timezone: string;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: string;
  };
}

// 클러스터 관련 유틸리티 타입
export interface ClusterInfo {
  key: string; // 예: "A4S1"
  stage: Stage;
  sector: Sector;
  stageLabel: string;
  sectorLabel: string;
  description: string;
  characteristics: string[];
  typicalMetrics: {
    revenue?: string;
    teamSize?: string;
    funding?: string;
  };
}

// 사용자 프로필 생성을 위한 기본값들
export const defaultUserProfile = (basicInfo: UserBasicInfo): UserProfile => ({
  basicInfo,
  cluster: {
    stage: 'A-2', // 기본값: 창업 직전·막 창업
    sector: 'S-1', // 기본값: IT·플랫폼/SaaS
    stageLabel: '창업 직전·막 창업',
    sectorLabel: 'IT·플랫폼/SaaS',
    lastUpdated: new Date(),
    updatedBy: 'system'
  },
  matchingHistory: {
    totalRecommendations: 0,
    clickedRecommendations: 0,
    appliedPrograms: [],
    bookmarkedPrograms: []
  },
  notificationSettings: {
    email: { enabled: false },
    sms: { enabled: false },
    push: { enabled: true },
    preferences: {
      newMatches: true,
      deadlineReminders: true,
      weeklyReport: false,
      marketingEmails: false
    },
    categories: [],
    keywords: []
  },
  preferences: {
    theme: 'system',
    language: 'ko',
    timezone: 'Asia/Seoul'
  },
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
    version: '1.0.0'
  }
});

// 클러스터 라벨 매핑
export const clusterLabels = {
  stages: {
    'A-1': '예비창업자',
    'A-2': '창업 직전·막 창업',
    'A-3': 'PMF 검증 완료',
    'A-4': 'Pre-A 단계',
    'A-5': 'Series A 이상'
  },
  sectors: {
    'S-1': 'IT·플랫폼/SaaS',
    'S-2': '제조·하드웨어·산업기술',
    'S-3': '브랜드·커머스(D2C)',
    'S-4': '바이오·헬스케어',
    'S-5': '크리에이티브·미디어·서비스'
  }
};

// 클러스터 특성 정보
export const clusterCharacteristics: Record<string, ClusterInfo> = {
  'A1S1': {
    key: 'A1S1',
    stage: 'A-1',
    sector: 'S-1',
    stageLabel: '예비창업자',
    sectorLabel: 'IT·플랫폼/SaaS',
    description: 'IT 분야 창업을 준비하는 예비창업자',
    characteristics: [
      '창업 아이템 구체화 단계',
      '기술 스택 학습 중',
      '팀 구성 준비',
      '시장 조사 진행'
    ],
    typicalMetrics: {
      revenue: '매출 없음',
      teamSize: '1-2명',
      funding: '자본금 준비'
    }
  },
  'A4S1': {
    key: 'A4S1',
    stage: 'A-4',
    sector: 'S-1',
    stageLabel: 'Pre-A 단계',
    sectorLabel: 'IT·플랫폼/SaaS',
    description: 'Series A 투자 준비 중인 IT/SaaS 기업',
    characteristics: [
      'PMF 검증 완료',
      '월 매출 2억원 이상',
      '조직 10명 이상',
      'Series A 투자 준비'
    ],
    typicalMetrics: {
      revenue: '월 2-10억원',
      teamSize: '10-30명',
      funding: 'Seed 투자 완료'
    }
  }
  // 필요한 다른 클러스터들도 추가 가능
};

// 클러스터 키 생성 유틸리티
export const getClusterKey = (stage: Stage, sector: Sector): string => {
  return `${stage.replace('-', '')}${sector.replace('-', '')}`;
};

// 클러스터 정보 조회 유틸리티
export const getClusterInfo = (stage: Stage, sector: Sector): ClusterInfo | null => {
  const key = getClusterKey(stage, sector);
  return clusterCharacteristics[key] || null;
};