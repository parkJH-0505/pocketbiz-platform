/**
 * 실제 공고 데이터 타입 정의
 * 정부/기관에서 제공하는 실제 필드 기반
 */

// 공고 카테고리 (실제 분류)
export type EventCategoryType =
  | 'government_support'  // 정부지원사업
  | 'tips_rd'            // TIPS/R&D
  | 'investment'         // 투자/IR
  | 'accelerator'        // 액셀러레이터
  | 'open_innovation'    // 오픈이노베이션
  | 'loan_guarantee'     // 융자/보증
  | 'voucher'           // 바우처사업
  | 'global'            // 해외진출지원
  | 'contest'           // 공모전/경진대회
  | 'other';            // 기타

// 지원 분야 (실제 카테고리)
export type SupportFieldType =
  | 'funding'           // 사업화·자금
  | 'rnd'              // 기술개발(R&D)·인력
  | 'global_market'    // 판로·해외진출·글로벌
  | 'facility'         // 시설·공간·보육
  | 'mentoring'        // 멘토링·컨설팅·교육
  | 'networking'       // 행사·네트워크
  | 'certification'    // 인증·지재권
  | 'other';          // 기타

// 기본 공고 정보 (실제 수집 가능한 데이터)
export interface BaseEventData {
  // 필수 정보 (항상 얻을 수 있는 것)
  id: string;                    // 공고 일련번호
  title: string;                  // 공고명
  originalOrganization: string;  // 원 기관명 (정부부처 등)
  hostOrganization: string;      // 주관 기관
  applicationStartDate: Date;    // 공고 접수 시작일시
  applicationEndDate: Date;      // 공고 접수 종료일시
  supportField: SupportFieldType; // 지원 분야
  targetRegion: string;          // 지원 지역 (전국, 서울, 경기 등)
  eligibilityText: string;       // 신청 대상 내용 (비정형 텍스트)
  originalUrl: string;           // 공고 링크
  fullText?: string;            // 공고 전문 (있는 경우)

  // 추가 파싱 가능 정보 (있을 수도 없을 수도)
  fundingAmount?: string;        // 지원금액 (텍스트에서 추출)
  selectionCount?: number;       // 선정 규모
  competitionRate?: string;      // 예상 경쟁률
  requiredDocuments?: string[];  // 필요 서류 (파싱)

  // 메타데이터
  createdAt: Date;              // 공고 등록일
  updatedAt: Date;              // 최종 수정일
  viewCount?: number;           // 조회수
}

// 우리가 추가하는 분석 데이터
export interface EventAnalysis {
  eventId: string;

  // Core5 매칭
  requiredScores: {
    GO: number;
    EC: number;
    PT: number;
    PF: number;
    TO: number;
  };

  // 성장단계/섹터 태깅
  recommendedStages: string[];  // ['A-3', 'A-4']
  recommendedSectors: string[]; // ['S-1', 'S-2']

  // 파싱된 조건
  parsedConditions: {
    maxYearsInBusiness?: number;     // 업력 제한
    minRevenue?: number;             // 최소 매출
    maxRevenue?: number;             // 최대 매출
    requiredCertifications?: string[]; // 필수 인증
    excludedIndustries?: string[];   // 제외 업종
  };

  // 키워드 (자동 추출)
  extractedKeywords: string[];

  // 준비 난이도
  preparationDifficulty: 'easy' | 'medium' | 'hard';
  estimatedPreparationDays: number;
}

// 통합 이벤트 타입
export interface EventWithAnalysis extends BaseEventData {
  analysis?: EventAnalysis;

  // 계산 필드
  daysUntilDeadline?: number;
  status: 'upcoming' | 'open' | 'closing' | 'closed';
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

// API 응답 타입
export interface EventsResponse {
  events: EventWithAnalysis[];
  totalCount: number;
  page: number;
  pageSize: number;
  filters?: {
    categories?: EventCategoryType[];
    supportFields?: SupportFieldType[];
    regions?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
}

// 필터 옵션
export interface EventFilterOptions {
  // 팩트 기반 필터
  categories?: EventCategoryType[];
  supportFields?: SupportFieldType[];
  regions?: string[];
  deadlineRange?: 'thisWeek' | 'thisMonth' | 'nextMonth' | 'all';
  organizations?: string[];

  // 분석 기반 필터
  stages?: string[];
  sectors?: string[];
  maxPreparationDays?: number;
  minMatchScore?: number; // Core5 기반 계산
}

// 북마크/관심 설정
export interface UserEventPreference {
  userId: string;
  bookmarkedEventIds: string[];

  // 알림 설정
  alertSettings: {
    categories: EventCategoryType[];
    keywords: string[];
    organizations: string[];
    minFundingAmount?: number;
    daysBeforeDeadline: number; // 며칠 전 알림
  };

  // 히스토리
  viewedEvents: {
    eventId: string;
    viewedAt: Date;
  }[];

  appliedEvents: {
    eventId: string;
    appliedAt: Date;
    status: 'prepared' | 'applied' | 'selected' | 'rejected';
  }[];
}