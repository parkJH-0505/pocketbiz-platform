/**
 * ServiceRegistry.ts
 *
 * 서비스 등록 및 의존성 주입을 위한 중앙 집중식 레지스트리
 * 순환 참조 방지, 지연 초기화, 생명주기 관리에 중점
 */

import { eventBus } from '../events/EventBus';
import { createEvent } from '../events/EventBus';

// 서비스 메타데이터 타입
export interface ServiceMetadata {
  name: string;
  version: string;
  dependencies: string[];
  singleton: boolean;
  lazy: boolean;
  priority: number;
  tags: string[];
  description?: string;
}

// 서비스 상태 타입
export type ServiceStatus = 'registered' | 'initializing' | 'ready' | 'error' | 'disposed';

// 서비스 정보 타입
export interface ServiceInfo {
  metadata: ServiceMetadata;
  status: ServiceStatus;
  instance?: any;
  factory?: ServiceFactory<any>;
  error?: Error;
  registeredAt: Date;
  initializedAt?: Date;
  lastAccessedAt?: Date;
  accessCount: number;
}

// 서비스 팩토리 타입
export type ServiceFactory<T = any> = (registry: ServiceRegistry) => T | Promise<T>;

// 서비스 초기화 옵션
export interface ServiceInitOptions {
  force?: boolean;
  timeout?: number;
  skipDependencies?: boolean;
}

// 의존성 그래프 노드
interface DependencyNode {
  name: string;
  dependencies: Set<string>;
  dependents: Set<string>;
  level: number;
}

export class ServiceRegistryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly serviceName?: string,
    public readonly context?: any
  ) {
    super(message);
    this.name = 'ServiceRegistryError';
  }
}

export class ServiceRegistry {
  private static instance: ServiceRegistry | null = null;
  private services = new Map<string, ServiceInfo>();
  private initializationPromises = new Map<string, Promise<any>>();
  private dependencyGraph = new Map<string, DependencyNode>();
  private disposed = false;

  private constructor() {
    // 프로세스 종료 시 정리
    if (typeof process !== 'undefined') {
      process.on('exit', () => this.dispose());
      process.on('SIGINT', () => this.dispose());
      process.on('SIGTERM', () => this.dispose());
    }

    // 브라우저에서 정리
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.dispose());
    }

    this.log('ServiceRegistry initialized');
  }

  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * 서비스 등록
   */
  public register<T>(
    name: string,
    factory: ServiceFactory<T>,
    metadata: Partial<ServiceMetadata> = {}
  ): void {
    if (this.disposed) {
      throw new ServiceRegistryError('Cannot register service after disposal', 'REGISTRY_DISPOSED', name);
    }

    if (this.services.has(name)) {
      throw new ServiceRegistryError(`Service '${name}' is already registered`, 'SERVICE_EXISTS', name);
    }

    const fullMetadata: ServiceMetadata = {
      name,
      version: '1.0.0',
      dependencies: [],
      singleton: true,
      lazy: true,
      priority: 0,
      tags: [],
      ...metadata
    };

    const serviceInfo: ServiceInfo = {
      metadata: fullMetadata,
      status: 'registered',
      factory,
      registeredAt: new Date(),
      accessCount: 0
    };

    this.services.set(name, serviceInfo);
    this.updateDependencyGraph(name, fullMetadata.dependencies);

    this.log('Service registered', { name, metadata: fullMetadata });

    // 이벤트 발행
    eventBus.emit('SYSTEM_ERROR', createEvent('SYSTEM_ERROR', {
      error: new Error(`Service registered: ${name}`),
      context: 'ServiceRegistry',
      severity: 'low'
    }, { source: 'ServiceRegistry' }));
  }

  /**
   * 서비스 조회 및 초기화
   */
  public async get<T>(name: string, options: ServiceInitOptions = {}): Promise<T> {
    if (this.disposed) {
      throw new ServiceRegistryError('Cannot get service after disposal', 'REGISTRY_DISPOSED', name);
    }

    const serviceInfo = this.services.get(name);
    if (!serviceInfo) {
      throw new ServiceRegistryError(`Service '${name}' not found`, 'SERVICE_NOT_FOUND', name);
    }

    // 이미 초기화된 싱글톤 반환
    if (serviceInfo.metadata.singleton && serviceInfo.instance && serviceInfo.status === 'ready') {
      serviceInfo.lastAccessedAt = new Date();
      serviceInfo.accessCount++;
      return serviceInfo.instance;
    }

    // 초기화 중인 경우 대기
    if (this.initializationPromises.has(name)) {
      return this.initializationPromises.get(name)!;
    }

    // 새로운 초기화 시작
    const initPromise = this.initializeService<T>(name, options);
    this.initializationPromises.set(name, initPromise);

    try {
      const instance = await initPromise;
      return instance;
    } finally {
      this.initializationPromises.delete(name);
    }
  }

  /**
   * 서비스 초기화 (내부)
   */
  private async initializeService<T>(name: string, options: ServiceInitOptions): Promise<T> {
    const serviceInfo = this.services.get(name)!;
    const { timeout = 30000, skipDependencies = false } = options;

    if (serviceInfo.status === 'error' && !options.force) {
      throw new ServiceRegistryError(
        `Service '${name}' is in error state`,
        'SERVICE_ERROR',
        name,
        serviceInfo.error
      );
    }

    this.log('Initializing service', { name, dependencies: serviceInfo.metadata.dependencies });

    serviceInfo.status = 'initializing';

    try {
      // 타임아웃 설정
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new ServiceRegistryError(
            `Service '${name}' initialization timeout`,
            'INIT_TIMEOUT',
            name
          ));
        }, timeout);
      });

      // 의존성 초기화
      if (!skipDependencies && serviceInfo.metadata.dependencies.length > 0) {
        await this.initializeDependencies(serviceInfo.metadata.dependencies);
      }

      // 서비스 인스턴스 생성
      const initPromise = serviceInfo.factory!(this);
      const instance = await Promise.race([initPromise, timeoutPromise]);

      // 상태 업데이트
      serviceInfo.instance = instance;
      serviceInfo.status = 'ready';
      serviceInfo.initializedAt = new Date();
      serviceInfo.lastAccessedAt = new Date();
      serviceInfo.accessCount++;

      this.log('Service initialized successfully', { name, initTime: Date.now() });

      return instance;

    } catch (error) {
      serviceInfo.status = 'error';
      serviceInfo.error = error as Error;

      this.log('Service initialization failed', {
        name,
        error: (error as Error).message,
        stack: (error as Error).stack
      }, 'error');

      throw new ServiceRegistryError(
        `Failed to initialize service '${name}': ${(error as Error).message}`,
        'INIT_FAILED',
        name,
        error
      );
    }
  }

  /**
   * 의존성 초기화
   */
  private async initializeDependencies(dependencies: string[]): Promise<void> {
    const sortedDependencies = this.sortDependencies(dependencies);

    for (const depName of sortedDependencies) {
      if (!this.services.has(depName)) {
        throw new ServiceRegistryError(
          `Dependency '${depName}' not found`,
          'DEPENDENCY_NOT_FOUND',
          depName
        );
      }

      await this.get(depName);
    }
  }

  /**
   * 의존성 정렬 (순환 참조 감지)
   */
  private sortDependencies(dependencies: string[]): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: string[] = [];

    const visit = (name: string): void => {
      if (visiting.has(name)) {
        throw new ServiceRegistryError(
          `Circular dependency detected involving '${name}'`,
          'CIRCULAR_DEPENDENCY',
          name
        );
      }

      if (visited.has(name)) {
        return;
      }

      visiting.add(name);

      const node = this.dependencyGraph.get(name);
      if (node) {
        for (const dep of node.dependencies) {
          visit(dep);
        }
      }

      visiting.delete(name);
      visited.add(name);
      result.push(name);
    };

    for (const dep of dependencies) {
      visit(dep);
    }

    return result;
  }

  /**
   * 의존성 그래프 업데이트
   */
  private updateDependencyGraph(serviceName: string, dependencies: string[]): void {
    if (!this.dependencyGraph.has(serviceName)) {
      this.dependencyGraph.set(serviceName, {
        name: serviceName,
        dependencies: new Set(),
        dependents: new Set(),
        level: 0
      });
    }

    const node = this.dependencyGraph.get(serviceName)!;
    node.dependencies = new Set(dependencies);

    // 역방향 참조 업데이트
    for (const dep of dependencies) {
      if (!this.dependencyGraph.has(dep)) {
        this.dependencyGraph.set(dep, {
          name: dep,
          dependencies: new Set(),
          dependents: new Set(),
          level: 0
        });
      }
      this.dependencyGraph.get(dep)!.dependents.add(serviceName);
    }

    // 레벨 계산
    this.calculateLevels();
  }

  /**
   * 의존성 레벨 계산
   */
  private calculateLevels(): void {
    const levels = new Map<string, number>();
    const visited = new Set<string>();

    const calculateLevel = (name: string): number => {
      if (levels.has(name)) {
        return levels.get(name)!;
      }

      if (visited.has(name)) {
        return 0; // 순환 참조 감지 시 0 반환
      }

      visited.add(name);

      const node = this.dependencyGraph.get(name);
      if (!node || node.dependencies.size === 0) {
        levels.set(name, 0);
        visited.delete(name);
        return 0;
      }

      let maxLevel = 0;
      for (const dep of node.dependencies) {
        const depLevel = calculateLevel(dep);
        maxLevel = Math.max(maxLevel, depLevel + 1);
      }

      levels.set(name, maxLevel);
      node.level = maxLevel;
      visited.delete(name);

      return maxLevel;
    };

    for (const [name] of this.dependencyGraph) {
      calculateLevel(name);
    }
  }

  /**
   * 서비스 존재 여부 확인
   */
  public has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * 서비스 제거
   */
  public unregister(name: string): boolean {
    const serviceInfo = this.services.get(name);
    if (!serviceInfo) {
      return false;
    }

    // 의존하는 서비스들 확인
    const dependents = this.getDependents(name);
    if (dependents.length > 0) {
      throw new ServiceRegistryError(
        `Cannot unregister service '${name}'. Dependent services: ${dependents.join(', ')}`,
        'HAS_DEPENDENTS',
        name,
        { dependents }
      );
    }

    // 서비스 정리
    if (serviceInfo.instance && typeof serviceInfo.instance.dispose === 'function') {
      try {
        serviceInfo.instance.dispose();
      } catch (error) {
        this.log('Error disposing service instance', { name, error: (error as Error).message }, 'error');
      }
    }

    this.services.delete(name);
    this.dependencyGraph.delete(name);

    // 다른 서비스들의 의존성에서 제거
    for (const [, node] of this.dependencyGraph) {
      node.dependencies.delete(name);
      node.dependents.delete(name);
    }

    this.log('Service unregistered', { name });
    return true;
  }

  /**
   * 의존하는 서비스 목록 조회
   */
  private getDependents(serviceName: string): string[] {
    const node = this.dependencyGraph.get(serviceName);
    return node ? Array.from(node.dependents) : [];
  }

  /**
   * 모든 서비스 정보 조회
   */
  public getServiceInfos(): ServiceInfo[] {
    return Array.from(this.services.values());
  }

  /**
   * 서비스 상태 조회
   */
  public getServiceStatus(name: string): ServiceStatus | null {
    const serviceInfo = this.services.get(name);
    return serviceInfo ? serviceInfo.status : null;
  }

  /**
   * 서비스 메트릭스 조회
   */
  public getMetrics(): {
    totalServices: number;
    readyServices: number;
    errorServices: number;
    totalAccess: number;
    dependencyGraph: { name: string; level: number; dependencies: string[]; dependents: string[] }[];
  } {
    const services = Array.from(this.services.values());

    return {
      totalServices: services.length,
      readyServices: services.filter(s => s.status === 'ready').length,
      errorServices: services.filter(s => s.status === 'error').length,
      totalAccess: services.reduce((sum, s) => sum + s.accessCount, 0),
      dependencyGraph: Array.from(this.dependencyGraph.values()).map(node => ({
        name: node.name,
        level: node.level,
        dependencies: Array.from(node.dependencies),
        dependents: Array.from(node.dependents)
      }))
    };
  }

  /**
   * 정리 작업
   */
  public dispose(): void {
    if (this.disposed) return;

    this.log('ServiceRegistry disposal started');

    // 레벨 역순으로 서비스 정리
    const servicesByLevel = new Map<number, string[]>();
    for (const [name, node] of this.dependencyGraph) {
      const level = node.level;
      if (!servicesByLevel.has(level)) {
        servicesByLevel.set(level, []);
      }
      servicesByLevel.get(level)!.push(name);
    }

    const sortedLevels = Array.from(servicesByLevel.keys()).sort((a, b) => b - a);

    for (const level of sortedLevels) {
      const servicesAtLevel = servicesByLevel.get(level)!;
      for (const serviceName of servicesAtLevel) {
        try {
          this.unregister(serviceName);
        } catch (error) {
          this.log('Error during service disposal', {
            serviceName,
            error: (error as Error).message
          }, 'error');
        }
      }
    }

    this.services.clear();
    this.dependencyGraph.clear();
    this.initializationPromises.clear();
    this.disposed = true;

    this.log('ServiceRegistry disposal completed');
  }

  /**
   * 로깅
   */
  private log(message: string, context?: any, level: 'info' | 'warn' | 'error' = 'info'): void {
    const logData = {
      timestamp: new Date().toISOString(),
      component: 'ServiceRegistry',
      message,
      context
    };

    if (level === 'error') {
      console.error('[ServiceRegistry]', logData);
    } else if (level === 'warn') {
      console.warn('[ServiceRegistry]', logData);
    } else if (process.env.NODE_ENV === 'development') {
      console.log('[ServiceRegistry]', logData);
    }
  }

  /**
   * 인스턴스 리셋 (테스트용)
   */
  public static reset(): void {
    if (ServiceRegistry.instance) {
      ServiceRegistry.instance.dispose();
      ServiceRegistry.instance = null;
    }
  }
}

// 기본 인스턴스 export
export const serviceRegistry = ServiceRegistry.getInstance();