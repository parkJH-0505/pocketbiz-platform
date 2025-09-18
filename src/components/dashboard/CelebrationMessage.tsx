/**
 * Celebration Message Component
 *
 * 사용자의 성취와 발전을 축하하는 메시지 컴포넌트
 * - 다양한 축하 유형 (성취, 개선, 마일스톤, 격려)
 * - 애니메이션 효과와 시각적 피드백
 * - 개인화된 메시지와 행동 유도
 * - "매일 만나고 싶은 성장 동반자" 철학 구현
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  Target,
  Heart,
  ArrowRight,
  Gift,
  Trophy,
  Star
} from 'lucide-react';
import type { CelebrationMessage as CelebrationMessageType } from '../../types/dashboard';

interface CelebrationMessageProps {
  celebration: CelebrationMessageType;
  className?: string;
}

const CelebrationMessage: React.FC<CelebrationMessageProps> = ({
  celebration,
  className = ''
}) => {
  // 축하 유형별 색상 및 스타일 매핑
  const celebrationStyles = {
    achievement: {
      bg: 'from-emerald-50 to-green-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      accent: 'text-emerald-600',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600'
    },
    improvement: {
      bg: 'from-blue-50 to-indigo-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      accent: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    milestone: {
      bg: 'from-purple-50 to-violet-50',
      border: 'border-purple-200',
      text: 'text-purple-800',
      accent: 'text-purple-600',
      button: 'bg-purple-600 hover:bg-purple-700 text-white',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    encouragement: {
      bg: 'from-orange-50 to-amber-50',
      border: 'border-orange-200',
      text: 'text-orange-800',
      accent: 'text-orange-600',
      button: 'bg-orange-600 hover:bg-orange-700 text-white',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600'
    }
  };

  // 축하 유형별 아이콘 매핑
  const celebrationIcons = {
    achievement: Trophy,
    improvement: TrendingUp,
    milestone: Target,
    encouragement: Heart
  };

  const styles = celebrationStyles[celebration.type];
  const IconComponent = celebrationIcons[celebration.type];

  return (
    <motion.div
      className={`bg-gradient-to-r ${styles.bg} ${styles.border} border rounded-xl p-6 overflow-hidden relative ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* 배경 장식 효과 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 반짝임 효과 */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + i * 12}%`,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          >
            <Sparkles className={`w-3 h-3 ${styles.accent} opacity-30`} />
          </motion.div>
        ))}
      </div>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10">
        {/* 헤더 */}
        <div className="flex items-center space-x-4 mb-4">
          {/* 아이콘과 이모지 */}
          <div className="flex items-center space-x-3">
            <motion.div
              className={`p-3 ${styles.iconBg} rounded-full`}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <IconComponent className={`w-6 h-6 ${styles.iconColor}`} />
            </motion.div>

            <motion.div
              className="text-4xl"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
            >
              {celebration.icon}
            </motion.div>
          </div>

          {/* 제목 */}
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className={`text-xl font-bold ${styles.text} mb-1`}>
              {celebration.title}
            </h3>
          </motion.div>
        </div>

        {/* 메시지 */}
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className={`${styles.text} text-base leading-relaxed mb-2`}>
            {celebration.message}
          </p>

          {celebration.subMessage && (
            <motion.p
              className={`${styles.accent} text-sm leading-relaxed`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {celebration.subMessage}
            </motion.p>
          )}
        </motion.div>

        {/* 액션 버튼 */}
        {celebration.action && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              className={`inline-flex items-center space-x-2 px-6 py-3 ${styles.button} rounded-lg font-medium transition-all duration-200 shadow-sm`}
              whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (celebration.action?.url) {
                  window.location.href = celebration.action.url;
                }
              }}
            >
              <span>{celebration.action.text}</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}

        {/* 축하 요소들 */}
        <motion.div
          className="mt-6 flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <div className="flex items-center space-x-2">
            <Gift className={`w-4 h-4 ${styles.accent}`} />
            <span className={`text-sm ${styles.accent} font-medium`}>
              계속해서 성장해나가는 여러분이 자랑스러워요!
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1 + i * 0.1, type: "spring" }}
              >
                <Star className={`w-4 h-4 ${styles.accent} fill-current`} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 플로팅 애니메이션 요소 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {celebration.type === 'achievement' && (
          <motion.div
            className="absolute top-4 right-4"
            animate={{
              y: [0, -10, 0],
              rotate: [0, 5, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Trophy className={`w-8 h-8 ${styles.accent} opacity-20`} />
          </motion.div>
        )}

        {celebration.type === 'improvement' && (
          <motion.div
            className="absolute bottom-4 right-4"
            animate={{
              x: [0, 5, 0],
              y: [0, -5, 0]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <TrendingUp className={`w-8 h-8 ${styles.accent} opacity-20`} />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default CelebrationMessage;