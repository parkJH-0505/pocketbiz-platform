/**
 * Profile-specific Default Layouts
 * 역할별 기본 레이아웃 정의
 */

import type { GridLayoutItem, DashboardLayout } from '../grid/GridLayoutConfig';
import { widgetRegistry } from '../widgets/WidgetRegistry';

/**
 * 개발자 프로필 레이아웃
 */
export const createDeveloperLayout = (): DashboardLayout => {
  const widgets: GridLayoutItem[] = [
    {
      i: 'pattern-analysis-dev',
      x: 0,
      y: 0,
      w: 6,
      h: 5,
      minW: 4,
      minH: 4,
      widget: widgetRegistry.createWidget('pattern-analysis', {
        title: '코드 패턴 분석',
        description: '코드 품질 및 패턴 분석',
        refreshInterval: 60000
      })
    },
    {
      i: 'anomaly-detector-dev',
      x: 6,
      y: 0,
      w: 6,
      h: 5,
      minW: 4,
      minH: 3,
      widget: widgetRegistry.createWidget('anomaly-detector', {
        title: '버그 & 이상 탐지',
        description: '실시간 에러 및 성능 이상 감지',
        refreshInterval: 30000
      })
    },
    {
      i: 'kpi-radar-dev',
      x: 0,
      y: 5,
      w: 4,
      h: 4,
      minW: 3,
      minH: 3,
      widget: widgetRegistry.createWidget('kpi-radar', {
        title: '기술 KPI',
        description: '기술 지표 레이더',
        refreshInterval: 120000
      })
    },
    {
      i: 'score-trend-dev',
      x: 4,
      y: 5,
      w: 4,
      h: 4,
      minW: 3,
      minH: 3,
      widget: widgetRegistry.createWidget('score-trend', {
        title: '성능 트렌드',
        description: '시스템 성능 변화 추이',
        refreshInterval: 60000
      })
    },
    {
      i: 'quick-actions-dev',
      x: 8,
      y: 5,
      w: 4,
      h: 4,
      minW: 2,
      minH: 2,
      widget: widgetRegistry.createWidget('quick-actions', {
        title: '개발 도구',
        description: '빠른 개발 작업',
        settings: {
          actions: [
            { icon: '🛠️', label: '빌드', command: 'build' },
            { icon: '🧪', label: '테스트', command: 'test' },
            { icon: '🚀', label: '배포', command: 'deploy' },
            { icon: '📊', label: '분석', command: 'analyze' }
          ]
        }
      })
    }
  ];

  const layout: DashboardLayout = {
    id: 'developer-default-layout',
    name: '개발자 대시보드',
    description: '개발 중심 위젯과 기술 지표',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isDefault: true,
    layouts: {
      lg: widgets,
      md: widgets.map(w => ({ ...w, w: Math.min(w.w, 10) })),
      sm: widgets.map(w => ({ ...w, w: Math.min(w.w, 6) })),
      xs: widgets.map(w => ({ ...w, w: 4, x: 0 })),
      xxs: widgets.map(w => ({ ...w, w: 2, x: 0 }))
    },
    widgets: widgets.reduce((acc, item) => {
      acc[item.i] = item.widget;
      return acc;
    }, {} as Record<string, any>)
  };

  return layout;
};

/**
 * PM 프로필 레이아웃
 */
export const createPMLayout = (): DashboardLayout => {
  const widgets: GridLayoutItem[] = [
    {
      i: 'kpi-radar-pm',
      x: 0,
      y: 0,
      w: 6,
      h: 6,
      minW: 4,
      minH: 4,
      widget: widgetRegistry.createWidget('kpi-radar', {
        title: '프로젝트 KPI',
        description: '프로젝트 핵심 지표',
        refreshInterval: 60000
      })
    },
    {
      i: 'goal-tracker-pm',
      x: 6,
      y: 0,
      w: 6,
      h: 3,
      minW: 4,
      minH: 2,
      widget: widgetRegistry.createWidget('goal-tracker', {
        title: '목표 추적',
        description: '프로젝트 목표 달성률',
        refreshInterval: 300000
      })
    },
    {
      i: 'team-performance-pm',
      x: 6,
      y: 3,
      w: 6,
      h: 4,
      minW: 4,
      minH: 3,
      widget: widgetRegistry.createWidget('team-performance', {
        title: '팀 성과',
        description: '팀원별 기여도 및 성과',
        refreshInterval: 180000
      })
    },
    {
      i: 'score-trend-pm',
      x: 0,
      y: 6,
      w: 4,
      h: 3,
      minW: 3,
      minH: 2,
      widget: widgetRegistry.createWidget('score-trend', {
        title: '진행률 트렌드',
        description: '프로젝트 진행 추이',
        refreshInterval: 120000
      })
    },
    {
      i: 'ai-insights-pm',
      x: 4,
      y: 7,
      w: 5,
      h: 4,
      minW: 4,
      minH: 3,
      widget: widgetRegistry.createWidget('ai-insights', {
        title: '프로젝트 인사이트',
        description: 'AI 기반 프로젝트 분석',
        refreshInterval: 300000
      })
    },
    {
      i: 'notifications-pm',
      x: 9,
      y: 7,
      w: 3,
      h: 4,
      minW: 2,
      minH: 3,
      widget: widgetRegistry.createWidget('notifications', {
        title: '팀 알림',
        description: '중요 업데이트',
        refreshInterval: 60000
      })
    }
  ];

  const layout: DashboardLayout = {
    id: 'pm-default-layout',
    name: 'PM 대시보드',
    description: '프로젝트 관리 중심 위젯',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isDefault: true,
    layouts: {
      lg: widgets,
      md: widgets.map(w => ({ ...w, w: Math.min(w.w, 10) })),
      sm: widgets.map(w => ({ ...w, w: Math.min(w.w, 6) })),
      xs: widgets.map(w => ({ ...w, w: 4, x: 0 })),
      xxs: widgets.map(w => ({ ...w, w: 2, x: 0 }))
    },
    widgets: widgets.reduce((acc, item) => {
      acc[item.i] = item.widget;
      return acc;
    }, {} as Record<string, any>)
  };

  return layout;
};

/**
 * CEO 프로필 레이아웃
 */
export const createCEOLayout = (): DashboardLayout => {
  const widgets: GridLayoutItem[] = [
    {
      i: 'kpi-radar-ceo',
      x: 4,
      y: 0,
      w: 4,
      h: 4,
      minW: 3,
      minH: 3,
      widget: widgetRegistry.createWidget('kpi-radar', {
        title: '핵심 KPI',
        description: '전사 핵심 성과 지표',
        refreshInterval: 300000
      })
    },
    {
      i: 'ai-insights-ceo',
      x: 0,
      y: 0,
      w: 4,
      h: 6,
      minW: 3,
      minH: 4,
      widget: widgetRegistry.createWidget('ai-insights', {
        title: '전략적 인사이트',
        description: '경영 의사결정 지원',
        refreshInterval: 600000,
        settings: {
          priority: 'high',
          focusAreas: ['revenue', 'growth', 'market']
        }
      })
    },
    {
      i: 'prediction-ceo',
      x: 8,
      y: 0,
      w: 4,
      h: 4,
      minW: 3,
      minH: 3,
      widget: widgetRegistry.createWidget('prediction', {
        title: '성과 예측',
        description: '분기별 성과 예측',
        refreshInterval: 3600000
      })
    },
    {
      i: 'goal-tracker-ceo',
      x: 4,
      y: 4,
      w: 8,
      h: 2,
      minW: 6,
      minH: 2,
      widget: widgetRegistry.createWidget('goal-tracker', {
        title: '전사 목표',
        description: '연간 목표 달성 현황',
        refreshInterval: 600000
      })
    },
    {
      i: 'simulation-ceo',
      x: 0,
      y: 6,
      w: 6,
      h: 4,
      minW: 4,
      minH: 3,
      widget: widgetRegistry.createWidget('simulation', {
        title: '시나리오 분석',
        description: '의사결정 시뮬레이션',
        refreshInterval: 0
      })
    },
    {
      i: 'score-trend-ceo',
      x: 6,
      y: 6,
      w: 6,
      h: 4,
      minW: 4,
      minH: 3,
      widget: widgetRegistry.createWidget('score-trend', {
        title: '성장 트렌드',
        description: '전사 성장 지표',
        refreshInterval: 600000
      })
    }
  ];

  const layout: DashboardLayout = {
    id: 'ceo-default-layout',
    name: 'CEO 대시보드',
    description: '경영진 의사결정 지원',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isDefault: true,
    layouts: {
      lg: widgets,
      md: widgets.map(w => ({ ...w, w: Math.min(w.w, 10) })),
      sm: widgets.map(w => ({ ...w, w: Math.min(w.w, 6) })),
      xs: widgets.map(w => ({ ...w, w: 4, x: 0 })),
      xxs: widgets.map(w => ({ ...w, w: 2, x: 0 }))
    },
    widgets: widgets.reduce((acc, item) => {
      acc[item.i] = item.widget;
      return acc;
    }, {} as Record<string, any>)
  };

  return layout;
};

/**
 * 스타트업 창업자 프로필 레이아웃
 */
export const createStartupFounderLayout = (): DashboardLayout => {
  const widgets: GridLayoutItem[] = [
    {
      i: 'kpi-radar-founder',
      x: 0,
      y: 0,
      w: 5,
      h: 5,
      minW: 4,
      minH: 4,
      widget: widgetRegistry.createWidget('kpi-radar', {
        title: '스타트업 KPI',
        description: '5대 핵심 축 평가',
        refreshInterval: 60000
      })
    },
    {
      i: 'ai-insights-founder',
      x: 5,
      y: 0,
      w: 7,
      h: 5,
      minW: 5,
      minH: 4,
      widget: widgetRegistry.createWidget('ai-insights', {
        title: 'AI 멘토링',
        description: '성장 전략 제안',
        refreshInterval: 300000
      })
    },
    {
      i: 'goal-tracker-founder',
      x: 0,
      y: 5,
      w: 4,
      h: 3,
      minW: 3,
      minH: 2,
      widget: widgetRegistry.createWidget('goal-tracker', {
        title: '마일스톤',
        description: '주요 목표 달성 현황',
        refreshInterval: 180000
      })
    },
    {
      i: 'prediction-founder',
      x: 4,
      y: 5,
      w: 4,
      h: 3,
      minW: 3,
      minH: 2,
      widget: widgetRegistry.createWidget('prediction', {
        title: '성장 예측',
        description: '6개월 성장 전망',
        refreshInterval: 3600000
      })
    },
    {
      i: 'quick-actions-founder',
      x: 8,
      y: 5,
      w: 4,
      h: 3,
      minW: 2,
      minH: 2,
      widget: widgetRegistry.createWidget('quick-actions', {
        title: '빠른 실행',
        description: '자주 쓰는 기능',
        settings: {
          actions: [
            { icon: '📊', label: 'KPI 진단' },
            { icon: '💡', label: '아이디어 기록' },
            { icon: '📈', label: '투자자 리포트' },
            { icon: '🎯', label: '목표 설정' }
          ]
        }
      })
    },
    {
      i: 'pattern-analysis-founder',
      x: 0,
      y: 8,
      w: 6,
      h: 3,
      minW: 4,
      minH: 2,
      widget: widgetRegistry.createWidget('pattern-analysis', {
        title: '시장 패턴',
        description: '시장 트렌드 분석',
        refreshInterval: 600000
      })
    },
    {
      i: 'team-performance-founder',
      x: 6,
      y: 8,
      w: 6,
      h: 3,
      minW: 4,
      minH: 2,
      widget: widgetRegistry.createWidget('team-performance', {
        title: '팀 현황',
        description: '팀 구성 및 성과',
        refreshInterval: 600000
      })
    }
  ];

  const layout: DashboardLayout = {
    id: 'startup-founder-layout',
    name: '스타트업 창업자 대시보드',
    description: '창업자를 위한 올인원 대시보드',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isDefault: true,
    layouts: {
      lg: widgets,
      md: widgets.map(w => ({ ...w, w: Math.min(w.w, 10) })),
      sm: widgets.map(w => ({ ...w, w: Math.min(w.w, 6) })),
      xs: widgets.map(w => ({ ...w, w: 4, x: 0 })),
      xxs: widgets.map(w => ({ ...w, w: 2, x: 0 }))
    },
    widgets: widgets.reduce((acc, item) => {
      acc[item.i] = item.widget;
      return acc;
    }, {} as Record<string, any>)
  };

  return layout;
};

/**
 * 역할별 기본 레이아웃 가져오기
 */
export const getRoleDefaultLayout = (role: 'developer' | 'pm' | 'ceo' | 'founder'): DashboardLayout => {
  switch (role) {
    case 'developer':
      return createDeveloperLayout();
    case 'pm':
      return createPMLayout();
    case 'ceo':
      return createCEOLayout();
    case 'founder':
      return createStartupFounderLayout();
    default:
      return createStartupFounderLayout();
  }
};