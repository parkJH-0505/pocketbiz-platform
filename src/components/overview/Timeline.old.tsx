/**
 * @fileoverview 타임라인 메인 컴포넌트 - 3단계 레이아웃 관리
 * @description 왼쪽(프로그레스바) + 중앙(브랜치 피드) + 우측(상세 패널) 통합 관리
 * @author PocketCompany
 * @since 2025-01-20
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { Project, ProjectPhase } from '../../types/buildup.types';
import type { BuildupProjectMeeting } from '../../types/schedule.types';
import type { FeedItem, StageFeedGroup } from '../../types/timeline.types';
import { generateDummyFeeds, groupFeedsByStage, toggleFeedExpansion } from '../../utils/feedUtils';
import LeftPanel from './LeftPanel';
import CenterPanel from './CenterPanel';
import RightPanel from './RightPanel';

interface TimelineProps {
  project: Project;
  meetings: BuildupProjectMeeting[];
  onPhaseClick?: (phase: ProjectPhase) => void;
}

const Timeline: React.FC<TimelineProps> = ({
  project,
  meetings,
  onPhaseClick
}) => {
  // ========== 상태 관리 ==========

  // 피드 데이터
  const [feeds, setFeeds] = useState<FeedItem[]>(() => generateDummyFeeds(project.id));
  const [selectedFeed, setSelectedFeed] = useState<FeedItem | null>(null);
  const [expandedFeeds, setExpandedFeeds] = useState<Set<string>>(new Set());

  // 레이아웃 정보
  const [connectionPoints, setConnectionPoints] = useState<Record<ProjectPhase, { x: number; y: number }>>({} as any);
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(0);

  // ========== 계산된 값들 ==========

  // 단계별 피드 그룹화
  const stageFeedGroups = useMemo(() => groupFeedsByStage(feeds), [feeds]);

  // 단계별 피드 매핑
  const feedsByStage = useMemo(() => {
    return stageFeedGroups.reduce((acc, group) => {
      acc[group.stageId] = group.feeds;
      return acc;
    }, {} as Record<ProjectPhase, FeedItem[]>);
  }, [stageFeedGroups]);

  // ========== 이벤트 핸들러들 ==========

  /**
   * 연결점 정보 등록 (왼쪽 패널에서 전달받음)
   */
  const handleConnectionPoint = useCallback((phase: ProjectPhase, point: { x: number; y: number }) => {
    setConnectionPoints(prev => ({
      ...prev,
      [phase]: point
    }));
  }, []);

  /**
   * 왼쪽 패널 너비 변경 시
   */
  const handleLeftPanelResize = useCallback((width: number) => {
    setLeftPanelWidth(width);
  }, []);

  /**
   * 피드 확장/축소 토글
   */
  const handleFeedToggle = useCallback((feedId: string) => {
    setExpandedFeeds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(feedId)) {
        newSet.delete(feedId);
      } else {
        newSet.add(feedId);
      }
      return newSet;
    });

    setFeeds(prev => toggleFeedExpansion(prev, feedId));
  }, []);

  /**
   * 피드 선택 (상세 패널 표시용)
   */
  const handleFeedSelect = useCallback((feed: FeedItem) => {
    setSelectedFeed(feed);
  }, []);

  /**
   * 피드 액션 처리
   */
  const handleFeedAction = useCallback((feedId: string, action: string, data?: any) => {
    console.log('Feed action:', { feedId, action, data });

    // 액션별 처리
    switch (action) {
      case 'view':
        const feed = feeds.find(f => f.id === feedId);
        if (feed) {
          setSelectedFeed(feed);
        }
        break;

      case 'pin':
        setFeeds(prev => prev.map(feed =>
          feed.id === feedId ? { ...feed, pinned: !feed.pinned } : feed
        ));
        break;

      case 'expand':
        handleFeedToggle(feedId);
        break;

      default:
        // TODO: 다른 액션들 구현
        break;
    }
  }, [feeds, handleFeedToggle]);

  /**
   * 단계 클릭 처리
   */
  const handlePhaseClick = useCallback((phase: ProjectPhase) => {
    onPhaseClick?.(phase);

    // 해당 단계의 첫 번째 피드 선택
    const phaseFeeds = feedsByStage[phase];
    if (phaseFeeds && phaseFeeds.length > 0) {
      setSelectedFeed(phaseFeeds[0]);
    }
  }, [onPhaseClick, feedsByStage]);

  /**
   * 상세 패널 액션 처리
   */
  const handleDetailAction = useCallback((action: string, data?: any) => {
    console.log('Detail action:', { action, data });

    switch (action) {
      case 'close':
        setSelectedFeed(null);
        break;

      case 'next_feed':
        if (selectedFeed) {
          const currentStageFeeds = feedsByStage[selectedFeed.stageId] || [];
          const currentIndex = currentStageFeeds.findIndex(f => f.id === selectedFeed.id);
          const nextFeed = currentStageFeeds[currentIndex + 1];
          if (nextFeed) {
            setSelectedFeed(nextFeed);
          }
        }
        break;

      case 'prev_feed':
        if (selectedFeed) {
          const currentStageFeeds = feedsByStage[selectedFeed.stageId] || [];
          const currentIndex = currentStageFeeds.findIndex(f => f.id === selectedFeed.id);
          const prevFeed = currentStageFeeds[currentIndex - 1];
          if (prevFeed) {
            setSelectedFeed(prevFeed);
          }
        }
        break;

      default:
        // 피드 액션으로 위임
        if (selectedFeed) {
          handleFeedAction(selectedFeed.id, action, data);
        }
        break;
    }
  }, [selectedFeed, feedsByStage, handleFeedAction]);

  // ========== 렌더링 ==========

  return (
    <div className="h-full flex flex-col">
      {/* 메인 타임라인 그리드 */}
      <div className="flex-1 grid grid-cols-12 gap-6 p-6 min-h-0">
        {/* 왼쪽 패널: 세로 프로그레스바 (20%) */}
        <div className="col-span-2">
          <LeftPanel
            project={project}
            meetings={meetings}
            feedsByStage={feedsByStage}
            onConnectionPoint={handleConnectionPoint}
            onPhaseClick={handlePhaseClick}
            onResize={handleLeftPanelResize}
          />
        </div>

        {/* 중앙 패널: 브랜치 피드 시스템 (60%) */}
        <div className="col-span-7">
          <CenterPanel
            feeds={feeds}
            feedsByStage={feedsByStage}
            connectionPoints={connectionPoints}
            leftPanelWidth={leftPanelWidth}
            selectedFeedId={selectedFeed?.id}
            onFeedToggle={handleFeedToggle}
            onFeedSelect={handleFeedSelect}
            onFeedAction={handleFeedAction}
          />
        </div>

        {/* 우측 패널: 상세 정보 (20%) */}
        <div className="col-span-3">
          <RightPanel
            project={project}
            selectedFeed={selectedFeed}
            onAction={handleDetailAction}
          />
        </div>
      </div>

      {/* 하단 상태바 (선택사항) */}
      <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span>총 {feeds.length}개 활동</span>
            <span>•</span>
            <span>{stageFeedGroups.length}개 단계</span>
            {selectedFeed && (
              <>
                <span>•</span>
                <span className="text-blue-600 font-medium">
                  {selectedFeed.title} 선택됨
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>실시간 동기화</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;