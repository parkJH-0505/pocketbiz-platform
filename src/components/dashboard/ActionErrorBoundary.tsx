/**
 * Action Error Boundary
 *
 * TodaysAction 컴포넌트 전용 에러 바운더리
 * - 사용자 친화적 에러 메시지
 * - 폴백 액션 제공
 * - 에러 추적 및 리포트
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackAction?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ActionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // 에러 추적
    console.error('TodaysAction Error:', error, errorInfo);

    // localStorage에 에러 로그 저장
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent
      };

      const existingErrors = JSON.parse(
        localStorage.getItem('dashboard_errors') || '[]'
      );
      existingErrors.push(errorLog);

      // 최근 10개 에러만 유지
      if (existingErrors.length > 10) {
        existingErrors.splice(0, existingErrors.length - 10);
      }

      localStorage.setItem('dashboard_errors', JSON.stringify(existingErrors));
    } catch (storageError) {
      console.warn('Failed to log error to localStorage:', storageError);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleFallbackAction = () => {
    if (this.props.fallbackAction) {
      this.props.fallbackAction();
    } else {
      // 기본 폴백: KPI 페이지로 이동
      window.location.href = '/startup/kpi';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          className="w-full bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center">
            {/* 에러 아이콘 */}
            <motion.div
              className="text-orange-500 mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
            >
              <AlertTriangle className="w-12 h-12 mx-auto" />
            </motion.div>

            {/* 에러 메시지 */}
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              일시적인 문제가 발생했어요
            </h2>

            <p className="text-sm text-gray-600 mb-6">
              최적의 액션을 준비하는 중에 문제가 생겼어요.<br />
              다시 시도하거나 직접 KPI 진단을 시작해보세요.
            </p>

            {/* 액션 버튼들 */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <motion.button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className="w-4 h-4" />
                다시 시도
              </motion.button>

              <motion.button
                onClick={this.handleFallbackAction}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ArrowRight className="w-4 h-4" />
                KPI 진단 시작
              </motion.button>
            </div>

            {/* 격려 메시지 */}
            <motion.p
              className="mt-4 text-xs text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              괜찮아요, 이런 일은 가끔 있어요. 계속해서 성장해나가요! 💪
            </motion.p>

            {/* 개발 모드에서만 에러 상세 정보 표시 */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <motion.details
                className="mt-6 text-left"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  개발자 정보 (클릭하여 펼치기)
                </summary>
                <div className="mt-2 p-4 bg-gray-100 rounded text-xs font-mono overflow-auto">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </motion.details>
            )}
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

export default ActionErrorBoundary;