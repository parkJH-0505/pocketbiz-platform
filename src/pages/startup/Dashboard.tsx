/**
 * Dashboard Page
 *
 * "매일 만나고 싶은 성장 동반자" 메인 대시보드
 * - 오늘의 액션 (상단 미니 알림바)
 * - 성장 캘린더 (메인 중앙)
 * - 사이드바: 성장 레벨 + 숨은 기회
 */

import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { DashboardProvider } from '../../contexts/DashboardContext';

// 컴포넌트 지연 로딩
const TodaysActionCompact = React.lazy(() => import('../../components/dashboard/TodaysActionCompact'));
const GrowthCalendarPremium = React.lazy(() => import('../../components/dashboard/GrowthCalendarPremium'));
const GrowthInsights = React.lazy(() => import('../../components/dashboard/GrowthInsights'));
const KPIRadarMini = React.lazy(() => import('../../components/dashboard/KPIRadarMini'));
const ActionErrorBoundary = React.lazy(() => import('../../components/dashboard/ActionErrorBoundary'));

// 로딩 컴포넌트
const LoadingSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
);

const Dashboard: React.FC = () => {
  return (
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
          {/* 상단 위젯 그리드 */}
          <div className="grid grid-cols-12 gap-6 mb-6">
            {/* 메인 캘린더 - 9/12 컬럼 */}
            <motion.section
              className="col-span-12 lg:col-span-9"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Suspense fallback={<LoadingSkeleton className="h-[700px]" />}>
                <GrowthCalendarPremium />
              </Suspense>
            </motion.section>

            {/* 사이드 위젯 - 3/12 컬럼 */}
            <motion.aside
              className="col-span-12 lg:col-span-3 space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Suspense fallback={<LoadingSkeleton className="h-80" />}>
                <KPIRadarMini />
              </Suspense>
            </motion.aside>
          </div>

          {/* 숨은 기회 발견 - 전체 폭 */}
          <motion.section
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Suspense fallback={<LoadingSkeleton className="h-48" />}>
              <GrowthInsights />
            </Suspense>
          </motion.section>
        </div>
      </div>
    </DashboardProvider>
  );
};

export default Dashboard;