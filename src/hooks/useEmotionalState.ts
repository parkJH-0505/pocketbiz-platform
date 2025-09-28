/**
 * useEmotionalState Hook
 *
 * 감정 상태 추론 및 관리를 위한 커스텀 훅
 * MomentumContext와 연동하여 실시간 감정 상태 업데이트
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { EmotionalState, EmotionalTrend } from '../types/emotional.types';
import { EmotionalStateEngine } from '../services/emotionalStateEngine';
import { useMomentumContext } from './useMomentum';

interface UseEmotionalStateReturn {
  emotionalState: EmotionalState | null;
  emotionalTrend: EmotionalTrend | null;
  loading: boolean;
  error: string | null;
  updateEmotionalFactors: (factors: any) => Promise<void>;
  refresh: () => Promise<void>;
}

// 싱글톤 엔진 인스턴스
let engineInstance: EmotionalStateEngine | null = null;

const getEngineInstance = (): EmotionalStateEngine => {
  if (!engineInstance) {
    engineInstance = new EmotionalStateEngine();
  }
  return engineInstance;
};

export const useEmotionalState = (): UseEmotionalStateReturn => {
  const { momentum } = useMomentumContext();
  const [emotionalState, setEmotionalState] = useState<EmotionalState | null>(null);
  const [emotionalTrend, setEmotionalTrend] = useState<EmotionalTrend | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const engine = useRef<EmotionalStateEngine>(getEngineInstance());

  // 감정 상태 계산
  const calculateEmotionalState = useCallback(async (additionalFactors?: any): Promise<void> => {
    try {
      setError(null);
      setLoading(true);

      // 감정 상태 추론
      const state = await engine.current.inferEmotionalState(momentum, additionalFactors);
      setEmotionalState(state);

      // 트렌드 분석
      const trend = engine.current.getEmotionalTrend(state);
      setEmotionalTrend(trend);
    } catch (err) {
      console.error('Failed to calculate emotional state:', err);
      setError(err instanceof Error ? err.message : '감정 상태 계산 실패');
    } finally {
      setLoading(false);
    }
  }, [momentum]);

  // 추가 요소 업데이트
  const updateEmotionalFactors = useCallback(async (factors: any): Promise<void> => {
    await calculateEmotionalState(factors);
  }, [calculateEmotionalState]);

  // 강제 새로고침
  const refresh = useCallback(async (): Promise<void> => {
    await calculateEmotionalState();
  }, [calculateEmotionalState]);

  // 모멘텀 변경 시 자동 업데이트
  useEffect(() => {
    if (momentum) {
      calculateEmotionalState();
    }
  }, [momentum, calculateEmotionalState]);

  // 15분마다 자동 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      calculateEmotionalState();
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [calculateEmotionalState]);

  return {
    emotionalState,
    emotionalTrend,
    loading,
    error,
    updateEmotionalFactors,
    refresh
  };
};

// Context API를 통한 전역 상태 관리 (선택적)
import React, { createContext, useContext, ReactNode } from 'react';

interface EmotionalStateContextValue {
  emotionalState: EmotionalState | null;
  emotionalTrend: EmotionalTrend | null;
  loading: boolean;
  error: string | null;
  updateEmotionalFactors: (factors: any) => Promise<void>;
  refresh: () => Promise<void>;
}

const EmotionalStateContext = createContext<EmotionalStateContextValue | undefined>(undefined);

export const EmotionalStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const emotionalStateData = useEmotionalState();

  return (
    <EmotionalStateContext.Provider value={emotionalStateData}>
      {children}
    </EmotionalStateContext.Provider>
  );
};

export const useEmotionalStateContext = (): EmotionalStateContextValue => {
  const context = useContext(EmotionalStateContext);
  if (!context) {
    throw new Error('useEmotionalStateContext must be used within an EmotionalStateProvider');
  }
  return context;
};