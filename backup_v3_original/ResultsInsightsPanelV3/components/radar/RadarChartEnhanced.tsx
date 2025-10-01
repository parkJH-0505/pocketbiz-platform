/**
 * RadarChartEnhanced Component
 * 기존 V1 RadarChart를 기반으로 한 고도화된 레이더 차트
 */

import React, { useState, memo, useCallback, useMemo } from 'react';
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Award,
  Minus,
  Info
} from 'lucide-react';
import type {
  RadarChartEnhancedProps,
  RadarDataPoint,
  AxisSelectHandler
} from '../../types/reportV3UI.types';
import { StatusBadge } from '../shared/StatusBadge';

export const RadarChartEnhanced = memo<RadarChartEnhancedProps>(({
  data,
  height = 400,
  showComparison = true,
  enableAxisClick = true,
  showTrendIndicators = true,
  comparisonMode = 'peer',
  onAxisSelect,
  isExportMode = false,
  className = ''
}) => {
  const [selectedAxis, setSelectedAxis] = useState<string | null>(null);
  const [hoveredAxis, setHoveredAxis] = useState<string | null>(null);

  // 축 클릭 핸들러 - useCallback으로 최적화
  const handleAxisClick = useCallback((axisKey: string) => {
    if (!enableAxisClick) return;

    setSelectedAxis(axisKey === selectedAxis ? null : axisKey);
    if (onAxisSelect) {
      onAxisSelect(axisKey as any);
    }
  }, [enableAxisClick, onAxisSelect, selectedAxis]);

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const axisData = data.axisDetails[label as keyof typeof data.axisDetails];
    if (!axisData) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-xs">
        <div className="font-semibold text-gray-800 mb-2">{label}</div>

        {/* 현재 점수 */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">현재 점수:</span>
          <span className="font-bold text-indigo-600">
            {payload[0].value.toFixed(1)}점
          </span>
        </div>

        {/* 이전 점수 및 트렌드 */}
        {axisData.previousScore && showTrendIndicators && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">이전 대비:</span>
            <div className="flex items-center gap-1">
              {axisData.trend === 'up' && <TrendingUp size={14} className="text-green-500" />}
              {axisData.trend === 'down' && <TrendingDown size={14} className="text-red-500" />}
              {axisData.trend === 'stable' && <Minus size={14} className="text-gray-400" />}
              <span className={`text-sm font-medium ${
                axisData.trend === 'up' ? 'text-green-500' :
                axisData.trend === 'down' ? 'text-red-500' :
                'text-gray-400'
              }`}>
                {axisData.trendValue && axisData.trendValue !== 0
                  ? `${axisData.trendValue > 0 ? '+' : ''}${axisData.trendValue.toFixed(1)}`
                  : '0.0'
                }
              </span>
            </div>
          </div>
        )}

        {/* 피어 평균 */}
        {axisData.peerAverage && showComparison && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">피어 평균:</span>
            <span className="text-sm text-gray-700">
              {axisData.peerAverage.toFixed(1)}점
            </span>
          </div>
        )}

        {/* 주요 KPI */}
        {axisData.keyKPIs.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-1">주요 KPI:</div>
            <div className="text-xs text-gray-700">
              {axisData.keyKPIs.slice(0, 2).join(', ')}
              {axisData.keyKPIs.length > 2 && ` 외 ${axisData.keyKPIs.length - 2}개`}
            </div>
          </div>
        )}

        {/* 인사이트 */}
        {axisData.insight && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-600 leading-relaxed">
              {axisData.insight}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 축 라벨 커스터마이징
  const CustomAxisLabel = (props: any) => {
    const { payload, x, y, cx, cy } = props;
    const axisKey = payload.value;
    const axisDetail = data.axisDetails[axisKey];

    if (!axisDetail) return null;

    const isSelected = selectedAxis === axisKey;
    const isHovered = hoveredAxis === axisKey;
    const isRisk = data.riskHighlights?.includes(axisKey);
    const isAchievement = data.achievementBadges?.includes(axisKey);

    return (
      <g>
        {/* 배경 원 */}
        <circle
          cx={x}
          cy={y}
          r={isSelected ? 28 : isHovered ? 24 : 20}
          fill={isSelected ? '#6366f1' : isRisk ? '#fee2e2' : isAchievement ? '#dcfce7' : '#f8fafc'}
          stroke={isSelected ? '#4f46e5' : isRisk ? '#fca5a5' : isAchievement ? '#86efac' : '#e2e8f0'}
          strokeWidth={2}
          className="transition-all duration-200 cursor-pointer"
          onClick={() => handleAxisClick(axisKey)}
          onMouseEnter={() => setHoveredAxis(axisKey)}
          onMouseLeave={() => setHoveredAxis(null)}
        />

        {/* 축 텍스트 */}
        <text
          x={x}
          y={y - 2}
          textAnchor="middle"
          fontSize={isSelected ? 11 : 10}
          fontWeight={isSelected ? 600 : 500}
          fill={isSelected ? 'white' : '#374151'}
          className="pointer-events-none"
        >
          {axisKey}
        </text>

        {/* 점수 표시 */}
        <text
          x={x}
          y={y + 8}
          textAnchor="middle"
          fontSize={9}
          fontWeight={600}
          fill={isSelected ? 'white' : '#6b7280'}
          className="pointer-events-none"
        >
          {axisDetail.score.toFixed(1)}
        </text>

        {/* 위험/성취 아이콘 */}
        {(isRisk || isAchievement) && (
          <g transform={`translate(${x + 15}, ${y - 15})`}>
            <circle
              r={8}
              fill={isRisk ? '#ef4444' : '#10b981'}
              className="drop-shadow-sm"
            />
            {isRisk && (
              <path
                d="M-3,-3 L3,3 M3,-3 L-3,3"
                stroke="white"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            )}
            {isAchievement && (
              <path
                d="M-2,0 L0,2 L4,-2"
                stroke="white"
                strokeWidth={1.5}
                strokeLinecap="round"
                fill="none"
              />
            )}
          </g>
        )}

        {/* 트렌드 표시 */}
        {showTrendIndicators && axisDetail.trend && axisDetail.trend !== 'stable' && (
          <g transform={`translate(${x - 15}, ${y - 15})`}>
            <circle
              r={6}
              fill={axisDetail.trend === 'up' ? '#10b981' : '#ef4444'}
              className="drop-shadow-sm"
            />
            <path
              d={axisDetail.trend === 'up' ? 'M-2,1 L0,-1 L2,1' : 'M-2,-1 L0,1 L2,-1'}
              stroke="white"
              strokeWidth={1}
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )}
      </g>
    );
  };

  return (
    <div className={`radar-chart-enhanced ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsRadarChart data={data.mainData} margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
          <PolarGrid
            gridType="polygon"
            stroke="#e5e7eb"
            strokeWidth={1}
            radialLines={true}
          />

          <PolarAngleAxis
            dataKey="axis"
            tick={CustomAxisLabel}
            className="text-gray-600"
          />

          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickCount={6}
            stroke="#d1d5db"
            strokeWidth={1}
          />

          {/* 메인 데이터 */}
          <Radar
            name="현재 점수"
            dataKey="value"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.25}
            strokeWidth={3}
            dot={{ fill: '#6366f1', strokeWidth: 2, r: 5 }}
          />

          {/* 비교 데이터 */}
          {showComparison && data.comparisonData && (
            <Radar
              name={comparisonMode === 'peer' ? '피어 평균' : comparisonMode === 'benchmark' ? '벤치마크' : '이전 점수'}
              dataKey="value"
              data={data.comparisonData}
              stroke="#9ca3af"
              fill="#9ca3af"
              fillOpacity={0.1}
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ fill: '#9ca3af', strokeWidth: 1, r: 3 }}
            />
          )}

          {/* 상위 성과자 데이터 */}
          {showComparison && data.thirdData && (
            <Radar
              name="상위 10%"
              dataKey="value"
              data={data.thirdData}
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.05}
              strokeWidth={1.5}
              strokeDasharray="2 2"
              dot={false}
            />
          )}

          <Tooltip content={<CustomTooltip />} />

          {!isExportMode && (
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '12px'
              }}
            />
          )}
        </RechartsRadarChart>
      </ResponsiveContainer>

      {/* 주석 표시 */}
      {data.annotations && data.annotations.length > 0 && !isExportMode && (
        <div className="mt-4 space-y-2">
          {data.annotations.map((annotation, index) => (
            <div
              key={index}
              className={`flex items-start gap-2 p-2 rounded text-sm ${
                annotation.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                annotation.type === 'success' ? 'bg-green-50 text-green-800' :
                annotation.type === 'critical' ? 'bg-red-50 text-red-800' :
                'bg-blue-50 text-blue-800'
              }`}
            >
              <Info size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">{annotation.axis}:</span>{' '}
                {annotation.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function - returns true to skip re-render
  return (
    prevProps.height === nextProps.height &&
    prevProps.showComparison === nextProps.showComparison &&
    prevProps.enableAxisClick === nextProps.enableAxisClick &&
    prevProps.showTrendIndicators === nextProps.showTrendIndicators &&
    prevProps.comparisonMode === nextProps.comparisonMode &&
    prevProps.isExportMode === nextProps.isExportMode &&
    prevProps.className === nextProps.className &&
    prevProps.data === nextProps.data &&
    prevProps.onAxisSelect === nextProps.onAxisSelect
  );
});

RadarChartEnhanced.displayName = 'RadarChartEnhanced';