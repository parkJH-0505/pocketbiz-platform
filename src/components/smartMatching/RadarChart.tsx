import React, { useEffect, useState } from 'react';
import type { Core5Scores } from '../../types/smartMatching';

interface RadarChartProps {
  userScores: Core5Scores;
  requiredScores?: Core5Scores | null;
  showAverage?: boolean;
  size?: number;
  className?: string;
  animated?: boolean;
}

const RadarChart: React.FC<RadarChartProps> = ({
  userScores,
  requiredScores = null,
  showAverage = true,
  size = 300,
  className = '',
  animated = true
}) => {
  const [animatedRequiredScores, setAnimatedRequiredScores] = useState<Core5Scores | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // 요구 점수 변경시 애니메이션
  useEffect(() => {
    if (requiredScores && animated) {
      setIsAnimating(true);
      setAnimatedRequiredScores(null);

      const timer = setTimeout(() => {
        setAnimatedRequiredScores(requiredScores);
        setIsAnimating(false);
      }, 100);

      return () => clearTimeout(timer);
    } else {
      setAnimatedRequiredScores(requiredScores);
    }
  }, [requiredScores, animated]);
  // 5개 축 정의
  const axes = [
    { key: 'GO', label: 'GO', fullName: '성장기회', angle: 90 },
    { key: 'EC', label: 'EC', fullName: '실행역량', angle: 162 },
    { key: 'PT', label: 'PT', fullName: '제품기술', angle: 234 },
    { key: 'PF', label: 'PF', fullName: '플랫폼', angle: 306 },
    { key: 'TO', label: 'TO', fullName: '팀조직', angle: 18 }
  ];

  const center = size / 2;
  const maxRadius = size * 0.4;

  // 극좌표를 데카르트 좌표로 변환
  const polarToCartesian = (angle: number, value: number) => {
    const radian = (angle - 90) * Math.PI / 180;
    const radius = (value / 100) * maxRadius;
    return {
      x: center + radius * Math.cos(radian),
      y: center + radius * Math.sin(radian)
    };
  };

  // 다각형 경로 생성
  const createPath = (scores: Core5Scores) => {
    return axes
      .map(axis => {
        const point = polarToCartesian(axis.angle, scores[axis.key as keyof Core5Scores]);
        return `${point.x},${point.y}`;
      })
      .join(' ');
  };

  // 그리드 라인 생성 (20점 간격)
  const gridLines = [20, 40, 60, 80, 100];

  return (
    <div className={`relative ${className}`}>
      <svg width={size} height={size} className="w-full h-full">
        {/* 배경 그리드 */}
        <g className="grid">
          {/* 동심원 */}
          {gridLines.map(value => {
            const radius = (value / 100) * maxRadius;
            return (
              <circle
                key={value}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={value === 60 ? '#d1d5db' : '#f3f4f6'}
                strokeWidth={value === 60 ? 1.5 : 1}
                strokeDasharray={value === 60 ? '4 2' : undefined}
              />
            );
          })}

          {/* 축 라인 */}
          {axes.map(axis => {
            const endPoint = polarToCartesian(axis.angle, 100);
            return (
              <line
                key={axis.key}
                x1={center}
                y1={center}
                x2={endPoint.x}
                y2={endPoint.y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            );
          })}

          {/* 60점 평균선 강조 (옵션) */}
          {showAverage && (
            <g>
              <polygon
                points={axes.map(axis => {
                  const point = polarToCartesian(axis.angle, 60);
                  return `${point.x},${point.y}`;
                }).join(' ')}
                fill="none"
                stroke="#9ca3af"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.5"
              />
              <text
                x={center + maxRadius * 0.6 + 10}
                y={center}
                fill="#9ca3af"
                fontSize="11"
                textAnchor="start"
              >
                평균
              </text>
            </g>
          )}
        </g>

        {/* 축 레이블 */}
        <g className="labels">
          {axes.map(axis => {
            const labelPoint = polarToCartesian(axis.angle, 115);
            return (
              <g key={axis.key}>
                <text
                  x={labelPoint.x}
                  y={labelPoint.y}
                  fill="#374151"
                  fontSize="14"
                  fontWeight="600"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {axis.label}
                </text>
                <text
                  x={labelPoint.x}
                  y={labelPoint.y + 14}
                  fill="#6b7280"
                  fontSize="11"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {axis.fullName}
                </text>
              </g>
            );
          })}
        </g>

        {/* 사용자 데이터 레이어 (파란색) - 항상 표시 */}
        <g className="user-data">
          <polygon
            points={createPath(userScores)}
            fill="#3b82f6"
            fillOpacity="0.25"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* 데이터 포인트 */}
          {axes.map(axis => {
            const point = polarToCartesian(axis.angle, userScores[axis.key as keyof Core5Scores]);
            return (
              <circle
                key={`user-${axis.key}`}
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#3b82f6"
                stroke="white"
                strokeWidth="2"
              />
            );
          })}
        </g>

        {/* 요구 데이터 레이어 (빨간색) - 선택시만 표시 */}
        {animatedRequiredScores && (
          <g className={`required-data ${isAnimating ? 'transition-opacity duration-300' : ''}`}>
            <polygon
              points={createPath(animatedRequiredScores)}
              fill="#ef4444"
              fillOpacity="0.15"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeDasharray="5 3"
              style={{
                transition: animated ? 'all 0.5s ease-in-out' : 'none',
                opacity: isAnimating ? 0 : 1
              }}
            />
            {/* 데이터 포인트 */}
            {axes.map(axis => {
              const point = polarToCartesian(axis.angle, animatedRequiredScores[axis.key as keyof Core5Scores]);
              return (
                <circle
                  key={`required-${axis.key}`}
                  cx={point.x}
                  cy={point.y}
                  r="3"
                  fill="#ef4444"
                  stroke="white"
                  strokeWidth="1.5"
                  style={{
                    transition: animated ? 'all 0.5s ease-in-out' : 'none',
                    opacity: isAnimating ? 0 : 1
                  }}
                />
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
};

export default RadarChart;