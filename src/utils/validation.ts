import type { KPIResponse, Validator } from '../types';
import { mockKPIs } from '../data/mockKPIs';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CrossValidationRule {
  sourceKPI: string;
  targetKPI: string;
  rule: 'lt' | 'lte' | 'gt' | 'gte' | 'eq';
  message: string;
}

// 교차 검증 규칙 정의
const crossValidationRules: CrossValidationRule[] = [
  {
    sourceKPI: 'S1-GO-05', // MAU
    targetKPI: 'S1-GO-04', // 총 가입자
    rule: 'lte',
    message: 'MAU는 총 가입자 수를 초과할 수 없습니다'
  },
  {
    sourceKPI: 'S1-EC-03', // 유료 전환율
    targetKPI: 'S1-EC-03', // 자체 검증
    rule: 'lte',
    message: '유료 전환율은 100%를 초과할 수 없습니다'
  }
];

// 단일 KPI 검증
export function validateKPI(kpiId: string, response: KPIResponse): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  const kpi = mockKPIs.find(k => k.kpi_id === kpiId);
  if (!kpi || !kpi.validators) return result;

  // 기본 검증 규칙 적용
  kpi.validators.forEach(validator => {
    const isValid = applyValidator(validator, response);
    if (!isValid) {
      result.isValid = false;
      result.errors.push(validator.message);
    }
  });

  return result;
}

// 교차 검증
export function crossValidate(responses: Record<string, KPIResponse>): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  crossValidationRules.forEach(rule => {
    const sourceResponse = responses[rule.sourceKPI];
    const targetResponse = responses[rule.targetKPI];

    if (!sourceResponse || !targetResponse) return;
    if (sourceResponse.status === 'na' || targetResponse.status === 'na') return;

    const sourceValue = extractNumericValue(sourceResponse);
    const targetValue = extractNumericValue(targetResponse);

    if (sourceValue === null || targetValue === null) return;

    const isValid = compareValues(sourceValue, targetValue, rule.rule);
    if (!isValid) {
      result.isValid = false;
      result.errors.push(rule.message);
    }
  });

  return result;
}

// 검증자 적용
function applyValidator(validator: Validator, response: KPIResponse): boolean {
  const value = extractNumericValue(response);
  if (value === null) return true;

  switch (validator.type) {
    case 'range': {
      const rules = validator.rule.split(',');
      let isValid = true;

      rules.forEach(rule => {
        const [operator, threshold] = rule.split(':');
        const thresholdValue = parseFloat(threshold);

        switch (operator) {
          case 'min':
            isValid = isValid && value >= thresholdValue;
            break;
          case 'max':
            isValid = isValid && value <= thresholdValue;
            break;
        }
      });

      return isValid;
    }

    case 'cross': {
      // 교차 검증은 crossValidate 함수에서 처리
      return true;
    }

    case 'format': {
      // 포맷 검증 (현재는 기본 true)
      return true;
    }

    default:
      return true;
  }
}

// 숫자 값 추출
function extractNumericValue(response: KPIResponse): number | null {
  const kpi = mockKPIs.find(k => k.kpi_id === response.kpi_id);
  if (!kpi) return null;

  switch (kpi.input_type) {
    case 'Numeric':
      return (response.raw as { value: number }).value;
    
    case 'Calculation': {
      const calc = response.raw as { numerator: number; denominator: number };
      return calc.denominator ? (calc.numerator / calc.denominator) * 100 : 0;
    }
    
    case 'Checklist':
      return (response.raw as { checked: boolean }).checked ? 1 : 0;
    
    default:
      return response.normalized_score || 0;
  }
}

// 값 비교
function compareValues(source: number, target: number, operator: string): boolean {
  switch (operator) {
    case 'lt': return source < target;
    case 'lte': return source <= target;
    case 'gt': return source > target;
    case 'gte': return source >= target;
    case 'eq': return source === target;
    default: return true;
  }
}

// 완성도 체크
export function checkCompleteness(responses: Record<string, KPIResponse>, requiredKPIs: string[]): {
  isComplete: boolean;
  missing: string[];
  completion: number;
} {
  const missing: string[] = [];
  let completed = 0;

  requiredKPIs.forEach(kpiId => {
    const response = responses[kpiId];
    if (!response || (response.status === 'invalid' && response.status !== 'na')) {
      missing.push(kpiId);
    } else {
      completed++;
    }
  });

  return {
    isComplete: missing.length === 0,
    missing,
    completion: requiredKPIs.length > 0 ? (completed / requiredKPIs.length) * 100 : 0
  };
}