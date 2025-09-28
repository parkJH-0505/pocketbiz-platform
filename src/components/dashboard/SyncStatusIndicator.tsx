/**
 * Sync Status Indicator Component
 * 동기화 상태 표시 UI
 */

import React, { useState, useEffect } from 'react';
import { syncManager } from '../../api/dashboardSync';

interface SyncStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  className = '',
  showDetails = false
}) => {
  const [syncStatus, setSyncStatus] = useState(syncManager.getSyncStatus());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // 동기화 상태 업데이트 주기적 확인
    const interval = setInterval(() => {
      setSyncStatus(syncManager.getSyncStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSyncNow = async () => {
    const status = await syncManager.performSync();
    setSyncStatus(status);
  };

  const getStatusIcon = () => {
    if (syncStatus.syncInProgress) {
      return '🔄';
    }
    if (syncStatus.conflicts.length > 0) {
      return '⚠️';
    }
    if (syncStatus.pendingChanges > 0) {
      return '📝';
    }
    return '✅';
  };

  const getStatusText = () => {
    if (syncStatus.syncInProgress) {
      return '동기화 중...';
    }
    if (syncStatus.conflicts.length > 0) {
      return '충돌 발생';
    }
    if (syncStatus.pendingChanges > 0) {
      return `${syncStatus.pendingChanges}개 변경사항`;
    }
    if (syncStatus.lastSynced === 0) {
      return '동기화 필요';
    }

    const timeDiff = Date.now() - syncStatus.lastSynced;
    const minutes = Math.floor(timeDiff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}시간 전 동기화`;
    }
    if (minutes > 0) {
      return `${minutes}분 전 동기화`;
    }
    return '최신 상태';
  };

  const getStatusColor = () => {
    if (syncStatus.syncInProgress) return '#3b82f6';
    if (syncStatus.conflicts.length > 0) return '#f59e0b';
    if (syncStatus.pendingChanges > 0) return '#8b5cf6';
    return '#10b981';
  };

  return (
    <div className={`sync-status-indicator ${className}`}>
      <button
        className="sync-status-button"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ borderColor: getStatusColor() }}
      >
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="status-text">{getStatusText()}</span>
      </button>

      {isExpanded && (
        <div className="sync-details">
          <div className="detail-header">
            <h4>동기화 상태</h4>
            <button className="close-btn" onClick={() => setIsExpanded(false)}>
              ×
            </button>
          </div>

          <div className="detail-content">
            <div className="status-item">
              <span className="label">마지막 동기화:</span>
              <span className="value">
                {syncStatus.lastSynced > 0
                  ? new Date(syncStatus.lastSynced).toLocaleString('ko-KR')
                  : '없음'}
              </span>
            </div>

            <div className="status-item">
              <span className="label">대기 중인 변경사항:</span>
              <span className="value">{syncStatus.pendingChanges}개</span>
            </div>

            <div className="status-item">
              <span className="label">상태:</span>
              <span className="value">
                {syncStatus.syncInProgress ? '동기화 진행 중' : '유휴'}
              </span>
            </div>

            {syncStatus.conflicts.length > 0 && (
              <div className="conflicts-section">
                <h5>충돌 ({syncStatus.conflicts.length})</h5>
                {syncStatus.conflicts.map((conflict, index) => (
                  <div key={index} className="conflict-item">
                    <span className="conflict-type">{conflict.type}</span>
                    <span className="conflict-message">
                      {conflict.message || '충돌 감지됨'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="detail-actions">
            <button
              className="sync-now-btn"
              onClick={handleSyncNow}
              disabled={syncStatus.syncInProgress}
            >
              {syncStatus.syncInProgress ? '동기화 중...' : '지금 동기화'}
            </button>
          </div>
        </div>
      )}

      {showDetails && !isExpanded && (
        <div className="mini-details">
          {syncStatus.pendingChanges > 0 && (
            <span className="mini-badge pending">
              {syncStatus.pendingChanges}
            </span>
          )}
          {syncStatus.conflicts.length > 0 && (
            <span className="mini-badge conflict">!</span>
          )}
        </div>
      )}

      <style jsx>{`
        .sync-status-indicator {
          position: relative;
          display: inline-block;
        }

        .sync-status-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.9);
          border: 2px solid;
          border-radius: 20px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sync-status-button:hover {
          background: white;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .status-icon {
          font-size: 14px;
          animation: ${syncStatus.syncInProgress ? 'spin 1s linear infinite' : 'none'};
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .status-text {
          color: #4b5563;
          font-weight: 500;
        }

        .sync-details {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 320px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          animation: slideDown 0.2s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .detail-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .detail-header h4 {
          margin: 0;
          font-size: 16px;
          color: #1f2937;
        }

        .close-btn {
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          color: #6b7280;
          font-size: 20px;
          cursor: pointer;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .close-btn:hover {
          background: #f3f4f6;
        }

        .detail-content {
          padding: 16px;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .status-item:last-child {
          border-bottom: none;
        }

        .label {
          color: #6b7280;
          font-size: 13px;
        }

        .value {
          color: #1f2937;
          font-size: 13px;
          font-weight: 500;
        }

        .conflicts-section {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .conflicts-section h5 {
          margin: 0 0 12px 0;
          color: #f59e0b;
          font-size: 14px;
        }

        .conflict-item {
          padding: 8px;
          margin-bottom: 8px;
          background: #fef3c7;
          border-radius: 6px;
          font-size: 12px;
        }

        .conflict-type {
          display: block;
          color: #92400e;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .conflict-message {
          color: #78350f;
        }

        .detail-actions {
          padding: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .sync-now-btn {
          width: 100%;
          padding: 10px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .sync-now-btn:hover:not(:disabled) {
          background: #2563eb;
        }

        .sync-now-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .mini-details {
          position: absolute;
          top: -8px;
          right: -8px;
          display: flex;
          gap: 4px;
        }

        .mini-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 9px;
          font-size: 11px;
          font-weight: 600;
          color: white;
        }

        .mini-badge.pending {
          background: #8b5cf6;
        }

        .mini-badge.conflict {
          background: #f59e0b;
        }
      `}</style>
    </div>
  );
};

export default SyncStatusIndicator;