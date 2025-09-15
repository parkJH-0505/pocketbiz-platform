import React from 'react';
import type { Core5Requirements, AxisKey } from '../data/eventRequirements';

interface RadarChartProps {
  userScores: Core5Requirements;
  requirements: Core5Requirements;
  size?: number;
  showLabels?: boolean;
  showValues?: boolean;
  userColor?: string;
  requirementColor?: string;
  className?: string;
}

const axisLabels: Record<AxisKey, string> = {
  GO: '성장·운영',
  EC: '수익성',
  PT: '제품·기술',
  PF: '재무·인력',
  TO: '팀·조직'
};

const RadarChart: React.FC<RadarChartProps> = ({
  userScores,
  requirements,
  size = 300,
  showLabels = true,
  showValues = false,
  userColor = '#3B82F6',
  requirementColor = '#EF4444',
  className = ''
}) => {
  const center = size / 2;
  const radius = size * 0.35;
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
  const angleStep = (Math.PI * 2) / axes.length;
  const startAngle = -Math.PI / 2;

  // 좌표 계산 함수
  const getCoordinates = (value: number, index: number): { x: number; y: number } => {
    const angle = startAngle + angleStep * index;
    const normalizedValue = Math.min(100, Math.max(0, value)) / 100;
    const r = radius * normalizedValue;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  // 폴리곤 포인트 생성
  const createPolygonPoints = (scores: Core5Requirements): string => {
    return axes
      .map((axis, index) => {
        const coord = getCoordinates(scores[axis] || 0, index);
        return `${coord.x},${coord.y}`;
      })
      .join(' ');
  };

  // 배경 그리드 생성
  const gridLevels = [20, 40, 60, 80, 100];

  return (
    <div className={className}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 배경 그리드 */}
        <g className="grid">
          {gridLevels.map((level) => (
            <polygon
              key={level}
              points={axes
                .map((_, index) => {
                  const coord = getCoordinates(level, index);
                  return `${coord.x},${coord.y}`;
                })
                .join(' ')}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="1"
              opacity="0.5"
            />
          ))}
        </g>

        {/* 축 라인 */}
        <g className="axes">
          {axes.map((_, index) => {
            const endCoord = getCoordinates(100, index);
            return (
              <line
                key={index}
                x1={center}
                y1={center}
                x2={endCoord.x}
                y2={endCoord.y}
                stroke="#E5E7EB"
                strokeWidth="1"
              />
            );
          })}
        </g>

        {/* 요구사항 폴리곤 (반투명 배경) */}
        <polygon
          points={createPolygonPoints(requirements)}
          fill={requirementColor}
          fillOpacity="0.1"
          stroke={requirementColor}
          strokeWidth="2"
          strokeDasharray="5,5"
        />

        {/* 사용자 점수 폴리곤 */}
        <polygon
          points={createPolygonPoints(userScores)}
          fill={userColor}
          fillOpacity="0.2"
          stroke={userColor}
          strokeWidth="2"
        />

        {/* 점 표시 */}
        <g className="points">
          {/* 요구사항 점 */}
          {axes.map((axis, index) => {
            const coord = getCoordinates(requirements[axis] || 0, index);
            return (
              <circle
                key={`req-${index}`}
                cx={coord.x}
                cy={coord.y}
                r="4"
                fill={requirementColor}
                stroke="white"
                strokeWidth="2"
              />
            );
          })}

          {/* 사용자 점수 점 */}
          {axes.map((axis, index) => {
            const coord = getCoordinates(userScores[axis] || 0, index);
            return (
              <circle
                key={`user-${index}`}
                cx={coord.x}
                cy={coord.y}
                r="4"
                fill={userColor}
                stroke="white"
                strokeWidth="2"
              />
            );
          })}
        </g>

        {/* 라벨 */}
        {showLabels && (
          <g className="labels">
            {axes.map((axis, index) => {
              const angle = startAngle + angleStep * index;
              const labelRadius = radius + 30;
              const x = center + labelRadius * Math.cos(angle);
              const y = center + labelRadius * Math.sin(angle);

              return (
                <g key={axis}>
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-sm font-medium fill-gray-700"
                  >
                    {axisLabels[axis]}
                  </text>
                  {showValues && (
                    <>
                      <text
                        x={x}
                        y={y + 15}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs fill-blue-600"
                      >
                        {userScores[axis] || 0}
                      </text>
                      <text
                        x={x}
                        y={y + 28}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs fill-red-600"
                      >
                        ({requirements[axis] || 0})
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {/* 범례 */}
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: userColor }} />
          <span className="text-sm text-gray-600">내 점수</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: requirementColor }} />
          <span className="text-sm text-gray-600">요구 수준</span>
        </div>
      </div>
    </div>
  );
};

export default RadarChart;