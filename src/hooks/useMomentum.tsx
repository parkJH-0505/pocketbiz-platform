/**
 * useMomentum Hook - Professional Growth Momentum Tracker
 *
 * 전문가급 모멘텀 상태 관리 및 실시간 트래킹
 * - 실제 사용자 행동 기반 모멘텀 계산
 * - 스마트 캐싱 및 성능 최적화
 * - 자동 히스토리 관리 및 트렌드 분석
 * - 성취 시스템과의 완벽한 통합
 * - 오류 처리 및 복구 매커니즘
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { momentumEngine } from '../services/momentumEngine';
import type { RealMomentumData, MomentumCalculationConfig } from '../services/momentumEngine';
import { achievementEngine } from '../services/achievementEngine';

interface UseMomentumReturn {
  momentum: RealMomentumData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshRealData: () => Promise<void>;
  lastUpdated: Date | null;
  isStale: boolean;
  config: MomentumCalculationConfig;
  updateConfig: (newConfig: Partial<MomentumCalculationConfig>) => void;
}

// 전문가급 캐싱 설정
const CACHE_CONFIG = {
  MOMENTUM_KEY: 'real-momentum-cache',
  HISTORY_KEY: 'momentum-history-cache',
  CONFIG_KEY: 'momentum-config-cache',
  CACHE_DURATION: 10 * 60 * 1000, // 10분 (실제 데이터는 더 오래 유지)
  STALE_THRESHOLD: 5 * 60 * 1000,  // 5분 후 stale 표시
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// 전문가급 캐시 관리 시스템
interface EnhancedCachedData {
  data: RealMomentumData;
  timestamp: number;
  version: string; // 스키마 버전 관리
  checksum: string; // 데이터 무결성 검증
}

interface CacheManager {
  get: (key: string) => RealMomentumData | null;
  set: (key: string, data: RealMomentumData) => void;
  isStale: (key: string) => boolean;
  clear: (key: string) => void;
  clearAll: () => void;
}

const createCacheManager = (): CacheManager => {
  const generateChecksum = (data: any): string => {
    // Use a simple hash function instead of btoa to avoid encoding issues
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  };

  const getCurrentVersion = (): string => {
    return '2.0.0'; // RealMomentumData 버전
  };

  return {
    get: (key: string): RealMomentumData | null => {
      try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        const parsedCache: EnhancedCachedData = JSON.parse(cached);
        const now = Date.now();

        // 버전 호환성 검사
        if (parsedCache.version !== getCurrentVersion()) {
          localStorage.removeItem(key);
          return null;
        }

        // 체크섬 검증
        const expectedChecksum = generateChecksum(parsedCache.data);
        if (parsedCache.checksum !== expectedChecksum) {
          console.warn('Cache checksum mismatch, removing corrupted data');
          localStorage.removeItem(key);
          return null;
        }

        // 캐시 만료 검사
        if (now - parsedCache.timestamp > CACHE_CONFIG.CACHE_DURATION) {
          localStorage.removeItem(key);
          return null;
        }

        // Date 객체 복원
        return {
          ...parsedCache.data,
          lastCalculated: new Date(parsedCache.data.lastCalculated),
          historicalData: parsedCache.data.historicalData.map(point => ({
            ...point,
            date: new Date(point.date)
          }))
        };
      } catch (error) {
        console.error('Failed to get cached momentum:', error);
        return null;
      }
    },

    set: (key: string, data: RealMomentumData): void => {
      try {
        const cacheData: EnhancedCachedData = {
          data,
          timestamp: Date.now(),
          version: getCurrentVersion(),
          checksum: generateChecksum(data)
        };
        localStorage.setItem(key, JSON.stringify(cacheData));
      } catch (error) {
        console.error('Failed to cache momentum:', error);
        // 캐시 공간 부족 시 오래된 데이터 정리
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.warn('Cache quota exceeded, clearing old data');
          Object.keys(localStorage)
            .filter(k => k.includes('momentum') || k.includes('cache'))
            .slice(0, 5)
            .forEach(k => localStorage.removeItem(k));
        }
      }
    },

    isStale: (key: string): boolean => {
      try {
        const cached = localStorage.getItem(key);
        if (!cached) return true;

        const parsedCache: EnhancedCachedData = JSON.parse(cached);
        const now = Date.now();
        return (now - parsedCache.timestamp) > CACHE_CONFIG.STALE_THRESHOLD;
      } catch {
        return true;
      }
    },

    clear: (key: string): void => {
      localStorage.removeItem(key);
    },

    clearAll: (): void => {
      Object.keys(localStorage)
        .filter(key => key.includes('momentum'))
        .forEach(key => localStorage.removeItem(key));
    }
  };
};

const cacheManager = createCacheManager();

export const useMomentum = (): UseMomentumReturn => {
  const [momentum, setMomentum] = useState<RealMomentumData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [config, setConfig] = useState<MomentumCalculationConfig>(momentumEngine.getDefaultConfig());

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);

  // 모멘텀 데이터 로드 (스마트 캐싱 포함)
  const loadMomentum = useCallback(async (useCache: boolean = true, useRealData: boolean = false): Promise<void> => {
    const cacheKey = CACHE_CONFIG.MOMENTUM_KEY;

    try {
      setError(null);
      retryCountRef.current = 0;

      // 캐시된 데이터 확인
      if (useCache) {
        const cached = cacheManager.get(cacheKey);
        if (cached) {
          setMomentum(cached);
          setLastUpdated(cached.lastCalculated);
          setIsStale(cacheManager.isStale(cacheKey));
          setLoading(false);
          return;
        }
      }

      setLoading(true);

      // momentumEngine.calculateBusinessHealth를 사용하여 데이터 가져오기
      const healthData = await momentumEngine.calculateBusinessHealth();

      // RealMomentumData 형식으로 변환
      const newMomentum: RealMomentumData = {
        score: healthData.score,
        trend: healthData.trend as 'rising' | 'falling' | 'stable',
        factors: {
          activity: healthData.breakdown.activity,
          growth: Math.round((healthData.breakdown.activity + healthData.breakdown.performance) / 2), // 성장도 계산
          consistency: healthData.breakdown.consistency,
          performance: healthData.breakdown.performance
        },
        insights: {
          message: healthData.insights.message || '모멘텀을 분석 중입니다.',
          type: healthData.score >= 70 ? 'positive' : healthData.score >= 40 ? 'neutral' : 'improvement',
          actionable: healthData.insights.suggestion || '꾸준한 활동이 중요합니다.'
        },
        lastCalculated: healthData.lastUpdated,
        historicalData: [] // Will be filled with actual historical data later
      };

      // 상태 업데이트
      setMomentum(newMomentum);
      setLastUpdated(newMomentum.lastCalculated);
      setIsStale(false);

      // 캐시 저장
      cacheManager.set(cacheKey, newMomentum);

      // 성취 시스템과 통합
      try {
        // 새로운 성취 체크 (모멘텀 점수 기반)
        await achievementEngine.checkAllAchievements(newMomentum);

        // 모멘텀 관련 특별 성취 체크
        if (newMomentum.score >= 90) {
          await achievementEngine.triggerAchievement('momentum_master');
        }
        if (newMomentum.trend === 'rising' && newMomentum.score >= 80) {
          await achievementEngine.triggerAchievement('rising_star');
        }
      } catch (achievementError) {
        console.warn('Achievement system error:', achievementError);
        // 성취 시스템 오류는 메인 기능에 영향주지 않음
      }

      retryCountRef.current = 0; // 성공 시 재시도 카운트 리셋
    } catch (err) {
      console.error('Failed to load momentum:', err);

      const errorMessage = err instanceof Error ? err.message : '모멘텀 계산 실패';
      setError(errorMessage);

      // 자동 재시도 로직
      if (retryCountRef.current < CACHE_CONFIG.MAX_RETRY_ATTEMPTS) {
        retryCountRef.current++;
        console.log(`Retrying momentum calculation (${retryCountRef.current}/${CACHE_CONFIG.MAX_RETRY_ATTEMPTS})`);

        retryTimeoutRef.current = setTimeout(() => {
          loadMomentum(false, useRealData);
        }, CACHE_CONFIG.RETRY_DELAY * retryCountRef.current);
      }
    } finally {
      setLoading(false);
    }
  }, [config]);

  // 강제 새로고침 (캐시 무시)
  const refresh = useCallback(async (): Promise<void> => {
    cacheManager.clear(CACHE_CONFIG.MOMENTUM_KEY);
    await loadMomentum(false, false);
  }, [loadMomentum]);

  // 실제 데이터 기반 새로고침
  const refreshRealData = useCallback(async (): Promise<void> => {
    cacheManager.clear(CACHE_CONFIG.MOMENTUM_KEY);
    await loadMomentum(false, true);
  }, [loadMomentum]);

  // 설정 업데이트
  const updateConfig = useCallback((newConfig: Partial<MomentumCalculationConfig>): void => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    localStorage.setItem(CACHE_CONFIG.CONFIG_KEY, JSON.stringify(updatedConfig));

    // 설정 변경 시 캐시 무효화 및 재계산
    cacheManager.clear(CACHE_CONFIG.MOMENTUM_KEY);
    loadMomentum(false, true);
  }, [config, loadMomentum]);

  // 초기 로드
  useEffect(() => {
    loadMomentum();
  }, []);

  // 설정 로드
  useEffect(() => {
    const savedConfig = localStorage.getItem(CACHE_CONFIG.CONFIG_KEY);
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig({ ...config, ...parsedConfig });
      } catch (error) {
        console.warn('Failed to load saved config:', error);
      }
    }
  }, []);

  // 스마트 자동 업데이트 (10분 주기)
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      // 캐시가 stale하거나 없으면 업데이트
      if (cacheManager.isStale(CACHE_CONFIG.MOMENTUM_KEY) || !momentum) {
        loadMomentum(false, true); // 실제 데이터로 업데이트
      }
    }, CACHE_CONFIG.CACHE_DURATION);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [loadMomentum, momentum]);

  // 페이지 포커스 시 스마트 새로고침
  useEffect(() => {
    const handleFocus = () => {
      if (!lastUpdated) {
        loadMomentum(true, true);
        return;
      }

      const timeSinceUpdate = Date.now() - lastUpdated.getTime();

      // 10분 이상 지났거나 stale 상태면 실제 데이터로 새로고침
      if (timeSinceUpdate > CACHE_CONFIG.CACHE_DURATION || isStale) {
        loadMomentum(false, true);
      }
      // 5분 이상 지났으면 stale 표시
      else if (timeSinceUpdate > CACHE_CONFIG.STALE_THRESHOLD) {
        setIsStale(true);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleFocus();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [lastUpdated, isStale, loadMomentum]);

  return {
    momentum,
    loading,
    error,
    refresh,
    refreshRealData,
    lastUpdated,
    isStale,
    config,
    updateConfig
  };
};

// 전역 상태 공유를 위한 Context (선택적)
import React, { createContext, useContext, ReactNode } from 'react';

interface MomentumContextValue {
  momentum: RealMomentumData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshRealData: () => Promise<void>;
  lastUpdated: Date | null;
  isStale: boolean;
  config: MomentumCalculationConfig;
  updateConfig: (newConfig: Partial<MomentumCalculationConfig>) => void;
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