# Iteration 17: 통합 사용자 정보 구조 설계

> 최종 업데이트: 2025-01-17
> 기존 구조 통합 및 확장 설계

## 목표
기존의 `user.ts`와 `userProfile.ts`를 통합하여 **일관성 있고 확장 가능한 사용자 정보 구조** 구축

## 현재 상황 분석

### 기존 구조 현황
```typescript
// 현재 2개의 별도 구조
1. src/types/user.ts         → 관리자 관점 (시스템 사용자)
2. src/types/userProfile.ts  → 플랫폼 사용자 (스타트업 대표/팀원)
```

### 문제점
- 사용자 정보가 2개 파일에 분산
- 일부 중복되는 속성들
- 확장 시 어느 쪽에 추가할지 애매함
- 관리자-사용자 간 데이터 연동 복잡성

## 통합 설계 방향

### 설계 철학
1. **단일 진실 원천** (Single Source of Truth)
2. **역할 기반 데이터 접근** (Role-based Data Access)
3. **점진적 정보 수집** (Progressive Information Collection)
4. **확장성 고려** (Future-proof Architecture)

### 계층 구조
```
📱 PocketBiz User Management System
├── 🏠 Core Identity (핵심 신원)
│   └── 모든 사용자 공통 필수 정보
├── 🏢 Business Profile (비즈니스 프로필)
│   └── 스타트업/기업 관련 정보
├── 📊 Platform Activity (플랫폼 활동)
│   └── KPI, 매칭, 빌드업 등 사용 기록
├── ⚙️ System Metadata (시스템 메타데이터)
│   └── 권한, 로그, 상태 등 관리 정보
└── 🎛️ Preferences (개인화 설정)
    └── 알림, 테마, 언어 등 사용자 설정
```

## 통합 데이터 모델

### 1. Core Identity (핵심 신원)
```typescript
interface UserCoreIdentity {
  // 기본 신원
  id: string;
  email: string;
  name: string;

  // 연락처
  phone?: string;
  secondaryEmail?: string;

  // 계정 정보
  username?: string;
  profileImage?: string;

  // 시간 정보
  createdAt: Date;
  lastLoginAt?: Date;
  emailVerifiedAt?: Date;

  // 상태
  isActive: boolean;
  isEmailVerified: boolean;

  // 소셜 로그인 (확장성)
  socialLogins?: {
    google?: string;
    naver?: string;
    kakao?: string;
  };
}
```

### 2. Business Profile (비즈니스 프로필)
```typescript
interface UserBusinessProfile {
  // 개인 역할
  personalRole: {
    position: string;        // "대표", "CTO", "개발팀장" 등
    isFounder: boolean;
    experienceYears?: number;
    previousCompanies?: string[];
  };

  // 회사 기본 정보
  company: {
    name: string;
    registrationNumber?: string;  // 사업자 등록번호
    foundedYear?: number;
    website?: string;
    description?: string;
    logoUrl?: string;

    // 규모 정보
    employeeCount: "1-5명" | "6-20명" | "21-50명" | "51-200명" | "200명+";

    // 주소 정보
    address: {
      country: "KR" | "US" | "JP" | "CN" | "SG";
      city: string;
      district?: string;
      fullAddress?: string;
      isRemote?: boolean;
    };
  };

  // 비즈니스 모델
  business: {
    industry: string;
    sector: "S-1" | "S-2" | "S-3" | "S-4" | "S-5";
    sectorLabel: string;

    businessModel: "B2B" | "B2C" | "B2B2C" | "Marketplace" | "SaaS" | "기타";
    targetMarket: string;

    // 매출 정보
    revenueRange?: "pre-revenue" | "1억 미만" | "1-10억" | "10-100억" | "100억+";
    monthlyRevenue?: number;    // 정확한 월매출 (관리자만)
    isPublicRevenue: boolean;   // 매출 공개 여부
  };

  // 자금 조달
  funding: {
    currentStage: "pre-seed" | "seed" | "series-a" | "series-b+" | "exit" | "기타";
    totalFunded?: number;       // 누적 투자금액
    lastFundingDate?: Date;
    investors?: string[];       // 투자자 목록
    isSeekingFunding: boolean;  // 현재 투자 유치 중
    fundingGoal?: number;       // 목표 투자금액
  };

  // 제품/서비스
  product: {
    name?: string;
    category: string;
    developmentStage: "아이디어" | "MVP" | "베타" | "출시" | "성장" | "성숙";

    // 기술 스택 (IT/SaaS 전용)
    techStack?: string[];

    // 경쟁사
    competitors?: string[];

    // IP/특허
    intellectualProperty?: {
      patents?: number;
      trademarks?: number;
      copyrights?: number;
    };
  };

  // 팀 구성
  team: {
    totalMembers: number;
    coreTeam: {
      founders: number;
      cLevel: number;
      employees: number;
    };

    // 역할별 구성
    departments: {
      development?: number;
      design?: number;
      marketing?: number;
      sales?: number;
      operations?: number;
      finance?: number;
      hr?: number;
      others?: number;
    };

    // 채용 계획
    hiringPlan?: {
      positions: string[];
      timeframe: "즉시" | "3개월" | "6개월" | "1년";
      budget?: number;
    };
  };

  // 메타 정보
  lastUpdated: Date;
  completeness: number;        // 프로필 완성도 (0-100%)
  isPublic: boolean;           // 프로필 공개 여부
}
```

### 3. Platform Activity (플랫폼 활동)
```typescript
interface UserPlatformActivity {
  // 클러스터링
  cluster: {
    stage: "A-1" | "A-2" | "A-3" | "A-4" | "A-5";
    sector: "S-1" | "S-2" | "S-3" | "S-4" | "S-5";
    stageLabel: string;
    sectorLabel: string;
    confidence: number;         // 분류 신뢰도 (0-100)
    lastUpdated: Date;
    updatedBy: "user" | "admin" | "system" | "ai";
  };

  // KPI 진단 히스토리
  kpiHistory: {
    assessmentId: string;
    completedAt: Date;
    version: string;            // KPI 라이브러리 버전

    // Core5 점수
    scores: {
      GO: number;  // Growth & Operations
      EC: number;  // Economic
      PT: number;  // Product & Technology
      PF: number;  // People & Finance
      TO: number;  // Team & Organization
    };

    totalScore: number;
    completionRate: number;     // 항목 완료율

    // 벤치마크 비교
    benchmarks: {
      clusterAverage: number;
      percentileRank: number;   // 동일 클러스터 내 백분위
      industryAverage?: number;
    };

    // 개선 추천
    recommendations: {
      priority: "high" | "medium" | "low";
      axis: "GO" | "EC" | "PT" | "PF" | "TO";
      title: string;
      description: string;
      expectedImpact: number;   // 예상 점수 개선
      estimatedCost?: number;
      timeframe: string;
    }[];
  }[];

  // 현재 KPI 상태 (최신)
  currentKPI: {
    overallScore: number;
    lastAssessmentDate: Date;
    strongestAxis: string;
    weakestAxis: string;
    improvementRate: number;    // 전월 대비 개선률
    nextAssessmentDue?: Date;
  };

  // 스마트 매칭 활동
  matching: {
    // 추천 이력
    totalRecommendations: number;
    viewedRecommendations: number;
    clickedRecommendations: number;

    // 관심 프로그램
    bookmarkedPrograms: {
      programId: string;
      bookmarkedAt: Date;
      matchRate: number;
      notes?: string;
    }[];

    // 지원 이력
    applications: {
      programId: string;
      appliedAt: Date;
      status: "pending" | "accepted" | "rejected" | "withdrawn";
      matchRate: number;
      documents?: string[];      // 제출 서류 목록
    }[];

    // 선호도 학습
    preferences: {
      preferredSupportTypes: string[];
      preferredAmountRanges: string[];
      avoidedCategories?: string[];
      keywords: string[];
    };

    // 통계
    stats: {
      averageMatchRate: number;
      successfulApplications: number;
      conversionRate: number;   // 추천 → 지원 전환율
      lastActivityAt: Date;
    };
  };

  // 빌드업 서비스 활동
  buildup: {
    // 구매 이력
    purchases: {
      orderId: string;
      serviceIds: string[];
      totalAmount: number;
      purchasedAt: Date;
      status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
      paymentMethod?: string;
    }[];

    // 진행 중인 프로젝트
    activeProjects: {
      projectId: string;
      serviceName: string;
      startDate: Date;
      expectedEndDate: Date;
      progress: number;          // 0-100%
      assignedPM: string;        // PM ID
      currentPhase: string;
      nextMilestone?: Date;
    }[];

    // 완료된 프로젝트
    completedProjects: {
      projectId: string;
      serviceName: string;
      completedAt: Date;
      satisfaction: number;      // 1-5 점
      feedback?: string;
      results: {
        deliverables: string[];
        kpiImprovement?: {
          axis: string;
          beforeScore: number;
          afterScore: number;
        }[];
      };
    }[];

    // 통계
    stats: {
      totalSpent: number;
      projectsCompleted: number;
      averageSatisfaction: number;
      favoriteServiceCategories: string[];
      repeatPurchaseRate: number;
    };
  };

  // 플랫폼 사용 패턴
  usage: {
    // 접속 패턴
    sessionStats: {
      totalSessions: number;
      averageSessionDuration: number;  // 분 단위
      preferredTimeSlots: string[];    // "morning", "afternoon", "evening"
      preferredDays: string[];         // "monday", "tuesday", ...
      deviceTypes: Record<string, number>; // desktop, mobile, tablet 사용 빈도
    };

    // 기능 사용률
    featureUsage: {
      dashboard: number;
      kpiDiagnosis: number;
      smartMatching: number;
      buildupServices: number;
      lastUsedFeatures: string[];
    };

    // 참여도
    engagement: {
      loginFrequency: "daily" | "weekly" | "monthly" | "occasional";
      activeStreak: number;        // 연속 활성일
      longestStreak: number;
      churnRisk: "low" | "medium" | "high";
    };
  };
}
```

### 4. System Metadata (시스템 메타데이터)
```typescript
interface UserSystemMetadata {
  // 권한 및 역할
  authorization: {
    role: "super_admin" | "admin" | "manager" | "user" | "viewer";
    permissions: {
      resource: string;
      actions: ("create" | "read" | "update" | "delete")[];
    }[];

    // 조직 권한 (B2B 고객사용)
    organizationRole?: {
      organizationId: string;
      role: "admin" | "member";
      permissions: string[];
    };

    // 특별 권한
    specialAccess?: {
      betaFeatures: boolean;
      advancedAnalytics: boolean;
      apiAccess: boolean;
    };
  };

  // 계정 상태
  accountStatus: {
    status: "active" | "inactive" | "suspended" | "pending_verification" | "deleted";
    statusReason?: string;
    statusChangedAt?: Date;
    statusChangedBy?: string;

    // 제재 정보
    restrictions?: {
      type: "feature_limit" | "access_restriction" | "content_filter";
      reason: string;
      appliedAt: Date;
      expiresAt?: Date;
      appliedBy: string;
    }[];
  };

  // 구독 정보
  subscription: {
    plan: "free" | "basic" | "professional" | "enterprise" | "custom";
    status: "active" | "cancelled" | "past_due" | "unpaid";

    // 결제 정보
    billing: {
      startDate: Date;
      renewalDate?: Date;
      cancelledAt?: Date;
      amount: number;
      currency: "KRW" | "USD";
      paymentMethod?: "card" | "bank_transfer" | "invoice";
    };

    // 사용량 제한
    limits: {
      kpiAssessments: number;    // 월간 진단 횟수
      consultations: number;     // 월간 상담 횟수
      projectSlots: number;      // 동시 진행 프로젝트 수
    };

    // 사용량 현황
    usage: {
      kpiAssessmentsUsed: number;
      consultationsUsed: number;
      activeProjects: number;
    };
  };

  // 담당 관리
  assignment: {
    // 전담 빌더
    assignedBuilder?: {
      builderId: string;
      name: string;
      role: string;
      email: string;
      phone?: string;
      assignedAt: Date;
      assignedBy: string;
    };

    // 계정 매니저 (엔터프라이즈 고객)
    accountManager?: {
      managerId: string;
      name: string;
      email: string;
      assignedAt: Date;
    };
  };

  // 활동 로그 (최근 50개만 유지)
  activityLogs: {
    id: string;
    timestamp: Date;
    action: string;
    resource: string;
    resourceId?: string;
    details: string;

    // 기술적 정보
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;

    // 결과
    status: "success" | "failure" | "warning";
    errorMessage?: string;
  }[];

  // 보안 정보
  security: {
    passwordChangedAt?: Date;
    mustChangePassword: boolean;
    failedLoginAttempts: number;
    lastFailedLoginAt?: Date;

    // 세션 관리
    activeSessions: {
      sessionId: string;
      device: string;
      ipAddress: string;
      lastActivity: Date;
      isCurrentSession: boolean;
    }[];

    // 2FA 설정
    twoFactorEnabled: boolean;
    twoFactorMethod?: "sms" | "email" | "app";
  };

  // 데이터 관리
  dataManagement: {
    dataRetention: {
      personalDataRetentionDays: number;
      activityLogRetentionDays: number;
      deletionScheduledAt?: Date;
    };

    privacy: {
      cookieConsent: boolean;
      marketingConsent: boolean;
      analyticsConsent: boolean;
      consentDate: Date;
    };

    exports: {
      exportId: string;
      requestedAt: Date;
      completedAt?: Date;
      downloadUrl?: string;
      expiresAt?: Date;
    }[];
  };

  // 메타 정보
  metadata: {
    createdBy: string;
    updatedAt: Date;
    updatedBy: string;
    version: string;

    // 마이그레이션 정보
    migratedFrom?: string;
    migrationDate?: Date;

    // 태그 (관리용)
    tags: string[];
    notes?: string;           // 관리자 메모
  };
}
```

### 5. User Preferences (개인화 설정)
```typescript
interface UserPreferences {
  // 알림 설정
  notifications: {
    // 채널별 설정
    channels: {
      email: {
        enabled: boolean;
        address?: string;      // 기본 이메일과 다를 경우
        frequency: "immediate" | "daily" | "weekly";
      };
      sms: {
        enabled: boolean;
        number?: string;
        internationalFormat: boolean;
      };
      push: {
        enabled: boolean;
        deviceTokens: string[];
      };
      inApp: {
        enabled: boolean;
        showBadges: boolean;
      };
    };

    // 콘텐츠별 설정
    content: {
      newMatches: boolean;
      matchingDeadlines: boolean;
      kpiReminders: boolean;
      projectUpdates: boolean;
      systemAnnouncements: boolean;
      marketingEmails: boolean;
      weeklyReports: boolean;
      monthlyInsights: boolean;
    };

    // 시간 설정
    quietHours: {
      enabled: boolean;
      startTime: string;      // "22:00"
      endTime: string;        // "08:00"
      timezone: string;
    };
  };

  // UI/UX 설정
  interface: {
    theme: "light" | "dark" | "system";
    language: "ko" | "en" | "ja";
    currency: "KRW" | "USD" | "JPY";
    dateFormat: "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY";
    numberFormat: "1,234" | "1.234" | "1 234";

    // 대시보드 설정
    dashboard: {
      defaultTab: string;
      widgetOrder: string[];
      hiddenWidgets: string[];
      autoRefresh: boolean;
      refreshInterval: number;  // 초 단위
    };

    // 테이블/리스트 설정
    dataDisplay: {
      itemsPerPage: number;
      defaultSortOrder: "asc" | "desc";
      compactMode: boolean;
    };
  };

  // 콘텐츠 개인화
  personalization: {
    // 관심 분야
    interests: {
      industries: string[];
      supportTypes: string[];
      fundingStages: string[];
      technologies?: string[];
      keywords: string[];
    };

    // 필터 설정
    defaultFilters: {
      matching: {
        minMatchRate?: number;
        maxApplicationPeriod?: number;  // 일 단위
        preferredSupportAmount?: [number, number];
      };

      buildup: {
        preferredBudgetRange?: [number, number];
        preferredDuration?: string;
        excludeCategories?: string[];
      };
    };

    // AI 추천 설정
    recommendations: {
      enabled: boolean;
      aggressiveness: "conservative" | "balanced" | "aggressive";
      includeExperimentalFeatures: boolean;
      personalizedContent: boolean;
    };
  };

  // 개인정보 공개 설정
  privacy: {
    profileVisibility: "public" | "limited" | "private";

    publicFields: {
      companyName: boolean;
      industry: boolean;
      fundingStage: boolean;
      teamSize: boolean;
      location: boolean;
      establishedYear: boolean;
    };

    // 매칭 시 공개 정보
    matchingProfile: {
      showCompanyName: boolean;
      showContactInfo: boolean;
      showDetailedMetrics: boolean;
    };

    // 분석 데이터 사용
    analytics: {
      allowUsageAnalytics: boolean;
      allowBenchmarking: boolean;
      allowMarketResearch: boolean;
    };
  };

  // 접근성 설정
  accessibility: {
    highContrast: boolean;
    fontSize: "small" | "medium" | "large" | "xl";
    reduceAnimations: boolean;
    screenReaderOptimized: boolean;
    keyboardNavigation: boolean;
  };

  // 메타 정보
  lastUpdated: Date;
  syncedDevices: string[];    // 설정이 동기화된 기기 목록
}
```

## 통합 사용자 인터페이스

### Master User Interface
```typescript
interface UnifiedUser {
  // 핵심 계층
  identity: UserCoreIdentity;
  business: UserBusinessProfile;
  activity: UserPlatformActivity;
  system: UserSystemMetadata;
  preferences: UserPreferences;

  // 계산된 속성들
  computed: {
    profileCompleteness: number;        // 전체 프로필 완성도
    clusterKey: string;                 // "A4S1" 형태
    riskScore: number;                  // 이탈 위험도
    lifetimeValue: number;              // 고객 생애 가치

    // 현재 상태 요약
    summary: {
      displayName: string;
      statusBadge: string;
      primaryRole: string;
      currentPlan: string;
      lastActivity: Date;
    };
  };

  // 버전 관리
  version: {
    schemaVersion: string;
    dataVersion: number;
    lastMigration?: Date;
    compatibilityFlags: string[];
  };
}
```

## 데이터 수집 전략

### 수집 단계별 정보
```typescript
interface DataCollectionStrategy {
  // Phase 1: 회원가입 (필수 최소한)
  registration: {
    required: [
      "identity.email",
      "identity.name",
      "business.company.name",
      "business.personalRole.position"
    ];
    optional: [
      "identity.phone",
      "business.company.employeeCount"
    ];
  };

  // Phase 2: 온보딩 (플랫폼 이해)
  onboarding: {
    required: [
      "business.business.industry",
      "business.business.sector",
      "business.product.category"
    ];
    optional: [
      "business.business.businessModel",
      "business.funding.currentStage"
    ];
  };

  // Phase 3: 첫 KPI 진단 전 (정확한 분석을 위해)
  preAssessment: {
    required: [
      "business.company.foundedYear",
      "business.team.totalMembers",
      "business.product.developmentStage"
    ];
    optional: [
      "business.business.revenueRange",
      "business.funding.isSeekingFunding"
    ];
  };

  // Phase 4: 서비스 사용 중 (점진적 수집)
  progressive: {
    // KPI 진단 과정에서 수집
    duringKPI: [
      "business.business.monthlyRevenue",
      "business.team.departments",
      "business.product.techStack"
    ];

    // 매칭 사용 중 수집
    duringMatching: [
      "preferences.personalization.interests",
      "preferences.notifications.content"
    ];

    // 빌드업 구매 시 수집
    duringPurchase: [
      "business.company.registrationNumber",
      "business.company.address",
      "business.funding.totalFunded"
    ];
  };
}
```

## 구현 계획

### Phase 1: 기존 구조 통합 (1주)
- [ ] 기존 `user.ts`와 `userProfile.ts` 분석
- [ ] 통합 타입 정의 작성
- [ ] 데이터 마이그레이션 스크립트 작성
- [ ] 기존 Context/API 호환성 유지

### Phase 2: 점진적 확장 (2주)
- [ ] 비즈니스 프로필 상세 정보 추가
- [ ] KPI 진단 히스토리 시스템 구축
- [ ] 사용 패턴 분석 기능 추가
- [ ] 개인화 설정 UI 구현

### Phase 3: 고도화 (2주)
- [ ] 데이터 분석 대시보드 (관리자용)
- [ ] 자동 클러스터링 알고리즘
- [ ] 개인화 추천 엔진
- [ ] 데이터 내보내기/가져오기

### Phase 4: 최적화 (1주)
- [ ] 성능 최적화
- [ ] 캐싱 전략 구현
- [ ] 배치 처리 시스템
- [ ] 모니터링 및 알러트

## 기술 구현 사항

### 데이터베이스 스키마
```sql
-- 테이블 구조 예시
CREATE TABLE users (
  id UUID PRIMARY KEY,

  -- Core Identity (JSON)
  identity JSONB NOT NULL,

  -- Business Profile (JSON)
  business JSONB,

  -- Platform Activity (JSON)
  activity JSONB,

  -- System Metadata (JSON)
  system_metadata JSONB NOT NULL,

  -- Preferences (JSON)
  preferences JSONB,

  -- 검색/인덱싱용 추출 필드
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  company_name VARCHAR,
  cluster_key VARCHAR(10),
  user_role VARCHAR(20),
  status VARCHAR(20),

  -- 메타데이터
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  schema_version VARCHAR(10) DEFAULT '1.0.0'
);

-- 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company ON users(company_name);
CREATE INDEX idx_users_cluster ON users(cluster_key);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(user_role);
```

### Context API 구조
```typescript
// 통합 User Context
interface UserContextType {
  // 상태
  user: UnifiedUser | null;
  loading: boolean;
  error: string | null;

  // Core Identity 관리
  updateProfile: (updates: Partial<UserCoreIdentity>) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;

  // Business Profile 관리
  updateBusiness: (updates: Partial<UserBusinessProfile>) => Promise<void>;
  calculateCompleteness: () => number;

  // Platform Activity 관리
  updateCluster: (stage: string, sector: string) => Promise<void>;
  addKPIResult: (result: KPIAssessmentResult) => Promise<void>;
  recordActivity: (activity: string, details?: any) => Promise<void>;

  // System Metadata (관리자만)
  updatePermissions: (permissions: Permission[]) => Promise<void>;
  changeStatus: (status: string, reason?: string) => Promise<void>;

  // Preferences 관리
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;

  // 유틸리티
  hasPermission: (resource: string, action: string) => boolean;
  getClusterInfo: () => ClusterInfo | null;
  exportUserData: () => Promise<string>;
}
```

## 성공 지표

### 데이터 품질
- [ ] 프로필 완성도 평균 > 80%
- [ ] 데이터 일관성 > 95%
- [ ] 마이그레이션 성공률 100%

### 사용자 경험
- [ ] 온보딩 완료율 > 85%
- [ ] 정보 업데이트 빈도 증가
- [ ] 개인화 기능 사용률 > 60%

### 시스템 성능
- [ ] 사용자 데이터 로딩 < 500ms
- [ ] 검색 성능 < 100ms
- [ ] 데이터 동기화 성공률 > 99%

## 보안 및 규정 준수

### 개인정보보호
- GDPR 준수 (데이터 이동권, 삭제권)
- 개인정보보호법 준수
- 최소한의 데이터 수집 원칙
- 명시적 동의 시스템

### 데이터 보안
- 민감 정보 암호화
- 접근 권한 제어
- 감사 로그 유지
- 정기적 보안 검토

---

## 부록: 마이그레이션 가이드

### 기존 데이터 변환 매핑
```typescript
// userProfile.ts → UnifiedUser 변환
const migrateUserProfile = (oldProfile: UserProfile): Partial<UnifiedUser> => {
  return {
    identity: {
      id: oldProfile.basicInfo.id,
      email: oldProfile.basicInfo.email || '',
      name: oldProfile.basicInfo.name,
      phone: oldProfile.basicInfo.phone,
      createdAt: oldProfile.metadata.createdAt,
      lastLoginAt: oldProfile.basicInfo.lastLoginAt,
      isActive: true,
      isEmailVerified: true
    },
    business: {
      personalRole: {
        position: oldProfile.basicInfo.position || '',
        isFounder: false
      },
      company: {
        name: oldProfile.basicInfo.companyName || '',
        employeeCount: "1-5명"  // 기본값
      }
      // ... 기타 매핑
    },
    activity: {
      cluster: oldProfile.cluster,
      kpiHistory: oldProfile.kpiDiagnosis ? [{
        assessmentId: `migrated_${Date.now()}`,
        completedAt: oldProfile.kpiDiagnosis.lastDiagnosisDate,
        scores: oldProfile.kpiDiagnosis.core5Scores,
        totalScore: oldProfile.kpiDiagnosis.totalScore,
        // ... 기타 변환
      }] : [],
      // ... 기타 매핑
    }
  };
};
```

### 단계적 마이그레이션 계획
1. **백업**: 기존 데이터 전체 백업
2. **병렬 운영**: 기존 시스템과 신규 시스템 동시 운영
3. **점진적 이전**: 사용자별 점진적 데이터 이전
4. **검증**: 데이터 무결성 검증
5. **전환**: 완전 전환 후 기존 시스템 제거

---

*이 문서는 포켓비즈 플랫폼의 사용자 정보 구조 통합을 위한 종합 설계서입니다.*
*Last Updated: 2025-01-17*