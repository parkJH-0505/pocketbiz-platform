/**
 * BenchmarkComparisonTable Component
 * 업계 비교 테이블
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { BenchmarkComparison } from '../../../utils/benchmarkDataExtractor';

interface BenchmarkComparisonTableProps {
  comparisons: BenchmarkComparison[];
  className?: string;
}

export const BenchmarkComparisonTable: React.FC<BenchmarkComparisonTableProps> = ({
  comparisons,
  className = ''
}) => {
  const getStatusIcon = (status: 'above' | 'at' | 'below') => {
    switch (status) {
      case 'above':
        return <TrendingUp size={14} className="text-green-600" />;
      case 'below':
        return <TrendingDown size={14} className="text-red-600" />;
      case 'at':
        return <Minus size={14} className="text-gray-600" />;
    }
  };

  const getGapColor = (gap: number) => {
    if (gap > 5) return 'text-green-600';
    if (gap < -5) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className={`benchmark-comparison-table ${className}`}>
      <div className="mb-3">
        <h4 className="text-sm font-bold text-gray-900">📊 업계 벤치마크 비교</h4>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">
                  영역
                </th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700">
                  내 점수
                </th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700">
                  업계 평균
                </th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700">
                  상위 25%
                </th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700">
                  차이
                </th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700">
                  상태
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((comp, idx) => (
                <tr
                  key={comp.axis}
                  className={`border-b border-gray-100 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  {/* 영역 */}
                  <td className="px-3 py-2">
                    <span className="font-medium text-gray-900">
                      {comp.displayName}
                    </span>
                  </td>

                  {/* 내 점수 */}
                  <td className="px-3 py-2 text-center">
                    <span className="font-bold text-indigo-600">
                      {comp.myScore.toFixed(1)}
                    </span>
                  </td>

                  {/* 업계 평균 */}
                  <td className="px-3 py-2 text-center">
                    <span className="text-gray-700">
                      {comp.industryAvg.toFixed(1)}
                    </span>
                  </td>

                  {/* 상위 25% */}
                  <td className="px-3 py-2 text-center">
                    <span className="text-gray-700">
                      {comp.topQuartile.toFixed(1)}
                    </span>
                  </td>

                  {/* 차이 */}
                  <td className="px-3 py-2 text-center">
                    <span className={`font-bold ${getGapColor(comp.gap)}`}>
                      {comp.gap > 0 ? '+' : ''}
                      {comp.gap.toFixed(1)}
                    </span>
                  </td>

                  {/* 상태 */}
                  <td className="px-3 py-2 text-center">
                    {getStatusIcon(comp.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-700">
            업계 평균 이상: <span className="font-bold text-green-600">
              {comparisons.filter((c) => c.status === 'above').length}개
            </span>
          </span>
          <span className="text-gray-700">
            업계 평균 이하: <span className="font-bold text-red-600">
              {comparisons.filter((c) => c.status === 'below').length}개
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};
