/**
 * Real-Time Simulation Dashboard - Phase 8
 * 실시간 시뮬레이션 결과를 시각화하고 관리하는 대시보드
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Square, Settings, TrendingUp, TrendingDown,
  Activity, Zap, AlertTriangle, Target, BarChart3, LineChart,
  PieChart, RefreshCw, Download, Share2, Maximize2, Minimize2,
  Clock, Users, DollarSign, Shield, ArrowUp, ArrowDown
} from 'lucide-react';
import type { AxisKey } from '../../pages/startup/kpi-tabs/ResultsInsightsPanelV2/types';
import { getRealTimeSimulationEngine } from '../../services/simulation/RealTimeSimulationEngine';
import type {
  RealTimeResult,
  SimulationScenario,
  RiskAnalysis,
  OpportunityAnalysis
} from '../../services/simulation/RealTimeSimulationEngine';

// 컴포넌트 Props
interface RealTimeSimulationDashboardProps {
  currentScores: Record<AxisKey, number>;
  className?: string;
  onScenarioChange?: (scenario: SimulationScenario) => void;
}

// Card 컴포넌트들
const Card = ({ children, className = '', ...props }: any) => (
  <motion.div
    className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
    {...props}
  >
    {children}
  </motion.div>
);

const CardHeader = ({ title, subtitle, icon, action, ...props }: any) => (
  <div className="p-4 border-b border-gray-100 flex items-center justify-between" {...props}>
    <div className="flex items-center gap-3">
      {icon && <div className="text-blue-600">{icon}</div>}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

const CardBody = ({ children, className = '', ...props }: any) => (
  <div className={`p-4 ${className}`} {...props}>{children}</div>
);

// 메인 대시보드 컴포넌트
export const RealTimeSimulationDashboard: React.FC<RealTimeSimulationDashboardProps> = ({
  currentScores,
  className = '',
  onScenarioChange
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('baseline');
  const [results, setResults] = useState<RealTimeResult[]>([]);
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // 시뮬레이션 엔진 인스턴스
  const engineRef = useRef(getRealTimeSimulationEngine());

  // 실시간 업데이트 효과
  useEffect(() => {
    const engine = engineRef.current;

    // 이벤트 리스너 등록
    const handleScenarioUpdated = (result: RealTimeResult) => {
      setResults(prev => {
        const updated = prev.filter(r => r.scenarioId !== result.scenarioId);
        return [...updated, result].sort((a, b) => b.timestamp - a.timestamp);
      });
    };

    const handleScenarioAdded = (scenario: SimulationScenario) => {
      setScenarios(prev => [...prev, scenario]);
    };

    const handleScenarioRemoved = (scenarioId: string) => {
      setScenarios(prev => prev.filter(s => s.id !== scenarioId));
      setResults(prev => prev.filter(r => r.scenarioId !== scenarioId));
    };

    engine.on('scenarioUpdated', handleScenarioUpdated);
    engine.on('scenarioAdded', handleScenarioAdded);
    engine.on('scenarioRemoved', handleScenarioRemoved);

    // 초기 시나리오 로드
    loadInitialScenarios();

    return () => {
      engine.off('scenarioUpdated', handleScenarioUpdated);
      engine.off('scenarioAdded', handleScenarioAdded);
      engine.off('scenarioRemoved', handleScenarioRemoved);
    };
  }, []);

  // 현재 점수 변경 시 업데이트
  useEffect(() => {
    if (Object.keys(currentScores).length > 0) {
      engineRef.current.updateCurrentScores(currentScores);
    }
  }, [currentScores]);

  // 초기 시나리오 로드
  const loadInitialScenarios = () => {
    // 기본 시나리오들이 이미 엔진에 초기화되어 있음
    setScenarios([
      {
        id: 'baseline',
        name: '기준 시나리오',
        description: '현재 상태 기반 기본 시뮬레이션',
        parameters: {
          timeHorizon: 30,
          volatility: { GO: 0.15, EC: 0.2, PT: 0.18, PF: 0.22, TO: 0.25 },
          correlations: {
            GO: { GO: 1, EC: 0.3, PT: 0.4, PF: 0.5, TO: 0.3 },
            EC: { GO: 0.3, EC: 1, PT: 0.5, PF: 0.3, TO: 0.6 },
            PT: { GO: 0.4, EC: 0.5, PT: 1, PF: 0.4, TO: 0.5 },
            PF: { GO: 0.5, EC: 0.3, PT: 0.4, PF: 1, TO: 0.4 },
            TO: { GO: 0.3, EC: 0.6, PT: 0.5, PF: 0.4, TO: 1 }
          }
        },
        active: true,
        priority: 1
      },
      {
        id: 'optimistic',
        name: '최적화 시나리오',
        description: '목표 달성을 위한 최적화된 시뮬레이션',
        parameters: {
          targetScores: { GO: 85, EC: 85, PT: 85, PF: 85, TO: 85 },
          timeHorizon: 90,
          volatility: { GO: 0.1, EC: 0.15, PT: 0.12, PF: 0.18, TO: 0.2 },
          correlations: {
            GO: { GO: 1, EC: 0.4, PT: 0.5, PF: 0.6, TO: 0.4 },
            EC: { GO: 0.4, EC: 1, PT: 0.6, PF: 0.4, TO: 0.7 },
            PT: { GO: 0.5, EC: 0.6, PT: 1, PF: 0.5, TO: 0.6 },
            PF: { GO: 0.6, EC: 0.4, PT: 0.5, PF: 1, TO: 0.5 },
            TO: { GO: 0.4, EC: 0.7, PT: 0.6, PF: 0.5, TO: 1 }
          }
        },
        active: false,
        priority: 2
      }
    ]);
  };

  // 시뮬레이션 시작/중지
  const toggleSimulation = () => {
    const engine = engineRef.current;
    if (isRunning) {
      engine.stop();
      setIsRunning(false);
    } else {
      engine.start();
      setIsRunning(true);
    }
  };

  // 시나리오 활성화/비활성화
  const toggleScenario = (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      const newActive = !scenario.active;
      engineRef.current.toggleScenario(scenarioId, newActive);

      setScenarios(prev => prev.map(s =>
        s.id === scenarioId ? { ...s, active: newActive } : s
      ));

      if (newActive && onScenarioChange) {
        onScenarioChange(scenario);
      }
    }
  };

  // 선택된 시나리오 결과
  const selectedResult = useMemo(() => {
    return results.find(r => r.scenarioId === selectedScenario);
  }, [results, selectedScenario]);

  // 전체 성능 메트릭
  const performanceMetrics = useMemo(() => {
    const engine = engineRef.current;
    return engine.getPerformanceMetrics();
  }, [results]);

  // 최소화된 상태 렌더링
  if (isMinimized) {
    return (
      <motion.div
        className={`fixed bottom-4 left-4 z-50 ${className}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <button
          onClick={() => setIsMinimized(false)}
          className={`p-3 rounded-full shadow-lg transition-colors ${
            isRunning
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
        >
          <Activity className="w-6 h-6" />
          {isRunning && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          )}
        </button>
      </motion.div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <Card>
        <CardHeader
          title="실시간 시뮬레이션 대시보드"
          subtitle={`${results.length}개 시나리오 활성 • ${isRunning ? '실행 중' : '정지됨'}`}
          icon={<Activity className="w-6 h-6" />}
          action={
            <div className="flex items-center gap-2">
              {/* 실행 상태 */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-sm text-gray-600">
                  {isRunning ? '실행 중' : '정지됨'}
                </span>
              </div>

              {/* 컨트롤 버튼들 */}
              <button
                onClick={toggleSimulation}
                className={`p-2 rounded-lg transition-colors ${
                  isRunning
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-green-600 hover:bg-green-50'
                }`}
                title={isRunning ? '시뮬레이션 중지' : '시뮬레이션 시작'}
              >
                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsMinimized(true)}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                title="최소화"
              >
                <Minimize2 className="w-5 h-5" />
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                title="설정"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          }
        />
      </Card>

      {/* 메인 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 좌측: 시나리오 제어 */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader
              title="시나리오 관리"
              subtitle={`${scenarios.filter(s => s.active).length}/${scenarios.length} 활성`}
              icon={<Target className="w-5 h-5" />}
            />
            <CardBody className="space-y-3">
              {scenarios.map(scenario => (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  isSelected={selectedScenario === scenario.id}
                  onSelect={() => setSelectedScenario(scenario.id)}
                  onToggle={() => toggleScenario(scenario.id)}
                />
              ))}
            </CardBody>
          </Card>

          {/* 성능 메트릭 */}
          <Card>
            <CardHeader
              title="성능 메트릭"
              icon={<Zap className="w-5 h-5" />}
            />
            <CardBody>
              <PerformanceMetricsPanel metrics={performanceMetrics} />
            </CardBody>
          </Card>
        </div>

        {/* 중앙: 메인 차트 및 결과 */}
        <div className="lg:col-span-2 space-y-4">
          {selectedResult ? (
            <>
              {/* 예측 차트 */}
              <Card>
                <CardHeader
                  title="예측 트렌드"
                  subtitle={`${selectedResult.predictions.length}일 예측`}
                  icon={<LineChart className="w-5 h-5" />}
                />
                <CardBody>
                  <PredictionChart result={selectedResult} />
                </CardBody>
              </Card>

              {/* 트렌드 분석 */}
              <Card>
                <CardHeader
                  title="트렌드 분석"
                  icon={<TrendingUp className="w-5 h-5" />}
                />
                <CardBody>
                  <TrendAnalysisPanel trends={selectedResult.trends} />
                </CardBody>
              </Card>
            </>
          ) : (
            <Card>
              <CardBody className="text-center py-12">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">시나리오를 선택하여 결과를 확인하세요</p>
              </CardBody>
            </Card>
          )}
        </div>

        {/* 우측: 리스크 및 기회 */}
        <div className="lg:col-span-1 space-y-4">
          {selectedResult && (
            <>
              {/* 리스크 분석 */}
              <Card>
                <CardHeader
                  title="리스크 분석"
                  subtitle={`${selectedResult.risks.length}개 리스크`}
                  icon={<AlertTriangle className="w-5 h-5" />}
                />
                <CardBody>
                  <RiskAnalysisPanel risks={selectedResult.risks} />
                </CardBody>
              </Card>

              {/* 기회 분석 */}
              <Card>
                <CardHeader
                  title="기회 분석"
                  subtitle={`${selectedResult.opportunities.length}개 기회`}
                  icon={<Target className="w-5 h-5" />}
                />
                <CardBody>
                  <OpportunityAnalysisPanel opportunities={selectedResult.opportunities} />
                </CardBody>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* 설정 패널 */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <SimulationSettingsPanel onClose={() => setShowSettings(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 시나리오 카드 컴포넌트
const ScenarioCard: React.FC<{
  scenario: SimulationScenario;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
}> = ({ scenario, isSelected, onSelect, onToggle }) => {
  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">{scenario.name}</h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`w-4 h-4 rounded border-2 transition-colors ${
            scenario.active
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {scenario.active && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          )}
        </button>
      </div>
      <p className="text-xs text-gray-600 mb-2">{scenario.description}</p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>우선순위: {scenario.priority}</span>
        <span>{scenario.parameters.timeHorizon}일</span>
      </div>
    </div>
  );
};

// 성능 메트릭 패널
const PerformanceMetricsPanel: React.FC<{ metrics: any }> = ({ metrics }) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center">
          <div className="text-xl font-bold text-blue-600">
            {metrics.avgUpdateTime ? `${metrics.avgUpdateTime.toFixed(0)}ms` : '-'}
          </div>
          <div className="text-xs text-gray-600">평균 업데이트</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">
            {metrics.updateCount || 0}
          </div>
          <div className="text-xs text-gray-600">총 업데이트</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">마지막 업데이트</span>
          <span className="text-sm text-gray-600">
            {metrics.lastUpdate ? new Date(metrics.lastUpdate).toLocaleTimeString() : '-'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">오류 수</span>
          <span className={`text-sm ${metrics.errorCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {metrics.errorCount || 0}
          </span>
        </div>
      </div>
    </div>
  );
};

// 예측 차트 컴포넌트
const PredictionChart: React.FC<{ result: RealTimeResult }> = ({ result }) => {
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

  return (
    <div className="space-y-4">
      {/* 간단한 라인 차트 시뮬레이션 */}
      <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <LineChart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500 text-sm">예측 트렌드 차트</p>
          <p className="text-xs text-gray-400">
            {result.predictions.length}일간 예측 데이터
          </p>
        </div>
      </div>

      {/* 축별 마지막 예측값 */}
      <div className="grid grid-cols-5 gap-2">
        {axes.map(axis => {
          const lastPrediction = result.predictions[result.predictions.length - 1];
          const currentScore = result.currentState[axis];
          const predictedScore = lastPrediction?.scores[axis] || currentScore;
          const change = predictedScore - currentScore;

          return (
            <div key={axis} className="text-center p-2 bg-gray-50 rounded">
              <div className="text-sm font-medium">{axis}</div>
              <div className="text-lg font-bold">{Math.round(predictedScore)}</div>
              <div className={`text-xs flex items-center justify-center gap-1 ${
                change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {change > 0 ? (
                  <ArrowUp className="w-3 h-3" />
                ) : change < 0 ? (
                  <ArrowDown className="w-3 h-3" />
                ) : null}
                {Math.abs(change).toFixed(1)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 트렌드 분석 패널
const TrendAnalysisPanel: React.FC<{ trends: any }> = ({ trends }) => {
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

  return (
    <div className="space-y-3">
      {axes.map(axis => {
        const direction = trends.direction[axis];
        const momentum = trends.momentum[axis];
        const acceleration = trends.acceleration[axis];

        return (
          <div key={axis} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{axis}</span>
              <div className={`text-xs px-2 py-1 rounded ${
                direction === 'up' ? 'bg-green-100 text-green-700' :
                direction === 'down' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {direction === 'up' ? '상승' : direction === 'down' ? '하락' : '안정'}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              모멘텀: {momentum?.toFixed(2) || '0.00'}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// 리스크 분석 패널
const RiskAnalysisPanel: React.FC<{ risks: RiskAnalysis[] }> = ({ risks }) => {
  return (
    <div className="space-y-3">
      {risks.length > 0 ? (
        risks.slice(0, 3).map((risk, index) => (
          <div key={index} className={`p-3 rounded-lg border-l-4 ${
            risk.severity === 'critical' ? 'border-red-500 bg-red-50' :
            risk.severity === 'high' ? 'border-orange-500 bg-orange-50' :
            risk.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
            'border-blue-500 bg-blue-50'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{risk.type}</span>
              <span className="text-xs px-2 py-1 bg-white rounded">
                {Math.round(risk.probability * 100)}%
              </span>
            </div>
            <p className="text-xs text-gray-700">{risk.description}</p>
            <div className="text-xs text-gray-600 mt-1">
              영향: {risk.affectedAxes.join(', ')}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-4 text-gray-500 text-sm">
          감지된 리스크가 없습니다
        </div>
      )}
    </div>
  );
};

// 기회 분석 패널
const OpportunityAnalysisPanel: React.FC<{ opportunities: OpportunityAnalysis[] }> = ({ opportunities }) => {
  return (
    <div className="space-y-3">
      {opportunities.length > 0 ? (
        opportunities.slice(0, 3).map((opportunity, index) => (
          <div key={index} className={`p-3 rounded-lg border-l-4 ${
            opportunity.potential === 'high' ? 'border-green-500 bg-green-50' :
            opportunity.potential === 'medium' ? 'border-blue-500 bg-blue-50' :
            'border-gray-500 bg-gray-50'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{opportunity.type}</span>
              <span className="text-xs px-2 py-1 bg-white rounded">
                {opportunity.potential}
              </span>
            </div>
            <p className="text-xs text-gray-700">{opportunity.description}</p>
            <div className="text-xs text-gray-600 mt-1">
              예상 이익: +{opportunity.expectedGain}%
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-4 text-gray-500 text-sm">
          감지된 기회가 없습니다
        </div>
      )}
    </div>
  );
};

// 설정 패널
const SimulationSettingsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <Card>
      <CardHeader
        title="시뮬레이션 설정"
        action={
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            ×
          </button>
        }
      />
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium">업데이트 설정</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                업데이트 간격 (초)
              </label>
              <select className="w-full p-2 border border-gray-300 rounded-lg">
                <option value="5">5초</option>
                <option value="10">10초</option>
                <option value="30">30초</option>
                <option value="60">1분</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked />
                <span className="text-sm">자동 업데이트</span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">성능 설정</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                성능 모드
              </label>
              <select className="w-full p-2 border border-gray-300 rounded-lg">
                <option value="fast">빠름</option>
                <option value="balanced">균형</option>
                <option value="accurate">정확</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최대 시나리오 수
              </label>
              <input
                type="number"
                defaultValue="10"
                min="1"
                max="20"
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">알림 설정</h4>
            <div>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked />
                <span className="text-sm">리스크 알림</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                <span className="text-sm">기회 알림</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                <span className="text-sm">소리 알림</span>
              </label>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200 mt-6">
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
            설정 저장
          </button>
        </div>
      </CardBody>
    </Card>
  );
};

export default RealTimeSimulationDashboard;