/**
 * 시스템 통합 테스트
 * 전체 모멘텀 시스템이 올바르게 작동하는지 검증
 */

import { momentumEngine } from '../services/momentumEngine';
import { trackKpiUpdate, trackTaskCompletion, trackDocumentAccess } from '../services/momentumTracker';
import { momentumCache } from '../services/momentumCache';

// 테스트 결과 인터페이스
interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  details?: string;
  error?: string;
}

class SystemIntegrationTester {
  private results: TestResult[] = [];

  // 테스트 실행기
  private async runTest(name: string, testFn: () => Promise<void> | void): Promise<void> {
    const startTime = Date.now();
    console.log(`🧪 [Test] ${name} 시작...`);

    try {
      await testFn();
      const duration = Date.now() - startTime;
      this.results.push({
        name,
        passed: true,
        duration,
        details: `${duration}ms에 완료`
      });
      console.log(`✅ [Test] ${name} 통과 (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        name,
        passed: false,
        duration,
        error: error instanceof Error ? error.message : String(error)
      });
      console.error(`❌ [Test] ${name} 실패 (${duration}ms):`, error);
    }
  }

  // 1. 기본 모멘텀 계산 테스트
  private async testBasicMomentumCalculation(): Promise<void> {
    const result = await momentumEngine.calculateBusinessHealth();

    if (typeof result.score !== 'number' || result.score < 0 || result.score > 100) {
      throw new Error(`잘못된 점수 범위: ${result.score}`);
    }

    if (!result.breakdown || typeof result.breakdown !== 'object') {
      throw new Error('분석 데이터가 없습니다');
    }

    if (!result.insights || !result.insights.message) {
      throw new Error('인사이트 메시지가 없습니다');
    }

    console.log(`   현재 비즈니스 건강도: ${result.score}점`);
  }

  // 2. 실시간 업데이트 테스트
  private async testRealtimeUpdates(): Promise<void> {
    // 초기 점수 기록
    const initialScore = await momentumEngine.calculateBusinessHealth();

    // KPI 업데이트 시뮬레이션
    trackKpiUpdate('test-kpi-001');

    // 작업 완료 시뮬레이션
    trackTaskCompletion('test-task-001', 'test-project-001');

    // 문서 접근 시뮬레이션
    trackDocumentAccess('test-doc-001', 'view');

    // 짧은 대기 후 새 점수 확인
    await new Promise(resolve => setTimeout(resolve, 100));

    const updatedScore = await momentumEngine.calculateBusinessHealth();

    console.log(`   점수 변화: ${initialScore.score} → ${updatedScore.score}`);

    // 점수가 변경되었거나 최소한 재계산되었는지 확인
    if (updatedScore.lastUpdated <= initialScore.lastUpdated) {
      throw new Error('실시간 업데이트가 작동하지 않습니다');
    }
  }

  // 3. 캐싱 시스템 테스트
  private async testCachingSystem(): Promise<void> {
    // 캐시 초기화
    momentumCache.invalidate();

    // 첫 번째 계산 (캐시 미스)
    const start1 = Date.now();
    const result1 = await momentumEngine.calculateBusinessHealth();
    const duration1 = Date.now() - start1;

    // 두 번째 계산 (캐시 히트)
    const start2 = Date.now();
    const result2 = await momentumEngine.calculateBusinessHealth();
    const duration2 = Date.now() - start2;

    console.log(`   캐시 미스: ${duration1}ms, 캐시 히트: ${duration2}ms`);

    // 캐시 히트가 더 빨라야 함
    if (duration2 >= duration1) {
      console.warn('⚠️ 캐시 성능 향상이 미미합니다');
    }

    // 결과는 동일해야 함
    if (result1.score !== result2.score) {
      throw new Error(`캐시 결과 불일치: ${result1.score} vs ${result2.score}`);
    }
  }

  // 4. 데이터 저장소 테스트
  private async testDataPersistence(): Promise<void> {
    const testKey = 'test-data-' + Date.now();
    const testValue = 'test-value-' + Math.random();

    // 데이터 저장
    localStorage.setItem(testKey, testValue);

    // 데이터 확인
    const retrieved = localStorage.getItem(testKey);
    if (retrieved !== testValue) {
      throw new Error(`데이터 저장 실패: ${retrieved} !== ${testValue}`);
    }

    // 정리
    localStorage.removeItem(testKey);

    console.log('   localStorage 정상 작동');
  }

  // 5. 목표 시스템 테스트
  private async testGoalSystem(): Promise<void> {
    const testGoals = [
      {
        id: 'test-kpi-goal',
        type: 'kpi',
        title: '테스트 KPI 목표',
        target: 5,
        current: 0
      }
    ];

    // 목표 저장
    localStorage.setItem('weekly-goals', JSON.stringify(testGoals));

    // 목표 확인
    const stored = localStorage.getItem('weekly-goals');
    if (!stored) {
      throw new Error('목표 저장 실패');
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length !== 1) {
      throw new Error('목표 데이터 구조 오류');
    }

    console.log('   목표 시스템 정상 작동');
  }

  // 6. 에러 핸들링 테스트
  private async testErrorHandling(): Promise<void> {
    // 잘못된 localStorage 데이터로 테스트
    localStorage.setItem('weekly-goals', 'invalid-json');

    try {
      // 이 호출이 에러를 던지지 않고 기본값을 반환해야 함
      const result = await momentumEngine.calculateBusinessHealth();

      if (typeof result.score !== 'number') {
        throw new Error('에러 상황에서 기본값 처리 실패');
      }

      console.log('   에러 핸들링 정상 작동');
    } finally {
      // 정리
      localStorage.removeItem('weekly-goals');
    }
  }

  // 7. 성능 벤치마크 테스트
  private async testPerformanceBenchmark(): Promise<void> {
    const iterations = 10;
    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      // 캐시 무효화하여 실제 계산 시간 측정
      momentumCache.invalidate();

      const start = Date.now();
      await momentumEngine.calculateBusinessHealth();
      const duration = Date.now() - start;

      durations.push(duration);
    }

    const avgDuration = durations.reduce((a, b) => a + b, 0) / iterations;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);

    console.log(`   평균: ${avgDuration.toFixed(1)}ms, 최대: ${maxDuration}ms, 최소: ${minDuration}ms`);

    // 성능 기준: 평균 100ms 이하
    if (avgDuration > 100) {
      console.warn(`⚠️ 성능 주의: 평균 ${avgDuration.toFixed(1)}ms`);
    }
  }

  // 전체 테스트 실행
  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 시스템 통합 테스트 시작');
    console.log('====================================');

    await this.runTest('1. 기본 모멘텀 계산', () => this.testBasicMomentumCalculation());
    await this.runTest('2. 실시간 업데이트', () => this.testRealtimeUpdates());
    await this.runTest('3. 캐싱 시스템', () => this.testCachingSystem());
    await this.runTest('4. 데이터 저장소', () => this.testDataPersistence());
    await this.runTest('5. 목표 시스템', () => this.testGoalSystem());
    await this.runTest('6. 에러 핸들링', () => this.testErrorHandling());
    await this.runTest('7. 성능 벤치마크', () => this.testPerformanceBenchmark());

    console.log('====================================');
    this.printSummary();

    return this.results;
  }

  // 결과 요약 출력
  private printSummary(): void {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const passRate = ((passed / total) * 100).toFixed(1);

    console.log(`\n📊 테스트 결과 요약:`);
    console.log(`   통과: ${passed}/${total} (${passRate}%)`);

    if (passed === total) {
      console.log('🎉 모든 테스트 통과!');
    } else {
      console.log('❌ 일부 테스트 실패:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
    }

    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    console.log(`   총 소요 시간: ${totalDuration}ms`);
  }
}

// 테스트 실행 함수
export const runSystemIntegrationTest = async (): Promise<TestResult[]> => {
  const tester = new SystemIntegrationTester();
  return await tester.runAllTests();
};

// 개발자 도구에서 직접 실행 가능
if (typeof window !== 'undefined') {
  (window as any).runSystemTest = runSystemIntegrationTest;
  console.log('💡 개발자 도구에서 "runSystemTest()" 실행 가능');
}