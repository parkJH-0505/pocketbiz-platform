/**
 * 실제 사용 시나리오 가이드
 * 스타트업 대표가 실제로 사용할 주요 시나리오들을 단계별로 안내
 */

import React, { useState, useCallback } from 'react';
import { ChevronRight, CheckCircle, Clock, Target, TrendingUp, FileText, BarChart3 } from 'lucide-react';

interface ScenarioStep {
  id: string;
  title: string;
  description: string;
  action: string;
  expectedResult: string;
  icon: React.ReactNode;
  completed?: boolean;
}

interface UsageScenario {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'easy' | 'medium' | 'hard';
  steps: ScenarioStep[];
}

const USAGE_SCENARIOS: UsageScenario[] = [
  {
    id: 'daily-checkin',
    title: '📅 일일 체크인 (5분)',
    description: '매일 아침 현재 비즈니스 상태를 확인하고 오늘의 목표를 설정',
    duration: '5분',
    difficulty: 'easy',
    steps: [
      {
        id: 'check-health',
        title: '비즈니스 건강도 확인',
        description: '대시보드에서 현재 건강도 점수와 주요 지표를 확인',
        action: '대시보드 → 비즈니스 건강도 카드 확인',
        expectedResult: '현재 점수와 3가지 분석(꾸준함/활동량/성과) 표시',
        icon: <BarChart3 className="w-4 h-4" />
      },
      {
        id: 'set-daily-goal',
        title: '오늘의 목표 설정',
        description: '주간 목표 진행상황을 보고 오늘 집중할 활동 결정',
        action: '목표 설정 섹션에서 진행률 확인',
        expectedResult: '목표별 현재 진행률과 남은 목표량 표시',
        icon: <Target className="w-4 h-4" />
      },
      {
        id: 'check-insights',
        title: '인사이트 확인',
        description: '시스템이 제안하는 개선사항이나 주의사항 검토',
        action: '인사이트 메시지 읽기',
        expectedResult: '실행 가능한 개선 제안과 우선순위 표시',
        icon: <TrendingUp className="w-4 h-4" />
      }
    ]
  },
  {
    id: 'kpi-diagnosis',
    title: '📊 KPI 진단 (15분)',
    description: '정기적인 KPI 진단을 통해 현재 비즈니스 상태를 정확히 파악',
    duration: '15분',
    difficulty: 'medium',
    steps: [
      {
        id: 'start-diagnosis',
        title: 'KPI 진단 시작',
        description: 'KPI 진단 페이지로 이동하여 현재 단계에 맞는 진단 시작',
        action: 'KPI 진단 페이지 → 진단 시작',
        expectedResult: '현재 스타트업 단계에 맞는 KPI 문항들 표시',
        icon: <BarChart3 className="w-4 h-4" />
      },
      {
        id: 'answer-questions',
        title: '진단 문항 응답',
        description: '각 축별(GO/EC/PT/PF/TO) 문항에 정확하게 응답',
        action: '문항별로 현재 상태에 맞게 응답',
        expectedResult: '실시간으로 "KPI 진단 답변 완료! (+3점)" 피드백 표시',
        icon: <CheckCircle className="w-4 h-4" />
      },
      {
        id: 'review-results',
        title: '결과 분석',
        description: '진단 결과를 통해 강점과 개선점 파악',
        action: '결과 탭에서 점수와 분석 확인',
        expectedResult: '축별 점수, 전체 점수, 개선 제안사항 표시',
        icon: <TrendingUp className="w-4 h-4" />
      }
    ]
  },
  {
    id: 'project-management',
    title: '🚀 프로젝트 관리 (10분)',
    description: '진행중인 프로젝트의 마일스톤을 확인하고 진행상황을 업데이트',
    duration: '10분',
    difficulty: 'medium',
    steps: [
      {
        id: 'check-projects',
        title: '프로젝트 현황 확인',
        description: '현재 진행중인 프로젝트들의 상태와 진행률 검토',
        action: 'Buildup 페이지에서 프로젝트 목록 확인',
        expectedResult: '프로젝트별 진행률과 다음 마일스톤 표시',
        icon: <Target className="w-4 h-4" />
      },
      {
        id: 'update-milestone',
        title: '마일스톤 완료 처리',
        description: '완료된 마일스톤을 시스템에 기록',
        action: '완료된 마일스톤 체크 또는 상태 업데이트',
        expectedResult: '"작업 완료! (+2점)" 피드백과 목표 진행률 자동 업데이트',
        icon: <CheckCircle className="w-4 h-4" />
      },
      {
        id: 'plan-next',
        title: '다음 단계 계획',
        description: '다음 마일스톤을 위한 계획 수립',
        action: '다음 마일스톤 목표와 일정 설정',
        expectedResult: '업데이트된 프로젝트 타임라인과 목표 표시',
        icon: <Clock className="w-4 h-4" />
      }
    ]
  },
  {
    id: 'document-review',
    title: '📄 문서 검토 (12분)',
    description: 'VDR의 중요 문서들을 검토하고 필요한 업데이트 수행',
    duration: '12분',
    difficulty: 'easy',
    steps: [
      {
        id: 'browse-documents',
        title: '문서 목록 확인',
        description: 'VDR에서 최근 업로드된 문서나 중요 문서들 확인',
        action: 'VDR 페이지에서 문서 목록 검토',
        expectedResult: '카테고리별 문서 목록과 최근 활동 표시',
        icon: <FileText className="w-4 h-4" />
      },
      {
        id: 'review-documents',
        title: '주요 문서 검토',
        description: 'IR 덱, 사업계획서 등 주요 문서 내용 검토',
        action: '중요 문서들 열어보기 및 다운로드',
        expectedResult: '"문서 조회 완료! (+1점)" 피드백과 접근 기록 저장',
        icon: <CheckCircle className="w-4 h-4" />
      },
      {
        id: 'update-documents',
        title: '문서 업데이트',
        description: '필요시 새 버전 업로드나 정보 수정',
        action: '문서 업로드 또는 메타데이터 수정',
        expectedResult: '문서 버전 관리와 활동 기록 자동 업데이트',
        icon: <TrendingUp className="w-4 h-4" />
      }
    ]
  }
];

export const UsageScenarioGuide: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const handleStepComplete = useCallback((stepId: string) => {
    setCompletedSteps(prev => new Set(prev).add(stepId));
  }, []);

  const handleScenarioSelect = useCallback((scenarioId: string) => {
    setSelectedScenario(scenarioId === selectedScenario ? null : scenarioId);
  }, [selectedScenario]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '쉬움';
      case 'medium': return '보통';
      case 'hard': return '어려움';
      default: return '알 수 없음';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🎯 실제 사용 시나리오 가이드
        </h2>
        <p className="text-gray-600">
          스타트업 대표로서 일상적으로 사용하게 될 주요 시나리오들입니다.
          각 시나리오를 따라하며 시스템이 올바르게 작동하는지 확인해보세요.
        </p>
      </div>

      <div className="space-y-4">
        {USAGE_SCENARIOS.map(scenario => {
          const isSelected = selectedScenario === scenario.id;
          const completedStepsCount = scenario.steps.filter(step =>
            completedSteps.has(step.id)
          ).length;
          const progressPercentage = (completedStepsCount / scenario.steps.length) * 100;

          return (
            <div
              key={scenario.id}
              className={`border rounded-lg transition-all duration-200 ${
                isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* 시나리오 헤더 */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => handleScenarioSelect(scenario.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {scenario.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(scenario.difficulty)}`}>
                        {getDifficultyText(scenario.difficulty)}
                      </span>
                      <span className="text-sm text-gray-500">
                        ⏱️ {scenario.duration}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {scenario.description}
                    </p>

                    {/* 진행률 표시 */}
                    {completedStepsCount > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>진행률</span>
                          <span>{completedStepsCount}/{scenario.steps.length}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <ChevronRight
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                      isSelected ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </div>

              {/* 시나리오 단계들 */}
              {isSelected && (
                <div className="border-t border-gray-200">
                  <div className="p-4">
                    <div className="space-y-4">
                      {scenario.steps.map((step, index) => {
                        const isCompleted = completedSteps.has(step.id);

                        return (
                          <div
                            key={step.id}
                            className={`p-4 rounded-lg border transition-all duration-200 ${
                              isCompleted
                                ? 'border-green-200 bg-green-50'
                                : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                isCompleted
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-300 text-gray-600'
                              }`}>
                                {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {step.icon}
                                  <h4 className="font-medium text-gray-900">
                                    {step.title}
                                  </h4>
                                </div>

                                <p className="text-sm text-gray-600 mb-3">
                                  {step.description}
                                </p>

                                <div className="space-y-2">
                                  <div className="text-sm">
                                    <span className="font-medium text-blue-600">실행:</span>
                                    <span className="ml-2 text-gray-700">{step.action}</span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="font-medium text-green-600">예상 결과:</span>
                                    <span className="ml-2 text-gray-700">{step.expectedResult}</span>
                                  </div>
                                </div>

                                {!isCompleted && (
                                  <button
                                    onClick={() => handleStepComplete(step.id)}
                                    className="mt-3 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                  >
                                    완료 표시
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 전체 진행률 요약 */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">전체 진행률</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {USAGE_SCENARIOS.map(scenario => {
            const completedCount = scenario.steps.filter(step =>
              completedSteps.has(step.id)
            ).length;
            const totalCount = scenario.steps.length;
            const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

            return (
              <div key={scenario.id} className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {percentage.toFixed(0)}%
                </div>
                <div className="text-sm text-blue-800">
                  {scenario.title.split(' ')[0]}
                </div>
                <div className="text-xs text-blue-600">
                  {completedCount}/{totalCount} 완료
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UsageScenarioGuide;