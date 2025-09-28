/**
 * @fileoverview 인터랙티브 노드 레이어
 * @description 브랜치 끝의 피드 노드들과 인터랙션 처리
 * @author PocketCompany
 * @since 2025-01-20
 */

import React, { useMemo, useCallback } from 'react';
import type { FeedItem } from '../../types/timeline.types';
import type {
  StagePosition,
  BranchInteractionEvent,
  FeedItemWithPosition
} from '../../types/branch-timeline.types';
import type { ProjectPhase } from '../../types/buildup.types';
import { useBranchTimeline } from '../../contexts/BranchTimelineContext';

interface NodeLayerProps {
  /** 피드 데이터 */
  feeds: FeedItem[];
  /** 브랜치 시작점들 */
  branchStartPoints: Record<ProjectPhase, { x: number; y: number }>;
  /** 뷰포트 상태 */
  viewportState: {
    width: number;
    height: number;
    scrollTop: number;
    scrollLeft: number;
  };
  /** 단계 위치 정보 */
  stagePositions: Record<ProjectPhase, StagePosition>;
  /** 피드 인터랙션 핸들러 */
  onFeedInteraction: (event: BranchInteractionEvent) => void;
  /** 컨테이너 참조 */
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * 인터랙티브 노드 레이어
 * 브랜치 끝에 위치한 피드 노드들의 렌더링과 인터랙션 관리
 */
const NodeLayer: React.FC<NodeLayerProps> = ({
  feeds,
  branchStartPoints,
  viewportState,
  stagePositions,
  onFeedInteraction,
  containerRef
}) => {
  const { state, actions, performance } = useBranchTimeline();

  // 현재 뷰포트에 보이는 노드들만 계산
  const visibleNodes: FeedItemWithPosition[] = useMemo(() => {
    performance.startRender();

    const { scrollTop, height } = viewportState;
    const viewportStart = scrollTop - 100; // 오버스캔
    const viewportEnd = scrollTop + height + 100;

    const visible = state.computed.feedsWithPositions.filter(feed => {
      const nodeY = feed.branchPosition.y;
      return nodeY >= viewportStart && nodeY <= viewportEnd;
    });

    performance.endRender();
    return visible;
  }, [state.computed.feedsWithPositions, viewportState, performance]);

  // 노드 클릭 핸들러
  const handleNodeClick = useCallback((feed: FeedItemWithPosition, event: React.MouseEvent) => {
    event.stopPropagation();

    performance.measureInteraction('node-click', () => {
      const interactionEvent: BranchInteractionEvent = {
        type: 'click',
        feedId: feed.id,
        timestamp: new Date(),
        mousePosition: {
          x: event.clientX,
          y: event.clientY
        }
      };

      actions.setSelected(feed.id);
      onFeedInteraction(interactionEvent);
    });
  }, [actions, onFeedInteraction, performance]);

  // 노드 호버 핸들러
  const handleNodeHover = useCallback((feed: FeedItemWithPosition | null) => {
    performance.measureInteraction('node-hover', () => {
      actions.setHover(feed?.id || null);

      if (feed) {
        const interactionEvent: BranchInteractionEvent = {
          type: 'hover',
          feedId: feed.id,
          timestamp: new Date()
        };
        onFeedInteraction(interactionEvent);
      }
    });
  }, [actions, onFeedInteraction, performance]);

  // 노드 확장/축소 핸들러
  const handleNodeToggle = useCallback((feed: FeedItemWithPosition) => {
    performance.measureInteraction('node-toggle', () => {
      const isExpanded = state.ui.expandedFeedIds.has(feed.id);
      actions.setExpanded(feed.id, !isExpanded);

      const interactionEvent: BranchInteractionEvent = {
        type: isExpanded ? 'collapse' : 'expand',
        feedId: feed.id,
        timestamp: new Date()
      };
      onFeedInteraction(interactionEvent);
    });
  }, [state.ui.expandedFeedIds, actions, onFeedInteraction, performance]);

  // 레이어 스타일
  const layerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'auto',
    zIndex: 3
  };

  return (
    <div className="node-layer" style={layerStyle}>
      {visibleNodes.map(feed => (
        <BranchNode
          key={feed.id}
          feed={feed}
          isHovered={state.ui.hoveredFeedId === feed.id}
          isSelected={state.ui.selectedFeedId === feed.id}
          isExpanded={state.ui.expandedFeedIds.has(feed.id)}
          viewMode={state.ui.viewMode}
          onHover={handleNodeHover}
          onClick={handleNodeClick}
          onToggle={handleNodeToggle}
        />
      ))}
    </div>
  );
};

/**
 * 개별 브랜치 노드 컴포넌트
 */
interface BranchNodeProps {
  feed: FeedItemWithPosition;
  isHovered: boolean;
  isSelected: boolean;
  isExpanded: boolean;
  viewMode: 'normal' | 'compact' | 'detailed';
  onHover: (feed: FeedItemWithPosition | null) => void;
  onClick: (feed: FeedItemWithPosition, event: React.MouseEvent) => void;
  onToggle: (feed: FeedItemWithPosition) => void;
}

const BranchNode: React.FC<BranchNodeProps> = React.memo(({
  feed,
  isHovered,
  isSelected,
  isExpanded,
  viewMode,
  onHover,
  onClick,
  onToggle
}) => {
  // 노드 위치 계산
  const nodeStyle: React.CSSProperties = useMemo(() => {
    const { x, y } = feed.branchPosition;

    return {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      transform: 'translate(-50%, -50%)',
      zIndex: isSelected ? 10 : isHovered ? 5 : 1,
      transition: 'all 0.2s ease',
      cursor: 'pointer'
    };
  }, [feed.branchPosition, isSelected, isHovered]);

  // 노드 크기 및 스타일 계산
  const nodeConfig = useMemo(() => {
    const baseWidth = viewMode === 'compact' ? 180 : viewMode === 'detailed' ? 280 : 220;
    const baseHeight = viewMode === 'compact' ? 36 : viewMode === 'detailed' ? 60 : 44;

    const expandedWidth = isExpanded ? Math.min(400, baseWidth * 1.8) : baseWidth;
    const expandedHeight = isExpanded ? baseHeight * 1.5 : baseHeight;

    return {
      width: expandedWidth,
      height: expandedHeight,
      scale: isHovered ? 1.05 : 1
    };
  }, [viewMode, isExpanded, isHovered]);

  // 피드 타입별 아이콘
  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'file': return '📄';
      case 'meeting': return '🤝';
      case 'comment': return '💬';
      case 'todo': return '✅';
      case 'progress': return '📊';
      case 'team': return '👥';
      default: return '📋';
    }
  };

  // 우선순위별 색상
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  // 노드 컨테이너 스타일
  const containerStyle: React.CSSProperties = {
    width: `${nodeConfig.width}px`,
    height: `${nodeConfig.height}px`,
    transform: `scale(${nodeConfig.scale})`,
    borderRadius: '12px',
    background: isSelected
      ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'
      : isHovered
      ? 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)'
      : 'linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%)',
    border: isSelected
      ? '2px solid #2563EB'
      : isHovered
      ? '2px solid #CBD5E1'
      : '1px solid #E2E8F0',
    boxShadow: isSelected
      ? '0 10px 25px rgba(59, 130, 246, 0.3)'
      : isHovered
      ? '0 8px 20px rgba(0, 0, 0, 0.12)'
      : '0 4px 12px rgba(0, 0, 0, 0.08)',
    color: isSelected ? '#FFFFFF' : '#1F2937',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.2s ease'
  };

  return (
    <div
      style={nodeStyle}
      onMouseEnter={() => onHover(feed)}
      onMouseLeave={() => onHover(null)}
      onClick={(e) => onClick(feed, e)}
      data-feed-id={feed.id}
      data-timeline-node
    >
      <div style={containerStyle}>
        {/* 헤더 영역 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: viewMode === 'compact' ? '8px 12px' : '12px 16px',
          borderBottom: isExpanded ? `1px solid ${isSelected ? 'rgba(255,255,255,0.2)' : '#E2E8F0'}` : 'none'
        }}>
          {/* 타입 아이콘 */}
          <span style={{
            fontSize: viewMode === 'compact' ? '14px' : '16px',
            marginRight: '8px'
          }}>
            {getTypeIcon(feed.type)}
          </span>

          {/* 제목 */}
          <span style={{
            flex: 1,
            fontSize: viewMode === 'compact' ? '12px' : '14px',
            fontWeight: '600',
            truncate: true,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {feed.title}
          </span>

          {/* 우선순위 인디케이터 */}
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: getPriorityColor(feed.priority),
            marginLeft: '8px'
          }} />

          {/* 확장/축소 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(feed);
            }}
            style={{
              marginLeft: '8px',
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '12px',
              opacity: 0.7,
              transition: 'opacity 0.2s ease'
            }}
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>

        {/* 확장된 내용 영역 */}
        {isExpanded && (
          <div style={{
            padding: '12px 16px',
            fontSize: '12px',
            opacity: 0.8,
            lineHeight: '1.4'
          }}>
            {feed.description && (
              <p style={{ margin: '0 0 8px 0' }}>
                {feed.description.length > 100
                  ? `${feed.description.substring(0, 100)}...`
                  : feed.description
                }
              </p>
            )}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10px',
              opacity: 0.6
            }}>
              <span>{feed.author?.name}</span>
              <span>{new Date(feed.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

BranchNode.displayName = 'BranchNode';

export default NodeLayer;