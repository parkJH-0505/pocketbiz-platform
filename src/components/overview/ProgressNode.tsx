import React from 'react';
import { CheckCircle, Circle, Clock, ChevronRight, Zap, Trophy } from 'lucide-react';
import type { ProjectPhase } from '../../types/buildup.types';
import type { FeedItem } from '../../types/timeline.types';
import { getNodeStyle } from '../../utils/verticalProgressCalculator';

interface ProgressNodeProps {
  phase: ProjectPhase;
  status: 'completed' | 'current' | 'upcoming';
  phaseInfo: {
    label: string;
    shortLabel: string;
    description: string;
    color: string;
    bgColor: string;
  };
  index: number;
  isLast: boolean;
  duration: number;
  meetingStats: {
    totalMeetings: number;
    completedMeetings: number;
    upcomingMeetings: number;
  };
  feeds?: FeedItem[];
  onGetConnectionPoint?: (point: { x: number; y: number }) => void;
  onClick?: () => void;
}

const ProgressNode: React.FC<ProgressNodeProps> = ({
  phase,
  status,
  phaseInfo,
  index,
  isLast,
  duration,
  meetingStats,
  feeds = [],
  onGetConnectionPoint,
  onClick
}) => {
  const nodeStyle = getNodeStyle(status);
  const nodeHeight = 140;
  const nodeSpacing = 100;
  const topOffset = index * (nodeHeight + nodeSpacing);

  // 브랜치 연결점 계산 및 등록
  const connectionPoint = {
    x: 64, // 노드 오른쪽 끝 (노드 너비 64px)
    y: topOffset + 32 // 노드 중앙 (노드 높이 64px의 절반)
  };

  // 연결점 정보를 부모에게 전달
  React.useEffect(() => {
    if (onGetConnectionPoint && feeds.length > 0) {
      onGetConnectionPoint(connectionPoint);
    }
  }, [onGetConnectionPoint, feeds.length, connectionPoint.x, connectionPoint.y]);

  // 아이콘 컴포넌트 결정
  const IconComponent = status === 'completed' ? CheckCircle :
                       status === 'current' ? Zap : Circle;

  return (
    <div
      className="absolute left-0 w-full group"
      style={{ top: `${topOffset}px` }}
    >
      <div className="flex items-center gap-6">
        {/* 노드 원 - 개선된 디자인 */}
        <div className="relative">
          {/* 배경 글로우 효과 (현재 단계만) */}
          {status === 'current' && (
            <div className="absolute inset-0 w-16 h-16 bg-blue-400 rounded-full blur-xl opacity-30 animate-pulse" />
          )}

          {/* 외부 링 (완료/현재 단계) */}
          {status !== 'upcoming' && (
            <div className={`absolute -inset-2 rounded-full border-2
              ${status === 'completed' ? 'border-emerald-200' : 'border-blue-200'}
              opacity-50`}
            />
          )}

          {/* 메인 노드 버튼 */}
          <button
            onClick={onClick}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center
              transition-all duration-500 transform-gpu
              ${status === 'completed'
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:shadow-emerald-300/50'
                : status === 'current'
                ? 'bg-gradient-to-br from-blue-400 to-indigo-600 shadow-lg shadow-blue-300/50 hover:shadow-xl hover:shadow-blue-400/50 animate-pulse'
                : 'bg-gradient-to-br from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 opacity-60'}
              hover:scale-110 hover:-translate-y-1 cursor-pointer
              before:absolute before:inset-0 before:rounded-full before:bg-white before:opacity-0
              hover:before:opacity-10 before:transition-opacity`}
          >
            <IconComponent
              className={`w-8 h-8 relative z-10
                ${status === 'completed' ? 'text-white drop-shadow-md' :
                  status === 'current' ? 'text-white drop-shadow-md' :
                  'text-gray-500'}`}
            />

            {/* 내부 하이라이트 */}
            <div className={`absolute inset-2 rounded-full bg-gradient-to-t from-transparent
              ${status === 'completed' ? 'to-emerald-300/20' :
                status === 'current' ? 'to-blue-300/20' :
                'to-gray-100/20'}`}
            />
          </button>

          {/* 브랜치 연결점 (개선된 디자인) */}
          <div className={`absolute top-1/2 left-full transform -translate-y-1/2
            transition-all duration-300 ${feeds.length > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <div className="relative ml-4">
              {/* 연결선 */}
              <div className={`w-8 h-0.5
                ${status === 'completed' ? 'bg-emerald-400' :
                  status === 'current' ? 'bg-blue-400' :
                  'bg-gray-300'}`}>
                {/* 연결점 */}
                <div className={`absolute -right-1.5 -top-1.5 w-3 h-3 rounded-full border-2 bg-white
                  ${status === 'completed' ? 'border-emerald-400' :
                    status === 'current' ? 'border-blue-400 animate-pulse' :
                    'border-gray-300'}`} />
              </div>

              {/* 피드 카운트 표시 */}
              {feeds.length > 0 && (
                <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs font-bold
                  flex items-center justify-center text-white
                  ${status === 'completed' ? 'bg-emerald-500' :
                    status === 'current' ? 'bg-blue-500' :
                    'bg-gray-400'}`}>
                  {feeds.length}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 단계 정보 - 개선된 타이포그래피 */}
        <div className={`flex-1 transition-all duration-300
          ${status === 'upcoming' ? 'opacity-50' : ''}
          ${status === 'current' ? 'transform scale-105' : ''}`}>
          <div className="flex items-center gap-3 mb-2">
            <h3 className={`font-bold text-base tracking-tight
              ${status === 'completed' ? 'text-emerald-700' :
                status === 'current' ? 'text-blue-700' :
                'text-gray-500'}`}>
              {phaseInfo.label}
            </h3>
            {status === 'current' && (
              <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-xs font-bold rounded-full animate-pulse shadow-sm">
                ⚡ 진행중
              </span>
            )}
            {status === 'completed' && (
              <span className="px-3 py-1 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 text-xs font-bold rounded-full shadow-sm">
                ✓ 완료
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mb-2">{phaseInfo.description}</p>

          {/* 추가 정보 영역 */}
          <div className="flex items-center gap-4 text-xs">
            {/* 기간 정보 */}
            <div className="flex items-center gap-1.5">
              {status === 'completed' ? (
                <>
                  <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium text-emerald-600">
                    {duration}일 완료
                  </span>
                </>
              ) : (
                <>
                  <Clock className={`w-3.5 h-3.5 ${status === 'current' ? 'text-blue-400' : 'text-gray-400'}`} />
                  <span className={`font-medium ${status === 'current' ? 'text-blue-600' : 'text-gray-500'}`}>
                    예상: {duration}일
                  </span>
                </>
              )}
            </div>

            {/* 미팅 통계 */}
            {meetingStats.totalMeetings > 0 && (
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${
                  status === 'completed' ? 'bg-emerald-400' :
                  status === 'current' ? 'bg-blue-400' : 'bg-gray-300'
                }`} />
                <span className={`font-medium ${
                  status === 'completed' ? 'text-emerald-600' :
                  status === 'current' ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  미팅 {meetingStats.completedMeetings}/{meetingStats.totalMeetings}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 화살표 (호버 시 표시) - 개선된 디자인 */}
        <div className="relative">
          <ChevronRight className={`w-5 h-5 transition-all duration-300 transform
            ${status === 'completed' ? 'text-emerald-400' :
              status === 'current' ? 'text-blue-400' :
              'text-gray-300'}
            opacity-0 group-hover:opacity-100 group-hover:translate-x-1`} />
        </div>
      </div>
    </div>
  );
};

export default ProgressNode;