/**
 * Page 2: Unified KPI Table
 * Critical/Important/Standard 통합 테이블
 * Height: ~1200px (1 page)
 */

import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ProcessedKPIData } from '@/types/reportV3.types';
import type { ClusterInfo } from '@/types/kpi.types';
import {
  buildUnifiedKPIRows,
  getWeightGroups,
  calculateTableStats,
  type UnifiedKPIRow as UnifiedKPIRowType
} from '../../utils/unifiedKPIDataBuilder';
import { UnifiedKPIRow } from './table/UnifiedKPIRow';
import { TableStatsCards } from './table/TableStatsCards';

interface Page2UnifiedKPITableProps {
  processedData: ProcessedKPIData[];
  cluster: ClusterInfo;
  className?: string;
}

type SortKey = 'priority' | 'score' | 'risk' | 'benchmark';
type SortDirection = 'asc' | 'desc';

export const Page2UnifiedKPITable: React.FC<Page2UnifiedKPITableProps> = ({
  processedData,
  cluster,
  className = ''
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('priority');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set(['x1'])); // x1은 기본적으로 접힌 상태

  // Unified KPI Rows 생성
  const unifiedRows = useMemo(
    () => buildUnifiedKPIRows(processedData),
    [processedData]
  );

  // 가중치 그룹 정보
  const weightGroups = useMemo(
    () => getWeightGroups(unifiedRows),
    [unifiedRows]
  );

  // 테이블 통계
  const tableStats = useMemo(
    () => calculateTableStats(unifiedRows),
    [unifiedRows]
  );

  // 정렬된 행
  const sortedRows = useMemo(() => {
    const sorted = [...unifiedRows].sort((a, b) => {
      let comparison = 0;

      switch (sortKey) {
        case 'priority':
          // 가중치 우선, 그 다음 priority
          if (a.weightPriority !== b.weightPriority) {
            comparison = a.weightPriority - b.weightPriority;
          } else {
            comparison = b.priority - a.priority;
          }
          break;
        case 'score':
          comparison = b.score - a.score;
          break;
        case 'risk':
          const riskOrder = { high: 3, medium: 2, low: 1 };
          comparison = riskOrder[b.risk] - riskOrder[a.risk];
          break;
        case 'benchmark':
          const aBench = a.benchmark || -999;
          const bBench = b.benchmark || -999;
          comparison = bBench - aBench;
          break;
      }

      return sortDirection === 'desc' ? comparison : -comparison;
    });

    return sorted;
  }, [unifiedRows, sortKey, sortDirection]);

  // 정렬 토글
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  // 그룹 접기/펴기 토글
  const toggleGroup = (weight: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(weight)) {
        newSet.delete(weight);
      } else {
        newSet.add(weight);
      }
      return newSet;
    });
  };

  // 정렬 아이콘
  const SortIcon = ({ active, direction }: { active: boolean; direction: SortDirection }) => {
    if (!active) return <ChevronDown size={14} className="text-gray-400" />;
    return direction === 'desc' ? (
      <ChevronDown size={14} className="text-indigo-600" />
    ) : (
      <ChevronUp size={14} className="text-indigo-600" />
    );
  };

  // 가중치별 행 렌더링
  const renderRowsByWeight = () => {
    const elements: JSX.Element[] = [];
    let globalIndex = 0;

    weightGroups.forEach((group) => {
      if (group.count === 0) return;

      const groupRows = sortedRows.filter(row => row.weight === group.weight);
      const isCollapsed = collapsedGroups.has(group.weight);

      // 그룹 헤더
      elements.push(
        <tr key={`group-${group.weight}`} className={`${group.color.bg} border-b-2`}>
          <td colSpan={8} className="px-4 py-3">
            <button
              onClick={() => toggleGroup(group.weight)}
              className="flex items-center gap-2 w-full text-left hover:opacity-80 transition-opacity"
            >
              <span className="text-lg">{group.icon}</span>
              <span className={`text-sm font-semibold ${group.color.text}`}>
                {group.label} ({group.weight}) - {group.count}개
              </span>
              {isCollapsed ? (
                <ChevronDown size={16} className={group.color.text} />
              ) : (
                <ChevronUp size={16} className={group.color.text} />
              )}
            </button>
          </td>
        </tr>
      );

      // 그룹 행들
      if (!isCollapsed) {
        groupRows.forEach((row) => {
          elements.push(
            <UnifiedKPIRow
              key={row.id}
              row={row}
              index={globalIndex}
            />
          );
          globalIndex++;
        });
      }
    });

    return elements;
  };

  return (
    <div className={`page-2-unified-table ${className}`} style={{ minHeight: '1200px' }}>
      {/* 헤더 */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          📊 KPI 전체 현황
        </h3>
        <p className="text-sm text-gray-600">
          가중치별 정렬 • 총 {unifiedRows.length}개 KPI • {cluster.sector} / {cluster.stage}
        </p>
      </div>

      {/* 테이블 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 text-left w-12">
                  <button
                    onClick={() => handleSort('priority')}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-indigo-600 transition-colors"
                  >
                    #
                    <SortIcon active={sortKey === 'priority'} direction={sortDirection} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left w-20">
                  <span className="text-xs font-semibold text-gray-700">가중치</span>
                </th>
                <th className="px-3 py-3 text-left">
                  <span className="text-xs font-semibold text-gray-700">KPI 항목</span>
                </th>
                <th className="px-3 py-3 text-left w-28">
                  <span className="text-xs font-semibold text-gray-700">응답값</span>
                </th>
                <th className="px-3 py-3 text-left w-32">
                  <button
                    onClick={() => handleSort('score')}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-indigo-600 transition-colors"
                  >
                    점수
                    <SortIcon active={sortKey === 'score'} direction={sortDirection} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left w-24">
                  <button
                    onClick={() => handleSort('risk')}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-indigo-600 transition-colors"
                  >
                    리스크
                    <SortIcon active={sortKey === 'risk'} direction={sortDirection} />
                  </button>
                </th>
                <th className="px-3 py-3 text-center w-24">
                  <button
                    onClick={() => handleSort('benchmark')}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-indigo-600 transition-colors mx-auto"
                  >
                    벤치마크
                    <SortIcon active={sortKey === 'benchmark'} direction={sortDirection} />
                  </button>
                </th>
                <th className="px-3 py-3 text-center w-16">
                  <span className="text-xs font-semibold text-gray-700">상세</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {renderRowsByWeight()}
            </tbody>
          </table>
        </div>
      </div>

      {/* 하단 통계 */}
      <TableStatsCards stats={tableStats} />
    </div>
  );
};
