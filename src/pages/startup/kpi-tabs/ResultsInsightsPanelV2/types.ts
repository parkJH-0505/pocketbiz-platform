/**
 * Types for ResultsInsightsPanelV2
 * AI 분석 시스템에서 사용되는 타입 정의
 */

// 기본 축 타입
export type AxisKey = 'GO' | 'EC' | 'PT' | 'PF' | 'TO';

// KPI 점수 타입
export interface KPIScores {
  GO: number; // Growth & Operations
  EC: number; // Economics & Capital
  PT: number; // Product & Technology
  PF: number; // Proof & Due Diligence
  TO: number; // Team & Organization
}

// 히스토리컬 데이터 포인트
export interface HistoricalDataPoint {
  timestamp: number;
  scores: KPIScores;
  metadata?: {
    source?: string;
    quality?: number;
    notes?: string;
  };
}

// V2 스토어 상태
export interface V2StoreState {
  data: {
    current: {
      scores: KPIScores;
      timestamp: number;
    };
    history: HistoricalDataPoint[];
    metadata?: {
      lastUpdate: number;
      dataSource: string;
      version: string;
    };
  } | null;
  viewState: {
    isLoading: boolean;
    error: string | null;
    lastRefresh: number;
  };
}

// V2 스토어 액션
export interface V2StoreActions {
  loadData: () => Promise<void>;
  updateScores: (scores: Partial<KPIScores>) => void;
  clearData: () => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

// 인사이트 관련 타입
export interface InsightConfig {
  enabledTypes: string[];
  refreshInterval: number;
  maxInsights: number;
  confidenceThreshold: number;
}

// 차트 설정
export interface ChartConfig {
  type: '2d' | '3d';
  animated: boolean;
  showLabels: boolean;
  colorScheme: string;
}

// 알림 설정
export interface NotificationConfig {
  enabled: boolean;
  types: string[];
  sound: boolean;
  desktop: boolean;
}

// 대시보드 설정
export interface DashboardConfig {
  layout: 'default' | 'compact' | 'detailed';
  autoRefresh: boolean;
  refreshInterval: number;
  theme: 'light' | 'dark' | 'auto';
  insights: InsightConfig;
  charts: ChartConfig;
  notifications: NotificationConfig;
}

export default {};