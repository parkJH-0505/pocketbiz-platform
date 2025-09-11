/**
 * 통합 타입 정의 파일
 * Single Source of Truth for all type definitions
 * Created: 2025-01-11
 * Based on: MASTER_PLAN.md
 */

// ===========================
// Core Types
// ===========================

export type SectorType = 'S-1' | 'S-2' | 'S-3' | 'S-4' | 'S-5';
export type StageType = 'A-1' | 'A-2' | 'A-3' | 'A-4' | 'A-5';
export type AxisKey = 'GO' | 'EC' | 'PT' | 'PF' | 'TO';
export type WeightType = 'x1' | 'x2' | 'x3';
export type InputType = 'Numeric' | 'Calculation' | 'Rubric' | 'Stage' | 'Checklist' | 'MultiSelect';

// ===========================
// KPI Related Types
// ===========================

export interface KPIDefinition {
  kpi_id: string;
  title: string;
  question: string;
  axis: AxisKey;
  input_type: InputType;
  applicable_stages: StageType[];
  formula?: string;
  input_fields?: string[];
}

export interface StageRule {
  kpi_id: string;
  stage: StageType;
  weight: WeightType;
  minMax?: { min: number; max: number };
  choices?: Choice[];
  applicable: boolean;
}

export interface Choice {
  label: string;
  value: string | number;
  score?: number;
}

export interface KPIResponse {
  run_id: string;
  kpi_id: string;
  raw: any;
  normalized?: number;
  weighted?: number;
  status: 'valid' | 'invalid' | 'na';
}

// ===========================
// Assessment Related Types
// ===========================

export interface AssessmentRun {
  runId: string;
  organizationId: string;
  sector: SectorType;
  stage: StageType;
  createdAt: Date;
  completedAt?: Date;
  status: 'draft' | 'in_progress' | 'completed';
  overallScore?: number;
  axisScores?: AxisScore[];
}

export interface AxisScore {
  axis: AxisKey;
  rawScore: number;
  normalizedScore: number;
  weightedScore: number;
  rank?: string;
}

// ===========================
// UI Navigation Types (Sprint 17)
// ===========================

export type KPITabType = 'assess' | 'results' | 'analysis' | 'benchmark' | 'action';

export interface KPIDiagnosisTab {
  key: KPITabType;
  label: string;
  component?: React.ComponentType;
  completed?: boolean;
}

// ===========================
// Dashboard Types (iteration-16)
// ===========================

export interface CurrentPositionWidget {
  cluster: { sector: SectorType; stage: StageType };
  totalScore: number;
  weeklyChange: number;
  miniRadar: any; // ChartData
  animation: 'pulse' | 'fade' | 'slide';
}

export interface NBARecommendation {
  title: string;
  expectedScore: number;
  estimatedCost: number;
  duration: string;
  roi: number;
  cta: () => void;
}

export interface FOMOProgram {
  matchRate: number;
  urgencyLevel: 'high' | 'medium' | 'low';
  daysLeft: number;
  seatsLeft: number;
  visualUrgency: string;
}

// ===========================
// Program & Matching Types (Sprint 8)
// ===========================

export interface Program {
  id: string;
  name: string;
  provider: string;
  category: 'government' | 'investment' | 'accelerator' | 'competition';
  description: string;
  benefits: string[];
  deadline?: Date;
  applicationUrl?: string;
  region?: string[];
  status: 'active' | 'closed' | 'upcoming';
}

export interface MatchRule {
  id: string;
  programId: string;
  type: 'required' | 'preferred' | 'excluded';
  condition: {
    field: string;
    operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'between';
    value: any;
  };
  weight: number;
  reason: string;
}

export interface MatchScore {
  programId: string;
  startupId: string;
  eligibility: 'eligible' | 'partial' | 'ineligible';
  score: number;
  reasons: {
    met: string[];
    unmet: string[];
    recommendations: string[];
  };
  successProbability?: number;
}

// ===========================
// User & Organization Types
// ===========================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'startup' | 'admin' | 'partner' | 'internal-builder';
  organizationId?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface Organization {
  id: string;
  name: string;
  businessNumber?: string;
  foundedAt?: Date;
  website?: string;
  sector: SectorType;
  stage: StageType;
  sectorLockedAt: Date;
  lastStageUpdate: Date;
}

// ===========================
// Context Types
// ===========================

export interface KPIDiagnosisContextType {
  // Assessment data
  assessmentData: any; // TODO: Define specific type
  resultsData: any; // TODO: Define specific type
  analysisData: any; // TODO: Define specific type
  
  // Tab management
  activeTab: KPITabType;
  tabHistory: KPITabType[];
  
  // Actions
  saveAssessment: () => Promise<void>;
  calculateResults: () => Promise<any>;
  generateAnalysis: () => Promise<any>;
  setActiveTab: (tab: KPITabType) => void;
}

// ===========================
// Re-export existing types for compatibility
// ===========================

export * from '../kpi';
export * from '../cluster';