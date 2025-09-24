/**
 * contextBridge.ts
 *
 * Context 간 통신을 위한 Bridge 유틸리티
 * GlobalContextManager를 통해 Context 간 메시지 전송 및 상태 공유
 */

import { contextManager } from './globalContextManager';
import type { ContextMessage } from '../types/contextBridge.types';

/**
 * Context Bridge 클래스
 * Context 간 안전한 통신을 제공
 */
export class ContextBridge {
  /**
   * Context 간 메시지 전송
   */
  static send<T = any>(
    from: string,
    to: string,
    type: string,
    payload: T
  ): void {
    if (!contextManager.has(from)) {
      console.warn(`Source context "${from}" is not registered`);
      return;
    }

    if (!contextManager.has(to)) {
      console.warn(`Target context "${to}" is not registered`);
      return;
    }

    const message: ContextMessage<T> = {
      from,
      to,
      type,
      payload,
      timestamp: new Date(),
      id: `msg_${Date.now()}_${Math.random()}`
    };

    contextManager.send(message);
    console.log(`🔗 Bridge: ${from} → ${to} [${type}]`, payload);
  }

  /**
   * 모든 Context에 브로드캐스트
   */
  static broadcast<T = any>(
    from: string,
    type: string,
    payload: T
  ): void {
    if (!contextManager.has(from)) {
      console.warn(`Source context "${from}" is not registered`);
      return;
    }

    contextManager.broadcast(type, payload, from);
    console.log(`📢 Bridge broadcast from "${from}": [${type}]`, payload);
  }

  /**
   * Context 메서드 호출
   */
  static async call<T = any, R = any>(
    targetContext: string,
    methodName: string,
    ...args: any[]
  ): Promise<R | null> {
    try {
      const context = await contextManager.waitForContext(targetContext, 5000);

      if (!context) {
        throw new Error(`Context "${targetContext}" not available`);
      }

      if (typeof context[methodName] !== 'function') {
        throw new Error(`Method "${methodName}" not found in context "${targetContext}"`);
      }

      const result = await context[methodName](...args);
      console.log(`✅ Bridge call: ${targetContext}.${methodName}()`, { args, result });
      return result;
    } catch (error) {
      console.error(`❌ Bridge call failed: ${targetContext}.${methodName}()`, error);
      return null;
    }
  }

  /**
   * Context 상태 가져오기
   */
  static async getState<T = any>(
    targetContext: string,
    propertyPath?: string
  ): Promise<T | null> {
    try {
      const context = await contextManager.waitForContext(targetContext, 5000);

      if (!context) {
        throw new Error(`Context "${targetContext}" not available`);
      }

      if (!propertyPath) {
        return context as T;
      }

      // Property path 파싱 (e.g., "projects.length")
      const properties = propertyPath.split('.');
      let value: any = context;

      for (const prop of properties) {
        if (value && typeof value === 'object' && prop in value) {
          value = value[prop];
        } else {
          throw new Error(`Property "${propertyPath}" not found in context "${targetContext}"`);
        }
      }

      return value as T;
    } catch (error) {
      console.error(`❌ Failed to get state from "${targetContext}"`, error);
      return null;
    }
  }

  /**
   * Context 간 데이터 동기화
   */
  static async sync(
    sourceContext: string,
    targetContext: string,
    dataType: string,
    data: any
  ): Promise<boolean> {
    try {
      // 소스 Context 확인
      if (!contextManager.has(sourceContext)) {
        throw new Error(`Source context "${sourceContext}" not registered`);
      }

      // 타겟 Context 대기
      const target = await contextManager.waitForContext(targetContext, 5000);
      if (!target) {
        throw new Error(`Target context "${targetContext}" not available`);
      }

      // 동기화 메시지 전송
      this.send(sourceContext, targetContext, `sync:${dataType}`, data);

      console.log(`🔄 Sync: ${sourceContext} → ${targetContext} [${dataType}]`);
      return true;
    } catch (error) {
      console.error(`❌ Sync failed between "${sourceContext}" and "${targetContext}"`, error);
      return false;
    }
  }
}

/**
 * Context 간 통신을 위한 Hook Helper
 */
export function useContextBridge(contextName: string) {
  return {
    send: <T = any>(to: string, type: string, payload: T) =>
      ContextBridge.send(contextName, to, type, payload),

    broadcast: <T = any>(type: string, payload: T) =>
      ContextBridge.broadcast(contextName, type, payload),

    call: <R = any>(target: string, method: string, ...args: any[]) =>
      ContextBridge.call<any, R>(target, method, ...args),

    getState: <T = any>(target: string, path?: string) =>
      ContextBridge.getState<T>(target, path),

    sync: (target: string, dataType: string, data: any) =>
      ContextBridge.sync(contextName, target, dataType, data)
  };
}

/**
 * Context 통신 예제
 */
export const contextBridgeExamples = {
  // Toast 메시지 표시
  showToast: async (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    return ContextBridge.call('toast', 'showToast', message, type);
  },

  // Schedule 생성
  createSchedule: async (scheduleData: any) => {
    return ContextBridge.call('schedule', 'createSchedule', scheduleData);
  },

  // BuildupContext의 프로젝트 가져오기
  getBuildupProjects: async () => {
    return ContextBridge.getState('buildup', 'projects');
  },

  // Context 간 동기화
  syncProjectData: async (projectData: any) => {
    return ContextBridge.sync('buildup', 'schedule', 'project', projectData);
  }
};

// 개발 환경에서 전역 노출
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).__contextBridge__ = ContextBridge;
  (window as any).__bridgeExamples__ = contextBridgeExamples;
}

export default ContextBridge;