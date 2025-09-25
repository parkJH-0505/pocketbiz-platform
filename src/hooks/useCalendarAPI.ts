/**
 * 캘린더 API 연동을 위한 커스텀 훅
 * 더미 데이터에서 실제 API로의 완전한 전환 지원
 */

import { useState, useEffect, useCallback } from 'react';
import { smartMatching, urgent, todoDocuments, calendar } from '../services/api';
import { comprehensiveEvents } from '../data/smartMatching/comprehensiveEvents';
import type { MatchingResult } from '../types/smartMatching/types';

// API 모드 설정 (환경변수로 제어)
const USE_REAL_API = import.meta.env.VITE_USE_REAL_API === 'true';

interface UseCalendarAPIReturn {
  // 데이터 상태
  smartMatchingEvents: MatchingResult[];
  urgentItems: any[];
  todoItems: any[];

  // 로딩 상태
  isLoading: boolean;
  error: string | null;

  // 액션 함수들
  refreshSmartMatching: () => Promise<void>;
  refreshUrgentItems: () => Promise<void>;
  refreshTodoItems: () => Promise<void>;
  addEventToCalendar: (eventData: any, date: Date) => Promise<boolean>;

  // 탭 카운트
  tabCounts: {
    smart_matching: number;
    urgent: number;
    todo_docs: number;
  };
}

export const useCalendarAPI = (searchQuery: string = ''): UseCalendarAPIReturn => {
  // 상태 관리
  const [smartMatchingEvents, setSmartMatchingEvents] = useState<MatchingResult[]>([]);
  const [urgentItems, setUrgentItems] = useState<any[]>([]);
  const [todoItems, setTodoItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 스마트매칭 이벤트 로드
  const refreshSmartMatching = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (USE_REAL_API) {
        // 실제 API 호출
        const events = await smartMatching.getEvents({
          search: searchQuery.trim() || undefined,
          limit: 50
        });
        setSmartMatchingEvents(events);
      } else {
        // 더미 데이터 사용 (기존 로직 유지)
        const filtered = comprehensiveEvents.filter(event => {
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            return event.title.toLowerCase().includes(query) ||
                   event.description.toLowerCase().includes(query) ||
                   event.tags.some(tag => tag.toLowerCase().includes(query));
          }
          return true;
        });
        setSmartMatchingEvents(filtered);
      }
    } catch (err) {
      console.error('Failed to load smart matching events:', err);
      setError('스마트매칭 이벤트를 불러오는데 실패했습니다.');

      // 에러 시 더미 데이터로 폴백
      setSmartMatchingEvents(comprehensiveEvents);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  // 긴급사항 로드
  const refreshUrgentItems = useCallback(async () => {
    try {
      if (USE_REAL_API) {
        const items = await urgent.getItems();
        setUrgentItems(items);
      } else {
        // 더미 긴급사항 데이터
        setUrgentItems([
          { id: 'urgent-1', title: '투자 서류 마감', type: 'deadline', priority: 'high' },
          { id: 'urgent-2', title: 'KPI 리포트 제출', type: 'task', priority: 'medium' },
          { id: 'urgent-3', title: '법무 검토 필요', type: 'legal', priority: 'high' },
          { id: 'urgent-4', title: '자금 조달 회의', type: 'meeting', priority: 'high' },
          { id: 'urgent-5', title: '특허 출원 마감', type: 'deadline', priority: 'medium' }
        ]);
      }
    } catch (err) {
      console.error('Failed to load urgent items:', err);
      setUrgentItems([]);
    }
  }, []);

  // 할일문서 로드
  const refreshTodoItems = useCallback(async () => {
    try {
      if (USE_REAL_API) {
        const items = await todoDocuments.getItems();
        setTodoItems(items);
      } else {
        // BuildupContext와 VDRContext에서 가져오는 더미 데이터는
        // 컴포넌트 레벨에서 처리 (의존성 순환 방지)
        setTodoItems([]);
      }
    } catch (err) {
      console.error('Failed to load todo items:', err);
      setTodoItems([]);
    }
  }, []);

  // 캘린더에 이벤트 추가 (드래그&드롭)
  const addEventToCalendar = useCallback(async (eventData: any, date: Date): Promise<boolean> => {
    try {
      if (USE_REAL_API) {
        const result = await calendar.addEvent({
          sourceEventId: eventData.id,
          date: date.toISOString().split('T')[0],
          sourceType: eventData.sourceType || 'smart_matching',
          metadata: eventData.metadata || {}
        });
        return result.success;
      } else {
        // 더미 구현 - 항상 성공
        console.log('Adding event to calendar (dummy):', eventData, date);
        return true;
      }
    } catch (err) {
      console.error('Failed to add event to calendar:', err);
      return false;
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    refreshSmartMatching();
    refreshUrgentItems();
    refreshTodoItems();
  }, [refreshSmartMatching, refreshUrgentItems, refreshTodoItems]);

  // 탭 카운트 계산
  const tabCounts = {
    smart_matching: smartMatchingEvents.length,
    urgent: urgentItems.length,
    todo_docs: todoItems.length
  };

  return {
    smartMatchingEvents,
    urgentItems,
    todoItems,
    isLoading,
    error,
    refreshSmartMatching,
    refreshUrgentItems,
    refreshTodoItems,
    addEventToCalendar,
    tabCounts
  };
};