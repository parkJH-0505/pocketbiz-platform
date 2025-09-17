/**
 * 사용자 서류 보유 상태 타입 정의
 * IR덱과 기타 필수 서류들의 보유 여부를 추적
 */

export interface UserDocumentStatus {
  // IR덱 보유 여부 (재사용 가능한 서류)
  has_ir_deck: boolean;

  // IR덱 마지막 업데이트 날짜
  ir_deck_updated: Date | null;

  // 특허/지재권 문서 보유 여부
  has_patent_doc: boolean;

  // 재무제표 보유 여부 (최근 1년 이내)
  has_financial_statement: boolean;

  // 마지막 상태 업데이트 시각
  last_checked: Date;

  // 사용자가 체크를 완료했는지 여부
  is_checked: boolean;
}

/**
 * localStorage 키
 */
export const USER_DOCUMENT_STORAGE_KEY = 'user_document_status';

/**
 * 기본값
 */
export const DEFAULT_DOCUMENT_STATUS: UserDocumentStatus = {
  has_ir_deck: false,
  ir_deck_updated: null,
  has_patent_doc: false,
  has_financial_statement: false,
  last_checked: new Date(),
  is_checked: false
};

/**
 * 서류 상태 관리 유틸리티
 */
export const documentStatusUtils = {
  /**
   * localStorage에서 서류 상태 불러오기
   */
  load(): UserDocumentStatus {
    try {
      const stored = localStorage.getItem(USER_DOCUMENT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Date 객체 복원
        return {
          ...parsed,
          ir_deck_updated: parsed.ir_deck_updated ? new Date(parsed.ir_deck_updated) : null,
          last_checked: new Date(parsed.last_checked)
        };
      }
    } catch (error) {
      console.error('Failed to load document status:', error);
    }
    return DEFAULT_DOCUMENT_STATUS;
  },

  /**
   * localStorage에 서류 상태 저장
   */
  save(status: UserDocumentStatus): void {
    try {
      localStorage.setItem(USER_DOCUMENT_STORAGE_KEY, JSON.stringify(status));
    } catch (error) {
      console.error('Failed to save document status:', error);
    }
  },

  /**
   * 서류 상태 업데이트
   */
  update(updates: Partial<UserDocumentStatus>): UserDocumentStatus {
    const current = documentStatusUtils.load();
    const updated = {
      ...current,
      ...updates,
      last_checked: new Date()
    };
    documentStatusUtils.save(updated);
    return updated;
  },

  /**
   * 서류 상태 초기화
   */
  reset(): void {
    documentStatusUtils.save(DEFAULT_DOCUMENT_STATUS);
  }
};