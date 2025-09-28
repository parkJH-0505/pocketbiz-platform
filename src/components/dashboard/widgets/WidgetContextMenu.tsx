/**
 * Widget Context Menu Component
 * 위젯 컨텍스트 메뉴 (우클릭 메뉴)
 */

import React, { useState, useEffect, useRef } from 'react';
import { widgetEventBus, WidgetEventTypes } from './WidgetEventBus';
import type { WidgetConfig } from '../WidgetRegistry';

interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  divider?: boolean;
  disabled?: boolean;
  danger?: boolean;
  submenu?: ContextMenuItem[];
  action?: () => void;
}

interface WidgetContextMenuProps {
  widgetId: string;
  widget: WidgetConfig;
  position: { x: number; y: number };
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onLock?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onExport?: () => void;
  customActions?: ContextMenuItem[];
}

export const WidgetContextMenu: React.FC<WidgetContextMenuProps> = ({
  widgetId,
  widget,
  position,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onLock,
  onMinimize,
  onMaximize,
  onExport,
  customActions = []
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);
  const [copiedData, setCopiedData] = useState<any>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          onClose();
        }
      };

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = () => {
    const widgetData = {
      widget,
      settings: widget.settings,
      timestamp: Date.now()
    };
    setCopiedData(widgetData);
    localStorage.setItem('widget_clipboard', JSON.stringify(widgetData));

    // 이벤트 발행
    widgetEventBus.emit(
      widgetId,
      WidgetEventTypes.ACTION_TRIGGER,
      { action: 'copy', data: widgetData }
    );

    onClose();
  };

  const handlePaste = () => {
    const clipboard = localStorage.getItem('widget_clipboard');
    if (clipboard) {
      try {
        const data = JSON.parse(clipboard);
        widgetEventBus.emit(
          widgetId,
          WidgetEventTypes.ACTION_TRIGGER,
          { action: 'paste', data }
        );
      } catch (error) {
        console.error('Failed to paste widget data:', error);
      }
    }
    onClose();
  };

  const handleRefresh = () => {
    widgetEventBus.emit(widgetId, WidgetEventTypes.DATA_REFRESH, {});
    onClose();
  };

  const handlePin = () => {
    // 위젯 고정 로직
    widgetEventBus.emit(
      widgetId,
      WidgetEventTypes.ACTION_TRIGGER,
      { action: 'pin', pinned: true }
    );
    onClose();
  };

  const handleSettings = () => {
    if (onEdit) onEdit();
    onClose();
  };

  const handleFullscreen = () => {
    setIsMaximized(!isMaximized);
    if (onMaximize) onMaximize();

    widgetEventBus.emit(
      widgetId,
      isMaximized ? WidgetEventTypes.WIDGET_MINIMIZED : WidgetEventTypes.WIDGET_MAXIMIZED,
      {}
    );

    onClose();
  };

  const handleLockToggle = () => {
    setIsLocked(!isLocked);
    if (onLock) onLock();

    widgetEventBus.emit(
      widgetId,
      WidgetEventTypes.ACTION_TRIGGER,
      { action: 'lock', locked: !isLocked }
    );

    onClose();
  };

  const handleExportData = () => {
    if (onExport) onExport();

    widgetEventBus.emit(
      widgetId,
      WidgetEventTypes.ACTION_TRIGGER,
      { action: 'export' }
    );

    onClose();
  };

  const handleDuplicate = () => {
    if (onDuplicate) onDuplicate();
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`"${widget.title}" 위젯을 삭제하시겠습니까?`)) {
      if (onDelete) onDelete();
      onClose();
    }
  };

  const menuItems: ContextMenuItem[] = [
    {
      id: 'refresh',
      label: '새로고침',
      icon: '🔄',
      shortcut: 'F5',
      action: handleRefresh
    },
    {
      id: 'settings',
      label: '설정',
      icon: '⚙️',
      shortcut: 'Ctrl+,',
      action: handleSettings
    },
    { id: 'divider1', divider: true, label: '' },
    {
      id: 'copy',
      label: '복사',
      icon: '📋',
      shortcut: 'Ctrl+C',
      action: handleCopy
    },
    {
      id: 'paste',
      label: '붙여넣기',
      icon: '📄',
      shortcut: 'Ctrl+V',
      disabled: !localStorage.getItem('widget_clipboard'),
      action: handlePaste
    },
    {
      id: 'duplicate',
      label: '복제',
      icon: '📑',
      shortcut: 'Ctrl+D',
      action: handleDuplicate
    },
    { id: 'divider2', divider: true, label: '' },
    {
      id: 'view',
      label: '보기',
      icon: '👁️',
      submenu: [
        {
          id: 'fullscreen',
          label: isMaximized ? '원래 크기로' : '전체 화면',
          icon: isMaximized ? '🔲' : '⬜',
          action: handleFullscreen
        },
        {
          id: 'minimize',
          label: '최소화',
          icon: '➖',
          action: () => {
            setIsMinimized(true);
            if (onMinimize) onMinimize();
            onClose();
          }
        },
        {
          id: 'pin',
          label: '상단 고정',
          icon: '📌',
          action: handlePin
        }
      ]
    },
    {
      id: 'data',
      label: '데이터',
      icon: '💾',
      submenu: [
        {
          id: 'export',
          label: '내보내기',
          icon: '📤',
          shortcut: 'Ctrl+E',
          action: handleExportData
        },
        {
          id: 'import',
          label: '가져오기',
          icon: '📥',
          shortcut: 'Ctrl+I',
          action: () => {
            widgetEventBus.emit(
              widgetId,
              WidgetEventTypes.ACTION_TRIGGER,
              { action: 'import' }
            );
            onClose();
          }
        },
        {
          id: 'clear',
          label: '데이터 초기화',
          icon: '🗑️',
          danger: true,
          action: () => {
            if (confirm('위젯 데이터를 초기화하시겠습니까?')) {
              widgetEventBus.emit(
                widgetId,
                WidgetEventTypes.ACTION_TRIGGER,
                { action: 'clear' }
              );
              onClose();
            }
          }
        }
      ]
    },
    { id: 'divider3', divider: true, label: '' },
    {
      id: 'lock',
      label: isLocked ? '잠금 해제' : '위젯 잠금',
      icon: isLocked ? '🔓' : '🔒',
      action: handleLockToggle
    },
    ...customActions,
    { id: 'divider4', divider: true, label: '' },
    {
      id: 'delete',
      label: '삭제',
      icon: '🗑️',
      shortcut: 'Delete',
      danger: true,
      action: handleDelete
    }
  ];

  const renderMenuItem = (item: ContextMenuItem, depth = 0) => {
    if (item.divider) {
      return <div key={item.id} className="menu-divider" />;
    }

    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedSubmenu === item.id;

    return (
      <div
        key={item.id}
        className={`menu-item-wrapper ${hasSubmenu ? 'has-submenu' : ''}`}
        onMouseEnter={() => hasSubmenu && setExpandedSubmenu(item.id)}
        onMouseLeave={() => hasSubmenu && setExpandedSubmenu(null)}
      >
        <button
          className={`menu-item ${item.disabled ? 'disabled' : ''} ${
            item.danger ? 'danger' : ''
          }`}
          onClick={() => !item.disabled && item.action && item.action()}
          disabled={item.disabled}
        >
          {item.icon && <span className="menu-icon">{item.icon}</span>}
          <span className="menu-label">{item.label}</span>
          {item.shortcut && <span className="menu-shortcut">{item.shortcut}</span>}
          {hasSubmenu && <span className="submenu-arrow">▶</span>}
        </button>

        {hasSubmenu && isExpanded && (
          <div className="submenu">
            {item.submenu!.map(subItem => renderMenuItem(subItem, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // 메뉴 위치 조정 (화면 밖으로 나가지 않도록)
  const adjustedPosition = { ...position };
  if (menuRef.current) {
    const rect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (position.x + rect.width > viewportWidth) {
      adjustedPosition.x = viewportWidth - rect.width - 10;
    }

    if (position.y + rect.height > viewportHeight) {
      adjustedPosition.y = viewportHeight - rect.height - 10;
    }
  }

  return (
    <>
      <div
        ref={menuRef}
        className="widget-context-menu"
        style={{
          top: adjustedPosition.y,
          left: adjustedPosition.x
        }}
      >
        <div className="menu-header">
          <span className="menu-title">{widget.title}</span>
        </div>
        <div className="menu-items">
          {menuItems.map(item => renderMenuItem(item))}
        </div>
      </div>

      <style jsx>{`
        .widget-context-menu {
          position: fixed;
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          z-index: 3000;
          min-width: 200px;
          max-width: 300px;
          animation: fadeIn 0.15s ease;
          overflow: visible;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .menu-header {
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
          border-radius: 8px 8px 0 0;
        }

        .menu-title {
          font-weight: 600;
          color: #374151;
          font-size: 13px;
        }

        .menu-items {
          padding: 4px;
          max-height: 400px;
          overflow-y: auto;
        }

        .menu-item-wrapper {
          position: relative;
        }

        .menu-item {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 8px 12px;
          background: transparent;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          color: #374151;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
        }

        .menu-item:hover:not(.disabled) {
          background: #f3f4f6;
        }

        .menu-item:active:not(.disabled) {
          background: #e5e7eb;
        }

        .menu-item.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .menu-item.danger {
          color: #dc2626;
        }

        .menu-item.danger:hover:not(.disabled) {
          background: #fef2f2;
        }

        .menu-icon {
          margin-right: 10px;
          font-size: 14px;
        }

        .menu-label {
          flex: 1;
        }

        .menu-shortcut {
          margin-left: 20px;
          font-size: 11px;
          color: #9ca3af;
        }

        .submenu-arrow {
          margin-left: 8px;
          font-size: 10px;
          color: #9ca3af;
        }

        .menu-divider {
          height: 1px;
          background: #e5e7eb;
          margin: 4px 8px;
        }

        .submenu {
          position: absolute;
          left: 100%;
          top: 0;
          margin-left: 4px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          min-width: 180px;
          padding: 4px;
          animation: slideIn 0.15s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .has-submenu:hover .submenu {
          display: block;
        }

        /* 스크롤바 스타일 */
        .menu-items::-webkit-scrollbar {
          width: 6px;
        }

        .menu-items::-webkit-scrollbar-track {
          background: transparent;
        }

        .menu-items::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }

        .menu-items::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </>
  );
};

export default WidgetContextMenu;