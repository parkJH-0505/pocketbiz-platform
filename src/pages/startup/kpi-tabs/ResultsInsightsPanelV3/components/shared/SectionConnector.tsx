/**
 * SectionConnector
 * Phase 3: 섹션 간 스토리텔링을 위한 연결 컴포넌트
 *
 * 각 섹션 사이에 배치되어 사용자가 레포트의 흐름을 이해하도록 돕습니다.
 */

import React from 'react';
import { ArrowDown, TrendingUp, AlertTriangle, Target, BarChart3 } from 'lucide-react';

interface SectionConnectorProps {
  type:
    | 'summary-to-risks' // Executive Summary → Risk Alerts
    | 'risks-to-correlations' // Risk Alerts → Correlation Insights
    | 'correlations-to-critical' // Correlation Insights → Critical KPI
    | 'critical-to-important' // Critical KPI → Important KPI
    | 'important-to-standard' // Important KPI → Standard KPI
    | 'standard-to-benchmarking' // Standard KPI → Benchmarking
    | 'benchmarking-to-action' // Benchmarking → Action Plan
    | 'action-to-radar'; // Action Plan → Radar Overview
  compact?: boolean; // 간략 버전
}

export const SectionConnector: React.FC<SectionConnectorProps> = ({
  type,
  compact = false
}) => {
  const getContent = () => {
    switch (type) {
      case 'summary-to-risks':
        return {
          icon: AlertTriangle,
          iconColor: 'text-red-600',
          bgColor: 'from-purple-50 to-red-50',
          borderColor: 'border-red-200',
          message: '먼저 즉각적인 조치가 필요한 위험 신호를 확인하세요'
        };

      case 'risks-to-correlations':
        return {
          icon: TrendingUp,
          iconColor: 'text-blue-600',
          bgColor: 'from-red-50 to-blue-50',
          borderColor: 'border-blue-200',
          message: 'KPI 간 관계를 분석한 파생 지표로 비즈니스 건강도를 파악하세요'
        };

      case 'correlations-to-critical':
        return {
          icon: Target,
          iconColor: 'text-indigo-600',
          bgColor: 'from-blue-50 to-indigo-50',
          borderColor: 'border-indigo-200',
          message: '이제 가장 중요한 핵심 지표(x3 가중치)를 상세히 분석합니다'
        };

      case 'critical-to-important':
        return {
          icon: BarChart3,
          iconColor: 'text-purple-600',
          bgColor: 'from-indigo-50 to-purple-50',
          borderColor: 'border-purple-200',
          message: '핵심 지표에 이어 주요 관리 지표(x2 가중치)를 확인하세요'
        };

      case 'important-to-standard':
        return {
          icon: BarChart3,
          iconColor: 'text-gray-600',
          bgColor: 'from-purple-50 to-gray-50',
          borderColor: 'border-gray-200',
          message: '기본 관리 지표(x1 가중치)는 테이블 형식으로 요약됩니다'
        };

      case 'standard-to-benchmarking':
        return {
          icon: TrendingUp,
          iconColor: 'text-green-600',
          bgColor: 'from-gray-50 to-green-50',
          borderColor: 'border-green-200',
          message: '업계 평균과 비교하여 귀사의 경쟁력을 확인하세요'
        };

      case 'benchmarking-to-action':
        return {
          icon: Target,
          iconColor: 'text-orange-600',
          bgColor: 'from-green-50 to-orange-50',
          borderColor: 'border-orange-200',
          message: '진단 결과를 바탕으로 우선순위별 실행 계획을 제시합니다'
        };

      case 'action-to-radar':
        return {
          icon: BarChart3,
          iconColor: 'text-indigo-600',
          bgColor: 'from-orange-50 to-indigo-50',
          borderColor: 'border-indigo-200',
          message: '마지막으로 5축 균형 분석으로 전체 그림을 확인하세요'
        };

      default:
        return {
          icon: ArrowDown,
          iconColor: 'text-gray-600',
          bgColor: 'from-gray-50 to-gray-100',
          borderColor: 'border-gray-200',
          message: '다음 섹션으로 이동합니다'
        };
    }
  };

  const content = getContent();
  const Icon = content.icon;

  if (compact) {
    return (
      <div className="flex items-center justify-center py-2 my-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Icon className={content.iconColor} size={16} />
          <span>↓</span>
        </div>
      </div>
    );
  }

  return (
    <div className="my-6">
      <div
        className={`relative p-4 rounded-lg border ${content.borderColor} bg-gradient-to-r ${content.bgColor} shadow-sm`}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Icon className={content.iconColor} size={20} />
            </div>
          </div>

          {/* Message */}
          <div className="flex-1">
            <p className="text-sm text-gray-700 font-medium leading-relaxed">
              {content.message}
            </p>
          </div>

          {/* Arrow Down */}
          <div className="flex-shrink-0">
            <ArrowDown className="text-gray-400" size={20} />
          </div>
        </div>
      </div>
    </div>
  );
};