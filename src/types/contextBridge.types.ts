/**
 * contextBridge.types.ts
 *
 * Context Bridge 시스템의 타입 정의
 * 모든 Context가 따라야 할 공통 인터페이스
 */

/**
 * Context의 기본 메타데이터
 */
export interface ContextMetadata {
  name: string;
  version: string;
  description?: string;
  dependencies?: string[];
  isReady: boolean;
  registeredAt: Date;
  lastUpdated: Date;
}

/**
 * Context의 상태
 */
export interface ContextState {
  status: 'initializing' | 'ready' | 'error' | 'disposed';
  errorMessage?: string;
  errorCount: number;
}

/**
 * 모든 Context가 구현해야 할 기본 인터페이스
 */
export interface IContext {
  // 고유 식별자
  readonly contextId: string;

  // 메타데이터
  readonly metadata: ContextMetadata;

  // 상태
  readonly state: ContextState;

  // 생명주기 메서드
  initialize?(): Promise<void>;
  dispose?(): void;

  // 상태 체크
  isReady(): boolean;
  getStatus(): ContextState;
}

/**
 * Context 간 메시지 전달을 위한 인터페이스
 */
export interface ContextMessage<T = any> {
  from: string;
  to: string;
  type: string;
  payload: T;
  timestamp: Date;
  id: string;
}

/**
 * Context 이벤트
 */
export interface ContextEvent {
  contextId: string;
  type: 'registered' | 'unregistered' | 'ready' | 'error' | 'message';
  data?: any;
  timestamp: Date;
}

/**
 * Context Registry Entry
 */
export interface RegistryEntry {
  context: IContext;
  metadata: ContextMetadata;
  state: ContextState;
  instance: any; // 실제 Context 인스턴스
}

/**
 * Global Context Manager 인터페이스
 */
export interface IGlobalContextManager {
  // Registry 관리
  register(name: string, context: any, metadata?: Partial<ContextMetadata>): void;
  unregister(name: string): void;
  get<T = any>(name: string): T | null;
  has(name: string): boolean;
  getAll(): Map<string, RegistryEntry>;

  // 상태 관리
  isReady(name: string): boolean;
  getStatus(name: string): ContextState | null;
  waitForContext(name: string, timeout?: number): Promise<any>;

  // 통신
  send(message: ContextMessage): void;
  broadcast(type: string, payload: any, from: string): void;

  // 이벤트
  on(event: string, handler: (data: ContextEvent) => void): void;
  off(event: string, handler: (data: ContextEvent) => void): void;

  // 유틸리티
  reset(): void;
  getMetrics(): ContextMetrics;
}

/**
 * Context 시스템 메트릭
 */
export interface ContextMetrics {
  totalRegistered: number;
  readyCount: number;
  errorCount: number;
  messagesSent: number;
  messagesReceived: number;
  registrySnapshot: Record<string, {
    name: string;
    status: string;
    isReady: boolean;
    errorCount: number;
  }>;
}

/**
 * Context Hook Return Type
 */
export interface UseContextRegistration {
  register: () => void;
  unregister: () => void;
  isRegistered: boolean;
  status: ContextState;
}

/**
 * Context 통신 콜백
 */
export type MessageHandler<T = any> = (message: ContextMessage<T>) => void;

/**
 * Context 설정 옵션
 */
export interface ContextOptions {
  autoRegister?: boolean;
  throwOnError?: boolean;
  retryOnFailure?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * 알려진 Context 이름들 (타입 안정성을 위해)
 */
export type KnownContextNames =
  | 'toast'
  | 'schedule'
  | 'buildup'
  | 'chat'
  | 'calendar'
  | 'userProfile'
  | 'notification'
  | 'vdr'
  | 'cluster'
  | 'kpiDiagnosis'
  | 'applicationProgress'
  | 'industryIntel'
  | 'growthTracking'
  | 'recommendation'
  | 'meetingNotes'
  | 'currentUser'
  | 'myProfile'
  | 'userDocument'
  | 'loading';

/**
 * Context 타입 맵핑 (타입 안정성)
 */
export interface ContextTypeMap {
  toast: any; // ToastContext 타입
  schedule: any; // ScheduleContext 타입
  buildup: any; // BuildupContext 타입
  // ... 추가 매핑
}