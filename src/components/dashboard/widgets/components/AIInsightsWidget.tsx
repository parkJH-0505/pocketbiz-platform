/**
 * AI Insights Widget
 * AI 기반 인사이트 위젯
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, AlertCircle, Lightbulb, ChevronRight } from 'lucide-react';
import { useKPIDiagnosis } from '../../../../contexts/KPIDiagnosisContext';
import { useAIInsights } from '../../../../pages/startup/kpi-tabs/ResultsInsightsPanelV2/hooks/useAIInsights';
import type { WidgetComponentProps } from '../WidgetRegistry';

interface InsightItem {
  id: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'prediction';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  confidence: number;
  timestamp: number;
}

const AIInsightsWidget: React.FC<WidgetComponentProps> = ({
  widgetId,
  config,
  isEditMode,
  onUpdate
}) => {
  const { axisScores, overallScore, previousScores } = useKPIDiagnosis();
  const [selectedInsight, setSelectedInsight] = useState<InsightItem | null>(null);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // AI 인사이트 훅 사용
  const { nlpInsights, patterns, anomalies, isLoading } = useAIInsights({
    currentScores: axisScores,
    historicalData: previousScores || [],
    enabled: true
  });

  // 인사이트를 표준 형식으로 변환
  const insights: InsightItem[] = React.useMemo(() => {
    const items: InsightItem[] = [];

    // NLP 인사이트 변환
    nlpInsights.forEach((insight: any) => {
      items.push({
        id: insight.id,
        type: insight.type as InsightItem['type'],
        priority: insight.priority,
        title: insight.title,
        description: insight.description,
        confidence: insight.metrics?.confidence || 0.8,
        timestamp: insight.timestamp
      });
    });

    return items.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [nlpInsights]);

  // 필터링된 인사이트
  const filteredInsights = insights.filter(insight =>
    filter === 'all' || insight.priority === filter
  );

  // 타입별 아이콘 매핑
  const getTypeIcon = (type: InsightItem['type']) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="w-4 h-4" />;
      case 'anomaly':
        return <AlertCircle className="w-4 h-4" />;
      case 'recommendation':
        return <Lightbulb className="w-4 h-4" />;
      case 'prediction':
        return <Brain className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  // 우선순위별 색상 매핑
  const getPriorityColor = (priority: InsightItem['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-accent-red border-accent-red/20 bg-accent-red/5';
      case 'medium':
        return 'text-accent-orange border-accent-orange/20 bg-accent-orange/5';
      case 'low':
        return 'text-accent-green border-accent-green/20 bg-accent-green/5';
      default:
        return 'text-neutral-gray border-neutral-200 bg-neutral-50';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 필터 탭 */}
      <div className="flex gap-1 mb-3">
        {(['all', 'high', 'medium', 'low'] as const).map(level => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`
              px-3 py-1 text-xs rounded-lg transition-all
              ${filter === level
                ? 'bg-primary-main text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }
            `}
          >
            {level === 'all' ? '전체' : level === 'high' ? '높음' : level === 'medium' ? '보통' : '낮음'}
            {level !== 'all' && (
              <span className="ml-1">
                ({insights.filter(i => i.priority === level).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 인사이트 목록 */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-primary-main border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredInsights.length === 0 ? (
          <div className="text-center text-neutral-gray py-8">
            <Brain className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
            <p className="text-sm">인사이트를 생성 중입니다...</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredInsights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedInsight(insight)}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md
                  ${getPriorityColor(insight.priority)}
                `}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">{getTypeIcon(insight.type)}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold line-clamp-1">
                      {insight.title}
                    </h4>
                    <p className="text-xs opacity-80 mt-1 line-clamp-2">
                      {insight.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs opacity-60">
                        신뢰도: {(insight.confidence * 100).toFixed(0)}%
                      </span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* 선택된 인사이트 상세 모달 */}
      <AnimatePresence>
        {selectedInsight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedInsight(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className={`p-2 rounded-lg ${getPriorityColor(selectedInsight.priority)}`}>
                  {getTypeIcon(selectedInsight.type)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-dark">
                    {selectedInsight.title}
                  </h3>
                  <span className={`
                    inline-block px-2 py-0.5 text-xs rounded-full mt-1
                    ${getPriorityColor(selectedInsight.priority)}
                  `}>
                    {selectedInsight.priority === 'high' ? '높음' :
                     selectedInsight.priority === 'medium' ? '보통' : '낮음'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-neutral-gray mb-4">
                {selectedInsight.description}
              </p>
              <div className="flex items-center justify-between text-xs text-neutral-gray">
                <span>신뢰도: {(selectedInsight.confidence * 100).toFixed(0)}%</span>
                <span>
                  {new Date(selectedInsight.timestamp).toLocaleTimeString('ko-KR')}
                </span>
              </div>
              <button
                onClick={() => setSelectedInsight(null)}
                className="mt-4 w-full px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                닫기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIInsightsWidget;