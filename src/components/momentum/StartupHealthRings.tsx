/**
 * StartupHealthRings - Apple Watch 스타일 3개 링 시스템
 *
 * 스타트업의 건강도를 시각적으로 표현:
 * 1. 성장 링 (파란색): KPI 개선률
 * 2. 활동 링 (초록색): 일일 작업 완료율
 * 3. 모멘텀 링 (주황색): 가속도 지표
 */

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RingData {
  label: string;
  value: number; // 0-100
  color: string;
  icon: string;
}

interface StartupHealthRingsProps {
  kpiGrowth: number;      // KPI 개선률 (0-100)
  dailyActivity: number;  // 일일 활동률 (0-100)
  momentum: number;       // 모멘텀 점수 (0-100)
  size?: number;          // 링 전체 크기
  strokeWidth?: number;   // 링 두께
  animate?: boolean;      // 애니메이션 여부
}

const StartupHealthRings: React.FC<StartupHealthRingsProps> = ({
  kpiGrowth = 0,
  dailyActivity = 0,
  momentum = 0,
  size = 120,
  strokeWidth = 8,
  animate = true
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const rings: RingData[] = useMemo(() => [
    {
      label: '성장',
      value: Math.min(100, Math.max(0, kpiGrowth)),
      color: '#3B82F6', // blue-500
      icon: '📈'
    },
    {
      label: '활동',
      value: Math.min(100, Math.max(0, dailyActivity)),
      color: '#10B981', // emerald-500
      icon: '⚡'
    },
    {
      label: '모멘텀',
      value: Math.min(100, Math.max(0, momentum)),
      color: '#F97316', // orange-500
      icon: '🔥'
    }
  ], [kpiGrowth, dailyActivity, momentum]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // 각 링의 반경 계산 (안쪽부터)
  const ringRadii = [
    radius * 0.65,
    radius * 0.82,
    radius
  ];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
      >
        {rings.map((ring, index) => {
          const ringRadius = ringRadii[index];
          const ringCircumference = 2 * Math.PI * ringRadius;
          const strokeDashoffset = ringCircumference - (ring.value / 100) * ringCircumference;

          return (
            <g key={ring.label}>
              {/* 배경 링 */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={ringRadius}
                stroke="#E5E7EB"
                strokeWidth={strokeWidth}
                fill="none"
                opacity={0.3}
              />

              {/* 진행 링 */}
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={ringRadius}
                stroke={ring.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                initial={{ strokeDashoffset: ringCircumference }}
                animate={isVisible ? { strokeDashoffset } : {}}
                transition={{
                  duration: animate ? 1.5 : 0,
                  delay: animate ? index * 0.2 : 0,
                  ease: "easeInOut"
                }}
                style={{
                  filter: ring.value > 95 ? 'url(#glow)' : 'none'
                }}
              />

              {/* 링 끝 점 */}
              {ring.value > 0 && (
                <motion.circle
                  cx={size / 2 + ringRadius * Math.cos((ring.value / 100) * 2 * Math.PI - Math.PI / 2)}
                  cy={size / 2 + ringRadius * Math.sin((ring.value / 100) * 2 * Math.PI - Math.PI / 2)}
                  r={strokeWidth / 2 + 1}
                  fill={ring.color}
                  initial={{ scale: 0 }}
                  animate={isVisible ? { scale: 1 } : {}}
                  transition={{
                    duration: 0.3,
                    delay: animate ? 1.5 + index * 0.2 : 0
                  }}
                />
              )}
            </g>
          );
        })}

        {/* Glow 필터 (100% 달성시) */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* 중앙 정보 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center transform rotate-0">
        <div className="text-2xl font-bold text-gray-900">
          {Math.round((kpiGrowth + dailyActivity + momentum) / 3)}%
        </div>
        <div className="text-xs text-gray-500">종합</div>
      </div>

      {/* 호버시 상세 정보 */}
      <div className="absolute -bottom-1 left-full ml-2 opacity-0 hover:opacity-100 transition-opacity">
        <div className="bg-white rounded-lg shadow-lg p-2 text-xs whitespace-nowrap">
          {rings.map((ring) => (
            <div key={ring.label} className="flex items-center gap-2 py-0.5">
              <span>{ring.icon}</span>
              <span className="text-gray-600">{ring.label}:</span>
              <span className="font-semibold" style={{ color: ring.color }}>
                {ring.value}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 목표 달성 애니메이션 */}
      <AnimatePresence>
        {rings.some(r => r.value >= 100) && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ scale: 1, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatDelay: 2
            }}
          >
            <div className="w-full h-full rounded-full border-2 border-yellow-400" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StartupHealthRings;