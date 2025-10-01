/**
 * LevelDisplay Component
 *
 * 사용자 레벨과 XP를 표시하는 컴포넌트
 * - 레벨 진행도
 * - XP 획득 애니메이션
 * - 레벨업 효과
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Award, Zap, Star } from 'lucide-react';
import { levelSystemEngine } from '../../services/levelSystemEngine';
import type { UserLevel, XPSource } from '../../types/gamification.types';

interface LevelDisplayProps {
  className?: string;
  compact?: boolean;
  showHistory?: boolean;
}

const LevelDisplay: React.FC<LevelDisplayProps> = ({
  className = "",
  compact = false,
  showHistory = false
}) => {
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [xpHistory, setXpHistory] = useState<XPSource[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showXPGain, setShowXPGain] = useState<{ amount: number; id: string } | null>(null);
  const [dailyBonusClaimed, setDailyBonusClaimed] = useState(false);

  // 데이터 로드
  useEffect(() => {
    const loadData = () => {
      const level = levelSystemEngine.getUserLevel();
      const history = levelSystemEngine.getXPHistory(7);
      const levelStats = levelSystemEngine.getLevelStats();

      setUserLevel(level);
      setXpHistory(history);
      setStats(levelStats);

      // 일일 보너스 상태 체크
      const lastClaim = localStorage.getItem('last-daily-xp-claim');
      const today = new Date().toDateString();
      setDailyBonusClaimed(lastClaim === today);
    };

    loadData();
    // 30초마다 업데이트
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 일일 보너스 받기
  const claimDailyBonus = async () => {
    try {
      const xp = await levelSystemEngine.claimDailyBonus();
      setShowXPGain({ amount: xp, id: `xp_${Date.now()}` });
      setDailyBonusClaimed(true);

      // 데이터 새로고침
      setUserLevel(levelSystemEngine.getUserLevel());
      setXpHistory(levelSystemEngine.getXPHistory(7));

      // 3초 후 애니메이션 숨김
      setTimeout(() => setShowXPGain(null), 3000);
    } catch (error) {
      console.error('Failed to claim daily bonus:', error);
    }
  };

  // 레벨 색상
  const getLevelColor = (level: number) => {
    if (level >= 40) return 'from-purple-500 to-pink-500';
    if (level >= 30) return 'from-yellow-400 to-orange-500';
    if (level >= 20) return 'from-blue-500 to-purple-500';
    if (level >= 10) return 'from-green-500 to-blue-500';
    if (level >= 5) return 'from-gray-500 to-green-500';
    return 'from-gray-400 to-gray-500';
  };

  // XP 소스 아이콘
  const getXPSourceIcon = (source: string) => {
    const icons: Record<string, string> = {
      achievement: '🏆',
      daily_login: '📅',
      momentum_high: '🚀',
      task_complete: '✅',
      milestone: '🎯',
      challenge: '⚔️',
      special_event: '🎉'
    };
    return icons[source] || '✨';
  };

  if (!userLevel) {
    return (
      <div className={`bg-white rounded-xl border shadow-sm p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-2 w-1/3"></div>
          <div className="h-4 bg-gray-100 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (compact) {
    // 컴팩트 뷰
    return (
      <div className={`bg-white rounded-lg border p-3 ${className}`}>
        <div className="flex items-center gap-3">
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center
            bg-gradient-to-br ${getLevelColor(userLevel.level)} text-white font-bold
          `}>
            {userLevel.level}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-800">
              {userLevel.title}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${userLevel.progressPercentage}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-xs text-gray-500">
                {Math.round(userLevel.progressPercentage)}%
              </span>
            </div>
          </div>
        </div>

        {/* XP 획득 애니메이션 */}
        <AnimatePresence>
          {showXPGain && (
            <motion.div
              key={showXPGain.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute -top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold"
            >
              +{showXPGain.amount} XP
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border shadow-sm ${className}`}>
      {/* 헤더 */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* 레벨 원 */}
            <div className={`
              w-20 h-20 rounded-full flex flex-col items-center justify-center
              bg-gradient-to-br ${getLevelColor(userLevel.level)} text-white relative
            `}>
              <div className="text-xs opacity-90">LEVEL</div>
              <div className="text-2xl font-bold">{userLevel.level}</div>

              {/* 레벨 아이콘 */}
              <div className="absolute -top-1 -right-1 text-2xl">
                {userLevel.level >= 40 ? '🌟' :
                 userLevel.level >= 30 ? '👑' :
                 userLevel.level >= 20 ? '🏆' :
                 userLevel.level >= 10 ? '🚀' :
                 userLevel.level >= 5 ? '⚡' : '🌱'}
              </div>
            </div>

            {/* 레벨 정보 */}
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {userLevel.title}
              </h3>
              <div className="text-sm text-gray-600 mt-1">
                총 {userLevel.totalXP.toLocaleString()} XP 획득
              </div>

              {/* 레벨 혜택 */}
              <div className="flex items-center gap-3 mt-2">
                {userLevel.perks.momentumBoost && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <TrendingUp className="w-3 h-3" />
                    모멘텀 +{userLevel.perks.momentumBoost}%
                  </div>
                )}
                {userLevel.perks.achievementBoost && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <Award className="w-3 h-3" />
                    성취 +{userLevel.perks.achievementBoost}%
                  </div>
                )}
                {userLevel.perks.specialBadge && (
                  <div className="flex items-center gap-1 text-xs text-purple-600">
                    <Star className="w-3 h-3" />
                    {userLevel.perks.specialBadge}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 일일 보너스 */}
          {!dailyBonusClaimed && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={claimDailyBonus}
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-shadow"
            >
              일일 보너스 받기
            </motion.button>
          )}
        </div>

        {/* 진행도 바 */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{userLevel.currentXP.toLocaleString()} XP</span>
            <span>{userLevel.requiredXP.toLocaleString()} XP</span>
          </div>
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${userLevel.progressPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="text-center text-xs text-gray-500 mt-2">
            다음 레벨까지 {userLevel.xpToNextLevel.toLocaleString()} XP
          </div>
        </div>
      </div>

      {/* 통계 */}
      {stats && (
        <div className="p-6 border-b">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            📊 레벨 통계
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {stats.averageDailyXP}
              </div>
              <div className="text-xs text-gray-500">일일 평균 XP</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {stats.daysToNextLevel || '∞'}
              </div>
              <div className="text-xs text-gray-500">다음 레벨까지 (일)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {getXPSourceIcon(stats.topXPSource)}
              </div>
              <div className="text-xs text-gray-500">주요 XP 소스</div>
            </div>
          </div>
        </div>
      )}

      {/* XP 히스토리 */}
      {showHistory && xpHistory.length > 0 && (
        <div className="p-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            ⚡ 최근 XP 획득
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {xpHistory.slice(0, 10).map(xp => (
              <motion.div
                key={xp.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getXPSourceIcon(xp.source)}</span>
                  <div>
                    <div className="text-sm text-gray-800">
                      {xp.description || xp.source.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(xp.timestamp).toLocaleString('ko-KR', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="font-bold text-gray-800">
                    +{xp.amount}
                  </span>
                  {xp.multiplier && xp.multiplier > 1 && (
                    <span className="text-xs text-purple-600">
                      x{xp.multiplier}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* XP 획득 애니메이션 (전체 화면) */}
      <AnimatePresence>
        {showXPGain && (
          <motion.div
            key={showXPGain.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
          >
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-6 rounded-2xl shadow-2xl">
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">
                  +{showXPGain.amount} XP
                </div>
                <div className="text-lg">
                  경험치 획득! ⚡
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LevelDisplay;