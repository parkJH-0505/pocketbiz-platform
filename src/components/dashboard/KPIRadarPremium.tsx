/**
 * KPI Radar Premium Component
 *
 * 사이드 패널용 고도화된 KPI 레이더 차트
 * - 더 큰 크기의 레이더 차트
 * - 상세한 축별 분석
 * - 진행률 및 개선 제안
 * - 트렌드 분석
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import { useKPIDiagnosis } from '../../contexts/KPIDiagnosisContext';
import { useNavigate } from 'react-router-dom';

interface KPIRadarPremiumProps {
  className?: string;
}

const KPIRadarPremium: React.FC<KPIRadarPremiumProps> = ({ className = '' }) => {
  const { axisScores, overallScore, previousScores, progress } = useKPIDiagnosis();
  const navigate = useNavigate();

  const axes = [
    { key: 'GO', label: 'GO', color: '#3b82f6', fullName: 'Growth & Operations', description: '성장 및 운영 역량' },
    { key: 'EC', label: 'EC', color: '#10b981', fullName: 'Economics', description: '경제적 지속가능성' },
    { key: 'PT', label: 'PT', color: '#8b5cf6', fullName: 'Product & Tech', description: '제품 및 기술력' },
    { key: 'PF', label: 'PF', color: '#f59e0b', fullName: 'Proof', description: '검증 및 증명' },
    { key: 'TO', label: 'TO', color: '#ef4444', fullName: 'Team & Organization', description: '팀 및 조직' }
  ] as const;

  // SVG 좌표 계산 (정오각형) - 더 큰 사이즈
  const getAxisPosition = (index: number, radius: number = 120) => {
    const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2; // -90도 시작 (위쪽)
    return {
      x: 150 + radius * Math.cos(angle),
      y: 150 + radius * Math.sin(angle)
    };
  };

  // 점수 기반 좌표 계산
  const getScorePosition = (index: number, score: number) => {
    const maxRadius = 120;
    const radius = (score / 100) * maxRadius;
    return getAxisPosition(index, radius);
  };

  // 점수 변화 계산
  const getScoreChange = (current: number, previous: number) => {
    const change = current - previous;
    return {
      value: Math.abs(change),
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      percentage: previous > 0 ? (change / previous) * 100 : 0
    };
  };

  // 강점과 약점 분석
  const getAnalysis = () => {
    const scores = axes.map(axis => ({
      ...axis,
      score: axisScores[axis.key as keyof typeof axisScores],
      change: getScoreChange(
        axisScores[axis.key as keyof typeof axisScores],
        previousScores[axis.key as keyof typeof previousScores]
      )
    }));

    const strongest = scores.reduce((max, current) =>
      current.score > max.score ? current : max
    );

    const weakest = scores.reduce((min, current) =>
      current.score < min.score ? current : min
    );

    const improving = scores.filter(s => s.change.trend === 'up');
    const declining = scores.filter(s => s.change.trend === 'down');

    return { strongest, weakest, improving, declining, scores };
  };

  const analysis = getAnalysis();

  const handleNavigateToResults = () => {
    navigate('/startup/kpi?tab=insights');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 종합 점수 카드 */}
      <motion.div
        className="bg-gradient-to-br from-primary-main to-primary-dark rounded-xl p-6 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold">종합 KPI 점수</h3>
            <p className="text-primary-100 text-sm">5개 축 평균 점수</p>
          </div>
          <Award className="w-8 h-8 text-primary-100" />
        </div>

        <div className="flex items-end gap-4">
          <span className="text-4xl font-bold">{overallScore.toFixed(1)}</span>
          <div className="flex items-center gap-1 mb-2">
            {analysis.scores.filter(s => s.change.trend === 'up').length >
             analysis.scores.filter(s => s.change.trend === 'down').length ? (
              <TrendingUp className="w-5 h-5 text-green-300" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-300" />
            )}
            <span className="text-sm text-primary-100">
              전체적으로 {analysis.improving.length > analysis.declining.length ? '상승' : '하락'} 추세
            </span>
          </div>
        </div>
      </motion.div>

      {/* 레이더 차트 */}
      <motion.div
        className="bg-white rounded-xl p-6 border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-semibold text-gray-900">5축 KPI 레이더</h4>
          <button
            onClick={handleNavigateToResults}
            className="flex items-center gap-1 text-sm text-primary-main hover:text-primary-dark transition-colors"
          >
            상세보기
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="relative flex justify-center">
          <svg width="300" height="300" viewBox="0 0 300 300" className="drop-shadow-sm">
            {/* 배경 격자 */}
            {[40, 80, 120].map(radius => (
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
              const pos = getAxisPosition(index, 125);
              return (
                <line
                  key={index}
                  x1="150"
                  y1="150"
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
                fill="rgba(209, 213, 219, 0.2)"
                stroke="rgba(209, 213, 219, 0.5)"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            )}

            {/* 현재 점수 */}
            <polygon
              points={axes.map((axis, i) => {
                const pos = getScorePosition(i, axisScores[axis.key as keyof typeof axisScores]);
                return `${pos.x},${pos.y}`;
              }).join(' ')}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="#3b82f6"
              strokeWidth="3"
            />

            {/* 축 점 */}
            {axes.map((axis, index) => {
              const pos = getScorePosition(index, axisScores[axis.key as keyof typeof axisScores]);
              const score = axisScores[axis.key as keyof typeof axisScores];
              return (
                <g key={axis.key}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="6"
                    fill={axis.color}
                    stroke="white"
                    strokeWidth="2"
                  />
                  {/* 점수 표시 */}
                  <text
                    x={pos.x}
                    y={pos.y - 12}
                    textAnchor="middle"
                    className="text-xs font-semibold fill-gray-700"
                  >
                    {score.toFixed(0)}
                  </text>
                </g>
              );
            })}

            {/* 축 라벨 */}
            {axes.map((axis, index) => {
              const pos = getAxisPosition(index, 140);
              return (
                <g key={`label-${axis.key}`}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="16"
                    fill={axis.color}
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    className="text-xs font-bold fill-white"
                  >
                    {axis.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </motion.div>

      {/* 축별 상세 분석 */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h4 className="font-semibold text-gray-900 mb-4">축별 분석</h4>

        {analysis.scores.map((axis) => (
          <div key={axis.key} className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: axis.color }}
                />
                <div>
                  <span className="font-medium text-gray-900">{axis.fullName}</span>
                  <p className="text-sm text-gray-600">{axis.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {axis.score.toFixed(1)}
                </span>
                {axis.change.trend !== 'neutral' && (
                  <div className="flex items-center gap-1">
                    {axis.change.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm ${
                      axis.change.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {axis.change.value.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 진행률 바 */}
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${axis.score}%`,
                  backgroundColor: axis.color
                }}
              />
            </div>
          </div>
        ))}
      </motion.div>

      {/* 진단 완료도 */}
      <motion.div
        className="bg-white rounded-xl p-6 border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900">진단 완료도</h4>
          <div className="flex items-center gap-2">
            {progress.percentage === 100 ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-orange-600" />
            )}
            <span className="font-bold text-gray-900">{progress.percentage}%</span>
          </div>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-3 mb-4">
          <div
            className="bg-gradient-to-r from-primary-main to-primary-dark h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>

        {progress.percentage < 100 && (
          <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-800">
                추가 진단으로 더 정확한 분석을 받아보세요
              </p>
              <p className="text-xs text-orange-600 mt-1">
                {100 - progress.percentage}% 더 완료하면 개인화된 성장 전략을 제공받을 수 있습니다
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleNavigateToResults}
          className="w-full mt-4 bg-primary-main hover:bg-primary-dark text-white py-2 px-4 rounded-lg transition-colors font-medium"
        >
          상세 결과 보러가기
        </button>
      </motion.div>
    </div>
  );
};

export default KPIRadarPremium;