/**
 * Enhanced Widget Registry
 * 엔터프라이즈급 위젯 레지스트리 - 동적 로딩, 플러그인, 버전 관리
 */

import type { WidgetConfig } from '../WidgetRegistry';

// 위젯 버전 정보
export interface WidgetVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
}

// 위젯 메타데이터
export interface WidgetMetadata {
  id: string;
  name: string;
  version: WidgetVersion;
  description: string;
  author: string;
  license: string;
  repository?: string;
  homepage?: string;
  keywords: string[];
  category: string;
  compatibility: {
    minPlatformVersion: string;
    maxPlatformVersion?: string;
    requiredFeatures: string[];
    optionalFeatures: string[];
  };
  dependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  size: {
    bundled: number;
    minified: number;
    gzipped: number;
  };
  performance: {
    initialLoad: number;
    renderTime: number;
    memoryUsage: number;
  };
  security: {
    permissions: string[];
    sandbox: boolean;
    csp: string[];
  };
}

// 위젯 번들
export interface WidgetBundle {
  metadata: WidgetMetadata;
  config: WidgetConfig;
  component: () => Promise<React.ComponentType<any>>;
  assets?: {
    styles: string[];
    scripts: string[];
    images: string[];
  };
  locales?: Record<string, any>;
  schema?: any; // JSON Schema for widget configuration
}

// 플러그인 인터페이스
export interface WidgetPlugin {
  id: string;
  name: string;
  version: WidgetVersion;
  description: string;
  hooks: {
    beforeLoad?: (metadata: WidgetMetadata) => Promise<void>;
    afterLoad?: (bundle: WidgetBundle) => Promise<void>;
    beforeUnload?: (metadata: WidgetMetadata) => Promise<void>;
    afterUnload?: (metadata: WidgetMetadata) => Promise<void>;
    onError?: (error: Error, metadata: WidgetMetadata) => Promise<void>;
  };
  transforms?: {
    config?: (config: WidgetConfig) => WidgetConfig;
    metadata?: (metadata: WidgetMetadata) => WidgetMetadata;
    component?: (Component: React.ComponentType<any>) => React.ComponentType<any>;
  };
}

// 로더 인터페이스
export interface WidgetLoader {
  canLoad(source: string): boolean;
  load(source: string, options?: any): Promise<WidgetBundle>;
  unload(id: string): Promise<void>;
  preload(source: string): Promise<void>;
}

// 레지스트리 이벤트
export type RegistryEvent =
  | 'widget:loading'
  | 'widget:loaded'
  | 'widget:unloading'
  | 'widget:unloaded'
  | 'widget:error'
  | 'plugin:installed'
  | 'plugin:uninstalled'
  | 'registry:updated';

// 로컬 파일 로더
class LocalFileLoader implements WidgetLoader {
  canLoad(source: string): boolean {
    return source.startsWith('./') || source.startsWith('/') || !source.includes('://');
  }

  async load(source: string): Promise<WidgetBundle> {
    try {
      const module = await import(source);

      if (!module.default) {
        throw new Error(`Widget module ${source} does not export default`);
      }

      const bundle = module.default as WidgetBundle;
      this.validateBundle(bundle);

      return bundle;
    } catch (error) {
      throw new Error(`Failed to load widget from ${source}: ${error}`);
    }
  }

  async unload(id: string): Promise<void> {
    // 로컬 모듈은 명시적 언로드가 어려움
    console.log(`Unloading local widget: ${id}`);
  }

  async preload(source: string): Promise<void> {
    // Preload hint 추가
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = source;
    document.head.appendChild(link);
  }

  private validateBundle(bundle: WidgetBundle): void {
    if (!bundle.metadata || !bundle.config || !bundle.component) {
      throw new Error('Invalid widget bundle structure');
    }
  }
}

// CDN 로더
class CDNLoader implements WidgetLoader {
  private cache = new Map<string, WidgetBundle>();

  canLoad(source: string): boolean {
    return source.startsWith('http://') || source.startsWith('https://');
  }

  async load(source: string, options?: { cache?: boolean }): Promise<WidgetBundle> {
    const useCache = options?.cache !== false;

    if (useCache && this.cache.has(source)) {
      return this.cache.get(source)!;
    }

    try {
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const bundleData = await response.json();
      const bundle = await this.parseBundle(bundleData, source);

      if (useCache) {
        this.cache.set(source, bundle);
      }

      return bundle;
    } catch (error) {
      throw new Error(`Failed to load widget from CDN ${source}: ${error}`);
    }
  }

  async unload(id: string): Promise<void> {
    // 캐시에서 제거
    for (const [source, bundle] of this.cache.entries()) {
      if (bundle.metadata.id === id) {
        this.cache.delete(source);
        break;
      }
    }
  }

  async preload(source: string): Promise<void> {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = source;
    document.head.appendChild(link);
  }

  private async parseBundle(data: any, source: string): Promise<WidgetBundle> {
    // CDN에서 받은 데이터를 WidgetBundle로 변환
    const bundle: WidgetBundle = {
      metadata: data.metadata,
      config: data.config,
      component: async () => {
        // 동적으로 컴포넌트 로드
        const componentModule = await import(data.componentUrl || `${source}/component.js`);
        return componentModule.default;
      },
      assets: data.assets,
      locales: data.locales,
      schema: data.schema
    };

    return bundle;
  }
}

// npm 패키지 로더
class NPMLoader implements WidgetLoader {
  canLoad(source: string): boolean {
    return source.startsWith('npm:') || source.includes('@');
  }

  async load(source: string): Promise<WidgetBundle> {
    const packageName = source.replace('npm:', '');

    try {
      // npm 패키지 동적 로드
      const module = await import(packageName);

      if (!module.WidgetBundle) {
        throw new Error(`Package ${packageName} does not export WidgetBundle`);
      }

      return module.WidgetBundle as WidgetBundle;
    } catch (error) {
      throw new Error(`Failed to load npm package ${packageName}: ${error}`);
    }
  }

  async unload(id: string): Promise<void> {
    console.log(`Unloading npm widget: ${id}`);
  }

  async preload(source: string): Promise<void> {
    // npm 패키지는 preload가 어려움
    console.log(`Preloading npm package: ${source}`);
  }
}

/**
 * 강화된 위젯 레지스트리
 */
export class EnhancedWidgetRegistry {
  private widgets = new Map<string, WidgetBundle>();
  private plugins = new Map<string, WidgetPlugin>();
  private loaders: WidgetLoader[] = [];
  private eventListeners = new Map<RegistryEvent, ((data: any) => void)[]>();
  private loadingPromises = new Map<string, Promise<WidgetBundle>>();
  private dependencyGraph = new Map<string, Set<string>>();
  private versionConstraints = new Map<string, string>();

  constructor() {
    this.initializeLoaders();
    this.setupSecurityPolicies();
  }

  /**
   * 로더 초기화
   */
  private initializeLoaders(): void {
    this.loaders = [
      new LocalFileLoader(),
      new CDNLoader(),
      new NPMLoader()
    ];
  }

  /**
   * 보안 정책 설정
   */
  private setupSecurityPolicies(): void {
    // CSP 설정
    this.setContentSecurityPolicy();

    // 허용된 도메인 목록
    this.setAllowedDomains();
  }

  /**
   * CSP 설정
   */
  private setContentSecurityPolicy(): void {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https: wss:",
      "font-src 'self' https://fonts.gstatic.com"
    ].join('; ');

    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = csp;
    document.head.appendChild(meta);
  }

  /**
   * 허용된 도메인 설정
   */
  private setAllowedDomains(): void {
    // 위젯 로딩이 허용된 도메인들
    const allowedDomains = [
      'cdn.jsdelivr.net',
      'unpkg.com',
      'widgets.company.com',
      'localhost'
    ];

    (window as any).__WIDGET_ALLOWED_DOMAINS__ = allowedDomains;
  }

  /**
   * 위젯 등록
   */
  async registerWidget(source: string, options?: {
    preload?: boolean;
    cache?: boolean;
    force?: boolean;
  }): Promise<WidgetBundle> {
    const { preload = false, cache = true, force = false } = options || {};

    // 이미 로딩 중인지 확인
    if (!force && this.loadingPromises.has(source)) {
      return this.loadingPromises.get(source)!;
    }

    // 이미 로드된 위젯인지 확인
    const existingBundle = Array.from(this.widgets.values())
      .find(bundle => bundle.metadata.repository === source);

    if (!force && existingBundle) {
      return existingBundle;
    }

    const loadingPromise = this.loadWidget(source, { preload, cache });
    this.loadingPromises.set(source, loadingPromise);

    try {
      const bundle = await loadingPromise;
      this.widgets.set(bundle.metadata.id, bundle);

      // 의존성 등록
      this.registerDependencies(bundle);

      // 이벤트 발행
      this.emit('widget:loaded', { bundle, source });

      return bundle;
    } catch (error) {
      this.emit('widget:error', { error, source });
      throw error;
    } finally {
      this.loadingPromises.delete(source);
    }
  }

  /**
   * 위젯 로드
   */
  private async loadWidget(source: string, options: {
    preload?: boolean;
    cache?: boolean;
  }): Promise<WidgetBundle> {
    this.emit('widget:loading', { source });

    // 적절한 로더 찾기
    const loader = this.loaders.find(l => l.canLoad(source));
    if (!loader) {
      throw new Error(`No loader available for source: ${source}`);
    }

    // 보안 검사
    await this.performSecurityCheck(source);

    // Preload
    if (options.preload) {
      await loader.preload(source);
    }

    // 실제 로드
    const bundle = await loader.load(source, options);

    // 버전 호환성 검사
    this.checkCompatibility(bundle.metadata);

    // 플러그인 훅 실행
    await this.executePluginHooks('beforeLoad', bundle.metadata);

    // 에셋 로드
    if (bundle.assets) {
      await this.loadAssets(bundle.assets);
    }

    // 플러그인 변환 적용
    this.applyPluginTransforms(bundle);

    await this.executePluginHooks('afterLoad', bundle);

    return bundle;
  }

  /**
   * 보안 검사
   */
  private async performSecurityCheck(source: string): Promise<void> {
    const allowedDomains = (window as any).__WIDGET_ALLOWED_DOMAINS__ || [];

    try {
      const url = new URL(source, window.location.origin);
      const isAllowed = allowedDomains.some((domain: string) =>
        url.hostname === domain || url.hostname.endsWith(`.${domain}`)
      );

      if (!isAllowed && url.protocol.startsWith('http')) {
        throw new Error(`Domain ${url.hostname} is not in allowed list`);
      }
    } catch (error) {
      if (error instanceof TypeError) {
        // 상대 경로나 로컬 파일은 허용
        return;
      }
      throw error;
    }
  }

  /**
   * 호환성 검사
   */
  private checkCompatibility(metadata: WidgetMetadata): void {
    const platformVersion = this.getPlatformVersion();
    const { minPlatformVersion, maxPlatformVersion } = metadata.compatibility;

    if (this.compareVersions(platformVersion, minPlatformVersion) < 0) {
      throw new Error(
        `Widget requires platform version ${minPlatformVersion} or higher, current: ${platformVersion}`
      );
    }

    if (maxPlatformVersion && this.compareVersions(platformVersion, maxPlatformVersion) > 0) {
      throw new Error(
        `Widget requires platform version ${maxPlatformVersion} or lower, current: ${platformVersion}`
      );
    }

    // 필수 기능 확인
    const missingFeatures = metadata.compatibility.requiredFeatures.filter(
      feature => !this.isPlatformFeatureAvailable(feature)
    );

    if (missingFeatures.length > 0) {
      throw new Error(`Missing required platform features: ${missingFeatures.join(', ')}`);
    }
  }

  /**
   * 에셋 로드
   */
  private async loadAssets(assets: NonNullable<WidgetBundle['assets']>): Promise<void> {
    const loadPromises: Promise<void>[] = [];

    // 스타일시트 로드
    if (assets.styles) {
      assets.styles.forEach(styleUrl => {
        loadPromises.push(this.loadStylesheet(styleUrl));
      });
    }

    // 스크립트 로드
    if (assets.scripts) {
      assets.scripts.forEach(scriptUrl => {
        loadPromises.push(this.loadScript(scriptUrl));
      });
    }

    // 이미지 프리로드
    if (assets.images) {
      assets.images.forEach(imageUrl => {
        loadPromises.push(this.preloadImage(imageUrl));
      });
    }

    await Promise.all(loadPromises);
  }

  /**
   * 스타일시트 로드
   */
  private loadStylesheet(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load stylesheet: ${url}`));
      document.head.appendChild(link);
    });
  }

  /**
   * 스크립트 로드
   */
  private loadScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
      document.head.appendChild(script);
    });
  }

  /**
   * 이미지 프리로드
   */
  private preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to preload image: ${url}`));
      img.src = url;
    });
  }

  /**
   * 의존성 등록
   */
  private registerDependencies(bundle: WidgetBundle): void {
    const { id } = bundle.metadata;
    const dependencies = new Set<string>();

    // package.json 스타일 의존성
    Object.keys(bundle.metadata.dependencies || {}).forEach(dep => {
      dependencies.add(dep);
    });

    // peer dependencies
    Object.keys(bundle.metadata.peerDependencies || {}).forEach(dep => {
      dependencies.add(dep);
    });

    this.dependencyGraph.set(id, dependencies);
  }

  /**
   * 플러그인 설치
   */
  async installPlugin(plugin: WidgetPlugin): Promise<void> {
    // 버전 충돌 검사
    const existing = this.plugins.get(plugin.id);
    if (existing && this.compareVersions(
      this.versionToString(existing.version),
      this.versionToString(plugin.version)
    ) > 0) {
      throw new Error(`Plugin ${plugin.id} version conflict`);
    }

    this.plugins.set(plugin.id, plugin);
    this.emit('plugin:installed', { plugin });
  }

  /**
   * 플러그인 제거
   */
  async uninstallPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    this.plugins.delete(pluginId);
    this.emit('plugin:uninstalled', { plugin });
  }

  /**
   * 플러그인 훅 실행
   */
  private async executePluginHooks(
    hookName: keyof WidgetPlugin['hooks'],
    data: any
  ): Promise<void> {
    const promises = Array.from(this.plugins.values())
      .map(plugin => plugin.hooks[hookName])
      .filter(hook => typeof hook === 'function')
      .map(hook => hook!(data));

    await Promise.all(promises);
  }

  /**
   * 플러그인 변환 적용
   */
  private applyPluginTransforms(bundle: WidgetBundle): void {
    for (const plugin of this.plugins.values()) {
      if (!plugin.transforms) continue;

      if (plugin.transforms.metadata) {
        bundle.metadata = plugin.transforms.metadata(bundle.metadata);
      }

      if (plugin.transforms.config) {
        bundle.config = plugin.transforms.config(bundle.config);
      }

      if (plugin.transforms.component) {
        const originalComponent = bundle.component;
        bundle.component = async () => {
          const Component = await originalComponent();
          return plugin.transforms!.component!(Component);
        };
      }
    }
  }

  /**
   * 위젯 언로드
   */
  async unregisterWidget(widgetId: string): Promise<void> {
    const bundle = this.widgets.get(widgetId);
    if (!bundle) {
      throw new Error(`Widget ${widgetId} not found`);
    }

    this.emit('widget:unloading', { bundle });

    await this.executePluginHooks('beforeUnload', bundle.metadata);

    // 의존하는 위젯들 확인
    const dependents = this.getDependents(widgetId);
    if (dependents.length > 0) {
      throw new Error(
        `Cannot unload widget ${widgetId}. Dependents: ${dependents.join(', ')}`
      );
    }

    // 로더로 언로드
    const loader = this.loaders.find(l => l.canLoad(bundle.metadata.repository || ''));
    if (loader) {
      await loader.unload(widgetId);
    }

    this.widgets.delete(widgetId);
    this.dependencyGraph.delete(widgetId);

    await this.executePluginHooks('afterUnload', bundle.metadata);

    this.emit('widget:unloaded', { bundle });
  }

  /**
   * 의존하는 위젯들 조회
   */
  private getDependents(widgetId: string): string[] {
    const dependents: string[] = [];

    for (const [id, dependencies] of this.dependencyGraph.entries()) {
      if (dependencies.has(widgetId)) {
        dependents.push(id);
      }
    }

    return dependents;
  }

  /**
   * 위젯 조회
   */
  getWidget(widgetId: string): WidgetBundle | undefined {
    return this.widgets.get(widgetId);
  }

  /**
   * 모든 위젯 조회
   */
  getAllWidgets(): WidgetBundle[] {
    return Array.from(this.widgets.values());
  }

  /**
   * 위젯 검색
   */
  searchWidgets(query: {
    category?: string;
    keywords?: string[];
    author?: string;
    version?: string;
  }): WidgetBundle[] {
    return this.getAllWidgets().filter(bundle => {
      const metadata = bundle.metadata;

      if (query.category && metadata.category !== query.category) {
        return false;
      }

      if (query.author && metadata.author !== query.author) {
        return false;
      }

      if (query.keywords) {
        const hasAllKeywords = query.keywords.every(keyword =>
          metadata.keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase()))
        );
        if (!hasAllKeywords) {
          return false;
        }
      }

      if (query.version) {
        const versionString = this.versionToString(metadata.version);
        if (!versionString.includes(query.version)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * 이벤트 구독
   */
  on(event: RegistryEvent, listener: (data: any) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);

    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * 이벤트 발행
   */
  private emit(event: RegistryEvent, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in registry event listener for ${event}:`, error);
      }
    });
  }

  /**
   * 플랫폼 버전 조회
   */
  private getPlatformVersion(): string {
    return process.env.REACT_APP_VERSION || '1.0.0';
  }

  /**
   * 플랫폼 기능 확인
   */
  private isPlatformFeatureAvailable(feature: string): boolean {
    const availableFeatures = [
      'drag-drop',
      'data-binding',
      'real-time',
      'notifications',
      'charts',
      'theming',
      'i18n',
      'performance-monitoring'
    ];

    return availableFeatures.includes(feature);
  }

  /**
   * 버전 비교
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }

    return 0;
  }

  /**
   * 버전 객체를 문자열로 변환
   */
  private versionToString(version: WidgetVersion): string {
    let versionString = `${version.major}.${version.minor}.${version.patch}`;

    if (version.prerelease) {
      versionString += `-${version.prerelease}`;
    }

    if (version.build) {
      versionString += `+${version.build}`;
    }

    return versionString;
  }

  /**
   * 레지스트리 상태 조회
   */
  getStats(): {
    totalWidgets: number;
    totalPlugins: number;
    loadingWidgets: number;
    categories: Record<string, number>;
    memoryUsage: number;
  } {
    const categories: Record<string, number> = {};
    let totalSize = 0;

    this.widgets.forEach(bundle => {
      const category = bundle.metadata.category;
      categories[category] = (categories[category] || 0) + 1;
      totalSize += bundle.metadata.size?.bundled || 0;
    });

    return {
      totalWidgets: this.widgets.size,
      totalPlugins: this.plugins.size,
      loadingWidgets: this.loadingPromises.size,
      categories,
      memoryUsage: totalSize
    };
  }

  /**
   * 캐시 정리
   */
  clearCache(): void {
    // CDN 로더 캐시 정리
    const cdnLoader = this.loaders.find(l => l instanceof CDNLoader) as CDNLoader;
    if (cdnLoader) {
      (cdnLoader as any).cache.clear();
    }
  }
}

// 싱글톤 인스턴스
export const enhancedWidgetRegistry = new EnhancedWidgetRegistry();

// 개발 모드에서 전역 접근 가능
if (process.env.NODE_ENV === 'development') {
  (window as any).enhancedWidgetRegistry = enhancedWidgetRegistry;
}