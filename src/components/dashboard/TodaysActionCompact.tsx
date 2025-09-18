/**
 * Today's Action Compact Component
 *
 * 미니멀한 오늘의 액션 알림바
 * - 한 줄로 간결하게
 * - 제목과 버튼만 표시
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowRight } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';

const TodaysActionCompact: React.FC = () => {
  const { todaysAction, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="animate-pulse flex items-center justify-between">
          <div className="h-5 bg-gray-200 rounded w-64"></div>
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (!todaysAction) {
    return null;
  }

  return (
    <motion.div
      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-lg p-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Zap className="w-5 h-5 text-yellow-300" />
          <div className="flex items-center space-x-4">
            <h3 className="font-semibold">오늘의 액션</h3>
            <span className="text-blue-100">|</span>
            <p className="text-white font-medium">
              {todaysAction.title}
            </p>
            <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
              {todaysAction.estimatedTime}
            </span>
          </div>
        </div>

        <motion.button
          className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (todaysAction.actionUrl) {
              window.location.href = todaysAction.actionUrl;
            }
          }}
        >
          <span>시작하기</span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default TodaysActionCompact;