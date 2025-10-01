/**
 * @fileoverview 브랜치 위치 및 스타일 설정
 * @description 피드 타입별 브랜치 길이, 색상, 애니메이션 등 시각적 설정
 * @author PocketCompany
 * @since 2025-01-20
 */

import type { FeedType } from '../types/timeline.types';
import type { BranchStyle, BranchLayoutConfig } from '../types/branch-timeline.types';

/**
 * 피드 타입별 브랜치 스타일 설정
 * 각 피드 타입은 고유한 X 위치와 시각적 스타일을 가짐
 */
export const BRANCH_CONFIGURATIONS: Record<FeedType, BranchStyle> = {
  file: {
    offsetX: 450, // 왼쪽 패널(300) + 150
    color: '#3B82F6', // Blue-500 - 신뢰성, 안정성
    secondaryColor: '#DBEAFE', // Blue-100
    strokeWidth: 2,
    branchType: 'straight',
    iconSize: 'small',
    priority: 3,
    animation: {
      enableDrawAnimation: true,
      duration: 800,
      easing: 'ease-out'
    }
  },

  meeting: {
    offsetX: 550, // 왼쪽 패널(300) + 250
    color: '#10B981', // Emerald-500 - 성장, 진행
    secondaryColor: '#D1FAE5', // Emerald-100
    strokeWidth: 3,
    branchType: 'curved',
    iconSize: 'large',
    priority: 1, // 최고 우선순위 - 미팅이 가장 중요
    animation: {
      enableDrawAnimation: true,
      duration: 1200,
      easing: 'ease-in-out'
    }
  },

  comment: {
    offsetX: 400, // 왼쪽 패널(300) + 100
    color: '#8B5CF6', // Violet-500 - 창의성, 소통
    secondaryColor: '#EDE9FE', // Violet-100
    strokeWidth: 1.5,
    branchType: 'straight',
    iconSize: 'small',
    priority: 4,
    animation: {
      enableDrawAnimation: true,
      duration: 600,
      easing: 'ease-in'
    }
  },

  todo: {
    offsetX: 500, // 왼쪽 패널(300) + 200
    color: '#F59E0B', // Amber-500 - 주의, 액션
    secondaryColor: '#FEF3C7', // Amber-100
    strokeWidth: 2,
    branchType: 'stepped',
    iconSize: 'medium',
    priority: 2,
    animation: {
      enableDrawAnimation: true,
      duration: 1000,
      easing: 'ease-out'
    }
  },

  progress: {
    offsetX: 600, // 왼쪽 패널(300) + 300
    color: '#EF4444', // Red-500 - 긴급, 중요
    secondaryColor: '#FEE2E2', // Red-100
    strokeWidth: 4,
    branchType: 'curved',
    iconSize: 'large',
    priority: 1, // 진행률 업데이트는 매우 중요
    animation: {
      enableDrawAnimation: true,
      duration: 1500,
      easing: 'ease-in-out'
    }
  },

  team: {
    offsetX: 425, // 왼쪽 패널(300) + 125
    color: '#6366F1', // Indigo-500 - 팀워크, 협업
    secondaryColor: '#E0E7FF', // Indigo-100
    strokeWidth: 2,
    branchType: 'curved',
    iconSize: 'medium',
    priority: 3,
    animation: {
      enableDrawAnimation: true,
      duration: 900,
      easing: 'ease-out'
    }
  }
};

/**
 * 브랜치 레이아웃 전체 설정
 */
export const BRANCH_LAYOUT_CONFIG: BranchLayoutConfig = {
  // 간격 설정
  minBranchSpacing: 45, // 브랜치 간 최소 Y 간격 (겹치지 않게)
  maxBranchSpacing: 120, // 브랜치 간 최대 Y 간격 (너무 멀지 않게)

  // 노드 크기 설정
  nodeWidth: 220, // 기본 노드 박스 너비
  nodeHeight: 44, // 기본 노드 박스 높이
  expandedNodeMaxWidth: 400, // 확장 시 최대 너비

  // 전체 레이아웃 설정
  timelineWidth: 800, // 전체 브랜치 영역 너비 (왼쪽 패널 300 + 노드 영역 500)
  stageMinHeight: 180, // 각 단계별 최소 높이

  // 충돌 감지 설정
  overlapThreshold: 25, // 겹침 감지 임계값 (픽셀)

  // 툴팁 설정
  tooltipOffset: { x: 15, y: -10 } // 툴팁 위치 오프셋
};

/**
 * 브랜치 타입별 SVG 패스 생성 함수
 */
export const BRANCH_PATH_GENERATORS = {
  straight: (startX: number, startY: number, endX: number, endY: number): string => {
    return `M ${startX} ${startY} L ${endX} ${endY}`;
  },

  curved: (startX: number, startY: number, endX: number, endY: number): string => {
    const controlX = startX + (endX - startX) * 0.6;
    const controlY = startY;
    return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
  },

  stepped: (startX: number, startY: number, endX: number, endY: number): string => {
    const midX = startX + (endX - startX) * 0.7;
    return `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
  }
};

/**
 * 피드 타입별 우선순위 매트릭스
 * 충돌 시 어떤 피드가 우선권을 가질지 결정
 */
export const COLLISION_PRIORITY_MATRIX: Record<FeedType, Record<FeedType, 'win' | 'lose' | 'negotiate'>> = {
  file: {
    file: 'negotiate',
    meeting: 'lose',
    comment: 'win',
    todo: 'negotiate',
    progress: 'lose',
    team: 'negotiate'
  },
  meeting: {
    file: 'win',
    meeting: 'negotiate',
    comment: 'win',
    todo: 'win',
    progress: 'negotiate',
    team: 'win'
  },
  comment: {
    file: 'lose',
    meeting: 'lose',
    comment: 'negotiate',
    todo: 'lose',
    progress: 'lose',
    team: 'lose'
  },
  todo: {
    file: 'negotiate',
    meeting: 'lose',
    comment: 'win',
    todo: 'negotiate',
    progress: 'lose',
    team: 'negotiate'
  },
  progress: {
    file: 'win',
    meeting: 'negotiate',
    comment: 'win',
    todo: 'win',
    progress: 'negotiate',
    team: 'win'
  },
  team: {
    file: 'negotiate',
    meeting: 'lose',
    comment: 'win',
    todo: 'negotiate',
    progress: 'lose',
    team: 'negotiate'
  }
};

/**
 * 시간대별 밀도 조정 설정
 * 특정 시간대에 피드가 집중될 때 자동 조정
 */
export const DENSITY_ADJUSTMENT_SETTINGS = {
  // 밀도 임계값
  thresholds: {
    sparse: 2, // 2개 이하면 sparse
    normal: 5, // 5개 이하면 normal
    dense: 8, // 8개 이하면 dense
    // 8개 초과면 overcrowded
  },

  // 밀도별 조정 방법
  adjustments: {
    sparse: {
      branchSpacing: 1.0, // 기본 간격
      nodeSize: 1.0, // 기본 크기
      animationDelay: 50 // 기본 지연
    },
    normal: {
      branchSpacing: 0.9, // 90% 간격
      nodeSize: 0.95, // 95% 크기
      animationDelay: 40
    },
    dense: {
      branchSpacing: 0.8, // 80% 간격
      nodeSize: 0.9, // 90% 크기
      animationDelay: 30
    },
    overcrowded: {
      branchSpacing: 0.7, // 70% 간격
      nodeSize: 0.85, // 85% 크기
      animationDelay: 20
    }
  }
};

/**
 * 반응형 브랜치 설정
 * 화면 크기에 따른 브랜치 위치 조정
 */
export const RESPONSIVE_BRANCH_CONFIG = {
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1440
  },

  adjustments: {
    mobile: {
      offsetXMultiplier: 0.6, // 60%로 축소
      nodeWidthMultiplier: 0.8,
      fontSizeMultiplier: 0.9
    },
    tablet: {
      offsetXMultiplier: 0.8, // 80%로 축소
      nodeWidthMultiplier: 0.9,
      fontSizeMultiplier: 0.95
    },
    desktop: {
      offsetXMultiplier: 1.0, // 기본 크기
      nodeWidthMultiplier: 1.0,
      fontSizeMultiplier: 1.0
    }
  }
};

/**
 * 접근성 설정
 */
export const ACCESSIBILITY_CONFIG = {
  // 색상 대비 설정
  highContrast: {
    enabled: false,
    colorMultiplier: 1.3 // 색상 강도 30% 증가
  },

  // 애니메이션 설정
  reducedMotion: {
    enabled: false,
    fallbackDuration: 200 // 줄어든 애니메이션 시간
  },

  // 키보드 네비게이션
  keyboard: {
    enabled: true,
    focusRingColor: '#2563EB', // Blue-600
    focusRingWidth: 2
  }
};

/**
 * 디버그 모드 설정
 */
export const DEBUG_CONFIG = {
  enabled: process.env.NODE_ENV === 'development',
  showCollisionBoxes: true,
  showGridLines: true,
  showPerformanceMetrics: true,
  logPositionCalculations: true
};