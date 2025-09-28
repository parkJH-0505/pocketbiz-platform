/**
 * @fileoverview 피드 카드 템플릿 시스템
 * @description 다양한 피드 타입에 대응하는 유연한 카드 컴포넌트
 * @author PocketCompany
 * @since 2025-01-20
 */

import React from 'react';
import {
  FileText,
  Calendar,
  MessageCircle,
  TrendingUp,
  CheckSquare,
  Users,
  ChevronDown,
  ChevronRight,
  Pin,
  MoreHorizontal,
  Download,
  Share,
  Eye,
  Clock,
  User
} from 'lucide-react';
import type { FeedCardProps, FeedType, FeedTemplate } from '../../types/timeline.types';

// 피드 타입별 템플릿 설정
const FEED_TEMPLATES: Record<FeedType, FeedTemplate> = {
  file: {
    type: 'file',
    icon: 'FileText',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    collapsedFields: ['fileName', 'fileSize', 'uploadedBy'],
    expandedFields: ['fileName', 'fileSize', 'uploadedBy', 'uploadedAt', 'fileType'],
    actions: ['view', 'download', 'share', 'pin'],
    maxContentLength: 50
  },
  meeting: {
    type: 'meeting',
    icon: 'Calendar',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    collapsedFields: ['meetingTitle', 'meetingDate', 'participants'],
    expandedFields: ['meetingTitle', 'meetingDate', 'participants', 'summary', 'nextSteps'],
    actions: ['view', 'edit', 'share', 'pin'],
    maxContentLength: 100
  },
  comment: {
    type: 'comment',
    icon: 'MessageCircle',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    collapsedFields: ['message', 'author'],
    expandedFields: ['message', 'author', 'timestamp', 'mentions'],
    actions: ['view', 'reply', 'pin'],
    maxContentLength: 80
  },
  progress: {
    type: 'progress',
    icon: 'TrendingUp',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    collapsedFields: ['previousProgress', 'currentProgress', 'updatedBy'],
    expandedFields: ['previousProgress', 'currentProgress', 'previousPhase', 'currentPhase', 'updatedBy', 'changeReason'],
    actions: ['view', 'pin'],
    maxContentLength: 60
  },
  todo: {
    type: 'todo',
    icon: 'CheckSquare',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    collapsedFields: ['taskTitle', 'completedBy'],
    expandedFields: ['taskTitle', 'taskDescription', 'completedBy', 'completedAt', 'taskCategory'],
    actions: ['view', 'pin'],
    maxContentLength: 70
  },
  team: {
    type: 'team',
    icon: 'Users',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    collapsedFields: ['memberName', 'action'],
    expandedFields: ['memberName', 'action', 'details', 'activityType'],
    actions: ['view', 'pin'],
    maxContentLength: 60
  }
};

// 아이콘 컴포넌트 매핑
const ICONS: Record<string, React.ComponentType<any>> = {
  FileText,
  Calendar,
  MessageCircle,
  TrendingUp,
  CheckSquare,
  Users
};

const FeedCard: React.FC<FeedCardProps> = ({
  feed,
  expanded,
  onToggle,
  onAction,
  className = '',
  size = 'normal'
}) => {
  const template = FEED_TEMPLATES[feed.type];
  const IconComponent = ICONS[template.icon];

  // 우선순위에 따른 스타일
  const priorityStyles = {
    high: 'border-l-red-400 bg-red-50/30',
    medium: 'border-l-yellow-400 bg-yellow-50/30',
    low: 'border-l-gray-300 bg-gray-50/30'
  };

  // 상태에 따른 스타일
  const statusStyles = {
    active: 'opacity-100',
    completed: 'opacity-75',
    pending: 'opacity-60',
    cancelled: 'opacity-50'
  };

  // 크기에 따른 패딩 조정
  const sizeStyles = {
    compact: 'p-3',
    normal: 'p-4',
    detailed: 'p-6'
  };

  // 상대적 시간 계산
  const getRelativeTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
  };

  // 텍스트 자르기
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // 액션 버튼 핸들러
  const handleAction = (action: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onAction?.(action);
  };

  // 피드 타입별 콘텐츠 렌더링
  const renderContent = () => {
    switch (feed.type) {
      case 'file':
        const fileData = feed.data as any;
        return (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900 text-sm">
                {truncateText(fileData.fileName || feed.title, template.maxContentLength!)}
              </span>
              {fileData.fileSize && (
                <span className="text-xs text-gray-500">
                  ({(fileData.fileSize / 1024).toFixed(1)}KB)
                </span>
              )}
            </div>
            {expanded && fileData.fileType && (
              <p className="text-xs text-gray-600 mb-2">파일 형식: {fileData.fileType}</p>
            )}
          </div>
        );

      case 'meeting':
        const meetingData = feed.data as any;
        return (
          <div>
            <div className="font-medium text-gray-900 text-sm mb-1">
              {truncateText(meetingData.meetingTitle || feed.title, template.maxContentLength!)}
            </div>
            {expanded && meetingData.participants && (
              <p className="text-xs text-gray-600 mb-2">
                참석자: {meetingData.participants.slice(0, 3).map((p: any) => p.name).join(', ')}
                {meetingData.participants.length > 3 && ` 외 ${meetingData.participants.length - 3}명`}
              </p>
            )}
          </div>
        );

      case 'comment':
        const commentData = feed.data as any;
        return (
          <div>
            <p className="text-sm text-gray-900 mb-1">
              {truncateText(commentData.message || feed.description || '', template.maxContentLength!)}
            </p>
            {expanded && commentData.mentions && commentData.mentions.length > 0 && (
              <p className="text-xs text-blue-600">
                언급: {commentData.mentions.join(', ')}
              </p>
            )}
          </div>
        );

      default:
        return (
          <div>
            <div className="font-medium text-gray-900 text-sm mb-1">
              {truncateText(feed.title, template.maxContentLength!)}
            </div>
            {expanded && feed.description && (
              <p className="text-xs text-gray-600">{feed.description}</p>
            )}
          </div>
        );
    }
  };

  return (
    <div
      className={`
        relative border-l-4 transition-all duration-200 cursor-pointer
        ${priorityStyles[feed.priority]}
        ${statusStyles[feed.status]}
        ${sizeStyles[size]}
        ${className}
        hover:shadow-sm hover:bg-white/50
      `}
      onClick={onToggle}
    >
      {/* 상단: 기본 정보 */}
      <div className="flex items-start gap-3">
        {/* 아이콘 */}
        <div className={`p-2 rounded-lg ${template.bgColor} flex-shrink-0`}>
          <IconComponent className={`w-4 h-4 ${template.color}`} />
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 min-w-0">
          {renderContent()}

          {/* 메타 정보 */}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            {feed.author && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {feed.author.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getRelativeTime(feed.timestamp)}
            </span>
            {feed.pinned && (
              <Pin className="w-3 h-3 text-blue-500" />
            )}
          </div>
        </div>

        {/* 확장/축소 아이콘 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {template.actions.includes('pin') && (
            <button
              onClick={(e) => handleAction('pin', e)}
              className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Pin className="w-3 h-3 text-gray-400" />
            </button>
          )}

          <button className="p-1 hover:bg-gray-100 rounded">
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* 확장된 콘텐츠 */}
      {expanded && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          {/* 액션 버튼들 */}
          <div className="flex items-center gap-2">
            {template.actions.map((action) => {
              const actionConfig = {
                view: { icon: Eye, label: '보기' },
                download: { icon: Download, label: '다운로드' },
                share: { icon: Share, label: '공유' },
                edit: { icon: MoreHorizontal, label: '편집' },
                reply: { icon: MessageCircle, label: '답글' },
              };

              const config = actionConfig[action as keyof typeof actionConfig];
              if (!config) return null;

              const ActionIcon = config.icon;
              return (
                <button
                  key={action}
                  onClick={(e) => handleAction(action, e)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  <ActionIcon className="w-3 h-3" />
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 우선순위 표시 */}
      {feed.priority === 'high' && (
        <div className="absolute -top-1 -right-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default FeedCard;