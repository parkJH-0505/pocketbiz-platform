// 기존 25군집 시스템에 맞는 마일스톤 정의
// A-단계(성장단계) x S-섹터(산업섹터) = 25군집

export type Stage = 'A-1' | 'A-2' | 'A-3' | 'A-4' | 'A-5';
export type Sector = 'S-1' | 'S-2' | 'S-3' | 'S-4' | 'S-5';

export interface Milestone {
  id: string;
  title: string;
  category: 'revenue' | 'team' | 'product' | 'market' | 'investment' | 'regulation';
  description?: string;
  typical: boolean;
}

export interface ClusterTemplate {
  cluster: string; // 예: "A3S1"
  stage: Stage;
  sector: Sector;
  stageLabel: string;
  sectorLabel: string;
  goalDescription: string;
  milestones: {
    completed: Milestone[];
    inProgress: Milestone[];
    pending: Milestone[];
  };
}

// 단계 및 섹터 라벨 정의
export const stageLabels: Record<Stage, string> = {
  'A-1': '예비창업자',
  'A-2': '창업 직전·막 창업',
  'A-3': 'PMF 검증 완료',
  'A-4': 'Pre-A 단계',
  'A-5': 'Series A 이상'
};

export const sectorLabels: Record<Sector, string> = {
  'S-1': 'IT·플랫폼/SaaS',
  'S-2': '제조·하드웨어·산업기술',
  'S-3': '브랜드·커머스(D2C)',
  'S-4': '바이오·헬스케어',
  'S-5': '크리에이티브·미디어·서비스'
};

// 25군집 마일스톤 템플릿
export const clusterMilestoneTemplates: Record<string, ClusterTemplate> = {
  // A-1 (예비창업자) 시리즈
  'A1S1': {
    cluster: 'A1S1',
    stage: 'A-1',
    sector: 'S-1',
    stageLabel: stageLabels['A-1'],
    sectorLabel: sectorLabels['S-1'],
    goalDescription: 'IT 아이템 검증 및 창업 준비',
    milestones: {
      completed: [
        { id: 'a1s1-1', title: '창업 아이템 구체화', category: 'product', typical: true },
        { id: 'a1s1-2', title: '시장 조사 완료', category: 'market', typical: true }
      ],
      inProgress: [
        { id: 'a1s1-3', title: '기술 스택 학습', category: 'product', typical: true },
        { id: 'a1s1-4', title: '창업팀 구성', category: 'team', typical: true }
      ],
      pending: [
        { id: 'a1s1-5', title: '법인 설립', category: 'investment', typical: true },
        { id: 'a1s1-6', title: 'MVP 개발 시작', category: 'product', typical: true }
      ]
    }
  },

  'A1S2': {
    cluster: 'A1S2',
    stage: 'A-1',
    sector: 'S-2',
    stageLabel: stageLabels['A-1'],
    sectorLabel: sectorLabels['S-2'],
    goalDescription: '제조업 아이템 검증 및 창업 준비',
    milestones: {
      completed: [
        { id: 'a1s2-1', title: '제품 아이디어 구체화', category: 'product', typical: true },
        { id: 'a1s2-2', title: '시장 니즈 검증', category: 'market', typical: true }
      ],
      inProgress: [
        { id: 'a1s2-3', title: '프로토타입 설계', category: 'product', typical: true },
        { id: 'a1s2-4', title: '기술 파트너 탐색', category: 'team', typical: true }
      ],
      pending: [
        { id: 'a1s2-5', title: '법인 설립', category: 'investment', typical: true },
        { id: 'a1s2-6', title: '제조 파트너 확보', category: 'market', typical: false }
      ]
    }
  },

  'A1S3': {
    cluster: 'A1S3',
    stage: 'A-1',
    sector: 'S-3',
    stageLabel: stageLabels['A-1'],
    sectorLabel: sectorLabels['S-3'],
    goalDescription: 'D2C 브랜드 컨셉 검증 및 창업 준비',
    milestones: {
      completed: [
        { id: 'a1s3-1', title: '브랜드 컨셉 개발', category: 'product', typical: true },
        { id: 'a1s3-2', title: '타겟 고객 정의', category: 'market', typical: true }
      ],
      inProgress: [
        { id: 'a1s3-3', title: '제품 기획 및 디자인', category: 'product', typical: true },
        { id: 'a1s3-4', title: '초기 자금 확보', category: 'investment', typical: true }
      ],
      pending: [
        { id: 'a1s3-5', title: '법인 설립', category: 'investment', typical: true },
        { id: 'a1s3-6', title: '제조업체 파트너십', category: 'market', typical: false }
      ]
    }
  },

  'A1S4': {
    cluster: 'A1S4',
    stage: 'A-1',
    sector: 'S-4',
    stageLabel: stageLabels['A-1'],
    sectorLabel: sectorLabels['S-4'],
    goalDescription: '바이오·헬스케어 연구 및 창업 준비',
    milestones: {
      completed: [
        { id: 'a1s4-1', title: '연구 주제 선정', category: 'product', typical: true },
        { id: 'a1s4-2', title: '기술 타당성 검토', category: 'product', typical: true }
      ],
      inProgress: [
        { id: 'a1s4-3', title: '연구팀 구성', category: 'team', typical: true },
        { id: 'a1s4-4', title: '초기 연구 수행', category: 'product', typical: true }
      ],
      pending: [
        { id: 'a1s4-5', title: '법인 설립', category: 'investment', typical: true },
        { id: 'a1s4-6', title: '연구시설 확보', category: 'product', typical: false }
      ]
    }
  },

  'A1S5': {
    cluster: 'A1S5',
    stage: 'A-1',
    sector: 'S-5',
    stageLabel: stageLabels['A-1'],
    sectorLabel: sectorLabels['S-5'],
    goalDescription: '크리에이티브 서비스 기획 및 창업 준비',
    milestones: {
      completed: [
        { id: 'a1s5-1', title: '서비스 컨셉 개발', category: 'product', typical: true },
        { id: 'a1s5-2', title: '포트폴리오 구축', category: 'product', typical: true }
      ],
      inProgress: [
        { id: 'a1s5-3', title: '클리에이티브팀 구성', category: 'team', typical: true },
        { id: 'a1s5-4', title: '초기 클라이언트 확보', category: 'market', typical: true }
      ],
      pending: [
        { id: 'a1s5-5', title: '법인 설립', category: 'investment', typical: true },
        { id: 'a1s5-6', title: '작업 공간 확보', category: 'product', typical: false }
      ]
    }
  },

  // A-2 (창업 직전·막 창업) 시리즈
  'A2S1': {
    cluster: 'A2S1',
    stage: 'A-2',
    sector: 'S-1',
    stageLabel: stageLabels['A-2'],
    sectorLabel: sectorLabels['S-1'],
    goalDescription: 'MVP 출시 및 초기 고객 확보',
    milestones: {
      completed: [
        { id: 'a2s1-1', title: '법인 설립 완료', category: 'investment', typical: true },
        { id: 'a2s1-2', title: 'MVP 개발 완료', category: 'product', typical: true },
        { id: 'a2s1-3', title: '핵심팀 구성', category: 'team', typical: true }
      ],
      inProgress: [
        { id: 'a2s1-4', title: '베타 사용자 확보', category: 'market', typical: true },
        { id: 'a2s1-5', title: '초기 매출 창출', category: 'revenue', typical: true }
      ],
      pending: [
        { id: 'a2s1-6', title: 'PMF 검증', category: 'market', typical: true },
        { id: 'a2s1-7', title: 'Pre-Seed 투자 준비', category: 'investment', typical: false }
      ]
    }
  },

  'A2S4': {
    cluster: 'A2S4',
    stage: 'A-2',
    sector: 'S-4',
    stageLabel: stageLabels['A-2'],
    sectorLabel: sectorLabels['S-4'],
    goalDescription: 'POC 연구 완료 및 특허 출원',
    milestones: {
      completed: [
        { id: 'a2s4-1', title: '법인 설립 완료', category: 'investment', typical: true },
        { id: 'a2s4-2', title: 'POC 연구 완료', category: 'product', typical: true },
        { id: 'a2s4-3', title: '연구팀 확장', category: 'team', typical: true }
      ],
      inProgress: [
        { id: 'a2s4-4', title: '핵심 특허 출원', category: 'product', typical: true },
        { id: 'a2s4-5', title: '전임상 연구 준비', category: 'product', typical: true }
      ],
      pending: [
        { id: 'a2s4-6', title: 'Pre-Seed 투자 유치', category: 'investment', typical: true },
        { id: 'a2s4-7', title: '연구시설 확장', category: 'product', typical: false }
      ]
    }
  },

  // A-3 (PMF 검증 완료) 시리즈
  'A3S1': {
    cluster: 'A3S1',
    stage: 'A-3',
    sector: 'S-1',
    stageLabel: stageLabels['A-3'],
    sectorLabel: sectorLabels['S-1'],
    goalDescription: 'Seed 투자 준비 및 사업 확장',
    milestones: {
      completed: [
        { id: 'a3s1-1', title: 'PMF 검증 완료', category: 'market', typical: true },
        { id: 'a3s1-2', title: '월 매출 3천만원 달성', category: 'revenue', typical: true },
        { id: 'a3s1-3', title: '고객 리텐션 30% 달성', category: 'market', typical: true }
      ],
      inProgress: [
        { id: 'a3s1-4', title: 'Seed 투자 준비', category: 'investment', typical: true },
        { id: 'a3s1-5', title: '조직 확장 (10명)', category: 'team', typical: true }
      ],
      pending: [
        { id: 'a3s1-6', title: 'Seed 투자 완료', category: 'investment', typical: true },
        { id: 'a3s1-7', title: '해외 시장 진출 준비', category: 'market', typical: false }
      ]
    }
  },

  'A3S4': {
    cluster: 'A3S4',
    stage: 'A-3',
    sector: 'S-4',
    stageLabel: stageLabels['A-3'],
    sectorLabel: sectorLabels['S-4'],
    goalDescription: '전임상 완료 및 임상 준비',
    milestones: {
      completed: [
        { id: 'a3s4-1', title: '전임상 연구 완료', category: 'product', typical: true },
        { id: 'a3s4-2', title: '핵심 특허 등록', category: 'product', typical: true },
        { id: 'a3s4-3', title: 'GMP 시설 구축', category: 'regulation', typical: true }
      ],
      inProgress: [
        { id: 'a3s4-4', title: 'IND 신청 준비', category: 'regulation', typical: true },
        { id: 'a3s4-5', title: 'Seed 투자 유치', category: 'investment', typical: true }
      ],
      pending: [
        { id: 'a3s4-6', title: '임상 1상 준비', category: 'product', typical: true },
        { id: 'a3s4-7', title: '글로벌 파트너십', category: 'market', typical: false }
      ]
    }
  },

  // A-4 (Pre-A 단계) 시리즈
  'A4S1': {
    cluster: 'A4S1',
    stage: 'A-4',
    sector: 'S-1',
    stageLabel: stageLabels['A-4'],
    sectorLabel: sectorLabels['S-1'],
    goalDescription: 'Series A 준비 및 스케일업',
    milestones: {
      completed: [
        { id: 'a4s1-1', title: 'Seed 투자 완료', category: 'investment', typical: true },
        { id: 'a4s1-2', title: '월 매출 2억원 달성', category: 'revenue', typical: true },
        { id: 'a4s1-3', title: '조직 10명 이상', category: 'team', typical: true }
      ],
      inProgress: [
        { id: 'a4s1-4', title: 'Series A 준비', category: 'investment', typical: true },
        { id: 'a4s1-5', title: '시장 확장 전략', category: 'market', typical: true }
      ],
      pending: [
        { id: 'a4s1-6', title: 'Series A 투자 유치', category: 'investment', typical: true },
        { id: 'a4s1-7', title: '글로벌 진출', category: 'market', typical: false }
      ]
    }
  },

  'A4S4': {
    cluster: 'A4S4',
    stage: 'A-4',
    sector: 'S-4',
    stageLabel: stageLabels['A-4'],
    sectorLabel: sectorLabels['S-4'],
    goalDescription: '임상 1상 진행 및 Series A 준비',
    milestones: {
      completed: [
        { id: 'a4s4-1', title: 'IND 승인 완료', category: 'regulation', typical: true },
        { id: 'a4s4-2', title: '임상 1상 시작', category: 'product', typical: true },
        { id: 'a4s4-3', title: 'Seed 투자 완료', category: 'investment', typical: true }
      ],
      inProgress: [
        { id: 'a4s4-4', title: '임상 1상 진행', category: 'product', typical: true },
        { id: 'a4s4-5', title: 'Series A 준비', category: 'investment', typical: true }
      ],
      pending: [
        { id: 'a4s4-6', title: 'Series A 투자 유치', category: 'investment', typical: true },
        { id: 'a4s4-7', title: '글로벌 임상 준비', category: 'market', typical: false }
      ]
    }
  },

  // A-5 (Series A 이상) 시리즈
  'A5S1': {
    cluster: 'A5S1',
    stage: 'A-5',
    sector: 'S-1',
    stageLabel: stageLabels['A-5'],
    sectorLabel: sectorLabels['S-5'],
    goalDescription: 'Series B 준비 및 시장 지배력 확보',
    milestones: {
      completed: [
        { id: 'a5s1-1', title: 'Series A 투자 완료', category: 'investment', typical: true },
        { id: 'a5s1-2', title: '연 매출 50억원 달성', category: 'revenue', typical: true },
        { id: 'a5s1-3', title: '영업이익 달성', category: 'revenue', typical: true }
      ],
      inProgress: [
        { id: 'a5s1-4', title: '시장 점유율 확대', category: 'market', typical: true },
        { id: 'a5s1-5', title: 'Series B 준비', category: 'investment', typical: true }
      ],
      pending: [
        { id: 'a5s1-6', title: 'Series B 투자 유치', category: 'investment', typical: true },
        { id: 'a5s1-7', title: 'IPO 준비', category: 'investment', typical: false }
      ]
    }
  },

  'A5S4': {
    cluster: 'A5S4',
    stage: 'A-5',
    sector: 'S-4',
    stageLabel: stageLabels['A-5'],
    sectorLabel: sectorLabels['S-4'],
    goalDescription: '임상 2상 진행 및 파트너십 구축',
    milestones: {
      completed: [
        { id: 'a5s4-1', title: 'Series A 투자 완료', category: 'investment', typical: true },
        { id: 'a5s4-2', title: '임상 1상 성공', category: 'product', typical: true },
        { id: 'a5s4-3', title: '복수 파이프라인 구축', category: 'product', typical: true }
      ],
      inProgress: [
        { id: 'a5s4-4', title: '임상 2상 진행', category: 'product', typical: true },
        { id: 'a5s4-5', title: '빅파마 파트너십', category: 'market', typical: true }
      ],
      pending: [
        { id: 'a5s4-6', title: 'Series B 투자 유치', category: 'investment', typical: true },
        { id: 'a5s4-7', title: '라이선싱 아웃', category: 'market', typical: false }
      ]
    }
  }
};

// 유틸리티 함수들
export function getClusterTemplate(stage: Stage, sector: Sector): ClusterTemplate | null {
  const clusterKey = `${stage.replace('-', '')}${sector.replace('-', '')}`;
  return clusterMilestoneTemplates[clusterKey] || null;
}

export function getAllClusters(): string[] {
  return Object.keys(clusterMilestoneTemplates);
}

export function getStageLabel(stage: Stage): string {
  return stageLabels[stage] || stage;
}

export function getSectorLabel(sector: Sector): string {
  return sectorLabels[sector] || sector;
}

export function getCategoryColor(category: Milestone['category']): string {
  const colors = {
    revenue: 'text-green-600',
    team: 'text-blue-600',
    product: 'text-purple-600',
    market: 'text-orange-600',
    investment: 'text-indigo-600',
    regulation: 'text-red-600'
  };
  return colors[category] || 'text-gray-600';
}

export function getCategoryIcon(category: Milestone['category']): string {
  const icons = {
    revenue: '💰',
    team: '👥',
    product: '🚀',
    market: '📈',
    investment: '💼',
    regulation: '📋'
  };
  return icons[category] || '📌';
}