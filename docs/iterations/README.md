# 포켓비즈 개발 Iterations

> 최종 업데이트: 2025-01-10
> PRD v4.0 반영

이 폴더는 포켓비즈 플랫폼의 Sprint별 상세 개발 계획을 담고 있습니다.

## 🚀 배포 환경 & 링크

### 라이브 환경
- **프로덕션 URL**: https://pocketbiz-platform.vercel.app/
- **GitHub Repository**: https://github.com/parkJH-0505/pocketbiz-platform
- **배포 플랫폼**: Vercel (자동 배포)

### 역할별 접속
- **랜딩 페이지**: https://pocketbiz-platform.vercel.app/
- **스타트업**: https://pocketbiz-platform.vercel.app/?role=startup
- **관리자**: https://pocketbiz-platform.vercel.app/?role=admin
- **내부 빌더**: https://pocketbiz-platform.vercel.app/?role=internal-builder
- **외부 빌더**: https://pocketbiz-platform.vercel.app/?role=partner

### 개발 환경
```bash
# 로컬 개발 서버
cd my-startup-app
npm run dev

# 네트워크 공유 (같은 WiFi)
npm run dev -- --host
# http://localhost:5173/
# http://[IP주소]:5173/

# 빌드
npm run build

# Git 작업
git add .
git commit -m "커밋 메시지"
git push

# 브랜치
- main: 프로덕션 (Vercel 자동 배포)
- feature/v4-migration: 개발 브랜치
```

### 배포 프로세스
1. **코드 수정** → 로컬 테스트
2. **git commit & push** → GitHub 업로드
3. **Vercel 자동 감지** → 빌드 & 배포 (1-2분)
4. **라이브 반영** → URL로 확인

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

## Phase 5: 2025 Q1 로드맵 (Sprint 17-26) 🆕
- [Sprint 17: KPI 진단 통합 페이지](./17.md)
- [Sprint 18: 신규 페이지 구현 (포켓빌드업, VDR/마이프로필)](./18.md)
- [Sprint 19: 스마트매칭 고도화](./iteration-19-smart-matching.md)
- [Sprint 20: 프로젝트 상세 개선](./iteration-20-project-detail-enhancement.md)
- [Sprint 21: 통합 단계 전환 시스템](./iteration-21-integrated-phase-transition-system-revised.md)
- [Sprint 22: 통합 스케줄 수정](./iteration-22-unified-schedule-fixes.md)
- [Sprint 23: 사용자 인터페이스 개선](./23.md)
- [Sprint 24: 통합 사용자 구조](./iteration-24-unified-user-structure.md)
- [Sprint 25: 인터랙티브 대시보드 재설계](./iteration-25-interactive-dashboard-redesign.md) ✅
- [Sprint 26: 대시보드 단순화 및 재구성](./iteration-26-dashboard-simplification.md) 🚧

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
  - 4가지 사용자 역할별 레이아웃 (스타트업/관리자/내부빌더/외부빌더)
  - 랜딩 페이지 및 역할 선택 UI
  - GitHub 저장소 및 Vercel 배포 구축
  
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

## 🛠️ 유용한 명령어 모음

### Git & GitHub
```bash
# 현재 상태 확인
git status
git log --oneline -5

# 작업 저장 및 푸시
git add .
git commit -m "feat: 기능 추가"
git push

# 브랜치 작업
git checkout -b feature/새기능
git checkout main
git merge feature/새기능

# 이전 상태로 되돌리기
git checkout 4d65312  # 특정 커밋으로
git reset --hard HEAD  # 마지막 커밋으로
```

### 개발 & 테스트
```bash
# 개발 서버 실행
cd my-startup-app
npm run dev

# 빌드 (타입 체크 없이)
npm run build

# 빌드 (타입 체크 포함)
npm run build:check

# 로컬 네트워크 공유
npm run dev -- --host
```

### Vercel 배포
```bash
# 자동 배포 (push만 하면 됨)
git push origin main

# 배포 상태 확인
# https://vercel.com/dashboard 접속
```

### 문제 해결
```bash
# npm 패키지 재설치
rm -rf node_modules package-lock.json
npm install

# 캐시 클리어
npm cache clean --force

# TypeScript 에러 무시하고 빌드
npm run build  # (build:check 대신)
```

## 📌 중요 링크 북마크

- **라이브 사이트**: https://pocketbiz-platform.vercel.app/
- **GitHub**: https://github.com/parkJH-0505/pocketbiz-platform
- **Vercel 대시보드**: https://vercel.com/dashboard
- **PRD 문서**: [docs/PRD.md](../PRD.md)
- **현재 상태**: [docs/iterations/CURRENT_STATUS.md](./CURRENT_STATUS.md)