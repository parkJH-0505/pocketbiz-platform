/**
 * @fileoverview 마이그레이션 통합 대시보드
 * @description Sprint 3 - Stage 3: 최종 모니터링 및 제어 UI
 * @author PocketCompany
 * @since 2025-01-23
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MigrationManager } from '../../utils/migrationManager';
import { migrationMonitor, type RealtimeStatus, type MonitoringEvent, type BottleneckInfo } from '../../utils/migrationMonitor';
import { enhancedValidator, type ValidationResult } from '../../utils/migrationValidatorEnhanced';
import { migrationErrorHandler, type MigrationError, ErrorLevel, CircuitState } from '../../utils/migrationErrorHandler';
import { modeManager, MigrationMode } from '../../utils/migrationModes';
import { migrationScopeManager, MigrationScopeType } from '../../utils/migrationScope';

// Progress Bar Component
const ProgressBar: React.FC<{ progress: number; label?: string }> = ({ progress, label }) => (
  <div className="w-full">
    {label && <div className="text-sm text-gray-600 mb-1">{label}</div>}
    <div className="relative w-full bg-gray-200 rounded-full h-6">
      <div
        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium text-gray-700">{progress.toFixed(1)}%</span>
      </div>
    </div>
  </div>
);

// Status Indicator Component
const StatusIndicator: React.FC<{ status: string; size?: 'sm' | 'md' | 'lg' }> = ({
  status,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const statusColors = {
    idle: 'bg-gray-400',
    running: 'bg-yellow-400 animate-pulse',
    completed: 'bg-green-400',
    failed: 'bg-red-400',
    paused: 'bg-orange-400'
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} ${statusColors[status] || 'bg-gray-400'} rounded-full`} />
      <span className="text-sm capitalize">{status}</span>
    </div>
  );
};

// Speed Meter Component
const SpeedMeter: React.FC<{ current: number; average: number; peak: number }> = ({
  current,
  average,
  peak
}) => (
  <div className="grid grid-cols-3 gap-2 text-center">
    <div>
      <div className="text-2xl font-bold text-blue-600">{current.toFixed(1)}</div>
      <div className="text-xs text-gray-500">Current</div>
    </div>
    <div>
      <div className="text-2xl font-bold text-green-600">{average.toFixed(1)}</div>
      <div className="text-xs text-gray-500">Average</div>
    </div>
    <div>
      <div className="text-2xl font-bold text-purple-600">{peak.toFixed(1)}</div>
      <div className="text-xs text-gray-500">Peak</div>
    </div>
    <div className="col-span-3 text-xs text-gray-500 mt-1">items/sec</div>
  </div>
);

const MigrationDashboard: React.FC = () => {
  const [migrationManager] = useState(() => MigrationManager.getInstance());

  // 실시간 상태
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus | null>(null);
  const [monitoringEvents, setMonitoringEvents] = useState<MonitoringEvent[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [errorHistory, setErrorHistory] = useState<MigrationError[]>([]);
  const [bottlenecks, setBottlenecks] = useState<BottleneckInfo[]>([]);

  // 모드 및 설정
  const [currentMode, setCurrentMode] = useState<MigrationMode>(MigrationMode.AUTO);
  const [scopeType, setScopeType] = useState<MigrationScopeType>(MigrationScopeType.FULL);

  // 통계
  const [errorStats, setErrorStats] = useState<any>(null);
  const [validationStats, setValidationStats] = useState<any>(null);
  const [monitorSummary, setMonitorSummary] = useState<any>(null);

  // 실시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      updateDashboard();
    }, 500);

    // 이벤트 리스너
    migrationMonitor.on('progress', (status: RealtimeStatus) => {
      setRealtimeStatus(status);
    });

    migrationMonitor.on('event', (event: MonitoringEvent) => {
      setMonitoringEvents(prev => [...prev.slice(-9), event]);
    });

    return () => {
      clearInterval(interval);
      migrationMonitor.removeAllListeners();
    };
  }, []);

  const updateDashboard = () => {
    // 모니터링 상태
    setRealtimeStatus(migrationMonitor.getStatus());
    setMonitoringEvents(migrationMonitor.getEventHistory(10));
    setBottlenecks(migrationMonitor.analyzeBottlenecks());
    setMonitorSummary(migrationMonitor.getSummary());

    // 검증 결과
    setValidationResults(enhancedValidator.getValidationHistory(5));
    setValidationStats(enhancedValidator.getStatistics());

    // 에러 상태
    setErrorHistory(migrationErrorHandler.getErrorHistory(10));
    setErrorStats(migrationErrorHandler.getErrorStatistics());

    // 모드
    setCurrentMode(modeManager.getCurrentMode());
  };

  // 마이그레이션 시작
  const startMigration = async () => {
    try {
      // 모니터링 시작
      migrationMonitor.start(100); // 예상 100개 항목

      // 검증 실행
      const preValidation = await enhancedValidator.validatePreMigration({
        projects: [], // 실제 데이터
        meetings: []
      });

      if (!preValidation.passed && preValidation.criticalCount > 0) {
        alert('Pre-migration validation failed!');
        return;
      }

      // 스냅샷 생성
      migrationErrorHandler.createSnapshot({ /* current state */ });

      // 마이그레이션 실행
      const scope = migrationScopeManager.createScope(scopeType);
      const results = await migrationManager.migrate({
        mode: currentMode === MigrationMode.MANUAL ? 'manual' : 'auto',
        scope,
        onProgress: (progress, message) => {
          migrationMonitor.updateProgress(progress, 100);
          if (message) migrationMonitor.updatePhase(message);
        }
      });

      // Post-validation
      await enhancedValidator.validatePostMigration({
        result: results[0],
        before: 100,
        after: results[0]?.migrated || 0
      });

      // 모니터링 중지
      migrationMonitor.stop();

      alert(`Migration completed! Processed: ${results[0]?.migrated || 0} items`);

    } catch (error) {
      console.error('Migration failed:', error);
      migrationErrorHandler.handleError(error);
      migrationMonitor.stop();
    }
  };

  // 시뮬레이션 실행
  const runSimulation = async () => {
    const result = await enhancedValidator.simulate({
      projects: [], // 테스트 데이터
      meetings: []
    });

    alert(`Simulation Result:
    Would Pass: ${result.wouldPass}
    Issues: ${result.issues.length}
    Recommendations: ${result.recommendations.join(', ')}`);
  };

  // 롤백 실행
  const performRollback = async () => {
    if (confirm('Are you sure you want to rollback?')) {
      const success = await migrationErrorHandler.rollback();
      alert(success ? 'Rollback successful' : 'Rollback failed');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Migration Dashboard
            </h1>
            <p className="text-gray-600">
              Sprint 3 Complete - Real-time Monitoring & Control
            </p>
          </div>
          <StatusIndicator status={realtimeStatus?.state || 'idle'} size="lg" />
        </div>
      </div>

      {/* Main Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-4 gap-4 mb-4">
          {/* Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Execution Mode
            </label>
            <select
              value={currentMode}
              onChange={(e) => modeManager.setMode(e.target.value as MigrationMode)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              {Object.values(MigrationMode).map(mode => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </div>

          {/* Scope Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Migration Scope
            </label>
            <select
              value={scopeType}
              onChange={(e) => setScopeType(e.target.value as MigrationScopeType)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              {Object.values(MigrationScopeType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="col-span-2 flex items-end gap-2">
            <button
              onClick={startMigration}
              disabled={realtimeStatus?.state === 'running'}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              Start Migration
            </button>
            <button
              onClick={() => migrationManager.pause()}
              disabled={realtimeStatus?.state !== 'running'}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50"
            >
              Pause
            </button>
            <button
              onClick={() => migrationManager.resume()}
              disabled={realtimeStatus?.state !== 'paused'}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
            >
              Resume
            </button>
            <button
              onClick={() => migrationManager.cancel()}
              disabled={realtimeStatus?.state !== 'running' && realtimeStatus?.state !== 'paused'}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {realtimeStatus && (
          <ProgressBar
            progress={realtimeStatus.progress}
            label={`Processing: ${realtimeStatus.itemsProcessed}/${realtimeStatus.itemsTotal} items`}
          />
        )}
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Speed Meter */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Processing Speed</h3>
          {realtimeStatus && (
            <SpeedMeter
              current={realtimeStatus.currentSpeed}
              average={realtimeStatus.averageSpeed}
              peak={realtimeStatus.peakSpeed}
            />
          )}
        </div>

        {/* Error Statistics */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Error Statistics</h3>
          {errorStats && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Errors:</span>
                <span className="font-medium">{errorStats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Circuit State:</span>
                <span className={`font-medium ${
                  errorStats.circuitState === CircuitState.OPEN ? 'text-red-600' :
                  errorStats.circuitState === CircuitState.HALF_OPEN ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {errorStats.circuitState}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Critical:</span>
                <span className="font-medium text-red-600">
                  {errorStats.byLevel?.critical || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Warnings:</span>
                <span className="font-medium text-yellow-600">
                  {errorStats.byLevel?.warning || 0}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Validation Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Validation</h3>
          {validationStats && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Validations:</span>
                <span className="font-medium">{validationStats.totalValidations}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Success Rate:</span>
                <span className="font-medium text-green-600">
                  {validationStats.successRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Duration:</span>
                <span className="font-medium">
                  {validationStats.averageDuration.toFixed(0)}ms
                </span>
              </div>
              <button
                onClick={runSimulation}
                className="w-full mt-2 px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
              >
                Run Simulation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Event Log & Bottlenecks */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Event Log */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Event Log</h3>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {monitoringEvents.map((event, idx) => (
              <div
                key={idx}
                className={`p-2 rounded text-xs ${
                  event.level === 'error' ? 'bg-red-50' :
                  event.level === 'warning' ? 'bg-yellow-50' :
                  'bg-gray-50'
                }`}
              >
                <div className="flex justify-between">
                  <span className="font-medium">{event.type}</span>
                  <span className="text-gray-500">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-gray-600">{event.message}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottlenecks */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Bottlenecks</h3>
          {bottlenecks.length > 0 ? (
            <div className="space-y-2">
              {bottlenecks.map((bottleneck, idx) => (
                <div key={idx} className="p-3 bg-orange-50 rounded">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-sm">{bottleneck.phase}</span>
                    <span className="text-sm text-orange-600">
                      {bottleneck.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded h-2">
                    <div
                      className="bg-orange-500 h-2 rounded"
                      style={{ width: `${bottleneck.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Duration: {(bottleneck.duration / 1000).toFixed(2)}s
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No bottlenecks detected</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-3">
          <button
            onClick={performRollback}
            className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            🔄 Rollback
          </button>
          <button
            onClick={() => {
              migrationMonitor.reset();
              enhancedValidator.reset();
              migrationErrorHandler.reset();
              alert('All systems reset');
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            🔄 Reset All
          </button>
          <button
            onClick={() => {
              const snapshot = migrationErrorHandler.createSnapshot({ test: true });
              alert(`Snapshot created: ${snapshot}`);
            }}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            📸 Create Snapshot
          </button>
          <button
            onClick={() => {
              const summary = migrationMonitor.getSummary();
              console.log('Summary:', summary);
              alert('Summary logged to console');
            }}
            className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            📊 Export Report
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {monitorSummary && (
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Session Summary</h3>
          <div className="grid grid-cols-6 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-700">
                {(monitorSummary.totalDuration / 1000).toFixed(1)}s
              </div>
              <div className="text-xs text-gray-500">Duration</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {monitorSummary.totalProcessed}
              </div>
              <div className="text-xs text-gray-500">Processed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {monitorSummary.averageSpeed.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">Avg Speed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {monitorSummary.peakSpeed.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">Peak Speed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {(monitorSummary.errorRate * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">Error Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {(monitorSummary.warningRate * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">Warning Rate</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MigrationDashboard;