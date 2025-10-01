/**
 * Retry Mechanism & Circuit Breaker
 * 재시도 메커니즘과 서킷 브레이커 구현
 */

/**
 * 재시도 옵션
 */
export interface RetryOptions {
  maxRetries?: number;           // 최대 재시도 횟수
  initialDelay?: number;          // 초기 지연 시간 (ms)
  maxDelay?: number;             // 최대 지연 시간 (ms)
  factor?: number;               // 지연 시간 증가 계수
  jitter?: boolean;              // 지터 추가 여부
  retryCondition?: (error: any) => boolean; // 재시도 조건
  onRetry?: (error: any, retryCount: number) => void; // 재시도 콜백
}

/**
 * 서킷 브레이커 상태
 */
export enum CircuitState {
  CLOSED = 'closed',     // 정상 (요청 통과)
  OPEN = 'open',        // 차단 (요청 차단)
  HALF_OPEN = 'half_open' // 반개방 (테스트 요청)
}

/**
 * 서킷 브레이커 옵션
 */
export interface CircuitBreakerOptions {
  failureThreshold?: number;     // 실패 임계값 (%)
  volumeThreshold?: number;      // 최소 요청 수
  timeout?: number;              // 타임아웃 시간 (ms)
  resetTimeout?: number;         // 리셋 대기 시간 (ms)
  monitoringPeriod?: number;     // 모니터링 기간 (ms)
  onStateChange?: (state: CircuitState) => void;
}

/**
 * 재시도 메커니즘 클래스
 */
export class RetryMechanism {
  private defaultOptions: Required<RetryOptions> = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    factor: 2,
    jitter: true,
    retryCondition: (error) => {
      // 기본적으로 네트워크 에러와 5xx 에러만 재시도
      if (error.code === 'NETWORK_ERROR') return true;
      if (error.status >= 500 && error.status < 600) return true;
      if (error.message?.includes('timeout')) return true;
      return false;
    },
    onRetry: () => {}
  };

  /**
   * 지수 백오프로 재시도
   */
  async withExponentialBackoff<T>(
    fn: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    let lastError: any;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // 마지막 시도거나 재시도 조건을 만족하지 않으면 에러 throw
        if (attempt === opts.maxRetries || !opts.retryCondition(error)) {
          throw error;
        }

        // 재시도 콜백 실행
        opts.onRetry(error, attempt + 1);

        // 지연 시간 계산
        const delay = this.calculateDelay(attempt, opts);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * 선형 재시도
   */
  async withLinearBackoff<T>(
    fn: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> {
    const opts = {
      ...this.defaultOptions,
      ...options,
      factor: 1 // 선형 증가
    };

    return this.withExponentialBackoff(fn, opts);
  }

  /**
   * 고정 간격 재시도
   */
  async withFixedDelay<T>(
    fn: () => Promise<T>,
    delay: number = 1000,
    maxRetries: number = 3
  ): Promise<T> {
    const opts: RetryOptions = {
      maxRetries,
      initialDelay: delay,
      factor: 0, // 증가 없음
      jitter: false
    };

    return this.withExponentialBackoff(fn, opts);
  }

  /**
   * 지연 시간 계산
   */
  private calculateDelay(attempt: number, options: Required<RetryOptions>): number {
    let delay = options.initialDelay;

    // 지수 백오프
    if (options.factor > 0) {
      delay = options.initialDelay * Math.pow(options.factor, attempt);
    }

    // 최대 지연 시간 제한
    delay = Math.min(delay, options.maxDelay);

    // 지터 추가 (랜덤성)
    if (options.jitter) {
      const jitterValue = delay * 0.2 * Math.random(); // 최대 20% 지터
      delay = delay + jitterValue;
    }

    return Math.floor(delay);
  }

  /**
   * 슬립 함수
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 서킷 브레이커 클래스
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private totalRequests = 0;
  private lastFailureTime: number | null = null;
  private nextAttempt: number = Date.now();
  private requestWindow: number[] = [];

  private options: Required<CircuitBreakerOptions>;

  constructor(options?: CircuitBreakerOptions) {
    this.options = {
      failureThreshold: 50,      // 50% 실패율
      volumeThreshold: 10,       // 최소 10개 요청
      timeout: 10000,            // 10초 타임아웃
      resetTimeout: 30000,       // 30초 후 재시도
      monitoringPeriod: 60000,   // 1분간 모니터링
      onStateChange: () => {},
      ...options
    };
  }

  /**
   * 서킷 브레이커를 통한 함수 실행
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // 상태 확인
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker is OPEN. Next attempt at ${new Date(this.nextAttempt).toISOString()}`);
      }
      // HALF_OPEN 상태로 전환
      this.changeState(CircuitState.HALF_OPEN);
    }

    try {
      // 타임아웃 적용
      const result = await this.withTimeout(fn, this.options.timeout);

      // 성공 처리
      this.onSuccess();

      return result;
    } catch (error) {
      // 실패 처리
      this.onFailure();

      throw error;
    }
  }

  /**
   * 성공 처리
   */
  private onSuccess(): void {
    this.successes++;
    this.totalRequests++;
    this.updateRequestWindow();

    if (this.state === CircuitState.HALF_OPEN) {
      // HALF_OPEN 상태에서 성공하면 CLOSED로 전환
      this.changeState(CircuitState.CLOSED);
      this.reset();
    }
  }

  /**
   * 실패 처리
   */
  private onFailure(): void {
    this.failures++;
    this.totalRequests++;
    this.lastFailureTime = Date.now();
    this.updateRequestWindow();

    if (this.state === CircuitState.HALF_OPEN) {
      // HALF_OPEN 상태에서 실패하면 다시 OPEN으로
      this.changeState(CircuitState.OPEN);
      this.nextAttempt = Date.now() + this.options.resetTimeout;
    } else if (this.shouldOpen()) {
      // CLOSED 상태에서 임계값 초과시 OPEN으로
      this.changeState(CircuitState.OPEN);
      this.nextAttempt = Date.now() + this.options.resetTimeout;
    }
  }

  /**
   * OPEN 상태로 전환해야 하는지 확인
   */
  private shouldOpen(): boolean {
    // 최소 요청 수 체크
    if (this.totalRequests < this.options.volumeThreshold) {
      return false;
    }

    // 실패율 계산
    const failureRate = (this.failures / this.totalRequests) * 100;

    return failureRate >= this.options.failureThreshold;
  }

  /**
   * 상태 변경
   */
  private changeState(newState: CircuitState): void {
    if (this.state !== newState) {
      console.log(`Circuit breaker state changed: ${this.state} -> ${newState}`);
      this.state = newState;
      this.options.onStateChange(newState);
    }
  }

  /**
   * 요청 윈도우 업데이트
   */
  private updateRequestWindow(): void {
    const now = Date.now();
    const windowStart = now - this.options.monitoringPeriod;

    // 오래된 요청 제거
    this.requestWindow = this.requestWindow.filter(time => time > windowStart);
    this.requestWindow.push(now);

    // 윈도우 밖의 통계 리셋
    if (this.requestWindow.length === 1) {
      this.reset();
    }
  }

  /**
   * 통계 리셋
   */
  private reset(): void {
    this.failures = 0;
    this.successes = 0;
    this.totalRequests = 0;
  }

  /**
   * 타임아웃 적용
   */
  private async withTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )
    ]);
  }

  /**
   * 현재 상태 조회
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * 통계 조회
   */
  getStats() {
    const failureRate = this.totalRequests > 0
      ? (this.failures / this.totalRequests) * 100
      : 0;

    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      totalRequests: this.totalRequests,
      failureRate: failureRate.toFixed(2) + '%',
      lastFailureTime: this.lastFailureTime
        ? new Date(this.lastFailureTime).toISOString()
        : null,
      nextAttempt: this.state === CircuitState.OPEN
        ? new Date(this.nextAttempt).toISOString()
        : null
    };
  }

  /**
   * 수동 리셋
   */
  forceReset(): void {
    this.changeState(CircuitState.CLOSED);
    this.reset();
    this.requestWindow = [];
    this.lastFailureTime = null;
    this.nextAttempt = Date.now();
  }

  /**
   * 수동으로 서킷 열기
   */
  forceOpen(): void {
    this.changeState(CircuitState.OPEN);
    this.nextAttempt = Date.now() + this.options.resetTimeout;
  }
}

/**
 * 재시도 가능한 fetch 래퍼
 */
export class ResilientFetch {
  private retry: RetryMechanism;
  private circuitBreaker: CircuitBreaker;

  constructor() {
    this.retry = new RetryMechanism();
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 50,
      volumeThreshold: 5,
      resetTimeout: 30000
    });
  }

  /**
   * 탄력적인 fetch 실행
   */
  async fetch(
    url: string,
    options?: RequestInit,
    retryOptions?: RetryOptions
  ): Promise<Response> {
    return this.circuitBreaker.execute(async () => {
      return this.retry.withExponentialBackoff(
        async () => {
          const response = await fetch(url, options);

          if (!response.ok && response.status >= 500) {
            throw new Error(`Server error: ${response.status}`);
          }

          return response;
        },
        retryOptions
      );
    });
  }

  /**
   * JSON 응답 fetch
   */
  async fetchJSON<T>(
    url: string,
    options?: RequestInit,
    retryOptions?: RetryOptions
  ): Promise<T> {
    const response = await this.fetch(url, options, retryOptions);
    return response.json();
  }

  /**
   * 서킷 브레이커 상태 조회
   */
  getCircuitState() {
    return this.circuitBreaker.getStats();
  }

  /**
   * 서킷 브레이커 리셋
   */
  resetCircuit() {
    this.circuitBreaker.forceReset();
  }
}

// 싱글톤 인스턴스
let retryInstance: RetryMechanism | null = null;
let resilientFetchInstance: ResilientFetch | null = null;

export function getRetryMechanism(): RetryMechanism {
  if (!retryInstance) {
    retryInstance = new RetryMechanism();
  }
  return retryInstance;
}

export function getResilientFetch(): ResilientFetch {
  if (!resilientFetchInstance) {
    resilientFetchInstance = new ResilientFetch();
  }
  return resilientFetchInstance;
}

/**
 * 재시도 데코레이터
 */
export function withRetry(options?: RetryOptions) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const retry = getRetryMechanism();

    descriptor.value = async function (...args: any[]) {
      return retry.withExponentialBackoff(
        () => originalMethod.apply(this, args),
        options
      );
    };

    return descriptor;
  };
}

/**
 * 서킷 브레이커 데코레이터
 */
export function withCircuitBreaker(options?: CircuitBreakerOptions) {
  const circuitBreaker = new CircuitBreaker(options);

  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return circuitBreaker.execute(
        () => originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}