import { X, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { ProgressBar } from './Progress';
import type { AxisKey } from '../../types';
import { getAxisTextColor, getAxisBgColor } from '../../utils/axisColors';

interface CompletenessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  axisProgress: Record<AxisKey, { completed: number; total: number; percentage: number }>;
  missingKPIs: Array<{ kpiId: string; title: string; axis: AxisKey }>;
}

export const CompletenessModal: React.FC<CompletenessModalProps> = ({
  isOpen,
  onClose,
  onProceed,
  axisProgress,
  missingKPIs
}) => {
  if (!isOpen) return null;

  const totalProgress = calculateTotalProgress(axisProgress);
  const isComplete = totalProgress === 100;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-border">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-dark">
                평가 완성도 확인
              </h2>
              <button
                onClick={onClose}
                className="text-neutral-lighter hover:text-neutral-gray transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            {/* 전체 진행률 */}
            <div className="mb-6">
              <ProgressBar
                value={totalProgress}
                max={100}
                label="전체 완성도"
                showValue
                variant={isComplete ? 'success' : 'default'}
                size="large"
              />
              <p className="text-sm text-neutral-gray mt-2">
                {isComplete 
                  ? '모든 평가가 완료되었습니다!' 
                  : `${missingKPIs.length}개의 항목이 미입력 상태입니다.`}
              </p>
            </div>

            {/* 축별 진행 현황 */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-neutral-gray mb-3">축별 진행 현황</h3>
              <div className="space-y-3">
                {Object.entries(axisProgress).map(([axis, progress]) => (
                  <div key={axis} className="flex items-center gap-4">
                    <span className={`text-sm font-medium w-12 ${getAxisTextColor(axis)}`}>
                      {axis}
                    </span>
                    <div className="flex-1">
                      <ProgressBar
                        value={progress.percentage}
                        max={100}
                        showValue
                        size="small"
                        variant={progress.percentage === 100 ? 'success' : 'default'}
                      />
                    </div>
                    <span className="text-sm text-neutral-gray w-12 text-right">
                      {progress.completed}/{progress.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 미완료 항목 */}
            {!isComplete && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-neutral-gray mb-3">미완료 항목</h3>
                <div className="bg-neutral-light rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="space-y-2">
                    {missingKPIs.map(kpi => (
                      <div key={kpi.kpiId} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getAxisTextColor(kpi.axis)} ${getAxisBgColor(kpi.axis).replace('bg-', 'bg-opacity-20 ')}`}>
                            {kpi.axis}
                          </span>
                          <span className="text-neutral-dark">{kpi.title}</span>
                        </div>
                        <span className="text-xs text-neutral-gray font-mono">{kpi.kpiId}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 안내 메시지 */}
            <div className={`rounded-lg p-4 ${isComplete ? 'bg-green-50' : 'bg-yellow-50'}`}>
              <div className="flex items-start gap-3">
                {isComplete ? (
                  <CheckCircle2 className="text-secondary-main mt-0.5" size={20} />
                ) : (
                  <AlertCircle className="text-accent-orange mt-0.5" size={20} />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isComplete ? 'text-green-800' : 'text-yellow-800'}`}>
                    {isComplete 
                      ? '훌륭합니다! 모든 평가 항목을 완료하셨습니다.'
                      : '일부 평가 항목이 미완료 상태입니다.'}
                  </p>
                  <p className={`text-sm mt-1 ${isComplete ? 'text-green-700' : 'text-yellow-700'}`}>
                    {isComplete 
                      ? '결과 페이지에서 상세한 분석 결과를 확인하실 수 있습니다.'
                      : '미완료 항목이 있어도 결과를 확인할 수 있지만, 정확한 분석을 위해 모든 항목을 입력하시는 것을 권장합니다.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-neutral-border bg-neutral-light">
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={onClose}>
                계속 입력하기
              </Button>
              <Button 
                variant={isComplete ? 'primary' : 'secondary'} 
                onClick={onProceed}
              >
                결과 확인하기
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function calculateTotalProgress(axisProgress: Record<AxisKey, { percentage: number }>): number {
  const values = Object.values(axisProgress);
  const total = values.reduce((sum, progress) => sum + progress.percentage, 0);
  return Math.round(total / values.length);
}