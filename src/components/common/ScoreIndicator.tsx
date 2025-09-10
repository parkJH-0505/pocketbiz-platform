import React from 'react';

interface ScoreIndicatorProps {
  score: number;
  showLabel?: boolean;
  showBar?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ScoreIndicator: React.FC<ScoreIndicatorProps> = ({ 
  score, 
  showLabel = true,
  showBar = true,
  size = 'md' 
}) => {
  // 점수 구간별 설정
  const getScoreRange = (score: number) => {
    if (score <= 20) return {
      label: '매우 미흡',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      barColor: 'bg-red-500',
      borderColor: 'border-red-200'
    };
    if (score <= 40) return {
      label: '미흡',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      barColor: 'bg-orange-500',
      borderColor: 'border-orange-200'
    };
    if (score <= 60) return {
      label: '보통',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      barColor: 'bg-yellow-500',
      borderColor: 'border-yellow-200'
    };
    if (score <= 80) return {
      label: '양호',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      barColor: 'bg-green-500',
      borderColor: 'border-green-200'
    };
    return {
      label: '우수',
      color: 'text-primary-main',
      bgColor: 'bg-primary-light bg-opacity-20',
      barColor: 'bg-primary-main',
      borderColor: 'border-primary-main'
    };
  };

  const range = getScoreRange(score);
  
  const sizeClasses = {
    sm: {
      text: 'text-xs',
      score: 'text-sm',
      padding: 'px-2 py-1',
      barHeight: 'h-1',
      gap: 'gap-1'
    },
    md: {
      text: 'text-sm',
      score: 'text-base',
      padding: 'px-3 py-1.5',
      barHeight: 'h-1.5',
      gap: 'gap-2'
    },
    lg: {
      text: 'text-base',
      score: 'text-lg',
      padding: 'px-4 py-2',
      barHeight: 'h-2',
      gap: 'gap-2'
    }
  };

  const sizeClass = sizeClasses[size];

  return (
    <div className={`flex items-center ${sizeClass.gap}`}>
      {/* 점수 표시 */}
      <div className={`flex items-center ${sizeClass.gap}`}>
        <span className={`${sizeClass.score} font-bold ${range.color}`}>
          {score}점
        </span>
        
        {/* 라벨 표시 */}
        {showLabel && (
          <span className={`${sizeClass.text} ${sizeClass.padding} ${range.bgColor} ${range.color} rounded-full font-medium`}>
            {range.label}
          </span>
        )}
      </div>

      {/* 프로그레스 바 */}
      {showBar && (
        <div className="flex-1 max-w-[100px]">
          <div className={`w-full bg-gray-200 rounded-full ${sizeClass.barHeight} overflow-hidden`}>
            <div 
              className={`${sizeClass.barHeight} ${range.barColor} rounded-full transition-all duration-300`}
              style={{ width: `${Math.min(score, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};