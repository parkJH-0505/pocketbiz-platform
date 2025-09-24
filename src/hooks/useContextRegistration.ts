/**
 * useContextRegistration.ts
 *
 * Context를 GlobalContextManager에 자동으로 등록/해제하는 Hook
 * Context Provider에서 사용하여 생명주기 관리
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { contextManager } from '../utils/globalContextManager';
import type { ContextMetadata, ContextState, UseContextRegistration } from '../types/contextBridge.types';

interface UseContextRegistrationOptions {
  name: string;
  context: any;
  metadata?: Partial<ContextMetadata>;
  dependencies?: string[];
  autoRegister?: boolean;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Context를 GlobalContextManager에 자동으로 등록하는 Hook
 *
 * @param options - 등록 옵션
 * @returns 등록 상태 및 제어 함수
 */
export function useContextRegistration(options: UseContextRegistrationOptions): UseContextRegistration {
  const {
    name,
    context,
    metadata = {},
    dependencies = [],
    autoRegister = true,
    onReady,
    onError
  } = options;

  // 상태
  const [isRegistered, setIsRegistered] = useState(false);
  const [status, setStatus] = useState<ContextState>({
    status: 'initializing',
    errorCount: 0
  });

  // 등록 여부 추적
  const registrationRef = useRef(false);
  const contextRef = useRef(context);

  // Context 업데이트 시 참조 업데이트
  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  /**
   * Context 등록
   */
  const register = useCallback(() => {
    if (registrationRef.current) {
      console.warn(`Context "${name}" is already registered`);
      return;
    }

    try {
      // 의존성 확인
      if (dependencies.length > 0) {
        const missingDeps = dependencies.filter(dep => !contextManager.has(dep));
        if (missingDeps.length > 0) {
          throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
        }
      }

      // Context 등록
      contextManager.register(name, contextRef.current, {
        ...metadata,
        dependencies,
        isReady: true
      });

      registrationRef.current = true;
      setIsRegistered(true);
      setStatus({
        status: 'ready',
        errorCount: 0
      });

      console.log(`✅ Context "${name}" registered via hook`);

      // Ready 콜백 호출
      if (onReady) {
        onReady();
      }
    } catch (error) {
      console.error(`Failed to register context "${name}":`, error);

      setStatus({
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorCount: status.errorCount + 1
      });

      // Error 콜백 호출
      if (onError) {
        onError(error instanceof Error ? error : new Error('Unknown error'));
      }
    }
  }, [name, metadata, dependencies, onReady, onError, status.errorCount]);

  /**
   * Context 등록 해제
   */
  const unregister = useCallback(() => {
    if (!registrationRef.current) {
      return;
    }

    try {
      contextManager.unregister(name);
      registrationRef.current = false;
      setIsRegistered(false);
      setStatus({
        status: 'disposed',
        errorCount: 0
      });

      console.log(`✅ Context "${name}" unregistered via hook`);
    } catch (error) {
      console.error(`Failed to unregister context "${name}":`, error);
    }
  }, [name]);

  /**
   * 의존성 대기 및 자동 등록
   */
  useEffect(() => {
    if (!autoRegister) {
      return;
    }

    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const waitForDependenciesAndRegister = async () => {
      try {
        // 의존성이 있는 경우 대기
        if (dependencies.length > 0) {
          console.log(`⏳ Context "${name}" waiting for dependencies:`, dependencies);

          for (const dep of dependencies) {
            if (!contextManager.has(dep)) {
              await contextManager.waitForContext(dep, 10000);
            }
          }

          console.log(`✅ All dependencies ready for "${name}"`);
        }

        // 컴포넌트가 여전히 마운트되어 있는지 확인
        if (isMounted && !registrationRef.current) {
          register();
        }
      } catch (error) {
        console.error(`Failed to wait for dependencies for "${name}":`, error);

        if (isMounted) {
          setStatus({
            status: 'error',
            errorMessage: `Dependency wait failed: ${error}`,
            errorCount: status.errorCount + 1
          });

          // 5초 후 재시도
          if (status.errorCount < 3) {
            timeoutId = setTimeout(() => {
              if (isMounted) {
                waitForDependenciesAndRegister();
              }
            }, 5000);
          }
        }
      }
    };

    waitForDependenciesAndRegister();

    // Cleanup
    return () => {
      isMounted = false;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (registrationRef.current) {
        unregister();
      }
    };
  }, []); // 빈 dependency array - 마운트 시 한 번만 실행

  return {
    register,
    unregister,
    isRegistered,
    status
  };
}

/**
 * Context 메시지 수신을 위한 Hook
 */
export function useContextMessage(
  contextName: string,
  handler: (message: any) => void
) {
  useEffect(() => {
    // 메시지 핸들러 등록
    contextManager.onMessage(contextName, handler);

    // Cleanup
    return () => {
      contextManager.offMessage(contextName, handler);
    };
  }, [contextName, handler]);
}

/**
 * Context 이벤트 수신을 위한 Hook
 */
export function useContextEvent(
  eventType: string,
  handler: (event: any) => void
) {
  useEffect(() => {
    // 이벤트 핸들러 등록
    contextManager.on(eventType, handler);

    // Cleanup
    return () => {
      contextManager.off(eventType, handler);
    };
  }, [eventType, handler]);
}

/**
 * 다른 Context 가져오기 위한 Hook
 */
export function useGetContext<T = any>(contextName: string): T | null {
  const [context, setContext] = useState<T | null>(null);

  useEffect(() => {
    const checkContext = async () => {
      try {
        // Context가 준비될 때까지 대기
        const ctx = await contextManager.waitForContext(contextName, 5000);
        setContext(ctx);
      } catch (error) {
        console.warn(`Context "${contextName}" not available:`, error);
        setContext(null);
      }
    };

    checkContext();

    // Context 변경 감지
    const handleContextChange = (event: any) => {
      if (event.contextId === contextName) {
        checkContext();
      }
    };

    contextManager.on('registered', handleContextChange);
    contextManager.on('unregistered', handleContextChange);

    return () => {
      contextManager.off('registered', handleContextChange);
      contextManager.off('unregistered', handleContextChange);
    };
  }, [contextName]);

  return context;
}

export default useContextRegistration;