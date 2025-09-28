/**
 * @fileoverview 우측 패널 - 상세 정보 및 빠른 액션
 * @description 선택된 피드의 상세 정보와 프로젝트 요약 정보를 표시
 * @author PocketCompany
 * @since 2025-01-20
 */

import React from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Download,
  Share,
  Eye,
  MessageCircle,
  Pin,
  MoreHorizontal,
  FileText,
  Users,
  TrendingUp,
  CheckSquare,
  Zap
} from 'lucide-react';
import type { Project } from '../../types/buildup.types';
import type { FeedItem, FeedType } from '../../types/timeline.types';
import { PHASE_INFO } from '../../utils/projectPhaseUtils';
import { formatRelativeTime } from '../../utils/feedUtils';

interface RightPanelProps {
  project: Project;
  selectedFeed?: FeedItem | null;
  onAction: (action: string, data?: any) => void;
}

// 피드 타입별 아이콘 매핑
const FEED_ICONS: Record<FeedType, React.ComponentType<any>> = {
  file: FileText,
  meeting: Calendar,
  comment: MessageCircle,
  progress: TrendingUp,
  todo: CheckSquare,
  team: Users
};

const RightPanel: React.FC<RightPanelProps> = ({
  project,
  selectedFeed,
  onAction
}) => {
  return (
    <div className="h-full flex flex-col space-y-6">
      {/* 프로젝트 요약 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">프로젝트 요약</h3>
        <div className="space-y-3">
          <div>
            <span className="text-sm text-gray-500">진행 단계</span>
            <p className="text-sm font-medium text-gray-900">
              {PHASE_INFO[project.phase || 'contract_pending'].label}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">시작일</span>
            <p className="text-sm font-medium text-gray-900">
              {new Date(project.timeline.start_date).toLocaleDateString('ko-KR')}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">종료일</span>
            <p className="text-sm font-medium text-gray-900">
              {new Date(project.timeline.end_date).toLocaleDateString('ko-KR')}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">파일 수</span>
            <p className="text-sm font-medium text-gray-900">{project.files.length}개</p>
          </div>
        </div>
      </div>

      {/* 선택된 피드 상세 정보 */}
      {selectedFeed ? (
        <FeedDetailPanel
          feed={selectedFeed}
          onAction={onAction}
        />
      ) : (
        /* 선택된 피드가 없을 때 */
        <div className="flex-1 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-gray-200 rounded-lg flex items-center justify-center mb-3">
              <Eye className="w-6 h-6 text-gray-400" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">상세 정보 패널</h4>
            <p className="text-xs text-gray-500">
              왼쪽 피드를 선택하면 상세 정보가 여기에 표시됩니다.
            </p>
          </div>
        </div>
      )}

      {/* 빠른 액션 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">빠른 액션</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium text-blue-700">
            <FileText className="w-4 h-4" />
            파일 업로드
          </button>
          <button className="flex items-center gap-2 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium text-green-700">
            <Calendar className="w-4 h-4" />
            미팅 예약
          </button>
          <button className="flex items-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-sm font-medium text-purple-700">
            <MessageCircle className="w-4 h-4" />
            댓글 작성
          </button>
          <button className="flex items-center gap-2 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-sm font-medium text-orange-700">
            <TrendingUp className="w-4 h-4" />
            진행률 업데이트
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 피드 상세 정보 패널
 */
interface FeedDetailPanelProps {
  feed: FeedItem;
  onAction: (action: string, data?: any) => void;
}

const FeedDetailPanel: React.FC<FeedDetailPanelProps> = ({
  feed,
  onAction
}) => {
  const IconComponent = FEED_ICONS[feed.type];

  // 피드 타입별 상세 정보 렌더링
  const renderDetailContent = () => {
    switch (feed.type) {
      case 'file':
        const fileData = feed.data as any;
        return (
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">파일 크기</span>
              <p className="text-sm font-medium text-gray-900">
                {(fileData.fileSize / 1024).toFixed(1)}KB
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">파일 형식</span>
              <p className="text-sm font-medium text-gray-900">{fileData.fileType}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">업로드한 사람</span>
              <p className="text-sm font-medium text-gray-900">{fileData.uploadedBy}</p>
            </div>
          </div>
        );

      case 'meeting':
        const meetingData = feed.data as any;
        return (
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">미팅 일시</span>
              <p className="text-sm font-medium text-gray-900">
                {new Date(meetingData.meetingDate).toLocaleString('ko-KR')}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">참석자</span>
              <p className="text-sm font-medium text-gray-900">
                {meetingData.participants?.map((p: any) => p.name).join(', ')}
              </p>
            </div>
            {meetingData.summary && (
              <div>
                <span className="text-sm text-gray-500">요약</span>
                <p className="text-sm font-medium text-gray-900">{meetingData.summary}</p>
              </div>
            )}
          </div>
        );

      case 'comment':
        const commentData = feed.data as any;
        return (
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">메시지</span>
              <p className="text-sm font-medium text-gray-900">{commentData.message}</p>
            </div>
            {commentData.mentions && commentData.mentions.length > 0 && (
              <div>
                <span className="text-sm text-gray-500">언급된 사용자</span>
                <p className="text-sm font-medium text-gray-900">
                  {commentData.mentions.join(', ')}
                </p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div>
            <span className="text-sm text-gray-500">설명</span>
            <p className="text-sm font-medium text-gray-900">
              {feed.description || '상세 정보가 없습니다.'}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${feed.type === 'file' ? 'bg-blue-50' :
              feed.type === 'meeting' ? 'bg-green-50' :
              feed.type === 'comment' ? 'bg-purple-50' :
              feed.type === 'progress' ? 'bg-orange-50' :
              feed.type === 'todo' ? 'bg-emerald-50' :
              'bg-indigo-50'}`}>
              <IconComponent className={`w-4 h-4 ${feed.type === 'file' ? 'text-blue-600' :
                feed.type === 'meeting' ? 'text-green-600' :
                feed.type === 'comment' ? 'text-purple-600' :
                feed.type === 'progress' ? 'text-orange-600' :
                feed.type === 'todo' ? 'text-emerald-600' :
                'text-indigo-600'}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">{feed.title}</h3>
              <p className="text-xs text-gray-500">
                {formatRelativeTime(feed.timestamp)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* 네비게이션 */}
            <button
              onClick={() => onAction('prev_feed')}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => onAction('next_feed')}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            {/* 닫기 */}
            <button
              onClick={() => onAction('close')}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* 메타 정보 */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {feed.author && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {feed.author.name}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {feed.stageId && PHASE_INFO[feed.stageId]?.label}
          </span>
          {feed.pinned && (
            <span className="flex items-center gap-1 text-blue-600">
              <Pin className="w-3 h-3" />
              고정됨
            </span>
          )}
        </div>
      </div>

      {/* 상세 내용 */}
      <div className="p-6">
        {renderDetailContent()}
      </div>

      {/* 액션 버튼들 */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onAction('download')}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
          >
            <Download className="w-3 h-3" />
            다운로드
          </button>
          <button
            onClick={() => onAction('share')}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
          >
            <Share className="w-3 h-3" />
            공유
          </button>
          <button
            onClick={() => onAction('pin')}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
          >
            <Pin className="w-3 h-3" />
            {feed.pinned ? '고정 해제' : '고정'}
          </button>
          <button
            onClick={() => onAction('more')}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
          >
            <MoreHorizontal className="w-3 h-3" />
            더보기
          </button>
        </div>
      </div>
    </div>
  );
};

export default RightPanel;