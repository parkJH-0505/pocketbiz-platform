import { useState, useEffect } from 'react';
import { 
  Sliders, Save, RefreshCw, AlertCircle, Info,
  Plus, Edit2, Trash2, Copy, BarChart3, 
  ChevronDown, ChevronUp, Check, X
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import type { AxisKey, StageType, SectorType } from '../../types';
import type { 
  WeightPolicyConfig, 
  AxisWeight, 
  StageWeightPolicy,
  SectorSpecialWeight 
} from '../../types/weightPolicy';

const Weighting = () => {
  // 상태 관리
  const [policies, setPolicies] = useState<WeightPolicyConfig[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<WeightPolicyConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [expandedStages, setExpandedStages] = useState<Set<StageType>>(new Set());
  const [expandedSectors, setExpandedSectors] = useState<Set<SectorType>>(new Set());

  // 축과 단계 정의
  const axes: { key: AxisKey; label: string; color: string }[] = [
    { key: 'GO', label: 'Growth Orientation', color: 'bg-primary-main' },
    { key: 'EC', label: 'Efficiency & Capability', color: 'bg-secondary-main' },
    { key: 'PT', label: 'Product & Technology', color: 'bg-accent-blue' },
    { key: 'PF', label: 'Performance', color: 'bg-accent-purple' },
    { key: 'TO', label: 'Team & Organization', color: 'bg-accent-orange' }
  ];

  const stages: StageType[] = ['A-1', 'A-2', 'A-3', 'A-4', 'A-5'];
  const sectors: SectorType[] = ['S1', 'S2', 'S3', 'S4', 'S5'];

  // 초기 데이터 로드
  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = () => {
    // 샘플 데이터
    const samplePolicy: WeightPolicyConfig = {
      id: '1',
      name: '기본 가중치 정책',
      description: '모든 섹터와 단계에 적용되는 표준 가중치',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      defaultAxisWeights: [
        { axis: 'GO', weight: 25, description: '성장 지향성' },
        { axis: 'EC', weight: 20, description: '효율성 및 역량' },
        { axis: 'PT', weight: 20, description: '제품 및 기술' },
        { axis: 'PF', weight: 20, description: '성과' },
        { axis: 'TO', weight: 15, description: '팀 및 조직' }
      ],
      stageWeights: [
        {
          stage: 'A-1',
          axisWeights: [
            { axis: 'GO', weight: 35 },
            { axis: 'EC', weight: 15 },
            { axis: 'PT', weight: 25 },
            { axis: 'PF', weight: 10 },
            { axis: 'TO', weight: 15 }
          ],
          totalWeight: 100
        }
      ],
      kpiLevelMultipliers: {
        x1: 1.0,
        x2: 1.5,
        x3: 2.0
      }
    };
    
    setPolicies([samplePolicy]);
    setSelectedPolicy(samplePolicy);
  };

  // 가중치 업데이트
  const updateAxisWeight = (
    axisKey: AxisKey, 
    value: number, 
    stage?: StageType
  ) => {
    if (!selectedPolicy || !isEditing) return;

    const newPolicy = { ...selectedPolicy };

    if (stage) {
      // 단계별 가중치 업데이트
      const stageWeights = newPolicy.stageWeights || [];
      const stageIndex = stageWeights.findIndex(sw => sw.stage === stage);
      
      if (stageIndex >= 0) {
        const axisIndex = stageWeights[stageIndex].axisWeights.findIndex(
          aw => aw.axis === axisKey
        );
        if (axisIndex >= 0) {
          stageWeights[stageIndex].axisWeights[axisIndex].weight = value;
        } else {
          stageWeights[stageIndex].axisWeights.push({ axis: axisKey, weight: value });
        }
        // 합계 재계산
        stageWeights[stageIndex].totalWeight = stageWeights[stageIndex].axisWeights.reduce(
          (sum, aw) => sum + aw.weight, 0
        );
      } else {
        // 새 단계 가중치 추가
        const newStageWeight: StageWeightPolicy = {
          stage,
          axisWeights: axes.map(a => ({
            axis: a.key,
            weight: a.key === axisKey ? value : 20
          })),
          totalWeight: 100
        };
        stageWeights.push(newStageWeight);
      }
      newPolicy.stageWeights = stageWeights;
    } else {
      // 기본 가중치 업데이트
      const axisIndex = newPolicy.defaultAxisWeights.findIndex(
        aw => aw.axis === axisKey
      );
      if (axisIndex >= 0) {
        newPolicy.defaultAxisWeights[axisIndex].weight = value;
      }
    }

    setSelectedPolicy(newPolicy);
  };

  // KPI 레벨 배수 업데이트
  const updateKpiMultiplier = (level: 'x1' | 'x2' | 'x3', value: number) => {
    if (!selectedPolicy || !isEditing) return;

    setSelectedPolicy({
      ...selectedPolicy,
      kpiLevelMultipliers: {
        ...selectedPolicy.kpiLevelMultipliers,
        [level]: value
      }
    });
  };

  // 섹터별 특수 가중치 추가/수정
  const updateSectorSpecialWeight = (
    sector: SectorType,
    axis: AxisKey,
    multiplier: number
  ) => {
    if (!selectedPolicy || !isEditing) return;

    const newPolicy = { ...selectedPolicy };
    const specialWeights = newPolicy.sectorSpecialWeights || [];
    
    const existingIndex = specialWeights.findIndex(
      sw => sw.sector === sector && sw.axis === axis
    );
    
    if (existingIndex >= 0) {
      if (multiplier === 1.0) {
        // 기본값이면 제거
        specialWeights.splice(existingIndex, 1);
      } else {
        specialWeights[existingIndex].multiplier = multiplier;
      }
    } else if (multiplier !== 1.0) {
      specialWeights.push({ sector, axis, multiplier });
    }
    
    newPolicy.sectorSpecialWeights = specialWeights;
    setSelectedPolicy(newPolicy);
  };

  // 정책 저장
  const savePolicy = () => {
    if (!selectedPolicy) return;
    
    // 실제로는 API 호출
    console.log('Saving policy:', selectedPolicy);
    setIsEditing(false);
  };

  // 단계별 가중치 토글
  const toggleStageExpansion = (stage: StageType) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stage)) {
      newExpanded.delete(stage);
    } else {
      newExpanded.add(stage);
    }
    setExpandedStages(newExpanded);
  };

  // 가중치 합계 계산
  const calculateTotal = (weights: AxisWeight[]): number => {
    return weights.reduce((sum, w) => sum + w.weight, 0);
  };

  // 가중치 정규화 (합계를 100으로)
  const normalizeWeights = () => {
    if (!selectedPolicy || !isEditing) return;

    const newPolicy = { ...selectedPolicy };
    
    // 기본 가중치 정규화
    const defaultTotal = calculateTotal(newPolicy.defaultAxisWeights);
    if (defaultTotal !== 100 && defaultTotal > 0) {
      newPolicy.defaultAxisWeights = newPolicy.defaultAxisWeights.map(w => ({
        ...w,
        weight: Math.round((w.weight / defaultTotal) * 100)
      }));
    }

    // 단계별 가중치 정규화
    if (newPolicy.stageWeights) {
      newPolicy.stageWeights = newPolicy.stageWeights.map(sw => {
        const total = calculateTotal(sw.axisWeights);
        if (total !== 100 && total > 0) {
          return {
            ...sw,
            axisWeights: sw.axisWeights.map(w => ({
              ...w,
              weight: Math.round((w.weight / total) * 100)
            })),
            totalWeight: 100
          };
        }
        return sw;
      });
    }

    setSelectedPolicy(newPolicy);
  };

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-dark">가중치 정책 관리</h1>
            <p className="text-sm text-neutral-gray mt-1">
              축별, 단계별, 섹터별 가중치를 설정하고 관리합니다
            </p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2"
                >
                  <X size={16} />
                  취소
                </Button>
                <Button
                  variant="primary"
                  size="small"
                  onClick={savePolicy}
                  className="flex items-center gap-2"
                >
                  <Save size={16} />
                  저장
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setShowSimulation(!showSimulation)}
                  className="flex items-center gap-2"
                >
                  <BarChart3 size={16} />
                  시뮬레이션
                </Button>
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit2 size={16} />
                  편집
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 정책 선택 */}
        <div className="bg-white p-4 rounded-lg border border-neutral-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-neutral-dark">
                활성 정책:
              </label>
              <select
                value={selectedPolicy?.id || ''}
                onChange={(e) => {
                  const policy = policies.find(p => p.id === e.target.value);
                  setSelectedPolicy(policy || null);
                }}
                className="px-3 py-1.5 border border-neutral-border rounded-lg focus:outline-none focus:border-primary-main"
              >
                {policies.map(policy => (
                  <option key={policy.id} value={policy.id}>
                    {policy.name} {policy.isActive && '(활성)'}
                  </option>
                ))}
              </select>
            </div>
            {selectedPolicy?.description && (
              <div className="flex items-center gap-2 text-sm text-neutral-gray">
                <Info size={16} />
                {selectedPolicy.description}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedPolicy && (
        <div className="space-y-6">
          {/* 기본 축별 가중치 */}
          <div className="bg-white rounded-lg border border-neutral-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-dark">
                기본 축별 가중치
              </h2>
              {isEditing && (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={normalizeWeights}
                  className="flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  정규화
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {selectedPolicy.defaultAxisWeights.map(weight => {
                const axisInfo = axes.find(a => a.key === weight.axis);
                return (
                  <div key={weight.axis} className="flex items-center gap-4">
                    <div className="w-32">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${axisInfo?.color} text-white`}>
                        {weight.axis}
                      </span>
                      <p className="text-xs text-neutral-gray mt-1">
                        {axisInfo?.label}
                      </p>
                    </div>
                    <div className="flex-1">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={weight.weight}
                        onChange={(e) => updateAxisWeight(weight.axis, Number(e.target.value))}
                        disabled={!isEditing}
                        className="w-full"
                      />
                    </div>
                    <div className="w-20 text-right">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={weight.weight}
                        onChange={(e) => updateAxisWeight(weight.axis, Number(e.target.value))}
                        disabled={!isEditing}
                        className="w-16 px-2 py-1 text-center border border-neutral-border rounded"
                      />
                      <span className="ml-1 text-sm text-neutral-gray">%</span>
                    </div>
                  </div>
                );
              })}
              
              {/* 합계 표시 */}
              <div className="pt-4 border-t border-neutral-border">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-neutral-dark">합계</span>
                  <span className={`font-bold ${
                    calculateTotal(selectedPolicy.defaultAxisWeights) === 100 
                      ? 'text-green-600' 
                      : 'text-accent-red'
                  }`}>
                    {calculateTotal(selectedPolicy.defaultAxisWeights)}%
                  </span>
                </div>
                {calculateTotal(selectedPolicy.defaultAxisWeights) !== 100 && (
                  <p className="text-sm text-accent-red mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    가중치 합계는 100%여야 합니다
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* KPI 레벨 가중치 배수 */}
          <div className="bg-white rounded-lg border border-neutral-border p-6">
            <h2 className="text-lg font-semibold text-neutral-dark mb-4">
              KPI 레벨 가중치 배수
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {(['x1', 'x2', 'x3'] as const).map(level => (
                <div key={level} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-neutral-dark uppercase">
                      {level}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      level === 'x1' ? 'bg-blue-100 text-blue-700' :
                      level === 'x2' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {level === 'x1' ? '표준' : level === 'x2' ? '중요' : '결정적'}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={selectedPolicy.kpiLevelMultipliers[level]}
                    onChange={(e) => updateKpiMultiplier(level, Number(e.target.value))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-neutral-border rounded-lg"
                  />
                  <p className="text-xs text-neutral-gray mt-1">
                    배수: {selectedPolicy.kpiLevelMultipliers[level]}x
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 단계별 커스텀 가중치 */}
          <div className="bg-white rounded-lg border border-neutral-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-dark">
                단계별 커스텀 가중치
              </h2>
              <span className="text-sm text-neutral-gray">
                기본 가중치와 다른 경우만 설정
              </span>
            </div>

            <div className="space-y-2">
              {stages.map(stage => {
                const stageWeight = selectedPolicy.stageWeights?.find(sw => sw.stage === stage);
                const isExpanded = expandedStages.has(stage);
                const hasCustomWeight = !!stageWeight;

                return (
                  <div key={stage} className="border border-neutral-border rounded-lg">
                    <button
                      onClick={() => toggleStageExpansion(stage)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-neutral-dark">{stage}</span>
                        {hasCustomWeight && (
                          <span className="text-xs px-2 py-1 bg-primary-light text-primary-dark rounded">
                            커스텀 설정됨
                          </span>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-neutral-border">
                        {isEditing && !hasCustomWeight && (
                          <button
                            onClick={() => {
                              // 기본 가중치를 복사하여 커스텀 가중치 생성
                              const newStageWeight: StageWeightPolicy = {
                                stage,
                                axisWeights: selectedPolicy.defaultAxisWeights.map(w => ({
                                  axis: w.axis,
                                  weight: w.weight
                                })),
                                totalWeight: 100
                              };
                              const stageWeights = selectedPolicy.stageWeights || [];
                              stageWeights.push(newStageWeight);
                              setSelectedPolicy({
                                ...selectedPolicy,
                                stageWeights
                              });
                            }}
                            className="mt-3 w-full py-2 border-2 border-dashed border-neutral-border rounded-lg hover:border-primary-main text-sm text-neutral-gray hover:text-primary-main transition-colors"
                          >
                            <Plus size={16} className="inline mr-1" />
                            커스텀 가중치 추가
                          </button>
                        )}

                        {hasCustomWeight && (
                          <div className="mt-3 space-y-3">
                            {stageWeight.axisWeights.map(weight => {
                              const axisInfo = axes.find(a => a.key === weight.axis);
                              return (
                                <div key={weight.axis} className="flex items-center gap-3">
                                  <span className="w-12 text-xs font-medium">{weight.axis}</span>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={weight.weight}
                                    onChange={(e) => updateAxisWeight(weight.axis, Number(e.target.value), stage)}
                                    disabled={!isEditing}
                                    className="flex-1"
                                  />
                                  <span className="w-12 text-right text-sm">{weight.weight}%</span>
                                </div>
                              );
                            })}
                            <div className="pt-2 border-t border-neutral-border flex justify-between text-sm">
                              <span>합계</span>
                              <span className={stageWeight.totalWeight === 100 ? 'text-green-600' : 'text-accent-red'}>
                                {stageWeight.totalWeight}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 섹터별 특수 가중치 */}
          <div className="bg-white rounded-lg border border-neutral-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-dark">
                섹터별 특수 가중치
              </h2>
              <span className="text-sm text-neutral-gray">
                특정 섹터의 축 가중치 조정
              </span>
            </div>

            {isEditing && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-border">
                      <th className="text-left py-2 px-3 text-sm font-medium text-neutral-dark">섹터</th>
                      {axes.map(axis => (
                        <th key={axis.key} className="text-center py-2 px-3 text-sm font-medium text-neutral-dark">
                          {axis.key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sectors.map(sector => (
                      <tr key={sector} className="border-b border-neutral-border">
                        <td className="py-2 px-3 font-medium text-sm">{sector}</td>
                        {axes.map(axis => {
                          const specialWeight = selectedPolicy.sectorSpecialWeights?.find(
                            sw => sw.sector === sector && sw.axis === axis.key
                          );
                          const multiplier = specialWeight?.multiplier || 1.0;
                          
                          return (
                            <td key={axis.key} className="py-2 px-3">
                              <input
                                type="number"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={multiplier}
                                onChange={(e) => updateSectorSpecialWeight(
                                  sector,
                                  axis.key,
                                  Number(e.target.value)
                                )}
                                className={`w-16 px-2 py-1 text-center border rounded ${
                                  multiplier !== 1.0 
                                    ? 'border-primary-main bg-primary-light' 
                                    : 'border-neutral-border'
                                }`}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-neutral-gray mt-2">
                  * 1.0 = 기본 가중치, 1.5 = 150% 가중치, 0.5 = 50% 가중치
                </p>
              </div>
            )}

            {!isEditing && selectedPolicy.sectorSpecialWeights && selectedPolicy.sectorSpecialWeights.length > 0 && (
              <div className="space-y-2">
                {selectedPolicy.sectorSpecialWeights.map((sw, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <span className="font-medium text-sm">{sw.sector}</span>
                    <span className="text-sm text-neutral-gray">→</span>
                    <span className="text-sm">{sw.axis}</span>
                    <span className="text-sm font-medium text-primary-main">×{sw.multiplier}</span>
                  </div>
                ))}
              </div>
            )}

            {!isEditing && (!selectedPolicy.sectorSpecialWeights || selectedPolicy.sectorSpecialWeights.length === 0) && (
              <p className="text-sm text-neutral-gray">특수 가중치가 설정되지 않았습니다</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Weighting;