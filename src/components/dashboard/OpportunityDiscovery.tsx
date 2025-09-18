/**
 * Opportunity Discovery Component
 *
 * 숨은 기회 발견 컴포넌트
 * - 매칭된 기회 카드 형태로 표시
 * - 긴급도와 매칭률 시각화
 * - 최소 텍스트, 직관적 아이콘 사용
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Clock,
  TrendingUp,
  Filter,
  ChevronRight,
  AlertCircle,
  Target,
  Zap,
  Award
} from 'lucide-react';
import type { OpportunityInsight } from '../../types/dashboard';
import { opportunityIcons, opportunityColors } from '../../services/dashboard/opportunityService';

interface OpportunityDiscoveryProps {
  insights: OpportunityInsight | null;
  className?: string;
}

const OpportunityDiscovery: React.FC<OpportunityDiscoveryProps> = ({
  insights,
  className = ''
}) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!insights) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">기회 분석 중</h3>
          <p className="text-sm text-gray-500 mt-1">새로운 기회를 찾고 있어요</p>
        </div>
      </div>
    );
  }

  // 타입별 필터링
  const filteredOpportunities = selectedType
    ? insights.opportunities.filter(opp => opp.type === selectedType)
    : insights.opportunities;

  // 긴급도 라벨
  const urgencyLabels = {
    high: { text: '긴급', color: 'text-red-600 bg-red-50' },
    medium: { text: '보통', color: 'text-orange-600 bg-orange-50' },
    low: { text: '여유', color: 'text-green-600 bg-green-50' }
  };

  // 기회 타입 통계
  const typeStats = insights.opportunities.reduce((acc, opp) => {
    acc[opp.type] = (acc[opp.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={`${className}`}>
      <div className="p-6">
        {/* 주요 추천 */}
        {insights.primaryRecommendation && (
          <motion.div
            className="mb-6 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-5 h-5" />
                  <h3 className="font-semibold text-lg">
                    {insights.primaryRecommendation.title}
                  </h3>
                </div>
                <p className="text-indigo-100 text-sm mb-3">
                  {insights.primaryRecommendation.reason}
                </p>
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1 text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                    <Clock className="w-3 h-3" />
                    <span>{insights.primaryRecommendation.timeframe}</span>
                  </span>
                  <motion.button
                    className="flex items-center space-x-1 bg-white text-indigo-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>{insights.primaryRecommendation.action}</span>
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 타입 필터 */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedType(null)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                !selectedType
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              전체 ({insights.opportunities.length})
            </button>
            {Object.entries(typeStats).map(([type, count]) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center space-x-1 ${
                  selectedType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{opportunityIcons[type as keyof typeof opportunityIcons]}</span>
                <span>{type} ({count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* 기회 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <AnimatePresence mode="popLayout">
            {filteredOpportunities.slice(0, 4).map((opportunity, index) => {
              const colors = opportunityColors[opportunity.type];
              const isExpanded = expandedId === opportunity.id;

              return (
                <motion.div
                  key={opportunity.id}
                  layout
                  className={`bg-gradient-to-br ${colors.bg} ${colors.border} border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setExpandedId(isExpanded ? null : opportunity.id)}
                >
                  {/* 카드 헤더 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">
                        {opportunityIcons[opportunity.type]}
                      </span>
                      <div>
                        <h4 className={`font-semibold ${colors.text}`}>
                          {opportunity.title}
                        </h4>
                        <p className={`text-xs ${colors.text} opacity-80`}>
                          {opportunity.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 매칭률과 긴급도 */}
                  <div className="flex items-center justify-between mb-3">
                    {/* 매칭률 */}
                    <div className="flex items-center space-x-2">
                      <div className="relative w-12 h-12">
                        <svg className="w-12 h-12 transform -rotate-90">
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="text-gray-200"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={`${opportunity.matchScore * 1.26} 999`}
                            className={colors.text}
                          />
                        </svg>
                        <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${colors.text}`}>
                          {opportunity.matchScore}%
                        </span>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.text} font-medium`}>매칭률</p>
                        <p className={`text-xs ${colors.text} opacity-70`}>
                          {opportunity.matchScore >= 80 ? '높음' : '보통'}
                        </p>
                      </div>
                    </div>

                    {/* 긴급도 */}
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${urgencyLabels[opportunity.urgency].color}`}>
                        {urgencyLabels[opportunity.urgency].text}
                      </span>
                      <span className={`text-xs font-medium ${colors.text}`}>
                        {opportunity.timeframe}
                      </span>
                    </div>
                  </div>

                  {/* 예상 혜택 */}
                  <div className={`p-2 bg-white bg-opacity-60 rounded ${colors.border} border`}>
                    <div className="flex items-center space-x-2">
                      <Award className={`w-4 h-4 ${colors.text}`} />
                      <span className={`text-sm font-medium ${colors.text}`}>
                        {opportunity.expectedBenefit}
                      </span>
                    </div>
                  </div>

                  {/* 확장된 내용 */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-3 pt-3 border-t border-white border-opacity-40"
                      >
                        <p className={`text-xs ${colors.text} font-medium mb-2`}>
                          요구사항:
                        </p>
                        <ul className="space-y-1">
                          {opportunity.requirements.map((req, i) => (
                            <li key={i} className={`text-xs ${colors.text} opacity-80 flex items-start`}>
                              <span className="mr-1">•</span>
                              {req}
                            </li>
                          ))}
                        </ul>
                        <motion.button
                          className={`mt-3 w-full py-2 ${colors.badge} rounded font-medium text-sm hover:opacity-90 transition-opacity`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // 상세 보기 액션
                          }}
                        >
                          자세히 보기
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* 시장 트렌드 */}
        {insights.trends.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              시장 트렌드
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {insights.trends.map((trend, index) => (
                <motion.div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {trend.category}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      trend.trend === 'rising'
                        ? 'bg-green-100 text-green-600'
                        : trend.trend === 'declining'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {trend.trend === 'rising' ? '상승' : trend.trend === 'declining' ? '하락' : '안정'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {trend.description}
                  </p>
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-xs text-gray-500">관련성</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${trend.relevance * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-700 font-medium">
                      {Math.round(trend.relevance * 100)}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpportunityDiscovery;