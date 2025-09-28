/**
 * Widget Settings Panel Component
 * 위젯 개별 설정 패널
 */

import React, { useState, useEffect } from 'react';
import type { WidgetConfig } from '../WidgetRegistry';

interface WidgetSettingsPanelProps {
  widget: WidgetConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: any) => void;
  position?: { x: number; y: number };
}

interface SettingField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'color' | 'boolean' | 'range' | 'json';
  value: any;
  options?: Array<{ label: string; value: any }>;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  description?: string;
  validation?: (value: any) => string | null;
}

export const WidgetSettingsPanel: React.FC<WidgetSettingsPanelProps> = ({
  widget,
  isOpen,
  onClose,
  onSave,
  position
}) => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'general' | 'data' | 'appearance' | 'behavior'>('general');
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (widget.settings) {
      setSettings(JSON.parse(JSON.stringify(widget.settings)));
    }
  }, [widget]);

  if (!isOpen) return null;

  // 위젯 타입별 설정 필드 정의
  const getSettingFields = (): Record<string, SettingField[]> => {
    const baseFields: Record<string, SettingField[]> = {
      general: [
        {
          key: 'title',
          label: '위젯 제목',
          type: 'text',
          value: settings.title || widget.title,
          placeholder: '위젯 제목 입력'
        },
        {
          key: 'description',
          label: '설명',
          type: 'text',
          value: settings.description || widget.description,
          placeholder: '위젯 설명 입력'
        },
        {
          key: 'refreshInterval',
          label: '새로고침 주기 (초)',
          type: 'number',
          value: (settings.refreshInterval || widget.refreshInterval || 60000) / 1000,
          min: 0,
          max: 3600,
          description: '0으로 설정하면 자동 새로고침 비활성화'
        }
      ],
      data: [],
      appearance: [
        {
          key: 'backgroundColor',
          label: '배경 색상',
          type: 'color',
          value: settings.backgroundColor || '#ffffff'
        },
        {
          key: 'borderRadius',
          label: '모서리 둥글기',
          type: 'range',
          value: settings.borderRadius || 8,
          min: 0,
          max: 24,
          step: 4
        },
        {
          key: 'showHeader',
          label: '헤더 표시',
          type: 'boolean',
          value: settings.showHeader !== false
        },
        {
          key: 'opacity',
          label: '투명도',
          type: 'range',
          value: settings.opacity || 100,
          min: 20,
          max: 100,
          step: 10
        }
      ],
      behavior: [
        {
          key: 'interactive',
          label: '상호작용 활성화',
          type: 'boolean',
          value: settings.interactive !== false
        },
        {
          key: 'exportable',
          label: '데이터 내보내기 허용',
          type: 'boolean',
          value: settings.exportable !== false
        },
        {
          key: 'minimizable',
          label: '최소화 가능',
          type: 'boolean',
          value: settings.minimizable !== false
        }
      ]
    };

    // 위젯 타입별 특수 설정
    switch (widget.type) {
      case 'kpi-radar':
        baseFields.data.push(
          {
            key: 'axes',
            label: 'KPI 축',
            type: 'json',
            value: JSON.stringify(settings.axes || [], null, 2),
            placeholder: '["축1", "축2", "축3"]',
            validation: (value) => {
              try {
                const parsed = JSON.parse(value);
                if (!Array.isArray(parsed)) return '배열 형식이어야 합니다';
                return null;
              } catch {
                return '유효한 JSON이 아닙니다';
              }
            }
          },
          {
            key: 'maxValue',
            label: '최대값',
            type: 'number',
            value: settings.maxValue || 100,
            min: 1,
            max: 1000
          }
        );
        break;

      case 'score-trend':
        baseFields.data.push(
          {
            key: 'period',
            label: '기간',
            type: 'select',
            value: settings.period || 'week',
            options: [
              { label: '일간', value: 'day' },
              { label: '주간', value: 'week' },
              { label: '월간', value: 'month' },
              { label: '분기', value: 'quarter' },
              { label: '연간', value: 'year' }
            ]
          },
          {
            key: 'chartType',
            label: '차트 유형',
            type: 'select',
            value: settings.chartType || 'line',
            options: [
              { label: '라인', value: 'line' },
              { label: '영역', value: 'area' },
              { label: '바', value: 'bar' },
              { label: '캔들스틱', value: 'candlestick' }
            ]
          }
        );
        break;

      case 'ai-insights':
        baseFields.data.push(
          {
            key: 'insightTypes',
            label: '인사이트 유형',
            type: 'json',
            value: JSON.stringify(settings.insightTypes || ['pattern', 'anomaly', 'prediction'], null, 2),
            placeholder: '["pattern", "anomaly"]'
          },
          {
            key: 'priority',
            label: '우선순위',
            type: 'select',
            value: settings.priority || 'medium',
            options: [
              { label: '낮음', value: 'low' },
              { label: '중간', value: 'medium' },
              { label: '높음', value: 'high' },
              { label: '긴급', value: 'critical' }
            ]
          }
        );
        break;

      case 'quick-actions':
        baseFields.data.push(
          {
            key: 'actions',
            label: '빠른 실행 버튼',
            type: 'json',
            value: JSON.stringify(settings.actions || [], null, 2),
            placeholder: '[{"icon": "🚀", "label": "실행", "command": "run"}]',
            description: '버튼 구성을 JSON 형식으로 입력'
          }
        );
        break;

      case 'notifications':
        baseFields.behavior.push(
          {
            key: 'maxItems',
            label: '최대 알림 개수',
            type: 'number',
            value: settings.maxItems || 10,
            min: 1,
            max: 50
          },
          {
            key: 'autoHide',
            label: '자동 숨김 시간 (초)',
            type: 'number',
            value: settings.autoHide || 0,
            min: 0,
            max: 60,
            description: '0으로 설정하면 자동 숨김 비활성화'
          }
        );
        break;
    }

    return baseFields;
  };

  const handleFieldChange = (key: string, value: any, type: string) => {
    let processedValue = value;

    // 타입별 값 처리
    switch (type) {
      case 'number':
      case 'range':
        processedValue = Number(value);
        break;
      case 'boolean':
        processedValue = Boolean(value);
        break;
      case 'json':
        try {
          processedValue = JSON.parse(value);
        } catch {
          // JSON 파싱 실패 시 문자열 그대로 저장
          processedValue = value;
        }
        break;
    }

    // refreshInterval은 밀리초로 저장
    if (key === 'refreshInterval') {
      processedValue = processedValue * 1000;
    }

    setSettings(prev => ({
      ...prev,
      [key]: processedValue
    }));

    // 에러 초기화
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  };

  const validateSettings = (): boolean => {
    const fields = getSettingFields();
    const newErrors: Record<string, string> = {};

    Object.values(fields).flat().forEach(field => {
      if (field.validation) {
        const error = field.validation(settings[field.key]);
        if (error) {
          newErrors[field.key] = error;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateSettings()) {
      return;
    }

    onSave(settings);
    onClose();
  };

  const handleReset = () => {
    setSettings(widget.settings || {});
    setErrors({});
  };

  const renderField = (field: SettingField) => {
    const error = errors[field.key];
    const currentValue = settings[field.key] !== undefined ? settings[field.key] : field.value;

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={currentValue || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value, field.type)}
            placeholder={field.placeholder}
            className={error ? 'error' : ''}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={field.key === 'refreshInterval' ? currentValue / 1000 : currentValue}
            onChange={(e) => handleFieldChange(field.key, e.target.value, field.type)}
            min={field.min}
            max={field.max}
            className={error ? 'error' : ''}
          />
        );

      case 'select':
        return (
          <select
            value={currentValue}
            onChange={(e) => handleFieldChange(field.key, e.target.value, field.type)}
          >
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'color':
        return (
          <div className="color-input">
            <input
              type="color"
              value={currentValue}
              onChange={(e) => handleFieldChange(field.key, e.target.value, field.type)}
            />
            <input
              type="text"
              value={currentValue}
              onChange={(e) => handleFieldChange(field.key, e.target.value, field.type)}
              placeholder="#ffffff"
              className="color-text"
            />
          </div>
        );

      case 'boolean':
        return (
          <label className="switch">
            <input
              type="checkbox"
              checked={currentValue}
              onChange={(e) => handleFieldChange(field.key, e.target.checked, field.type)}
            />
            <span className="slider"></span>
          </label>
        );

      case 'range':
        return (
          <div className="range-input">
            <input
              type="range"
              value={field.key === 'refreshInterval' ? currentValue / 1000 : currentValue}
              onChange={(e) => handleFieldChange(field.key, e.target.value, field.type)}
              min={field.min}
              max={field.max}
              step={field.step}
            />
            <span className="range-value">
              {field.key === 'refreshInterval' ? currentValue / 1000 : currentValue}
              {field.key === 'opacity' ? '%' : ''}
            </span>
          </div>
        );

      case 'json':
        return (
          <textarea
            value={typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue, null, 2)}
            onChange={(e) => handleFieldChange(field.key, e.target.value, field.type)}
            placeholder={field.placeholder}
            className={`json-input ${error ? 'error' : ''}`}
            rows={5}
          />
        );

      default:
        return null;
    }
  };

  const fields = getSettingFields();

  return (
    <div className="widget-settings-overlay">
      <div
        className="widget-settings-panel"
        style={position ? { top: position.y, left: position.x } : {}}
      >
        <div className="settings-header">
          <div className="header-title">
            <span className="widget-icon">{widget.icon}</span>
            <h3>{widget.title} 설정</h3>
          </div>
          <div className="header-actions">
            <button
              className={`preview-btn ${previewMode ? 'active' : ''}`}
              onClick={() => setPreviewMode(!previewMode)}
              title="미리보기"
            >
              👁️
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="settings-tabs">
          <button
            className={`tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            일반
          </button>
          <button
            className={`tab ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
            disabled={fields.data.length === 0}
          >
            데이터
          </button>
          <button
            className={`tab ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            모양
          </button>
          <button
            className={`tab ${activeTab === 'behavior' ? 'active' : ''}`}
            onClick={() => setActiveTab('behavior')}
          >
            동작
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-fields">
            {fields[activeTab]?.map(field => (
              <div key={field.key} className="field-group">
                <label htmlFor={field.key}>
                  {field.label}
                  {field.description && (
                    <span className="field-description">{field.description}</span>
                  )}
                </label>
                {renderField(field)}
                {errors[field.key] && (
                  <span className="error-message">{errors[field.key]}</span>
                )}
              </div>
            ))}
          </div>

          {previewMode && (
            <div className="preview-section">
              <h4>미리보기</h4>
              <div
                className="widget-preview"
                style={{
                  backgroundColor: settings.backgroundColor || '#ffffff',
                  borderRadius: `${settings.borderRadius || 8}px`,
                  opacity: (settings.opacity || 100) / 100
                }}
              >
                {settings.showHeader !== false && (
                  <div className="preview-header">
                    {settings.title || widget.title}
                  </div>
                )}
                <div className="preview-body">
                  <p>{settings.description || widget.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="settings-footer">
          <button className="btn-secondary" onClick={handleReset}>
            초기화
          </button>
          <div className="footer-actions">
            <button className="btn-cancel" onClick={onClose}>
              취소
            </button>
            <button className="btn-primary" onClick={handleSave}>
              저장
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .widget-settings-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .widget-settings-panel {
          width: 600px;
          max-width: 90vw;
          max-height: 80vh;
          background: white;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .settings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .widget-icon {
          font-size: 24px;
        }

        .settings-header h3 {
          margin: 0;
          color: #1f2937;
          font-size: 18px;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .preview-btn,
        .close-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: #f3f4f6;
          cursor: pointer;
          transition: all 0.2s;
        }

        .preview-btn:hover,
        .close-btn:hover {
          background: #e5e7eb;
        }

        .preview-btn.active {
          background: #3b82f6;
          color: white;
        }

        .close-btn {
          font-size: 20px;
          color: #6b7280;
        }

        .settings-tabs {
          display: flex;
          gap: 2px;
          padding: 0 20px;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .tab {
          padding: 12px 20px;
          border: none;
          background: transparent;
          color: #6b7280;
          font-weight: 500;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .tab:hover:not(:disabled) {
          color: #4b5563;
        }

        .tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .tab:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .settings-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .settings-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field-group label {
          font-weight: 500;
          color: #374151;
          font-size: 14px;
        }

        .field-description {
          display: block;
          font-weight: 400;
          color: #6b7280;
          font-size: 12px;
          margin-top: 2px;
        }

        input[type="text"],
        input[type="number"],
        select,
        textarea {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        input[type="text"]:focus,
        input[type="number"]:focus,
        select:focus,
        textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        input.error,
        textarea.error {
          border-color: #ef4444;
        }

        .error-message {
          color: #ef4444;
          font-size: 12px;
        }

        .color-input {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        input[type="color"] {
          width: 40px;
          height: 36px;
          padding: 2px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
        }

        .color-text {
          flex: 1;
        }

        .switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 24px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          border-radius: 24px;
          transition: 0.3s;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          border-radius: 50%;
          transition: 0.3s;
        }

        input:checked + .slider {
          background-color: #3b82f6;
        }

        input:checked + .slider:before {
          transform: translateX(24px);
        }

        .range-input {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        input[type="range"] {
          flex: 1;
        }

        .range-value {
          min-width: 48px;
          text-align: right;
          color: #6b7280;
          font-size: 14px;
        }

        .json-input {
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 12px;
          resize: vertical;
        }

        .preview-section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }

        .preview-section h4 {
          margin: 0 0 12px 0;
          color: #6b7280;
          font-size: 14px;
        }

        .widget-preview {
          border: 1px solid #e5e7eb;
          padding: 16px;
          transition: all 0.3s;
        }

        .preview-header {
          font-weight: 600;
          margin-bottom: 8px;
          color: #1f2937;
        }

        .preview-body {
          color: #6b7280;
          font-size: 14px;
        }

        .settings-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .footer-actions {
          display: flex;
          gap: 12px;
        }

        .btn-primary,
        .btn-secondary,
        .btn-cancel {
          padding: 8px 16px;
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

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: #e5e7eb;
          color: #4b5563;
        }

        .btn-secondary:hover {
          background: #d1d5db;
        }

        .btn-cancel {
          background: transparent;
          color: #6b7280;
          border: 1px solid #d1d5db;
        }

        .btn-cancel:hover {
          background: #f9fafb;
        }
      `}</style>
    </div>
  );
};

export default WidgetSettingsPanel;