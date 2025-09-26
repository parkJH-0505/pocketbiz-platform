/**
 * Advanced Scenario Simulator
 * 고급 시나리오 시뮬레이터 - 몬테카를로, 민감도 분석, 상호작용 효과
 */

import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  TrendingUp,
  AlertTriangle,
  Target,
  BarChart3,
  Zap,
  Brain,
  ArrowRight,
  RefreshCw,
  Save
} from 'lucide-react';
import { AdvancedScenarioEngine } from '../utils';
import type { ScenarioVariable, ScenarioResult } from '../utils';
import { useV2Store } from '../store/useV2Store';
import type { AxisKey } from '../types';

// Local type definition to avoid import issues
interface ScenarioRecommendation {
  type: 'optimization' | 'risk-mitigation' | 'opportunity' | 'warning';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggestedActions: string[];
  expectedImpact: Partial<Record<AxisKey, number>>;
  timeframe: 'immediate' | 'short' | 'medium' | 'long';
}

interface VariableControlProps {
  variable: ScenarioVariable;
  value: any;
  onChange: (key: string, value: any) => void;
}

// VariableControl 컴포넌트 - 메모이제이션으로 불필요한 리렌더링 방지
const VariableControl: React.FC<VariableControlProps> = memo(({ variable, value, onChange }) => {
  if (variable.type === 'slider') {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700">{variable.label}</label>
          <span className="text-sm text-gray-500">{value}%</span>
        </div>
        <input
          type="range"
          min={variable.min || 0}
          max={variable.max || 100}
          step={variable.step || 1}
          value={value}
          onChange={(e) => onChange(variable.key, Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>{variable.min}%</span>
          <span>{variable.max}%</span>
        </div>
      </div>
    );
  }

  if (variable.type === 'select') {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">{variable.label}</label>
        <select
          value={value}
          onChange={(e) => onChange(variable.key, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {variable.options?.map((option) => (
            <option key={option} value={option}>
              {option.replace('_', ' ').toUpperCase()}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (variable.type === 'toggle') {
    return (
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{variable.label}</label>
        <button
          onClick={() => onChange(variable.key, !value)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            value ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              value ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    );
  }

  return null;
});

VariableControl.displayName = 'VariableControl';

// RecommendationCard 컴포넌트 - 메모이제이션 적용
const RecommendationCard: React.FC<{ recommendation: ScenarioRecommendation }> = memo(({ recommendation }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'optimization': return TrendingUp;
      case 'risk-mitigation': return AlertTriangle;
      case 'opportunity': return Target;
      case 'warning': return AlertTriangle;
      default: return Brain;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'optimization': return 'bg-green-100 text-green-800 border-green-200';
      case 'risk-mitigation': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'opportunity': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'warning': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const Icon = getTypeIcon(recommendation.type);

  return (
    <div className={`p-4 rounded-lg border ${getTypeColor(recommendation.type)}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Icon size={20} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold">{recommendation.title}</h3>
            <div className={`w-2 h-2 rounded-full ${getPriorityColor(recommendation.priority)}`} />
          </div>
          <p className="text-sm mb-3">{recommendation.description}</p>
          <div className="space-y-2">
            <div className="text-xs font-medium">제안 액션:</div>
            <ul className="text-xs space-y-1">
              {recommendation.suggestedActions.map((action, index) => (
                <li key={index} className="flex items-center gap-2">
                  <ArrowRight size={12} />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});

RecommendationCard.displayName = 'RecommendationCard';

// AdvancedSimulator 메인 컴포넌트 - 메모이제이션 적용
const AdvancedSimulatorComponent: React.FC = () => {
  const { data } = useV2Store();
  const [engine] = useState(() => new AdvancedScenarioEngine());
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'variables' | 'results' | 'recommendations'>('variables');

  // 시나리오 엔진 초기화
  useEffect(() => {
    if (data?.current.scores) {
      engine.setBaselineScores(data.current.scores);
    }

    const engineVariables = engine.getVariables();
    const initialValues = engineVariables.reduce((acc, variable) => {
      acc[variable.key] = variable.value;
      return acc;
    }, {} as Record<string, any>);

    setVariables(initialValues);
  }, [data, engine]);

  const engineVariables = useMemo(() => engine.getVariables(), [engine]);

  // 변수 변경 핸들러 - useCallback으로 최적화
  const handleVariableChange = useCallback((key: string, value: any) => {
    setVariables(prev => ({ ...prev, [key]: value }));
  }, []);

  // 시뮬레이션 실행 함수 - useCallback으로 최적화
  const runSimulation = useCallback(async () => {
    setIsRunning(true);
    try {
      const simulationResult = await engine.runScenario(variables, {
        iterations: 1000,
        confidenceInterval: 95,
        riskThreshold: 0.1,
        variabilityFactor: 0.15
      });
      setResult(simulationResult);
      setActiveTab('results');
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setIsRunning(false);
    }
  }, [engine, variables]);

  // 변수 리셋 함수 - useCallback으로 최적화
  const resetVariables = useCallback(() => {
    const resetValues = engineVariables.reduce((acc, variable) => {
      acc[variable.key] = variable.value;
      return acc;
    }, {} as Record<string, any>);
    setVariables(resetValues);
  }, [engineVariables]);

  const getAxisColor = (axis: AxisKey): string => {
    const colors = {
      GO: 'bg-blue-500',
      EC: 'bg-green-500',
      PT: 'bg-purple-500',
      PF: 'bg-orange-500',
      TO: 'bg-red-500'
    };
    return colors[axis];
  };

  const getAxisName = (axis: AxisKey): string => {
    const names = {
      GO: 'Go-to-Market',
      EC: 'Economics',
      PT: 'Product & Tech',
      PF: 'People & Process',
      TO: 'Team & Operations'
    };
    return names[axis];
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">고급 시나리오 시뮬레이터</h2>
          <p className="text-gray-600">몬테카를로 시뮬레이션과 민감도 분석으로 정교한 예측을 수행합니다</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={resetVariables}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw size={16} />
            리셋
          </button>
          <button
            onClick={runSimulation}
            disabled={isRunning}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Zap size={16} />
            )}
            {isRunning ? '시뮬레이션 실행 중...' : '시뮬레이션 실행'}
          </button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          {[
            { key: 'variables', label: '변수 설정', icon: Settings },
            { key: 'results', label: '시뮬레이션 결과', icon: BarChart3 },
            { key: 'recommendations', label: '추천사항', icon: Brain }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'variables' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">비즈니스 변수</h3>
                {engineVariables.slice(0, Math.ceil(engineVariables.length / 2)).map((variable) => (
                  <div key={variable.key} className="p-4 bg-white rounded-lg border border-gray-200">
                    <VariableControl
                      variable={variable}
                      value={variables[variable.key]}
                      onChange={handleVariableChange}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">운영 변수</h3>
                {engineVariables.slice(Math.ceil(engineVariables.length / 2)).map((variable) => (
                  <div key={variable.key} className="p-4 bg-white rounded-lg border border-gray-200">
                    <VariableControl
                      variable={variable}
                      value={variables[variable.key]}
                      onChange={handleVariableChange}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'results' && result && (
            <div className="space-y-6">
              {/* 점수 비교 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">예상 점수 변화</h3>
                <div className="space-y-4">
                  {Object.entries(result.projectedScores).map(([axis, score]) => {
                    const baseline = result.baselineScores[axis as AxisKey];
                    const change = score - baseline;
                    const confidence = result.confidenceInterval[axis as AxisKey];

                    return (
                      <div key={axis} className="flex items-center gap-4">
                        <div className="w-20 text-sm font-medium text-gray-700">
                          {getAxisName(axis as AxisKey)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="text-sm text-gray-600">{baseline.toFixed(1)}</div>
                            <ArrowRight size={16} className="text-gray-400" />
                            <div className={`text-sm font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {score.toFixed(1)}
                            </div>
                            <div className={`text-xs px-2 py-1 rounded ${change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {change >= 0 ? '+' : ''}{change.toFixed(1)}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            95% 신뢰구간: {confidence.lower.toFixed(1)} ~ {confidence.upper.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 위험 지표 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">위험 분석</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(result.riskMetrics.volatility).map(([axis, volatility]) => (
                    <div key={axis} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className={`w-3 h-3 ${getAxisColor(axis as AxisKey)} rounded-full mx-auto mb-2`} />
                      <div className="text-sm font-medium text-gray-700">{getAxisName(axis as AxisKey)}</div>
                      <div className="text-lg font-bold text-gray-900">{volatility.toFixed(1)}%</div>
                      <div className="text-xs text-gray-500">변동성</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 상호작용 효과 */}
              {result.interactionEffects.detected.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">발견된 상호작용 효과</h3>
                  <div className="space-y-3">
                    {result.interactionEffects.detected.map((effect, index) => (
                      <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
                          <Zap size={16} />
                          {effect.variables.join(' + ')}
                          <span className={`px-2 py-1 rounded text-xs ${
                            effect.type === 'synergy' ? 'bg-green-100 text-green-800' :
                            effect.type === 'conflict' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {effect.type}
                          </span>
                        </div>
                        <div className="text-xs text-blue-700 mt-1">
                          영향도: {(effect.magnitude * 100 - 100).toFixed(0)}%, 대상: {effect.affectedAxes.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'recommendations' && result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">AI 추천사항</h3>
                <div className="text-sm text-gray-600">
                  {result.recommendations.length}개 추천사항
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {result.recommendations.map((recommendation, index) => (
                  <RecommendationCard key={index} recommendation={recommendation} />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// React.memo로 감싸서 export
export const AdvancedSimulator = memo(AdvancedSimulatorComponent);