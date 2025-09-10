// 기본 사용자 타입
export type UserRole = 'startup' | 'admin' | 'partner' | 'internal-builder';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  createdAt: string;
}

// Organization 타입
export interface Organization {
  id: string;
  name: string;
  sector: Sector;
  stage: Stage;
  createdAt: string;
}

// Sector & Stage
export type Sector = 'S-1' | 'S-2' | 'S-3' | 'S-4' | 'S-5';
export type Stage = 'A-1' | 'A-2' | 'A-3' | 'A-4' | 'A-5';

// Alias for legacy code
export type SectorType = Sector;
export type StageType = Stage;

// 평가축
export type AxisKey = 'GO' | 'EC' | 'PT' | 'PF' | 'TO';

export interface Axis {
  key: AxisKey;
  name: string;
  description: string;
}

// KPI 입력 타입
export type InputType = 
  | 'Numeric'
  | 'Calculation'
  | 'Checklist'
  | 'Stage'
  | 'Rubric'
  | 'MultiSelect';

// KPI 정의
export interface KPIDefinition {
  kpi_id: string;
  sector?: 'S-1';
  axis: AxisKey;
  title: string;
  question: string;
  input_type: InputType;
  formula?: string;
  stage?: Stage;
  applicable?: boolean;
  stage_cell?: StageCell;
  validators?: Validator[];
  evidence_required?: boolean;
  weight?: string;
  // CSV 전용 속성
  applicable_stages?: string[];
  input_fields?: string[];
  stage_specific?: any;
  validation_rules?: any;
}

export interface StageCell {
  weight: string;
  choices: Choice[];
}

export interface Choice {
  label: string;
  score: number;
  value?: number; // MultiSelect용
}

export interface Validator {
  type: 'range' | 'cross' | 'format';
  rule: string;
  message: string;
}

// KPI 응답
export interface KPIResponse {
  run_id: string;
  kpi_id: string;
  raw: RawValue;
  normalized_score?: number;
  evidence?: Evidence[];
  status: 'valid' | 'invalid' | 'na';
}

export type RawValue = 
  | { value: number; unit?: string } // Numeric
  | { numerator: number; denominator: number } // Calculation (legacy)
  | { inputs: Record<string, number>; calculatedValue?: number } // Calculation
  | { checked: boolean } // Checklist
  | { choice_index: number } // Stage/Rubric (legacy)
  | { selectedIndex: number } // Rubric
  | { selected_indices: number[] } // MultiSelect (legacy)
  | { selectedIndices: number[] } // MultiSelect
  | { stage: string; score?: number } // Stage
  | number // Simple numeric value

export interface Evidence {
  type: 'file' | 'url';
  value: string;
  memo?: string;
}

// Assessment Run
export interface AssessmentRun {
  id: string;
  organizationId: string;
  sector: Sector;
  stage: Stage;
  status: 'draft' | 'submitted' | 'scored' | 'archived';
  scoringVersion: string;
  createdAt: string;
  submittedAt?: string;
}

// 점수
export interface AxisScore {
  axis: AxisKey;
  score: number;
  delta?: number;
  kpi_top?: KPIContribution[];
  flags?: Flag[];
}

export interface KPIContribution {
  kpi_id: string;
  name: string;
  contrib: number;
}

export interface Flag {
  type: 'rule' | 'warning' | 'success';
  message: string;
}

// 레이더 차트 데이터
export interface RadarData {
  run_id: string;
  cluster: {
    sector: Sector;
    stage: Stage;
  };
  axis_scores: AxisScore[];
  overlays?: {
    prev?: Record<AxisKey, number>;
    peer_avg?: Record<AxisKey, number>;
    target?: Record<AxisKey, number>;
  };
}

// 프로그램
export interface Program {
  id: string;
  name: string;
  provider: string;
  type: 'government' | 'investment' | 'internal';
  deadline?: string;
  eligibility: MatchRule[];
  status: 'active' | 'closed';
}

export interface MatchRule {
  type: 'sector' | 'stage' | 'axis_score' | 'kpi_value';
  condition: any;
}

export interface MatchResult {
  program_id: string;
  match_score: number;
  reasons: string[];
}

// Choice interface for multi-select inputs
export interface Choice {
  label: string;
  value: number;
  score: number;
}