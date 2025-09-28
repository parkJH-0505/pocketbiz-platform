/**
 * Custom Widget Builder Component
 * 커스텀 위젯 빌더 - 드래그앤드롭으로 위젯 생성
 */

import React, { useState, useRef, useEffect } from 'react';
import type { WidgetConfig } from '../WidgetRegistry';

interface ComponentBlock {
  id: string;
  type: 'text' | 'number' | 'chart' | 'button' | 'input' | 'list' | 'image' | 'container';
  label: string;
  icon: string;
  defaultProps: any;
  allowedChildren?: string[];
}

interface WidgetElement {
  id: string;
  type: string;
  props: any;
  children?: WidgetElement[];
  parent?: string;
}

interface CustomWidgetBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (widget: WidgetConfig) => void;
  initialWidget?: WidgetConfig;
}

export const CustomWidgetBuilder: React.FC<CustomWidgetBuilderProps> = ({
  isOpen,
  onClose,
  onSave,
  initialWidget
}) => {
  const [widgetName, setWidgetName] = useState(initialWidget?.title || '');
  const [widgetDescription, setWidgetDescription] = useState(initialWidget?.description || '');
  const [widgetIcon, setWidgetIcon] = useState(initialWidget?.icon || '🎨');
  const [elements, setElements] = useState<WidgetElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [draggedComponent, setDraggedComponent] = useState<ComponentBlock | null>(null);
  const [draggedElement, setDraggedElement] = useState<WidgetElement | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  // 컴포넌트 라이브러리
  const componentLibrary: ComponentBlock[] = [
    {
      id: 'text',
      type: 'text',
      label: '텍스트',
      icon: '📝',
      defaultProps: {
        text: '텍스트를 입력하세요',
        fontSize: 14,
        color: '#374151',
        fontWeight: 'normal'
      }
    },
    {
      id: 'number',
      type: 'number',
      label: '숫자',
      icon: '🔢',
      defaultProps: {
        value: 0,
        format: 'decimal',
        prefix: '',
        suffix: '',
        fontSize: 24,
        color: '#3b82f6'
      }
    },
    {
      id: 'chart',
      type: 'chart',
      label: '차트',
      icon: '📊',
      defaultProps: {
        chartType: 'line',
        data: [],
        width: '100%',
        height: 200
      }
    },
    {
      id: 'button',
      type: 'button',
      label: '버튼',
      icon: '🔘',
      defaultProps: {
        label: '클릭',
        variant: 'primary',
        size: 'medium',
        action: ''
      }
    },
    {
      id: 'input',
      type: 'input',
      label: '입력 필드',
      icon: '✏️',
      defaultProps: {
        placeholder: '입력하세요',
        type: 'text',
        value: '',
        onChange: ''
      }
    },
    {
      id: 'list',
      type: 'list',
      label: '목록',
      icon: '📋',
      defaultProps: {
        items: [],
        itemRenderer: '',
        maxItems: 10
      }
    },
    {
      id: 'image',
      type: 'image',
      label: '이미지',
      icon: '🖼️',
      defaultProps: {
        src: '',
        alt: '',
        width: '100%',
        height: 'auto'
      }
    },
    {
      id: 'container',
      type: 'container',
      label: '컨테이너',
      icon: '📦',
      defaultProps: {
        layout: 'vertical',
        gap: 8,
        padding: 12,
        background: 'transparent'
      },
      allowedChildren: ['text', 'number', 'chart', 'button', 'input', 'list', 'image']
    }
  ];

  useEffect(() => {
    if (initialWidget && initialWidget.customElements) {
      setElements(initialWidget.customElements);
    }
  }, [initialWidget]);

  if (!isOpen) return null;

  const handleComponentDragStart = (component: ComponentBlock) => {
    setDraggedComponent(component);
    setDraggedElement(null);
  };

  const handleElementDragStart = (element: WidgetElement) => {
    setDraggedElement(element);
    setDraggedComponent(null);
  };

  const handleDrop = (e: React.DragEvent, targetId?: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedComponent) {
      // 새 컴포넌트 추가
      const newElement: WidgetElement = {
        id: `element-${Date.now()}`,
        type: draggedComponent.type,
        props: { ...draggedComponent.defaultProps },
        parent: targetId
      };

      if (targetId) {
        // 컨테이너에 추가
        const updateElements = (els: WidgetElement[]): WidgetElement[] => {
          return els.map(el => {
            if (el.id === targetId) {
              return {
                ...el,
                children: [...(el.children || []), newElement]
              };
            }
            if (el.children) {
              return {
                ...el,
                children: updateElements(el.children)
              };
            }
            return el;
          });
        };
        setElements(updateElements(elements));
      } else {
        // 루트에 추가
        setElements([...elements, newElement]);
      }
    } else if (draggedElement) {
      // 기존 요소 이동
      moveElement(draggedElement.id, targetId);
    }

    setDraggedComponent(null);
    setDraggedElement(null);
    setDropTarget(null);
  };

  const moveElement = (elementId: string, newParentId?: string) => {
    let movedElement: WidgetElement | null = null;

    // 요소 제거
    const removeElement = (els: WidgetElement[]): WidgetElement[] => {
      return els.filter(el => {
        if (el.id === elementId) {
          movedElement = el;
          return false;
        }
        if (el.children) {
          el.children = removeElement(el.children);
        }
        return true;
      });
    };

    let newElements = removeElement([...elements]);

    // 요소 추가
    if (movedElement) {
      movedElement.parent = newParentId;

      if (newParentId) {
        const addToParent = (els: WidgetElement[]): WidgetElement[] => {
          return els.map(el => {
            if (el.id === newParentId) {
              return {
                ...el,
                children: [...(el.children || []), movedElement!]
              };
            }
            if (el.children) {
              return {
                ...el,
                children: addToParent(el.children)
              };
            }
            return el;
          });
        };
        newElements = addToParent(newElements);
      } else {
        newElements.push(movedElement);
      }
    }

    setElements(newElements);
  };

  const deleteElement = (elementId: string) => {
    const removeElement = (els: WidgetElement[]): WidgetElement[] => {
      return els.filter(el => {
        if (el.id === elementId) {
          return false;
        }
        if (el.children) {
          el.children = removeElement(el.children);
        }
        return true;
      });
    };

    setElements(removeElement(elements));
    setSelectedElement(null);
  };

  const updateElementProps = (elementId: string, newProps: any) => {
    const updateProps = (els: WidgetElement[]): WidgetElement[] => {
      return els.map(el => {
        if (el.id === elementId) {
          return { ...el, props: { ...el.props, ...newProps } };
        }
        if (el.children) {
          return { ...el, children: updateProps(el.children) };
        }
        return el;
      });
    };

    setElements(updateProps(elements));
  };

  const renderElement = (element: WidgetElement, depth = 0) => {
    const isSelected = selectedElement === element.id;
    const isDropTarget = dropTarget === element.id;

    return (
      <div
        key={element.id}
        className={`canvas-element ${isSelected ? 'selected' : ''} ${
          isDropTarget ? 'drop-target' : ''
        }`}
        draggable={!previewMode}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedElement(element.id);
        }}
        onDragStart={(e) => {
          e.stopPropagation();
          handleElementDragStart(element);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (element.type === 'container') {
            setDropTarget(element.id);
          }
        }}
        onDragLeave={(e) => {
          e.stopPropagation();
          setDropTarget(null);
        }}
        onDrop={(e) => {
          if (element.type === 'container') {
            handleDrop(e, element.id);
          }
        }}
        style={{
          marginLeft: depth * 20
        }}
      >
        <div className="element-header">
          <span className="element-type">{element.type}</span>
          {!previewMode && (
            <button
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                deleteElement(element.id);
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* 요소 미리보기 */}
        <div className="element-preview">
          {renderPreview(element)}
        </div>

        {/* 컨테이너의 자식 요소들 */}
        {element.children && (
          <div className="element-children">
            {element.children.map(child => renderElement(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderPreview = (element: WidgetElement) => {
    switch (element.type) {
      case 'text':
        return (
          <p
            style={{
              fontSize: element.props.fontSize,
              color: element.props.color,
              fontWeight: element.props.fontWeight
            }}
          >
            {element.props.text}
          </p>
        );

      case 'number':
        return (
          <span
            style={{
              fontSize: element.props.fontSize,
              color: element.props.color
            }}
          >
            {element.props.prefix}
            {element.props.value}
            {element.props.suffix}
          </span>
        );

      case 'button':
        return (
          <button className={`preview-button ${element.props.variant}`}>
            {element.props.label}
          </button>
        );

      case 'input':
        return (
          <input
            type={element.props.type}
            placeholder={element.props.placeholder}
            className="preview-input"
          />
        );

      case 'container':
        return (
          <div
            style={{
              padding: element.props.padding,
              background: element.props.background
            }}
            className="preview-container"
          >
            {element.children?.length ? '' : '컨테이너 (여기에 요소를 드롭하세요)'}
          </div>
        );

      case 'chart':
        return <div className="preview-chart">📊 차트 미리보기</div>;

      case 'list':
        return <div className="preview-list">📋 목록 미리보기</div>;

      case 'image':
        return <div className="preview-image">🖼️ 이미지 미리보기</div>;

      default:
        return <div>알 수 없는 요소</div>;
    }
  };

  const generateCode = () => {
    const componentCode = `
import React from 'react';

export const ${widgetName.replace(/\s+/g, '')}Widget = () => {
  const elements = ${JSON.stringify(elements, null, 2)};

  return (
    <div className="custom-widget">
      {/* Widget implementation */}
      <h3>${widgetName}</h3>
      <p>${widgetDescription}</p>
      {/* Render elements dynamically */}
    </div>
  );
};
    `.trim();

    setCustomCode(componentCode);
    setShowCode(true);
  };

  const handleSave = () => {
    if (!widgetName) {
      alert('위젯 이름을 입력해주세요');
      return;
    }

    const customWidget: WidgetConfig = {
      id: initialWidget?.id || `custom-${Date.now()}`,
      type: 'custom',
      title: widgetName,
      description: widgetDescription,
      icon: widgetIcon,
      category: 'custom',
      customElements: elements,
      customCode,
      settings: {},
      refreshInterval: 0
    };

    onSave(customWidget);
    onClose();
  };

  return (
    <div className="custom-widget-builder-overlay">
      <div className="builder-container">
        <div className="builder-header">
          <h2>커스텀 위젯 빌더</h2>
          <div className="header-actions">
            <button
              className={`preview-toggle ${previewMode ? 'active' : ''}`}
              onClick={() => setPreviewMode(!previewMode)}
            >
              👁️ 미리보기
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="builder-body">
          {/* 왼쪽: 컴포넌트 라이브러리 */}
          <div className="component-library">
            <h3>컴포넌트</h3>
            <div className="component-list">
              {componentLibrary.map(component => (
                <div
                  key={component.id}
                  className="component-item"
                  draggable
                  onDragStart={() => handleComponentDragStart(component)}
                >
                  <span className="component-icon">{component.icon}</span>
                  <span className="component-label">{component.label}</span>
                </div>
              ))}
            </div>

            {/* 위젯 정보 */}
            <div className="widget-info">
              <h3>위젯 정보</h3>
              <div className="info-field">
                <label>이름</label>
                <input
                  type="text"
                  value={widgetName}
                  onChange={(e) => setWidgetName(e.target.value)}
                  placeholder="위젯 이름"
                />
              </div>
              <div className="info-field">
                <label>설명</label>
                <textarea
                  value={widgetDescription}
                  onChange={(e) => setWidgetDescription(e.target.value)}
                  placeholder="위젯 설명"
                  rows={3}
                />
              </div>
              <div className="info-field">
                <label>아이콘</label>
                <input
                  type="text"
                  value={widgetIcon}
                  onChange={(e) => setWidgetIcon(e.target.value)}
                  placeholder="🎨"
                />
              </div>
            </div>
          </div>

          {/* 중앙: 캔버스 */}
          <div className="builder-canvas">
            <div className="canvas-toolbar">
              <button onClick={() => setElements([])}>초기화</button>
              <button onClick={generateCode}>코드 생성</button>
            </div>
            <div
              ref={canvasRef}
              className="canvas-area"
              onDragOver={(e) => {
                e.preventDefault();
                setDropTarget(null);
              }}
              onDrop={(e) => handleDrop(e)}
            >
              {elements.length === 0 ? (
                <div className="empty-canvas">
                  컴포넌트를 여기에 드래그하여 시작하세요
                </div>
              ) : (
                elements.map(element => renderElement(element))
              )}
            </div>
          </div>

          {/* 오른쪽: 속성 패널 */}
          <div className="properties-panel">
            <h3>속성</h3>
            {selectedElement ? (
              <div className="properties-content">
                {(() => {
                  const element = elements.find(el => el.id === selectedElement);
                  if (!element) return null;

                  return (
                    <>
                      <div className="property-group">
                        <h4>{element.type} 속성</h4>
                        {Object.entries(element.props).map(([key, value]) => (
                          <div key={key} className="property-field">
                            <label>{key}</label>
                            <input
                              type={typeof value === 'number' ? 'number' : 'text'}
                              value={value as string}
                              onChange={(e) =>
                                updateElementProps(selectedElement, {
                                  [key]: e.target.value
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="no-selection">요소를 선택하세요</div>
            )}
          </div>
        </div>

        <div className="builder-footer">
          <button className="btn-secondary" onClick={onClose}>
            취소
          </button>
          <button className="btn-primary" onClick={handleSave}>
            위젯 저장
          </button>
        </div>

        {/* 코드 뷰어 모달 */}
        {showCode && (
          <div className="code-viewer-modal">
            <div className="code-viewer">
              <div className="code-header">
                <h3>생성된 코드</h3>
                <button onClick={() => setShowCode(false)}>×</button>
              </div>
              <pre className="code-content">{customCode}</pre>
              <div className="code-actions">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(customCode);
                    alert('코드가 클립보드에 복사되었습니다');
                  }}
                >
                  복사
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-widget-builder-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3000;
        }

        .builder-container {
          width: 90%;
          height: 85%;
          max-width: 1400px;
          background: white;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
        }

        .builder-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .builder-header h2 {
          margin: 0;
          color: #1f2937;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .preview-toggle {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .preview-toggle.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .close-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: #f3f4f6;
          border-radius: 6px;
          cursor: pointer;
          font-size: 20px;
          color: #6b7280;
        }

        .builder-body {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        /* 컴포넌트 라이브러리 */
        .component-library {
          width: 250px;
          padding: 20px;
          background: #f9fafb;
          border-right: 1px solid #e5e7eb;
          overflow-y: auto;
        }

        .component-library h3 {
          margin: 0 0 16px 0;
          font-size: 14px;
          color: #6b7280;
          text-transform: uppercase;
        }

        .component-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 24px;
        }

        .component-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: move;
          transition: all 0.2s;
        }

        .component-item:hover {
          background: #eff6ff;
          border-color: #3b82f6;
        }

        .component-icon {
          font-size: 18px;
        }

        .component-label {
          font-size: 13px;
          color: #374151;
        }

        /* 위젯 정보 */
        .widget-info {
          margin-top: 24px;
        }

        .info-field {
          margin-bottom: 12px;
        }

        .info-field label {
          display: block;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .info-field input,
        .info-field textarea {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 13px;
        }

        /* 캔버스 */
        .builder-canvas {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #f3f4f6;
        }

        .canvas-toolbar {
          padding: 12px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          gap: 8px;
        }

        .canvas-toolbar button {
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
        }

        .canvas-area {
          flex: 1;
          padding: 20px;
          overflow: auto;
        }

        .empty-canvas {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          font-size: 14px;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
        }

        .canvas-element {
          margin-bottom: 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
          cursor: move;
          transition: all 0.2s;
        }

        .canvas-element.selected {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .canvas-element.drop-target {
          background: #eff6ff;
          border-color: #3b82f6;
        }

        .element-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .element-type {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
        }

        .delete-btn {
          width: 20px;
          height: 20px;
          border: none;
          background: #ef4444;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
        }

        .element-preview {
          min-height: 40px;
        }

        .element-children {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }

        /* 미리보기 스타일 */
        .preview-button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
        }

        .preview-button.primary {
          background: #3b82f6;
          color: white;
        }

        .preview-input {
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
        }

        .preview-container {
          min-height: 60px;
          border: 1px dashed #d1d5db;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          font-size: 12px;
        }

        .preview-chart,
        .preview-list,
        .preview-image {
          padding: 20px;
          background: #f9fafb;
          border-radius: 4px;
          text-align: center;
          color: #6b7280;
        }

        /* 속성 패널 */
        .properties-panel {
          width: 300px;
          padding: 20px;
          background: white;
          border-left: 1px solid #e5e7eb;
          overflow-y: auto;
        }

        .properties-panel h3 {
          margin: 0 0 16px 0;
          font-size: 14px;
          color: #6b7280;
          text-transform: uppercase;
        }

        .properties-panel h4 {
          margin: 0 0 12px 0;
          font-size: 13px;
          color: #374151;
        }

        .property-field {
          margin-bottom: 12px;
        }

        .property-field label {
          display: block;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .property-field input {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 13px;
        }

        .no-selection {
          color: #9ca3af;
          font-size: 13px;
          text-align: center;
          margin-top: 40px;
        }

        /* 푸터 */
        .builder-footer {
          padding: 16px 20px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .btn-primary,
        .btn-secondary {
          padding: 10px 20px;
          border-radius: 6px;
          border: none;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-secondary {
          background: #e5e7eb;
          color: #4b5563;
        }

        /* 코드 뷰어 모달 */
        .code-viewer-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 4000;
        }

        .code-viewer {
          width: 800px;
          max-width: 90%;
          max-height: 80vh;
          background: white;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
        }

        .code-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .code-header h3 {
          margin: 0;
          font-size: 16px;
        }

        .code-content {
          flex: 1;
          padding: 16px;
          margin: 0;
          background: #1e293b;
          color: #e2e8f0;
          font-family: 'Monaco', monospace;
          font-size: 13px;
          overflow: auto;
        }

        .code-actions {
          padding: 16px;
          border-top: 1px solid #e5e7eb;
          text-align: right;
        }

        .code-actions button {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default CustomWidgetBuilder;