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
}

// 융자프로그램 특화 속성
export interface LoanProgramEvent extends BaseEvent {
  category: 'loan_program';
  loanAmount: string;
  interestRate: string;
  repaymentPeriod: string;
  guaranteeRequired: boolean;
  collateralRequired: boolean;
  loanPurpose: string[];
}

// 입찰 특화 속성
export interface BiddingEvent extends BaseEvent {
  category: 'bidding';
  biddingOrganization: string;
  projectValue: string;
  projectPeriod: string;
  technicalRequirements: string[];
  evaluationMethod: string;
  qualificationRequirements: string[];
}

// 배치프로그램 특화 속성
export interface BatchProgramEvent extends BaseEvent {
  category: 'batch_program';
  programName: string;
  batchNumber: number;
  programDuration: string;
  participantCount: number;
  curriculum: string[];
  certification?: string;
}

// 컨퍼런스 특화 속성
export interface ConferenceEvent extends BaseEvent {
  category: 'conference';
  venue: string;
  eventDate: Date;
  duration: string;
  speakers: string[];
  agenda: string[];
  participationFee?: string;
  networkingOpportunities: string[];
}

// 세미나 특화 속성
export interface SeminarEvent extends BaseEvent {
  category: 'seminar';
  venue: string;
  eventDate: Date;
  duration: string;
  instructor: string;
  topics: string[];
  targetAudience: string;
  participationFee?: string;
}

// 통합 이벤트 타입
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
  urgencyLevel: 'high' | 'medium' | 'low';
  daysUntilDeadline: number;
  recommendedActions: string[];
}

// 오버레이 구성
export interface OverlayConfig {
  category: EventCategory;
  title: string;
  primaryFields: string[];      // 오버레이에서 보여줄 주요 필드
  secondaryFields: string[];    // 더보기에서 보여줄 필드
  actionButtonText: string;     // CTA 버튼 텍스트
  iconColor: string;           // 카테고리별 아이콘 색상
}

// 스마트 매칭 컨텍스트
export interface SmartMatchingContext {
  userStage: Stage;
  userSector: Sector;
  currentRecommendations: MatchingResult[];
  activeOverlay: SmartMatchingEvent | null;
  filters: {
    categories: EventCategory[];
    urgencyLevel: ('high' | 'medium' | 'low')[];
    stages: Stage[];
    sectors: Sector[];
  };
}

// 매칭 엔진 인터페이스
export interface MatchingEngine {
  recommend: (userProfile: { stage: Stage; sector: Sector; kpiScores?: Record<string, number> }) => MatchingResult[];
  calculateScore: (event: SmartMatchingEvent, userProfile: any) => number;
  getUrgencyLevel: (daysUntilDeadline: number) => 'high' | 'medium' | 'low';
  filterByCategory: (events: SmartMatchingEvent[], category: EventCategory) => SmartMatchingEvent[];
}