/**
 * RealTimeMonitor Component
 * 실시간 데이터 변경 감지 및 모니터링 UI
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Settings,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { useRealTimeDetection } from '../hooks/useRealTimeDetection';
import { useV2Store } from '../store/useV2Store';

interface RealTimeMonitorProps {
  className?: string;
}

export const RealTimeMonitor: React.FC<RealTimeMonitorProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { clearAlertQueue, removeAlert } = useV2Store();

  const {
    isMonitoring,
    lastUpdate,
    activeChanges,
    changeHistory,
    alertQueue,
    threshold,
    updateInterval,
    startMonitoring,
    stopMonitoring,
    setThreshold,
    setUpdateInterval,
    triggerDetection,
    getMonitoringStats
  } = useRealTimeDetection({
    enabled: true,
    threshold: 2,
    interval: 5000,
    onSignificantChange: (change) => {
      console.log('중요한 변경 감지:', change);
    }
  });

  const stats = getMonitoringStats();

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) return `${minutes}분 ${seconds}초 전`;
    return `${seconds}초 전`;
  };

  const handleThresholdChange = useCallback((value: number) => {
    setThreshold(value);
  }, [setThreshold]);

  const handleIntervalChange = useCallback((value: number) => {
    setUpdateInterval(value * 1000); // 초를 밀리초로 변환
  }, [setUpdateInterval]);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isMonitoring ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Activity
                size={20}
                className={isMonitoring ? 'text-green-600' : 'text-gray-500'}
              />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">실시간 모니터링</h3>
              <p className="text-sm text-gray-500">
                데이터 변경 감지 · {isMonitoring ? '활성' : '비활성'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 알림 개수 */}
            {alertQueue.length > 0 && (
              <div className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                {alertQueue.length}개 알림
              </div>
            )}

            {/* 상태 표시 */}
            <div className={`w-3 h-3 rounded-full ${
              isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
            }`} />

            {/* 컨트롤 버튼들 */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="설정"
            >
              <Settings size={16} className="text-gray-500" />
            </button>

            <button
              onClick={triggerDetection}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="수동 감지"
              disabled={!isMonitoring}
            >
              <RefreshCw size={16} className={isMonitoring ? 'text-gray-700' : 'text-gray-300'} />
            </button>

            <button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              className={`p-2 rounded-lg transition-colors ${
                isMonitoring
                  ? 'bg-red-100 hover:bg-red-200 text-red-700'
                  : 'bg-green-100 hover:bg-green-200 text-green-700'
              }`}
            >
              {isMonitoring ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <TrendingUp size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* 설정 패널 */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-3 bg-gray-50 rounded-lg"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    감지 임계값 (점)
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={threshold}
                    onChange={(e) => handleThresholdChange(Number(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{threshold}점</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업데이트 간격 (초)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    step="1"
                    value={updateInterval / 1000}
                    onChange={(e) => handleIntervalChange(Number(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{updateInterval / 1000}초</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 간단한 상태 표시 */}
      {!isExpanded && (
        <div className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.totalChanges}</div>
              <div className="text-xs text-gray-500">총 변경</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{activeChanges.length}</div>
              <div className="text-xs text-gray-500">활성 변경</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{stats.recentChangeCount}</div>
              <div className="text-xs text-gray-500">최근 1시간</div>
            </div>
          </div>
        </div>
      )}

      {/* 상세 정보 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-100"
          >
            <div className="p-4 space-y-4">
              {/* 통계 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">마지막 업데이트</span>
                  </div>
                  <div className="text-sm text-blue-700 mt-1">
                    {formatTime(lastUpdate)}
                  </div>
                </div>

                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-green-900">평균 변화율</span>
                  </div>
                  <div className="text-sm text-green-700 mt-1">
                    {stats.averageChangeRate.toFixed(1)}%
                  </div>
                </div>

                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">가장 활발한 축</span>
                  </div>
                  <div className="text-sm text-purple-700 mt-1">
                    {stats.mostActiveAxis || 'N/A'}
                  </div>
                </div>

                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-orange-600" />
                    <span className="text-sm font-medium text-orange-900">활성 알림</span>
                  </div>
                  <div className="text-sm text-orange-700 mt-1">
                    {alertQueue.length}개
                  </div>
                </div>
              </div>

              {/* 활성 변경사항 */}
              {activeChanges.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">활성 변경사항</h4>
                  <div className="space-y-2">
                    {activeChanges.slice(0, 5).map((change) => (
                      <div
                        key={change.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          {change.newValue > change.oldValue ? (
                            <TrendingUp size={14} className="text-green-500" />
                          ) : (
                            <TrendingDown size={14} className="text-red-500" />
                          )}
                          <span className="text-sm font-medium">{change.axis}</span>
                          <span className="text-sm text-gray-600">
                            {change.oldValue.toFixed(1)} → {change.newValue.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatTime(change.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 알림 큐 */}
              {alertQueue.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">알림</h4>
                    <button
                      onClick={clearAlertQueue}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      모두 지우기
                    </button>
                  </div>
                  <div className="space-y-2">
                    {alertQueue.slice(0, 3).map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-start justify-between p-3 bg-red-50 rounded-lg"
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle size={16} className="text-red-600 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-red-900">
                              {alert.message}
                            </div>
                            <div className="text-xs text-red-700">
                              {formatTime(alert.timestamp)}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeAlert(alert.id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};