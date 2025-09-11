# MASTER_PLAN.md - 충돌 해결 및 통합 구현 계획

> 작성일: 2025-01-10
> 목적: SOURCE_COLLECTION과 BACKEND_COLLECTION의 충돌 해결 및 명확한 구현 계획 수립

## 🔴 주요 충돌 사항 및 해결 방안

### 1. 대시보드 구현 충돌
**문제**: 
- Sprint 6: 기본 대시보드 + v2 고도화
- iteration-16: Zero Thinking 대시보드 (더 상세)
- 중복된 설계, 어느 것을 따를지 불명확

**해결**:
```
✅ iteration-16을 최종 사양으로 채택
- Phase 1: Sprint 6의 기본 대시보드 먼저 구현
- Phase 2: iteration-16의 5대 핵심 위젯으로 고도화
```

### 2. KPI 진단 페이지 구조 혼란
**문제**:
- Sprint 4: "축별 서브탭" 언급
- Sprint 5: "결과 탭" 언급
- Sprint 17: "5개 메인 탭" 정의
- 탭 계층 구조가 불명확

**해결**:
```
✅ Sprint 17이 최종 구조
메인 탭 (5개): 진단하기 | 결과 보기 | 상세 분석 | 벤치마킹 | 액션 플랜
  └─ 진단하기 탭 내부
      └─ 축별 서브탭 (5개): GO | EC | PT | PF | TO (Sprint 4)
  └─ 결과 보기 탭 내부
      └─ Sprint 5의 시각화 컴포넌트들
```

### 3. 네비게이션 메뉴 변경
**문제**:
- 기존: Assessments, Results 별도 메뉴
- 신규: KPI 진단으로 통합

**해결**:
```
✅ Sprint 3의 PRD v4.0 기준 5개 메뉴
1. 대시보드 (iteration-16)
2. KPI 진단 (Sprint 17 통합)
3. 포켓빌드업 (Sprint 18)
4. 스마트 매칭 (Sprint 8 + 14)
5. VDR/마이프로필 (Sprint 18)

리다이렉션 설정:
- /startup/assessments → /startup/kpi?tab=assess
- /startup/results → /startup/kpi?tab=results
```

### 4. 데이터 모델 중복
**문제**:
- 여러 Sprint에서 동일한 인터페이스 정의
- 버전 차이로 인한 불일치

**해결**:
```
✅ 단일 진실 원천(Single Source of Truth) 설정
- src/types/models/ 폴더에 모든 인터페이스 통합
- 각 Sprint 참조 시 해당 파일 import
```

## 📋 구현 우선순위 및 단계

### Phase 0: 기반 정리 (1일)
- [ ] 기존 코드 백업
- [ ] 충돌하는 컴포넌트 식별
- [ ] 타입 정의 통합 (src/types/models/)

### Phase 1: 네비게이션 재구성 (2일)
**Owner**: Sprint 3 기준
- [ ] StartupLayout.tsx 메뉴 5개로 변경
- [ ] 라우팅 구조 변경 (App.tsx)
- [ ] 리다이렉션 설정
- [ ] 모바일 반응형 메뉴

### Phase 2: KPI 진단 통합 (3일)
**Owner**: Sprint 17 기준
- [ ] KPIDiagnosisPage.tsx 생성
- [ ] 5개 탭 컴포넌트 구현
  - [ ] AssessmentPanel (Sprint 4 컴포넌트 재사용)
  - [ ] ResultsPanel (Sprint 5 컴포넌트 재사용)
  - [ ] DetailAnalysisPanel (신규)
  - [ ] BenchmarkPanel (신규)
  - [ ] ActionPlanPanel (신규)
- [ ] Context 통합 (KPIDiagnosisContext)
- [ ] 기존 페이지 마이그레이션

### Phase 3: 백엔드 통합 (3일)
**Owner**: BACKEND_COLLECTION 기준
- [ ] 스코어링 엔진 통합
- [ ] 매칭 엔진 구현
- [ ] 검증 엔진 설정
- [ ] API 엔드포인트 정리

### Phase 4: 대시보드 구현 (3일)
**Owner**: iteration-16 기준 (Sprint 6은 참고용)
- [ ] 기본 레이아웃 (Sprint 6 v1)
- [ ] 5대 핵심 위젯 구현
  1. [ ] 내 현재 위치 위젯
  2. [ ] 이번 주 일정 위젯
  3. [ ] NBA 위젯
  4. [ ] 추천 프로그램 위젯 (FOMO)
  5. [ ] 진행중인 빌드업 위젯
- [ ] Zero Thinking UX 적용
- [ ] 실시간 기능 (WebSocket)

### Phase 5: 신규 페이지 (2일)
**Owner**: Sprint 18 기준
- [ ] 포켓빌드업 페이지
  - [ ] 3개 탭 구조
  - [ ] 프로젝트 카드 컴포넌트
- [ ] VDR/마이프로필 페이지
  - [ ] 4개 탭 구조
  - [ ] 문서 업로드 기능

### Phase 6: 스마트 매칭 (2일)
**Owner**: Sprint 8 + Sprint 14 기준
- [ ] 매칭 결과 UI
- [ ] 필터링 시스템
- [ ] 추천 알고리즘 연동

## 🎯 명확한 소유권 정의

| 기능 영역 | 최종 Owner | 참고 문서 | 상태 |
|---------|-----------|----------|------|
| 네비게이션 메뉴 | Sprint 3 (PRD v4.0) | - | 🔴 대기 |
| KPI 진단 페이지 | Sprint 17 | Sprint 4, 5 | 🔴 대기 |
| 대시보드 | iteration-16 | Sprint 6 | 🔴 대기 |
| 포켓빌드업 | Sprint 18 | - | 🔴 대기 |
| VDR/마이프로필 | Sprint 18 | - | 🔴 대기 |
| 스마트 매칭 | Sprint 8 | Sprint 14 | 🔴 대기 |
| 스코어링 엔진 | Sprint 2 | Sprint 11, 13 | 🔴 대기 |
| 매칭 엔진 | Sprint 8 | Sprint 12 | 🔴 대기 |
| 검증 엔진 | Sprint 10 | - | 🔴 대기 |
| Admin Console | Sprint 9 | Sprint 11 | 🔴 대기 |
| Partner Portal | Sprint 12 | - | 🔴 대기 |

## 📏 성공 기준

### 기능적 요구사항
- [ ] 5개 메뉴 모두 접근 가능
- [ ] KPI 진단 5개 탭 정상 작동
- [ ] 대시보드 5대 위젯 표시
- [ ] 실시간 업데이트 작동

### 성능 요구사항
- [ ] 대시보드 로딩 < 2초
- [ ] 점수 계산 < 500ms
- [ ] 매칭 속도 < 500ms
- [ ] 탭 전환 < 100ms

### UX 요구사항
- [ ] Zero Thinking (3분 안에 주간 계획)
- [ ] FOMO 효과 (긴급 프로그램 클릭률 > 30%)
- [ ] NBA 실행률 > 25%
- [ ] DAU/MAU > 40%

## 🚫 제거/폐기 항목

1. **제거할 라우트**:
   - /startup/assessments (리다이렉션)
   - /startup/results (리다이렉션)
   - /startup/matches (리다이렉션)

2. **폐기할 컴포넌트**:
   - 기존 AssessmentsPage.tsx (통합됨)
   - 기존 ResultsPage.tsx (통합됨)
   - 중복된 대시보드 컴포넌트

3. **통합할 Context**:
   - AssessmentContext → KPIDiagnosisContext
   - ResultsContext → KPIDiagnosisContext

## 📅 예상 일정

| 주차 | 작업 내용 | 완료 기준 |
|-----|---------|----------|
| Week 1 | Phase 0-2 (기반정리, 네비게이션, KPI통합) | KPI 진단 페이지 작동 |
| Week 2 | Phase 3-4 (백엔드, 대시보드) | 대시보드 위젯 표시 |
| Week 3 | Phase 5-6 (신규페이지, 매칭) | 전체 기능 통합 완료 |

## ⚠️ 리스크 및 대응

1. **데이터 마이그레이션 실패**
   - 백업 필수
   - 단계별 테스트
   - 롤백 계획 수립

2. **성능 저하**
   - 프로파일링 도구 준비
   - 캐싱 전략 사전 설계
   - 점진적 최적화

3. **사용자 혼란**
   - 변경 사항 공지
   - 리다이렉션 설정
   - 도움말 업데이트

## 🎯 최종 목표

**"하나의 일관된 시스템으로 통합"**
- 파편화된 문서 → 통합된 구현
- 중복된 컴포넌트 → 재사용 가능한 모듈
- 혼란스러운 네비게이션 → 직관적인 5개 메뉴
- 분산된 데이터 → 통합된 Context

---

## 다음 액션

1. **즉시 시작**: Phase 0 - 기반 정리
2. **팀 리뷰**: 이 계획서 검토 및 승인
3. **브랜치 생성**: `feature/master-plan-implementation`
4. **일일 체크인**: 진행 상황 공유

*이 문서는 구현 진행에 따라 지속적으로 업데이트됩니다.*