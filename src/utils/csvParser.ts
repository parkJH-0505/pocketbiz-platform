import type { AxisKey, InputType, KPIDefinition } from '../types';

// CSV 원본 데이터 타입 정의
interface KPILibraryCSV {
  kpi_id: string;
  sector: string;
  axis: AxisKey;
  name: string;
  question: string;
  input_type: string;
  formula?: string;
  applicable_stages: string; // "A-1,A-2,A-3"
  input_fields?: string;
}

interface KPIStageRulesCSV {
  kpi_id: string;
  stage: string; // "A-1", "A-2", etc.
  weight: string; // "x1", "x2", "x3"
  ruleset_text: string;
}

interface KPIInputsCSV {
  kpi_id: string;
  field_key: string;
  field_label?: string;
}

// 파싱된 데이터 타입
export interface ParsedKPIData {
  libraries: KPIDefinition[];
  stageRules: Map<string, Map<string, StageRule>>; // kpi_id -> stage -> rule
  inputFields: Map<string, string[]>; // kpi_id -> field_keys
  inputLabels: Map<string, Record<string, string>>; // kpi_id -> field_key -> field_label
}

export interface StageRule {
  weight: 'x1' | 'x2' | 'x3';
  choices?: Choice[];
  minMax?: { min: number; max: number; minScore: number; maxScore: number };
  formula?: string;
}

export interface Choice {
  index: number;
  label: string;
  score: number;
  weight?: number; // MultiSelect용
}

// CSV 파싱 함수
export function parseCSVToKPIData(
  libraryCSV: string,
  stageRulesCSV: string,
  inputsCSV: string
): ParsedKPIData {
  // 1. KPI Library 파싱
  const libraries = parseKPILibrary(libraryCSV);
  
  // 2. Stage Rules 파싱
  const stageRules = parseStageRules(stageRulesCSV);
  
  // 3. Input Fields 파싱
  const { inputFields, inputLabels } = parseInputFields(inputsCSV);
  
  return { libraries, stageRules, inputFields, inputLabels };
}

// KPI Library CSV 파싱
function parseKPILibrary(csv: string): KPIDefinition[] {
  const lines = csv.trim().split('\n');
  // 헤더도 parseCSVLine을 사용하여 파싱해야 함
  const headerLine = lines[0].replace(/^\uFEFF/, ''); // BOM 제거
  const headers = parseCSVLine(headerLine).map(h => h.trim());
  
  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = parseCSVLine(line);
    const row = headers.reduce((obj, header, index) => {
      obj[header] = values[index]?.trim() || '';
      return obj;
    }, {} as any) as KPILibraryCSV;
    
    // applicable_stages는 이미 parseCSVLine에서 따옴표가 제거된 상태
    // 예: "A-1,A-2" -> A-1,A-2
    const stages = row.applicable_stages ? 
      row.applicable_stages.split(',').map(s => s.trim()).filter(s => s) : 
      [];
    
    // 디버깅: 처음 몇 개 KPI의 stages 확인
    if (row.kpi_id.startsWith('S1-[GO]')) {
      console.log(`Parsing ${row.kpi_id}: applicable_stages="${row.applicable_stages}" -> stages=[${stages.join(', ')}]`);
    }
    
    return {
      kpi_id: row.kpi_id,
      sector: row.sector as 'S-1',
      axis: row.axis,
      title: row.name,
      question: row.question,
      input_type: normalizeInputType(row.input_type),
      formula: row.formula || undefined,
      applicable_stages: stages,
      input_fields: row.input_fields ? row.input_fields.split(',').map(s => s.trim()) : [],
      weight: 'x1', // 기본값, 실제로는 stage rules에서 가져옴
      validation_rules: {},
      stage_specific: {},
      // 기존 mock 데이터와의 호환성을 위해 기본값 설정
      stage: 'A-2',
      applicable: true,
      evidence_required: false
    };
  });
}

// Stage Rules CSV 파싱
function parseStageRules(csv: string): Map<string, Map<string, StageRule>> {
  const stageRulesMap = new Map<string, Map<string, StageRule>>();
  
  // BOM 제거
  csv = csv.replace(/^\uFEFF/, '');
  
  // 헤더 추출
  const headerMatch = csv.match(/^([^\n\r]+)/);
  if (!headerMatch) return stageRulesMap;
  
  const headers = headerMatch[0].split(',').map(h => h.trim());
  
  // 나머지 내용에서 레코드 추출 (multi-line fields 고려)
  const content = csv.substring(headerMatch[0].length).trim();
  const records = parseCSVRecords(content);
  
  records.forEach(values => {
    if (values.length !== headers.length) return;
    
    const row = headers.reduce((obj, header, index) => {
      obj[header] = values[index]?.trim() || '';
      return obj;
    }, {} as any) as KPIStageRulesCSV;
    
    if (!stageRulesMap.has(row.kpi_id)) {
      stageRulesMap.set(row.kpi_id, new Map());
    }
    
    const kpiRules = stageRulesMap.get(row.kpi_id)!;
    const parsedRule = parseRulesetText(row.ruleset_text);
    
    kpiRules.set(row.stage, {
      weight: row.weight as 'x1' | 'x2' | 'x3',
      ...parsedRule
    });
  });
  
  console.log('Parsed stage rules:', stageRulesMap.size, 'KPIs');
  
  return stageRulesMap;
}

// Input Fields CSV 파싱
function parseInputFields(csv: string): { 
  inputFields: Map<string, string[]>, 
  inputLabels: Map<string, Record<string, string>> 
} {
  const lines = csv.trim().split('\n');
  const headerLine = lines[0].replace(/^\uFEFF/, ''); // BOM 제거
  const headers = parseCSVLine(headerLine).map(h => h.trim());
  
  const inputFieldsMap = new Map<string, string[]>();
  const inputLabelsMap = new Map<string, Record<string, string>>();
  
  lines.slice(1).filter(line => line.trim()).forEach(line => {
    const values = parseCSVLine(line);
    const row = headers.reduce((obj, header, index) => {
      obj[header] = values[index]?.trim() || '';
      return obj;
    }, {} as any) as KPIInputsCSV;
    
    // Input fields 처리
    if (!inputFieldsMap.has(row.kpi_id)) {
      inputFieldsMap.set(row.kpi_id, []);
    }
    inputFieldsMap.get(row.kpi_id)!.push(row.field_key);
    
    // Input labels 처리
    if (!inputLabelsMap.has(row.kpi_id)) {
      inputLabelsMap.set(row.kpi_id, {});
    }
    if (row.field_label) {
      inputLabelsMap.get(row.kpi_id)![row.field_key] = row.field_label;
    }
  });
  
  return { inputFields: inputFieldsMap, inputLabels: inputLabelsMap };
}

// Ruleset 텍스트 파싱
function parseRulesetText(rulesetText: string): Partial<StageRule> {
  if (!rulesetText) return {};
  
  // 3단계 Rubric 형식 체크: "0점: X 미만\n50점: X ~ Y\n100점: Z 이상"
  // 줄바꿈으로 구분된 형식 처리
  const lines = rulesetText.split('\n').map(line => line.trim()).filter(line => line);
  if (lines.length >= 3 && lines[0].includes('0점:') && lines[1].includes('50점:') && lines[2].includes('100점:')) {
    const choices: Choice[] = [];
    
    // 0점 항목 파싱
    const zeroMatch = lines[0].match(/0점:\s*(.+)/);
    if (zeroMatch) {
      choices.push({
        index: 0,
        label: zeroMatch[1].trim(),
        score: 0
      });
    }
    
    // 50점 항목 파싱
    const fiftyMatch = lines[1].match(/50점:\s*(.+)/);
    if (fiftyMatch) {
      choices.push({
        index: 1,
        label: fiftyMatch[1].trim(),
        score: 50
      });
    }
    
    // 100점 항목 파싱
    const hundredMatch = lines[2].match(/100점:\s*(.+)/);
    if (hundredMatch) {
      choices.push({
        index: 2,
        label: hundredMatch[1].trim(),
        score: 100
      });
    }
    
    if (choices.length > 0) {
      return { choices };
    }
  }
  
  // Numeric 타입: "0점: 100명 미만\n100점: 1,000명 이상"
  if (rulesetText.includes('점:') && !rulesetText.includes('1.')) {
    const minMatch = rulesetText.match(/0점:\s*([0-9,]+%?)\s*[^0-9]*미만/);
    const maxMatch = rulesetText.match(/100점:\s*([0-9,]+%?)\s*[^0-9]*이상/);
    
    if (minMatch && maxMatch) {
      const minStr = minMatch[1].replace(/[,%]/g, '');
      const maxStr = maxMatch[1].replace(/[,%]/g, '');
      const min = parseFloat(minStr);
      const max = parseFloat(maxStr);
      
      return {
        minMax: { min, max, minScore: 0, maxScore: 100 }
      };
    }
  }
  
  // Rubric/MultiSelect 타입: "1. 선택지 (점수), 2. 다른 선택지 (점수)"
  if (rulesetText.includes('1.')) {
    const choices: Choice[] = [];
    
    // 줄바꿈으로 선택지 분리
    const lines = rulesetText.split(/[,\n]/).filter(line => line.trim());
    
    lines.forEach((line) => {
      // 번호와 내용 추출: "1. 내용 (점수점)" 형식
      const match = line.match(/(\d+)\.\s*(.+?)(?:\s*\((\d+)점\))?$/);
      
      if (match) {
        const [, , labelText, scoreText] = match;
        const label = labelText.trim();
        const score = scoreText ? parseInt(scoreText) : 0;
        
        // MultiSelect 타입인지 확인
        // MultiSelect은 보통 여러 항목을 선택할 수 있고 각 항목이 가중치(weight)를 가짐
        // 점수가 100점이 아닌 경우가 대부분 (보통 5-50점 범위)
        const isMultiSelect = score > 0 && score < 100 && (
          // 레퍼런스 고객 유형
          label.includes('해외') || 
          label.includes('국내') || 
          label.includes('공공') ||
          label.includes('스타트업') ||
          // 매출원 다양성
          label.includes('구독') || 
          label.includes('정기과금') ||
          label.includes('B2B') ||
          label.includes('B2C') ||
          label.includes('B2G') ||
          label.includes('거래 수수료') ||
          label.includes('광고') ||
          label.includes('스폰서십') ||
          // 파트너십 유형
          label.includes('협회') ||
          label.includes('대기업') ||
          label.includes('채널 파트너') ||
          label.includes('엑셀러레이터') ||
          label.includes('VC') ||
          // 핵심 포지션
          label.includes('CTO') ||
          label.includes('PM') ||
          label.includes('리드') ||
          label.includes('데이터') ||
          label.includes('리서처') ||
          label.includes('마케팅') ||
          label.includes('그로스') ||
          label.includes('세일즈') ||
          label.includes('CFO') ||
          // 제품 차별화
          label.includes('특허') ||
          label.includes('독점') ||
          label.includes('네트워크') ||
          label.includes('브랜드') ||
          label.includes('속도') ||
          // 확장 메커니즘
          label.includes('시트') ||
          label.includes('사용량') ||
          label.includes('티어') ||
          label.includes('모듈') ||
          // 필수 섹션
          label.includes('Problem') ||
          label.includes('Solution') ||
          label.includes('Market') ||
          label.includes('Business Model') ||
          label.includes('Competition') ||
          label.includes('Go-to-Market') ||
          label.includes('Traction') ||
          label.includes('Team') ||
          label.includes('Financials')
        );
        
        if (isMultiSelect) {
          choices.push({
            index: choices.length,
            label: label,
            score: 0,
            weight: score
          });
        } else {
          // 일반 Rubric 타입
          choices.push({
            index: choices.length,
            label: label,
            score: score
          });
        }
      }
    });
    
    if (choices.length > 0) {
      console.log('Parsed choices:', choices.length, 'items');
      return { choices };
    }
  }
  
  return {};
}

// 입력 타입 정규화
function normalizeInputType(inputType: string): InputType {
  const normalized = inputType.toLowerCase();
  
  if (normalized.includes('numeric')) return 'Numeric';
  if (normalized.includes('calculation')) return 'Calculation';
  if (normalized.includes('rubric')) return 'Rubric';
  if (normalized.includes('stage')) return 'Stage';
  if (normalized.includes('multiselect')) return 'MultiSelect';
  if (normalized.includes('checklist')) return 'Checklist';
  
  return 'Numeric'; // 기본값
}

// CSV 라인 파싱 (쉼표로 구분된 값, 따옴표 처리)
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Multi-line CSV 레코드 파싱
function parseCSVRecords(csv: string): string[][] {
  const records: string[][] = [];
  let currentRecord: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let fieldCount = 0;
  
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const nextChar = csv[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // 이중 따옴표는 하나의 따옴표로
        currentField += '"';
        i++; // 다음 따옴표 건너뛰기
      } else {
        // 따옴표 상태 토글
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // 필드 완료
      currentRecord.push(currentField.trim());
      currentField = '';
      fieldCount++;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // 레코드 완료
      if (currentField.length > 0 || fieldCount > 0) {
        currentRecord.push(currentField.trim());
        if (currentRecord.length > 0 && currentRecord.some(f => f.length > 0)) {
          records.push([...currentRecord]);
        }
        currentRecord = [];
        currentField = '';
        fieldCount = 0;
      }
      // \r\n 처리
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else {
      currentField += char;
    }
  }
  
  // 마지막 필드와 레코드 처리
  if (currentField.length > 0 || fieldCount > 0) {
    currentRecord.push(currentField.trim());
  }
  if (currentRecord.length > 0 && currentRecord.some(f => f.length > 0)) {
    records.push(currentRecord);
  }
  
  return records;
}

