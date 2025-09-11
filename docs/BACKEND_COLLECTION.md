# BACKEND_COLLECTION.md - 백엔드 시스템 수집

> 작성일: 2025-01-10
> 목적: Sprint 1-18 문서에서 백엔드 관련 모든 내용 취합

## 수집 기준
1. **데이터 모델 & 스키마** - 테이블, 인터페이스, 관계 정의
2. **API & 엔드포인트** - REST/GraphQL, 인증/인가
3. **비즈니스 로직** - 계산 엔진, 알고리즘, 검증 규칙
4. **인프라 & 아키텍처** - DB, 서버리스, 캐싱, 배치
5. **통합 & 연동** - 외부 서비스, Webhook, WebSocket
6. **보안 & 성능** - JWT, RBAC, 암호화, 최적화

---

## Sprint 1-5 백엔드 내용

### Sprint 1: 기본 React 프로젝트 셋업

#### 데이터베이스 설계
- **PostgreSQL + Prisma ORM**
- **핵심 테이블**:
  - KPI_Library (kpi_id, sector, axis, question, input_type, formula)
  - KPI_StageRules (id, kpi_id, stage, weight, choices, applicable)
  - User, Organization, AssessmentRun, KPI_Response, AxisScore

#### 인프라
- Redis 캐싱
- JWT 인증 시스템
- SheetJS 엑셀 데이터 임포트

### Sprint 2: 데이터베이스 및 모델 설계

#### 스코어링 엔진
```typescript
// 6가지 입력 타입 처리
- Numeric: 직접 입력, 범위 검증
- Calculation: 수식 파싱, 변수 참조
- Rubric: 선택값→점수 매핑
- Stage: 단계별 점수
- Checklist: Yes/No 처리
- MultiSelect: 가중 합계
```

#### API 엔드포인트
- POST /api/assessment/create
- PUT /api/assessment/{runId}/kpi
- GET /api/assessment/{runId}/score
- GET /api/kpi/library

### Sprint 3: 사용자 인증 & A×S 분류

#### 인증 시스템
- JWT 토큰 관리
- 이메일 인증
- 비밀번호 재설정
- 역할 기반 접근 제어 (startup/admin/partner)

#### 조직 관리
```typescript
interface CreateOrganizationRequest {
  name: string;
  businessNumber?: string;
  foundedAt?: Date;
  website?: string;
}
```

#### A×S 분류
- **섹터**: S1-S5 (SaaS, Consumer, DeepTech, Healthcare, Commerce)
- **단계**: A1-A5 자동 판정 로직

### Sprint 4: KPI 입력 시스템

#### 실시간 검증
- 타입별 유효성 검사
- 교차 검증 (MAU ≤ 총가입자)
- 디바운스 자동 저장 (1초)

#### 파일 시스템
- S3 증빙 자료 업로드
- 오프라인 지원

### Sprint 5: 결과 시각화

#### 비즈니스 로직
```typescript
interface UpgradeCondition {
  currentStage: string;
  nextStage: string;
  requirements: RequirementCheck[];
  readyToUpgrade: boolean;
}
```

#### 리스크 탐지
- Burn rate 경고
- 성장 정체 신호
- 팀 이탈 위험

---

## Sprint 6-10 백엔드 내용

### Sprint 6: 대시보드 & 히스토리

#### 데이터 모델
```typescript
interface AssessmentHistory {
  runId: string;
  status: 'draft' | 'in_progress' | 'completed';
  overallScore?: number;
}

interface NBARecommendation {
  expectedScore: number;
  roi: number; // 투자 대비 효과
}
```

#### 실시간 기능
- WebSocket (프로그램 남은 자리)
- Polling (점수 변화)
- 캐싱 & 프리페칭

### Sprint 7: 프로그램 관리

#### 프로그램 엔티티
```typescript
interface Program {
  id: string;
  provider: string;
  category: 'government' | 'investment' | 'accelerator' | 'competition';
  status: 'active' | 'closed' | 'upcoming';
}
```

#### 비즈니스 로직
- 자동 상태 업데이트
- 마감 임박 알림
- CSV 일괄 등록

### Sprint 8: 스마트 매칭 엔진

#### 매칭 규칙
```typescript
interface MatchRule {
  type: 'required' | 'preferred' | 'excluded';
  condition: {
    field: string; // 'score.GO', 'kpi.S1-GO-05'
    operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'between';
    value: any;
  };
  weight: number;
}
```

#### 매칭 알고리즘
- A등급: 필수 100% + 선호 70%+
- B등급: 필수 100%
- C등급: 필수 일부 충족
- ML 기반 성공 확률 예측

### Sprint 9: Admin Console

#### 권한 시스템
```typescript
interface AdminUser {
  role: 'super_admin' | 'admin' | 'operator';
  permissions: Permission[];
}

interface Permission {
  resource: 'kpi' | 'program' | 'user' | 'assessment';
  actions: ('create' | 'read' | 'update' | 'delete')[];
}
```

#### KPI 버전 관리
```typescript
interface KPIVersion {
  versionNumber: string; // "1.0.0"
  status: 'draft' | 'published' | 'deprecated';
}
```

### Sprint 10: 검증 & 품질 관리

#### 교차 검증
```typescript
interface CrossValidation {
  rules: {
    source: string; // 'kpi.S1-GO-05'
    target: string; // 'kpi.S1-GO-04'
    operator: 'lt' | 'lte' | 'gt' | 'gte' | 'eq';
    errorMessage: string;
  }[];
  severity: 'error' | 'warning';
}
```

#### 이상치 탐지
- IQR, Z-score, Isolation Forest
- 비즈니스 로직 검증
- 품질 지표 (완성도, 정확도, 일관성)

#### 리포팅
- PDF 생성 (Puppeteer/jsPDF)
- SendGrid/AWS SES 이메일

---

## Sprint 11-18 백엔드 내용

### Sprint 11: Admin 기능

#### CSV 데이터 관리
- KPI 마스터 데이터 (ID, title, description, questions)
- 5×5 매트릭스 (stages×axes)
- 가중치 시스템 (x1, x2, x3)
- 버전 관리 & 롤백

#### 스코어링 엔진 고도화
- 다중 축 점수 계산
- 백분위 순위
- What-if 시뮬레이션
- 벤치마크 비교

### Sprint 12: 파트너 기능

#### 파트너 시스템
- 멀티테넌트 데이터 격리
- 프로그램 CRUD
- 지원자 필터링/검색
- 문서 관리 API

#### AI 매칭
- 스타트업-프로그램 매칭
- 지원자 순위 알고리즘
- ROI 계산
- 성공률 분석

### Sprint 13: 최적화

#### 성능 개선
```typescript
interface StageRules {
  weights: { [axis: string]: number };
  normalization: 'linear' | 'logarithmic' | 'custom';
  validation: ValidationRule[];
}
```

#### 캐싱 전략
- 브라우저 캐싱
- IndexedDB 오프라인 저장
- 데이터 압축
- 증분 로딩

### Sprint 17: KPI 진단 통합

#### 통합 컨텍스트
```typescript
interface KPIDiagnosisContext {
  assessmentData: AssessmentData;
  resultsData: ResultsData;
  analysisData: AnalysisData;
  
  saveAssessment: () => Promise<void>;
  calculateResults: () => Promise<ResultsData>;
  generateAnalysis: () => Promise<AnalysisData>;
}
```

#### 데이터 파이프라인
- Assessment → Results 계산
- Results → Analysis 생성
- Analysis → Benchmark 비교
- Benchmark → ActionPlan 추천

### Sprint 18: 신규 기능

#### 포켓빌드업
```typescript
interface OngoingProject {
  category: 'IR' | 'MVP' | 'Marketing' | 'Legal' | 'Finance';
  progress: number;
  expectedImpact: ImpactMetrics[];
}
```

#### VDR/프로필
```typescript
interface DocumentService {
  upload: FileUploadHandler;
  versioning: VersionControl;
  sharing: ShareManager;
  analytics: ViewTracker;
  security: AccessControl;
}
```

---

## 핵심 백엔드 아키텍처 요약

### 데이터베이스 구조
**주요 테이블**:
- KPI_Library, KPI_StageRules (KPI 정의)
- User, Organization (사용자/조직)
- AssessmentRun, KPI_Response, AxisScore (진단 데이터)
- Program, MatchRule (프로그램 매칭)
- AdminUser, Permission (관리자)
- AuditLog, CrossValidation (품질 관리)

### 핵심 엔진
1. **스코어링 엔진**: 6가지 입력 타입, 가중치 계산, 정규화
2. **매칭 엔진**: 룰 기반 매칭, ML 성공 예측, A/B/C 등급
3. **검증 엔진**: 교차 검증, 이상치 탐지, 비즈니스 룰
4. **분석 엔진**: What-if 시뮬레이션, 벤치마크, 인사이트

### API 구조
- **인증**: JWT 토큰, RBAC, 멀티테넌트
- **진단**: /api/assessment/*, /api/kpi/*
- **프로그램**: /api/program/*, /api/matching/*
- **관리자**: /api/admin/* (보호된 경로)

### 외부 연동
- **파일**: S3 (문서), SheetJS (엑셀)
- **이메일**: SendGrid/AWS SES
- **PDF**: Puppeteer/jsPDF
- **실시간**: WebSocket, SSE

### 성능 최적화
- **캐싱**: Redis, IndexedDB, 브라우저
- **배치**: 대량 처리, 큐 시스템
- **목표**: 
  - 점수 계산 < 500ms
  - 매칭 속도 < 500ms
  - PDF 생성 < 5초
  - 데이터 정확도 > 98%

### 보안 체계
- JWT 기반 인증
- 역할 기반 접근 제어
- 감사 로그 100% 캡처
- 데이터 암호화
- IP 제한 (관리자)

## 다음 단계 제안
1. **데이터베이스 스키마 통합 설계**
2. **API 명세서 작성**
3. **성능 벤치마크 설정**
4. **보안 감사 체크리스트**
5. **외부 서비스 연동 계획**