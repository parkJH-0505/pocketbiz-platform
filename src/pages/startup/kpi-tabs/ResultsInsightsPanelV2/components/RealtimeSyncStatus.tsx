/**
 * RealtimeSyncStatus Component
 * 실시간 동기화 상태를 표시하는 UI 컴포넌트
 */

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  Users,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

interface RealtimeSyncStatusProps {
  className?: string;
  showCollaborators?: boolean;
  compact?: boolean;
}

const RealtimeSyncStatusComponent: React.FC<RealtimeSyncStatusProps> = ({
  className = '',
  showCollaborators = true,
  compact = false
}) => {
  const {
    isConnected,
    syncStatus,
    lastSyncTime,
    collaborators,
    connect,
    disconnect,
    syncNow
  } = useRealtimeSync();

  // 상태별 아이콘 및 색상
  const getStatusDisplay = () => {
    switch (syncStatus) {
      case 'synced':
        return {
          icon: Cloud,
          color: 'text-success-main',
          bgColor: 'bg-success-light',
          message: '동기화됨',
          pulse: false
        };
      case 'syncing':
        return {
          icon: RefreshCw,
          color: 'text-primary-main',
          bgColor: 'bg-primary-light',
          message: '동기화 중...',
          pulse: true
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-error-main',
          bgColor: 'bg-error-light',
          message: '동기화 오류',
          pulse: false
        };
      case 'offline':
      default:
        return {
          icon: CloudOff,
          color: 'text-neutral-gray',
          bgColor: 'bg-neutral-light',
          message: '오프라인',
          pulse: false
        };
    }
  };

  const formatLastSyncTime = () => {
    if (!lastSyncTime) return '동기화 안 됨';

    const now = Date.now();
    const diff = now - lastSyncTime;

    if (diff < 60000) {
      return '방금 전';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}분 전`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}시간 전`;
    } else {
      return `${Math.floor(diff / 86400000)}일 전`;
    }
  };

  const status = getStatusDisplay();
  const StatusIcon = status.icon;

  if (compact) {
    // 컴팩트 모드 - 아이콘만 표시
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={isConnected ? syncNow : connect}
          className={`relative p-2 rounded-lg transition-all ${status.bgColor} hover:opacity-80`}
          title={status.message}
        >
          <StatusIcon
            size={16}
            className={`${status.color} ${status.pulse ? 'animate-spin' : ''}`}
          />
          {isConnected && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-success-main rounded-full" />
          )}
        </button>

        {showCollaborators && collaborators.length > 0 && (
          <div className="flex -space-x-2">
            {collaborators.slice(0, 3).map((user) => (
              <div
                key={user.id}
                className="w-8 h-8 rounded-full bg-primary-main text-white flex items-center justify-center text-xs border-2 border-white"
                title={user.name}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {collaborators.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-neutral-border text-neutral-gray flex items-center justify-center text-xs border-2 border-white">
                +{collaborators.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 전체 모드
  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${status.bgColor}`}>
            <StatusIcon
              size={20}
              className={`${status.color} ${status.pulse ? 'animate-spin' : ''}`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-neutral-dark">{status.message}</span>
              {isConnected ? (
                <Wifi size={14} className="text-success-main" />
              ) : (
                <WifiOff size={14} className="text-neutral-gray" />
              )}
            </div>
            <span className="text-xs text-neutral-gray">
              마지막 동기화: {formatLastSyncTime()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <button
                onClick={syncNow}
                className="px-3 py-1 text-sm bg-primary-light text-primary-main rounded hover:bg-primary-main hover:text-white transition-colors"
                disabled={syncStatus === 'syncing'}
              >
                {syncStatus === 'syncing' ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  '지금 동기화'
                )}
              </button>
              <button
                onClick={disconnect}
                className="px-3 py-1 text-sm bg-neutral-light text-neutral-gray rounded hover:bg-error-light hover:text-error-main transition-colors"
              >
                연결 해제
              </button>
            </>
          ) : (
            <button
              onClick={connect}
              className="px-3 py-1 text-sm bg-success-light text-success-main rounded hover:bg-success-main hover:text-white transition-colors"
            >
              연결하기
            </button>
          )}
        </div>
      </div>

      {/* 협업자 목록 */}
      {showCollaborators && collaborators.length > 0 && (
        <div className="border-t border-neutral-border pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-dark flex items-center gap-2">
              <Users size={14} />
              실시간 협업 중 ({collaborators.length}명)
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {collaborators.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 px-2 py-1 bg-neutral-light rounded-full"
              >
                <div className="w-6 h-6 rounded-full bg-primary-main text-white flex items-center justify-center text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-neutral-dark">{user.name}</span>
                <div
                  className={`w-2 h-2 rounded-full ${
                    user.status === 'online'
                      ? 'bg-success-main'
                      : user.status === 'idle'
                      ? 'bg-warning-main'
                      : 'bg-neutral-gray'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 동기화 진행 표시 */}
      <AnimatePresence>
        {syncStatus === 'syncing' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-neutral-border"
          >
            <div className="flex items-center gap-2 text-sm text-primary-main">
              <Loader size={14} className="animate-spin" />
              <span>데이터를 동기화하고 있습니다...</span>
            </div>
            <div className="w-full h-1 bg-neutral-light rounded-full mt-2 overflow-hidden">
              <motion.div
                className="h-full bg-primary-main"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 에러 표시 */}
      {syncStatus === 'error' && (
        <div className="mt-3 p-2 bg-error-light rounded-lg">
          <div className="flex items-center gap-2 text-sm text-error-main">
            <AlertCircle size={14} />
            <span>동기화 중 문제가 발생했습니다. 다시 시도해주세요.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const RealtimeSyncStatus = memo(RealtimeSyncStatusComponent);