/**
 * MicroCelebration Component
 *
 * 작은 성취와 진전을 즉시 축하하는 마이크로 인터랙션 컴포넌트
 * - 기존 CelebrationMessage를 확장
 * - Toast 시스템과 통합
 * - Confetti 효과 포함
 * - 감정적 연결 강화
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Trophy,
  TrendingUp,
  Target,
  Heart,
  Star,
  Zap,
  Flame,
  Gift
} from 'lucide-react';
import { celebrationTrigger, CelebrationConfig, CelebrationLevel } from '../../services/celebrationTrigger';

interface MicroCelebrationProps {
  config: CelebrationConfig;
  onComplete?: () => void;
  className?: string;
}

const MicroCelebration: React.FC<MicroCelebrationProps> = ({
  config,
  onComplete,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // 아이콘 매핑
  const getIcon = () => {
    const iconMap = {
      kpi_increase: TrendingUp,
      project_milestone: Target,
      streak_achievement: Flame,
      first_action: Star,
      momentum_high: Zap,
      weekly_goal: Trophy,
      badge_earned: Gift,
      level_up: Heart
    };
    return iconMap[config.reason] || Sparkles;
  };

  // 레벨별 스타일
  const getLevelStyles = () => {
    const styles = {
      micro: {
        size: 'w-64',
        padding: 'p-3',
        iconSize: 'w-5 h-5',
        textSize: 'text-sm',
        duration: 2000,
        position: 'bottom-8 right-8'
      },
      small: {
        size: 'w-72',
        padding: 'p-4',
        iconSize: 'w-6 h-6',
        textSize: 'text-base',
        duration: 3000,
        position: 'bottom-8 right-8'
      },
      medium: {
        size: 'w-80',
        padding: 'p-5',
        iconSize: 'w-7 h-7',
        textSize: 'text-base',
        duration: 4000,
        position: 'bottom-12 right-12'
      },
      large: {
        size: 'w-96',
        padding: 'p-6',
        iconSize: 'w-8 h-8',
        textSize: 'text-lg',
        duration: 5000,
        position: 'bottom-1/2 right-1/2 transform translate-x-1/2 translate-y-1/2'
      },
      epic: {
        size: 'w-[32rem]',
        padding: 'p-8',
        iconSize: 'w-10 h-10',
        textSize: 'text-xl',
        duration: 6000,
        position: 'bottom-1/2 right-1/2 transform translate-x-1/2 translate-y-1/2'
      }
    };
    return styles[config.level];
  };

  const Icon = getIcon();
  const levelStyles = getLevelStyles();

  useEffect(() => {
    // Confetti 트리거
    if (config.confetti !== false) {
      celebrationTrigger.trigger(config);
    }

    // 자동 숨김 타이머
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete?.();
      }, 300);
    }, levelStyles.duration);

    return () => clearTimeout(hideTimer);
  }, [config, levelStyles.duration, onComplete]);

  // 배경 색상 (레벨별)
  const getBgGradient = () => {
    const gradients = {
      micro: 'from-blue-50 to-indigo-50',
      small: 'from-green-50 to-emerald-50',
      medium: 'from-purple-50 to-pink-50',
      large: 'from-yellow-50 to-orange-50',
      epic: 'from-gradient-to-r from-purple-400 via-pink-400 to-red-400'
    };
    return gradients[config.level];
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed ${levelStyles.position} ${levelStyles.size} z-50 ${className}`}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20
          }}
        >
          <div className={`
            bg-gradient-to-r ${getBgGradient()}
            ${levelStyles.padding}
            rounded-2xl shadow-xl
            border border-white/50
            backdrop-blur-sm
            relative overflow-hidden
          `}>
            {/* 배경 애니메이션 */}
            <div className="absolute inset-0 overflow-hidden">
              {config.level !== 'micro' && [...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute opacity-20"
                  initial={{
                    x: Math.random() * 100,
                    y: Math.random() * 100
                  }}
                  animate={{
                    x: [null, Math.random() * 200 - 100],
                    y: [null, Math.random() * 200 - 100],
                    rotate: [0, 360]
                  }}
                  transition={{
                    duration: 3 + i,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                >
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                </motion.div>
              ))}
            </div>

            {/* 콘텐츠 */}
            <div className="relative z-10 flex items-center space-x-3">
              {/* 아이콘 */}
              <motion.div
                className={`
                  flex-shrink-0
                  ${config.level === 'epic' ? 'p-4' : 'p-3'}
                  bg-white/80 rounded-full
                `}
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  delay: 0.1
                }}
              >
                <Icon className={`${levelStyles.iconSize} text-indigo-600`} />
              </motion.div>

              {/* 텍스트 */}
              <div className="flex-1 min-w-0">
                {config.emoji && (
                  <motion.span
                    className="text-2xl inline-block mr-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ delay: 0.2 }}
                  >
                    {config.emoji}
                  </motion.span>
                )}

                <motion.h3
                  className={`${levelStyles.textSize} font-bold text-gray-800 mb-1`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {config.title}
                </motion.h3>

                <motion.p
                  className={`
                    ${config.level === 'micro' ? 'text-xs' : 'text-sm'}
                    text-gray-600
                  `}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {config.message}
                </motion.p>
              </div>

              {/* 닫기 버튼 (medium 이상) */}
              {(config.level === 'medium' || config.level === 'large' || config.level === 'epic') && (
                <button
                  onClick={() => setIsVisible(false)}
                  className="absolute top-2 right-2 p-1 hover:bg-black/5 rounded-full transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* 진행바 (시간 표시) */}
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-indigo-400 to-purple-400"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{
                duration: levelStyles.duration / 1000,
                ease: 'linear'
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MicroCelebration;