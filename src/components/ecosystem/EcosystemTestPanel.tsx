/**
 * Ecosystem Integration Test Panel
 * CalendarContext ↔ Ecosystem 연동 테스트 컴포넌트
 */

import React, { useState } from 'react';
import { useCalendarContext } from '../../contexts/CalendarContext';
import { calendarEcosystemConnector } from '../../services/ecosystem/connectors/CalendarEcosystemConnector';

interface TestScenario {
  scenarioId: string;
  name: string;
  projectedScores: Record<string, number>;
  keyActions: string[];
  timeline: string;
  priority: 'high' | 'medium' | 'low';
  estimatedEffort: number;
  expectedROI: number;
  tags: string[];
}

export const EcosystemTestPanel: React.FC = () => {
  const {
    events,
    reportExternalFactor,
    getEcosystemStats
  } = useCalendarContext();

  const [testResults, setTestResults] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(calendarEcosystemConnector.isConnected());

  // 테스트 시나리오 생성
  const testV2ScenarioIntegration = async () => {
    const testScenario: TestScenario = {
      scenarioId: `test-scenario-${Date.now()}`,
      name: '고객 획득 최적화',
      projectedScores: {
        GO: 85, // Growth
        EC: 78, // Economy
        PT: 82, // Product
        PF: 75, // Platform
        TO: 80  // Team
      },
      keyActions: [
        '마케팅 채널 다각화',
        '고객 피드백 시스템 구축',
        '프로세스 자동화 도입'
      ],
      timeline: '2개월',
      priority: 'high',
      estimatedEffort: 8,
      expectedROI: 150,
      tags: ['optimization', 'growth', 'automation']
    };

    try {
      addTestResult('🚀 V2 시나리오 저장 테스트 시작...');

      await calendarEcosystemConnector.triggerV2ScenarioSave(testScenario);

      addTestResult('✅ V2 시나리오 저장 성공 - 캘린더 이벤트 자동 생성 대기 중');

      // 3초 후 이벤트 확인
      setTimeout(() => {
        const generatedEvents = events.filter(e =>
          e.projectId === testScenario.scenarioId ||
          e.title.includes(testScenario.name)
        );
        addTestResult(`📅 생성된 캘린더 이벤트: ${generatedEvents.length}개`);
        generatedEvents.forEach(event => {
          addTestResult(`   - ${event.title} (${event.date.toLocaleDateString()})`);
        });
      }, 3000);

    } catch (error) {
      addTestResult(`❌ V2 시나리오 테스트 실패: ${error}`);
    }
  };

  // 외부 요인 보고 테스트
  const testExternalFactorReporting = async () => {
    try {
      addTestResult('🌍 외부 요인 보고 테스트 시작...');

      await reportExternalFactor(
        '경기 침체로 인한 고객 구매력 감소',
        -15, // 15점 감소 예상
        85,  // 85% 확신
        ['growth', 'economy'] // 성장, 경제 영역 영향
      );

      addTestResult('✅ 외부 요인 V2로 전달 완료 - KPI 업데이트 대기 중');

    } catch (error) {
      addTestResult(`❌ 외부 요인 테스트 실패: ${error}`);
    }
  };

  // 연결 상태 확인
  const checkConnectionStatus = () => {
    const stats = getEcosystemStats();
    setIsConnected(calendarEcosystemConnector.isConnected());

    addTestResult('🔗 Ecosystem 연결 상태:');
    addTestResult(`   - 연결됨: ${stats.connected ? '✅' : '❌'}`);
    addTestResult(`   - 구독 수: ${stats.subscriptions}`);
    addTestResult(`   - 이벤트 버스 상태: ${stats.eventBusHealthy ? '✅' : '❌'}`);
  };

  const addTestResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">🧪 Ecosystem Integration Test Panel</h3>

      {/* 연결 상태 */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <div className="flex items-center gap-2 mb-2">
          <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-sm font-medium">
            Ecosystem 연결: {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="text-xs text-gray-600">
          현재 캘린더 이벤트 수: {events.length}개
        </div>
      </div>

      {/* 테스트 버튼들 */}
      <div className="space-y-3 mb-4">
        <button
          onClick={testV2ScenarioIntegration}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          🚀 V2 시나리오 → 캘린더 연동 테스트
        </button>

        <button
          onClick={testExternalFactorReporting}
          className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
        >
          🌍 캘린더 → V2 외부 요인 보고 테스트
        </button>

        <button
          onClick={checkConnectionStatus}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
        >
          🔗 연결 상태 확인
        </button>

        <button
          onClick={clearResults}
          className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
        >
          🗑️ 결과 지우기
        </button>
      </div>

      {/* 테스트 결과 */}
      <div className="border rounded">
        <div className="bg-gray-50 px-3 py-2 border-b text-sm font-medium">
          테스트 결과 로그
        </div>
        <div className="p-3 max-h-64 overflow-y-auto">
          {testResults.length === 0 ? (
            <div className="text-gray-500 text-sm">테스트를 실행하면 결과가 여기에 표시됩니다.</div>
          ) : (
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="text-xs font-mono text-gray-700">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 사용법 안내 */}
      <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
        <div className="font-medium mb-1">🔄 테스트 시나리오:</div>
        <div className="text-xs space-y-1 text-blue-700">
          <div>1. V2 시나리오 저장 → 캘린더에 킥오프, 체크포인트, 리뷰 미팅 자동 생성</div>
          <div>2. 캘린더에서 외부 요인 보고 → V2 KPI 업데이트 트리거</div>
          <div>3. 연결 상태 모니터링 및 실시간 이벤트 로그</div>
        </div>
      </div>
    </div>
  );
};