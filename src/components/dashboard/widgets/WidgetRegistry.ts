/**
 * Widget Registry
 * 사용 가능한 위젯 관리 및 동적 로딩
 */

import { lazy, ComponentType } from 'react';
import type { WidgetType, WidgetConfig } from '../grid/GridLayoutConfig';

// 위젯 메타데이터
export interface WidgetMetadata {
  type: WidgetType;
  name: string;
  description: string;
  icon: string;
  category: 'analytics' | 'monitoring' | 'action' | 'visualization' | 'custom';
  defaultSize: {
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
  };
  refreshable: boolean;
  configurable: boolean;
  permissions?: string[];
  tags?: string[];
}

// 위젯 컴포넌트 Props
export interface WidgetComponentProps {
  widgetId: string;
  config?: WidgetConfig;
  data?: any;
  isEditMode?: boolean;
  onUpdate?: (data: any) => void;
}

// 위젯 컴포넌트 맵
const widgetComponents: Record<WidgetType, ComponentType<WidgetComponentProps>> = {
  'kpi-radar': lazy(() => import('./components/KPIRadarWidget')),
  'ai-insights': lazy(() => import('./components/AIInsightsWidget')),
  'score-trend': lazy(() => import('./components/ScoreTrendWidget')),
  'simulation': lazy(() => import('./components/SimulationWidget')),
  'prediction': lazy(() => import('./components/PredictionWidget')),
  'goal-tracker': lazy(() => import('./components/GoalTrackerWidget')),
  'pattern-analysis': lazy(() => import('./components/PatternAnalysisWidget')),
  'anomaly-detector': lazy(() => import('./components/AnomalyDetectorWidget')),
  'quick-actions': lazy(() => import('./components/QuickActionsWidget')),
  'team-performance': lazy(() => import('./components/TeamPerformanceWidget')),
  'notifications': lazy(() => import('./components/NotificationsWidget')),
  'custom': lazy(() => import('./components/CustomWidget'))
};

// 위젯 메타데이터 정의
const widgetMetadata: Record<WidgetType, WidgetMetadata> = {
  'kpi-radar': {
    type: 'kpi-radar',
    name: 'KPI 레이더 차트',
    description: '5대 KPI 축의 현재 상태를 레이더 차트로 시각화',
    icon: '📊',
    category: 'visualization',
    defaultSize: { w: 6, h: 6, minW: 4, minH: 4 },
    refreshable: true,
    configurable: true,
    tags: ['kpi', 'radar', 'visualization']
  },
  'ai-insights': {
    type: 'ai-insights',
    name: 'AI 인사이트',
    description: 'AI 기반 실시간 분석 및 추천',
    icon: '🤖',
    category: 'analytics',
    defaultSize: { w: 6, h: 6, minW: 4, minH: 3 },
    refreshable: true,
    configurable: true,
    tags: ['ai', 'insights', 'analysis']
  },
  'score-trend': {
    type: 'score-trend',
    name: '점수 트렌드',
    description: '시간에 따른 KPI 점수 변화 추이',
    icon: '📈',
    category: 'analytics',
    defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
    refreshable: true,
    configurable: true,
    tags: ['trend', 'chart', 'analytics']
  },
  'simulation': {
    type: 'simulation',
    name: '시뮬레이션',
    description: '몬테카를로 시뮬레이션 및 시나리오 분석',
    icon: '🎲',
    category: 'analytics',
    defaultSize: { w: 6, h: 5, minW: 4, minH: 4 },
    refreshable: true,
    configurable: true,
    tags: ['simulation', 'prediction', 'scenario']
  },
  'prediction': {
    type: 'prediction',
    name: '예측',
    description: 'ML 기반 KPI 예측',
    icon: '🔮',
    category: 'analytics',
    defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
    refreshable: true,
    configurable: true,
    tags: ['prediction', 'ml', 'forecast']
  },
  'goal-tracker': {
    type: 'goal-tracker',
    name: '목표 추적',
    description: '목표 달성률 및 진행 상황 모니터링',
    icon: '🎯',
    category: 'monitoring',
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2 },
    refreshable: true,
    configurable: true,
    tags: ['goal', 'tracking', 'progress']
  },
  'pattern-analysis': {
    type: 'pattern-analysis',
    name: '패턴 분석',
    description: '데이터 패턴 인식 및 트렌드 분석',
    icon: '🔍',
    category: 'analytics',
    defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
    refreshable: true,
    configurable: true,
    tags: ['pattern', 'analysis', 'recognition']
  },
  'anomaly-detector': {
    type: 'anomaly-detector',
    name: '이상 탐지',
    description: '비정상적인 패턴 및 이상치 감지',
    icon: '⚠️',
    category: 'monitoring',
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2 },
    refreshable: true,
    configurable: true,
    tags: ['anomaly', 'detection', 'alert']
  },
  'quick-actions': {
    type: 'quick-actions',
    name: '빠른 액션',
    description: '자주 사용하는 기능 바로가기',
    icon: '⚡',
    category: 'action',
    defaultSize: { w: 3, h: 3, minW: 2, minH: 2 },
    refreshable: false,
    configurable: true,
    tags: ['action', 'shortcut', 'quick']
  },
  'team-performance': {
    type: 'team-performance',
    name: '팀 성과',
    description: '팀 멤버별 성과 및 기여도',
    icon: '👥',
    category: 'monitoring',
    defaultSize: { w: 5, h: 4, minW: 4, minH: 3 },
    refreshable: true,
    configurable: true,
    tags: ['team', 'performance', 'members']
  },
  'notifications': {
    type: 'notifications',
    name: '알림',
    description: '중요 알림 및 업데이트',
    icon: '🔔',
    category: 'monitoring',
    defaultSize: { w: 3, h: 4, minW: 2, minH: 3 },
    refreshable: true,
    configurable: false,
    tags: ['notification', 'alert', 'update']
  },
  'custom': {
    type: 'custom',
    name: '커스텀 위젯',
    description: '사용자 정의 위젯',
    icon: '🛠️',
    category: 'custom',
    defaultSize: { w: 4, h: 4, minW: 2, minH: 2 },
    refreshable: true,
    configurable: true,
    tags: ['custom', 'user-defined']
  }
};

// Widget Registry 클래스
export class WidgetRegistry {
  private static instance: WidgetRegistry;

  private constructor() {}

  // 싱글톤 인스턴스 획득
  static getInstance(): WidgetRegistry {
    if (!WidgetRegistry.instance) {
      WidgetRegistry.instance = new WidgetRegistry();
    }
    return WidgetRegistry.instance;
  }

  // 모든 위젯 메타데이터 가져오기
  getAllWidgets(): WidgetMetadata[] {
    return Object.values(widgetMetadata);
  }

  // 카테고리별 위젯 가져오기
  getWidgetsByCategory(category: WidgetMetadata['category']): WidgetMetadata[] {
    return this.getAllWidgets().filter(widget => widget.category === category);
  }

  // 특정 위젯 메타데이터 가져오기
  getWidgetMetadata(type: WidgetType): WidgetMetadata | undefined {
    return widgetMetadata[type];
  }

  // 위젯 컴포넌트 가져오기
  getWidgetComponent(type: WidgetType): ComponentType<WidgetComponentProps> | undefined {
    return widgetComponents[type];
  }

  // 위젯 생성
  createWidget(type: WidgetType, customConfig?: Partial<WidgetConfig>): WidgetConfig {
    const metadata = this.getWidgetMetadata(type);
    if (!metadata) {
      throw new Error(`Unknown widget type: ${type}`);
    }

    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      id,
      type,
      title: customConfig?.title || metadata.name,
      description: customConfig?.description || metadata.description,
      icon: customConfig?.icon || metadata.icon,
      refreshInterval: customConfig?.refreshInterval,
      dataSource: customConfig?.dataSource,
      settings: customConfig?.settings || {},
      permissions: customConfig?.permissions || metadata.permissions
    };
  }

  // 위젯 검색
  searchWidgets(query: string): WidgetMetadata[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllWidgets().filter(widget => {
      return (
        widget.name.toLowerCase().includes(lowerQuery) ||
        widget.description.toLowerCase().includes(lowerQuery) ||
        widget.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    });
  }

  // 위젯 권한 확인
  checkWidgetPermission(
    widget: WidgetConfig,
    userPermissions: string[]
  ): boolean {
    if (!widget.permissions || widget.permissions.length === 0) {
      return true;
    }

    return widget.permissions.some(permission =>
      userPermissions.includes(permission)
    );
  }

  // 위젯 검증
  validateWidget(widget: WidgetConfig): boolean {
    // 타입 검증
    if (!widgetMetadata[widget.type]) {
      return false;
    }

    // 필수 필드 검증
    if (!widget.id || !widget.title) {
      return false;
    }

    return true;
  }

  // 위젯 설정 병합
  mergeWidgetConfig(
    widget: WidgetConfig,
    updates: Partial<WidgetConfig>
  ): WidgetConfig {
    return {
      ...widget,
      ...updates,
      settings: {
        ...widget.settings,
        ...updates.settings
      }
    };
  }
}

// 싱글톤 인스턴스 export
export const widgetRegistry = WidgetRegistry.getInstance();