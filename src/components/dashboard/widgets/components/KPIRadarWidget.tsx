/**
 * KPI Radar Widget
 * KPI 레이더 차트 위젯 컴포넌트
 */

import React, { useEffect, useState } from 'react';
import { useKPIDiagnosis } from '../../../../contexts/KPIDiagnosisContext';
import { ThreeRadar } from '../../../../pages/startup/kpi-tabs/ResultsInsightsPanelV2/components/ThreeRadar';
import type { WidgetComponentProps } from '../WidgetRegistry';
import type { AxisKey } from '../../../../pages/startup/kpi-tabs/ResultsInsightsPanelV2/types';

const KPIRadarWidget: React.FC<WidgetComponentProps> = ({
  widgetId,
  config,
  isEditMode,
  onUpdate
}) => {
  const { axisScores, overallScore } = useKPIDiagnosis();
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('2d');

  // 데이터 업데이트 알림
  useEffect(() => {
    if (onUpdate && axisScores) {
      onUpdate({
        scores: axisScores,
        overall: overallScore,
        timestamp: Date.now()
      });
    }
  }, [axisScores, overallScore, onUpdate]);

  // 2D 레이더 차트 렌더링
  const render2DRadar = () => {
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const centerX = 150;
    const centerY = 150;
    const radius = 100;
    const levels = 5;

    // 각도 계산
    const angleStep = (Math.PI * 2) / axes.length;
    const points = axes.map((axis, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const score = axisScores[axis] || 0;
      const r = (score / 100) * radius;
      return {
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle),
        axis,
        score
      };
    });

    // 폴리곤 경로 생성
    const polygonPath = points.map(p => `${p.x},${p.y}`).join(' ');

    return (
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 300 300" className="w-full max-w-sm">
          {/* 배경 그리드 */}
          {[...Array(levels)].map((_, i) => {
            const levelRadius = (radius / levels) * (i + 1);
            const levelPoints = axes.map((_, index) => {
              const angle = index * angleStep - Math.PI / 2;
              return {
                x: centerX + levelRadius * Math.cos(angle),
                y: centerY + levelRadius * Math.sin(angle)
              };
            });
            const levelPath = levelPoints.map(p => `${p.x},${p.y}`).join(' ');

            return (
              <g key={i}>
                <polygon
                  points={levelPath}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  opacity={0.5}
                />
                {i === levels - 1 && (
                  <text
                    x={centerX + levelRadius + 10}
                    y={centerY}
                    fontSize="10"
                    fill="#9ca3af"
                    textAnchor="start"
                    dominantBaseline="middle"
                  >
                    {(100 / levels) * (i + 1)}
                  </text>
                )}
              </g>
            );
          })}

          {/* 축 라인 */}
          {axes.map((axis, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            const labelX = centerX + (radius + 20) * Math.cos(angle);
            const labelY = centerY + (radius + 20) * Math.sin(angle);

            return (
              <g key={axis}>
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={x}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x={labelX}
                  y={labelY}
                  fontSize="12"
                  fill="#374151"
                  fontWeight="600"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {axis}
                </text>
              </g>
            );
          })}

          {/* 데이터 폴리곤 */}
          <polygon
            points={polygonPath}
            fill="rgba(99, 102, 241, 0.2)"
            stroke="rgb(99, 102, 241)"
            strokeWidth="2"
          />

          {/* 데이터 포인트 */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="rgb(99, 102, 241)"
                stroke="white"
                strokeWidth="2"
              />
              <text
                x={point.x}
                y={point.y - 10}
                fontSize="10"
                fill="#374151"
                fontWeight="500"
                textAnchor="middle"
              >
                {point.score.toFixed(0)}
              </text>
            </g>
          ))}
        </svg>

        {/* 종합 점수 */}
        <div className="mt-4 text-center">
          <div className="text-3xl font-bold text-primary-main">
            {overallScore.toFixed(1)}
          </div>
          <div className="text-sm text-neutral-gray">종합 점수</div>
        </div>

        {/* 축별 점수 */}
        <div className="grid grid-cols-5 gap-2 mt-4 w-full">
          {axes.map(axis => (
            <div key={axis} className="text-center">
              <div className="text-xs text-neutral-gray mb-1">{axis}</div>
              <div className="text-lg font-semibold text-neutral-dark">
                {(axisScores[axis] || 0).toFixed(0)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* 뷰 모드 전환 */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setViewMode(viewMode === '2d' ? '3d' : '2d')}
          className="px-3 py-1 text-xs bg-primary-main/10 text-primary-main rounded-lg hover:bg-primary-main/20 transition-colors"
        >
          {viewMode === '2d' ? '3D 보기' : '2D 보기'}
        </button>
      </div>

      {/* 차트 렌더링 */}
      <div className="flex-1 flex items-center justify-center">
        {viewMode === '3d' ? (
          <div className="w-full h-full min-h-[300px]">
            <ThreeRadar
              scores={axisScores}
              width="100%"
              height="100%"
              className="w-full h-full"
            />
          </div>
        ) : (
          render2DRadar()
        )}
      </div>
    </div>
  );
};

export default KPIRadarWidget;