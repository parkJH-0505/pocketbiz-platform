/**
 * PhaseHistoryDisplay.tsx
 *
 * 프로젝트 단계 변경 이력을 표시하는 컴포넌트
 * 타임라인 형식으로 단계 전환 기록을 시각화
 */

import React from 'react';
import { Clock, User, FileText, ArrowRight, CheckCircle, Calendar, Info, CircleDot, Play } from 'lucide-react';
import type { ProjectPhase } from '../../types/buildup.types';
import { PHASE_INFO } from '../../utils/projectPhaseUtils';

// 단계 이력 타입 정의 (buildup.types.ts에 없는 경우 대비)
interface PhaseHistoryEntry {
  phase: ProjectPhase;
  timestamp: string;
  reason?: string;
  changedBy?: string;
}

interface PhaseHistoryDisplayProps {
  history?: PhaseHistoryEntry[];
  currentPhase: ProjectPhase;
  compact?: boolean;
}

const PHASE_COLORS: Record<ProjectPhase, string> = {
  contract_pending: 'gray',
  contract_signed: 'green',
  planning: 'blue',
  design: 'indigo',
  execution: 'purple',
  review: 'orange',
  completed: 'green'
};

const PHASE_ICONS: Record<ProjectPhase, React.ElementType> = {
  contract_pending: Clock,
  contract_signed: CheckCircle,
  planning: User,
  design: CircleDot,
  execution: Play,
  review: FileText,
  completed: CheckCircle
};

export default function PhaseHistoryDisplay({
  history = [],
  currentPhase,
  compact = false
}: PhaseHistoryDisplayProps) {
  // 현재 단계를 포함한 전체 이력 생성
  const fullHistory = [
    ...history,
    {
      phase: currentPhase,
      timestamp: new Date().toISOString(),
      changedBy: 'system',
      reason: '현재 단계'
    }
  ];

  // 시간 포맷팅
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return '오늘';
    if (diffInDays === 1) return '어제';
    if (diffInDays < 7) return `${diffInDays}일 전`;

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (compact) {
    // 간단한 표시 모드 - 최근 3개 이력만 표시
    const recentHistory = fullHistory.slice(-3).reverse();

    return (
      <div className="space-y-2">
        {recentHistory.map((entry, index) => {
          const Icon = PHASE_ICONS[entry.phase] || Clock;
          const color = PHASE_COLORS[entry.phase] || 'gray';
          const phaseLabel = PHASE_INFO[entry.phase]?.label || entry.phase;
          const isLatest = index === 0;

          return (
            <div
              key={`${entry.timestamp}-${index}`}
              className={`flex items-center gap-3 p-2 rounded-lg ${
                isLatest ? 'bg-blue-50' : 'bg-gray-50'
              }`}
            >
              <div className={`p-1.5 bg-${color}-100 rounded`}>
                <Icon className={`w-3 h-3 text-${color}-600`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    isLatest ? 'text-gray-900' : 'text-gray-600'
                  }`}>
                    {phaseLabel}
                  </span>
                  {isLatest && (
                    <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                      현재
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {formatDate(entry.timestamp)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 전체 타임라인 표시 모드
  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
        <Clock className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-900">
          단계 변경 이력
        </h3>
        <span className="text-xs text-gray-500">
          ({fullHistory.length}개 기록)
        </span>
      </div>

      {/* 타임라인 */}
      <div className="relative">
        {fullHistory.length === 0 ? (
          <div className="text-center py-8">
            <Info className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">
              아직 단계 변경 이력이 없습니다
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {fullHistory.reverse().map((entry, index) => {
              const Icon = PHASE_ICONS[entry.phase] || Clock;
              const color = PHASE_COLORS[entry.phase] || 'gray';
              const phaseLabel = PHASE_INFO[entry.phase]?.label || entry.phase;
              const isLatest = index === 0;
              const isLast = index === fullHistory.length - 1;

              return (
                <div
                  key={`${entry.timestamp}-${index}`}
                  className="relative flex gap-4"
                >
                  {/* 타임라인 라인 */}
                  {!isLast && (
                    <div
                      className="absolute left-5 top-10 w-0.5 h-full bg-gray-200"
                      style={{ height: 'calc(100% + 1rem)' }}
                    />
                  )}

                  {/* 아이콘 */}
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        ${isLatest
                          ? `bg-${color}-500 ring-4 ring-${color}-100`
                          : `bg-${color}-100`
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 ${
                        isLatest ? 'text-white' : `text-${color}-600`
                      }`} />
                    </div>
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 pb-6">
                    <div
                      className={`
                        p-4 rounded-lg
                        ${isLatest ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}
                      `}
                    >
                      {/* 단계 정보 */}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`
                              font-semibold text-sm
                              ${isLatest ? 'text-gray-900' : 'text-gray-700'}
                            `}>
                              {phaseLabel}
                            </span>
                            {isLatest && (
                              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
                                현재 단계
                              </span>
                            )}
                          </div>
                          {entry.reason && entry.reason !== '현재 단계' && (
                            <p className="mt-1 text-sm text-gray-600">
                              {entry.reason}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 메타 정보 */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(entry.timestamp)}</span>
                          <span>{formatTime(entry.timestamp)}</span>
                        </div>
                        {entry.changedBy && entry.changedBy !== 'system' && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{entry.changedBy}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 통계 요약 */}
      {fullHistory.length > 1 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">시작일</span>
              <p className="font-medium text-gray-900">
                {formatDate(fullHistory[fullHistory.length - 1].timestamp)}
              </p>
            </div>
            <div>
              <span className="text-gray-500">총 소요 기간</span>
              <p className="font-medium text-gray-900">
                {Math.floor(
                  (new Date().getTime() - new Date(fullHistory[fullHistory.length - 1].timestamp).getTime()) /
                  (1000 * 60 * 60 * 24)
                )}일
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export props type for external use
export type { PhaseHistoryDisplayProps, PhaseHistoryEntry };