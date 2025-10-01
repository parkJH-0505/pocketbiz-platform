/**
 * GamificationHub Component
 *
 * 모든 게임화 요소를 한 곳에서 관리하는 허브 컴포넌트
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Star, Target, Gift, Users,
  ChevronRight, Sparkles, Zap
} from 'lucide-react';

// 게임화 컴포넌트들
import LevelDisplay from './LevelDisplay';
import SeasonDisplay from './SeasonDisplay';
import LeaderboardDisplay from './LeaderboardDisplay';
import SpecialRewardsDisplay from './SpecialRewardsDisplay';

interface GamificationHubProps {
  className?: string;
  defaultTab?: 'overview' | 'level' | 'season' | 'leaderboard' | 'rewards';
}

const GamificationHub: React.FC<GamificationHubProps> = ({
  className = "",
  defaultTab = 'overview'
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  // 탭 정의
  const tabs = [
    { id: 'overview', label: '개요', icon: Sparkles },
    { id: 'level', label: '레벨', icon: Star },
    { id: 'season', label: '시즌', icon: Target },
    { id: 'leaderboard', label: '리더보드', icon: Trophy },
    { id: 'rewards', label: '보상', icon: Gift }
  ];

  return (
    <div className={`bg-white rounded-xl border shadow-sm ${className}`}>
      {/* 헤더 */}
      <div className="p-6 border-b bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Zap className="w-7 h-7 text-purple-500" />
              게임화 허브
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              성장과 함께하는 재미있는 여정
            </p>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-purple-600 shadow-md'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {/* 개요 탭 */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* 주요 지표 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 레벨 요약 */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 cursor-pointer"
                  onClick={() => setActiveTab('level')}
                >
                  <LevelDisplay compact />
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-600">레벨 상세보기</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </motion.div>

                {/* 시즌 요약 */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg border border-green-200 cursor-pointer"
                  onClick={() => setActiveTab('season')}
                >
                  <SeasonDisplay compact />
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-600">시즌 상세보기</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </motion.div>

                {/* 보상 요약 */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 cursor-pointer"
                  onClick={() => setActiveTab('rewards')}
                >
                  <SpecialRewardsDisplay compact />
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-600">보상 상세보기</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </motion.div>
              </div>

              {/* 리더보드 미리보기 */}
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-800 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    리더보드 TOP 5
                  </h3>
                  <button
                    onClick={() => setActiveTab('leaderboard')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    전체 보기 →
                  </button>
                </div>
                <LeaderboardDisplay compact />
              </div>

              {/* 동기부여 메시지 */}
              <div className="p-6 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg text-center">
                <div className="text-3xl mb-2">🚀</div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">
                  당신의 성장 여정이 시작됩니다!
                </h4>
                <p className="text-sm text-gray-600">
                  레벨을 올리고, 도전을 완료하고, 특별한 보상을 획득하세요.
                  <br />
                  매일의 작은 성취가 모여 큰 성공을 만듭니다.
                </p>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs text-gray-600">경험치 획득</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-gray-600">목표 달성</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-gray-600">함께 성장</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 레벨 탭 */}
          {activeTab === 'level' && (
            <motion.div
              key="level"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <LevelDisplay />
            </motion.div>
          )}

          {/* 시즌 탭 */}
          {activeTab === 'season' && (
            <motion.div
              key="season"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <SeasonDisplay />
            </motion.div>
          )}

          {/* 리더보드 탭 */}
          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <LeaderboardDisplay />
            </motion.div>
          )}

          {/* 보상 탭 */}
          {activeTab === 'rewards' && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <SpecialRewardsDisplay />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GamificationHub;