/**
 * Growth Level Compact Component
 *
 * 성장 레벨 컴팩트 표시
 * - 현재 레벨과 점수만 간단히 표시
 * - 사이드바에 적합한 크기
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Star } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';

const GrowthLevelCompact: React.FC = () => {
  const { growthStatus, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-24"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!growthStatus) {
    return null;
  }

  const { level } = growthStatus;
  const progressPercentage = level.progress.percentage;

  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-700">성장 레벨</h3>
          </div>
          <span className="text-xs text-gray-500">Lv.{Math.floor(level.score / 10)}</span>
        </div>

        {/* 레벨 정보 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{level.current.icon}</span>
            <div>
              <p className="font-semibold text-gray-900">{level.current.name}</p>
              <p className="text-xs text-gray-500">{level.current.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-1 text-blue-600">
              <Star className="w-4 h-4" />
              <span className="font-bold text-lg">{level.score.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* 진행도 바 */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>진행도</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* 다음 레벨 정보 */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">다음 레벨</span>
            <span className="font-medium text-gray-700">
              {level.next.name} ({level.next.pointsNeeded.toFixed(1)}점)
            </span>
          </div>
        </div>
      </div>

      {/* 축하 메시지 (있을 경우) */}
      {growthStatus.celebration && (
        <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-green-50 border-t border-emerald-100">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{growthStatus.celebration.icon}</span>
            <p className="text-xs text-emerald-700 font-medium">
              {growthStatus.celebration.title}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default GrowthLevelCompact;