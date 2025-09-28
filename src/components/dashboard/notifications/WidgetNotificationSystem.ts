/**
 * Widget Notification System
 * 위젯 알림 시스템 - 임계값 규칙 엔진 및 알림 관리
 */

import { widgetEventBus, WidgetEventTypes } from '../widgets/WidgetEventBus';

// 알림 레벨
export enum NotificationLevel {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// 알림 채널
export enum NotificationChannel {
  TOAST = 'toast',
  BROWSER = 'browser',
  EMAIL = 'email',
  SMS = 'sms',
  SLACK = 'slack',
  TEAMS = 'teams',
  WEBHOOK = 'webhook'
}

// 조건 연산자
export type ConditionOperator =
  | '=' | '!=' | '>' | '<' | '>=' | '<='
  | 'contains' | 'not_contains'
  | 'starts_with' | 'ends_with'
  | 'in' | 'not_in'
  | 'regex' | 'exists' | 'not_exists';

// 논리 연산자
export type LogicalOperator = 'AND' | 'OR' | 'NOT';

// 조건
export interface ThresholdCondition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: any;
  dataType?: 'string' | 'number' | 'boolean' | 'date';
}

// 조건 그룹
export interface ConditionGroup {
  id: string;
  operator: LogicalOperator;
  conditions: (ThresholdCondition | ConditionGroup)[];
}

// 임계값 규칙
export interface ThresholdRule {
  id: string;
  name: string;
  description?: string;
  widgetId?: string;
  enabled: boolean;
  condition: ConditionGroup | ThresholdCondition;
  actions: NotificationAction[];
  cooldown?: number; // 재알림 방지 시간 (ms)
  schedule?: {
    enabled: boolean;
    cron?: string;
    timezone?: string;
  };
  metadata?: Record<string, any>;
}

// 알림 액션
export interface NotificationAction {
  type: 'notify' | 'webhook' | 'function';
  config: {
    level?: NotificationLevel;
    channels?: NotificationChannel[];
    title?: string;
    message?: string;
    template?: string;
    recipients?: string[];
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    function?: string;
  };
}

// 알림 객체
export interface Notification {
  id: string;
  ruleId: string;
  widgetId?: string;
  level: NotificationLevel;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  acknowledged: boolean;
  channels: NotificationChannel[];
  data?: any;
  actions?: Array<{
    label: string;
    action: string;
    primary?: boolean;
  }>;
}

// 알림 이력
export interface NotificationHistory {
  id: string;
  notification: Notification;
  sentAt: number;
  channels: Array<{
    channel: NotificationChannel;
    status: 'success' | 'failed' | 'pending';
    error?: string;
    sentAt?: number;
  }>;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
}

/**
 * 임계값 규칙 엔진
 */
export class ThresholdRuleEngine {
  private rules: Map<string, ThresholdRule> = new Map();
  private ruleLastTriggered: Map<string, number> = new Map();
  private ruleEvaluationCache: Map<string, { result: boolean; timestamp: number }> = new Map();
  private cacheTimeout = 5000; // 5초

  /**
   * 규칙 추가
   */
  addRule(rule: ThresholdRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * 규칙 제거
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    this.ruleLastTriggered.delete(ruleId);
    this.ruleEvaluationCache.delete(ruleId);
  }

  /**
   * 규칙 평가
   */
  evaluateRule(rule: ThresholdRule, data: any): boolean {
    // 캐시 확인
    const cached = this.ruleEvaluationCache.get(rule.id);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }

    const result = this.evaluateCondition(rule.condition, data);

    // 캐시 저장
    this.ruleEvaluationCache.set(rule.id, {
      result,
      timestamp: Date.now()
    });

    return result;
  }

  /**
   * 조건 평가
   */
  private evaluateCondition(
    condition: ConditionGroup | ThresholdCondition,
    data: any
  ): boolean {
    if ('operator' in condition && 'conditions' in condition) {
      // 조건 그룹
      return this.evaluateConditionGroup(condition as ConditionGroup, data);
    } else {
      // 단일 조건
      return this.evaluateThresholdCondition(condition as ThresholdCondition, data);
    }
  }

  /**
   * 조건 그룹 평가
   */
  private evaluateConditionGroup(group: ConditionGroup, data: any): boolean {
    const results = group.conditions.map(cond =>
      this.evaluateCondition(cond, data)
    );

    switch (group.operator) {
      case 'AND':
        return results.every(r => r === true);

      case 'OR':
        return results.some(r => r === true);

      case 'NOT':
        return !results[0];

      default:
        return false;
    }
  }

  /**
   * 임계값 조건 평가
   */
  private evaluateThresholdCondition(condition: ThresholdCondition, data: any): boolean {
    const fieldValue = this.getFieldValue(data, condition.field);
    const compareValue = condition.value;

    switch (condition.operator) {
      case '=':
        return fieldValue === compareValue;

      case '!=':
        return fieldValue !== compareValue;

      case '>':
        return Number(fieldValue) > Number(compareValue);

      case '<':
        return Number(fieldValue) < Number(compareValue);

      case '>=':
        return Number(fieldValue) >= Number(compareValue);

      case '<=':
        return Number(fieldValue) <= Number(compareValue);

      case 'contains':
        return String(fieldValue).includes(String(compareValue));

      case 'not_contains':
        return !String(fieldValue).includes(String(compareValue));

      case 'starts_with':
        return String(fieldValue).startsWith(String(compareValue));

      case 'ends_with':
        return String(fieldValue).endsWith(String(compareValue));

      case 'in':
        return Array.isArray(compareValue) && compareValue.includes(fieldValue);

      case 'not_in':
        return Array.isArray(compareValue) && !compareValue.includes(fieldValue);

      case 'regex':
        return new RegExp(String(compareValue)).test(String(fieldValue));

      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;

      case 'not_exists':
        return fieldValue === undefined || fieldValue === null;

      default:
        return false;
    }
  }

  /**
   * 필드 값 가져오기 (중첩 객체 지원)
   */
  private getFieldValue(data: any, field: string): any {
    return field.split('.').reduce((obj, key) => obj?.[key], data);
  }

  /**
   * 모든 규칙 평가
   */
  evaluateAllRules(data: any, widgetId?: string): ThresholdRule[] {
    const triggeredRules: ThresholdRule[] = [];

    this.rules.forEach(rule => {
      // 위젯 필터링
      if (widgetId && rule.widgetId && rule.widgetId !== widgetId) {
        return;
      }

      // 비활성화된 규칙 건너뛰기
      if (!rule.enabled) {
        return;
      }

      // 쿨다운 확인
      if (rule.cooldown) {
        const lastTriggered = this.ruleLastTriggered.get(rule.id);
        if (lastTriggered && Date.now() - lastTriggered < rule.cooldown) {
          return;
        }
      }

      // 규칙 평가
      if (this.evaluateRule(rule, data)) {
        triggeredRules.push(rule);
        this.ruleLastTriggered.set(rule.id, Date.now());
      }
    });

    return triggeredRules;
  }

  /**
   * 규칙 목록 가져오기
   */
  getRules(widgetId?: string): ThresholdRule[] {
    if (widgetId) {
      return Array.from(this.rules.values()).filter(
        rule => rule.widgetId === widgetId
      );
    }
    return Array.from(this.rules.values());
  }

  /**
   * 규칙 업데이트
   */
  updateRule(ruleId: string, updates: Partial<ThresholdRule>): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      this.rules.set(ruleId, { ...rule, ...updates });
    }
  }
}

/**
 * 알림 매니저
 */
export class NotificationManager {
  private notifications: Map<string, Notification> = new Map();
  private history: NotificationHistory[] = [];
  private channels: Map<NotificationChannel, (notification: Notification) => Promise<void>> = new Map();
  private maxHistorySize = 1000;

  constructor() {
    this.initializeChannels();
  }

  /**
   * 채널 초기화
   */
  private initializeChannels() {
    // Toast 알림
    this.channels.set(NotificationChannel.TOAST, async (notification) => {
      widgetEventBus.emit(
        'notification-system',
        WidgetEventTypes.NOTIFICATION_SEND,
        {
          type: 'toast',
          ...notification
        }
      );
    });

    // 브라우저 알림
    this.channels.set(NotificationChannel.BROWSER, async (notification) => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icon.png',
          tag: notification.id,
          data: notification.data
        });
      }
    });

    // 이메일 알림 (실제 구현 필요)
    this.channels.set(NotificationChannel.EMAIL, async (notification) => {
      console.log('Email notification:', notification);
      // TODO: 실제 이메일 전송 구현
    });

    // Slack 알림 (실제 구현 필요)
    this.channels.set(NotificationChannel.SLACK, async (notification) => {
      console.log('Slack notification:', notification);
      // TODO: Slack webhook 구현
    });
  }

  /**
   * 알림 생성
   */
  async createNotification(
    rule: ThresholdRule,
    action: NotificationAction,
    data: any
  ): Promise<Notification> {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      widgetId: rule.widgetId,
      level: action.config.level || NotificationLevel.INFO,
      title: this.interpolateTemplate(action.config.title || rule.name, data),
      message: this.interpolateTemplate(action.config.message || '', data),
      timestamp: Date.now(),
      read: false,
      acknowledged: false,
      channels: action.config.channels || [NotificationChannel.TOAST],
      data
    };

    // 알림 저장
    this.notifications.set(notification.id, notification);

    // 채널로 전송
    await this.sendToChannels(notification);

    // 이력 기록
    this.addToHistory(notification);

    return notification;
  }

  /**
   * 채널로 알림 전송
   */
  private async sendToChannels(notification: Notification): Promise<void> {
    const results = await Promise.allSettled(
      notification.channels.map(async channel => {
        const handler = this.channels.get(channel);
        if (handler) {
          await handler(notification);
          return { channel, status: 'success' as const };
        }
        return { channel, status: 'failed' as const, error: 'Handler not found' };
      })
    );

    // 이력 업데이트
    const historyEntry = this.history.find(h => h.notification.id === notification.id);
    if (historyEntry) {
      historyEntry.channels = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
        return {
          channel: notification.channels[index],
          status: 'failed' as const,
          error: result.reason
        };
      });
    }
  }

  /**
   * 템플릿 보간
   */
  private interpolateTemplate(template: string, data: any): string {
    return template.replace(/\{\{(\w+(\.\w+)*)\}\}/g, (match, path) => {
      const value = path.split('.').reduce((obj: any, key: string) => obj?.[key], data);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * 이력에 추가
   */
  private addToHistory(notification: Notification): void {
    const historyEntry: NotificationHistory = {
      id: `history-${Date.now()}`,
      notification,
      sentAt: Date.now(),
      channels: notification.channels.map(channel => ({
        channel,
        status: 'pending',
        sentAt: Date.now()
      }))
    };

    this.history.unshift(historyEntry);

    // 이력 크기 제한
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(0, this.maxHistorySize);
    }
  }

  /**
   * 알림 읽음 처리
   */
  markAsRead(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  /**
   * 알림 확인 처리
   */
  acknowledge(notificationId: string, userId?: string): void {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.acknowledged = true;

      const historyEntry = this.history.find(h => h.notification.id === notificationId);
      if (historyEntry) {
        historyEntry.acknowledgedAt = Date.now();
        historyEntry.acknowledgedBy = userId;
      }
    }
  }

  /**
   * 알림 목록 가져오기
   */
  getNotifications(options?: {
    widgetId?: string;
    unreadOnly?: boolean;
    level?: NotificationLevel;
    limit?: number;
  }): Notification[] {
    let notifications = Array.from(this.notifications.values());

    if (options?.widgetId) {
      notifications = notifications.filter(n => n.widgetId === options.widgetId);
    }

    if (options?.unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }

    if (options?.level) {
      notifications = notifications.filter(n => n.level === options.level);
    }

    // 최신순 정렬
    notifications.sort((a, b) => b.timestamp - a.timestamp);

    if (options?.limit) {
      notifications = notifications.slice(0, options.limit);
    }

    return notifications;
  }

  /**
   * 알림 이력 가져오기
   */
  getHistory(options?: {
    widgetId?: string;
    ruleId?: string;
    startDate?: number;
    endDate?: number;
    limit?: number;
  }): NotificationHistory[] {
    let history = [...this.history];

    if (options?.widgetId) {
      history = history.filter(h => h.notification.widgetId === options.widgetId);
    }

    if (options?.ruleId) {
      history = history.filter(h => h.notification.ruleId === options.ruleId);
    }

    if (options?.startDate) {
      history = history.filter(h => h.sentAt >= options.startDate!);
    }

    if (options?.endDate) {
      history = history.filter(h => h.sentAt <= options.endDate!);
    }

    if (options?.limit) {
      history = history.slice(0, options.limit);
    }

    return history;
  }

  /**
   * 알림 삭제
   */
  deleteNotification(notificationId: string): void {
    this.notifications.delete(notificationId);
  }

  /**
   * 모든 알림 삭제
   */
  clearAll(widgetId?: string): void {
    if (widgetId) {
      Array.from(this.notifications.entries()).forEach(([id, notification]) => {
        if (notification.widgetId === widgetId) {
          this.notifications.delete(id);
        }
      });
    } else {
      this.notifications.clear();
    }
  }
}

/**
 * 위젯 알림 시스템 (통합)
 */
export class WidgetNotificationSystem {
  private ruleEngine: ThresholdRuleEngine;
  private notificationManager: NotificationManager;
  private dataWatchers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.ruleEngine = new ThresholdRuleEngine();
    this.notificationManager = new NotificationManager();
    this.initializeSystem();
  }

  /**
   * 시스템 초기화
   */
  private initializeSystem() {
    // 브라우저 알림 권한 요청
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // 이벤트 리스너 등록
    widgetEventBus.subscribe(
      'notification-system',
      WidgetEventTypes.DATA_UPDATE,
      (data) => this.handleDataUpdate(data)
    );
  }

  /**
   * 데이터 업데이트 처리
   */
  private async handleDataUpdate(data: any) {
    const { widgetId, payload } = data;

    // 규칙 평가
    const triggeredRules = this.ruleEngine.evaluateAllRules(payload, widgetId);

    // 알림 생성
    for (const rule of triggeredRules) {
      for (const action of rule.actions) {
        if (action.type === 'notify') {
          await this.notificationManager.createNotification(rule, action, payload);
        } else if (action.type === 'webhook') {
          await this.executeWebhook(action, payload);
        } else if (action.type === 'function') {
          await this.executeFunction(action, payload);
        }
      }
    }
  }

  /**
   * Webhook 실행
   */
  private async executeWebhook(action: NotificationAction, data: any): Promise<void> {
    if (!action.config.url) return;

    try {
      await fetch(action.config.url, {
        method: action.config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...action.config.headers
        },
        body: JSON.stringify(action.config.body || data)
      });
    } catch (error) {
      console.error('Webhook execution failed:', error);
    }
  }

  /**
   * 함수 실행
   */
  private async executeFunction(action: NotificationAction, data: any): Promise<void> {
    if (!action.config.function) return;

    try {
      const fn = new Function('data', action.config.function);
      await fn(data);
    } catch (error) {
      console.error('Function execution failed:', error);
    }
  }

  /**
   * 데이터 감시 시작
   */
  startWatching(widgetId: string, interval: number = 5000): void {
    this.stopWatching(widgetId);

    const watcher = setInterval(() => {
      widgetEventBus.emit(
        `widget-${widgetId}`,
        WidgetEventTypes.DATA_REFRESH,
        {}
      );
    }, interval);

    this.dataWatchers.set(widgetId, watcher);
  }

  /**
   * 데이터 감시 중지
   */
  stopWatching(widgetId: string): void {
    const watcher = this.dataWatchers.get(widgetId);
    if (watcher) {
      clearInterval(watcher);
      this.dataWatchers.delete(widgetId);
    }
  }

  /**
   * Public API
   */
  get rules() {
    return this.ruleEngine;
  }

  get notifications() {
    return this.notificationManager;
  }

  /**
   * 정리
   */
  dispose(): void {
    this.dataWatchers.forEach(watcher => clearInterval(watcher));
    this.dataWatchers.clear();
  }
}

// 싱글톤 인스턴스
export const widgetNotificationSystem = new WidgetNotificationSystem();

// 개발 모드에서 전역 접근 가능
if (process.env.NODE_ENV === 'development') {
  (window as any).widgetNotificationSystem = widgetNotificationSystem;
}