# 포켓비즈 클러스터 관리 시스템 개선 기획서

## 🎯 개선 목표
스타트업의 성장 단계(A1~A5)에 따라 동적으로 KPI를 필터링하고, 단계별 맞춤형 평가 기준을 적용하는 지능형 평가 시스템 구축

### 권한 구조
- **섹터(S1~S5)**: 온보딩 시 결정, 사용자 변경 불가 (관리자만 수정 가능)
- **단계(A1~A5)**: 사용자가 자유롭게 변경 가능 (성장에 따른 자체 업데이트)

## 📋 현재 문제점

### 1. 하드코딩된 단계 설정
- `userStage`가 'A-2'로 고정
- 사용자가 자신의 실제 단계를 선택할 수 없음
- 모든 사용자가 동일한 기준으로 평가받음

### 2. 정적인 KPI 표시
- 단계와 무관하게 모든 KPI 표시
- 불필요한 KPI로 인한 사용자 피로도 증가
- 단계별 중요도 반영 안됨

### 3. 획일적인 점수 계산
- 모든 단계에 동일한 가중치 적용
- 성장 단계별 특성 미반영
- 부정확한 벤치마킹

## 🚀 개선 방안

### Phase 1: 핵심 인프라 구축 (Sprint 1)

#### 1.1 전역 상태 관리 시스템
```typescript
// contexts/ClusterContext.tsx
interface ClusterState {
  sector: 'S-1' | 'S-2' | 'S-3' | 'S-4' | 'S-5'; // 온보딩 시 결정, 읽기 전용
  stage: 'A-1' | 'A-2' | 'A-3' | 'A-4' | 'A-5'; // 사용자가 변경 가능
  sectorLockedAt: Date; // 섹터 확정 시간
  lastStageUpdate: Date; // 마지막 단계 변경 시간
  stageHistory: StageChange[]; // 단계 변경 이력만 추적
}

interface StageChange {
  from: string;
  to: string;
  changedAt: Date;
  reason?: 'manual' | 'auto_upgrade' | 'admin_override';
}
```

#### 1.2 단계 선택 컴포넌트
```typescript
// components/StageSelector.tsx
- 현재 섹터 표시 (읽기 전용)
- 단계 드롭다운 (변경 가능)
- 단계별 특징 툴팁
- 변경 시 확인 모달
- 단계 변경 이력 표시
- 다음 단계 요구사항 안내
```

#### 1.3 KPI 필터링 엔진
```typescript
// utils/kpiFilter.ts
const filterKPIsByCluster = (
  kpis: KPIDefinition[], 
  cluster: ClusterState
): FilteredKPIs => {
  // 1. 단계별 필터링
  // 2. 섹터별 가중치 조정
  // 3. 우선순위 정렬
  return processedKPIs;
}
```

### Phase 2: 동적 평가 시스템 (Sprint 2)

#### 2.1 단계별 규칙 매핑
```typescript
// utils/stageRuleMapper.ts
const getStageSpecificRule = (
  kpiId: string,
  stage: string,
  sector: string
): StageRule => {
  // 1. 기본 규칙 로드
  // 2. 섹터별 조정 적용
  // 3. 단계별 가중치 계산
  return adjustedRule;
}
```

#### 2.2 지능형 점수 계산
```typescript
// utils/smartScoring.ts
const calculateClusterAwareScore = (
  responses: KPIResponse[],
  cluster: ClusterState
): ScoreResult => {
  // 1. 단계별 가중치 적용
  // 2. 섹터별 보정 계수
  // 3. 상대 평가 (동일 클러스터 내)
  return {
    absolute: number,
    relative: number,
    percentile: number
  };
}
```

#### 2.3 진행률 추적 시스템
```typescript
// components/ClusterProgress.tsx
- 현재 단계 필수 KPI 완료율
- 다음 단계 준비도
- 승급 조건 표시
- 예상 승급 시기
```

### Phase 3: 사용자 경험 최적화 (Sprint 3)

#### 3.1 온보딩 개선
```typescript
// pages/Onboarding.tsx
1. 섹터 결정 (최초 1회)
   - 간단한 질문으로 적합한 섹터 확정
   - 업종별 템플릿 제공
   - 섹터 확정 후 변경 불가 안내

2. 초기 단계 설정
   - 현재 상황 기반 단계 추천
   - 단계는 언제든 변경 가능 안내
   - 단계별 KPI 설명
```

#### 3.2 대시보드 강화
```typescript
// pages/Dashboard.tsx
1. 클러스터 정보 위젯
   - 현재 위치 시각화
   - 동종 업계 비교
   - 성장 경로 표시

2. 단계 전환 알림
   - 승급 조건 달성률
   - 필요 개선 사항
   - 추천 액션
```

#### 3.3 히스토리 관리
```typescript
// pages/History.tsx
1. 클러스터 변경 이력
   - 타임라인 뷰
   - 단계별 성과
   - 성장 속도 분석

2. 회귀 분석
   - 과거 데이터 기반 예측
   - 성장 패턴 인식
   - 리스크 알림
```

## 📊 기대 효과

### 정량적 효과
- KPI 입력 시간 40% 단축 (불필요한 KPI 제거)
- 평가 정확도 60% 향상 (단계별 맞춤 기준)
- 사용자 만족도 35% 증가 (개인화된 경험)

### 정성적 효과
- 성장 단계에 맞는 정확한 진단
- 명확한 성장 로드맵 제시
- 데이터 기반 의사결정 지원
- 투자자/파트너 신뢰도 향상

## 🛠 기술 스택

### Frontend
- **상태 관리**: Context API + useReducer
- **데이터 페칭**: React Query (캐싱 및 동기화)
- **폼 관리**: React Hook Form
- **애니메이션**: Framer Motion

### Backend (향후)
- **API**: GraphQL (유연한 데이터 쿼리)
- **캐싱**: Redis (클러스터별 KPI 캐싱)
- **분석**: Python (ML 기반 클러스터 추천)

## 📅 구현 일정

### Week 1-2: 기초 구축
- [ ] ClusterContext 구현
- [ ] ClusterSelector 컴포넌트
- [ ] KPI 필터링 로직
- [ ] 기본 UI/UX 개선

### Week 3-4: 핵심 기능
- [ ] 단계별 규칙 시스템
- [ ] 동적 점수 계산
- [ ] 진행률 추적
- [ ] 데이터 검증

### Week 5-6: 고급 기능
- [ ] 온보딩 플로우
- [ ] 대시보드 위젯
- [ ] 히스토리 분석
- [ ] 성능 최적화

## 🔄 반복 개선 계획

### 1차 반복 (MVP)
- 기본 클러스터 선택
- 단순 KPI 필터링
- 정적 규칙 적용

### 2차 반복 (Enhanced)
- 동적 규칙 시스템
- 상대 평가 도입
- 기본 분석 제공

### 3차 반복 (Advanced)
- ML 기반 추천
- 예측 모델링
- 자동 최적화

## 🎨 UI/UX 개선 사항

### 1. 단계 선택 UI
```
┌─────────────────────────────────┐
│  📊 성장 단계 설정              │
├─────────────────────────────────┤
│ 섹터: S-1: B2B SaaS 🔒          │
│ 단계: [A-3: PMF 검증 ▼]        │
│                                 │
│ 📈 적용 KPI: 15개               │
│ ⏱️ 예상 시간: 25분              │
│                                 │
│ ℹ️ 다음 단계(A-4) 조건:         │
│ • MAU 1,000명 이상              │
│ • MRR $10K 이상                 │
│                                 │
│ [변경 이력] [도움말] [적용]     │
└─────────────────────────────────┘
```

### 2. KPI 카드 개선
```
┌─────────────────────────────────┐
│ GO-03: 월간 활성 사용자         │
│ 🔥 A-3 핵심 지표 (x3)           │
├─────────────────────────────────┤
│ 현재 값: [        ]             │
│ 벤치마크: 1,000명 (상위 30%)    │
│                                 │
│ 💡 팁: 유료 사용자만 집계       │
└─────────────────────────────────┘
```

### 3. 진행률 표시
```
A-3 단계 진행률
━━━━━━━━━━━━━━━━━━━━━━━━━ 78%
필수 KPI: 12/15 완료
선택 KPI: 5/8 완료

다음 단계(A-4) 준비도: 45%
예상 승급: 2025년 Q2
```

## 📝 성공 지표 (KPI)

### 사용성 지표
- 평균 입력 완료 시간 < 25분
- 이탈률 < 15%
- 재방문율 > 70%

### 정확성 지표
- 클러스터 적합도 > 85%
- 점수 신뢰도 > 90%
- 예측 정확도 > 75%

### 비즈니스 지표
- MAU 성장률 > 20%
- 유료 전환율 > 8%
- NPS 점수 > 50

## 🚨 리스크 관리

### 기술적 리스크
- **복잡도 증가**: 모듈화 및 테스트 강화
- **성능 저하**: 메모이제이션 및 캐싱 적용
- **데이터 정합성**: 검증 로직 강화

### 사용자 경험 리스크
- **학습 곡선**: 단계별 온보딩 제공
- **변경 저항**: 이전 데이터 보존 옵션
- **과도한 선택지**: 스마트 기본값 제공

## 🔗 관련 문서
- [PRD.md](./PRD.md) - 제품 요구사항
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - DB 설계
- [API_SPECIFICATION.md](./API_SPECIFICATION.md) - API 명세
- [iterations/README.md](./iterations/README.md) - 개발 일정

---

작성일: 2025-01-09
작성자: Claude (AI Assistant)
검토자: 포켓비즈 개발팀