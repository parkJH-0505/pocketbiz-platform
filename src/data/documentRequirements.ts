/**
 * 이벤트 카테고리별 필수 서류 요구사항 매핑
 * 각 프로그램 유형별로 어떤 서류가 필요한지 정의
 */

import type { EventCategory } from '../types/smartMatchingV2';

/**
 * 서류 요구사항 타입
 */
export interface DocumentRequirements {
  // 사업계획서 필요 여부 (매번 새로 작성 필요)
  needs_business_plan: boolean;

  // IR덱 필요 여부 (재사용 가능)
  needs_ir_deck: boolean;

  // 재무제표 필요 여부
  needs_financial_statement: boolean;

  // 특허/지재권 문서 필요 여부
  needs_patent_doc: boolean;

  // 추가 설명
  description?: string;
}

/**
 * 준비 시간 상수 (일 단위)
 */
export const PREPARATION_TIME = {
  BUSINESS_PLAN: 28,      // 사업계획서: 4주 (28일)
  BUSINESS_PLAN_MIN: 21,  // 사업계획서 최소: 3주 (21일)
  IR_DECK: 14,            // IR덱: 2주 (14일)
  FINANCIAL_STATEMENT: 7,  // 재무제표: 1주 (7일)
  PATENT_DOC: 7,          // 특허문서: 1주 (7일)
  BUFFER: 3               // 여유 기간: 3일
} as const;

/**
 * 카테고리별 필수 서류 매핑
 * 실제 현장 경험을 기반으로 구성
 */
export const categoryDocumentRequirements: Record<EventCategory, DocumentRequirements> = {
  // 정부지원사업 - 사업계획서 필수, 재무제표 필수
  government_support: {
    needs_business_plan: true,
    needs_ir_deck: false,
    needs_financial_statement: true,
    needs_patent_doc: false,
    description: '정부 양식 사업계획서 및 재무제표 필수'
  },

  // TIPS 프로그램 - 모든 서류 필수
  tips_program: {
    needs_business_plan: true,
    needs_ir_deck: true,
    needs_financial_statement: true,
    needs_patent_doc: true,
    description: 'TIPS용 사업계획서, IR, 재무제표, 기술증빙 모두 필요'
  },

  // 오픈이노베이션 - 사업계획서, IR 필수
  open_innovation: {
    needs_business_plan: true,
    needs_ir_deck: true,
    needs_financial_statement: false,
    needs_patent_doc: false,
    description: '기업 협업 제안서 및 IR 발표자료 필수'
  },

  // VC 투자 기회 - IR덱만 필수
  vc_opportunity: {
    needs_business_plan: false,
    needs_ir_deck: true,
    needs_financial_statement: true,
    needs_patent_doc: false,
    description: 'IR덱과 최근 재무제표 필수'
  },

  // 액셀러레이터 - IR덱 필수
  accelerator: {
    needs_business_plan: false,
    needs_ir_deck: true,
    needs_financial_statement: false,
    needs_patent_doc: false,
    description: 'IR 피칭덱 필수'
  },

  // 대출 프로그램 - 재무제표 필수
  loan_program: {
    needs_business_plan: false,
    needs_ir_deck: false,
    needs_financial_statement: true,
    needs_patent_doc: false,
    description: '재무제표 및 신용 관련 서류 필수'
  },

  // 입찰 - 사업계획서 필수
  bidding: {
    needs_business_plan: true,
    needs_ir_deck: false,
    needs_financial_statement: true,
    needs_patent_doc: false,
    description: '제안서 및 재무 건전성 증빙 필수'
  },

  // 배치 프로그램 - IR덱 권장
  batch_program: {
    needs_business_plan: false,
    needs_ir_deck: true,
    needs_financial_statement: false,
    needs_patent_doc: false,
    description: 'IR덱 제출 권장'
  },

  // 컨퍼런스 - 서류 불필요
  conference: {
    needs_business_plan: false,
    needs_ir_deck: false,
    needs_financial_statement: false,
    needs_patent_doc: false,
    description: '별도 서류 불필요, 참가 신청서만 작성'
  },

  // 세미나 - 서류 불필요
  seminar: {
    needs_business_plan: false,
    needs_ir_deck: false,
    needs_financial_statement: false,
    needs_patent_doc: false,
    description: '별도 서류 불필요, 참가 신청서만 작성'
  }
};

/**
 * 카테고리별 준비 난이도 레벨
 */
export type PreparationLevel = 'easy' | 'medium' | 'hard' | 'very_hard';

/**
 * 준비 난이도 계산
 */
export function getPreparationLevel(category: EventCategory): PreparationLevel {
  const req = categoryDocumentRequirements[category];

  const requiredDocsCount = [
    req.needs_business_plan,
    req.needs_ir_deck,
    req.needs_financial_statement,
    req.needs_patent_doc
  ].filter(Boolean).length;

  if (req.needs_business_plan && requiredDocsCount >= 3) return 'very_hard';
  if (req.needs_business_plan) return 'hard';
  if (requiredDocsCount >= 2) return 'medium';
  return 'easy';
}