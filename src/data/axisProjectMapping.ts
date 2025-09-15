/**
 * 축별 프로젝트 매핑 데이터
 * 각 축(GO, EC, PT, PF, TO)별로 추천되는 서비스를 매핑
 * 실제 카탈로그의 서비스를 기반으로 구성
 */

import type { EventCategory } from '../types/smartMatchingV2';
import type { AxisKey } from '../data/eventRequirements';

// 서비스 추천 타입
export interface ServiceRecommendation {
  service_id: string;
  name: string;
  category: string;
  priority: number; // 1-10, 높을수록 우선순위
  improvement_score: number; // 해당 축 개선 예상 점수
  price: number;
  duration_weeks: number;
  description: string;
}

// 축별 서비스 매핑
export const axisServiceMapping: Record<AxisKey, ServiceRecommendation[]> = {
  // GO: Growth & Operations (성장성 및 운영)
  GO: [
    {
      service_id: 'SVC-MKT-001',
      name: '디지털 마케팅 전략',
      category: '마케팅',
      priority: 9,
      improvement_score: 15,
      price: 4000000,
      duration_weeks: 6,
      description: '퍼포먼스 마케팅과 그로스 해킹으로 고객 확보 및 성장 가속화'
    },
    {
      service_id: 'SVC-MKT-002',
      name: '콘텐츠 마케팅 패키지',
      category: '마케팅',
      priority: 7,
      improvement_score: 10,
      price: 3000000,
      duration_weeks: 4,
      description: 'SEO 최적화 콘텐츠로 자연 유입 증대'
    },
    {
      service_id: 'SVC-CON-003',
      name: '비즈니스 모델 컨설팅',
      category: '컨설팅',
      priority: 8,
      improvement_score: 12,
      price: 5000000,
      duration_weeks: 3,
      description: '수익 모델 최적화 및 성장 전략 수립'
    }
  ],

  // EC: Economic (수익성)
  EC: [
    {
      service_id: 'SVC-DOC-003',
      name: '재무모델링 및 사업계획서',
      category: '문서작업',
      priority: 9,
      improvement_score: 18,
      price: 3500000,
      duration_weeks: 2,
      description: '정교한 재무 예측 모델과 Unit Economics 분석'
    },
    {
      service_id: 'SVC-CON-002',
      name: '수익성 개선 컨설팅',
      category: '컨설팅',
      priority: 8,
      improvement_score: 15,
      price: 6000000,
      duration_weeks: 4,
      description: '비용 구조 최적화 및 가격 전략 수립'
    },
    {
      service_id: 'SVC-MKT-003',
      name: 'CRM 및 리텐션 전략',
      category: '마케팅',
      priority: 7,
      improvement_score: 12,
      price: 4500000,
      duration_weeks: 5,
      description: 'LTV 향상을 위한 고객 리텐션 시스템 구축'
    }
  ],

  // PT: Product & Technology (제품 및 기술)
  PT: [
    {
      service_id: 'SVC-DEV-001',
      name: 'MVP 개발',
      category: '개발',
      priority: 10,
      improvement_score: 20,
      price: 8000000,
      duration_weeks: 4,
      description: 'React/Node.js 기반 확장 가능한 MVP 개발'
    },
    {
      service_id: 'SVC-DEV-002',
      name: '기술 고도화 프로젝트',
      category: '개발',
      priority: 9,
      improvement_score: 18,
      price: 12000000,
      duration_weeks: 8,
      description: 'AI/ML 적용, 성능 최적화, 확장성 개선'
    },
    {
      service_id: 'SVC-DES-001',
      name: 'UI/UX 리디자인',
      category: '디자인',
      priority: 7,
      improvement_score: 12,
      price: 4000000,
      duration_weeks: 3,
      description: '사용자 경험 개선 및 인터페이스 현대화'
    },
    {
      service_id: 'SVC-DOC-004',
      name: 'R&D 계획서 작성',
      category: '문서작업',
      priority: 6,
      improvement_score: 10,
      price: 3000000,
      duration_weeks: 2,
      description: '정부 R&D 과제 신청을 위한 기술 개발 계획서'
    }
  ],

  // PF: People & Finance (재무 및 인력)
  PF: [
    {
      service_id: 'SVC-DOC-001',
      name: 'IR 덱 제작',
      category: '문서작업',
      priority: 10,
      improvement_score: 15,
      price: 5000000,
      duration_weeks: 3,
      description: '투자유치를 위한 전문 IR 덱 및 재무모델'
    },
    {
      service_id: 'SVC-DOC-002',
      name: '정부지원 사업계획서',
      category: '문서작업',
      priority: 9,
      improvement_score: 12,
      price: 3000000,
      duration_weeks: 2,
      description: 'TIPS, 창업지원 등 정부사업 신청 서류'
    },
    {
      service_id: 'SVC-CON-004',
      name: '재무/회계 자문',
      category: '컨설팅',
      priority: 8,
      improvement_score: 10,
      price: 2000000,
      duration_weeks: 2,
      description: '재무제표 정리 및 투자 준비 자문'
    },
    {
      service_id: 'SVC-INV-001',
      name: '투자자 브릿지 (B타입)',
      category: '투자연계',
      priority: 7,
      improvement_score: 18,
      price: 10000000,
      duration_weeks: 8,
      description: '포켓데이 참여 및 투자자 연결 프로그램'
    }
  ],

  // TO: Team & Organization (팀 및 조직)
  TO: [
    {
      service_id: 'SVC-CON-005',
      name: '조직 체계화 컨설팅',
      category: '컨설팅',
      priority: 9,
      improvement_score: 15,
      price: 4500000,
      duration_weeks: 4,
      description: '조직 구조 설계 및 R&R 정립'
    },
    {
      service_id: 'SVC-CON-006',
      name: '팀빌딩 프로그램',
      category: '컨설팅',
      priority: 8,
      improvement_score: 12,
      price: 3000000,
      duration_weeks: 3,
      description: '핵심 인재 채용 지원 및 팀 문화 구축'
    },
    {
      service_id: 'SVC-DOC-005',
      name: '채용 패키지',
      category: '문서작업',
      priority: 6,
      improvement_score: 8,
      price: 2000000,
      duration_weeks: 1,
      description: 'JD 작성, 채용 프로세스 설계, 인터뷰 가이드'
    },
    {
      service_id: 'SVC-DEV-003',
      name: '개발팀 셋업 지원',
      category: '개발',
      priority: 7,
      improvement_score: 10,
      price: 5000000,
      duration_weeks: 4,
      description: '개발 프로세스 수립 및 기술 스택 결정 지원'
    }
  ]
};

// 이벤트 카테고리별 축 우선순위 매핑
export const eventCategoryAxisPriority: Record<EventCategory, AxisKey[]> = {
  tips_program: ['PT', 'PF', 'TO'], // 기술, 증빙, 팀
  government_support: ['PF', 'TO', 'PT'], // 증빙, 조직, 기술
  vc_opportunity: ['GO', 'EC', 'TO'], // 성장, 수익, 팀
  open_innovation: ['GO', 'PT', 'TO'], // 실행력, 기술, 팀
  loan_program: ['PF', 'EC', 'GO'], // 신용, 상환, 운영
  accelerator: ['TO', 'PT', 'GO'], // 팀, 제품, 성장
  bidding: ['PF', 'TO', 'PT'], // 자격, 수행, 기술
  batch_program: ['TO', 'PT', 'GO'], // 학습, 기술, 성장
  conference: ['TO', 'PT', 'GO'], // 네트워킹, 기술, 비즈니스
  seminar: ['TO', 'PT', 'GO'] // 학습, 기술, 비즈니스
};

// 프로젝트 추천 함수
export interface ProjectRecommendation {
  axis: AxisKey;
  gap: number; // 요구 점수와 현재 점수의 차이
  services: ServiceRecommendation[];
  totalPrice: number;
  totalDuration: number;
  expectedImprovement: number;
}

export function getRecommendedProjects(
  userScores: Record<AxisKey, number>,
  requirements: Record<AxisKey, number>,
  eventCategory: EventCategory,
  maxProjects: number = 3
): ProjectRecommendation[] {
  const recommendations: ProjectRecommendation[] = [];
  const priorityAxes = eventCategoryAxisPriority[eventCategory];

  // 우선순위 축부터 확인
  priorityAxes.forEach(axis => {
    const gap = requirements[axis] - userScores[axis];

    if (gap > 0) {
      // 해당 축에서 추천 서비스 선택
      const services = axisServiceMapping[axis]
        .filter(s => s.improvement_score >= gap * 0.5) // 갭의 50% 이상 개선 가능한 서비스
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 2); // 축당 최대 2개 서비스

      if (services.length > 0) {
        recommendations.push({
          axis,
          gap,
          services,
          totalPrice: services.reduce((sum, s) => sum + s.price, 0),
          totalDuration: Math.max(...services.map(s => s.duration_weeks)),
          expectedImprovement: Math.min(
            gap,
            services.reduce((sum, s) => sum + s.improvement_score, 0) / services.length
          )
        });
      }
    }
  });

  // 가장 중요한 N개만 반환
  return recommendations
    .sort((a, b) => b.gap - a.gap)
    .slice(0, maxProjects);
}

// 번들 추천 함수
export interface BundleRecommendation {
  name: string;
  description: string;
  services: ServiceRecommendation[];
  originalPrice: number;
  bundlePrice: number;
  discountRate: number;
  totalDuration: number;
  targetAxes: AxisKey[];
}

export function getRecommendedBundles(
  userScores: Record<AxisKey, number>,
  eventCategory: EventCategory
): BundleRecommendation[] {
  const bundles: BundleRecommendation[] = [];

  // TIPS 프로그램용 번들
  if (eventCategory === 'tips_program') {
    const ptScore = userScores.PT || 0;
    const pfScore = userScores.PF || 0;

    if (ptScore < 70 && pfScore < 70) {
      bundles.push({
        name: 'TIPS 완벽 준비 패키지',
        description: '기술 개발과 서류 준비를 한번에',
        services: [
          axisServiceMapping.PT[0], // MVP 개발
          axisServiceMapping.PF[1], // 정부지원 사업계획서
          axisServiceMapping.PT[3]  // R&D 계획서
        ],
        originalPrice: 13000000,
        bundlePrice: 11000000,
        discountRate: 15,
        totalDuration: 8,
        targetAxes: ['PT', 'PF']
      });
    }
  }

  // VC 투자용 번들
  if (eventCategory === 'vc_opportunity') {
    const goScore = userScores.GO || 0;
    const ecScore = userScores.EC || 0;

    if (goScore < 80 && ecScore < 80) {
      bundles.push({
        name: '투자유치 풀 패키지',
        description: 'IR 덱부터 마케팅 전략까지',
        services: [
          axisServiceMapping.PF[0], // IR 덱
          axisServiceMapping.GO[0], // 디지털 마케팅
          axisServiceMapping.EC[0]  // 재무모델링
        ],
        originalPrice: 12500000,
        bundlePrice: 10000000,
        discountRate: 20,
        totalDuration: 6,
        targetAxes: ['GO', 'EC', 'PF']
      });
    }
  }

  return bundles;
}

// 긴급 개선 프로젝트 추천 (마감일 임박한 경우)
export function getUrgentProjects(
  userScores: Record<AxisKey, number>,
  requirements: Record<AxisKey, number>,
  daysUntilDeadline: number
): ServiceRecommendation[] {
  const urgentServices: ServiceRecommendation[] = [];

  // 마감일까지 완료 가능한 서비스만 필터링
  const maxWeeks = Math.floor(daysUntilDeadline / 7);

  Object.entries(requirements).forEach(([axis, required]) => {
    const userScore = userScores[axis as AxisKey] || 0;
    const gap = required - userScore;

    if (gap > 10) { // 10점 이상 부족한 축만
      const services = axisServiceMapping[axis as AxisKey]
        .filter(s => s.duration_weeks <= maxWeeks)
        .sort((a, b) => b.improvement_score - a.improvement_score);

      if (services.length > 0) {
        urgentServices.push(services[0]);
      }
    }
  });

  return urgentServices;
}