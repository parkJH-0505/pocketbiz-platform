/**
 * Growth Insights Component
 *
 * 성장 인사이트 컴포넌트
 * - 숨은 기회 발견 (Day 15-16)
 * - 접기/펼치기 기능으로 공간 효율성
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';
import OpportunityDiscovery from './OpportunityDiscovery';

const GrowthInsights: React.FC = () => {
  const { growthInsights, isLoading, refreshData } = useDashboard();
  const [isExpanded, setIsExpanded] = useState(true);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
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
      {/* 헤더 (접기/펼치기 가능) */}
      <div
        className="px-6 py-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                숨은 기회 발견
                {growthInsights?.opportunity?.opportunities && (
                  <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                    {growthInsights.opportunity.opportunities.length}개 발견
                  </span>
                )}
              </h2>
              <p className="text-sm text-gray-600">놓치고 있는 성장 기회를 찾아드려요</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <motion.button
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                refreshData();
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="새로고침"
            >
              <RefreshCw className="w-5 h-5" />
            </motion.button>
            <motion.div
              animate={{ rotate: isExpanded ? 0 : -180 }}
              transition={{ duration: 0.3 }}
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <OpportunityDiscovery insights={growthInsights?.opportunity || null} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GrowthInsights;