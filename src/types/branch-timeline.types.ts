/**
 * @fileoverview 브랜치 타임라인 시스템 전용 타입 정의
 * @description 시간 기반 브랜치 배치와 인터랙티브 노드를 위한 고급 타입 시스템
 * @author PocketCompany
 * @since 2025-01-20
 */

import type { ProjectPhase } from './buildup.types';
import type { FeedType, FeedItem } from './timeline.types';

/**
 * 브랜치 노드의 2D 공간 위치 정보
 */
export interface BranchPosition {
  /** X 좌표 (브랜치 길이) */
  x: number;
  /** Y 좌표 (시간 기반 위치) */
  y: number;
  /** 피드 타입 (위치 계산에 사용) */
  feedType: FeedType;
  /** 실제 발생 시간 */
  timestamp: Date;
  /** 해당하는 프로젝트 단계 */
  stageId: ProjectPhase;
  /** 충돌 해결 후 조정된 위치인지 여부 */
  isAdjusted: boolean;
  /** 원본 계산된 위치 (조정 전) */
  originalPosition?: { x: number; y: number };
}

/**
 * 노드의 시각적 상태 관리
 */
export interface NodeVisualState {
  /** 호버 상태 */
  isHovered: boolean;
  /** 확장 상태 (상세 정보 표시) */
  isExpanded: boolean;
  /** 선택 상태 (우측 패널 연동) */
  isSelected: boolean;
  /** 애니메이션 지연 시간 (ms) */
  animationDelay: number;
  /** 노드가 화면에 표시되는지 여부 */
  isVisible: boolean;
  /** 마지막 상호작용 시간 */
  lastInteraction?: Date;
}

/**
 * 위치 정보가 포함된 피드 아이템
 */
export interface FeedItemWithPosition extends FeedItem {
  /** 계산된 브랜치 위치 */
  branchPosition: BranchPosition;
  /** 시각적 상태 */
  visualState: NodeVisualState;
  /** 렌더링 성능을 위한 메타데이터 */
  renderingMeta: {
    /** 마지막 렌더링 시간 */
    lastRendered?: Date;
    /** 뷰포트 내 위치 여부 */
    inViewport: boolean;
    /** 레이어 깊이 (z-index 계산용) */
    layer: number;
  };
}

/**
 * 프로젝트 단계의 공간적 위치 정보
 */
export interface StagePosition {
  /** 단계 시작 Y 좌표 */
  startY: number;
  /** 단계 종료 Y 좌표 */
  endY: number;
  /** 단계 중앙 Y 좌표 */
  centerY: number;
  /** 단계 높이 */
  height: number;
  /** 단계 시작 시간 */
  startDate: Date;
  /** 단계 종료 시간 */
  endDate: Date;
  /** 해당 단계의 피드 개수 */
  feedCount: number;
  /** 시각적 밀도 (피드 밀집도) */
  density: 'sparse' | 'normal' | 'dense' | 'overcrowded';
}

/**
 * 브랜치 스타일 설정
 */
export interface BranchStyle {
  /** 브랜치 X 오프셋 (길이) */
  offsetX: number;
  /** 주 색상 */
  color: string;
  /** 보조 색상 (배경, 테두리 등) */
  secondaryColor: string;
  /** 연결선 두께 */
  strokeWidth: number;
  /** 브랜치 연결 방식 */
  branchType: 'straight' | 'curved' | 'stepped';
  /** 노드 아이콘 크기 */
  iconSize: 'small' | 'medium' | 'large';
  /** 겹침 시 우선순위 (낮을수록 높은 우선순위) */
  priority: number;
  /** 애니메이션 설정 */
  animation: {
    /** 연결선 그리기 애니메이션 활성화 */
    enableDrawAnimation: boolean;
    /** 애니메이션 지속 시간 (ms) */
    duration: number;
    /** 이징 함수 */
    easing: 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  };
}

/**
 * 타임라인 전체 메트릭스
 */
export interface TimelineMetrics {
  /** 전체 타임라인 높이 */
  totalHeight: number;
  /** 뷰포트 높이 */
  viewportHeight: number;
  /** 현재 스크롤 위치 */
  scrollPosition: number;
  /** 화면에 보이는 단계들 */
  visibleStages: ProjectPhase[];
  /** 전체 밀도 레벨 */
  densityLevel: 'sparse' | 'normal' | 'dense';
  /** 성능 통계 */
  performance: {
    /** 렌더링된 노드 수 */
    renderedNodes: number;
    /** 총 노드 수 */
    totalNodes: number;
    /** 마지막 렌더링 시간 (ms) */
    lastRenderTime: number;
    /** 평균 FPS */
    averageFps: number;
  };
}

/**
 * 브랜치 레이아웃 설정
 */
export interface BranchLayoutConfig {
  /** 브랜치 간 최소 Y 간격 */
  minBranchSpacing: number;
  /** 브랜치 간 최대 Y 간격 */
  maxBranchSpacing: number;
  /** 노드 박스 기본 너비 */
  nodeWidth: number;
  /** 노드 박스 기본 높이 */
  nodeHeight: number;
  /** 전체 타임라인 너비 */
  timelineWidth: number;
  /** 단계별 최소 높이 */
  stageMinHeight: number;
  /** 겹침 감지 임계값 */
  overlapThreshold: number;
  /** 확장된 노드 최대 너비 */
  expandedNodeMaxWidth: number;
  /** 툴팁 오프셋 */
  tooltipOffset: { x: number; y: number };
}

/**
 * 충돌 감지 결과
 */
export interface CollisionDetectionResult {
  /** 충돌이 발생했는지 여부 */
  hasCollision: boolean;
  /** 충돌한 다른 노드들의 ID */
  collidingNodes: string[];
  /** 권장 조정 방향 */
  recommendedAdjustment: {
    direction: 'up' | 'down' | 'left' | 'right';
    distance: number;
  };
  /** 충돌 심각도 (0-1) */
  severity: number;
}

/**
 * 브랜치 연결선 정보
 */
export interface BranchConnector {
  /** 고유 ID */
  id: string;
  /** 시작점 좌표 */
  startPoint: { x: number; y: number };
  /** 끝점 좌표 */
  endPoint: { x: number; y: number };
  /** 연결선 스타일 */
  style: BranchStyle;
  /** 애니메이션 상태 */
  animationState: 'idle' | 'drawing' | 'pulsing' | 'fading';
  /** SVG 패스 데이터 */
  pathData: string;
  /** 연결된 피드 ID */
  feedId: string;
}

/**
 * 인터랙션 이벤트 타입
 */
export interface BranchInteractionEvent {
  /** 이벤트 타입 */
  type: 'hover' | 'click' | 'expand' | 'collapse' | 'select' | 'deselect';
  /** 대상 피드 ID */
  feedId: string;
  /** 이벤트 발생 시간 */
  timestamp: Date;
  /** 마우스 위치 (해당하는 경우) */
  mousePosition?: { x: number; y: number };
  /** 추가 데이터 */
  data?: Record<string, any>;
}

/**
 * 타임라인 필터링 옵션
 */
export interface TimelineFilter {
  /** 피드 타입 필터 */
  feedTypes: FeedType[];
  /** 날짜 범위 필터 */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** 단계 필터 */
  stages: ProjectPhase[];
  /** 텍스트 검색 */
  searchQuery?: string;
  /** 우선순위 필터 */
  priorities: Array<'high' | 'medium' | 'low'>;
  /** 사용자 필터 */
  authors: string[];
  /** 상태 필터 */
  statuses: Array<'active' | 'completed' | 'pending' | 'cancelled'>;
}

/**
 * 가상 스크롤링 설정
 */
export interface VirtualScrollConfig {
  /** 가상 스크롤링 활성화 여부 */
  enabled: boolean;
  /** 아이템 평균 높이 */
  itemHeight: number;
  /** 오버스캔 아이템 수 */
  overscan: number;
  /** 스크롤 디바운스 시간 (ms) */
  scrollDebounce: number;
  /** 렌더링 청크 크기 */
  chunkSize: number;
}

/**
 * 성능 모니터링 메트릭스
 */
export interface PerformanceMetrics {
  /** 렌더링 시간 통계 */
  renderingStats: {
    average: number;
    min: number;
    max: number;
    samples: number[];
  };
  /** 메모리 사용량 */
  memoryUsage: {
    /** 노드 인스턴스 수 */
    nodeInstances: number;
    /** 이벤트 리스너 수 */
    eventListeners: number;
    /** 캐시된 계산 결과 수 */
    cachedCalculations: number;
  };
  /** 인터랙션 반응성 */
  interactionMetrics: {
    /** 평균 응답 시간 (ms) */
    averageResponseTime: number;
    /** 지연된 응답 횟수 */
    delayedResponses: number;
    /** 총 인터랙션 수 */
    totalInteractions: number;
  };
}

/**
 * 브랜치 타임라인 전체 상태
 */
export interface BranchTimelineState {
  /** UI 상태 (자주 변경) */
  ui: {
    hoveredFeedId: string | null;
    expandedFeedIds: Set<string>;
    selectedFeedId: string | null;
    scrollPosition: number;
    filter: TimelineFilter;
    viewMode: 'normal' | 'compact' | 'detailed';
  };

  /** 계산된 결과 (캐시됨) */
  computed: {
    feedsWithPositions: FeedItemWithPosition[];
    visibleFeeds: FeedItemWithPosition[];
    stagePositions: Record<ProjectPhase, StagePosition>;
    branchConnectors: BranchConnector[];
    timelineMetrics: TimelineMetrics;
  };

  /** 설정 및 상수 */
  config: {
    layoutConfig: BranchLayoutConfig;
    virtualScrollConfig: VirtualScrollConfig;
    branchStyles: Record<FeedType, BranchStyle>;
  };

  /** 성능 데이터 */
  performance: PerformanceMetrics;
}

/**
 * 레이아웃 엔진 결과
 */
export interface LayoutEngineResult {
  /** 위치가 계산된 피드들 */
  positionedFeeds: FeedItemWithPosition[];
  /** 브랜치 연결선들 */
  connectors: BranchConnector[];
  /** 충돌 해결 보고서 */
  collisionReport: {
    totalCollisions: number;
    resolvedCollisions: number;
    unresolvableCollisions: CollisionDetectionResult[];
  };
  /** 레이아웃 메트릭스 */
  metrics: {
    calculationTime: number;
    totalNodes: number;
    adjustedNodes: number;
  };
}

/**
 * 타임라인 이벤트 콜백 함수 타입들
 */
export interface TimelineEventCallbacks {
  onFeedHover: (feedId: string | null) => void;
  onFeedClick: (feedId: string) => void;
  onFeedExpand: (feedId: string) => void;
  onFeedCollapse: (feedId: string) => void;
  onFeedSelect: (feedId: string) => void;
  onStageClick: (stageId: ProjectPhase) => void;
  onFilterChange: (filter: TimelineFilter) => void;
  onScrollPositionChange: (position: number) => void;
  onPerformanceAlert: (metrics: PerformanceMetrics) => void;
}