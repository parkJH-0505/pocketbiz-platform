/**
 * Advanced AI Dashboard - Phase 8
 * 고도화된 AI 분석 결과를 종합적으로 표시하는 대시보드
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, TrendingUp, AlertTriangle, Target, Activity, Zap,
  RefreshCw, Settings, Bell, CheckCircle, XCircle, Clock,
  BarChart3, LineChart, PieChart, ArrowUp, ArrowDown,
  Minimize2, Maximize2, Filter, Download, Share2
} from 'lucide-react';
import type { AxisKey } from '../../pages/startup/kpi-tabs/ResultsInsightsPanelV2/types';
import { useAdvancedAI } from '../../hooks/useAdvancedAI';
import type { IntegratedInsight, RiskAssessment, Recommendation, Alert } from '../../hooks/useAdvancedAI';

// 컴포넌트 Props
interface AdvancedAIDashboardProps {
  currentScores: Record<AxisKey, number>;
  historicalData: Array<{ timestamp: number; scores: Record<AxisKey, number> }>;
  className?: string;
}

// Card 컴포넌트들
const Card = ({ children, className = '', ...props }: any) => (
  <motion.div
    className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    {...props}
  >
    {children}
  </motion.div>
);

const CardHeader = ({ title, subtitle, icon, action, ...props }: any) => (
  <div className="p-4 border-b border-gray-100 flex items-center justify-between" {...props}>
    <div className="flex items-center gap-3">
      {icon && <div className="text-blue-600">{icon}</div>}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

const CardBody = ({ children, className = '', ...props }: any) => (
  <div className={`p-4 ${className}`} {...props}>{children}</div>
);

// 메인 대시보드 컴포넌트
export const AdvancedAIDashboard: React.FC<AdvancedAIDashboardProps> = ({
  currentScores,
  historicalData,
  className = ''
}) => {
  const [selectedInsightType, setSelectedInsightType] = useState<string>('all');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // AI 훅 사용
  const {
    isLoading,
    error,
    lastUpdate,
    integratedInsights,
    riskAssessment,
    recommendations,
    alertsAndNotifications,
    performanceMetrics,
    runComprehensiveAnalysis,
    runSpecificAnalysis,
    acknowledgeAlert,
    acknowledgeAllAlerts,
    isHealthy,
    hasUnacknowledgedAlerts,
    criticalAlertsCount
  } = useAdvancedAI(currentScores, historicalData, {
    enableRealTimeSimulation: true,
    enableAdvancedPrediction: true,
    autoRefreshInterval: 30000
  });

  // 필터링된 인사이트
  const filteredInsights = useMemo(() => {
    if (selectedInsightType === 'all') return integratedInsights;
    return integratedInsights.filter(insight => insight.type === selectedInsightType);
  }, [integratedInsights, selectedInsightType]);

  // 인사이트 타입별 카운트
  const insightCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    integratedInsights.forEach(insight => {
      counts[insight.type] = (counts[insight.type] || 0) + 1;
    });
    return counts;
  }, [integratedInsights]);

  // 최근 업데이트 시간 포맷
  const formatLastUpdate = (timestamp: number) => {
    if (!timestamp) return '업데이트 없음';
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  if (isMinimized) {
    return (
      <motion.div
        className={`fixed bottom-4 right-4 z-50 ${className}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors relative"
        >
          <Brain className="w-6 h-6" />
          {hasUnacknowledgedAlerts && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {criticalAlertsCount || '!'}
            </div>
          )}
        </button>
      </motion.div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <Card>
        <CardHeader
          title="고급 AI 분석 대시보드"
          subtitle={`마지막 업데이트: ${formatLastUpdate(lastUpdate)}`}
          icon={<Brain className="w-6 h-6" />}
          action={
            <div className="flex items-center gap-2">
              {/* 시스템 상태 */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {isHealthy ? '정상' : '오류'}
                </span>
              </div>

              {/* 알림 */}
              {hasUnacknowledgedAlerts && (
                <button
                  onClick={acknowledgeAllAlerts}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors relative"
                  title="모든 알림 확인"
                >
                  <Bell className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {criticalAlertsCount}
                  </div>
                </button>
              )}

              {/* 새로고침 */}
              <button
                onClick={runComprehensiveAnalysis}
                disabled={isLoading}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                title="분석 새로고침"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              {/* 최소화 */}
              <button
                onClick={() => setIsMinimized(true)}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                title="최소화"
              >
                <Minimize2 className="w-5 h-5" />
              </button>

              {/* 설정 */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                title="설정"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          }
        />

        {/* 에러 표시 */}
        {error && (
          <CardBody>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-red-800 font-medium">분석 오류</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </CardBody>
        )}
      </Card>

      {/* 메인 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측: 인사이트 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 인사이트 필터 */}
          <Card>
            <CardHeader
              title="AI 인사이트"
              subtitle={`총 ${integratedInsights.length}개의 인사이트`}
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <CardBody>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setSelectedInsightType('all')}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedInsightType === 'all'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  전체 ({integratedInsights.length})
                </button>
                {Object.entries(insightCounts).map(([type, count]) => (
                  <button
                    key={type}
                    onClick={() => setSelectedInsightType(type)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedInsightType === type
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type} ({count})
                  </button>
                ))}
              </div>

              {/* 인사이트 리스트 */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {filteredInsights.length > 0 ? (
                    filteredInsights.map((insight) => (
                      <InsightCard key={insight.id} insight={insight} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>인사이트 분석 중...</span>
                        </div>
                      ) : (
                        <div>
                          <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          <p>표시할 인사이트가 없습니다</p>
                        </div>
                      )}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </CardBody>
          </Card>

          {/* 추천사항 */}
          <Card>
            <CardHeader
              title="AI 추천사항"
              subtitle={`${recommendations.length}개의 추천사항`}
              icon={<Target className="w-5 h-5" />}
            />
            <CardBody>
              <div className="space-y-3">
                {recommendations.length > 0 ? (
                  recommendations.slice(0, 5).map((rec) => (
                    <RecommendationCard key={rec.id} recommendation={rec} />
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    추천사항이 없습니다
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* 우측: 리스크 & 성능 */}
        <div className="space-y-6">
          {/* 리스크 평가 */}
          <Card>
            <CardHeader
              title="리스크 평가"
              icon={<AlertTriangle className="w-5 h-5" />}
            />
            <CardBody>
              <RiskAssessmentCard riskAssessment={riskAssessment} />
            </CardBody>
          </Card>

          {/* 성능 메트릭 */}
          <Card>
            <CardHeader
              title="성능 메트릭"
              icon={<Activity className="w-5 h-5" />}
            />
            <CardBody>
              <PerformanceMetricsCard metrics={performanceMetrics} />
            </CardBody>
          </Card>

          {/* 알림 */}
          {alertsAndNotifications.length > 0 && (
            <Card>
              <CardHeader
                title="알림"
                subtitle={`${alertsAndNotifications.filter(a => !a.acknowledged).length}개의 미확인 알림`}
                icon={<Bell className="w-5 h-5" />}
              />
              <CardBody>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {alertsAndNotifications.slice(0, 5).map((alert) => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      onAcknowledge={() => acknowledgeAlert(alert.id)}
                    />
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* 설정 패널 */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <SettingsPanel onClose={() => setShowSettings(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 인사이트 카드 컴포넌트
const InsightCard: React.FC<{ insight: IntegratedInsight }> = ({ insight }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pattern': return <LineChart className="w-4 h-4" />;
      case 'anomaly': return <AlertTriangle className="w-4 h-4" />;
      case 'prediction': return <TrendingUp className="w-4 h-4" />;
      case 'simulation': return <Activity className="w-4 h-4" />;
      case 'trend': return <ArrowUp className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`p-4 rounded-lg border ${getSeverityColor(insight.severity)}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">
          {getTypeIcon(insight.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm">{insight.title}</h4>
            <span className="text-xs px-2 py-1 bg-white rounded-full">
              {Math.round(insight.confidence * 100)}%
            </span>
          </div>
          <p className="text-sm opacity-90 mb-2">{insight.description}</p>

          {insight.affectedAxes.length > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <span className="text-xs">영향 축:</span>
              {insight.affectedAxes.map(axis => (
                <span key={axis} className="text-xs px-2 py-1 bg-white rounded">
                  {axis}
                </span>
              ))}
            </div>
          )}

          {insight.recommendations.length > 0 && (
            <div className="text-xs">
              <span className="font-medium">추천:</span>
              <span className="ml-1">{insight.recommendations[0]}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// 추천사항 카드 컴포넌트
const RecommendationCard: React.FC<{ recommendation: Recommendation }> = ({ recommendation }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-orange-500 bg-orange-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 ${getPriorityColor(recommendation.priority)}`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm">{recommendation.title}</h4>
        <span className="text-xs px-2 py-1 bg-white rounded">
          {recommendation.priority}
        </span>
      </div>
      <p className="text-sm text-gray-700 mb-2">{recommendation.description}</p>
      <div className="text-xs text-gray-600">
        <span className="font-medium">기대효과:</span> {recommendation.expectedImpact}
      </div>
      <div className="text-xs text-gray-600">
        <span className="font-medium">기간:</span> {recommendation.timeframe}
      </div>
    </div>
  );
};

// 리스크 평가 카드 컴포넌트
const RiskAssessmentCard: React.FC<{ riskAssessment: RiskAssessment }> = ({ riskAssessment }) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className={`text-3xl font-bold ${getRiskColor(riskAssessment.overallRisk)}`}>
          {Math.round(riskAssessment.riskScore)}
        </div>
        <div className="text-sm text-gray-600">리스크 점수</div>
        <div className={`text-sm font-medium ${getRiskColor(riskAssessment.overallRisk)}`}>
          {riskAssessment.overallRisk.toUpperCase()}
        </div>
      </div>

      {/* 카테고리별 리스크 */}
      <div className="space-y-2">
        {Object.entries(riskAssessment.categories).map(([category, score]) => (
          <div key={category} className="flex items-center justify-between">
            <span className="text-sm capitalize">{category}</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${score > 70 ? 'bg-red-500' : score > 40 ? 'bg-orange-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(100, score)}%` }}
                />
              </div>
              <span className="text-sm text-gray-600">{Math.round(score)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 상위 리스크 */}
      {riskAssessment.topRisks.length > 0 && (
        <div>
          <h5 className="text-sm font-medium mb-2">주요 리스크</h5>
          <div className="space-y-1">
            {riskAssessment.topRisks.slice(0, 3).map((risk, index) => (
              <div key={index} className="text-xs text-gray-600">
                • {risk.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 성능 메트릭 카드 컴포넌트
const PerformanceMetricsCard: React.FC<{ metrics: any }> = ({ metrics }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {metrics.totalAnalysisTime ? `${(metrics.totalAnalysisTime / 1000).toFixed(1)}s` : '-'}
          </div>
          <div className="text-xs text-gray-600">분석 시간</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {metrics.cacheHitRate ? `${Math.round(metrics.cacheHitRate)}%` : '-'}
          </div>
          <div className="text-xs text-gray-600">캐시 적중률</div>
        </div>
      </div>

      {/* 서비스 가동률 */}
      <div>
        <h5 className="text-sm font-medium mb-2">서비스 상태</h5>
        <div className="space-y-2">
          {Object.entries(metrics.serviceUptime || {}).map(([service, uptime]) => (
            <div key={service} className="flex items-center justify-between">
              <span className="text-sm capitalize">{service}</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${uptime > 80 ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">{uptime}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 알림 카드 컴포넌트
const AlertCard: React.FC<{ alert: Alert; onAcknowledge: () => void }> = ({ alert, onAcknowledge }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'warning': return 'border-orange-500 bg-orange-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  return (
    <div className={`p-3 rounded-lg border-l-4 ${getSeverityColor(alert.severity)} ${alert.acknowledged ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h5 className="text-sm font-medium">{alert.title}</h5>
          <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
          <div className="text-xs text-gray-500 mt-2">
            <Clock className="w-3 h-3 inline mr-1" />
            {new Date(alert.timestamp).toLocaleTimeString()}
          </div>
        </div>
        {!alert.acknowledged && (
          <button
            onClick={onAcknowledge}
            className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
            title="확인"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// 설정 패널 컴포넌트
const SettingsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <Card>
      <CardHeader
        title="AI 대시보드 설정"
        action={
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        }
      />
      <CardBody>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              자동 새로고침 간격
            </label>
            <select className="w-full p-2 border border-gray-300 rounded-lg">
              <option value="30000">30초</option>
              <option value="60000">1분</option>
              <option value="300000">5분</option>
              <option value="0">비활성화</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span className="text-sm">실시간 시뮬레이션 활성화</span>
            </label>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span className="text-sm">고급 예측 모델 활성화</span>
            </label>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span className="text-sm">알림 소리 활성화</span>
            </label>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
              설정 저장
            </button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default AdvancedAIDashboard;