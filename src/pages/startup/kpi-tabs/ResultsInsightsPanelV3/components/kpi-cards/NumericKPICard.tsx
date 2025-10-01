/**
 * NumericKPICard Component
 * 숫자형/백분율 KPI 시각화 카드
 */

import React from 'react';
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import type { ProcessedKPIData, NumericProcessedValue } from '@/types/reportV3.types';
import type { ClusterInfo } from '@/types/kpi.types';
import { ScoreDisplay } from '../shared/ScoreDisplay';

interface NumericKPICardProps {
  data: ProcessedKPIData;
  cluster: ClusterInfo;
  size?: 'large' | 'medium' | 'small';
  className?: string;
}

export const NumericKPICard: React.FC<NumericKPICardProps> = ({
  data,
  cluster,
  size = 'large',
  className = ''
}) => {
  const { kpi, response, weight, processedValue, insights, benchmarkInfo } = data;
  const numericValue = processedValue as NumericProcessedValue;

  // 값 포맷팅
  const formatValue = (value: number): string => {
    if (kpi.input_type === 'percentage_input') {
      return `${value.toFixed(1)}%`;
    }

    // 큰 숫자는 쉼표 추가
    if (value >= 1000) {
      return value.toLocaleString('ko-KR');
    }

    return value.toFixed(1);
  };

  // 트렌드 표시
  const renderTrend = () => {
    if (!numericValue.trend) return null;

    const isPositive = numericValue.trend.direction === 'up';
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    const trendColor = isPositive ? 'text-green-600' : 'text-red-600';
    const bgColor = isPositive ? 'bg-green-50' : 'bg-red-50';

    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 ${bgColor} rounded-lg`}>
        <TrendIcon size={16} className={trendColor} />
        <span className={`text-sm font-medium ${trendColor}`}>
          {numericValue.trend.percentage > 0 ? '+' : ''}
          {numericValue.trend.percentage.toFixed(1)}%
        </span>
      </div>
    );
  };

  // 벤치마크 비교
  const renderBenchmark = () => {
    if (!benchmarkInfo) return null;

    const diff = numericValue.normalizedScore - benchmarkInfo.industryAverage;
    const isAbove = diff > 0;
    const absDiff = Math.abs(diff);

    // 백분위 결정 (간단한 추정)
    let percentile = '50th';
    let percentileColor = 'text-gray-600';
    if (numericValue.normalizedScore >= (benchmarkInfo.topQuartile || benchmarkInfo.industryAverage * 1.2)) {
      percentile = 'Top 25%';
      percentileColor = 'text-green-600';
    } else if (numericValue.normalizedScore <= (benchmarkInfo.bottomQuartile || benchmarkInfo.industryAverage * 0.8)) {
      percentile = 'Bottom 25%';
      percentileColor = 'text-orange-600';
    }

    return (
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-sm text-gray-600">업계 평균 대비</span>
            <p className={`text-xs mt-0.5 font-medium ${percentileColor}`}>
              {percentile}
            </p>
          </div>
          <span className={`text-lg font-bold ${isAbove ? 'text-green-600' : 'text-orange-600'}`}>
            {isAbove ? '+' : ''}{diff.toFixed(1)}
          </span>
        </div>

        {/* 비교 바 차트 */}
        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
          {/* 평균 마커 */}
          <div
            className="absolute top-0 h-full w-0.5 bg-blue-600 z-10"
            style={{ left: `${Math.min(benchmarkInfo.industryAverage, 100)}%` }}
          >
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-blue-700 font-semibold whitespace-nowrap">
              평균
            </div>
          </div>

          {/* 내 점수 */}
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isAbove ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-orange-400 to-orange-600'
            }`}
            style={{ width: `${Math.min(numericValue.normalizedScore, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {benchmarkInfo.industryAverage.toFixed(0)}점 (업계 평균)
          </span>
          <span className="text-xs text-gray-600 font-medium">
            {numericValue.normalizedScore.toFixed(0)}점 (내 점수)
          </span>
        </div>

        {/* 벤치마크 데이터 출처 */}
        {(benchmarkInfo.source || benchmarkInfo.lastUpdated) && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {benchmarkInfo.source && (
                <>
                  <span className="font-medium">출처:</span> {benchmarkInfo.source}
                </>
              )}
              {benchmarkInfo.lastUpdated && (
                <>
                  {benchmarkInfo.source && ' • '}
                  <span className="font-medium">업데이트:</span> {benchmarkInfo.lastUpdated}
                </>
              )}
            </p>
          </div>
        )}
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

  const valueSize = {
    large: 'text-5xl',
    medium: 'text-4xl',
    small: 'text-3xl'
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
        {renderTrend()}
      </div>

      {/* 메인 값 표시 */}
      <div className="mb-4">
        <div className={`${valueSize[size]} font-bold text-gray-900 mb-2`}>
          {formatValue(numericValue.value)}
          {numericValue.unit && (
            <span className="text-lg font-normal text-gray-600 ml-2">
              {numericValue.unit}
            </span>
          )}
        </div>

        {/* 점수 프로그레스 바 */}
        <ScoreDisplay
          score={numericValue.normalizedScore}
          variant="linear"
          showLabel={true}
          className="w-full"
        />
      </div>

      {/* 벤치마크 비교 (Large 사이즈만) */}
      {size === 'large' && renderBenchmark()}

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