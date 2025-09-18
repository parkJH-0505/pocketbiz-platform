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
import { ChevronDown, ChevronUp, Lightbulb, Users, Search, TrendingUp, Calendar, Target, Star } from 'lucide-react';
import { useKPIDiagnosis } from '../../contexts/KPIDiagnosisContext';
import { useDashboard } from '../../contexts/DashboardContext';
import { useCalendarContext } from '../../contexts/CalendarContext';
import type { UnifiedCalendarEvent } from '../../types/unifiedCalendar.types';
import type { MatchingResult } from '../../types/smartMatching/types';
import { mockSmartMatchingResults } from '../../data/smartMatching/mockMatchingResults';
import { transformSmartMatchingEvent, transformBuildupEvent } from '../../utils/unifiedCalendar.utils';

const GrowthInsights: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { axisScores, overallScore, strongestAxis, weakestAxis, previousScores } = useKPIDiagnosis();
  const { growthStatus, weeklySchedule } = useDashboard();
  const { events: calendarEvents, stats: calendarStats } = useCalendarContext();

  // 통합 이벤트 데이터 생성 (스마트매칭 + 빌드업)
  const unifiedEvents = useMemo<UnifiedCalendarEvent[]>(() => {
    const allEvents: UnifiedCalendarEvent[] = [];

    // 스마트매칭 이벤트 변환
    mockSmartMatchingResults.forEach(result => {
      const transformResult = transformSmartMatchingEvent(result);
      if (transformResult.success && transformResult.event) {
        allEvents.push(transformResult.event);
      }
    });

    // 빌드업 캘린더 이벤트 변환
    calendarEvents.forEach(event => {
      const transformResult = transformBuildupEvent(event);
      if (transformResult.success && transformResult.event) {
        allEvents.push(transformResult.event);
      }
    });

    return allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [calendarEvents]);

  // 실제 활동 데이터 기반 인사이트 생성
  const insights = useMemo(() => {
    const currentScores = axisScores;
    const previous = previousScores;
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 최근 활동 분석
    const recentSmartMatchingEvents = unifiedEvents.filter(event =>
      event.sourceType === 'smart_matching' &&
      event.date >= oneWeekAgo
    );
    const recentBuildupEvents = unifiedEvents.filter(event =>
      event.sourceType === 'buildup_schedule' &&
      event.date >= oneWeekAgo
    );
    const completedBuildupEvents = calendarEvents.filter(event =>
      event.status === 'completed' &&
      new Date(event.completedAt || event.date) >= oneWeekAgo
    );

    // 개인 활동 패턴 분석
    const personalInsight = (() => {
      if (completedBuildupEvents.length > 0 && strongestAxis) {
        const avgCompletionRate = (completedBuildupEvents.length / calendarEvents.length) * 100;
        const strongScore = currentScores[strongestAxis as keyof typeof currentScores];
        const improvement = previous[strongestAxis as keyof typeof previous]
          ? strongScore - previous[strongestAxis as keyof typeof previous]
          : 0;

        return {
          title: '활동 기반 성장 패턴',
          insight: `지난 주 ${completedBuildupEvents.length}개 미팅 완료로 ${strongestAxis}축이 ${improvement > 0 ? `+${improvement.toFixed(1)}점` : '안정적'} 성장했어요`,
          actionSuggestion: `미팅 완료율 ${avgCompletionRate.toFixed(0)}%를 유지하며 다른 영역도 균형있게 발전시켜보세요`,
          metrics: {
            completedMeetings: completedBuildupEvents.length,
            completionRate: avgCompletionRate,
            strongestAxis,
            improvement
          }
        };
      }

      if (recentSmartMatchingEvents.length > 0) {
        const highScoreMatches = recentSmartMatchingEvents.filter(event =>
          event.sourceType === 'smart_matching' && event.matchingScore >= 80
        );

        return {
          title: '기회 매칭 패턴',
          insight: `이번 주 ${recentSmartMatchingEvents.length}개 기회 중 ${highScoreMatches.length}개가 고매칭(80점+)이에요`,
          actionSuggestion: 'KPI 데이터 완성도가 높을수록 더 정확한 매칭이 가능해요',
          metrics: {
            totalOpportunities: recentSmartMatchingEvents.length,
            highScoreMatches: highScoreMatches.length,
            matchingAccuracy: recentSmartMatchingEvents.length > 0 ? (highScoreMatches.length / recentSmartMatchingEvents.length) * 100 : 0
          }
        };
      }

      return {
        title: '성장 패턴 분석',
        insight: '활동 데이터를 더 쌓으면 개인화된 성장 패턴을 분석해드릴게요',
        actionSuggestion: 'KPI 진단과 미팅 참여를 통해 데이터를 축적해보세요'
      };
    })();

    // 활동 기반 벤치마크 비교
    const benchmarkInsight = (() => {
      const percentile = Math.round(((overallScore || 0) / 100) * 100);
      const weeklyEngagement = completedBuildupEvents.length + recentSmartMatchingEvents.length;
      const avgWeeklyEngagement = 4; // 평균 기준

      if (percentile >= 75 && weeklyEngagement >= avgWeeklyEngagement) {
        return {
          title: '성장 활동 벤치마크',
          insight: `KPI ${overallScore?.toFixed(1)}점 + 주간활동 ${weeklyEngagement}건으로 상위 15% 수준입니다`,
          encouragement: '성과와 활동 모두 우수해요! 이 속도로 성장하고 계세요',
          metrics: {
            kpiScore: overallScore,
            weeklyActivity: weeklyEngagement,
            benchmark: 'top_15_percent'
          }
        };
      } else if (percentile >= 50) {
        return {
          title: '성장 활동 벤치마크',
          insight: `KPI는 평균 이상, ${weeklyEngagement >= avgWeeklyEngagement ? '활동도 활발' : '활동 늘리면 더 좋을 것 같아요'}`,
          encouragement: weeklyEngagement >= avgWeeklyEngagement ? '꾸준한 활동이 성과로 이어지고 있어요' : '미팅이나 기회 탐색을 조금 더 늘려보세요',
          metrics: {
            kpiScore: overallScore,
            weeklyActivity: weeklyEngagement,
            benchmark: 'above_average'
          }
        };
      } else {
        const improvementArea = weeklyEngagement < avgWeeklyEngagement ? '활동 빈도' : 'KPI 완성도';
        return {
          title: '성장 활동 벤치마크',
          insight: `${improvementArea} 개선에 집중하면 빠른 성장이 가능해요`,
          encouragement: '단계별로 차근차근 개선해나가면 성과가 따라올 거예요',
          metrics: {
            kpiScore: overallScore,
            weeklyActivity: weeklyEngagement,
            recommendedFocus: improvementArea,
            benchmark: 'growth_potential'
          }
        };
      }
    })();

    // 실제 데이터 기반 숨은 기회 발견
    const opportunityInsight = (() => {
      const upcomingOpportunities = unifiedEvents.filter(event =>
        event.sourceType === 'smart_matching' &&
        event.date >= today &&
        event.date <= new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000) // 2주 내
      );

      const highPotentialOpps = upcomingOpportunities.filter(event =>
        event.sourceType === 'smart_matching' && event.matchingScore >= 75
      );

      const urgentOpps = upcomingOpportunities.filter(event =>
        event.sourceType === 'smart_matching' &&
        event.deadline.daysUntilDeadline <= 7 && event.deadline.daysUntilDeadline > 0
      );

      if (weakestAxis && highPotentialOpps.length > 0) {
        const axisNames = {
          GO: '운영·성장',
          EC: '경제성',
          PT: '제품·기술',
          PF: '검증·증명',
          TO: '팀·조직'
        };

        const categoryOpps = highPotentialOpps.filter(event => {
          if (event.sourceType === 'smart_matching') {
            const categoryAxisMap: Record<string, string> = {
              'government_support': 'GO',
              'vc_opportunity': 'EC',
              'tips_program': 'PT',
              'accelerator': 'PF',
              'open_innovation': 'TO'
            };
            return categoryAxisMap[event.category] === weakestAxis;
          }
          return false;
        });

        return {
          title: '맞춤 기회 발견',
          insight: `${axisNames[weakestAxis as keyof typeof axisNames]} 보완을 위한 고매칭 기회 ${categoryOpps.length}개가 있어요`,
          explorationSuggestion: `2주 내 마감 ${urgentOpps.length}개 포함, 지금 확인해보세요`,
          metrics: {
            totalOpportunities: upcomingOpportunities.length,
            highPotential: highPotentialOpps.length,
            urgentDeadlines: urgentOpps.length,
            weakestAxisOpps: categoryOpps.length,
            focusArea: axisNames[weakestAxis as keyof typeof axisNames]
          }
        };
      }

      if (highPotentialOpps.length > 0) {
        return {
          title: '고매칭 기회 알림',
          insight: `2주 내 ${upcomingOpportunities.length}개 기회 중 ${highPotentialOpps.length}개가 75점+ 고매칭이에요`,
          explorationSuggestion: `${urgentOpps.length > 0 ? `급한 마감 ${urgentOpps.length}개 우선 처리하세요` : '차근차근 검토해보시길 추천해요'}`,
          metrics: {
            totalOpportunities: upcomingOpportunities.length,
            highPotential: highPotentialOpps.length,
            urgentDeadlines: urgentOpps.length
          }
        };
      }

      return {
        title: '기회 탐색 제안',
        insight: '새로운 기회들이 계속 업데이트되고 있어요',
        explorationSuggestion: 'KPI 데이터를 더 완성하면 더 정확한 매칭이 가능해요',
        metrics: {
          totalOpportunities: upcomingOpportunities.length
        }
      };
    })();

    return {
      personal: personalInsight,
      benchmark: benchmarkInsight,
      opportunity: opportunityInsight,
      summary: {
        totalEvents: unifiedEvents.length,
        recentActivity: recentSmartMatchingEvents.length + recentBuildupEvents.length,
        completedMeetings: completedBuildupEvents.length,
        upcomingOpportunities: unifiedEvents.filter(e =>
          e.sourceType === 'smart_matching' && e.date >= today
        ).length
      }
    };
  }, [axisScores, overallScore, strongestAxis, weakestAxis, previousScores, unifiedEvents, calendarEvents, calendarStats]);

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
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-2 text-blue-600">
            <TrendingUp className="w-4 h-4" />
            <span>활동 {insights.summary.recentActivity}건</span>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <Calendar className="w-4 h-4" />
            <span>완료 미팅 {insights.summary.completedMeetings}건</span>
          </div>
          <div className="flex items-center gap-2 text-purple-600">
            <Target className="w-4 h-4" />
            <span>신규 기회 {insights.summary.upcomingOpportunities}개</span>
          </div>
          {insights.benchmark.metrics && (
            <div className="flex items-center gap-2 text-orange-600">
              <Star className="w-4 h-4" />
              <span>
                {insights.benchmark.metrics.benchmark === 'top_15_percent' ? '상위 15%' :
                 insights.benchmark.metrics.benchmark === 'above_average' ? '평균 이상' : '성장 중'}
              </span>
            </div>
          )}
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
                  {insights.personal.metrics && (
                    <div className="mt-2 text-xs text-blue-600 space-y-1">
                      {insights.personal.metrics.completedMeetings && (
                        <div>📅 완료 미팅: {insights.personal.metrics.completedMeetings}건</div>
                      )}
                      {insights.personal.metrics.matchingAccuracy && (
                        <div>🎯 매칭 정확도: {insights.personal.metrics.matchingAccuracy.toFixed(0)}%</div>
                      )}
                    </div>
                  )}
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
                  {insights.benchmark.metrics && (
                    <div className="mt-2 text-xs text-green-600 space-y-1">
                      <div>📊 KPI: {insights.benchmark.metrics.kpiScore?.toFixed(1)}점</div>
                      <div>⚡ 주간활동: {insights.benchmark.metrics.weeklyActivity}건</div>
                      {insights.benchmark.metrics.recommendedFocus && (
                        <div>🎯 집중영역: {insights.benchmark.metrics.recommendedFocus}</div>
                      )}
                    </div>
                  )}
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
                  {insights.opportunity.metrics && (
                    <div className="mt-2 text-xs text-purple-600 space-y-1">
                      <div>📈 전체 기회: {insights.opportunity.metrics.totalOpportunities}개</div>
                      {insights.opportunity.metrics.highPotential && (
                        <div>⭐ 고매칭: {insights.opportunity.metrics.highPotential}개</div>
                      )}
                      {insights.opportunity.metrics.urgentDeadlines && insights.opportunity.metrics.urgentDeadlines > 0 && (
                        <div className="text-red-600">⏰ 긴급: {insights.opportunity.metrics.urgentDeadlines}개</div>
                      )}
                      {insights.opportunity.metrics.focusArea && (
                        <div>🎯 추천영역: {insights.opportunity.metrics.focusArea}</div>
                      )}
                    </div>
                  )}
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