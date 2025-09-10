import Papa from 'papaparse';
import type { KPIDefinition, StageType } from '../types';

// 확장된 KPI 정의 (Stage Rules 포함)
export interface StageRule {
  stage: StageType;
  weight: 'x1' | 'x2' | 'x3';
  ruleset_text?: string;
  min_value?: number;
  max_value?: number;
  options?: Array<{ label: string; value: number }>;
}

export interface ExtendedKPIDefinition extends KPIDefinition {
  stage_rules?: StageRule[];
}

// CSV 파일 구조 인터페이스
interface KPILibraryRow {
  kpi_id: string;
  sector: string;
  axis: string;
  name: string;
  question: string;
  input_type: string;
  formula?: string;
  applicable_stages: string;
  input_fields?: string;
}

interface StageRulesRow {
  kpi_id: string;
  stage: string;
  weight: string;
  ruleset_text: string;
}

interface InputFieldsRow {
  kpi_id: string;
  field_key: string;
}

// CSV 파일 로드 및 파싱
export const loadCSVFiles = async (sector: string): Promise<{
  library: KPILibraryRow[];
  stageRules: StageRulesRow[];
  inputFields: InputFieldsRow[];
}> => {
  try {
    // CSV 파일 경로
    const basePath = `/src/S1_GO_KPI_Library_Structured_csv_bundle`;
    const libraryPath = `${basePath}/S1_GO_KPI_Library_Structured__KPI_Library.csv`;
    const rulesPath = `${basePath}/S1_GO_KPI_Library_Structured__KPI_StageRules.csv`;
    const inputsPath = `${basePath}/S1_GO_KPI_Library_Structured__KPI_Inputs.csv`;

    // 파일 로드 (실제 구현시 fetch 또는 import 사용)
    const [libraryData, rulesData, inputsData] = await Promise.all([
      fetch(libraryPath).then(res => res.text()),
      fetch(rulesPath).then(res => res.text()),
      fetch(inputsPath).then(res => res.text())
    ]);

    // CSV 파싱
    const library = Papa.parse<KPILibraryRow>(libraryData, { 
      header: true, 
      skipEmptyLines: true 
    }).data;
    
    const stageRules = Papa.parse<StageRulesRow>(rulesData, { 
      header: true, 
      skipEmptyLines: true 
    }).data;
    
    const inputFields = Papa.parse<InputFieldsRow>(inputsData, { 
      header: true, 
      skipEmptyLines: true 
    }).data;

    return { library, stageRules, inputFields };
  } catch (error) {
    console.error('CSV 파일 로드 실패:', error);
    throw error;
  }
};

// CSV 데이터를 ExtendedKPIDefinition으로 변환
export const mergeCSVData = (
  library: KPILibraryRow[],
  stageRules: StageRulesRow[],
  inputFields: InputFieldsRow[]
): ExtendedKPIDefinition[] => {
  
  return library.map(kpi => {
    // 해당 KPI의 stage rules 찾기
    const kpiRules = stageRules.filter(rule => 
      rule.kpi_id === kpi.kpi_id
    );

    // 해당 KPI의 input fields 찾기
    const kpiInputFields = inputFields
      .filter(field => field.kpi_id === kpi.kpi_id)
      .map(field => field.field_key);

    // Stage rules 파싱
    const parsedRules: StageRule[] = kpiRules.map(rule => {
      const baseRule: StageRule = {
        stage: rule.stage as StageType,
        weight: rule.weight as 'x1' | 'x2' | 'x3'
      };

      // Rubric/Stage 타입의 경우 ruleset_text 파싱
      if (kpi.input_type === 'Rubric' || kpi.input_type === 'Stage') {
        // ruleset_text를 파싱하여 options 배열로 변환
        const options = parseRulesetText(rule.ruleset_text);
        if (options.length > 0) {
          baseRule.options = options;
        } else {
          baseRule.ruleset_text = rule.ruleset_text;
        }
      }

      // Numeric 타입의 경우 min/max 값 추출 (ruleset_text에서)
      if (kpi.input_type === 'Numeric') {
        const { min, max } = extractMinMax(rule.ruleset_text);
        baseRule.min_value = min;
        baseRule.max_value = max;
      }

      return baseRule;
    });

    // ExtendedKPIDefinition 생성
    const extendedKPI: ExtendedKPIDefinition = {
      kpi_id: kpi.kpi_id,
      title: kpi.name,
      question: kpi.question,
      axis: kpi.axis as any,
      input_type: kpi.input_type,
      applicable_stages: kpi.applicable_stages
        .split(',')
        .map(s => s.trim()) as StageType[],
      formula: kpi.formula || undefined,
      input_fields: kpiInputFields.length > 0 ? kpiInputFields : undefined,
      stage_rules: parsedRules
    };

    return extendedKPI;
  });
};

// Ruleset text를 옵션 배열로 파싱
const parseRulesetText = (text: string): Array<{ label: string; value: number }> => {
  const options: Array<{ label: string; value: number }> = [];
  
  if (!text) return options;

  // 줄바꿈으로 분리하고 각 줄 파싱
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  lines.forEach(line => {
    // "숫자. 텍스트 (점수점)" 패턴 매칭
    const match = line.match(/^\d+\.\s*(.+?)\s*\((\d+)점\)/);
    if (match) {
      options.push({
        label: match[1].trim(),
        value: parseInt(match[2])
      });
    }
  });

  return options;
};

// Numeric 타입의 min/max 값 추출
const extractMinMax = (text: string): { min: number; max: number } => {
  // 기본값
  let min = 0;
  let max = 100;

  if (text) {
    // "최소: X, 최대: Y" 패턴 찾기
    const minMatch = text.match(/최소[:\s]+(\d+)/);
    const maxMatch = text.match(/최대[:\s]+(\d+)/);
    
    if (minMatch) min = parseInt(minMatch[1]);
    if (maxMatch) max = parseInt(maxMatch[1]);
  }

  return { min, max };
};

// ExtendedKPIDefinition을 CSV 형식으로 내보내기
export const exportToCSV = (kpis: ExtendedKPIDefinition[]): {
  library: string;
  stageRules: string;
  inputFields: string;
} => {
  // KPI Library CSV 생성
  const libraryRows = kpis.map(kpi => ({
    kpi_id: kpi.kpi_id,
    sector: kpi.kpi_id.split('-')[0], // S1, S2 등
    axis: kpi.axis,
    name: kpi.title,
    question: kpi.question,
    input_type: kpi.input_type,
    formula: kpi.formula || '',
    applicable_stages: kpi.applicable_stages?.join(',') || '',
    input_fields: kpi.input_fields?.join(',') || ''
  }));

  // Stage Rules CSV 생성
  const stageRulesRows: any[] = [];
  kpis.forEach(kpi => {
    kpi.stage_rules?.forEach(rule => {
      let ruleset_text = '';
      
      // 옵션을 ruleset_text로 변환
      if (rule.options && rule.options.length > 0) {
        ruleset_text = rule.options
          .map((opt, idx) => `${idx + 1}. ${opt.label} (${opt.value}점)`)
          .join(',\n');
      } else if (rule.ruleset_text) {
        ruleset_text = rule.ruleset_text;
      } else if (rule.min_value !== undefined && rule.max_value !== undefined) {
        ruleset_text = `최소: ${rule.min_value}, 최대: ${rule.max_value}`;
      }

      stageRulesRows.push({
        kpi_id: kpi.kpi_id,
        stage: rule.stage,
        weight: rule.weight,
        ruleset_text
      });
    });
  });

  // Input Fields CSV 생성
  const inputFieldsRows: any[] = [];
  kpis.forEach(kpi => {
    kpi.input_fields?.forEach(field => {
      inputFieldsRows.push({
        kpi_id: kpi.kpi_id,
        field_key: field
      });
    });
  });

  // CSV 문자열로 변환
  const library = Papa.unparse(libraryRows);
  const stageRules = Papa.unparse(stageRulesRows);
  const inputFields = Papa.unparse(inputFieldsRows);

  return { library, stageRules, inputFields };
};

// CSV 파일 다운로드
export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 전체 CSV 데이터 내보내기
export const exportAllCSVFiles = (kpis: ExtendedKPIDefinition[]) => {
  const { library, stageRules, inputFields } = exportToCSV(kpis);
  
  // 각 파일 다운로드
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(library, `KPI_Library_${timestamp}.csv`);
  downloadCSV(stageRules, `KPI_StageRules_${timestamp}.csv`);
  downloadCSV(inputFields, `KPI_InputFields_${timestamp}.csv`);
};

// CSV 파일 업로드 및 파싱
export const importCSVFiles = async (files: {
  library?: File;
  stageRules?: File;
  inputFields?: File;
}): Promise<ExtendedKPIDefinition[]> => {
  const results: {
    library?: KPILibraryRow[];
    stageRules?: StageRulesRow[];
    inputFields?: InputFieldsRow[];
  } = {};

  // 각 파일 파싱
  if (files.library) {
    const text = await files.library.text();
    results.library = Papa.parse<KPILibraryRow>(text, { 
      header: true, 
      skipEmptyLines: true 
    }).data;
  }

  if (files.stageRules) {
    const text = await files.stageRules.text();
    results.stageRules = Papa.parse<StageRulesRow>(text, { 
      header: true, 
      skipEmptyLines: true 
    }).data;
  }

  if (files.inputFields) {
    const text = await files.inputFields.text();
    results.inputFields = Papa.parse<InputFieldsRow>(text, { 
      header: true, 
      skipEmptyLines: true 
    }).data;
  }

  // 데이터 병합
  if (results.library) {
    return mergeCSVData(
      results.library,
      results.stageRules || [],
      results.inputFields || []
    );
  }

  return [];
};