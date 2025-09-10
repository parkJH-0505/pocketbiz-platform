import type { AxisKey, StageType, SectorType } from '../types';

// 축별 가중치 설정
export interface AxisWeight {
  axis: AxisKey;
  weight: number; // 0-100 백분율
  description?: string;
}

// 단계별 가중치 정책
export interface StageWeightPolicy {
  stage: StageType;
  axisWeights: AxisWeight[];
  totalWeight: number; // 합계 (100이어야 함)
}

// 섹터별 특수 가중치
export interface SectorSpecialWeight {
  sector: SectorType;
  axis: AxisKey;
  multiplier: number; // 1.0 = 100% (기본), 1.5 = 150% 등
  reason?: string;
}

// 가중치 정책 설정
export interface WeightPolicyConfig {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // 기본 축별 가중치 (모든 단계에 적용)
  defaultAxisWeights: AxisWeight[];
  
  // 단계별 커스텀 가중치 (옵션)
  stageWeights?: StageWeightPolicy[];
  
  // 섹터별 특수 가중치 (옵션)
  sectorSpecialWeights?: SectorSpecialWeight[];
  
  // KPI 레벨 가중치 (x1, x2, x3)의 실제 배수
  kpiLevelMultipliers: {
    x1: number; // 예: 1.0
    x2: number; // 예: 1.5
    x3: number; // 예: 2.0
  };
}

// 가중치 시뮬레이션 결과
export interface WeightSimulationResult {
  sector: SectorType;
  stage: StageType;
  axisScores: {
    axis: AxisKey;
    baseScore: number;
    weightedScore: number;
    weight: number;
    contribution: number; // 전체 점수에 대한 기여도 %
  }[];
  totalScore: number;
  grade: string;
}