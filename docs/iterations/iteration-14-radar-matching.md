# Iteration 14: 스마트 매칭 시스템 구현 (전면 재설계)

> 최종 업데이트: 2025-01-15
> ⚠️ **전면 재설계**: 레이더 매칭 → 로드맵 기반 성장 네비게이터
> 기존 Sprint 8 + iteration-14 통합 및 개선

## 🎯 목표 재정의
**기존**: 프로그램 리스트 + 필터링 시스템
**신규**: "로드맵 기반 개인 성장 네비게이터" - 생각할 필요 없이 따라가기만 하면 되는 액션 가이드

## 📋 새로운 설계 철학

### 핵심 컨셉 변경
- **"발견"에서 "가이드"로**: 사용자가 탐색하지 않고 시스템이 제안
- **"개인 전략 컨설턴트"**: 마치 1:1 컨설팅 받는 경험
- **"예측적 인텔리전스"**: 묻기 전에 이미 분석 완료

### 3탭 구조 (기존 레이더 차트 제거)
```
🎯 지금 액션: 로드맵 기반 최적 액션 1개 집중
🔄 진행 현황: 진행 중인 프로그램 실시간 추적
📅 향후 파이프라인: 3-6개월 미래 기회 예고
```

### 데이터 모델 재설계
```typescript
// 기존 복잡한 5축 레이더 → 간단한 체크리스트
interface SimplifiedMatching {
  matchLevel: 'high' | 'medium' | 'low';
  checklist: {
    passed: string[];    // ["Series A 적합", "헬스케어 섹터"]
    failed: string[];    // ["매출 10억 필요"]
    optional: string[];  // ["특허 보유 우대"]
  };
  readiness: {
    isReady: boolean;
    prepDays: number;
    missingItems: string[];
  };
}
```

### 레거시 기능 (참고용)

> ⚠️ **주의**: 아래 내용들은 복잡도 문제로 **iteration-19**에서 단순화됨

#### ~~5축 요구사항 시스템~~ → Stage 패턴으로 대체
```typescript
// 기존 (복잡함)
requirements: {
  GO: { min: 70, ideal: 85, weight: 0.2 },
  EC: { min: 60, ideal: 80, weight: 0.25 },
  // 프로그램마다 수동 입력 필요
}

// 신규 (단순함)
requirements: {
  stage: ['Seed', 'Series A'],
  revenue: { min: 1000000000 },  // 10억
  mustHave: ['법인설립 3년이내'],
  niceToHave: ['특허보유']
}
```

### ⚠️ 레거시 매칭 엔진 → iteration-19로 이관

#### ~~복잡한 점수 계산~~ → 체크리스트 방식으로 대체
```typescript
// 기존 (복잡한 점수 계산)
const calculateMatching = (scores, requirements) => {
  const matchRate = calculateWeightedAverage(axisMatches);
  // 수학적 계산이 복잡하고 블랙박스
};

// 신규 (투명한 체크리스트)
const checklistMatching = (profile, program) => {
  const passed = [];
  const failed = [];

  if (program.requirements.stage.includes(profile.stage)) {
    passed.push('Series A 단계 적합');
  }

  if (profile.revenue >= program.requirements.revenue.min) {
    passed.push('매출 요건 충족');
  } else {
    failed.push(`매출 ${program.requirements.revenue.min/100000000}억 필요`);
  }

  return { passed, failed, optional: [...] };
};
```

> 📝 **변경 사유**: 사용자가 이해하기 쉽고 신뢰할 수 있는 명확한 기준

#### ~~우선순위 알고리즘~~ → 로드맵 기반으로 대체

**기존 문제점**:
- 마감일만으로는 진짜 중요한 기회 놓칠 수 있음
- 적합도만으로는 로드맵과 무관한 기회 추천 가능

**신규 우선순위** (iteration-19):
```typescript
const calculatePriority = (program, roadmap, profile) => {
  const roadmapContribution = 0.4; // 40% - 로드맵 기여도
  const urgency = 0.3;             // 30% - 마감일 임박도
  const fitness = 0.3;             // 30% - 기본 적합도

  return (roadmapContribution * getRoadmapScore(program, roadmap)) +
         (urgency * getUrgencyScore(program.deadline)) +
         (fitness * getFitnessScore(profile, program));
};
```

### ⚠️ UI 설계 → iteration-19로 완전 이관

#### ~~레이더 차트 중심 UI~~ → 3탭 구조로 대체

**기존 설계 문제점**:
- 레이더 차트가 복잡하고 직관적이지 않음
- 5축 점수 입력의 현실적 어려움
- 과도한 FOMO 트리거로 사용자 피로감

**신규 설계** (iteration-19):
```
🎯 지금 액션      ← 명확한 1개 액션 집중
🔄 진행 현황      ← 실시간 추적
📅 향후 파이프라인 ← 미래 계획
```

> 📋 **상세 내용**: `iteration-19-smart-matching.md` 참조

#### 프로그램 매칭 UI (v1 - 현재)
- [ ] S-A 태그 기반 필터링 🔴
  ```typescript
  // 섹터×단계 자동 필터
  const filtered = programs.filter(p => 
    p.sectors.includes(currentSector) && 
    p.stages.includes(currentStage)
  );
  ```

- [ ] 관심 유형 설정 🔴
  ```typescript
  type InterestType = '정책자금' | '투자' | 'R&D' | '글로벌' | '네트워킹';
  interface UserInterests {
    types: InterestType[];
    priority: Record<InterestType, number>; // 가중치
  }
  ```

- [ ] 레이더 오버레이 (군집 평균) 🔴
  ```javascript
  <RadarChart>
    <MyRadar data={myScores} stroke="blue" />
    <ClusterAverage data={80} stroke="gray" opacity={0.3} />
    <Legend>
      나: {myScores} | 군집 평균: 80점
    </Legend>
  </RadarChart>
  ```

#### 프로그램 매칭 UI (v2 - 계획)
- [ ] 캠페인별 요구 레이더 🟡
  ```javascript
  <RadarChart>
    <MyRadar data={myScores} />
    <ProgramRequirement data={program.requirements} dash />
    <GapArea color="red" opacity={0.2} />
  </RadarChart>
  ```

- [ ] 갭 분석 & 보완 추천 🟡
  ```typescript
  interface GapAnalysis {
    weakestAxis: AxisKey;
    gapScore: number;
    recommendedActions: BuildupProgram[];
    estimatedTime: number; // days
    estimatedCost: number;
  }
  ```

- [ ] FOMO 요소 구현 🔴
  - 남은 자리 실시간 카운터
  - D-Day 긴급도 표시
  - "놓치면 후회!" 메시지

#### CTA 버튼 동적 변경
- [ ] 적합도별 액션 가이드
  - 90%+: "지금 바로 지원" (🟢 즉시 실행)
  - 70-89%: "보완하고 지원" (🟡 개선 가이드)
  - <70%: "다음 기회 준비" (🔴 장기 플랜)

### 5. 알림 시스템

- [ ] 새로운 매칭 기회 알림
- [ ] 마감 임박 리마인더 (D-30, D-14, D-7)
- [ ] 적합도 변화 알림 (재평가 후)

## 기술 스택
- React 컴포넌트
- SVG 기반 레이더 차트
- Context API for 상태 관리
- LocalStorage for 북마크

## 구현 로드맵

### Phase 1: 기본 매칭 (1주) 🔴
1. S-A 태그 필터링 구현
2. 관심 유형 설정 UI
3. 군집 평균 레이더 오버레이

### Phase 2: 고급 매칭 (1주) 🟡
1. 캠페인별 요구사항 데이터 구축
2. 적합도 계산 엔진
3. 갭 분석 알고리즘

### Phase 3: FOMO & 액션 (3일) 🔴
1. 실시간 카운터 구현
2. 긴급도 시각화
3. 보완 프로그램 추천

## 기술 구현 메모

### 매칭 알고리즘 최적화
```typescript
// 캐싱 전략
const matchingCache = new Map<string, MatchResult>();

// 배치 처리
const batchMatching = async (startups: Startup[]) => {
  return Promise.all(
    startups.map(s => calculateMatching(s))
  );
};

// 점진적 로딩
const lazyLoadPrograms = (offset: number, limit: number) => {
  return programs.slice(offset, offset + limit);
};
```

### 레이더 차트 성능
```javascript
// Chart.js 최적화
const radarOptions = {
  animation: {
    duration: 300, // 빠른 애니메이션
  },
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    decimation: {
      enabled: true,
      algorithm: 'min-max',
    }
  }
};
```

## 성공 지표

### 정량적 지표
- [ ] 매칭 정확도 > 85%
- [ ] 프로그램 클릭률 > 20%
- [ ] "보완하고 지원" 전환율 > 15%
- [ ] 매칭 계산 시간 < 300ms
- [ ] FOMO 트리거 효과 > 30% 클릭

### 정성적 지표
- [ ] "내게 딱 맞는 프로그램만 보여준다"
- [ ] "부족한 부분이 명확히 보인다"
- [ ] "놓치면 안 될 기회를 놓치지 않게 된다"

## 리스크 및 대응
- **성능 이슈**: 캐싱, 배치 처리, 점진적 로딩
- **매칭 정확도**: A/B 테스트, 사용자 피드백 반영
- **FOMO 과부하**: 적절한 빈도 조절, 사용자 설정

## 🔄 마이그레이션 및 연관 작업

### 이관된 작업
- ✅ **iteration-19**: 전면 재설계된 스마트 매칭 구현
- ✅ **MASTER_PLAN.md Phase 6**: 4주 구현 계획

### 참고용 레거시
- **Sprint 8**: 기본 매칭 엔진 아이디어
- **iteration-16**: NBA 위젯 컨셉

### 폐기된 기능들
- ❌ 5축 레이더 차트 (복잡도 문제)
- ❌ 성공 확률 예측 (근거 불충분)
- ❌ 실시간 카운터 (과도한 FOMO)
- ❌ 축별 갭 분석 (사용자 혼란)

> 📝 **결론**: 이 문서는 **참고용 아카이브**로 보관하고, 실제 구현은 **iteration-19** 따라 진행