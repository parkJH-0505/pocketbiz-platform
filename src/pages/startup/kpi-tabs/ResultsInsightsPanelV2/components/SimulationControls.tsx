/**
 * SimulationControls Component
 * What-if 시뮬레이션 제어 패널
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Play, Pause, RotateCcw, Save, Upload,
  TrendingUp, TrendingDown, Zap, AlertCircle, Target,
  Sliders, BarChart3, ArrowRight
} from 'lucide-react';
import { useV2Store } from '../store/useV2Store';
import type { AxisKey, SimulationAdjustments } from '../types';

interface SimulationPreset {
  id: string;
  name: string;
  description: string;
  adjustments: SimulationAdjustments;
  expectedOutcome: string;
  difficulty: 'conservative' | 'moderate' | 'aggressive';
}

export const SimulationControls: React.FC = () => {
  const {
    simulation,
    updateSimulation,
    runSimulation,
    resetSimulation,
    saveScenario,
    loadScenario,
    data,
    viewState
  } = useV2Store();

  const [isRunning, setIsRunning] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [scenarioName, setScenarioName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [realTimeMode, setRealTimeMode] = useState(true);

  // 축 정보
  const axisInfo = {
    GO: { label: '시장진출', color: '#10b981', icon: '🎯' },
    EC: { label: '수익구조', color: '#f59e0b', icon: '💰' },
    PT: { label: '제품경쟁력', color: '#8b5cf6', icon: '🚀' },
    PF: { label: '성과지표', color: '#ef4444', icon: '📊' },
    TO: { label: '팀조직', color: '#06b6d4', icon: '👥' }
  };

  // 시뮬레이션 프리셋
  const presets: SimulationPreset[] = [
    {
      id: 'conservative',
      name: '안정적 성장',
      description: '점진적이고 지속 가능한 개선에 집중',
      adjustments: { price: 5, churn: -3, team: 8, growth: 10 },
      expectedOutcome: '안정적인 5-8점 향상',
      difficulty: 'conservative'
    },
    {
      id: 'balanced',
      name: '균형 발전',
      description: '모든 영역의 균형잡힌 발전 추구',
      adjustments: { price: 10, churn: -10, team: 15, growth: 20 },
      expectedOutcome: '전체적인 10-15점 향상',
      difficulty: 'moderate'
    },
    {
      id: 'aggressive',
      name: '공격적 확장',
      description: '높은 리스크를 감수한 급속한 성장',
      adjustments: { price: 25, churn: -20, team: 30, growth: 35 },
      expectedOutcome: '급속한 20-30점 향상 (리스크 있음)',
      difficulty: 'aggressive'
    },
    {
      id: 'crisis',
      name: '위기 대응',
      description: '급격한 성과 하락 시 긴급 대응',
      adjustments: { price: -15, churn: 20, team: -10, growth: 5 },
      expectedOutcome: '단기적 안정화 및 회복',
      difficulty: 'moderate'
    }
  ];

  // 실시간 시뮬레이션 (슬라이더 변경 시)
  useEffect(() => {
    if (realTimeMode && simulation.isActive) {
      const timeoutId = setTimeout(() => {
        runSimulation();
      }, 500); // 500ms 디바운스

      return () => clearTimeout(timeoutId);
    }
  }, [simulation.adjustments, realTimeMode, simulation.isActive, runSimulation]);

  // 슬라이더 변경 핸들러
  const handleSliderChange = useCallback((key: keyof SimulationAdjustments, value: number) => {
    updateSimulation(key, value);
  }, [updateSimulation]);

  // 프리셋 적용
  const applyPreset = (preset: SimulationPreset) => {
    setSelectedPreset(preset.id);
    Object.entries(preset.adjustments).forEach(([key, value]) => {
      updateSimulation(key as keyof SimulationAdjustments, value);
    });
    if (!realTimeMode) {
      runSimulation();
    }
  };

  // 시뮬레이션 실행
  const handleRunSimulation = async () => {
    setIsRunning(true);
    try {
      await runSimulation();
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // 시나리오 저장
  const handleSaveScenario = () => {
    if (scenarioName.trim()) {
      saveScenario(scenarioName.trim());
      setScenarioName('');
      alert('시나리오가 저장되었습니다!');
    }
  };

  // 슬라이더 컴포넌트
  const SimulationSlider: React.FC<{
    axis: keyof SimulationAdjustments;
    label: string;
    value: number;
    onChange: (value: number) => void;
    color: string;
    icon: string;
  }> = ({ axis, label, value, onChange, color, icon }) => {
    const impact = Math.abs(value) * 0.1; // 예상 임팩트 (0-10)

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <span className="font-medium text-gray-900">{label}</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium ${
                value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600'
              }`}
            >
              {value > 0 ? '+' : ''}{value}
            </span>
            <div className="flex items-center gap-1">
              {value > 0 ? (
                <TrendingUp size={14} className="text-green-500" />
              ) : value < 0 ? (
                <TrendingDown size={14} className="text-red-500" />
              ) : null}
              <span className="text-xs text-gray-500">
                {impact.toFixed(1)}점 영향
              </span>
            </div>
          </div>
        </div>

        <div className="relative">
          <input
            type="range"
            min="-50"
            max="50"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #ef4444 0%, #f59e0b 25%, #10b981 50%, #06b6d4 75%, ${color} 100%)`
            }}
          />
          <div
            className="absolute top-0 w-4 h-4 rounded-full border-2 border-white shadow-lg pointer-events-none transition-all duration-200"
            style={{
              backgroundColor: color,
              left: `calc(${((value + 50) / 100) * 100}% - 8px)`,
              transform: 'translateY(-25%)'
            }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>-50 (최대 축소)</span>
          <span>0 (현재)</span>
          <span>+50 (최대 확장)</span>
        </div>
      </div>
    );
  };

  const getPresetColor = (difficulty: string) => {
    switch (difficulty) {
      case 'conservative': return 'border-green-200 bg-green-50';
      case 'moderate': return 'border-blue-200 bg-blue-50';
      case 'aggressive': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-main rounded-lg">
            <Sliders size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-dark">시뮬레이션 컨트롤</h3>
            <p className="text-sm text-neutral-gray">
              {simulation.isActive ? '시뮬레이션 활성' : '다양한 시나리오 테스트'}
            </p>
          </div>
        </div>

        {/* 제어 버튼들 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRealTimeMode(!realTimeMode)}
            className={`flex items-center gap-1 px-3 py-1 text-sm rounded-lg transition-colors ${
              realTimeMode
                ? 'bg-accent-green text-white border border-accent-green'
                : 'bg-neutral-light text-neutral-gray border border-neutral-border hover:bg-neutral-border'
            }`}
          >
            <Zap size={14} />
            실시간
          </button>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Settings size={14} />
            {showAdvanced ? '기본' : '고급'}
          </button>

          <button
            onClick={resetSimulation}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
          >
            <RotateCcw size={14} />
            리셋
          </button>

          {!realTimeMode && (
            <button
              onClick={handleRunSimulation}
              disabled={isRunning}
              className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isRunning
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isRunning ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Settings size={14} />
                  </motion.div>
                  실행 중
                </>
              ) : (
                <>
                  <Play size={14} />
                  실행
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 시뮬레이션 결과 요약 */}
      {simulation.isActive && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-blue-50 border border-blue-200 rounded-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-600" />
              <span className="font-medium text-gray-900">시뮬레이션 결과</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {simulation.calculatedScore.toFixed(1)}점
            </div>
          </div>

          {simulation.confidence > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">예측 신뢰도</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${simulation.confidence}%` }}
                  />
                </div>
                <span className="font-medium text-blue-600">
                  {simulation.confidence.toFixed(0)}%
                </span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* 프리셋 선택 */}
      <div className="space-y-3">
        <h4 className="font-medium text-neutral-dark flex items-center gap-2">
          <Target size={16} />
          시나리오 프리셋
        </h4>

        <div className="grid grid-cols-2 gap-3">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className={`p-3 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                selectedPreset === preset.id
                  ? getPresetColor(preset.difficulty) + ' border-opacity-100'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm text-gray-900 mb-1">
                {preset.name}
              </div>
              <div className="text-xs text-gray-600 mb-2">
                {preset.description}
              </div>
              <div className="text-xs text-gray-500">
                {preset.expectedOutcome}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 세부 조정 슬라이더들 */}
      <div className="space-y-6">
        <h4 className="font-medium text-neutral-dark flex items-center gap-2">
          <Sliders size={16} />
          세부 조정
        </h4>

        <div className="space-y-6">
          {/* 기본 조정 항목들 */}
          <SimulationSlider
            axis="price"
            label="가격/수익성"
            value={simulation.adjustments.price}
            onChange={(value) => handleSliderChange('price', value)}
            color={axisInfo.EC.color}
            icon={axisInfo.EC.icon}
          />

          <SimulationSlider
            axis="churn"
            label="고객 유지율"
            value={simulation.adjustments.churn}
            onChange={(value) => handleSliderChange('churn', value)}
            color={axisInfo.GO.color}
            icon={axisInfo.GO.icon}
          />

          <SimulationSlider
            axis="team"
            label="팀 역량"
            value={simulation.adjustments.team}
            onChange={(value) => handleSliderChange('team', value)}
            color={axisInfo.TO.color}
            icon={axisInfo.TO.icon}
          />

          <SimulationSlider
            axis="growth"
            label="성장률"
            value={simulation.adjustments.growth}
            onChange={(value) => handleSliderChange('growth', value)}
            color={axisInfo.PT.color}
            icon={axisInfo.PT.icon}
          />
        </div>
      </div>

      {/* 고급 설정 */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Settings size={16} />
                고급 설정
              </h4>

              <div className="space-y-3">
                {/* 시뮬레이션 정확도 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">시뮬레이션 정확도</span>
                  <select className="text-sm border border-gray-300 rounded px-2 py-1">
                    <option value="fast">빠름 (낮은 정확도)</option>
                    <option value="balanced" defaultValue>균형 (보통 정확도)</option>
                    <option value="precise">정밀 (높은 정확도)</option>
                  </select>
                </div>

                {/* 불확실성 고려 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">불확실성 고려</span>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">활성화</span>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 시나리오 저장 */}
      {simulation.isActive && (
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Save size={16} />
            시나리오 저장
          </h4>

          <div className="flex gap-2">
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="시나리오 이름을 입력하세요"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSaveScenario}
              disabled={!scenarioName.trim()}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              저장
            </button>
          </div>
        </div>
      )}

      {/* 경고 메시지 */}
      {simulation.isActive && simulation.risks && simulation.risks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 mb-1">주의사항</h4>
              <ul className="space-y-1">
                {simulation.risks.slice(0, 2).map((risk, index) => (
                  <li key={index} className="text-sm text-yellow-700">
                    • {risk}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};