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
import ActionFeedback from '../../components/feedback/ActionFeedback';
import { DashboardInteractionProvider } from '../../contexts/DashboardInteractionContext';

// 시스템 테스트 및 검증 도구들
import UsageScenarioGuide from '../../components/guide/UsageScenarioGuide';

// Momentum 컴포넌트들
import AmbientStatusBar from '../../components/momentum/AmbientStatusBar';
import { MomentumProvider } from '../../hooks/useMomentum';

// Celebration 시스템
import { CelebrationProvider } from '../../contexts/CelebrationContext';

// 제거됨: Nudge 시스템, Analytics 시스템 (감정 기반 분석)

// 모멘텀 시스템 (실용적 대안)
import MomentumCard from '../../components/momentum/MomentumCard';

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
  const [activeTab, setActiveTab] = useState<'vitals' | 'testing'>('vitals');

  return (
    <DashboardErrorBoundary>
      <MomentumProvider>
        <CelebrationProvider>
          <DashboardProvider>
          <div className="min-h-screen bg-gray-50">
            <DashboardInteractionProvider>
              <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Ambient Status Bar - Dashboard 내부 최상단에 위치 */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <AmbientStatusBar className="mb-6" />
                </motion.div>
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

            {/* 비즈니스 건강도 - 실용적 대안 */}
            <motion.section
              className="w-full max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <MomentumCard />
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
                    <h2 className="text-xl font-bold text-gray-900">시스템 모니터링</h2>
                    <button
                      onClick={() => setShowKPIPanel(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* 탭 네비게이션 */}
                  <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setActiveTab('vitals')}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'vitals'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      생체신호
                    </button>
                    <button
                      onClick={() => setActiveTab('testing')}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'testing'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      시나리오 테스트
                    </button>
                  </div>

                  {/* 탭 컨텐츠 */}
                  {activeTab === 'vitals' && <CompanyVitalSigns />}
                  {activeTab === 'testing' && <UsageScenarioGuide />}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 실시간 액션 피드백 시스템 */}
        <ActionFeedback position="top-right" duration={4000} maxItems={3} />

        {/* 제거됨: Gentle Nudge System */}
          </div>
          </DashboardProvider>
        </CelebrationProvider>
      </MomentumProvider>
    </DashboardErrorBoundary>
  );
};

export default Dashboard;