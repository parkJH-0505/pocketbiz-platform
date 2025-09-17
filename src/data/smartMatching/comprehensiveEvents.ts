import type { MatchingResult, SmartMatchingEvent } from '../../types/smartMatching';

// 종합 이벤트 데이터 (20개)
export const comprehensiveEvents: MatchingResult[] = [
  // 1. TIPS 프로그램
  {
    event: {
      id: 'tips-2024-q1',
      category: 'tips_program',
      title: 'TIPS 2024년 1분기 창업팀 모집',
      description: '기술창업 지원 프로그램 TIPS의 2024년 1분기 창업팀을 모집합니다. 최대 5억원의 R&D 자금과 멘토링을 지원합니다.',
      programType: 'TIPS',
      fundingAmount: '최대 5억원',
      programDuration: '24개월',
      hostOrganization: '중소벤처기업부',
      supportField: 'R&D 및 사업화 자금',
      announcementDate: new Date('2024-01-15'),
      applicationStartDate: new Date('2024-02-01'),
      applicationEndDate: new Date('2024-02-28'),
      keywords: ['딥테크', 'AI', '바이오', '기술창업'],
      recommendedStages: ['A-3', 'A-4'],
      recommendedSectors: ['S-1', 'S-2'],
      evaluationCriteria: ['기술혁신성', '시장성', '팀 역량'],
      supportBenefits: ['R&D 자금', '창업자금', '멘토링', '네트워킹'],
      originalUrl: 'https://www.k-startup.go.kr/tips'
    } as any,
    score: 88,
    matchingReasons: ['기술력 우수', 'R&D 역량 충족'],
    urgencyLevel: 'high',
    daysUntilDeadline: 12,
    recommendedActions: ['사업계획서 준비', '기술 자료 정리']
  },

  // 2. 정부지원사업
  {
    event: {
      id: 'gov-tech-2024',
      category: 'government_support',
      title: '2024 기술혁신형 창업기업 지원사업',
      description: '기술 기반 스타트업의 R&D와 사업화를 지원하는 정부 프로그램입니다. 최대 3억원의 자금을 지원합니다.',
      supportContent: 'R&D 자금 및 사업화 컨설팅',
      supportAmount: '최대 3억원',
      executionPeriod: '18개월',
      hostOrganization: '과학기술정보통신부',
      governmentDepartment: '과학기술정보통신부',
      supportField: 'R&D 및 사업화 자금',
      selectionCount: 150,
      applicationConditions: ['창업 7년 이내', '기술 특허 보유'],
      announcementDate: new Date('2024-01-20'),
      applicationStartDate: new Date('2024-02-05'),
      applicationEndDate: new Date('2024-03-05'),
      keywords: ['R&D', '기술개발', '사업화', 'ICT'],
      recommendedStages: ['A-2', 'A-3', 'A-4'],
      recommendedSectors: ['S-1', 'S-2'],
      originalUrl: 'https://www.k-startup.go.kr'
    } as any,
    score: 75,
    matchingReasons: ['기술 요건 충족', '창업 기간 적합'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 30,
    recommendedActions: ['재무제표 준비', '사업계획서 작성']
  },

  // 3. VC 투자 프로그램
  {
    event: {
      id: 'kakao-ventures-2024',
      category: 'vc_opportunity',
      title: '카카오벤처스 2024 Spring Demo Day',
      description: 'Series A 투자 유치를 준비하는 스타트업을 위한 데모데이입니다. 30-50억원 규모의 투자 기회를 제공합니다.',
      vcName: '카카오벤처스',
      investmentStage: 'Series A',
      investmentAmount: '30-50억원',
      supportField: '멘토링·컨설팅·교육',
      focusAreas: ['AI/ML', 'FinTech', 'Commerce', 'Content'],
      presentationFormat: '10분 피치 + 10분 Q&A',
      selectionProcess: ['서류심사', '대면 미팅', 'Demo Day'],
      announcementDate: new Date('2024-01-25'),
      applicationStartDate: new Date('2024-02-10'),
      applicationEndDate: new Date('2024-03-10'),
      keywords: ['Series A', '투자유치', 'Scale-up'],
      recommendedStages: ['A-4', 'A-5'],
      recommendedSectors: ['S-1', 'S-3'],
      originalUrl: 'https://www.kakaoventures.com'
    } as any,
    score: 82,
    matchingReasons: ['성장 지표 우수', '투자 단계 적합'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 35,
    recommendedActions: ['IR덱 업데이트', '재무 모델링']
  },

  // 4. 액셀러레이터
  {
    event: {
      id: 'primer-batch-2024',
      category: 'accelerator',
      title: 'Primer 19기 스타트업 모집',
      description: '국내 최고의 액셀러레이터 프라이머의 19기 프로그램입니다. 3개월간 집중 액셀러레이팅을 제공합니다.',
      acceleratorName: '프라이머',
      programDuration: '3개월',
      cohortSize: 12,
      equity: '5%',
      fundingAmount: '5천만원',
      supportField: '멘토링·컨설팅·교육',
      mentorship: ['제품 개발', '비즈니스 전략', '투자 유치'],
      demoDay: true,
      announcementDate: new Date('2024-01-18'),
      applicationStartDate: new Date('2024-02-01'),
      applicationEndDate: new Date('2024-02-20'),
      keywords: ['액셀러레이팅', '멘토링', 'Seed'],
      recommendedStages: ['A-2', 'A-3'],
      recommendedSectors: ['S-1', 'S-2', 'S-3'],
      originalUrl: 'https://www.primer.kr'
    } as any,
    score: 79,
    matchingReasons: ['초기 단계 적합', '멘토링 필요'],
    urgencyLevel: 'high',
    daysUntilDeadline: 15,
    recommendedActions: ['팀 소개 자료 준비', 'MVP 완성']
  },

  // 5. 오픈이노베이션
  {
    event: {
      id: 'lg-open-2024',
      category: 'open_innovation',
      title: 'LG 오픈이노베이션 2024',
      description: 'LG그룹과 협업할 혁신 스타트업을 찾습니다. 공동 R&D와 사업화 기회를 제공합니다.',
      demandOrganization: 'LG그룹',
      recruitmentField: 'AI/로봇/배터리',
      collaborationContent: '공동 R&D 및 PoC',
      collaborationPeriod: '6-12개월',
      supportField: '판로·해외진출·글로벌',
      selectionCount: 20,
      applicationConditions: ['기술 검증 완료', 'MVP 보유'],
      announcementDate: new Date('2024-01-22'),
      applicationStartDate: new Date('2024-02-08'),
      applicationEndDate: new Date('2024-02-29'),
      keywords: ['대기업 협업', 'B2B', '기술 상용화'],
      recommendedStages: ['A-3', 'A-4', 'A-5'],
      recommendedSectors: ['S-1', 'S-2'],
      originalUrl: 'https://www.lg.com/innovation'
    } as any,
    score: 71,
    matchingReasons: ['기술 호환성', '협업 가능성'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 25,
    recommendedActions: ['기술 스펙 문서화', '협업 제안서 작성']
  },

  // 6. 융자 프로그램
  {
    event: {
      id: 'sbdc-loan-2024',
      category: 'loan_program',
      title: '소상공인 정책자금 융자',
      description: '스타트업과 소상공인을 위한 저금리 정책자금 융자 프로그램입니다.',
      loanAmount: '최대 7천만원',
      interestRate: '연 2.0%',
      loanPeriod: '5년 (2년 거치)',
      supportField: '융자',
      hostOrganization: '소상공인진흥공단',
      eligibilityRequirements: ['창업 5년 이내', '신용등급 6등급 이상'],
      announcementDate: new Date('2024-01-10'),
      applicationStartDate: new Date('2024-01-20'),
      applicationEndDate: new Date('2024-03-31'),
      keywords: ['융자', '운영자금', '저금리'],
      recommendedStages: ['A-2', 'A-3', 'A-4'],
      recommendedSectors: ['S-1', 'S-2', 'S-3', 'S-4'],
      originalUrl: 'https://www.sbdc.or.kr'
    } as any,
    score: 65,
    matchingReasons: ['신용 요건 충족', '융자 한도 적합'],
    urgencyLevel: 'low',
    daysUntilDeadline: 55,
    recommendedActions: ['재무제표 준비', '사업계획서 작성']
  },

  // 7. 해외진출 지원
  {
    event: {
      id: 'kotra-global-2024',
      category: 'government_support',
      title: 'KOTRA 글로벌 스타트업 진출 지원',
      description: '해외 시장 진출을 준비하는 스타트업을 위한 종합 지원 프로그램입니다.',
      supportContent: '해외 마케팅, 현지화, 네트워킹',
      supportAmount: '최대 5천만원',
      executionPeriod: '12개월',
      hostOrganization: 'KOTRA',
      supportField: '판로·해외진출·글로벌',
      selectionCount: 50,
      applicationConditions: ['MVP 보유', '영문 IR 가능'],
      announcementDate: new Date('2024-01-28'),
      applicationStartDate: new Date('2024-02-15'),
      applicationEndDate: new Date('2024-03-15'),
      keywords: ['글로벌', '해외진출', '수출', '현지화'],
      recommendedStages: ['A-3', 'A-4', 'A-5'],
      recommendedSectors: ['S-1', 'S-2', 'S-3'],
      originalUrl: 'https://www.kotra.or.kr'
    } as any,
    score: 73,
    matchingReasons: ['글로벌 진출 준비', '제품 완성도'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 38,
    recommendedActions: ['영문 자료 준비', '시장 조사']
  },

  // 8. 시설/공간 지원
  {
    event: {
      id: 'seoul-campus-2024',
      category: 'government_support',
      title: '서울창업허브 입주기업 모집',
      description: '성수동 서울창업허브의 입주 기업을 모집합니다. 사무공간과 다양한 지원 프로그램을 제공합니다.',
      supportContent: '사무공간, 멘토링, 네트워킹',
      supportAmount: '무료 입주 (1년)',
      executionPeriod: '12개월',
      hostOrganization: '서울특별시',
      supportField: '시설·공간·보육',
      selectionCount: 30,
      applicationConditions: ['창업 3년 이내', '서울시 소재'],
      announcementDate: new Date('2024-01-12'),
      applicationStartDate: new Date('2024-01-25'),
      applicationEndDate: new Date('2024-02-25'),
      keywords: ['입주공간', '성수동', '네트워킹'],
      recommendedStages: ['A-1', 'A-2', 'A-3'],
      recommendedSectors: ['S-1', 'S-2', 'S-3', 'S-4'],
      originalUrl: 'https://seoulstartuphub.com'
    } as any,
    score: 68,
    matchingReasons: ['입주 조건 충족', '위치 적합'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 21,
    recommendedActions: ['입주 신청서 작성', '사업 소개서 준비']
  },

  // 9. 교육/멘토링 프로그램
  {
    event: {
      id: 'naver-d2sf-2024',
      category: 'accelerator',
      title: 'NAVER D2SF 기술 스타트업 지원',
      description: '네이버의 기술 스타트업 지원 프로그램입니다. 기술 멘토링과 클라우드 크레딧을 제공합니다.',
      acceleratorName: 'D2 Startup Factory',
      programDuration: '6개월',
      cohortSize: 10,
      equity: '협의',
      fundingAmount: '3-10억원',
      supportField: '멘토링·컨설팅·교육',
      mentorship: ['기술 개발', '클라우드 인프라', 'AI/ML'],
      demoDay: true,
      announcementDate: new Date('2024-01-30'),
      applicationStartDate: new Date('2024-02-20'),
      applicationEndDate: new Date('2024-03-20'),
      keywords: ['딥테크', '기술 멘토링', '네이버'],
      recommendedStages: ['A-3', 'A-4'],
      recommendedSectors: ['S-1', 'S-2'],
      originalUrl: 'https://www.d2startup.com'
    } as any,
    score: 85,
    matchingReasons: ['기술력 우수', '네이버 시너지'],
    urgencyLevel: 'low',
    daysUntilDeadline: 44,
    recommendedActions: ['기술 데모 준비', '협업 방안 구상']
  },

  // 10. 입찰 기회
  {
    event: {
      id: 'gov-bidding-2024',
      category: 'bidding',
      title: '공공기관 AI 솔루션 구축 사업',
      description: '정부 부처의 AI 기반 업무 자동화 시스템 구축 사업입니다.',
      projectBudget: '15억원',
      biddingMethod: '제한경쟁입찰',
      contractPeriod: '8개월',
      hostOrganization: '행정안전부',
      supportField: '판로·해외진출·글로벌',
      qualificationRequirements: ['AI 관련 특허', '유사 프로젝트 경험'],
      announcementDate: new Date('2024-02-01'),
      applicationStartDate: new Date('2024-02-10'),
      applicationEndDate: new Date('2024-02-20'),
      keywords: ['공공입찰', 'AI', 'SI'],
      recommendedStages: ['A-4', 'A-5', 'A-6'],
      recommendedSectors: ['S-1'],
      originalUrl: 'https://www.g2b.go.kr'
    } as any,
    score: 62,
    matchingReasons: ['기술 요건 충족', '입찰 자격 보유'],
    urgencyLevel: 'high',
    daysUntilDeadline: 15,
    recommendedActions: ['제안서 작성', '컨소시엄 구성']
  },

  // 11. 중기부 창업지원
  {
    event: {
      id: 'mss-startup-2024',
      category: 'government_support',
      title: '예비창업패키지 2024',
      description: '예비창업자와 초기 창업자를 위한 종합 지원 패키지입니다. 사업화 자금과 교육을 지원합니다.',
      supportContent: '사업화 자금, 멘토링, 교육',
      supportAmount: '최대 1억원',
      executionPeriod: '10개월',
      hostOrganization: '중소벤처기업부',
      supportField: 'R&D 및 사업화 자금',
      selectionCount: 1000,
      applicationConditions: ['창업 3년 이내', '만 39세 이하'],
      announcementDate: new Date('2024-01-05'),
      applicationStartDate: new Date('2024-01-15'),
      applicationEndDate: new Date('2024-02-15'),
      keywords: ['예비창업', '청년창업', '사업화'],
      recommendedStages: ['A-1', 'A-2'],
      recommendedSectors: ['S-1', 'S-2', 'S-3', 'S-4'],
      originalUrl: 'https://www.k-startup.go.kr'
    } as any,
    score: 77,
    matchingReasons: ['연령 조건 충족', '창업 단계 적합'],
    urgencyLevel: 'high',
    daysUntilDeadline: 10,
    recommendedActions: ['사업계획서 마무리', '예산 계획 수립']
  },

  // 12. 소셜벤처 지원
  {
    event: {
      id: 'social-venture-2024',
      category: 'government_support',
      title: '사회적기업가 육성사업 2024',
      description: '소셜 임팩트를 창출하는 사회적기업을 지원하는 프로그램입니다.',
      supportContent: '창업자금, 멘토링, 사무공간',
      supportAmount: '최대 5천만원',
      executionPeriod: '12개월',
      hostOrganization: '한국사회적기업진흥원',
      supportField: 'R&D 및 사업화 자금',
      selectionCount: 200,
      applicationConditions: ['소셜미션 보유', '팀 구성'],
      announcementDate: new Date('2024-01-08'),
      applicationStartDate: new Date('2024-01-20'),
      applicationEndDate: new Date('2024-02-22'),
      keywords: ['소셜벤처', '사회적기업', '임팩트'],
      recommendedStages: ['A-1', 'A-2', 'A-3'],
      recommendedSectors: ['S-4'],
      originalUrl: 'https://www.socialenterprise.or.kr'
    } as any,
    score: 70,
    matchingReasons: ['소셜 미션 부합', '팀 구성 완료'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 18,
    recommendedActions: ['소셜 임팩트 정의', '사업 모델 구체화']
  },

  // 13. 기술보증기금
  {
    event: {
      id: 'kibo-guarantee-2024',
      category: 'loan_program',
      title: '기술보증기금 스타트업 특별보증',
      description: '기술력 있는 스타트업을 위한 특별 보증 프로그램입니다. 최대 30억원까지 보증을 제공합니다.',
      loanAmount: '최대 30억원',
      guaranteeRate: '100%',
      guaranteeFee: '연 0.5-1.0%',
      supportField: '융자',
      hostOrganization: '기술보증기금',
      eligibilityRequirements: ['기술평가 B등급 이상', '창업 7년 이내'],
      announcementDate: new Date('2024-01-17'),
      applicationStartDate: new Date('2024-02-01'),
      applicationEndDate: new Date('2024-12-31'),
      keywords: ['기술보증', '대출', '운영자금'],
      recommendedStages: ['A-3', 'A-4', 'A-5'],
      recommendedSectors: ['S-1', 'S-2'],
      originalUrl: 'https://www.kibo.or.kr'
    } as any,
    score: 74,
    matchingReasons: ['기술평가 우수', '보증 한도 적합'],
    urgencyLevel: 'low',
    daysUntilDeadline: 300,
    recommendedActions: ['기술평가 신청', '재무 계획 수립']
  },

  // 14. AWS 클라우드 지원
  {
    event: {
      id: 'aws-activate-2024',
      category: 'accelerator',
      title: 'AWS Activate 스타트업 프로그램',
      description: 'AWS 클라우드 크레딧과 기술 지원을 제공하는 글로벌 프로그램입니다.',
      acceleratorName: 'AWS',
      programDuration: '24개월',
      cohortSize: 0, // 제한 없음
      equity: '0%',
      fundingAmount: '크레딧 $100,000',
      supportField: '멘토링·컨설팅·교육',
      mentorship: ['클라우드 아키텍처', '비용 최적화', '기술 지원'],
      demoDay: false,
      announcementDate: new Date('2024-01-01'),
      applicationStartDate: new Date('2024-01-01'),
      applicationEndDate: new Date('2024-12-31'),
      keywords: ['클라우드', 'AWS', '인프라'],
      recommendedStages: ['A-2', 'A-3', 'A-4', 'A-5'],
      recommendedSectors: ['S-1', 'S-2'],
      originalUrl: 'https://aws.amazon.com/activate'
    } as any,
    score: 80,
    matchingReasons: ['클라우드 기반 서비스', '기술 스택 적합'],
    urgencyLevel: 'low',
    daysUntilDeadline: 320,
    recommendedActions: ['AWS 계정 생성', '아키텍처 설계']
  },

  // 15. 바이오 특화 지원
  {
    event: {
      id: 'bio-innovation-2024',
      category: 'government_support',
      title: '바이오헬스 혁신창업 지원사업',
      description: '바이오 및 헬스케어 분야 스타트업을 위한 특화 지원 프로그램입니다.',
      supportContent: 'R&D 자금, 임상시험 지원, 규제 컨설팅',
      supportAmount: '최대 10억원',
      executionPeriod: '36개월',
      hostOrganization: '보건복지부',
      supportField: 'R&D 및 사업화 자금',
      selectionCount: 30,
      applicationConditions: ['바이오 분야', '기술 특허 보유'],
      announcementDate: new Date('2024-02-03'),
      applicationStartDate: new Date('2024-02-20'),
      applicationEndDate: new Date('2024-03-25'),
      keywords: ['바이오', '헬스케어', '의료기기', '신약'],
      recommendedStages: ['A-3', 'A-4', 'A-5'],
      recommendedSectors: ['S-2'],
      originalUrl: 'https://www.khidi.or.kr'
    } as any,
    score: 66,
    matchingReasons: ['분야 특화', 'R&D 역량'],
    urgencyLevel: 'low',
    daysUntilDeadline: 49,
    recommendedActions: ['임상 계획 수립', '규제 검토']
  },

  // 16. 콘텐츠 산업 지원
  {
    event: {
      id: 'kocca-content-2024',
      category: 'government_support',
      title: '콘텐츠 스타트업 지원사업',
      description: '게임, 웹툰, 영상 등 콘텐츠 분야 스타트업을 지원합니다.',
      supportContent: '제작지원금, 글로벌 진출, 마케팅',
      supportAmount: '최대 2억원',
      executionPeriod: '12개월',
      hostOrganization: '한국콘텐츠진흥원',
      supportField: '판로·해외진출·글로벌',
      selectionCount: 50,
      applicationConditions: ['콘텐츠 IP 보유', '프로토타입 완성'],
      announcementDate: new Date('2024-01-24'),
      applicationStartDate: new Date('2024-02-12'),
      applicationEndDate: new Date('2024-03-08'),
      keywords: ['콘텐츠', '게임', '웹툰', 'IP'],
      recommendedStages: ['A-2', 'A-3', 'A-4'],
      recommendedSectors: ['S-3'],
      originalUrl: 'https://www.kocca.kr'
    } as any,
    score: 72,
    matchingReasons: ['콘텐츠 분야', 'IP 보유'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 32,
    recommendedActions: ['포트폴리오 준비', '글로벌 전략 수립']
  },

  // 17. 여성창업 지원
  {
    event: {
      id: 'women-startup-2024',
      category: 'government_support',
      title: '여성창업 특화 지원사업',
      description: '여성 창업자를 위한 맞춤형 창업 지원 프로그램입니다.',
      supportContent: '창업자금, 멘토링, 네트워킹',
      supportAmount: '최대 7천만원',
      executionPeriod: '12개월',
      hostOrganization: '여성기업종합지원센터',
      supportField: '멘토링·컨설팅·교육',
      selectionCount: 100,
      applicationConditions: ['여성 대표', '창업 5년 이내'],
      announcementDate: new Date('2024-01-26'),
      applicationStartDate: new Date('2024-02-08'),
      applicationEndDate: new Date('2024-02-26'),
      keywords: ['여성창업', '여성기업', '멘토링'],
      recommendedStages: ['A-1', 'A-2', 'A-3'],
      recommendedSectors: ['S-1', 'S-2', 'S-3', 'S-4'],
      originalUrl: 'https://www.wbiz.or.kr'
    } as any,
    score: 76,
    matchingReasons: ['대상 요건 충족', '지원 규모 적합'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 22,
    recommendedActions: ['신청서 작성', '사업계획 구체화']
  },

  // 18. 핀테크 특화
  {
    event: {
      id: 'fintech-lab-2024',
      category: 'accelerator',
      title: '서울 핀테크랩 2024년 입주기업',
      description: '핀테크 스타트업을 위한 전문 액셀러레이팅 프로그램입니다.',
      acceleratorName: '서울핀테크랩',
      programDuration: '12개월',
      cohortSize: 20,
      equity: '0%',
      fundingAmount: '지원금 협의',
      supportField: '시설·공간·보육',
      mentorship: ['금융 규제', '핀테크 기술', '투자 유치'],
      demoDay: true,
      announcementDate: new Date('2024-01-29'),
      applicationStartDate: new Date('2024-02-15'),
      applicationEndDate: new Date('2024-03-12'),
      keywords: ['핀테크', '금융', '블록체인', '페이테크'],
      recommendedStages: ['A-2', 'A-3', 'A-4'],
      recommendedSectors: ['S-1'],
      originalUrl: 'https://seoulfintechlab.kr'
    } as any,
    score: 69,
    matchingReasons: ['핀테크 분야', '규제 지원 필요'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 36,
    recommendedActions: ['금융 라이선스 확인', '컴플라이언스 점검']
  },

  // 19. 그린/ESG 지원
  {
    event: {
      id: 'green-new-deal-2024',
      category: 'government_support',
      title: '그린뉴딜 스타트업 지원사업',
      description: '친환경 기술과 ESG 경영을 추구하는 스타트업을 지원합니다.',
      supportContent: '기술개발, ESG 컨설팅, 인증 지원',
      supportAmount: '최대 5억원',
      executionPeriod: '24개월',
      hostOrganization: '환경부',
      supportField: 'R&D 및 사업화 자금',
      selectionCount: 40,
      applicationConditions: ['친환경 기술', 'ESG 경영 계획'],
      announcementDate: new Date('2024-02-02'),
      applicationStartDate: new Date('2024-02-18'),
      applicationEndDate: new Date('2024-03-18'),
      keywords: ['그린뉴딜', 'ESG', '탄소중립', '친환경'],
      recommendedStages: ['A-2', 'A-3', 'A-4', 'A-5'],
      recommendedSectors: ['S-1', 'S-2'],
      originalUrl: 'https://www.me.go.kr'
    } as any,
    score: 67,
    matchingReasons: ['친환경 기술 보유', 'ESG 준비'],
    urgencyLevel: 'low',
    daysUntilDeadline: 42,
    recommendedActions: ['ESG 평가 준비', '환경 인증 취득']
  },

  // 20. 대학 연계 창업
  {
    event: {
      id: 'univ-startup-2024',
      category: 'government_support',
      title: '대학 창업펀드 연계 지원사업',
      description: '대학 창업 생태계와 연계한 스타트업 지원 프로그램입니다.',
      supportContent: '투자 연계, 기술 이전, 산학협력',
      supportAmount: '최대 3억원',
      executionPeriod: '18개월',
      hostOrganization: '교육부',
      supportField: 'R&D 및 사업화 자금',
      selectionCount: 60,
      applicationConditions: ['대학 연계', '기술 기반'],
      announcementDate: new Date('2024-01-31'),
      applicationStartDate: new Date('2024-02-14'),
      applicationEndDate: new Date('2024-03-14'),
      keywords: ['대학창업', '기술이전', '산학협력'],
      recommendedStages: ['A-1', 'A-2', 'A-3'],
      recommendedSectors: ['S-1', 'S-2'],
      originalUrl: 'https://www.moe.go.kr'
    } as any,
    score: 64,
    matchingReasons: ['대학 연계 가능', '기술 기반'],
    urgencyLevel: 'medium',
    daysUntilDeadline: 37,
    recommendedActions: ['대학 파트너십 구축', '기술이전 계약']
  }
];