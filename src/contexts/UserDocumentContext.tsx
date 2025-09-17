import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserDocumentStatus } from '../types/userDocument.types';
import { documentStatusUtils, DEFAULT_DOCUMENT_STATUS } from '../types/userDocument.types';

interface UserDocumentContextType {
  documentStatus: UserDocumentStatus;
  updateDocumentStatus: (updates: Partial<UserDocumentStatus>) => void;
  resetDocumentStatus: () => void;
  shouldShowCheckModal: boolean;
  setShouldShowCheckModal: (show: boolean) => void;
}

const UserDocumentContext = createContext<UserDocumentContextType | undefined>(undefined);

export function UserDocumentProvider({ children }: { children: ReactNode }) {
  const [documentStatus, setDocumentStatus] = useState<UserDocumentStatus>(DEFAULT_DOCUMENT_STATUS);
  const [shouldShowCheckModal, setShouldShowCheckModal] = useState(false);

  // 컴포넌트 마운트시 localStorage에서 상태 로드
  useEffect(() => {
    const loadedStatus = documentStatusUtils.load();
    setDocumentStatus(loadedStatus);

    // 아직 체크하지 않은 경우 모달 표시 플래그 설정
    if (!loadedStatus.is_checked) {
      setShouldShowCheckModal(true);
    }
  }, []);

  const updateDocumentStatus = (updates: Partial<UserDocumentStatus>) => {
    const updatedStatus = documentStatusUtils.update(updates);
    setDocumentStatus(updatedStatus);
  };

  const resetDocumentStatus = () => {
    documentStatusUtils.reset();
    setDocumentStatus(DEFAULT_DOCUMENT_STATUS);
    setShouldShowCheckModal(true);
  };

  const value: UserDocumentContextType = {
    documentStatus,
    updateDocumentStatus,
    resetDocumentStatus,
    shouldShowCheckModal,
    setShouldShowCheckModal
  };

  return (
    <UserDocumentContext.Provider value={value}>
      {children}
    </UserDocumentContext.Provider>
  );
}

export function useUserDocument() {
  const context = useContext(UserDocumentContext);
  if (context === undefined) {
    throw new Error('useUserDocument must be used within a UserDocumentProvider');
  }
  return context;
}