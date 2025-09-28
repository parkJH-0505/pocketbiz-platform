import React from 'react';
import type { ProjectPhase } from '../../types/buildup.types';
import { getConnectionLineStyle } from '../../utils/verticalProgressCalculator';

interface ProgressLineProps {
  fromPhase: ProjectPhase;
  toPhase: ProjectPhase;
  currentPhase: ProjectPhase;
  index: number;
}

const ProgressLine: React.FC<ProgressLineProps> = ({
  fromPhase,
  toPhase,
  currentPhase,
  index
}) => {
  const lineStyle = getConnectionLineStyle(fromPhase, toPhase, currentPhase);
  const nodeHeight = 140; // 노드 높이와 맞춤
  const nodeSpacing = 100; // 노드 간격과 맞춤
  const topOffset = index * (nodeHeight + nodeSpacing) + 64; // 노드 높이의 절반 (64px / 2)

  return (
    <div
      className="absolute left-8" // 노드 중앙 위치 조정
      style={{
        top: `${topOffset}px`,
        height: `${nodeHeight + nodeSpacing}px`
      }}
    >
      {/* 완료된 구간 - 실선 with gradient */}
      {lineStyle.type === 'solid' && (
        <div className="relative w-1 h-full">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-full" />
          {/* 내부 하이라이트 */}
          <div className="absolute left-0.5 top-0 w-0.5 h-full bg-gradient-to-b from-emerald-300/50 to-transparent rounded-full" />
        </div>
      )}

      {/* 진행중 구간 - 애니메이션 그라데이션 */}
      {lineStyle.type === 'gradient' && (
        <div className="relative w-1 h-full">
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id={`progress-gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
                <stop offset="50%" stopColor="#60a5fa" stopOpacity="1">
                  <animate
                    attributeName="offset"
                    values="30%;60%;30%"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.6" />
              </linearGradient>

              {/* 글로우 효과 필터 */}
              <filter id={`glow-${index}`}>
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* 메인 라인 */}
            <rect
              x="0"
              y="0"
              width="4"
              height="100%"
              rx="2"
              fill={`url(#progress-gradient-${index})`}
              filter={`url(#glow-${index})`}
            />

            {/* 플로우 애니메이션 */}
            <rect
              x="1"
              y="0"
              width="2"
              height="20"
              rx="1"
              fill="rgba(255, 255, 255, 0.6)"
              opacity="0"
            >
              <animate
                attributeName="y"
                values="0;100%;0"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;1;0"
                dur="2s"
                repeatCount="indefinite"
              />
            </rect>
          </svg>
        </div>
      )}

      {/* 예정 구간 - 점선 */}
      {lineStyle.type === 'dashed' && (
        <div className="relative w-1 h-full">
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              {/* 점선 패턴 */}
              <pattern id={`dash-pattern-${index}`} patternUnits="userSpaceOnUse" width="4" height="12">
                <rect x="0" y="0" width="4" height="6" rx="2" fill="#d1d5db" opacity="0.6" />
              </pattern>
            </defs>

            {/* 점선 라인 */}
            <rect
              x="0"
              y="0"
              width="4"
              height="100%"
              fill={`url(#dash-pattern-${index})`}
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default ProgressLine;