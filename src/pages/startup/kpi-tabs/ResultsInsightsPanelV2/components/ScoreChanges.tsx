/**
 * ScoreChanges Component
 * 실시간 점수 변화 시각화
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Eye, EyeOff } from 'lucide-react';
import { useV2Store } from '../store/useV2Store';
import type { AxisKey } from '../types';

interface ScoreChangeItem {
  axis: AxisKey;
  current: number;
  previous: number;
  change: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  significance: 'high' | 'medium' | 'low';
}

export const ScoreChanges: React.FC = () => {
  const { data, simulation } = useV2Store();
  const [showDetails, setShowDetails] = useState(true);
  const [sortBy, setSortBy] = useState<'change' | 'current' | 'axis'>('change');

  // 축 정보
  const axisInfo = {
    GO: { label: '시장진출', color: '#10b981', shortLabel: 'GO' },
    EC: { label: '수익구조', color: '#f59e0b', shortLabel: 'EC' },
    PT: { label: '제품경쟁력', color: '#8b5cf6', shortLabel: 'PT' },
    PF: { label: '성과지표', color: '#ef4444', shortLabel: 'PF' },
    TO: { label: '팀조직', color: '#06b6d4', shortLabel: 'TO' }
  };

  // 점수 변화 데이터 계산
  const scoreChanges = useMemo(() => {
    if (!data) return [];

    const changes: ScoreChangeItem[] = [];
    const axes = Object.keys(data.current.scores) as AxisKey[];

    axes.forEach((axis) => {
      const current = simulation.isActive && simulation.projectedScores[axis]
        ? simulation.projectedScores[axis]
        : data.current.scores[axis];
      const previous = data.previous.scores[axis];
      const change = current - previous;
      const percentage = previous !== 0 ? (change / previous) * 100 : 0;

      // 변화의 중요도 계산
      const significance = Math.abs(change) > 10 ? 'high' :
                         Math.abs(change) > 5 ? 'medium' : 'low';

      changes.push({
        axis,
        current,
        previous,
        change,
        percentage,
        trend: change > 1 ? 'up' : change < -1 ? 'down' : 'stable',
        significance
      });
    });

    // 정렬
    return changes.sort((a, b) => {
      switch (sortBy) {
        case 'change':
          return Math.abs(b.change) - Math.abs(a.change);
        case 'current':
          return b.current - a.current;
        case 'axis':
          return a.axis.localeCompare(b.axis);
        default:
          return 0;
      }
    });
  }, [data, simulation, sortBy]);

  // 전체 점수 변화
  const overallChange = useMemo(() => {
    if (!data) return 0;
    const current = simulation.isActive ? simulation.calculatedScore : data.current.overall;
    return current - data.previous.overall;
  }, [data, simulation]);

  // 트렌드 아이콘
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Minus;
    }
  };

  // 변화량 색상
  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // 배경 색상 (시뮬레이션 활성화 시)
  const getBackgroundColor = (change: number, isSimulation: boolean) => {
    if (!isSimulation) return 'bg-white';
    if (change > 5) return 'bg-green-50';
    if (change < -5) return 'bg-red-50';
    return 'bg-blue-50';
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">점수 변화 추이</h3>
          <p className="text-sm text-gray-600">
            {simulation.isActive ? '시뮬레이션 결과' : '실제 성과 비교'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* 정렬 옵션 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white"
          >
            <option value="change">변화량순</option>
            <option value="current">현재점수순</option>
            <option value="axis">축순</option>
          </select>

          {/* 상세보기 토글 */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {showDetails ? <EyeOff size={14} /> : <Eye size={14} />}
            {showDetails ? '간단히' : '자세히'}
          </button>
        </div>
      </div>

      {/* 전체 점수 요약 */}
      <motion.div
        className={`p-4 rounded-xl border-2 ${
          simulation.isActive ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
        }`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">전체 점수</h4>
            <p className="text-sm text-gray-600">
              {simulation.isActive ? '시뮬레이션 예상' : '현재 성과'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {simulation.isActive ? simulation.calculatedScore : (data?.current.overall || 0)}
              </div>
              <div className="text-sm text-gray-500">점</div>
            </div>

            <div className="flex items-center gap-1">
              {overallChange > 0 ? (
                <TrendingUp size={20} className="text-green-500" />
              ) : overallChange < 0 ? (
                <TrendingDown size={20} className="text-red-500" />
              ) : (
                <Minus size={20} className="text-gray-400" />
              )}
              <span className={`font-medium ${getChangeColor(overallChange)}`}>
                {overallChange > 0 ? '+' : ''}{overallChange.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* 시뮬레이션 신뢰도 */}
        {simulation.isActive && simulation.confidence > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">예측 신뢰도</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${simulation.confidence}%` }}
                  />
                </div>
                <span className="font-medium text-blue-600">
                  {simulation.confidence.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* 개별 축 점수 변화 */}
      <div className="space-y-2">
        {scoreChanges.map((item, index) => {
          const Icon = getTrendIcon(item.trend);
          const axisColor = axisInfo[item.axis].color;

          return (
            <motion.div
              key={item.axis}
              className={`p-4 rounded-lg border transition-all duration-300 hover:shadow-md ${
                getBackgroundColor(item.change, simulation.isActive)
              } ${simulation.isActive ? 'border-blue-200' : 'border-gray-200'}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-center justify-between">
                {/* 축 정보 */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: axisColor }}
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {axisInfo[item.axis].label}
                    </h4>
                    {showDetails && (
                      <p className="text-xs text-gray-500">
                        {axisInfo[item.axis].shortLabel} 축
                      </p>
                    )}
                  </div>
                </div>

                {/* 점수와 변화량 */}
                <div className="flex items-center gap-4">
                  {/* 현재 점수 */}
                  <div className="text-right">
                    <div className="text-xl font-bold" style={{ color: axisColor }}>
                      {item.current.toFixed(0)}
                    </div>
                    {showDetails && (
                      <div className="text-xs text-gray-500">
                        이전: {item.previous.toFixed(0)}
                      </div>
                    )}
                  </div>

                  {/* 변화 표시 */}
                  <div className="flex items-center gap-1">
                    <Icon size={16} className={getChangeColor(item.change)} />
                    <div className="text-right">
                      <div className={`font-medium ${getChangeColor(item.change)}`}>
                        {item.change > 0 ? '+' : ''}{item.change.toFixed(1)}
                      </div>
                      {showDetails && Math.abs(item.percentage) > 0.1 && (
                        <div className={`text-xs ${getChangeColor(item.change)}`}>
                          ({item.percentage > 0 ? '+' : ''}{item.percentage.toFixed(1)}%)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 상세 정보 (확장 모드) */}
              {showDetails && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>중요도: {
                      item.significance === 'high' ? '높음' :
                      item.significance === 'medium' ? '보통' : '낮음'
                    }</span>

                    {/* 진행 바 */}
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            backgroundColor: axisColor,
                            width: `${item.current}%`
                          }}
                        />
                      </div>
                      <span>{item.current.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 빈 상태 */}
      {scoreChanges.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <TrendingUp size={48} className="mx-auto mb-3 text-gray-300" />
          <p>점수 변화 데이터가 없습니다.</p>
        </div>
      )}
    </div>
  );
};