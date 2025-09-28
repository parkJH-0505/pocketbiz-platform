/**
 * Widget Data Source Manager
 * 위젯 데이터 소스 관리 시스템
 */

import { widgetEventBus, WidgetEventTypes } from '../widgets/WidgetEventBus';

// 데이터 소스 타입
export type DataSourceType = 'rest' | 'graphql' | 'websocket' | 'static' | 'computed';

// HTTP 메소드
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// 인증 타입
export type AuthType = 'none' | 'bearer' | 'apikey' | 'basic' | 'oauth2';

// 데이터 소스 설정
export interface DataSourceConfig {
  id: string;
  name: string;
  type: DataSourceType;
  endpoint?: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: any;
  auth?: {
    type: AuthType;
    token?: string;
    apiKey?: string;
    username?: string;
    password?: string;
    oauth?: {
      clientId: string;
      clientSecret: string;
      tokenUrl: string;
      scope?: string;
    };
  };
  polling?: {
    enabled: boolean;
    interval: number; // ms
  };
  retry?: {
    attempts: number;
    delay: number; // ms
    backoff: 'linear' | 'exponential';
  };
  transform?: string; // JavaScript 함수 문자열
  cache?: {
    enabled: boolean;
    ttl: number; // seconds
    key?: string;
  };
}

// 데이터 소스 응답
export interface DataSourceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
  cached?: boolean;
  latency?: number;
}

// 데이터 소스 상태
export interface DataSourceState {
  loading: boolean;
  error?: string;
  lastFetch?: number;
  lastSuccess?: number;
  fetchCount: number;
  errorCount: number;
}

/**
 * 데이터 소스 매니저 클래스
 */
export class WidgetDataSourceManager {
  private dataSources: Map<string, DataSourceConfig> = new Map();
  private states: Map<string, DataSourceState> = new Map();
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private activeRequests: Map<string, AbortController> = new Map();

  constructor() {
    this.initializeDefaultDataSources();
  }

  /**
   * 기본 데이터 소스 초기화
   */
  private initializeDefaultDataSources() {
    // KPI 데이터 소스
    this.registerDataSource({
      id: 'kpi-metrics',
      name: 'KPI 메트릭',
      type: 'rest',
      endpoint: '/api/kpi/metrics',
      method: 'GET',
      polling: {
        enabled: true,
        interval: 60000
      },
      cache: {
        enabled: true,
        ttl: 30
      }
    });

    // 실시간 알림 데이터 소스
    this.registerDataSource({
      id: 'notifications',
      name: '알림',
      type: 'websocket',
      endpoint: 'ws://localhost:3001/notifications',
      auth: {
        type: 'bearer',
        token: localStorage.getItem('auth_token') || ''
      }
    });

    // 정적 데이터 소스
    this.registerDataSource({
      id: 'static-config',
      name: '정적 설정',
      type: 'static',
      cache: {
        enabled: false,
        ttl: 0
      }
    });
  }

  /**
   * 데이터 소스 등록
   */
  registerDataSource(config: DataSourceConfig): void {
    this.dataSources.set(config.id, config);
    this.states.set(config.id, {
      loading: false,
      fetchCount: 0,
      errorCount: 0
    });

    // 폴링 설정
    if (config.polling?.enabled) {
      this.startPolling(config.id);
    }
  }

  /**
   * 데이터 소스 제거
   */
  unregisterDataSource(id: string): void {
    this.stopPolling(id);
    this.cancelRequest(id);
    this.dataSources.delete(id);
    this.states.delete(id);
    this.cache.delete(id);
  }

  /**
   * 데이터 가져오기
   */
  async fetchData<T = any>(
    sourceId: string,
    options?: {
      params?: Record<string, any>;
      force?: boolean; // 캐시 무시
    }
  ): Promise<DataSourceResponse<T>> {
    const config = this.dataSources.get(sourceId);
    if (!config) {
      return {
        success: false,
        error: `Data source ${sourceId} not found`,
        timestamp: Date.now()
      };
    }

    // 캐시 확인
    if (!options?.force && config.cache?.enabled) {
      const cached = this.getFromCache(sourceId);
      if (cached) {
        return {
          success: true,
          data: cached,
          timestamp: Date.now(),
          cached: true
        };
      }
    }

    // 상태 업데이트
    this.updateState(sourceId, { loading: true });

    const startTime = Date.now();

    try {
      let data: T;

      switch (config.type) {
        case 'rest':
          data = await this.fetchRestData<T>(config, options?.params);
          break;

        case 'graphql':
          data = await this.fetchGraphQLData<T>(config, options?.params);
          break;

        case 'websocket':
          data = await this.fetchWebSocketData<T>(config);
          break;

        case 'static':
          data = await this.fetchStaticData<T>(config);
          break;

        case 'computed':
          data = await this.computeData<T>(config, options?.params);
          break;

        default:
          throw new Error(`Unsupported data source type: ${config.type}`);
      }

      // 변환 적용
      if (config.transform) {
        data = this.transformData(data, config.transform);
      }

      // 캐시 저장
      if (config.cache?.enabled) {
        this.saveToCache(sourceId, data, config.cache.ttl);
      }

      // 상태 업데이트
      this.updateState(sourceId, {
        loading: false,
        lastFetch: Date.now(),
        lastSuccess: Date.now(),
        fetchCount: (this.states.get(sourceId)?.fetchCount || 0) + 1
      });

      // 이벤트 발행
      widgetEventBus.emit(
        `datasource-${sourceId}`,
        WidgetEventTypes.DATA_UPDATE,
        data
      );

      return {
        success: true,
        data,
        timestamp: Date.now(),
        latency: Date.now() - startTime
      };

    } catch (error) {
      // 에러 처리
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.updateState(sourceId, {
        loading: false,
        error: errorMessage,
        lastFetch: Date.now(),
        errorCount: (this.states.get(sourceId)?.errorCount || 0) + 1
      });

      // 에러 이벤트 발행
      widgetEventBus.emit(
        `datasource-${sourceId}`,
        WidgetEventTypes.DATA_ERROR,
        { error: errorMessage }
      );

      // 재시도 로직
      if (config.retry && this.shouldRetry(sourceId, config.retry)) {
        return this.retryFetch<T>(sourceId, config.retry, options);
      }

      return {
        success: false,
        error: errorMessage,
        timestamp: Date.now(),
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * REST API 데이터 가져오기
   */
  private async fetchRestData<T>(
    config: DataSourceConfig,
    params?: Record<string, any>
  ): Promise<T> {
    const controller = new AbortController();
    this.activeRequests.set(config.id, controller);

    try {
      const url = new URL(config.endpoint!);

      // 파라미터 추가
      const allParams = { ...config.params, ...params };
      Object.entries(allParams).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      // 헤더 설정
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...config.headers
      };

      // 인증 헤더 추가
      if (config.auth) {
        headers['Authorization'] = this.getAuthHeader(config.auth);
      }

      const response = await fetch(url.toString(), {
        method: config.method || 'GET',
        headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as T;

    } finally {
      this.activeRequests.delete(config.id);
    }
  }

  /**
   * GraphQL 데이터 가져오기
   */
  private async fetchGraphQLData<T>(
    config: DataSourceConfig,
    variables?: Record<string, any>
  ): Promise<T> {
    const controller = new AbortController();
    this.activeRequests.set(config.id, controller);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...config.headers
      };

      if (config.auth) {
        headers['Authorization'] = this.getAuthHeader(config.auth);
      }

      const response = await fetch(config.endpoint!, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: config.body,
          variables: { ...config.params, ...variables }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`GraphQL error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      return result.data as T;

    } finally {
      this.activeRequests.delete(config.id);
    }
  }

  /**
   * WebSocket 데이터 가져오기
   */
  private async fetchWebSocketData<T>(config: DataSourceConfig): Promise<T> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(config.endpoint!);

      ws.onopen = () => {
        // 인증 메시지 전송
        if (config.auth) {
          ws.send(JSON.stringify({
            type: 'auth',
            token: config.auth.token
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          resolve(data as T);
          ws.close();
        } catch (error) {
          reject(error);
          ws.close();
        }
      };

      ws.onerror = (error) => {
        reject(error);
      };

      // 타임아웃
      setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket timeout'));
      }, 30000);
    });
  }

  /**
   * 정적 데이터 가져오기
   */
  private async fetchStaticData<T>(config: DataSourceConfig): Promise<T> {
    // 정적 데이터는 config.body에 직접 저장
    return config.body as T;
  }

  /**
   * 계산된 데이터 생성
   */
  private async computeData<T>(
    config: DataSourceConfig,
    params?: Record<string, any>
  ): Promise<T> {
    if (!config.transform) {
      throw new Error('Computed data source requires transform function');
    }

    const computeFn = new Function('params', config.transform);
    return computeFn(params) as T;
  }

  /**
   * 데이터 변환
   */
  private transformData<T>(data: any, transform: string): T {
    try {
      const transformFn = new Function('data', transform);
      return transformFn(data) as T;
    } catch (error) {
      console.error('Transform error:', error);
      return data as T;
    }
  }

  /**
   * 인증 헤더 생성
   */
  private getAuthHeader(auth: DataSourceConfig['auth']): string {
    if (!auth) return '';

    switch (auth.type) {
      case 'bearer':
        return `Bearer ${auth.token}`;

      case 'apikey':
        return auth.apiKey || '';

      case 'basic':
        const credentials = btoa(`${auth.username}:${auth.password}`);
        return `Basic ${credentials}`;

      case 'oauth2':
        // OAuth2는 별도 토큰 획득 프로세스 필요
        return `Bearer ${auth.token}`;

      default:
        return '';
    }
  }

  /**
   * 캐시에서 가져오기
   */
  private getFromCache(sourceId: string): any | null {
    const cached = this.cache.get(sourceId);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    this.cache.delete(sourceId);
    return null;
  }

  /**
   * 캐시에 저장
   */
  private saveToCache(sourceId: string, data: any, ttl: number): void {
    this.cache.set(sourceId, {
      data,
      expiry: Date.now() + (ttl * 1000)
    });
  }

  /**
   * 캐시 무효화
   */
  invalidateCache(sourceId?: string): void {
    if (sourceId) {
      this.cache.delete(sourceId);
    } else {
      this.cache.clear();
    }
  }

  /**
   * 재시도 여부 확인
   */
  private shouldRetry(sourceId: string, retryConfig: DataSourceConfig['retry']): boolean {
    if (!retryConfig) return false;

    const state = this.states.get(sourceId);
    if (!state) return false;

    return state.errorCount <= retryConfig.attempts;
  }

  /**
   * 재시도 실행
   */
  private async retryFetch<T>(
    sourceId: string,
    retryConfig: NonNullable<DataSourceConfig['retry']>,
    options?: any
  ): Promise<DataSourceResponse<T>> {
    const state = this.states.get(sourceId);
    if (!state) {
      return {
        success: false,
        error: 'State not found',
        timestamp: Date.now()
      };
    }

    // 지연 계산
    let delay = retryConfig.delay;
    if (retryConfig.backoff === 'exponential') {
      delay = delay * Math.pow(2, state.errorCount - 1);
    }

    // 지연 후 재시도
    await new Promise(resolve => setTimeout(resolve, delay));
    return this.fetchData<T>(sourceId, options);
  }

  /**
   * 폴링 시작
   */
  private startPolling(sourceId: string): void {
    const config = this.dataSources.get(sourceId);
    if (!config?.polling?.enabled) return;

    this.stopPolling(sourceId);

    const interval = setInterval(() => {
      this.fetchData(sourceId);
    }, config.polling.interval);

    this.pollingIntervals.set(sourceId, interval);
  }

  /**
   * 폴링 중지
   */
  private stopPolling(sourceId: string): void {
    const interval = this.pollingIntervals.get(sourceId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(sourceId);
    }
  }

  /**
   * 요청 취소
   */
  private cancelRequest(sourceId: string): void {
    const controller = this.activeRequests.get(sourceId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(sourceId);
    }
  }

  /**
   * 상태 업데이트
   */
  private updateState(sourceId: string, updates: Partial<DataSourceState>): void {
    const currentState = this.states.get(sourceId) || {
      loading: false,
      fetchCount: 0,
      errorCount: 0
    };

    this.states.set(sourceId, {
      ...currentState,
      ...updates
    });
  }

  /**
   * 데이터 소스 상태 가져오기
   */
  getState(sourceId: string): DataSourceState | undefined {
    return this.states.get(sourceId);
  }

  /**
   * 모든 데이터 소스 가져오기
   */
  getAllDataSources(): DataSourceConfig[] {
    return Array.from(this.dataSources.values());
  }

  /**
   * 정리
   */
  dispose(): void {
    // 모든 폴링 중지
    this.pollingIntervals.forEach(interval => clearInterval(interval));
    this.pollingIntervals.clear();

    // 모든 요청 취소
    this.activeRequests.forEach(controller => controller.abort());
    this.activeRequests.clear();

    // 캐시 정리
    this.cache.clear();
  }
}

// 싱글톤 인스턴스
export const dataSourceManager = new WidgetDataSourceManager();

// 개발 모드에서 전역 접근 가능
if (process.env.NODE_ENV === 'development') {
  (window as any).dataSourceManager = dataSourceManager;
}