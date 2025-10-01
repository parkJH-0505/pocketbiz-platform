/**
 * AxisDetailModal Component
 * 축별 상세 분석을 표시하는 모달
 */

import React, { useEffect, useCallback, useMemo, memo } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle,
  Target,
  BarChart2,
  Activity
} from 'lucide-react';
import type { AxisKey, ProcessedKPIData } from '@/types/reportV3.types';
import { generateAxisDetailData } from '@/utils/axisDetailGenerator';

interface AxisDetailModalProps {
  isOpen: boolean;
  axis: AxisKey | null;
  processedData: ProcessedKPIData[];
  onClose: () => void;
}

// React.memo로 최적화 - props가 변경되지 않으면 리렌더링 방지
export const AxisDetailModal = memo<AxisDetailModalProps>(({
  isOpen,
  axis,
  processedData,
  onClose
}) => {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // 축별 상세 데이터 생성
  const axisDetail = useMemo(() => {
    if (!axis || !processedData || processedData.length === 0) return null;
    return generateAxisDetailData(axis, processedData);
  }, [axis, processedData]);

  // 모달이 열리지 않았거나 데이터가 없으면 null 반환
  if (!isOpen || !axisDetail) return null;

  // 상태별 색상 결정
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'fair': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // 가중치별 배지 색상
  const getWeightBadge = (weight: string) => {
    switch (weight) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'important': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* 모달 컨테이너 */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{axisDetail.axisName} 상세 분석</h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {axisDetail.summary.completedKPIs}개 KPI 진단 완료
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* 바디 */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
              {/* 요약 카드들 */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <BarChart2 className="text-indigo-500" size={20} />
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(axisDetail.summary.status)}`}>
                      {axisDetail.summary.status === 'excellent' ? '우수' :
                       axisDetail.summary.status === 'good' ? '양호' :
                       axisDetail.summary.status === 'fair' ? '보통' : '미흡'}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {axisDetail.summary.averageScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">평균 점수</div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Target className="text-blue-500" size={20} />
                    <div className="flex items-center gap-1">
                      {axisDetail.summary.trend === 'up' ? (
                        <TrendingUp className="text-green-500" size={16} />
                      ) : axisDetail.summary.trend === 'down' ? (
                        <TrendingDown className="text-red-500" size={16} />
                      ) : (
                        <Minus className="text-gray-400" size={16} />
                      )}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {axisDetail.summary.completedKPIs}/{axisDetail.summary.totalKPIs}
                  </div>
                  <div className="text-xs text-gray-500">진단 완료</div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="text-green-500" size={20} />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {axisDetail.summary.percentile.toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500">백분위</div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    {axisDetail.summary.trendValue && axisDetail.summary.trendValue > 0 ? (
                      <TrendingUp className="text-green-500" size={20} />
                    ) : (
                      <TrendingDown className="text-red-500" size={20} />
                    )}
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {axisDetail.summary.trendValue ?
                      `${axisDetail.summary.trendValue > 0 ? '+' : ''}${axisDetail.summary.trendValue.toFixed(1)}%` :
                      '0%'
                    }
                  </div>
                  <div className="text-xs text-gray-500">변화율</div>
                </div>
              </div>

              {/* KPI 상세 테이블 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">KPI 성과 현황</h3>
                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          KPI명
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          점수
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          상태
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          가중치
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          개선방안
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          벤치마크
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {axisDetail.kpiBreakdown.map((kpi, index) => (
                        <tr key={kpi.kpiId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {kpi.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className="font-semibold">{kpi.score.toFixed(1)}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {kpi.status === 'excellent' ? (
                              <CheckCircle className="inline text-green-500" size={18} />
                            ) : kpi.status === 'poor' ? (
                              <AlertCircle className="inline text-red-500" size={18} />
                            ) : (
                              <div className={`w-2 h-2 rounded-full inline-block ${
                                kpi.status === 'good' ? 'bg-blue-500' : 'bg-yellow-500'
                              }`} />
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs px-2 py-1 rounded border ${getWeightBadge(kpi.weight)}`}>
                              {kpi.weight === 'critical' ? '핵심' :
                               kpi.weight === 'important' ? '중요' : '일반'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {kpi.improvement}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="text-sm">
                              <span className="text-gray-500">{kpi.benchmark?.toFixed(0)}</span>
                              {kpi.gap && (
                                <div className={`text-xs ${kpi.gap > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {kpi.gap > 0 ? '+' : ''}{kpi.gap.toFixed(1)}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 인사이트 섹션 */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* 강점 & 약점 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">강점 & 약점</h3>
                  <div className="space-y-3">
                    {axisDetail.insights.strengths.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="font-medium text-green-800 mb-1">강점</div>
                        <ul className="text-sm text-green-700 space-y-1">
                          {axisDetail.insights.strengths.map((item, i) => (
                            <li key={i} className="flex items-start">
                              <CheckCircle className="mr-2 mt-0.5 flex-shrink-0" size={14} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {axisDetail.insights.weaknesses.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="font-medium text-red-800 mb-1">약점</div>
                        <ul className="text-sm text-red-700 space-y-1">
                          {axisDetail.insights.weaknesses.map((item, i) => (
                            <li key={i} className="flex items-start">
                              <AlertCircle className="mr-2 mt-0.5 flex-shrink-0" size={14} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* 기회 & 리스크 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">기회 & 리스크</h3>
                  <div className="space-y-3">
                    {axisDetail.insights.opportunities.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="font-medium text-blue-800 mb-1">기회</div>
                        <ul className="text-sm text-blue-700 space-y-1">
                          {axisDetail.insights.opportunities.map((item, i) => (
                            <li key={i} className="flex items-start">
                              <Target className="mr-2 mt-0.5 flex-shrink-0" size={14} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {axisDetail.insights.risks.length > 0 && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="font-medium text-orange-800 mb-1">리스크</div>
                        <ul className="text-sm text-orange-700 space-y-1">
                          {axisDetail.insights.risks.map((item, i) => (
                            <li key={i} className="flex items-start">
                              <AlertCircle className="mr-2 mt-0.5 flex-shrink-0" size={14} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 추천 액션 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">추천 액션 플랜</h3>
                <div className="space-y-3">
                  {axisDetail.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {rec.priority === 'high' ? '높음' :
                               rec.priority === 'medium' ? '중간' : '낮음'}
                            </span>
                            <span className="text-xs text-gray-500">{rec.timeframe}</span>
                          </div>
                          <div className="font-medium text-gray-800">{rec.action}</div>
                          <div className="text-sm text-gray-600 mt-1">예상 효과: {rec.impact}</div>
                        </div>
                        <div className="ml-4 text-2xl text-gray-400 font-bold">
                          {index + 1}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}, (prevProps, nextProps) => {
  // 커스텀 비교 함수 - true를 반환하면 리렌더링 스킵
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.axis === nextProps.axis &&
    prevProps.processedData === nextProps.processedData // 참조 비교
  );
});

AxisDetailModal.displayName = 'AxisDetailModal';