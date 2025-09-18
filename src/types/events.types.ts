/**
 * @fileoverview Context 간 통신을 위한 이벤트 타입 정의
 * @description ScheduleContext와 BuildupContext 간의 안전한 양방향 통신을 위한 타입 시스템
 * @author PocketCompany
 * @since 2025-01-18
 *
 * 설계 원칙:
 * 1. 순환 참조 방지 - EventSourceTracker로 중복 처리 방지
 * 2. 타입 안전성 - 모든 이벤트에 대한 엄격한 타입 정의
 * 3. 확장성 - 새로운 Context 추가 시 쉽게 확장 가능
 * 4. 디버깅 - 상세한 메타데이터와 로깅 정보 포함
 */

import type { UnifiedSchedule, BuildupProjectMeeting } from './schedule.types';
import type { Meeting, Project } from './buildup.types';

// ============================================================================
// Event Types
// ============================================================================

/**
 * Context 간 통신에 사용되는 이벤트 액션 타입
 */
export type ScheduleEventAction =
  | 'created'     // 새 스케줄 생성
  | 'updated'     // 기존 스케줄 수정
  | 'deleted'     // 스케줄 삭제
  | 'synced'      // 초기 동기화
  | 'linked'      // 프로젝트와 연결
  | 'unlinked';   // 프로젝트 연결 해제

/**
 * 이벤트 소스 - 어느 Context에서 발생했는지 추적
 */
export type EventSource =
  | 'ScheduleContext'
  | 'BuildupContext'
  | 'CalendarContext'
  | 'System'
  | 'User';

/**
 * 동기화 방향
 */
export type SyncDirection =
  | 'schedule-to-buildup'    // ScheduleContext → BuildupContext
  | 'buildup-to-schedule'    // BuildupContext → ScheduleContext
  | 'bidirectional';          // 양방향

// ============================================================================
// Event Detail Interfaces
// ============================================================================

/**
 * Phase Transition 정보
 */
export interface PhaseTransitionInfo {
  fromPhase: string;
  toPhase: string;
  trigger: 'meeting_scheduled' | 'meeting_completed' | 'manual' | 'payment';
  meetingSequence?: string;
  automatic: boolean;
}

/**
 * 스케줄 이벤트 상세 정보
 */
export interface ScheduleEventDetail {
  /** 이벤트 액션 타입 */
  action: ScheduleEventAction;

  /** 스케줄 데이터 */
  schedule: UnifiedSchedule;

  /** 이벤트 발생 소스 */
  source: EventSource;

  /** 이벤트 발생 시간 */
  timestamp: number;

  /** 이벤트 고유 ID (순환 참조 방지용) */
  eventId?: string;

  /** 추가 메타데이터 */
  metadata?: {
    /** 프로젝트 ID (빌드업 미팅인 경우) */
    projectId?: string;

    /** 프로젝트 제목 */
    projectTitle?: string;

    /** Phase Transition 정보 */
    phaseTransition?: PhaseTransitionInfo;

    /** 이전 상태 (업데이트의 경우) */
    previousState?: Partial<UnifiedSchedule>;

    /** 동기화 방향 */
    syncDirection?: SyncDirection;

    /** 사용자 ID */
    userId?: string;

    /** 추가 컨텍스트 정보 */
    context?: Record<string, any>;
  };
}

/**
 * BuildupContext 이벤트 상세 정보
 */
export interface BuildupEventDetail {
  /** 이벤트 액션 타입 */
  action: 'meeting_added' | 'meeting_updated' | 'meeting_removed' | 'project_updated';

  /** 프로젝트 ID */
  projectId: string;

  /** 미팅 ID (미팅 관련 이벤트인 경우) */
  meetingId?: string;

  /** 미팅 데이터 (미팅 관련 이벤트인 경우) */
  meeting?: Meeting;

  /** 프로젝트 데이터 (프로젝트 업데이트인 경우) */
  project?: Partial<Project>;

  /** 이벤트 발생 소스 */
  source: EventSource;

  /** 이벤트 발생 시간 */
  timestamp: number;

  /** 이벤트 고유 ID */
  eventId?: string;

  /** 추가 메타데이터 */
  metadata?: {
    /** 이전 상태 (업데이트의 경우) */
    previousState?: Partial<Meeting>;
    /** 동기화 방향 */
    syncDirection?: SyncDirection;
  };
}

// ============================================================================
// Event Names Constants
// ============================================================================

/**
 * 시스템 전체에서 사용되는 이벤트 이름 상수
 */
export const CONTEXT_EVENTS = {
  // ScheduleContext 발생 이벤트
  SCHEDULE_CREATED: 'schedule:created',
  SCHEDULE_UPDATED: 'schedule:updated',
  SCHEDULE_DELETED: 'schedule:deleted',
  SCHEDULE_SYNCED: 'schedule:synced',
  BUILDUP_MEETING_CREATED: 'schedule:buildup_meeting_created',

  // BuildupContext 발생 이벤트
  BUILDUP_MEETING_ADDED: 'buildup:meeting_added',
  BUILDUP_MEETING_UPDATED: 'buildup:meeting_updated',
  BUILDUP_MEETING_REMOVED: 'buildup:meeting_removed',
  BUILDUP_PROJECT_UPDATED: 'buildup:project_updated',

  // 시스템 이벤트
  SYNC_STARTED: 'system:sync_started',
  SYNC_COMPLETED: 'system:sync_completed',
  SYNC_ERROR: 'system:sync_error'
} as const;

// ============================================================================
// Event Source Tracker (순환 참조 방지)
// ============================================================================

/**
 * 순환 참조 방지를 위한 이벤트 추적기
 * 동일한 이벤트가 Context 간에 무한 반복되는 것을 방지
 */
export class EventSourceTracker {
  private static processingEvents = new Map<string, number>();
  private static readonly CLEANUP_DELAY = 1000; // 1초 후 정리
  private static readonly MAX_RETRIES = 3;

  /**
   * 이벤트 고유 ID 생성
   */
  static createEventId(detail: ScheduleEventDetail | BuildupEventDetail): string {
    const baseId = `${detail.action}-${detail.timestamp}`;

    if ('schedule' in detail && detail.schedule) {
      return `${baseId}-${detail.schedule.id}`;
    }

    if ('meeting' in detail && detail.meeting) {
      return `${baseId}-${detail.meeting.id}`;
    }

    if ('projectId' in detail) {
      return `${baseId}-${detail.projectId}`;
    }

    return baseId;
  }

  /**
   * 이벤트 처리 가능 여부 확인
   * @returns true면 처리 가능, false면 이미 처리 중 (순환 참조)
   */
  static shouldProcess(eventId: string): boolean {
    const retryCount = this.processingEvents.get(eventId) || 0;

    if (retryCount >= this.MAX_RETRIES) {
      console.warn(`[EventSourceTracker] Event ${eventId} exceeded max retries`);
      return false;
    }

    this.processingEvents.set(eventId, retryCount + 1);

    // 일정 시간 후 자동 정리
    setTimeout(() => {
      this.processingEvents.delete(eventId);
    }, this.CLEANUP_DELAY);

    return retryCount === 0;
  }

  /**
   * 이벤트 처리 완료 표시
   */
  static markProcessed(eventId: string): void {
    // 즉시 제거하지 않고 짧은 시간 유지 (동시 이벤트 처리 방지)
    setTimeout(() => {
      this.processingEvents.delete(eventId);
    }, 100);
  }

  /**
   * 추적 중인 이벤트 개수 (디버깅용)
   */
  static getActiveCount(): number {
    return this.processingEvents.size;
  }

  /**
   * 모든 추적 정보 초기화 (테스트용)
   */
  static reset(): void {
    this.processingEvents.clear();
  }
}

// ============================================================================
// Event Helper Functions
// ============================================================================

/**
 * CustomEvent 생성 헬퍼
 */
export function createScheduleEvent(
  eventType: keyof typeof CONTEXT_EVENTS,
  detail: ScheduleEventDetail
): CustomEvent<ScheduleEventDetail> {
  // eventId가 없으면 자동 생성
  if (!detail.eventId) {
    detail.eventId = EventSourceTracker.createEventId(detail);
  }

  return new CustomEvent(CONTEXT_EVENTS[eventType], {
    detail,
    bubbles: false,
    cancelable: false
  });
}

/**
 * BuildupEvent 생성 헬퍼
 */
export function createBuildupEvent(
  eventType: keyof typeof CONTEXT_EVENTS,
  detail: BuildupEventDetail
): CustomEvent<BuildupEventDetail> {
  if (!detail.eventId) {
    detail.eventId = EventSourceTracker.createEventId(detail);
  }

  return new CustomEvent(CONTEXT_EVENTS[eventType], {
    detail,
    bubbles: false,
    cancelable: false
  });
}

/**
 * 이벤트 로깅 헬퍼 (개발 환경)
 */
export function logEvent(
  eventName: string,
  detail: ScheduleEventDetail | BuildupEventDetail,
  context: string = 'Unknown'
): void {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date(detail.timestamp).toISOString();
    const emoji = detail.action === 'created' ? '🆕' :
                  detail.action === 'updated' ? '📝' :
                  detail.action === 'deleted' ? '🗑️' : '🔄';

    console.log(
      `${emoji} [${context}] ${eventName}`,
      {
        eventId: detail.eventId,
        action: detail.action,
        source: detail.source,
        timestamp,
        activeTrackers: EventSourceTracker.getActiveCount()
      },
      detail
    );
  }
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * ScheduleEventDetail 타입 가드
 */
export function isScheduleEventDetail(detail: any): detail is ScheduleEventDetail {
  return detail &&
    typeof detail.action === 'string' &&
    detail.schedule &&
    typeof detail.source === 'string' &&
    typeof detail.timestamp === 'number';
}

/**
 * BuildupEventDetail 타입 가드
 */
export function isBuildupEventDetail(detail: any): detail is BuildupEventDetail {
  return detail &&
    typeof detail.action === 'string' &&
    typeof detail.projectId === 'string' &&
    typeof detail.source === 'string' &&
    typeof detail.timestamp === 'number';
}

// ============================================================================
// Export Types
// ============================================================================

export type {
  UnifiedSchedule,
  BuildupProjectMeeting,
  Meeting,
  Project
};