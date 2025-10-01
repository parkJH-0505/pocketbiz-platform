/**
 * UnifiedKPIRow Component
 * 확장 가능한 KPI 행 (클릭하면 상세 정보 표시)
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { UnifiedKPIRow as UnifiedKPIRowType } from '../../../utils/unifiedKPIDataBuilder';

interface UnifiedKPIRowProps {
  row: UnifiedKPIRowType;
  index: number;
  className?: string;
}

export const UnifiedKPIRow: React.FC<UnifiedKPIRowProps> = ({
  row,
  index,
  className = ''
}) => {
  const [expanded, setExpanded] = useState(false);

  // 가중치 뱃지 색상
  const getWeightBadgeColor = (weight: 'x3' | 'x2' | 'x1') => {
    switch (weight) {
      case 'x3': return 'bg-red-100 text-red-700 border-red-300';
      case 'x2': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'x1': return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  // 점수 색상
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  // 리스크 뱃지 색상
  const getRiskBadgeColor = (risk: 'high' | 'medium' | 'low') => {
    switch (risk) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  const getRiskLabel = (risk: 'high' | 'medium' | 'low') => {
    switch (risk) {
      case 'high': return '높음';
      case 'medium': return '중간';
      case 'low': return '낮음';
    }
  };

  // 벤치마크 표시
  const renderBenchmark = () => {
    if (row.benchmark === null) {
      return <span className="text-xs text-gray-400">-</span>;
    }

    const isPositive = row.benchmark > 0;
    const color = isPositive ? 'text-green-600' : 'text-red-600';

    return (
      <span className={`text-xs font-semibold ${color}`}>
        {isPositive ? '+' : ''}{row.benchmark.toFixed(1)}
      </span>
    );
  };

  return (
    <>
      {/* 메인 행 */}
      <tr
        className={`border-b hover:bg-gray-50 transition-colors cursor-pointer ${className}`}
        onClick={() => setExpanded(!expanded)}
      >
        {/* 순번 */}
        <td className="px-3 py-3">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
            {index + 1}
          </span>
        </td>

        {/* 가중치 */}
        <td className="px-3 py-3">
          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded border ${getWeightBadgeColor(row.weight)}`}>
            {row.weight}
          </span>
        </td>

        {/* KPI 항목 */}
        <td className="px-3 py-3 max-w-md">
          <p className="text-sm font-medium text-gray-900 line-clamp-2">
            {row.kpiName}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {row.inputType}
          </p>
        </td>

        {/* 응답값 */}
        <td className="px-3 py-3">
          <span className="text-sm text-gray-700 font-medium">
            {row.response}
          </span>
        </td>

        {/* 점수 */}
        <td className="px-3 py-3">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${getScoreColor(row.score)}`}>
              {row.score.toFixed(1)}
            </span>
            <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  row.score >= 80 ? 'bg-green-500' :
                  row.score >= 60 ? 'bg-blue-500' :
                  row.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(row.score, 100)}%` }}
              />
            </div>
          </div>
        </td>

        {/* 리스크 */}
        <td className="px-3 py-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRiskBadgeColor(row.risk)}`}>
            {getRiskLabel(row.risk)}
          </span>
        </td>

        {/* 벤치마크 */}
        <td className="px-3 py-3 text-center">
          {renderBenchmark()}
        </td>

        {/* 확장 토글 */}
        <td className="px-3 py-3 text-center">
          <button
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? (
              <ChevronUp size={16} className="text-gray-600" />
            ) : (
              <ChevronDown size={16} className="text-gray-600" />
            )}
          </button>
        </td>
      </tr>

      {/* 확장된 상세 정보 */}
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={8} className="px-4 py-4">
            <div className="space-y-3 max-w-4xl">
              {/* AI 인사이트 */}
              {row.details.interpretation && (
                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                  <p className="text-xs font-semibold text-gray-700 mb-1">
                    💡 AI 인사이트
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {row.details.interpretation}
                  </p>
                </div>
              )}

              {/* 벤치마크 정보 */}
              {row.details.benchmarkIndustryAvg !== undefined && (
                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                  <p className="text-xs font-semibold text-gray-700 mb-2">
                    📊 벤치마크 비교
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-xs text-gray-600">업계 평균</span>
                      <p className="text-sm font-semibold text-gray-800">
                        {row.details.benchmarkIndustryAvg.toFixed(1)}점
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">내 점수</span>
                      <p className="text-sm font-semibold text-indigo-600">
                        {row.score.toFixed(1)}점
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">차이</span>
                      <p className={`text-sm font-semibold ${
                        row.benchmark && row.benchmark > 0 ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {row.benchmark !== null ? (
                          <>
                            {row.benchmark > 0 ? '+' : ''}
                            {row.benchmark.toFixed(1)}점
                          </>
                        ) : '-'}
                      </p>
                    </div>
                  </div>
                  {row.details.benchmarkSource && (
                    <p className="text-xs text-gray-500 mt-2">
                      출처: {row.details.benchmarkSource}
                    </p>
                  )}
                </div>
              )}

              {/* 가중치 설명 */}
              {row.details.weightExplanation && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-semibold text-blue-900 mb-1">
                    ⚖️ 가중치 설명 ({row.weight})
                  </p>
                  <p className="text-xs text-blue-800">
                    {row.details.weightExplanation}
                  </p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
