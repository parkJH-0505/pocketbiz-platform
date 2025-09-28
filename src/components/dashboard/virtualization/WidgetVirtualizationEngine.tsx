import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  createContext,
  useContext
} from 'react';

export interface VirtualizedItem {
  id: string;
  index: number;
  height: number;
  width: number;
  x: number;
  y: number;
  visible: boolean;
  component: React.ComponentType<any>;
  props: any;
  zIndex?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ViewportInfo {
  scrollTop: number;
  scrollLeft: number;
  clientHeight: number;
  clientWidth: number;
  containerHeight: number;
  containerWidth: number;
}

export interface VirtualizationConfig {
  itemHeight: number;
  itemWidth: number;
  overscan: number;
  scrollThreshold: number;
  enableHorizontalVirtualization: boolean;
  enableVerticalVirtualization: boolean;
  preloadDistance: number;
  unloadDistance: number;
  recycleThreshold: number;
  performanceMode: 'auto' | 'high' | 'balanced' | 'memory';
}

export interface VirtualizationStats {
  totalItems: number;
  visibleItems: number;
  renderedItems: number;
  recycledItems: number;
  memoryUsage: number;
  renderTime: number;
  scrollFps: number;
  lastUpdate: number;
}

interface VirtualizationContextValue {
  viewport: ViewportInfo;
  config: VirtualizationConfig;
  stats: VirtualizationStats;
  registerItem: (item: VirtualizedItem) => void;
  unregisterItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<VirtualizedItem>) => void;
  getVisibleItems: () => VirtualizedItem[];
}

const VirtualizationContext = createContext<VirtualizationContextValue | null>(null);

export const useVirtualization = () => {
  const context = useContext(VirtualizationContext);
  if (!context) {
    throw new Error('useVirtualization must be used within VirtualizationProvider');
  }
  return context;
};

export class WidgetVirtualizationEngine {
  private items = new Map<string, VirtualizedItem>();
  private visibleItems = new Set<string>();
  private recycledComponents = new Map<string, React.ComponentType<any>[]>();
  private itemPool = new Map<string, VirtualizedItem[]>();
  private viewport: ViewportInfo;
  private config: VirtualizationConfig;
  private stats: VirtualizationStats;
  private observers: Set<(stats: VirtualizationStats) => void> = new Set();
  private rafId: number | null = null;
  private lastScrollTime = 0;
  private scrollFrameCount = 0;
  private isScrolling = false;
  private scrollTimeout: NodeJS.Timeout | null = null;

  constructor(config: Partial<VirtualizationConfig> = {}) {
    this.config = {
      itemHeight: 200,
      itemWidth: 300,
      overscan: 3,
      scrollThreshold: 10,
      enableHorizontalVirtualization: true,
      enableVerticalVirtualization: true,
      preloadDistance: 500,
      unloadDistance: 1000,
      recycleThreshold: 50,
      performanceMode: 'auto',
      ...config
    };

    this.viewport = {
      scrollTop: 0,
      scrollLeft: 0,
      clientHeight: 0,
      clientWidth: 0,
      containerHeight: 0,
      containerWidth: 0
    };

    this.stats = {
      totalItems: 0,
      visibleItems: 0,
      renderedItems: 0,
      recycledItems: 0,
      memoryUsage: 0,
      renderTime: 0,
      scrollFps: 0,
      lastUpdate: Date.now()
    };

    this.setupPerformanceMonitoring();
  }

  /**
   * 아이템 등록
   */
  registerItem(item: VirtualizedItem): void {
    this.items.set(item.id, item);
    this.stats.totalItems = this.items.size;
    this.updateVisibility();
  }

  /**
   * 아이템 제거
   */
  unregisterItem(id: string): void {
    const item = this.items.get(id);
    if (!item) return;

    this.items.delete(id);
    this.visibleItems.delete(id);
    this.stats.totalItems = this.items.size;

    // 컴포넌트 재활용 풀에 반환
    this.recycleComponent(item);
  }

  /**
   * 아이템 업데이트
   */
  updateItem(id: string, updates: Partial<VirtualizedItem>): void {
    const item = this.items.get(id);
    if (!item) return;

    const updatedItem = { ...item, ...updates };
    this.items.set(id, updatedItem);

    // 위치나 크기가 변경된 경우 가시성 재계산
    if (updates.x !== undefined || updates.y !== undefined ||
        updates.width !== undefined || updates.height !== undefined) {
      this.updateVisibility();
    }
  }

  /**
   * 뷰포트 업데이트
   */
  updateViewport(viewport: Partial<ViewportInfo>): void {
    const previousViewport = { ...this.viewport };
    this.viewport = { ...this.viewport, ...viewport };

    // 스크롤 감지
    if (viewport.scrollTop !== undefined || viewport.scrollLeft !== undefined) {
      this.handleScroll(previousViewport);
    }

    this.updateVisibility();
  }

  /**
   * 가시성 업데이트
   */
  private updateVisibility(): void {
    const startTime = performance.now();

    const newVisibleItems = new Set<string>();
    const { scrollTop, scrollLeft, clientHeight, clientWidth } = this.viewport;
    const { overscan, preloadDistance } = this.config;

    for (const [id, item] of this.items) {
      const isVisible = this.isItemVisible(item, scrollTop, scrollLeft, clientHeight, clientWidth);
      const shouldPreload = this.shouldPreloadItem(item, scrollTop, scrollLeft, clientHeight, clientWidth);

      if (isVisible || shouldPreload) {
        newVisibleItems.add(id);

        if (!this.visibleItems.has(id)) {
          this.loadItem(item);
        }
      } else if (this.visibleItems.has(id)) {
        const shouldUnload = this.shouldUnloadItem(item, scrollTop, scrollLeft, clientHeight, clientWidth);
        if (shouldUnload) {
          this.unloadItem(item);
        }
      }
    }

    this.visibleItems = newVisibleItems;
    this.stats.visibleItems = this.visibleItems.size;
    this.stats.renderTime = performance.now() - startTime;
    this.stats.lastUpdate = Date.now();

    this.notifyObservers();
  }

  /**
   * 아이템 가시성 확인
   */
  private isItemVisible(
    item: VirtualizedItem,
    scrollTop: number,
    scrollLeft: number,
    clientHeight: number,
    clientWidth: number
  ): boolean {
    const { overscan } = this.config;

    const visibleTop = scrollTop - overscan * this.config.itemHeight;
    const visibleBottom = scrollTop + clientHeight + overscan * this.config.itemHeight;
    const visibleLeft = scrollLeft - overscan * this.config.itemWidth;
    const visibleRight = scrollLeft + clientWidth + overscan * this.config.itemWidth;

    return (
      item.y + item.height >= visibleTop &&
      item.y <= visibleBottom &&
      item.x + item.width >= visibleLeft &&
      item.x <= visibleRight
    );
  }

  /**
   * 프리로드 필요성 확인
   */
  private shouldPreloadItem(
    item: VirtualizedItem,
    scrollTop: number,
    scrollLeft: number,
    clientHeight: number,
    clientWidth: number
  ): boolean {
    const { preloadDistance } = this.config;

    const preloadTop = scrollTop - preloadDistance;
    const preloadBottom = scrollTop + clientHeight + preloadDistance;
    const preloadLeft = scrollLeft - preloadDistance;
    const preloadRight = scrollLeft + clientWidth + preloadDistance;

    return (
      item.y + item.height >= preloadTop &&
      item.y <= preloadBottom &&
      item.x + item.width >= preloadLeft &&
      item.x <= preloadRight
    );
  }

  /**
   * 언로드 필요성 확인
   */
  private shouldUnloadItem(
    item: VirtualizedItem,
    scrollTop: number,
    scrollLeft: number,
    clientHeight: number,
    clientWidth: number
  ): boolean {
    const { unloadDistance } = this.config;

    const unloadTop = scrollTop - unloadDistance;
    const unloadBottom = scrollTop + clientHeight + unloadDistance;
    const unloadLeft = scrollLeft - unloadDistance;
    const unloadRight = scrollLeft + clientWidth + unloadDistance;

    return (
      item.y + item.height < unloadTop ||
      item.y > unloadBottom ||
      item.x + item.width < unloadLeft ||
      item.x > unloadRight
    );
  }

  /**
   * 아이템 로드
   */
  private loadItem(item: VirtualizedItem): void {
    // 우선순위에 따른 로딩
    const priority = item.priority || 'medium';

    if (this.config.performanceMode === 'high' && priority === 'low') {
      // 고성능 모드에서는 낮은 우선순위 아이템 지연 로딩
      setTimeout(() => this.actuallyLoadItem(item), 16);
    } else {
      this.actuallyLoadItem(item);
    }
  }

  /**
   * 실제 아이템 로드
   */
  private actuallyLoadItem(item: VirtualizedItem): void {
    item.visible = true;
    this.stats.renderedItems++;

    // 재활용된 컴포넌트가 있다면 사용
    const recycledComponent = this.getRecycledComponent(item.component.name);
    if (recycledComponent) {
      item.component = recycledComponent;
      this.stats.recycledItems++;
    }
  }

  /**
   * 아이템 언로드
   */
  private unloadItem(item: VirtualizedItem): void {
    item.visible = false;
    this.stats.renderedItems = Math.max(0, this.stats.renderedItems - 1);

    // 컴포넌트 재활용
    this.recycleComponent(item);
  }

  /**
   * 컴포넌트 재활용
   */
  private recycleComponent(item: VirtualizedItem): void {
    const componentName = item.component.name;

    if (!this.recycledComponents.has(componentName)) {
      this.recycledComponents.set(componentName, []);
    }

    const recycled = this.recycledComponents.get(componentName)!;

    // 재활용 풀 크기 제한
    if (recycled.length < this.config.recycleThreshold) {
      recycled.push(item.component);
    }
  }

  /**
   * 재활용된 컴포넌트 가져오기
   */
  private getRecycledComponent(componentName: string): React.ComponentType<any> | null {
    const recycled = this.recycledComponents.get(componentName);
    return recycled && recycled.length > 0 ? recycled.pop()! : null;
  }

  /**
   * 스크롤 처리
   */
  private handleScroll(previousViewport: ViewportInfo): void {
    const now = performance.now();

    if (!this.isScrolling) {
      this.isScrolling = true;
      this.scrollFrameCount = 0;
      this.lastScrollTime = now;
    }

    this.scrollFrameCount++;

    // 스크롤 FPS 계산
    const timeDiff = now - this.lastScrollTime;
    if (timeDiff >= 1000) {
      this.stats.scrollFps = (this.scrollFrameCount * 1000) / timeDiff;
      this.scrollFrameCount = 0;
      this.lastScrollTime = now;
    }

    // 스크롤 끝 감지
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false;
      this.optimizeAfterScroll();
    }, 150);

    // 성능 모드에 따른 스크롤 최적화
    if (this.config.performanceMode === 'high') {
      this.throttleScrollUpdates();
    }
  }

  /**
   * 스크롤 업데이트 스로틀링
   */
  private throttleScrollUpdates(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    this.rafId = requestAnimationFrame(() => {
      this.updateVisibility();
      this.rafId = null;
    });
  }

  /**
   * 스크롤 후 최적화
   */
  private optimizeAfterScroll(): void {
    // 메모리 정리
    this.cleanupRecycledComponents();

    // 통계 업데이트
    this.updateMemoryStats();
  }

  /**
   * 재활용된 컴포넌트 정리
   */
  private cleanupRecycledComponents(): void {
    for (const [componentName, recycled] of this.recycledComponents) {
      // 절반만 유지
      const keepCount = Math.floor(recycled.length / 2);
      this.recycledComponents.set(componentName, recycled.slice(0, keepCount));
    }
  }

  /**
   * 메모리 통계 업데이트
   */
  private updateMemoryStats(): void {
    // 대략적인 메모리 사용량 계산
    const itemMemory = this.items.size * 100; // 아이템당 대략 100바이트
    const recycledMemory = Array.from(this.recycledComponents.values())
      .reduce((total, arr) => total + arr.length * 50, 0); // 재활용된 컴포넌트당 50바이트

    this.stats.memoryUsage = itemMemory + recycledMemory;
  }

  /**
   * 성능 모니터링 설정
   */
  private setupPerformanceMonitoring(): void {
    // 성능 모드 자동 조정
    if (this.config.performanceMode === 'auto') {
      setInterval(() => {
        this.autoAdjustPerformanceMode();
      }, 5000);
    }
  }

  /**
   * 성능 모드 자동 조정
   */
  private autoAdjustPerformanceMode(): void {
    const { renderTime, scrollFps, memoryUsage } = this.stats;

    if (renderTime > 16 || scrollFps < 30 || memoryUsage > 10000000) {
      // 성능 문제 감지 시 고성능 모드로 전환
      this.config.performanceMode = 'high';
      this.config.overscan = Math.max(1, this.config.overscan - 1);
      this.config.recycleThreshold = Math.min(100, this.config.recycleThreshold + 10);
    } else if (renderTime < 8 && scrollFps > 55 && memoryUsage < 5000000) {
      // 성능 여유 시 균형 모드로 전환
      this.config.performanceMode = 'balanced';
      this.config.overscan = Math.min(5, this.config.overscan + 1);
    }
  }

  /**
   * 가시 아이템 목록 반환
   */
  getVisibleItems(): VirtualizedItem[] {
    return Array.from(this.visibleItems)
      .map(id => this.items.get(id))
      .filter(item => item && item.visible) as VirtualizedItem[];
  }

  /**
   * 통계 반환
   */
  getStats(): VirtualizationStats {
    return { ...this.stats };
  }

  /**
   * 설정 업데이트
   */
  updateConfig(updates: Partial<VirtualizationConfig>): void {
    this.config = { ...this.config, ...updates };
    this.updateVisibility();
  }

  /**
   * 옵저버 등록
   */
  addStatsObserver(observer: (stats: VirtualizationStats) => void): void {
    this.observers.add(observer);
  }

  /**
   * 옵저버 제거
   */
  removeStatsObserver(observer: (stats: VirtualizationStats) => void): void {
    this.observers.delete(observer);
  }

  /**
   * 옵저버 알림
   */
  private notifyObservers(): void {
    this.observers.forEach(observer => observer(this.stats));
  }

  /**
   * 리소스 정리
   */
  dispose(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.items.clear();
    this.visibleItems.clear();
    this.recycledComponents.clear();
    this.itemPool.clear();
    this.observers.clear();
  }
}

// React 컴포넌트
interface VirtualizationProviderProps {
  children: React.ReactNode;
  config?: Partial<VirtualizationConfig>;
  onStatsUpdate?: (stats: VirtualizationStats) => void;
}

export const VirtualizationProvider: React.FC<VirtualizationProviderProps> = ({
  children,
  config,
  onStatsUpdate
}) => {
  const engineRef = useRef<WidgetVirtualizationEngine>();
  const [viewport, setViewport] = useState<ViewportInfo>({
    scrollTop: 0,
    scrollLeft: 0,
    clientHeight: 0,
    clientWidth: 0,
    containerHeight: 0,
    containerWidth: 0
  });
  const [stats, setStats] = useState<VirtualizationStats>({
    totalItems: 0,
    visibleItems: 0,
    renderedItems: 0,
    recycledItems: 0,
    memoryUsage: 0,
    renderTime: 0,
    scrollFps: 0,
    lastUpdate: Date.now()
  });

  // 엔진 초기화
  useEffect(() => {
    engineRef.current = new WidgetVirtualizationEngine(config);

    const statsObserver = (newStats: VirtualizationStats) => {
      setStats(newStats);
      onStatsUpdate?.(newStats);
    };

    engineRef.current.addStatsObserver(statsObserver);

    return () => {
      engineRef.current?.removeStatsObserver(statsObserver);
      engineRef.current?.dispose();
    };
  }, [config, onStatsUpdate]);

  // 뷰포트 업데이트 핸들러
  const updateViewport = useCallback((updates: Partial<ViewportInfo>) => {
    setViewport(prev => {
      const newViewport = { ...prev, ...updates };
      engineRef.current?.updateViewport(newViewport);
      return newViewport;
    });
  }, []);

  // 컨텍스트 값
  const contextValue: VirtualizationContextValue = useMemo(() => ({
    viewport,
    config: engineRef.current?.getStats() ? engineRef.current.config : {} as VirtualizationConfig,
    stats,
    registerItem: (item: VirtualizedItem) => engineRef.current?.registerItem(item),
    unregisterItem: (id: string) => engineRef.current?.unregisterItem(id),
    updateItem: (id: string, updates: Partial<VirtualizedItem>) =>
      engineRef.current?.updateItem(id, updates),
    getVisibleItems: () => engineRef.current?.getVisibleItems() || []
  }), [viewport, stats]);

  return (
    <VirtualizationContext.Provider value={contextValue}>
      {children}
    </VirtualizationContext.Provider>
  );
};

// 가상화된 위젯 컨테이너
interface VirtualizedWidgetContainerProps {
  onScroll?: (viewport: ViewportInfo) => void;
  style?: React.CSSProperties;
  className?: string;
  children: React.ReactNode;
}

export const VirtualizedWidgetContainer: React.FC<VirtualizedWidgetContainerProps> = ({
  onScroll,
  style,
  className,
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { updateViewport } = useVirtualization();

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const newViewport = {
      scrollTop: target.scrollTop,
      scrollLeft: target.scrollLeft,
      clientHeight: target.clientHeight,
      clientWidth: target.clientWidth,
      containerHeight: target.scrollHeight,
      containerWidth: target.scrollWidth
    };

    updateViewport(newViewport);
    onScroll?.(newViewport);
  }, [updateViewport, onScroll]);

  // 초기 뷰포트 설정
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      updateViewport({
        clientHeight: rect.height,
        clientWidth: rect.width,
        containerHeight: containerRef.current.scrollHeight,
        containerWidth: containerRef.current.scrollWidth
      });
    }
  }, [updateViewport]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        overflow: 'auto',
        height: '100%',
        width: '100%',
        ...style
      }}
      className={className}
    >
      {children}
    </div>
  );
};