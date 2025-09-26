/**
 * Company Vital Signs Component (통합 버전)
 *
 * 회사 생체신호 + 성장 모멘텀 통합
 * - 섹션 1: KPI 생체신호 (기존 CompanyVitalSigns)
 * - 섹션 2: 성장 추적 (GrowthMomentumTracker 통합)
 * - 스크롤 방식으로 연속 표시
 * - 실제 Context 데이터 완전 연동
 */

import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
  Target,
  Award,
  Activity,
  Zap,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { useKPIDiagnosis } from '../../contexts/KPIDiagnosisContext';
import { useBuildupContext } from '../../contexts/BuildupContext';
import { useNavigate } from 'react-router-dom';
import type { AxisKey } from '../../types';

interface CompanyVitalSignsProps {
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

// 점수별 색상 결정 함수
const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const getScoreBgColor = (score: number) => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
};

const CompanyVitalSigns: React.FC<CompanyVitalSignsProps> = ({ className = '' }) => {
  const navigate = useNavigate();

  // Context 데이터 가져오기
  const { axisScores, overallScore, previousScores, progress } = useKPIDiagnosis();
  const { activeProjects, completedProjects } = useBuildupContext();

  // 점수 변화 계산 (섹션 1용)
  const scoreChanges = useMemo(() => {
    const changes: Record<AxisKey, number> = {} as Record<AxisKey, number>;
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

    axes.forEach(axis => {
      const current = axisScores[axis] || 0;
      const previous = previousScores[axis] || 0;
      changes[axis] = current - previous;
    });

    return changes;
  }, [axisScores, previousScores]);

  // 전체 점수 변화 계산
  const overallChange = useMemo(() => {
    const currentAvg = Object.values(axisScores).reduce((sum, score) => sum + (score || 0), 0) / 5;
    const previousAvg = Object.values(previousScores).reduce((sum, score) => sum + (score || 0), 0) / 5;
    return currentAvg - previousAvg;
  }, [axisScores, previousScores]);

  // 성장 모멘텀 계산 (섹션 2용 - GrowthMomentumTracker 로직)
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
      diagnosisProgress: progress.percentage,
      currentScore: currentAvg
    };
  }, [axisScores, previousScores, activeProjects, completedProjects, progress]);

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

    return changes.sort((a, b) => b.change - a.change).slice(0, 3);
  }, [axisScores, previousScores]);

  // 가장 낮은 축 찾기 (개선 필요 영역)
  const weakestAxes = useMemo(() => {
    const scores: Array<{axis: AxisKey, score: number, label: string}> = [];

    (['GO', 'EC', 'PT', 'PF', 'TO'] as AxisKey[]).forEach(axis => {
      scores.push({
        axis,
        score: axisScores[axis] || 0,
        label: AXIS_LABELS[axis]
      });
    });

    return scores.sort((a, b) => a.score - b.score).slice(0, 2);
  }, [axisScores]);

  return (
    <div className={`${className} max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100`}>
      {/* KPI 위험 알림 - 70점 미만일 때만 표시 */}
      {overallScore < 70 && (
        <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-orange-900">⚠️ KPI 개선 필요</h4>
              <p className="text-sm text-gray-700 mt-1">
                종합 점수 <span className="font-bold">{overallScore.toFixed(1)}점</span> - 전반적인 균형 점검이 필요합니다
              </p>
              <p className="text-xs text-gray-600 mt-2">
                가장 취약한 영역: {weakestAxes[0]?.label} ({weakestAxes[0]?.score.toFixed(1)}점)
              </p>
              <button
                onClick={() => navigate('/startup/kpi/diagnosis')}
                className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-colors"
              >
                KPI 진단 시작하기 →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 섹션 1: KPI 생체신호 */}
      <div className="bg-white rounded-xl p-6 mb-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">회사 생체신호</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            실시간 모니터링
          </div>
        </div>

        {/* 종합 점수 카드 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {overallScore ? overallScore.toFixed(1) : '0.0'}
              </div>
              <div className="text-sm text-gray-600 mt-1">종합 건강도 점수</div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                {overallChange >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
                <span className={`text-lg font-bold ${overallChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {overallChange >= 0 ? '+' : ''}{overallChange.toFixed(1)}
                </span>
              </div>
              <div className="text-xs text-gray-600">전월 대비</div>
            </div>
          </div>
        </div>

        {/* 5축 점수 상세 */}
        <div className="space-y-3 mb-6">
          <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gray-600" />
            5축 점수 상세
          </h4>
          {(['GO', 'EC', 'PT', 'PF', 'TO'] as AxisKey[]).map((axis) => {
            const score = axisScores[axis] || 0;
            const change = scoreChanges[axis];
            const bgColor = getScoreBgColor(score);

            return (
              <div key={axis} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${bgColor}`}></div>
                  <span className="text-sm font-medium text-gray-700">{AXIS_LABELS[axis]}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${bgColor}`}
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                  <span className="font-bold text-sm w-12 text-right">{score.toFixed(0)}점</span>
                  <span className={`text-xs w-10 text-right ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {change >= 0 ? '+' : ''}{change.toFixed(1)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 프로젝트 현황 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">진행중 프로젝트</span>
              <Zap className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{activeProjects.length}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">완료 프로젝트</span>
              <Award className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600 mt-1">{completedProjects.length}</div>
          </div>
        </div>

        {/* 진단 진행률 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">KPI 진단 진행률</span>
            <span className="font-bold text-sm">{progress.percentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
            <span>{progress.completed}개 완료</span>
            <span>총 {progress.total}개 항목</span>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/startup/kpi?tab=insights')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <BarChart3 className="w-4 h-4" />
            상세 분석 보기
          </button>
          <button
            onClick={() => navigate('/startup/kpi?tab=assess')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            진단 계속하기
          </button>
        </div>
      </div>

      {/* 구분선 */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-gray-200"></div>
        <span className="text-xs text-gray-500 font-medium">성장 추적</span>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      {/* 섹션 2: 성장 모멘텀 트래커 */}
      <div className="bg-white rounded-xl p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-bold text-gray-900">성장 모멘텀</h3>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            momentum.scoreChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <ArrowUpRight className="w-3 h-3" />
            {momentum.scoreChange >= 0 ? '상승 추세' : '하락 추세'}
          </div>
        </div>

        {/* 주요 지표 그리드 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600">점수 변화</span>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className={`text-2xl font-bold ${momentum.scoreChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {momentum.scoreChange >= 0 ? '+' : ''}{momentum.scoreChange.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 mt-1">전월 대비</div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600">프로젝트 완료율</span>
              <Award className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {momentum.completionRate.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {completedProjects.length}/{activeProjects.length + completedProjects.length}개
            </div>
          </div>
        </div>

        {/* 목표 달성 진행률 */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">목표 달성 현황</span>
            </div>
            <span className="text-sm font-bold text-purple-600">
              {momentum.remainingToTarget.toFixed(1)}점 남음
            </span>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${momentum.targetProgress}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-600">
              <span>현재: {momentum.currentScore.toFixed(0)}점</span>
              <span className="font-medium">목표: {momentum.targetScore}점</span>
              <span>{momentum.targetProgress.toFixed(0)}% 달성</span>
            </div>
          </div>
        </div>

        {/* 개선 영역 & 집중 영역 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* 이번 달 개선 영역 */}
          <div>
            <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-500" />
              이번 달 개선 영역
            </h4>
            <div className="space-y-2">
              {improvedAxes.length > 0 ? (
                improvedAxes.map((axisData, index) => (
                  <div key={axisData.axis} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">{axisData.label}</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">
                      +{axisData.change.toFixed(1)}점
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-sm text-gray-500">
                  아직 개선된 영역이 없습니다
                </div>
              )}
            </div>
          </div>

          {/* 집중 필요 영역 */}
          <div>
            <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              집중 필요 영역
            </h4>
            <div className="space-y-2">
              {weakestAxes.map((axisData) => (
                <div key={axisData.axis} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{axisData.label}</span>
                  </div>
                  <span className={`text-sm font-bold ${getScoreColor(axisData.score)}`}>
                    {axisData.score.toFixed(0)}점
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/startup/kpi?tab=action')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all text-sm font-medium"
          >
            <Target className="w-4 h-4" />
            액션플랜 보기
          </button>
          <button
            onClick={() => navigate('/startup/buildup')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <Zap className="w-4 h-4" />
            프로젝트 관리
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyVitalSigns;