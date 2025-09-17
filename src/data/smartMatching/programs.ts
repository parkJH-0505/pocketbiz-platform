import type { Program, ProgramCategory } from '../../types/smartMatching';

// Mock 프로그램 데이터 (10개)
export const mockPrograms: Program[] = [
  {
    id: 'prog-001',
    title: 'K-스타트업 센터 글로벌 진출 프로그램',
    organization: '창업진흥원',
    category: 'government',
    supportAmount: '최대 1억원',
    deadline: '2024-02-15',
    difficulty: 'hard',
    applicationStatus: 'open',
    requiredScores: {
      GO: 85,  // 높은 성장 잠재력 요구
      EC: 78,
      PT: 80,
      PF: 75,
      TO: 82
    },
    description: '글로벌 시장 진출을 목표로 하는 스타트업 지원',
    benefits: ['해외 법인 설립 지원', '현지 마케팅 비용', '글로벌 멘토링'],
    requirements: ['3년 이상 업력', '연매출 10억 이상', '수출 실적 보유'],
    matchingScore: 0
  },
  {
    id: 'prog-002',
    title: 'TIPS 프로그램',
    organization: '중소벤처기업부',
    category: 'government',
    supportAmount: '최대 5억원',
    deadline: '2024-02-28',
    difficulty: 'hard',
    applicationStatus: 'open',
    requiredScores: {
      GO: 82,
      EC: 80,
      PT: 85,  // 높은 기술력 요구
      PF: 70,
      TO: 78
    },
    description: '기술 혁신형 창업기업 집중 육성',
    benefits: ['R&D 자금', '사업화 자금', '엔젤 투자 매칭'],
    requirements: ['7년 이내 창업기업', '기술 특허 보유', '운영사 추천'],
    matchingScore: 0
  },
  {
    id: 'prog-003',
    title: '예비창업패키지',
    organization: '창업진흥원',
    category: 'government',
    supportAmount: '최대 1억원',
    deadline: '2024-03-10',
    difficulty: 'medium',
    applicationStatus: 'open',
    requiredScores: {
      GO: 70,
      EC: 65,
      PT: 68,
      PF: 60,
      TO: 65
    },
    description: '예비창업자 및 초기 창업기업 지원',
    benefits: ['사업화 자금', '멘토링', '사무 공간'],
    requirements: ['3년 이내 창업', '만 39세 이하', '사업계획서'],
    matchingScore: 0
  },
  {
    id: 'prog-004',
    title: '소셜벤처 육성사업',
    organization: '한국사회적기업진흥원',
    category: 'government',
    supportAmount: '최대 7천만원',
    deadline: '2024-02-20',
    difficulty: 'medium',
    applicationStatus: 'open',
    requiredScores: {
      GO: 72,
      EC: 68,
      PT: 65,
      PF: 70,  // 플랫폼 활용 중요
      TO: 75
    },
    description: '사회 문제 해결형 스타트업 지원',
    benefits: ['사업 개발비', '소셜 임팩트 측정', '네트워킹'],
    requirements: ['소셜미션 보유', '사회적 가치 창출', '지속가능 모델'],
    matchingScore: 0
  },
  {
    id: 'prog-005',
    title: '신한 스퀘어브릿지',
    organization: '신한은행',
    category: 'accelerator',
    supportAmount: '최대 5천만원',
    deadline: '2024-03-05',
    difficulty: 'medium',
    applicationStatus: 'open',
    requiredScores: {
      GO: 75,
      EC: 72,
      PT: 70,
      PF: 68,
      TO: 70
    },
    description: '핀테크 및 혁신 스타트업 액셀러레이팅',
    benefits: ['시드 투자', '신한 네트워크', 'AWS 크레딧'],
    requirements: ['5년 이내 창업', 'MVP 보유', '핀테크 관련성'],
    matchingScore: 0
  },
  {
    id: 'prog-006',
    title: 'Series A 라운드',
    organization: '카카오벤처스',
    category: 'investment',
    supportAmount: '20-50억원',
    deadline: '2024-02-25',
    difficulty: 'hard',
    applicationStatus: 'preparation',
    requiredScores: {
      GO: 88,  // 매우 높은 성장성 요구
      EC: 85,
      PT: 82,
      PF: 80,
      TO: 83
    },
    description: 'Series A 투자 유치',
    benefits: ['대규모 투자금', '카카오 생태계 연계', '글로벌 확장'],
    requirements: ['월 매출 1억 이상', 'PMF 달성', '명확한 BM'],
    matchingScore: 0
  },
  {
    id: 'prog-007',
    title: 'D.CAMP 디데이',
    organization: '은행권청년창업재단',
    category: 'competition',
    supportAmount: '최대 3천만원',
    deadline: '2024-03-15',
    difficulty: 'easy',
    applicationStatus: 'open',
    requiredScores: {
      GO: 65,
      EC: 60,
      PT: 62,
      PF: 58,
      TO: 60
    },
    description: '스타트업 피칭 경진대회',
    benefits: ['상금', '투자 연계', '미디어 노출'],
    requirements: ['7년 이내 창업', '피칭덱', 'IR 준비'],
    matchingScore: 0
  },
  {
    id: 'prog-008',
    title: '청년창업사관학교',
    organization: '중소벤처기업부',
    category: 'government',
    supportAmount: '최대 1억원',
    deadline: '2024-02-18',
    difficulty: 'medium',
    applicationStatus: 'open',
    requiredScores: {
      GO: 73,
      EC: 70,
      PT: 72,
      PF: 65,
      TO: 68
    },
    description: '청년 창업자 집중 육성 프로그램',
    benefits: ['사업화 자금', '1:1 코칭', '판로 개척'],
    requirements: ['만 39세 이하', '제조업/지식서비스업', '전담 근무'],
    matchingScore: 0
  },
  {
    id: 'prog-009',
    title: 'Pre-A 브릿지 투자',
    organization: '매쉬업엔젤스',
    category: 'investment',
    supportAmount: '5-10억원',
    deadline: '2024-03-20',
    difficulty: 'medium',
    applicationStatus: 'preparation',
    requiredScores: {
      GO: 78,
      EC: 75,
      PT: 73,
      PF: 72,
      TO: 74
    },
    description: 'Pre-A 단계 브릿지 투자',
    benefits: ['브릿지 자금', '후속 투자 연계', '성장 전략 수립'],
    requirements: ['Seed 투자 유치 경험', '월 성장률 10% 이상', 'CAC/LTV 지표'],
    matchingScore: 0
  },
  {
    id: 'prog-010',
    title: 'AI 스타트업 지원사업',
    organization: '과학기술정보통신부',
    category: 'government',
    supportAmount: '최대 3억원',
    deadline: '2024-03-01',
    difficulty: 'hard',
    applicationStatus: 'open',
    requiredScores: {
      GO: 80,
      EC: 77,
      PT: 88,  // 매우 높은 기술력 요구
      PF: 75,
      TO: 76
    },
    description: 'AI 기반 혁신 서비스 개발 지원',
    benefits: ['R&D 자금', 'GPU 서버 지원', 'AI 전문가 멘토링'],
    requirements: ['AI 관련 특허/논문', '딥러닝 모델 보유', '기술 인력 50% 이상'],
    matchingScore: 0
  }
];

// 카테고리별 필터링
export const filterProgramsByCategory = (
  programs: Program[],
  category: ProgramCategory
): Program[] => {
  return programs.filter(p => p.category === category);
};

// 마감일순 정렬
export const sortProgramsByDeadline = (programs: Program[]): Program[] => {
  return [...programs].sort((a, b) => {
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });
};