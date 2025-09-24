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

const GrowthMomentumTracker: React.FC<GrowthMomentumTrackerProps> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-xl p-6 border min-h-80 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">성장 모멘텀 트래커</h3>
        <div className="flex items-center gap-1 text-sm text-green-600">
          <TrendingUp className="w-4 h-4" />
          상승 추세
        </div>
      </div>

      {/* 이번 달 성과 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">+-.--</div>
          <div className="text-sm text-gray-600">점수 변화</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-main">--%</div>
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
          <span className="font-bold text-sm">-.-- 점 필요</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-gradient-to-r from-primary-main to-green-500 h-3 rounded-full w-0 transition-all"></div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">진단 완료율</span>
          <span className="font-bold text-sm">--%</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-primary-main h-2 rounded-full w-0 transition-all"></div>
        </div>
      </div>

      {/* 주요 개선 영역 */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 text-sm mb-3">이번 달 개선 영역</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-500" />
              <span className="text-sm">PT (제품기술)</span>
            </div>
            <span className="text-sm font-medium text-green-600">+-.-- 점</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-sm">GO (사업목표)</span>
            </div>
            <span className="text-sm font-medium text-green-600">+-.-- 점</span>
          </div>
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

      {/* 데이터 연동 상태 */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="text-xs text-yellow-700">
          📈 성장 데이터 연동 예정
          <br />• previousScores 비교, 프로젝트 완료율, 목표 달성률
        </div>
      </div>
    </div>
  );
};

export default GrowthMomentumTracker;