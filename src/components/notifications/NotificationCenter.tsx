import React, { useState } from 'react';
import { Bell, Filter, Search, Settings, Trash2, CheckCheck, Download } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../common/Card';
import { Button } from '../common/Button';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationItem } from './NotificationItem';
import type { NotificationType, NotificationPriority } from '../../types/notifications';

interface NotificationCenterProps {
  onClose?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => {
  const [filter, setFilter] = useState<'all' | 'unread' | NotificationType | NotificationPriority>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  const {
    notifications,
    stats,
    preferences,
    markAllAsRead,
    clearAllNotifications,
    removeNotification,
    updatePreferences
  } = useNotifications();

  // 필터링 및 검색
  const filteredNotifications = notifications.filter(notification => {
    // 필터 적용
    if (filter === 'unread' && notification.status !== 'unread') return false;
    if (filter !== 'all' && filter !== 'unread') {
      if (notification.type !== filter && notification.priority !== filter) return false;
    }
    
    // 검색 적용
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return notification.title.toLowerCase().includes(searchLower) ||
             notification.message.toLowerCase().includes(searchLower);
    }
    
    return true;
  });

  // 필터 옵션
  const filterOptions = [
    { value: 'all', label: '전체', count: stats.total },
    { value: 'unread', label: '새로운 알림', count: stats.unread },
    { value: 'urgent', label: '긴급', count: stats.byPriority.urgent || 0 },
    { value: 'high', label: '높음', count: stats.byPriority.high || 0 },
    { value: 'kpi_milestone', label: 'KPI', count: stats.byType.kpi_milestone || 0 },
    { value: 'investment_match', label: '투자', count: stats.byType.investment_match || 0 },
    { value: 'program_deadline', label: '마감일', count: stats.byType.program_deadline || 0 },
    { value: 'achievement', label: '성취', count: stats.byType.achievement || 0 }
  ];

  // 환경설정 옵션
  const preferenceOptions = [
    { key: 'kpi_milestone', label: 'KPI 마일스톤 알림' },
    { key: 'investment_match', label: '투자 매칭 알림' },
    { key: 'program_deadline', label: '프로그램 마감일 알림' },
    { key: 'team_update', label: '팀 업데이트 알림' },
    { key: 'achievement', label: '성취 알림' },
    { key: 'alert', label: '경고 알림' },
    { key: 'reminder', label: '리마인더 알림' }
  ];

  const exportNotifications = () => {
    const data = notifications.map(n => ({
      제목: n.title,
      내용: n.message,
      타입: n.type,
      우선순위: n.priority,
      상태: n.status,
      시간: n.timestamp.toISOString()
    }));
    
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `notifications_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-primary-main" />
              <div>
                <h2 className="text-xl font-bold text-neutral-dark">알림 센터</h2>
                <p className="text-sm text-neutral-gray">
                  전체 {stats.total}개 · 새로운 {stats.unread}개
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="small"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4" />
                설정
              </Button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardBody className="flex-1 overflow-hidden">
          <div className="grid grid-cols-12 gap-6 h-full">
            {/* 왼쪽: 필터 및 설정 */}
            <div className="col-span-3 space-y-4 overflow-y-auto">
              {/* 검색 */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="알림 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              {/* 필터 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">필터</h3>
                <div className="space-y-1">
                  {filterOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFilter(option.value as any)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        filter === option.value
                          ? 'bg-primary-light text-primary-main'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span>{option.label}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        filter === option.value
                          ? 'bg-primary-main text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {option.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 설정 패널 */}
              {showSettings && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">알림 설정</h3>
                  <div className="space-y-2">
                    {preferenceOptions.map(option => (
                      <label key={option.key} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{option.label}</span>
                        <input
                          type="checkbox"
                          checked={preferences[option.key as keyof typeof preferences]}
                          onChange={(e) => updatePreferences({
                            [option.key]: e.target.checked
                          })}
                          className="rounded border-gray-300"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="space-y-2 pt-4 border-t">
                {stats.unread > 0 && (
                  <Button
                    variant="secondary"
                    size="small"
                    fullWidth
                    onClick={markAllAsRead}
                  >
                    <CheckCheck className="w-4 h-4" />
                    모두 읽음
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="small"
                  fullWidth
                  onClick={exportNotifications}
                >
                  <Download className="w-4 h-4" />
                  내보내기
                </Button>
                {stats.total > 0 && (
                  <Button
                    variant="danger"
                    size="small"
                    fullWidth
                    onClick={clearAllNotifications}
                  >
                    <Trash2 className="w-4 h-4" />
                    모두 삭제
                  </Button>
                )}
              </div>
            </div>

            {/* 오른쪽: 알림 목록 */}
            <div className="col-span-9 flex flex-col h-full">
              <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg">
                {filteredNotifications.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredNotifications.map(notification => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onRemove={() => removeNotification(notification.id)}
                        showActions={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {searchTerm || filter !== 'all' 
                          ? '조건에 맞는 알림이 없습니다'
                          : '알림이 없습니다'
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 하단 정보 */}
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    {filteredNotifications.length}개 표시 · 전체 {stats.total}개
                  </span>
                  <span>
                    새로운 알림 {stats.unread}개
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};