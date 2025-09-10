# Iteration 16: 사용자 환경 고도화

> 최종 업데이트: 2025-01-10
> PRD v4.0 기반 전면 재설계

## 목표
**"월요일 아침 3분 성장 네비게이션"** - Zero Thinking 대시보드 구현

## 핵심 설계 철학
1. **Zero Thinking**: 생각할 필요 없는 명확한 다음 액션
2. **FOMO & Motivation**: 긴급성과 성취감의 균형
3. **자동 조종 장치**: 선택하게 만들지 않고 따라가게 만드는 환경

## 작업 범위

### 1. 대시보드 전면 재설계 🔴

#### 1.1 내 현재 위치 위젯
```jsx
// 구현 사항
<CurrentPositionWidget>
  <ClusterBadge>S-1/A-3</ClusterBadge>
  <TotalScore>
    <MainScore>72.5</MainScore>
    <WeeklyChange>+2.3 ↑</WeeklyChange>
  </TotalScore>
  <MiniRadarChart 
    width={200} 
    height={200}
    animated={true}
    showChange={true}
  />
</CurrentPositionWidget>
```

**구현 메모:**
- [ ] ClusterContext에서 현재 군집 정보 가져오기
- [ ] 주간 변화율 계산 로직 (localStorage 이전 데이터 활용)
- [ ] Chart.js 미니 레이더 차트 컴포넌트화
- [ ] 실시간 애니메이션 효과 추가

#### 1.2 이번 주 일정 위젯
```jsx
<WeeklyScheduleWidget>
  <ScheduleList>
    {schedules.map(schedule => (
      <ScheduleItem key={schedule.id}>
        <Time>{schedule.time}</Time>
        <Title>{schedule.title}</Title>
        <Badge type={schedule.type}>
          {schedule.type === 'deadline' ? `D-${schedule.daysLeft}` : schedule.type}
        </Badge>
      </ScheduleItem>
    ))}
  </ScheduleList>
</WeeklyScheduleWidget>
```

**데이터 모델:**
```typescript
interface Schedule {
  id: string;
  date: Date;
  time?: string;
  title: string;
  type: 'meeting' | 'deadline' | 'milestone';
  daysLeft?: number;
  relatedProgram?: string;
}
```

**구현 메모:**
- [ ] 일정 데이터 저장 구조 설계
- [ ] 프로그램 마감일 자동 동기화
- [ ] D-Day 카운터 컴포넌트
- [ ] 캘린더 API 연동 준비

#### 1.3 NBA (Next Best Action) 위젯 🔴
```jsx
<NBAWidget>
  <Title>이번 주 추천 미션</Title>
  <ActionCards>
    {recommendations.map(action => (
      <ActionCard key={action.id} priority={action.priority}>
        <ActionTitle>{action.title}</ActionTitle>
        <ExpectedImpact>
          <ScoreIncrease>+{action.expectedScore}점</ScoreIncrease>
          <Duration>{action.duration}</Duration>
          <Cost>{action.cost.toLocaleString()}원</Cost>
        </ExpectedImpact>
        <CTAButton onClick={() => startAction(action)}>
          시작하기
        </CTAButton>
      </ActionCard>
    ))}
  </ActionCards>
</NBAWidget>
```

**추천 알고리즘:**
```typescript
// NBA 추천 로직
function generateNBA(currentScores: AxisScores): NBA[] {
  // 1. 가장 부족한 축 식별
  const weakestAxis = findWeakestAxis(currentScores);
  
  // 2. 개선 효과가 큰 액션 우선순위
  const actions = getActionsForAxis(weakestAxis);
  
  // 3. ROI 계산 (효과/비용)
  return actions
    .map(action => ({
      ...action,
      roi: action.expectedScore / action.cost
    }))
    .sort((a, b) => b.roi - a.roi)
    .slice(0, 3);
}
```

**구현 메모:**
- [ ] NBA 추천 엔진 구현
- [ ] 액션-KPI 개선 매핑 테이블
- [ ] 예상 효과 계산 로직
- [ ] 원클릭 실행 플로우 설계

#### 1.4 추천 프로그램 위젯 (FOMO 트리거) 🔴
```jsx
<RecommendedProgramsWidget>
  <Title>놓치면 후회! 추천 프로그램</Title>
  <ProgramList>
    {programs.map(program => (
      <ProgramCard key={program.id} urgency={program.urgencyLevel}>
        <MatchRate>{program.matchRate}%</MatchRate>
        <ProgramName>{program.name}</ProgramName>
        <UrgencyIndicator>
          {program.urgencyLevel === 'high' && '🔴'}
          {program.urgencyLevel === 'medium' && '🟡'}
          {program.urgencyLevel === 'low' && '🟢'}
          D-{program.daysLeft}
        </UrgencyIndicator>
        <SeatCounter>
          남은 자리: <strong>{program.seatsLeft}명</strong>
        </SeatCounter>
        <QuickApply>바로 지원</QuickApply>
      </ProgramCard>
    ))}
  </ProgramList>
</RecommendedProgramsWidget>
```

**FOMO 요소 구현:**
- [ ] 실시간 남은 자리 카운터
- [ ] 긴급도별 색상 코딩
- [ ] 적합도 계산 로직
- [ ] 알림 트리거 설정

#### 1.5 진행중인 빌드업 위젯
```jsx
<OngoingBuildupsWidget>
  <Title>진행중인 빌드업</Title>
  <ProjectList>
    {projects.map(project => (
      <ProjectItem key={project.id}>
        <ProjectName>{project.name}</ProjectName>
        <ProgressBar value={project.progress} />
        <PMInfo>
          <Avatar src={project.pm.avatar} />
          <PMName>PM: {project.pm.name}</PMName>
        </PMInfo>
        <NextMilestone>
          다음: {project.nextMilestone}
        </NextMilestone>
      </ProjectItem>
    ))}
  </ProjectList>
</OngoingBuildupsWidget>
```

**구현 메모:**
- [ ] 프로젝트 진행률 계산
- [ ] PM 정보 연동
- [ ] 마일스톤 추적 시스템

### 2. 진단 탭 고도화

#### 비교 분석 기능
- [ ] 군집 평균 오버레이
  ```javascript
  <RadarChart>
    <MyRadar />
    <ClusterAverage dash opacity={0.5} />
    <Legend>
      나: 72점 | 군집 평균: 68점 | 상위 20%
    </Legend>
  </RadarChart>
  ```

- [ ] 시계열 분석
  - 과거 6개월 추이
  - 성장률 계산
  - 예측 모델

#### AI 인사이트 강화
- [ ] 강점/약점 자동 분석
- [ ] 개선 우선순위 제시
- [ ] 맞춤형 성장 전략

### 3. 스마트 매칭 탭 개선 🔴

#### 설계 철학
- **개인 맞춤 기회 발견**: "필요없는 것은 필터링, 검토할 만한 것만 추천"
- **시각적 갭 분석**: 레이더 차트 오버레이로 부족 요소 명확화
- **즉시 실행 가능**: 부족 요소 보완 빌드업 즉시 연결

#### 필터 & 우선순위 시스템
```jsx
<SmartMatchingPage>
  <InterestFilter>
    <FilterChip active>정책자금</FilterChip>
    <FilterChip>투자</FilterChip>
    <FilterChip active>R&D</FilterChip>
    <FilterChip>글로벌</FilterChip>
  </InterestFilter>
  
  <MatchedPrograms>
    {filteredPrograms.map(program => (
      <ProgramCard key={program.id}>
        <MatchScore>{program.matchRate}%</MatchScore>
        <ProgramInfo>
          <Name>{program.name}</Name>
          <TypeBadge>{program.supportType}</TypeBadge>
        </ProgramInfo>
        
        <RadarComparison>
          <MiniRadar 
            myScores={currentScores}
            requiredScores={program.requirements}
            showGap={true}
          />
          <GapAnalysis>
            부족: {program.weakestAxis}축 -{program.gapScore}점
          </GapAnalysis>
        </RadarComparison>
        
        <QuickActions>
          <Button variant="primary">지원하기</Button>
          <Button variant="secondary">보완하고 지원</Button>
        </QuickActions>
      </ProgramCard>
    ))}
  </MatchedPrograms>
</SmartMatchingPage>
```

**매칭 알고리즘 v1 (현재):**
```typescript
// S-A 태그 기반 필터링
function filterBySectorStage(programs: Program[]): Program[] {
  return programs.filter(p => 
    p.allowedSectors.includes(currentSector) &&
    p.allowedStages.includes(currentStage)
  );
}

// 관심 유형 가중치 적용
function applyInterestWeight(programs: Program[]): Program[] {
  return programs.map(p => ({
    ...p,
    priority: userInterests.includes(p.type) ? p.priority * 1.5 : p.priority
  }));
}
```

**매칭 알고리즘 v2 (계획):**
```typescript
// 캠페인별 요구 레이더 매핑
interface ProgramRequirements {
  programId: string;
  requiredScores: {
    GO: number;
    EC: number;
    PT: number;
    PF: number;
    TO: number;
  };
}

// 적합도 계산
function calculateMatchRate(
  myScores: AxisScores, 
  required: AxisScores
): number {
  const gaps = Object.keys(required).map(axis => {
    const gap = myScores[axis] - required[axis];
    return gap >= 0 ? 1 : (myScores[axis] / required[axis]);
  });
  
  return (gaps.reduce((a, b) => a + b, 0) / gaps.length) * 100;
}
```

**구현 메모:**
- [ ] S-A 태그 필터링 구현
- [ ] 관심 유형 설정 UI
- [ ] 레이더 오버레이 컴포넌트
- [ ] 군집 평균(80점) 기준선 표시
- [ ] V2: 캠페인별 요구 점수 데이터 구축

### 4. 개선 솔루션 탭 (신규)

#### 맞춤 추천
```jsx
<CustomRecommendations>
  <YourGaps>
    <Gap axis="PF" score={-15} priority="high" />
    <Gap axis="GO" score={-8} priority="medium" />
  </YourGaps>
  
  <RecommendedPath>
    <Step1>
      <Program>IR 컨설팅 (2주)</Program>
      <Impact>PF +20점</Impact>
    </Step1>
    <Step2>
      <Program>성장전략 워크샵 (3일)</Program>
      <Impact>GO +10점</Impact>
    </Step2>
    <Result>
      KB 오픈이노베이션 지원 가능!
    </Result>
  </RecommendedPath>
</CustomRecommendations>
```

#### 프로그램 카탈로그
- [ ] 축별 필터링
- [ ] 기간별 정렬
- [ ] 가격 비교
- [ ] 성공 사례

### 5. 알림 시스템

#### 푸시 알림
- [ ] 새로운 매칭 기회
  "새로운 프로그램이 등록되었습니다. 82% 적합!"
  
- [ ] 마감 임박
  "관심 프로그램 D-7! 지금 준비 시작하세요"
  
- [ ] 점수 변화
  "PF축이 5점 상승했습니다. 새로운 기회를 확인하세요"

#### 이메일 알림
- [ ] 주간 매칭 리포트
- [ ] 월간 성장 리포트
- [ ] 프로그램 마감 리마인더

### 6. 북마크 & 플래닝

#### 관심 프로그램 관리
```typescript
interface Bookmark {
  programId: string;
  addedAt: Date;
  matchRate: number;
  notes: string;
  reminderDate?: Date;
  status: 'interested' | 'preparing' | 'applied';
}
```

#### 지원 플래너
- [ ] 캘린더 뷰
- [ ] 준비 체크리스트
- [ ] 문서 관리
- [ ] 진행 상태 추적

### 7. 모바일 반응형

- [ ] 모바일 레이더 차트
- [ ] 터치 제스처 지원
- [ ] 간소화된 네비게이션
- [ ] 모바일 전용 위젯

## 기술 구현

### 성능 최적화
- [ ] 레이더 차트 캐싱
- [ ] 지연 로딩
- [ ] 가상 스크롤
- [ ] 이미지 최적화

### 사용자 경험
- [ ] 온보딩 투어
- [ ] 툴팁 & 가이드
- [ ] 단축키 지원
- [ ] 다크 모드

## 구현 우선순위

### Phase 1: 핵심 대시보드 (1주) 🔴
1. 5개 핵심 위젯 구현
2. 데이터 연동 및 실시간 업데이트
3. 애니메이션 및 인터랙션

### Phase 2: 스마트 매칭 고도화 (1주) 🔴
1. 필터링 시스템 구현
2. 레이더 오버레이 비교
3. 적합도 계산 엔진

### Phase 3: 네비게이션 개편 (3일) 🟡
1. 메뉴 구조 변경
2. 라우팅 업데이트
3. 페이지 통합

### Phase 4: 신규 페이지 (1주) 🟢
1. 포켓빌드업 페이지
2. VDR/마이프로필 페이지

## 기술 스택 및 구현 전략

### Frontend
```typescript
// 필요한 패키지
- chart.js (레이더 차트)
- framer-motion (애니메이션)
- date-fns (날짜 처리)
- react-hook-form (폼 관리)
```

### 상태 관리
```typescript
// Context 구조
- DashboardContext: 대시보드 위젯 데이터
- MatchingContext: 매칭 필터 및 결과
- ScheduleContext: 일정 관리
- BuildupContext: 빌드업 프로젝트
```

### 데이터 저장
```typescript
// localStorage 구조
{
  'pocketbiz_weekly_scores': WeeklyScores[],
  'pocketbiz_schedules': Schedule[],
  'pocketbiz_interests': InterestType[],
  'pocketbiz_bookmarks': Bookmark[]
}
```

## 성공 지표

### 정량적 지표
- [ ] 대시보드 평균 체류 시간 > 3분
- [ ] NBA 클릭률 > 30%
- [ ] 프로그램 매칭 정확도 > 80%
- [ ] FOMO 트리거 전환율 > 15%

### 정성적 지표
- [ ] "생각할 필요 없이 다음 할 일이 명확하다"
- [ ] "매주 월요일 아침에 꼭 확인하게 된다"
- [ ] "놓치면 안 될 기회를 알려줘서 좋다"

## 개발 체크리스트

### 대시보드
- [ ] CurrentPositionWidget 컴포넌트
- [ ] WeeklyScheduleWidget 컴포넌트
- [ ] NBAWidget 컴포넌트
- [ ] RecommendedProgramsWidget 컴포넌트
- [ ] OngoingBuildupsWidget 컴포넌트
- [ ] 대시보드 레이아웃 구성
- [ ] 위젯 데이터 연동

### 스마트 매칭
- [ ] 필터 UI 구현
- [ ] 매칭 알고리즘 구현
- [ ] 레이더 오버레이 컴포넌트
- [ ] 갭 분석 로직

### 네비게이션
- [ ] 메뉴 아이템 변경
- [ ] 라우팅 경로 수정
- [ ] 리다이렉션 설정

### 테스트
- [ ] 위젯 단위 테스트
- [ ] 매칭 알고리즘 테스트
- [ ] 통합 테스트
- [ ] 성능 테스트