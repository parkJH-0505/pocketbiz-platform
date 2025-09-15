# Iteration 19: 스마트 매칭 - 로드맵 기반 성장 네비게이터

> 생성일: 2025-01-15
> MASTER_PLAN.md Phase 6 기준
> 전면 재설계: 레이더 매칭 → 로드맵 기반 액션 가이드

## 🎯 목표
**"개인 전략 컨설턴트가 큐레이션하는 맞춤 기회"** - 생각할 필요 없이 따라가기만 하면 되는 액션 가이드

## 📋 핵심 설계 철학

### 철학적 전환
- **기존**: "어떤 프로그램이 좋을까?" (선택의 고민)
- **신규**: "지금 이것을 하세요" (실행의 집중)

### 3탭 구조
```tsx
<SmartMatchingTab>
  🎯 지금 액션      // 로드맵 기반 최적 액션 1개 (THE ONE)
  🔄 진행 현황      // 진행 중인 프로그램 실시간 추적
  📅 향후 파이프라인 // 3-6개월 미래 기회 예고
</SmartMatchingTab>
```

## 📐 1. "지금 액션" 탭 설계

### 화면 구성
```tsx
<NowActionTab>
  {/* 로드맵 컨텍스트 */}
  <RoadmapContext>
    <CurrentQuarter>Q1 2024 목표</CurrentQuarter>
    <QuarterGoal>Series A 준비 완료</QuarterGoal>
    <Progress>73% 달성</Progress>
  </RoadmapContext>

  {/* 알림 설정 버튼 (통합) */}
  <NotificationButton>
    🔔 맞춤형 이벤트 알림 설정하기
  </NotificationButton>

  {/* THE ONE 액션 */}
  <PrimaryAction>
    <ActionHeader>
      김대표님의 다음 액션 (Q1 목표 달성용)
    </ActionHeader>

    <ActionCard>
      <ProgramName>🎯 TIPS 프로그램 지원</ProgramName>

      {/* 왜 지금인가? */}
      <WhyNow>
        📅 마감까지 28일 (지금 시작 필수)
        📊 현재 매출 성장률 평가 기준 충족
        🏢 동일 단계 3개 기업 TIPS 후 성공
      </WhyNow>

      {/* 체크리스트 매칭 */}
      <MatchingChecklist>
        ✅ Series A 단계 적합
        ✅ 헬스케어 우대 섹터
        ✅ 매출 10억 달성
        ⚠️ 특허 1건 보완 필요
      </MatchingChecklist>

      {/* 3주 준비 로드맵 */}
      <PreparationRoadmap>
        <Week1>사업계획서 업데이트 (2일)</Week1>
        <Week2>기술 증빙 자료 (2일)</Week2>
        <Week3>최종 검토 및 제출 (3일)</Week3>
      </PreparationRoadmap>

      {/* 기대 효과 */}
      <ExpectedImpact>
        📈 로드맵 기여: GO축 +12점
        💰 자금 확보: 최대 5억원
        🚀 Series A 준비: 6개월 단축
      </ExpectedImpact>

      {/* CTA */}
      <ActionButtons>
        <DetailButton>3주 상세 로드맵 보기</DetailButton>
        <StartButton>300만원으로 컨설팅 시작</StartButton>
      </ActionButtons>
    </ActionCard>
  </PrimaryAction>

  {/* 대안 액션 (접힌 상태) */}
  <AlternativeActions collapsed>
    다른 기회도 있어요 (2개) ▼
  </AlternativeActions>
</NowActionTab>
```

## 📐 2. "진행 현황" 탭 설계

### 화면 구성
```tsx
<ProgressTab>
  {/* 요약 카드 */}
  <ProgressSummary>
    <Card>2개 진행중</Card>
    <Card>1개 대기중</Card>
    <Card>3개 완료</Card>
  </ProgressSummary>

  {/* 진행 중 프로그램 */}
  <ActivePrograms>
    <ProgramProgress>
      <Header>
        🔄 TIPS 프로그램 | D-12
      </Header>
      <ProgressBar>60%</ProgressBar>

      <TaskBreakdown>
        <Completed>
          ✅ 사업계획서 업데이트
          ✅ 재무제표 3개년 준비
        </Completed>

        <Current>
          🔄 재무모델링 작업 (3일 예상)
        </Current>

        <Upcoming>
          ⏰ PM 멘토링 예약 필요
          ⏰ 모의 PT 준비
        </Upcoming>
      </TaskBreakdown>

      {/* 막힌 부분 */}
      <BlockedItem>
        ⚠️ 특허 출원 전략 필요
        <Solution>
          IP 전략 컨설턴트
          <Button>포켓빌더에서 찾기 →</Button>
        </Solution>
      </BlockedItem>
    </ProgramProgress>
  </ActivePrograms>
</ProgressTab>
```

## 📐 3. "향후 파이프라인" 탭 설계

### 화면 구성
```tsx
<PipelineTab>
  {/* 로드맵 타임라인 */}
  <RoadmapTimeline>
    <Q1>Series A 준비 (73%)</Q1>
    <Q2>해외 진출</Q2>
    <Q3>Series A 완료</Q3>
  </RoadmapTimeline>

  {/* Q2 파이프라인 */}
  <QuarterPipeline quarter="Q2">
    <Condition>Q1 목표 달성 시 진행</Condition>

    <OpportunityCard>
      🌍 K-Startup 글로벌 프로그램

      <Prerequisites>
        📄 영문 IR 덱 제작
        🔍 타겟 시장 조사
        💼 현지 파트너 탐색
      </Prerequisites>

      <EarlyAction>
        지금 준비 가능:
        <Button>영문 IR 덱 템플릿 받기</Button>
      </EarlyAction>
    </OpportunityCard>
  </QuarterPipeline>

  {/* 시나리오 플래닝 */}
  <ScenarioPlanning>
    <Scenario>
      Q1 매출 목표 미달 시 → 브릿지 투자 먼저
    </Scenario>
    <Scenario>
      TIPS 탈락 시 → 창업도약패키지 재도전
    </Scenario>
  </ScenarioPlanning>
</PipelineTab>
```

## 🔧 핵심 기능 구현

### 로드맵 기반 매칭 엔진
```typescript
interface RoadmapBasedMatching {
  // 현재 로드맵 분석
  analyzeRoadmap: (profile: StartupProfile) => {
    currentQuarter: Quarter;
    quarterGoal: string;
    progress: number;
    criticalGaps: Gap[];
  };

  // 최적 액션 선정 (THE ONE)
  selectOptimalAction: (roadmap: Roadmap, programs: Program[]) => {
    primary: Program;        // 단 1개만
    alternatives: Program[]; // 접힌 상태로 2-3개
    reason: string;         // 선정 근거
  };

  // 체크리스트 매칭 (확률 제거)
  checklistMatching: (profile: StartupProfile, program: Program) => {
    passed: string[];    // "Series A 적합"
    failed: string[];    // "매출 10억 필요"
    optional: string[];  // "특허 보유 우대"
  };
}
```

### 알림 시스템 (모달 통합)
```typescript
interface NotificationSystem {
  // 알림 설정 (지금 액션 탭 내 모달)
  modal: {
    quickSettings: boolean[];  // 새 매칭, 마감 알림, 주간 리포트
    channels: {
      email: { enabled: boolean; address: string; };
      sms: { enabled: boolean; number: string; };
    };
    categories: string[];     // 관심 분야
    keywords: string[];       // 커스텀 키워드
  };

  // 발송 로직
  triggers: {
    newOptimalAction: () => void;
    deadlineApproaching: (days: number) => void;
    progressUpdate: () => void;
  };
}
```

## 🗓️ 구현 로드맵 (4 Phase / 20일)

### Phase 1: 기본 구조 + 알림 UI (4일) ✅ **완료**
**목표**: 3탭 구조와 알림 설정 모달

- [x] 3개 탭 네비게이션 구현
- [x] 로드맵 컨텍스트 컴포넌트 (군집별 마일스톤 기반)
- [x] "지금 액션" 기본 레이아웃
- [x] 알림 설정 모달 UI 및 상태 관리
- [x] NotificationSettings localStorage 저장

**✨ 추가 완료: 군집별 마일스톤 시스템**
- [x] 섹터 x 성장단계 매트릭스 (6개 섹터 x 4개 스테이지)
- [x] 기본 마일스톤 템플릿 (`defaultMilestones.ts`)
- [x] 체크리스트 기반 로드맵 컨텍스트 (블러핑 제거)
- [x] 관리자/빌더 환경 커스텀 마일스톤 수정 구조 준비

**주요 컴포넌트**:
```typescript
const SmartMatchingTab = () => {
  const [activeTab, setActiveTab] = useState('now');
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  return (
    <TabContainer>
      <TabNav />
      {activeTab === 'now' && <NowActionTab />}
      {showNotificationModal && <NotificationModal />}
    </TabContainer>
  );
};
```

### Phase 2: 로드맵 매칭 엔진 (5일)
**목표**: Stage 패턴 기반 최적 액션 선정

- [ ] 로드맵 분석 로직 (현재 분기 목표)
- [ ] Stage 패턴 매칭 구현
- [ ] 체크리스트 매칭 함수
- [ ] 우선순위 계산 (로드맵 기여도 40% + 긴급도 30% + 적합도 30%)
- [ ] THE ONE 선정 + 대안 필터링

**핵심 알고리즘**:
```typescript
const selectOptimalAction = (profile, roadmap, programs) => {
  // 1. 현재 분기 목표 분석
  const quarterGoal = roadmap.quarters[currentQuarter].goal;

  // 2. Stage 패턴 필터링
  const filtered = programs.filter(p =>
    p.requirements.stage.includes(profile.stage)
  );

  // 3. 로드맵 기여도 계산
  const withScore = filtered.map(p => ({
    program: p,
    contribution: calculateRoadmapContribution(p, quarterGoal),
    urgency: calculateUrgency(p.deadline),
    fitness: checklistMatching(profile, p).score
  }));

  // 4. 우선순위 계산 및 정렬
  const scored = withScore.map(item => ({
    ...item,
    priority: (item.contribution * 0.4) +
              (item.urgency * 0.3) +
              (item.fitness * 0.3)
  }));

  return {
    primary: scored[0],      // THE ONE
    alternatives: scored.slice(1, 3)
  };
};
```

### Phase 3: 진행 관리 시스템 (5일)
**목표**: 진행 현황 추적 및 관리

- [ ] 진행 현황 탭 UI
- [ ] 프로그램별 상태 관리 시스템
- [ ] 태스크 체크리스트 자동 업데이트
- [ ] 진행률 자동 계산
- [ ] 막힌 부분 감지 및 포켓빌더 연계

**데이터 구조**:
```typescript
interface ProgramProgress {
  programId: string;
  status: 'preparing' | 'active' | 'waiting' | 'completed';

  tasks: {
    total: number;
    completed: Task[];
    current: Task | null;
    upcoming: Task[];
  };

  progress: {
    percentage: number;
    lastUpdated: Date;
    estimatedCompletion: Date;
  };

  blockers?: {
    issue: string;
    expertNeeded?: string; // 포켓빌더 연계
    suggestedSolution: string;
  }[];
}
```

### Phase 4: 파이프라인 + 알림 발송 (6일)
**목표**: 미래 계획 및 실제 알림 발송

- [ ] 향후 파이프라인 탭 UI
- [ ] 분기별 로드맵 시각화
- [ ] 시나리오 플래닝 로직
- [ ] 조건부 파이프라인 생성
- [ ] 이메일/SMS 발송 API 연동
- [ ] 알림 스케줄러 (D-30, D-14, D-7)

**파이프라인 생성**:
```typescript
const generatePipeline = (roadmap, profile) => {
  const pipeline = { Q2: [], Q3: [], Q4: [] };

  Object.keys(pipeline).forEach(quarter => {
    const quarterGoal = roadmap.quarters[quarter].goal;
    const prerequisites = roadmap.quarters[quarter].prerequisites;

    if (checkPrerequisites(profile, prerequisites)) {
      pipeline[quarter] = findMatchingPrograms(quarterGoal);
    } else {
      pipeline[quarter] = [{
        type: 'preparation',
        message: `먼저 ${prerequisites.join(', ')} 달성 필요`
      }];
    }
  });

  return pipeline;
};
```

## 📊 성공 지표

### 정량 지표
- **의사결정 시간**: 10분 → 2분 (80% 단축)
- **알림 설정 완료율**: 60%+
- **진행 현황 주간 확인율**: 80%+
- **프로그램 지원 전환율**: 25%+
- **포켓빌더 연계율**: 15%+

### 정성 지표
- **"지금 뭘 해야 할지 명확하다"**: 90%+
- **"놓칠 뻔한 기회를 잡았다"**: 80%+
- **"준비해야 할 것이 구체적이다"**: 85%+

## 🏗️ 군집별 마일스톤 시스템 상세

### 마일스톤 템플릿 구조
```typescript
// 6개 섹터 x 4개 성장단계 매트릭스
type Sector = 'healthcare' | 'fintech' | 'ecommerce' | 'saas' | 'hardware' | 'biotech';
type Stage = 'pre-seed' | 'seed' | 'series-a' | 'series-b';

interface StageTemplate {
  stage: Stage;
  stageLabel: string;
  goalDescription: string;
  milestones: {
    completed: Milestone[];    // 완료된 마일스톤
    inProgress: Milestone[];   // 진행 중인 마일스톤
    pending: Milestone[];      // 예정된 마일스톤
  };
}
```

### 기본 마일스톤 예시 (헬스케어 Series A)
```typescript
const healthcareSeriesA = {
  goalDescription: '스케일업 준비 및 Series A 투자 유치',
  milestones: {
    completed: [
      '💼 Series A 스테이지 진입',
      '💰 매출 10억 달성',
      '👥 핵심 팀 구성 완료'
    ],
    inProgress: [
      '🎯 Series A 준비 프로세스',
      '📊 재무모델링 정교화'
    ],
    pending: [
      '💼 Series A 투자자 접촉',
      '🌍 해외 진출 준비'
    ]
  }
};
```

### 커스텀 마일스톤 관리 시스템
```typescript
interface CustomMilestoneSystem {
  // 관리자 환경에서 고객사별 마일스톤 커스텀
  admin: {
    selectTemplate: (sector: Sector, stage: Stage) => StageTemplate;
    customizeForClient: (clientId: string, template: StageTemplate) => void;
    trackProgress: (clientId: string) => MilestoneProgress;
  };

  // 포켓빌더 환경에서 실시간 수정
  builder: {
    updateMilestone: (milestoneId: string, status: 'completed' | 'inProgress' | 'pending') => void;
    addCustomMilestone: (clientId: string, milestone: Milestone) => void;
    generateActionItems: (milestone: Milestone) => ActionItem[];
  };
}
```

### 로드맵 연결 로직
```typescript
const connectToRoadmap = (milestones: StageTemplate, currentGoal: string) => {
  // 1. 현재 분기 목표와 마일스톤 매핑
  const relevantMilestones = milestones.milestones.inProgress.filter(
    milestone => milestone.category === getGoalCategory(currentGoal)
  );

  // 2. 다음 액션 우선순위 계산
  const nextActions = prioritizeActions(relevantMilestones, currentGoal);

  // 3. THE ONE 액션 선정
  return {
    primaryAction: nextActions[0],
    context: {
      quarterGoal: currentGoal,
      completedCount: milestones.milestones.completed.length,
      totalCount: getTotalMilestones(milestones)
    }
  };
};
```

## 🔗 연관 작업
- **MASTER_PLAN.md Phase 6**: 스마트 매칭 전면 재설계
- **Sprint 8**: 기본 매칭 엔진 (참고용)
- **iteration-14**: 레이더 매칭 (대체됨)
- **포켓빌드업**: 즉시 액션 연결
- **군집별 마일스톤**: 섹터/성장단계별 기본 템플릿 제공

## 🎯 최종 목표
스마트 매칭이 **"수백 개 프로그램의 바다"**가 아닌 **"나만의 맞춤 큐레이션 서비스"**로 완성되며, **군집별 기본 마일스톤**을 통해 목표 설정 없이도 **즉시 사용 가능한 로드맵 기반 가이드** 제공