/**
 * FullRadarChart Component
 * 전체 크기 레이더 차트 (5-axis interactive)
 */

import React, { useMemo } from 'react';
import type { FullRadarChartData } from '../../../utils/benchmarkDataExtractor';

interface FullRadarChartProps {
  data: FullRadarChartData;
  className?: string;
}

export const FullRadarChart: React.FC<FullRadarChartProps> = ({
  data,
  className = ''
}) => {
  const { currentPath, benchmarkPath, labelPoints } = useMemo(() => {
    const { axes } = data;
    const count = axes.length;

    // 데이터가 없으면 빈 경로 반환
    if (count === 0) {
      return { currentPath: '', benchmarkPath: '', labelPoints: [] };
    }

    const centerX = 200;
    const centerY = 200;
    const radius = 150;

    // Calculate point position
    const calculatePoint = (score: number, index: number) => {
      const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
      const r = (score / 100) * radius;
      return {
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle)
      };
    };

    // Current scores path
    const currentPoints = axes.map((axis, i) =>
      calculatePoint(axis.currentScore, i)
    );
    const currentPath =
      currentPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

    // Benchmark scores path
    const benchmarkPoints = axes.map((axis, i) =>
      calculatePoint(axis.benchmarkScore, i)
    );
    const benchmarkPath =
      benchmarkPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

    // Label points (outside the chart)
    const labelPoints = axes.map((axis, i) => {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
      const labelRadius = radius + 40;
      return {
        x: centerX + labelRadius * Math.cos(angle),
        y: centerY + labelRadius * Math.sin(angle),
        axis: axis.displayName,
        currentScore: axis.currentScore,
        benchmarkScore: axis.benchmarkScore,
        gap: axis.gap
      };
    });

    return { currentPath, benchmarkPath, labelPoints };
  }, [data]);

  // 데이터가 없으면 빈 상태 표시
  if (labelPoints.length === 0) {
    return (
      <div className={`full-radar-chart ${className}`}>
        <div className="mb-3">
          <h4 className="text-sm font-bold text-gray-900">📈 5-Axis Radar Chart</h4>
          <p className="text-xs text-gray-600">
            파란색: 현재 점수 • 회색: 업계 평균
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-center h-96">
          <p className="text-gray-400 text-sm">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`full-radar-chart ${className}`}>
      <div className="mb-3">
        <h4 className="text-sm font-bold text-gray-900">📈 5-Axis Radar Chart</h4>
        <p className="text-xs text-gray-600">
          파란색: 현재 점수 • 회색: 업계 평균
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <svg width="400" height="400" viewBox="0 0 400 400" className="mx-auto">
          {/* Background circles */}
          {[30, 60, 90, 120, 150].map((r, i) => (
            <circle
              key={i}
              cx="200"
              cy="200"
              r={r}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}

          {/* Axis lines */}
          {labelPoints.map((point, i) => (
            <line
              key={i}
              x1="200"
              y1="200"
              x2={200 + 150 * Math.cos((Math.PI * 2 * i) / labelPoints.length - Math.PI / 2)}
              y2={200 + 150 * Math.sin((Math.PI * 2 * i) / labelPoints.length - Math.PI / 2)}
              stroke="#d1d5db"
              strokeWidth="1"
            />
          ))}

          {/* Score level labels */}
          <text x="205" y="80" fontSize="10" fill="#9ca3af" textAnchor="start">
            80
          </text>
          <text x="205" y="110" fontSize="10" fill="#9ca3af" textAnchor="start">
            60
          </text>
          <text x="205" y="140" fontSize="10" fill="#9ca3af" textAnchor="start">
            40
          </text>
          <text x="205" y="170" fontSize="10" fill="#9ca3af" textAnchor="start">
            20
          </text>

          {/* Benchmark path (gray, behind) */}
          <path
            d={benchmarkPath}
            fill="rgba(156, 163, 175, 0.1)"
            stroke="#9ca3af"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          {/* Current path (blue, front) */}
          <path
            d={currentPath}
            fill="rgba(99, 102, 241, 0.2)"
            stroke="#6366f1"
            strokeWidth="3"
          />

          {/* Axis labels with scores */}
          {labelPoints.map((point, i) => {
            const textAnchor = point.x > 250 ? 'start' : point.x < 150 ? 'end' : 'middle';
            const dy = point.y > 250 ? 12 : point.y < 150 ? -5 : 5;

            return (
              <g key={i}>
                {/* Axis name */}
                <text
                  x={point.x}
                  y={point.y + dy}
                  fontSize="11"
                  fontWeight="600"
                  fill="#374151"
                  textAnchor={textAnchor}
                >
                  {point.axis}
                </text>

                {/* Current score */}
                <text
                  x={point.x}
                  y={point.y + dy + 14}
                  fontSize="13"
                  fontWeight="700"
                  fill="#6366f1"
                  textAnchor={textAnchor}
                >
                  {point.currentScore.toFixed(0)}
                </text>

                {/* Gap indicator */}
                {point.gap !== 0 && (
                  <text
                    x={point.x}
                    y={point.y + dy + 26}
                    fontSize="10"
                    fontWeight="600"
                    fill={point.gap > 0 ? '#10b981' : '#f59e0b'}
                    textAnchor={textAnchor}
                  >
                    {point.gap > 0 ? '+' : ''}
                    {point.gap.toFixed(0)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-indigo-500 rounded" />
            <span className="text-xs text-gray-700">현재 점수</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-dashed border-gray-400 rounded" />
            <span className="text-xs text-gray-700">업계 평균</span>
          </div>
        </div>
      </div>
    </div>
  );
};
