/**
 * KPI 진단 통합 페이지
 * Sprint 17 기준 - 3개 탭 구조로 간소화
 * Created: 2025-01-11
 * Updated: 2025-01-11 - 5탭에서 3탭으로 변경 (사용성 개선)
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { KPIDiagnosisProvider, useKPIDiagnosis } from '../../contexts/KPIDiagnosisContext';
import ErrorBoundary from '../../components/ErrorBoundary';
import {
  FileText,
  ChartBar,
  Rocket,
  CheckCircle
} from 'lucide-react';

// Tab panels - V2를 lazy loading으로 분리
import AssessmentPanel from './kpi-tabs/AssessmentPanel';
import ResultsInsightsPanelClean from './kpi-tabs/ResultsInsightsPanelClean';
import ActionPlanPanel from './kpi-tabs/ActionPlanPanel';

// V2 Dashboard를 동적으로 로드 - 코드 스플리팅
const ResultsInsightsPanelV2 = lazy(() => import('./kpi-tabs/ResultsInsightsPanelV2'));

type TabType = 'assess' | 'insights' | 'insights-v2' | 'action';

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
  
  console.log('KPIDiagnosisPageContent rendering:', {
    currentTab,
    tabCompletion,
    progress
  });

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

  const renderTabContent = () => {
    switch (currentTab) {
      case 'assess':
        return <AssessmentPanel />;
      case 'insights':
        return <ResultsInsightsPanelClean />;
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
      case 'action':
        return <ActionPlanPanel />;
      default:
        return <AssessmentPanel />;
    }
  };

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
        </ErrorBoundary>
      </KPIDiagnosisProvider>
    </ErrorBoundary>
  );
};

export default KPIDiagnosisPage;