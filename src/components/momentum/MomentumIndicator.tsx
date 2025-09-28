import React, { useState, useEffect, useRef } from 'react';
import { MomentumEngine, MomentumData } from '../../services/momentumEngine';
import { useCelebration } from '../../contexts/CelebrationContext';

interface TrendIconProps {
  trend: 'up' | 'down' | 'stable';
  velocity: number;
}

const TrendIcon: React.FC<TrendIconProps> = ({ trend, velocity }) => {
  const icons = {
    up: '↗️',
    down: '↘️',
    stable: '→'
  };

  const colors = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-gray-600'
  };

  return (
    <span className={`${colors[trend]} font-semibold`} title={`변화 속도: ${velocity}`}>
      {icons[trend]}
    </span>
  );
};

interface MomentumIndicatorProps {
  className?: string;
}

const MomentumIndicator: React.FC<MomentumIndicatorProps> = ({
  className = ""
}) => {
  const [momentum, setMomentum] = useState<MomentumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevScoreRef = useRef<number | null>(null);

  const momentumEngine = new MomentumEngine();
  const { celebrateMomentum } = useCelebration();

  // 모멘텀 데이터 로드
  const loadMomentum = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await momentumEngine.calculateBasicMomentum();
      setMomentum(data);

      // 모멘텀 높음 축하 (80점 이상)
      if (data.score >= 80 && (!prevScoreRef.current || prevScoreRef.current < 80)) {
        celebrateMomentum(data.score);
      }

      // 이전 점수 저장
      prevScoreRef.current = data.score;
      momentumEngine.savePreviousScore(data.score);
    } catch (err) {
      console.error('Failed to load momentum:', err);
      setError('모멘텀 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드 및 주기적 업데이트
  useEffect(() => {
    loadMomentum();

    // 5분마다 자동 업데이트
    const interval = setInterval(loadMomentum, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 로딩 상태
  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-16 h-2 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  // 에러 상태
  if (error || !momentum) {
    return (
      <div className={`flex items-center space-x-2 text-gray-400 ${className}`}>
        <div className="w-16 h-2 bg-gray-200 rounded-full"></div>
        <span className="text-xs">--</span>
      </div>
    );
  }

  // 점수별 색상 결정
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreTextColor = (score: number): string => {
    if (score >= 80) return 'text-green-700';
    if (score >= 60) return 'text-blue-700';
    if (score >= 40) return 'text-yellow-700';
    return 'text-red-700';
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* 진행바 + 숫자 표시 */}
      <div className="flex items-center space-x-2">
        <div className="w-20 h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getScoreColor(momentum.score)} rounded-full transition-all duration-700 ease-out`}
            style={{ width: `${momentum.score}%` }}
          />
        </div>
        <span className={`text-sm font-bold min-w-[2rem] ${getScoreTextColor(momentum.score)}`}>
          {momentum.score}
        </span>
      </div>

      {/* 트렌드 아이콘 */}
      <TrendIcon trend={momentum.trend} velocity={momentum.velocity} />

      {/* 모멘텀 라벨 */}
      <div className="hidden sm:block">
        <span className="text-xs text-gray-500 font-medium">
          Momentum
        </span>
      </div>

      {/* 툴팁 인사이트 (호버 시 표시) */}
      <div className="relative group">
        <button
          className="w-4 h-4 rounded-full bg-gray-300 text-gray-600 text-xs flex items-center justify-center hover:bg-gray-400 transition-colors"
          title="모멘텀 인사이트"
        >
          ?
        </button>

        {/* 툴팁 */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          <div className="bg-black text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap max-w-xs">
            <div className="space-y-1">
              {momentum.insights.map((insight, index) => (
                <div key={index}>{insight}</div>
              ))}
            </div>
            <div className="text-gray-300 mt-1 text-[10px]">
              마지막 업데이트: {momentum.lastUpdated.toLocaleTimeString()}
            </div>
            {/* 화살표 */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MomentumIndicator;