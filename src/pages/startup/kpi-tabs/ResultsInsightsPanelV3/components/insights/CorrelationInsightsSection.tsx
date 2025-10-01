/**
 * CorrelationInsightsSection
 * Phase 2C: 상관관계 인사이트 섹션
 *
 * KPI 간 관계를 분석한 파생 지표를 표시
 * - ARPU (사용자당 평균 매출)
 * - Burn Multiple (자본 효율성)
 * - CAC Payback Period (회수 기간)
 * - Growth Efficiency (성장 효율성)
 * - LTV/CAC 비율 (Unit Economics)
 */

import React from 'react';
import type { CorrelationInsight } from '@/types/reportV3.types';
import { TrendingUp, DollarSign, Target, Zap } from 'lucide-react';

interface CorrelationInsightsSectionProps {
  insights: CorrelationInsight[];
}

export const CorrelationInsightsSection: React.FC<CorrelationInsightsSectionProps> = ({
  insights
}) => {
  if (insights.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="text-blue-600" size={24} />
          상관관계 인사이트
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          KPI 간 관계를 분석하여 도출한 파생 지표입니다
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, idx) => (
          <CorrelationInsightCard key={idx} insight={insight} />
        ))}
      </div>
    </div>
  );
};

const CorrelationInsightCard: React.FC<{ insight: CorrelationInsight }> = ({
  insight
}) => {
  const getIcon = () => {
    if (insight.title.includes('ARPU')) return DollarSign;
    if (insight.title.includes('Burn')) return Target;
    if (insight.title.includes('Efficiency')) return Zap;
    return TrendingUp;
  };

  const Icon = getIcon();

  const getPriorityColor = () => {
    switch (insight.priority) {
      case 'critical':
        return 'border-red-300 bg-red-50';
      case 'high':
        return 'border-orange-300 bg-orange-50';
      case 'medium':
        return 'border-yellow-300 bg-yellow-50';
      case 'low':
        return 'border-green-300 bg-green-50';
      default:
        return 'border-blue-300 bg-blue-50';
    }
  };

  const getScoreColor = () => {
    if (insight.score >= 80) return 'text-green-600';
    if (insight.score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`p-5 border-2 rounded-lg ${getPriorityColor()}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="text-blue-600" size={20} />
          <h4 className="font-semibold text-gray-900 text-sm">{insight.title}</h4>
        </div>
        <div className={`text-2xl font-bold ${getScoreColor()}`}>
          {insight.description}
        </div>
      </div>

      <p className="text-sm text-gray-800 mb-3 leading-relaxed">
        {insight.interpretation}
      </p>

      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">
          관련 KPI: {insight.affectedKPIs.length}개
        </span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                insight.score >= 80
                  ? 'bg-green-500'
                  : insight.score >= 60
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${insight.score}%` }}
            />
          </div>
          <span className={`font-semibold ${getScoreColor()}`}>
            {insight.score}점
          </span>
        </div>
      </div>

      {insight.type === 'unit_economics' && (
        <div className="mt-3 p-2 bg-white bg-opacity-70 rounded border border-blue-200">
          <p className="text-xs text-blue-900">
            <strong>Unit Economics:</strong> 비즈니스의 건강성을 나타내는 핵심 지표입니다
          </p>
        </div>
      )}
    </div>
  );
};