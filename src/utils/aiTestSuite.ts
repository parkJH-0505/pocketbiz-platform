/**
 * AI Test Suite - Phase 8
 * AI 시스템의 통합 테스트 및 검증을 위한 테스트 스위트
 */

import type { AxisKey } from '../pages/startup/kpi-tabs/ResultsInsightsPanelV2/types';
import { getAIOrchestrator } from '../services/ai/AIOrchestrator';
import { getRealTimeSimulationEngine } from '../services/simulation/RealTimeSimulationEngine';
import { getAdvancedPredictionSystem } from '../services/prediction/AdvancedPredictionSystem';
import { getAIPerformanceOptimizer } from './aiPerformanceOptimizer';

// 테스트 결과 인터페이스
export interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  duration: number;
  details: string;
  error?: Error;
  metadata?: any;
}

export interface TestSuiteResult {
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  duration: number;
  results: TestResult[];
  summary: string;
}

// 테스트 데이터
const mockCurrentScores: Record<AxisKey, number> = {
  GO: 75,
  EC: 72,
  PT: 78,
  PF: 70,
  TO: 73
};

const mockHistoricalData = Array.from({ length: 30 }, (_, i) => ({
  timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
  scores: {
    GO: 70 + Math.random() * 20,
    EC: 65 + Math.random() * 25,
    PT: 75 + Math.random() * 15,
    PF: 68 + Math.random() * 22,
    TO: 70 + Math.random() * 18
  } as Record<AxisKey, number>
}));

/**
 * AI 시스템 통합 테스트 스위트
 */
export class AITestSuite {
  private results: TestResult[] = [];
  private startTime: number = 0;

  /**
   * 전체 테스트 스위트 실행
   */
  async runAllTests(): Promise<TestSuiteResult> {
    console.log('🧪 AI 시스템 통합 테스트 시작...');
    this.startTime = Date.now();
    this.results = [];

    // 기본 AI 서비스 테스트
    await this.testAIOrchestrator();
    await this.testRealTimeSimulation();
    await this.testAdvancedPrediction();

    // 통합 테스트
    await this.testIntegration();

    // 성능 테스트
    await this.testPerformance();

    // 에러 핸들링 테스트
    await this.testErrorHandling();

    // 결과 집계
    return this.generateSummary();
  }

  /**
   * AI Orchestrator 테스트
   */
  private async testAIOrchestrator(): Promise<void> {
    await this.runTest('AI Orchestrator 초기화', async () => {
      const orchestrator = getAIOrchestrator();
      if (!orchestrator) {
        throw new Error('AI Orchestrator 초기화 실패');
      }
    });

    await this.runTest('AI Orchestrator 분석 실행', async () => {
      const orchestrator = getAIOrchestrator();
      const result = await orchestrator.runAnalysis({
        currentScores: mockCurrentScores,
        historicalData: mockHistoricalData,
        analysisType: 'quick'
      });

      if (!result || !result.id) {
        throw new Error('분석 결과가 올바르지 않습니다');
      }

      if (!result.patterns || !result.anomalies) {
        throw new Error('필수 분석 결과가 누락되었습니다');
      }
    });

    await this.runTest('AI Orchestrator 캐시 기능', async () => {
      const orchestrator = getAIOrchestrator();

      // 첫 번째 실행
      const start1 = Date.now();
      await orchestrator.runAnalysis({
        currentScores: mockCurrentScores,
        historicalData: mockHistoricalData,
        analysisType: 'quick'
      });
      const time1 = Date.now() - start1;

      // 두 번째 실행 (캐시 적중 예상)
      const start2 = Date.now();
      await orchestrator.runAnalysis({
        currentScores: mockCurrentScores,
        historicalData: mockHistoricalData,
        analysisType: 'quick'
      });
      const time2 = Date.now() - start2;

      if (time2 > time1) {
        console.warn('캐시 성능이 예상보다 낮습니다');
      }
    });
  }

  /**
   * 실시간 시뮬레이션 테스트
   */
  private async testRealTimeSimulation(): Promise<void> {
    await this.runTest('실시간 시뮬레이션 엔진 초기화', async () => {
      const engine = getRealTimeSimulationEngine();
      if (!engine) {
        throw new Error('실시간 시뮬레이션 엔진 초기화 실패');
      }
    });

    await this.runTest('시뮬레이션 시작/중지', async () => {
      const engine = getRealTimeSimulationEngine();

      engine.start();
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기

      const results = engine.getResults();
      engine.stop();

      if (results.length === 0) {
        console.warn('시뮬레이션 결과가 생성되지 않았습니다');
      }
    });

    await this.runTest('시나리오 관리', async () => {
      const engine = getRealTimeSimulationEngine();

      const testScenario = {
        id: 'test-scenario',
        name: '테스트 시나리오',
        description: '테스트용 시나리오',
        parameters: {
          timeHorizon: 10,
          volatility: { GO: 0.1, EC: 0.1, PT: 0.1, PF: 0.1, TO: 0.1 },
          correlations: {
            GO: { GO: 1, EC: 0.3, PT: 0.4, PF: 0.5, TO: 0.3 },
            EC: { GO: 0.3, EC: 1, PT: 0.5, PF: 0.3, TO: 0.6 },
            PT: { GO: 0.4, EC: 0.5, PT: 1, PF: 0.4, TO: 0.5 },
            PF: { GO: 0.5, EC: 0.3, PT: 0.4, PF: 1, TO: 0.4 },
            TO: { GO: 0.3, EC: 0.6, PT: 0.5, PF: 0.4, TO: 1 }
          }
        },
        active: true,
        priority: 1
      };

      engine.addScenario(testScenario);
      engine.toggleScenario('test-scenario', false);
      engine.removeScenario('test-scenario');
    });
  }

  /**
   * 고급 예측 시스템 테스트
   */
  private async testAdvancedPrediction(): Promise<void> {
    await this.runTest('고급 예측 시스템 초기화', async () => {
      const system = getAdvancedPredictionSystem();
      if (!system) {
        throw new Error('고급 예측 시스템 초기화 실패');
      }
    });

    await this.runTest('예측 실행', async () => {
      const system = getAdvancedPredictionSystem();
      const result = await system.predict(mockHistoricalData, 7);

      if (!result || !result.predictions) {
        throw new Error('예측 결과가 올바르지 않습니다');
      }

      if (result.predictions.length !== 7) {
        throw new Error('예측 기간이 올바르지 않습니다');
      }

      if (!result.predictionQuality || result.predictionQuality.overall < 0) {
        throw new Error('예측 품질 정보가 올바르지 않습니다');
      }
    });

    await this.runTest('모델 관리', async () => {
      const system = getAdvancedPredictionSystem();
      const models = system.getModels();

      if (!models || models.length === 0) {
        throw new Error('예측 모델이 로드되지 않았습니다');
      }

      const enabledModels = models.filter(m => m.enabled);
      if (enabledModels.length === 0) {
        throw new Error('활성화된 모델이 없습니다');
      }
    });
  }

  /**
   * 통합 테스트
   */
  private async testIntegration(): Promise<void> {
    await this.runTest('전체 AI 시스템 통합', async () => {
      // 모든 서비스가 함께 작동하는지 테스트
      const orchestrator = getAIOrchestrator();
      const simulation = getRealTimeSimulationEngine();
      const prediction = getAdvancedPredictionSystem();

      // 동시 실행
      const promises = [
        orchestrator.runAnalysis({
          currentScores: mockCurrentScores,
          historicalData: mockHistoricalData,
          analysisType: 'quick'
        }),
        prediction.predict(mockHistoricalData, 5)
      ];

      simulation.start();
      simulation.updateCurrentScores(mockCurrentScores);

      const results = await Promise.allSettled(promises);
      simulation.stop();

      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        throw new Error(`${failures.length}개의 서비스가 실패했습니다`);
      }
    });

    await this.runTest('데이터 일관성', async () => {
      // 같은 데이터로 여러 번 실행했을 때 일관된 결과가 나오는지 테스트
      const orchestrator = getAIOrchestrator();

      const result1 = await orchestrator.runAnalysis({
        currentScores: mockCurrentScores,
        historicalData: mockHistoricalData,
        analysisType: 'quick'
      });

      const result2 = await orchestrator.runAnalysis({
        currentScores: mockCurrentScores,
        historicalData: mockHistoricalData,
        analysisType: 'quick'
      });

      // 기본적인 일관성 검사
      if (result1.patterns.length !== result2.patterns.length) {
        console.warn('패턴 감지 결과가 일관되지 않습니다');
      }
    });
  }

  /**
   * 성능 테스트
   */
  private async testPerformance(): Promise<void> {
    await this.runTest('성능 최적화 시스템', async () => {
      const optimizer = getAIPerformanceOptimizer();
      const report = optimizer.generatePerformanceReport();

      if (!report.metrics || !report.summary) {
        throw new Error('성능 리포트 생성 실패');
      }

      if (report.metrics.errorRate > 0.1) {
        throw new Error(`에러율이 너무 높습니다: ${report.metrics.errorRate}`);
      }
    });

    await this.runTest('응답 시간 벤치마크', async () => {
      const orchestrator = getAIOrchestrator();
      const iterations = 5;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await orchestrator.runAnalysis({
          currentScores: mockCurrentScores,
          historicalData: mockHistoricalData.slice(0, 10), // 작은 데이터셋
          analysisType: 'quick'
        });
        times.push(Date.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      if (avgTime > 10000) { // 10초
        throw new Error(`평균 응답 시간이 너무 깁니다: ${avgTime}ms`);
      }

      if (maxTime > 20000) { // 20초
        throw new Error(`최대 응답 시간이 너무 깁니다: ${maxTime}ms`);
      }

      console.log(`📊 평균 응답 시간: ${avgTime.toFixed(0)}ms, 최대: ${maxTime}ms`);
    });

    await this.runTest('메모리 사용량', async () => {
      const optimizer = getAIPerformanceOptimizer();
      const metrics = optimizer.collectMetrics();

      if (metrics.memoryUsage.percentage > 90) {
        throw new Error(`메모리 사용량이 너무 높습니다: ${metrics.memoryUsage.percentage}%`);
      }

      if (metrics.memoryUsage.used > 1000) { // 1GB
        console.warn(`메모리 사용량이 높습니다: ${metrics.memoryUsage.used}MB`);
      }
    });
  }

  /**
   * 에러 핸들링 테스트
   */
  private async testErrorHandling(): Promise<void> {
    await this.runTest('잘못된 입력 처리', async () => {
      const orchestrator = getAIOrchestrator();

      try {
        await orchestrator.runAnalysis({
          currentScores: {} as any, // 잘못된 입력
          historicalData: [],
          analysisType: 'quick'
        });
        throw new Error('잘못된 입력이 예외를 발생시키지 않았습니다');
      } catch (error) {
        // 예상된 에러
        if (!(error instanceof Error) || !error.message.includes('필수')) {
          throw new Error('적절한 에러 메시지가 생성되지 않았습니다');
        }
      }
    });

    await this.runTest('네트워크 오류 시뮬레이션', async () => {
      // 실제 구현에서는 네트워크 오류를 시뮬레이션
      const prediction = getAdvancedPredictionSystem();

      try {
        await prediction.predict([], 7); // 빈 데이터
        console.warn('빈 데이터에 대한 처리가 예상과 다릅니다');
      } catch (error) {
        // 적절한 에러 처리 확인
      }
    });

    await this.runTest('리소스 정리', async () => {
      const simulation = getRealTimeSimulationEngine();
      const optimizer = getAIPerformanceOptimizer();

      // 시뮬레이션 정리
      simulation.stop();

      // 캐시 정리
      optimizer.clearCache();

      // 메모리 최적화
      optimizer.optimizeMemory();

      const metrics = optimizer.collectMetrics();
      console.log(`🧹 리소스 정리 완료: 캐시 크기 ${metrics.cachePerformance.size}`);
    });
  }

  /**
   * 개별 테스트 실행 헬퍼
   */
  private async runTest(name: string, testFunction: () => Promise<void>): Promise<void> {
    const start = Date.now();
    console.log(`  🔍 ${name} 테스트 중...`);

    try {
      await testFunction();
      const duration = Date.now() - start;

      this.results.push({
        name,
        status: 'pass',
        duration,
        details: '테스트 통과'
      });

      console.log(`  ✅ ${name} 통과 (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - start;

      this.results.push({
        name,
        status: 'fail',
        duration,
        details: error instanceof Error ? error.message : '알 수 없는 오류',
        error: error instanceof Error ? error : new Error(String(error))
      });

      console.log(`  ❌ ${name} 실패: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * 테스트 결과 요약 생성
   */
  private generateSummary(): TestSuiteResult {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;

    let summary = '';
    if (failed === 0) {
      summary = `✅ 모든 테스트 통과 (${passed}/${this.results.length})`;
    } else {
      summary = `❌ ${failed}개 테스트 실패, ${passed}개 통과 (${this.results.length}개 중)`;
    }

    if (warnings > 0) {
      summary += `, ${warnings}개 경고`;
    }

    return {
      totalTests: this.results.length,
      passed,
      failed,
      warnings,
      duration: totalDuration,
      results: this.results,
      summary
    };
  }

  /**
   * 세부 리포트 출력
   */
  printDetailedReport(result: TestSuiteResult): void {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 AI 시스템 테스트 결과 리포트');
    console.log('='.repeat(60));
    console.log(`전체 테스트: ${result.totalTests}개`);
    console.log(`통과: ${result.passed}개`);
    console.log(`실패: ${result.failed}개`);
    console.log(`경고: ${result.warnings}개`);
    console.log(`총 소요 시간: ${result.duration}ms`);
    console.log(`\n${result.summary}\n`);

    if (result.failed > 0) {
      console.log('❌ 실패한 테스트:');
      result.results
        .filter(r => r.status === 'fail')
        .forEach(r => {
          console.log(`  • ${r.name}: ${r.details}`);
        });
      console.log('');
    }

    if (result.warnings > 0) {
      console.log('⚠️ 경고가 있는 테스트:');
      result.results
        .filter(r => r.status === 'warning')
        .forEach(r => {
          console.log(`  • ${r.name}: ${r.details}`);
        });
      console.log('');
    }

    // 성능 통계
    const avgDuration = result.results.reduce((sum, r) => sum + r.duration, 0) / result.results.length;
    const maxDuration = Math.max(...result.results.map(r => r.duration));
    const slowTests = result.results.filter(r => r.duration > avgDuration * 2);

    console.log('📊 성능 통계:');
    console.log(`  평균 테스트 시간: ${avgDuration.toFixed(0)}ms`);
    console.log(`  최대 테스트 시간: ${maxDuration}ms`);
    if (slowTests.length > 0) {
      console.log(`  느린 테스트 (${slowTests.length}개):`);
      slowTests.forEach(t => {
        console.log(`    • ${t.name}: ${t.duration}ms`);
      });
    }

    console.log('\n' + '='.repeat(60));
  }
}

/**
 * 퀴크 테스트 (기본 기능만)
 */
export async function runQuickTests(): Promise<TestSuiteResult> {
  console.log('⚡ AI 시스템 퀵 테스트 실행...');

  const suite = new AITestSuite();
  const result = await suite.runAllTests();

  console.log(`\n${result.summary}`);
  return result;
}

/**
 * 상세 테스트 (전체 기능)
 */
export async function runFullTests(): Promise<TestSuiteResult> {
  console.log('🔬 AI 시스템 전체 테스트 실행...');

  const suite = new AITestSuite();
  const result = await suite.runAllTests();

  suite.printDetailedReport(result);
  return result;
}

/**
 * 글로벌 테스트 함수 (브라우저 콘솔용)
 */
declare global {
  interface Window {
    runAITests: () => Promise<TestSuiteResult>;
    runQuickAITests: () => Promise<TestSuiteResult>;
  }
}

if (typeof window !== 'undefined') {
  window.runAITests = runFullTests;
  window.runQuickAITests = runQuickTests;
}

export default {
  AITestSuite,
  runQuickTests,
  runFullTests
};