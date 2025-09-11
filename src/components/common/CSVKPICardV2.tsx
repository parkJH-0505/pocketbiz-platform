import { useState, useEffect } from 'react';
import { 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  MoreVertical,
  Calculator,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { validateKPI } from '../../utils/validation';
import type { KPIDefinition, KPIResponse, RawValue } from '../../types';
import type { StageRule } from '../../utils/csvParser';
import { getKPIInputLabels } from '../../data/kpiLoader';
import { 
  NumericInputV2, 
  RubricInputV2, 
  MultiSelectInputV2, 
  CalculationInputV2, 
  StageInputV2,
  ChecklistInputV2 
} from '../kpi/v2';
import { ScoreIndicator } from './ScoreIndicator';

interface CSVKPICardV2Props {
  kpi: KPIDefinition;
  stageRule?: StageRule;
  response?: KPIResponse;
  onChange: (kpiId: string, value: RawValue, status: 'valid' | 'invalid' | 'na') => void;
  userStage?: string;
}

export const CSVKPICardV2: React.FC<CSVKPICardV2Props> = ({ 
  kpi, 
  stageRule,
  response, 
  onChange,
  userStage = 'A-2'
}) => {
  const [isNA, setIsNA] = useState(response?.status === 'na');
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [value, setValue] = useState<RawValue>(response?.raw || getDefaultValue(kpi.input_type));
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [inputLabels, setInputLabels] = useState<Record<string, string>>({});
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Input labels 로드
  useEffect(() => {
    if (kpi.input_type === 'Calculation' && kpi.input_fields?.length) {
      getKPIInputLabels(kpi.kpi_id).then(labels => {
        setInputLabels(labels);
      });
    }
  }, [kpi.kpi_id, kpi.input_type, kpi.input_fields]);

  // 실시간 검증
  useEffect(() => {
    if (!hasInteracted && !response) return;
    
    const tempResponse: KPIResponse = {
      run_id: 'current',
      kpi_id: kpi.kpi_id,
      raw: value,
      status: isNA ? 'na' : 'valid'
    };
    
    const validation = validateKPI(kpi.kpi_id, tempResponse);
    setErrors(validation.errors);
    setWarnings(validation.warnings);
  }, [value, isNA, kpi.kpi_id, hasInteracted]);

  const handleValueChange = (newValue: RawValue) => {
    setValue(newValue);
    setHasInteracted(true);
    
    const tempResponse: KPIResponse = {
      run_id: 'current',
      kpi_id: kpi.kpi_id,
      raw: newValue,
      status: 'valid'
    };
    
    const validation = validateKPI(kpi.kpi_id, tempResponse);
    const status = validation.isValid ? 'valid' : 'invalid';
    onChange(kpi.kpi_id, newValue, status);
  };

  const handleNAToggle = () => {
    const newNA = !isNA;
    setIsNA(newNA);
    onChange(kpi.kpi_id, value, newNA ? 'na' : 'valid');
  };

  // 점수 계산
  const getScore = (): number | null => {
    if (isNA || !hasInteracted) return null;
    
    switch (kpi.input_type) {
      case 'Numeric':
        if (typeof value === 'object' && 'value' in value && stageRule?.minMax) {
          const val = value.value;
          const { min, max } = stageRule.minMax;
          if (val <= min) return 0;
          if (val >= max) return 100;
          return ((val - min) / (max - min)) * 100;
        }
        break;
      case 'Rubric':
        if (typeof value === 'object' && 'selectedIndex' in value && value.selectedIndex >= 0) {
          const choice = stageRule?.choices?.[value.selectedIndex];
          return choice?.score || 0;
        }
        break;
      case 'MultiSelect':
        if (typeof value === 'object' && 'selectedIndices' in value) {
          return value.selectedIndices.reduce((sum, idx) => {
            const choice = stageRule?.choices?.[idx];
            return sum + (choice?.score || 0);
          }, 0);
        }
        break;
      case 'Checklist':
        if (typeof value === 'object' && 'selectedIndices' in value) {
          return value.selectedIndices.reduce((sum, idx) => {
            const choice = stageRule?.choices?.[idx];
            return sum + (choice?.score || 0);
          }, 0);
        }
        break;
    }
    return null;
  };

  // 입력 컴포넌트 렌더링
  const renderInputComponent = () => {
    if (!stageRule) {
      return (
        <div className="p-6 bg-gradient-to-br from-neutral-light/50 to-neutral-light/30 rounded-xl backdrop-blur-sm">
          <p className="text-sm text-neutral-gray text-center">
            이 단계({userStage})에서는 입력할 수 없는 항목입니다.
          </p>
        </div>
      );
    }

    const inputProps = {
      minMax: stageRule.minMax,
      weight: stageRule.weight,
      unit: getUnitForKPI(kpi.kpi_id)
    };

    switch (kpi.input_type) {
      case 'Numeric':
        return (
          <NumericInputV2
            value={typeof value === 'object' && 'value' in value ? value.value : undefined}
            onChange={(val) => handleValueChange({ value: val.value, unit: val.unit })}
            {...inputProps}
          />
        );

      case 'Rubric':
        return (
          <RubricInputV2
            choices={stageRule.choices || []}
            selectedIndex={typeof value === 'object' && 'selectedIndex' in value ? value.selectedIndex : undefined}
            onChange={(val) => handleValueChange({ selectedIndex: val.selectedIndex })}
            weight={stageRule.weight}
          />
        );

      case 'MultiSelect':
        return (
          <MultiSelectInputV2
            choices={stageRule.choices || []}
            selectedIndices={typeof value === 'object' && 'selectedIndices' in value ? value.selectedIndices : []}
            onChange={(val) => handleValueChange({ selectedIndices: val.selectedIndices })}
            weight={stageRule.weight}
          />
        );

      case 'Calculation':
        return (
          <CalculationInputV2
            formula={kpi.formula || ''}
            inputFields={kpi.input_fields || []}
            inputLabels={inputLabels}
            inputs={typeof value === 'object' && 'inputs' in value ? value.inputs : {}}
            onChange={(val) => handleValueChange({ inputs: val.inputs, calculatedValue: val.calculatedValue })}
            minMax={stageRule.minMax}
          />
        );

      case 'Stage':
        const stageOptions = (stageRule.choices || []).map(choice => ({
          value: `stage-${choice.index}`,
          label: choice.label,
          description: choice.label,
          score: choice.score
        }));
        
        return (
          <StageInputV2
            stages={stageOptions}
            selectedStage={typeof value === 'object' && 'stage' in value ? value.stage : undefined}
            onChange={(val) => handleValueChange({ stage: val.stage, score: val.score })}
            weight={stageRule.weight}
          />
        );

      case 'Checklist':
        return (
          <ChecklistInputV2
            choices={stageRule.choices || []}
            selectedIndices={typeof value === 'object' && 'selectedIndices' in value ? value.selectedIndices : []}
            onChange={(val) => handleValueChange({ selectedIndices: val.selectedIndices })}
            weight={stageRule.weight}
          />
        );

      default:
        return (
          <div className="p-4 bg-neutral-light/50 rounded-xl">
            <p className="text-sm text-neutral-gray">
              {kpi.input_type} 타입은 아직 지원되지 않습니다.
            </p>
          </div>
        );
    }
  };

  const score = getScore();
  const isValid = hasInteracted && response?.status === 'valid' && !errors.length && !warnings.length;

  return (
    <div className={`
      relative group transition-all duration-300 animate-slide-up
      ${isExpanded ? 'col-span-2' : ''}
    `}>
      {/* 글래스모피즘 카드 */}
      <div className={`
        relative rounded-2xl transition-all duration-300
        backdrop-blur-md bg-white/70 border border-white/20
        hover:shadow-2xl hover:scale-[1.02] hover:bg-white/80
        ${isNA ? 'opacity-60' : ''}
        ${errors.length > 0 ? 'ring-2 ring-accent-red/50' : ''}
        ${warnings.length > 0 ? 'ring-2 ring-accent-orange/50' : ''}
        ${isValid ? 'ring-2 ring-secondary-main/50' : ''}
      `}>
        {/* 배경 그라데이션 효과 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-light/5 via-transparent to-secondary-light/5 pointer-events-none rounded-2xl" />
        
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h4 className="font-semibold text-lg text-neutral-dark">
                  {kpi.title}
                </h4>
                {stageRule?.weight && stageRule.weight !== 'x1' && (
                  <span className={`
                    px-2 py-0.5 text-xs font-bold rounded-full
                    ${stageRule.weight === 'x3' ? 'bg-accent-red/20 text-accent-red' :
                      stageRule.weight === 'x2' ? 'bg-accent-orange/20 text-accent-orange' :
                      'bg-neutral-light text-neutral-gray'}
                  `}>
                    {stageRule.weight}
                  </span>
                )}
                {score !== null && (
                  <ScoreIndicator score={Math.round(score)} size="xs" showBar={false} />
                )}
              </div>
              <p className="text-sm text-neutral-gray mt-2 leading-relaxed">
                {kpi.question}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* 정보 툴팁 */}
              <div className="relative">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="p-2 hover:bg-white/50 rounded-lg transition-all duration-200"
                >
                  <Info size={18} className="text-neutral-gray" />
                </button>
                
                {showDetails && (
                  <div className="absolute right-0 top-10 z-[100] w-80 p-4 rounded-xl
                    bg-white border border-neutral-border shadow-2xl
                    animate-fade-in">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-neutral-gray mb-1">KPI ID</p>
                        <p className="text-sm font-mono">{kpi.kpi_id}</p>
                      </div>
                      {kpi.formula && (
                        <div>
                          <p className="text-xs font-semibold text-neutral-gray mb-1">계산식</p>
                          <p className="text-sm font-mono bg-neutral-light/50 p-2 rounded">
                            {kpi.formula}
                          </p>
                        </div>
                      )}
                      {stageRule?.minMax && (
                        <div>
                          <p className="text-xs font-semibold text-neutral-gray mb-1">점수 기준</p>
                          <p className="text-sm">
                            0점: {stageRule.minMax.min}{getUnitForKPI(kpi.kpi_id)} 이하<br/>
                            100점: {stageRule.minMax.max}{getUnitForKPI(kpi.kpi_id)} 이상
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-neutral-gray">
                        {getHelpTextForKPI(kpi)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 더보기 메뉴 */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="p-2 hover:bg-white/50 rounded-lg transition-all duration-200"
                >
                  <MoreVertical size={18} className="text-neutral-gray" />
                </button>
                
                {showMoreMenu && (
                  <div className="absolute right-0 top-10 z-[100] w-48 py-2 rounded-xl
                    bg-white border border-neutral-border shadow-2xl
                    animate-fade-in">
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-primary-light/20 transition-colors"
                    >
                      {isExpanded ? '축소하기' : '확대하기'}
                    </button>
                    <button
                      onClick={handleNAToggle}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-primary-light/20 transition-colors"
                    >
                      {isNA ? 'N/A 해제' : 'N/A 설정'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Input Component */}
        {!isNA && (
          <div className="px-6 pb-6">
            {renderInputComponent()}
          </div>
        )}

        {/* Status Bar */}
        {(errors.length > 0 || warnings.length > 0 || isValid) && (
          <div className={`
            px-4 py-3 border-t backdrop-blur-sm
            ${errors.length > 0 ? 'bg-accent-red/10 border-accent-red/20' :
              warnings.length > 0 ? 'bg-accent-orange/10 border-accent-orange/20' :
              'bg-secondary-light/10 border-secondary-main/20'}
          `}>
            {errors.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-accent-red">
                <AlertTriangle size={16} />
                {errors[0]}
              </div>
            )}
            {warnings.length > 0 && !errors.length && (
              <div className="flex items-center gap-2 text-sm text-accent-orange">
                <AlertTriangle size={16} />
                {warnings[0]}
              </div>
            )}
            {isValid && (
              <div className="flex items-center gap-2 text-sm text-secondary-main">
                <CheckCircle2 size={16} className="animate-check" />
                입력 완료
              </div>
            )}
          </div>
        )}

        {/* N/A 오버레이 */}
        {isNA && (
          <div className="absolute inset-0 bg-neutral-dark/10 backdrop-blur-[2px] rounded-2xl
            flex items-center justify-center">
            <span className="px-4 py-2 bg-neutral-dark text-white text-sm font-medium rounded-full">
              N/A 설정됨
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions
function getDefaultValue(inputType: string): RawValue {
  switch (inputType) {
    case 'Numeric':
      return { value: 0 };
    case 'Calculation':
      return { inputs: {}, calculatedValue: 0 };
    case 'Rubric':
      return { selectedIndex: -1 };
    case 'MultiSelect':
      return { selectedIndices: [] };
    case 'Stage':
      return { stage: '', score: 0 };
    case 'Checklist':
      return { selectedIndices: [] };
    default:
      return { value: 0 };
  }
}

function getUnitForKPI(kpiId: string): string {
  const units: Record<string, string> = {
    'S1-GO-02': '억원',
    'S1-GO-04': '명',
    'S1-GO-05': '명',
    'S1-GO-06': '%',
    'S1-GO-09': '명',
    'S1-GO-10': '명'
  };
  return units[kpiId] || '';
}

function getHelpTextForKPI(kpi: KPIDefinition): string {
  const helpTexts: Record<string, string> = {
    'Numeric': '정확한 숫자 값을 입력해주세요.',
    'Calculation': '필요한 값들을 모두 입력하면 자동으로 계산됩니다.',
    'Rubric': '가장 적합한 옵션을 선택해주세요.',
    'MultiSelect': '해당되는 모든 항목을 선택해주세요.',
    'Stage': '현재 달성한 단계를 선택해주세요.'
  };
  
  return helpTexts[kpi.input_type] || '정확한 정보를 입력해주세요.';
}