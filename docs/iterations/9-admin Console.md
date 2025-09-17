# Sprint 9: Admin Console 기초 (2주)

## 목표
관리자를 위한 KPI 관리 및 시스템 운영 도구 구축

## 작업 목록

### Admin 인증 & 권한
- [ ] Admin 계정 시스템 🔴
  ```typescript
  interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: 'super_admin' | 'admin' | 'operator';
    permissions: Permission[];
    lastLogin: Date;
  }
  
  interface Permission {
    resource: 'kpi' | 'program' | 'user' | 'assessment';
    actions: ('create' | 'read' | 'update' | 'delete')[];
  }
  ```

- [ ] 관리자 권한 체크 🔴
  - 미들웨어 구현
  - 역할 기반 접근 제어
  - 감사 로그

- [ ] Admin 전용 라우팅 🔴
  - /admin/* 경로 보호
  - 권한별 메뉴 표시

### KPI 라이브러리 관리
- [ ] KPI 목록 표시 (테이블) 🔴
  ```typescript
  interface KPITableColumns {
    kpiId: string;
    sector: string;
    axis: string;
    question: string;
    inputType: string;
    stages: string[]; // 적용 단계
    lastModified: Date;
    modifiedBy: string;
  }
  ```

- [ ] KPI 추가/수정/삭제 🔴
  - 폼 유효성 검증
  - 미리보기 기능
  - 변경 이력 추적

- [ ] 단계별 규칙 편집 🔴
  - 가중치 설정 (x1/x2/x3)
  - 선택지 편집
  - 점수 매핑

- [ ] 선택지 레지스트리 관리 🔴
  ```typescript
  interface ChoiceRegistry {
    id: string;
    name: string;
    type: 'rubric' | 'stage' | 'multiselect';
    choices: {
      label: string;
      value: any;
      score?: number;
    }[];
    usedIn: string[]; // KPI IDs
  }
  ```

### 데이터 가져오기/내보내기
- [ ] 엑셀 파일 업로드 UI 🔴
  - 드래그 앤 드롭
  - 파일 형식 검증
  - 진행률 표시

- [ ] 데이터 검증 및 미리보기 🔴
  ```typescript
  interface ImportPreview {
    fileName: string;
    totalRows: number;
    validRows: number;
    errors: {
      row: number;
      column: string;
      error: string;
    }[];
    preview: any[]; // 처음 10개 행
  }
  ```

- [ ] 일괄 업데이트 기능 🔴
  - 변경사항 미리보기
  - 롤백 기능
  - 부분 적용 옵션

- [ ] CSV 내보내기 🟡
  - 필터 적용 내보내기
  - 템플릿 다운로드

### Admin 대시보드

> ⚠️ **통합 문서 참조**: Admin 대시보드 내용은 SOURCE_COLLECTION.md에 통합됨

- [ ] 시스템 현황 위젯 🔴
  - 총 사용자/조직 수
  - 활성 진단 수
  - 최근 가입 현황

- [ ] KPI 사용 통계 🟡
  - 응답률 분석
  - 입력 시간 분석
  - 오류 빈도

- [ ] 버전 관리 시스템 🔴
  ```typescript
  interface KPIVersion {
    versionId: string;
    versionNumber: string; // "1.0.0"
    createdAt: Date;
    createdBy: string;
    changes: string[];
    status: 'draft' | 'published' | 'deprecated';
  }
  ```

## UI 컴포넌트
- [ ] 데이터 테이블 (정렬/필터/페이징)
- [ ] 일괄 작업 툴바
- [ ] 변경사항 비교 뷰어
- [ ] 임포트 위저드

## 완료 기준
- [ ] KPI 1000개 관리 가능
- [ ] 엑셀 임포트 성공률 > 95%
- [ ] 관리 작업 시간 50% 단축
- [ ] 데이터 무결성 100% 보장

---

## 담당 PM/빌더 배정 시스템 구현 계획

### 현재 상황 (2024-12-17 업데이트)
- ✅ **사용자 기반 전담 빌더 배정 시스템 구현됨**
- ✅ **스마트매칭 채팅 시스템에 전담 빌더 연동됨**
- ✅ **포켓빌드업 프로젝트 채팅에 전담 빌더 배정됨**
- ⏳ 관리자 페이지에서 담당 빌더 변경 기능 필요

### 구현된 시스템 현황

#### ✅ Step 1: 사용자별 전담 빌더 배정 (완료)
- ✅ `UserBasicInfo` 타입에 `assignedBuilder` 속성 추가
- ✅ 가입 시 기본 빌더 자동 배정 (`김수민` Senior PM)
- ✅ 사용자별 일관된 빌더 서비스 제공

```typescript
// 구현된 타입 구조
interface AssignedBuilder {
  id: string;
  name: string;
  role: string;
  email: string;
  company: string;
}

interface UserBasicInfo {
  assignedBuilder?: AssignedBuilder;
  // ... 기타 필드
}
```

#### ✅ Step 2: 채팅 시스템 통합 (완료)
- ✅ **스마트매칭 상담**: 전담 빌더가 자동 응답
- ✅ **포켓빌드업 프로젝트**: 전담 빌더가 PM 역할 수행
- ✅ 채팅방 생성 시 전담 빌더 정보 자동 연결
- ✅ 일관된 서비스 경험 제공

#### ⏳ Step 3: 관리자 빌더 변경 시스템 (미완료)
- [ ] 관리자 페이지에서 사용자별 담당 빌더 변경 기능
- [ ] 빌더 변경 시 기존 채팅 히스토리 유지
- [ ] 새로운 빌더 배정 시 채팅방 참여자 업데이트
- [ ] "새로운 담당 빌더가 배정되었습니다" 시스템 메시지 자동 추가

### 관련 파일들 (현재 구현됨)
- ✅ `src/types/userProfile.ts` - `AssignedBuilder` 타입 정의
- ✅ `src/contexts/UserProfileContext.tsx` - 기본 빌더 배정 로직
- ✅ `src/contexts/ChatContext.tsx` - 전담 빌더 연동 채팅 시스템
- ✅ `src/pages/startup/smartMatching/tabs/CustomRecommendation.tsx` - 스마트매칭 채팅
- ✅ `src/pages/startup/buildup/ProjectDetail.tsx` - 프로젝트 채팅 연동

### 향후 관리자 기능 확장 계획
- [ ] **사용자 관리 페이지**: 전체 사용자 목록 및 담당 빌더 현황
- [ ] **빌더 관리 페이지**: 빌더 목록, 담당 사용자 수, 성과 지표
- [ ] **빌더 배정 변경**: 드래그 앤 드롭으로 사용자-빌더 재배정
- [ ] **빌더 성과 대시보드**: 응답률, 만족도, 프로젝트 성공률
- [ ] **자동 배정 알고리즘**: 프로젝트 타입, 빌더 전문분야 매칭
- [ ] **워크로드 밸런싱**: 빌더별 담당 사용자 수 자동 조절

### 관리자 UI 컴포넌트 계획
```typescript
// 향후 구현할 관리자 컴포넌트들
interface AdminBuilderManagement {
  // 빌더 목록 테이블
  BuilderListTable: React.FC;

  // 사용자-빌더 매핑 뷰
  UserBuilderMappingView: React.FC;

  // 빌더 배정 변경 모달
  BuilderAssignmentModal: React.FC<{
    userId: string;
    currentBuilder: AssignedBuilder;
    availableBuilders: AssignedBuilder[];
  }>;

  // 빌더 성과 대시보드
  BuilderPerformanceDashboard: React.FC;
}
```

### 우선순위
- ✅ **완료**: 사용자별 전담 빌더 배정 시스템
- ✅ **완료**: 채팅 시스템 통합
- ⏳ **진행중**: Phase C - 시스템 통합 연동
- 🔄 **다음**: 관리자 빌더 관리 기능

---
*PM 배정 시스템 추가일: 2024-12-17*
*담당자: Claude Code Assistant*