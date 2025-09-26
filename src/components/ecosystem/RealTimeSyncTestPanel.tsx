/**
 * Real-time Sync Test Panel
 * 실시간 데이터 동기화 시스템 테스트 및 검증 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import { RealTimeSyncEngine } from '../../services/ecosystem/pipeline/sync/RealTimeSyncEngine';
import { ChangeDetector } from '../../services/ecosystem/pipeline/sync/ChangeDetector';
import { ConflictResolver } from '../../services/ecosystem/pipeline/sync/ConflictResolver';
import { SyncStateManager } from '../../services/ecosystem/pipeline/sync/SyncStateManager';
import type { SyncOperation, SyncState, SyncConflict } from '../../services/ecosystem/pipeline/sync/types';
import type { DataSourceType } from '../../services/ecosystem/pipeline/types';

interface SyncTestScenario {
  id: string;
  name: string;
  description: string;
  sourceSystem: DataSourceType;
  targetSystem: DataSourceType;
  entityType: string;
  operationType: 'create' | 'update' | 'delete';
  simulateConflict: boolean;
  expectedResult: 'success' | 'conflict' | 'failure';
}

interface TestExecution {
  scenarioId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed';
  operationIds: string[];
  conflicts: SyncConflict[];
  duration?: number;
  result?: any;
}

export const RealTimeSyncTestPanel: React.FC = () => {
  const [syncEngine] = useState(() => RealTimeSyncEngine.getInstance());
  const [changeDetector] = useState(() => ChangeDetector.getInstance());
  const [conflictResolver] = useState(() => ConflictResolver.getInstance());
  const [stateManager] = useState(() => SyncStateManager.getInstance());

  const [isEngineRunning, setIsEngineRunning] = useState(false);
  const [syncState, setSyncState] = useState<SyncState | null>(null);
  const [activeOperations, setActiveOperations] = useState<SyncOperation[]>([]);
  const [testExecutions, setTestExecutions] = useState<TestExecution[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('');

  // 테스트 시나리오 정의
  const testScenarios: SyncTestScenario[] = [
    {
      id: 'v2-to-calendar-create',
      name: 'V2 → Calendar 새 이벤트 생성',
      description: 'V2 시스템의 새 이벤트를 캘린더 시스템에 동기화',
      sourceSystem: 'v2',
      targetSystem: 'calendar',
      entityType: 'event',
      operationType: 'create',
      simulateConflict: false,
      expectedResult: 'success'
    },
    {
      id: 'calendar-to-buildup-update',
      name: 'Calendar → Buildup 작업 업데이트',
      description: '캘린더의 작업 업데이트를 Buildup에 반영',
      sourceSystem: 'calendar',
      targetSystem: 'buildup',
      entityType: 'task',
      operationType: 'update',
      simulateConflict: false,
      expectedResult: 'success'
    },
    {
      id: 'buildup-to-v2-conflict',
      name: 'Buildup → V2 충돌 상황',
      description: 'Buildup 프로젝트 업데이트 시 충돌 발생 시나리오',
      sourceSystem: 'buildup',
      targetSystem: 'v2',
      entityType: 'project',
      operationType: 'update',
      simulateConflict: true,
      expectedResult: 'conflict'
    },
    {
      id: 'v2-to-all-broadcast',
      name: 'V2 → All Systems 브로드캐스트',
      description: 'V2의 KPI 업데이트를 모든 시스템에 브로드캐스트',
      sourceSystem: 'v2',
      targetSystem: 'v2', // 실제로는 모든 시스템
      entityType: 'kpi',
      operationType: 'update',
      simulateConflict: false,
      expectedResult: 'success'
    },
    {
      id: 'bidirectional-sync',
      name: '양방향 동기화 테스트',
      description: '두 시스템 간 양방향 동시 업데이트 시나리오',
      sourceSystem: 'calendar',
      targetSystem: 'buildup',
      entityType: 'project',
      operationType: 'update',
      simulateConflict: true,
      expectedResult: 'conflict'
    }
  ];

  // 상태 업데이트
  useEffect(() => {
    const updateStatus = async () => {
      try {
        const engineStatus = syncEngine.getStatus();
        const stateStatus = stateManager.getStatus();

        setIsEngineRunning(engineStatus.isRunning);
        setSyncState(stateStatus);

        // 활성 작업 업데이트 (시뮬레이션)
        // 실제로는 syncEngine.getActiveOperations() 같은 메서드 필요
      } catch (error) {
        console.error('Status update error:', error);
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 2000);
    return () => clearInterval(interval);
  }, [syncEngine, stateManager]);

  // 동기화 엔진 시작/중지
  const toggleSyncEngine = async () => {
    try {
      if (isEngineRunning) {
        await syncEngine.stop();
      } else {
        await syncEngine.start();
      }
    } catch (error) {
      console.error('Engine toggle error:', error);
    }
  };

  // 테스트 시나리오 실행
  const runTestScenario = async (scenario: SyncTestScenario) => {
    if (!isEngineRunning) {
      alert('동기화 엔진을 먼저 시작해주세요.');
      return;
    }

    const execution: TestExecution = {
      scenarioId: scenario.id,
      startedAt: new Date(),
      status: 'running',
      operationIds: [],
      conflicts: []
    };

    setTestExecutions(prev => [...prev, execution]);

    try {
      console.log(`[SyncTest] Running scenario: ${scenario.name}`);

      // 시나리오별 실행
      let operationIds: string[] = [];

      switch (scenario.id) {
        case 'v2-to-calendar-create':
          operationIds = await testV2ToCalendarCreate();
          break;
        case 'calendar-to-buildup-update':
          operationIds = await testCalendarToBuildupUpdate();
          break;
        case 'buildup-to-v2-conflict':
          operationIds = await testBuildupToV2Conflict();
          break;
        case 'v2-to-all-broadcast':
          operationIds = await testV2ToAllBroadcast();
          break;
        case 'bidirectional-sync':
          operationIds = await testBidirectionalSync();
          break;
        default:
          operationIds = await testGenericScenario(scenario);
      }

      execution.operationIds = operationIds;
      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();

      setTestExecutions(prev =>
        prev.map(ex => ex.scenarioId === scenario.id ? execution : ex)
      );

      console.log(`[SyncTest] Scenario completed: ${scenario.name} (${operationIds.length} operations)`);

    } catch (error) {
      console.error(`[SyncTest] Scenario failed: ${scenario.name}`, error);

      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();

      setTestExecutions(prev =>
        prev.map(ex => ex.scenarioId === scenario.id ? execution : ex)
      );
    }
  };

  // V2 → Calendar 새 이벤트 생성 테스트
  const testV2ToCalendarCreate = async (): Promise<string[]> => {
    const operationIds = await syncEngine.triggerSync('v2', 'calendar');
    await new Promise(resolve => setTimeout(resolve, 1000)); // 처리 대기
    return operationIds;
  };

  // Calendar → Buildup 작업 업데이트 테스트
  const testCalendarToBuildupUpdate = async (): Promise<string[]> => {
    const operationIds = await syncEngine.triggerSync('calendar', 'buildup');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return operationIds;
  };

  // Buildup → V2 충돌 상황 테스트
  const testBuildupToV2Conflict = async (): Promise<string[]> => {
    // 충돌 시나리오 시뮬레이션
    const operationIds = await syncEngine.triggerSync('buildup', 'v2');

    // 충돌 해결 대기
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 충돌 상태 확인
    const conflicts = conflictResolver.getStatistics();
    console.log('Conflict statistics:', conflicts);

    return operationIds;
  };

  // V2 → All Systems 브로드캐스트 테스트
  const testV2ToAllBroadcast = async (): Promise<string[]> => {
    const allOperationIds: string[] = [];

    // 각 타겟 시스템에 대해 동기화 실행
    const targetSystems: DataSourceType[] = ['calendar', 'buildup'];

    for (const target of targetSystems) {
      const operationIds = await syncEngine.triggerSync('v2', target);
      allOperationIds.push(...operationIds);
    }

    return allOperationIds;
  };

  // 양방향 동기화 테스트
  const testBidirectionalSync = async (): Promise<string[]> => {
    const allOperationIds: string[] = [];

    // 동시에 양방향 동기화 트리거
    const [calendarOps, buildupOps] = await Promise.all([
      syncEngine.triggerSync('calendar', 'buildup'),
      syncEngine.triggerSync('buildup', 'calendar')
    ]);

    allOperationIds.push(...calendarOps, ...buildupOps);

    // 충돌 해결 대기
    await new Promise(resolve => setTimeout(resolve, 3000));

    return allOperationIds;
  };

  // 일반 시나리오 테스트
  const testGenericScenario = async (scenario: SyncTestScenario): Promise<string[]> => {
    return await syncEngine.triggerSync(scenario.sourceSystem, scenario.targetSystem);
  };

  // 수동 충돌 해결
  const resolveConflictManually = async (conflictId: string, strategy: string) => {
    // 실제 구현에서는 ConflictResolution 객체 생성 필요
    console.log(`Manual conflict resolution: ${conflictId} with strategy: ${strategy}`);
    // await conflictResolver.manualResolve(conflictId, resolution, 'test-user');
  };

  // 전체 테스트 스위트 실행
  const runAllTests = async () => {
    console.log('[SyncTest] Running all test scenarios...');

    for (const scenario of testScenarios) {
      await runTestScenario(scenario);
      // 테스트 간 간격
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('[SyncTest] All test scenarios completed');
  };

  // 결과 초기화
  const clearResults = () => {
    setTestExecutions([]);
    setActiveOperations([]);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">실시간 동기화 테스트</h2>
          <p className="text-sm text-gray-600 mt-1">
            실시간 데이터 동기화 엔진의 테스트 및 검증 도구
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isEngineRunning ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-sm text-gray-600">
            {isEngineRunning ? '실행 중' : '중지됨'}
          </span>
        </div>
      </div>

      {/* 엔진 제어 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">동기화 엔진 제어</h3>
          <button
            onClick={toggleSyncEngine}
            className={`px-4 py-2 rounded font-medium ${
              isEngineRunning
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isEngineRunning ? '엔진 중지' : '엔진 시작'}
          </button>
        </div>

        {syncState && (
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">건강도:</span>
              <span className={`ml-2 font-medium ${
                syncState.healthStatus === 'healthy' ? 'text-green-600' :
                syncState.healthStatus === 'degraded' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {syncState.healthScore}점
              </span>
            </div>
            <div>
              <span className="text-gray-600">활성 시스템:</span>
              <span className="ml-2 font-medium">{syncState.systemStates.size}개</span>
            </div>
            <div>
              <span className="text-gray-600">성공률:</span>
              <span className="ml-2 font-medium">
                {(syncState.globalMetrics.successRate * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-600">평균 지연:</span>
              <span className="ml-2 font-medium">{syncState.globalMetrics.averageLatency}ms</span>
            </div>
          </div>
        )}

        {syncState && syncState.healthIssues.length > 0 && (
          <div className="mt-3 p-2 bg-yellow-100 rounded">
            <h4 className="text-sm font-medium text-yellow-800 mb-1">건강도 이슈:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {syncState.healthIssues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 테스트 시나리오 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">테스트 시나리오</h3>
          <div className="flex gap-2">
            <button
              onClick={runAllTests}
              disabled={!isEngineRunning}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              전체 테스트 실행
            </button>
            <button
              onClick={clearResults}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              결과 초기화
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {testScenarios.map((scenario) => {
            const execution = testExecutions.find(ex => ex.scenarioId === scenario.id);
            const isRunning = execution?.status === 'running';

            return (
              <div key={scenario.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{scenario.name}</h4>
                    <p className="text-sm text-gray-600">{scenario.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {execution && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        execution.status === 'completed' ? 'bg-green-100 text-green-800' :
                        execution.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {execution.status === 'running' ? '실행 중' :
                         execution.status === 'completed' ? '완료' : '실패'}
                      </span>
                    )}
                    <button
                      onClick={() => runTestScenario(scenario)}
                      disabled={!isEngineRunning || isRunning}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      {isRunning ? '실행 중...' : '실행'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs text-gray-500 mb-2">
                  <div>소스: {scenario.sourceSystem}</div>
                  <div>타겟: {scenario.targetSystem}</div>
                  <div>엔터티: {scenario.entityType}</div>
                  <div>작업: {scenario.operationType}</div>
                </div>

                {execution && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-gray-600">작업 수:</span>
                        <span className="ml-1 font-medium">{execution.operationIds.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">충돌:</span>
                        <span className="ml-1 font-medium">{execution.conflicts.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">소요시간:</span>
                        <span className="ml-1 font-medium">{execution.duration || 0}ms</span>
                      </div>
                    </div>

                    {execution.conflicts.length > 0 && (
                      <div className="mt-2 p-2 bg-yellow-100 rounded">
                        <h5 className="text-sm font-medium text-yellow-800 mb-1">충돌 발생:</h5>
                        <div className="space-y-1">
                          {execution.conflicts.slice(0, 3).map((conflict, index) => (
                            <div key={index} className="text-xs text-yellow-700">
                              • {conflict.conflictType} 충돌 ({conflict.entityType})
                              {conflict.resolutionStatus === 'pending' && (
                                <button
                                  onClick={() => resolveConflictManually(conflict.id, 'latest_wins')}
                                  className="ml-2 px-1 py-0.5 bg-yellow-200 text-yellow-800 rounded text-xs hover:bg-yellow-300"
                                >
                                  수동 해결
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 시스템별 상태 */}
      {syncState && syncState.systemStates.size > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">시스템별 상태</h3>
          <div className="grid gap-4">
            {Array.from(syncState.systemStates.entries()).map(([systemId, systemState]) => (
              <div key={systemId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 capitalize">{systemId}</h4>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      systemState.isOnline ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm text-gray-600">
                      {systemState.isOnline ? '온라인' : '오프라인'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">대기:</span>
                    <span className="ml-1 font-medium">{systemState.pendingOperations}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">처리중:</span>
                    <span className="ml-1 font-medium">{systemState.inProgressOperations}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">완료:</span>
                    <span className="ml-1 font-medium text-green-600">{systemState.completedToday}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">실패:</span>
                    <span className="ml-1 font-medium text-red-600">{systemState.failedToday}</span>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">지연시간:</span>
                    <span className="ml-1 font-medium">{systemState.averageLatency}ms</span>
                  </div>
                  <div>
                    <span className="text-gray-600">처리율:</span>
                    <span className="ml-1 font-medium">{systemState.throughput.toFixed(1)} ops/sec</span>
                  </div>
                  <div>
                    <span className="text-gray-600">오류율:</span>
                    <span className={`ml-1 font-medium ${
                      systemState.errorRate > 0.1 ? 'text-red-600' :
                      systemState.errorRate > 0.05 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {(systemState.errorRate * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 실행 이력 */}
      {testExecutions.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">실행 이력</h3>
          <div className="space-y-2">
            {testExecutions.slice(-10).reverse().map((execution, index) => {
              const scenario = testScenarios.find(s => s.id === execution.scenarioId);
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${
                      execution.status === 'completed' ? 'bg-green-500' :
                      execution.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <span className="font-medium">{scenario?.name || execution.scenarioId}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>작업: {execution.operationIds.length}</span>
                    <span>충돌: {execution.conflicts.length}</span>
                    <span>{execution.duration}ms</span>
                    <span>{execution.startedAt.toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};