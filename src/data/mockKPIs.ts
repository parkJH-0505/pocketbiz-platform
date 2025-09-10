import type { KPIDefinition } from '../types';

export const mockKPIs: KPIDefinition[] = [
  // GO (Growth Opportunity) - 보라색
  {
    kpi_id: 'S1-GO-01',
    axis: 'GO',
    title: '고객 문제 정의',
    question: '해결하고자 하는 고객의 문제가 얼마나 명확하게 정의되어 있나요?',
    input_type: 'Rubric',
    stage: 'A-1',
    applicable: true,
    stage_cell: {
      weight: 'x3',
      choices: [
        { label: '문제를 막연하게만 인지하고 있음', score: 0 },
        { label: '문제를 정의했으나 검증이 부족함', score: 40 },
        { label: '고객 인터뷰를 통해 문제를 검증함', score: 70 },
        { label: '정량적 데이터로 문제의 심각성을 입증함', score: 100 }
      ]
    },
    validators: [],
    evidence_required: true,
    weight: 'x3'
  },
  {
    kpi_id: 'S1-GO-02',
    axis: 'GO',
    title: '시장 규모 (TAM)',
    question: '목표 시장의 전체 규모(Total Addressable Market)는 얼마입니까?',
    input_type: 'Numeric',
    stage: 'A-1',
    applicable: true,
    stage_cell: {
      weight: 'x2',
      choices: [{ label: '억원 단위로 입력', score: 0 }]
    },
    validators: [
      { type: 'range', rule: 'min:0', message: '0 이상의 값을 입력해주세요' }
    ],
    evidence_required: true,
    weight: 'x2'
  },
  {
    kpi_id: 'S1-GO-03',
    axis: 'GO',
    title: '경쟁사 분석',
    question: '주요 경쟁사를 파악하고 차별화 포인트를 정의했나요?',
    input_type: 'Stage',
    stage: 'A-2',
    applicable: true,
    stage_cell: {
      weight: 'x2',
      choices: [
        { label: '경쟁사 파악 안됨', score: 0 },
        { label: '주요 경쟁사 리스트업', score: 30 },
        { label: '경쟁사 분석 완료', score: 60 },
        { label: '차별화 전략 수립', score: 100 }
      ]
    },
    validators: [],
    evidence_required: false,
    weight: 'x2'
  },
  {
    kpi_id: 'S1-GO-04',
    axis: 'GO',
    title: '총 가입자 수',
    question: '현재까지 서비스에 가입한 전체 사용자 수는?',
    input_type: 'Numeric',
    stage: 'A-3',
    applicable: true,
    stage_cell: {
      weight: 'x2',
      choices: [{ label: '명', score: 0 }]
    },
    validators: [
      { type: 'range', rule: 'min:0', message: '0 이상의 값을 입력해주세요' }
    ],
    evidence_required: false,
    weight: 'x2'
  },
  {
    kpi_id: 'S1-GO-05',
    axis: 'GO',
    title: 'MAU (월간 활성 사용자)',
    question: '최근 한 달간 서비스를 이용한 순 사용자 수는?',
    input_type: 'Numeric',
    stage: 'A-3',
    applicable: true,
    stage_cell: {
      weight: 'x3',
      choices: [{ label: '명', score: 0 }]
    },
    validators: [
      { type: 'range', rule: 'min:0', message: '0 이상의 값을 입력해주세요' },
      { type: 'cross', rule: 'lte:S1-GO-04', message: 'MAU는 총 가입자 수보다 클 수 없습니다' }
    ],
    evidence_required: false,
    weight: 'x3'
  },

  // EC (Economic Value) - 초록색
  {
    kpi_id: 'S1-EC-01',
    axis: 'EC',
    title: '비즈니스 모델',
    question: '수익 모델이 얼마나 구체화되어 있나요?',
    input_type: 'Rubric',
    stage: 'A-1',
    applicable: true,
    stage_cell: {
      weight: 'x3',
      choices: [
        { label: '아직 수익 모델 없음', score: 0 },
        { label: '개념적 수익 모델 존재', score: 30 },
        { label: '구체적인 가격 정책 수립', score: 70 },
        { label: '수익 모델 검증 완료', score: 100 }
      ]
    },
    validators: [],
    evidence_required: true,
    weight: 'x3'
  },
  {
    kpi_id: 'S1-EC-02',
    axis: 'EC',
    title: '월간 반복 수익 (MRR)',
    question: '현재 월간 반복 수익(MRR)은 얼마입니까?',
    input_type: 'Numeric',
    stage: 'A-3',
    applicable: true,
    stage_cell: {
      weight: 'x3',
      choices: [{ label: '만원', score: 0 }]
    },
    validators: [
      { type: 'range', rule: 'min:0', message: '0 이상의 값을 입력해주세요' }
    ],
    evidence_required: true,
    weight: 'x3'
  },
  {
    kpi_id: 'S1-EC-03',
    axis: 'EC',
    title: '유료 전환율',
    question: '무료 사용자 중 유료로 전환한 비율은?',
    input_type: 'Calculation',
    formula: '(유료 고객 수 / 전체 가입자 수) × 100',
    stage: 'A-3',
    applicable: true,
    stage_cell: {
      weight: 'x2',
      choices: []
    },
    validators: [
      { type: 'range', rule: 'min:0,max:100', message: '0-100 사이의 값이어야 합니다' }
    ],
    evidence_required: false,
    weight: 'x2'
  },
  {
    kpi_id: 'S1-EC-04',
    axis: 'EC',
    title: '고객 획득 비용 (CAC)',
    question: '신규 고객 한 명을 획득하는데 드는 평균 비용은?',
    input_type: 'Numeric',
    stage: 'A-3',
    applicable: true,
    stage_cell: {
      weight: 'x2',
      choices: [{ label: '만원', score: 0 }]
    },
    validators: [
      { type: 'range', rule: 'min:0', message: '0 이상의 값을 입력해주세요' }
    ],
    evidence_required: true,
    weight: 'x2'
  },

  // PT (Product Technology) - 주황색
  {
    kpi_id: 'S1-PT-01',
    axis: 'PT',
    title: '프로토타입 개발',
    question: '제품/서비스의 프로토타입 개발 단계는?',
    input_type: 'Stage',
    stage: 'A-1',
    applicable: true,
    stage_cell: {
      weight: 'x3',
      choices: [
        { label: '아이디어 단계', score: 0 },
        { label: '목업/와이어프레임', score: 25 },
        { label: 'MVP 개발 중', score: 50 },
        { label: 'MVP 완성', score: 75 },
        { label: '정식 버전 출시', score: 100 }
      ]
    },
    validators: [],
    evidence_required: true,
    weight: 'x3'
  },
  {
    kpi_id: 'S1-PT-02',
    axis: 'PT',
    title: '기술 차별화',
    question: '핵심 기술의 차별화 요소는?',
    input_type: 'MultiSelect',
    stage: 'A-2',
    applicable: true,
    stage_cell: {
      weight: 'x2',
      choices: [
        { label: '특허 출원/등록', value: 30 },
        { label: '독자적 알고리즘', value: 25 },
        { label: '데이터 경쟁력', value: 25 },
        { label: '기술 파트너십', value: 20 }
      ]
    },
    validators: [],
    evidence_required: true,
    weight: 'x2'
  },
  {
    kpi_id: 'S1-PT-03',
    axis: 'PT',
    title: '제품 안정성',
    question: '서비스 가용성(Uptime)은 어느 정도입니까?',
    input_type: 'Numeric',
    stage: 'A-3',
    applicable: true,
    stage_cell: {
      weight: 'x2',
      choices: [{ label: '% (최근 3개월 평균)', score: 0 }]
    },
    validators: [
      { type: 'range', rule: 'min:0,max:100', message: '0-100 사이의 값을 입력해주세요' }
    ],
    evidence_required: false,
    weight: 'x2'
  },

  // PF (Performance Finance) - 파란색
  {
    kpi_id: 'S1-PF-01',
    axis: 'PF',
    title: '자금 조달 상태',
    question: '현재까지 조달한 누적 투자금은?',
    input_type: 'Numeric',
    stage: 'A-2',
    applicable: true,
    stage_cell: {
      weight: 'x3',
      choices: [{ label: '억원', score: 0 }]
    },
    validators: [
      { type: 'range', rule: 'min:0', message: '0 이상의 값을 입력해주세요' }
    ],
    evidence_required: true,
    weight: 'x3'
  },
  {
    kpi_id: 'S1-PF-02',
    axis: 'PF',
    title: '런웨이',
    question: '현재 보유 자금으로 운영 가능한 기간은?',
    input_type: 'Numeric',
    stage: 'A-2',
    applicable: true,
    stage_cell: {
      weight: 'x3',
      choices: [{ label: '개월', score: 0 }]
    },
    validators: [
      { type: 'range', rule: 'min:0', message: '0 이상의 값을 입력해주세요' }
    ],
    evidence_required: false,
    weight: 'x3'
  },
  {
    kpi_id: 'S1-PF-03',
    axis: 'PF',
    title: '재무 관리 체계',
    question: '재무 관리 및 보고 체계가 구축되어 있나요?',
    input_type: 'Checklist',
    stage: 'A-2',
    applicable: true,
    stage_cell: {
      weight: 'x1',
      choices: [
        { label: '월간 재무제표 작성', score: 100 }
      ]
    },
    validators: [],
    evidence_required: false,
    weight: 'x1'
  },

  // TO (Team Organization) - 빨간색
  {
    kpi_id: 'S1-TO-01',
    axis: 'TO',
    title: '창업팀 구성',
    question: '창업팀의 역량과 경험이 사업에 적합한가요?',
    input_type: 'Rubric',
    stage: 'A-1',
    applicable: true,
    stage_cell: {
      weight: 'x3',
      choices: [
        { label: '1인 창업, 관련 경험 부족', score: 0 },
        { label: '2-3인 팀, 일부 관련 경험', score: 40 },
        { label: '균형잡힌 팀, 관련 산업 경험', score: 70 },
        { label: '검증된 팀, 창업 경험 보유', score: 100 }
      ]
    },
    validators: [],
    evidence_required: true,
    weight: 'x3'
  },
  {
    kpi_id: 'S1-TO-02',
    axis: 'TO',
    title: '팀 규모',
    question: '현재 팀원 수는 몇 명입니까?',
    input_type: 'Numeric',
    stage: 'A-2',
    applicable: true,
    stage_cell: {
      weight: 'x2',
      choices: [{ label: '명 (풀타임 기준)', score: 0 }]
    },
    validators: [
      { type: 'range', rule: 'min:1', message: '1 이상의 값을 입력해주세요' }
    ],
    evidence_required: false,
    weight: 'x2'
  },
  {
    kpi_id: 'S1-TO-03',
    axis: 'TO',
    title: '핵심 인재 보유',
    question: '사업 성공에 필수적인 핵심 인재를 보유하고 있나요?',
    input_type: 'MultiSelect',
    stage: 'A-2',
    applicable: true,
    stage_cell: {
      weight: 'x2',
      choices: [
        { label: 'CTO/기술 리더', value: 25 },
        { label: '마케팅/세일즈 리더', value: 25 },
        { label: '도메인 전문가', value: 25 },
        { label: '재무/운영 전문가', value: 25 }
      ]
    },
    validators: [],
    evidence_required: false,
    weight: 'x2'
  },
  {
    kpi_id: 'S1-TO-04',
    axis: 'TO',
    title: '조직 문화',
    question: '명문화된 조직 문화와 가치가 있나요?',
    input_type: 'Checklist',
    stage: 'A-3',
    applicable: true,
    stage_cell: {
      weight: 'x1',
      choices: [
        { label: '핵심 가치 정의 및 공유', score: 100 }
      ]
    },
    validators: [],
    evidence_required: false,
    weight: 'x1'
  }
];

// 축별로 그룹화된 KPI 반환
export function getKPIsByAxis(axis: string): KPIDefinition[] {
  return mockKPIs.filter(kpi => kpi.axis === axis);
}

// 모든 축 정보
export const axes = [
  { key: 'GO', name: 'Growth Opportunity', description: '성장 기회 및 시장성' },
  { key: 'EC', name: 'Economic Value', description: '경제적 가치 창출' },
  { key: 'PT', name: 'Product Technology', description: '제품 기술력' },
  { key: 'PF', name: 'Performance Finance', description: '재무 성과' },
  { key: 'TO', name: 'Team Organization', description: '팀 조직력' }
];