import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Settings, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationItem } from './NotificationItem';
import type { NotificationType, NotificationPriority } from '../../types/notifications';

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | NotificationType | NotificationPriority>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    notifications,
    stats,
    hasUnreadNotifications,
    markAllAsRead,
    clearAllNotifications,
    removeNotification
  } = useNotifications();

  // 외부 클릭 처리
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 필터링된 알림 계산
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    return notification.type === filter || notification.priority === filter;
  }).slice(0, 20); // 최대 20개

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* 벨 버튼 */}
      <button
        onClick={toggleDropdown}
        className={`relative p-2 rounded-full transition-colors ${
          hasUnreadNotifications 
            ? 'text-primary-main hover:bg-primary-light' 
            : 'text-gray-500 hover:bg-gray-100'
        }`}
      >
        <Bell className="w-6 h-6" />
        {hasUnreadNotifications && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {stats.unread > 9 ? '9+' : stats.unread}
          </span>
        )}
      </button>

      {/* 드롭다운 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* 헤더 */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">알림</h3>
                <p className="text-sm text-gray-500">
                  전체 {stats.total}개 · 새로운 알림 {stats.unread}개
                </p>
              </div>
              <div className="flex items-center gap-2">
                {hasUnreadNotifications && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="모두 읽음 처리"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 필터 */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                전체 ({stats.total})
              </button>
              <button
                onClick={() => setFilter('urgent')}
                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                  filter === 'urgent'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                긴급 ({stats.byPriority.urgent || 0})
              </button>
              <button
                onClick={() => setFilter('kpi_milestone')}
                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                  filter === 'kpi_milestone'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                KPI ({stats.byType.kpi_milestone || 0})
              </button>
              <button
                onClick={() => setFilter('investment_match')}
                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                  filter === 'investment_match'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                투자 ({stats.byType.investment_match || 0})
              </button>
            </div>
          </div>

          {/* 알림 목록 */}
          <div className="max-h-80 overflow-y-auto">
            {filteredNotifications.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRemove={() => removeNotification(notification.id)}
                    onClose={() => setIsOpen(false)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  {filter === 'all' ? '알림이 없습니다' : `${filter} 알림이 없습니다`}
                </p>
              </div>
            )}
          </div>

          {/* 푸터 */}
          {stats.total > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <button
                  onClick={clearAllNotifications}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  모두 삭제
                </button>
                <Link
                  to="/startup/notifications"
                  onClick={() => setIsOpen(false)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  알림 센터 보기
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};