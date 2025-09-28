import React from 'react';
import { Calendar, TrendingUp, Zap, Target } from 'lucide-react';
import type { ProjectPhase } from '../../types/buildup.types';
import { PHASE_INFO } from '../../utils/projectPhaseUtils';

interface ProgressSummaryProps {
  progress: number;
  dDay: number;
  estimatedEndDate: Date;
  currentPhase: ProjectPhase;
  dDayToNextMeeting?: number | null;
}

const ProgressSummary: React.FC<ProgressSummaryProps> = ({
  progress,
  dDay,
  estimatedEndDate,
  currentPhase,
  dDayToNextMeeting
}) => {
  const phaseInfo = PHASE_INFO[currentPhase];
  const radius = 52; // 더 큰 반지름
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // D-Day 긴급도에 따른 색상
  const getDDayColor = () => {
    if (dDay <= 3) return 'text-red-600 bg-red-50';
    if (dDay <= 7) return 'text-orange-600 bg-orange-50';
    if (dDay <= 14) return 'text-yellow-600 bg-yellow-50';
    return 'text-blue-600 bg-blue-50';
  };

  return (
    <div className="flex flex-col items-center">
      {/* 원형 프로그레스 - 개선된 디자인 */}
      <div className="relative w-36 h-36 mb-6">
        {/* 배경 글로우 효과 */}
        <div className={`absolute inset-0 rounded-full blur-2xl opacity-20
          ${progress >= 70 ? 'bg-emerald-400' : 'bg-blue-400'}`} />

        <svg className="transform -rotate-90 w-36 h-36 relative">
          <defs>
            {/* 그라데이션 정의 */}
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>

            {/* 완료 그라데이션 */}
            <linearGradient id="completeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            {/* 그림자 필터 */}
            <filter id="progressShadow">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodOpacity="0.3" floodColor="#60a5fa" />
            </filter>
          </defs>

          {/* 외부 트랙 링 */}
          <circle
            cx="72"
            cy="72"
            r={radius + 4}
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            className="text-gray-200"
          />

          {/* 배경 원 */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            fill="none"
            className="text-gray-200"
          />

          {/* 진행률 원 - 그라데이션 적용 */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke={progress >= 70 ? "url(#completeGradient)" : "url(#progressGradient)"}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1500 ease-out"
            strokeLinecap="round"
            filter="url(#progressShadow)"
          />

          {/* 진행률 끝 포인트 */}
          <circle
            cx="72"
            cy={72 - radius}
            r="6"
            fill="white"
            className="transition-all duration-1500"
            style={{
              transform: `rotate(${(progress / 100) * 360}deg)`,
              transformOrigin: '72px 72px'
            }}
          />
        </svg>

        {/* 중앙 텍스트 - 개선된 레이아웃 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="relative">
            <span className="text-3xl font-black bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {Math.round(progress)}%
            </span>
            {progress >= 70 && (
              <Zap className="absolute -right-4 -top-2 w-4 h-4 text-yellow-500 animate-pulse" />
            )}
          </div>
          <span className="text-xs text-gray-500 font-medium mt-1">전체 진행률</span>
        </div>
      </div>

      {/* 현재 단계 - 개선된 배지 */}
      <div className="text-center mb-4">
        <div className={`inline-flex items-center px-4 py-2 rounded-full shadow-sm
          bg-gradient-to-r ${currentPhase === 'execution' ? 'from-blue-500 to-indigo-600' :
                             currentPhase.includes('completed') ? 'from-emerald-500 to-green-600' :
                             'from-gray-400 to-gray-600'}
          text-white text-sm font-bold`}>
          <TrendingUp className="w-4 h-4 mr-2" />
          {phaseInfo.label} 단계
        </div>
      </div>

      {/* D-Day 정보 - 강조된 디자인 */}
      <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${getDDayColor()} mb-2`}>
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4" />
          <span className="text-sm font-medium">
            목표일까지
          </span>
        </div>
        <span className="text-lg font-black">
          D-{dDay}
        </span>
      </div>

      {/* 다음 미팅 정보 */}
      {dDayToNextMeeting !== null && dDayToNextMeeting !== undefined && (
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 mb-2">
          <Zap className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">
            다음 미팅: D-{dDayToNextMeeting}
          </span>
        </div>
      )}

      {/* 예상 완료일 */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Calendar className="w-3 h-3" />
        <span>
          {estimatedEndDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short'
          })}
        </span>
      </div>
    </div>
  );
};

export default ProgressSummary;