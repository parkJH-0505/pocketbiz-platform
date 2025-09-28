/**
 * useMomentum Hook
 *
 * 전역 모멘텀 상태 관리 및 캐싱을 담당하는 커스텀 훅
 * - MomentumEngine 인스턴스 관리
 * - 5분 주기 자동 업데이트
 * - 캐싱 및 성능 최적화
 * - 다른 컴포넌트와 상태 공유
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MomentumEngine, MomentumData } from '../services/momentumEngine';

interface UseMomentumReturn {
  momentum: MomentumData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

// 싱글톤 엔진 인스턴스
let engineInstance: MomentumEngine | null = null;

const getEngineInstance = (): MomentumEngine => {
  if (!engineInstance) {
    engineInstance = new MomentumEngine();
  }
  return engineInstance;
};

// 캐시 관리
const CACHE_KEY = 'momentum-cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5분

interface CachedData {
  data: MomentumData;
  timestamp: number;
}

const getCachedMomentum = (): MomentumData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsedCache: CachedData = JSON.parse(cached);
    const now = Date.now();

    // 캐시 유효성 검사
    if (now - parsedCache.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    // Date 객체 복원
    return {
      ...parsedCache.data,
      lastUpdated: new Date(parsedCache.data.lastUpdated)
    };
  } catch (error) {
    console.error('Failed to get cached momentum:', error);
    return null;
  }
};

const setCachedMomentum = (data: MomentumData): void => {
  try {
    const cacheData: CachedData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Failed to cache momentum:', error);
  }
};

export const useMomentum = (): UseMomentumReturn => {
  const [momentum, setMomentum] = useState<MomentumData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const engine = useRef<MomentumEngine>(getEngineInstance());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 모멘텀 데이터 로드
  const loadMomentum = useCallback(async (useCache: boolean = true): Promise<void> => {
    try {
      setError(null);

      // 캐시된 데이터 확인
      if (useCache) {
        const cached = getCachedMomentum();
        if (cached) {
          setMomentum(cached);
          setLastUpdated(cached.lastUpdated);
          setLoading(false);
          return;
        }
      }

      setLoading(true);

      // 새로운 데이터 계산
      const newMomentum = await engine.current.calculateBasicMomentum();

      // 상태 업데이트
      setMomentum(newMomentum);
      setLastUpdated(newMomentum.lastUpdated);

      // 캐시 저장
      setCachedMomentum(newMomentum);

      // 이전 점수 저장 (트렌드 계산용)
      engine.current.savePreviousScore(newMomentum.score);
    } catch (err) {
      console.error('Failed to load momentum:', err);
      setError(err instanceof Error ? err.message : '모멘텀 로드 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  // 강제 새로고침 (캐시 무시)
  const refresh = useCallback(async (): Promise<void> => {
    await loadMomentum(false);
  }, [loadMomentum]);

  // 초기 로드
  useEffect(() => {
    loadMomentum();
  }, []);

  // 5분 주기 자동 업데이트
  useEffect(() => {
    // 첫 업데이트는 5분 후
    intervalRef.current = setInterval(() => {
      loadMomentum(false);
    }, CACHE_DURATION);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadMomentum]);

  // 페이지 포커스 시 데이터 새로고침 (선택적)
  useEffect(() => {
    const handleFocus = () => {
      // 마지막 업데이트가 5분 이상 지났으면 새로고침
      if (lastUpdated) {
        const timeSinceUpdate = Date.now() - lastUpdated.getTime();
        if (timeSinceUpdate > CACHE_DURATION) {
          loadMomentum(false);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [lastUpdated, loadMomentum]);

  return {
    momentum,
    loading,
    error,
    refresh,
    lastUpdated
  };
};

// 전역 상태 공유를 위한 Context (선택적)
import React, { createContext, useContext, ReactNode } from 'react';

interface MomentumContextValue {
  momentum: MomentumData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

const MomentumContext = createContext<MomentumContextValue | undefined>(undefined);

export const MomentumProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const momentumState = useMomentum();

  return (
    <MomentumContext.Provider value={momentumState}>
      {children}
    </MomentumContext.Provider>
  );
};

export const useMomentumContext = (): MomentumContextValue => {
  const context = useContext(MomentumContext);
  if (!context) {
    throw new Error('useMomentumContext must be used within a MomentumProvider');
  }
  return context;
};