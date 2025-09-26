/**
 * ResultsInsightsPanelV2 Main Component
 * Interactive Living Dashboard for KPI Results & Insights
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useV2Store } from './store/useV2Store';
import { useKPIDiagnosis } from '../../../../contexts/KPIDiagnosisContext';
import { useCluster } from '../../../../contexts/ClusterContext';
import { FixedHeader } from './components/FixedHeader';
import { MainCanvas } from './components/MainCanvas';
import { FloatingElements } from './components/FloatingElements';
import { LoadingOverlay } from './components/LoadingOverlay';
import { EnhancedErrorBoundary, useToast, useOnlineStatus, ToastContainer } from './components/ErrorHandling';
import { loadIntegratedData } from './utils/dataIntegration';
import './styles/v2-dashboard.css';

// 에러 폴백 컴포넌트
const V2ErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-light">
      <div className="bg-white rounded-xl shadow-lg border border-accent-red/20 max-w-md w-full mx-4">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-accent-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-accent-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-dark mb-2">
            V2 대시보드 오류
          </h3>
          <p className="text-neutral-gray mb-4">
            대시보드를 불러오는 중에 문제가 발생했습니다.
          </p>
          <button
            onClick={retry}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            다시 시도
          </button>
        </div>
      </div>
    </div>
  );
};

const ResultsInsightsPanelV2Core: React.FC = () => {
  const {
    viewState,
    animation,
    loadData,
    loadPeerData,
    setData,
    setError
  } = useV2Store();

  // 토스트 및 네트워크 상태 관리
  const { notifications, dismissToast, showError, showSuccess, showWarning } = useToast();
  const isOnline = useOnlineStatus();

  // KPI Context 데이터 가져오기
  const kpiContext = useKPIDiagnosis();
  const { cluster } = useCluster();

  // 네트워크 상태 변화 모니터링 - 최적화
  useEffect(() => {
    if (!isOnline) {
      setError('오프라인 상태: 인터넷 연결을 확인해주세요');
    } else if (isOnline && viewState.error?.includes('오프라인')) {
      setError(null);
    }
  }, [isOnline, viewState.error?.includes('오프라인')]);

  // 실제 데이터 로딩 (KPI Context 연동) - 무한 루프 방지 최적화
  useEffect(() => {
    let isMounted = true;

    const loadRealData = async () => {
      if (!isMounted) return;

      try {
        const contextData = {
          responses: kpiContext.responses,
          axisScores: kpiContext.axisScores,
          overallScore: kpiContext.overallScore,
          previousScores: kpiContext.previousScores,
          clusterInfo: cluster
        };

        const integratedData = await loadIntegratedData(contextData);

        if (!isMounted) return;

        setData(integratedData);

        // 성공 피드백 (한 번만)
        if (integratedData && Object.keys(integratedData).length > 0) {
          console.log('✅ V2 Dashboard connected to real KPI data');
        }
      } catch (error) {
        if (!isMounted) return;

        console.error('❌ Failed to load real data:', error);

        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';

        if (!isOnline) {
          setError('오프라인 상태: 인터넷 연결을 확인해주세요');
        } else {
          setError(`데이터 로딩 실패: ${errorMessage}`);
        }

        // 폴백으로 Mock 데이터 로드
        try {
          loadData();
          console.log('⚠️ Using fallback mock data for V2 Dashboard');
        } catch (fallbackError) {
          console.error('❌ Fallback data loading failed:', fallbackError);
          setError('데이터를 불러올 수 없습니다. 새로고침 후 다시 시도해주세요.');
        }
      }
    };

    // 피어 데이터 로드 (별도)
    const loadPeerDataAsync = async () => {
      if (!isMounted) return;

      try {
        await loadPeerData();
      } catch (error) {
        console.warn('⚠️ Peer data loading failed:', error);
      }
    };

    if (isOnline) {
      loadRealData();
    }

    loadPeerDataAsync();

    return () => {
      isMounted = false;
    };
  }, [
    kpiContext.axisScores,
    kpiContext.overallScore,
    JSON.stringify(kpiContext.responses), // Stable reference
    JSON.stringify(cluster), // Stable reference
    isOnline
  ]);

  return (
    <div className="results-insights-v2">
      {/* 로딩 오버레이 */}
      {viewState.isLoading && <LoadingOverlay />}

      {/* 헤더 */}
      <FixedHeader />

      {/* 메인 캔버스 영역 */}
      <MainCanvas />

      {/* 플로팅 요소들 (AI 챗, FAB 등) */}
      <FloatingElements />

      {/* 토스트 알림 컨테이너 */}
      <ToastContainer
        notifications={notifications}
        onDismiss={dismissToast}
      />

      {/* 디버그 패널 (개발 환경에서만) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-neutral-dark text-white p-2 rounded text-xs opacity-50 hover:opacity-100 transition-opacity">
          <div>Selected Axis: {viewState.selectedAxis || 'none'}</div>
          <div>Comparison Mode: {viewState.comparisonMode}</div>
          <div>Animation: {animation.transitionPhase}</div>
          <div>Auto Rotate: {animation.isAutoRotating ? 'ON' : 'OFF'}</div>
        </div>
      )}
    </div>
  );
};

// 에러 바운더리로 래핑된 메인 컴포넌트
const ResultsInsightsPanelV2: React.FC = () => {
  return (
    <EnhancedErrorBoundary fallback={V2ErrorFallback}>
      <ResultsInsightsPanelV2Core />
    </EnhancedErrorBoundary>
  );
};

export default ResultsInsightsPanelV2;