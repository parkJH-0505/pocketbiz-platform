import { useState } from 'react';
import { Calculator, Check, X } from 'lucide-react';

interface CalculationInputV2Props {
  formula: string;
  inputFields: string[];
  inputLabels?: Record<string, string>;
  inputs?: Record<string, number>;
  onChange: (value: { inputs: Record<string, number>; calculatedValue: number }) => void;
  unit?: string;
  minMax?: { min: number; max: number };
}

export const CalculationInputV2: React.FC<CalculationInputV2Props> = ({ 
  formula,
  inputFields,
  inputLabels = {},
  inputs = {},
  onChange,
  unit = '',
  minMax
}) => {
  const [inputValues, setInputValues] = useState<Record<string, string>>(
    Object.entries(inputs).reduce((acc, [key, val]) => ({
      ...acc,
      [key]: val.toString()
    }), {})
  );
  const [calculatedValue, setCalculatedValue] = useState<number | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // 필드 이름을 한글로 변환
  const getFieldLabel = (fieldKey: string) => {
    return inputLabels[fieldKey] || fieldKey;
  };

  // 계산 수행
  const calculate = (values: Record<string, number>) => {
    try {
      let processedFormula = formula;
      
      for (const field of inputFields) {
        if (!values[field] && values[field] !== 0) {
          return null;
        }
        processedFormula = processedFormula.replace(`{${field}}`, values[field].toString());
      }
      
      const result = Function(`"use strict"; return (${processedFormula})`)();
      
      if (isNaN(result)) {
        return null;
      }
      
      return result;
    } catch (err) {
      return null;
    }
  };

  // 값 변경 처리
  const handleInputChange = (field: string, value: string) => {
    const newInputValues = { ...inputValues, [field]: value };
    setInputValues(newInputValues);
    
    const numericValues: Record<string, number> = {};
    let allValid = true;
    
    for (const [key, val] of Object.entries(newInputValues)) {
      const num = parseFloat(val);
      if (isNaN(num)) {
        allValid = false;
        break;
      }
      numericValues[key] = num;
    }
    
    if (allValid && Object.keys(numericValues).length === inputFields.length) {
      const result = calculate(numericValues);
      if (result !== null) {
        setCalculatedValue(result);
        onChange({ inputs: numericValues, calculatedValue: result });
      }
    } else {
      setCalculatedValue(null);
    }
  };

  // 점수 계산
  const getScore = () => {
    if (!calculatedValue || !minMax) return null;
    
    const percentage = calculatedValue * 100;
    if (percentage <= minMax.min) return 0;
    if (percentage >= minMax.max) return 100;
    return ((percentage - minMax.min) / (minMax.max - minMax.min)) * 100;
  };

  const score = getScore();
  const allFieldsFilled = inputFields.every(field => inputValues[field]);

  return (
    <div className="space-y-4">
      {/* 입력 필드들 - 컴팩트한 인라인 스타일 */}
      <div className="space-y-3">
        {inputFields.map((field) => {
          const isFilled = !!inputValues[field];
          return (
            <div key={field} className="relative">
              <div className={`
                flex items-center gap-3 p-3 rounded-xl
                bg-white/80 backdrop-blur-sm border transition-all duration-300
                ${focusedField === field ? 
                  'border-primary-main shadow-lg shadow-primary-light/20 scale-[1.02]' : 
                  'border-white/30'}
                ${isFilled ? 'bg-secondary-light/10' : ''}
              `}>
                <label className="text-sm font-medium text-neutral-dark min-w-[120px]">
                  {getFieldLabel(field)}
                </label>
                <input
                  type="number"
                  value={inputValues[field] || ''}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  onFocus={() => setFocusedField(field)}
                  onBlur={() => setFocusedField(null)}
                  placeholder="0"
                  className="flex-1 px-3 py-1 bg-transparent text-right font-semibold
                    focus:outline-none appearance-none"
                  style={{ MozAppearance: 'textfield' }}
                />
                <span className="text-sm text-neutral-gray min-w-[40px]">
                  {field.includes('mau') || field.includes('dau') || field.includes('users') ? '명' : unit}
                </span>
                {isFilled && (
                  <Check size={16} className="text-secondary-main animate-check" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 계산 결과 */}
      {calculatedValue !== null && (
        <div className="relative overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-secondary-light/20 to-primary-light/20" />
          <div className="relative p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator size={20} className="text-secondary-main" />
                <span className="text-sm font-medium text-neutral-dark">계산 결과</span>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-secondary-main">
                  {(calculatedValue * 100).toFixed(1)}%
                </div>
                {score !== null && (
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <div className="flex-1 h-2 bg-neutral-light rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-secondary-light to-secondary-main
                          transition-all duration-500 ease-out"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-neutral-gray">
                      {Math.round(score)}점
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 모든 필드가 채워지지 않았을 때 안내 */}
      {!allFieldsFilled && (
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl
          bg-neutral-light/30 backdrop-blur-sm">
          <X size={16} className="text-neutral-gray" />
          <span className="text-sm text-neutral-gray">
            모든 값을 입력하면 자동으로 계산됩니다
          </span>
        </div>
      )}
    </div>
  );
};