/**
 * @fileoverview 시스템 모니터링 대시보드
 * @description Sprint 4 Phase 4-5: 실시간 시스템 상태 모니터링 UI
 * @author PocketCompany
 * @since 2025-01-19
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ErrorManager, type ErrorStatistics } from '../../utils/errorManager';
import { PerformanceMonitor, type PerformanceStatistics } from '../../utils/performanceMonitor';
import { QueueRecoveryManager } from '../../utils/queueRecovery';
import { DataRecoveryManager, type SystemHealthReport } from '../../utils/dataRecovery';

/**
 * 대시보드 상태
 */
interface DashboardState {
  errorStats: ErrorStatistics | null;
  performanceStats: PerformanceStatistics | null;
  queueStatus: any;
  healthReport: SystemHealthReport | null;
  lastUpdated: Date | null;
  isLoading: boolean;
  autoRefresh: boolean;
}

/**
 * 시스템 상태 카드 컴포넌트
 */
const StatusCard: React.FC<{
  title: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  value: string | number;
  description?: string;
  onClick?: () => void;
}> = ({ title, status, value, description, onClick }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'healthy': return 'bg-green-100 border-green-300 text-green-800';
      case 'warning': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'critical': return 'bg-red-100 border-red-300 text-red-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      default: return '❓';
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${getStatusColor()}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className="text-lg">{getStatusIcon()}</span>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      {description && (
        <div className="text-xs opacity-75">{description}</div>
      )}
    </div>
  );
};

/**
 * 메트릭 차트 컴포넌트 (간단한 막대 그래프)
 */
const MetricChart: React.FC<{
  title: string;
  data: Array<{ label: string; value: number; max: number }>;
}> = ({ title, data }) => {
  return (
    <div className="bg-white p-4 rounded-lg border">
      <h4 className="font-semibold mb-3">{title}</h4>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-20 text-xs text-gray-600 truncate">{item.label}</div>
            <div className="flex-1 mx-2">
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="w-16 text-xs text-right">{item.value.toFixed(1)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 에러 목록 컴포넌트
 */
const ErrorList: React.FC<{
  errors: Array<{ id: string; message: string; severity: string; timestamp: Date }>;
}> = ({ errors }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h4 className="font-semibold mb-3">최근 에러</h4>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {errors.length === 0 ? (
          <div className="text-center text-gray-500 py-4">에러가 없습니다</div>
        ) : (
          errors.map((error) => (
            <div key={error.id} className="border-l-4 border-gray-300 pl-3 py-1">
              <div className={`font-medium text-sm ${getSeverityColor(error.severity)}`}>
                {error.severity.toUpperCase()}
              </div>
              <div className="text-sm text-gray-800 truncate">{error.message}</div>
              <div className="text-xs text-gray-500">
                {error.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/**
 * 시스템 대시보드 메인 컴포넌트
 */
export const SystemDashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    errorStats: null,
    performanceStats: null,
    queueStatus: null,
    healthReport: null,
    lastUpdated: null,
    isLoading: true,
    autoRefresh: true
  });

  const [selectedTab, setSelectedTab] = useState<'overview' | 'errors' | 'performance' | 'health'>('overview');

  /**
   * 데이터 새로고침
   */
  const refreshData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const [errorStats, performanceStats, queueStatus, healthReport] = await Promise.all([
        Promise.resolve(ErrorManager.generateStatistics(24)),
        Promise.resolve(PerformanceMonitor.generateStatistics(24)),
        Promise.resolve(QueueRecoveryManager.getQueueSummary()),
        // DataRecoveryManager.performHealthCheck([], []) // 실제 데이터 필요
        Promise.resolve(null) // 임시로 null 처리
      ]);

      setState(prev => ({
        ...prev,
        errorStats,
        performanceStats,
        queueStatus,
        healthReport,
        lastUpdated: new Date(),
        isLoading: false
      }));

    } catch (error) {
      console.error('Dashboard refresh failed:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  /**
   * 자동 새로고침 설정
   */
  useEffect(() => {
    refreshData();

    if (state.autoRefresh) {
      const interval = setInterval(refreshData, 30000); // 30초마다
      return () => clearInterval(interval);
    }
  }, [state.autoRefresh, refreshData]);

  /**
   * 전체 시스템 상태 결정
   */
  const getOverallStatus = (): 'healthy' | 'warning' | 'critical' => {
    if (!state.errorStats || !state.performanceStats) return 'unknown' as any;

    const criticalErrors = state.errorStats.errorsBySeverity?.critical || 0;
    const highErrors = state.errorStats.errorsBySeverity?.high || 0;
    const criticalPerformance = state.performanceStats.performanceIssues?.filter(i => i.severity === 'critical').length || 0;

    if (criticalErrors > 0 || criticalPerformance > 0) return 'critical';
    if (highErrors > 5 || state.performanceStats.performanceIssues?.length > 0) return 'warning';
    return 'healthy';
  };

  /**
   * 개요 탭 렌더링
   */
  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatusCard
        title="전체 시스템"
        status={getOverallStatus()}
        value={getOverallStatus() === 'healthy' ? '정상' : getOverallStatus() === 'warning' ? '주의' : '심각'}
        description={`마지막 업데이트: ${state.lastUpdated?.toLocaleTimeString() || 'N/A'}`}
        onClick={() => refreshData()}
      />

      <StatusCard
        title="에러율"
        status={
          !state.errorStats ? 'unknown' :
          state.errorStats.totalErrors === 0 ? 'healthy' :
          state.errorStats.totalErrors < 10 ? 'warning' : 'critical'
        }
        value={state.errorStats?.totalErrors || 0}
        description="24시간 내 발생한 에러 수"
        onClick={() => setSelectedTab('errors')}
      />

      <StatusCard
        title="성능"
        status={
          !state.performanceStats ? 'unknown' :
          state.performanceStats.performanceIssues.length === 0 ? 'healthy' :
          state.performanceStats.performanceIssues.filter(i => i.severity === 'critical').length > 0 ? 'critical' : 'warning'
        }
        value={`${state.performanceStats?.totalMeasurements || 0} 측정`}
        description={`문제: ${state.performanceStats?.performanceIssues.length || 0}개`}
        onClick={() => setSelectedTab('performance')}
      />

      <StatusCard
        title="큐 상태"
        status={
          !state.queueStatus ? 'unknown' :
          state.queueStatus.isHealthy ? 'healthy' : 'warning'
        }
        value={state.queueStatus?.isHealthy ? '정상' : '주의'}
        description={`실패: ${state.queueStatus?.recentFailures || 0}개`}
      />
    </div>
  );

  /**
   * 에러 탭 렌더링
   */
  const renderErrors = () => {
    if (!state.errorStats) return <div>데이터 로딩 중...</div>;

    const recentErrors = ErrorManager.getRecentErrors(20).map(error => ({
      id: error.id,
      message: error.userMessage,
      severity: error.severity,
      timestamp: error.timestamp
    }));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricChart
          title="에러 카테고리별 분포"
          data={Object.entries(state.errorStats.errorsByCategory || {}).map(([category, count]) => ({
            label: category,
            value: count,
            max: Math.max(...Object.values(state.errorStats!.errorsByCategory || {}))
          }))}
        />

        <MetricChart
          title="에러 심각도별 분포"
          data={Object.entries(state.errorStats.errorsBySeverity || {}).map(([severity, count]) => ({
            label: severity,
            value: count,
            max: Math.max(...Object.values(state.errorStats!.errorsBySeverity || {}))
          }))}
        />

        <div className="lg:col-span-2">
          <ErrorList errors={recentErrors} />
        </div>
      </div>
    );
  };

  /**
   * 성능 탭 렌더링
   */
  const renderPerformance = () => {
    if (!state.performanceStats) return <div>데이터 로딩 중...</div>;

    const performanceData = Object.entries(state.performanceStats.metricStats || {}).map(([type, stats]) => ({
      label: type,
      value: (stats as any).average || 0,
      max: Math.max(...Object.values(state.performanceStats!.metricStats || {}).map((s: any) => s.average || 0))
    }));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricChart
          title="평균 응답 시간 (ms)"
          data={performanceData}
        />

        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-semibold mb-3">성능 문제</h4>
          {state.performanceStats.performanceIssues.length === 0 ? (
            <div className="text-center text-gray-500 py-4">성능 문제가 없습니다</div>
          ) : (
            <div className="space-y-2">
              {state.performanceStats.performanceIssues.map((issue, index) => (
                <div key={index} className="border-l-4 border-yellow-400 pl-3 py-2">
                  <div className={`font-medium text-sm ${issue.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'}`}>
                    {issue.type} - {issue.severity.toUpperCase()}
                  </div>
                  <div className="text-sm">{issue.description}</div>
                  <div className="text-xs text-gray-500">
                    영향받은 측정: {issue.affectedMeasurements}개
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * 헬스 탭 렌더링
   */
  const renderHealth = () => (
    <div className="bg-white p-6 rounded-lg border">
      <h4 className="font-semibold mb-4">시스템 건강성 검사</h4>
      <div className="text-center text-gray-500 py-8">
        헬스 체크 기능을 사용하려면 실제 프로젝트 및 스케줄 데이터가 필요합니다.
      </div>
      <div className="flex justify-center">
        <button
          onClick={() => {
            // 실제 환경에서는 BuildupContext의 데이터를 사용
            console.log('Health check would run with real data');
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          헬스 체크 실행
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">시스템 모니터링 대시보드</h1>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={state.autoRefresh}
                  onChange={(e) => setState(prev => ({ ...prev, autoRefresh: e.target.checked }))}
                  className="mr-2"
                />
                자동 새로고침
              </label>
              <button
                onClick={refreshData}
                disabled={state.isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {state.isLoading ? '로딩...' : '새로고침'}
              </button>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="mt-4 border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: '개요' },
                { id: 'errors', label: '에러' },
                { id: 'performance', label: '성능' },
                { id: 'health', label: '건강성' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="mt-6">
          {selectedTab === 'overview' && renderOverview()}
          {selectedTab === 'errors' && renderErrors()}
          {selectedTab === 'performance' && renderPerformance()}
          {selectedTab === 'health' && renderHealth()}
        </div>

        {/* 마지막 업데이트 시간 */}
        {state.lastUpdated && (
          <div className="mt-8 text-center text-sm text-gray-500">
            마지막 업데이트: {state.lastUpdated.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemDashboard;