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
import { useScheduleContext } from './ScheduleContext';
import type { GeneralSchedule } from '../types/schedule.types';
import type { SmartMatchingEvent } from '../types/smartMatching';

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
  // ScheduleContext 가져오기
  const scheduleContext = useScheduleContext();

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
      // SmartMatchingEvent를 GeneralSchedule로 변환
      const newSchedule: Omit<GeneralSchedule, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'external_meeting', // 스마트매칭 이벤트를 외부 미팅으로 분류
        title: event.title,
        date: targetDate,
        time: '10:00', // 기본 시간 설정
        location: event.hostOrganization || '온라인',
        participants: ['나'],
        status: 'scheduled',
        priority: event.urgencyLevel === 'high' ? 'high' : event.urgencyLevel === 'medium' ? 'medium' : 'low',
        description: event.description,
        createdBy: 'current-user',

        // 스마트매칭 관련 메타데이터 저장
        metadata: {
          source: 'smart_matching',
          originalEventId: event.id,
          category: event.category,
          programType: event.programType,
          hostOrganization: event.hostOrganization,
          applicationDeadline: event.applicationEndDate?.toISOString(),
          fundingAmount: event.fundingAmount,
          matchingScore: event.matchingScore,
          daysUntilDeadline: event.daysUntilDeadline
        },

        // 마감일이 있으면 리마인더 설정
        reminder: event.applicationEndDate ? {
          enabled: true,
          time: new Date(event.applicationEndDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3일 전 리마인더
          type: 'email'
        } : undefined
      };

      // ScheduleContext를 통해 일정 추가
      const createdSchedule = await scheduleContext.createSchedule(newSchedule);

      console.log('Schedule created successfully:', createdSchedule);
      showToast(`'${event.title}' 일정이 캘린더에 추가되었습니다!`, 'success');

      // 관심 이벤트로 자동 마킹
      markEventInterested(event.id);

      return true;
    } catch (error) {
      console.error('Failed to add event to calendar:', error);
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