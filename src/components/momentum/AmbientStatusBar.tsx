import React, { useState, useEffect } from 'react';
import PersonalGreeting from './PersonalGreeting';
import MomentumIndicator from './MomentumIndicator';
// 제거됨: DailySurprise, StartupHealthRings
import QuickAchievements from '../achievement/QuickAchievements';
import { useBuildupContext } from '../../contexts/BuildupContext';
import { useMomentum } from '../../hooks/useMomentum';

interface AmbientStatusBarProps {
  className?: string;
}

const AmbientStatusBar: React.FC<AmbientStatusBarProps> = ({
  className = ""
}) => {
  const { projects } = useBuildupContext();
  const { momentum } = useMomentum();
  const [healthMetrics, setHealthMetrics] = useState({
    kpiGrowth: 0,
    dailyActivity: 0,
    momentumScore: 0
  });

  // 헬스 메트릭 계산
  useEffect(() => {
    // KPI 성장률 계산 (임시 로직)
    const kpiScore = localStorage.getItem('kpi-average-score');
    const previousKpiScore = localStorage.getItem('kpi-previous-score');
    const kpiGrowth = kpiScore && previousKpiScore
      ? Math.max(0, (parseInt(kpiScore) - parseInt(previousKpiScore)) * 5)
      : 30;

    // 일일 활동률 계산
    const todayTasks = parseInt(localStorage.getItem('today-tasks-completed') || '0');
    const totalTasks = parseInt(localStorage.getItem('today-tasks-total') || '10');
    const dailyActivity = totalTasks > 0 ? (todayTasks / totalTasks) * 100 : 0;

    // 모멘텀 점수
    const momentumScore = momentum?.score || 50;

    setHealthMetrics({
      kpiGrowth: Math.min(100, kpiGrowth),
      dailyActivity: Math.min(100, dailyActivity),
      momentumScore: Math.min(100, momentumScore)
    });
  }, [momentum, projects]);

  return (
    <div className={`w-full bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      <div className="flex items-center justify-between px-6 py-4">
        {/* 좌측: 개인화 인사 */}
        <div className="flex items-center gap-4 flex-1">
          <PersonalGreeting />
        </div>

        {/* 중앙: 모멘텀 인디케이터 + 빠른 성취 */}
        <div className="flex-shrink-0 mx-8 flex items-center gap-6">
          <MomentumIndicator />
          <QuickAchievements />
        </div>

        {/* 우측: 여백 */}
        <div className="flex-1 min-w-0 flex justify-end">
          {/* 제거됨: DailySurprise */}
        </div>
      </div>
    </div>
  );
};

export default AmbientStatusBar;