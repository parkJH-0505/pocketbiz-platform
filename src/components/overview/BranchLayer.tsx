/**
 * @fileoverview 브랜치 연결선 레이어
 * @description SVG 기반 브랜치 렌더링 및 애니메이션
 * @author PocketCompany
 * @since 2025-01-20
 */

import React, { useMemo } from 'react';
import type { FeedItem } from '../../types/timeline.types';
import type {
  StagePosition,
  BranchConnector
} from '../../types/branch-timeline.types';
import type { ProjectPhase } from '../../types/buildup.types';
import { useBranchTimeline } from '../../contexts/BranchTimelineContext';

interface BranchLayerProps {
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
  /** 컨테이너 참조 */
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * SVG 브랜치 연결선 레이어
 * 메인 타임라인에서 각 피드 노드로 연결되는 브랜치들을 렌더링
 */
const BranchLayer: React.FC<BranchLayerProps> = ({
  feeds,
  branchStartPoints,
  viewportState,
  stagePositions,
  containerRef
}) => {
  const { state, performance } = useBranchTimeline();

  // 현재 뷰포트에 보이는 브랜치 연결선들만 계산
  const visibleConnectors: BranchConnector[] = useMemo(() => {
    performance.startRender();

    const connectors: BranchConnector[] = [];
    const { scrollTop, height } = viewportState;
    const viewportStart = scrollTop - 100; // 오버스캔
    const viewportEnd = scrollTop + height + 100;

    // computed 상태에서 브랜치 연결선 정보 가져오기
    state.computed.branchConnectors.forEach(connector => {
      const { startPoint, endPoint } = connector;

      // 뷰포트 내에 있는지 확인
      const isVisible = (
        (startPoint.y >= viewportStart && startPoint.y <= viewportEnd) ||
        (endPoint.y >= viewportStart && endPoint.y <= viewportEnd) ||
        (startPoint.y <= viewportStart && endPoint.y >= viewportEnd)
      );

      if (isVisible) {
        connectors.push(connector);
      }
    });

    performance.endRender();
    return connectors;
  }, [state.computed.branchConnectors, viewportState, performance]);

  // SVG 뷰박스 계산
  const svgViewBox = useMemo(() => {
    const { width, height, scrollTop, scrollLeft } = viewportState;
    return `${scrollLeft} ${scrollTop} ${width} ${height}`;
  }, [viewportState]);

  // 스타일 설정
  const layerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 2,
    overflow: 'hidden'
  };

  const svgStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none'
  };

  return (
    <div className="branch-layer" style={layerStyle}>
      <svg
        style={svgStyle}
        viewBox={svgViewBox}
        preserveAspectRatio="none"
        data-testid="branch-svg"
      >
        {/* 정의 섹션 - 그라데이션, 패턴 등 */}
        <defs>
          {/* 브랜치별 그라데이션 정의 */}
          {visibleConnectors.map(connector => (
            <linearGradient
              key={`gradient-${connector.id}`}
              id={`branch-gradient-${connector.id}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop
                offset="0%"
                stopColor={connector.style.color}
                stopOpacity="0.1"
              />
              <stop
                offset="100%"
                stopColor={connector.style.color}
                stopOpacity="0.8"
              />
            </linearGradient>
          ))}

          {/* 애니메이션 패턴 */}
          <pattern
            id="branch-animation-pattern"
            patternUnits="userSpaceOnUse"
            width="10"
            height="2"
          >
            <rect
              width="5"
              height="2"
              fill="currentColor"
              opacity="0.3"
            />
          </pattern>
        </defs>

        {/* 브랜치 연결선들 렌더링 */}
        <g className="branch-connectors">
          {visibleConnectors.map(connector => (
            <BranchConnectorPath
              key={connector.id}
              connector={connector}
            />
          ))}
        </g>

        {/* 디버그 모드용 그리드 라인 (개발 시에만) */}
        {process.env.NODE_ENV === 'development' && (
          <g className="debug-grid" opacity="0.1">
            {/* 수직 그리드 라인들 */}
            {Array.from({ length: 10 }, (_, i) => (
              <line
                key={`vgrid-${i}`}
                x1={i * 50}
                y1={viewportState.scrollTop}
                x2={i * 50}
                y2={viewportState.scrollTop + viewportState.height}
                stroke="#999"
                strokeWidth="0.5"
              />
            ))}
            {/* 수평 그리드 라인들 */}
            {Array.from({ length: 20 }, (_, i) => (
              <line
                key={`hgrid-${i}`}
                x1={0}
                y1={viewportState.scrollTop + i * 50}
                x2={viewportState.width}
                y2={viewportState.scrollTop + i * 50}
                stroke="#999"
                strokeWidth="0.5"
              />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
};

/**
 * 개별 브랜치 연결선 컴포넌트
 */
interface BranchConnectorPathProps {
  connector: BranchConnector;
}

const BranchConnectorPath: React.FC<BranchConnectorPathProps> = React.memo(({ connector }) => {
  const { style, pathData, animationState, id } = connector;

  // 애니메이션 클래스 계산
  const animationClass = useMemo(() => {
    switch (animationState) {
      case 'drawing':
        return 'branch-drawing';
      case 'pulsing':
        return 'branch-pulsing';
      case 'fading':
        return 'branch-fading';
      default:
        return '';
    }
  }, [animationState]);

  // 스트로크 대시 배열 (애니메이션용)
  const strokeDashArray = useMemo(() => {
    if (animationState === 'drawing') {
      // 패스 길이 기반 대시 설정
      return '5,5';
    }
    return undefined;
  }, [animationState]);

  return (
    <g className={`branch-connector ${animationClass}`}>
      {/* 메인 브랜치 라인 */}
      <path
        d={pathData}
        stroke={style.color}
        strokeWidth={style.strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={strokeDashArray}
        opacity={0.8}
        style={{
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
        }}
      />

      {/* 배경 브랜치 (더 두꺼운 라인) */}
      <path
        d={pathData}
        stroke={style.secondaryColor}
        strokeWidth={style.strokeWidth + 1}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.3}
        style={{
          filter: 'blur(1px)'
        }}
      />

      {/* 하이라이트 효과 (호버 시) */}
      <path
        d={pathData}
        stroke="url(#branch-gradient-${id})"
        strokeWidth={style.strokeWidth * 1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0}
        className="branch-highlight"
        style={{
          transition: 'opacity 0.2s ease'
        }}
      />
    </g>
  );
});

BranchConnectorPath.displayName = 'BranchConnectorPath';

export default BranchLayer;