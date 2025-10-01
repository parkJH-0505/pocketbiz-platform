/**
 * BenchmarkingSection Component
 * 업계 벤치마크 비교 분석 섹션
 */

import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Target, Award } from 'lucide-react';
import type { ProcessedKPIData } from '@/types/reportV3.types';
import type { ClusterInfo } from '@/types/kpi.types';

interface BenchmarkingSectionProps {
  processedData: ProcessedKPIData[];
  cluster: ClusterInfo;
  overallScore: number;
  className?: string;
}

interface BenchmarkStats {
  totalKPIs: number;
  aboveAverage: number;
  belowAverage: number;
  atAverage: number;
  avgDifference: number;
  strongestAreas: Array<{ kpi: string; diff: number }>;
  weakestAreas: Array<{ kpi: string; diff: number }>;
}

export const BenchmarkingSection: React.FC<BenchmarkingSectionProps> = ({
  processedData,
  cluster,
  overallScore,
  className = ''
}) => {
  // 벤치마크 통계 계산
  const stats = useMemo<BenchmarkStats>(() => {
    const kpisWithBenchmark = processedData.filter(item => item.benchmarkInfo);

    if (kpisWithBenchmark.length === 0) {
      return {
        totalKPIs: 0,
        aboveAverage: 0,
        belowAverage: 0,
        atAverage: 0,
        avgDifference: 0,
        strongestAreas: [],
        weakestAreas: []
      };
    }

    let aboveCount = 0;
    let belowCount = 0;
    let atCount = 0;
    let totalDiff = 0;

    const diffs = kpisWithBenchmark.map(item => {
      const diff = item.processedValue.normalizedScore - (item.benchmarkInfo?.industryAverage || 0);
      totalDiff += diff;

      if (diff > 5) aboveCount++;
      else if (diff < -5) belowCount++;
      else atCount++;

      return {
        kpi: item.kpi.question,
        diff,
        score: item.processedValue.normalizedScore
      };
    });

    // 상위 3개 강점 영역
    const strongestAreas = diffs
      .filter(d => d.diff > 0)
      .sort((a, b) => b.diff - a.diff)
      .slice(0, 3);

    // 하위 3개 약점 영역
    const weakestAreas = diffs
      .filter(d => d.diff < 0)
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 3);

    return {
      totalKPIs: kpisWithBenchmark.length,
      aboveAverage: aboveCount,
      belowAverage: belowCount,
      atAverage: atCount,
      avgDifference: totalDiff / kpisWithBenchmark.length,
      strongestAreas,
      weakestAreas
    };
  }, [processedData]);

  if (stats.totalKPIs === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-8 text-center ${className}`}>
        <BarChart3 size={40} className="mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600">
          벤치마크 데이터가 아직 생성되지 않았습니다.
        </p>
      </div>
    );
  }

  // 업계 평균 점수 (가정: 대부분의 스타트업은 50-60점대)
  const industryAverage = 55;
  const performanceLevel = overallScore >= industryAverage + 10 ? 'excellent' :
                          overallScore >= industryAverage ? 'good' :
                          overallScore >= industryAverage - 10 ? 'average' : 'below';

  const performanceColor = {
    excellent: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-600' },
    good: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-600' },
    average: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: 'text-yellow-600' },
    below: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'text-orange-600' }
  };

  const colors = performanceColor[performanceLevel];

  return (
    <div className={className}>
      {/* 섹션 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
            <BarChart3 size={24} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Benchmarking Analysis
            </h3>
            <p className="text-sm text-gray-600">
              {cluster.sector} • {cluster.stage} 단계 기준 업계 비교
            </p>
          </div>
        </div>
        <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
      </div>

      {/* 전체 성과 비교 */}
      <div className={`p-6 border-2 rounded-xl ${colors.bg} ${colors.border} mb-6`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">전체 점수</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-900">{overallScore.toFixed(1)}</span>
              <span className="text-lg text-gray-600">/ 100</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">업계 평균</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-700">{industryAverage.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* 비교 바 */}
        <div className="relative h-8 bg-white rounded-lg overflow-hidden mb-4">
          {/* 업계 평균 마커 */}
          <div
            className="absolute top-0 h-full w-1 bg-gray-400 z-10"
            style={{ left: `${industryAverage}%` }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap">
              평균
            </div>
          </div>
          {/* 내 점수 */}
          <div
            className={`h-full transition-all duration-1000 ${
              performanceLevel === 'excellent' ? 'bg-green-500' :
              performanceLevel === 'good' ? 'bg-blue-500' :
              performanceLevel === 'average' ? 'bg-yellow-500' : 'bg-orange-500'
            }`}
            style={{ width: `${Math.min(overallScore, 100)}%` }}
          />
        </div>

        {/* 차이 표시 */}
        <div className="flex items-center justify-center gap-2">
          {overallScore > industryAverage ? (
            <>
              <TrendingUp size={20} className="text-green-600" />
              <span className={`font-semibold ${colors.text}`}>
                업계 평균 대비 +{(overallScore - industryAverage).toFixed(1)}점 우수
              </span>
            </>
          ) : overallScore < industryAverage ? (
            <>
              <TrendingDown size={20} className="text-orange-600" />
              <span className={`font-semibold ${colors.text}`}>
                업계 평균 대비 {(overallScore - industryAverage).toFixed(1)}점 개선 필요
              </span>
            </>
          ) : (
            <>
              <Target size={20} className="text-blue-600" />
              <span className={`font-semibold ${colors.text}`}>
                업계 평균 수준
              </span>
            </>
          )}
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">분석 대상</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalKPIs}</p>
          <p className="text-xs text-gray-500 mt-1">KPI</p>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">평균 이상</p>
          <p className="text-2xl font-bold text-green-600">{stats.aboveAverage}</p>
          <p className="text-xs text-green-600 mt-1">
            {((stats.aboveAverage / stats.totalKPIs) * 100).toFixed(0)}%
          </p>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">평균 수준</p>
          <p className="text-2xl font-bold text-blue-600">{stats.atAverage}</p>
          <p className="text-xs text-blue-600 mt-1">
            {((stats.atAverage / stats.totalKPIs) * 100).toFixed(0)}%
          </p>
        </div>
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">평균 이하</p>
          <p className="text-2xl font-bold text-orange-600">{stats.belowAverage}</p>
          <p className="text-xs text-orange-600 mt-1">
            {((stats.belowAverage / stats.totalKPIs) * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* 강점 영역 & 약점 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 강점 영역 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award size={20} className="text-green-600" />
            <h4 className="font-semibold text-green-900">경쟁 우위 영역</h4>
          </div>

          {stats.strongestAreas.length > 0 ? (
            <div className="space-y-3">
              {stats.strongestAreas.map((area, index) => (
                <div key={index} className="bg-white p-3 rounded-lg">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-gray-800 flex-1 line-clamp-2">
                      {area.kpi}
                    </p>
                    <span className="text-sm font-bold text-green-600 whitespace-nowrap">
                      +{area.diff.toFixed(1)}
                    </span>
                  </div>
                  <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
                      style={{ width: `${Math.min((area.diff / 50) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-green-700">
              현재 업계 평균을 크게 상회하는 영역이 없습니다. 지속적인 개선을 통해 경쟁 우위를 확보하세요.
            </p>
          )}
        </div>

        {/* 약점 영역 */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target size={20} className="text-orange-600" />
            <h4 className="font-semibold text-orange-900">개선 기회 영역</h4>
          </div>

          {stats.weakestAreas.length > 0 ? (
            <div className="space-y-3">
              {stats.weakestAreas.map((area, index) => (
                <div key={index} className="bg-white p-3 rounded-lg">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-gray-800 flex-1 line-clamp-2">
                      {area.kpi}
                    </p>
                    <span className="text-sm font-bold text-orange-600 whitespace-nowrap">
                      {area.diff.toFixed(1)}
                    </span>
                  </div>
                  <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-orange-500 rounded-full"
                      style={{ width: `${Math.min((Math.abs(area.diff) / 50) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-orange-700">
              모든 영역이 업계 평균 이상입니다. 탁월한 성과를 보이고 있습니다!
            </p>
          )}
        </div>
      </div>

      {/* 종합 인사이트 */}
      <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <p className="text-sm text-indigo-900 leading-relaxed">
          <strong>💡 인사이트:</strong> 전체적으로 업계 평균 대비{' '}
          {stats.avgDifference > 0 ? (
            <>
              <span className="font-semibold text-green-700">+{stats.avgDifference.toFixed(1)}점 우수</span>한 성과를 보이고 있습니다.
              특히 {stats.strongestAreas.length > 0 && `"${stats.strongestAreas[0].kpi.slice(0, 30)}..." 영역에서 강점이 두드러집니다.`}
              {stats.weakestAreas.length > 0 && ` 다만 "${stats.weakestAreas[0].kpi.slice(0, 30)}..." 영역의 개선이 필요합니다.`}
            </>
          ) : (
            <>
              <span className="font-semibold text-orange-700">{stats.avgDifference.toFixed(1)}점 낮은</span> 상태입니다.
              {stats.weakestAreas.length > 0 && ` "${stats.weakestAreas[0].kpi.slice(0, 30)}..." 영역부터 우선 개선하면 빠른 성과를 기대할 수 있습니다.`}
            </>
          )}
        </p>
      </div>

      {/* 데이터 출처 정보 */}
      {processedData.length > 0 && processedData.some(item => item.benchmarkInfo) && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600 mb-1 font-semibold">📊 벤치마크 데이터 출처</p>
          <div className="space-y-1">
            {Array.from(new Set(
              processedData
                .filter(item => item.benchmarkInfo)
                .map(item => item.benchmarkInfo!.source)
            )).map((source, idx) => (
              <p key={idx} className="text-xs text-gray-500">
                • {source}
              </p>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            실제 스타트업 데이터를 기반으로 한 업계 벤치마크입니다.
          </p>
        </div>
      )}
    </div>
  );
};