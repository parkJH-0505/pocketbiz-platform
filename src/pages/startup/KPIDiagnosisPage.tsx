/**
 * KPI 진단 통합 페이지
 * Sprint 17 기준 - 3개 탭 구조로 간소화
 * Created: 2025-01-11
 * Updated: 2025-01-11 - 5탭에서 3탭으로 변경 (사용성 개선)
 */

import { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { KPIDiagnosisProvider, useKPIDiagnosis } from '../../contexts/KPIDiagnosisContext';
import ErrorBoundary from '../../components/ErrorBoundary';
import ActionFeedback from '../../components/feedback/ActionFeedback';
import {
  FileText,
  ChartBar,
  Rocket,
  CheckCircle
} from 'lucide-react';

// Tab panels - 모든 패널을 lazy loading으로 최적화
const AssessmentPanel = lazy(() =>
  import('./kpi-tabs/AssessmentPanel')
);

const ResultsInsightsPanelClean = lazy(() =>
  import('./kpi-tabs/ResultsInsightsPanelClean')
);

const ActionPlanPanel = lazy(() =>
  import('./kpi-tabs/ActionPlanPanel')
);

// V2 Dashboard를 동적으로 로드 - 코드 스플리팅 with error handling
const ResultsInsightsPanelV2 = lazy(() =>
  import('./kpi-tabs/ResultsInsightsPanelV2').catch(err => {
    console.error('V2 패널 로드 실패:', err);
    // 폴백 컴포넌트 반환
    return {
      default: () => (
        <div className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">V2 패널을 불러올 수 없습니다</h3>
          <p className="text-gray-600 mb-4">리소스 부족으로 패널을 로드할 수 없습니다</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            페이지 새로고침
          </button>
        </div>
      )
    };
  })
);

// V3 Dashboard를 동적으로 로드
const ResultsInsightsPanelV3 = lazy(() =>
  import('./kpi-tabs/ResultsInsightsPanelV3/ResultsInsightsPanelV3').then(module => ({
    default: module.ResultsInsightsPanelV3
  })).catch(err => {
    console.error('V3 패널 로드 실패:', err);
    console.error('Error details:', err.message, err.stack);
    return {
      default: () => (
        <div className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">V3 패널을 불러올 수 없습니다</h3>
          <p className="text-gray-600 mb-4">새로운 리포트 시스템을 로드할 수 없습니다</p>
          <details className="mb-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-600">에러 세부사항</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {err.message || err.toString()}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            페이지 새로고침
          </button>
        </div>
      )
    };
  })
);

type TabType = 'assess' | 'insights' | 'insights-v2' | 'insights-v3' | 'action';

interface Tab {
  key: TabType;
  label: string;
  icon: any;
  description: string;
  completed?: boolean;
}

const KPIDiagnosisPageContent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get('tab') as TabType) || 'assess';
  
  let tabCompletion, progress;
  try {
    const context = useKPIDiagnosis();
    tabCompletion = context.tabCompletion;
    progress = context.progress;
  } catch (error) {
    console.error('Error using KPIDiagnosis context:', error);
    // Provide default values if context fails
    tabCompletion = {
      assess: false,
      results: false,
      analysis: false,
      benchmark: false,
      action: false
    };
    progress = {
      percentage: 0,
      completed: 0,
      total: 0
    };
  }

  // 렌더링 로그 비활성화 (너무 많은 로그 출력 방지)
  // console.log('KPIDiagnosisPageContent rendering:', {
  //   currentTab,
  //   tabCompletion,
  //   progress
  // });

  const tabs: Tab[] = [
    {
      key: 'assess',
      label: '진단하기',
      icon: FileText,
      description: `KPI 입력 및 평가 (${progress.percentage}% 완료)`,
      completed: tabCompletion.assess
    },
    {
      key: 'insights',
      label: '결과 & 인사이트',
      icon: ChartBar,
      description: '종합 분석 및 벤치마킹',
      completed: tabCompletion.results
    },
    {
      key: 'insights-v2',
      label: '결과 & 인사이트 V2',
      icon: ChartBar,
      description: '인터렉티브 Living Dashboard',
      completed: false
    },
    {
      key: 'insights-v3',
      label: '결과 & 인사이트 V3',
      icon: ChartBar,
      description: '전문 분석 리포트 (1-pager)',
      completed: false
    },
    {
      key: 'action',
      label: '액션플랜',
      icon: Rocket,
      description: '우선순위 개선 과제',
      completed: tabCompletion.action
    }
  ];

  const handleTabChange = (tab: TabType) => {
    setSearchParams({ tab });
  };

  const renderTabContent = useCallback(() => {
    switch (currentTab) {
      case 'assess':
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[600px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-main border-t-transparent mb-4 mx-auto"></div>
                  <p className="text-neutral-gray">진단 패널 로딩 중...</p>
                </div>
              </div>
            }
          >
            <AssessmentPanel />
          </Suspense>
        );
      case 'insights':
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[600px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-main border-t-transparent mb-4 mx-auto"></div>
                  <p className="text-neutral-gray">결과 패널 로딩 중...</p>
                </div>
              </div>
            }
          >
            <ResultsInsightsPanelClean />
          </Suspense>
        );
      case 'insights-v2':
        // V2 Dashboard를 Suspense로 감싸서 로딩 상태 처리
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[600px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-main border-t-transparent mb-4 mx-auto"></div>
                  <p className="text-neutral-gray">V2 Dashboard 로딩 중...</p>
                  <p className="text-sm text-neutral-gray mt-2">고급 분석 기능을 준비하고 있습니다</p>
                </div>
              </div>
            }
          >
            <ResultsInsightsPanelV2 />
          </Suspense>
        );
      case 'insights-v3':
        // V3 Dashboard를 Suspense로 감싸서 로딩 상태 처리
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[600px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-main border-t-transparent mb-4 mx-auto"></div>
                  <p className="text-neutral-gray">V3 Report 로딩 중...</p>
                  <p className="text-sm text-neutral-gray mt-2">전문 분석 리포트를 준비하고 있습니다</p>
                </div>
              </div>
            }
          >
            <ResultsInsightsPanelV3 />
          </Suspense>
        );
      case 'action':
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[600px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-main border-t-transparent mb-4 mx-auto"></div>
                  <p className="text-neutral-gray">액션플랜 로딩 중...</p>
                </div>
              </div>
            }
          >
            <ActionPlanPanel />
          </Suspense>
        );
      default:
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[600px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-main border-t-transparent mb-4 mx-auto"></div>
                  <p className="text-neutral-gray">로딩 중...</p>
                </div>
              </div>
            }
          >
            <AssessmentPanel />
          </Suspense>
        );
    }
  }, [currentTab]);

  return (
    <div className="h-full flex flex-col bg-neutral-light">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-neutral-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.key;
              
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`
                    relative py-4 px-1 flex items-center gap-2 border-b-2 transition-all duration-200
                    ${isActive 
                      ? 'border-primary-main text-primary-main font-semibold' 
                      : 'border-transparent text-neutral-gray hover:text-neutral-dark hover:border-neutral-border'
                    }
                  `}
                >
                  <Icon size={18} />
                  <span className="text-sm">{tab.label}</span>
                  
                  {tab.completed && (
                    <CheckCircle size={16} className="text-success-main ml-1" />
                  )}
                  
                  {/* Active indicator animation */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-main animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

const KPIDiagnosisPage = () => {
  
  return (
    <ErrorBoundary>
      <KPIDiagnosisProvider>
        <ErrorBoundary>
          <KPIDiagnosisPageContent />
          {/* 실시간 액션 피드백 시스템 */}
          <ActionFeedback position="bottom-right" duration={3000} maxItems={2} />
        </ErrorBoundary>
      </KPIDiagnosisProvider>
    </ErrorBoundary>
  );
};

export default KPIDiagnosisPage;