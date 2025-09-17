import React from 'react';
import { X, ExternalLink, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import type { Notification } from '../../types/notifications';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface NotificationItemProps {
  notification: Notification;
  onRemove?: () => void;
  onClose?: () => void;
  showActions?: boolean;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRemove,
  onClose,
  showActions = true
}) => {
  const { markAsRead, dismissNotification } = useNotifications();

  const handleClick = () => {
    if (notification.status === 'unread') {
      markAsRead(notification.id);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissNotification(notification.id);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  // 우선순위에 따른 스타일링
  const getPriorityStyles = () => {
    switch (notification.priority) {
      case 'urgent':
        return {
          border: 'border-l-4 border-red-500',
          bg: notification.status === 'unread' ? 'bg-red-50' : 'bg-white',
          dot: 'bg-red-500'
        };
      case 'high':
        return {
          border: 'border-l-4 border-orange-500',
          bg: notification.status === 'unread' ? 'bg-orange-50' : 'bg-white',
          dot: 'bg-orange-500'
        };
      case 'medium':
        return {
          border: 'border-l-4 border-blue-500',
          bg: notification.status === 'unread' ? 'bg-blue-50' : 'bg-white',
          dot: 'bg-blue-500'
        };
      default:
        return {
          border: 'border-l-4 border-gray-300',
          bg: notification.status === 'unread' ? 'bg-gray-50' : 'bg-white',
          dot: 'bg-gray-400'
        };
    }
  };

  const styles = getPriorityStyles();
  const timeAgo = formatDistanceToNow(notification.timestamp, { 
    addSuffix: true, 
    locale: ko 
  });

  const content = (
    <div
      className={`p-4 ${styles.border} ${styles.bg} hover:bg-gray-50 transition-colors cursor-pointer`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* 아이콘 및 상태 점 */}
        <div className="relative flex-shrink-0 mt-1">
          {notification.icon ? (
            <span className="text-lg">{notification.icon}</span>
          ) : (
            <div className={`w-2 h-2 rounded-full ${styles.dot}`} />
          )}
          {notification.status === 'unread' && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
          )}
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-medium text-gray-900 ${
                notification.status === 'unread' ? 'font-semibold' : ''
              }`}>
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {notification.message}
              </p>
            </div>
            
            {/* 액션 버튼 */}
            {showActions && (
              <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {notification.status !== 'dismissed' && (
                  <button
                    onClick={handleDismiss}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="숨기기"
                  >
                    <Clock className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={handleRemove}
                  className="p-1 text-gray-400 hover:text-red-600 rounded"
                  title="삭제"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* 메타정보 */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{timeAgo}</span>
              {notification.expiresAt && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    만료: {formatDistanceToNow(notification.expiresAt, { locale: ko })}
                  </span>
                </>
              )}
            </div>
            
            {/* 액션 버튼 */}
            {notification.actionUrl && notification.actionLabel && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose?.();
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 hover:underline"
              >
                {notification.actionLabel}
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // 액션 URL이 있으면 링크로 감싸기
  if (notification.actionUrl) {
    return (
      <Link 
        to={notification.actionUrl} 
        className="block group"
        onClick={() => {
          if (notification.status === 'unread') {
            markAsRead(notification.id);
          }
          onClose?.();
        }}
      >
        {content}
      </Link>
    );
  }

  return <div className="group">{content}</div>;
};