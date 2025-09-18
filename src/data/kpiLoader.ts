import { parseCSVToKPIData } from '../utils/csvParser';
import type { KPIDefinition } from '../types';
import { csvData } from './csvData';

// 메모리 캐시
let cachedKPIData: ReturnType<typeof parseCSVToKPIData> | null = null;


// KPI 데이터 로드
export async function loadKPIData() {
  if (cachedKPIData) {
    return cachedKPIData;
  }
  
  try {
    console.log('Loading KPI data from imported CSV files...');

    // 직접 import된 CSV 데이터 사용
    const libraryCSV = csvData.library;
    const stageRulesCSV = csvData.stageRules;
    const inputsCSV = csvData.inputs;

    // 개발 환경에서만 상세 로그 출력
    if (import.meta.env.DEV) {
      console.log('CSV data lengths:', {
        library: libraryCSV.length,
        stageRules: stageRulesCSV.length,
        inputs: inputsCSV.length
      });
    }
    
    cachedKPIData = parseCSVToKPIData(libraryCSV, stageRulesCSV, inputsCSV);
    
    console.log(`✅ KPI data loaded: ${cachedKPIData.libraries.length} KPIs, ${cachedKPIData.stageRules.size} rules`);

    // 상세 디버그 정보는 개발 환경에서만
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_KPI) {
      console.log('KPI data loaded successfully:', {
        libraries: cachedKPIData.libraries.length,
        stageRules: cachedKPIData.stageRules.size,
        inputFields: cachedKPIData.inputFields.size
      });

      // 첫 번째 KPI의 stageRules 확인
      if (cachedKPIData.libraries.length > 0) {
        const firstKPI = cachedKPIData.libraries[0];
        console.log('First KPI:', firstKPI.kpi_id, firstKPI.input_type);
        const rules = cachedKPIData.stageRules.get(firstKPI.kpi_id);
        if (rules) {
          console.log('Rules for', firstKPI.kpi_id, ':', Array.from(rules.entries()));
        }
      }
    }
    
    return cachedKPIData;
  } catch (error) {
    console.error('Failed to load KPI data:', error);
    
    // 폴백: 기존 mock 데이터 사용
    const { mockKPIs } = await import('./mockKPIs');
    return {
      libraries: mockKPIs,
      stageRules: new Map(),
      inputFields: new Map()
    };
  }
}

// 특정 축의 KPI 가져오기
export async function getKPIsByAxis(axis: string): Promise<KPIDefinition[]> {
  const data = await loadKPIData();
  return data.libraries.filter(kpi => kpi.axis === axis);
}

// 특정 단계에 적용되는 KPI 가져오기
export async function getKPIsByStage(stage: string): Promise<KPIDefinition[]> {
  const data = await loadKPIData();
  return data.libraries.filter(kpi => 
    kpi.applicable_stages?.includes(stage)
  );
}

// KPI의 단계별 규칙 가져오기
export async function getKPIStageRule(kpiId: string, stage: string) {
  const data = await loadKPIData();
  return data.stageRules.get(kpiId)?.get(stage);
}

// KPI의 입력 필드 가져오기
export async function getKPIInputFields(kpiId: string): Promise<string[]> {
  const data = await loadKPIData();
  return data.inputFields.get(kpiId) || [];
}

// KPI의 입력 필드 라벨 가져오기
export async function getKPIInputLabels(kpiId: string): Promise<Record<string, string>> {
  const data = await loadKPIData();
  return data.inputLabels.get(kpiId) || {};
}

// 캐시 클리어
export function clearKPICache() {
  cachedKPIData = null;
}