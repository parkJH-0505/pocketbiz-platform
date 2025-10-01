/**
 * KeyInsights Component
 * 핵심 인사이트들을 우선순위별로 표시
 */

import React, { useState } from 'react';
import {
  Filter,
  SortDesc,
  Eye,
  EyeOff
} from 'lucide-react';
import { InsightCard } from './InsightCard';
import type { GeneratedInsight } from '@/types/reportV3.types';

interface KeyInsightsProps {
  insights: GeneratedInsight[];
  layout?: 'grid' | 'list';
  maxItems?: number;
  showFilters?: boolean;
  className?: string;
}

export const KeyInsights: React.FC<KeyInsightsProps> = ({
  insights,
  layout = 'grid',
  maxItems = 6,
  showFilters = true,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showActionItems, setShowActionItems] = useState(true);

  // 인사이트 필터링
  const filteredInsights = insights.filter(insight => {
    if (selectedCategory !== 'all' && insight.category !== selectedCategory) {
      return false;
    }
    if (selectedPriority !== 'all' && insight.priority !== selectedPriority) {
      return false;
    }
    return true;
  });

  // 우선순위별 정렬
  const sortedInsights = [...filteredInsights].sort((a, b) => {
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  // 표시할 인사이트 제한
  const displayInsights = sortedInsights.slice(0, maxItems);

  // 카테고리별 개수 계산
  const getCategoryCount = (category: string) => {
    if (category === 'all') return insights.length;
    return insights.filter(insight => insight.category === category).length;
  };

  // 우선순위별 개수 계산
  const getPriorityCount = (priority: string) => {
    if (priority === 'all') return insights.length;
    return insights.filter(insight => insight.priority === priority).length;
  };

  return (
    <div className={className}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-1">
            핵심 인사이트
          </h3>
          <p className="text-sm text-gray-600">
            AI 분석을 통한 핵심 발견사항 및 권장사항
          </p>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowActionItems(!showActionItems)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${showActionItems
                ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {showActionItems ? <Eye size={16} /> : <EyeOff size={16} />}
            액션 아이템
          </button>
        </div>
      </div>

      {/* 필터 섹션 */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-4 flex-wrap">
            {/* 카테고리 필터 */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">카테고리:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
              >
                <option value="all">전체 ({getCategoryCount('all')})</option>
                <option value="strength">강점 ({getCategoryCount('strength')})</option>
                <option value="weakness">약점 ({getCategoryCount('weakness')})</option>
                <option value="opportunity">기회 ({getCategoryCount('opportunity')})</option>
                <option value="recommendation">권장사항 ({getCategoryCount('recommendation')})</option>
              </select>
            </div>

            {/* 우선순위 필터 */}
            <div className="flex items-center gap-2">
              <SortDesc size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">우선순위:</span>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
              >
                <option value="all">전체 ({getPriorityCount('all')})</option>
                <option value="high">높음 ({getPriorityCount('high')})</option>
                <option value="medium">보통 ({getPriorityCount('medium')})</option>
                <option value="low">낮음 ({getPriorityCount('low')})</option>
              </select>
            </div>

            {/* 필터 결과 표시 */}
            {(selectedCategory !== 'all' || selectedPriority !== 'all') && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  필터 결과: {filteredInsights.length}개
                </span>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedPriority('all');
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                >
                  초기화
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 인사이트 목록 */}
      {displayInsights.length > 0 ? (
        <div className={`
          ${layout === 'grid'
            ? 'grid grid-cols-1 lg:grid-cols-2 gap-6'
            : 'space-y-4'
          }
        `}>
          {displayInsights.map((insight, index) => (
            <InsightCard
              key={`${insight.title}-${index}`}
              insight={insight}
              size={layout === 'grid' ? 'standard' : 'compact'}
              showActions={showActionItems}
              className="h-full"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h4 className="text-lg font-semibold text-gray-600 mb-2">
            인사이트가 없습니다
          </h4>
          <p className="text-sm text-gray-500">
            {insights.length === 0
              ? '진단 데이터를 바탕으로 인사이트를 생성하고 있습니다.'
              : '선택한 필터 조건에 해당하는 인사이트가 없습니다.'
            }
          </p>
          {(selectedCategory !== 'all' || selectedPriority !== 'all') && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedPriority('all');
              }}
              className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 underline"
            >
              모든 필터 해제하기
            </button>
          )}
        </div>
      )}

      {/* 더 많은 인사이트가 있을 때 */}
      {sortedInsights.length > maxItems && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-3">
            {sortedInsights.length - maxItems}개의 추가 인사이트가 있습니다.
          </p>
          <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium underline">
            모든 인사이트 보기
          </button>
        </div>
      )}

      {/* 인사이트 요약 통계 */}
      {insights.length > 0 && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h5 className="font-semibold text-blue-900 mb-2">인사이트 요약</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-700">
                {insights.filter(i => i.category === 'strength').length}
              </div>
              <div className="text-xs text-blue-600">강점</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-700">
                {insights.filter(i => i.category === 'weakness').length}
              </div>
              <div className="text-xs text-blue-600">약점</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-700">
                {insights.filter(i => i.category === 'opportunity').length}
              </div>
              <div className="text-xs text-blue-600">기회</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-700">
                {insights.filter(i => i.category === 'recommendation').length}
              </div>
              <div className="text-xs text-blue-600">권장사항</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};