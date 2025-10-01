/**
 * @fileoverview Hover Tooltip - 활동 정보 툴팁
 * @description Layer 4: 호버 시 활동 상세 정보 표시
 * @author PocketCompany
 * @since 2025-01-30
 */

import React from 'react';
import type { BranchActivity } from '../../../types/timeline-v3.types';
import { BRANCH_STYLES } from '../../../types/timeline-v3.types';

/**
 * HoverTooltip Props
 */
interface HoverTooltipProps {
  activity: BranchActivity | null;
  position: { x: number; y: number } | null;
}

/**
 * Hover Tooltip 컴포넌트
 * - 활동 노드 호버 시 상세 정보 표시
 * - 타입별 메타데이터 렌더링
 * - 화면 밖으로 나가지 않도록 위치 자동 조정
 */
const HoverTooltip: React.FC<HoverTooltipProps> = ({ activity, position }) => {
  if (!activity || !position) return null;

  const style = BRANCH_STYLES[activity.type];

  // 타입별 메타데이터 렌더링
  const renderMetadata = () => {
    const { metadata } = activity;

    if (metadata?.file) {
      return (
        <div className="text-xs text-gray-600 mt-2 space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">크기:</span>
            <span className="font-medium">{(metadata.file.size / 1024).toFixed(1)} KB</span>
          </div>
          {metadata.file.uploader && (
            <div className="flex justify-between">
              <span className="text-gray-500">업로더:</span>
              <span className="font-medium">{metadata.file.uploader}</span>
            </div>
          )}
          {metadata.file.format && (
            <div className="flex justify-between">
              <span className="text-gray-500">형식:</span>
              <span className="font-medium">{metadata.file.format}</span>
            </div>
          )}
        </div>
      );
    }

    if (metadata?.meeting) {
      return (
        <div className="text-xs text-gray-600 mt-2 space-y-1">
          {metadata.meeting.participants && (
            <div className="flex justify-between">
              <span className="text-gray-500">참석자:</span>
              <span className="font-medium">{metadata.meeting.participants.length}명</span>
            </div>
          )}
          {metadata.meeting.duration && (
            <div className="flex justify-between">
              <span className="text-gray-500">소요:</span>
              <span className="font-medium">{metadata.meeting.duration}분</span>
            </div>
          )}
          {metadata.meeting.location && (
            <div className="flex justify-between">
              <span className="text-gray-500">장소:</span>
              <span className="font-medium">{metadata.meeting.location}</span>
            </div>
          )}
        </div>
      );
    }

    if (metadata?.comment) {
      return (
        <div className="text-xs text-gray-600 mt-2 space-y-1">
          {metadata.comment.author && (
            <div className="flex justify-between">
              <span className="text-gray-500">작성자:</span>
              <span className="font-medium">{metadata.comment.author}</span>
            </div>
          )}
          {metadata.comment.content && (
            <div className="mt-2 italic text-gray-700 border-l-2 border-gray-300 pl-2">
              "{metadata.comment.content.substring(0, 80)}{metadata.comment.content.length > 80 ? '...' : ''}"
            </div>
          )}
        </div>
      );
    }

    if (metadata?.todo) {
      return (
        <div className="text-xs text-gray-600 mt-2 space-y-1">
          {metadata.todo.assignee && (
            <div className="flex justify-between">
              <span className="text-gray-500">담당자:</span>
              <span className="font-medium">{metadata.todo.assignee}</span>
            </div>
          )}
          {metadata.todo.priority && (
            <div className="flex justify-between">
              <span className="text-gray-500">우선순위:</span>
              <span className="font-medium">{metadata.todo.priority}</span>
            </div>
          )}
          {metadata.todo.status && (
            <div className="flex justify-between">
              <span className="text-gray-500">상태:</span>
              <span className="font-medium">
                {metadata.todo.status === 'completed' ? '완료 ✓' : '진행중'}
              </span>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  // 툴팁이 화면 밖으로 나가지 않도록 위치 조정
  const TOOLTIP_WIDTH = 280;
  const TOOLTIP_OFFSET_X = 12;
  const TOOLTIP_OFFSET_Y = -60;

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
        animation: 'fadeIn 0.2s ease-out',
        zIndex: 9999
      }}
    >
      <div
        className="bg-white rounded-lg shadow-2xl border-2 p-3"
        style={{
          borderColor: style.color,
          width: `${TOOLTIP_WIDTH}px`,
          maxWidth: '90vw',
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(255, 255, 255, 0.98)'
        }}
      >
        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-2 pb-2 border-b">
          <span className="text-lg">{style.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{activity.title}</div>
            <div className="text-xs text-gray-500">
              {activity.timestamp.toLocaleString('ko-KR', {
                month: 'short',
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
        <div className="mt-3 pt-2 border-t text-xs text-gray-400">
          클릭하면 상세 정보를 확인할 수 있습니다
        </div>
      </div>

      {/* 페이드인 애니메이션 */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default HoverTooltip;