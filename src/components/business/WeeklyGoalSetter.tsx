/**
 * 주간 목표 설정 컴포넌트
 * 스타트업 대표들이 실제로 설정할만한 간단한 목표들
 */

import React, { useState, useEffect, useCallback } from 'react';
import { trackGoalSetting, trackGoalAchievement } from '../../services/momentumTracker';
import { useRealtimeUpdates, emitGoalProgress } from '../../hooks/useRealtimeUpdates';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

interface WeeklyGoal {
  id: string;
  type: 'kpi' | 'documents' | 'projects' | 'custom';
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
}

const PRESET_GOALS = [
  {
    id: 'kpi-updates',
    type: 'kpi' as const,
    title: 'KPI 진단 완료',
    description: '이번 주 KPI 진단 문항 답변',
    target: 20,
    unit: '개'
  },
  {
    id: 'documents-review',
    type: 'documents' as const,
    title: '문서 검토',
    description: '중요 문서 검토 및 다운로드',
    target: 10,
    unit: '개'
  },
  {
    id: 'project-progress',
    type: 'projects' as const,
    title: '프로젝트 진행',
    description: '프로젝트 마일스톤 달성',
    target: 3,
    unit: '개'
  }
];

export const WeeklyGoalSetter: React.FC = () => {
  const [currentGoals, setCurrentGoals] = useState<WeeklyGoal[]>([]);
  const [showSetup, setShowSetup] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  // 오늘 날짜 키 생성
  const getTodayKey = (): string => {
    return new Date().toDateString();
  };

  // 주간 목표 로드
  useEffect(() => {
    loadWeeklyGoals();
  }, []);

  // 최적화된 진행률 업데이트 시스템
  const { scheduleRefresh: scheduleProgressUpdate } = useAutoRefresh(
    () => {
      if (currentGoals.length > 0) {
        updateProgress(currentGoals);
      }
    },
    {
      debounceMs: 300,
      maxBatchDelay: 1000,
      priority: 'medium'
    }
  );

  // 실시간 목표 진행률 업데이트
  const handleProgressUpdate = useCallback((event) => {
    console.log('[WeeklyGoalSetter] Progress update received:', event.type);
    scheduleProgressUpdate();
  }, [scheduleProgressUpdate]);

  // 실시간 업데이트 리스닝
  useRealtimeUpdates(
    ['kpi-update', 'task-complete', 'document-access'],
    handleProgressUpdate,
    [currentGoals]
  );

  const loadWeeklyGoals = () => {
    const stored = localStorage.getItem('weekly-goals');
    if (stored) {
      try {
        const goals = JSON.parse(stored);
        setCurrentGoals(goals);
        updateProgress(goals);
      } catch (error) {
        console.error('주간 목표 로드 실패:', error);
      }
    }
  };

  const updateProgress = (goals: WeeklyGoal[]) => {
    const today = getTodayKey();

    goals.forEach(goal => {
      switch (goal.type) {
        case 'kpi':
          const kpiCount = parseInt(localStorage.getItem('kpi-updates-today') || '0');
          goal.current = kpiCount;
          break;
        case 'documents':
          const docCount = parseInt(localStorage.getItem('documents-accessed-today') || '0');
          goal.current = docCount;
          break;
        case 'projects':
          const projectCount = parseInt(localStorage.getItem(`milestones-completed-${today}`) || '0');
          goal.current = projectCount;
          break;
      }

      // 목표 달성 체크
      if (goal.current >= goal.target) {
        const achievedKey = `goal-${goal.id}-achieved`;
        if (!localStorage.getItem(achievedKey)) {
          localStorage.setItem(achievedKey, 'true');
          trackGoalAchievement(goal.type);

          // 목표 달성 이벤트 발생
          emitGoalProgress(goal.id);
        }
      }
    });

    setCurrentGoals([...goals]);
  };

  const setWeeklyGoal = (presetId: string, customTarget?: number) => {
    const preset = PRESET_GOALS.find(p => p.id === presetId);
    if (!preset) return;

    const newGoal: WeeklyGoal = {
      ...preset,
      target: customTarget || preset.target,
      current: 0
    };

    const updatedGoals = currentGoals.filter(g => g.id !== presetId);
    updatedGoals.push(newGoal);

    setCurrentGoals(updatedGoals);
    localStorage.setItem('weekly-goals', JSON.stringify(updatedGoals));

    // 목표 설정 추적
    trackGoalSetting('weekly', newGoal);

    setShowSetup(false);
    setSelectedPreset('');
  };

  const removeGoal = (goalId: string) => {
    const updatedGoals = currentGoals.filter(g => g.id !== goalId);
    setCurrentGoals(updatedGoals);
    localStorage.setItem('weekly-goals', JSON.stringify(updatedGoals));
  };

  const resetWeeklyGoals = () => {
    if (window.confirm('이번 주 목표를 모두 초기화하시겠습니까?')) {
      setCurrentGoals([]);
      localStorage.removeItem('weekly-goals');
      // 달성 기록도 초기화
      PRESET_GOALS.forEach(goal => {
        localStorage.removeItem(`goal-${goal.id}-achieved`);
      });
    }
  };

  return (
    <div className="weekly-goal-setter">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">이번 주 목표</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSetup(true)}
            className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
          >
            목표 추가
          </button>
          {currentGoals.length > 0 && (
            <button
              onClick={resetWeeklyGoals}
              className="px-3 py-1 text-sm bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {currentGoals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-3">설정된 주간 목표가 없습니다</p>
          <button
            onClick={() => setShowSetup(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            첫 목표 설정하기
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {currentGoals.map(goal => {
            const progress = Math.min((goal.current / goal.target) * 100, 100);
            const isCompleted = goal.current >= goal.target;

            return (
              <div
                key={goal.id}
                className={`p-4 rounded-lg border ${
                  isCompleted
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{goal.title}</h4>
                    <p className="text-sm text-gray-600">{goal.description}</p>
                  </div>
                  <button
                    onClick={() => removeGoal(goal.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">
                      {goal.current} / {goal.target} {goal.unit}
                    </span>
                    <span className={`font-medium transition-colors duration-300 ${
                      isCompleted ? 'text-green-600' : 'text-gray-700'
                    }`}>
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ease-out ${
                        isCompleted ? 'bg-green-500 animate-pulse' : 'bg-blue-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {isCompleted && (
                  <div className="flex items-center text-sm text-green-600 animate-in slide-in-from-bottom-2 duration-500">
                    <span className="mr-1 text-lg animate-bounce">🎉</span>
                    <span className="font-medium">목표 달성 완료!</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 목표 설정 모달 */}
      {showSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">주간 목표 설정</h3>

            <div className="space-y-3 mb-6">
              {PRESET_GOALS.map(preset => (
                <div
                  key={preset.id}
                  className={`p-3 border rounded-lg cursor-pointer ${
                    selectedPreset === preset.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPreset(preset.id)}
                >
                  <h4 className="font-medium">{preset.title}</h4>
                  <p className="text-sm text-gray-600">{preset.description}</p>
                  <p className="text-sm text-blue-600 mt-1">
                    기본 목표: {preset.target}{preset.unit}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSetup(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => selectedPreset && setWeeklyGoal(selectedPreset)}
                disabled={!selectedPreset}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                설정하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyGoalSetter;