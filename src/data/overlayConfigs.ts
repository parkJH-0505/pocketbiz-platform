// 이벤트 카테고리별 오버레이 설정

// 타입 정의 (임시)
type EventCategory =
  | 'government_support'
  | 'open_innovation'
  | 'vc_opportunity'
  | 'accelerator'
  | 'tips_program'
  | 'loan_guarantee'
  | 'voucher'
  | 'global'
  | 'contest'
  | 'loan_program'
  | 'bidding'
  | 'batch_program'
  | 'conference'
  | 'seminar';

interface OverlayConfig {
  category: EventCategory;
  title: string;
  primaryFields: string[];
  secondaryFields: string[];
  actionButtonText: string;
  iconColor: string;
}

export const overlayConfigs: Record<EventCategory, OverlayConfig> = {
  government_support: {
    category: 'government_support',
    title: '정부지원사업',
    primaryFields: [
      'supportAmount',      // 지원 금액
      'applicationEndDate', // 마감일
      'hostOrganization',   // 주관기관
      'selectionCount',     // 선정기업 수
      'matchingScore'       // 적합도
    ],
    secondaryFields: [
      'supportContent',
      'executionPeriod',
      'governmentDepartment',
      'applicationConditions',
      'keywords',
      'coreKpiRequirements'
    ],
    actionButtonText: '지원서 준비하기',
    iconColor: 'text-blue-600'
  },

  open_innovation: {
    category: 'open_innovation',
    title: '오픈이노베이션',
    primaryFields: [
      'demandOrganization',   // 수요기관
      'recruitmentField',     // 모집분야
      'applicationEndDate',   // 마감일
      'collaborationPeriod',  // 협업기간
      'matchingScore'         // 적합도
    ],
    secondaryFields: [
      'collaborationContent',
      'selectionCount',
      'applicationConditions',
      'keywords',
      'coreKpiRequirements'
    ],
    actionButtonText: '협업 제안하기',
    iconColor: 'text-green-600'
  },

  vc_opportunity: {
    category: 'vc_opportunity',
    title: 'VC 투자기회',
    primaryFields: [
      'vcName',              // VC명
      'investmentStage',     // 투자단계
      'investmentAmount',    // 투자금액
      'applicationEndDate',  // 마감일
      'matchingScore'        // 적합도
    ],
    secondaryFields: [
      'focusAreas',
      'presentationFormat',
      'selectionProcess',
      'keywords',
      'coreKpiRequirements'
    ],
    actionButtonText: '피칭 신청하기',
    iconColor: 'text-purple-600'
  },

  accelerator: {
    category: 'accelerator',
    title: '액셀러레이터',
    primaryFields: [
      'acceleratorName',     // 액셀러레이터명
      'programDuration',     // 프로그램 기간
      'fundingAmount',       // 펀딩 금액
      'applicationEndDate',  // 마감일
      'matchingScore'        // 적합도
    ],
    secondaryFields: [
      'cohortSize',
      'equity',
      'mentorship',
      'demoDay',
      'keywords',
      'coreKpiRequirements'
    ],
    actionButtonText: '프로그램 지원하기',
    iconColor: 'text-orange-600'
  },

  tips_program: {
    category: 'tips_program',
    title: 'TIPS 프로그램',
    primaryFields: [
      'programType',         // 프로그램 유형
      'fundingAmount',       // 지원금액
      'programDuration',     // 사업기간
      'applicationEndDate',  // 마감일
      'matchingScore'        // 적합도
    ],
    secondaryFields: [
      'requirementLevel',
      'evaluationCriteria',
      'supportBenefits',
      'keywords',
      'coreKpiRequirements'
    ],
    actionButtonText: 'TIPS 지원하기',
    iconColor: 'text-indigo-600'
  },

  loan_guarantee: {
    category: 'loan_guarantee',
    title: '융자·보증',
    primaryFields: [
      'fundingAmount',       // 지원금액
      'programDuration',     // 보증기간
      'hostOrganization',    // 주관기관
      'applicationEndDate',  // 마감일
      'matchingScore'        // 적합도
    ],
    secondaryFields: [
      'evaluationCriteria',
      'supportBenefits',
      'keywords',
      'coreKpiRequirements'
    ],
    actionButtonText: '보증 신청하기',
    iconColor: 'text-emerald-600'
  },

  voucher: {
    category: 'voucher',
    title: '바우처',
    primaryFields: [
      'fundingAmount',       // 지원금액
      'programDuration',     // 지원기간
      'hostOrganization',    // 주관기관
      'applicationEndDate',  // 마감일
      'matchingScore'        // 적합도
    ],
    secondaryFields: [
      'evaluationCriteria',
      'supportBenefits',
      'keywords',
      'coreKpiRequirements'
    ],
    actionButtonText: '바우처 신청하기',
    iconColor: 'text-yellow-600'
  },

  global: {
    category: 'global',
    title: '글로벌',
    primaryFields: [
      'fundingAmount',       // 지원금액
      'programDuration',     // 프로그램 기간
      'hostOrganization',    // 주관기관
      'applicationEndDate',  // 마감일
      'matchingScore'        // 적합도
    ],
    secondaryFields: [
      'evaluationCriteria',
      'supportBenefits',
      'keywords',
      'coreKpiRequirements'
    ],
    actionButtonText: '글로벌 진출 신청하기',
    iconColor: 'text-blue-500'
  },

  contest: {
    category: 'contest',
    title: '공모전',
    primaryFields: [
      'fundingAmount',       // 상금
      'programDuration',     // 공모기간
      'hostOrganization',    // 주관기관
      'applicationEndDate',  // 마감일
      'matchingScore'        // 적합도
    ],
    secondaryFields: [
      'evaluationCriteria',
      'supportBenefits',
      'keywords',
      'coreKpiRequirements'
    ],
    actionButtonText: '공모전 참여하기',
    iconColor: 'text-red-500'
  },

  loan_program: {
    category: 'loan_program',
    title: '융자프로그램',
    primaryFields: [
      'loanAmount',          // 대출금액
      'interestRate',        // 금리
      'repaymentPeriod',     // 상환기간
      'applicationEndDate',  // 마감일
      'matchingScore'        // 적합도
    ],
    secondaryFields: [
      'guaranteeRequired',
      'collateralRequired',
      'loanPurpose',
      'keywords',
      'coreKpiRequirements'
    ],
    actionButtonText: '융자 신청하기',
    iconColor: 'text-emerald-600'
  },

  bidding: {
    category: 'bidding',
    title: '입찰공고',
    primaryFields: [
      'biddingOrganization', // 발주기관
      'projectValue',        // 사업금액
      'projectPeriod',       // 사업기간
      'applicationEndDate',  // 마감일
      'matchingScore'        // 적합도
    ],
    secondaryFields: [
      'technicalRequirements',
      'evaluationMethod',
      'qualificationRequirements',
      'keywords',
      'coreKpiRequirements'
    ],
    actionButtonText: '입찰 참여하기',
    iconColor: 'text-red-600'
  },

  batch_program: {
    category: 'batch_program',
    title: '배치프로그램',
    primaryFields: [
      'programName',         // 프로그램명
      'batchNumber',         // 기수
      'programDuration',     // 프로그램 기간
      'applicationEndDate',  // 마감일
      'matchingScore'        // 적합도
    ],
    secondaryFields: [
      'participantCount',
      'curriculum',
      'certification',
      'keywords',
      'coreKpiRequirements'
    ],
    actionButtonText: '프로그램 참여하기',
    iconColor: 'text-cyan-600'
  },

  conference: {
    category: 'conference',
    title: '컨퍼런스',
    primaryFields: [
      'venue',               // 장소
      'eventDate',           // 행사일
      'duration',            // 행사시간
      'participationFee',    // 참가비
      'matchingScore'        // 적합도
    ],
    secondaryFields: [
      'speakers',
      'agenda',
      'networkingOpportunities',
      'keywords',
      'coreKpiRequirements'
    ],
    actionButtonText: '참가 신청하기',
    iconColor: 'text-pink-600'
  },

  seminar: {
    category: 'seminar',
    title: '세미나',
    primaryFields: [
      'venue',               // 장소
      'eventDate',           // 행사일
      'instructor',          // 강사
      'participationFee',    // 참가비
      'matchingScore'        // 적합도
    ],
    secondaryFields: [
      'topics',
      'targetAudience',
      'duration',
      'keywords',
      'coreKpiRequirements'
    ],
    actionButtonText: '세미나 신청하기',
    iconColor: 'text-amber-600'
  }
};

// 카테고리별 기본 추천 설정 (군집별)
export const categoryRecommendations: Record<string, EventCategory[]> = {
  // A-1 (예비창업자)
  'A1S1': ['seminar', 'conference', 'batch_program'],
  'A1S2': ['seminar', 'conference', 'batch_program'],
  'A1S3': ['seminar', 'conference', 'batch_program'],
  'A1S4': ['seminar', 'conference', 'batch_program'],
  'A1S5': ['seminar', 'conference', 'batch_program'],

  // A-2 (창업 직전·막 창업)
  'A2S1': ['government_support', 'accelerator', 'loan_program'],
  'A2S2': ['government_support', 'accelerator', 'loan_program'],
  'A2S3': ['government_support', 'accelerator', 'loan_program'],
  'A2S4': ['government_support', 'accelerator', 'loan_program'],
  'A2S5': ['government_support', 'accelerator', 'loan_program'],

  // A-3 (PMF 검증 완료)
  'A3S1': ['government_support', 'vc_opportunity', 'open_innovation'],
  'A3S2': ['government_support', 'vc_opportunity', 'open_innovation'],
  'A3S3': ['government_support', 'vc_opportunity', 'open_innovation'],
  'A3S4': ['government_support', 'vc_opportunity', 'open_innovation'],
  'A3S5': ['government_support', 'vc_opportunity', 'open_innovation'],

  // A-4 (Pre-A 단계)
  'A4S1': ['tips_program', 'vc_opportunity', 'open_innovation'],
  'A4S2': ['tips_program', 'vc_opportunity', 'bidding'],
  'A4S3': ['tips_program', 'vc_opportunity', 'open_innovation'],
  'A4S4': ['tips_program', 'vc_opportunity', 'open_innovation'],
  'A4S5': ['vc_opportunity', 'open_innovation', 'bidding'],

  // A-5 (Series A 이상)
  'A5S1': ['vc_opportunity', 'open_innovation', 'bidding'],
  'A5S2': ['vc_opportunity', 'open_innovation', 'bidding'],
  'A5S3': ['vc_opportunity', 'open_innovation', 'bidding'],
  'A5S4': ['vc_opportunity', 'open_innovation', 'bidding'],
  'A5S5': ['vc_opportunity', 'open_innovation', 'bidding']
};

// 유틸리티 함수
export function getOverlayConfig(category: EventCategory): OverlayConfig {
  return overlayConfigs[category];
}

export function getRecommendedCategories(stage: string, sector: string): EventCategory[] {
  const clusterKey = `${stage.replace('-', '')}${sector.replace('-', '')}`;
  return categoryRecommendations[clusterKey] || ['government_support', 'vc_opportunity', 'conference'];
}

export function getCategoryIcon(category: EventCategory): string {
  const icons = {
    government_support: '🏛️',
    open_innovation: '🤝',
    vc_opportunity: '💼',
    accelerator: '🚀',
    tips_program: '🎯',
    loan_guarantee: '🛡️',
    voucher: '🎫',
    global: '🌍',
    contest: '🏆',
    loan_program: '💰',
    bidding: '📋',
    batch_program: '👥',
    conference: '🎤',
    seminar: '📚'
  };
  return icons[category] || '📌';
}