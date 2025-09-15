import type { ProjectPhase } from '../types/buildup.types';

/**
 * 프로젝트 단계 관리 유틸리티
 * 7단계 진행 상태 시스템
 */

// 단계별 정보
export const PHASE_INFO: Record<ProjectPhase, {
  order: number;
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  contract_pending: {
    order: 1,
    label: '계약중',
    shortLabel: '계약',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: '견적서 전달 및 검토 중'
  },
  contract_signed: {
    order: 2,
    label: '계약완료',
    shortLabel: '입금',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: '입금 완료 및 프로젝트 준비'
  },
  planning: {
    order: 3,
    label: '기획',
    shortLabel: '기획',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: '프로젝트 기획 및 요구사항 정의'
  },
  design: {
    order: 4,
    label: '설계',
    shortLabel: '설계',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    description: '상세 설계 및 디자인 작업'
  },
  execution: {
    order: 5,
    label: '실행',
    shortLabel: '실행',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: '실제 구현 및 개발 진행'
  },
  review: {
    order: 6,
    label: '검토',
    shortLabel: '검토',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'QA 및 최종 검토'
  },
  completed: {
    order: 7,
    label: '완료',
    shortLabel: '완료',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: '프로젝트 종료'
  }
};

// 모든 단계 목록
export const ALL_PHASES: ProjectPhase[] = [
  'contract_pending',
  'contract_signed',
  'planning',
  'design',
  'execution',
  'review',
  'completed'
];

// 진행중 단계들 (PM이 관리하는 단계)
export const ACTIVE_PHASES: ProjectPhase[] = [
  'planning',
  'design',
  'execution',
  'review'
];

/**
 * 현재 단계를 기반으로 진행률 계산 (0-100)
 * 각 단계는 약 14.3%씩 차지 (100/7)
 */
export function calculatePhaseProgress(phase: ProjectPhase): number {
  const phaseInfo = PHASE_INFO[phase];
  if (!phaseInfo) return 0;

  // 각 단계당 14.3%, 완료 시 100%
  return Math.round((phaseInfo.order / 7) * 100);
}

/**
 * 단계 인덱스 가져오기 (0-6)
 */
export function getPhaseIndex(phase: ProjectPhase): number {
  return PHASE_INFO[phase].order - 1;
}

/**
 * 다음 단계 가져오기
 */
export function getNextPhase(currentPhase: ProjectPhase): ProjectPhase | null {
  const currentIndex = getPhaseIndex(currentPhase);
  if (currentIndex >= 6) return null;
  return ALL_PHASES[currentIndex + 1];
}

/**
 * 이전 단계 가져오기
 */
export function getPreviousPhase(currentPhase: ProjectPhase): ProjectPhase | null {
  const currentIndex = getPhaseIndex(currentPhase);
  if (currentIndex <= 0) return null;
  return ALL_PHASES[currentIndex - 1];
}

/**
 * 단계가 진행중인지 확인
 */
export function isActivePhase(phase: ProjectPhase): boolean {
  return ACTIVE_PHASES.includes(phase);
}

/**
 * 단계 변경 가능 여부 확인 (비즈니스 로직)
 */
export function canChangePhase(
  currentPhase: ProjectPhase,
  newPhase: ProjectPhase,
  isAdmin: boolean = false
): boolean {
  // 관리자는 모든 변경 가능
  if (isAdmin) return true;

  // 계약중 → 계약완료는 입금 확인 시스템이 자동 처리
  if (currentPhase === 'contract_pending' && newPhase === 'contract_signed') {
    return false; // PM이 수동으로 변경 불가
  }

  // 진행중 단계들 간에는 PM이 변경 가능
  if (isActivePhase(currentPhase) && isActivePhase(newPhase)) {
    return true;
  }

  // 계약완료 → 기획은 PM이 시작 가능
  if (currentPhase === 'contract_signed' && newPhase === 'planning') {
    return true;
  }

  // 검토 → 완료는 PM이 처리 가능
  if (currentPhase === 'review' && newPhase === 'completed') {
    return true;
  }

  return false;
}

/**
 * 단계별 예상 소요 시간 (일)
 */
export function getPhaseEstimatedDuration(phase: ProjectPhase, serviceCategory?: string): number {
  const baseDurations: Record<ProjectPhase, number> = {
    contract_pending: 3,   // 3일
    contract_signed: 1,    // 1일
    planning: 5,           // 5일
    design: 7,             // 7일
    execution: 14,         // 14일
    review: 3,             // 3일
    completed: 0           // 0일
  };

  // 서비스 카테고리별 조정 가능
  let duration = baseDurations[phase];

  if (serviceCategory === '개발' && phase === 'execution') {
    duration = 21; // 개발은 실행 단계가 더 김
  }

  return duration;
}

/**
 * 자동 단계 전환 체크 (서버에서 처리할 로직)
 */
export function checkAutoPhaseTransition(
  phase: ProjectPhase,
  paymentConfirmed?: boolean,
  quoteSent?: boolean
): ProjectPhase {
  // 견적서 전송 시 자동으로 계약중
  if (!phase && quoteSent) {
    return 'contract_pending';
  }

  // 입금 확인 시 자동으로 계약완료
  if (phase === 'contract_pending' && paymentConfirmed) {
    return 'contract_signed';
  }

  return phase;
}