/**
 * @fileoverview Timeline V2 타입 정의
 * @description 브랜치 타임라인을 위한 새로운 타입 시스템
 * @author PocketCompany
 * @since 2025-01-20
 */

import type { ProjectPhase } from '../utils/projectPhaseUtils';

/**
 * 타임라인 노드 - 메인라인 마일스톤 또는 브랜치 활동
 */
export interface TimelineNode {
  id: string;
  type: 'milestone' | 'activity';
  phase: ProjectPhase;
  timestamp: Date;
  position: 'main' | 'branch';
  indentLevel: number; // 0=메인라인, 1,2,3=브랜치 깊이

  // 노드 데이터
  title: string;
  description?: string;

  // 활동 타입별 정보
  activityType?: 'file' | 'meeting' | 'comment' | 'todo';
  status?: 'completed' | 'active' | 'pending';
  priority?: 'high' | 'medium' | 'low';
  author?: {
    id: string;
    name: string;
  };

  // 메타데이터
  metadata?: Record<string, any>;
}

/**
 * 단계별 진행 정보
 */
export interface PhaseItem {
  phase: ProjectPhase;
  status: 'completed' | 'current' | 'upcoming';
  title: string;
  description: string;
  activityCount: number;
  estimatedDays?: number;
}

/**
 * 브랜치 라인 연결 정보
 */
export interface BranchConnection {
  fromPhase: ProjectPhase;
  toNodeId: string;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  color?: string;
}

/**
 * 타임라인 전체 데이터 구조
 */
export interface TimelineData {
  phases: PhaseItem[];
  nodes: TimelineNode[];
  connections: BranchConnection[];
  currentPhase: ProjectPhase;
  projectStartDate: Date;
  projectEndDate?: Date;
}