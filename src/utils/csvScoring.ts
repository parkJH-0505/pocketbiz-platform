import type { KPIResponse, RawValue, AxisKey } from '../types';
import { loadKPIData, getKPIStageRule } from '../data/kpiLoader';
import type { StageRule } from '../utils/csvParser';

// 가중치 값 변환
export function getWeightValue(weight?: string): number {
  switch (weight) {
    case 'x1': return 1;
    case 'x2': return 2;
    case 'x3': return 3;
    default: return 1;
  }
}

// CSV 기반 ?�규???�수 계산
export async function calculateNormalizedScore(
  kpiId: string, 
  value: RawValue, 
  userStage: string
): Promise<number> {
  try {
    const stageRule = await getKPIStageRule(kpiId, userStage);
    if (!stageRule) return 0;

    // Rubric/MultiSelect/Checklist 타입 - choices 기반
    if (stageRule.choices && Array.isArray(stageRule.choices)) {
      // Rubric 타입 - 단일 선택
      if (typeof value === 'object' && 'selectedIndex' in value) {
        const choice = stageRule.choices[value.selectedIndex];
        
        // MultiSelect 가중치 점수 적용
        if (choice?.weight !== undefined) {
          return Math.min((choice.weight / 15) * 100, 100); // 최대 15점을 100점으로 정규화
        }
        
        // Rubric 타입 - score 직접 적용
        return choice?.score || 0;
      }
      
      // MultiSelect/Checklist 타입 - 다중 선택
      if (typeof value === 'object' && 'selectedIndices' in value) {
        const indices = value.selectedIndices as number[];
        const totalScore = indices.reduce((sum, idx) => {
          const choice = stageRule.choices?.[idx];
          return sum + (choice?.score || 0);
        }, 0);
        return totalScore;
      }
    }
    
    // Numeric ?�??- minMax 기반 ?�형 보간
    if (stageRule.minMax && typeof value === 'object' && 'value' in value) {
      const numValue = (value as { value: number }).value;
      const { min, max, minScore, maxScore } = stageRule.minMax;
      
      if (numValue <= min) return minScore;
      if (numValue >= max) return maxScore;
      
      // ?�형 보간
      const ratio = (numValue - min) / (max - min);
      return minScore + ratio * (maxScore - minScore);
    }
    
    // Calculation ?�??- 계산??결과�?percentage�?처리
    if (typeof value === 'object' && 'calculatedValue' in value) {
      const calcValue = (value as { calculatedValue: number }).calculatedValue;
      return Math.min(Math.max(calcValue * 100, 0), 100); // percentage로 점수로 변환
    }
    
    return 0;
  } catch (error) {
    console.error(`Error calculating score for ${kpiId}:`, error);
    return 0;
  }
}

// CSV 기반 축별 ?�수 계산
export async function calculateAxisScore(
  responses: Record<string, KPIResponse>, 
  axis: AxisKey,
  userStage: string = 'A-2'
): Promise<number> {
  try {
    const kpiData = await loadKPIData();
    
    // 해당 축과 관계된 해당하는 KPI 필터링
    const axisKPIs = kpiData.libraries.filter(kpi => 
      kpi.axis === axis && 
      kpi.applicable_stages?.includes(userStage)
    );
    
    if (axisKPIs.length === 0) return 0;
    
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    for (const kpi of axisKPIs) {
      const response = responses[kpi.kpi_id];
      if (!response || response.status === 'na') continue;
      
      // 단계별 규칙 가져오기
      const stageRuleMap = kpiData.stageRules.get(kpi.kpi_id);
      const stageRule = stageRuleMap?.get(userStage);
      if (!stageRule) continue;
      
      const weight = getWeightValue(stageRule.weight);
      const normalizedScore = await calculateNormalizedScore(kpi.kpi_id, response.raw, userStage);
      
      totalWeightedScore += normalizedScore * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  } catch (error) {
    console.error(`Error calculating axis score for ${axis}:`, error);
    return 0;
  }
}

// 종합 ?�수 계산
export async function calculateTotalScore(
  responses: Record<string, KPIResponse>,
  userStage: string = 'A-2'
): Promise<number> {
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
  
  const axisScores = await Promise.all(
    axes.map(axis => calculateAxisScore(responses, axis, userStage))
  );
  
  const validScores = axisScores.filter(score => score > 0);
  
  if (validScores.length === 0) return 0;
  
  return validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
}

// 최고 기여 KPI 찾기
export async function getTopContributors(
  responses: Record<string, KPIResponse>, 
  axis: AxisKey, 
  limit: number = 3,
  userStage: string = 'A-2'
): Promise<Array<{ kpi_id: string; name: string; score: number; weight: number }>> {
  try {
    const kpiData = await loadKPIData();
    
    const axisKPIs = kpiData.libraries.filter(kpi => 
      kpi.axis === axis && 
      kpi.applicable_stages?.includes(userStage)
    );
    
    const contributors = [];
    
    for (const kpi of axisKPIs) {
      const response = responses[kpi.kpi_id];
      if (!response || response.status === 'na') continue;
      
      const stageRule = kpiData.stageRules.get(kpi.kpi_id)?.get(userStage);
      if (!stageRule) continue;
      
      const weight = getWeightValue(stageRule.weight);
      const score = await calculateNormalizedScore(kpi.kpi_id, response.raw, userStage);
      
      contributors.push({
        kpi_id: kpi.kpi_id,
        name: kpi.title,
        score: score,
        weight: weight
      });
    }
    
    // 가중치 * ?�수 기�??�로 ?�렬
    return contributors
      .sort((a, b) => (b.score * b.weight) - (a.score * a.weight))
      .slice(0, limit);
      
  } catch (error) {
    console.error(`Error getting top contributors for ${axis}:`, error);
    return [];
  }
}

// Calculation ?�??KPI??�?계산
export async function calculateFormulaValue(
  kpiId: string,
  formula: string,
  allResponses: Record<string, KPIResponse>
): Promise<number | null> {
  try {
    // 공식?�서 변??추출 (?? {s1_go_05_mau} / {s1_go_04_total_users})
    const variables = formula.match(/\{([^}]+)\}/g);
    if (!variables) return null;
    
    let processedFormula = formula;
    
    for (const variable of variables) {
      const fieldKey = variable.slice(1, -1); // 중괄???�거
      
      // ?�당 ?�드�?가�?KPI ?�답 찾기
      const response = Object.values(allResponses).find(r => 
        typeof r.raw === 'object' && 'fieldKey' in r.raw && r.raw.fieldKey === fieldKey
      );
      
      if (!response || typeof response.raw !== 'object' || !('value' in response.raw)) {
        return null; // ?�요??값이 ?�으�?계산 불�?
      }
      
      const value = (response.raw as { value: number }).value;
      processedFormula = processedFormula.replace(variable, value.toString());
    }
    
    // ?�전???�식 계산
    try {
      return Function(`"use strict"; return (${processedFormula})`)();
    } catch {
      return null;
    }
  } catch (error) {
    console.error(`Error calculating formula for ${kpiId}:`, error);
    return null;
  }
}
