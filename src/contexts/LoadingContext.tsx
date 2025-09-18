/**
 * LoadingContext.tsx
 *
 * 앱 전체의 로딩 상태를 중앙에서 관리하는 Context
 * 여러 비동기 작업의 로딩 상태를 추적하고 UI에 일관성 있게 표시
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface LoadingContextType {
  loadingStates: LoadingState;
  setLoading: (key: string, isLoading: boolean) => void;
  isLoading: (key?: string) => boolean;
  isAnyLoading: () => boolean;
  withLoading: <T extends any[]>(
    key: string,
    asyncFn: (...args: T) => Promise<any>
  ) => (...args: T) => Promise<any>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  }, []);

  const isLoading = useCallback((key?: string) => {
    if (!key) return false;
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);

  const withLoading = useCallback(<T extends any[]>(
    key: string,
    asyncFn: (...args: T) => Promise<any>
  ) => {
    return async (...args: T) => {
      try {
        setLoading(key, true);
        const result = await asyncFn(...args);
        return result;
      } finally {
        setLoading(key, false);
      }
    };
  }, [setLoading]);

  const contextValue: LoadingContextType = {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading,
    withLoading
  };

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading(): LoadingContextType {
  const context = useContext(LoadingContext);

  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }

  return context;
}

export default LoadingContext;