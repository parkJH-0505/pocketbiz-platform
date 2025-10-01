/**
 * RadarOverview Component
 * 레이더 차트와 축별 점수를 통합한 개요 섹션
 */

import React, { useState, memo } from 'react';
import {
  RotateCcw,
  Maximize2,
  Download,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';
import { RadarChartEnhanced } from './RadarChartEnhanced';
import { AxisScoreDisplay } from './AxisScoreDisplay';
import type {
  RadarEnhancedData,
  AxisSelectHandler
} from '../../types/reportV3UI.types';
import type { AxisKey } from '../../../../types';

interface RadarOverviewProps {
  radarData: RadarEnhancedData;
  showComparison?: boolean;
  enableInteraction?: boolean;
  isExportMode?: boolean;
  compact?: boolean;
  onAxisSelect?: AxisSelectHandler;
  className?: string;
}

export const RadarOverview = memo<RadarOverviewProps>(({
  radarData,
  showComparison = true,
  enableInteraction = true,
  isExportMode = false,
  compact = false,
  onAxisSelect,
  className = ''
}) => {
  const [selectedAxis, setSelectedAxis] = useState<AxisKey | null>(null);
  const [comparisonMode, setComparisonMode] = useState<'peer' | 'benchmark' | 'historical'>('peer');
  const [showTrends, setShowTrends] = useState(true);
  const [displayMode, setDisplayMode] = useState<'combined' | 'chart-only' | 'scores-only'>('combined');

  // 축 선택 핸들러
  const handleAxisSelect = (axis: AxisKey) => {
    const newSelection = selectedAxis === axis ? null : axis;
    setSelectedAxis(newSelection);
    if (onAxisSelect) {
      onAxisSelect(axis);
    }
  };

  // 비교 모드 레이블
  const getComparisonLabel = () => {
    switch (comparisonMode) {
      case 'peer':
        return '피어 평균';
      case 'benchmark':
        return '업계 벤치마크';
      case 'historical':
        return '이전 점수';
      default:
        return '비교 데이터';
    }
  };

  // 축별 상세 정보 생성 (방어적 코딩)
  const axisDetails = Object.entries(radarData.axisDetails || {}).map(([axisKey, detail]) => {
    // detail이 undefined일 수 있으므로 기본값 설정
    const safeDetail = detail || {
      score: 0,
      weight: 'x2' as const,
      keyKPIs: [],
      insight: '데이터 없음',
      trend: 'stable' as const,
      trendValue: 0
    };

    return {
      axis: axisKey as AxisKey,
      name: axisKey,
      score: safeDetail.score,
      status: safeDetail.score >= 80 ? 'excellent' as const :
              safeDetail.score >= 60 ? 'good' as const :
              safeDetail.score >= 40 ? 'fair' as const : 'needs_attention' as const,
      weight: safeDetail.weight,
      trend: safeDetail.trend ? {
        direction: safeDetail.trend,
        value: safeDetail.trendValue || 0,
        period: '이전 대비'
      } : undefined,
      keyKPIs: (safeDetail.keyKPIs || []).map((kpiName, index) => ({
        kpiId: `${axisKey}-${index}`,
        name: kpiName,
        score: safeDetail.score + (Math.random() - 0.5) * 20, // 임시 점수
        weight: safeDetail.weight,
        status: 'good' as const
      })),
      insights: [safeDetail.insight].filter(Boolean),
      recommendations: [`${axisKey} 영역 개선 방안 수립`],
      riskLevel: radarData.riskHighlights?.includes(axisKey as AxisKey) ? 'high' as const : 'low' as const
    };
  });

  return (
    <div className={`radar-overview ${className}`}>
      {/* 컨트롤 바 */}
      {!isExportMode && !compact && enableInteraction && (
        <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-4">
            {/* 비교 모드 선택 */}
            {showComparison && (
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-500" />
                <select
                  value={comparisonMode}
                  onChange={(e) => setComparisonMode(e.target.value as any)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                >
                  <option value="peer">피어 평균</option>
                  <option value="benchmark">업계 벤치마크</option>
                  <option value="historical">이전 점수</option>
                </select>
              </div>
            )}

            {/* 트렌드 표시 토글 */}
            <button
              onClick={() => setShowTrends(!showTrends)}
              className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
                showTrends
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {showTrends ? <Eye size={14} /> : <EyeOff size={14} />}
              트렌드
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* 표시 모드 선택 */}
            <div className="flex border border-gray-300 rounded overflow-hidden">
              <button
                onClick={() => setDisplayMode('combined')}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  displayMode === 'combined'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                통합
              </button>
              <button
                onClick={() => setDisplayMode('chart-only')}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  displayMode === 'chart-only'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                차트만
              </button>
              <button
                onClick={() => setDisplayMode('scores-only')}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  displayMode === 'scores-only'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                점수만
              </button>
            </div>

            {/* 추가 액션 버튼들 */}
            <button
              onClick={() => setSelectedAxis(null)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="선택 초기화"
            >
              <RotateCcw size={16} />
            </button>

            <button
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="전체화면"
            >
              <Maximize2 size={16} />
            </button>

            <button
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="이미지 다운로드"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <div className={compact ? "space-y-4" : "space-y-8"}>
        {/* 레이더 차트 섹션 */}
        {(displayMode === 'combined' || displayMode === 'chart-only') && (
          <div className={compact ? "" : "bg-white border border-gray-200 rounded-lg p-6"}>
            {!compact && (
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  5축 균형 분석
                </h4>
                <p className="text-sm text-gray-600">
                  비즈니스 핵심 영역별 성과를 한눈에 비교해보세요.
                  {showComparison && ` (${getComparisonLabel()}과 비교)`}
                </p>
              </div>
            )}

            <RadarChartEnhanced
              data={radarData}
              height={compact ? 250 : 400}
              showComparison={showComparison && !compact}
              enableAxisClick={enableInteraction && !compact}
              showTrendIndicators={showTrends && !compact}
              comparisonMode={comparisonMode}
              onAxisSelect={handleAxisSelect}
              isExportMode={isExportMode}
            />

            {/* 범례 및 추가 정보 (컴팩트 모드가 아닐 때만) */}
            {!compact && (
              <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-indigo-500 rounded"></div>
                <span className="text-gray-600">현재 점수</span>
              </div>
              {showComparison && radarData.comparisonData && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-gray-400 rounded border-dashed border"></div>
                  <span className="text-gray-600">{getComparisonLabel()}</span>
                </div>
              )}
              {showComparison && radarData.thirdData && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-green-500 rounded opacity-60"></div>
                  <span className="text-gray-600">상위 10%</span>
                </div>
              )}
              {radarData.riskHighlights && radarData.riskHighlights.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600">위험 영역</span>
                </div>
              )}
              {radarData.achievementBadges && radarData.achievementBadges.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">우수 영역</span>
                </div>
              )}
              </div>
            )}
          </div>
        )}

        {/* 축별 점수 섹션 (컴팩트 모드가 아닐 때만) */}
        {!compact && (displayMode === 'combined' || displayMode === 'scores-only') && (
          <div>
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                축별 상세 점수
              </h4>
              <p className="text-sm text-gray-600">
                각 영역별 세부 성과와 개선 방향을 확인하세요.
              </p>
            </div>

            {/* 데스크톱: 그리드 레이아웃 */}
            <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {axisDetails.map((axis) => (
                <AxisScoreDisplay
                  key={axis.axis}
                  axisDetail={axis}
                  compact={true}
                  showTrend={showTrends}
                  onClick={enableInteraction ? handleAxisSelect : undefined}
                  className={
                    selectedAxis === axis.axis
                      ? 'ring-2 ring-indigo-500 border-indigo-300'
                      : ''
                  }
                />
              ))}
            </div>

            {/* 태블릿: 2열 그리드 */}
            <div className="hidden md:grid lg:hidden md:grid-cols-2 gap-4">
              {axisDetails.map((axis) => (
                <AxisScoreDisplay
                  key={axis.axis}
                  axisDetail={axis}
                  compact={false}
                  showTrend={showTrends}
                  onClick={enableInteraction ? handleAxisSelect : undefined}
                  className={
                    selectedAxis === axis.axis
                      ? 'ring-2 ring-indigo-500 border-indigo-300'
                      : ''
                  }
                />
              ))}
            </div>

            {/* 모바일: 1열 스택 */}
            <div className="md:hidden space-y-4">
              {axisDetails.map((axis) => (
                <AxisScoreDisplay
                  key={axis.axis}
                  axisDetail={axis}
                  compact={true}
                  showTrend={showTrends}
                  onClick={enableInteraction ? handleAxisSelect : undefined}
                  className={
                    selectedAxis === axis.axis
                      ? 'ring-2 ring-indigo-500 border-indigo-300'
                      : ''
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* 선택된 축 상세 정보 */}
        {selectedAxis && enableInteraction && !isExportMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-semibold text-blue-900">
                {selectedAxis} 영역 상세 정보
              </h5>
              <button
                onClick={() => setSelectedAxis(null)}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                닫기
              </button>
            </div>

            {(() => {
              const selectedDetail = axisDetails.find(axis => axis.axis === selectedAxis);
              if (!selectedDetail) return null;

              return (
                <AxisScoreDisplay
                  axisDetail={selectedDetail}
                  compact={false}
                  showTrend={showTrends}
                  className="bg-white"
                />
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function - returns true to skip re-render
  return (
    prevProps.showComparison === nextProps.showComparison &&
    prevProps.enableInteraction === nextProps.enableInteraction &&
    prevProps.isExportMode === nextProps.isExportMode &&
    prevProps.compact === nextProps.compact &&
    prevProps.className === nextProps.className &&
    prevProps.radarData === nextProps.radarData &&
    prevProps.onAxisSelect === nextProps.onAxisSelect
  );
});

RadarOverview.displayName = 'RadarOverview';