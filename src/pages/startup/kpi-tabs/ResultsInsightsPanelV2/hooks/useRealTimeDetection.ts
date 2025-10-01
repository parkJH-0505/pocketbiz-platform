/**
 * useRealTimeDetection Hook
 * 실시간 데이터 변경 감지 및 처리
 */

import { useEffect, useCallback, useRef } from 'react';
import { useV2Store } from '../store/useV2Store';
import type { AxisKey } from '../types';

interface DataChange {
  axis: AxisKey;
  oldValue: number;
  newValue: number;
  timestamp: number;
  changePercent: number;
}

interface UseRealTimeDetectionOptions {
  enabled?: boolean;
  threshold?: number;
  interval?: number;
  onChangeDetected?: (change: DataChange) => void;
  onSignificantChange?: (change: DataChange) => void;
}

export const useRealTimeDetection = (options: UseRealTimeDetectionOptions = {}) => {
  const {
    enabled = true,
    threshold = 2,
    interval = 5000,
    onChangeDetected,
    onSignificantChange
  } = options;

  const {
    data,
    realTimeMonitoring,
    enableRealTimeMonitoring,
    disableRealTimeMonitoring,
    addChangeDetection,
    updateDetectionThreshold,
    updateInterval,
    updateLastCheckTime,
    loadData
  } = useV2Store();

  const lastScoresRef = useRef<Record<AxisKey, number> | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 데이터 변경 감지 함수
  const detectChanges = useCallback(() => {
    if (!data?.current?.scores || !lastScoresRef.current) {
      // 첫 번째 실행 시 기준 데이터 설정
      if (data?.current?.scores) {
        lastScoresRef.current = { ...data.current.scores };
      }
      return;
    }

    const currentScores = data.current.scores;
    const lastScores = lastScoresRef.current;
    const axes = Object.keys(currentScores) as AxisKey[];

    axes.forEach((axis) => {
      const currentValue = currentScores[axis];
      const lastValue = lastScores[axis];

      if (currentValue !== lastValue) {
        const changeAmount = currentValue - lastValue;
        const changePercent = lastValue !== 0 ? (changeAmount / lastValue) * 100 : 0;

        const change: DataChange = {
          axis,
          oldValue: lastValue,
          newValue: currentValue,
          timestamp: Date.now(),
          changePercent
        };

        // Store에 변경사항 기록
        addChangeDetection(change);

        // 콜백 실행
        onChangeDetected?.(change);

        // 중요한 변경사항 처리
        if (Math.abs(changeAmount) >= threshold) {
          onSignificantChange?.(change);
        }
      }
    });

    // 기준 데이터 업데이트
    lastScoresRef.current = { ...currentScores };
    updateLastCheckTime();
  }, [data, threshold, addChangeDetection, onChangeDetected, onSignificantChange, updateLastCheckTime]);

  // 주기적 데이터 업데이트 시뮬레이션 (실제로는 API 호출)
  const simulateDataUpdate = useCallback(async () => {
    // 실제 환경에서는 API 호출로 대체
    try {
      await loadData();
      detectChanges();
    } catch (error) {
      console.error('데이터 업데이트 실패:', error);
    }
  }, [loadData, detectChanges]);

  // 실시간 모니터링 시작/중지
  const startMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    enableRealTimeMonitoring();
    updateDetectionThreshold(threshold);
    updateInterval(interval);

    intervalRef.current = setInterval(() => {
      // 인라인 함수로 변경하여 의존성 순환 방지
      simulateDataUpdate();
    }, interval);
  }, [enableRealTimeMonitoring, updateDetectionThreshold, updateInterval, threshold, interval]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    disableRealTimeMonitoring();
  }, [disableRealTimeMonitoring]);

  // 감지 임계값 변경
  const setThreshold = useCallback((newThreshold: number) => {
    updateDetectionThreshold(newThreshold);
  }, [updateDetectionThreshold]);

  // 업데이트 간격 변경
  const setUpdateInterval = useCallback((newInterval: number) => {
    updateInterval(newInterval);

    // 인터벌이 변경되면 모니터링 재시작
    if (realTimeMonitoring.isEnabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      disableRealTimeMonitoring();

      // 잠시 후 재시작
      setTimeout(() => {
        enableRealTimeMonitoring();
        updateDetectionThreshold(threshold);
        updateInterval(newInterval);
        intervalRef.current = setInterval(() => {
          simulateDataUpdate();
        }, newInterval);
      }, 100);
    }
  }, [updateInterval, realTimeMonitoring.isEnabled, disableRealTimeMonitoring, enableRealTimeMonitoring, updateDetectionThreshold, threshold]);

  // 수동 변경 감지 실행
  const triggerDetection = useCallback(() => {
    detectChanges();
  }, [detectChanges]);

  // 실시간 통계 계산
  const getMonitoringStats = useCallback(() => {
    const changeHistory = realTimeMonitoring.changeHistory;
    const activeChanges = Array.from(realTimeMonitoring.activeChanges.values());

    const stats = {
      totalChanges: changeHistory.length,
      activeChanges: activeChanges.length,
      lastUpdate: realTimeMonitoring.lastUpdate,
      averageChangeRate: 0,
      mostActiveAxis: null as AxisKey | null,
      recentChangeCount: 0
    };

    if (changeHistory.length > 0) {
      // 최근 1시간 변경 건수
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      stats.recentChangeCount = changeHistory.filter(
        change => change.timestamp > oneHourAgo
      ).length;

      // 가장 활발한 축 계산
      const axisCounts: Record<string, number> = {};
      changeHistory.forEach(change => {
        axisCounts[change.axis] = (axisCounts[change.axis] || 0) + 1;
      });

      const maxCount = Math.max(...Object.values(axisCounts));
      stats.mostActiveAxis = Object.keys(axisCounts).find(
        axis => axisCounts[axis] === maxCount
      ) as AxisKey;

      // 평균 변화율
      const totalChangeRate = changeHistory.reduce(
        (sum, change) => sum + Math.abs(change.changePercent || 0), 0
      );
      stats.averageChangeRate = totalChangeRate / changeHistory.length;
    }

    return stats;
  }, [realTimeMonitoring]);

  // 컴포넌트 마운트/언마운트 시 처리
  useEffect(() => {
    if (enabled && data) {
      startMonitoring();
    }

    return () => {
      stopMonitoring();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, data]);

  // threshold나 interval 변경 시 처리
  useEffect(() => {
    if (realTimeMonitoring.isEnabled) {
      updateDetectionThreshold(threshold);
      updateInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold, interval, realTimeMonitoring.isEnabled]);

  return {
    // 상태
    isMonitoring: realTimeMonitoring.isEnabled,
    lastUpdate: realTimeMonitoring.lastUpdate,
    activeChanges: Array.from(realTimeMonitoring.activeChanges.values()),
    changeHistory: realTimeMonitoring.changeHistory,
    alertQueue: realTimeMonitoring.alertQueue,
    threshold: realTimeMonitoring.detectionThreshold,
    updateInterval: realTimeMonitoring.updateInterval,

    // 액션
    startMonitoring,
    stopMonitoring,
    setThreshold,
    setUpdateInterval,
    triggerDetection,

    // 유틸
    getMonitoringStats,
  };
};