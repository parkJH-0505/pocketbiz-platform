/**
 * 성능 최적화 자동화 시스템
 *
 * 식별된 성능 병목지점을 자동으로 최적화하고
 * 시스템 성능을 지속적으로 개선
 */

import { performanceMonitor } from './performanceMonitor';
import { momentumCache } from './momentumCache';

interface OptimizationRule {
  id: string;
  name: string;
  category: 'cache' | 'memory' | 'render' | 'network' | 'storage';
  condition: () => boolean;
  optimize: () => Promise<void> | void;
  description: string;
  impact: 'low' | 'medium' | 'high';
}

interface OptimizationResult {
  ruleId: string;
  applied: boolean;
  performanceGain?: number;
  error?: string;
  timestamp: number;
}

class PerformanceOptimizer {
  private optimizationRules: OptimizationRule[] = [];
  private results: OptimizationResult[] = [];
  private isOptimizing = false;

  constructor() {
    this.setupOptimizationRules();
  }

  // 최적화 규칙 설정
  private setupOptimizationRules(): void {
    this.optimizationRules = [
      // 캐시 최적화
      {
        id: 'cache-cleanup',
        name: '캐시 정리',
        category: 'cache',
        condition: () => {
          const cacheStats = momentumCache.getStats();
          return cacheStats.size > cacheStats.maxSize * 0.8;
        },
        optimize: () => {
          momentumCache.invalidate();
          console.log('[Optimizer] 캐시 정리 완료');
        },
        description: '캐시 사용량이 80% 초과 시 전체 캐시 정리',
        impact: 'medium'
      },

      // 메모리 최적화
      {
        id: 'memory-cleanup',
        name: '메모리 정리',
        category: 'memory',
        condition: () => {
          if (!(window as any).performance?.memory) return false;
          const memory = (window as any).performance.memory;
          const usagePercent = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
          return usagePercent > 0.8;
        },
        optimize: async () => {
          // 가비지 컬렉션 유도
          if (window.gc) {
            window.gc();
          }

          // 이벤트 리스너 정리
          this.cleanupEventListeners();

          // 오래된 데이터 정리
          this.cleanupOldData();

          console.log('[Optimizer] 메모리 정리 완료');
        },
        description: '메모리 사용량이 80% 초과 시 메모리 정리',
        impact: 'high'
      },

      // localStorage 최적화
      {
        id: 'storage-optimization',
        name: '스토리지 최적화',
        category: 'storage',
        condition: () => {
          try {
            const storageSize = new Blob(Object.values(localStorage)).size;
            return storageSize > 5 * 1024 * 1024; // 5MB
          } catch {
            return false;
          }
        },
        optimize: () => {
          this.optimizeLocalStorage();
          console.log('[Optimizer] 스토리지 최적화 완료');
        },
        description: 'localStorage 크기가 5MB 초과 시 오래된 데이터 정리',
        impact: 'medium'
      },

      // 렌더링 최적화
      {
        id: 'render-optimization',
        name: '렌더링 최적화',
        category: 'render',
        condition: () => {
          const perfData = performanceMonitor.getPerformanceData();
          return perfData.summary.averageRenderTime > 20; // 20ms 초과
        },
        optimize: () => {
          // DOM 조작 최적화
          this.optimizeDOM();
          console.log('[Optimizer] 렌더링 최적화 완료');
        },
        description: '평균 렌더링 시간이 20ms 초과 시 DOM 최적화',
        impact: 'high'
      },

      // 네트워크 최적화
      {
        id: 'network-optimization',
        name: '네트워크 최적화',
        category: 'network',
        condition: () => {
          const perfData = performanceMonitor.getPerformanceData();
          return perfData.summary.networkRequestCount > 10; // 1분간 10개 초과
        },
        optimize: () => {
          // 중복 요청 방지
          this.optimizeNetworkRequests();
          console.log('[Optimizer] 네트워크 최적화 완료');
        },
        description: '1분간 네트워크 요청이 10개 초과 시 요청 최적화',
        impact: 'medium'
      },

      // 이미지 최적화
      {
        id: 'image-optimization',
        name: '이미지 최적화',
        category: 'render',
        condition: () => {
          const images = document.querySelectorAll('img');
          let unoptimizedCount = 0;
          images.forEach(img => {
            if (img.naturalWidth > 1920 || img.naturalHeight > 1080) {
              unoptimizedCount++;
            }
          });
          return unoptimizedCount > 5;
        },
        optimize: () => {
          this.optimizeImages();
          console.log('[Optimizer] 이미지 최적화 완료');
        },
        description: '최적화되지 않은 대용량 이미지가 5개 초과 시 최적화',
        impact: 'medium'
      }
    ];
  }

  // 자동 최적화 실행
  async runAutoOptimization(): Promise<OptimizationResult[]> {
    if (this.isOptimizing) {
      console.log('[Optimizer] 이미 최적화 진행 중');
      return [];
    }

    this.isOptimizing = true;
    const results: OptimizationResult[] = [];

    console.log('[Optimizer] 자동 최적화 시작');

    for (const rule of this.optimizationRules) {
      try {
        if (rule.condition()) {
          console.log(`[Optimizer] 규칙 적용: ${rule.name}`);

          const beforePerf = this.measurePerformance();
          await rule.optimize();
          const afterPerf = this.measurePerformance();

          const result: OptimizationResult = {
            ruleId: rule.id,
            applied: true,
            performanceGain: afterPerf - beforePerf,
            timestamp: Date.now()
          };

          results.push(result);
          this.results.push(result);
        }
      } catch (error) {
        console.error(`[Optimizer] 규칙 적용 실패: ${rule.name}`, error);
        const result: OptimizationResult = {
          ruleId: rule.id,
          applied: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: Date.now()
        };

        results.push(result);
        this.results.push(result);
      }
    }

    this.isOptimizing = false;
    console.log(`[Optimizer] 자동 최적화 완료: ${results.length}개 규칙 처리`);

    return results;
  }

  // 성능 측정
  private measurePerformance(): number {
    if (!(window as any).performance?.memory) return 0;

    const memory = (window as any).performance.memory;
    const memoryScore = (1 - memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

    // 추가 성능 지표들을 종합한 점수
    return memoryScore;
  }

  // 이벤트 리스너 정리
  private cleanupEventListeners(): void {
    // 오래된 또는 사용하지 않는 이벤트 리스너 정리
    const elementsWithListeners = document.querySelectorAll('[data-has-listeners]');
    elementsWithListeners.forEach(element => {
      if (!element.isConnected) {
        element.removeAttribute('data-has-listeners');
      }
    });
  }

  // 오래된 데이터 정리
  private cleanupOldData(): void {
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    // localStorage에서 오래된 데이터 찾기
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // 날짜 기반 키들 정리
      if (key.includes('-2024-') || key.includes('-2023-')) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const data = JSON.parse(item);
            if (data.timestamp && data.timestamp < oneWeekAgo) {
              keysToRemove.push(key);
            }
          }
        } catch {
          // JSON 파싱 실패한 오래된 데이터도 정리
          if (key.includes('old-') || key.includes('temp-')) {
            keysToRemove.push(key);
          }
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`[Optimizer] ${keysToRemove.length}개 오래된 데이터 정리`);
  }

  // localStorage 최적화
  private optimizeLocalStorage(): void {
    const compressionTargets = [
      'kpi-historical-data',
      'project-timeline-data',
      'document-cache',
      'user-activity-log'
    ];

    compressionTargets.forEach(key => {
      const data = localStorage.getItem(key);
      if (data && data.length > 10000) { // 10KB 초과
        try {
          const parsed = JSON.parse(data);

          // 데이터 압축 (중복 제거, 필요없는 필드 제거)
          const compressed = this.compressData(parsed);
          localStorage.setItem(key, JSON.stringify(compressed));

          console.log(`[Optimizer] ${key} 데이터 압축 완료`);
        } catch (error) {
          console.warn(`[Optimizer] ${key} 압축 실패:`, error);
        }
      }
    });
  }

  // 데이터 압축
  private compressData(data: any): any {
    if (Array.isArray(data)) {
      // 배열에서 중복 제거 및 최신 100개만 유지
      const unique = data.filter((item, index, self) =>
        index === self.findIndex(t => JSON.stringify(t) === JSON.stringify(item))
      );
      return unique.slice(-100);
    }

    if (typeof data === 'object' && data !== null) {
      const compressed: any = {};
      Object.keys(data).forEach(key => {
        // 불필요한 필드 제거
        if (!key.startsWith('_') && !key.includes('temp') && data[key] !== undefined) {
          compressed[key] = this.compressData(data[key]);
        }
      });
      return compressed;
    }

    return data;
  }

  // DOM 최적화
  private optimizeDOM(): void {
    // 사용하지 않는 DOM 요소 정리
    const unusedElements = document.querySelectorAll('[data-unused]');
    unusedElements.forEach(el => el.remove());

    // 빈 텍스트 노드 정리
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          return node.textContent?.trim() === '' ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );

    const emptyTextNodes: Node[] = [];
    let node;
    while (node = walker.nextNode()) {
      emptyTextNodes.push(node);
    }

    emptyTextNodes.forEach(node => {
      node.parentNode?.removeChild(node);
    });

    console.log(`[Optimizer] ${emptyTextNodes.length}개 빈 텍스트 노드 정리`);
  }

  // 네트워크 요청 최적화
  private optimizeNetworkRequests(): void {
    // 요청 디바운싱 및 배치 처리
    if ((window as any).requestQueue) {
      const queue = (window as any).requestQueue;

      // 중복 요청 제거
      const uniqueRequests = queue.filter((req: any, index: number, self: any[]) =>
        index === self.findIndex(r => r.url === req.url && r.method === req.method)
      );

      (window as any).requestQueue = uniqueRequests;
      console.log(`[Optimizer] ${queue.length - uniqueRequests.length}개 중복 요청 제거`);
    }
  }

  // 이미지 최적화
  private optimizeImages(): void {
    const images = document.querySelectorAll('img');
    let optimizedCount = 0;

    images.forEach(img => {
      if (img.naturalWidth > 1920 || img.naturalHeight > 1080) {
        // lazy loading 적용
        if (!img.loading) {
          img.loading = 'lazy';
          optimizedCount++;
        }

        // srcset이 없으면 추가 권장
        if (!img.srcset && img.src) {
          console.warn(`[Optimizer] ${img.src} - srcset 사용 권장`);
        }
      }
    });

    console.log(`[Optimizer] ${optimizedCount}개 이미지에 lazy loading 적용`);
  }

  // 최적화 결과 조회
  getOptimizationResults(): OptimizationResult[] {
    return this.results.slice(-50); // 최근 50개
  }

  // 최적화 규칙 조회
  getOptimizationRules(): OptimizationRule[] {
    return this.optimizationRules;
  }

  // 수동 최적화 실행
  async runManualOptimization(ruleIds: string[]): Promise<OptimizationResult[]> {
    const results: OptimizationResult[] = [];

    for (const ruleId of ruleIds) {
      const rule = this.optimizationRules.find(r => r.id === ruleId);
      if (!rule) continue;

      try {
        console.log(`[Optimizer] 수동 규칙 적용: ${rule.name}`);

        const beforePerf = this.measurePerformance();
        await rule.optimize();
        const afterPerf = this.measurePerformance();

        const result: OptimizationResult = {
          ruleId: rule.id,
          applied: true,
          performanceGain: afterPerf - beforePerf,
          timestamp: Date.now()
        };

        results.push(result);
        this.results.push(result);
      } catch (error) {
        console.error(`[Optimizer] 수동 규칙 적용 실패: ${rule.name}`, error);
        const result: OptimizationResult = {
          ruleId: rule.id,
          applied: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: Date.now()
        };

        results.push(result);
        this.results.push(result);
      }
    }

    return results;
  }

  // 성능 보고서 생성
  generatePerformanceReport(): {
    summary: any;
    optimizations: OptimizationResult[];
    recommendations: string[];
  } {
    const perfData = performanceMonitor.getPerformanceData();
    const recentOptimizations = this.results.filter(r => Date.now() - r.timestamp < 3600000); // 1시간 내

    const recommendations: string[] = [];

    // 성능 기반 추천사항 생성
    if (perfData.summary.averageRenderTime > 16) {
      recommendations.push('렌더링 성능 개선: React.memo() 및 가상화 적용 검토');
    }

    if (perfData.summary.averageMemoryUsage > 100) {
      recommendations.push('메모리 사용량 최적화: 메모리 누수 확인 및 데이터 정리');
    }

    if (perfData.summary.networkRequestCount > 10) {
      recommendations.push('네트워크 요청 최적화: 요청 배치 및 캐싱 전략 개선');
    }

    return {
      summary: perfData.summary,
      optimizations: recentOptimizations,
      recommendations
    };
  }

  // 자동 최적화 스케줄러 시작
  startAutoOptimizationScheduler(intervalMinutes = 30): void {
    setInterval(async () => {
      console.log('[Optimizer] 정기 자동 최적화 실행');
      await this.runAutoOptimization();
    }, intervalMinutes * 60 * 1000);

    console.log(`[Optimizer] 자동 최적화 스케줄러 시작 (${intervalMinutes}분 간격)`);
  }
}

// 싱글톤 인스턴스
export const performanceOptimizer = new PerformanceOptimizer();

// 개발 환경에서 자동 시작 비활성화 (너무 많은 로그 출력 방지)
// if (typeof window !== 'undefined' && import.meta.env.DEV) {
//   performanceOptimizer.startAutoOptimizationScheduler(15); // 15분 간격
//   (window as any).performanceOptimizer = performanceOptimizer;
//   console.log('💡 개발자 도구에서 "performanceOptimizer" 객체 사용 가능');
// }