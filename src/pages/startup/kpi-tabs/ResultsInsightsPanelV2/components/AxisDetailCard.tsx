/**
 * Axis Detail Card Component
 * 축별 상세 정보 카드
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useV2Store } from '../store/useV2Store';
import { axisInfo, getScoreColor } from '../utils/mockApi';
import type { AxisKey } from '../types';

interface AxisDetailCardProps {
  axis: AxisKey;
  score: number;
  previousScore?: number;
  peerAverage?: number;
}

export const AxisDetailCard: React.FC<AxisDetailCardProps> = ({
  axis,
  score,
  previousScore = 0,
  peerAverage = 0
}) => {
  const { setSelectedAxis, viewState } = useV2Store();
  const info = axisInfo[axis];
  const change = score - previousScore;
  const isSelected = viewState.selectedAxis === axis;

  const getTrendIcon = () => {
    if (change > 0) return <TrendingUp size={16} className="text-green-500" />;
    if (change < 0) return <TrendingDown size={16} className="text-accent-red" />;
    return <Minus size={16} className="text-neutral-gray" />;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setSelectedAxis(axis)}
      className={`
        relative p-4 bg-white rounded-lg shadow-md cursor-pointer transition-all
        ${isSelected ? 'ring-2 ring-primary-main shadow-lg' : 'hover:shadow-lg'}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-neutral-dark">{info.fullName}</h3>
          <p className="text-xs text-neutral-gray mt-1">{info.description}</p>
        </div>
        <ChevronRight
          size={20}
          className={`text-neutral-gray transition-transform ${isSelected ? 'rotate-90' : ''}`}
        />
      </div>

      {/* Score Display */}
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-primary-main">
            {Math.round(score)}
          </span>
          <span className="text-sm text-neutral-gray">/ 100</span>
        </div>

        <div className="flex items-center gap-1">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${
            change > 0 ? 'text-accent-green' : change < 0 ? 'text-accent-red' : 'text-neutral-gray'
          }`}>
            {change > 0 ? '+' : ''}{Math.round(change)}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="h-2 bg-neutral-light rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary-main"
            style={{ width: `${Math.round(score)}%` }}
          />
        </div>
      </div>

      {/* Comparison Info */}
      {peerAverage > 0 && (
        <div className="mt-3 pt-3 border-t border-neutral-light">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-gray">피어 평균</span>
            <span className={`font-medium ${
              score > peerAverage ? 'text-accent-green' : 'text-accent-orange'
            }`}>
              {Math.round(peerAverage)}점 ({score > peerAverage ? '+' : ''}{Math.round(score - peerAverage)})
            </span>
          </div>
        </div>
      )}

      {/* Selected Indicator */}
      {isSelected && (
        <motion.div
          className="absolute -inset-1 rounded-lg bg-primary-main opacity-10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.div>
  );
};