# Phase 2A: Data Pipeline Analysis Results

**작성일**: 2025-09-30
**목적**: V3 데이터 파이프라인 완전 검증 및 향후 작업 기준 문서
**현재 진행도**: 55% → 70% (Phase 2A 완료 시)

---

## Executive Summary

### 현재 상태
- ✅ **V3는 완전한 데이터 파이프라인 인프라를 보유**
- ✅ **데이터 플로우**: KPIDiagnosisContext → useReportDataV2 → ResultsInsightsPanelV3
- ⚠️ **검증 필요**: Week 1-2에서 구축한 cluster knowledge와 reportDataProcessor.ts 통합 여부

### 핵심 발견사항
1. **3단계 파이프라인 구조 확인**
   - Stage 1: collectData() - 응답 데이터 수집 및 검증
   - Stage 2: processData() - ProcessedKPIData[] 생성
   - Stage 3: generateReport() - ReportData 구조체 생성

2. **Fallback 메커니즘 존재**
   - reportData가 비어있을 경우 contextAxisScores를 직접 사용하는 defaultReportData 생성
   - 이는 안전장치지만, 실제로는 reportData가 정상 생성되어야 함

3. **자동 트리거 시스템**
   - KPIDiagnosisContext: responses 변경 시 2초 디바운스로 localStorage 저장
   - useReportDataV2: responses 변경 시 500ms 디바운스로 자동 재처리

4. **ProcessedData 의존성**
   - CriticalKPISection, ImportantKPISection, BenchmarkingSection, ActionPlanSection 모두 processedData 필요
   - processedData가 비어있으면 해당 섹션들이 렌더링 안 됨

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User Input Layer (KPI Diagnosis Tab)                        │
│    - User answers KPI questions (numeric, percentage, select)  │
│    - Each answer creates KPIResponse object                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. KPIDiagnosisContext (Data Source & State Manager)           │
│                                                                 │
│    State:                                                       │
│    • responses: Record<string, KPIResponse>                    │
│    • kpiData: { libraries, stageRules }                        │
│    • axisScores: { GO, EC, PT, PF, TO }                        │
│    • overallScore: number                                      │
│    • progress: { completed, total, percentage, byAxis }        │
│                                                                 │
│    Operations:                                                  │
│    • loadKPIData() from CSV                                    │
│    • calculateAxisScore() for each axis                        │
│    • Auto-save to localStorage (2s debounce)                   │
│    • trackKpiUpdate() for momentum system                      │
│                                                                 │
│    File: src/contexts/KPIDiagnosisContext.tsx (300+ lines)     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. ClusterContext (Sector & Stage Info)                        │
│                                                                 │
│    State:                                                       │
│    • sector: SectorType ('S-1' ~ 'S-5')                        │
│    • stage: StageType ('A-1' ~ 'A-5')                          │
│    • sectorLockedAt: Date                                      │
│    • stageHistory: StageHistoryEntry[]                         │
│                                                                 │
│    Mappings:                                                    │
│    • S-1: 'B2B SaaS'                                           │
│    • S-2: 'B2C 플랫폼'                                          │
│    • S-3: '이커머스'                                            │
│    • S-4: '핀테크'                                              │
│    • S-5: '헬스케어'                                            │
│                                                                 │
│    • A-1: '아이디어' (8 KPIs minimum)                          │
│    • A-2: '창업초기' (12 KPIs minimum)                         │
│    • A-3: 'PMF 검증' (15 KPIs minimum)                         │
│    • A-4: 'Pre-A' (18 KPIs minimum)                            │
│    • A-5: 'Series A+' (20 KPIs minimum)                        │
│                                                                 │
│    File: src/contexts/ClusterContext.tsx (150+ lines)          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. useReportDataV2 Hook (Processing Orchestrator)              │
│                                                                 │
│    Data Sources:                                                │
│    • const { kpis, responses, axisScores } = useKPIDiagnosis() │
│    • const { cluster } = useCluster()                          │
│                                                                 │
│    Cluster Transformation (Lines 50-56):                       │
│    • cluster.sector ('S-1') → ClusterInfo format               │
│    • clusterId: 'S-1_A-1'                                      │
│    • name: 'S-1 - A-1'                                         │
│    • stage: cluster.stage                                      │
│                                                                 │
│    Auto-trigger (Lines 218-230):                               │
│    • useEffect watches responses, axisScores                   │
│    • 500ms debounce before calling processReportDataRaw()      │
│                                                                 │
│    File: src/pages/.../hooks/useReportDataV2.tsx (391 lines)   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. ReportDataPipeline (3-Stage Processor)                      │
│                                                                 │
│    Stage 1: collectData() - Lines 142-146                      │
│    ├─ Input: kpis[], responses{}, clusterInfo                  │
│    ├─ Validates: responses exist and have values               │
│    ├─ Returns: { validResponses, partialInfo }                 │
│    └─ Error: "진단 데이터가 없습니다" if validResponses.size=0  │
│                                                                 │
│    Stage 2: processData() - Lines 156-168                      │
│    ├─ Input: kpis[], validResponses, clusterInfo               │
│    ├─ Calls: optimizedProcessor.processKPIData()               │
│    │         → reportDataProcessor.ts의 processKPIData()       │
│    ├─ Returns: ProcessedKPIData[]                              │
│    └─ ProcessedKPIData structure:                              │
│        • kpi: KPIDefinition                                    │
│        • response: KPIResponse                                 │
│        • weight: WeightInfo                                    │
│        • processedValue: NumericProcessedValue | ...           │
│        • insights: InsightData                                 │
│        • benchmarkInfo?: BenchmarkInfo                         │
│                                                                 │
│    Stage 3: generateReport() - Lines 173-177                   │
│    ├─ Input: processed[], clusterInfo, partialInfo             │
│    ├─ Builds: ReportData structure                             │
│    └─ Returns: { summary, metadata, sections, trends, ... }    │
│                                                                 │
│    File: src/services/reportDataPipeline.ts (inferred)         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. ResultsInsightsPanelV3 (Main Container & Renderer)          │
│                                                                 │
│    Data Retrieval (Lines 58-61):                               │
│    • Primary: useReportData() returns:                         │
│      - reportData: ReportData                                  │
│      - processedData: ProcessedKPIData[]                       │
│      - isLoading, error, regenerateReport, exportToPDF         │
│                                                                 │
│    • Fallback: useKPIDiagnosis() returns:                      │
│      - contextAxisScores, contextOverallScore                  │
│      - contextProgress, contextKPIs                            │
│                                                                 │
│    Fallback Logic (Lines 81-237):                              │
│    • If reportData is empty or invalid                         │
│    • Builds defaultReportData from contextAxisScores           │
│    • Uses contextOverallScore directly                         │
│                                                                 │
│    Actual Data Selection (Lines 240-242):                      │
│    const actualReportData = (reportData?.summary?.overallScore > 0)
│      ? reportData                                              │
│      : defaultReportData;                                      │
│                                                                 │
│    Rendering Sections (Lines 506-708):                         │
│    • ExecutiveSummary (always renders with actualReportData)   │
│    • OverviewDashboard (always renders)                        │
│    • CriticalKPISection (needs processedData)                  │
│    • ImportantKPISection (needs processedData)                 │
│    • BenchmarkingSection (needs processedData)                 │
│    • ActionPlanSection (needs processedData)                   │
│                                                                 │
│    File: src/pages/.../ResultsInsightsPanelV3.tsx (958 lines)  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Components Deep Dive

### 1. KPIDiagnosisContext.tsx (300+ lines)
**Role**: Central state management for all KPI diagnosis data - the ultimate SOURCE

**Location**: `src/contexts/KPIDiagnosisContext.tsx`

#### Core State (Lines 85-98)
```typescript
const [responses, setResponses] = useState<Record<string, KPIResponse>>({});
const [kpiData, setKpiData] = useState<any>(null);
const [isLoadingKPI, setIsLoadingKPI] = useState(true);

// Calculated states
const [axisScores, setAxisScores] = useState<Record<AxisKey, number>>({
  GO: 0, EC: 0, PT: 0, PF: 0, TO: 0
});
const [overallScore, setOverallScore] = useState(0);
const [previousScores, setPreviousScores] = useState<Record<AxisKey, number>>({
  GO: 0, EC: 0, PT: 0, PF: 0, TO: 0
});
```

#### KPI Data Loading (Lines 103-121)
- CSV에서 KPI 라이브러리 로드
- stageRules도 함께 로드하여 단계별 가중치 적용

#### Score Calculation (Lines 136-179)
- `calculateAxisScore()` 호출하여 각 축별 점수 계산
- 5개 축 평균으로 overallScore 계산
- responses 또는 cluster.stage 변경 시 자동 재계산

#### Progress Calculation (Lines 182-222)
- 현재 stage에 applicable한 KPI 필터링
- 완료된 KPI 개수 카운트
- 축별 진행도도 함께 계산

#### Update Response (Lines 234-249)
```typescript
const updateResponse = (kpiId: string, response: KPIResponse) => {
  trackKpiUpdate(kpiId);  // Momentum system tracking
  updateSessionActivity();

  setResponses(prev => ({
    ...prev,
    [kpiId]: response
  }));
};
```

#### Auto-save (Lines 280-288)
- 2초 디바운스로 localStorage에 저장
- Key: `kpiResponses_${cluster.sector}_${cluster.stage}`

**Critical Dependencies**:
- ClusterContext (cluster.stage, cluster.sector)
- Momentum system (trackKpiUpdate, updateSessionActivity)
- localStorage (persistence)

---

### 2. ClusterContext.tsx (150+ lines)
**Role**: Manages sector/stage information that determines KPI applicability and interpretation

**Location**: `src/contexts/ClusterContext.tsx`

#### Type System (Lines 4-5)
```typescript
export type SectorType = 'S-1' | 'S-2' | 'S-3' | 'S-4' | 'S-5';
export type StageType = 'A-1' | 'A-2' | 'A-3' | 'A-4' | 'A-5';
```

**Total Clusters**: 5 sectors × 5 stages = **25 unique clusters**

#### Sector Mapping (Lines 83-89)
```typescript
const SECTOR_INFO: Record<SectorType, string> = {
  'S-1': 'B2B SaaS',
  'S-2': 'B2C 플랫폼',
  'S-3': '이커머스',
  'S-4': '핀테크',
  'S-5': '헬스케어'
};
```

#### Stage Information (Lines 40-81)
각 단계마다:
- `minKPIs`: 최소 필수 KPI 개수 (A-1: 8개 ~ A-5: 20개)
- `typicalDuration`: 예상 소요 기간
- `keyMilestones`: 주요 마일스톤 목록

#### State Persistence (Lines 94-118)
- localStorage에서 `clusterState` 로드
- 기본값: S-1 (B2B SaaS), A-1 (아이디어)
- Sector는 한 번 선택하면 lock (sectorLockedAt)
- Stage는 변경 가능하며 stageHistory에 기록

#### Update Stage Function (Lines 127-143)
```typescript
const updateStage = (newStage: StageType) => {
  setCluster(prev => ({
    ...prev,
    stage: newStage,
    lastStageUpdate: new Date(),
    stageHistory: [
      ...prev.stageHistory,
      {
        from: prev.stage,
        to: newStage,
        changedAt: new Date(),
        reason: 'manual'
      }
    ]
  }));
};
```

**Critical Impact**:
- KPI 필터링: `kpi.applicable_stages.includes(cluster.stage)`
- 가중치 결정: stageRules에서 해당 stage의 weights 사용
- 벤치마크 기준: cluster.sector + cluster.stage로 비교 대상 결정

---

### 3. useReportDataV2.tsx (391 lines)
**Role**: Core hook that orchestrates the entire data processing pipeline

**Location**: `src/pages/startup/kpi-tabs/ResultsInsightsPanelV3/hooks/useReportDataV2.tsx`

#### Data Source Integration (Lines 46-56)
```typescript
// 컨텍스트에서 데이터 가져오기
const { kpis, responses, axisScores } = useKPIDiagnosis();
const { cluster } = useCluster();

// ClusterInfo 형태로 변환
const clusterInfo = {
  clusterId: `${cluster.sector}_${cluster.stage}`,
  name: `${cluster.sector} - ${cluster.stage}`,
  industry: 'startup',
  size: 'small',
  stage: cluster.stage
};
```

**Key Transformation**: `S-1/A-1` → `ClusterInfo` 객체로 변환하여 ReportDataPipeline에 전달

#### Pipeline Initialization (Lines 58-85)
```typescript
const pipelineRef = useRef<ReportDataPipeline | null>(null);

useEffect(() => {
  if (!pipelineRef.current) {
    const processor = new OptimizedProcessor();
    const insights = new BasicInsightGenerator();
    const pipeline = new ReportDataPipeline(processor, insights);
    pipelineRef.current = pipeline;
  }
}, []);
```

#### 3-Stage Processing Function (Lines 119-204)
```typescript
const processReportDataRaw = useCallback(async () => {
  const pipeline = pipelineRef.current;
  if (!pipeline || !clusterInfo) return;

  setIsLoading(true);
  setError(null);

  try {
    // Stage 1: 데이터 수집
    const { validResponses, partialInfo } = await pipeline.collectData(
      kpis || [],
      responses || {},
      clusterInfo
    );

    // 데이터 검증
    if (validResponses.size === 0) {
      setError('진단 데이터가 없습니다. KPI 진단을 먼저 완료해주세요.');
      setIsLoading(false);
      return;
    }

    // Stage 2: 데이터 처리 (optimizedProcessor 사용)
    const rawProcessed = await pipeline.processData(
      kpis || [],
      validResponses,
      clusterInfo
    );

    const processed = await optimizedProcessor.processKPIData(rawProcessed, {
      useCache: true,
      onProgress: (progress) => {
        console.log(`📋 Processing: ${progress.toFixed(1)}%`);
      }
    });

    setProcessedData(processed);

    // Stage 3: 레포트 생성
    const report = await pipeline.generateReport(
      processed,
      clusterInfo,
      partialInfo
    );

    setReportData(report);

    // 성공 로깅
    console.log('✅ Report generated successfully:', {
      totalKPIs: partialInfo.total,
      completedKPIs: partialInfo.completed,
      completionRate: partialInfo.completionRate,
      overallScore: report.summary.overallScore
    });

  } catch (err) {
    console.error('Report generation failed:', err);
    setError(err instanceof Error ? err.message : '레포트 생성에 실패했습니다.');
  } finally {
    setIsLoading(false);
  }
}, [kpis, responses, clusterInfo, optimizedProcessor]);
```

#### Auto-trigger Logic (Lines 218-230)
```typescript
useEffect(() => {
  // 필수 데이터 체크
  if (!responses || Object.keys(responses).length === 0) {
    return;
  }

  // 자동 처리 (500ms 디바운스)
  const timer = setTimeout(() => {
    processReportDataRaw();
  }, 500);

  return () => clearTimeout(timer);
}, [responses, axisScores, processReportDataRaw]);
```

**Critical Flow**:
1. User answers KPI → responses 업데이트
2. 500ms 후 자동으로 processReportDataRaw() 실행
3. 3단계 파이프라인 실행
4. processedData, reportData 업데이트
5. ResultsInsightsPanelV3가 자동으로 re-render

---

### 4. ResultsInsightsPanelV3.tsx (958 lines)
**Role**: Main container that orchestrates all data loading and rendering

**Location**: `src/pages/startup/kpi-tabs/ResultsInsightsPanelV3/ResultsInsightsPanelV3.tsx`

#### Data Sources (Lines 58-61)
```typescript
// Primary data source: useReportData hook
const {
  reportData,           // ReportData 구조체
  isLoading,            // 로딩 상태
  error,                // 에러 메시지
  regenerateReport,     // 수동 재생성 함수
  exportToPDF,          // PDF 내보내기 함수
  processedData         // ProcessedKPIData[] - 가장 중요!
} = useReportData();

// Fallback data source: Direct Context access
const {
  axisScores: contextAxisScores,
  overallScore: contextOverallScore,
  progress: contextProgress,
  kpis: contextKPIs
} = useKPIDiagnosis();
```

#### Debug Logging (Lines 64-71)
```typescript
useEffect(() => {
  console.log('🔍 V3 Context Data:', {
    axisScores: contextAxisScores,
    overallScore: contextOverallScore,
    progress: contextProgress,
    kpisCount: contextKPIs?.length
  });
}, [contextAxisScores, contextOverallScore, contextProgress, contextKPIs]);
```

#### Fallback Mechanism (Lines 81-237)
```typescript
const defaultReportData = useMemo(() => {
  // Context에서 가져온 실제 축별 점수 사용
  const defaultScores: Record<AxisKey, number> = {
    'GO': contextAxisScores?.GO || 0,
    'EC': contextAxisScores?.EC || 0,
    'PT': contextAxisScores?.PT || 0,
    'PF': contextAxisScores?.PF || 0,
    'TO': contextAxisScores?.TO || 0
  };

  const calculatedOverallScore = contextOverallScore || 0;
  const totalKPIs = contextKPIs?.length || (contextAxisScores ? Object.keys(contextAxisScores).length * 4 : 0);

  // 가짜 트렌드 데이터 생성 (실제로는 historical data 필요)
  const trends: Record<AxisKey, TrendData> = {
    GO: { current: defaultScores['GO'], previous: defaultScores['GO'] * 0.9, change: 10, period: '지난 달 대비' },
    EC: { current: defaultScores['EC'], previous: defaultScores['EC'] * 0.9, change: 10, period: '지난 달 대비' },
    PT: { current: defaultScores['PT'], previous: defaultScores['PT'] * 0.9, change: 10, period: '지난 달 대비' },
    PF: { current: defaultScores['PF'], previous: defaultScores['PF'] * 0.9, change: 10, period: '지난 달 대비' },
    TO: { current: defaultScores['TO'], previous: defaultScores['TO'] * 0.9, change: 10, period: '지난 달 대비' }
  };

  return {
    summary: {
      overallScore: calculatedOverallScore,
      axisScores: defaultScores,
      grade: calculateGrade(calculatedOverallScore),
      completionRate: contextProgress?.percentage || 0,
      totalKPIs: totalKPIs
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      cluster: {
        sector: 'tech',
        stage: 'seed'
      },
      dataQuality: {
        completeness: contextProgress?.percentage || 0,
        reliability: 85
      }
    },
    trends,
    insights: [],
    recommendations: []
  };
}, [contextAxisScores, contextOverallScore, contextProgress, contextKPIs]);
```

**Why Fallback Exists**: 초기 로드 시 reportData가 아직 생성되지 않았거나, 에러가 발생한 경우에도 최소한의 UI를 보여주기 위함

#### Actual Data Selection (Lines 240-242)
```typescript
const actualReportData = (reportData && reportData.summary?.overallScore > 0)
  ? reportData           // Pipeline에서 생성된 정상 데이터 사용
  : defaultReportData;   // Fallback 사용
```

#### Section Rendering (Lines 506-708)

**Always Renders** (actualReportData만 필요):
- ExecutiveSummary (Lines 506-514)
- OverviewDashboard (Lines 516-524)

**Conditionally Renders** (processedData 필요):
```typescript
// Critical KPI Section (Lines 526-543)
{processedData && processedData.length > 0 && (
  <ReportSection title="Critical Metrics Details">
    <CriticalKPISection
      processedData={processedData}
      cluster={{
        sector: actualReportData.metadata.cluster?.sector || 'tech',
        stage: actualReportData.metadata.cluster?.stage || 'seed'
      }}
    />
  </ReportSection>
)}

// Important KPI Section (Lines 545-562)
{processedData && processedData.length > 0 && (
  <ReportSection title="Key Performance Areas">
    <ImportantKPISection
      processedData={processedData}
      cluster={{...}}
    />
  </ReportSection>
)}

// Benchmarking Section (Lines 595-615)
{processedData && processedData.length > 0 && (
  <ReportSection title="Benchmarking Analysis">
    <BenchmarkingSection
      processedData={processedData}
      cluster={{...}}
      overallScore={actualReportData.summary.overallScore}
    />
  </ReportSection>
)}

// Action Plan Section (Lines 647-668)
{processedData && processedData.length > 0 && (
  <ReportSection title="Action Plan">
    <ActionPlanSection
      processedData={processedData}
      cluster={{...}}
    />
  </ReportSection>
)}
```

**Critical Observation**: processedData가 비어있으면 V3의 핵심 섹션들(Critical KPI, Benchmarking, Action Plan)이 렌더링되지 않음!

---

## Integration with Week 1-2 Foundation Layer

### Week 1-2에서 구축한 것들
1. **clusterKnowledge.ts** (NEW)
   - 25개 클러스터별 특성 데이터베이스
   - 각 클러스터마다: keyMetrics, challenges, benchmarks, successPatterns

2. **benchmarkDatabase.ts** (NEW)
   - 실제 업계 벤치마크 데이터
   - Sector × Stage별 구체적인 수치

3. **reportDataProcessor.ts** (UPDATED)
   - `processKPIData()` 함수 업데이트
   - Week 1-2에서 cluster knowledge 통합했다고 가정

### 현재 통합 지점 (검증 필요)

#### 1. useReportDataV2.tsx → reportDataProcessor.ts 연결
**File**: `src/pages/startup/kpi-tabs/ResultsInsightsPanelV3/hooks/useReportDataV2.tsx:156-168`

```typescript
// Stage 2: 데이터 처리 (optimizedProcessor 사용)
const rawProcessed = await pipeline.processData(
  kpis || [],
  validResponses,
  clusterInfo
);

const processed = await optimizedProcessor.processKPIData(rawProcessed, {
  useCache: true,
  onProgress: (progress) => {
    console.log(`📋 Processing: ${progress.toFixed(1)}%`);
  }
});
```

**Question**: `optimizedProcessor.processKPIData()`가 실제로 어떤 파일을 호출하는가?
- 예상: `src/utils/reportDataProcessor.ts`의 `processKPIData()`
- 검증 필요: 이 함수가 clusterKnowledge를 사용하는지 확인

#### 2. ClusterInfo 변환 로직
**File**: `src/pages/startup/kpi-tabs/ResultsInsightsPanelV3/hooks/useReportDataV2.tsx:50-56`

```typescript
const clusterInfo = {
  clusterId: `${cluster.sector}_${cluster.stage}`,  // 예: "S-1_A-1"
  name: `${cluster.sector} - ${cluster.stage}`,
  industry: 'startup',
  size: 'small',
  stage: cluster.stage
};
```

**Question**: clusterKnowledge.ts는 `S-1_A-1` 형식의 키를 사용하는가?
- 예상: Yes, getClusterProfile('S-1_A-1') 같은 함수가 있을 것
- 검증 필요: clusterKnowledge.ts 파일 읽어서 확인

#### 3. BenchmarkInfo 생성 지점
**File**: `src/types/reportV3.types.ts` (inferred)

```typescript
export interface ProcessedKPIData {
  kpi: KPIDefinition;
  response: KPIResponse;
  weight: WeightInfo;
  processedValue: NumericProcessedValue | SelectProcessedValue | MultiSelectProcessedValue;
  insights?: InsightData;
  benchmarkInfo?: BenchmarkInfo;  // 여기가 중요!
}

export interface BenchmarkInfo {
  industryAverage: number;
  topQuartile?: number;
  bottomQuartile?: number;
  source?: string;
  lastUpdated?: string;
}
```

**Question**: benchmarkInfo는 어디서 채워지는가?
- 예상: reportDataProcessor.ts의 processKPIData()에서 benchmarkDatabase 조회
- 검증 필요: 실제 코드 확인

---

## Verification Checklist (Next Steps)

### Phase 2A.5: 데이터 플로우 매핑 완료
- [x] KPIDiagnosisContext 분석
- [x] ClusterContext 분석
- [x] useReportDataV2 분석
- [x] ResultsInsightsPanelV3 분석
- [x] 데이터 플로우 다이어그램 작성
- [ ] **Week 1-2 통합 지점 검증** ← 현재 위치

### Phase 2A.6: Week 1-2 통합 검증
**해야 할 일**:

1. **reportDataProcessor.ts 재확인**
   ```
   File: src/utils/reportDataProcessor.ts

   확인 사항:
   - processKPIData() 함수가 clusterKnowledge를 import하는가?
   - benchmarkDatabase를 사용하는가?
   - ClusterInfo의 clusterId를 어떻게 활용하는가?
   - BenchmarkInfo를 실제로 채우는가?
   ```

2. **clusterKnowledge.ts 읽기**
   ```
   File: src/data/clusterKnowledge.ts (예상 위치)

   확인 사항:
   - 25개 클러스터 데이터가 모두 있는가?
   - getClusterProfile() 같은 함수가 있는가?
   - 키 형식이 "S-1_A-1"인가?
   ```

3. **benchmarkDatabase.ts 읽기**
   ```
   File: src/data/benchmarkDatabase.ts (예상 위치)

   확인 사항:
   - getBenchmark(clusterId, kpiId) 함수가 있는가?
   - 실제 업계 데이터가 채워져 있는가?
   ```

4. **OptimizedProcessor 클래스 확인**
   ```
   File: src/utils/dataProcessorOptimized.ts (예상)

   확인 사항:
   - processKPIData() 메서드가 reportDataProcessor를 호출하는가?
   - 캐싱 로직이 제대로 동작하는가?
   ```

### Phase 2A.7: 5개 클러스터별 테스트 데이터 생성
**목표**: 실제 사용자 입력 시나리오 시뮬레이션

테스트 케이스:
1. **S-1 (B2B SaaS) + A-1 (아이디어)**
   - 8개 KPI 입력
   - Expected: Critical/Important KPI Section 렌더링
   - Expected: Benchmarking Section에 B2B SaaS 벤치마크 표시

2. **S-2 (B2C 플랫폼) + A-3 (PMF 검증)**
   - 15개 KPI 입력
   - Expected: DAU, Retention 관련 KPI가 Critical로 표시
   - Expected: 업계 평균과 비교 데이터 표시

3. **S-3 (이커머스) + A-4 (Pre-A)**
   - 18개 KPI 입력
   - Expected: GMV, AOV 관련 KPI가 Important로 표시
   - Expected: Action Plan에 이커머스 특화 추천사항

4. **S-4 (핀테크) + A-2 (창업초기)**
   - 12개 KPI 입력
   - Expected: Compliance, Security 관련 인사이트

5. **S-5 (헬스케어) + A-5 (Series A+)**
   - 20개 KPI 입력
   - Expected: Regulation, Clinical Trial 관련 벤치마크

### Phase 2A.8: 검증 및 결과 정리
**최종 산출물**:
1. `PHASE2A-TEST-RESULTS.md` - 5개 테스트 케이스 실행 결과
2. `PHASE2A-INTEGRATION-STATUS.md` - Week 1-2 통합 완료 여부
3. `V3-COMPLETION-ROADMAP.md` 업데이트 - Phase 2A 완료 체크

---

## Known Issues & Risks

### 1. ProcessedData Empty Problem (HIGH RISK)
**Symptom**: processedData가 빈 배열이면 핵심 섹션들이 렌더링 안 됨

**Possible Causes**:
- useReportDataV2의 processReportDataRaw()가 실행되지 않음
- ReportDataPipeline의 Stage 2 (processData)에서 에러 발생
- responses가 비어있어서 validResponses.size === 0

**Debug Steps**:
1. Console에 "📋 Processing: X%" 로그가 나오는지 확인
2. Console에 "✅ Report generated successfully" 로그가 나오는지 확인
3. 만약 안 나온다면 → responses가 제대로 저장되는지 확인

### 2. Fallback Overuse (MEDIUM RISK)
**Symptom**: 항상 defaultReportData가 사용됨 (reportData가 생성 안 됨)

**Possible Causes**:
- reportData.summary.overallScore가 0
- ReportDataPipeline의 Stage 3 (generateReport)에서 에러

**Debug Steps**:
1. actualReportData === reportData인지 확인
2. reportData 객체의 내용 console.log

### 3. Cluster Knowledge Not Integrated (HIGH RISK)
**Symptom**: BenchmarkingSection에 "벤치마크 데이터가 없습니다" 표시

**Possible Causes**:
- ProcessedKPIData의 benchmarkInfo가 undefined
- reportDataProcessor.ts가 benchmarkDatabase를 호출하지 않음

**Debug Steps**:
1. processedData[0].benchmarkInfo 확인
2. reportDataProcessor.ts 재확인 필요

---

## Performance Considerations

### 1. Debounce Timings
- KPIDiagnosisContext auto-save: **2000ms**
- useReportDataV2 auto-trigger: **500ms**

**Trade-off**:
- 짧으면: 반응성 좋지만 불필요한 재계산 많음
- 길면: 사용자 대기 시간 증가

**Current Assessment**: 500ms는 적절해 보임 (사용자가 여러 KPI를 연속으로 입력할 때 마지막 입력 후 0.5초만 기다리면 됨)

### 2. ProcessedData Caching
**File**: `src/pages/startup/kpi-tabs/ResultsInsightsPanelV3/hooks/useReportDataV2.tsx:162`

```typescript
const processed = await optimizedProcessor.processKPIData(rawProcessed, {
  useCache: true,  // 캐싱 활성화
  onProgress: (progress) => {
    console.log(`📋 Processing: ${progress.toFixed(1)}%`);
  }
});
```

**Question**: 캐시 무효화 조건은 무엇인가?
- responses가 변경되면 자동으로 캐시 무효화되어야 함
- cluster.stage가 변경되면 캐시 무효화되어야 함

### 3. Lazy Loading
**File**: `src/pages/startup/kpi-tabs/ResultsInsightsPanelV3/ResultsInsightsPanelV3.tsx:18-42`

```typescript
const ExecutiveSummary = lazy(() => import('./components/ExecutiveSummary'));
const OverviewDashboard = lazy(() => import('./components/OverviewDashboard'));
const CriticalKPISection = lazy(() => import('./components/CriticalKPISection'));
const ImportantKPISection = lazy(() => import('./components/ImportantKPISection'));
const BenchmarkingSection = lazy(() => import('./components/kpi-cards/BenchmarkingSection'));
const ActionPlanSection = lazy(() => import('./components/ActionPlanSection'));
```

**Impact**: 초기 로드 속도 개선, 하지만 각 섹션 첫 렌더링 시 추가 로딩 시간

---

## Reference: ProcessedKPIData Structure

```typescript
export interface ProcessedKPIData {
  // 원본 KPI 정의
  kpi: KPIDefinition;

  // 사용자 응답
  response: KPIResponse;

  // 가중치 정보 (Critical, Important, Standard)
  weight: WeightInfo;

  // 처리된 값 (타입별로 다름)
  processedValue: NumericProcessedValue | SelectProcessedValue | MultiSelectProcessedValue;

  // AI 생성 인사이트 (optional)
  insights?: InsightData;

  // 벤치마크 정보 (optional) - Week 1-2에서 추가되어야 함
  benchmarkInfo?: BenchmarkInfo;
}

export interface NumericProcessedValue {
  value: number;
  normalizedScore: number;  // 0-100
  unit?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
}

export interface BenchmarkInfo {
  industryAverage: number;
  topQuartile?: number;
  bottomQuartile?: number;
  source?: string;        // "2024 SaaS Benchmarks Report"
  lastUpdated?: string;   // "2024-09"
}
```

**Usage in Components**:
- **NumericKPICard.tsx**: 개별 KPI 카드, benchmarkInfo로 업계 평균 비교 바 차트 표시 (Lines 62-145)
- **BenchmarkingSection.tsx**: 전체 벤치마크 분석, processedData에서 benchmarkInfo 추출하여 통계 계산 (Lines 34-91)
- **CriticalKPISection.tsx**: weight.level === 'critical'인 항목만 필터링하여 표시
- **ImportantKPISection.tsx**: weight.level === 'important'인 항목만 필터링하여 표시

---

## Next Actions

### Immediate (Phase 2A.6)
1. **Read reportDataProcessor.ts** - Week 1-2 통합 확인
2. **Read clusterKnowledge.ts** - 25개 클러스터 데이터 확인
3. **Read benchmarkDatabase.ts** - 벤치마크 데이터 확인
4. **Identify missing connections** - 통합되지 않은 부분 파악
5. **Fix integration** - 필요 시 코드 수정

### After Phase 2A (Phase 2B)
1. **AIOrchestrator 구현** - Executive Summary AI 생성
2. **Critical KPI Deep Analysis** - 고급 인사이트 생성
3. **Trend Analysis** - historical data 기반 트렌드 분석

### After Phase 2B (Phase 2C)
1. **Correlation Analysis** - KPI 간 상관관계 (예: ARPU = MRR / MAU)
2. **Risk Detection** - 클러스터별 리스크 자동 탐지
3. **Predictive Insights** - 다음 달 예측 점수

---

## Appendix: File Locations Quick Reference

| Component | File Path | Lines |
|-----------|-----------|-------|
| KPIDiagnosisContext | `src/contexts/KPIDiagnosisContext.tsx` | 300+ |
| ClusterContext | `src/contexts/ClusterContext.tsx` | 150+ |
| useReportDataV2 | `src/pages/startup/kpi-tabs/ResultsInsightsPanelV3/hooks/useReportDataV2.tsx` | 391 |
| ResultsInsightsPanelV3 | `src/pages/startup/kpi-tabs/ResultsInsightsPanelV3/ResultsInsightsPanelV3.tsx` | 958 |
| NumericKPICard | `src/pages/startup/kpi-tabs/ResultsInsightsPanelV3/components/kpi-cards/NumericKPICard.tsx` | 246 |
| BenchmarkingSection | `src/pages/startup/kpi-tabs/ResultsInsightsPanelV3/components/kpi-cards/BenchmarkingSection.tsx` | 350 |
| reportDataProcessor | `src/utils/reportDataProcessor.ts` | TBD |
| clusterKnowledge | `src/data/clusterKnowledge.ts` (예상) | TBD |
| benchmarkDatabase | `src/data/benchmarkDatabase.ts` (예상) | TBD |
| V3 Types | `src/types/reportV3.types.ts` | TBD |

---

**Document Version**: 1.0
**Last Updated**: 2025-09-30
**Next Review**: After Phase 2A.6 completion