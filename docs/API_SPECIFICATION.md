# 포켓비즈 API 명세서

## 개요
포켓비즈 스타트업 평가 플랫폼의 백엔드 API 명세서입니다.

## Base URL
```
https://api.pocketbiz.com/v1
```

## 인증
모든 API 요청은 Authorization 헤더에 JWT 토큰이 필요합니다.
```
Authorization: Bearer {token}
```

## API 엔드포인트

### 1. 사용자 관리

#### 1.1 회원가입
```
POST /auth/register
```
Request:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "companyName": "스타트업명",
  "sector": "S-1",
  "stage": "A-2"
}
```

#### 1.2 로그인
```
POST /auth/login
```
Request:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
Response:
```json
{
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "company": {
      "name": "스타트업명",
      "sector": "S-1",
      "stage": "A-2"
    }
  }
}
```

### 2. KPI 관리

#### 2.1 KPI 목록 조회
```
GET /kpis?sector={sector}&stage={stage}
```
Response:
```json
{
  "kpis": [
    {
      "kpi_id": "S1-[GO]-01",
      "axis": "GO",
      "title": "고객 문제 정의 수준",
      "question": "고객 문제의 실재성을 증명하기 위해 얼마나 파고들었나요?",
      "input_type": "Rubric",
      "weight": "x3",
      "choices": [
        { "index": 0, "label": "아이디어 내부 논의", "score": 0 },
        { "index": 1, "label": "문제/고객 가설 문서화", "score": 50 },
        { "index": 2, "label": "정성 검증 (잠재고객 20명+ 인터뷰)", "score": 75 },
        { "index": 3, "label": "지불증거/사전가입 확보", "score": 100 }
      ]
    }
  ]
}
```

#### 2.2 KPI 추가 (관리자용)
```
POST /admin/kpis
```
Request:
```json
{
  "kpi_id": "S1-[EC]-01",
  "sector": "S-1",
  "axis": "EC",
  "title": "매출 성장률",
  "question": "최근 3개월 평균 매출 성장률은?",
  "input_type": "Numeric",
  "formula": null,
  "applicable_stages": ["A-2", "A-3", "A-4"],
  "stage_rules": {
    "A-2": {
      "weight": "x2",
      "min": 0,
      "max": 50,
      "unit": "%"
    }
  }
}
```

#### 2.3 KPI 수정 (관리자용)
```
PUT /admin/kpis/{kpi_id}
```

#### 2.4 KPI 삭제 (관리자용)
```
DELETE /admin/kpis/{kpi_id}
```

### 3. 평가 관리

#### 3.1 평가 시작
```
POST /assessments
```
Response:
```json
{
  "assessment_id": "assess_123",
  "company_id": "company_123",
  "quarter": "2025Q1",
  "stage": "A-2",
  "status": "in_progress",
  "created_at": "2025-01-09T10:00:00Z"
}
```

#### 3.2 평가 응답 저장
```
PUT /assessments/{assessment_id}/responses
```
Request:
```json
{
  "responses": [
    {
      "kpi_id": "S1-[GO]-01",
      "raw": { "selectedIndex": 2 },
      "status": "valid"
    },
    {
      "kpi_id": "S1-[GO]-04",
      "raw": { "value": 1200 },
      "status": "valid"
    }
  ]
}
```

#### 3.3 평가 결과 조회
```
GET /assessments/{assessment_id}/results
```
Response:
```json
{
  "assessment_id": "assess_123",
  "status": "completed",
  "scores": {
    "total": 75.5,
    "grade": "B+",
    "axes": {
      "GO": 72,
      "EC": 68,
      "PT": 80,
      "PF": 75,
      "TO": 82
    }
  },
  "insights": [
    {
      "type": "strength",
      "axis": "TO",
      "title": "우수한 팀 구성",
      "description": "핵심 인재 확보와 조직 문화가 잘 구축되어 있습니다."
    }
  ],
  "benchmarks": {
    "peer_avg": { "GO": 65, "EC": 68, "PT": 62, "PF": 70, "TO": 66 },
    "top10": { "GO": 80, "EC": 82, "PT": 78, "PF": 85, "TO": 80 }
  }
}
```

#### 3.4 평가 히스토리 조회
```
GET /assessments/history?company_id={company_id}
```

### 4. 벤치마킹 데이터

#### 4.1 업종별 평균 조회
```
GET /benchmarks/industry/{sector}/{stage}
```
Response:
```json
{
  "sector": "S-1",
  "stage": "A-2",
  "sample_size": 142,
  "averages": {
    "GO": 65,
    "EC": 68,
    "PT": 62,
    "PF": 70,
    "TO": 66
  },
  "percentiles": {
    "p10": { "GO": 45, "EC": 48, "PT": 42, "PF": 50, "TO": 46 },
    "p25": { "GO": 55, "EC": 58, "PT": 52, "PF": 60, "TO": 56 },
    "p50": { "GO": 65, "EC": 68, "PT": 62, "PF": 70, "TO": 66 },
    "p75": { "GO": 75, "EC": 78, "PT": 72, "PF": 80, "TO": 76 },
    "p90": { "GO": 85, "EC": 88, "PT": 82, "PF": 90, "TO": 86 }
  }
}
```

### 5. 리포트 생성

#### 5.1 PDF 리포트 생성
```
POST /reports/pdf
```
Request:
```json
{
  "assessment_id": "assess_123",
  "include_benchmarks": true,
  "include_insights": true,
  "include_action_plan": true
}
```
Response:
```json
{
  "report_url": "https://storage.pocketbiz.com/reports/report_123.pdf",
  "expires_at": "2025-01-10T10:00:00Z"
}
```

### 6. 관리자 대시보드

#### 6.1 전체 통계 조회 (관리자용)
```
GET /admin/statistics
```
Response:
```json
{
  "total_companies": 523,
  "total_assessments": 1842,
  "active_users": 298,
  "average_scores_by_stage": {
    "A-1": { "GO": 45, "EC": 42, "PT": 48, "PF": 40, "TO": 50 },
    "A-2": { "GO": 65, "EC": 68, "PT": 62, "PF": 70, "TO": 66 },
    "A-3": { "GO": 75, "EC": 78, "PT": 72, "PF": 80, "TO": 76 }
  }
}
```

## 에러 응답
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값이 올바르지 않습니다.",
    "details": {
      "field": "email",
      "reason": "이미 사용중인 이메일입니다."
    }
  }
}
```

## 에러 코드
- `UNAUTHORIZED` - 인증 실패
- `FORBIDDEN` - 권한 없음
- `NOT_FOUND` - 리소스를 찾을 수 없음
- `VALIDATION_ERROR` - 입력값 검증 실패
- `INTERNAL_ERROR` - 서버 내부 오류