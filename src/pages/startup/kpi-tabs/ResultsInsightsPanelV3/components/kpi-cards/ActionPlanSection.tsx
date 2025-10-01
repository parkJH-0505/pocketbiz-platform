/**
 * ActionPlanSection Component
 * 진단 결과 기반 우선순위별 액션 플랜
 */

import React, { useMemo } from 'react';
import { Lightbulb, AlertTriangle, TrendingUp, Target, CheckCircle, Clock } from 'lucide-react';
import type { ProcessedKPIData } from '@/types/reportV3.types';
import type { ClusterInfo } from '@/types/kpi.types';

interface ActionItem {
  priority: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  rationale: string;
  estimatedImpact: 'high' | 'medium' | 'low';
  timeframe: 'immediate' | 'short-term' | 'mid-term';
  affectedKPIs: string[];
}

interface ActionPlanSectionProps {
  processedData: ProcessedKPIData[];
  cluster: ClusterInfo;
  overallScore: number;
  className?: string;
}

export const ActionPlanSection: React.FC<ActionPlanSectionProps> = ({
  processedData,
  cluster,
  overallScore,
  className = ''
}) => {
  // 액션 아이템 생성
  const actionItems = useMemo<ActionItem[]>(() => {
    const actions: ActionItem[] = [];

    // 1. High-risk KPI 대응 액션 (Critical)
    const highRiskKPIs = processedData.filter(item => item.insights.riskLevel === 'high');
    if (highRiskKPIs.length > 0) {
      const topHighRisk = highRiskKPIs
        .sort((a, b) => b.weight.priority - a.weight.priority)
        .slice(0, 2);

      topHighRisk.forEach(kpi => {
        actions.push({
          priority: 'critical',
          title: `긴급: ${kpi.kpi.question.slice(0, 40)}...`,
          description: `현재 ${kpi.processedValue.normalizedScore.toFixed(1)}점으로 즉각적인 개선이 필요합니다.`,
          rationale: kpi.insights.interpretation || kpi.insights.summary,
          estimatedImpact: 'high',
          timeframe: 'immediate',
          affectedKPIs: [kpi.kpi.question]
        });
      });
    }

    // 2. x3 가중치 KPI 중 낮은 점수 대응 (High)
    const criticalLowScore = processedData
      .filter(item => item.weight.level === 'x3' && item.processedValue.normalizedScore < 60)
      .sort((a, b) => a.processedValue.normalizedScore - b.processedValue.normalizedScore)
      .slice(0, 2);

    criticalLowScore.forEach(kpi => {
      if (!actions.some(a => a.affectedKPIs.includes(kpi.kpi.question))) {
        actions.push({
          priority: 'high',
          title: `핵심 지표 강화: ${kpi.kpi.question.slice(0, 40)}...`,
          description: `x3 가중치 지표로 비즈니스에 큰 영향을 미칩니다. 현재 점수: ${kpi.processedValue.normalizedScore.toFixed(1)}`,
          rationale: `이 지표는 ${cluster.stage} 단계에서 가장 중요한 요소 중 하나입니다.`,
          estimatedImpact: 'high',
          timeframe: 'short-term',
          affectedKPIs: [kpi.kpi.question]
        });
      }
    });

    // 3. 업계 평균 대비 크게 낮은 항목 (High/Medium)
    const belowBenchmark = processedData
      .filter(item => {
        if (!item.benchmarkInfo) return false;
        const diff = item.processedValue.normalizedScore - item.benchmarkInfo.industryAverage;
        return diff < -10;
      })
      .sort((a, b) => {
        const diffA = a.processedValue.normalizedScore - (a.benchmarkInfo?.industryAverage || 0);
        const diffB = b.processedValue.normalizedScore - (b.benchmarkInfo?.industryAverage || 0);
        return diffA - diffB;
      })
      .slice(0, 2);

    belowBenchmark.forEach(kpi => {
      if (!actions.some(a => a.affectedKPIs.includes(kpi.kpi.question))) {
        const diff = kpi.processedValue.normalizedScore - (kpi.benchmarkInfo?.industryAverage || 0);
        actions.push({
          priority: 'high',
          title: `경쟁력 제고: ${kpi.kpi.question.slice(0, 40)}...`,
          description: `업계 평균 대비 ${Math.abs(diff).toFixed(1)}점 낮습니다. 경쟁사 대비 개선이 필요합니다.`,
          rationale: '업계 표준에 부합하는 수준으로 끌어올려 시장 경쟁력을 확보해야 합니다.',
          estimatedImpact: 'medium',
          timeframe: 'short-term',
          affectedKPIs: [kpi.kpi.question]
        });
      }
    });

    // 4. Medium risk 중 개선 여지가 큰 항목 (Medium)
    const mediumRiskHighPotential = processedData
      .filter(item =>
        item.insights.riskLevel === 'medium' &&
        item.processedValue.normalizedScore >= 40 &&
        item.processedValue.normalizedScore < 70
      )
      .sort((a, b) => b.weight.priority - a.weight.priority)
      .slice(0, 3);

    mediumRiskHighPotential.forEach(kpi => {
      if (!actions.some(a => a.affectedKPIs.includes(kpi.kpi.question)) && actions.length < 8) {
        actions.push({
          priority: 'medium',
          title: `성과 향상: ${kpi.kpi.question.slice(0, 40)}...`,
          description: `현재 ${kpi.processedValue.normalizedScore.toFixed(1)}점으로 개선 가능성이 높습니다.`,
          rationale: '적절한 노력으로 빠른 성과 향상을 기대할 수 있는 영역입니다.',
          estimatedImpact: 'medium',
          timeframe: 'mid-term',
          affectedKPIs: [kpi.kpi.question]
        });
      }
    });

    // 5. 전체 점수가 낮을 경우 포괄적 액션
    if (overallScore < 50 && actions.length < 8) {
      actions.push({
        priority: 'high',
        title: '체계적 개선 프로그램 수립',
        description: '전반적인 비즈니스 역량 강화를 위한 종합 개선 계획이 필요합니다.',
        rationale: `현재 전체 점수 ${overallScore.toFixed(1)}점으로 전사적 개선 노력이 필요한 상태입니다.`,
        estimatedImpact: 'high',
        timeframe: 'short-term',
        affectedKPIs: ['전체 영역']
      });
    }

    // 6. 우수 영역 활용 (Medium - 긍정적 액션)
    const excellentKPIs = processedData
      .filter(item => item.processedValue.normalizedScore >= 80)
      .sort((a, b) => b.processedValue.normalizedScore - a.processedValue.normalizedScore)
      .slice(0, 1);

    if (excellentKPIs.length > 0 && actions.length < 8) {
      const topKPI = excellentKPIs[0];
      actions.push({
        priority: 'medium',
        title: `강점 활용: ${topKPI.kpi.question.slice(0, 40)}...`,
        description: `${topKPI.processedValue.normalizedScore.toFixed(1)}점의 우수한 성과를 다른 영역 개선에 활용하세요.`,
        rationale: '검증된 강점 영역의 프로세스와 노하우를 약점 영역에 적용할 수 있습니다.',
        estimatedImpact: 'medium',
        timeframe: 'mid-term',
        affectedKPIs: [topKPI.kpi.question]
      });
    }

    return actions.slice(0, 8); // 최대 8개
  }, [processedData, cluster, overallScore]);

  // 우선순위별 그룹화
  const groupedActions = useMemo(() => {
    return {
      critical: actionItems.filter(a => a.priority === 'critical'),
      high: actionItems.filter(a => a.priority === 'high'),
      medium: actionItems.filter(a => a.priority === 'medium')
    };
  }, [actionItems]);

  const priorityConfig = {
    critical: {
      label: '긴급',
      color: 'red',
      icon: AlertTriangle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      textColor: 'text-red-700',
      badgeBg: 'bg-red-100',
      badgeText: 'text-red-700'
    },
    high: {
      label: '높음',
      color: 'orange',
      icon: TrendingUp,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-300',
      textColor: 'text-orange-700',
      badgeBg: 'bg-orange-100',
      badgeText: 'text-orange-700'
    },
    medium: {
      label: '중간',
      color: 'blue',
      icon: Target,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      textColor: 'text-blue-700',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-700'
    }
  };

  const timeframeConfig = {
    immediate: { label: '즉시', icon: '🔥' },
    'short-term': { label: '1-3개월', icon: '⚡' },
    'mid-term': { label: '3-6개월', icon: '📅' }
  };

  const impactConfig = {
    high: { label: '높음', color: 'text-green-600' },
    medium: { label: '중간', color: 'text-yellow-600' },
    low: { label: '낮음', color: 'text-gray-600' }
  };

  // 액션 카드 렌더링
  const renderActionCard = (action: ActionItem, index: number) => {
    const config = priorityConfig[action.priority];
    const Icon = config.icon;

    return (
      <div
        key={index}
        className={`${config.bgColor} border-2 ${config.borderColor} rounded-xl p-5 hover:shadow-lg transition-shadow`}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={`flex-shrink-0 w-10 h-10 ${config.badgeBg} rounded-lg flex items-center justify-center`}>
              <Icon size={20} className={config.textColor} />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1 leading-tight">
                {action.title}
              </h4>
              <p className="text-sm text-gray-700">
                {action.description}
              </p>
            </div>
          </div>
          <span className={`flex-shrink-0 px-2 py-1 ${config.badgeBg} ${config.badgeText} text-xs font-semibold rounded-full`}>
            {config.label}
          </span>
        </div>

        {/* 근거 */}
        <div className="mb-3 p-3 bg-white bg-opacity-70 rounded-lg">
          <p className="text-xs text-gray-600 mb-1 font-semibold">왜 중요한가</p>
          <p className="text-sm text-gray-800">{action.rationale}</p>
        </div>

        {/* 메타 정보 */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Clock size={14} className="text-gray-500" />
              <span className="text-gray-700">
                {timeframeConfig[action.timeframe].icon} {timeframeConfig[action.timeframe].label}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Target size={14} className="text-gray-500" />
              <span className={`font-medium ${impactConfig[action.estimatedImpact].color}`}>
                영향도: {impactConfig[action.estimatedImpact].label}
              </span>
            </div>
          </div>
        </div>

        {/* 영향받는 KPI */}
        {action.affectedKPIs.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-1">관련 KPI</p>
            <div className="flex flex-wrap gap-1">
              {action.affectedKPIs.slice(0, 2).map((kpi, i) => (
                <span key={i} className="text-xs bg-white px-2 py-1 rounded text-gray-700 truncate max-w-[200px]">
                  {kpi.slice(0, 30)}...
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={className}>
      {/* 섹션 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
            <Lightbulb size={24} className="text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Action Plan
            </h3>
            <p className="text-sm text-gray-600">
              진단 결과 기반 우선순위별 실행 계획 • {actionItems.length}개
            </p>
          </div>
        </div>
        <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-red-600" />
            <span className="text-xs font-semibold text-red-900">긴급</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{groupedActions.critical.length}</p>
        </div>
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-orange-600" />
            <span className="text-xs font-semibold text-orange-900">높음</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{groupedActions.high.length}</p>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Target size={16} className="text-blue-600" />
            <span className="text-xs font-semibold text-blue-900">중간</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{groupedActions.medium.length}</p>
        </div>
      </div>

      {/* 액션 아이템 리스트 */}
      {actionItems.length > 0 ? (
        <div className="space-y-4">
          {actionItems.map((action, index) => renderActionCard(action, index))}
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <CheckCircle size={40} className="mx-auto mb-3 text-green-600" />
          <p className="text-green-800 font-semibold mb-2">모든 영역이 우수합니다!</p>
          <p className="text-sm text-green-700">
            현재 수준을 유지하며 지속적인 개선을 추구하세요.
          </p>
        </div>
      )}

      {/* 하단 안내 */}
      <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-sm text-purple-900 leading-relaxed">
          <strong>💡 실행 가이드:</strong> 긴급 액션부터 순차적으로 진행하되,
          단기 성과가 나올 수 있는 항목과 장기적 개선이 필요한 항목을 균형있게 추진하세요.
          정기적으로 진단을 반복하여 개선 효과를 측정하는 것이 중요합니다.
        </p>
      </div>
    </div>
  );
};