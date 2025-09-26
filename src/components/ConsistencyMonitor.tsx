/**
 * Consistency Monitor Dashboard
 * Phase 6: 데이터 일관성 모니터링 UI
 *
 * 주요 컴포넌트:
 * - 실시간 일관성 점수
 * - 문제 영역 하이라이트
 * - 트렌드 차트
 * - 알림 설정
 * - 자동 복구 제어
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Activity,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings,
  Play,
  Pause,
  BarChart3,
  Database,
  Zap,
  Clock,
  FileSearch,
  GitBranch,
  AlertCircle,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import {
  consistencyValidator,
  ValidationReport,
  ValidationResult,
  ValidationSeverity,
  ValidationRule
} from '../../utils/consistencyValidator';
import {
  autoRecoveryManager,
  RecoveryPlan,
  RecoveryStrategy,
  RecoveryTask
} from '../../utils/autoRecovery';
import { useBuildupContext } from '../../contexts/BuildupContext';
import { useCalendarContext } from '../../contexts/CalendarContext';

/**
 * 일관성 점수 게이지
 */
const ConsistencyScoreGauge: React.FC<{
  score: number;
  trend?: 'up' | 'down' | 'stable';
}> = ({ score, trend = 'stable' }) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 90) return 'from-green-400 to-green-600';
    if (score >= 70) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  return (
    <div className="relative w-48 h-48">
      <svg className="transform -rotate-90 w-48 h-48">
        <circle
          cx="96"
          cy="96"
          r="88"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-gray-200"
        />
        <motion.circle
          cx="96"
          cy="96"
          r="88"
          stroke="url(#gradient)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDasharray: '0 552' }}
          animate={{ strokeDasharray: `${(score / 100) * 552} 552` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="gradient">
            <stop offset="0%" className={getScoreBackground(score).split(' ')[0].replace('from-', '')} />
            <stop offset="100%" className={getScoreBackground(score).split(' ')[2]} />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${getScoreColor(score)}`}>
          {score.toFixed(0)}
        </span>
        <span className="text-sm text-gray-500">일관성 점수</span>
        {trend !== 'stable' && (
          <div className="flex items-center gap-1 mt-1">
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 검증 결과 카드
 */
const ValidationResultCard: React.FC<{
  result: ValidationResult;
  onFix?: () => void;
}> = ({ result, onFix }) => {
  const getSeverityIcon = () => {
    switch (result.severity) {
      case ValidationSeverity.ERROR:
        return <XCircle className="w-5 h-5 text-red-500" />;
      case ValidationSeverity.WARNING:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case ValidationSeverity.INFO:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityColor = () => {
    switch (result.severity) {
      case ValidationSeverity.ERROR:
        return 'border-red-200 bg-red-50';
      case ValidationSeverity.WARNING:
        return 'border-yellow-200 bg-yellow-50';
      case ValidationSeverity.INFO:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-lg p-3 ${getSeverityColor()}`}
    >
      <div className="flex items-start gap-3">
        {getSeverityIcon()}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{result.message}</p>
          {result.suggestion && (
            <p className="text-xs text-gray-600 mt-1">{result.suggestion}</p>
          )}
          {result.entityId && (
            <p className="text-xs text-gray-500 mt-1">
              {result.entityType}: {result.entityId}
            </p>
          )}
        </div>
        {result.autoFixable && onFix && (
          <button
            onClick={onFix}
            className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
          >
            <Zap className="w-3 h-3" />
            자동 수정
          </button>
        )}
      </div>
    </motion.div>
  );
};

/**
 * 복구 작업 상태
 */
const RecoveryTaskStatus: React.FC<{
  task: RecoveryTask;
}> = ({ task }) => {
  const getStatusIcon = () => {
    switch (task.status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'in_progress':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'skipped':
        return <ChevronRight className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-gray-700">{task.issue.message}</span>
      </div>
      {task.attempts > 0 && (
        <span className="text-xs text-gray-500">
          시도: {task.attempts}/{task.maxAttempts}
        </span>
      )}
    </div>
  );
};

/**
 * 일관성 모니터 대시보드
 */
export const ConsistencyMonitor: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const { projects } = useBuildupContext();
  const { events } = useCalendarContext();

  const [report, setReport] = useState<ValidationReport | null>(null);
  const [recoveryPlan, setRecoveryPlan] = useState<RecoveryPlan | null>(null);
  const [autoMode, setAutoMode] = useState(false);
  const [validating, setValidating] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    errors: true,
    warnings: false,
    info: false,
    recovery: false
  });

  // 검증 실행
  const runValidation = useCallback(async () => {
    setValidating(true);
    try {
      const validationReport = await consistencyValidator.validateAll({
        projects,
        events,
        schedules: [] // 스케줄 데이터 추가
      });
      setReport(validationReport);

      // 자동 모드인 경우 복구 계획 생성
      if (autoMode && validationReport.autoFixableCount > 0) {
        const plan = await autoRecoveryManager.createRecoveryPlan(validationReport);
        setRecoveryPlan(plan);
      }
    } catch (error) {
      console.error('검증 실패:', error);
    } finally {
      setValidating(false);
    }
  }, [projects, events, autoMode]);

  // 복구 실행
  const executeRecovery = useCallback(async () => {
    if (!recoveryPlan) return;

    setRecovering(true);
    try {
      await autoRecoveryManager.executeRecoveryPlan(recoveryPlan.id, {
        confirmationCallback: async (task) => {
          // 자동 모드에서는 모든 작업 승인
          if (autoMode) return true;

          // 수동 모드에서는 사용자 확인 (실제 구현 시 모달 등 사용)
          return window.confirm(`다음 작업을 실행하시겠습니까?\n${task.issue.message}`);
        }
      });

      // 복구 후 재검증
      await runValidation();
    } catch (error) {
      console.error('복구 실패:', error);
    } finally {
      setRecovering(false);
    }
  }, [recoveryPlan, autoMode, runValidation]);

  // 개별 문제 수정
  const fixIssue = useCallback(async (issue: ValidationResult) => {
    const plan = await autoRecoveryManager.createRecoveryPlan(
      { ...report!, errors: [issue], warnings: [], info: [] } as any
    );
    await autoRecoveryManager.executeRecoveryPlan(plan.id);
    await runValidation();
  }, [report, runValidation]);

  // 주기적 검증 (자동 모드)
  useEffect(() => {
    if (autoMode) {
      const interval = setInterval(runValidation, 60000); // 1분마다
      return () => clearInterval(interval);
    }
  }, [autoMode, runValidation]);

  // 초기 검증
  useEffect(() => {
    runValidation();
  }, []);

  const statistics = consistencyValidator.getStatistics();
  const recoveryStats = autoRecoveryManager.getStatistics();

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">데이터 일관성 모니터</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* 자동 모드 토글 */}
          <button
            onClick={() => setAutoMode(!autoMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              autoMode
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {autoMode ? (
              <>
                <Play className="w-4 h-4" />
                <span className="text-sm font-medium">자동</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" />
                <span className="text-sm font-medium">수동</span>
              </>
            )}
          </button>

          {/* 검증 실행 버튼 */}
          <button
            onClick={runValidation}
            disabled={validating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {validating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileSearch className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">검증 실행</span>
          </button>
        </div>
      </div>

      {/* 메인 대시보드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 점수 및 통계 */}
        <div className="space-y-6">
          {/* 점수 게이지 */}
          <div className="flex justify-center">
            <ConsistencyScoreGauge
              score={report?.score || 0}
              trend={
                statistics.averageScore > (report?.score || 0) ? 'down' :
                statistics.averageScore < (report?.score || 0) ? 'up' :
                'stable'
              }
            />
          </div>

          {/* 통계 카드 */}
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">총 검증 항목</span>
                <span className="text-lg font-semibold text-gray-900">
                  {report?.totalChecks || 0}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle className="w-3 h-3" />
                    오류
                  </span>
                  <span className="font-medium">{report?.errors.length || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-yellow-600">
                    <AlertTriangle className="w-3 h-3" />
                    경고
                  </span>
                  <span className="font-medium">{report?.warnings.length || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-blue-600">
                    <Info className="w-3 h-3" />
                    정보
                  </span>
                  <span className="font-medium">{report?.info.length || 0}</span>
                </div>
              </div>
            </div>

            {/* 복구 통계 */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">자동 복구</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">복구 가능</span>
                  <span className="font-medium text-blue-900">
                    {report?.autoFixableCount || 0}개
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">성공률</span>
                  <span className="font-medium text-blue-900">
                    {recoveryStats.successRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 문제 목록 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 오류 섹션 */}
          {report && report.errors.length > 0 && (
            <div className="border border-red-200 rounded-lg">
              <button
                onClick={() => setExpandedSections(prev => ({
                  ...prev,
                  errors: !prev.errors
                }))}
                className="w-full px-4 py-3 bg-red-50 flex items-center justify-between hover:bg-red-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-900">
                    오류 ({report.errors.length})
                  </span>
                </div>
                {expandedSections.errors ? (
                  <ChevronDown className="w-4 h-4 text-red-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-red-600" />
                )}
              </button>
              <AnimatePresence>
                {expandedSections.errors && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      {report.errors.slice(0, 5).map((error, index) => (
                        <ValidationResultCard
                          key={index}
                          result={error}
                          onFix={() => fixIssue(error)}
                        />
                      ))}
                      {report.errors.length > 5 && (
                        <p className="text-sm text-red-600 text-center">
                          +{report.errors.length - 5}개 더 보기
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* 경고 섹션 */}
          {report && report.warnings.length > 0 && (
            <div className="border border-yellow-200 rounded-lg">
              <button
                onClick={() => setExpandedSections(prev => ({
                  ...prev,
                  warnings: !prev.warnings
                }))}
                className="w-full px-4 py-3 bg-yellow-50 flex items-center justify-between hover:bg-yellow-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-900">
                    경고 ({report.warnings.length})
                  </span>
                </div>
                {expandedSections.warnings ? (
                  <ChevronDown className="w-4 h-4 text-yellow-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-yellow-600" />
                )}
              </button>
              <AnimatePresence>
                {expandedSections.warnings && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      {report.warnings.slice(0, 5).map((warning, index) => (
                        <ValidationResultCard
                          key={index}
                          result={warning}
                          onFix={() => fixIssue(warning)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* 복구 진행 상황 */}
          {recoveryPlan && (
            <div className="border border-blue-200 rounded-lg">
              <div className="px-4 py-3 bg-blue-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    복구 계획
                  </span>
                </div>
                {!recovering ? (
                  <button
                    onClick={executeRecovery}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    복구 실행
                  </button>
                ) : (
                  <span className="text-sm text-blue-600">진행 중...</span>
                )}
              </div>

              <div className="p-4 space-y-2">
                {recoveryPlan.tasks.slice(0, 5).map((task, index) => (
                  <RecoveryTaskStatus key={index} task={task} />
                ))}
              </div>

              {/* 진행 바 */}
              <div className="px-4 pb-4">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${
                        (recoveryPlan.statistics.completedTasks /
                          recoveryPlan.statistics.totalTasks) * 100
                      }%`
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};