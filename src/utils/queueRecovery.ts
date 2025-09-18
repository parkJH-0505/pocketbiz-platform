/**
 * @fileoverview 큐 시스템 복구 매니저
 * @description Sprint 4 Phase 4-4: 큐 시스템 장애 복구 및 모니터링
 * @author PocketCompany
 * @since 2025-01-19
 */

import type { PhaseTransitionQueueItem, QueueStatus } from '../utils/phaseTransitionQueue';
import { EdgeCaseLogger } from './edgeCaseScenarios';

/**
 * 큐 장애 유형
 */
export type QueueFailureType =
  | 'blocked_queue'        // 큐가 블로킹된 상태
  | 'stuck_item'           // 특정 아이템이 계속 실패
  | 'memory_leak'          // 메모리 누수
  | 'infinite_loop'        // 무한 루프
  | 'processing_timeout'   // 처리 타임아웃
  | 'queue_corruption'     // 큐 데이터 손상
  | 'dead_letter_overflow' // 데드 레터 큐 오버플로우
  | 'worker_failure';      // 워커 실패

/**
 * 복구 전략
 */
export type QueueRecoveryStrategy =
  | 'restart_queue'        // 큐 재시작
  | 'clear_stuck_items'    // 막힌 아이템 제거
  | 'reset_priorities'     // 우선순위 재설정
  | 'purge_failed_items'   // 실패한 아이템 정리
  | 'rebuild_queue'        // 큐 재구축
  | 'manual_intervention'; // 수동 개입 필요

/**
 * 큐 장애 정보
 */
export interface QueueFailureInfo {
  type: QueueFailureType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: Date;
  affectedItems: string[];
  queueName: string;
  symptoms: string[];
  suggestedStrategy: QueueRecoveryStrategy;
  autoRecoverable: boolean;
  metadata: {
    queueSize: number;
    processingItems: number;
    failedItems: number;
    oldestItemAge: number; // milliseconds
    averageProcessingTime: number;
  };
}

/**
 * 복구 결과
 */
export interface QueueRecoveryResult {
  success: boolean;
  strategy: QueueRecoveryStrategy;
  recoveredItems: number;
  removedItems: number;
  errors: string[];
  warnings: string[];
  duration: number;
  newQueueState: {
    size: number;
    processingCount: number;
    healthStatus: 'healthy' | 'warning' | 'critical';
  };
}

/**
 * 큐 모니터링 메트릭
 */
export interface QueueMetrics {
  timestamp: Date;
  queueName: string;
  size: number;
  processing: number;
  completed: number;
  failed: number;
  averageWaitTime: number;
  averageProcessingTime: number;
  throughput: number; // items per minute
  errorRate: number;  // percentage
  oldestItemAge: number;
  healthScore: number; // 0-100
}

/**
 * 큐 건강성 임계값
 */
const QUEUE_HEALTH_THRESHOLDS = {
  maxQueueSize: 100,                    // 큐 최대 크기
  maxProcessingTime: 300000,            // 5분 최대 처리 시간
  maxItemAge: 600000,                   // 10분 최대 대기 시간
  maxErrorRate: 0.1,                    // 10% 최대 오류율
  minThroughput: 1,                     // 분당 최소 1개 처리
  stuckItemThreshold: 180000,           // 3분 동안 처리 안되면 stuck
  deadLetterMaxSize: 50,                // 데드 레터 큐 최대 크기
  memoryLeakThreshold: 1000,            // 1000개 이상 누적시 메모리 누수 의심
};

/**
 * 큐 복구 매니저
 */
export class QueueRecoveryManager {
  private static monitoringInterval: NodeJS.Timeout | null = null;
  private static metrics: QueueMetrics[] = [];
  private static lastHealthCheck: Date | null = null;

  /**
   * 큐 모니터링 시작
   */
  static startMonitoring(intervalMs: number = 30000): void { // 30초마다
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    console.log('🔍 Starting queue monitoring...');

    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);

    // 즉시 첫 번째 체크 실행
    this.performHealthCheck();
  }

  /**
   * 큐 모니터링 중지
   */
  static stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('⏹️ Queue monitoring stopped');
    }
  }

  /**
   * 큐 건강성 체크
   */
  static async performHealthCheck(): Promise<QueueFailureInfo[]> {
    const failures: QueueFailureInfo[] = [];
    this.lastHealthCheck = new Date();

    try {
      // 큐 상태 가져오기
      const queueStatus = this.getQueueStatus();
      if (!queueStatus) {
        console.warn('⚠️ Queue status not available');
        return failures;
      }

      // 메트릭 수집
      const metrics = this.collectMetrics(queueStatus);
      this.metrics.push(metrics);

      // 오래된 메트릭 정리 (최근 24시간만 보관)
      const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;
      this.metrics = this.metrics.filter(m => m.timestamp.getTime() > cutoffTime);

      // 장애 감지
      const detectedFailures = this.detectFailures(metrics, queueStatus);
      failures.push(...detectedFailures);

      // 자동 복구 시도 (심각하지 않은 경우만)
      for (const failure of failures) {
        if (failure.autoRecoverable && failure.severity !== 'critical') {
          console.log(`🔧 Attempting auto-recovery for: ${failure.description}`);
          const recoveryResult = await this.attemptAutoRecovery(failure);

          if (recoveryResult.success) {
            console.log(`✅ Auto-recovery successful: ${failure.type}`);
          } else {
            console.log(`❌ Auto-recovery failed: ${failure.type}`);
          }
        }
      }

      // 건강성 로깅
      if (failures.length > 0) {
        const criticalCount = failures.filter(f => f.severity === 'critical').length;
        console.log(`🚨 Queue health check: ${failures.length} issues found (${criticalCount} critical)`);

        EdgeCaseLogger.log('EC_QUEUE_001', {
          failureCount: failures.length,
          criticalCount,
          queueSize: metrics.size,
          processingCount: metrics.processing,
          healthScore: metrics.healthScore
        });
      }

    } catch (error) {
      console.error('❌ Queue health check failed:', error);
      EdgeCaseLogger.log('EC_QUEUE_002', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    return failures;
  }

  /**
   * 큐 상태 가져오기
   */
  private static getQueueStatus(): any {
    if (window.transitionQueue?.getStatus) {
      return window.transitionQueue.getStatus();
    }
    return null;
  }

  /**
   * 메트릭 수집
   */
  private static collectMetrics(queueStatus: any): QueueMetrics {
    const now = new Date();
    const pendingItems = queueStatus.pending || [];
    const processingItems = queueStatus.processing || [];
    const completedItems = queueStatus.completed || [];
    const failedItems = queueStatus.failed || [];

    // 처리 시간 계산
    const recentCompleted = completedItems.filter((item: any) =>
      item.completedAt && (now.getTime() - new Date(item.completedAt).getTime()) < 3600000 // 최근 1시간
    );

    const averageProcessingTime = recentCompleted.length > 0
      ? recentCompleted.reduce((sum: number, item: any) =>
          sum + (new Date(item.completedAt).getTime() - new Date(item.startedAt || item.createdAt).getTime()), 0
        ) / recentCompleted.length
      : 0;

    // 대기 시간 계산
    const averageWaitTime = pendingItems.length > 0
      ? pendingItems.reduce((sum: number, item: any) =>
          sum + (now.getTime() - new Date(item.createdAt).getTime()), 0
        ) / pendingItems.length
      : 0;

    // 가장 오래된 아이템 나이
    const oldestItemAge = pendingItems.length > 0
      ? Math.max(...pendingItems.map((item: any) =>
          now.getTime() - new Date(item.createdAt).getTime()
        ))
      : 0;

    // 처리량 계산 (분당)
    const oneHourAgo = now.getTime() - 3600000;
    const recentlyCompleted = completedItems.filter((item: any) =>
      item.completedAt && new Date(item.completedAt).getTime() > oneHourAgo
    );
    const throughput = recentlyCompleted.length / 60; // per minute

    // 오류율 계산
    const totalProcessed = recentCompleted.length + failedItems.length;
    const errorRate = totalProcessed > 0 ? failedItems.length / totalProcessed : 0;

    // 건강성 점수 계산 (0-100)
    let healthScore = 100;

    if (pendingItems.length > QUEUE_HEALTH_THRESHOLDS.maxQueueSize) {
      healthScore -= 20;
    }
    if (oldestItemAge > QUEUE_HEALTH_THRESHOLDS.maxItemAge) {
      healthScore -= 20;
    }
    if (errorRate > QUEUE_HEALTH_THRESHOLDS.maxErrorRate) {
      healthScore -= 30;
    }
    if (throughput < QUEUE_HEALTH_THRESHOLDS.minThroughput && pendingItems.length > 0) {
      healthScore -= 20;
    }
    if (averageProcessingTime > QUEUE_HEALTH_THRESHOLDS.maxProcessingTime) {
      healthScore -= 10;
    }

    const metrics: QueueMetrics = {
      timestamp: now,
      queueName: 'phaseTransitionQueue',
      size: pendingItems.length,
      processing: processingItems.length,
      completed: completedItems.length,
      failed: failedItems.length,
      averageWaitTime,
      averageProcessingTime,
      throughput,
      errorRate,
      oldestItemAge,
      healthScore: Math.max(0, healthScore)
    };

    return metrics;
  }

  /**
   * 장애 감지
   */
  private static detectFailures(metrics: QueueMetrics, queueStatus: any): QueueFailureInfo[] {
    const failures: QueueFailureInfo[] = [];

    // 1. 블로킹된 큐 감지
    if (metrics.size > QUEUE_HEALTH_THRESHOLDS.maxQueueSize && metrics.throughput < QUEUE_HEALTH_THRESHOLDS.minThroughput) {
      failures.push({
        type: 'blocked_queue',
        severity: 'high',
        description: `Queue is blocked with ${metrics.size} pending items and low throughput`,
        detectedAt: new Date(),
        affectedItems: [],
        queueName: 'phaseTransitionQueue',
        symptoms: ['High queue size', 'Low throughput', 'Items not processing'],
        suggestedStrategy: 'restart_queue',
        autoRecoverable: true,
        metadata: {
          queueSize: metrics.size,
          processingItems: metrics.processing,
          failedItems: metrics.failed,
          oldestItemAge: metrics.oldestItemAge,
          averageProcessingTime: metrics.averageProcessingTime
        }
      });
    }

    // 2. 막힌 아이템 감지
    const stuckItems = this.findStuckItems(queueStatus);
    if (stuckItems.length > 0) {
      failures.push({
        type: 'stuck_item',
        severity: 'medium',
        description: `${stuckItems.length} items are stuck in processing`,
        detectedAt: new Date(),
        affectedItems: stuckItems.map(item => item.id),
        queueName: 'phaseTransitionQueue',
        symptoms: ['Long processing time', 'No progress'],
        suggestedStrategy: 'clear_stuck_items',
        autoRecoverable: true,
        metadata: {
          queueSize: metrics.size,
          processingItems: metrics.processing,
          failedItems: metrics.failed,
          oldestItemAge: metrics.oldestItemAge,
          averageProcessingTime: metrics.averageProcessingTime
        }
      });
    }

    // 3. 높은 오류율 감지
    if (metrics.errorRate > QUEUE_HEALTH_THRESHOLDS.maxErrorRate) {
      failures.push({
        type: 'worker_failure',
        severity: metrics.errorRate > 0.5 ? 'critical' : 'high',
        description: `High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`,
        detectedAt: new Date(),
        affectedItems: [],
        queueName: 'phaseTransitionQueue',
        symptoms: ['High failure rate', 'Processing errors'],
        suggestedStrategy: 'purge_failed_items',
        autoRecoverable: metrics.errorRate < 0.3,
        metadata: {
          queueSize: metrics.size,
          processingItems: metrics.processing,
          failedItems: metrics.failed,
          oldestItemAge: metrics.oldestItemAge,
          averageProcessingTime: metrics.averageProcessingTime
        }
      });
    }

    // 4. 처리 타임아웃 감지
    if (metrics.averageProcessingTime > QUEUE_HEALTH_THRESHOLDS.maxProcessingTime) {
      failures.push({
        type: 'processing_timeout',
        severity: 'medium',
        description: `Processing time too high: ${(metrics.averageProcessingTime / 1000).toFixed(1)}s`,
        detectedAt: new Date(),
        affectedItems: [],
        queueName: 'phaseTransitionQueue',
        symptoms: ['Slow processing', 'Timeout errors'],
        suggestedStrategy: 'reset_priorities',
        autoRecoverable: true,
        metadata: {
          queueSize: metrics.size,
          processingItems: metrics.processing,
          failedItems: metrics.failed,
          oldestItemAge: metrics.oldestItemAge,
          averageProcessingTime: metrics.averageProcessingTime
        }
      });
    }

    // 5. 메모리 누수 감지
    if (metrics.completed > QUEUE_HEALTH_THRESHOLDS.memoryLeakThreshold) {
      failures.push({
        type: 'memory_leak',
        severity: 'medium',
        description: `Too many completed items in memory: ${metrics.completed}`,
        detectedAt: new Date(),
        affectedItems: [],
        queueName: 'phaseTransitionQueue',
        symptoms: ['High memory usage', 'Growing completed items'],
        suggestedStrategy: 'purge_failed_items',
        autoRecoverable: true,
        metadata: {
          queueSize: metrics.size,
          processingItems: metrics.processing,
          failedItems: metrics.failed,
          oldestItemAge: metrics.oldestItemAge,
          averageProcessingTime: metrics.averageProcessingTime
        }
      });
    }

    return failures;
  }

  /**
   * 막힌 아이템 찾기
   */
  private static findStuckItems(queueStatus: any): any[] {
    const processingItems = queueStatus.processing || [];
    const now = Date.now();

    return processingItems.filter((item: any) => {
      const startedAt = new Date(item.startedAt || item.createdAt).getTime();
      return (now - startedAt) > QUEUE_HEALTH_THRESHOLDS.stuckItemThreshold;
    });
  }

  /**
   * 자동 복구 시도
   */
  private static async attemptAutoRecovery(failure: QueueFailureInfo): Promise<QueueRecoveryResult> {
    const startTime = Date.now();
    const result: QueueRecoveryResult = {
      success: false,
      strategy: failure.suggestedStrategy,
      recoveredItems: 0,
      removedItems: 0,
      errors: [],
      warnings: [],
      duration: 0,
      newQueueState: {
        size: 0,
        processingCount: 0,
        healthStatus: 'critical'
      }
    };

    try {
      switch (failure.suggestedStrategy) {
        case 'restart_queue':
          await this.restartQueue(result);
          break;

        case 'clear_stuck_items':
          await this.clearStuckItems(failure.affectedItems, result);
          break;

        case 'reset_priorities':
          await this.resetPriorities(result);
          break;

        case 'purge_failed_items':
          await this.purgeFailedItems(result);
          break;

        case 'rebuild_queue':
          await this.rebuildQueue(result);
          break;

        default:
          result.warnings.push(`Unknown recovery strategy: ${failure.suggestedStrategy}`);
      }

      // 복구 후 상태 확인
      const newQueueStatus = this.getQueueStatus();
      if (newQueueStatus) {
        result.newQueueState = {
          size: (newQueueStatus.pending || []).length,
          processingCount: (newQueueStatus.processing || []).length,
          healthStatus: result.errors.length === 0 ? 'healthy' : 'warning'
        };
      }

      result.success = result.errors.length === 0;

    } catch (error) {
      result.errors.push(`Recovery failed: ${error.message}`);
    }

    result.duration = Date.now() - startTime;

    EdgeCaseLogger.log('EC_QUEUE_003', {
      failureType: failure.type,
      strategy: failure.suggestedStrategy,
      success: result.success,
      duration: result.duration,
      recoveredItems: result.recoveredItems,
      removedItems: result.removedItems,
      errors: result.errors.length
    });

    return result;
  }

  /**
   * 큐 재시작
   */
  private static async restartQueue(result: QueueRecoveryResult): Promise<void> {
    if (window.transitionQueue?.restart) {
      await window.transitionQueue.restart();
      result.recoveredItems = result.newQueueState.size;
      console.log('🔄 Queue restarted successfully');
    } else {
      result.errors.push('Queue restart method not available');
    }
  }

  /**
   * 막힌 아이템 정리
   */
  private static async clearStuckItems(itemIds: string[], result: QueueRecoveryResult): Promise<void> {
    if (window.transitionQueue?.clearStuckItems) {
      const cleared = await window.transitionQueue.clearStuckItems(itemIds);
      result.removedItems = cleared;
      console.log(`🧹 Cleared ${cleared} stuck items`);
    } else {
      result.errors.push('Clear stuck items method not available');
    }
  }

  /**
   * 우선순위 재설정
   */
  private static async resetPriorities(result: QueueRecoveryResult): Promise<void> {
    if (window.transitionQueue?.resetPriorities) {
      await window.transitionQueue.resetPriorities();
      console.log('🔄 Queue priorities reset');
    } else {
      result.warnings.push('Priority reset method not available');
    }
  }

  /**
   * 실패한 아이템 정리
   */
  private static async purgeFailedItems(result: QueueRecoveryResult): Promise<void> {
    if (window.transitionQueue?.purgeFailedItems) {
      const purged = await window.transitionQueue.purgeFailedItems();
      result.removedItems = purged;
      console.log(`🗑️ Purged ${purged} failed items`);
    } else {
      result.errors.push('Purge failed items method not available');
    }
  }

  /**
   * 큐 재구축
   */
  private static async rebuildQueue(result: QueueRecoveryResult): Promise<void> {
    if (window.transitionQueue?.rebuild) {
      await window.transitionQueue.rebuild();
      console.log('🏗️ Queue rebuilt successfully');
    } else {
      result.errors.push('Queue rebuild method not available');
    }
  }

  /**
   * 수동 복구 실행
   */
  static async performManualRecovery(
    strategy: QueueRecoveryStrategy,
    options?: any
  ): Promise<QueueRecoveryResult> {
    console.log(`🔧 Starting manual queue recovery: ${strategy}`);

    const failure: QueueFailureInfo = {
      type: 'manual_intervention' as any,
      severity: 'high',
      description: 'Manual recovery requested',
      detectedAt: new Date(),
      affectedItems: [],
      queueName: 'phaseTransitionQueue',
      symptoms: [],
      suggestedStrategy: strategy,
      autoRecoverable: false,
      metadata: {
        queueSize: 0,
        processingItems: 0,
        failedItems: 0,
        oldestItemAge: 0,
        averageProcessingTime: 0
      }
    };

    return this.attemptAutoRecovery(failure);
  }

  /**
   * 큐 메트릭 조회
   */
  static getMetrics(hours: number = 1): QueueMetrics[] {
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
    return this.metrics.filter(m => m.timestamp.getTime() > cutoffTime);
  }

  /**
   * 큐 상태 요약
   */
  static getQueueSummary(): {
    isHealthy: boolean;
    lastCheck: Date | null;
    currentMetrics: QueueMetrics | null;
    recentFailures: number;
    recommendations: string[];
  } {
    const latestMetrics = this.metrics[this.metrics.length - 1] || null;
    const isHealthy = latestMetrics ? latestMetrics.healthScore > 70 : false;

    // 최근 1시간 내 장애 카운트
    const oneHourAgo = Date.now() - 3600000;
    const recentFailures = this.metrics.filter(m =>
      m.timestamp.getTime() > oneHourAgo && m.healthScore < 50
    ).length;

    const recommendations: string[] = [];

    if (latestMetrics) {
      if (latestMetrics.size > QUEUE_HEALTH_THRESHOLDS.maxQueueSize) {
        recommendations.push('큐 크기가 너무 큽니다. 처리 속도를 확인하세요.');
      }
      if (latestMetrics.errorRate > QUEUE_HEALTH_THRESHOLDS.maxErrorRate) {
        recommendations.push('오류율이 높습니다. 실패한 아이템을 검토하세요.');
      }
      if (latestMetrics.oldestItemAge > QUEUE_HEALTH_THRESHOLDS.maxItemAge) {
        recommendations.push('오래된 대기 아이템이 있습니다. 우선순위를 재설정하세요.');
      }
    }

    if (recommendations.length === 0 && isHealthy) {
      recommendations.push('큐가 정상적으로 작동하고 있습니다.');
    }

    return {
      isHealthy,
      lastCheck: this.lastHealthCheck,
      currentMetrics: latestMetrics,
      recentFailures,
      recommendations
    };
  }
}