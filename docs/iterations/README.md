# 포켓비즈 개발 Iterations

> 최종 업데이트: 2025-01-10
> PRD v4.0 반영

이 폴더는 포켓비즈 플랫폼의 Sprint별 상세 개발 계획을 담고 있습니다.

## Phase 1: Core MVP (Sprint 1-6) ✅
- [Sprint 1: 프로젝트 설정 & 데이터 기반 구축](./1.md)
- [Sprint 2: 핵심 점수화 엔진 구현](./2.md)
- [Sprint 3: 사용자 인증 & A×S 분류 + **네비게이션 개편**](./3.md) 🔄
- [Sprint 4: KPI 입력 시스템 구현](./4.md)
- [Sprint 5: 레이더 차트 & 결과 시각화](./5.md)
- [Sprint 6: 기본 대시보드 & 히스토리 + **Zero Thinking 대시보드**](./6.md) 🔄

## Phase 2: Advanced Features (Sprint 7-10) ✅
- [Sprint 7: 프로그램 관리 시스템](./7.md)
- [Sprint 8: 스마트 매칭 엔진](./8.md)
- [Sprint 9: Admin Console 기초](./9.md)
- [Sprint 10: 고급 검증 & 품질 관리](./10.md)

## Phase 3: Intelligence & Scale (Sprint 11-13) 🚧
- [Sprint 11: 벤치마킹 & 인사이트](./11.md)
- [Sprint 12: Partner Portal 개발](./12.md)
- [Sprint 13: 관리자 고급 기능](./13.md)

## Phase 4: Enterprise Features (Sprint 14-16) 🔄
- [Sprint 14: Radar 매칭 시스템 + **스마트 매칭 연계**](./iteration-14-radar-matching.md) 🔄
- [Sprint 15: 빌드업 프로그램](./iteration-15-buildup-programs.md)
- [Sprint 16: 사용자 기능 고도화 + **PRD v4.0 전면 재설계**](./iteration-16-user-features.md) 🔄

## Phase 5: 2025 Q1 로드맵 (Sprint 17-20) 🆕
- [Sprint 17: KPI 진단 통합 페이지](./17.md)
- [Sprint 18: 신규 페이지 구현 (포켓빌드업, VDR/마이프로필)](./18.md)
- Sprint 19: 빌더 환경 구축 (예정)
- Sprint 20: 백엔드 API 연동 (예정)

## 우선순위 가이드
- 🔴 **Critical**: 핵심 기능
- 🟡 **Important**: 차별화 기능
- 🟢 **Medium**: 확장 기능
- 🔵 **Nice-to-have**: 고급 기능

## 현재 진행 상황

### ✅ 완료된 작업 (Phase 1-2)
- ✅ **프로젝트 기초**
  - Frontend 구현 (React 18 + TypeScript + Vite)
  - Tailwind CSS + 글래스모피즘 디자인 시스템
  - 3가지 사용자 역할별 레이아웃 (스타트업/관리자/파트너)
  
- ✅ **클러스터 시스템**
  - 섹터(S1-S5) × 단계(A1-A5) 분류 체계
  - ClusterContext 전역 상태 관리
  - 동적 단계 선택 UI (StageSelector)
  
- ✅ **KPI 평가 시스템**
  - CSV 기반 KPI 데이터 관리 (41개 S1 섹터 KPI)
  - 6가지 입력 컴포넌트 (Numeric, Rubric, Stage, MultiSelect, Calculation, Checklist)
  - 단계별 KPI 필터링 (applicable_stages)
  - 실시간 점수 계산 및 검증
  - 가중치 시스템 (x1, x2, x3)
  
- ✅ **결과 시각화**
  - 레이더 차트 컴포넌트
  - 5축 점수 표시 (GO/EC/PT/PF/TO)
  - 피어 평균 비교
  - AI 인사이트 생성
  - ScoreIndicator (5단계 등급 표시)
  
- ✅ **사용자 경험**
  - 임시 저장 기능 (localStorage)
  - 진행률 추적
  - 완성도 체크 모달
  - 필드 라벨 한글화

### 🚧 진행 중 (Phase 3)
- 🏃 **관리자 기능**
  - KPI 라이브러리 관리 UI
  - 가중치 정책 관리
  - 스코어링 규칙 설정
  - 프로그램 등록/관리
  - 품질 모니터링

### 📅 다음 작업 (2025 Q1)
- 🔴 **핵심 대시보드 구현**
  - Zero Thinking 5대 위젯
  - NBA 추천 엔진
  - FOMO 트리거
  
- 🔴 **스마트 매칭 고도화**
  - S-A 태그 필터링
  - 레이더 오버레이
  - 적합도 계산
  
- 🟡 **네비게이션 개편**
  - 메뉴 한글화
  - 페이지 통합
  - 신규 페이지 추가
  
- 🟢 **백엔드 준비**
  - API 설계
  - DB 스키마
  - 인증 시스템