/**
 * Page 4: Benchmarking & Radar Deep Dive
 * 2열 레이아웃: 왼쪽(Radar 차트), 오른쪽(벤치마크)
 * Height: ~1200px (1 page)
 */

import React from 'react';
import type { RadarEnhancedData } from '../../types/reportV3UI.types';
import type { ProcessedKPIData } from '@/types/reportV3.types';
import type { ClusterInfo } from '@/types/kpi.types';

interface Page4BenchmarkRadarProps {
  radarData: RadarEnhancedData;
  processedData: ProcessedKPIData[];
  cluster: ClusterInfo;
  overallScore: number;
  className?: string;
}

export const Page4BenchmarkRadar: React.FC<Page4BenchmarkRadarProps> = ({
  radarData,
  processedData,
  cluster,
  overallScore,
  className = ''
}) => {
  const industryAverage = 55; // 가정

  return (
    <div className={`page-4-benchmark-radar ${className}`} style={{ minHeight: '1200px' }}>
      <div className="grid grid-cols-2 gap-8">
        {/* 왼쪽: Radar Deep Dive */}
        <div className="radar-column">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            🎯 5축 균형 분석
          </h3>

          {/* Radar Chart Placeholder */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
            <div
              className="flex items-center justify-center bg-gray-50 rounded-lg"
              style={{ height: '400px' }}
            >
              <p className="text-gray-400 text-sm">
                Phase 4.6: Radar Chart 구현 예정
              </p>
            </div>
          </div>

          {/* Axis Details Compact */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              축별 상세 점수
            </h4>
            {Object.entries(radarData.currentScores || {}).slice(0, 5).map(([axis, score]) => (
              <div
                key={axis}
                className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded"
              >
                <span className="text-sm font-medium text-gray-700">{axis}</span>
                <span className="text-lg font-bold text-indigo-600">
                  {score.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽: Benchmarking */}
        <div className="benchmark-column">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            📈 경쟁 포지션
          </h3>

          {/* Overall Score Comparison */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">전체 점수</p>
                <p className="text-4xl font-bold text-gray-900">
                  {overallScore.toFixed(1)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600 mb-1">업계 평균</p>
                <p className="text-3xl font-bold text-gray-700">
                  {industryAverage.toFixed(1)}
                </p>
              </div>
            </div>

            {/* Comparison Bar */}
            <div className="relative h-8 bg-gray-200 rounded-lg overflow-hidden mb-3">
              <div
                className="absolute top-0 left-0 h-full bg-indigo-500"
                style={{ width: `${Math.min(overallScore, 100)}%` }}
              />
              <div
                className="absolute top-0 h-full w-1 bg-gray-400"
                style={{ left: `${industryAverage}%` }}
              />
            </div>

            <p className="text-sm text-center">
              {overallScore > industryAverage ? (
                <span className="text-green-600 font-semibold">
                  ▲ 업계 평균 대비 +{(overallScore - industryAverage).toFixed(1)}점 우수
                </span>
              ) : (
                <span className="text-orange-600 font-semibold">
                  ▼ 업계 평균 대비 {(overallScore - industryAverage).toFixed(1)}점
                </span>
              )}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-xs text-gray-600 mb-1">평균 이상</p>
              <p className="text-2xl font-bold text-green-600">12</p>
            </div>
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-center">
              <p className="text-xs text-gray-600 mb-1">평균 이하</p>
              <p className="text-2xl font-bold text-orange-600">3</p>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-900 mb-2">
                ✓ Top 3 강점
              </h4>
              <p className="text-xs text-gray-500">Phase 4.6에서 구현 예정</p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-orange-900 mb-2">
                ⚠ Top 3 약점
              </h4>
              <p className="text-xs text-gray-500">Phase 4.6에서 구현 예정</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
