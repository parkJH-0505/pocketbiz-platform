/**
 * AISummaryBox Component
 * AI 생성 Executive Summary (3줄 요약)
 */

import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

interface AISummaryBoxProps {
  summary: string | null;
  isGenerating?: boolean;
  onRegenerate?: () => void;
  className?: string;
}

export const AISummaryBox: React.FC<AISummaryBoxProps> = ({
  summary,
  isGenerating = false,
  onRegenerate,
  className = ''
}) => {
  if (!summary && !isGenerating) {
    return (
      <div className={`bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-purple-600" />
            <h4 className="text-sm font-semibold text-gray-700">
              AI Executive Summary
            </h4>
          </div>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="p-1 hover:bg-white rounded transition-colors"
              title="AI 요약 생성"
            >
              <RefreshCw size={14} className="text-purple-600" />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 text-center py-2">
          AI 요약을 생성하려면 새로고침 버튼을 클릭하세요
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-purple-600" />
          <h4 className="text-sm font-semibold text-gray-700">
            AI Executive Summary
          </h4>
        </div>
        {onRegenerate && !isGenerating && (
          <button
            onClick={onRegenerate}
            className="p-1 hover:bg-white rounded transition-colors"
            title="AI 요약 재생성"
          >
            <RefreshCw size={14} className="text-purple-600" />
          </button>
        )}
      </div>

      {isGenerating ? (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-2 text-purple-600">
            <RefreshCw size={16} className="animate-spin" />
            <span className="text-sm">AI 요약 생성 중...</span>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-700 leading-relaxed">
          {summary}
        </div>
      )}
    </div>
  );
};
