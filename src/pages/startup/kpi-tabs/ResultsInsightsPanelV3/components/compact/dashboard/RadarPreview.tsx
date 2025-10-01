/**
 * RadarPreview Component
 * Compact Radar Chart 미리보기 (280px height)
 */

import React, { useMemo } from 'react';
import { getAxisDisplayName } from '../../../utils/dashboardDataExtractor';

interface RadarPreviewProps {
  radarData: {
    currentScores: Record<string, number>;
    comparisonScores?: Record<string, number>;
  };
  className?: string;
}

export const RadarPreview: React.FC<RadarPreviewProps> = ({
  radarData,
  className = ''
}) => {
  const { currentScores, comparisonScores } = radarData;

  // SVG 경로 계산
  const { path, comparisonPath, points } = useMemo(() => {
    const axes = Object.keys(currentScores);
    const count = axes.length;
    const centerX = 120;
    const centerY = 120;
    const radius = 100;

    const calculatePoint = (score: number, index: number) => {
      const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
      const r = (score / 100) * radius;
      return {
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle)
      };
    };

    const currentPoints = axes.map((axis, i) =>
      calculatePoint(currentScores[axis], i)
    );

    const currentPath = currentPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ') + ' Z';

    let compPath = '';
    if (comparisonScores) {
      const compPoints = axes.map((axis, i) =>
        calculatePoint(comparisonScores[axis] || 0, i)
      );
      compPath = compPoints
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
        .join(' ') + ' Z';
    }

    // 축 라벨 위치
    const labelPoints = axes.map((axis, i) => {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
      const r = radius + 20;
      return {
        axis,
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle),
        score: currentScores[axis]
      };
    });

    return {
      path: currentPath,
      comparisonPath: compPath,
      points: labelPoints
    };
  }, [currentScores, comparisonScores]);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">
        5축 균형 미리보기
      </h4>

      <svg
        width="240"
        height="240"
        viewBox="0 0 240 240"
        className="mx-auto"
      >
        {/* 배경 원들 */}
        {[20, 40, 60, 80, 100].map((r, i) => (
          <circle
            key={i}
            cx="120"
            cy="120"
            r={r}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray={i === 4 ? '0' : '2,2'}
          />
        ))}

        {/* 축 선 */}
        {points.map((p, i) => (
          <line
            key={i}
            x1="120"
            y1="120"
            x2={p.x - (p.x - 120) * 0.2}
            y2={p.y - (p.y - 120) * 0.2}
            stroke="#cbd5e1"
            strokeWidth="1"
          />
        ))}

        {/* 비교 데이터 (있으면) */}
        {comparisonPath && (
          <path
            d={comparisonPath}
            fill="rgba(156, 163, 175, 0.2)"
            stroke="#9ca3af"
            strokeWidth="2"
            strokeDasharray="4,4"
          />
        )}

        {/* 현재 데이터 */}
        <path
          d={path}
          fill="rgba(99, 102, 241, 0.2)"
          stroke="#6366f1"
          strokeWidth="2"
        />

        {/* 데이터 포인트 */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={120 + (p.x - 120) * (currentScores[p.axis] / 100)}
            cy={120 + (p.y - 120) * (currentScores[p.axis] / 100)}
            r="4"
            fill="#6366f1"
          />
        ))}

        {/* 축 라벨 */}
        {points.map((p, i) => (
          <g key={i}>
            <text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[10px] font-semibold fill-gray-700"
            >
              {getAxisDisplayName(p.axis)}
            </text>
            <text
              x={p.x}
              y={p.y + 12}
              textAnchor="middle"
              className="text-[10px] font-bold fill-indigo-600"
            >
              {p.score.toFixed(0)}
            </text>
          </g>
        ))}
      </svg>

      <div className="flex items-center justify-center gap-4 mt-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-1 bg-indigo-500 rounded"></div>
          <span className="text-gray-600">현재</span>
        </div>
        {comparisonPath && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-1 bg-gray-400 rounded border-dashed border"></div>
            <span className="text-gray-600">비교</span>
          </div>
        )}
      </div>
    </div>
  );
};
