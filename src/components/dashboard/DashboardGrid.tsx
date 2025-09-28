/**
 * Dashboard Grid Component
 * 메인 대시보드 그리드 - 커스터마이징 가능한 위젯 레이아웃
 */

import React, { useState, useCallback, Suspense } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { motion } from 'framer-motion';
import { Plus, Edit3, Save, X, Grid, List } from 'lucide-react';
import { WidgetWrapper } from './widgets/WidgetWrapper';
import { widgetRegistry } from './widgets/WidgetRegistry';
import {
  BREAKPOINTS,
  GRID_COLS,
  ROW_HEIGHT,
  GRID_MARGIN,
  CONTAINER_PADDING,
  createDefaultLayout,
  createResponsiveLayouts,
  type GridLayoutItem,
  type WidgetConfig
} from './grid/GridLayoutConfig';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import '../../styles/grid-layout.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  initialLayout?: GridLayoutItem[];
  onLayoutChange?: (layouts: any) => void;
  className?: string;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  initialLayout,
  onLayoutChange,
  className = ''
}) => {
  // 상태 관리
  const [layouts, setLayouts] = useState(() => {
    const defaultItems = initialLayout || createDefaultLayout();
    return createResponsiveLayouts(defaultItems);
  });

  const [widgets, setWidgets] = useState<Record<string, WidgetConfig>>(() => {
    const widgetMap: Record<string, WidgetConfig> = {};
    const items = initialLayout || createDefaultLayout();
    items.forEach(item => {
      widgetMap[item.i] = item.widget;
    });
    return widgetMap;
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  // 레이아웃 변경 핸들러
  const handleLayoutChange = useCallback((currentLayout: Layout[], allLayouts: any) => {
    setLayouts(allLayouts);
    if (onLayoutChange) {
      onLayoutChange(allLayouts);
    }
  }, [onLayoutChange]);

  // 위젯 제거
  const handleRemoveWidget = useCallback((widgetId: string) => {
    const newLayouts = { ...layouts };
    Object.keys(newLayouts).forEach(breakpoint => {
      newLayouts[breakpoint] = newLayouts[breakpoint].filter(item => item.i !== widgetId);
    });
    setLayouts(newLayouts);

    const newWidgets = { ...widgets };
    delete newWidgets[widgetId];
    setWidgets(newWidgets);
  }, [layouts, widgets]);

  // 위젯 추가
  const handleAddWidget = useCallback((type: WidgetConfig['type']) => {
    const metadata = widgetRegistry.getWidgetMetadata(type);
    if (!metadata) return;

    const newWidget = widgetRegistry.createWidget(type);
    const newLayoutItem: GridLayoutItem = {
      i: newWidget.id,
      x: 0,
      y: 0, // 자동으로 빈 공간을 찾아 배치됨
      w: metadata.defaultSize.w,
      h: metadata.defaultSize.h,
      minW: metadata.defaultSize.minW,
      minH: metadata.defaultSize.minH,
      widget: newWidget
    };

    // 모든 브레이크포인트에 추가
    const newLayouts = { ...layouts };
    Object.keys(newLayouts).forEach(breakpoint => {
      newLayouts[breakpoint] = [...newLayouts[breakpoint], {
        ...newLayoutItem,
        w: Math.min(newLayoutItem.w, GRID_COLS[breakpoint as keyof typeof GRID_COLS])
      }];
    });

    setLayouts(newLayouts);
    setWidgets({ ...widgets, [newWidget.id]: newWidget });
    setShowAddWidget(false);
  }, [layouts, widgets]);

  // 위젯 새로고침
  const handleRefreshWidget = useCallback((widgetId: string) => {
    console.log('Refreshing widget:', widgetId);
    // 실제 데이터 새로고침 로직 구현
  }, []);

  // 위젯 설정
  const handleWidgetSettings = useCallback((widgetId: string) => {
    console.log('Opening settings for widget:', widgetId);
    // 설정 모달 열기 로직 구현
  }, []);

  // 레이아웃 저장
  const handleSaveLayout = useCallback(() => {
    const layoutData = {
      layouts,
      widgets,
      timestamp: Date.now()
    };
    localStorage.setItem('dashboard-layout', JSON.stringify(layoutData));
    setIsEditMode(false);
    console.log('Layout saved successfully');
  }, [layouts, widgets]);

  // 위젯 렌더링
  const renderWidget = (widgetId: string) => {
    const widget = widgets[widgetId];
    if (!widget) return null;

    const WidgetComponent = widgetRegistry.getWidgetComponent(widget.type);
    if (!WidgetComponent) return null;

    return (
      <WidgetWrapper
        key={widgetId}
        widget={widget}
        isEditMode={isEditMode}
        onRefresh={() => handleRefreshWidget(widgetId)}
        onSettings={() => handleWidgetSettings(widgetId)}
        onRemove={() => handleRemoveWidget(widgetId)}
      >
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-primary-main border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <WidgetComponent
            widgetId={widgetId}
            config={widget}
            isEditMode={isEditMode}
          />
        </Suspense>
      </WidgetWrapper>
    );
  };

  return (
    <div className={`dashboard-grid-container ${showGrid ? 'show-grid' : ''} ${className}`}>
      {/* 툴바 */}
      <div className="mb-4 flex items-center justify-between bg-white rounded-lg shadow-sm p-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-neutral-dark">대시보드</h2>
          <span className="text-sm text-neutral-gray">
            ({Object.keys(widgets).length}개 위젯)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 그리드 표시 토글 */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg transition-colors ${
              showGrid ? 'bg-primary-main text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
            title="그리드 표시"
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* 편집 모드 토글 */}
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
              isEditMode ? 'bg-accent-orange text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {isEditMode ? (
              <>
                <X className="w-4 h-4" />
                <span className="text-sm">편집 종료</span>
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" />
                <span className="text-sm">편집</span>
              </>
            )}
          </button>

          {/* 편집 모드 액션 */}
          {isEditMode && (
            <>
              <button
                onClick={() => setShowAddWidget(true)}
                className="px-3 py-1.5 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">위젯 추가</span>
              </button>

              <button
                onClick={handleSaveLayout}
                className="px-3 py-1.5 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span className="text-sm">저장</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 그리드 레이아웃 */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={BREAKPOINTS}
        cols={GRID_COLS}
        rowHeight={ROW_HEIGHT}
        margin={GRID_MARGIN}
        containerPadding={CONTAINER_PADDING}
        onLayoutChange={handleLayoutChange}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        compactType="vertical"
        preventCollision={false}
      >
        {Object.keys(widgets).map(widgetId => (
          <div key={widgetId}>
            {renderWidget(widgetId)}
          </div>
        ))}
      </ResponsiveGridLayout>

      {/* 위젯 추가 모달 */}
      {showAddWidget && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddWidget(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-dark">위젯 추가</h3>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {widgetRegistry.getAllWidgets().map(widget => (
                  <button
                    key={widget.type}
                    onClick={() => handleAddWidget(widget.type)}
                    className="p-4 bg-neutral-50 hover:bg-primary-main/10 border border-neutral-200 hover:border-primary-main rounded-lg transition-all text-left"
                  >
                    <span className="text-2xl block mb-2">{widget.icon}</span>
                    <h4 className="font-semibold text-sm text-neutral-dark mb-1">
                      {widget.name}
                    </h4>
                    <p className="text-xs text-neutral-gray line-clamp-2">
                      {widget.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-neutral-200">
              <button
                onClick={() => setShowAddWidget(false)}
                className="w-full px-4 py-2 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 transition-colors"
              >
                취소
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};