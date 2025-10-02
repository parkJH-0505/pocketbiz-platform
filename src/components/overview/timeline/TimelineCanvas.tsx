/**
 * @fileoverview Timeline Canvas - SVG 전역 설정 및 레이아웃
 * @description Layer 2: SVG 캔버스, 그라디언트 정의, 필터 정의
 * @author PocketCompany
 * @since 2025-01-30
 */

import React from 'react';
import { BRANCH_STYLES } from '../../../types/timeline-v3.types';

/**
 * TimelineCanvas Props
 */
interface TimelineCanvasProps {
  width: string;
  height: number;
  children: React.ReactNode;
}

/**
 * Timeline Canvas 컴포넌트
 * - SVG 전역 설정 (defs, 그라디언트, 필터)
 * - 자식 컴포넌트 레이아웃 제공
 * - Phase 5-4: React.memo 최적화
 */
const TimelineCanvas: React.FC<TimelineCanvasProps> = React.memo(({
  width,
  height,
  children
}) => {
  return (
    <svg className="absolute inset-0 w-full h-full" width={width} height={height}>
      {/* ====================================================================
          SVG 전역 정의 (그라디언트, 필터)
      ==================================================================== */}
      <defs>
        {/* 메인 타임라인 그라디언트 */}
        <linearGradient id="timeline-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#3B82F6" stopOpacity="1" />
          <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.5" />
        </linearGradient>

        {/* 타입별 브랜치 그라디언트 */}
        {Object.entries(BRANCH_STYLES).map(([type, style]) => (
          <linearGradient key={type} id={`branch-${type}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={style.color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={style.colorEnd} stopOpacity="1" />
          </linearGradient>
        ))}

        {/* Phase 2 Step 4: 노드 그라디언트 (타입별) */}
        {Object.entries(BRANCH_STYLES).map(([type, style]) => (
          <radialGradient key={`node-${type}`} id={`node-${type}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={style.color} stopOpacity="1" />
            <stop offset="100%" stopColor={style.colorEnd} stopOpacity="0.9" />
          </radialGradient>
        ))}

        {/* Phase 5-3: Phase 노드 그라디언트 (완료 단계용) */}
        <radialGradient id="phase-completed" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="1" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="1" />
        </radialGradient>

        {/* Phase 7-4: Phase 구분선 그라디언트 (Visible.vc 스타일) */}
        <linearGradient id="phase-divider-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(15, 82, 222)" stopOpacity="0" />
          <stop offset="50%" stopColor="rgb(15, 82, 222)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="rgb(15, 82, 222)" stopOpacity="0" />
        </linearGradient>

        {/* Phase 7-5: MainTimeline 세로 그라디언트 (상단/하단 페이드) */}
        <linearGradient id="main-timeline-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgb(15, 82, 222)" stopOpacity="0.2" />
          <stop offset="10%" stopColor="rgb(15, 82, 222)" stopOpacity="0.9" />
          <stop offset="90%" stopColor="rgb(15, 82, 222)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="rgb(15, 82, 222)" stopOpacity="0.2" />
        </linearGradient>

        {/* Phase 7-5: Branch 가로 그라디언트 (시작→끝 투명도 증가) */}
        <linearGradient id="branch-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(15, 82, 222)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="rgb(15, 82, 222)" stopOpacity="0.9" />
        </linearGradient>

        {/* Phase 5-3: SVG 아이콘 정의 */}
        {/* 체크 마크 (Phase 완료) */}
        <symbol id="icon-check" viewBox="0 0 24 24">
          <path
            d="M20 6L9 17l-5-5"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </symbol>

        {/* 파일 아이콘 */}
        <symbol id="icon-file" viewBox="0 0 24 24">
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
            fill="currentColor"
            opacity="0.9"
          />
          <path
            d="M14 2v6h6"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </symbol>

        {/* 미팅/캘린더 아이콘 */}
        <symbol id="icon-meeting" viewBox="0 0 24 24">
          <rect
            x="3"
            y="4"
            width="18"
            height="18"
            rx="2"
            fill="currentColor"
            opacity="0.9"
          />
          <line x1="3" y1="9" x2="21" y2="9" stroke="white" strokeWidth="2" />
          <line x1="8" y1="2" x2="8" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="2" x2="16" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </symbol>

        {/* 댓글/말풍선 아이콘 */}
        <symbol id="icon-comment" viewBox="0 0 24 24">
          <path
            d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
            fill="currentColor"
            opacity="0.9"
          />
        </symbol>

        {/* TODO/체크박스 아이콘 */}
        <symbol id="icon-todo" viewBox="0 0 24 24">
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
            fill="currentColor"
            opacity="0.9"
          />
          <path
            d="M9 12l2 2 4-4"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </symbol>

        {/* Phase 2 Step 4: 글로우 필터 (호버 효과) */}
        <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Phase 2 Step 4: 드롭 섀도우 강화 */}
        <filter id="node-shadow-enhanced" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.4"/>
        </filter>

        {/* 기본 드롭 섀도우 (브랜치용) */}
        <filter id="drop-shadow-light" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
        </filter>
      </defs>

      {/* ====================================================================
          자식 컴포넌트 렌더링 영역
      ==================================================================== */}
      {children}
    </svg>
  );
});

TimelineCanvas.displayName = 'TimelineCanvas';

export default TimelineCanvas;