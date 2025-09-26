/**
 * Batch Update Status UI Components
 * Phase 5: 배치 업데이트 시각적 피드백
 *
 * 주요 컴포넌트:
 * - BatchProgressBar: 배치 진행 상황 표시
 * - BatchQueueStatus: 대기 중인 작업 표시
 * - BatchNotification: 배치 완료/실패 알림
 * - BatchMonitorPanel: 종합 모니터링 패널
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Zap,
  TrendingUp,
  Activity,
  RefreshCw,
  PlayCircle,
  PauseCircle,
  Loader2,
  BarChart3,
  Database,
  Layers
} from 'lucide-react';
import { useBatchMonitor, useBatchUpdate } from '../../utils/batchQueue';
import { BatchPriority, BatchStatus } from '../../utils/batchUpdateSystem';

/**
 * 배치 진행 바
 */
export const BatchProgressBar: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const { statistics, isProcessing, pendingCount } = useBatchMonitor();

  const progress = statistics.totalOperations > 0
    ? ((statistics.successfulOperations + statistics.failedOperations) / statistics.totalOperations) * 100
    : 0;

  const hasErrors = statistics.failedOperations > 0;

  if (pendingCount === 0 && !isProcessing) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-700">배치 처리</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {pendingCount > 0 && (
            <span className="text-gray-500">
              대기 중: {pendingCount}
            </span>
          )}
          <span className="text-gray-500">
            {statistics.successfulOperations}/{statistics.totalOperations}
          </span>
        </div>
      </div>

      <div className="relative w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={`absolute left-0 top-0 h-full ${
            hasErrors ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
            'bg-gradient-to-r from-blue-400 to-blue-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
        {isProcessing && (
          <motion.div
            className="absolute inset-0 bg-white opacity-30"
            animate={{ x: ['0%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            style={{ width: '30%' }}
          />
        )}
      </div>

      {hasErrors && (
        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {statistics.failedOperations}개 실패
        </p>
      )}
    </motion.div>
  );
};

/**
 * 배치 큐 상태
 */
export const BatchQueueStatus: React.FC<{
  className?: string;
  compact?: boolean;
}> = ({ className = '', compact = false }) => {
  const { status, pendingCount, queueLength } = useBatchMonitor();

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {pendingCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-full">
            <Clock className="w-3 h-3 text-blue-500" />
            <span className="text-xs font-medium text-blue-700">{pendingCount}</span>
          </div>
        )}
        {status.isProcessing && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-full">
            <Loader2 className="w-3 h-3 text-green-500 animate-spin" />
            <span className="text-xs font-medium text-green-700">처리 중</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        <Layers className="w-4 h-4 text-gray-500" />
        배치 큐 상태
      </h4>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">대기 중인 작업</span>
          <span className="text-sm font-medium text-gray-900">{pendingCount}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">큐에 있는 배치</span>
          <span className="text-sm font-medium text-gray-900">{queueLength}</span>
        </div>

        {status.currentBatch && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">현재 배치</span>
              <div className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                <span className="text-xs font-medium text-blue-600">
                  {status.currentBatch.operations.length}개 처리 중
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 배치 알림
 */
export const BatchNotification: React.FC = () => {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
    timestamp: number;
  }>>([]);

  const { statistics } = useBatchMonitor();

  useEffect(() => {
    // 배치 완료 시 알림 추가
    if (statistics.successfulBatches > 0) {
      const lastSuccess = {
        id: `success-${Date.now()}`,
        type: 'success' as const,
        message: `배치 처리 완료 (${statistics.successfulOperations}개 작업)`,
        timestamp: Date.now()
      };
      setNotifications(prev => [...prev.slice(-4), lastSuccess]);
    }
  }, [statistics.successfulBatches]);

  useEffect(() => {
    // 3초 후 알림 제거
    const timer = setInterval(() => {
      setNotifications(prev =>
        prev.filter(n => Date.now() - n.timestamp < 3000)
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: -50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.9 }}
            className={`flex items-center gap-3 p-3 rounded-lg shadow-lg ${
              notification.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : notification.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : notification.type === 'error' ? (
              <XCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{notification.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

/**
 * 배치 모니터링 패널
 */
export const BatchMonitorPanel: React.FC<{
  className?: string;
  onFlush?: () => void;
  onCancelAll?: () => void;
}> = ({ className = '', onFlush, onCancelAll }) => {
  const { statistics, status, isProcessing, pendingCount } = useBatchMonitor();
  const [expanded, setExpanded] = useState(false);

  const successRate = statistics.totalOperations > 0
    ? ((statistics.successfulOperations / statistics.totalOperations) * 100).toFixed(1)
    : '0.0';

  return (
    <motion.div
      className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}
      initial={false}
      animate={{ height: expanded ? 'auto' : '80px' }}
      transition={{ duration: 0.3 }}
    >
      {/* 헤더 */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isProcessing ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <Activity className={`w-5 h-5 ${
                isProcessing ? 'text-blue-600 animate-pulse' : 'text-gray-600'
              }`} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                배치 업데이트 시스템
              </h3>
              <p className="text-xs text-gray-500">
                {isProcessing ? '처리 중...' : pendingCount > 0 ? '대기 중' : '유휴'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 빠른 통계 */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span className="text-gray-700">{statistics.successfulOperations}</span>
              </div>
              {statistics.failedOperations > 0 && (
                <div className="flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-red-500" />
                  <span className="text-gray-700">{statistics.failedOperations}</span>
                </div>
              )}
              {pendingCount > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-500" />
                  <span className="text-gray-700">{pendingCount}</span>
                </div>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center gap-2">
              {onFlush && pendingCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFlush();
                  }}
                  className="p-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors"
                  title="즉시 처리"
                >
                  <Zap className="w-4 h-4 text-blue-600" />
                </button>
              )}
              {onCancelAll && pendingCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancelAll();
                  }}
                  className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 transition-colors"
                  title="모두 취소"
                >
                  <XCircle className="w-4 h-4 text-red-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 확장 콘텐츠 */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 pb-4 border-t border-gray-100"
          >
            {/* 상세 통계 */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">처리 통계</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">총 배치</span>
                    <span className="font-medium">{statistics.totalBatches}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">평균 크기</span>
                    <span className="font-medium">
                      {statistics.averageBatchSize.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">성공률</span>
                    <span className="font-medium text-green-600">{successRate}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">성능</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">평균 처리 시간</span>
                    <span className="font-medium">
                      {statistics.averageProcessingTime.toFixed(0)}ms
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">큐 대기</span>
                    <span className="font-medium">{status.queue.length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">작업</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">총 작업</span>
                    <span className="font-medium">{statistics.totalOperations}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">성공</span>
                    <span className="font-medium text-green-600">
                      {statistics.successfulOperations}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">실패</span>
                    <span className="font-medium text-red-600">
                      {statistics.failedOperations}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 현재 배치 정보 */}
            {status.currentBatch && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-sm font-medium text-blue-900">
                      배치 처리 중
                    </span>
                  </div>
                  <span className="text-xs text-blue-700">
                    {status.currentBatch.operations.length}개 작업
                  </span>
                </div>
                {status.currentBatch.retryCount > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    재시도: {status.currentBatch.retryCount}/{status.currentBatch.maxRetries}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * 인라인 배치 인디케이터
 */
export const BatchIndicator: React.FC<{
  count?: number;
  size?: 'xs' | 'sm' | 'md';
}> = ({ count = 0, size = 'sm' }) => {
  if (count === 0) return null;

  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-1.5'
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 ${sizeClasses[size]}`}
    >
      <Package className={`${size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}`} />
      <span className="font-medium">{count}</span>
    </motion.div>
  );
};