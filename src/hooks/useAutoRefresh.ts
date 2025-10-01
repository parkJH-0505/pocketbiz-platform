/**
 * 자동 새로고침 최적화 훅
 * 지능적인 디바운싱과 배치 업데이트로 성능 향상
 */

import { useCallback, useRef, useEffect } from 'react';

interface AutoRefreshOptions {
  debounceMs?: number;
  maxBatchDelay?: number;
  priority?: 'low' | 'medium' | 'high';
}

export const useAutoRefresh = (
  refreshFn: () => void | Promise<void>,
  options: AutoRefreshOptions = {}
) => {
  const {
    debounceMs = 150,
    maxBatchDelay = 500,
    priority = 'medium'
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(0);
  const pendingRefreshRef = useRef<boolean>(false);

  // 우선순위별 지연 시간 조정
  const getPriorityDelay = useCallback(() => {
    switch (priority) {
      case 'high': return debounceMs * 0.5;
      case 'medium': return debounceMs;
      case 'low': return debounceMs * 2;
      default: return debounceMs;
    }
  }, [debounceMs, priority]);

  const executeRefresh = useCallback(async () => {
    if (pendingRefreshRef.current) return;

    pendingRefreshRef.current = true;
    const startTime = Date.now();

    try {
      await refreshFn();
      lastRefreshRef.current = Date.now();
      console.log(`[AutoRefresh] Refresh completed in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('[AutoRefresh] Refresh failed:', error);
    } finally {
      pendingRefreshRef.current = false;
    }
  }, [refreshFn]);

  const scheduleRefresh = useCallback(() => {
    // 이미 예약된 새로고침이 있으면 취소
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshRef.current;
    const delay = getPriorityDelay();

    // 최근에 새로고침했다면 더 긴 지연 적용
    const adjustedDelay = timeSinceLastRefresh < 1000 ?
      Math.max(delay, 1000 - timeSinceLastRefresh) : delay;

    // 최대 배치 지연 시간 제한
    const finalDelay = Math.min(adjustedDelay, maxBatchDelay);

    timeoutRef.current = setTimeout(() => {
      executeRefresh();
      timeoutRef.current = null;
    }, finalDelay);

    console.log(`[AutoRefresh] Scheduled refresh in ${finalDelay}ms (priority: ${priority})`);
  }, [getPriorityDelay, maxBatchDelay, executeRefresh, priority]);

  // 즉시 새로고침 (디바운싱 무시)
  const forceRefresh = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    executeRefresh();
  }, [executeRefresh]);

  // 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    scheduleRefresh,
    forceRefresh,
    isPending: () => pendingRefreshRef.current,
    getLastRefreshTime: () => lastRefreshRef.current
  };
};