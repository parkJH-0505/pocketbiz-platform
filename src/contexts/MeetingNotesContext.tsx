/**
 * @fileoverview 미팅 메모 관리 Context
 * @description Sprint 6 Phase 6-2: 미팅 메모 CRUD 및 상태 관리
 * @author PocketCompany
 * @since 2025-01-19
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type {
  MeetingNotes,
  ActionItem,
  EnhancedMeeting,
  MeetingType,
  MeetingStatistics,
  MeetingFilter
} from '../types/meeting.enhanced.types';

/**
 * Context 타입 정의
 */
interface MeetingNotesContextType {
  // 메모 관리
  notes: Record<string, MeetingNotes>; // meetingId -> MeetingNotes
  createNotes: (meetingId: string, notes: Omit<MeetingNotes, 'id' | 'createdAt' | 'lastModified' | 'version'>) => Promise<MeetingNotes>;
  updateNotes: (meetingId: string, updates: Partial<MeetingNotes>) => Promise<void>;
  deleteNotes: (meetingId: string) => Promise<void>;
  getNotes: (meetingId: string) => MeetingNotes | null;

  // 액션 아이템 관리
  actionItems: ActionItem[];
  createActionItem: (meetingId: string, item: Omit<ActionItem, 'id' | 'createdAt'>) => Promise<ActionItem>;
  updateActionItem: (itemId: string, updates: Partial<ActionItem>) => Promise<void>;
  deleteActionItem: (itemId: string) => Promise<void>;
  getActionItemsByMeeting: (meetingId: string) => ActionItem[];
  getActionItemsByAssignee: (assignee: string) => ActionItem[];

  // 미팅 메모 템플릿
  getNotesTemplate: (meetingType: MeetingType) => Partial<MeetingNotes>;

  // 통계 및 분석
  getNotesStatistics: (projectId?: string) => MeetingStatistics;

  // 검색 및 필터
  searchNotes: (query: string, filter?: MeetingFilter) => MeetingNotes[];

  // 자동 저장
  enableAutoSave: boolean;
  setEnableAutoSave: (enabled: boolean) => void;

  // 상태
  isLoading: boolean;
  error: string | null;
}

const MeetingNotesContext = createContext<MeetingNotesContextType | undefined>(undefined);

/**
 * 미팅 유형별 메모 템플릿
 */
const NOTES_TEMPLATES: Record<MeetingType, Partial<MeetingNotes>> = {
  pre_meeting: {
    preparation: {
      agenda: [
        '프로젝트 개요 및 목표 확인',
        '예상 일정 및 예산 논의',
        '기술적 요구사항 검토',
        '계약 조건 협의'
      ],
      materials: ['프로젝트 제안서', '견적서', '계약서 초안'],
      attendeePrep: '프로젝트 요구사항 및 예산 범위 검토',
      goals: ['프로젝트 실행 가능성 확인', '양측 기대치 조율', '계약 조건 합의']
    },
    discussion: {
      keyPoints: [],
      concerns: [],
      opportunities: [],
      feedback: ''
    },
    outcomes: {
      decisions: [],
      actionItems: [],
      nextSteps: ['계약서 최종 검토', '프로젝트 킥오프 일정 조율']
    }
  },

  guide_1: {
    preparation: {
      agenda: [
        '프로젝트 킥오프 선언',
        '팀 소개 및 역할 분담',
        '프로젝트 차터 검토',
        '초기 일정 계획 수립'
      ],
      materials: ['프로젝트 차터', '팀 조직도', '초기 일정표'],
      attendeePrep: '프로젝트 목표 및 성공 기준 재검토',
      goals: ['팀 결속 강화', '명확한 프로젝트 방향 설정', '초기 마일스톤 합의']
    },
    discussion: {
      keyPoints: [],
      concerns: [],
      opportunities: [],
      feedback: ''
    },
    outcomes: {
      decisions: [],
      actionItems: [],
      nextSteps: ['요구사항 상세 분석', '기술 스택 최종 확정', '설계 작업 시작']
    }
  },

  guide_2: {
    preparation: {
      agenda: [
        '설계 결과물 검토',
        'UI/UX 프로토타입 확인',
        '기술 아키텍처 승인',
        '다음 단계 계획 수립'
      ],
      materials: ['설계 문서', 'UI/UX 프로토타입', '기술 명세서'],
      attendeePrep: '설계 문서 및 프로토타입 사전 검토',
      goals: ['설계 승인 획득', '기술적 이슈 해결', '개발 착수 준비']
    },
    discussion: {
      keyPoints: [],
      concerns: [],
      opportunities: [],
      feedback: ''
    },
    outcomes: {
      decisions: [],
      actionItems: [],
      nextSteps: ['설계 승인에 따른 개발 시작', '정기 진행상황 보고 일정 수립']
    }
  },

  guide_3: {
    preparation: {
      agenda: [
        '개발 진행 상황 점검',
        '중간 결과물 시연',
        '이슈 및 리스크 검토',
        '일정 조정 협의'
      ],
      materials: ['개발 진행 보고서', '중간 결과물', '이슈 리스트'],
      attendeePrep: '중간 결과물 테스트 및 피드백 준비',
      goals: ['진행 상황 투명성 확보', '품질 확인', '필요시 일정 조정']
    },
    discussion: {
      keyPoints: [],
      concerns: [],
      opportunities: [],
      feedback: ''
    },
    outcomes: {
      decisions: [],
      actionItems: [],
      nextSteps: ['피드백 반영', '최종 개발 완료', '테스트 및 검수 준비']
    }
  },

  guide_4: {
    preparation: {
      agenda: [
        '최종 결과물 검수',
        '프로젝트 완료 확인',
        '인수인계 절차',
        '향후 지원 계획'
      ],
      materials: ['최종 결과물', '사용자 매뉴얼', '유지보수 계획서'],
      attendeePrep: '최종 결과물 종합 테스트',
      goals: ['프로젝트 성공적 완료', '고객 만족도 확보', '향후 관계 유지']
    },
    discussion: {
      keyPoints: [],
      concerns: [],
      opportunities: [],
      feedback: ''
    },
    outcomes: {
      decisions: [],
      actionItems: [],
      nextSteps: ['프로젝트 완료 처리', '고객 만족도 조사', '레슨런 정리']
    }
  }
};

/**
 * MeetingNotesProvider 컴포넌트
 */
export function MeetingNotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Record<string, MeetingNotes>>({});
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [enableAutoSave, setEnableAutoSave] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 초기 데이터 로드
   */
  useEffect(() => {
    loadData();
  }, []);

  /**
   * 자동 저장 (5초마다)
   */
  useEffect(() => {
    if (!enableAutoSave) return;

    const interval = setInterval(() => {
      saveData();
    }, 5000);

    return () => clearInterval(interval);
  }, [notes, actionItems, enableAutoSave]);

  /**
   * 데이터 로드
   */
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // localStorage에서 데이터 로드
      const savedNotes = localStorage.getItem('meeting_notes');
      const savedActionItems = localStorage.getItem('meeting_action_items');

      if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes);
        // Date 객체 복원
        Object.values(parsedNotes).forEach((note: any) => {
          note.createdAt = new Date(note.createdAt);
          note.lastModified = new Date(note.lastModified);
          note.outcomes.decisions?.forEach((decision: any) => {
            decision.decisionDate = new Date(decision.decisionDate);
          });
        });
        setNotes(parsedNotes);
      }

      if (savedActionItems) {
        const parsedActionItems = JSON.parse(savedActionItems);
        // Date 객체 복원
        parsedActionItems.forEach((item: any) => {
          item.createdAt = new Date(item.createdAt);
          item.dueDate = new Date(item.dueDate);
          if (item.completedAt) {
            item.completedAt = new Date(item.completedAt);
          }
        });
        setActionItems(parsedActionItems);
      }

      setError(null);
    } catch (error) {
      console.error('Failed to load meeting notes data:', error);
      setError('데이터 로드에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 데이터 저장
   */
  const saveData = useCallback(async () => {
    try {
      localStorage.setItem('meeting_notes', JSON.stringify(notes));
      localStorage.setItem('meeting_action_items', JSON.stringify(actionItems));
    } catch (error) {
      console.error('Failed to save meeting notes data:', error);
      setError('데이터 저장에 실패했습니다.');
    }
  }, [notes, actionItems]);

  /**
   * 메모 생성
   */
  const createNotes = useCallback(async (meetingId: string, notesData: Omit<MeetingNotes, 'id' | 'createdAt' | 'lastModified' | 'version'>): Promise<MeetingNotes> => {
    const newNotes: MeetingNotes = {
      ...notesData,
      id: `notes-${Date.now()}`,
      meetingId,
      createdAt: new Date(),
      lastModified: new Date(),
      version: 1
    };

    setNotes(prev => ({
      ...prev,
      [meetingId]: newNotes
    }));

    return newNotes;
  }, []);

  /**
   * 메모 업데이트
   */
  const updateNotes = useCallback(async (meetingId: string, updates: Partial<MeetingNotes>) => {
    setNotes(prev => {
      const existingNotes = prev[meetingId];
      if (!existingNotes) return prev;

      return {
        ...prev,
        [meetingId]: {
          ...existingNotes,
          ...updates,
          lastModified: new Date(),
          version: existingNotes.version + 1
        }
      };
    });
  }, []);

  /**
   * 메모 삭제
   */
  const deleteNotes = useCallback(async (meetingId: string) => {
    setNotes(prev => {
      const { [meetingId]: deleted, ...rest } = prev;
      return rest;
    });

    // 관련 액션 아이템도 삭제
    setActionItems(prev => prev.filter(item =>
      !prev.some(note => note.meetingId === meetingId)
    ));
  }, []);

  /**
   * 메모 조회
   */
  const getNotes = useCallback((meetingId: string): MeetingNotes | null => {
    return notes[meetingId] || null;
  }, [notes]);

  /**
   * 액션 아이템 생성
   */
  const createActionItem = useCallback(async (meetingId: string, itemData: Omit<ActionItem, 'id' | 'createdAt'>): Promise<ActionItem> => {
    const newItem: ActionItem = {
      ...itemData,
      id: `action-${Date.now()}`,
      createdAt: new Date()
    };

    setActionItems(prev => [...prev, newItem]);

    // 해당 미팅 메모에도 추가
    await updateNotes(meetingId, {
      outcomes: {
        ...notes[meetingId]?.outcomes,
        actionItems: [...(notes[meetingId]?.outcomes?.actionItems || []), newItem]
      }
    });

    return newItem;
  }, [notes, updateNotes]);

  /**
   * 액션 아이템 업데이트
   */
  const updateActionItem = useCallback(async (itemId: string, updates: Partial<ActionItem>) => {
    setActionItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, ...updates, ...(updates.status === 'completed' ? { completedAt: new Date() } : {}) }
        : item
    ));

    // 관련 미팅 메모도 업데이트
    const meetingId = Object.keys(notes).find(id =>
      notes[id].outcomes?.actionItems?.some(item => item.id === itemId)
    );

    if (meetingId) {
      const meetingNotes = notes[meetingId];
      const updatedActionItems = meetingNotes.outcomes?.actionItems?.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ) || [];

      await updateNotes(meetingId, {
        outcomes: {
          ...meetingNotes.outcomes,
          actionItems: updatedActionItems
        }
      });
    }
  }, [notes, updateNotes]);

  /**
   * 액션 아이템 삭제
   */
  const deleteActionItem = useCallback(async (itemId: string) => {
    setActionItems(prev => prev.filter(item => item.id !== itemId));

    // 관련 미팅 메모에서도 제거
    const meetingId = Object.keys(notes).find(id =>
      notes[id].outcomes?.actionItems?.some(item => item.id === itemId)
    );

    if (meetingId) {
      const meetingNotes = notes[meetingId];
      const updatedActionItems = meetingNotes.outcomes?.actionItems?.filter(item => item.id !== itemId) || [];

      await updateNotes(meetingId, {
        outcomes: {
          ...meetingNotes.outcomes,
          actionItems: updatedActionItems
        }
      });
    }
  }, [notes, updateNotes]);

  /**
   * 미팅별 액션 아이템 조회
   */
  const getActionItemsByMeeting = useCallback((meetingId: string): ActionItem[] => {
    return notes[meetingId]?.outcomes?.actionItems || [];
  }, [notes]);

  /**
   * 담당자별 액션 아이템 조회
   */
  const getActionItemsByAssignee = useCallback((assignee: string): ActionItem[] => {
    return actionItems.filter(item => item.assignee === assignee);
  }, [actionItems]);

  /**
   * 메모 템플릿 조회
   */
  const getNotesTemplate = useCallback((meetingType: MeetingType): Partial<MeetingNotes> => {
    return NOTES_TEMPLATES[meetingType];
  }, []);

  /**
   * 통계 생성
   */
  const getNotesStatistics = useCallback((projectId?: string): MeetingStatistics => {
    const filteredNotes = Object.values(notes).filter(note =>
      !projectId || note.meetingId.includes(projectId)
    );

    const totalActionItems = actionItems.length;
    const completedActionItems = actionItems.filter(item => item.status === 'completed').length;
    const overdueActionItems = actionItems.filter(item =>
      item.status !== 'completed' && new Date(item.dueDate) < new Date()
    ).length;

    return {
      totalMeetings: filteredNotes.length,
      meetingsByType: {} as Record<MeetingType, number>, // 실제 구현에서는 미팅 타입 정보 필요
      meetingsByStatus: {} as any,
      averageDuration: 0, // 실제 구현에서는 미팅 duration 정보 필요
      completionRate: filteredNotes.length > 0 ? (completedActionItems / totalActionItems) * 100 : 0,
      averageRating: 0, // 실제 구현에서는 평가 정보 필요
      totalActionItems,
      completedActionItems,
      overdueActionItems
    };
  }, [notes, actionItems]);

  /**
   * 메모 검색
   */
  const searchNotes = useCallback((query: string, filter?: MeetingFilter): MeetingNotes[] => {
    const allNotes = Object.values(notes);

    return allNotes.filter(note => {
      // 검색어 매칭
      const matchesQuery = !query ||
        note.discussion.keyPoints.some(point => point.toLowerCase().includes(query.toLowerCase())) ||
        note.discussion.feedback.toLowerCase().includes(query.toLowerCase()) ||
        note.outcomes.decisions.some(decision => decision.decision.toLowerCase().includes(query.toLowerCase()));

      // 필터 조건 확인
      if (!matchesQuery) return false;

      // 추가 필터 조건들 (실제 구현에서는 미팅 정보와 연동 필요)
      if (filter?.hasNotes && (!note.discussion.keyPoints.length && !note.discussion.feedback)) {
        return false;
      }

      if (filter?.hasActionItems && (!note.outcomes.actionItems || note.outcomes.actionItems.length === 0)) {
        return false;
      }

      return true;
    });
  }, [notes]);

  const contextValue: MeetingNotesContextType = {
    notes,
    createNotes,
    updateNotes,
    deleteNotes,
    getNotes,
    actionItems,
    createActionItem,
    updateActionItem,
    deleteActionItem,
    getActionItemsByMeeting,
    getActionItemsByAssignee,
    getNotesTemplate,
    getNotesStatistics,
    searchNotes,
    enableAutoSave,
    setEnableAutoSave,
    isLoading,
    error
  };

  return (
    <MeetingNotesContext.Provider value={contextValue}>
      {children}
    </MeetingNotesContext.Provider>
  );
}

/**
 * useMeetingNotes hook
 */
export const useMeetingNotes = () => {
  const context = useContext(MeetingNotesContext);
  if (!context) {
    throw new Error('useMeetingNotes must be used within MeetingNotesProvider');
  }
  return context;
};