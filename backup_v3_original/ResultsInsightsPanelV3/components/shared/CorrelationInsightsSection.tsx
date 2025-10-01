/**
 * CorrelationInsightsSection
 * Phase 2C: 상관관계 인사이트 UI 컴포넌트
 * Phase 3.4: 성능 최적화 (React.memo, useMemo)
 *
 * KPI 간 상관관계 및 파생 지표를 시각적으로 표시합니다.
 * - ARPU (사용자당 평균 매출)
 * - Burn Multiple (자본 효율성)
 * - CAC Payback Period (회수 기간)
 * - Growth Efficiency (성장 효율성)
 * - LTV/CAC Ratio (Unit Economics)
 */

import React, { useMemo } from 'react';
import { TrendingUp, DollarSign, Clock, Zap, Target } from 'lucide-react';
import type { CorrelationInsight } from '@/services/analysis/DataAnalysisEngine';

interface CorrelationInsightsSectionProps {
  insights: CorrelationInsight[];
}

/**
 * 인사이트 타입별 아이콘 매핑
 */
const getInsightIcon = (type: CorrelationInsight['type']) => {
  switch (type) {
    case 'unit_economics':
      return DollarSign;
    case 'efficiency':
      return Zap;
    case 'derived_metric':
      return TrendingUp;
    case 'correlation':
      return Target;
    default:
      return TrendingUp;
  }
};

/**
 * 우선순위별 색상 스타일
 */
const getPriorityStyle = (priority: CorrelationInsight['priority']) => {
  switch (priority) {
    case 'critical':
      return {
        bg: 'bg-red-50',
        border: 'border-red-300',
        text: 'text-red-900',
        iconColor: 'text-red-600',
        scoreBg: 'bg-red-100',
        scoreText: 'text-red-700'
      };
    case 'high':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-300',
        text: 'text-orange-900',
        iconColor: 'text-orange-600',
        scoreBg: 'bg-orange-100',
        scoreText: 'text-orange-700'
      };
    case 'medium':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-300',
        text: 'text-blue-900',
        iconColor: 'text-blue-600',
        scoreBg: 'bg-blue-100',
        scoreText: 'text-blue-700'
      };
    case 'low':
      return {
        bg: 'bg-green-50',
        border: 'border-green-300',
        text: 'text-green-900',
        iconColor: 'text-green-600',
        scoreBg: 'bg-green-100',
        scoreText: 'text-green-700'
      };
  }
};

/**
 * 점수 바 표시 컴포넌트
 * Phase 3.4: React.memo로 최적화
 */
const ScoreBar = React.memo<{ score: number; priority: CorrelationInsight['priority'] }>(({
  score,
  priority
}) => {
  const getBarColor = () => {
    if (score >= 75) return 'bg-green-500';
    if (score >= 50) return 'bg-blue-500';
    if (score >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full ${getBarColor()} transition-all duration-300`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
});

/**
 * 개별 인사이트 카드
 * Phase 3.4: React.memo로 최적화
 */
const InsightCard = React.memo<{ insight: CorrelationInsight }>(({ insight }) => {
  const Icon = getInsightIcon(insight.type);
  const style = getPriorityStyle(insight.priority);

  return (
    <div
      className={`${style.bg} border-2 ${style.border} rounded-xl p-5 hover:shadow-md transition-shadow`}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className={`${style.iconColor} bg-white p-2 rounded-lg shadow-sm`}>
            <Icon size={24} />
          </div>
          <div className="flex-1">
            <h4 className={`font-bold ${style.text} text-base mb-1`}>
              {insight.title}
            </h4>
            <p className={`text-2xl font-extrabold ${style.text}`}>
              {insight.description}
            </p>
          </div>
        </div>
      </div>

      {/* 해석 */}
      <p className={`text-sm ${style.text} mb-4 leading-relaxed`}>
        {insight.interpretation}
      </p>

      {/* 점수 바 */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-medium ${style.text}`}>평가 점수</span>
          <span className={`text-xs font-bold ${style.scoreText}`}>
            {insight.score.toFixed(0)}점
          </span>
        </div>
        <ScoreBar score={insight.score} priority={insight.priority} />
      </div>

      {/* 관련 KPI */}
      <div className="flex items-center justify-between text-xs">
        <span className={`${style.text} opacity-75`}>
          관련 KPI: {insight.affectedKPIs.length}개
        </span>
        <span
          className={`px-2 py-1 rounded ${style.scoreBg} ${style.scoreText} font-medium`}
        >
          {insight.priority === 'critical' && '긴급'}
          {insight.priority === 'high' && '높음'}
          {insight.priority === 'medium' && '중간'}
          {insight.priority === 'low' && '낮음'}
        </span>
      </div>
    </div>
  );
});

/**
 * 상관관계 인사이트 섹션 메인 컴포넌트
 * Phase 3.4: React.memo + useMemo로 최적화
 */
export const CorrelationInsightsSection = React.memo<CorrelationInsightsSectionProps>(({
  insights
}) => {
  if (insights.length === 0) {
    return null;
  }

  // 우선순위별로 정렬 (critical > high > medium > low)
  // Phase 3.4: useMemo로 캐싱
  const sortedInsights = useMemo(() => {
    return [...insights].sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [insights]);

  // 평균 점수 계산
  // Phase 3.4: useMemo로 캐싱
  const avgScore = useMemo(() => {
    return insights.reduce((sum, i) => sum + i.score, 0) / insights.length;
  }, [insights]);

  return (
    <div className="space-y-4">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="text-blue-600" size={24} />
            상관관계 인사이트
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            KPI 간 관계를 분석한 파생 지표 및 비즈니스 건강도 평가
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{avgScore.toFixed(0)}점</div>
          <div className="text-xs text-gray-500">평균 점수</div>
        </div>
      </div>

      {/* 인사이트 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedInsights.map((insight, index) => (
          <InsightCard key={index} insight={insight} />
        ))}
      </div>

      {/* 요약 통계 */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-900">{insights.length}</div>
            <div className="text-xs text-blue-600">총 인사이트</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-900">
              {insights.filter((i) => i.priority === 'critical' || i.priority === 'high').length}
            </div>
            <div className="text-xs text-red-600">주의 필요</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-900">
              {insights.filter((i) => i.score >= 75).length}
            </div>
            <div className="text-xs text-green-600">우수 지표</div>
          </div>
        </div>
        <div className="text-xs text-blue-600 font-medium">
          💡 우선순위 높은 인사이트부터 개선하세요
        </div>
      </div>
    </div>
  );
});
