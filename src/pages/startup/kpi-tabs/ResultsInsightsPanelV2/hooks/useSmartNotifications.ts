/**
 * useSmartNotifications Hook
 * 지능형 알림 시스템을 위한 로직 처리
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useV2Store } from '../store/useV2Store';
import type { AxisKey } from '../types';

export interface SmartNotification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'insight';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  category: 'performance' | 'goal' | 'anomaly' | 'opportunity' | 'system';
  axis?: AxisKey;
  timestamp: number;
  actionable: boolean;
  autoResolve: boolean;
  resolveAfter?: number;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
  isRead: boolean;
  isPinned: boolean;
  isExpanded: boolean;
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'destructive';
  handler: () => void;
}

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  minimumPriority: SmartNotification['priority'];
  categories: Record<SmartNotification['category'], boolean>;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  batchMode: boolean;
  batchInterval: number;
}

export const useSmartNotifications = () => {
  const { data, simulation, realTimeMonitoring, setSelectedAxis } = useV2Store();

  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    soundEnabled: true,
    pushEnabled: false,
    emailEnabled: false,
    minimumPriority: 'medium',
    categories: {
      performance: true,
      goal: true,
      anomaly: true,
      opportunity: true,
      system: false,
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
    batchMode: false,
    batchInterval: 5,
  });

  // 알림 생성 헬퍼
  const createNotification = useCallback((
    type: SmartNotification['type'],
    priority: SmartNotification['priority'],
    title: string,
    message: string,
    category: SmartNotification['category'],
    options: Partial<SmartNotification> = {}
  ): SmartNotification => {
    return {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      priority,
      title,
      message,
      category,
      timestamp: Date.now(),
      actionable: false,
      autoResolve: true,
      resolveAfter: priority === 'critical' ? 0 : priority === 'high' ? 30000 : 15000,
      isRead: false,
      isPinned: false,
      isExpanded: false,
      ...options,
    };
  }, []);

  // 스마트 알림 규칙 엔진
  const analyzeAndCreateNotifications = useCallback(() => {
    if (!settings.enabled || !data) return [];

    const newNotifications: SmartNotification[] = [];

    // 1. 성과 향상 감지
    Object.entries(data.changes).forEach(([axis, change]) => {
      if (change > 5) {
        newNotifications.push(createNotification(
          'success',
          'medium',
          `${axis} 영역 성과 향상`,
          `${change.toFixed(1)}점 상승했습니다. 훌륭한 성과입니다!`,
          'performance',
          {
            axis: axis as AxisKey,
            actionable: true,
            actions: [
              {
                id: 'view-details',
                label: '상세 보기',
                type: 'primary',
                handler: () => setSelectedAxis(axis as AxisKey)
              }
            ]
          }
        ));
      }
    });

    // 2. 목표 달성 알림
    Object.entries(data.current.scores).forEach(([axis, score]) => {
      if (score >= 80 && !notifications.some(n =>
        n.axis === axis && n.category === 'goal' && !n.isRead
      )) {
        newNotifications.push(createNotification(
          'success',
          'high',
          `${axis} 목표 달성!`,
          `우수 수준(80점)에 도달했습니다!`,
          'goal',
          {
            axis: axis as AxisKey,
            autoResolve: false,
            isPinned: true,
            actions: [
              {
                id: 'celebrate',
                label: '축하 보기',
                type: 'primary',
                handler: () => {
                  // 축하 모달 또는 애니메이션 실행
                }
              }
            ]
          }
        ));
      }
    });

    // 3. 성과 하락 경고
    Object.entries(data.changes).forEach(([axis, change]) => {
      if (change < -5) {
        newNotifications.push(createNotification(
          'warning',
          'high',
          `${axis} 성과 하락 주의`,
          `${Math.abs(change).toFixed(1)}점 하락했습니다. 즉시 확인이 필요합니다.`,
          'anomaly',
          {
            axis: axis as AxisKey,
            actionable: true,
            actions: [
              {
                id: 'analyze',
                label: '원인 분석',
                type: 'primary',
                handler: () => setSelectedAxis(axis as AxisKey)
              },
              {
                id: 'action-plan',
                label: '개선 계획',
                type: 'secondary',
                handler: () => {
                  // 개선 계획 페이지로 이동
                }
              }
            ]
          }
        ));
      }
    });

    // 4. 실시간 이상 감지 알림
    if (realTimeMonitoring.alertQueue.length > 0) {
      realTimeMonitoring.alertQueue.forEach(alert => {
        if (!notifications.some(n => n.metadata?.alertId === alert.id)) {
          newNotifications.push(createNotification(
            'warning',
            alert.severity === 'high' ? 'critical' : 'high',
            '실시간 이상 감지',
            alert.message,
            'anomaly',
            {
              axis: alert.axis,
              autoResolve: true,
              resolveAfter: 60000,
              metadata: { alertId: alert.id },
              actions: [
                {
                  id: 'investigate',
                  label: '조사하기',
                  type: 'primary',
                  handler: () => {
                    if (alert.axis) setSelectedAxis(alert.axis);
                  }
                }
              ]
            }
          ));
        }
      });
    }

    // 5. 개선 기회 알림
    if (simulation.isActive && simulation.opportunities.length > 0) {
      simulation.opportunities.forEach((opportunity, index) => {
        if (!notifications.some(n =>
          n.category === 'opportunity' && n.message.includes(opportunity.substring(0, 20))
        )) {
          newNotifications.push(createNotification(
            'info',
            'medium',
            '개선 기회 발견',
            opportunity,
            'opportunity',
            {
              actionable: true,
              actions: [
                {
                  id: 'apply',
                  label: '적용하기',
                  type: 'primary',
                  handler: () => {
                    // 개선 사항 적용 로직
                  }
                }
              ]
            }
          ));
        }
      });
    }

    // 6. 전체 성과 시스템 알림
    if (data.current.overall < 50) {
      if (!notifications.some(n => n.category === 'system' && n.title.includes('전체 성과'))) {
        newNotifications.push(createNotification(
          'error',
          'critical',
          '전체 성과 위험 수준',
          '전체 점수가 50점 미만입니다. 즉시 종합적인 개선이 필요합니다.',
          'system',
          {
            actionable: true,
            autoResolve: false,
            actions: [
              {
                id: 'emergency-plan',
                label: '긴급 개선 계획',
                type: 'primary',
                handler: () => {
                  // 긴급 개선 계획 모달 실행
                }
              }
            ]
          }
        ));
      }
    }

    // 7. 균형 점수 알림 (모든 축이 비슷한 수준일 때)
    if (data.current.scores) {
      const scores = Object.values(data.current.scores);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((acc, score) => acc + Math.pow(score - avg, 2), 0) / scores.length;

      if (variance < 100 && avg > 70) { // 낮은 분산 + 높은 평균
        if (!notifications.some(n => n.category === 'goal' && n.title.includes('균형'))) {
          newNotifications.push(createNotification(
            'success',
            'high',
            '균형 잡힌 성과 달성',
            '모든 영역에서 고른 성과를 보이고 있습니다!',
            'goal',
            {
              autoResolve: false,
              isPinned: true
            }
          ));
        }
      }
    }

    return newNotifications;
  }, [data, simulation, realTimeMonitoring, notifications, settings.enabled, createNotification, setSelectedAxis]);

  // 알림 필터링 (설정 기반)
  const filterNotifications = useCallback((notifications: SmartNotification[]) => {
    return notifications.filter(notification => {
      // 최소 우선순위 체크
      const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
      if (priorityOrder[notification.priority] < priorityOrder[settings.minimumPriority]) {
        return false;
      }

      // 카테고리 필터
      if (!settings.categories[notification.category]) {
        return false;
      }

      // 조용한 시간 체크
      if (settings.quietHours.enabled) {
        const now = new Date();
        const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

        const [startHour, startMinutes] = settings.quietHours.start.split(':').map(Number);
        const [endHour, endMinutes] = settings.quietHours.end.split(':').map(Number);
        const startTimeInMinutes = startHour * 60 + startMinutes;
        const endTimeInMinutes = endHour * 60 + endMinutes;

        const isQuietTime = startTimeInMinutes <= endTimeInMinutes
          ? currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes
          : currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes <= endTimeInMinutes;

        if (isQuietTime && notification.priority !== 'critical') {
          return false;
        }
      }

      return true;
    });
  }, [settings]);

  // 알림 사운드 재생
  const playNotificationSound = useCallback((priority: SmartNotification['priority']) => {
    if (!settings.soundEnabled) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const frequencies = {
        low: 440,
        medium: 523,
        high: 659,
        critical: 880
      };

      oscillator.frequency.setValueAtTime(frequencies[priority], audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('알림음 재생 실패:', error);
    }
  }, [settings.soundEnabled]);

  // 새 알림 추가
  const addNotifications = useCallback((newNotifications: SmartNotification[]) => {
    const filteredNotifications = filterNotifications(newNotifications);

    if (filteredNotifications.length > 0) {
      setNotifications(prev => [...filteredNotifications, ...prev]);

      // 가장 높은 우선순위의 알림음 재생
      const highestPriority = filteredNotifications.reduce((highest, notification) => {
        const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
        return priorityOrder[notification.priority] > priorityOrder[highest.priority]
          ? notification : highest;
      });

      playNotificationSound(highestPriority.priority);
    }
  }, [filterNotifications, playNotificationSound]);

  // 알림 액션들
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    ));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const pinNotification = useCallback((id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, isPinned: !n.isPinned } : n
    ));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications(prev => prev.filter(n => n.isPinned));
  }, []);

  // 자동 해결 처리
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev => prev.filter(notification => {
        if (!notification.autoResolve || !notification.resolveAfter) return true;
        return Date.now() - notification.timestamp < notification.resolveAfter;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 주기적 알림 생성
  useEffect(() => {
    const interval = setInterval(() => {
      const newNotifications = analyzeAndCreateNotifications();
      addNotifications(newNotifications);
    }, 15000); // 15초마다 체크

    return () => clearInterval(interval);
  }, [analyzeAndCreateNotifications, addNotifications]);

  // 통계 계산
  const stats = useMemo(() => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const pinnedCount = notifications.filter(n => n.isPinned).length;
    const criticalCount = notifications.filter(n => n.priority === 'critical' && !n.isRead).length;

    return {
      total: notifications.length,
      unread: unreadCount,
      pinned: pinnedCount,
      critical: criticalCount,
    };
  }, [notifications]);

  return {
    // 상태
    notifications,
    settings,
    stats,

    // 액션
    addNotifications,
    markAsRead,
    markAllAsRead,
    pinNotification,
    dismissNotification,
    clearAllNotifications,
    setSettings,

    // 유틸
    createNotification,
    analyzeAndCreateNotifications,
  };
};