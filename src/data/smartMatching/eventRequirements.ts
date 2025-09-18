// 이벤트 카테고리별 Core5 기준값 정의
import type { EventCategory, Core5Requirements } from '../../types/smartMatching';

export type AxisKey = 'GO' | 'EC' | 'PT' | 'PF' | 'TO';

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

  // 융자·보증
  loan_guarantee: {
    requirements: {
      PF: 85,  // 증빙 자료 최우선
      EC: 75,  // 상환능력
      GO: 65,  // 운영 안정성
      TO: 65,  // 실행 신뢰성
      PT: 60   // 기술력 덜 중요
    },
    description: '재무 건전성과 보증 조건이 핵심인 프로그램',
    focusAreas: ['신용도', '보증 조건', '재무 증빙'],
    minScore: 350
  },

  // 바우처
  voucher: {
    requirements: {
      GO: 65,  // 성장 의지
      PF: 60,  // 기본 서류
      PT: 55,  // 기술 이해도
      TO: 50,  // 활용 역량
      EC: 45   // 수익성 덜 중요
    },
    description: '성장 의지와 바우처 활용 능력이 중요한 프로그램',
    focusAreas: ['성장 계획', '바우처 활용', '기술 개발'],
    minScore: 275
  },

  // 글로벌
  global: {
    requirements: {
      GO: 80,  // 해외 확장 역량
      PT: 70,  // 글로벌 경쟁력
      TO: 70,  // 국제 협업 역량
      EC: 65,  // 해외 수익성
      PF: 65   // 글로벌 증빙
    },
    description: '해외 진출 역량과 글로벌 경쟁력이 핵심인 프로그램',
    focusAreas: ['해외 진출', '글로벌 경쟁력', '국제 협업'],
    minScore: 350
  },

  // 공모전
  contest: {
    requirements: {
      PT: 75,  // 혁신성 우선
      GO: 65,  // 성장 가능성
      TO: 60,  // 발표 역량
      PF: 55,  // 기본 자료
      EC: 50   // 수익성 보다 혁신성
    },
    description: '혁신성과 창의성이 중요한 공모전',
    focusAreas: ['혁신성', '창의성', '발표력'],
    minScore: 305
  },

  // 세미나
  seminar: {
    requirements: {
      TO: 55,  // 학습 의지
      PT: 50,  // 기초 지식
      GO: 45,  // 성장 마인드셋
      PF: 40,  // 기본 준비
      EC: 35   // 수익성 무관
    },
    description: '교육과 학습이 주목적인 세미나',
    focusAreas: ['학습', '지식 습득', '네트워킹'],
    minScore: 225
  }
};

// 호환성 계산 함수
export const calculateCompatibility = (
  userScores: Core5Requirements,
  category: EventCategory
): CompatibilityResult => {
  const categoryData = categoryRequirements[category];
  if (!categoryData || !categoryData.requirements) {
    return {
      overallScore: 0,
      details: {} as Record<keyof Core5Requirements, boolean>,
      meetCount: 0,
      totalCount: 0,
      percentage: 0,
      suggestedFocus: [],
      marketFit: 'Poor'
    };
  }
  const requirements = categoryData.requirements;
  const details: Record<keyof Core5Requirements, boolean> = {} as any;
  let meetCount = 0;

  (Object.keys(requirements) as Array<keyof Core5Requirements>).forEach(key => {
    const userScore = userScores[key];
    const requiredScore = requirements[key];
    const isMet = userScore >= requiredScore;

    details[key] = isMet;
    if (isMet) meetCount++;
  });

  const totalCount = Object.keys(requirements).length;
  const isCompatible = meetCount >= Math.ceil(totalCount * 0.6); // 60% 이상 충족시 호환

  return {
    isCompatible,
    meetCount,
    totalCount,
    details
  };
};

// 매칭 점수 계산 (카테고리별 가중치 적용)
export const calculateMatchingScore = (
  userScores: Core5Requirements,
  category: EventCategory
): number => {
  const requirements = categoryRequirements[category].requirements;
  const weights = getAxisWeights(category);

  let totalScore = 0;
  let totalWeight = 0;

  (Object.keys(requirements) as Array<keyof Core5Requirements>).forEach(key => {
    const userScore = userScores[key];
    const requiredScore = requirements[key];
    const weight = weights[key] || 1;

    // 점수 비율 계산 (초과시 보너스)
    const ratio = userScore / requiredScore;
    const adjustedRatio = Math.min(ratio, 1.2); // 최대 120%

    totalScore += adjustedRatio * weight;
    totalWeight += weight;
  });

  return Math.round((totalScore / totalWeight) * 100);
};

// 카테고리별 축 가중치
const getAxisWeights = (category: EventCategory): Record<keyof Core5Requirements, number> => {
  const weights: Record<EventCategory, Record<keyof Core5Requirements, number>> = {
    tips_program: { PT: 3, PF: 2, TO: 1.5, GO: 1, EC: 0.8 },
    government_support: { PF: 2.5, TO: 2, PT: 1.5, GO: 1, EC: 0.8 },
    vc_opportunity: { GO: 3, EC: 2.5, TO: 2, PT: 1.5, PF: 1 },
    open_innovation: { GO: 2, PT: 2, TO: 2, PF: 1.5, EC: 1 },
    loan_guarantee: { PF: 3, EC: 2.5, GO: 1.5, TO: 1.5, PT: 1 },
    voucher: { GO: 2, PF: 1.5, PT: 1.3, TO: 1.2, EC: 0.9 },
    global: { GO: 2.8, PT: 2.2, TO: 2, EC: 1.8, PF: 1.5 },
    contest: { PT: 2.5, GO: 2, TO: 1.8, PF: 1.3, EC: 1 },
    loan_program: { PF: 3, EC: 2.5, GO: 1.5, TO: 1.5, PT: 1 },
    accelerator: { TO: 2.5, PT: 2, GO: 1.5, PF: 1, EC: 0.8 },
    bidding: { PF: 3, TO: 2, PT: 1.8, GO: 1.5, EC: 1.2 },
    batch_program: { TO: 2, PT: 1.5, GO: 1.2, PF: 1, EC: 0.8 },
    conference: { TO: 1.5, PT: 1.2, GO: 1, PF: 0.8, EC: 0.6 },
    seminar: { TO: 1.3, PT: 1, GO: 0.9, PF: 0.8, EC: 0.6 }
  };

  return weights[category];
};

// 갭 분석 함수
export const analyzeGaps = (
  userScores: Core5Requirements,
  category: EventCategory
): { gaps: Record<keyof Core5Requirements, number>, criticalGaps: Array<keyof Core5Requirements> } => {
  const requirements = categoryRequirements[category].requirements;
  const gaps: Record<keyof Core5Requirements, number> = {} as any;
  const criticalGaps: Array<keyof Core5Requirements> = [];

  (Object.keys(requirements) as Array<keyof Core5Requirements>).forEach(key => {
    const gap = requirements[key] - userScores[key];
    gaps[key] = gap;

    if (gap > 10) { // 10점 이상 부족시 심각한 갭
      criticalGaps.push(key);
    }
  });

  return { gaps, criticalGaps };
};

// CompatibilityResult 타입 정의
export interface CompatibilityResult {
  isCompatible: boolean;
  meetCount: number;
  totalCount: number;
  details: Record<keyof Core5Requirements, boolean>;
}