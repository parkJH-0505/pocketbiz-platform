/**
 * Growth Status Component
 *
 * 사용자의 전체적인 성장 현황을 표시하는 메인 컴포넌트
 * - 성장 레벨 시스템 (Step 1 ✅ 구현완료)
 * - 강점 분석 섹션 (Step 2 ✅ 구현완료)
 * - 개선 영역 추천 (Step 3 ✅ 구현완료)
 * - 축하/격려 메시지 (Step 4 ✅ 구현완료)
 * - 성능 최적화 및 통합 (Step 5 ✅ 구현완료)
 * - "매일 만나고 싶은 성장 동반자" 철학 구현
 */

import React, { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../../contexts/DashboardContext';
import GrowthLevelDisplay from './GrowthLevelDisplay';
import StrengthAnalysis from './StrengthAnalysis';
import ImprovementRecommendations from './ImprovementRecommendations';
import CelebrationMessage from './CelebrationMessage';
import { RefreshCw, TrendingUp } from 'lucide-react';

const GrowthStatus: React.FC = () => {
  const { growthStatus, isLoading, error, refreshData } = useDashboard();

  // 새로고침 핸들러 최적화
  const handleRefresh = useCallback(async () => {
    try {
      await refreshData();
    } catch (err) {
      console.error('데이터 새로고침 실패:', err);
    }
  }, [refreshData]);

  // 콘텐츠 섹션들 메모화
  const contentSections = useMemo(() => {
    if (!growthStatus) return null;

    return {
      levelDisplay: (
        <motion.section
          key="level-display"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GrowthLevelDisplay level={growthStatus.level} />
        </motion.section>
      ),
      strengthAnalysis: (
        <motion.section
          key="strength-analysis"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StrengthAnalysis strengths={growthStatus.strengths} />
        </motion.section>
      ),
      improvementRecommendations: (
        <motion.section
          key="improvement-recommendations"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ImprovementRecommendations improvements={growthStatus.improvements} />
        </motion.section>
      ),
      celebration: growthStatus.celebration ? (
        <motion.section
          key="celebration"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <CelebrationMessage celebration={growthStatus.celebration} />
        </motion.section>
      ) : null
    };
  }, [growthStatus]);

  // 로딩 상태 (개선된 스켈레톤)
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* 헤더 스켈레톤 */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-40 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
        </div>

        {/* 콘텐츠 스켈레톤 */}
        <div className="p-6 space-y-6">
          <div className="animate-pulse space-y-6">
            {/* 성장 레벨 스켈레톤 */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>

            {/* 강점 분석 스켈레톤 */}
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-32"></div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>

            {/* 개선 영역 스켈레톤 */}
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-40"></div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 스켈레톤 */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-56 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-red-200">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <TrendingUp className="w-8 h-8 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            성장 현황을 불러올 수 없어요
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            잠시 후 다시 시도해 주세요.
          </p>
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>다시 시도</span>
          </button>
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!growthStatus) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <TrendingUp className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            성장 데이터를 준비 중이에요
          </h3>
          <p className="text-gray-600 text-sm">
            KPI 진단을 완료하시면 성장 현황을 확인할 수 있어요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">성장 현황판</h2>
            <p className="text-sm text-gray-600">현재 성장 단계와 발전 방향을 확인해보세요</p>
          </div>

          <motion.button
            onClick={handleRefresh}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="데이터 새로고침"
          >
            <RefreshCw className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="p-6 space-y-6">
        <AnimatePresence mode="wait">
          {contentSections && (
            <motion.div
              key="content"
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: 성장 레벨 시스템 */}
              {contentSections.levelDisplay}

              {/* Step 2: 강점 분석 섹션 */}
              {contentSections.strengthAnalysis}

              {/* Step 3: 개선 영역 추천 */}
              {contentSections.improvementRecommendations}

              {/* Step 4: 축하/격려 메시지 */}
              {contentSections.celebration}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 푸터 */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          매일 조금씩 성장하는 여러분을 응원합니다 ✨
        </p>
      </div>
    </motion.div>
  );
};

export default GrowthStatus;