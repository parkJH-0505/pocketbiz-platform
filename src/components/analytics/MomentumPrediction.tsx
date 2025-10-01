/**
 * MomentumPrediction Component
 *
 * AI 기반 모멘텀 예측을 시각화하는 컴포넌트
 * - 다음 24시간 예측
 * - 최적 작업 시간 추천
 * - 예측 신뢰도 표시
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { momentumPredictionEngine } from '../../services/momentumPredictionEngine';
import type { MomentumPrediction } from '../../types/analytics.types';

interface MomentumPredictionProps {
  className?: string;
  compact?: boolean;
}

const MomentumPrediction: React.FC<MomentumPredictionProps> = ({
  className = "",
  compact = false
}) => {
  const [predictions, setPredictions] = useState<MomentumPrediction[]>([]);
  const [bestTimes, setBestTimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrediction, setSelectedPrediction] = useState<MomentumPrediction | null>(null);

  // 예측 데이터 로드
  useEffect(() => {
    const loadPredictions = async () => {
      setLoading(true);
      try {
        const [predictionData, recommendedTimes] = await Promise.all([
          momentumPredictionEngine.predictNext24Hours(),
          momentumPredictionEngine.recommendBestTimes()
        ]);

        setPredictions(predictionData);
        setBestTimes(recommendedTimes);
      } catch (error) {
        console.error('Failed to load predictions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPredictions();
    // 1시간마다 업데이트
    const interval = setInterval(loadPredictions, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 차트 데이터 준비
  const chartData = predictions.map(p => ({
    time: new Date(p.timestamp).getHours() + '시',
    timestamp: p.timestamp,
    예측값: Math.round(p.predictedScore),
    신뢰도: p.confidence,
    상한: Math.min(100, Math.round(p.predictedScore + (100 - p.confidence) / 5)),
    하한: Math.max(0, Math.round(p.predictedScore - (100 - p.confidence) / 5))
  }));

  // 색상 결정
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 60) return '#3B82F6'; // Blue
    if (score >= 40) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border shadow-sm p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="h-48 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (compact) {
    // 컴팩트 뷰: 다음 시간 예측만 표시
    const nextPrediction = predictions[0];
    if (!nextPrediction) return null;

    return (
      <div className={`bg-white rounded-lg border p-4 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-700">
            🔮 다음 시간 예측
          </h4>
          <span className="text-xs text-gray-500">
            신뢰도 {nextPrediction.confidence}%
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`text-3xl font-bold`}
            style={{ color: getScoreColor(nextPrediction.predictedScore) }}
          >
            {Math.round(nextPrediction.predictedScore)}
          </div>
          <div className="flex-1">
            <div className="text-xs text-gray-600">
              {new Date(nextPrediction.timestamp).toLocaleTimeString('ko-KR', {
                hour: 'numeric',
                minute: 'numeric'
              })}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {nextPrediction.reasoning[0]}
            </div>
          </div>
        </div>

        {bestTimes.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs text-gray-600 mb-1">오늘의 최적 시간</div>
            <div className="text-sm font-medium text-blue-600">
              {new Date(bestTimes[0].bestTime).toLocaleTimeString('ko-KR', {
                hour: 'numeric',
                minute: 'numeric'
              })} (예상 {Math.round(bestTimes[0].score)}점)
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border shadow-sm ${className}`}>
      {/* 헤더 */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            🔮 AI 모멘텀 예측
          </h3>
          <div className="text-sm text-gray-500">
            다음 24시간 예측
          </div>
        </div>
      </div>

      {/* 예측 차트 */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={chartData}
            onClick={(data) => {
              if (data && data.activePayload) {
                const index = chartData.findIndex(d => d === data.activePayload![0].payload);
                setSelectedPrediction(predictions[index]);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="time"
              stroke="#6B7280"
              fontSize={12}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#6B7280"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #E5E7EB',
                borderRadius: '8px'
              }}
              formatter={(value: any, name: string) => {
                if (name === '신뢰도') return `${value}%`;
                return value;
              }}
            />

            {/* 신뢰 구간 영역 */}
            <Area
              type="monotone"
              dataKey="상한"
              stroke="none"
              fill="#3B82F6"
              fillOpacity={0.1}
            />
            <Area
              type="monotone"
              dataKey="하한"
              stroke="none"
              fill="#3B82F6"
              fillOpacity={0.1}
            />

            {/* 예측선 */}
            <Line
              type="monotone"
              dataKey="예측값"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ r: 4, fill: '#3B82F6' }}
              activeDot={{ r: 6 }}
            />

            {/* 현재 시간 표시 */}
            <ReferenceLine
              x={chartData[0]?.time}
              stroke="#EF4444"
              strokeDasharray="5 5"
              label={{ value: "현재", position: "top" }}
            />

            {/* 최적 시간대 하이라이트 */}
            {bestTimes.length > 0 && (
              <ReferenceArea
                x1={new Date(bestTimes[0].bestTime).getHours() + '시'}
                x2={new Date(bestTimes[0].bestTime).getHours() + '시'}
                fill="#10B981"
                fillOpacity={0.2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* 선택된 예측 상세 정보 */}
        <AnimatePresence>
          {selectedPrediction && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-800">
                  {new Date(selectedPrediction.timestamp).toLocaleString('ko-KR', {
                    month: 'numeric',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric'
                  })} 예측 상세
                </h4>
                <button
                  onClick={() => setSelectedPrediction(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-gray-500">예측 점수</div>
                  <div className="text-2xl font-bold" style={{
                    color: getScoreColor(selectedPrediction.predictedScore)
                  }}>
                    {Math.round(selectedPrediction.predictedScore)}점
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">신뢰도</div>
                  <div className="text-2xl font-bold text-gray-700">
                    {selectedPrediction.confidence}%
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="text-sm font-medium text-gray-700">예측 요인</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between p-2 bg-white rounded">
                    <span className="text-gray-600">과거 패턴</span>
                    <span className="font-medium">
                      {Math.round(selectedPrediction.factors.historicalPattern)}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded">
                    <span className="text-gray-600">최근 트렌드</span>
                    <span className="font-medium">
                      {Math.round(selectedPrediction.factors.recentTrend)}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded">
                    <span className="text-gray-600">주기 패턴</span>
                    <span className="font-medium">
                      {Math.round(selectedPrediction.factors.cyclicalPattern)}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-white rounded">
                    <span className="text-gray-600">외부 요인</span>
                    <span className="font-medium">
                      {Math.round(selectedPrediction.factors.externalFactors)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-700">예측 근거</div>
                {selectedPrediction.reasoning.map((reason, idx) => (
                  <div key={idx} className="text-xs text-gray-600">
                    • {reason}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 최적 시간 추천 */}
        {bestTimes.length > 0 && !selectedPrediction && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              ⭐ 오늘의 최적 작업 시간
            </h4>
            <div className="space-y-2">
              {bestTimes.map((time, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`
                    p-3 rounded-lg border
                    ${idx === 0 ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200' :
                      'bg-gray-50 border-gray-200'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`
                        text-lg
                        ${idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                      `}>
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">
                          {new Date(time.bestTime).toLocaleTimeString('ko-KR', {
                            hour: 'numeric',
                            minute: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-600">
                          {time.reason}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-xl font-bold"
                        style={{ color: getScoreColor(time.score) }}
                      >
                        {Math.round(time.score)}
                      </div>
                      <div className="text-xs text-gray-500">예상 점수</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* 활용 팁 */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            💡 AI 예측 활용 팁
          </h4>
          <ul className="space-y-1 text-xs text-gray-600">
            <li>• 높은 모멘텀이 예측되는 시간에 중요한 작업을 배치하세요</li>
            <li>• 낮은 모멘텀 시간에는 루틴한 업무나 휴식을 권장합니다</li>
            <li>• 예측은 과거 패턴을 기반으로 하며, 실제와 다를 수 있습니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MomentumPrediction;