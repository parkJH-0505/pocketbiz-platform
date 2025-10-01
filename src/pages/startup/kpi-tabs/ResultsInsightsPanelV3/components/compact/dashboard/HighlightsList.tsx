/**
 * HighlightsList Component
 * 핵심 하이라이트 리스트 (최대 3개)
 */

import React from 'react';
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface Highlight {
  type: 'positive' | 'neutral' | 'attention';
  message: string;
  icon: string;
}

interface HighlightsListProps {
  highlights: Highlight[];
  className?: string;
}

export const HighlightsList: React.FC<HighlightsListProps> = ({
  highlights,
  className = ''
}) => {
  const getHighlightConfig = (type: Highlight['type']) => {
    switch (type) {
      case 'positive':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-900',
          iconColor: 'text-green-600'
        };
      case 'attention':
        return {
          icon: AlertCircle,
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-900',
          iconColor: 'text-orange-600'
        };
      case 'neutral':
      default:
        return {
          icon: ArrowRight,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-900',
          iconColor: 'text-blue-600'
        };
    }
  };

  if (highlights.length === 0) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          핵심 하이라이트
        </h4>
        <p className="text-sm text-gray-500 text-center py-4">
          하이라이트 데이터가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <h4 className="text-sm font-semibold text-gray-700 mb-3">
        핵심 하이라이트
      </h4>

      <div className="space-y-3">
        {highlights.map((highlight, idx) => {
          const config = getHighlightConfig(highlight.type);
          const Icon = config.icon;

          return (
            <div
              key={idx}
              className={`p-3 ${config.bgColor} border ${config.borderColor} rounded-lg`}
            >
              <div className="flex items-start gap-3">
                <div className={`${config.iconColor} flex-shrink-0 mt-0.5`}>
                  <Icon size={18} />
                </div>
                <p className={`text-sm ${config.textColor} flex-1`}>
                  {highlight.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
