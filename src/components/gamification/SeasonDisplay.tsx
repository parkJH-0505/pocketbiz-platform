/**
 * SeasonDisplay Component
 *
 * 시즌 정보와 진행도를 표시하는 컴포넌트
 * - 현재 시즌 정보
 * - 시즌 목표 진행도
 * - 시즌 보상
 * - 시즌 패스
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Target, Gift, Clock, ChevronRight, Star, Lock } from 'lucide-react';
import { seasonSystemEngine } from '../../services/seasonSystemEngine';
import type { Season, SeasonGoal, SeasonReward } from '../../types/gamification.types';

interface SeasonDisplayProps {
  className?: string;
  compact?: boolean;
  showGoals?: boolean;
  showRewards?: boolean;
}

const SeasonDisplay: React.FC<SeasonDisplayProps> = ({
  className = "",
  compact = false,
  showGoals = true,
  showRewards = true
}) => {
  const [season, setSeason] = useState<Season | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<'goals' | 'rewards' | 'pass'>('goals');

  // 데이터 로드
  useEffect(() => {
    const loadData = () => {
      const currentSeason = seasonSystemEngine.getCurrentSeason();
      const seasonStats = seasonSystemEngine.getSeasonStats();

      setSeason(currentSeason);
      setStats(seasonStats);
    };

    loadData();
    // 1분마다 업데이트
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  // 보상 수령
  const claimReward = (rewardId: string) => {
    const claimed = seasonSystemEngine.claimReward(rewardId);
    if (claimed) {
      // 데이터 새로고침
      setSeason(seasonSystemEngine.getCurrentSeason());
      setStats(seasonSystemEngine.getSeasonStats());
    }
  };

  // 레어도 색상
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-pink-500';
      case 'rare': return 'from-blue-400 to-purple-500';
      case 'uncommon': return 'from-green-400 to-blue-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  // 목표 아이콘
  const getGoalIcon = (goalId: string) => {
    if (goalId.includes('login')) return '📅';
    if (goalId.includes('momentum')) return '🚀';
    if (goalId.includes('achievement')) return '🏆';
    if (goalId.includes('level')) return '⚡';
    if (goalId.includes('task')) return '✅';
    if (goalId.includes('challenge')) return '⚔️';
    return '🎯';
  };

  if (!season || !stats) {
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
              style={{ backgroundColor: season.style.primaryColor + '20' }}
            >
              {season.style.icon}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-800">
                {season.name}
              </div>
              <div className="text-xs text-gray-500">
                티어 {stats.tier} · {stats.daysRemaining}일 남음
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-gray-800">
              {stats.goalsCompleted}/{stats.goalsTotal}
            </div>
            <div className="text-xs text-gray-500">목표</div>
          </div>
        </div>

        {/* 진행도 바 */}
        <div className="mt-3">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full"
              style={{ backgroundColor: season.style.primaryColor }}
              initial={{ width: 0 }}
              animate={{ width: `${stats.progressPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border shadow-sm ${className}`}>
      {/* 헤더 */}
      <div
        className="p-6 border-b relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${season.style.primaryColor}10, ${season.style.secondaryColor}10)`
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* 시즌 아이콘 */}
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${season.style.primaryColor}, ${season.style.secondaryColor})`
                }}
              >
                {season.style.icon}
              </div>

              {/* 시즌 정보 */}
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {season.name}
                </h3>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Trophy className="w-4 h-4" />
                    티어 {stats.tier}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {stats.daysRemaining}일 남음
                  </div>
                </div>
              </div>
            </div>

            {/* 시즌 포인트 */}
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-800">
                {stats.points.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">시즌 포인트</div>
            </div>
          </div>

          {/* 시즌 진행도 */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>시즌 진행도</span>
              <span>{Math.round(stats.progressPercentage)}%</span>
            </div>
            <div className="h-3 bg-white bg-opacity-50 rounded-full overflow-hidden">
              <motion.div
                className="h-full"
                style={{
                  background: `linear-gradient(90deg, ${season.style.primaryColor}, ${season.style.secondaryColor})`
                }}
                initial={{ width: 0 }}
                animate={{ width: `${stats.progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* 장식 요소 */}
        <div
          className="absolute top-0 right-0 w-32 h-32 opacity-20"
          style={{
            background: `radial-gradient(circle, ${season.style.primaryColor}, transparent)`,
            transform: 'translate(25%, -25%)'
          }}
        />
      </div>

      {/* 탭 */}
      <div className="flex border-b">
        <button
          onClick={() => setSelectedTab('goals')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            selectedTab === 'goals'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Target className="w-4 h-4" />
            목표 ({stats.goalsCompleted}/{stats.goalsTotal})
          </div>
        </button>
        <button
          onClick={() => setSelectedTab('rewards')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            selectedTab === 'rewards'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Gift className="w-4 h-4" />
            보상 ({stats.rewardsAvailable})
          </div>
        </button>
        <button
          onClick={() => setSelectedTab('pass')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            selectedTab === 'pass'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Star className="w-4 h-4" />
            시즌 패스
          </div>
        </button>
      </div>

      {/* 컨텐츠 */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {/* 목표 탭 */}
          {selectedTab === 'goals' && showGoals && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {season.goals.map(goal => (
                <div
                  key={goal.id}
                  className={`p-4 rounded-lg border ${
                    goal.completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getGoalIcon(goal.id)}</span>
                        <h4 className={`font-medium ${
                          goal.completed ? 'text-green-700' : 'text-gray-800'
                        }`}>
                          {goal.title}
                        </h4>
                        {goal.completed && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            완료
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {goal.description}
                      </p>

                      {/* 진행도 */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>진행도</span>
                          <span>{goal.current}/{goal.target}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full ${
                              goal.completed
                                ? 'bg-green-500'
                                : 'bg-blue-500'
                            }`}
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.min((goal.current / goal.target) * 100, 100)}%`
                            }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 보상 */}
                    <div className="ml-4 text-right">
                      {goal.reward.xp && (
                        <div className="text-sm font-bold text-gray-800">
                          +{goal.reward.xp} XP
                        </div>
                      )}
                      {goal.reward.badge && (
                        <div className="text-xs text-gray-500 mt-1">
                          🏅 배지
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* 보상 탭 */}
          {selectedTab === 'rewards' && showRewards && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-2 gap-3"
            >
              {season.rewards.map(reward => {
                const isLocked = reward.tier > stats.tier;
                const canClaim = !isLocked && !reward.claimed;

                return (
                  <motion.div
                    key={`${reward.type}_${reward.tier}`}
                    whileHover={canClaim ? { scale: 1.02 } : {}}
                    className={`p-4 rounded-lg border relative ${
                      reward.claimed
                        ? 'bg-gray-100 border-gray-300'
                        : isLocked
                        ? 'bg-gray-50 border-gray-200 opacity-60'
                        : 'bg-gradient-to-br ' + getRarityColor(reward.rarity) + ' bg-opacity-10 border-current'
                    }`}
                  >
                    {/* 티어 표시 */}
                    <div className="absolute top-2 right-2">
                      <span className="text-xs font-bold text-gray-500">
                        T{reward.tier}
                      </span>
                    </div>

                    {/* 보상 아이콘 */}
                    <div className="text-2xl mb-2">
                      {reward.type === 'badge' ? '🏅' :
                       reward.type === 'title' ? '🎖️' :
                       reward.type === 'theme' ? '🎨' :
                       reward.type === 'boost' ? '⚡' :
                       reward.type === 'feature' ? '🔓' : '🎁'}
                    </div>

                    {/* 보상 정보 */}
                    <div className="mb-3">
                      <div className={`text-sm font-medium ${
                        reward.claimed ? 'text-gray-500' : 'text-gray-800'
                      }`}>
                        {reward.item}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {reward.description}
                      </div>
                    </div>

                    {/* 레어도 */}
                    <div className={`text-xs font-medium ${
                      reward.rarity === 'legendary' ? 'text-yellow-600' :
                      reward.rarity === 'epic' ? 'text-purple-600' :
                      reward.rarity === 'rare' ? 'text-blue-600' :
                      reward.rarity === 'uncommon' ? 'text-green-600' :
                      'text-gray-600'
                    }`}>
                      {reward.rarity.toUpperCase()}
                    </div>

                    {/* 상태 */}
                    {reward.claimed && (
                      <div className="absolute inset-0 bg-gray-900 bg-opacity-10 rounded-lg flex items-center justify-center">
                        <span className="text-gray-700 font-bold">수령 완료</span>
                      </div>
                    )}
                    {isLocked && (
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <Lock className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    {canClaim && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => claimReward(reward.type)}
                        className="absolute bottom-2 right-2 px-3 py-1 bg-blue-500 text-white text-xs rounded-full font-medium"
                      >
                        수령
                      </motion.button>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* 시즌 패스 탭 */}
          {selectedTab === 'pass' && (
            <motion.div
              key="pass"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎫</div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">
                  시즌 패스
                </h4>
                <p className="text-sm text-gray-600">
                  티어를 올려 더 많은 보상을 획득하세요
                </p>
                <div className="mt-4 text-2xl font-bold text-gray-800">
                  현재 티어: {stats.tier}
                </div>
              </div>

              {/* 패스 진행도 */}
              <div className="space-y-2">
                {season.pass.free.slice(
                  Math.max(0, stats.tier - 2),
                  stats.tier + 3
                ).map(tier => (
                  <div
                    key={tier.tier}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      tier.tier <= stats.tier
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      tier.tier <= stats.tier
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {tier.tier}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">
                        티어 {tier.tier}
                      </div>
                      <div className="text-xs text-gray-600">
                        {tier.requiredPoints} 포인트 필요
                      </div>
                    </div>
                    <div className="text-right">
                      {tier.rewards.free?.xp && (
                        <div className="text-sm font-bold text-gray-800">
                          +{tier.rewards.free.xp} XP
                        </div>
                      )}
                    </div>
                    {tier.tier > stats.tier && (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SeasonDisplay;