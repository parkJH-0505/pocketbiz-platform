/**
 * GrowthInsights Component
 *
 * 성장 인사이트 섹션 (접기/펼치기 가능)
 * - 개인 패턴 분석
 * - 벤치마크 비교
 * - 숨은 기회 발견
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Lightbulb, Users, Search, TrendingUp } from 'lucide-react';

// 임시 Mock 데이터
const mockInsights = {
  personal: {
    title: '당신만의 성장 패턴',
    insight: 'KPI 완성도가 높은 주에 기회 매칭률이 15% 더 높아져요',
    actionSuggestion: '이런 패턴을 계속 유지해보세요'
  },
  benchmark: {
    title: '동종업계 위치',
    insight: '제품·기술력 영역에서 특히 우수한 성과를 보이고 있어요. 상위 25% 수준입니다',
    encouragement: '업계 리더로 성장할 잠재력이 충분해요'
  },
  opportunity: {
    title: '숨은 기회',
    insight: '딥테크 분야 정부지원사업이 평소보다 30% 증가했어요',
    explorationSuggestion: '스마트 매칭에서 관련 기회들을 확인해보세요'
  }
};

const GrowthInsights: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200" data-tour="growth-insights">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              성장 인사이트
            </h3>
            <p className="text-sm text-gray-500">
              개인 맞춤 분석과 숨은 기회를 발견해보세요
            </p>
          </div>
        </div>

        <motion.button
          onClick={toggleExpanded}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-sm font-medium">
            {isExpanded ? '접기' : '펼치기'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </motion.button>
      </div>

      {/* 인사이트 미리보기 (항상 표시) */}
      <div className="p-6">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-blue-600">
            <TrendingUp className="w-4 h-4" />
            <span>패턴 분석</span>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <Users className="w-4 h-4" />
            <span>상위 25% 수준</span>
          </div>
          <div className="flex items-center gap-2 text-purple-600">
            <Search className="w-4 h-4" />
            <span>새로운 기회 3개</span>
          </div>
        </div>
      </div>

      {/* 상세 인사이트 (펼치기 시 표시) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="border-t border-gray-100"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* 개인 패턴 */}
                <motion.div
                  className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">
                      {mockInsights.personal.title}
                    </h4>
                  </div>
                  <p className="text-sm text-blue-800 mb-3">
                    {mockInsights.personal.insight}
                  </p>
                  <div className="bg-blue-100 p-2 rounded text-xs text-blue-700">
                    💡 {mockInsights.personal.actionSuggestion}
                  </div>
                </motion.div>

                {/* 벤치마크 비교 */}
                <motion.div
                  className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-900">
                      {mockInsights.benchmark.title}
                    </h4>
                  </div>
                  <p className="text-sm text-green-800 mb-3">
                    {mockInsights.benchmark.insight}
                  </p>
                  <div className="bg-green-100 p-2 rounded text-xs text-green-700">
                    🌟 {mockInsights.benchmark.encouragement}
                  </div>
                </motion.div>

                {/* 숨은 기회 */}
                <motion.div
                  className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-purple-900">
                      {mockInsights.opportunity.title}
                    </h4>
                  </div>
                  <p className="text-sm text-purple-800 mb-3">
                    {mockInsights.opportunity.insight}
                  </p>
                  <div className="bg-purple-100 p-2 rounded text-xs text-purple-700">
                    🔍 {mockInsights.opportunity.explorationSuggestion}
                  </div>
                </motion.div>

              </div>

              {/* 추가 액션 */}
              <motion.div
                className="mt-6 pt-6 border-t border-gray-100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-1">
                      더 자세한 분석이 필요하신가요?
                    </h5>
                    <p className="text-sm text-gray-600">
                      개인화된 성장 전략을 위한 1:1 분석을 받아보세요
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    분석 요청하기
                  </button>
                </div>
              </motion.div>

              {/* 업데이트 정보 */}
              <motion.div
                className="mt-4 text-center text-xs text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <p>
                  마지막 업데이트: 오늘 오전 9:30 • 다음 업데이트: 내일 오전 9:00
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GrowthInsights;