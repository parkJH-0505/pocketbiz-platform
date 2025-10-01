/**
 * ScenarioComparison Component
 * 시나리오 비교 분석 뷰 - 다중 시나리오 비교 및 분석
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Eye,
  EyeOff,
  Download,
  Shuffle,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  RefreshCw
} from 'lucide-react';
import { useV2Store } from '../store/useV2Store';
import type { AxisKey } from '../types';

interface Scenario {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  author: string;
  tags: string[];
  isFavorite: boolean;
  isPublic: boolean;
  data: {
    scores: Record<AxisKey, number>;
    overall: number;
    simulationAdjustments?: any;
    viewState?: any;
  };
  metadata: {
    version: string;
    source: 'manual' | 'simulation' | 'import';
    notes?: string;
  };
}

interface ComparisonMetrics {
  bestPerforming: AxisKey;
  worstPerforming: AxisKey;
  mostImproved: AxisKey;
  mostDeclined: AxisKey;
  overallTrend: 'improving' | 'declining' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
  opportunities: string[];
  recommendations: string[];
}

interface ScenarioComparisonProps {
  className?: string;
}

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({ className = '' }) => {
  const { data: currentData } = useV2Store();

  // 상태 관리
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [comparisonView, setComparisonView] = useState<'radar' | 'bar' | 'table' | 'insights'>('radar');
  const [showDifferences, setShowDifferences] = useState(true);
  const [normalize, setNormalize] = useState(false);
  const [highlightedAxis, setHighlightedAxis] = useState<AxisKey | null>(null);

  // localStorage에서 시나리오 로드
  const loadScenariosFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem('v2-scenarios');
      if (stored) {
        const parsed = JSON.parse(stored);
        setScenarios(parsed);
      }
    } catch (error) {
      console.warn('시나리오 로드 실패:', error);
    }
  }, []);

  // 컴포넌트 마운트 시 시나리오 로드
  React.useEffect(() => {
    loadScenariosFromStorage();
  }, [loadScenariosFromStorage]);

  // 현재 데이터를 가상 시나리오로 추가
  const currentScenario: Scenario = useMemo(() => ({
    id: 'current',
    name: '현재 상태',
    description: '현재 KPI 상태',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'system',
    tags: ['current'],
    isFavorite: false,
    isPublic: false,
    data: {
      scores: currentData?.current.scores || { GO: 0, EC: 0, PT: 0, PF: 0, TO: 0 },
      overall: currentData?.current.overall || 0
    },
    metadata: {
      version: '1.0',
      source: 'manual'
    }
  }), [currentData]);

  // 전체 시나리오 목록 (현재 상태 포함)
  const allScenarios = useMemo(() => [currentScenario, ...scenarios], [currentScenario, scenarios]);

  // 선택된 시나리오들
  const comparisonScenarios = useMemo(() => {
    return allScenarios.filter(s => selectedScenarios.includes(s.id));
  }, [allScenarios, selectedScenarios]);

  // 비교 메트릭 계산
  const comparisonMetrics = useMemo((): ComparisonMetrics => {
    if (comparisonScenarios.length < 2) {
      return {
        bestPerforming: 'GO',
        worstPerforming: 'GO',
        mostImproved: 'GO',
        mostDeclined: 'GO',
        overallTrend: 'stable',
        riskLevel: 'low',
        opportunities: [],
        recommendations: []
      };
    }

    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const axisNames = {
      GO: '성장·운영',
      EC: '경제성·자본',
      PT: '제품·기술력',
      PF: '증빙·딜레디',
      TO: '팀·조직'
    };

    // 각 축의 평균 점수 계산
    const axisAverages = axes.reduce((acc, axis) => {
      acc[axis] = comparisonScenarios.reduce((sum, scenario) =>
        sum + scenario.data.scores[axis], 0) / comparisonScenarios.length;
      return acc;
    }, {} as Record<AxisKey, number>);

    // 최고/최저 성과 축
    const bestPerforming = axes.reduce((best, axis) =>
      axisAverages[axis] > axisAverages[best] ? axis : best);
    const worstPerforming = axes.reduce((worst, axis) =>
      axisAverages[axis] < axisAverages[worst] ? axis : worst);

    // 변화량 계산 (첫 번째와 마지막 시나리오 비교)
    const firstScenario = comparisonScenarios[0];
    const lastScenario = comparisonScenarios[comparisonScenarios.length - 1];

    const changes = axes.reduce((acc, axis) => {
      acc[axis] = lastScenario.data.scores[axis] - firstScenario.data.scores[axis];
      return acc;
    }, {} as Record<AxisKey, number>);

    const mostImproved = axes.reduce((improved, axis) =>
      changes[axis] > changes[improved] ? axis : improved);
    const mostDeclined = axes.reduce((declined, axis) =>
      changes[axis] < changes[declined] ? axis : declined);

    // 전체 트렌드
    const overallChange = lastScenario.data.overall - firstScenario.data.overall;
    const overallTrend = overallChange > 5 ? 'improving' : overallChange < -5 ? 'declining' : 'stable';

    // 리스크 레벨
    const lowScores = axes.filter(axis => axisAverages[axis] < 50).length;
    const riskLevel = lowScores >= 3 ? 'high' : lowScores >= 1 ? 'medium' : 'low';

    // 기회 및 추천사항
    const opportunities = [];
    const recommendations = [];

    if (changes[mostImproved] > 10) {
      opportunities.push(`${axisNames[mostImproved]} 영역의 지속적인 성장 가능성`);
      recommendations.push(`${axisNames[mostImproved]} 영역의 성공 요인을 다른 영역에 적용`);
    }

    if (changes[mostDeclined] < -10) {
      opportunities.push(`${axisNames[mostDeclined]} 영역의 즉시 개선 필요`);
      recommendations.push(`${axisNames[mostDeclined]} 영역에 대한 집중적인 리소스 투입`);
    }

    if (axisAverages[worstPerforming] < 40) {
      recommendations.push(`${axisNames[worstPerforming]} 영역의 근본적인 전략 재검토 필요`);
    }

    return {
      bestPerforming,
      worstPerforming,
      mostImproved,
      mostDeclined,
      overallTrend,
      riskLevel,
      opportunities,
      recommendations
    };
  }, [comparisonScenarios]);

  // 시나리오 선택/해제
  const toggleScenarioSelection = useCallback((scenarioId: string) => {
    setSelectedScenarios(prev => {
      if (prev.includes(scenarioId)) {
        return prev.filter(id => id !== scenarioId);
      } else if (prev.length < 5) { // 최대 5개까지
        return [...prev, scenarioId];
      }
      return prev;
    });
  }, []);

  // 레이더 차트 데이터 생성
  const generateRadarChart = useCallback((scenarios: Scenario[]) => {
    const centerX = 150;
    const centerY = 150;
    const maxRadius = 120;
    const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
    const angleStep = (2 * Math.PI) / 5;

    return scenarios.map((scenario, index) => {
      const points = axes.map((axis, axisIndex) => {
        const angle = axisIndex * angleStep - Math.PI / 2;
        const score = normalize
          ? (scenario.data.scores[axis] / 100)
          : scenario.data.scores[axis] / 100;
        const radius = score * maxRadius;

        return {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          axis,
          score: scenario.data.scores[axis]
        };
      });

      const pathData = points.map(p => `${p.x},${p.y}`).join(' ');
      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

      return {
        scenario,
        points,
        pathData,
        color: colors[index % colors.length],
        opacity: 0.3 + (index * 0.1)
      };
    });
  }, [normalize]);

  const chartData = generateRadarChart(comparisonScenarios);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">시나리오 비교 분석</h3>
          <p className="text-sm text-gray-600">
            여러 시나리오를 비교하여 최적의 전략을 찾아보세요
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadScenariosFromStorage}
            className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
          >
            <RefreshCw size={14} />
            새로고침
          </button>
        </div>
      </div>

      {/* 시나리오 선택 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">비교할 시나리오 선택</h4>
          <div className="text-sm text-gray-500">
            {selectedScenarios.length}/5 선택됨
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {allScenarios.map((scenario) => (
            <motion.div
              key={scenario.id}
              layout
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                selectedScenarios.includes(scenario.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => toggleScenarioSelection(scenario.id)}
            >
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  selectedScenarios.includes(scenario.id) ? 'bg-blue-500' : 'bg-gray-300'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {scenario.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    전체: {scenario.data.overall}점
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 비교 결과 */}
      {comparisonScenarios.length >= 2 && (
        <div className="space-y-6">
          {/* 컨트롤 */}
          <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-4">
              <div className="flex rounded-lg bg-gray-100 p-1">
                {[
                  { key: 'radar', label: '레이더', icon: Target },
                  { key: 'bar', label: '막대', icon: BarChart3 },
                  { key: 'table', label: '표', icon: Eye },
                  { key: 'insights', label: '인사이트', icon: Zap }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setComparisonView(key as any)}
                    className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
                      comparisonView === key
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showDifferences}
                  onChange={(e) => setShowDifferences(e.target.checked)}
                  className="rounded border-gray-300"
                />
                차이점 강조
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={normalize}
                  onChange={(e) => setNormalize(e.target.checked)}
                  className="rounded border-gray-300"
                />
                정규화
              </label>
            </div>
          </div>

          {/* 레이더 차트 비교 */}
          {comparisonView === 'radar' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="font-medium text-gray-900 mb-4">레이더 차트 비교</h4>

              <div className="flex justify-center">
                <svg width="300" height="300" className="drop-shadow-sm">
                  {/* 배경 격자 */}
                  {[...Array(5)].map((_, level) => {
                    const radius = (120 / 5) * (level + 1);
                    const axes = ['GO', 'EC', 'PT', 'PF', 'TO'];
                    const angleStep = (2 * Math.PI) / 5;
                    const points = axes.map((_, index) => {
                      const angle = index * angleStep - Math.PI / 2;
                      return `${150 + radius * Math.cos(angle)},${150 + radius * Math.sin(angle)}`;
                    }).join(' ');

                    return (
                      <polygon
                        key={level}
                        points={points}
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="1"
                        opacity={0.3}
                      />
                    );
                  })}

                  {/* 축 선들 */}
                  {['GO', 'EC', 'PT', 'PF', 'TO'].map((axis, index) => {
                    const angle = index * (2 * Math.PI) / 5 - Math.PI / 2;
                    const endX = 150 + 120 * Math.cos(angle);
                    const endY = 150 + 120 * Math.sin(angle);

                    return (
                      <g key={axis}>
                        <line
                          x1={150}
                          y1={150}
                          x2={endX}
                          y2={endY}
                          stroke="#d1d5db"
                          strokeWidth="1"
                        />
                        <text
                          x={endX + (endX > 150 ? 10 : endX < 150 ? -10 : 0)}
                          y={endY + (endY > 150 ? 15 : endY < 150 ? -10 : 5)}
                          textAnchor={endX > 150 ? 'start' : endX < 150 ? 'end' : 'middle'}
                          className="text-xs font-medium fill-gray-600"
                        >
                          {axis}
                        </text>
                      </g>
                    );
                  })}

                  {/* 시나리오 데이터 폴리곤들 */}
                  {chartData.map((data, index) => (
                    <g key={data.scenario.id}>
                      <polygon
                        points={data.pathData}
                        fill={data.color}
                        fillOpacity={data.opacity}
                        stroke={data.color}
                        strokeWidth="2"
                        className="hover:fill-opacity-50 transition-all"
                      />
                      {data.points.map((point, pointIndex) => (
                        <circle
                          key={pointIndex}
                          cx={point.x}
                          cy={point.y}
                          r="3"
                          fill={data.color}
                          stroke="white"
                          strokeWidth="1"
                        />
                      ))}
                    </g>
                  ))}
                </svg>
              </div>

              {/* 범례 */}
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {chartData.map((data) => (
                  <div key={data.scenario.id} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: data.color }}
                    />
                    <span className="text-sm text-gray-600">{data.scenario.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 인사이트 분석 */}
          {comparisonView === 'insights' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="font-medium text-gray-900 mb-4">비교 인사이트</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 성과 요약 */}
                <div className="space-y-4">
                  <h5 className="font-medium text-gray-800">성과 요약</h5>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <TrendingUp className="text-green-600" size={20} />
                      <div>
                        <div className="font-medium text-sm text-green-800">최고 성과 영역</div>
                        <div className="text-xs text-green-600">
                          {comparisonMetrics.bestPerforming} - 평균 성과가 가장 높음
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                      <TrendingDown className="text-red-600" size={20} />
                      <div>
                        <div className="font-medium text-sm text-red-800">개선 필요 영역</div>
                        <div className="text-xs text-red-600">
                          {comparisonMetrics.worstPerforming} - 집중적인 개선이 필요
                        </div>
                      </div>
                    </div>

                    <div className={`flex items-center gap-3 p-3 rounded-lg ${
                      comparisonMetrics.overallTrend === 'improving'
                        ? 'bg-blue-50'
                        : comparisonMetrics.overallTrend === 'declining'
                        ? 'bg-orange-50'
                        : 'bg-gray-50'
                    }`}>
                      {comparisonMetrics.overallTrend === 'improving' ? (
                        <TrendingUp className="text-blue-600" size={20} />
                      ) : comparisonMetrics.overallTrend === 'declining' ? (
                        <TrendingDown className="text-orange-600" size={20} />
                      ) : (
                        <Minus className="text-gray-600" size={20} />
                      )}
                      <div>
                        <div className={`font-medium text-sm ${
                          comparisonMetrics.overallTrend === 'improving'
                            ? 'text-blue-800'
                            : comparisonMetrics.overallTrend === 'declining'
                            ? 'text-orange-800'
                            : 'text-gray-800'
                        }`}>
                          전체 트렌드: {
                            comparisonMetrics.overallTrend === 'improving' ? '개선 중' :
                            comparisonMetrics.overallTrend === 'declining' ? '하락 중' : '안정적'
                          }
                        </div>
                        <div className={`text-xs ${
                          comparisonMetrics.overallTrend === 'improving'
                            ? 'text-blue-600'
                            : comparisonMetrics.overallTrend === 'declining'
                            ? 'text-orange-600'
                            : 'text-gray-600'
                        }`}>
                          시나리오 간 전체적인 성과 변화
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 추천사항 */}
                <div className="space-y-4">
                  <h5 className="font-medium text-gray-800">추천 사항</h5>

                  <div className="space-y-3">
                    {comparisonMetrics.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <CheckCircle className="text-blue-600 mt-0.5" size={16} />
                        <div className="text-sm text-blue-800">{recommendation}</div>
                      </div>
                    ))}

                    {comparisonMetrics.opportunities.map((opportunity, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                        <Zap className="text-yellow-600 mt-0.5" size={16} />
                        <div className="text-sm text-yellow-800">{opportunity}</div>
                      </div>
                    ))}

                    <div className={`flex items-start gap-3 p-3 rounded-lg ${
                      comparisonMetrics.riskLevel === 'high'
                        ? 'bg-red-50'
                        : comparisonMetrics.riskLevel === 'medium'
                        ? 'bg-orange-50'
                        : 'bg-green-50'
                    }`}>
                      <AlertTriangle
                        className={`mt-0.5 ${
                          comparisonMetrics.riskLevel === 'high'
                            ? 'text-red-600'
                            : comparisonMetrics.riskLevel === 'medium'
                            ? 'text-orange-600'
                            : 'text-green-600'
                        }`}
                        size={16}
                      />
                      <div>
                        <div className={`font-medium text-sm ${
                          comparisonMetrics.riskLevel === 'high'
                            ? 'text-red-800'
                            : comparisonMetrics.riskLevel === 'medium'
                            ? 'text-orange-800'
                            : 'text-green-800'
                        }`}>
                          리스크 레벨: {
                            comparisonMetrics.riskLevel === 'high' ? '높음' :
                            comparisonMetrics.riskLevel === 'medium' ? '보통' : '낮음'
                          }
                        </div>
                        <div className={`text-xs ${
                          comparisonMetrics.riskLevel === 'high'
                            ? 'text-red-600'
                            : comparisonMetrics.riskLevel === 'medium'
                            ? 'text-orange-600'
                            : 'text-green-600'
                        }`}>
                          {comparisonMetrics.riskLevel === 'high'
                            ? '즉시 대응이 필요한 영역이 다수 존재'
                            : comparisonMetrics.riskLevel === 'medium'
                            ? '일부 영역에서 주의가 필요'
                            : '전반적으로 안정적인 상태'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 빈 상태 */}
      {selectedScenarios.length < 2 && (
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <BarChart3 className="mx-auto mb-4 text-gray-400" size={48} />
          <h4 className="font-medium text-gray-900 mb-2">시나리오를 선택해주세요</h4>
          <p className="text-sm text-gray-600">
            비교 분석을 위해 최소 2개 이상의 시나리오를 선택해야 합니다.
          </p>
        </div>
      )}
    </div>
  );
};