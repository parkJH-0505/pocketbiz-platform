/**
 * ReportSection Component
 * 재사용 가능한 레포트 섹션 래퍼 컴포넌트
 */

import React from 'react';
import type { ReportSectionProps } from '../../types/reportV3UI.types';

export const ReportSection: React.FC<ReportSectionProps> = ({
  title,
  subtitle,
  height = 'auto',
  priority = 'medium',
  className = '',
  children,
  isExportMode = false
}) => {
  const heightClasses = {
    auto: '',
    fixed: 'h-screen',
    flex: 'flex-1'
  };

  const priorityClasses = {
    high: 'page-break-inside-avoid page-break-after-avoid',
    medium: 'page-break-inside-avoid',
    low: ''
  };

  return (
    <section
      className={`
        report-section
        ${heightClasses[height]}
        ${isExportMode ? priorityClasses[priority] : ''}
        ${className}
      `}
      data-section={title.toLowerCase().replace(/\s+/g, '-')}
      data-priority={priority}
    >
      {/* 섹션 헤더 */}
      <div className="report-section-header">
        <div className="report-section-title">
          <h2 className="report-heading-2">{title}</h2>
        </div>
        {subtitle && (
          <p className="report-section-subtitle">
            {subtitle}
          </p>
        )}
      </div>

      {/* 섹션 내용 */}
      <div className="report-section-content">
        {children}
      </div>
    </section>
  );
};