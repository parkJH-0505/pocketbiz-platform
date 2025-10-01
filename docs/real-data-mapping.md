# 실제 데이터 소스 매핑 계획

## 🎯 가짜 데이터 → 실제 데이터 매핑

### **Priority 1: 즉시 연동 가능한 것들**

#### **1. 작업 완료 (tasks-completed-today)**
```typescript
현재: localStorage 수동 입력
대체: BuildupContext의 프로젝트 완료 상태
연동 지점:
- src/contexts/BuildupContext.tsx의 프로젝트 상태 변경
- 프로젝트 마일스톤 달성 이벤트
- 작업 체크리스트 완료 이벤트
```

#### **2. KPI 업데이트 (kpi-updates-today)**
```typescript
현재: localStorage 수동 입력
대체: KPIDiagnosisContext의 응답 업데이트
연동 지점:
- src/contexts/KPIDiagnosisContext.tsx의 updateResponse()
- KPI 진단 페이지에서 실제 입력 시
- 자동으로 카운터 증가
```

#### **3. 문서 접근 (documents-accessed-today)**
```typescript
현재: localStorage 수동 입력
대체: VDRContext의 문서 열기/수정 이벤트
연동 지점:
- src/contexts/VDRContext.tsx의 문서 조회/수정
- viewCount, downloadCount 증가 시
- 문서 미리보기/편집 시
```

### **Priority 2: 새로운 시스템 필요한 것들**

#### **4. 목표 설정/달성 (weekly-goal-progress)**
```typescript
현재: 수동 입력
필요: 간단한 목표 설정 시스템
구현 방안:
- 주간 목표 설정 모달
- 목표 달성률 자동 계산
- localStorage: 'weekly-goals-{date}'
```

#### **5. 프로젝트 마일스톤 (milestones-completed-today)**
```typescript
현재: 수동 입력
대체: BuildupContext 프로젝트 진행률 연동
연동 지점:
- 프로젝트 phase transition 이벤트
- 주요 deliverable 완료 시
- 미팅 완료 후 진행 상태 업데이트
```

### **Priority 3: 간소화하거나 제거할 것들**

#### **6. 품질/효율성 점수들**
```typescript
제거 대상:
- work-quality-score (고정값 70)
- efficiency-score (고정값 70)
- outcome-impact-score (고정값 60)

대체 방안:
- KPI 점수 자체를 품질 지표로 활용
- 작업 완료 속도를 효율성으로 측정
- 실제 측정 어려운 추상적 지표 제거
```

#### **7. 학습 점수 (skill-development-score)**
```typescript
현재: 수동 입력
간소화: 실제 학습 활동 추적이 복잡함
대안: 제거하고 다른 지표로 대체
```

## 🔧 구현 계획

### **Day 2: Priority 1 구현**
1. ✅ KPI 업데이트 자동 추적
2. ✅ 작업 완료 자동 추적
3. ✅ 문서 접근 자동 추적

### **Day 3: Priority 2 구현**
1. ✅ 간단한 목표 설정 시스템
2. ✅ 프로젝트 마일스톤 연동

### **Day 4-5: 실시간 업데이트**
1. ✅ 이벤트 기반 즉시 점수 업데이트
2. ✅ 사용자 액션 시 실시간 피드백

## 📊 예상 결과

### **Before (가짜 데이터)**
```
활동도 점수: 50점 (기본값)
성과 점수: 60점 (고정값)
꾸준함 점수: 30점 (일부 실제)
```

### **After (실제 데이터)**
```
활동도 점수: 85점 (실제 KPI 입력 3회, 문서 5개 접근)
성과 점수: 78점 (KPI 점수 75, 개선도 +3)
꾸준함 점수: 92점 (7일 연속, 주 5일 활동)
```

## 🎯 핵심 원칙

1. **측정 가능한 것만**: 추상적 지표 제거
2. **자동 추적 우선**: 수동 입력 최소화
3. **기존 시스템 활용**: 새로운 복잡성 추가 금지
4. **즉시 피드백**: 사용자 행동과 점수 변화 직결