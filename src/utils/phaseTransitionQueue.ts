/**
 * @fileoverview Phase Transition Queue 시스템
 * @description 동시성 제어 및 순차 처리를 위한 큐 관리 시스템
 * @author PocketCompany
 * @since 2025-01-19
 */

import { EdgeCaseLogger } from './edgeCaseScenarios';

/**
 * 큐 작업 항목 타입
 */
export interface TransitionQueueItem {
  id: string;
  projectId: string;
  operation: TransitionOperation;
  payload: any;
  priority: number;
  timestamp: Date;
  status: QueueItemStatus;
  retryCount: number;
  maxRetries: number;
  error?: Error;
  executionTime?: number;
}

/**
 * 작업 타입 정의
 */
export type TransitionOperation =
  | 'meeting_creation'
  | 'phase_transition'
  | 'data_sync'
  | 'meeting_update'
  | 'meeting_deletion'
  | 'mock_migration';

/**
 * 큐 아이템 상태
 */
export type QueueItemStatus =
  | 'pending'     // 대기 중
  | 'processing'  // 처리 중
  | 'completed'   // 완료
  | 'failed'      // 실패
  | 'cancelled';  // 취소됨

/**
 * 큐 처리 결과
 */
export interface QueueProcessResult {
  success: boolean;
  item: TransitionQueueItem;
  result?: any;
  error?: Error;
  duration: number;
}

/**
 * 큐 통계 정보
 */
export interface QueueStatistics {
  totalItems: number;
  pendingItems: number;
  processingItems: number;
  completedItems: number;
  failedItems: number;
  averageProcessingTime: number;
  projectQueues: Record<string, number>;
}

/**
 * Phase Transition Queue 클래스
 */
export class PhaseTransitionQueue {
  private queue: Map<string, TransitionQueueItem[]> = new Map(); // projectId -> items[]
  private processing: Set<string> = new Set(); // 현재 처리 중인 projectId들
  private globalLock: boolean = false;
  private statistics: QueueStatistics;

  constructor() {
    this.statistics = {
      totalItems: 0,
      pendingItems: 0,
      processingItems: 0,
      completedItems: 0,
      failedItems: 0,
      averageProcessingTime: 0,
      projectQueues: {}
    };

    // 주기적 통계 업데이트
    setInterval(() => this.updateStatistics(), 5000);
  }

  /**
   * 큐에 작업 추가
   */
  async enqueue(item: Omit<TransitionQueueItem, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<string> {
    const queueItem: TransitionQueueItem = {
      ...item,
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      status: 'pending',
      retryCount: 0,
      maxRetries: item.maxRetries || 3
    };

    // 프로젝트별 큐 가져오기 또는 생성
    if (!this.queue.has(item.projectId)) {
      this.queue.set(item.projectId, []);
    }

    const projectQueue = this.queue.get(item.projectId)!;

    // 중복 작업 확인 (동일한 operation + payload)
    const isDuplicate = projectQueue.some(existing =>
      existing.operation === item.operation &&
      existing.status === 'pending' &&
      JSON.stringify(existing.payload) === JSON.stringify(item.payload)
    );

    if (isDuplicate) {
      EdgeCaseLogger.log('EC_CONCURRENT_002', {
        projectId: item.projectId,
        operation: item.operation,
        reason: 'Duplicate queue item detected'
      });
      console.warn(`🚫 Duplicate queue item detected for project ${item.projectId}:`, item.operation);
      return queueItem.id; // 중복 시 기존 작업 ID 반환
    }

    // 우선순위에 따라 정렬하여 삽입
    const insertIndex = projectQueue.findIndex(existing => existing.priority < item.priority);
    if (insertIndex === -1) {
      projectQueue.push(queueItem);
    } else {
      projectQueue.splice(insertIndex, 0, queueItem);
    }

    console.log(`📋 Enqueued ${item.operation} for project ${item.projectId} (Queue: ${projectQueue.length})`);

    // 자동으로 처리 시작
    this.processProjectQueue(item.projectId);

    return queueItem.id;
  }

  /**
   * 프로젝트별 큐 처리
   */
  async processProjectQueue(projectId: string): Promise<void> {
    // 이미 처리 중이면 스킵
    if (this.processing.has(projectId) || this.globalLock) {
      return;
    }

    const projectQueue = this.queue.get(projectId);
    if (!projectQueue || projectQueue.length === 0) {
      return;
    }

    // 처리할 작업 찾기 (pending 상태 중 가장 높은 우선순위)
    const pendingItem = projectQueue.find(item => item.status === 'pending');
    if (!pendingItem) {
      return;
    }

    // 프로젝트 락 획득
    this.processing.add(projectId);
    pendingItem.status = 'processing';

    console.log(`🔄 Processing ${pendingItem.operation} for project ${projectId}`);

    try {
      const startTime = Date.now();
      const result = await this.executeOperation(pendingItem);
      const duration = Date.now() - startTime;

      if (result.success) {
        pendingItem.status = 'completed';
        pendingItem.executionTime = duration;
        console.log(`✅ Completed ${pendingItem.operation} for project ${projectId} (${duration}ms)`);
      } else {
        throw result.error || new Error('Operation failed');
      }

    } catch (error) {
      console.error(`❌ Failed ${pendingItem.operation} for project ${projectId}:`, error);

      pendingItem.error = error as Error;
      pendingItem.retryCount++;

      if (pendingItem.retryCount >= pendingItem.maxRetries) {
        pendingItem.status = 'failed';
        EdgeCaseLogger.log('EC_SYSTEM_001', {
          projectId,
          operation: pendingItem.operation,
          error: error.message,
          retryCount: pendingItem.retryCount
        });
      } else {
        // 재시도를 위해 다시 pending 상태로
        pendingItem.status = 'pending';
        console.log(`🔄 Retrying ${pendingItem.operation} for project ${projectId} (${pendingItem.retryCount}/${pendingItem.maxRetries})`);
      }
    } finally {
      // 프로젝트 락 해제
      this.processing.delete(projectId);

      // 큐에 남은 작업이 있으면 계속 처리
      setTimeout(() => this.processProjectQueue(projectId), 100);
    }
  }

  /**
   * 실제 작업 실행
   */
  private async executeOperation(item: TransitionQueueItem): Promise<QueueProcessResult> {
    const startTime = Date.now();

    try {
      let result: any;

      switch (item.operation) {
        case 'meeting_creation':
          result = await this.executeMeetingCreation(item);
          break;

        case 'phase_transition':
          result = await this.executePhaseTransition(item);
          break;

        case 'data_sync':
          result = await this.executeDataSync(item);
          break;

        case 'meeting_update':
          result = await this.executeMeetingUpdate(item);
          break;

        case 'meeting_deletion':
          result = await this.executeMeetingDeletion(item);
          break;

        case 'mock_migration':
          result = await this.executeMockMigration(item);
          break;

        default:
          throw new Error(`Unknown operation: ${item.operation}`);
      }

      return {
        success: true,
        item,
        result,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        item,
        error: error as Error,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * 미팅 생성 실행
   */
  private async executeMeetingCreation(item: TransitionQueueItem): Promise<any> {
    const { scheduleData, phaseTransition } = item.payload;

    // ScheduleContext를 통한 미팅 생성
    if (window.scheduleContext) {
      const schedule = await window.scheduleContext.createSchedule(scheduleData);

      // Phase transition 트리거
      if (phaseTransition) {
        window.dispatchEvent(new CustomEvent('schedule:phase_transition_triggered', {
          detail: { ...phaseTransition, scheduleId: schedule.id }
        }));
      }

      return schedule;
    }

    throw new Error('ScheduleContext not available');
  }

  /**
   * Phase transition 실행
   */
  private async executePhaseTransition(item: TransitionQueueItem): Promise<any> {
    const { projectId, fromPhase, toPhase, trigger } = item.payload;

    // BuildupContext를 통한 phase transition
    if (window.buildupContext?.executePhaseTransition) {
      await window.buildupContext.executePhaseTransition(projectId, toPhase, trigger);
      return { projectId, fromPhase, toPhase };
    }

    throw new Error('BuildupContext not available');
  }

  /**
   * 데이터 동기화 실행
   */
  private async executeDataSync(item: TransitionQueueItem): Promise<any> {
    const { syncType, data } = item.payload;

    switch (syncType) {
      case 'schedule_to_project':
        // ScheduleContext → BuildupContext 동기화
        break;

      case 'project_to_schedule':
        // BuildupContext → ScheduleContext 동기화
        break;

      default:
        throw new Error(`Unknown sync type: ${syncType}`);
    }

    return { syncType, synced: true };
  }

  /**
   * 미팅 업데이트 실행
   */
  private async executeMeetingUpdate(item: TransitionQueueItem): Promise<any> {
    const { scheduleId, updates } = item.payload;

    if (window.scheduleContext?.updateSchedule) {
      await window.scheduleContext.updateSchedule(scheduleId, updates);
      return { scheduleId, updates };
    }

    throw new Error('ScheduleContext not available');
  }

  /**
   * 미팅 삭제 실행
   */
  private async executeMeetingDeletion(item: TransitionQueueItem): Promise<any> {
    const { scheduleId } = item.payload;

    if (window.scheduleContext?.deleteSchedule) {
      await window.scheduleContext.deleteSchedule(scheduleId);
      return { scheduleId };
    }

    throw new Error('ScheduleContext not available');
  }

  /**
   * Mock 데이터 마이그레이션 실행
   */
  private async executeMockMigration(item: TransitionQueueItem): Promise<any> {
    const { mockMeetings } = item.payload;

    if (window.scheduleContext?.createSchedulesBatch) {
      const results = await window.scheduleContext.createSchedulesBatch(mockMeetings);
      return { migrated: results.length };
    }

    throw new Error('ScheduleContext not available');
  }

  /**
   * 큐 상태 조회
   */
  getQueueStatus(projectId: string): TransitionQueueItem[] {
    return this.queue.get(projectId) || [];
  }

  /**
   * 전체 큐 상태 조회
   */
  getAllQueues(): Record<string, TransitionQueueItem[]> {
    const result: Record<string, TransitionQueueItem[]> = {};
    this.queue.forEach((items, projectId) => {
      result[projectId] = items;
    });
    return result;
  }

  /**
   * 큐 정리 (완료/실패된 작업 제거)
   */
  cleanup(projectId?: string): void {
    if (projectId) {
      const queue = this.queue.get(projectId);
      if (queue) {
        const activeItems = queue.filter(item =>
          item.status === 'pending' || item.status === 'processing'
        );
        this.queue.set(projectId, activeItems);
      }
    } else {
      // 모든 프로젝트 큐 정리
      this.queue.forEach((items, pid) => {
        const activeItems = items.filter(item =>
          item.status === 'pending' || item.status === 'processing'
        );
        this.queue.set(pid, activeItems);
      });
    }
  }

  /**
   * 통계 업데이트
   */
  private updateStatistics(): void {
    let totalItems = 0;
    let pendingItems = 0;
    let processingItems = 0;
    let completedItems = 0;
    let failedItems = 0;
    let totalExecutionTime = 0;
    let executedItems = 0;
    const projectQueues: Record<string, number> = {};

    this.queue.forEach((items, projectId) => {
      projectQueues[projectId] = items.length;

      items.forEach(item => {
        totalItems++;
        switch (item.status) {
          case 'pending': pendingItems++; break;
          case 'processing': processingItems++; break;
          case 'completed':
            completedItems++;
            if (item.executionTime) {
              totalExecutionTime += item.executionTime;
              executedItems++;
            }
            break;
          case 'failed': failedItems++; break;
        }
      });
    });

    this.statistics = {
      totalItems,
      pendingItems,
      processingItems,
      completedItems,
      failedItems,
      averageProcessingTime: executedItems > 0 ? totalExecutionTime / executedItems : 0,
      projectQueues
    };
  }

  /**
   * 통계 조회
   */
  getStatistics(): QueueStatistics {
    return { ...this.statistics };
  }

  /**
   * 전역 락 설정 (시스템 유지보수 시 사용)
   */
  setGlobalLock(locked: boolean): void {
    this.globalLock = locked;
    console.log(`🔒 Global queue lock: ${locked}`);
  }
}

/**
 * 전역 큐 인스턴스
 */
export const globalTransitionQueue = new PhaseTransitionQueue();

/**
 * 큐 시스템을 전역 객체에 등록 (디버깅용)
 */
if (typeof window !== 'undefined') {
  (window as any).transitionQueue = globalTransitionQueue;
}