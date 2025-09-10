# 포켓비즈 데이터베이스 스키마

## 테이블 구조

### 1. users (사용자)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user', -- user, admin
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. companies (회사)
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  sector VARCHAR(10) NOT NULL, -- S-1, S-2, etc.
  current_stage VARCHAR(10) NOT NULL, -- A-1, A-2, A-3, A-4, A-5
  founded_date DATE,
  employee_count INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. kpi_library (KPI 정의)
```sql
CREATE TABLE kpi_library (
  kpi_id VARCHAR(20) PRIMARY KEY, -- S1-[GO]-01
  sector VARCHAR(10) NOT NULL,
  axis VARCHAR(2) NOT NULL, -- GO, EC, PT, PF, TO
  title VARCHAR(255) NOT NULL,
  question TEXT NOT NULL,
  input_type VARCHAR(50) NOT NULL, -- Numeric, Calculation, Rubric, Stage, MultiSelect, Checklist
  formula VARCHAR(500),
  applicable_stages TEXT[], -- ['A-1', 'A-2', 'A-3']
  input_fields TEXT[], -- ['s1_go_04_total_users', 's1_go_05_mau']
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_kpi_library_sector_axis ON kpi_library(sector, axis);
CREATE INDEX idx_kpi_library_active ON kpi_library(is_active);
```

### 4. kpi_stage_rules (단계별 규칙)
```sql
CREATE TABLE kpi_stage_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id VARCHAR(20) REFERENCES kpi_library(kpi_id) ON DELETE CASCADE,
  stage VARCHAR(10) NOT NULL, -- A-1, A-2, etc.
  weight VARCHAR(5) NOT NULL, -- x1, x2, x3
  ruleset_json JSONB NOT NULL, -- 선택지, 범위, 검증 규칙 등
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(kpi_id, stage)
);

-- 예시 ruleset_json:
-- Rubric 타입:
-- {
--   "choices": [
--     {"index": 0, "label": "아이디어 내부 논의", "score": 0},
--     {"index": 1, "label": "문제/고객 가설 문서화", "score": 50}
--   ]
-- }
-- Numeric 타입:
-- {
--   "min": 0,
--   "max": 1000,
--   "unit": "명",
--   "minScore": 0,
--   "maxScore": 100
-- }
```

### 5. assessments (평가)
```sql
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  quarter VARCHAR(10) NOT NULL, -- 2025Q1
  stage VARCHAR(10) NOT NULL, -- 평가 당시 단계
  status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed, cancelled
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  total_score DECIMAL(5,2),
  grade VARCHAR(5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_assessments_company_quarter ON assessments(company_id, quarter);
CREATE INDEX idx_assessments_status ON assessments(status);
```

### 6. assessment_responses (평가 응답)
```sql
CREATE TABLE assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  kpi_id VARCHAR(20) REFERENCES kpi_library(kpi_id),
  raw_value JSONB NOT NULL, -- 원시 응답 데이터
  normalized_score DECIMAL(5,2), -- 0-100 정규화된 점수
  weighted_score DECIMAL(5,2), -- 가중치 적용된 점수
  status VARCHAR(20) NOT NULL, -- valid, invalid, na
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(assessment_id, kpi_id)
);

-- 예시 raw_value:
-- Numeric: {"value": 1200, "unit": "명"}
-- Rubric: {"selectedIndex": 2}
-- MultiSelect: {"selectedIndices": [0, 2, 3]}
-- Calculation: {"inputs": {"s1_go_05_mau": 500, "s1_go_04_total_users": 1000}, "calculatedValue": 0.5}
```

### 7. assessment_scores (축별 점수)
```sql
CREATE TABLE assessment_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  axis VARCHAR(2) NOT NULL, -- GO, EC, PT, PF, TO
  score DECIMAL(5,2) NOT NULL, -- 0-100
  percentile INTEGER, -- 동종업계 대비 백분위
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(assessment_id, axis)
);
```

### 8. benchmarks (벤치마킹 데이터)
```sql
CREATE TABLE benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector VARCHAR(10) NOT NULL,
  stage VARCHAR(10) NOT NULL,
  axis VARCHAR(2) NOT NULL,
  metric_type VARCHAR(50) NOT NULL, -- average, p10, p25, p50, p75, p90
  value DECIMAL(5,2) NOT NULL,
  sample_size INTEGER,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sector, stage, axis, metric_type)
);
```

### 9. insights (인사이트)
```sql
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- strength, weakness, opportunity, risk
  axis VARCHAR(2),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  impact VARCHAR(10), -- high, medium, low
  actionable BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 10. action_plans (액션 플랜)
```sql
CREATE TABLE action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  axis VARCHAR(2) NOT NULL,
  priority VARCHAR(10) NOT NULL, -- critical, high, medium, low
  effort VARCHAR(10) NOT NULL, -- low, medium, high
  impact VARCHAR(10) NOT NULL, -- low, medium, high
  timeframe VARCHAR(20), -- 1주, 1개월, 3개월, 6개월
  related_kpis TEXT[], -- KPI ID 배열
  status VARCHAR(20) DEFAULT 'not_started', -- not_started, in_progress, completed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 11. reports (리포트)
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id),
  type VARCHAR(20) NOT NULL, -- pdf, excel
  file_url VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 12. audit_logs (감사 로그)
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL, -- create_kpi, update_kpi, delete_kpi, etc.
  entity_type VARCHAR(50) NOT NULL, -- kpi, assessment, company, etc.
  entity_id VARCHAR(100),
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 인덱스 및 제약조건

```sql
-- 성능 향상을 위한 추가 인덱스
CREATE INDEX idx_assessment_responses_assessment ON assessment_responses(assessment_id);
CREATE INDEX idx_insights_assessment ON insights(assessment_id);
CREATE INDEX idx_action_plans_assessment ON action_plans(assessment_id);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action, created_at);

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_kpi_library_updated_at BEFORE UPDATE ON kpi_library
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 데이터 마이그레이션

```sql
-- CSV 데이터를 데이터베이스로 이관하는 예시
INSERT INTO kpi_library (kpi_id, sector, axis, title, question, input_type, formula, applicable_stages, input_fields)
VALUES 
  ('S1-[GO]-01', 'S-1', 'GO', '고객 문제 정의 수준', 
   '고객 문제의 실재성을 증명하기 위해 얼마나 파고들었나요?', 
   'Rubric', NULL, ARRAY['A-1'], NULL);

INSERT INTO kpi_stage_rules (kpi_id, stage, weight, ruleset_json)
VALUES 
  ('S1-[GO]-01', 'A-1', 'x3', 
   '{"choices": [
     {"index": 0, "label": "아이디어 내부 논의", "score": 0},
     {"index": 1, "label": "문제/고객 가설 문서화", "score": 50},
     {"index": 2, "label": "정성 검증 (잠재고객 20명+ 인터뷰)", "score": 75},
     {"index": 3, "label": "지불증거/사전가입 확보", "score": 100}
   ]}'::jsonb);
```