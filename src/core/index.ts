/**
 * core/index.ts
 *
 * Stage C-1 기반 인프라의 중앙 집중식 export
 * 다른 모듈에서 쉽게 import할 수 있도록 구성
 */

// Event System
export {
  EventBus,
  eventBus,
  createEvent
} from './events/EventBus';

export type {
  SystemEvent,
  EventTypeMap,
  EventHandler,
  MeetingCompletedEvent,
  PhaseChangeRequestEvent,
  PhaseChangedEvent,
  ProjectUpdatedEvent,
  SystemErrorEvent,
  EventBusConfig,
  EventMiddleware,
  EventMetrics
} from './events/eventTypes';

// Service Registry
export {
  ServiceRegistry,
  serviceRegistry,
  ServiceRegistryError
} from './services/ServiceRegistry';

export type {
  ServiceMetadata,
  ServiceStatus,
  ServiceInfo,
  ServiceFactory,
  ServiceInitOptions
} from './services/ServiceRegistry';

// Logging System
export {
  Logger,
  logger,
  log
} from './logging/Logger';

export type {
  LogLevel,
  LogEntry,
  LoggerConfig,
  ErrorCategory,
  PerformanceMetrics
} from './logging/Logger';

// React Hooks
export {
  useEventBus,
  useMeetingCompletedEvent,
  usePhaseChangedEvent,
  useProjectUpdatedEvent
} from './hooks/useEventBus';

// Phase Transition Module (Stage C-2)
export {
  PhaseTransitionModule,
  phaseTransitionModule,
  usePhaseTransitionModule
} from './phaseTransition/PhaseTransitionModule';

export {
  PhaseTransitionManager,
  phaseTransitionManager
} from './phaseTransition/PhaseTransitionManager';

export type {
  PhaseDefinition,
  PhaseMilestoneDefinition,
  PhaseMilestoneState,
  ProjectPhaseState,
  ProjectPhaseSummary,
  MilestoneStatus
} from './phaseTransition/PhaseTransitionManager';

// Utilities and Constants
export const CORE_VERSION = '1.0.0';
export const CORE_BUILD_DATE = new Date().toISOString();

// Core system health check
export const getCoreSystemHealth = async () => {
  const eventBusMetrics = eventBus.getMetrics();
  const serviceRegistryMetrics = serviceRegistry.getMetrics();
  const loggerMetrics = logger.getMetrics();

  // Phase Transition Module 건강 상태 체크
  const phaseTransitionHealth = await phaseTransitionModule.healthCheck();

  const eventBusHealthy = eventBusMetrics.errorCount < 10;
  const serviceRegistryHealthy = serviceRegistryMetrics.errorServices === 0;
  const loggerHealthy = loggerMetrics.errorRate < 5;
  const phaseTransitionHealthy = phaseTransitionHealth.healthy;

  return {
    version: CORE_VERSION,
    timestamp: new Date().toISOString(),
    eventBus: {
      totalEvents: eventBusMetrics.totalEvents,
      activeListeners: eventBusMetrics.activeListeners,
      averageProcessingTime: eventBusMetrics.averageProcessingTime,
      errorCount: eventBusMetrics.errorCount,
      healthy: eventBusHealthy
    },
    serviceRegistry: {
      totalServices: serviceRegistryMetrics.totalServices,
      readyServices: serviceRegistryMetrics.readyServices,
      errorServices: serviceRegistryMetrics.errorServices,
      healthy: serviceRegistryHealthy
    },
    logger: {
      averageResponseTime: loggerMetrics.averageResponseTime,
      errorRate: loggerMetrics.errorRate,
      memoryUsage: loggerMetrics.memoryUsage,
      healthy: loggerHealthy
    },
    phaseTransition: {
      moduleState: phaseTransitionHealth.details.moduleState,
      featuresEnabled: phaseTransitionHealth.details.featuresEnabled,
      engineAvailable: phaseTransitionHealth.details.engineAvailable,
      healthy: phaseTransitionHealthy
    },
    overall: {
      healthy: eventBusHealthy && serviceRegistryHealthy && loggerHealthy && phaseTransitionHealthy
    }
  };
};

// Development utilities (개발 환경에서만 사용)
export const devUtils = process.env.NODE_ENV === 'development' ? {
  // EventBus 상태 조회
  getEventBusState: () => ({
    metrics: eventBus.getMetrics(),
    activeListeners: eventBus.getActiveListeners(),
    processingQueue: eventBus.getProcessingQueue()
  }),

  // ServiceRegistry 상태 조회
  getServiceRegistryState: () => ({
    services: serviceRegistry.getServiceInfos(),
    metrics: serviceRegistry.getMetrics()
  }),

  // Logger 상태 조회
  getLoggerState: () => ({
    metrics: logger.getMetrics()
  }),

  // Phase Transition Module 상태 조회
  getPhaseTransitionState: () => ({
    status: phaseTransitionModule.getStatus(),
    isAvailable: phaseTransitionModule.isAvailable(),
    version: phaseTransitionModule.getVersion()
  }),

  // 전체 시스템 리셋 (테스트용)
  resetAll: () => {
    EventBus.reset();
    ServiceRegistry.reset();
    Logger.reset();
    PhaseTransitionModule.reset();
  }
} : undefined;

// 초기화 함수
export const initializeCoreSystem = async (config?: {
  eventBus?: Partial<import('./events/eventTypes').EventBusConfig>;
  logger?: Partial<import('./logging/Logger').LoggerConfig>;
}) => {
  try {
    // Logger 먼저 초기화
    const loggerInstance = Logger.getInstance(config?.logger);
    loggerInstance.info('Core system initialization started', {
      version: CORE_VERSION,
      buildDate: CORE_BUILD_DATE
    }, 'CoreSystem');

    // EventBus 초기화
    const eventBusInstance = EventBus.getInstance(config?.eventBus);

    // ServiceRegistry는 이미 싱글톤으로 초기화됨
    const serviceRegistryInstance = ServiceRegistry.getInstance();

    // 시스템 건강 상태 체크
    const health = getCoreSystemHealth();

    loggerInstance.info('Core system initialization completed', {
      health
    }, 'CoreSystem');

    return {
      eventBus: eventBusInstance,
      serviceRegistry: serviceRegistryInstance,
      logger: loggerInstance,
      health
    };
  } catch (error) {
    console.error('Failed to initialize core system:', error);
    throw error;
  }
};

// 정리 함수
export const shutdownCoreSystem = () => {
  logger.info('Core system shutdown initiated', {}, 'CoreSystem');

  try {
    eventBus.shutdown();
    serviceRegistry.dispose();
    logger.flush();

    logger.info('Core system shutdown completed', {}, 'CoreSystem');
  } catch (error) {
    console.error('Error during core system shutdown:', error);
  }
};