# Phase 3: 시각적 검증 체크리스트

**테스트 URL**: http://localhost:5174/pocketbiz-platform/startup/kpi?tab=insights-v3
**테스트 일시**: 2025-01-11
**담당자**: Phase 3 통합 테스트

---

## 섹션별 렌더링 체크

### 1. Executive Summary (요약)
- [ ] 섹션 표시됨
- [ ] Overall Score 숫자 표시
- [ ] Strengths/Weaknesses 리스트 표시
- [ ] Top Recommendations 표시
- [ ] 시각적 레이아웃 정상

### 2. Section Connector: summary-to-risks
- [ ] 커넥터 표시됨
- [ ] 아이콘: AlertTriangle (빨간색)
- [ ] 배경: 보라색-빨간색 그라데이션
- [ ] 메시지: "먼저 즉각적인 조치가 필요한 위험 신호를 확인하세요"
- [ ] 하단 화살표 표시

### 3. Risk Alerts (위험 신호)
- [ ] 섹션 표시됨 (또는 알림이 없으면 숨김)
- [ ] Risk 카드들이 severity별로 정렬 (critical > warning > info)
- [ ] 각 카드의 색상 구분 (빨강/주황/파랑)
- [ ] affectedKPIs 표시
- [ ] suggestedActions 표시

### 4. Section Connector: risks-to-correlations
- [ ] Risk Alerts가 있을 때만 표시됨
- [ ] 아이콘: TrendingUp (파란색)
- [ ] 배경: 빨간색-파란색 그라데이션
- [ ] 메시지: "KPI 간 관계를 분석한..."

### 5. Correlation Insights (파생 지표)
- [ ] 섹션 표시됨 (또는 데이터 없으면 숨김)
- [ ] 카드 그리드 레이아웃 (2열)
- [ ] 각 인사이트의 점수 표시
- [ ] Progress bar 표시
- [ ] 우선순위별 색상 구분

### 6. Section Connector: correlations-to-critical
- [ ] 커넥터 표시됨
- [ ] 아이콘: Target (보라색)
- [ ] 배경: 파란색-보라색 그라데이션
- [ ] 메시지: "이제 가장 중요한 핵심 지표(x3 가중치)..."

### 7. Critical KPI Details (핵심 지표)
- [ ] 섹션 표시됨
- [ ] ReportSection 타이틀: "Critical Metrics Details"
- [ ] 서브타이틀: "핵심 지표 상세 분석 (x3 가중치)"
- [ ] weight=3인 KPI만 표시됨
- [ ] CriticalKPISection 컴포넌트 정상 로드

### 8. Section Connector: critical-to-important
- [ ] 커넥터 표시됨
- [ ] 아이콘: BarChart3 (보라색)
- [ ] 배경: 남색-보라색 그라데이션
- [ ] 메시지: "핵심 지표에 이어 주요 관리 지표..."

### 9. Important KPI Details (주요 지표)
- [ ] 섹션 표시됨
- [ ] ReportSection 타이틀: "Important Metrics Details"
- [ ] 서브타이틀: "주요 관리 지표 상세 분석 (x2 가중치)"
- [ ] weight=2인 KPI만 표시됨
- [ ] ImportantKPISection 컴포넌트 정상 로드

### 10. Section Connector: important-to-standard
- [ ] 커넥터 표시됨
- [ ] 아이콘: BarChart3 (회색)
- [ ] 배경: 보라색-회색 그라데이션
- [ ] 메시지: "기본 관리 지표(x1 가중치)는..."

### 11. Standard KPI Summary (기본 지표)
- [ ] 섹션 표시됨
- [ ] ReportSection 타이틀: "Standard Metrics Summary"
- [ ] 서브타이틀: "기본 관리 지표 요약 (x1 가중치)"
- [ ] weight=1인 KPI만 표시됨
- [ ] **테이블 형식**으로 표시됨 (상세 카드 아님)
- [ ] KPISummaryTable 컴포넌트 정상 로드

### 12. Section Connector: standard-to-benchmarking
- [ ] 커넥터 표시됨
- [ ] 아이콘: TrendingUp (초록색)
- [ ] 배경: 회색-초록색 그라데이션
- [ ] 메시지: "업계 평균과 비교하여..."

### 13. Benchmarking Analysis (벤치마킹)
- [ ] 섹션 표시됨
- [ ] ReportSection 타이틀: "Benchmarking Analysis"
- [ ] 서브타이틀: "업계 평균 대비 경쟁력 분석"
- [ ] Sector/Stage 정보 표시
- [ ] 백분위수 표시
- [ ] BenchmarkingSection 컴포넌트 정상 로드

### 14. Section Connector: benchmarking-to-action
- [ ] 커넥터 표시됨
- [ ] 아이콘: Target (주황색)
- [ ] 배경: 초록색-주황색 그라데이션
- [ ] 메시지: "진단 결과를 바탕으로..."

### 15. Action Plan (실행 계획)
- [ ] 섹션 표시됨
- [ ] ReportSection 타이틀: "Prioritized Action Plan"
- [ ] 서브타이틀: "진단 기반 우선순위별 실행 계획"
- [ ] 액션들이 우선순위별로 정렬
- [ ] 각 액션의 담당자/기한 표시
- [ ] ActionPlanSection 컴포넌트 정상 로드

### 16. Section Connector: action-to-radar
- [ ] 커넥터 표시됨
- [ ] 아이콘: BarChart3 (남색)
- [ ] 배경: 주황색-남색 그라데이션
- [ ] 메시지: "마지막으로 5축 균형 분석..."

### 17. 5축 레이더 & 영역별 성과 종합
- [ ] 섹션 표시됨
- [ ] ReportSection 타이틀: "5축 균형 분석 & 영역별 성과"
- [ ] 서브타이틀: "비즈니스 핵심 영역별 종합 평가"
- [ ] 레이더 차트 표시
- [ ] 5개 축(Finance, Growth, Product, Operations, Team) 표시
- [ ] 영역별 점수 카드 표시

### 18. Footer
- [ ] Footer 표시됨
- [ ] 레포트 생성 시간 표시
- [ ] 추가 정보/링크 표시 (있다면)

---

## 반응형 테스트

### Desktop (1920x1080)
- [ ] 모든 섹션 정상 표시
- [ ] 2열 그리드 정상 작동 (Correlation Insights)
- [ ] 커넥터 전체 너비

### Tablet (768px)
- [ ] 1열 레이아웃으로 전환
- [ ] 커넥터 축소되지 않음
- [ ] 텍스트 가독성 유지

### Mobile (375px)
- [ ] 세로 스크롤 정상
- [ ] 모든 요소 터치 가능
- [ ] 가로 스크롤 발생하지 않음

---

## 성능 체크

### 로딩 속도
- [ ] 초기 렌더링 < 1초
- [ ] Lazy Loading 작동 (Suspense fallback 표시됨)
- [ ] 섹션별 점진적 로딩

### 콘솔 체크
- [ ] 에러 0개
- [ ] 경고 1개 이하 (momentumEngine 중복 제외)
- [ ] 네트워크 요청 정상

### 메모리
- [ ] 페이지 로드 후 메모리 < 100MB
- [ ] 스크롤 시 메모리 증가 없음
- [ ] 탭 전환 시 메모리 누수 없음

---

## 인터랙션 체크

### 스크롤
- [ ] 부드러운 스크롤
- [ ] Sticky 헤더 작동 (있다면)
- [ ] 섹션 간 전환 자연스러움

### 데이터 변경
- [ ] reportData prop 변경 시 즉시 반영
- [ ] 불필요한 리렌더링 없음

### 에러 처리
- [ ] 데이터 없을 때 graceful degradation
- [ ] ErrorBoundary 작동
- [ ] 빈 섹션 메시지 표시

---

## 최종 확인

### 코드 품질
- [ ] TypeScript 에러 0개
- [ ] ESLint 경고 최소화
- [ ] 콘솔 로그 제거됨

### UX
- [ ] 정보 흐름이 논리적
- [ ] 커넥터 메시지가 도움됨
- [ ] 색상 구분이 명확함

### 배포 준비
- [ ] 프로덕션 빌드 성공
- [ ] 번들 크기 < 500KB (gzip)
- [ ] 모든 이미지/에셋 로드

---

## 발견된 이슈

### Critical (즉시 수정 필요)
- 없음

### High (다음 배포 전 수정)
- 없음

### Medium (개선 필요)
- momentumEngine.ts의 중복 calculateMomentum 메서드 (기존 이슈)

### Low (나중에 개선 가능)
- 없음

---

## 테스트 완료 서명

- [ ] 모든 체크리스트 항목 확인 완료
- [ ] 스크린샷 첨부 (주요 섹션)
- [ ] 이슈 문서화 완료

**테스트 완료 일시**: _________________
**테스트 담당자**: _________________
**승인자**: _________________