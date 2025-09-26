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
// 새로운 통합 컴포넌트들
import { DataInsightsTab } from './integrated/DataInsightsTab';
import { SimulationTab } from './integrated/SimulationTab';
import { ScenarioActionTab } from './integrated/ScenarioActionTab';

// 기존 컴포넌트들 (점진적 제거 예정)
// import { AxisDetailCard } from './AxisDetailCard';
// import { ThreeRadar } from './ThreeRadar';
// import { DynamicInsights } from './DynamicInsights';
// import { ScoreChanges } from './ScoreChanges';
// import { SmartRecommendations } from './SmartRecommendations';
// import { SimulationControls } from './SimulationControls';
// import { ScenarioManager } from './ScenarioManager';
// import { AdvancedSimulator } from './AdvancedSimulator';
// import CollaborationPanel from './CollaborationPanel';

export const MainCanvas: React.FC = () => {
  const { data, simulation, viewState } = useV2Store();
  const [activeTab, setActiveTab] = useState<'data' | 'simulation' | 'action'>('data');

  const tabs = [
    { key: 'data', label: '데이터 & 인사이트', icon: BarChart3, description: '레이더 차트 및 AI 분석' },
    { key: 'simulation', label: '시뮬레이션 & 예측', icon: Zap, description: '기본/고급 시뮬레이션' },
    { key: 'action', label: '시나리오 & 액션', icon: Target, description: '시나리오 관리 및 실행 계획' }
  ];

  return (
    <div className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* 탭 네비게이션 - 모바일 반응형 */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-gray-200 gap-4">
            {/* 모바일에서 스크롤 가능한 탭 */}
            <div className="flex space-x-4 sm:space-x-8 overflow-x-auto pb-2 lg:pb-0">
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
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 상태 표시 - 모바일에서 순서 변경 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 order-last lg:order-none">
              <div className="font-medium text-gray-900">총 점수: {(simulation.isActive ? simulation.calculatedScore : (data?.current.overall || 0)).toFixed(1)}</div>
              {simulation.isActive && (
                <div className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span>시뮬레이션 활성</span>
                </div>
              )}
            </div>
          </div>

          {/* 탭 설명 - 모바일에서 숨김 */}
          <div className="mt-2 hidden sm:block">
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
            {/* 새로운 통합 탭들 */}
            {activeTab === 'data' && <DataInsightsTab />}
            {activeTab === 'simulation' && <SimulationTab />}
            {activeTab === 'action' && <ScenarioActionTab />}

            {/* 기본값: 데이터 & 인사이트 탭 */}
            {!['data', 'simulation', 'action'].includes(activeTab) && <DataInsightsTab />}
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