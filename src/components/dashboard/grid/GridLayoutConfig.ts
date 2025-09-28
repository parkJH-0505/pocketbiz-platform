/**
 * Grid Layout Configuration
 * React Grid Layout 설정 및 상수 정의
 */

import type { Layout, Layouts, ResponsiveLayout } from 'react-grid-layout';

// 브레이크포인트 정의
export const BREAKPOINTS = {
  lg: 1200,  // Desktop
  md: 996,   // Tablet landscape
  sm: 768,   // Tablet portrait
  xs: 480,   // Mobile landscape
  xxs: 0     // Mobile portrait
} as const;

// 그리드 컬럼 수
export const GRID_COLS = {
  lg: 12,
  md: 10,
  sm: 6,
  xs: 4,
  xxs: 2
} as const;

// 행 높이 (픽셀)
export const ROW_HEIGHT = 60;

// 그리드 마진
export const GRID_MARGIN: [number, number] = [16, 16];

// 컨테이너 패딩
export const CONTAINER_PADDING: [number, number] = [16, 16];

// 위젯 최소/최대 크기
export const WIDGET_CONSTRAINTS = {
  minW: 2,
  minH: 2,
  maxW: 12,
  maxH: 20
} as const;

// 위젯 타입 정의
export type WidgetType =
  | 'kpi-radar'          // KPI 레이더 차트
  | 'ai-insights'        // AI 인사이트
  | 'score-trend'        // 점수 트렌드
  | 'simulation'         // 시뮬레이션
  | 'prediction'         // 예측
  | 'goal-tracker'       // 목표 추적
  | 'pattern-analysis'   // 패턴 분석
  | 'anomaly-detector'   // 이상 탐지
  | 'quick-actions'      // 빠른 액션
  | 'team-performance'   // 팀 성과
  | 'notifications'      // 알림
  | 'custom';            // 커스텀 위젯

// 위젯 설정 인터페이스
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  icon?: string;
  refreshInterval?: number; // ms
  dataSource?: string;
  settings?: Record<string, any>;
  permissions?: string[];
}

// 레이아웃 아이템 확장
export interface GridLayoutItem extends Layout {
  widget: WidgetConfig;
}

// 대시보드 레이아웃
export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  isDefault?: boolean;
  isShared?: boolean;
  ownerId?: string;
  layouts: Layouts;
  widgets: Record<string, WidgetConfig>;
}

// 기본 레이아웃 생성 함수
export const createDefaultLayout = (): GridLayoutItem[] => {
  return [
    {
      i: 'kpi-radar-main',
      x: 0,
      y: 0,
      w: 6,
      h: 6,
      minW: 4,
      minH: 4,
      widget: {
        id: 'kpi-radar-main',
        type: 'kpi-radar',
        title: 'KPI 레이더 차트',
        description: '5대 축 KPI 종합 분석',
        icon: '📊',
        refreshInterval: 30000
      }
    },
    {
      i: 'ai-insights-main',
      x: 6,
      y: 0,
      w: 6,
      h: 6,
      minW: 4,
      minH: 3,
      widget: {
        id: 'ai-insights-main',
        type: 'ai-insights',
        title: 'AI 인사이트',
        description: 'AI 기반 실시간 분석',
        icon: '🤖',
        refreshInterval: 60000
      }
    },
    {
      i: 'score-trend',
      x: 0,
      y: 6,
      w: 4,
      h: 4,
      minW: 3,
      minH: 3,
      widget: {
        id: 'score-trend',
        type: 'score-trend',
        title: '점수 트렌드',
        description: '시간별 KPI 변화 추이',
        icon: '📈',
        refreshInterval: 120000
      }
    },
    {
      i: 'pattern-analysis',
      x: 4,
      y: 6,
      w: 4,
      h: 4,
      minW: 3,
      minH: 3,
      widget: {
        id: 'pattern-analysis',
        type: 'pattern-analysis',
        title: '패턴 분석',
        description: '데이터 패턴 인식',
        icon: '🔍',
        refreshInterval: 180000
      }
    },
    {
      i: 'quick-actions',
      x: 8,
      y: 6,
      w: 4,
      h: 4,
      minW: 2,
      minH: 2,
      widget: {
        id: 'quick-actions',
        type: 'quick-actions',
        title: '빠른 액션',
        description: '자주 사용하는 기능',
        icon: '⚡',
        refreshInterval: 0
      }
    }
  ];
};

// 반응형 레이아웃 생성
export const createResponsiveLayouts = (items: GridLayoutItem[]): Layouts => {
  const layouts: Layouts = {
    lg: items,
    md: items.map(item => ({
      ...item,
      w: Math.min(item.w, GRID_COLS.md)
    })),
    sm: items.map(item => ({
      ...item,
      w: Math.min(item.w, GRID_COLS.sm),
      x: item.x % GRID_COLS.sm
    })),
    xs: items.map(item => ({
      ...item,
      w: GRID_COLS.xs,
      x: 0
    })),
    xxs: items.map(item => ({
      ...item,
      w: GRID_COLS.xxs,
      x: 0
    }))
  };

  return layouts;
};

// 레이아웃 유효성 검사
export const validateLayout = (layout: Layout[]): boolean => {
  for (const item of layout) {
    // 위치 검사
    if (item.x < 0 || item.y < 0) return false;

    // 크기 검사
    if (item.w < WIDGET_CONSTRAINTS.minW || item.h < WIDGET_CONSTRAINTS.minH) return false;
    if (item.w > WIDGET_CONSTRAINTS.maxW || item.h > WIDGET_CONSTRAINTS.maxH) return false;

    // ID 중복 검사
    const duplicates = layout.filter(l => l.i === item.i);
    if (duplicates.length > 1) return false;
  }

  return true;
};

// 레이아웃 정규화 (겹치는 위젯 조정)
export const normalizeLayout = (layout: Layout[]): Layout[] => {
  const sorted = [...layout].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  const normalized: Layout[] = [];
  const occupied = new Map<string, boolean>();

  for (const item of sorted) {
    let { x, y, w, h } = item;

    // 겹치는 위치 찾기
    let found = false;
    while (!found) {
      found = true;
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          const key = `${x + dx},${y + dy}`;
          if (occupied.has(key)) {
            found = false;
            y++; // 아래로 이동
            break;
          }
        }
        if (!found) break;
      }
    }

    // 위치 점유
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        occupied.set(`${x + dx},${y + dy}`, true);
      }
    }

    normalized.push({ ...item, x, y });
  }

  return normalized;
};

// 레이아웃 압축 (빈 공간 제거)
export const compactLayout = (layout: Layout[]): Layout[] => {
  return normalizeLayout(layout).map(item => ({
    ...item,
    moved: false,
    static: false
  }));
};