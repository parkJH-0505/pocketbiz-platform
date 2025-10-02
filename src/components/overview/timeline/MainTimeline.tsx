/**
 * @fileoverview Main Timeline - 메인 세로 타임라인
 * @description Layer 3: 세로축 타임라인 렌더링
 * Phase 7-5: Visible.vc 스타일 강한 Glow 적용
 * @author PocketCompany
 * @since 2025-01-30
 */

import React from 'react';
import { TIMELINE_CONSTANTS, TIMELINE_DESIGN_SYSTEM } from '../../../types/timeline-v3.types';

/**
 * MainTimeline Props
 */
interface MainTimelineProps {
  totalHeight: number;
}

/**
 * Main Timeline 컴포넌트
 * - 메인 세로 타임라인 렌더링
 * - 그라디언트 stroke + 강한 Glow 효과 (Visible.vc 스타일)
 * - Phase 5: 진입 애니메이션 (fade-in)
 * - Phase 7-5: 색상 통일 (rgb(15, 82, 222))
 */
const MainTimeline: React.FC<MainTimelineProps> = React.memo(({ totalHeight }) => {
  return (
    <>
      {/* Step 1: 메인 선 (실선) */}
      <line
        x1={TIMELINE_CONSTANTS.MAIN_AXIS_LEFT}
        y1={TIMELINE_CONSTANTS.CANVAS_PADDING_TOP}
        x2={TIMELINE_CONSTANTS.MAIN_AXIS_LEFT}
        y2={totalHeight - TIMELINE_CONSTANTS.CANVAS_PADDING_BOTTOM}
        stroke="rgb(15, 82, 222)"
        strokeWidth={TIMELINE_CONSTANTS.MAIN_AXIS_WIDTH_HOVER}
        strokeOpacity={0.9}
        style={{
          animation: 'fadeInTimeline 800ms ease-out forwards'
        }}
      />

      {/* Step 2: Glow 레이어 1 (중간 강도) */}
      <line
        x1={TIMELINE_CONSTANTS.MAIN_AXIS_LEFT}
        y1={TIMELINE_CONSTANTS.CANVAS_PADDING_TOP}
        x2={TIMELINE_CONSTANTS.MAIN_AXIS_LEFT}
        y2={totalHeight - TIMELINE_CONSTANTS.CANVAS_PADDING_BOTTOM}
        stroke="rgb(15, 82, 222)"
        strokeWidth={TIMELINE_CONSTANTS.MAIN_AXIS_WIDTH_HOVER + 4}
        strokeOpacity={0.3}
        style={{
          filter: 'blur(8px)',
          animation: 'fadeInTimeline 800ms ease-out forwards'
        }}
      />

      {/* Step 3: Glow 레이어 2 (강한 외곽 glow - Visible.vc 스타일) */}
      <line
        x1={TIMELINE_CONSTANTS.MAIN_AXIS_LEFT}
        y1={TIMELINE_CONSTANTS.CANVAS_PADDING_TOP}
        x2={TIMELINE_CONSTANTS.MAIN_AXIS_LEFT}
        y2={totalHeight - TIMELINE_CONSTANTS.CANVAS_PADDING_BOTTOM}
        stroke="rgb(15, 82, 222)"
        strokeWidth={TIMELINE_CONSTANTS.MAIN_AXIS_WIDTH_HOVER + 12}
        strokeOpacity={0.15}
        style={{
          filter: 'blur(20px)',
          animation: 'fadeInTimeline 800ms ease-out forwards'
        }}
      />
    </>
  );
});

MainTimeline.displayName = 'MainTimeline';

export default MainTimeline;