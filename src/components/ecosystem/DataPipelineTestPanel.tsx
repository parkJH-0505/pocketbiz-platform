/**
 * Data Pipeline Test Panel
 * 데이터 수집 파이프라인 테스트 및 모니터링 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import { DataPipelineManager } from '../../services/ecosystem/pipeline/DataPipelineManager';
import type { PipelineStatus, PipelineConfig } from '../../services/ecosystem/pipeline/DataPipelineManager';

interface TestResult {
  id: string;
  test: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  message: string;
  timestamp: Date;
  duration?: number;
}

export const DataPipelineTestPanel: React.FC = () => {
  const [pipelineManager] = useState(() => DataPipelineManager.getInstance());
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // 상태 업데이트
  useEffect(() => {
    const updateStatus = () => {
      const status = pipelineManager.getStatus();
      setPipelineStatus(status);
      setIsRunning(status.isRunning);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 2000);
    return () => clearInterval(interval);
  }, [pipelineManager]);

  const addTestResult = (result: Omit<TestResult, 'timestamp'>) => {
    setTestResults(prev => [...prev, { ...result, timestamp: new Date() }]);
  };

  const updateTestResult = (id: string, updates: Partial<TestResult>) => {
    setTestResults(prev =>
      prev.map(result =>
        result.id === id ? { ...result, ...updates } : result
      )
    );
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // 파이프라인 초기화 테스트
  const testInitialization = async () => {
    const testId = 'init-test';
    addTestResult({
      id: testId,
      test: '파이프라인 초기화',
      status: 'running',
      message: '데이터 파이프라인을 초기화하는 중...'
    });

    try {
      const startTime = Date.now();

      await pipelineManager.initialize({
        v2: {
          enabled: true,
          mode: 'hybrid',
          interval: 10000,
          retryAttempts: 2
        },
        calendar: {
          enabled: true,
          mode: 'realtime',
          interval: 5000,
          retryAttempts: 2
        },
        buildup: {
          enabled: true,
          mode: 'batch',
          interval: 15000,
          retryAttempts: 2
        }
      });

      const duration = Date.now() - startTime;
      setIsInitialized(true);

      updateTestResult(testId, {
        status: 'success',
        message: `파이프라인이 성공적으로 초기화되었습니다 (${duration}ms)`,
        duration
      });

    } catch (error) {
      updateTestResult(testId, {
        status: 'failed',
        message: `초기화 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  // 파이프라인 시작 테스트
  const testStart = async () => {
    if (!isInitialized) {
      addTestResult({
        id: 'start-failed',
        test: '파이프라인 시작',
        status: 'failed',
        message: '파이프라인을 먼저 초기화해주세요.'
      });
      return;
    }

    const testId = 'start-test';
    addTestResult({
      id: testId,
      test: '파이프라인 시작',
      status: 'running',
      message: '데이터 수집을 시작하는 중...'
    });

    try {
      const startTime = Date.now();
      await pipelineManager.start();
      const duration = Date.now() - startTime;

      setIsRunning(true);

      updateTestResult(testId, {
        status: 'success',
        message: `파이프라인이 시작되었습니다 (${duration}ms)`,
        duration
      });

    } catch (error) {
      updateTestResult(testId, {
        status: 'failed',
        message: `시작 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  // 파이프라인 중지 테스트
  const testStop = async () => {
    if (!isRunning) {
      addTestResult({
        id: 'stop-failed',
        test: '파이프라인 중지',
        status: 'failed',
        message: '파이프라인이 실행 중이 아닙니다.'
      });
      return;
    }

    const testId = 'stop-test';
    addTestResult({
      id: testId,
      test: '파이프라인 중지',
      status: 'running',
      message: '데이터 수집을 중지하는 중...'
    });

    try {
      const startTime = Date.now();
      await pipelineManager.stop();
      const duration = Date.now() - startTime;

      setIsRunning(false);

      updateTestResult(testId, {
        status: 'success',
        message: `파이프라인이 중지되었습니다 (${duration}ms)`,
        duration
      });

    } catch (error) {
      updateTestResult(testId, {
        status: 'failed',
        message: `중지 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  // 즉시 수집 테스트
  const testImmediateCollection = async (sourceId: string) => {
    if (!isRunning) {
      addTestResult({
        id: `immediate-${sourceId}-failed`,
        test: `즉시 수집 (${sourceId})`,
        status: 'failed',
        message: '파이프라인이 실행 중이 아닙니다.'
      });
      return;
    }

    const testId = `immediate-${sourceId}`;
    addTestResult({
      id: testId,
      test: `즉시 수집 (${sourceId})`,
      status: 'running',
      message: `${sourceId}에서 즉시 데이터를 수집하는 중...`
    });

    try {
      const startTime = Date.now();
      const result = await pipelineManager.collectImmediately(sourceId);
      const duration = Date.now() - startTime;

      updateTestResult(testId, {
        status: result.status === 'completed' ? 'success' : 'failed',
        message: `수집 완료: ${result.recordsSucceeded}/${result.recordsProcessed} 레코드 (${duration}ms)`,
        duration
      });

    } catch (error) {
      updateTestResult(testId, {
        status: 'failed',
        message: `즉시 수집 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  // 실시간 업데이트 시뮬레이션
  const testRealtimeSimulation = () => {
    addTestResult({
      id: 'realtime-sim',
      test: '실시간 업데이트 시뮬레이션',
      status: 'running',
      message: '실시간 데이터 변경을 시뮬레이션하는 중...'
    });

    try {
      pipelineManager.simulateRealtimeUpdates();

      updateTestResult('realtime-sim', {
        status: 'success',
        message: '실시간 업데이트가 시뮬레이션되었습니다. 수집기가 변경사항을 감지할 것입니다.'
      });

    } catch (error) {
      updateTestResult('realtime-sim', {
        status: 'failed',
        message: `시뮬레이션 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  // 종합 테스트
  const runComprehensiveTest = async () => {
    clearResults();

    // 초기화 -> 시작 -> 즉시 수집 -> 시뮬레이션 -> 중지 순서로 실행
    await testInitialization();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testStart();
    await new Promise(resolve => setTimeout(resolve, 2000));

    await testImmediateCollection('v2-system');
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testImmediateCollection('calendar-system');
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testImmediateCollection('buildup-system');
    await new Promise(resolve => setTimeout(resolve, 1000));

    testRealtimeSimulation();
    await new Promise(resolve => setTimeout(resolve, 3000));

    await testStop();
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'running': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'failed': return '❌';
      case 'running': return '🔄';
      default: return '⏳';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">🔧 데이터 수집 파이프라인 테스트</h2>

      {/* 파이프라인 상태 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded border">
          <h3 className="font-semibold text-sm mb-2">🏗️ 파이프라인 상태</h3>
          <div className="text-xs space-y-1">
            <div>초기화: {isInitialized ? '✅' : '❌'}</div>
            <div>실행 중: {isRunning ? '✅' : '❌'}</div>
            <div>총 수집: {pipelineStatus?.statistics.totalCollections || 0}회</div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded border">
          <h3 className="font-semibold text-sm mb-2">📊 수집 통계</h3>
          <div className="text-xs space-y-1">
            <div>성공: {pipelineStatus?.statistics.successfulCollections || 0}회</div>
            <div>실패: {pipelineStatus?.statistics.failedCollections || 0}회</div>
            <div>처리된 레코드: {pipelineStatus?.statistics.dataRecordsProcessed || 0}개</div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded border">
          <h3 className="font-semibold text-sm mb-2">⚡ 성능</h3>
          <div className="text-xs space-y-1">
            <div>평균 응답시간: {pipelineStatus?.statistics.averageResponseTime.toFixed(0) || 0}ms</div>
            <div>처리량: {pipelineStatus?.performance.throughput.toFixed(1) || 0} rec/min</div>
            <div>메모리: {pipelineStatus?.performance.memoryUsage.toFixed(1) || 0} MB</div>
          </div>
        </div>
      </div>

      {/* 데이터 소스 상태 */}
      {pipelineStatus && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3">📡 데이터 소스 상태</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {pipelineStatus.dataSources.map(source => (
              <div key={source.id} className="p-3 border rounded">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${
                    source.status === 'healthy' ? 'bg-green-500' :
                    source.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></span>
                  <span className="text-sm font-medium">{source.type.toUpperCase()}</span>
                </div>
                <div className="text-xs text-gray-600">
                  <div>마지막 수집: {source.lastCollection?.toLocaleTimeString() || 'N/A'}</div>
                  <div>다음 수집: {source.nextCollection?.toLocaleTimeString() || 'N/A'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 테스트 버튼들 */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={runComprehensiveTest}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          🧪 종합 테스트 실행
        </button>

        <button
          onClick={testInitialization}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
        >
          🏗️ 초기화
        </button>

        <button
          onClick={testStart}
          disabled={!isInitialized || isRunning}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 text-sm"
        >
          🚀 시작
        </button>

        <button
          onClick={testStop}
          disabled={!isRunning}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm"
        >
          🛑 중지
        </button>

        <button
          onClick={() => testImmediateCollection('v2-system')}
          disabled={!isRunning}
          className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 text-sm"
        >
          V2 수집
        </button>

        <button
          onClick={() => testImmediateCollection('calendar-system')}
          disabled={!isRunning}
          className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 text-sm"
        >
          Calendar 수집
        </button>

        <button
          onClick={() => testImmediateCollection('buildup-system')}
          disabled={!isRunning}
          className="px-3 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50 text-sm"
        >
          Buildup 수집
        </button>

        <button
          onClick={testRealtimeSimulation}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
        >
          📡 실시간 시뮬레이션
        </button>

        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
        >
          🗑️ 결과 지우기
        </button>
      </div>

      {/* 테스트 결과 */}
      <div className="border rounded">
        <div className="bg-gray-50 px-4 py-2 border-b font-semibold text-sm">
          테스트 결과 ({testResults.length}개)
        </div>
        <div className="max-h-96 overflow-y-auto">
          {testResults.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              테스트를 실행하면 결과가 여기에 표시됩니다.
            </div>
          ) : (
            <div className="divide-y">
              {testResults.map((result) => (
                <div key={result.id} className={`p-3 border-l-4 ${getStatusColor(result.status)}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span>{getStatusIcon(result.status)}</span>
                      <span className="font-medium text-sm">{result.test}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {result.timestamp.toLocaleTimeString()}
                      {result.duration && ` (${result.duration}ms)`}
                    </div>
                  </div>
                  <div className="text-xs text-gray-700">{result.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Week 2 Day 1 완료 요약 */}
      <div className="mt-6 p-4 bg-green-50 rounded border border-green-200">
        <h3 className="font-semibold text-green-800 mb-2">📋 Week 2 Day 1 완료 체크리스트</h3>
        <div className="text-sm text-green-700 space-y-1">
          <div>✅ 데이터 수집 파이프라인 타입 정의</div>
          <div>✅ 기본 데이터 수집기 클래스 구현</div>
          <div>✅ V2, Calendar, Buildup 전용 수집기 개발</div>
          <div>✅ 수집 스케줄러 구현 (배치/실시간/하이브리드 모드)</div>
          <div>✅ 파이프라인 매니저 개발 (중앙 관리)</div>
          <div>✅ 헬스 체크 및 오류 복구 시스템</div>
          <div>✅ 종합 테스트 패널 구현</div>
        </div>
      </div>
    </div>
  );
};