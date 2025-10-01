/**
 * QuickAchievements Component
 *
 * AmbientStatusBar에서 사용할 간단한 성취 표시
 * - 최근 해제된 성취
 * - 거의 달성할 수 있는 성취 (90% 이상)
 */

import React, { useState, useEffect } from 'react';
import AchievementBadge from './AchievementBadge';
import { achievementEngine } from '../../services/achievementEngine';
import type { AchievementProgress, UserAchievements } from '../../types/achievement.types';

interface QuickAchievementsProps {
  className?: string;
}

const QuickAchievements: React.FC<QuickAchievementsProps> = ({
  className = ""
}) => {
  const [userAchievements, setUserAchievements] = useState<UserAchievements | null>(null);
  const [nearComplete, setNearComplete] = useState<AchievementProgress[]>([]);

  useEffect(() => {
    const loadData = () => {
      try {
        const userAch = achievementEngine.getUserAchievements();
        const allProgress = achievementEngine.getAchievementProgress();

        // 90% 이상 진행된 미해제 성취 찾기
        const almostDone = allProgress
          .filter(p => !p.isUnlocked && p.percentage >= 90)
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 2);

        setUserAchievements(userAch);
        setNearComplete(almostDone);
      } catch (error) {
        console.error('Failed to load quick achievements:', error);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000); // 30초마다 업데이트
    return () => clearInterval(interval);
  }, []);

  if (!userAchievements) return null;

  const hasRecentUnlock = userAchievements.lastUnlocked;
  const hasNearComplete = nearComplete.length > 0;

  if (!hasRecentUnlock && !hasNearComplete) return null;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* 최근 해제된 성취 */}
      {hasRecentUnlock && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full border border-yellow-200">
          <span className="text-xs text-yellow-700 font-medium">NEW</span>
          <span className="text-lg">{userAchievements.lastUnlocked!.icon}</span>
          <span className="text-xs text-yellow-800 max-w-20 truncate">
            {userAchievements.lastUnlocked!.name}
          </span>
        </div>
      )}

      {/* 거의 완료된 성취 */}
      {hasNearComplete && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Almost:</span>
          <div className="flex gap-1">
            {nearComplete.map(progress => (
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
    </div>
  );
};

export default QuickAchievements;