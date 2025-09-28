/**
 * @fileoverview 브랜치 피드 시스템 메인 컴포넌트
 * @description 세로 프로그레스바에서 가로로 뻗어나가는 활동 피드들을 관리
 * @author PocketCompany
 * @since 2025-01-20
 */

import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Filter, MoreHorizontal } from 'lucide-react';
import type { BranchFeedProps, FeedItem, StageFeedGroup } from '../../types/timeline.types';
import type { ProjectPhase } from '../../types/buildup.types';
import { PHASE_INFO } from '../../utils/projectPhaseUtils';
import FeedCard from './FeedCard';

const BranchFeed: React.FC<BranchFeedProps> = ({
  stageId,
  feeds,
  connectionPoint,
  onFeedClick,
  onFeedToggle,
  onFeedAction,
  maxVisible = 5,
  autoExpand = false
}) => {
  const [isExpanded, setIsExpanded] = useState(autoExpand);
  const [showAll, setShowAll] = useState(false);

  // 피드들을 시간순으로 정렬 (최신순)
  const sortedFeeds = useMemo(() => {
    return [...feeds].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [feeds]);

  // 표시할 피드들 결정
  const visibleFeeds = useMemo(() => {
    if (showAll) return sortedFeeds;
    return sortedFeeds.slice(0, maxVisible);
  }, [sortedFeeds, showAll, maxVisible]);

  // 단계 정보
  const stageInfo = PHASE_INFO[stageId];

  // 피드가 없으면 렌더링하지 않음
  if (feeds.length === 0) return null;

  // 브랜치 연결선 스타일 계산
  const branchLineStyle = {
    position: 'absolute' as const,
    left: `${connectionPoint.x + 16}px`, // 노드 중앙에서 오른쪽으로
    top: `${connectionPoint.y}px`,
    width: '40px', // 연결선 길이
    height: '2px',
    backgroundColor: '#60a5fa',
    zIndex: 10,
  };

  // 브랜치 컨테이너 위치 계산
  const branchContainerStyle = {
    position: 'absolute' as const,
    left: `${connectionPoint.x + 60}px`, // 연결선 끝에서 시작
    top: `${connectionPoint.y - 100}px`, // 노드 중앙에서 위로 조정
    width: '380px',
    maxHeight: '400px',
    zIndex: 10,
  };

  return (
    <>
      {/* 브랜치 연결선 */}
      <div style={branchLineStyle}>
        {/* 연결점 */}
        <div className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-blue-400 animate-pulse" />

        {/* 그라데이션 연결선 */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full" />

        {/* 반짝임 효과 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
      </div>

      {/* 브랜치 피드 컨테이너 */}
      <div style={branchContainerStyle}>
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-xl overflow-hidden">
          {/* 브랜치 헤더 */}
          <div className="px-4 py-3 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${stageInfo.bgColor.replace('bg-', 'bg-')}`} />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {stageInfo.label} 활동
                  </h3>
                  <p className="text-xs text-gray-500">
                    {feeds.length}개 활동 · 최근 {visibleFeeds.length}개 표시
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* 필터 버튼 */}
                <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <Filter className="w-4 h-4 text-gray-400" />
                </button>

                {/* 더보기 버튼 */}
                <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>

                {/* 확장/축소 버튼 */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 피드 목록 */}
          {isExpanded && (
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              <div className="divide-y divide-gray-100">
                {visibleFeeds.map((feed, index) => (
                  <div
                    key={feed.id}
                    className="relative"
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <FeedCard
                      feed={feed}
                      expanded={feed.expanded || false}
                      onToggle={() => onFeedToggle?.(feed.id)}
                      onAction={(action, data) => onFeedAction?.(feed.id, action)}
                      size="compact"
                      className="hover:bg-gray-50/50 transition-colors duration-200"
                    />
                  </div>
                ))}
              </div>

              {/* 더 보기 버튼 */}
              {!showAll && sortedFeeds.length > maxVisible && (
                <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                  <button
                    onClick={() => setShowAll(true)}
                    className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    {sortedFeeds.length - maxVisible}개 더 보기
                  </button>
                </div>
              )}

              {/* 접기 버튼 (모든 항목 표시 중일 때) */}
              {showAll && sortedFeeds.length > maxVisible && (
                <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                  <button
                    onClick={() => setShowAll(false)}
                    className="w-full text-sm text-gray-600 hover:text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    접기
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 축소 상태일 때 요약 정보 */}
          {!isExpanded && (
            <div className="p-3 bg-gray-50/30">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>최근 활동: {feeds.length > 0 ? new Date(feeds[0].timestamp).toLocaleDateString('ko-KR') : '-'}</span>
                <span className="text-blue-600 font-medium">클릭하여 펼치기</span>
              </div>
            </div>
          )}
        </div>

        {/* 브랜치 끝점 표시 */}
        <div className="absolute -left-3 top-1/2 transform -translate-y-1/2">
          <div className="w-6 h-6 bg-white border-2 border-blue-400 rounded-full flex items-center justify-center shadow-sm">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </>
  );
};

export default BranchFeed;