import { useState, useEffect } from 'react';
import { AlertCircle, HelpCircle, CheckCircle, AlertTriangle, Info, MoreVertical } from 'lucide-react';
import { validateKPI } from '../../utils/validation';
import type { KPIDefinition, KPIResponse, RawValue } from '../../types';
import type { StageRule } from '../../utils/csvParser';
import { getKPIInputLabels } from '../../data/kpiLoader';
import { 
  NumericInput, 
  RubricInput, 
  MultiSelectInput, 
  CalculationInput, 
  StageInput,
  ChecklistInput 
} from '../kpi';

interface CSVKPICardProps {
  kpi: KPIDefinition;
  stageRule?: StageRule;
  response?: KPIResponse;
  onChange: (kpiId: string, value: RawValue, status: 'valid' | 'invalid' | 'na') => void;
  userStage?: string;
}

export const CSVKPICard: React.FC<CSVKPICardProps> = ({ 
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
  const [showHelp, setShowHelp] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [inputLabels, setInputLabels] = useState<Record<string, string>>({});

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

  // 입력 컴포넌트 렌더링
  const renderInputComponent = () => {
    if (!stageRule) {
      return (
        <div className="p-4 bg-neutral-light rounded-lg text-center">
          <p className="text-sm text-neutral-gray">
            이 단계({userStage})에서는 입력할 수 없는 항목입니다.
          </p>
        </div>
      );
    }

    switch (kpi.input_type) {
      case 'Numeric':
        return (
          <NumericInput
            value={typeof value === 'object' && 'value' in value ? value.value : undefined}
            onChange={(val) => handleValueChange({ value: val.value, unit: val.unit })}
            minMax={stageRule.minMax}
            unit={getUnitForKPI(kpi.kpi_id)}
            fieldKey={kpi.input_fields?.[0]}
          />
        );

      case 'Rubric':
        return (
          <RubricInput
            choices={stageRule.choices || []}
            selectedIndex={typeof value === 'object' && 'selectedIndex' in value ? value.selectedIndex : undefined}
            onChange={(val) => handleValueChange({ selectedIndex: val.selectedIndex })}
            weight={stageRule.weight}
          />
        );

      case 'MultiSelect':
        return (
          <MultiSelectInput
            choices={stageRule.choices || []}
            selectedIndices={typeof value === 'object' && 'selectedIndices' in value ? value.selectedIndices : []}
            onChange={(val) => handleValueChange({ selectedIndices: val.selectedIndices })}
            weight={stageRule.weight}
          />
        );

      case 'Calculation':
        return (
          <CalculationInput
            formula={kpi.formula || ''}
            inputFields={kpi.input_fields || []}
            inputLabels={inputLabels}
            inputs={typeof value === 'object' && 'inputs' in value ? value.inputs : {}}
            onChange={(val) => handleValueChange({ inputs: val.inputs, calculatedValue: val.calculatedValue })}
            minMax={stageRule.minMax}
          />
        );

      case 'Stage':
        // Stage 타입은 choices를 StageOption으로 변환
        const stageOptions = (stageRule.choices || []).map(choice => ({
          value: `stage-${choice.index}`,
          label: choice.label,
          description: choice.label,
          score: choice.score
        }));
        
        return (
          <StageInput
            stages={stageOptions}
            selectedStage={typeof value === 'object' && 'stage' in value ? value.stage : undefined}
            onChange={(val) => handleValueChange({ stage: val.stage, score: val.score })}
            weight={stageRule.weight}
          />
        );

      case 'Checklist':
        return (
          <ChecklistInput
            choices={stageRule.choices || []}
            selectedIndices={typeof value === 'object' && 'selectedIndices' in value ? value.selectedIndices : []}
            onChange={(val) => handleValueChange({ selectedIndices: val.selectedIndices })}
            weight={stageRule.weight}
          />
        );

      default:
        return (
          <div className="p-4 bg-neutral-light rounded-lg">
            <p className="text-sm text-neutral-gray">
              {kpi.input_type} 타입은 아직 지원되지 않습니다.
            </p>
          </div>
        );
    }
  };

  return (
    <div className={`relative group transition-all duration-300 ${
      isNA ? 'opacity-60' : ''
    }`}>
      {/* 글래스모피즘 카드 */}
      <div className={`
        relative rounded-2xl transition-all duration-300
        backdrop-blur-md bg-white/70 border border-white/20
        hover:shadow-2xl hover:bg-white/80
        ${
          errors.length > 0 ? 'ring-2 ring-accent-red/50' :
          warnings.length > 0 ? 'ring-2 ring-accent-orange/50' :
          hasInteracted && response?.status === 'valid' ? 'ring-2 ring-secondary-main/50' :
          'hover:shadow-lg'
        }
      `}>
        {/* 배경 그라데이션 효과 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-light/5 via-transparent to-secondary-light/5 pointer-events-none rounded-2xl" />
        
        <div className="relative p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-lg text-neutral-dark">{kpi.title}</h4>
            {stageRule?.weight && stageRule.weight !== 'x1' && (
              <span className={`text-xs font-semibold px-2 py-1 rounded ${
                stageRule.weight === 'x3' ? 'bg-accent-red-light text-accent-red' :
                stageRule.weight === 'x2' ? 'bg-accent-orange-light text-accent-orange' :
                'bg-neutral-light text-neutral-gray'
              }`}>
                {stageRule.weight}
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-gray mt-1">{kpi.question}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 정보 툴팁 */}
          <div className="relative">
            <button
              onClick={() => setShowDetails(!showDetails)}
              onMouseEnter={() => setShowDetails(true)}
              onMouseLeave={() => setShowDetails(false)}
              className="p-2 hover:bg-white/50 rounded-lg transition-all duration-200"
            >
              <Info size={18} className="text-neutral-gray" />
            </button>
            
            {showDetails && (
              <div className="absolute right-0 top-10 z-[100] w-72 p-4 rounded-xl
                bg-white border border-neutral-border shadow-2xl animate-fade-in">
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-neutral-gray mb-1">KPI ID</p>
                    <p className="text-sm font-mono">{kpi.kpi_id}</p>
                  </div>
                  {kpi.formula && (
                    <div>
                      <p className="text-xs font-semibold text-neutral-gray mb-1">계산식</p>
                      <p className="text-xs font-mono bg-neutral-light/50 p-2 rounded">
                        {kpi.formula}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-neutral-gray mt-2">
                    {getHelpTextForKPI(kpi)}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={handleNAToggle}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all
              ${isNA 
                ? 'bg-neutral-dark text-white' 
                : 'bg-neutral-light text-neutral-gray hover:bg-neutral-border'
              }`}
          >
            N/A
          </button>
        </div>
      </div>

      {/* Input Component */}
      {!isNA && (
        <div className="space-y-3">
          {renderInputComponent()}
        </div>
      )}

      {/* Errors & Warnings */}
      {errors.length > 0 && (
        <div className="mt-3 p-3 bg-accent-red-light rounded-lg">
          {errors.map((error, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-accent-red">
              <AlertCircle size={16} />
              {error}
            </div>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mt-3 p-3 bg-accent-orange-light rounded-lg">
          {warnings.map((warning, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-accent-orange">
              <AlertTriangle size={16} />
              {warning}
            </div>
          ))}
        </div>
      )}

      {/* Success State */}
      {hasInteracted && response?.status === 'valid' && !errors.length && !warnings.length && (
        <div className="mt-3 flex items-center gap-2 text-sm text-secondary-main">
          <CheckCircle size={16} className="animate-fade-in" />
          입력 완료
        </div>
      )}
        </div>
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
    'Numeric': '정확한 숫자 값을 입력해주세요. 최대한 정확한 데이터를 입력할수록 더 나은 평가를 받을 수 있습니다.',
    'Calculation': '다른 KPI 값들을 참조하여 자동으로 계산됩니다. 필요한 값들을 모두 입력해주세요.',
    'Rubric': '가장 적합한 선택지를 하나만 선택해주세요. 각 선택지마다 다른 점수가 부여됩니다.',
    'MultiSelect': '해당되는 모든 항목을 선택해주세요. 선택한 항목들의 가중치 합으로 점수가 계산됩니다.',
    'Stage': '현재 달성한 단계를 선택해주세요. 높은 단계일수록 더 높은 점수를 받습니다.'
  };
  
  return helpTexts[kpi.input_type] || '정확한 정보를 입력해주세요.';
}