/**
 * RubricKPICard Component
 * 루브릭(단계별 평가) KPI 시각화 카드
 */

import React from 'react';
import { Layers, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import type { ProcessedKPIData, RubricProcessedValue } from '@/types/reportV3.types';
import type { ClusterInfo } from '@/types/kpi.types';
import { ScoreDisplay } from '../shared/ScoreDisplay';

interface RubricKPICardProps {
  data: ProcessedKPIData;
  cluster: ClusterInfo;
  size?: 'large' | 'medium' | 'small';
  className?: string;
}

export const RubricKPICard: React.FC<RubricKPICardProps> = ({
  data,
  cluster,
  size = 'large',
  className = ''
}) => {
  const { kpi, response, weight, processedValue, insights, benchmarkInfo } = data;
  const rubricValue = processedValue as RubricProcessedValue;

  // 레벨 색상 매핑
  const getLevelColor = (level: number, maxLevel: number) => {
    const percentage = (level / maxLevel) * 100;
    if (percentage >= 80) return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' };
    if (percentage >= 60) return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' };
    if (percentage >= 40) return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' };
    return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' };
  };

  const levelColors = getLevelColor(rubricValue.selectedLevel, rubricValue.maxLevel);

  // 루브릭 단계 시각화
  const renderRubricLevels = () => {
    if (!rubricValue.levelDescription) return null;

    return (
      <div className="space-y-2">
        {Array.from({ length: rubricValue.maxLevel }, (_, i) => {
          const level = i + 1;
          const isSelected = level === rubricValue.selectedLevel;
          const isBelow = level < rubricValue.selectedLevel;

          return (
            <div
              key={level}
              className={`relative p-3 rounded-lg border-2 transition-all ${
                isSelected
                  ? `${levelColors.bg} ${levelColors.border}`
                  : isBelow
                  ? 'bg-gray-50 border-gray-200 opacity-60'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                    isSelected
                      ? `${levelColors.bg} ${levelColors.text}`
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {level}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${isSelected ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                    {rubricValue.levelDescription || `Level ${level}`}
                  </p>
                </div>
                {isSelected && (
                  <CheckCircle size={20} className={levelColors.text} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 다음 단계 가이드
  const renderNextStepGuide = () => {
    if (rubricValue.selectedLevel >= rubricValue.maxLevel) {
      return (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-green-600" />
            <span className="text-sm font-semibold text-green-900">최고 수준 달성</span>
          </div>
          <p className="text-sm text-green-700">
            현재 최고 레벨에 도달했습니다. 이 수준을 유지하며 지속적인 개선을 추구하세요.
          </p>
        </div>
      );
    }

    const nextLevel = rubricValue.selectedLevel + 1;
    const gap = rubricValue.maxLevel - rubricValue.selectedLevel;

    return (
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <Target size={16} className="text-blue-600" />
          <span className="text-sm font-semibold text-blue-900">다음 단계로</span>
        </div>
        <p className="text-sm text-blue-700">
          Level {nextLevel}로 향상하면 더 높은 점수를 획득할 수 있습니다.
          {gap > 1 && ` (최고 레벨까지 ${gap}단계 남음)`}
        </p>
      </div>
    );
  };

  // 인사이트 표시
  const renderInsights = () => {
    if (!insights || !insights.summary) return null;

    const riskIcon = {
      high: <AlertTriangle size={16} className="text-red-600" />,
      medium: <Target size={16} className="text-yellow-600" />,
      low: <CheckCircle size={16} className="text-green-600" />
    };

    const riskBg = {
      high: 'bg-red-50 border-red-200',
      medium: 'bg-yellow-50 border-yellow-200',
      low: 'bg-green-50 border-green-200'
    };

    return (
      <div className={`mt-4 p-3 border rounded-lg ${riskBg[insights.riskLevel]}`}>
        <div className="flex items-start gap-2 mb-2">
          {riskIcon[insights.riskLevel]}
          <span className="text-sm font-semibold text-gray-800">AI Insight</span>
          {insights.aiGenerated && (
            <span className="ml-auto text-xs text-gray-500 italic">AI 생성</span>
          )}
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          {insights.interpretation || insights.summary}
        </p>
      </div>
    );
  };

  // 사이즈별 레이아웃
  const sizeClasses = {
    large: 'p-6',
    medium: 'p-5',
    small: 'p-4'
  };

  return (
    <div className={`bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow ${sizeClasses[size]} ${className}`}>
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
              {weight.level}
            </span>
            <span className="text-xs text-gray-500">우선순위 #{weight.priority}</span>
          </div>
          <h4 className="font-semibold text-gray-900 leading-tight">
            {kpi.question}
          </h4>
        </div>
        <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
          <Layers size={24} className="text-purple-600" />
        </div>
      </div>

      {/* 현재 레벨 표시 */}
      <div className="mb-4">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${levelColors.bg} ${levelColors.border} border-2`}>
          <span className="text-2xl font-bold ${levelColors.text}">
            Level {rubricValue.selectedLevel}
          </span>
          <span className="text-sm text-gray-600">/ {rubricValue.maxLevel}</span>
        </div>

        {/* 점수 표시 */}
        <div className="mt-3">
          <ScoreDisplay
            score={rubricValue.normalizedScore}
            variant="linear"
            showLabel={true}
            className="w-full"
          />
        </div>
      </div>

      {/* 루브릭 레벨 시각화 (Large 사이즈만) */}
      {size === 'large' && (
        <div className="mb-4">
          <h5 className="text-sm font-semibold text-gray-700 mb-3">평가 단계</h5>
          {renderRubricLevels()}
        </div>
      )}

      {/* 다음 단계 가이드 */}
      {size !== 'small' && renderNextStepGuide()}

      {/* AI 인사이트 */}
      {size !== 'small' && renderInsights()}

      {/* 가중치 설명 */}
      {size === 'large' && weight.emphasis && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            <strong>왜 중요한가:</strong> {weight.emphasis}
          </p>
        </div>
      )}
    </div>
  );
};