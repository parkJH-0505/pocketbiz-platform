/**
 * Comprehensive Ecosystem Test
 * 전체 생태계 통합 테스트 컴포넌트 (Phase 3 Week 1 완료 검증)
 */

import React, { useState, useEffect } from 'react';
import { useCalendarContext } from '../../contexts/CalendarContext';
import { useBuildupContext } from '../../contexts/BuildupContext';
import { ecosystemInitializer } from '../../services/ecosystem/EcosystemInitializer';
import type { EcosystemStatus } from '../../services/ecosystem/EcosystemInitializer';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  timestamp: Date;
  duration?: number;
}

export const ComprehensiveEcosystemTest: React.FC = () => {
  const {
    events: calendarEvents,
    reportExternalFactor,
    getEcosystemStats: getCalendarEcosystemStats
  } = useCalendarContext();

  const {
    projects: buildupProjects,
    reportMilestoneCompleted,
    reportProjectStatusChanged,
    getEcosystemStats: getBuildupEcosystemStats
  } = useBuildupContext();

  const [systemStatus, setSystemStatus] = useState<EcosystemStatus | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // 컴포넌트 마운트 시 시스템 상태 확인
  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkSystemStatus = () => {
    const status = ecosystemInitializer.getSystemStatus();
    setSystemStatus(status);
    setIsInitialized(ecosystemInitializer.isInitialized());
  };

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

  const clearTestResults = () => {
    setTestResults([]);
  };

  // 1. 시스템 초기화 테스트
  const testSystemInitialization = async () => {
    const testId = 'init-test';
    addTestResult({
      id: testId,
      name: '시스템 초기화',
      status: 'running',
      message: '생태계 시스템을 초기화하는 중...'
    });

    try {
      const startTime = Date.now();
      await ecosystemInitializer.initialize();
      const duration = Date.now() - startTime;

      updateTestResult(testId, {
        status: 'success',
        message: `시스템이 성공적으로 초기화되었습니다 (${duration}ms)`,
        duration
      });

      checkSystemStatus();

    } catch (error) {
      updateTestResult(testId, {
        status: 'error',
        message: `초기화 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  // 2. V2 → Calendar 연동 테스트
  const testV2ToCalendarIntegration = async () => {
    const testId = 'v2-calendar-test';
    addTestResult({
      id: testId,
      name: 'V2 → Calendar 연동',
      status: 'running',
      message: 'V2 시나리오에서 캘린더 이벤트 자동 생성 테스트 중...'
    });

    try {
      const startTime = Date.now();
      const initialEventCount = calendarEvents.length;

      // V2 시나리오 트리거
      await ecosystemInitializer.triggerTestScenario();

      // 3초 대기 후 결과 확인
      setTimeout(() => {
        const newEventCount = calendarEvents.length;
        const generatedEvents = newEventCount - initialEventCount;
        const duration = Date.now() - startTime;

        if (generatedEvents > 0) {
          updateTestResult(testId, {
            status: 'success',
            message: `${generatedEvents}개의 캘린더 이벤트가 자동 생성되었습니다 (${duration}ms)`,
            duration
          });
        } else {
          updateTestResult(testId, {
            status: 'error',
            message: '캘린더 이벤트가 생성되지 않았습니다. 연동 확인 필요.'
          });
        }
      }, 3000);

    } catch (error) {
      updateTestResult(testId, {
        status: 'error',
        message: `V2 → Calendar 연동 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  // 3. V2 → Buildup 연동 테스트
  const testV2ToBuildupIntegration = async () => {
    const testId = 'v2-buildup-test';
    addTestResult({
      id: testId,
      name: 'V2 → Buildup 연동',
      status: 'running',
      message: 'V2 추천사항에서 프로젝트 자동 생성 테스트 중...'
    });

    try {
      const startTime = Date.now();
      const initialProjectCount = buildupProjects.length;

      // V2 시나리오 트리거 (이미 위에서 호출됨)
      // 새로운 프로젝트 생성을 위한 별도 이벤트 발행 필요할 수 있음

      // 3초 대기 후 결과 확인
      setTimeout(() => {
        const newProjectCount = buildupProjects.length;
        const generatedProjects = newProjectCount - initialProjectCount;
        const duration = Date.now() - startTime;

        if (generatedProjects > 0) {
          updateTestResult(testId, {
            status: 'success',
            message: `${generatedProjects}개의 프로젝트가 자동 생성되었습니다 (${duration}ms)`,
            duration
          });
        } else {
          updateTestResult(testId, {
            status: 'error',
            message: '프로젝트가 생성되지 않았습니다. 연동 확인 필요.'
          });
        }
      }, 3000);

    } catch (error) {
      updateTestResult(testId, {
        status: 'error',
        message: `V2 → Buildup 연동 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  // 4. Calendar → V2 역방향 연동 테스트
  const testCalendarToV2Integration = async () => {
    const testId = 'calendar-v2-test';
    addTestResult({
      id: testId,
      name: 'Calendar → V2 연동',
      status: 'running',
      message: '캘린더에서 V2로 외부 요인 보고 테스트 중...'
    });

    try {
      const startTime = Date.now();

      await reportExternalFactor(
        '시장 경기 변화',
        -10, // 10점 감소
        85,  // 85% 확신
        ['growth', 'economy']
      );

      const duration = Date.now() - startTime;

      updateTestResult(testId, {
        status: 'success',
        message: `외부 요인이 V2에 성공적으로 전달되었습니다 (${duration}ms)`,
        duration
      });

    } catch (error) {
      updateTestResult(testId, {
        status: 'error',
        message: `Calendar → V2 연동 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  // 5. Buildup → V2 역방향 연동 테스트
  const testBuildupToV2Integration = async () => {
    const testId = 'buildup-v2-test';
    addTestResult({
      id: testId,
      name: 'Buildup → V2 연동',
      status: 'running',
      message: 'Buildup에서 V2로 마일스톤 완료 보고 테스트 중...'
    });

    try {
      const startTime = Date.now();

      // 첫 번째 프로젝트가 있으면 마일스톤 완료 보고
      if (buildupProjects.length > 0) {
        const project = buildupProjects[0];
        await reportMilestoneCompleted(
          project.id,
          'milestone-test-1',
          { GO: 5, PT: 3 }, // KPI 상승 효과
          'test-user'
        );

        const duration = Date.now() - startTime;

        updateTestResult(testId, {
          status: 'success',
          message: `마일스톤 완료가 V2에 성공적으로 전달되었습니다 (${duration}ms)`,
          duration
        });
      } else {
        updateTestResult(testId, {
          status: 'error',
          message: '테스트할 프로젝트가 없습니다'
        });
      }

    } catch (error) {
      updateTestResult(testId, {
        status: 'error',
        message: `Buildup → V2 연동 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  // 6. 전체 시스템 통합 테스트
  const runComprehensiveTest = async () => {
    setIsRunningTests(true);
    clearTestResults();

    // 순차적으로 모든 테스트 실행
    await testSystemInitialization();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testV2ToCalendarIntegration();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testV2ToBuildupIntegration();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testCalendarToV2Integration();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testBuildupToV2Integration();

    setIsRunningTests(false);
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'running': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'running': return '🔄';
      default: return '⏳';
    }
  };

  const getHealthColor = (health?: string) => {
    switch (health) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">🌐 종합 생태계 통합 테스트</h2>

      {/* 시스템 상태 대시보드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded border">
          <h3 className="font-semibold text-sm mb-2">🏗️ 시스템 상태</h3>
          <div className="text-xs space-y-1">
            <div>초기화: {isInitialized ? '✅' : '❌'}</div>
            <div className={getHealthColor(systemStatus?.ecosystem.health)}>
              Health: {systemStatus?.ecosystem.health || 'unknown'}
            </div>
            <div>Version: {systemStatus?.ecosystem.version || 'unknown'}</div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded border">
          <h3 className="font-semibold text-sm mb-2">📅 Calendar 연동</h3>
          <div className="text-xs space-y-1">
            <div>연결: {systemStatus?.connectors.calendar.connected ? '✅' : '❌'}</div>
            <div>구독: {systemStatus?.connectors.calendar.subscriptions || 0}개</div>
            <div>이벤트: {calendarEvents.length}개</div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded border">
          <h3 className="font-semibold text-sm mb-2">🚀 Buildup 연동</h3>
          <div className="text-xs space-y-1">
            <div>연결: {systemStatus?.connectors.buildup.connected ? '✅' : '❌'}</div>
            <div>구독: {systemStatus?.connectors.buildup.subscriptions || 0}개</div>
            <div>프로젝트: {buildupProjects.length}개</div>
          </div>
        </div>
      </div>

      {/* 테스트 버튼 */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={runComprehensiveTest}
          disabled={isRunningTests}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {isRunningTests ? '🔄 테스트 실행 중...' : '🧪 종합 테스트 실행'}
        </button>

        <button
          onClick={testSystemInitialization}
          disabled={isRunningTests}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
        >
          🏗️ 시스템 초기화
        </button>

        <button
          onClick={clearTestResults}
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
                      <span className="font-medium text-sm">{result.name}</span>
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

      {/* Phase 3 Week 1 완료 요약 */}
      <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">📋 Phase 3 Week 1 완료 체크리스트</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <div>✅ 중앙 이벤트 허브 구축 (EventBus)</div>
          <div>✅ 컨텍스트별 어댑터 개발 (V2, Calendar, Buildup)</div>
          <div>✅ 이벤트 변환기 구현 (EventTransformers)</div>
          <div>✅ CalendarContext 연동 및 브리지 구축</div>
          <div>✅ BuildupContext 연동 및 브리지 구축</div>
          <div>✅ 전체 시스템 초기화 및 관리자 구현</div>
          <div>✅ 종합 테스트 및 검증 도구 제공</div>
        </div>
      </div>
    </div>
  );
};