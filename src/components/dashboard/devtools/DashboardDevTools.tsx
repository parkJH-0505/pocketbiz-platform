import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  createContext,
  useContext
} from 'react';

export interface DevToolsConfig {
  enabled: boolean;
  position: 'bottom' | 'right' | 'top' | 'left';
  size: 'small' | 'medium' | 'large';
  theme: 'light' | 'dark' | 'auto';
  persistState: boolean;
  enableLogs: boolean;
  enablePerformance: boolean;
  enableAccessibility: boolean;
  enableNetworkMonitor: boolean;
  enableWidgetInspector: boolean;
  hotkeysEnabled: boolean;
}

export interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryUsage: number;
  reRenderCount: number;
  bundleSize: number;
  networkRequests: number;
  cacheHitRate: number;
  errorCount: number;
  warningCount: number;
  lastUpdate: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  message: string;
  data?: any;
  source: string;
  stackTrace?: string;
}

export interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  status: number;
  statusText: string;
  duration: number;
  size: number;
  timestamp: number;
  headers: Record<string, string>;
  responseData?: any;
  errorMessage?: string;
}

export interface WidgetInspectionData {
  id: string;
  name: string;
  type: string;
  props: any;
  state: any;
  performance: {
    renderCount: number;
    averageRenderTime: number;
    lastRenderTime: number;
    memoryUsage: number;
  };
  errors: string[];
  warnings: string[];
  accessibility: {
    violations: any[];
    score: number;
  };
  dependencies: string[];
  dataSource: any;
}

export interface AccessibilityReport {
  score: number;
  violations: any[];
  suggestions: string[];
  automated: boolean;
  lastChecked: number;
}

interface DevToolsContextValue {
  config: DevToolsConfig;
  updateConfig: (updates: Partial<DevToolsConfig>) => void;
  log: (level: LogEntry['level'], message: string, data?: any, category?: string) => void;
  getPerformanceMetrics: () => PerformanceMetrics;
  getNetworkRequests: () => NetworkRequest[];
  inspectWidget: (widgetId: string) => WidgetInspectionData | null;
  runAccessibilityAudit: () => Promise<AccessibilityReport>;
  exportLogs: (format: 'json' | 'csv' | 'txt') => string;
  clearLogs: () => void;
  toggle: () => void;
}

const DevToolsContext = createContext<DevToolsContextValue | null>(null);

export const useDevTools = () => {
  const context = useContext(DevToolsContext);
  if (!context) {
    throw new Error('useDevTools must be used within DevToolsProvider');
  }
  return context;
};

export class DashboardDevTools {
  private config: DevToolsConfig;
  private logs: LogEntry[] = [];
  private networkRequests: NetworkRequest[] = [];
  private performanceMetrics: PerformanceMetrics;
  private widgetRegistry = new Map<string, WidgetInspectionData>();
  private observers: Set<(type: string, data: any) => void> = new Set();
  private performanceObserver: PerformanceObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private originalConsole: typeof console;
  private interceptors: Map<string, any> = new Map();

  constructor(config: Partial<DevToolsConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      position: 'bottom',
      size: 'medium',
      theme: 'auto',
      persistState: true,
      enableLogs: true,
      enablePerformance: true,
      enableAccessibility: true,
      enableNetworkMonitor: true,
      enableWidgetInspector: true,
      hotkeysEnabled: true,
      ...config
    };

    this.performanceMetrics = {
      renderTime: 0,
      componentCount: 0,
      memoryUsage: 0,
      reRenderCount: 0,
      bundleSize: 0,
      networkRequests: 0,
      cacheHitRate: 0,
      errorCount: 0,
      warningCount: 0,
      lastUpdate: Date.now()
    };

    this.originalConsole = { ...console };

    if (this.config.enabled) {
      this.initialize();
    }
  }

  /**
   * DevTools 초기화
   */
  private initialize(): void {
    this.setupConsoleInterception();
    this.setupNetworkInterception();
    this.setupPerformanceMonitoring();
    this.setupAccessibilityMonitoring();
    this.setupWidgetInspection();
    this.setupHotkeys();
    this.loadPersistedState();
  }

  /**
   * 콘솔 인터셉션 설정
   */
  private setupConsoleInterception(): void {
    if (!this.config.enableLogs) return;

    const interceptMethods: (keyof Console)[] = ['log', 'info', 'warn', 'error', 'debug'];

    interceptMethods.forEach(method => {
      const originalMethod = this.originalConsole[method];

      (console as any)[method] = (...args: any[]) => {
        // 원본 콘솔 메서드 호출
        originalMethod.apply(console, args);

        // DevTools 로그에 추가
        this.addLog(
          method === 'log' ? 'info' : method as LogEntry['level'],
          args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' '),
          args.length > 1 ? args.slice(1) : undefined,
          'console'
        );
      };
    });
  }

  /**
   * 네트워크 인터셉션 설정
   */
  private setupNetworkInterception(): void {
    if (!this.config.enableNetworkMonitor) return;

    // Fetch API 인터셉션
    const originalFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
      const startTime = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      const method = args[1]?.method || 'GET';

      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();

        this.addNetworkRequest({
          id: this.generateId(),
          url,
          method,
          status: response.status,
          statusText: response.statusText,
          duration: endTime - startTime,
          size: parseInt(response.headers.get('content-length') || '0', 10),
          timestamp: Date.now(),
          headers: Object.fromEntries(response.headers.entries())
        });

        return response;
      } catch (error) {
        const endTime = performance.now();

        this.addNetworkRequest({
          id: this.generateId(),
          url,
          method,
          status: 0,
          statusText: 'Error',
          duration: endTime - startTime,
          size: 0,
          timestamp: Date.now(),
          headers: {},
          errorMessage: (error as Error).message
        });

        throw error;
      }
    };

    // XMLHttpRequest 인터셉션
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
      (this as any)._devtools = {
        method,
        url: url.toString(),
        startTime: 0
      };
      return originalXHROpen.call(this, method, url, ...args);
    };

    XMLHttpRequest.prototype.send = function(body?: any) {
      const devtools = (this as any)._devtools;
      if (devtools) {
        devtools.startTime = performance.now();

        this.addEventListener('loadend', () => {
          const endTime = performance.now();
          DashboardDevTools.getInstance()?.addNetworkRequest({
            id: DashboardDevTools.getInstance()?.generateId() || '',
            url: devtools.url,
            method: devtools.method,
            status: this.status,
            statusText: this.statusText,
            duration: endTime - devtools.startTime,
            size: parseInt(this.getResponseHeader('content-length') || '0', 10),
            timestamp: Date.now(),
            headers: this.getAllResponseHeaders()
              .split('\r\n')
              .reduce((acc: Record<string, string>, line) => {
                const [key, value] = line.split(': ');
                if (key && value) acc[key] = value;
                return acc;
              }, {})
          });
        });
      }

      return originalXHRSend.call(this, body);
    };
  }

  /**
   * 성능 모니터링 설정
   */
  private setupPerformanceMonitoring(): void {
    if (!this.config.enablePerformance) return;

    // Performance Observer 설정
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            this.updatePerformanceMetrics({
              renderTime: entry.duration
            });
          } else if (entry.entryType === 'measure') {
            this.updatePerformanceMetrics({
              renderTime: entry.duration
            });
          }
        });
      });

      this.performanceObserver.observe({
        entryTypes: ['navigation', 'measure', 'paint']
      });
    }

    // 메모리 사용량 모니터링
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.updatePerformanceMetrics({
          memoryUsage: memory.usedJSHeapSize
        });
      }, 5000);
    }

    // Component re-render 추적
    this.setupReactDevToolsIntegration();
  }

  /**
   * React DevTools 통합
   */
  private setupReactDevToolsIntegration(): void {
    // React Fiber 추적을 위한 커스텀 로직
    if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;

      hook.onCommitFiberRoot = (id: any, root: any, priorityLevel: any) => {
        this.updatePerformanceMetrics({
          reRenderCount: this.performanceMetrics.reRenderCount + 1
        });
      };
    }
  }

  /**
   * 접근성 모니터링 설정
   */
  private setupAccessibilityMonitoring(): void {
    if (!this.config.enableAccessibility) return;

    // DOM 변경 감시
    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.auditElementAccessibility(node as HTMLElement);
            }
          });
        }
      });
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-*', 'role', 'tabindex']
    });
  }

  /**
   * 위젯 검사 설정
   */
  private setupWidgetInspection(): void {
    if (!this.config.enableWidgetInspector) return;

    // 위젯 등록 감시
    this.setupWidgetRegistryWatcher();
  }

  /**
   * 핫키 설정
   */
  private setupHotkeys(): void {
    if (!this.config.hotkeysEnabled) return;

    document.addEventListener('keydown', (event) => {
      // Ctrl+Shift+D: DevTools 토글
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        this.notifyObservers('toggle', {});
      }

      // Ctrl+Shift+L: 로그 클리어
      if (event.ctrlKey && event.shiftKey && event.key === 'L') {
        event.preventDefault();
        this.clearLogs();
      }

      // Ctrl+Shift+P: 성능 리포트
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        this.generatePerformanceReport();
      }
    });
  }

  /**
   * 로그 추가
   */
  private addLog(
    level: LogEntry['level'],
    message: string,
    data?: any,
    category: string = 'general'
  ): void {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
      source: this.getCallStack(),
      stackTrace: level === 'error' ? new Error().stack : undefined
    };

    this.logs.push(entry);

    // 로그 개수 제한
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-500);
    }

    // 통계 업데이트
    if (level === 'error') {
      this.performanceMetrics.errorCount++;
    } else if (level === 'warn') {
      this.performanceMetrics.warningCount++;
    }

    this.notifyObservers('log', entry);
  }

  /**
   * 네트워크 요청 추가
   */
  private addNetworkRequest(request: NetworkRequest): void {
    this.networkRequests.push(request);

    // 요청 개수 제한
    if (this.networkRequests.length > 100) {
      this.networkRequests = this.networkRequests.slice(-50);
    }

    this.updatePerformanceMetrics({
      networkRequests: this.performanceMetrics.networkRequests + 1
    });

    this.notifyObservers('network', request);
  }

  /**
   * 성능 메트릭 업데이트
   */
  private updatePerformanceMetrics(updates: Partial<PerformanceMetrics>): void {
    this.performanceMetrics = {
      ...this.performanceMetrics,
      ...updates,
      lastUpdate: Date.now()
    };

    this.notifyObservers('performance', this.performanceMetrics);
  }

  /**
   * 요소 접근성 감사
   */
  private auditElementAccessibility(element: HTMLElement): void {
    const violations: string[] = [];

    // 이미지 alt 속성 확인
    if (element.tagName === 'IMG' && !element.getAttribute('alt')) {
      violations.push('Missing alt attribute on image');
    }

    // 폼 라벨 확인
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
      const hasLabel = this.hasAssociatedLabel(element);
      const hasAriaLabel = element.hasAttribute('aria-label');

      if (!hasLabel && !hasAriaLabel) {
        violations.push('Form control missing label');
      }
    }

    // 위젯에 접근성 정보 추가
    const widgetId = element.getAttribute('data-widget-id');
    if (widgetId && violations.length > 0) {
      const widgetData = this.widgetRegistry.get(widgetId);
      if (widgetData) {
        widgetData.accessibility.violations.push(...violations);
        this.updateWidgetData(widgetId, widgetData);
      }
    }
  }

  /**
   * 라벨 연결 확인
   */
  private hasAssociatedLabel(element: HTMLElement): boolean {
    const id = element.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return true;
    }

    const parentLabel = element.closest('label');
    return parentLabel !== null;
  }

  /**
   * 위젯 레지스트리 감시 설정
   */
  private setupWidgetRegistryWatcher(): void {
    // 위젯 등록/해제 감시를 위한 커스텀 이벤트 리스너
    window.addEventListener('widget-registered', (event: any) => {
      this.registerWidget(event.detail);
    });

    window.addEventListener('widget-unregistered', (event: any) => {
      this.unregisterWidget(event.detail.id);
    });
  }

  /**
   * 위젯 등록
   */
  private registerWidget(widgetData: Partial<WidgetInspectionData>): void {
    const data: WidgetInspectionData = {
      id: widgetData.id || this.generateId(),
      name: widgetData.name || 'Unknown Widget',
      type: widgetData.type || 'unknown',
      props: widgetData.props || {},
      state: widgetData.state || {},
      performance: {
        renderCount: 0,
        averageRenderTime: 0,
        lastRenderTime: 0,
        memoryUsage: 0,
        ...widgetData.performance
      },
      errors: widgetData.errors || [],
      warnings: widgetData.warnings || [],
      accessibility: {
        violations: [],
        score: 100,
        ...widgetData.accessibility
      },
      dependencies: widgetData.dependencies || [],
      dataSource: widgetData.dataSource
    };

    this.widgetRegistry.set(data.id, data);
    this.updatePerformanceMetrics({
      componentCount: this.widgetRegistry.size
    });

    this.notifyObservers('widget-registered', data);
  }

  /**
   * 위젯 등록 해제
   */
  private unregisterWidget(widgetId: string): void {
    this.widgetRegistry.delete(widgetId);
    this.updatePerformanceMetrics({
      componentCount: this.widgetRegistry.size
    });

    this.notifyObservers('widget-unregistered', { id: widgetId });
  }

  /**
   * 위젯 데이터 업데이트
   */
  private updateWidgetData(widgetId: string, updates: Partial<WidgetInspectionData>): void {
    const existing = this.widgetRegistry.get(widgetId);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.widgetRegistry.set(widgetId, updated);
      this.notifyObservers('widget-updated', updated);
    }
  }

  /**
   * 호출 스택 가져오기
   */
  private getCallStack(): string {
    const stack = new Error().stack || '';
    const lines = stack.split('\n');
    return lines.slice(3, 5).join('\n'); // 첫 2-3줄은 DevTools 자체 호출
  }

  /**
   * ID 생성
   */
  private generateId(): string {
    return `devtools_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 성능 리포트 생성
   */
  private generatePerformanceReport(): void {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.performanceMetrics,
      widgets: Array.from(this.widgetRegistry.values()),
      networkRequests: this.networkRequests.slice(-10),
      recentLogs: this.logs.slice(-20)
    };

    this.addLog('info', 'Performance report generated', report, 'performance');
  }

  /**
   * 지속 상태 로드
   */
  private loadPersistedState(): void {
    if (!this.config.persistState) return;

    try {
      const saved = localStorage.getItem('dashboard-devtools-state');
      if (saved) {
        const state = JSON.parse(saved);
        if (state.logs) {
          this.logs = state.logs;
        }
        if (state.config) {
          this.config = { ...this.config, ...state.config };
        }
      }
    } catch (error) {
      this.addLog('warn', 'Failed to load persisted DevTools state', error);
    }
  }

  /**
   * 상태 지속
   */
  private persistState(): void {
    if (!this.config.persistState) return;

    try {
      const state = {
        logs: this.logs.slice(-100), // 최근 100개만 저장
        config: this.config
      };
      localStorage.setItem('dashboard-devtools-state', JSON.stringify(state));
    } catch (error) {
      this.addLog('warn', 'Failed to persist DevTools state', error);
    }
  }

  /**
   * 옵저버 알림
   */
  private notifyObservers(type: string, data: any): void {
    this.observers.forEach(observer => observer(type, data));
  }

  // Public API 메서드들
  updateConfig(updates: Partial<DevToolsConfig>): void {
    this.config = { ...this.config, ...updates };
    this.persistState();
    this.notifyObservers('config-updated', this.config);
  }

  log(level: LogEntry['level'], message: string, data?: any, category: string = 'user'): void {
    this.addLog(level, message, data, category);
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  getNetworkRequests(): NetworkRequest[] {
    return [...this.networkRequests];
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  inspectWidget(widgetId: string): WidgetInspectionData | null {
    return this.widgetRegistry.get(widgetId) || null;
  }

  getAllWidgets(): WidgetInspectionData[] {
    return Array.from(this.widgetRegistry.values());
  }

  async runAccessibilityAudit(): Promise<AccessibilityReport> {
    const violations: any[] = [];
    let score = 100;

    // 간단한 접근성 감사 로직
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.getAttribute('alt')) {
        violations.push({
          element: img,
          rule: 'img-alt',
          message: 'Image missing alt attribute'
        });
        score -= 5;
      }
    });

    const formControls = document.querySelectorAll('input, select, textarea');
    formControls.forEach(control => {
      if (!this.hasAssociatedLabel(control as HTMLElement)) {
        violations.push({
          element: control,
          rule: 'form-label',
          message: 'Form control missing label'
        });
        score -= 3;
      }
    });

    const report: AccessibilityReport = {
      score: Math.max(0, score),
      violations,
      suggestions: violations.map(v => v.message),
      automated: true,
      lastChecked: Date.now()
    };

    this.addLog('info', 'Accessibility audit completed', report, 'accessibility');
    return report;
  }

  exportLogs(format: 'json' | 'csv' | 'txt' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(this.logs, null, 2);

      case 'csv':
        const headers = 'Timestamp,Level,Category,Message,Source\n';
        const rows = this.logs.map(log =>
          `${new Date(log.timestamp).toISOString()},${log.level},${log.category},"${log.message}","${log.source}"`
        ).join('\n');
        return headers + rows;

      case 'txt':
        return this.logs.map(log =>
          `[${new Date(log.timestamp).toISOString()}] ${log.level.toUpperCase()} (${log.category}): ${log.message}`
        ).join('\n');

      default:
        return this.exportLogs('json');
    }
  }

  clearLogs(): void {
    this.logs = [];
    this.addLog('info', 'Logs cleared', undefined, 'system');
  }

  addObserver(observer: (type: string, data: any) => void): void {
    this.observers.add(observer);
  }

  removeObserver(observer: (type: string, data: any) => void): void {
    this.observers.delete(observer);
  }

  dispose(): void {
    // 원본 콘솔 메서드 복원
    Object.assign(console, this.originalConsole);

    // 옵저버 정리
    this.performanceObserver?.disconnect();
    this.mutationObserver?.disconnect();

    // 인터셉터 정리
    this.interceptors.clear();

    // 상태 지속
    this.persistState();

    // 옵저버 정리
    this.observers.clear();
  }

  // 싱글톤 인스턴스
  private static instance: DashboardDevTools | null = null;

  static getInstance(): DashboardDevTools | null {
    return this.instance;
  }

  static setInstance(instance: DashboardDevTools): void {
    this.instance = instance;
  }
}

// React Provider 컴포넌트
interface DevToolsProviderProps {
  children: React.ReactNode;
  config?: Partial<DevToolsConfig>;
}

export const DevToolsProvider: React.FC<DevToolsProviderProps> = ({
  children,
  config
}) => {
  const devToolsRef = useRef<DashboardDevTools>();

  useEffect(() => {
    devToolsRef.current = new DashboardDevTools(config);
    DashboardDevTools.setInstance(devToolsRef.current);

    return () => {
      devToolsRef.current?.dispose();
      DashboardDevTools.setInstance(null!);
    };
  }, [config]);

  const contextValue: DevToolsContextValue = useMemo(() => ({
    config: devToolsRef.current?.config || {} as DevToolsConfig,
    updateConfig: (updates: Partial<DevToolsConfig>) =>
      devToolsRef.current?.updateConfig(updates),
    log: (level: LogEntry['level'], message: string, data?: any, category?: string) =>
      devToolsRef.current?.log(level, message, data, category),
    getPerformanceMetrics: () => devToolsRef.current?.getPerformanceMetrics() || {} as PerformanceMetrics,
    getNetworkRequests: () => devToolsRef.current?.getNetworkRequests() || [],
    inspectWidget: (widgetId: string) => devToolsRef.current?.inspectWidget(widgetId) || null,
    runAccessibilityAudit: () => devToolsRef.current?.runAccessibilityAudit() || Promise.resolve({} as AccessibilityReport),
    exportLogs: (format: 'json' | 'csv' | 'txt') => devToolsRef.current?.exportLogs(format) || '',
    clearLogs: () => devToolsRef.current?.clearLogs(),
    toggle: () => devToolsRef.current?.notifyObservers('toggle', {})
  }), []);

  return (
    <DevToolsContext.Provider value={contextValue}>
      {children}
    </DevToolsContext.Provider>
  );
};

// DevTools UI 컴포넌트
interface DevToolsUIProps {
  visible: boolean;
  onToggle: () => void;
}

export const DevToolsUI: React.FC<DevToolsUIProps> = ({ visible, onToggle }) => {
  const { config, getPerformanceMetrics, getNetworkRequests, runAccessibilityAudit } = useDevTools();
  const [activeTab, setActiveTab] = useState('console');
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    if (visible) {
      setPerformanceData(getPerformanceMetrics());
    }
  }, [visible, getPerformanceMetrics]);

  if (!visible) return null;

  const tabStyle = {
    padding: '8px 16px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    borderBottom: '2px solid transparent'
  };

  const activeTabStyle = {
    ...tabStyle,
    borderBottomColor: '#007bff',
    fontWeight: 'bold'
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '400px',
      backgroundColor: config.theme === 'dark' ? '#1e1e1e' : '#ffffff',
      border: '1px solid #ccc',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        borderBottom: '1px solid #ccc',
        backgroundColor: config.theme === 'dark' ? '#2d2d2d' : '#f5f5f5'
      }}>
        <div style={{ display: 'flex' }}>
          {['console', 'network', 'performance', 'accessibility', 'widgets'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={activeTab === tab ? activeTabStyle : tabStyle}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={onToggle}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer'
          }}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px'
      }}>
        {activeTab === 'console' && <ConsoleTab />}
        {activeTab === 'network' && <NetworkTab />}
        {activeTab === 'performance' && <PerformanceTab data={performanceData} />}
        {activeTab === 'accessibility' && <AccessibilityTab />}
        {activeTab === 'widgets' && <WidgetsTab />}
      </div>
    </div>
  );
};

// Tab 컴포넌트들
const ConsoleTab: React.FC = () => {
  const { log, clearLogs, exportLogs } = useDevTools();

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <button onClick={() => log('info', 'Test log message')}>Add Test Log</button>
        <button onClick={clearLogs} style={{ marginLeft: '8px' }}>Clear</button>
        <button onClick={() => console.log(exportLogs('json'))} style={{ marginLeft: '8px' }}>Export</button>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
        {/* 로그 목록 렌더링 */}
        <p>Console logs will appear here...</p>
      </div>
    </div>
  );
};

const NetworkTab: React.FC = () => {
  const { getNetworkRequests } = useDevTools();
  const requests = getNetworkRequests();

  return (
    <div>
      <h3>Network Requests ({requests.length})</h3>
      <div style={{ fontSize: '12px' }}>
        {requests.map(request => (
          <div key={request.id} style={{ marginBottom: '8px', padding: '8px', border: '1px solid #eee' }}>
            <strong>{request.method} {request.url}</strong>
            <br />
            Status: {request.status} | Duration: {request.duration.toFixed(2)}ms
          </div>
        ))}
      </div>
    </div>
  );
};

const PerformanceTab: React.FC<{ data: PerformanceMetrics | null }> = ({ data }) => {
  if (!data) return <div>Loading performance data...</div>;

  return (
    <div>
      <h3>Performance Metrics</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div>
          <strong>Render Time:</strong> {data.renderTime.toFixed(2)}ms
        </div>
        <div>
          <strong>Component Count:</strong> {data.componentCount}
        </div>
        <div>
          <strong>Memory Usage:</strong> {(data.memoryUsage / 1024 / 1024).toFixed(2)}MB
        </div>
        <div>
          <strong>Re-renders:</strong> {data.reRenderCount}
        </div>
        <div>
          <strong>Network Requests:</strong> {data.networkRequests}
        </div>
        <div>
          <strong>Error Count:</strong> {data.errorCount}
        </div>
      </div>
    </div>
  );
};

const AccessibilityTab: React.FC = () => {
  const { runAccessibilityAudit } = useDevTools();
  const [report, setReport] = useState<AccessibilityReport | null>(null);

  const handleAudit = async () => {
    const result = await runAccessibilityAudit();
    setReport(result);
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <button onClick={handleAudit}>Run Accessibility Audit</button>
      </div>
      {report && (
        <div>
          <h3>Accessibility Score: {report.score}/100</h3>
          <div>
            <strong>Violations:</strong> {report.violations.length}
          </div>
          {report.suggestions.map((suggestion, index) => (
            <div key={index} style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff3cd' }}>
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const WidgetsTab: React.FC = () => {
  const { inspectWidget } = useDevTools();

  return (
    <div>
      <h3>Widget Inspector</h3>
      <p>Select a widget to inspect its properties, state, and performance metrics.</p>
    </div>
  );
};