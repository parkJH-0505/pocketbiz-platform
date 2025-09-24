# Iteration 26: 대시보드 단순화 및 재구성

## 📝 개요
**목표**: 사용자 피드백 반영한 심플하고 포커스된 대시보드
**기간**: 1일
**우선순위**: High
**작성일**: 2025-09-24

## 🎯 핵심 변경사항

### 1. 레이아웃 단순화
- **기존**: 캘린더(60%) + 3개 하단 컴포넌트
- **변경**: 캘린더(75%) + VC 추천(25%) + 플로팅 버튼

### 2. 컴포넌트 통합
- GrowthMomentumTracker → CompanyVitalSigns에 통합
- UrgentActionCenter → 삭제 완료 (Phase 1.5)

### 3. 데이터 전략
- WeeklyVCRecommendation: 더미 데이터 유지 (실제 VC 데이터 확보 어려움)
- 나머지: 실제 Context 데이터 연동

## 🏗️ 구현 계획

### Phase A: Dashboard.tsx 레이아웃 변경 (30분)

#### 작업 내용
```typescript
// 1. Import 수정
// GrowthMomentumTracker 제거

// 2. 레이아웃 구조 변경
<div className="max-w-7xl mx-auto p-6">
  {/* 상단: 확장된 캘린더 (75%) */}
  <motion.section
    className="mb-6"
    style={{ minHeight: '600px' }}
  >
    <InteractiveCalendarCenter />
  </motion.section>

  {/* 하단: VC 추천 (가로 전체) */}
  <motion.section className="w-full">
    <WeeklyVCRecommendation />
  </motion.section>
</div>
```

### Phase B: WeeklyVCRecommendation 가로 레이아웃 (30분)

#### 변경 사항
1. 카드 레이아웃: 세로 → 가로 배치
2. 그리드: `grid-cols-1` → `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
3. 모바일: 가로 스크롤 또는 캐러셀
4. 높이 제한: `max-h-48` 적용

#### 유지 사항
- 더미 VC 데이터 (현재 하드코딩된 상태 유지)
- 관심 표시 기능 (NotificationContext 연동)

### Phase C: CompanyVitalSigns 확장 (1시간)

#### 통합할 GrowthMomentumTracker 기능
```typescript
// 성장 모멘텀 계산 로직
const momentum = useMemo(() => {
  const totalProjects = activeProjects.length + completedProjects.length;
  const completionRate = totalProjects > 0
    ? (completedProjects.length / totalProjects) * 100
    : 0;

  const scoreChange = overallScore - (previousScores?.overall || 0);

  return {
    scoreChange,
    completionRate,
    targetScore: 85,
    remainingToTarget: Math.max(0, 85 - overallScore)
  };
}, [overallScore, previousScores, activeProjects, completedProjects]);
```

#### UI 구조
- 탭 1: 회사 생체신호 (기존)
- 탭 2: 성장 추적 (GrowthMomentumTracker 데이터)
- 또는 스크롤 가능한 단일 뷰

### Phase D: InteractiveCalendarCenter 버그 수정 (30분)

#### 1. addEventToCalendar 함수 오류 해결
```typescript
// DashboardInteractionContext에서 import
import { useDashboardInteraction } from '../../contexts/DashboardInteractionContext';

const { addEventToCalendar } = useDashboardInteraction();
```

#### 2. 불필요한 버튼 제거
- ❌ "즉시 처리" → 삭제
- ❌ "항목 확인" → 삭제
- ❌ "문서 확인" → 삭제
- ✅ "캘린더 추가" → ScheduleContext 저장으로 변경

#### 3. 실제 라우팅 연결
```typescript
// 상세 분석 버튼
onClick={() => navigate('/startup/kpi?tab=insights')}

// 진단 계속 버튼
onClick={() => navigate('/startup/kpi?tab=assess')}
```

### Phase E: 테스트 및 정리 (30분)

#### 체크리스트
- [ ] 레이아웃 비율 확인 (75:25)
- [ ] WeeklyVCRecommendation 가로 배치 확인
- [ ] CompanyVitalSigns 통합 데이터 표시 확인
- [ ] addEventToCalendar 드래그&드롭 동작 확인
- [ ] 모바일 반응형 테스트
- [ ] 불필요한 console.log 제거
- [ ] GrowthCalendarPremium 테스트 더미 데이터 제거

## 🎨 최종 대시보드 구조

```
┌─────────────────────────────────────────────────┐
│                                                 │
│         📅 인터랙티브 캘린더 센터                │
│              (75% 높이)                         │
│                                                 │
│  - 드래그&드롭 이벤트 관리                       │
│  - 스마트매칭 + 빌드업 일정 통합                 │
│  - 실시간 일정 업데이트                          │
│                                                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│        💼 이주의 주목할 투자자 (가로)            │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│ │ VC 1 │ │ VC 2 │ │ VC 3 │ │ VC 4 │           │
│ └──────┘ └──────┘ └──────┘ └──────┘           │
└─────────────────────────────────────────────────┘

                                    [📊] <- 플로팅 버튼
                                    회사 생체신호
                                    (통합된 KPI + 성장 추적)
```

## 📊 예상 결과

### 장점
1. **심플한 구조**: 2개 주요 영역 + 플로팅 버튼
2. **캘린더 중심**: 일정 관리가 메인 워크플로우
3. **정보 집약**: 플로팅 버튼에 KPI와 성장 정보 통합
4. **유연성**: VC 데이터는 추후 실제 데이터로 교체 가능

### 위험 요소
1. GrowthMomentumTracker 통합 시 정보 과부하 가능성
2. 플로팅 패널이 너무 길어질 수 있음

### 해결 방안
1. 탭 구조 또는 아코디언으로 정보 구조화
2. 핵심 지표만 표시하고 상세는 링크로 연결

## 🚀 다음 단계

### 완료 후 고려사항
1. GrowthCalendarPremium의 테스트 더미 데이터 제거
2. 모든 컴포넌트의 실제 데이터 연동 확인
3. 성능 최적화 (React.memo, useMemo 활용)
4. 사용자 온보딩 플로우 추가

### 향후 개선 가능 영역
1. VC 추천: 실제 투자자 데이터베이스 연동
2. AI 기반 일정 추천 기능
3. 팀 협업 기능 (댓글, 공유 등)

## ✅ 완료 기준

- [ ] Dashboard.tsx 레이아웃 변경 완료
- [ ] WeeklyVCRecommendation 가로 배치 완료
- [ ] CompanyVitalSigns에 성장 추적 통합 완료
- [ ] InteractiveCalendarCenter 오류 수정 완료
- [ ] 모바일 반응형 정상 작동
- [ ] 전체 통합 테스트 완료

---

**작성자**: Development Team
**검토자**: Product Manager
**승인**: Pending