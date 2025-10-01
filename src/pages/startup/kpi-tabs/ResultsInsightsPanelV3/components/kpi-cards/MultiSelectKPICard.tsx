/**
 * MultiSelectKPICard Component
 * 다중선택/단일선택 KPI 시각화 카드
 */

import React from 'react';
import { CheckSquare, Target, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { ProcessedKPIData, MultiSelectProcessedValue } from '@/types/reportV3.types';
import type { ClusterInfo } from '@/types/kpi.types';
import { ScoreDisplay } from '../shared/ScoreDisplay';

interface MultiSelectKPICardProps {
  data: ProcessedKPIData;
  cluster: ClusterInfo;
  size?: 'large' | 'medium' | 'small';
  className?: string;
}

export const MultiSelectKPICard: React.FC<MultiSelectKPICardProps> = ({
  data,
  cluster,
  size = 'large',
  className = ''
}) => {
  const { kpi, response, weight, processedValue, insights, benchmarkInfo } = data;
  const multiSelectValue = processedValue as MultiSelectProcessedValue;

  // 선택된 항목 표시
  const renderSelectedItems = () => {
    if (!multiSelectValue.selectedItems || multiSelectValue.selectedItems.length === 0) {
      return (
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <XCircle size={24} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">선택된 항목이 없습니다</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {multiSelectValue.selectedItems.map((item, index) => {
          // 강점 항목인지 확인
          const isStrength = multiSelectValue.strengths?.some(s =>
            s.toLowerCase().includes(item.toLowerCase()) ||
            item.toLowerCase().includes(s.toLowerCase())
          );

          return (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                isStrength
                  ? 'bg-green-50 border-green-300'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <CheckCircle
                size={20}
                className={isStrength ? 'text-green-600' : 'text-blue-600'}
              />
              <span className={`text-sm font-medium ${
                isStrength ? 'text-green-900' : 'text-blue-900'
              }`}>
                {item}
              </span>
              {isStrength && (
                <span className="ml-auto text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                  강점
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // 선택 통계
  const renderSelectionStats = () => {
    const totalOptions = multiSelectValue.totalOptions || multiSelectValue.selectedItems.length;
    const selectedCount = multiSelectValue.selectedItems.length;
    const percentage = (selectedCount / totalOptions) * 100;

    return (
      <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{selectedCount}</div>
          <div className="text-xs text-gray-600 mt-1">선택됨</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{totalOptions}</div>
          <div className="text-xs text-gray-600 mt-1">전체</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">{percentage.toFixed(0)}%</div>
          <div className="text-xs text-gray-600 mt-1">달성률</div>
        </div>
      </div>
    );
  };

  // 강점 섹션
  const renderStrengths = () => {
    if (!multiSelectValue.strengths || multiSelectValue.strengths.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle size={16} className="text-green-600" />
          <span className="text-sm font-semibold text-green-900">확인된 강점</span>
        </div>
        <ul className="space-y-1">
          {multiSelectValue.strengths.map((strength, index) => (
            <li key={index} className="text-sm text-green-700 flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span>{strength}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // 갭 분석 (선택되지 않은 중요 항목)
  const renderGapAnalysis = () => {
    if (!multiSelectValue.gaps || multiSelectValue.gaps.length === 0) {
      return (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600" />
            <span className="text-sm font-semibold text-green-900">
              모든 주요 항목이 충족되었습니다
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} className="text-orange-600" />
          <span className="text-sm font-semibold text-orange-900">개선 기회</span>
        </div>
        <ul className="space-y-1">
          {multiSelectValue.gaps.slice(0, 3).map((gap, index) => (
            <li key={index} className="text-sm text-orange-700 flex items-start gap-2">
              <span className="text-orange-500 mt-1">•</span>
              <span>{gap}</span>
            </li>
          ))}
          {multiSelectValue.gaps.length > 3 && (
            <li className="text-xs text-orange-600 italic mt-2">
              +{multiSelectValue.gaps.length - 3}개 추가 항목
            </li>
          )}
        </ul>
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
        <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg">
          <CheckSquare size={24} className="text-indigo-600" />
        </div>
      </div>

      {/* 선택 통계 */}
      {renderSelectionStats()}

      {/* 점수 표시 */}
      <div className="mt-4">
        <ScoreDisplay
          score={multiSelectValue.normalizedScore}
          variant="linear"
          showLabel={true}
          className="w-full"
        />
      </div>

      {/* 선택된 항목 (Large/Medium 사이즈) */}
      {size !== 'small' && (
        <div className="mt-4">
          <h5 className="text-sm font-semibold text-gray-700 mb-3">선택된 항목</h5>
          {renderSelectedItems()}
        </div>
      )}

      {/* 강점 (Large 사이즈만) */}
      {size === 'large' && renderStrengths()}

      {/* 갭 분석 */}
      {size !== 'small' && renderGapAnalysis()}

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