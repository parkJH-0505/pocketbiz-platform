# SOURCE COLLECTION - Sprint 1-5 추출 내용
> 생성일: 2025-01-11
> 목적: Sprint 1-5에서 대시보드/탭/기능 관련 내용 수집 및 통합

## 📌 수집 방법
- Sprint 1-5 문서에서 대시보드/탭/UI 관련 내용 추출
- 중복 내용 통합
- 16,17,18과 충돌하는 내용 표시

---

## 🔍 Sprint 1: 프로젝트 설정 & 데이터 기반 구축
**대시보드/탭 관련 내용: 없음**
- 주로 백엔드 설정과 데이터베이스 스키마 구축에 집중

---

## 🔍 Sprint 2: 핵심 점수화 엔진 구현
**대시보드/탭 관련 내용: 없음**
- 점수 계산 로직과 API 엔드포인트 구축에 집중

---

## 🔍 Sprint 3: 사용자 인증 & A×S 분류 ⚠️ **중요**

### 네비게이션 구조 개편 (PRD v4.0) 🔴
> ⚠️ **충돌 가능성**: iteration-16,17,18과 일부 중복

#### 현재 구조 → 개편 구조
```typescript
// 기존 메뉴 (영문)
const currentMenu = [
  'Dashboard',
  'Assessments', 
  'Results',
  'Matches',
  'History',
  'Settings'
];

// 새로운 메뉴 (한글화 + 재구성)
const newMenu = [
  '대시보드',      // Dashboard 고도화
  'KPI 진단',      // Assessments + Results 통합
  '포켓빌드업',    // 신규 - 빌드업 프로젝트 관리
  '스마트 매칭',   // Matches 고도화
  'VDR/마이프로필' // 신규 - 문서관리 & 프로필
];
```

#### 구현 작업
1. **메뉴 아이템 변경**
   ```tsx
   const menuItems = [
     { path: '/startup/dashboard', label: '대시보드', icon: Home },
     { path: '/startup/kpi', label: 'KPI 진단', icon: ChartBar },
     { path: '/startup/buildup', label: '포켓빌드업', icon: Rocket },
     { path: '/startup/matching', label: '스마트 매칭', icon: Target },
     { path: '/startup/profile', label: 'VDR/마이프로필', icon: User }
   ];
   ```

2. **라우팅 구조 변경**
   - `/startup/assessments` → `/startup/kpi?tab=assess`
   - `/startup/results` → `/startup/kpi?tab=results`
   - `/startup/matches` → `/startup/matching`

3. **페이지 통합 작업**
   - [ ] KPI 진단 페이지 생성 (탭 구조)
   - [ ] Assessments + Results 컴포넌트 마이그레이션
   - [ ] 신규 페이지 스켈레톤 생성

4. **설정 메뉴 위치 변경**
   - [ ] 좌측 하단으로 이동 (로그아웃 버튼 위)
   - [ ] 아이콘만 표시 또는 축소 형태

### 네비게이션 UX 개선
- [ ] 현재 페이지 하이라이트 강화
- [ ] 툴팁 추가 (메뉴 설명)
- [ ] 모바일 반응형 햄버거 메뉴
- [ ] 빠른 액세스 단축키 (Alt+1~5)

### 온보딩 관련 UI
- [ ] 온보딩 플로우 UI 구현
  - 단계별 진행 표시
  - 이전/다음 네비게이션
  - 진행 상태 저장
- [ ] 섹터 선택 (S1-S5) UI
- [ ] 성장단계 진단 (A1-A5) UI

---

## 🔍 Sprint 4: KPI 입력 시스템 구현

### 축별 탭 네비게이션 (GO/EC/PT/PF/TO) 🔴
> ⚠️ **참고**: KPI 진단 페이지 내부의 서브 탭

```typescript
const axes = [
  { key: 'GO', label: 'Growth', color: 'purple' },
  { key: 'EC', label: 'Economics', color: 'green' },
  { key: 'PT', label: 'Product', color: 'orange' },
  { key: 'PF', label: 'Performance', color: 'blue' },
  { key: 'TO', label: 'Team & Org', color: 'red' }
];
```

### KPI 입력 화면 구성
- [ ] KPI 카드 리스트 렌더링
  - 현재 단계에 맞는 KPI만 표시
  - 카드 그룹핑 (관련 KPI 묶음)
  - 스크롤 위치 저장
- [ ] 진행률 표시
  - 축별 완료율
  - 전체 진행률
  - 필수 항목 체크

### 상태 관리
- [ ] KPI 응답 상태 관리 (Context/Redux)
- [ ] 자동 저장 큐 관리
- [ ] 오류 상태 처리
- [ ] 낙관적 업데이트

---

## 🔍 Sprint 5: 레이더 차트 & 결과 시각화

### 결과 대시보드 레이아웃
```typescript
interface ResultsPageLayout {
  header: {
    runId: string;
    assessmentDate: Date;
    status: string;
  };
  summary: {
    overallScore: number;
    rank: string; // 상위 %
    trend: 'up' | 'down' | 'stable';
  };
  radarChart: RadarData;
  axisDetails: AxisScore[];
  insights: Insight[];
}
```

### 결과 페이지 구성요소
- [ ] 종합 점수 표시
  - 가중 평균 점수
  - 등급 (S/A/B/C/D)
  - 전회차 대비 변화
- [ ] 축별 상세 점수
  - 점수 및 등급
  - 주요 KPI 기여도
  - 개선 필요 항목
- [ ] KPI 기여도 분석 표시
  - Top 3 강점 KPI
  - Bottom 3 약점 KPI
  - 가중치 영향도

### 시각화 컴포넌트
- [ ] 점수 게이지 차트
- [ ] 트렌드 라인 차트
- [ ] KPI 히트맵
- [ ] 진행률 바

---

## ⚠️ 충돌 및 중복 사항

### 1. KPI 진단 페이지 구조
- **Sprint 3**: 간단한 통합 언급만
- **Sprint 17**: 5개 탭 상세 구조 (진단하기/결과 보기/상세 분석/벤치마킹/액션 플랜)
- **충돌**: Sprint 3의 단순 통합 vs Sprint 17의 상세 탭 구조
- ✅ **해결**: Sprint 17을 마스터로 채택

### 2. 대시보드
- **Sprint 3**: 대시보드 메뉴만 언급
- **Sprint 6**: 기본 대시보드 v1 + Zero Thinking v2
- **iteration-16**: Zero Thinking 상세 설계
- **충돌**: 여러 버전 존재
- ✅ **해결**: iteration-16 (Zero Thinking)을 마스터로 채택

### 3. 축별 탭 (GO/EC/PT/PF/TO)
- **Sprint 4**: KPI 입력 화면의 축별 탭
- **Sprint 17**: KPI 진단 페이지의 메인 탭
- **명확화 필요**: 서로 다른 레벨의 탭
- ✅ **해결**: 
  - Sprint 17의 "진단하기" 탭 내부에
  - Sprint 4의 축별 서브탭이 존재하는 2단계 구조

---

## 📝 액션 아이템

### 즉시 처리 필요
1. Sprint 3의 네비게이션 구조를 최신으로 업데이트
2. Sprint 4의 축별 탭이 KPI 진단 내부 서브탭임을 명확화
3. Sprint 5의 결과 페이지가 Sprint 17의 "결과 보기" 탭에 해당함을 명시

### 원본 파일 정리 필요
- Sprint 3: 네비게이션 부분을 Sprint 17/18 참조로 변경
- Sprint 4: 축별 탭 설명 수정
- Sprint 5: Sprint 17 연관 명시

### 통합 권장 사항
- 대시보드: iteration-16을 마스터로
- KPI 진단: Sprint 17을 마스터로
- 신규 페이지: Sprint 18을 마스터로

---

## 🔨 충돌 해결 로그

### 2025-01-11 충돌 해결
1. **KPI 진단 페이지**: Sprint 17 채택 ✅
2. **대시보드**: iteration-16 채택 ✅
3. **축별 탭**: 2단계 구조로 명확화 ✅

### 최종 구조 결정
```
/startup/dashboard → iteration-16의 Zero Thinking 5대 위젯
/startup/kpi → Sprint 17의 5개 탭
  └─ 진단하기 탭
      └─ GO/EC/PT/PF/TO 서브탭 (Sprint 4)
  └─ 결과 보기 탭 (Sprint 5 내용 포함)
  └─ 상세 분석 탭
  └─ 벤치마킹 탭
  └─ 액션 플랜 탭
/startup/buildup → Sprint 18
/startup/matching → Sprint 14 + iteration-14
/startup/profile → Sprint 18
```