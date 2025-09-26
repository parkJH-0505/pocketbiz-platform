/**
 * Lazy Loading Utilities for V2 Dashboard
 * 무거운 유틸리티 함수들을 동적으로 로드하여 초기 번들 사이즈 감소
 */

// AI 인사이트 엔진 동적 로드
export const loadAIInsights = async () => {
  const module = await import('./aiInsights');
  return module.AIInsightsEngine;
};

// 고급 시나리오 엔진 동적 로드
export const loadScenarioEngine = async () => {
  const module = await import('./index');
  return module.AdvancedScenarioEngine;
};

// 히스토리 트래커 동적 로드
export const loadHistoryTracker = async () => {
  const module = await import('./historyTracker');
  return module.HistoryTracker;
};

// 실시간 동기화 매니저 동적 로드
export const loadRealTimeSync = async () => {
  const module = await import('./realTimeSync');
  return module.RealTimeSyncManager;
};

// 데이터 품질 평가 함수 동적 로드
export const loadDataQuality = async () => {
  const module = await import('./dataQuality');
  return {
    assessDataQuality: module.assessDataQuality,
    generateQualityReport: module.generateQualityReport,
    calculateReliabilityScore: module.calculateReliabilityScore
  };
};

// 비즈니스 로직 함수들 동적 로드
export const loadBusinessLogic = async () => {
  const module = await import('./businessLogic');
  return {
    calculateWeightedOverallScore: module.calculateWeightedOverallScore,
    calculateBusinessMetrics: module.calculateBusinessMetrics,
    calculateROI: module.calculateROI,
    calculateMarketFit: module.calculateMarketFit
  };
};

// 캐싱을 위한 Map
const moduleCache = new Map<string, any>();

// 캐싱된 모듈 로더
export const getCachedModule = async (
  moduleName: string,
  loader: () => Promise<any>
) => {
  if (!moduleCache.has(moduleName)) {
    const module = await loader();
    moduleCache.set(moduleName, module);
  }
  return moduleCache.get(moduleName);
};

// 모든 무거운 모듈을 프리로드 (선택적)
export const preloadHeavyModules = () => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      // 순차적으로 로드하여 메모리 압박 최소화
      Promise.all([
        loadAIInsights(),
        loadScenarioEngine(),
        loadHistoryTracker()
      ]).catch(console.error);
    });
  }
};