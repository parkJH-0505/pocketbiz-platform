import { useState, useEffect } from 'react';
import { AlertCircle, HelpCircle, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { validateKPI } from '../../utils/validation';
import type { KPIDefinition, KPIResponse, RawValue } from '../../types';

interface KPICardProps {
  kpi: KPIDefinition;
  response?: KPIResponse;
  onChange: (kpiId: string, value: RawValue, status: 'valid' | 'invalid' | 'na') => void;
  onEvidence?: (kpiId: string, evidence: any) => void;
}

export const KPICard: React.FC<KPICardProps> = ({ kpi, response, onChange }) => {
  const [isNA, setIsNA] = useState(response?.status === 'na');
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [value, setValue] = useState<RawValue>(response?.raw || getDefaultValue(kpi.input_type));
  const [hasInteracted, setHasInteracted] = useState(false);

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

  const renderInput = () => {
    switch (kpi.input_type) {
      case 'Numeric':
        return (
          <NumericInput
            value={(value as { value: number }).value}
            onChange={(val) => handleValueChange({ value: val })}
            disabled={isNA}
            hint={kpi.stage_cell?.choices?.[0]?.label}
          />
        );
      
      case 'Calculation':
        return (
          <CalculationInput
            value={value as { numerator: number; denominator: number }}
            onChange={handleValueChange}
            formula={kpi.formula || ''}
            disabled={isNA}
          />
        );
      
      case 'Checklist':
        return (
          <ChecklistInput
            value={(value as { checked: boolean }).checked}
            onChange={(val) => handleValueChange({ checked: val })}
            disabled={isNA}
          />
        );
      
      case 'Stage':
      case 'Rubric':
        return (
          <ChoiceInput
            choices={kpi.stage_cell?.choices || []}
            value={(value as { choice_index: number }).choice_index}
            onChange={(val) => handleValueChange({ choice_index: val })}
            disabled={isNA}
          />
        );
      
      case 'MultiSelect':
        return (
          <MultiSelectInput
            choices={kpi.stage_cell?.choices || []}
            value={(value as { selected_indices: number[] }).selected_indices}
            onChange={(val) => handleValueChange({ selected_indices: val })}
            disabled={isNA}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`
      bg-white rounded-lg shadow-default border p-6 
      transition-all duration-300 transform
      ${hasInteracted && errors.length === 0 && !isNA ? 'border-secondary-main shadow-md scale-[1.01]' : 'border-neutral-border hover:shadow-md'}
      ${errors.length > 0 ? 'border-accent-red' : ''}
      ${!kpi.applicable ? 'opacity-50' : ''}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono bg-neutral-light px-2 py-1 rounded-sm text-neutral-gray">
            {kpi.kpi_id}
          </span>
          <span className={`text-xs px-2 py-1 rounded ${getAxisColor(kpi.axis)}`}>
            {kpi.axis}
          </span>
          {kpi.stage && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
              {kpi.stage}
            </span>
          )}
          {kpi.weight && (
            <span className="text-xs px-2 py-1 bg-neutral-dark text-white rounded font-semibold">
              {kpi.weight}
            </span>
          )}
        </div>
        <button className="text-neutral-lighter hover:text-neutral-gray transition-colors">
          <HelpCircle size={16} />
        </button>
      </div>

      {/* Question */}
      <div className="mb-6">
        <h3 className="font-semibold text-neutral-dark mb-2">{kpi.title}</h3>
        <p className="text-neutral-gray text-sm leading-relaxed">{kpi.question}</p>
      </div>

      {/* Input Area */}
      <div className="mb-4">
        {renderInput()}
      </div>

      {/* Validation Messages */}
      {errors.length > 0 && (
        <div className="flex items-start gap-2 text-accent-red text-sm mb-4 bg-red-50 p-3 rounded-md">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            {errors.map((error, idx) => (
              <div key={idx} className="font-medium">{error}</div>
            ))}
          </div>
        </div>
      )}
      
      {warnings.length > 0 && (
        <div className="flex items-start gap-2 text-accent-orange text-sm mb-4 bg-orange-50 p-3 rounded-md">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            {warnings.map((warning, idx) => (
              <div key={idx} className="font-medium">{warning}</div>
            ))}
          </div>
        </div>
      )}
      
      {hasInteracted && errors.length === 0 && warnings.length === 0 && !isNA && (
        <div className="flex items-center gap-2 text-secondary-main text-sm mb-4 bg-green-50 p-3 rounded-md">
          <CheckCircle size={16} />
          <span className="font-medium">입력값이 유효합니다</span>
        </div>
      )}

      {/* Evidence */}
      {kpi.evidence_required && (
        <div className="border-t pt-4">
          <button className="flex items-center gap-2 text-sm text-primary-main hover:text-primary-hover transition-colors font-medium">
            <Upload size={16} />
            증빙 자료 첨부
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isNA}
            onChange={handleNAToggle}
            className="rounded"
          />
          <span>해당 없음</span>
        </label>
        <span className="text-xs text-gray-500">자동 저장됨</span>
      </div>
    </div>
  );
};

// Input Components
const NumericInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  hint?: string;
}> = ({ value, onChange, disabled, hint }) => (
  <div>
    <input
      type="number"
      value={value || ''}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      disabled={disabled}
      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
    />
    {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
  </div>
);

const CalculationInput: React.FC<{
  value: { numerator: number; denominator: number };
  onChange: (value: { numerator: number; denominator: number }) => void;
  formula: string;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
  const result = value.denominator ? (value.numerator / value.denominator * 100).toFixed(2) : 0;
  
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          placeholder="분자"
          value={value.numerator || ''}
          onChange={(e) => onChange({ ...value, numerator: parseFloat(e.target.value) || 0 })}
          disabled={disabled}
          className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          placeholder="분모"
          value={value.denominator || ''}
          onChange={(e) => onChange({ ...value, denominator: parseFloat(e.target.value) || 0 })}
          disabled={disabled}
          className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="text-right">
        <span className="text-lg font-medium">= {result}%</span>
      </div>
    </div>
  );
};

const ChecklistInput: React.FC<{
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => (
  <button
    onClick={() => onChange(!value)}
    disabled={disabled}
    className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
      value
        ? 'bg-green-500 text-white'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    } disabled:opacity-50`}
  >
    {value ? 'Yes' : 'No'}
  </button>
);

const ChoiceInput: React.FC<{
  choices: Array<{ label: string; score: number }>;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}> = ({ choices, value, onChange, disabled }) => (
  <div className="space-y-2">
    {choices.map((choice, index) => (
      <label
        key={index}
        className={`flex items-center p-3 rounded-md border cursor-pointer transition-colors ${
          value === index
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          type="radio"
          name={`choice-${Date.now()}`}
          checked={value === index}
          onChange={() => onChange(index)}
          disabled={disabled}
          className="mr-3"
        />
        <span className="text-sm">{choice.label}</span>
      </label>
    ))}
  </div>
);

const MultiSelectInput: React.FC<{
  choices: Array<{ label: string; value?: number }>;
  value: number[];
  onChange: (value: number[]) => void;
  disabled?: boolean;
}> = ({ choices, value, onChange, disabled }) => {
  const toggleChoice = (index: number) => {
    if (value.includes(index)) {
      onChange(value.filter(i => i !== index));
    } else {
      onChange([...value, index]);
    }
  };

  const totalScore = value.reduce((sum, idx) => sum + (choices[idx]?.value || 0), 0);

  return (
    <div>
      <div className="space-y-2 mb-3">
        {choices.map((choice, index) => (
          <label
            key={index}
            className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${
              value.includes(index)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={value.includes(index)}
                onChange={() => toggleChoice(index)}
                disabled={disabled}
                className="mr-3"
              />
              <span className="text-sm">{choice.label}</span>
            </div>
            {choice.value && (
              <span className="text-sm font-medium text-gray-600">
                +{choice.value}
              </span>
            )}
          </label>
        ))}
      </div>
      <div className="text-right">
        <span className="text-sm text-gray-600">합계: </span>
        <span className="text-lg font-medium">{totalScore}</span>
      </div>
    </div>
  );
};

// Utility functions
function getDefaultValue(inputType: string): RawValue {
  switch (inputType) {
    case 'Numeric':
      return { value: 0 };
    case 'Calculation':
      return { numerator: 0, denominator: 0 };
    case 'Checklist':
      return { checked: false };
    case 'Stage':
    case 'Rubric':
      return { choice_index: 0 };
    case 'MultiSelect':
      return { selected_indices: [] };
    default:
      return { value: 0 };
  }
}

function getAxisColor(axis: string): string {
  const colors: Record<string, string> = {
    GO: 'bg-axis-GO-light text-axis-GO-main',
    EC: 'bg-axis-EC-light text-axis-EC-main',
    PT: 'bg-axis-PT-light text-axis-PT-main',
    PF: 'bg-axis-PF-light text-axis-PF-main',
    TO: 'bg-axis-TO-light text-axis-TO-main',
  };
  return colors[axis] || 'bg-neutral-light text-neutral-gray';
}