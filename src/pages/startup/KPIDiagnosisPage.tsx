/**
 * KPI 진단 통합 페이지
 * Sprint 17 기준 - 3개 탭 구조로 간소화
 * Created: 2025-01-11
 * Updated: 2025-01-11 - 5탭에서 3탭으로 변경 (사용성 개선)
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { KPIDiagnosisProvider, useKPIDiagnosis } from '../../contexts/KPIDiagnosisContext';
import ErrorBoundary from '../../components/ErrorBoundary';
import { 
  FileText, 
  ChartBar, 
  Rocket,
  CheckCircle 
} from 'lucide-react';

// Tab panels
import AssessmentPanel from './kpi-tabs/AssessmentPanel';
import ResultsInsightsPanel from './kpi-tabs/ResultsInsightsPanel';
import ActionPlanPanel from './kpi-tabs/ActionPlanPanel';

type TabType = 'assess' | 'insights' | 'action';

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
        return <ResultsInsightsPanel />;
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