/**
 * KPI Radar Mini Component
 *
 * 대시보드용 소형 레이더 차트
 * - 5개 축 KPI 점수 시각화
 * - 이전 점수와 비교
 * - 클릭하면 상세 결과 페이지로 이동
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { useKPIDiagnosis } from '../../contexts/KPIDiagnosisContext';
import { useNavigate } from 'react-router-dom';

interface KPIRadarMiniProps {
  className?: string;
}

const KPIRadarMini: React.FC<KPIRadarMiniProps> = ({ className = '' }) => {
  const { axisScores, overallScore, previousScores, progress } = useKPIDiagnosis();
  const navigate = useNavigate();

  const axes = [
    { key: 'GO', label: 'GO', color: 'blue', fullName: 'Growth & Ops' },
    { key: 'EC', label: 'EC', color: 'green', fullName: 'Economics' },
    { key: 'PT', label: 'PT', color: 'purple', fullName: 'Product & Tech' },
    { key: 'PF', label: 'PF', color: 'orange', fullName: 'Proof' },
    { key: 'TO', label: 'TO', color: 'red', fullName: 'Team & Org' }
  ] as const;

  // SVG 좌표 계산 (정오각형)
  const getAxisPosition = (index: number, radius: number = 40) => {
    const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2; // -90도 시작 (위쪽)
    return {
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle)
    };
  };

  // 점수 기반 좌표 계산
  const getScorePosition = (index: number, score: number) => {
    const maxRadius = 40;
    const radius = (score / 100) * maxRadius;
    return getAxisPosition(index, radius);
  };

  // 점수 변화 계산
  const getScoreChange = (current: number, previous: number) => {
    const change = current - previous;
    return {
      value: Math.abs(change),
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    };
  };

  const handleClick = () => {
    navigate('/startup/kpi-diagnosis/results');
  };

  return (
    <motion.div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-all ${className}`}
      whileHover={{ y: -2 }}
      onClick={handleClick}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">KPI 레이더</h3>
          <p className="text-xs text-gray-600">5축 종합 분석</p>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-lg font-bold text-blue-600">{overallScore.toFixed(1)}</span>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* 미니 레이더 차트 */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <svg width="100" height="100" viewBox="0 0 100 100" className="transform">
            {/* 배경 격자 */}
            {[20, 40].map(radius => (
              <polygon
                key={radius}
                points={axes.map((_, i) => {
                  const pos = getAxisPosition(i, radius);
                  return `${pos.x},${pos.y}`;
                }).join(' ')}
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            ))}

            {/* 축 선 */}
            {axes.map((_, index) => {
              const pos = getAxisPosition(index, 42);
              return (
                <line
                  key={index}
                  x1="50"
                  y1="50"
                  x2={pos.x}
                  y2={pos.y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              );
            })}

            {/* 이전 점수 (배경) */}
            {Object.values(previousScores).some(score => score > 0) && (
              <polygon
                points={axes.map((axis, i) => {
                  const pos = getScorePosition(i, previousScores[axis.key as keyof typeof previousScores]);
                  return `${pos.x},${pos.y}`;
                }).join(' ')}
                fill="rgba(209, 213, 219, 0.3)"
                stroke="rgba(209, 213, 219, 0.6)"
                strokeWidth="1"
              />
            )}

            {/* 현재 점수 */}
            <polygon
              points={axes.map((axis, i) => {
                const pos = getScorePosition(i, axisScores[axis.key as keyof typeof axisScores]);
                return `${pos.x},${pos.y}`;
              }).join(' ')}
              fill="rgba(59, 130, 246, 0.2)"
              stroke="#3b82f6"
              strokeWidth="2"
            />

            {/* 축 점 */}
            {axes.map((axis, index) => {
              const pos = getScorePosition(index, axisScores[axis.key as keyof typeof axisScores]);
              return (
                <circle
                  key={axis.key}
                  cx={pos.x}
                  cy={pos.y}
                  r="3"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="1"
                />
              );
            })}
          </svg>

          {/* 축 라벨 */}
          {axes.map((axis, index) => {
            const pos = getAxisPosition(index, 48);
            return (
              <div
                key={axis.key}
                className="absolute text-xs font-medium text-gray-700 transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`
                }}
              >
                {axis.label}
              </div>
            );
          })}
        </div>

        {/* 축별 점수 */}
        <div className="flex-1 space-y-1">
          {axes.map((axis) => {
            const currentScore = axisScores[axis.key as keyof typeof axisScores];
            const previousScore = previousScores[axis.key as keyof typeof previousScores];
            const change = getScoreChange(currentScore, previousScore);

            return (
              <div key={axis.key} className="flex items-center justify-between">
                <span className="text-xs text-gray-600 w-8">{axis.label}</span>
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">
                    {currentScore.toFixed(0)}
                  </span>
                  {change.trend !== 'neutral' && (
                    <div className="flex items-center space-x-0.5">
                      {change.trend === 'up' ? (
                        <TrendingUp className="w-3 h-3 text-green-600" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-600" />
                      )}
                      <span className={`text-xs ${
                        change.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {change.value.toFixed(0)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 진행률 */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">진단 완료</span>
          <span className="font-medium text-gray-900">{progress.percentage}%</span>
        </div>
        <div className="mt-1 w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default KPIRadarMini;