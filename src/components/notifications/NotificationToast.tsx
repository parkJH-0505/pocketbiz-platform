import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Notification } from '../../types/notifications';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  duration?: number; // ms
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  duration = 5000,
  position = 'top-right'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // 시작 애니메이션
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // 자동 닫기
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // 애니메이션 시간
  };

  // 우선순위별 스타일
  const getPriorityStyles = () => {
    switch (notification.priority) {
      case 'urgent':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: AlertCircle,
          iconColor: 'text-red-500',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700'
        };
      case 'high':
        return {
          bg: 'bg-orange-50 border-orange-200',
          icon: AlertTriangle,
          iconColor: 'text-orange-500',
          titleColor: 'text-orange-800',
          messageColor: 'text-orange-700'
        };
      case 'medium':
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: Info,
          iconColor: 'text-blue-500',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700'
        };
      default:
        return {
          bg: 'bg-green-50 border-green-200',
          icon: CheckCircle,
          iconColor: 'text-green-500',
          titleColor: 'text-green-800',
          messageColor: 'text-green-700'
        };
    }
  };

  // 위치별 스타일
  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  // 애니메이션 스타일
  const getAnimationStyles = () => {
    const baseTransform = position.includes('right') ? 'translate-x-full' : '-translate-x-full';
    
    if (isExiting) {
      return `transform transition-transform duration-300 ease-in ${baseTransform} opacity-0`;
    }
    
    if (isVisible) {
      return 'transform transition-transform duration-300 ease-out translate-x-0 opacity-100';
    }
    
    return `transform ${baseTransform} opacity-0`;
  };

  const styles = getPriorityStyles();
  const IconComponent = notification.icon ? null : styles.icon;

  return (
    <div
      className={`fixed ${getPositionStyles()} z-50 w-96 max-w-sm`}
      role="alert"
      aria-live="polite"
    >
      <div
        className={`
          ${styles.bg} border rounded-lg shadow-lg p-4 
          ${getAnimationStyles()}
        `}
      >
        <div className="flex items-start gap-3">
          {/* 아이콘 */}
          <div className="flex-shrink-0 mt-0.5">
            {notification.icon ? (
              <span className="text-xl">{notification.icon}</span>
            ) : (
              IconComponent && <IconComponent className={`w-5 h-5 ${styles.iconColor}`} />
            )}
          </div>

          {/* 콘텐츠 */}
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium text-sm ${styles.titleColor}`}>
              {notification.title}
            </h4>
            <p className={`mt-1 text-sm ${styles.messageColor}`}>
              {notification.message}
            </p>
            
            {/* 액션 버튼 */}
            {notification.actionUrl && notification.actionLabel && (
              <div className="mt-3">
                <Link
                  to={notification.actionUrl}
                  onClick={handleClose}
                  className={`text-sm font-medium hover:underline ${
                    notification.priority === 'urgent' ? 'text-red-700' :
                    notification.priority === 'high' ? 'text-orange-700' :
                    notification.priority === 'medium' ? 'text-blue-700' :
                    'text-green-700'
                  }`}
                >
                  {notification.actionLabel} →
                </Link>
              </div>
            )}
          </div>

          {/* 닫기 버튼 */}
          <button
            onClick={handleClose}
            className={`flex-shrink-0 p-0.5 rounded hover:bg-black hover:bg-opacity-10 transition-colors ${
              styles.iconColor
            }`}
            aria-label="알림 닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* 진행바 (자동 닫기용) */}
        {duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-10 rounded-b-lg overflow-hidden">
            <div 
              className="h-full bg-current opacity-30 transition-all linear"
              style={{
                width: '100%',
                animationName: 'toast-progress',
                animationDuration: `${duration}ms`,
                animationTimingFunction: 'linear',
                animationFillMode: 'forwards'
              }}
            />
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

// 여러 토스트 관리를 위한 컴포넌트
interface NotificationToastContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
  maxToasts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const NotificationToastContainer: React.FC<NotificationToastContainerProps> = ({
  notifications,
  onRemove,
  maxToasts = 5,
  position = 'top-right'
}) => {
  // 최대 개수 제한
  const visibleNotifications = notifications.slice(0, maxToasts);

  return (
    <>
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            zIndex: 1000 - index // 위에서부터 쌓이기
          }}
        >
          <NotificationToast
            notification={notification}
            onClose={() => onRemove(notification.id)}
            position={position}
            duration={notification.priority === 'urgent' ? 10000 : 5000} // 긴급한 알림은 더 오래
          />
        </div>
      ))}
    </>
  );
};