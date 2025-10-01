/**
 * EmotionPatternChart Component
 *
 * 감정 패턴을 시각화하는 차트 컴포넌트
 * - 7일/30일 감정 변화 라인 차트
 * - 시간대별 히트맵
 * - 요일별 패턴
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { emotionAnalyticsEngine } from '../../services/emotionAnalyticsEngine';
import type { EmotionPatternAnalysis, TimeRange } from '../../types/analytics.types';

interface EmotionPatternChartProps {
  className?: string;
  initialTimeRange?: TimeRange;
}

type ChartView = 'timeline' | 'hourly' | 'weekly' | 'radar';

const EmotionPatternChart: React.FC<EmotionPatternChartProps> = ({
  className = "",
  initialTimeRange = '7d'
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);
  const [chartView, setChartView] = useState<ChartView>('timeline');
  const [analysis, setAnalysis] = useState<EmotionPatternAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  // 데이터 로드
  useEffect(() => {
    const loadAnalysis = () => {
      setLoading(true);
      try {
        const data = emotionAnalyticsEngine.analyzePatterns(timeRange);
        setAnalysis(data);
      } catch (error) {
        console.error('Failed to load emotion analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [timeRange]);

  // 타임라인 데이터 준비
  const timelineData = useMemo(() => {
    if (!analysis || analysis.dataPoints.length === 0) return [];

    // 시간별로 그룹화하고 평균 계산
    const grouped = new Map<string, any>();

    analysis.dataPoints.forEach(point => {
      const date = new Date(point.timestamp);
      const key = timeRange === '7d'
        ? `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}시`
        : `${date.getMonth()+1}/${date.getDate()}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          time: key,
          energy: [],
          confidence: [],
          motivation: [],
          stress: [],
          momentum: []
        });
      }

      const data = grouped.get(key)!;
      data.energy.push(point.energy);
      data.confidence.push(point.confidence);
      data.motivation.push(point.motivation);
      data.stress.push(point.stress);
      data.momentum.push(point.momentumScore);
    });

    // 평균 계산
    return Array.from(grouped.values()).map(data => ({
      time: data.time,
      에너지: Math.round(average(data.energy)),
      자신감: Math.round(average(data.confidence)),
      동기부여: Math.round(average(data.motivation)),
      스트레스: Math.round(average(data.stress)),
      모멘텀: Math.round(average(data.momentum))
    }));
  }, [analysis, timeRange]);

  // 시간대별 데이터
  const hourlyData = useMemo(() => {
    if (!analysis) return [];

    return analysis.hourlyPatterns.map(pattern => ({
      hour: `${pattern.hour}시`,
      에너지: Math.round(pattern.avgEnergy),
      자신감: Math.round(pattern.avgConfidence),
      동기부여: Math.round(pattern.avgMotivation),
      스트레스: Math.round(pattern.avgStress),
      모멘텀: Math.round(pattern.avgMomentum)
    }));
  }, [analysis]);

  // 요일별 데이터
  const weeklyData = useMemo(() => {
    if (!analysis) return [];

    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    return analysis.weeklyPatterns.map(pattern => ({
      day: dayNames[pattern.dayOfWeek],
      에너지: Math.round(pattern.avgEnergy),
      자신감: Math.round(pattern.avgConfidence),
      동기부여: Math.round(pattern.avgMotivation),
      스트레스: Math.round(pattern.avgStress),
      모멘텀: Math.round(pattern.avgMomentum)
    }));
  }, [analysis]);

  // 레이더 차트 데이터
  const radarData = useMemo(() => {
    if (!analysis || analysis.dataPoints.length === 0) return [];

    const latest = analysis.dataPoints[analysis.dataPoints.length - 1];
    return [
      { metric: '에너지', value: latest.energy, fullMark: 100 },
      { metric: '자신감', value: latest.confidence, fullMark: 100 },
      { metric: '동기부여', value: latest.motivation, fullMark: 100 },
      { metric: '생산성', value: latest.momentumScore, fullMark: 100 },
      { metric: '평온함', value: 100 - latest.stress, fullMark: 100 }
    ];
  }, [analysis]);

  const average = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  // 색상 테마
  const colors = {
    에너지: '#FCD34D',      // Yellow
    자신감: '#60A5FA',      // Blue
    동기부여: '#A78BFA',    // Purple
    스트레스: '#F87171',    // Red
    모멘텀: '#34D399'       // Green
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border shadow-sm p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!analysis || analysis.dataPoints.length === 0) {
    return (
      <div className={`bg-white rounded-xl border shadow-sm p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          📊 감정 패턴 분석
        </h3>
        <div className="text-center py-12 text-gray-500">
          아직 충분한 데이터가 수집되지 않았습니다.
          <br />
          시간이 지나면 패턴 분석이 표시됩니다.
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border shadow-sm ${className}`}>
      {/* 헤더 */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            📊 감정 패턴 분석
          </h3>

          {/* 기간 선택 */}
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`
                  px-3 py-1 text-sm font-medium rounded-lg transition-colors
                  ${timeRange === range
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'}
                `}
              >
                {range === '7d' ? '7일' : range === '30d' ? '30일' : '90일'}
              </button>
            ))}
          </div>
        </div>

        {/* 차트 뷰 선택 */}
        <div className="flex gap-2">
          {[
            { key: 'timeline', label: '📈 타임라인', icon: '📈' },
            { key: 'hourly', label: '⏰ 시간대별', icon: '⏰' },
            { key: 'weekly', label: '📅 요일별', icon: '📅' },
            { key: 'radar', label: '🎯 현재 상태', icon: '🎯' }
          ].map(view => (
            <button
              key={view.key}
              onClick={() => setChartView(view.key as ChartView)}
              className={`
                px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1
                ${chartView === view.key
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'}
              `}
            >
              <span>{view.icon}</span>
              <span>{view.label.split(' ')[1]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={chartView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* 타임라인 차트 */}
            {chartView === 'timeline' && timelineData.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="time"
                    stroke="#6B7280"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="모멘텀"
                    stroke={colors.모멘텀}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="에너지"
                    stroke={colors.에너지}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="자신감"
                    stroke={colors.자신감}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="동기부여"
                    stroke={colors.동기부여}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="스트레스"
                    stroke={colors.스트레스}
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {/* 시간대별 차트 */}
            {chartView === 'hourly' && hourlyData.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="hour" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="모멘텀"
                    stackId="1"
                    stroke={colors.모멘텀}
                    fill={colors.모멘텀}
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="에너지"
                    stackId="2"
                    stroke={colors.에너지}
                    fill={colors.에너지}
                    fillOpacity={0.4}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {/* 요일별 차트 */}
            {chartView === 'weekly' && weeklyData.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="모멘텀" fill={colors.모멘텀} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="에너지" fill={colors.에너지} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="자신감" fill={colors.자신감} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {/* 레이더 차트 (현재 상태) */}
            {chartView === 'radar' && radarData.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="metric" stroke="#6B7280" fontSize={12} />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    stroke="#6B7280"
                    fontSize={10}
                  />
                  <Radar
                    name="현재 상태"
                    dataKey="value"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.6}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </AnimatePresence>

        {/* 인사이트 */}
        {analysis.insights.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              💡 주요 인사이트
            </h4>
            {analysis.insights.slice(0, 3).map(insight => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`
                  p-3 rounded-lg border
                  ${insight.type === 'positive' ? 'bg-green-50 border-green-200' :
                    insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    insight.type === 'negative' ? 'bg-red-50 border-red-200' :
                    'bg-gray-50 border-gray-200'}
                `}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-800">
                      {insight.title}
                    </h5>
                    <p className="text-sm text-gray-600 mt-1">
                      {insight.description}
                    </p>
                    {insight.recommendation && (
                      <p className="text-sm text-blue-600 mt-2">
                        💡 {insight.recommendation}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    신뢰도 {insight.confidence}%
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* 트렌드 표시 */}
        <div className="mt-6 grid grid-cols-5 gap-3">
          {Object.entries(analysis.trends).map(([key, trend]) => (
            <div
              key={key}
              className="text-center p-3 bg-gray-50 rounded-lg"
            >
              <div className="text-xs text-gray-500 capitalize">
                {key === 'energy' ? '에너지' :
                 key === 'confidence' ? '자신감' :
                 key === 'motivation' ? '동기부여' :
                 key === 'stress' ? '스트레스' : '모멘텀'}
              </div>
              <div className={`
                text-lg font-bold mt-1
                ${trend === 'rising' ? 'text-green-600' :
                  trend === 'falling' ? 'text-red-600' :
                  'text-gray-600'}
              `}>
                {trend === 'rising' ? '↗' :
                 trend === 'falling' ? '↘' : '→'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmotionPatternChart;