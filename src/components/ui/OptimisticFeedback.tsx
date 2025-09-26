/**
 * Optimistic Update Feedback Components
 * Phase 4: 낙관적 업데이트 UI 피드백
 *
 * 주요 컴포넌트:
 * - UpdateIndicator: 업데이트 상태 표시
 * - UpdateToast: 알림 메시지
 * - UpdateProgress: 진행 상황 표시
 * - UpdateError: 에러 및 롤백 표시
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Clock,
  Loader2,
  AlertTriangle,
  Undo2
} from 'lucide-react';
import {
  optimisticUpdateManager,
  UpdateStatus,
  type OptimisticUpdate
} from '../../utils/optimisticUpdate';

/**
 * 업데이트 상태 색상 매핑
 */
const statusColors = {
  [UpdateStatus.PENDING]: 'bg-gray-100 text-gray-700',
  [UpdateStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-700',
  [UpdateStatus.SUCCESS]: 'bg-green-100 text-green-700',
  [UpdateStatus.FAILED]: 'bg-red-100 text-red-700',
  [UpdateStatus.ROLLED_BACK]: 'bg-yellow-100 text-yellow-700'
};

const statusIcons = {
  [UpdateStatus.PENDING]: Clock,
  [UpdateStatus.IN_PROGRESS]: Loader2,
  [UpdateStatus.SUCCESS]: CheckCircle,
  [UpdateStatus.FAILED]: XCircle,
  [UpdateStatus.ROLLED_BACK]: Undo2
};

/**
 * 업데이트 인디케이터
 * 아이템 레벨에서 업데이트 상태 표시
 */
export const UpdateIndicator: React.FC<{
  isUpdating: boolean;
  status?: UpdateStatus;
  size?: 'sm' | 'md' | 'lg';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}> = ({
  isUpdating,
  status,
  size = 'sm',
  position = 'top-right'
}) => {
  if (!isUpdating && !status) return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const positionClasses = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0'
  };

  const Icon = status ? statusIcons[status] : Loader2;

  return (
    <div className={`absolute ${positionClasses[position]} -translate-x-1/2 -translate-y-1/2 z-10`}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        className={`${sizeClasses[size]} rounded-full bg-white shadow-lg p-0.5`}
      >
        <Icon
          className={`w-full h-full ${
            isUpdating || status === UpdateStatus.IN_PROGRESS
              ? 'animate-spin text-blue-500'
              : status === UpdateStatus.SUCCESS
              ? 'text-green-500'
              : status === UpdateStatus.FAILED
              ? 'text-red-500'
              : status === UpdateStatus.ROLLED_BACK
              ? 'text-yellow-500'
              : 'text-gray-400'
          }`}
        />
      </motion.div>
    </div>
  );
};

/**
 * 업데이트 토스트
 * 전역 알림 메시지
 */
export const UpdateToast: React.FC = () => {
  const [updates, setUpdates] = useState<OptimisticUpdate[]>([]);

  useEffect(() => {
    const handleUpdateStart = (update: OptimisticUpdate) => {
      setUpdates(prev => [...prev, update]);
    };

    const handleUpdateComplete = (update: OptimisticUpdate) => {
      setTimeout(() => {
        setUpdates(prev => prev.filter(u => u.id !== update.id));
      }, 3000);
    };

    optimisticUpdateManager.on('update:start', handleUpdateStart);
    optimisticUpdateManager.on('update:success', handleUpdateComplete);
    optimisticUpdateManager.on('update:failed', handleUpdateComplete);
    optimisticUpdateManager.on('update:rollback', handleUpdateComplete);

    return () => {
      optimisticUpdateManager.off('update:start', handleUpdateStart);
      optimisticUpdateManager.off('update:success', handleUpdateComplete);
      optimisticUpdateManager.off('update:failed', handleUpdateComplete);
      optimisticUpdateManager.off('update:rollback', handleUpdateComplete);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {updates.map(update => (
          <motion.div
            key={update.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className={`flex items-center gap-3 p-3 rounded-lg shadow-lg ${
              statusColors[update.status]
            }`}
          >
            {React.createElement(statusIcons[update.status], {
              className: `w-5 h-5 ${
                update.status === UpdateStatus.IN_PROGRESS ? 'animate-spin' : ''
              }`
            })}
            <div className="flex-1">
              <p className="text-sm font-medium">
                {update.status === UpdateStatus.IN_PROGRESS && '업데이트 중...'}
                {update.status === UpdateStatus.SUCCESS && '업데이트 완료!'}
                {update.status === UpdateStatus.FAILED && '업데이트 실패'}
                {update.status === UpdateStatus.ROLLED_BACK && '변경사항 복원됨'}
              </p>
              {update.retryCount > 0 && (
                <p className="text-xs opacity-75">
                  재시도 {update.retryCount}/{update.maxRetries}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

/**
 * 업데이트 진행 상황 바
 */
export const UpdateProgress: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const [statistics, setStatistics] = useState<ReturnType<typeof optimisticUpdateManager.getStatistics>>();

  useEffect(() => {
    const updateStats = () => {
      setStatistics(optimisticUpdateManager.getStatistics());
    };

    updateStats();
    const interval = setInterval(updateStats, 500);

    return () => clearInterval(interval);
  }, []);

  if (!statistics || statistics.total === 0) return null;

  const progress = ((statistics.success + statistics.rolledBack) / statistics.total) * 100;
  const hasErrors = statistics.failed > 0;

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">동기화 상태</h4>
        <span className="text-xs text-gray-500">
          {statistics.success}/{statistics.total} 완료
        </span>
      </div>

      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={`absolute left-0 top-0 h-full ${
            hasErrors ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {statistics.inProgress > 0 && (
        <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          {statistics.inProgress}개 처리 중...
        </p>
      )}

      {hasErrors && (
        <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {statistics.failed}개 실패
        </p>
      )}
    </div>
  );
};

/**
 * 업데이트 에러 표시
 */
export const UpdateError: React.FC<{
  update?: OptimisticUpdate;
  onRetry?: () => void;
  onDismiss?: () => void;
}> = ({ update, onRetry, onDismiss }) => {
  if (!update || update.status !== UpdateStatus.FAILED) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 border border-red-200 rounded-lg p-4"
    >
      <div className="flex items-start gap-3">
        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h5 className="text-sm font-medium text-red-800">
            업데이트 실패
          </h5>
          <p className="text-xs text-red-600 mt-1">
            변경사항을 저장하지 못했습니다.
            {update.retryCount >= update.maxRetries &&
              ` (${update.maxRetries}회 재시도 실패)`}
          </p>

          <div className="flex items-center gap-2 mt-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                재시도
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-xs px-3 py-1 bg-white text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
              >
                닫기
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 인라인 업데이트 상태
 * 폼 필드나 작은 영역에 사용
 */
export const InlineUpdateStatus: React.FC<{
  status?: UpdateStatus;
  message?: string;
  size?: 'xs' | 'sm' | 'md';
}> = ({ status, message, size = 'sm' }) => {
  if (!status) return null;

  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-1.5'
  };

  const Icon = statusIcons[status];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 rounded-full ${
        statusColors[status]
      } ${sizeClasses[size]}`}
    >
      <Icon
        className={`${
          size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
        } ${
          status === UpdateStatus.IN_PROGRESS ? 'animate-spin' : ''
        }`}
      />
      {message && <span>{message}</span>}
    </motion.div>
  );
};

/**
 * 업데이트 오버레이
 * 전체 화면 또는 특정 영역 블로킹
 */
export const UpdateOverlay: React.FC<{
  isVisible: boolean;
  message?: string;
  canCancel?: boolean;
  onCancel?: () => void;
}> = ({ isVisible, message = '업데이트 중...', canCancel = false, onCancel }) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-white bg-opacity-75 backdrop-blur-sm z-40 flex items-center justify-center"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col items-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-gray-700 font-medium">{message}</p>

        {canCancel && onCancel && (
          <button
            onClick={onCancel}
            className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            취소
          </button>
        )}
      </div>
    </motion.div>
  );
};