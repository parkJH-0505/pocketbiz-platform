import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useCluster, getSectorName, getStageName, getStageColor } from '../../contexts/ClusterContext';
import type { StageType } from '../../contexts/ClusterContext';
import { Lock, ChevronDown, Info, Clock, Target, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';

interface StageSelectorProps {
  onStageChange?: (newStage: StageType) => void;
  compact?: boolean;
}

export const StageSelector: React.FC<StageSelectorProps> = ({ 
  onStageChange, 
  compact = false 
}) => {
  const { cluster, updateStage, getStageInfo, getNextStageRequirements } = useCluster();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<StageType>(cluster.stage);
  const [showConfirm, setShowConfirm] = useState(false);

  const stages: StageType[] = ['A-1', 'A-2', 'A-3', 'A-4', 'A-5'];
  
  const handleStageSelect = (stage: StageType) => {
    if (stage !== cluster.stage) {
      setSelectedStage(stage);
      setShowConfirm(true);
    }
  };

  const confirmStageChange = () => {
    updateStage(selectedStage, 'manual');
    onStageChange?.(selectedStage);
    setShowConfirm(false);
    setIsModalOpen(false);
  };

  const cancelStageChange = () => {
    setSelectedStage(cluster.stage);
    setShowConfirm(false);
  };

  const currentStageInfo = getStageInfo(cluster.stage);
  const nextRequirements = getNextStageRequirements();

  // 모달 컴포넌트
  const renderModal = () => {
    if (!isModalOpen) return null;
    
    return ReactDOM.createPortal(
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" 
        style={{ zIndex: 9999 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsModalOpen(false);
          }
        }}
      >
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-neutral-dark">성장 단계 선택</h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-neutral-lighter hover:text-neutral-dark transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {stages.map((stage) => {
              const stageInfo = getStageInfo(stage);
              const isCurrentStage = stage === cluster.stage;
              const isSelected = stage === selectedStage;
              
              return (
                <button
                  key={stage}
                  onClick={() => handleStageSelect(stage)}
                  disabled={isCurrentStage}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    isCurrentStage 
                      ? 'border-primary-main bg-primary-light bg-opacity-10 cursor-default'
                      : isSelected
                      ? 'border-secondary-main bg-secondary-light bg-opacity-10'
                      : 'border-neutral-border hover:border-neutral-gray hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-sm font-bold ${getStageColor(stage)}`}>
                          {stage}
                        </span>
                        <span className="font-semibold text-neutral-dark">{stageInfo.name}</span>
                        {isCurrentStage && (
                          <span className="text-xs px-2 py-0.5 bg-primary-main text-white rounded">
                            현재 단계
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-gray mb-2">{stageInfo.description}</p>
                      <div className="flex items-center gap-4 text-xs text-neutral-lighter">
                        <span>KPI {stageInfo.minKPIs}개</span>
                        <span>•</span>
                        <span>{stageInfo.typicalDuration}</span>
                      </div>
                    </div>
                    {isSelected && !isCurrentStage && (
                      <CheckCircle2 size={20} className="text-secondary-main mt-1" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 확인 다이얼로그 */}
          {showConfirm && (
            <div className="mt-6 p-4 bg-accent-orange-light bg-opacity-10 rounded-lg">
              <div className="flex items-start gap-2 mb-4">
                <AlertCircle size={18} className="text-accent-orange mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-neutral-dark mb-1">
                    단계를 변경하시겠습니까?
                  </p>
                  <p className="text-sm text-neutral-gray">
                    {getStageName(cluster.stage)}에서 {getStageName(selectedStage)}(으)로 변경됩니다.
                    변경 시 해당 단계에 맞는 KPI만 표시됩니다.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={cancelStageChange}>
                  취소
                </Button>
                <Button variant="primary" onClick={confirmStageChange}>
                  변경하기
                </Button>
              </div>
            </div>
          )}

          {!showConfirm && (
            <div className="mt-6 flex justify-end">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                닫기
              </Button>
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  };

  if (compact) {
    return (
      <>
        <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-neutral-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-gray">섹터:</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-neutral-dark">{getSectorName(cluster.sector)}</span>
              <Lock size={14} className="text-neutral-lighter" />
            </div>
          </div>
          
          <div className="h-4 w-px bg-neutral-border" />
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-gray">단계:</span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1 rounded-md hover:bg-neutral-light transition-colors cursor-pointer"
            >
              <span className={`px-2 py-0.5 rounded text-sm font-semibold ${getStageColor(cluster.stage)}`}>
                {getStageName(cluster.stage)}
              </span>
              <ChevronDown size={16} className="text-neutral-gray" />
            </button>
          </div>
        </div>
        {renderModal()}
      </>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-neutral-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-dark">성장 단계 설정</h3>
          <Info size={20} className="text-neutral-lighter cursor-help" />
        </div>

        {/* 섹터 정보 (읽기 전용) */}
        <div className="mb-6">
          <div className="flex items-center justify-between p-4 bg-neutral-light rounded-lg">
            <div>
              <p className="text-sm text-neutral-gray mb-1">섹터</p>
              <p className="text-lg font-semibold text-neutral-dark">
                {cluster.sector}: {getSectorName(cluster.sector)}
              </p>
            </div>
            <Lock size={20} className="text-neutral-lighter" />
          </div>
          <p className="text-xs text-neutral-gray mt-2">
            * 섹터는 온보딩 시 결정되며, 변경이 필요한 경우 관리자에게 문의하세요.
          </p>
        </div>

        {/* 현재 단계 정보 */}
        <div className="mb-6">
          <p className="text-sm font-medium text-neutral-gray mb-2">현재 단계</p>
          <div className="p-4 border border-primary-main bg-primary-light bg-opacity-10 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className={`px-3 py-1.5 rounded-md text-sm font-bold ${getStageColor(cluster.stage)}`}>
                {cluster.stage}: {currentStageInfo.name}
              </span>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-primary-main hover:text-primary-dark transition-colors"
              >
                변경하기
              </button>
            </div>
            <p className="text-sm text-neutral-gray mb-3">{currentStageInfo.description}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-neutral-lighter" />
                <span className="text-neutral-gray">KPI: {currentStageInfo.minKPIs}개</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-neutral-lighter" />
                <span className="text-neutral-gray">{currentStageInfo.typicalDuration}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 다음 단계 요구사항 */}
        {cluster.stage !== 'A-5' && (
          <div className="p-4 bg-accent-blue-light bg-opacity-10 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="text-accent-blue mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-dark mb-2">
                  다음 단계({stages[stages.indexOf(cluster.stage) + 1]}) 진입 조건
                </p>
                <ul className="space-y-1">
                  {nextRequirements.map((req, idx) => (
                    <li key={idx} className="text-sm text-neutral-gray flex items-start gap-1.5">
                      <span className="text-neutral-lighter">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 변경 이력 */}
        {cluster.stageHistory.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-border">
            <p className="text-xs text-neutral-gray">
              마지막 변경: {cluster.lastStageUpdate.toLocaleDateString('ko-KR')}
            </p>
          </div>
        )}
      </div>
      {renderModal()}
    </>
  );
};