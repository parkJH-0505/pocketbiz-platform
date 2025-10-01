/**
 * MomentumCard - 실용적 모멘텀 점수 표시
 *
 * 복잡한 게임화 대신 실제 비즈니스 모멘텀을 한눈에 보여주는 카드
 */

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, Calendar, Activity, BarChart3 } from 'lucide-react';
import { momentumEngine } from '../../services/momentumEngine';
import WeeklyGoalSetter from '../business/WeeklyGoalSetter';
import { useRealtimeUpdates } from '../../hooks/useRealtimeUpdates';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

interface MomentumData {
  score: number;
  breakdown: {
    consistency: number;
    activity: number;
    performance: number;
  };
  insights: {
    message: string;
    suggestion: string;
    urgentAction?: string;
  };
  lastUpdated: Date;
}

interface MomentumCardProps {
  className?: string;
}

const MomentumCard: React.FC<MomentumCardProps> = ({
  className = ""
}) => {
  const [momentumData, setMomentumData] = useState<MomentumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 모멘텀 데이터 로드
  const loadMomentumData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await momentumEngine.calculateMomentum();
      setMomentumData(data);
    } catch (err) {
      console.error('Failed to load momentum:', err);
      setError('데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMomentumData();
  }, []);

  // 최적화된 자동 새로고침 시스템
  const { scheduleRefresh, forceRefresh, isPending } = useAutoRefresh(
    loadMomentumData,
    {
      debounceMs: 200,
      maxBatchDelay: 800,
      priority: 'high'
    }
  );

  // 실시간 업데이트 처리
  const handleRealtimeUpdate = useCallback((event) => {
    console.log('[MomentumCard] Realtime update received:', event.type);

    // 이벤트 타입에 따라 다른 우선순위 적용
    if (event.type === 'goal-progress') {
      // 목표 달성은 즉시 반영
      forceRefresh();
    } else {
      // 다른 이벤트들은 배치 처리
      scheduleRefresh();
    }
  }, [scheduleRefresh, forceRefresh]);

  // 모든 이벤트 타입에 대해 리스닝
  useRealtimeUpdates(
    ['kpi-update', 'task-complete', 'document-access', 'goal-progress', 'momentum-change'],
    handleRealtimeUpdate,
    []
  );

  // 로딩 상태
  if (loading) {
    return (
      <div className={`bg-white rounded-xl border shadow-sm p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !momentumData) {
    return (
      <div className={`bg-white rounded-xl border shadow-sm p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️ 데이터 로드 오류</div>
          <button
            onClick={loadMomentumData}
            className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 점수별 색상 및 상태
  const getMomentumStatus = (score: number) => {
    if (score >= 80) return { color: 'text-green-600', bg: 'bg-green-50', status: '고속 성장' };
    if (score >= 60) return { color: 'text-blue-600', bg: 'bg-blue-50', status: '순항 중' };
    if (score >= 40) return { color: 'text-yellow-600', bg: 'bg-yellow-50', status: '보통' };
    return { color: 'text-red-600', bg: 'bg-red-50', status: '개선 필요' };
  };

  const momentumStatus = getMomentumStatus(momentumData.score);

  return (
    <div className={`bg-white rounded-xl border shadow-sm ${className}`}>
      {/* 헤더 */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              모멘텀 점수
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              실제 활동 기반 종합 점수
            </p>
          </div>
          <button
            onClick={forceRefresh}
            disabled={loading || isPending()}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${loading || isPending() ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 메인 점수 영역 */}
      <div className={`p-6 ${momentumStatus.bg}`}>
        <div className="text-center">
          <div className={`text-4xl font-bold ${momentumStatus.color} mb-2 transition-all duration-500`}>
            {momentumData.score}/100
          </div>
          <div className={`text-lg font-medium ${momentumStatus.color} mb-4 transition-colors duration-300`}>
            {momentumStatus.status}
          </div>

          {/* 진행 바 */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                momentumData.score >= 80 ? 'bg-green-500' :
                momentumData.score >= 60 ? 'bg-blue-500' :
                momentumData.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${momentumData.score}%` }}
            />
          </div>

          {/* 인사이트 메시지 */}
          <div className="text-center">
            <div className="text-gray-700 font-medium mb-2">
              {momentumData.insights.message}
            </div>
            <div className="text-sm text-gray-600">
              {momentumData.insights.suggestion}
            </div>
            {momentumData.insights.urgentAction && (
              <div className="mt-3 p-3 bg-orange-100 border border-orange-200 rounded-lg">
                <div className="text-sm text-orange-800 font-medium">
                  ⚡ 즉시 행동: {momentumData.insights.urgentAction}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 세부 점수 영역 */}
      <div className="p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">세부 점수</h3>
        <div className="grid grid-cols-3 gap-4">
          {/* 꾸준함 */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="w-4 h-4 text-blue-500 mr-1" />
              <span className="text-xs text-gray-600">꾸준함</span>
            </div>
            <div className="text-lg font-bold text-gray-800 transition-all duration-500">
              {momentumData.breakdown.consistency}
            </div>
            <div className="text-xs text-gray-500">50% 가중치</div>
          </div>

          {/* 활동량 */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Activity className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-xs text-gray-600">활동량</span>
            </div>
            <div className="text-lg font-bold text-gray-800 transition-all duration-500">
              {momentumData.breakdown.activity}
            </div>
            <div className="text-xs text-gray-500">30% 가중치</div>
          </div>

          {/* 성과 */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-4 h-4 text-purple-500 mr-1" />
              <span className="text-xs text-gray-600">성과</span>
            </div>
            <div className="text-lg font-bold text-gray-800 transition-all duration-500">
              {momentumData.breakdown.performance}
            </div>
            <div className="text-xs text-gray-500">20% 가중치</div>
          </div>
        </div>
      </div>

      {/* 주간 목표 섹션 */}
      <div className="p-6 border-t">
        <WeeklyGoalSetter />
      </div>

      {/* 하단 정보 */}
      <div className="px-6 py-3 bg-gray-50 border-t rounded-b-xl">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>마지막 업데이트: {momentumData.lastUpdated.toLocaleTimeString()}</span>
          <span>실제 데이터 기반</span>
        </div>
      </div>
    </div>
  );
};

export default MomentumCard;