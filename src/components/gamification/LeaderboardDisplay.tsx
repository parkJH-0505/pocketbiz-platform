/**
 * LeaderboardDisplay Component
 *
 * 리더보드를 표시하는 컴포넌트
 * - 다양한 메트릭별 순위
 * - 실시간 순위 변동
 * - 사용자 하이라이트
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, TrendingUp, TrendingDown, Minus,
  Clock, Star, Zap, Target, Users,
  ChevronDown, Medal, Crown
} from 'lucide-react';
import { leaderboardEngine } from '../../services/leaderboardEngine';
import type { Leaderboard, LeaderboardEntry } from '../../types/gamification.types';

interface LeaderboardDisplayProps {
  className?: string;
  compact?: boolean;
  showFilters?: boolean;
  initialType?: Leaderboard['type'];
  initialMetric?: Leaderboard['metric'];
}

const LeaderboardDisplay: React.FC<LeaderboardDisplayProps> = ({
  className = "",
  compact = false,
  showFilters = true,
  initialType = 'weekly',
  initialMetric = 'momentum'
}) => {
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [selectedType, setSelectedType] = useState<Leaderboard['type']>(initialType);
  const [selectedMetric, setSelectedMetric] = useState<Leaderboard['metric']>(initialMetric);
  const [showDropdown, setShowDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<'global' | 'friends'>('global');

  // 데이터 로드
  useEffect(() => {
    const loadData = () => {
      const data = leaderboardEngine.getLeaderboard(selectedType, selectedMetric);
      setLeaderboard(data);
    };

    loadData();
    // 30초마다 업데이트
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [selectedType, selectedMetric]);

  // 순위 색상
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-orange-500';
    if (rank === 2) return 'from-gray-400 to-gray-500';
    if (rank === 3) return 'from-orange-400 to-orange-600';
    if (rank <= 10) return 'from-blue-400 to-purple-500';
    return 'from-gray-300 to-gray-400';
  };

  // 순위 아이콘
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-500" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-500" />;
    return null;
  };

  // 트렌드 아이콘
  const getTrendIcon = (trend: LeaderboardEntry['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-400" />;
      case 'new':
        return <Star className="w-4 h-4 text-blue-500" />;
    }
  };

  // 메트릭 아이콘
  const getMetricIcon = (metric: Leaderboard['metric']) => {
    switch (metric) {
      case 'momentum':
        return <Zap className="w-4 h-4" />;
      case 'xp':
        return <Star className="w-4 h-4" />;
      case 'achievements':
        return <Trophy className="w-4 h-4" />;
      case 'streak':
        return <Target className="w-4 h-4" />;
    }
  };

  // 메트릭 단위
  const getMetricUnit = (metric: Leaderboard['metric']) => {
    switch (metric) {
      case 'momentum':
        return '점';
      case 'xp':
        return 'XP';
      case 'achievements':
        return '개';
      case 'streak':
        return '일';
    }
  };

  if (!leaderboard) {
    return (
      <div className={`bg-white rounded-xl border shadow-sm p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-2 w-1/3"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    // 컴팩트 뷰 (상위 5명만)
    return (
      <div className={`bg-white rounded-lg border p-3 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-800">리더보드</span>
          </div>
          <span className="text-xs text-gray-500">
            {selectedType === 'weekly' ? '주간' :
             selectedType === 'monthly' ? '월간' :
             selectedType === 'season' ? '시즌' : '전체'}
          </span>
        </div>

        <div className="space-y-2">
          {leaderboard.entries.slice(0, 5).map(entry => (
            <div
              key={entry.userId}
              className={`flex items-center gap-2 p-2 rounded ${
                entry.userId === 'current-user'
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                entry.rank <= 3
                  ? `bg-gradient-to-br ${getRankColor(entry.rank)} text-white`
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {entry.rank}
              </div>
              <div className="flex-1 text-xs">
                <div className="font-medium text-gray-800">
                  {entry.username}
                </div>
              </div>
              <div className="text-xs font-bold text-gray-700">
                {entry.score.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {leaderboard.userRank && leaderboard.userRank.rank > 5 && (
          <div className="mt-2 pt-2 border-t">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">내 순위</span>
              <span className="font-bold text-blue-600">
                #{leaderboard.userRank.rank}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border shadow-sm ${className}`}>
      {/* 헤더 */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              리더보드
            </h3>
            {leaderboard.nextReset && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <Clock className="w-3 h-3" />
                다음 리셋: {new Date(leaderboard.nextReset).toLocaleDateString('ko-KR')}
              </div>
            )}
          </div>

          {/* 뷰 모드 전환 */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('global')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                viewMode === 'global'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setViewMode('friends')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                viewMode === 'friends'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 필터 */}
        {showFilters && (
          <div className="flex gap-3 mt-4">
            {/* 기간 필터 */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as Leaderboard['type'])}
              className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="weekly">주간</option>
              <option value="monthly">월간</option>
              <option value="season">시즌</option>
              <option value="all_time">전체</option>
            </select>

            {/* 메트릭 필터 */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
              >
                {getMetricIcon(selectedMetric)}
                {selectedMetric === 'momentum' ? '모멘텀' :
                 selectedMetric === 'xp' ? '경험치' :
                 selectedMetric === 'achievements' ? '성취' : '연속'}
                <ChevronDown className="w-4 h-4" />
              </button>

              {showDropdown && (
                <div className="absolute top-full mt-1 left-0 w-40 bg-white border rounded-lg shadow-lg z-10">
                  {(['momentum', 'xp', 'achievements', 'streak'] as const).map(metric => (
                    <button
                      key={metric}
                      onClick={() => {
                        setSelectedMetric(metric);
                        setShowDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
                    >
                      {getMetricIcon(metric)}
                      {metric === 'momentum' ? '모멘텀' :
                       metric === 'xp' ? '경험치' :
                       metric === 'achievements' ? '성취' : '연속 접속'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 사용자 순위 카드 */}
      {leaderboard.userRank && (
        <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`
                w-16 h-16 rounded-full flex items-center justify-center
                bg-gradient-to-br ${getRankColor(leaderboard.userRank.rank)} text-white
                text-xl font-bold shadow-md
              `}>
                #{leaderboard.userRank.rank}
              </div>
              <div>
                <div className="text-sm text-gray-600">내 순위</div>
                <div className="text-2xl font-bold text-gray-800">
                  상위 {leaderboard.userRank.percentile}%
                </div>
                {leaderboard.userRank.change !== 0 && (
                  <div className={`flex items-center gap-1 text-sm mt-1 ${
                    leaderboard.userRank.change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {leaderboard.userRank.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(leaderboard.userRank.change)}단계 {leaderboard.userRank.change > 0 ? '상승' : '하락'}
                  </div>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold text-gray-800">
                {leaderboard.entries.find(e => e.userId === 'current-user')?.score.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                {getMetricUnit(selectedMetric)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 리더보드 리스트 */}
      <div className="p-6">
        <div className="space-y-2">
          <AnimatePresence>
            {(viewMode === 'friends'
              ? leaderboardEngine.getFriendsLeaderboard()
              : leaderboard.entries.slice(0, 20)
            ).map((entry, index) => (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.02 }}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  entry.userId === 'current-user'
                    ? 'bg-blue-50 border border-blue-200'
                    : entry.rank <= 3
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {/* 순위 */}
                <div className="w-12 text-center">
                  {entry.rank <= 3 ? (
                    <div className="flex justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                  ) : (
                    <span className={`text-lg font-bold ${
                      entry.userId === 'current-user' ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      #{entry.rank}
                    </span>
                  )}
                </div>

                {/* 트렌드 */}
                <div className="w-6">
                  {getTrendIcon(entry.trend)}
                </div>

                {/* 사용자 정보 */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xl">
                    {entry.avatar}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 flex items-center gap-2">
                      {entry.username}
                      {entry.userId === 'current-user' && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Lv.{entry.level} · {entry.title}
                    </div>
                  </div>
                </div>

                {/* 배지 */}
                {entry.badges && entry.badges.length > 0 && (
                  <div className="flex gap-1">
                    {entry.badges.slice(0, 3).map((badge, i) => (
                      <span key={i} className="text-lg">
                        {badge}
                      </span>
                    ))}
                  </div>
                )}

                {/* 점수 */}
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-800">
                    {entry.score.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getMetricUnit(selectedMetric)}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* 더보기 */}
        {leaderboard.entries.length > 20 && (
          <div className="text-center mt-4">
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              더 많은 순위 보기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardDisplay;