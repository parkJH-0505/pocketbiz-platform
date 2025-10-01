/**
 * CriticalKPISection Component
 * x3 가중치 KPI를 큰 카드로 표시하는 섹션
 */

import React from 'react';
import { AlertCircle, Target } from 'lucide-react';
import type { ProcessedKPIData } from '@/types/reportV3.types';
import type { ClusterInfo } from '@/types/kpi.types';
import { NumericKPICard } from './NumericKPICard';
import { RubricKPICard } from './RubricKPICard';
import { MultiSelectKPICard } from './MultiSelectKPICard';

interface CriticalKPISectionProps {
  processedData: ProcessedKPIData[];
  cluster: ClusterInfo;
  className?: string;
}

export const CriticalKPISection: React.FC<CriticalKPISectionProps> = ({
  processedData,
  cluster,
  className = ''
}) => {
  // x3 가중치 KPI만 필터링
  const criticalKPIs = processedData
    .filter(item => item.weight.level === 'x3')
    .sort((a, b) => b.weight.priority - a.weight.priority); // 우선순위 높은 순

  if (criticalKPIs.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-8 text-center ${className}`}>
        <Target size={40} className="mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600">
          현재 x3 가중치의 Critical KPI가 없습니다.
        </p>
      </div>
    );
  }

  // KPI 타입에 따라 적절한 카드 컴포넌트 렌더링
  const renderKPICard = (item: ProcessedKPIData, index: number) => {
    const { kpi } = item;
    const key = `critical-${kpi.kpi_id}-${index}`;

    switch (kpi.input_type) {
      case 'numeric_input':
      case 'percentage_input':
        return (
          <NumericKPICard
            key={key}
            data={item}
            cluster={cluster}
            size="large"
          />
        );

      case 'rubric':
        return (
          <RubricKPICard
            key={key}
            data={item}
            cluster={cluster}
            size="large"
          />
        );

      case 'multi_select':
      case 'single_select':
        return (
          <MultiSelectKPICard
            key={key}
            data={item}
            cluster={cluster}
            size="large"
          />
        );

      default:
        // Fallback for unknown types
        return (
          <div
            key={key}
            className="bg-white border border-gray-300 rounded-lg p-6"
          >
            <p className="text-sm text-gray-500">
              Unsupported KPI type: {kpi.input_type}
            </p>
          </div>
        );
    }
  };

  return (
    <div className={className}>
      {/* 섹션 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg">
            <AlertCircle size={24} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Critical Metrics
            </h3>
            <p className="text-sm text-gray-600">
              가장 중요한 지표 (x3 가중치) • {criticalKPIs.length}개
            </p>
          </div>
        </div>
        <div className="h-1 w-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-full"></div>
      </div>

      {/* KPI 카드 그리드 */}
      <div className="space-y-6">
        {criticalKPIs.map((item, index) => renderKPICard(item, index))}
      </div>

      {/* 하단 안내 */}
      {criticalKPIs.length > 0 && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>💡 Tip:</strong> 이 지표들은 귀사의 성장 단계에서 가장 큰 영향을 미치는 핵심 요소입니다.
            우선적으로 개선하고 정기적으로 모니터링하세요.
          </p>
        </div>
      )}
    </div>
  );
};