/**
 * AchievementPanel Component
 *
 * 성취 시스템의 메인 패널
 * - 카테고리별 성취 표시
 * - 진행 중인 성취 하이라이트
 * - 통계 및 포인트 표시
 */

import React, { useState, useEffect } from 'react';
import AchievementBadge from './AchievementBadge';
import { achievementEngine } from '../../services/achievementEngine';
import { getAchievementsByCategory } from '../../data/achievements';
import type { AchievementProgress, UserAchievements } from '../../types/achievement.types';

interface AchievementPanelProps {
  className?: string;
  compact?: boolean;
}

const AchievementPanel: React.FC<AchievementPanelProps> = ({
  className = "",
  compact = false
}) => {
  const [userAchievements, setUserAchievements] = useState<UserAchievements | null>(null);
  const [achievementProgress, setAchievementProgress] = useState<AchievementProgress[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // 데이터 로드
  useEffect(() => {
    const loadData = () => {
      try {
        const userAch = achievementEngine.getUserAchievements();
        const progress = achievementEngine.getAchievementProgress();

        setUserAchievements(userAch);
        setAchievementProgress(progress);
      } catch (error) {
        console.error('Failed to load achievement data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // 1분마다 업데이트
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-16 h-16 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!userAchievements) {
    return (
      <div className={`p-6 text-center text-gray-500 ${className}`}>
        성취 데이터를 불러올 수 없습니다.
      </div>
    );
  }

  // 카테고리별 성취 그룹화
  const categories = getAchievementsByCategory();
  const categoryNames = {
    momentum: '모멘텀',
    consistency: '일관성',
    growth: '성장',
    milestone: '마일스톤',
    special: '특별'
  };

  // 필터링된 성취 목록
  const filteredProgress = selectedCategory === 'all'
    ? achievementProgress
    : achievementProgress.filter(p => p.achievement.category === selectedCategory);

  // 통계 계산
  const stats = achievementEngine.getCategoryStats();
  const totalUnlocked = Object.values(stats).reduce((sum, cat) => sum + cat.unlocked, 0);
  const totalAchievements = Object.values(stats).reduce((sum, cat) => sum + cat.total, 0);

  // 다음 추천 성취
  const recommended = achievementEngine.getNextRecommendedAchievements(3);

  if (compact) {
    // 컴팩트 모드: 최근 해제된 성취와 추천만 표시
    return (
      <div className={`bg-white rounded-lg border p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">성취</h3>
          <div className="text-sm text-gray-600">
            {totalUnlocked}/{totalAchievements} ({userAchievements.totalPoints}p)
          </div>
        </div>

        {/* 추천 성취 */}
        {recommended.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-gray-500 mb-2">다음 목표</div>
            <div className="flex gap-2">
              {recommended.map(progress => (
                <AchievementBadge
                  key={progress.achievement.id}
                  progress={progress}
                  size="small"
                  showProgress={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* 최근 해제된 성취 */}
        {userAchievements.lastUnlocked && (
          <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2">
              <span className="text-lg">{userAchievements.lastUnlocked.icon}</span>
              <div>
                <div className="text-sm font-medium text-gray-800">
                  {userAchievements.lastUnlocked.name}
                </div>
                <div className="text-xs text-gray-600">
                  최근 해제됨
                </div>
              </div>
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">🏆 성취 시스템</h2>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {userAchievements.totalPoints}
            </div>
            <div className="text-sm text-gray-500">총 포인트</div>
          </div>
        </div>

        {/* 전체 진행도 */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>전체 진행도</span>
              <span>{totalUnlocked}/{totalAchievements}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-700"
                style={{ width: `${(totalUnlocked / totalAchievements) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div className="p-6 border-b">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${selectedCategory === 'all'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:bg-gray-100'}
            `}
          >
            전체 ({totalUnlocked}/{totalAchievements})
          </button>
          {Object.entries(categoryNames).map(([key, name]) => {
            const stat = stats[key] || { total: 0, unlocked: 0 };
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${selectedCategory === key
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'}
                `}
              >
                {name} ({stat.unlocked}/{stat.total})
              </button>
            );
          })}
        </div>
      </div>

      {/* 성취 그리드 */}
      <div className="p-6">
        {/* 추천 성취 섹션 */}
        {selectedCategory === 'all' && recommended.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🎯 다음 목표
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {recommended.map(progress => (
                <AchievementBadge
                  key={progress.achievement.id}
                  progress={progress}
                  size="medium"
                />
              ))}
            </div>
          </div>
        )}

        {/* 전체 성취 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {filteredProgress
            .sort((a, b) => {
              // 해제된 것을 먼저, 그 다음 진행도 순
              if (a.isUnlocked !== b.isUnlocked) {
                return a.isUnlocked ? -1 : 1;
              }
              if (!a.isUnlocked && !b.isUnlocked) {
                return b.percentage - a.percentage;
              }
              return a.achievement.order - b.achievement.order;
            })
            .map(progress => (
              <AchievementBadge
                key={progress.achievement.id}
                progress={progress}
                size="medium"
              />
            ))}
        </div>

        {filteredProgress.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            해당 카테고리에 성취가 없습니다.
          </div>
        )}
      </div>

      {/* 최근 해제된 성취 (풀 모드) */}
      {userAchievements.lastUnlocked && (
        <div className="p-6 border-t bg-gradient-to-r from-yellow-50 to-orange-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 border-2 border-yellow-300 rounded-xl flex items-center justify-center text-2xl">
              {userAchievements.lastUnlocked.icon}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-800">
                최근 해제: {userAchievements.lastUnlocked.name}
              </div>
              <div className="text-sm text-gray-600">
                {userAchievements.lastUnlocked.description}
              </div>
              {userAchievements.lastUnlocked.unlockedAt && (
                <div className="text-xs text-gray-500 mt-1">
                  {userAchievements.lastUnlocked.unlockedAt.toLocaleString()}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-yellow-600">
                +{userAchievements.lastUnlocked.reward?.points || 0}
              </div>
              <div className="text-xs text-gray-500">포인트</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementPanel;