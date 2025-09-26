/**
 * SimulationTab - 통합된 시뮬레이션 탭
 * 기본 What-if 시뮬레이션 + 고급 시뮬레이터 통합
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Settings, Brain, TrendingUp, ArrowRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { useV2Store } from '../../store/useV2Store';
import { SimulationControls } from '../SimulationControls';
import { AdvancedSimulator } from '../AdvancedSimulator';
import { ScoreChanges } from '../ScoreChanges';
import { SkeletonCard } from '../LoadingOverlay';
// 절대 경로로 Card 컴포넌트 import
const Card = ({ children, variant = 'default', ...props }: any) => (
  <div className={`bg-white rounded-lg shadow-sm border ${variant === 'default' ? 'border-gray-200' : ''}`} {...props}>
    {children}
  </div>
);

const CardBody = ({ children, ...props }: any) => (
  <div className="p-4 sm:p-6" {...props}>{children}</div>
);

const CardHeader = ({ title, subtitle, action, ...props }: any) => (
  <div className="p-4 sm:p-6 pb-0 flex items-center justify-between" {...props}>
    <div>
      {title && <h3 className="text-base sm:text-lg font-semibold text-neutral-dark">{title}</h3>}
      {subtitle && <p className="text-xs sm:text-sm text-neutral-gray mt-1">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

type SimulationMode = 'basic' | 'advanced';

export const SimulationTab: React.FC = () => {
  const { simulation, viewState, data } = useV2Store();
  const [mode, setMode] = useState<SimulationMode>('basic');

  const currentScore = data?.current.overall || 0;
  const projectedScore = simulation.calculatedScore || currentScore;

  return (
    <motion.div
      className="space-y-4 sm:space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 헤더 및 모드 전환 */}
      <Card variant="default">
        <CardBody>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary-main" />
              <h3 className="text-lg font-semibold text-gray-900">
                시뮬레이션 & 예측
              </h3>
            </div>

            {/* 모드 전환 토글 */}
            <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMode('basic')}
                className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                  mode === 'basic'
                    ? 'bg-white text-primary-main shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-1" />
                기본 모드
              </button>
              <button
                onClick={() => setMode('advanced')}
                className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                  mode === 'advanced'
                    ? 'bg-white text-primary-main shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Brain className="w-4 h-4 inline mr-1" />
                고급 모드
              </button>
            </div>
          </div>

          {/* 현재 vs 예측 점수 표시 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(currentScore)}
                </div>
                <div className="text-xs text-gray-500 mt-1">현재 점수</div>
              </div>

              <ArrowRight className="w-5 h-5 text-gray-400" />

              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  projectedScore > currentScore ? 'text-green-600' :
                  projectedScore < currentScore ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {Math.round(projectedScore)}
                </div>
                <div className="text-xs text-gray-500 mt-1">예측 점수</div>
              </div>

              <div className="text-center">
                <div className={`text-lg font-semibold ${
                  projectedScore > currentScore ? 'text-green-600' :
                  projectedScore < currentScore ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {projectedScore > currentScore ? '+' : ''}
                  {Math.round(projectedScore - currentScore)}
                </div>
                <div className="text-xs text-gray-500 mt-1">변화량</div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 시뮬레이션 모드별 컨텐츠 */}
      <AnimatePresence mode="wait">
        {mode === 'basic' ? (
          <motion.div
            key="basic"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {/* 좌측: 기본 시뮬레이션 컨트롤 */}
            <div className="md:col-span-2 lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <h4 className="font-semibold text-gray-900">기본 시뮬레이션</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    주요 변수를 조정하여 KPI 변화를 예측해보세요
                  </p>
                </div>
                <div className="p-6">
                  <SimulationControls />
                </div>
              </div>
            </div>

            {/* 우측: 점수 변화 표시 */}
            <div className="md:col-span-2 lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <h4 className="font-semibold text-gray-900">변화 분석</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    축별 점수 변화량
                  </p>
                </div>
                <div className="p-6">
                  <ScoreChanges />
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="advanced"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* 고급 시뮬레이터 */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h4 className="font-semibold text-gray-900">고급 시뮬레이터</h4>
                <p className="text-sm text-gray-600 mt-1">
                  몬테카를로 시뮬레이션, 민감도 분석, 상호작용 효과 분석
                </p>
              </div>
              <div className="p-6">
                <AdvancedSimulator />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 에러 상태 처리 */}
      {viewState.error && !viewState.isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-accent-red/10 border border-accent-red/20 rounded-lg p-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-accent-red" />
              <span className="text-neutral-dark">{viewState.error}</span>
            </div>
            <button
              onClick={resetSimulation}
              className="text-accent-red hover:text-accent-red/80 text-sm font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              재설정
            </button>
          </div>
        </motion.div>
      )}

      {/* 시뮬레이션 활성 상태 표시 */}
      {simulation.isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-blue-700 font-medium">
                시뮬레이션 활성
              </span>
              <span className="text-blue-600 text-sm">
                (신뢰도: {Math.round(simulation.confidence)}%)
              </span>
            </div>
            <button
              onClick={resetSimulation}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              재설정
            </button>
          </div>
        </motion.div>
      )}

      {/* 로딩 상태 - 스켈레톤 스크린 적용 */}
      {viewState.isLoading && (
        <div className="space-y-6">
          <SkeletonCard className="" lines={4} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="md:col-span-2 lg:col-span-2">
              <SkeletonCard lines={6} />
            </div>
            <div className="md:col-span-2 lg:col-span-1">
              <SkeletonCard lines={4} />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};