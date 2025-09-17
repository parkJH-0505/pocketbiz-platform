import type {
  MatchingResult,
  TipsProgramEvent,
  VCOpportunityEvent,
  GovernmentSupportEvent,
  Core5Requirements
} from '../../types/smartMatching';

// Mock 사용자 Core5 점수 (KPI Context에서 가져올 예정)
export const mockUserScores: Core5Requirements = {
  GO: 75,
  EC: 61,
  PT: 27,
  PF: 78,
  TO: 68
};

import { comprehensiveEvents } from './comprehensiveEvents';

// Mock 이벤트 데이터 - 상위 5개만 기본 추천으로 사용
export const mockRecommendations: MatchingResult[] = comprehensiveEvents.slice(0, 5);

// 전체 이벤트 데이터 (AllOpportunities용)
export const allMockEvents: MatchingResult[] = comprehensiveEvents;

// 기존 코드 호환성을 위한 레거시 데이터
const legacyMockRecommendations: MatchingResult[] = [
  {
    event: {
      id: 'tips-2024-spring',
      category: 'tips_program',
      title: 'TIPS 2024 상반기',
      description: 'AI/IoT 분야 스타트업 지원 프로그램',
      programType: 'TIPS',
      fundingAmount: '최대 5억원',
      programDuration: '12개월',
      hostOrganization: '중소벤처기업부',
      announcementDate: new Date('2024-01-15'),
      applicationStartDate: new Date('2024-02-01'),
      applicationEndDate: new Date('2024-02-28'),
      keywords: ['AI', 'IoT', 'SaaS', '기술혁신'],
      recommendedStages: ['A-4', 'A-5'],
      recommendedSectors: ['S-1', 'S-2'],
      requirementLevel: 'Pre-A 단계',
      evaluationCriteria: ['기술력', '시장성', '팀 역량'],
      supportBenefits: ['R&D 자금', '멘토링', '네트워킹'],
      supportField: 'R&D 및 사업화 자금',
      originalUrl: 'https://www.k-startup.go.kr/tips'
    } as TipsProgramEvent,
    score: 92,
    matchingReasons: ['기술혁신성 우수', 'R&D 역량 충족', '팀 구성 적합'],
    urgencyLevel: 'high',
    daysUntilDeadline: 14,
    recommendedActions: ['사업계획서 업데이트', '재무모델링 준비', '기술 검증 자료 준비']
  },
  {
    event: {
      id: 'vc-demo-2024',
      category: 'vc_opportunity',
      title: 'TechStars Demo Day 2024',
      description: 'Series A 준비 스타트업 대상 투자 유치 기회',
      vcName: 'TechStars Ventures',
      investmentStage: 'Series A',
      investmentAmount: '30-100억원',
      announcementDate: new Date('2024-01-20'),
      applicationStartDate: new Date('2024-02-05'),
      applicationEndDate: new Date('2024-03-05'),
      keywords: ['Series A', 'SaaS', 'B2B', '투자유치'],
      recommendedStages: ['A-4', 'A-5'],
      recommendedSectors: ['S-1'],
      focusAreas: ['Enterprise SaaS', 'AI/ML', 'FinTech'],
      presentationFormat: '10분 피치 + 5분 Q&A',
      selectionProcess: ['서류심사', '1차 피치', '최종 프레젠테이션'],
      supportField: '멘토링·컨설팅·교육',
      originalUrl: 'https://techstars.com'
    } as VCOpportunityEvent,
    score: 87,
    matchingReasons: ['성장성 지표 우수', 'SaaS 분야 적합', '투자 규모 매칭'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 35,
    recommendedActions: ['피치덱 준비', '재무 데이터 정리', '고객 레퍼런스 확보']
  },
  {
    event: {
      id: 'gov-support-2024',
      category: 'government_support',
      title: '창업성장기술개발사업',
      description: '기술혁신형 창업기업 R&D 지원',
      supportContent: 'R&D 자금 및 사업화 지원',
      supportAmount: '최대 3억원',
      executionPeriod: '24개월',
      hostOrganization: '중소기업기술정보진흥원',
      governmentDepartment: '중소벤처기업부',
      selectionCount: 200,
      applicationConditions: ['창업 7년 이내', '기술 특허 보유'],
      supportField: 'R&D 및 사업화 자금',
      announcementDate: new Date('2024-01-25'),
      applicationStartDate: new Date('2024-02-10'),
      applicationEndDate: new Date('2024-03-10'),
      keywords: ['R&D', '기술개발', '정부지원'],
      recommendedStages: ['A-3', 'A-4'],
      recommendedSectors: ['S-1', 'S-2'],
      originalUrl: 'https://www.smtech.go.kr'
    } as GovernmentSupportEvent,
    score: 65,
    matchingReasons: ['서류 준비도 부족', '재무 증빙 미흡'],
    urgencyLevel: 'low',
    daysUntilDeadline: 40,
    recommendedActions: ['재무제표 준비', '사업계획서 보완', '증빙자료 확보']
  }
];

// 추가 mock 이벤트 - 전체 데이터에서 이미 포함됨
export const additionalMockEvents: MatchingResult[] = comprehensiveEvents.slice(5);

// 기존 코드 호환성을 위한 레거시 데이터
const legacyAdditionalMockEvents: MatchingResult[] = [
  {
    event: {
      id: 'accel-2024-spring',
      category: 'accelerator',
      title: 'SparkLabs 2024 Spring Batch',
      description: '글로벌 진출을 목표로 하는 스타트업 액셀러레이팅',
      acceleratorName: 'SparkLabs',
      programDuration: '3개월',
      cohortSize: 15,
      equity: '5-7%',
      mentorship: ['글로벌 진출', '제품 전략', '투자 유치'],
      demoDay: true,
      fundingAmount: '3천만원',
      supportField: '멘토링·컨설팅·교육',
      announcementDate: new Date('2024-01-10'),
      applicationStartDate: new Date('2024-02-01'),
      applicationEndDate: new Date('2024-02-20'),
      keywords: ['액셀러레이팅', '글로벌', '멘토링'],
      recommendedStages: ['A-2', 'A-3'],
      recommendedSectors: ['S-1', 'S-2', 'S-3'],
    } as any,
    score: 78,
    matchingReasons: ['팀 역량 적합', '글로벌 지향성 매칭'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 25,
    recommendedActions: ['팀 소개 자료 준비', '제품 데모 준비']
  },
  {
    event: {
      id: 'open-innov-2024',
      category: 'open_innovation',
      title: '삼성전자 C-Lab Outside',
      description: '삼성전자와 협업 가능한 스타트업 모집',
      demandOrganization: '삼성전자',
      recruitmentField: 'AI/IoT 솔루션',
      collaborationContent: '공동 R&D 및 사업화',
      collaborationPeriod: '6개월',
      selectionCount: 10,
      applicationConditions: ['기술 검증 완료', 'MVP 보유'],
      supportField: '판로·해외진출·글로벌',
      announcementDate: new Date('2024-01-18'),
      applicationStartDate: new Date('2024-02-05'),
      applicationEndDate: new Date('2024-02-25'),
      keywords: ['오픈이노베이션', '대기업 협업', 'AI', 'IoT'],
      recommendedStages: ['A-3', 'A-4', 'A-5'],
      recommendedSectors: ['S-1', 'S-2'],
    } as any,
    score: 71,
    matchingReasons: ['기술 호환성 양호', '협업 역량 준비 필요'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 30,
    recommendedActions: ['기술 스펙 문서화', '협업 제안서 작성']
  }
];