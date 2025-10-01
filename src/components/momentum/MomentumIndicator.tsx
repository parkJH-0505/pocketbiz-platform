import React, { useRef } from 'react';
import { useMomentum } from '../../hooks/useMomentum';
import type { RealMomentumData } from '../../services/momentumEngine';
import { useCelebration } from '../../contexts/CelebrationContext';
import { RefreshCw, TrendingUp, TrendingDown, Minus, Activity, AlertCircle } from 'lucide-react';

interface TrendIconProps {
  trend: 'rising' | 'falling' | 'stable';
}

const TrendIcon: React.FC<TrendIconProps> = ({ trend }) => {
  const icons = {
    rising: TrendingUp,
    falling: TrendingDown,
    stable: Minus
  };

  const colors = {
    rising: 'text-green-600',
    falling: 'text-red-600',
    stable: 'text-gray-600'
  };

  const IconComponent = icons[trend];

  return (
    <IconComponent
      className={`w-4 h-4 ${colors[trend]}`}
      title={`트렌드: ${trend === 'rising' ? '상승' : trend === 'falling' ? '하락' : '안정'}`}
    />
  );
};

interface MomentumIndicatorProps {
  className?: string;
  showDetails?: boolean;
  onScoreChange?: (score: number) => void;
}

const MomentumIndicator: React.FC<MomentumIndicatorProps> = ({
  className = "",
  showDetails = true,
  onScoreChange
}) => {
  const { momentum, loading, error, refresh, refreshRealData, isStale } = useMomentum();
  const prevScoreRef = useRef<number | null>(null);
  const { celebrateMomentum } = useCelebration();

  // 축하 시스템 연동
  React.useEffect(() => {
    if (momentum && momentum.score !== prevScoreRef.current) {
      // 모멘텀 높음 축하 (80점 이상)
      if (momentum.score >= 80 && (!prevScoreRef.current || prevScoreRef.current < 80)) {
        celebrateMomentum(momentum.score);
      }

      // 스코어 변화 콜백
      if (onScoreChange) {
        onScoreChange(momentum.score);
      }

      prevScoreRef.current = momentum.score;
    }
  }, [momentum, onScoreChange, celebrateMomentum]);

  // 로딩 상태
  if (loading) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-20 h-2.5 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
        {showDetails && (
          <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
        )}
      </div>
    );
  }

  // 에러 상태
  if (error || !momentum) {
    return (
      <div className={`flex items-center space-x-3 text-gray-400 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-20 h-2.5 bg-gray-200 rounded-full"></div>
          <span className="text-sm font-bold">--</span>
        </div>
        <AlertCircle className="w-4 h-4 text-red-400" />
        {showDetails && (
          <span className="text-xs">모멘텀 로드 실패</span>
        )}
        <button
          onClick={refresh}
          className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
          title="새로고침"
        >
          <RefreshCw className="w-3 h-3" />
          재시도
        </button>
      </div>
    );
  }

  // 점수별 색상 결정 (전문가급 그라데이션)
  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'bg-gradient-to-r from-green-500 to-emerald-600';
    if (score >= 80) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 60) return 'bg-cyan-500';
    if (score >= 50) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreTextColor = (score: number): string => {
    if (score >= 90) return 'text-green-800';
    if (score >= 80) return 'text-green-700';
    if (score >= 70) return 'text-blue-700';
    if (score >= 60) return 'text-cyan-700';
    if (score >= 50) return 'text-yellow-700';
    if (score >= 40) return 'text-orange-700';
    return 'text-red-700';
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* 메인 스코어 표시 */}
      <div className="flex items-center space-x-2">
        <div className="relative w-20 h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getScoreColor(momentum.score)} rounded-full transition-all duration-700 ease-out`}
            style={{ width: `${momentum.score}%` }}
          />
          {/* Stale 상태 표시 */}
          {isStale && (
            <div className="absolute inset-0 bg-gray-300 opacity-50 rounded-full"></div>
          )}
        </div>
        <span className={`text-sm font-bold min-w-[2rem] ${getScoreTextColor(momentum.score)} ${isStale ? 'opacity-60' : ''}`}>
          {momentum.score}
        </span>
      </div>

      {/* 트렌드 아이콘 */}
      <TrendIcon trend={momentum.trend} />

      {/* 모멘텀 라벨 및 상태 */}
      {showDetails && (
        <div className="hidden sm:flex items-center space-x-2">
          <span className="text-xs text-gray-500 font-medium">
            Momentum
          </span>
          {isStale && (
            <span className="text-[10px] text-orange-500 font-medium">
              (업데이트 필요)
            </span>
          )}
        </div>
      )}

      {/* 새로고침 버튼 */}
      <button
        onClick={refreshRealData}
        className={`p-1 rounded hover:bg-gray-100 transition-colors ${isStale ? 'text-orange-500' : 'text-gray-400'}`}
        title="실제 데이터로 새로고침"
      >
        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
      </button>

      {/* 상세 인사이트 툴팁 */}
      {showDetails && (
        <div className="relative group">
          <button
            className="p-1 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
            title="상세 인사이트 보기"
          >
            <Activity className="w-3 h-3" />
          </button>

          {/* 인사이트 툴팁 */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="bg-gray-900 text-white text-xs rounded-lg px-4 py-3 whitespace-nowrap max-w-sm">
              {/* 메인 인사이트 */}
              <div className="font-medium text-blue-300 mb-2">
                {momentum.insights.message}
              </div>

              {/* 실행 가능한 조언 */}
              {momentum.insights.actionable && (
                <div className="text-gray-300 mb-2">
                  💡 {momentum.insights.actionable}
                </div>
              )}

              {/* 요소별 점수 */}
              <div className="space-y-1 text-[10px] text-gray-400">
                <div>활동도: {momentum.factors.activity}%</div>
                <div>성장률: {momentum.factors.growth}%</div>
                <div>일관성: {momentum.factors.consistency}%</div>
                <div>성과: {momentum.factors.performance}%</div>
              </div>

              {/* 업데이트 시간 */}
              <div className="text-gray-500 mt-2 text-[10px] border-t border-gray-700 pt-1">
                업데이트: {momentum.lastCalculated.toLocaleTimeString()}
                {isStale && <span className="text-orange-400 ml-1">(만료됨)</span>}
              </div>

              {/* 화살표 */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MomentumIndicator;