/**
 * @fileoverview Timeline V3 타입 정의
 * @description Phase 1-4 전체에서 사용할 표준 타입 시스템
 * @author PocketCompany
 * @since 2025-01-29
 */

import type { Project } from './buildup.types';
import { theme } from '../lib/theme';

// ============================================================================
// 타임라인 Phase 타입
// ============================================================================

/**
 * 타임라인에 표시되는 프로젝트 단계
 * (convertProjectPhases에서 생성)
 */
export interface TimelinePhase {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isCompleted: boolean;
  isCurrent: boolean;
  order: number;
  color?: string;        // Phase 2: 배경색
  progress?: number;     // Phase 2: 진행률 (0-100)
}

// ============================================================================
// 브랜치 활동 타입 (핵심 데이터 구조)
// ============================================================================

/**
 * 타임라인에 표시되는 모든 활동의 표준 인터페이스
 * Phase 1에서 정의, Phase 2-4에서 사용
 */
export interface BranchActivity {
  // === 필수 필드 ===
  id: string;                                    // 고유 식별자
  type: 'file' | 'meeting' | 'comment' | 'todo'; // 활동 타입
  timestamp: Date;                               // 정확한 발생 시점
  title: string;                                 // 표시 제목

  // === 계산된 좌표 (Phase 1에서 추가) ===
  branchY: number;                               // 시간 비례 Y좌표
  branchX: number;                               // 겹침 방지 X좌표

  // === 시각화 속성 (Phase 2에서 사용) ===
  color: string;                                 // 타입별 색상 (#10B981, #3B82F6 등)
  icon: string;                                  // 타입별 아이콘 (📄📅💬✅)
  strokePattern: string;                         // 브랜치 선 패턴 ('none', '5,3' 등)

  // === 모달 데이터 (Phase 3에서 사용) ===
  metadata: ActivityMetadata;
}

/**
 * 활동 타입별 메타데이터
 */
export interface ActivityMetadata {
  file?: FileMetadata;
  meeting?: MeetingMetadata;
  comment?: CommentMetadata;
  todo?: TodoMetadata;
}

export interface FileMetadata {
  size: number;          // 파일 크기 (bytes)
  uploader: string;      // 업로더 이름
  format: string;        // 파일 형식 (pdf, docx 등)
  url: string;           // 파일 URL
}

export interface MeetingMetadata {
  participants: string[];  // 참석자 목록
  duration: number;        // 소요 시간 (분)
  location: string;        // 장소
  notes?: string;          // 회의록
}

export interface CommentMetadata {
  author: string;        // 작성자
  content: string;       // 댓글 내용
  relatedTo?: string;    // 관련 활동 ID
}

export interface TodoMetadata {
  assignee: string;                           // 담당자
  status: 'pending' | 'completed';            // 상태
  priority: 'low' | 'medium' | 'high';        // 우선순위
  completedAt?: Date;                         // 완료 시간
}

// ============================================================================
// 좌표 계산 함수 시그니처
// ============================================================================

/**
 * 타임스탬프를 Y좌표로 변환
 * @param timestamp 활동 발생 시간
 * @param projectStart 프로젝트 시작 시간
 * @param projectEnd 프로젝트 종료 시간
 * @param canvasHeight 타임라인 캔버스 높이
 * @returns Y좌표 (60 ~ canvasHeight-60)
 */
export type CalculateBranchY = (
  timestamp: Date,
  projectStart: Date,
  projectEnd: Date,
  canvasHeight: number
) => number;

/**
 * 겹침 방지 X좌표 계산
 * @param activities 전체 활동 목록
 * @param currentIndex 현재 활동 인덱스
 * @param currentY 현재 활동 Y좌표
 * @returns X좌표 (120px 기준, 3레인 분산)
 */
export type CalculateBranchX = (
  activities: BranchActivity[],
  currentIndex: number,
  currentY: number
) => number;

/**
 * 프로젝트 단계별 구간 높이 계산
 * @param phase 프로젝트 단계
 * @param activities 해당 단계의 활동들
 * @returns 구간 높이 (240px ~ 480px)
 */
export type CalculatePhaseHeight = (
  phase: Project['phases'][0],
  activities: BranchActivity[]
) => number;

// ============================================================================
// 컴포넌트 Props 타입
// ============================================================================

/**
 * OverviewTabV3 컴포넌트 Props
 */
export interface OverviewTabV3Props {
  // === 필수 Props ===
  project: Project;

  // === Phase 2-4를 위한 확장 Props (선택) ===
  onActivityClick?: (activity: BranchActivity) => void;  // Phase 3: 모달
  showAnimations?: boolean;                              // Phase 2: 애니메이션
  enableVirtualScroll?: boolean;                         // Phase 4: 최적화
  debugMode?: boolean;                                   // 디버그 패널 표시
}

// ============================================================================
// 타임라인 설정 및 상수
// ============================================================================

/**
 * 타임라인 레이아웃 상수
 */
export const TIMELINE_CONSTANTS = {
  // 메인 축 (Phase 박스 공간 확보)
  PHASE_BOX_WIDTH: 180,        // Phase 박스 너비 (px)
  MAIN_AXIS_LEFT: 200,         // 세로축 왼쪽 위치 (px) - Phase 박스 이후
  MAIN_AXIS_WIDTH: 2,          // 세로축 너비 (px)
  MAIN_AXIS_WIDTH_HOVER: 4,    // 호버 시 너비 (px)

  // 단계 노드 - Phase 5-3: 크기 증가 (더 중요하게 보이도록)
  PHASE_NODE_SIZE: 28,         // 단계 노드 크기 (px) - 16→28 (75% 증가)
  PHASE_BASE_HEIGHT: 240,      // 기본 구간 높이 (px)
  PHASE_MAX_HEIGHT: 480,       // 최대 구간 높이 (px)
  PHASE_ACTIVITY_THRESHOLD: 5, // 확장 시작 임계값
  PHASE_ACTIVITY_HEIGHT: 30,   // 활동당 추가 높이 (px)

  // 브랜치
  BRANCH_BASE_X: 400,          // 브랜치 시작 X좌표 (px) - Phase 박스 고려
  BRANCH_LANE_WIDTH: 100,      // 레인 너비 (px)
  BRANCH_LANE_COUNT: 3,        // 레인 개수
  BRANCH_ZIGZAG_OFFSET: 30,    // 지그재그 오프셋 (px)
  PROXIMITY_THRESHOLD: 60,     // 근접 판정 임계값 (px) - 겹침 방지

  // 활동 노드 - Phase 5-3: 크기 증가
  NODE_SIZE_DEFAULT: 20,       // 기본 노드 크기 (px) - 16→20
  NODE_SIZE_HOVER: 24,         // 호버 시 노드 크기 (px) - 20→24

  // 여백
  CANVAS_PADDING_TOP: 60,      // 상단 여백 (px)
  CANVAS_PADDING_BOTTOM: 60,   // 하단 여백 (px)
} as const;

/**
 * Phase별 색상 팔레트 (Phase 2)
 */
export const PHASE_COLORS = {
  1: { bg: '#EEF2FF', border: '#C7D2FE', text: '#4F46E5' }, // 인디고
  2: { bg: '#F0FDF4', border: '#BBF7D0', text: '#16A34A' }, // 그린
  3: { bg: '#FEF3C7', border: '#FDE68A', text: '#D97706' }, // 앰버
  4: { bg: '#FCE7F3', border: '#FBCFE8', text: '#DB2777' }, // 핑크
  5: { bg: '#DBEAFE', border: '#BFDBFE', text: '#2563EB' }, // 블루
  6: { bg: '#F3E8FF', border: '#E9D5FF', text: '#9333EA' }, // 바이올렛
  7: { bg: '#FEE2E2', border: '#FECACA', text: '#DC2626' }  // 레드
} as const;

/**
 * 활동 타입별 색상 및 아이콘 (Phase 3)
 */
export const ACTIVITY_COLORS = {
  file: {
    primary: '#3B82F6',    // 파랑
    light: '#DBEAFE',
    icon: '📄',
    size: 10               // 중간 크기
  },
  meeting: {
    primary: '#10B981',    // 초록
    light: '#D1FAE5',
    icon: '📅',
    size: 12               // 크게 (중요 이벤트)
  },
  comment: {
    primary: '#F59E0B',    // 노랑
    light: '#FEF3C7',
    icon: '💬',
    size: 8                // 작게
  },
  todo: {
    primary: '#8B5CF6',    // 보라
    light: '#EDE9FE',
    icon: '✅',
    size: 8                // 작게
  }
} as const;

/**
 * 타입별 브랜치 스타일
 */
export const BRANCH_STYLES = {
  file: {
    color: '#10B981',              // 녹색
    colorEnd: '#059669',           // 진한 녹색 (그라디언트 끝)
    icon: '📄',
    strokeWidth: 3,
    strokeDasharray: 'none',       // 실선
  },
  meeting: {
    color: '#3B82F6',              // 파란색
    colorEnd: '#2563EB',           // 진한 파란색
    icon: '📅',
    strokeWidth: 3,
    strokeDasharray: '8,4',        // 점선
  },
  comment: {
    color: '#8B5CF6',              // 보라색
    colorEnd: '#7C3AED',           // 진한 보라색
    icon: '💬',
    strokeWidth: 3,
    strokeDasharray: '5,3',        // 짧은 점선
  },
  todo: {
    color: '#F97316',              // 오렌지색
    colorEnd: '#EA580C',           // 진한 오렌지색
    icon: '✅',
    strokeWidth: 3,
    strokeDasharray: 'none',
  },
} as const;

// ============================================================================
// Phase 6: 통합 디자인 시스템 (theme.ts 기반)
// ============================================================================

/**
 * 타임라인 디자인 시스템 V2
 * - 기존 PHASE_COLORS, ACTIVITY_COLORS, BRANCH_STYLES를 대체
 * - Visible.vc 테마(theme.ts)를 기반으로 일관성 확보
 * - Phase 6-7에서 사용
 */
export const TIMELINE_DESIGN_SYSTEM = {
  // ========================================
  // Phase 상태별 색상
  // ========================================
  phaseStatus: {
    completed: theme.colors.axis.EC.main,     // rgb(76, 206, 148) - 초록 (완료)
    current: theme.colors.primary.main,        // rgb(15, 82, 222) - 파랑 (진행중)
    upcoming: theme.colors.neutral.lighter     // rgb(161, 161, 170) - 회색 (예정)
  },

  // ========================================
  // Activity 타입별 색상 (Primary 파랑 계열 통일)
  // ========================================
  activityType: {
    meeting: {
      main: theme.colors.primary.main,         // rgb(15, 82, 222) - 파랑 (가장 진함)
      light: theme.colors.primary.light,       // rgba(15, 82, 222, 0.1)
      icon: '📅',
      size: 12,                                // 가장 큼 (중요 이벤트)
      importance: 'high' as const,
      strokeOpacity: 0.9,
      strokeWidth: 4
    },
    file: {
      main: 'rgba(15, 82, 222, 0.85)',         // Primary 85% 투명도
      light: theme.colors.primary.light,       // rgba(15, 82, 222, 0.1)
      icon: '📄',
      size: 10,                                // 중간
      importance: 'medium' as const,
      strokeOpacity: 0.7,
      strokeWidth: 3
    },
    comment: {
      main: 'rgba(15, 82, 222, 0.6)',          // Primary 60% 투명도
      light: theme.colors.primary.light,       // rgba(15, 82, 222, 0.1)
      icon: '💬',
      size: 8,                                 // 작음
      importance: 'low' as const,
      strokeOpacity: 0.5,
      strokeWidth: 2
    },
    todo: {
      main: 'rgba(15, 82, 222, 0.75)',         // Primary 75% 투명도
      light: theme.colors.primary.light,       // rgba(15, 82, 222, 0.1)
      icon: '✅',
      size: 9,                                 // 중간-작음
      importance: 'medium' as const,
      strokeOpacity: 0.6,
      strokeWidth: 2.5
    }
  },

  // ========================================
  // Phase 배경색 (Glassmorphism - 통일)
  // ========================================
  phaseBackground: {
    planning: {                                // Phase 1-3: 계획
      bg: 'rgba(15, 82, 222, 0.03)',           // 매우 연한 파랑
      border: 'rgba(15, 82, 222, 0.15)',       // 섬세한 테두리
      opacity: 0.08,
      blur: '10px'                             // Glassmorphism
    },
    execution: {                               // Phase 4-5: 실행
      bg: 'rgba(15, 82, 222, 0.05)',           // 조금 더 진한 파랑
      border: 'rgba(15, 82, 222, 0.2)',
      opacity: 0.1,
      blur: '10px'
    },
    completion: {                              // Phase 6-7: 완료
      bg: 'rgba(15, 82, 222, 0.02)',           // 가장 연함
      border: 'rgba(15, 82, 222, 0.1)',
      opacity: 0.05,
      blur: '10px'
    }
  },

  // ========================================
  // 타이포그래피
  // ========================================
  typography: {
    phaseTitle: {
      size: theme.typography.fontSize.sm,      // 14px
      weight: theme.typography.fontWeight.bold, // 700
      lineHeight: theme.typography.lineHeight.tight, // 1.25
      fontFamily: theme.typography.fontFamily.primary
    },
    phaseDate: {
      size: theme.typography.fontSize.xs,      // 12px
      weight: theme.typography.fontWeight.medium, // 500
      lineHeight: 1,
      color: theme.colors.neutral.lightGray    // rgb(113, 113, 122)
    },
    phaseProgress: {
      size: theme.typography.fontSize.xs,      // 12px
      weight: theme.typography.fontWeight.bold, // 700
      lineHeight: 1
    },
    activityTitle: {
      size: '13px',
      weight: theme.typography.fontWeight.semibold, // 600
      lineHeight: theme.typography.lineHeight.snug // 1.375
    },
    activityMeta: {
      size: '11px',
      weight: theme.typography.fontWeight.normal, // 400
      color: theme.colors.neutral.lightGray    // rgb(113, 113, 122)
    }
  },

  // ========================================
  // 간격 (8px 그리드)
  // ========================================
  spacing: {
    phaseBox: {
      padding: theme.spacing[3],               // 12px
      gap: theme.spacing[2],                   // 8px
      margin: theme.spacing[4]                 // 16px
    },
    branch: {
      laneWidth: 120,                          // 레인 너비 (100 → 120)
      minGap: 40                               // 브랜치 간 최소 간격
    }
  },

  // ========================================
  // 전환 효과
  // ========================================
  transitions: {
    default: theme.transitions.default,        // 0.15s cubic-bezier(0.4, 0, 1, 1)
    hover: theme.transitions.transform,        // 0.3s cubic-bezier(0.4, 0, 0.2, 1)
    smooth: theme.transitions.slow             // 0.7s cubic-bezier(0.4, 0, 0.2, 1)
  },

  // ========================================
  // 그림자 (Subtle & Professional)
  // ========================================
  shadows: {
    node: '0 2px 8px rgba(15, 82, 222, 0.12)',           // 파랑 계열 그림자
    nodeHover: '0 4px 16px rgba(15, 82, 222, 0.2)',      // 호버 시 강조
    phaseBox: '0 2px 12px rgba(15, 82, 222, 0.08)',      // 섬세한 그림자
    branch: '0 1px 4px rgba(15, 82, 222, 0.1)',
    glassmorphism: '0 8px 32px rgba(15, 82, 222, 0.06)'  // 글래스모피즘 효과
  },

  // ========================================
  // 보더 반경
  // ========================================
  borderRadius: {
    phaseBox: theme.borderRadius.default,      // 8px
    node: theme.borderRadius.full,             // 9999px (원형)
    tooltip: theme.borderRadius.md             // 12px
  },

  // ========================================
  // 데이터 사이언스 느낌 (Grid & Metrics)
  // ========================================
  dataScience: {
    gridLine: {
      color: 'rgba(15, 82, 222, 0.08)',        // 연한 그리드
      strokeWidth: 1,
      strokeDasharray: '4,4'                   // 점선
    },
    metricLabel: {
      fontFamily: theme.typography.fontFamily.mono, // 모노스페이스
      fontSize: '11px',
      color: theme.colors.neutral.lightGray,
      fontWeight: 500
    },
    glassEffect: {
      background: 'rgba(255, 255, 255, 0.7)',  // 반투명 흰색
      backdropFilter: 'blur(10px)',            // 배경 흐림
      border: '1px solid rgba(15, 82, 222, 0.15)',
      boxShadow: '0 8px 32px rgba(15, 82, 222, 0.06)'
    }
  }
} as const;

// ============================================================================
// 유틸리티 타입
// ============================================================================

/**
 * 활동 타입
 */
export type ActivityType = BranchActivity['type'];

/**
 * 프로젝트 시간 범위
 */
export interface ProjectTimeRange {
  start: Date;
  end: Date;
  totalDuration: number; // milliseconds
}

/**
 * 타임라인 레이아웃 정보
 */
export interface TimelineLayout {
  totalHeight: number;         // 전체 타임라인 높이
  phaseHeights: number[];      // 각 단계별 높이
  canvasHeight: number;        // 캔버스 높이
}