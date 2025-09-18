/**
 * Dashboard Types
 *
 * 대시보드 시스템을 위한 타입 정의
 * - 기존 KPI, Buildup, SmartMatching 타입과 호환
 * - "매일 만나고 싶은 성장 동반자" 철학 반영
 */

import type { AxisKey, Sector, Stage } from './index';
// import { Event as SmartMatchingEvent } from './smartMatching';

// ============================================================================
// Core Dashboard Types
// ============================================================================

/**
 * 오늘의 액션 - 하루에 하나의 핵심 액션
 */
export interface TodaysAction {
  id: string;
  title: string;
  description: string;
  estimatedTime: string; // "15분", "30분" 등
  motivation: string; // 동기부여 메시지
  actionType: 'kpi' | 'opportunity' | 'buildup' | 'exploration';
  actionUrl: string; // 해당 페이지 URL
  priority: 'high' | 'medium' | 'low';
  completedAt?: Date;
  impact: ActionImpact;
  metadata?: ActionMetadata;
}

export interface ActionImpact {
  expectedPoints: number; // 예상 점수 상승
  timeToComplete: number; // 예상 소요 시간 (분)
  difficulty: 'easy' | 'medium' | 'hard';
  confidence: number; // 성공 확률 (0-1)
}

export interface ActionMetadata {
  kpiAxis?: AxisKey; // KPI 액션인 경우 해당 축
  opportunityId?: string; // 기회 액션인 경우 기회 ID
  buildupProjectId?: string; // Buildup 액션인 경우 프로젝트 ID
  tags?: string[];
}

/**
 * 캘린더 이벤트 - 주간 일정 표시
 */
export interface CalendarEvent {
  id: string;
  date: Date;
  type: CalendarEventType;
  title: string;
  description: string;
  estimatedTime: string;
  tone: string; // 부드러운 메시지 톤
  actionUrl?: string;
  priority: 'high' | 'medium' | 'low';
  isCompleted: boolean;
  metadata?: CalendarEventMetadata;
}

export type CalendarEventType =
  | 'checkup'      // KPI 체크업
  | 'opportunity'  // 새로운 기회
  | 'planning'     // 계획/준비
  | 'reminder'     // 리마인더
  | 'celebration'  // 축하/성취
  | 'exploration'; // 탐색 활동

export interface CalendarEventMetadata {
  matchRate?: number; // 기회 매칭률 (0-100)
  opportunityId?: string;
  buildupProjectId?: string;
  kpiAxis?: AxisKey;
  sourceType?: 'auto' | 'manual' | 'suggestion';
}

/**
 * 성장 레벨 시스템
 */
export interface GrowthLevel {
  current: LevelInfo;
  score: number; // 현재 점수 (0-100)
  progress: ProgressInfo;
  next: NextLevelInfo;
  history?: LevelHistory[];
}

export interface LevelInfo {
  name: string; // "새싹 단계", "성장기" 등
  icon: string; // 이모지
  description: string;
  color: string; // Tailwind 색상
  range: [number, number]; // [최소, 최대] 점수
}

export interface ProgressInfo {
  current: number; // 현재 레벨 내 진행도
  total: number; // 레벨 총 구간
  percentage: number; // 백분율 (0-100)
}

export interface NextLevelInfo {
  name: string;
  requiredScore: number;
  pointsNeeded: number;
  estimatedTimeToReach: string; // "2주 내", "1개월 내" 등
}

export interface LevelHistory {
  date: Date;
  level: string;
  score: number;
  event?: string; // 레벨업 이벤트
}

/**
 * 성장 현황판
 */
export interface GrowthStatus {
  level: GrowthLevel;
  strengths: AxisStrength[];
  improvements: AxisImprovement[];
  recentProgress: RecentProgress;
  celebration?: CelebrationMessage;
  insights: StatusInsight[];
}

export interface AxisStrength {
  axis: AxisKey;
  axisName: string;
  score: number;
  percentile: number; // 동종업계 대비 백분위
  status: 'strong' | 'growing' | 'stable' | 'focus';
  message: string; // 격려/가이드 메시지
  trend?: 'up' | 'down' | 'stable';
  improvement?: number; // 최근 변화량
}

export interface AxisImprovement {
  axis: AxisKey;
  axisName: string;
  currentScore: number;
  potentialGain: number;
  priority: 'high' | 'medium' | 'low';
  suggestedActions: string[];
  timeframe: string; // "2주 내 개선 가능"
}

export interface RecentProgress {
  period: string; // "지난 2주"
  changes: AxisChange[];
  highlights: string[];
  totalImprovement: number;
}

export interface AxisChange {
  axis: AxisKey;
  axisName: string;
  before: number;
  after: number;
  improvement: number;
  isSignificant: boolean; // 5점 이상 변화
}

/**
 * 축하/격려 메시지
 */
export interface CelebrationMessage {
  type: 'achievement' | 'improvement' | 'milestone' | 'encouragement';
  icon: string;
  title: string;
  message: string;
  subMessage?: string;
  action?: {
    text: string;
    url: string;
  };
}

/**
 * 상태 인사이트
 */
export interface StatusInsight {
  type: 'strength' | 'opportunity' | 'trend' | 'benchmark';
  title: string;
  message: string;
  confidence: number; // 인사이트 신뢰도 (0-1)
  actionable?: boolean;
  suggestedAction?: string;
}

// ============================================================================
// Growth Insights Types
// ============================================================================

/**
 * 성장 인사이트
 */
export interface GrowthInsights {
  personal: PersonalInsight;
  benchmark: BenchmarkInsight;
  opportunity: OpportunityInsight;
  lastUpdated: Date;
  confidence: number; // 전체 인사이트 신뢰도
}

/**
 * 개인 패턴 분석
 */
export interface PersonalInsight {
  patterns: UserPattern[];
  primaryInsight: InsightItem;
  supportingInsights: InsightItem[];
  confidenceScore: number;
  nextAnalysisDate: Date;
}

export interface UserPattern {
  type: 'activity' | 'completion' | 'growth' | 'engagement';
  name: string;
  description: string;
  strength: number; // 패턴 강도 (0-1)
  frequency: 'daily' | 'weekly' | 'monthly';
  recommendation: string;
}

export interface InsightItem {
  type: 'strength' | 'pattern' | 'growth' | 'warning' | 'opportunity';
  title: string;
  message: string;
  actionSuggestion?: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
}

/**
 * 벤치마크 비교
 */
export interface BenchmarkInsight {
  message: string;
  encouragement: string;
  strongestAxis: {
    name: string;
    percentile: number;
  };
  improvementArea: {
    name: string;
    percentile: number;
  };
  overallRanking: number; // 전체 백분위
  peerComparison: PeerComparison;
}

export interface PeerComparison {
  sector: Sector;
  stage: Stage;
  totalPeers: number;
  position: number; // 1등, 2등 등
  topPercentile: boolean; // 상위 20% 여부
}

/**
 * 숨은 기회 발견
 */
export interface OpportunityInsight {
  opportunities: HiddenOpportunity[];
  primaryRecommendation: OpportunityRecommendation;
  trends: MarketTrend[];
}

export interface HiddenOpportunity {
  id: string;
  title: string;
  description: string;
  type: 'funding' | 'program' | 'network' | 'market';
  matchScore: number; // 0-100
  urgency: 'high' | 'medium' | 'low';
  timeframe: string;
  requirements: string[];
  expectedBenefit: string;
}

export interface OpportunityRecommendation {
  title: string;
  reason: string;
  action: string;
  timeframe: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface MarketTrend {
  category: string;
  trend: 'rising' | 'stable' | 'declining';
  impact: 'high' | 'medium' | 'low';
  relevance: number; // 사용자 관련성 (0-1)
  description: string;
}

// ============================================================================
// Dashboard Context Types
// ============================================================================

/**
 * 대시보드 컨텍스트
 */
export interface DashboardContextType {
  // 상태
  todaysAction: TodaysAction | null;
  weeklySchedule: CalendarEvent[];
  growthStatus: GrowthStatus | null;
  growthInsights: GrowthInsights | null;
  currentWeek: Date;
  isLoading: boolean;
  lastUpdated: Date;
  error: DashboardError | null;

  // 액션
  updateTodaysAction: () => Promise<void>;
  navigateWeek: (direction: 'prev' | 'next') => void;
  markActionCompleted: (actionId: string) => Promise<void>;
  markEventCompleted: (eventId: string) => Promise<void>;
  refreshData: () => Promise<void>;

  // 설정
  preferences: DashboardPreferences;
  updatePreferences: (prefs: Partial<DashboardPreferences>) => void;
}

export interface DashboardError {
  type: 'network' | 'data' | 'permission' | 'unknown';
  message: string;
  details?: string;
  timestamp: Date;
  recoverable: boolean;
}

export interface DashboardPreferences {
  enableNotifications: boolean;
  preferredActionTime: 'morning' | 'afternoon' | 'evening';
  difficultyPreference: 'easy' | 'balanced' | 'challenging';
  weekStartsOn: 0 | 1; // 0: 일요일, 1: 월요일
  compactView: boolean;
  autoRefresh: boolean;
}

// ============================================================================
// Data Integration Types (기존 시스템과의 연동)
// ============================================================================

/**
 * KPI 시스템 연동
 */
export interface KPIIntegration {
  axisScores: Record<AxisKey, number>;
  lastUpdate: Date;
  completionRate: number; // 0-1
  incompleteKPIs: {
    axis: AxisKey;
    count: number;
    estimatedTime: number;
  }[];
}

/**
 * Buildup 시스템 연동
 */
export interface BuildupIntegration {
  activeProjects: BuildupProject[];
  upcomingMilestones: BuildupMilestone[];
  recentAchievements: BuildupAchievement[];
}

export interface BuildupProject {
  id: string;
  name: string;
  progress: number; // 0-100
  nextMilestone?: BuildupMilestone;
  urgency: 'high' | 'medium' | 'low';
}

export interface BuildupMilestone {
  id: string;
  projectId: string;
  title: string;
  deadline: Date;
  completed: boolean;
  estimatedEffort: number; // 시간 (분)
}

export interface BuildupAchievement {
  id: string;
  title: string;
  date: Date;
  impact: string;
  celebration?: boolean;
}

/**
 * SmartMatching 시스템 연동
 */
export interface SmartMatchingIntegration {
  highMatchOpportunities: HighMatchOpportunity[];
  recentMatches: RecentMatch[];
  matchingTrends: MatchingTrend[];
}

export interface HighMatchOpportunity {
  id: string;
  event: any; // SmartMatchingEvent;
  matchRate: number;
  deadline: Date;
  category: string;
  estimatedBenefit: string;
  requirements: string[];
}

export interface RecentMatch {
  opportunityId: string;
  matchRate: number;
  date: Date;
  status: 'new' | 'viewed' | 'applied' | 'rejected';
}

export interface MatchingTrend {
  period: string;
  averageMatchRate: number;
  totalOpportunities: number;
  appliedCount: number;
  successRate: number;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * 사용자 활동 추적
 */
export interface UserActivity {
  timestamp: Date;
  type: 'action_completed' | 'page_visit' | 'event_interaction' | 'data_update';
  details: Record<string, any>;
  sessionId: string;
  duration?: number; // 활동 지속 시간 (초)
}

/**
 * 성능 메트릭
 */
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionDelay: number;
  errorRate: number;
  userSatisfaction?: number; // 1-5 점수
}

/**
 * A/B 테스트 지원
 */
export interface ExperimentConfig {
  experimentId: string;
  variant: 'A' | 'B';
  features: Record<string, boolean>;
  startDate: Date;
  endDate: Date;
}

// Export types individually - no need for default export