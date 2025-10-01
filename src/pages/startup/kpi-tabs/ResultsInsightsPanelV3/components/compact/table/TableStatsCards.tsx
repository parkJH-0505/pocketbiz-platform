/**
 * TableStatsCards Component
 * 테이블 하단 통계 카드 (3개)
 */

import React from 'react';
import { BarChart3, CheckCircle, AlertCircle } from 'lucide-react';
import type { TableStats } from '../../../utils/unifiedKPIDataBuilder';

interface TableStatsCardsProps {
  stats: TableStats;
  className?: string;
}

export const TableStatsCards: React.FC<TableStatsCardsProps> = ({
  stats,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-3 gap-4 ${className}`}>
      {/* 평균 점수 */}
      <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 size={18} className="text-gray-600" />
          <span className="text-xs font-semibold text-gray-700">평균 점수</span>
        </div>
        <p className="text-3xl font-bold text-gray-900">
          {stats.avgScore.toFixed(1)}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          총 {stats.total}개 KPI
        </p>
      </div>

      {/* 우수 항목 */}
      <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle size={18} className="text-green-600" />
          <span className="text-xs font-semibold text-gray-700">우수 항목</span>
        </div>
        <p className="text-3xl font-bold text-green-600">
          {stats.excellentCount}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          70점 이상 (
          {stats.total > 0
            ? ((stats.excellentCount / stats.total) * 100).toFixed(0)
            : 0}
          %)
        </p>
      </div>

      {/* 개선 필요 */}
      <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle size={18} className="text-red-600" />
          <span className="text-xs font-semibold text-gray-700">개선 필요</span>
        </div>
        <p className="text-3xl font-bold text-red-600">
          {stats.needsImprovementCount}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          High Risk (
          {stats.total > 0
            ? ((stats.needsImprovementCount / stats.total) * 100).toFixed(0)
            : 0}
          %)
        </p>
      </div>
    </div>
  );
};
