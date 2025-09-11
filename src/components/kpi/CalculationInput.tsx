import { useState } from 'react';
import { Calculator, AlertCircle } from 'lucide-react';
import { ScoreIndicator } from '../common/ScoreIndicator';

interface CalculationInputProps {
  formula: string;
  inputFields: string[];
  inputLabels?: Record<string, string>;
  inputs?: Record<string, number>;
  onChange: (value: { inputs: Record<string, number>; calculatedValue: number }) => void;
  unit?: string;
  minMax?: { min: number; max: number };
}

export const CalculationInput: React.FC<CalculationInputProps> = ({ 
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
  const [error, setError] = useState<string | null>(null);

  // 필드 이름을 한글로 변환
  const getFieldLabel = (fieldKey: string) => {
    // inputLabels에서 먼저 찾고, 없으면 기본값 사용
    if (inputLabels[fieldKey]) {
      return inputLabels[fieldKey];
    }
    
    // 폴백: 기본 라벨
    const labels: Record<string, string> = {
      s1_go_04_total_users: '총 가입자 수',
      s1_go_05_mau: 'MAU',
      s1_go_09_dau: 'DAU',
      s1_go_10_paid_users: '유료 고객 수',
      s1_ec_01_q_revenue: '지난 분기 매출',
      s1_ec_01_q_cogs: '지난 분기 매출원가',
      s1_ec_05_q_sm_cost: '지난 분기 세일즈·마케팅 비용',
      s1_ec_05_q_new_paid_users: '지난 분기 신규 유료 고객 수'
    };
    return labels[fieldKey] || fieldKey;
  };

  // 공식을 한글로 표시
  const getFormulaDisplay = () => {
    let displayFormula = formula;
    inputFields.forEach(field => {
      displayFormula = displayFormula.replace(
        `{${field}}`,
        getFieldLabel(field)
      );
    });
    return displayFormula;
  };

  // 계산 수행
  const calculate = (values: Record<string, number>) => {
    try {
      let processedFormula = formula;
      
      console.log('Calculation Input - Original formula:', formula);
      console.log('Calculation Input - Input values:', values);
      
      // 모든 필드가 채워졌는지 확인
      for (const field of inputFields) {
        if (!values[field] && values[field] !== 0) {
          setError('모든 값을 입력해주세요');
          return null;
        }
        processedFormula = processedFormula.replace(`{${field}}`, values[field].toString());
      }
      
      console.log('Calculation Input - Processed formula:', processedFormula);
      
      // 안전한 수식 계산
      const result = Function(`"use strict"; return (${processedFormula})`)();
      
      console.log('Calculation Input - Result:', result);
      
      if (isNaN(result)) {
        setError('계산 결과가 올바르지 않습니다');
        return null;
      }
      
      setError(null);
      return result;
    } catch (err) {
      console.error('Calculation Input - Error:', err);
      setError('계산 중 오류가 발생했습니다');
      return null;
    }
  };

  // 값 변경 처리
  const handleInputChange = (field: string, value: string) => {
    const newInputValues = { ...inputValues, [field]: value };
    setInputValues(newInputValues);
    
    // 모든 필드가 채워졌는지 확인
    const numericValues: Record<string, number> = {};
    let allFieldsFilled = true;
    
    for (const inputField of inputFields) {
      const val = newInputValues[inputField];
      if (!val && val !== '0') {
        allFieldsFilled = false;
        break;
      }
      const num = parseFloat(val);
      if (isNaN(num)) {
        allFieldsFilled = false;
        break;
      }
      numericValues[inputField] = num;
    }
    
    if (allFieldsFilled) {
      const result = calculate(numericValues);
      if (result !== null) {
        setCalculatedValue(result);
        onChange({ inputs: numericValues, calculatedValue: result });
      }
    } else {
      setCalculatedValue(null);
    }
  };

  // 점수 계산 표시
  const getScoreDisplay = () => {
    if (!calculatedValue || !minMax) return null;
    
    const percentage = calculatedValue * 100;
    let score = 0;
    
    if (percentage <= minMax.min) {
      score = 0;
    } else if (percentage >= minMax.max) {
      score = 100;
    } else {
      score = ((percentage - minMax.min) / (minMax.max - minMax.min)) * 100;
    }
    
    return (
      <div className="text-xs text-neutral-gray mt-1">
        <span>0점: {minMax.min}% 미만</span>
        <span className="mx-2">|</span>
        <span>100점: {minMax.max}% 이상</span>
        <span className="ml-2">→</span>
        <span className="font-semibold text-primary-main ml-2">
          예상 점수: {Math.round(score)}점
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 계산식 표시 - 더 컴팩트하게 */}
      <div className="flex items-center gap-2 p-2 bg-primary-light/10 rounded-lg mb-3">
        <Calculator size={14} className="text-primary-main" />
        <p className="text-xs text-neutral-gray font-mono">
          {getFormulaDisplay()}
        </p>
      </div>

      {/* 입력 필드들 - 컴팩트한 인라인 스타일 */}
      <div className="space-y-2">
        {inputFields.map((field) => {
          const isFilled = !!inputValues[field];
          return (
            <div key={field} className={`
              flex items-center gap-3 p-3 rounded-xl transition-all duration-200
              bg-white/60 backdrop-blur-sm border
              ${isFilled ? 'border-secondary-light bg-secondary-light/10' : 'border-neutral-border hover:border-primary-light'}
            `}>
              <label className="text-sm font-medium text-neutral-dark min-w-[120px]">
                {getFieldLabel(field)}
              </label>
              <input
                type="number"
                value={inputValues[field] || ''}
                onChange={(e) => handleInputChange(field, e.target.value)}
                placeholder="0"
                className="flex-1 px-2 py-1 bg-transparent text-right font-medium
                  focus:outline-none appearance-none"
                style={{ MozAppearance: 'textfield' }}
              />
              <span className="text-sm text-neutral-gray min-w-[40px]">
                {field.includes('mau') || field.includes('dau') || field.includes('users') ? '명' : unit}
              </span>
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
              <span className="text-sm font-medium text-neutral-dark">계산 결과</span>
              <div className="text-2xl font-bold text-secondary-main">
                {(calculatedValue * 100).toFixed(1)}%
              </div>
            </div>
          </div>
          {/* 점수 계산 및 ScoreIndicator 표시 */}
          {minMax && (() => {
            const percentage = calculatedValue * 100;
            let score = 0;
            
            if (percentage <= minMax.min) {
              score = 0;
            } else if (percentage >= minMax.max) {
              score = 100;
            } else {
              score = ((percentage - minMax.min) / (minMax.max - minMax.min)) * 100;
            }
            
            return (
              <div className="mt-3 space-y-2">
                <ScoreIndicator score={Math.round(score)} size="sm" showBar={true} />
                <div className="text-xs text-neutral-gray">
                  <span>0점: {minMax.min}% 미만</span>
                  <span className="mx-2">|</span>
                  <span>100점: {minMax.max}% 이상</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="flex items-center gap-1 text-xs text-accent-red">
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  );
};