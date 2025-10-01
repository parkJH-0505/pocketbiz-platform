# Phase 3: 핵심 시나리오 테스트 계획

**목적**: V3 Report 시스템의 모든 섹션과 컴포넌트가 다양한 데이터 상황에서 올바르게 작동하는지 검증

## 테스트 시나리오 목록 (15개)

### 1. 정상 데이터 시나리오 (Normal Cases)

#### Scenario 1: 완벽한 스타트업 (고득점)
- **조건**: 모든 KPI가 80점 이상
- **예상 결과**:
  - Executive Summary: 긍정적 메시지, 녹색 배지
  - Risk Alerts: 알림 없음 또는 info 레벨만
  - Correlation Insights: 모든 지표가 "good" 상태
  - Action Plan: "유지 및 강화" 액션 위주
  - 5축 레이더: 균형 잡힌 오각형

#### Scenario 2: 위기 스타트업 (저득점)
- **조건**: 대부분 KPI가 40점 이하
- **예상 결과**:
  - Executive Summary: 경고 메시지, 빨간색 배지
  - Risk Alerts: 다수의 critical 알림
  - Correlation Insights: "poor" 상태 지표 다수
  - Action Plan: 긴급 개선 액션 다수
  - 5축 레이더: 찌그러진 오각형

#### Scenario 3: 불균형 스타트업 (특정 영역만 강함)
- **조건**: Finance/Growth는 80+, Operations/Team은 40-
- **예상 결과**:
  - Risk Alerts: 특정 영역에 집중된 경고
  - 5축 레이더: 비대칭 오각형 (특정 축만 돌출)
  - Action Plan: 약한 영역 보완 위주

### 2. 엣지 케이스 (Edge Cases)

#### Scenario 4: 데이터 부족 (Minimal Data)
- **조건**: 진단 데이터 5개 미만
- **예상 결과**:
  - 빈 섹션 graceful 처리
  - "데이터 부족" 메시지 표시
  - 크래시 없음

#### Scenario 5: 데이터 과다 (Massive Data)
- **조건**: 진단 데이터 100개 이상
- **예상 결과**:
  - 성능 저하 없음 (< 1초 로딩)
  - 모든 섹션 정상 렌더링
  - 메모리 누수 없음

#### Scenario 6: 극단적 값 (Extreme Values)
- **조건**: 일부 KPI가 0점 또는 100점
- **예상 결과**:
  - 레이더 차트 정상 표시
  - 점수 계산 오류 없음
  - UI 깨짐 없음

### 3. 섹션별 기능 테스트

#### Scenario 7: Risk Alerts 작동 검증
- **조건**: 특정 KPI에 임계값 위반 설정
- **예상 결과**:
  - 자동 탐지 작동 (analysisResults.risks)
  - severity 별 정렬 (critical > warning > info)
  - affectedKPIs 올바른 표시
  - suggestedActions 제공

#### Scenario 8: Correlation Insights 계산 검증
- **조건**: 관련 KPI 데이터 제공 (MRR, Users, CAC 등)
- **예상 결과**:
  - ARPU 정확히 계산
  - LTV/CAC 비율 계산
  - Growth Efficiency 계산
  - 파생 지표 해석 메시지 표시

#### Scenario 9: Critical/Important/Standard 분류 검증
- **조건**: 가중치가 다른 KPI 혼합
- **예상 결과**:
  - Critical 섹션: x3 가중치 KPI만
  - Important 섹션: x2 가중치 KPI만
  - Standard 섹션: x1 가중치 KPI만 (테이블 형식)

#### Scenario 10: Benchmarking 비교 검증
- **조건**: sector=tech, stage=seed 설정
- **예상 결과**:
  - 업계 평균값 표시
  - 비교 점수 계산
  - 경쟁력 분석 메시지

#### Scenario 11: Action Plan 우선순위 검증
- **조건**: 다양한 severity의 액션 혼합
- **예상 결과**:
  - critical → high → medium → low 순서 정렬
  - 각 액션에 담당자/기한 표시
  - 예상 효과 표시

### 4. 섹션 커넥터 테스트

#### Scenario 12: 모든 커넥터 표시 검증
- **조건**: 모든 섹션이 렌더링되는 정상 상태
- **예상 결과**:
  - 7개 커넥터 모두 표시
  - 각 커넥터의 메시지 적절
  - 색상/아이콘 구분 명확

#### Scenario 13: 조건부 커넥터 검증
- **조건**: Risk Alerts가 없는 경우
- **예상 결과**:
  - risks-to-correlations 커넥터 미표시
  - summary가 바로 correlations로 연결

### 5. 성능 및 안정성 테스트

#### Scenario 14: Lazy Loading 검증
- **조건**: 네트워크 throttling 적용
- **예상 결과**:
  - 각 섹션 독립적 로딩
  - LoadingCard fallback 표시
  - 순차적 콘텐츠 나타남

#### Scenario 15: 재렌더링 최적화 검증
- **조건**: reportData props 변경
- **예상 결과**:
  - 불필요한 리렌더링 없음
  - React DevTools로 확인
  - 메모이제이션 작동

## 테스트 실행 방법

### 자동 테스트
```bash
npm test -- ResultsInsightsPanelV3
```

### 수동 테스트
1. 브라우저에서 http://localhost:5174/pocketbiz-platform/startup/kpi?tab=insights-v3 접속
2. React DevTools 열기
3. 각 시나리오별로 데이터 변경 후 UI 확인

### 성능 측정
```javascript
// Chrome DevTools > Performance 탭 사용
// 또는
console.time('V3 Report Render');
// ... render
console.timeEnd('V3 Report Render');
```

## 성공 기준

- [ ] 모든 15개 시나리오 통과
- [ ] 렌더링 시간 < 1초
- [ ] 콘솔 에러 0개
- [ ] 메모리 누수 없음
- [ ] 모바일 반응형 정상 작동

## 다음 단계

테스트 완료 후 Phase 3.4 (성능 최적화)로 진행