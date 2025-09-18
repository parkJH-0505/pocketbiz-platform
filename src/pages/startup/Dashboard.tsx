/**
 * Dashboard Page
 *
 * "매일 만나고 싶은 성장 동반자" 메인 대시보드
 * - 오늘의 액션 (상단 미니 알림바)
 * - 성장 캘린더 (메인 중앙)
 * - 사이드바: 성장 레벨 + 숨은 기회
 */

import React, { Suspense, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, X } from 'lucide-react';
import { DashboardProvider } from '../../contexts/DashboardContext';

// 컴포넌트 지연 로딩
const TodaysActionCompact = React.lazy(() => import('../../components/dashboard/TodaysActionCompact'));
const GrowthCalendarPremium = React.lazy(() => import('../../components/dashboard/GrowthCalendarPremium'));
const GrowthInsights = React.lazy(() => import('../../components/dashboard/GrowthInsights'));
const KPIRadarPremium = React.lazy(() => import('../../components/dashboard/KPIRadarPremium'));
const ActionErrorBoundary = React.lazy(() => import('../../components/dashboard/ActionErrorBoundary'));
const ProfileCard = React.lazy(() => import('../../components/dashboard/ProfileCard'));
const WeeklyVCRecommendation = React.lazy(() => import('../../components/dashboard/WeeklyVCRecommendation'));

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
        {/* 오늘의 액션 - 상단 고정 알림바 */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <Suspense fallback={<LoadingSkeleton className="h-12" />}>
              <ActionErrorBoundary>
                <TodaysActionCompact />
              </ActionErrorBoundary>
            </Suspense>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          {/* 프로필 카드 */}
          <motion.section
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Suspense fallback={<LoadingSkeleton className="h-24" />}>
              <ProfileCard />
            </Suspense>
          </motion.section>

          {/* 메인 캘린더 - 전체 폭 */}
          <motion.section
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Suspense fallback={<LoadingSkeleton className="h-[700px]" />}>
              <GrowthCalendarPremium />
            </Suspense>
          </motion.section>

          {/* 숨은 기회 발견 - 전체 폭 */}
          <motion.section
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Suspense fallback={<LoadingSkeleton className="h-48" />}>
              <GrowthInsights />
            </Suspense>
          </motion.section>

          {/* 주간 VC 추천 - 하단 배치 */}
          <motion.section
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Suspense fallback={<LoadingSkeleton className="h-64" />}>
              <WeeklyVCRecommendation />
            </Suspense>
          </motion.section>
        </div>


        {/* KPI 레이더 플로팅 버튼 */}
        <motion.button
          className="fixed bottom-6 right-6 w-16 h-16 bg-primary-main hover:bg-primary-dark text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowKPIPanel(true)}
        >
          <BarChart3 className="w-6 h-6" />
        </motion.button>

        {/* KPI 레이더 사이드 패널 */}
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
                    <h2 className="text-xl font-bold text-gray-900">KPI 대시보드</h2>
                    <button
                      onClick={() => setShowKPIPanel(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* KPI 레이더 컴포넌트 */}
                  <Suspense fallback={<LoadingSkeleton className="h-80" />}>
                    <KPIRadarPremium />
                  </Suspense>
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