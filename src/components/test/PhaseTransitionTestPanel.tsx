/**
 * PhaseTransitionTestPanel Component
 *
 * Phase Transition 자동 트리거를 테스트하기 위한 패널
 * 미팅 예약 시 프로젝트 단계가 자동으로 전환되는지 확인
 */

import React, { useState, useEffect } from 'react';
import { useBuildupContext } from '../../contexts/BuildupContext';
import { useScheduleContext } from '../../contexts/ScheduleContext';
import { UniversalScheduleModal } from '../schedule';
import type { BuildupProjectMeeting } from '../../types/schedule.types';
import { CheckCircle, AlertCircle, ArrowRight, Calendar, RefreshCw } from 'lucide-react';

export const PhaseTransitionTestPanel: React.FC = () => {
  const { projects, updateProject } = useBuildupContext();
  const { createSchedule, buildupMeetings } = useScheduleContext();

  const [showModal, setShowModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [testResults, setTestResults] = useState<Array<{
    id: string;
    projectId: string;
    fromPhase: string;
    toPhase: string;
    meetingType: string;
    success: boolean;
    timestamp: Date;
    message: string;
  }>>([]);
  const [runningTest, setRunningTest] = useState<{
    projectId: string;
    expectedPhase: string;
    fromPhase: string;
    meetingType: string;
    startTime: number;
  } | null>(null);

  // 테스트 프로젝트 선택
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // 폴링으로 상태 변화 감지
  useEffect(() => {
    if (!runningTest) return;

    const checkInterval = setInterval(() => {
      const updatedProject = projects.find(p => p.id === runningTest.projectId);
      const success = updatedProject?.currentPhase === runningTest.expectedPhase;

      // 성공하거나 5초가 지나면 결과 기록
      if (success || Date.now() - runningTest.startTime > 5000) {
        clearInterval(checkInterval);

        setTestResults(prev => [...prev, {
          id: Date.now().toString(),
          projectId: runningTest.projectId,
          fromPhase: runningTest.fromPhase,
          toPhase: runningTest.expectedPhase,
          meetingType: runningTest.meetingType,
          success,
          timestamp: new Date(),
          message: success
            ? `✅ 성공: ${runningTest.fromPhase} → ${runningTest.expectedPhase}`
            : `❌ 실패: 단계가 ${updatedProject?.currentPhase || 'undefined'}로 유지됨`
        }]);

        setRunningTest(null);
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, [runningTest, projects]);

  // 테스트 시나리오
  const testScenarios = [
    {
      meetingType: 'pre_meeting',
      fromPhase: 'contract_pending',
      toPhase: 'contract_signed',
      label: '프리미팅 → 계약 체결'
    },
    {
      meetingType: 'guide_1',
      fromPhase: 'contract_signed',
      toPhase: 'planning',
      label: '가이드 1차 → 기획 단계'
    },
    {
      meetingType: 'guide_2',
      fromPhase: 'planning',
      toPhase: 'design',
      label: '가이드 2차 → 디자인 단계'
    },
    {
      meetingType: 'guide_3',
      fromPhase: 'design',
      toPhase: 'execution',
      label: '가이드 3차 → 실행 단계'
    },
    {
      meetingType: 'guide_4',
      fromPhase: 'execution',
      toPhase: 'review',
      label: '가이드 4차 → 검토 단계'
    }
  ];

  // 테스트 실행
  const runTest = async (scenario: typeof testScenarios[0]) => {
    if (!selectedProject) {
      alert('프로젝트를 선택해주세요');
      return;
    }

    console.log('🧪 Starting test:', {
      scenario: scenario.label,
      projectId: selectedProject.id,
      currentPhase: selectedProject.currentPhase,
      targetPhase: scenario.toPhase
    });

    try {
      // 1. 프로젝트를 시작 단계로 설정하고 잠시 기다림
      await updateProject(selectedProject.id, {
        currentPhase: scenario.fromPhase as any
      });

      // 상태 업데이트를 위한 짧은 대기
      await new Promise(resolve => setTimeout(resolve, 100));

      // 2. 미팅 생성 (단계 전환 트리거 포함)
      const testMeeting: Omit<BuildupProjectMeeting, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'buildup_project',
        title: `테스트: ${scenario.label}`,
        description: 'Phase Transition 자동 테스트',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 내일
        time: '14:00',
        location: '테스트 장소',
        isOnline: false,
        status: 'scheduled',
        priority: 'high',
        participants: ['test@example.com'],
        tags: ['테스트', '단계전환'],
        reminders: [],
        createdBy: 'test-user',
        projectId: selectedProject.id,
        projectName: selectedProject.title,
        meetingSequence: {
          type: scenario.meetingType as any,
          sequenceNumber: 0,
          totalSequences: 5
        },
        pmInfo: {
          id: 'test-pm-001',
          name: 'Test PM',
          email: 'testpm@example.com',
          phone: '010-1234-5678'
        },
        phaseTransitionTrigger: {
          fromPhase: scenario.fromPhase as any,
          toPhase: scenario.toPhase as any
        }
      };

      const result = await createSchedule(testMeeting);

      // 3. 폴링을 위한 상태 설정
      setRunningTest({
        projectId: selectedProject.id,
        expectedPhase: scenario.toPhase,
        fromPhase: scenario.fromPhase,
        meetingType: scenario.meetingType,
        startTime: Date.now()
      });

      // 테스트가 완료될 때까지 대기 (최대 5초)
      await new Promise(resolve => setTimeout(resolve, 5500));

    } catch (error) {
      console.error('Test failed:', error);
      setTestResults(prev => [...prev, {
        id: Date.now().toString(),
        projectId: selectedProject.id,
        fromPhase: scenario.fromPhase,
        toPhase: scenario.toPhase,
        meetingType: scenario.meetingType,
        success: false,
        timestamp: new Date(),
        message: `❌ 에러: ${error}`
      }]);
    }
  };

  // 모든 테스트 실행
  const runAllTests = async () => {
    setTestResults([]); // 이전 결과 초기화

    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i];

      await runTest(scenario);
      // 각 테스트가 완료될 때까지 대기
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🔬 Phase Transition 자동 트리거 테스트
        </h2>
        <p className="text-sm text-gray-600">
          미팅 예약 시 프로젝트 단계가 자동으로 전환되는지 테스트합니다
        </p>
      </div>

      {/* 프로젝트 선택 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          테스트 프로젝트 선택
        </label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">프로젝트를 선택하세요</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.title} (현재: {project.phase})
            </option>
          ))}
        </select>
      </div>

      {/* 테스트 시나리오 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">테스트 시나리오</h3>
        <div className="space-y-2">
          {testScenarios.map((scenario, index) => (
            <div
              key={scenario.meetingType}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                <span className="text-sm font-medium text-gray-900">
                  {scenario.label}
                </span>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="px-2 py-1 bg-white rounded">{scenario.fromPhase}</span>
                  <ArrowRight className="w-3 h-3" />
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{scenario.toPhase}</span>
                </div>
              </div>
              <button
                onClick={() => runTest(scenario)}
                disabled={!selectedProjectId}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                테스트
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 테스트 액션 */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={runAllTests}
          disabled={!selectedProjectId}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          모든 테스트 실행
        </button>
        <button
          onClick={() => setShowModal(true)}
          disabled={!selectedProjectId}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          수동으로 미팅 예약
        </button>
        <button
          onClick={() => setTestResults([])}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          결과 초기화
        </button>
      </div>

      {/* 테스트 결과 */}
      {testResults.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">테스트 결과</h3>
          <div className="space-y-2">
            {testResults.map(result => (
              <div
                key={result.id}
                className={`p-3 rounded-lg border ${
                  result.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      result.success ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {result.message}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      프로젝트: {projects.find(p => p.id === result.projectId)?.title} |
                      미팅: {result.meetingType} |
                      시간: {result.timestamp.toLocaleTimeString('ko-KR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 현재 프로젝트 상태 */}
      {selectedProject && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">현재 프로젝트 상태</h4>
          <div className="space-y-1 text-sm text-blue-700">
            <p>프로젝트: {selectedProject.title}</p>
            <p>현재 단계: <span className="font-semibold">{selectedProject.currentPhase}</span></p>
            <p>예약된 미팅: {buildupMeetings.filter(m => m.projectId === selectedProject.id).length}개</p>
          </div>
        </div>
      )}

      {/* UniversalScheduleModal */}
      {showModal && selectedProject && (
        <UniversalScheduleModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          mode="create"
          defaultType="buildup_project"
          projectId={selectedProject.id}
          onSuccess={() => {
            setShowModal(false);
            setTimeout(() => {
              // 프로젝트 상태 확인
              const updated = projects.find(p => p.id === selectedProject.id);
              alert(`미팅 예약 완료!\n현재 단계: ${updated?.currentPhase}`);
            }, 1000);
          }}
        />
      )}
    </div>
  );
};

export default PhaseTransitionTestPanel;