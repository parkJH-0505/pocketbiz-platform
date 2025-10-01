/**
 * GapAnalysis Component
 * Gap 분석 카드 (벤치마크 차이 분석)
 */

import React from 'react';
import { AlertCircle, TrendingDown } from 'lucide-react';
import type { GapAnalysisItem } from '../../../utils/benchmarkDataExtractor';

interface GapAnalysisProps {
  gaps: GapAnalysisItem[];
  className?: string;
}

export const GapAnalysis: React.FC<GapAnalysisProps> = ({
  gaps,
  className = ''
}) => {
  const getSeverityConfig = (severity: 'critical' | 'moderate' | 'minor') => {
    switch (severity) {
      case 'critical':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-300',
          textColor: 'text-red-900',
          badgeBg: 'bg-red-100',
          badgeText: 'text-red-700',
          label: '심각',
          icon: AlertCircle
        };
      case 'moderate':
        return {
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-300',
          textColor: 'text-orange-900',
          badgeBg: 'bg-orange-100',
          badgeText: 'text-orange-700',
          label: '중간',
          icon: TrendingDown
        };
      case 'minor':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-300',
          textColor: 'text-yellow-900',
          badgeBg: 'bg-yellow-100',
          badgeText: 'text-yellow-700',
          label: '경미',
          icon: TrendingDown
        };
    }
  };

  return (
    <div className={`gap-analysis ${className}`}>
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-gray-900">🎯 Gap 분석</h4>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
            {gaps.length}개 개선 영역
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          업계 평균 대비 낮은 영역 분석
        </p>
      </div>

      <div className="space-y-3">
        {gaps.map((gap, idx) => {
          const config = getSeverityConfig(gap.severity);
          const Icon = config.icon;

          return (
            <div
              key={gap.axis}
              className={`p-3 border rounded-lg ${config.bgColor} ${config.borderColor}`}
            >
              {/* Header */}
              <div className="flex items-start gap-2 mb-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white border border-gray-300 text-xs font-bold text-gray-700">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${config.badgeBg} ${config.badgeText}`}>
                      <Icon size={12} />
                      {config.label}
                    </span>
                    <span className="text-xs font-semibold text-gray-700">
                      {gap.displayName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-600">Gap:</span>
                    <span className="text-sm font-bold text-red-600">
                      {gap.gap.toFixed(1)}점
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="p-2 bg-white border border-gray-200 rounded">
                <p className="text-xs text-gray-700 leading-relaxed">
                  💡 {gap.recommendation}
                </p>
              </div>
            </div>
          );
        })}

        {gaps.length === 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-sm text-green-700 font-semibold">
              ✅ 모든 영역이 업계 평균 이상입니다!
            </p>
            <p className="text-xs text-gray-600 mt-1">
              현재 수준을 유지하며 지속적인 개선을 추진하세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
