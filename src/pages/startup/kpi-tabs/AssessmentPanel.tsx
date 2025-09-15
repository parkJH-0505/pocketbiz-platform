/**
 * 진단하기 탭 패널
 * 기존 Assessments.tsx 컴포넌트 통합
 */

import { useState, useEffect } from 'react';
import { CSVKPICard } from '../../../components/common/CSVKPICard';
import { ProgressBar } from '../../../components/common/Progress';
import { useCluster } from '../../../contexts/ClusterContext';
import { useKPIDiagnosis } from '../../../contexts/KPIDiagnosisContext';
import { useUserProfile } from '../../../contexts/UserProfileContext';
import { clearKPICache } from '../../../data/kpiLoader';
import { 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  RefreshCw,
  ChevronRight,
  Lock,
  ChevronDown,
  ArrowRight,
  X,
  CircleAlert,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { crossValidate } from '../../../utils/validation';
import { setupCSVWatcher } from '../../../utils/csvWatcher';
import type { AxisKey, KPIDefinition } from '../../../types';
import { FloatingProgressButton } from '../../../components/assessment/FloatingProgressButton';

export const AssessmentPanel = () => {
  const { cluster, updateStage, getStageInfo } = useCluster();
  const { updateCluster } = useUserProfile();
  const { 
    responses, 
    updateResponse,
    kpiData,
    isLoadingKPI,
    axisScores,
    progress,
    saveResponses,
    lastSaved,
    refreshData
  } = useKPIDiagnosis();
  
  const [currentAxis, setCurrentAxis] = useState<AxisKey>('GO');
  const [isSaving, setIsSaving] = useState(false);
  const [crossValidationErrors, setCrossValidationErrors] = useState<string[]>([]);
  const [showStageDropdown, setShowStageDropdown] = useState(false);
  const [showResetDropdown, setShowResetDropdown] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState<'current' | 'all' | null>(null);

  const axes = [
    { key: 'GO', label: 'Growth & Ops', color: 'purple', bgClass: 'bg-purple-500', description: '성장·운영' },
    { key: 'EC', label: 'Economics', color: 'green', bgClass: 'bg-green-500', description: '경제성·자본' },
    { key: 'PT', label: 'Product & Tech', color: 'orange', bgClass: 'bg-orange-500', description: '제품·기술력' },
    { key: 'PF', label: 'Proof', color: 'blue', bgClass: 'bg-blue-500', description: '증빙·딜레디' },
    { key: 'TO', label: 'Team & Org', color: 'red', bgClass: 'bg-red-500', description: '팀·조직 역량' }
  ];

  // CSV 데이터에서 KPI 필터링
  const getKPIsByAxis = (axis: AxisKey): KPIDefinition[] => {
    if (!kpiData) {
      console.log('kpiData is not loaded yet');
      return [];
    }
    
    console.log(`\n=== Getting KPIs for axis ${axis}, stage ${cluster.stage} ===`);
    console.log(`Total KPIs in library: ${kpiData.libraries.length}`);
    
    const filteredKPIs = kpiData.libraries.filter(kpi => {
      const isAxisMatch = kpi.axis === axis;
      const hasStages = kpi.applicable_stages && kpi.applicable_stages.length > 0;
      const isStageMatch = kpi.applicable_stages?.includes(cluster.stage);
      
      // 디버깅: 모든 GO axis KPI 확인
      if (axis === 'GO' && kpi.axis === 'GO') {
        console.log(`KPI ${kpi.kpi_id}:`, {
          axis: kpi.axis,
          applicable_stages: kpi.applicable_stages,
          currentStage: cluster.stage,
          isStageMatch,
          willInclude: isAxisMatch && isStageMatch
        });
      }
      
      return isAxisMatch && isStageMatch;
    });
    
    console.log(`✅ Found ${filteredKPIs.length} KPIs for ${axis} at stage ${cluster.stage}`);
    if (filteredKPIs.length > 0) {
      console.log('Filtered KPIs:', filteredKPIs.map(k => k.kpi_id));
    }
    return filteredKPIs;
  };
  
  // 현재 축의 진행률 계산
  const calculateCurrentAxisProgress = () => {
    const currentAxisKPIs = getKPIsByAxis(currentAxis);
    if (currentAxisKPIs.length === 0) return 0;
    
    const completedCount = currentAxisKPIs.filter(kpi => {
      const response = responses[kpi.kpi_id];
      return response && (response.status === 'valid' || response.status === 'na');
    }).length;
    
    return Math.round((completedCount / currentAxisKPIs.length) * 100);
  };
  
  const currentAxisProgress = calculateCurrentAxisProgress();
  const currentAxisInfo = axes.find(a => a.key === currentAxis);
  const isLastAxis = currentAxis === 'TO';
  const isFirstAxis = currentAxis === 'GO';

  // CSV watcher setup
  useEffect(() => {
    if (import.meta.env.DEV) {
      clearKPICache();
    }
    
    setupCSVWatcher();
    
    const handleCSVUpdate = () => {
      console.log('CSV updated, reloading KPIs...');
      refreshData();
    };
    
    window.addEventListener('csv-updated', handleCSVUpdate);
    
    return () => {
      window.removeEventListener('csv-updated', handleCSVUpdate);
    };
  }, []);

  // Handle previousAxis event from StartupLayout
  useEffect(() => {
    const handlePreviousAxis = () => {
      const prevIndex = axes.findIndex(a => a.key === currentAxis) - 1;
      if (prevIndex >= 0) {
        setCurrentAxis(axes[prevIndex].key as AxisKey);
      }
    };
    
    window.addEventListener('previousAxis', handlePreviousAxis);
    return () => window.removeEventListener('previousAxis', handlePreviousAxis);
  }, [currentAxis]);


  const currentKPIs = getKPIsByAxis(currentAxis);

  // 전체 KPI 개수 및 완료 수 계산
  const totalKPIs = axes.reduce((sum, axis) => {
    return sum + getKPIsByAxis(axis.key as AxisKey).length;
  }, 0);
  
  const completedKPIs = axes.reduce((sum, axis) => {
    const axisKPIs = getKPIsByAxis(axis.key as AxisKey);
    return sum + axisKPIs.filter(kpi => responses[kpi.kpi_id]).length;
  }, 0);
  
  const overallPercentage = totalKPIs > 0 ? Math.round((completedKPIs / totalKPIs) * 100) : 0;
  
  // 실시간 진행률 계산을 위한 로그
  useEffect(() => {
    console.log('AssessmentPanel - Responses updated:', Object.keys(responses).length, 'responses');
    console.log('AssessmentPanel - Progress:', progress);
    console.log('AssessmentPanel - Axis Scores:', axisScores);
    console.log('AssessmentPanel - Completed/Total:', completedKPIs, '/', totalKPIs, '=', overallPercentage, '%');
  }, [responses, progress, axisScores, completedKPIs, totalKPIs, overallPercentage]);

  if (isLoadingKPI) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-primary-main" size={32} />
      </div>
    );
  }

  const getSectorName = (sector: string) => {
    const sectorMap: Record<string, string> = {
      'S-1': 'B2B SaaS',
      'S-2': 'B2C 플랫폼',
      'S-3': '이커머스',
      'S-4': '핀테크',
      'S-5': '헬스케어'
    };
    return sectorMap[sector] || sector;
  };

  const getStageName = (stage: string) => {
    const stageMap: Record<string, string> = {
      'A-1': '아이디어',
      'A-2': '창업초기',
      'A-3': 'PMF 검증',
      'A-4': 'Pre-A',
      'A-5': 'Series A+'
    };
    return stageMap[stage] || stage;
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'A-1': 'bg-gray-100 text-gray-700',
      'A-2': 'bg-blue-100 text-blue-700',
      'A-3': 'bg-purple-100 text-purple-700',
      'A-4': 'bg-orange-100 text-orange-700',
      'A-5': 'bg-green-100 text-green-700'
    };
    return colors[stage] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="relative">
      <div className="space-y-6">
      {/* 헤더 섹션 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-dark">KPI 평가 입력</h1>
            <p className="text-neutral-gray mt-2">
              각 축별로 KPI를 입력하여 평가를 완성하세요
              <span className="ml-2 px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                {getStageName(cluster.stage)} 단계 · {totalKPIs}개 KPI
              </span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* 초기화 드롭다운 */}
            <div className="relative">
              <button
                onClick={() => setShowResetDropdown(!showResetDropdown)}
                onBlur={() => setTimeout(() => setShowResetDropdown(false), 200)}
                className="bg-white text-error-main border border-error-light
                  hover:bg-error-light hover:border-error-main
                  px-4 py-2 text-sm inline-flex items-center justify-center gap-2
                  font-medium rounded-default transition-all duration-150"
              >
                <RotateCcw size={16} />
                초기화
                <ChevronDown size={14} className={`transition-transform ${showResetDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showResetDropdown && (
                <div className="absolute top-full right-0 mt-1 w-48 rounded-lg shadow-lg border z-50" 
                     style={{ backgroundColor: 'white', borderColor: '#e5e5e5' }}>
                  <div
                    onClick={() => {
                      setShowResetConfirm('current');
                      setShowResetDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm transition-colors cursor-pointer flex items-center gap-2"
                    style={{ color: '#333333', backgroundColor: 'white' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fee2e2';
                      e.currentTarget.style.color = '#dc2626';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = '#333333';
                    }}
                  >
                    <RotateCcw size={16} style={{ color: 'currentColor' }} />
                    <span style={{ color: 'inherit' }}>현재 축 초기화</span>
                    <span className="ml-auto text-xs" style={{ color: '#666666' }}>{currentAxis}</span>
                  </div>
                  <div
                    onClick={() => {
                      setShowResetConfirm('all');
                      setShowResetDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm transition-colors cursor-pointer flex items-center gap-2"
                    style={{ color: '#333333', backgroundColor: 'white', borderTop: '1px solid #e5e5e5' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fee2e2';
                      e.currentTarget.style.color = '#dc2626';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = '#333333';
                    }}
                  >
                    <Trash2 size={16} style={{ color: 'currentColor' }} />
                    <span style={{ color: 'inherit' }}>전체 초기화</span>
                    <span className="ml-auto text-xs" style={{ color: '#666666' }}>모든 축</span>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => {
                const searchParams = new URLSearchParams(window.location.search);
                searchParams.set('tab', 'insights');
                window.history.pushState({}, '', `${window.location.pathname}?${searchParams}`);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="bg-white text-neutral-dark border border-neutral-border
                hover:bg-neutral-light hover:border-neutral-gray
                px-4 py-2 text-sm inline-flex items-center justify-center gap-2
                font-medium rounded-default transition-all duration-150"
            >
              결과 보기
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* 섹터 & 단계 정보 */}
        <div className="mb-6">
          <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-neutral-border">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-gray">섹터:</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-neutral-dark">{getSectorName(cluster.sector)}</span>
                <Lock size={14} className="text-neutral-lighter" />
              </div>
            </div>
            <div className="h-4 w-px bg-neutral-border"></div>
            <div className="relative">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-gray">단계:</span>
                <button 
                  onClick={() => setShowStageDropdown(!showStageDropdown)}
                  className="flex items-center gap-1 px-3 py-1 rounded-md hover:bg-neutral-light transition-colors cursor-pointer"
                >
                  <span className={`px-2 py-0.5 rounded text-sm font-semibold ${getStageColor(cluster.stage)}`}>
                    {getStageName(cluster.stage)}
                  </span>
                  <ChevronDown size={16} className={`text-neutral-gray transition-transform ${showStageDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>
              
              {/* 단계 선택 드롭다운 */}
              {showStageDropdown && (
                <div className="absolute top-full mt-2 left-0 w-64 bg-white rounded-lg shadow-lg border border-neutral-border z-50">
                  <div className="p-2">
                    {(['A-1', 'A-2', 'A-3', 'A-4', 'A-5'] as const).map((stage) => {
                      const stageInfo = getStageInfo(stage);
                      const isCurrentStage = cluster.stage === stage;
                      const stageKPICount = axes.reduce((sum, axis) => {
                        return sum + (kpiData?.libraries.filter(kpi => 
                          kpi.axis === axis.key && kpi.applicable_stages?.includes(stage)
                        ).length || 0);
                      }, 0);

                      return (
                        <button
                          key={stage}
                          onClick={() => {
                            if (!isCurrentStage) {
                              updateStage(stage);
                              updateCluster(stage, cluster.sector); // UserProfile에도 반영
                              setShowStageDropdown(false);
                              refreshData();
                            }
                          }}
                          disabled={isCurrentStage}
                          className={`w-full text-left p-3 rounded-md transition-all mb-1 ${
                            isCurrentStage 
                              ? 'bg-primary-light bg-opacity-20 cursor-default'
                              : 'hover:bg-neutral-light'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${getStageColor(stage)}`}>
                                {stage}
                              </span>
                              <span className="text-sm font-medium text-neutral-dark">
                                {getStageName(stage)}
                              </span>
                            </div>
                            {isCurrentStage && (
                              <CheckCircle2 className="text-primary-main" size={14} />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-neutral-gray mt-1">
                            <span>KPI {stageKPICount}개</span>
                            <span>•</span>
                            <span>{stageInfo.typicalDuration}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 진행률 & 점수 요약 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-border p-6">
            <div className="text-neutral-dark">
              <div className="w-full">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-neutral-dark">전체 진행률</span>
                  <span className="text-sm text-neutral-gray">{overallPercentage}%</span>
                </div>
                <ProgressBar value={overallPercentage} />
              </div>
              <div className="mt-2 text-sm text-neutral-gray">
                {totalKPIs}개 중 {completedKPIs}개 완료
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-neutral-border p-6">
            <div className="text-neutral-dark">
              <h3 className="text-sm font-medium text-neutral-gray mb-4">축별 현재 점수</h3>
              <div className="grid grid-cols-5 gap-2">
                {axes.map((axis) => {
                  const score = axisScores[axis.key as AxisKey];
                  return (
                    <div key={axis.key} className="text-center">
                      <div className={`text-xs font-semibold mb-1 text-${axis.color}-600`}>
                        {axis.label}
                      </div>
                      <div className="text-lg font-bold text-neutral-dark">
                        {score > 0 ? Math.round(score) : '-'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Cross Validation Errors */}
      {crossValidationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">검증 오류</p>
              <ul className="mt-2 space-y-1">
                {crossValidationErrors.map((error, index) => (
                  <li key={index} className="text-xs text-red-700">• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Axis Sub-tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-neutral-border">
          <div className="flex space-x-1 p-2">
            {axes.map((axis) => {
              const axisKPIs = getKPIsByAxis(axis.key as AxisKey);
              const axisCompleted = axisKPIs.filter(kpi => responses[kpi.kpi_id]).length;
              
              return (
                <button
                  key={axis.key}
                  onClick={() => setCurrentAxis(axis.key as AxisKey)}
                  className={`
                    flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${currentAxis === axis.key 
                      ? 'bg-neutral-dark text-white' 
                      : 'text-neutral-gray hover:bg-neutral-light'
                    }
                  `}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${axis.bgClass}`} />
                    <span>{axis.label}</span>
                    {axisCompleted === axisKPIs.length && axisKPIs.length > 0 && (
                      <CheckCircle2 size={14} className="text-success-main" />
                    )}
                  </div>
                  <div className="text-xs mt-1 opacity-75">
                    {axis.description} ({axisCompleted}/{axisKPIs.length})
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="p-6">
          {currentKPIs.length === 0 ? (
            <div className="text-center py-8 text-neutral-gray">
              <p>현재 단계({cluster.stage})에 해당하는 KPI가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentKPIs.map((kpi) => {
                const stageRule = kpiData?.stageRules.get(kpi.kpi_id)?.get(cluster.stage);
                console.log(`StageRule for ${kpi.kpi_id} at ${cluster.stage}:`, stageRule);
                
                return (
                  <CSVKPICard
                    key={kpi.kpi_id}
                    kpi={kpi}
                    stageRule={stageRule}
                    response={responses[kpi.kpi_id]}
                    onChange={(kpiId, value, status) => {
                      console.log('KPI Value changed:', kpiId, value, status);
                      updateResponse(kpiId, {
                        run_id: 'current',
                        kpi_id: kpiId,
                        raw: value,
                        status: status,
                        timestamp: new Date().toISOString()
                      });
                    }}
                    userStage={cluster.stage}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button 
          onClick={() => {
            saveResponses();
            setIsSaving(true);
            setTimeout(() => setIsSaving(false), 1000);
          }}
          className="flex items-center gap-2 px-4 py-2 text-neutral-gray hover:text-neutral-dark transition-colors"
        >
          <Save size={18} />
          {isSaving ? '저장 중...' : '임시 저장'}
        </button>
        
        <div className="flex gap-3">
          {axes.findIndex(a => a.key === currentAxis) < axes.length - 1 ? (
            <button 
              onClick={() => {
                const nextIndex = axes.findIndex(a => a.key === currentAxis) + 1;
                setCurrentAxis(axes[nextIndex].key as AxisKey);
              }}
              className="flex items-center gap-2 px-6 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              다음 축으로
              <ChevronRight size={18} />
            </button>
          ) : (
            <button 
              onClick={() => {
                // 결과 탭으로 이동
                const searchParams = new URLSearchParams(window.location.search);
                searchParams.set('tab', 'insights');
                window.history.pushState({}, '', `${window.location.pathname}?${searchParams}`);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              결과 보기
              <CheckCircle2 size={18} />
            </button>
          )}
        </div>
      </div>

      </div>
      
      {/* 초기화 확인 모달 */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-error-light rounded-full">
                <AlertCircle className="text-error-main" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-dark">
                  {showResetConfirm === 'current' ? '현재 축 초기화' : '전체 초기화'}
                </h3>
                <p className="text-sm text-neutral-gray mt-1">
                  {showResetConfirm === 'current' 
                    ? `${currentAxis} 축의 모든 입력값이 삭제됩니다.`
                    : '모든 축의 입력값이 삭제됩니다.'
                  }
                  이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{ 
                  color: '#333333',
                  backgroundColor: 'white',
                  border: '1px solid #e5e5e5'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (showResetConfirm === 'current') {
                    // 현재 축만 초기화
                    const currentAxisKPIs = getKPIsByAxis(currentAxis);
                    currentAxisKPIs.forEach(kpi => {
                      updateResponse(kpi.kpi_id, undefined, 'unanswered');
                    });
                  } else {
                    // 전체 초기화
                    Object.keys(responses).forEach(kpiId => {
                      updateResponse(kpiId, undefined, 'unanswered');
                    });
                  }
                  setShowResetConfirm(null);
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{ 
                  color: 'white',
                  backgroundColor: '#dc2626'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#b91c1c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }}
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 플로팅 진행률 버튼 */}
      <FloatingProgressButton
        currentAxisProgress={currentAxisProgress}
        isLastAxis={isLastAxis}
        isFirstAxis={isFirstAxis}
        axisName={currentAxisInfo?.label || currentAxis}
        nextAxisName={!isLastAxis ? axes[axes.findIndex(a => a.key === currentAxis) + 1]?.label : undefined}
        prevAxisName={!isFirstAxis ? axes[axes.findIndex(a => a.key === currentAxis) - 1]?.label : undefined}
        onNext={() => {
          if (isLastAxis) {
            // 결과 탭으로 이동
            const searchParams = new URLSearchParams(window.location.search);
            searchParams.set('tab', 'insights');
            window.history.pushState({}, '', `${window.location.pathname}?${searchParams}`);
            window.dispatchEvent(new PopStateEvent('popstate'));
          } else {
            // 다음 축으로 이동
            const nextIndex = axes.findIndex(a => a.key === currentAxis) + 1;
            setCurrentAxis(axes[nextIndex].key as AxisKey);
          }
        }}
        onPrevious={() => {
          // 이전 축 기능 비활성화
        }}
      />
    </div>
  );
};

export default AssessmentPanel;