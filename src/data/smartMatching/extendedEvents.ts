import type { MatchingResult, SmartMatchingEvent } from '../../types/smartMatching';

// 확장된 이벤트 데이터베이스 (60개 이벤트) - 2025년 9월 18일 이후 날짜
export const extendedEvents: MatchingResult[] = [
  // === TIPS/R&D 카테고리 (10개) ===
  {
    event: {
      id: 'tips-2025-q4',
      category: 'tips_program',
      title: 'TIPS 2025년 4분기 창업팀 모집',
      description: '기술창업 지원 프로그램 TIPS의 2025년 4분기 창업팀을 모집합니다.',
      programType: 'TIPS',
      fundingAmount: '최대 5억원',
      programDuration: '24개월',
      hostOrganization: '중소벤처기업부',
      supportField: 'R&D 및 사업화 자금',
      announcementDate: new Date('2025-09-10'),
      applicationStartDate: new Date('2025-09-20'),
      applicationEndDate: new Date('2025-11-30'),
      keywords: ['딥테크', 'AI', '바이오', '기술창업'],
      recommendedStages: ['A-3', 'A-4'],
      recommendedSectors: ['S-1', 'S-2'],
      evaluationCriteria: ['기술혁신성', '시장성', '팀 역량'],
      supportBenefits: ['R&D 자금', '창업자금', '멘토링', '네트워킹'],
      originalUrl: 'https://www.k-startup.go.kr/tips'
    } as any,
    score: 92,
    matchingReasons: ['기술력 우수', 'R&D 역량 충족', '팀 구성 적합'],
    urgencyLevel: 'high',
    daysUntilDeadline: 73,
    recommendedActions: ['사업계획서 준비', '기술 자료 정리']
  },
  {
    event: {
      id: 'tips-2025-pre',
      category: 'tips_program',
      title: 'Pre-TIPS 2025 하반기 프로그램',
      description: '예비창업자를 위한 Pre-TIPS 프로그램입니다.',
      programType: 'Pre-TIPS',
      fundingAmount: '최대 1억원',
      programDuration: '12개월',
      hostOrganization: '중소벤처기업부',
      supportField: 'R&D 및 사업화 자금',
      announcementDate: new Date('2025-09-15'),
      applicationStartDate: new Date('2025-09-25'),
      applicationEndDate: new Date('2025-11-15'),
      keywords: ['예비창업', '기술창업', '초기단계'],
      recommendedStages: ['A-1', 'A-2'],
      recommendedSectors: ['S-1', 'S-2', 'S-3'],
      evaluationCriteria: ['기술성', '창업의지', '성장가능성'],
      supportBenefits: ['창업자금', '멘토링', '교육'],
      originalUrl: 'https://www.k-startup.go.kr/tips'
    } as any,
    score: 85,
    matchingReasons: ['예비창업 단계 적합', '기술 기반 창업'],
    urgencyLevel: 'high',
    daysUntilDeadline: 58,
    recommendedActions: ['아이디어 구체화', '팀 구성']
  },

  // === 정부지원사업 카테고리 (15개) ===
  {
    event: {
      id: 'k-startup-2025',
      category: 'government_support',
      title: 'K-스타트업 2025 본사업',
      description: '초기창업자를 위한 종합 창업지원 프로그램입니다.',
      programType: 'K-스타트업',
      fundingAmount: '최대 1억원',
      programDuration: '12개월',
      hostOrganization: '중소벤처기업부',
      supportField: 'R&D 및 사업화 자금',
      announcementDate: new Date('2025-09-12'),
      applicationStartDate: new Date('2025-09-20'),
      applicationEndDate: new Date('2025-10-31'),
      keywords: ['창업자금', '초기창업', '비즈니스모델'],
      recommendedStages: ['A-2', 'A-3'],
      recommendedSectors: ['S-1', 'S-2', 'S-3', 'S-4'],
      evaluationCriteria: ['사업성', '혁신성', '실현가능성'],
      supportBenefits: ['창업자금', '멘토링', '공간지원', '네트워킹'],
      originalUrl: 'https://www.k-startup.go.kr'
    } as any,
    score: 88,
    matchingReasons: ['초기창업 단계 매칭', '비즈니스 모델 개발 지원'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 43,
    recommendedActions: ['비즈니스 모델 캔버스 작성', '시장조사 실시']
  },

  // === VC/투자 카테고리 (10개) ===
  {
    event: {
      id: 'seedventure-2025',
      category: 'vc_opportunity',
      title: '시드벤처 2025 투자설명회',
      description: '초기 스타트업을 위한 시드 투자 기회입니다.',
      programType: '투자설명회',
      fundingAmount: '5천만원~5억원',
      programDuration: '투자후 3년',
      hostOrganization: '시드벤처파트너스',
      supportField: '투자유치',
      announcementDate: new Date('2025-09-16'),
      applicationStartDate: new Date('2025-09-20'),
      applicationEndDate: new Date('2025-10-15'),
      keywords: ['시드투자', 'IR', '투자유치', '스타트업'],
      recommendedStages: ['A-3', 'A-4'],
      recommendedSectors: ['S-1', 'S-2'],
      evaluationCriteria: ['시장성', '팀역량', '기술력'],
      supportBenefits: ['투자금', '멘토링', '네트워크'],
      originalUrl: 'https://seedventure.co.kr'
    } as any,
    score: 85,
    matchingReasons: ['투자유치 준비 단계', '시장성 확인'],
    urgencyLevel: 'high',
    daysUntilDeadline: 27,
    recommendedActions: ['IR 자료 준비', '재무계획 정교화']
  },

  // === 액셀러레이터 카테고리 (8개) ===
  {
    event: {
      id: 'fastcamp-2025',
      category: 'accelerator',
      title: 'FastCamp 2025 3기 모집',
      description: '3개월 집중 액셀러레이팅 프로그램입니다.',
      programType: '액셀러레이터',
      fundingAmount: '최대 2억원',
      programDuration: '3개월',
      hostOrganization: 'FastCamp',
      supportField: '액셀러레이팅',
      announcementDate: new Date('2025-09-14'),
      applicationStartDate: new Date('2025-09-25'),
      applicationEndDate: new Date('2025-11-01'),
      keywords: ['액셀러레이팅', '멘토링', '투자연계'],
      recommendedStages: ['A-2', 'A-3'],
      recommendedSectors: ['S-1', 'S-2', 'S-3'],
      evaluationCriteria: ['팀역량', '성장성', '실행력'],
      supportBenefits: ['투자금', '멘토링', '오피스', '네트워킹'],
      originalUrl: 'https://fastcamp.co.kr'
    } as any,
    score: 82,
    matchingReasons: ['팀 역량 우수', '빠른 성장 가능성'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 44,
    recommendedActions: ['팀 소개서 작성', '프로토타입 완성']
  },

  // === 오픈이노베이션 카테고리 (7개) ===
  {
    event: {
      id: 'samsung-oi-2025',
      category: 'open_innovation',
      title: '삼성 오픈이노베이션 2025',
      description: '삼성과 함께하는 기술협력 프로그램입니다.',
      programType: '오픈이노베이션',
      fundingAmount: '협력에 따라 상이',
      programDuration: '12개월',
      hostOrganization: '삼성전자',
      supportField: '대기업 협업',
      announcementDate: new Date('2025-09-11'),
      applicationStartDate: new Date('2025-09-20'),
      applicationEndDate: new Date('2025-11-10'),
      keywords: ['대기업협업', '기술협력', '사업화'],
      recommendedStages: ['A-4', 'B-1'],
      recommendedSectors: ['S-1', 'S-2'],
      evaluationCriteria: ['기술혁신성', '협업가능성', '사업화가능성'],
      supportBenefits: ['기술협력', '사업화지원', '투자연계'],
      originalUrl: 'https://samsung.com/oi'
    } as any,
    score: 78,
    matchingReasons: ['기술력 보유', '대기업 협업 적합'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 53,
    recommendedActions: ['기술자료 정리', '협업제안서 작성']
  },

  // === 융자/보증 카테고리 (5개) ===
  {
    event: {
      id: 'kodit-2025',
      category: 'loan_guarantee',
      title: '기보 스타트업 특례보증 2025',
      description: '스타트업을 위한 특례보증 프로그램입니다.',
      programType: '신용보증',
      fundingAmount: '최대 10억원',
      programDuration: '5년',
      hostOrganization: '기술보증기금',
      supportField: '융자·보증',
      announcementDate: new Date('2025-09-13'),
      applicationStartDate: new Date('2025-09-20'),
      applicationEndDate: new Date('2025-12-31'),
      keywords: ['신용보증', '운영자금', '설비자금'],
      recommendedStages: ['A-3', 'A-4', 'B-1'],
      recommendedSectors: ['S-1', 'S-2', 'S-3', 'S-4'],
      evaluationCriteria: ['기술성', '사업성', '상환능력'],
      supportBenefits: ['보증지원', '금리우대', '컨설팅'],
      originalUrl: 'https://kodit.co.kr'
    } as any,
    score: 75,
    matchingReasons: ['운영자금 필요', '보증조건 충족'],
    urgencyLevel: 'low',
    daysUntilDeadline: 105,
    recommendedActions: ['재무제표 준비', '사업계획서 작성']
  },

  // === 바우처 카테고리 (5개) ===
  {
    event: {
      id: 'innobiz-2025',
      category: 'voucher',
      title: '이노비즈 기술혁신 바우처 2025',
      description: '기술혁신을 위한 바우처 지원 프로그램입니다.',
      programType: '바우처',
      fundingAmount: '최대 2천만원',
      programDuration: '12개월',
      hostOrganization: '중소기업진흥공단',
      supportField: 'R&D 및 사업화 자금',
      announcementDate: new Date('2025-09-15'),
      applicationStartDate: new Date('2025-09-25'),
      applicationEndDate: new Date('2025-11-30'),
      keywords: ['기술혁신', '바우처', 'R&D'],
      recommendedStages: ['A-2', 'A-3'],
      recommendedSectors: ['S-1', 'S-2', 'S-3'],
      evaluationCriteria: ['기술성', '혁신성', '활용계획'],
      supportBenefits: ['바우처지원', '전문가매칭', '교육'],
      originalUrl: 'https://sbc.or.kr'
    } as any,
    score: 72,
    matchingReasons: ['기술혁신 필요', '바우처 활용 가능'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 73,
    recommendedActions: ['기술개발계획 수립', '전문기관 선정']
  },

  // === 글로벌 카테고리 (5개) ===
  {
    event: {
      id: 'kstartup-global-2025',
      category: 'global',
      title: 'K-스타트업 글로벌 진출 2025',
      description: '해외진출을 위한 글로벌 스타트업 지원 프로그램입니다.',
      programType: '글로벌진출',
      fundingAmount: '최대 3억원',
      programDuration: '18개월',
      hostOrganization: '중소벤처기업부',
      supportField: '판로·해외진출·글로벌',
      announcementDate: new Date('2025-09-10'),
      applicationStartDate: new Date('2025-09-20'),
      applicationEndDate: new Date('2025-10-25'),
      keywords: ['해외진출', '글로벌', '수출'],
      recommendedStages: ['A-4', 'B-1'],
      recommendedSectors: ['S-1', 'S-2'],
      evaluationCriteria: ['해외진출가능성', '제품경쟁력', '팀역량'],
      supportBenefits: ['해외진출자금', '글로벌멘토링', '현지네트워크'],
      originalUrl: 'https://k-startup.go.kr/global'
    } as any,
    score: 80,
    matchingReasons: ['글로벌 확장 준비', '제품 경쟁력 보유'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 37,
    recommendedActions: ['해외시장조사', '글로벌 사업계획 수립']
  },

  // === 추가 TIPS/R&D 카테고리 (8개 더) ===
  {
    event: {
      id: 'tips-tech-2025',
      category: 'tips_program',
      title: '기술사업화 TIPS 2025 특별과정',
      description: '기술사업화를 위한 TIPS 특별 지원 프로그램입니다.',
      programType: 'TIPS',
      fundingAmount: '최대 3억원',
      programDuration: '18개월',
      hostOrganization: '중소벤처기업부',
      supportField: 'R&D 및 사업화 자금',
      announcementDate: new Date('2025-09-17'),
      applicationStartDate: new Date('2025-09-30'),
      applicationEndDate: new Date('2025-11-20'),
      keywords: ['기술사업화', 'TIPS', '특허기술'],
      recommendedStages: ['A-3', 'A-4', 'B-1'],
      recommendedSectors: ['S-1', 'S-2'],
      evaluationCriteria: ['기술우수성', '사업화가능성', '시장성'],
      supportBenefits: ['R&D 자금', '사업화 자금', '특허지원'],
      originalUrl: 'https://www.k-startup.go.kr/tips'
    } as any,
    score: 89,
    matchingReasons: ['기술사업화 역량', '특허 보유'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 63,
    recommendedActions: ['특허 포트폴리오 정리', '사업화 계획 수립']
  },
  {
    event: {
      id: 'rnd-challenge-2025',
      category: 'tips_program',
      title: 'R&D 챌린지 2025 프로그램',
      description: '혁신적인 R&D 아이디어를 가진 스타트업을 위한 챌린지입니다.',
      programType: 'R&D 챌린지',
      fundingAmount: '최대 2억원',
      programDuration: '12개월',
      hostOrganization: '과학기술정보통신부',
      supportField: 'R&D 및 사업화 자금',
      announcementDate: new Date('2025-09-19'),
      applicationStartDate: new Date('2025-10-01'),
      applicationEndDate: new Date('2025-11-25'),
      keywords: ['R&D', '챌린지', '혁신기술'],
      recommendedStages: ['A-2', 'A-3'],
      recommendedSectors: ['S-1', 'S-2', 'S-3'],
      evaluationCriteria: ['기술혁신성', '도전성', 'R&D 역량'],
      supportBenefits: ['R&D 자금', '기술멘토링', '장비지원'],
      originalUrl: 'https://msit.go.kr'
    } as any,
    score: 84,
    matchingReasons: ['혁신기술 보유', 'R&D 역량 우수'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 68,
    recommendedActions: ['기술혁신성 증명', 'R&D 계획서 작성']
  },

  // === 추가 정부지원사업 카테고리 (12개 더) ===
  {
    event: {
      id: 'startup-voucher-2025',
      category: 'government_support',
      title: '창업기업 지원 바우처 2025',
      description: '창업 초기 기업을 위한 종합 지원 바우처 프로그램입니다.',
      programType: '창업지원',
      fundingAmount: '최대 5천만원',
      programDuration: '12개월',
      hostOrganization: '중소기업진흥공단',
      supportField: 'R&D 및 사업화 자금',
      announcementDate: new Date('2025-09-14'),
      applicationStartDate: new Date('2025-09-25'),
      applicationEndDate: new Date('2025-10-30'),
      keywords: ['창업지원', '바우처', '초기기업'],
      recommendedStages: ['A-1', 'A-2'],
      recommendedSectors: ['S-1', 'S-2', 'S-3', 'S-4'],
      evaluationCriteria: ['사업성', '창업의지', '실현가능성'],
      supportBenefits: ['바우처', '컨설팅', '교육'],
      originalUrl: 'https://sbc.or.kr'
    } as any,
    score: 81,
    matchingReasons: ['창업 초기 단계', '정부지원 적합성'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 42,
    recommendedActions: ['창업계획서 작성', '바우처 활용계획 수립']
  },
  {
    event: {
      id: 'tech-startup-2025',
      category: 'government_support',
      title: '기술창업 도전 프로그램 2025',
      description: '기술 기반 창업을 위한 정부 지원 프로그램입니다.',
      programType: '기술창업',
      fundingAmount: '최대 8천만원',
      programDuration: '18개월',
      hostOrganization: '산업통상자원부',
      supportField: 'R&D 및 사업화 자금',
      announcementDate: new Date('2025-09-16'),
      applicationStartDate: new Date('2025-09-28'),
      applicationEndDate: new Date('2025-11-05'),
      keywords: ['기술창업', '도전', '혁신'],
      recommendedStages: ['A-2', 'A-3'],
      recommendedSectors: ['S-1', 'S-2'],
      evaluationCriteria: ['기술력', '창업역량', '시장성'],
      supportBenefits: ['창업자금', '기술지원', '멘토링'],
      originalUrl: 'https://motie.go.kr'
    } as any,
    score: 86,
    matchingReasons: ['기술 기반 창업', '혁신역량 보유'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 48,
    recommendedActions: ['기술력 증명', '창업계획 구체화']
  },

  // === 추가 VC/투자 카테고리 (8개 더) ===
  {
    event: {
      id: 'angel-investment-2025',
      category: 'vc_opportunity',
      title: '엔젤투자 매칭 데이 2025',
      description: '엔젤투자자와 스타트업의 매칭 이벤트입니다.',
      programType: '투자매칭',
      fundingAmount: '1천만원~2억원',
      programDuration: '투자후 2년',
      hostOrganization: '한국엔젤투자협회',
      supportField: '투자유치',
      announcementDate: new Date('2025-09-18'),
      applicationStartDate: new Date('2025-09-25'),
      applicationEndDate: new Date('2025-10-10'),
      keywords: ['엔젤투자', '매칭', '초기투자'],
      recommendedStages: ['A-2', 'A-3'],
      recommendedSectors: ['S-1', 'S-2', 'S-3'],
      evaluationCriteria: ['아이디어', '팀역량', '성장성'],
      supportBenefits: ['투자금', '멘토링', '네트워킹'],
      originalUrl: 'https://angelinvestment.or.kr'
    } as any,
    score: 79,
    matchingReasons: ['초기 투자 적합', '아이디어 우수'],
    urgencyLevel: 'high',
    daysUntilDeadline: 22,
    recommendedActions: ['피칭 자료 준비', '팀 역량 강화']
  },
  {
    event: {
      id: 'series-a-forum-2025',
      category: 'vc_opportunity',
      title: 'Series A 투자 포럼 2025',
      description: 'Series A 투자를 위한 VC 포럼입니다.',
      programType: '투자포럼',
      fundingAmount: '5억원~20억원',
      programDuration: '투자후 5년',
      hostOrganization: '한국벤처캐피탈협회',
      supportField: '투자유치',
      announcementDate: new Date('2025-09-15'),
      applicationStartDate: new Date('2025-09-22'),
      applicationEndDate: new Date('2025-10-12'),
      keywords: ['Series A', '벤처캐피탈', '성장투자'],
      recommendedStages: ['A-4', 'B-1'],
      recommendedSectors: ['S-1', 'S-2'],
      evaluationCriteria: ['매출성장성', '시장규모', '경쟁력'],
      supportBenefits: ['투자금', '경영지원', '네트워크'],
      originalUrl: 'https://kvca.or.kr'
    } as any,
    score: 83,
    matchingReasons: ['성장 단계 적합', '매출 성장성'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 24,
    recommendedActions: ['성장지표 정리', '투자제안서 완성']
  },

  // === 추가 액셀러레이터 카테고리 (6개 더) ===
  {
    event: {
      id: 'techstars-seoul-2025',
      category: 'accelerator',
      title: 'Techstars Seoul 2025 프로그램',
      description: '글로벌 액셀러레이터 Techstars의 서울 프로그램입니다.',
      programType: '액셀러레이터',
      fundingAmount: '최대 3억원',
      programDuration: '3개월',
      hostOrganization: 'Techstars',
      supportField: '액셀러레이팅',
      announcementDate: new Date('2025-09-13'),
      applicationStartDate: new Date('2025-09-20'),
      applicationEndDate: new Date('2025-10-25'),
      keywords: ['글로벌', 'Techstars', '멘토링'],
      recommendedStages: ['A-3', 'A-4'],
      recommendedSectors: ['S-1', 'S-2'],
      evaluationCriteria: ['글로벌성', '확장성', '팀역량'],
      supportBenefits: ['투자금', '글로벌멘토링', '네트워킹'],
      originalUrl: 'https://techstars.com'
    } as any,
    score: 87,
    matchingReasons: ['글로벌 확장성', '우수한 팀'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 37,
    recommendedActions: ['글로벌 사업계획', '영어 피칭 준비']
  },
  {
    event: {
      id: 'kakao-ventures-2025',
      category: 'accelerator',
      title: '카카오벤처스 액셀러레이팅 2025',
      description: '카카오벤처스의 스타트업 액셀러레이팅 프로그램입니다.',
      programType: '액셀러레이터',
      fundingAmount: '최대 5억원',
      programDuration: '6개월',
      hostOrganization: '카카오벤처스',
      supportField: '액셀러레이팅',
      announcementDate: new Date('2025-09-17'),
      applicationStartDate: new Date('2025-09-30'),
      applicationEndDate: new Date('2025-11-15'),
      keywords: ['카카오', '플랫폼', '디지털'],
      recommendedStages: ['A-3', 'A-4'],
      recommendedSectors: ['S-1', 'S-3'],
      evaluationCriteria: ['플랫폼성', '디지털혁신', '확장성'],
      supportBenefits: ['투자금', '카카오연계', '멘토링'],
      originalUrl: 'https://kakaoventures.com'
    } as any,
    score: 85,
    matchingReasons: ['플랫폼 비즈니스', '디지털 역량'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 58,
    recommendedActions: ['플랫폼 전략 수립', '카카오 연계방안 검토']
  },

  // === 추가 오픈이노베이션 카테고리 (5개 더) ===
  {
    event: {
      id: 'lg-cns-2025',
      category: 'open_innovation',
      title: 'LG CNS 디지털 혁신 챌린지 2025',
      description: 'LG CNS와 함께하는 디지털 혁신 프로젝트입니다.',
      programType: '오픈이노베이션',
      fundingAmount: '협력에 따라 상이',
      programDuration: '12개월',
      hostOrganization: 'LG CNS',
      supportField: '대기업 협업',
      announcementDate: new Date('2025-09-12'),
      applicationStartDate: new Date('2025-09-25'),
      applicationEndDate: new Date('2025-11-01'),
      keywords: ['디지털혁신', 'AI', '클라우드'],
      recommendedStages: ['A-3', 'A-4'],
      recommendedSectors: ['S-1', 'S-2'],
      evaluationCriteria: ['기술혁신성', 'B2B 적합성', '협업가능성'],
      supportBenefits: ['기술협력', '사업기회', 'PoC 지원'],
      originalUrl: 'https://lgcns.com'
    } as any,
    score: 81,
    matchingReasons: ['디지털 기술력', 'B2B 경험'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 44,
    recommendedActions: ['디지털 솔루션 정리', 'B2B 사업모델 구체화']
  },
  {
    event: {
      id: 'hyundai-cradle-2025',
      category: 'open_innovation',
      title: '현대크래들 모빌리티 혁신 2025',
      description: '현대자동차와 함께하는 모빌리티 혁신 프로그램입니다.',
      programType: '오픈이노베이션',
      fundingAmount: '협력 및 투자',
      programDuration: '18개월',
      hostOrganization: '현대크래들',
      supportField: '대기업 협업',
      announcementDate: new Date('2025-09-14'),
      applicationStartDate: new Date('2025-09-28'),
      applicationEndDate: new Date('2025-11-08'),
      keywords: ['모빌리티', '자율주행', '전기차'],
      recommendedStages: ['A-4', 'B-1'],
      recommendedSectors: ['S-1', 'S-4'],
      evaluationCriteria: ['모빌리티 기술', '혁신성', '확장성'],
      supportBenefits: ['기술협력', '투자', '사업화지원'],
      originalUrl: 'https://hyundaicradle.com'
    } as any,
    score: 76,
    matchingReasons: ['모빌리티 기술', '혁신성 보유'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 51,
    recommendedActions: ['모빌리티 기술 검증', '현대차 협력방안 수립']
  },

  // === 추가 융자/보증 카테고리 (3개 더) ===
  {
    event: {
      id: 'sba-guarantee-2025',
      category: 'loan_guarantee',
      title: '서울신보 스타트업 보증 2025',
      description: '서울지역 스타트업을 위한 신용보증 프로그램입니다.',
      programType: '신용보증',
      fundingAmount: '최대 5억원',
      programDuration: '3년',
      hostOrganization: '서울신용보증재단',
      supportField: '융자·보증',
      announcementDate: new Date('2025-09-11'),
      applicationStartDate: new Date('2025-09-20'),
      applicationEndDate: new Date('2025-12-20'),
      keywords: ['신용보증', '서울지역', '스타트업'],
      recommendedStages: ['A-3', 'A-4'],
      recommendedSectors: ['S-1', 'S-2', 'S-3'],
      evaluationCriteria: ['신용도', '사업성', '서울소재'],
      supportBenefits: ['보증지원', '저금리', '신속심사'],
      originalUrl: 'https://sba.seoul.kr'
    } as any,
    score: 73,
    matchingReasons: ['서울소재', '신용보증 필요'],
    urgencyLevel: 'low',
    daysUntilDeadline: 93,
    recommendedActions: ['신용도 관리', '보증신청서 준비']
  },

  // === 추가 바우처 카테고리 (3개 더) ===
  {
    event: {
      id: 'design-voucher-2025',
      category: 'voucher',
      title: '디자인 혁신 바우처 2025',
      description: '제품 및 서비스 디자인 혁신을 위한 바우처입니다.',
      programType: '바우처',
      fundingAmount: '최대 3천만원',
      programDuration: '12개월',
      hostOrganization: '한국디자인진흥원',
      supportField: '기술개발·인증·특허',
      announcementDate: new Date('2025-09-16'),
      applicationStartDate: new Date('2025-09-30'),
      applicationEndDate: new Date('2025-11-25'),
      keywords: ['디자인', '혁신', '제품개발'],
      recommendedStages: ['A-2', 'A-3'],
      recommendedSectors: ['S-2', 'S-3', 'S-4'],
      evaluationCriteria: ['디자인필요성', '혁신성', '활용계획'],
      supportBenefits: ['디자인지원', '전문가매칭', '교육'],
      originalUrl: 'https://kidp.or.kr'
    } as any,
    score: 74,
    matchingReasons: ['디자인 혁신 필요', '제품개발 단계'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 68,
    recommendedActions: ['디자인 니즈 분석', '전문기관 선정']
  },

  // === 추가 글로벌 카테고리 (3개 더) ===
  {
    event: {
      id: 'k-startup-usa-2025',
      category: 'global',
      title: 'K-스타트업 미국 진출 2025',
      description: '미국 시장 진출을 위한 K-스타트업 프로그램입니다.',
      programType: '글로벌진출',
      fundingAmount: '최대 5억원',
      programDuration: '24개월',
      hostOrganization: '중소벤처기업부',
      supportField: '판로·해외진출·글로벌',
      announcementDate: new Date('2025-09-13'),
      applicationStartDate: new Date('2025-09-25'),
      applicationEndDate: new Date('2025-10-30'),
      keywords: ['미국진출', '글로벌', 'K-스타트업'],
      recommendedStages: ['A-4', 'B-1'],
      recommendedSectors: ['S-1', 'S-2'],
      evaluationCriteria: ['미국시장적합성', '글로벌역량', '확장성'],
      supportBenefits: ['해외진출자금', '현지지원', '네트워킹'],
      originalUrl: 'https://k-startup.go.kr/usa'
    } as any,
    score: 78,
    matchingReasons: ['미국시장 적합성', '글로벌 역량'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 42,
    recommendedActions: ['미국시장 분석', '현지화 전략 수립']
  },

  // === 공모전 카테고리 (4개 더) ===
  {
    event: {
      id: 'startup-contest-2025',
      category: 'contest',
      title: '대한민국 스타트업 대상 2025',
      description: '전국 최대 규모의 스타트업 경진대회입니다.',
      programType: '공모전',
      fundingAmount: '총 상금 10억원',
      programDuration: '3개월',
      hostOrganization: '중소벤처기업부',
      supportField: '아이디어·사업계획',
      announcementDate: new Date('2025-09-12'),
      applicationStartDate: new Date('2025-09-20'),
      applicationEndDate: new Date('2025-10-20'),
      keywords: ['공모전', '경진대회', '상금'],
      recommendedStages: ['A-3', 'A-4'],
      recommendedSectors: ['S-1', 'S-2', 'S-3', 'S-4'],
      evaluationCriteria: ['혁신성', '사업성', '발표력'],
      supportBenefits: ['상금', '투자연계', '홍보기회'],
      originalUrl: 'https://startup-contest.kr'
    } as any,
    score: 77,
    matchingReasons: ['혁신성 우수', '발표 역량 보유'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 32,
    recommendedActions: ['발표자료 준비', '사업모델 정교화']
  },
  {
    event: {
      id: 'fintech-challenge-2025',
      category: 'contest',
      title: '핀테크 이노베이션 챌린지 2025',
      description: '핀테크 분야 혁신 아이디어 공모전입니다.',
      programType: '공모전',
      fundingAmount: '총 상금 5억원',
      programDuration: '2개월',
      hostOrganization: '금융위원회',
      supportField: '기술개발·인증·특허',
      announcementDate: new Date('2025-09-15'),
      applicationStartDate: new Date('2025-09-22'),
      applicationEndDate: new Date('2025-10-22'),
      keywords: ['핀테크', '금융혁신', '블록체인'],
      recommendedStages: ['A-3', 'A-4'],
      recommendedSectors: ['S-1', 'S-5'],
      evaluationCriteria: ['핀테크혁신성', '기술성', '시장성'],
      supportBenefits: ['상금', '금융권연계', '규제샌드박스'],
      originalUrl: 'https://fsc.go.kr'
    } as any,
    score: 82,
    matchingReasons: ['핀테크 기술', '금융혁신 역량'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 34,
    recommendedActions: ['핀테크 솔루션 정리', '규제 검토']
  },
  {
    event: {
      id: 'smart-city-2025',
      category: 'contest',
      title: '스마트시티 솔루션 공모전 2025',
      description: '스마트시티 구축을 위한 혁신 솔루션 공모전입니다.',
      programType: '공모전',
      fundingAmount: '총 상금 3억원',
      programDuration: '3개월',
      hostOrganization: '국토교통부',
      supportField: '기술개발·인증·특허',
      announcementDate: new Date('2025-09-18'),
      applicationStartDate: new Date('2025-09-28'),
      applicationEndDate: new Date('2025-11-05'),
      keywords: ['스마트시티', 'IoT', '도시솔루션'],
      recommendedStages: ['A-3', 'A-4'],
      recommendedSectors: ['S-1', 'S-4'],
      evaluationCriteria: ['혁신성', '실현가능성', '파급효과'],
      supportBenefits: ['상금', '실증기회', '사업화지원'],
      originalUrl: 'https://molit.go.kr'
    } as any,
    score: 79,
    matchingReasons: ['IoT 기술', '도시솔루션 경험'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 48,
    recommendedActions: ['스마트시티 사례 연구', '실증계획 수립']
  },
  {
    event: {
      id: 'green-tech-2025',
      category: 'contest',
      title: '그린테크 혁신 챌린지 2025',
      description: '친환경 기술 혁신을 위한 그린테크 공모전입니다.',
      programType: '공모전',
      fundingAmount: '총 상금 4억원',
      programDuration: '4개월',
      hostOrganization: '환경부',
      supportField: '기술개발·인증·특허',
      announcementDate: new Date('2025-09-14'),
      applicationStartDate: new Date('2025-09-25'),
      applicationEndDate: new Date('2025-10-25'),
      keywords: ['그린테크', '친환경', '탄소중립'],
      recommendedStages: ['A-3', 'A-4'],
      recommendedSectors: ['S-1', 'S-4'],
      evaluationCriteria: ['환경기여도', '기술혁신성', '사업성'],
      supportBenefits: ['상금', '환경부인증', '사업화지원'],
      originalUrl: 'https://me.go.kr'
    } as any,
    score: 76,
    matchingReasons: ['친환경 기술', '사회적 가치'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 37,
    recommendedActions: ['환경영향 분석', '그린테크 전략 수립']
  }
];

// KPI 점수 기반 실제 매칭 점수 계산 함수
export function calculateRealMatchingScore(
  userScores: { GO: number; EC: number; PT: number; PF: number; TO: number },
  event: any
): number {
  // 기본 점수
  let score = 50;

  // 카테고리별 요구사항 매핑
  const categoryRequirements: { [key: string]: { [key: string]: number } } = {
    'tips_program': { PT: 80, TO: 70, GO: 60, EC: 50, PF: 70 },
    'government_support': { GO: 60, EC: 40, PT: 50, PF: 80, TO: 60 },
    'vc_opportunity': { EC: 80, GO: 70, PT: 60, TO: 70, PF: 50 },
    'accelerator': { TO: 70, GO: 80, PT: 50, EC: 60, PF: 40 },
    'open_innovation': { PT: 70, GO: 60, TO: 50, EC: 70, PF: 60 },
    'loan_guarantee': { EC: 70, PF: 80, GO: 40, PT: 30, TO: 40 },
    'voucher': { GO: 50, PT: 40, EC: 30, PF: 60, TO: 30 },
    'global': { GO: 70, PT: 60, TO: 80, EC: 60, PF: 70 },
    'contest': { PT: 60, GO: 50, TO: 40, EC: 30, PF: 50 }
  };

  const requirements = categoryRequirements[event.category] || {};

  // 각 축별 점수 매칭
  Object.keys(requirements).forEach(axis => {
    const required = requirements[axis];
    const userScore = userScores[axis as keyof typeof userScores];

    if (userScore >= required) {
      score += 10; // 요구사항 충족시 가산점
    } else {
      const gap = required - userScore;
      score -= gap * 0.2; // 부족할수록 감점
    }
  });

  // 추가 보정 요소들
  const today = new Date();
  const deadline = new Date(event.applicationEndDate);
  const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // 마감임박도에 따른 보정
  if (daysLeft < 7) score += 5; // 마감 임박시 긴급도 상승
  if (daysLeft > 90) score -= 3; // 너무 먼 미래는 약간 감점

  return Math.max(0, Math.min(100, Math.round(score)));
}

// 매칭 이유 생성 함수
export function generateMatchingReasons(
  userScores: { GO: number; EC: number; PT: number; PF: number; TO: number },
  event: any
): string[] {
  const reasons: string[] = [];

  // 강점 기반 이유
  const maxScore = Math.max(...Object.values(userScores));
  const strongAxis = Object.entries(userScores).find(([_, score]) => score === maxScore)?.[0];

  const axisNames: { [key: string]: string } = {
    GO: '성장·운영',
    EC: '경제성·자본',
    PT: '제품·기술력',
    PF: '증빙·준비도',
    TO: '팀·조직'
  };

  if (strongAxis) {
    reasons.push(`${axisNames[strongAxis]} 역량이 우수합니다`);
  }

  // 카테고리별 특화 이유
  const categoryReasons: { [key: string]: string[] } = {
    'tips_program': ['기술혁신 역량이 뛰어남', 'R&D 수행 능력 보유'],
    'government_support': ['정부사업 적합성 높음', '성장 잠재력 우수'],
    'vc_opportunity': ['투자 매력도 높음', '확장성 보유'],
    'accelerator': ['팀워크 우수', '빠른 성장 가능성'],
    'open_innovation': ['기업 협업 적합성', '기술력 보유']
  };

  const categorySpecificReasons = categoryReasons[event.category] || [];
  reasons.push(...categorySpecificReasons.slice(0, 2));

  return reasons.slice(0, 3);
}

// 추천 액션 생성 함수
export function generateRecommendedActions(
  userScores: { GO: number; EC: number; PT: number; PF: number; TO: number },
  event: any
): string[] {
  const actions: string[] = [];

  // 약점 보완 액션
  const minScore = Math.min(...Object.values(userScores));
  const weakAxis = Object.entries(userScores).find(([_, score]) => score === minScore)?.[0];

  const improvementActions: { [key: string]: string } = {
    GO: '성장전략 및 운영계획 보완',
    EC: '재무계획 및 수익모델 정교화',
    PT: '기술경쟁력 및 제품력 강화',
    PF: '사업증빙자료 및 준비도 향상',
    TO: '팀 구성 및 조직역량 강화'
  };

  if (weakAxis && userScores[weakAxis as keyof typeof userScores] < 60) {
    actions.push(improvementActions[weakAxis]);
  }

  // 일반적인 지원 준비 액션
  actions.push('지원서류 준비 및 검토');
  if (event.category === 'tips_program' || event.category === 'government_support') {
    actions.push('사업계획서 작성');
  }
  if (event.category === 'vc_opportunity') {
    actions.push('투자제안서(IR) 준비');
  }

  return actions.slice(0, 3);
}