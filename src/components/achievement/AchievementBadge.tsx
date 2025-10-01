/**
 * AchievementBadge Component
 *
 * 개별 성취 배지를 표시하는 컴포넌트
 * - 해제된 성취와 잠긴 성취 구분 표시
 * - 진행도 표시
 * - 호버 시 상세 정보 툴팁
 */

import React from 'react';
import type { AchievementProgress } from '../../types/achievement.types';
import { RARITY_THEMES } from '../../data/achievements';

interface AchievementBadgeProps {
  progress: AchievementProgress;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
  onClick?: () => void;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  progress,
  size = 'medium',
  showProgress = true,
  onClick
}) => {
  const { achievement, current, target, percentage, isUnlocked } = progress;
  const theme = RARITY_THEMES[achievement.rarity];

  // 크기별 클래스
  const sizeClasses = {
    small: 'w-12 h-12 text-lg',
    medium: 'w-16 h-16 text-2xl',
    large: 'w-20 h-20 text-3xl'
  };

  const progressSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  return (
    <div className="relative group">
      {/* 배지 컨테이너 */}
      <div
        className={`
          ${sizeClasses[size]}
          ${theme.bg} ${theme.border} ${theme.text}
          border-2 rounded-xl
          flex items-center justify-center
          transition-all duration-300
          ${isUnlocked ? `${theme.glow} shadow-lg` : 'opacity-60 grayscale'}
          ${onClick ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : ''}
          relative overflow-hidden
        `}
        onClick={onClick}
      >
        {/* 배경 그라데이션 (해제된 경우) */}
        {isUnlocked && (
          <div
            className={`
              absolute inset-0 opacity-20
              ${achievement.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-200 to-orange-200' :
                achievement.rarity === 'epic' ? 'bg-gradient-to-br from-purple-200 to-pink-200' :
                achievement.rarity === 'rare' ? 'bg-gradient-to-br from-blue-200 to-cyan-200' :
                achievement.rarity === 'uncommon' ? 'bg-gradient-to-br from-green-200 to-emerald-200' :
                'bg-gradient-to-br from-gray-200 to-gray-300'}
            `}
          />
        )}

        {/* 아이콘 */}
        <span className="relative z-10 filter drop-shadow-sm">
          {achievement.icon}
        </span>

        {/* 진행도 링 (해제되지 않은 경우) */}
        {!isUnlocked && showProgress && percentage > 0 && (
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeOpacity="0.2"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${percentage * 2.83} 283`}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
        )}

        {/* 잠금 표시 (진행도가 0인 경우) */}
        {!isUnlocked && percentage === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
            <span className="text-white/80 text-sm">🔒</span>
          </div>
        )}
      </div>

      {/* 진행도 텍스트 */}
      {!isUnlocked && showProgress && size !== 'small' && (
        <div className={`
          text-center mt-1 ${progressSizeClasses[size]} text-gray-600
        `}>
          {current}/{target}
        </div>
      )}

      {/* 툴팁 */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="bg-black text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap max-w-xs">
          <div className="font-semibold flex items-center gap-2">
            <span>{achievement.icon}</span>
            <span>{achievement.name}</span>
            {achievement.isSecret && !isUnlocked && (
              <span className="text-yellow-400">🤫</span>
            )}
          </div>

          <div className="text-gray-300 mt-1">
            {achievement.description}
          </div>

          {/* 진행도 정보 */}
          <div className="mt-2 text-gray-400">
            {isUnlocked ? (
              <span className="text-green-400">✅ 해제됨</span>
            ) : (
              <div>
                <div>진행도: {current}/{target} ({Math.round(percentage)}%)</div>
                {achievement.reward?.points && (
                  <div>보상: {achievement.reward.points} 포인트</div>
                )}
              </div>
            )}
          </div>

          {/* 희귀도 */}
          <div className={`
            mt-1 text-xs font-medium
            ${achievement.rarity === 'legendary' ? 'text-yellow-400' :
              achievement.rarity === 'epic' ? 'text-purple-400' :
              achievement.rarity === 'rare' ? 'text-blue-400' :
              achievement.rarity === 'uncommon' ? 'text-green-400' :
              'text-gray-400'}
          `}>
            {achievement.rarity.toUpperCase()}
          </div>

          {/* 화살표 */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black"></div>
        </div>
      </div>
    </div>
  );
};

export default AchievementBadge;