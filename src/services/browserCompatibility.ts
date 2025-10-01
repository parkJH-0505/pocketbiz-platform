/**
 * 브라우저 호환성 검사 및 폴리필 시스템
 *
 * 다양한 브라우저 환경에서의 호환성을 확인하고
 * 필요한 경우 폴리필을 자동으로 적용
 */

interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  platform: string;
  mobile: boolean;
}

interface CompatibilityFeature {
  name: string;
  supported: boolean;
  polyfillAvailable: boolean;
  critical: boolean;
  testFunction: () => boolean;
  polyfillFunction?: () => void;
  fallbackFunction?: () => void;
}

interface CompatibilityReport {
  browserInfo: BrowserInfo;
  features: CompatibilityFeature[];
  overallScore: number;
  criticalIssues: string[];
  recommendations: string[];
  timestamp: number;
}

class BrowserCompatibilityChecker {
  private features: CompatibilityFeature[] = [];
  private browserInfo: BrowserInfo | null = null;

  constructor() {
    this.setupFeatureTests();
    this.detectBrowser();
  }

  // 브라우저 감지
  private detectBrowser(): void {
    const userAgent = navigator.userAgent;
    let name = 'Unknown';
    let version = 'Unknown';
    let engine = 'Unknown';

    // Chrome
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      name = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Blink';
    }
    // Firefox
    else if (userAgent.includes('Firefox')) {
      name = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Gecko';
    }
    // Safari
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      name = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'WebKit';
    }
    // Edge
    else if (userAgent.includes('Edg')) {
      name = 'Edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Blink';
    }
    // Internet Explorer
    else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
      name = 'Internet Explorer';
      const match = userAgent.match(/(?:MSIE |rv:)(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Trident';
    }

    this.browserInfo = {
      name,
      version,
      engine,
      platform: navigator.platform,
      mobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    };
  }

  // 기능 테스트 설정
  private setupFeatureTests(): void {
    this.features = [
      // ES6 기능들
      {
        name: 'ES6 Arrow Functions',
        supported: false,
        polyfillAvailable: false,
        critical: true,
        testFunction: () => {
          try {
            eval('(() => {})');
            return true;
          } catch {
            return false;
          }
        }
      },

      {
        name: 'ES6 Template Literals',
        supported: false,
        polyfillAvailable: false,
        critical: true,
        testFunction: () => {
          try {
            eval('`template`');
            return true;
          } catch {
            return false;
          }
        }
      },

      {
        name: 'ES6 Classes',
        supported: false,
        polyfillAvailable: true,
        critical: true,
        testFunction: () => {
          try {
            eval('class Test {}');
            return true;
          } catch {
            return false;
          }
        }
      },

      // Web APIs
      {
        name: 'Fetch API',
        supported: false,
        polyfillAvailable: true,
        critical: true,
        testFunction: () => 'fetch' in window,
        polyfillFunction: () => this.polyfillFetch()
      },

      {
        name: 'Promise',
        supported: false,
        polyfillAvailable: true,
        critical: true,
        testFunction: () => 'Promise' in window,
        polyfillFunction: () => this.polyfillPromise()
      },

      {
        name: 'localStorage',
        supported: false,
        polyfillAvailable: true,
        critical: true,
        testFunction: () => {
          try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
          } catch {
            return false;
          }
        },
        polyfillFunction: () => this.polyfillLocalStorage()
      },

      {
        name: 'sessionStorage',
        supported: false,
        polyfillAvailable: true,
        critical: false,
        testFunction: () => {
          try {
            sessionStorage.setItem('test', 'test');
            sessionStorage.removeItem('test');
            return true;
          } catch {
            return false;
          }
        }
      },

      // CSS 기능들
      {
        name: 'CSS Grid',
        supported: false,
        polyfillAvailable: false,
        critical: false,
        testFunction: () => CSS.supports('display', 'grid')
      },

      {
        name: 'CSS Flexbox',
        supported: false,
        polyfillAvailable: false,
        critical: true,
        testFunction: () => CSS.supports('display', 'flex')
      },

      {
        name: 'CSS Custom Properties',
        supported: false,
        polyfillAvailable: true,
        critical: false,
        testFunction: () => CSS.supports('--custom-property', 'value')
      },

      // DOM APIs
      {
        name: 'querySelector',
        supported: false,
        polyfillAvailable: true,
        critical: true,
        testFunction: () => 'querySelector' in document
      },

      {
        name: 'addEventListener',
        supported: false,
        polyfillAvailable: true,
        critical: true,
        testFunction: () => 'addEventListener' in window
      },

      {
        name: 'IntersectionObserver',
        supported: false,
        polyfillAvailable: true,
        critical: false,
        testFunction: () => 'IntersectionObserver' in window,
        polyfillFunction: () => this.polyfillIntersectionObserver()
      },

      {
        name: 'ResizeObserver',
        supported: false,
        polyfillAvailable: true,
        critical: false,
        testFunction: () => 'ResizeObserver' in window
      },

      // Performance APIs
      {
        name: 'Performance API',
        supported: false,
        polyfillAvailable: false,
        critical: false,
        testFunction: () => 'performance' in window && 'now' in performance
      },

      {
        name: 'requestAnimationFrame',
        supported: false,
        polyfillAvailable: true,
        critical: true,
        testFunction: () => 'requestAnimationFrame' in window,
        polyfillFunction: () => this.polyfillRequestAnimationFrame()
      },

      // 기타 중요 API들
      {
        name: 'JSON',
        supported: false,
        polyfillAvailable: true,
        critical: true,
        testFunction: () => 'JSON' in window && 'parse' in JSON && 'stringify' in JSON
      },

      {
        name: 'Array.from',
        supported: false,
        polyfillAvailable: true,
        critical: true,
        testFunction: () => 'from' in Array,
        polyfillFunction: () => this.polyfillArrayFrom()
      },

      {
        name: 'Object.assign',
        supported: false,
        polyfillAvailable: true,
        critical: true,
        testFunction: () => 'assign' in Object,
        polyfillFunction: () => this.polyfillObjectAssign()
      }
    ];
  }

  // 호환성 검사 실행
  runCompatibilityCheck(): CompatibilityReport {
    console.log('[BrowserCompatibility] 호환성 검사 시작');

    // 각 기능 테스트
    this.features.forEach(feature => {
      feature.supported = feature.testFunction();
    });

    // 전체 점수 계산
    const totalFeatures = this.features.length;
    const supportedFeatures = this.features.filter(f => f.supported).length;
    const overallScore = Math.round((supportedFeatures / totalFeatures) * 100);

    // 중요한 문제들 식별
    const criticalIssues = this.features
      .filter(f => f.critical && !f.supported)
      .map(f => f.name);

    // 추천사항 생성
    const recommendations = this.generateRecommendations();

    const report: CompatibilityReport = {
      browserInfo: this.browserInfo!,
      features: this.features,
      overallScore,
      criticalIssues,
      recommendations,
      timestamp: Date.now()
    };

    console.log('[BrowserCompatibility] 호환성 검사 완료:', report);
    return report;
  }

  // 폴리필 자동 적용
  applyPolyfills(): void {
    console.log('[BrowserCompatibility] 폴리필 적용 시작');

    this.features
      .filter(f => !f.supported && f.polyfillAvailable && f.polyfillFunction)
      .forEach(feature => {
        try {
          feature.polyfillFunction!();
          console.log(`[BrowserCompatibility] ${feature.name} 폴리필 적용 완료`);
        } catch (error) {
          console.error(`[BrowserCompatibility] ${feature.name} 폴리필 적용 실패:`, error);
        }
      });
  }

  // 추천사항 생성
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.browserInfo?.name === 'Internet Explorer') {
      recommendations.push('Internet Explorer는 지원이 제한됩니다. Chrome, Firefox, Safari, Edge 사용을 권장합니다.');
    }

    const criticalUnsupported = this.features.filter(f => f.critical && !f.supported);
    if (criticalUnsupported.length > 0) {
      recommendations.push('중요한 기능이 지원되지 않습니다. 브라우저 업데이트가 필요할 수 있습니다.');
    }

    const polyfillableFeatures = this.features.filter(f => !f.supported && f.polyfillAvailable);
    if (polyfillableFeatures.length > 0) {
      recommendations.push('일부 기능에 대한 폴리필이 자동으로 적용됩니다.');
    }

    if (this.browserInfo?.mobile) {
      recommendations.push('모바일 환경에서는 성능 최적화가 중요합니다.');
    }

    return recommendations;
  }

  // 폴리필 구현들
  private polyfillFetch(): void {
    if (!('fetch' in window)) {
      (window as any).fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open(init?.method || 'GET', input.toString());

          if (init?.headers) {
            Object.entries(init.headers).forEach(([key, value]) => {
              xhr.setRequestHeader(key, value as string);
            });
          }

          xhr.onload = () => {
            resolve({
              ok: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              statusText: xhr.statusText,
              json: () => Promise.resolve(JSON.parse(xhr.responseText)),
              text: () => Promise.resolve(xhr.responseText)
            } as Response);
          };

          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send(init?.body);
        });
      };
    }
  }

  private polyfillPromise(): void {
    if (!('Promise' in window)) {
      // 간단한 Promise 폴리필 (실제 프로덕션에서는 완전한 polyfill 라이브러리 사용 권장)
      (window as any).Promise = class SimplePromise {
        constructor(executor: (resolve: (value: any) => void, reject: (reason: any) => void) => void) {
          let resolved = false;
          let rejected = false;
          let value: any;
          let reason: any;
          const resolveCallbacks: ((value: any) => void)[] = [];
          const rejectCallbacks: ((reason: any) => void)[] = [];

          const resolve = (val: any) => {
            if (resolved || rejected) return;
            resolved = true;
            value = val;
            resolveCallbacks.forEach(cb => cb(val));
          };

          const reject = (err: any) => {
            if (resolved || rejected) return;
            rejected = true;
            reason = err;
            rejectCallbacks.forEach(cb => cb(err));
          };

          this.then = (onResolve?: (value: any) => any, onReject?: (reason: any) => any) => {
            return new SimplePromise((res, rej) => {
              const handleResolve = (val: any) => {
                try {
                  const result = onResolve ? onResolve(val) : val;
                  res(result);
                } catch (error) {
                  rej(error);
                }
              };

              const handleReject = (err: any) => {
                try {
                  const result = onReject ? onReject(err) : err;
                  rej(result);
                } catch (error) {
                  rej(error);
                }
              };

              if (resolved) {
                setTimeout(() => handleResolve(value), 0);
              } else if (rejected) {
                setTimeout(() => handleReject(reason), 0);
              } else {
                resolveCallbacks.push(handleResolve);
                rejectCallbacks.push(handleReject);
              }
            });
          };

          executor(resolve, reject);
        }

        then: (onResolve?: (value: any) => any, onReject?: (reason: any) => any) => any;
      };
    }
  }

  private polyfillLocalStorage(): void {
    if (!('localStorage' in window)) {
      const storage: { [key: string]: string } = {};
      (window as any).localStorage = {
        getItem: (key: string) => storage[key] || null,
        setItem: (key: string, value: string) => { storage[key] = value; },
        removeItem: (key: string) => { delete storage[key]; },
        clear: () => { Object.keys(storage).forEach(key => delete storage[key]); },
        get length() { return Object.keys(storage).length; },
        key: (index: number) => Object.keys(storage)[index] || null
      };
    }
  }

  private polyfillIntersectionObserver(): void {
    if (!('IntersectionObserver' in window)) {
      // 간단한 IntersectionObserver 폴리필
      (window as any).IntersectionObserver = class SimpleIntersectionObserver {
        constructor(callback: (entries: any[]) => void) {
          this.callback = callback;
          this.targets = [];
        }

        callback: (entries: any[]) => void;
        targets: Element[];

        observe(target: Element) {
          this.targets.push(target);
          // 실제 구현에서는 스크롤 이벤트를 사용하여 가시성 체크
        }

        unobserve(target: Element) {
          this.targets = this.targets.filter(t => t !== target);
        }

        disconnect() {
          this.targets = [];
        }
      };
    }
  }

  private polyfillRequestAnimationFrame(): void {
    if (!('requestAnimationFrame' in window)) {
      (window as any).requestAnimationFrame = (callback: FrameRequestCallback) => {
        return setTimeout(callback, 1000 / 60); // 60fps
      };

      (window as any).cancelAnimationFrame = (id: number) => {
        clearTimeout(id);
      };
    }
  }

  private polyfillArrayFrom(): void {
    if (!('from' in Array)) {
      (Array as any).from = (arrayLike: any, mapFn?: (value: any, index: number) => any) => {
        const result = [];
        for (let i = 0; i < arrayLike.length; i++) {
          result[i] = mapFn ? mapFn(arrayLike[i], i) : arrayLike[i];
        }
        return result;
      };
    }
  }

  private polyfillObjectAssign(): void {
    if (!('assign' in Object)) {
      (Object as any).assign = (target: any, ...sources: any[]) => {
        sources.forEach(source => {
          if (source) {
            Object.keys(source).forEach(key => {
              target[key] = source[key];
            });
          }
        });
        return target;
      };
    }
  }

  // 브라우저 정보 조회
  getBrowserInfo(): BrowserInfo | null {
    return this.browserInfo;
  }

  // 기능 지원 여부 확인
  isFeatureSupported(featureName: string): boolean {
    const feature = this.features.find(f => f.name === featureName);
    return feature ? feature.supported : false;
  }

  // 호환성 보고서 저장
  saveReport(report: CompatibilityReport): void {
    try {
      localStorage.setItem('browser-compatibility-report', JSON.stringify(report));
    } catch (error) {
      console.warn('[BrowserCompatibility] 보고서 저장 실패:', error);
    }
  }

  // 저장된 보고서 조회
  getStoredReport(): CompatibilityReport | null {
    try {
      const stored = localStorage.getItem('browser-compatibility-report');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}

// 싱글톤 인스턴스
export const browserCompatibility = new BrowserCompatibilityChecker();

// 자동 초기화 및 폴리필 적용
if (typeof window !== 'undefined') {
  // 호환성 검사 실행
  const report = browserCompatibility.runCompatibilityCheck();

  // 중요한 문제가 있는 경우 폴리필 적용
  if (report.criticalIssues.length > 0) {
    browserCompatibility.applyPolyfills();
  }

  // 보고서 저장
  browserCompatibility.saveReport(report);

  // 개발 환경에서 콘솔에 결과 출력
  if (import.meta.env.DEV) {
    console.log('[BrowserCompatibility] 전체 호환성 점수:', report.overallScore + '%');
    if (report.criticalIssues.length > 0) {
      console.warn('[BrowserCompatibility] 중요한 호환성 문제:', report.criticalIssues);
    }
    (window as any).browserCompatibility = browserCompatibility;
    console.log('💡 개발자 도구에서 "browserCompatibility" 객체 사용 가능');
  }
}