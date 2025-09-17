import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationPreferences,
  NotificationRule,
  NotificationStats
} from '../types/notifications';
import { useKPIDiagnosis } from './KPIDiagnosisContext';

interface NotificationContextType {
  // 알림 데이터
  notifications: Notification[];
  stats: NotificationStats;
  preferences: NotificationPreferences;
  rules: NotificationRule[];
  
  // 알림 관리
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'status'>) => string;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // 환경 설정
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
  updateRule: (rule: NotificationRule) => void;
  addRule: (rule: Omit<NotificationRule, 'id'>) => void;
  removeRule: (id: string) => void;
  
  // 유틸리티
  getNotificationsByType: (type: NotificationType) => Notification[];
  getUnreadNotifications: () => Notification[];
  hasUnreadNotifications: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

// 기본 환경설정
const defaultPreferences: NotificationPreferences = {
  kpi_milestone: true,
  investment_match: true,
  program_deadline: true,
  team_update: true,
  achievement: true,
  alert: true,
  reminder: true,
  email: false,
  push: true,
  inApp: true
};

// 기본 알림 규칙
const defaultRules: NotificationRule[] = [
  {
    id: 'kpi_milestone_80',
    type: 'kpi_milestone',
    condition: 'axisScore >= 80',
    title: 'KPI 마일스톤 달성!',
    message: '{axis} 영역에서 80점을 달성했습니다.',
    priority: 'high',
    enabled: true,
    cooldown: 60
  },
  {
    id: 'investment_high_match',
    type: 'investment_match',
    condition: 'matchScore >= 90',
    title: '투자 매칭 발견!',
    message: '고도 매칭 투자 프로그램을 발견했습니다.',
    priority: 'urgent',
    enabled: true,
    cooldown: 720
  },
  {
    id: 'program_deadline_7days',
    type: 'program_deadline',
    condition: 'daysUntilDeadline <= 7',
    title: '프로그램 마감일 임박!',
    message: '{programName} 마감일이 7일 남았습니다.',
    priority: 'high',
    enabled: true,
    cooldown: 1440
  },
  {
    id: 'achievement_unlock',
    type: 'achievement',
    condition: 'achievementUnlocked',
    title: '성취 달성!',
    message: '새로운 성취를 해제했습니다: {achievementName}',
    priority: 'medium',
    enabled: true,
    cooldown: 0
  }
];

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [rules, setRules] = useState<NotificationRule[]>(defaultRules);
  const [lastRuleExecution, setLastRuleExecution] = useState<Record<string, Date>>({});
  
  const { axisScores, overallScore } = useKPIDiagnosis();

  // 알림 통계 계산
  const stats: NotificationStats = React.useMemo(() => {
    const byType = notifications.reduce((acc, notif) => {
      acc[notif.type] = (acc[notif.type] || 0) + 1;
      return acc;
    }, {} as Record<NotificationType, number>);
    
    const byPriority = notifications.reduce((acc, notif) => {
      acc[notif.priority] = (acc[notif.priority] || 0) + 1;
      return acc;
    }, {} as Record<NotificationPriority, number>);
    
    return {
      total: notifications.length,
      unread: notifications.filter(n => n.status === 'unread').length,
      byType,
      byPriority
    };
  }, [notifications]);

  // 알림 추가
  const addNotification = useCallback((
    notification: Omit<Notification, 'id' | 'timestamp' | 'status'>
  ): string => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      status: 'unread'
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    return id;
  }, []);

  // 알림 읽음 처리
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, status: 'read' as NotificationStatus } : notif
    ));
  }, []);

  // 모든 알림 읽음 처리
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => 
      notif.status === 'unread' ? { ...notif, status: 'read' as NotificationStatus } : notif
    ));
  }, []);

  // 알림 숨기기
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, status: 'dismissed' as NotificationStatus } : notif
    ));
  }, []);

  // 알림 삭제
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  // 모든 알림 삭제
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // 환경설정 업데이트
  const updatePreferences = useCallback((prefs: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...prefs }));
  }, []);

  // 규칙 업데이트
  const updateRule = useCallback((rule: NotificationRule) => {
    setRules(prev => prev.map(r => r.id === rule.id ? rule : r));
  }, []);

  // 규칙 추가
  const addRule = useCallback((rule: Omit<NotificationRule, 'id'>) => {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRule: NotificationRule = { ...rule, id };
    setRules(prev => [...prev, newRule]);
  }, []);

  // 규칙 삭제
  const removeRule = useCallback((id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  }, []);

  // 타입별 알림 조회
  const getNotificationsByType = useCallback((type: NotificationType): Notification[] => {
    return notifications.filter(notif => notif.type === type);
  }, [notifications]);

  // 읽지 않은 알림 조회
  const getUnreadNotifications = useCallback((): Notification[] => {
    return notifications.filter(notif => notif.status === 'unread');
  }, [notifications]);

  // 읽지 않은 알림 여부
  const hasUnreadNotifications = stats.unread > 0;

  // 규칙 기반 알림 자동 생성
  const checkAndTriggerRules = useCallback(() => {
    const now = new Date();
    
    rules.forEach(rule => {
      if (!rule.enabled || !preferences[rule.type]) return;
      
      // 쿨다운 확인
      const lastExecution = lastRuleExecution[rule.id];
      if (lastExecution && rule.cooldown) {
        const timeSinceLastExecution = (now.getTime() - lastExecution.getTime()) / (1000 * 60);
        if (timeSinceLastExecution < rule.cooldown) return;
      }
      
      let shouldTrigger = false;
      
      // 규칙 조건 평가
      try {
        switch (rule.type) {
          case 'kpi_milestone':
            // KPI 마일스톤 규칙 평가
            Object.entries(axisScores).forEach(([axis, score]) => {
              if (rule.condition.includes('axisScore >= 80') && score >= 80) {
                shouldTrigger = true;
                // 알림 생성
                addNotification({
                  type: rule.type,
                  priority: rule.priority,
                  title: rule.title,
                  message: rule.message.replace('{axis}', axis),
                  icon: '🎆',
                  color: 'text-green-600',
                  actionUrl: '/startup/kpi',
                  actionLabel: 'KPI 보기',
                  data: { axis, score }
                });
              }
            });
            break;
            
          case 'achievement':
            // 성취 상태 확인 (예: 전체 점수 90 이상)
            if (overallScore >= 90) {
              shouldTrigger = true;
              addNotification({
                type: rule.type,
                priority: rule.priority,
                title: '🏆 전체 KPI 90점 달성!',
                message: `축하합니다! 전체 KPI 점수 ${overallScore.toFixed(1)}점을 달성했습니다.`,
                icon: '🏆',
                color: 'text-yellow-600',
                actionUrl: '/startup/dashboard',
                actionLabel: '대시보드 보기'
              });
            }
            break;
        }
        
        if (shouldTrigger) {
          setLastRuleExecution(prev => ({ ...prev, [rule.id]: now }));
        }
      } catch (error) {
        console.error('Rule evaluation error:', error);
      }
    });
  }, [rules, preferences, axisScores, overallScore, lastRuleExecution, addNotification]);

  // 주기적으로 규칙 확인
  useEffect(() => {
    const interval = setInterval(checkAndTriggerRules, 60000); // 1분마다
    return () => clearInterval(interval);
  }, [checkAndTriggerRules]);

  // KPI 변경 시에도 규칙 확인
  useEffect(() => {
    checkAndTriggerRules();
  }, [axisScores, overallScore]);

  // 만료된 알림 제거
  useEffect(() => {
    const now = new Date();
    setNotifications(prev => 
      prev.filter(notif => !notif.expiresAt || notif.expiresAt > now)
    );
  }, []);

  const value: NotificationContextType = {
    // 데이터
    notifications,
    stats,
    preferences,
    rules,
    
    // 알림 관리
    addNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    removeNotification,
    clearAllNotifications,
    
    // 환경설정
    updatePreferences,
    updateRule,
    addRule,
    removeRule,
    
    // 유틸리티
    getNotificationsByType,
    getUnreadNotifications,
    hasUnreadNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};