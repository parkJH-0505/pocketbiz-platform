/**
 * SpecialRewardsDisplay Component
 *
 * 특별 보상을 표시하고 수령할 수 있는 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift, Lock, CheckCircle, Clock, Star,
  Trophy, Zap, Crown, Sparkles, ChevronRight,
  Package, Tag, Award, Users
} from 'lucide-react';
import { specialRewardsEngine } from '../../services/specialRewardsEngine';
import type { SpecialReward } from '../../types/gamification.types';

interface SpecialRewardsDisplayProps {
  className?: string;
  compact?: boolean;
  showStats?: boolean;
}

const SpecialRewardsDisplay: React.FC<SpecialRewardsDisplayProps> = ({
  className = "",
  compact = false,
  showStats = true
}) => {
  const [rewards, setRewards] = useState<SpecialReward[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'available' | 'claimed'>('available');
  const [claimingReward, setClaimingReward] = useState<string | null>(null);

  // 데이터 로드
  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = () => {
    const allRewards = specialRewardsEngine.getAllRewards();
    const rewardStats = specialRewardsEngine.getRewardStats();

    setRewards(allRewards);
    setStats(rewardStats);
  };

  // 보상 수령
  const handleClaimReward = async (rewardId: string) => {
    setClaimingReward(rewardId);

    try {
      const claimed = await specialRewardsEngine.claimReward(rewardId);
      if (claimed) {
        // 애니메이션 후 데이터 새로고침
        setTimeout(() => {
          loadRewards();
          setClaimingReward(null);
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to claim reward:', error);
      setClaimingReward(null);
    }
  };

  // 보상 타입 아이콘
  const getRewardTypeIcon = (type: SpecialReward['type']) => {
    switch (type) {
      case 'virtual':
        return <Star className="w-4 h-4" />;
      case 'real':
        return <Package className="w-4 h-4" />;
      case 'discount':
        return <Tag className="w-4 h-4" />;
      case 'feature':
        return <Zap className="w-4 h-4" />;
      case 'recognition':
        return <Award className="w-4 h-4" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  // 보상 타입 색상
  const getRewardTypeColor = (type: SpecialReward['type']) => {
    switch (type) {
      case 'virtual':
        return 'from-blue-400 to-purple-500';
      case 'real':
        return 'from-yellow-400 to-orange-500';
      case 'discount':
        return 'from-green-400 to-teal-500';
      case 'feature':
        return 'from-purple-400 to-pink-500';
      case 'recognition':
        return 'from-red-400 to-pink-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  // 필터링된 보상
  const filteredRewards = rewards.filter(reward => {
    if (selectedCategory === 'available') {
      return reward.available && !reward.claimed;
    }
    if (selectedCategory === 'claimed') {
      return reward.claimed;
    }
    return true;
  });

  if (compact) {
    // 컴팩트 뷰
    const availableRewards = rewards.filter(r => r.available && !r.claimed);

    return (
      <div className={`bg-white rounded-lg border p-3 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-800">특별 보상</span>
          </div>
          {availableRewards.length > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
              {availableRewards.length}개 대기중
            </span>
          )}
        </div>

        {availableRewards.length > 0 ? (
          <div className="space-y-2">
            {availableRewards.slice(0, 3).map(reward => (
              <motion.div
                key={reward.id}
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-2 p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg cursor-pointer"
                onClick={() => handleClaimReward(reward.id)}
              >
                <div className="text-lg">{getRewardTypeIcon(reward.type)}</div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-800">
                    {reward.name}
                  </div>
                </div>
                <ChevronRight className="w-3 h-3 text-gray-400" />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-500 text-center py-2">
            조건을 달성하면 특별 보상이 나타납니다
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border shadow-sm ${className}`}>
      {/* 헤더 */}
      <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-500" />
              특별 보상
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              목표를 달성하고 특별한 보상을 받으세요
            </p>
          </div>

          {/* 통계 */}
          {showStats && stats && (
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {stats.claimed}
                </div>
                <div className="text-xs text-gray-500">획득</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.available}
                </div>
                <div className="text-xs text-gray-500">대기중</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">
                  {stats.total}
                </div>
                <div className="text-xs text-gray-500">전체</div>
              </div>
            </div>
          )}
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 mt-4">
          {(['available', 'all', 'claimed'] as const).map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                selectedCategory === category
                  ? 'bg-purple-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {category === 'available' ? '수령 가능' :
               category === 'claimed' ? '획득 완료' : '전체'}
              {category === 'available' && stats?.available > 0 && (
                <span className="ml-2 bg-white bg-opacity-30 px-2 py-0.5 rounded-full text-xs">
                  {stats.available}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 보상 리스트 */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredRewards.map(reward => {
              const isClaiming = claimingReward === reward.id;
              const canClaim = reward.available && !reward.claimed;

              return (
                <motion.div
                  key={reward.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={canClaim ? { scale: 1.02 } : {}}
                  className={`relative p-4 rounded-lg border overflow-hidden ${
                    reward.claimed
                      ? 'bg-gray-50 border-gray-200'
                      : reward.available
                      ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 cursor-pointer'
                      : 'bg-white border-gray-200 opacity-60'
                  }`}
                  onClick={() => canClaim && handleClaimReward(reward.id)}
                >
                  {/* 타입 리본 */}
                  <div
                    className={`absolute top-0 right-0 px-3 py-1 text-xs text-white font-medium rounded-bl-lg bg-gradient-to-r ${
                      getRewardTypeColor(reward.type)
                    }`}
                  >
                    {reward.type === 'virtual' ? '가상' :
                     reward.type === 'real' ? '실물' :
                     reward.type === 'discount' ? '할인' :
                     reward.type === 'feature' ? '기능' :
                     reward.type === 'recognition' ? '명예' : '특별'}
                  </div>

                  <div className="flex items-start gap-3">
                    {/* 아이콘 */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      reward.claimed
                        ? 'bg-gray-200'
                        : reward.available
                        ? `bg-gradient-to-br ${getRewardTypeColor(reward.type)} bg-opacity-20`
                        : 'bg-gray-100'
                    }`}>
                      {reward.claimed ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : reward.available ? (
                        <div className="text-2xl">
                          {reward.type === 'virtual' ? '🎁' :
                           reward.type === 'real' ? '📦' :
                           reward.type === 'discount' ? '🎫' :
                           reward.type === 'feature' ? '🔓' :
                           reward.type === 'recognition' ? '🏆' : '✨'}
                        </div>
                      ) : (
                        <Lock className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    {/* 정보 */}
                    <div className="flex-1">
                      <h4 className={`font-medium ${
                        reward.claimed ? 'text-gray-500' : 'text-gray-800'
                      }`}>
                        {reward.name}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {reward.description}
                      </p>

                      {/* 조건 */}
                      <div className="flex items-center gap-2 mt-2">
                        {reward.criteria.minLevel && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            Lv.{reward.criteria.minLevel}
                          </span>
                        )}
                        {reward.criteria.achievement && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            성취
                          </span>
                        )}
                        {reward.criteria.seasonRank && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            Top {reward.criteria.seasonRank}
                          </span>
                        )}
                        {reward.expiresAt && !reward.claimed && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {Math.ceil((reward.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))}일 남음
                          </span>
                        )}
                      </div>

                      {/* 보상 내용 */}
                      {(reward.virtual || reward.real || reward.discount) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          {reward.virtual && (
                            <div className="flex flex-wrap gap-2">
                              {reward.virtual.badge && (
                                <span className="text-xs text-gray-600">
                                  🏅 배지
                                </span>
                              )}
                              {reward.virtual.title && (
                                <span className="text-xs text-gray-600">
                                  🎖️ {reward.virtual.title}
                                </span>
                              )}
                              {reward.virtual.theme && (
                                <span className="text-xs text-gray-600">
                                  🎨 테마
                                </span>
                              )}
                              {reward.virtual.boost && (
                                <span className="text-xs text-gray-600">
                                  ⚡ 부스트
                                </span>
                              )}
                            </div>
                          )}
                          {reward.real && (
                            <div className="text-xs text-gray-600">
                              {reward.real.item}
                            </div>
                          )}
                          {reward.discount && (
                            <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                              {reward.discount.code}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 수령 중 애니메이션 */}
                  {isClaiming && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      >
                        <Sparkles className="w-8 h-8 text-purple-500" />
                      </motion.div>
                    </motion.div>
                  )}

                  {/* 획득 완료 표시 */}
                  {reward.claimed && reward.claimedAt && (
                    <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                      {new Date(reward.claimedAt).toLocaleDateString('ko-KR')} 획득
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredRewards.length === 0 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">
              {selectedCategory === 'claimed' ? '📋' : '🎯'}
            </div>
            <p className="text-gray-500">
              {selectedCategory === 'claimed'
                ? '아직 획득한 보상이 없습니다'
                : '조건을 달성하면 보상이 나타납니다'}
            </p>
          </div>
        )}
      </div>

      {/* 다음 보상 안내 */}
      {stats?.nextReward && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">
                  다음 보상: {stats.nextReward.name}
                </div>
                <div className="text-xs text-gray-600">
                  {stats.nextReward.criteria.minLevel
                    ? `레벨 ${stats.nextReward.criteria.minLevel} 달성시`
                    : '조건 충족시 획득 가능'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialRewardsDisplay;