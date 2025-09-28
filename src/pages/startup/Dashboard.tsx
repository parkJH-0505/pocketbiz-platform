/**
 * Dashboard Page - 캘린더 중심 레이아웃
 *
 * "이벤트 발견 → 액션 → 트래킹" 중심의 인터랙티브 대시보드
 * - 메인: 확장된 인터랙티브 캘린더 (75%)
 * - 하단: 투자자 추천 - 한 명씩 가로 스크롤 (25%)
 * - 플로팅 버튼: 회사 생체신호 (KPI + 성장 모멘텀 통합)
 * - 드래그&드롭 기반 직관적 일정 관리
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, X } from 'lucide-react';
import { DashboardProvider } from '../../contexts/DashboardContext';

// 새로운 대시보드 컴포넌트들
import InteractiveCalendarCenter from '../../components/dashboard/InteractiveCalendarCenter';
import CompanyVitalSigns from '../../components/dashboard/CompanyVitalSigns'; // 플로팅 버튼용 (GrowthMomentumTracker 통합)
import WeeklyVCRecommendation from '../../components/dashboard/WeeklyVCRecommendation';
import ActionErrorBoundary from '../../components/dashboard/ActionErrorBoundary';
import { DashboardInteractionProvider } from '../../contexts/DashboardInteractionContext';

// Momentum 컴포넌트들
import AmbientStatusBar from '../../components/momentum/AmbientStatusBar';
import { MomentumProvider } from '../../hooks/useMomentum';

// Celebration 시스템
import { CelebrationProvider } from '../../contexts/CelebrationContext';

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
      <MomentumProvider>
        <CelebrationProvider>
          <DashboardProvider>
          <div className="min-h-screen bg-gray-50">
            {/* Ambient Status Bar - 최상단에 위치 */}
            <AmbientStatusBar className="fixed top-0 left-0 right-0 z-30" />

            <DashboardInteractionProvider>
              {/* 상단 여백 추가 (AmbientStatusBar 높이만큼) */}
              <div className="pt-12">
                <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* 메인: 확장된 인터랙티브 캘린더 (75% 높이) */}
            <motion.section
              className="flex-1"
              style={{ minHeight: '70vh' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <ActionErrorBoundary>
                <InteractiveCalendarCenter className="h-full" />
              </ActionErrorBoundary>
            </motion.section>

            {/* 하단: 투자자 추천 (25% 높이 - 가로 전체) */}
            <motion.section
              className="w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <ActionErrorBoundary>
                <WeeklyVCRecommendation />
              </ActionErrorBoundary>
            </motion.section>
                </div>
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
        </CelebrationProvider>
      </MomentumProvider>
    </DashboardErrorBoundary>
  );
};

export default Dashboard;