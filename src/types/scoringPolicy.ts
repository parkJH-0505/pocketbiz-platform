import type { AxisKey, StageType, SectorType } from '../types';

// 정규화 방식
export type NormalizationType = 'linear' | 'logarithmic' | 'exponential' | 'custom';

// 등급 구간 정의
export interface GradeRange {
  grade: string; // S, A, B, C, D, F
  minScore: number;
  maxScore: number;
  color: string;
  label: string;
  description?: string;
}

// 정규화 파라미터
export interface NormalizationParams {
  type: NormalizationType;
  // Linear 정규화
  linearMin?: number;
  linearMax?: number;
  // Logarithmic 정규화
  logBase?: number;
  // Exponential 정규화
  expPower?: number;
  // Custom 정규화 함수
  customFormula?: string;
}

// 이상치 처리 규칙
export interface OutlierRule {
  field: string;
  method: 'iqr' | 'zscore' | 'percentile' | 'fixed';
  threshold?: number;
  action: 'remove' | 'cap' | 'flag';
  replacementValue?: number;
}

// 벤치마크 데이터
export interface BenchmarkData {
  id: string;
  name: string;
  sector: SectorType;
  stage: StageType;
  axis: AxisKey;
  value: number;
  percentile: number;
  updatedAt: Date;
}

// 스코어링 정책 설정
export interface ScoringPolicyConfig {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // 정규화 설정
  normalization: {
    global: NormalizationParams;
    byAxis?: Record<AxisKey, NormalizationParams>;
    byStage?: Record<StageType, NormalizationParams>;
  };
  
  // 등급 구간 설정
  gradeRanges: GradeRange[];
  
  // 이상치 처리
  outlierRules: OutlierRule[];
  
  // 점수 범위
  scoreRange: {
    min: number;
    max: number;
    precision: number; // 소수점 자리수
  };
  
  // 벤치마크 사용 여부
  useBenchmark: boolean;
  benchmarkDataId?: string;
  
  // 특별 규칙
  specialRules?: {
    // 최소 점수 보장
    minimumScore?: number;
    // 최대 점수 제한
    maximumScore?: number;
    // 0점 처리 (일부 KPI가 0일 때)
    zeroHandling: 'exclude' | 'penalize' | 'default';
    // 누락 데이터 처리
    missingDataHandling: 'exclude' | 'average' | 'default' | 'zero';
  };
}

// 점수 계산 결과
export interface ScoreCalculationResult {
  rawScore: number;
  normalizedScore: number;
  grade: string;
  percentile?: number;
  outliers?: string[];
  warnings?: string[];
}