# 포켓비즈 KPI 시스템 사용 가이드

## CSV 기반 KPI 관리 시스템

### 개요
포켓비즈는 CSV 파일을 기반으로 KPI를 관리하는 시스템입니다. CSV 파일을 수정하면 대시보드에 자동으로 반영됩니다.

### CSV 파일 구조

#### 1. KPI Library (S1_GO_KPI_Library_Structured__KPI_Library.csv)
- **kpi_id**: KPI 고유 식별자
- **sector**: 섹터 (예: S-1)
- **axis**: 축 (GO, EC, PT, PF, TO)
- **name**: KPI 이름
- **question**: 평가 질문
- **input_type**: 입력 타입 (Numeric, Rubric, Stage, Calculation, MultiSelect, Checklist)
- **formula**: 계산식 (Calculation 타입용)
- **applicable_stages**: 적용 단계 (예: "A-1,A-2,A-3")
- **input_fields**: 입력 필드 키

#### 2. Stage Rules (S1_GO_KPI_Library_Structured__KPI_StageRules.csv)
- **kpi_id**: KPI 고유 식별자
- **stage**: 단계 (A-1 ~ A-5)
- **weight**: 가중치 (x1, x2, x3)
- **ruleset_text**: 규칙 텍스트 (선택지, 점수 범위 등)

#### 3. KPI Inputs (S1_GO_KPI_Library_Structured__KPI_Inputs.csv)
- **kpi_id**: KPI 고유 식별자
- **field_key**: 입력 필드 키

### 입력 타입별 ruleset_text 작성 방법

#### Numeric (숫자 입력)
```
0점: 100명 미만
100점: 1,000명 이상
```

#### Rubric (단일 선택)
```
1. 아이디어 내부 논의 (0점), 
2. 문제/고객 가설 문서화 (50점),
3. 정성 검증 (잠재고객 20명+ 인터뷰) (75점),
4. 지불증거/사전가입 확보 (100점)
```

#### MultiSelect (다중 선택 - 가중치)
```
1. 해외 대기업(15점), 
2. 국내 대기업(10점), 
3. 공공/교육/연구기관(8점), 
4. 해외 스타트업(5점), 
5. 국내 스타트업(3점), 
6. 해당 없음(0점)
```

### CSV 파일 수정 방법

1. Excel이나 텍스트 에디터로 CSV 파일 열기
2. 필요한 데이터 수정
   - 새 KPI 추가: 새로운 행 추가
   - 기존 KPI 수정: 해당 행 수정
   - KPI 삭제: 해당 행 삭제
3. 파일 저장 (UTF-8 인코딩 권장)

### 실시간 반영 확인

#### 개발 환경
- 파일 저장 후 브라우저에서 새로고침 버튼(↻) 클릭
- 또는 페이지 새로고침 (F5)
- 콘솔에서 "CSV data loaded" 메시지 확인

#### 프로덕션 환경 (예정)
- 파일 업로드 API를 통해 CSV 업데이트
- 자동으로 모든 사용자에게 반영

### 주의사항

1. **CSV 형식 유지**
   - 쉼표(,)로 구분된 필드
   - 여러 줄 텍스트는 큰따옴표(")로 감싸기
   - 큰따옴표 내의 줄바꿈은 유지됨

2. **데이터 일관성**
   - kpi_id는 모든 CSV 파일에서 일치해야 함
   - applicable_stages에 명시된 단계는 StageRules에 규칙이 있어야 함
   - input_fields에 명시된 필드는 KPI_Inputs에 정의되어야 함

3. **가중치 시스템**
   - x1: 기본 가중치
   - x2: 2배 가중치 (중요)
   - x3: 3배 가중치 (매우 중요)

### 예시: 새 KPI 추가하기

1. **KPI_Library.csv에 추가**
```csv
S1-[GO]-16,S-1,GO,시장 점유율,현재 목표 시장에서의 점유율은?,Numeric,input: s1_go_16_market_share,"A-3,A-4,A-5",s1_go_16_market_share
```

2. **StageRules.csv에 규칙 추가**
```csv
S1-[GO]-16,A-3,x2,"0점: 1% 미만
100점: 5% 이상"
S1-[GO]-16,A-4,x2,"0점: 3% 미만
100점: 10% 이상"
S1-[GO]-16,A-5,x1,"0점: 5% 미만
100점: 15% 이상"
```

3. **KPI_Inputs.csv에 필드 추가**
```csv
S1-[GO]-16,s1_go_16_market_share
```

### 문제 해결

#### CSV 데이터가 로드되지 않을 때
1. 브라우저 개발자 콘솔 확인 (F12)
2. "CSV data loaded" 로그 확인
3. 에러 메시지 확인 및 CSV 형식 검토

#### 선택지가 하나만 표시될 때
1. ruleset_text의 형식 확인
2. 각 선택지가 번호로 시작하는지 확인 (예: "1. ", "2. ")
3. 점수가 괄호 안에 있는지 확인 (예: "(50점)")

### 향후 계획

1. **관리자 콘솔 개발**
   - 웹 기반 CSV 편집기
   - 실시간 미리보기
   - 버전 관리

2. **백엔드 통합**
   - PostgreSQL 데이터베이스 연동
   - RESTful API 구현
   - 실시간 동기화

3. **고급 기능**
   - KPI 버전 관리
   - 섹터별 커스터마이징
   - 벤치마킹 데이터 연동