import { useState } from 'react';
import { Card, CardHeader, CardBody } from '../common/Card';
import { Button } from '../common/Button';
import { ProgressBar } from '../common/Progress';
import { ChevronDown, ChevronUp, Star, AlertCircle } from 'lucide-react';
import { getAxisColor, getAxisBgColor } from '../../utils/axisColors';
import { getWeightValue } from '../../utils/scoring';
import { mockKPIs } from '../../data/mockKPIs';
import type { AxisKey, KPIResponse } from '../../types';

interface KPIPerformanceProps {
  responses: Record<string, KPIResponse>;
  selectedAxis?: AxisKey;
}

export const KPIPerformance: React.FC<KPIPerformanceProps> = ({
  responses,
  selectedAxis
}) => {
  const [expandedAxis, setExpandedAxis] = useState<AxisKey | null>(selectedAxis || null);
  const [showOnlyLow, setShowOnlyLow] = useState(false);

  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

  // KPI별 성과 데이터 가공
  const getAxisKPIData = (axis: AxisKey) => {
    const axisKPIs = mockKPIs.filter(kpi => kpi.axis === axis);
    
    return axisKPIs.map(kpi => {
      const response = responses[kpi.kpi_id];
      const score = response?.normalized_score || 0;
      const weight = getWeightValue(kpi.weight);
      const contribution = score * weight;
      const status = response?.status || 'na';
      
      return {
        kpi,
        response,
        score,
        weight,
        contribution,
        status,
        isLow: score < 60 && status === 'valid'
      };
    }).sort((a, b) => b.contribution - a.contribution);
  };

  return (
    <Card>
      <CardHeader 
        title="KPI별 상세 성과"
        action={
          <Button
            size="small"
            variant={showOnlyLow ? 'primary' : 'ghost'}
            onClick={() => setShowOnlyLow(!showOnlyLow)}
          >
            <AlertCircle size={16} />
            낮은 점수만
          </Button>
        }
      />
      <CardBody>
        <div className="space-y-4">
          {axes.map(axis => {
            const axisData = getAxisKPIData(axis);
            const displayData = showOnlyLow ? axisData.filter(d => d.isLow) : axisData;
            const isExpanded = expandedAxis === axis;
            
            if (showOnlyLow && displayData.length === 0) return null;
            
            return (
              <div key={axis} className="border border-neutral-border rounded-lg overflow-hidden">
                {/* 축 헤더 */}
                <button
                  className="w-full px-4 py-3 bg-neutral-light hover:bg-neutral-border transition-colors flex items-center justify-between"
                  onClick={() => setExpandedAxis(isExpanded ? null : axis)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-8 rounded-full ${getAxisBgColor(axis)}`} />
                    <span className="font-medium text-neutral-dark">{axis}</span>
                    <span className="text-sm text-neutral-gray">
                      ({displayData.length}개 KPI)
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                
                {/* KPI 목록 */}
                {isExpanded && (
                  <div className="p-4 space-y-3">
                    {displayData.map(({ kpi, score, weight, contribution, status, isLow }) => (
                      <div key={kpi.kpi_id} className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-neutral-dark">
                                {kpi.title}
                              </span>
                              {weight === 3 && (
                                <Star size={14} className="text-accent-orange" fill="currentColor" />
                              )}
                              <span className="text-xs px-1.5 py-0.5 bg-neutral-dark text-white rounded">
                                {kpi.weight}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-gray mt-1">
                              {kpi.kpi_id} • {kpi.question}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-lg font-bold text-neutral-dark">
                              {status === 'na' ? 'N/A' : `${score.toFixed(0)}점`}
                            </div>
                            <p className="text-xs text-neutral-gray">
                              기여도: {contribution.toFixed(0)}
                            </p>
                          </div>
                        </div>
                        
                        {status !== 'na' && (
                          <ProgressBar
                            value={score}
                            max={100}
                            size="small"
                            variant={isLow ? 'error' : score >= 70 ? 'success' : 'warning'}
                          />
                        )}
                        
                        {isLow && (
                          <div className="flex items-center gap-2 text-xs text-accent-red bg-red-50 px-2 py-1 rounded">
                            <AlertCircle size={12} />
                            개선이 필요한 지표입니다
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {displayData.length === 0 && (
                      <p className="text-sm text-neutral-gray text-center py-4">
                        낮은 점수의 KPI가 없습니다
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
};