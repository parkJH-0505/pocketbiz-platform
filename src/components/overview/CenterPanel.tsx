/**
 * @fileoverview 중앙 패널 - 브랜치 피드 시스템 전용
 * @description 왼쪽 프로그레스바에서 연결되는 활동 피드들을 표시
 * @author PocketCompany
 * @since 2025-01-20
 */

import React, { useMemo } from 'react';
import { Search, Filter, MoreVertical, Zap } from 'lucide-react';
import type { ProjectPhase } from '../../types/buildup.types';
import type { FeedItem } from '../../types/timeline.types';
import { ALL_PHASES, PHASE_INFO } from '../../utils/projectPhaseUtils';
import FeedCard from './FeedCard';

interface CenterPanelProps {
  feeds: FeedItem[];
  feedsByStage: Record<ProjectPhase, FeedItem[]>;
  connectionPoints: Record<ProjectPhase, { x: number; y: number }>;
  leftPanelWidth: number;
  selectedFeedId?: string;
  onFeedToggle: (feedId: string) => void;
  onFeedSelect: (feed: FeedItem) => void;
  onFeedAction: (feedId: string, action: string, data?: any) => void;
}

const CenterPanel: React.FC<CenterPanelProps> = ({
  feeds,
  feedsByStage,
  connectionPoints,
  leftPanelWidth,
  selectedFeedId,
  onFeedToggle,
  onFeedSelect,
  onFeedAction
}) => {
  // 단계별 피드 섹션 계산
  const feedSections = useMemo(() => {
    return ALL_PHASES
      .map(phase => {
        const phaseFeeds = feedsByStage[phase] || [];
        const connectionPoint = connectionPoints[phase];

        if (phaseFeeds.length === 0) return null;

        return {
          phase,
          phaseInfo: PHASE_INFO[phase],
          feeds: phaseFeeds,
          connectionPoint
        };
      })
      .filter(Boolean);
  }, [feedsByStage, connectionPoints]);

  // 전체 피드 통계
  const totalFeeds = feeds.length;
  const activeFeedsCount = feeds.filter(f => f.status === 'active').length;

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">프로젝트 활동 피드</h2>
            <p className="text-sm text-gray-500">
              {totalFeeds}개 활동 • {activeFeedsCount}개 진행중
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* 검색 */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Search className="w-4 h-4 text-gray-400" />
            </button>

            {/* 필터 */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Filter className="w-4 h-4 text-gray-400" />
            </button>

            {/* 더보기 */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* 실시간 상태 */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-green-500" />
            <span>실시간 동기화</span>
          </div>
          <span>•</span>
          <span>마지막 업데이트: 방금 전</span>
        </div>
      </div>

      {/* 메인 피드 영역 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {feedSections.length === 0 ? (
          /* 빈 상태 */
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">활동이 없습니다</h3>
              <p className="text-sm text-gray-500 max-w-sm">
                프로젝트가 진행되면 파일 업로드, 미팅 기록, 댓글 등의 활동이 여기에 표시됩니다.
              </p>
            </div>
          </div>
        ) : (
          /* 피드 섹션들 */
          <div className="space-y-8 p-6">
            {feedSections.map(section => (
              <FeedSection
                key={section!.phase}
                section={section!}
                selectedFeedId={selectedFeedId}
                onFeedToggle={onFeedToggle}
                onFeedSelect={onFeedSelect}
                onFeedAction={onFeedAction}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 개별 피드 섹션 컴포넌트
 */
interface FeedSectionProps {
  section: {
    phase: ProjectPhase;
    phaseInfo: any;
    feeds: FeedItem[];
    connectionPoint?: { x: number; y: number };
  };
  selectedFeedId?: string;
  onFeedToggle: (feedId: string) => void;
  onFeedSelect: (feed: FeedItem) => void;
  onFeedAction: (feedId: string, action: string, data?: any) => void;
}

const FeedSection: React.FC<FeedSectionProps> = ({
  section,
  selectedFeedId,
  onFeedToggle,
  onFeedSelect,
  onFeedAction
}) => {
  const { phase, phaseInfo, feeds, connectionPoint } = section;

  return (
    <div className="relative">
      {/* 왼쪽에서 오는 연결선 */}
      {connectionPoint && (
        <div className="absolute -left-6 top-4">
          <div className="flex items-center">
            {/* 연결선 */}
            <div className="w-6 h-0.5 bg-gradient-to-r from-blue-400 to-blue-500" />

            {/* 연결점 */}
            <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
          </div>
        </div>
      )}

      {/* 섹션 헤더 */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-3 h-3 rounded-full ${phaseInfo.bgColor}`} />
          <h3 className="text-base font-semibold text-gray-900">
            {phaseInfo.label} 활동
          </h3>
          <span className="px-2 py-1 bg-gray-100 text-xs font-medium text-gray-600 rounded-full">
            {feeds.length}개
          </span>
        </div>
        <p className="text-sm text-gray-500 ml-6">{phaseInfo.description}</p>
      </div>

      {/* 피드 카드들 */}
      <div className="space-y-3 ml-6">
        {feeds.map((feed, index) => (
          <div
            key={feed.id}
            className={`
              relative transition-all duration-200
              ${selectedFeedId === feed.id ? 'ring-2 ring-blue-500 ring-opacity-50 rounded-lg' : ''}
            `}
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            <FeedCard
              feed={feed}
              expanded={feed.expanded || false}
              onToggle={() => onFeedToggle(feed.id)}
              onAction={(action, data) => {
                if (action === 'view') {
                  onFeedSelect(feed);
                } else {
                  onFeedAction(feed.id, action, data);
                }
              }}
              size="normal"
              className={`
                hover:shadow-md transition-all duration-200 cursor-pointer
                ${selectedFeedId === feed.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}
              `}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CenterPanel;