/**
 * Analytics Types for Project MOMENTUM
 *
 * 감정 패턴 분석과 모멘텀 예측을 위한 타입 정의
 */

import type { MoodType } from './emotional.types';

// 시간 단위
export type TimeGranularity = 'hour' | 'day' | 'week' | 'month';
export type TimeRange = '7d' | '30d' | '90d' | '1y';

// 감정 데이터 포인트
export interface EmotionDataPoint {
  timestamp: Date;
  mood: MoodType;
  energy: number;
  confidence: number;
  motivation: number;
  stress: number;
  momentumScore: number;
}

// 시간대별 평균 데이터
export interface TimeSlotAverage {
  hour: number; // 0-23
  avgEnergy: number;
  avgConfidence: number;
  avgMotivation: number;
  avgStress: number;
  avgMomentum: number;
  dominantMood: MoodType;
  dataCount: number;
}

// 요일별 패턴
export interface DayOfWeekPattern {
  dayOfWeek: number; // 0-6 (일-토)
  avgEnergy: number;
  avgConfidence: number;
  avgMotivation: number;
  avgStress: number;
  avgMomentum: number;
  dominantMood: MoodType;
  bestHour: number;
  worstHour: number;
}

// 감정 패턴 분석 결과
export interface EmotionPatternAnalysis {
  timeRange: TimeRange;
  dataPoints: EmotionDataPoint[];

  // 시간대별 패턴
  hourlyPatterns: TimeSlotAverage[];

  // 요일별 패턴
  weeklyPatterns: DayOfWeekPattern[];

  // 트렌드
  trends: {
    energy: 'rising' | 'falling' | 'stable';
    confidence: 'rising' | 'falling' | 'stable';
    motivation: 'rising' | 'falling' | 'stable';
    stress: 'rising' | 'falling' | 'stable';
    momentum: 'rising' | 'falling' | 'stable';
  };

  // 인사이트
  insights: PatternInsight[];

  // 최고/최저 기록
  peaks: {
    highestMomentum: { value: number; timestamp: Date };
    lowestMomentum: { value: number; timestamp: Date };
    highestEnergy: { value: number; timestamp: Date };
    lowestStress: { value: number; timestamp: Date };
  };

  // 예측 가능한 패턴
  predictablePatterns: PredictablePattern[];
}

// 패턴 인사이트
export interface PatternInsight {
  id: string;
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  title: string;
  description: string;
  confidence: number; // 0-100 신뢰도
  actionable: boolean;
  recommendation?: string;
}

// 예측 가능한 패턴
export interface PredictablePattern {
  name: string;
  description: string;
  confidence: number;
  triggerConditions: string[];
  nextOccurrence?: Date;
}

// 모멘텀 예측
export interface MomentumPrediction {
  timestamp: Date;
  predictedScore: number;
  confidence: number;
  factors: {
    historicalPattern: number; // 과거 패턴 기여도
    recentTrend: number; // 최근 트렌드 기여도
    cyclicalPattern: number; // 주기적 패턴 기여도
    externalFactors: number; // 외부 요인 기여도
  };
  reasoning: string[];
}

// 개인화된 인사이트
export interface PersonalizedInsight {
  id: string;
  category: 'productivity' | 'wellbeing' | 'performance' | 'habit' | 'opportunity';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  data?: any;
  visualizationType?: 'chart' | 'metric' | 'comparison' | 'timeline';
  actions?: InsightAction[];
  validUntil: Date;
}

// 인사이트 액션
export interface InsightAction {
  label: string;
  type: 'primary' | 'secondary';
  action: () => void;
}

// 스마트 리포트
export interface SmartReport {
  id: string;
  type: 'weekly' | 'monthly' | 'quarterly';
  period: {
    start: Date;
    end: Date;
  };

  // 핵심 지표
  keyMetrics: {
    avgMomentum: number;
    momentumGrowth: number; // % 변화
    totalAchievements: number;
    streakDays: number;
    productivityScore: number;
  };

  // 하이라이트
  highlights: {
    bestDay: { date: Date; score: number };
    bestMoment: string;
    biggestAchievement: string;
    improvements: string[];
  };

  // 패턴 분석
  patterns: EmotionPatternAnalysis;

  // 예측
  predictions: MomentumPrediction[];

  // 권장사항
  recommendations: PersonalizedInsight[];

  // 다음 목표
  nextGoals: {
    goal: string;
    metric: string;
    target: number;
    deadline: Date;
  }[];

  generatedAt: Date;
}