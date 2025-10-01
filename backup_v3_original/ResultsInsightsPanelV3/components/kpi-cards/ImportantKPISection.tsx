/**
 * ImportantKPISection Component
 * x2 가중치 KPI를 중간 크기 카드로 2열 그리드로 표시하는 섹션
 */

import React from 'react';
import { Star, Target } from 'lucide-react';
import type { ProcessedKPIData } from '@/types/reportV3.types';
import type { ClusterInfo } from '@/types/kpi.types';
import { NumericKPICard } from './NumericKPICard';
import { RubricKPICard } from './RubricKPICard';
import { MultiSelectKPICard } from './MultiSelectKPICard';

interface ImportantKPISectionProps {
  processedData: ProcessedKPIData[];
  cluster: ClusterInfo;
  className?: string;
}

export const ImportantKPISection: React.FC<ImportantKPISectionProps> = ({
  processedData,
  cluster,
  className = ''
}) => {
  // x2 가중치 KPI만 필터링
  const importantKPIs = processedData
    .filter(item => item.weight.level === 'x2')
    .sort((a, b) => b.weight.priority - a.weight.priority); // 우선순위 높은 순

  if (importantKPIs.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-8 text-center ${className}`}>
        <Star size={40} className="mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600">
          현재 x2 가중치의 Important KPI가 없습니다.
        </p>
      </div>
    );
  }

  // KPI 타입에 따라 적절한 카드 컴포넌트 렌더링 (Medium 사이즈)
  const renderKPICard = (item: ProcessedKPIData, index: number) => {
    const { kpi } = item;
    const key = `important-${kpi.kpi_id}-${index}`;

    switch (kpi.input_type) {
      case 'numeric_input':
      case 'percentage_input':
        return (
          <NumericKPICard
            key={key}
            data={item}
            cluster={cluster}
            size="medium"
          />
        );

      case 'rubric':
        return (
          <RubricKPICard
            key={key}
            data={item}
            cluster={cluster}
            size="medium"
          />
        );

      case 'multi_select':
      case 'single_select':
        return (
          <MultiSelectKPICard
            key={key}
            data={item}
            cluster={cluster}
            size="medium"
          />
        );

      default:
        // Fallback for unknown types
        return (
          <div
            key={key}
            className="bg-white border border-gray-300 rounded-lg p-5"
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
          <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-lg">
            <Star size={24} className="text-yellow-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Important Metrics
            </h3>
            <p className="text-sm text-gray-600">
              주요 관리 지표 (x2 가중치) • {importantKPIs.length}개
            </p>
          </div>
        </div>
        <div className="h-1 w-20 bg-gradient-to-r from-yellow-500 to-orange-400 rounded-full"></div>
      </div>

      {/* KPI 카드 그리드 - 2열 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {importantKPIs.map((item, index) => renderKPICard(item, index))}
      </div>

      {/* 하단 안내 */}
      {importantKPIs.length > 0 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>💡 Tip:</strong> 이 지표들은 비즈니스 성과에 중요한 영향을 미칩니다.
            정기적으로 모니터링하고 개선 계획을 수립하세요.
          </p>
        </div>
      )}
    </div>
  );
};