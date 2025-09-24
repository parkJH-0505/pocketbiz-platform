/**
 * contextReadyEmitter.ts
 *
 * Context 준비 상태를 관리하는 이벤트 시스템
 * 여러 Context가 서로를 기다리고 준비되면 알림을 받을 수 있음
 */

interface ContextReadyEvent {
  contextName: string;
  timestamp: Date;
  methods?: string[];
}

type EventListener = (...args: any[]) => void;

// 간단한 EventEmitter 구현 (브라우저 호환)
class SimpleEventEmitter {
  private events: Map<string, Set<EventListener>> = new Map();

  on(event: string, listener: EventListener): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(listener);
  }

  once(event: string, listener: EventListener): void {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  off(event: string, listener: EventListener): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  emit(event: string, ...args: any[]): void {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }

  removeAllListeners(): void {
    this.events.clear();
  }
}

class ContextReadyEmitter extends SimpleEventEmitter {
  private readyContexts = new Set<string>();
  private contextMetadata = new Map<string, ContextReadyEvent>();

  /**
   * Context를 준비 완료로 표시
   */
  markReady(contextName: string, methods?: string[]): void {
    if (this.readyContexts.has(contextName)) {
      console.log(`⚠️ Context '${contextName}' is already marked as ready`);
      return;
    }

    this.readyContexts.add(contextName);
    this.contextMetadata.set(contextName, {
      contextName,
      timestamp: new Date(),
      methods
    });

    // Context별 이벤트 발송
    this.emit(`${contextName}:ready`, contextName);

    // 전역 이벤트 발송
    this.emit('context:ready', contextName);

    console.log(`📢 Context ready: ${contextName}`);

    if (methods && methods.length > 0) {
      console.log(`   Available methods: ${methods.join(', ')}`);
    }

    console.log(`📊 Total ready contexts: ${this.readyContexts.size} / ${this.getAllExpectedContexts().length}`);

    // 모든 Context가 준비되면 알림
    if (this.areAllContextsReady()) {
      this.emit('all:ready');
      console.log('🎉 All contexts are ready!');
    }
  }

  /**
   * Context를 준비 안됨으로 표시 (unmount 시)
   */
  markUnready(contextName: string): void {
    if (!this.readyContexts.has(contextName)) {
      return;
    }

    this.readyContexts.delete(contextName);
    this.contextMetadata.delete(contextName);

    this.emit(`${contextName}:unready`, contextName);
    console.log(`🔄 Context unready: ${contextName}`);
  }

  /**
   * Context가 준비되었는지 확인
   */
  isReady(contextName: string): boolean {
    return this.readyContexts.has(contextName);
  }

  /**
   * 특정 Context가 준비될 때까지 대기
   */
  waitForContext(contextName: string): Promise<void> {
    if (this.isReady(contextName)) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.once(`${contextName}:ready`, () => resolve());
    });
  }

  /**
   * 여러 Context가 모두 준비될 때까지 대기
   */
  async waitForAll(contextNames: string[]): Promise<void> {
    const promises = contextNames.map(name => this.waitForContext(name));
    await Promise.all(promises);
  }

  /**
   * 필수 Context가 모두 준비될 때까지 대기
   */
  waitForEssentialContexts(): Promise<void> {
    const essentialContexts = ['schedule', 'buildup'];
    return this.waitForAll(essentialContexts);
  }

  /**
   * 현재 준비된 Context 목록
   */
  getReadyContexts(): string[] {
    return Array.from(this.readyContexts);
  }

  /**
   * Context 메타데이터 조회
   */
  getContextMetadata(contextName: string): ContextReadyEvent | undefined {
    return this.contextMetadata.get(contextName);
  }

  /**
   * 예상되는 모든 Context 목록
   */
  private getAllExpectedContexts(): string[] {
    return ['schedule', 'buildup', 'dashboard', 'chat', 'calendar', 'vdr'];
  }

  /**
   * 필수 Context가 모두 준비되었는지 확인
   */
  areEssentialContextsReady(): boolean {
    const essentialContexts = ['schedule', 'buildup'];
    return essentialContexts.every(ctx => this.isReady(ctx));
  }

  /**
   * 모든 Context가 준비되었는지 확인
   */
  private areAllContextsReady(): boolean {
    const expected = this.getAllExpectedContexts();
    return expected.every(ctx => this.isReady(ctx));
  }

  /**
   * 준비 상태 요약 반환
   */
  getReadyStatus(): Record<string, boolean> {
    const allContexts = this.getAllExpectedContexts();
    return allContexts.reduce((acc, ctx) => {
      acc[ctx] = this.isReady(ctx);
      return acc;
    }, {} as Record<string, boolean>);
  }

  /**
   * 준비 상태 리포트 출력
   */
  printStatus(): void {
    const status = this.getReadyStatus();
    console.log('📋 Context Ready Status:');
    Object.entries(status).forEach(([name, ready]) => {
      const icon = ready ? '✅' : '⏳';
      const metadata = this.getContextMetadata(name);
      const time = metadata ? ` (${metadata.timestamp.toLocaleTimeString()})` : '';
      console.log(`  ${icon} ${name}${time}`);
    });
  }

  /**
   * 모든 상태 초기화
   */
  reset(): void {
    this.readyContexts.clear();
    this.contextMetadata.clear();
    this.removeAllListeners();
    console.log('🔄 ContextReadyEmitter reset');
  }
}

// Singleton 인스턴스
export const contextReadyEmitter = new ContextReadyEmitter();

// Window 객체에 노출 (디버깅용)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).__contextReady__ = contextReadyEmitter;
  (window as any).__contextStatus__ = () => contextReadyEmitter.printStatus();
}