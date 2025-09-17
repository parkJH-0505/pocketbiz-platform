/**
 * ProjectPhaseTransition.tsx
 *
 * Stage C-3: 프로젝트별 단계 전환 컴포넌트
 * 특정 프로젝트의 단계 전환을 관리하는 컴포넌트
 */

import React, { useState } from 'react';
import { usePhaseTransition } from '../../hooks/usePhaseTransition';
import { useBuildupContext } from '../../contexts/BuildupContext';
import type { Project } from '../../types/buildup.types';
import { PHASE_INFO } from '../../utils/projectPhaseUtils';

interface ProjectPhaseTransitionProps {
  project: Project;
  className?: string;
  onPhaseChange?: (projectId: string, newPhase: string) => void;
}

export default function ProjectPhaseTransition({
  project,
  className = '',
  onPhaseChange
}: ProjectPhaseTransitionProps) {
  const {
    status,
    isLoading,
    requestPhaseChange,
    canTransitionTo,
    getAvailableTransitions
  } = usePhaseTransition();

  const { getPhaseTransitionHistory } = useBuildupContext();

  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [selectedTargetPhase, setSelectedTargetPhase] = useState('');
  const [transitionReason, setTransitionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentPhase = project.phase || 'contract_pending';
  const availableTransitions = getAvailableTransitions(project);
  const history = getPhaseTransitionHistory(project.id);

  const getCurrentPhaseInfo = () => {
    return PHASE_INFO[currentPhase] || { label: '알 수 없음', color: 'gray', description: '' };
  };

  const getPhaseColor = (phase: string) => {
    const info = PHASE_INFO[phase];
    if (!info) return 'bg-gray-100 text-gray-800';

    const colorMap: Record<string, string> = {
      'blue': 'bg-blue-100 text-blue-800',
      'green': 'bg-green-100 text-green-800',
      'yellow': 'bg-yellow-100 text-yellow-800',
      'red': 'bg-red-100 text-red-800',
      'purple': 'bg-purple-100 text-purple-800',
      'gray': 'bg-gray-100 text-gray-800'
    };

    return colorMap[info.color] || 'bg-gray-100 text-gray-800';
  };

  const handleTransitionRequest = async () => {
    if (!selectedTargetPhase || !transitionReason.trim()) return;

    setSubmitting(true);
    try {
      await requestPhaseChange(
        project.id,
        currentPhase,
        selectedTargetPhase,
        transitionReason
      );

      setShowTransitionModal(false);
      setSelectedTargetPhase('');
      setTransitionReason('');

      if (onPhaseChange) {
        onPhaseChange(project.id, selectedTargetPhase);
      }
    } catch (error) {
      console.error('Failed to request phase transition:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 시스템 상태 표시 */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-600">Phase Transition System:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            status.isEnabled
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {status.isEnabled ? '활성화됨' : '비활성화됨'}
          </span>
        </div>
        {!status.isEnabled && (
          <span className="text-xs text-gray-500">대시보드에서 시스템을 활성화해주세요</span>
        )}
      </div>

      {/* 현재 단계 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-500">현재 단계:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPhaseColor(currentPhase)}`}>
            {getCurrentPhaseInfo().label}
          </span>
        </div>

        {/* 단계 전환 버튼 */}
        {status.isEnabled && availableTransitions.length > 0 ? (
          <button
            onClick={() => setShowTransitionModal(true)}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          >
            단계 전환
          </button>
        ) : (
          <span className="text-xs text-gray-500">
            {!status.isEnabled
              ? '시스템 비활성화됨'
              : availableTransitions.length === 0
                ? '전환 가능한 단계 없음'
                : ''}
          </span>
        )}
      </div>

      {/* 가능한 다음 단계들 */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-500">가능한 전환:</span>
        <div className="flex flex-wrap gap-2">
          {availableTransitions.length > 0 ? (
            availableTransitions.map(phase => {
              const phaseInfo = PHASE_INFO[phase];
              return (
                <span
                  key={phase}
                  className={`px-2 py-1 rounded text-xs ${getPhaseColor(phase)} border border-current border-opacity-20`}
                >
                  {phaseInfo?.label || phase}
                </span>
              );
            })
          ) : (
            <span className="text-xs text-gray-500 italic">
              {status.isEnabled
                ? '현재 단계에서 전환 가능한 단계가 없습니다'
                : '시스템을 활성화하면 가능한 전환을 확인할 수 있습니다'}
            </span>
          )}
        </div>
      </div>

      {/* 단계 전환 히스토리 */}
      {history.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-500">단계 전환 이력:</span>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {history.slice(-3).reverse().map(event => (
              <div key={event.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">{formatDate(event.timestamp)}</span>
                  <span className="text-gray-700">
                    {event.fromPhase} → {event.toPhase}
                  </span>
                  {event.automatic && (
                    <span className="px-1 py-0.5 bg-green-100 text-green-700 rounded text-xs">자동</span>
                  )}
                </div>
                <span className="text-gray-500">{event.requestedBy}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 단계 전환 모달 */}
      {showTransitionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">단계 전환</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전환할 단계
                </label>
                <select
                  value={selectedTargetPhase}
                  onChange={(e) => setSelectedTargetPhase(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">단계를 선택하세요</option>
                  {availableTransitions.map(phase => {
                    const phaseInfo = PHASE_INFO[phase];
                    return (
                      <option key={phase} value={phase}>
                        {phaseInfo?.label || phase}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전환 사유
                </label>
                <textarea
                  value={transitionReason}
                  onChange={(e) => setTransitionReason(e.target.value)}
                  placeholder="단계 전환 사유를 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleTransitionRequest}
                disabled={!selectedTargetPhase || !transitionReason.trim() || submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? '처리 중...' : '전환 요청'}
              </button>
              <button
                onClick={() => setShowTransitionModal(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}