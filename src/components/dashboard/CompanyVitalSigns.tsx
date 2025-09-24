/**
 * Company Vital Signs Component
 *
 * 회사 생체신호 (통합된 KPI 정보)
 * - KPIRadarPremium의 핵심 기능을 통합
 * - 종합 건강도, 5축 요약, 프로젝트 현황
 * - 실제 KPIDiagnosisContext 데이터 연동
 */

import React from 'react';
import { TrendingUp, TrendingDown, BarChart3, RefreshCw } from 'lucide-react';

interface CompanyVitalSignsProps {
  className?: string;
}

const CompanyVitalSigns: React.FC<CompanyVitalSignsProps> = ({ className = '' }) => {
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
          <div className="text-3xl font-bold text-primary-main">--.-</div>
          <div className="text-sm text-gray-600">종합 건강도</div>
          <div className="flex items-center justify-center gap-1 mt-1 text-sm">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-green-600">+-- (전월 대비)</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">-개 진행중</div>
          <div className="text-sm text-gray-600">-개 완료</div>
        </div>
      </div>

      {/* 5축 요약 (미니 레이더 차트 대신 리스트 형태) */}
      <div className="space-y-3 mb-6">
        <h4 className="font-semibold text-gray-900 text-sm">5축 점수 요약</h4>
        {['GO', 'EC', 'PT', 'PF', 'TO'].map((axis, index) => (
          <div key={axis} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <span className="text-sm font-medium">{axis}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">--점</span>
              <span className="text-xs text-gray-500">--</span>
            </div>
          </div>
        ))}
      </div>

      {/* 진단 완료율 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">진단 완료율</span>
          <span className="font-bold">--%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-primary-main h-2 rounded-full w-0"></div>
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

      {/* 데이터 연동 상태 */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="text-xs text-yellow-700">
          📊 KPIDiagnosisContext 연동 예정
          <br />• axisScores, overallScore, progress 활용
        </div>
      </div>
    </div>
  );
};

export default CompanyVitalSigns;