/**
 * DynamicInsights Component
 * 실시간 인사이트 패널 - 스마트한 분석과 추천
 */

import React, { useMemo, useEffect, useState, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertCircle, Target, Lightbulb, BarChart3, Activity, Filter } from 'lucide-react';
import { useV2Store } from '../store/useV2Store';
import type { AxisKey } from '../types';

interface InsightCard {
  id: string;
  type: 'trend' | 'alert' | 'opportunity' | 'achievement';
  axis: AxisKey;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  priority: number;
  priorityScore: number; // 정확한 우선순위 점수
  urgency: 'immediate' | 'high' | 'medium' | 'low';
  confidence: number; // 인사이트 신뢰도 (0-100)
  actionable: boolean;
  tags: string[]; // 분류 태그
  metrics: {
    current: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  recommendations: {
    primary: string;
    secondary?: string;
    timeline: string;
  };
}

const DynamicInsightsComponent: React.FC = () => {
  const { data, simulation, viewState } = useV2Store();
  const [activeInsights, setActiveInsights] = useState<InsightCard[]>([]);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'immediate' | 'high' | 'medium' | 'low'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'alert' | 'opportunity' | 'achievement' | 'trend'>('all');

  // 카드 확장/축소 핸들러 - useCallback으로 최적화
  const handleCardExpansion = useCallback((cardId: string) => {
    setExpandedCard(prev => prev === cardId ? null : cardId);
  }, []);

  // 축 정보 매핑 - 메모이제이션으로 재생성 방지
  const axisInfo = useMemo(() => ({
    GO: { label: '시장진출', color: '#10b981', description: '시장 접근성과 진입 전략' },
    EC: { label: '수익구조', color: '#f59e0b', description: '비즈니스 모델의 수익성' },
    PT: { label: '제품경쟁력', color: '#8b5cf6', description: '제품/서비스의 차별화와 혁신' },
    PF: { label: '성과지표', color: '#ef4444', description: '핵심 성과 지표와 측정' },
    TO: { label: '팀조직', color: '#06b6d4', description: '조직 역량과 팀워크' }
  }), []);

  // 우선순위 점수 계산 함수
  const calculatePriorityScore = useCallback((
    impact: 'high' | 'medium' | 'low',
    changeAmount: number,
    currentScore: number,
    type: InsightCard['type']
  ): { priorityScore: number; urgency: InsightCard['urgency']; confidence: number } => {
    let baseScore = 0;
    let urgency: InsightCard['urgency'] = 'low';
    let confidence = 70; // 기본 신뢰도

    // 1. 영향도 기반 점수
    const impactScores = { high: 80, medium: 50, low: 20 };
    baseScore += impactScores[impact];

    // 2. 변화량 기반 점수
    const changeScore = Math.min(Math.abs(changeAmount) * 2, 40);
    baseScore += changeScore;

    // 3. 현재 점수에 따른 가중치
    if (currentScore < 30) {
      baseScore += 30; // 위험 구간
      urgency = 'immediate';
      confidence += 15;
    } else if (currentScore < 50) {
      baseScore += 20; // 주의 구간
      urgency = 'high';
      confidence += 10;
    } else if (currentScore > 85) {
      baseScore += 15; // 우수 구간 유지 중요
      urgency = 'medium';
      confidence += 5;
    }

    // 4. 인사이트 타입별 가중치
    const typeMultipliers = {
      alert: 1.3,
      opportunity: 1.1,
      achievement: 0.9,
      trend: 1.0
    };
    baseScore *= typeMultipliers[type];

    // 5. 긴급도 결정
    if (baseScore > 120) urgency = 'immediate';
    else if (baseScore > 80) urgency = 'high';
    else if (baseScore > 50) urgency = 'medium';

    return {
      priorityScore: Math.min(baseScore, 150),
      urgency,
      confidence: Math.min(confidence, 95)
    };
  }, []);

  // 개선된 동적 인사이트 생성 엔진 - 데이터 변경 시에만 재계산
  const generateInsights = useMemo(() => {
    if (!data) return [];

    const insights: InsightCard[] = [];
    const axes = Object.keys(data.current.scores) as AxisKey[];
    const overallScore = data.current.overall || 0;
    const scoreStandardization = {
      excellent: 85, // 우수 기준
      good: 70,      // 양호 기준
      average: 50,   // 평균 기준
      poor: 30       // 미흡 기준
    };

    // 1. 상세 트렌드 분석 (개선된 알고리즘)
    axes.forEach((axis) => {
      const currentScore = data.current.scores[axis];
      const change = data.changes[axis];
      const previousScore = data.previous.scores[axis];
      const changePercentage = previousScore > 0 ? (change / previousScore) * 100 : 0;

      // 유의미한 변화 감지 (개선된 임계값)
      if (Math.abs(change) > 3 || Math.abs(changePercentage) > 8) {
        const isMajorChange = Math.abs(change) > 8 || Math.abs(changePercentage) > 15;
        const trend = change > 1 ? 'up' : change < -1 ? 'down' : 'stable';

        let impactLevel: 'high' | 'medium' | 'low';
        let actionableAdvice = '';

        if (change > 0) {
          // 긍정적 변화
          impactLevel = isMajorChange ? 'high' : change > 5 ? 'medium' : 'low';
          actionableAdvice = currentScore > scoreStandardization.good
            ? '이 수준을 유지하고 다른 영역으로 확산하세요'
            : '지속적인 개선 노력이 필요합니다';
        } else {
          // 부정적 변화
          impactLevel = 'high'; // 하락은 항상 주의 필요
          actionableAdvice = currentScore > scoreStandardization.average
            ? '원인 분석 및 즉시 개선 계획 수립'
            : '전면적인 재검토와 개선 전략 필요';
        }

        const priorityData = calculatePriorityScore(impactLevel, change, currentScore, change > 0 ? 'achievement' : 'alert');

        insights.push({
          id: `trend-${axis}`,
          type: change > 0 ? 'achievement' : 'alert',
          axis,
          title: `${axisInfo[axis].label} ${isMajorChange ? '주요' : ''} ${change > 0 ? '성장' : '하락'} 감지`,
          description: `${changePercentage !== 0 ? `${Math.round(Math.abs(changePercentage))}% ` : ''}${change > 0 ? '상승' : '하락'} (${Math.round(Math.abs(change))}점). ${actionableAdvice}`,
          impact: impactLevel,
          priority: Math.round(priorityData.priorityScore / 15), // 기존 호환성을 위해 1-10 스케일로 변환
          priorityScore: priorityData.priorityScore,
          urgency: priorityData.urgency,
          confidence: priorityData.confidence,
          actionable: true,
          tags: [
            change > 0 ? 'growth' : 'decline',
            isMajorChange ? 'major-change' : 'minor-change',
            axisInfo[axis].label
          ],
          metrics: { current: currentScore, change, trend },
          recommendations: {
            primary: actionableAdvice,
            secondary: change > 0
              ? '다른 영역으로의 확산 전략을 검토하세요'
              : '근본 원인 분석을 통한 개선 방안 모색',
            timeline: priorityData.urgency === 'immediate' ? '즉시' :
                     priorityData.urgency === 'high' ? '1주일 내' : '2주일 내'
          }
        });
      }

      // 2. 기회 영역 식별 (더 정교한 분석)
      if (currentScore < scoreStandardization.good) {
        const potentialGain = scoreStandardization.good - currentScore;
        const isQuickWin = change >= 0 && currentScore > scoreStandardization.average;

        const oppImpact = potentialGain > 20 ? 'high' : potentialGain > 10 ? 'medium' : 'low';
        const oppPriorityData = calculatePriorityScore(oppImpact, potentialGain, currentScore, 'opportunity');

        insights.push({
          id: `opportunity-${axis}`,
          type: 'opportunity',
          axis,
          title: `${axisInfo[axis].label} ${isQuickWin ? '빠른 성과' : '전략적'} 개선 기회`,
          description: `현재 ${Math.round(currentScore)}점에서 ${scoreStandardization.good}점까지 ${Math.round(potentialGain)}점 개선 가능. ${isQuickWin ? '단기간 집중 투자 추천' : '장기 전략 수립 필요'}.`,
          impact: oppImpact,
          priority: Math.round(oppPriorityData.priorityScore / 15),
          priorityScore: oppPriorityData.priorityScore,
          urgency: oppPriorityData.urgency,
          confidence: oppPriorityData.confidence,
          actionable: true,
          tags: [
            'opportunity',
            isQuickWin ? 'quick-win' : 'strategic',
            axisInfo[axis].label
          ],
          metrics: { current: currentScore, change, trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable' },
          recommendations: {
            primary: isQuickWin ? '단기 집중 투자로 빠른 성과 추진' : '장기 전략적 접근 필요',
            secondary: '팀 역량과 리소스 우선순위 검토',
            timeline: isQuickWin ? '1개월 내' : '3개월 내'
          }
        });
      }

      // 3. 고성과 영역 모니터링 (위험 감지)
      if (currentScore > scoreStandardization.good && change < -3) {
        const riskLevel = currentScore > scoreStandardization.excellent ? 'critical' : 'warning';
        insights.push({
          id: `alert-${axis}`,
          type: 'alert',
          axis,
          title: `${axisInfo[axis].label} ${riskLevel === 'critical' ? '우수 성과' : '양호 성과'} 하락 위험`,
          description: `기존 ${riskLevel === 'critical' ? '우수' : '양호'} 영역에서 ${Math.round(Math.abs(change))}점 하락. ${riskLevel === 'critical' ? '즉시 원인 분석 및 대응 필요' : '지속 모니터링 및 예방 조치 강화'}.`,
          impact: 'high',
          priority: 120 + Math.abs(change) + (riskLevel === 'critical' ? 30 : 0),
          actionable: true,
          metrics: { current: currentScore, change, trend: 'down' }
        });
      }

      // 4. 우수 성과 인정 및 베스트 프랙티스 공유
      if (currentScore >= scoreStandardization.excellent && change >= 0) {
        insights.push({
          id: `achievement-${axis}`,
          type: 'achievement',
          axis,
          title: `${axisInfo[axis].label} 베스트 프랙티스 달성`,
          description: `${Math.round(currentScore)}점으로 상위 5% 수준 달성. 이 성공 요인을 다른 영역에도 적용하여 시너지 효과를 기대할 수 있습니다.`,
          impact: 'medium',
          priority: currentScore + (change > 0 ? 20 : 0),
          actionable: false,
          metrics: { current: currentScore, change, trend: change > 0 ? 'up' : 'stable' }
        });
      }
    });

    // 5. 전체적 전략 인사이트 추가
    if (axes.length >= 3) {
      const topPerformers = axes.filter(axis => data.current.scores[axis] >= scoreStandardization.good);
      const underPerformers = axes.filter(axis => data.current.scores[axis] < scoreStandardization.average);
      const balanceScore = Math.min(...axes.map(axis => data.current.scores[axis]));

      if (underPerformers.length >= 2) {
        insights.push({
          id: 'strategic-focus',
          type: 'opportunity',
          axis: underPerformers[0], // 주요 개선 대상
          title: '전략적 집중 개선 기회',
          description: `${underPerformers.length}개 영역에서 동시 개선 기회 발견. 단계적 집중 개선으로 시너지 효과 기대.`,
          impact: 'high',
          priority: 200,
          actionable: true,
          metrics: { current: balanceScore, change: 0, trend: 'stable' }
        });
      }

      if (topPerformers.length >= 3 && underPerformers.length <= 1) {
        insights.push({
          id: 'market-leadership',
          type: 'achievement',
          axis: topPerformers[0],
          title: '시장 리더십 달성 경로',
          description: `${topPerformers.length}개 영역에서 우수 성과. 전체 균형 있는 성장으로 시장 리더 지위 확보 가능.`,
          impact: 'high',
          priority: 150,
          actionable: false,
          metrics: { current: overallScore, change: 0, trend: 'up' }
        });
      }
    }

    // 고도화된 우선순위 시스템
    const prioritizedInsights = insights
      .sort((a, b) => {
        // 1차: 긴급도별 정렬 (immediate > high > medium > low)
        const urgencyWeight = { immediate: 4, high: 3, medium: 2, low: 1 };
        const aUrgency = (a as any).urgency || 'low';
        const bUrgency = (b as any).urgency || 'low';

        if (urgencyWeight[aUrgency] !== urgencyWeight[bUrgency]) {
          return urgencyWeight[bUrgency] - urgencyWeight[aUrgency];
        }

        // 2차: 정확한 우선순위 점수 (priorityScore)
        const aPriorityScore = (a as any).priorityScore || a.priority * 15;
        const bPriorityScore = (b as any).priorityScore || b.priority * 15;

        if (Math.abs(aPriorityScore - bPriorityScore) > 10) {
          return bPriorityScore - aPriorityScore;
        }

        // 3차: 신뢰도 (confidence)
        const aConfidence = (a as any).confidence || 70;
        const bConfidence = (b as any).confidence || 70;

        if (Math.abs(aConfidence - bConfidence) > 5) {
          return bConfidence - aConfidence;
        }

        // 4차: 영향도별 정렬 (high > medium > low)
        const impactWeight = { high: 3, medium: 2, low: 1 };
        return impactWeight[b.impact] - impactWeight[a.impact];
      })
      .filter((insight, index, array) => {
        // 스마트 중복 제거: 동일 axis에 대해 우선순위 높은 것만 유지
        const sameAxisInsights = array.filter(item => item.axis === insight.axis && item.type !== 'trend');
        if (sameAxisInsights.length > 1) {
          const sortedSameAxis = sameAxisInsights.sort((a, b) => {
            const aPriorityScore = (a as any).priorityScore || a.priority * 15;
            const bPriorityScore = (b as any).priorityScore || b.priority * 15;
            return bPriorityScore - aPriorityScore;
          });
          return sortedSameAxis.indexOf(insight) === 0; // 최고 우선순위만 유지
        }
        return true;
      })
      .slice(0, 10); // 표시 인사이트 개수 증가

    return prioritizedInsights;
  }, [data, calculatePriorityScore]);

  // 필터링된 인사이트 계산
  const filteredInsights = useMemo(() => {
    let filtered = generateInsights;

    // 우선순위 필터
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(insight => {
        const urgency = (insight as any).urgency || 'low';
        return urgency === priorityFilter;
      });
    }

    // 타입 필터
    if (typeFilter !== 'all') {
      filtered = filtered.filter(insight => insight.type === typeFilter);
    }

    return filtered;
  }, [generateInsights, priorityFilter, typeFilter]);

  useEffect(() => {
    setActiveInsights(filteredInsights);
  }, [filteredInsights]);

  // 카드 타입별 스타일
  const getCardStyle = (insight: InsightCard) => {
    const baseStyle = "p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg";

    switch (insight.type) {
      case 'trend':
        return `${baseStyle} bg-blue-50 border-blue-200 hover:bg-blue-100`;
      case 'alert':
        return `${baseStyle} bg-red-50 border-red-200 hover:bg-red-100`;
      case 'opportunity':
        return `${baseStyle} bg-green-50 border-green-200 hover:bg-green-100`;
      case 'achievement':
        return `${baseStyle} bg-purple-50 border-purple-200 hover:bg-purple-100`;
      default:
        return `${baseStyle} bg-gray-50 border-gray-200 hover:bg-gray-100`;
    }
  };

  // 아이콘 선택
  const getIcon = (insight: InsightCard) => {
    switch (insight.type) {
      case 'trend':
        return insight.metrics.trend === 'up' ? TrendingUp : TrendingDown;
      case 'alert':
        return AlertCircle;
      case 'opportunity':
        return Lightbulb;
      case 'achievement':
        return Target;
      default:
        return BarChart3;
    }
  };

  // 임팩트 색상
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-dark">스마트 인사이트</h3>
          <p className="text-sm text-neutral-gray">강화된 AI 분석 엔진 · 전략적 추천</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-gray">
          <Activity size={16} />
          <span>실시간 업데이트</span>
        </div>
      </div>

      {/* 필터링 컨트롤 */}
      <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">필터:</span>
        </div>

        {/* 우선순위 필터 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">긴급도:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-main"
          >
            <option value="all">전체</option>
            <option value="immediate">즉시</option>
            <option value="high">높음</option>
            <option value="medium">보통</option>
            <option value="low">낮음</option>
          </select>
        </div>

        {/* 타입 필터 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">유형:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-main"
          >
            <option value="all">전체</option>
            <option value="alert">경고</option>
            <option value="opportunity">기회</option>
            <option value="achievement">성과</option>
            <option value="trend">트렌드</option>
          </select>
        </div>

        {/* 결과 카운트 */}
        <div className="ml-auto text-xs text-gray-500">
          {activeInsights.length}개 인사이트 표시
        </div>
      </div>

      {/* 인사이트 카드들 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatePresence>
          {activeInsights.map((insight, index) => {
            const Icon = getIcon(insight);
            const axisColor = axisInfo[insight.axis].color;
            const isExpanded = expandedCard === insight.id;

            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={getCardStyle(insight)}
                onClick={() => handleCardExpansion(insight.id)}
              >
                {/* 카드 헤더 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: axisColor + '20', color: axisColor }}
                    >
                      <Icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-neutral-dark text-sm">
                        {insight.title}
                      </h4>
                      <p className="text-xs text-neutral-gray">
                        {axisInfo[insight.axis].label}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {/* 긴급도 뱃지 */}
                    {(insight as any).urgency && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (insight as any).urgency === 'immediate' ? 'bg-red-100 text-red-700' :
                        (insight as any).urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                        (insight as any).urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {(insight as any).urgency === 'immediate' ? '즉시' :
                         (insight as any).urgency === 'high' ? '높음' :
                         (insight as any).urgency === 'medium' ? '보통' : '낮음'}
                      </span>
                    )}

                    {/* 임팩트 뱃지 */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(insight.impact)}`}>
                      {insight.impact === 'high' ? '높음' : insight.impact === 'medium' ? '보통' : '낮음'}
                    </span>

                    {/* 신뢰도 표시 */}
                    {(insight as any).confidence && (
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-1 bg-gray-200 rounded">
                          <div
                            className="h-full bg-blue-500 rounded"
                            style={{ width: `${(insight as any).confidence}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{(insight as any).confidence}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 메트릭스 표시 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-2xl font-bold" style={{ color: axisColor }}>
                        {insight.metrics.current}
                      </span>
                      <span className="text-sm text-neutral-gray ml-1">점</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {insight.metrics.trend === 'up' ? (
                        <TrendingUp size={16} className="text-green-500" />
                      ) : insight.metrics.trend === 'down' ? (
                        <TrendingDown size={16} className="text-red-500" />
                      ) : (
                        <div className="w-4 h-4 bg-neutral-border rounded" />
                      )}
                      <span className={`text-sm font-medium ${
                        insight.metrics.change > 0 ? 'text-green-600' :
                        insight.metrics.change < 0 ? 'text-accent-red' : 'text-neutral-gray'
                      }`}>
                        {insight.metrics.change > 0 ? '+' : ''}{insight.metrics.change}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 설명 */}
                <p className="text-sm text-neutral-dark mb-3">
                  {insight.description}
                </p>

                {/* 확장 컨텐츠 */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t pt-3 mt-3"
                    >
                      {/* 상세 분석 */}
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm text-neutral-dark">상세 분석</h5>
                        <div className="text-xs text-neutral-gray space-y-1">
                          <p>• 현재 성과: {insight.metrics.current}점 ({axisInfo[insight.axis].description})</p>
                          <p>• 변화량: {insight.metrics.change > 0 ? '+' : ''}{insight.metrics.change}점</p>
                          <p>• 우선순위: {insight.priority}</p>
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      {insight.actionable && (
                        <div className="mt-3 pt-3 border-t">
                          <button
                            className="w-full py-2 px-3 bg-white border border-neutral-border rounded-lg text-sm font-medium text-neutral-gray hover:bg-neutral-light transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              // 시뮬레이션 모드로 전환하는 로직 추가
                              console.log('시뮬레이션 시작:', insight.axis);
                            }}
                          >
                            개선 시뮬레이션 실행
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 빈 상태 */}
      {activeInsights.length === 0 && (
        <div className="text-center py-8 text-neutral-gray">
          <BarChart3 size={48} className="mx-auto mb-3 text-neutral-border" />
          <p>분석할 데이터가 부족합니다.</p>
          <p className="text-sm">더 많은 데이터가 누적되면 인사이트가 표시됩니다.</p>
        </div>
      )}
    </div>
  );
};

// React.memo로 감싸서 export - props가 없는 컴포넌트이므로 store 상태 변경만 감지
export const DynamicInsights = memo(DynamicInsightsComponent);