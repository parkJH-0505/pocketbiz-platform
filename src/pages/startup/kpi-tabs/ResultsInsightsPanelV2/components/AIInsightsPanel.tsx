/**
 * AI Insights Panel Component
 * Phase 6 AI 엔진 결과를 표시하는 패널
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIInsights } from '../hooks/useAIInsights';
import type { AxisKey } from '../types';

interface AIInsightsPanelProps {
  currentScores: Record<AxisKey, number>;
  historicalData?: Array<{
    timestamp: number;
    scores: Record<AxisKey, number>;
  }>;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  currentScores,
  historicalData = []
}) => {
  const [activeTab, setActiveTab] = useState<'insights' | 'patterns' | 'simulation' | 'prediction'>('insights');
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  const {
    patterns,
    anomalies,
    nlpInsights,
    simulations,
    predictions,
    goalCalculations,
    isLoading,
    error,
    refresh,
    runSpecificAnalysis
  } = useAIInsights({
    currentScores,
    historicalData,
    enabled: true
  });

  const tabs = [
    { id: 'insights', label: 'AI 인사이트', icon: '💡', count: nlpInsights.length },
    { id: 'patterns', label: '패턴 분석', icon: '📊', count: patterns.length },
    { id: 'simulation', label: '시뮬레이션', icon: '🎲', count: simulations ? 1 : 0 },
    { id: 'prediction', label: '예측', icon: '📈', count: predictions ? 1 : 0 }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-neutral-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-100 bg-gradient-to-r from-primary-main/5 to-accent-indigo/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-main/10 rounded-xl flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-dark">AI 분석 대시보드</h3>
              <p className="text-sm text-neutral-gray">Phase 6 통합 인사이트</p>
            </div>
          </div>
          <button
            onClick={refresh}
            disabled={isLoading}
            className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isLoading ? '분석 중...' : '새로고침'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-6 py-3 border-b border-neutral-100">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-all
              ${activeTab === tab.id
                ? 'bg-primary-main text-white shadow-md'
                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
              }
            `}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
            {tab.count > 0 && (
              <span className={`
                ml-2 px-2 py-0.5 rounded-full text-xs
                ${activeTab === tab.id ? 'bg-white/20' : 'bg-primary-main/10 text-primary-main'}
              `}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        {error && (
          <div className="mb-4 p-4 bg-accent-red/10 border border-accent-red/20 rounded-lg">
            <p className="text-sm text-accent-red">{error}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {nlpInsights.length === 0 ? (
                <EmptyState message="AI 인사이트를 생성 중입니다..." />
              ) : (
                nlpInsights.map((insight: any) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    isExpanded={expandedInsight === insight.id}
                    onToggle={() => setExpandedInsight(
                      expandedInsight === insight.id ? null : insight.id
                    )}
                  />
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'patterns' && (
            <motion.div
              key="patterns"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {patterns.length === 0 ? (
                <EmptyState message="패턴을 분석 중입니다..." />
              ) : (
                <PatternsList patterns={patterns} anomalies={anomalies} />
              )}
            </motion.div>
          )}

          {activeTab === 'simulation' && (
            <motion.div
              key="simulation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {!simulations ? (
                <EmptyState message="시뮬레이션을 준비 중입니다..." />
              ) : (
                <SimulationResults simulation={simulations} />
              )}
            </motion.div>
          )}

          {activeTab === 'prediction' && (
            <motion.div
              key="prediction"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {!predictions ? (
                <EmptyState message="예측 모델을 준비 중입니다..." />
              ) : (
                <PredictionResults prediction={predictions} goalCalculations={goalCalculations} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// 인사이트 카드 컴포넌트
const InsightCard: React.FC<{
  insight: any;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ insight, isExpanded, onToggle }) => {
  const priorityColors = {
    high: 'border-accent-red bg-accent-red/5',
    medium: 'border-accent-orange bg-accent-orange/5',
    low: 'border-accent-green bg-accent-green/5'
  };

  const typeIcons = {
    trend: '📊',
    anomaly: '⚠️',
    recommendation: '💡',
    prediction: '🔮',
    analysis: '🔍'
  };

  return (
    <motion.div
      layout
      className={`
        border rounded-lg p-4 cursor-pointer transition-all
        ${priorityColors[insight.priority as keyof typeof priorityColors]}
      `}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-2xl mt-1">
            {typeIcons[insight.type as keyof typeof typeIcons] || '📝'}
          </span>
          <div className="flex-1">
            <h4 className="font-semibold text-neutral-dark mb-1">{insight.title}</h4>
            <p className="text-sm text-neutral-gray">{insight.description}</p>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-3"
                >
                  {/* Details */}
                  {insight.details && insight.details.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-neutral-600 uppercase">상세 정보</p>
                      <ul className="space-y-1">
                        {insight.details.map((detail: string, idx: number) => (
                          <li key={idx} className="text-sm text-neutral-gray flex items-start gap-2">
                            <span className="text-primary-main mt-1">•</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  {insight.actions && insight.actions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-neutral-600 uppercase">추천 액션</p>
                      {insight.actions.map((action: any) => (
                        <div key={action.id} className="bg-white rounded-lg p-3 border border-neutral-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-neutral-dark">{action.text}</p>
                              <p className="text-xs text-neutral-gray mt-1">
                                예상 효과: {action.expectedImpact}
                              </p>
                            </div>
                            <span className={`
                              px-2 py-1 text-xs rounded-full
                              ${action.type === 'immediate' ? 'bg-accent-red/10 text-accent-red' :
                                action.type === 'short_term' ? 'bg-accent-orange/10 text-accent-orange' :
                                'bg-accent-green/10 text-accent-green'}
                            `}>
                              {action.type === 'immediate' ? '즉시' :
                               action.type === 'short_term' ? '단기' : '장기'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Metrics */}
                  {insight.metrics && (
                    <div className="flex gap-4 pt-2">
                      <div className="text-center">
                        <p className="text-xs text-neutral-gray">영향도</p>
                        <p className="text-lg font-bold text-primary-main">
                          {Math.round(insight.metrics.impact)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-neutral-gray">신뢰도</p>
                        <p className="text-lg font-bold text-accent-indigo">
                          {Math.round(insight.metrics.confidence * 100)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-neutral-gray">관련성</p>
                        <p className="text-lg font-bold text-accent-green">
                          {Math.round(insight.metrics.relevance * 100)}%
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </div>
    </motion.div>
  );
};

// 패턴 목록 컴포넌트
const PatternsList: React.FC<{ patterns: any[]; anomalies: any[] }> = ({ patterns, anomalies }) => {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-neutral-dark mb-3">발견된 패턴</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {patterns.map((pattern, idx) => (
            <div key={idx} className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-dark">
                  {pattern.type.replace(/_/g, ' ').toUpperCase()}
                </span>
                <span className="text-xs px-2 py-1 bg-primary-main/10 text-primary-main rounded-full">
                  신뢰도 {Math.round(pattern.confidence * 100)}%
                </span>
              </div>
              <p className="text-xs text-neutral-gray">
                영향 축: {pattern.affectedAxes.join(', ')}
              </p>
              <p className="text-xs text-neutral-gray mt-1">
                강도: {Math.round(pattern.magnitude)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {anomalies.length > 0 && (
        <div>
          <h4 className="font-semibold text-neutral-dark mb-3">이상 징후</h4>
          <div className="space-y-2">
            {anomalies.map((anomaly, idx) => (
              <div key={idx} className="bg-accent-red/5 rounded-lg p-3 border border-accent-red/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-dark">
                    {anomaly.axis} 축 이상 감지
                  </span>
                  <span className="text-xs px-2 py-1 bg-accent-red/10 text-accent-red rounded-full">
                    심각도 {Math.round(anomaly.severity * 100)}%
                  </span>
                </div>
                <p className="text-xs text-neutral-gray mt-1">
                  {anomaly.description || `${anomaly.method} 방법으로 감지`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 시뮬레이션 결과 컴포넌트
const SimulationResults: React.FC<{ simulation: any }> = ({ simulation }) => {
  if (!simulation) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="시뮬레이션 횟수"
          value={simulation.scenarios?.length || 0}
          unit="회"
          color="primary"
        />
        <StatCard
          label="성공 확률"
          value={Math.round(simulation.statistics?.mean?.GO || 0).toString()}
          unit="%"
          color="green"
        />
        <StatCard
          label="리스크 수준"
          value={simulation.riskMetrics?.correlationRisk ? Math.round(simulation.riskMetrics.correlationRisk * 100).toString() : '0'}
          unit="%"
          color="red"
        />
        <StatCard
          label="신뢰 구간"
          value="95"
          unit="%"
          color="indigo"
        />
      </div>

      {simulation.recommendations && simulation.recommendations.length > 0 && (
        <div>
          <h4 className="font-semibold text-neutral-dark mb-3">시뮬레이션 추천사항</h4>
          <div className="space-y-2">
            {simulation.recommendations.map((rec: any, idx: number) => (
              <div key={idx} className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
                <div className="flex items-center gap-2">
                  <span className={`
                    px-2 py-1 text-xs rounded-full
                    ${rec.impact === 'high' ? 'bg-accent-red/10 text-accent-red' :
                      rec.impact === 'medium' ? 'bg-accent-orange/10 text-accent-orange' :
                      'bg-accent-green/10 text-accent-green'}
                  `}>
                    {rec.impact === 'high' ? '높음' : rec.impact === 'medium' ? '중간' : '낮음'}
                  </span>
                  <p className="text-sm text-neutral-dark flex-1">{rec.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 예측 결과 컴포넌트
const PredictionResults: React.FC<{ prediction: any; goalCalculations: any }> = ({ prediction, goalCalculations }) => {
  return (
    <div className="space-y-4">
      {prediction && (
        <div>
          <h4 className="font-semibold text-neutral-dark mb-3">7일 예측</h4>
          <div className="bg-gradient-to-r from-primary-main/5 to-accent-indigo/5 rounded-lg p-4">
            <div className="grid grid-cols-5 gap-2 mb-3">
              {['GO', 'EC', 'PT', 'PF', 'TO'].map(axis => (
                <div key={axis} className="text-center">
                  <p className="text-xs text-neutral-gray mb-1">{axis}</p>
                  <p className="text-lg font-bold text-primary-main">
                    {prediction.predictions?.[0]?.scores?.[axis] ? Math.round(prediction.predictions[0].scores[axis]) : '-'}
                  </p>
                  <p className="text-xs text-neutral-gray">
                    ±{Math.round((1 - (prediction.predictions?.[0]?.confidence?.[axis] || 0.5)) * 10)}
                  </p>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-neutral-200">
              <p className="text-sm text-neutral-gray">
                전체 정확도: <span className="font-semibold text-primary-main">
                  {Math.round((prediction.accuracy?.overall || 0) * 100)}%
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {goalCalculations && (
        <div>
          <h4 className="font-semibold text-neutral-dark mb-3">목표 달성 계획</h4>
          <div className="space-y-2">
            {goalCalculations.requiredChanges?.slice(0, 3).map((change: any, idx: number) => (
              <div key={idx} className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-dark">{change.axis} 축</span>
                  <span className={`
                    px-2 py-1 text-xs rounded-full
                    ${change.difficulty === 'easy' ? 'bg-accent-green/10 text-accent-green' :
                      change.difficulty === 'moderate' ? 'bg-accent-orange/10 text-accent-orange' :
                      'bg-accent-red/10 text-accent-red'}
                  `}>
                    {change.difficulty === 'easy' ? '쉬움' :
                     change.difficulty === 'moderate' ? '보통' : '어려움'}
                  </span>
                </div>
                <div className="text-xs text-neutral-gray">
                  <p>현재: {Math.round(change.currentScore)} → 목표: {Math.round(change.targetScore)}</p>
                  <p>필요 개선: +{Math.round(change.requiredImprovement)}점 (일일 {Math.round(change.dailyRate * 10) / 10}점)</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 통계 카드 컴포넌트
const StatCard: React.FC<{
  label: string;
  value: string | number;
  unit?: string;
  color: 'primary' | 'green' | 'red' | 'indigo';
}> = ({ label, value, unit, color }) => {
  const colorClasses = {
    primary: 'bg-primary-main/10 text-primary-main',
    green: 'bg-accent-green/10 text-accent-green',
    red: 'bg-accent-red/10 text-accent-red',
    indigo: 'bg-accent-indigo/10 text-accent-indigo'
  };

  return (
    <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
      <p className="text-xs opacity-80 mb-1">{label}</p>
      <p className="text-2xl font-bold">
        {value}
        {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
      </p>
    </div>
  );
};

// 빈 상태 컴포넌트
const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-neutral-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    </div>
    <p className="text-neutral-gray text-sm">{message}</p>
  </div>
);