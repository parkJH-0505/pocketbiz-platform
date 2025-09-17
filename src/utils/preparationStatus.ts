/**
 * 이벤트 준비 가능성 판단 로직
 * 사용자의 서류 보유 상태와 마감일을 기반으로
 * 실제로 지원 가능한지 판단
 */

import type { EventCategory } from '../types/smartMatchingV2';
import type { UserDocumentStatus } from '../types/userDocument.types';
import {
  categoryDocumentRequirements,
  PREPARATION_TIME,
  type DocumentRequirements
} from '../data/documentRequirements';

/**
 * 준비 상태 타입
 */
export type PreparationStatus =
  | 'ready'          // 바로 지원 가능
  | 'optimal'        // 충분한 준비시간 (4주+)
  | 'possible'       // 가능하지만 서둘러야 (3-4주)
  | 'tight'          // 빠듯함 (2-3주)
  | 'insufficient'   // 시간 부족 (2주 미만)
  | 'impossible';    // 불가능

/**
 * 준비 상태 상세 정보
 */
export interface PreparationInfo {
  status: PreparationStatus;
  requiredDays: number;        // 필요한 준비 일수
  remainingDays: number;        // 마감까지 남은 일수
  missingDocuments: string[];  // 부족한 서류 목록
  readyDocuments: string[];    // 보유한 서류 목록
  canApply: boolean;           // 지원 가능 여부
  message: string;             // 사용자에게 보여줄 메시지
}

/**
 * 마감일까지 남은 일수 계산
 */
export function calculateDaysUntilDeadline(deadline: Date): number {
  const now = new Date();
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * 필요한 준비 시간 계산
 */
export function calculateRequiredPreparationTime(
  requirements: DocumentRequirements,
  userDocs: UserDocumentStatus
): number {
  let maxDays = 0;

  // 사업계획서: 무조건 재작성 필요
  if (requirements.needs_business_plan) {
    maxDays = Math.max(maxDays, PREPARATION_TIME.BUSINESS_PLAN);
  }

  // IR덱: 없으면 작성 필요
  if (requirements.needs_ir_deck && !userDocs.has_ir_deck) {
    maxDays = Math.max(maxDays, PREPARATION_TIME.IR_DECK);
  }

  // 재무제표: 없으면 준비 필요
  if (requirements.needs_financial_statement && !userDocs.has_financial_statement) {
    maxDays = Math.max(maxDays, PREPARATION_TIME.FINANCIAL_STATEMENT);
  }

  // 특허문서: 없으면 준비 필요
  if (requirements.needs_patent_doc && !userDocs.has_patent_doc) {
    maxDays = Math.max(maxDays, PREPARATION_TIME.PATENT_DOC);
  }

  // 여유 기간 추가
  if (maxDays > 0) {
    maxDays += PREPARATION_TIME.BUFFER;
  }

  return maxDays;
}

/**
 * 부족한 서류 목록 생성
 */
export function getMissingDocuments(
  requirements: DocumentRequirements,
  userDocs: UserDocumentStatus
): string[] {
  const missing: string[] = [];

  if (requirements.needs_business_plan) {
    missing.push('사업계획서 (재작성 필요)');
  }

  if (requirements.needs_ir_deck && !userDocs.has_ir_deck) {
    missing.push('IR덱');
  }

  if (requirements.needs_financial_statement && !userDocs.has_financial_statement) {
    missing.push('재무제표');
  }

  if (requirements.needs_patent_doc && !userDocs.has_patent_doc) {
    missing.push('특허/지재권 문서');
  }

  return missing;
}

/**
 * 보유한 서류 목록 생성
 */
export function getReadyDocuments(
  requirements: DocumentRequirements,
  userDocs: UserDocumentStatus
): string[] {
  const ready: string[] = [];

  if (requirements.needs_ir_deck && userDocs.has_ir_deck) {
    ready.push('IR덱');
  }

  if (requirements.needs_financial_statement && userDocs.has_financial_statement) {
    ready.push('재무제표');
  }

  if (requirements.needs_patent_doc && userDocs.has_patent_doc) {
    ready.push('특허/지재권 문서');
  }

  return ready;
}

/**
 * 준비 상태 판단
 */
export function determinePreparationStatus(
  remainingDays: number,
  requiredDays: number,
  requirements: DocumentRequirements
): PreparationStatus {
  // 서류가 필요 없는 경우 (컨퍼런스, 세미나 등)
  if (requiredDays === 0) {
    return 'ready';
  }

  // 사업계획서가 필요한 경우
  if (requirements.needs_business_plan) {
    if (remainingDays >= PREPARATION_TIME.BUSINESS_PLAN) {
      return 'optimal';  // 4주 이상
    } else if (remainingDays >= PREPARATION_TIME.BUSINESS_PLAN_MIN) {
      return 'possible'; // 3-4주
    } else {
      return 'insufficient'; // 3주 미만
    }
  }

  // 사업계획서 없이 다른 서류만 필요한 경우
  if (remainingDays >= requiredDays + 7) {
    return 'optimal';  // 충분한 여유
  } else if (remainingDays >= requiredDays) {
    return 'possible'; // 가능하지만 서둘러야
  } else if (remainingDays >= requiredDays - 3) {
    return 'tight';    // 매우 빠듯함
  } else {
    return 'insufficient'; // 불가능
  }
}

/**
 * 상태별 메시지 생성
 */
export function getStatusMessage(status: PreparationStatus, missingDocs: string[]): string {
  switch (status) {
    case 'ready':
      return '바로 지원 가능합니다';

    case 'optimal':
      return '충분한 준비 시간이 있습니다';

    case 'possible':
      return '지금 시작하면 준비 가능합니다';

    case 'tight':
      return '매우 서둘러야 합니다';

    case 'insufficient':
      if (missingDocs.some(doc => doc.includes('사업계획서'))) {
        return '사업계획서 작성 시간이 부족합니다 (최소 3주 필요)';
      }
      return '서류 준비 시간이 부족합니다';

    case 'impossible':
      return '마감일이 지났거나 준비가 불가능합니다';

    default:
      return '';
  }
}

/**
 * 메인 함수: 이벤트 준비 가능성 종합 판단
 */
export function getPreparationInfo(
  eventCategory: EventCategory,
  deadline: Date,
  userDocs: UserDocumentStatus
): PreparationInfo {
  const requirements = categoryDocumentRequirements[eventCategory];
  const remainingDays = calculateDaysUntilDeadline(deadline);
  const requiredDays = calculateRequiredPreparationTime(requirements, userDocs);
  const missingDocuments = getMissingDocuments(requirements, userDocs);
  const readyDocuments = getReadyDocuments(requirements, userDocs);

  // 마감일이 지난 경우
  if (remainingDays <= 0) {
    return {
      status: 'impossible',
      requiredDays,
      remainingDays: 0,
      missingDocuments,
      readyDocuments,
      canApply: false,
      message: '마감일이 지났습니다'
    };
  }

  const status = determinePreparationStatus(remainingDays, requiredDays, requirements);
  const canApply = status === 'ready' || status === 'optimal' || status === 'possible';

  return {
    status,
    requiredDays,
    remainingDays,
    missingDocuments,
    readyDocuments,
    canApply,
    message: getStatusMessage(status, missingDocuments)
  };
}

/**
 * 우선순위 점수 계산 (정렬용)
 * 높을수록 우선순위가 높음
 */
export function calculatePriorityScore(info: PreparationInfo): number {
  const statusScores: Record<PreparationStatus, number> = {
    'optimal': 100,      // 최적 타이밍
    'ready': 90,        // 바로 가능
    'possible': 70,     // 가능
    'tight': 40,        // 빠듯
    'insufficient': 10, // 불가능
    'impossible': 0     // 마감
  };

  let score = statusScores[info.status] || 0;

  // 준비 가능한 경우 보너스
  if (info.canApply) {
    score += 50;
  }

  // 남은 시간이 적절한 경우 보너스 (20-40일)
  if (info.remainingDays >= 20 && info.remainingDays <= 40) {
    score += 20;
  }

  return score;
}