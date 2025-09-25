/**
 * globalContextManager.ts
 *
 * 모든 Context를 중앙에서 관리하는 Global Context Manager
 * 싱글톤 패턴으로 구현되어 앱 전체에서 하나의 인스턴스만 존재
 */

import type {
  IGlobalContextManager,
  ContextMetadata,
  ContextState,
  RegistryEntry,
  ContextMessage,
  ContextMetrics,
  KnownContextNames,
  ContextEvent
} from '../types/contextBridge.types';

/**
 * GlobalContextManager 클래스
 * 모든 Context의 중앙 관리자 역할
 */
class GlobalContextManager implements IGlobalContextManager {
  // 싱글톤 인스턴스
  private static instance: GlobalContextManager | null = null;

  // Context Registry
  private registry: Map<string, RegistryEntry> = new Map();

  // Event handlers
  private eventHandlers: Map<string, Set<(data: ContextEvent) => void>> = new Map();

  // Message handlers
  private messageHandlers: Map<string, Set<(message: ContextMessage) => void>> = new Map();

  // 메트릭
  private metrics = {
    messagesSent: 0,
    messagesReceived: 0
  };

  // 초기화 상태
  private initialized = false;

  // Private constructor (싱글톤 패턴)
  private constructor() {
    this.initialize();
  }

  /**
   * 싱글톤 인스턴스 가져오기
   */
  public static getInstance(): GlobalContextManager {
    if (!GlobalContextManager.instance) {
      GlobalContextManager.instance = new GlobalContextManager();
    }
    return GlobalContextManager.instance;
  }

  /**
   * Manager 초기화
   */
  private initialize(): void {
    if (this.initialized) return;


    // Window 객체에 노출 (디버깅용)
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      (window as any).__contextManager__ = this;
      (window as any).__getContextStatus__ = () => this.getMetrics();
    }

    this.initialized = true;
  }

  /**
   * Context 등록
   */
  public register(
    name: string,
    context: any,
    metadata?: Partial<ContextMetadata>
  ): void {
    if (this.registry.has(name)) {
      console.warn(`Context "${name}" is already registered. Updating...`);
    }

    const now = new Date();
    const defaultMetadata: ContextMetadata = {
      name,
      version: '1.0.0',
      description: `${name} context`,
      dependencies: [],
      isReady: true,
      registeredAt: now,
      lastUpdated: now,
      ...metadata
    };

    const state: ContextState = {
      status: 'ready',
      errorCount: 0
    };

    const entry: RegistryEntry = {
      context: context as any,
      metadata: defaultMetadata,
      state,
      instance: context
    };

    this.registry.set(name, entry);

    // 이벤트 발생
    this.emitEvent({
      contextId: name,
      type: 'registered',
      data: { metadata: defaultMetadata },
      timestamp: now
    });

  }

  /**
   * Context 등록 해제
   */
  public unregister(name: string): void {
    if (!this.registry.has(name)) {
      console.warn(`Context "${name}" is not registered`);
      return;
    }

    const entry = this.registry.get(name);

    // Dispose 메서드가 있으면 호출
    if (entry?.instance?.dispose && typeof entry.instance.dispose === 'function') {
      try {
        entry.instance.dispose();
      } catch (error) {
        console.error(`Error disposing context "${name}":`, error);
      }
    }

    this.registry.delete(name);

    // 이벤트 발생
    this.emitEvent({
      contextId: name,
      type: 'unregistered',
      timestamp: new Date()
    });

  }

  /**
   * Context 가져오기
   */
  public get<T = any>(name: string): T | null {
    const entry = this.registry.get(name);
    return entry ? (entry.instance as T) : null;
  }

  /**
   * Context 존재 여부 확인
   */
  public has(name: string): boolean {
    return this.registry.has(name);
  }

  /**
   * 모든 Context 가져오기
   */
  public getAll(): Map<string, RegistryEntry> {
    return new Map(this.registry);
  }

  /**
   * Context 준비 상태 확인
   */
  public isReady(name: string): boolean {
    const entry = this.registry.get(name);
    return entry ? entry.metadata.isReady : false;
  }

  /**
   * Context 상태 가져오기
   */
  public getStatus(name: string): ContextState | null {
    const entry = this.registry.get(name);
    return entry ? { ...entry.state } : null;
  }

  /**
   * Context가 준비될 때까지 대기
   */
  public async waitForContext(name: string, timeout: number = 5000): Promise<any> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkContext = () => {
        const context = this.get(name);

        if (context && this.isReady(name)) {
          resolve(context);
          return;
        }

        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for context "${name}"`));
          return;
        }

        setTimeout(checkContext, 100);
      };

      checkContext();
    });
  }

  /**
   * Context 간 메시지 전송
   */
  public send(message: ContextMessage): void {
    const toContext = this.registry.get(message.to);

    if (!toContext) {
      console.warn(`Cannot send message to unregistered context "${message.to}"`);
      return;
    }

    // 메시지 ID 생성
    const fullMessage: ContextMessage = {
      ...message,
      id: message.id || `msg_${Date.now()}_${Math.random()}`,
      timestamp: message.timestamp || new Date()
    };

    // 수신 Context의 핸들러 호출
    const handlers = this.messageHandlers.get(message.to);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(fullMessage);
        } catch (error) {
          console.error(`Error in message handler for "${message.to}":`, error);
        }
      });
    }

    this.metrics.messagesSent++;
    this.metrics.messagesReceived++;

  }

  /**
   * 모든 Context에 브로드캐스트
   */
  public broadcast(type: string, payload: any, from: string): void {
    const timestamp = new Date();
    const id = `broadcast_${Date.now()}`;

    this.registry.forEach((entry, name) => {
      if (name !== from) {
        this.send({
          from,
          to: name,
          type,
          payload,
          timestamp,
          id
        });
      }
    });

  }

  /**
   * 이벤트 리스너 등록
   */
  public on(event: string, handler: (data: ContextEvent) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * 이벤트 리스너 해제
   */
  public off(event: string, handler: (data: ContextEvent) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * 메시지 핸들러 등록 (내부용)
   */
  public onMessage(contextName: string, handler: (message: ContextMessage) => void): void {
    if (!this.messageHandlers.has(contextName)) {
      this.messageHandlers.set(contextName, new Set());
    }
    this.messageHandlers.get(contextName)!.add(handler);
  }

  /**
   * 메시지 핸들러 해제 (내부용)
   */
  public offMessage(contextName: string, handler: (message: ContextMessage) => void): void {
    const handlers = this.messageHandlers.get(contextName);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * 이벤트 발생
   */
  private emitEvent(event: ContextEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for "${event.type}":`, error);
        }
      });
    }

    // 'all' 이벤트 핸들러에도 전달
    const allHandlers = this.eventHandlers.get('all');
    if (allHandlers) {
      allHandlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error('Error in "all" event handler:', error);
        }
      });
    }
  }

  /**
   * Manager 초기화
   */
  public reset(): void {
    // 모든 Context dispose
    this.registry.forEach((entry, name) => {
      this.unregister(name);
    });

    // 초기화
    this.registry.clear();
    this.eventHandlers.clear();
    this.messageHandlers.clear();
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0
    };

  }

  /**
   * 메트릭 가져오기
   */
  public getMetrics(): ContextMetrics {
    const registrySnapshot: Record<string, any> = {};

    this.registry.forEach((entry, name) => {
      registrySnapshot[name] = {
        name: entry.metadata.name,
        status: entry.state.status,
        isReady: entry.metadata.isReady,
        errorCount: entry.state.errorCount
      };
    });

    const readyCount = Array.from(this.registry.values())
      .filter(entry => entry.metadata.isReady).length;

    const errorCount = Array.from(this.registry.values())
      .reduce((sum, entry) => sum + entry.state.errorCount, 0);

    return {
      totalRegistered: this.registry.size,
      readyCount,
      errorCount,
      messagesSent: this.metrics.messagesSent,
      messagesReceived: this.metrics.messagesReceived,
      registrySnapshot
    };
  }

  /**
   * 디버그 정보 출력
   */
  public debug(): void {
    console.group('🔍 GlobalContextManager Debug Info');
    console.log('Registry size:', this.registry.size);
    console.log('Registered contexts:', Array.from(this.registry.keys()));
    console.log('Metrics:', this.getMetrics());
    console.groupEnd();
  }
}

// 싱글톤 인스턴스 export
export const contextManager = GlobalContextManager.getInstance();

// 클래스 export (migrationConditions.ts에서 필요)
export { GlobalContextManager };

// 기본 export
export default contextManager;