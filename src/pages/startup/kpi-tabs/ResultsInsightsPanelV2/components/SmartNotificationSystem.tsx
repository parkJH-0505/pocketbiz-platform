/**
 * SmartNotificationSystem Component
 * 지능형 알림 시스템 - 컨텍스트 기반 알림 관리
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  Settings,
  Brain
} from 'lucide-react';
import { useSmartNotifications, type SmartNotification } from '../hooks/useSmartNotifications';

export const SmartNotificationSystem: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState<'all' | SmartNotification['priority']>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | SmartNotification['category']>('all');

  const {
    notifications,
    settings,
    stats,
    markAsRead,
    markAllAsRead,
    pinNotification,
    dismissNotification,
    clearAllNotifications,
    setSettings
  } = useSmartNotifications();


  // 필터링된 알림
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      if (filter !== 'all' && notification.priority !== filter) return false;
      if (categoryFilter !== 'all' && notification.category !== categoryFilter) return false;
      return true;
    });
  }, [notifications, filter, categoryFilter]);

  // 알림 아이콘
  const getNotificationIcon = (type: SmartNotification['type']) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return AlertTriangle;
      case 'info': return Info;
      case 'insight': return Brain;
      default: return Info;
    }
  };

  // 알림 색상
  const getNotificationColor = (type: SmartNotification['type'], priority: SmartNotification['priority']) => {
    const baseColors = {
      success: 'green',
      warning: 'yellow',
      error: 'red',
      info: 'blue',
      insight: 'purple'
    };

    const intensities = {
      low: '100',
      medium: '200',
      high: '400',
      critical: '600'
    };

    return `bg-${baseColors[type]}-${intensities[priority]} text-${baseColors[type]}-800 border-${baseColors[type]}-300`;
  };

  const unreadCount = stats.unread;

  return (
    <>
      {/* 알림 버튼 */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`relative p-3 rounded-lg transition-all duration-200 ${
          unreadCount > 0
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {settings.enabled ? <Bell size={20} /> : <BellOff size={20} />}

        {/* 알림 카운트 배지 */}
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
      </button>

      {/* 알림 패널 */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden"
          >
            {/* 헤더 */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">알림</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Settings size={16} className="text-gray-500" />
                  </button>
                  <button
                    onClick={() => setIsVisible(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>
              </div>

              {/* 필터 및 액션 */}
              <div className="flex items-center gap-2 mt-3">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">모든 우선순위</option>
                  <option value="critical">위급</option>
                  <option value="high">높음</option>
                  <option value="medium">보통</option>
                  <option value="low">낮음</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as any)}
                  className="text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">모든 카테고리</option>
                  <option value="performance">성과</option>
                  <option value="goal">목표</option>
                  <option value="anomaly">이상</option>
                  <option value="opportunity">기회</option>
                  <option value="system">시스템</option>
                </select>

                <div className="ml-auto flex gap-1">
                  <button
                    onClick={markAllAsRead}
                    className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    모두 읽음
                  </button>
                  <button
                    onClick={clearAllNotifications}
                    className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-50 rounded"
                  >
                    지우기
                  </button>
                </div>
              </div>
            </div>

            {/* 알림 목록 */}
            <div className="max-h-80 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell size={32} className="mx-auto mb-2 opacity-50" />
                  <p>새로운 알림이 없습니다</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  <AnimatePresence>
                    {filteredNotifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.type);
                      return (
                        <motion.div
                          key={notification.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={`p-4 hover:bg-gray-50 transition-colors ${
                            !notification.isRead ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${getNotificationColor(notification.type, notification.priority)}`}>
                              <Icon size={16} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm text-gray-900 truncate">
                                {notification.title}
                              </h4>
                              <p className="text-xs text-gray-600 mt-1">
                                {notification.message}
                              </p>

                              {/* 액션 버튼들 */}
                              {notification.actions && notification.actions.length > 0 && (
                                <div className="flex gap-2 mt-2">
                                  {notification.actions.map((action) => (
                                    <button
                                      key={action.id}
                                      onClick={action.handler}
                                      className={`text-xs px-2 py-1 rounded transition-colors ${
                                        action.type === 'primary'
                                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                                          : action.type === 'destructive'
                                          ? 'bg-red-600 text-white hover:bg-red-700'
                                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                      }`}
                                    >
                                      {action.label}
                                    </button>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-400">
                                  {new Date(notification.timestamp).toLocaleTimeString()}
                                </span>

                                <div className="flex items-center gap-1">
                                  {!notification.isRead && (
                                    <button
                                      onClick={() => markAsRead(notification.id)}
                                      className="text-xs text-blue-600 hover:text-blue-700"
                                    >
                                      읽음
                                    </button>
                                  )}
                                  <button
                                    onClick={() => pinNotification(notification.id)}
                                    className={`text-xs ${
                                      notification.isPinned ? 'text-yellow-600' : 'text-gray-400'
                                    } hover:text-yellow-600`}
                                  >
                                    📌
                                  </button>
                                  <button
                                    onClick={() => dismissNotification(notification.id)}
                                    className="text-xs text-gray-400 hover:text-red-600"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* 설정 패널 */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-100 p-4"
                >
                  <h4 className="font-medium text-sm text-gray-900 mb-3">알림 설정</h4>

                  <div className="space-y-3">
                    {/* 기본 설정 */}
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-gray-700">알림 활성화</label>
                      <button
                        onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                        className={`w-8 h-4 rounded-full transition-colors ${
                          settings.enabled ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                          settings.enabled ? 'translate-x-4' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-xs text-gray-700">사운드</label>
                      <button
                        onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                        className={`w-8 h-4 rounded-full transition-colors ${
                          settings.soundEnabled ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                          settings.soundEnabled ? 'translate-x-4' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>

                    {/* 최소 우선순위 */}
                    <div>
                      <label className="text-xs text-gray-700 block mb-1">최소 우선순위</label>
                      <select
                        value={settings.minimumPriority}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          minimumPriority: e.target.value as SmartNotification['priority']
                        }))}
                        className="w-full text-xs px-2 py-1 border border-gray-200 rounded"
                      >
                        <option value="low">낮음</option>
                        <option value="medium">보통</option>
                        <option value="high">높음</option>
                        <option value="critical">위급</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};