/**
 * @fileoverview 전역 타입 정의
 * @description Phase 4-2에서 추가된 전역 객체들의 타입 정의
 * @author PocketCompany
 * @since 2025-01-19
 */

import type { Project, PhaseTransitionEvent } from './buildup.types';
import type { UnifiedSchedule } from './schedule.types';
import type { PhaseTransitionQueue } from '../utils/phaseTransitionQueue';
import type { StateSnapshotManager } from '../utils/stateSnapshot';
import type { MockDataMigrator } from '../utils/dataMigration';
import type { EventEmitter } from 'events';

declare global {
  interface Window {
    // Phase 4-2: Queue system
    transitionQueue: PhaseTransitionQueue;

    // Phase 4-2: Snapshot system
    snapshotManager: StateSnapshotManager;

    // Phase 4-2: Migration system
    migrator: MockDataMigrator;

    // Phase 4-2: BuildupContext reference for queue
    buildupContext: {
      projects: Project[];
      setProjects: (projects: Project[] | ((prev: Project[]) => Project[])) => void;
      phaseTransitionEvents: PhaseTransitionEvent[];
      setPhaseTransitionEvents: (events: PhaseTransitionEvent[] | ((prev: PhaseTransitionEvent[]) => PhaseTransitionEvent[])) => void;
      executePhaseTransition: (projectId: string, toPhase: string, trigger: string, metadata?: any) => Promise<void>;
    };

    // Phase 4-2: ScheduleContext reference for queue
    scheduleContext: {
      createSchedule: <T extends UnifiedSchedule>(scheduleData: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => Promise<T>;
      updateSchedule: (id: string, updates: Partial<Omit<UnifiedSchedule, 'id' | 'type' | 'createdAt' | 'createdBy'>>) => Promise<void>;
      deleteSchedule: (id: string) => Promise<void>;
      getScheduleById: (id: string) => UnifiedSchedule | undefined;
      getSchedulesByProject: (projectId: string) => UnifiedSchedule[];
      createSchedulesBatch: <T extends UnifiedSchedule>(schedules: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>, options?: { skipDuplicateCheck?: boolean; suppressEvents?: boolean; source?: string; }) => Promise<T[]>;
    };

    // Event Emitters for cross-context communication
    scheduleEventEmitter?: EventEmitter;
    buildupEventEmitter?: EventEmitter;
    dashboardEventEmitter?: EventEmitter;

    // Debug utilities for contexts
    __DEBUG_CONTEXTS__?: {
      list: () => string[];
      get: (name: string) => any;
      test: (name: string) => boolean;
      status: () => Record<string, boolean>;
    };

    // 기존 테스트 도구 확장
    syncTest: {
      runInitialSync: () => void;
      getSyncStatus: () => any;
      validateSync: () => void;
      checkProjectSchedules: () => void;
      forcePurgeAndResync: () => void;

      // Phase 4-2: 새로운 테스트 도구들
      runMockMigration: () => Promise<void>;
      getQueueStatus: () => Record<string, any[]>;
      getSnapshots: (projectId?: string) => any[];
      getEdgeCaseLogs: () => any[];
    };

    // 기존 다른 테스트 도구들
    testBuildupSync?: any;
    testPhaseTransition?: any;
    testUIFeedback?: any;
    testUIIntegration?: any;

    // Debug utility for forcing mock schedule reload
    forceReloadMockSchedules?: () => string;
  }
}

export {};