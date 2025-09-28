/**
 * Widget Wrapper Component
 * 모든 위젯을 감싸는 컨테이너 컴포넌트
 */

import React, { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Maximize2,
  Minimize2,
  RefreshCw,
  MoreVertical,
  X,
  Lock,
  Unlock
} from 'lucide-react';
import type { WidgetConfig } from '../grid/GridLayoutConfig';

interface WidgetWrapperProps {
  widget: WidgetConfig;
  children: React.ReactNode;
  isEditMode?: boolean;
  isLocked?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onSettings?: () => void;
  onRemove?: () => void;
  onToggleLock?: () => void;
  onFullscreen?: () => void;
  className?: string;
}

export const WidgetWrapper = memo<WidgetWrapperProps>(({
  widget,
  children,
  isEditMode = false,
  isLocked = false,
  isLoading = false,
  error = null,
  onRefresh,
  onSettings,
  onRemove,
  onToggleLock,
  onFullscreen,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // 새로고침 핸들러
  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  // 제거 핸들러 (애니메이션 포함)
  const handleRemove = useCallback(() => {
    if (onRemove) {
      setIsRemoving(true);
      setTimeout(() => {
        onRemove();
      }, 200);
    }
  }, [onRemove]);

  // 전체화면 토글
  const handleFullscreen = useCallback(() => {
    setIsExpanded(!isExpanded);
    if (onFullscreen) {
      onFullscreen();
    }
  }, [isExpanded, onFullscreen]);

  return (
    <AnimatePresence>
      {!isRemoving && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className={`widget-container ${isEditMode ? 'edit-mode' : ''} ${className}`}
        >
          {/* Widget Header */}
          <div className="widget-header">
            <div className="widget-header-title">
              {widget.icon && (
                <span className="widget-header-title-icon">{widget.icon}</span>
              )}
              <span className="widget-header-title-text">{widget.title}</span>
              {isLocked && (
                <Lock className="w-3 h-3 text-neutral-400 ml-1" />
              )}
            </div>

            {/* Header Actions */}
            <div className="widget-header-actions">
              {/* 새로고침 버튼 */}
              {onRefresh && !isLoading && (
                <button
                  onClick={handleRefresh}
                  className="widget-header-action"
                  title="새로고침"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}

              {/* 로딩 인디케이터 */}
              {isLoading && (
                <div className="widget-header-action">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </div>
              )}

              {/* 전체화면 버튼 */}
              <button
                onClick={handleFullscreen}
                className="widget-header-action"
                title={isExpanded ? "축소" : "확대"}
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>

              {/* 편집 모드 액션 */}
              {isEditMode && (
                <>
                  {/* 잠금 토글 */}
                  {onToggleLock && (
                    <button
                      onClick={onToggleLock}
                      className="widget-header-action"
                      title={isLocked ? "잠금 해제" : "잠금"}
                    >
                      {isLocked ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <Unlock className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  {/* 설정 버튼 */}
                  {onSettings && (
                    <button
                      onClick={onSettings}
                      className="widget-header-action"
                      title="설정"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  )}

                  {/* 제거 버튼 */}
                  {onRemove && !isLocked && (
                    <button
                      onClick={handleRemove}
                      className="widget-header-action remove"
                      title="제거"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}

              {/* 더보기 메뉴 */}
              {!isEditMode && (onSettings || onRemove) && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="widget-header-action"
                    title="더보기"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50"
                      >
                        {onSettings && (
                          <button
                            onClick={() => {
                              onSettings();
                              setShowMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                          >
                            <Settings className="w-4 h-4" />
                            위젯 설정
                          </button>
                        )}
                        {onRemove && (
                          <button
                            onClick={() => {
                              handleRemove();
                              setShowMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-accent-red hover:bg-accent-red/10 flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            위젯 제거
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Widget Body */}
          <div className={`widget-body ${isLoading ? 'loading' : ''} ${error ? 'error' : ''}`}>
            {/* 로딩 상태 */}
            {isLoading && !error && (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="widget-loading-spinner" />
                <p className="text-sm text-neutral-gray mt-2">불러오는 중...</p>
              </div>
            )}

            {/* 에러 상태 */}
            {error && (
              <div className="widget-body error">
                <svg
                  className="w-12 h-12 text-accent-red/50 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-neutral-gray text-center">{error}</p>
                {onRefresh && (
                  <button
                    onClick={handleRefresh}
                    className="mt-2 px-3 py-1 bg-primary-main text-white text-sm rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    다시 시도
                  </button>
                )}
              </div>
            )}

            {/* 컨텐츠 */}
            {!isLoading && !error && children}
          </div>

          {/* 전체화면 모달 */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                onClick={handleFullscreen}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-white rounded-xl shadow-2xl max-w-6xl max-h-[90vh] w-full h-full overflow-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {widget.icon && <span className="text-2xl">{widget.icon}</span>}
                      <h2 className="text-lg font-semibold text-neutral-dark">
                        {widget.title}
                      </h2>
                    </div>
                    <button
                      onClick={handleFullscreen}
                      className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6">
                    {children}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

WidgetWrapper.displayName = 'WidgetWrapper';