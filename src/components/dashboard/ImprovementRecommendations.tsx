/**
 * Improvement Recommendations Component
 *
 * 사용자의 개선 영역을 분석하여 추천하는 컴포넌트
 * - 각 축(GO, EC, PT, PF, TO)별 개선 가능한 영역 표시
 * - 우선순위 기반 추천 순서
 * - 구체적인 개선 액션과 예상 효과
 * - 단계별 실행 가이드
 * - "매일 만나고 싶은 성장 동반자" 톤앤매너
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  Star,
  Users,
  BarChart3
} from 'lucide-react';
import type { AxisImprovement } from '../../types/dashboard';

interface ImprovementRecommendationsProps {
  improvements: AxisImprovement[];
  className?: string;
}

const ImprovementRecommendations: React.FC<ImprovementRecommendationsProps> = ({
  improvements,
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

  // 우선순위별 색상 매핑
  const priorityColors = {
    high: {
      bg: 'from-red-50 to-pink-50',
      border: 'border-red-200',
      text: 'text-red-700',
      accent: 'text-red-600',
      badge: 'bg-red-100 text-red-700',
      icon: 'text-red-500'
    },
    medium: {
      bg: 'from-orange-50 to-amber-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      accent: 'text-orange-600',
      badge: 'bg-orange-100 text-orange-700',
      icon: 'text-orange-500'
    },
    low: {
      bg: 'from-blue-50 to-indigo-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      accent: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-700',
      icon: 'text-blue-500'
    }
  };

  // 우선순위 라벨 매핑
  const priorityLabels = {
    high: '높음',
    medium: '보통',
    low: '낮음'
  };

  // 우선순위별 정렬
  const sortedImprovements = [...improvements].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  if (improvements.length === 0) {
    return (
      <div className={`bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6 ${className}`}>
        <div className="text-center">
          <Star className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-emerald-700 mb-2">훌륭해요!</h3>
          <p className="text-emerald-600 text-sm">
            현재 모든 영역이 균형있게 발전하고 있어요. 이 상태를 유지하며 지속적으로 성장해나가세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center space-x-2 mb-4">
        <Target className="w-5 h-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-900">🎯 개선 영역 추천</h3>
      </div>

      <div className="space-y-4">
        {sortedImprovements.map((improvement, index) => {
          const colors = priorityColors[improvement.priority];

          return (
            <motion.div
              key={improvement.axis}
              className={`bg-gradient-to-r ${colors.bg} ${colors.border} border rounded-lg p-5`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`px-2 py-1 ${colors.badge} rounded text-xs font-medium`}>
                    {improvement.axis}
                  </div>
                  <h4 className={`font-semibold ${colors.text}`}>
                    {axisNames[improvement.axis as keyof typeof axisNames] || improvement.axisName}
                  </h4>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 ${colors.badge} rounded-full font-medium`}>
                    우선순위: {priorityLabels[improvement.priority]}
                  </span>
                </div>
              </div>

              {/* 현재 상태 및 개선 잠재력 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white bg-opacity-60 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <BarChart3 className={`w-4 h-4 ${colors.icon}`} />
                    <span className={`text-sm font-medium ${colors.text}`}>현재 점수</span>
                  </div>
                  <span className={`text-lg font-bold ${colors.accent}`}>
                    {improvement.currentScore}점
                  </span>
                </div>

                <div className="bg-white bg-opacity-60 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <TrendingUp className={`w-4 h-4 ${colors.icon}`} />
                    <span className={`text-sm font-medium ${colors.text}`}>개선 가능</span>
                  </div>
                  <span className={`text-lg font-bold ${colors.accent}`}>
                    +{improvement.potentialGain}점
                  </span>
                </div>

                <div className="bg-white bg-opacity-60 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Clock className={`w-4 h-4 ${colors.icon}`} />
                    <span className={`text-sm font-medium ${colors.text}`}>예상 기간</span>
                  </div>
                  <span className={`text-sm font-semibold ${colors.accent}`}>
                    {improvement.timeframe}
                  </span>
                </div>
              </div>

              {/* 추천 액션 */}
              <div className={`bg-white bg-opacity-60 rounded-lg p-4 ${colors.border} border`}>
                <div className="flex items-center space-x-2 mb-3">
                  <Lightbulb className={`w-4 h-4 ${colors.accent}`} />
                  <span className={`text-sm font-semibold ${colors.text}`}>추천 액션</span>
                </div>

                <div className="space-y-2">
                  {improvement.suggestedActions.map((action, actionIndex) => (
                    <motion.div
                      key={actionIndex}
                      className="flex items-start space-x-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 + actionIndex * 0.05 }}
                    >
                      <CheckCircle2 className={`w-4 h-4 ${colors.accent} mt-0.5 flex-shrink-0`} />
                      <span className={`text-sm ${colors.text} leading-relaxed`}>
                        {action}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* 액션 시작 버튼 */}
                <motion.button
                  className={`mt-4 w-full flex items-center justify-center space-x-2 py-2 px-4 bg-white ${colors.border} border rounded-lg hover:shadow-md transition-all duration-200`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className={`text-sm font-medium ${colors.text}`}>
                    개선 시작하기
                  </span>
                  <ArrowRight className={`w-4 h-4 ${colors.accent}`} />
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 전체 개선 팁 */}
      {improvements.length > 0 && (
        <motion.div
          className="mt-6 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-4 h-4 text-gray-600" />
            <span className="font-semibold text-gray-800">개선 전략 팁</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {improvements.length === 1
              ? `${improvements[0].axisName} 영역에 집중하여 단계적으로 개선해보세요. 작은 변화도 큰 성과로 이어질 수 있어요.`
              : improvements.length === 2
              ? "두 개 영역을 동시에 개선하기보다는 우선순위가 높은 영역부터 차근차근 접근해보세요."
              : "여러 영역을 개선할 때는 한 번에 하나씩, 꾸준히 진행하는 것이 효과적이에요. 함께 차근차근 발전해나가요!"
            }
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default ImprovementRecommendations;