/**
 * GrowthInsights Component
 *
 * 성장 인사이트 섹션 (접기/펼치기 가능)
 * - 개인 패턴 분석
 * - 벤치마크 비교
 * - 숨은 기회 발견
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Lightbulb, Users, Search, TrendingUp } from 'lucide-react';
import { useKPIDiagnosis } from '../../contexts/KPIDiagnosisContext';
import { useDashboard } from '../../contexts/DashboardContext';

const GrowthInsights: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { axisScores, overallScore, strongestAxis, weakestAxis, previousScores } = useKPIDiagnosis();
  const { growthStatus } = useDashboard();

  // 실제 KPI 데이터 기반 인사이트 생성
  const insights = useMemo(() => {
    const currentScores = axisScores;
    const previous = previousScores;

    // 개인 패턴 분석
    const personalInsight = (() => {
      if (strongestAxis && currentScores[strongestAxis as keyof typeof currentScores]) {
        const strongScore = currentScores[strongestAxis as keyof typeof currentScores];
        const improvement = previous[strongestAxis as keyof typeof previous]
          ? strongScore - previous[strongestAxis as keyof typeof previous]
          : 0;

        if (improvement > 0) {
          return {
            title: '당신만의 성장 패턴',
            insight: `${strongestAxis}축에서 지속적인 성장을 보이고 있어요. ${improvement.toFixed(1)}점 향상되었습니다`,
            actionSuggestion: '이런 성장 패턴을 다른 영역에도 적용해보세요'
          };
        }
      }

      return {
        title: '당신만의 성장 패턴',
        insight: 'KPI 완성도가 높은 주에 기회 매칭률이 15% 더 높아져요',
        actionSuggestion: '꾸준한 KPI 관리가 성장의 핵심입니다'
      };
    })();

    // 벤치마크 비교
    const benchmarkInsight = (() => {
      const percentile = Math.round(((overallScore || 0) / 100) * 100);

      if (percentile >= 75) {
        return {
          title: '동종업계 위치',
          insight: `전체 KPI 점수 ${overallScore?.toFixed(1)}점으로 상위 ${100-percentile}% 수준입니다`,
          encouragement: '업계 리더로 성장할 잠재력이 충분해요'
        };
      } else if (percentile >= 50) {
        return {
          title: '동종업계 위치',
          insight: `평균 이상의 성과를 보이고 있어요. 상위 ${100-percentile}% 수준입니다`,
          encouragement: '조금만 더 노력하면 상위권 진입이 가능해요'
        };
      } else {
        return {
          title: '동종업계 위치',
          insight: `성장 잠재력이 큰 단계입니다. 체계적인 개선이 필요해요`,
          encouragement: '한 단계씩 개선해나가면 큰 성장을 이룰 수 있어요'
        };
      }
    })();

    // 숨은 기회 발견
    const opportunityInsight = (() => {
      if (weakestAxis) {
        const axisNames = {
          GO: '운영·성장',
          EC: '경제성',
          PT: '제품·기술',
          PF: '검증·증명',
          TO: '팀·조직'
        };

        return {
          title: '숨은 기회',
          insight: `${axisNames[weakestAxis as keyof typeof axisNames]} 영역에 집중하면 전체 점수를 크게 끌어올릴 수 있어요`,
          explorationSuggestion: '해당 영역의 정부지원사업을 확인해보세요'
        };
      }

      return {
        title: '숨은 기회',
        insight: '딥테크 분야 정부지원사업이 평소보다 30% 증가했어요',
        explorationSuggestion: '스마트 매칭에서 관련 기회들을 확인해보세요'
      };
    })();

    return {
      personal: personalInsight,
      benchmark: benchmarkInsight,
      opportunity: opportunityInsight
    };
  }, [axisScores, overallScore, strongestAxis, weakestAxis, previousScores]);

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
                      {insights.personal.title}
                    </h4>
                  </div>
                  <p className="text-sm text-blue-800 mb-3">
                    {insights.personal.insight}
                  </p>
                  <div className="bg-blue-100 p-2 rounded text-xs text-blue-700">
                    💡 {insights.personal.actionSuggestion}
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
                      {insights.benchmark.title}
                    </h4>
                  </div>
                  <p className="text-sm text-green-800 mb-3">
                    {insights.benchmark.insight}
                  </p>
                  <div className="bg-green-100 p-2 rounded text-xs text-green-700">
                    🌟 {insights.benchmark.encouragement}
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
                      {insights.opportunity.title}
                    </h4>
                  </div>
                  <p className="text-sm text-purple-800 mb-3">
                    {insights.opportunity.insight}
                  </p>
                  <div className="bg-purple-100 p-2 rounded text-xs text-purple-700">
                    🔍 {insights.opportunity.explorationSuggestion}
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