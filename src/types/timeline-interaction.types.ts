/**
 * @fileoverview Timeline V3 인터랙션 타입
 * @description Phase 2-4 인터랙션 시스템
 */

import type { BranchActivity } from './timeline-v3.types';

// =============================================================================
// Phase 2: Hover 시스템
// =============================================================================

/**
 * 인터랙션 상태
 * Phase 2: Hover만 구현
 * Phase 3: Click 상태 추가
 * Phase 4: Drag 상태 추가
 */
export interface InteractionState {
  // Phase 2
  hoveredActivity: BranchActivity | null;
  hoveredBranchId: string | null;

  // Phase 3 (준비됨)
  selectedActivity?: BranchActivity | null;
  modalOpen?: boolean;

  // Phase 4 (준비됨)
  isDragging?: boolean;
  dragTarget?: BranchActivity | null;
}

/**
 * 이벤트 핸들러 인터페이스
 * Phase 2-4 확장 가능 구조
 */
export interface TimelineEventHandlers {
  // Phase 2: Hover
  onActivityHover?: (activity: BranchActivity | null) => void;
  onBranchHover?: (branchId: string | null) => void;

  // Phase 3: Click (준비됨)
  onActivityClick?: (activity: BranchActivity) => void;

  // Phase 4: Drag (준비됨)
  onActivityDragStart?: (activity: BranchActivity, event: MouseEvent) => void;
  onActivityDragEnd?: (activity: BranchActivity, position: { x: number; y: number }) => void;
}

/**
 * 툴팁 위치 정보
 */
export interface TooltipPosition {
  x: number;
  y: number;
  preferredSide: 'left' | 'right' | 'top' | 'bottom';
}

/**
 * 애니메이션 단계
 */
export type AnimationStage =
  | 0  // 초기 상태
  | 1  // 메인 타임라인 표시
  | 2  // 단계 노드 표시
  | 3  // 브랜치 경로 드로잉
  | 4; // 활동 노드 등장