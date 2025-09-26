/**
 * SmartRecommendations Component
 * AI 기반 스마트 추천 시스템
 */

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb, Target, TrendingUp, AlertTriangle, Star,
  CheckCircle, Clock, ArrowRight, Zap, Brain
} from 'lucide-react';
import { useV2Store } from '../store/useV2Store';
import type { AxisKey } from '../types';

interface Recommendation {
  id: string;
  type: 'improvement' | 'optimization' | 'risk_mitigation' | 'opportunity';
  axis: AxisKey;
  title: string;
  description: string;
  impact: {
    score: number;
    confidence: number;
    timeframe: 'short' | 'medium' | 'long';
  };
  difficulty: 'easy' | 'medium' | 'hard';
  priority: number;
  actions: string[];
  prerequisites?: string[];
  expectedOutcome: string;
  relevantMetrics: string[];
}

export const SmartRecommendations: React.FC = () => {
  const { data, simulation, viewState } = useV2Store();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'high_impact' | 'quick_wins' | 'strategic'>('all');
  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const [implementedRecs, setImplementedRecs] = useState<Set<string>>(new Set());

  // 축 정보
  const axisInfo = {
    GO: { label: '시장진출', color: '#10b981' },
    EC: { label: '수익구조', color: '#f59e0b' },
    PT: { label: '제품경쟁력', color: '#8b5cf6' },
    PF: { label: '성과지표', color: '#ef4444' },
    TO: { label: '팀조직', color: '#06b6d4' }
  };

  // 스마트 추천 생성 알고리즘
  const generateRecommendations = useMemo(() => {
    if (!data) return [];

    const recommendations: Recommendation[] = [];
    const axes = Object.keys(data.current.scores) as AxisKey[];

    axes.forEach((axis) => {
      const currentScore = data.current.scores[axis];
      const change = data.changes[axis];
      const previousScore = data.previous.scores[axis];

      // 1. 개선 필요 영역 (점수 낮음)
      if (currentScore < 60) {
        recommendations.push({
          id: `improve-${axis}`,
          type: 'improvement',
          axis,
          title: `${axisInfo[axis].label} 핵심 역량 강화`,
          description: `현재 ${currentScore}점으로 시급한 개선이 필요한 영역입니다. 집중적인 투자와 전략적 접근을 통해 단기간에 큰 성과를 낼 수 있습니다.`,
          impact: {
            score: Math.min(25, 60 - currentScore),
            confidence: 85,
            timeframe: currentScore < 40 ? 'medium' : 'short'
          },
          difficulty: currentScore < 30 ? 'hard' : 'medium',
          priority: (60 - currentScore) * 10,
          actions: getImprovementActions(axis, currentScore),
          expectedOutcome: `${Math.min(75, currentScore + 15)}점까지 향상 예상`,
          relevantMetrics: getRelevantMetrics(axis)
        });
      }

      // 2. 최적화 기회 (점수 보통, 상승세)
      if (currentScore >= 60 && currentScore < 80 && change >= 0) {
        recommendations.push({
          id: `optimize-${axis}`,
          type: 'optimization',
          axis,
          title: `${axisInfo[axis].label} 성과 최적화`,
          description: `안정적인 성과를 보이는 영역입니다. 세부 프로세스 개선을 통해 더 높은 수준으로 도약할 수 있습니다.`,
          impact: {
            score: Math.min(15, 85 - currentScore),
            confidence: 75,
            timeframe: 'medium'
          },
          difficulty: 'medium',
          priority: currentScore + (change * 5),
          actions: getOptimizationActions(axis),
          expectedOutcome: `${Math.min(85, currentScore + 10)}점까지 향상 예상`,
          relevantMetrics: getRelevantMetrics(axis)
        });
      }

      // 3. 위험 완화 (높은 점수에서 하락)
      if (currentScore >= 70 && change < -3) {
        recommendations.push({
          id: `risk-${axis}`,
          type: 'risk_mitigation',
          axis,
          title: `${axisInfo[axis].label} 성과 하락 방지`,
          description: `우수했던 성과에서 하락세가 감지되었습니다. 즉시 원인을 파악하고 대응책을 마련해야 합니다.`,
          impact: {
            score: Math.abs(change) * 2,
            confidence: 90,
            timeframe: 'short'
          },
          difficulty: 'easy',
          priority: 100 + Math.abs(change) * 5,
          actions: getRiskMitigationActions(axis, change),
          expectedOutcome: '현재 수준 유지 및 안정화',
          relevantMetrics: getRelevantMetrics(axis)
        });
      }

      // 4. 기회 포착 (높은 점수, 지속 상승)
      if (currentScore >= 80 && change > 2) {
        recommendations.push({
          id: `opportunity-${axis}`,
          type: 'opportunity',
          axis,
          title: `${axisInfo[axis].label} 우위 확대`,
          description: `뛰어난 성과를 보이는 강점 영역입니다. 이 우위를 더욱 확대하여 경쟁력을 극대화할 수 있습니다.`,
          impact: {
            score: Math.min(10, 100 - currentScore),
            confidence: 70,
            timeframe: 'long'
          },
          difficulty: 'easy',
          priority: currentScore + change * 3,
          actions: getOpportunityActions(axis),
          expectedOutcome: '시장 선도적 지위 확립',
          relevantMetrics: getRelevantMetrics(axis)
        });
      }
    });

    // 우선순위로 정렬하고 상위 8개 반환
    return recommendations
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 8);
  }, [data]);

  // 카테고리별 필터링
  const filteredRecommendations = useMemo(() => {
    switch (selectedCategory) {
      case 'high_impact':
        return generateRecommendations.filter(rec => rec.impact.score >= 15);
      case 'quick_wins':
        return generateRecommendations.filter(rec =>
          rec.difficulty === 'easy' && rec.impact.timeframe === 'short'
        );
      case 'strategic':
        return generateRecommendations.filter(rec =>
          rec.impact.timeframe === 'long' || rec.difficulty === 'hard'
        );
      default:
        return generateRecommendations;
    }
  }, [generateRecommendations, selectedCategory]);

  // 구현 상태 토글
  const toggleImplementation = (recId: string) => {
    const newImplemented = new Set(implementedRecs);
    if (newImplemented.has(recId)) {
      newImplemented.delete(recId);
    } else {
      newImplemented.add(recId);
    }
    setImplementedRecs(newImplemented);
  };

  // 추천 타입별 아이콘
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'improvement': return Target;
      case 'optimization': return TrendingUp;
      case 'risk_mitigation': return AlertTriangle;
      case 'opportunity': return Star;
      default: return Lightbulb;
    }
  };

  // 난이도별 색상
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 시간프레임별 색상
  const getTimeframeColor = (timeframe: string) => {
    switch (timeframe) {
      case 'short': return 'text-blue-600';
      case 'medium': return 'text-purple-600';
      case 'long': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI 추천</h3>
            <p className="text-sm text-gray-600">데이터 기반 개선 제안</p>
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
          {[
            { key: 'all', label: '전체' },
            { key: 'high_impact', label: '고임팩트' },
            { key: 'quick_wins', label: '빠른성과' },
            { key: 'strategic', label: '전략적' }
          ].map((category) => (
            <button
              key={category.key}
              onClick={() => setSelectedCategory(category.key as any)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedCategory === category.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* 추천 목록 */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredRecommendations.map((rec, index) => {
            const Icon = getTypeIcon(rec.type);
            const axisColor = axisInfo[rec.axis].color;
            const isExpanded = expandedRec === rec.id;
            const isImplemented = implementedRecs.has(rec.id);

            return (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`border-2 rounded-xl transition-all duration-300 hover:shadow-lg ${
                  isImplemented
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedRec(isExpanded ? null : rec.id)}
                >
                  {/* 헤더 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: axisColor + '20', color: axisColor }}
                      >
                        <Icon size={18} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">
                          {rec.title}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {axisInfo[rec.axis].label} • 우선순위 {rec.priority.toFixed(0)}
                        </p>
                      </div>
                    </div>

                    {/* 구현 체크박스 */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleImplementation(rec.id);
                        }}
                        className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                          isImplemented
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        <CheckCircle size={12} />
                        {isImplemented ? '완료' : '계획'}
                      </button>
                    </div>
                  </div>

                  {/* 메트릭스 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      {/* 예상 점수 향상 */}
                      <div className="flex items-center gap-1">
                        <TrendingUp size={14} className="text-green-500" />
                        <span className="text-sm font-medium text-green-600">
                          +{rec.impact.score}점
                        </span>
                      </div>

                      {/* 신뢰도 */}
                      <div className="flex items-center gap-1">
                        <Zap size={14} className="text-blue-500" />
                        <span className="text-sm text-blue-600">
                          {rec.impact.confidence}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* 난이도 */}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(rec.difficulty)}`}>
                        {rec.difficulty === 'easy' ? '쉬움' : rec.difficulty === 'medium' ? '보통' : '어려움'}
                      </span>

                      {/* 시간프레임 */}
                      <div className={`flex items-center gap-1 ${getTimeframeColor(rec.impact.timeframe)}`}>
                        <Clock size={12} />
                        <span className="text-xs font-medium">
                          {rec.impact.timeframe === 'short' ? '단기' : rec.impact.timeframe === 'medium' ? '중기' : '장기'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 설명 */}
                  <p className="text-sm text-gray-700">
                    {rec.description}
                  </p>
                </div>

                {/* 확장 컨텐츠 */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t bg-gray-50 p-4"
                    >
                      {/* 실행 계획 */}
                      <div className="mb-4">
                        <h5 className="font-medium text-sm text-gray-900 mb-2 flex items-center gap-1">
                          <ArrowRight size={14} />
                          실행 계획
                        </h5>
                        <ul className="space-y-1">
                          {rec.actions.map((action, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-gray-400 mt-1">•</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 예상 성과 */}
                      <div className="mb-4">
                        <h5 className="font-medium text-sm text-gray-900 mb-2">예상 성과</h5>
                        <p className="text-sm text-gray-700">{rec.expectedOutcome}</p>
                      </div>

                      {/* 관련 지표 */}
                      <div>
                        <h5 className="font-medium text-sm text-gray-900 mb-2">관련 지표</h5>
                        <div className="flex flex-wrap gap-1">
                          {rec.relevantMetrics.map((metric, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs bg-white rounded-md text-gray-600"
                            >
                              {metric}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 빈 상태 */}
      {filteredRecommendations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Brain size={48} className="mx-auto mb-3 text-gray-300" />
          <p>해당 카테고리에 추천사항이 없습니다.</p>
        </div>
      )}

      {/* 구현 진행률 */}
      {implementedRecs.size > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-900">구현 진행률</span>
            <span className="text-sm text-gray-600">
              {implementedRecs.size} / {generateRecommendations.length}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
              style={{ width: `${(implementedRecs.size / generateRecommendations.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// 헬퍼 함수들
function getImprovementActions(axis: AxisKey, score: number): string[] {
  const actions: Record<AxisKey, string[]> = {
    GO: ['시장 조사 강화', '고객 세그먼트 재정의', '진입 전략 수정', '파트너십 구축'],
    EC: ['수익 모델 분석', '비용 구조 최적화', '가격 전략 재검토', '새로운 수익원 발굴'],
    PT: ['제품 차별화 강화', 'R&D 투자 확대', '사용자 피드백 반영', '품질 개선'],
    PF: ['KPI 재정의', '측정 방법 개선', '데이터 수집 강화', '성과 분석 체계 구축'],
    TO: ['팀 역량 강화', '조직 구조 개선', '커뮤니케이션 체계 구축', '인재 영입']
  };
  return actions[axis] || [];
}

function getOptimizationActions(axis: AxisKey): string[] {
  const actions: Record<AxisKey, string[]> = {
    GO: ['시장 점유율 확대', '브랜딩 강화', '고객 충성도 제고', '채널 다변화'],
    EC: ['수익성 극대화', '운영 효율성 개선', '투자 수익률 향상', '재무 건전성 강화'],
    PT: ['기능 고도화', '사용자 경험 개선', '기술 혁신 지속', '경쟁 우위 유지'],
    PF: ['지표 고도화', '예측 정확도 향상', '실시간 모니터링', '벤치마킹 강화'],
    TO: ['팀 생산성 향상', '협업 문화 강화', '리더십 개발', '조직 학습 촉진']
  };
  return actions[axis] || [];
}

function getRiskMitigationActions(axis: AxisKey, change: number): string[] {
  const actions: Record<AxisKey, string[]> = {
    GO: ['고객 이탈 분석', '경쟁사 동향 파악', '시장 변화 대응', '위기 대응 계획'],
    EC: ['비용 증가 요인 분석', '수익 감소 원인 파악', '재무 리스크 관리', '현금 흐름 개선'],
    PT: ['제품 결함 점검', '고객 불만 분석', '기술 트렌드 추적', '품질 보증 강화'],
    PF: ['지표 이상 원인 분석', '데이터 품질 점검', '측정 오류 확인', '모니터링 강화'],
    TO: ['팀 갈등 해결', '이직률 관리', '동기부여 방안', '조직 안정성 확보']
  };
  return actions[axis] || [];
}

function getOpportunityActions(axis: AxisKey): string[] {
  const actions: Record<AxisKey, string[]> = {
    GO: ['시장 리더십 확립', '글로벌 확장 검토', '생태계 구축', '산업 표준 선도'],
    EC: ['사업 다각화', '투자 확대', '수익 모델 혁신', '가치 창출 극대화'],
    PT: ['혁신 기술 도입', '특허 포트폴리오 구축', '플랫폼 확장', '차세대 제품 개발'],
    PF: ['성과 관리 고도화', '예측 분석 도입', 'AI 활용 확대', '데이터 드리븐 경영'],
    TO: ['조직 역량 확장', '인재 생태계 구축', '문화 혁신 선도', '학습 조직 완성']
  };
  return actions[axis] || [];
}

function getRelevantMetrics(axis: AxisKey): string[] {
  const metrics: Record<AxisKey, string[]> = {
    GO: ['시장점유율', '고객획득비용', '브랜드인지도', '진입장벽'],
    EC: ['매출성장률', '영업이익률', '투자수익률', '현금흐름'],
    PT: ['고객만족도', '재구매율', '혁신지수', '품질점수'],
    PF: ['KPI달성률', '데이터품질', '예측정확도', '대응속도'],
    TO: ['팀생산성', '직원만족도', '이직률', '협업지수']
  };
  return metrics[axis] || [];
}