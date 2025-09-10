import type { KPIResponse, RawValue, AxisKey } from '../types';
import { mockKPIs } from '../data/mockKPIs';

// 가중치 값 변환
export function getWeightValue(weight?: string): number {
  switch (weight) {
    case 'x1': return 1;
    case 'x2': return 2;
    case 'x3': return 3;
    default: return 1;
  }
}

// KPI의 정규화된 점수 계산
export function calculateNormalizedScore(kpiId: string, value: RawValue): number {
  const kpi = mockKPIs.find(k => k.kpi_id === kpiId);
  if (!kpi) return 0;

  switch (kpi.input_type) {
    case 'Numeric': {
      const numValue = (value as { value: number }).value;
      
      // KPI의 점수 정규화 로직
      switch (kpiId) {
        case 'S1-GO-02': // TAM (시장 규모)
          if (numValue >= 1000) return 100;
          if (numValue >= 500) return 80;
          if (numValue >= 100) return 60;
          if (numValue >= 50) return 40;
          return Math.min(numValue / 50 * 40, 40);
          
        case 'S1-GO-04': // 주가입자 수          if (numValue >= 10000) return 100;
          if (numValue >= 5000) return 80;
          if (numValue >= 1000) return 60;
          if (numValue >= 100) return 40;
          return Math.min(numValue / 100 * 40, 40);
          
        case 'S1-GO-05': // MAU
          if (numValue >= 5000) return 100;
          if (numValue >= 2000) return 80;
          if (numValue >= 500) return 60;
          if (numValue >= 100) return 40;
          return Math.min(numValue / 100 * 40, 40);
          
        case 'S1-EC-02': // MRR (월간 반복 수익)
          if (numValue >= 5000) return 100; // 5000만원 이상
          if (numValue >= 1000) return 80;
          if (numValue >= 500) return 60;
          if (numValue >= 100) return 40;
          return Math.min(numValue / 100 * 40, 40);
          
        case 'S1-EC-04': // CAC (고객 획득 비용)
          // 낮을수록 좋음
          if (numValue <= 10) return 100;
          if (numValue <= 50) return 80;
          if (numValue <= 100) return 60;
          if (numValue <= 200) return 40;
          return Math.max(0, 40 - (numValue - 200) / 10);
          
        case 'S1-PT-03': // 서비스 가용성
          return Math.min(numValue, 100);
          
        case 'S1-PF-01': // 누적 투자금          if (numValue >= 10) return 100; // 10억원 이상
          if (numValue >= 5) return 80;
          if (numValue >= 1) return 60;
          if (numValue >= 0.5) return 40;
          return Math.min(numValue / 0.5 * 40, 40);
          
        case 'S1-PF-02': // 런웨이          if (numValue >= 18) return 100;
          if (numValue >= 12) return 80;
          if (numValue >= 6) return 60;
          if (numValue >= 3) return 40;
          return Math.min(numValue / 3 * 40, 40);
          
        case 'S1-TO-02': // 팀 규모
          if (numValue >= 20) return 100;
          if (numValue >= 10) return 80;
          if (numValue >= 5) return 60;
          if (numValue >= 3) return 40;
          return Math.min((numValue - 1) / 2 * 40, 40);
          
        default:
          return Math.min(numValue, 100);
      }
    }
    
    case 'Calculation': {
      const calc = value as { numerator: number; denominator: number };
      if (!calc.denominator) return 0;
      const percentage = (calc.numerator / calc.denominator) * 100;
      return Math.min(Math.max(percentage, 0), 100);
    }
    
    case 'Checklist': {
      return (value as { checked: boolean }).checked ? 100 : 0;
    }
    
    case 'Stage':
    case 'Rubric': {
      const choiceIndex = (value as { choice_index: number }).choice_index;
      const choice = kpi.stage_cell?.choices[choiceIndex];
      return choice?.score || 0;
    }
    
    case 'MultiSelect': {
      const selected = (value as { selected_indices: number[] }).selected_indices;
      const totalScore = selected.reduce((sum, idx) => {
        const choice = kpi.stage_cell?.choices[idx];
        return sum + (choice?.value || 0);
      }, 0);
      return Math.min(totalScore, 100);
    }
    
    default:
      return 0;
  }
}

// 축별 점수 계산
export function calculateAxisScore(responses: Record<string, KPIResponse>, axis: AxisKey): number {
  const axisKPIs = mockKPIs.filter(kpi => kpi.axis === axis);
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  axisKPIs.forEach(kpi => {
    const response = responses[kpi.kpi_id];
    if (!response || response.status === 'na') return;
    
    const weight = getWeightValue(kpi.weight);
    const score = response.status === 'valid' ? response.normalized_score || 0 : 0;
    
    weightedSum += score * weight;
    totalWeight += weight;
  });
  
  if (totalWeight === 0) return 0;
  
  return Math.round(weightedSum / totalWeight * 10) / 10; // 소수점 한자리
}

// 전체 점수 계산
export function calculateTotalScore(responses: Record<string, KPIResponse>): number {
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
  const axisScores = axes.map(axis => calculateAxisScore(responses, axis));
  const totalScore = axisScores.reduce((sum, score) => sum + score, 0) / axes.length;
  
  return Math.round(totalScore * 10) / 10;
}

// KPI 기여??분석
export function getTopContributors(responses: Record<string, KPIResponse>, axis: AxisKey, count: number = 3) {
  const axisKPIs = mockKPIs.filter(kpi => kpi.axis === axis);
  
  const contributions = axisKPIs.map(kpi => {
    const response = responses[kpi.kpi_id];
    if (!response || response.status !== 'valid') return null;
    
    const weight = getWeightValue(kpi.weight);
    const score = response.normalized_score || 0;
    const contribution = score * weight;
    
    return {
      kpi_id: kpi.kpi_id,
      name: kpi.title,
      contrib: contribution,
      score,
      weight
    };
  }).filter(Boolean);
  
  // 기여도순으로 정렬
  contributions.sort((a, b) => (b?.contrib || 0) - (a?.contrib || 0));
  
  return contributions.slice(0, count);
}
