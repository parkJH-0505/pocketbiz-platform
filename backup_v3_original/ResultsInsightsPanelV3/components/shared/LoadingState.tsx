/**
 * LoadingState Component
 * 로딩 상태를 표시하는 컴포넌트 (스켈레톤, 스피너, 펄스)
 */

import React from 'react';
import type { LoadingStateProps } from '../../types/reportV3UI.types';

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'skeleton',
  height = 'auto',
  className = '',
  message
}) => {
  if (type === 'skeleton') {
    return (
      <div className={`loading-skeleton ${className}`} style={{ height }}>
        <div className="animate-pulse">
          {/* 스켈레톤 내용은 부모의 높이를 따름 */}
        </div>
      </div>
    );
  }

  if (type === 'spinner') {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 p-8 ${className}`}>
        <div className="loading-spinner" />
        {message && (
          <span className="text-sm text-muted">{message}</span>
        )}
      </div>
    );
  }

  if (type === 'pulse') {
    return (
      <div
        className={`animate-pulse bg-gray-200 rounded ${className}`}
        style={{ height }}
      />
    );
  }

  return null;
};

// 특화된 로딩 컴포넌트들
export const LoadingCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`p-6 border border-gray-200 rounded-lg ${className}`}>
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        <div className="h-3 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  </div>
);

export const LoadingChart: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`flex items-center justify-center p-12 border border-gray-200 rounded-lg ${className}`}>
    <div className="animate-pulse">
      <div className="w-32 h-32 bg-gray-200 rounded-full mb-4"></div>
      <div className="flex justify-center gap-4">
        <div className="h-2 w-8 bg-gray-200 rounded"></div>
        <div className="h-2 w-8 bg-gray-200 rounded"></div>
        <div className="h-2 w-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

export const LoadingHeader: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`p-8 ${className}`}>
    <div className="animate-pulse">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 bg-gray-300 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-32"></div>
        </div>
        <div className="w-24 h-24 bg-gray-300 rounded-full"></div>
      </div>
    </div>
  </div>
);