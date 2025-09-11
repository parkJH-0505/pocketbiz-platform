# SOURCE_COLLECTION.md - 파편화된 기능/탭/대시보드 수집

> 작성일: 2025-01-10
> 목적: Sprint 1-10 문서에서 대시보드, 탭, 기능 관련 내용 취합 및 충돌 분석

## Sprint 1-5 수집 내용

### Sprint 1: 기본 React 프로젝트 셋업 (iteration/1.md)
*대시보드/탭 관련 내용 없음 - 인프라 설정 중심*

### Sprint 2: 데이터베이스 및 모델 설계 (iteration/2.md)
*대시보드/탭 관련 내용 없음 - 데이터 모델 중심*

### Sprint 3: 사용자 인증 & A×S 분류 (iteration/3.md)

#### 네비게이션 구조 개편 (PRD v4.0) 🔴
- **최종 메뉴 구조**:
  ```typescript
  const navigationMenu = [
    '대시보드',      // iteration-16 Zero Thinking
    'KPI 진단',      // Sprint 17 (5개 탭)
    '포켓빌드업',    // Sprint 18
    '스마트 매칭',   // Sprint 14 + iteration-14
    'VDR/마이프로필' // Sprint 18
  ];
  ```

- **연관 작업 참조**:
  - Sprint 17: KPI 진단 페이지 통합 (5개 탭 구조)
  - Sprint 18: 포켓빌드업, VDR/마이프로필 페이지
  - iteration-16: 대시보드 Zero Thinking 설계

### Sprint 4: KPI 입력 시스템 구현 (iteration/4.md)

#### 축별 서브탭 구조
- **명확화**: Sprint 17의 "진단하기" 탭 내부의 서브탭
  ```typescript
  // KPI 진단 > 진단하기 탭 > 축별 서브탭
  const axisSubTabs = [
    { key: 'GO', label: 'Growth', color: 'purple' },
    { key: 'EC', label: 'Economics', color: 'green' },
    { key: 'PT', label: 'Product', color: 'orange' },
    { key: 'PF', label: 'Performance', color: 'blue' },
    { key: 'TO', label: 'Team & Org', color: 'red' }
  ];
  ```

### Sprint 5: 레이더 차트 & 결과 시각화 (iteration/5.md)

#### 결과 대시보드
- **연관**: Sprint 17의 "결과 보기" 탭에 구현
- Sprint 5의 결과 시각화는 해당 탭의 핵심 컴포넌트
  ```typescript
  interface ResultsTabContent {
    header: { runId, assessmentDate, status };
    summary: { overallScore, rank, trend };
    radarChart: RadarData;
    axisDetails: AxisScore[];
    insights: Insight[];
  }
  ```

## Sprint 6-10 수집 내용

### Sprint 6: 기본 대시보드 & 히스토리 (iteration/6.md)

#### 대시보드 관련
- **메인 대시보드 v1 (기본)** ✅
  - 대시보드 레이아웃
  - 현재 A×S 상태 표시
  - 최신 진단 요약
  - To-do 리스트 (미답변 KPI)
  - Quick Stats 카드
  - 추천 프로그램 위젯

- **대시보드 고도화 v2 (PRD v4.0)** 🔴
  - Zero Thinking Dashboard 원칙
  - **5대 핵심 위젯**:
    1. 내 현재 위치 위젯 (클러스터, 점수, 레이더차트)
    2. 이번 주 일정 위젯 (미팅, 마감일, 마일스톤)
    3. NBA (Next Best Action) 위젯 (AI 추천, ROI 계산)
    4. 추천 프로그램 위젯 (FOMO 강화, 실시간 남은 자리)
    5. 진행중인 빌드업 위젯 (프로젝트 진행률, PM 정보)

- **완료 기준**:
  - 3분 룰: 월요일 아침 3분 안에 이번 주 계획 완성
  - Zero Thinking: 생각없이 따라가기만 하면 되는 UX
  - FOMO 효과: 긴급 프로그램 클릭률 > 30%
  - NBA 실행률: 추천 액션 실행률 > 25%
  - 일일 재방문율: DAU/MAU > 40%

#### 진단 히스토리
- 회차별 진단 목록
- 타임라인 시각화
- 점수 추이 차트
- 회차별 비교 기능
- 진단 상태 관리 (임시저장, 재개, 완료)

#### 알림 시스템
- 알림 데이터 모델
- 알림 목록 UI
- 실시간 알림 (WebSocket)
- 알림 설정 관리

### Sprint 7: 프로그램 관리 시스템 (iteration/7.md)
*대시보드/탭 관련 내용 없음 - 프로그램 데이터 모델 및 관리 시스템 중심*

### Sprint 8: 스마트 매칭 엔진 (iteration/8.md)
*대시보드/탭 관련 내용 없음 - 매칭 알고리즘 및 룰 엔진 중심*

#### 매칭 결과 표시 (대시보드 위젯과 연관)
- 추천 프로그램 카드 UI
- 적합도 및 근거 표시
- 마감일 임박 알림
- 신청 링크 연결

### Sprint 9: Admin Console 기초 (iteration/9.md)

#### Admin 대시보드
- 시스템 현황 위젯 (총 사용자/조직 수, 활성 진단 수)
- KPI 사용 통계 (응답률, 입력 시간, 오류 빈도)
- 버전 관리 시스템

#### Admin 라우팅
- /admin/* 경로 보호
- 권한별 메뉴 표시

### Sprint 10: 고급 검증 & 품질 관리 (iteration/10.md)

#### 품질 대시보드
- 데이터 품질 지표 (완성도, 정확도, 일관성, 적시성)
- 실시간 모니터링 (오류 발생, 검증 규칙 위반, 시스템 상태)
- 품질 개선 추천

## Sprint 11-13 수집 내용

### Sprint 11: 관리자(Admin) 기능 구현 (iteration/11.md)

#### Admin 대시보드
- **메인 대시보드**
  - 핵심 지표 카드
  - 실시간 차트
  - 알림 센터
- **스타트업 대시보드**
  - 고급 필터 (섹터, 단계, 점수, 날짜)
  - 정렬 옵션 (이름, 점수, 성장률, 활동)
- **품질 대시보드**
  - 완성도, 일관성, 신뢰도 지표

#### Admin UI 컴포넌트
- KPI 목록 페이지 (테이블 뷰, 필터/정렬/검색)
- 가중치 매트릭스 뷰 (5×5 그리드 드래그앤드롭)
- 리포트 빌더 (차트 라이브러리, Export)
- 관리자 레이아웃, 데이터 테이블, 폼 빌더

### Sprint 12: 파트너 기능 구현 (iteration/12.md)

#### 파트너 대시보드
- **메인 대시보드**
  - 프로그램 현황 카드
  - 지원자 통계
  - 최근 활동
- **성과 대시보드**
  - 핵심 지표, 목표 대비 실적, 트렌드 분석

#### 파트너 UI 구조
- 파트너 레이아웃
- 대시보드 위젯
- 고급 검색 인터페이스 (다중 필터, 저장된 검색)
- 프로그램 생성 마법사
- 비교 도구 (멀티 선택, 나란히 비교)

### Sprint 13: 핵심 기능 완성 및 최적화 (iteration/13.md)

#### UI/UX 개선 ✅
- **글래스모피즘 디자인 시스템** (완료)
  - 반투명 배경, 블러 효과, 호버 애니메이션
  - KPI ID 툴팁 이동, 계산식 컴팩트 표시
  - 인라인 레이아웃, 실시간 피드백

#### 반응형 디자인
- 2열 그리드 레이아웃 ✅
- 모바일 최적화 (터치 인터페이스, 반응형 레이아웃)
- 태블릿 지원 (멀티 컬럼 뷰, 제스처)

#### KPI 인터페이스
- 축별 그룹핑 (시각적 구분, 접기/펼치기, 진행률)
- 우선순위 정렬 (가중치별, 필수/선택 구분)
- 평가 이력 (타임라인 뷰, 버전 비교, 롤백)

## Sprint 17-18 수집 내용

### Sprint 17: KPI 진단 통합 페이지 (iteration/17.md)

#### 5개 탭 구조 🔴
```typescript
// KPI 진단 페이지의 메인 탭 구조
const kpiTabs = [
  { key: 'assess', label: '진단하기' },    // KPI 입력 폼
  { key: 'results', label: '결과 보기' },   // 결과 시각화
  { key: 'analysis', label: '상세 분석' },  // 축별 분석
  { key: 'benchmark', label: '벤치마킹' },  // 업계 비교
  { key: 'action', label: '액션 플랜' }     // 실행 계획
];
```

#### 주요 컴포넌트
- KPIDiagnosisPage (통합 컨테이너)
- AssessmentPanel (KPI 입력 폼)
- ResultsPanel (레이더 차트, AI 인사이트)
- DetailAnalysisPanel (What-if 시뮬레이터)
- BenchmarkPanel (업계 비교)
- ActionPlanPanel (로드맵 자동 생성)

#### 라우팅 변경
- 기존: `/startup/assessments`, `/startup/results`
- 신규: `/startup/kpi?tab=assess`, `/startup/kpi?tab=results`
- 통합 경로: `/startup/kpi`

### Sprint 18: 신규 페이지 구현 (iteration/18.md)

#### 포켓빌드업 페이지
- **3개 탭 구조**:
  ```typescript
  const buildupTabs = [
    { key: 'ongoing', label: '진행중', badge: count },
    { key: 'catalog', label: '카탈로그' },
    { key: 'completed', label: '완료 내역' }
  ];
  ```
- **컴포넌트**: OngoingProjects, BuildupCatalog, CompletedProjects
- **경로**: `/startup/buildup`

#### VDR/마이프로필 페이지
- **4개 탭 구조**:
  ```typescript
  const profileTabs = [
    { key: 'company', label: '회사 프로필' },
    { key: 'documents', label: '문서 관리' },
    { key: 'sharing', label: '공유 현황' },
    { key: 'investors', label: '관심 투자자' }
  ];
  ```
- **컴포넌트**: CompanyProfile, DocumentManager, ShareStatus, InterestedInvestors
- **Public URL**: `pocketbiz.io/@{companyName}`
- **경로**: `/startup/profile`

## 충돌 분석 및 해결

### 주요 충돌 사항

#### 1. 대시보드 구현 충돌
- **충돌**: Sprint 6 vs iteration-16
  - Sprint 6: 기본 대시보드 + v2 고도화
  - iteration-16: Zero Thinking 대시보드 (더 상세)
- **해결**: iteration-16을 최종 사양으로 채택, Sprint 6은 단계적 구현

#### 2. 탭 구조 혼란
- **충돌**: Sprint 3, 4, 5의 탭 언급이 명확하지 않음
- **해결 (완료)**: 
  - Sprint 17이 KPI 진단 페이지의 5개 메인 탭
  - Sprint 4는 "진단하기" 탭 내부의 축별 서브탭
  - Sprint 5는 "결과 보기" 탭의 컴포넌트

#### 3. 네비게이션 메뉴 구조
- **충돌**: 여러 문서에서 다른 메뉴 구조 언급
- **해결**: Sprint 3의 PRD v4.0 기준 5개 메뉴가 최종
  1. 대시보드
  2. KPI 진단 (통합)
  3. 포켓빌드업
  4. 스마트 매칭
  5. VDR/마이프로필

### 권장 구현 순서

1. **Phase 1: 네비게이션 재구성** (Sprint 3)
   - 5개 메뉴 구조로 변경
   - 기존 경로 리다이렉션

2. **Phase 2: KPI 진단 통합** (Sprint 17)
   - 5개 탭 구조 구현
   - 기존 컴포넌트 마이그레이션

3. **Phase 3: 대시보드 고도화** (iteration-16 + Sprint 6)
   - Zero Thinking 원칙 적용
   - 5대 핵심 위젯 구현

4. **Phase 4: 신규 페이지** (Sprint 18)
   - 포켓빌드업 페이지
   - VDR/마이프로필 페이지

5. **Phase 5: 스마트 매칭** (Sprint 14 + Sprint 8)
   - 매칭 엔진 통합
   - 결과 UI 구현

## 다음 단계

### Sprint 11-20 분석 필요
- 추가 대시보드/탭 관련 내용 확인
- 충돌 사항 계속 추적
- 최종 MASTER_PLAN.md 작성 준비

### 중복 제거 필요
- Sprint 6 대시보드 vs iteration-16
- 알림 시스템 중복 확인
- 진단 히스토리 위치 명확화

### 문서 업데이트 필요
- 각 Sprint 문서에 연관 참조 추가
- 구현 완료 항목 표시
- 우선순위 재조정