import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { CSVKPICard } from '../../components/common/CSVKPICard';
import { ProgressBar, Spinner } from '../../components/common/Progress';
import { StageSelector } from '../../components/common/StageSelector';
import { useCluster } from '../../contexts/ClusterContext';
import { axes } from '../../data/mockKPIs';
import { loadKPIData, clearKPICache } from '../../data/kpiLoader';
import { Activity, CheckCircle2, AlertCircle, ArrowRight, RotateCcw, AlertTriangle } from 'lucide-react';
import { getAxisTextColor, getAxisBorderColor, getAxisLightBgColor, getAxisBgColor } from '../../utils/axisColors';
import { assessmentStorage } from '../../utils/storage';
import { calculateNormalizedScore, calculateAxisScore } from '../../utils/scoring';
import { calculateAxisScore as calculateCSVAxisScore } from '../../utils/csvScoring';
import { crossValidate } from '../../utils/validation';
import { CompletenessModal } from '../../components/common/CompletenessModal';
import { setupCSVWatcher } from '../../utils/csvWatcher';
import type { KPIResponse, RawValue, AxisKey, KPIDefinition } from '../../types';

const Assessments = () => {
  const navigate = useNavigate();
  const { cluster } = useCluster();
  const [activeTab, setActiveTab] = useState<AxisKey>('GO');
  const [responses, setResponses] = useState<Record<string, KPIResponse>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [showCompletenessModal, setShowCompletenessModal] = useState(false);
  const [crossValidationErrors, setCrossValidationErrors] = useState<string[]>([]);
  
  // CSV 데이터 상태
  const [kpiData, setKpiData] = useState<{libraries: KPIDefinition[], stageRules: any, inputFields: any} | null>(null);
  const [isLoadingKPI, setIsLoadingKPI] = useState(true);
  
  // 점수 상태
  const [axisScores, setAxisScores] = useState<Record<AxisKey, number>>({
    GO: 0, EC: 0, PT: 0, PF: 0, TO: 0
  });
  const [isCalculatingScores, setIsCalculatingScores] = useState(false);

  // CSV 데이터에서 KPI 필터링 함수
  const getKPIsByAxis = (axis: AxisKey): KPIDefinition[] => {
    if (!kpiData) return [];
    
    // 해당 축과 사용자 단계에 적용되는 KPI만 필터링
    const filteredKPIs = kpiData.libraries.filter(kpi => 
      kpi.axis === axis && 
      kpi.applicable_stages?.includes(cluster.stage)
    );
    
    // 디버깅용 로그 (개발 환경에서만)
    if (import.meta.env.DEV) {
      console.log(`Filtering KPIs for axis: ${axis}, stage: ${cluster.stage}`, {
        totalKPIs: kpiData.libraries.filter(k => k.axis === axis).length,
        applicableKPIs: filteredKPIs.length,
        kpiIds: filteredKPIs.map(k => k.kpi_id)
      });
    }
    
    return filteredKPIs;
  };

  // KPI 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        // 개발 환경에서는 캐시 클리어 후 리로드
        if (import.meta.env.DEV) {
          clearKPICache();
        }
        
        const data = await loadKPIData();
        setKpiData(data);
        console.log('KPI data loaded:', {
          totalKPIs: data.libraries.length,
          stageRules: data.stageRules.size,
          inputFields: data.inputFields.size,
          currentStage: cluster.stage,
          applicableKPIs: data.libraries.filter(k => k.applicable_stages?.includes(cluster.stage)).length
        });
      } catch (error) {
        console.error('Failed to load KPI data:', error);
      } finally {
        setIsLoadingKPI(false);
      }
    };
    
    loadData();
    
    // CSV 파일 변경 감시 설정
    setupCSVWatcher();
    
    // CSV 업데이트 이벤트 리스너
    const handleCSVUpdate = () => {
      console.log('CSV updated, reloading KPIs...');
      loadData();
    };
    
    window.addEventListener('csv-updated', handleCSVUpdate);
    
    return () => {
      window.removeEventListener('csv-updated', handleCSVUpdate);
    };
  }, []);

  // 컴포넌트 마운트시 임시 저장 데이터 확인
  useEffect(() => {
    if (!isLoadingKPI) {
      const draft = assessmentStorage.loadDraft();
      if (draft && Object.keys(draft.responses).length > 0) {
        setShowRestorePrompt(true);
      }
    }
  }, [isLoadingKPI]);

  // 점수 계산 - 응답이 변경될 때마다
  useEffect(() => {
    const calculateScores = async () => {
      if (!kpiData || Object.keys(responses).length === 0) return;
      
      setIsCalculatingScores(true);
      try {
        const newScores: Record<AxisKey, number> = { GO: 0, EC: 0, PT: 0, PF: 0, TO: 0 };
        
        for (const axis of ['GO', 'EC', 'PT', 'PF', 'TO'] as AxisKey[]) {
          newScores[axis] = await calculateCSVAxisScore(responses, axis, cluster.stage);
        }
        
        setAxisScores(newScores);
      } catch (error) {
        console.error('Error calculating scores:', error);
      } finally {
        setIsCalculatingScores(false);
      }
    };
    
    calculateScores();
  }, [responses, kpiData, cluster.stage]);

  // 단계 변경 시 적용되지 않는 KPI 응답 정리
  useEffect(() => {
    if (!kpiData || Object.keys(responses).length === 0) return;
    
    const validKPIIds = kpiData.libraries
      .filter(kpi => kpi.applicable_stages?.includes(cluster.stage))
      .map(kpi => kpi.kpi_id);
      
    const invalidResponseIds = Object.keys(responses).filter(id => !validKPIIds.includes(id));
    
    if (invalidResponseIds.length > 0) {
      console.log(`Stage changed to ${cluster.stage}, removing ${invalidResponseIds.length} invalid responses:`, invalidResponseIds);
      
      const updatedResponses = { ...responses };
      invalidResponseIds.forEach(id => delete updatedResponses[id]);
      setResponses(updatedResponses);
    }
  }, [cluster.stage, kpiData]);

  // 자동 저장 - 3초마다
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(responses).length > 0) {
        handleAutoSave();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [responses]);

  // 임시 저장 복원
  const handleRestore = () => {
    const draft = assessmentStorage.loadDraft();
    if (draft) {
      setResponses(draft.responses);
      setLastSaved(new Date(draft.lastUpdated));
      setShowRestorePrompt(false);
    }
  };

  // 새로 시작
  const handleStartFresh = () => {
    assessmentStorage.clearDraft();
    setShowRestorePrompt(false);
  };

  // 응답 처리
  const handleResponseChange = (kpiId: string, value: RawValue, status: 'valid' | 'invalid' | 'na') => {
    const newResponses = {
      ...responses,
      [kpiId]: {
        run_id: 'current',
        kpi_id: kpiId,
        raw: value,
        status,
        normalized_score: status === 'valid' ? calculateNormalizedScore(kpiId, value) : 0
      }
    };
    
    setResponses(newResponses);
    
    // 교차 검증 실행
    const crossValidation = crossValidate(newResponses);
    setCrossValidationErrors(crossValidation.errors);
  };


  // 자동 저장
  const handleAutoSave = async () => {
    setIsSaving(true);
    // localStorage에 임시 저장
    const saved = assessmentStorage.saveDraft(responses);
    if (saved) {
      setLastSaved(new Date());
    }
    // 실제로는 API 호출도 포함
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsSaving(false);
  };

  // 진행률 계산
  const calculateProgress = () => {
    const totalKPIs = kpiData ? kpiData.libraries.filter(kpi => 
      kpi.applicable_stages?.includes(cluster.stage)
    ).length : 0;
    return assessmentStorage.calculateProgress(responses, totalKPIs);
  };

  // 축별 진행률
  const calculateAxisProgress = (axis: AxisKey) => {
    const axisKPIs = getKPIsByAxis(axis);
    const axisResponses = axisKPIs.filter(kpi => 
      responses[kpi.kpi_id] && responses[kpi.kpi_id].status !== 'invalid'
    );
    return {
      total: axisKPIs.length,
      completed: axisResponses.length,
      percentage: axisKPIs.length > 0 ? (axisResponses.length / axisKPIs.length) * 100 : 0
    };
  };

  const progress = calculateProgress();
  const currentAxisKPIs = getKPIsByAxis(activeTab);
  const currentAxisScore = axisScores[activeTab];
  
  // 완성도 체크
  const handleCompletionCheck = () => {
    setShowCompletenessModal(true);
  };
  
  // 모든 축 진행률 계산
  const getAllAxisProgress = () => {
    const allProgress: Record<AxisKey, any> = {} as any;
    axes.forEach(axis => {
      const axisKey = axis.key as AxisKey;
      allProgress[axisKey] = calculateAxisProgress(axisKey);
    });
    return allProgress;
  };
  
  // 미완료 KPI 목록
  const getMissingKPIs = () => {
    if (!kpiData) return [];
    return kpiData.libraries
      .filter(kpi => 
        kpi.applicable_stages?.includes(cluster.stage) &&
        (!responses[kpi.kpi_id] || responses[kpi.kpi_id].status === 'invalid')
      )
      .map(kpi => ({
        kpiId: kpi.kpi_id,
        title: kpi.title,
        axis: kpi.axis
      }));
  };

  // 로딩 상태 처리
  if (isLoadingKPI) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Spinner size="large" />
            <p className="mt-4 text-neutral-gray">KPI 데이터를 로드하고 있습니다...</p>
          </div>
        </div>
      </div>
    );
  }

  // KPI 데이터 로드 실패
  if (!kpiData) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="mx-auto text-accent-red mb-4" size={48} />
            <h3 className="text-lg font-semibold text-neutral-dark mb-2">KPI 데이터를 불러올 수 없습니다</h3>
            <p className="text-neutral-gray mb-4">잠시 후 다시 시도해주세요.</p>
            <Button onClick={() => window.location.reload()}>
              새로고침
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* 배경 그라데이션 효과 */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-light/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-light/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-orange/10 rounded-full blur-3xl animate-pulse-soft" />
      </div>
      
    <div className="p-8 max-w-7xl mx-auto relative z-0">
      {/* 임시 저장 복원 프롬프트 */}
      {showRestorePrompt && (
        <Card className="mb-6 border-accent-orange">
          <CardBody className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-accent-orange-light p-3 rounded-full">
                <RotateCcw className="text-accent-orange" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-dark mb-1">이전 평가를 이어서 진행하시겠습니까?</h3>
                <p className="text-sm text-neutral-gray mb-4">임시 저장된 평가 데이터가 있습니다.</p>
                <div className="flex gap-3">
                  <Button size="small" onClick={handleRestore}>
                    이어서 진행
                  </Button>
                  <Button size="small" variant="ghost" onClick={handleStartFresh}>
                    새로 시작
                  </Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-dark">KPI 평가 입력</h1>
            <p className="text-neutral-gray mt-2">
              각 축별로 KPI를 입력하여 평가를 완성하세요 
              <span className="ml-2 px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                {cluster.stage} 단계 · {kpiData?.libraries.filter(k => k.applicable_stages?.includes(cluster.stage)).length || 0}개 KPI
              </span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            {import.meta.env.DEV && (
              <Button 
                variant="ghost"
                size="small"
                onClick={async () => {
                  clearKPICache();
                  const data = await loadKPIData();
                  setKpiData(data);
                  console.log('CSV 데이터 새로고침 완료');
                }}
                title="CSV 데이터 새로고침"
              >
                <RotateCcw size={16} />
              </Button>
            )}
            {isSaving ? (
              <div className="flex items-center gap-2 text-neutral-gray">
                <Spinner size="small" />
                <span className="text-sm">저장 중...</span>
              </div>
            ) : lastSaved && (
              <div className="flex items-center gap-2 text-neutral-gray">
                <CheckCircle2 size={16} className="text-secondary-main" />
                <span className="text-sm">
                  {lastSaved.toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}에 저장됨
                </span>
              </div>
            )}
            <Button 
              variant="secondary"
              onClick={handleCompletionCheck}
            >
              결과 보기
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
        
        {/* 단계 선택기 추가 */}
        <div className="mb-6">
          <StageSelector 
            compact={true}
            onStageChange={() => {
              // 단계 변경 시는 useEffect에서 자동으로 처리됨
              // 여기서는 UI 상태만 리셋
              setLastSaved(null);
            }}
          />
        </div>

        {/* 전체 진행률 및 점수 요약 */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardBody className="p-6">
              <ProgressBar
                value={progress.completed}
                max={progress.total}
                label="전체 진행률"
                showValue
                variant="default"
                size="large"
              />
              <div className="mt-2 text-sm text-neutral-gray">
                {progress.total}개 중 {progress.completed}개 완료
              </div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="p-6">
              <h3 className="text-sm font-medium text-neutral-gray mb-4">축별 현재 점수</h3>
              <div className="grid grid-cols-5 gap-2">
                {axes.map(axis => {
                  const axisKey = axis.key as AxisKey;
                  const score = axisScores[axisKey];
                  const hasData = getKPIsByAxis(axisKey).some(kpi => responses[kpi.kpi_id]);
                  return (
                    <div key={axis.key} className="text-center">
                      <div className={`text-xs font-semibold mb-1 ${getAxisTextColor(axis.key)}`}>
                        {axis.key}
                      </div>
                      <div className="text-lg font-bold text-neutral-dark">
                        {isCalculatingScores ? (
                          <Spinner size="small" />
                        ) : hasData ? (
                          Math.round(score)
                        ) : (
                          '-'
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* 축별 탭 */}
      <div className="mb-6">
        <div className="border-b border-neutral-border">
          <div className="flex gap-1">
            {axes.map(axis => {
              const axisProgress = calculateAxisProgress(axis.key as AxisKey);
              return (
                <button
                  key={axis.key}
                  onClick={() => setActiveTab(axis.key as AxisKey)}
                  className={`
                    px-6 py-4 font-medium text-sm transition-all duration-200
                    border-b-2 relative
                    ${activeTab === axis.key 
                      ? `${getAxisTextColor(axis.key)} ${getAxisBorderColor(axis.key)} ${getAxisLightBgColor(axis.key)}` 
                      : 'text-neutral-gray border-transparent hover:text-neutral-dark hover:bg-neutral-light'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span>{axis.key}</span>
                    <span className="text-xs opacity-70">{axis.name}</span>
                    <span className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded-full">
                      {getKPIsByAxis(axis.key as AxisKey).length}개
                    </span>
                    {axisProgress.percentage === 100 ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-secondary-main" />
                        <span className="text-xs font-semibold">{Math.round(calculateAxisScore(responses, axis.key as AxisKey))}점</span>
                      </div>
                    ) : axisProgress.percentage > 0 ? (
                      <div className="flex items-center gap-1">
                        <Activity size={16} />
                        <span className="text-xs">{axisProgress.completed}/{axisProgress.total}</span>
                      </div>
                    ) : null}
                  </div>
                  {axisProgress.percentage > 0 && axisProgress.percentage < 100 && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-border">
                      <div 
                        className={`h-full ${getAxisBgColor(axis.key)} transition-all duration-300`}
                        style={{ width: `${axisProgress.percentage}%` }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 교차 검증 오류 */}
      {crossValidationErrors.length > 0 && (
        <Card className="mb-6 border-accent-orange">
          <CardBody className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-accent-orange flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-medium text-neutral-dark mb-2">교차 검증 오류</h3>
                <div className="space-y-1">
                  {crossValidationErrors.map((error, idx) => (
                    <p key={idx} className="text-sm text-neutral-gray">{error}</p>
                  ))}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* 현재 축 정보 */}
      <Card className="mb-6">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-2 h-12 rounded-full ${getAxisBgColor(activeTab)}`} />
              <div>
                <h2 className="text-lg font-semibold text-neutral-dark">
                  {axes.find(a => a.key === activeTab)?.name}
                </h2>
                <p className="text-sm text-neutral-gray">
                  {axes.find(a => a.key === activeTab)?.description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-neutral-dark">{Math.round(currentAxisScore)}점</div>
              <div className="text-xs text-neutral-gray">
                {calculateAxisProgress(activeTab).completed}/{calculateAxisProgress(activeTab).total} 완료
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* KPI 카드 목록 - 2열 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {currentAxisKPIs.length > 0 ? (
          currentAxisKPIs.map(kpi => {
            // 해당 KPI의 현재 단계 규칙 가져오기
            const stageRule = kpiData?.stageRules.get(kpi.kpi_id)?.get(cluster.stage);
            
            return (
              <CSVKPICard
                key={kpi.kpi_id}
                kpi={kpi}
                stageRule={stageRule}
                response={responses[kpi.kpi_id]}
                onChange={handleResponseChange}
                userStage={cluster.stage}
              />
            );
          })
        ) : (
          <Card>
            <CardBody className="p-12 text-center">
              <AlertCircle size={48} className="mx-auto text-neutral-lighter mb-4" />
              <h3 className="text-lg font-medium text-neutral-dark mb-2">
                {cluster.stage} 단계에서 {activeTab} 축 KPI가 없습니다
              </h3>
              <p className="text-neutral-gray mb-4">
                현재 성장 단계({cluster.stage})에서는 이 축에 해당하는 KPI가 정의되지 않았습니다.
              </p>
              <div className="text-sm text-neutral-lighter">
                다른 성장 단계로 변경하거나 다른 축을 확인해보세요.
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* 하단 네비게이션 */}
      <div className="mt-8 flex justify-between">
        <Button
          variant="ghost"
          onClick={() => {
            const currentIndex = axes.findIndex(a => a.key === activeTab);
            if (currentIndex > 0) {
              setActiveTab(axes[currentIndex - 1].key as AxisKey);
            }
          }}
          disabled={axes.findIndex(a => a.key === activeTab) === 0}
        >
          이전 축
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            const currentIndex = axes.findIndex(a => a.key === activeTab);
            if (currentIndex < axes.length - 1) {
              setActiveTab(axes[currentIndex + 1].key as AxisKey);
            } else {
              navigate('/startup/results');
            }
          }}
        >
          {axes.findIndex(a => a.key === activeTab) === axes.length - 1 ? '평가 완료' : '다음 축'}
        </Button>
      </div>
      
      {/* 완성도 체크 모달 */}
      <CompletenessModal
        isOpen={showCompletenessModal}
        onClose={() => setShowCompletenessModal(false)}
        onProceed={() => navigate('/startup/results')}
        axisProgress={getAllAxisProgress()}
        missingKPIs={getMissingKPIs()}
      />
    </div>
    </div>
  );
};

export default Assessments;