/**
 * Dashboard Page - 캘린더 중심 레이아웃
 *
 * "이벤트 발견 → 액션 → 트래킹" 중심의 인터랙티브 대시보드
 * - 상단: 확장된 인터랙티브 캘린더 + 통합 이벤트 센터 (70%)
 * - 하단: 성장 모멘텀 트래커 + 투자자 추천 (30%) - 50:50 비율
 * - 플로팅 버튼: 회사 생체신호 (기존 KPI + 새로운 기능 통합)
 * - 드래그&드롭 기반 직관적 일정 관리
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, X } from 'lucide-react';
import { DashboardProvider } from '../../contexts/DashboardContext';

// 새로운 대시보드 컴포넌트들
import InteractiveCalendarCenter from '../../components/dashboard/InteractiveCalendarCenter';
import GrowthMomentumTracker from '../../components/dashboard/GrowthMomentumTracker';
import CompanyVitalSigns from '../../components/dashboard/CompanyVitalSigns'; // 플로팅 버튼용
import WeeklyVCRecommendation from '../../components/dashboard/WeeklyVCRecommendation';
import ActionErrorBoundary from '../../components/dashboard/ActionErrorBoundary';
import { DashboardInteractionProvider } from '../../contexts/DashboardInteractionContext';

// 로딩 컴포넌트
const LoadingSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
);

// Error Boundary 컴포넌트
class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">대시보드 로딩 중 오류 발생</h2>
            <p className="text-gray-600 mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              페이지 새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const Dashboard: React.FC = () => {
  const [showKPIPanel, setShowKPIPanel] = useState(false);

  return (
    <DashboardErrorBoundary>
      <DashboardProvider>
        <div className="min-h-screen bg-gray-50">
        <DashboardInteractionProvider>
          <div className="max-w-7xl mx-auto p-6">
            {/* 상단: 확장된 인터랙티브 캘린더 + 이벤트 센터 (70%) */}
            <motion.section
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <ActionErrorBoundary>
                <InteractiveCalendarCenter />
              </ActionErrorBoundary>
            </motion.section>

            {/* 하단: 2개 컴포넌트 그리드 (50:50 비율) */}
            <motion.section
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <ActionErrorBoundary>
                <GrowthMomentumTracker />
              </ActionErrorBoundary>
              <ActionErrorBoundary>
                <WeeklyVCRecommendation />
              </ActionErrorBoundary>
            </motion.section>
          </div>
        </DashboardInteractionProvider>

        {/* 회사 생체신호 플로팅 버튼 (기존 KPI + 새로운 생체신호 통합) */}
        <motion.button
          className="fixed bottom-6 right-6 w-16 h-16 bg-primary-main hover:bg-primary-dark text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowKPIPanel(true)}
        >
          <BarChart3 className="w-6 h-6" />
        </motion.button>

        {/* 회사 생체신호 사이드 패널 */}
        <AnimatePresence>
          {showKPIPanel && (
            <>
              {/* 배경 오버레이 */}
              <motion.div
                className="fixed inset-0 bg-black/50 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowKPIPanel(false)}
              />

              {/* 사이드 패널 */}
              <motion.div
                className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              >
                <div className="p-6">
                  {/* 패널 헤더 */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">회사 생체신호</h2>
                    <button
                      onClick={() => setShowKPIPanel(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* 회사 생체신호 컴포넌트 */}
                  <CompanyVitalSigns />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        </div>
      </DashboardProvider>
    </DashboardErrorBoundary>
  );
};

export default Dashboard;