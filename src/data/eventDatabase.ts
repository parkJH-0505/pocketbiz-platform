/**
 * 이벤트(공고) 더미 데이터베이스
 * 실제 공고 형태를 모방한 리얼한 데이터
 */

import type { EventWithAnalysis, EventAnalysis } from '../types/event.types';

// 현재 날짜 기준 계산
const today = new Date();
const addDays = (days: number) => new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

// Core5 요구점수 템플릿 (카테고리별)
const CORE5_TEMPLATES = {
  tips_rd: { GO: 60, EC: 55, PT: 80, PF: 75, TO: 70 },
  government_support: { GO: 60, EC: 55, PT: 65, PF: 75, TO: 70 },
  investment: { GO: 85, EC: 80, PT: 70, PF: 70, TO: 75 },
  accelerator: { GO: 65, EC: 55, PT: 70, PF: 60, TO: 75 },
  open_innovation: { GO: 75, EC: 60, PT: 70, PF: 65, TO: 70 },
  loan_guarantee: { GO: 65, EC: 75, PT: 60, PF: 90, TO: 65 },
  voucher: { GO: 55, EC: 50, PT: 60, PF: 65, TO: 60 },
  global: { GO: 70, EC: 65, PT: 65, PF: 70, TO: 70 },
  contest: { GO: 50, EC: 45, PT: 75, PF: 55, TO: 65 },
};

// 실제 같은 더미 이벤트 데이터
export const EVENT_DATABASE: EventWithAnalysis[] = [
  // 1. TIPS 프로그램 (실제 공고 모방)
  {
    id: 'TIPS-2024-001',
    title: '2024년 상반기 민간투자주도형 기술창업지원(TIPS) 프로그램 창업팀 모집',
    originalOrganization: '중소벤처기업부',
    hostOrganization: '한국엔젤투자협회',
    applicationStartDate: addDays(-14),
    applicationEndDate: addDays(14),
    supportField: 'rnd',
    targetRegion: '전국',
    eligibilityText: '예비창업자(팀) 또는 창업한지 7년 이내 기업으로서, TIPS 운영사로부터 엔젤투자 확약을 받은 자. 타 정부 R&D 과제 수행 이력이 있는 경우 협약 종료 후 6개월 경과 필요.',
    originalUrl: 'https://www.jointips.or.kr',
    fundingAmount: '최대 5억원 (정부출연금)',
    selectionCount: 300,
    requiredDocuments: [
      'TIPS 운영사 추천서',
      '사업계획서',
      '최근 3년 재무제표',
      '법인등기부등본',
      '기술성 평가자료'
    ],
    createdAt: addDays(-30),
    updatedAt: addDays(-14),
    viewCount: 15234,
    daysUntilDeadline: 14,
    status: 'open',
    urgencyLevel: 'high',
    analysis: {
      eventId: 'TIPS-2024-001',
      requiredScores: CORE5_TEMPLATES.tips_rd,
      recommendedStages: ['A-3', 'A-4'],
      recommendedSectors: ['S-1', 'S-2'],
      parsedConditions: {
        maxYearsInBusiness: 7,
        requiredCertifications: ['TIPS 운영사 추천']
      },
      extractedKeywords: ['R&D', '기술창업', '엔젤투자', 'TIPS', '민간투자'],
      preparationDifficulty: 'hard',
      estimatedPreparationDays: 21
    }
  },

  // 2. 창업성장기술개발사업
  {
    id: 'SMTECH-2024-002',
    title: '2024년 창업성장기술개발사업 디딤돌 과제 시행계획',
    originalOrganization: '중소벤처기업부',
    hostOrganization: '중소기업기술정보진흥원',
    applicationStartDate: addDays(-10),
    applicationEndDate: addDays(20),
    supportField: 'rnd',
    targetRegion: '전국',
    eligibilityText: '창업 후 7년 이하 중소기업. 기업부설연구소 또는 연구개발전담부서 보유 기업 우대. 최근 2년간 매출액 연평균 20% 이상 성장 기업.',
    originalUrl: 'https://www.smtech.go.kr',
    fundingAmount: '최대 2억원 (2년)',
    selectionCount: 500,
    requiredDocuments: [
      '사업계획서',
      '기술개발계획서',
      '재무제표',
      '국세 및 지방세 완납증명서'
    ],
    createdAt: addDays(-20),
    updatedAt: addDays(-10),
    viewCount: 8923,
    daysUntilDeadline: 20,
    status: 'open',
    urgencyLevel: 'medium',
    analysis: {
      eventId: 'SMTECH-2024-002',
      requiredScores: CORE5_TEMPLATES.government_support,
      recommendedStages: ['A-2', 'A-3'],
      recommendedSectors: ['S-1', 'S-2', 'S-3'],
      parsedConditions: {
        maxYearsInBusiness: 7,
        minRevenue: 100000000 // 1억
      },
      extractedKeywords: ['R&D', '기술개발', '디딤돌', '중소기업'],
      preparationDifficulty: 'medium',
      estimatedPreparationDays: 14
    }
  },

  // 3. K-스타트업 센터 해외진출 지원
  {
    id: 'KSTARTUP-2024-003',
    title: '2024 K-Startup 센터 글로벌 진출 지원사업 참가기업 모집',
    originalOrganization: '중소벤처기업부',
    hostOrganization: '창업진흥원',
    applicationStartDate: addDays(-5),
    applicationEndDate: addDays(10),
    supportField: 'global_market',
    targetRegion: '전국',
    eligibilityText: '창업 3년 이상 7년 이하 기업. 전년도 매출액 5억원 이상. 수출 실적 보유 또는 해외진출 계획 보유 기업. 영문 홈페이지 및 제품 소개자료 보유 필수.',
    originalUrl: 'https://www.k-startup.go.kr',
    fundingAmount: '최대 5천만원',
    selectionCount: 100,
    requiredDocuments: [
      '해외진출계획서',
      '영문 회사소개서',
      '수출실적증명서',
      '제품/서비스 소개자료'
    ],
    createdAt: addDays(-15),
    updatedAt: addDays(-5),
    viewCount: 6234,
    daysUntilDeadline: 10,
    status: 'open',
    urgencyLevel: 'high',
    analysis: {
      eventId: 'KSTARTUP-2024-003',
      requiredScores: { GO: 70, EC: 65, PT: 65, PF: 70, TO: 70 },
      recommendedStages: ['A-3', 'A-4', 'A-5'],
      recommendedSectors: ['S-1', 'S-3'],
      parsedConditions: {
        minYearsInBusiness: 3,
        maxYearsInBusiness: 7,
        minRevenue: 500000000 // 5억
      },
      extractedKeywords: ['글로벌', '해외진출', '수출', 'K-Startup'],
      preparationDifficulty: 'medium',
      estimatedPreparationDays: 10
    }
  },

  // 4. 서울시 스타트업 지원
  {
    id: 'SEOUL-2024-004',
    title: '2024 서울창업허브 성수 입주기업 모집',
    originalOrganization: '서울특별시',
    hostOrganization: '서울창업허브',
    applicationStartDate: addDays(5),
    applicationEndDate: addDays(35),
    supportField: 'facility',
    targetRegion: '서울',
    eligibilityText: '서울시 소재 창업 7년 이내 기업. 상시근로자 5인 이상. ICT, 제조, 바이오 분야 우대.',
    originalUrl: 'https://seoulstartuphub.com',
    fundingAmount: '입주공간 + 최대 3천만원 지원',
    selectionCount: 50,
    requiredDocuments: [
      '입주신청서',
      '사업계획서',
      '고용보험 가입자명부',
      '임대차계약서'
    ],
    createdAt: addDays(-10),
    updatedAt: addDays(-5),
    viewCount: 4567,
    daysUntilDeadline: 35,
    status: 'upcoming',
    urgencyLevel: 'low',
    analysis: {
      eventId: 'SEOUL-2024-004',
      requiredScores: { GO: 55, EC: 50, PT: 60, PF: 65, TO: 60 },
      recommendedStages: ['A-2', 'A-3', 'A-4'],
      recommendedSectors: ['S-1', 'S-2', 'S-4'],
      parsedConditions: {
        maxYearsInBusiness: 7,
        minEmployees: 5,
        requiredLocation: '서울'
      },
      extractedKeywords: ['입주', '성수', '서울', '공간지원'],
      preparationDifficulty: 'easy',
      estimatedPreparationDays: 7
    }
  },

  // 5. 신한 스퀘어브릿지 프로그램
  {
    id: 'SHINHAN-2024-005',
    title: '신한 스퀘어브릿지 제12기 스타트업 육성 프로그램',
    originalOrganization: '신한금융그룹',
    hostOrganization: '신한 스퀘어브릿지',
    applicationStartDate: addDays(-7),
    applicationEndDate: addDays(7),
    supportField: 'mentoring',
    targetRegion: '전국',
    eligibilityText: '핀테크, 헬스케어, ESG, AI 분야 시리즈A 이전 스타트업. 프로토타입 이상 제품 보유 필수.',
    originalUrl: 'https://www.shinhanSquareBridge.com',
    fundingAmount: '최대 2억원 투자 연계',
    selectionCount: 20,
    requiredDocuments: [
      '참가신청서',
      '투자제안서(IR덱)',
      '팀 소개서',
      '재무현황표'
    ],
    createdAt: addDays(-20),
    updatedAt: addDays(-7),
    viewCount: 7890,
    daysUntilDeadline: 7,
    status: 'closing',
    urgencyLevel: 'critical',
    analysis: {
      eventId: 'SHINHAN-2024-005',
      requiredScores: CORE5_TEMPLATES.accelerator,
      recommendedStages: ['A-2', 'A-3'],
      recommendedSectors: ['S-1'],
      parsedConditions: {
        maxInvestmentStage: 'Pre-A'
      },
      extractedKeywords: ['핀테크', '액셀러레이터', '투자연계', 'AI'],
      preparationDifficulty: 'medium',
      estimatedPreparationDays: 10
    }
  },

  // 6. 대기업 오픈이노베이션
  {
    id: 'SAMSUNG-2024-006',
    title: '삼성전자 C-Lab Outside 9기 모집',
    originalOrganization: '삼성전자',
    hostOrganization: '삼성전자 창업지원센터',
    applicationStartDate: addDays(-3),
    applicationEndDate: addDays(25),
    supportField: 'mentoring',
    targetRegion: '전국',
    eligibilityText: '창업 5년 이내 스타트업. AI, IoT, 헬스케어, 로보틱스 분야. MVP 이상 제품 보유.',
    originalUrl: 'https://www.clab.samsung.com',
    fundingAmount: '최대 1억원 + 협업 기회',
    selectionCount: 30,
    requiredDocuments: [
      '지원서',
      '사업계획서',
      '기술 소개서',
      '팀 포트폴리오'
    ],
    createdAt: addDays(-15),
    updatedAt: addDays(-3),
    viewCount: 12345,
    daysUntilDeadline: 25,
    status: 'open',
    urgencyLevel: 'medium',
    analysis: {
      eventId: 'SAMSUNG-2024-006',
      requiredScores: CORE5_TEMPLATES.open_innovation,
      recommendedStages: ['A-2', 'A-3', 'A-4'],
      recommendedSectors: ['S-1', 'S-2'],
      parsedConditions: {
        maxYearsInBusiness: 5
      },
      extractedKeywords: ['오픈이노베이션', '삼성', 'C-Lab', 'AI', 'IoT'],
      preparationDifficulty: 'hard',
      estimatedPreparationDays: 14
    }
  },

  // 7. 정책자금 융자
  {
    id: 'POLICY-2024-007',
    title: '2024년 혁신창업사업화자금 융자 지원',
    originalOrganization: '중소벤처기업부',
    hostOrganization: '중소벤처기업진흥공단',
    applicationStartDate: addDays(-30),
    applicationEndDate: addDays(60),
    supportField: 'funding',
    targetRegion: '전국',
    eligibilityText: '창업 7년 이내 중소기업. 신용등급 B+ 이상. 최근 1년간 매출 발생 기업.',
    originalUrl: 'https://www.sbc.or.kr',
    fundingAmount: '최대 10억원 (연 2.5%)',
    selectionCount: 1000,
    requiredDocuments: [
      '융자신청서',
      '사업계획서',
      '재무제표',
      '신용평가서'
    ],
    createdAt: addDays(-45),
    updatedAt: addDays(-30),
    viewCount: 23456,
    daysUntilDeadline: 60,
    status: 'open',
    urgencyLevel: 'low',
    analysis: {
      eventId: 'POLICY-2024-007',
      requiredScores: CORE5_TEMPLATES.loan_guarantee,
      recommendedStages: ['A-3', 'A-4', 'A-5'],
      recommendedSectors: ['S-1', 'S-2', 'S-3', 'S-4', 'S-5'],
      parsedConditions: {
        maxYearsInBusiness: 7,
        minCreditRating: 'B+'
      },
      extractedKeywords: ['융자', '정책자금', '저금리', '운영자금'],
      preparationDifficulty: 'medium',
      estimatedPreparationDays: 10
    }
  },

  // 8. 바우처 사업
  {
    id: 'VOUCHER-2024-008',
    title: '2024 데이터바우처 지원사업 수요기업 모집',
    originalOrganization: '과학기술정보통신부',
    hostOrganization: '한국데이터산업진흥원',
    applicationStartDate: addDays(10),
    applicationEndDate: addDays(40),
    supportField: 'funding',
    targetRegion: '전국',
    eligibilityText: '중소기업 및 소상공인. 데이터 구매/가공 수요 보유 기업.',
    originalUrl: 'https://www.kdata.or.kr',
    fundingAmount: '최대 4천5백만원',
    selectionCount: 2000,
    requiredDocuments: [
      '신청서',
      '데이터 활용계획서',
      '사업자등록증'
    ],
    createdAt: addDays(-5),
    updatedAt: addDays(-2),
    viewCount: 9876,
    daysUntilDeadline: 40,
    status: 'upcoming',
    urgencyLevel: 'low',
    analysis: {
      eventId: 'VOUCHER-2024-008',
      requiredScores: CORE5_TEMPLATES.voucher,
      recommendedStages: ['A-2', 'A-3', 'A-4'],
      recommendedSectors: ['S-1'],
      parsedConditions: {},
      extractedKeywords: ['데이터', '바우처', 'AI', '빅데이터'],
      preparationDifficulty: 'easy',
      estimatedPreparationDays: 5
    }
  },

  // 9. 창업경진대회
  {
    id: 'CONTEST-2024-009',
    title: '2024 도전! K-스타트업 창업경진대회',
    originalOrganization: '중소벤처기업부',
    hostOrganization: '창업진흥원',
    applicationStartDate: addDays(-1),
    applicationEndDate: addDays(30),
    supportField: 'funding',
    targetRegion: '전국',
    eligibilityText: '예비창업자 및 3년 이내 창업기업. 혁신적인 아이디어 보유.',
    originalUrl: 'https://www.k-startup.go.kr',
    fundingAmount: '최대 1억원 (대상)',
    selectionCount: 100,
    requiredDocuments: [
      '참가신청서',
      '사업계획서',
      '발표자료'
    ],
    createdAt: addDays(-10),
    updatedAt: addDays(-1),
    viewCount: 34567,
    daysUntilDeadline: 30,
    status: 'open',
    urgencyLevel: 'medium',
    analysis: {
      eventId: 'CONTEST-2024-009',
      requiredScores: CORE5_TEMPLATES.contest,
      recommendedStages: ['A-1', 'A-2'],
      recommendedSectors: ['S-1', 'S-2', 'S-3', 'S-4', 'S-5'],
      parsedConditions: {
        maxYearsInBusiness: 3
      },
      extractedKeywords: ['경진대회', '아이디어', '창업경진대회'],
      preparationDifficulty: 'medium',
      estimatedPreparationDays: 14
    }
  },

  // 10. 마감 임박 긴급 공고
  {
    id: 'URGENT-2024-010',
    title: 'AI 스타트업 육성 프로그램 긴급 모집',
    originalOrganization: '과학기술정보통신부',
    hostOrganization: '정보통신산업진흥원',
    applicationStartDate: addDays(-10),
    applicationEndDate: addDays(3),
    supportField: 'rnd',
    targetRegion: '전국',
    eligibilityText: 'AI 분야 창업 5년 이내 기업. 특허 또는 SW 등록 보유 기업 우대.',
    originalUrl: 'https://www.nipa.kr',
    fundingAmount: '최대 3억원',
    selectionCount: 50,
    requiredDocuments: [
      '사업계획서',
      'AI 기술 소개서',
      '지재권 보유 현황'
    ],
    createdAt: addDays(-15),
    updatedAt: addDays(-10),
    viewCount: 8765,
    daysUntilDeadline: 3,
    status: 'closing',
    urgencyLevel: 'critical',
    analysis: {
      eventId: 'URGENT-2024-010',
      requiredScores: { GO: 65, EC: 60, PT: 85, PF: 70, TO: 70 },
      recommendedStages: ['A-2', 'A-3', 'A-4'],
      recommendedSectors: ['S-1'],
      parsedConditions: {
        maxYearsInBusiness: 5
      },
      extractedKeywords: ['AI', '인공지능', '기술개발', '긴급'],
      preparationDifficulty: 'hard',
      estimatedPreparationDays: 7
    }
  }
];

// 유틸리티 함수들
export const getEventsByStatus = (status: 'upcoming' | 'open' | 'closing' | 'closed') => {
  return EVENT_DATABASE.filter(event => event.status === status);
};

export const getEventsByDeadline = (days: number) => {
  return EVENT_DATABASE.filter(event =>
    event.daysUntilDeadline !== undefined && event.daysUntilDeadline <= days
  );
};

export const getEventsByRegion = (region: string) => {
  return EVENT_DATABASE.filter(event =>
    event.targetRegion === region || event.targetRegion === '전국'
  );
};

export const getEventsByField = (field: string) => {
  return EVENT_DATABASE.filter(event => event.supportField === field);
};

// 사용자 Core5 점수와 매칭
export const getMatchingEvents = (userScores: any, minMatchCount: number = 3) => {
  return EVENT_DATABASE.filter(event => {
    if (!event.analysis) return false;

    const required = event.analysis.requiredScores;
    let matchCount = 0;

    Object.keys(required).forEach(axis => {
      if (userScores[axis] >= required[axis as keyof typeof required]) {
        matchCount++;
      }
    });

    return matchCount >= minMatchCount;
  });
};

// 검색
export const searchEvents = (query: string) => {
  const lowerQuery = query.toLowerCase();
  return EVENT_DATABASE.filter(event =>
    event.title.toLowerCase().includes(lowerQuery) ||
    event.hostOrganization.toLowerCase().includes(lowerQuery) ||
    event.eligibilityText.toLowerCase().includes(lowerQuery) ||
    event.analysis?.extractedKeywords.some(k => k.toLowerCase().includes(lowerQuery))
  );
};