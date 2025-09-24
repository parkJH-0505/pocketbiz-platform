/**
 * Company Vital Signs Component
 *
 * 회사 생체신호 (통합된 KPI 정보)
 * - KPIRadarPremium의 핵심 기능을 통합
 * - 종합 건강도, 5축 요약, 프로젝트 현황
 * - 실제 KPIDiagnosisContext 데이터 연동
 */

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, BarChart3, RefreshCw } from 'lucide-react';
import { useKPIDiagnosis } from '../../contexts/KPIDiagnosisContext';
import { useBuildupContext } from '../../contexts/BuildupContext';
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

const CompanyVitalSigns: React.FC<CompanyVitalSignsProps> = ({ className = '' }) => {
  // Context 데이터 가져오기
  const { axisScores, overallScore, previousScores, progress } = useKPIDiagnosis();
  const { activeProjects, completedProjects } = useBuildupContext();

  // 점수 변화 계산
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

  return (
    <div className={`bg-white rounded-xl p-6 border h-full ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">회사 생체신호</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          실시간 모니터링
        </div>
      </div>

      {/* 종합 점수 + 프로젝트 현황 */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary-main">
            {overallScore ? overallScore.toFixed(1) : '-.--'}
          </div>
          <div className="text-sm text-gray-600">종합 건강도</div>
          <div className="flex items-center justify-center gap-1 mt-1 text-sm">
            {overallChange >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className={overallChange >= 0 ? 'text-green-600' : 'text-red-600'}>
              {overallChange >= 0 ? '+' : ''}{overallChange.toFixed(1)} (전월 대비)
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">{activeProjects.length}개 진행중</div>
          <div className="text-sm text-gray-600">{completedProjects.length}개 완료</div>
        </div>
      </div>

      {/* 5축 요약 (미니 레이더 차트 대신 리스트 형태) */}
      <div className="space-y-3 mb-6">
        <h4 className="font-semibold text-gray-900 text-sm">5축 점수 요약</h4>
        {(['GO', 'EC', 'PT', 'PF', 'TO'] as AxisKey[]).map((axis) => {
          const score = axisScores[axis] || 0;
          const change = scoreChanges[axis];
          const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500';

          return (
            <div key={axis} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color}`}></div>
                <span className="text-sm font-medium">{AXIS_LABELS[axis]}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{score ? score.toFixed(0) : 0}점</span>
                <span className={`text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {change >= 0 ? '+' : ''}{change.toFixed(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 진단 완료율 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">진단 완료율</span>
          <span className="font-bold">{progress.percentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-main h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress.percentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
          <span>{progress.completed}개 완료</span>
          <span>총 {progress.total}개</span>
        </div>
      </div>

      {/* 액션 버튼들 */}
      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors">
          <BarChart3 className="w-4 h-4" />
          상세 분석
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-2 border border-primary-main text-primary-main rounded-lg hover:bg-primary-50 transition-colors">
          <RefreshCw className="w-4 h-4" />
          진단 계속
        </button>
      </div>

      {/* 연동 완료 표시 */}
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="text-xs text-green-700">
          ✅ 실시간 KPI 데이터 연동 완료
          <br />• 실제 axisScores, overallScore, progress 표시
        </div>
      </div>
    </div>
  );
};

export default CompanyVitalSigns;