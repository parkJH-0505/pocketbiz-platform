/**
 * DataInsightsTab - 통합된 데이터 시각화 및 인사이트 탭
 * 3D/2D 레이더 차트 + 동적 인사이트 통합
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Brain, TrendingUp, AlertCircle, Eye, Settings, Wifi, Play, Pause, Save, GitCompare, MoreHorizontal, Zap, ArrowLeft } from 'lucide-react';
import { useV2Store } from '../../store/useV2Store';
import { ThreeRadar } from '../ThreeRadar';
import { DynamicInsights } from '../DynamicInsights';
import { AxisDetailCard } from '../AxisDetailCard';
import { AxisDetailPanel } from '../AxisDetailPanel';
import { RadarSkeleton, InsightsSkeleton } from '../LoadingOverlay';
import { NetworkError, useOnlineStatus, EmptyState } from '../ErrorHandling';
import { AIInsightsPanel } from '../AIInsightsPanel';
import { RealTimeMonitor } from '../RealTimeMonitor';
import { SmartNotificationSystem } from '../SmartNotificationSystem';
import { ScenarioManager } from '../ScenarioManager';
import { ScenarioComparison } from '../ScenarioComparison';
// 최적화된 대용량 컴포넌트 import
import {
  OptimizedAdvancedAIDashboard,
  OptimizedRealTimeSimulationDashboard,
  useResourceMonitor
} from './OptimizedComponents';
import { SimplifiedResultsView } from '../SimplifiedResultsView';
// Card 컴포넌트 타입 정의
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'outlined';
}

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, variant = 'default', ...props }) => (
  <div className={`bg-white rounded-lg shadow-sm border ${variant === 'default' ? 'border-gray-200' : ''}`} {...props}>
    {children}
  </div>
);

const CardBody: React.FC<CardBodyProps> = ({ children, ...props }) => (
  <div className="p-4 sm:p-6" {...props}>{children}</div>
);

const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, action, ...props }) => (
  <div className="p-4 sm:p-6 pb-0 flex items-center justify-between" {...props}>
    <div>
      {title && <h3 className="text-base sm:text-lg font-semibold text-neutral-dark">{title}</h3>}
      {subtitle && <p className="text-xs sm:text-sm text-neutral-gray mt-1">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);
import type { AxisKey } from '../../types';

// 개선된 2D 레이더 차트 (성능 최적화 및 시각화 개선)
const Enhanced2DRadar: React.FC<{ scores: Record<AxisKey, number> }> = ({ scores }) => {
  const axes = Object.keys(scores) as AxisKey[];
  const axisInfo = {
    GO: { label: '성장·운영', color: 'var(--color-accent-green)', bgColor: 'bg-green-50' },
    EC: { label: '경제성·자본', color: 'var(--color-accent-orange)', bgColor: 'bg-orange-50' },
    PT: { label: '제품·기술력', color: 'var(--color-primary-main)', bgColor: 'bg-blue-50' },
    PF: { label: '증빙·딜레디', color: 'var(--color-accent-red)', bgColor: 'bg-red-50' },
    TO: { label: '팀·조직', color: 'var(--color-neutral-gray)', bgColor: 'bg-gray-50' }
  };

  const overallScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 5);

  // SVG 레이더 차트 생성
  const generateRadarChart = () => {
    const centerX = 150;
    const centerY = 150;
    const maxRadius = 120;
    const levels = 5;

    // 축 각도 계산 (5각형)
    const angleStep = (2 * Math.PI) / 5;
    const axisPoints = axes.map((axis, index) => {
      const angle = index * angleStep - Math.PI / 2; // -90도부터 시작
      return {
        axis,
        angle,
        x: centerX + maxRadius * Math.cos(angle),
        y: centerY + maxRadius * Math.sin(angle),
        score: scores[axis]
      };
    });

    // 점수에 따른 실제 포인트
    const scorePoints = axisPoints.map(point => {
      const radius = (point.score / 100) * maxRadius;
      return {
        ...point,
        scoreX: centerX + radius * Math.cos(point.angle),
        scoreY: centerY + radius * Math.sin(point.angle)
      };
    });

    return {
      centerX,
      centerY,
      maxRadius,
      levels,
      axisPoints,
      scorePoints,
      pathData: scorePoints.map(p => `${p.scoreX},${p.scoreY}`).join(' ')
    };
  };

  const chartData = generateRadarChart();

  return (
    <div className="space-y-6">
      {/* 종합 점수 표시 */}
      <div className="text-center">
        <div className="text-4xl font-bold text-primary-main mb-2">
          {overallScore}
        </div>
        <div className="text-neutral-gray">종합 점수</div>
      </div>

      {/* SVG 레이더 차트 */}
      <div className="flex justify-center">
        <svg width="300" height="300" className="drop-shadow-sm">
          {/* 배경 격자 */}
          {[...Array(chartData.levels)].map((_, level) => {
            const radius = (chartData.maxRadius / chartData.levels) * (level + 1);
            const points = chartData.axisPoints.map(point =>
              `${chartData.centerX + radius * Math.cos(point.angle)},${chartData.centerY + radius * Math.sin(point.angle)}`
            ).join(' ');

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
          {chartData.axisPoints.map((point, index) => (
            <line
              key={`axis-${index}`}
              x1={chartData.centerX}
              y1={chartData.centerY}
              x2={point.x}
              y2={point.y}
              stroke="#d1d5db"
              strokeWidth="1"
            />
          ))}

          {/* 실제 점수 폴리곤 */}
          <polygon
            points={chartData.pathData}
            fill="rgba(59, 130, 246, 0.2)"
            stroke="#3b82f6"
            strokeWidth="2"
            className="animate-pulse"
          />

          {/* 점수 포인트들 */}
          {chartData.scorePoints.map((point, index) => (
            <circle
              key={`point-${index}`}
              cx={point.scoreX}
              cy={point.scoreY}
              r="4"
              fill={axisInfo[point.axis].color}
              stroke="white"
              strokeWidth="2"
              className="hover:r-6 transition-all"
            />
          ))}

          {/* 축 라벨들 */}
          {chartData.axisPoints.map((point, index) => (
            <text
              key={`label-${index}`}
              x={point.x + (point.x > chartData.centerX ? 10 : point.x < chartData.centerX ? -10 : 0)}
              y={point.y + (point.y > chartData.centerY ? 15 : point.y < chartData.centerY ? -10 : 5)}
              textAnchor={point.x > chartData.centerX ? 'start' : point.x < chartData.centerX ? 'end' : 'middle'}
              className="text-xs font-medium fill-neutral-gray"
            >
              {axisInfo[point.axis].label}
            </text>
          ))}
        </svg>
      </div>

      {/* 축별 점수 상세 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
        {axes.map((axis) => {
          const info = axisInfo[axis];
          const score = scores[axis];
          return (
            <div key={axis} className={`text-center p-3 rounded-lg ${info.bgColor}`}>
              <div className="text-lg font-bold" style={{ color: info.color }}>
                {Math.round(score)}
              </div>
              <div className="text-xs text-neutral-gray mt-1">
                {info.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 개선된 에러 바운더리 컴포넌트
class RadarErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean; errorInfo: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorInfo: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorInfo: error.message };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.warn('3D Radar 렌더링 실패, 2D 폴백으로 전환:', error.message);
    // 성능 모니터링이나 에러 리포팅 로직 추가 가능
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative">
          {this.props.fallback}
          <div className="absolute top-2 right-2 text-xs bg-accent-orange text-white px-2 py-1 rounded">
            3D → 2D 전환됨
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const DataInsightsTab: React.FC = () => {
  const { data, viewState, loadData, selectedAxis, setSelectedAxis, simulation, setSimulationActive } = useV2Store();
  const [use3D, setUse3D] = useState(false);
  const [showScenarioManager, setShowScenarioManager] = useState(false);
  const [showScenarioComparison, setShowScenarioComparison] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [viewMode, setViewMode] = useState<'simplified' | 'advanced'>('simplified');
  const isOnline = useOnlineStatus();
  const resourceStatus = useResourceMonitor();

  const scores = data?.current.scores || {
    GO: 0, EC: 0, PT: 0, PF: 0, TO: 0
  };

  const hasData = data && Object.values(scores).some(score => score > 0);

  // 네트워크 오류인 경우 네트워크 에러 컴포넌트 표시
  if (!isOnline) {
    return (
      <NetworkError
        onRetry={loadData}
        isOnline={isOnline}
      />
    );
  }

  // 데이터가 없는 경우 빈 상태 표시
  if (!viewState.isLoading && !hasData) {
    return (
      <EmptyState
        title="데이터 없음"
        description="표시할 KPI 데이터가 없습니다. 데이터 연결을 확인하거나 KPI 진단을 다시 실행해주세요."
        icon={<BarChart3 className="w-8 h-8 text-neutral-gray" />}
        action={{
          label: "데이터 새로고침",
          onClick: loadData
        }}
      />
    );
  }

  // 간단한 모드일 때는 SimplifiedResultsView만 표시
  if (viewMode === 'simplified') {
    return (
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* 모드 전환 버튼 */}
        <div className="flex justify-end">
          <button
            onClick={() => setViewMode('advanced')}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            고급 분석 모드
          </button>
        </div>

        {/* 간단한 결과 뷰 */}
        <SimplifiedResultsView
          onAdvancedModeClick={() => setViewMode('advanced')}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-4 sm:space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 모드 전환 헤더 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">고급 분석 모드</h2>
            <p className="text-sm text-gray-600">상세한 차트와 시뮬레이션 기능을 제공합니다</p>
          </div>
          <button
            onClick={() => setViewMode('simplified')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            간단한 결과 보기
          </button>
        </div>
      </div>
      {/* 레이더 차트 섹션 */}
      <Card variant="default">
        <CardHeader
          title="KPI 분석 결과"
          subtitle={`전체 점수: ${Math.round(data?.current.overall || 0)}점 ${(() => {
            if (!data?.changes) return '📊';
            const totalChange = Object.values(data.changes).reduce((sum, change) => sum + change, 0);
            return totalChange > 0 ? '📈' : totalChange < 0 ? '📉' : '📊';
          })()}`}
          action={
            <div className="flex items-center gap-3">
              {/* 주요 액션: 간단하고 명확하게 */}
              <div className="flex items-center gap-2">
                {/* 스마트 알림 - 항상 표시 */}
                <div className="relative">
                  <SmartNotificationSystem />
                </div>

                {/* 2D/3D 토글 - 핵심 기능 */}
                <button
                  onClick={() => setUse3D(!use3D)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    use3D
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={use3D ? '2D 차트로 전환' : '3D 인터랙티브 차트로 전환'}
                >
                  <Eye className="w-4 h-4 inline mr-1" />
                  {use3D ? '3D 활성' : '3D 보기'}
                </button>

                {/* 시뮬레이션 - 3D 모드에서만 표시 */}
                {use3D && (
                  <button
                    onClick={() => setSimulationActive(!simulation.isActive)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      simulation.isActive
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    }`}
                    title={simulation.isActive ? '시뮬레이션 종료' : '시뮬레이션 시작 - 차트를 드래그해보세요'}
                  >
                    {simulation.isActive ? (
                      <>
                        <Pause className="w-4 h-4 inline mr-1" />
                        시뮬레이션 중
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 inline mr-1" />
                        시뮬레이션
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* 구분선 */}
              <div className="w-px h-6 bg-gray-300"></div>

              {/* 고급 옵션 - 드롭다운으로 정리 */}
              <div className="relative">
                <button
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                    showAdvancedOptions || showScenarioManager || showScenarioComparison
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="고급 기능 및 시나리오 관리"
                >
                  <MoreHorizontal className="w-4 h-4" />
                  고급 기능
                </button>

                {/* 고급 옵션 드롭다운 */}
                {showAdvancedOptions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-2"
                  >
                    <button
                      onClick={() => {
                        setShowScenarioManager(!showScenarioManager);
                        setShowAdvancedOptions(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Save className="w-4 h-4 text-purple-500" />
                      <div className="text-left">
                        <div className="font-medium">시나리오 저장</div>
                        <div className="text-xs text-gray-500">현재 상태를 저장하고 관리</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowScenarioComparison(!showScenarioComparison);
                        setShowAdvancedOptions(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <GitCompare className="w-4 h-4 text-indigo-500" />
                      <div className="text-left">
                        <div className="font-medium">시나리오 비교</div>
                        <div className="text-xs text-gray-500">여러 시나리오를 비교 분석</div>
                      </div>
                    </button>

                    <div className="border-t border-gray-100 my-1"></div>

                    <div className="px-4 py-2">
                      <div className="text-xs text-gray-500 mb-1">빠른 도움말</div>
                      <div className="text-xs text-gray-600">
                        • 3D 모드에서 차트 클릭/드래그<br/>
                        • 시뮬레이션으로 예측 분석<br/>
                        • 시나리오 저장으로 전략 관리
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          }
        />
        <CardBody>
          {use3D ? (
            <RadarErrorBoundary fallback={<Enhanced2DRadar scores={scores} />}>
              <div className="h-96 relative">
                <React.Suspense fallback={
                  <div className="flex items-center justify-center h-full">
                    <RadarSkeleton />
                  </div>
                }
                >
                  <ThreeRadar
                    scores={scores}
                    width={600}
                    height={400}
                    className="w-full h-full"
                  />
                </React.Suspense>

                {/* 3D 모드 간단 가이드 */}
                {use3D && !simulation.isActive && (
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm border max-w-xs">
                    <div className="flex items-center gap-2 text-gray-800 mb-1">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">3D 차트 사용법</span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>• 축을 클릭하면 상세 정보 확인</div>
                      <div>• "시뮬레이션" 버튼으로 예측 분석</div>
                      <div>• 마우스로 차트 회전 가능</div>
                    </div>
                  </div>
                )}

                {/* 시뮬레이션 모드 가이드 */}
                {use3D && simulation.isActive && (
                  <div className="absolute top-4 left-4 bg-green-50/95 backdrop-blur-sm p-3 rounded-lg shadow-sm border border-green-200 max-w-xs">
                    <div className="flex items-center gap-2 text-green-800 mb-1">
                      <Zap className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">시뮬레이션 활성</span>
                    </div>
                    <div className="text-xs text-green-700 space-y-1">
                      <div>• 점수 포인트를 드래그해보세요</div>
                      <div>• 실시간으로 변화를 확인할 수 있습니다</div>
                      <div>• 마음에 드는 결과를 시나리오로 저장하세요</div>
                    </div>
                  </div>
                )}
              </div>
            </RadarErrorBoundary>
          ) : (
            <div>
              <Enhanced2DRadar scores={scores} />

              {/* 2D 모드 간단 가이드 */}
              {!use3D && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm font-medium">더 많은 기능이 궁금하다면?</span>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    상단의 "3D 보기" 버튼을 클릭하면 인터랙티브 시뮬레이션을 체험할 수 있습니다.
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* 시나리오 관리 섹션 */}
      {showScenarioManager && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card variant="default">
            <CardHeader
              title="시나리오 관리"
              subtitle="현재 상태 저장, 불러오기 및 시나리오 관리"
            />
            <CardBody>
              <ScenarioManager />
            </CardBody>
          </Card>
        </motion.div>
      )}

      {/* 시나리오 비교 섹션 */}
      {showScenarioComparison && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card variant="default">
            <CardHeader
              title="시나리오 비교 분석"
              subtitle="여러 시나리오를 비교하여 최적의 전략을 찾아보세요"
            />
            <CardBody>
              <ScenarioComparison />
            </CardBody>
          </Card>
        </motion.div>
      )}

      {/* 동적 인사이트 섹션 */}
      <Card variant="default">
        <CardHeader
          title="AI 인사이트 분석"
          subtitle="실시간으로 생성되는 데이터 기반 인사이트"
        />
        <CardBody>
          <DynamicInsights />
        </CardBody>
      </Card>

      {/* 실시간 모니터링 섹션 - 고급 기능이 활성화된 경우에만 표시 */}
      {(showScenarioManager || showScenarioComparison) && (
        <RealTimeMonitor className="mt-6" />
      )}

      {/* Phase 6 AI 통합 인사이트 패널 */}
      <AIInsightsPanel
        currentScores={scores}
        historicalData={data?.history || []}
      />

      {/* Phase 8 고급 AI 대시보드 - 최적화된 버전 */}
      {resourceStatus.isHealthy && (
        <React.Suspense fallback={
          <Card variant="default">
            <CardBody>
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-main border-t-transparent"></div>
                <span className="ml-3 text-neutral-gray">AI 대시보드 로딩 중...</span>
              </div>
            </CardBody>
          </Card>
        }>
          <OptimizedAdvancedAIDashboard
            currentScores={scores}
            historicalData={data?.history || []}
            className="mt-6"
          />
        </React.Suspense>
      )}

      {/* Phase 8 실시간 시뮬레이션 대시보드 - 최적화된 버전 */}
      {resourceStatus.isHealthy && (
        <React.Suspense fallback={
          <Card variant="default">
            <CardBody>
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-main border-t-transparent"></div>
                <span className="ml-3 text-neutral-gray">실시간 시뮬레이션 로딩 중...</span>
              </div>
            </CardBody>
          </Card>
        }>
          <OptimizedRealTimeSimulationDashboard
            currentScores={scores}
            className="mt-6"
          />
        </React.Suspense>
      )}

      {/* 리소스 경고 표시 */}
      {resourceStatus.warning && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800">{resourceStatus.warning}</span>
          </div>
        </motion.div>
      )}

      {/* 로딩 상태 처리 - 스켈레톤 스크린 적용 */}
      {viewState.isLoading && (
        <div className="space-y-6">
          <RadarSkeleton />
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-6 w-32 bg-neutral-light rounded animate-pulse" />
                  <div className="h-4 w-48 bg-neutral-light rounded animate-pulse" />
                </div>
                <div className="h-8 w-16 bg-neutral-light rounded animate-pulse" />
              </div>
            </div>
            <div className="p-6">
              <InsightsSkeleton />
            </div>
          </div>
        </div>
      )}

      {/* 개선된 에러 상태 처리 */}
      {viewState.error && !viewState.isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-accent-red/10 border border-accent-red/20 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-accent-red" />
              <span className="text-neutral-dark">{viewState.error}</span>
            </div>
            <button
              onClick={loadData}
              className="text-accent-red hover:text-accent-red/80 text-sm font-medium flex items-center gap-1"
            >
              <Wifi className="w-4 h-4" />
              다시 시도
            </button>
          </div>
        </motion.div>
      )}

      {/* 축 상세 정보 패널 */}
      <AxisDetailPanel
        selectedAxis={selectedAxis}
        onClose={() => setSelectedAxis(null)}
        scores={scores}
      />
    </motion.div>
  );
};