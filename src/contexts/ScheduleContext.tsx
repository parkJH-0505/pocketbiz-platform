/**
 * @fileoverview 포켓비즈 통합 스케줄 관리 Context
 * @description 모든 스케줄 데이터의 중앙 집중 관리 시스템
 * @author PocketCompany
 * @since 2025-01-18
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode
} from 'react';

import type {
  UnifiedSchedule,
  ScheduleType,
  ScheduleStatus,
  ScheduleFilterOptions,
  ScheduleStatistics,
  BuildupProjectMeeting,
  MentorSession,
  WebinarEvent,
  PMConsultation,
  ExternalMeeting,
  GeneralSchedule,
  CreateBuildupMeetingDTO,
  ProjectScheduleLink,
  ScheduleEvent
} from '../types/schedule.types';

import { contextReadyEmitter } from '../utils/contextReadyEmitter';
import { useContextRegistration } from '../hooks/useContextRegistration';
import { CONTEXT_METADATA } from '../utils/contextMetadata';

import {
  generateScheduleId,
  validateSchedule,
  isBuildupProjectMeeting,
  isUpcomingSchedule,
  isPastSchedule,
  isUrgentSchedule,
  filterSchedules,
  calculateScheduleStatistics,
  getPhaseTransitionTrigger,
  formatScheduleDate,
  formatScheduleTime
} from '../types/schedule.types';

// ============================================================================
// Constants
// ============================================================================

/**
 * localStorage 키
 */
const STORAGE_KEYS = {
  SCHEDULES: 'pocket_biz_schedules',
  PROJECT_LINKS: 'pocket_biz_project_schedule_links',
  LAST_SYNC: 'pocket_biz_schedules_last_sync'
} as const;

/**
 * 이벤트 타입
 */
const SCHEDULE_EVENTS = {
  CREATED: 'SCHEDULE_CREATED',
  UPDATED: 'SCHEDULE_UPDATED',
  DELETED: 'SCHEDULE_DELETED',
  BUILDUP_MEETING_CREATED: 'BUILDUP_MEETING_CREATED',
  PHASE_TRANSITION_TRIGGERED: 'PHASE_TRANSITION_TRIGGERED'
} as const;

/**
 * 디바운스 지연 시간 (ms)
 */
const DEBOUNCE_DELAY = 500;

// ============================================================================
// Context Interface
// ============================================================================

/**
 * ScheduleContext 타입 정의
 */
interface ScheduleContextType {
  // ========== 상태 ==========
  /**
   * 전체 스케줄 목록
   */
  schedules: UnifiedSchedule[];

  /**
   * 빌드업 프로젝트 미팅 목록
   */
  buildupMeetings: BuildupProjectMeeting[];

  /**
   * 프로젝트-스케줄 연결 정보
   */
  projectScheduleLinks: Map<string, ProjectScheduleLink>;

  /**
   * 로딩 상태
   */
  isLoading: boolean;

  /**
   * 에러 상태
   */
  error: string | null;

  /**
   * 마지막 동기화 시간
   */
  lastSync: Date | null;

  // ========== CRUD 작업 ==========
  /**
   * 스케줄 생성
   * @description 새 스케줄을 생성하고 필요시 이벤트를 발생시킴
   */
  createSchedule: <T extends UnifiedSchedule>(
    scheduleData: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<T>;

  /**
   * 스케줄 업데이트
   */
  updateSchedule: (
    id: string,
    updates: Partial<Omit<UnifiedSchedule, 'id' | 'type' | 'createdAt' | 'createdBy'>>
  ) => Promise<void>;

  /**
   * 스케줄 삭제
   */
  deleteSchedule: (id: string) => Promise<void>;

  /**
   * 단일 스케줄 조회
   */
  getScheduleById: (id: string) => UnifiedSchedule | undefined;

  // ========== 필터링 메서드 ==========
  /**
   * 타입별 스케줄 조회
   */
  getSchedulesByType: <T extends UnifiedSchedule>(type: ScheduleType) => T[];

  /**
   * 프로젝트별 스케줄 조회
   */
  getSchedulesByProject: (projectId: string) => UnifiedSchedule[];

  /**
   * 날짜 범위별 스케줄 조회
   */
  getSchedulesByDateRange: (start: Date, end: Date) => UnifiedSchedule[];

  /**
   * 오늘 스케줄 조회
   */
  getTodaySchedules: () => UnifiedSchedule[];

  /**
   * 예정된 스케줄 조회
   */
  getUpcomingSchedules: (days?: number) => UnifiedSchedule[];

  /**
   * 긴급 스케줄 조회
   */
  getUrgentSchedules: () => UnifiedSchedule[];

  /**
   * 고급 필터링
   */
  searchSchedules: (options: ScheduleFilterOptions) => UnifiedSchedule[];

  // ========== 프로젝트 연동 ==========
  /**
   * 스케줄을 프로젝트에 연결
   */
  linkScheduleToProject: (scheduleId: string, projectId: string) => void;

  /**
   * 프로젝트 연결 해제
   */
  unlinkScheduleFromProject: (scheduleId: string, projectId: string) => void;

  /**
   * 프로젝트 스케줄 링크 정보 조회
   */
  getProjectScheduleLink: (projectId: string) => ProjectScheduleLink | undefined;

  // ========== 유틸리티 ==========
  /**
   * 스케줄 통계 계산
   */
  getStatistics: () => ScheduleStatistics;

  /**
   * 데이터 새로고침
   */
  refreshSchedules: () => Promise<void>;

  /**
   * 데이터 초기화
   */
  clearAllSchedules: () => void;

  /**
   * 로컬 스토리지 동기화
   */
  syncToLocalStorage: () => void;

  // ========== 배치 작업 ==========
  /**
   * 여러 스케줄 한번에 생성 (초기 동기화용)
   * @description 중복 체크 및 배치 처리 지원
   */
  createSchedulesBatch: <T extends UnifiedSchedule>(
    schedules: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>,
    options?: {
      skipDuplicateCheck?: boolean;
      suppressEvents?: boolean;
      source?: string;
    }
  ) => Promise<T[]>;

  /**
   * 프로젝트 ID로 스케줄 존재 여부 확인
   */
  hasSchedulesForProject: (projectId: string) => boolean;

  /**
   * 동기화 플래그 설정/해제
   */
  setSyncInProgress: (inProgress: boolean) => void;

  /**
   * 동기화 상태 확인
   */
  isSyncInProgress: () => boolean;
}

// ============================================================================
// Context Creation
// ============================================================================

/**
 * ScheduleContext 생성
 */
const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

/**
 * ScheduleProvider 컴포넌트
 */
export function ScheduleProvider({ children }: { children: ReactNode }) {
  // ========== State ==========
  const [schedules, setSchedules] = useState<UnifiedSchedule[]>([]);
  const [projectScheduleLinks, setProjectScheduleLinks] = useState<Map<string, ProjectScheduleLink>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // ========== Refs ==========
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const syncInProgressRef = useRef<boolean>(false);

  // ========== localStorage 관련 함수 ==========

  /**
   * localStorage에서 데이터 로드
   */
  const loadFromLocalStorage = useCallback(() => {
    try {
      console.log('📂 Loading schedules from localStorage...');

      // 스케줄 데이터 로드
      const savedSchedules = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
      if (savedSchedules) {
        const parsed = JSON.parse(savedSchedules);
        // Date 객체 복원
        const restored = parsed.map((schedule: any) => ({
          ...schedule,
          date: new Date(schedule.date),
          createdAt: new Date(schedule.createdAt),
          updatedAt: schedule.updatedAt ? new Date(schedule.updatedAt) : undefined
        }));
        setSchedules(restored);
        console.log(`✅ Loaded ${restored.length} schedules`);
      }

      // 프로젝트 링크 데이터 로드
      const savedLinks = localStorage.getItem(STORAGE_KEYS.PROJECT_LINKS);
      if (savedLinks) {
        const parsed = JSON.parse(savedLinks);
        const linksMap = new Map<string, ProjectScheduleLink>(Object.entries(parsed));
        setProjectScheduleLinks(linksMap);
        console.log(`✅ Loaded ${linksMap.size} project links`);
      }

      // 마지막 동기화 시간 로드
      const savedLastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      if (savedLastSync) {
        setLastSync(new Date(savedLastSync));
      }

      setIsLoading(false);
    } catch (err) {
      console.error('❌ Failed to load from localStorage:', err);
      setError('스케줄 데이터를 불러오는데 실패했습니다.');
      setIsLoading(false);
    }
  }, []);

  /**
   * localStorage에 데이터 저장 (디바운싱 적용)
   */
  const saveToLocalStorage = useCallback(() => {
    // 기존 타임아웃 취소
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 디바운싱 적용하여 저장
    saveTimeoutRef.current = setTimeout(() => {
      try {
        console.log('💾 Saving schedules to localStorage...');

        // 스케줄 저장
        localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));

        // 프로젝트 링크 저장
        const linksObject = Object.fromEntries(projectScheduleLinks);
        localStorage.setItem(STORAGE_KEYS.PROJECT_LINKS, JSON.stringify(linksObject));

        // 동기화 시간 저장
        const now = new Date();
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, now.toISOString());
        setLastSync(now);

        console.log('📢 [Sprint 5] Step 8: ✅ Saved to localStorage successfully', {
          schedules: schedules.length,
          projectLinks: projectScheduleLinks.size,
          lastSync: now.toISOString()
        });
      } catch (err) {
        console.error('❌ Failed to save to localStorage:', err);
        setError('스케줄 데이터 저장에 실패했습니다.');
      }
    }, DEBOUNCE_DELAY);
  }, [schedules, projectScheduleLinks]);

  /**
   * 이벤트 발생 함수
   */
  const emitScheduleEvent = useCallback((
    eventType: string,
    schedule: UnifiedSchedule,
    metadata?: Record<string, any>
  ) => {
    // Convert event type to the format BuildupContext expects
    const eventName = eventType === 'BUILDUP_MEETING_CREATED'
      ? 'schedule:buildup_meeting_created'
      : `schedule:${eventType.toLowerCase()}`;

    const event = new CustomEvent(eventName, {
      detail: {
        schedule,
        timestamp: new Date(),
        metadata
      }
    });

    console.log(`📢 Emitting event: ${eventName}`, { schedule, metadata });
    window.dispatchEvent(event);
  }, []);

  // ========== 초기화 ==========

  useEffect(() => {
    if (!isInitializedRef.current) {
      loadFromLocalStorage();
      isInitializedRef.current = true;
    }
  }, [loadFromLocalStorage]);

  // ========== 자동 저장 ==========

  useEffect(() => {
    if (!isLoading && schedules.length > 0) {
      saveToLocalStorage();
    }
  }, [schedules, projectScheduleLinks, isLoading, saveToLocalStorage]);

  // ========== Cleanup ==========

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // ========== CRUD Operations (Phase 2) ==========

  /**
   * 스케줄 생성
   * @description 새 스케줄을 생성하고 필요시 이벤트를 발생시킴
   */
  const createSchedule = useCallback(async <T extends UnifiedSchedule>(
    scheduleData: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<T> => {
    try {
      console.log('📝 Creating new schedule:', scheduleData);

      // 1. 유효성 검증
      const validation = validateSchedule(scheduleData as Partial<UnifiedSchedule>);
      if (!validation.valid) {
        const errorMsg = `스케줄 생성 실패: ${validation.errors.join(', ')}`;
        console.error('❌ Validation failed:', validation.errors);
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      // 2. ID 생성 및 메타데이터 추가
      const newSchedule: T = {
        ...scheduleData,
        id: generateScheduleId(scheduleData.type as ScheduleType),
        createdAt: new Date(),
        createdBy: scheduleData.createdBy || 'system',
        status: scheduleData.status || 'scheduled',
        priority: scheduleData.priority || 'medium',
        participants: scheduleData.participants || []
      } as T;

      // 3. 상태 업데이트
      setSchedules(prev => {
        const updated = [...prev, newSchedule as UnifiedSchedule];
        console.log(`✅ Schedule created: ${newSchedule.id} (Total: ${updated.length})`);
        return updated;
      });

      // 4. 프로젝트 연결 (빌드업 미팅인 경우)
      if (isBuildupProjectMeeting(newSchedule)) {
        const buildupMeeting = newSchedule as BuildupProjectMeeting;
        const projectId = buildupMeeting.projectId;

        setProjectScheduleLinks(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(projectId) || {
            projectId,
            scheduleIds: [],
            totalMeetings: 0,
            completedMeetings: 0,
            currentPhase: 'contract_pending' as any,
            nextMeetingSequence: buildupMeeting.meetingSequence
          };

          newMap.set(projectId, {
            ...existing,
            scheduleIds: [...existing.scheduleIds, newSchedule.id],
            totalMeetings: existing.totalMeetings + 1,
            lastMeetingDate: newSchedule.date
          });

          return newMap;
        });

        console.log(`🔗 Linked to project: ${projectId}`);
      }

      // 5. ⚡ 이벤트 발생 (가장 중요!)
      console.log('📢 [Sprint 5] Step 1: Emitting SCHEDULE_CREATED event');
      emitScheduleEvent(SCHEDULE_EVENTS.CREATED, newSchedule);

      // 빌드업 미팅인 경우 특별 이벤트 발생
      if (isBuildupProjectMeeting(newSchedule)) {
        const buildupMeeting = newSchedule as BuildupProjectMeeting;
        console.log('📢 [Sprint 5] Step 2: Detected Buildup Meeting:', {
          projectId: buildupMeeting.projectId,
          meetingSequence: buildupMeeting.meetingSequence,
          meetingType: buildupMeeting.type
        });

        // Phase Transition 트리거 정보 확인 (직접 전달된 것 우선, 없으면 자동 계산)
        const phaseTransition = buildupMeeting.phaseTransitionTrigger ||
                                getPhaseTransitionTrigger(buildupMeeting.meetingSequence);

        if (phaseTransition) {
          console.log('📢 [Sprint 5] Step 3: Phase Transition Trigger Found:', phaseTransition);

          // PhaseTransitionManager를 통한 직접 전환 시도
          import('../utils/phaseTransitionManager').then(async ({ phaseTransitionManager }) => {
            console.log('📢 [Sprint 5] Step 4: Loading PhaseTransitionManager...');
            try {
              console.log('📢 [Sprint 5] Step 5: Calling phaseTransitionManager.transition()');

              // 현재 프로젝트의 단계로 PhaseTransitionManager 초기화
              const fromPhaseEnum = phaseTransition.fromPhase.toUpperCase().replace(/-/g, '_') as any;
              const toPhaseEnum = phaseTransition.toPhase.toUpperCase().replace(/-/g, '_') as any;

              // 현재 단계로 초기화
              phaseTransitionManager.setState({
                current: fromPhaseEnum,
                completionRate: 100, // 이전 단계 완료
                startedAt: new Date(Date.now() - 60000), // 1분 전 시작
                history: []
              });

              await phaseTransitionManager.transition(
                toPhaseEnum,
                {
                  mode: 'auto' as any,
                  metadata: {
                    projectId: buildupMeeting.projectId,
                    trigger: 'meeting_scheduled',
                    meetingId: newSchedule.id,
                    meetingType: buildupMeeting.type,
                    meetingSequence: buildupMeeting.meetingSequence
                  }
                }
              );
              console.log('📢 [Sprint 5] Step 6: ✅ Phase transition triggered successfully!');
            } catch (error) {
              console.error('📢 [Sprint 5] Step 6: ❌ Phase transition failed:', error);
            }
          }).catch(error => {
            console.error('📢 [Sprint 5] Step 4: ❌ PhaseTransitionManager not available:', error);
          });

          // BuildupContext가 감지할 이벤트 발생 (백업 메커니즘)
          console.log('📢 [Sprint 5] Step 7: Emitting BUILDUP_MEETING_CREATED event (backup)');
          emitScheduleEvent(SCHEDULE_EVENTS.BUILDUP_MEETING_CREATED, newSchedule, {
            projectId: buildupMeeting.projectId,
            meetingSequence: buildupMeeting.meetingSequence,
            phaseTransition,
            triggerTime: new Date()
          });
        }
      }

      setError(null);
      return newSchedule;
    } catch (error) {
      console.error('❌ Failed to create schedule:', error);
      throw error;
    }
  }, [emitScheduleEvent]);

  /**
   * 스케줄 업데이트
   */
  const updateSchedule = useCallback(async (
    id: string,
    updates: Partial<Omit<UnifiedSchedule, 'id' | 'type' | 'createdAt' | 'createdBy'>>
  ): Promise<void> => {
    try {
      console.log(`📝 Updating schedule ${id}:`, updates);

      setSchedules(prev => {
        const index = prev.findIndex(s => s.id === id);
        if (index === -1) {
          throw new Error(`스케줄을 찾을 수 없습니다: ${id}`);
        }

        const existing = prev[index];
        const updated = {
          ...existing,
          ...updates,
          updatedAt: new Date(),
          updatedBy: updates.updatedBy || 'system'
        } as UnifiedSchedule;

        // 유효성 검증
        const validation = validateSchedule(updated);
        if (!validation.valid) {
          throw new Error(`유효성 검증 실패: ${validation.errors.join(', ')}`);
        }

        const newSchedules = [...prev];
        newSchedules[index] = updated;

        console.log(`✅ Schedule updated: ${id}`);

        // 이벤트 발생
        emitScheduleEvent(SCHEDULE_EVENTS.UPDATED, updated, { previousData: existing });

        return newSchedules;
      });

      setError(null);
    } catch (error) {
      console.error('❌ Failed to update schedule:', error);
      setError(error instanceof Error ? error.message : '스케줄 업데이트 실패');
      throw error;
    }
  }, [emitScheduleEvent]);

  /**
   * 스케줄 삭제
   */
  const deleteSchedule = useCallback(async (id: string): Promise<void> => {
    try {
      console.log(`🗑️ Deleting schedule: ${id}`);

      setSchedules(prev => {
        const scheduleToDelete = prev.find(s => s.id === id);
        if (!scheduleToDelete) {
          throw new Error(`스케줄을 찾을 수 없습니다: ${id}`);
        }

        const filtered = prev.filter(s => s.id !== id);
        console.log(`✅ Schedule deleted: ${id} (Remaining: ${filtered.length})`);

        // 이벤트 발생
        emitScheduleEvent(SCHEDULE_EVENTS.DELETED, scheduleToDelete);

        // 프로젝트 링크에서도 제거
        if (isBuildupProjectMeeting(scheduleToDelete)) {
          const buildupMeeting = scheduleToDelete as BuildupProjectMeeting;
          setProjectScheduleLinks(prevLinks => {
            const newLinks = new Map(prevLinks);
            const projectLink = newLinks.get(buildupMeeting.projectId);
            if (projectLink) {
              projectLink.scheduleIds = projectLink.scheduleIds.filter(sid => sid !== id);
              projectLink.totalMeetings--;
              if (scheduleToDelete.status === 'completed') {
                projectLink.completedMeetings--;
              }
            }
            return newLinks;
          });
        }

        return filtered;
      });

      setError(null);
    } catch (error) {
      console.error('❌ Failed to delete schedule:', error);
      setError(error instanceof Error ? error.message : '스케줄 삭제 실패');
      throw error;
    }
  }, [emitScheduleEvent]);

  /**
   * 단일 스케줄 조회
   */
  const getScheduleById = useCallback((id: string): UnifiedSchedule | undefined => {
    return schedules.find(s => s.id === id);
  }, [schedules]);

  // ========== Phase 3: 필터링 메서드 ==========

  /**
   * 타입별 스케줄 조회
   */
  const getSchedulesByType = useCallback(<T extends UnifiedSchedule['type']>(
    type: T
  ): Extract<UnifiedSchedule, { type: T }>[] => {
    return schedules.filter(s => s.type === type) as Extract<UnifiedSchedule, { type: T }>[];
  }, [schedules]);

  /**
   * 프로젝트별 스케줄 조회
   */
  const getSchedulesByProject = useCallback((projectId: string): UnifiedSchedule[] => {
    const link = projectScheduleLinks.get(projectId);
    if (!link || link.scheduleIds.length === 0) {
      return [];
    }

    return schedules.filter(s => link.scheduleIds.includes(s.id));
  }, [schedules, projectScheduleLinks]);

  /**
   * 날짜 범위별 스케줄 조회
   */
  const getSchedulesByDateRange = useCallback((
    startDate: Date,
    endDate: Date
  ): UnifiedSchedule[] => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return schedules.filter(schedule => {
      const scheduleStart = new Date(schedule.startDateTime);
      const scheduleEnd = new Date(schedule.endDateTime);

      // 스케줄이 범위와 겹치는 경우
      return (
        (scheduleStart >= start && scheduleStart <= end) ||
        (scheduleEnd >= start && scheduleEnd <= end) ||
        (scheduleStart <= start && scheduleEnd >= end)
      );
    });
  }, [schedules]);

  /**
   * 오늘의 스케줄 조회
   */
  const getTodaySchedules = useCallback((): UnifiedSchedule[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return getSchedulesByDateRange(today, tomorrow);
  }, [getSchedulesByDateRange]);

  /**
   * 예정된 스케줄 조회 (미래)
   */
  const getUpcomingSchedules = useCallback((
    days: number = 7
  ): UnifiedSchedule[] => {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    return schedules
      .filter(schedule => {
        const startTime = new Date(schedule.startDateTime);
        return startTime > now && startTime <= future;
      })
      .sort((a, b) =>
        new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
      );
  }, [schedules]);

  /**
   * 긴급 스케줄 조회 (24시간 이내)
   */
  const getUrgentSchedules = useCallback((): UnifiedSchedule[] => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setHours(now.getHours() + 24);

    return schedules
      .filter(schedule => {
        const startTime = new Date(schedule.startDateTime);
        return startTime > now && startTime <= tomorrow && schedule.priority === 'high';
      })
      .sort((a, b) =>
        new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
      );
  }, [schedules]);

  /**
   * 스케줄 검색 (다중 조건)
   */
  const searchSchedules = useCallback((criteria: {
    query?: string;
    type?: UnifiedSchedule['type'];
    status?: ScheduleStatus;
    priority?: SchedulePriority;
    tags?: string[];
    projectId?: string;
    startDate?: Date;
    endDate?: Date;
  }): UnifiedSchedule[] => {
    let results = [...schedules];

    // 텍스트 검색
    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      results = results.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // 타입 필터
    if (criteria.type) {
      results = results.filter(s => s.type === criteria.type);
    }

    // 상태 필터
    if (criteria.status) {
      results = results.filter(s => s.status === criteria.status);
    }

    // 우선순위 필터
    if (criteria.priority) {
      results = results.filter(s => s.priority === criteria.priority);
    }

    // 태그 필터 (OR 조건)
    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(s =>
        s.tags?.some(tag => criteria.tags!.includes(tag))
      );
    }

    // 프로젝트 필터
    if (criteria.projectId) {
      const link = projectScheduleLinks.get(criteria.projectId);
      if (link) {
        results = results.filter(s => link.scheduleIds.includes(s.id));
      } else {
        results = [];
      }
    }

    // 날짜 범위 필터
    if (criteria.startDate || criteria.endDate) {
      const start = criteria.startDate || new Date(0);
      const end = criteria.endDate || new Date('2100-12-31');

      results = results.filter(schedule => {
        const scheduleStart = new Date(schedule.startDateTime);
        return scheduleStart >= start && scheduleStart <= end;
      });
    }

    return results.sort((a, b) =>
      new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    );
  }, [schedules, projectScheduleLinks]);

  // ========== Phase 4: 프로젝트 연동 ==========

  /**
   * 스케줄을 프로젝트에 연결
   */
  const linkScheduleToProject = useCallback((
    scheduleId: string,
    projectId: string
  ): void => {
    setProjectScheduleLinks(prev => {
      const newLinks = new Map(prev);
      const existingLink = newLinks.get(projectId);

      if (existingLink) {
        // 중복 체크
        if (!existingLink.scheduleIds.includes(scheduleId)) {
          existingLink.scheduleIds.push(scheduleId);
          existingLink.lastUpdated = new Date();
        }
      } else {
        // 새로운 링크 생성
        newLinks.set(projectId, {
          projectId,
          scheduleIds: [scheduleId],
          lastUpdated: new Date()
        });
      }

      return newLinks;
    });

    console.log(`🔗 Linked schedule ${scheduleId} to project ${projectId}`);
  }, []);

  /**
   * 스케줄을 프로젝트에서 연결 해제
   */
  const unlinkScheduleFromProject = useCallback((
    scheduleId: string,
    projectId: string
  ): void => {
    setProjectScheduleLinks(prev => {
      const newLinks = new Map(prev);
      const existingLink = newLinks.get(projectId);

      if (existingLink) {
        existingLink.scheduleIds = existingLink.scheduleIds.filter(
          id => id !== scheduleId
        );
        existingLink.lastUpdated = new Date();

        // 더 이상 연결된 스케줄이 없으면 링크 삭제
        if (existingLink.scheduleIds.length === 0) {
          newLinks.delete(projectId);
        }
      }

      return newLinks;
    });

    console.log(`🔗 Unlinked schedule ${scheduleId} from project ${projectId}`);
  }, []);

  /**
   * 프로젝트-스케줄 링크 조회
   */
  const getProjectScheduleLink = useCallback((
    projectId: string
  ): ProjectScheduleLink | undefined => {
    return projectScheduleLinks.get(projectId);
  }, [projectScheduleLinks]);

  // ========== 배치 작업 메서드 ==========

  /**
   * 여러 스케줄 한번에 생성 (초기 동기화용)
   */
  const createSchedulesBatch = useCallback(async <T extends UnifiedSchedule>(
    schedulesList: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>,
    options: {
      skipDuplicateCheck?: boolean;
      suppressEvents?: boolean;
      source?: string;
    } = {}
  ): Promise<T[]> => {
    try {
      console.log(`📦 Creating ${schedulesList.length} schedules in batch...`);

      const createdSchedules: T[] = [];
      let duplicatesSkipped = 0;
      const errors: Array<{ index: number; error: string }> = [];

      for (let i = 0; i < schedulesList.length; i++) {
        const scheduleData = schedulesList[i];

        try {
          // 중복 체크 (옵션)
          if (!options.skipDuplicateCheck) {
            const isDuplicate = schedules.some(existing => {
              if (scheduleData.type === 'buildup_project') {
                const buildupData = scheduleData as any;
                const existingBuildup = existing as BuildupProjectMeeting;
                return existing.type === 'buildup_project' &&
                       existingBuildup.projectId === buildupData.projectId &&
                       existingBuildup.meetingSequence === buildupData.meetingSequence;
              }
              return existing.title === scheduleData.title &&
                     existing.date.getTime() === new Date(scheduleData.date).getTime();
            });

            if (isDuplicate) {
              // ✅ 로그 레벨 조정: 개발 시에만 표시
              if (process.env.NODE_ENV === 'development') {
                console.log(`🔍 Skipping duplicate schedule: ${scheduleData.title} at ${new Date(scheduleData.date).toLocaleDateString()}`);
              }
              duplicatesSkipped++;
              continue;
            }
          }

          // 스케줄 생성 (이벤트 억제 옵션)
          const newSchedule = {
            ...scheduleData,
            id: generateScheduleId(scheduleData.type as ScheduleType),
            createdAt: new Date(),
            createdBy: scheduleData.createdBy || options.source || 'batch_sync',
            status: scheduleData.status || 'scheduled',
            priority: scheduleData.priority || 'medium',
            participants: scheduleData.participants || []
          } as T;

          // 유효성 검증
          const validation = validateSchedule(newSchedule as UnifiedSchedule);
          if (!validation.valid) {
            errors.push({
              index: i,
              error: `Validation failed: ${validation.errors.join(', ')}`
            });
            continue;
          }

          createdSchedules.push(newSchedule);

        } catch (error) {
          errors.push({
            index: i,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // 상태 일괄 업데이트
      if (createdSchedules.length > 0) {
        setSchedules(prev => {
          const updated = [...prev, ...createdSchedules as UnifiedSchedule[]];
          console.log(`✅ Batch created ${createdSchedules.length} schedules (Skipped ${duplicatesSkipped} duplicates, Total: ${updated.length})`);
          return updated;
        });

        // 프로젝트 링크 일괄 업데이트
        const buildupMeetings = createdSchedules.filter(s => s.type === 'buildup_project') as BuildupProjectMeeting[];
        if (buildupMeetings.length > 0) {
          setProjectScheduleLinks(prev => {
            const newMap = new Map(prev);

            buildupMeetings.forEach(meeting => {
              const projectId = meeting.projectId;
              const existing = newMap.get(projectId) || {
                projectId,
                scheduleIds: [],
                totalMeetings: 0,
                completedMeetings: 0,
                currentPhase: 'contract_pending' as any,
                nextMeetingSequence: meeting.meetingSequence
              };

              newMap.set(projectId, {
                ...existing,
                scheduleIds: [...existing.scheduleIds, meeting.id],
                totalMeetings: existing.totalMeetings + 1,
                lastMeetingDate: meeting.date
              });
            });

            return newMap;
          });
        }

        // 이벤트 발생 (억제되지 않은 경우)
        if (!options.suppressEvents) {
          createdSchedules.forEach(schedule => {
            emitScheduleEvent(SCHEDULE_EVENTS.CREATED, schedule as UnifiedSchedule);
          });
        }
      }

      if (errors.length > 0) {
        console.warn(`⚠️ Batch creation completed with ${errors.length} errors:`, errors);
      }

      return createdSchedules;

    } catch (error) {
      console.error('❌ Failed to create schedules batch:', error);
      throw error;
    }
  }, [schedules, emitScheduleEvent, generateScheduleId, validateSchedule]);

  /**
   * 프로젝트 ID로 스케줄 존재 여부 확인
   */
  const hasSchedulesForProject = useCallback((projectId: string): boolean => {
    return schedules.some(schedule => {
      if (schedule.type === 'buildup_project') {
        return (schedule as BuildupProjectMeeting).projectId === projectId;
      }
      return false;
    });
  }, [schedules]);

  /**
   * 동기화 플래그 설정/해제
   */
  const setSyncInProgress = useCallback((inProgress: boolean): void => {
    syncInProgressRef.current = inProgress;
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 Sync ${inProgress ? 'started' : 'completed'}`);
    }
  }, []);

  /**
   * 동기화 상태 확인
   */
  const isSyncInProgress = useCallback((): boolean => {
    return syncInProgressRef.current;
  }, []);

  // ========== Context Value (메모이제이션) ==========

  // 빌드업 미팅만 필터링 (computed value)
  const buildupMeetings = useMemo(() =>
    schedules.filter(s => s.type === 'buildup_project') as BuildupProjectMeeting[]
  , [schedules]);

  const contextValue = useMemo<ScheduleContextType>(() => ({
    // 상태
    schedules,
    buildupMeetings, // 추가
    projectScheduleLinks,
    isLoading,
    error,
    lastSync,

    // CRUD 작업 (Phase 2 - 구현 완료!)
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getScheduleById,

    // 필터링 메서드 (Phase 3 - 구현 완료!)
    getSchedulesByType,
    getSchedulesByProject,
    getSchedulesByDateRange,
    getTodaySchedules,
    getUpcomingSchedules,
    getUrgentSchedules,
    searchSchedules,

    // 프로젝트 연동 (Phase 4 - 구현 완료!)
    linkScheduleToProject,
    unlinkScheduleFromProject,
    getProjectScheduleLink,

    // 유틸리티
    getStatistics: () => calculateScheduleStatistics(schedules),
    refreshSchedules: async () => { loadFromLocalStorage(); },
    clearAllSchedules: () => {
      setSchedules([]);
      setProjectScheduleLinks(new Map());
      localStorage.removeItem(STORAGE_KEYS.SCHEDULES);
      localStorage.removeItem(STORAGE_KEYS.PROJECT_LINKS);
      console.log('🗑️ All schedules cleared');
    },
    syncToLocalStorage: saveToLocalStorage,

    // 배치 작업
    createSchedulesBatch,
    hasSchedulesForProject,
    setSyncInProgress,
    isSyncInProgress
  }), [
    schedules,
    buildupMeetings,
    projectScheduleLinks,
    isLoading,
    error,
    lastSync,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getScheduleById,
    getSchedulesByType,
    getSchedulesByProject,
    getSchedulesByDateRange,
    getTodaySchedules,
    getUpcomingSchedules,
    getUrgentSchedules,
    searchSchedules,
    linkScheduleToProject,
    unlinkScheduleFromProject,
    getProjectScheduleLink,
    loadFromLocalStorage,
    saveToLocalStorage,
    createSchedulesBatch,
    hasSchedulesForProject,
    setSyncInProgress,
    isSyncInProgress
  ]);

  // Window 객체에 ScheduleContext 노출 (Phase 전환 및 크로스 컨텍스트 통신용)
  // GlobalContextManager와 window 객체 둘 다 지원 (통합 시스템을 위해)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Context 객체 정의
      const scheduleContextObj = {
        // State
        schedules,
        isLoading,
        error,

        // Methods
        createSchedule,
        updateSchedule,
        deleteSchedule,
        getScheduleById,
        getSchedulesByProject,
        createSchedulesBatch,

        // Utils
        validateSchedule,
        clearError: () => setError(null),
        clearAllSchedules: () => {
          setSchedules([]);
          setProjectScheduleLinks(new Map());
          localStorage.removeItem(STORAGE_KEYS.SCHEDULES);
          localStorage.removeItem(STORAGE_KEYS.PROJECT_LINKS);
          console.log('🗑️ All schedules cleared via window interface');
        }
      };

      // Window 객체에 노출 (통합 스케줄 시스템을 위해)
      window.scheduleContext = scheduleContextObj;

      // GlobalContextManager에 등록
      import('../utils/globalContextManager').then(({ contextManager }) => {
        contextManager.register('schedule', scheduleContextObj, {
          name: 'schedule',
          version: '1.0.0',
          description: 'Schedule management context',
          isReady: true
        });
        console.log('✅ ScheduleContext registered to GlobalContextManager');
      }).catch(error => {
        console.warn('GlobalContextManager registration failed:', error);
      });

      // Event Emitter는 나중에 필요시 추가

      // Debug utilities 초기화
      if (!window.__DEBUG_CONTEXTS__) {
        window.__DEBUG_CONTEXTS__ = {
          list: () => Object.keys(window).filter(k => k.endsWith('Context')),
          get: (name: string) => window[`${name}Context`],
          test: (name: string) => !!window[`${name}Context`],
          status: () => {
            const contexts = ['schedule', 'buildup', 'dashboard'];
            return contexts.reduce((acc, name) => {
              acc[name] = !!window[`${name}Context`];
              return acc;
            }, {} as Record<string, boolean>);
          }
        };
      }

      console.log('✅ ScheduleContext registered to window');

      // Context ready 이벤트 발송
      contextReadyEmitter.markReady('schedule', [
        'createSchedule',
        'updateSchedule',
        'deleteSchedule',
        'getScheduleById',
        'getSchedulesByProject',
        'createSchedulesBatch'
      ]);
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.scheduleContext;
        contextReadyEmitter.markUnready('schedule');
        console.log('🧹 ScheduleContext removed from window');
      }
    };
  }, []); // Empty dependency - register once on mount

  // ✅ Step 3: 실시간 양방향 동기화 시스템
  useEffect(() => {
    console.log('🚀 ScheduleContext: Initializing bidirectional sync system (Step 3)');

    // ProjectDetail/Calendar에서 발생하는 동기화 요청 수신
    const handleSyncRequested = async (e: CustomEvent) => {
      const { source, projectId, meeting, operation, eventId } = e.detail;

      console.log(`🔄 ScheduleContext received sync request from ${source}:`, {
        projectId,
        operation,
        meetingTitle: meeting?.title,
        eventId
      });

      try {
        switch (operation) {
          case 'refresh_requested':
            // 특정 프로젝트의 스케줄만 새로고침 (성능 최적화)
            if (projectId) {
              const projectSchedules = getSchedulesByProject(projectId);
              console.log(`📅 Refreshing ${projectSchedules.length} schedules for project ${projectId}`);

              // 외부 시스템에 새로고침 완료 알림
              const refreshCompleteEvent = new CustomEvent('schedule:refresh_complete', {
                detail: {
                  source: 'ScheduleContext',
                  projectId,
                  scheduleCount: projectSchedules.length,
                  timestamp: new Date(),
                  originalEventId: eventId
                }
              });
              window.dispatchEvent(refreshCompleteEvent);
            }
            break;

          case 'create_meeting':
            if (meeting && projectId) {
              console.log(`📝 Creating meeting from ${source}:`, meeting);

              // ✅ 충돌 해결: 기존 동일한 미팅 확인
              const existingMeeting = schedules.find(s => {
                if (s.type !== 'buildup_project') return false;
                const buildupSchedule = s as BuildupProjectMeeting;
                return buildupSchedule.projectId === projectId &&
                       buildupSchedule.meetingSequence === meeting.meetingSequence &&
                       Math.abs(new Date(s.date).getTime() - new Date(meeting.date).getTime()) < 60000; // 1분 이내
              });

              if (existingMeeting) {
                console.log(`⚠️ Conflict detected: Similar meeting already exists`, {
                  existingId: existingMeeting.id,
                  existingTitle: existingMeeting.title,
                  newTitle: meeting.title,
                  source
                });

                // 충돌 해결: 최신 정보로 업데이트
                await updateSchedule(existingMeeting.id, {
                  title: meeting.title,
                  description: meeting.description || existingMeeting.description,
                  startDateTime: new Date(meeting.startDateTime),
                  endDateTime: new Date(meeting.endDateTime),
                  location: meeting.location || (existingMeeting as any).location,
                  participants: meeting.participants || existingMeeting.participants,
                  updatedBy: `conflict_resolved_from_${source}`,
                  tags: [...(existingMeeting.tags || []), 'conflict-resolved']
                });

                console.log(`✅ Conflict resolved by updating existing meeting: ${existingMeeting.id}`);

                // 충돌 해결 완료 알림
                const conflictResolvedEvent = new CustomEvent('schedule:conflict_resolved', {
                  detail: {
                    source: 'ScheduleContext',
                    projectId,
                    resolvedScheduleId: existingMeeting.id,
                    resolutionType: 'updated_existing',
                    conflictDetails: {
                      originalSource: source,
                      attemptedTitle: meeting.title,
                      resolvedTitle: existingMeeting.title
                    },
                    timestamp: new Date(),
                    originalEventId: eventId
                  }
                });
                window.dispatchEvent(conflictResolvedEvent);

                return; // 새로 생성하지 않고 종료
              }

              // 충돌이 없으면 새로 생성
              const newMeeting = await createSchedule<BuildupProjectMeeting>({
                type: 'buildup_project',
                title: meeting.title,
                description: meeting.description || '',
                date: new Date(meeting.date),
                startDateTime: new Date(meeting.startDateTime),
                endDateTime: new Date(meeting.endDateTime),
                projectId,
                meetingSequence: meeting.meetingSequence,
                agenda: meeting.agenda || [],
                deliverables: meeting.deliverables || [],
                participants: meeting.participants || [],
                location: meeting.location,
                status: 'scheduled',
                priority: 'medium',
                tags: ['buildup', 'project-meeting'],
                createdBy: `sync_from_${source}`,
                phaseTransitionTrigger: meeting.phaseTransitionTrigger
              });

              console.log(`✅ Meeting created with ID: ${newMeeting.id}`);

              // 생성 완료 알림
              const createCompleteEvent = new CustomEvent('schedule:create_complete', {
                detail: {
                  source: 'ScheduleContext',
                  projectId,
                  schedule: newMeeting,
                  timestamp: new Date(),
                  originalEventId: eventId
                }
              });
              window.dispatchEvent(createCompleteEvent);
            }
            break;

          case 'update_meeting':
            if (meeting && meeting.id) {
              console.log(`📝 Updating meeting from ${source}:`, meeting);

              // ✅ 충돌 해결: 스케줄 존재 여부 및 동시 업데이트 확인
              const existingSchedule = schedules.find(s => s.id === meeting.id);

              if (!existingSchedule) {
                console.warn(`⚠️ Update conflict: Schedule not found for ID ${meeting.id} from ${source}`);

                // 스케줄이 없으면 생성 시도
                const fallbackCreateEvent = new CustomEvent('schedule:sync_requested', {
                  detail: {
                    eventId: `${eventId}_fallback_create`,
                    source: `${source}_fallback`,
                    projectId,
                    meeting: {
                      ...meeting,
                      id: undefined // ID 제거하여 새로 생성
                    },
                    operation: 'create_meeting',
                    timestamp: new Date(),
                    fallbackReason: 'schedule_not_found'
                  }
                });

                console.log(`🔄 Fallback to create for missing schedule: ${meeting.id}`);
                window.dispatchEvent(fallbackCreateEvent);
                return;
              }

              // 동시 업데이트 감지 (updatedAt 확인)
              const lastUpdate = existingSchedule.updatedAt;
              const timeSinceUpdate = lastUpdate ? Date.now() - new Date(lastUpdate).getTime() : Infinity;

              if (timeSinceUpdate < 5000) { // 5초 이내 업데이트
                console.log(`⚠️ Concurrent update detected for schedule ${meeting.id}`, {
                  lastUpdate,
                  timeSinceUpdate,
                  source
                });

                // 태그에 동시 업데이트 마킹
                const conflictTag = `concurrent-update-${Date.now()}`;
                meeting.tags = [...(meeting.tags || []), conflictTag];
              }

              await updateSchedule(meeting.id, {
                title: meeting.title,
                description: meeting.description,
                date: meeting.date ? new Date(meeting.date) : undefined,
                startDateTime: meeting.startDateTime ? new Date(meeting.startDateTime) : undefined,
                endDateTime: meeting.endDateTime ? new Date(meeting.endDateTime) : undefined,
                status: meeting.status,
                location: meeting.location,
                tags: meeting.tags,
                updatedBy: `sync_from_${source}`
              });

              console.log(`✅ Meeting updated: ${meeting.id}`);

              // 업데이트 완료 알림
              const updateCompleteEvent = new CustomEvent('schedule:update_complete', {
                detail: {
                  source: 'ScheduleContext',
                  projectId,
                  scheduleId: meeting.id,
                  timestamp: new Date(),
                  originalEventId: eventId,
                  conflictResolved: timeSinceUpdate < 5000
                }
              });
              window.dispatchEvent(updateCompleteEvent);
            }
            break;

          case 'delete_meeting':
            if (meeting && meeting.id) {
              console.log(`🗑️ Deleting meeting from ${source}: ${meeting.id}`);

              await deleteSchedule(meeting.id);

              console.log(`✅ Meeting deleted: ${meeting.id}`);

              // 삭제 완료 알림
              const deleteCompleteEvent = new CustomEvent('schedule:delete_complete', {
                detail: {
                  source: 'ScheduleContext',
                  projectId,
                  scheduleId: meeting.id,
                  timestamp: new Date(),
                  originalEventId: eventId
                }
              });
              window.dispatchEvent(deleteCompleteEvent);
            }
            break;

          default:
            console.warn(`⚠️ Unknown sync operation: ${operation}`);
        }
      } catch (error) {
        console.error(`❌ Sync operation failed:`, error);

        // 에러 알림
        const errorEvent = new CustomEvent('schedule:sync_error', {
          detail: {
            source: 'ScheduleContext',
            projectId,
            operation,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
            originalEventId: eventId
          }
        });
        window.dispatchEvent(errorEvent);
      }
    };

    // Calendar나 ProjectDetail에서 발생하는 Phase Transition 수신
    const handlePhaseTransitionRequested = async (e: CustomEvent) => {
      const { projectId, fromPhase, toPhase, scheduleId, source, eventId } = e.detail;

      console.log(`🔄 ScheduleContext received phase transition request:`, {
        projectId,
        fromPhase,
        toPhase,
        scheduleId,
        source,
        eventId
      });

      try {
        // 프로젝트의 모든 관련 스케줄에 Phase Transition 정보 업데이트
        const projectSchedules = getSchedulesByProject(projectId);
        const buildupMeetings = projectSchedules.filter(s => s.type === 'buildup_project') as BuildupProjectMeeting[];

        console.log(`📊 Updating phase info for ${buildupMeetings.length} buildup meetings`);

        // 배치 업데이트
        const updatePromises = buildupMeetings.map(meeting => {
          const updatedTags = [...(meeting.tags || [])];

          // 기존 phase 태그 제거
          const phaseTagIndex = updatedTags.findIndex(tag => tag.startsWith('phase:'));
          if (phaseTagIndex !== -1) {
            updatedTags.splice(phaseTagIndex, 1);
          }

          // 새 phase 태그 추가
          updatedTags.push(`phase:${toPhase}`);

          return updateSchedule(meeting.id, {
            tags: updatedTags,
            updatedBy: `phase_transition_from_${source}`,
            // description에 transition 정보 추가
            description: `${meeting.description || ''}\n\n[Phase Transition: ${fromPhase} → ${toPhase}]`.trim()
          });
        });

        await Promise.all(updatePromises);

        console.log(`✅ Phase transition completed for ${buildupMeetings.length} meetings`);

        // Phase Transition 완료 알림
        const transitionCompleteEvent = new CustomEvent('schedule:phase_transition_complete', {
          detail: {
            source: 'ScheduleContext',
            projectId,
            fromPhase,
            toPhase,
            updatedScheduleCount: buildupMeetings.length,
            timestamp: new Date(),
            originalEventId: eventId
          }
        });
        window.dispatchEvent(transitionCompleteEvent);

      } catch (error) {
        console.error(`❌ Phase transition failed:`, error);

        // Phase Transition 에러 알림
        const errorEvent = new CustomEvent('schedule:phase_transition_error', {
          detail: {
            source: 'ScheduleContext',
            projectId,
            fromPhase,
            toPhase,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
            originalEventId: eventId
          }
        });
        window.dispatchEvent(errorEvent);
      }
    };

    // BuildupContext에서 발생하는 데이터 변경 수신
    const handleBuildupDataChanged = async (e: CustomEvent) => {
      const { projectId, changeType, data, source, eventId } = e.detail;

      console.log(`🔄 ScheduleContext received buildup data change:`, {
        projectId,
        changeType,
        source,
        eventId
      });

      try {
        switch (changeType) {
          case 'project_updated':
            // 프로젝트 정보 변경 시 관련 스케줄 업데이트
            const projectSchedules = getSchedulesByProject(projectId);

            if (data.title || data.description) {
              const updatePromises = projectSchedules.map(schedule => {
                const updates: any = {
                  updatedBy: `project_update_from_${source}`
                };

                if (data.title && schedule.type === 'buildup_project') {
                  updates.title = `${data.title} - ${(schedule as BuildupProjectMeeting).meetingSequence}차 미팅`;
                }

                return updateSchedule(schedule.id, updates);
              });

              await Promise.all(updatePromises);
              console.log(`✅ Updated ${projectSchedules.length} schedules for project info change`);
            }
            break;

          case 'meetings_batch_updated':
            // 외부에서 미팅 정보가 배치 업데이트된 경우
            if (Array.isArray(data.meetings)) {
              console.log(`📦 Processing ${data.meetings.length} meeting updates from ${source}`);

              for (const meetingData of data.meetings) {
                const existingSchedule = getScheduleById(meetingData.id);
                if (existingSchedule) {
                  await updateSchedule(meetingData.id, {
                    title: meetingData.title,
                    description: meetingData.description,
                    date: meetingData.date ? new Date(meetingData.date) : undefined,
                    status: meetingData.status,
                    updatedBy: `batch_update_from_${source}`
                  });
                }
              }
            }
            break;

          default:
            console.log(`ℹ️ Unhandled buildup change type: ${changeType}`);
        }

        // 처리 완료 알림
        const processCompleteEvent = new CustomEvent('schedule:buildup_change_processed', {
          detail: {
            source: 'ScheduleContext',
            projectId,
            changeType,
            timestamp: new Date(),
            originalEventId: eventId
          }
        });
        window.dispatchEvent(processCompleteEvent);

      } catch (error) {
        console.error(`❌ Buildup data change processing failed:`, error);

        const errorEvent = new CustomEvent('schedule:buildup_change_error', {
          detail: {
            source: 'ScheduleContext',
            projectId,
            changeType,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
            originalEventId: eventId
          }
        });
        window.dispatchEvent(errorEvent);
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('schedule:sync_requested', handleSyncRequested);
    window.addEventListener('project:phase_transition_requested', handlePhaseTransitionRequested);
    window.addEventListener('buildup:data_changed', handleBuildupDataChanged);

    // 클린업
    return () => {
      console.log('🧹 ScheduleContext: Cleaning up bidirectional sync event listeners');
      window.removeEventListener('schedule:sync_requested', handleSyncRequested);
      window.removeEventListener('project:phase_transition_requested', handlePhaseTransitionRequested);
      window.removeEventListener('buildup:data_changed', handleBuildupDataChanged);
    };
  }, [getSchedulesByProject, createSchedule, updateSchedule, deleteSchedule, getScheduleById]);

  // GlobalContextManager에 자동 등록
  const { isRegistered, status } = useContextRegistration({
    name: 'schedule',
    context: contextValue,
    metadata: CONTEXT_METADATA.schedule,
    dependencies: ['toast'], // Toast에 의존
    autoRegister: true,
    onReady: () => {
      console.log('✅ ScheduleContext registered with GlobalContextManager');
    },
    onError: (error) => {
      console.error('❌ Failed to register ScheduleContext:', error);
    }
  });

  // 등록 상태 디버그 (개발 환경)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('ScheduleContext registration status:', {
        isRegistered,
        status: status.status,
        errorCount: status.errorCount
      });
    }
  }, [isRegistered, status]);

  return (
    <ScheduleContext.Provider value={contextValue}>
      {children}
    </ScheduleContext.Provider>
  );
}

// ============================================================================
// Custom Hook
// ============================================================================

/**
 * ScheduleContext 사용 Hook
 */
export function useScheduleContext(): ScheduleContextType {
  const context = useContext(ScheduleContext);

  if (!context) {
    throw new Error('useScheduleContext must be used within ScheduleProvider');
  }

  return context;
}

// ============================================================================
// Export
// ============================================================================

export default ScheduleContext;

// 재수출 for convenience
export { SCHEDULE_EVENTS };