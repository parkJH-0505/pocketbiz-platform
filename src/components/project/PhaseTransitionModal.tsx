/**
 * PhaseTransitionModal.tsx
 *
 * 프로젝트 단계 수동 전환을 위한 모달 컴포넌트
 * 관리자가 프로젝트 단계를 수동으로 변경할 수 있는 인터페이스 제공
 */

import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, ArrowRight, Info } from 'lucide-react';
import type { ProjectPhase, Project } from '../../types/buildup.types';

interface PhaseTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onTransition: (newPhase: ProjectPhase, reason: string) => void;
}

const PHASE_ORDER: ProjectPhase[] = [
  '결제 대기',
  'PM 배정 중',
  '킥오프 준비',
  '진행 중',
  '마무리',
  '완료'
];

const PHASE_REQUIREMENTS = {
  '결제 대기': [],
  'PM 배정 중': [
    '결제가 완료되어야 합니다',
    '서비스 계약이 체결되어야 합니다'
  ],
  '킥오프 준비': [
    'PM이 배정되어야 합니다',
    '프로젝트 팀이 구성되어야 합니다'
  ],
  '진행 중': [
    '킥오프 미팅이 완료되어야 합니다',
    '프로젝트 목표와 범위가 확정되어야 합니다'
  ],
  '마무리': [
    '주요 산출물이 완성되어야 합니다',
    '최종 검토가 진행되어야 합니다'
  ],
  '완료': [
    '모든 산출물이 제출되어야 합니다',
    '클라이언트 승인이 완료되어야 합니다'
  ]
};

const TRANSITION_WARNINGS = {
  backward: '이전 단계로 되돌리면 진행 상황이 영향을 받을 수 있습니다.',
  skip: '단계를 건너뛰면 필수 프로세스가 누락될 수 있습니다.',
  complete: '완료 단계로 전환하면 프로젝트가 종료됩니다.'
};

export default function PhaseTransitionModal({
  isOpen,
  onClose,
  project,
  onTransition
}: PhaseTransitionModalProps) {
  const currentPhaseIndex = PHASE_ORDER.indexOf(project.phase);
  const [selectedPhase, setSelectedPhase] = useState<ProjectPhase | null>(null);
  const [transitionReason, setTransitionReason] = useState('');
  const [agreedToWarning, setAgreedToWarning] = useState(false);

  if (!isOpen) return null;

  const selectedPhaseIndex = selectedPhase ? PHASE_ORDER.indexOf(selectedPhase) : -1;
  const isBackward = selectedPhaseIndex < currentPhaseIndex;
  const isSkipping = selectedPhaseIndex > currentPhaseIndex + 1;
  const isComplete = selectedPhase === '완료';

  const getWarningType = () => {
    if (isBackward) return 'backward';
    if (isSkipping) return 'skip';
    if (isComplete) return 'complete';
    return null;
  };

  const warningType = getWarningType();

  const handleTransition = () => {
    if (!selectedPhase || !transitionReason.trim()) return;
    if (warningType && !agreedToWarning) return;

    onTransition(selectedPhase, transitionReason);
    onClose();

    // Reset form
    setSelectedPhase(null);
    setTransitionReason('');
    setAgreedToWarning(false);
  };

  const canTransition =
    selectedPhase &&
    selectedPhase !== project.phase &&
    transitionReason.trim() &&
    (!warningType || agreedToWarning);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative inline-block w-full max-w-2xl p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                프로젝트 단계 변경
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {project.title} - 현재 단계: {project.phase}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Phase Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">현재 단계 정보</span>
            </div>
            <div className="space-y-1 text-sm text-blue-700">
              <p>단계: {project.phase} ({currentPhaseIndex + 1}/6)</p>
              <p>진행률: {project.progress || 0}%</p>
              <p>시작일: {new Date(project.createdAt).toLocaleDateString('ko-KR')}</p>
            </div>
          </div>

          {/* Phase Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              변경할 단계 선택
            </label>
            <div className="grid grid-cols-2 gap-3">
              {PHASE_ORDER.map((phase, index) => {
                const isCurrent = phase === project.phase;
                const isSelected = phase === selectedPhase;
                const isBackwardPhase = index < currentPhaseIndex;
                const isForwardPhase = index > currentPhaseIndex;

                return (
                  <button
                    key={phase}
                    onClick={() => setSelectedPhase(phase)}
                    disabled={isCurrent}
                    className={`
                      relative p-3 rounded-lg border-2 text-left transition-all
                      ${isCurrent
                        ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
                        : isSelected
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`
                            text-sm font-medium
                            ${isCurrent ? 'text-gray-400' : isSelected ? 'text-blue-900' : 'text-gray-900'}
                          `}>
                            {phase}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                              현재
                            </span>
                          )}
                        </div>
                        <span className={`
                          text-xs mt-1
                          ${isCurrent ? 'text-gray-400' : 'text-gray-500'}
                        `}>
                          {index + 1}단계
                        </span>
                      </div>
                      {isBackwardPhase && !isCurrent && (
                        <ArrowRight className="w-4 h-4 text-orange-500 rotate-180" />
                      )}
                      {isForwardPhase && !isCurrent && (
                        <ArrowRight className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Requirements for Selected Phase */}
          {selectedPhase && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                {selectedPhase} 단계 요구사항
              </h4>
              {PHASE_REQUIREMENTS[selectedPhase].length > 0 ? (
                <ul className="space-y-1">
                  {PHASE_REQUIREMENTS[selectedPhase].map((req, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600">특별한 요구사항이 없습니다.</p>
              )}
            </div>
          )}

          {/* Warning */}
          {selectedPhase && warningType && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-yellow-900 mb-1">
                    주의사항
                  </h4>
                  <p className="text-sm text-yellow-700">
                    {TRANSITION_WARNINGS[warningType]}
                  </p>
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToWarning}
                      onChange={(e) => setAgreedToWarning(e.target.checked)}
                      className="text-yellow-600 rounded focus:ring-yellow-500"
                    />
                    <span className="text-sm text-yellow-800">
                      위 내용을 확인했으며, 단계 변경을 진행합니다
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Transition Reason */}
          <div className="mb-6">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              변경 사유 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reason"
              value={transitionReason}
              onChange={(e) => setTransitionReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="단계 변경 사유를 입력해주세요..."
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              변경 사유는 프로젝트 이력에 기록됩니다
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleTransition}
              disabled={!canTransition}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all
                ${canTransition
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              단계 변경
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export props type for external use
export type { PhaseTransitionModalProps };