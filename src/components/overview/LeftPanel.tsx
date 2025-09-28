/**
 * @fileoverview 왼쪽 패널 - 세로 프로그레스바 전용
 * @description 정리된 VerticalProgressBar 래퍼 컴포넌트
 * @author PocketCompany
 * @since 2025-01-20
 */

import React, { useEffect, useRef } from 'react';
import type { ProjectPhase, Project } from '../../types/buildup.types';
import type { BuildupProjectMeeting } from '../../types/schedule.types';
import type { FeedItem } from '../../types/timeline.types';
import VerticalProgressBar from './VerticalProgressBar';

interface LeftPanelProps {
  project: Project;
  meetings: BuildupProjectMeeting[];
  feedsByStage: Record<ProjectPhase, FeedItem[]>;
  onConnectionPoint: (phase: ProjectPhase, point: { x: number; y: number }) => void;
  onPhaseClick: (phase: ProjectPhase) => void;
  onResize?: (width: number) => void;
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  project,
  meetings,
  feedsByStage,
  onConnectionPoint,
  onPhaseClick,
  onResize
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // 패널 크기 변화 감지
  useEffect(() => {
    if (panelRef.current && onResize) {
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          onResize(entry.contentRect.width);
        }
      });

      resizeObserver.observe(panelRef.current);

      // 초기 크기 전달
      onResize(panelRef.current.offsetWidth);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [onResize]);

  return (
    <div
      ref={panelRef}
      className="h-full border-r border-gray-200 pr-4"
    >
      <VerticalProgressBar
        project={project}
        meetings={meetings}
        feedsByStage={feedsByStage}
        onConnectionPoint={onConnectionPoint}
        onPhaseClick={onPhaseClick}
      />
    </div>
  );
};

export default LeftPanel;