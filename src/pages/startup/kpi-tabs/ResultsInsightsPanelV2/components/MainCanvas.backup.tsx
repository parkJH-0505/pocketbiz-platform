/**
 * Main Canvas Component for V2 Dashboard
 * 메인 인터렉티브 캔버스 - 3D Radar, Dynamic Insights, What-if Simulation
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useV2Store } from '../store/useV2Store';
import { axisInfo } from '../utils/mockApi';
import { Settings, BarChart3, Brain, Target, Zap, Users } from 'lucide-react';
import type { AxisKey } from '../types';
import { AxisDetailCard } from './AxisDetailCard';
import { ThreeRadar } from './ThreeRadar';
import { DynamicInsights } from './DynamicInsights';
import { ScoreChanges } from './ScoreChanges';
import { SmartRecommendations } from './SmartRecommendations';
import { SimulationControls } from './SimulationControls';
import { ScenarioManager } from './ScenarioManager';
import { AdvancedSimulator } from './AdvancedSimulator';
import CollaborationPanel from './CollaborationPanel';

export const MainCanvas: React.FC = () => {
  const { data, peerData, viewState, simulation, setSelectedAxis } = useV2Store();
  const [activeTab, setActiveTab] = useState<'radar' | 'insights' | 'simulation' | 'advanced' | 'scenarios' | 'collaboration'>('radar');

  const scores = data?.current.scores || {
    GO: 0,
    EC: 0,
    PT: 0,
    PF: 0,
    TO: 0
  };

  const tabs = [
    { key: 'radar', label: '3D 레이더', icon: BarChart3, description: '인터랙티브 레이더 차트' },
    { key: 'insights', label: '동적 인사이트', icon: Brain, description: 'AI 기반 실시간 분석' },
    { key: 'simulation', label: 'What-if 시뮬레이션', icon: Settings, description: '기본 시나리오 시뮬레이션' },
    { key: 'advanced', label: '고급 시뮬레이터', icon: Zap, description: '몬테카를로 & 민감도 분석' },
    { key: 'scenarios', label: '시나리오 관리', icon: Target, description: '저장된 시나리오 관리' },
    { key: 'collaboration', label: '협업', icon: Users, description: '시나리오 공유 & 승인 워크플로' }
  ];

  return (
    <div className="flex-1 mt-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* 탭 네비게이션 */}
        <div className="mb-6">
          <div className="flex items-center justify-between border-b border-gray-200">
            <div className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 상태 표시 */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {simulation.isActive && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span>시뮬레이션 활성</span>
                </div>
              )}
              <div>총 점수: <span className="font-medium text-gray-900">{(simulation.isActive ? simulation.calculatedScore : (data?.current.overall || 0)).toFixed(1)}</span></div>
            </div>
          </div>

          {/* 탭 설명 */}
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              {tabs.find(tab => tab.key === activeTab)?.description}
            </p>
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
            {activeTab === 'radar' && (
              <div className="grid grid-cols-12 gap-6">
                {/* Left: Axis Details */}
                <div className="col-span-3 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">KPI 세부 분석</h2>
                  {Object.entries(scores).map(([axis, score]) => (
                    <AxisDetailCard
                      key={axis}
                      axis={axis as AxisKey}
                      score={score}
                      previousScore={data?.previous.scores[axis as AxisKey] || 0}
                      peerAverage={peerData?.averages[axis as AxisKey] || 0}
                    />
                  ))}
                </div>

                {/* Center: 3D Radar Canvas */}
                <div className="col-span-6 relative bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm min-h-[600px] overflow-hidden">
                  <ThreeRadar
                    scores={scores}
                    width={600}
                    height={600}
                    className="w-full h-full"
                  />
                </div>

                {/* Right: Real-time Score Changes */}
                <div className="col-span-3 space-y-4">
                  <ScoreChanges />
                </div>
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="grid grid-cols-12 gap-6">
                {/* Left: Dynamic Insights */}
                <div className="col-span-6">
                  <DynamicInsights />
                </div>

                {/* Right: Smart Recommendations */}
                <div className="col-span-6">
                  <SmartRecommendations />
                </div>
              </div>
            )}

            {activeTab === 'simulation' && (
              <div className="grid grid-cols-12 gap-6">
                {/* Left: Simulation Controls */}
                <div className="col-span-5">
                  <SimulationControls />
                </div>

                {/* Right: 3D Radar with Simulation Results */}
                <div className="col-span-7 relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-sm min-h-[600px] overflow-hidden">
                  <div className="absolute top-4 left-4 z-10">
                    <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm">
                      <div className="text-sm font-medium text-gray-900">시뮬레이션 결과</div>
                      <div className="text-xs text-gray-600">
                        {simulation.isActive ? '실시간 업데이트' : '기본 데이터'}
                      </div>
                    </div>
                  </div>

                  <ThreeRadar
                    scores={simulation.isActive
                      ? Object.entries(scores).reduce((acc, [key, value]) => {
                          // 시뮬레이션 결과 반영 (예시 로직)
                          const adjustment = simulation.projectedScores[key as AxisKey] || value;
                          acc[key as AxisKey] = adjustment;
                          return acc;
                        }, {} as Record<AxisKey, number>)
                      : scores
                    }
                    width={600}
                    height={600}
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="col-span-12">
                <AdvancedSimulator />
              </div>
            )}

            {activeTab === 'scenarios' && (
              <div className="col-span-12">
                <ScenarioManager />
              </div>
            )}

            {activeTab === 'collaboration' && (
              <div className="grid grid-cols-12 gap-6">
                {/* Left: 3D Radar for Context */}
                <div className="col-span-8 relative bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm min-h-[600px] overflow-hidden">
                  <div className="absolute top-4 left-4 z-10">
                    <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm">
                      <div className="text-sm font-medium text-gray-900">현재 시나리오</div>
                      <div className="text-xs text-gray-600">협업 대상</div>
                    </div>
                  </div>

                  <ThreeRadar
                    scores={scores}
                    width={600}
                    height={600}
                    className="w-full h-full"
                  />
                </div>

                {/* Right: Collaboration Panel */}
                <div className="col-span-4">
                  <CollaborationPanel
                    scenarioId="current_scenario"
                    scenarioName="현재 KPI 시나리오"
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Helper function to calculate radar polygon points
function getRadarPoints(scores: Record<AxisKey, number>): string {
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
  const points = axes.map((axis, index) => {
    const angle = (index * 72 - 90) * (Math.PI / 180);
    const radius = (scores[axis] / 100) * 150;
    const x = 200 + radius * Math.cos(angle);
    const y = 200 + radius * Math.sin(angle);
    return `${x},${y}`;
  });
  return points.join(' ');
}