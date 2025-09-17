/**
 * PhaseTransitionControls.tsx
 *
 * Stage C-3: Phase Transition 제어 UI 컴포넌트
 * 관리자가 Phase Transition 시스템을 제어할 수 있는 컴포넌트
 */

import React, { useState } from 'react';
import { usePhaseTransition } from '../../hooks/usePhaseTransition';

interface PhaseTransitionControlsProps {
  className?: string;
}

export default function PhaseTransitionControls({ className = '' }: PhaseTransitionControlsProps) {
  const {
    status,
    isLoading,
    error,
    enablePhaseTransition,
    disablePhaseTransition,
    refreshStatus
  } = usePhaseTransition();

  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = () => {
    if (!status.healthy) return 'text-red-500';
    if (status.isEnabled && status.engineAvailable) return 'text-green-500';
    return 'text-yellow-500';
  };

  const getStatusText = () => {
    if (!status.healthy) return '오류';
    if (status.isEnabled && status.engineAvailable) return '활성화됨';
    if (status.isEnabled) return '로딩 중';
    return '비활성화됨';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="px-4 py-3 border-b border-gray-200">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                status.healthy && status.isEnabled ? 'bg-green-500' :
                status.isEnabled ? 'bg-yellow-500' : 'bg-gray-400'
              }`} />
              <span className="font-medium text-gray-900">Phase Transition 시스템</span>
            </div>
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transform transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 py-4 space-y-4">
          {/* 시스템 상태 정보 */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">모듈 상태:</span>
              <span className="ml-2 font-medium text-gray-900">{status.moduleState}</span>
            </div>
            <div>
              <span className="text-gray-500">엔진 사용 가능:</span>
              <span className="ml-2 font-medium text-gray-900">
                {status.engineAvailable ? '예' : '아니오'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">시스템 건강:</span>
              <span className="ml-2 font-medium text-gray-900">
                {status.healthy ? '정상' : '문제 있음'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">활성화 상태:</span>
              <span className="ml-2 font-medium text-gray-900">
                {status.isEnabled ? '활성화됨' : '비활성화됨'}
              </span>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-700">오류: {error}</span>
              </div>
            </div>
          )}

          {/* 제어 버튼들 */}
          <div className="flex space-x-3">
            {!status.isEnabled ? (
              <button
                onClick={enablePhaseTransition}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading && (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                <span>{isLoading ? '활성화 중...' : '시스템 활성화'}</span>
              </button>
            ) : (
              <button
                onClick={disablePhaseTransition}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                시스템 비활성화
              </button>
            )}

            <button
              onClick={refreshStatus}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>상태 새로고침</span>
            </button>
          </div>

          {/* 도움말 */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 mb-1">Phase Transition 시스템이란?</h4>
            <p className="text-sm text-blue-700">
              프로젝트 단계를 자동으로 전환하는 시스템입니다. 미팅 완료, 산출물 승인 등의 이벤트를 기반으로
              프로젝트 단계를 자동으로 업데이트합니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}