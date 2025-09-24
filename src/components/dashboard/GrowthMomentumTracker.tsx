/**
 * Growth Momentum Tracker Component
 *
 * 성장 모멘텀 트래커
 * - 점수 변화량 (실제 이전 진단과 비교)
 * - 프로젝트 완료율
 * - 목표 달성 진행률
 * - 실제 diagnosticHistory 데이터 활용
 */

import React, { useMemo } from 'react';
import { TrendingUp, Target, Award, BarChart3 } from 'lucide-react';
import { useKPIDiagnosis } from '../../contexts/KPIDiagnosisContext';
import { useBuildupContext } from '../../contexts/BuildupContext';
import type { AxisKey } from '../../types';

interface GrowthMomentumTrackerProps {
  className?: string;
}

// 축별 라벨 매핑
const AXIS_LABELS: Record<AxisKey, string> = {
  GO: '사업목표',
  EC: '경제가치',
  PT: '제품기술',
  PF: '제품적합성',
  TO: '팀조직'
};

const GrowthMomentumTracker: React.FC<GrowthMomentumTrackerProps> = ({ className = '' }) => {
  // Context 데이터 가져오기
  const { axisScores, overallScore, previousScores, progress } = useKPIDiagnosis();
  const { activeProjects, completedProjects } = useBuildupContext();

  // 성장 모멘텀 계산
  const momentum = useMemo(() => {
    const totalProjects = activeProjects.length + completedProjects.length;
    const completionRate = totalProjects > 0 ? (completedProjects.length / totalProjects) * 100 : 0;

    // 점수 변화 계산
    const currentAvg = Object.values(axisScores).reduce((sum, score) => sum + (score || 0), 0) / 5;
    const previousAvg = Object.values(previousScores).reduce((sum, score) => sum + (score || 0), 0) / 5;
    const scoreChange = currentAvg - previousAvg;

    const targetScore = 85; // 목표 점수
    const remainingToTarget = Math.max(0, targetScore - currentAvg);
    const targetProgress = currentAvg > 0 ? Math.min(100, (currentAvg / targetScore) * 100) : 0;

    return {
      scoreChange,
      completionRate,
      targetScore,
      remainingToTarget,
      targetProgress,
      diagnosisProgress: progress.percentage
    };
  }, [axisScores, previousScores, activeProjects, completedProjects, progress, overallScore]);

  // 가장 개선된 축들 찾기
  const improvedAxes = useMemo(() => {
    const changes: Array<{axis: AxisKey, change: number, label: string}> = [];

    (['GO', 'EC', 'PT', 'PF', 'TO'] as AxisKey[]).forEach(axis => {
      const current = axisScores[axis] || 0;
      const previous = previousScores[axis] || 0;
      const change = current - previous;

      if (change > 0) {
        changes.push({
          axis,
          change,
          label: AXIS_LABELS[axis]
        });
      }
    });

    return changes.sort((a, b) => b.change - a.change).slice(0, 2);
  }, [axisScores, previousScores]);

  return (
    <div className={`bg-white rounded-xl p-6 border min-h-80 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">성장 모멘텀 트래커</h3>
        <div className={`flex items-center gap-1 text-sm ${momentum.scoreChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          <TrendingUp className="w-4 h-4" />
          {momentum.scoreChange >= 0 ? '상승 추세' : '하락 추세'}
        </div>
      </div>

      {/* 이번 달 성과 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className={`text-2xl font-bold ${momentum.scoreChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {momentum.scoreChange >= 0 ? '+' : ''}{momentum.scoreChange.toFixed(1)}
          </div>
          <div className="text-sm text-gray-600">점수 변화</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-main">{momentum.completionRate.toFixed(0)}%</div>
          <div className="text-sm text-gray-600">프로젝트 완료율</div>
        </div>
      </div>

      {/* 목표 달성 진행률 */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">목표 점수까지</span>
          </div>
          <span className="font-bold text-sm">{momentum.remainingToTarget.toFixed(1)} 점 필요</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-primary-main to-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${momentum.targetProgress}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>현재: {Object.values(axisScores).reduce((sum, score) => sum + (score || 0), 0) / 5 || 0}점</span>
          <span>목표: {momentum.targetScore}점</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">진단 완료율</span>
          <span className="font-bold text-sm">{momentum.diagnosisProgress.toFixed(0)}%</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-main h-2 rounded-full transition-all duration-500"
            style={{ width: `${momentum.diagnosisProgress}%` }}
          ></div>
        </div>
      </div>

      {/* 주요 개선 영역 */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 text-sm mb-3">이번 달 개선 영역</h4>
        <div className="space-y-2">
          {improvedAxes.length > 0 ? (
            improvedAxes.map((axisData, index) => (
              <div key={axisData.axis} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {index === 0 ? (
                    <Award className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  )}
                  <span className="text-sm">{axisData.label}</span>
                </div>
                <span className="text-sm font-medium text-green-600">
                  +{axisData.change.toFixed(1)} 점
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">아직 개선된 영역이 없습니다</p>
              <p className="text-xs text-gray-400 mt-1">진단을 완료하면 개선 사항을 확인할 수 있습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* 액션 버튼들 */}
      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-main to-green-500 text-white rounded-lg hover:from-primary-dark hover:to-green-600 transition-all">
          <BarChart3 className="w-4 h-4" />
          월간 보고서
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          <Target className="w-4 h-4" />
          목표 수정
        </button>
      </div>

      {/* 연동 완료 표시 */}
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="text-xs text-green-700">
          ✅ 실시간 성장 데이터 연동 완료
          <br />• 실제 previousScores 비교, 프로젝트 완료율, 목표 달성률 표시
        </div>
      </div>
    </div>
  );
};

export default GrowthMomentumTracker;