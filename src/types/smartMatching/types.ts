// 스마트 매칭 V2 - 이벤트 카테고리별 맞춤 시스템

export type EventCategory =
  | 'government_support'    // 지원사업
  | 'open_innovation'       // 오픈이노베이션
  | 'vc_opportunity'        // VC 투자기회/데모데이
  | 'accelerator'           // 엑셀러레이팅
  | 'tips_program'          // TIPS/DIPS/RIPS
  | 'loan_program'          // 융자프로그램
  | 'bidding'              // 입찰
  | 'batch_program'        // 배치프로그램
  | 'conference'           // 컨퍼런스
  | 'seminar';             // 세미나

export type Stage = 'A-1' | 'A-2' | 'A-3' | 'A-4' | 'A-5';
export type Sector = 'S-1' | 'S-2' | 'S-3' | 'S-4' | 'S-5';

// Core5 점수 타입 (기존과 동일)
export interface Core5Scores {
  GO: number;  // Growth Opportunity (성장기회) 0-100
  EC: number;  // Execution Capability (실행역량) 0-100
  PT: number;  // Product Technology (제품기술) 0-100
  PF: number;  // Platform (플랫폼) 0-100
  TO: number;  // Team Organization (팀조직) 0-100
}

// Core5 요구사항 (별칭)
export type Core5Requirements = Core5Scores;

// 기본 이벤트 인터페이스
export interface BaseEvent {
  id: string;
  category: EventCategory;
  title: string;
  description: string;
  announcementDate: Date;
  applicationStartDate: Date;
  applicationEndDate: Date;
  resultAnnouncementDate?: Date;
  keywords: string[];

  // 내부 속성
  recommendedStages: Stage[];
  recommendedSectors: Sector[];
  coreKpiRequirements?: Record<string, number>; // Core5 적정점수

  // 커스텀 속성
  matchingScore?: number;
  relatedServices?: string[];
  originalUrl?: string;
}

// 지원사업 특화 속성
export interface GovernmentSupportEvent extends BaseEvent {
  category: 'government_support';
  supportContent: string;
  supportAmount: string;
  executionPeriod: string;
  hostOrganization: string;
  governmentDepartment: string;
  selectionCount: number;
  applicationConditions: string[];
}

// 오픈이노베이션 특화 속성
export interface OpenInnovationEvent extends BaseEvent {
  category: 'open_innovation';
  demandOrganization: string;
  recruitmentField: string;
  collaborationContent: string;
  collaborationPeriod: string;
  selectionCount: number;
  applicationConditions: string[];
}

// VC 투자기회/데모데이 특화 속성
export interface VCOpportunityEvent extends BaseEvent {
  category: 'vc_opportunity';
  vcName: string;
  investmentStage: string;
  investmentAmount: string;
  focusAreas: string[];
  presentationFormat: string;
  selectionProcess: string[];
}

// 액셀러레이터 특화 속성
export interface AcceleratorEvent extends BaseEvent {
  category: 'accelerator';
  acceleratorName: string;
  programDuration: string;
  cohortSize: number;
  equity?: string;
  mentorship: string[];
  demoDay: boolean;
  fundingAmount?: string;
}

// TIPS 프로그램 특화 속성
export interface TipsProgramEvent extends BaseEvent {
  category: 'tips_program';
  programType: 'TIPS' | 'DIPS' | 'RIPS';
  fundingAmount: string;
  programDuration: string;
  requirementLevel: string;
  evaluationCriteria: string[];
  supportBenefits: string[];
  hostOrganization: string;
}

// 융자프로그램 특화 속성
export interface LoanProgramEvent extends BaseEvent {
  category: 'loan_program';
  loanAmount: string;
  interestRate: string;
  loanPeriod: string;
  collateralRequired: boolean;
  hostOrganization: string;
  eligibilityCriteria: string[];
}

// 입찰 특화 속성
export interface BiddingEvent extends BaseEvent {
  category: 'bidding';
  projectName: string;
  budget: string;
  bidType: string;
  qualificationRequirements: string[];
  technicalRequirements: string[];
  hostOrganization: string;
}

// 배치프로그램 특화 속성
export interface BatchProgramEvent extends BaseEvent {
  category: 'batch_program';
  programName: string;
  batchNumber: string;
  programDuration: string;
  curriculum: string[];
  mentors: string[];
  graduationBenefits: string[];
}

// 컨퍼런스 특화 속성
export interface ConferenceEvent extends BaseEvent {
  category: 'conference';
  eventName: string;
  venue: string;
  speakers: string[];
  agenda: string[];
  ticketPrice: string;
  expectedAttendees: number;
}

// 세미나 특화 속성
export interface SeminarEvent extends BaseEvent {
  category: 'seminar';
  topic: string;
  instructor: string;
  duration: string;
  targetAudience: string[];
  learningObjectives: string[];
  certificateProvided: boolean;
}

// 유니온 타입
export type SmartMatchingEvent =
  | GovernmentSupportEvent
  | OpenInnovationEvent
  | VCOpportunityEvent
  | AcceleratorEvent
  | TipsProgramEvent
  | LoanProgramEvent
  | BiddingEvent
  | BatchProgramEvent
  | ConferenceEvent
  | SeminarEvent;

// 매칭 결과
export interface MatchingResult {
  event: SmartMatchingEvent;
  score: number;
  matchingReasons: string[];
  urgencyLevel: 'low' | 'medium' | 'high';
  daysUntilDeadline: number;
  recommendedActions: string[];
}

// 필터 옵션 (기존과 통합)
export interface FilterOptions {
  categories: EventCategory[];
  stages: Stage[];
  sectors: Sector[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  minScore?: number;
  urgencyLevel?: 'all' | 'low' | 'medium' | 'high';
}

// 스마트매칭 상태
export interface SmartMatchingState {
  selectedEventId: string | null;
  filters: FilterOptions;
  sortBy: 'matchingScore' | 'deadline' | 'category';
  viewMode: 'grid' | 'list';
  recommendations: MatchingResult[];
}

// 준비 태스크 (기존 유지)
export interface PreparationTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  completed: boolean;
  relatedArea: keyof Core5Scores | null;
}

// THE ONE 추천 (기존 구조 활용)
export interface TheOneRecommendation {
  event: SmartMatchingEvent;
  matchingScore: number;
  matchingAnalysis: {
    matchingScore: number;
    gaps: Record<keyof Core5Scores, number>;
    strengths: string[];
    weaknesses: string[];
    recommendation: string;
  };
  preparationTasks: PreparationTask[];
  alternativeRecommendations: SmartMatchingEvent[];
  userScores: Core5Scores;
  requiredScores: Core5Scores;
  averageScores: Core5Scores;
}

// 이벤트 상태 타입
export type EventStatus = 'recommended' | 'preparing' | 'insufficient';

// 호환성 검증 결과
export interface CompatibilityResult {
  isCompatible: boolean;
  meetCount: number;
  totalCount: number;
  details: Record<keyof Core5Scores, boolean>;
}