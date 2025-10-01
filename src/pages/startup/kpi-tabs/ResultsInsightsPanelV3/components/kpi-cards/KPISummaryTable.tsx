/**
 * KPISummaryTable Component
 * x1 가중치 KPI를 테이블 형식으로 간결하게 표시
 */

import React, { useState, useMemo } from 'react';
import { List, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import type { ProcessedKPIData, NumericProcessedValue, RubricProcessedValue, MultiSelectProcessedValue } from '@/types/reportV3.types';
import type { ClusterInfo } from '@/types/kpi.types';
import { ScoreDisplay } from '../shared/ScoreDisplay';

interface KPISummaryTableProps {
  processedData: ProcessedKPIData[];
  cluster: ClusterInfo;
  className?: string;
}

export const KPISummaryTable: React.FC<KPISummaryTableProps> = ({
  processedData,
  cluster,
  className = ''
}) => {
  const [sortKey, setSortKey] = useState<'priority' | 'score' | 'risk'>('priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // x1 가중치 KPI만 필터링
  const normalKPIs = useMemo(() => {
    const filtered = processedData.filter(item => item.weight.level === 'x1');

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortKey) {
        case 'priority':
          comparison = b.weight.priority - a.weight.priority;
          break;
        case 'score':
          comparison = (b.processedValue.normalizedScore || 0) - (a.processedValue.normalizedScore || 0);
          break;
        case 'risk':
          const riskOrder = { high: 3, medium: 2, low: 1 };
          comparison = riskOrder[b.insights.riskLevel] - riskOrder[a.insights.riskLevel];
          break;
      }

      return sortDirection === 'desc' ? comparison : -comparison;
    });

    return sorted;
  }, [processedData, sortKey, sortDirection]);

  if (normalKPIs.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-8 text-center ${className}`}>
        <List size={40} className="mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600">
          현재 x1 가중치의 Normal KPI가 없습니다.
        </p>
      </div>
    );
  }

  // 정렬 토글
  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  // 행 확장/축소
  const toggleRow = (kpiId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(kpiId)) {
        newSet.delete(kpiId);
      } else {
        newSet.add(kpiId);
      }
      return newSet;
    });
  };

  // 값 포맷팅
  const formatValue = (item: ProcessedKPIData): string => {
    const { kpi, processedValue } = item;

    switch (kpi.input_type) {
      case 'numeric_input':
      case 'percentage_input':
        const numericValue = processedValue as NumericProcessedValue;
        if (kpi.input_type === 'percentage_input') {
          return `${numericValue.value.toFixed(1)}%`;
        }
        return numericValue.value >= 1000
          ? numericValue.value.toLocaleString('ko-KR')
          : numericValue.value.toFixed(1);

      case 'rubric':
        const rubricValue = processedValue as RubricProcessedValue;
        return `Level ${rubricValue.selectedLevel}/${rubricValue.maxLevel}`;

      case 'multi_select':
      case 'single_select':
        const multiValue = processedValue as MultiSelectProcessedValue;
        return `${multiValue.selectedItems.length}개 선택`;

      default:
        return '-';
    }
  };

  // 정렬 아이콘
  const SortIcon = ({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) => {
    if (!active) return <ChevronDown size={14} className="text-gray-400" />;
    return direction === 'desc'
      ? <ChevronDown size={14} className="text-indigo-600" />
      : <ChevronUp size={14} className="text-indigo-600" />;
  };

  return (
    <div className={className}>
      {/* 섹션 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
            <List size={24} className="text-gray-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Standard Metrics
            </h3>
            <p className="text-sm text-gray-600">
              기본 관리 지표 (x1 가중치) • {normalKPIs.length}개
            </p>
          </div>
        </div>
        <div className="h-1 w-20 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full"></div>
      </div>

      {/* 테이블 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('priority')}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-indigo-600 transition-colors"
                  >
                    우선순위
                    <SortIcon active={sortKey === 'priority'} direction={sortDirection} />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-xs font-semibold text-gray-700">KPI 항목</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-xs font-semibold text-gray-700">응답값</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('score')}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-indigo-600 transition-colors"
                  >
                    점수
                    <SortIcon active={sortKey === 'score'} direction={sortDirection} />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('risk')}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-indigo-600 transition-colors"
                  >
                    리스크
                    <SortIcon active={sortKey === 'risk'} direction={sortDirection} />
                  </button>
                </th>
                <th className="px-4 py-3 text-center">
                  <span className="text-xs font-semibold text-gray-700">상세</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {normalKPIs.map((item, index) => {
                const isExpanded = expandedRows.has(item.kpi.kpi_id);
                const riskColor = {
                  high: 'text-red-600 bg-red-50',
                  medium: 'text-yellow-600 bg-yellow-50',
                  low: 'text-green-600 bg-green-50'
                };

                return (
                  <React.Fragment key={item.kpi.kpi_id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      {/* 우선순위 */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                          #{item.weight.priority}
                        </span>
                      </td>

                      {/* KPI 항목 */}
                      <td className="px-4 py-3">
                        <div className="max-w-md">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">
                            {item.kpi.question}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {item.kpi.input_type}
                          </p>
                        </div>
                      </td>

                      {/* 응답값 */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700 font-medium">
                          {formatValue(item)}
                        </span>
                      </td>

                      {/* 점수 */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-indigo-600">
                            {item.processedValue.normalizedScore.toFixed(1)}
                          </span>
                          <div className="w-16">
                            <ScoreDisplay
                              score={item.processedValue.normalizedScore}
                              variant="linear"
                              showLabel={false}
                              className="h-1.5"
                            />
                          </div>
                        </div>
                      </td>

                      {/* 리스크 */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${riskColor[item.insights.riskLevel]}`}>
                          {item.insights.riskLevel === 'high' ? '높음' :
                           item.insights.riskLevel === 'medium' ? '중간' : '낮음'}
                        </span>
                      </td>

                      {/* 상세 토글 */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleRow(item.kpi.kpi_id)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp size={18} className="text-gray-600" />
                          ) : (
                            <ChevronDown size={18} className="text-gray-600" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* 확장된 상세 정보 */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 bg-gray-50">
                          <div className="space-y-3">
                            {/* 인사이트 */}
                            {item.insights.summary && (
                              <div className="p-3 bg-white border border-gray-200 rounded-lg">
                                <p className="text-xs font-semibold text-gray-700 mb-1">AI 인사이트</p>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {item.insights.interpretation || item.insights.summary}
                                </p>
                              </div>
                            )}

                            {/* 벤치마크 정보 */}
                            {item.benchmarkInfo && (
                              <div className="p-3 bg-white border border-gray-200 rounded-lg">
                                <p className="text-xs font-semibold text-gray-700 mb-2">벤치마크 비교</p>
                                <div className="flex items-center gap-4">
                                  <div>
                                    <span className="text-xs text-gray-600">업계 평균</span>
                                    <p className="text-sm font-semibold text-gray-800">
                                      {item.benchmarkInfo.industryAverage.toFixed(1)}점
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-gray-600">차이</span>
                                    <p className={`text-sm font-semibold ${
                                      item.processedValue.normalizedScore >= item.benchmarkInfo.industryAverage
                                        ? 'text-green-600'
                                        : 'text-orange-600'
                                    }`}>
                                      {item.processedValue.normalizedScore >= item.benchmarkInfo.industryAverage ? '+' : ''}
                                      {(item.processedValue.normalizedScore - item.benchmarkInfo.industryAverage).toFixed(1)}점
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 가중치 설명 */}
                            {item.weight.emphasis && (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-xs font-semibold text-blue-900 mb-1">가중치 설명</p>
                                <p className="text-xs text-blue-800">
                                  {item.weight.emphasis}
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 하단 통계 */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">평균 점수</p>
          <p className="text-2xl font-bold text-gray-900">
            {(normalKPIs.reduce((sum, item) => sum + item.processedValue.normalizedScore, 0) / normalKPIs.length).toFixed(1)}
          </p>
        </div>
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">우수 항목</p>
          <p className="text-2xl font-bold text-green-600">
            {normalKPIs.filter(item => item.processedValue.normalizedScore >= 70).length}개
          </p>
        </div>
        <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">개선 필요</p>
          <p className="text-2xl font-bold text-red-600">
            {normalKPIs.filter(item => item.insights.riskLevel === 'high').length}개
          </p>
        </div>
      </div>
    </div>
  );
};