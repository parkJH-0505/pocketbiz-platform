/**
 * @fileoverview Main Timeline - 메인 세로 타임라인
 * @description Layer 3: 세로축 타임라인 렌더링
 * @author PocketCompany
 * @since 2025-01-30
 */

import React from 'react';
import { TIMELINE_CONSTANTS } from '../../../types/timeline-v3.types';

/**
 * MainTimeline Props
 */
interface MainTimelineProps {
  totalHeight: number;
}

/**
 * Main Timeline 컴포넌트
 * - 메인 세로 타임라인 렌더링
 * - 그라디언트 + 글로우 효과
 * - Phase 5: 진입 애니메이션 (fade-in)
 * - Phase 5-4: React.memo 최적화
 */
const MainTimeline: React.FC<MainTimelineProps> = React.memo(({ totalHeight }) => {
  return (
    <line
      x1={TIMELINE_CONSTANTS.MAIN_AXIS_LEFT}
      y1={TIMELINE_CONSTANTS.CANVAS_PADDING_TOP}
      x2={TIMELINE_CONSTANTS.MAIN_AXIS_LEFT}
      y2={totalHeight - TIMELINE_CONSTANTS.CANVAS_PADDING_BOTTOM}
      stroke="#3B82F6"
      strokeWidth={TIMELINE_CONSTANTS.MAIN_AXIS_WIDTH_HOVER}
      strokeOpacity="0.9"
      style={{
        filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))',
        animation: 'fadeInTimeline 800ms ease-out forwards'
      }}
    />
  );
});

MainTimeline.displayName = 'MainTimeline';

export default MainTimeline;