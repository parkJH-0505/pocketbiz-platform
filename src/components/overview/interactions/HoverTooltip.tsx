/**
 * @fileoverview Hover Tooltip - 활동 정보 툴팁
 * @description Layer 4: 호버 시 활동 상세 정보 표시 (Phase 7: 디자인 시스템 통합)
 * @author PocketCompany
 * @since 2025-01-30
 */

import React from 'react';
import type { BranchActivity } from '../../../types/timeline-v3.types';
import { TIMELINE_DESIGN_SYSTEM } from '../../../types/timeline-v3.types';

/**
 * HoverTooltip Props
 */
interface HoverTooltipProps {
  activity: BranchActivity | null;
  position: { x: number; y: number } | null;
}

/**
 * Hover Tooltip 컴포넌트 (Phase 7: 업그레이드)
 * - TIMELINE_DESIGN_SYSTEM 사용
 * - Glassmorphism 적용
 * - 타입별 색상 통일
 * - 더 풍부한 정보 표시
 */
const HoverTooltip: React.FC<HoverTooltipProps> = ({ activity, position }) => {
  if (!activity || !position) return null;

  const typeConfig = TIMELINE_DESIGN_SYSTEM.activityType[activity.type];

  // 타입별 메타데이터 렌더링
  const renderMetadata = () => {
    const { metadata } = activity;

    if (metadata?.file) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">파일 크기</span>
            <span className="font-semibold" style={{ color: typeConfig.main }}>
              {(metadata.file.size / 1024).toFixed(1)} KB
            </span>
          </div>
          {metadata.file.uploader && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">업로더</span>
              <span className="font-medium text-gray-700">{metadata.file.uploader}</span>
            </div>
          )}
          {metadata.file.format && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">형식</span>
              <span className="font-medium text-gray-700 uppercase">{metadata.file.format}</span>
            </div>
          )}
        </div>
      );
    }

    if (metadata?.meeting) {
      return (
        <div className="space-y-2">
          {metadata.meeting.participants && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">참석자</span>
              <span className="font-semibold" style={{ color: typeConfig.main }}>
                {metadata.meeting.participants.length}명
              </span>
            </div>
          )}
          {metadata.meeting.duration && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">소요 시간</span>
              <span className="font-medium text-gray-700">{metadata.meeting.duration}분</span>
            </div>
          )}
          {metadata.meeting.location && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">장소</span>
              <span className="font-medium text-gray-700">{metadata.meeting.location}</span>
            </div>
          )}
        </div>
      );
    }

    if (metadata?.comment) {
      return (
        <div className="space-y-2">
          {metadata.comment.author && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">작성자</span>
              <span className="font-medium text-gray-700">{metadata.comment.author}</span>
            </div>
          )}
          {metadata.comment.content && (
            <div className="mt-3 p-2 rounded text-xs italic text-gray-600 border-l-2"
                 style={{ borderColor: typeConfig.main, backgroundColor: typeConfig.light }}>
              "{metadata.comment.content.substring(0, 100)}
              {metadata.comment.content.length > 100 ? '...' : ''}"
            </div>
          )}
        </div>
      );
    }

    if (metadata?.todo) {
      return (
        <div className="space-y-2">
          {metadata.todo.assignee && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">담당자</span>
              <span className="font-medium text-gray-700">{metadata.todo.assignee}</span>
            </div>
          )}
          {metadata.todo.priority && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">우선순위</span>
              <span className={`font-semibold ${
                metadata.todo.priority === 'high' ? 'text-red-600' :
                metadata.todo.priority === 'medium' ? 'text-orange-600' :
                'text-gray-600'
              }`}>
                {metadata.todo.priority === 'high' ? 'High' :
                 metadata.todo.priority === 'medium' ? 'Medium' : 'Low'}
              </span>
            </div>
          )}
          {metadata.todo.status && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">상태</span>
              <span className="font-semibold" style={{
                color: metadata.todo.status === 'completed' ? '#10B981' : typeConfig.main
              }}>
                {metadata.todo.status === 'completed' ? '완료 ✓' : '진행중 →'}
              </span>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  // 툴팁이 화면 밖으로 나가지 않도록 위치 조정
  const TOOLTIP_WIDTH = 320;
  const TOOLTIP_OFFSET_X = 16;
  const TOOLTIP_OFFSET_Y = -80;

  const adjustedX = Math.min(
    position.x + TOOLTIP_OFFSET_X,
    window.innerWidth - TOOLTIP_WIDTH - 20
  );
  const adjustedY = Math.max(position.y + TOOLTIP_OFFSET_Y, 10);

  return (
    <div
      className="fixed pointer-events-none"
      style={{
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
        animation: 'tooltipFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 9999
      }}
    >
      {/* Glassmorphism 카드 */}
      <div
        className="rounded-lg shadow-2xl p-4"
        style={{
          width: `${TOOLTIP_WIDTH}px`,
          maxWidth: '90vw',
          background: TIMELINE_DESIGN_SYSTEM.dataScience.glassEffect.background,
          backdropFilter: TIMELINE_DESIGN_SYSTEM.dataScience.glassEffect.backdropFilter,
          WebkitBackdropFilter: TIMELINE_DESIGN_SYSTEM.dataScience.glassEffect.WebkitBackdropFilter,
          border: `1.5px solid ${typeConfig.main}40`, // 25% opacity
          boxShadow: `0 8px 32px ${typeConfig.main}15, 0 0 0 1px ${typeConfig.main}10`
        }}
      >
        {/* 헤더 */}
        <div className="flex items-start gap-3 mb-3 pb-3"
             style={{ borderBottom: `1px solid ${typeConfig.main}20` }}>
          {/* 아이콘 */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg"
            style={{
              background: typeConfig.light,
              border: `1px solid ${typeConfig.main}30`
            }}
          >
            {typeConfig.icon}
          </div>

          {/* 제목 + 시간 */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gray-800 truncate mb-1">
              {activity.title}
            </div>
            <div className="text-xs font-medium" style={{ color: typeConfig.main }}>
              {activity.timestamp.toLocaleString('ko-KR', {
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>

        {/* 메타데이터 */}
        {renderMetadata()}

        {/* 힌트 */}
        <div
          className="mt-3 pt-3 text-xs text-center font-medium"
          style={{
            borderTop: `1px solid ${typeConfig.main}15`,
            color: typeConfig.main
          }}
        >
          클릭하면 상세 정보 표시 →
        </div>
      </div>

      {/* 애니메이션 */}
      <style>{`
        @keyframes tooltipFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default HoverTooltip;
