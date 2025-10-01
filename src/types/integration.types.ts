/**
 * Integration Types for Project MOMENTUM Phase 3-C
 *
 * 외부 시스템과의 통합을 위한 타입 정의
 */

// 캘린더 이벤트와 감정 연동
export interface EmotionCalendarEvent {
  id: string;
  eventId: string; // 원본 캘린더 이벤트 ID
  title: string;
  startTime: Date;
  endTime: Date;
  eventType: 'meeting' | 'work' | 'deadline' | 'break' | 'personal' | 'other';

  // 감정 예측
  predictedMood?: {
    before: number; // 이벤트 전 예상 감정
    during: number; // 이벤트 중 예상 감정
    after: number;  // 이벤트 후 예상 감정
  };

  // 실제 감정 (이벤트 후 기록)
  actualMood?: {
    energy: number;
    stress: number;
    satisfaction: number;
  };

  // 모멘텀 영향
  momentumImpact: 'positive' | 'negative' | 'neutral';
  impactScore: number; // -100 ~ +100

  // 인사이트
  insights?: string[];
  recommendations?: string[];
}

// 캘린더 패턴 분석
export interface CalendarPattern {
  patternType: 'recurring' | 'clustered' | 'sparse' | 'balanced';

  // 회의 패턴
  meetingDensity: {
    daily: number;   // 일일 평균 회의 수
    weekly: number;  // 주간 평균 회의 수
    peakDay: string; // 회의가 가장 많은 요일
    peakHour: number; // 회의가 가장 많은 시간
  };

  // 업무 패턴
  workPattern: {
    focusBlocks: number; // 집중 작업 블록 수
    averageBlockLength: number; // 평균 블록 길이 (분)
    fragmentationScore: number; // 일정 파편화 점수 (0-100)
  };

  // 감정 영향
  emotionalImpact: {
    stressfulEvents: string[]; // 스트레스 유발 이벤트 타입
    energizingEvents: string[]; // 에너지 증가 이벤트 타입
    optimalSchedule: any; // 최적 일정 제안
  };
}

// KPI 실시간 연동
export interface KPIIntegration {
  source: 'manual' | 'api' | 'webhook' | 'scraping';
  provider?: string; // Google Analytics, Mixpanel, etc.

  metrics: {
    id: string;
    name: string;
    value: number;
    unit: string;
    timestamp: Date;

    // 모멘텀 가중치
    momentumWeight: number; // 0-1

    // 변화율
    change: {
      daily: number;
      weekly: number;
      monthly: number;
    };
  }[];

  // 실시간 업데이트
  updateFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  lastUpdated: Date;
  nextUpdate?: Date;
}

// 외부 앱 연동
export interface ExternalAppIntegration {
  appType: 'slack' | 'notion' | 'discord' | 'telegram' | 'webhook';
  status: 'connected' | 'disconnected' | 'error';

  config: {
    apiKey?: string;
    webhookUrl?: string;
    channelId?: string;
    workspaceId?: string;
  };

  // 전송 설정
  notifications: {
    achievements: boolean;
    dailyReport: boolean;
    weeklyReport: boolean;
    momentumAlerts: boolean;
    nudges: boolean;
  };

  // 동기화 설정
  sync: {
    importTasks?: boolean;
    exportReports?: boolean;
    bidirectional?: boolean;
  };
}

// 모바일 알림
export interface MobileNotification {
  id: string;
  type: 'nudge' | 'achievement' | 'prediction' | 'reminder' | 'celebration';

  title: string;
  body: string;
  icon?: string;
  image?: string;

  // 액션
  actions?: {
    label: string;
    action: string; // deep link or action ID
  }[];

  // 스케줄링
  scheduledTime?: Date;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'custom';
    time?: string; // HH:mm
    days?: number[]; // 0-6 (일-토)
  };

  // 타겟팅
  conditions?: {
    momentumRange?: [number, number];
    emotionalState?: string[];
    timeOfDay?: string[];
  };

  // 전송 상태
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  sentAt?: Date;
  readAt?: Date;
  clickedAt?: Date;
}

// 통합 대시보드 설정
export interface IntegrationSettings {
  calendar: {
    enabled: boolean;
    provider: 'google' | 'outlook' | 'apple' | 'custom';
    syncFrequency: number; // 분 단위
    emotionPrediction: boolean;
    autoRecommendations: boolean;
  };

  kpi: {
    enabled: boolean;
    sources: KPIIntegration[];
    autoCalculateMomentum: boolean;
  };

  externalApps: {
    [key: string]: ExternalAppIntegration;
  };

  mobile: {
    enabled: boolean;
    pushToken?: string;
    timezone: string;
    quietHours?: {
      start: string; // HH:mm
      end: string;
    };
  };
}

// 통합 이벤트
export interface IntegrationEvent {
  id: string;
  source: 'calendar' | 'kpi' | 'external' | 'mobile';
  eventType: string;
  timestamp: Date;

  data: any;

  // 처리 상태
  processed: boolean;
  processedAt?: Date;
  error?: string;

  // 모멘텀 영향
  momentumImpact?: number;
  emotionalImpact?: any;
}