/**
 * Growth Level Display Component
 *
 * 사용자의 현재 성장 레벨을 시각적으로 표시하는 컴포넌트
 * - 레벨 아이콘과 이름 (새싹 단계, 성장기, 발전기 등)
 * - 현재 점수와 진행도 바
 * - 다음 레벨까지 필요한 점수 및 예상 시간
 * - "매일 만나고 싶은 성장 동반자" 철학 반영
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Star, Target } from 'lucide-react';
import type { GrowthLevel } from '../../types/dashboard';

interface GrowthLevelDisplayProps {
  level: GrowthLevel;
  className?: string;
}

const GrowthLevelDisplay: React.FC<GrowthLevelDisplayProps> = ({
  level,
  className = ''
}) => {
  const { current, score, progress, next } = level;

  // 레벨별 색상 매핑
  const levelColors = {
    emerald: {
      bg: 'from-emerald-50 to-green-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      accent: 'text-emerald-600',
      progress: 'bg-emerald-500',
      progressBg: 'bg-emerald-100'
    },
    blue: {
      bg: 'from-blue-50 to-indigo-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      accent: 'text-blue-600',
      progress: 'bg-blue-500',
      progressBg: 'bg-blue-100'
    },
    purple: {
      bg: 'from-purple-50 to-violet-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      accent: 'text-purple-600',
      progress: 'bg-purple-500',
      progressBg: 'bg-purple-100'
    },
    orange: {
      bg: 'from-orange-50 to-amber-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      accent: 'text-orange-600',
      progress: 'bg-orange-500',
      progressBg: 'bg-orange-100'
    }
  };

  const colors = levelColors[current.color as keyof typeof levelColors] || levelColors.emerald;

  return (
    <motion.div
      className={`bg-gradient-to-r ${colors.bg} ${colors.border} border rounded-xl p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 레벨 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <motion.div
            className="text-3xl"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            {current.icon}
          </motion.div>
          <div>
            <h2 className={`text-xl font-bold ${colors.text}`}>
              {current.name}
            </h2>
            <p className={`text-sm ${colors.accent}`}>
              {current.description}
            </p>
          </div>
        </div>

        <motion.div
          className={`flex items-center space-x-1 ${colors.accent}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Star className="w-4 h-4" />
          <span className="font-semibold text-lg">{score.toFixed(1)}</span>
        </motion.div>
      </div>

      {/* 현재 레벨 진행도 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className={`text-sm font-medium ${colors.text}`}>
            현재 레벨 진행도
          </span>
          <span className={`text-sm ${colors.accent} font-semibold`}>
            {progress.percentage}%
          </span>
        </div>

        <div className={`w-full ${colors.progressBg} rounded-full h-3 overflow-hidden`}>
          <motion.div
            className={`h-full ${colors.progress} rounded-full relative`}
            initial={{ width: 0 }}
            animate={{ width: `${progress.percentage}%` }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          >
            {/* 진행도 바 반짝임 효과 */}
            <motion.div
              className="absolute inset-0 bg-white opacity-20"
              animate={{ x: ['0%', '100%'] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.5
              }}
              style={{ clipPath: 'polygon(0 0, 20px 0, 30px 100%, 0 100%)' }}
            />
          </motion.div>
        </div>

        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>{progress.current} / {progress.total}</span>
          <span>+{(progress.total - progress.current).toFixed(1)} 남음</span>
        </div>
      </div>

      {/* 다음 레벨 정보 */}
      <motion.div
        className={`bg-white bg-opacity-60 rounded-lg p-4 ${colors.border} border`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className={`w-4 h-4 ${colors.accent}`} />
            <span className={`text-sm font-medium ${colors.text}`}>
              다음 레벨: {next.name}
            </span>
          </div>
          <span className={`text-xs ${colors.accent} font-medium`}>
            {next.estimatedTimeToReach}
          </span>
        </div>

        <div className="flex items-center space-x-3 mt-2">
          <Target className={`w-4 h-4 ${colors.accent}`} />
          <div className="flex-1">
            <div className="flex justify-between text-sm">
              <span className={colors.text}>
                <span className="font-semibold">{next.pointsNeeded.toFixed(1)}점</span> 더 필요
              </span>
              <span className={`${colors.accent} font-medium`}>
                목표: {next.requiredScore}점
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 격려 메시지 */}
      <motion.div
        className="mt-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p className={`text-sm ${colors.accent} font-medium`}>
          {progress.percentage >= 80
            ? "곧 다음 레벨이에요! 조금만 더 화이팅! 💪"
            : progress.percentage >= 50
            ? "절반을 넘어섰어요! 꾸준히 가고 있어요 ✨"
            : "천천히 하나씩, 함께 성장해나가요 🌱"
          }
        </p>
      </motion.div>
    </motion.div>
  );
};

export default GrowthLevelDisplay;