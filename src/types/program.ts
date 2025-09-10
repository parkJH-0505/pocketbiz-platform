import type { SectorType, StageType, AxisKey } from '../types';

// 프로그램 타입
export type ProgramType = 'investment' | 'accelerator' | 'government' | 'corporate' | 'other';

// 프로그램 상태
export type ProgramStatus = 'draft' | 'open' | 'closed' | 'suspended';

// 자격 요건
export interface EligibilityCriteria {
  // 최소 점수 요건
  minimumTotalScore?: number;
  minimumAxisScores?: Partial<Record<AxisKey, number>>;
  
  // 섹터/단계 제한
  allowedSectors?: SectorType[];
  allowedStages?: StageType[];
  
  // 필수 KPI
  requiredKPIs?: string[];
  
  // 특별 조건
  specialConditions?: {
    condition: string;
    description: string;
  }[];
}

// 프로그램 혜택
export interface ProgramBenefit {
  id: string;
  type: 'funding' | 'mentoring' | 'office' | 'network' | 'other';
  title: string;
  description: string;
  value?: string; // 예: "최대 1억원", "6개월"
}

// 매칭 규칙
export interface MatchingRule {
  id: string;
  name: string;
  priority: number; // 우선순위 (낮을수록 높음)
  condition: string; // 조건 표현식
  weight: number; // 매칭 점수 가중치
  autoMatch: boolean; // 자동 매칭 여부
}

// 지원 프로세스 단계
export interface ApplicationStage {
  id: string;
  name: string;
  order: number;
  description?: string;
  durationDays?: number;
  requiredDocuments?: string[];
}

// 프로그램 정의
export interface Program {
  id: string;
  name: string;
  description: string;
  type: ProgramType;
  status: ProgramStatus;
  
  // 운영 기관
  organizationId: string;
  organizationName: string;
  
  // 모집 기간
  applicationStartDate: Date;
  applicationEndDate: Date;
  programStartDate?: Date;
  programEndDate?: Date;
  
  // 모집 규모
  targetCount?: number;
  currentApplications?: number;
  selectedCount?: number;
  
  // 자격 요건
  eligibility: EligibilityCriteria;
  
  // 혜택
  benefits: ProgramBenefit[];
  
  // 매칭 규칙
  matchingRules?: MatchingRule[];
  
  // 지원 프로세스
  applicationStages?: ApplicationStage[];
  
  // 메타 정보
  tags?: string[];
  logoUrl?: string;
  websiteUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// 프로그램 지원 현황
export interface ApplicationStatus {
  programId: string;
  startupId: string;
  status: 'pending' | 'reviewing' | 'interview' | 'accepted' | 'rejected' | 'withdrawn';
  currentStage?: string;
  appliedAt: Date;
  lastUpdatedAt: Date;
  matchingScore?: number;
  notes?: string;
}