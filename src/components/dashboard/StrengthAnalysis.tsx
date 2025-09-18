/**
 * Strength Analysis Component
 *
 * 사용자의 강점을 분석하여 표시하는 컴포넌트
 * - 각 축(GO, EC, PT, PF, TO)별 강점 표시
 * - 동종업계 대비 백분위 표시
 * - 트렌드 화살표 (상승/하락/안정)
 * - 강점 메시지와 격려 문구
 * - "매일 만나고 싶은 성장 동반자" 톤앤매너
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Award, Target, Users } from 'lucide-react';
import type { AxisStrength } from '../../types/dashboard';

interface StrengthAnalysisProps {
  strengths: AxisStrength[];
  className?: string;
}

const StrengthAnalysis: React.FC<StrengthAnalysisProps> = ({
  strengths,
  className = ''
}) => {
  // 축 이름 매핑
  const axisNames = {
    GO: '경영관리',
    EC: '경제성과',
    PT: '제품·기술력',
    PF: '인적자원',
    TO: '조직역량'
  };

  // 트렌드 아이콘 컴포넌트
  const TrendIcon = ({ trend }: { trend?: 'up' | 'down' | 'stable' }) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  // 상태별 색상 매핑
  const statusColors = {
    strong: {
      bg: 'from-emerald-50 to-green-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      accent: 'text-emerald-600',
      badge: 'bg-emerald-100 text-emerald-700'
    },
    growing: {
      bg: 'from-blue-50 to-indigo-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      accent: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-700'
    },
    stable: {
      bg: 'from-gray-50 to-slate-50',
      border: 'border-gray-200',
      text: 'text-gray-800',
      accent: 'text-gray-600',
      badge: 'bg-gray-100 text-gray-700'
    },
    focus: {
      bg: 'from-orange-50 to-amber-50',
      border: 'border-orange-200',
      text: 'text-orange-800',
      accent: 'text-orange-600',
      badge: 'bg-orange-100 text-orange-700'
    }
  };

  if (strengths.length === 0) {
    return (
      <div className={`bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-6 ${className}`}>
        <div className="text-center">
          <Award className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">강점 분석 준비 중</h3>
          <p className="text-gray-500 text-sm">
            KPI 진단을 완료하시면 강점 분석 결과를 확인할 수 있어요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center space-x-2 mb-4">
        <Award className="w-5 h-5 text-emerald-600" />
        <h3 className="text-lg font-semibold text-gray-900">💪 강점 분석</h3>
      </div>

      <div className="space-y-4">
        {strengths.map((strength, index) => {
          const colors = statusColors[strength.status] || statusColors.stable;

          return (
            <motion.div
              key={strength.axis}
              className={`bg-gradient-to-r ${colors.bg} ${colors.border} border rounded-lg p-4`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`px-2 py-1 ${colors.badge} rounded text-xs font-medium`}>
                    {strength.axis}
                  </div>
                  <h4 className={`font-semibold ${colors.text}`}>
                    {axisNames[strength.axis as keyof typeof axisNames] || strength.axisName}
                  </h4>
                </div>

                <div className="flex items-center space-x-2">
                  {strength.trend && <TrendIcon trend={strength.trend} />}
                  <span className={`font-bold text-lg ${colors.accent}`}>
                    {strength.score}점
                  </span>
                </div>
              </div>

              {/* 백분위 및 개선 정보 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Users className={`w-4 h-4 ${colors.accent}`} />
                  <span className={`text-sm ${colors.text}`}>
                    동종업계 상위 <span className="font-semibold">{100 - strength.percentile}%</span>
                  </span>
                </div>

                {strength.improvement && strength.improvement > 0 && (
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">
                      +{strength.improvement}점 향상
                    </span>
                  </div>
                )}
              </div>

              {/* 진행도 바 */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>0점</span>
                  <span>100점</span>
                </div>
                <div className="w-full bg-white bg-opacity-60 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${strength.score}%` }}
                    transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className={colors.accent}>현재 {strength.score}점</span>
                  <span className="text-gray-500">상위 {100 - strength.percentile}%</span>
                </div>
              </div>

              {/* 메시지 */}
              <div className={`bg-white bg-opacity-60 rounded-lg p-3 ${colors.border} border`}>
                <p className={`text-sm ${colors.text} leading-relaxed`}>
                  {strength.message}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 전체 강점 요약 */}
      {strengths.length > 0 && (
        <motion.div
          className="mt-6 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-emerald-800">강점 활용 팁</span>
          </div>
          <p className="text-sm text-emerald-700 leading-relaxed">
            {strengths.length === 1
              ? `${strengths[0].axisName} 영역이 뛰어나시네요! 이 강점을 바탕으로 다른 영역도 함께 발전시켜 나가세요.`
              : `${strengths.length}개의 강점 영역을 보유하고 계시네요! 이러한 강점들을 서로 연결하여 시너지를 만들어보세요.`
            }
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default StrengthAnalysis;