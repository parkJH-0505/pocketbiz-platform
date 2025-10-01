/**
 * @fileoverview ActivityDetailPanel - 활동 상세 정보 패널 (노드 위치 기준)
 * @description 노드 클릭 시 해당 위치에서 펼쳐지는 상세 정보 패널
 * @author PocketCompany
 * @since 2025-01-30 (Phase 6: Modal to Panel)
 */

import React, { useEffect, useRef } from 'react';
import type { BranchActivity } from '../../../types/timeline-v3.types';

// ==========================================================================
// Props 인터페이스
// ==========================================================================
interface ActivityDetailPanelProps {
  activity: BranchActivity | null;
  isOpen: boolean;
  onClose: () => void;
  nodeX: number; // 노드의 X 좌표
  nodeY: number; // 노드의 Y 좌표
}

// ==========================================================================
// ActivityDetailPanel 컴포넌트
// ==========================================================================
const ActivityDetailPanel: React.FC<ActivityDetailPanelProps> = ({
  activity,
  isOpen,
  onClose,
  nodeX,
  nodeY
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // 바깥 클릭 감지 - Hook은 항상 최상단에 위치
  useEffect(() => {
    if (!isOpen || !activity) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, activity, onClose]);

  // Early return: 패널이 닫혀있거나 activity가 없으면 null 반환
  if (!isOpen || !activity) return null;

  // ==========================================================================
  // 타입별 콘텐츠 렌더링
  // ==========================================================================
  const renderContent = () => {
    switch (activity.type) {
      case 'file':
        return (
          <div className="space-y-4">
            {/* 파일 미리보기 영역 */}
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-6xl">📄</span>
            </div>

            {/* 메타데이터 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">파일명</span>
                <span className="font-medium text-gray-700">{activity.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">업로드 시간</span>
                <span className="text-gray-700">{activity.timestamp.toLocaleString('ko-KR')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">파일 크기</span>
                <span className="text-gray-700">
                  {activity.metadata.file?.size
                    ? `${(activity.metadata.file.size / (1024 * 1024)).toFixed(1)} MB`
                    : '2.4 MB'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">업로더</span>
                <span className="text-gray-700">{activity.metadata.file?.uploader || '김대표'}</span>
              </div>
            </div>

            {/* 다운로드 버튼 */}
            <button className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              다운로드
            </button>
          </div>
        );

      case 'meeting':
        return (
          <div className="space-y-4">
            {/* 미팅 정보 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>📅</span>
                <span>{activity.timestamp.toLocaleString('ko-KR')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>📍</span>
                <span>{activity.metadata.meeting?.location || '회의실 A'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>⏰</span>
                <span>{activity.metadata.meeting?.duration || 120}분</span>
              </div>
            </div>

            {/* 참석자 */}
            <div>
              <div className="text-sm text-gray-500 mb-2">참석자</div>
              <div className="flex gap-2 items-center flex-wrap">
                {(activity.metadata.meeting?.participants || ['김대표', '이PM', '박개발']).map((name, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                      {name[0]}
                    </div>
                    <span className="text-xs text-gray-600">{name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 회의록 버튼 */}
            <button className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              회의록 보기
            </button>
          </div>
        );

      case 'comment':
        return (
          <div className="space-y-4">
            {/* 작성자 정보 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-sm font-medium text-purple-600">
                {activity.metadata.comment?.author ? activity.metadata.comment.author[0] : '이'}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">
                  {activity.metadata.comment?.author || '이PM'}
                </div>
                <div className="text-xs text-gray-500">{activity.timestamp.toLocaleString('ko-KR')}</div>
              </div>
            </div>

            {/* 댓글 내용 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                {activity.metadata.comment?.content || activity.title}
              </p>
            </div>

            {/* 관련 활동 */}
            {activity.metadata.comment?.relatedTo && (
              <div className="text-xs text-gray-500">
                <span className="text-gray-400">관련 활동:</span> {activity.metadata.comment.relatedTo}
              </div>
            )}

            {/* 답글 버튼 */}
            <button className="w-full py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
              답글 작성
            </button>
          </div>
        );

      case 'todo':
        return (
          <div className="space-y-4">
            {/* 체크박스 + 제목 */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={activity.metadata.todo?.status === 'completed'}
                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                readOnly
              />
              <span className="text-base font-medium text-gray-700">{activity.title}</span>
            </div>

            {/* 우선순위 + 상태 뱃지 */}
            <div className="flex gap-2">
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                activity.metadata.todo?.priority === 'high'
                  ? 'bg-orange-100 text-orange-600'
                  : activity.metadata.todo?.priority === 'medium'
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {activity.metadata.todo?.priority === 'high' ? 'High Priority'
                  : activity.metadata.todo?.priority === 'medium' ? 'Medium Priority'
                  : 'Low Priority'}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                activity.metadata.todo?.status === 'completed'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-blue-100 text-blue-600'
              }`}>
                {activity.metadata.todo?.status === 'completed' ? 'Completed' : 'In Progress'}
              </span>
            </div>

            {/* 상세 정보 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">담당자</span>
                <span className="text-gray-700">{activity.metadata.todo?.assignee || '박개발'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">생성일</span>
                <span className="text-gray-700">{activity.timestamp.toLocaleDateString('ko-KR')}</span>
              </div>
              {activity.metadata.todo?.completedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">완료일</span>
                  <span className="text-gray-700">
                    {activity.metadata.todo.completedAt.toLocaleDateString('ko-KR')}
                  </span>
                </div>
              )}
            </div>

            {/* 완료 처리 버튼 */}
            {activity.metadata.todo?.status !== 'completed' && (
              <button className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                완료 처리
              </button>
            )}
          </div>
        );

      default:
        return <p className="text-gray-400">알 수 없는 활동 타입</p>;
    }
  };

  return (
    <>
      {/* 패널 컨테이너 - 노드 위치에서 펼쳐짐 */}
      <div
        ref={panelRef}
        className="absolute bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-[10000]"
        style={{
          left: `${nodeX}px`,
          top: `${nodeY}px`,
          width: '400px',
          maxHeight: '500px',
          animation: 'expandPanel 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
          transformOrigin: 'top left'
        }}
      >
        {/* 헤더 */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <h3 className="text-base font-semibold truncate pr-2">{activity.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none transition-colors flex-shrink-0"
          >
            ×
          </button>
        </div>

        {/* 콘텐츠 영역 - 스크롤 가능 */}
        <div className="px-4 py-3 overflow-y-auto" style={{ maxHeight: '440px' }}>
          {renderContent()}
        </div>
      </div>

      {/* 애니메이션 CSS */}
      <style>{`
        @keyframes expandPanel {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
};

export default ActivityDetailPanel;
