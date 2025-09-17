/**
 * useEventBus.ts
 *
 * React 컴포넌트에서 EventBus를 사용하기 위한 커스텀 Hook
 * 타입 안전성, 자동 정리, 메모리 누수 방지에 중점
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { eventBus, createEvent } from '../events/EventBus';
import type { EventTypeMap, EventHandler } from '../events/eventTypes';
import { logger } from '../logging/Logger';

interface UseEventBusOptions {
  component?: string;
  autoCleanup?: boolean;
  enableLogging?: boolean;
}

interface EventSubscriptionRef {
  id: string;
  eventType: string;
  cleanup: () => void;
}

export function useEventBus(options: UseEventBusOptions = {}) {
  const {
    component = 'UnknownComponent',
    autoCleanup = true,
    enableLogging = process.env.NODE_ENV === 'development'
  } = options;

  const subscriptionsRef = useRef<EventSubscriptionRef[]>([]);
  const mountedRef = useRef(true);

  // 컴포넌트 언마운트 감지
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 이벤트 리스너 등록
  const on = useCallback(<T extends keyof EventTypeMap>(
    eventType: T,
    handler: EventHandler<EventTypeMap[T]>,
    options: {
      once?: boolean;
      priority?: number;
    } = {}
  ): string => {
    if (!mountedRef.current) {
      logger.warn('Attempted to register event listener on unmounted component', {
        eventType,
        component
      }, 'useEventBus');
      return '';
    }

    try {
      // 안전한 핸들러 래핑
      const safeHandler: EventHandler<EventTypeMap[T]> = (event) => {
        if (!mountedRef.current) {
          if (enableLogging) {
            logger.debug('Event received on unmounted component, ignoring', {
              eventType,
              eventId: event.id,
              component
            }, 'useEventBus');
          }
          return;
        }

        try {
          return handler(event);
        } catch (error) {
          logger.error('Event handler error', {
            eventType,
            eventId: event.id,
            component,
            error: (error as Error).message,
            stack: (error as Error).stack
          }, 'useEventBus');
          throw error;
        }
      };

      const subscriptionId = eventBus.on(eventType, safeHandler, options);

      // 구독 정보 저장
      const subscription: EventSubscriptionRef = {
        id: subscriptionId,
        eventType,
        cleanup: () => {
          eventBus.off(subscriptionId);
          if (enableLogging) {
            logger.debug('Event listener cleaned up', {
              subscriptionId,
              eventType,
              component
            }, 'useEventBus');
          }
        }
      };

      subscriptionsRef.current.push(subscription);

      if (enableLogging) {
        logger.debug('Event listener registered', {
          subscriptionId,
          eventType,
          component,
          once: options.once,
          priority: options.priority
        }, 'useEventBus');
      }

      return subscriptionId;
    } catch (error) {
      logger.error('Failed to register event listener', {
        eventType,
        component,
        error: (error as Error).message
      }, 'useEventBus');
      return '';
    }
  }, [component, enableLogging]);

  // 일회성 이벤트 리스너
  const once = useCallback(<T extends keyof EventTypeMap>(
    eventType: T,
    handler: EventHandler<EventTypeMap[T]>
  ): string => {
    return on(eventType, handler, { once: true });
  }, [on]);

  // 이벤트 발행
  const emit = useCallback(async <T extends keyof EventTypeMap>(
    eventType: T,
    payload: EventTypeMap[T]['payload'],
    options: {
      correlationId?: string;
    } = {}
  ): Promise<void> => {
    if (!mountedRef.current) {
      logger.warn('Attempted to emit event from unmounted component', {
        eventType,
        component
      }, 'useEventBus');
      return;
    }

    try {
      const event = createEvent(eventType, payload, {
        source: component,
        correlationId: options.correlationId
      });

      await eventBus.emit(eventType, event);

      if (enableLogging) {
        logger.debug('Event emitted', {
          eventType,
          eventId: event.id,
          component,
          correlationId: event.correlationId
        }, 'useEventBus');
      }
    } catch (error) {
      logger.error('Failed to emit event', {
        eventType,
        component,
        error: (error as Error).message
      }, 'useEventBus');
      throw error;
    }
  }, [component, enableLogging]);

  // 특정 구독 해제
  const off = useCallback((subscriptionId: string): boolean => {
    const subscriptionIndex = subscriptionsRef.current.findIndex(
      sub => sub.id === subscriptionId
    );

    if (subscriptionIndex === -1) {
      if (enableLogging) {
        logger.warn('Subscription not found for removal', {
          subscriptionId,
          component
        }, 'useEventBus');
      }
      return false;
    }

    const subscription = subscriptionsRef.current[subscriptionIndex];
    subscription.cleanup();
    subscriptionsRef.current.splice(subscriptionIndex, 1);

    return true;
  }, [component, enableLogging]);

  // 모든 구독 해제
  const removeAllListeners = useCallback((): void => {
    const subscriptionsToClean = [...subscriptionsRef.current];
    subscriptionsRef.current = [];

    for (const subscription of subscriptionsToClean) {
      subscription.cleanup();
    }

    if (enableLogging && subscriptionsToClean.length > 0) {
      logger.debug('All event listeners removed', {
        count: subscriptionsToClean.length,
        component
      }, 'useEventBus');
    }
  }, [component, enableLogging]);

  // 현재 구독 정보 조회
  const getSubscriptions = useCallback((): Array<{
    id: string;
    eventType: string;
  }> => {
    return subscriptionsRef.current.map(sub => ({
      id: sub.id,
      eventType: sub.eventType
    }));
  }, []);

  // 자동 정리 (컴포넌트 언마운트 시)
  useEffect(() => {
    if (autoCleanup) {
      return () => {
        removeAllListeners();
      };
    }
  }, [autoCleanup, removeAllListeners]);

  // 메모이제이션된 API 객체
  const api = useMemo(() => ({
    on,
    once,
    emit,
    off,
    removeAllListeners,
    getSubscriptions,
    // 편의 메서드들
    onMeetingCompleted: (handler: EventHandler<EventTypeMap['MEETING_COMPLETED']>) =>
      on('MEETING_COMPLETED', handler),
    onPhaseChangeRequest: (handler: EventHandler<EventTypeMap['PHASE_CHANGE_REQUEST']>) =>
      on('PHASE_CHANGE_REQUEST', handler),
    onPhaseChanged: (handler: EventHandler<EventTypeMap['PHASE_CHANGED']>) =>
      on('PHASE_CHANGED', handler),
    onProjectUpdated: (handler: EventHandler<EventTypeMap['PROJECT_UPDATED']>) =>
      on('PROJECT_UPDATED', handler),

    // 편의 emit 메서드들
    emitMeetingCompleted: (payload: EventTypeMap['MEETING_COMPLETED']['payload']) =>
      emit('MEETING_COMPLETED', payload),
    emitPhaseChangeRequest: (payload: EventTypeMap['PHASE_CHANGE_REQUEST']['payload']) =>
      emit('PHASE_CHANGE_REQUEST', payload),
    emitPhaseChanged: (payload: EventTypeMap['PHASE_CHANGED']['payload']) =>
      emit('PHASE_CHANGED', payload),
    emitProjectUpdated: (payload: EventTypeMap['PROJECT_UPDATED']['payload']) =>
      emit('PROJECT_UPDATED', payload)
  }), [on, once, emit, off, removeAllListeners, getSubscriptions]);

  return api;
}

// 특정 이벤트만 구독하는 특화된 Hook들
export function useMeetingCompletedEvent(
  handler: EventHandler<EventTypeMap['MEETING_COMPLETED']>,
  options: { once?: boolean; enabled?: boolean } = {}
): void {
  const { once = false, enabled = true } = options;
  const eventBusApi = useEventBus();

  useEffect(() => {
    if (!enabled) return;

    const subscriptionId = once
      ? eventBusApi.once('MEETING_COMPLETED', handler)
      : eventBusApi.on('MEETING_COMPLETED', handler);

    return () => {
      if (subscriptionId) {
        eventBusApi.off(subscriptionId);
      }
    };
  }, [handler, once, enabled, eventBusApi]);
}

export function usePhaseChangedEvent(
  handler: EventHandler<EventTypeMap['PHASE_CHANGED']>,
  options: { once?: boolean; enabled?: boolean } = {}
): void {
  const { once = false, enabled = true } = options;
  const eventBusApi = useEventBus();

  useEffect(() => {
    if (!enabled) return;

    const subscriptionId = once
      ? eventBusApi.once('PHASE_CHANGED', handler)
      : eventBusApi.on('PHASE_CHANGED', handler);

    return () => {
      if (subscriptionId) {
        eventBusApi.off(subscriptionId);
      }
    };
  }, [handler, once, enabled, eventBusApi]);
}

export function useProjectUpdatedEvent(
  handler: EventHandler<EventTypeMap['PROJECT_UPDATED']>,
  options: { once?: boolean; enabled?: boolean; projectId?: string } = {}
): void {
  const { once = false, enabled = true, projectId } = options;
  const eventBusApi = useEventBus();

  useEffect(() => {
    if (!enabled) return;

    const wrappedHandler: EventHandler<EventTypeMap['PROJECT_UPDATED']> = (event) => {
      // projectId 필터링
      if (projectId && event.payload.projectId !== projectId) {
        return;
      }
      return handler(event);
    };

    const subscriptionId = once
      ? eventBusApi.once('PROJECT_UPDATED', wrappedHandler)
      : eventBusApi.on('PROJECT_UPDATED', wrappedHandler);

    return () => {
      if (subscriptionId) {
        eventBusApi.off(subscriptionId);
      }
    };
  }, [handler, once, enabled, projectId, eventBusApi]);
}