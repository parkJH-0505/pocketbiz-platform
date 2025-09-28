import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  createContext,
  useContext
} from 'react';

export interface LoadingTask {
  id: string;
  name: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: number;
  dependencies: string[];
  loader: () => Promise<any>;
  retryConfig: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  timeoutMs: number;
  cacheKey?: string;
  onProgress?: (progress: number) => void;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

export interface LoadingState {
  id: string;
  status: 'idle' | 'loading' | 'success' | 'error' | 'cancelled' | 'timeout';
  progress: number;
  result?: any;
  error?: Error;
  startTime?: number;
  endTime?: number;
  duration?: number;
  retryCount: number;
  isCached: boolean;
}

export interface LoadingQueue {
  critical: LoadingTask[];
  high: LoadingTask[];
  medium: LoadingTask[];
  low: LoadingTask[];
}

export interface LoadingStats {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  cachedTasks: number;
  averageLoadTime: number;
  successRate: number;
  cacheHitRate: number;
  activeLoaders: number;
  queueSize: number;
  memoryUsage: number;
  lastUpdate: number;
}

export interface SmartLoadingConfig {
  maxConcurrentLoaders: number;
  defaultTimeout: number;
  enableCache: boolean;
  cacheExpiryMs: number;
  adaptivePriority: boolean;
  bandwidthThrottling: boolean;
  progressiveLoading: boolean;
  criticalLoadingThreshold: number;
  backgroundLoadingEnabled: boolean;
  prefetchEnabled: boolean;
  retryStrategy: 'exponential' | 'linear' | 'fixed';
}

interface CacheEntry {
  data: any;
  timestamp: number;
  expiryTime: number;
  accessCount: number;
  size: number;
}

interface LoadingContextValue {
  loadAsync: (task: LoadingTask) => Promise<any>;
  loadBatch: (tasks: LoadingTask[]) => Promise<any[]>;
  getLoadingState: (taskId: string) => LoadingState | null;
  cancelLoading: (taskId: string) => boolean;
  clearCache: (pattern?: string) => void;
  getStats: () => LoadingStats;
  updateConfig: (config: Partial<SmartLoadingConfig>) => void;
  prefetch: (tasks: LoadingTask[]) => void;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

export const useSmartLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useSmartLoading must be used within SmartLoadingProvider');
  }
  return context;
};

export class SmartLoadingSystem {
  private config: SmartLoadingConfig;
  private tasks = new Map<string, LoadingTask>();
  private states = new Map<string, LoadingState>();
  private queue: LoadingQueue;
  private cache = new Map<string, CacheEntry>();
  private activeLoaders = new Set<string>();
  private abortControllers = new Map<string, AbortController>();
  private stats: LoadingStats;
  private observers: Set<(stats: LoadingStats) => void> = new Set();
  private bandwidthMonitor: NetworkMonitor;

  constructor(config: Partial<SmartLoadingConfig> = {}) {
    this.config = {
      maxConcurrentLoaders: 6,
      defaultTimeout: 30000,
      enableCache: true,
      cacheExpiryMs: 300000, // 5분
      adaptivePriority: true,
      bandwidthThrottling: true,
      progressiveLoading: true,
      criticalLoadingThreshold: 2000,
      backgroundLoadingEnabled: true,
      prefetchEnabled: true,
      retryStrategy: 'exponential',
      ...config
    };

    this.queue = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };

    this.stats = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      cachedTasks: 0,
      averageLoadTime: 0,
      successRate: 0,
      cacheHitRate: 0,
      activeLoaders: 0,
      queueSize: 0,
      memoryUsage: 0,
      lastUpdate: Date.now()
    };

    this.bandwidthMonitor = new NetworkMonitor();
    this.setupPeriodicTasks();
  }

  /**
   * 비동기 로딩
   */
  async loadAsync(task: LoadingTask): Promise<any> {
    // 캐시 확인
    if (this.config.enableCache && task.cacheKey) {
      const cached = this.getCachedResult(task.cacheKey);
      if (cached !== null) {
        this.updateStats('cache-hit');
        return cached;
      }
    }

    // 태스크 등록
    this.registerTask(task);

    // 즉시 로딩 또는 큐에 추가
    if (this.shouldLoadImmediately(task)) {
      return this.executeTask(task);
    } else {
      this.addToQueue(task);
      return this.waitForTaskCompletion(task.id);
    }
  }

  /**
   * 배치 로딩
   */
  async loadBatch(tasks: LoadingTask[]): Promise<any[]> {
    // 종속성 그래프 생성 및 정렬
    const sortedTasks = this.sortTasksByDependency(tasks);

    // 병렬 처리 가능한 태스크 그룹화
    const taskGroups = this.groupTasksForParallelExecution(sortedTasks);

    const results: any[] = [];

    for (const group of taskGroups) {
      const groupPromises = group.map(task => this.loadAsync(task));
      const groupResults = await Promise.allSettled(groupPromises);

      results.push(...groupResults.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`Task ${group[index].id} failed:`, result.reason);
          return null;
        }
      }));
    }

    return results;
  }

  /**
   * 태스크 등록
   */
  private registerTask(task: LoadingTask): void {
    this.tasks.set(task.id, task);
    this.states.set(task.id, {
      id: task.id,
      status: 'idle',
      progress: 0,
      retryCount: 0,
      isCached: false
    });

    this.stats.totalTasks++;
    this.updateStatsAndNotify();
  }

  /**
   * 즉시 로딩 여부 결정
   */
  private shouldLoadImmediately(task: LoadingTask): boolean {
    const { priority } = task;
    const { maxConcurrentLoaders, criticalLoadingThreshold } = this.config;

    // 임계 우선순위는 항상 즉시 로딩
    if (priority === 'critical') {
      return true;
    }

    // 현재 활성 로더 수가 임계값 미만이고 높은 우선순위
    if (this.activeLoaders.size < maxConcurrentLoaders && priority === 'high') {
      return true;
    }

    // 적응형 우선순위가 활성화된 경우 시스템 상태 고려
    if (this.config.adaptivePriority) {
      return this.calculateAdaptivePriority(task) > criticalLoadingThreshold;
    }

    return this.activeLoaders.size < maxConcurrentLoaders;
  }

  /**
   * 적응형 우선순위 계산
   */
  private calculateAdaptivePriority(task: LoadingTask): number {
    const bandwidth = this.bandwidthMonitor.getCurrentBandwidth();
    const memoryPressure = this.getMemoryPressure();
    const queuePressure = this.getQueuePressure();

    let priorityScore = this.getPriorityScore(task.priority);

    // 대역폭 조정
    if (bandwidth < 1000000) { // 1Mbps 미만
      priorityScore *= 0.7;
    }

    // 메모리 압박 조정
    if (memoryPressure > 0.8) {
      priorityScore *= 0.5;
    }

    // 큐 압박 조정
    if (queuePressure > 0.9) {
      priorityScore *= 1.5;
    }

    return priorityScore;
  }

  /**
   * 태스크 실행
   */
  private async executeTask(task: LoadingTask): Promise<any> {
    const state = this.states.get(task.id)!;
    const abortController = new AbortController();

    try {
      // 상태 업데이트
      state.status = 'loading';
      state.startTime = Date.now();
      this.activeLoaders.add(task.id);
      this.abortControllers.set(task.id, abortController);

      // 진행률 모니터링 설정
      this.setupProgressMonitoring(task, state);

      // 타임아웃 설정
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Task ${task.id} timed out`));
        }, task.timeoutMs || this.config.defaultTimeout);
      });

      // 실제 로딩 실행
      const loadingPromise = this.executeTaskWithRetry(task, abortController.signal);

      const result = await Promise.race([loadingPromise, timeoutPromise]);

      // 성공 처리
      state.status = 'success';
      state.result = result;
      state.endTime = Date.now();
      state.duration = state.endTime - state.startTime!;

      // 캐시 저장
      if (this.config.enableCache && task.cacheKey) {
        this.setCachedResult(task.cacheKey, result);
      }

      // 콜백 호출
      task.onSuccess?.(result);

      this.updateStats('success');
      return result;

    } catch (error) {
      // 에러 처리
      state.status = 'error';
      state.error = error as Error;
      state.endTime = Date.now();

      task.onError?.(error as Error);
      this.updateStats('error');

      throw error;

    } finally {
      // 정리
      this.activeLoaders.delete(task.id);
      this.abortControllers.delete(task.id);
      this.processQueue();
    }
  }

  /**
   * 재시도 로직이 포함된 태스크 실행
   */
  private async executeTaskWithRetry(task: LoadingTask, signal: AbortSignal): Promise<any> {
    let lastError: Error;

    for (let attempt = 0; attempt <= task.retryConfig.maxRetries; attempt++) {
      try {
        const result = await task.loader();
        return result;

      } catch (error) {
        lastError = error as Error;

        if (signal.aborted) {
          throw new Error('Task was cancelled');
        }

        if (attempt < task.retryConfig.maxRetries) {
          const delay = this.calculateRetryDelay(task, attempt);
          await this.delay(delay);

          const state = this.states.get(task.id)!;
          state.retryCount = attempt + 1;
        }
      }
    }

    throw lastError!;
  }

  /**
   * 재시도 지연 시간 계산
   */
  private calculateRetryDelay(task: LoadingTask, attempt: number): number {
    const { retryConfig } = task;
    const { retryStrategy } = this.config;

    switch (retryStrategy) {
      case 'exponential':
        return retryConfig.initialDelay * Math.pow(retryConfig.backoffMultiplier, attempt);

      case 'linear':
        return retryConfig.initialDelay + (attempt * retryConfig.backoffMultiplier * 1000);

      case 'fixed':
      default:
        return retryConfig.initialDelay;
    }
  }

  /**
   * 진행률 모니터링 설정
   */
  private setupProgressMonitoring(task: LoadingTask, state: LoadingState): void {
    if (!task.onProgress) return;

    const progressInterval = setInterval(() => {
      if (state.status === 'loading') {
        // 추정 진행률 계산 (실제 구현에서는 더 정교한 로직 필요)
        const elapsed = Date.now() - state.startTime!;
        const estimatedProgress = Math.min(
          (elapsed / task.estimatedDuration) * 100,
          95 // 완료 전까지 95%로 제한
        );

        state.progress = estimatedProgress;
        task.onProgress!(estimatedProgress);
      } else {
        clearInterval(progressInterval);
      }
    }, 100);
  }

  /**
   * 큐에 태스크 추가
   */
  private addToQueue(task: LoadingTask): void {
    const priorityQueue = this.queue[task.priority];
    priorityQueue.push(task);

    // 우선순위별 정렬
    priorityQueue.sort((a, b) => {
      if (this.config.adaptivePriority) {
        return this.calculateAdaptivePriority(b) - this.calculateAdaptivePriority(a);
      }
      return b.estimatedDuration - a.estimatedDuration; // 빠른 태스크 우선
    });

    this.updateQueueStats();
  }

  /**
   * 큐 처리
   */
  private processQueue(): void {
    if (this.activeLoaders.size >= this.config.maxConcurrentLoaders) {
      return;
    }

    const priorities: (keyof LoadingQueue)[] = ['critical', 'high', 'medium', 'low'];

    for (const priority of priorities) {
      const queue = this.queue[priority];

      while (queue.length > 0 && this.activeLoaders.size < this.config.maxConcurrentLoaders) {
        const task = queue.shift()!;

        // 종속성 확인
        if (this.areDependenciesMet(task)) {
          this.executeTask(task).catch(error => {
            console.error(`Task ${task.id} failed during queue processing:`, error);
          });
        } else {
          // 종속성이 충족되지 않으면 큐 뒤로
          queue.push(task);
          break;
        }
      }
    }
  }

  /**
   * 종속성 확인
   */
  private areDependenciesMet(task: LoadingTask): boolean {
    return task.dependencies.every(depId => {
      const depState = this.states.get(depId);
      return depState?.status === 'success';
    });
  }

  /**
   * 태스크 완료 대기
   */
  private waitForTaskCompletion(taskId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const checkCompletion = () => {
        const state = this.states.get(taskId);

        if (!state) {
          reject(new Error(`Task ${taskId} not found`));
          return;
        }

        switch (state.status) {
          case 'success':
            resolve(state.result);
            break;

          case 'error':
            reject(state.error);
            break;

          case 'cancelled':
            reject(new Error(`Task ${taskId} was cancelled`));
            break;

          case 'timeout':
            reject(new Error(`Task ${taskId} timed out`));
            break;

          default:
            // 아직 진행 중이면 다시 확인
            setTimeout(checkCompletion, 100);
            break;
        }
      };

      checkCompletion();
    });
  }

  /**
   * 캐시 관련 메서드들
   */
  private getCachedResult(cacheKey: string): any | null {
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiryTime) {
      this.cache.delete(cacheKey);
      return null;
    }

    entry.accessCount++;
    return entry.data;
  }

  private setCachedResult(cacheKey: string, data: any): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      expiryTime: Date.now() + this.config.cacheExpiryMs,
      accessCount: 1,
      size: this.estimateDataSize(data)
    };

    this.cache.set(cacheKey, entry);
    this.evictOldCacheEntries();
  }

  /**
   * 종속성 기반 태스크 정렬
   */
  private sortTasksByDependency(tasks: LoadingTask[]): LoadingTask[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: LoadingTask[] = [];
    const taskMap = new Map(tasks.map(task => [task.id, task]));

    const visit = (task: LoadingTask) => {
      if (visiting.has(task.id)) {
        throw new Error(`Circular dependency detected: ${task.id}`);
      }

      if (visited.has(task.id)) {
        return;
      }

      visiting.add(task.id);

      for (const depId of task.dependencies) {
        const depTask = taskMap.get(depId);
        if (depTask) {
          visit(depTask);
        }
      }

      visiting.delete(task.id);
      visited.add(task.id);
      result.push(task);
    };

    for (const task of tasks) {
      if (!visited.has(task.id)) {
        visit(task);
      }
    }

    return result;
  }

  /**
   * 병렬 실행을 위한 태스크 그룹화
   */
  private groupTasksForParallelExecution(tasks: LoadingTask[]): LoadingTask[][] {
    const groups: LoadingTask[][] = [];
    const processed = new Set<string>();

    for (const task of tasks) {
      if (processed.has(task.id)) {
        continue;
      }

      // 같은 레벨(종속성이 없는) 태스크들을 그룹화
      const group: LoadingTask[] = [];
      const canExecute = (t: LoadingTask) =>
        t.dependencies.every(depId => processed.has(depId));

      for (const candidate of tasks) {
        if (!processed.has(candidate.id) && canExecute(candidate)) {
          group.push(candidate);
          processed.add(candidate.id);
        }
      }

      if (group.length > 0) {
        groups.push(group);
      }
    }

    return groups;
  }

  /**
   * 유틸리티 메서드들
   */
  private getPriorityScore(priority: string): number {
    const scores = { critical: 1000, high: 100, medium: 10, low: 1 };
    return scores[priority as keyof typeof scores] || 1;
  }

  private getMemoryPressure(): number {
    // 실제 구현에서는 메모리 사용량 모니터링 로직 필요
    return this.stats.memoryUsage / (100 * 1024 * 1024); // 100MB 기준
  }

  private getQueuePressure(): number {
    const totalQueued = Object.values(this.queue)
      .reduce((sum, queue) => sum + queue.length, 0);
    return totalQueued / (this.config.maxConcurrentLoaders * 5); // 최대 동시 로더의 5배 기준
  }

  private estimateDataSize(data: any): number {
    return JSON.stringify(data).length * 2; // 대략적인 크기 추정
  }

  private evictOldCacheEntries(): void {
    const maxCacheSize = 50 * 1024 * 1024; // 50MB
    let currentSize = 0;

    // 크기 계산
    for (const entry of this.cache.values()) {
      currentSize += entry.size;
    }

    if (currentSize <= maxCacheSize) {
      return;
    }

    // 접근 빈도가 낮고 오래된 항목부터 삭제
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => {
        const scoreA = a.accessCount / (Date.now() - a.timestamp);
        const scoreB = b.accessCount / (Date.now() - b.timestamp);
        return scoreA - scoreB;
      });

    for (const [key, entry] of entries) {
      this.cache.delete(key);
      currentSize -= entry.size;

      if (currentSize <= maxCacheSize * 0.8) {
        break;
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateStats(type: 'success' | 'error' | 'cache-hit'): void {
    switch (type) {
      case 'success':
        this.stats.completedTasks++;
        break;
      case 'error':
        this.stats.failedTasks++;
        break;
      case 'cache-hit':
        this.stats.cachedTasks++;
        break;
    }

    this.updateStatsAndNotify();
  }

  private updateStatsAndNotify(): void {
    this.stats.successRate = this.stats.totalTasks > 0 ?
      this.stats.completedTasks / this.stats.totalTasks : 0;

    this.stats.cacheHitRate = this.stats.totalTasks > 0 ?
      this.stats.cachedTasks / this.stats.totalTasks : 0;

    this.stats.activeLoaders = this.activeLoaders.size;
    this.updateQueueStats();

    this.stats.lastUpdate = Date.now();

    this.observers.forEach(observer => observer(this.stats));
  }

  private updateQueueStats(): void {
    this.stats.queueSize = Object.values(this.queue)
      .reduce((sum, queue) => sum + queue.length, 0);
  }

  private setupPeriodicTasks(): void {
    // 주기적인 캐시 정리
    setInterval(() => {
      this.evictOldCacheEntries();
    }, 60000);

    // 통계 업데이트
    setInterval(() => {
      this.updateStatsAndNotify();
    }, 1000);
  }

  // Public API 메서드들
  getLoadingState(taskId: string): LoadingState | null {
    return this.states.get(taskId) || null;
  }

  cancelLoading(taskId: string): boolean {
    const abortController = this.abortControllers.get(taskId);
    if (abortController) {
      abortController.abort();
      const state = this.states.get(taskId);
      if (state) {
        state.status = 'cancelled';
      }
      return true;
    }
    return false;
  }

  clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const [key] of this.cache) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): LoadingStats {
    return { ...this.stats };
  }

  updateConfig(updates: Partial<SmartLoadingConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  prefetch(tasks: LoadingTask[]): void {
    if (!this.config.prefetchEnabled) {
      return;
    }

    // 백그라운드에서 낮은 우선순위로 프리페치
    const prefetchTasks = tasks.map(task => ({
      ...task,
      priority: 'low' as const
    }));

    setTimeout(() => {
      this.loadBatch(prefetchTasks).catch(() => {
        // 프리페치 실패는 무시
      });
    }, 1000);
  }

  addStatsObserver(observer: (stats: LoadingStats) => void): void {
    this.observers.add(observer);
  }

  removeStatsObserver(observer: (stats: LoadingStats) => void): void {
    this.observers.delete(observer);
  }

  dispose(): void {
    // 모든 진행 중인 태스크 취소
    for (const [taskId] of this.abortControllers) {
      this.cancelLoading(taskId);
    }

    this.cache.clear();
    this.observers.clear();
  }
}

// 네트워크 모니터 클래스 (간단한 구현)
class NetworkMonitor {
  private bandwidth = 10000000; // 기본값: 10Mbps

  getCurrentBandwidth(): number {
    // 실제 구현에서는 Network Information API 사용
    return this.bandwidth;
  }
}

// React Provider 컴포넌트
interface SmartLoadingProviderProps {
  children: React.ReactNode;
  config?: Partial<SmartLoadingConfig>;
  onStatsUpdate?: (stats: LoadingStats) => void;
}

export const SmartLoadingProvider: React.FC<SmartLoadingProviderProps> = ({
  children,
  config,
  onStatsUpdate
}) => {
  const systemRef = useRef<SmartLoadingSystem>();
  const [stats, setStats] = useState<LoadingStats>({
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    cachedTasks: 0,
    averageLoadTime: 0,
    successRate: 0,
    cacheHitRate: 0,
    activeLoaders: 0,
    queueSize: 0,
    memoryUsage: 0,
    lastUpdate: Date.now()
  });

  // 시스템 초기화
  useEffect(() => {
    systemRef.current = new SmartLoadingSystem(config);

    const statsObserver = (newStats: LoadingStats) => {
      setStats(newStats);
      onStatsUpdate?.(newStats);
    };

    systemRef.current.addStatsObserver(statsObserver);

    return () => {
      systemRef.current?.removeStatsObserver(statsObserver);
      systemRef.current?.dispose();
    };
  }, [config, onStatsUpdate]);

  // 컨텍스트 값
  const contextValue: LoadingContextValue = useMemo(() => ({
    loadAsync: (task: LoadingTask) => systemRef.current!.loadAsync(task),
    loadBatch: (tasks: LoadingTask[]) => systemRef.current!.loadBatch(tasks),
    getLoadingState: (taskId: string) => systemRef.current!.getLoadingState(taskId),
    cancelLoading: (taskId: string) => systemRef.current!.cancelLoading(taskId),
    clearCache: (pattern?: string) => systemRef.current!.clearCache(pattern),
    getStats: () => systemRef.current!.getStats(),
    updateConfig: (config: Partial<SmartLoadingConfig>) => systemRef.current!.updateConfig(config),
    prefetch: (tasks: LoadingTask[]) => systemRef.current!.prefetch(tasks)
  }), []);

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  );
};