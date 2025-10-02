/**
 * Page 4: Benchmarking & Radar Deep Dive
 * 좌측: Full Radar Chart, 우측: Benchmarking Details
 * Height: ~1200px (1 page)
 */

import React, { useMemo } from 'react';
import type { RadarEnhancedData } from '../../types/reportV3UI.types';
import type { ProcessedKPIData } from '@/types/reportV3.types';
import type { ClusterInfo } from '@/types/kpi.types';
import { extractBenchmarkRadarData } from '../../utils/benchmarkDataExtractor';
import { FullRadarChart } from './benchmark/FullRadarChart';
import { BenchmarkComparisonTable } from './benchmark/BenchmarkComparisonTable';
import { PercentileRanking } from './benchmark/PercentileRanking';
import { GapAnalysis } from './benchmark/GapAnalysis';

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
  // Extract benchmark & radar data
  const benchmarkData = useMemo(
    () => extractBenchmarkRadarData(radarData, processedData),
    [radarData, processedData]
  );

  return (
    <div className={`page-4-benchmark-radar page-break ${className}`}>
      {/* 헤더 */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          📊 벤치마킹 & 레이더 분석
        </h3>
        <p className="text-sm text-gray-600">
          5-Axis 균형 분석 • 업계 비교 • 백분위 순위 • Gap 분석
        </p>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* 좌측: Radar Chart & Percentile */}
        <div className="space-y-6">
          {/* Full Radar Chart */}
          <FullRadarChart data={benchmarkData.radarChart} />

          {/* Percentile Ranking */}
          <PercentileRanking data={benchmarkData.percentile} />
        </div>

        {/* 우측: Benchmark Comparison & Gap Analysis */}
        <div className="space-y-6">
          {/* Benchmark Comparison Table */}
          <BenchmarkComparisonTable comparisons={benchmarkData.comparisons} />

          {/* Gap Analysis */}
          <GapAnalysis gaps={benchmarkData.gaps} />
        </div>
      </div>

      {/* Footer Summary */}
      <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-900">
              {cluster.sector} • {cluster.stage}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              종합 점수: <span className="font-bold text-indigo-600">{overallScore.toFixed(1)}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">백분위 순위</p>
            <p className="text-2xl font-bold text-indigo-600">
              {benchmarkData.percentile.overallPercentile.toFixed(0)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
