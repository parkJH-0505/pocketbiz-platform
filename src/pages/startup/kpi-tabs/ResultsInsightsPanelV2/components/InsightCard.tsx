/**
 * Insight Card Component
 * AI 생성 인사이트 카드
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  Target,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Clock
} from 'lucide-react';

export interface InsightData {
  id: string;
  type: 'opportunity' | 'risk' | 'success' | 'action';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timeframe?: string;
  metrics?: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
  }[];
  actions?: string[];
}

interface InsightCardProps {
  insight: InsightData;
  onAction?: (actionId: string) => void;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight, onAction }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getIcon = () => {
    switch (insight.type) {
      case 'opportunity':
        return <Lightbulb className="text-yellow-500" size={20} />;
      case 'risk':
        return <AlertTriangle className="text-red-500" size={20} />;
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'action':
        return <Target className="text-blue-500" size={20} />;
    }
  };

  const getTypeColor = () => {
    switch (insight.type) {
      case 'opportunity':
        return 'bg-yellow-50 border-yellow-200';
      case 'risk':
        return 'bg-red-50 border-red-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'action':
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getImpactBadge = () => {
    const colors = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700'
    };

    const labels = {
      high: '높은 영향',
      medium: '중간 영향',
      low: '낮은 영향'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[insight.impact]}`}>
        {labels[insight.impact]}
      </span>
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`p-4 rounded-lg border transition-all ${getTypeColor()} hover:shadow-md`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{getIcon()}</div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{insight.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-white/50 rounded transition-colors"
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 mt-3">
        {getImpactBadge()}
        {insight.timeframe && (
          <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs">
            <Clock size={12} />
            {insight.timeframe}
          </span>
        )}
        <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
          <Sparkles size={12} />
          AI 추천
        </span>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Metrics */}
            {insight.metrics && insight.metrics.length > 0 && (
              <div className="mt-4 p-3 bg-white/50 rounded-lg">
                <h5 className="text-xs font-semibold text-gray-700 mb-2">관련 지표</h5>
                <div className="grid grid-cols-2 gap-2">
                  {insight.metrics.map((metric, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">{metric.label}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{metric.value}</span>
                        {metric.trend && (
                          <span className={`text-xs ${
                            metric.trend === 'up' ? 'text-green-500' :
                            metric.trend === 'down' ? 'text-red-500' :
                            'text-gray-400'
                          }`}>
                            {metric.trend === 'up' ? '↑' :
                             metric.trend === 'down' ? '↓' : '→'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {insight.actions && insight.actions.length > 0 && (
              <div className="mt-4">
                <h5 className="text-xs font-semibold text-gray-700 mb-2">추천 액션</h5>
                <div className="space-y-1">
                  {insight.actions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => onAction?.(action)}
                      className="w-full text-left px-3 py-2 text-sm bg-white/50 hover:bg-white rounded transition-colors"
                    >
                      <span className="text-blue-600 mr-2">→</span>
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};