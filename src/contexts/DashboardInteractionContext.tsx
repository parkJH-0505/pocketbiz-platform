/**
 * Dashboard Interaction Context
 *
 * 대시보드 컴포넌트 간 상호작용 관리
 * - 드래그&드롭 상태 관리
 * - 이벤트 상태 관리 (관심, 무시)
 * - 모달 및 알림 시스템
 * - 크로스 컴포넌트 액션 함수들
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

// 스마트매칭 이벤트 타입 (임시)
interface SmartMatchingEvent {
  id: string;
  title: string;
  daysUntilDeadline: number;
  matchingScore?: number;
  urgencyLevel?: string;
  [key: string]: any;
}

interface DashboardInteractionContextType {
  // 드래그&드롭 상태 관리
  draggedEvent: SmartMatchingEvent | null;
  setDraggedEvent: (event: SmartMatchingEvent | null) => void;
  hoveredDay: string | null;
  setHoveredDay: (day: string | null) => void;

  // 이벤트 상태 관리
  interestedEvents: Set<string>;
  dismissedEvents: Set<string>;

  // 액션 함수들
  addEventToCalendar: (event: SmartMatchingEvent, targetDate: Date) => Promise<boolean>;
  markEventInterested: (eventId: string) => void;
  dismissEvent: (eventId: string) => void;

  // UI 상태 관리
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  modalEvent: any | null;
  showEventModal: (event: any) => void;
  hideModal: () => void;
}

const DashboardInteractionContext = createContext<DashboardInteractionContextType | undefined>(undefined);

export const useDashboardInteraction = () => {
  const context = useContext(DashboardInteractionContext);
  if (!context) {
    throw new Error('useDashboardInteraction must be used within DashboardInteractionProvider');
  }
  return context;
};

interface DashboardInteractionProviderProps {
  children: ReactNode;
}

export const DashboardInteractionProvider: React.FC<DashboardInteractionProviderProps> = ({ children }) => {
  // 드래그&드롭 상태
  const [draggedEvent, setDraggedEvent] = useState<SmartMatchingEvent | null>(null);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  // 이벤트 상태 (localStorage 기반)
  const [interestedEvents, setInterestedEvents] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('dashboard_interested_events');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  });

  const [dismissedEvents, setDismissedEvents] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('dashboard_dismissed_events');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  });

  // 모달 상태
  const [modalEvent, setModalEvent] = useState<any | null>(null);

  // 액션 함수들
  const addEventToCalendar = async (event: SmartMatchingEvent, targetDate: Date): Promise<boolean> => {
    try {
      // TODO: Phase 2에서 실제 transformSmartMatchingEvent 함수 연동
      console.log('Adding event to calendar:', { event, targetDate });

      // 성공 시뮬레이션
      showToast('일정이 추가되었습니다!', 'success');
      return true;
    } catch (error) {
      showToast('일정 추가 중 오류가 발생했습니다.', 'error');
      return false;
    }
  };

  const markEventInterested = (eventId: string) => {
    setInterestedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
        showToast('관심 이벤트에서 제거되었습니다.', 'info');
      } else {
        newSet.add(eventId);
        showToast('관심 이벤트에 추가되었습니다!', 'success');
      }

      // localStorage 저장
      localStorage.setItem('dashboard_interested_events', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const dismissEvent = (eventId: string) => {
    setDismissedEvents(prev => {
      const newSet = new Set(prev);
      newSet.add(eventId);

      // localStorage 저장
      localStorage.setItem('dashboard_dismissed_events', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
    showToast('이벤트를 숨겼습니다.', 'info');
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    // TODO: Phase 4에서 실제 토스트 컴포넌트 연동
    console.log(`Toast [${type}]: ${message}`);
  };

  const showEventModal = (event: any) => {
    setModalEvent(event);
  };

  const hideModal = () => {
    setModalEvent(null);
  };

  const value: DashboardInteractionContextType = {
    // 드래그&드롭 상태
    draggedEvent,
    setDraggedEvent,
    hoveredDay,
    setHoveredDay,

    // 이벤트 상태
    interestedEvents,
    dismissedEvents,

    // 액션 함수들
    addEventToCalendar,
    markEventInterested,
    dismissEvent,

    // UI 상태 관리
    showToast,
    modalEvent,
    showEventModal,
    hideModal,
  };

  return (
    <DashboardInteractionContext.Provider value={value}>
      {children}
    </DashboardInteractionContext.Provider>
  );
};

export default DashboardInteractionProvider;