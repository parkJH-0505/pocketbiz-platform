// 이벤트 카테고리별 Core5 기준값 정의
import type { EventCategory } from '../types/smartMatchingV2';

export type AxisKey = 'GO' | 'EC' | 'PT' | 'PF' | 'TO';

export interface Core5Requirements {
  GO: number;  // Growth & Operations (성장성 및 운영)
  EC: number;  // Economic (수익성)
  PT: number;  // Product & Technology (제품 및 기술)
  PF: number;  // People & Finance (재무 및 인력)
  TO: number;  // Team & Organization (팀 및 조직)
}

// 카테고리별 Core5 요구사항 및 설명
export const categoryRequirements: Record<EventCategory, {
  requirements: Core5Requirements;
  description: string;
  focusAreas: string[];
  minScore?: number; // 최소 총점 요구사항
}> = {
  // TIPS/R&D 지원사업
  tips_program: {
    requirements: {
      PT: 80,  // 기술혁신성 핵심
      PF: 75,  // 정부과제 증빙 중요
      TO: 70,  // 실행력
      GO: 60,  // 초기여도 무방
      EC: 55   // 수익성 덜 중요
    },
    description: '기술 혁신성과 R&D 역량이 핵심인 프로그램',
    focusAreas: ['기술 혁신성', 'R&D 역량', '증빙 자료'],
    minScore: 340
  },

  // 정부지원사업
  government_support: {
    requirements: {
      PF: 75,  // 서류 준비도
      TO: 70,  // 조직 안정성
      PT: 65,  // 기본 기술력
      GO: 60,  // 성장 가능성
      EC: 55   // 수익성 보다는 공익성
    },
    description: '서류 준비도와 조직 안정성이 중요한 프로그램',
    focusAreas: ['서류 완성도', '조직 안정성', '사업 타당성'],
    minScore: 325
  },

  // VC 투자/데모데이
  vc_opportunity: {
    requirements: {
      GO: 85,  // 성장성 최우선
      EC: 80,  // Unit Economics
      TO: 75,  // 팀 역량
      PT: 70,  // 차별화
      PF: 70   // 투자 레디니스
    },
    description: '폭발적 성장성과 수익성이 핵심인 투자 기회',
    focusAreas: ['성장성', 'Unit Economics', '팀 역량'],
    minScore: 380
  },

  // 오픈이노베이션
  open_innovation: {
    requirements: {
      GO: 75,  // 협업 실행력
      PT: 70,  // 협업 가능 기술
      TO: 70,  // 파트너십 역량
      PF: 65,  // 기업 신뢰성
      EC: 60   // 상업성
    },
    description: '대기업과의 협업 역량이 중요한 프로그램',
    focusAreas: ['협업 역량', '기술 호환성', '실행력'],
    minScore: 340
  },

  // 융자프로그램
  loan_program: {
    requirements: {
      PF: 90,  // 신용도/증빙 최우선
      EC: 75,  // 상환능력
      GO: 65,  // 안정 운영
      TO: 65,  // 실행 신뢰성
      PT: 60   // 혁신성 덜 중요
    },
    description: '재무 건전성과 상환 능력이 핵심인 프로그램',
    focusAreas: ['신용도', '상환 능력', '재무 증빙'],
    minScore: 355
  },

  // 액셀러레이터
  accelerator: {
    requirements: {
      TO: 75,  // 성장 가능 팀
      PT: 70,  // 발전 가능 제품
      GO: 65,  // 초기 트랙션
      PF: 60,  // 기본 준비도
      EC: 55   // 초기여도 무방
    },
    description: '팀의 성장 가능성이 중요한 프로그램',
    focusAreas: ['팀 역량', '제품 발전성', '코칭 수용성'],
    minScore: 325
  },

  // 입찰
  bidding: {
    requirements: {
      PF: 85,  // 공식 자격요건
      TO: 75,  // 수행능력
      PT: 70,  // 기술요구사항
      GO: 65,  // 운영 안정성
      EC: 60   // 가격 경쟁력
    },
    description: '자격요건과 수행능력이 핵심인 입찰',
    focusAreas: ['자격 요건', '수행 실적', '기술 사양'],
    minScore: 355
  },

  // 배치프로그램
  batch_program: {
    requirements: {
      TO: 70,  // 학습 역량
      PT: 65,  // 기술 기반
      GO: 60,  // 성장 의지
      PF: 55,  // 기본 준비
      EC: 50   // 수익성 무관
    },
    description: '학습과 성장 의지가 중요한 프로그램',
    focusAreas: ['학습 역량', '성장 의지', '네트워킹'],
    minScore: 300
  },

  // 컨퍼런스
  conference: {
    requirements: {
      TO: 60,  // 네트워킹 역량
      PT: 55,  // 기술 이해도
      GO: 50,  // 비즈니스 이해
      PF: 45,  // 참가비 지불 능력
      EC: 40   // 수익성 무관
    },
    description: '네트워킹과 학습이 목적인 행사',
    focusAreas: ['네트워킹', '학습', '업계 동향'],
    minScore: 250
  },

  // 세미나
  seminar: {
    requirements: {
      TO: 55,  // 학습 의지
      PT: 50,  // 기술 관심도
      GO: 45,  // 비즈니스 관심
      PF: 40,  // 기본 준비
      EC: 35   // 수익성 무관
    },
    description: '교육과 정보 습득이 목적인 행사',
    focusAreas: ['학습', '정보 습득', '인사이트'],
    minScore: 225
  }
};

// 적합도 계산 함수
export function calculateCompatibility(
  userScores: Core5Requirements,
  requirements: Core5Requirements
): {
  overall: number;
  meetCount: number;
  totalCount: number;
  details: Record<AxisKey, {
    userScore: number;
    required: number;
    isMet: boolean;
    gap: number;
  }>;
} {
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
  let meetCount = 0;
  let totalGap = 0;
  const details: any = {};

  axes.forEach(axis => {
    const userScore = userScores[axis] || 0;
    const required = requirements[axis];
    const isMet = userScore >= required;
    const gap = userScore - required;

    if (isMet) meetCount++;
    totalGap += Math.max(0, gap); // 양수 gap만 합산

    details[axis] = {
      userScore,
      required,
      isMet,
      gap
    };
  });

  // 전체 적합도: 충족 축 비율 60% + 초과 점수 보너스 40%
  const meetRatio = (meetCount / 5) * 60;
  const bonusRatio = Math.min(40, totalGap / 10); // 최대 40점
  const overall = Math.round(meetRatio + bonusRatio);

  return {
    overall: Math.min(100, overall),
    meetCount,
    totalCount: 5,
    details
  };
}

// 카테고리별 중요 축 반환
export function getCriticalAxes(category: EventCategory): AxisKey[] {
  const requirements = categoryRequirements[category].requirements;

  // 점수가 높은 순으로 정렬하여 상위 3개 축 반환
  return (Object.entries(requirements) as [AxisKey, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([axis]) => axis);
}

// 클러스터별 보정값 (선택사항)
export function getClusterAdjustment(
  stage: string,
  sector: string,
  category: EventCategory
): Partial<Core5Requirements> {
  // 예시: A-1 단계는 모든 요구사항 -10점
  if (stage === 'A-1') {
    return {
      GO: -10,
      EC: -10,
      PT: -10,
      PF: -10,
      TO: -10
    };
  }

  // 예시: 바이오 섹터는 PT 요구사항 +10점
  if (sector === 'S-4' && category === 'tips_program') {
    return { PT: 10 };
  }

  return {};
}