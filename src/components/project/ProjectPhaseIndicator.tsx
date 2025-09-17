/**
 * ProjectPhaseIndicator.tsx
 *
 * 프로젝트 단계 진행 상황을 표시하는 컴포넌트
 * Phase transition 시스템과 독립적으로 작동
 */

import React from 'react';
import { CheckCircle, Circle, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import type { ProjectPhase } from '../../types/buildup.types';
import { PHASE_INFO, ALL_PHASES } from '../../utils/projectPhaseUtils';

interface ProjectPhaseIndicatorProps {
  currentPhase: ProjectPhase;
  progress?: number; // 0-100
  compact?: boolean;
}

// projectPhaseUtils의 PHASE_INFO를 사용하여 아이콘과 함께 매핑
const PHASE_DETAILS: Record<ProjectPhase, {
  icon: any;
  iconColor: string;
  textColor: string;
  bgColor: string;
  ringColor: string;
  description: string;
}> = {
  contract_pending: {
    icon: Clock,
    iconColor: 'text-gray-500',
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-100',
    ringColor: 'ring-gray-100',
    description: PHASE_INFO.contract_pending.description
  },
  contract_signed: {
    icon: CheckCircle,
    iconColor: 'text-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-100',
    ringColor: 'ring-green-100',
    description: PHASE_INFO.contract_signed.description
  },
  planning: {
    icon: Clock,
    iconColor: 'text-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-100',
    ringColor: 'ring-blue-100',
    description: PHASE_INFO.planning.description
  },
  design: {
    icon: Circle,
    iconColor: 'text-indigo-500',
    textColor: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    ringColor: 'ring-indigo-100',
    description: PHASE_INFO.design.description
  },
  execution: {
    icon: Circle,
    iconColor: 'text-purple-500',
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-100',
    ringColor: 'ring-purple-100',
    description: PHASE_INFO.execution.description
  },
  review: {
    icon: AlertCircle,
    iconColor: 'text-orange-500',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-100',
    ringColor: 'ring-orange-100',
    description: PHASE_INFO.review.description
  },
  completed: {
    icon: CheckCircle,
    iconColor: 'text-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-100',
    ringColor: 'ring-green-100',
    description: PHASE_INFO.completed.description
  }
};

export default function ProjectPhaseIndicator({
  currentPhase,
  progress = 0,
  compact = false
}: ProjectPhaseIndicatorProps) {
  const currentPhaseIndex = ALL_PHASES.indexOf(currentPhase);
  const phaseInfo = PHASE_DETAILS[currentPhase];

  // 안전장치: phaseInfo가 없는 경우 기본값 사용
  if (!phaseInfo) {
    console.warn(`Unknown phase: ${currentPhase}. Using fallback.`);
    return (
      <div className="flex items-center gap-2">
        <Circle className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          {currentPhase || '알 수 없음'}
        </span>
      </div>
    );
  }

  const Icon = phaseInfo.icon;

  if (compact) {
    // 간단한 표시 모드
    return (
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${phaseInfo.iconColor}`} />
        <span className={`text-sm font-medium ${phaseInfo.textColor}`}>
          {PHASE_INFO[currentPhase]?.label || currentPhase}
        </span>
        {progress > 0 && (
          <span className="text-xs text-gray-500">
            ({progress}%)
          </span>
        )}
      </div>
    );
  }

  // 전체 표시 모드
  return (
    <div className="space-y-4">
      {/* 현재 단계 헤더 */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`p-2 ${phaseInfo.bgColor} rounded-lg`}>
            <Icon className={`w-5 h-5 ${phaseInfo.iconColor}`} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              현재 단계: {PHASE_INFO[currentPhase]?.label || currentPhase}
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              {phaseInfo.description}
            </p>
          </div>
        </div>
        {progress > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {progress}%
            </div>
            <div className="text-xs text-gray-500">진행률</div>
          </div>
        )}
      </div>

      {/* 프로그레스 바 */}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          {ALL_PHASES.map((phase, index) => {
            const isCompleted = index < currentPhaseIndex;
            const isCurrent = index === currentPhaseIndex;
            const isPending = index > currentPhaseIndex;

            return (
              <React.Fragment key={phase}>
                <div
                  className={`
                    flex flex-col items-center gap-1
                    ${index === 0 ? 'items-start' : ''}
                    ${index === ALL_PHASES.length - 1 ? 'items-end' : ''}
                  `}
                >
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      transition-all duration-300
                      ${isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? `bg-purple-500 text-white ring-4 ${phaseInfo.ringColor}`
                        : 'bg-gray-200 text-gray-400'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-semibold">
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <span
                    className={`
                      text-xs whitespace-nowrap
                      ${isCurrent ? 'font-semibold text-gray-900' : 'text-gray-500'}
                    `}
                  >
                    {PHASE_INFO[phase]?.shortLabel || phase}
                  </span>
                </div>
                {index < ALL_PHASES.length - 1 && (
                  <div className="flex-1 px-2">
                    <div className="relative h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`
                          absolute inset-y-0 left-0 bg-gradient-to-r
                          ${isCompleted
                            ? 'from-green-500 to-green-500 w-full'
                            : isCurrent && progress > 0
                            ? 'from-purple-500 to-purple-400'
                            : ''
                          }
                        `}
                        style={{
                          width: isCompleted ? '100%' : isCurrent ? `${progress}%` : '0%'
                        }}
                      />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 다음 단계 정보 */}
      {currentPhaseIndex < ALL_PHASES.length - 1 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <ChevronRight className="w-4 h-4 text-blue-600" />
          <div className="flex-1">
            <span className="text-sm font-medium text-blue-900">
              다음 단계:
            </span>
            <span className="text-sm text-blue-700 ml-2">
              {PHASE_INFO[ALL_PHASES[currentPhaseIndex + 1]]?.label || ALL_PHASES[currentPhaseIndex + 1]}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Export props type for external use
export type { ProjectPhaseIndicatorProps };