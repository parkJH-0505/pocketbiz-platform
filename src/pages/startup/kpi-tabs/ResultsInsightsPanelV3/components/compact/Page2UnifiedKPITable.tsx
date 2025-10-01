/**
 * Page 2: Unified KPI Table
 * Critical/Important/Standard 통합 테이블
 * Height: ~1200px (1 page)
 */

import React from 'react';
import type { ProcessedKPIData } from '@/types/reportV3.types';
import type { ClusterInfo } from '@/types/kpi.types';

interface Page2UnifiedKPITableProps {
  processedData: ProcessedKPIData[];
  cluster: ClusterInfo;
  className?: string;
}

export const Page2UnifiedKPITable: React.FC<Page2UnifiedKPITableProps> = ({
  processedData,
  cluster,
  className = ''
}) => {
  // 가중치별 그룹화
  const criticalKPIs = processedData.filter(item => item.weight.level === 'x3');
  const importantKPIs = processedData.filter(item => item.weight.level === 'x2');
  const standardKPIs = processedData.filter(item => item.weight.level === 'x1');

  return (
    <div className={`page-2-unified-table ${className}`} style={{ minHeight: '1200px' }}>
      {/* 헤더 */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          📊 KPI 전체 현황
        </h3>
        <p className="text-sm text-gray-600">
          가중치별 정렬 • 총 {processedData.length}개 KPI
        </p>
      </div>

      {/* Placeholder Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">가중치</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">KPI 항목</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">점수</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">리스크</th>
            </tr>
          </thead>
          <tbody>
            {/* Critical Group */}
            <tr className="bg-red-50">
              <td colSpan={5} className="px-4 py-2 text-sm font-semibold text-red-900">
                🔴 Critical (x3) - {criticalKPIs.length}개
              </td>
            </tr>
            {criticalKPIs.slice(0, 2).map((item, idx) => (
              <tr key={item.kpi.kpi_id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{idx + 1}</td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded">
                    x3
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{item.kpi.question.slice(0, 50)}...</td>
                <td className="px-4 py-3 text-sm font-bold text-indigo-600">
                  {item.processedValue.normalizedScore.toFixed(1)}
                </td>
                <td className="px-4 py-3 text-sm">{item.insights.riskLevel}</td>
              </tr>
            ))}

            {/* Important Group */}
            <tr className="bg-orange-50">
              <td colSpan={5} className="px-4 py-2 text-sm font-semibold text-orange-900">
                🟠 Important (x2) - {importantKPIs.length}개
              </td>
            </tr>

            {/* Standard Group */}
            <tr className="bg-gray-50">
              <td colSpan={5} className="px-4 py-2 text-sm font-semibold text-gray-900">
                ⚪ Standard (x1) - {standardKPIs.length}개
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Placeholder notice */}
      <div className="mt-6 p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
        <p className="text-gray-500 text-sm">
          🚧 Unified KPI Table 전체 구현 예정 (Phase 4.4)
        </p>
        <p className="text-xs text-gray-400 mt-2">
          정렬, 필터, 확장/축소 기능 포함
        </p>
      </div>
    </div>
  );
};
