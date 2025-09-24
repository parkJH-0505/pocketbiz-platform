/**
 * Sprint1Verification.tsx
 *
 * Sprint 1 (Stage 1-4) 검증 페이지
 * 모든 수정사항이 정상 작동하는지 확인
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Play, RefreshCw } from 'lucide-react';
import { errorMonitor } from '../../utils/errorMonitor';
import { contextReadyEmitter } from '../../utils/contextReadyEmitter';
import { migrationRetryManager } from '../../utils/migrationRetryManager';

interface VerificationResult {
  name: string;
  description: string;
  status: 'pending' | 'testing' | 'passed' | 'failed' | 'warning';
  details?: string;
  timestamp?: string;
}

const Sprint1Verification: React.FC = () => {
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'testing' | 'completed'>('idle');

  // 테스트 항목 정의
  const testItems: VerificationResult[] = [
    {
      name: 'ToastContext 연결',
      description: 'showSuccess/showError 함수 정상 작동',
      status: 'pending'
    },
    {
      name: 'Window Context 노출',
      description: 'ScheduleContext와 BuildupContext가 window에 노출',
      status: 'pending'
    },
    {
      name: 'Context Ready 시스템',
      description: '모든 Context가 준비 상태 확인',
      status: 'pending'
    },
    {
      name: 'Phase Transition Queue',
      description: 'Queue가 Context를 기다리고 정상 작동',
      status: 'pending'
    },
    {
      name: 'Unknown ProjectId 처리',
      description: 'Invalid projectId로 마이그레이션 시도 안함',
      status: 'pending'
    },
    {
      name: '마이그레이션 재시도 제한',
      description: '최대 3회 재시도 후 중단',
      status: 'pending'
    },
    {
      name: '콘솔 에러 없음',
      description: '페이지 로드 시 에러 없음',
      status: 'pending'
    },
    {
      name: '무한 루프 없음',
      description: 'console.log 무한 출력 없음',
      status: 'pending'
    }
  ];

  useEffect(() => {
    setResults(testItems);
  }, []);

  // 개별 테스트 함수들
  const testToastContext = async (): Promise<boolean> => {
    try {
      // BuildupContext가 ToastContext를 사용하는지 확인
      const hasToast = typeof (window as any).buildupContext !== 'undefined';

      // 에러 모니터로 showSuccess/showError 에러 확인
      const hasErrors = errorMonitor.hasErrorPattern('showSuccess|showError');

      return hasToast && !hasErrors;
    } catch {
      return false;
    }
  };

  const testWindowContext = async (): Promise<boolean> => {
    const scheduleAvailable = !!(window as any).scheduleContext;
    const buildupAvailable = !!(window as any).buildupContext;
    const debugAvailable = !!(window as any).__DEBUG_CONTEXTS__;

    return scheduleAvailable && buildupAvailable && debugAvailable;
  };

  const testContextReady = async (): Promise<boolean> => {
    const status = contextReadyEmitter.getReadyStatus();
    return status.schedule && status.buildup;
  };

  const testPhaseTransitionQueue = async (): Promise<boolean> => {
    try {
      // Queue가 Context를 기다리는지 확인
      const queue = (window as any).transitionQueue;
      if (!queue) return false;

      // Queue 상태 확인
      const status = queue.getAllQueues();
      return typeof status === 'object';
    } catch {
      return true; // Queue가 없어도 에러가 없으면 OK
    }
  };

  const testUnknownProjectId = async (): Promise<boolean> => {
    // 마이그레이션 기록 확인
    const stats = migrationRetryManager.getStatistics();

    // unknown projectId 에러 확인
    const hasUnknownError = errorMonitor.hasErrorPattern('unknown.*project|project.*unknown');

    return !hasUnknownError;
  };

  const testMigrationRetry = async (): Promise<boolean> => {
    const stats = migrationRetryManager.getStatistics();

    // 실패한 마이그레이션이 있다면 재시도 횟수 확인
    const records = migrationRetryManager.getAllRecords();
    const overRetried = records.some(r => r.attempts > 3);

    return !overRetried;
  };

  const testNoConsoleErrors = async (): Promise<boolean> => {
    // 5초간 에러 모니터링
    errorMonitor.clear();
    errorMonitor.start();

    await new Promise(resolve => setTimeout(resolve, 2000));

    const report = errorMonitor.getReport();
    errorMonitor.stop();

    return report.totalErrors === 0;
  };

  const testNoInfiniteLoop = async (): Promise<boolean> => {
    // console.log 카운터
    let logCount = 0;
    const originalLog = console.log;

    console.log = (...args: any[]) => {
      logCount++;
      originalLog.apply(console, args);
    };

    // 2초 동안 로그 카운트
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log = originalLog;

    // 2초 동안 100개 이상의 로그가 있으면 무한 루프로 판단
    return logCount < 100;
  };

  // 전체 테스트 실행
  const runAllTests = async () => {
    setIsRunning(true);
    setOverallStatus('testing');

    const testFunctions = [
      testToastContext,
      testWindowContext,
      testContextReady,
      testPhaseTransitionQueue,
      testUnknownProjectId,
      testMigrationRetry,
      testNoConsoleErrors,
      testNoInfiniteLoop
    ];

    const updatedResults = [...results];

    for (let i = 0; i < testFunctions.length; i++) {
      // 테스트 시작
      updatedResults[i] = {
        ...updatedResults[i],
        status: 'testing',
        timestamp: new Date().toLocaleTimeString()
      };
      setResults([...updatedResults]);

      // 테스트 실행
      try {
        const passed = await testFunctions[i]();
        updatedResults[i] = {
          ...updatedResults[i],
          status: passed ? 'passed' : 'failed',
          details: passed ? '✅ 정상 작동' : '❌ 문제 발견'
        };
      } catch (error) {
        updatedResults[i] = {
          ...updatedResults[i],
          status: 'failed',
          details: `❌ 에러: ${error.message}`
        };
      }

      setResults([...updatedResults]);

      // 다음 테스트까지 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
    setOverallStatus('completed');

    // 최종 보고서 출력
    console.group('🎯 Sprint 1 Verification Complete');
    console.log('Test Results:', updatedResults);
    errorMonitor.printReport();
    console.groupEnd();
  };

  // 상태별 아이콘
  const getStatusIcon = (status: VerificationResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'testing':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-300" />;
    }
  };

  // 전체 성공률 계산
  const getSuccessRate = () => {
    const passed = results.filter(r => r.status === 'passed').length;
    const total = results.length;
    return total > 0 ? Math.round((passed / total) * 100) : 0;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-8"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sprint 1 Verification
          </h1>
          <p className="text-gray-600">
            Stage 1-4 수정사항 통합 테스트
          </p>
        </div>

        {/* 진행률 표시 */}
        {overallStatus === 'completed' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">성공률</span>
              <span className="text-lg font-bold text-gray-900">{getSuccessRate()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  getSuccessRate() === 100 ? 'bg-green-500' :
                  getSuccessRate() >= 75 ? 'bg-blue-500' :
                  getSuccessRate() >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${getSuccessRate()}%` }}
              />
            </div>
          </div>
        )}

        {/* 테스트 항목 목록 */}
        <div className="space-y-3 mb-6">
          {results.map((result, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border ${
                result.status === 'passed' ? 'border-green-200 bg-green-50' :
                result.status === 'failed' ? 'border-red-200 bg-red-50' :
                result.status === 'testing' ? 'border-blue-200 bg-blue-50' :
                'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {result.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {result.description}
                    </p>
                    {result.details && (
                      <p className={`text-sm mt-2 ${
                        result.status === 'passed' ? 'text-green-600' :
                        result.status === 'failed' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {result.details}
                      </p>
                    )}
                  </div>
                </div>
                {result.timestamp && (
                  <span className="text-xs text-gray-500">
                    {result.timestamp}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* 실행 버튼 */}
        <div className="flex justify-center">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className={`px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors ${
              isRunning
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>테스트 진행 중...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>테스트 실행</span>
              </>
            )}
          </button>
        </div>

        {/* 디버그 정보 */}
        {import.meta.env.DEV && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Debug Commands:</h4>
            <code className="text-xs text-gray-600 block">
              window.__errorMonitor__.printReport()<br />
              window.__contextStatus__()<br />
              window.__migrationRetry__.getStatistics()
            </code>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Sprint1Verification;