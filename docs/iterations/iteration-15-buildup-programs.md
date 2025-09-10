# Iteration 15: 빌드업 프로그램 연계 (수익화)

> 최종 업데이트: 2025-09-10

## 목표
레이더 갭 분석을 기반으로 맞춤형 빌드업 프로그램을 추천하고 판매하는 시스템 구축

## 작업 범위

### 1. 빌드업 프로그램 데이터 모델

```typescript
interface BuildupProgram {
  id: string;
  name: string;
  description: string;
  
  // 대상 축
  targetAxis: AxisKey | AxisKey[];
  expectedImprovement: number; // 예상 점수 향상
  
  // 프로그램 정보
  duration: string; // "2주", "1개월"
  format: 'online' | 'offline' | 'hybrid';
  instructor: string;
  curriculum: string[];
  
  // 가격 정책
  pricing: {
    regular: number;
    urgent: number; // D-30 이내 프리미엄
    package: number; // 패키지 할인가
  };
  
  // 효과 추적
  metrics: {
    completionRate: number;
    avgImprovement: number;
    successStories: number;
  };
}
```

### 2. 개선 솔루션 추천 엔진

#### 갭 기반 추천 알고리즘
```typescript
const recommendSolutions = (
  gaps: GapAnalysis,
  deadline: Date
) => {
  const solutions = [];
  
  // 1. 긴급도 계산
  const urgency = calculateUrgency(deadline);
  
  // 2. 축별 솔루션 매칭
  for (const [axis, gap] of Object.entries(gaps)) {
    if (gap < 0) {
      const programs = findProgramsForAxis(axis);
      solutions.push({
        program: selectBestProgram(programs, gap, urgency),
        priority: calculatePriority(gap, urgency),
        roi: calculateROI(gap, program.price)
      });
    }
  }
  
  // 3. 패키지 구성
  if (solutions.length > 2) {
    solutions.push(createPackageOffer(solutions));
  }
  
  return solutions.sort((a, b) => b.priority - a.priority);
};
```

### 3. 관리자 기능

#### 빌드업 프로그램 관리
- [ ] 프로그램 CRUD
  - 기본 정보 입력
  - 커리큘럼 관리
  - 강사 배정

- [ ] 가격 정책 설정
  - 일반/긴급/패키지 가격
  - 할인 정책
  - 프로모션 관리

- [ ] 효과 추적
  - 수강 전후 점수 비교
  - 완주율 모니터링
  - ROI 분석

### 4. 사용자 UI

#### 개선 솔루션 섹션 (프로그램 상세 모달)
```jsx
<ImprovementSection>
  <GapSummary>
    PF축 15점 부족 | 예상 개선 기간: 2주
  </GapSummary>
  
  <RecommendedPrograms>
    <ProgramCard priority="high">
      <Title>IR 피칭덱 전문 컨설팅</Title>
      <Duration>2주 집중 과정</Duration>
      <ExpectedResult>+20점 향상</ExpectedResult>
      <Price>
        {isUrgent ? 
          <UrgentPrice>450만원</UrgentPrice> :
          <RegularPrice>300만원</RegularPrice>
        }
      </Price>
      <CTA>지원 전 필수 개선</CTA>
    </ProgramCard>
  </RecommendedPrograms>
  
  <PackageOffer>
    <Title>종합 빌드업 패키지</Title>
    <Programs>PF + GO 동시 개선</Programs>
    <Discount>20% 할인</Discount>
    <CTA>패키지로 한 번에 해결</CTA>
  </PackageOffer>
</ImprovementSection>
```

#### 빌드업 프로그램 탭 (신규)
- [ ] 축별 프로그램 카탈로그
- [ ] 성공 사례 & 후기
- [ ] 프로그램 비교 테이블
- [ ] 1:1 상담 신청

### 5. 세일즈 퍼널 최적화

#### 전환 포인트
1. **진단 완료** → "개선 가능한 영역 발견"
2. **프로그램 매칭** → "15점만 개선하면 지원 가능"
3. **갭 분석** → "2주 집중 컨설팅으로 해결"
4. **긴급성 강조** → "D-14, 지금 시작해야 가능"

#### CTA 최적화
```typescript
const getCTA = (matchRate, daysToDeadline, gap) => {
  if (daysToDeadline < 30 && gap < 20) {
    return {
      text: "긴급 컨설팅 신청",
      color: "red",
      pricing: "urgent"
    };
  }
  if (matchRate > 60) {
    return {
      text: "개선 프로그램 시작",
      color: "orange",
      pricing: "regular"
    };
  }
  return {
    text: "장기 빌드업 상담",
    color: "blue",
    pricing: "package"
  };
};
```

### 6. 수익 모델 구현

#### 가격 차별화
- **긴급 (D-30 이내)**: 정가의 150%
- **일반**: 정가
- **패키지 (3개 이상)**: 20% 할인
- **구독 모델**: 월간 모니터링 & 코칭

#### 결제 프로세스
- [ ] 견적서 자동 생성
- [ ] 온라인 결제 연동
- [ ] 계약서 관리
- [ ] 인보이스 발행

### 7. 성과 추적

- [ ] 프로그램별 매출 대시보드
- [ ] 전환율 분석 (진단→매칭→구매)
- [ ] 고객 LTV 계산
- [ ] 재구매율 추적

## 예상 일정
- Week 1: 데이터 모델 & 추천 엔진
- Week 2: 관리자 UI 구현
- Week 3: 사용자 UI & 세일즈 퍼널
- Week 4: 결제 시스템 & 분석

## 성공 기준
- [ ] 진단→구매 전환율 10% 이상
- [ ] 평균 객단가 300만원 이상
- [ ] 프로그램 완주율 80% 이상
- [ ] 점수 개선 달성률 90% 이상

## 수익 목표
- Month 1: 10개 기업 × 300만원 = 3,000만원
- Month 3: 30개 기업 × 350만원 = 10,500만원
- Month 6: 50개 기업 × 400만원 = 20,000만원