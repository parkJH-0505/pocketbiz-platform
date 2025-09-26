/**
 * ResultsInsightsPanelV2 Type Definitions
 * Interactive Living Dashboard 타입 정의
 */

import type { AxisKey } from '../../../../types';

// ========== View State Types ==========
export interface V2ViewState {
  selectedAxis: AxisKey | null;
  hoveredElement: string | null;
  expandedCards: string[];
  comparisonMode: ComparisonMode;
  isLoading: boolean;
  error: string | null;
}

export type ComparisonMode = 'none' | 'peer' | 'time' | 'goal';

// ========== Simulation Types ==========
export interface V2SimulationState {
  isActive: boolean;
  adjustments: SimulationAdjustments;
  calculatedScore: number;
  projectedScores: Record<AxisKey, number>;
  impactBreakdown: Record<AxisKey, number>;
  confidence: number;
  risks: string[];
  opportunities: string[];
}

export interface SimulationAdjustments {
  price: number;    // -50 to +50
  churn: number;    // -50 to +50
  team: number;     // -50 to +50
  growth: number;   // -50 to +50
}

// ========== Animation Types ==========
export interface V2AnimationState {
  radarRotation: Vector3;
  isAutoRotating: boolean;
  particlesActive: boolean;
  transitionPhase: TransitionPhase;
  animationSpeed: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export type TransitionPhase = 'idle' | 'entering' | 'exiting' | 'transitioning';

// ========== Interaction Types ==========
export interface RadarInteraction {
  rotation: {
    sensitivity: number;
    damping: number;
    autoRotateSpeed: number;
    limits: {
      x: [number, number];
      y: [number, number];
    };
  };
  zoom: {
    min: number;
    max: number;
    speed: number;
    pinchSpeed: number;
  };
  axisHover: {
    threshold: number;
    highlightScale: number;
    glowIntensity: number;
    tooltipDelay: number;
  };
  dragSimulation: {
    snapInterval: number;
    minValue: number;
    maxValue: number;
    feedbackHaptic: boolean;
  };
}

// ========== Data Types ==========
export interface V2ScoreData {
  current: {
    scores: Record<AxisKey, number>;
    overall: number;
    timestamp: string;
  };
  previous?: {
    scores: Record<AxisKey, number>;
    overall: number;
    timestamp: string;
  };
  changes: Record<AxisKey, number>;
}

export interface V2PeerData {
  count: number;
  distribution: {
    percentiles: number[];
    values: number[];
  };
  averages: Record<AxisKey, number>;
  topPerformers: CompanyData[];
  position: number; // 백분위
}

export interface CompanyData {
  id: string;
  name: string;
  scores: Record<AxisKey, number>;
  overall: number;
  stage: string;
  industry: string;
}

// ========== Chart Types ==========
export interface RadarChartData {
  axes: AxisData[];
  datasets: Dataset[];
}

export interface AxisData {
  key: AxisKey;
  label: string;
  fullName: string;
  value: number;
  target: number;
  peer: number;
  color: string;
}

export interface Dataset {
  name: string;
  values: number[];
  color: string;
  opacity: number;
}

// ========== Achievement Types ==========
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  reward: {
    points: number;
    badge?: string;
  };
  completed: boolean;
  expiresAt: string;
}

// ========== Store Types ==========
export interface V2Store {
  // States
  viewState: V2ViewState;
  simulation: V2SimulationState;
  animation: V2AnimationState;
  data: V2ScoreData | null;
  peerData: V2PeerData | null;

  // View Actions
  setSelectedAxis: (axis: AxisKey | null) => void;
  setHoveredElement: (element: string | null) => void;
  toggleCard: (cardId: string) => void;
  setComparisonMode: (mode: ComparisonMode) => void;

  // Simulation Actions
  updateSimulation: (key: keyof SimulationAdjustments, value: number) => void;
  runSimulation: () => Promise<void>;
  resetSimulation: () => void;
  saveScenario: (name: string) => void;
  loadScenario: (id: string) => void;

  // Animation Actions
  setRotation: (rotation: Partial<Vector3>) => void;
  toggleAutoRotate: () => void;
  toggleParticles: () => void;

  // Data Actions
  loadData: () => Promise<void>;
  loadPeerData: (filters?: PeerFilters) => Promise<void>;
  refreshData: () => Promise<void>;
  setData: (data: V2ScoreData) => void;

  // Error Handling Actions
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export interface PeerFilters {
  industry?: string;
  stage?: string;
  size?: string;
  region?: string;
}

// ========== Component Props Types ==========
export interface HeaderProps {
  score: number;
  status: string;
  insights: QuickInsight[];
}

export interface QuickInsight {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  icon: string;
  text: string;
  value?: string | number;
}

export interface RadarProps {
  data: RadarChartData;
  interaction: RadarInteraction;
  onAxisClick?: (axis: AxisKey) => void;
  onAxisHover?: (axis: AxisKey | null) => void;
  onDrag?: (adjustments: Partial<SimulationAdjustments>) => void;
}

export interface InsightsPanelProps {
  selectedAxis: AxisKey | null;
  data: V2ScoreData;
  showDetails: boolean;
}

// ========== Utility Types ==========
export type ScoreRange = 'critical' | 'warning' | 'normal' | 'good' | 'excellent';

export interface ScoreColor {
  range: [number, number];
  color: string;
  glow: string;
  label: string;
}

export interface AnimationConfig {
  duration: number;
  ease: string;
  delay?: number;
  stagger?: number;
}

// ========== API Types ==========
export interface SimulationRequest {
  adjustments: SimulationAdjustments;
  timeframe: 'immediate' | '1month' | '3months' | '6months';
  includeRisks: boolean;
}

export interface SimulationResponse {
  projected: Record<AxisKey, number>;
  overall: number;
  confidence: number;
  risks: Risk[];
  opportunities: Opportunity[];
  timeline: TimelinePoint[];
}

export interface Risk {
  id: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  mitigation: string;
  probability: number;
  impact: number;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  timeframe: string;
}

export interface TimelinePoint {
  date: string;
  score: number;
  milestone?: string;
}