import type { SectorType, StageType, AxisKey } from '../types';

// 데이터 품질 지표
export interface DataQualityMetrics {
  totalStartups: number;
  totalEvaluations: number;
  averageCompletionRate: number;
  lastUpdated: Date;
}

// KPI 입력률 통계
export interface KPICompletionStats {
  kpiId: string;
  kpiName: string;
  axis: AxisKey;
  totalRequired: number;
  totalCompleted: number;
  completionRate: number;
  missingCount: number;
}

// 섹터별 통계
export interface SectorStats {
  sector: SectorType;
  startupCount: number;
  evaluationCount: number;
  averageScore: number;
  averageCompletionRate: number;
  topPerformers: number;
  lowPerformers: number;
}

// 단계별 통계
export interface StageStats {
  stage: StageType;
  startupCount: number;
  evaluationCount: number;
  averageScore: number;
  averageCompletionRate: number;
  progressionRate: number; // 다음 단계로 진행한 비율
}

// 데이터 이상치
export interface DataAnomaly {
  id: string;
  type: 'outlier' | 'inconsistent' | 'duplicate' | 'invalid';
  severity: 'low' | 'medium' | 'high' | 'critical';
  entityType: 'startup' | 'evaluation' | 'kpi';
  entityId: string;
  field: string;
  currentValue: any;
  expectedRange?: { min: number; max: number };
  description: string;
  detectedAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

// 데이터 검증 규칙
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  type: 'range' | 'format' | 'consistency' | 'required' | 'unique';
  field: string;
  condition: string;
  isActive: boolean;
  severity: 'warning' | 'error';
  autoFix: boolean;
}

// 데이터 정합성 체크 결과
export interface ConsistencyCheckResult {
  checkId: string;
  checkName: string;
  status: 'passed' | 'failed' | 'warning';
  checkedAt: Date;
  totalChecked: number;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  details: {
    entityId: string;
    issue: string;
    suggestion?: string;
  }[];
}

// 데이터 품질 리포트
export interface DataQualityReport {
  id: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  metrics: DataQualityMetrics;
  kpiCompletionStats: KPICompletionStats[];
  sectorStats: SectorStats[];
  stageStats: StageStats[];
  anomalies: DataAnomaly[];
  consistencyChecks: ConsistencyCheckResult[];
  recommendations: string[];
  overallScore: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
}