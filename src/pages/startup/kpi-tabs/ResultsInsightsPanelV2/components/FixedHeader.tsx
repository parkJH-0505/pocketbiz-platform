/**
 * Fixed Header Component for V2 Dashboard
 * 상단 고정 헤더 - 주요 점수, 네비게이션, 액션 버튼
 */

import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Settings, Download, Share2, Zap } from 'lucide-react';
import { useV2Store } from '../store/useV2Store';
import { getScoreColor, getScoreLabel } from '../utils/mockApi';

export const FixedHeader: React.FC = () => {
  const { data, viewState, refreshData, setComparisonMode } = useV2Store();

  const currentScore = data?.current.overall || 0;
  const previousScore = data?.previous.overall || 0;
  const scoreChange = currentScore - previousScore;

  return (
    <header className="bg-white border-b shadow-sm mb-4 sm:mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        {/* 모바일: 세로 레이아웃, 데스크톱: 가로 레이아웃 */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Overall Score Display */}
          <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-6">
            <div className="relative">
              <div className="text-3xl sm:text-4xl font-bold text-primary-main">
                {Math.round(currentScore)}
              </div>
              <div className="text-xs text-neutral-gray mt-1">
                {getScoreLabel(currentScore)}
              </div>
              {scoreChange !== 0 && (
                <div className={`text-xs sm:text-sm mt-1 ${scoreChange > 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {scoreChange > 0 ? '↑' : '↓'} {Math.abs(Math.round(scoreChange))}점
                </div>
              )}
            </div>

            {/* Quick Stats - 모바일에서 수직인 타입으로 변경 */}
            <div className="flex gap-3 sm:gap-4 sm:pl-6 sm:border-l">
              <div className="text-xs sm:text-sm text-center sm:text-left">
                <div className="text-neutral-gray">피어 순위</div>
                <div className="font-semibold">상위 27%</div>
              </div>
              <div className="text-xs sm:text-sm text-center sm:text-left">
                <div className="text-neutral-gray">성장률</div>
                <div className="font-semibold text-accent-green">+12%</div>
              </div>
            </div>
          </div>

          {/* Center/Bottom: Comparison Mode Toggle - 모바일에서 전체 너비 사용 */}
          <div className="flex gap-1 sm:gap-2 bg-neutral-light rounded-lg p-1 w-full lg:w-auto order-last lg:order-none">
            <button
              onClick={() => setComparisonMode('none')}
              className={`flex-1 lg:flex-none px-2 sm:px-3 py-2 lg:py-1 rounded text-xs sm:text-sm transition-colors ${
                viewState.comparisonMode === 'none'
                  ? 'bg-white text-neutral-dark shadow-sm'
                  : 'text-neutral-gray hover:text-neutral-dark'
              }`}
            >
              현재
            </button>
            <button
              onClick={() => setComparisonMode('previous')}
              className={`flex-1 lg:flex-none px-2 sm:px-3 py-2 lg:py-1 rounded text-xs sm:text-sm transition-colors ${
                viewState.comparisonMode === 'previous'
                  ? 'bg-white text-neutral-dark shadow-sm'
                  : 'text-neutral-gray hover:text-neutral-dark'
              }`}
            >
              이전 대비
            </button>
            <button
              onClick={() => setComparisonMode('peers')}
              className={`flex-1 lg:flex-none px-2 sm:px-3 py-2 lg:py-1 rounded text-xs sm:text-sm transition-colors ${
                viewState.comparisonMode === 'peers'
                  ? 'bg-white text-neutral-dark shadow-sm'
                  : 'text-neutral-gray hover:text-neutral-dark'
              }`}
            >
              피어 비교
            </button>
          </div>

          {/* Right: Action Buttons - 태블릿 이상에서만 표시 */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => refreshData()}
              className="p-2 hover:bg-neutral-light rounded-lg transition-colors"
              title="새로고침"
            >
              <RefreshCw size={18} />
            </button>

            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="시뮬레이션">
              <Zap size={18} />
            </button>

            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="내보내기">
              <Download size={18} />
            </button>

            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="공유">
              <Share2 size={18} />
            </button>

            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="설정">
              <Settings size={18} />
            </button>
          </div>

          {/* 모바일/태블릿 전용 새로고침 버튼 */}
          <div className="flex lg:hidden justify-center">
            <button
              onClick={() => refreshData()}
              className="flex items-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg transition-colors"
            >
              <RefreshCw size={16} />
              새로고침
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};