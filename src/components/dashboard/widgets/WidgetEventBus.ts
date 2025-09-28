/**
 * Widget Event Bus
 * 위젯 간 이벤트 기반 통신 시스템
 */

type EventCallback = (data: any) => void;
type UnsubscribeFn = () => void;

interface WidgetEvent {
  type: string;
  source: string;
  target?: string | string[];
  data: any;
  timestamp: number;
}

interface EventSubscription {
  id: string;
  widgetId: string;
  eventType: string;
  callback: EventCallback;
  filter?: (event: WidgetEvent) => boolean;
}

interface WidgetConnection {
  sourceId: string;
  targetId: string;
  eventTypes: string[];
  transformer?: (data: any) => any;
}

/**
 * 위젯 이벤트 버스
 * 싱글톤 패턴으로 구현
 */
class WidgetEventBus {
  private static instance: WidgetEventBus;
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private connections: WidgetConnection[] = [];
  private eventHistory: WidgetEvent[] = [];
  private maxHistorySize = 100;
  private debugMode = false;

  private constructor() {}

  static getInstance(): WidgetEventBus {
    if (!WidgetEventBus.instance) {
      WidgetEventBus.instance = new WidgetEventBus();
    }
    return WidgetEventBus.instance;
  }

  /**
   * 이벤트 구독
   */
  subscribe(
    widgetId: string,
    eventType: string,
    callback: EventCallback,
    filter?: (event: WidgetEvent) => boolean
  ): UnsubscribeFn {
    const subscription: EventSubscription = {
      id: `${widgetId}-${eventType}-${Date.now()}`,
      widgetId,
      eventType,
      callback,
      filter
    };

    const subscriptions = this.subscriptions.get(eventType) || [];
    subscriptions.push(subscription);
    this.subscriptions.set(eventType, subscriptions);

    if (this.debugMode) {
      console.log(`[EventBus] Widget ${widgetId} subscribed to ${eventType}`);
    }

    // Unsubscribe 함수 반환
    return () => {
      this.unsubscribe(subscription.id, eventType);
    };
  }

  /**
   * 이벤트 구독 해제
   */
  private unsubscribe(subscriptionId: string, eventType: string): void {
    const subscriptions = this.subscriptions.get(eventType);
    if (subscriptions) {
      const filtered = subscriptions.filter(s => s.id !== subscriptionId);
      if (filtered.length > 0) {
        this.subscriptions.set(eventType, filtered);
      } else {
        this.subscriptions.delete(eventType);
      }
    }
  }

  /**
   * 이벤트 발행
   */
  emit(
    source: string,
    type: string,
    data: any,
    target?: string | string[]
  ): void {
    const event: WidgetEvent = {
      type,
      source,
      target,
      data,
      timestamp: Date.now()
    };

    // 이벤트 히스토리에 추가
    this.addToHistory(event);

    // 디버그 로그
    if (this.debugMode) {
      console.log(`[EventBus] Event emitted:`, event);
    }

    // 구독자들에게 이벤트 전달
    const subscriptions = this.subscriptions.get(type) || [];
    subscriptions.forEach(subscription => {
      // 타겟이 지정된 경우 필터링
      if (target) {
        const targets = Array.isArray(target) ? target : [target];
        if (!targets.includes(subscription.widgetId)) {
          return;
        }
      }

      // 추가 필터 적용
      if (subscription.filter && !subscription.filter(event)) {
        return;
      }

      // 비동기로 콜백 실행
      setTimeout(() => {
        try {
          subscription.callback(event.data);
        } catch (error) {
          console.error(`[EventBus] Error in subscription callback:`, error);
        }
      }, 0);
    });

    // 연결된 위젯들에게 이벤트 전달
    this.propagateToConnections(event);
  }

  /**
   * 위젯 연결 설정
   */
  connect(
    sourceId: string,
    targetId: string,
    eventTypes: string[],
    transformer?: (data: any) => any
  ): void {
    const connection: WidgetConnection = {
      sourceId,
      targetId,
      eventTypes,
      transformer
    };

    this.connections.push(connection);

    if (this.debugMode) {
      console.log(`[EventBus] Connected ${sourceId} -> ${targetId} for events:`, eventTypes);
    }
  }

  /**
   * 위젯 연결 해제
   */
  disconnect(sourceId: string, targetId?: string): void {
    if (targetId) {
      this.connections = this.connections.filter(
        c => !(c.sourceId === sourceId && c.targetId === targetId)
      );
    } else {
      // sourceId와 관련된 모든 연결 제거
      this.connections = this.connections.filter(
        c => c.sourceId !== sourceId && c.targetId !== sourceId
      );
    }
  }

  /**
   * 연결된 위젯들에게 이벤트 전파
   */
  private propagateToConnections(event: WidgetEvent): void {
    this.connections
      .filter(conn =>
        conn.sourceId === event.source &&
        conn.eventTypes.includes(event.type)
      )
      .forEach(conn => {
        const transformedData = conn.transformer
          ? conn.transformer(event.data)
          : event.data;

        // 대상 위젯에게 직접 이벤트 전달
        this.emit(
          event.source,
          `${event.type}:propagated`,
          transformedData,
          conn.targetId
        );
      });
  }

  /**
   * 위젯의 모든 구독 해제
   */
  unsubscribeAll(widgetId: string): void {
    this.subscriptions.forEach((subs, eventType) => {
      const filtered = subs.filter(s => s.widgetId !== widgetId);
      if (filtered.length > 0) {
        this.subscriptions.set(eventType, filtered);
      } else {
        this.subscriptions.delete(eventType);
      }
    });

    // 연결도 제거
    this.disconnect(widgetId);

    if (this.debugMode) {
      console.log(`[EventBus] Unsubscribed all events for widget ${widgetId}`);
    }
  }

  /**
   * 이벤트 히스토리에 추가
   */
  private addToHistory(event: WidgetEvent): void {
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * 이벤트 히스토리 조회
   */
  getHistory(
    filter?: {
      type?: string;
      source?: string;
      target?: string;
      since?: number;
    }
  ): WidgetEvent[] {
    let history = [...this.eventHistory];

    if (filter) {
      if (filter.type) {
        history = history.filter(e => e.type === filter.type);
      }
      if (filter.source) {
        history = history.filter(e => e.source === filter.source);
      }
      if (filter.target) {
        history = history.filter(e => {
          if (!e.target) return false;
          const targets = Array.isArray(e.target) ? e.target : [e.target];
          return targets.includes(filter.target!);
        });
      }
      if (filter.since) {
        history = history.filter(e => e.timestamp >= filter.since);
      }
    }

    return history;
  }

  /**
   * 디버그 모드 설정
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * 현재 구독 상태 조회
   */
  getSubscriptions(): Map<string, EventSubscription[]> {
    return new Map(this.subscriptions);
  }

  /**
   * 현재 연결 상태 조회
   */
  getConnections(): WidgetConnection[] {
    return [...this.connections];
  }

  /**
   * 이벤트 버스 초기화
   */
  reset(): void {
    this.subscriptions.clear();
    this.connections = [];
    this.eventHistory = [];
  }
}

// 싱글톤 인스턴스 export
export const widgetEventBus = WidgetEventBus.getInstance();

/**
 * 미리 정의된 이벤트 타입들
 */
export const WidgetEventTypes = {
  // 데이터 이벤트
  DATA_UPDATE: 'data:update',
  DATA_REFRESH: 'data:refresh',
  DATA_ERROR: 'data:error',
  DATA_LOADING: 'data:loading',

  // 상호작용 이벤트
  WIDGET_CLICK: 'widget:click',
  WIDGET_HOVER: 'widget:hover',
  WIDGET_FOCUS: 'widget:focus',
  WIDGET_BLUR: 'widget:blur',

  // 상태 이벤트
  WIDGET_MOUNTED: 'widget:mounted',
  WIDGET_UNMOUNTED: 'widget:unmounted',
  WIDGET_RESIZED: 'widget:resized',
  WIDGET_MOVED: 'widget:moved',
  WIDGET_MINIMIZED: 'widget:minimized',
  WIDGET_MAXIMIZED: 'widget:maximized',

  // 설정 이벤트
  SETTINGS_CHANGED: 'settings:changed',
  THEME_CHANGED: 'theme:changed',

  // 커스텀 액션
  ACTION_TRIGGER: 'action:trigger',
  ACTION_COMPLETE: 'action:complete',

  // 알림 이벤트
  NOTIFICATION_SEND: 'notification:send',
  ALERT_TRIGGER: 'alert:trigger'
} as const;

/**
 * React Hook: 위젯 이벤트 구독
 */
export function useWidgetEvent(
  widgetId: string,
  eventType: string,
  handler: EventCallback,
  deps: any[] = []
): void {
  if (typeof window !== 'undefined') {
    const { useEffect } = require('react');

    useEffect(() => {
      const unsubscribe = widgetEventBus.subscribe(widgetId, eventType, handler);
      return unsubscribe;
    }, [widgetId, eventType, ...deps]);
  }
}

/**
 * React Hook: 위젯 이벤트 발행
 */
export function useWidgetEmit(widgetId: string) {
  return (type: string, data: any, target?: string | string[]) => {
    widgetEventBus.emit(widgetId, type, data, target);
  };
}

// 개발 모드에서 전역 접근 가능하도록 설정
if (process.env.NODE_ENV === 'development') {
  (window as any).widgetEventBus = widgetEventBus;
  (window as any).WidgetEventTypes = WidgetEventTypes;
}