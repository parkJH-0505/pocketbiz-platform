# Iteration 14: 레이더 매칭 시스템 구현

> 최종 업데이트: 2025-01-10
> PRD v4.0 스마트 매칭과 연계

## 목표
프로그램과 스타트업을 매칭하는 레이더 비교 시스템 구축 → **스마트 매칭 기능으로 확장**

## 작업 범위

### 1. 데이터 모델 설계
- [ ] ProgramEvent 엔티티 정의
  - 기본 정보 (이름, 주관기관, 기간)
  - 5축 요구사항 (최소/이상적 점수)
  - 자격 요건 (섹터, 단계)
  - 혜택 정보

- [ ] MatchingResult 엔티티 정의
  - 매칭 점수 계산 결과
  - 축별 갭 분석
  - 개선 필요 사항

### 2. 관리자 기능 확장

#### 프로그램 관리 고도화
- [ ] 5축 요구사항 입력 UI
  ```typescript
  requirements: {
    GO: { min: 70, ideal: 85, weight: 0.2 },
    EC: { min: 60, ideal: 80, weight: 0.25 },
    // ...
  }
  ```

- [ ] 단계별 다른 요구사항 설정
- [ ] 과거 선발 데이터 입력 (성공률 계산용)
- [ ] 프로그램 일정 관리 (마감일 자동 알림)

### 3. 매칭 엔진 구현

#### 적합도 계산 알고리즘
```typescript
const calculateMatching = (
  startupScores: AxisScores,
  programReqs: ProgramRequirements
) => {
  // 1. 기본 자격 체크 (섹터, 단계)
  if (!checkEligibility()) return null;
  
  // 2. 축별 충족도 계산
  const axisMatches = calculateAxisMatches();
  
  // 3. 전체 적합도 산출
  const matchRate = calculateWeightedAverage(axisMatches);
  
  // 4. 갭 분석
  const gaps = identifyGaps();
  
  return { matchRate, gaps, recommendation };
};
```

#### 우선순위 알고리즘
- [ ] 마감일 가중치
- [ ] 적합도 가중치
- [ ] 개선 가능성 점수

### 4. 사용자 UI 구현 (스마트 매칭 연계) 🔴

#### 스마트 매칭 탭 설계 원칙
- **개인 맞춤 기회 발견**: 필요없는 것은 필터링
- **시각적 갭 분석**: 레이더 차트로 부족 요소 명확화
- **FOMO 트리거**: 긴급성과 희소성 강조

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

## 연관 작업
- **iteration-16**: 스마트 매칭 UI 구현
- **Sprint 6**: 대시보드 추천 프로그램 위젯
- **Sprint 8**: 기본 매칭 엔진