/**
 * GrowthStatus Component
 *
 * 현재 성장 상태와 레벨을 표시
 * - 성장 레벨 시각화
 * - 강점/약점 분석
 * - 축하 메시지
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Target, Star } from 'lucide-react';

// 임시 Mock 데이터
const mockGrowthLevel = {
  current: {
    name: "성장기",
    icon: "🌿",
    description: "기반을 단단히 다지고 있어요",
    color: "emerald",
    range: [30, 50] as [number, number]
  },
  score: 42.5,
  progress: {
    current: 12.5,
    total: 20,
    percentage: 62
  },
  next: {
    name: "발전기",
    requiredScore: 50,
    pointsNeeded: 7.5,
    estimatedTimeToReach: "1개월 내"
  }
};

const mockStrengths = [
  {
    axis: 'PT' as const,
    axisName: '제품·기술력',
    score: 68,
    percentile: 75,
    status: 'strong' as const,
    message: '훌륭한 강점이에요! 이 부분을 더욱 발전시켜보세요.',
    trend: 'up' as const,
    improvement: 8
  },
  {
    axis: 'TO' as const,
    axisName: '팀·조직 역량',
    score: 55,
    percentile: 60,
    status: 'growing' as const,
    message: '꾸준히 성장하고 있어요. 이 속도를 유지하세요.',
    trend: 'up' as const,
    improvement: 3
  },
  {
    axis: 'GO' as const,
    axisName: '성장·운영',
    score: 28,
    percentile: 35,
    status: 'focus' as const,
    message: '집중 개선이 필요한 영역이에요. 하나씩 차근차근 해보세요.',
    trend: 'stable' as const,
    improvement: 0
  }
];

const mockCelebration = {
  type: 'improvement' as const,
  icon: '📈',
  title: '성장 중!',
  message: '제품·기술력 영역이 +8점 향상됐어요!',
  subMessage: '이 속도면 목표 달성이 금세일 것 같아요.'
};

const GrowthStatus: React.FC = () => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'strong': return <Star className="w-4 h-4" />;
      case 'growing': return <TrendingUp className="w-4 h-4" />;
      case 'focus': return <Target className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'strong':
        return {
          bg: 'bg-green-50',
          text: 'text-green-700',
          border: 'border-green-200'
        };
      case 'growing':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200'
        };
      case 'focus':
        return {
          bg: 'bg-orange-50',
          text: 'text-orange-700',
          border: 'border-orange-200'
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200'
        };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'strong': return '강점';
      case 'growing': return '성장중';
      case 'focus': return '집중필요';
      default: return '보통';
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm" data-tour="growth-status">
      {/* 레벨 섹션 */}
      <motion.div
        className="text-center mb-6 p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-200"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* 레벨 아이콘 */}
        <motion.div
          className="text-4xl mb-2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          {mockGrowthLevel.current.icon}
        </motion.div>

        {/* 레벨 이름 */}
        <h3 className="text-xl font-bold text-emerald-800 mb-1">
          {mockGrowthLevel.current.name}
        </h3>

        {/* 레벨 설명 */}
        <p className="text-sm text-emerald-600 mb-3">
          {mockGrowthLevel.current.description}
        </p>

        {/* 현재 점수 */}
        <div className="text-2xl font-bold text-emerald-900 mb-3">
          {mockGrowthLevel.score}점
        </div>

        {/* 진행률 바 */}
        <div className="w-full bg-emerald-100 rounded-full h-3 mb-2">
          <motion.div
            className="bg-emerald-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${mockGrowthLevel.progress.percentage}%` }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>

        {/* 다음 레벨 정보 */}
        <p className="text-xs text-emerald-600">
          {mockGrowthLevel.next.name}까지 {mockGrowthLevel.next.pointsNeeded}점 • {mockGrowthLevel.next.estimatedTimeToReach}
        </p>
      </motion.div>

      {/* 현재 상태 섹션 */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          현재 상태
        </h4>

        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: { staggerChildren: 0.1 }
            }
          }}
        >
          {mockStrengths.map((strength, index) => {
            const colors = getStatusColors(strength.status);

            return (
              <motion.div
                key={strength.axis}
                className={`p-3 rounded-lg border ${colors.border} ${colors.bg}`}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 }
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${colors.text}`}>
                      {getStatusIcon(strength.status)}
                    </div>
                    <span className="font-semibold text-gray-900">
                      {strength.axisName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      {strength.score}점
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors.bg} ${colors.text}`}>
                      {getStatusText(strength.status)}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-2">
                  {strength.message}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>상위 {100 - strength.percentile}% 수준</span>
                  {strength.improvement > 0 && (
                    <span className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="w-3 h-3" />
                      +{strength.improvement}점 상승
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* 축하 메시지 */}
      <motion.div
        className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl">{mockCelebration.icon}</div>
          <div className="flex-1">
            <h5 className="font-semibold text-blue-900 mb-1">
              {mockCelebration.title}
            </h5>
            <p className="text-sm text-blue-800 mb-1">
              {mockCelebration.message}
            </p>
            <p className="text-xs text-blue-600">
              {mockCelebration.subMessage}
            </p>
          </div>
        </div>
      </motion.div>

      {/* 다음 액션 제안 */}
      <motion.div
        className="mt-4 p-3 bg-gray-50 rounded-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Target className="w-4 h-4" />
          추천 다음 단계
        </h5>
        <p className="text-sm text-gray-600">
          성장·운영 영역 개선에 집중하면 빠른 성장을 볼 수 있을 거예요
        </p>
      </motion.div>
    </div>
  );
};

export default GrowthStatus;