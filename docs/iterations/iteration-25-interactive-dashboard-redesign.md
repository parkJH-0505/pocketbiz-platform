# Iteration 25: 인터랙티브 대시보드 재설계 (수정됨)

## 📝 프로젝트 개요

**목표**: 사용자 중심의 인터랙티브 대시보드 구현
**기간**: 9일 (기획 1일 + 구현 8일) → **수정: 추가 2일 연장**
**우선순위**: High
**담당**: 개발팀
**최종 수정**: 2024-09-24 (Phase 1 완료 후 사용자 피드백 반영)

### 🎯 핵심 목표 (수정됨)
- "이벤트 발견 → 액션 → 트래킹" 중심의 사용자 워크플로우 구현
- 드래그&드롭 기반 직관적 일정 관리 시스템
- 실제 데이터 기반의 개인화된 대시보드 (하드코딩 제거)
- **변경**: ~~통합된 4개 핵심 컴포넌트~~ → **3개 핵심 컴포넌트로 단순화**
- **새로 추가**: 캘린더 중심의 통합된 이벤트 관리 시스템

## 🏗️ 현재 상황 분석

### 기존 대시보드 문제점
1. **분산된 정보**: 5개 독립적 컴포넌트로 인한 인지 부하
2. **수동적 경험**: 정보 확인만 가능, 즉시 액션 불가능
3. **숨겨진 KPI**: 플로팅 버튼으로만 접근 가능한 핵심 정보
4. **캘린더 우선순위 부족**: 하단 배치로 인한 접근성 저하

### ✅ Phase 1 완료된 변경사항
- ✅ `TodaysActionCompact.tsx` → 삭제 완료
- ✅ `GrowthInsights.tsx` → 삭제 완료 (회사 생체신호로 통합)
- ❌ `WeeklyVCRecommendation.tsx` → **복원됨** (사용자 요청으로 하단에 유지)
- ❌ `ProfileCard.tsx` → **복원됨** (StartupLayout import 에러 해결)
- ✅ `KPIRadarPremium.tsx` → 삭제 완료 (회사 생체신호로 통합)

### 🔄 사용자 피드백 반영된 수정사항
1. **정보 과부하 해결**: 3개 컴포넌트로 축소 (회사 생체신호는 플로팅 버튼으로)
2. **WeeklyVCRecommendation 복원**: 하단에 별도 섹션으로 유지
3. **UrgentActionCenter 재검토**: 기능 중복으로 인한 통합 검토 필요

## 🎨 새로운 대시보드 설계 (수정됨)

### 기존 설계 (Phase 1 완료)
```
┌─────────────────────────────────────────────────────────────┐
│                🎯 인터랙티브 캘린더 + 이벤트 센터            │
│                        (상단 60%)                           │
└─────────────────────────────────────────────────────────────┘
├─────────────────────┬───────────────────────────────────────┤
│🚨 긴급 액션 센터     │📈 성장 모멘텀 트래커                  │
│    50%              │           50%                        │
└─────────────────────┴───────────────────────────────────────┘
├─────────────────────────────────────────────────────────────┤
│                💼 이주의 주목할 투자자                       │
│                    (하단 전체 폭)                           │
└─────────────────────────────────────────────────────────────┘
📊 회사 생체신호: 플로팅 버튼 (우측 하단)
```

### 🆕 수정된 최종 설계
```
┌─────────────────────────────────────────────────────────────┐
│            🎯 확장된 인터랙티브 캘린더 + 이벤트 센터          │
│                     (상단 + 중단 70%)                       │
│  ┌──────────────────────┬─────────────────────────────────┐ │
│  │   📅 성장 캘린더      │   📋 통합 이벤트 패널           │ │
│  │   (드래그 드롭존)     │   ├ 스마트매칭 이벤트           │ │
│  │   + 프로젝트 할일     │   ├ 긴급/마감임박 항목         │ │
│  │                      │   └ 프로젝트 필수 문서          │ │
│  └──────────────────────┴─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
├─────────────────────┬───────────────────────────────────────┤
│📈 성장 모멘텀 트래커 │💼 이주의 주목할 투자자                │
│    50%              │           50%                        │
└─────────────────────┴───────────────────────────────────────┘
📊 회사 생체신호: 플로팅 버튼 (우측 하단)
```

### 반응형 레이아웃
- **데스크톱 (1200px+)**: 4개 컴포넌트 최적 배치
- **태블릿 (768-1199px)**: 2+1+1 그리드 구조
- **모바일 (~767px)**: 세로 스택 배치

## ⚠️ 작업 전 필수 확인 사항

**각 Phase 작업 시작 전 반드시 아래 검증을 수행하세요:**

### 🔍 Phase별 사전 검증 체크리스트

#### **모든 Phase 공통 검증**
```bash
# 1. 현재 프로젝트 상태 확인
git status
git log --oneline -10  # 최근 변경사항 확인

# 2. Context 파일들 존재 및 변경 확인
ls -la src/contexts/KPIDiagnosisContext.tsx
ls -la src/contexts/BuildupContext.tsx
ls -la src/contexts/VDRContext.tsx

# 3. 기존 대시보드 파일들 상태 확인
ls -la src/pages/startup/Dashboard.tsx
ls -la src/components/dashboard/
```

#### **Phase별 특화 검증**

**Phase 1 전 확인:**
- [ ] 삭제 예정 컴포넌트들이 실제 존재하는지 확인
- [ ] 다른 곳에서 참조하고 있지 않은지 import 검색
- [ ] Dashboard.tsx의 현재 구조 재확인

**Phase 2 전 확인:**
- [ ] Context Hook들의 현재 인터페이스 확인 (`useKPIDiagnosis`, `useBuildupContext`, `useVDRContext`)
- [ ] `comprehensiveEvents.ts` 파일 위치 및 구조 확인
- [ ] `transformSmartMatchingEvent` 함수 위치 및 시그니처 확인
- [ ] localStorage 관련 storage.ts 유틸 확인

**Phase 3 전 확인:**
- [ ] `GrowthCalendarPremium` 컴포넌트 현재 props 인터페이스 확인
- [ ] `useUnifiedCalendar` Hook 존재 및 반환값 확인
- [ ] KPI 관련 계산 함수들 위치 확인 (`calculateAxisScore`, `getPreviousSnapshot`)
- [ ] 프로젝트 긴급도 계산 로직 확인 (`getUrgentProjects`)

**Phase 4 전 확인:**
- [ ] 기존 DashboardProvider 존재 확인
- [ ] 현재 라우팅 구조 확인 (`/startup/dashboard` 경로)
- [ ] Tailwind CSS 클래스 및 디자인 시스템 확인

**Phase 5 전 확인:**
- [ ] 각 컴포넌트별 실제 데이터 연동 상태 확인
- [ ] Context 변경 시 리렌더링 동작 확인
- [ ] localStorage 저장/로드 정상 동작 확인

### 🚨 변경 감지 시 대응 방안

#### **Context 인터페이스 변경 시:**
```typescript
// 1. 변경된 인터페이스 재확인
interface KPIDiagnosisContextType {
  // 현재 실제 타입 정의 확인 필요
}

// 2. 컴포넌트에서 사용하는 필드들 매핑 업데이트
const {
  /* 실제 존재하는 필드명들로 업데이트 */
} = useKPIDiagnosis();
```

#### **데이터 구조 변경 시:**
```typescript
// 1. 실제 데이터 구조 console.log로 확인
console.log('Current data structure:', { axisScores, overallScore, progress });

// 2. 컴포넌트 로직을 실제 구조에 맞게 조정
// 3. 타입 정의 업데이트
```

#### **파일 위치 변경 시:**
```bash
# 1. 파일 검색
find src -name "*.tsx" -o -name "*.ts" | grep -E "(Context|Calendar|Event)"

# 2. import 경로 업데이트
# 3. 관련 유틸 함수들 위치 재확인
```

### 📋 각 Phase 시작 전 실행할 검증 스크립트

```bash
#!/bin/bash
# verification-script.sh

echo "🔍 Phase 시작 전 검증 중..."

echo "1. Context 파일들 확인:"
for context in "KPIDiagnosisContext" "BuildupContext" "VDRContext"; do
  if [ -f "src/contexts/${context}.tsx" ]; then
    echo "✅ ${context}.tsx 존재"
    echo "   마지막 수정: $(stat -c %y src/contexts/${context}.tsx)"
  else
    echo "❌ ${context}.tsx 파일 없음"
  fi
done

echo -e "\n2. 대시보드 관련 파일들 확인:"
if [ -f "src/pages/startup/Dashboard.tsx" ]; then
  echo "✅ Dashboard.tsx 존재"
  echo "   현재 import된 컴포넌트들:"
  grep -n "import.*from.*components/dashboard" src/pages/startup/Dashboard.tsx
else
  echo "❌ Dashboard.tsx 파일 없음"
fi

echo -e "\n3. 데이터 소스 파일들 확인:"
for file in "comprehensiveEvents.ts" "unifiedCalendar.utils.ts" "storage.ts"; do
  found_file=$(find src -name "$file" -type f)
  if [ -n "$found_file" ]; then
    echo "✅ $file 위치: $found_file"
  else
    echo "❌ $file 파일 없음"
  fi
done

echo -e "\n4. 최근 Git 변경사항:"
git log --oneline -5

echo -e "\n✅ 검증 완료. 위 정보를 확인한 후 작업을 진행하세요."
```

### 🔧 실시간 데이터 검증 방법

각 컴포넌트 구현 시 실제 데이터를 먼저 확인:

```typescript
// 컴포넌트 최상단에 임시 디버깅 코드 추가
const DebugDataLogger = () => {
  const kpiData = useKPIDiagnosis();
  const buildupData = useBuildupContext();
  const vdrData = useVDRContext();

  useEffect(() => {
    console.group('🔍 실제 데이터 구조 확인');
    console.log('KPI Data:', kpiData);
    console.log('Buildup Data:', buildupData);
    console.log('VDR Data:', vdrData);
    console.groupEnd();
  }, [kpiData, buildupData, vdrData]);

  return null;
};

// 각 컴포넌트에서 사용
const CompanyVitalSigns = () => {
  return (
    <>
      <DebugDataLogger />
      {/* 실제 컴포넌트 구현 */}
    </>
  );
};
```

---

## 🔧 구현 계획

### ✅ Phase 1: 기존 구조 정리 (완료됨 - 수정사항 반영)

**실제 완료된 작업:**
- ✅ `TodaysActionCompact.tsx` 삭제 완료
- ✅ `GrowthInsights.tsx` 삭제 완료
- ✅ `KPIRadarPremium.tsx` 삭제 완료
- ❌ `WeeklyVCRecommendation.tsx` 복원됨 (사용자 요청)
- ❌ `ProfileCard.tsx` 복원됨 (import 에러 해결)
- ✅ 새 컴포넌트들 생성 완료:
  - `InteractiveCalendarCenter.tsx` (placeholder)
  - `CompanyVitalSigns.tsx` (placeholder)
  - `UrgentActionCenter.tsx` (placeholder) → **삭제 예정**
  - `GrowthMomentumTracker.tsx` (placeholder)
  - `DashboardInteractionContext.tsx` (placeholder)

**🔄 추가 수정 필요사항:**
- ❗ `UrgentActionCenter.tsx` 제거 (기능 중복)
- 🔧 `InteractiveCalendarCenter.tsx` 확장 및 통합 기능 구현

### Phase 1.5: 설계 수정 적용 (0.5일) - 현재 진행 중

**목표**: 사용자 피드백 반영하여 UrgentActionCenter 제거 및 통합 설계 적용

**작업 목록:**
1. ✅ UrgentActionCenter 제거
   - Dashboard.tsx에서 import 및 사용 제거
   - UrgentActionCenter.tsx 파일 삭제
   - 레이아웃을 2개 컴포넌트 그리드로 변경

2. 🔧 InteractiveCalendarCenter 확장 설계
   - 크기 확대 (상단 + 중단 70% 차지)
   - 우측 패널에 통합 이벤트 기능 추가:
     - 기존: 스마트매칭 이벤트만
     - 추가: 긴급/마감임박 항목, 프로젝트 필수 문서

3. 🔧 레이아웃 재조정
   - 하단: GrowthMomentumTracker + WeeklyVCRecommendation (50:50)
   - 플로팅: CompanyVitalSigns 유지

### Phase 2: 확장된 InteractiveCalendarCenter 구현 (2일)

**⚠️ Phase 2 시작 전 필수 확인:**
- [ ] Context Hook들의 실제 반환 타입과 필드명 재확인
- [ ] `comprehensiveEvents` 데이터 구조 및 필드명 변경 여부 확인
- [ ] `transformSmartMatchingEvent` 함수의 현재 시그니처 확인
- [ ] localStorage 키 이름들의 충돌 여부 확인

#### 2.1 DashboardInteractionContext 구현
```typescript
interface DashboardInteractionContextType {
  // 드래그&드롭 상태 관리
  draggedEvent: SmartMatchingEvent | null;
  setDraggedEvent: (event: SmartMatchingEvent | null) => void;
  hoveredDay: string | null;
  setHoveredDay: (day: string | null) => void;

  // 이벤트 상태 관리
  interestedEvents: Set<string>;
  dismissedEvents: Set<string>;

  // 액션 함수들
  addEventToCalendar: (event: SmartMatchingEvent, targetDate: Date) => Promise<boolean>;
  markEventInterested: (eventId: string) => void;
  dismissEvent: (eventId: string) => void;

  // UI 상태 관리
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  modalEvent: any | null;
  showEventModal: (event: any) => void;
  hideModal: () => void;
}
```

#### 2.2 실제 데이터 연동 로직
```typescript
// KPI 데이터 연동
const { axisScores, overallScore, previousScores, progress } = useKPIDiagnosis();

// 프로젝트 데이터 연동
const { activeProjects, completedProjects, getUrgentProjects } = useBuildupContext();

// VDR 데이터 연동
const { documents } = useVDRContext();

// 스마트매칭 이벤트 연동
const smartMatchingEvents = comprehensiveEvents.map(result => ({
  ...result.event,
  matchingScore: result.score,
  daysUntilDeadline: result.daysUntilDeadline,
  urgencyLevel: result.urgencyLevel
}));
```

### Phase 3: 컴포넌트별 구현 (4일)

**⚠️ Phase 3 시작 전 필수 확인:**
- [ ] `GrowthCalendarPremium` 컴포넌트의 현재 props와 인터페이스 확인
- [ ] `useUnifiedCalendar` Hook이 여전히 존재하고 작동하는지 확인
- [ ] KPI 계산 관련 함수들의 위치와 시그니처 변경 여부 확인
- [ ] 프로젝트 상태 값들 (`'active'`, `'completed'` 등) 실제 사용 중인 값 확인

#### 3.1 InteractiveCalendarCenter (1일)

**🔍 3.1 시작 전 추가 확인:**
- [ ] `GrowthCalendarPremium`의 현재 props: `enableDragDrop`, `onEventClick`, `onDropEvent` 지원 여부
- [ ] `useUnifiedCalendar`가 반환하는 `events` 배열의 실제 구조 확인
- [ ] 기존 캘린더의 이벤트 추가 방식 (`addUnifiedCalendarEvent` 함수 존재 여부)

**핵심 기능:**
- 기존 `GrowthCalendarPremium` 확장
- 스마트매칭 이벤트 드래그&드롭 추가
- 이벤트 필터링 (카테고리, 긴급도, 검색)
- 원클릭 캘린더 추가 기능

**주요 데이터 소스:**
```typescript
// 기존 캘린더 이벤트
const { events } = useUnifiedCalendar();

// 스마트매칭 이벤트 (실제 데이터)
const smartEvents = comprehensiveEvents.filter(result =>
  !dismissedEvents.has(result.event.id)
);

// 드래그&드롭 상태
const { draggedEvent, addEventToCalendar } = useDashboardInteraction();
```

#### 3.2 CompanyVitalSigns (1일)

**🔍 3.2 시작 전 추가 확인:**
- [ ] `useKPIDiagnosis()` 반환값의 실제 필드명 확인 (`axisScores`, `overallScore`, `previousScores`, `progress`)
- [ ] `getPreviousSnapshot()` 함수 존재 여부 및 반환 구조 확인
- [ ] `useBuildupContext()`의 프로젝트 배열 구조 확인
- [ ] 축별 라벨링 함수 또는 상수 존재 여부 확인

**통합된 KPI 정보:**
- 종합 건강도 점수 (실제 `overallScore`)
- 5축 미니 레이더 차트
- 점수 변화 추세 (실제 `previousScores` 비교)
- 프로젝트 현황 요약
- 진단 완료율 표시

**주요 데이터 소스:**
```typescript
// KPI 진단 데이터 (실제)
const {
  axisScores,      // { GO: 85, EC: 72, PT: 81, PF: 65, TO: 74 }
  overallScore,    // 78.2
  previousScores,  // 이전 측정값
  progress        // { completed: 45, total: 67, percentage: 67 }
} = useKPIDiagnosis();

// 프로젝트 현황 (실제)
const { activeProjects, completedProjects } = useBuildupContext();

// 점수 변화 계산 (실제 로직)
const scoreChanges = Object.entries(axisScores).map(([axis, current]) => ({
  axis,
  current,
  change: current - (previousScores[axis] || 0),
  trend: current > (previousScores[axis] || 0) ? 'up' : 'down'
}));
```

#### 3.3 UrgentActionCenter (1일)

**🔍 3.3 시작 전 추가 확인:**
- [ ] `getUrgentProjects()` 함수의 실제 반환값과 urgency 판단 로직 확인
- [ ] VDR 문서의 `projectId` 필드 존재 및 매핑 방식 확인
- [ ] `comprehensiveEvents`의 `daysUntilDeadline` 계산 방식 확인
- [ ] 프로젝트별 필요 문서 수 기준 재확인 (현재 3개로 가정)

**실시간 긴급 상황 감지:**
- 마감임박 스마트매칭 이벤트 (D-12 이내)
- 위험 프로젝트 상황 (`getUrgentProjects()` 활용)
- VDR 업로드 필요 항목
- KPI 진단 미완료 알림

**주요 데이터 소스:**
```typescript
// 긴급 스마트매칭 이벤트 (실제)
const urgentEvents = comprehensiveEvents.filter(
  result => result.daysUntilDeadline <= 12 && result.daysUntilDeadline > 0
);

// 위험 프로젝트 (실제)
const urgentProjects = getUrgentProjects(); // BuildupContext에서 제공

// VDR 업로드 상태 (실제)
const documentsNeeded = activeProjects.filter(project => {
  const projectDocs = documents.filter(doc => doc.projectId === project.id);
  return projectDocs.length < 3; // 프로젝트당 최소 문서 수
});

// KPI 진단 상태 (실제)
const kpiIncomplete = progress.percentage < 100;
```

#### 3.4 GrowthMomentumTracker (1일)

**🔍 3.4 시작 전 추가 확인:**
- [ ] 이전 점수 비교를 위한 `previousScores` 데이터의 실제 구조와 계산 방식 확인
- [ ] 프로젝트 완료율 계산 시 사용할 상태값들 재확인 (`'completed'`, `'active'` 등)
- [ ] 목표 점수 85점의 비즈니스 근거 재확인 또는 동적 계산 방식 검토
- [ ] 월간/주간 성과 추적을 위한 시간 기준 확인

**성장 추적 지표:**
- 점수 변화량 (실제 이전 진단과 비교)
- 프로젝트 완료율
- 목표 달성 진행률
- 개선된 축 표시

**주요 데이터 소스:**
```typescript
// 성장 모멘텀 계산 (실제 데이터)
const momentum = useMemo(() => {
  const avgPrevScore = Object.values(previousScores).reduce((sum, score) => sum + score, 0) / 5;
  const scoreChange = overallScore - avgPrevScore;

  const totalProjects = activeProjects.length + completedProjects.length;
  const completionRate = totalProjects > 0 ? (completedProjects.length / totalProjects) * 100 : 0;

  return {
    scoreChange,
    completionRate,
    targetScore: 85,
    remainingToTarget: Math.max(0, 85 - overallScore),
    diagnosisProgress: progress.percentage
  };
}, [overallScore, previousScores, activeProjects, completedProjects, progress]);
```

### Phase 4: Dashboard.tsx 통합 (1일)

**⚠️ Phase 4 시작 전 필수 확인:**
- [ ] 기존 `DashboardProvider`의 실제 구현 상태와 제공하는 기능 확인
- [ ] 현재 라우팅 경로와 Dashboard 컴포넌트의 실제 위치 확인
- [ ] Tailwind CSS 설정 상태와 사용 가능한 클래스들 확인
- [ ] 기존 Context Provider들의 중첩 구조 확인하여 충돌 방지

#### 4.1 새로운 Dashboard 구조
```typescript
const Dashboard = () => {
  return (
    <DashboardProvider>
      <DashboardInteractionProvider>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* 최상단: 인터랙티브 캘린더 (60% 높이) */}
            <div className="h-96">
              <InteractiveCalendarCenter />
            </div>

            {/* 하단: 3개 컴포넌트 그리드 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-80">
              <CompanyVitalSigns />
              <UrgentActionCenter />
              <GrowthMomentumTracker />
            </div>
          </div>
        </div>

        {/* 전역 모달 및 알림 */}
        <EventDetailModal />
        <ToastNotifications />
      </DashboardInteractionProvider>
    </DashboardProvider>
  );
};
```

### Phase 5: 테스트 및 최적화 (1일)

**⚠️ Phase 5 시작 전 필수 확인:**
- [ ] 각 컴포넌트별 실제 데이터 연동 상태 최종 점검
- [ ] Context 변경 시 예상치 못한 리렌더링 발생 여부 확인
- [ ] localStorage 키 충돌 및 데이터 무결성 확인
- [ ] 전체 워크플로우 (`이벤트 발견 → 액션 → 트래킹`) 테스트 준비

#### 5.1 기능 테스트
- [ ] 스마트매칭 이벤트 드래그&드롭 → 캘린더 추가
- [ ] KPI 진단 완료 → 회사 생체신호 실시간 업데이트
- [ ] 프로젝트 상태 변경 → 긴급 액션 센터 반영
- [ ] VDR 문서 업로드 → 긴급 액션 알림 변화
- [ ] 이벤트 관심표시 → localStorage 저장/로드

#### 5.2 성능 최적화
- [ ] Context 변경 시 불필요한 리렌더링 방지
- [ ] 드래그&드롭 애니메이션 최적화
- [ ] localStorage 읽기/쓰기 최적화
- [ ] 컴포넌트별 메모이제이션 적용

#### 5.3 사용성 테스트
- [ ] 캘린더 우선 워크플로우 자연스러운지 확인
- [ ] 긴급 상황 즉시 인지 가능한지 확인
- [ ] 드래그&드롭 직관적인지 확인
- [ ] 모바일 반응형 정상 작동 확인

## 📊 실제 데이터 연동 명세

### Context 데이터 활용
```typescript
// KPIDiagnosisContext (검증됨)
- axisScores: Record<AxisKey, number> // 실제 축별 점수
- overallScore: number // 실제 종합 점수
- previousScores: Record<AxisKey, number> // 이전 진단 점수
- progress: { completed, total, percentage } // 실제 진단 완료율

// BuildupContext (검증됨)
- activeProjects: Project[] // 실제 진행 프로젝트
- completedProjects: Project[] // 실제 완료 프로젝트
- getUrgentProjects(): Project[] // 실제 긴급 프로젝트

// VDRContext (검증됨)
- documents: VDRDocument[] // 실제 업로드 문서들

// Smart Matching (검증됨)
- comprehensiveEvents: MatchingResult[] // 실제 20개 이벤트
- daysUntilDeadline, urgencyLevel, score 필드 존재
```

### localStorage 활용
```typescript
// 사용자 이벤트 상태 저장
- 'dashboard_interested_events': string[] // 관심 이벤트 ID
- 'dashboard_dismissed_events': string[] // 무시한 이벤트 ID

// 기존 storage.ts 활용
- assessmentStorage.getCurrentRunId() // 현재 진단 ID
- assessmentStorage.getResponses() // 진단 응답들
```

## 🎯 예상 결과물

### 사용자 경험 개선
1. **발견**: 상단 캘린더에서 스마트매칭 이벤트 즉시 확인
2. **액션**: 드래그&드롭으로 관심 이벤트 캘린더에 바로 추가
3. **추적**: 하단 컴포넌트들에서 실시간 진행 상황 모니터링
4. **대응**: 긴급 상황 발생 시 즉시 인지 및 대응 가능

### 기술적 개선
- **정보 밀도**: 5개 → 4개 컴포넌트로 집약
- **실시간성**: 실제 Context 데이터 기반 즉시 반영
- **상호작용**: 수동 확인 → 능동적 액션 가능
- **일관성**: 통합된 디자인 시스템과 상태 관리

### 비즈니스 임팩트
- **사용자 참여도**: 드래그&드롭 인터랙션으로 참여 유도
- **전환율**: 이벤트 발견에서 신청까지 마찰 감소
- **만족도**: 개인화된 실시간 정보로 신뢰성 증가
- **효율성**: 캘린더 중심 워크플로우로 시간 절약

## 🚨 위험 요소 및 대응

### 기술적 위험
- **Context 성능**: useMemo, useCallback으로 최적화
- **드래그&드롭 호환성**: 최신 브라우저 HTML5 API 활용
- **데이터 동기화**: Context 변경 시점 명확히 정의

### 사용성 위험
- **학습 곡선**: 드래그&드롭 사용법 온보딩 필요
- **모바일 경험**: 터치 기반 인터랙션 별도 구현
- **정보 과부하**: 컴포넌트별 핵심 정보만 선별 표시

## 📈 성공 지표

### 개발 완료 기준
- [ ] 4개 컴포넌트 모두 실제 데이터 연동 완료
- [ ] 드래그&드롭 기능 정상 작동
- [ ] 실시간 데이터 업데이트 확인
- [ ] 모바일 반응형 정상 작동
- [ ] 성능 최적화 완료

### 사용자 경험 지표
- 캘린더 이벤트 추가율 증가
- 긴급 액션 아이템 처리율 증가
- 대시보드 체류 시간 증가
- KPI 진단 완료율 증가

## 📚 참고 자료 및 의존성

### 현재 프로젝트에서 확인 필요한 핵심 파일들
```
src/contexts/
├── KPIDiagnosisContext.tsx     # KPI 데이터 제공
├── BuildupContext.tsx          # 프로젝트 데이터 제공
├── VDRContext.tsx             # 문서 데이터 제공
└── DashboardContext.tsx       # 기존 대시보드 Context (있는 경우)

src/components/dashboard/
├── GrowthCalendarPremium.tsx  # 기존 캘린더 컴포넌트
└── [기타 삭제 예정 컴포넌트들]

src/data/smartMatching/
├── comprehensiveEvents.ts     # 스마트매칭 이벤트 데이터
└── [관련 타입 정의 파일들]

src/utils/
├── unifiedCalendar.utils.ts   # 캘린더 유틸리티
├── storage.ts                 # localStorage 유틸리티
└── diagnosticHistory.ts       # KPI 히스토리 관련
```

### 사전 검증이 특히 중요한 항목들
1. **Context Hook 인터페이스**: 필드명 변경이나 타입 변화 감지
2. **이벤트 데이터 구조**: `comprehensiveEvents`의 실제 필드들
3. **Calendar 컴포넌트**: 현재 지원하는 props와 이벤트 핸들러
4. **localStorage 키**: 기존 키들과의 충돌 방지

### 각 Phase 완료 시 확인 사항
- **Phase 1**: 삭제 후 import 오류 없음
- **Phase 2**: Context 연동 정상 작동
- **Phase 3**: 각 컴포넌트별 실제 데이터 표시
- **Phase 4**: 전체 통합 후 레이아웃 정상
- **Phase 5**: 사용자 시나리오 완전 작동

---

**작성일**: 2025-09-24
**업데이트**: 필요시 수정
**상태**: 구현 대기

> ⚠️ **중요**: 이 문서의 모든 기술적 가정들은 실제 코드베이스와 다를 수 있습니다. 각 Phase 시작 전 반드시 현재 상태를 재확인하고 필요시 계획을 수정하세요.