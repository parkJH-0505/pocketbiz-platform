/**
 * DataInsightsTab - 통합된 데이터 시각화 및 인사이트 탭
 * 3D/2D 레이더 차트 + 동적 인사이트 통합
 */

import React, { useState, ErrorBoundary } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Brain, TrendingUp, AlertCircle, Eye, Settings, Wifi } from 'lucide-react';
import { useV2Store } from '../../store/useV2Store';
import { ThreeRadar } from '../ThreeRadar';
import { DynamicInsights } from '../DynamicInsights';
import { AxisDetailCard } from '../AxisDetailCard';
import { RadarSkeleton, InsightsSkeleton } from '../LoadingOverlay';
import { NetworkError, useOnlineStatus, EmptyState } from '../ErrorHandling';
import { AIInsightsPanel } from '../AIInsightsPanel';
import { AdvancedAIDashboard } from '../../../../../../components/ai/AdvancedAIDashboard';
import { RealTimeSimulationDashboard } from '../../../../../../components/simulation/RealTimeSimulationDashboard';
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
  const { data, viewState, loadData } = useV2Store();
  const [use3D, setUse3D] = useState(false);
  const isOnline = useOnlineStatus();

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

  return (
    <motion.div
      className="space-y-4 sm:space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 레이더 차트 섹션 */}
      <Card variant="default">
        <CardHeader
          title="KPI 레이더 차트"
          action={
            <button
              onClick={() => setUse3D(!use3D)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                use3D
                  ? 'bg-primary-main text-white'
                  : 'bg-neutral-light text-neutral-gray hover:bg-neutral-border'
              }`}
            >
              <Eye className="w-4 h-4 inline mr-1" />
              {use3D ? '3D' : '2D'}
            </button>
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
              </div>
            </RadarErrorBoundary>
          ) : (
            <Enhanced2DRadar scores={scores} />
          )}
        </CardBody>
      </Card>

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

      {/* Phase 6 AI 통합 인사이트 패널 */}
      <AIInsightsPanel
        currentScores={scores}
        historicalData={data?.history || []}
      />

      {/* Phase 8 고급 AI 대시보드 */}
      <AdvancedAIDashboard
        currentScores={scores}
        historicalData={data?.history || []}
        className="mt-6"
      />

      {/* Phase 8 실시간 시뮬레이션 대시보드 */}
      <RealTimeSimulationDashboard
        currentScores={scores}
        className="mt-6"
      />

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
    </motion.div>
  );
};