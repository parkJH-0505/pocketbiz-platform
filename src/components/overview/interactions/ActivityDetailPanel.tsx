/**
 * @fileoverview ActivityDetailPanel - 활동 상세 정보 Accordion 패널
 * @description 노드 클릭 시 노드 위치에서 펼쳐지는 Accordion 스타일 패널
 * @author PocketCompany
 * @since 2025-01-30
 */

import React, { useEffect, useRef } from 'react';
import type { BranchActivity } from '../../../types/timeline-v3.types';
import { TIMELINE_DESIGN_SYSTEM } from '../../../types/timeline-v3.types';

// ==========================================================================
// Props 인터페이스
// ==========================================================================
interface ActivityDetailPanelProps {
  activity: BranchActivity | null;
  isOpen: boolean;
  onClose: () => void;
  nodeX: number; // 노드의 X 좌표 (SVG 기준)
  nodeY: number; // 노드의 Y 좌표 (SVG 기준, displayY)
}

// ==========================================================================
// ActivityDetailPanel 컴포넌트 (Accordion 스타일)
// ==========================================================================
const ActivityDetailPanel: React.FC<ActivityDetailPanelProps> = ({
  activity,
  isOpen,
  onClose,
  nodeX,
  nodeY
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen || !activity) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, activity, onClose]);

  // Early return: 패널이 닫혀있거나 activity가 없으면 null 반환
  if (!isOpen || !activity) return null;

  const typeConfig = TIMELINE_DESIGN_SYSTEM.activityType[activity.type];

  // ==========================================================================
  // 타입별 콘텐츠 렌더링
  // ==========================================================================
  const renderContent = () => {
    switch (activity.type) {
      case 'file':
        return (
          <div className="space-y-3">
            {/* 파일 미리보기 영역 */}
            <div className="aspect-video rounded-lg flex items-center justify-center"
                 style={{
                   background: `linear-gradient(135deg, ${typeConfig.light}, ${typeConfig.main}10)`,
                   border: `1px solid ${typeConfig.main}20`
                 }}>
              <span className="text-6xl">{typeConfig.icon}</span>
            </div>

            {/* 메타데이터 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs py-1.5 border-b border-gray-200">
                <span className="text-gray-600 font-semibold">파일명</span>
                <span className="font-bold text-gray-900 text-right truncate ml-2">{activity.title}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1.5 border-b border-gray-200">
                <span className="text-gray-600 font-semibold">업로드</span>
                <span className="text-gray-900 font-medium">{activity.timestamp.toLocaleDateString('ko-KR')}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1.5 border-b border-gray-200">
                <span className="text-gray-600 font-semibold">크기</span>
                <span className="font-bold" style={{ color: typeConfig.main }}>
                  {activity.metadata.file?.size
                    ? `${(activity.metadata.file.size / (1024 * 1024)).toFixed(2)} MB`
                    : '2.4 MB'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs py-1.5">
                <span className="text-gray-600 font-semibold">업로더</span>
                <span className="text-gray-900 font-medium">{activity.metadata.file?.uploader || '김대표'}</span>
              </div>
            </div>

            {/* 다운로드 버튼 */}
            <button
              className="w-full py-2.5 rounded-lg font-semibold text-white text-sm transition-all"
              style={{
                background: `linear-gradient(135deg, ${typeConfig.main}, ${typeConfig.main}dd)`,
                boxShadow: `0 2px 8px ${typeConfig.main}30`
              }}
            >
              📥 다운로드
            </button>
          </div>
        );

      case 'meeting':
        return (
          <div className="space-y-3">
            {/* 미팅 헤더 카드 */}
            <div className="rounded-lg p-3"
                 style={{
                   background: `linear-gradient(135deg, ${typeConfig.light}, ${typeConfig.main}08)`,
                   border: `1px solid ${typeConfig.main}20`
                 }}>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-lg">{typeConfig.icon}</span>
                  <div>
                    <div className="font-bold text-gray-900 text-xs">{activity.timestamp.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}</div>
                    <div className="text-xs text-gray-700 font-medium">{activity.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-900 font-medium">
                  <span>📍</span>
                  <span>{activity.metadata.meeting?.location || '회의실 A'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold" style={{ color: typeConfig.main }}>
                  <span>⏰</span>
                  <span>{activity.metadata.meeting?.duration || 120}분</span>
                </div>
              </div>
            </div>

            {/* 참석자 */}
            <div>
              <div className="text-xs font-bold text-gray-900 mb-2">참석자</div>
              <div className="flex gap-2 items-center flex-wrap">
                {(activity.metadata.meeting?.participants || ['김대표', '이PM', '박개발']).map((name, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                         style={{
                           background: `linear-gradient(135deg, ${typeConfig.main}, ${typeConfig.main}cc)`,
                           boxShadow: `0 1px 4px ${typeConfig.main}30`
                         }}>
                      {name[0]}
                    </div>
                    <span className="text-xs text-gray-900 font-medium">{name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 회의록 버튼 */}
            <button
              className="w-full py-2.5 rounded-lg font-semibold text-white text-sm transition-all"
              style={{
                background: `linear-gradient(135deg, ${typeConfig.main}, ${typeConfig.main}dd)`,
                boxShadow: `0 2px 8px ${typeConfig.main}30`
              }}
            >
              📋 회의록 보기
            </button>
          </div>
        );

      case 'comment':
        return (
          <div className="space-y-3">
            {/* 작성자 카드 */}
            <div className="flex items-center gap-2 p-2.5 rounded-lg"
                 style={{
                   background: typeConfig.light,
                   border: `1px solid ${typeConfig.main}20`
                 }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                   style={{
                     background: `linear-gradient(135deg, ${typeConfig.main}, ${typeConfig.main}cc)`
                   }}>
                {activity.metadata.comment?.author ? activity.metadata.comment.author[0] : '이'}
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">
                  {activity.metadata.comment?.author || '이PM'}
                </div>
                <div className="text-xs font-bold" style={{ color: typeConfig.main }}>
                  {activity.timestamp.toLocaleDateString('ko-KR')}
                </div>
              </div>
            </div>

            {/* 댓글 내용 */}
            <div className="p-3 rounded-lg border-l-3"
                 style={{
                   background: `${typeConfig.main}08`,
                   borderLeft: `3px solid ${typeConfig.main}`
                 }}>
              <p className="text-xs text-gray-900 leading-relaxed font-medium">
                {activity.metadata.comment?.content || activity.title}
              </p>
            </div>

            {/* 답글 버튼 */}
            <button
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all"
              style={{
                background: typeConfig.light,
                color: typeConfig.main,
                border: `1.5px solid ${typeConfig.main}`
              }}
            >
              💬 답글 작성
            </button>
          </div>
        );

      case 'todo':
        return (
          <div className="space-y-3">
            {/* 체크박스 + 제목 카드 */}
            <div className="flex items-center gap-2 p-3 rounded-lg"
                 style={{
                   background: `linear-gradient(135deg, ${typeConfig.light}, ${typeConfig.main}08)`,
                   border: `1px solid ${typeConfig.main}20`
                 }}>
              <input
                type="checkbox"
                checked={activity.metadata.todo?.status === 'completed'}
                className="w-5 h-5 rounded border-2"
                style={{
                  borderColor: typeConfig.main,
                  accentColor: typeConfig.main
                }}
                readOnly
              />
              <span className="text-sm font-bold text-gray-900 flex-1">{activity.title}</span>
            </div>

            {/* 우선순위 + 상태 뱃지 */}
            <div className="flex gap-2 flex-wrap">
              <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                activity.metadata.todo?.priority === 'high'
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : activity.metadata.todo?.priority === 'medium'
                  ? 'bg-orange-100 text-orange-700 border border-orange-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }`}>
                {activity.metadata.todo?.priority === 'high' ? '🔴 High'
                  : activity.metadata.todo?.priority === 'medium' ? '🟡 Mid'
                  : '⚪ Low'}
              </span>
              <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                activity.metadata.todo?.status === 'completed'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'text-white border'
              }`}
              style={{
                background: activity.metadata.todo?.status === 'completed' ? undefined : typeConfig.main,
                borderColor: activity.metadata.todo?.status === 'completed' ? undefined : typeConfig.main
              }}>
                {activity.metadata.todo?.status === 'completed' ? '✓ Done' : '→ Progress'}
              </span>
            </div>

            {/* 상세 정보 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs py-1.5 border-b border-gray-200">
                <span className="text-gray-600 font-semibold">담당자</span>
                <span className="font-bold text-gray-900">{activity.metadata.todo?.assignee || '박개발'}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1.5">
                <span className="text-gray-600 font-semibold">생성일</span>
                <span className="text-gray-900 font-medium">{activity.timestamp.toLocaleDateString('ko-KR')}</span>
              </div>
            </div>

            {/* 완료 처리 버튼 */}
            {activity.metadata.todo?.status !== 'completed' && (
              <button
                className="w-full py-2.5 rounded-lg font-semibold text-white text-sm transition-all"
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                }}
              >
                ✓ 완료 처리
              </button>
            )}
          </div>
        );

      default:
        return <p className="text-gray-400 text-xs">알 수 없는 활동 타입</p>;
    }
  };

  // 패널 위치 계산 (노드 오른쪽)
  const PANEL_WIDTH = 360;
  const NODE_RADIUS = 12; // 노드 크기
  const CONNECTION_LINE_LENGTH = 20;
  const PANEL_OFFSET_X = NODE_RADIUS + CONNECTION_LINE_LENGTH;

  const panelX = nodeX + PANEL_OFFSET_X;
  const panelY = nodeY - 20; // 노드보다 약간 위에서 시작

  return (
    <>
      {/* 연결선 (노드 → 패널) */}
      <svg
        className="absolute pointer-events-none"
        style={{
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          zIndex: 10000,
          overflow: 'visible'
        }}
      >
        <line
          x1={nodeX + NODE_RADIUS}
          y1={nodeY}
          x2={panelX}
          y2={nodeY}
          stroke={typeConfig.main}
          strokeWidth={2}
          strokeDasharray="4,4"
          style={{
            animation: 'dashAnimation 0.5s linear infinite'
          }}
        />
      </svg>

      {/* Accordion 패널 */}
      <div
        ref={panelRef}
        className="absolute rounded-xl shadow-2xl overflow-hidden"
        style={{
          left: `${panelX}px`,
          top: `${panelY}px`,
          width: isOpen ? `${PANEL_WIDTH}px` : '0px',
          maxHeight: '500px',
          zIndex: 10001,
          background: 'rgba(255, 255, 255, 0.98)', // 거의 불투명한 흰색
          backdropFilter: 'blur(8px)', // blur 줄임
          WebkitBackdropFilter: 'blur(8px)',
          border: `1.5px solid ${typeConfig.main}40`,
          boxShadow: `0 12px 40px ${typeConfig.main}20, 0 0 0 1px ${typeConfig.main}15`,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
          opacity: isOpen ? 1 : 0,
          transformOrigin: 'left center'
        }}
      >
        {/* 헤더 */}
        <div className="px-4 py-3 flex items-center justify-between"
             style={{
               background: `linear-gradient(135deg, ${typeConfig.main}18, ${typeConfig.main}0a)`,
               borderBottom: `1.5px solid ${typeConfig.main}30`
             }}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                 style={{
                   background: typeConfig.light,
                   border: `1.5px solid ${typeConfig.main}40`
                 }}>
              {typeConfig.icon}
            </div>
            <h3 className="text-sm font-extrabold truncate" style={{ color: typeConfig.main }}>
              {activity.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-all text-lg font-bold"
          >
            ×
          </button>
        </div>

        {/* 콘텐츠 영역 - 스크롤 가능 */}
        <div className="px-4 py-3 overflow-y-auto" style={{ maxHeight: '420px' }}>
          {renderContent()}
        </div>
      </div>

      {/* 애니메이션 CSS */}
      <style>{`
        @keyframes dashAnimation {
          to {
            stroke-dashoffset: -8;
          }
        }
      `}</style>
    </>
  );
};

export default ActivityDetailPanel;
