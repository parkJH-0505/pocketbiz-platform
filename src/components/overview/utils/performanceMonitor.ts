/**
 * @fileoverview 성능 측정 유틸리티
 * @description Phase 2 Step 5: 렌더링 성능, FPS, 메모리 측정
 * @author PocketCompany
 * @since 2025-01-30
 */

/**
 * 성능 메트릭 인터페이스
 */
export interface PerformanceMetrics {
  initialRender: number;           // 초기 렌더링 시간 (ms)
  bezierPathGeneration: number;    // 베지어 경로 생성 시간 (ms)
  coordinateCalculation: number;   // 좌표 계산 시간 (ms)
  hoverResponse: number;           // 호버 반응 시간 (ms)
  tooltipRender: number;           // 툴팁 렌더링 시간 (ms)
  animationFPS: number;            // 애니메이션 FPS
  memoryUsage: number;             // 메모리 사용량 (MB)
  timestamp: number;               // 측정 시각
}

/**
 * 성능 임계값 상수
 * Phase 5-4: 현실적인 임계값으로 조정
 */
export const PERFORMANCE_THRESHOLDS = {
  FRAME_TIME: 16.67,              // 60fps = 16.67ms
  INITIAL_RENDER: 100,            // 초기 렌더링 목표 (ms) - SVG 타임라인 고려
  BEZIER_GENERATION: 15,          // 베지어 생성 목표 (ms)
  HOVER_RESPONSE: 200,            // 호버 반응 목표 (ms)
  TOOLTIP_RENDER: 16,             // 툴팁 렌더링 목표 (ms)
  MEMORY_USAGE: 250,              // 메모리 사용 목표 (MB) - SVG 애니메이션 고려
  MIN_FPS: 30,                    // 최소 FPS - 애니메이션 중 30fps 이상 유지
} as const;

/**
 * 성능 측정 결과
 */
interface PerformanceMeasurement {
  duration: number;
  withinThreshold: boolean;
  threshold: number;
}

/**
 * 함수 실행 시간 측정
 *
 * @param label - 측정 라벨
 * @param fn - 측정할 함수
 * @param threshold - 임계값 (ms), 초과 시 경고
 * @returns 실행 시간 (ms)
 */
export const measurePerformance = (
  label: string,
  fn: () => void,
  threshold: number = PERFORMANCE_THRESHOLDS.FRAME_TIME
): PerformanceMeasurement => {
  const start = performance.now();
  fn();
  const end = performance.now();
  const duration = end - start;
  const withinThreshold = duration <= threshold;

  if (!withinThreshold) {
    console.warn(
      `⚠️ [Performance] ${label}: ${duration.toFixed(2)}ms (임계값: ${threshold}ms 초과)`
    );
  } else {
    console.log(
      `✓ [Performance] ${label}: ${duration.toFixed(2)}ms (임계값: ${threshold}ms 이내)`
    );
  }

  return { duration, withinThreshold, threshold };
};

/**
 * 비동기 함수 실행 시간 측정
 *
 * @param label - 측정 라벨
 * @param fn - 측정할 비동기 함수
 * @param threshold - 임계값 (ms)
 * @returns 실행 시간 (ms)
 */
export const measureAsyncPerformance = async (
  label: string,
  fn: () => Promise<void>,
  threshold: number = PERFORMANCE_THRESHOLDS.FRAME_TIME
): Promise<PerformanceMeasurement> => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  const duration = end - start;
  const withinThreshold = duration <= threshold;

  if (!withinThreshold) {
    console.warn(
      `⚠️ [Performance] ${label}: ${duration.toFixed(2)}ms (임계값: ${threshold}ms 초과)`
    );
  } else {
    console.log(
      `✓ [Performance] ${label}: ${duration.toFixed(2)}ms (임계값: ${threshold}ms 이내)`
    );
  }

  return { duration, withinThreshold, threshold };
};

/**
 * React 컴포넌트 렌더링 시간 측정
 *
 * @param componentName - 컴포넌트 이름
 * @param renderFn - 렌더링 함수
 * @returns 렌더링 시간 (ms)
 */
export const measureRenderTime = (
  componentName: string,
  renderFn: () => void
): PerformanceMeasurement => {
  return measurePerformance(
    `${componentName} Render`,
    renderFn,
    PERFORMANCE_THRESHOLDS.FRAME_TIME
  );
};

/**
 * 메모리 사용량 측정
 *
 * @returns 메모리 사용량 (MB) 또는 -1 (지원하지 않는 브라우저)
 */
export const measureMemory = (): number => {
  if (performance.memory) {
    const usedJSHeapSize = performance.memory.usedJSHeapSize;
    const usedMB = usedJSHeapSize / (1024 * 1024);

    const withinThreshold = usedMB <= PERFORMANCE_THRESHOLDS.MEMORY_USAGE;

    if (!withinThreshold) {
      console.warn(
        `⚠️ [Memory] 사용량: ${usedMB.toFixed(2)}MB (임계값: ${PERFORMANCE_THRESHOLDS.MEMORY_USAGE}MB 초과)`
      );
    } else {
      console.log(
        `✓ [Memory] 사용량: ${usedMB.toFixed(2)}MB (임계값: ${PERFORMANCE_THRESHOLDS.MEMORY_USAGE}MB 이내)`
      );
    }

    return usedMB;
  }

  console.warn('⚠️ [Memory] performance.memory API를 사용할 수 없습니다.');
  return -1;
};

/**
 * FPS 측정기 클래스
 */
export class FPSMonitor {
  private frames: number[] = [];
  private lastTime: number = performance.now();
  private rafId: number | null = null;

  /**
   * FPS 측정 시작
   */
  start(): void {
    this.frames = [];
    this.lastTime = performance.now();
    this.measure();
  }

  /**
   * FPS 측정 중지 및 결과 반환
   *
   * @returns 평균 FPS
   */
  stop(): number {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.frames.length === 0) return 0;

    const avgFPS = this.frames.reduce((sum, fps) => sum + fps, 0) / this.frames.length;
    const withinThreshold = avgFPS >= PERFORMANCE_THRESHOLDS.MIN_FPS;

    if (!withinThreshold) {
      console.warn(
        `⚠️ [FPS] 평균: ${avgFPS.toFixed(2)}fps (임계값: ${PERFORMANCE_THRESHOLDS.MIN_FPS}fps 미만)`
      );
    } else {
      console.log(
        `✓ [FPS] 평균: ${avgFPS.toFixed(2)}fps (임계값: ${PERFORMANCE_THRESHOLDS.MIN_FPS}fps 이상)`
      );
    }

    return avgFPS;
  }

  /**
   * 내부: FPS 측정 루프
   */
  private measure = (): void => {
    const currentTime = performance.now();
    const delta = currentTime - this.lastTime;

    // Phase 5-4: delta가 0이거나 너무 작을 때 무시 (Infinity 방지)
    if (delta > 0.1) {
      const fps = 1000 / delta;

      // Phase 5-4: 비정상적으로 높은 FPS 값 필터링 (120fps 초과 시 무시)
      if (fps <= 120) {
        this.frames.push(fps);
      }
    }

    this.lastTime = currentTime;

    // 최근 60개 프레임만 유지 (1초 분량)
    if (this.frames.length > 60) {
      this.frames.shift();
    }

    this.rafId = requestAnimationFrame(this.measure);
  };
}

/**
 * 성능 메트릭 로깅
 *
 * @param metrics - 성능 메트릭 객체
 */
export const logMetrics = (metrics: PerformanceMetrics): void => {
  console.group('📊 Phase 2 Performance Metrics');
  console.log('─'.repeat(60));

  console.log(`초기 렌더링: ${metrics.initialRender.toFixed(2)}ms ${
    metrics.initialRender <= PERFORMANCE_THRESHOLDS.INITIAL_RENDER ? '✓' : '⚠️'
  } (목표: ${PERFORMANCE_THRESHOLDS.INITIAL_RENDER}ms)`);

  console.log(`베지어 경로 생성: ${metrics.bezierPathGeneration.toFixed(2)}ms ${
    metrics.bezierPathGeneration <= PERFORMANCE_THRESHOLDS.BEZIER_GENERATION ? '✓' : '⚠️'
  } (목표: ${PERFORMANCE_THRESHOLDS.BEZIER_GENERATION}ms)`);

  console.log(`좌표 계산: ${metrics.coordinateCalculation.toFixed(2)}ms ✓`);

  console.log(`호버 반응: ${metrics.hoverResponse.toFixed(2)}ms ${
    metrics.hoverResponse <= PERFORMANCE_THRESHOLDS.HOVER_RESPONSE ? '✓' : '⚠️'
  } (목표: ${PERFORMANCE_THRESHOLDS.HOVER_RESPONSE}ms)`);

  console.log(`툴팁 렌더링: ${metrics.tooltipRender.toFixed(2)}ms ${
    metrics.tooltipRender <= PERFORMANCE_THRESHOLDS.TOOLTIP_RENDER ? '✓' : '⚠️'
  } (목표: ${PERFORMANCE_THRESHOLDS.TOOLTIP_RENDER}ms)`);

  console.log(`애니메이션 FPS: ${metrics.animationFPS.toFixed(2)}fps ${
    metrics.animationFPS >= PERFORMANCE_THRESHOLDS.MIN_FPS ? '✓' : '⚠️'
  } (목표: ${PERFORMANCE_THRESHOLDS.MIN_FPS}fps 이상)`);

  console.log(`메모리 사용: ${metrics.memoryUsage.toFixed(2)}MB ${
    metrics.memoryUsage <= PERFORMANCE_THRESHOLDS.MEMORY_USAGE ? '✓' : '⚠️'
  } (목표: ${PERFORMANCE_THRESHOLDS.MEMORY_USAGE}MB)`);

  console.log('─'.repeat(60));
  console.log(`측정 시각: ${new Date(metrics.timestamp).toLocaleString('ko-KR')}`);
  console.groupEnd();
};

/**
 * Phase 1 대비 성능 변화율 계산
 *
 * @param phase1Metrics - Phase 1 기준 메트릭
 * @param phase2Metrics - Phase 2 측정 메트릭
 */
export const comparePhases = (
  phase1Metrics: Partial<PerformanceMetrics>,
  phase2Metrics: PerformanceMetrics
): void => {
  console.group('📈 Phase 1 vs Phase 2 비교');
  console.log('─'.repeat(60));

  if (phase1Metrics.initialRender && phase2Metrics.initialRender) {
    const change = ((phase2Metrics.initialRender - phase1Metrics.initialRender) / phase1Metrics.initialRender) * 100;
    console.log(`초기 렌더링: ${phase1Metrics.initialRender}ms → ${phase2Metrics.initialRender.toFixed(2)}ms (${change > 0 ? '+' : ''}${change.toFixed(1)}%)`);
  }

  if (phase1Metrics.memoryUsage && phase2Metrics.memoryUsage) {
    const change = ((phase2Metrics.memoryUsage - phase1Metrics.memoryUsage) / phase1Metrics.memoryUsage) * 100;
    console.log(`메모리 사용: ${phase1Metrics.memoryUsage}MB → ${phase2Metrics.memoryUsage.toFixed(2)}MB (${change > 0 ? '+' : ''}${change.toFixed(1)}%)`);
  }

  console.log('─'.repeat(60));
  console.groupEnd();
};