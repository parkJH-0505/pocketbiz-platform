/**
 * @fileoverview 통합 브랜치 타임라인 컴포넌트
 * @description 메인 타임라인과 브랜치 피드들을 통합한 단일 컴포넌트
 * @author PocketCompany
 * @since 2025-01-20
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { Project } from '../../types/buildup.types';
import type { BuildupProjectMeeting } from '../../types/schedule.types';
import type { FeedItem } from '../../types/timeline.types';
import type {
  BranchInteractionEvent,
  StagePosition,
  BranchTimelineState
} from '../../types/branch-timeline.types';
import type { ProjectPhase } from '../../types/buildup.types';
import { BranchTimelineProvider } from '../../contexts/BranchTimelineContext';
import VerticalProgressBar from './VerticalProgressBar';
import BranchLayer from './BranchLayer';
import NodeLayer from './NodeLayer';
import TimelineContainer from './TimelineContainer';
import { calculateStagePositions, debugStagePositions } from '../../utils/stagePositionCalculator';

interface BranchTimelineProps {
  /** 프로젝트 데이터 */
  project: Project;
  /** 미팅 데이터 */
  meetings: BuildupProjectMeeting[];
  /** 단계별 피드 데이터 */
  feedsByStage: Record<ProjectPhase, FeedItem[]>;
  /** 피드 인터랙션 이벤트 핸들러 */
  onFeedInteraction?: (event: BranchInteractionEvent) => void;
  /** 단계 클릭 핸들러 */
  onPhaseClick?: (phase: ProjectPhase) => void;
  /** 컨테이너 클래스명 */
  className?: string;
}

/**
 * 브랜치 타임라인 메인 컴포넌트
 *
 * 아키텍처:
 * 1. MainTimeline Layer (배경): VerticalProgressBar
 * 2. Branch Layer (중간): SVG 브랜치 연결선들
 * 3. Node Layer (전경): 인터랙티브 피드 노드들
 */
const BranchTimeline: React.FC<BranchTimelineProps> = ({
  project,
  meetings,
  feedsByStage,
  onFeedInteraction,
  onPhaseClick,
  className = ''
}) => {
  // 컨테이너 참조
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // 브랜치 시작점들 (VerticalProgressBar의 각 단계에서 제공)
  const [branchStartPoints, setBranchStartPoints] = useState<
    Record<ProjectPhase, { x: number; y: number }>
  >({} as Record<ProjectPhase, { x: number; y: number }>);

  // 뷰포트 상태
  const [viewportState, setViewportState] = useState({
    width: 0,
    height: 0,
    scrollTop: 0,
    scrollLeft: 0
  });

  // 단계 위치 정보 계산
  const stagePositions = React.useMemo(() => {
    const positions = calculateStagePositions(project, meetings, {
      baseStageHeight: 240,
      stageSpacing: 100,
      topPadding: 120, // ProgressSummary 영역 고려
      bottomPadding: 80
    });

    // 개발 환경에서 디버그 정보 출력
    if (process.env.NODE_ENV === 'development') {
      debugStagePositions(positions);
    }

    return positions;
  }, [project, meetings]);

  // 모든 피드들을 단일 배열로 변환
  const allFeeds: FeedItem[] = React.useMemo(() => {
    return Object.entries(feedsByStage).flatMap(([stage, feeds]) =>
      feeds.map(feed => ({ ...feed, stageId: stage as ProjectPhase }))
    );
  }, [feedsByStage]);

  // 브랜치 연결점 등록 핸들러
  const handleConnectionPoint = useCallback((phase: ProjectPhase, point: { x: number; y: number }) => {
    setBranchStartPoints(prev => ({
      ...prev,
      [phase]: point
    }));
  }, []);

  // 뷰포트 업데이트
  const updateViewport = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    setViewportState({
      width: rect.width,
      height: rect.height,
      scrollTop: containerRef.current.scrollTop,
      scrollLeft: containerRef.current.scrollLeft
    });
  }, []);

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    updateViewport();
  }, [updateViewport]);

  // 리사이즈 이벤트 핸들러
  useEffect(() => {
    const handleResize = () => {
      updateViewport();
    };

    window.addEventListener('resize', handleResize);
    updateViewport(); // 초기 설정

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateViewport]);

  // 피드 인터랙션 이벤트 처리
  const handleFeedInteraction = useCallback((event: BranchInteractionEvent) => {
    onFeedInteraction?.(event);
  }, [onFeedInteraction]);

  // 성능 최적화를 위한 스타일 계산
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'auto',
    // GPU 가속 활성화
    transform: 'translateZ(0)',
    willChange: 'scroll-position'
  };

  const timelineStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    minHeight: '100%',
    // 레이어 스택 설정
    zIndex: 1
  };

  return (
    <BranchTimelineProvider
      feeds={allFeeds}
      stagePositions={stagePositions}
      onPerformanceAlert={(metrics) => {
        console.warn('Timeline performance alert:', metrics);
      }}
    >
      <TimelineContainer
        className={`branch-timeline-container ${className}`}
        onViewportChange={(viewport) => {
          setViewportState(prev => ({
            ...prev,
            width: viewport.width,
            height: viewport.height,
            scrollTop: viewport.scrollTop,
            scrollLeft: viewport.scrollLeft
          }));
        }}
        onScrollChange={(scroll) => {
          setViewportState(prev => ({
            ...prev,
            scrollTop: scroll.scrollTop,
            scrollLeft: scroll.scrollLeft
          }));
        }}
        virtualScrollConfig={{
          enabled: true,
          itemHeight: 60,
          overscan: 5,
          scrollDebounce: 16,
          chunkSize: 20
        }}
      >
        <div
          ref={timelineRef}
          className="branch-timeline-content"
          style={{
            position: 'relative',
            width: '100%',
            minHeight: '100%',
            zIndex: 1
          }}
        >
          {/* Layer 1: 메인 타임라인 (배경) */}
          <div className="timeline-layer-main" style={{ position: 'relative', zIndex: 1 }}>
            <VerticalProgressBar
              project={project}
              meetings={meetings}
              feedsByStage={feedsByStage}
              onConnectionPoint={handleConnectionPoint}
              onPhaseClick={onPhaseClick}
            />
          </div>

          {/* Layer 2: 브랜치 연결선 (중간) */}
          <BranchLayer
            feeds={allFeeds}
            branchStartPoints={branchStartPoints}
            viewportState={viewportState}
            stagePositions={stagePositions}
            containerRef={containerRef}
          />

          {/* Layer 3: 인터랙티브 노드 (전경) */}
          <NodeLayer
            feeds={allFeeds}
            branchStartPoints={branchStartPoints}
            viewportState={viewportState}
            stagePositions={stagePositions}
            onFeedInteraction={handleFeedInteraction}
            containerRef={containerRef}
          />
        </div>
      </TimelineContainer>
    </BranchTimelineProvider>
  );
};

export default BranchTimeline;