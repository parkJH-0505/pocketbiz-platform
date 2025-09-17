export type NotificationType =
  | 'kpi_milestone' 
  | 'investment_match'
  | 'program_deadline'
  | 'team_update'
  | 'achievement'
  | 'alert'
  | 'reminder';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationStatus = 'unread' | 'read' | 'dismissed';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  message: string;
  icon?: string;
  color?: string;
  timestamp: Date;
  expiresAt?: Date;
  actionUrl?: string;
  actionLabel?: string;
  data?: Record<string, any>;
}

export interface NotificationPreferences {
  kpi_milestone: boolean;
  investment_match: boolean;
  program_deadline: boolean;
  team_update: boolean;
  achievement: boolean;
  alert: boolean;
  reminder: boolean;
  email: boolean;
  push: boolean;
  inApp: boolean;
}

export interface NotificationRule {
  id: string;
  type: NotificationType;
  condition: string; // 조건식 (예: "kpi.GO > 80")
  title: string;
  message: string;
  priority: NotificationPriority;
  enabled: boolean;
  cooldown?: number; // 분 단위
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}